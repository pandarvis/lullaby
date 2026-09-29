// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { SessionHeader } from '../src/renderer/src/app/ProjectSessions';
import type { Diagnostic,Session } from '../src/shared/contracts';
afterEach(cleanup);
const session:Session={id:'s',projectId:'p',provider:'claude',title:'Tu es là ?',phase:'done',draft:'',choices:{}};
const diagnostic:Diagnostic={provider:'claude',available:false,auth:'missing',skills:[],issues:['Le moteur Claude n’a pas répondu en 90 s.']};
test('a diagnostic banner offers to check again and shows the check in progress',()=>{
  const onRetry=vi.fn();const view=render(<SessionHeader session={session} diagnostic={diagnostic} onRetry={onRetry}/>);
  fireEvent.click(screen.getByRole('button',{name:'Réessayer'}));expect(onRetry).toHaveBeenCalledTimes(1);
  view.rerender(<SessionHeader session={session} diagnostic={diagnostic} onRetry={onRetry} checking/>);
  expect((screen.getByRole('button',{name:'Vérification…'})as HTMLButtonElement).disabled).toBe(true);
});
