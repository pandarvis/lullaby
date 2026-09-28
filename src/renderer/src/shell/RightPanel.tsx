import { useEffect, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { GitView } from '../git/GitView';
import { ShellIcon } from './ShellIcon';
import { clampPanelWidth, minPanelWidth, panelTabs, type PanelTab } from './panel';
type Props={tab?:PanelTab;width:number;projectId?:string;onTab:(tab:PanelTab)=>void;onClose:()=>void;onResize:(width:number)=>void;onSlot:(element:HTMLDivElement|null)=>void};
export function RightPanel({tab,width,projectId,onTab,onClose,onResize,onSlot}:Props){
  const [gitOpened,setGitOpened]=useState(false);const [resizing,setResizing]=useState(false);
  useEffect(()=>{if(tab==='git')setGitOpened(true);},[tab]);
  function startResize(event:PointerEvent<HTMLDivElement>){
    event.preventDefault();setResizing(true);
    const move=(next:globalThis.PointerEvent)=>onResize(clampPanelWidth(window.innerWidth-next.clientX,window.innerWidth));
    const stop=()=>{setResizing(false);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);
  }
  function keyResize(event:KeyboardEvent<HTMLDivElement>){
    const step=event.key==='ArrowLeft'?16:event.key==='ArrowRight'?-16:0;if(!step)return;
    event.preventDefault();onResize(clampPanelWidth(width+step,window.innerWidth));
  }
  return <aside className={`right-panel ${tab?'open':''} ${resizing?'resizing':''}`} aria-label="Panneau latéral" inert={!tab} style={{'--panel-width':`${width}px`} as CSSProperties}>
    <div className="panel-resizer" role="separator" aria-orientation="vertical" aria-label="Redimensionner le panneau" aria-valuenow={width} aria-valuemin={minPanelWidth} tabIndex={0} onPointerDown={startResize} onKeyDown={keyResize}/>
    <div className="panel-tabs" role="tablist" aria-label="Contenu du panneau">
      {panelTabs.map(([id,label])=><button key={id} role="tab" className="panel-tab" aria-selected={tab===id} onClick={()=>onTab(id)}><ShellIcon name={id}/>{label}</button>)}
      <button className="shell-icon" aria-label="Fermer le panneau" title="Fermer (Ctrl+J)" onClick={onClose}><ShellIcon name="close"/></button>
    </div>
    <div className="panel-body" role="tabpanel" aria-label="Git" hidden={tab!=='git'}>
      {projectId?gitOpened&&<GitView key={projectId} projectId={projectId} active={tab==='git'}/>:<p className="panel-empty">Ouvrez un projet pour consulter Git.</p>}
    </div>
    <div className="panel-body" role="tabpanel" aria-label="Aperçu" hidden={tab!=='preview'}>
      <div className="preview-slot" ref={onSlot}/>
      <p className="panel-empty">Aucun aperçu ouvert. Utilisez « Aperçu » sur un bloc HTML ou le + de la zone de saisie.</p>
    </div>
  </aside>;
}
