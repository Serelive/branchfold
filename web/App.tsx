import { useEffect, useRef, useState } from 'react';
import { addNode, updateNode, serializeForest, type Forest, type TaskNode } from './tree';
import { loadForest, saveForest } from './storage';

function download(content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'branchfold-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [initial] = useState(() => {
    try { return { nodes: loadForest(localStorage), error: false }; }
    catch { return { nodes: [] as Forest, error: true }; }
  });
  const [forest, setForest] = useState(initial.nodes);
  const [saveError, setSaveError] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusId) {
      editor.current?.querySelector<HTMLInputElement>(`[data-node-id="${focusId}"]`)?.focus();
    }
  }, [focusId]);

  function change(next: Forest) {
    setForest(next);
    try { saveForest(localStorage, next); setSaveError(false); }
    catch { setSaveError(true); }
  }
  function create(parentId: string | null) {
    const id = crypto.randomUUID();
    change(addNode(forest, parentId, id));
    setFocusId(id);
  }
  function renderNodes(nodes: Forest) {
    return <ul className="nodes">{nodes.map((node: TaskNode) => <li key={node.id}>
      <div className={`node ${node.done ? 'done' : ''}`}>
        <input type="checkbox" checked={node.done} aria-label={`Complete ${node.title || 'untitled task'}`}
          onChange={() => change(updateNode(forest, node.id, n => ({ ...n, done: !n.done })))} />
        <input className="title" data-node-id={node.id} aria-label="Task title" placeholder="An unfinished thought…"
          value={node.title} onChange={event => change(updateNode(forest, node.id, n => ({ ...n, title: event.target.value })))}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} />
        <button className="child" aria-label={`Add child to ${node.title || 'untitled task'}`} onClick={() => create(node.id)}>+ Child</button>
      </div>
      {node.children.length > 0 && renderNodes(node.children)}
    </li>)}</ul>;
  }

  return <main>
    <header><div className="brand">⤷ Branchfold <span lang="zh">丛序</span></div><span className="badge">LOCAL PROTOTYPE</span></header>
    <section className="intro"><p className="eyebrow">A LITTLE STRUCTURE. ROOM TO CHANGE.</p>
      <h1>Make room for the next step.</h1><p>A living task tree for plans that evolve with action.</p></section>
    {initial.error ? <section role="alert" className="warning"><h2>Your saved tree could not be opened.</h2>
      <p>Editing is paused to protect existing data. Storage may be unavailable, or the saved format may be invalid. No data has been overwritten. Restore browser storage access or recover the original data before reloading.</p>
      </section> : <>
      <section className="workspace" aria-label="Task tree" ref={editor}>
        <div className="toolbar"><h2>Your task tree</h2><button onClick={() => download(serializeForest(forest))}>Export JSON</button></div>
        {forest.length ? renderNodes(forest) : <div className="empty"><h3>Start with a rough objective.</h3><p>Capture a thought, then break it into smaller steps as you go.</p></div>}
        <button className="primary" onClick={() => create(null)}>+ Add root task</button>
      </section>
      <p role="status" className={saveError ? 'warning' : 'save-status'}>{saveError ? 'Changes are only in memory: browser storage could not save them. Export JSON before leaving.' : 'Saved in this browser · No account or connection needed'}</p>
      <p className="hint">Edit titles directly. Tab moves between controls. Each checkbox completes only its own task.</p>
      <p className="hint">Browser storage can be cleared. Export a backup for important work; importing backups is not available in this slice.</p>
    </>}
    <footer>Plans are provisional. Keep them useful.</footer>
  </main>;
}
