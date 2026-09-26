import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import type { Snapshot, Session, Provider, PromptRequest, ReplyRequest } from '../../shared/contracts';
import type { ProviderAdapter, ProviderRun } from '../providers/types';
import { canonicalizeFolder } from '../projects/registry';
import { emptySnapshot } from '../storage/store';
import { applyEvent } from './projection';
type Active = {id:string;folderKey:string;run?:ProviderRun;done?:Promise<void>;ready:Promise<void>;started:()=>void;stopped:boolean;seen:Set<string>;replying:Set<string>};
type Options = {adapters:ProviderAdapter[];initial?:Snapshot;persist?:(s:Snapshot)=>Promise<void>;onChange?:(s:Snapshot)=>void};
export class SessionManager {
  private state: Snapshot;
  private active = new Map<string,Active>();
  private folders = new Set<string>();
  private timer?: ReturnType<typeof setTimeout>;
  private closing = false;
  constructor(private options:Options) {
    this.state = structuredClone(options.initial ?? emptySnapshot());
    for(const session of this.state.sessions) if(['running','waiting'].includes(session.phase)) session.phase='interrupted';
    this.state.pending=[]; this.state.revision++;
  }
  snapshot(): Snapshot { return structuredClone(this.state); }
  private publish() { this.state.revision++; this.options.onChange?.(this.snapshot()); }
  private async save() { if(this.timer) {clearTimeout(this.timer);this.timer=undefined;} await this.options.persist?.(this.snapshot()); }
  private scheduleSave() { if(!this.timer) this.timer=setTimeout(()=>{this.timer=undefined;void this.save().catch(()=>{for(const id of this.active.keys()) void this.interrupt(id).catch(()=>{});});},150); }
  private session(id:string):Session { const session=this.state.sessions.find(s=>s.id===id); if(!session) throw new Error('SESSION_NOT_FOUND'); return session; }
  async addProject(path:string) {
    const canonical = await canonicalizeFolder(path);
    let project = this.state.projects.find(p=>p.folderKey===canonical.folderKey);
    if(!project) { project={id:randomUUID(),name:basename(canonical.cwd),...canonical}; this.state.projects.push(project);this.publish();await this.save(); }
    return structuredClone(project);
  }
  async createSession(projectId:string,provider:Provider) {
    if(!this.state.projects.some(p=>p.id===projectId)) throw new Error('PROJECT_NOT_FOUND');
    const session:Session = {id:randomUUID(),projectId,provider,title:'Nouvelle conversation',phase:'idle',draft:'',choices:{}};
    this.state.sessions.push(session);this.state.messages[session.id]=[];this.publish();await this.save(); return structuredClone(session);
  }
  async send(input:PromptRequest): Promise<{runId:string}> {
    if(this.closing) throw new Error('CLOSING');
    const session=this.session(input.sessionId);
    const project=this.state.projects.find(p=>p.id===session.projectId)!;
    if(this.folders.has(project.folderKey)) throw new Error('FOLDER_BUSY');
    const adapter=this.options.adapters.find(a=>a.provider===session.provider);
    if(!adapter) throw new Error('PROVIDER_UNAVAILABLE');
    let started!:()=>void;
    const ready=new Promise<void>(resolve=>{started=resolve;});
    const active:Active={id:randomUUID(),folderKey:project.folderKey,ready,started,stopped:false,seen:new Set(),replying:new Set()};
    this.folders.add(project.folderKey);this.active.set(session.id,active);
    try {
      const actual=await canonicalizeFolder(project.cwd); if(actual.folderKey!==project.folderKey) throw new Error('PROJECT_MOVED');
      session.phase='running';session.draft='';
      if(session.title==='Nouvelle conversation') session.title=input.text.slice(0,72);
      this.state.messages[session.id].push({id:randomUUID(),role:'user',text:input.text,actions:[]});this.publish();await this.save();
      active.run = await adapter.run({cwd:project.cwd,nativeId:session.nativeId,text:input.text,choices:session.choices,env:{...process.env}});
      active.done=this.consume(session.id,active);
      active.started();
      if(active.stopped) await active.run.interrupt();
      return {runId:active.id};
    } catch(error) {
      active.started();this.session(session.id).phase='error';this.active.delete(session.id);this.folders.delete(project.folderKey);this.publish();await this.save();throw error;
    }
  }
  private async consume(sessionId:string,active:Active) {
    try {
      for await(const event of active.run!.events) {
        if(active.stopped || this.active.get(sessionId)!==active || active.seen.has(event.eventId)) continue;
        active.seen.add(event.eventId);
        this.state=applyEvent(this.state,{...event,sessionId,runId:active.id});this.publish();
        if(event.body.kind==='text') this.scheduleSave();else await this.save();
      }
      const session=this.session(sessionId);
      if(active.stopped) session.phase='interrupted';else if(['running','waiting'].includes(session.phase)) session.phase='done';
    } catch {
      this.session(sessionId).phase=active.stopped?'interrupted':'error';
      if(!active.stopped) this.state.messages[sessionId].push({id:randomUUID(),role:'assistant',text:'Le moteur a interrompu la réponse. Consultez son diagnostic avant de reprendre.',actions:[]});
    } finally {
      try { await active.run?.close(); }
      finally {
        this.state.pending=this.state.pending.filter(e=>e.runId!==active.id);
        this.active.delete(sessionId);this.folders.delete(active.folderKey);this.publish();
        await this.save().catch(()=>{this.session(sessionId).phase='error';this.publish();});
      }
    }
  }
  async reply(input:ReplyRequest) {
    const active=this.active.get(input.sessionId);
    const pending=this.state.pending.find(e=>e.sessionId===input.sessionId && e.runId===input.runId && e.body.kind==='request' && e.body.requestId===input.requestId);
    if(!active?.run || active.id!==input.runId || !pending || active.replying.has(input.requestId)) throw new Error('STALE_REQUEST');
    if(pending.body.kind==='request' && ((pending.body.requestKind==='approval') !== (input.answer.kind!=='text'))) throw new Error('INVALID_ANSWER');
    active.replying.add(input.requestId);
    try {
      await active.run.reply(input.requestId,input.answer);
      this.state.pending=this.state.pending.filter(e=>e!==pending);this.session(input.sessionId).phase=this.state.pending.some(e=>e.sessionId===input.sessionId)?'waiting':'running';this.publish();await this.save();
    } finally {active.replying.delete(input.requestId);}
  }
  async interrupt(sessionId:string) {
    this.session(sessionId);
    const active=this.active.get(sessionId);if(!active) return;
    active.stopped=true;await active.ready;await active.run?.interrupt();await active.done;
  }
  async saveDraft(sessionId:string,text:string) {this.session(sessionId).draft=text;this.publish();await this.save();}
  async diagnose(projectId:string) {const project=this.state.projects.find(p=>p.id===projectId);if(!project)throw new Error('PROJECT_NOT_FOUND');return Promise.all(this.options.adapters.map(a=>a.diagnose(project.cwd)));}
  async close() { this.closing=true;await Promise.all([...this.active.keys()].map(id=>this.interrupt(id)));await this.save(); }
}
