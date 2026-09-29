// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor,within } from '@testing-library/react';
import { SessionActions } from '../src/renderer/src/app/SessionActions';
import type { Session } from '../src/shared/contracts';
afterEach(cleanup);
HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
const session:Session={id:'s',projectId:'p',provider:'claude',title:'Mon essai',phase:'done',draft:'',choices:{}};
test('requires confirmation and cancellation does not remove the conversation',async()=>{
  const removed=vi.fn();window.lullaby={removeSession:vi.fn().mockResolvedValue({ok:true})} as any;
  render(<SessionActions session={session} onRemoved={removed}/>);
  fireEvent.click(screen.getByRole('button',{name:'Options de Mon essai'}));
  fireEvent.click(screen.getByRole('button',{name:'Supprimer la conversation'}));
  const dialog=screen.getByRole('dialog');expect(dialog.textContent).toContain('session native');
  fireEvent.click(within(dialog).getByRole('button',{name:'Annuler'}));expect(window.lullaby.removeSession).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Options de Mon essai'}));
  fireEvent.click(screen.getByRole('button',{name:'Supprimer la conversation'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Supprimer'}));
  await waitFor(()=>expect(removed).toHaveBeenCalledWith('s'));
  expect(window.lullaby.removeSession).toHaveBeenCalledWith('s');
});
test('active conversation cannot be removed and a failed request stays visible',async()=>{
  window.lullaby={removeSession:vi.fn().mockResolvedValue({ok:false,message:'Arrêtez cet agent.'})} as any;
  const removed=vi.fn();const view=render(<SessionActions session={{...session,phase:'waiting'}} onRemoved={removed}/>);
  fireEvent.click(screen.getByRole('button',{name:'Options de Mon essai'}));
  expect((screen.getByRole('button',{name:'Supprimer la conversation'}) as HTMLButtonElement).disabled).toBe(true);
  view.rerender(<SessionActions session={session} onRemoved={removed}/>);
  fireEvent.click(screen.getByRole('button',{name:'Supprimer la conversation'}));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Supprimer'}));
  await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('Arrêtez'));
  expect(removed).not.toHaveBeenCalled();
});
