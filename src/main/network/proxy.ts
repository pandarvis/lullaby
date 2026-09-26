import { createConnection } from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import type { NetworkProfile, Provider, ProxyState } from '../../shared/contracts';
type Owned={process:ChildProcess;exited:Promise<void>;host:string;port:number};
export async function isListening(host:string,port:number):Promise<boolean>{
  return new Promise(resolve=>{const socket=createConnection({host,port});let settled=false;
    const finish=(value:boolean)=>{if(settled)return;settled=true;socket.destroy();resolve(value);};
    socket.setTimeout(250,()=>finish(false));socket.once('connect',()=>finish(true));socket.once('error',()=>finish(false));
  });
}
export class ProxyController {
  private owned=new Map<Provider,Owned>();private states:Record<Provider,ProxyState>={claude:'stopped',codex:'stopped'};
  private starts=new Map<Provider,Promise<ProxyState>>();private closing=false;
  constructor(private timeoutMs=8000){}
  state(provider:Provider){return this.states[provider];}
  start(profile:NetworkProfile):Promise<ProxyState>{
    if(this.closing)return Promise.reject(new Error('CLOSING'));
    const existing=this.starts.get(profile.provider);if(existing)return existing;
    const starting=this.launch(profile);this.starts.set(profile.provider,starting);
    void starting.finally(()=>this.starts.delete(profile.provider)).catch(()=>{});return starting;
  }
  private async launch(profile:NetworkProfile):Promise<ProxyState>{
    const provider=profile.provider;const launcher=profile.launcher;if(!launcher)throw new Error('PROXY_NOT_CONFIGURED');
    if(this.owned.has(provider))return this.states[provider];
    if(await isListening(launcher.host,launcher.port))return this.states[provider]='external';
    this.states[provider]='starting';
    const child=spawn(launcher.executable,launcher.args,{shell:false,windowsHide:true,stdio:'ignore'});
    let failed=false;child.once('error',()=>{failed=true;});
    const owned:Owned={process:child,host:launcher.host,port:launcher.port,exited:new Promise(resolve=>child.once('close',()=>{failed=true;if(this.owned.get(provider)===owned){this.owned.delete(provider);this.states[provider]='error';}resolve();}))};
    this.owned.set(provider,owned);
    const deadline=Date.now()+this.timeoutMs;
    while(!failed&&Date.now()<deadline&&!this.closing){
      if(await isListening(launcher.host,launcher.port))return this.states[provider]='owned';
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    await this.stop(provider);return this.states[provider]='error';
  }
  async stop(provider:Provider):Promise<ProxyState>{
    const owned=this.owned.get(provider);if(!owned)return this.states[provider];
    this.owned.delete(provider);owned.process.kill();await owned.exited;
    return this.states[provider]='stopped';
  }
  async close(){this.closing=true;await Promise.all([...this.starts.values()].map(run=>run.catch(()=>{})));await Promise.all([...this.owned.keys()].map(provider=>this.stop(provider)));}
}
