// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../web/App';
import { STORAGE_KEY } from '../web/storage';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('creates, renames, completes, restores and reopens a nested tree', async () => {
  const user = userEvent.setup();
  const view = render(<App />);
  await user.click(screen.getByRole('button', { name: /Add root task/ }));
  const root = screen.getByRole('textbox', { name: 'Task title' });
  expect(document.activeElement).toBe(root);
  await user.type(root, 'Launch');
  await user.click(screen.getByRole('button', { name: 'Add child to Launch' }));
  const child = screen.getAllByRole('textbox', { name: 'Task title' })[1];
  expect(document.activeElement).toBe(child);
  await user.type(child, 'Draft');
  await user.clear(child);
  await user.type(child, 'Write draft');
  await user.click(screen.getByRole('checkbox', { name: 'Complete Write draft' }));
  expect((screen.getByRole('checkbox', { name: 'Complete Launch' }) as HTMLInputElement).checked).toBe(false);
  view.unmount();
  render(<App />);
  expect(screen.getAllByRole('textbox').map(n => (n as HTMLInputElement).value)).toEqual(['Launch', 'Write draft']);
  const restored = screen.getByRole('checkbox', { name: 'Complete Write draft' }) as HTMLInputElement;
  expect(restored.checked).toBe(true);
  await user.click(restored);
  expect(restored.checked).toBe(false);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].children[0].done).toBe(false);
});

it('protects unreadable saved data from overwrites', () => {
  localStorage.setItem(STORAGE_KEY, 'unreadable');
  render(<App />);
  expect(screen.getByRole('alert').textContent).toContain('could not be opened');
  expect(screen.queryByRole('button', { name: /Add root task/ })).toBeNull();
  expect(localStorage.getItem(STORAGE_KEY)).toBe('unreadable');
});

it('retains editing and offers export when saving fails', async () => {
  const user = userEvent.setup();
  render(<App />);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  await user.click(screen.getByRole('button', { name: /Add root task/ }));
  await user.type(screen.getByRole('textbox'), 'Keep this');
  expect(screen.getByRole('status').textContent).toContain('only in memory');
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Keep this');
  expect(screen.getByRole('button', { name: 'Export JSON' })).toBeTruthy();
});
