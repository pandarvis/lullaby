import { expect, test, vi } from 'vitest';
import { AsyncQueue } from '../src/main/providers/queue';
import { once } from 'node:events';
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
test.each([['ask','default'],['auto','acceptEdits'],['plan','plan']])('Claude %s uses the native %s mode without bypass',async(permissionProfile,permissionMode)=>{
  fake.queue=new AsyncQueue();const run=await new ClaudeAdapter().run({cwd:'.',text:'test',choices:{permissionProfile},env:{}});
  expect(fake.options.permissionMode).toBe(permissionMode);expect(fake.options.allowDangerouslySkipPermissions).toBeUndefined();await run.close();
});
test.each([undefined,'native'])('Claude %s preserves the native permission mode',async(permissionProfile)=>{
  fake.queue=new AsyncQueue();const run=await new ClaudeAdapter().run({cwd:'.',text:'test',choices:{permissionProfile},env:{}});
  expect(fake.options.permissionMode).toBeUndefined();await run.close();
});
test.each([['ask',['--permission-mode','default']],['native',[]]])('the Claude %s launch keeps only explicitly requested default permissions',async(permissionProfile,expected)=>{
  fake.queue=new AsyncQueue();const run=await new ClaudeAdapter().run({cwd:'.',text:'test',choices:{permissionProfile},env:{}});
  const child=fake.options.spawnClaudeCodeProcess({command:process.execPath,
    args:['-e','process.stdout.write(JSON.stringify(process.argv.slice(1)))','--','--permission-mode','default'],
    cwd:process.cwd(),env:{...process.env},signal:new AbortController().signal});
  let output='';child.stdout.on('data',(chunk:Buffer)=>{output+=chunk.toString();});
  await once(child,'close');expect(JSON.parse(output)).toEqual(expected);await run.close();
});
