import { expect, test } from 'vitest';
import { ClaudeAdapter, type ClaudeDeps } from '../src/main/providers/claude/adapter';
// A stand-in Query whose account lookup behaves as each scenario requires.
function sdk(account:(signal:AbortSignal)=>Promise<unknown>){
  return ((params:{options:{abortController:AbortController}})=>({
    accountInfo:()=>account(params.options.abortController.signal),
    supportedCommands:async()=>[],supportedModels:async()=>[],close(){},
  })) as unknown as ClaudeDeps['query'];
}
const never=(signal:AbortSignal)=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('Operation aborted'))));
test('a diagnostic names why the Claude subscription is not confirmed',async()=>{
  const slow=await new ClaudeAdapter({query:sdk(never),startupMs:20,settings:async()=>({})}).diagnose('C:/project',{});
  expect(slow.auth).toBe('missing');expect(slow.issues[0]).toMatch(/n’a pas répondu en 1 s/);
  const free=await new ClaudeAdapter({query:sdk(async()=>({apiProvider:'firstParty',subscriptionType:'free'})),settings:async()=>({})}).diagnose('C:/project',{});
  expect(free.issues[0]).toMatch(/aucun abonnement/);
  const crash=await new ClaudeAdapter({query:sdk(async()=>{throw new Error('spawn EPERM');}),settings:async()=>({})}).diagnose('C:/project',{});
  expect(crash.issues[0]).toContain('« spawn EPERM »');
  const api=await new ClaudeAdapter({query:sdk(async()=>({})),settings:async()=>({})}).diagnose('C:/project',{ANTHROPIC_API_KEY:'x'});
  expect(api.auth).toBe('ambiguous');expect(api.issues[0]).toMatch(/facturation API/);
  const ok=await new ClaudeAdapter({query:sdk(async()=>({apiProvider:'firstParty',subscriptionType:'Claude Max'})),settings:async()=>({})}).diagnose('C:/project',{});
  expect(ok.auth).toBe('subscription');expect(ok.issues).toEqual([]);
});
