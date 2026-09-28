import { useCallback, useState } from 'react';
// Browser storage can be blocked or cleared: every access falls back silently.
export function readStored<T>(key:string,fallback:T,valid:(value:unknown)=>value is T):T{
  try{const raw=localStorage.getItem(key);if(raw===null)return fallback;const value:unknown=JSON.parse(raw);return valid(value)?value:fallback;}catch{return fallback;}
}
export function writeStored(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Preference stays in memory. */}}
export const isBoolean=(value:unknown):value is boolean=>typeof value==='boolean';
export const isNumber=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
export const isFlags=(value:unknown):value is Record<string,boolean>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(item=>typeof item==='boolean');
export function usePersistentState<T>(key:string,fallback:T,valid:(value:unknown)=>value is T){
  const [value,setValue]=useState(()=>readStored(key,fallback,valid));
  const update=useCallback((next:T|((previous:T)=>T))=>{
    setValue(previous=>{const resolved=typeof next==='function'?(next as (previous:T)=>T)(previous):next;writeStored(key,resolved);return resolved;});
  },[key]);
  return [value,update] as const;
}
