import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import type { Snapshot, Session, Provider, PromptRequest, ReplyRequest, LaunchChoices } from '../../shared/contracts';
import type { ProviderAdapter, ProviderRun } from '../providers/types';
import { canonicalizeFolder } from '../projects/registry';
import { emptySnapshot } from '../storage/store';
import { applyEvent } from './projection';
import type { ReviewCapture,ReviewSource } from '../review/capture';
import type { Phase,TurnReview } from '../../shared/contracts';
type Active = {id:string;folderKey:string;run?:ProviderRun;review?:ReviewCapture;done?:Promise<void>;ready:Promise<void>;started:()=>void;stopped:boolean;seen:Set<string>;replying:Set<string>};
type Options = {adapters:ProviderAdapter[];reviews?:ReviewSource;initial?:Snapshot;persist?:(s:Snapshot)=>Promise<void>;onChange?:(s:Snapshot)=>void;envFor?:(provider:Provider)=>NodeJS.ProcessEnv};
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
  async createSession(projectId:string,provider:Provider,nativeId?:string) {
    if(!this.state.projects.some(p=>p.id===projectId)) throw new Error('PROJECT_NOT_FOUND');
    const session:Session = {id:randomUUID(),projectId,provider,title:'Nouvelle conversation',phase:'idle',draft:'',choices:{}};
    if(nativeId){
      if(this.state.sessions.some(s=>s.provider===provider&&s.nativeId===nativeId))throw new Error('SESSION_ALREADY_IMPORTED');
      session.nativeId=nativeId;session.title='Session reprise';
    }
    this.state.sessions.push(session);this.state.messages[session.id]=[];this.publish();await this.save(); return structuredClone(session);
  }
  async renameProject(projectId:string,name:string){
    const project=this.state.projects.find(p=>p.id===projectId);if(!project)throw new Error('PROJECT_NOT_FOUND');
    if(!name.trim()||name.trim().length>120)throw new Error('INVALID_PROJECT_NAME');
    project.name=name.trim();this.publish();await this.save();
  }
  async removeProject(projectId:string){
    const project=this.state.projects.find(p=>p.id===projectId);if(!project)throw new Error('PROJECT_NOT_FOUND');
    if(this.folders.has(project.folderKey))throw new Error('FOLDER_BUSY');
    const removed=new Set(this.state.sessions.filter(s=>s.projectId===projectId).map(s=>s.id));
    this.state.projects=this.state.projects.filter(p=>p.id!==projectId);
    this.state.sessions=this.state.sessions.filter(s=>!removed.has(s.id));
    this.state.pending=this.state.pending.filter(e=>!removed.has(e.sessionId));
    for(const id of removed)this.state.messages[id]&&delete this.state.messages[id];
    this.publish();await this.save();
  }
  async configureSession(sessionId:string,choices:LaunchChoices){
    if(this.active.has(sessionId))throw new Error('SESSION_RUNNING');this.session(sessionId).choices=structuredClone(choices);this.publish();await this.save();
  }
  async removeSession(sessionId:string){
    this.session(sessionId);
    // The reservation exists before asynchronous launch, including before phase=running.
    if(this.active.has(sessionId))throw new Error('SESSION_RUNNING');
    this.state.sessions=this.state.sessions.filter(session=>session.id!==sessionId);
    delete this.state.messages[sessionId];
    this.state.pending=this.state.pending.filter(event=>event.sessionId!==sessionId);
    this.publish();await this.save();
  }
  async send(input:PromptRequest): Promise<{runId:string}> {
    if(this.closing) throw new Error('CLOSING');
    let session=this.session(input.sessionId);
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
      // Another session may replace the snapshot while the folder is resolving.
      session=this.session(input.sessionId);
      session.phase='running';session.draft='';
      if(session.title==='Nouvelle conversation') session.title=input.text.slice(0,72);
      this.state.messages[session.id].push({id:randomUUID(),role:'user',text:input.text,actions:[]});this.publish();await this.save();
      try{active.review=await this.options.reviews?.begin(project.cwd);}catch{active.review={finish:async runId=>({runId,capturedAt:new Date().toISOString(),files:[],partial:true,notice:'Le relevé initial a échoué ; récapitulatif indisponible.'})};}
      active.run = await adapter.run({cwd:project.cwd,nativeId:session.nativeId,text:input.text,choices:session.choices,env:this.options.envFor?.(session.provider)??{...process.env}});
      active.done=this.consume(session.id,active);
      active.started();
      if(active.stopped) await active.run.interrupt();
      return {runId:active.id};
    } catch(error) {
      active.started();this.session(session.id).phase='error';this.active.delete(session.id);this.folders.delete(project.folderKey);this.publish();await this.save();throw error;
    }
  }
  private async consume(sessionId:string,active:Active) {
    let finalPhase:Phase='done';
    try {
      for await(const event of active.run!.events) {
        if(this.active.get(sessionId)!==active || active.seen.has(event.eventId)) continue;
        // Preserve the native ID even when cancellation races with startup.
        if(active.stopped && event.body.kind!=='bound') continue;
        active.seen.add(event.eventId);
        if(active.review&&event.body.kind==='state'&&['done','error','interrupted'].includes(event.body.phase)){finalPhase=event.body.phase;continue;}
        this.state=applyEvent(this.state,{...event,sessionId,runId:active.id});this.publish();
        if(event.body.kind==='text') this.scheduleSave();else await this.save();
      }
      const session=this.session(sessionId);
      if(active.stopped)finalPhase='interrupted';else if(session.phase==='error'||session.phase==='interrupted')finalPhase=session.phase;
    } catch {
      finalPhase=active.stopped?'interrupted':'error';
      if(!active.stopped) this.state.messages[sessionId].push({id:randomUUID(),role:'assistant',text:'Le moteur a interrompu la réponse. Consultez son diagnostic avant de reprendre.',actions:[]});
    } finally {
      try { await active.run?.close(); }
      finally {
        if(active.review){
          let review:TurnReview;
          try{review=await active.review.finish(active.id);}catch{review={runId:active.id,capturedAt:new Date().toISOString(),files:[],partial:true,notice:'Le relevé final a échoué ; récapitulatif indisponible.'};}
          if(review.files.length||review.notice)this.state.messages[sessionId].push({id:`${active.id}:review`,role:'assistant',text:'',actions:[],review});
        }
        this.session(sessionId).phase=active.stopped?'interrupted':finalPhase;
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
      this.state.pending=this.state.pending.filter(e=>!(e.sessionId===input.sessionId && e.runId===input.runId && e.body.kind==='request' && e.body.requestId===input.requestId));
      if(this.active.get(input.sessionId)===active && !active.stopped) this.session(input.sessionId).phase=this.state.pending.some(e=>e.sessionId===input.sessionId)?'waiting':'running';
      this.publish();await this.save();
    } finally {active.replying.delete(input.requestId);}
  }
  async interrupt(sessionId:string) {
    this.session(sessionId);
    const active=this.active.get(sessionId);if(!active) return;
    active.stopped=true;await active.ready;await active.run?.interrupt();await active.done;
  }
  async saveDraft(sessionId:string,text:string) {this.session(sessionId).draft=text;this.publish();await this.save();}
  async diagnose(projectId:string) {const project=this.state.projects.find(p=>p.id===projectId);if(!project)throw new Error('PROJECT_NOT_FOUND');return Promise.all(this.options.adapters.map(a=>a.diagnose(project.cwd,this.options.envFor?.(a.provider))));}
  async close() { this.closing=true;await Promise.all([...this.active.keys()].map(id=>this.interrupt(id)));await Promise.all(this.options.adapters.map(a=>a.dispose?.().catch(()=>{})));await this.save(); }
}
