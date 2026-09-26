import type { PreviewDocument } from '../../../shared/contracts';
import { UiIcon } from '../app/UiIcon';
export function PreviewPane({document,onClose,onError}:{document:PreviewDocument;onClose:()=>void;onError:(message:string)=>void}){
  return <aside className="preview-pane" aria-label="Aperçu HTML"><header><UiIcon name="preview"/><strong title={document.title}>{document.title}</strong><button className="icon-button" title="Ouvrir une copie statique dans le navigateur" aria-label="Ouvrir dans le navigateur" onClick={()=>void window.lullaby.openPreview(document.id).then(result=>{if(!result.ok)onError(result.message);})}><UiIcon name="external"/></button><button className="icon-button" title="Fermer l’aperçu" aria-label="Fermer l’aperçu" onClick={onClose}><UiIcon name="close"/></button></header><iframe title={document.title} src={document.url} sandbox="allow-scripts" referrerPolicy="no-referrer"/><footer>HTML autonome · hors réseau · copie externe sans scripts</footer></aside>;
}
