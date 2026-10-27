import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { decodeMarkdown, parseMarkdown, renameTask } from '../web/markdown';
import { applyRename, type EditorPort } from '../extension/controller';

const mixed = '\uFEFF# Plan\r\n\r\nIntro [link](some%20file.md).\r\n\r\n- [ ] Parent **title**  \r\n  Notes stay here.\r\n  - [X] 子 🌱\r\n\r\n```md\r\n- [ ] example, not a task\r\n```\r\n\r\n> Quote\r\n\r\n- ordinary list\r\n\r\n## Next\r\n1. [ ] Last\r\n';
it('reads mixed Markdown without changing bytes, retaining nesting and source ranges', () => {
  const document = parseMarkdown(mixed);
  expect(document.source).toBe(mixed);
  expect(document.tasks.map(t => [t.title, t.done, t.depth])).toEqual([['Parent **title**', false, 0], ['子 🌱', true, 1], ['Last', false, 0]]);
  for (const task of document.tasks) expect(mixed.slice(task.titleStart, task.titleEnd)).toBe(task.title);
  expect(document.blocks.filter(b => b.kind === 'heading')).toHaveLength(2);
  const bytes = new TextEncoder().encode(mixed);
  expect(decodeMarkdown(bytes.buffer)).toBe(mixed);
});
it('renames only a single-line title, preserving CRLF, descendants, links and trailing spaces', () => {
  const source = '# Plan\r\n- [ ] Parent **title**  \r\n\r\n  Notes stay.\r\n  - [x] Child\r\n';
  const task = parseMarkdown(source).tasks[0];
  expect(renameTask(source, task.id, 'New [link](a%20b.md)').source).toBe(source.replace('Parent **title**', 'New [link](a%20b.md)'));
});
it('leaves multiline and ambiguous task syntax for source editing', () => {
  const source = '- [ ] First line\n  continued title\n\n    - [ ] Nested\n\n<!--\n- [ ] hidden\n-->\n\n    - [ ] code\n\n- [?] malformed\n';
  const doc = parseMarkdown(source);
  expect(doc.tasks[0].editable).toBe(false);
  expect(doc.tasks.some(t => t.title === 'hidden' || t.title === 'code' || t.title === 'malformed')).toBe(false);
  expect(() => renameTask(source, doc.tasks[0].id, 'Changed')).toThrow();
  for (const title of ['', ' leading', 'two\nlines', '\u0000']) expect(() => renameTask('- [ ] A', 'task-0', title)).toThrow();
});
it('preserves LF, CRLF, no-final-newline, unicode and BOM during targeted edits', () => {
  for (const source of ['- [ ] A', '\uFEFF- [ ] A\r\n', '- [X] A\n']) {
    const task = parseMarkdown(source).tasks[0];
    expect(renameTask(source, task.id, '中文 🌱').source).toBe(source.replace('A', '中文 🌱'));
  }
  expect(() => decodeMarkdown(new Uint8Array([0xff]).buffer)).toThrow();
  expect(() => decodeMarkdown(new Uint8Array([0]).buffer)).toThrow();
});
it('handles ordinary list containers, quotes, fenced code, HTML and section boundaries', () => {
  const doc = parseMarkdown('- [ ] Root\n  - ordinary\n    - [x] Nested\n\n# Section\n\n> - [ ] Quoted\n\n~~~\n- [ ] code\n~~~\n\n<div>\n- [ ] HTML\n</div>\n');
  expect(doc.tasks.map(t => [t.title, t.depth])).toEqual([['Root', 0], ['Nested', 1], ['Quoted', 0]]);
});
it('reads the tracked plan without changing its bytes', () => {
  const source = readFileSync('BRANCHES.md', 'utf8');
  expect(parseMarkdown(source).source).toBe(source);
  expect(parseMarkdown(source).tasks.length).toBeGreaterThan(10);
});
function fixture() {
  let source = '- [ ] Original\n  - [x] Child\n'; let version = 1; let dirty = false;
  const history: string[] = [];
  const port: EditorPort = {
    current: () => ({ source, version, dirty }), diskMatches: async () => true,
    replace: async (expected, start, end, title) => {
      if (version !== expected) return false;
      history.push(source); source = source.slice(0, start) + title + source.slice(end); version++; dirty = true; return true;
    }, save: async () => { dirty = false; return true; },
  };
  const request = { source, version, id: 'task-0', title: 'Renamed' };
  return { port, request, history };
}
it('persists a minimal rename and retains the original for editor undo', async () => {
  const { port, request, history } = fixture();
  await applyRename(port, request);
  expect(port.current().source).toBe('- [ ] Renamed\n  - [x] Child\n');
  expect(port.current().dirty).toBe(false);
  expect(history).toEqual([request.source]);
});
it('rejects stale editor versions, dirty source and disk changes before mutation', async () => {
  for (const kind of ['version', 'dirty', 'disk']) {
    const { port, request, history } = fixture();
    if (kind === 'version') request.version = 0;
    if (kind === 'dirty') { const original = port.current; port.current = () => ({ ...original(), dirty: true }); }
    if (kind === 'disk') port.diskMatches = async () => false;
    await expect(applyRename(port, request)).rejects.toThrow();
    expect(history).toEqual([]);
  }
});
it('rejects a change during disk validation and an editor-side version rejection', async () => {
  for (const race of ['during-read', 'during-apply']) {
    const { port, request, history } = fixture();
    if (race === 'during-read') port.diskMatches = async () => { const current = port.current(); port.current = () => ({ ...current, version: 2 }); return true; };
    else port.replace = async () => false;
    await expect(applyRename(port, request)).rejects.toThrow('Conflict');
    expect(history).toEqual([]);
  }
});
it('retains failed saves in the editor for recovery without claiming success', async () => {
  const { port, request, history } = fixture();
  port.save = async () => false;
  await expect(applyRename(port, request)).rejects.toThrow('unsaved');
  expect(port.current().dirty).toBe(true);
  expect(history[0]).toBe(request.source);
});
it('propagates read/write failures without silently discarding originals', async () => {
  const { port, request, history } = fixture();
  port.diskMatches = async () => { throw new Error('Permission denied'); };
  await expect(applyRename(port, request)).rejects.toThrow('Permission denied');
  expect(history).toEqual([]);
});
