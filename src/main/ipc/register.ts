import { ipcMain, dialog, type BrowserWindow } from 'electron';
import { basename } from 'node:path';
import { realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { channels } from '../../shared/api';
import type { Result, Snapshot } from '../../shared/contracts';
import { id, provider, text, validateSend, validateReply } from './validation';

export function registerIpc(window: BrowserWindow): void {
  const snapshot: Snapshot = {revision:0,projects:[],sessions:[],messages:{},pending:[]};
  const publish = () => { snapshot.revision++; window.webContents.send(channels.changed, snapshot); };
  function handle(channel: string, fn: (...args: any[]) => unknown) {
    ipcMain.handle(channel, async (event, ...args): Promise<Result<unknown>> => {
      if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return {ok:false,code:'INVALID_SENDER',message:'Requête refusée.'};
      try { return {ok:true,value:await fn(...args)}; }
      catch (error) { const code = error instanceof Error ? error.message : 'UNKNOWN'; return {ok:false,code,message:code === 'NOT_READY' ? 'Ce moteur sera connecté à la prochaine étape.' : 'La demande ne peut pas être traitée.'}; }
    });
  }
  handle(channels.snapshot, () => snapshot);
  handle(channels.pickProject, async () => {
    const choice = await dialog.showOpenDialog(window, {title:'Ouvrir un projet',properties:['openDirectory']});
    if (choice.canceled || !choice.filePaths[0]) return null;
    const cwd = await realpath(choice.filePaths[0]);
    const folderKey = process.platform === 'win32' ? cwd.toLowerCase() : cwd;
    let project = snapshot.projects.find(item => item.folderKey === folderKey);
    if (!project) { project = {id:randomUUID(),name:basename(cwd),cwd,folderKey}; snapshot.projects.push(project); publish(); }
    return project;
  });
  handle(channels.createSession, (projectId, selectedProvider) => { id(projectId); provider(selectedProvider); throw new Error('NOT_READY'); });
  handle(channels.send, input => { validateSend(input); throw new Error('NOT_READY'); });
  handle(channels.reply, input => { validateReply(input); throw new Error('NOT_READY'); });
  handle(channels.interrupt, sessionId => { id(sessionId); throw new Error('NOT_READY'); });
  handle(channels.saveDraft, (sessionId, draft) => { id(sessionId); text(draft,200000,true); throw new Error('NOT_READY'); });
  handle(channels.diagnose, projectId => { id(projectId); return []; });
  window.once('closed', () => { for (const channel of Object.values(channels)) ipcMain.removeHandler(channel); });
}
