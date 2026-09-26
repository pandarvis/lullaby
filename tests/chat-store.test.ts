import { expect, test } from 'vitest';
import { createSessionStore } from '../src/renderer/src/chat/sessionStore';
test('ignores old projections and keeps subscribers in sync',()=>{
  const initial={revision:2,projects:[],sessions:[],messages:{},pending:[]};const store=createSessionStore(initial);let updates=0;
  const unsubscribe=store.subscribe(()=>updates++);store.accept({...initial,revision:1});expect(store.getSnapshot().revision).toBe(2);
  store.accept({...initial,revision:3});expect(updates).toBe(1);unsubscribe();store.accept({...initial,revision:4});expect(updates).toBe(1);
});
