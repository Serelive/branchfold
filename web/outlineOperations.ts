import type { Forest, TaskNode } from './tree';

// Promote immediate children into the deleted cell's exact sibling position.
export function deleteCell(forest: Forest, id: string): Forest {
  return forest.flatMap(node => node.id === id ? node.children : [{
    ...node, children: deleteCell(node.children, id),
  }]);
}

// Collapse preceding branches, reveal the first unfinished leaf and everything
// after it within this subtree. If all leaves are done, reveal immediate children.
export function expandToFirstUnchecked(node: TaskNode, collapsed: Set<string>): void {
  let reached = false;
  function visit(current: TaskNode): boolean {
    if (!current.children.length) {
      if (!current.done) reached = true;
      return reached;
    }
    const alreadyReached = reached;
    let revealsLeaf = false;
    for (const child of current.children) revealsLeaf = visit(child) || revealsLeaf;
    if (alreadyReached || revealsLeaf) collapsed.delete(current.id);
    else collapsed.add(current.id);
    return revealsLeaf;
  }
  visit(node);
  collapsed.delete(node.id);
}
