import claude from '../assets/claude.svg';
import openai from '../assets/openai.svg';
export function ProviderLogo({provider}:{provider:'claude'|'codex'}){return <img className="provider-logo" src={provider==='claude'?claude:openai} alt=""/>;}
export function UiIcon({name}:{name:string}){
  const paths:Record<string,string>={settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',network:'M9 3h6v5H9z M2 16h6v5H2z M16 16h6v5h-6z M12 8v4 M5 16v-4h14v4',plus:'M12 5v14 M5 12h14',arrow:'m5 10 7-7 7 7 M12 3v18',stop:'M6 6h12v12H6z',shield:'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z M8 12l3 3 5-6',close:'m6 6 12 12 M18 6 6 18',more:'M5 12h.01 M12 12h.01 M19 12h.01',external:'M14 3h7v7 M21 3l-11 11 M10 3H3v18h18v-7',file:'M5 2h9l5 5v15H5z M14 2v6h5',folder:'M3 6h7l2 3h9v11H3z',preview:'M2 4h20v16H2z M11 4v16',check:'m4 12 5 5L20 6'};
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]??paths.more}/></svg>;
}
export function AtelierIcon(){return <svg className="atelier-icon" viewBox="0 0 40 44" aria-hidden="true"><path fill="#a48aca" d="m20 2 17 10v20L20 42 3 32V12z"/><path fill="#756397" d="M20 22 3 12v20l17 10z"/><path fill="#c8b5e7" d="m20 2 17 10-17 10L3 12z"/><path fill="#ece3fa" d="m20 11 10 6-10 6-10-6z M10 22l8 5v10l-8-5z M22 27l8-5v10l-8 5z"/></svg>;}
