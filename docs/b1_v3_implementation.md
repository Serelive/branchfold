# Shared task editor — branch 1, version 3

The accepted [version-2 review](archive/b1_v2_review.md) replaces the separate Markdown reader with the existing task editor in both web and VS Code. The [version-2 report](archive/b1_v2_report.md) preserves the earlier implementation history.

## Data and interaction contract

**Structured parts** are checklist task structures. **Unstructured parts** are headings, supporting paragraphs, code examples, ordinary lists, and other surrounding content. Import recognizes Markdown structure, including nested checklists, and retains task labels, order, completion, and ancestry. Only a task’s first paragraph supplies its label; separate notes are omitted. Inline links and formatting remain literal label text, including destinations. Concise/detailed context modes are removed.

Markdown and version-1 JSON imports become the same tree. **Replace tree** replaces the current forest; **Append roots** adds imported roots after existing roots. Appended nodes receive fresh IDs so repeated imports remain independent. Imports have a preview and can be cancelled or undone. An empty import can clear a tree only through the replace confirmation.

The shared UI supports inline titles, sibling/child creation, indentation/outdentation, completion, deletion, drag and keyboard moves, focus, folding, and undo/redo. Directory guides, ancestor titles, and leaf drawings start enabled. The existing composition and long-press rules apply to both formats and both hosts.

Exports write two-space-indented `- [ ]` / `- [x]` lines. Task labels are escaped as literal Markdown text, preserving punctuation, link text, whitespace, and Unicode through reimport; blank tasks remain blank checklist lines. Only the checklist tree is exported. JSON export remains available.

## Web: import, edit, export

The web app is an external tool. Import reads a file once; the original file has no live connection to the resulting tree. Subsequent changes persist in the existing browser storage. **Export Markdown** and **Export JSON** download the whole tree, including tasks outside the focused subtree. Existing browser trees use the same storage key and remain available until a confirmed replacement.

## VS Code: import, edit, save

Opening a selected Markdown document imports its structured tree into the same UI. Every tree edit stays in the working model until **Save document** or Ctrl/Cmd+S. Save deliberately replaces the document with the exported checklist tree, omitting unstructured content. The source editor’s undo history retains the previous document; existing encoding and line-ending conventions follow VS Code.

Clean trees refresh automatically when the source changes. If local edits exist, the view retains them and reports a conflict. **Reload source** requires a discard choice; exports remain available to keep the working tree. Saves compare the original source and document version, check disk content, then use the editor’s versioned edit and save path. Existing unsaved source-editor edits must be resolved first. Failed saves retain the working tree and any applied source buffer.

The host retains unsaved drafts in VS Code workspace state, keyed by the selected document, and restores them when the view reopens. They remain recovery data against the recorded source version; a changed file produces a conflict. Closing a view with local edits opens its tasks in an untitled Markdown recovery document. Saving clears that draft. Exports use VS Code’s Save As dialog and must target a separate file; updating the attached file uses Save document and its conflict checks.

## Code and checks

- [Shared editor](../web/App.tsx), [document session](../web/Workspace.tsx), and [Markdown conversion](../web/markdown.ts).
- [Host save boundary](../extension/controller.ts) and [VS Code integration](../extension/extension.mjs).
- `npm test` covers conversion, append identity, shared UI, explicit saving, conflicts, and failures. `npm run build:extension` checks types and builds both hosts.
- `python3 tests/browser_markdown.py` exercises the import/edit/export workflow; `tests/browser_regression.py` covers established keyboard, pointer, layout, and recovery behavior.
- `tests/vscode.integration.cjs` exercises the real webview, explicit save, source undo, stale snapshots, and external refresh. See [README.md](../README.md) for the launch command.

Validated in this round: 51 automated tests, type checking, both builds, the Markdown Firefox workflow, and the full existing Firefox regression suite passed. Real VS Code checks passed for webview startup, deferred writes, explicit structured saves, original-document undo, external changes, and recovery on view closure. The current 52-task anchor round-tripped with its hierarchy, labels, and completion intact; its user-edited source was unchanged. Native Fcitx5 input was not manually exercised; automated composition checks passed.
