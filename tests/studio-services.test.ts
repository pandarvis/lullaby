import { test, expect } from 'vitest';
import { mkdtemp, writeFile, readFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SessionManager } from '../src/main/sessions/manager';
import { FakeProvider } from './fixtures/fake-provider';
import { PreviewService } from '../src/main/preview/service';
import { EngineSettings } from '../src/main/settings/engines';

test('renaming keeps folder identity; removal preserves disk and drops only its sessions',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lullaby-project-'));
  await writeFile(join(dir,'keep.txt'),'keep');
  const manager=new SessionManager({adapters:[new FakeProvider()]});
  const p=await manager.addProject(dir);const s=await manager.createSession(p.id,'claude');
  await manager.renameProject(p.id,'Atelier');
  expect(manager.snapshot().projects[0]).toMatchObject({...p,name:'Atelier'});
  await manager.removeProject(p.id);
  expect(manager.snapshot().sessions).toEqual([]);expect(manager.snapshot().messages[s.id]).toBeUndefined();
  expect(await readFile(join(dir,'keep.txt'),'utf8')).toBe('keep');
});
test('project removal refuses an in-flight launch',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lullaby-active-'));const provider=new FakeProvider();
  const manager=new SessionManager({adapters:[provider]});const p=await manager.addProject(dir);const s=await manager.createSession(p.id,'claude');
  const running=manager.send({sessionId:s.id,text:'hello'});
  await expect(manager.removeProject(p.id)).rejects.toThrow('FOLDER_BUSY');
  await running;await manager.close();
});
test('preview confines files and serves HTML with isolation headers, revocable tokens',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lullaby-preview-'));const root=join(dir,'project');
  const {mkdir}=await import('node:fs/promises');await mkdir(root);
  await writeFile(join(root,'index.html'),'<h1>Bonjour</h1><script>document.title="ok"</script>');
  await writeFile(join(dir,'secret.html'),'outside');
  const previews=new PreviewService(id=>id==='p'?root:undefined);
  try{
    await expect(previews.create('p',{path:'../secret.html'})).rejects.toThrow('PREVIEW_OUTSIDE_PROJECT');
    const doc=await previews.create('p',{path:'index.html'});const response=await fetch(doc.url);
    expect(await response.text()).toContain('Bonjour');
    expect(response.headers.get('content-security-policy')).toContain("connect-src 'none'");
    expect(response.headers.get('content-security-policy')).toContain('sandbox allow-scripts');
    expect(previews.allowsNavigation(doc.url)).toBe(true);
    expect(previews.allowsNavigation(doc.url+'?leak=secret')).toBe(false);
    expect(previews.allowsNavigation('http://127.0.0.1:9999/secret')).toBe(false);
    const external=await fetch(await previews.url(doc.id));expect(external.headers.get('content-security-policy')).toContain("script-src 'none'");expect(external.headers.get('content-security-policy')).not.toContain('allow-scripts');
    await expect(previews.create('absent',{html:'x'})).rejects.toThrow('PROJECT_NOT_FOUND');
    previews.release(doc.id);expect((await fetch(doc.url)).status).toBe(404);
  }finally{await previews.close();}
});
test('preview rejects a directory junction escaping the project and oversized documents',async()=>{
  const {mkdir}=await import('node:fs/promises');const dir=await mkdtemp(join(tmpdir(),'lullaby-containment-'));
  const root=join(dir,'project'),outside=join(dir,'outside');await mkdir(root);await mkdir(outside);await writeFile(join(outside,'secret.html'),'secret');
  await symlink(outside,join(root,'link'),'junction');const preview=new PreviewService(()=>root);
  try{await expect(preview.create('p',{path:'link/secret.html'})).rejects.toThrow('PREVIEW_OUTSIDE_PROJECT');
    await expect(preview.create('p',{html:'x'.repeat(2*1024*1024+1)})).rejects.toThrow('PREVIEW_TOO_LARGE');
  }finally{await preview.close();}
});
test('engine settings persist only a selected executable, empty resets to detection',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lullaby-engines-'));const file=join(dir,'engines.json');const executable=join(dir,'codex.exe');await writeFile(executable,'fixture');
  const settings=new EngineSettings(file);await settings.load();await settings.save({codexExecutable:executable});
  const loaded=new EngineSettings(file);await loaded.load();expect(loaded.snapshot().codexExecutable).toBe(executable);
  await loaded.save({});expect(loaded.snapshot().codexExecutable).toBeUndefined();
  await expect(loaded.save({codexExecutable:join(dir,'missing.exe')})).rejects.toThrow('INVALID_EXECUTABLE');
});

test('removing one conversation keeps its sibling, project and files after reload',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lullaby-session-remove-'));await writeFile(join(dir,'keep.txt'),'keep');
  const manager=new SessionManager({adapters:[new FakeProvider()]});const project=await manager.addProject(dir);
  const removed=await manager.createSession(project.id,'claude','01234567-1234-4234-8234-123456789012');
  const kept=await manager.createSession(project.id,'claude');await manager.saveDraft(removed.id,'draft');
  const initial=manager.snapshot();initial.messages[removed.id]=[{id:'m',role:'assistant',text:'fixture',actions:[]}];
  let saved=initial;const loaded=new SessionManager({adapters:[new FakeProvider()],initial,persist:async value=>{saved=value;}});
  await loaded.removeSession(removed.id);
  const reopened=new SessionManager({adapters:[],initial:saved}).snapshot();
  expect(reopened.sessions.map(s=>s.id)).toEqual([kept.id]);expect(reopened.messages[removed.id]).toBeUndefined();
  expect(reopened.projects[0]).toEqual(project);expect(await readFile(join(dir,'keep.txt'),'utf8')).toBe('keep');
  await expect(loaded.saveDraft(removed.id,'late draft')).rejects.toThrow('SESSION_NOT_FOUND');
});

test('conversation removal refuses launch and active runs but permits an idle sibling',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lullaby-session-active-'));const provider=new FakeProvider();
  const manager=new SessionManager({adapters:[provider]});const project=await manager.addProject(dir);
  const active=await manager.createSession(project.id,'claude');const idle=await manager.createSession(project.id,'claude');
  const starting=manager.send({sessionId:active.id,text:'hello'});
  await expect(manager.removeSession(active.id)).rejects.toThrow('SESSION_RUNNING');
  await starting;await expect(manager.removeSession(active.id)).rejects.toThrow('SESSION_RUNNING');
  await manager.removeSession(idle.id);expect(manager.snapshot().sessions.map(s=>s.id)).toEqual([active.id]);
  await manager.close();
});
