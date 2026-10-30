import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useUI } from './preferences';

export default function SettingsPanel({ children }: { children: ReactNode }) {
  const { t, dark, chinese, setDark, setChinese } = useUI();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const close = () => { setOpen(false); trigger.current?.focus(); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); event.stopPropagation(); close(); } };
    const pointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', pointer);
    return () => { document.removeEventListener('keydown', key, true); document.removeEventListener('pointerdown', pointer); };
  }, [open]);
  return <>
    <button ref={trigger} className="settings-trigger" aria-expanded={open} aria-controls="editor-settings" onClick={() => setOpen(value => !value)}>{t('Settings')}</button>
    <aside id="editor-settings" className="settings-panel" aria-label={t('Settings')} ref={panel} hidden={!open}>
      <div className="settings-heading"><h2>{t('Settings')}</h2><button ref={closeButton} aria-label={t('Close settings')} onClick={() => { setOpen(false); trigger.current?.focus(); }}>×</button></div>
      <fieldset><legend>{t('Appearance')}</legend>
        <label className="setting-toggle"><span>{t('Dark mode')}</span><input type="checkbox" checked={dark} onChange={event => setDark(event.target.checked)} /></label>
        <label className="setting-toggle"><span>{t('Chinese mode')} / 中文</span><input aria-label={t('Chinese mode')} type="checkbox" checked={chinese} onChange={event => setChinese(event.target.checked)} /></label>
      </fieldset>
      {children}
    </aside>
  </>;
}
