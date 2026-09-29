import { expect, test, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SessionManager } from '../src/main/sessions/manager';
import { ClaudeAdapter, type ClaudeDeps } from '../src/main/providers/claude/adapter';
import { claudePermissionMode, codexPermissions } from '../src/main/providers/permissions';
import { launchChoices } from '../src/main/ipc/validation';
import { FakeProvider } from './fixtures/fake-provider';
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
test('the automatic profile is Claude auto mode and is refused for Codex',()=>{
  expect(claudePermissionMode('automatic')).toBe('auto');expect(()=>codexPermissions('automatic')).toThrow('UNSUPPORTED_PERMISSION_PROFILE');
  expect(launchChoices({permissionProfile:'automatic'})).toEqual({permissionProfile:'automatic'});
});
async function setup(live:boolean){
  const provider=new FakeProvider();const applied:(string|undefined)[]=[];
  if(live){const run=provider.run.bind(provider);provider.run=async()=>Object.assign(await run(),{setPermissionProfile:async(profile?:string)=>{applied.push(profile);}});}
  const manager=new SessionManager({adapters:[provider]});
  const project=await manager.addProject(await mkdtemp(join(tmpdir(),'lullaby-perm-')));
  const session=await manager.createSession(project.id,'claude');
  return {manager,provider,project,session,applied};
}
test('permissions change during a turn, live when the engine allows it; model and effort wait',async()=>{
  const live=await setup(true);
  await live.manager.send({sessionId:live.session.id,text:'go'});await tick();
  expect(await live.manager.configureSession(live.session.id,{permissionProfile:'automatic'})).toBe('now');expect(live.applied).toEqual(['automatic']);
  await expect(live.manager.configureSession(live.session.id,{permissionProfile:'automatic',model:'other'})).rejects.toThrow('SESSION_RUNNING');
  const later=await setup(false);
  await later.manager.send({sessionId:later.session.id,text:'go'});await tick();
  expect(await later.manager.configureSession(later.session.id,{permissionProfile:'plan'})).toBe('next');
  expect(later.manager.snapshot().sessions[0].choices).toEqual({permissionProfile:'plan'});
  const idle=await setup(false);expect(await idle.manager.configureSession(idle.session.id,{permissionProfile:'ask'})).toBe('saved');
});
test('a project remembers the last permission profile for its new conversations',async()=>{
  const {manager,project,session}=await setup(false);
  await manager.configureSession(session.id,{permissionProfile:'automatic'});
  expect((await manager.createSession(project.id,'claude')).choices).toEqual({permissionProfile:'automatic'});
  expect((await manager.createSession(project.id,'codex')).choices).toEqual({});
  await manager.configureSession(session.id,{permissionProfile:'native'});
  expect((await manager.createSession(project.id,'claude')).choices).toEqual({});
});
function fakeClaude(){
  const modes:string[]=[];let spawned=0;
  const query=((params:{prompt:AsyncIterable<any>})=>{
    spawned++;const prompts=params.prompt[Symbol.asyncIterator]();
    async function* messages(){let first=true;while(true){const next=await prompts.next();if(next.done)return;
      if(first){first=false;yield {type:'system',subtype:'init',session_id:'n1'};}
      yield {type:'result',subtype:'success',session_id:'n1',result:'ok'};}}
    return Object.assign(messages(),{accountInfo:async()=>({apiProvider:'firstParty',subscriptionType:'Claude Max'}),interrupt:async()=>{},close(){},setPermissionMode:async(mode:string)=>{modes.push(mode);}});
  }) as unknown as ClaudeDeps['query'];
  return {query,modes,spawned:()=>spawned};
}
test('Claude applies a new profile to its kept engine instead of restarting it',async()=>{
  const sdk=fakeClaude();const adapter=new ClaudeAdapter({query:sdk.query,sessionInfo:async()=>({lastModified:1}),settings:async()=>({permissions:{defaultMode:'acceptEdits'}})});
  const turn=async(profile?:string,nativeId?:string)=>{const run=await adapter.run({cwd:'C:/p',nativeId,text:'x',choices:profile?{permissionProfile:profile}:{},env:{}});for await(const e of run.events)void e;if(!profile)await run.close();return run;};
  await turn();const second=await turn('automatic','n1');
  expect(sdk.spawned()).toBe(1);expect(sdk.modes).toEqual(['auto']);
  await second.setPermissionProfile!('native');expect(sdk.modes).toEqual(['auto','acceptEdits']);
  await second.close();await adapter.dispose();
});
vi.setConfig({testTimeout:10000});
