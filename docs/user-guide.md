# Using Branchfold

## Import and export task trees

Open **Settings**, then choose **Import Markdown** or **Import JSON** and select a file up to 2 MB. Markdown imports copy checklist tasks and their nesting into the editor, omitting headings, notes, and other unstructured content. The original file stays unchanged. Both formats use the same editor after import.

Choose **Replace tree** or **Append roots** in **Import mode**, then review and confirm the import. Appending adds roots after the existing tree. Undo can restore a replaced tree or remove appended tasks.

**Export Markdown** writes standard nested checklist lines; **Export JSON** writes a version-1 backup. Both export the whole tree. In the browser, the imported file has no continuing connection to the edited tree: use export to obtain an updated file.

## Edit a project document in VS Code

Build and launch the development host from the repository root:

```sh
npm run build:extension
code --extensionDevelopmentPath="$PWD/extension" "$PWD"
```

Run **Branchfold: Open Markdown Task Document** in the Command Palette and choose a file. The extension uses the same task UI and editing gestures as the web app. Edits stay in its working tree until **Save document** or Ctrl/Cmd+S. Saving replaces the file with its structured checklist tree; headings, notes, and other unstructured content are omitted. **Open source** shows the attached document, where editor undo can restore the previous content after a save.

External changes refresh a clean view automatically. If you have unsaved tree edits, the extension keeps them and shows a conflict. Review the source, export your local tree, or choose **Reload source** and confirm discarding local edits. Resolve existing unsaved source-editor changes before saving from Branchfold. Closing a view with unsaved edits opens an untitled recovery document containing those tasks. A recovery draft is also kept in VS Code workspace state until saved or explicitly discarded.

The [shared editor reference](shared-editor.md) describes the conversion format and save behavior.

## Work with a task tree

Click a row background to select a task, or click its title to edit. The mode indicator shows which keyboard commands apply. Use **+ Next** and **+ Child** to grow the tree, and **Focus subtree** in the right-edge sliding tray to focus on a subtree. Breadcrumbs return to an ancestor or **All tasks**.

The left handle combines three actions:

- **Click:** expand or collapse a branch; check or uncheck a leaf.
- **Hold:** preview completion after half a second, then release to apply it. Checking a task checks its descendants; unchecking changes only that task.
- **Drag:** move the subtree. Moving after a hold cancels the completion preview and starts dragging. An insertion line shows placement before or after a subtree; a highlighted row shows placement inside it. Escape cancels the drag.

The right-edge arrow slides the row aside to reveal **Focus subtree**, **Delete cell** (promote its children in place) and **Delete subtree**, without shifting other rows. If a move takes a task outside the current view, **Go to moved node** reveals it.

### Appearance and language

Open **Settings** for **Dark mode**, **Chinese mode / 中文**, visualization options, and import/export. The drawer starts closed; Escape or a click outside closes it. Dark mode and Chinese mode start off and remember your choices in local storage. Task titles remain unchanged when switching languages. Directory guides, Ancestor titles, Leaf drawings, and Expanded branch bars start enabled; Unchecked branch bars starts disabled.

### Keyboard shortcuts

| Context | Keys | Action |
| --- | --- | --- |
| Navigation | Enter or F2 | Edit selected title |
| Navigation | B / C | Create sibling / child |
| Navigation | ↑ / ↓ | Select previous / next visible task |
| Navigation | ← / → | Collapse or select parent / expand or select first child |
| Navigation | Ctrl + ↑ / ↓ | Move subtree among siblings |
| Navigation | Ctrl + ← / → | Outdent / indent selected subtree |
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

**Directory guides** switches indentation guides to directory-style connectors. Selecting a task darkens the path and handles back to the visible root; **Ancestor titles** toggles highlighting of the ancestor text. **Leaf drawings** replaces plain leaf rings with outlined leaves. Checked tasks keep the circle and check mark. All three options start enabled. View options and subtree focus last for the session.

## Saving and recovery

The browser editor saves its working tree in localStorage, whether it was created directly or imported from Markdown or JSON. Use the same browser profile and local URL to return to your tree, and keep one editing tab open at a time. **Export JSON** backs up the full tree, including tasks outside the focused view. Keep exports of important work: clearing browser data removes the stored tree.

**Import JSON** previews a version 1 backup up to 2 MB before replacing the tree. Undo restores a replaced or deleted tree during the session. Outline history holds up to 100 changes, groups continuous title edits, and resets on reload.

If saved data cannot be read, the app preserves it and pauses editing. If saving fails, edits remain in memory and the app prompts you to export them. Task content stays local.

The VS Code extension keeps its working tree separate from browser storage and saves only on request. Project-relative artifact navigation remains planned work.
