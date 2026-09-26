import { expect, test } from 'vitest';
import { validateSend, validateReply } from '../src/main/ipc/validation';
test('accepts a bounded text request', () => {
  expect(validateSend({sessionId:'s1',text:'Bonjour'})).toEqual({sessionId:'s1',text:'Bonjour'});
});
test('rejects a command in place of a message', () => {
  expect(() => validateSend({sessionId:'s1',command:'whoami'})).toThrow();
});
test('rejects empty, oversized or unexpected fields', () => {
  for (const value of [null, {sessionId:'s1',text:''}, {sessionId:'s1',text:'a'.repeat(200001)}, {sessionId:'s1',text:'ok',cwd:'C:/'}]) {
    expect(() => validateSend(value)).toThrow();
  }
});
test('approval response needs all routing keys and an explicit answer', () => {
  expect(() => validateReply({sessionId:'s1',answer:{kind:'allow'}})).toThrow();
  expect(validateReply({sessionId:'s1',runId:'r1',requestId:'q1',answer:{kind:'deny'}}).answer.kind).toBe('deny');
});
