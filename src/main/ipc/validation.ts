import type { PromptRequest, ReplyRequest, Provider, LaunchChoices } from '../../shared/contracts';
export function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_REQUEST');
  if (Object.keys(value).some(key => !keys.includes(key))) throw new Error('INVALID_REQUEST');
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 200000, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && !value.trim())) throw new Error('INVALID_REQUEST');
  return value;
}
export function id(value: unknown): string { return text(value, 200); }
export function nativeId(value:unknown):string|undefined {if(value===undefined)return undefined;const result=text(value,100);if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(result))throw new Error('INVALID_NATIVE_ID');return result;}
export function launchChoices(value:unknown):LaunchChoices {
  const data=object(value,['model','effort','permissionProfile']);const choices:LaunchChoices={};
  if(data.model!==undefined)choices.model=text(data.model,200);
  if(data.effort!==undefined)choices.effort=text(data.effort,30);
  if(data.permissionProfile!==undefined){if(!['native','ask','auto','plan','automatic'].includes(String(data.permissionProfile)))throw new Error('INVALID_PERMISSION_PROFILE');choices.permissionProfile=String(data.permissionProfile);}
  return choices;
}
export function provider(value: unknown): Provider {
  if (value !== 'claude' && value !== 'codex') throw new Error('INVALID_PROVIDER');
  return value;
}
export function validateSend(value: unknown): PromptRequest {
  const data = object(value, ['sessionId','text']);
  return { sessionId: id(data.sessionId), text: text(data.text) };
}
export function validateReply(value: unknown): ReplyRequest {
  const data = object(value, ['sessionId','runId','requestId','answer']);
  const answer = object(data.answer, ['kind','text']);
  if (!['allow','deny','text'].includes(String(answer.kind))) throw new Error('INVALID_ANSWER');
  return {sessionId:id(data.sessionId),runId:id(data.runId),requestId:id(data.requestId),
    answer:answer.kind === 'text' ? {kind:'text',text:text(answer.text)} : {kind:answer.kind as 'allow'|'deny'}};
}
