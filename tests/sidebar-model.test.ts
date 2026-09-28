import { expect,test } from 'vitest';
import type { Phase,Project,Session } from '../src/shared/contracts';
import { needsAttention,phaseLabels,sidebarGroups } from '../src/renderer/src/shell/sidebarModel';
const projects:Project[]=[{id:'a',name:'Lullaby',cwd:'C:/a',folderKey:'a'},{id:'b',name:'Alice',cwd:'C:/b',folderKey:'b'},{id:'c',name:'Vide',cwd:'C:/c',folderKey:'c'}];
const session=(id:string,projectId:string,title:string,phase:Phase='idle'):Session=>({id,projectId,provider:'claude',title,phase,draft:'',choices:{}});
const sessions=[...Array.from({length:7},(_,i)=>session(`a${i}`,'a',`Tâche ${i}`)),session('b0','b','Courses','waiting')];
test('groups follow project order and list newest conversations first, five at a time',()=>{
  const groups=sidebarGroups(projects,sessions);
  expect(groups.map(g=>g.project.id)).toEqual(['a','b','c']);
  expect(groups[0].sessions.map(s=>s.id)).toEqual(['a6','a5','a4','a3','a2']);
  expect(groups[0].hidden).toBe(2);
  expect(groups[2].sessions).toEqual([]);expect(groups[2].hidden).toBe(0);
  expect(sidebarGroups(projects,sessions,{expanded:{a:true}})[0].hidden).toBe(0);
});
test('the active conversation stays visible beyond the limit',()=>{
  const group=sidebarGroups(projects,sessions,{active:'a0'})[0];
  expect(group.sessions.map(s=>s.id)).toEqual(['a6','a5','a4','a3','a2','a0']);expect(group.hidden).toBe(1);
});
test('collapsed groups hide rows but keep the attention signal',()=>{
  const group=sidebarGroups(projects,sessions,{collapsed:{b:true}})[1];
  expect(group.collapsed).toBe(true);expect(group.sessions).toEqual([]);expect(group.attention).toBe('waiting');
  expect(sidebarGroups(projects,[...sessions,session('b1','b','Oups','error')],{collapsed:{b:true}})[1].attention).toBe('error');expect(sidebarGroups(projects,sessions)[0].attention).toBe(false);
});
test('search matches project names or titles, ignores case and expands everything',()=>{
  expect(sidebarGroups(projects,sessions,{query:'  COURSES ',collapsed:{b:true}}).map(g=>[g.project.id,g.collapsed,g.sessions.map(s=>s.id)])).toEqual([['b',false,['b0']]]);
  expect(sidebarGroups(projects,sessions,{query:'lulla'})[0].sessions).toHaveLength(7);
  expect(sidebarGroups(projects,sessions,{query:'introuvable'})).toEqual([]);
});
test('attention and labels cover every phase',()=>{
  expect(['waiting','error','interrupted'].every(phase=>needsAttention(session('x','a','x',phase as Phase)))).toBe(true);
  expect(needsAttention(session('x','a','x','running'))).toBe(false);
  expect(Object.keys(phaseLabels).sort()).toEqual(['done','error','idle','interrupted','running','waiting']);
});
