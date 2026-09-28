import type { Project, Session } from '../../../shared/contracts';
import logo from '../assets/lullaby.svg';
import { ProjectOverview } from '../app/ProjectOverview';
type Props={projects:Project[];sessions:Session[];remembered:Record<string,string|undefined>;onOpen:(projectId:string,sessionId?:string)=>void;onOpenFolder:()=>void};
export function AtelierView({projects,sessions,remembered,onOpen,onOpenFolder}:Props){
  if(!projects.length)return <section className="atelier-empty"><img src={logo} alt=""/><h1>Ouvrir un projet</h1><p>Ouvrez un dossier pour retrouver ici vos conversations et suivre le travail de vos agents.</p><button className="shell-button primary" onClick={onOpenFolder}>Choisir un dossier</button></section>;
  return <section className="atelier"><header className="main-header"><h1>Atelier</h1></header><div className="atelier-body"><ProjectOverview projects={projects} sessions={sessions} remembered={remembered} onOpen={onOpen}/></div></section>;
}
