import { readFile, mkdir, writeFile, rename, stat } from 'node:fs/promises';
import { dirname, isAbsolute, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { EngineConfiguration } from '../../shared/contracts';
export class EngineSettings {
  private data:EngineConfiguration={};
  private pending=Promise.resolve();
  constructor(private file:string){}
  async load(){try{const data=JSON.parse(await readFile(this.file,'utf8'));if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(key=>key!=='codexExecutable')||(data.codexExecutable!==undefined&&typeof data.codexExecutable!=='string'))throw new Error('ENGINE_SETTINGS_CORRUPT');this.data=data;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
  snapshot(){return {...this.data};}
  async save(data:EngineConfiguration){
    if(data.codexExecutable&&(!isAbsolute(data.codexExecutable)||extname(data.codexExecutable).toLowerCase()!=='.exe'||!await stat(data.codexExecutable).then(s=>s.isFile(),()=>false)))throw new Error('INVALID_EXECUTABLE');
    const next={...data};const operation=this.pending.catch(()=>{}).then(async()=>{
      await mkdir(dirname(this.file),{recursive:true});const temp=`${this.file}.${randomUUID()}.tmp`;
      await writeFile(temp,JSON.stringify(next),'utf8');await rename(temp,this.file);this.data=next;
    });this.pending=operation;await operation;
  }
}
