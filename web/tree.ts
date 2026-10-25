export interface TaskNode {
  id: string;
  title: string;
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

export function parseForest(raw: string): Forest {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 || !('nodes' in data)) {
    throw new Error('Unsupported backup format.');
  }
  const ids = new Set<string>();
  function valid(nodes: unknown): nodes is Forest {
    return Array.isArray(nodes) && nodes.every(node => {
      if (!node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id ||
          ids.has(node.id) || typeof node.title !== 'string' || typeof node.done !== 'boolean') return false;
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
