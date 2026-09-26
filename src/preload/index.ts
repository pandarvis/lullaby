import { contextBridge, ipcRenderer } from 'electron';
import { channels, type LullabyApi } from '../shared/api';
import type { Snapshot } from '../shared/contracts';
const api: LullabyApi = {
  renameProject:(id,name)=>ipcRenderer.invoke(channels.renameProject,id,name),
  removeProject:id=>ipcRenderer.invoke(channels.removeProject,id),
  pickAttachments:kind=>ipcRenderer.invoke(channels.pickAttachments,kind),
  previewHtml:(id,input)=>ipcRenderer.invoke(channels.previewHtml,id,input),
  pickPreview:id=>ipcRenderer.invoke(channels.pickPreview,id),
  openPreview:id=>ipcRenderer.invoke(channels.openPreview,id),
  releasePreview:id=>ipcRenderer.invoke(channels.releasePreview,id),
  engineSettings:()=>ipcRenderer.invoke(channels.engineSettings),
  saveEngineSettings:settings=>ipcRenderer.invoke(channels.saveEngineSettings,settings),
  pickCodexExecutable:()=>ipcRenderer.invoke(channels.pickCodexExecutable),
  git:{
    read:projectId=>ipcRenderer.invoke(channels.gitRead,projectId),
    loadMore:snapshotId=>ipcRenderer.invoke(channels.gitMore,snapshotId),
    commitFiles:(snapshotId,oid,parent)=>ipcRenderer.invoke(channels.gitFiles,snapshotId,oid,parent),
    diff:(snapshotId,target)=>ipcRenderer.invoke(channels.gitDiff,snapshotId,target),
    cancel:(projectId,scope)=>ipcRenderer.invoke(channels.gitCancel,projectId,scope),
  },
  pickProject: () => ipcRenderer.invoke(channels.pickProject),
  snapshot: () => ipcRenderer.invoke(channels.snapshot),
  createSession: (projectId, provider,nativeId) => ipcRenderer.invoke(channels.createSession,projectId,provider,nativeId),
  configureSession:(sessionId,choices)=>ipcRenderer.invoke(channels.configureSession,sessionId,choices),
  networkSettings:()=>ipcRenderer.invoke(channels.networkSettings),
  saveNetworkProfile:profile=>ipcRenderer.invoke(channels.saveNetworkProfile,profile),
  startProxy:provider=>ipcRenderer.invoke(channels.startProxy,provider),
  stopProxy:provider=>ipcRenderer.invoke(channels.stopProxy,provider),
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
