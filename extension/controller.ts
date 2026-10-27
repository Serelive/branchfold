import { renameTask } from '../web/markdown';

/** The editor owns versioned application, disk conflicts, save and undo. */
export interface EditorPort {
  current(): { source: string; version: number; dirty: boolean };
  diskMatches(): Promise<boolean>;
  replace(version: number, start: number, end: number, title: string): Promise<boolean>;
  save(): Promise<boolean>;
}
export async function applyRename(port: EditorPort, request: { source: string; version: number; id: string; title: string }) {
  const current = port.current();
  if (current.version !== request.version || current.source !== request.source) throw new Error('Conflict: document changed. Your draft is retained. Review the source and reopen the task.');
  if (current.dirty) throw new Error('Save or undo existing source edits before renaming through Branchfold.');
  if (!await port.diskMatches()) throw new Error('Conflict: file changed on disk. Refresh or resolve the change in VS Code.');
  const edit = renameTask(request.source, request.id, request.title);
  // Recheck after asynchronous disk access. The host also checks the editor version at application.
  if (port.current().version !== request.version || !await port.replace(request.version, edit.start, edit.end, edit.title))
    throw new Error('Conflict: document changed before the rename could be applied.');
  if (!await port.save()) throw new Error('Rename is unsaved in VS Code. Resolve the save problem in the source editor; your edit is recoverable through editor undo.');
}
