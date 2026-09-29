export type View={kind:'atelier'}|{kind:'project';projectId:string}|{kind:'session';projectId:string;sessionId:string};
export type Navigation={entries:View[];index:number};
const limit=50;
export const initialNavigation:Navigation={entries:[{kind:'atelier'}],index:0};
export const currentView=(nav:Navigation)=>nav.entries[nav.index];
export const canBack=(nav:Navigation)=>nav.index>0;
export const canForward=(nav:Navigation)=>nav.index<nav.entries.length-1;
export function sameView(a:View,b:View){
  if(a.kind==='atelier'||b.kind==='atelier')return a.kind===b.kind;
  if(a.kind==='project'||b.kind==='project')return a.kind===b.kind&&a.projectId===b.projectId;
  return a.sessionId===b.sessionId;
}
export function navigate(nav:Navigation,view:View):Navigation{
  if(sameView(currentView(nav),view))return nav;
  const entries=[...nav.entries.slice(0,nav.index+1),view].slice(-limit);
  return {entries,index:entries.length-1};
}
export const back=(nav:Navigation):Navigation=>canBack(nav)?{...nav,index:nav.index-1}:nav;
export const forward=(nav:Navigation):Navigation=>canForward(nav)?{...nav,index:nav.index+1}:nav;
// Drops views whose project or conversation disappeared, without leaving duplicates side by side.
export function prune(nav:Navigation,exists:(view:View)=>boolean):Navigation{
  const entries:View[]=[];let index=0;
  nav.entries.forEach((view,position)=>{
    if(!exists(view))return;
    if(!entries.length||!sameView(entries[entries.length-1],view))entries.push(view);
    if(position<=nav.index)index=entries.length-1;
  });
  if(!entries.length)return initialNavigation;
  if(entries.length===nav.entries.length)return nav;
  return {entries,index};
}
