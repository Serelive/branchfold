# Branch 1 — Markdown renderer and editing design

Historical version-1 design, implemented in version 2. The accepted version-2 review supersedes its context views and narrow-write workflow; see [the current editor contract](b1_v3_implementation.md).

Approved direction from the [N2 questions](archive/b1_v1_n2_review-r1_questions.md), implemented in branch 1 version 2. This reference absorbs the durable decisions from that review. The original version-1 filename identifies the design request.

## Document format

Use ordinary UTF-8 Markdown with GitHub-style checklist items. No front matter, IDs, task grammar, or proprietary metadata is required. Headings separate sections; multiple lists and roots are valid. `-`, `+`, `*`, and ordered-list task markers work when recognized by the Markdown parser. Checked states use `[x]` or `[X]`.

The renderer uses a CommonMark/GFM syntax tree, rather than matching every checklist-looking line. Fenced and indented code, HTML blocks, and malformed checkboxes remain context. Tasks inside ordinary lists or quotes remain at their source positions. Their nearest checklist ancestor supplies task nesting; ordinary-list wrappers remain visible in context.

Titles display their inline Markdown source, including links and emphasis. Supporting paragraphs, tables, quotes, and other constructs use readable source excerpts. This first renderer does not execute HTML, load remote images, or open links. Artifact navigation is Node 4 work.

## Reading and views

A parsed task holds its completion state, parent, and UTF-16 source offsets. The original string is retained; the AST is never serialized back to Markdown. Reading preserves UTF-8 BOMs and original line endings. Invalid UTF-8 and files over 2 MB produce an error.

Concise mode keeps headings visible and folds non-task context between task rows. Detailed mode expands those source excerpts in document order. Collapse, selection, and subtree focus are view state only. A focused subtree includes its nested content; **All tasks** and ancestor buttons restore context. Arrow keys navigate and fold tasks; Enter/F2 starts a supported rename in the editing host.

The model and view state are in memory. No persistent cache or second authoritative plan is created. Later measured performance needs could justify disposable JSON indexes in host-owned per-user cache storage, keyed by document identity, revision, and cache version.

## Narrow editing subset

Rename is enabled for a checklist whose first paragraph fits on its marker line. Multiline titles remain readable and can be edited through **Open source / Undo**. The rename input contains the raw inline Markdown title. It accepts a nonempty single line, preserves existing marker/checkbox/indentation/trailing spaces, and rejects a replacement that changes task recognition. Notes and descendants are outside the replacement range.

Extension requests carry the exact original source and document version. The host reparses that source and calculates the range itself; the webview cannot supply a filename or arbitrary replacement range. It rejects stale snapshots, existing unsaved source edits, and disk content that differs from the editor. A second version check follows disk access. VS Code's versioned `TextEditor.edit` applies the narrow change with an undo boundary.

## Host and recovery

The first writing host is a small VS Code extension. **Branchfold: Open Markdown Task Document** lets the user choose one local Markdown file and opens the renderer beside the source editor. No local server is added. The webview can operate only on that selected document; its content security policy blocks remote resources and arbitrary scripts.

Saving uses VS Code's normal document save path, including its on-disk conflict handling. A failed save keeps the edit in the source editor and reports that it is unsaved. Resolve disk conflicts there; Branchfold never offers a force-overwrite operation. Standard editor undo restores the original title. Use the source editor’s Save As command for an additional copy. Save-time formatting and other installed editor hooks follow the user's VS Code configuration; disable such hooks for byte-minimal editing trials.

Document changes refresh the renderer and reset offset-based view state. An open rename draft retains its original source/version so an external update cannot silently retarget it. Browser-only opening is a read-only preview and explicitly says so; **Download source copy** preserves that opened snapshot. Reopen the file to refresh that browser snapshot.

The [VS Code API](https://code.visualstudio.com/api/references/vscode-api) supplies document versions, editor edits, save results, and change events. The host owns concurrency and recovery; the Markdown adapter owns recognition and source ranges.

## Legacy data and extensions

Existing JSON/browser trees remain available through **Legacy JSON editor**, with their original import/export and persistence. Opening Markdown neither imports nor replaces them. This explicit side-by-side compatibility path avoids an implicit migration; JSON-to-Markdown conversion is separate future work.

The anchor is `sandbox/BRANCHES.md`, an ignored independent project. Validate its task hierarchy and read-only navigation, then use disposable copies for writes. Tests additionally cover mixed content, BOM/line endings, malformed input, stale edits, failed saves, and recovery. Broader task operations and new metadata should extend the source-range adapter only when their preservation rules and workflow value are established.
