import { contextBridge, ipcRenderer } from 'electron';
import { channels, type LullabyApi } from '../shared/api';
import type { Snapshot } from '../shared/contracts';
const api: LullabyApi = {
  pickProject: () => ipcRenderer.invoke(channels.pickProject),
  snapshot: () => ipcRenderer.invoke(channels.snapshot),
  createSession: (projectId, provider,nativeId) => ipcRenderer.invoke(channels.createSession,projectId,provider,nativeId),
  configureSession:(sessionId,choices)=>ipcRenderer.invoke(channels.configureSession,sessionId,choices),
  send: input => ipcRenderer.invoke(channels.send,input),
  reply: input => ipcRenderer.invoke(channels.reply,input),
  interrupt: sessionId => ipcRenderer.invoke(channels.interrupt,sessionId),
  saveDraft: (sessionId,text) => ipcRenderer.invoke(channels.saveDraft,sessionId,text),
  diagnose: projectId => ipcRenderer.invoke(channels.diagnose,projectId),
  subscribe: listener => {
    const handler = (_event: unknown, snapshot: Snapshot) => listener(snapshot);
    ipcRenderer.on(channels.changed,handler);
    return () => { ipcRenderer.removeListener(channels.changed,handler); };
  },
};
contextBridge.exposeInMainWorld('lullaby',api);
