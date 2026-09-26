import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Diagnostic } from '../../../shared/contracts';
import { SnapshotContext, sessionStore } from '../chat/sessionStore';
import { ProjectSessions, phaseLabel } from './ProjectSessions';
import { SettingsScreen } from '../settings/SettingsScreen';
import { ProjectActions } from './ProjectActions';
import { UiIcon, AtelierIcon } from './UiIcon';

import { ProjectWorkspace } from './ProjectWorkspace';
import logo from '../assets/lullaby.svg';
import { ProjectEmblem } from './ProjectEmblem';
export function App(){
  const snapshot=useSyncExternalStore(sessionStore.subscribe,sessionStore.getSnapshot);
  const [selected,setSelected]=useState<string>();const [selectedSession,setSelectedSession]=useState<string>();
  const [notice,setNotice]=useState('');const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('lullaby.rail')==='compact');
  const [diagnostics,setDiagnostics]=useState<Record<string,Diagnostic[]>>({});const [loading,setLoading]=useState<string>();const [panel,setPanel]=useState(false);
  const [network,setNetwork]=useState(false);
  useEffect(()=>{const unsubscribe=window.lullaby.subscribe(sessionStore.accept);void window.lullaby.snapshot().then(result=>{if(result.ok)sessionStore.accept(result.value);else setNotice(result.message);});return unsubscribe;},[]);
  const project=snapshot.projects.find(p=>p.id===selected);
  async function diagnose(projectId:string){setLoading(projectId);try{const result=await window.lullaby.diagnose(projectId);if(result.ok)setDiagnostics(previous=>({...previous,[projectId]:result.value}));else setNotice(result.message);}finally{setLoading(current=>current===projectId?undefined:current);}}
  useEffect(()=>{if(selected&&!diagnostics[selected])void diagnose(selected);},[selected]);
  async function openProject(){const result=await window.lullaby.pickProject();if(result.ok&&result.value)setSelected(result.value.id);else if(!result.ok)setNotice(result.message);}
  return <SnapshotContext.Provider value={snapshot}><div className={`shell ${collapsed?'compact':''}`}><aside className="rail"><div className="brand"><img src={logo} alt=""/><span>lullaby<b>.</b></span></div><div className="rail-caption">VOTRE ESPACE</div><button className={`rail-button ${!project?'active':''}`} title="Atelier" onClick={()=>setSelected(undefined)}><AtelierIcon/><span>Atelier</span></button><div className="rail-caption projects-caption">PROJETS <span>{snapshot.projects.length}</span></div><nav aria-label="Projets">{snapshot.projects.map(item=><button key={item.id} title={item.name} className={`rail-button ${selected===item.id?'active':''}`} onClick={()=>setSelected(item.id)}><span className="emblem"><ProjectEmblem projectId={item.id}/></span><span className="project-name">{item.name}</span>{snapshot.sessions.some(s=>s.projectId===item.id&&s.phase==='waiting')&&<i className="attention-dot" aria-label="Attend votre réponse"/>}</button>)}</nav><button className="rail-button add-project" title="Ouvrir un projet" onClick={()=>void openProject()}><Icon name="plus"/><span>Ouvrir un projet</span></button><div className="rail-footer"><button className="rail-button" title="Paramètres" aria-label="Paramètres" onClick={()=>{setPanel(true);setNetwork(false);}}><UiIcon name="settings"/><span>Paramètres</span></button></div></aside><main>
    <header className="topbar"><button className="icon-button" aria-label={collapsed?'Déplier le menu':'Replier le menu'} onClick={()=>{setCollapsed(!collapsed);localStorage.setItem('lullaby.rail',!collapsed?'compact':'expanded');}}><Icon name="panel"/></button><div className="breadcrumb" title={project?.cwd}><strong>{project?.name??'Projets'}</strong>{project&&<small>{project.cwd}</small>}</div>{project&&<ProjectActions key={project.id} project={project} onRemoved={()=>{setSelected(undefined);setSelectedSession(undefined);}} onError={setNotice}/>}<button className="icon-button" title="Réseau" aria-label="Réseau" onClick={()=>{setNetwork(true);setPanel(false);}}><UiIcon name="network"/></button><button className="icon-button" title="Paramètres" aria-label="Ouvrir les paramètres" onClick={()=>{setPanel(true);setNetwork(false);}}><UiIcon name="settings"/></button></header>
    <section className={`workspace ${project?'studio-workspace':''}`}>{!project&&<div className="page-heading"><h1>Projets</h1><button className="primary" onClick={()=>void openProject()}><Icon name="plus"/>Ouvrir un projet</button></div>}
      {notice&&<div className="notice" role="alert">{notice}<button className="text-button" onClick={()=>setNotice('')}>Fermer</button></div>}
      {project?<ProjectWorkspace key={project.id} projectId={project.id}><ProjectSessions project={project} selected={selectedSession} onSelect={setSelectedSession} diagnostics={diagnostics[project.id]??[]} onError={setNotice}/></ProjectWorkspace>:<>
        {!snapshot.projects.length?<div className="welcome-card"><div className="welcome-art"><div className="orbit one"/><div className="orbit two"/><img src={logo} alt=""/></div><h2>Ouvrir un projet</h2><p>Ouvrez un dossier pour retrouver ici vos conversations et suivre le travail de vos agents.</p><button className="primary" onClick={()=>void openProject()}><Icon name="folder"/>Choisir un dossier</button></div>:<div className="project-grid">{snapshot.projects.map(item=>{const sessions=snapshot.sessions.filter(s=>s.projectId===item.id);return <button key={item.id} className="project-tile" onClick={()=>setSelected(item.id)}><span className="large-emblem"><ProjectEmblem projectId={item.id}/></span><h2>{item.name}</h2><p>{item.cwd}</p><div className="tile-footer"><span>{sessions.length} conversation{sessions.length>1?'s':''}</span><span>{sessions.filter(s=>['running','waiting'].includes(s.phase)).length} active(s)</span></div></button>;})}</div>}
        {snapshot.sessions.some(s=>['running','waiting'].includes(s.phase))&&<section className="activity"><h2>En cours dans l’atelier</h2>{snapshot.sessions.filter(s=>['running','waiting'].includes(s.phase)).map(session=><button className="activity-row" key={session.id} onClick={()=>{setSelected(session.projectId);setSelectedSession(session.id);}}><span>{snapshot.projects.find(p=>p.id===session.projectId)?.name}</span><strong>{session.title}</strong><span className={`phase ${session.phase}`}>{phaseLabel[session.phase]}</span></button>)}</section>}

      </>}
    </section></main>{(panel||network)&&<SettingsScreen initial={network?'network':'engines'} items={project?diagnostics[project.id]??[]:[]} loading={!!project&&loading===project.id} onRefresh={()=>{if(project)void diagnose(project.id);}} onClose={()=>{setPanel(false);setNetwork(false);if(project)void diagnose(project.id);}}/>}</div></SnapshotContext.Provider>;
}
export function Icon({name}:{name:string}){
  const paths:Record<string,string>={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',plus:'M12 5v14 M5 12h14',folder:'M3 6h7l2 3h9v11H3z',gem:'M12 2 22 9 17 21H7L2 9z M2 9h20 M12 2 7 9l5 12 5-12z',peak:'m2 21 8-17 5 10 3-6 4 13H2z M7 11l3 3 3-4',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z M12 7v10 M7 12h10',panel:'M3 4h18v16H3z M9 4v16'};
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" aria-hidden="true"><path d={paths[name]??paths.grid}/></svg>;
}
