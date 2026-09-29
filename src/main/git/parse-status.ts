import { createHash } from 'node:crypto';
import type { ChangeArea,GitChange,CommitChange } from '../../shared/git';
export const changeId=(...parts:string[])=>createHash('sha256').update(JSON.stringify(parts)).digest('hex');
export function parseStatus(data:Buffer):GitChange[] {
  const fields=data.toString('utf8').split('\0');const changes:GitChange[]=[];
  for(let i=0;i<fields.length;i++) {
    const record=fields[i];if(!record)continue;
    const status=record.slice(0,2),path=record.slice(3);
    const oldPath=/[RC]/.test(status)?fields[++i]:undefined;
    const add=(area:ChangeArea,code:string)=>changes.push({id:changeId(area,path),path,...(oldPath?{oldPath}:{}),area,status:code});
    if(status==='??'){add('untracked','?');continue;}
    if(['DD','AU','UD','UA','DU','AA','UU'].includes(status)){add('conflict',status);continue;}
    if(status[0]&&status[0]!==' '&&status[0]!=='!')add('index',status[0]);
    if(status[1]&&status[1]!==' '&&status[1]!=='!')add('worktree',status[1]);
  }
  return changes;
}
export function parseCommitFiles(data:Buffer,key:string):CommitChange[] {
  const fields=data.toString('utf8').split('\0');const result:CommitChange[]=[];
  for(let i=0;i<fields.length;){const status=fields[i++];if(!status)continue;let path=fields[i++];let oldPath:string|undefined;
    if(/^[RC]/.test(status)){oldPath=path;path=fields[i++];}
    if(path===undefined)throw new Error('GIT_FAILED');result.push({id:changeId(key,path),path,status,...(oldPath?{oldPath}:{})});
  }
  return result;
}
