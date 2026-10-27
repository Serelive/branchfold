# AGENTS.md — Branchfold / 丛序

## Identity and purpose

**Branchfold (丛序)** is an experimental, local-first interface for planning and executing work through **progressive task decomposition**.

**Tagline:** *A living task tree for plans that evolve with action.*

The tree is a revisable model of work, not a fixed contract. Users develop a rough objective into actionable parts, work on them, connect actions to results, and revise the plan as understanding changes.

**Current product direction:** Branchfold is a **Markdown-native project interface**, not a replacement for Markdown or an independent task database. A project owns its task document (commonly `BRANCHES.md`); Branchfold offers a specialized view and editing experience over that document, with links to project files and other evidence of work. An IDE extension, standalone local reader, and multi-project overview are possible hosts or later products, not commitments to build them all.

The central test is whether Branchfold improves a real project workflow **relative to editing its Markdown file directly**, without introducing more maintenance than it saves.

## Product principles

1. **Project-owned data.** Markdown is the source of truth. The plan must remain readable, editable, versionable, and useful without Branchfold.
2. **Enhance, do not duplicate.** Avoid a parallel authoritative tree, forced migration, or synchronization work created solely by the application.
3. **Plan progressively.** Incomplete, uncertain, and exploratory tasks are legitimate. Do not enforce exhaustive breadth-first planning, rigid depth-first execution, or mandatory task grammar.
4. **Local focus, global context.** Provide compact hierarchical views, subtree focus, and an easy path back to project context.
5. **Make revision cheap.** Capture, expand, move, split, prune, and rename nodes without unnecessary controls or ceremony.
6. **Connect plans to work.** Make it easier to open project resources, associate tasks with artifacts, and inspect completion evidence. Start with ordinary Markdown links.
7. **Separate activity from achievement.** Checking off planned steps need not prove that a broader outcome was achieved; avoid misleading automatic completion or progress estimates.
8. **Local-first and interoperable.** No account, cloud service, AI service, or always-on server should be required for core project-local use. Respect existing editors, Git workflows, and coding agents.

## Scope and conceptual model

- A **project** is typically a directory/repository with a Markdown task document. A single document may contain one root, multiple roots, or a forest; do not force a global Life/Work/Study hierarchy.
- A **task node** may denote an objective, action, question, investigation, or deliverable. Parent-child edges primarily represent decomposition, not necessarily dependency or chronology.
- **Execution**, **planning maturity**, and **verification** are conceptually separate. Only persist additional statuses or metadata once their Markdown representation and user value are established.
- **Artifacts** are files, links, notes, results, or other evidence associated with tasks. Task-to-artifact relations need not be one-to-one. Do not introduce a second deliverable tree without a demonstrated need.
- A task may have no concrete artifact. Do not force every leaf to create a file or require a `verb + object` title.
- Treat summaries of completed descendants as descriptive, not as estimates of time remaining or proof that a parent objective succeeded.

Favor the smallest representation that preserves the user's meaning. Ordinary Markdown checklist items (`- [ ]` / `- [x]`) are the natural starting point for tasks; ordinary Markdown links are the starting point for artifact references. Headings, prose, non-task lists, code fences, and existing user conventions may coexist in the document. Do not silently reinterpret all Markdown as tasks or impose a proprietary schema.

## Markdown interoperability and data integrity

These are core product requirements, not optional polish:

- **Preserve the document.** Reading and rendering Markdown must not alter it. A no-op parse/render cycle must leave its bytes unchanged. A targeted edit should preserve unrelated text, heading structure, whitespace, indentation, line endings where practical, links, and unsupported Markdown constructs. Avoid whole-file regeneration that produces noisy Git diffs.
- **Scope edits carefully.** When changing a task, preserve its associated notes and descendants as appropriate. A subtree move must not orphan nested content or corrupt neighboring sections.
- **Handle external edits.** IDEs, Markdown editors, and coding agents may edit the same file. Detect on-disk changes, refresh safely, and never overwrite newer content using stale in-memory state. When reconciliation is uncertain, stop and present a conflict rather than guessing.
- **Treat unsupported input conservatively.** Malformed or ambiguous structures should not cause silent deletion or lossy normalization. Limit write operations to constructs the implementation can handle reliably; otherwise offer read-only display or an explicit error.
- **Keep references portable.** Prefer project-relative Markdown links and resolve them relative to the document location. Account for spaces, path encoding, moved files, and broken links. Do not assume an IDE automatically updates every reference on rename or move.
- **Keep recovery possible.** Preserve undo/redo where feasible, make destructive subtree operations reversible, and provide a safe way to inspect or recover the original Markdown. Avoid destructive imports and silent storage migrations.
- **Do not confuse cached state with authority.** Internal node IDs, UI state, indexes, and browser storage may assist interaction, but must not silently become a second authoritative plan. Choose any persistent identity convention carefully and keep added metadata minimal.

When the implementation can access local files, obtain access through an appropriate host integration, restrict writes to the intended document, and avoid reading or transmitting unrelated project files without user action. Opening or attaching a file should not execute it.

## Interaction design

Preserve the strengths of the current hierarchical editor while adapting it to Markdown:

- Distinguish **selected node**, **text editing**, **focused subtree/view root**, and **dragging**. These are separate UI concepts.
- Keep outline-style typing natural: an editing `Enter` can create the next sibling; indentation and outdentation should be efficient. Navigation mode may use different keys. Do not silently remap established shortcuts without a reason and tests.
- Support both keyboard and pointer interactions for common structural operations; dragging is useful but cannot be the only way to move distant subtrees.
- Maintain compact, readable hierarchy cues and accessible focus indication. Secondary menus should not cause avoidable layout shifts.
- Preserve IME behavior, including Fcitx5: composition-confirming `Enter` must not accidentally create a node.
- Subtree focus changes the view, not the underlying document structure. Moving a node out of the current view must have a predictable result.

Avoid implementing aesthetic experiments (weighted branches, mandatory color-coded grammar, project wheels, elaborate dashboards) without a specific validated use case.

## Architecture and host strategy

**Inspect the actual repository before deciding what exists.** Preserve the working React/TypeScript/Vite implementation where it remains useful, but do not assume the repository layout or dependencies from this document alone.

Keep responsibilities separable:

1. **Markdown adapter:** recognize supported task structures, map source ranges, apply narrow edits, and preserve unrelated content.
2. **Domain operations:** task-tree selection, reorder/reparent, completion, artifact association, and invariants; test without rendering.
3. **Host/file adapter:** read and write project documents, watch for external changes, open/select project files, and report conflicts.
4. **UI:** focused tree rendering, direct editing, keyboard and pointer interactions, and artifact navigation.

Prefer clean interfaces over prematurely extracting many packages. One repository can contain shared core code and multiple hosts if that becomes justified. **Do not use permanent Git branches as a substitute for separate application modules.**

A browser-only prototype cannot assume unrestricted filesystem access; an IDE extension, desktop wrapper, or explicitly authorized local service may be needed. Choose and test one host at a time. Do not add a backend, account system, sync service, or elaborate multi-project index without a concrete requirement.

Treat any existing JSON/browser-storage format as **legacy prototype data** until an explicit, tested migration or compatibility decision is made. Never silently discard users' existing trees.

## Development priorities (not automatic authorization)

The current direction favors small, independently testable vertical slices:

1. **Read:** render an existing project task document without replacing or modifying it.
2. **Write safely:** edit one supported task operation and persist a minimal Markdown change, including handling external modifications.
3. **Link:** attach and open a project file from a task, creating a standard Markdown link.
4. **Integrate:** evaluate an IDE view or standalone local reader using a real repository; pick a host based on workflow value.
5. **Expand only when justified:** project discovery, multi-project overview, richer verification, and other features are later hypotheses.

Do not implement this entire list merely because it is present here. The user's current instruction and the active development tree determine scope. Favor experiments that demonstrate measurable advantages over the direct Markdown workflow.

## Development plan — `BRANCHES.md`

Use Branchfold's methodology for its own development. Maintain a concise, evolving task tree in the repository's `BRANCHES.md` unless the user or repository establishes another location.

- Read it before substantive work and create it if needed; retain user-authored tasks and decisions.
- Record the **Current focus**, nearby work, uncertainties, and useful acceptance criteria. Prefer nested Markdown checklists that remain comprehensible in ordinary editors.
- Update it at meaningful checkpoints, not after every command. Check items only when the stated result was achieved and verified as appropriate.
- Revise or prune obsolete plans, but avoid rewriting history or discarding context indiscriminately. Keep completed history compact.
- Where useful, link completed tasks to code, reports, tests, or artifacts using ordinary Markdown paths.
- `BRANCHES.md` is a **coordination document, not a blanket instruction or an autonomous backlog**. Do only what the latest user request authorizes.
- Because this file may be edited by the user, Codex, and eventually Branchfold itself, treat concurrent modifications and unnecessary reformatting especially carefully.

Keep roles distinct: `AGENTS.md` holds durable agent instructions; `BRANCHES.md` holds current work state; `README.md` explains the project to people. Do not add session-specific repository conditions or temporary prompts to this file.

## Engineering and Git conventions

- Prefer readable code, small reversible changes, and tests for behavior rather than speculative abstractions.
- Maintain invariants for subtree moves, ordering, parent relationships, undo, and document edits. Reject cycles and invalid move targets.
- Test Markdown round trips, nested content, unrelated-content preservation, malformed input, external-edit conflicts, artifact-link paths, and data recovery as relevant to the change.
- Run available tests, type checks, and builds. Automated component tests do not replace a real-browser check for important drag, keyboard, layout, and IME behavior; report when manual/browser validation was not performed.
- Keep one repository for now. Favor short-lived `feat/`, `fix/`, `refactor/`, or `spike/` branches for coherent work and experiments; integrate validated work into the repository's established stable branch. Do not assume its name.
- Preserve uncommitted changes and unrelated files. Do not create repositories/remotes, change branches, commit, push, publish, rewrite history, or install global tooling unless the user requests it or explicitly authorizes the action.
- Do not transmit user tasks or project files to external services by default. Avoid hard-coded personal paths and environment-specific assumptions.

## Writing style — human-oriented technical documentation

Write technical documentation for the people who use and develop Branchfold. Apply these principles to READMEs, guides, implementation references, and other technical prose:

1. **Serve the reader's task.** Help readers understand concepts, follow procedures, perform tasks, and make informed decisions. Organize explanations around their needs rather than hypothetical reviewers' objections.
2. **Be rigorous and direct.** State well-supported conclusions clearly. Include exceptions, qualifications, and evidentiary caveats when they materially affect a conclusion, procedure, or decision.
3. **Explain what to do and why.** Prefer affirmative instructions. Use prohibitions for concrete risks or likely mistakes, and avoid repetitive statements about what something does not imply or prove.
4. **Give information a clear hierarchy.** Keep essential concepts and procedures in the main narrative. Group secondary limitations, boundary conditions, and supplementary details where readers can find them without interrupting the flow.
5. **Use caution where it matters.** Preserve genuine limitations, meaningful uncertainties, and important technical warnings. Remove invented objections and repeated qualifications that add no useful information.
6. **Write connected, concise prose.** Favor readability, coherence, and useful information density. Avoid excessive fragmentation, redundant explanations, and unnecessary emphasis while retaining details needed for understanding and implementation.
7. **Review as a human reader.** Check whether the intended audience can understand the document and act on it. Remove defensive language that adds no substantive value, and favor clarity over rhetorical invulnerability.

Maintain factual accuracy, necessary technical detail, and honest uncertainty. For public-facing documentation, clearly distinguish working functionality from planned capabilities, and provide setup instructions that work from a fresh checkout.

## Coding-agent workflow

**Before:** Inspect the repository and Git status, read relevant docs and `BRANCHES.md`, identify the smallest requested deliverable, and check what existing functionality must be preserved. Clarify a genuinely blocking ambiguity; otherwise use a conservative, reversible assumption.

**During:** Make targeted changes, reuse working code and conventions, keep domain/Markdown/file/UI concerns from becoming entangled, and update `BRANCHES.md` at meaningful milestones. Do not silently broaden scope.

**After:** Run relevant checks; explain what changed, what was actually validated, and what remains uncertain. Update `BRANCHES.md` to reflect verified progress and the next action. Never claim an unperformed browser test or successful migration.

## Success criterion

Branchfold should let a user open a project's existing Markdown task tree, focus on a meaningful part of it, revise tasks, navigate to relevant project files, and associate work with its artifacts **without creating a second plan to maintain**. It must keep the Markdown document safe and useful to ordinary editors and coding agents.

A more attractive outline alone is not enough. Continue expanding the product only when a real task demonstrates an advantage over maintaining the Markdown directly.
