import { expect, test } from 'vitest';
import { createServer } from 'node:net';
import { buildProviderEnv, validateNetworkProfile } from '../src/main/network/profiles';
import { ProxyController } from '../src/main/network/proxy';
import { NetworkSettings } from '../src/main/network/settings';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('keeps provider environments isolated and inherits when no override exists',()=>{
  const base={PATH:'native',https_proxy:'http://old:1'};
  const env=buildProviderEnv(base,{provider:'claude',proxyUrl:'http://127.0.0.1:3128',certificatePath:'C:\\cert.pem'});
  expect(env.HTTPS_PROXY).toBe('http://127.0.0.1:3128');expect(env.https_proxy).toBeUndefined();expect(env.NODE_EXTRA_CA_CERTS).toBe('C:\\cert.pem');
  expect(buildProviderEnv(base,{provider:'codex'})).toEqual(base);expect(base.https_proxy).toBe('http://old:1');
});
test('rejects credential URLs and launcher credentials',()=>{
  expect(()=>validateNetworkProfile({provider:'claude',proxyUrl:'http://user:pass@localhost:80'})).toThrow();
  expect(()=>validateNetworkProfile({provider:'claude',launcher:{executable:'px.exe',args:['--password=secret'],host:'127.0.0.1',port:3128}})).toThrow();
  expect(()=>validateNetworkProfile({provider:'claude',launcher:{executable:'px.exe',args:[],host:'company.invalid',port:3128}})).toThrow();
});
test('reuses an external local listener and never stops it',async()=>{
  const server=createServer(socket=>socket.end());await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=(server.address() as any).port;const controller=new ProxyController();
  try{expect(await controller.start({provider:'claude',launcher:{executable:'absent.exe',args:[],host:'127.0.0.1',port}})).toBe('external');expect(await controller.stop('claude')).toBe('external');expect(server.listening).toBe(true);}
  finally{await controller.close();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('absent launcher and timeout are explicit and do not leak the owned process',async()=>{
  const controller=new ProxyController(150);
  await expect(controller.start({provider:'claude'})).rejects.toThrow('PROXY_NOT_CONFIGURED');
  expect(await controller.start({provider:'claude',launcher:{executable:'absent-lullaby.exe',args:[],host:'127.0.0.1',port:65532}})).toBe('error');
  expect(await controller.start({provider:'codex',launcher:{executable:process.execPath,args:['-e','setInterval(()=>{},1000)'],host:'127.0.0.1',port:65532}})).toBe('error');
  await controller.close();
});
test('stores independent profiles atomically across reload',async()=>{
  const file=join(await mkdtemp(join(tmpdir(),'lullaby-network-')),'network.json');const settings=new NetworkSettings(file);await settings.load();
  await Promise.all([settings.save({provider:'claude',proxyUrl:'http://127.0.0.1:3128'}),settings.save({provider:'codex'})]);
  const restored=new NetworkSettings(file);await restored.load();expect(restored.profile('claude').proxyUrl).toBe('http://127.0.0.1:3128/');expect(restored.profile('codex').proxyUrl).toBeUndefined();
  expect(JSON.parse(await readFile(file,'utf8')).schemaVersion).toBe(1);await settings.close();await restored.close();
});
test('owns a fake launcher and stops it on app shutdown',async()=>{
  const reservation=createServer();await new Promise<void>(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=(reservation.address() as any).port;await new Promise<void>(resolve=>reservation.close(()=>resolve()));
  const controller=new ProxyController(2000);
  expect(await controller.start({provider:'claude',launcher:{executable:process.execPath,args:['-e',`require('net').createServer(s=>s.end()).listen(${port},'127.0.0.1')`],host:'127.0.0.1',port}})).toBe('owned');
  await controller.close();expect(controller.state('claude')).toBe('stopped');
});
