import { useState } from 'react';
import type { Diagnostic,Session } from '../../../shared/contracts';
import { UiIcon } from '../app/UiIcon';
const effortLabels:Record<string,string>={low:'Faible',medium:'Moyen',high:'Élevé',xhigh:'Très élevé',max:'Maximum',ultra:'Ultra',minimal:'Minimal',none:'Aucun'};
export function ComposerOptions({session,diagnostic,onError,onBusy}:{session:Session;diagnostic?:Diagnostic;onError:(s:string)=>void;onBusy:(b:boolean)=>void}){
  const [saving,setSaving]=useState(false);const running=['running','waiting'].includes(session.phase)||saving;
  const model=diagnostic?.models?.find(m=>m.id===(session.choices.model??diagnostic.configuredModel));
  async function configure(key:'model'|'effort'|'permissionProfile',value:string){
    const choices={...session.choices};if(value)choices[key]=value;else delete choices[key];if(key==='model')delete choices.effort;
    setSaving(true);onBusy(true);try{const result=await window.lullaby.configureSession(session.id,choices);if(!result.ok)onError(result.message);}catch{onError('Le réglage n’a pas pu être enregistré.');}finally{setSaving(false);onBusy(false);}
  }
  const permission=session.choices.permissionProfile??'native';
  const hint=permission==='auto'?(session.provider==='claude'?'Modifications de fichiers autorisées ; les autres outils suivent les règles Claude.':'Actions autonomes dans le bac à sable du projet ; les actions interdites restent refusées.'):permission==='plan'?'Analyse en lecture seule.':permission==='ask'?'Le moteur demande les autorisations nécessaires.':'Permissions de votre configuration native.';
  return <div className="composer-options">
    <label className="permission-choice" title={hint}><UiIcon name="shield"/><span className="sr-only">Autorisations</span><select aria-label="Autorisations" disabled={running} value={permission} onChange={e=>void configure('permissionProfile',e.target.value)}><option value="native">Natif</option><option value="ask">Avec demandes</option><option value="auto">{session.provider==='claude'?'Accepter les éditions':'Auto · projet'}</option><option value="plan">Lecture seule</option></select></label>
    <label className="model-choice"><span className="sr-only">Modèle</span><select aria-label="Modèle" title="Modèle" disabled={running} value={session.choices.model??''} onChange={e=>void configure('model',e.target.value)}><option value="">{diagnostic?.configuredModel??'Modèle natif'}</option>{diagnostic?.models?.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}{session.choices.model&&!diagnostic?.models?.some(m=>m.id===session.choices.model)&&<option value={session.choices.model}>{session.choices.model}</option>}</select></label>
    <label className="effort-choice"><span className="sr-only">Effort</span><select aria-label="Effort" title="Effort de raisonnement" disabled={running||!model?.efforts.length} value={session.choices.effort??''} onChange={e=>void configure('effort',e.target.value)}><option value="">Effort natif</option>{model?.efforts.map(effort=><option key={effort} value={effort}>{effortLabels[effort]??effort}</option>)}</select></label>
  </div>;
}
