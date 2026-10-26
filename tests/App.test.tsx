// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../web/App';
import { STORAGE_KEY } from '../web/storage';

beforeEach(() => {
  localStorage.clear();
  document.elementFromPoint ??= () => null;
  HTMLElement.prototype.setPointerCapture ??= () => {};
  HTMLElement.prototype.hasPointerCapture ??= () => false;
  HTMLElement.prototype.releasePointerCapture ??= () => {};
});
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
  await longPress(user, screen.getByRole('button', { name: 'Node control Write draft' }));
  expect(screen.getByRole('button', { name: 'Node control Launch' }).getAttribute("aria-pressed")).toBe("false");
  view.unmount();
  render(<App />);
  expect(screen.getAllByRole('textbox').map(n => (n as HTMLInputElement).value)).toEqual(['Launch', 'Write draft']);
  const restored = screen.getByRole('button', { name: 'Node control Write draft' }) as HTMLInputElement;
  expect(restored.getAttribute("aria-pressed")).toBe("true");
  await longPress(user, restored);
  expect(restored.getAttribute("aria-pressed")).toBe("false");
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
  await user.click(screen.getByRole('button', { name: `Actions for ${title}` }));
}

it('moves by keyboard, preserves focus, and restores edits with undo and redo', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  const beta = screen.getByDisplayValue('Beta');
  await user.click(beta);
  await user.keyboard('{Escape}{Control>}{ArrowUp}{/Control}');
  expect(screen.getAllByRole('textbox').map(n => (n as HTMLInputElement).value)).toEqual(['Beta', 'Alpha', 'Child']);
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'Beta' }));
  await user.keyboard('{Control>}z{/Control}');
  expect(screen.getAllByRole('textbox').map(n => (n as HTMLInputElement).value)).toEqual(['Alpha', 'Child', 'Beta']);
  await user.click(screen.getByRole('button', { name: 'Redo' }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].id).toBe('b');
  await user.click(screen.getByDisplayValue('Alpha'));
  await user.keyboard('{Tab}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].children[0].id).toBe('a');
  await user.keyboard('{Shift>}{Tab}{/Shift}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes.map((n: { id: string }) => n.id)).toEqual(['b', 'a']);
});

it('collapses, focuses, reparents and recovers deleted subtrees through pointer controls', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  await fold(user, 'Alpha', false);
  expect(screen.queryByDisplayValue('Child')).toBeNull();
  await fold(user, 'Alpha', true);
  await actions(user, 'Alpha');
  await user.click(screen.getByRole('button', { name: 'Focus subtree Alpha' }));
  expect(screen.queryByDisplayValue('Beta')).toBeNull();
  expect(screen.getByRole('navigation', { name: 'Subtree navigation' }).textContent).toContain('Alpha');
  await user.click(screen.getByRole('button', { name: 'All tasks' }));
  await actions(user, 'Alpha');
  // The parent chooser must exclude the node and all descendants.
  const chooser = screen.getByRole('combobox', { name: 'Move Alpha into' });
  expect(Array.from((chooser as HTMLSelectElement).options).map(o => o.value)).not.toContain('node:c');
  await user.selectOptions(chooser, 'node:b');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].children[0].id).toBe('a');
  // Moving remounts this row under its new parent, closing its details menu.
  await actions(user, 'Alpha');
  await user.click(within(screen.getByRole('group', { name: 'Actions for Alpha' })).getByRole('button', { name: 'Delete subtree' }));
  expect(screen.getByRole('region', { name: 'Delete confirmation' }).textContent).toContain('1 descendants');
  await user.click(screen.getByRole('button', { name: 'Delete with descendants' }));
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
  await user.click(title); await user.clear(title); await user.type(title, 'Renamed objective');
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Redo' }));
  expect(screen.getByDisplayValue('Renamed objective')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  await longPress(user, screen.getByRole('button', { name: 'Node control Alpha' }));
  expect((screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement).disabled).toBe(true);
  view.unmount(); render(<App />);
  expect(screen.getByRole('button', { name: 'Node control Alpha' }).getAttribute("aria-pressed")).toBe("true");
  expect((screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(true);
});

it('keeps selection, editing and view independent and creates siblings after complete subtrees', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole('treeitem', { name: 'Alpha' }));
  expect((screen.getByDisplayValue('Alpha') as HTMLInputElement).readOnly).toBe(true);
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'Child' }));
  await user.keyboard('{ArrowLeft}{Enter}');
  expect(document.activeElement).toBe(screen.getByDisplayValue('Alpha'));
  await user.keyboard('{Enter}');
  expect(screen.getAllByRole('textbox').map(n => (n as HTMLInputElement).value)).toEqual(['Alpha', 'Child', '', 'Beta']);
  await user.keyboard('New sibling{Escape}');
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'New sibling' }));
  await user.keyboard('c');
  await user.keyboard('New child{Escape}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[1].children[0].title).toBe('New child');
});

it('ignores composition keys and normal text shortcuts, with explicit escape to navigation', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  const title = screen.getByDisplayValue('Alpha'); await user.click(title);
  fireEvent.compositionStart(title);
  for (const key of ['Enter', 'Tab', 'Escape', 'ArrowUp']) fireEvent.keyDown(title, { key, ctrlKey: key === 'ArrowUp', isComposing: true });
  fireEvent.compositionEnd(title);
  fireEvent.keyDown(title, { key: 'Enter', keyCode: 229 });
  expect(screen.getAllByRole('textbox')).toHaveLength(3);
  expect(document.activeElement).toBe(title);
  await user.keyboard('{Control>}{ArrowDown}{/Control}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].id).toBe('a');
  await user.keyboard('{Escape}{Control>}{ArrowDown}{/Control}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].id).toBe('b');
});

it('preserves subtree context and collapsed branches across outdent and undo', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole('button', { name: 'Focus subtree Alpha' }));
  await actions(user, 'Child');
  await user.click(within(screen.getByRole('group', { name: 'Actions for Child' })).getByRole('button', { name: 'Outdent' }));
  expect(screen.queryByDisplayValue('Beta')).toBeNull();
  expect(screen.queryByDisplayValue('Child')).toBeNull();
  expect(screen.getByRole('button', { name: 'Go to moved node' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByDisplayValue('Child')).toBeTruthy();
  expect(screen.queryByDisplayValue('Beta')).toBeNull();
  await fold(user, 'Alpha', false);
  await longPress(user, screen.getByRole('button', { name: 'Node control Alpha' }));
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.queryByDisplayValue('Child')).toBeNull();
});

it('imports into an empty forest without replacement wording and supports cancel and undo', async () => {
  const user = userEvent.setup(); render(<App />);
  const file = new File([serializeForest(fixture)], 'tasks.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => serializeForest(fixture) });
  await user.upload(screen.getByLabelText('JSON backup'), file);
  expect((await screen.findByRole('region', { name: 'Backup preview' })).textContent).not.toContain('replaced');
  expect(screen.queryByRole('button', { name: 'Replace tree' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Cancel import' }));
  expect(screen.queryByRole('textbox')).toBeNull();
  await user.upload(screen.getByLabelText('JSON backup'), file);
  await user.click(await screen.findByRole('button', { name: 'Import tree' }));
  expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.queryByRole('textbox')).toBeNull();
});

it('reorders from node-control focus and keeps a visible selection when collapsing its ancestor', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  await longPress(user, screen.getByRole('button', { name: 'Node control Beta' }));
  await user.keyboard('{Control>}{ArrowUp}{/Control}');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].id).toBe('b');
  await user.click(screen.getByRole('treeitem', { name: 'Child' }));
  await fold(user, 'Alpha', false);
  expect(screen.getByRole('treeitem', { name: 'Alpha' }).getAttribute('aria-selected')).toBe('true');
});

it('deletes an empty edited leaf with Backspace and restores it through undo/redo', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole('button', { name: /Add root task/ }));
  const empty = screen.getAllByRole('textbox').at(-1)!;
  const id = (empty as HTMLElement).dataset.nodeId;
  await user.keyboard('{Backspace}');
  expect(screen.getAllByRole('textbox')).toHaveLength(3);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes.some((n: { id: string }) => n.id === id)).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getAllByRole('textbox').at(-1)!.getAttribute('data-node-id')).toBe(id);
  await user.click(screen.getByRole('button', { name: 'Redo' }));
  expect(screen.getAllByRole('textbox')).toHaveLength(3);
});

it('safeguards empty parents, preserves children on cancel, and restores their subtree on undo', async () => {
  localStorage.setItem(STORAGE_KEY, serializeForest([{ ...fixture[0], title: '' }, fixture[1]]));
  const user = userEvent.setup(); render(<App />);
  await user.click(screen.getAllByRole('textbox')[0]); await user.keyboard('{Backspace}');
  expect(screen.getByRole('region', { name: 'Delete confirmation' }).textContent).toContain('1 descendants');
  await user.click(screen.getByRole('button', { name: 'Cancel deletion' }));
  expect(screen.getByDisplayValue('Child')).toBeTruthy();
  await user.click(screen.getAllByRole('textbox')[0]); await user.keyboard('{Backspace}');
  await user.click(screen.getByRole('button', { name: 'Delete with descendants' }));
  expect(screen.queryByDisplayValue('Child')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByRole('button', { name: 'Node control Child' }).getAttribute("aria-pressed")).toBe("true");
});

it('keeps ordinary Backspace and composition input separate from subtree deletion', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  const title = screen.getByDisplayValue('Beta'); await user.click(title);
  await user.keyboard('{End}{Backspace}');
  expect((title as HTMLInputElement).value).toBe('Bet');
  await user.clear(title);
  fireEvent.compositionStart(title);
  fireEvent.keyDown(title, { key: 'Backspace' });
  fireEvent.compositionEnd(title);
  fireEvent.keyDown(title, { key: 'Backspace', isComposing: true });
  fireEvent.keyDown(title, { key: 'Backspace', keyCode: 229 });
  expect(screen.getAllByRole('textbox')).toHaveLength(3);
  expect(screen.queryByRole('region', { name: 'Delete confirmation' })).toBeNull();
  await user.keyboard('{Backspace}');
  expect(screen.getAllByRole('textbox')).toHaveLength(2);
});

it('directly deletes a nonempty selected subtree with navigation Backspace and supports undo/redo', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole('treeitem', { name: 'Alpha' }));
  fireEvent.keyDown(document.activeElement!, { key: 'Backspace', isComposing: true });
  expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
  await user.keyboard('{Backspace}');
  expect(screen.queryByDisplayValue('Alpha')).toBeNull();
  expect(screen.queryByDisplayValue('Child')).toBeNull();
  expect(screen.queryByRole('region', { name: 'Delete confirmation' })).toBeNull();
  expect(screen.getByDisplayValue('Beta')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes).toEqual(fixture);
  await user.click(screen.getByRole('button', { name: 'Redo' }));
  expect(screen.queryByDisplayValue('Alpha')).toBeNull();
});

async function longPress(user: ReturnType<typeof userEvent.setup>, target: HTMLElement) {
  await user.pointer({ target, keys: '[MouseLeft>]' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 550)); });
  await user.pointer({ keys: '[/MouseLeft]' });
}

async function fold(user: ReturnType<typeof userEvent.setup>, title: string, expanded: boolean) {
  await user.click(screen.getByRole('button', { name: `Node control ${title}` }));
  await waitFor(() => expect(screen.getByRole('button', { name: `Node control ${title}` }).getAttribute('aria-expanded')).toBe(String(expanded)));
}

it('long-press checks and unchecks without folding, while clicks fold immediately', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  const control = screen.getByRole('button', { name: 'Node control Alpha' });
  for (const done of ['true', 'false']) {
    await user.pointer({ target: control, keys: '[MouseLeft>]' });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 550)); });
    expect(control.getAttribute('aria-pressed')).toBe(done);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].done).toBe(done !== 'true');
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
    expect(control.getAttribute('aria-pressed')).toBe(done);
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes[0].done).toBe(done === 'true');
    expect(control.getAttribute('aria-expanded')).toBe('true');
  }
  await user.click(control);
  expect(control.getAttribute('aria-expanded')).toBe('false');
  await user.dblClick(control);
  expect(control.getAttribute('aria-pressed')).toBe('false');
  await user.pointer({ target: control, keys: '[MouseLeft>]' });
  fireEvent.pointerCancel(control);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 550)); });
  expect(control.getAttribute('aria-pressed')).toBe('false');
});

it('cancels held completion into a drag without saving a completion or history step', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  const control = screen.getByRole('button', { name: 'Node control Alpha' });
  await user.pointer({ target: control, keys: '[MouseLeft>]', coords: { clientX: 20, clientY: 20 } });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 550)); });
  expect(control.getAttribute('aria-pressed')).toBe('true');
  // Even a small deliberate movement after the hold enters drag mode.
  await user.pointer({ target: control, coords: { clientX: 21, clientY: 20 } });
  expect(control.getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('treeitem', { name: 'Alpha' }).classList.contains('dragging')).toBe(true);
  await user.pointer({ keys: '[/MouseLeft]' });
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).nodes).toEqual(fixture);
  expect((screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(true);
});

it('reveals only one action tray and closes it with Escape', async () => {
  seed(); const user = userEvent.setup(); render(<App />);
  expect(screen.queryByRole('group', { name: 'Actions for Alpha' })).toBeNull();
  await actions(user, 'Alpha');
  expect(screen.getByRole('group', { name: 'Actions for Alpha' })).toBeTruthy();
  await actions(user, 'Beta');
  expect(screen.queryByRole('group', { name: 'Actions for Alpha' })).toBeNull();
  expect(screen.getByRole('group', { name: 'Actions for Beta' })).toBeTruthy();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('group', { name: 'Actions for Beta' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'Beta' }));
});
