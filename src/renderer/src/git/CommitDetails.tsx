import type { GitCommit,GitRef } from '../../../shared/git';
export function CommitDetails({commit,refs,parent,onParent}:{commit:GitCommit;refs:GitRef[];parent:string|null;onParent(parent:string|null):void}) {
  return <div className="git-commit-details"><h3>{commit.subject||'(sans message)'}</h3><p>{commit.author} <span>· {commit.date}</span></p><code className="git-full-oid">{commit.oid}</code>
    {refs.length>0&&<p>{refs.map(ref=>`${ref.name} (${ref.kind==='remote'?'distante connue':ref.kind==='tag'?'tag':'branche'})`).join(' · ')}</p>}
    {commit.parents.length?<label className="git-parent">Comparer au parent<select aria-label="Parent de comparaison" value={parent??commit.parents[0]} onChange={event=>onParent(event.target.value)}>{commit.parents.map((oid,index)=><option key={oid} value={oid}>Parent {index+1} · {oid}</option>)}</select></label>:<p className="git-root-note">Commit racine · comparaison avec un arbre vide</p>}
  </div>;
}
