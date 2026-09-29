// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { ProjectActions } from '../src/renderer/src/app/ProjectActions';
afterEach(cleanup);
const project={id:'a',name:'Lullaby',cwd:'C:/a',folderKey:'a'};
test('the project menu closes on outside pointerdown and on Escape, returning focus',()=>{
  render(<ProjectActions project={project} onRemoved={vi.fn()} onError={vi.fn()}/>);
  const trigger=screen.getByRole('button',{name:'Options du projet'});
  fireEvent.click(trigger);expect(screen.getByLabelText('Nom du projet')).toBeTruthy();
  fireEvent.pointerDown(document.body);expect(screen.queryByLabelText('Nom du projet')).toBeNull();
  fireEvent.click(trigger);expect(screen.getByLabelText('Nom du projet')).toBeTruthy();
  fireEvent.pointerDown(screen.getByLabelText('Nom du projet'));expect(screen.getByLabelText('Nom du projet')).toBeTruthy();
  fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByLabelText('Nom du projet')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
test('renaming is inline and removing asks for a confirmation inside the menu',async()=>{
  const renameProject=vi.fn().mockResolvedValue({ok:true}),removeProject=vi.fn().mockResolvedValue({ok:true}),onRemoved=vi.fn();
  window.lullaby={renameProject,removeProject}as any;
  render(<ProjectActions project={{id:'p',name:'DIA',cwd:'C:/DIA',folderKey:'k'}} onRemoved={onRemoved} onError={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Options du projet'}));
  expect((screen.getByRole('button',{name:'Renommer'})as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Nom du projet'),{target:{value:'DIA web'}});fireEvent.click(screen.getByRole('button',{name:'Renommer'}));
  await waitFor(()=>expect(renameProject).toHaveBeenCalledWith('p','DIA web'));
  fireEvent.click(screen.getByRole('button',{name:'Options du projet'}));fireEvent.click(screen.getByRole('button',{name:/Retirer de Lullaby/}));
  expect(screen.getByRole('alertdialog',{name:'Retirer le projet'}).textContent).toContain('DIA');
  fireEvent.click(screen.getByRole('button',{name:'Retirer'}));await waitFor(()=>expect(onRemoved).toHaveBeenCalled());expect(removeProject).toHaveBeenCalledWith('p');
});
