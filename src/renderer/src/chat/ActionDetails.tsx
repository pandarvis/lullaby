import type { ChatItem } from '../../../shared/contracts';
import { UiIcon } from '../app/UiIcon';
import { actionPresentation } from './actionPresentation';
export function ActionDetails({actions}:{actions:ChatItem['actions']}){
  return <div className="actions">{actions.map(action=>{const presentation=actionPresentation(action);return <details key={action.id} className={`action ${action.state}`}><summary><UiIcon name={presentation.icon}/><span className="action-description"><strong>{presentation.label}</strong>{presentation.context&&<code>{presentation.context}</code>}</span><span className="action-state">{action.state==='running'?'En cours':action.state==='error'?'À vérifier':'Terminé'}</span><span className="action-chevron">⌄</span></summary><pre>{action.detail}</pre></details>;})}</div>;
}
