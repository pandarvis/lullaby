import type { Diagnostic, EventBody, LaunchChoices, Provider, ReplyRequest } from '../../shared/contracts';
export type RunInput = {
  cwd: string; nativeId?: string; text: string; choices: LaunchChoices;
  env: Record<string, string | undefined>;
};
export type ProviderRun = {
  events: AsyncIterable<{ eventId: string; body: EventBody }>;
  reply(requestId: string, answer: ReplyRequest['answer']): Promise<void>;
  // Applies a permission profile to the running engine; absent when it only takes effect next turn.
  setPermissionProfile?(profile?: string): Promise<void>;
  interrupt(): Promise<void>;
  close(): Promise<void>;
};
export interface ProviderAdapter {
  provider: Provider;
  diagnose(cwd: string,env?:NodeJS.ProcessEnv): Promise<Diagnostic>;
  run(input: RunInput): Promise<ProviderRun>;
  // Releases processes kept between turns; called when Lullaby closes.
  dispose?(): Promise<void>;
}
