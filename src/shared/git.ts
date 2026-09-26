export type GitCommit={oid:string;parents:string[];author:string;date:string;subject:string};
export type GitRef={name:string;oid:string;kind:'local'|'remote'|'tag'};
export type ChangeArea='index'|'worktree'|'untracked'|'conflict';
export type GitChange={id:string;path:string;oldPath?:string;area:ChangeArea;status:string};
export type GitSnapshot={id:string;projectId:string;capturedAt:string;root:string|null;state:'ready'|'unborn'|'not-repository'|'git-unavailable';head:string|null;branch:string|null;refs:GitRef[];commits:GitCommit[];changes:GitChange[];truncated:boolean;changedDuringRead:boolean};
export type CommitChange={id:string;path:string;oldPath?:string;status:string};
export type GitDiff={kind:'text'|'binary'|'submodule'|'symlink';text:string;truncated:boolean;capturedAt?:string;changedDuringRead?:boolean;format?:'unified'|'file'};
export type DiffTarget={kind:'local';changeId:string}|{kind:'commit';oid:string;parent:string|null;changeId:string};
export interface GitApi {
  read(projectId:string):Promise<GitSnapshot>;
  loadMore(snapshotId:string):Promise<GitSnapshot>;
  commitFiles(snapshotId:string,oid:string,parent:string|null):Promise<CommitChange[]>;
  diff(snapshotId:string,target:DiffTarget):Promise<GitDiff>;
  cancel(projectId:string,scope?:'files'|'diff'):Promise<void>;
}
