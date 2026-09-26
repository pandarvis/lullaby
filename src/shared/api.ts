import type { Diagnostic, Project, Provider, PromptRequest, ReplyRequest, Result, Session, Snapshot, LaunchChoices, NetworkProfile, NetworkSnapshot, ProxyState } from './contracts';
import type { GitApi } from './git';
import type { EngineConfiguration, PreviewInput, PreviewDocument } from './contracts';
export type GitBridge={ [K in keyof GitApi]: (...args:Parameters<GitApi[K]>)=>Promise<Result<Awaited<ReturnType<GitApi[K]>>>> };
export interface LullabyApi {
  renameProject(id:string,name:string):Promise<Result<void>>;
  removeProject(id:string):Promise<Result<void>>;
  pickAttachments(kind:'files'|'folder'):Promise<Result<string[]>>;
  previewHtml(projectId:string,input:PreviewInput):Promise<Result<PreviewDocument>>;
  pickPreview(projectId:string):Promise<Result<PreviewDocument|null>>;
  openPreview(id:string):Promise<Result<void>>;
  releasePreview(id:string):Promise<Result<void>>;
  engineSettings():Promise<Result<EngineConfiguration>>;
  saveEngineSettings(settings:EngineConfiguration):Promise<Result<void>>;
  pickCodexExecutable():Promise<Result<string|null>>;
  git:GitBridge;
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
  renameProject:'lullaby:rename-project',removeProject:'lullaby:remove-project',pickAttachments:'lullaby:pick-attachments',
  previewHtml:'lullaby:preview-html',pickPreview:'lullaby:pick-preview',openPreview:'lullaby:open-preview',releasePreview:'lullaby:release-preview',
  engineSettings:'lullaby:engine-settings',saveEngineSettings:'lullaby:save-engines',pickCodexExecutable:'lullaby:pick-codex',
  gitRead:'lullaby:git-read',gitMore:'lullaby:git-more',gitFiles:'lullaby:git-files',gitDiff:'lullaby:git-diff',gitCancel:'lullaby:git-cancel',
  pickProject:'lullaby:pick-project', snapshot:'lullaby:snapshot',
  createSession:'lullaby:create-session', send:'lullaby:send', reply:'lullaby:reply',
  interrupt:'lullaby:interrupt', saveDraft:'lullaby:save-draft', diagnose:'lullaby:diagnose',
  changed:'lullaby:changed',
  configureSession:'lullaby:configure-session',
  networkSettings:'lullaby:network-settings',saveNetworkProfile:'lullaby:save-network',startProxy:'lullaby:start-proxy',stopProxy:'lullaby:stop-proxy',
} as const;
