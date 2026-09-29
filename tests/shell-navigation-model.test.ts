import { expect,test } from 'vitest';
import { back,canBack,canForward,currentView,forward,initialNavigation,navigate,prune,type View } from '../src/renderer/src/shell/navigation';
const a:View={kind:'session',projectId:'p',sessionId:'a'};
const b:View={kind:'session',projectId:'p',sessionId:'b'};
const project:View={kind:'project',projectId:'q'};
test('starts on the Atelier and records visited views',()=>{
  expect(currentView(initialNavigation)).toEqual({kind:'atelier'});
  let nav=navigate(navigate(initialNavigation,a),b);
  expect(currentView(nav)).toEqual(b);expect(canBack(nav)).toBe(true);expect(canForward(nav)).toBe(false);
  nav=back(nav);expect(currentView(nav)).toEqual(a);expect(canForward(nav)).toBe(true);
  nav=forward(nav);expect(currentView(nav)).toEqual(b);
  expect(forward(nav)).toBe(nav);expect(back(initialNavigation)).toBe(initialNavigation);
});
test('navigating from the middle drops forward history and ignores repeats',()=>{
  let nav=back(navigate(navigate(initialNavigation,a),b));
  expect(navigate(nav,a)).toBe(nav);
  nav=navigate(nav,project);
  expect(nav.entries).toEqual([{kind:'atelier'},a,project]);expect(canForward(nav)).toBe(false);
});
test('history keeps the last fifty views',()=>{
  let nav=initialNavigation;
  for(let i=0;i<60;i++)nav=navigate(nav,{kind:'session',projectId:'p',sessionId:String(i)});
  expect(nav.entries).toHaveLength(50);expect(currentView(nav)).toEqual({kind:'session',projectId:'p',sessionId:'59'});
});
test('prune removes deleted views, merges neighbours and keeps a valid position',()=>{
  const nav=navigate(navigate(navigate(navigate(initialNavigation,a),b),a),project);
  const pruned=prune(nav,view=>!(view.kind==='session'&&view.sessionId==='b'));
  expect(pruned.entries).toEqual([{kind:'atelier'},a,project]);expect(currentView(pruned)).toEqual(project);
  const gone=prune(back(nav),view=>view.kind!=='session');
  expect(gone.entries).toEqual([{kind:'atelier'},project]);expect(currentView(gone)).toEqual({kind:'atelier'});
  expect(prune(nav,()=>true)).toBe(nav);
  expect(prune(nav,()=>false)).toEqual(initialNavigation);
});
