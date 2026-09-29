import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Project, Session } from '../../../shared/contracts';
import logo from '../assets/lullaby.svg';
import { ProjectEmblem } from '../app/ProjectEmblem';
import { ShellIcon } from './ShellIcon';
import type { PanelTab } from './panel';
type Props={project?:Project;projects:Project[];sessions:Session[];sidebarHidden:boolean;canBack:boolean;canForward:boolean;panel?:PanelTab;git?:boolean;menuOpen:boolean;onToggleGit:()=>void;
  onMenu:(open:boolean)=>void;onToggleSidebar:()=>void;onBack:()=>void;onForward:()=>void;onSelectProject:(id:string)=>void;onAtelier:()=>void;onTogglePanel:(tab:PanelTab)=>void};
export function TitleBar(p:Props){
  const anchor=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const onMenu=useRef(p.onMenu);onMenu.current=p.onMenu;
  useEffect(()=>{
    if(!p.menuOpen)return;
    const outside=(event:PointerEvent)=>{if(!anchor.current?.contains(event.target as Node))onMenu.current(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){onMenu.current(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[p.menuOpen]);
  const count=(id:string)=>p.sessions.filter(session=>session.projectId===id).length;
  const choose=(action:()=>void)=>()=>{p.onMenu(false);trigger.current?.focus();action();};
  function arrows(event:ReactKeyboardEvent<HTMLElement>){
    if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
    const items=[...event.currentTarget.querySelectorAll<HTMLElement>('[role=menuitem]')];if(!items.length)return;
    event.preventDefault();const at=items.indexOf(document.activeElement as HTMLElement);
    const next=event.key==='ArrowDown'?(at+1)%items.length:(at<=0?items.length-1:at-1);items[next].focus();
  }
  return <header className="titlebar">
    <img className="titlebar-logo" src={logo} alt="Lullaby"/>
    <button className="shell-icon" aria-label={p.sidebarHidden?'Afficher la barre latérale':'Masquer la barre latérale'} title="Barre latérale (Ctrl+B)" aria-pressed={!p.sidebarHidden} onClick={p.onToggleSidebar}><ShellIcon name="rail"/></button>
    <button className="shell-icon" aria-label="Précédent" title="Précédent (Alt+←)" disabled={!p.canBack} onClick={p.onBack}><ShellIcon name="back"/></button>
    <button className="shell-icon" aria-label="Suivant" title="Suivant (Alt+→)" disabled={!p.canForward} onClick={p.onForward}><ShellIcon name="forward"/></button>
    <div className="project-switcher" ref={anchor}>
      <button ref={trigger} className="project-switch" aria-haspopup="menu" aria-expanded={p.menuOpen} onClick={()=>p.onMenu(!p.menuOpen)}>
        {p.project?<ProjectEmblem projectId={p.project.id}/>:<ShellIcon name="atelier"/>}<span>{p.project?.name??'Atelier'}</span><ShellIcon name="chevron"/>
      </button>
      {p.menuOpen&&<div className="shell-menu" role="menu" aria-label="Changer de projet" onKeyDown={arrows}>
        <button role="menuitem" onClick={choose(p.onAtelier)}><ShellIcon name="atelier"/>Atelier</button>
        {p.projects.map(item=><button role="menuitem" key={item.id} onClick={choose(()=>p.onSelectProject(item.id))}><ProjectEmblem projectId={item.id}/>{item.name}<small>{count(item.id)} conv.</small></button>)}
      </div>}
    </div>
    {p.project&&<span className="titlebar-path" title={p.project.cwd}>{p.project.cwd}</span>}
    <div className="titlebar-drag"/>
    <div className="titlebar-tools">
      <button className="shell-icon" aria-label="Git" title={p.project?'Git du projet (Ctrl+Maj+G)':'Ouvrez un projet pour consulter Git'} aria-pressed={!!p.git} disabled={!p.project} onClick={p.onToggleGit}><ShellIcon name="git"/></button>
      <button className="shell-icon" aria-label="Aperçu" title="Aperçu (Ctrl+J)" aria-pressed={p.panel==='preview'} onClick={()=>p.onTogglePanel('preview')}><ShellIcon name="preview"/></button>
    </div>
  </header>;
}
