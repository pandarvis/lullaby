import { expect,test,vi } from 'vitest';
vi.mock('electron',()=>({app:{},BrowserWindow:class{},shell:{}}));
import { TITLEBAR_HEIGHT,windowOptions } from '../src/main/window';
test('the window hides the native title bar and keeps native Windows controls',()=>{
  const options=windowOptions('C:/app','C:/app/preload.js');
  expect(TITLEBAR_HEIGHT).toBe(40);
  expect(options.titleBarStyle).toBe('hidden');
  expect(options.titleBarOverlay).toEqual({color:'#e9e5f5',symbolColor:'#302e50',height:40});
  expect(options.backgroundColor).toBe('#e9e5f5');
  expect(options.webPreferences).toMatchObject({preload:'C:/app/preload.js',contextIsolation:true,nodeIntegration:false,sandbox:true});
});
