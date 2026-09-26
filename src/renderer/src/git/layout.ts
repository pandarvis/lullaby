import type { GitCommit } from '../../../shared/git';
export type GraphLayout={nodes:{oid:string;row:number;lane:number}[];edges:{from:string;to:string;outside:boolean}[]};
export function layoutGraph(commits:GitCommit[]):GraphLayout {
  const lanes:(string|null)[]=[];const present=new Set(commits.map(c=>c.oid));const nodes:GraphLayout['nodes']=[],edges:GraphLayout['edges']=[];
  const free=()=>{const index=lanes.indexOf(null);return index===-1?lanes.length:index;};
  commits.forEach((commit,row)=>{
    let lane=lanes.indexOf(commit.oid);if(lane===-1)lane=free();lanes[lane]=null;nodes.push({oid:commit.oid,row,lane});
    commit.parents.forEach((parent,index)=>{
      if(!lanes.includes(parent))lanes[index===0&&lanes[lane]===null?lane:free()]=parent;
      edges.push({from:commit.oid,to:parent,outside:!present.has(parent)});
    });
  });
  return {nodes,edges};
}
