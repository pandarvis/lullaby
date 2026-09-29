// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
vi.mock('../src/renderer/src/git/GitView',()=>({GitView:({projectId,active}:any)=><output aria-label="Git affiché">{`${projectId}:${active}`}</output>}));
import { RightPanel } from '../src/renderer/src/shell/RightPanel';
afterEach(cleanup);
const props={width:420,onTab:vi.fn(),onClose:vi.fn(),onResize:vi.fn(),onSlot:vi.fn()};
test('closed panel is inert and mounts Git only once opened',()=>{
  const view=render(<RightPanel {...props} projectId="p"/>);
  const panel=view.container.querySelector('.right-panel')!;
  expect(panel.hasAttribute('inert')).toBe(true);expect(panel.classList.contains('open')).toBe(false);
  expect(screen.queryByLabelText('Git affiché')).toBeNull();
  view.rerender(<RightPanel {...props} projectId="p" tab="git"/>);
  expect(panel.hasAttribute('inert')).toBe(false);expect(screen.getByLabelText('Git affiché').textContent).toBe('p:true');
  view.rerender(<RightPanel {...props} projectId="p" tab="preview"/>);
  expect(screen.getByLabelText('Git affiché').textContent).toBe('p:false');
  expect(screen.getByRole('tab',{name:'Aperçu'}).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText(/Aucun aperçu ouvert/)).toBeTruthy();
});
test('tabs, close and keyboard resizing report to the shell',()=>{
  render(<RightPanel {...props} tab="git"/>);
  expect(screen.getByText('Ouvrez un projet pour consulter Git.')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab',{name:'Aperçu'}));expect(props.onTab).toHaveBeenCalledWith('preview');
  fireEvent.click(screen.getByRole('button',{name:'Fermer le panneau'}));expect(props.onClose).toHaveBeenCalled();
  Object.defineProperty(window,'innerWidth',{configurable:true,value:1400});
  fireEvent.keyDown(screen.getByRole('separator',{name:'Redimensionner le panneau'}),{key:'ArrowLeft'});
  expect(props.onResize).toHaveBeenCalledWith(436);
});
