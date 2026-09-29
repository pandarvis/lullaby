import { useRef, useState } from 'react';
import type { Project } from '../../../shared/contracts';
import { UiIcon } from './UiIcon';
import { useDismiss } from './useDismiss';
export function ProjectActions({project,onRemoved,onError}:{project:Project;onRemoved:()=>void;onError:(message:string)=>void}){
  const [open,setOpen]=useState(false);const [name,setName]=useState(project.name);const [confirm,setConfirm]=useState(false);const [busy,setBusy]=useState(false);
  const anchor=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);useDismiss(open,()=>setOpen(false),[anchor],trigger);
  async function act(remove=false){setBusy(true);try{const result=remove?await window.lullaby.removeProject(project.id):await window.lullaby.renameProject(project.id,name);if(result.ok){setOpen(false);if(remove)onRemoved();}else onError(result.message);}catch{onError('L’action n’a pas pu être effectuée.');}finally{setBusy(false);}}
  return <div className="project-actions" ref={anchor}><button ref={trigger} className="icon-button" aria-label="Options du projet" title="Options du projet" aria-expanded={open} onClick={()=>{setOpen(!open);setName(project.name);setConfirm(false);}}><UiIcon name="more"/></button>{open&&<div className="project-actions-menu">
    <form className="project-rename" onSubmit={e=>{e.preventDefault();void act();}}><label htmlFor={`rename-${project.id}`}>Nom dans Lullaby</label><div className="project-rename-row"><input id={`rename-${project.id}`} aria-label="Nom du projet" maxLength={120} value={name} onChange={e=>setName(e.target.value)}/><button className="rename-confirm" aria-label="Renommer" title="Renommer (Entrée)" disabled={busy||!name.trim()||name.trim()===project.name}><UiIcon name="check" flat/></button></div></form>
    <hr/>
    {confirm?<div className="project-remove-confirm" role="alertdialog" aria-label="Retirer le projet"><p>Retirer <strong>{project.name}</strong> et ses conversations de Lullaby ? Vos fichiers et les sessions natives sont conservés.</p><div className="project-remove-buttons"><button className="shell-button" onClick={()=>setConfirm(false)}>Annuler</button><button className="shell-button danger" disabled={busy} onClick={()=>void act(true)}>Retirer</button></div></div>
      :<button className="menu-row danger" onClick={()=>setConfirm(true)}><UiIcon name="trash" flat/>Retirer de Lullaby…</button>}
  </div>}</div>;
}
