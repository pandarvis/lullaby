import { useState } from 'react';
import type { Diagnostic,Session } from '../../../shared/contracts';
import { IrisSelect } from '../app/IrisSelect';
const effortLabels:Record<string,string>={low:'Faible',medium:'Moyen',high:'Élevé',xhigh:'Très élevé',max:'Maximum',ultra:'Ultra',minimal:'Minimal',none:'Aucun'};
// Native permission values: Claude modes, or Codex `approval/sandbox`.
const permissionLabels:Record<string,string>={default:'Avec demandes',acceptEdits:'Éditions auto',plan:'Mode plan',auto:'Auto',dontAsk:'Refus sans demande',bypassPermissions:'Sans autorisation',
  'on-request/workspace-write':'Avec demandes','never/workspace-write':'Auto · projet','on-request/read-only':'Lecture seule','never/read-only':'Lecture seule','untrusted/workspace-write':'Demandes strictes','untrusted/read-only':'Demandes strictes','never/danger-full-access':'Accès complet'};
const native=(value:string|undefined,fallback:string)=>value?`${value} · natif`:fallback;
export function ComposerOptions({session,diagnostic,onError,onBusy}:{session:Session;diagnostic?:Diagnostic;onError:(s:string)=>void;onBusy:(b:boolean)=>void}){
  const [saving,setSaving]=useState(false);const running=['running','waiting'].includes(session.phase)||saving;
  const model=diagnostic?.models?.find(m=>m.id===(session.choices.model??diagnostic.configuredModel));
  async function configure(key:'model'|'effort'|'permissionProfile',value:string){
    const choices={...session.choices};if(value)choices[key]=value;else delete choices[key];if(key==='model')delete choices.effort;
    setSaving(true);onBusy(true);try{const result=await window.lullaby.configureSession(session.id,choices);if(!result.ok)onError(result.message);}catch{onError('Le réglage n’a pas pu être enregistré.');}finally{setSaving(false);onBusy(false);}
  }
  const models=[{value:'',label:native(diagnostic?.native?.modelName??diagnostic?.configuredModel,'Modèle natif'),description:'Utiliser le modèle de votre configuration.'},...(diagnostic?.models?.map(m=>({value:m.id,label:m.name}))??[])];
  if(session.choices.model&&!models.some(m=>m.value===session.choices.model))models.push({value:session.choices.model,label:session.choices.model});
  return <div className="composer-options">
    <div className="permission-choice"><IrisSelect label="Autorisations" icon="shield" disabled={running} value={session.choices.permissionProfile??'native'} onChange={value=>void configure('permissionProfile',value)} options={[
      {value:'native',label:native(diagnostic?.native?.permission&&(permissionLabels[diagnostic.native.permission]??diagnostic.native.permission),'Réglages natifs'),description:'Reprendre les permissions de votre configuration.'},
      {value:'ask',label:'Avec demandes',description:'Demander les autorisations supplémentaires nécessaires.'},
      {value:'auto',label:session.provider==='claude'?'Éditions auto':'Auto · projet',description:session.provider==='claude'?'Autoriser les éditions ; les autres outils gardent leurs règles.':'Agir dans le projet sans demande ; les actions interdites sont refusées.'},
      {value:'plan',label:session.provider==='claude'?'Mode plan':'Lecture seule',description:'Analyser et préparer, sans modifier les fichiers.'},
    ]}/></div>
    <div className="model-choice"><IrisSelect label="Modèle" disabled={running} value={session.choices.model??''} onChange={value=>void configure('model',value)} options={models}/></div>
    <div className="effort-choice"><IrisSelect label="Effort" disabled={running||!model?.efforts.length} value={session.choices.effort??''} onChange={value=>void configure('effort',value)} options={[{value:'',label:native(!session.choices.model&&diagnostic?.native?.effort?effortLabels[diagnostic.native.effort]??diagnostic.native.effort:undefined,'Effort natif')},...(model?.efforts.map(effort=>({value:effort,label:effortLabels[effort]??effort}))??[])]}/></div>
  </div>;
}
