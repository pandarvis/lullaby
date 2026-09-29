import { afterEach, expect, test, vi } from 'vitest';
import { ClaudeAdapter, type ClaudeDeps } from '../src/main/providers/claude/adapter';
import type { RunInput } from '../src/main/providers/types';
afterEach(()=>{vi.useRealTimers();});
// Minimal stand-in for the SDK Query: one process answers every pushed prompt.
function fakeSdk(){
  const engines:{closed:boolean;prompts:string[];die:()=>void}[]=[];
  const query=((params:{prompt:AsyncIterable<any>;options:{resume?:string}})=>{
    const engine={closed:false,prompts:[] as string[],die:()=>{}};engines.push(engine);const id=params.options.resume??`native-${engines.length}`;
    let fail:((error:Error)=>void)|undefined;const died=new Promise<never>((_,reject)=>{fail=reject;});died.catch(()=>{});
    engine.die=()=>fail!(new Error('process exited'));
    async function* messages(){
      let first=true;const prompts=params.prompt[Symbol.asyncIterator]();
      while(true){
        const next=await Promise.race([prompts.next(),died]);if(next.done||engine.closed)return;
        const text=next.value.message.content as string;engine.prompts.push(text);
        if(first){first=false;yield {type:'system',subtype:'init',session_id:id};}
        yield {type:'assistant',session_id:id,message:{id:`m${engine.prompts.length}`,content:[{type:'text',text:`echo:${text}`}]}};
        yield {type:'result',subtype:'success',session_id:id,result:`echo:${text}`};
      }
    }
    const iterator=messages();
    return Object.assign(iterator,{
      accountInfo:async()=>({apiProvider:'firstParty',subscriptionType:'Claude Max'}),
      interrupt:async()=>{},close:()=>{engine.closed=true;},
    });
  }) as unknown as ClaudeDeps['query'];
  return {engines,query};
}
const input=(extra:Partial<RunInput>={}):RunInput=>({cwd:'C:/project',text:'bonjour',choices:{},env:{PATH:'x'},...extra});
async function turn(adapter:ClaudeAdapter,value:RunInput){
  const run=await adapter.run(value);const events=[];for await(const event of run.events)events.push(event.body);await run.close();return events;
}
test('a conversation keeps its engine between turns',async()=>{
  const sdk=fakeSdk();let modified=1;const adapter=new ClaudeAdapter({query:sdk.query,sessionInfo:async()=>({lastModified:modified,fileSize:10})});
  const first=await turn(adapter,input());expect(first).toContainEqual({kind:'bound',nativeId:'native-1'});
  const second=await turn(adapter,input({nativeId:'native-1',text:'encore',env:{PATH:'x',CLAUDE_AGENT_SDK_VERSION:'0.3.283'}}));
  expect(second).toContainEqual(expect.objectContaining({kind:'text',text:'echo:encore'}));expect(second).toContainEqual({kind:'state',phase:'done'});
  expect(sdk.engines).toHaveLength(1);expect(sdk.engines[0].prompts).toEqual(['bonjour','encore']);
  await adapter.dispose();expect(sdk.engines[0].closed).toBe(true);expect(modified).toBe(1);
});
test('changed choices, environment or an external session write start a fresh engine',async()=>{
  const sdk=fakeSdk();let modified=1;const adapter=new ClaudeAdapter({query:sdk.query,sessionInfo:async()=>({lastModified:modified})});
  await turn(adapter,input());
  await turn(adapter,input({nativeId:'native-1',choices:{model:'other'}}));expect(sdk.engines).toHaveLength(2);expect(sdk.engines[0].closed).toBe(true);
  await turn(adapter,input({nativeId:'native-1',choices:{model:'other'},env:{PATH:'x',HTTPS_PROXY:'http://127.0.0.1:3128'}}));expect(sdk.engines).toHaveLength(3);
  modified=2;await turn(adapter,input({nativeId:'native-1',choices:{model:'other'},env:{PATH:'x',HTTPS_PROXY:'http://127.0.0.1:3128'}}));
  expect(sdk.engines).toHaveLength(4);expect(sdk.engines.slice(0,3).every(engine=>engine.closed)).toBe(true);
  await adapter.dispose();
});
test('interruption, a dead engine and idle expiry never reuse the process',async()=>{
  const sdk=fakeSdk();const adapter=new ClaudeAdapter({query:sdk.query,sessionInfo:async()=>({lastModified:1}),idleMs:50});
  const run=await adapter.run(input());await run.interrupt();expect(sdk.engines[0].closed).toBe(true);
  await turn(adapter,input({nativeId:'native-1'}));sdk.engines[1].die();await new Promise(resolve=>setTimeout(resolve,10));
  await turn(adapter,input({nativeId:'native-1'}));expect(sdk.engines).toHaveLength(3);
  await new Promise(resolve=>setTimeout(resolve,120));expect(sdk.engines[2].closed).toBe(true);
  await turn(adapter,input({nativeId:'native-1'}));expect(sdk.engines).toHaveLength(4);await adapter.dispose();
});
test('at most three idle engines stay open',async()=>{
  const sdk=fakeSdk();const adapter=new ClaudeAdapter({query:sdk.query,sessionInfo:async()=>({lastModified:1})});
  for(const cwd of ['C:/a','C:/b','C:/c','C:/d'])await turn(adapter,input({cwd}));
  expect(sdk.engines.map(engine=>engine.closed)).toEqual([true,false,false,false]);await adapter.dispose();
});
