# Branch 1 · Version 1 · N2 — Cache and rendering questions

Response to [the N2 review](b1_v1_n2_review.md), covering “Read a project task document.” The recommendations below inform the next design step; they do not define a Markdown protocol.

## Working agreements

Development is on branch 1, version 1 (`feat/markdown-integration`), inherited from `main`, version 3. The test document is `sandbox/BRANCHES.md`, called the **anchor**. Branchfold's Markdown rendering interface is the **renderer**. The sandbox is an independent project root, with its artifacts and links contained inside it.

The initial trial will open the anchor, inspect its hierarchy and completion states, select tasks, focus on a subtree, and return to the full forest. Reading and navigation should leave its bytes unchanged. Later trials will rename a task and open an associated local file, comparing each workflow with editing Markdown directly. The anchor supplies a real task tree; separate fixtures will cover mixed prose, code fences, unusual formatting, and malformed input.

## Should editing use a cache?

**Use an in-memory working model, with Markdown as the persistent source of truth.** Reading a document produces a view model for rendering and navigation, together with the original source and task source ranges. This lets the renderer respond quickly without repeatedly reading the file or rewriting it during selection and focus changes.

For future editing, translate an operation into a narrow change to the source. Before saving, use the host integration to detect whether the document changed externally. Refresh or present a conflict when the edit is based on an older revision. The host must account for changes between checking and writing; the exact mechanism belongs to host design.

A persistent JSON tree would introduce a second copy to reconcile with the Markdown document. The first read-only slice has no need for that extra storage. Keep its parsed model and view state in memory, discard them when the document closes, and rebuild them from Markdown when it opens again. No cache file or cache directory is needed initially.

If a later performance measurement justifies a disk cache, **JSON is a reasonable format for derived indexes and view state**: it is easy to inspect and supported by the current TypeScript implementation. Store it in the chosen host's per-user application cache area, keyed by project/document identity and source revision, with a cache-format version. A browser host can use host-managed browser storage; a desktop or IDE host can use its designated storage area. The location should be chosen with the host, rather than adding generated files to every project. Stale or deleted cache data should be rebuilt from the Markdown document.

Unsaved edits need explicit recovery handling rather than being treated as disposable cache. Likewise, existing version 1 JSON backups and browser trees remain user data and require an explicit compatibility or migration path.

## How should mixed Markdown be rendered?

**Recommend a concise outline with expandable context, plus a detailed view that preserves document order.** Recognize supported checklist items as tasks through Markdown structure, so checklist-looking text in a code block remains code. Exact recognition and association rules are the pending N2-3 design work.

In the concise view, emphasize task titles and completion. Keep section headings visible to orient the reader, and show an expandable context indicator for associated notes or other content. In the detailed view, show that content in its original relative position. Use quieter styling for supporting prose while keeping it readable. Preserve content whose relationship to a task is unclear at its document position rather than assigning it to a guessed parent.

| Approach from the review | Recommendation and reason |
| --- | --- |
| Omit all non-task text from the renderer | Avoid as the only view: notes and headings often explain what a task means. Concise mode can collapse them with a visible way to reveal them. |
| De-emphasize non-task text | Use for supporting context; retain enough contrast and hierarchy to read it comfortably. |
| Render all content at normal emphasis | Offer through a detailed view, using ordinary Markdown hierarchy to distinguish headings, prose, and tasks. |
| Collect non-task text at the bottom | Avoid as the default: moving notes away from their tasks makes their context harder to follow. |
| Put context in a side panel | Consider later if inspecting long notes while navigating the tree proves useful; it adds navigation and narrow-screen complexity. |
| Fold context between task cells | Use as the starting approach, preserving source order and revealing context near the relevant tasks. |
| Switch concise/detailed modes | Recommend: concise supports task navigation; detailed supports reading and checking context. |
| Accept only strictly formatted Markdown | Use a precisely defined subset for editable operations, while allowing existing documents to be viewed with surrounding content preserved. |

A useful additional strategy is to preserve section boundaries in the outline rather than flattening every checklist into one apparent tree. Unsupported content can be shown as a source excerpt when a richer rendering is unavailable. This keeps the document understandable while the renderer's supported subset grows.

For later writes, enable operations only where source boundaries and relationships are understood. This combines flexible reading with predictable edits, without requiring users to convert an entire document before viewing it.

## Next step and stop point

N2-3 will define the flexible Markdown-based format, supported constructs, task/context association, fallback behavior, and extension approach. Its requested document is `b1_v1_n2_design_renderer.md`.

That step is marked **Next** in the review and awaits a separate request. No format specification, parser, renderer, cache, or file-writing implementation is introduced by this response. The original review remains in place; the durable naming, anchor, and workflow agreements are recorded in [development-workflow.md](../development-workflow.md).
