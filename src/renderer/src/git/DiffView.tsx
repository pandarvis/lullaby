import type { GitDiff } from '../../../shared/git';
import { highlight, languageForPath } from '../chat/highlight';
const escape=(text:string)=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// Line by line: a token spanning several lines (block comment, template) may lose its colour.
export function DiffView({diff,path}:{diff:GitDiff;path?:string}) {
  const language=path?languageForPath(path):undefined;
  let oldLine:number|undefined,newLine:number|undefined=diff.format==='file'?1:undefined;
  const lines=diff.text.split('\n',5001),limited=lines.length>5000;
  return <div className="git-diff-view">
    <div className="git-diff-info"><span>{diff.kind==='binary'?'Binaire':diff.kind==='symlink'?'Lien symbolique · cible non suivie':diff.kind==='submodule'?'Sous-module':diff.format==='file'?'Contenu non suivi':'Différence unifiée'}</span>{diff.capturedAt&&<time>Lu à {new Date(diff.capturedAt).toLocaleTimeString('fr-FR')}</time>}</div>
    {diff.changedDuringRead&&<p className="git-warning">Le dépôt a changé depuis le relevé. Actualisez pour retrouver son état courant.</p>}
    {(diff.truncated||limited)&&<p className="git-warning">Différence tronquée : {diff.truncated?'limite de 1 Mio atteinte':'affichage limité à 5 000 lignes'}.</p>}
    {!diff.text?<div className="git-empty">Aucune différence textuelle à cette lecture.</div>:<div className="git-diff-scroll" tabIndex={0} aria-label="Contenu de la différence"><table className="git-diff"><tbody>{lines.slice(0,5000).map((line,index)=>{
      const display=line.endsWith('\r')?line.slice(0,-1):line;const hunk=diff.format!=='file'?/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(display):null;
      let oldNumber:number|undefined,newNumber:number|undefined;let kind='meta';
      if(hunk){oldLine=Number(hunk[1]);newLine=Number(hunk[2]);kind='hunk';}
      else if(diff.format==='file'){newNumber=newLine!++;kind='context';}
      else if(oldLine!==undefined&&newLine!==undefined){if(display.startsWith('+')){newNumber=newLine++;kind='added';}else if(display.startsWith('-')){oldNumber=oldLine++;kind='removed';}else if(display.startsWith(' ')){oldNumber=oldLine++;newNumber=newLine++;kind='context';}}
      const prefix=diff.format==='file'?'':display.slice(0,1);const markup=language&&kind!=='hunk'&&kind!=='meta'?highlight(display.slice(prefix.length),language):undefined;
      return <tr key={index} className={`git-diff-${kind}`}><td className="git-line-number">{oldNumber}</td><td className="git-line-number">{newNumber}</td><td className="git-line">{markup===undefined?<code>{display||' '}</code>:<code className="hljs" dangerouslySetInnerHTML={{__html:escape(prefix)+markup||' '}}/>}</td></tr>;
    })}</tbody></table></div>}
  </div>;
}
