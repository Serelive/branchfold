import { useState } from 'react';
import { useUI } from './preferences';
import { uniqueTools, validToolName } from './toolAnnotation';
import type { ToolCatalog } from './toolCatalog';
export default function ToolCatalogSettings({ names, manual, onChange }: { names: string[]; manual: boolean; onChange: (value: ToolCatalog) => void }) {
  const { t } = useUI();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState(false);
  return <fieldset><legend>{t('Tool list')}</legend>
    <label>{t('One tool per line; edit the order here.')}<textarea aria-label={t('Tool list')} value={draft ?? names.join('\n')} onChange={event => { setDraft(event.target.value); setError(false); }} onKeyDown={event => event.stopPropagation()} /></label>
    <p>{t('Editing this list does not change tools already assigned to tasks.')}</p>
    {error && <p role="alert">{t('Use a tool name without comment delimiters or control characters.')}</p>}
    <button onClick={() => { const values = (draft ?? names.join('\n')).split('\n').map(s => s.trim()).filter(Boolean); if (!values.every(validToolName)) { setError(true); return; } onChange({ names: uniqueTools(values), manual: true }); setDraft(null); }}>{t('Save tool list')}</button>
    <button aria-pressed={!manual} onClick={() => { onChange({ names, manual: false }); setDraft(null); }}>{t('Rank by frequency')}</button>
  </fieldset>;
}
