// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { RightPanel } from '../src/renderer/src/shell/RightPanel';
afterEach(cleanup);
const props={width:420,onTab:vi.fn(),onClose:vi.fn(),onResize:vi.fn(),onSlot:vi.fn()};
test('closed panel is inert and the open panel holds the preview only',()=>{
  const view=render(<RightPanel {...props}/>);
  const panel=view.container.querySelector('.right-panel')!;
  expect(panel.hasAttribute('inert')).toBe(true);expect(panel.classList.contains('open')).toBe(false);
  view.rerender(<RightPanel {...props} tab="preview"/>);
  expect(panel.hasAttribute('inert')).toBe(false);expect(screen.queryByRole('tab',{name:'Git'})).toBeNull();
  expect(screen.getByRole('tab',{name:'Aperçu'}).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText(/Aucun aperçu ouvert/)).toBeTruthy();
});
test('tabs, close and keyboard resizing report to the shell',()=>{
  render(<RightPanel {...props} tab="preview"/>);
  fireEvent.click(screen.getByRole('tab',{name:'Aperçu'}));expect(props.onTab).toHaveBeenCalledWith('preview');
  fireEvent.click(screen.getByRole('button',{name:'Fermer le panneau'}));expect(props.onClose).toHaveBeenCalled();
  Object.defineProperty(window,'innerWidth',{configurable:true,value:1400});
  fireEvent.keyDown(screen.getByRole('separator',{name:'Redimensionner le panneau'}),{key:'ArrowLeft'});
  expect(props.onResize).toHaveBeenCalledWith(436);
});
