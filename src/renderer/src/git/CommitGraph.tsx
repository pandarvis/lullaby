import { useMemo } from 'react';
import type { GitSnapshot } from '../../../shared/git';
import { layoutGraph } from './layout';
const rowHeight=58;
export function CommitGraph({snapshot,selected,onSelect}:{snapshot:GitSnapshot;selected?:string;onSelect(oid:string):void}) {
  const graph=useMemo(()=>layoutGraph(snapshot.commits),[snapshot.commits]);
  const positions=useMemo(()=>new Map(graph.nodes.map(node=>[node.oid,node])),[graph]);
  const width=Math.max(58,32+Math.max(0,...graph.nodes.map(n=>n.lane))*20);const height=snapshot.commits.length*rowHeight;
  if(!snapshot.commits.length)return <div className="git-empty">Aucun commit pour le moment.</div>;
  return <div className="git-history-scroll" aria-label="Historique des commits"><div className="git-history-content" style={{minWidth:width+430}}>
    <svg className="git-graph" width={width} height={height} aria-hidden="true">
      {graph.edges.map((edge,index)=>{const from=positions.get(edge.from)!;const to=positions.get(edge.to);const x1=16+from.lane*20,y1=from.row*rowHeight+29,x2=to?16+to.lane*20:x1,y2=to?to.row*rowHeight+29:height-5;
        return <g key={`${edge.from}-${edge.to}`} className={`git-lane lane-${from.lane%4}`}><path d={x1===x2?`M${x1},${y1}V${y2}`:`M${x1},${y1} C${x1},${y1+30} ${x2},${y2-30} ${x2},${y2}`} fill="none" strokeWidth="2" strokeDasharray={edge.outside?'4 4':undefined}/>{edge.outside&&<path d={`m${x2-3},${y2-4} 3,4 3,-4`} fill="none"/>}</g>;
      })}
      {graph.nodes.map(node=><circle key={node.oid} className={`git-node lane-${node.lane%4}`} cx={16+node.lane*20} cy={node.row*rowHeight+29} r={node.oid===selected?6:4.5} strokeWidth="2"/>)}
    </svg>
    <div className="git-commit-list" role="list" style={{paddingLeft:width}} onKeyDown={event=>{
      const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.git-commit-row'));const current=buttons.indexOf(event.target as HTMLButtonElement);
      const index=event.key==='ArrowDown'?Math.min(current+1,buttons.length-1):event.key==='ArrowUp'?Math.max(0,current-1):event.key==='Home'?0:event.key==='End'?buttons.length-1:-1;
      if(index>=0){event.preventDefault();buttons[index]?.focus();}
    }}>{snapshot.commits.map(commit=><div role="listitem" key={commit.oid}><button className={`git-commit-row ${selected===commit.oid?'selected':''}`} aria-pressed={selected===commit.oid} onClick={()=>onSelect(commit.oid)}>
      <span className="git-commit-subject"><strong>{commit.subject||'(sans message)'}</strong><span className="git-ref-list">{snapshot.head===commit.oid&&<span className="git-ref head">{snapshot.branch?'HEAD':'HEAD détachée'}</span>}{snapshot.refs.filter(ref=>ref.oid===commit.oid).map(ref=><span key={`${ref.kind}:${ref.name}`} className={`git-ref ${ref.kind}`} title={ref.kind==='remote'?'Référence distante connue localement':ref.kind==='tag'?'Tag':'Branche locale'}>{ref.kind==='tag'?'◆ ':ref.kind==='remote'?'↗ ':''}{ref.name}</span>)}</span></span>
      <span className="git-commit-meta"><code>{commit.oid.slice(0,8)}</code><span>{commit.author}</span><time dateTime={commit.date}>{commit.date.slice(0,10)}</time></span>
    </button></div>)}</div>
  </div></div>;
}
