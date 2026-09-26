// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { SessionChat } from '../src/renderer/src/chat/SessionChat';
import { SnapshotContext } from '../src/renderer/src/chat/sessionStore';
import type { Snapshot } from '../src/shared/contracts';
afterEach(cleanup);
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
Element.prototype.scrollTo=()=>{};
const state:Snapshot={revision:1,projects:[],sessions:[{id:'studio',projectId:'p',provider:'codex',title:'Test',phase:'idle',draft:'',choices:{model:'one',effort:'high'}}],messages:{studio:[]},pending:[]};
function view(snapshot=state){return <SnapshotContext.Provider value={snapshot}><SessionChat sessionId="studio" diagnostic={{provider:'codex',available:true,auth:'subscription',skills:[],issues:[],models:[{id:'one',name:'Un',efforts:['high'],default:true},{id:'two',name:'Deux',efforts:['low'],default:false}]}}/></SnapshotContext.Provider>;}
function api(extra:Record<string,unknown>={}){window.lullaby={saveDraft:vi.fn().mockResolvedValue({ok:true}),configureSession:vi.fn().mockResolvedValue({ok:true}),releasePreview:vi.fn().mockResolvedValue({ok:true}),...extra}as any;}
test('model change clears incompatible effort and composer can request bounded auto permissions',async()=>{
  api();render(view());fireEvent.change(screen.getByRole('combobox',{name:'Modèle'}),{target:{value:'two'}});
  await waitFor(()=>expect(window.lullaby.configureSession).toHaveBeenCalledWith('studio',{model:'two'}));
  await waitFor(()=>expect((screen.getByRole('combobox',{name:'Autorisations'})as HTMLSelectElement).disabled).toBe(false));
  fireEvent.change(screen.getByRole('combobox',{name:'Autorisations'}),{target:{value:'auto'}});
  await waitFor(()=>expect(window.lullaby.configureSession).toHaveBeenLastCalledWith('studio',{model:'one',effort:'high',permissionProfile:'auto'}));
});
test('HTML code opens an isolated side preview and releases it on close',async()=>{
  api({previewHtml:vi.fn().mockResolvedValue({ok:true,value:{id:'preview',title:'HTML',url:'http://127.0.0.1:1234/token'}})});
  render(view({...state,messages:{studio:[{id:'html',role:'assistant',text:'```html\n<h1>Bonjour</h1>\n```',actions:[]}]}}));
  fireEvent.click(await screen.findByRole('button',{name:'Aperçu'}));
  await waitFor(()=>expect(window.lullaby.previewHtml).toHaveBeenCalledWith('p',{html:expect.stringContaining('<h1>Bonjour</h1>')}));
  const frame=(await screen.findAllByTitle('HTML')).find(element=>element.tagName==='IFRAME')!;expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  fireEvent.click(screen.getByRole('button',{name:'Fermer l’aperçu'}));expect(window.lullaby.releasePreview).toHaveBeenCalledWith('preview');expect(screen.queryByTitle('HTML')).toBeNull();
});
test('attachment selection preserves draft and is ignored after leaving the conversation',async()=>{
  let resolve!:(value:any)=>void;api({pickAttachments:vi.fn(()=>new Promise(done=>{resolve=done;}))});
  const rendered=render(view());fireEvent.change(screen.getByRole('textbox',{name:'Votre message'}),{target:{value:'Analyse ceci'}});
  fireEvent.click(screen.getByRole('button',{name:'Ajouter au message'}));fireEvent.click(screen.getByRole('button',{name:'Fichiers'}));
  resolve({ok:true,value:['C:\\projet\\été.txt']});await waitFor(()=>expect((screen.getByRole('textbox',{name:'Votre message'})as HTMLTextAreaElement).value).toContain('été.txt'));
  expect((screen.getByRole('textbox',{name:'Votre message'})as HTMLTextAreaElement).value).toContain('Analyse ceci');
  fireEvent.click(screen.getByRole('button',{name:'Ajouter au message'}));fireEvent.click(screen.getByRole('button',{name:'Fichiers'}));rendered.unmount();resolve({ok:true,value:['other.txt']});
  render(view());expect((screen.getByRole('textbox',{name:'Votre message'})as HTMLTextAreaElement).value).not.toContain('other.txt');
});
test('Windows HTML links open previews while script links remain inert',async()=>{
  api({previewHtml:vi.fn().mockResolvedValue({ok:true,value:{id:'preview',title:'Document',url:'http://127.0.0.1:1234/token'}})});
  render(view({...state,messages:{studio:[{id:'links',role:'assistant',text:'[Maquette](C:/projet/index.html) et [script](javascript:alert%281%29)',actions:[]}]}}));
  fireEvent.click(await screen.findByRole('button',{name:'Maquette'}));
  await waitFor(()=>expect(window.lullaby.previewHtml).toHaveBeenCalledWith('p',{path:'C:/projet/index.html'}));
  expect(screen.getByText('script').getAttribute('href')??'').not.toMatch(/^javascript:/);
});
