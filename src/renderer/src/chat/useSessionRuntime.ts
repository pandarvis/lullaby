import { useContext, useEffect, useState } from 'react';
import { useExternalStoreRuntime, type ThreadMessageLike } from '@assistant-ui/react';
import { SnapshotContext } from './sessionStore';
const drafts=new Map<string,string>();
export function useSessionRuntime(sessionId:string){
  const snapshot=useContext(SnapshotContext);const session=snapshot.sessions.find(s=>s.id===sessionId)!;
  const [error,setError]=useState('');const [sending,setSending]=useState(false);
  const isRunning=['running','waiting'].includes(session.phase);
  const runtime=useExternalStoreRuntime({
    messages:snapshot.messages[sessionId]??[],isRunning,isSendDisabled:sending,
    convertMessage:(item):ThreadMessageLike=>({id:item.id,role:item.role,content:item.text?[{type:'text',text:item.text}]:[]}),
    onNew:async message=>{
      const text=message.content.filter(part=>part.type==='text').map(part=>part.text).join('\n');setSending(true);setError('');
      try{const result=await window.lullaby.send({sessionId,text});if(!result.ok){setError(result.message);runtime.thread.composer.setText(text);}}
      catch{setError('Le message n’a pas pu être envoyé.');runtime.thread.composer.setText(text);}
      finally{setSending(false);}
    },
    onCancel:async()=>{const result=await window.lullaby.interrupt(sessionId);if(!result.ok)setError(result.message);},
  });
  useEffect(()=>{
    runtime.thread.composer.setText(drafts.get(sessionId)??session.draft);
    let timer:ReturnType<typeof setTimeout>|undefined;let dirty=false;
    const save=()=>{if(!dirty)return;dirty=false;void window.lullaby.saveDraft(sessionId,drafts.get(sessionId)??'').then(result=>{if(!result.ok)setError('Le brouillon n’a pas pu être sauvegardé.');});};
    const unsubscribe=runtime.thread.composer.subscribe(()=>{
      const text=runtime.thread.composer.getState().text;if(drafts.get(sessionId)===text)return;
      drafts.set(sessionId,text);dirty=true;if(timer)clearTimeout(timer);timer=setTimeout(save,300);
    });
    return ()=>{unsubscribe();if(timer)clearTimeout(timer);save();};
  },[runtime,sessionId]);
  return {runtime,session,isRunning,error};
}
