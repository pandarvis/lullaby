import { useEffect, useId, useRef, useState } from 'react';
import type { Session } from '../../../shared/contracts';
import { forgetSessionDraft } from '../chat/useSessionRuntime';
import { UiIcon } from './UiIcon';

export function SessionActions({session,onRemoved}:{session:Session;onRemoved:(id:string)=>void}){
  const [open,setOpen]=useState(false),[confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const anchor=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const titleId=useId();const active=session.phase==='running'||session.phase==='waiting';
  useEffect(()=>{if(confirming)dialog.current?.showModal();else if(dialog.current?.open)dialog.current.close();},[confirming]);
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!anchor.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
  function cancel(){setConfirming(false);setError('');trigger.current?.focus();}
  async function remove(){
    if(busy||active)return;setBusy(true);setError('');
    try{const result=await window.lullaby.removeSession(session.id);
      if(result.ok){forgetSessionDraft(session.id);setConfirming(false);onRemoved(session.id);}else setError(result.message);
    }catch{setError('La conversation n’a pas pu être supprimée. Réessayez.');}finally{setBusy(false);}
  }
  return <div className="session-actions" ref={anchor}>
    <button ref={trigger} className="session-menu-trigger" aria-label={`Options de ${session.title}`} aria-expanded={open} onClick={()=>setOpen(!open)}><UiIcon name="more"/></button>
    {open&&<div className="session-actions-menu"><button disabled={active} onClick={()=>{setOpen(false);setError('');setConfirming(true);}}>Supprimer la conversation</button>{active&&<p>Arrêtez l’agent pour supprimer cette conversation.</p>}</div>}
    <dialog ref={dialog} className="session-delete-dialog" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!busy)cancel();}}>
      <h2 id={titleId}>Supprimer cette conversation ?</h2><p className="session-delete-title">{session.title}</p>
      <p>L’historique et le brouillon dans Lullaby seront supprimés. Les fichiers du projet et la session native {session.provider==='claude'?'Claude Code':'Codex'} seront conservés.</p>
      {error&&<p role="alert">{error}</p>}
      <div className="button-row"><button className="secondary" autoFocus disabled={busy} onClick={cancel}>Annuler</button><button className="primary" disabled={busy||active} onClick={()=>void remove()}>{busy?'Suppression…':'Supprimer'}</button></div>
    </dialog>
  </div>;
}
