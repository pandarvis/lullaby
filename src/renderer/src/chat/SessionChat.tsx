import { useContext } from 'react';
import { AssistantRuntimeProvider, ThreadPrimitive, MessagePrimitive, ComposerPrimitive, ActionBarPrimitive, useAuiState } from '@assistant-ui/react';
import { MarkdownTextPrimitive, type CodeHeaderProps } from '@assistant-ui/react-markdown';
import { SnapshotContext } from './sessionStore';
import { useSessionRuntime } from './useSessionRuntime';
import { ApprovalPanel } from './ApprovalPanel';
import { ActionDetails } from './ActionDetails';
function CodeHeader({language,code}:CodeHeaderProps){return <div className="code-header"><span>{language||'code'}</span><button onClick={()=>void navigator.clipboard.writeText(code)}>Copier</button></div>;}
function Markdown(){return <MarkdownTextPrimitive components={{CodeHeader}}/>;}
function Message(){
  const message=useAuiState(s=>s.message);const snapshot=useContext(SnapshotContext);
  const item=Object.values(snapshot.messages).flat().find(item=>item.id===message.id);
  return <MessagePrimitive.Root className={`message ${message.role}`}><div className="message-author">{message.role==='user'?'Vous':'Agent'}</div><div className="message-content"><MessagePrimitive.Parts components={{Text:Markdown}}/>{item?.actions.length? <ActionDetails actions={item.actions}/>:null}</div>{item?.text&&<ActionBarPrimitive.Root className="message-actions"><ActionBarPrimitive.Copy className="text-button">Copier</ActionBarPrimitive.Copy></ActionBarPrimitive.Root>}</MessagePrimitive.Root>;
}
export function SessionChat({sessionId}:{sessionId:string}){
  const {runtime,isRunning,error}=useSessionRuntime(sessionId);const snapshot=useContext(SnapshotContext);
  const pending=snapshot.pending.filter(event=>event.sessionId===sessionId);
  return <AssistantRuntimeProvider runtime={runtime}><ThreadPrimitive.Root className="chat">
    <ThreadPrimitive.Viewport className="chat-viewport">
      <ThreadPrimitive.Empty><div className="chat-empty"><div className="eyebrow">UNE CONVERSATION, UN FIL À GARDER</div><h2>Par quoi commence-t-on ?</h2><p>Décrivez votre idée. L’agent travaille dans le dossier de ce projet.</p></div></ThreadPrimitive.Empty>
      <ThreadPrimitive.Messages components={{UserMessage:Message,AssistantMessage:Message}}/>
    </ThreadPrimitive.Viewport>
    <div className="composer-area">{pending.map(event=><ApprovalPanel key={event.eventId} event={event}/>)}{error&&<p className="notice" role="alert">{error}</p>}
      <ThreadPrimitive.ScrollToBottom className="scroll-bottom">Revenir en bas ↓</ThreadPrimitive.ScrollToBottom>
      <ComposerPrimitive.Root className="composer"><ComposerPrimitive.Input aria-label="Votre message" placeholder="Écrivez à votre agent…" className="composer-input" addAttachmentOnPaste={false}/><div className="composer-footer"><span>Entrée pour envoyer · Maj + Entrée pour une ligne</span>{isRunning?<ComposerPrimitive.Cancel className="secondary">Arrêter</ComposerPrimitive.Cancel>:<ComposerPrimitive.Send className="primary">Envoyer ↑</ComposerPrimitive.Send>}</div></ComposerPrimitive.Root>
      <p className="chat-footnote">Le moteur conserve son contexte, ses instructions et ses skills natifs.</p>
    </div>
  </ThreadPrimitive.Root></AssistantRuntimeProvider>;
}
