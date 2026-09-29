// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { act,cleanup,fireEvent,render,screen } from '@testing-library/react';
import { NetworkSettings } from '../src/renderer/src/settings/NetworkSettings';
import type { NetworkSnapshot } from '../src/shared/contracts';
afterEach(()=>{cleanup();vi.useRealTimers();});
const snapshot:NetworkSnapshot={profiles:[{provider:'claude',proxyUrl:'http://127.0.0.1:3128/',launcher:{executable:'C:/px.exe',args:['--port=3128'],host:'127.0.0.1',port:3128}},{provider:'codex'}],
  states:{claude:'starting',codex:'stopped'},inherited:[],
  logs:{claude:[{at:'2026-09-28T07:30:00.000Z',stream:'lullaby',text:'Lancement : px.exe --port=3128'},{at:'2026-09-28T07:30:01.000Z',stream:'stderr',text:'upstream refused'}],codex:[]}};
test('relay state, journal and polling stay visible without overwriting edits',async()=>{
  vi.useFakeTimers();const networkSettings=vi.fn().mockResolvedValue({ok:true,value:snapshot});window.lullaby={networkSettings}as any;
  render(<NetworkSettings onClose={()=>{}}/>);await act(async()=>{await Promise.resolve();});
  expect(screen.getByText('Démarrage… attente du port local').className).toContain('starting');
  expect(screen.getByRole('button',{name:'Démarrage…'})).toBeTruthy();
  expect(screen.getByText(/upstream refused/).className).toBe('stderr');
  fireEvent.change(screen.getAllByPlaceholderText('Vide : réglage hérité')[1],{target:{value:'C:/edit.pem'}});
  await act(async()=>{vi.advanceTimersByTime(2100);await Promise.resolve();});
  expect(networkSettings.mock.calls.length).toBeGreaterThanOrEqual(3);
  expect((screen.getAllByPlaceholderText('Vide : réglage hérité')[1]as HTMLInputElement).value).toBe('C:/edit.pem');
});
