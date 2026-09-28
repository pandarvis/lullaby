import { createHash } from 'node:crypto';
import { lstat,realpath,open,mkdtemp,writeFile,unlink,rmdir } from 'node:fs/promises';
import { isAbsolute,join,relative,resolve } from 'node:path';
import { tmpdir } from 'node:os';
import type { ReviewFile,TurnReview } from '../../shared/contracts';
import { runGit } from '../git/runner';

export type ReviewCapture={finish:(runId:string)=>Promise<TurnReview>};
export type ReviewSource={begin:(cwd:string)=>Promise<ReviewCapture>};
type Entry={signature:string;data?:Buffer;reason?:string};
type Capture={files:Map<string,Entry>;partial:boolean;available:boolean};
const MAX_FILE=1024*1024,MAX_TOTAL=32*1024*1024,MAX_FILES=10000,MAX_DIFF=128*1024,MAX_REVIEW=1024*1024;
const unavailable='Relevé initial indisponible : Git absent, dossier sans dépôt ou lecture impossible. Le récapitulatif nécessite un dépôt accessible dès le début.';

export class TurnReviewSource implements ReviewSource {
  async begin(cwd:string):Promise<ReviewCapture>{
    const before=await this.capture(cwd);
    return {finish:async runId=>{
      const review:TurnReview={runId,capturedAt:new Date().toISOString(),files:[],partial:before.partial};
      if(!before.available)return {...review,partial:true,notice:unavailable};
      const after=await this.capture(cwd,[...before.files.keys()]);
      if(!after.available)return {...review,partial:true,notice:'Le relevé final a échoué. Les modifications ne peuvent pas être comparées.'};
      review.partial ||= after.partial;
      const paths=[...new Set([...before.files.keys(),...after.files.keys()])].sort();
      let bytes=0;let temp:string|undefined;const deadline=Date.now()+10000;
      try{
        for(const path of paths){
          const old=before.files.get(path),current=after.files.get(path);
          if(old?.signature===current?.signature)continue;
          if(review.files.length>=100){review.partial=true;break;}
          const file:ReviewFile={path,change:!old?'added':!current?'deleted':'modified',diff:{kind:'text',text:'',truncated:false}};
          if(old?.reason||current?.reason){review.partial=true;file.diff.text=old?.reason??current!.reason!;}
          else if((old?.data&&binary(old.data))||(current?.data&&binary(current.data))){file.diff={kind:'binary',text:'Fichier binaire modifié ; comparaison textuelle indisponible.',truncated:false};}
          else if(bytes>=MAX_REVIEW||Date.now()>deadline){review.partial=true;file.diff.text='Détail non conservé : limite du récapitulatif atteinte.';}
          else{
            temp??=await mkdtemp(join(tmpdir(),'lullaby-review-'));
            await writeFile(join(temp,'before'),old?.data??Buffer.alloc(0));
            await writeFile(join(temp,'after'),current?.data??Buffer.alloc(0));
            try{
              const raw=await runGit(temp,['diff','--no-index','--no-ext-diff','--no-textconv','--no-color','--no-renames','--unified=3','--','before','after'],{acceptedExitCodes:[1],limit:MAX_DIFF,timeoutMs:3000});
              const text=raw.toString('utf8');const start=text.indexOf('@@ ');
              const body=start<0?'':text.slice(start);
              // Keep only hunks. Temporary paths and repository metadata are not part of the review.
              file.diff.text=body;file.additions=0;file.deletions=0;
              for(const line of body.split('\n')){if(line.startsWith('+'))file.additions++;else if(line.startsWith('-'))file.deletions++;}
              bytes+=raw.length;
            }catch{review.partial=true;file.diff.text='Différence trop volumineuse ou indisponible ; compteurs non calculés.';}
          }
          review.files.push(file);
        }
      }finally{
        if(temp){await unlink(join(temp,'before')).catch(()=>{});await unlink(join(temp,'after')).catch(()=>{});await rmdir(temp).catch(()=>{});}
        before.files.clear();after.files.clear();
      }
      if(review.partial)review.notice='Relevé partiel : certains fichiers sont exclus, illisibles ou dépassent les limites. Les compteurs portent uniquement sur les différences calculées.';
      return review;
    }};
  }
  private async capture(cwd:string,previous:string[]=[]):Promise<Capture>{
    const result:Capture={files:new Map(),partial:false,available:false};
    try{
      // Git selects project files without traversing ignored dependency/build directories.
      // Existing baseline paths remain checked even if a later commit removes them from the index.
      const listed=await runGit(cwd,['ls-files','-z','--cached','--others','--exclude-standard','--','.'],{limit:2*1024*1024,timeoutMs:3000});
      const paths=[...new Set([...previous,...listed.toString('utf8').split('\0').filter(Boolean)])];
      const root=await realpath(cwd);let bytes=0;const deadline=Date.now()+5000;
      for(const [index,path] of paths.entries()){
        if(index>=MAX_FILES||Date.now()>deadline){result.partial=true;result.files.set(path,{signature:'omitted',reason:'Fichier non comparé : limite du relevé atteinte.'});continue;}
        if(isAbsolute(path)||path.split(/[\\/]/).some(part=>part==='..'||part.toLowerCase()==='.git')){result.partial=true;continue;}
        const full=resolve(root,path);
        try{
          const info=await lstat(full);
          if(!info.isFile()){
            result.partial=true;result.files.set(path,{signature:`special:${info.size}:${info.mtimeMs}`,reason:'Lien ou sous-module : contenu non suivi par le récapitulatif.'});continue;
          }
          const actual=await realpath(full),inside=relative(root,actual);
          if(isAbsolute(inside)||inside==='..'||inside.startsWith(`..\\`)||inside.startsWith('../')){result.partial=true;result.files.set(path,{signature:'outside',reason:'Chemin extérieur au projet : contenu non lu.'});continue;}
          if(info.size>MAX_FILE||bytes+info.size>MAX_TOTAL){result.partial=true;result.files.set(path,{signature:`limit:${info.size}:${info.mtimeMs}`,reason:'Fichier non comparé : limite de lecture atteinte.'});continue;}
          const handle=await open(full,'r');let data:Buffer;let stable=false;
          try{
            const buffer=Buffer.alloc(Math.min(info.size+1,MAX_FILE+1));let offset=0;
            while(offset<buffer.length){const read=await handle.read(buffer,offset,buffer.length-offset,offset);if(!read.bytesRead)break;offset+=read.bytesRead;}
            data=buffer.subarray(0,offset);const end=await handle.stat();stable=end.size===info.size&&end.mtimeMs===info.mtimeMs&&data.length===info.size;
          }finally{await handle.close();}
          if(!stable){result.partial=true;result.files.set(path,{signature:`moving:${info.size}:${info.mtimeMs}`,reason:'Fichier modifié pendant sa lecture ; comparaison indisponible.'});continue;}
          bytes+=data.length;result.files.set(path,{signature:createHash('sha256').update(data).digest('hex'),data});
        }catch(error){
          if((error as NodeJS.ErrnoException).code!=='ENOENT'){result.partial=true;result.files.set(path,{signature:'unreadable',reason:'Fichier inaccessible pendant le relevé.'});}
        }
      }
      if(paths.length>MAX_FILES)result.partial=true;
      result.available=true;
    }catch{result.partial=true;}
    return result;
  }
}
function binary(data:Buffer){return data.includes(0)||!Buffer.from(data.toString('utf8'),'utf8').equals(data);}
