import { expect, test } from 'vitest';
import { checkSubscriptionEnvironment, assertClaudeSubscription } from '../src/main/diagnostics/providers';
import { ClaudeMessages } from '../src/main/providers/claude/messages';
test('refuses API selection without disclosing credentials',()=>{
  expect(()=>checkSubscriptionEnvironment({ANTHROPIC_API_KEY:'secret-test'},'claude')).toThrow('AUTH_CONFIGURATION_AMBIGUOUS');
  expect(()=>checkSubscriptionEnvironment({OPENAI_API_KEY:'secret-test'},'claude')).not.toThrow();
});
test('requires a confirmed first-party subscription',()=>{
  expect(()=>assertClaudeSubscription({apiProvider:'firstParty',subscriptionType:'Claude Max'})).not.toThrow();
  expect(()=>assertClaudeSubscription({apiProvider:'bedrock',subscriptionType:'Claude Max'})).toThrow();
  expect(()=>assertClaudeSubscription({apiProvider:'firstParty'})).toThrow();
});
test('stream and completed assistant text target the same item',()=>{
  const messages=new ClaudeMessages();
  messages.convert({type:'stream_event',event:{type:'message_start',message:{id:'msg1'}}});
  expect(messages.convert({type:'stream_event',event:{type:'content_block_delta',delta:{type:'text_delta',text:'Hi'}}})).toEqual([{kind:'text',itemId:'msg1',mode:'append',text:'Hi'}]);
  expect(messages.convert({type:'assistant',message:{id:'msg1',content:[{type:'text',text:'Hi there'}]}})).toEqual([{kind:'text',itemId:'msg1',mode:'replace',text:'Hi there'}]);
});
test('native init, tool results and failed results remain visible',()=>{
  const messages=new ClaudeMessages();
  expect(messages.convert({type:'system',subtype:'init',session_id:'native'})).toContainEqual({kind:'bound',nativeId:'native'});
  expect(messages.convert({type:'user',message:{content:[{type:'tool_result',tool_use_id:'t',content:'denied',is_error:true}]}})[0]).toMatchObject({kind:'action',itemId:'t',state:'error'});
  expect(messages.convert({type:'result',subtype:'error_during_execution',errors:['quota']})).toContainEqual(expect.objectContaining({kind:'error'}));
});

test('reports native thinking boundaries without exposing thinking content',()=>{
  const messages=new ClaudeMessages();
  messages.convert({type:'stream_event',event:{type:'message_start',message:{id:'m'}}});
  expect(messages.convert({type:'stream_event',event:{type:'content_block_start',index:0,content_block:{type:'thinking'}}})[0]).toMatchObject({kind:'action',label:'Réflexion',state:'running'});
  expect(messages.convert({type:'stream_event',event:{type:'content_block_delta',index:0,delta:{type:'thinking_delta',thinking:'PRIVATE_REASONING'}}})).toEqual([]);
  expect(messages.convert({type:'stream_event',event:{type:'content_block_stop',index:0}})[0]).toMatchObject({kind:'action',label:'Réflexion',state:'done'});
});

test('keeps command context when Claude reports tool output',()=>{
  const messages=new ClaudeMessages();
  messages.convert({type:'assistant',message:{id:'m',content:[{type:'tool_use',id:'t',name:'Bash',input:{command:'dotnet test'}}]}});
  const result=messages.convert({type:'user',message:{content:[{type:'tool_result',tool_use_id:'t',content:'Tests passed'}]}})[0];
  expect(result).toMatchObject({kind:'action',state:'done',label:'Bash'});
  if(result.kind==='action'){expect(result.detail).toContain('dotnet test');expect(result.detail).toContain('Tests passed');}
});
