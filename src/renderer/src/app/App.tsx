import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Diagnostic, Session } from '../../../shared/contracts';
import { SnapshotContext, sessionStore } from '../chat/sessionStore';
import { SettingsScreen } from '../settings/SettingsScreen';
import { AtelierView } from '../shell/AtelierView';
import { back, canBack, canForward, currentView, forward, initialNavigation, navigate, prune, type View } from '../shell/navigation';
import { clampPanelWidth, defaultPanelWidth, type PanelTab } from '../shell/panel';
import { RightPanel } from '../shell/RightPanel';
import { ShellContext } from '../shell/ShellContext';
import { useShortcuts } from '../shell/shortcuts';
import { Sidebar } from '../shell/Sidebar';
import { isBoolean, isFlags, isNumber, usePersistentState } from '../shell/storage';
import { TitleBar } from '../shell/TitleBar';
import { projectFocus } from './ProjectOverview';
import { NewConversation, SessionView } from './ProjectSessions';
export function App(){
  const snapshot=useSyncExternalStore(sessionStore.subscribe,sessionStore.getSnapshot);
  const [nav,setNav]=useState(initialNavigation);const view=currentView(nav);
  const [remembered,setRemembered]=useState<Record<string,string|undefined>>({});
  const [sidebarHidden,setSidebarHidden]=usePersistentState('lullaby.sidebar-hidden',false,isBoolean);
  const [collapsed,setCollapsed]=usePersistentState<Record<string,boolean>>('lullaby.sidebar-groups',{},isFlags);
  const [panelWidth,setPanelWidth]=usePersistentState('lullaby.panel-width',defaultPanelWidth,isNumber);
  const [panel,setPanel]=useState<PanelTab>();const [previewSlot,setPreviewSlot]=useState<HTMLDivElement|null>(null);
  const [query,setQuery]=useState('');const [menuOpen,setMenuOpen]=useState(false);const [pendingNew,setPendingNew]=useState(false);
  const [notice,setNotice]=useState('');const [settings,setSettings]=useState(false);
  const [diagnostics,setDiagnostics]=useState<Record<string,Diagnostic[]>>({});const [loading,setLoading]=useState<string>();
  const searchRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{const unsubscribe=window.lullaby.subscribe(sessionStore.accept);void window.lullaby.snapshot().then(result=>{if(result.ok)sessionStore.accept(result.value);else setNotice(result.message);});return unsubscribe;},[]);
  useEffect(()=>{setNav(previous=>prune(previous,item=>item.kind==='atelier'||snapshot.projects.some(project=>project.id===item.projectId)&&(item.kind==='project'||snapshot.sessions.some(session=>session.id===item.sessionId))));},[snapshot]);
  const projectId=view.kind==='atelier'?undefined:view.projectId;
  const project=snapshot.projects.find(item=>item.id===projectId);
  const session=view.kind==='session'?snapshot.sessions.find(item=>item.id===view.sessionId):undefined;
  // The open conversation must stay visible in the sidebar, whichever way it was reached.
  // Runs only when the view changes, so the user can still collapse the active group afterwards.
  useEffect(()=>{if(view.kind==='session'&&collapsed[view.projectId])setCollapsed(previous=>({...previous,[view.projectId]:false}));},[view]);
  async function diagnose(id:string){setLoading(id);try{const result=await window.lullaby.diagnose(id);if(result.ok)setDiagnostics(previous=>({...previous,[id]:result.value}));else setNotice(result.message);}finally{setLoading(current=>current===id?undefined:current);}}
  useEffect(()=>{if(projectId&&!diagnostics[projectId])void diagnose(projectId);},[projectId]);
  function go(next:View){setNav(previous=>navigate(previous,next));if(next.kind==='session')setRemembered(previous=>({...previous,[next.projectId]:next.sessionId}));}
  const openSession=(item:Session)=>go({kind:'session',projectId:item.projectId,sessionId:item.id});
  function openProject(id:string,sessionId?:string){
    const own=snapshot.sessions.filter(item=>item.projectId===id);
    const focus=own.find(item=>item.id===sessionId)??projectFocus(own,remembered[id]);
    if(focus)openSession(focus);else go({kind:'project',projectId:id});
  }
  function newSession(target?:string){
    const id=target??projectId;
    if(id){setCollapsed(previous=>({...previous,[id]:false}));go({kind:'project',projectId:id});return;}
    if(!snapshot.projects.length){void openFolder();return;}
    setPendingNew(true);setMenuOpen(true);
  }
  function selectProject(id:string){if(pendingNew){setPendingNew(false);go({kind:'project',projectId:id});}else openProject(id);}
  async function openFolder(){const result=await window.lullaby.pickProject();if(result.ok&&result.value)go({kind:'project',projectId:result.value.id});else if(!result.ok)setNotice(result.message);}
  const togglePanel=(tab?:PanelTab)=>setPanel(current=>tab?(current===tab?undefined:tab):(current?undefined:'git'));
  const toggleSidebar=()=>setSidebarHidden(hidden=>!hidden);
  useShortcuts({toggleSidebar,togglePanel:()=>togglePanel(),newSession:()=>newSession(),back:()=>setNav(back),forward:()=>setNav(forward),
    search:()=>{setSidebarHidden(false);requestAnimationFrame(()=>searchRef.current?.focus());}});
  useEffect(()=>{const fit=()=>setPanelWidth(width=>clampPanelWidth(width,window.innerWidth));window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[setPanelWidth]);
  const shell=useMemo(()=>({openPanel:(tab:PanelTab)=>setPanel(tab),previewSlot}),[previewSlot]);
  const diagnostic=session&&diagnostics[session.projectId]?.find(item=>item.provider===session.provider);
  return <SnapshotContext.Provider value={snapshot}><ShellContext.Provider value={shell}>
    <div className={`shell iris-shell ${sidebarHidden?'sidebar-hidden':''} ${panel?'panel-open':''}`}>
      <TitleBar project={project} projects={snapshot.projects} sessions={snapshot.sessions} sidebarHidden={sidebarHidden} canBack={canBack(nav)} canForward={canForward(nav)} panel={panel} menuOpen={menuOpen}
        onMenu={open=>{setMenuOpen(open);if(!open)setPendingNew(false);}} onToggleSidebar={toggleSidebar} onBack={()=>setNav(back)} onForward={()=>setNav(forward)}
        onSelectProject={selectProject} onAtelier={()=>go({kind:'atelier'})} onTogglePanel={togglePanel}/>
      <div className="shell-body">
        <Sidebar projects={snapshot.projects} sessions={snapshot.sessions} view={view} query={query} collapsed={collapsed} hidden={sidebarHidden} searchRef={searchRef}
          onQuery={setQuery} onToggleGroup={id=>setCollapsed(previous=>({...previous,[id]:!previous[id]}))} onOpenSession={openSession} onNewSession={newSession}
          onAtelier={()=>go({kind:'atelier'})} onOpenFolder={()=>void openFolder()} onSettings={()=>setSettings(true)}
          onProjectRemoved={()=>go({kind:'atelier'})} onSessionRemoved={()=>undefined} onError={setNotice}/>
        <main className="main-area">
          {notice&&<div className="shell-notice" role="alert"><span>{notice}</span><button onClick={()=>setNotice('')}>Fermer</button></div>}
          {session&&project?<SessionView session={session} diagnostic={diagnostic}/>
            :project?<NewConversation key={project.id} project={project} onCreated={id=>go({kind:'session',projectId:project.id,sessionId:id})} onError={setNotice}/>
            :<AtelierView projects={snapshot.projects} sessions={snapshot.sessions} remembered={remembered} onOpen={openProject} onOpenFolder={()=>void openFolder()}/>}
        </main>
        <RightPanel tab={panel} width={panelWidth} projectId={project?.id} onTab={setPanel} onClose={()=>setPanel(undefined)} onResize={setPanelWidth} onSlot={setPreviewSlot}/>
      </div>
      {settings&&<SettingsScreen items={project?diagnostics[project.id]??[]:[]} loading={!!project&&loading===project.id} onRefresh={()=>{if(project)void diagnose(project.id);}} onClose={()=>{setSettings(false);if(project)void diagnose(project.id);}}/>}
    </div>
  </ShellContext.Provider></SnapshotContext.Provider>;
}
