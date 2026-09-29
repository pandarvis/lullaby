// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import type { Session } from '../src/shared/contracts';
import { ProjectOverview,projectFocus } from '../src/renderer/src/app/ProjectOverview';
afterEach(cleanup);
const project={id:'p',name:'Projet A',cwd:'C:/A',folderKey:'c:/a'};
const session=(id:string,phase:Session['phase']):Session=>({id,projectId:'p',provider:'claude',title:`Conversation ${id}`,phase,draft:'',choices:{}});
test('focus prioritizes attention and running work, then remembers the conversation',()=>{
  const sessions=[session('a','done'),session('b','idle')];
  expect(projectFocus(sessions,'a')?.id).toBe('a');
  expect(projectFocus([...sessions,session('c','running')],'a')?.id).toBe('c');
  expect(projectFocus([...sessions,session('c','running'),session('d','waiting')],'a')?.id).toBe('d');
  expect(projectFocus([session('a','error'),session('b','done')],'b')?.id).toBe('a');
  expect(projectFocus(sessions,'deleted')?.id).toBe('a');
  expect(projectFocus([])).toBeUndefined();
});
test('project rows update from live snapshots and open the relevant conversation',()=>{
  const open=vi.fn();const props={projects:[project],onOpen:open,remembered:{}};
  const view=render(<ProjectOverview {...props} sessions={[session('a','running')]}/>);
  expect(screen.getByText('En cours')).toBeTruthy();
  view.rerender(<ProjectOverview {...props} sessions={[session('a','done'),session('b','waiting')]}/>);
  fireEvent.click(screen.getByRole('button',{name:/Projet A/}));expect(open).toHaveBeenCalledWith('p','b');
  expect(screen.getByText('Attend ta réponse')).toBeTruthy();
  expect(screen.getByText('1 à traiter')).toBeTruthy();
  view.rerender(<ProjectOverview {...props} sessions={[]}/>);
  expect(screen.getByText('Aucune conversation')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Projet A/}));expect(open).toHaveBeenLastCalledWith('p',undefined);
});
