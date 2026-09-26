import type { Diagnostic, Project, Provider, PromptRequest, ReplyRequest, Result, Session, Snapshot, LaunchChoices, NetworkProfile, NetworkSnapshot, ProxyState } from './contracts';
export interface LullabyApi {
  pickProject(): Promise<Result<Project | null>>;
  snapshot(): Promise<Result<Snapshot>>;
  createSession(projectId: string, provider: Provider, nativeId?:string): Promise<Result<Session>>;
  configureSession(sessionId:string,choices:LaunchChoices):Promise<Result<void>>;
  networkSettings():Promise<Result<NetworkSnapshot>>;
  saveNetworkProfile(profile:NetworkProfile):Promise<Result<void>>;
  startProxy(provider:Provider):Promise<Result<ProxyState>>;
  stopProxy(provider:Provider):Promise<Result<ProxyState>>;
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
  configureSession:'lullaby:configure-session',
  networkSettings:'lullaby:network-settings',saveNetworkProfile:'lullaby:save-network',startProxy:'lullaby:start-proxy',stopProxy:'lullaby:stop-proxy',
} as const;
