import { spawn } from 'node:child_process';
import type { SpawnOptions, SpawnedProcess } from '@anthropic-ai/claude-agent-sdk';

// SDK 0.3.283 supplies this flag even when no permission mode is requested.
// Omitting it lets the native CLI resolve the user's and project's settings.
export function nativePermissionArgs(args:string[]):string[] {
  const result:string[]=[];
  for(let index=0;index<args.length;index++) {
    if(args[index]==='--permission-mode' && args[index+1]==='default') {index++;continue;}
    result.push(args[index]);
  }
  return result;
}

export function spawnNativeClaude(options:SpawnOptions):SpawnedProcess {
  const child=spawn(options.command,nativePermissionArgs(options.args),{
    cwd:options.cwd,env:options.env,signal:options.signal,
    windowsHide:true,shell:false,stdio:['pipe','pipe','pipe'],
  });
  // Drain diagnostics without persisting potentially sensitive native output.
  child.stderr.resume();
  return child;
}
