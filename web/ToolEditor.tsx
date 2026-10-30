import { useState } from 'react';
import { useUI } from './preferences';
import { validToolName, uniqueTools, toolKey } from './toolAnnotation';

export default function ToolEditor({ initial, options, onCreate, onSave, onClose }: { initial: string[]; options: string[]; onCreate: (tool: string) => void; onSave: (tools: string[]) => void; onClose: () => void }) {
  const { t } = useUI();
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState(initial);
  const choices = uniqueTools([...options, ...selected]);
  const [error, setError] = useState(false);
  return <div className="tool-editor-backdrop" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); onClose(); }
  }}>
    <form className="tool-editor" role="dialog" aria-modal="true" aria-label={t('Assign tools')} onSubmit={event => {
      event.preventDefault();
      onSave(selected);
    }} onKeyDown={event => {
      if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
      if (event.key === 'Tab') {
        const fields = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('input, button'));
        if (event.shiftKey && document.activeElement === fields[0]) { event.preventDefault(); fields.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === fields.at(-1)) { event.preventDefault(); fields[0].focus(); }
      }
    }}>
      <div className="tool-choices">{choices.map((name, index) => <label key={toolKey(name)}><input type="checkbox" autoFocus={index === 0} checked={selected.some(s => toolKey(s) === toolKey(name))} onChange={event => setSelected(event.target.checked ? uniqueTools([...selected, name]) : selected.filter(s => toolKey(s) !== toolKey(name)))} />{name}</label>)}</div>
      <label>{t('New tool')}<input autoFocus={!choices.length} value={value} onChange={event => { setValue(event.target.value); setError(false); }} /></label>
      <button type="button" onClick={() => { const name = value.trim(); if (!validToolName(name)) { setError(true); return; } onCreate(name); setSelected(uniqueTools([...selected, name])); setValue(''); }}>{t('Create')}</button>
      {error && <p role="alert">{t('Use a tool name without comment delimiters or control characters.')}</p>}
      <div><button type="button" onClick={onClose}>{t('Cancel')}</button><button type="submit">{t('Apply')}</button></div>
    </form>
  </div>;
}
