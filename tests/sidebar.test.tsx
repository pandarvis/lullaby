// @vitest-environment jsdom
import { afterEach,expect,test } from 'vitest';
import { cleanup,render,screen } from '@testing-library/react';
import { StateMark } from '../src/renderer/src/shell/StateMark';
afterEach(cleanup);
test('state marks are labelled and use a shape beyond colour for attention',()=>{
  const {container}=render(<><StateMark phase="waiting"/><StateMark phase="error"/><StateMark phase="running"/></>);
  expect(screen.getByRole('img',{name:'Attend votre réponse'}).querySelector('svg')).toBeTruthy();
  expect(screen.getByRole('img',{name:'Erreur'}).querySelector('svg')).toBeTruthy();
  expect(screen.getByRole('img',{name:'En cours'}).querySelector('svg')).toBeNull();
  expect(container.querySelectorAll('.state-mark')).toHaveLength(3);
});
