import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, RootContent } from 'mdast';
import type { Forest, TaskNode } from './tree';

const parser = unified().use(remarkParse).use(remarkGfm);

/** Import checklist structure only. Source documents are never changed by importing. */
export function importMarkdown(source: string): Forest {
  const text = source.replace(/^\uFEFF/, '');
  const ast = parser.parse(text) as Root;
  const forest: Forest = [];
  function visit(node: Root | RootContent, destination: Forest) {
    if (node.type === 'listItem') {
      const start = node.position?.start.offset ?? 0;
      const line = text.slice(start).split(/\r?\n/, 1)[0];
      // Empty checklists are useful unfinished tasks, although GFM doesn't assign checked to them.
      const empty = /^(?:[-+*]|\d+[.)])[ \t]+\[([ xX])\][ \t]*$/.exec(line);
      if (typeof node.checked === 'boolean' || empty) {
        const paragraph = node.children[0];
        const title = empty ? '' : paragraph?.type === 'paragraph' ? paragraph.children.map(inline => {
          if (inline.type === 'text') return inline.value;
          if (inline.type === 'break') return '\n';
          // Keep link destinations and inline syntax as literal task-label content.
          return text.slice(inline.position?.start.offset, inline.position?.end.offset);
        }).join('') : '';
        const task: TaskNode = { id: crypto.randomUUID(), title, done: typeof node.checked === 'boolean' ? node.checked : empty![1].toLowerCase() === 'x', children: [] };
        destination.push(task);
        destination = task.children;
      }
    }
    if ('children' in node) for (const child of node.children) visit(child as RootContent, destination);
  }
  visit(ast, forest);
  return forest;
}

/** Literal labels are escaped so titles cannot become headings, HTML, or extra list items. */
export function treeSignature(forest: Forest): string {
  return JSON.stringify(forest, (key, value) => key === 'id' ? undefined : value);
}

export function exportMarkdown(forest: Forest): string {
  const lines: string[] = [];
  function write(nodes: Forest, depth: number) {
    for (const node of nodes) {
      if (/\u0000|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(node.title))
        throw new Error('A task title contains invalid text for Markdown. Correct the title or export JSON to preserve it.');
      const title = node.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/[\\`*{}\[\]()#+\-.!_|~]/g, '\\$&')
        .replace(/[\r\n\t]/g, char => `&#${char.charCodeAt(0)};`)
        .replace(/^ +| +$/g, spaces => '&#32;'.repeat(spaces.length));
      lines.push(`${'  '.repeat(depth)}- [${node.done ? 'x' : ' '}] ${title}`);
      write(node.children, depth + 1);
    }
  }
  write(forest, 0);
  return lines.length ? lines.join('\n') + '\n' : '';
}

export function decodeMarkdown(bytes: ArrayBuffer): string {
  const source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  if (source.includes('\u0000')) throw new Error('Choose a UTF-8 Markdown text file.');
  return source;
}

/** Appending the same backup twice must not introduce duplicate node identities. */
export function appendForest(existing: Forest, incoming: Forest): Forest {
  const copy = (nodes: Forest): Forest => nodes.map(node => ({ ...node, id: crypto.randomUUID(), children: copy(node.children) }));
  return [...existing, ...copy(incoming)];
}
