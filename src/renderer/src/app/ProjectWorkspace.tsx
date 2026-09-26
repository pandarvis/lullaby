import { useState,type ReactNode } from 'react';
import { GitView } from '../git/GitView';
export function ProjectWorkspace({projectId,children}:{projectId:string;children:ReactNode}) {
  const [git,setGit]=useState(false);const [opened,setOpened]=useState(false);
  return <><nav className="project-view-tabs" aria-label="Espace du projet"><button aria-pressed={!git} onClick={()=>setGit(false)}>Conversations</button><button aria-pressed={git} onClick={()=>{setGit(true);setOpened(true);}}>Git</button></nav><div hidden={git}>{children}</div>{opened&&<div hidden={!git}><GitView projectId={projectId} active={git}/></div>}</>;
}
