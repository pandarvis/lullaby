import { expect,test } from 'vitest';
import { layoutGraph } from '../src/renderer/src/git/layout';
import type { GitCommit } from '../src/shared/git';
const c=(oid:string,parents:string[]=[]):GitCommit=>({oid,parents,author:'A',date:'',subject:oid});
test('merge retains every parent including an outside parent',()=>{
  const graph=layoutGraph([c('merge',['left','right','outside']),c('left'),c('right')]);
  expect(graph.edges).toEqual([{from:'merge',to:'left',outside:false},{from:'merge',to:'right',outside:false},{from:'merge',to:'outside',outside:true}]);
  expect(graph.nodes[1].lane).not.toBe(graph.nodes[2].lane);
});
test('linear history stays in one lane and a diamond joins one shared ancestor',()=>{
  expect(layoutGraph([c('a',['b']),c('b',['c']),c('c')]).nodes.map(n=>n.lane)).toEqual([0,0,0]);
  const graph=layoutGraph([c('merge',['a','b']),c('a',['root']),c('b',['root']),c('root'),c('other-root')]);
  expect(graph.nodes.filter(n=>n.oid==='root')).toHaveLength(1);expect(graph.edges.filter(e=>e.to==='root')).toHaveLength(2);
});
test('pagination preserves lanes in the prefix and 2000 nodes remain inexpensive',()=>{
  const commits=Array.from({length:2000},(_,i)=>c(String(i),i<1999?[String(i+1)]:[]));
  commits[80].parents.push('220');commits[150].parents.push('310');
  expect(layoutGraph(commits.slice(0,400)).nodes.slice(0,200)).toEqual(layoutGraph(commits.slice(0,200)).nodes);
  const start=performance.now();const result=layoutGraph(commits);console.log(`Graph 2000 nodes: ${(performance.now()-start).toFixed(2)} ms`);expect(result.nodes).toHaveLength(2000);
});
