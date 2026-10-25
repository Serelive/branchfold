# Branchfold / 丛序

A living task tree for plans that evolve with action.

This first prototype is a local React + TypeScript + Vite application. Create root tasks and children, edit titles directly, and complete or reopen individual nodes. Completing children never completes their parent automatically.

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
- Check a task to complete it; uncheck it to reopen it. Parent and child completion are independent.
- Data is saved under `branchfold.tree.v1` in this browser's localStorage, including stable IDs, hierarchy, and array-based sibling order. Reloading the same origin restores it.
- **Export JSON** downloads the current tree as a versioned backup. Browser storage is not durable: clearing site data, using another browser profile, or changing the server origin can hide or remove it. Keep exports for important work. There is no import UI yet.
- Invalid saved data or unavailable storage at startup pauses editing without overwriting the original. Save failures during editing keep changes in memory and prompt export before leaving.
- Use one tab at a time: simultaneous editors are not coordinated. Task content is never sent to a service.

## Validate

```sh
npm test
npm run build
npm run preview
```

Tests cover immutable tree edits, independent completion, ordered persistence round trips, invalid data, and the UI create/rename/complete/reopen flow across remounts. The production build checks TypeScript and produces a static `dist/` bundle.

This slice does not yet include deletion, moving/reordering, collapse, subtree focus, undo, imports, planning states, or outcome verification. See [BRANCHES.md](BRANCHES.md) for the living development plan.
