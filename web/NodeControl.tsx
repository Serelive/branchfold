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
  const held = useRef(false);
  const clearPress = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => {
    const cancel = () => { clearPress(); held.current = true; };
    const keyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', keyDown);
    return () => { clearPress(); window.removeEventListener('blur', cancel); window.removeEventListener('keydown', keyDown); };
  }, []);
  return <button className="drag-handle node-control" aria-label={`Node control ${title}`}
    aria-pressed={done} aria-expanded={hasChildren ? expanded : undefined}
    title="Click: expand/collapse · Long-press: complete/reopen · Drag: move"
    onPointerDown={event => {
      if (event.button !== 0 || event.isPrimary === false) return;
      clearPress(); held.current = false;
      pointerHandlers.onPointerDown(event);
      timer.current = setTimeout(() => {
        timer.current = null;
        if (ignoreClick()) return;
        held.current = true;
        pointerHandlers.onPointerCancel(event);
        toggleDone();
      }, 500);
    }}
    onPointerMove={event => {
      if (held.current) return;
      pointerHandlers.onPointerMove(event);
      if (ignoreClick()) clearPress();
    }}
    onPointerUp={event => { clearPress(); pointerHandlers.onPointerUp(event); }}
    onPointerCancel={event => { clearPress(); held.current = true; pointerHandlers.onPointerCancel(event); }}
    onLostPointerCapture={event => { clearPress(); pointerHandlers.onLostPointerCapture(event); }}
    onContextMenu={event => event.preventDefault()}
    onClick={event => {
      if (event.detail !== 0 && (held.current || ignoreClick())) return;
      if (hasChildren) setExpanded(!expanded);
    }}>
    <span className={`task-anchor ${hasChildren ? 'parent' : ''} ${!expanded ? 'folded' : ''} ${done ? 'checked' : ''}`} aria-hidden="true">
      <span className="anchor-inner" />
      <span className="anchor-check">✓</span>
    </span>
  </button>;
}
