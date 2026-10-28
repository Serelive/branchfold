export type DocumentSnapshot = { source: string; version: number; name: string; dirty: boolean };
export type HostMessage =
  | { type: 'snapshot'; document: DocumentSnapshot }
  | { type: 'restoreDraft'; document: DocumentSnapshot; tree: string }
  | { type: 'saveResult'; requestId: string; ok: boolean; message: string; document: DocumentSnapshot }
  | { type: 'notice'; message: string };
export type HostRequest =
  | { type: 'ready' | 'source' }
  | { type: 'save'; requestId: string; version: number; source: string; tree: string }
  | { type: 'draft'; document: DocumentSnapshot; tree: string; dirty: boolean }
  | { type: 'export'; tree: string; format: 'json' | 'md' };
export interface DocumentHost { postMessage(message: HostRequest): void }
declare global { interface Window { acquireVsCodeApi?: () => DocumentHost } }
export const documentHost = window.acquireVsCodeApi?.();
