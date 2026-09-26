import { useState,type ReactNode } from 'react';
import { GitView } from '../git/GitView';
export function ProjectWorkspace({projectId,children}:{projectId:string;children:ReactNode}) {
  const [git,setGit]=useState(false);const [opened,setOpened]=useState(false);
  return <div className="project-workspace"><nav className="project-view-tabs" aria-label="Espace du projet"><button aria-pressed={!git} onClick={()=>setGit(false)}>Conversations</button><button aria-pressed={git} onClick={()=>{setGit(true);setOpened(true);}}>Git</button></nav><div className="project-conversation-pane" hidden={git}>{children}</div>{opened&&<div className="project-git-pane" hidden={!git}><GitView projectId={projectId} active={git}/></div>}</div>;
}
