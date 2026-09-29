// @vitest-environment jsdom
import { afterEach,beforeEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,within } from '@testing-library/react';
vi.mock('../src/renderer/src/app/ProjectSessions',()=>({
  SessionView:({session}:any)=><output aria-label="Conversation affichée">{session.id}</output>,
  NewConversation:({project}:any)=><output aria-label="Nouvelle conversation">{project.id}</output>,
}));
vi.mock('../src/renderer/src/app/ProjectActions',()=>({ProjectActions:({project,onRemoved}:any)=><button aria-label={`Retirer ${project.id}`} onClick={onRemoved}/>}));
vi.mock('../src/renderer/src/app/SessionActions',()=>({SessionActions:({session,onRemoved}:any)=><button aria-label={`Supprimer ${session.id}`} onClick={()=>onRemoved(session.id)}/>}));
vi.mock('../src/renderer/src/settings/SettingsScreen',()=>({SettingsScreen:()=><div role="dialog" aria-label="Paramètres ouverts"/>}));
vi.mock('../src/renderer/src/git/GitView',()=>({GitView:({projectId}:any)=><output aria-label="Git affiché">{projectId}</output>}));
import { App } from '../src/renderer/src/app/App';
import { sessionStore } from '../src/renderer/src/chat/sessionStore';
beforeEach(()=>localStorage.clear());
afterEach(cleanup);
let revision=100;
function start(){
  const snapshot={revision:++revision,projects:['A','B'].map(id=>({id,name:`Projet ${id}`,cwd:`C:/${id}`,folderKey:id})),sessions:['A','B'].flatMap(projectId=>[1,2].map(n=>({id:`${projectId}-${n}`,projectId,provider:'claude' as const,title:`Session ${projectId}-${n}`,phase:'idle' as const,draft:'',choices:{}}))),messages:{},pending:[]};
  sessionStore.accept(snapshot);
  window.lullaby={subscribe:()=>()=>{},snapshot:async()=>({ok:true,value:snapshot}),diagnose:async()=>({ok:true,value:[]}),pickProject:vi.fn()} as any;
  return render(<App/>);
}
const shown=()=>screen.getByLabelText('Conversation affichée').textContent;
const sidebar=()=>within(screen.getByRole('navigation',{name:'Conversations par projet'}));
test('sidebar, history and the Atelier share one navigation',()=>{
  start();
  expect(screen.getByRole('region',{name:'État des projets'})).toBeTruthy();
  fireEvent.click(sidebar().getByRole('button',{name:/Session A-2/}));expect(shown()).toBe('A-2');
  expect(screen.getByRole('button',{name:/Projet A/,expanded:false})).toBeTruthy();
  fireEvent.click(sidebar().getByRole('button',{name:/Session B-1/}));expect(shown()).toBe('B-1');
  fireEvent.click(screen.getByRole('button',{name:'Précédent'}));expect(shown()).toBe('A-2');
  fireEvent.click(screen.getByRole('button',{name:'Suivant'}));expect(shown()).toBe('B-1');
  fireEvent.keyDown(window,{key:'ArrowLeft',altKey:true});expect(shown()).toBe('A-2');
  fireEvent.click(screen.getByRole('button',{name:'Atelier'}));
  fireEvent.click(within(screen.getByRole('region',{name:'État des projets'})).getByRole('button',{name:/Projet A/}));
  expect(shown()).toBe('A-2');
  expect(screen.getAllByRole('button',{name:'Paramètres'})).toHaveLength(1);
});
test('new conversations open in the chosen project, or ask for one',()=>{
  start();
  fireEvent.click(screen.getByRole('button',{name:'Nouvelle conversation dans Projet B'}));
  expect(screen.getByLabelText('Nouvelle conversation').textContent).toBe('B');
  fireEvent.click(screen.getByRole('button',{name:'Atelier'}));
  fireEvent.keyDown(window,{key:'n',ctrlKey:true});
  fireEvent.click(screen.getByRole('menuitem',{name:/Projet A/}));
  expect(screen.getByLabelText('Nouvelle conversation').textContent).toBe('A');
});
test('sidebar and panel toggles are remembered and follow the current project',()=>{
  const {container}=start();
  fireEvent.keyDown(window,{key:'b',ctrlKey:true});
  expect(container.querySelector('.iris-shell')!.classList.contains('sidebar-hidden')).toBe(true);
  expect(localStorage.getItem('lullaby.sidebar-hidden')).toBe('true');
  fireEvent.keyDown(window,{key:'b',ctrlKey:true});
  fireEvent.click(sidebar().getByRole('button',{name:/Session B-2/}));
  fireEvent.keyDown(window,{key:'j',ctrlKey:true});
  expect(container.querySelector('.right-panel')!.classList.contains('open')).toBe(true);
  fireEvent.keyDown(window,{key:'j',ctrlKey:true});
  expect(container.querySelector('.right-panel')!.classList.contains('open')).toBe(false);
});
test('Git opens full width for the current project and returns to the conversation',()=>{
  start();
  fireEvent.click(sidebar().getByRole('button',{name:/Session B-2/}));
  fireEvent.click(screen.getByRole('button',{name:'Git'}));
  expect(screen.getByRole('region',{name:'Git de Projet B'})).toBeTruthy();expect(screen.getByLabelText('Git affiché').textContent).toBe('B');
  expect(screen.getByRole('button',{name:'Git'}).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button',{name:'Retour'}));
  expect(screen.queryByLabelText('Git affiché')).toBeNull();expect(screen.getByRole('button',{name:'Git'}).getAttribute('aria-pressed')).toBe('false');
  fireEvent.keyDown(window,{key:'g',ctrlKey:true,shiftKey:true});expect(screen.getByLabelText('Git affiché').textContent).toBe('B');
});
test('collapsing a group is remembered',()=>{
  start();
  fireEvent.click(screen.getByRole('button',{name:'Projet A',expanded:true}));
  expect(JSON.parse(localStorage.getItem('lullaby.sidebar-groups')!)).toEqual({A:true});
  expect(sidebar().queryByRole('button',{name:/Session A-1/})).toBeNull();
});
test('opening a conversation of a collapsed group expands it again',()=>{
  start();
  fireEvent.click(sidebar().getByRole('button',{name:/Session A-2/}));
  fireEvent.click(screen.getByRole('button',{name:'Atelier'}));
  fireEvent.click(screen.getByRole('button',{name:'Projet A',expanded:true}));
  expect(sidebar().queryByRole('button',{name:/Session A-2/})).toBeNull();
  fireEvent.click(within(screen.getByRole('region',{name:'État des projets'})).getByRole('button',{name:/Projet A/}));
  expect(shown()).toBe('A-2');
  expect(screen.getByRole('button',{name:'Projet A',expanded:true})).toBeTruthy();
  expect(sidebar().getByRole('button',{name:/Session A-2/})).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('lullaby.sidebar-groups')!)).toEqual({A:false});
});
test('the group of the open conversation can still be collapsed by hand',()=>{
  start();
  fireEvent.click(sidebar().getByRole('button',{name:/Session A-2/}));
  fireEvent.click(sidebar().getByRole('button',{name:'Projet A',expanded:true}));
  expect(sidebar().getByRole('button',{name:'Projet A',expanded:false})).toBeTruthy();
  expect(shown()).toBe('A-2');
});
test('removing another project keeps the open conversation; removing the open one returns to its project',()=>{
  start();
  fireEvent.click(sidebar().getByRole('button',{name:/Session A-2/}));
  fireEvent.click(screen.getByRole('button',{name:'Retirer B'}));
  expect(shown()).toBe('A-2');
  fireEvent.click(screen.getByRole('button',{name:'Supprimer A-1'}));
  expect(shown()).toBe('A-2');
  fireEvent.click(screen.getByRole('button',{name:'Supprimer A-2'}));
  expect(screen.getByLabelText('Nouvelle conversation').textContent).toBe('A');
});
test('shortcuts stay inactive while a modal dialog is open',()=>{
  const {container}=start();
  const modal=document.createElement('div');modal.setAttribute('aria-modal','true');document.body.append(modal);
  try{fireEvent.keyDown(window,{key:'b',ctrlKey:true});expect(container.querySelector('.iris-shell')!.classList.contains('sidebar-hidden')).toBe(false);}finally{modal.remove();}
});
test('a stored panel width is fitted to the window without overwriting the preference',()=>{
  localStorage.setItem('lullaby.panel-width','900');const before=window.innerWidth;Object.defineProperty(window,'innerWidth',{value:1000,configurable:true});
  try{const {container}=start();expect((container.querySelector('.right-panel') as HTMLElement).style.getPropertyValue('--panel-width')).toBe('600px');expect(localStorage.getItem('lullaby.panel-width')).toBe('900');}
  finally{Object.defineProperty(window,'innerWidth',{value:before,configurable:true});}
});
