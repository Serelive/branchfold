# Shared task editor

Branchfold uses the same task editor in the browser and VS Code. Markdown and version-1 JSON imports produce the same working tree. The [version-2 review](archive/b1_v2_review.md) established this workflow; the accepted [version-3 re-review](archive/b1_v3_review-r1.md) adds tool annotations.

## Import and export

Import copies checklist tasks, their first-paragraph labels, completion, order, and ancestry. Headings, separate notes, ordinary lists, and code examples are omitted. Inline links and formatting remain literal title text. Imports offer append or replace, preview, cancellation, and undo. Appended tasks receive fresh internal IDs. Directory guides, ancestor titles, and leaf drawings start enabled.

Markdown export writes standard checklist lines with two-space nesting. Titles are escaped to preserve literal punctuation, whitespace, and Unicode. Recognized tool annotations are emitted separately. JSON backups retain the complete working tree, including tool labels. Neither format requires metadata on ordinary tasks.

The browser imports once into an independent tree stored locally. Export downloads a new file. Importing establishes no live connection to the original source.

## Suggested tools

A task can name a tool where work may continue:

```markdown
- [ ] Review the plan <!--branchfold:{"tool":"ChatGPT"}-->
- [ ] Edit the prototype <!--branchfold:{"tool":"VS Code"}-->
```

The comment is inert metadata. It creates a labeled badge, without launching a tool or transmitting task content. Each task owns its annotation; descendants do not inherit it. Tool labels remain visible on completed tasks.

Use the row's right-edge arrow, then **Tool**, to edit the label. Apply a blank value to remove it. Apply and removal participate in outline undo; Escape or Cancel leaves the label unchanged. The title editor shows only the task title.

One trailing annotation in the task's first paragraph is recognized, outside inline code. The object must contain only a nonempty string `tool` field. Surrounding name whitespace is trimmed; comment delimiters and control characters are rejected. Malformed, duplicate, unknown-field, and literal examples remain visible title content. Export escapes that literal content so subsequent imports preserve it.

A deterministic mapping of the trimmed, Unicode-normalized, case-insensitive name selects one of six macaron color families. Light and dark themes use corresponding readable foreground/background pairs. Different tools may share a palette color; the badge text identifies the tool. Long labels truncate visually and expose their full name on hover. Tool labels survive JSON backups, Markdown saves, structural edits, completion, and draft recovery.

## Editing and display

Selection, title editing, subtree focus, and dragging remain distinct. Editing Enter creates a sibling; Tab/Shift+Tab indent/outdent. Navigation Enter edits; B/C create a sibling/child. Existing IME composition guards remain active. Moves work by keyboard and drag, with cycle rejection and session undo/redo.

Leaf handle clicks toggle completion; branch clicks fold/unfold. Long-press previews subtree completion; release confirms, while movement cancels the preview and starts dragging. Checking cascades to descendants; unchecking changes only the selected task. Opening a folded branch reveals the first unchecked leaf's ancestor path, collapses preceding branches, and expands later branches in that subtree. If all leaves are checked, it shows immediate children.

The sliding action tray offers Tool, Delete cell, and Delete subtree. Delete cell promotes children in place. Subtree deletion confirms when descendants exist; undo restores either operation. In navigation, Backspace directly deletes the selected subtree. In title editing, a Backspace press that starts with text only erases text; a new press on an empty title can remove the task. Held text deletion removes three graphemes per repeat.

Expandable handles use sharp 18 × 3 px bars rotating around the handle center. **Unchecked branch bars (A) defaults off; Expanded branch bars (B) defaults on.**

| A | B | Bars |
| --- | --- | --- |
| On | On | All parents; animated horizontal below when folded, vertical right when expanded |
| On | Off | Folded parents only; vertical right, instant appearance/disappearance |
| Off | On | Checked parents only; animated |
| Off | Off | None |

The Settings drawer starts closed. It groups appearance, tree display, and import/export. Dark mode and Chinese mode start off and persist separately from tasks. Chinese mode translates controls without changing task content. The shared palette explicitly styles the body to avoid inheriting VS Code's foreground color.

## VS Code saves and recovery

Opening a document imports its structured tree. Edits remain in the working tree until **Save document** or Ctrl/Cmd+S. Save replaces the selected file with checklist Markdown, intentionally omitting unstructured content. VS Code retains the original document in native undo; encoding and line endings follow the document.

Clean views refresh after source edits. Dirty views retain their work and report a conflict. Reload requires a discard choice. Saves compare source/version and on-disk contents; newer edits are retained rather than overwritten. Existing unsaved source-editor changes must be resolved first. Failed saves retain the working tree.

Drafts persist in VS Code workspace state against their source snapshot. Reopening restores them, reporting a conflict if the source changed. Closing a dirty view also opens an untitled Markdown recovery document. Saving clears the draft. Exports use Save As and target a separate file.

## Implementation and checks

The [Markdown adapter](../web/markdown.ts), [task model](../web/tree.ts), [annotation helpers](../web/toolAnnotation.ts), and [shared editor](../web/App.tsx) implement the format and interactions. The [document session](../web/Workspace.tsx) and [host controller](../extension/controller.ts) govern explicit saving and conflicts.

Run `npm test` and `npm run build:extension` for automated behavior, types, and both builds. The [VS Code integration test](../tests/vscode.integration.cjs) checks actual webview rendering, theme switching, annotated saves, recovery, undo, and external-edit conflicts; its launch command is in the [README](../README.md). Automated checks do not cover native Fcitx5 or a manual visual inspection of every layout.
