// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { TurnReviewPane } from '../src/renderer/src/chat/TurnReview';
import { ShellContext } from '../src/renderer/src/shell/ShellContext';
afterEach(cleanup);
const selection={review:{runId:'r',capturedAt:'2026-09-29T07:00:00.000Z',partial:false,files:[{path:'a.ts',change:'modified' as const,additions:1,deletions:0,diff:{kind:'text' as const,text:'@@ -1 +1 @@\n-a\n+b',truncated:false}}]}};
test('the intervention diff offers the full Git view only inside the shell',()=>{
  const openGit=vi.fn();
  const view=render(<ShellContext.Provider value={{openPanel:()=>{},openGit,previewSlot:null}}><TurnReviewPane selection={selection} onClose={()=>{}}/></ShellContext.Provider>);
  fireEvent.click(screen.getByRole('button',{name:'Ouvrir dans Git'}));expect(openGit).toHaveBeenCalledOnce();
  view.unmount();render(<TurnReviewPane selection={selection} onClose={()=>{}}/>);
  expect(screen.queryByRole('button',{name:'Ouvrir dans Git'})).toBeNull();
});
