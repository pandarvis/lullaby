import { randomUUID } from 'node:crypto';
import type { ProviderAdapter, ProviderRun, RunInput } from '../types';
import type { Diagnostic, EventBody, ReplyRequest } from '../../../shared/contracts';
import { assertCodexSubscription, checkSubscriptionEnvironment } from '../../diagnostics/providers';
import { canonicalizeFolder } from '../../projects/registry';
import { AsyncQueue } from '../queue';
import { RpcProcess, type RpcMessage } from './transport';
import { codexEvents } from './messages';

export class CodexAdapter implements ProviderAdapter {
  readonly provider='codex' as const;
  constructor(private executable=process.env.LULLABY_CODEX_PATH??'codex.exe'){}
  private async connect(cwd:string,env:NodeJS.ProcessEnv){
    checkSubscriptionEnvironment(env,'codex');
    const rpc=new RpcProcess(this.executable,['app-server'],cwd,env);
    rpc.onMessage=message=>{if(message.id!==undefined)rpc.reject(message.id);};
    try{
      const initialized=await rpc.request('initialize',{clientInfo:{name:'lullaby',title:'Lullaby',version:'0.1.0'}});
      rpc.notify('initialized');
      const [account,config]=await Promise.all([rpc.request('account/read',{refreshToken:false}),rpc.request('config/read',{cwd,includeLayers:false})]);
      assertCodexSubscription(account,config.config);
      return {rpc,version:initialized.userAgent as string|undefined,configuredModel:config.config.model as string|undefined};
    }catch(error){await rpc.close();throw error;}
  }
  async diagnose(cwd:string):Promise<Diagnostic>{
    const result:Diagnostic={provider:'codex',available:false,auth:'missing',issues:[],skills:[]};let rpc:RpcProcess|undefined;
    try{
      const connected=await this.connect(cwd,{...process.env});rpc=connected.rpc;
      result.available=true;result.auth='subscription';result.version=connected.version;
      result.configuredModel=connected.configuredModel;
      const catalog=await rpc.request('model/list',{});
      result.models=(catalog.data??[]).filter((model:any)=>!model.hidden).map((model:any)=>({id:model.model,name:model.displayName,default:model.isDefault,efforts:model.supportedReasoningEfforts.map((item:any)=>item.reasoningEffort)}));
      if(result.configuredModel&&!result.models?.some(model=>model.id===result.configuredModel))result.issues.push('Le modèle configuré n’est pas dans le catalogue disponible. Choisissez explicitement un modèle avant l’envoi.');
      const skills=await rpc.request('skills/list',{cwds:[cwd],forceReload:false});
      result.skills=(skills.data??[]).flatMap((entry:any)=>(entry.skills??[]).map((skill:any)=>({name:skill.name,available:skill.enabled,evidence:'Skill annoncé par le moteur natif ; invocation à vérifier.'})));
      if(skills.data?.some((entry:any)=>entry.errors?.length))result.issues.push('Certains skills natifs n’ont pas pu être chargés.');
    }catch(error){result.auth=error instanceof Error&&error.message==='AUTH_CONFIGURATION_AMBIGUOUS'?'ambiguous':'missing';result.issues.push('Codex indisponible ou connexion ChatGPT non confirmée. Vérifiez le moteur officiel et sa configuration.');}
    finally{await rpc?.close();}return result;
  }
  async run(input:RunInput):Promise<ProviderRun>{
    if(input.choices.permissionProfile)throw new Error('UNSUPPORTED_PERMISSION_PROFILE');
    const {rpc}=await this.connect(input.cwd,input.env);
    const outgoing=new AsyncQueue<{eventId:string;body:EventBody}>();
    const pending=new Map<string,{serverId:string|number;question?:{questions:any[];index:number;answers:Record<string,{answers:string[]}>}}>();
    let threadId='',turnId:string|undefined,stopped=false,closed=false;
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
      if(message.method==='turn/completed'&&p?.threadId===threadId&&(!turnId||p.turn.id===turnId)){pending.clear();outgoing.end();}
    };
    rpc.onMessage=handle;
    rpc.onFailure=()=>{if(!stopped)emit({kind:'error',code:'CODEX_PROCESS_FAILED',message:'La connexion au moteur Codex s’est arrêtée.'});outgoing.end();};
    try{
      if(input.nativeId){
        const native=await rpc.request('thread/read',{threadId:input.nativeId,includeTurns:false});
        const original=await canonicalizeFolder(native.thread.cwd);const selected=await canonicalizeFolder(input.cwd);
        if(original.folderKey!==selected.folderKey)throw new Error('NATIVE_FOLDER_MISMATCH');
      }
      const params:any={cwd:input.cwd};if(input.choices.model)params.model=input.choices.model;
      const result=await rpc.request(input.nativeId?'thread/resume':'thread/start',input.nativeId?{...params,threadId:input.nativeId}:params);
      if(result.modelProvider!=='openai')throw new Error('AUTH_CONFIGURATION_AMBIGUOUS');
      const expected=await canonicalizeFolder(input.cwd);const actual=await canonicalizeFolder(result.cwd);
      if(actual.folderKey!==expected.folderKey)throw new Error('NATIVE_FOLDER_MISMATCH');
      threadId=result.thread.id;emit({kind:'bound',nativeId:threadId});
      emit({kind:'action',itemId:'native-config',label:'Configuration native',state:'done',detail:JSON.stringify({model:result.model,effort:result.reasoningEffort,approvalPolicy:result.approvalPolicy,instructionSources:result.instructionSources},null,2)});
      const turn=await rpc.request('turn/start',{threadId,input:[{type:'text',text:input.text}],...(input.choices.effort?{effort:input.choices.effort}:{} )});
      turnId=turn.turn.id;
    }catch(error){await rpc.close();throw error;}
    const close=async()=>{if(closed)return;closed=true;pending.clear();await rpc.close();outgoing.end();};
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
