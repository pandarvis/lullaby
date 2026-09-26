import { expect, test } from 'vitest';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SessionManager } from '../src/main/sessions/manager';
import { canonicalizeFolder } from '../src/main/projects/registry';
import { FakeProvider } from './fixtures/fake-provider';
const tick = () => new Promise(resolve=>setTimeout(resolve,10));
async function setup() {
  const dir = await mkdtemp(join(tmpdir(),'lullaby-session-')); const provider = new FakeProvider();
  const manager = new SessionManager({adapters:[provider]});
  const project = await manager.addProject(dir);
  const a = await manager.createSession(project.id,'claude');
  const b = await manager.createSession(project.id,'claude');
  return {manager,provider,project,a,b,dir};
}
test('reserves the folder before an asynchronous launch',async()=>{
  const {manager,a,b} = await setup();
  await manager.send({sessionId:a.id,text:'work'});
  await expect(manager.send({sessionId:b.id,text:'work'})).rejects.toThrow('FOLDER_BUSY');
  await manager.interrupt(a.id);
  await manager.send({sessionId:b.id,text:'work'}); await manager.close();
});
test('rejects stale or misrouted approvals',async()=>{
  const {manager,provider,a,b} = await setup(); const {runId} = await manager.send({sessionId:a.id,text:'work'});
  provider.emit({kind:'request',requestId:'q',requestKind:'approval',text:'Allow?'}); await tick();
  await expect(manager.reply({sessionId:b.id,runId,requestId:'q',answer:{kind:'allow'}})).rejects.toThrow();
  expect(provider.replies).toEqual([]);
  await manager.reply({sessionId:a.id,runId,requestId:'q',answer:{kind:'deny'}});
  expect(provider.replies).toEqual(['q']);
  await expect(manager.reply({sessionId:a.id,runId,requestId:'q',answer:{kind:'allow'}})).rejects.toThrow();
  await manager.close();
});
test('final text replaces deltas, duplicates do not repeat content',async()=>{
  const {manager,provider,a} = await setup(); await manager.send({sessionId:a.id,text:'work'});
  provider.emit({kind:'text',itemId:'m',mode:'append',text:'Hi'},'e1');
  provider.emit({kind:'text',itemId:'m',mode:'append',text:'Hi'},'e1');
  provider.emit({kind:'text',itemId:'m',mode:'replace',text:'Hi there'},'e2'); await tick();
  expect(manager.snapshot().messages[a.id].filter(m=>m.role==='assistant').map(m=>m.text)).toEqual(['Hi there']);
  await manager.close();
});
test('native id and draft persist; previous runs become interrupted after reload',async()=>{
  const {manager,provider,a} = await setup(); await manager.send({sessionId:a.id,text:'work'});
  provider.emit({kind:'bound',nativeId:'native-123'}); await tick();
  await manager.saveDraft(a.id,'next thought'); const loaded = new SessionManager({adapters:[provider],initial:manager.snapshot()});
  expect(loaded.snapshot().sessions[0]).toMatchObject({phase:'interrupted',nativeId:'native-123',draft:'next thought'});
  expect(loaded.snapshot().pending).toEqual([]); await manager.close();
});
test('canonicalizes real directories with spaces and accents',async()=>{
  const dir = await mkdtemp(join(tmpdir(),'lullaby-path-')); const folder = join(dir,'Projet été'); await mkdir(folder);
  expect((await canonicalizeFolder(join(folder,'.'))).folderKey).toBe((await canonicalizeFolder(folder)).folderKey);
  await expect(canonicalizeFolder(join(dir,'absent'))).rejects.toThrow();
});
test('shutdown waits for an in-flight provider launch',async()=>{
  const {manager,provider,a}=await setup();
  const original=provider.run.bind(provider);
  let release!:()=>void;
  provider.run=async()=>{await new Promise<void>(resolve=>{release=resolve;});return original();};
  const sending=manager.send({sessionId:a.id,text:'work'});await tick();
  let closed=false;const closing=manager.close().then(()=>{closed=true;});await tick();
  expect(closed).toBe(false);
  release();await sending;await closing;
  expect(manager.snapshot().sessions[0].phase).toBe('interrupted');
});
