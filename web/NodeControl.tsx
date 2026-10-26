import { useEffect, useRef, type PointerEventHandler } from 'react';

type Props = {
  title: string;
  done: boolean;
  expanded: boolean;
  hasChildren: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleDone: () => void;
  ignoreClick: () => boolean;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
  onLostPointerCapture: PointerEventHandler<HTMLButtonElement>;
};

export default function NodeControl({ title, done, expanded, hasChildren, setExpanded, toggleDone, ignoreClick, ...pointerHandlers }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstExpanded = useRef(expanded);
  const clearClick = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  return <button {...pointerHandlers} className="drag-handle node-control" aria-label={`Node control ${title}`}
    aria-pressed={done} aria-expanded={hasChildren ? expanded : undefined}
    title="Click: expand/collapse · Double-click: complete/reopen · Drag: move"
    onClick={event => {
      // Keyboard activation has no double-click ambiguity.
      if (event.detail === 0) { clearClick(); if (hasChildren) setExpanded(!expanded); return; }
      if (ignoreClick()) { clearClick(); return; }
      if (event.detail !== 1) return;
      clearClick(); firstExpanded.current = expanded;
      timer.current = setTimeout(() => {
        timer.current = null;
        if (!ignoreClick() && hasChildren) setExpanded(!firstExpanded.current);
      }, 150);
    }}
    onDoubleClick={() => {
      clearClick(); if (ignoreClick()) return;
      // Also restore the original view for slower OS double-click intervals.
      if (hasChildren) setExpanded(firstExpanded.current);
      toggleDone();
    }}>
    <span className={`task-anchor ${hasChildren ? 'parent' : ''} ${!expanded ? 'folded' : ''} ${done ? 'checked' : ''}`} aria-hidden="true">
      <span className="anchor-inner" />
      <span className="anchor-check">✓</span>
    </span>
  </button>;
}
