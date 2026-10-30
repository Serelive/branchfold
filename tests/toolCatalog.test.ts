import { expect, it } from 'vitest';
import { mergeCatalog, rankedTools, discoverTools, defaultTools } from '../web/toolCatalog';
import { importMarkdown } from '../web/markdown';
it('discovers imported tools and ranks by task frequency with stable default ties', () => {
  const forest = importMarkdown('- [ ] A <!--branchfold:{"tools":["Notion","New"]}-->\n  - [ ] B <!--branchfold:{"tool":"notion"}-->\n');
  const catalog = mergeCatalog({ names: defaultTools, manual: false }, discoverTools(forest));
  expect(rankedTools(catalog, forest)).toEqual(['Notion', 'New', 'VSCode', 'Obsidian', 'ChatGPT']);
  expect(rankedTools({ names: ['New', 'Notion'], manual: true }, forest)).toEqual(['New', 'Notion']);
  expect(mergeCatalog({ names: ['New', 'Notion'], manual: true }, ['Other', 'NEW'])).toEqual({ names: ['New', 'Notion', 'Other'], manual: true });
});
