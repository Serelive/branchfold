// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../web/App';
import { PREFERENCES_KEY } from '../web/preferences';
import { STORAGE_KEY } from '../web/storage';
import { serializeForest } from '../web/tree';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const nodes = [{ id: 'a', title: 'Settings 设置 {title}', done: false, children: [] }];

it.each(['website', 'extension'])('keeps the panel closed, localizes UI and remembers appearance without changing tasks in %s', async mode => {
  localStorage.setItem(STORAGE_KEY, serializeForest(nodes));
  const before = localStorage.getItem(STORAGE_KEY), user = userEvent.setup(), onChange = vi.fn();
  const host = mode === 'extension' ? { initialForest: nodes, onChange, onSave: vi.fn(), onExport: vi.fn(), status: '', toolbar: null } : undefined;
  const view = render(<App document={host} />);
  expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('button', { name: 'Directory guides' })).toBeNull();
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(document.documentElement.lang).toBe('en');
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  const panel = screen.getByRole('complementary', { name: 'Settings' });
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close settings' }));
  for (const name of ['Directory guides', 'Ancestor titles', 'Unchecked branch bars', 'Expanded branch bars', 'Leaf drawings']) expect(within(panel).getByRole('button', { name }).getAttribute('aria-pressed')).toBe('true');
  expect((screen.getByRole('checkbox', { name: 'Dark mode' }) as HTMLInputElement).checked).toBe(false);
  await user.click(screen.getByRole('checkbox', { name: 'Dark mode' }));
  await user.click(screen.getByRole('checkbox', { name: 'Chinese mode' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.lang).toBe('zh-CN');
  expect(screen.getByRole('heading', { name: '你的任务树' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '目录引导线' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByDisplayValue(nodes[0].title)).toBeTruthy();
  expect(screen.getByRole('button', { name: `在“${nodes[0].title}”后添加同级任务` })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('button', { name: '关闭设置' }), { key: 'Escape', isComposing: true });
  expect(screen.getByRole('button', { name: '设置' }).getAttribute('aria-expanded')).toBe('true');
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: '设置' }).getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '设置' }));
  expect(localStorage.getItem(STORAGE_KEY)).toBe(before); expect(onChange).not.toHaveBeenCalled();
  view.unmount(); render(<App document={host} />);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.getByRole('button', { name: '设置' }).getAttribute('aria-expanded')).toBe('false');
  await user.click(screen.getByRole('button', { name: '设置' }));
  await user.click(screen.getByRole('checkbox', { name: '中文模式' }));
  await user.click(screen.getByRole('checkbox', { name: 'Dark mode' }));
  expect(document.documentElement.dataset.theme).toBe('light'); expect(document.documentElement.lang).toBe('en');
  await user.click(screen.getByRole('heading', { name: 'Your task tree' }));
  expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('aria-expanded')).toBe('false');
});

it('falls back from invalid preferences and keeps settings usable when storage fails', async () => {
  localStorage.setItem(PREFERENCES_KEY, 'broken');
  localStorage.setItem(STORAGE_KEY, serializeForest(nodes));
  const user = userEvent.setup(); render(<App />);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  await user.click(screen.getByRole('checkbox', { name: 'Dark mode' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.getByDisplayValue(nodes[0].title)).toBeTruthy();
});
