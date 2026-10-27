import { useEffect, useMemo, useRef, useState } from 'react';
import { decodeMarkdown, parseMarkdown, type MarkdownTask } from './markdown';
import { documentHost, type DocumentSnapshot, type HostMessage } from './documentHost';

export default function MarkdownView({ onClose }: { onClose?: () => void }) {
  const [snapshot, setSnapshot] = useState<DocumentSnapshot | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [folded, setFolded] = useState(new Set<string>());
  const [detailed, setDetailed] = useState(false);
  const [draft, setDraft] = useState<{ id: string; title: string; source: string; version: number } | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const loadId = useRef(0);
  const doc = useMemo(() => parseMarkdown(snapshot?.source ?? ''), [snapshot?.source]);
  useEffect(() => {
    if (!documentHost) return;
    const receive = (event: MessageEvent<HostMessage>) => {
      const data = event.data;
      if (data.type === 'snapshot') {
        setSnapshot(data.document); setSelected(null); setScope(null); setFolded(new Set());
      }
      if (data.type === 'result') { setBusy(false); setNotice(data.message); if (data.ok && data.operation === 'rename') setDraft(null); }
    };
    window.addEventListener('message', receive); documentHost?.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', receive);
  }, []);
  const root = doc.tasks.find(t => t.id === scope);
  const contains = (a: MarkdownTask, b: MarkdownTask) => b.start > a.start && b.start < a.end;
  const visible = doc.tasks.filter(t => (!root || t === root || contains(root, t)) && !doc.tasks.some(p => folded.has(p.id) && contains(p, t) && (!root || p.start >= root.start)));
  function edit(task: MarkdownTask) {
    setSelected(task.id);
    if (documentHost && task.editable && snapshot) setDraft({ id: task.id, title: task.title, source: snapshot.source, version: snapshot.version });
  }
  function select(id: string) {
    setSelected(id);
    requestAnimationFrame(() => document.getElementById(`md-${id}`)?.focus());
  }
  function download() {
    if (!snapshot) return;
    const url = URL.createObjectURL(new Blob([snapshot.source], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = snapshot.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="markdown-view">
    <header><div className="brand">⤷ Branchfold <span>Markdown</span></div>{onClose && <button onClick={onClose}>Legacy JSON editor</button>}</header>
    <div className="md-toolbar">
      {!documentHost && <label>Open Markdown<input aria-label="Open Markdown" type="file" accept=".md,.markdown,text/markdown,text/plain" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        const request = ++loadId.current;
        try {
          if (file.size > 2 * 1024 * 1024) throw new Error('Choose a Markdown file under 2 MB.');
          const source = decodeMarkdown(await file.arrayBuffer());
          if (request !== loadId.current) return;
          setSnapshot({ source, version: 0, name: file.name, dirty: false });
          setSelected(null); setScope(null); setFolded(new Set()); setNotice(''); setDraft(null);
        } catch (error) { if (request === loadId.current) setNotice(String(error)); }
        e.target.value = '';
      }} /></label>}
      <button aria-pressed={detailed} onClick={() => setDetailed(!detailed)}>Detailed context</button>
      <button onClick={() => setScope(null)}>All tasks</button>
      {documentHost && <><button onClick={() => documentHost?.postMessage({ type: 'refresh' })}>Refresh</button><button onClick={() => documentHost?.postMessage({ type: 'source' })}>Open source / Undo</button><button disabled={busy} onClick={() => { setBusy(true); documentHost?.postMessage({ type: 'save' }); }}>Save document</button></>}
      {snapshot && !documentHost && <button onClick={download}>Download source copy</button>}
    </div>
    <p>{snapshot ? `${snapshot.name}${snapshot.dirty ? ' · unsaved changes in VS Code' : ''}` : 'Open a project task document to begin.'} {!documentHost && 'Browser preview is read-only. Use the VS Code host to rename tasks.'}</p>
    {notice && <p role="status">{notice}</p>}
    {root && <nav aria-label="Subtree path">{doc.tasks.filter(t => contains(t, root)).map(t => <button key={t.id} onClick={() => setScope(t.id)}>{t.title}</button>)}<strong>{root.title}</strong></nav>}
    {draft && <form onSubmit={e => { e.preventDefault(); if (busy) return; setBusy(true); documentHost?.postMessage({ type: 'rename', ...draft }); }}>
      <label>Task Markdown title<input autoFocus aria-label="Task Markdown title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} onKeyDown={e => {
        if (e.key === 'Escape') { setDraft(null); e.preventDefault(); }
        if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
      }} /></label>
      <button disabled={busy}>Apply rename</button><button type="button" disabled={busy} onClick={() => setDraft(null)}>Cancel</button>
      {snapshot?.version !== draft.version && <p role="alert">The document changed. Your draft is retained; reopen the task after reviewing the source.</p>}
    </form>}
    <section role="tree" aria-label="Markdown task tree">
      {doc.blocks.map((block, index) => {
        if (block.kind !== 'task') {
          if (root && (block.start < root.start || block.start >= root.end)) return null;
          if (doc.tasks.some(p => folded.has(p.id) && block.start >= p.lineEnd && block.start < p.end && (!root || p.start >= root.start))) return null;
          const text = doc.source.slice(block.start, block.end);
          if (!text.trim()) return null;
          if (block.kind === 'heading') return <h2 className="md-heading" key={index}>{text.replace(/^ {0,3}#{1,6}\s+/, '')}</h2>;
          return detailed ? <pre className="md-context" key={index}>{text}</pre> : <details className="md-context" key={index}><summary>Document context</summary><pre>{text}</pre></details>;
        }
        const t = block.task;
        if (!visible.includes(t)) return null;
        const children = doc.tasks.some(child => child.parent === t.id);
        return <div key={t.id} id={`md-${t.id}`} role="treeitem" aria-level={t.depth + 1} aria-selected={selected === t.id} aria-expanded={children ? !folded.has(t.id) : undefined} tabIndex={selected === t.id || (!selected && visible[0] === t) ? 0 : -1} className={`md-task ${selected === t.id ? 'selected' : ''}`} style={{ marginLeft: `${(t.depth - (root?.depth ?? 0)) * 1.5}rem` }} onClick={() => setSelected(t.id)} onKeyDown={e => {
          if (e.target !== e.currentTarget) return;
          const i = visible.indexOf(t);
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); select(visible[Math.max(0, Math.min(visible.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].id); }
          if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); edit(t); }
          if (e.key === 'ArrowRight') { e.preventDefault(); setFolded(s => { const n = new Set(s); n.delete(t.id); return n; }); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); setFolded(s => new Set(s).add(t.id)); }
          if (e.key === 'Escape') setScope(root?.parent ?? null);
        }}>
          <button aria-label={`${folded.has(t.id) ? 'Expand' : 'Collapse'} ${t.title}`} disabled={!children} onClick={() => setFolded(s => { const n = new Set(s); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; })}>{t.done ? '●' : children ? (folded.has(t.id) ? '⊕' : '⊖') : '○'}</button>
          <span className={t.done ? 'md-done' : ''}>{t.title}</span><span className="sr-only">{t.done ? 'Completed' : 'Incomplete'}</span>
          <button aria-label={`Focus ${t.title}`} onClick={() => { setScope(t.id); setFolded(s => { const n = new Set(s); n.delete(t.id); return n; }); }}>↗</button>
          {documentHost && <button disabled={!t.editable || busy} onClick={() => edit(t)}>Rename</button>}
        </div>;
      })}
      {snapshot && !doc.tasks.length && <p>No supported checklist tasks. The document context remains available above.</p>}
    </section>
  </main>;
}
