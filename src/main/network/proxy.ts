import { createConnection } from 'node:net';
import { basename } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import type { NetworkProfile, Provider, ProxyLogLine, ProxyState } from '../../shared/contracts';
type Owned={process:ChildProcess;exited:Promise<void>;host:string;port:number};
// The journal stays in memory: relay output can name internal hosts.
const MAX_LOG_LINES=300,MAX_LINE_LENGTH=1000;
export async function isListening(host:string,port:number):Promise<boolean>{
  return new Promise(resolve=>{const socket=createConnection({host,port});let settled=false;
    const finish=(value:boolean)=>{if(settled)return;settled=true;socket.destroy();resolve(value);};
    socket.setTimeout(250,()=>finish(false));socket.once('connect',()=>finish(true));socket.once('error',()=>finish(false));
  });
}
export class ProxyController {
  private owned=new Map<Provider,Owned>();private states:Record<Provider,ProxyState>={claude:'stopped',codex:'stopped'};
  private starts=new Map<Provider,Promise<ProxyState>>();private closing=false;
  private logs:Record<Provider,ProxyLogLine[]>={claude:[],codex:[]};
  constructor(private timeoutMs=8000){}
  state(provider:Provider){return this.states[provider];}
  log(provider:Provider):ProxyLogLine[]{return structuredClone(this.logs[provider]);}
  private write(provider:Provider,stream:ProxyLogLine['stream'],text:string){
    const lines=this.logs[provider];lines.push({at:new Date().toISOString(),stream,text:text.slice(0,MAX_LINE_LENGTH)});
    if(lines.length>MAX_LOG_LINES)lines.splice(0,lines.length-MAX_LOG_LINES);
  }
  private capture(provider:Provider,stream:'stdout'|'stderr',source:NodeJS.ReadableStream|null){
    if(!source)return;let rest='';source.setEncoding('utf8');
    source.on('data',(chunk:string)=>{const parts=(rest+chunk).split(/\r?\n/);rest=parts.pop()??'';for(const line of parts)if(line.trim())this.write(provider,stream,line);});
    source.on('end',()=>{if(rest.trim())this.write(provider,stream,rest);rest='';});
  }
  start(profile:NetworkProfile):Promise<ProxyState>{
    if(this.closing)return Promise.reject(new Error('CLOSING'));
    const existing=this.starts.get(profile.provider);if(existing)return existing;
    const starting=this.launch(profile);this.starts.set(profile.provider,starting);
    void starting.finally(()=>this.starts.delete(profile.provider)).catch(()=>{});return starting;
  }
  private async launch(profile:NetworkProfile):Promise<ProxyState>{
    const provider=profile.provider;const launcher=profile.launcher;if(!launcher)throw new Error('PROXY_NOT_CONFIGURED');
    if(this.owned.has(provider))return this.states[provider];
    const address=`${launcher.host}:${launcher.port}`;
    if(await isListening(launcher.host,launcher.port)){this.write(provider,'lullaby',`Port ${address} déjà joignable : relais externe conservé, non lancé par Lullaby.`);return this.states[provider]='external';}
    this.states[provider]='starting';const started=Date.now();
    this.write(provider,'lullaby',`Lancement : ${basename(launcher.executable)} ${launcher.args.join(' ')} · attente du port ${address}`);
    const child=spawn(launcher.executable,launcher.args,{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
    this.capture(provider,'stdout',child.stdout);this.capture(provider,'stderr',child.stderr);
    let failed=false;child.once('error',error=>{failed=true;this.write(provider,'lullaby',`Échec du lancement : ${(error as NodeJS.ErrnoException).code??error.message}`);});
    const owned:Owned={process:child,host:launcher.host,port:launcher.port,exited:new Promise(resolve=>child.once('close',code=>{
      failed=true;this.write(provider,'lullaby',`Processus terminé${code===null?'':` (code ${code})`}.`);
      if(this.owned.get(provider)===owned){this.owned.delete(provider);this.states[provider]='error';}resolve();
    }))};
    this.owned.set(provider,owned);
    const deadline=started+this.timeoutMs;
    while(!failed&&Date.now()<deadline&&!this.closing){
      if(await isListening(launcher.host,launcher.port)){this.write(provider,'lullaby',`Port ${address} joignable après ${((Date.now()-started)/1000).toFixed(1)} s.`);return this.states[provider]='owned';}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    if(!failed)this.write(provider,'lullaby',`Port ${address} toujours injoignable après ${this.timeoutMs/1000} s : arrêt du processus.`);
    await this.stop(provider);return this.states[provider]='error';
  }
  async stop(provider:Provider):Promise<ProxyState>{
    const owned=this.owned.get(provider);if(!owned)return this.states[provider];
    this.write(provider,'lullaby','Arrêt demandé.');
    this.owned.delete(provider);owned.process.kill();await owned.exited;
    return this.states[provider]='stopped';
  }
  async close(){this.closing=true;await Promise.all([...this.starts.values()].map(run=>run.catch(()=>{})));await Promise.all([...this.owned.keys()].map(provider=>this.stop(provider)));}
}
