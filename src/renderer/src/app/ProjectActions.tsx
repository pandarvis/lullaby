import { useRef, useState } from 'react';
import type { Project } from '../../../shared/contracts';
import { UiIcon } from './UiIcon';
import { useDismiss } from './useDismiss';
export function ProjectActions({project,onRemoved,onError}:{project:Project;onRemoved:()=>void;onError:(message:string)=>void}){
  const [open,setOpen]=useState(false);const [name,setName]=useState(project.name);const [confirm,setConfirm]=useState(false);const [busy,setBusy]=useState(false);
  const anchor=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);useDismiss(open,()=>setOpen(false),[anchor],trigger);
  async function act(remove=false){setBusy(true);try{const result=remove?await window.lullaby.removeProject(project.id):await window.lullaby.renameProject(project.id,name);if(result.ok){setOpen(false);if(remove)onRemoved();}else onError(result.message);}catch{onError('L’action n’a pas pu être effectuée.');}finally{setBusy(false);}}
  return <div className="project-actions" ref={anchor}><button ref={trigger} className="icon-button" aria-label="Options du projet" title="Options du projet" aria-expanded={open} onClick={()=>{setOpen(!open);setName(project.name);setConfirm(false);}}><UiIcon name="more"/></button>{open&&<div className="project-actions-menu"><form onSubmit={e=>{e.preventDefault();void act();}}><label>Nom dans Lullaby<input aria-label="Nom du projet" maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><button className="secondary" disabled={busy||!name.trim()}>Renommer</button></form><hr/>{confirm?<><p>Retirer ce projet et ses conversations de Lullaby ? Vos fichiers et les sessions natives seront conservés.</p><button className="danger-button" disabled={busy} onClick={()=>void act(true)}>Confirmer le retrait</button><button className="text-button" onClick={()=>setConfirm(false)}>Annuler</button></>:<button className="text-button" onClick={()=>setConfirm(true)}>Retirer de Lullaby…</button>}</div>}</div>;
}
