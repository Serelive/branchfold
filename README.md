# Branchfold / 丛序

A living task tree for plans that evolve with action.

This prototype is a local React + TypeScript + Vite application. Create, edit, reorganize, focus, and recover task trees. Completing children never completes their parent automatically.

## Run

Requires Node.js 22.12+ and npm. No global packages or backend are needed.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For the workspace-local Node runtime installed during initial development, first run:

```sh
export PATH="$PWD/.tools/node-v22.23.4-linux-x64/bin:$PATH"
```

`.tools/` is ignored and is not included in a checkout. Install a compatible Node runtime separately on another machine. The existing uv/Python scaffold is preserved; it is not used by the browser application.

## Use and storage

- Add a root task, type a title, and use **+ Child** to decompose it. Empty titles are allowed.
- Titles save on every edit. Tab navigates controls; Enter leaves a title field. New tasks receive keyboard focus.
- Open a row's **•••** actions to move it up/down, indent under the previous sibling, outdent immediately after its parent, or **Move into** any eligible parent. Moves carry the whole subtree. Self/descendant destinations are excluded to prevent cycles.
- In a title field, **Alt + ↑/↓** reorders siblings and **Alt + →/←** indents/outdents. The moved title keeps keyboard focus. Tab still navigates controls normally.
- Use the triangle to collapse or expand children. **Focus subtree** hides other branches; **All tasks** and **Parent subtree** provide the way back. The highlighted row indicates current editing focus.
- **Delete subtree** removes a task and its descendants. **Undo/Redo** or **Ctrl/Cmd + Z / Shift + Z** recovers edits, moves, deletion, and imports. Up to 100 changes are retained in memory; continuous title editing is one undo step until focus leaves the title. A new change discards redo history. Reloading clears undo history.
- Moving a node returns to the full outline so its destination remains visible. Undo/redo also returns to the expanded full outline. Focus and collapse are view state and are not persisted or included in history.
- Check a task to complete it; uncheck it to reopen it. Parent and child completion are independent.
- Data is saved under `branchfold.tree.v1` in this browser's localStorage, including stable IDs, hierarchy, and array-based sibling order. Reloading the same origin restores it.
- **Export JSON** downloads the current tree as a versioned backup. Browser storage is not durable: clearing site data, using another browser profile, or changing the server origin can hide or remove it. Keep exports for important work. Export always includes the whole forest, even while focused on a subtree.
- **Import JSON** accepts version 1 backups up to 2 MB. Invalid data leaves the tree untouched. Review the task/root counts and sample root titles, then explicitly **Replace tree**, or cancel. Import replaces rather than merges; export current work first if needed. Undo can recover the prior tree during the session.
- Invalid saved data or unavailable storage at startup pauses editing without overwriting the original. Save failures during editing keep changes in memory and prompt export before leaving.
- Use one tab at a time: simultaneous editors are not coordinated. Task content is never sent to a service.

## Validate

```sh
npm test
npm run build
npm run preview
```

Tests cover immutable tree edits, cycle rejection, reorder/reparent boundaries, subtree deletion, independent completion, persistence round trips, malformed data, and rendered UI workflows for editing, focus/collapse, recovery, and confirmed imports. The production build checks TypeScript and produces a static `dist/` bundle.

Planning states, outcome verification, Markdown import/export, cross-tab coordination, and durable undo are not implemented. The real-work trial remains separate from automated validation. See [BRANCHES.md](BRANCHES.md) for the living development plan.
