const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { applyRename, createEditorPort, openDocument } = require('../extension/dist/extension.cjs');
exports.run = async function () {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'branchfold-host-'));
  const file = path.join(folder, 'BRANCHES.md');
  const original = '\uFEFF# Trial\r\n\r\n- [ ] Original  \r\n\r\n  Notes [link](a%20b.md)\r\n  - [x] Child\r\n';
  const passed = [];
  try {
    await fs.writeFile(file, original);
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
    await vscode.window.showTextDocument(document);
    const port = createEditorPort(document);
    const request = () => ({ ...port.current(), id: 'task-' + document.getText().indexOf('- [ ]'), title: 'Renamed' });
    const panel = await openDocument({ extensionUri: vscode.Uri.file(path.resolve(__dirname, '../extension')) }, document.uri);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Markdown webview did not send ready')), 15000);
      const listener = panel.webview.onDidReceiveMessage(message => {
        if (message.type === 'ready') { clearTimeout(timer); listener.dispose(); resolve(); }
      });
    });
    passed.push('real VS Code webview loads built assets and completes host handshake');
    panel.dispose();
    const initial = request();
    await applyRename(port, initial);
    assert.equal(await fs.readFile(file, 'utf8'), original.replace('Original', 'Renamed'));
    assert.equal(document.isDirty, false);
    passed.push('actual VS Code narrow rename/save preserves BOM, CRLF, notes and descendants');
    await vscode.commands.executeCommand('undo');
    await document.save();
    assert.equal(await fs.readFile(file, 'utf8'), original);
    passed.push('actual editor undo/save restores original bytes');
    await assert.rejects(applyRename(port, initial), /Conflict/);
    passed.push('stale version rejected');
    const beforeExternal = request();
    const external = original.replace('Original', 'External');
    await fs.writeFile(file, external);
    await assert.rejects(applyRename(port, beforeExternal), /Conflict/);
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
