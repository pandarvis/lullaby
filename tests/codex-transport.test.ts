import { expect, test } from 'vitest';
import { JsonRpcLines, RpcProcess } from '../src/main/providers/codex/transport';

test('decodes fragmented lines and UTF-8 without duplicating messages',()=>{
  const parser=new JsonRpcLines();
  expect(parser.push(Buffer.from('{"id":1,"res'))).toEqual([]);
  expect(parser.push(Buffer.from('ult":{}}\n'))).toEqual([{id:1,result:{}}]);
  const value=Buffer.from('{"text":"été"}\n');const position=value.indexOf(0xc3)+1;
  expect(parser.push(value.subarray(0,position))).toEqual([]);
  expect(parser.push(value.subarray(position))).toEqual([{text:'été'}]);parser.finish();
});
test('rejects malformed, incomplete and oversized protocol lines',()=>{
  expect(()=>new JsonRpcLines().push(Buffer.from('not json\n'))).toThrow('INVALID_JSON_RPC');
  const parser=new JsonRpcLines();parser.push(Buffer.from('{'));expect(()=>parser.finish()).toThrow('TRUNCATED_JSON_RPC');
  expect(()=>new JsonRpcLines().push(Buffer.alloc(16*1024*1024+1,65))).toThrow('RPC_LINE_TOO_LARGE');
});
test('process launch failure rejects requests promptly',async()=>{
  const rpc=new RpcProcess('lullaby-executable-does-not-exist',[],process.cwd(),{});
  await expect(rpc.request('test',{})).rejects.toThrow('CODEX_PROCESS_FAILED');await rpc.close();
});
test('correlates concurrent calls while handling server requests separately',async()=>{
  const script=`let data='';process.stdin.on('data',chunk=>{data+=chunk;let i;while((i=data.indexOf('\\n'))>=0){const m=JSON.parse(data.slice(0,i));data=data.slice(i+1);if(m.method){process.stdout.write(JSON.stringify({id:99,method:'approval',params:{}})+'\\n');setTimeout(()=>process.stdout.write(JSON.stringify({id:m.id,result:m.params})+'\\n'),m.params.delay);}}});`;
  const rpc=new RpcProcess(process.execPath,['-e',script],process.cwd(),{...process.env});let server=0;
  rpc.onMessage=message=>{if(message.method==='approval'){server++;rpc.respond(message.id,{decision:'decline'});}};
  const results=await Promise.all([rpc.request('slow',{delay:20}),rpc.request('fast',{delay:1})]);
  expect(results).toEqual([{delay:20},{delay:1}]);expect(server).toBe(2);await rpc.close();
});

test('a dead process rejects pending calls and late responses cannot satisfy another call',async()=>{
  const dead=new RpcProcess(process.execPath,['-e','process.stdin.once("data",()=>process.exit(0))'],process.cwd(),{...process.env});
  await expect(dead.request('test',{})).rejects.toThrow('CODEX_PROCESS_CLOSED');await dead.close();
  const late=new RpcProcess(process.execPath,['-e','process.stdin.on("data",()=>{process.stdout.write(JSON.stringify({id:900,result:"late"})+"\\n")})'],process.cwd(),{...process.env});
  await expect(late.request('test',{},100)).rejects.toThrow('CODEX_RPC_TIMEOUT');await late.close();
});
