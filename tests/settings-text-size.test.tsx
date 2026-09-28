// @vitest-environment jsdom
import { afterEach,beforeEach,expect,test,vi } from 'vitest';
import { cleanup,render,screen } from '@testing-library/react';
import { SettingsScreen } from '../src/renderer/src/settings/SettingsScreen';
beforeEach(()=>{localStorage.clear();window.lullaby={engineSettings:async()=>({ok:true,value:{}})} as any;});
afterEach(cleanup);
const open=()=>{render(<SettingsScreen items={[]} loading={false} onRefresh={vi.fn()} onClose={vi.fn()}/>);screen.getByRole('button',{name:/Apparence/}).click();};
test.each([[null,'14'],['15','14'],['17','16'],['13','13']])('stored text size %s shows %s',async(stored,expected)=>{
  if(stored)localStorage.setItem('lullaby.text-size',stored);open();
  expect((await screen.findByLabelText('Taille du texte des conversations') as HTMLSelectElement).value).toBe(expected);
});
