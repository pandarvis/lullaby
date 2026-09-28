import { createHash, randomUUID } from 'node:crypto';
import { stat } from 'node:fs/promises';
import type { ProviderAdapter, ProviderRun, RunInput } from '../types';
import type { Diagnostic, EventBody, ReplyRequest } from '../../../shared/contracts';
import { assertCodexSubscription, checkSubscriptionEnvironment } from '../../diagnostics/providers';
import { canonicalizeFolder } from '../../projects/registry';
import { AsyncQueue } from '../queue';
import { RpcProcess, RpcRejected, type RpcMessage } from './transport';
import { codexEvents } from './messages';
import { resolveCodexExecutable } from './executable';
import { codexPermissions } from '../permissions';

const diagnosticIssues:Record<string,string>={
  CODEX_EXECUTABLE_NOT_FOUND:'Moteur Codex introuvable. Installez le client officiel ou choisissez son exécutable codex.exe dans les paramètres Moteurs.',
  CODEX_EXECUTABLE_INVALID:'Le chemin Codex configuré ne désigne pas un exécutable natif accessible. Sélectionnez un fichier codex.exe existant dans les paramètres Moteurs.',
  CODEX_PROCESS_FAILED:'L’exécutable Codex a été trouvé mais ne peut pas être lancé. Vérifiez les droits Windows et le chemin du moteur.',
  CODEX_PROCESS_CLOSED:'Codex s’est fermé pendant la connexion. Vérifiez que l’exécutable choisi prend en charge App Server.',
  CODEX_RPC_TIMEOUT:'Codex ne répond pas à temps. Vérifiez son démarrage et les paramètres réseau du moteur.',
  CODEX_RPC_REJECTED:'Codex a refusé le diagnostic. Vérifiez la compatibilité App Server et la configuration du moteur.',
  CODEX_NATIVE_PERMISSIONS_UNAVAILABLE:'Les permissions natives ne peuvent pas être rétablies fidèlement pour cette reprise. Choisissez un profil explicite ou reprenez dans le client officiel.',
  SUBSCRIPTION_NOT_CONFIRMED:'Codex répond, mais la connexion ChatGPT n’est pas confirmée. Connectez-vous avec ChatGPT dans le client ou la CLI officielle, puis relancez la vérification.',
  AUTH_CONFIGURATION_AMBIGUOUS:'La configuration Codex peut sélectionner une API facturée. Vérifiez le fournisseur natif et les variables de configuration ; aucune bascule payante n’a été effectuée.',
};

// Names the refused step and the engine's reason instead of a generic compatibility hint.
export function rejectionIssue(error:RpcRejected):string {
  const detail=error.detail?` : « ${error.detail} »`:'';
  if(error.method==='account/read')return `Codex n’a pas pu vérifier le compte ChatGPT${detail}. Sur un réseau d’entreprise, le proxy peut bloquer chatgpt.com pour Codex ; Lullaby ne contourne pas ce blocage.`;
  return `Codex a refusé l’étape ${error.method}${detail}.`;
}

// App Server startup was measured at 15-21 s on the managed workstation, so a
// conversation keeps its process between turns, as for Claude (see D013).
type Stamp={size:number;mtimeMs:number};
type CodexEngine={rpc:RpcProcess;threadId:string;key:string;path?:string;stamp?:Stamp;idle?:ReturnType<typeof setTimeout>;dead:boolean};
async function threadStamp(path?:string):Promise<Stamp|undefined>{
  if(!path)return;try{const info=await stat(path);return {size:info.size,mtimeMs:info.mtimeMs};}catch{return;}
}
function engineKey(input:RunInput,executable?:string){
  const env=createHash('sha256').update(JSON.stringify(Object.entries(input.env).sort(([a],[b])=>a.localeCompare(b)))).digest('hex');
  return JSON.stringify({cwd:input.cwd,choices:input.choices,executable,env});
}

export class CodexAdapter implements ProviderAdapter {
  readonly provider='codex' as const;
  private idle=new Map<string,CodexEngine>();
  constructor(private executable?:string,private idleMs=10*60_000,private maxIdle=3){}
  // Reuse only a kept process whose thread file (`thread.path`) nobody else changed.
  private async reusable(input:RunInput,key:string):Promise<CodexEngine|undefined>{
    if(!input.nativeId)return;
    const engine=this.idle.get(input.nativeId);if(!engine)return;
    this.idle.delete(input.nativeId);if(engine.idle)clearTimeout(engine.idle);
    const current=await threadStamp(engine.path);
    if(engine.key===key&&!engine.dead&&current&&engine.stamp&&current.size===engine.stamp.size&&current.mtimeMs===engine.stamp.mtimeMs)return engine;
    await engine.rpc.close();
  }
  private async park(engine:CodexEngine){
    engine.stamp=await threadStamp(engine.path);
    if(!engine.stamp||engine.dead){await engine.rpc.close();return;}
    const {rpc,threadId:id}=engine;
    rpc.onMessage=message=>{if(message.id!==undefined)rpc.reject(message.id);};rpc.onFailure=()=>{engine.dead=true;};
    const previous=this.idle.get(id);if(previous&&previous!==engine){if(previous.idle)clearTimeout(previous.idle);void previous.rpc.close();}
    engine.idle=setTimeout(()=>{if(this.idle.get(id)===engine)this.idle.delete(id);void rpc.close();},this.idleMs);
    this.idle.set(id,engine);
    while(this.idle.size>this.maxIdle){const [oldest,evicted]=this.idle.entries().next().value!;this.idle.delete(oldest);if(evicted.idle)clearTimeout(evicted.idle);void evicted.rpc.close();}
  }
  async dispose(){const engines=[...this.idle.values()];this.idle.clear();await Promise.all(engines.map(engine=>{if(engine.idle)clearTimeout(engine.idle);return engine.rpc.close();}));}
  private async connect(cwd:string,env:NodeJS.ProcessEnv,onInitialized?:(info:{executablePath:string;version?:string})=>void){
    checkSubscriptionEnvironment(env,'codex');
    const executablePath=await resolveCodexExecutable(env,this.executable);
    const rpc=new RpcProcess(executablePath,['app-server'],cwd,env);
    rpc.onMessage=message=>{if(message.id!==undefined)rpc.reject(message.id);};
    try{
      const initialized=await rpc.request('initialize',{clientInfo:{name:'lullaby',title:'Lullaby',version:'0.1.0'}});
      rpc.notify('initialized');
      onInitialized?.({executablePath,version:initialized.userAgent as string|undefined});
      const [account,config]=await Promise.all([rpc.request('account/read',{refreshToken:false}),rpc.request('config/read',{cwd,includeLayers:false})]);
      assertCodexSubscription(account,config.config);
      return {rpc,version:initialized.userAgent as string|undefined,configuredModel:config.config.model as string|undefined,nativeConfig:config.config};
    }catch(error){await rpc.close();throw error;}
  }
  private async resumeNativePermissions(rpc:RpcProcess,cwd:string,config:any):Promise<Record<string,unknown>> {
    const approvalSupported=(value:unknown)=>['untrusted','on-request','never'].includes(value as string)
      ||(!!value&&typeof value==='object'&&!Array.isArray(value)&&'granular' in value);
    const sandboxes=['read-only','workspace-write','danger-full-access'];
    // Named beta profiles can carry finer boundaries than a legacy sandbox enum.
    if(config.default_permissions)throw new Error('CODEX_NATIVE_PERMISSIONS_UNAVAILABLE');
    if(approvalSupported(config.approval_policy)&&sandboxes.includes(config.sandbox_mode))return {
      approvalPolicy:config.approval_policy,sandbox:config.sandbox_mode,
    };
    // config/read returns null for unset values. Let the engine resolve trust,
    // managed requirements and platform defaults; never guess them from a preset.
    const probe=await rpc.request('thread/start',{cwd,ephemeral:true});
    try {
      const modes:Record<string,string>={readOnly:'read-only',workspaceWrite:'workspace-write',dangerFullAccess:'danger-full-access'};
      const sandbox=modes[probe.sandbox?.type];
      if(!sandbox||!approvalSupported(probe.approvalPolicy))throw new Error('CODEX_NATIVE_PERMISSIONS_UNAVAILABLE');
      return {approvalPolicy:probe.approvalPolicy,sandbox};
    } finally {
      if(probe.thread?.id)await rpc.request('thread/unsubscribe',{threadId:probe.thread.id}).catch(()=>{});
    }
  }
  async diagnose(cwd:string,env:NodeJS.ProcessEnv=process.env):Promise<Diagnostic>{
    const result:Diagnostic={provider:'codex',available:false,auth:'missing',issues:[],skills:[]};let rpc:RpcProcess|undefined;
    try{
      const connected=await this.connect(cwd,{...env},info=>Object.assign(result,{available:true,...info}));rpc=connected.rpc;
      result.available=true;result.auth='subscription';result.version=connected.version;
      result.configuredModel=connected.configuredModel;
      const catalog=await rpc.request('model/list',{});
      result.models=(catalog.data??[]).filter((model:any)=>!model.hidden).map((model:any)=>({id:model.model,name:model.displayName,default:model.isDefault,efforts:model.supportedReasoningEfforts.map((item:any)=>item.reasoningEffort)}));
      if(result.configuredModel&&!result.models?.some(model=>model.id===result.configuredModel))Object.assign(result,{configuredModelUnavailable:true});
      const config=connected.nativeConfig;const approval=typeof config.approval_policy==='string'?config.approval_policy:undefined;
      result.native={modelName:result.models?.find(model=>model.id===result.configuredModel)?.name??result.configuredModel,
        effort:typeof config.model_reasoning_effort==='string'?config.model_reasoning_effort:undefined,
        permission:approval&&typeof config.sandbox_mode==='string'?`${approval}/${config.sandbox_mode}`:undefined};
      const skills=await rpc.request('skills/list',{cwds:[cwd],forceReload:false});
      result.skills=(skills.data??[]).flatMap((entry:any)=>(entry.skills??[]).map((skill:any)=>({name:skill.name,available:skill.enabled,evidence:'Skill annoncé par le moteur natif ; invocation à vérifier.'})));
      if(skills.data?.some((entry:any)=>entry.errors?.length))result.issues.push('Certains skills natifs n’ont pas pu être chargés.');
    }catch(error){
      const code=error instanceof Error?error.message:'';
      if(result.auth!=='subscription')result.auth=code==='AUTH_CONFIGURATION_AMBIGUOUS'?'ambiguous':'missing';
      if(error instanceof RpcRejected)result.issues.push(rejectionIssue(error));
      else result.issues.push(diagnosticIssues[code]??'Le diagnostic Codex n’a pas pu être terminé. Vérifiez la compatibilité et la configuration du moteur officiel.');
    }
    finally{await rpc?.close();}return result;
  }
  async run(input:RunInput):Promise<ProviderRun>{
    let permissions:Record<string,unknown>=codexPermissions(input.choices.permissionProfile);
    const key=engineKey(input,this.executable);
    const reused=await this.reusable(input,key);
    let rpc:RpcProcess,nativeConfig:any;
    if(reused)rpc=reused.rpc;else ({rpc,nativeConfig}=await this.connect(input.cwd,input.env));
    const engine:CodexEngine=reused??{rpc,threadId:'',key,dead:false};
    const outgoing=new AsyncQueue<{eventId:string;body:EventBody}>();
    const pending=new Map<string,{serverId:string|number;question?:{questions:any[];index:number;answers:Record<string,{answers:string[]}>}}>();
    let threadId=engine.threadId,turnId:string|undefined,stopped=false,closed=false,completed=false;
    const emit=(body:EventBody)=>outgoing.push({eventId:randomUUID(),body});
    const askQuestion=(record:NonNullable<ReturnType<typeof pending.get>>)=>{
      const q=record.question!;const item=q.questions[q.index];const requestId=randomUUID();pending.set(requestId,record);
      emit({kind:'request',requestId,requestKind:'question',text:`${item.question}\n${(item.options??[]).map((option:any)=>`${option.label} : ${option.description??''}`).join('\n')}`});
    };
    const handle=(message:RpcMessage)=>{
      const p=message.params;
      if(message.id!==undefined){
        if(p?.threadId!==threadId){rpc.reject(message.id);return;}
        if(['item/commandExecution/requestApproval','item/fileChange/requestApproval'].includes(message.method??'')){
          const requestId=randomUUID();pending.set(requestId,{serverId:message.id});
          emit({kind:'request',requestId,requestKind:'approval',text:`${message.method}\n${JSON.stringify(p,null,2)}`});return;
        }
        if(message.method==='item/tool/requestUserInput'&&Array.isArray(p.questions)&&p.questions.length){
          askQuestion({serverId:message.id,question:{questions:p.questions,index:0,answers:{}}});return;
        }
        rpc.reject(message.id);emit({kind:'action',itemId:randomUUID(),label:'Demande non prise en charge',state:'error',detail:`Le moteur a demandé ${message.method}. Cette demande a été refusée ; utilisez le client natif pour cette capacité.`});return;
      }
      for(const body of codexEvents(message,threadId,turnId))emit(body);
      if(message.method==='turn/started'&&p?.threadId===threadId)turnId=p.turn.id;
      if(message.method==='turn/completed'&&p?.threadId===threadId&&(!turnId||p.turn.id===turnId)){completed=p.turn.status==='completed';pending.clear();outgoing.end();}
    };
    rpc.onMessage=handle;
    rpc.onFailure=()=>{engine.dead=true;if(!stopped)emit({kind:'error',code:'CODEX_PROCESS_FAILED',message:'La connexion au moteur Codex s’est arrêtée.'});outgoing.end();};
    try{
      // A kept process already holds the resumed thread and its launch choices.
      if(!reused){
      if(input.nativeId){
        const native=await rpc.request('thread/read',{threadId:input.nativeId,includeTurns:false});
        const original=await canonicalizeFolder(native.thread.cwd);const selected=await canonicalizeFolder(input.cwd);
        if(original.folderKey!==selected.folderKey)throw new Error('NATIVE_FOLDER_MISMATCH');
        if(input.choices.permissionProfile===undefined||input.choices.permissionProfile==='native')permissions=await this.resumeNativePermissions(rpc,input.cwd,nativeConfig);
      }
      const params:any={cwd:input.cwd,...permissions};if(input.choices.model)params.model=input.choices.model;
      const result=await rpc.request(input.nativeId?'thread/resume':'thread/start',input.nativeId?{...params,threadId:input.nativeId}:params);
      if(result.modelProvider!=='openai')throw new Error('AUTH_CONFIGURATION_AMBIGUOUS');
      const expected=await canonicalizeFolder(input.cwd);const actual=await canonicalizeFolder(result.cwd);
      if(actual.folderKey!==expected.folderKey)throw new Error('NATIVE_FOLDER_MISMATCH');
      threadId=result.thread.id;engine.threadId=threadId;engine.path=typeof result.thread.path==='string'?result.thread.path:undefined;emit({kind:'bound',nativeId:threadId});
      emit({kind:'action',itemId:'native-config',label:'Configuration native',state:'done',detail:JSON.stringify({model:result.model,effort:result.reasoningEffort,approvalPolicy:result.approvalPolicy,sandbox:result.sandbox,instructionSources:result.instructionSources},null,2)});
      }
      const turn=await rpc.request('turn/start',{threadId,input:[{type:'text',text:input.text}],...(input.choices.effort?{effort:input.choices.effort}:{} )});
      turnId=turn.turn.id;
    }catch(error){engine.dead=true;await rpc.close();throw error;}
    const close=async()=>{
      if(closed)return;closed=true;pending.clear();outgoing.end();
      if(completed&&!stopped&&!engine.dead&&engine.threadId)await this.park(engine);else await rpc.close();
    };
    return {events:outgoing,
      reply:async(requestId,answer:ReplyRequest['answer'])=>{
        const record=pending.get(requestId);if(!record)throw new Error('STALE_REQUEST');
        if(record.question){
          if(answer.kind!=='text')throw new Error('INVALID_ANSWER');
          const q=record.question;q.answers[q.questions[q.index].id]={answers:[answer.text]};q.index++;pending.delete(requestId);
          if(q.index<q.questions.length)askQuestion(record);else rpc.respond(record.serverId,{answers:q.answers});
        }else{if(answer.kind==='text')throw new Error('INVALID_ANSWER');rpc.respond(record.serverId,{decision:answer.kind==='allow'?'accept':'decline'});pending.delete(requestId);}
      },
      interrupt:async()=>{stopped=true;if(turnId)await rpc.request('turn/interrupt',{threadId,turnId},3000).catch(()=>{});await close();},close,
    };
  }
}
