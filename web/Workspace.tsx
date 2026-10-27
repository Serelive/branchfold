import { useState } from 'react';
import App from './App';
import MarkdownView from './MarkdownView';
import { documentHost } from './documentHost';

export default function Workspace() {
  const [markdown, setMarkdown] = useState(Boolean(documentHost));
  if (markdown) return <MarkdownView onClose={documentHost ? undefined : () => setMarkdown(false)} />;
  return <><div className="workspace-switch"><button onClick={() => setMarkdown(true)}>Open Markdown view</button></div><App /></>;
}
