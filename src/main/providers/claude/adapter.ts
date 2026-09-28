import { query, type Options, type Query, type SDKUserMessage, type PermissionResult } from '@anthropic-ai/claude-agent-sdk';
import { randomUUID } from 'node:crypto';
import type { ProviderAdapter, ProviderRun, RunInput } from '../types';
import type { Diagnostic, EventBody, ReplyRequest } from '../../../shared/contracts';
import { checkSubscriptionEnvironment, assertClaudeSubscription } from '../../diagnostics/providers';
import { AsyncQueue } from '../queue';
import { ClaudeMessages } from './messages';
import { spawnNativeClaude } from './native';
import { claudePermissionMode } from '../permissions';
type Answer=ReplyRequest['answer'];
export class ClaudeAdapter implements ProviderAdapter {
  readonly provider='claude' as const;
  async diagnose(cwd:string,env:NodeJS.ProcessEnv=process.env):Promise<Diagnostic> {
    const diagnostic:Diagnostic={provider:'claude',available:false,auth:'missing',issues:[],skills:[]};
    let runtime:Query|undefined;
    const input=new AsyncQueue<SDKUserMessage>();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),20000);
    try {
      checkSubscriptionEnvironment(env,'claude');
      runtime=query({prompt:input,options:{cwd,env,systemPrompt:{type:'preset',preset:'claude_code'},settingSources:['user','project','local'],abortController:controller,spawnClaudeCodeProcess:spawnNativeClaude}});
      const account=await runtime.accountInfo();diagnostic.available=true;assertClaudeSubscription(account);diagnostic.auth='subscription';
      diagnostic.skills=(await runtime.supportedCommands()).map(skill=>({name:skill.name,available:true,evidence:'Commande annoncée par le moteur natif ; invocation à vérifier.'}));
      diagnostic.models=(await runtime.supportedModels()).map(model=>({id:model.value,name:model.displayName,efforts:model.supportedEffortLevels??[],default:false}));
    } catch(error) {diagnostic.auth=error instanceof Error&&error.message==='AUTH_CONFIGURATION_AMBIGUOUS'?'ambiguous':'missing';diagnostic.issues.push('Connexion Claude par abonnement non confirmée. Vérifiez la connexion officielle et la configuration.');}
    finally {clearTimeout(timeout);input.end();controller.abort();runtime?.close();}
    return diagnostic;
  }
  async run(input:RunInput):Promise<ProviderRun> {
    checkSubscriptionEnvironment(input.env,'claude');
    const permissionMode=claudePermissionMode(input.choices.permissionProfile);
    const outgoing=new AsyncQueue<{eventId:string;body:EventBody}>();
    const incoming=new AsyncQueue<SDKUserMessage>();
    const controller=new AbortController();
    const pending=new Map<string,(answer:Answer)=>void>();
    const emit=(body:EventBody)=>outgoing.push({eventId:randomUUID(),body});
    async function ask(requestKind:'approval'|'question',text:string,signal:AbortSignal):Promise<Answer> {
      if(signal.aborted)return {kind:'deny'};
      const requestId=randomUUID();
      return new Promise(resolve=>{
        const cancel=()=>finish({kind:'deny'});
        const finish=(answer:Answer)=>{pending.delete(requestId);signal.removeEventListener('abort',cancel);resolve(answer);};
        pending.set(requestId,finish);signal.addEventListener('abort',cancel,{once:true});
        emit({kind:'request',requestId,requestKind,text});
      });
    }
    const options:Options={cwd:input.cwd,resume:input.nativeId,env:input.env,
      systemPrompt:{type:'preset',preset:'claude_code'},settingSources:['user','project','local'],
      includePartialMessages:true,abortController:controller,
      spawnClaudeCodeProcess:options=>spawnNativeClaude(options,permissionMode!==undefined),
      canUseTool:async(name,args,context):Promise<PermissionResult>=>{
        if(name==='AskUserQuestion'&&Array.isArray(args.questions)) {
          const answers:Record<string,string>={};
          for(const question of args.questions) {
            const answer=await ask('question',`${question.question}\n${(question.options??[]).map((option:any)=>`${option.label} : ${option.description??''}`).join('\n')}`,context.signal);
            if(answer.kind!=='text')return {behavior:'deny',message:'Question interrompue.'};
            answers[question.question]=answer.text;
          }
          return {behavior:'allow',updatedInput:{...args,answers}};
        }
        const answer=await ask('approval',`${name}\n${JSON.stringify(args,null,2)}`,context.signal);
        return answer.kind==='allow'?{behavior:'allow',updatedInput:args}:{behavior:'deny',message:'Action refusée par l’utilisateur.'};
      },
    };
    if(input.choices.model)options.model=input.choices.model;
    if(input.choices.effort) {
      if(!['low','medium','high','xhigh','max'].includes(input.choices.effort))throw new Error('UNSUPPORTED_EFFORT');
      options.effort=input.choices.effort as Options['effort'];
    }
    if(permissionMode!==undefined)options.permissionMode=permissionMode;
    const runtime=query({prompt:incoming,options});
    const timeout=setTimeout(()=>controller.abort(),20000);
    try {assertClaudeSubscription(await runtime.accountInfo());}
    catch(error){incoming.end();controller.abort();runtime.close();throw error;}
    finally {clearTimeout(timeout);}
    incoming.push({type:'user',message:{role:'user',content:input.text},parent_tool_use_id:null,session_id:input.nativeId??''});
    const mapper=new ClaudeMessages();
    let stopped=false,closed=false;
    const close=async()=>{
      if(closed)return;closed=true;
      for(const finish of [...pending.values()])finish({kind:'deny'});
      incoming.end();controller.abort();runtime.close();outgoing.end();
    };
    void (async()=>{
      try {for await(const message of runtime) {for(const body of mapper.convert(message))emit(body);if(message.type==='result')break;}}
      catch {if(!stopped)emit({kind:'error',code:'CLAUDE_FAILED',message:'Claude a interrompu la connexion. La session peut être reprise.'});}
      finally {await close();}
    })();
    return {events:outgoing,
      reply:async(requestId,answer)=>{const finish=pending.get(requestId);if(!finish)throw new Error('STALE_REQUEST');finish(answer);},
      interrupt:async()=>{stopped=true;for(const finish of [...pending.values()])finish({kind:'deny'});await Promise.race([runtime.interrupt().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]);await close();},
      close,
    };
  }
}
