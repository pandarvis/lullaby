import type { Project } from '../../../shared/contracts';
import { GitView } from '../git/GitView';
import { ShellIcon } from './ShellIcon';
// Git needs the width of the main area: history, commit files and diff side by side.
export function GitWorkspace({project,onClose}:{project:Project;onClose:()=>void}){
  return <section className="git-workspace" aria-label={`Git de ${project.name}`}>
    <header className="git-workspace-header">
      <ShellIcon name="git"/><h1>Git</h1><span className="git-workspace-project" title={project.cwd}>{project.name}</span>
      <button className="shell-button" onClick={onClose}><ShellIcon name="back"/>Retour</button>
    </header>
    <GitView key={project.id} projectId={project.id}/>
  </section>;
}
