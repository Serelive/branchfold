# N2 implementation — flexible outline editor

This N2 refers to **Deliver a flexible outline editor** in BRANCHES.md, not the
positional N2 referenced by the older archived review. The user accepted that review
response, which is now [archived](N2_review-r1.md), and N1 is closed.

## Delivered behavior

- Move a whole subtree up/down, indent under the preceding sibling, outdent after
  its parent, or select another parent/root level. IDs, child order, titles, and
  completion states survive moves. Self/descendant destinations are rejected.
- Delete a subtree and recover it with session undo/redo. All edits, including
  imports, share a bounded 100-step history; typing within one title-focus session
  is grouped. New edits invalidate redo. Undo/redo saves the restored tree.
- Collapse children, focus on one subtree, return to its parent or the full forest,
  and see the current editing row. Moving returns to the whole forest and focuses
  the moved title. View state does not change persisted task data.
- Preview validated JSON backups before explicitly replacing the forest. Invalid
  files never replace data. Cancellation preserves the tree, and undo restores the
  previous tree after confirmation. Exports include the full forest.

No new runtime dependencies, storage migration, backend, or network requirement were
introduced. The original version 1 backup format remains compatible.

## Validation

`npm test`: 14 tests passed. Domain tests cover cycle/invalid-target rejection,
ordering and boundary behavior, subtree preservation, deletion, persistence, and
independent completion. UI tests exercise pointer reparent/delete/recover,
keyboard reorder/indent/outdent and focus retention, collapse and subtree navigation,
malformed/cancelled/confirmed imports, undo/redo grouping, and remount restoration.

`npm run build`: TypeScript and the Vite production build passed. Git whitespace and
local documentation links were checked. There was no connected browser available
for a new visual or real-browser interaction check; UI workflow tests use jsdom.

## Limits for review

- Undo is session-only and bounded to 100 changes. Export before closing for durable
  recovery. A new edit discards redo.
- Focus/collapse state resets on reload; moves and undo/redo expand the full outline
  to reveal the result. This intentionally favors visibility over preserving a view.
- Imports replace rather than merge and have a 2 MB limit. Export the current tree
  before replacing if its backup must survive closing the page.
- Use one browser tab. Cross-tab coordination remains outside this implementation.
- Existing storage-error behavior remains: unreadable startup data pauses editing;
  failed writes keep changes in memory and display an export warning.

The next root is the real-task-tree trial. It was not performed or marked complete
as part of this implementation.
