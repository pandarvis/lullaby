import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { ShellIcon } from './ShellIcon';
import { clampPanelWidth, minPanelWidth, panelTabs, type PanelTab } from './panel';
type Props={tab?:PanelTab;width:number;onTab:(tab:PanelTab)=>void;onClose:()=>void;onResize:(width:number)=>void;onSlot:(element:HTMLDivElement|null)=>void};
export function RightPanel({tab,width,onTab,onClose,onResize,onSlot}:Props){
  const [resizing,setResizing]=useState(false);
  const stopDrag=useRef<(()=>void)|null>(null);
  useEffect(()=>()=>stopDrag.current?.(),[]);
  function startResize(event:PointerEvent<HTMLDivElement>){
    event.preventDefault();setResizing(true);
    const move=(next:globalThis.PointerEvent)=>onResize(clampPanelWidth(window.innerWidth-next.clientX,window.innerWidth));
    const stop=()=>{stopDrag.current=null;setResizing(false);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',stop);};stopDrag.current=stop;
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);window.addEventListener('pointercancel',stop);
  }
  function keyResize(event:KeyboardEvent<HTMLDivElement>){
    const step=event.key==='ArrowLeft'?16:event.key==='ArrowRight'?-16:0;if(!step)return;
    event.preventDefault();onResize(clampPanelWidth(width+step,window.innerWidth));
  }
  return <aside className={`right-panel ${tab?'open':''} ${resizing?'resizing':''}`} aria-label="Panneau latéral" inert={!tab} style={{'--panel-width':`${width}px`} as CSSProperties}>
    <div className="panel-resizer" role="separator" aria-orientation="vertical" aria-label="Redimensionner le panneau" aria-valuenow={width} aria-valuemin={minPanelWidth} aria-valuemax={Math.round(window.innerWidth*.6)} tabIndex={0} onPointerDown={startResize} onKeyDown={keyResize}/>
    <div className="panel-tabs">
      <div className="panel-tablist" role="tablist" aria-label="Contenu du panneau">
      {panelTabs.map(([id,label])=><button key={id} role="tab" id={`panel-tab-${id}`} aria-controls={`panel-${id}`} className="panel-tab" aria-selected={tab===id} onClick={()=>onTab(id)}><ShellIcon name={id}/>{label}</button>)}
      </div>
      <button className="shell-icon" aria-label="Fermer le panneau" title="Fermer (Ctrl+J)" onClick={onClose}><ShellIcon name="close"/></button>
    </div>
    <div className="panel-body" id="panel-preview" role="tabpanel" aria-labelledby="panel-tab-preview" hidden={tab!=='preview'}>
      <div className="preview-slot" ref={onSlot}/>
      <p className="panel-empty">Aucun aperçu ouvert. Utilisez « Aperçu » sur un bloc HTML ou le + de la zone de saisie.</p>
    </div>
  </aside>;
}
