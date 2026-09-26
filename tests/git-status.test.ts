import { expect,test } from 'vitest';
import { parseStatus } from '../src/main/git/parse-status';
test('preserves NUL rename paths, spaces, accents and option-like names',()=>{
  expect(parseStatus(Buffer.from('R  docs/nouveau été.md\0docs/ancien nom.md\0?? -note.md\0'))).toEqual(expect.arrayContaining([
    expect.objectContaining({path:'docs/nouveau été.md',oldPath:'docs/ancien nom.md',area:'index'}),
    expect.objectContaining({path:'-note.md',area:'untracked'}),
  ]));
});
test('keeps both index/worktree versions and groups conflicts only once',()=>{
  const changes=parseStatus(Buffer.from('MM src/a.ts\0UU conflict.txt\0 D removed.txt\0'));
  expect(changes.filter(c=>c.path==='src/a.ts').map(c=>c.area)).toEqual(['index','worktree']);
  expect(changes.filter(c=>c.path==='conflict.txt')).toHaveLength(1);
  expect(changes.find(c=>c.path==='conflict.txt')?.area).toBe('conflict');
  expect(new Set(changes.map(c=>c.id)).size).toBe(changes.length);
});
