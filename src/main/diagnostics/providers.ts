export function checkSubscriptionEnvironment(env:Record<string,string|undefined>,provider:'claude'|'codex'='claude'):void {
  const names=provider==='claude'
    ? ['ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_BASE_URL','CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_USE_VERTEX','CLAUDE_CODE_USE_FOUNDRY']
    : ['OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL'];
  if(names.some(name=>!!env[name])) throw new Error('AUTH_CONFIGURATION_AMBIGUOUS');
}
export function assertClaudeSubscription(account:unknown):void {
  const a=account as {apiProvider?:string;subscriptionType?:string;apiKeySource?:string};
  if(a?.apiProvider!=='firstParty' || !a.subscriptionType || !/pro|max|team|enterprise/i.test(a.subscriptionType) || (a.apiKeySource && a.apiKeySource!=='none')) throw new Error('SUBSCRIPTION_NOT_CONFIRMED');
}
export function assertCodexSubscription(account:any,config:any):void {
  if(account?.account?.type!=='chatgpt'||account.requiresOpenaiAuth!==true)throw new Error('SUBSCRIPTION_NOT_CONFIRMED');
  if((config.model_provider&&config.model_provider!=='openai')||config.model_providers?.openai||config.forced_login_method==='api')throw new Error('AUTH_CONFIGURATION_AMBIGUOUS');
}
