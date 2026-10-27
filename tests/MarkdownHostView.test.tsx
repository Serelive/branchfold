// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const { postMessage } = vi.hoisted(() => ({ postMessage: vi.fn() }));
vi.mock('../web/documentHost', () => ({ documentHost: { postMessage } }));
import MarkdownView from '../web/MarkdownView';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function snapshot(source: string, version: number) {
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'snapshot', document: { source, version, name: 'plan.md', dirty: false } } })); });
}
it('retains a stale draft, submits its original revision and shows host conflict feedback', async () => {
  const user = userEvent.setup(); render(<MarkdownView />);
  expect(postMessage).toHaveBeenCalledWith({ type: 'ready' });
  snapshot('- [ ] Original\n', 1);
  await user.click(screen.getByText('Rename'));
  await user.clear(screen.getByLabelText('Task Markdown title'));
  await user.type(screen.getByLabelText('Task Markdown title'), 'My draft');
  snapshot('- [ ] External\n', 2);
  expect(screen.getByRole('alert').textContent).toContain('document changed');
  await user.click(screen.getByText('Apply rename'));
  expect(postMessage).toHaveBeenLastCalledWith({ type: 'rename', id: 'task-0', title: 'My draft', source: '- [ ] Original\n', version: 1 });
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'result', operation: 'rename', ok: false, message: 'Conflict: document changed.' } })); });
  expect(screen.getByDisplayValue('My draft')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('Conflict');
});
it('guards composition Enter, cancels with Escape and preserves a draft when saving unrelated source', async () => {
  const user = userEvent.setup(); render(<MarkdownView />); snapshot('- [ ] Original\n', 1);
  await user.click(screen.getByText('Rename'));
  const input = screen.getByLabelText('Task Markdown title');
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
  expect(postMessage.mock.calls.filter(([request]) => request.type === 'rename')).toHaveLength(0);
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'result', operation: 'save', ok: true, message: 'Saved' } })); });
  expect(screen.getByLabelText('Task Markdown title')).toBeTruthy();
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.queryByLabelText('Task Markdown title')).toBeNull();
});
