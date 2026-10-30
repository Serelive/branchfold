import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { chinese } from './translations';

type Preferences = { dark: boolean; chinese: boolean };
type UI = Preferences & { setDark: (value: boolean) => void; setChinese: (value: boolean) => void; t: (text: string, values?: Record<string, string | number>) => string };
const Context = createContext<UI | null>(null);
export const PREFERENCES_KEY = 'branchfold.appearance.v1';
function Provider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}');
      return { dark: stored?.dark === true, chinese: stored?.chinese === true };
    } catch { return { dark: false, chinese: false }; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.dark ? 'dark' : 'light';
    document.documentElement.lang = preferences.chinese ? 'zh-CN' : 'en';
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* Appearance remains usable without storage. */ }
  }, [preferences]);
  const t: UI['t'] = (text, values = {}) => (preferences.chinese ? chinese[text] ?? text : text).replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
  return <Context.Provider value={{ ...preferences, t, setDark: dark => setPreferences(p => ({ ...p, dark })), setChinese: chinese => setPreferences(p => ({ ...p, chinese })) }}>{children}</Context.Provider>;
}
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const existing = useContext(Context);
  return existing ? children : <Provider>{children}</Provider>;
}
export function useUI() {
  const ui = useContext(Context);
  if (!ui) throw new Error('UI preferences provider is missing.');
  return ui;
}
