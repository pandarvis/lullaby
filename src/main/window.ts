import { app, BrowserWindow, shell, type BrowserWindowConstructorOptions } from 'electron';
import { join } from 'node:path';
export const TITLEBAR_HEIGHT = 40;
// Native Windows caption buttons stay, painted in the Iris chrome colour.
export function windowOptions(appPath: string, preload: string): BrowserWindowConstructorOptions {
  return {
    width:1320,height:900,minWidth:720,minHeight:560,title:'Lullaby',backgroundColor:'#e9e5f5',show:false,
    icon:join(appPath,'resources/lullaby.ico'),
    autoHideMenuBar:true,
    titleBarStyle:'hidden',
    titleBarOverlay:{color:'#e9e5f5',symbolColor:'#302e50',height:TITLEBAR_HEIGHT},
    webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true},
  };
}
export function createWindow(): BrowserWindow {
  const window = new BrowserWindow(windowOptions(app.getAppPath(), join(__dirname,'../preload/index.js')));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(({url}) => {
    try { const parsed = new URL(url); if (['https:','http:'].includes(parsed.protocol)) void shell.openExternal(parsed.toString()); } catch { /* Invalid URL stays closed. */ }
    return {action:'deny'};
  });
  window.once('ready-to-show', () => window.show());
  return window;
}
