import { useEffect, useRef, useState } from 'react';
import { addNode, updateNode, serializeForest, parseForest, findNode, nodeLocation, deleteNode, moveNode, outlineMove, type OutlineMove, type Forest } from './tree';
import { loadForest, saveForest } from './storage';

function download(content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'branchfold-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function flatten(nodes: Forest, depth = 0): { id: string; title: string }[] {
  return nodes.flatMap(node => [{ id: node.id, title: `${'— '.repeat(depth)}${node.title || 'Untitled task'}` }, ...flatten(node.children, depth + 1)]);
}

export default function App() {
  const [initial] = useState(() => {
    try { return { nodes: loadForest(localStorage), error: false }; }
    catch { return { nodes: [] as Forest, error: true }; }
  });
  const [forest, setForest] = useState(initial.nodes);
  const [past, setPast] = useState<Forest[]>([]);
  const [future, setFuture] = useState<Forest[]>([]);
  const [saveError, setSaveError] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pendingImport, setPendingImport] = useState<Forest | null>(null);
  const [importError, setImportError] = useState('');
  const [notice, setNotice] = useState('');
  const editor = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const importVersion = useRef(0);
  const editingId = useRef<string | null>(null);
  const scope = scopeId ? findNode(forest, scopeId) : undefined;

  useEffect(() => {
    if (focusRequest) {
      // Imported IDs may contain CSS punctuation, so compare attributes directly.
      const input = Array.from(editor.current?.querySelectorAll<HTMLInputElement>('[data-node-id]') ?? [])
        .find(element => element.dataset.nodeId === focusRequest.id);
      input?.focus();
    }
  }, [focusRequest]);

  function save(next: Forest) {
    setForest(next);
    try { saveForest(localStorage, next); setSaveError(false); }
    catch { setSaveError(true); }
  }
  function change(next: Forest, editId: string | null = null) {
    if (next === forest) return;
    if (!editId || editingId.current !== editId) setPast([...past, forest].slice(-100));
    editingId.current = editId;
    setFuture([]);
    save(next);
  }
  function restore(direction: 'undo' | 'redo') {
    editingId.current = null;
    const source = direction === 'undo' ? past : future;
    const next = source.at(-1);
    if (!next) return;
    if (direction === 'undo') { setPast(past.slice(0, -1)); setFuture([...future, forest]); }
    else { setFuture(future.slice(0, -1)); setPast([...past, forest].slice(-100)); }
    save(next);
    setScopeId(null);
    setCollapsed(new Set());
    setNotice(direction === 'undo' ? 'Change undone.' : 'Change redone.');
  }
  function reveal(id: string) {
    setCollapsed(new Set());
    setFocusRequest({ id });
  }
  function create(parentId: string | null) {
    const id = crypto.randomUUID();
    change(addNode(forest, parentId, id));
    reveal(id);
  }
  function move(id: string, direction: OutlineMove) {
    const next = outlineMove(forest, id, direction);
    if (next === forest) return;
    change(next);
    // Keep a moved node visible, including when it leaves the focused subtree.
    setScopeId(null);
    reveal(id);
  }
  function remove(id: string) {
    const location = nodeLocation(forest, id)!;
    const nextFocus = location.siblings[location.index + 1]?.id ?? location.siblings[location.index - 1]?.id ?? location.parentId;
    change(deleteNode(forest, id));
    setNotice('Subtree deleted. Use Undo to recover it before closing this page.');
    if (scope && (scope.id === id || findNode(findNode(forest, id)!.children, scope.id))) setScopeId(null);
    if (nextFocus) reveal(nextFocus);
    else setFocusRequest(null);
  }
  async function readBackup(file: File) {
    const version = ++importVersion.current;
    setPendingImport(null);
    setImportError('');
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Backup exceeds the 2 MB import limit.');
      const nodes = parseForest(await file.text());
      if (version === importVersion.current) setPendingImport(nodes);
    } catch (error) {
      if (version === importVersion.current) setImportError(error instanceof Error ? error.message : 'Could not read backup.');
    }
  }
  function renderNodes(nodes: Forest) {
    return <ul className="nodes">{nodes.map(node => {
      const location = nodeLocation(forest, node.id)!;
      const label = node.title || 'untitled task';
      const isCollapsed = collapsed.has(node.id);
      return <li key={node.id}>
        <div className={`node ${node.done ? 'done' : ''} ${activeId === node.id ? 'active' : ''}`}
          onFocusCapture={() => setActiveId(node.id)}>
          <button className="fold" disabled={!node.children.length} aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${label}`}
            aria-expanded={node.children.length ? !isCollapsed : undefined} onClick={() => {
              const next = new Set(collapsed); if (isCollapsed) next.delete(node.id); else next.add(node.id); setCollapsed(next);
            }}>{node.children.length ? (isCollapsed ? '▸' : '▾') : '·'}</button>
          <input type="checkbox" checked={node.done} aria-label={`Complete ${label}`}
            onChange={() => change(updateNode(forest, node.id, n => ({ ...n, done: !n.done })))} />
          <input className="title" data-node-id={node.id} aria-label="Task title" placeholder="An unfinished thought…"
            value={node.title} onBlur={() => { editingId.current = null; }}
            onChange={event => change(updateNode(forest, node.id, n => ({ ...n, title: event.target.value })), node.id)}
            onKeyDown={event => {
              const directions: Record<string, OutlineMove> = { ArrowUp: 'up', ArrowDown: 'down', ArrowRight: 'indent', ArrowLeft: 'outdent' };
              if (event.altKey && directions[event.key]) { event.preventDefault(); move(node.id, directions[event.key]); }
              else if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
            }} />
          <button className="child" aria-label={`Add child to ${label}`} onClick={() => create(node.id)}>+ Child</button>
          <details className="actions"><summary aria-label={`Actions for ${label}`}>•••</summary><div className="action-panel">
            <button disabled={location.index === 0} onClick={() => move(node.id, 'up')}>Move up</button>
            <button disabled={location.index === location.siblings.length - 1} onClick={() => move(node.id, 'down')}>Move down</button>
            <button disabled={location.index === 0} onClick={() => move(node.id, 'indent')}>Indent</button>
            <button disabled={location.parentId === null} onClick={() => move(node.id, 'outdent')}>Outdent</button>
            <label>Move into<select aria-label={`Move ${label} into`} value="" onChange={event => {
              const parentId = event.target.value === 'root' ? null : event.target.value.slice(5);
              const destination = parentId === null ? forest : findNode(forest, parentId)!.children;
              const index = destination.length - (location.parentId === parentId ? 1 : 0);
              change(moveNode(forest, node.id, parentId, index)); setScopeId(null); reveal(node.id);
            }}><option value="" disabled>Choose parent…</option><option value="root">Root level</option>
              {flatten(forest).filter(item => item.id !== node.id && !findNode(node.children, item.id)).map(item => <option key={item.id} value={`node:${item.id}`}>{item.title}</option>)}
            </select></label>
            <button onClick={() => { setScopeId(node.id); reveal(node.id); }}>Focus subtree</button>
            <button className="danger" onClick={() => remove(node.id)}>Delete subtree</button>
          </div></details>
        </div>
        {node.children.length > 0 && !isCollapsed && renderNodes(node.children)}
      </li>;
    })}</ul>;
  }

  return <main onKeyDown={event => {
    if (initial.error) return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'z') {
      event.preventDefault(); restore(event.shiftKey ? 'redo' : 'undo');
    }
  }}>
    <header><div className="brand">⤷ Branchfold <span lang="zh">丛序</span></div><span className="badge">LOCAL PROTOTYPE</span></header>
    <section className="intro"><p className="eyebrow">A LITTLE STRUCTURE. ROOM TO CHANGE.</p>
      <h1>Make room for the next step.</h1><p>A living task tree for plans that evolve with action.</p></section>
    {initial.error ? <section role="alert" className="warning"><h2>Your saved tree could not be opened.</h2>
      <p>Editing is paused to protect existing data. Storage may be unavailable, or the saved format may be invalid. No data has been overwritten. Restore browser storage access or recover the original data before reloading.</p>
    </section> : <>
      <section className="workspace" aria-label="Task tree" ref={editor}>
        <div className="toolbar"><h2>Your task tree</h2><div className="toolbar-buttons">
          <button disabled={!past.length} onClick={() => restore('undo')}>Undo</button>
          <button disabled={!future.length} onClick={() => restore('redo')}>Redo</button>
          <button onClick={() => download(serializeForest(forest))}>Export JSON</button>
          <button onClick={() => fileInput.current?.click()}>Import JSON</button>
          <input ref={fileInput} type="file" hidden accept=".json,application/json" aria-label="JSON backup" onChange={event => {
            const file = event.target.files?.[0]; if (file) void readBackup(file); event.target.value = '';
          }} />
        </div></div>
        {importError && <p role="alert" className="warning">Backup not imported: {importError}</p>}
        {pendingImport !== null && <section className="import-preview" aria-label="Backup preview">
          <h3>Replace the current tree?</h3><p>{flatten(pendingImport).length} tasks in {pendingImport.length} roots. Current work will be replaced. Export it first if needed. Undo is available until you close this page.</p>
          <ul>{pendingImport.slice(0, 5).map(node => <li key={node.id}>{node.title || 'Untitled task'}</li>)}</ul>
          <button onClick={() => { change(pendingImport); setPendingImport(null); setScopeId(null); setCollapsed(new Set()); setNotice('Backup restored. Undo can recover the previous tree.'); }}>Replace tree</button>
          <button onClick={() => { importVersion.current++; setPendingImport(null); }}>Cancel import</button>
        </section>}
        {scope && <nav aria-label="Subtree navigation"><button onClick={() => setScopeId(null)}>All tasks</button>
          <span> / {scope.title || 'Untitled task'}</span>
          {nodeLocation(forest, scope.id)?.parentId && <button onClick={() => setScopeId(nodeLocation(forest, scope.id)!.parentId)}>Parent subtree</button>}
        </nav>}
        {forest.length ? renderNodes(scope ? [scope] : forest) : <div className="empty"><h3>Start with a rough objective.</h3><p>Capture a thought, then break it into smaller steps as you go.</p></div>}
        <button className="primary" onClick={() => create(scope?.id ?? null)}>{scope ? '+ Add task in this subtree' : '+ Add root task'}</button>
      </section>
      <p role="status" className={saveError ? 'warning' : 'save-status'}>{saveError ? 'Changes are only in memory: browser storage could not save them. Export JSON before leaving.' : 'Saved in this browser · No account or connection needed'}{notice && ` · ${notice}`}</p>
      <p className="hint">Edit titles directly. Alt + ↑/↓ reorders; Alt + →/← indents/outdents. Ctrl/Cmd + Z undoes; add Shift to redo.</p>
      <p className="hint">Each checkbox completes only its own task. Undo keeps the last 100 edits in this session. Export important work; browser storage can be cleared.</p>
    </>}
    <footer>Plans are provisional. Keep them useful.</footer>
  </main>;
}
