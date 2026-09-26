import { spawn } from 'node:child_process';
export class GitError extends Error {constructor(code:string,readonly exitCode?:number){super(code);}}
export type GitRunOptions={signal?:AbortSignal;executable?:string;limit?:number;truncate?:boolean;timeoutMs?:number};
export async function runGit(cwd:string,args:string[],options:GitRunOptions={}):Promise<Buffer> {
  const overrides:string[]=[];
  if(['status','diff','diff-tree'].includes(args[0])) {
    // Even a diff/status may invoke a clean filter when hashing working files.
    // Disable declared filters for this child only; never rewrite repository config.
    let names=Buffer.alloc(0);
    try {names=await executeGit(cwd,['config','--null','--name-only','--get-regexp','^filter\\..*\\.(clean|smudge|process|required)$'],options);}
    catch(error){if(!(error instanceof GitError&&error.exitCode===1))throw error;}
    for(const name of names.toString('utf8').split('\0').filter(Boolean))overrides.push('-c',`${name}=${name.endsWith('.required')?'false':''}`);
  }
  return executeGit(cwd,[...overrides,...args],options);
}
async function executeGit(cwd:string,args:string[],options:GitRunOptions):Promise<Buffer> {
  return new Promise((resolve,reject)=>{
    if(options.signal?.aborted){reject(new GitError('GIT_CANCELLED'));return;}
    const env={...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'};
    // A parent CLI's repository selection must not redirect this project's reads.
    for(const key of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE','GIT_COMMON_DIR'])delete (env as NodeJS.ProcessEnv)[key];
    const child=spawn(options.executable??'git',[
      '--no-pager','--literal-pathspecs','-c','color.ui=false','-c','core.fsmonitor=false',...args,
    ],{cwd,shell:false,windowsHide:true,env,stdio:['ignore','pipe','pipe']});
    const chunks:Buffer[]=[];let bytes=0,settled=false;const limit=options.limit??8*1024*1024;
    const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);if(error)reject(error);else resolve(Buffer.concat(chunks));};
    const cancel=()=>{child.kill();finish(new GitError('GIT_CANCELLED'));};
    const timer=setTimeout(()=>{child.kill();finish(new GitError('GIT_TIMEOUT'));},options.timeoutMs??15000);
    options.signal?.addEventListener('abort',cancel,{once:true});
    child.stdout.on('data',(chunk:Buffer)=>{
      if(settled)return;const remaining=limit-bytes;chunks.push(chunk.subarray(0,Math.max(0,remaining)));bytes+=chunk.length;
      if(bytes>limit){child.kill();finish(options.truncate?undefined:new GitError('GIT_OUTPUT_LIMIT'));}
    });
    child.stderr.resume();
    child.on('error',(error:NodeJS.ErrnoException)=>finish(new GitError(error.code==='ENOENT'?'GIT_UNAVAILABLE':'GIT_FAILED')));
    child.on('close',code=>finish(code===0?undefined:new GitError('GIT_FAILED',code??undefined)));
  });
}
