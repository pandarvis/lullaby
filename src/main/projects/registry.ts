import { realpath, stat } from 'node:fs/promises';
export async function canonicalizeFolder(path: string): Promise<{cwd:string;folderKey:string}> {
  const cwd = await realpath(path);
  if (!(await stat(cwd)).isDirectory()) throw new Error('NOT_A_DIRECTORY');
  return {cwd,folderKey:process.platform === 'win32' ? cwd.toLowerCase() : cwd};
}
