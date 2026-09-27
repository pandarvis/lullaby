import { expect,test,vi } from 'vitest';
import { mkdtemp,writeFile,readFile,unlink,mkdir,symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TurnReviewSource } from '../src/main/review/capture';
import { runGit } from '../src/main/git/runner';
import { SessionManager } from '../src/main/sessions/manager';
import { FakeProvider } from './fixtures/fake-provider';
import { readStore,writeStore } from '../src/main/storage/store';
async function repo(){const dir=await mkdtemp(join(tmpdir(),'lullaby-review-test-'));await runGit(dir,['init']);return dir;}
async function commit(dir:string){await runGit(dir,['add','.']);await runGit(dir,['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']);}
test('captures actual before/after including an intermediate commit and pre-existing dirty changes',async()=>{
  const dir=await repo();await writeFile(join(dir,'a.txt'),'initial\n');await commit(dir);
  await writeFile(join(dir,'a.txt'),'user edit\n');await writeFile(join(dir,'untouched.txt'),'keep\n');
  const before=await new TurnReviewSource().begin(dir);
  await writeFile(join(dir,'a.txt'),'user edit\nagent edit\n');await writeFile(join(dir,'new.txt'),'new\n');await commit(dir);
  const result=await before.finish('r');
  expect(result.partial).toBe(false);expect(result.files.map(f=>f.path)).toEqual(['a.txt','new.txt']);
  expect(result.files[0]).toMatchObject({change:'modified',additions:1,deletions:0});
  expect(result.files[0].diff.text).toContain(' user edit');expect(result.files[0].diff.text).not.toContain('-initial');
  expect(await runGit(dir,['status','--porcelain'])).toEqual(Buffer.alloc(0));
  expect(await readFile(join(dir,'untouched.txt'),'utf8')).toBe('keep\n');
});
test('deletion, binary and file limits produce honest details and no synthetic counts',async()=>{
  const dir=await repo();await writeFile(join(dir,'gone'),'before\n');await writeFile(join(dir,'large'),Buffer.alloc(1024*1024+10,65));
  const before=await new TurnReviewSource().begin(dir);await unlink(join(dir,'gone'));await writeFile(join(dir,'binary'),Buffer.from([0,2,3]));await writeFile(join(dir,'large'),Buffer.alloc(1024*1024+20,66));
  const review=await before.finish('r');expect(review.partial).toBe(true);
  expect(review.files.find(f=>f.path==='gone')).toMatchObject({change:'deleted',additions:0,deletions:1});
  expect(review.files.find(f=>f.path==='binary')?.diff.kind).toBe('binary');
  expect(review.files.find(f=>f.path==='large')?.additions).toBeUndefined();
});
test('outside junctions are not followed and missing Git is explicitly unavailable',async()=>{
  const dir=await repo(),outside=await mkdtemp(join(tmpdir(),'lullaby-review-outside-'));
  await writeFile(join(outside,'secret'),'never copy this');await symlink(outside,join(dir,'link'),process.platform==='win32'?'junction':'dir');
  const before=await new TurnReviewSource().begin(dir);await writeFile(join(outside,'secret'),'external modification');
  const review=await before.finish('r');expect(JSON.stringify(review)).not.toContain('external modification');
  const none=await (await new TurnReviewSource().begin(outside)).finish('n');expect(none.notice).toContain('Git');expect(none.partial).toBe(true);
});
test('manager appends one review after the response, saves it and excludes it from other sessions',async()=>{
  const dir=await repo();await writeFile(join(dir,'a'),'old\n');const provider=new FakeProvider();
  const store=join(await mkdtemp(join(tmpdir(),'lullaby-review-store-')),'state.json');
  const manager=new SessionManager({adapters:[provider],reviews:new TurnReviewSource(),persist:s=>writeStore(store,s)});
  const project=await manager.addProject(dir);const a=await manager.createSession(project.id,'claude'),b=await manager.createSession(project.id,'claude');
  await manager.send({sessionId:a.id,text:'edit'});await writeFile(join(dir,'a'),'new\n');
  provider.emit({kind:'text',itemId:'answer',text:'Done',mode:'replace'});
  await manager.interrupt(a.id);
  const saved=await readStore(store),items=saved.messages[a.id];
  expect(items.filter(item=>item.review)).toHaveLength(1);expect(items.at(-1)?.review?.files[0]).toMatchObject({path:'a',additions:1,deletions:1});
  expect(saved.messages[b.id]).toEqual([]);await manager.removeSession(a.id);expect(manager.snapshot().messages[a.id]).toBeUndefined();await manager.close();
});

test('finalization keeps the folder locked, and a review failure does not fail the agent',async()=>{
  const dir=await repo();const provider=new FakeProvider();let finish!:(value:any)=>void;
  const manager=new SessionManager({adapters:[provider],reviews:{begin:async()=>({finish:()=>new Promise(resolve=>{finish=resolve;})})}});
  const project=await manager.addProject(dir),session=await manager.createSession(project.id,'claude');
  await manager.send({sessionId:session.id,text:'work'});provider.emit({kind:'state',phase:'done'});(provider.runs[0] as any).end();
  await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));
  expect(manager.snapshot().sessions[0].phase).toBe('running');
  await expect(manager.send({sessionId:session.id,text:'next'})).rejects.toThrow('FOLDER_BUSY');
  finish({runId:'r',capturedAt:new Date().toISOString(),files:[],partial:true,notice:'Relevé indisponible'});
  await vi.waitFor(()=>expect(manager.snapshot().sessions[0].phase).toBe('done'));await manager.close();
});
