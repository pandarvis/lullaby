// @vitest-environment jsdom
import { createRef } from 'react';
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,within } from '@testing-library/react';
import type { Phase,Session } from '../src/shared/contracts';
// Menu labels avoid the project and session titles so row queries stay unambiguous.
vi.mock('../src/renderer/src/app/ProjectActions',()=>({ProjectActions:({project}:any)=><button aria-label={`Menu projet ${project.id}`}/>}));
vi.mock('../src/renderer/src/app/SessionActions',()=>({SessionActions:({session}:any)=><button aria-label={`Menu ${session.id}`}/>}));
import { StateMark } from '../src/renderer/src/shell/StateMark';
import { Sidebar } from '../src/renderer/src/shell/Sidebar';
afterEach(cleanup);
afterEach(cleanup);
test('state marks are labelled and use a shape beyond colour for attention',()=>{
  const {container}=render(<><StateMark phase="waiting"/><StateMark phase="error"/><StateMark phase="running"/></>);
  expect(screen.getByRole('img',{name:'Attend votre réponse'}).querySelector('svg')).toBeTruthy();
  expect(screen.getByRole('img',{name:'Erreur'}).querySelector('svg')).toBeTruthy();
  expect(screen.getByRole('img',{name:'En cours'}).querySelector('svg')).toBeNull();
  expect(container.querySelectorAll('.state-mark')).toHaveLength(3);
});

const projects=[{id:'a',name:'Lullaby',cwd:'C:/a',folderKey:'a'},{id:'b',name:'Alice',cwd:'C:/b',folderKey:'b'},{id:'c',name:'Vide',cwd:'C:/c',folderKey:'c'}];
const session=(id:string,projectId:string,phase:Phase='idle'):Session=>({id,projectId,provider:'claude',title:`Session ${id}`,phase,draft:'',choices:{}});
const sessions=[...['1','2','3','4','5','6'].map(n=>session(`a${n}`,'a')),session('b1','b','waiting')];
function setup(extra={}){
  const p={projects,sessions,view:{kind:'session' as const,projectId:'a',sessionId:'a6'},query:'',collapsed:{},hidden:false,searchRef:createRef<HTMLInputElement>(),
    onQuery:vi.fn(),onToggleGroup:vi.fn(),onOpenSession:vi.fn(),onNewSession:vi.fn(),onAtelier:vi.fn(),onOpenFolder:vi.fn(),onSettings:vi.fn(),onProjectRemoved:vi.fn(),onSessionRemoved:vi.fn(),onError:vi.fn(),...extra};
  return {p,...render(<Sidebar {...p}/>)};
}
test('lists conversations by project, newest first, with the active one marked',()=>{
  const {p}=setup();
  const list=within(screen.getByRole('navigation',{name:'Conversations par projet'}));
  const rows=list.getAllByRole('button',{name:/Session a/});
  expect(rows.map(row=>row.textContent)).toEqual(['Session a6','Session a5','Session a4','Session a3','Session a2']);
  expect(rows[0].getAttribute('aria-current')).toBe('page');
  expect(list.getByText('Aucune conversation')).toBeTruthy();
  fireEvent.click(list.getByRole('button',{name:/Session b1/}));expect(p.onOpenSession).toHaveBeenCalledWith(sessions[6]);
  fireEvent.click(list.getByRole('button',{name:'Afficher tout (6)'}));expect(list.getByRole('button',{name:/Session a1/})).toBeTruthy();
});
test('group header toggles, creates in its project and signals attention when collapsed',()=>{
  const {p}=setup({collapsed:{b:true}});
  fireEvent.click(screen.getByRole('button',{name:'Alice',expanded:false}));expect(p.onToggleGroup).toHaveBeenCalledWith('b');
  expect(screen.getByRole('img',{name:'Une conversation attend votre attention'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Session b1/})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Nouvelle conversation dans Lullaby'}));expect(p.onNewSession).toHaveBeenCalledWith('a');
  fireEvent.click(screen.getByRole('button',{name:'Nouvelle conversation'}));expect(p.onNewSession).toHaveBeenLastCalledWith();
  fireEvent.click(screen.getByRole('button',{name:'Ouvrir un projet'}));expect(p.onOpenFolder).toHaveBeenCalled();
  expect(screen.getAllByRole('button',{name:'Paramètres'})).toHaveLength(1);
});
test('search reports typing, clears with Escape and explains empty results',()=>{
  const {p}=setup({query:'zzz'});
  const input=screen.getByRole('textbox',{name:'Rechercher une conversation'});
  fireEvent.change(input,{target:{value:'abc'}});expect(p.onQuery).toHaveBeenCalledWith('abc');
  fireEvent.keyDown(input,{key:'Escape'});expect(p.onQuery).toHaveBeenLastCalledWith('');
  expect(screen.getByText('Aucun résultat pour « zzz »')).toBeTruthy();
});
test('arrow keys move focus between sidebar rows',()=>{
  setup();
  const atelier=screen.getByRole('button',{name:'Atelier'});atelier.focus();
  fireEvent.keyDown(atelier,{key:'ArrowDown'});expect(document.activeElement).toBe(screen.getByRole('button',{name:'Lullaby',expanded:true}));
  fireEvent.keyDown(document.activeElement!,{key:'ArrowUp'});expect(document.activeElement).toBe(atelier);
});
test('hidden sidebar is inert',()=>{
  const {container}=setup({hidden:true});expect(container.querySelector('.sidebar')!.hasAttribute('inert')).toBe(true);
});
