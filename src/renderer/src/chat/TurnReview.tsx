import { useState } from 'react';
import type { ReviewFile,TurnReview } from '../../../shared/contracts';
import { UiIcon } from '../app/UiIcon';
import { DiffView } from '../git/DiffView';
import '../git/git.css';
export type ReviewSelection={review:TurnReview;path?:string};
function Counts({file}:{file:ReviewFile}){return file.additions!==undefined?<span className="review-counts"><span>+{file.additions}</span><span>−{file.deletions}</span></span>:<small>{file.diff.kind==='binary'?'Binaire':'Non comparé'}</small>;}
export function TurnReviewCard({review,onExamine}:{review:TurnReview;onExamine:(selection:ReviewSelection)=>void}){
  const [expanded,setExpanded]=useState(false);
  if(!review.files.length)return <p className="turn-review-notice">{review.notice}</p>;
  const additions=review.files.reduce((sum,file)=>sum+(file.additions??0),0),deletions=review.files.reduce((sum,file)=>sum+(file.deletions??0),0);
  return <section className="turn-review-card" aria-label="Récapitulatif des modifications">
    <header><span className="review-emblem"><UiIcon name="file"/></span><div><strong>{review.files.length} fichier{review.files.length>1?'s':''} {review.partial?'concerné':'modifié'}{review.files.length>1?'s':''}</strong><span className="review-total">{review.files.some(file=>file.additions!==undefined)&&<span className="review-counts" title="Lignes ajoutées et supprimées dans les différences textuelles calculées"><span>+{additions}</span><span>−{deletions}</span></span>}{review.partial&&<small>Relevé partiel</small>}</span></div><button className="secondary" onClick={()=>onExamine({review})}>Examiner</button></header>
    <ul>{(expanded?review.files:review.files.slice(0,4)).map(file=><li key={file.path}><button onClick={()=>onExamine({review,path:file.path})}><span className={`review-change ${file.change}`} title={file.change==='added'?'Ajouté':file.change==='deleted'?'Supprimé':'Modifié'}>{file.change==='added'?'+':file.change==='deleted'?'−':'~'}</span><span className="review-path" title={file.path}>{file.path}</span><Counts file={file}/></button></li>)}</ul>
    {review.files.length>4&&<button className="review-expand" onClick={()=>setExpanded(!expanded)}>{expanded?'Réduire':`Afficher ${review.files.length-4} autre${review.files.length-4>1?'s':''} fichier${review.files.length-4>1?'s':''}`}<UiIcon name="chevron"/></button>}
    <footer>Changements observés pendant cette intervention.{review.notice&&<p>{review.notice}</p>}</footer>
  </section>;
}
export function TurnReviewPane({selection,onClose}:{selection:ReviewSelection;onClose:()=>void}){
  const {review}=selection;const [path,setPath]=useState(selection.path??review.files[0]?.path);
  const file=review.files.find(file=>file.path===path)??review.files[0];
  return <aside className="turn-review-pane" aria-label="Examiner les modifications"><header><UiIcon name="file"/><strong>Modifications de l’intervention</strong><button className="icon-button" aria-label="Fermer les modifications" onClick={onClose}><UiIcon name="close"/></button></header>
    <p className="review-scope">Avant / après cette intervention · relevé conservé au {new Date(review.capturedAt).toLocaleString('fr-FR')}. Les éditions faites ensuite n’y figurent pas.</p>
    {review.notice&&<p className="review-scope review-warning">{review.notice}</p>}
    <nav aria-label="Fichiers de l’intervention">{review.files.map(item=><button key={item.path} aria-current={file?.path===item.path?'true':undefined} onClick={()=>setPath(item.path)}><span className="review-path">{item.path}</span><Counts file={item}/></button>)}</nav>
    {file&&<div className="review-file-diff"><div className="git-diff-path">{file.path}</div><DiffView diff={file.diff}/></div>}
  </aside>;
}
