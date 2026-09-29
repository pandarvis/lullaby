// @vitest-environment jsdom
import { afterEach,expect,test } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { useRef,useState } from 'react';
import { useDismiss } from '../src/renderer/src/app/useDismiss';
afterEach(cleanup);
function Menu(){
  const [open,setOpen]=useState(false);const menu=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  useDismiss(open,()=>setOpen(false),[menu,trigger],trigger);
  return <><button ref={trigger} onClick={()=>setOpen(!open)}>Ouvrir</button>{open&&<div ref={menu}><button>Dans le menu</button></div>}<p>Dehors</p></>;
}
test('a menu closes on outside press or Escape, stays open inside, trigger still toggles',()=>{
  render(<Menu/>);const trigger=screen.getByText('Ouvrir');
  fireEvent.click(trigger);fireEvent.pointerDown(screen.getByText('Dans le menu'));expect(screen.queryByText('Dans le menu')).toBeTruthy();
  fireEvent.pointerDown(screen.getByText('Dehors'));expect(screen.queryByText('Dans le menu')).toBeNull();
  fireEvent.click(trigger);fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByText('Dans le menu')).toBeNull();expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);fireEvent.pointerDown(trigger);fireEvent.click(trigger);expect(screen.queryByText('Dans le menu')).toBeNull();
});
