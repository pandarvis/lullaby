// @vitest-environment jsdom
import { afterEach,expect,test } from 'vitest';
import { act,cleanup,render } from '@testing-library/react';
import { useRef } from 'react';
import { useKeepBottomOnShrink } from '../src/renderer/src/chat/useKeepBottomOnShrink';
afterEach(cleanup);
// jsdom has no layout: a controllable ResizeObserver and element height stand in for it.
let notify:()=>void=()=>{};
globalThis.ResizeObserver=class{constructor(callback:()=>void){notify=callback;}observe(){}unobserve(){}disconnect(){}} as any;
function View(){const ref=useRef<HTMLDivElement>(null);useKeepBottomOnShrink(ref);return <div ref={ref} data-testid="viewport"/>;}
test('when the chat area shrinks, what was at its bottom stays visible',()=>{
  const view=render(<View/>);const viewport=view.getByTestId('viewport');
  let height=600;Object.defineProperty(viewport,'clientHeight',{configurable:true,get:()=>height});
  viewport.scrollTop=1000;act(()=>notify());
  height=420;act(()=>notify());expect(viewport.scrollTop).toBe(1180);
  height=600;act(()=>notify());expect(viewport.scrollTop).toBe(1180);
});
