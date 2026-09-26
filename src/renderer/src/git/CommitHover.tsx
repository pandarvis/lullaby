import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GitSnapshot } from '../../../shared/git';
import { GitIcon } from './GitIcon';

type Target = { oid:string; parent?:string; x:number; y:number; snapshotId:string };
export function useCommitHover(snapshot:GitSnapshot, active:boolean) {
  const id=useId();
  const [target,setTarget]=useState<Target>();
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const keep=useCallback(()=>clearTimeout(timer.current),[]);
  const close=useCallback(()=>{keep();setTarget(undefined);},[keep]);
  const leave=()=>{keep();timer.current=setTimeout(close,160);};
  useEffect(()=>{
    close();
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')close();};
    const outside=(event:Event)=>{
      if(event.target instanceof Element && event.target.closest('[data-git-tooltip]'))return;
      close();
    };
    document.addEventListener('keydown',escape);
    document.addEventListener('pointerdown',outside);
    window.addEventListener('scroll',outside,true);
    window.addEventListener('resize',close);
    window.addEventListener('blur',close);
    return()=>{keep();document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside);window.removeEventListener('scroll',outside,true);window.removeEventListener('resize',close);window.removeEventListener('blur',close);};
  },[snapshot.id,active,close,keep]);
  function show(oid:string,element:Element,pointer?:{clientX:number;clientY:number},parent?:string) {
    keep();if(!active)return;
    const rect=element.getBoundingClientRect();
    const next={oid,parent,x:pointer?.clientX??rect.left+16,y:pointer?.clientY??rect.bottom,snapshotId:snapshot.id};
    setTarget(undefined);
    if(pointer)timer.current=setTimeout(()=>setTarget(next),250);else setTarget(next);
  }
  const visible=active&&target?.snapshotId===snapshot.id?target:undefined;
  return {id,target:visible,show,leave,close,card:visible?<CommitHover id={id} target={visible} snapshot={snapshot} onEnter={keep} onLeave={leave}/>:null};
}

function CommitHover({id,target,snapshot,onEnter,onLeave}:{id:string;target:Target;snapshot:GitSnapshot;onEnter():void;onLeave():void}) {
  const ref=useRef<HTMLDivElement>(null);
  const [position,setPosition]=useState({left:12,top:12});
  const commit=snapshot.commits.find(c=>c.oid===target.oid);
  const parent=snapshot.commits.find(c=>c.oid===target.parent);
  useLayoutEffect(()=>{
    const rect=ref.current?.getBoundingClientRect();if(!rect)return;
    const left=Math.max(12,Math.min(target.x+12,window.innerWidth-rect.width-12));
    const below=target.y+14;
    const top=Math.max(12,Math.min(below+rect.height>window.innerHeight-12?target.y-rect.height-14:below,window.innerHeight-rect.height-12));
    setPosition({left,top});
  },[target]);
  if(!commit)return null;
  return createPortal(<div ref={ref} id={id} role="tooltip" data-git-tooltip className="git-hover-card" style={position} onMouseEnter={onEnter} onMouseLeave={onLeave}>
    <div className="git-hover-eyebrow"><GitIcon name={target.parent?'parent':'commit'}/>{target.parent?'Lien vers un parent':commit.parents.length>1?`Fusion · ${commit.parents.length} parents`:commit.parents.length===0?'Commit racine':'Commit'}{snapshot.head===commit.oid&&<span>{snapshot.branch?'HEAD':'HEAD détachée'}</span>}</div>
    <strong className="git-hover-title">{commit.subject||'(sans message)'}</strong>
    <p>{commit.author}<br/><time dateTime={commit.date} title={commit.date}>{Number.isNaN(Date.parse(commit.date))?commit.date:new Date(commit.date).toLocaleString('fr-FR',{dateStyle:'long',timeStyle:'short'})}</time></p>
    <code>{commit.oid.slice(0,8)}</code>
    {snapshot.refs.some(r=>r.oid===commit.oid)&&<ul className="git-hover-refs">{snapshot.refs.filter(r=>r.oid===commit.oid).map(r=><li key={`${r.kind}:${r.name}`} className={`git-hover-ref ${r.kind}`}><GitIcon name={r.kind==='local'?'branch':r.kind==='remote'?'remote':'tag'}/><span>{r.kind==='local'?'Branche locale':r.kind==='remote'?'Référence distante connue':'Tag'} : {r.name}</span></li>)}</ul>}
    {target.parent?<div className="git-hover-parents"><GitIcon name="parent"/><span>{parent?'Parent':'Parent hors des commits chargés'}</span><code>{target.parent.slice(0,8)}</code>{parent&&<p>{parent.subject}</p>}</div>:commit.parents.length>0&&<div className="git-hover-parents"><GitIcon name="parent"/><span>{commit.parents.length>1?'Parents':'Parent'}</span>{commit.parents.map(oid=><code key={oid}>{oid.slice(0,8)}</code>)}</div>}
  </div>,document.body);
}
