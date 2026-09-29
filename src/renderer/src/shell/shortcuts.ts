import { useEffect, useRef } from 'react';
export type ShortcutHandlers={toggleSidebar:()=>void;togglePanel:()=>void;search:()=>void;newSession:()=>void;back:()=>void;forward:()=>void};
type Keys={key:string;ctrlKey:boolean;altKey:boolean;shiftKey:boolean;metaKey:boolean};
export function shortcutFor(event:Keys):keyof ShortcutHandlers|undefined{
  if(event.metaKey||event.shiftKey)return undefined;
  if(event.ctrlKey&&!event.altKey){
    const byKey:Record<string,keyof ShortcutHandlers>={b:'toggleSidebar',j:'togglePanel',k:'search',n:'newSession'};
    return byKey[event.key.toLowerCase()];
  }
  if(event.altKey&&!event.ctrlKey){if(event.key==='ArrowLeft')return 'back';if(event.key==='ArrowRight')return 'forward';}
  return undefined;
}
export function useShortcuts(handlers:ShortcutHandlers){
  const latest=useRef(handlers);latest.current=handlers;
  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{if(event.defaultPrevented||event.repeat||document.querySelector('[aria-modal="true"],dialog[open]'))return;const name=shortcutFor(event);if(!name)return;event.preventDefault();latest.current[name]();};
    window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);
  },[]);
}
