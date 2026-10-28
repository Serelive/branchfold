// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Workspace from '../web/Workspace';
import { STORAGE_KEY } from '../web/storage';
import { parseForest, serializeForest } from '../web/tree';
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const mdFile = (source: string) => { const file = new File([source], 'plan.md', { type: 'text/markdown' }); file.arrayBuffer = async () => new TextEncoder().encode(source).buffer; return file; };
it('imports Markdown into the same editable tree with default visual modes and no context view', async () => {
  const user = userEvent.setup(); render(<Workspace />);
  for (const name of ['Directory guides', 'Ancestor titles', 'Leaf drawings']) expect(screen.getByRole('button', { name }).getAttribute('aria-pressed')).toBe('true');
  await user.upload(screen.getByLabelText('Markdown import'), mdFile('# Section\n\nNotes\n\n- [ ] Parent\n  - [x] Child\n'));
  await user.click(await screen.findByRole('button', { name: 'Import tree' }));
  expect(screen.getByDisplayValue('Parent')).toBeTruthy(); expect(screen.getByDisplayValue('Child')).toBeTruthy();
  expect(screen.queryByText('Section')).toBeNull(); expect(screen.queryByText('Detailed context')).toBeNull();
  await user.click(screen.getByDisplayValue('Parent')); await user.type(screen.getByDisplayValue('Parent'), ' edited');
  expect(parseForest(localStorage.getItem(STORAGE_KEY)!)[0].title).toBe('Parent edited');
  expect(screen.getByRole('button', { name: 'Export Markdown' })).toBeTruthy();
});
it('appends Markdown and JSON at the root, remaps IDs, and can undo or replace', async () => {
  const user = userEvent.setup();
  const original = [{ id: 'a', title: 'Existing', done: false, children: [] }];
  localStorage.setItem(STORAGE_KEY, serializeForest(original)); render(<Workspace />);
  await user.selectOptions(screen.getByLabelText('Import mode'), 'append');
  await user.upload(screen.getByLabelText('Markdown import'), mdFile('- [x] Added\n'));
  await user.click(await screen.findByText('Append tasks'));
  const json = new File([serializeForest(original)], 'backup.json', { type: 'application/json' }); json.text = async () => serializeForest(original);
  await user.upload(screen.getByLabelText('JSON backup'), json);
  await user.click(await screen.findByText('Append tasks'));
  const saved = parseForest(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.map(n => n.title)).toEqual(['Existing', 'Added', 'Existing']); expect(new Set(saved.map(n => n.id)).size).toBe(3);
  await user.click(screen.getByText('Undo'));
  expect(parseForest(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(2);
  await user.selectOptions(screen.getByLabelText('Import mode'), 'replace');
  await user.upload(screen.getByLabelText('Markdown import'), mdFile('- [ ] Replacement\n'));
  await user.click(await screen.findByRole('button', { name: 'Replace tree' }));
  expect(parseForest(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);
});
it('keeps existing data when import fails or is cancelled', async () => {
  const user = userEvent.setup(); localStorage.setItem(STORAGE_KEY, serializeForest([{ id: 'a', title: 'Keep', done: false, children: [] }]));
  const before = localStorage.getItem(STORAGE_KEY); render(<Workspace />);
  const bad = mdFile(''); bad.arrayBuffer = async () => new Uint8Array([255]).buffer;
  await user.upload(screen.getByLabelText('Markdown import'), bad);
  expect(await screen.findByRole('alert')).toBeTruthy(); expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  await user.upload(screen.getByLabelText('Markdown import'), mdFile('- [ ] Drop\n'));
  await user.click(await screen.findByText('Cancel import')); expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
});
