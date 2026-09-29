import type { Snapshot } from '../../shared/contracts';
import { readFile, mkdir, open, rename, copyFile, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export const emptySnapshot = (): Snapshot => ({revision:0,projects:[],sessions:[],messages:{},pending:[]});
const writes = new Map<string,Promise<void>>();
const record = (value:unknown): value is Record<string,any> => !!value && typeof value === 'object' && !Array.isArray(value);
function validReview(value:unknown):boolean{
  if(!record(value)||typeof value.runId!=='string'||typeof value.capturedAt!=='string'||!Number.isFinite(Date.parse(value.capturedAt))||typeof value.partial!=='boolean'||!Array.isArray(value.files)||value.files.length>100||(value.notice!==undefined&&typeof value.notice!=='string'))return false;
  return value.files.every((file:unknown)=>record(file)&&typeof file.path==='string'&&['added','modified','deleted'].includes(file.change)&&[file.additions,file.deletions].every(n=>n===undefined||(Number.isSafeInteger(n)&&n>=0))&&record(file.diff)&&['text','binary','submodule','symlink'].includes(file.diff.kind)&&typeof file.diff.text==='string'&&typeof file.diff.truncated==='boolean');
}
function decode(raw:string): Snapshot {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error('STORE_CORRUPT'); }
  if (!record(data)) throw new Error('STORE_CORRUPT');
  if(data.schemaVersion !== 1) throw new Error('STORE_VERSION_UNSUPPORTED');
  const s = data.snapshot;
  const strings = (v:Record<string,any>,keys:string[]) => keys.every(k=>typeof v[k] === 'string');
  if(!record(s) || !Number.isSafeInteger(s.revision) || s.revision < 0 || !Array.isArray(s.projects) || !Array.isArray(s.sessions) || !record(s.messages) || !Array.isArray(s.pending)) throw new Error('STORE_CORRUPT');
  if(s.projects.some((p:unknown)=>!record(p)||!strings(p,['id','name','cwd','folderKey'])||(p.permissionProfile!==undefined&&typeof p.permissionProfile!=='string'))) throw new Error('STORE_CORRUPT');
  if(s.sessions.some((v:unknown)=>!record(v)||!strings(v,['id','projectId','title','draft'])||!['claude','codex'].includes(v.provider)||!['idle','running','waiting','done','interrupted','error'].includes(v.phase)||!record(v.choices)||(v.nativeId !== undefined && typeof v.nativeId !== 'string'))) throw new Error('STORE_CORRUPT');
  if(Object.values(s.messages).some(v=>!Array.isArray(v)||v.some(m=>!record(m)||!strings(m,['id','text'])||!['user','assistant'].includes(m.role)||!Array.isArray(m.actions)||(m.review!==undefined&&!validReview(m.review))))) throw new Error('STORE_CORRUPT');
  return s as Snapshot;
}
export async function readStore(file: string): Promise<Snapshot> {
  try { return decode(await readFile(file,'utf8')); }
  catch(error) { if((error as NodeJS.ErrnoException).code === 'ENOENT') return emptySnapshot(); throw error; }
}
export async function writeStore(file: string, snapshot: Snapshot): Promise<void> {
  const raw = JSON.stringify({schemaVersion:1,snapshot}); decode(raw);
  const operation = (writes.get(file) ?? Promise.resolve()).catch(()=>{}).then(async()=>{
    await mkdir(dirname(file),{recursive:true});
    const temp = `${file}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temp,'wx');
      try { await handle.writeFile(raw,'utf8'); await handle.sync(); } finally { await handle.close(); }
      try { decode(await readFile(file,'utf8')); await copyFile(file,file+'.bak'); }
      catch(error) { if((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      await rename(temp,file);
    } finally { await unlink(temp).catch(()=>{}); }
  });
  writes.set(file,operation);
  try { await operation; } finally { if(writes.get(file) === operation) writes.delete(file); }
}
