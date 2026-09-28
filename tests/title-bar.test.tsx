// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { TitleBar } from '../src/renderer/src/shell/TitleBar';
afterEach(cleanup);
const projects=[{id:'a',name:'Lullaby',cwd:'C:/Sources/lullaby',folderKey:'a'},{id:'b',name:'Alice',cwd:'C:/Sources/alice',folderKey:'b'}];
const sessions=[{id:'s',projectId:'a',provider:'claude' as const,title:'T',phase:'idle' as const,draft:'',choices:{}}];
function props(extra={}){return {projects,sessions,sidebarHidden:false,canBack:false,canForward:true,menuOpen:false,onMenu:vi.fn(),onToggleSidebar:vi.fn(),onBack:vi.fn(),onForward:vi.fn(),onSelectProject:vi.fn(),onAtelier:vi.fn(),onTogglePanel:vi.fn(),...extra};}
test('shows the current project, its path and navigation state',()=>{
  const p=props({project:projects[0],panel:'git'});render(<TitleBar {...p}/>);
  expect(screen.getByRole('button',{name:/Lullaby/,expanded:false})).toBeTruthy();
  expect(screen.getByText('C:/Sources/lullaby')).toBeTruthy();
  expect((screen.getByRole('button',{name:'Précédent'})as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Suivant'}));expect(p.onForward).toHaveBeenCalled();
  expect(screen.getByRole('button',{name:'Git'}).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button',{name:'Aperçu'}));expect(p.onTogglePanel).toHaveBeenCalledWith('preview');
  fireEvent.click(screen.getByRole('button',{name:'Masquer la barre latérale'}));expect(p.onToggleSidebar).toHaveBeenCalled();
});
test('the project menu lists the Atelier and projects, then closes',()=>{
  const p=props({menuOpen:true});render(<TitleBar {...p}/>);
  expect(screen.getByRole('button',{name:/Atelier/,expanded:true})).toBeTruthy();
  expect(screen.getByRole('menuitem',{name:/Alice/}).textContent).toContain('0 conv.');
  fireEvent.click(screen.getByRole('menuitem',{name:/Lullaby/}));
  expect(p.onMenu).toHaveBeenCalledWith(false);expect(p.onSelectProject).toHaveBeenCalledWith('a');
  fireEvent.keyDown(document,{key:'Escape'});expect(p.onMenu).toHaveBeenCalledTimes(2);
});
