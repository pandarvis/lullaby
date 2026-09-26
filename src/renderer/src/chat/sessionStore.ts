import { createContext } from 'react';
import type { Snapshot } from '../../../shared/contracts';
export const emptySnapshot:Snapshot={revision:0,projects:[],sessions:[],messages:{},pending:[]};
export const SnapshotContext=createContext<Snapshot>(emptySnapshot);
export function createSessionStore(initial:Snapshot){
  let current=initial;const listeners=new Set<()=>void>();
  return {getSnapshot:()=>current,subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},
    accept(next:Snapshot){if(next.revision<=current.revision)return;current=next;for(const listener of listeners)listener();}};
}
export const sessionStore=createSessionStore(emptySnapshot);
