import { parseForest, serializeForest, type Forest } from './tree';
export const STORAGE_KEY = 'branchfold.tree.v1';
export function loadForest(storage: Pick<Storage, 'getItem'>): Forest {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? [] : parseForest(raw);
}
export function saveForest(storage: Pick<Storage, 'setItem'>, forest: Forest): void {
  storage.setItem(STORAGE_KEY, serializeForest(forest));
}
