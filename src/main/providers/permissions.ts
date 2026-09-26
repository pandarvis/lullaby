import type { PermissionMode } from '@anthropic-ai/claude-agent-sdk';

export function codexPermissions(profile?:string):{approvalPolicy?:'on-request'|'never';sandbox?:'workspace-write'|'read-only'} {
  switch(profile) {
    case undefined:case 'native':return {};
    case 'ask':return {approvalPolicy:'on-request',sandbox:'workspace-write'};
    case 'auto':return {approvalPolicy:'never',sandbox:'workspace-write'};
    case 'plan':return {approvalPolicy:'on-request',sandbox:'read-only'};
    default:throw new Error('UNSUPPORTED_PERMISSION_PROFILE');
  }
}
export function claudePermissionMode(profile?:string):PermissionMode|undefined {
  switch(profile) {
    case undefined:case 'native':return undefined;
    case 'ask':return 'default';
    case 'auto':return 'acceptEdits';
    case 'plan':return 'plan';
    default:throw new Error('UNSUPPORTED_PERMISSION_PROFILE');
  }
}
