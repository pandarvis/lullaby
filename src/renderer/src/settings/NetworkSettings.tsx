import { useEffect, useRef, useState } from 'react';
import type { NetworkProfile, NetworkSnapshot, Provider, ProxyLogLine } from '../../../shared/contracts';
const states={stopped:'Arrêté',starting:'Démarrage… attente du port local',owned:'Lancé par Lullaby · port joignable',external:'Relais externe détecté · conservé',error:'Démarrage échoué'};
function time(at:string){return new Date(at).toLocaleTimeString('fr-FR',{hour12:false});}
function RelayJournal({lines}:{lines:ProxyLogLine[]}){
  const ref=useRef<HTMLPreElement>(null);const pinned=useRef(true);
  useEffect(()=>{const box=ref.current;if(box&&pinned.current)box.scrollTop=box.scrollHeight;},[lines.length]);
  return <section className="relay-journal" aria-label="Journal du relais"><h3>Journal du relais</h3>
    {lines.length?<pre ref={ref} onScroll={e=>{const box=e.currentTarget;pinned.current=box.scrollHeight-box.scrollTop-box.clientHeight<8;}}>{lines.map((line,index)=><span key={index} className={line.stream}>{time(line.at)} {line.text}{'\n'}</span>)}</pre>:<p className="field-hint">Aucune activité depuis l’ouverture de Lullaby.</p>}
    <p className="field-hint">Sortie du processus et étapes de Lullaby, en mémoire uniquement. Px avec --debug écrit son détail dans son propre fichier ; --verbose l’affiche ici.</p>
  </section>;
}
export function NetworkSettings({onClose}:{onClose:()=>void}){
  const [data,setData]=useState<NetworkSnapshot>();const [selected,setSelected]=useState<Provider>('claude');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const [url,setUrl]=useState('');const [certificate,setCertificate]=useState('');const [executable,setExecutable]=useState('');const [args,setArgs]=useState('');const [host,setHost]=useState('127.0.0.1');const [port,setPort]=useState('');
  async function refresh(){const result=await window.lullaby.networkSettings();if(result.ok)setData(result.value);else setMessage(result.message);}
  // Polling keeps the relay state and journal live while the panel is open.
  useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),1000);return()=>clearInterval(timer);},[]);
  const saved=data?.profiles.find(p=>p.provider===selected);const savedKey=JSON.stringify(saved??null);
  // Keyed on the saved content so polling never overwrites fields being edited.
  useEffect(()=>{setUrl(saved?.proxyUrl??'');setCertificate(saved?.certificatePath??'');setExecutable(saved?.launcher?.executable??'');setArgs(saved?.launcher?.args.join('\n')??'');setHost(saved?.launcher?.host??'127.0.0.1');setPort(saved?.launcher?.port.toString()??'');},[selected,savedKey]);
  function profile():NetworkProfile{return {provider:selected,...(url.trim()?{proxyUrl:url.trim()}:{}),...(certificate.trim()?{certificatePath:certificate.trim()}:{}),...(executable.trim()?{launcher:{executable:executable.trim(),args:args.split('\n').filter(Boolean),host:host.trim(),port:Number(port)}}:{})};}
  async function act(action:'save'|'start'|'stop'){
    setBusy(true);setMessage('');try{
      if(action!=='stop'){const result=await window.lullaby.saveNetworkProfile(profile());if(!result.ok){setMessage(result.message);return;}}
      if(action==='start')void refresh();
      if(action!=='save'){const result=await (action==='start'?window.lullaby.startProxy(selected):window.lullaby.stopProxy(selected));if(!result.ok){setMessage(result.message);return;}if(result.value==='error')setMessage('Le relais n’a pas démarré. Consultez le journal ci-dessous.');}else setMessage('Réglages enregistrés. Ils s’appliquent au prochain lancement du moteur.');
      await refresh();
    }catch{setMessage('Le réglage réseau n’a pas pu être appliqué.');}finally{setBusy(false);}
  }
  const state=data?.states[selected]??'stopped';const owned=['owned','starting'].includes(state);
  return <aside className="settings-panel" aria-label="Réseau et relais"><div className="panel-heading"><h2>Réseau & relais</h2><button className="secondary" onClick={onClose}>Fermer</button></div><p>Chaque moteur garde ses réglages. Aucun relais n’est nécessaire sur un réseau qui fonctionne déjà.</p><label>Moteur<select value={selected} disabled={busy} onChange={e=>setSelected(e.target.value as Provider)}><option value="claude">Claude Code</option><option value="codex">Codex</option></select></label>
    <form className="network-form" onSubmit={e=>{e.preventDefault();void act('save');}}><fieldset disabled={busy||owned}><label>Adresse du proxy HTTP(S)<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Vide : réglage hérité"/></label><label>Certificat d’entreprise (fichier PEM)<input value={certificate} onChange={e=>setCertificate(e.target.value)} placeholder="Vide : réglage hérité"/></label><p className="field-hint">Certificat transmis via {selected==='claude'?'NODE_EXTRA_CA_CERTS':'CODEX_CA_CERTIFICATE'}. Les variables existantes restent héritées si le champ est vide.</p><details><summary>Configurer le lancement du relais</summary><p>Renseignez la commande validée sur votre poste. Px n’est pas installé automatiquement. N’inscrivez aucun mot de passe ou jeton.</p><label>Exécutable Windows<input value={executable} onChange={e=>setExecutable(e.target.value)} placeholder="Chemin de px.exe"/></label><label>Arguments · un argument par ligne<textarea value={args} onChange={e=>setArgs(e.target.value)} rows={3}/></label><div className="network-listener"><label>Écoute locale<input value={host} onChange={e=>setHost(e.target.value)}/></label><label>Port<input type="number" min="1" max="65535" value={port} onChange={e=>setPort(e.target.value)}/></label></div></details><button className="primary">Enregistrer</button></fieldset></form>
    <section className="diagnostic-card"><h3>Relais local</h3><p className={`relay-status ${state}`} role="status"><i aria-hidden="true"/>{states[state]}</p><div className="button-row"><button className="secondary" disabled={busy||owned||!executable||!port} onClick={()=>void act('start')}>{state==='starting'?'Démarrage…':executable?'Enregistrer et lancer':'Configurer le relais'}</button><button className="secondary" disabled={busy||state!=='owned'} onClick={()=>void act('stop')}>Arrêter</button></div><p className="field-hint">Un port joignable ne prouve pas que Claude ou Codex atteint son service. Vérifiez ensuite le moteur et envoyez un message d’essai.</p><RelayJournal lines={data?.logs?.[selected]??[]}/></section>
    <details className="inherited"><summary>Environnement hérité · présence uniquement</summary>{data?.inherited.map(item=><p key={item.name}>{item.name} : {item.present?'présente':'absente'}</p>)}</details>{message&&<p className="notice" role="status">{message}</p>}
  </aside>;
}
