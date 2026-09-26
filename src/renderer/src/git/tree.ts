import type { GitChange } from '../../../shared/git';
export type ChangeTreeNode={name:string;path:string;children:ChangeTreeNode[];changes:GitChange[]};
export function buildChangeTree(changes:GitChange[]):ChangeTreeNode[] {
  const roots:ChangeTreeNode[]=[];
  for(const change of changes){let siblings=roots;let path='';for(const [index,name]of change.path.split('/').entries()){
    path=path?`${path}/${name}`:name;let node=siblings.find(n=>n.name===name);if(!node){node={name,path,children:[],changes:[]};siblings.push(node);}
    if(index===change.path.split('/').length-1)node.changes.push(change);siblings=node.children;
  }}
  const sort=(nodes:ChangeTreeNode[])=>{nodes.sort((a,b)=>Number(b.children.length>0)-Number(a.children.length>0)||a.name.localeCompare(b.name));for(const node of nodes)sort(node.children);};sort(roots);return roots;
}
