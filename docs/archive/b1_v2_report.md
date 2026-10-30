# Branch 1 · Version 2 — Nodes 2 and 3

Implemented the Markdown reader and safe task-renaming slice. The accepted [review](b1_v1_n2_review.md) and [response](b1_v1_n2_review-r1_questions.md) are archived; their durable decisions live in the [renderer design](../b1_v1_n2_design_renderer.md) and [development workflow](../development-workflow.md).

## Results

- **Node 2:** CommonMark/GFM task recognition with source ranges, preserved headings and mixed-content excerpts, concise/detailed modes, selection, folding, keyboard navigation, and subtree focus. Browser file opening is read-only. The original source remains intact; there is no persistent Markdown cache.
- **Node 3:** a VS Code host scoped to one user-selected local document. Single-line task renames replace only their title range. Source/version checks and the editor’s versioned edit/save path handle stale edits and conflicts. Failed saves retain the editor buffer; native undo restores the original. External changes refresh the view while retaining an open rename draft for review.
- **Compatibility:** the legacy JSON editor remains available with its existing storage and backups. Opening Markdown does not replace or migrate that data.

## Validation

- 48 automated tests passed, including mixed Markdown, malformed input, UTF-8 BOM, CRLF/LF, narrow edits, concurrent changes, failed saves, stale drafts, composition guards, and legacy data preservation.
- Type checking, production build, and extension bundle passed.
- Real Firefox checks passed for Markdown opening, context display, folding, focus, keyboard navigation, and source/JSON preservation. The full existing browser regression suite also passed.
- Real VS Code integration passed: built webview startup and host handshake, rename/save preserving BOM and CRLF, undo restoring original bytes, stale-version rejection, retaining externally changed file contents, and live refresh after external edits.
- The local anchor parsed as 52 tasks with matching titles, completion states, order, and nesting; its bytes were unchanged.

## Try it and next work

Run `npm run build:extension`, then `code --extensionDevelopmentPath="$PWD/extension" "$PWD"`. In the development window, run **Branchfold: Open Markdown Task Document**. Browser preview is available through **Open Markdown view** in the normal Vite app. Setup is documented in [README.md](../../README.md).

Rename supports single-line titles; multiline titles and broader structural edits use the source editor. Context and inline formatting currently display as source text. VS Code save hooks follow user settings; disable format-on-save when evaluating minimal diffs. Native Fcitx5 input was not manually tested; automated composition guards passed.

Nodes 2 and 3 are complete for this slice. Node 4 artifact navigation and the real-project workflow comparison remain next; neither was implemented in this round.
