import type { Phase, Project, Session } from '../../../shared/contracts';
import { ProjectEmblem } from './ProjectEmblem';
import { ProviderLogo } from './UiIcon';

const labels:Record<Phase,string>={idle:'Prêt',running:'En cours',waiting:'Attend ta réponse',done:'Terminé',interrupted:'Interrompu',error:'À vérifier'};
const attention=(session:Session)=>['waiting','error','interrupted'].includes(session.phase);
export function projectFocus(sessions:Session[],remembered?:string){
  for(const phase of ['waiting','running','error','interrupted'] as const){
    const matches=sessions.filter(session=>session.phase===phase);
    if(matches.length)return matches.find(session=>session.id===remembered)??matches[0];
  }
  return sessions.find(session=>session.id===remembered)??sessions.find(session=>session.phase==='done')??sessions[0];
}

export function ProjectOverview({projects,sessions,remembered,onOpen}:{projects:Project[];sessions:Session[];remembered:Record<string,string|undefined>;onOpen:(projectId:string,sessionId?:string)=>void}){
  const running=sessions.filter(session=>session.phase==='running').length;
  const waiting=sessions.filter(attention).length;
  return <section className="project-overview" aria-label="État des projets">
    <div className="overview-summary" role="status"><span>{projects.length} projet{projects.length>1?'s':''}</span><span className={running?'summary-running':''}>{running} en cours</span><span className={waiting?'summary-attention':''}>{waiting} à traiter</span></div>
    <div className="overview-columns" aria-hidden="true"><span>Projet</span><span>Conversation</span><span>État</span></div>
    <div className="project-rows">{projects.map(project=>{
      const items=sessions.filter(session=>session.projectId===project.id);
      const focus=projectFocus(items,remembered[project.id]);const needs=items.filter(attention).length;
      return <button className={`project-row ${focus?.phase??'empty'}`} key={project.id} onClick={()=>onOpen(project.id,focus?.id)}>
        <span className="overview-project"><span className="overview-emblem"><ProjectEmblem projectId={project.id}/></span><span className="overview-project-text"><strong>{project.name}</strong><small title={project.cwd}>{project.cwd}</small></span></span>
        <span className="overview-conversation">{focus?<><span className="overview-session-title"><ProviderLogo provider={focus.provider}/><span title={focus.title}>{focus.title}</span></span><small>{items.length} conversation{items.length>1?'s':''}{needs>0?` · ${needs} à traiter`:''}</small></>:<small>Aucune conversation</small>}</span>
        <span className="overview-state"><span className={`phase ${focus?.phase??'idle'}`}><i aria-hidden="true"/>{focus?labels[focus.phase]:'À démarrer'}</span><span className="overview-chevron" aria-hidden="true">›</span></span>
      </button>;
    })}</div>
  </section>;
}
