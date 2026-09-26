import { expect, test, vi } from 'vitest';
const state=vi.hoisted(()=>({rpc:undefined as any,cwd:'',nativeCwd:'',methods:[] as string[],replies:[] as unknown[]}));
vi.mock('../src/main/providers/codex/transport',()=>({RpcProcess:class {
  onMessage:any;onFailure:any;constructor(){state.rpc=this;state.methods=[];state.replies=[];}
  notify(){}reject(id:unknown){state.replies.push({id,rejected:true});}respond(id:unknown,result:unknown){state.replies.push({id,result});}
  async close(){}
  async request(method:string){state.methods.push(method);
    if(method==='initialize')return {};
    if(method==='account/read')return {account:{type:'chatgpt'},requiresOpenaiAuth:true};
    if(method==='config/read')return {config:{model_provider:'openai'}};
    if(method==='thread/read')return {thread:{cwd:state.nativeCwd}};
    if(method.startsWith('thread/'))return {thread:{id:'native'},modelProvider:'openai',cwd:state.cwd};
    return {turn:{id:'turn'}};
  }
}}));
import { CodexAdapter } from '../src/main/providers/codex/adapter';
import { tmpdir } from 'node:os';
test('routes a denial by server ID and uses native turn interruption',async()=>{
  state.cwd=process.cwd();const run=await new CodexAdapter().run({cwd:state.cwd,text:'test',choices:{},env:{}});
  state.rpc.onMessage({id:81,method:'item/commandExecution/requestApproval',params:{threadId:'native',turnId:'turn',command:'example'}});
  const events=run.events[Symbol.asyncIterator]();await events.next();await events.next();const request=(await events.next()).value!;
  expect(request.body.kind).toBe('request');await run.reply((request.body as any).requestId,{kind:'deny'});
  expect(state.replies).toEqual([{id:81,result:{decision:'decline'}}]);
  await expect(run.reply((request.body as any).requestId,{kind:'allow'})).rejects.toThrow('STALE_REQUEST');
  await run.interrupt();expect(state.methods).toContain('turn/interrupt');
});
test('refuses importing a native session from another folder before any turn',async()=>{
  state.cwd=process.cwd();state.nativeCwd=tmpdir();
  await expect(new CodexAdapter().run({cwd:state.cwd,nativeId:'native',text:'test',choices:{},env:{}})).rejects.toThrow('NATIVE_FOLDER_MISMATCH');
  expect(state.methods).not.toContain('turn/start');
});
