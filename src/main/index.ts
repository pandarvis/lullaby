import { app, BrowserWindow, dialog } from 'electron';
import { join } from 'node:path';
import { createWindow } from './window';
import { registerIpc } from './ipc/register';
import { SessionManager } from './sessions/manager';
import { readStore, writeStore } from './storage/store';
import { channels } from '../shared/api';
import { ClaudeAdapter } from './providers/claude/adapter';
import { CodexAdapter } from './providers/codex/adapter';
import { NetworkSettings } from './network/settings';
import { EngineSettings } from './settings/engines';
import { TurnReviewSource } from './review/capture';
let manager:SessionManager|undefined;
let network:NetworkSettings|undefined;
let quitting=false;
async function openWindow() {
  const storeFile=join(app.getPath('userData'),'state.json');
  network=new NetworkSettings(join(app.getPath('userData'),'network.json'));
  const engines=new EngineSettings(join(app.getPath('userData'),'engines.json'));
  let initial;
  try { initial=await readStore(storeFile);await network.load();await engines.load(); }
  catch { dialog.showErrorBox('Stockage Lullaby indisponible',`Les données ne peuvent pas être chargées. Elles sont préservées. Vérifiez le fichier et sa sauvegarde .bak :\n${storeFile}`);app.quit();return; }
  const window = createWindow();
  manager=new SessionManager({adapters:[new ClaudeAdapter(),new CodexAdapter()],reviews:new TurnReviewSource(),initial,envFor:provider=>({...network!.env(provider),...(provider==='codex'&&engines.snapshot().codexExecutable?{LULLABY_CODEX_PATH:engines.snapshot().codexExecutable}:{})}),persist:state=>writeStore(storeFile,state),onChange:state=>{if(!window.isDestroyed())window.webContents.send(channels.changed,state);}});
  registerIpc(window,manager,network,engines);
  if (process.env.ELECTRON_RENDERER_URL) void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void window.loadFile(join(__dirname,'../renderer/index.html'));
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const window = BrowserWindow.getAllWindows()[0]; if (window?.isMinimized()) window.restore(); window?.focus(); });
  void app.whenReady().then(openWindow);
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit',event=>{
    if(!manager || quitting)return;
    event.preventDefault();quitting=true;
    void manager.close().catch(()=>{dialog.showErrorBox('Sauvegarde incomplète','Lullaby n’a pas pu terminer la sauvegarde. Vérifiez l’espace disque et les données locales avant de reprendre.');}).finally(async()=>{await network?.close().catch(()=>{});app.quit();});
  });
}
