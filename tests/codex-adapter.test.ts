import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile, utimes } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
const state=vi.hoisted(()=>({rpc:undefined as any,cwd:'',nativeCwd:'',executable:'',failure:undefined as string|undefined,methods:[] as string[],params:[] as {method:string;params:any}[],replies:[] as unknown[]}));
vi.mock('../src/main/providers/codex/transport',()=>({RpcProcess:class {
  onMessage:any;onFailure:any;constructor(executable:string){state.executable=executable;state.rpc=this;state.methods=[];state.params=[];state.replies=[];}
  notify(){}reject(id:unknown){state.replies.push({id,rejected:true});}respond(id:unknown,result:unknown){state.replies.push({id,result});}
  async close(){}
  async request(method:string,params:any){state.methods.push(method);state.params.push({method,params});
    if(state.failure&&method==='account/read')throw new Error(state.failure);
    if(method==='initialize')return {};
    if(method==='account/read')return {account:{type:'chatgpt'},requiresOpenaiAuth:true};
    if(method==='config/read')return {config:{model_provider:'openai'}};
    if(method==='model/list'||method==='skills/list')return {data:[]};
    if(method==='thread/read')return {thread:{cwd:state.nativeCwd}};
    if(method.startsWith('thread/'))return {thread:{id:'native'},modelProvider:'openai',cwd:state.cwd};
    return {turn:{id:'turn'}};
  }
}}));
import { CodexAdapter } from '../src/main/providers/codex/adapter';
import { tmpdir } from 'node:os';
const folders:string[]=[];
beforeEach(()=>{state.cwd=process.cwd();state.nativeCwd=state.cwd;state.failure=undefined;state.methods=[];});
afterEach(async()=>{await Promise.all(folders.splice(0).map(path=>rm(path,{recursive:true,force:true})));});
async function fixture(){const folder=await mkdtemp(join(tmpdir(),'lullaby-codex-resolver-'));folders.push(folder);return folder;}
async function executable(folder:string){await mkdir(folder,{recursive:true});const path=join(folder,'codex.exe');await writeFile(path,'fixture, never executed');return path;}
test('routes a denial by server ID and uses native turn interruption',async()=>{
  state.cwd=process.cwd();const run=await new CodexAdapter(process.execPath).run({cwd:state.cwd,text:'test',choices:{},env:{}});
  state.rpc.onMessage({id:81,method:'item/commandExecution/requestApproval',params:{threadId:'native',turnId:'turn',command:'example'}});
  const events=run.events[Symbol.asyncIterator]();await events.next();await events.next();const request=(await events.next()).value!;
  expect(request.body.kind).toBe('request');await run.reply((request.body as any).requestId,{kind:'deny'});
  expect(state.replies).toEqual([{id:81,result:{decision:'decline'}}]);
  await expect(run.reply((request.body as any).requestId,{kind:'allow'})).rejects.toThrow('STALE_REQUEST');
  await run.interrupt();expect(state.methods).toContain('turn/interrupt');
});
test('refuses importing a native session from another folder before any turn',async()=>{
  state.cwd=process.cwd();state.nativeCwd=tmpdir();
  await expect(new CodexAdapter(process.execPath).run({cwd:state.cwd,nativeId:'native',text:'test',choices:{},env:{}})).rejects.toThrow('NATIVE_FOLDER_MISMATCH');
  expect(state.methods).not.toContain('turn/start');
});

test('a Windows launch without Codex in PATH resolves the newest official desktop cache',async()=>{
  const root=await fixture();const old=await executable(join(root,'OpenAI','Codex','bin','old-hash'));
  const newest=await executable(join(root,'OpenAI','Codex','bin','new-hash'));
  await utimes(old,new Date(1000),new Date(1000));await utimes(newest,new Date(2000),new Date(2000));
  await mkdir(join(root,'OpenAI','Codex','bin','rg-only'),{recursive:true});
  const result=await new CodexAdapter().diagnose(state.cwd,{LOCALAPPDATA:root,PATH:''});
  expect(result).toMatchObject({available:true,auth:'subscription',executablePath:newest});
  expect(state.executable).toBe(newest);
});
test('PATH precedes desktop cache and handles Windows Path casing',async()=>{
  const root=await fixture();const selected=await executable(join(root,'path with spaces'));
  await executable(join(root,'OpenAI','Codex','bin','desktop'));
  await new CodexAdapter().diagnose(state.cwd,{LOCALAPPDATA:root,Path:[join(root,'missing'),join(root,'path with spaces')].join(delimiter)});
  expect(state.executable).toBe(selected);
});
test('the executable override is read for each run, and a missing explicit file never falls back',async()=>{
  const root=await fixture();const first=await executable(join(root,'first'));const second=await executable(join(root,'second'));
  const adapter=new CodexAdapter();
  await adapter.diagnose(state.cwd,{LULLABY_CODEX_PATH:first});expect(state.executable).toBe(first);
  await adapter.diagnose(state.cwd,{LULLABY_CODEX_PATH:second});expect(state.executable).toBe(second);
  const invalid=await adapter.diagnose(state.cwd,{LULLABY_CODEX_PATH:join(root,'missing.exe'),PATH:join(root,'first')});
  expect(invalid.available).toBe(false);expect(invalid.issues.join(' ')).toMatch(/chemin.*configur/i);
});
test('an explicit constructor executable retains precedence over the environment',async()=>{
  await new CodexAdapter(process.execPath).diagnose(state.cwd,{LULLABY_CODEX_PATH:'missing.exe'});
  expect(state.executable).toBe(process.execPath);
});
test('automatic discovery ignores project-local PATH entries and explicit shell scripts',async()=>{
  const root=await fixture();const cmd=join(root,'codex.cmd');await writeFile(cmd,'do not execute');
  const shell=await new CodexAdapter().diagnose(state.cwd,{LULLABY_CODEX_PATH:cmd});
  expect(shell.available).toBe(false);expect(shell.issues.join(' ')).toMatch(/exécutable natif/);
  const relative=await new CodexAdapter().diagnose(state.cwd,{PATH:['','.'].join(delimiter)});
  expect(relative.available).toBe(false);expect(relative.issues.join(' ')).toMatch(/introuvable/);
});
test('a missing engine has an installation diagnostic distinct from an unconnected account',async()=>{
  const root=await fixture();const missing=await new CodexAdapter().diagnose(state.cwd,{LOCALAPPDATA:root,PATH:''});
  expect(missing.available).toBe(false);expect(missing.issues.join(' ')).toMatch(/introuvable/i);
  state.failure='SUBSCRIPTION_NOT_CONFIRMED';const unconnected=await new CodexAdapter(process.execPath).diagnose(state.cwd,{});
  expect(unconnected.available).toBe(true);expect(unconnected.auth).toBe('missing');expect(unconnected.issues.join(' ')).toMatch(/ChatGPT/);
});
test.each([
  ['ask','on-request','workspace-write'],['auto','never','workspace-write'],['plan','on-request','read-only'],
])('Codex %s passes native permissions on start and resume',async(permissionProfile,approvalPolicy,sandbox)=>{
  for(const nativeId of [undefined,'native']){
    const run=await new CodexAdapter(process.execPath).run({cwd:state.cwd,nativeId,text:'test',choices:{permissionProfile},env:{}});
    const request=state.params.find(item=>item.method===(nativeId?'thread/resume':'thread/start'))!;
    expect(request.params).toMatchObject({approvalPolicy,sandbox});await run.close();
  }
});
test.each([undefined,'native'])('Codex %s preserves native permission defaults',async(permissionProfile)=>{
  const run=await new CodexAdapter(process.execPath).run({cwd:state.cwd,text:'test',choices:{permissionProfile},env:{}});
  const request=state.params.find(item=>item.method==='thread/start')!;
  expect(request.params).not.toHaveProperty('approvalPolicy');expect(request.params).not.toHaveProperty('sandbox');await run.close();
});
test('unknown permission profiles fail before a native connection is opened',async()=>{
  await expect(new CodexAdapter(process.execPath).run({cwd:state.cwd,text:'test',choices:{permissionProfile:'bypass'},env:{}})).rejects.toThrow('UNSUPPORTED_PERMISSION_PROFILE');
  expect(state.methods).toEqual([]);
});
