import { useState } from 'react';
import { useUI } from './preferences';
import { validToolName } from './toolAnnotation';

export default function ToolEditor({ initial, onSave, onClose }: { initial: string; onSave: (tool: string) => void; onClose: () => void }) {
  const { t } = useUI();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState(false);
  return <div className="tool-editor-backdrop" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); onClose(); }
  }}>
    <form className="tool-editor" role="dialog" aria-modal="true" aria-label={t('Suggested tool')} onSubmit={event => {
      event.preventDefault();
      const tool = value.trim();
      if (tool && !validToolName(tool)) { setError(true); return; }
      onSave(tool);
    }} onKeyDown={event => {
      if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
      if (event.key === 'Tab') {
        const fields = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('input, button'));
        if (event.shiftKey && document.activeElement === fields[0]) { event.preventDefault(); fields.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === fields.at(-1)) { event.preventDefault(); fields[0].focus(); }
      }
    }}>
      <label>{t('Suggested tool')}<input autoFocus value={value} onChange={event => { setValue(event.target.value); setError(false); }} /></label>
      <p>{t('Leave blank to remove the tool label.')}</p>
      {error && <p role="alert">{t('Use a tool name without comment delimiters or control characters.')}</p>}
      <div><button type="button" onClick={onClose}>{t('Cancel')}</button><button type="submit">{t('Apply')}</button></div>
    </form>
  </div>;
}
