import type { Diagnostic, Project, Provider, PromptRequest, ReplyRequest, Result, Session, Snapshot } from './contracts';
export interface LullabyApi {
  pickProject(): Promise<Result<Project | null>>;
  snapshot(): Promise<Result<Snapshot>>;
  createSession(projectId: string, provider: Provider): Promise<Result<Session>>;
  send(input: PromptRequest): Promise<Result<{runId: string}>>;
  reply(input: ReplyRequest): Promise<Result<void>>;
  interrupt(sessionId: string): Promise<Result<void>>;
  saveDraft(sessionId: string, text: string): Promise<Result<void>>;
  diagnose(projectId: string): Promise<Result<Diagnostic[]>>;
  subscribe(listener: (snapshot: Snapshot) => void): () => void;
}
export const channels = {
  pickProject:'lullaby:pick-project', snapshot:'lullaby:snapshot',
  createSession:'lullaby:create-session', send:'lullaby:send', reply:'lullaby:reply',
  interrupt:'lullaby:interrupt', saveDraft:'lullaby:save-draft', diagnose:'lullaby:diagnose',
  changed:'lullaby:changed',
} as const;
