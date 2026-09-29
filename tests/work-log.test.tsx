// @vitest-environment jsdom
import { afterEach,expect,test } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { workLog,WorkLog } from '../src/renderer/src/chat/WorkLog';
import type { ChatItem } from '../src/shared/contracts';
afterEach(cleanup);
type Action=ChatItem['actions'][number];
const act=(id:string,label:string,input:Record<string,unknown>,state:Action['state']='done'):Action=>({id,label,state,detail:JSON.stringify({input})});
const actions:Action[]=[
  act('t1','Réflexion',{}),
  act('c1','PowerShell',{command:'dotnet restore 2>&1 | Select-Object -Last 5'},'error'),
  act('e1','Write',{file_path:'C:\\Sources\\test\\App\\AppSettings.cs'}),
  act('e2','Edit',{file_path:'C:\\Sources\\test\\App\\TokenProvider.cs'}),
  act('e3','Edit',{file_path:'C:\\Sources\\test\\App\\AppSettings.cs'}),
  act('r1','Read',{file_path:'C:\\Sources\\test\\App\\Program.cs'}),
  act('c2','Bash',{command:'dotnet build'}),
];
test('the log hides thinking, groups consecutive edits and names each target briefly',()=>{
  const log=workLog(actions);
  expect(log.rows.map(row=>[row.verb,row.targets.join(', ')])).toEqual([
    ['Commande','dotnet restore 2>&1 | Select-Object -Last 5'],['Modifié 2 fichiers','AppSettings.cs, TokenProvider.cs'],['Lu','Program.cs'],['Commande','dotnet build']]);
  expect(log.rows[0].state).toBe('error');expect(log.rows[1].titles[0]).toBe('C:\\Sources\\test\\App\\AppSettings.cs');
  expect(log.summary).toEqual({actions:6,files:2,commands:2,errors:1});
});
test('a finished turn folds into one line; a live turn shows its rows',()=>{
  const view=render(<WorkLog actions={actions} live={false}/>);
  const summary=screen.getByText(/Travail · 6 actions/);expect(summary.closest('summary')!.textContent).toContain('2 fichiers modifiés, 2 commandes');
  expect(screen.getByText('1 à vérifier')).toBeTruthy();expect((view.container.querySelector('.work-summary') as HTMLDetailsElement).open).toBe(false);
  fireEvent.click(summary);expect(screen.getByText('Modifié 2 fichiers')).toBeTruthy();
  view.unmount();render(<WorkLog actions={actions} live/>);
  expect(screen.queryByText(/Travail ·/)).toBeNull();expect(screen.getByText('Lu')).toBeTruthy();
});
