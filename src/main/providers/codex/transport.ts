import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';

export type RpcMessage={id?:string|number;method?:string;params?:any;result?:any;error?:unknown};
// Keeps the engine's own explanation (bounded) so diagnostics can name the real cause.
export class RpcRejected extends Error {
  readonly detail:string;
  constructor(readonly method:string,error:unknown){
    super('CODEX_RPC_REJECTED');
    const message=(error as {message?:unknown}|undefined)?.message;
    this.detail=typeof message==='string'?message.replace(/\s+/g,' ').trim().slice(0,300):'';
  }
}
export class JsonRpcLines {
  private decoder=new StringDecoder('utf8');private buffer='';
  push(chunk:Buffer):RpcMessage[] {
    this.buffer+=this.decoder.write(chunk);const messages:RpcMessage[]=[];
    let newline:number;
    while((newline=this.buffer.indexOf('\n'))>=0){
      const line=this.buffer.slice(0,newline);this.buffer=this.buffer.slice(newline+1);
      if(Buffer.byteLength(line)>16*1024*1024)throw new Error('RPC_LINE_TOO_LARGE');
      if(!line.trim())continue;
      try{const message=JSON.parse(line);if(!message||typeof message!=='object'||Array.isArray(message))throw new Error();messages.push(message);}
      catch{throw new Error('INVALID_JSON_RPC');}
    }
    if(Buffer.byteLength(this.buffer)>16*1024*1024)throw new Error('RPC_LINE_TOO_LARGE');
    return messages;
  }
  finish(){this.buffer+=this.decoder.end();if(this.buffer.trim())throw new Error('TRUNCATED_JSON_RPC');}
}
export class RpcProcess {
  onMessage:(message:RpcMessage)=>void=()=>{};
  onFailure:(error:Error)=>void=()=>{};
  private child:ChildProcessWithoutNullStreams;
  private nextId=0;private failure?:Error;private closing=false;
  private pending=new Map<number,{method:string;resolve:(value:any)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
  private exited:Promise<void>;
  constructor(executable:string,args:string[],cwd:string,env:NodeJS.ProcessEnv){
    this.child=spawn(executable,args,{cwd,env,shell:false,windowsHide:true,stdio:'pipe'});
    const parser=new JsonRpcLines();
    this.child.stdout.on('data',(chunk:Buffer)=>{try{for(const message of parser.push(chunk)){
      if(message.method){this.onMessage(message);continue;}
      const waiting=typeof message.id==='number'?this.pending.get(message.id):undefined;
      if(waiting){clearTimeout(waiting.timer);this.pending.delete(message.id as number);message.error?waiting.reject(new RpcRejected(waiting.method,message.error)):waiting.resolve(message.result);}
    }}catch(error){this.fail(error instanceof Error?error:new Error('INVALID_JSON_RPC'));}});
    // Drain stderr independently; it can contain tokens or private tool output, so never relay it raw.
    this.child.stderr.on('data',()=>{});
    this.child.stdin.on('error',()=>this.fail(new Error('CODEX_PROCESS_FAILED')));
    this.child.on('error',()=>this.fail(new Error('CODEX_PROCESS_FAILED')));
    this.exited=new Promise(resolve=>this.child.once('close',()=>{
      try{parser.finish();}catch(error){this.fail(error as Error);}
      if(!this.closing)this.fail(new Error('CODEX_PROCESS_CLOSED'));resolve();
    }));
  }
  private fail(error:Error){if(this.failure)return;this.failure=error;for(const wait of this.pending.values()){clearTimeout(wait.timer);wait.reject(error);}this.pending.clear();if(!this.closing)this.onFailure(error);this.child.kill();}
  private write(value:unknown){if(this.failure)throw this.failure;if(this.closing)throw new Error('CODEX_PROCESS_CLOSED');this.child.stdin.write(JSON.stringify(value)+'\n');}
  request(method:string,params:unknown,timeoutMs=20000):Promise<any>{
    if(this.failure)return Promise.reject(this.failure);
    const id=++this.nextId;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('CODEX_RPC_TIMEOUT'));},timeoutMs);
      this.pending.set(id,{method,resolve,reject,timer});
      try{this.write({id,method,params});}catch(error){clearTimeout(timer);this.pending.delete(id);reject(error);}
    });
  }
  notify(method:string,params:unknown={}){this.write({method,params});}
  respond(id:string|number|undefined,result:unknown){if(id!==undefined)this.write({id,result});}
  reject(id:string|number|undefined){if(id!==undefined)this.write({id,error:{code:-32601,message:'Request not supported by this client'}});}
  async close(){
    if(this.closing)return this.exited;this.closing=true;
    for(const wait of this.pending.values()){clearTimeout(wait.timer);wait.reject(new Error('CODEX_PROCESS_CLOSED'));}this.pending.clear();
    this.child.stdin.end();
    const timer=setTimeout(()=>this.child.kill(),1500);
    try{await this.exited;}finally{clearTimeout(timer);}
  }
}
