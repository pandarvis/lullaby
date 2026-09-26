import { useState } from 'react';
import type { SessionEvent, ReplyRequest } from '../../../shared/contracts';
export function ApprovalPanel({event}:{event:SessionEvent}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [answer,setAnswer]=useState('');
  if(event.body.kind!=='request')return null;const body=event.body;
  async function reply(answer:ReplyRequest['answer']){
    setBusy(true);setError('');
    try{const result=await window.lullaby.reply({sessionId:event.sessionId,runId:event.runId,requestId:body.requestId,answer});if(!result.ok)setError(result.message);}
    catch{setError('La réponse n’a pas pu être transmise.');}finally{setBusy(false);}
  }
  return <section className="approval" aria-label="Demande de l’agent"><strong>{body.requestKind==='approval'?'Votre accord est nécessaire':'L’agent a une question'}</strong><pre>{body.text}</pre>
    {body.requestKind==='question'?<form onSubmit={e=>{e.preventDefault();void reply({kind:'text',text:answer});}}><label>Votre réponse<input value={answer} onChange={e=>setAnswer(e.target.value)}/></label><button className="primary" disabled={busy||!answer.trim()}>Répondre</button></form>:<div className="button-row"><button className="secondary" disabled={busy} onClick={()=>void reply({kind:'deny'})}>Refuser</button><button className="primary" disabled={busy} onClick={()=>void reply({kind:'allow'})}>Autoriser cette action</button></div>}
    {error&&<p role="alert">{error}</p>}
  </section>;
}
