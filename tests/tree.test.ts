import { describe, expect, it } from 'vitest';
import { addNode, updateNode, parseForest, serializeForest } from '../web/tree';
import { loadForest, saveForest, STORAGE_KEY } from '../web/storage';

describe('task tree', () => {
  it('preserves IDs, sibling order and hierarchy without mutating the input', () => {
    const original = addNode([], null, 'root');
    const next = addNode(addNode(original, 'root', 'first'), 'root', 'second');
    expect(original[0].children).toEqual([]);
    expect(next[0].children.map(n => n.id)).toEqual(['first', 'second']);
    const renamed = updateNode(next, 'first', n => ({ ...n, title: 'Research' }));
    expect(renamed[0].children[0].title).toBe('Research');
    expect(next[0].children[0].title).toBe('');
    expect(parseForest(serializeForest(renamed))).toEqual(renamed);
  });
  it('completes and reopens nodes independently of parents and children', () => {
    const forest = addNode(addNode([], null, 'root'), 'root', 'child');
    const completed = updateNode(forest, 'child', n => ({ ...n, done: true }));
    expect(completed[0].done).toBe(false);
    expect(completed[0].children[0].done).toBe(true);
    expect(updateNode(completed, 'child', n => ({ ...n, done: false }))).toEqual(forest);
    expect(updateNode(forest, 'root', n => ({ ...n, done: true }))[0].children[0].done).toBe(false);
  });
  it('rejects malformed, unsupported, and duplicate-ID data', () => {
    for (const raw of ['{', '{"version":2,"nodes":[]}', '{"version":1,"nodes":[{}]}',
      JSON.stringify({ version: 1, nodes: [...addNode([], null, 'a'), ...addNode([], null, 'a')] })]) {
      expect(() => parseForest(raw)).toThrow();
    }
  });
  it('round-trips storage and surfaces failures', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(loadForest(storage)).toEqual([]);
    const forest = addNode([], null, 'root');
    saveForest(storage, forest);
    expect(loadForest(storage)).toEqual(forest);
    values.set(STORAGE_KEY, 'broken');
    expect(() => loadForest(storage)).toThrow();
    expect(values.get(STORAGE_KEY)).toBe('broken');
    expect(() => saveForest({ setItem() { throw new Error('quota'); } }, forest)).toThrow('quota');
  });
});

import { deleteNode, findNode, moveNode, outlineMove } from '../web/tree';

const sample = () => addNode(addNode(addNode(addNode([], null, 'a'), 'a', 'child'), 'child', 'leaf'), null, 'b');
it('moves whole subtrees across roots, preserves identity and rejects cycles or invalid destinations', () => {
  const tree = sample();
  const moved = moveNode(tree, 'child', 'b', 0);
  expect(moved[0].children).toEqual([]);
  expect(moved[1].children[0]).toBe(tree[0].children[0]);
  expect(findNode(moved, 'leaf')).toBeTruthy();
  expect(tree[0].children).toHaveLength(1);
  for (const [id, parent, index] of [['a', 'leaf', 0], ['a', 'a', 0], ['a', 'missing', 0], ['missing', null, 0], ['b', null, 9], ['b', null, -1]] as const) {
    expect(moveNode(tree, id, parent, index)).toBe(tree);
  }
  expect(parseForest(serializeForest(moved))).toEqual(moved);
});
it('reorders in both directions and indents/outdents with predictable sibling order', () => {
  const tree = sample();
  expect(outlineMove(tree, 'b', 'up').map(n => n.id)).toEqual(['b', 'a']);
  expect(outlineMove(tree, 'a', 'down').map(n => n.id)).toEqual(['b', 'a']);
  const indented = outlineMove(tree, 'b', 'indent');
  expect(indented[0].children.map(n => n.id)).toEqual(['child', 'b']);
  expect(outlineMove(indented, 'b', 'outdent')).toEqual(tree);
  expect(outlineMove(tree, 'a', 'up')).toBe(tree);
  expect(outlineMove(tree, 'a', 'indent')).toBe(tree);
  expect(outlineMove(tree, 'b', 'down')).toBe(tree);
  expect(outlineMove(tree, 'a', 'outdent')).toBe(tree);
});
it('deletes only the requested subtree and keeps the original available for recovery', () => {
  const tree = sample();
  const removed = deleteNode(tree, 'child');
  expect(removed[0].children).toEqual([]);
  expect(removed[1]).toEqual(tree[1]);
  expect(findNode(removed, 'leaf')).toBeUndefined();
  expect(findNode(tree, 'leaf')).toBeTruthy();
  expect(deleteNode(tree, 'missing')).toBe(tree);
});

import { moveRelative, nodePath, visibleNodes } from '../web/tree';
it('resolves before/after/inside drops after removal, including ancestor targets', () => {
  const tree = sample();
  expect(moveRelative(tree, 'a', 'b', 'after').map(n => n.id)).toEqual(['b', 'a']);
  expect(moveRelative(tree, 'b', 'a', 'before').map(n => n.id)).toEqual(['b', 'a']);
  expect(moveRelative(tree, 'b', 'a', 'inside')[0].children.map(n => n.id)).toEqual(['child', 'b']);
  const out = moveRelative(tree, 'child', 'a', 'after');
  expect(out.map(n => n.id)).toEqual(['a', 'child', 'b']);
  expect(out[1].children[0].id).toBe('leaf');
  for (const position of ['before', 'after', 'inside'] as const) {
    expect(moveRelative(tree, 'a', 'leaf', position)).toBe(tree);
    expect(moveRelative(tree, 'a', 'a', position)).toBe(tree);
  }
  expect(nodePath(tree, 'leaf').map(n => n.id)).toEqual(['a', 'child', 'leaf']);
  expect(visibleNodes(tree, new Set(['a'])).map(n => n.id)).toEqual(['a', 'b']);
});
