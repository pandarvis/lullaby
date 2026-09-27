import type { ChatItem } from '../../../shared/contracts';
export function actionPresentation(action:ChatItem['actions'][number]){
  const name=action.label.toLowerCase();
  const kind=/réflexion|reasoning|thinking/.test(name)?'thinking':/bash|commandexecution|shell|terminal|powershell|pwsh|exec_command|^cmd$/.test(name)?'terminal':/write|edit|filechange|patch/.test(name)?'edit':/read|glob|grep|search/.test(name)?'search':/config/.test(name)?'settings':'tool';
  const label=({thinking:'Réflexion',terminal:'Commande',edit:'Modification de fichiers',search:'Lecture / recherche',settings:'Configuration native',tool:action.label})[kind];
  let context='';
  try{const detail=JSON.parse(action.detail);const input=detail.input??detail;context=input.command??input.file_path??input.path??input.pattern??'';if(typeof context!=='string')context='';}catch{/* Plain output stays in the expandable details. */}
  return {icon:kind==='thinking'?'spark':kind==='edit'?'file':kind==='tool'?'settings':kind,label,context};
}
