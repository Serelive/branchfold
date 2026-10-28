import { expect, it } from 'vitest';
import { deleteCell, expandToFirstUnchecked } from '../web/outlineOperations';
import type { TaskNode } from '../web/tree';
const n = (id: string, done = false, children: TaskNode[] = []): TaskNode => ({ id, title: id, done, children });
it('promotes children at the same position and preserves their subtrees and state', () => {
  const children = [n('one', true, [n('grandchild')]), n('two')];
  const original = [n('root', false, [n('before'), n('target', true, children), n('after')])];
  const result = deleteCell(original, 'target');
  expect(result[0].children.map(n => n.id)).toEqual(['before', 'one', 'two', 'after']);
  expect(result[0].children.slice(1, 3)).toEqual(children);
  expect(original[0].children[1].id).toBe('target');
});
it('folds preceding branches and reveals the first unchecked leaf and subsequent branches', () => {
  const root = n('root', false, [n('before', false, [n('done', true)]), n('path', true, [n('first')]), n('after', true, [n('later', true, [n('last', true)])])]);
  const collapsed = new Set(['root', 'path', 'after', 'later', 'outside']);
  expandToFirstUnchecked(root, collapsed);
  expect([...collapsed].sort()).toEqual(['before', 'outside']);
});
it('shows immediate children when every leaf is checked', () => {
  const collapsed = new Set(['root']);
  expandToFirstUnchecked(n('root', true, [n('child', true, [n('leaf', true)])]), collapsed);
  expect([...collapsed]).toEqual(['child']);
});
