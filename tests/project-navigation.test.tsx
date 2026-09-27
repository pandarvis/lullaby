// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,within } from '@testing-library/react';
import { App } from '../src/renderer/src/app/App';
import { sessionStore } from '../src/renderer/src/chat/sessionStore';
vi.mock('../src/renderer/src/app/ProjectWorkspace',()=>({ProjectWorkspace:({children}:any)=>children}));
vi.mock('../src/renderer/src/app/ProjectActions',()=>({ProjectActions:()=>null}));
vi.mock('../src/renderer/src/settings/SettingsScreen',()=>({SettingsScreen:()=>null}));
vi.mock('../src/renderer/src/app/ProjectSessions',()=>({ProjectSessions:({project,selected,onSelect}:any)=><div><output aria-label="Conversation sélectionnée">{selected??'aucune'}</output><button onClick={()=>onSelect(`${project.id}-2`)}>Choisir la deuxième</button></div>}));
afterEach(cleanup);
test('project shortcuts remember independent selections after returning Home; settings has one entry',async()=>{
  const snapshot={revision:10,projects:['A','B'].map(id=>({id,name:`Projet ${id}`,cwd:`C:/${id}`,folderKey:id})),sessions:['A','B'].flatMap(projectId=>[1,2].map(n=>({id:`${projectId}-${n}`,projectId,provider:'claude' as const,title:`Session ${projectId}-${n}`,phase:'idle' as const,draft:'',choices:{}}))),messages:{},pending:[]};
  sessionStore.accept(snapshot);
  window.lullaby={subscribe:()=>()=>{},snapshot:async()=>({ok:true,value:snapshot}),diagnose:async()=>({ok:true,value:[]})} as any;
  render(<App/>);
  expect(screen.getAllByRole('button',{name:'Paramètres'})).toHaveLength(1);
  const shortcuts=within(screen.getByRole('navigation',{name:'Projets'}));
  fireEvent.click(shortcuts.getByRole('button',{name:'Projet A'}));
  fireEvent.click(screen.getByRole('button',{name:'Choisir la deuxième'}));
  fireEvent.click(shortcuts.getByRole('button',{name:'Projet B'}));
  fireEvent.click(screen.getByRole('button',{name:'Choisir la deuxième'}));
  fireEvent.click(shortcuts.getByRole('button',{name:'Projet A'}));
  expect(screen.getByLabelText('Conversation sélectionnée').textContent).toBe('A-2');
  fireEvent.click(screen.getByRole('button',{name:'Atelier'}));
  fireEvent.click(within(screen.getByRole('region',{name:'État des projets'})).getByRole('button',{name:/Projet B/}));
  expect(screen.getByLabelText('Conversation sélectionnée').textContent).toBe('B-2');
});
