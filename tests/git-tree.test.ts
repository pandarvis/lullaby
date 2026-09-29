import { expect,test } from 'vitest';
import { buildChangeTree } from '../src/renderer/src/git/tree';
test('preserves two versions of a file and literal HTML-like names',()=>{
  const tree=buildChangeTree([{id:'a',path:'src/a.ts',area:'index',status:'M'},{id:'b',path:'src/a.ts',area:'worktree',status:'M'},{id:'c',path:'<script>.txt',area:'untracked',status:'?'}]);
  expect(tree.find(n=>n.name==='src')!.children[0].changes.map(c=>c.area)).toEqual(['index','worktree']);expect(tree.some(n=>n.name==='<script>.txt')).toBe(true);
});
