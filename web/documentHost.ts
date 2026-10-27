export type DocumentSnapshot = { source: string; version: number; name: string; dirty: boolean };
export type HostMessage = { type: 'snapshot'; document: DocumentSnapshot } | { type: 'result'; operation: 'rename' | 'save'; ok: boolean; message: string };
export type HostRequest = { type: 'ready' | 'refresh' | 'source' | 'save' } | { type: 'rename'; version: number; source: string; id: string; title: string };
export interface DocumentHost { postMessage(message: HostRequest): void }
declare global { interface Window { acquireVsCodeApi?: () => DocumentHost } }
export const documentHost = window.acquireVsCodeApi?.();
