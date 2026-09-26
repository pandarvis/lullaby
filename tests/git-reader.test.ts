import { expect,test } from 'vitest';
import { writeFile, readFile, mkdtemp, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { GitReader } from '../src/main/git/reader';
import { repository,commit,git } from './fixtures/git-repository';
const reader=(cwd:string)=>new GitReader(id=>id==='p'?cwd:undefined);
test('empty repository, non-repository, missing Git and detached worktree are explicit',async()=>{
  const cwd=await repository();expect((await reader(cwd).read('p')).state).toBe('unborn');
  const plain=await mkdtemp(join(tmpdir(),'lullaby-no-git-'));expect((await reader(plain).read('p')).state).toBe('not-repository');
  const unavailable=new GitReader(()=>cwd,{executable:'lullaby-nonexistent-git'});expect((await unavailable.read('p')).state).toBe('git-unavailable');
  const oid=await commit(cwd,'a.txt','a','root');await git(cwd,'checkout','--detach');
  const detached=await reader(cwd).read('p');expect(detached.head).toBe(oid);expect(detached.branch).toBeNull();
  const worktree=join(await mkdtemp(join(tmpdir(),'lullaby-worktree-')),'checkout');await git(cwd,'worktree','add','--detach',worktree,oid);
  expect((await reader(worktree).read('p')).head).toBe(oid);
},20000);
test('merge parents, annotated tags and literal local/commit diffs preserve repository bytes',async()=>{
  const cwd=await repository();const root=await commit(cwd,'docs/ancien été.md','base\n','root');
  await git(cwd,'checkout','-b','feature');const feature=await commit(cwd,'feature.txt','feature\n','feature');
  await git(cwd,'checkout','main');const main=await commit(cwd,'main.txt','main\n','main');
  await git(cwd,'merge','--no-ff','feature','-m','merge');await git(cwd,'tag','-a','v-test','-m','tag');
  await git(cwd,'mv','docs/ancien été.md','docs/nouveau été.md');
  await writeFile(join(cwd,'main.txt'),'staged\n');await git(cwd,'add','main.txt');await writeFile(join(cwd,'main.txt'),'working\n');
  await writeFile(join(cwd,'-note.md'),'literal\n');
  const indexBefore=await readFile(join(cwd,'.git/index'));const refsBefore=await git(cwd,'show-ref');
  const r=reader(cwd);const s=await r.read('p');expect(s.commits[0].parents).toEqual([main,feature]);expect(s.refs.find(x=>x.name==='v-test')?.oid).toBe(s.head);
  expect(s.changes.find(c=>c.oldPath)?.oldPath).toBe('docs/ancien été.md');
  for(const area of ['index','worktree'] as const){const change=s.changes.find(c=>c.path==='main.txt'&&c.area===area)!;expect((await r.diff(s.id,{kind:'local',changeId:change.id})).text).toContain(area==='index'?'+staged':'+working');}
  const files=await r.commitFiles(s.id,s.head!,feature);expect(files.map(f=>f.path)).toContain('main.txt');
  const rootFiles=await r.commitFiles(s.id,root,null);expect((await r.diff(s.id,{kind:'commit',oid:root,parent:null,changeId:rootFiles[0].id})).text).toContain('+base');
  await expect(r.commitFiles(s.id,'--output=evil',null)).rejects.toThrow('INVALID_TARGET');
  await expect(r.commitFiles(s.id,s.head!,root)).rejects.toThrow('INVALID_TARGET');
  await expect(r.diff(s.id,{kind:'local',changeId:'../../outside'})).rejects.toThrow('INVALID_TARGET');
  expect(await readFile(join(cwd,'.git/index'))).toEqual(indexBefore);expect(await git(cwd,'show-ref')).toBe(refsBefore);expect(await readFile(join(cwd,'main.txt'),'utf8')).toBe('working\n');
},30000);
test('untracked binary, long diff and replaced directory symlink do not escape the repository',async()=>{
  const cwd=await repository();await commit(cwd,'tracked.txt','small\n','root');
  await writeFile(join(cwd,'binary.bin'),Buffer.from([0,1,2]));await writeFile(join(cwd,'large.txt'),'a'.repeat(1100000));
  const r=reader(cwd);let s=await r.read('p');
  expect((await r.diff(s.id,{kind:'local',changeId:s.changes.find(c=>c.path==='binary.bin')!.id})).kind).toBe('binary');
  expect((await r.diff(s.id,{kind:'local',changeId:s.changes.find(c=>c.path==='large.txt')!.id})).truncated).toBe(true);
  await writeFile(join(cwd,'tracked.txt'),'b'.repeat(1100000));s=await r.read('p');expect((await r.diff(s.id,{kind:'local',changeId:s.changes.find(c=>c.path==='tracked.txt')!.id})).truncated).toBe(true);
  const outside=await mkdtemp(join(tmpdir(),'lullaby-outside-'));await writeFile(join(outside,'secret.txt'),'DO_NOT_READ');
  await symlink(outside,join(cwd,'external'),'junction');s=await r.read('p');
  for(const change of s.changes.filter(c=>c.path.startsWith('external'))){const diff=await r.diff(s.id,{kind:'local',changeId:change.id});expect(diff.kind).toBe('symlink');expect(diff.text).not.toContain('DO_NOT_READ');}
},20000);
test('pages pin tips and detect moved refs without duplicating history',async()=>{
  const cwd=await repository();const root=await commit(cwd,'a','root','root');
  // Build a real commit chain cheaply without invoking an editor or hundreds of checkouts.
  const tree=await git(cwd,'rev-parse','HEAD^{tree}');let tip=root;
  for(let i=0;i<202;i++)tip=await git(cwd,'commit-tree',tree,'-p',tip,'-m',`commit ${i}`);
  await git(cwd,'update-ref','refs/heads/main',tip);const r=reader(cwd);const s=await r.read('p');expect(s.commits).toHaveLength(200);expect(s.truncated).toBe(true);
  const moved=await git(cwd,'commit-tree',tree,'-p',tip,'-m','new tip');await git(cwd,'update-ref','refs/heads/main',moved);
  const more=await r.loadMore(s.id);expect(more.commits).toHaveLength(203);expect(more.commits[0].oid).toBe(tip);expect(more.changedDuringRead).toBe(true);expect(new Set(more.commits.map(c=>c.oid)).size).toBe(203);
},60000);
