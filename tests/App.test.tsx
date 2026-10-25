// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
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

import { serializeForest } from '../web/tree';
const fixture = [
  { id: 'a', title: 'Alpha', done: false, children: [{ id: 'c', title: 'Child', done: true, children: [] }] },
  { id: 'b', title: 'Beta', done: false, children: [] },
];
function seed() { localStorage.setItem(STORAGE_KEY, serializeForest(fixture)); }
async function actions(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByLabelText(`Actions for ${title}`));
}

it('moves by keyboard, preserves focus, and restores edits with undo and redo', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  const beta = screen.getByDisplayValue('Beta');
  await user.click(beta);
  await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
  expect(screen.getAllByRole('textbox').map(n => (n as HTMLInputElement).value)).toEqual(['Beta', 'Alpha', 'Child']);
  expect(document.activeElement).toBe(screen.getByDisplayValue('Beta'));
  await user.keyboard('{Control>}z{/Control}');
  expect(screen.getAllByRole('textbox').map(n => (n as HTMLInputElement).value)).toEqual(['Alpha', 'Child', 'Beta']);
  await user.click(screen.getByRole('button', { name: 'Redo' }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].id).toBe('b');
  await user.click(screen.getByDisplayValue('Alpha'));
  await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].children[0].id).toBe('a');
  await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes.map((n: { id: string }) => n.id)).toEqual(['b', 'a']);
});

it('collapses, focuses, reparents and recovers deleted subtrees through pointer controls', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole('button', { name: 'Collapse Alpha' }));
  expect(screen.queryByDisplayValue('Child')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Expand Alpha' }));
  await actions(user, 'Alpha');
  await user.click(within(screen.getByLabelText('Actions for Alpha').parentElement!).getByRole('button', { name: 'Focus subtree' }));
  expect(screen.queryByDisplayValue('Beta')).toBeNull();
  expect(screen.getByRole('navigation', { name: 'Subtree navigation' }).textContent).toContain('Alpha');
  await user.click(screen.getByRole('button', { name: 'All tasks' }));
  // The parent chooser must exclude the node and all descendants.
  const chooser = screen.getByRole('combobox', { name: 'Move Alpha into' });
  expect(Array.from((chooser as HTMLSelectElement).options).map(o => o.value)).not.toContain('node:c');
  await user.selectOptions(chooser, 'node:b');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].children[0].id).toBe('a');
  // Moving remounts this row under its new parent, closing its details menu.
  await actions(user, 'Alpha');
  await user.click(within(screen.getByLabelText('Actions for Alpha').parentElement!).getByRole('button', { name: 'Delete subtree' }));
  expect(screen.queryByDisplayValue('Alpha')).toBeNull();
  expect(screen.queryByDisplayValue('Child')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByDisplayValue('Child')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].children[0].children[0].done).toBe(true);
});

it('validates and previews backups, cancels safely, imports only on confirmation and supports undo', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  const input = screen.getByLabelText('JSON backup');
  function backup(text: string) {
    const file = new File([text], 'backup.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => text });
    return file;
  }
  await user.upload(input, backup('broken'));
  expect((await screen.findByRole('alert')).textContent).toContain('Backup not imported');
  expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
  const replacement = serializeForest([{ id: 'x"[]', title: 'Imported', done: false, children: [] }]);
  await user.upload(input, backup(replacement));
  expect(await screen.findByRole('region', { name: 'Backup preview' })).toBeTruthy();
  expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Cancel import' }));
  expect(screen.queryByRole('region', { name: 'Backup preview' })).toBeNull();
  await user.upload(input, backup(replacement));
  await user.click(await screen.findByRole('button', { name: 'Replace tree' }));
  expect(screen.getByDisplayValue('Imported')).toBeTruthy();
  expect(screen.queryByDisplayValue('Alpha')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes).toEqual(fixture);
});

it('groups title editing for undo, clears redo on a new edit, and persists the result on remount', async () => {
  seed(); const user = userEvent.setup(); const view = render(<App />);
  const title = screen.getByDisplayValue('Alpha');
  await user.clear(title); await user.type(title, 'Renamed objective');
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Redo' }));
  expect(screen.getByDisplayValue('Renamed objective')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  await user.click(screen.getByRole('checkbox', { name: 'Complete Alpha' }));
  expect((screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement).disabled).toBe(true);
  view.unmount(); render(<App />);
  expect((screen.getByRole('checkbox', { name: 'Complete Alpha' }) as HTMLInputElement).checked).toBe(true);
  expect((screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(true);
});
