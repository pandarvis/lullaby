import { useEffect, useState } from 'react';
import type { Snapshot } from '../../../shared/contracts';
import logo from '../assets/lullaby.svg';
const empty: Snapshot = {revision:0,projects:[],sessions:[],messages:{},pending:[]};
export function App() {
  const [snapshot,setSnapshot] = useState(empty);
  const [selected,setSelected] = useState<string>();
  const [notice,setNotice] = useState('');
  const [collapsed,setCollapsed] = useState(() => localStorage.getItem('lullaby.rail') === 'compact');
  useEffect(() => {
    const unsubscribe = window.lullaby.subscribe(next => setSnapshot(old => next.revision >= old.revision ? next : old));
    void window.lullaby.snapshot().then(result => { if(result.ok) setSnapshot(old => result.value.revision >= old.revision ? result.value : old); });
    return unsubscribe;
  },[]);
  async function openProject() { const result = await window.lullaby.pickProject(); if(result.ok && result.value) setSelected(result.value.id); else if(!result.ok) setNotice(result.message); }
  const project = snapshot.projects.find(item => item.id === selected);
  return <div className={`shell ${collapsed ? 'compact' : ''}`}>
    <aside className="rail">
      <div className="brand"><img src={logo} alt=""/><span>lullaby<b>.</b></span></div>
      <div className="rail-caption">VOTRE ESPACE</div>
      <button className="rail-button active" title="Atelier" onClick={() => setSelected(undefined)}><Icon name="grid"/><span>Atelier</span></button>
      <div className="rail-caption projects-caption">PROJETS <span>{snapshot.projects.length}</span></div>
      <nav aria-label="Projets">{snapshot.projects.map((item,index) => <button key={item.id} title={item.name} className={`rail-button ${selected === item.id ? 'active' : ''}`} onClick={() => setSelected(item.id)}><span className={`emblem tone-${index%3}`}><Icon name="gem"/></span><span className="project-name">{item.name}</span></button>)}</nav>
      <button className="rail-button add-project" title="Ouvrir un projet" onClick={openProject}><Icon name="plus"/><span>Ouvrir un projet</span></button>
      <div className="rail-footer"><span className="status-dot"/><span>Atelier local · Windows</span></div>
    </aside>
    <main>
      <header className="topbar"><button className="icon-button" title={collapsed ? 'Déplier le menu' : 'Replier le menu'} aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'} onClick={() => {setCollapsed(!collapsed);localStorage.setItem('lullaby.rail',!collapsed ? 'compact':'expanded');}}><Icon name="panel"/></button><div className="breadcrumb">Votre espace <span>/</span> <strong>{project?.name ?? 'Atelier'}</strong></div><span className="local-pill">V0 · en construction</span></header>
      <section className="workspace"><div className="eyebrow">UN ENDROIT POUR FAIRE AVANCER LES IDÉES</div><div className="page-heading"><div><h1>{project?.name ?? 'Votre atelier'}<span>.</span></h1><p>{project ? project.cwd : 'Vos projets, vos agents. Un espace pour garder le fil.'}</p></div><button className="primary" onClick={openProject}><Icon name="plus"/>Ouvrir un projet</button></div>
      <div className="welcome-card"><div className="welcome-art"><div className="orbit one"/><div className="orbit two"/><img src={logo} alt=""/></div><div className="eyebrow">CHAQUE PROJET COMMENCE PAR UNE IDÉE</div><h2>{project ? 'Votre projet a trouvé sa place.' : 'Faisons de la place à votre prochain projet.'}</h2><p>{project ? 'Le dossier est ouvert. La connexion aux agents arrive dans les prochaines étapes du socle.' : 'Ouvrez un dossier pour retrouver ici vos conversations et suivre le travail de vos agents.'}</p><button className="primary" onClick={openProject}><Icon name="folder"/>Choisir un dossier</button></div>
      <div className="engine-row"><div className="engine-card"><span className="engine-monogram">A</span><div><strong>Claude Code</strong><p>Connexion en préparation</p></div><span className="muted-dot"/></div><div className="engine-card"><span className="engine-monogram codex">C</span><div><strong>Codex</strong><p>Connexion en préparation</p></div><span className="muted-dot"/></div></div>
      {notice && <div className="notice" role="status">{notice}</div>}
      <footer className="workspace-footer"><span>IRIS · Un atelier qui vous ressemble</span><span>Vos dossiers restent sur votre poste</span></footer></section>
    </main>
  </div>;
}
export function Icon({name}:{name:string}) {
  const paths: Record<string,string> = {grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',plus:'M12 5v14 M5 12h14',folder:'M3 6h7l2 3h9v11H3z',gem:'M12 2 22 9 17 21H7L2 9z M2 9h20 M12 2 7 9l5 12 5-12z',panel:'M3 4h18v16H3z M9 4v16'};
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" aria-hidden="true"><path d={paths[name] ?? paths.grid}/></svg>;
}
