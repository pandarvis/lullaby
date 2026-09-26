import { useContext,useEffect,useRef,useState } from 'react';
import type { GitSnapshot,GitChange,GitDiff,CommitChange } from '../../../shared/git';
import { SnapshotContext } from '../chat/sessionStore';
import { CommitGraph } from './CommitGraph';
import { CommitDetails } from './CommitDetails';
import { ChangesTree } from './ChangesTree';
import { DiffView } from './DiffView';
import './git.css';
const noFiles:CommitChange[]=[];
export function GitView({projectId,active=true}:{projectId:string;active?:boolean}) {
  const [snapshot,setSnapshot]=useState<GitSnapshot>();const [tab,setTab]=useState<'history'|'changes'>('history');
  const [oid,setOid]=useState<string>();const [parent,setParent]=useState<string|null>(null);
  const [listing,setListing]=useState<{key:string;files:CommitChange[]}>();const [selection,setSelection]=useState<GitChange>();
  const [diff,setDiff]=useState<GitDiff>();const [error,setError]=useState('');const [loading,setLoading]=useState(false);const [detailLoading,setDetailLoading]=useState(false);
  const [refresh,setRefresh]=useState(0);const readSerial=useRef(0);const currentProject=useRef(projectId);currentProject.current=projectId;
  const visible=snapshot?.projectId===projectId?snapshot:undefined;const commit=visible?.commits.find(c=>c.oid===oid);
  const comparison=commit?.parents.includes(parent??'')?parent:commit?.parents[0]??null;
  const listingKey=`${visible?.id}:${commit?.oid}:${comparison}`;
  const files=listing?.key===listingKey?listing.files:noFiles;
  const agentState=useContext(SnapshotContext);const phases=agentState.sessions.filter(s=>s.projectId===projectId).map(s=>`${s.id}:${s.phase}`).join('|');
  const previousPhases=useRef(phases);
  useEffect(()=>{
    if(!active)return;let timer:ReturnType<typeof setTimeout>|undefined;
    const queue=()=>{clearTimeout(timer);timer=setTimeout(()=>setRefresh(n=>n+1),300);};
    window.addEventListener('focus',queue);
    if(previousPhases.current!==phases&&/:(running|waiting)/.test(previousPhases.current))queue();
    previousPhases.current=phases;
    return()=>{clearTimeout(timer);window.removeEventListener('focus',queue);};
  },[phases,active]);
  useEffect(()=>{
    if(!active)return;let disposed=false;const serial=++readSerial.current;
    setLoading(true);setListing(undefined);setError('');setDiff(undefined);
    void window.lullaby.git.read(projectId).then(result=>{
      if(disposed||serial!==readSerial.current||currentProject.current!==projectId)return;
      if(result.ok){setSnapshot(result.value);setOid(previous=>result.value.commits.some(c=>c.oid===previous)?previous:result.value.commits[0]?.oid);}
      else if(result.code!=='GIT_CANCELLED')setError(result.message);
    }).catch(()=>{if(!disposed)setError('Lecture Git indisponible.');}).finally(()=>{if(!disposed)setLoading(false);});
    return()=>{disposed=true;void window.lullaby.git.cancel(projectId);};
  },[projectId,refresh,active]);
  useEffect(()=>{
    if(!active||loading||!visible||tab!=='history'||!commit)return;
    let disposed=false;setDetailLoading(true);setListing(undefined);setDiff(undefined);
    void window.lullaby.git.commitFiles(visible.id,commit.oid,comparison).then(result=>{
      if(disposed)return;if(result.ok){setListing({key:listingKey,files:result.value});setSelection(previous=>result.value.some(file=>file.id===previous?.id)?previous:undefined);}else if(result.code!=='GIT_CANCELLED')setError(result.message);
    }).catch(()=>{if(!disposed)setError('Impossible de lire les fichiers du commit.');}).finally(()=>{if(!disposed)setDetailLoading(false);});
    return()=>{disposed=true;void window.lullaby.git.cancel(projectId,'files');};
  },[active,loading,visible?.id,commit?.oid,comparison,tab]);
  useEffect(()=>{
    if(!active||loading||!visible||!selection)return;
    if(tab==='history'&&!files.some(file=>file.id===selection.id))return;
    if(tab==='changes'&&!visible.changes.some(file=>file.id===selection.id))return;
    let disposed=false;setDiff(undefined);setDetailLoading(true);
    const target=tab==='history'?{kind:'commit' as const,oid:commit!.oid,parent:comparison,changeId:selection.id}:{kind:'local' as const,changeId:selection.id};
    void window.lullaby.git.diff(visible.id,target).then(result=>{if(disposed)return;if(result.ok)setDiff(result.value);else if(result.code!=='GIT_CANCELLED')setError(result.message);}).catch(()=>{if(!disposed)setError('Impossible de lire cette différence.');}).finally(()=>{if(!disposed)setDetailLoading(false);});
    return()=>{disposed=true;void window.lullaby.git.cancel(projectId,'diff');};
  },[active,loading,visible?.id,selection?.id,tab,commit?.oid,comparison,files]);
  async function loadMore(){if(!visible)return;const serial=++readSerial.current;setLoading(true);setListing(undefined);setError('');try{const result=await window.lullaby.git.loadMore(visible.id);if(serial!==readSerial.current||currentProject.current!==projectId)return;if(result.ok)setSnapshot(result.value);else if(result.code!=='GIT_CANCELLED')setError(result.message);}catch{setError('Chargement de l’historique impossible.');}finally{if(serial===readSerial.current)setLoading(false);}}
  function switchTab(next:'history'|'changes'){setTab(next);setSelection(undefined);setDiff(undefined);setError('');}
  const empty=visible?.state==='not-repository'?'Ce dossier ne fait pas partie d’un dépôt Git.':visible?.state==='git-unavailable'?'Git est introuvable sur ce poste. Installez Git for Windows pour consulter cette vue.':undefined;
  return <section className="git-view" aria-label="Vue Git">
    <div className="git-toolbar"><div className="git-tabs" role="tablist" aria-label="Vues Git"><button role="tab" aria-selected={tab==='history'} onClick={()=>switchTab('history')}>Historique</button><button role="tab" aria-selected={tab==='changes'} onClick={()=>switchTab('changes')}>Modifications {visible?`(${visible.changes.length})`:''}</button></div><span className="git-caption">Consultation · références distantes connues localement</span><button className="secondary" disabled={loading} onClick={()=>setRefresh(n=>n+1)}>Actualiser</button></div>
    {visible&&<div className="git-location"><span className="git-branch">{visible.branch??(visible.head?'HEAD détachée':'Sans branche')}</span><span className="git-caption">{visible.root}</span><time className="git-caption">Relevé à {new Date(visible.capturedAt).toLocaleTimeString('fr-FR')}</time></div>}
    {error&&<div className="git-error" role="alert">{error}</div>}{loading&&<div role="status" className="git-caption">Lecture du dépôt…</div>}
    {visible?.changedDuringRead&&<div className="git-warning">Le dépôt a changé pendant la lecture. Les commits affichés restent ceux du relevé initial ; actualisez pour voir le nouvel état.</div>}
    {empty?<div className="git-panel git-empty">{empty}</div>:visible&&<>
      {tab==='history'&&<section className="git-panel"><div className="git-panel-heading"><h2>Le fil du projet</h2><span className="git-count">{visible.commits.length} commits</span></div><CommitGraph snapshot={visible} selected={oid} onSelect={next=>{setOid(next);setParent(null);setSelection(undefined);setDiff(undefined);setError('');}}/>{visible.truncated&&<div className="git-load-more">{visible.commits.length>=2000?<span className="git-caption">2 000 commits affichés · limite atteinte</span>:<button className="secondary" disabled={loading} onClick={()=>void loadMore()}>Charger plus</button>}<span className="git-caption"> · Les traits pointillés continuent hors de cette page.</span></div>}</section>}
      <section className="git-panel">{tab==='history'&&commit?<CommitDetails commit={commit} refs={visible.refs.filter(ref=>ref.oid===commit.oid)} parent={comparison} onParent={value=>{setParent(value);setSelection(undefined);setDiff(undefined);setError('');}}/>:<div className="git-panel-heading"><h2>Dans votre dossier</h2><span className="git-caption">Tous les changements locaux, quel que soit leur auteur</span></div>}
        <div className="git-inspection"><aside className="git-files-pane"><ChangesTree changes={tab==='changes'?visible.changes:files.map(file=>({...file,area:'index'}))} grouped={tab==='changes'} selected={selection?.id} onSelect={file=>{setSelection(file);setError('');}}/></aside><div className="git-diff-pane">{selection&&<div className="git-diff-path">{selection.oldPath&&<span>{selection.oldPath} → </span>}{selection.path}</div>}{detailLoading?<div className="git-empty" role="status">Lecture de la différence…</div>:diff?<DiffView diff={diff}/>:<div className="git-empty">Sélectionnez un fichier pour lire ses changements.{selection?.area==='conflict'&&' Ce fichier est en conflit.'}</div>}</div></div>
      </section>
    </>}
  </section>;
}
