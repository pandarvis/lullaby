import type { GitCommit } from '../../shared/git';
export function parseHistory(data:Buffer):GitCommit[] {
  const fields=data.toString('utf8').split('\0');const result:GitCommit[]=[];
  for(let i=0;i+4<fields.length;i+=5) {
    const [oid,parents,author,date,subject]=fields.slice(i,i+5);
    if(!/^[a-f0-9]{40,64}$/.test(oid))throw new Error('GIT_FAILED');
    result.push({oid,parents:parents?parents.split(' '):[],author,date,subject});
  }
  return result;
}
