import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { appendFile, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
// One fake App Server process per RpcProcess; a turn completes when the test says so.
const state=vi.hoisted(()=>({processes:[] as any[],threadPath:'' as string|undefined}));
vi.mock('../src/main/providers/codex/transport',()=>({RpcRejected:class extends Error{},RpcProcess:class {
  onMessage:any=()=>{};onFailure:any=()=>{};closed=false;methods:string[]=[];
  constructor(){state.processes.push(this);}
  notify(){}reject(){}respond(){}
  async close(){this.closed=true;}
  async request(method:string,params:any){this.methods.push(method);
    if(method==='initialize')return {};
    if(method==='account/read')return {account:{type:'chatgpt'},requiresOpenaiAuth:true};
    if(method==='config/read')return {config:{model_provider:'openai',approval_policy:'on-request',sandbox_mode:'workspace-write'}};
    if(method==='thread/read')return {thread:{cwd:params.cwd??process.cwd()}};
    if(method==='thread/start'||method==='thread/resume')return {thread:{id:'thread-1',path:state.threadPath},modelProvider:'openai',cwd:process.cwd()};
    if(method==='turn/start'){const turn=`turn-${this.methods.filter(m=>m==='turn/start').length}`;queueMicrotask(()=>this.onMessage({method:'turn/started',params:{threadId:'thread-1',turn:{id:turn}}}));return {turn:{id:turn}};}
    return {};
  }
}}));
import { CodexAdapter } from '../src/main/providers/codex/adapter';
import type { RunInput } from '../src/main/providers/types';
beforeEach(async()=>{state.processes=[];state.threadPath=join(await mkdtemp(join(tmpdir(),'lullaby-codex-warm-')),'rollout.jsonl');await writeFile(state.threadPath,'turn 1\n');});
afterEach(()=>{vi.useRealTimers();});
const input=(extra:Partial<RunInput>={}):RunInput=>({cwd:process.cwd(),text:'bonjour',choices:{},env:{PATH:'x'},...extra});
async function turn(adapter:CodexAdapter,value:RunInput,status='completed'){
  const run=await adapter.run(value);const rpc=state.processes.at(-1);
  await new Promise(resolve=>setTimeout(resolve,0));
  rpc.onMessage({method:'turn/completed',params:{threadId:'thread-1',turn:{id:`turn-${rpc.methods.filter((m:string)=>m==='turn/start').length}`,status}}});
  for await(const event of run.events)void event;await run.close();return rpc;
}
test('a Codex conversation keeps its App Server between turns',async()=>{
  const adapter=new CodexAdapter(process.execPath);
  const first=await turn(adapter,input());
  const second=await turn(adapter,input({nativeId:'thread-1',text:'encore'}));
  expect(state.processes).toHaveLength(1);expect(second).toBe(first);expect(first.closed).toBe(false);
  expect(first.methods.filter((m:string)=>m==='thread/resume'||m==='thread/start')).toEqual(['thread/start']);
  expect(first.methods.filter((m:string)=>m==='turn/start')).toHaveLength(2);
  await adapter.dispose();expect(first.closed).toBe(true);
});
test('changed choices, an external write, a failed turn or a missing thread path start a fresh process',async()=>{
  const adapter=new CodexAdapter(process.execPath);
  await turn(adapter,input());
  await turn(adapter,input({nativeId:'thread-1',choices:{model:'other'}}));expect(state.processes).toHaveLength(2);expect(state.processes[0].closed).toBe(true);
  await appendFile(state.threadPath!,'written by the CLI\n');
  await turn(adapter,input({nativeId:'thread-1',choices:{model:'other'}}),'failed');expect(state.processes).toHaveLength(3);
  await turn(adapter,input({nativeId:'thread-1',choices:{model:'other'}}));expect(state.processes).toHaveLength(4);expect(state.processes[2].closed).toBe(true);
  await adapter.dispose();state.threadPath=undefined;await turn(adapter,input({nativeId:'thread-1',choices:{model:'other'}}));
  await turn(adapter,input({nativeId:'thread-1',choices:{model:'other'}}));expect(state.processes).toHaveLength(6);
  await adapter.dispose();
});
test('an interrupted or failed process is never kept',async()=>{
  const adapter=new CodexAdapter(process.execPath);
  const run=await adapter.run(input());await run.interrupt();expect(state.processes[0].closed).toBe(true);
  const kept=await turn(adapter,input({nativeId:'thread-1'}));kept.onFailure(new Error('CODEX_PROCESS_CLOSED'));
  await turn(adapter,input({nativeId:'thread-1'}));expect(state.processes).toHaveLength(3);await adapter.dispose();
});
