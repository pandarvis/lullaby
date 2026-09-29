import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile);
export async function git(cwd:string,...args:string[]) {
  return (await exec('git',['-c','core.autocrlf=false',...args],{cwd,windowsHide:true,encoding:'utf8',env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null'}})).stdout.trim();
}
export async function repository() {
  const cwd=await mkdtemp(join(tmpdir(),'lullaby-git-été-'));
  await git(cwd,'init','-b','main');await git(cwd,'config','user.name','Lullaby Fixture');await git(cwd,'config','user.email','fixture@example.invalid');
  return cwd;
}
export async function commit(cwd:string,file:string,content:string,message:string) {
  await mkdir(join(cwd,file,'..'),{recursive:true});await writeFile(join(cwd,file),content);await git(cwd,'add','--',file);await git(cwd,'commit','-m',message);return git(cwd,'rev-parse','HEAD');
}
