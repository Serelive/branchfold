import * as vscode from 'vscode';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { applyRename } from './controller';

export function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand('branchfold.open', async () => {
    const picked = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { Markdown: ['md', 'markdown'] } });
    if (!picked?.[0]) return;
    await openDocument(context, picked[0]);
  }));
}

export async function openDocument(context, uri) {
  if (uri.scheme !== 'file') { vscode.window.showErrorMessage('Choose a local Markdown file.'); return; }
  const bytes = await vscode.workspace.fs.readFile(uri);
  if (bytes.length > 2 * 1024 * 1024) { vscode.window.showErrorMessage('Choose a Markdown file under 2 MB.'); return; }
  try { if (new TextDecoder('utf-8', { fatal: true }).decode(bytes).includes('\u0000')) throw new Error('Binary file'); }
  catch { vscode.window.showErrorMessage('Choose a UTF-8 Markdown file.'); return; }
  const document = await vscode.workspace.openTextDocument(uri);
  const media = vscode.Uri.joinPath(context.extensionUri, 'dist', 'web');
  const panel = vscode.window.createWebviewPanel('branchfold', 'Branchfold · ' + uri.path.split('/').pop(), vscode.ViewColumn.Beside, { enableScripts: true, localResourceRoots: [media], retainContextWhenHidden: true });
  const nonce = randomBytes(16).toString('hex');
  let html = await readFile(vscode.Uri.joinPath(media, 'index.html').fsPath, 'utf8');
  html = html.replace(/(?:src|href)="\.\/([^" ]+)"/g, (match, path) => match.replace('./' + path, panel.webview.asWebviewUri(vscode.Uri.joinPath(media, path)).toString()));
  html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${panel.webview.cspSource} 'unsafe-inline'; img-src ${panel.webview.cspSource} blob:;">`).replace(/<script /g, `<script nonce="${nonce}" `);
  panel.webview.html = html;
  let busy = false;
  const snapshot = () => panel.webview.postMessage({ type: 'snapshot', document: { source: document.getText(), version: document.version, dirty: document.isDirty, name: uri.path.split('/').pop() } });
  const port = createEditorPort(document);
  const result = (operation, ok, message) => panel.webview.postMessage({ type: 'result', operation, ok, message });
  const subscriptions = [
    vscode.workspace.onDidChangeTextDocument(event => { if (event.document.uri.toString() === uri.toString()) snapshot(); }),
    vscode.workspace.onDidSaveTextDocument(saved => { if (saved.uri.toString() === uri.toString()) snapshot(); }),
    panel.webview.onDidReceiveMessage(async message => {
      if (!message || typeof message.type !== 'string') return;
      if (message.type === 'ready' || message.type === 'refresh') { await snapshot(); return; }
      if (message.type === 'source') { await vscode.window.showTextDocument(document, vscode.ViewColumn.One); return; }
      if (!['save', 'rename'].includes(message.type)) return;
      if (busy) { await result(message.type, false, 'Another operation is still running.'); return; }
      busy = true;
      try {
        if (message.type === 'save') {
          if (!await document.save()) throw new Error('Save did not finish. Resolve the problem in the source editor.');
          await result('save', true, 'Document saved.');
        } else {
          if (!Number.isInteger(message.version) || !['source', 'id', 'title'].every(key => typeof message[key] === 'string')) throw new Error('Invalid rename request.');
          await applyRename(port, message);
          await result('rename', true, 'Task renamed and saved. Undo is available in the source editor.');
        }
      } catch (error) { await result(message.type, false, String(error.message ?? error)); }
      finally { busy = false; await snapshot(); }
    }),
  ];
  panel.onDidDispose(() => subscriptions.forEach(subscription => subscription.dispose()));
  return panel;
}

export function createEditorPort(document) {
  return {
    current: () => ({ source: document.getText(), version: document.version, dirty: document.isDirty }),
    diskMatches: async () => {
      const disk = new TextDecoder('utf-8', { fatal: true }).decode(await vscode.workspace.fs.readFile(document.uri));
      return disk === document.getText();
    },
    replace: async (version, start, end, title) => {
      // TextEditor.edit carries the document version into the editor's atomic edit operation.
      const editor = await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One, preserveFocus: true });
      if (document.version !== version || document.isDirty) return false;
      return editor.edit(builder => builder.replace(new vscode.Range(document.positionAt(start), document.positionAt(end)), title), { undoStopBefore: true, undoStopAfter: true });
    },
    save: () => document.save(),
  };
}
export { applyRename };
