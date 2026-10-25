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
