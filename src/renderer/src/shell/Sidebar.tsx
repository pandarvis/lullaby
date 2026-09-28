import { useState, type KeyboardEvent, type RefObject } from 'react';
import type { Project, Session } from '../../../shared/contracts';
import { ProjectActions } from '../app/ProjectActions';
import { ProjectEmblem } from '../app/ProjectEmblem';
import { SessionActions } from '../app/SessionActions';
import type { View } from './navigation';
import { ShellIcon } from './ShellIcon';
import { StateMark } from './StateMark';
import { sidebarGroups } from './sidebarModel';
type Props={projects:Project[];sessions:Session[];view:View;query:string;collapsed:Record<string,boolean>;hidden:boolean;searchRef:RefObject<HTMLInputElement|null>;
  onQuery:(query:string)=>void;onToggleGroup:(projectId:string)=>void;onOpenSession:(session:Session)=>void;onNewSession:(projectId?:string)=>void;
  onAtelier:()=>void;onOpenFolder:()=>void;onSettings:()=>void;onProjectRemoved:(projectId:string)=>void;onSessionRemoved:(sessionId:string)=>void;onError:(message:string)=>void};
export function Sidebar(p:Props){
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const active=p.view.kind==='session'?p.view.sessionId:undefined;const query=p.query.trim();
  const groups=sidebarGroups(p.projects,p.sessions,{query,collapsed:p.collapsed,expanded,active});
  function arrows(event:KeyboardEvent<HTMLElement>){
    if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
    const items=[...event.currentTarget.querySelectorAll<HTMLElement>('[data-nav-item]')];
    const next=items[items.indexOf(document.activeElement as HTMLElement)+(event.key==='ArrowDown'?1:-1)];
    if(items.includes(document.activeElement as HTMLElement)&&next){event.preventDefault();next.focus();}
  }
  return <aside className="sidebar" aria-label="Navigation" inert={p.hidden} onKeyDown={arrows}>
    <label className="sidebar-search"><ShellIcon name="search"/>
      <input ref={p.searchRef} value={p.query} placeholder="Rechercher" aria-label="Rechercher une conversation" onChange={event=>p.onQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')p.onQuery('');}}/><kbd>Ctrl K</kbd>
    </label>
    <button className="sidebar-row" data-nav-item onClick={()=>p.onNewSession()}><ShellIcon name="edit"/>Nouvelle conversation</button>
    <button className={`sidebar-row ${p.view.kind==='atelier'?'active':''}`} data-nav-item aria-current={p.view.kind==='atelier'?'page':undefined} onClick={p.onAtelier}><ShellIcon name="atelier"/>Atelier</button>
    <div className="sidebar-scroll">
      <div className="sidebar-section">Projets<button className="shell-icon small" aria-label="Ouvrir un projet" title="Ouvrir un projet" onClick={p.onOpenFolder}><ShellIcon name="plus"/></button></div>
      <nav aria-label="Conversations par projet">
        {groups.map(group=><div key={group.project.id} className={`sidebar-group ${group.collapsed?'collapsed':''}`}>
          <div className="sidebar-group-head">
            <button className="sidebar-group-toggle" data-nav-item aria-expanded={!group.collapsed} onClick={()=>p.onToggleGroup(group.project.id)}><ProjectEmblem projectId={group.project.id}/><span>{group.project.name}</span><ShellIcon name="chevron"/></button>
            {group.collapsed&&group.attention&&<i className={`attention-dot ${group.attention}`} role="img" aria-label="Une conversation attend votre attention"/>}
            <span className="sidebar-group-actions">
              <button className="shell-icon small" aria-label={`Nouvelle conversation dans ${group.project.name}`} title="Nouvelle conversation" onClick={()=>p.onNewSession(group.project.id)}><ShellIcon name="plus"/></button>
              <ProjectActions project={group.project} onRemoved={()=>p.onProjectRemoved(group.project.id)} onError={p.onError}/>
            </span>
          </div>
          {!group.collapsed&&<ul className="sidebar-sessions">
            {group.sessions.map(session=><li key={session.id} className={`sidebar-session ${session.id===active?'active':''}`}>
              <button data-nav-item aria-current={session.id===active?'page':undefined} title={session.title} onClick={()=>p.onOpenSession(session)}><StateMark phase={session.phase}/><span>{session.title}</span></button>
              <SessionActions session={session} onRemoved={p.onSessionRemoved}/>
            </li>)}
            {!group.sessions.length&&<li className="sidebar-empty">Aucune conversation</li>}
            {group.hidden>0&&<li><button className="sidebar-more" data-nav-item onClick={()=>setExpanded(previous=>({...previous,[group.project.id]:true}))}>Afficher tout ({group.sessions.length+group.hidden})</button></li>}
          </ul>}
        </div>)}
        {query&&!groups.length&&<p className="sidebar-empty">Aucun résultat pour « {query} »</p>}
      </nav>
    </div>
    <div className="sidebar-footer"><button className="sidebar-row" data-nav-item onClick={p.onSettings}><ShellIcon name="settings"/>Paramètres</button></div>
  </aside>;
}
