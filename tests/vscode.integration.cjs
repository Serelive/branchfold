const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { saveTree, createEditorPort, openDocument } = require('../extension/dist/extension.cjs');
exports.run = async function () {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'branchfold-host-'));
  const file = path.join(folder, 'BRANCHES.md');
  const original = '\uFEFF# Trial\r\n\r\n- [ ] Original <!--branchfold:{"tool":"ChatGPT"}-->  \r\n\r\n  Notes [link](a%20b.md)\r\n  - [ ] Child\r\n';
  const passed = [];
  try {
    await fs.writeFile(file, original);
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
    await vscode.window.showTextDocument(document);
    const port = createEditorPort(document);
    const request = () => ({ ...port.current(), tree: JSON.stringify({ version: 1, nodes: [{ id: 'root', title: 'Renamed', tools: ['ChatGPT', 'Notion'], done: true, children: [{ id: 'new', title: 'New child', done: false, children: [] }] }] }) });
    const recoveryStore = new Map();
    const context = { extensionUri: vscode.Uri.file(path.resolve(__dirname, '../extension')), workspaceState: { get: key => recoveryStore.get(key), update: async (key, value) => { if (value === undefined) recoveryStore.delete(key); else recoveryStore.set(key, value); } } };
    const panel = await openDocument(context, document.uri);
    const nonce = panel.webview.html.match(/nonce="([^"]+)"/)[1];
    const appearanceProbe = `<script nonce="${nonce}">
      (() => {
        const api = acquireVsCodeApi(); window.acquireVsCodeApi = () => api;
        localStorage.removeItem('branchfold.appearance.v1');
        const waitFor = predicate => new Promise((resolve, reject) => {
          let attempts = 0;
          const tick = () => { if (predicate()) resolve(); else if (++attempts > 300) reject(new Error('Appearance probe timed out')); else requestAnimationFrame(tick); };
          tick();
        });
        const sample = () => ({ theme: document.documentElement.dataset.theme,
          heading: getComputedStyle(document.querySelector('h1')).color,
          title: getComputedStyle(document.querySelector('input.title')).color,
          body: getComputedStyle(document.body).backgroundColor });
        (async () => {
          await waitFor(() => document.querySelector('input.title'));
          if (document.querySelector('[role="treeitem"][aria-selected="true"]')?.getAttribute('aria-label') !== 'Child') throw new Error('Initial selection must be the unfinished leaf');
          const badge = document.querySelector('.node .tool-badge');
          if (badge?.textContent !== 'ChatGPT') throw new Error('Tool badge missing');
          const badgeColors = [];
          const checkBadge = () => { const style = getComputedStyle(badge); badgeColors.push([style.color, style.backgroundColor]); };
          checkBadge();
          const samples = [sample()];
          document.querySelector('.settings-trigger').click();
          await waitFor(() => !document.querySelector('.settings-panel').hidden);
          const catalogTag = document.querySelector('[aria-label="Edit tool ChatGPT"]');
          if (!catalogTag || getComputedStyle(catalogTag).backgroundColor !== getComputedStyle(badge).backgroundColor) throw new Error('Settings tags must match cell tags');
          if (document.querySelector('.tool-catalog textarea, .tool-catalog input')) throw new Error('Tool catalog starts as tags');
          const dark = document.querySelector('.setting-toggle input');
          dark.click(); await waitFor(() => document.documentElement.dataset.theme === 'dark'); samples.push(sample()); checkBadge();
          dark.click(); await waitFor(() => document.documentElement.dataset.theme === 'light'); samples.push(sample()); checkBadge();
          document.querySelector('.settings-trigger').click();
          const main = document.querySelector('main.outline-editor'); main.style.width = '360px';
          await new Promise(resolve => requestAnimationFrame(resolve));
          const badgeBox = badge.getBoundingClientRect(), titleBox = document.querySelector('input.title').getBoundingClientRect();
          if (badgeBox.width < 10 || badgeBox.left < titleBox.right) throw new Error('Badge overlaps title in narrow layout');
          document.querySelector('button[aria-label^="Assign tools to "]').scrollIntoView({ block: 'center' });
          await new Promise(resolve => requestAnimationFrame(resolve));
          document.querySelector('button[aria-label^="Assign tools to "]').click();
          await waitFor(() => document.querySelector('[role="dialog"] [role="checkbox"]'));
          if (getComputedStyle(document.querySelector('.tool-choices')).display !== 'grid') throw new Error('Tool choices must form a vertical list');
          const toolInput = document.querySelector('[role="dialog"] [role="checkbox"]');
          if (toolInput.getAttribute('aria-checked') !== 'true' || document.activeElement !== toolInput) throw new Error('Tool editor did not load or focus');
          const popover = document.querySelector('.tool-popover');
          if (popover.getAttribute('aria-modal') === 'true' || document.querySelector('.tool-editor-backdrop')) throw new Error('Tool chooser must be local');
          if (popover.querySelector('input')) throw new Error('Create input must start hidden');
          await new Promise(resolve => setTimeout(resolve, 170));
          const popBox = popover.getBoundingClientRect();
          const anchorBox = document.querySelector('button[aria-label^="Assign tools to "]').getBoundingClientRect();
          if (popBox.width > 250 || popBox.top >= anchorBox.top || popBox.bottom <= anchorBox.bottom) throw new Error('Popover geometry: ' + JSON.stringify({ pop: popBox.toJSON(), anchor: anchorBox.toJSON() }));
          toolInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await waitFor(() => !document.querySelector('[role="dialog"]'));
          const child = document.querySelector('[role="treeitem"][aria-label="Child"]');
          child.focus();
          child.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true, bubbles: true }));
          await waitFor(() => document.querySelector('[role="treeitem"][aria-label="Child"]').getAttribute('aria-level') === '1');
          const moved = document.querySelector('[role="treeitem"][aria-label="Child"]');
          moved.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }));
          await waitFor(() => document.querySelector('[role="treeitem"][aria-label="Child"]').getAttribute('aria-level') === '2');
          api.postMessage({ type: 'appearanceProbe', samples, badgeColors, loaded: document.readyState });
        })().catch(error => api.postMessage({ type: 'appearanceProbe', error: String(error) }));
      })();
    </script>`;
    const appearance = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Markdown webview did not render')), 15000);
      const listener = panel.webview.onDidReceiveMessage(message => {
        if (message.type === 'appearanceProbe') { clearTimeout(timer); listener.dispose(); resolve(message); }
      });
      panel.webview.html = panel.webview.html.replace('</head>', appearanceProbe + '</head>');
    });
    assert.equal(appearance.error, undefined);
    assert.deepEqual(appearance.badgeColors[0], appearance.badgeColors[2]);
    assert.notDeepEqual(appearance.badgeColors[0], appearance.badgeColors[1]);
    assert.equal(appearance.loaded, 'complete');
    assert.deepEqual(appearance.samples, [
      { theme: 'light', heading: 'rgb(37, 59, 50)', title: 'rgb(37, 59, 50)', body: 'rgb(244, 243, 237)' },
      { theme: 'dark', heading: 'rgb(220, 231, 222)', title: 'rgb(220, 231, 222)', body: 'rgb(21, 28, 25)' },
      { theme: 'light', heading: 'rgb(37, 59, 50)', title: 'rgb(37, 59, 50)', body: 'rgb(244, 243, 237)' },
    ]);
    passed.push('real webview renders tasks and preserves Branchfold colors through light/dark/light switching');
    passed.push('tool badges survive theme switches and narrow layout; tool editor focuses and cancels');
    passed.push('real VS Code webview loads built assets and completes host handshake');
    const recoveryTree = JSON.stringify({ version: 1, nodes: [{ id: 'recovery', title: 'Unsaved recovery', tools: ['工具', 'Obsidian'], done: false, children: [] }] });
    const draftMessage = { type: 'draft', dirty: true, document: { ...port.current(), name: 'BRANCHES.md' }, tree: recoveryTree };
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Draft was not received')), 10000);
      const listener = panel.webview.onDidReceiveMessage(message => { if (message.type === 'draft') { clearTimeout(timer); listener.dispose(); resolve(); } });
      panel.webview.html = '<html><body><script>acquireVsCodeApi().postMessage(' + JSON.stringify(draftMessage) + ')</script></body></html>';
    });
    assert.equal(await fs.readFile(file, 'utf8'), original);
    const recovered = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Recovery document did not open')), 10000);
      const listener = vscode.workspace.onDidOpenTextDocument(doc => { if (doc.isUntitled && doc.getText().includes('Unsaved recovery')) { clearTimeout(timer); listener.dispose(); resolve(doc); } });
    });
    panel.dispose();
    const recovery = await recovered;
    assert.equal(recovery.getText(), '- [ ] Unsaved recovery <!--branchfold:{"tools":["工具","Obsidian"]}-->\n');
    assert.equal(recoveryStore.get('branchfold.draft:' + document.uri.toString()).tree, recoveryTree);
    await vscode.window.showTextDocument(recovery);
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    await vscode.window.showTextDocument(document);
    passed.push('draft editing leaves disk unchanged; view closure opens unsaved recovery tasks');
    const initial = request();
    assert.equal(await fs.readFile(file, 'utf8'), original);
    passed.push('loading and preparing edits leaves the original document unchanged');
    await saveTree(port, initial);
    assert.equal(await fs.readFile(file, 'utf8'), '\uFEFF- [x] Renamed <!--branchfold:{"tools":["ChatGPT","Notion"]}-->\r\n  - [ ] New child\r\n');
    assert.equal(document.isDirty, false);
    passed.push('explicit Save writes the structured tree, omits notes and headings, and uses the document encoding/EOL');
    await vscode.commands.executeCommand('undo');
    await document.save();
    assert.equal(await fs.readFile(file, 'utf8'), original);
    passed.push('actual editor undo/save restores original bytes');
    await assert.rejects(saveTree(port, initial), /Conflict/);
    passed.push('stale version rejected');
    const beforeExternal = request();
    const external = original.replace('Original', 'External');
    await fs.writeFile(file, external);
    await assert.rejects(saveTree(port, beforeExternal), /Conflict/);
    assert.equal(await fs.readFile(file, 'utf8'), external);
    passed.push('external on-disk edit retained');
    for (let attempt = 0; attempt < 100 && !document.getText().includes('External'); attempt++) await new Promise(resolve => setTimeout(resolve, 50));
    assert.ok(document.getText().includes('External'), 'VS Code refreshes clean documents after external edits');
    passed.push('external changes refresh the live editor document');
    await fs.mkdir(path.resolve(__dirname, '../.tools'), { recursive: true });
    await fs.writeFile(path.resolve(__dirname, '../.tools/vscode-integration.json'), JSON.stringify({ passed }, null, 2));
    console.log(passed.join('\n'));
  } finally {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await fs.rm(folder, { recursive: true, force: true });
  }
};
