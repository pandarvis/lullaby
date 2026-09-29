import { createServer, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { realpath, open } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname, basename } from 'node:path';
import type { PreviewDocument, PreviewInput } from '../../shared/contracts';

const MAX_BYTES=2*1024*1024;
// Applied as an HTTP header, so generated markup cannot relax this policy.
const POLICY="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts";
export class PreviewService {
  private server?:Server;
  private starting?:Promise<number>;
  private port?:number;
  private documents=new Map<string,{html:string;title:string}>();
  constructor(private projectFolder:(id:string)=>string|undefined){}
  private start():Promise<number>{
    if(this.starting)return this.starting;
    this.starting=new Promise<number>((done,fail)=>{
      this.server=createServer((req,res)=>{
        const match=/^\/([a-f0-9-]+)(\/static)?$/.exec(req.url??'');const doc=match?this.documents.get(match[1]):undefined;
        const policy=match?.[2]?POLICY.replace("script-src 'unsafe-inline'","script-src 'none'").replace('sandbox allow-scripts','sandbox'):POLICY;
        res.setHeader('Content-Security-Policy',policy);res.setHeader('X-Content-Type-Options','nosniff');
        res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
        if(req.method!=='GET'||!doc){res.writeHead(404);res.end('Aperçu indisponible');return;}
        res.setHeader('Content-Type','text/html; charset=utf-8');res.end(doc.html);
      });
      this.server.once('error',fail);this.server.listen(0,'127.0.0.1',()=>{
        const address=this.server!.address();if(address&&typeof address!=='string'){this.port=address.port;done(address.port);}else fail(new Error('PREVIEW_UNAVAILABLE'));
      });
    }).catch(error=>{this.starting=undefined;throw error;});
    return this.starting;
  }
  async create(projectId:string,input:PreviewInput):Promise<PreviewDocument>{
    const folder=this.projectFolder(projectId);if(!folder)throw new Error('PROJECT_NOT_FOUND');
    let html=input.html??'',title='Aperçu HTML';
    if(input.path){
      const root=await realpath(folder);const file=await realpath(resolve(root,input.path));
      const inside=relative(root,file);
      if(inside==='..'||inside.startsWith('..\\')||inside.startsWith('../')||isAbsolute(inside))throw new Error('PREVIEW_OUTSIDE_PROJECT');
      if(!['.html','.htm'].includes(extname(file).toLowerCase()))throw new Error('PREVIEW_HTML_ONLY');
      const handle=await open(file,'r');
      try{const stat=await handle.stat();if(!stat.isFile())throw new Error('PREVIEW_HTML_ONLY');if(stat.size>MAX_BYTES)throw new Error('PREVIEW_TOO_LARGE');
        const buffer=Buffer.alloc(MAX_BYTES+1);const {bytesRead}=await handle.read(buffer,0,buffer.length,0);
        if(bytesRead>MAX_BYTES)throw new Error('PREVIEW_TOO_LARGE');html=buffer.subarray(0,bytesRead).toString('utf8');
      }finally{await handle.close();}title=basename(file);
    }
    if(Buffer.byteLength(html)>MAX_BYTES)throw new Error('PREVIEW_TOO_LARGE');
    if(!html.trim())throw new Error('PREVIEW_EMPTY');
    const port=await this.start();const id=randomUUID();this.documents.set(id,{html,title});
    // Keep memory bounded when several sessions create previews.
    while(this.documents.size>30)this.documents.delete(this.documents.keys().next().value!);
    return {id,title,url:`http://127.0.0.1:${port}/${id}`};
  }
  allowsNavigation(url:string){try{const parsed=new URL(url);return parsed.origin===`http://127.0.0.1:${this.port}`&&!parsed.search&&!parsed.username&&!parsed.password&&this.documents.has(parsed.pathname.slice(1));}catch{return false;}}
  async url(id:string){if(!this.documents.has(id))throw new Error('PREVIEW_EXPIRED');return `http://127.0.0.1:${await this.start()}/${id}/static`;}
  release(id:string){this.documents.delete(id);}
  async close(){this.documents.clear();const server=this.server;this.server=undefined;this.starting=undefined;if(server){server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}}
}
