import { readdir, stat } from 'node:fs/promises';
import { delimiter, extname, isAbsolute, join, resolve } from 'node:path';

function environmentValue(env:NodeJS.ProcessEnv,name:string):string|undefined {
  const key=Object.keys(env).find(key=>key.toLowerCase()===name.toLowerCase());
  return key===undefined?undefined:env[key];
}
async function fileTimestamp(path:string):Promise<number|undefined> {
  try {const info=await stat(path);return info.isFile()?info.mtimeMs:undefined;} catch {return undefined;}
}
async function fromPath(env:NodeJS.ProcessEnv,name:string):Promise<string|undefined> {
  for(const entry of (environmentValue(env,'PATH')??'').split(delimiter)) {
    const folder=entry.trim().replace(/^"(.*)"$/,'$1');
    // Never discover a project-local executable through an empty/relative PATH entry.
    if(!isAbsolute(folder))continue;
    const candidate=join(folder,name);
    if(await fileTimestamp(candidate)!==undefined)return candidate;
  }
}

/** Resolve metadata only; invoking the engine remains the transport's responsibility. */
export async function resolveCodexExecutable(env:NodeJS.ProcessEnv,explicit?:string):Promise<string> {
  const configured=explicit??environmentValue(env,'LULLABY_CODEX_PATH');
  if(configured?.trim()) {
    const candidate=configured.trim().replace(/^"(.*)"$/,'$1');
    if(extname(candidate).toLowerCase()!=='.exe')throw new Error('CODEX_EXECUTABLE_INVALID');
    const selected=isAbsolute(candidate)?resolve(candidate):candidate.includes('/')||candidate.includes('\\')?undefined:await fromPath(env,candidate);
    if(!selected||await fileTimestamp(selected)===undefined)throw new Error('CODEX_EXECUTABLE_INVALID');
    return selected;
  }
  const onPath=await fromPath(env,'codex.exe');
  if(onPath)return onPath;
  const localAppData=environmentValue(env,'LOCALAPPDATA');
  if(localAppData&&isAbsolute(localAppData)) {
    const cache=join(localAppData,'OpenAI','Codex','bin');
    const entries=await readdir(cache,{withFileTypes:true}).catch(()=>[]);
    const candidates=await Promise.all(entries.filter(entry=>entry.isDirectory()).map(async entry=>{
      const path=join(cache,entry.name,'codex.exe');return {path,time:await fileTimestamp(path)};
    }));
    const newest=candidates.filter((candidate):candidate is {path:string;time:number}=>candidate.time!==undefined)
      .sort((a,b)=>b.time-a.time||a.path.localeCompare(b.path))[0];
    if(newest)return newest.path;
  }
  throw new Error('CODEX_EXECUTABLE_NOT_FOUND');
}
