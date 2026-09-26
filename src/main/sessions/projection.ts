import type { Snapshot, SessionEvent, ChatItem } from '../../shared/contracts';
export function applyEvent(snapshot: Snapshot, event: SessionEvent): Snapshot {
  const next = structuredClone(snapshot);
  const session = next.sessions.find(s=>s.id === event.sessionId);
  if(!session) return snapshot;
  const body = event.body;
  const messages = next.messages[session.id] ??= [];
  function item(id:string): ChatItem {
    let message = messages.find(m=>m.id === id);
    if(!message) { message = {id,role:'assistant',text:'',actions:[]}; messages.push(message); }
    return message;
  }
  if(body.kind === 'bound') session.nativeId = body.nativeId;
  if(body.kind === 'text') { const message = item(`${event.runId}:${body.itemId}`); message.text = body.mode === 'append' ? message.text + body.text : body.text; }
  if(body.kind === 'action') {
    const message = item(`${event.runId}:actions`);
    const action = {id:body.itemId,label:body.label,detail:body.detail,state:body.state};
    const index = message.actions.findIndex(a=>a.id === body.itemId);
    if(index >= 0) message.actions[index] = action; else message.actions.push(action);
  }
  if(body.kind === 'request') { session.phase = 'waiting'; next.pending.push(event); }
  if(body.kind === 'state') session.phase = body.phase;
  if(body.kind === 'error') { session.phase = 'error'; item(`${event.runId}:error`).text = body.message; }
  next.revision++;
  return next;
}
