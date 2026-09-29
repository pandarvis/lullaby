import { expect, test } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readStore, writeStore } from '../src/main/storage/store';
const empty = {revision:0,projects:[],sessions:[],messages:{},pending:[]};
async function file() { return join(await mkdtemp(join(tmpdir(),'lullaby-store-')),'state.json'); }
test('serializes concurrent writes into complete JSON', async () => {
  const path = await file();
  await Promise.all([writeStore(path,empty),writeStore(path,{...empty,revision:1})]);
  expect(JSON.parse(await readFile(path,'utf8')).snapshot.revision).toBe(1);
});
test('missing store gives an empty workspace', async () => {
  expect(await readStore(await file())).toEqual(empty);
});
test('corrupted or newer stores are preserved and rejected', async () => {
  const path = await file();
  for (const data of ['{bad', JSON.stringify({schemaVersion:99,snapshot:empty})]) {
    await writeFile(path,data);
    await expect(readStore(path)).rejects.toThrow();
    expect(await readFile(path,'utf8')).toBe(data);
  }
});
test('interrupted write leaves the previous snapshot readable', async () => {
  const path = await file(); await writeStore(path,empty);
  await writeFile(path+'.uncommitted.tmp','{bad');
  expect(await readStore(path)).toEqual(empty);
});
test('wrong schema contents are rejected', async () => {
  const path = await file();
  await writeFile(path,JSON.stringify({schemaVersion:1,snapshot:{...empty,sessions:[{id:'s'}]}}));
  await expect(readStore(path)).rejects.toThrow();
});
