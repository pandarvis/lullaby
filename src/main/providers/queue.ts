export class AsyncQueue<T> implements AsyncIterable<T> {
  private values:T[]=[];
  private waiters:(()=>void)[]=[];
  private ended=false;
  push(value:T) {if(!this.ended){this.values.push(value);this.wake();}}
  end() {this.ended=true;this.wake();}
  private wake(){for(const resolve of this.waiters.splice(0))resolve();}
  async *[Symbol.asyncIterator]() {while(!this.ended||this.values.length){if(this.values.length)yield this.values.shift()!;else await new Promise<void>(resolve=>this.waiters.push(resolve));}}
}
