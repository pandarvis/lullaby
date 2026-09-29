// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { describeNative } from '../src/main/providers/claude/adapter';
import { ComposerOptions } from '../src/renderer/src/chat/ComposerOptions';
import type { Diagnostic,Session } from '../src/shared/contracts';
afterEach(cleanup);
Element.prototype.scrollIntoView=()=>{};Element.prototype.hasPointerCapture=()=>false;Element.prototype.releasePointerCapture=()=>{};
const models=[{id:'default',name:'Par défaut',efforts:['high'],default:false},{id:'opus',name:'Opus 5.5',efforts:['high','xhigh'],default:false}];
test('native Claude choices resolve from effective settings',()=>{
  expect(describeNative({model:'opus[1m]',effortLevel:'xhigh',permissions:{defaultMode:'acceptEdits'}} as any,models)).toEqual({configuredModel:'opus',native:{modelName:'Opus 5.5 (1M)',effort:'xhigh',permission:'acceptEdits'}});
  expect(describeNative(undefined,models)).toEqual({configuredModel:'default',native:{modelName:'Par défaut',effort:undefined,permission:'default'}});
});
test('native selections name the configured model, effort and permissions',()=>{
  window.lullaby={configureSession:vi.fn()}as any;
  const session:Session={id:'s',projectId:'p',provider:'claude',title:'t',phase:'idle',draft:'',choices:{}};
  const diagnostic:Diagnostic={provider:'claude',available:true,auth:'subscription',issues:[],skills:[],models,configuredModel:'opus',native:{modelName:'Opus 5.5 (1M)',effort:'xhigh',permission:'default'}};
  render(<ComposerOptions session={session} diagnostic={diagnostic} onError={()=>{}} onBusy={()=>{}}/>);
  expect(screen.getByRole('combobox',{name:'Modèle'}).textContent).toContain('Opus 5.5 (1M) · natif');
  expect(screen.getByRole('combobox',{name:'Effort'}).textContent).toContain('Très élevé · natif');
  expect(screen.getByRole('combobox',{name:'Autorisations'}).textContent).toContain('Avec demandes · natif');
});
test('during a turn permissions stay editable, Auto is Claude-only and a deferred change is announced',async()=>{
  const configureSession=vi.fn().mockResolvedValue({ok:true,value:'next'});window.lullaby={configureSession}as any;const onError=vi.fn();
  const running:Session={id:'s',projectId:'p',provider:'claude',title:'t',phase:'running',draft:'',choices:{}};
  const view=render(<ComposerOptions session={running} onError={onError} onBusy={()=>{}}/>);
  expect((screen.getByRole('combobox',{name:'Autorisations'})as HTMLButtonElement).disabled).toBe(false);
  expect((screen.getByRole('combobox',{name:'Modèle'})as HTMLButtonElement).disabled).toBe(true);
  fireEvent.keyDown(screen.getByRole('combobox',{name:'Autorisations'}),{key:'ArrowDown'});fireEvent.click(await screen.findByRole('option',{name:/^Auto/}));
  await waitFor(()=>expect(configureSession).toHaveBeenCalledWith('s',{permissionProfile:'automatic'}));
  await waitFor(()=>expect(onError).toHaveBeenCalledWith(expect.stringContaining('prochain message')));
  view.unmount();render(<ComposerOptions session={{...running,provider:'codex'}} onError={()=>{}} onBusy={()=>{}}/>);
  fireEvent.keyDown(screen.getByRole('combobox',{name:'Autorisations'}),{key:'ArrowDown'});await screen.findAllByRole('option');
  expect(screen.queryByRole('option',{name:/^Auto$|^Auto Claude/})).toBeNull();
});
