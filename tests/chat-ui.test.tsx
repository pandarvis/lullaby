// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionChat } from '../src/renderer/src/chat/SessionChat';
import { SnapshotContext } from '../src/renderer/src/chat/sessionStore';
import { ApprovalPanel } from '../src/renderer/src/chat/ApprovalPanel';
import type { Snapshot, SessionEvent } from '../src/shared/contracts';
afterEach(cleanup);
globalThis.ResizeObserver=class {observe(){}unobserve(){}disconnect(){}};
Element.prototype.scrollTo=()=>{};
const snapshot:Snapshot={revision:1,projects:[],sessions:['a','b'].map(id=>({id,projectId:'p',provider:'claude',title:id,phase:'idle',draft:'',choices:{}})),messages:{a:[],b:[]},pending:[]};
test('keeps draft A when switching through B while messages arrive for A',async()=>{
  window.lullaby={saveDraft:vi.fn().mockResolvedValue({ok:true}),send:vi.fn(),interrupt:vi.fn()} as any;
  const view=(id:string,state=snapshot)=><SnapshotContext.Provider value={state}><SessionChat key={id} sessionId={id}/></SnapshotContext.Provider>;
  const rendered=render(view('a'));fireEvent.change(screen.getByRole('textbox',{name:'Votre message'}),{target:{value:'brouillon A'}});
  rendered.rerender(view('b'));expect((screen.getByRole('textbox',{name:'Votre message'}) as HTMLTextAreaElement).value).toBe('');
  const next={...snapshot,revision:2,messages:{...snapshot.messages,a:[{id:'m',role:'assistant' as const,text:'Réponse pour A',actions:[]}]}};
  rendered.rerender(view('b',next));expect(screen.queryByText('Réponse pour A')).toBeNull();
  rendered.rerender(view('a',next));expect((screen.getByRole('textbox',{name:'Votre message'}) as HTMLTextAreaElement).value).toBe('brouillon A');
  expect(screen.getByText('Réponse pour A')).toBeTruthy();
});
test('approval replies retain routing and stay visible until acknowledged',async()=>{
  let resolve!:(value:any)=>void;const reply=vi.fn(()=>new Promise<any>(done=>{resolve=done;}));window.lullaby={reply} as any;
  const event:SessionEvent={sessionId:'other-session',runId:'run',eventId:'event',body:{kind:'request',requestId:'request',requestKind:'approval',text:'Autoriser ?'}};
  render(<ApprovalPanel event={event}/>);fireEvent.click(screen.getByRole('button',{name:'Refuser'}));
  expect(reply).toHaveBeenCalledWith({sessionId:'other-session',runId:'run',requestId:'request',answer:{kind:'deny'}});
  expect(screen.getByText('Autoriser ?')).toBeTruthy();resolve({ok:false,code:'STALE_REQUEST',message:'Cette demande est périmée.'});
  await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('périmée'));
});
