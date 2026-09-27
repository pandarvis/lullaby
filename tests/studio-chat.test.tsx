// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { SessionChat } from '../src/renderer/src/chat/SessionChat';
import { SnapshotContext } from '../src/renderer/src/chat/sessionStore';
import type { Snapshot } from '../src/shared/contracts';
afterEach(cleanup);
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
Element.prototype.scrollTo=()=>{};
Element.prototype.scrollIntoView=()=>{};
const state:Snapshot={revision:1,projects:[],sessions:[{id:'studio',projectId:'p',provider:'codex',title:'Test',phase:'idle',draft:'',choices:{model:'one',effort:'high'}}],messages:{studio:[]},pending:[]};
function view(snapshot=state){return <SnapshotContext.Provider value={snapshot}><SessionChat sessionId="studio" diagnostic={{provider:'codex',available:true,auth:'subscription',skills:[],issues:[],models:[{id:'one',name:'Un',efforts:['high'],default:true},{id:'two',name:'Deux',efforts:['low'],default:false}]}}/></SnapshotContext.Provider>;}
function api(extra:Record<string,unknown>={}){window.lullaby={saveDraft:vi.fn().mockResolvedValue({ok:true}),configureSession:vi.fn().mockResolvedValue({ok:true}),releasePreview:vi.fn().mockResolvedValue({ok:true}),...extra}as any;}
test('model change clears incompatible effort and composer can request bounded auto permissions',async()=>{
  api();render(view());fireEvent.keyDown(screen.getByRole('combobox',{name:'Modèle'}),{key:'ArrowDown'}); fireEvent.click(await screen.findByRole('option',{name:'Deux'}));
  await waitFor(()=>expect(window.lullaby.configureSession).toHaveBeenCalledWith('studio',{model:'two'}));
  await waitFor(()=>expect((screen.getByRole('combobox',{name:'Autorisations'})as HTMLSelectElement).disabled).toBe(false));
  fireEvent.keyDown(screen.getByRole('combobox',{name:'Autorisations'}),{key:'ArrowDown'}); fireEvent.click(await screen.findByRole('option',{name:/Auto · projet/}));
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

test('shows activity from send until completion, with tools and approval feedback',async()=>{
  let finish!:(value:any)=>void;api({send:vi.fn(()=>new Promise(done=>{finish=done;}))});
  const rendered=render(view());fireEvent.change(screen.getByRole('textbox',{name:'Votre message'}),{target:{value:'Analyse le projet'}});
  fireEvent.click(screen.getByRole('button',{name:'Envoyer'}));
  expect((await screen.findByRole('status',{name:'Activité de l’agent'})).textContent).toContain('Envoi');
  const running:Snapshot={...state,sessions:[{...state.sessions[0],phase:'running'}],messages:{studio:[{id:'u',role:'user',text:'Analyse le projet',actions:[]},{id:'a',role:'assistant',text:'',actions:[{id:'cmd',label:'commandExecution',detail:'{"command":"dotnet test"}',state:'running'}]}]}};
  rendered.rerender(view(running));expect(screen.getByRole('status',{name:'Activité de l’agent'}).textContent).toContain('Commande');
  expect(screen.getAllByText('dotnet test').length).toBeGreaterThan(0);
  rendered.rerender(view({...running,sessions:[{...running.sessions[0],phase:'waiting'}]}));
  expect(screen.getByRole('status',{name:'Activité de l’agent'}).textContent).toContain('réponse');
  finish({ok:true,value:{runId:'r'}});
  rendered.rerender(view({...running,sessions:[{...running.sessions[0],phase:'done'}]}));
  await waitFor(()=>expect(screen.queryByRole('status',{name:'Activité de l’agent'})).toBeNull());
});

test('highlights C sharp without interpreting HTML and preserves code text',async()=>{
  api();const code='public class Iris { string value = "<script>alert(1)</script>"; }';
  const rendered=render(view({...state,messages:{studio:[{id:'code',role:'assistant',text:'```csharp\n'+code+'\n```',actions:[]}]}}));
  await waitFor(()=>expect(rendered.container.querySelector('.hljs-keyword')?.textContent).toBe('public'));
  expect(rendered.container.querySelector('pre code')?.textContent).toBe(code+'\n');
  expect(rendered.container.querySelector('script')).toBeNull();
});

test.each(['constructor','__proto__'])('unknown fence %s stays plain text instead of crashing',async language=>{
  api();const rendered=render(view({...state,messages:{studio:[{id:'unknown',role:'assistant',text:'```'+language+'\nplain code\n```',actions:[]}]}}));
  await waitFor(()=>expect(rendered.container.querySelector('pre code')?.textContent).toBe('plain code\n'));
});

test.each(['diff','patch'])('renders %s additions and removals while preserving copyable source',async language=>{
  api();const code='@@ -1 +1 @@\n-old <tag>\n+new <tag>\n';
  const rendered=render(view({...state,messages:{studio:[{id:'diff',role:'assistant',text:'```'+language+'\n'+code+'```',actions:[]}]}}));
  await waitFor(()=>expect(rendered.container.querySelector('.hljs-addition')?.textContent).toContain('+new'));
  expect(rendered.container.querySelector('.hljs-deletion')?.textContent).toContain('-old');
  expect(rendered.container.querySelector('pre code')?.textContent).toBe(code);
  expect(rendered.container.querySelector('tag')).toBeNull();
});

test('command snippets have a gutter and stay separate from executed tools',async()=>{
  api();const rendered=render(view({...state,messages:{studio:[{id:'cmd-snippet',role:'assistant',text:'```powershell\ndotnet run\n```',actions:[{id:'tool',label:'PowerShell',state:'done',detail:'{"command":"dotnet test"}'}]}]}}));
  await waitFor(()=>expect(rendered.container.querySelector('.code-gutter')?.getAttribute('title')).toBe('Extrait de commande · non exécuté'));
  expect(rendered.container.querySelector('.action-gutter svg')).toBeTruthy();
  expect(screen.getByText('Commande')).toBeTruthy();
  expect(rendered.container.querySelector('pre code')?.textContent).toBe('dotnet run\n');
});

test('final review opens the selected saved diff beside the chat and can be closed',async()=>{
  api();const review={runId:'r',capturedAt:'2026-09-27T10:00:00Z',partial:false,files:[{path:'src/a.ts',change:'modified' as const,additions:1,deletions:1,diff:{kind:'text' as const,text:'@@ -1 +1 @@\n-old\n+new\n',truncated:false}},{path:'b.txt',change:'added' as const,additions:1,deletions:0,diff:{kind:'text' as const,text:'@@ -0,0 +1 @@\n+hello\n',truncated:false}}]};
  render(view({...state,messages:{studio:[{id:'summary',role:'assistant',text:'',actions:[],review}]}}));
  expect(await screen.findByRole('region',{name:'Récapitulatif des modifications'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/b.txt/}));
  expect(screen.getByRole('complementary',{name:'Examiner les modifications'})).toBeTruthy();
  expect(screen.getByText('+hello')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Fermer les modifications'}));
  expect(screen.queryByRole('complementary',{name:'Examiner les modifications'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Examiner'}));expect(screen.getByText('-old')).toBeTruthy();
});
