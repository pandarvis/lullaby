import { ipcMain, dialog, type BrowserWindow } from 'electron';
import { channels } from '../../shared/api';
import type { Result } from '../../shared/contracts';
import type { SessionManager } from '../sessions/manager';
import { id, provider, text, nativeId, launchChoices, validateSend, validateReply } from './validation';
import type { NetworkSettings } from '../network/settings';
import { validateNetworkProfile } from '../network/profiles';

export function registerIpc(window: BrowserWindow, manager: SessionManager, network:NetworkSettings): void {
  function handle(channel: string, fn: (...args: any[]) => unknown) {
    ipcMain.handle(channel, async (event, ...args): Promise<Result<unknown>> => {
      if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return {ok:false,code:'INVALID_SENDER',message:'Requête refusée.'};
      try { return {ok:true,value:await fn(...args)}; }
      catch (error) {
        const candidate=error instanceof Error?error.message:'';
        const code=/^[A-Z_]{3,64}$/.test(candidate)?candidate:'OPERATION_FAILED';
        const messages:Record<string,string>={FOLDER_BUSY:'Un agent travaille déjà dans ce dossier. Arrêtez-le ou attendez sa fin.',STALE_REQUEST:'Cette demande est périmée. Elle ne peut plus être approuvée.',AUTH_CONFIGURATION_AMBIGUOUS:'La configuration peut sélectionner une API facturée. Vérifiez le diagnostic du moteur.',SUBSCRIPTION_NOT_CONFIRMED:'La connexion par abonnement n’est pas confirmée. Connectez-vous dans le client officiel.',INVALID_NATIVE_ID:'L’identifiant natif doit être un UUID de session.',SESSION_ALREADY_IMPORTED:'Cette session native est déjà présente dans Lullaby.',NATIVE_FOLDER_MISMATCH:'Cette session native appartient à un autre dossier.',CODEX_PROCESS_FAILED:'Le moteur Codex ne peut pas être lancé. Vérifiez son installation ou son chemin.',CODEX_RPC_REJECTED:'Codex a refusé la demande. Vérifiez le modèle sélectionné et la configuration native.'};
        return {ok:false,code,message:messages[code]??'La demande ne peut pas être traitée. Vérifiez le diagnostic et le dossier du projet.'};
      }
    });
  }
  handle(channels.snapshot, () => manager.snapshot());
  function idleProvider(value:unknown){const selected=provider(value);if(manager.snapshot().sessions.some(s=>s.provider===selected&&['running','waiting'].includes(s.phase)))throw new Error('SESSION_RUNNING');return selected;}
  handle(channels.networkSettings,()=>network.snapshot());
  handle(channels.saveNetworkProfile,value=>{const profile=validateNetworkProfile(value);idleProvider(profile.provider);return network.save(profile);});
  handle(channels.startProxy,value=>network.proxy.start(network.profile(idleProvider(value))));
  handle(channels.stopProxy,value=>network.proxy.stop(idleProvider(value)));
  handle(channels.pickProject, async () => {
    const choice = await dialog.showOpenDialog(window, {title:'Ouvrir un projet',properties:['openDirectory']});
    if (choice.canceled || !choice.filePaths[0]) return null;
    return manager.addProject(choice.filePaths[0]);
  });
  handle(channels.createSession, (projectId, selectedProvider, native) => manager.createSession(id(projectId),provider(selectedProvider),nativeId(native)));
  handle(channels.configureSession,(sessionId,choices)=>manager.configureSession(id(sessionId),launchChoices(choices)));
  handle(channels.send, input => manager.send(validateSend(input)));
  handle(channels.reply, input => manager.reply(validateReply(input)));
  handle(channels.interrupt, sessionId => manager.interrupt(id(sessionId)));
  handle(channels.saveDraft, (sessionId, draft) => manager.saveDraft(id(sessionId),text(draft,200000,true)));
  handle(channels.diagnose, projectId => manager.diagnose(id(projectId)));
  window.once('closed', () => { for (const channel of Object.values(channels)) ipcMain.removeHandler(channel); });
}
