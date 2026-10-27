import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, RootContent } from 'mdast';

export type MarkdownTask = {
  id: string; title: string; done: boolean; parent: string | null; depth: number;
  start: number; end: number; lineEnd: number; titleStart: number; titleEnd: number;
  editable: boolean;
};
export type DocumentBlock = { kind: 'context' | 'heading'; start: number; end: number } | { kind: 'task'; task: MarkdownTask };
export type MarkdownDocument = { source: string; tasks: MarkdownTask[]; blocks: DocumentBlock[] };
const parser = unified().use(remarkParse).use(remarkGfm);

/** Source offsets are UTF-16, matching JS strings and VS Code positions. Never serialize the AST. */
export function parseMarkdown(source: string): MarkdownDocument {
  const bom = source.startsWith('\uFEFF') ? 1 : 0;
  const ast = parser.parse(source.slice(bom)) as Root;
  const tasks: MarkdownTask[] = [];
  const headings: { start: number; end: number }[] = [];
  function walk(node: Root | RootContent, parent: MarkdownTask | null) {
    const start = (node.position?.start.offset ?? 0) + bom;
    const end = (node.position?.end.offset ?? 0) + bom;
    if (node.type === 'heading') headings.push({ start, end });
    if (node.type === 'listItem' && typeof node.checked === 'boolean') {
      const newline = source.indexOf('\n', start);
      const lineEnd = newline < 0 ? source.length : newline + 1;
      const line = source.slice(start, lineEnd).replace(/\r?\n$/, '');
      const match = /^(?:[-+*]|\d+[.)])[ \t]+\[[ xX]\][ \t]+(.*)$/.exec(line);
      if (match) {
        const title = match[1].trimEnd();
        const titleStart = start + line.length - match[1].length;
        const first = node.children[0];
        const task: MarkdownTask = {
          id: `task-${start}`, title, done: node.checked, parent: parent?.id ?? null,
          depth: parent ? parent.depth + 1 : 0, start, end, lineEnd,
          titleStart, titleEnd: titleStart + title.length,
          editable: first?.type === 'paragraph' && first.position?.end.line === node.position?.start.line && title.length > 0,
        };
        tasks.push(task); parent = task;
      }
    }
    if ('children' in node) for (const child of node.children) walk(child as RootContent, parent);
  }
  walk(ast, null);
  const blocks: DocumentBlock[] = [];
  let cursor = 0;
  const context = (end: number) => {
    for (const heading of headings.filter(h => h.start >= cursor && h.end <= end)) {
      if (heading.start > cursor) blocks.push({ kind: 'context', start: cursor, end: heading.start });
      blocks.push({ kind: 'heading', ...heading }); cursor = heading.end;
    }
    if (cursor < end) blocks.push({ kind: 'context', start: cursor, end });
    cursor = end;
  };
  for (const task of tasks) {
    // Indentation belongs to the task row, not to a separate context block.
    const lineStart = source.lastIndexOf('\n', task.start - 1) + 1;
    context(lineStart);
    blocks.push({ kind: 'task', task }); cursor = task.lineEnd;
  }
  context(source.length);
  return { source, tasks, blocks };
}

export function renameTask(source: string, id: string, title: string) {
  const doc = parseMarkdown(source);
  const task = doc.tasks.find(t => t.id === id);
  if (!task?.editable) throw new Error('This task needs editing in the source document.');
  if (!title.trim() || /[\r\n\u0000]/.test(title) || title !== title.trim()) throw new Error('Use a nonempty, single-line title without outer whitespace.');
  const result = source.slice(0, task.titleStart) + title + source.slice(task.titleEnd);
  const parsed = parseMarkdown(result);
  if (parsed.tasks.length !== doc.tasks.length || parsed.tasks.find(t => t.id === id)?.title !== title)
    throw new Error('This title changes Markdown structure. Edit it in the source document.');
  return { source: result, start: task.titleStart, end: task.titleEnd, title };
}

export function decodeMarkdown(bytes: ArrayBuffer): string {
  // Preserve a UTF-8 BOM. Invalid UTF-8 gets an error instead of lossy replacement.
  const source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  if (source.includes('\u0000')) throw new Error('Choose a UTF-8 Markdown text file.');
  return source;
}
