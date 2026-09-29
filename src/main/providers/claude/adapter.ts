import { query, getSessionInfo, resolveSettings, filterEscalatingDefaultMode, type Options, type Settings, type Query, type SDKMessage, type SDKUserMessage, type PermissionResult } from '@anthropic-ai/claude-agent-sdk';
import { createHash, randomUUID } from 'node:crypto';
import type { ProviderAdapter, ProviderRun, RunInput } from '../types';
import type { Diagnostic, EventBody, ReplyRequest } from '../../../shared/contracts';
import { checkSubscriptionEnvironment, assertClaudeSubscription } from '../../diagnostics/providers';
import { AsyncQueue } from '../queue';
import { ClaudeMessages } from './messages';
import { spawnNativeClaude } from './native';
import { claudePermissionMode } from '../permissions';
type Answer=ReplyRequest['answer'];
type Stamp={lastModified:number;fileSize?:number};
export type ClaudeDeps={query:typeof query;sessionInfo:(sessionId:string,cwd:string)=>Promise<Stamp|undefined>;settings:(cwd:string)=>Promise<Settings>;startupMs:number;idleMs:number;maxIdle:number};
// User plugins and hooks load before the engine answers; measured at ~32 s on a
// managed Windows workstation (6 s without them), so 20 s aborted valid sessions.
const STARTUP_TIMEOUT_MS=90000;
// That startup cost is why a conversation keeps its engine between turns.
// Each idle engine holds a native process, so their number and lifetime are bounded.
const defaults:ClaudeDeps={query,
  // Looked up without `dir`: with a Windows folder the SDK 0.3.283 lookup finds nothing.
  sessionInfo:sessionId=>getSessionInfo(sessionId),
  // Same cascade and trust filter as the CLI, without spawning it.
  settings:async cwd=>filterEscalatingDefaultMode(await resolveSettings({cwd,settingSources:['user','project','local']})),startupMs:STARTUP_TIMEOUT_MS,idleMs:10*60_000,maxIdle:3};
type Turn={
  onMessage(message:SDKMessage):void;onEnd():void;
  ask(requestKind:'approval'|'question',text:string,signal:AbortSignal):Promise<Answer>;
};
class ClaudeEngine {
  turn?:Turn;dead=false;nativeId?:string;stamp?:Stamp;idle?:ReturnType<typeof setTimeout>;
  constructor(readonly runtime:Query,readonly incoming:AsyncQueue<SDKUserMessage>,readonly controller:AbortController,readonly key:string,readonly cwd:string){}
  // One reader for the process lifetime; messages go to the current turn only.
  pump(){void (async()=>{
    try {for await(const message of this.runtime){const id=(message as {session_id?:string}).session_id;if(id)this.nativeId=id;this.turn?.onMessage(message);}}
    catch {}
    finally {this.dead=true;this.turn?.onEnd();}
  })();}
  close(){this.dead=true;if(this.idle)clearTimeout(this.idle);this.incoming.end();this.controller.abort();this.runtime.close();}
}
// The SDK adds CLAUDE_AGENT_SDK_* to the host environment after its first launch.
// Names what the native choices resolve to; the engine still applies its own configuration.
export function describeNative(settings:Settings|undefined,models:NonNullable<Diagnostic['models']>):Pick<Diagnostic,'configuredModel'|'native'> {
  const value=settings?.model??'default';
  // Aliases such as `opus[1m]` select the long-context variant of a listed row.
  const base=value.replace(/\[1m\]$/i,'');const listed=models.find(model=>model.id===value)??models.find(model=>model.id===base);
  const row=listed&&{...listed,name:listed.id===value||base===value?listed.name:`${listed.name} (1M)`};
  const effort=typeof settings?.effortLevel==='string'?settings.effortLevel:undefined;
  return {configuredModel:row?.id,native:{modelName:row?.name??value,effort,permission:settings?.permissions?.defaultMode??'default'}};
}
// Says which step failed, so the banner can suggest the right action.
function diagnosticIssue(error:unknown,timedOut:boolean,startupMs:number):string {
  const code=error instanceof Error?error.message:'';
  if(code==='AUTH_CONFIGURATION_AMBIGUOUS')return 'Une variable de clé API peut sélectionner une facturation API. Retirez-la pour utiliser l’abonnement ; aucune bascule payante n’a été faite.';
  if(code==='SUBSCRIPTION_NOT_CONFIRMED')return 'Claude répond, mais aucun abonnement Pro, Max, Team ou Enterprise n’est confirmé. Connectez-vous dans Claude Code (/login), puis réessayez.';
  if(timedOut)return `Le moteur Claude n’a pas répondu en ${Math.max(1,Math.round(startupMs/1000))} s. Son démarrage peut être long (hooks, antivirus, réseau) : réessayez.`;
  return `Le moteur Claude n’a pas pu confirmer l’abonnement${code?` : « ${code.replace(/\s+/g,' ').slice(0,200)} »`:''}. Vérifiez sa connexion, puis réessayez.`;
}
function engineKey(input:RunInput){
  const env=createHash('sha256').update(JSON.stringify(Object.entries(input.env).filter(([name])=>!name.startsWith('CLAUDE_AGENT_SDK_')).sort(([a],[b])=>a.localeCompare(b)))).digest('hex');
  return JSON.stringify({cwd:input.cwd,choices:input.choices,env});
}
export class ClaudeAdapter implements ProviderAdapter {
  readonly provider='claude' as const;
  private deps:ClaudeDeps;private idle=new Map<string,ClaudeEngine>();
  constructor(deps:Partial<ClaudeDeps>={}){this.deps={...defaults,...deps};}
  async diagnose(cwd:string,env:NodeJS.ProcessEnv=process.env):Promise<Diagnostic> {
    const diagnostic:Diagnostic={provider:'claude',available:false,auth:'missing',issues:[],skills:[]};
    let runtime:Query|undefined;
    const input=new AsyncQueue<SDKUserMessage>();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),this.deps.startupMs);
    try {
      checkSubscriptionEnvironment(env,'claude');
      runtime=this.deps.query({prompt:input,options:{cwd,env,systemPrompt:{type:'preset',preset:'claude_code'},settingSources:['user','project','local'],abortController:controller,spawnClaudeCodeProcess:spawnNativeClaude}});
      const account=await runtime.accountInfo();diagnostic.available=true;assertClaudeSubscription(account);diagnostic.auth='subscription';
      diagnostic.skills=(await runtime.supportedCommands()).map(skill=>({name:skill.name,available:true,evidence:'Commande annoncée par le moteur natif ; invocation à vérifier.'}));
      diagnostic.models=(await runtime.supportedModels()).map(model=>({id:model.value,name:model.displayName,efforts:model.supportedEffortLevels??[],default:false}));
      Object.assign(diagnostic,describeNative(await this.deps.settings(cwd).catch(()=>undefined),diagnostic.models));
    } catch(error) {diagnostic.auth=error instanceof Error&&error.message==='AUTH_CONFIGURATION_AMBIGUOUS'?'ambiguous':'missing';diagnostic.issues.push(diagnosticIssue(error,controller.signal.aborted,this.deps.startupMs));}
    finally {clearTimeout(timeout);input.end();controller.abort();runtime?.close();}
    return diagnostic;
  }
  private async start(input:RunInput,key:string):Promise<ClaudeEngine> {
    const permissionMode=claudePermissionMode(input.choices.permissionProfile);
    const incoming=new AsyncQueue<SDKUserMessage>();
    const controller=new AbortController();
    let engine:ClaudeEngine|undefined;
    const options:Options={cwd:input.cwd,resume:input.nativeId,env:input.env,
      systemPrompt:{type:'preset',preset:'claude_code'},settingSources:['user','project','local'],
      includePartialMessages:true,abortController:controller,
      spawnClaudeCodeProcess:options=>spawnNativeClaude(options,permissionMode!==undefined),
      canUseTool:async(name,args,context):Promise<PermissionResult>=>{
        const turn=engine?.turn;if(!turn)return {behavior:'deny',message:'Aucun tour Lullaby actif.'};
        if(name==='AskUserQuestion'&&Array.isArray(args.questions)) {
          const answers:Record<string,string>={};
          for(const question of args.questions) {
            const answer=await turn.ask('question',`${question.question}\n${(question.options??[]).map((option:any)=>`${option.label} : ${option.description??''}`).join('\n')}`,context.signal);
            if(answer.kind!=='text')return {behavior:'deny',message:'Question interrompue.'};
            answers[question.question]=answer.text;
          }
          return {behavior:'allow',updatedInput:{...args,answers}};
        }
        const answer=await turn.ask('approval',`${name}\n${JSON.stringify(args,null,2)}`,context.signal);
        return answer.kind==='allow'?{behavior:'allow',updatedInput:args}:{behavior:'deny',message:'Action refusée par l’utilisateur.'};
      },
    };
    if(input.choices.model)options.model=input.choices.model;
    if(input.choices.effort) {
      if(!['low','medium','high','xhigh','max'].includes(input.choices.effort))throw new Error('UNSUPPORTED_EFFORT');
      options.effort=input.choices.effort as Options['effort'];
    }
    if(permissionMode!==undefined)options.permissionMode=permissionMode;
    const runtime=this.deps.query({prompt:incoming,options});
    const timeout=setTimeout(()=>controller.abort(),this.deps.startupMs);
    try {assertClaudeSubscription(await runtime.accountInfo());}
    catch(error){incoming.end();controller.abort();runtime.close();throw error;}
    finally {clearTimeout(timeout);}
    engine=new ClaudeEngine(runtime,incoming,controller,key,input.cwd);engine.nativeId=input.nativeId;engine.pump();
    return engine;
  }
  // Reuse only an idle engine whose session file nobody else touched since its last turn.
  private async reusable(input:RunInput,key:string):Promise<ClaudeEngine|undefined> {
    if(!input.nativeId)return;
    const engine=this.idle.get(input.nativeId);if(!engine)return;
    this.idle.delete(input.nativeId);if(engine.idle)clearTimeout(engine.idle);
    const current=await this.deps.sessionInfo(input.nativeId,input.cwd).catch(()=>undefined);
    const unchanged=!!current&&!!engine.stamp&&current.lastModified===engine.stamp.lastModified&&current.fileSize===engine.stamp.fileSize;
    if(engine.key===key&&!engine.dead&&unchanged)return engine;
    engine.close();
  }
  private async park(engine:ClaudeEngine) {
    const id=engine.nativeId!;
    engine.stamp=await this.deps.sessionInfo(id,engine.cwd).catch(()=>undefined);
    if(engine.dead||!engine.stamp){engine.close();return;}
    this.idle.get(id)?.close();this.idle.delete(id);
    engine.idle=setTimeout(()=>{if(this.idle.get(id)===engine)this.idle.delete(id);engine.close();},this.deps.idleMs);
    this.idle.set(id,engine);
    while(this.idle.size>this.deps.maxIdle){const [oldest,evicted]=this.idle.entries().next().value!;this.idle.delete(oldest);evicted.close();}
  }
  async run(input:RunInput):Promise<ProviderRun> {
    checkSubscriptionEnvironment(input.env,'claude');
    const key=engineKey(input);
    const engine=await this.reusable(input,key)??await this.start(input,key);
    const outgoing=new AsyncQueue<{eventId:string;body:EventBody}>();
    const pending=new Map<string,(answer:Answer)=>void>();
    const emit=(body:EventBody)=>outgoing.push({eventId:randomUUID(),body});
    const mapper=new ClaudeMessages();
    let stopped=false,closed=false,completed=false;
    engine.turn={
      onMessage:message=>{
        for(const body of mapper.convert(message))emit(body);
        if(message.type==='result'){completed=message.subtype==='success';engine.turn=undefined;outgoing.end();}
      },
      onEnd:()=>{if(!stopped)emit({kind:'error',code:'CLAUDE_FAILED',message:'Claude a interrompu la connexion. La session peut être reprise.'});outgoing.end();},
      ask:async(requestKind,text,signal)=>{
        if(signal.aborted)return {kind:'deny'};
        const requestId=randomUUID();
        return new Promise(resolve=>{
          const cancel=()=>finish({kind:'deny'});
          const finish=(answer:Answer)=>{pending.delete(requestId);signal.removeEventListener('abort',cancel);resolve(answer);};
          pending.set(requestId,finish);signal.addEventListener('abort',cancel,{once:true});
          emit({kind:'request',requestId,requestKind,text});
        });
      },
    };
    if(engine.dead)engine.turn.onEnd();
    else engine.incoming.push({type:'user',message:{role:'user',content:input.text},parent_tool_use_id:null,session_id:engine.nativeId??''});
    const close=async()=>{
      if(closed)return;closed=true;
      for(const finish of [...pending.values()])finish({kind:'deny'});
      if(engine.turn)engine.turn=undefined;outgoing.end();
      if(completed&&!stopped&&!engine.dead&&engine.nativeId)await this.park(engine);else engine.close();
    };
    return {events:outgoing,
      reply:async(requestId,answer)=>{const finish=pending.get(requestId);if(!finish)throw new Error('STALE_REQUEST');finish(answer);},
      interrupt:async()=>{stopped=true;for(const finish of [...pending.values()])finish({kind:'deny'});await Promise.race([engine.runtime.interrupt().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]);await close();},
      close,
    };
  }
  async dispose(){for(const engine of this.idle.values())engine.close();this.idle.clear();}
}
