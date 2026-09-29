// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { act,cleanup,render,screen } from '@testing-library/react';
import { AgentActivity } from '../src/renderer/src/chat/AgentActivity';
afterEach(()=>{cleanup();vi.useRealTimers();});
function view(sessionId:string,phase:'running'|'done'='running'){return <AgentActivity sessionId={sessionId} phase={phase} sending={false} provider="claude" messages={[]}/>;}
test('elapsed time survives leaving and reopening a running conversation',()=>{
  vi.useFakeTimers();const first=render(view('s-keep'));
  act(()=>{vi.advanceTimersByTime(42000);});expect(screen.getByText('42 s')).toBeTruthy();
  first.unmount();act(()=>{vi.advanceTimersByTime(20000);});
  render(view('s-keep'));expect(screen.getByText('1 min 2 s')).toBeTruthy();
});
test('a finished turn restarts the count for the next one and sessions are independent',()=>{
  vi.useFakeTimers();const running=render(view('s-a'));act(()=>{vi.advanceTimersByTime(30000);});
  running.rerender(view('s-a','done'));running.rerender(view('s-a'));expect(screen.getByText('0 s')).toBeTruthy();
  running.unmount();render(view('s-b'));expect(screen.getByText('0 s')).toBeTruthy();
});
