import { useEffect, useRef, useState } from 'react';
import App from './App';
import { documentHost, type DocumentSnapshot, type HostMessage } from './documentHost';
import { treeSignature, importMarkdown } from './markdown';
import { parseForest, serializeForest, type Forest } from './tree';

export default function Workspace() {
  return documentHost ? <DocumentEditor /> : <App />;
}

function DocumentEditor() {
  const session = useRef<{ base: DocumentSnapshot | null; forest: Forest; baseline: string; dirty: boolean; pending: string | null; latest: DocumentSnapshot | null }>({ base: null, forest: [], baseline: '', dirty: false, pending: null, latest: null });
  const restoring = useRef(false);
  const [generation, setGeneration] = useState(0);
  const [, redraw] = useState(0);
  const [notice, setNotice] = useState('');
  const [confirmReload, setConfirmReload] = useState(false);
  const render = () => redraw(n => n + 1);
  function adopt(document: DocumentSnapshot) {
    const forest = importMarkdown(document.source);
    session.current = { base: document, forest, baseline: treeSignature(forest), dirty: false, pending: null, latest: null };
    setGeneration(n => n + 1); setConfirmReload(false);
  }
  function remember() {
    const s = session.current;
    if (s.base) documentHost!.postMessage({ type: 'draft', document: s.base, tree: serializeForest(s.forest), dirty: s.dirty });
  }
  useEffect(() => {
    const receive = (event: MessageEvent<HostMessage>) => {
      const message = event.data;
      if (!message || typeof message.type !== 'string') return;
      const s = session.current;
      if (message.type === 'notice') { setNotice(message.message); return; }
      if (message.type === 'restoreDraft') {
        restoring.current = true;
        adopt(message.document);
        session.current.forest = parseForest(message.tree);
        session.current.dirty = treeSignature(session.current.forest) !== session.current.baseline;
        setNotice('Unsaved tree restored.'); render(); return;
      }
      if (message.type === 'snapshot') {
        // Editor versions restart across sessions. Exact source equality lets a recovered draft
        // use the reopened document's version without accepting any changed content.
        if (restoring.current && s.base) {
          restoring.current = false;
          if (s.base.source === message.document.source) { s.base = message.document; s.latest = null; remember(); render(); return; }
        }
        if (s.pending) { s.latest = message.document; return; }
        if (!s.base || (!s.dirty && (s.base.version !== message.document.version || s.base.source !== message.document.source))) {
          adopt(message.document); setNotice(s.base ? 'Source refreshed automatically.' : ''); return;
        }
        if (s.base.version === message.document.version && s.base.source === message.document.source) s.base = message.document;
        else { s.latest = message.document; setNotice('The source changed. Your unsaved tree is retained. Review the source or discard your edits to reload it.'); }
        render(); return;
      }
      if (message.type === 'saveResult' && message.requestId === s.pending) {
        s.pending = null;
        if (message.ok) {
          const saved = treeSignature(importMarkdown(message.document.source));
          if (saved === treeSignature(s.forest)) { s.base = message.document; s.baseline = saved; s.dirty = false; s.latest = null; }
          else adopt(message.document); // Respect editor save hooks that change the saved content.
          remember();
        } else { s.latest = message.document; }
        setNotice(message.message); render();
      }
    };
    window.addEventListener('message', receive);
    documentHost!.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', receive);
  }, []);
  function change(forest: Forest) {
    const s = session.current;
    s.forest = forest; s.dirty = treeSignature(forest) !== s.baseline;
    remember(); render();
    if (!s.dirty && s.latest) { adopt(s.latest); setNotice('Source refreshed automatically.'); remember(); }
  }
  function save() {
    const s = session.current;
    if (!s.base || s.pending) return;
    if (s.latest && (s.latest.version !== s.base.version || s.latest.source !== s.base.source)) { setNotice('Resolve the source conflict before saving. Your local tree can be exported.'); return; }
    s.pending = crypto.randomUUID(); render();
    documentHost!.postMessage({ type: 'save', requestId: s.pending, source: s.base.source, version: s.base.version, tree: serializeForest(s.forest) });
  }
  const s = session.current;
  if (!s.base) return <main><p role="status">Opening task document…</p></main>;
  const conflict = s.latest && (s.latest.source !== s.base.source || s.latest.version !== s.base.version);
  const toolbar = <section className="document-toolbar" aria-label="Document controls">
    <strong>{s.base.name}</strong><span>{s.dirty ? 'Unsaved tree changes' : 'Tree loaded'}{s.base.dirty ? ' · source editor has unsaved changes' : ''}</span>
    <button disabled={!!s.pending || !!conflict} onClick={save}>Save document</button>
    <button onClick={() => documentHost!.postMessage({ type: 'source' })}>Open source</button>
    <p>Save writes the checklist tree only. Headings, notes, and other unstructured text are omitted.</p>
    {notice && <p role={conflict ? 'alert' : 'status'}>{notice}</p>}
    {conflict && <button onClick={() => setConfirmReload(true)}>Reload source</button>}
    {confirmReload && <div role="alert"><p>Discard your unsaved tree and load the latest source? Export it first if needed.</p><button onClick={() => { if (s.latest) adopt(s.latest); remember(); setNotice('Latest source loaded.'); }}>Discard edits and reload</button><button onClick={() => setConfirmReload(false)}>Keep editing</button></div>}
  </section>;
  return <div inert={!!s.pending} aria-busy={!!s.pending}>
    <App key={generation} document={{ initialForest: s.forest, onChange: change, onSave: save,
      onExport: (forest, format) => documentHost!.postMessage({ type: 'export', tree: serializeForest(forest), format }),
      status: s.pending ? 'Saving…' : s.dirty ? 'Unsaved changes · Ctrl/Cmd+S to save' : 'Changes stay in this editor until Save', toolbar }} />
  </div>;
}
