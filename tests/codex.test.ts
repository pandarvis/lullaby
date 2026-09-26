import { expect, test } from 'vitest';
import { assertCodexSubscription } from '../src/main/diagnostics/providers';
import { codexEvents } from '../src/main/providers/codex/messages';
test('requires ChatGPT and the built-in OpenAI provider',()=>{
  expect(()=>assertCodexSubscription({account:{type:'chatgpt'},requiresOpenaiAuth:true},{model_provider:'openai'})).not.toThrow();
  expect(()=>assertCodexSubscription({account:{type:'apiKey'}},{})).toThrow();
  expect(()=>assertCodexSubscription({account:{type:'chatgpt'},requiresOpenaiAuth:true},{model_provider:'custom'})).toThrow();
  expect(()=>assertCodexSubscription({account:{type:'chatgpt'},requiresOpenaiAuth:true},{model_providers:{openai:{base_url:'https://custom.invalid'}}})).toThrow();
});
test('maps only the active thread and turn, final text replaces fragments',()=>{
  expect(codexEvents({method:'item/agentMessage/delta',params:{threadId:'other',turnId:'t',itemId:'i',delta:'no'}},'a','t')).toEqual([]);
  expect(codexEvents({method:'item/agentMessage/delta',params:{threadId:'a',turnId:'t',itemId:'i',delta:'hello'}},'a','t')[0]).toMatchObject({kind:'text',mode:'append',itemId:'i'});
  expect(codexEvents({method:'item/completed',params:{threadId:'a',turnId:'t',item:{type:'agentMessage',id:'i',text:'hello'}}},'a','t')[0]).toMatchObject({kind:'text',mode:'replace',itemId:'i'});
  expect(codexEvents({method:'turn/completed',params:{threadId:'a',turn:{id:'t',status:'failed'}}},'a','t')[0]).toMatchObject({kind:'error'});
});
