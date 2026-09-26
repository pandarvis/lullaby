// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,render,screen,fireEvent,waitFor } from '@testing-library/react';
import { GitView } from '../src/renderer/src/git/GitView';
import { ProjectWorkspace } from '../src/renderer/src/app/ProjectWorkspace';
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
test('returning from Git keeps the actual assistant-ui draft',async()=>{
  api();Object.assign(window.lullaby,{saveDraft:vi.fn().mockResolvedValue({ok:true}),send:vi.fn(),interrupt:vi.fn()});
  const state={revision:1,projects:[],sessions:[{id:'chat-git',projectId:'p',provider:'claude' as const,title:'Chat',phase:'idle' as const,draft:'',choices:{}}],messages:{'chat-git':[]},pending:[]};
  render(<SnapshotContext.Provider value={state}><ProjectWorkspace projectId="p"><SessionChat sessionId="chat-git"/></ProjectWorkspace></SnapshotContext.Provider>);
  fireEvent.change(screen.getByRole('textbox',{name:'Votre message'}),{target:{value:'mon brouillon'}});fireEvent.click(screen.getByRole('button',{name:'Git'}));await screen.findByRole('heading',{name:'Merge fixture'});fireEvent.click(screen.getByRole('button',{name:'Conversations'}));expect((screen.getByRole('textbox',{name:'Votre message'})as HTMLTextAreaElement).value).toBe('mon brouillon');
});
test('a late diff never replaces the newly selected file',async()=>{
  const git=api();render(<GitView projectId="p"/>);await screen.findByRole('heading',{name:'Merge fixture'});fireEvent.click(screen.getByRole('tab',{name:/Modifications/}));
  let finish!:(value:any)=>void;git.diff.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  fireEvent.click(screen.getByRole('button',{name:/<script>.txt/}));await waitFor(()=>expect(git.diff).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button',{name:/deleted.txt/}));await screen.findByText('+after');finish({ok:true,value:{kind:'text',text:'OLD_FILE_CONTENT',truncated:false}});
  await waitFor(()=>expect(screen.queryByText('OLD_FILE_CONTENT')).toBeNull());expect(git.cancel).toHaveBeenCalledWith('p','detail');
});
