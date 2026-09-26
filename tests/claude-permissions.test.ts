import { expect, test, vi } from 'vitest';
import { AsyncQueue } from '../src/main/providers/queue';
const fake=vi.hoisted(()=>({options:undefined as any,closed:false,queue:undefined as any}));
vi.mock('@anthropic-ai/claude-agent-sdk',()=>({query:({options}:any)=>{
  fake.options=options;fake.closed=false;
  return {accountInfo:async()=>({apiProvider:'firstParty',subscriptionType:'Claude Max'}),
    interrupt:async()=>{},close:()=>{fake.closed=true;fake.queue.end();},
    [Symbol.asyncIterator]:()=>fake.queue[Symbol.asyncIterator]()};
}}));
import { ClaudeAdapter } from '../src/main/providers/claude/adapter';

test('refusal and interruption settle SDK permission callbacks',async()=>{
  fake.queue=new AsyncQueue();
  const run=await new ClaudeAdapter().run({cwd:'.',text:'test',choices:{},env:{}});
  const first=fake.options.canUseTool('Bash',{command:'test'},{signal:new AbortController().signal});
  const events=run.events[Symbol.asyncIterator]();
  const request=(await events.next()).value!;
  expect(request.body.kind).toBe('request');
  await run.reply((request.body as any).requestId,{kind:'deny'});
  expect(await first).toMatchObject({behavior:'deny'});
  const second=fake.options.canUseTool('Write',{file_path:'test'},{signal:new AbortController().signal});
  await events.next();await run.interrupt();
  expect(await second).toMatchObject({behavior:'deny'});expect(fake.closed).toBe(true);
});
