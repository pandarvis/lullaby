import type { GitDiff } from './git';
export type ReviewFile={path:string;change:'added'|'modified'|'deleted';additions?:number;deletions?:number;diff:GitDiff};
export type TurnReview={runId:string;capturedAt:string;files:ReviewFile[];partial:boolean;notice?:string};
export type Provider = 'claude' | 'codex';
export type EngineConfiguration = {codexExecutable?:string};
export type PreviewInput = {path?:string;html?:string};
export type PreviewDocument = {id:string;title:string;url:string};
export type Phase = 'idle' | 'running' | 'waiting' | 'done' | 'interrupted' | 'error';
// permissionProfile: the last one chosen in the project, applied to its new conversations.
export type Project = { id: string; name: string; cwd: string; folderKey: string; permissionProfile?: string };
export type LaunchChoices = { model?: string; effort?: string; permissionProfile?: string };
export type Session = {
  id: string; projectId: string; provider: Provider; title: string;
  nativeId?: string; phase: Phase; draft: string; choices: LaunchChoices;
};
export type PromptRequest = { sessionId: string; text: string };
export type ReplyRequest = {
  sessionId: string; runId: string; requestId: string;
  answer: { kind: 'allow' | 'deny' } | { kind: 'text'; text: string };
};
export type EventBody =
  | { kind: 'bound'; nativeId: string }
  | { kind: 'text'; itemId: string; mode: 'append' | 'replace'; text: string }
  | { kind: 'action'; itemId: string; label: string; state: 'running' | 'done' | 'error'; detail: string }
  | { kind: 'request'; requestId: string; requestKind: 'approval' | 'question'; text: string }
  | { kind: 'state'; phase: Phase }
  | { kind: 'error'; code: string; message: string };
export type SessionEvent = {
  sessionId: string; runId: string; eventId: string; body: EventBody;
};
export type ChatItem = {
  id: string; role: 'user' | 'assistant'; text: string;
  review?:TurnReview;
  actions: { id: string; label: string; detail: string; state: 'running' | 'done' | 'error' }[];
};
export type Snapshot = {
  revision: number; projects: Project[]; sessions: Session[];
  messages: Record<string, ChatItem[]>; pending: SessionEvent[];
};
export type Diagnostic = {
  provider: Provider; available: boolean; version?: string;
  executablePath?:string;
  auth: 'subscription' | 'missing' | 'ambiguous'; issues: string[];
  skills: { name: string; available: boolean; evidence: string }[];
  configuredModel?: string;
  configuredModelUnavailable?:boolean;
  // What "native" resolves to in the user's configuration, shown next to native choices.
  native?: {modelName?:string;effort?:string;permission?:string};
  models?: {id:string;name:string;efforts:string[];default:boolean}[];
};
export type NetworkProfile = {
  provider: Provider; proxyUrl?: string; certificatePath?: string;
  launcher?: { executable: string; args: string[]; host: string; port: number };
};
export type ProxyState = 'stopped' | 'starting' | 'owned' | 'external' | 'error';
export type ProxyLogLine={at:string;stream:'lullaby'|'stdout'|'stderr';text:string};
export type NetworkSnapshot={profiles:NetworkProfile[];states:Record<Provider,ProxyState>;logs:Record<Provider,ProxyLogLine[]>;inherited:{name:string;present:boolean}[]};
export type Result<T> = { ok: true; value: T } | { ok: false; code: string; message: string };
