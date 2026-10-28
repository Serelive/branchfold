import { exportMarkdown } from '../web/markdown';
import { parseForest } from '../web/tree';

export interface EditorPort {
  current(): { source: string; version: number; dirty: boolean };
  diskMatches(): Promise<boolean>;
  replace(version: number, start: number, end: number, content: string): Promise<boolean>;
  save(): Promise<boolean>;
}

/** Conversion is intentional: only an explicit Save replaces the source with checklist Markdown. */
export async function saveTree(port: EditorPort, request: { source: string; version: number; tree: string }) {
  const current = port.current();
  if (current.version !== request.version || current.source !== request.source) throw new Error('Conflict: source changed. Your unsaved tree is retained.');
  if (current.dirty) throw new Error('Save or undo edits in the source editor before saving this tree.');
  const content = exportMarkdown(parseForest(request.tree));
  if (!await port.diskMatches()) throw new Error('Conflict: file changed on disk. Review the source before saving.');
  if (port.current().version !== request.version) throw new Error('Conflict: source changed before saving.');
  if (content !== current.source && !await port.replace(request.version, 0, current.source.length, content))
    throw new Error('Conflict: source changed before the edit could be applied.');
  if (!await port.save()) throw new Error('Save failed. The tree is retained here and in the source editor. Resolve the save problem there; source undo restores the original document.');
}
