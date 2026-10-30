import { validToolName, validTools, uniqueTools } from './toolAnnotation';
export interface TaskNode {
  id: string;
  title: string;
  tool?: string;
  tools?: string[];
  done: boolean;
  children: TaskNode[];
}
// Array position is the explicit sibling order; nesting determines parentage.
export type Forest = TaskNode[];

export function addNode(forest: Forest, parentId: string | null, id: string): Forest {
  const node: TaskNode = { id, title: '', done: false, children: [] };
  if (parentId === null) return [...forest, node];
  return updateNode(forest, parentId, parent => ({ ...parent, children: [...parent.children, node] }));
}

export function updateNode(forest: Forest, id: string, update: (node: TaskNode) => TaskNode): Forest {
  return forest.map(node => node.id === id ? update(node) : {
    ...node, children: updateNode(node.children, id, update),
  });
}

// Checking cascades down; reopening changes only the explicitly selected task.
export function toggleCompletion(forest: Forest, id: string): Forest {
  const target = findNode(forest, id);
  if (!target) return forest;
  const complete = (node: TaskNode): TaskNode => ({ ...node, done: true, children: node.children.map(complete) });
  return updateNode(forest, id, node => node.done ? { ...node, done: false } : complete(node));
}

export function parseForest(raw: string): Forest {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 || !('nodes' in data)) {
    throw new Error('Unsupported backup format.');
  }
  const ids = new Set<string>();
  function valid(nodes: unknown): nodes is Forest {
    return Array.isArray(nodes) && nodes.every(node => {
      if (!node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id ||
          ('tools' in node && (!validTools(node.tools) || 'tool' in node)) || ('tool' in node && !validToolName(node.tool)) || ids.has(node.id) || typeof node.title !== 'string' || typeof node.done !== 'boolean') return false;
      if ('tool' in node && typeof node.tool === 'string') node.tool = node.tool.trim();
      if ('tools' in node && validTools(node.tools)) node.tools = uniqueTools(node.tools);
      ids.add(node.id);
      return valid(node.children);
    });
  }
  if (!valid(data.nodes)) throw new Error('Invalid task tree.');
  return data.nodes;
}

export function serializeForest(nodes: Forest): string {
  return JSON.stringify({ version: 1, nodes }, null, 2);
}

export function findNode(forest: Forest, id: string): TaskNode | undefined {
  for (const node of forest) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
}

export function nodeLocation(forest: Forest, id: string, parentId: string | null = null):
  { siblings: Forest; index: number; parentId: string | null } | undefined {
  for (let index = 0; index < forest.length; index++) {
    if (forest[index].id === id) return { siblings: forest, index, parentId };
    const found = nodeLocation(forest[index].children, id, forest[index].id);
    if (found) return found;
  }
}

export function deleteNode(forest: Forest, id: string): Forest {
  if (!findNode(forest, id)) return forest;
  return forest.filter(node => node.id !== id).map(node => ({ ...node, children: deleteNode(node.children, id) }));
}

// index is the insertion position in the destination AFTER removing the source.
export function moveNode(forest: Forest, id: string, parentId: string | null, index: number): Forest {
  const node = findNode(forest, id);
  if (!node || parentId === id || (parentId !== null &&
      (!findNode(forest, parentId) || findNode(node.children, parentId)))) return forest;
  const removed = deleteNode(forest, id);
  const destination = parentId === null ? removed : findNode(removed, parentId)!.children;
  if (!Number.isInteger(index) || index < 0 || index > destination.length) return forest;
  const children = [...destination.slice(0, index), node, ...destination.slice(index)];
  return parentId === null ? children : updateNode(removed, parentId, parent => ({ ...parent, children }));
}

export type OutlineMove = 'up' | 'down' | 'indent' | 'outdent';
export function outlineMove(forest: Forest, id: string, direction: OutlineMove): Forest {
  const location = nodeLocation(forest, id);
  if (!location) return forest;
  const { siblings, index, parentId } = location;
  if (direction === 'up') return index > 0 ? moveNode(forest, id, parentId, index - 1) : forest;
  if (direction === 'down') return index < siblings.length - 1 ? moveNode(forest, id, parentId, index + 1) : forest;
  if (direction === 'indent') {
    const previous = siblings[index - 1];
    return previous ? moveNode(forest, id, previous.id, previous.children.length) : forest;
  }
  if (parentId === null) return forest;
  const parent = nodeLocation(forest, parentId)!;
  return moveNode(forest, id, parent.parentId, parent.index + 1);
}

export type DropPosition = 'before' | 'after' | 'inside';
export function moveRelative(forest: Forest, id: string, targetId: string, position: DropPosition): Forest {
  const source = findNode(forest, id);
  if (!source || id === targetId || findNode(source.children, targetId)) return forest;
  // Resolve the target after removal so same-parent moves have correct indices.
  const remaining = deleteNode(forest, id);
  const target = nodeLocation(remaining, targetId);
  if (!target) return forest;
  if (position === 'inside') return moveNode(forest, id, targetId, findNode(remaining, targetId)!.children.length);
  return moveNode(forest, id, target.parentId, target.index + (position === 'after' ? 1 : 0));
}

export function nodePath(forest: Forest, id: string): TaskNode[] {
  for (const node of forest) {
    if (node.id === id) return [node];
    const childPath = nodePath(node.children, id);
    if (childPath.length) return [node, ...childPath];
  }
  return [];
}

export function visibleNodes(forest: Forest, collapsed: ReadonlySet<string>): TaskNode[] {
  return forest.flatMap(node => [node, ...(collapsed.has(node.id) ? [] : visibleNodes(node.children, collapsed))]);
}
