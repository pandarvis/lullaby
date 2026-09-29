import type { EventBody } from '../../../shared/contracts';
export class ClaudeMessages {
  private messageId='response';
  private hadText=false;
  private tools=new Map<string,{name:string;input:unknown}>();
  private thinking=new Map<number,string>();
  convert(message:unknown):EventBody[] {
    const m=message as any;
    const output:EventBody[]=[];
    if(m.type==='system'&&m.subtype==='init') output.push({kind:'bound',nativeId:m.session_id});
    if(m.type==='stream_event' && !m.parent_tool_use_id) {
      const event=m.event;
      if(event.type==='message_start') this.messageId=event.message.id;
      if(event.type==='content_block_start'&&event.content_block?.type==='thinking') {
        const id=`${this.messageId}:thinking:${event.index}`;this.thinking.set(event.index,id);
        output.push({kind:'action',itemId:id,label:'Réflexion',state:'running',detail:'Phase de réflexion signalée par Claude.'});
      }
      if(event.type==='content_block_stop'&&this.thinking.has(event.index)) {
        output.push({kind:'action',itemId:this.thinking.get(event.index)!,label:'Réflexion',state:'done',detail:'Phase de réflexion signalée par Claude.'});
        this.thinking.delete(event.index);
      }
      if(event.type==='content_block_delta'&&event.delta.type==='text_delta') {this.hadText=true;output.push({kind:'text',itemId:this.messageId,mode:'append',text:event.delta.text});}
    }
    if(m.type==='assistant') {
      const blocks=Array.isArray(m.message?.content)?m.message.content:[];
      const text=blocks.filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('\n');
      if(text) {this.hadText=true;output.push({kind:'text',itemId:m.message.id,mode:'replace',text});}
      for(const block of blocks) if(block.type==='tool_use') {
        this.tools.set(block.id,{name:block.name,input:block.input});
        output.push({kind:'action',itemId:block.id,label:block.name,state:'running',detail:JSON.stringify(block.input,null,2)});
      }
    }
    if(m.type==='user'&&Array.isArray(m.message?.content)) for(const block of m.message.content) if(block.type==='tool_result') {
      const tool=this.tools.get(block.tool_use_id);
      output.push({kind:'action',itemId:block.tool_use_id,label:tool?.name??'Outil',state:block.is_error?'error':'done',detail:tool?JSON.stringify({input:tool.input,result:block.content},null,2):typeof block.content==='string'?block.content:JSON.stringify(block.content,null,2)});
    }
    if(m.type==='result') {
      if(m.is_error || m.subtype!=='success') output.push({kind:'error',code:m.subtype,message:'Claude a arrêté ce tour avec une erreur. Vérifiez les quotas, la connexion et les autorisations.'});
      else {if(!this.hadText&&m.result)output.push({kind:'text',itemId:'result',mode:'replace',text:m.result});output.push({kind:'state',phase:'done'});}
    }
    if(m.type==='system'&&m.subtype==='compact_boundary') output.push({kind:'action',itemId:m.uuid??'compact',label:'Contexte compacté par Claude',state:'done',detail:'La continuité de la conversation est gérée par le moteur natif.'});
    return output;
  }
}
