import { test, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { ClaudeAdapter } from '../src/main/providers/claude/adapter';
test.skipIf(process.env.LULLABY_LIVE_TEST !== 'claude')('Claude subscription: skill, file edit and native resume',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'lullaby-claude-live-'));
  await mkdir(join(cwd,'.claude','skills','lullaby-check'),{recursive:true});
  await writeFile(join(cwd,'marker.txt'),'IRIS-314');
  await writeFile(join(cwd,'CLAUDE.md'),'For this isolated validation fixture, keep responses under 30 words. Use the requested local skill. Do not run shell commands.');
  await writeFile(join(cwd,'.claude','skills','lullaby-check','SKILL.md'),'---\nname: lullaby-check\ndescription: Use for a Lullaby validation check.\n---\nRead marker.txt and include SKILL_IRIS_OK in the final answer.');
  const adapter=new ClaudeAdapter();
  let nativeId:string|undefined;let output='';let approvals=0;
  const run=await adapter.run({cwd,text:'Utilise le skill lullaby-check. Lis marker.txt et écris exactement son contenu dans verified.txt. Termine avec le marqueur et la confirmation du skill.',choices:{},env:{...process.env}});
  try {for await(const event of run.events){
    const body=event.body;
    if(body.kind==='bound')nativeId=body.nativeId;
    if(body.kind==='text')output+=body.text;
    if(body.kind==='request'){approvals++;await run.reply(body.requestId,{kind:'allow'});}
    if(body.kind==='error')throw new Error(body.code);
  }} finally {await run.close();}
  expect(nativeId).toBeTruthy();expect(await readFile(join(cwd,'verified.txt'),'utf8')).toBe('IRIS-314');expect(output).toContain('SKILL_IRIS_OK');
  let resumed='';
  const follow=await adapter.run({cwd,nativeId,text:'Sans lire de fichier ni utiliser un outil, quel marqueur as-tu écrit ? Réponds seulement avec ce marqueur.',choices:{},env:{...process.env}});
  try {for await(const event of follow.events){if(event.body.kind==='text')resumed+=event.body.text;if(event.body.kind==='error')throw new Error(event.body.code);if(event.body.kind==='request')await follow.reply(event.body.requestId,{kind:'deny'});}}
  finally {await follow.close();}
  expect(resumed).toContain('IRIS-314');console.log(JSON.stringify({provider:'claude',skill:true,fileWrite:true,resume:true,approvals}));
},120000);

test.skipIf(process.env.LULLABY_LIVE_TEST !== 'claude-control')('native denial and interruption leave no pending execution',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'lullaby-control-'));
  const outside=join(await mkdtemp(join(tmpdir(),'lullaby-denied-')),'never-write.txt');
  const adapter=new ClaudeAdapter();
  const run=await adapter.run({cwd,text:`Use Write once to create ${outside} with content TEST. If permission is denied, stop immediately, do not retry or use another tool.`,choices:{},env:{...process.env}});
  let denied=false;
  try {for await(const event of run.events){
    if(event.body.kind==='request'){denied=true;await run.reply(event.body.requestId,{kind:'deny'});}
    if(event.body.kind==='error')throw new Error(event.body.code);
  }}finally{await run.close();}
  expect(denied).toBe(true);await expect(access(outside)).rejects.toThrow();
  const interrupted=await adapter.run({cwd,text:'Read the files in this temporary folder and explain their contents.',choices:{},env:{...process.env}});
  await interrupted.interrupt();await interrupted.close();
},120000);

test.skipIf(process.env.LULLABY_LIVE_TEST !== 'claude-cli')('resumes a session created by the native CLI',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'lullaby-cli-resume-'));
  const nativeId=randomUUID();
  await promisify(execFile)(resolve('node_modules/@anthropic-ai/claude-agent-sdk-win32-x64/claude.exe'),[
    '-p','Remember the marker IRIS-926 for my next message. Reply only OK.',
    '--session-id',nativeId,'--output-format','json',
  ],{cwd,timeout:60000,windowsHide:true});
  const run=await new ClaudeAdapter().run({cwd,nativeId,text:'Without tools, reply with the marker from my previous message.',choices:{},env:{...process.env}});
  let text='';try{for await(const event of run.events){
    if(event.body.kind==='text')text+=event.body.text;
    if(event.body.kind==='request')await run.reply(event.body.requestId,{kind:'deny'});
    if(event.body.kind==='error')throw new Error(event.body.code);
  }}finally{await run.close();}
  expect(text).toContain('IRIS-926');
},120000);
