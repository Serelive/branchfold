import type { Forest } from './tree';
import { taskTools, toolKey, uniqueTools, validToolName } from './toolAnnotation';
export type ToolCatalog = { names: string[]; manual: boolean };
export const CATALOG_KEY = 'branchfold.tools.v1';
export const defaultTools = ['VSCode', 'Obsidian', 'Notion', 'ChatGPT'];
export function discoverTools(forest: Forest): string[] {
  return forest.flatMap(node => [...taskTools(node), ...discoverTools(node.children)]);
}
export function mergeCatalog(catalog: ToolCatalog, names: string[]): ToolCatalog {
  return { ...catalog, names: uniqueTools([...catalog.names, ...names]) };
}
export function loadCatalog(forest: Forest): ToolCatalog {
  let catalog: ToolCatalog = { names: defaultTools, manual: false };
  try {
    const saved = JSON.parse(localStorage.getItem(CATALOG_KEY) ?? 'null');
    if (saved && Array.isArray(saved.names) && saved.names.every(validToolName) && typeof saved.manual === 'boolean') catalog = saved;
  } catch { /* Keep the usable defaults when storage is unavailable. */ }
  return mergeCatalog(catalog, discoverTools(forest));
}
export function rankedTools(catalog: ToolCatalog, forest: Forest): string[] {
  if (catalog.manual) return catalog.names;
  const counts = new Map<string, number>();
  for (const name of discoverTools(forest)) counts.set(toolKey(name), (counts.get(toolKey(name)) ?? 0) + 1);
  return [...catalog.names].sort((a, b) => (counts.get(toolKey(b)) ?? 0) - (counts.get(toolKey(a)) ?? 0));
}
