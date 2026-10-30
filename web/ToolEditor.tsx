import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useUI } from './preferences';
import { validToolName, uniqueTools, toolKey, toolColor } from './toolAnnotation';

export default function ToolEditor({ anchor, initial, options, onCreate, onSave, onClose }: { anchor: HTMLElement; initial: string[]; options: string[]; onCreate: (tool: string) => void; onSave: (tools: string[]) => void; onClose: (restoreFocus?: boolean) => void }) {
  const { t } = useUI();
  const panel = useRef<HTMLFormElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, origin: 0 });
  const [value, setValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(initial);
  const choices = uniqueTools([...options, ...selected]);
  const [error, setError] = useState(false);
  const close = useRef(onClose); close.current = onClose;
  useLayoutEffect(() => {
    const place = () => {
      if (!panel.current) return;
      const button = anchor.getBoundingClientRect();
      const box = panel.current.getBoundingClientRect();
      const center = button.top + button.height / 2;
      const top = Math.max(8, Math.min(center - panel.current.offsetHeight / 2, innerHeight - panel.current.offsetHeight - 8));
      setPosition({ left: Math.max(8, Math.min(button.right + 6, innerWidth - box.width - 8)), top, origin: center - top });
    };
    place();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    if (panel.current) observer?.observe(panel.current);
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !anchor.contains(event.target as Node)) close.current(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', outside);
    return () => { observer?.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); document.removeEventListener('pointerdown', outside); };
  }, [anchor, creating, error]);
  const create = () => {
    const name = value.trim();
    if (!validToolName(name)) { setError(true); return; }
    onCreate(name); setSelected(uniqueTools([...selected, name])); setValue(''); setCreating(false);
  };
  return <form ref={panel} className="tool-editor tool-popover" role="dialog" aria-label={t('Assign tools')}
    style={{ left: position.left, top: position.top, '--tool-origin': `${position.origin}px` } as CSSProperties}
    onSubmit={event => { event.preventDefault(); if (creating) create(); else onSave(selected); }}
    onKeyDown={event => {
      event.stopPropagation();
      if (event.nativeEvent.isComposing || event.keyCode === 229) { if (event.key === 'Enter') event.preventDefault(); return; }
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    }}>
    <div className="tool-choices">{choices.map((name, index) => <button type="button" role="checkbox" key={toolKey(name)} autoFocus={index === 0}
      className={`tool-badge tool-choice tool-color-${toolColor(name)}`} aria-checked={selected.some(s => toolKey(s) === toolKey(name))}
      onClick={() => setSelected(selected.some(s => toolKey(s) === toolKey(name)) ? selected.filter(s => toolKey(s) !== toolKey(name)) : uniqueTools([...selected, name]))}>
      <span className="tool-choice-check" aria-hidden="true">{selected.some(s => toolKey(s) === toolKey(name)) ? '✓' : '+'}</span>{name}</button>)}
      <button type="button" className="tool-badge tool-choice tool-create" autoFocus={!choices.length} aria-expanded={creating} onClick={() => { setCreating(true); setError(false); }}>{t('Create')}</button>
    </div>
    {creating && <div className="tool-create-input"><input autoFocus aria-label={t('New tool')} value={value} onChange={event => { setValue(event.target.value); setError(false); }} /><button type="button" onClick={create}>{t('Add')}</button></div>}
    {error && <p role="alert">{t('Use a tool name without comment delimiters or control characters.')}</p>}
    <div className="tool-editor-actions"><button type="button" onClick={() => onClose()}>{t('Cancel')}</button><button type="button" onClick={() => onSave(selected)}>{t('Apply')}</button></div>
  </form>;
}
