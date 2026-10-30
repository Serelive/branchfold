import { expect, it } from 'vitest';
import { appendForest, decodeMarkdown, exportMarkdown, importMarkdown } from '../web/markdown';
import { serializeForest, type Forest } from '../web/tree';
import { saveTree, type EditorPort } from '../extension/controller';
const shape = (forest: Forest): unknown => forest.map(({ title, done, children }) => ({ title, done, children: shape(children) }));
it('imports checklist structure and drops headings, notes, code examples and ordinary prose', () => {
  const source = '\uFEFF# Plan\r\n\r\nIntro\r\n- [ ] Parent\r\n\r\n  Notes\r\n  - [X] Child\r\n\r\n```md\r\n- [ ] example\r\n```\r\n\n<div>\n- [ ] HTML\n</div>\n\n- [?] malformed\n';
  const before = new TextEncoder().encode(source);
  const forest = importMarkdown(source);
  expect(shape(forest)).toEqual([{ title: 'Parent', done: false, children: [{ title: 'Child', done: true, children: [] }] }]);
  expect(new TextEncoder().encode(source)).toEqual(before);
  expect(exportMarkdown(forest)).toBe('- [ ] Parent\n  - [x] Child\n');
});
it('supports ordered tasks, wrappers, quotes, multiline labels and blank tasks', () => {
  const source = '- [ ]\n  - [x] Child\n\n1. [ ] Next\n   continued\n\n- ordinary\n  - [ ] Wrapped\n\n> - [ ] Quoted\n';
  const forest = importMarkdown(source);
  expect(forest.map(t => t.title)).toEqual(['', 'Next\ncontinued', 'Wrapped', 'Quoted']);
  expect(forest[0].children[0].title).toBe('Child');
  expect(shape(importMarkdown(exportMarkdown(forest)))).toEqual(shape(forest));
});
it('round trips literal labels without turning text into Markdown structure', () => {
  const titles = ['', ' # Heading ', '[docs](a%20b.md)', '*emphasis*', '<script>x</script>', 'a &amp; b', 'line\n- [ ] injected', '\tTab\rReturn', '中文 🌱', '  ', 'a\\b', '![image](url)'];
  const forest = titles.map((title, i) => ({ id: String(i), title, done: i % 2 === 0, children: [] }));
  expect(shape(importMarkdown(exportMarkdown(forest)))).toEqual(shape(forest));
  expect(shape(importMarkdown(exportMarkdown([{ id: 'r', title: '', done: false, children: forest }])))).toEqual(shape([{ id: 'r', title: '', done: false, children: forest }]));
});
it('retains inline link destinations and formatting as literal labels', () => {
  const forest = importMarkdown('- [ ] Read [guide](a%20b.md) and **notes**\n');
  expect(forest[0].title).toBe('Read [guide](a%20b.md) and **notes**');
  expect(shape(importMarkdown(exportMarkdown(forest)))).toEqual(shape(forest));
});
it('appends copies with fresh identities, including repeated nested backups', () => {
  const initial: Forest = [{ id: 'a', title: 'Root', done: false, children: [{ id: 'b', title: 'Child', done: true, children: [] }] }];
  const result = appendForest(appendForest(initial, initial), initial);
  const ids = result.flatMap(n => [n.id, n.children[0].id]);
  expect(new Set(ids).size).toBe(6); expect(result[0]).toBe(initial[0]);
  expect(shape(result.slice(1))).toEqual(shape([...initial, ...initial]));
});
it('rejects invalid UTF-8 and binary text while preserving BOM in decoded input', () => {
  const text = '\uFEFF- [ ] A\r\n';
  expect(decodeMarkdown(new TextEncoder().encode(text).buffer)).toBe(text);
  expect(() => decodeMarkdown(new Uint8Array([255]).buffer)).toThrow();
  expect(() => decodeMarkdown(new Uint8Array([0]).buffer)).toThrow();
});
function fixture() {
  let source = '# Plan\n\n- [ ] Original\n\n  Notes\n'; let version = 1; let dirty = false;
  const history: string[] = [];
  const port: EditorPort = {
    current: () => ({ source, version, dirty }), diskMatches: async () => true,
    replace: async (expected, start, end, text) => { if (expected !== version) return false; history.push(source); source = source.slice(0, start) + text + source.slice(end); version++; dirty = true; return true; },
    save: async () => { dirty = false; return true; },
  };
  const request = { source, version, tree: serializeForest([{ id: 'new', title: 'Edited', done: true, children: [{ id: 'child', title: 'New child', done: false, children: [] }] }]) };
  return { port, request, history };
}
it('writes a standardized tree only on explicit save and keeps source undo available', async () => {
  const { port, request, history } = fixture();
  expect(port.current().source).toBe(request.source);
  await saveTree(port, request);
  expect(port.current().source).toBe('- [x] Edited\n  - [ ] New child\n');
  expect(history).toEqual([request.source]); expect(port.current().dirty).toBe(false);
});
it('rejects stale revisions, dirty source editors and changed disk contents', async () => {
  for (const kind of ['version', 'dirty', 'disk']) {
    const { port, request, history } = fixture();
    if (kind === 'version') request.version = 0;
    if (kind === 'dirty') { const current = port.current; port.current = () => ({ ...current(), dirty: true }); }
    if (kind === 'disk') port.diskMatches = async () => false;
    await expect(saveTree(port, request)).rejects.toThrow(); expect(history).toEqual([]);
  }
});
it('rejects races during disk validation or versioned editor application', async () => {
  for (const race of ['read', 'apply']) {
    const { port, request, history } = fixture();
    if (race === 'read') port.diskMatches = async () => { const current = port.current(); port.current = () => ({ ...current, version: 2 }); return true; };
    else port.replace = async () => false;
    await expect(saveTree(port, request)).rejects.toThrow('Conflict'); expect(history).toEqual([]);
  }
});
it('keeps failed saves recoverable and rejects malformed trees before mutation', async () => {
  const { port, request, history } = fixture();
  await expect(saveTree(port, { ...request, tree: 'bad' })).rejects.toThrow(); expect(history).toEqual([]);
  port.save = async () => false;
  await expect(saveTree(port, request)).rejects.toThrow('Save failed');
  expect(port.current().dirty).toBe(true); expect(history[0]).toBe(request.source);
});

it('rejects text Markdown cannot preserve instead of silently replacing it', () => {
  for (const title of ['bad\u0000text', '\uD800']) {
    expect(() => exportMarkdown([{ id: 'a', title, done: false, children: [] }])).toThrow('invalid text');
  }
});
