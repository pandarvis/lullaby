import { expect, test } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CodexAdapter } from '../src/main/providers/codex/adapter';
test.skipIf(process.env.LULLABY_LIVE_TEST!=='codex-diagnostic')('Codex subscription and native skills diagnostic',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'lullaby-codex-auth-'));
  const diagnostic=await new CodexAdapter().diagnose(cwd);
  expect(diagnostic).toMatchObject({available:true,auth:'subscription'});
},40000);
test.skipIf(process.env.LULLABY_LIVE_TEST!=='codex')('Codex skill, edit and native resume',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'lullaby-codex-live-'));await mkdir(join(cwd,'.agents','skills','lullaby-check'),{recursive:true});
  await writeFile(join(cwd,'marker.txt'),'IRIS-927');
  await writeFile(join(cwd,'AGENTS.md'),'Keep final answers under 30 words. Include RULE_IRIS_OK in final answers.');
  await writeFile(join(cwd,'.agents','skills','lullaby-check','SKILL.md'),'---\nname: lullaby-check\ndescription: Use for a Lullaby validation check.\n---\nRead marker.txt. Include SKILL_IRIS_OK in your final answer.');
  const adapter=new CodexAdapter();let nativeId:string|undefined;let text='';
  const diagnostic=await adapter.diagnose(cwd);const model=diagnostic.models?.find(model=>model.default)?.id;
  expect(model).toBeTruthy();
  const run=await adapter.run({cwd,text:'Use skill lullaby-check. Read marker.txt and write exactly the same content to verified.txt. Reply with the marker and skill confirmation.',choices:{model},env:{...process.env}});
  try{for await(const event of run.events){const b=event.body;if(b.kind==='bound')nativeId=b.nativeId;if(b.kind==='text')text+=b.text;if(b.kind==='request')await run.reply(b.requestId,{kind:'allow'});if(b.kind==='error')throw new Error(b.message);}}finally{await run.close();}
  expect(nativeId).toBeTruthy();expect(text).toContain('SKILL_IRIS_OK');expect(text).toContain('RULE_IRIS_OK');expect(await readFile(join(cwd,'verified.txt'),'utf8')).toBe('IRIS-927');
  let resumed='';const follow=await adapter.run({cwd,nativeId,text:'Without tools, give me the marker written in the previous turn.',choices:{model},env:{...process.env}});
  try{for await(const event of follow.events){const b=event.body;if(b.kind==='text')resumed+=b.text;if(b.kind==='request')await follow.reply(b.requestId,{kind:'deny'});if(b.kind==='error')throw new Error(b.code);}}finally{await follow.close();}
  expect(resumed).toContain('IRIS-927');
},180000);
