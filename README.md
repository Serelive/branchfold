# Branchfold / 丛序

*A living task tree for plans that evolve with action.*

Branchfold is an experimental, local-first interface for progressive task decomposition. Start with a rough objective, break it into useful steps, and revise the tree as the work develops.

The project is moving toward a **Markdown-native project interface**: your repository owns the task document, and Branchfold provides a focused way to navigate it, edit tasks, and open related files. The goal is to make a project's existing Markdown plan easier to work with.

**Available today:** a React + TypeScript + Vite outline editor with keyboard editing, subtree movement and focus, completion, undo/redo, browser persistence, and JSON backups. Markdown reading and writing are the next development steps. See [BRANCHES.md](BRANCHES.md) for the plan and completed work.

## Run locally

Install Node.js 22.12 or newer with npm, then run:

```sh
git clone https://github.com/Serelive/branchfold.git
cd branchfold
npm ci
npm run dev
```

Open the local URL printed by Vite. Keep the development server running while using the app. The browser application needs no backend or account; the repository's Python scaffold is separate from it.

## Work with a task tree

Click a row background to select a task, or click its title to edit. The mode indicator shows which keyboard commands apply. Use **+ Next** and **+ Child** to grow the tree, and **↗** to focus on a subtree. Breadcrumbs return to an ancestor or **All tasks**.

The left handle combines three actions:

- **Click:** expand or collapse a branch; check or uncheck a leaf.
- **Hold:** preview completion after half a second, then release to apply it. Checking a task checks its descendants; unchecking changes only that task.
- **Drag:** move the subtree. Moving after a hold cancels the completion preview and starts dragging. An insertion line shows placement before or after a subtree; a highlighted row shows placement inside it. Escape cancels the drag.

The right-edge arrow slides the row aside to reveal movement and deletion actions without shifting other rows. If a move takes a task outside the current view, **Go to moved node** reveals it.

### Keyboard shortcuts

| Context | Keys | Action |
| --- | --- | --- |
| Navigation | Enter or F2 | Edit selected title |
| Navigation | B / C | Create sibling / child |
| Navigation | ↑ / ↓ | Select previous / next visible task |
| Navigation | ← / → | Collapse or select parent / expand or select first child |
| Navigation | Ctrl + ↑ / ↓ | Move subtree among siblings |
| Navigation | Space | Toggle completion |
| Navigation | Backspace | Delete selected task and subtree immediately; Undo restores them |
| Navigation | Delete | Delete, with confirmation for descendants |
| Navigation | Ctrl/Cmd + Z / Shift + Ctrl/Cmd + Z | Undo / redo |
| Editing | Enter | Create the next sibling |
| Editing | Tab / Shift+Tab | Indent / outdent |
| Editing | Escape | Finish editing and select the task |
| Subtree navigation | Escape | Return to the parent view |

While editing, Backspace erases one character per tap or three per held repeat. A press starting with text protects the cell from deletion. Release and press again on an empty title to delete it; holding then deletes upward. Empty parents require confirmation.

Title fields retain native text undo. Composition-confirming keys are guarded for IME input. Press Escape to leave title editing before using Tab to reach other controls.

### View options

**Directory guides** switches indentation guides to directory-style connectors. Selecting a task darkens the path and handles back to the visible root; **Ancestor titles** toggles highlighting of the ancestor text. **Leaf drawings** replaces plain leaf rings with outlined leaves. Checked tasks keep the circle and check mark. View options and subtree focus last for the session.

## Saving and recovery

The current prototype saves edits in this browser's localStorage. Use the same browser profile and local URL to return to your tree, and keep one editing tab open at a time. **Export JSON** backs up the full tree, including tasks outside the focused view. Keep exports of important work: clearing browser data removes the stored tree.

**Import JSON** previews a version 1 backup up to 2 MB before replacing the tree. Undo restores a replaced or deleted tree during the session. Outline history holds up to 100 changes, groups continuous title edits, and resets on reload.

If saved data cannot be read, the app preserves it and pauses editing. If saving fails, edits remain in memory and the app prompts you to export them. Task content stays local.

Markdown support will build on this editor with source-preserving edits, external-change handling, and project-relative file links. Existing JSON trees will need an explicit compatibility or migration path as that work proceeds.

## Development

```sh
npm test
npm run build
npm run preview
```

Tests cover tree operations, editor interactions, storage, and recovery. The build type-checks TypeScript and generates `dist/`; preview serves that production build locally.

For the real-browser regression suite, install Firefox and geckodriver and use Python 3. Start these in separate terminals:

```sh
npm run dev -- --port 5174 --strictPort
```

```sh
geckodriver --host 127.0.0.1 --port 4444
```

Then run:

```sh
python3 tests/browser_regression.py
```

The suite uses disposable task data and a separate headless Firefox profile. It covers keyboard entry, pointer gestures, scrolling, imports, history, and reload, and saves artifacts under ignored `.tools/browser-regression/`. Stop the test servers when finished. Desktop shortcuts and IME behavior also benefit from hands-on testing on your system.

## Contributing and project direction

Bug reports are most useful with reproduction steps, expected behavior, and browser/OS details. For feature ideas, describe the project workflow and how the change would improve on editing its Markdown directly. Use a small sample document when reporting document-handling issues.

Start with [BRANCHES.md](BRANCHES.md) for current work and [AGENTS.md](AGENTS.md) for product principles, data-integrity requirements, and contributor guidance. The next milestones are reading an existing task document, persisting a narrow edit safely, and linking tasks to project files. A real-repository trial will guide the choice of host and subsequent features.
