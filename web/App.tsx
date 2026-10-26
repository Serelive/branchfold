import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { addNode, updateNode, serializeForest, parseForest, findNode, nodeLocation, nodePath, visibleNodes, deleteNode, moveNode, moveRelative, outlineMove, type OutlineMove, type Forest, type DropPosition } from './tree';
import { loadForest, saveForest } from './storage';
import NodeControl from './NodeControl';

function download(content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'branchfold-backup.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const flatten = (nodes: Forest) => visibleNodes(nodes, new Set());
type Snapshot = { forest: Forest; viewRootId: string | null; collapsed: Set<string>; selectedId: string | null };
type Drop = { id: string; position: DropPosition };

export default function App() {
  const [initial] = useState(() => {
    try { return { nodes: loadForest(localStorage), error: false }; }
    catch { return { nodes: [] as Forest, error: true }; }
  });
  const [forest, setForest] = useState(initial.nodes);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [saveError, setSaveError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initial.nodes[0]?.id ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewRootId, setViewRootId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const suppressControlClick = useRef<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [focusRequest, setFocusRequest] = useState<{ id: string; edit: boolean } | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<Forest | null>(null);
  const [importError, setImportError] = useState('');
  const [notice, setNotice] = useState('');
  const editor = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const importVersion = useRef(0);
  const editGroup = useRef<string | null>(null);
  const composing = useRef(false);
  const pointer = useRef<{ id: string; x: number; y: number; startX: number; startY: number; active: boolean } | null>(null);
  const dropRef = useRef<Drop | null>(null);
  const scope = viewRootId ? findNode(forest, viewRootId) : undefined;
  const shown = scope ? [scope] : forest;
  const visible = visibleNodes(shown, collapsed);
  const selected = selectedId ? findNode(forest, selectedId) : undefined;
  const deletion = pendingDelete ? findNode(forest, pendingDelete) : undefined;

  useEffect(() => {
    if (!focusRequest) return;
    const selector = focusRequest.edit ? '[data-node-id]' : '[data-row-id]';
    const element = Array.from(editor.current?.querySelectorAll<HTMLElement>(selector) ?? [])
      .find(item => (focusRequest.edit ? item.dataset.nodeId : item.dataset.rowId) === focusRequest.id);
    element?.focus();
  }, [focusRequest]);

  useEffect(() => {
    if (!draggedId) return;
    let frame: number;
    const scroll = () => {
      const y = pointer.current?.y ?? null;
      if (y !== null) {
        const speed = y < 72 ? -Math.ceil((72 - y) / 4) : y > innerHeight - 72 ? Math.ceil((y - innerHeight + 72) / 4) : 0;
        if (speed) { window.scrollBy(0, speed); if (pointer.current) previewDrop(pointer.current.x, y); }
      }
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [draggedId]);

  function snapshot(): Snapshot { return { forest, viewRootId, collapsed, selectedId }; }
  function save(next: Forest) {
    setForest(next);
    try { saveForest(localStorage, next); setSaveError(false); }
    catch { setSaveError(true); }
  }
  function change(next: Forest, editId: string | null = null) {
    if (next === forest) return;
    if (!editId || editGroup.current !== editId) setPast([...past, snapshot()].slice(-100));
    editGroup.current = editId;
    setFuture([]); save(next); setNotice('');
  }
  function focus(id: string, edit = false) {
    setActionsId(null);
    setSelectedId(id); setEditingId(edit ? id : null); setFocusRequest({ id, edit });
  }
  function restore(direction: 'undo' | 'redo') {
    const source = direction === 'undo' ? past : future;
    const next = source.at(-1); if (!next) return;
    editGroup.current = null;
    if (direction === 'undo') { setPast(past.slice(0, -1)); setFuture([...future, snapshot()]); }
    else { setFuture(future.slice(0, -1)); setPast([...past, snapshot()].slice(-100)); }
    save(next.forest); setViewRootId(next.viewRootId); setCollapsed(next.collapsed);
    setEditingId(null); setSelectedId(next.selectedId); setMovedId(null); setPendingDelete(null);
    if (next.selectedId) setFocusRequest({ id: next.selectedId, edit: false });
    setNotice(direction === 'undo' ? 'Change undone.' : 'Change redone.');
  }
  function expandPath(next: Forest, id: string) {
    const expanded = new Set(collapsed);
    nodePath(next, id).slice(0, -1).forEach(node => expanded.delete(node.id));
    setCollapsed(expanded);
  }
  function create(parentId: string | null, afterId?: string) {
    const id = crypto.randomUUID();
    let next = addNode(forest, parentId, id);
    if (afterId) {
      const location = nodeLocation(next, afterId)!;
      next = moveNode(next, id, parentId, location.index + 1);
    }
    change(next);
    if (afterId === viewRootId) setViewRootId(parentId);
    expandPath(next, id); focus(id, true);
  }
  function sibling(id: string) { create(nodeLocation(forest, id)!.parentId, id); }
  function applyMove(next: Forest, id: string, edit = false) {
    if (next === forest) return;
    change(next);
    const nextScope = viewRootId ? findNode(next, viewRootId) : undefined;
    const inView = visibleNodes(nextScope ? [nextScope] : next, collapsed).some(n => n.id === id);
    if (inView) { focus(id, edit); setMovedId(null); }
    else {
      setEditingId(null); setMovedId(id);
      const fallback = scope?.id ?? visible.find(n => n.id !== id)?.id;
      if (fallback) focus(fallback);
      setNotice('Moved outside the visible outline. Your view is unchanged.');
    }
  }
  function move(id: string, direction: OutlineMove, edit = false) {
    const next = outlineMove(forest, id, direction);
    // Indenting while editing should expose the new parent without expanding unrelated branches.
    if (edit && next !== forest) {
      expandPath(next, id);
      change(next);
      if (viewRootId && !findNode(findNode(next, viewRootId)?.children ?? [], id) && id !== viewRootId) {
        setEditingId(null); setMovedId(id); focus(viewRootId);
      } else focus(id, true);
    } else applyMove(next, id, edit);
  }
  function zoom(id: string | null) {
    setViewRootId(id); setEditingId(null);
    const target = id ?? forest[0]?.id;
    if (target) focus(target);
  }
  function toggleFold(id: string, close: boolean) {
    const next = new Set(collapsed); if (close) next.add(id); else next.delete(id);
    setCollapsed(next);
    if (close && selectedId && findNode(findNode(forest, id)?.children ?? [], selectedId)) focus(id);
  }
  function remove(id: string) {
    const path = nodePath(forest, id);
    const location = nodeLocation(forest, id)!;
    const next = deleteNode(forest, id);
    const target = location.siblings[location.index + 1]?.id ?? location.siblings[location.index - 1]?.id ?? location.parentId;
    change(next); setPendingDelete(null); setEditingId(null);
    if (viewRootId && !findNode(next, viewRootId)) setViewRootId(path.at(-2)?.id ?? null);
    if (target) focus(target); else setSelectedId(null);
    setNotice('Subtree deleted. Undo restores it, including descendants.');
  }
  function requestDelete(id: string) {
    if (findNode(forest, id)!.children.length) setPendingDelete(id); else remove(id);
  }
  async function readBackup(file: File) {
    const version = ++importVersion.current; setPendingImport(null); setImportError('');
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Backup exceeds the 2 MB import limit.');
      const nodes = parseForest(await file.text());
      if (version === importVersion.current) setPendingImport(nodes);
    } catch (error) {
      if (version === importVersion.current) setImportError(error instanceof Error ? error.message : 'Could not read backup.');
    }
  }
  function keyboard(event: KeyboardEvent) {
    if (actionsId && event.key === 'Escape') { event.preventDefault(); focus(actionsId); return; }
    if (pointer.current?.active) {
      if (event.key === 'Escape') { event.preventDefault(); endDrag(); }
      return;
    }
    if (initial.error || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>('[data-row-id]');
    const id = row?.dataset.rowId;
    const isTitle = target.matches('input[data-node-id]');
    const isRow = target === row;
    if (!isTitle && !isRow) {
      // A node control/button can select a node without putting a caret in its title.
      // Ctrl+arrows work here too; other keys retain the control's native behavior.
      if (id && !target.matches('select') && !event.altKey && !event.metaKey) {
        if (event.ctrlKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          event.preventDefault(); move(id, event.key === 'ArrowUp' ? 'up' : 'down');
        } else if (event.key === 'Escape') { event.preventDefault(); focus(id); }
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'z') {
      if (!isTitle) { event.preventDefault(); restore(event.shiftKey ? 'redo' : 'undo'); }
      return; // Native text undo is left to the browser while editing.
    }
    if (!id || event.altKey || event.metaKey) return;
    if (isTitle) {
      if (event.ctrlKey) return;
      if (event.key === 'Backspace' && !event.shiftKey && findNode(forest, id)?.title === '') {
        event.preventDefault(); requestDelete(id);
      }
      else if (event.key === 'Enter') { event.preventDefault(); sibling(id); }
      else if (event.key === 'Tab' && !event.ctrlKey) { event.preventDefault(); move(id, event.shiftKey ? 'outdent' : 'indent', true); }
      else if (event.key === 'Escape') { event.preventDefault(); editGroup.current = null; focus(id); }
      return;
    }
    if (event.ctrlKey) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); move(id, event.key === 'ArrowUp' ? 'up' : 'down'); }
      return;
    }
    const node = findNode(forest, id)!;
    const index = visible.findIndex(n => n.id === id);
    switch (event.key) {
      case 'ArrowUp': case 'ArrowDown': {
        event.preventDefault(); const next = visible[index + (event.key === 'ArrowUp' ? -1 : 1)]; if (next) focus(next.id); break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (node.children.length && !collapsed.has(id)) toggleFold(id, true);
        else { const parent = nodeLocation(forest, id)?.parentId; if (parent && visible.some(n => n.id === parent)) focus(parent); }
        break;
      }
      case 'ArrowRight':
        event.preventDefault();
        if (node.children.length && collapsed.has(id)) toggleFold(id, false);
        else if (node.children.length) focus(node.children[0].id);
        break;
      case 'Enter': case 'F2': event.preventDefault(); focus(id, true); break;
      case 'b': case 'B': event.preventDefault(); sibling(id); break;
      case 'c': case 'C': event.preventDefault(); create(id); break;
      case ' ': event.preventDefault(); change(updateNode(forest, id, n => ({ ...n, done: !n.done }))); break;
      case 'Backspace': event.preventDefault(); remove(id); break;
      case 'Delete': event.preventDefault(); requestDelete(id); break;
      case 'Escape': if (viewRootId) { event.preventDefault(); zoom(nodeLocation(forest, viewRootId)?.parentId ?? null); } break;
    }
  }
  function previewDrop(x: number, y: number) {
    const hit = document.elementFromPoint(x, y);
    const tail = hit?.closest<HTMLElement>('[data-tail-id]');
    const row = hit?.closest<HTMLElement>('[data-row-id]');
    const id = tail?.dataset.tailId ?? row?.dataset.rowId;
    const sourceId = pointer.current?.id;
    const source = sourceId ? findNode(forest, sourceId) : undefined;
    let next: Drop | null = null;
    if (id && source && id !== sourceId && !findNode(source.children, id)) {
      const rect = row?.getBoundingClientRect();
      const ratio = rect ? (y - rect.top) / rect.height : 1;
      next = { id, position: tail ? 'after' : ratio < .25 ? 'before' : ratio > .75 ? 'after' : 'inside' };
    }
    if (next?.id !== dropRef.current?.id || next?.position !== dropRef.current?.position) {
      dropRef.current = next; setDrop(next);
    }
  }
  function pointerDown(event: PointerEvent, id: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    suppressControlClick.current = null;
    pointer.current = { id, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, active: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    focus(id);
  }
  function pointerMove(event: PointerEvent) {
    const current = pointer.current; if (!current) return;
    current.x = event.clientX; current.y = event.clientY;
    if (!current.active && Math.hypot(current.x - current.startX, current.y - current.startY) < 5) return;
    current.active = true; suppressControlClick.current = current.id; setDraggedId(current.id); previewDrop(current.x, current.y);
  }
  function endDrag() { pointer.current = null; dropRef.current = null; setDraggedId(null); setDrop(null); }
  function pointerUp(event: PointerEvent) {
    const current = pointer.current;
    if (current?.active) {
      previewDrop(event.clientX, event.clientY);
      const target = dropRef.current;
      if (target) applyMove(moveRelative(forest, current.id, target.id, target.position), current.id);
    }
    endDrag();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function renderNodes(nodes: Forest, level = 1) {
    return <ul className="nodes" role={level === 1 ? 'tree' : 'group'} aria-label={level === 1 ? 'Outline' : undefined}>{nodes.map(node => {
      const location = nodeLocation(forest, node.id)!;
      const label = node.title || 'untitled task';
      const closed = collapsed.has(node.id);
      const preview = drop?.id === node.id ? `drop-${drop.position}` : '';
      const actionsOpen = actionsId === node.id;
      const act = (action: () => void) => { setActionsId(null); action(); };
      return <li key={node.id} role="none" className={`branch ${preview}`}>
        <div className={`row-shell ${actionsOpen ? 'revealed' : ''}`}>
        <div role="treeitem" aria-label={label} aria-level={level} aria-selected={selectedId === node.id}
          aria-expanded={node.children.length ? !closed : undefined} data-row-id={node.id}
          tabIndex={selectedId === node.id || (!selectedId && visible[0]?.id === node.id) ? 0 : -1}
          className={`node ${node.done ? 'done' : ''} ${selectedId === node.id ? 'active' : ''} ${draggedId === node.id ? 'dragging' : ''}`}
          onFocusCapture={() => setSelectedId(node.id)}
          onFocus={event => { if (event.target === event.currentTarget) { setSelectedId(node.id); setEditingId(null); } }}
          onClick={event => { if (event.target === event.currentTarget) focus(node.id); }}
          >
          <NodeControl title={label} done={node.done} expanded={!closed} hasChildren={!!node.children.length}
            setExpanded={expanded => toggleFold(node.id, !expanded)}
            toggleDone={() => change(updateNode(forest, node.id, n => ({ ...n, done: !n.done })))}
            ignoreClick={() => suppressControlClick.current === node.id}
            onPointerDown={event => pointerDown(event, node.id)} onPointerMove={pointerMove} onPointerUp={pointerUp}
            onPointerCancel={endDrag} onLostPointerCapture={endDrag} />
          <input className="title" data-node-id={node.id} aria-label="Task title" placeholder="An unfinished thought…"
            readOnly={editingId !== node.id} tabIndex={editingId === node.id ? 0 : -1}
            value={node.title} onClick={() => focus(node.id, true)}
            onBlur={() => { editGroup.current = null; setEditingId(current => current === node.id ? null : current); }}
            onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
            onChange={event => change(updateNode(forest, node.id, n => ({ ...n, title: event.target.value })), node.id)} />
          <button className="row-action" aria-label={`Add sibling after ${label}`} title="Add sibling (B in navigation)" onClick={() => sibling(node.id)}>+ Next</button>
          <button className="row-action" aria-label={`Add child to ${label}`} title="Add child (C in navigation)" onClick={() => create(node.id)}>+ Child</button>
          <button className="row-action" aria-label={`Focus subtree ${label}`} title="Focus subtree" onClick={() => zoom(node.id)}>↗</button>
          <button className="actions-trigger" aria-label={`${actionsOpen ? 'Close' : 'Actions for'} ${label}`}
            aria-expanded={actionsOpen} title={actionsOpen ? 'Close actions' : 'Reveal actions'}
            onClick={() => setActionsId(actionsOpen ? null : node.id)}>{actionsOpen ? '›' : '‹'}</button>
        </div>
        <div className="action-panel" role="group" aria-label={`Actions for ${label}`} aria-hidden={!actionsOpen} inert={!actionsOpen}
          onFocusCapture={() => setSelectedId(node.id)}>
          <button aria-label="Move up" title="Move up" disabled={location.index === 0} onClick={() => act(() => move(node.id, 'up'))}>↑</button>
          <button aria-label="Move down" title="Move down" disabled={location.index === location.siblings.length - 1} onClick={() => act(() => move(node.id, 'down'))}>↓</button>
          <button aria-label="Indent" title="Indent" disabled={location.index === 0} onClick={() => act(() => move(node.id, 'indent'))}>→</button>
          <button aria-label="Outdent" title="Outdent" disabled={location.parentId === null} onClick={() => act(() => move(node.id, 'outdent'))}>←</button>
          <select aria-label={`Move ${label} into`} value="" onChange={event => {
            const parentId = event.target.value === 'root' ? null : event.target.value.slice(5);
            const destination = parentId === null ? forest : findNode(forest, parentId)!.children;
            act(() => applyMove(moveNode(forest, node.id, parentId, destination.length - (location.parentId === parentId ? 1 : 0)), node.id));
          }}><option value="" disabled>Move into…</option><option value="root">Root level</option>
            {flatten(forest).filter(item => item.id !== node.id && !findNode(node.children, item.id)).map(item => <option key={item.id} value={`node:${item.id}`}>{nodePath(forest, item.id).map(n => n.title || 'Untitled').join(' / ')}</option>)}
          </select>
          <button className="danger" aria-label="Delete subtree" title="Delete subtree" onClick={() => act(() => requestDelete(node.id))}>Delete</button>
        </div>
        </div>
        {node.children.length > 0 && !closed && renderNodes(node.children, level + 1)}
        <div className="drop-tail" data-tail-id={node.id} aria-hidden="true" />
      </li>;
    })}</ul>;
  }

  return <main onKeyDown={keyboard}>
    <header><div className="brand">⤷ Branchfold <span lang="zh">丛序</span></div><span className="badge">LOCAL PROTOTYPE</span></header>
    <section className="intro"><p className="eyebrow">A LITTLE STRUCTURE. ROOM TO CHANGE.</p><h1>Make room for the next step.</h1><p>A living task tree for plans that evolve with action.</p></section>
    {initial.error ? <section role="alert" className="warning"><h2>Your saved tree could not be opened.</h2><p>Editing is paused to protect existing data. Storage may be unavailable, or the saved format may be invalid. No data has been overwritten. Restore browser storage access or recover the original data before reloading.</p></section> : <>
      <section className={`workspace ${draggedId ? 'is-dragging' : ''}`} aria-label="Task tree" ref={editor}>
        <div className="toolbar"><h2>Your task tree</h2><div className="toolbar-buttons">
          <button disabled={!past.length} onClick={() => restore('undo')}>Undo</button><button disabled={!future.length} onClick={() => restore('redo')}>Redo</button>
          <button onClick={() => download(serializeForest(forest))}>Export JSON</button><button onClick={() => fileInput.current?.click()}>Import JSON</button>
          <input ref={fileInput} type="file" hidden accept=".json,application/json" aria-label="JSON backup" onChange={event => { const file = event.target.files?.[0]; if (file) void readBackup(file); event.target.value = ''; }} />
        </div></div>
        <p className="mode" aria-live="polite">{editingId ? 'Editing · Enter: next sibling · Tab / Shift+Tab: indent / outdent · Esc: navigate' : 'Navigation · Enter: edit · B: sibling · C: child · Space: complete · Ctrl+↑/↓: move'}{selected && ` · ${selected.title || 'Untitled task'}`}</p>
        {importError && <p role="alert" className="warning">Backup not imported: {importError}</p>}
        {pendingImport !== null && <section className="import-preview" aria-label="Backup preview">
          <h3>{forest.length ? 'Replace the current tree?' : 'Import this tree?'}</h3>
          <p>{flatten(pendingImport).length} tasks in {pendingImport.length} roots. {forest.length ? 'Current work will be replaced. Export it first if needed.' : 'The imported tasks will fill your empty outline.'} Undo is available until you close this page.</p>
          <ul>{pendingImport.slice(0, 5).map(node => <li key={node.id}>{node.title || 'Untitled task'}</li>)}</ul>
          <button onClick={() => { change(pendingImport); setPendingImport(null); setViewRootId(null); setCollapsed(new Set()); setMovedId(null); setPendingDelete(null); setEditingId(null); setSelectedId(pendingImport[0]?.id ?? null); setNotice('Backup imported. Undo is available.'); }}>{forest.length ? 'Replace tree' : 'Import tree'}</button>
          <button onClick={() => { importVersion.current++; setPendingImport(null); }}>Cancel import</button>
        </section>}
        {deletion && <section className="warning" aria-label="Delete confirmation"><p>Delete “{deletion.title || 'Untitled task'}” and its {flatten(deletion.children).length} descendants? Undo can recover them during this session.</p>
          <button onClick={() => remove(deletion.id)}>Delete with descendants</button><button onClick={() => { setPendingDelete(null); focus(deletion.id); }}>Cancel deletion</button></section>}
        <nav aria-label="Subtree navigation"><button onClick={() => zoom(null)}>All tasks</button>
          {scope && nodePath(forest, scope.id).map(node => <span key={node.id}> / <button aria-current={node.id === viewRootId ? 'page' : undefined} onClick={() => zoom(node.id)}>{node.title || 'Untitled task'}</button></span>)}
        </nav>
        {movedId && findNode(forest, movedId) && <button className="goto" onClick={() => { setViewRootId(null); expandPath(forest, movedId); focus(movedId); setMovedId(null); }}>Go to moved node</button>}
        {forest.length ? renderNodes(shown) : <div className="empty"><h3>Start with a rough objective.</h3><p>Capture a thought, then break it into smaller steps as you go.</p></div>}
        <button className="primary" onClick={() => create(scope?.id ?? null)}>{scope ? '+ Add task in this subtree' : '+ Add root task'}</button>
        {draggedId && <p className="drag-status" role="status">{drop ? `Drop ${drop.position} ${findNode(forest, drop.id)?.title || 'untitled task'}` : 'Choose a target outside the dragged subtree. Esc cancels.'}</p>}
      </section>
      <p role="status" className={saveError ? 'warning' : 'save-status'}>{saveError ? 'Changes are only in memory: browser storage could not save them. Export JSON before leaving.' : 'Saved in this browser · No account or connection needed'}{notice && ` · ${notice}`}</p>
      <details className="help"><summary>Keyboard and recovery</summary><p>Click a title to edit, or a row background to select. The left control expands on click, completes on double-click, and moves on drag. The dark right edge slides the row aside to reveal actions; Escape closes them. Arrows navigate visible tasks. Left collapses or selects a parent; Right expands or selects a child. Escape leaves editing, then steps to the parent view. F2 also edits. In navigation, Backspace directly removes the selected subtree; Undo restores it. Delete requests deletion with confirmation for parents. While editing, Backspace removes an empty task; nonempty titles keep normal text behavior. Parents require confirmation.</p><p>Ctrl/Cmd+Z (Shift to redo) applies to outline history in navigation mode. Text fields retain native text undo. Use Tab to navigate controls outside editing; Escape leaves title editing before tabbing away. Buttons and the sliding action tray remain available when shortcuts conflict with your system.</p><p>Undo retains 100 changes in this session. Export important work before closing. Completion applies only to the task itself.</p></details>
    </>}
    <footer>Plans are provisional. Keep them useful.</footer>
  </main>;
}
