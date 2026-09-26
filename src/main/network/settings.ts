import { readFile, mkdir, writeFile, rename, unlink, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { NetworkProfile, Provider, NetworkSnapshot } from '../../shared/contracts';
import { validateNetworkProfile, buildProviderEnv } from './profiles';
import { ProxyController } from './proxy';
export class NetworkSettings {
  private profiles:NetworkProfile[]=[{provider:'claude'},{provider:'codex'}];private queue=Promise.resolve();
  readonly proxy=new ProxyController();
  constructor(private file:string){}
  async load(){try{const raw=JSON.parse(await readFile(this.file,'utf8'));if(raw.schemaVersion!==1||!Array.isArray(raw.profiles))throw new Error('NETWORK_STORE_INVALID');this.profiles=raw.profiles.map(validateNetworkProfile);}
    catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw new Error('NETWORK_STORE_INVALID');}}
  profile(provider:Provider){return structuredClone(this.profiles.find(p=>p.provider===provider)??{provider});}
  env(provider:Provider){return buildProviderEnv(process.env,this.profile(provider));}
  snapshot():NetworkSnapshot{return {profiles:structuredClone(this.profiles),states:{claude:this.proxy.state('claude'),codex:this.proxy.state('codex')},inherited:['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','NODE_EXTRA_CA_CERTS','CODEX_CA_CERTIFICATE','SSL_CERT_FILE'].map(name=>({name,present:Object.keys(process.env).some(key=>key.toUpperCase()===name&&!!process.env[key])}))};}
  async save(profile:NetworkProfile){
    const valid=validateNetworkProfile(profile);if(valid.certificatePath)await access(valid.certificatePath);
    if(['owned','starting'].includes(this.proxy.state(valid.provider)))throw new Error('PROXY_RUNNING');
    const operation=this.queue.catch(()=>{}).then(async()=>{
      const next=[...this.profiles.filter(p=>p.provider!==valid.provider),valid];const temp=`${this.file}.${randomUUID()}.tmp`;
      await mkdir(dirname(this.file),{recursive:true});try{await writeFile(temp,JSON.stringify({schemaVersion:1,profiles:next}),'utf8');await rename(temp,this.file);this.profiles=next;}finally{await unlink(temp).catch(()=>{});}
    });this.queue=operation;await operation;
  }
  async close(){try{await this.queue;}finally{await this.proxy.close();}}
}
