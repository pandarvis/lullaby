// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CommitGraph } from '../src/renderer/src/git/CommitGraph';
import type { GitSnapshot } from '../src/shared/git';

const snapshot: GitSnapshot = {
  id:'s',projectId:'p',capturedAt:'',root:'C:/repo',state:'ready',head:'merge1234',branch:'develop',
  refs:[{name:'develop',oid:'merge1234',kind:'local'},{name:'origin/develop',oid:'merge1234',kind:'remote'},{name:'v1',oid:'merge1234',kind:'tag'}],
  commits:[{oid:'merge1234',parents:['parent123','outside456'],subject:'Fusion complète',author:'Auteur',date:'2026-09-26T14:32:00+02:00'},
    {oid:'parent123',parents:[],subject:'Premier commit',author:'Autre',date:'2026-09-25T10:00:00Z'}],
  changes:[],truncated:false,changedDuringRead:false,
};
afterEach(()=>{cleanup();vi.useRealTimers();});
const advance=(ms:number)=>act(()=>vi.advanceTimersByTime(ms));

test('hover waits, shows exact refs and merge parents, and stays readable across the gap',()=>{
  vi.useFakeTimers();render(<CommitGraph snapshot={snapshot} onSelect={()=>{}}/>);
  const row=screen.getByRole('button',{name:/Fusion complète/});fireEvent.mouseEnter(row);
  advance(150);expect(screen.queryByRole('tooltip')).toBeNull();advance(150);
  const tip=screen.getByRole('tooltip');expect(row.getAttribute('aria-describedby')).toBe(tip.id);
  for(const text of ['Fusion complète','Auteur','Branche locale : develop','Référence distante connue : origin/develop','Tag : v1','Fusion · 2 parents','parent12','outside4'])expect(tip.textContent).toContain(text);
  expect(tip.querySelector('time')?.dateTime).toBe('2026-09-26T14:32:00+02:00');
  fireEvent.mouseLeave(row);advance(50);fireEvent.mouseEnter(tip);advance(200);expect(screen.getByRole('tooltip')).toBeTruthy();
  fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('tooltip')).toBeNull();
});

test('keyboard focus shows the same card, Escape dismisses it and refs are not inferred',()=>{
  render(<CommitGraph snapshot={snapshot} onSelect={()=>{}}/>);
  const row=screen.getByRole('button',{name:/Premier commit/});fireEvent.focus(row);
  const tip=screen.getByRole('tooltip');expect(tip.textContent).toContain('Commit racine');expect(tip.textContent).not.toContain('develop');
  fireEvent.keyDown(row,{key:'Escape'});expect(screen.queryByRole('tooltip')).toBeNull();expect(row.hasAttribute('aria-describedby')).toBe(false);
});

test('an edge highlights its endpoints and identifies a parent outside the loaded page',()=>{
  vi.useFakeTimers();const view=render(<CommitGraph snapshot={snapshot} onSelect={()=>{}}/>);
  const edge=view.container.querySelector('[data-git-edge="merge1234:outside456"]');expect(edge).not.toBeNull();
  fireEvent.mouseEnter(edge!);advance(300);expect(screen.getByRole('tooltip').textContent).toContain('Parent hors des commits chargés');
  expect(view.container.querySelector('[data-git-node="merge1234"]')?.classList.contains('highlighted')).toBe(true);
  expect(edge?.classList.contains('highlighted')).toBe(true);
});

test('replacing a snapshot or hiding Git cancels pending and visible cards',()=>{
  vi.useFakeTimers();const view=render(<CommitGraph snapshot={snapshot} onSelect={()=>{}}/>);
  fireEvent.mouseEnter(screen.getByRole('button',{name:/Fusion complète/}));
  view.rerender(<CommitGraph snapshot={{...snapshot,id:'new'}} onSelect={()=>{}}/>);advance(400);expect(screen.queryByRole('tooltip')).toBeNull();
  fireEvent.focus(screen.getByRole('button',{name:/Fusion complète/}));expect(screen.getByRole('tooltip')).toBeTruthy();
  view.rerender(<CommitGraph snapshot={{...snapshot,id:'new'}} active={false} onSelect={()=>{}}/>);expect(screen.queryByRole('tooltip')).toBeNull();
});
