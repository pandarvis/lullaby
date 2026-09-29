// @vitest-environment jsdom
import { afterEach,beforeEach,expect,test,vi } from 'vitest';
import { act,renderHook } from '@testing-library/react';
import { isBoolean,isFlags,isNumber,readStored,usePersistentState,writeStored } from '../src/renderer/src/shell/storage';
beforeEach(()=>localStorage.clear());
afterEach(()=>vi.restoreAllMocks());
test('reads valid JSON values and falls back on missing, invalid or unreadable data',()=>{
  expect(readStored('k',false,isBoolean)).toBe(false);
  localStorage.setItem('k','true');expect(readStored('k',false,isBoolean)).toBe(true);
  localStorage.setItem('k','compact');expect(readStored('k',false,isBoolean)).toBe(false);
  localStorage.setItem('k','"texte"');expect(readStored('k',false,isBoolean)).toBe(false);
  localStorage.setItem('n','512');expect(readStored('n',420,isNumber)).toBe(512);
  localStorage.setItem('f','{"a":true,"b":"x"}');expect(readStored('f',{},isFlags)).toEqual({});
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked');});
  expect(readStored('k',false,isBoolean)).toBe(false);
});
test('writes never throw',()=>{
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
  expect(()=>writeStored('k',true)).not.toThrow();
});
test('usePersistentState remembers values and accepts updater functions',()=>{
  const {result}=renderHook(()=>usePersistentState('flags',{} as Record<string,boolean>,isFlags));
  act(()=>result.current[1](previous=>({...previous,a:true})));
  expect(result.current[0]).toEqual({a:true});
  expect(localStorage.getItem('flags')).toBe('{"a":true}');
});
