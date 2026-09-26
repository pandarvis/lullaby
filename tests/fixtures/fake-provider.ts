import type { ProviderAdapter, ProviderRun } from '../../src/main/providers/types';
import type { EventBody } from '../../src/shared/contracts';
export class FakeProvider implements ProviderAdapter {
  provider = 'claude' as const;
  runs: ProviderRun[] = [];
  replies: string[] = [];
  async diagnose() { return {provider:this.provider,available:true,auth:'subscription' as const,issues:[],skills:[]}; }
  async run(): Promise<ProviderRun> {
    const queue: {eventId:string;body:EventBody}[] = [];
    let wake: (()=>void)|undefined, ended = false;
    const run: ProviderRun = {
      events: {async *[Symbol.asyncIterator]() { while(!ended || queue.length) { if(queue.length) yield queue.shift()!; else await new Promise<void>(resolve=>{wake=resolve;}); } }},
      reply:async requestId=>{this.replies.push(requestId);},
      interrupt:async()=>{ended=true;wake?.();}, close:async()=>{ended=true;wake?.();},
    };
    Object.assign(run,{emit:(body:EventBody,eventId=String(Math.random()))=>{queue.push({eventId,body});wake?.();},end:()=>{ended=true;wake?.();}});
    this.runs.push(run); return run;
  }
  emit(body:EventBody,eventId?:string) { (this.runs.at(-1) as ProviderRun & {emit(body:EventBody,id?:string):void}).emit(body,eventId); }
}
