import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AssistantRuntimeProvider, ThreadPrimitive, MessagePrimitive, ComposerPrimitive, ActionBarPrimitive, useAuiState } from '@assistant-ui/react';
import { MarkdownTextPrimitive, type CodeHeaderProps } from '@assistant-ui/react-markdown';
import { SnapshotContext } from './sessionStore';
import { useSessionRuntime } from './useSessionRuntime';
import { ApprovalPanel } from './ApprovalPanel';
import { ActionDetails } from './ActionDetails';
import type { Diagnostic, PreviewDocument, PreviewInput } from '../../../shared/contracts';
import { ComposerOptions } from './ComposerOptions';
import { PreviewPane } from './PreviewPane';
import { UiIcon } from '../app/UiIcon';
import { useDismiss } from '../app/useDismiss';
import { useKeepBottomOnShrink } from './useKeepBottomOnShrink';
import { htmlPath, safeMarkdownUrl } from './links';
import { CodeHighlight } from './CodeHighlight';
import { AgentActivity } from './AgentActivity';
import { createPortal } from 'react-dom';
import { ShellContext } from '../shell/ShellContext';
import { TurnReviewCard, TurnReviewPane, type ReviewSelection } from './TurnReview';
const ReviewContext=createContext<(selection:ReviewSelection)=>void>(()=>{});
const PreviewContext=createContext<(input:PreviewInput)=>void>(()=>{});
function CodeHeader({language,code}:CodeHeaderProps){const preview=useContext(PreviewContext);return <div className="code-header"><span>{language||'code'}</span><div>{['html','htm'].includes(language?.toLowerCase()??'')&&<button onClick={()=>preview({html:code})}><UiIcon name="preview" flat/>Aperçu</button>}<button onClick={()=>void navigator.clipboard.writeText(code)}>Copier</button></div></div>;}
function Markdown(){
  const preview=useContext(PreviewContext);
  return <MarkdownTextPrimitive urlTransform={safeMarkdownUrl} components={{CodeHeader,SyntaxHighlighter:CodeHighlight,a:({href,children})=>{
    const local=href?htmlPath(href):undefined;
    if(local)return <button className="inline-link" onClick={()=>preview({path:local})}>{children}<UiIcon name="preview" flat/></button>;
    return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
  }}}/>;
}
function Message(){
  const message=useAuiState(s=>s.message);const snapshot=useContext(SnapshotContext);const examine=useContext(ReviewContext);
  const item=Object.values(snapshot.messages).flat().find(item=>item.id===message.id);
  return <MessagePrimitive.Root className={`message ${message.role}`}>{!item?.review&&<div className="message-author">{message.role==='user'?'Vous':'Agent'}</div>}<div className="message-content"><MessagePrimitive.Parts components={{Text:Markdown}}/>{item?.review&&<TurnReviewCard review={item.review} onExamine={examine}/>}{item?.actions.length? <ActionDetails actions={item.actions}/>:null}</div>{item?.text&&<ActionBarPrimitive.Root className="message-actions"><ActionBarPrimitive.Copy className="copy-button" aria-label="Copier le message" title="Copier"><span className="copy-idle"><UiIcon name="copy" flat/></span><span className="copy-done"><UiIcon name="check" flat/></span></ActionBarPrimitive.Copy></ActionBarPrimitive.Root>}</MessagePrimitive.Root>;
}
export function SessionChat({sessionId,diagnostic}:{sessionId:string;diagnostic?:Diagnostic}){
  const [configuring,setConfiguring]=useState(false);const [review,setReview]=useState<ReviewSelection>();
  const {runtime,session,isRunning,sending,error}=useSessionRuntime(sessionId,configuring);const snapshot=useContext(SnapshotContext);
  const [notice,setNotice]=useState('');const viewport=useRef<HTMLDivElement>(null);useKeepBottomOnShrink(viewport);const [menu,setMenu]=useState(false);const menuRef=useRef<HTMLDivElement>(null),addRef=useRef<HTMLButtonElement>(null);useDismiss(menu,()=>setMenu(false),[menuRef,addRef],addRef);const [document,setDocument]=useState<PreviewDocument>();
  const alive=useRef(true);const previewId=useRef<string|undefined>(undefined);const previewSerial=useRef(0);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(previewId.current)void window.lullaby.releasePreview(previewId.current);};},[]);
  const shell=useContext(ShellContext);
  const pending=snapshot.pending.filter(event=>event.sessionId===sessionId);
  function acceptPreview(next:PreviewDocument,serial:number){if(!alive.current||serial!==previewSerial.current){void window.lullaby.releasePreview(next.id);return;}if(previewId.current)void window.lullaby.releasePreview(previewId.current);previewId.current=next.id;setDocument(next);setReview(undefined);shell.openPanel('preview');}
  async function preview(input?:PreviewInput){const serial=++previewSerial.current;setMenu(false);setNotice('');try{const result=input?await window.lullaby.previewHtml(session.projectId,input):await window.lullaby.pickPreview(session.projectId);if(result.ok){if(result.value)acceptPreview(result.value,serial);}else if(alive.current)setNotice(result.message);}catch{if(alive.current)setNotice('Impossible d’ouvrir cet aperçu.');}}
  async function attach(kind:'files'|'folder'){
    setMenu(false);try{const result=await window.lullaby.pickAttachments(kind);if(!alive.current)return;
      if(!result.ok){setNotice(result.message);return;}if(result.value.length){const previous=runtime.thread.composer.getState().text;runtime.thread.composer.setText(`${previous}${previous?'\n\n':''}Références locales à consulter avec vos outils :\n${result.value.map(path=>`- ${JSON.stringify(path)}`).join('\n')}`);}
    }catch{if(alive.current)setNotice('La sélection de fichiers a échoué.');}
  }
  function closePreview(){previewSerial.current++;if(previewId.current)void window.lullaby.releasePreview(previewId.current);previewId.current=undefined;setDocument(undefined);}
  return <AssistantRuntimeProvider runtime={runtime}><ReviewContext.Provider value={selection=>{closePreview();setReview(selection);}}><PreviewContext.Provider value={input=>void preview(input)}><div className={`chat-layout ${document&&!shell.previewSlot?'has-preview':review?'has-review':''}`}><ThreadPrimitive.Root className="chat">
    <ThreadPrimitive.Viewport ref={viewport} className="chat-viewport" turnAnchor="top">
      <ThreadPrimitive.Empty><div className="chat-empty"><h2>Nouvelle conversation</h2><p>Qu’allons-nous construire ?</p></div></ThreadPrimitive.Empty>
      <ThreadPrimitive.Messages components={{UserMessage:Message,AssistantMessage:Message}}/>
    </ThreadPrimitive.Viewport>
    <div className="composer-area"><AgentActivity sessionId={sessionId} phase={session.phase} sending={sending} provider={session.provider} messages={snapshot.messages[sessionId]??[]}/>{pending.map(event=><ApprovalPanel key={event.eventId} event={event}/>)}{(error||notice)&&<p className="notice" role="alert">{error||notice}</p>}
      <ThreadPrimitive.ScrollToBottom className="scroll-bottom">Revenir en bas ↓</ThreadPrimitive.ScrollToBottom>
      {menu&&<div ref={menuRef} className="attach-menu" aria-label="Ajouter au message"><button onClick={()=>void attach('files')}><UiIcon name="file" flat/>Fichiers</button><button onClick={()=>void attach('folder')}><UiIcon name="folder" flat/>Dossier</button><button onClick={()=>void preview()}><UiIcon name="preview" flat/>Ouvrir un aperçu HTML</button><small>Les fichiers sont joints comme références locales à lire par l’agent.</small></div>}
      <ComposerPrimitive.Root className="composer"><ComposerPrimitive.Input aria-label="Votre message" placeholder="Écrivez à votre agent…" className="composer-input" addAttachmentOnPaste={false}/><div className="composer-footer"><button ref={addRef} type="button" className="composer-add icon-button" aria-label="Ajouter au message" title="Fichiers, dossiers et aperçu" aria-expanded={menu} onClick={()=>setMenu(!menu)}><UiIcon name="plus"/></button><ComposerOptions session={session} diagnostic={diagnostic} onError={setNotice} onBusy={setConfiguring}/>{isRunning?<ComposerPrimitive.Cancel className="send-button stop" aria-label="Arrêter" title="Arrêter"><UiIcon name="stop"/></ComposerPrimitive.Cancel>:<ComposerPrimitive.Send className="send-button" aria-label="Envoyer" title="Envoyer · Entrée"><UiIcon name="arrow"/></ComposerPrimitive.Send>}</div></ComposerPrimitive.Root>

    </div>
  </ThreadPrimitive.Root>{review&&<TurnReviewPane key={`${review.review.runId}:${review.path??""}`} selection={review} onClose={()=>setReview(undefined)}/>} {document&&(shell.previewSlot?createPortal(<PreviewPane document={document} onClose={closePreview} onError={setNotice}/>,shell.previewSlot):<PreviewPane document={document} onClose={closePreview} onError={setNotice}/>)}</div></PreviewContext.Provider></ReviewContext.Provider></AssistantRuntimeProvider>;
}
