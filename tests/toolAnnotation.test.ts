import { expect, it } from 'vitest';
import { importMarkdown, exportMarkdown, appendForest, treeSignature } from '../web/markdown';
import { parseForest, serializeForest, updateNode, moveNode, toggleCompletion } from '../web/tree';
import { loadForest, saveForest } from '../web/storage';
import { toolColor } from '../web/toolAnnotation';

it('round-trips tool annotations, blank titles, Unicode, quotes and title whitespace', () => {
  for (const title of ['', 'Task', ' Task  ']) {
    const tree = [{ id: 'a', title, tool: '工具 "A"', done: false, children: [] }];
    const markdown = exportMarkdown(tree);
    const imported = importMarkdown(markdown);
    expect(treeSignature(imported)).toBe(treeSignature(tree));
    expect(exportMarkdown(imported)).toBe(markdown);
    expect(parseForest(serializeForest(tree))).toEqual(tree);
    const values = new Map<string, string>();
    const storage = { setItem: (k: string, v: string) => { values.set(k, v); }, getItem: (k: string) => values.get(k) ?? null };
    saveForest(storage, tree); expect(loadForest(storage)).toEqual(tree);
  }
});
it('only recognizes a single valid trailing HTML annotation outside code', () => {
  const comment = '<!--branchfold:{"tool":"ChatGPT"}-->';
  for (const title of [
    '`' + comment + '`', comment + ' after', comment + ' ' + comment,
    '<!--branchfold:{"tool":"ChatGPT","extra":1}-->', '<!--branchfold:{"tool":""}-->',
    '<!--branchfold:broken-->', '&lt;!--branchfold:{"tool":"ChatGPT"}--&gt;',
  ]) {
    const node = importMarkdown('- [ ] ' + title + '\n')[0];
    expect(node.tool).toBeUndefined(); expect(node.title).toContain('branchfold:');
    expect(treeSignature(importMarkdown(exportMarkdown([node])))).toBe(treeSignature([node]));
  }
  expect(importMarkdown('- [ ] Task <!--branchfold:{"tool":"  VS Code  "}-->\n')[0]).toMatchObject({ title: 'Task', tool: 'VS Code' });
});
it('preserves metadata in structural operations and rejects invalid backup labels', () => {
  const tree = importMarkdown('- [ ] Parent <!--branchfold:{"tool":"ChatGPT"}-->\n  - [ ] Child\n- [ ] Next\n');
  const id = tree[0].id;
  const renamed = updateNode(tree, id, n => ({ ...n, title: 'Renamed' }));
  expect(toggleCompletion(renamed, id)[0].tool).toBe('ChatGPT');
  expect(moveNode(renamed, id, tree[1].id, 0)[0].children[0].tool).toBe('ChatGPT');
  expect(appendForest([], renamed)[0]).toMatchObject({ tool: 'ChatGPT' });
  expect(tree[0].children[0].tool).toBeUndefined();
  for (const tool of ['', '<!--bad', 'bad-->', '\n', 1, null]) {
    expect(() => parseForest(JSON.stringify({ version: 1, nodes: [{ ...tree[0], tool }] }))).toThrow();
  }
  expect(parseForest(serializeForest([{ ...tree[0], tool: ' ChatGPT ' }]))[0].tool).toBe('ChatGPT');
  expect(toolColor(' ChatGPT ')).toBe(toolColor('chatgpt'));
});
