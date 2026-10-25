# C02 / N02 Review — Flexible Outline Editor

**Project:** Branchfold / 丛序  
**Review status:** Structural functionality accepted provisionally; navigation and editing interaction require a focused redesign.  
**Basis:** N02 implementation report and manual interaction feedback. Automated validation is reported by Codex; this review does not independently reproduce its results.

## 1. Overall assessment

N02 has established much of the necessary *structural* foundation: subtree moves with stable node identity, cycle rejection, deletion with session undo/redo, collapse and subtree focus, and validated JSON backup/restore. The reported 14 passing tests and successful Vite build are useful evidence for these underlying operations. Preserve the working domain logic and regression tests where possible.

The principal remaining problem is **interaction design**, not an absence of tree operations. The current combination of clicking, selecting, expanding, and commands hidden behind `...` makes ordinary outline editing feel indirect. Branchfold should feel closer to writing and reorganizing a Markdown outline than administering a collection of independent cells. Replacing the interaction layer need not entail rewriting the tree model.

The following suggestions are design directions, not claims that the proposed shortcuts have already been tested.

## 2. Navigation and editing redesign — high priority

### 2.1. Separate four concepts

Keep these independent:

- **Selected node:** target of whole-node keyboard operations.
- **Editing node:** title contains an active text caret.
- **View root:** the subtree temporarily displayed as the current workspace.
- **Dragged node:** the subtree being repositioned during a pointer operation.

Selection must not unexpectedly enter text editing or change the view root. Subtree focus should remain a navigational context with an explicit breadcrumb path. In code, prefer a name such as `viewRootId` to avoid confusing application-level subtree focus with browser/DOM keyboard focus.

### 2.2. Make outline writing continuous

In **editing mode**, ordinary text editing should work normally. `Enter` should commit the current single-line title, create a sibling immediately **after the current node's subtree**, and start editing the new node. `Tab` / `Shift+Tab` should indent / outdent when applicable. `Escape` should leave editing and retain selection. Creating a node should immediately place the caret in its title.

In **navigation mode**, arrow keys should move among *visible* nodes; `Left` should collapse or move to the parent, and `Right` should expand or move to the first visible child. Provide direct commands for creating a sibling or child, toggling completion, moving a subtree, and entering title editing. Structural shortcuts should never fire during IME composition or normal text editing.

**Open decision — `Enter` in navigation mode:** The initial user draft proposes `Enter` = create sibling below. The earlier design proposal used `Enter` = edit the selected node, with `Enter` *while editing* = create sibling. These are mutually exclusive defaults. My preferred starting point is the latter, Jupyter-like distinction, because it provides a discoverable keyboard route into editing an existing node; a separate one-key command (for example `B`) can create a sibling from navigation mode. However, this should be evaluated against the former, more aggressively Markdown-like option (`Enter` = new sibling; `F2` = edit title) using the user's real task tree. **Do not silently implement both meanings or treat the mapping as settled without an interaction trial.**

### 2.3. Make basic operations visible and direct

Do not require the `...` menu for common actions. A row should have clear, noncompeting targets:

- Checkbox: completion.
- Chevron: expand/collapse.
- Title: direct inline editing on click.
- Row background: selection.
- Drag handle: move the node and its entire subtree.
- Focus control or explicit gesture: zoom into the subtree.
- `...` / context menu: secondary operations and discoverability.

Preserve the useful delete and subtree-focus functionality from N02, but integrate them with this model. Prefer subtle affordances and responsive feedback over permanently exposing many buttons. The reference to Apple's *Designing Fluid Interfaces* is a useful design aspiration—especially immediate response, clear spatial feedback, and reversibility—not an instruction to mimic a particular animation.

## 3. Structural movement and drag-and-drop — high priority

Implement a first-class drag handle and three visually distinct drop targets:

1. **Before** a target node — show an insertion line above.
2. **After** a target node and its subtree — show an insertion line below.
3. **Inside** a target node — highlight that row as a prospective parent.

Dragging a node must move its **whole subtree**, preserving node IDs, descendant order, content, and completion states. Reject moves into itself or its descendants. Work correctly with collapsed branches and the current view root. Support autoscroll during dragging; do not make drag-and-drop the only mechanism for keyboard or accessibility users.

For local keyboard movement, test `Ctrl+Up/Down` as an alternative to `Alt+Up/Down`, which did not work in manual usage. Neither binding should be assumed safe across Ubuntu, browsers, or text inputs; check conflicts before selecting a default. `Tab` / `Shift+Tab` is preferred over `Alt+Left/Right` for indentation in an outline-editing context. Retain a visible menu fallback for operations whose keyboard mappings are unavailable or conflicting.

For distant moves, consider a later **Move to…** command with a searchable destination; do not add this before local drag/reorder behavior is sound.

## 4. Focus, collapse, and recovery

Keep the current subtree-focus feature, but make it navigable through breadcrumbs and a consistent way to return to an ancestor or the full forest. `Escape` may step from editing to navigation, then from the subtree view to its parent, provided the mode is evident.

The current report says moving a node returns to the full forest and expands the outline to reveal the moved title; undo/redo similarly expands the full outline. This prioritizes visibility but can cause substantial context loss. Prefer preserving the user's current view when possible. If a moved node leaves the focused subtree, keep the current view and offer an explicit **Go to moved node** action rather than always jumping to the forest root.

Retain session undo/redo for all structural edits. Deleting a parent must communicate that its descendants will also be deleted. Dragging, indentation, and deletion should be reversible without forcing the user to reconstruct the previous tree.

## 5. Issues to investigate

### Bug — `Alt+Up/Down` does not work in actual use

The N02 report lists keyboard-reorder tests as passing, but the shortcut did not work during manual interaction. Treat this as an **observed interaction bug** despite passing jsdom tests. Determine whether the event is intercepted by the OS/browser, the selected element lacks keyboard focus, the mode is wrong, or the shortcut handler is not reached. Reproduce it in a real browser on Ubuntu and add the appropriate regression coverage. Changing to `Ctrl+Up/Down` is a *candidate remedy*, not proof that the underlying issue has been fixed.

### Bug / UX defect — JSON import into an empty forest

When importing a JSON backup while the tree is empty, the interface still behaves or presents its confirmation as though an existing tree would be replaced. Investigate the exact empty-state behavior: distinguish **import into an empty forest** from **replace a nonempty forest**. Do not warn about overwriting existing tasks when none exist; preserve validation and clear confirmation for destructive replacement. Add tests for both cases and ensure cancellation and undo remain correct. Whether the defect is only in wording or also in import behavior should be established through reproduction.

## 6. Suggested next iteration and acceptance criteria

Treat the next change as an **interaction-system revision**, not a wholesale rewrite of N02.

**First: keyboard and editing.** Specify the state transitions, resolve or trial the navigation-mode `Enter` choice, and enable uninterrupted outline entry. Reconstruct a 30+ node sample using mostly the keyboard without opening the `...` menu.

**Second: pointer movement.** Provide drag handles with unambiguous before/after/inside drop previews, subtree preservation, cycle rejection, and undo. Test collapsed targets and movement while focused on a subtree.

**Third: context preservation and real-browser verification.** Ensure focus/breadcrumb behavior remains predictable after moves and undo/redo. Reproduce the failed arrow-key shortcut and empty-forest import issue in an actual browser; do not rely on jsdom alone for keyboard, drag, or IME behavior. Test Chinese IME composition (including Fcitx5), accidental deletion, and storage reload.

The acceptance criterion is not the number of new shortcuts. It is that **creating, revising, and reorganizing a real task tree becomes materially more fluid than the current menu-driven implementation**, without compromising the structural correctness N02 already delivered.

## 7. Update the documentation naming system

1. We will use <vX_nY_> as the prefix of the document for version X and node Y. Update the relevant documents. 
2. Since two valid versions have been delivered, we are currently at version 2. 
3. The node should be relative to a certain version. If not explicitly assigned, regard it's a node of the up-to-date version. 

## 8. Scope boundary

Avoid adding AI planning, collaboration, accounts, cloud synchronization, rich-text documents, or unrelated features in this iteration. Maintain `BRANCHES.md` as a concise working tree, record verified outcomes rather than merely attempted changes, and keep open UX decisions visible instead of presenting them as completed requirements.
