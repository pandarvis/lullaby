// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,render,screen,fireEvent,waitFor } from '@testing-library/react';
import { GitView } from '../src/renderer/src/git/GitView';
import { CommitGraph } from '../src/renderer/src/git/CommitGraph';
import { ChangesTree } from '../src/renderer/src/git/ChangesTree';
import { DiffView } from '../src/renderer/src/git/DiffView';
import irisStyles from '../src/renderer/src/styles/iris.css?raw';
import { SessionChat } from '../src/renderer/src/chat/SessionChat';
import { SnapshotContext } from '../src/renderer/src/chat/sessionStore';
import type { GitSnapshot } from '../src/shared/git';
afterEach(cleanup);globalThis.ResizeObserver=class {observe(){}unobserve(){}disconnect(){}};Element.prototype.scrollTo=()=>{};
const snapshot=(projectId='p'):GitSnapshot=>({id:projectId+'-snapshot',projectId,capturedAt:'2026-09-26T12:00:00Z',root:'C:/fixture',state:'ready',head:'merge',branch:'main',refs:[],commits:[{oid:'merge',parents:['parent-a','parent-b'],subject:'Merge fixture',author:'Fixture',date:'2026-09-26'}],changes:[{id:'index',path:'src/file.ts',area:'index',status:'M'},{id:'work',path:'src/file.ts',area:'worktree',status:'M'},{id:'html',path:'<script>.txt',area:'untracked',status:'?'},{id:'deleted',path:'deleted.txt',area:'worktree',status:'D'},{id:'conflict',path:'conflict.txt',area:'conflict',status:'UU'}],truncated:false,changedDuringRead:false});
function api(){const git={read:vi.fn(async(projectId:string)=>({ok:true,value:snapshot(projectId)})),commitFiles:vi.fn(async()=>({ok:true,value:[{id:'committed',path:'src/commit.ts',status:'M'}]})),diff:vi.fn(async()=>({ok:true,value:{kind:'text',text:'@@ -1 +1 @@\n-before\n+after\n',truncated:false}})),loadMore:vi.fn(),cancel:vi.fn(async()=>({ok:true}))};window.lullaby={git} as any;return git;}
test('ignores an old project response and displays read errors',async()=>{
  const git=api();let finish!:(value:any)=>void;git.read.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const view=render(<GitView projectId="a"/>);view.rerender(<GitView projectId="b"/>);await screen.findByRole('heading',{name:'Merge fixture'});
  finish({ok:true,value:{...snapshot('a'),branch:'WRONG_PROJECT'}});await waitFor(()=>expect(screen.queryByText('WRONG_PROJECT')).toBeNull());expect(git.cancel).toHaveBeenCalledWith('a');
  git.read.mockResolvedValueOnce({ok:false,code:'GIT_TIMEOUT',message:'Délai dépassé'} as any);fireEvent.click(screen.getByRole('button',{name:'Actualiser'}));expect((await screen.findByRole('alert')).textContent).toContain('Délai dépassé');
});
test('chooses merge parent and routes versions separately; HTML names remain text',async()=>{
  const git=api();render(<GitView projectId="p"/>);await screen.findByLabelText('Parent de comparaison');
  fireEvent.change(screen.getByLabelText('Parent de comparaison'),{target:{value:'parent-b'}});await waitFor(()=>expect(git.commitFiles).toHaveBeenLastCalledWith('p-snapshot','merge','parent-b'));
  fireEvent.click(await screen.findByRole('button',{name:/commit.ts/}));await waitFor(()=>expect(git.diff).toHaveBeenLastCalledWith('p-snapshot',{kind:'commit',oid:'merge',parent:'parent-b',changeId:'committed'}));
  fireEvent.click(screen.getByRole('tab',{name:/Modifications/}));
  const files=screen.getAllByRole('button',{name:/file.ts/});expect(files).toHaveLength(2);fireEvent.click(files[1]);await waitFor(()=>expect(git.diff).toHaveBeenLastCalledWith('p-snapshot',{kind:'local',changeId:'work'}));
  expect(screen.getByRole('button',{name:/<script>.txt/})).toBeTruthy();expect(document.querySelector('script')).toBeNull();expect(screen.getByRole('button',{name:/deleted.txt/})).toBeTruthy();expect(screen.getByText('Conflits')).toBeTruthy();
  git.diff.mockResolvedValueOnce({ok:true,value:{kind:'binary',text:'Fichier binaire',truncated:true}} as any);fireEvent.click(screen.getByRole('button',{name:/<script>.txt/}));expect(await screen.findByText('Fichier binaire')).toBeTruthy();expect(screen.getByText(/Différence tronquée/)).toBeTruthy();
});
test('opening the full-width Git view and coming back keeps the assistant-ui draft',async()=>{
  api();Object.assign(window.lullaby,{saveDraft:vi.fn().mockResolvedValue({ok:true}),send:vi.fn(),interrupt:vi.fn()});
  const state={revision:1,projects:[],sessions:[{id:'chat-git',projectId:'p',provider:'claude' as const,title:'Chat',phase:'idle' as const,draft:'',choices:{}}],messages:{'chat-git':[]},pending:[]};
  const main=(git:boolean)=><SnapshotContext.Provider value={state}>{git?<GitView projectId="p"/>:<SessionChat sessionId="chat-git"/>}</SnapshotContext.Provider>;
  const view=render(main(false));
  fireEvent.change(screen.getByRole('textbox',{name:'Votre message'}),{target:{value:'mon brouillon'}});
  view.rerender(main(true));await screen.findByRole('heading',{name:'Merge fixture'});
  view.rerender(main(false));
  expect((screen.getByRole('textbox',{name:'Votre message'})as HTMLTextAreaElement).value).toBe('mon brouillon');
});
test('a late diff never replaces the newly selected file',async()=>{
  const git=api();render(<GitView projectId="p"/>);await screen.findByRole('heading',{name:'Merge fixture'});fireEvent.click(screen.getByRole('tab',{name:/Modifications/}));
  let finish!:(value:any)=>void;git.diff.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  fireEvent.click(screen.getByRole('button',{name:/<script>.txt/}));await waitFor(()=>expect(git.diff).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button',{name:/deleted.txt/}));await screen.findByText('+after');finish({ok:true,value:{kind:'text',text:'OLD_FILE_CONTENT',truncated:false}});
  await waitFor(()=>expect(screen.queryByText('OLD_FILE_CONTENT')).toBeNull());expect(git.cancel).toHaveBeenCalledWith('p','diff');
});
test('the graph keeps full dimensions under the application icon stylesheet',()=>{
  const style=document.createElement('style');style.textContent=irisStyles;document.head.append(style);
  try{const view=render(<div className="shell"><CommitGraph snapshot={snapshot()} onSelect={()=>{}}/></div>);const graph=view.container.querySelector('svg')!;expect(parseFloat(getComputedStyle(graph).height)).toBe(58);expect(parseFloat(getComputedStyle(graph).width)).toBeGreaterThan(20);}finally{style.remove();}
});
test('file replaced by directory exposes both deleted file and new child',()=>{
  render(<ChangesTree grouped={false} changes={[{id:'old',path:'foo',status:'D',area:'index'},{id:'new',path:'foo/bar.txt',status:'A',area:'index'}]} onSelect={()=>{}}/>);
  expect(screen.getByRole('button',{name:'foo · Supprimé'})).toBeTruthy();expect(screen.getByRole('button',{name:'bar.txt · Ajouté'})).toBeTruthy();
});
test('refresh waits for the replacement commit listing before fetching its selected diff',async()=>{
  const git=api();render(<GitView projectId="p"/>);fireEvent.click(await screen.findByRole('button',{name:/commit.ts/}));await screen.findByText('+after');
  let finishFiles!:(value:any)=>void;git.commitFiles.mockImplementationOnce(()=>new Promise(resolve=>{finishFiles=resolve;}));
  git.read.mockResolvedValueOnce({ok:true,value:{...snapshot(),id:'replacement'}});
  fireEvent.click(screen.getByRole('button',{name:'Actualiser'}));await waitFor(()=>expect(git.commitFiles).toHaveBeenCalledWith('replacement','merge','parent-a'));
  expect(git.diff.mock.calls.filter((args:unknown[])=>args[0]==='replacement')).toHaveLength(0);
  finishFiles({ok:true,value:[{id:'committed',path:'src/commit.ts',status:'M'}]});await waitFor(()=>expect(git.diff).toHaveBeenLastCalledWith('replacement',{kind:'commit',oid:'merge',parent:'parent-a',changeId:'committed'}));expect(screen.getByRole('button',{name:/commit.ts/})).toBeTruthy();
});

test('clean local changes lead to history and refresh between clean and changed files',async()=>{
  const git=api();const clean={...snapshot(),changes:[]};git.read.mockResolvedValueOnce({ok:true,value:clean});
  render(<GitView projectId="p"/>);await screen.findByRole('heading',{name:'Merge fixture'});
  fireEvent.click(screen.getByRole('tab',{name:/Modifications/}));
  expect(screen.getByRole('heading',{name:'Aucune modification locale'})).toBeTruthy();
  expect(screen.queryByText(/Sélectionnez un fichier/)).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Voir l’historique'}));
  expect(await screen.findByRole('heading',{name:'Merge fixture'})).toBeTruthy();
  expect(screen.getByRole('tab',{name:'Historique'}).getAttribute('aria-selected')).toBe('true');
  fireEvent.click(screen.getByRole('tab',{name:/Modifications/}));
  fireEvent.click(screen.getByRole('button',{name:'Actualiser'}));
  fireEvent.click(await screen.findByRole('button',{name:/deleted.txt/}));await screen.findByText('+after');
  expect(screen.queryByRole('heading',{name:'Aucune modification locale'})).toBeNull();
  git.read.mockResolvedValueOnce({ok:true,value:{...clean,id:'clean-again'}});
  fireEvent.click(screen.getByRole('button',{name:'Actualiser'}));
  expect(await screen.findByRole('heading',{name:'Aucune modification locale'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/deleted.txt/})).toBeNull();
  expect(screen.queryByText('+after')).toBeNull();expect(screen.queryByText(/Sélectionnez un fichier/)).toBeNull();
});
test('coming back to the window re-reads Git silently and keeps the open diff',async()=>{
  const git=api();let serial=0;git.read.mockImplementation(async(projectId:string)=>({ok:true,value:{...snapshot(projectId),id:`read-${++serial}`}}));
  render(<GitView projectId="p"/>);await screen.findByRole('heading',{name:'Merge fixture'});
  fireEvent.click(await screen.findByRole('button',{name:/commit\.ts/}));await screen.findByText('+after');
  const files=git.commitFiles.mock.calls.length,diffs=git.diff.mock.calls.length;
  window.dispatchEvent(new Event('focus'));
  await waitFor(()=>expect(git.read).toHaveBeenCalledTimes(2),{timeout:2000});
  expect(screen.queryByText('Lecture du dépôt…')).toBeNull();expect(screen.getByText('+after')).toBeTruthy();
  await new Promise(resolve=>setTimeout(resolve,50));
  expect(git.commitFiles.mock.calls.length).toBe(files);expect(git.diff.mock.calls.length).toBe(diffs);
});
test('diff lines take the colours of the file language and keep their sign',()=>{
  const diff={kind:'text' as const,text:'@@ -1 +1 @@\n-const a = 1;\n+const a = "b";\n context',truncated:false};
  const view=render(<DiffView diff={diff} path="src/a.ts"/>);
  const added=view.container.querySelector('.git-diff-added code')!;
  expect(added.textContent).toBe('+const a = "b";');expect(added.querySelector('.hljs-keyword')?.textContent).toBe('const');expect(added.querySelector('.hljs-string')).toBeTruthy();
  expect(view.container.querySelector('.git-diff-hunk .hljs-keyword')).toBeNull();
  view.unmount();const plain=render(<DiffView diff={diff} path="notes.unknown"/>);expect(plain.container.querySelector('.hljs-keyword')).toBeNull();
});
