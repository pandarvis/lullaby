import { expect, test } from 'vitest';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { nativePermissionArgs } from '../src/main/providers/claude/native';
test('the pinned SDK implicit default cannot override native permission settings',()=>{
  let captured:string[]=[];
  try{query({prompt:'never sent',options:{settingSources:['user','project','local'],spawnClaudeCodeProcess:options=>{
    captured=nativePermissionArgs(options.args);throw new Error('CAPTURE_ONLY_NO_PROCESS');
  }}});}catch{}
  expect(captured.length).toBeGreaterThan(0);expect(captured).not.toContain('--permission-mode');
  expect(nativePermissionArgs(['--permission-mode','plan','--other','x'])).toEqual(['--permission-mode','plan','--other','x']);
});
