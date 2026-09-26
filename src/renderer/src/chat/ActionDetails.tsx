import type { ChatItem } from '../../../shared/contracts';
export function ActionDetails({actions}:{actions:ChatItem['actions']}){
  return <div className="actions">{actions.map(action=><details key={action.id} className={`action ${action.state}`}><summary><span className="action-dot"/>{action.label}<span>{action.state==='running'?'En cours':action.state==='error'?'À vérifier':'Terminé'}</span></summary><pre>{action.detail}</pre></details>)}</div>;
}
