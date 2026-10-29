import { useEffect, useRef, type PointerEvent, type PointerEventHandler } from 'react';

const leafOutline = 'M4 9 C5 3 10 5 15 2 C16 9 13 15 8 13 C6 12 5 10 4 9 Z';
const leafStalk = 'M1 9 H4';

type Props = {
  expansionMarker?: boolean;
  instantMarker?: boolean;
  title: string;
  displayDone: boolean;
  onPreview: (active: boolean) => void;
  expanded: boolean;
  hasChildren: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleDone: () => void;
  ignoreClick: () => boolean;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>, forceDrag?: boolean) => void;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
  onLostPointerCapture: PointerEventHandler<HTMLButtonElement>;
};

export default function NodeControl({ expansionMarker = false, instantMarker = false, title, displayDone, onPreview, expanded, hasChildren, setExpanded, toggleDone, ignoreClick, ...pointerHandlers }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const pending = useRef(false);
  const position = useRef({ x: 0, y: 0 });
  const previewCallback = useRef(onPreview);
  previewCallback.current = onPreview;
  const cancelPreview = () => { pending.current = false; previewCallback.current(false); };
  const clearPress = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => {
    const cancel = () => { clearPress(); cancelPreview(); held.current = true; };
    const keyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', keyDown);
    return () => { clearPress(); previewCallback.current(false); window.removeEventListener('blur', cancel); window.removeEventListener('keydown', keyDown); };
  }, []);
  return <button className="drag-handle node-control" aria-label={`Node control ${title}`}
    aria-pressed={displayDone} aria-expanded={hasChildren ? expanded : undefined}
    title={`${hasChildren ? 'Click: expand/collapse' : 'Click: complete/reopen'} · Long-press: preview completion · Release: confirm · Drag: move`}
    onPointerDown={event => {
      if (event.button !== 0 || event.isPrimary === false) return;
      clearPress(); cancelPreview(); held.current = false;
      position.current = { x: event.clientX, y: event.clientY };
      pointerHandlers.onPointerDown(event);
      timer.current = setTimeout(() => {
        timer.current = null;
        if (ignoreClick()) return;
        held.current = true;
        pending.current = true;
        previewCallback.current(true);
      }, 500);
    }}
    onPointerMove={event => {
      const moved = event.clientX !== position.current.x || event.clientY !== position.current.y;
      position.current = { x: event.clientX, y: event.clientY };
      const dragFromHold = pending.current && moved;
      if (dragFromHold) cancelPreview();
      pointerHandlers.onPointerMove(event, dragFromHold);
      if (ignoreClick()) clearPress();
    }}
    onPointerUp={event => {
      clearPress();
      const commit = pending.current;
      cancelPreview();
      pointerHandlers.onPointerUp(event);
      if (commit) toggleDone();
    }}
    onPointerCancel={event => { clearPress(); cancelPreview(); held.current = true; pointerHandlers.onPointerCancel(event); }}
    onLostPointerCapture={event => { clearPress(); cancelPreview(); pointerHandlers.onLostPointerCapture(event); }}
    onContextMenu={event => event.preventDefault()}
    onClick={event => {
      if (event.detail !== 0 && (held.current || ignoreClick())) return;
      if (hasChildren) setExpanded(!expanded);
      else toggleDone();
    }}>
    <span className={`task-anchor ${hasChildren ? 'parent' : ''} ${!expanded ? 'folded' : ''} ${(displayDone) ? 'checked' : ''}`} aria-hidden="true">
      {expansionMarker && hasChildren && <span className={`expansion-marker${instantMarker ? ' instant-marker' : ''}`} />}
      <span className="anchor-inner" />
      {!hasChildren && <svg className="anchor-leaf" viewBox="0 0 18 18" focusable="false">
        <circle className="leaf-ring" cx="9" cy="9" r="8.25" />
        <g className="leaf-drawing">
          <path d={leafOutline} />
          <path d={`${leafStalk} M4 9 Q9 10 12 6`} />
        </g>
      </svg>}
      <span className="anchor-check">✓</span>
    </span>
  </button>;
}
