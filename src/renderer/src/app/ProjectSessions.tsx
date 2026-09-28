import { useState } from 'react';
import type { Diagnostic, Project, Provider, Session } from '../../../shared/contracts';
import { SessionChat } from '../chat/SessionChat';
import { ProviderLogo } from './UiIcon';
export const phaseLabel={idle:'Prêt',running:'Travaille',waiting:'Votre réponse',done:'Terminé',interrupted:'Interrompu',error:'À vérifier'};
// The engine is fixed when a conversation is created; the CLI import keeps its native history.
export function NewConversation({project,onCreated,onError}:{project:Project;onCreated:(sessionId:string)=>void;onError:(message:string)=>void}){
  const [creating,setCreating]=useState(false);const [native,setNative]=useState('');const [provider,setProvider]=useState<Provider>('claude');
  async function create(provider:Provider,nativeId?:string){setCreating(true);try{const result=await window.lullaby.createSession(project.id,provider,nativeId);if(result.ok){setNative('');onCreated(result.value.id);}else onError(result.message);}finally{setCreating(false);}}
  return <section className="new-conversation" aria-label={`Nouvelle conversation dans ${project.name}`}>
    <h1>Nouvelle conversation</h1><p className="muted">{project.name} · <span className="mono">{project.cwd}</span></p>
    <div className="engine-choice">
      <button className="engine-button" disabled={creating} onClick={()=>void create('claude')}><ProviderLogo provider="claude"/><span><strong>Claude Code</strong><small>Abonnement Claude</small></span></button>
      <button className="engine-button" disabled={creating} onClick={()=>void create('codex')}><ProviderLogo provider="codex"/><span><strong>Codex</strong><small>Abonnement ChatGPT</small></span></button>
    </div>
    <details className="import-session"><summary>Reprendre depuis la CLI</summary><p>Utilisez le même dossier et fermez d’abord la session dans l’autre client. L’historique antérieur reste dans le moteur ; le chat affiche les nouveaux échanges.</p><form onSubmit={e=>{e.preventDefault();void create(provider,native.trim());}}><label>Moteur<select value={provider} onChange={e=>setProvider(e.target.value as Provider)}><option value="claude">Claude Code</option><option value="codex">Codex</option></select></label><label>Identifiant natif<input value={native} onChange={e=>setNative(e.target.value)} placeholder="UUID de la session" required/></label><button className="shell-button" disabled={creating||!native.trim()}>Reprendre</button></form></details>
  </section>;
}
export function SessionView({session,diagnostic}:{session:Session;diagnostic?:Diagnostic}){
  return <section className="conversation"><SessionHeader session={session} diagnostic={diagnostic}/><SessionChat key={session.id} sessionId={session.id} diagnostic={diagnostic}/></section>;
}
function SessionHeader({session,diagnostic}:{session:Session;diagnostic?:Diagnostic}){
  return <header className="session-header"><h2 title={session.title}>{session.title}</h2><span className={`phase ${session.phase}`}>{phaseLabel[session.phase]}</span><span className="session-engine"><ProviderLogo provider={session.provider}/>{session.provider==='claude'?'Claude Code':'Codex · ChatGPT'}</span>{diagnostic?.configuredModelUnavailable&&!session.choices.model&&<p className="model-notice">Le modèle configuré n’est plus disponible. Choisissez un modèle près du bouton d’envoi.</p>}{diagnostic?.issues.map(issue=><p className="model-notice" key={issue}>{issue}</p>)}</header>;
}
