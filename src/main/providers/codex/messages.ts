import type { EventBody } from '../../../shared/contracts';
import type { RpcMessage } from './transport';
export function codexEvents(message:RpcMessage,threadId:string,turnId?:string):EventBody[]{
  const p=message.params;if(!p||p.threadId!==threadId)return [];
  const eventTurn=p.turnId??p.turn?.id;if(turnId&&eventTurn&&eventTurn!==turnId)return [];
  if(message.method==='item/agentMessage/delta')return [{kind:'text',itemId:p.itemId,mode:'append',text:p.delta}];
  if(message.method==='item/started'||message.method==='item/completed'){
    const i=p.item;const done=message.method==='item/completed';
    if(i.type==='agentMessage')return done?[{kind:'text',itemId:i.id,mode:'replace',text:i.text}]:[];
    if(i.type==='userMessage')return [];
    if(i.type==='reasoning')return [{kind:'action',itemId:i.id,label:'Réflexion',state:done?'done':'running',detail:'Phase de réflexion signalée par Codex.'}];
    return [{kind:'action',itemId:i.id,label:i.type,state:i.status==='failed'?'error':done?'done':'running',detail:JSON.stringify(i,null,2)}];
  }
  if(message.method==='turn/completed')return p.turn.status==='failed'
    ?[{kind:'error',code:'CODEX_TURN_FAILED',message:safeError(p.turn.error)}]
    :[{kind:'state',phase:p.turn.status==='interrupted'?'interrupted':'done'}];
  if(message.method==='error')return [{kind:'action',itemId:'connection',label:'Connexion Codex',state:'error',detail:p.willRetry?'Le moteur tente de rétablir la connexion.':'Une erreur a été signalée par le moteur.'}];
  return [];
}

function safeError(error:any):string{
  const message=typeof error?.message==='string'?error.message:'Vérifiez la connexion et les limites du compte.';
  return `Le tour Codex a échoué : ${message.replace(/(?:Bearer\s+|sk-)[\w.\-]+/gi,'[secret masqué]').replace(/https?:\/\/\S+/g,'[adresse masquée]').slice(0,600)}`;
}
