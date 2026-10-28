// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const { postMessage } = vi.hoisted(() => ({ postMessage: vi.fn() }));
vi.mock('../web/documentHost', () => ({ documentHost: { postMessage } }));
import Workspace from '../web/Workspace';
import { STORAGE_KEY } from '../web/storage';
import { parseForest } from '../web/tree';
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function snapshot(source: string, version: number) {
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'snapshot', document: { source, version, name: 'plan.md', dirty: false } } })); });
}
const saves = () => postMessage.mock.calls.map(([request]) => request).filter(r => r.type === 'save');
it('uses the shared editor, stages basic operations and saves only on request', async () => {
  const user = userEvent.setup(); render(<Workspace />); snapshot('# Plan\n- [ ] Original\n', 1);
  await user.click(screen.getByDisplayValue('Original')); await user.type(screen.getByDisplayValue('Original'), ' edited');
  await user.keyboard('{Enter}Child{Tab}{Escape}');
  expect(screen.getByDisplayValue('Child')).toBeTruthy();
  expect(saves()).toHaveLength(0); expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  await user.click(screen.getByText('Save document'));
  const request = saves()[0];
  const tree = parseForest(request.tree);
  expect(tree[0].title).toBe('Original edited'); expect(tree[0].children[0].title).toBe('Child');
  expect(request.source).toBe('# Plan\n- [ ] Original\n'); expect(request.version).toBe(1);
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'saveResult', requestId: request.requestId, ok: true, message: 'Saved', document: { source: '- [ ] Original edited\n  - [ ] Child\n', version: 2, dirty: false, name: 'plan.md' } } })); });
  expect(screen.queryByText('Unsaved tree changes')).toBeNull();
  await user.click(screen.getByText('Undo')); expect(screen.getByText('Unsaved tree changes')).toBeTruthy();
});
it('automatically refreshes clean trees but retains unsaved edits on external conflict', async () => {
  const user = userEvent.setup(); render(<Workspace />); snapshot('- [ ] First\n', 1); snapshot('- [ ] External\n', 2);
  expect(screen.getByDisplayValue('External')).toBeTruthy();
  await user.click(screen.getByDisplayValue('External')); await user.type(screen.getByDisplayValue('External'), ' local');
  snapshot('- [ ] Newer\n', 3);
  expect(screen.getByDisplayValue('External local')).toBeTruthy(); expect((screen.getByText('Save document') as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByText('Reload source')); await user.click(screen.getByText('Keep editing')); expect(screen.getByDisplayValue('External local')).toBeTruthy();
  await user.click(screen.getByText('Reload source')); await user.click(screen.getByText('Discard edits and reload'));
  expect(screen.getByDisplayValue('Newer')).toBeTruthy(); expect(saves()).toHaveLength(0);
});
it('keeps edits after save failure and exports the working tree through the host', async () => {
  const user = userEvent.setup(); render(<Workspace />); snapshot('- [ ] A\n', 1);
  await user.click(screen.getByDisplayValue('A')); await user.type(screen.getByDisplayValue('A'), 'B');
  await user.keyboard('{Control>}s{/Control}'); const request = saves()[0];
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'saveResult', requestId: request.requestId, ok: false, message: 'Permission denied', document: { source: '- [ ] A\n', version: 1, dirty: false, name: 'plan.md' } } })); });
  expect(screen.getByDisplayValue('AB')).toBeTruthy();
  await user.click(screen.getByText('Export Markdown'));
  expect(postMessage.mock.calls.at(-1)?.[0]).toMatchObject({ type: 'export', format: 'md' });
});

it('restores recovery drafts and rebases restarted editor versions only for identical source', async () => {
  const user = userEvent.setup(); render(<Workspace />);
  const tree = JSON.stringify({ version: 1, nodes: [{ id: 'draft', title: 'Recovered', done: false, children: [] }] });
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'restoreDraft', document: { source: '- [ ] Original\n', version: 90, name: 'plan.md', dirty: false }, tree } })); });
  snapshot('- [ ] Original\n', 1);
  expect(screen.getByDisplayValue('Recovered')).toBeTruthy();
  await user.click(screen.getByText('Save document'));
  expect(saves()[0].version).toBe(1);
  expect(parseForest(saves()[0].tree)[0].title).toBe('Recovered');
});
