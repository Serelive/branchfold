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

## Outline interaction

Click a row background to **select** a node, or its title to **edit**. The mode line
shows which behavior is active. Selection, title editing, subtree view, and dragging
are independent. New tasks always start with the caret in their title.

| Context | Keys | Action |
| --- | --- | --- |
| Navigation | Enter or F2 | Edit selected title |
| Navigation | B / C | Create sibling / child and edit it |
| Navigation | ↑ / ↓ | Select previous / next visible node |
| Navigation | ← / → | Collapse or select parent / expand or select first child |
| Navigation | Backspace | Directly delete the selected node and subtree; Undo restores it |
| Navigation | Space / Delete | Toggle completion / delete (confirm when there are descendants) |
| Navigation, including node-control/button focus | Ctrl + ↑ / ↓ | Move the entire subtree among siblings |
| Editing | Enter | Commit title and create a sibling after the current subtree |
| Editing | Tab / Shift+Tab | Indent under previous sibling / outdent after parent |
| Editing | Backspace | A tap erases one character; held repeats erase three characters at a time. A press starting with text never deletes the cell. A fresh press on an empty title deletes the node (confirm if it has descendants); holding continues deleting upward. |
| Editing | Escape | Leave the caret and select the node |
| Navigation in a subtree view | Escape | Return to the parent view |
| Navigation | Ctrl/Cmd + Z, with Shift to redo | Undo / redo outline changes |

Ordinary text editing and native text undo remain available inside title fields.
Whole-node shortcuts are suppressed during composition. Escape exits editing before
Tab is used to reach other controls. Visible actions and the sliding tray provide
fallbacks when desktop shortcuts conflict.

Use **Directory guides** in the toolbar to switch between indentation guides and directory-style branch connectors. This changes only the view for the current session.

In Directory guides mode, selecting a task darkens its handles and connecting route back to the visible root. **Ancestor titles** toggles ancestor title highlighting in the selection color; the selected task keeps its existing cell highlight.

Use **Leaf drawings** to switch leaf handles from plain rings to standalone leaf outlines. Checked handles keep the filled circle and check mark in both modes. This preference also lasts for the current session.

The **single left control** expands/collapses branches or checks/unchecks leaves on click, previews a completion toggle after a 500 ms hold and commits it on release, and moves the whole subtree on drag. Moving after the hold cancels the completion preview and starts dragging, without changing saved completion or adding an undo step. Single clicks act immediately; long-press and drag do not change expansion. An insertion line marks **before** or
**after the target's entire subtree**; a highlighted row marks **inside**. Holding
near a window edge scrolls; Escape cancels. Invalid self/descendant targets cannot
be dropped on. **+ Next**, **+ Child**, and **↗** subtree focus are direct
row controls. Tap the **right-edge arrow** to slide a row left and reveal reorder,
indent/outdent, parent selection, and deletion actions behind it. This does not move
other rows. Tap the edge again or press Escape to close; opening another row closes
the previous tray.

Ancestor breadcrumbs return to any ancestor or **All tasks**. Moves preserve the
current view and collapsed branches; **Go to moved node** reveals a moved task that
is no longer visible. Undo/redo restores the saved view context with the tree.
Creating a sibling of the current view root steps to its parent view to edit the new
sibling. View state itself is temporary and resets on reload.

## Storage and recovery

- Titles save on every edit. Empty titles are allowed. Checking a task checks its entire subtree; unchecking affects only that task.
  Children never automatically complete their parent; moving a node preserves its entire subtree and stable IDs.
- Undo keeps up to 100 changes in memory. Continuous title editing is grouped until
  focus leaves it; a new edit discards redo. Reloading clears history. Parent deletion
  names the number of descendants before confirmation; Undo recovers the subtree.
- The version 1 tree is saved in localStorage under `branchfold.tree.v1`. Reloading
  the same origin restores it. Use one tab: simultaneous editors are not coordinated.
- **Export JSON** includes the full forest even in a subtree view. Browser storage
  can be cleared or differ across origins/profiles; keep exports for important work.
- **Import JSON** validates version 1 backups up to 2 MB and previews their contents.
  An empty outline offers **Import tree**; a nonempty one requires **Replace tree**
  and warns about replacing current work. Cancel changes nothing. Confirmed imports
  can be undone during the session. Export important work before replacing it.
- Invalid startup data pauses editing without overwriting the original. Write errors
  retain edits in memory and show a warning to export before leaving.
- No task content is transmitted to a service.

## Validate

```sh
npm test
npm run build
npm run preview
```

Unit and rendered UI tests cover tree invariants, navigation/editing modes,
composition guards, context preservation, storage failures, deletion recovery, and
empty/nonempty imports. The production build checks TypeScript and emits `dist/`.

For real Firefox regressions, use the installed Firefox and geckodriver plus Python
3's standard library (no Python packages or backend). In separate terminals:

```sh
npm run dev -- --port 5174 --strictPort
geckodriver --host 127.0.0.1 --port 4444
```

Then run:

```sh
python3 tests/browser_regression.py
```

The suite creates a separate headless profile, uses disposable data on the test
origin, closes its browser session, and writes screenshots/profile files under ignored
`.tools/browser-regression/`. It covers 32-node keyboard entry, real pointer gestures,
edge scrolling, cancellation, imports, history, and reload. Use an idle geckodriver
server; it accepts one session at a time. Stop both test servers when finished.

The v3 user review reports successful Fcitx5 input and satisfactory key mappings.
Synthetic composition tests supplement that feedback; they do not emulate the OS input method.
See [the interaction report](docs/archive/v2_n2_report_interaction.md) for evidence and limits.
Planning states, outcome verification, Markdown portability, cross-tab coordination,
and durable undo remain outside this iteration. [BRANCHES.md](BRANCHES.md) tracks
remaining acceptance work and the real-task-tree trial.
