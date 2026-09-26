import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width:1320,height:900,minWidth:720,minHeight:560,title:'Lullaby',backgroundColor:'#f1eff8',show:false,
    icon:join(app.getAppPath(),'resources/lullaby.ico'),
    autoHideMenuBar:true,
    webPreferences:{preload:join(__dirname,'../preload/index.js'),contextIsolation:true,nodeIntegration:false,sandbox:true},
  });
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(({url}) => {
    try { const parsed = new URL(url); if (['https:','http:'].includes(parsed.protocol)) void shell.openExternal(parsed.toString()); } catch { /* Invalid URL stays closed. */ }
    return {action:'deny'};
  });
  window.once('ready-to-show', () => window.show());
  return window;
}
