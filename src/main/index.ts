import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { createWindow } from './window';
import { registerIpc } from './ipc/register';
function openWindow() {
  const window = createWindow();
  registerIpc(window);
  if (process.env.ELECTRON_RENDERER_URL) void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void window.loadFile(join(__dirname,'../renderer/index.html'));
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const window = BrowserWindow.getAllWindows()[0]; if (window?.isMinimized()) window.restore(); window?.focus(); });
  void app.whenReady().then(openWindow);
  app.on('window-all-closed', () => app.quit());
}
