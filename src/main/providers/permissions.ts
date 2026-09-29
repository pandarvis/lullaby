import type { PermissionMode } from '@anthropic-ai/claude-agent-sdk';

export function codexPermissions(profile?:string):{approvalPolicy?:'on-request'|'never';sandbox?:'workspace-write'|'read-only'} {
  switch(profile) {
    case undefined:case 'native':return {};
    case 'ask':return {approvalPolicy:'on-request',sandbox:'workspace-write'};
    case 'auto':return {approvalPolicy:'never',sandbox:'workspace-write'};
    case 'plan':return {approvalPolicy:'on-request',sandbox:'read-only'};
    // 'automatic' is Claude's classifier mode; Codex has no equivalent.
    default:throw new Error('UNSUPPORTED_PERMISSION_PROFILE');
  }
}
export function claudePermissionMode(profile?:string):PermissionMode|undefined {
  switch(profile) {
    case undefined:case 'native':return undefined;
    case 'ask':return 'default';
    case 'auto':return 'acceptEdits';
    case 'plan':return 'plan';
    // Claude Code's auto mode: the engine approves actions it judges safe and asks for the rest.
    case 'automatic':return 'auto';
    default:throw new Error('UNSUPPORTED_PERMISSION_PROFILE');
  }
}
