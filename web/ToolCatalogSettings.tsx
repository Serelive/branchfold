import { useState } from 'react';
import { useUI } from './preferences';
import { toolColor, toolKey, validToolName } from './toolAnnotation';
import type { ToolCatalog } from './toolCatalog';

export default function ToolCatalogSettings({ names, manual, onChange }: { names: string[]; manual: boolean; onChange: (value: ToolCatalog) => void }) {
  const { t } = useUI();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const start = (name: string) => { setEditing(name); setDraft(name); setError(''); };
  const save = () => {
    const name = draft.trim();
    if (!validToolName(name)) { setError('Use a tool name without comment delimiters or control characters.'); return; }
    if (names.some(n => n !== editing && toolKey(n) === toolKey(name))) { setError('This tool already exists.'); return; }
    onChange({ names: editing === '' ? [...names, name] : names.map(n => n === editing ? name : n), manual: true });
    setEditing(null); setError('');
  };
  const move = (index: number, delta: number) => {
    const next = [...names];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange({ names: next, manual: true });
  };
  return <fieldset className="tool-catalog"><legend>{t('Tool list')}</legend>
    <div className="tool-choices">{names.map((name, index) => <div className="tool-catalog-row" key={toolKey(name)}>
      <button className={`tool-badge tool-choice tool-color-${toolColor(name)}`} aria-label={t('Edit tool {name}', { name })} onClick={() => start(name)}>{name}</button>
      <button disabled={index === 0} aria-label={t('Move tool {name} up', { name })} onClick={() => move(index, -1)}>↑</button>
      <button disabled={index === names.length - 1} aria-label={t('Move tool {name} down', { name })} onClick={() => move(index, 1)}>↓</button>
      <button aria-label={t('Remove tool {name}', { name })} onClick={() => { onChange({ names: names.filter(n => n !== name), manual: true }); if (editing === name) setEditing(null); }}>×</button>
    </div>)}
      <button className="tool-badge tool-choice tool-create" aria-expanded={editing === ''} onClick={() => start('')}>{t('Create')}</button>
    </div>
    {editing !== null && <div className="tool-create-input" onKeyDown={event => {
      event.stopPropagation();
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter') { event.preventDefault(); save(); }
    }}>
      <input key={editing} autoFocus aria-label={t('Tool name')} value={draft} onChange={event => { setDraft(event.target.value); setError(''); }} />
      <button onClick={save}>{t(editing === '' ? 'Add' : 'Apply')}</button>
      <button onClick={() => { setEditing(null); setError(''); }}>{t('Cancel')}</button>
    </div>}
    {error && <p role="alert">{t(error)}</p>}
    <p>{t('Editing this list does not change tools already assigned to tasks.')}</p>
    <button aria-pressed={!manual} onClick={() => onChange({ names, manual: false })}>{t('Rank by frequency')}</button>
  </fieldset>;
}
