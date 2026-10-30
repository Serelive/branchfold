import * as vscode from 'vscode';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { saveTree } from './controller';
import { parseForest, serializeForest } from '../web/tree';
import { exportMarkdown } from '../web/markdown';

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
  const draftKey = `branchfold.draft:${uri.toString()}`;
  let draft = context.workspaceState?.get(draftKey) ?? null;
  const current = () => ({ source: document.getText(), version: document.version, dirty: document.isDirty, name: uri.path.split('/').pop() });
  const snapshot = () => panel.webview.postMessage({ type: 'snapshot', document: current() });
  const port = createEditorPort(document);
  const subscriptions = [
    vscode.workspace.onDidChangeTextDocument(event => { if (event.document.uri.toString() === uri.toString()) snapshot(); }),
    vscode.workspace.onDidSaveTextDocument(saved => { if (saved.uri.toString() === uri.toString()) snapshot(); }),
    panel.webview.onDidReceiveMessage(async message => {
      if (!message || typeof message.type !== 'string') return;
      if (message.type === 'ready') {
        if (draft) await panel.webview.postMessage({ type: 'restoreDraft', document: draft.document, tree: draft.tree });
        await snapshot(); return;
      }
      if (message.type === 'source') { await vscode.window.showTextDocument(document, vscode.ViewColumn.One); return; }
      try {
        if (message.type === 'draft') {
          if (typeof message.tree !== 'string' || typeof message.document?.source !== 'string' || !Number.isInteger(message.document?.version)) return;
          parseForest(message.tree);
          draft = message.dirty ? { tree: message.tree, document: message.document } : null;
          panel.title = `${draft ? '● ' : ''}Branchfold · ${uri.path.split('/').pop()}`;
          await context.workspaceState?.update(draftKey, draft ?? undefined);
          return;
        }
        if (message.type === 'export') {
          if (!['json', 'md'].includes(message.format)) throw new Error('Unknown export format.');
          const forest = parseForest(message.tree);
          const content = message.format === 'md' ? exportMarkdown(forest) : serializeForest(forest);
          const target = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.joinPath(uri, '..', `branchfold-backup.${message.format}`), filters: { 'Task backup': [message.format] } });
          if (!target) return;
          if (target.toString() === uri.toString()) throw new Error('Use Save document to update the open file. Choose another path for an export.');
          await vscode.workspace.fs.writeFile(target, new TextEncoder().encode(content));
          await panel.webview.postMessage({ type: 'notice', message: 'Task tree exported.' }); return;
        }
        if (message.type !== 'save') return;
        if (busy) throw new Error('A save is already running.');
        if (!Number.isInteger(message.version) || !['source', 'tree', 'requestId'].every(key => typeof message[key] === 'string')) throw new Error('Invalid save request.');
        busy = true;
        try {
          await saveTree(port, message);
          draft = null; panel.title = `Branchfold · ${uri.path.split('/').pop()}`;
          await context.workspaceState?.update(draftKey, undefined);
          await panel.webview.postMessage({ type: 'saveResult', requestId: message.requestId, ok: true, message: 'Task tree saved. Source editor undo restores the previous document.', document: current() });
        } catch (error) {
          await panel.webview.postMessage({ type: 'saveResult', requestId: message.requestId, ok: false, message: String(error.message ?? error), document: current() });
        } finally { busy = false; }
      } catch (error) { await panel.webview.postMessage({ type: 'notice', message: String(error.message ?? error) }); }
    }),
  ];
  panel.onDidDispose(async () => {
    subscriptions.forEach(subscription => subscription.dispose());
    if (draft) {
      let content; let language = 'markdown';
      try { content = exportMarkdown(parseForest(draft.tree)); }
      catch { content = draft.tree; language = 'json'; }
      const recovery = await vscode.workspace.openTextDocument({ language, content });
      await vscode.window.showTextDocument(recovery);
      vscode.window.showInformationMessage('Unsaved Branchfold tasks were opened in a recovery document. Save it to keep them.');
    }
  });
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
export { saveTree };
