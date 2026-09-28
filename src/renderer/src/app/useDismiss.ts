import { useEffect, type RefObject } from 'react';
// Closes a menu or panel on a pointer press outside `inside` or on Escape.
// `inside` lists every element that belongs to it, including its trigger button,
// so the trigger keeps its own toggle behaviour.
export function useDismiss(open:boolean,close:()=>void,inside:RefObject<HTMLElement|null>[],focusOnEscape?:RefObject<HTMLElement|null>){
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!inside.some(ref=>ref.current?.contains(event.target as Node)))close();};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){close();focusOnEscape?.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
}
