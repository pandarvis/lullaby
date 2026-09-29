// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
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
