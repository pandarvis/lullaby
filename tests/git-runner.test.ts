import { expect,test } from 'vitest';
import { runGit } from '../src/main/git/runner';
import { repository,commit,git } from './fixtures/git-repository';
import { readFile,writeFile,access } from 'node:fs/promises';
import { join } from 'node:path';
import { GitReader } from '../src/main/git/reader';
test('runner distinguishes output limit, timeout and cancellation',async()=>{
  const cwd=await repository();await commit(cwd,'a','x','root');
  await expect(runGit(cwd,['log'],{limit:1})).rejects.toThrow('GIT_OUTPUT_LIMIT');
  await expect(runGit(cwd,['status'],{timeoutMs:1})).rejects.toThrow('GIT_TIMEOUT');
  const abort=new AbortController();abort.abort();await expect(runGit(cwd,['status'],{signal:abort.signal})).rejects.toThrow('GIT_CANCELLED');
});
test('literal pathspec does not expand magic or glob syntax; external diff and textconv stay disabled',async()=>{
  const cwd=await repository();await commit(cwd,'a[1].txt','before\n','root');await commit(cwd,'a1.txt','other\n','other');
  await writeFile(join(cwd,'a[1].txt'),'after\n');await writeFile(join(cwd,'a1.txt'),'unrelated\n');
  expect((await runGit(cwd,['diff','--no-ext-diff','--no-textconv','--',':(glob)*'])).length).toBe(0);
  await writeFile(join(cwd,'.gitattributes'),'*.txt diff=trap\n');await git(cwd,'config','diff.trap.textconv','echo SHOULD_NOT_RUN');await git(cwd,'config','diff.external','echo SHOULD_NOT_RUN');
  const r=new GitReader(()=>cwd);const s=await r.read('p');const diff=await r.diff(s.id,{kind:'local',changeId:s.changes.find(c=>c.path==='a[1].txt')!.id});
  expect(diff.text).toContain('+after');expect(diff.text).not.toContain('unrelated');expect(diff.text).not.toContain('SHOULD_NOT_RUN');
},20_000);
test('read-only operations never run a repository clean filter',async()=>{
  const cwd=await repository();await commit(cwd,'a.txt','before\n','root');
  await writeFile(join(cwd,'filter.cjs'),"require('fs').writeFileSync('filter-ran','bad');process.stdin.pipe(process.stdout)");
  await writeFile(join(cwd,'.gitattributes'),'*.txt filter=trap\n');await git(cwd,'config','filter.trap.clean','node filter.cjs');await writeFile(join(cwd,'a.txt'),'after\n');
  const r=new GitReader(()=>cwd);const s=await r.read('p');await r.diff(s.id,{kind:'local',changeId:s.changes.find(c=>c.path==='a.txt')!.id});
  await expect(access(join(cwd,'filter-ran'))).rejects.toThrow();
});
