import { randomUUID } from 'node:crypto';
import { lstat,realpath,readlink,open } from 'node:fs/promises';
import { join,relative,isAbsolute } from 'node:path';
import type { GitApi,GitSnapshot,GitRef,GitDiff,GitCommit,DiffTarget,CommitChange } from '../../shared/git';
import { runGit,GitError,type GitRunOptions } from './runner';
import { parseStatus,parseCommitFiles } from './parse-status';
import { parseHistory } from './parse-history';
const OID=/^[a-f0-9]{40,64}$/;
const MAX_DIFF=1024*1024;
const diffFlags=['--no-ext-diff','--no-textconv','--no-color'];
const statusArgs=['status','--porcelain=v1','-z','--untracked-files=all','--ignore-submodules=none'];
type Capture={head:string|null;branch:string|null;refs:GitRef[];status:Buffer;fingerprint:string};
type Entry={snapshot:GitSnapshot;tips:string[];fingerprint:string;limit:number;files:Map<string,CommitChange[]>};
export class GitReader implements GitApi {
  private snapshots=new Map<string,Entry>();
  private tasks=new Map<string,AbortController>();
  constructor(private projectFolder:(id:string)=>string|undefined,private options:{executable?:string}={}){}
  private run(cwd:string,args:string[],signal:AbortSignal,options:GitRunOptions={}) {return runGit(cwd,args,{...this.options,...options,signal});}
  private async task<T>(projectId:string,slot:string,fn:(signal:AbortSignal)=>Promise<T>) {
    const key=`${projectId}:${slot}`;this.tasks.get(key)?.abort();const controller=new AbortController();this.tasks.set(key,controller);
    try{return await fn(controller.signal);}finally{if(this.tasks.get(key)===controller)this.tasks.delete(key);}
  }
  async cancel(projectId:string,scope?:'files'|'diff'){for(const [key,controller]of this.tasks)if(scope?key===`${projectId}:${scope}`:key.startsWith(`${projectId}:`))controller.abort();}
  private entry(id:string) {const entry=this.snapshots.get(id);if(!entry)throw new Error('STALE_SNAPSHOT');return entry;}
  private async optional(cwd:string,args:string[],signal:AbortSignal,codes:number[]) {
    try{return (await this.run(cwd,args,signal)).toString('utf8').trim();}catch(error){if(error instanceof GitError&&codes.includes(error.exitCode!))return null;throw error;}
  }
  private async capture(root:string,signal:AbortSignal):Promise<Capture> {
    const [head,branch,raw,status]=await Promise.all([
      this.optional(root,['rev-parse','--verify','--quiet','HEAD^{commit}'],signal,[1]),
      this.optional(root,['symbolic-ref','--quiet','--short','HEAD'],signal,[1]),
      this.run(root,['for-each-ref','--format=%(refname)%00%(objectname)%00%(*objectname)%00%(objecttype)%00%(*objecttype)','refs/heads','refs/remotes','refs/tags'],signal),
      this.run(root,statusArgs,signal),
    ]);
    const refs:GitRef[]=[];
    for(const line of raw.toString('utf8').split('\n')){
      if(!line)continue;const [name,object,peeled,type,peeledType]=line.trimEnd().split('\0');
      const oid=type==='commit'?object:peeledType==='commit'?peeled:null;if(!oid||!OID.test(oid))continue;
      const kind=name.startsWith('refs/heads/')?'local':name.startsWith('refs/remotes/')?'remote':'tag';
      refs.push({name:name.replace(/^refs\/(heads|remotes|tags)\//,''),oid,kind});
    }
    return {head,branch,refs,status,fingerprint:JSON.stringify([head,branch,refs,status.toString('base64')])};
  }
  private async history(root:string,tips:string[],limit:number,signal:AbortSignal) {
    if(!tips.length)return [];
    return parseHistory(await this.run(root,['log','--topo-order','-z','--format=%H%x00%P%x00%an%x00%aI%x00%s',`--max-count=${limit+1}`,...tips,'--'],signal));
  }
  async read(projectId:string):Promise<GitSnapshot> {
    const cwd=this.projectFolder(projectId);if(!cwd)throw new Error('PROJECT_NOT_FOUND');
    return this.task(projectId,'read',async signal=>{
      const snapshot:GitSnapshot={id:randomUUID(),projectId,capturedAt:new Date().toISOString(),root:null,state:'ready',head:null,branch:null,refs:[],commits:[],changes:[],truncated:false,changedDuringRead:false};
      try {snapshot.root=(await this.run(cwd,['rev-parse','--show-toplevel'],signal)).toString('utf8').trim();}
      catch(error){if(error instanceof GitError&&(error.message==='GIT_UNAVAILABLE'||error.exitCode===128)){snapshot.state=error.message==='GIT_UNAVAILABLE'?'git-unavailable':'not-repository';return snapshot;}throw error;}
      const before=await this.capture(snapshot.root,signal);
      const tips=[...new Set([before.head,...before.refs.map(r=>r.oid)].filter((oid):oid is string=>!!oid&&OID.test(oid)))];
      const history=await this.history(snapshot.root,tips,200,signal);const after=await this.capture(snapshot.root,signal);
      Object.assign(snapshot,{head:before.head,branch:before.branch,refs:before.refs,changes:parseStatus(before.status),state:before.head?'ready':'unborn',commits:history.slice(0,200),truncated:history.length>200,changedDuringRead:before.fingerprint!==after.fingerprint});
      // Retain a small number of recent views for in-flight selections, not an unbounded history.
      const same=[...this.snapshots].filter(([,entry])=>entry.snapshot.projectId===projectId);
      for(const [id]of same.slice(0,-1))this.snapshots.delete(id);
      while(this.snapshots.size>=16)this.snapshots.delete(this.snapshots.keys().next().value!);
      this.snapshots.set(snapshot.id,{snapshot,tips,fingerprint:before.fingerprint,limit:200,files:new Map()});
      return structuredClone(snapshot);
    });
  }
  async loadMore(snapshotId:string) {
    const entry=this.entry(snapshotId);return this.task(entry.snapshot.projectId,'read',async signal=>{
      const limit=Math.min(entry.limit+200,2000);const commits=await this.history(entry.snapshot.root!,entry.tips,limit,signal);
      const current=await this.capture(entry.snapshot.root!,signal);entry.limit=limit;
      Object.assign(entry.snapshot,{commits:commits.slice(0,limit),truncated:commits.length>limit,changedDuringRead:entry.snapshot.changedDuringRead||current.fingerprint!==entry.fingerprint});
      return structuredClone(entry.snapshot);
    });
  }
  private commit(entry:Entry,oid:string,parent:string|null):GitCommit {
    const commit=entry.snapshot.commits.find(c=>c.oid===oid);
    if(!commit||!OID.test(oid)||(commit.parents.length?parent===null||!commit.parents.includes(parent):parent!==null))throw new Error('INVALID_TARGET');
    return commit;
  }
  private comparison(oid:string,parent:string|null) {return parent?['diff-tree','-r','--no-commit-id',...diffFlags,parent,oid]:['diff-tree','--root','-r','--no-commit-id',...diffFlags,oid];}
  async commitFiles(snapshotId:string,oid:string,parent:string|null) {
    const entry=this.entry(snapshotId);this.commit(entry,oid,parent);
    return this.task(entry.snapshot.projectId,'files',async signal=>{
      const key=`${oid}:${parent??''}`;const files=parseCommitFiles(await this.run(entry.snapshot.root!,[...this.comparison(oid,parent),'--name-status','-z','-M','--'],signal),key);
      if(signal.aborted)throw new Error('GIT_CANCELLED');entry.files.clear();entry.files.set(key,files);return structuredClone(files);
    });
  }
  private async untracked(root:string,path:string):Promise<GitDiff> {
    const rootReal=await realpath(root);const segments=path.split('/');let current=root;
    if(isAbsolute(path)||segments.some(segment=>!segment||segment==='..'||segment==='.'||segment.includes('\\')))throw new Error('INVALID_TARGET');
    for(const segment of segments){current=join(current,segment);const stat=await lstat(current);if(stat.isSymbolicLink())return {kind:'symlink',text:`Lien vers ${await readlink(current)} — cible non consultée.`,truncated:false};}
    const canonical=await realpath(current);const rel=relative(rootReal,canonical);if(rel==='..'||rel.startsWith(`..\\`)||rel.startsWith('../')||isAbsolute(rel))throw new Error('INVALID_TARGET');
    const handle=await open(current,'r');try{
      const stat=await handle.stat();if(!stat.isFile())throw new Error('INVALID_TARGET');
      const buffer=Buffer.alloc(Math.min(stat.size,MAX_DIFF+1));const {bytesRead}=await handle.read(buffer,0,buffer.length,0);const content=buffer.subarray(0,bytesRead);
      if(content.includes(0))return {kind:'binary',text:'Fichier binaire non suivi.',truncated:stat.size>MAX_DIFF};
      return {kind:'text',format:'file',text:content.subarray(0,MAX_DIFF).toString('utf8'),truncated:stat.size>MAX_DIFF};
    }finally{await handle.close();}
  }
  async diff(snapshotId:string,target:DiffTarget):Promise<GitDiff> {
    const entry=this.entry(snapshotId);if(!target||typeof target!=='object')throw new Error('INVALID_TARGET');
    let file;let args:string[];let treeOid=entry.snapshot.head;
    if(target.kind==='local') {
      file=entry.snapshot.changes.find(c=>c.id===target.changeId);if(!file)throw new Error('INVALID_TARGET');
      args=['diff',...diffFlags,...(file.area==='index'?['--cached']:[]),'--',file.path,...(file.oldPath?[file.oldPath]:[])];
    }else if(target.kind==='commit') {
      this.commit(entry,target.oid,target.parent);file=entry.files.get(`${target.oid}:${target.parent??''}`)?.find(c=>c.id===target.changeId);if(!file)throw new Error('INVALID_TARGET');treeOid=target.oid;
      args=[...this.comparison(target.oid,target.parent),'-p','--',file.path,...(file.oldPath?[file.oldPath]:[])];
    }else throw new Error('INVALID_TARGET');
    const selected=file;
    return this.task(entry.snapshot.projectId,'diff',async signal=>{
      const root=entry.snapshot.root!;const before=target.kind==='local'?await this.capture(root,signal):undefined;
      let diff:GitDiff;
      if('area'in selected&&selected.area==='untracked')diff=await this.untracked(root,selected.path);
      else {
        const modeArgs=target.kind==='local'?['ls-files','--stage','-z','--',selected.path]:['ls-tree','-z',treeOid!,'--',selected.path];
        const mode=(await this.run(root,modeArgs,signal)).toString('utf8').slice(0,6);
        if(mode==='160000')diff={kind:'submodule',text:'Sous-module : consultez son dépôt pour les changements internes.',truncated:false};
        else {const data=await this.run(root,args,signal,{limit:MAX_DIFF+1,truncate:true});const text=data.subarray(0,MAX_DIFF).toString('utf8');
          diff={kind:mode==='120000'?'symlink':/^Binary files .* differ$/m.test(text)||text.includes('GIT binary patch')?'binary':'text',text,truncated:data.length>MAX_DIFF};}
      }
      const after=before?await this.capture(root,signal):undefined;
      if(signal.aborted)throw new Error('GIT_CANCELLED');
      return {...diff,capturedAt:new Date().toISOString(),changedDuringRead:!!before&&(before.fingerprint!==entry.fingerprint||before.fingerprint!==after!.fingerprint)};
    });
  }
}
