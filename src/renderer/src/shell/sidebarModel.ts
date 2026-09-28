import type { Phase, Project, Session } from '../../../shared/contracts';
export const phaseLabels:Record<Phase,string>={idle:'Prête',running:'En cours',waiting:'Attend votre réponse',done:'Terminée',interrupted:'Interrompue',error:'Erreur'};
export const needsAttention=(session:Session)=>session.phase==='waiting'||session.phase==='error'||session.phase==='interrupted';
export type SidebarGroup={project:Project;sessions:Session[];hidden:number;collapsed:boolean;attention:boolean};
export type SidebarOptions={query?:string;collapsed?:Record<string,boolean>;expanded?:Record<string,boolean>;active?:string;limit?:number};
const fold=(text:string)=>text.toLocaleLowerCase('fr');
// Sessions have no timestamp: the snapshot keeps creation order, so newest is last.
export function sidebarGroups(projects:Project[],sessions:Session[],{query='',collapsed={},expanded={},active,limit=5}:SidebarOptions={}):SidebarGroup[]{
  const search=fold(query.trim());
  return projects.flatMap(project=>{
    const own=sessions.filter(session=>session.projectId===project.id).reverse();
    const projectMatch=!search||fold(project.name).includes(search);
    const matching=projectMatch?own:own.filter(session=>fold(session.title).includes(search));
    if(search&&!matching.length&&!projectMatch)return [];
    const attention=own.some(needsAttention);
    if(!search&&collapsed[project.id])return [{project,sessions:[],hidden:0,collapsed:true,attention}];
    const max=search||expanded[project.id]?matching.length:limit;
    const visible=matching.slice(0,max);
    const current=matching.slice(max).find(session=>session.id===active);
    if(current)visible.push(current);
    return [{project,sessions:visible,hidden:matching.length-visible.length,collapsed:false,attention}];
  });
}
