import { useEffect,useState } from 'react';
import type { ChatItem,Phase,Provider } from '../../../shared/contracts';
import { UiIcon } from '../app/UiIcon';
import { actionPresentation } from './actionPresentation';
// Turn start per session, kept outside the component so leaving the conversation
// does not reset the count. Renderer memory only: a window reload starts again.
const turnStarts=new Map<string,number>();
export function AgentActivity({sessionId,phase,sending,messages,provider}:{sessionId:string;phase:Phase;sending:boolean;messages:ChatItem[];provider:Provider}){
  const active=phase==='running'||phase==='waiting'||sending;
  const since=()=>Math.floor((Date.now()-(turnStarts.get(sessionId)??Date.now()))/1000);
  const [elapsed,setElapsed]=useState(()=>active?since():0);
  useEffect(()=>{
    if(!active){turnStarts.delete(sessionId);setElapsed(0);return;}
    if(!turnStarts.has(sessionId))turnStarts.set(sessionId,Date.now());
    setElapsed(since());const timer=setInterval(()=>setElapsed(since()),1000);return()=>clearInterval(timer);
  },[active,sessionId]);
  if(!active)return null;
  let lastUser=messages.length-1;while(lastUser>=0&&messages[lastUser].role!=='user')lastUser--;
  const turn=messages.slice(lastUser+1);const action=turn.flatMap(item=>item.actions).reverse().find(item=>item.state==='running');
  const presentation=action?actionPresentation(action):undefined;
  const waiting=phase==='waiting';
  const label=waiting?'Votre réponse est attendue':phase!=='running'?'Envoi de votre message…':presentation?.label??(turn.some(item=>item.text)?'Réponse en cours…':`${provider==='claude'?'Claude':'Codex'} prépare la réponse…`);
  return <div className={`agent-activity ${waiting?'waiting':''}`} role="status" aria-label="Activité de l’agent">
    <span className="activity-crystal"><UiIcon name={waiting?'shield':presentation?.icon??'spark'}/></span>
    <span className="activity-description"><strong>{label}</strong>{presentation?.context&&<small title={presentation.context}>{presentation.context}</small>}</span>
    <span className="activity-elapsed" aria-hidden="true" title="Temps depuis le début du tour ; distinct du suivi de temps du projet.">{elapsed<60?`${elapsed} s`:`${Math.floor(elapsed/60)} min ${elapsed%60} s`}</span>
    {!waiting&&<span className="activity-pulse" aria-hidden="true"><i/><i/><i/></span>}
  </div>;
}
