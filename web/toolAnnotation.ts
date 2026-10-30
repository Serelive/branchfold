/** Tool labels are inert task metadata, never executable commands. */
export function validToolName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 &&
    !/<!--|-->|[\u0000-\u001f\u007f]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
}

export function readToolComment(comment: string): string[] | undefined {
  const match = /^<!--branchfold:(\{.*\})-->$/s.exec(comment);
  if (!match) return;
  try {
    const value = JSON.parse(match[1]);
    if (value && Object.keys(value).length === 1 && validToolName(value.tool)) return [value.tool.trim()];
    if (value && Object.keys(value).length === 1 && validTools(value.tools)) return uniqueTools(value.tools);
  } catch { /* Unrecognized annotations remain literal title content. */ }
}

export function toolColor(tool: string): number {
  let hash = 0;
  for (const char of tool.trim().normalize('NFC').toLowerCase()) hash = (Math.imul(hash, 31) + char.codePointAt(0)!) >>> 0;
  return hash % 6;
}

export const toolKey = (name: string) => name.trim().normalize('NFC').toLowerCase();
export function uniqueTools(names: string[]): string[] {
  const seen = new Set<string>();
  return names.map(name => name.trim()).filter(name => { const key = toolKey(name); if (seen.has(key)) return false; seen.add(key); return true; });
}
export const validTools = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(validToolName);
export function taskTools(node: { tool?: string; tools?: string[] }): string[] {
  return uniqueTools([...(node.tool ? [node.tool] : []), ...(node.tools ?? [])]);
}
export function toolFields(names: string[]): { tool?: string; tools?: string[] } {
  const tools = uniqueTools(names);
  return tools.length === 1 ? { tool: tools[0] } : tools.length ? { tools } : {};
}
