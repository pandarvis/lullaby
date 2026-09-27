import { useState,type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { GitView } from '../git/GitView';
export function ProjectWorkspace({projectId,children,tabsContainer}:{projectId:string;children:ReactNode;tabsContainer?:HTMLElement|null}) {
  const [git,setGit]=useState(false);const [opened,setOpened]=useState(false);
  const tabs=<nav className="project-view-tabs" aria-label="Espace du projet"><button aria-pressed={!git} onClick={()=>setGit(false)}>Conversations</button><button aria-pressed={git} onClick={()=>{setGit(true);setOpened(true);}}>Git</button></nav>;
  return <div className="project-workspace">{tabsContainer?createPortal(tabs,tabsContainer):tabs}<div className="project-conversation-pane" hidden={git}>{children}</div>{opened&&<div className="project-git-pane" hidden={!git}><GitView projectId={projectId} active={git}/></div>}</div>;
}
