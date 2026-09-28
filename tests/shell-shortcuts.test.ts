// @vitest-environment jsdom
import { expect,test,vi } from 'vitest';
import { fireEvent,renderHook } from '@testing-library/react';
import { shortcutFor,useShortcuts } from '../src/renderer/src/shell/shortcuts';
import { clampPanelWidth } from '../src/renderer/src/shell/panel';
const key=(key:string,mods:Partial<Record<'ctrlKey'|'altKey'|'shiftKey'|'metaKey',boolean>>={})=>({key,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false,...mods});
test('maps the documented shortcuts only',()=>{
  expect(shortcutFor(key('b',{ctrlKey:true}))).toBe('toggleSidebar');
  expect(shortcutFor(key('J',{ctrlKey:true}))).toBe('togglePanel');
  expect(shortcutFor(key('k',{ctrlKey:true}))).toBe('search');
  expect(shortcutFor(key('n',{ctrlKey:true}))).toBe('newSession');
  expect(shortcutFor(key('ArrowLeft',{altKey:true}))).toBe('back');
  expect(shortcutFor(key('ArrowRight',{altKey:true}))).toBe('forward');
  expect(shortcutFor(key('b'))).toBeUndefined();
  expect(shortcutFor(key('b',{ctrlKey:true,shiftKey:true}))).toBeUndefined();
  expect(shortcutFor(key('ArrowLeft',{altKey:true,ctrlKey:true}))).toBeUndefined();
});
test('useShortcuts calls the latest handler and prevents the browser default',()=>{
  const first=vi.fn(),second=vi.fn();
  const handlers=(toggleSidebar:()=>void)=>({toggleSidebar,togglePanel:vi.fn(),search:vi.fn(),newSession:vi.fn(),back:vi.fn(),forward:vi.fn()});
  const {rerender,unmount}=renderHook(({h})=>useShortcuts(h),{initialProps:{h:handlers(first)}});
  rerender({h:handlers(second)});
  const event=new KeyboardEvent('keydown',{key:'b',ctrlKey:true,cancelable:true});
  window.dispatchEvent(event);
  expect(first).not.toHaveBeenCalled();expect(second).toHaveBeenCalledOnce();expect(event.defaultPrevented).toBe(true);
  unmount();fireEvent.keyDown(window,{key:'b',ctrlKey:true});expect(second).toHaveBeenCalledOnce();
});
test('panel width stays between 320 px and 60 % of the window',()=>{
  expect(clampPanelWidth(200,1400)).toBe(320);
  expect(clampPanelWidth(500.4,1400)).toBe(500);
  expect(clampPanelWidth(1000,1400)).toBe(840);
  expect(clampPanelWidth(600,400)).toBe(320);
});
