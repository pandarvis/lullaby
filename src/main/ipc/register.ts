import { ipcMain, dialog, type BrowserWindow } from 'electron';
import { channels } from '../../shared/api';
import type { Result } from '../../shared/contracts';
import type { SessionManager } from '../sessions/manager';
import { id, provider, text, validateSend, validateReply } from './validation';

export function registerIpc(window: BrowserWindow, manager: SessionManager): void {
  function handle(channel: string, fn: (...args: any[]) => unknown) {
    ipcMain.handle(channel, async (event, ...args): Promise<Result<unknown>> => {
      if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return {ok:false,code:'INVALID_SENDER',message:'Requête refusée.'};
      try { return {ok:true,value:await fn(...args)}; }
      catch (error) { const code = error instanceof Error ? error.message : 'UNKNOWN'; return {ok:false,code,message:code === 'NOT_READY' ? 'Ce moteur sera connecté à la prochaine étape.' : 'La demande ne peut pas être traitée.'}; }
    });
  }
  handle(channels.snapshot, () => manager.snapshot());
  handle(channels.pickProject, async () => {
    const choice = await dialog.showOpenDialog(window, {title:'Ouvrir un projet',properties:['openDirectory']});
    if (choice.canceled || !choice.filePaths[0]) return null;
    return manager.addProject(choice.filePaths[0]);
  });
  handle(channels.createSession, (projectId, selectedProvider) => manager.createSession(id(projectId),provider(selectedProvider)));
  handle(channels.send, input => manager.send(validateSend(input)));
  handle(channels.reply, input => manager.reply(validateReply(input)));
  handle(channels.interrupt, sessionId => manager.interrupt(id(sessionId)));
  handle(channels.saveDraft, (sessionId, draft) => manager.saveDraft(id(sessionId),text(draft,200000,true)));
  handle(channels.diagnose, projectId => manager.diagnose(id(projectId)));
  window.once('closed', () => { for (const channel of Object.values(channels)) ipcMain.removeHandler(channel); });
}
