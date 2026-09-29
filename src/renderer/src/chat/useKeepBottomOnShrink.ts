import { useEffect, type RefObject } from 'react';
// The prompt is anchored at the top (turnAnchor="top"), so the viewport does not follow
// the bottom. When the composer area grows (approval, question, notice) the viewport
// shrinks: scroll by the same amount so what was visible at its bottom stays visible.
export function useKeepBottomOnShrink(ref:RefObject<HTMLElement|null>){
  useEffect(()=>{
    const element=ref.current;if(!element)return;
    let height=element.clientHeight;
    const observer=new ResizeObserver(()=>{
      const next=element.clientHeight;
      if(next<height)element.scrollTop+=height-next;
      height=next;
    });
    observer.observe(element);return()=>observer.disconnect();
  },[ref]);
}
