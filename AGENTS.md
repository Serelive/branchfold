# AGENTS.md — Branchfold / 丛序

## Identity and purpose

**Branchfold (丛序)** is an experimental, local-first tool for planning and executing complex work through **progressive task decomposition**.

**Tagline:** *A living task tree for plans that evolve with action.*

A user begins with a rough objective, expands it into smaller tasks as understanding improves, acts on manageable parts, verifies outcomes, and revises the structure when new information appears. The tree is a **provisional model of the work**, not a fixed contract.

The project's central test is practical: **Can Branchfold make maintaining and acting on a task tree easier than editing a Markdown outline?** Favor improvements that answer this question over adding features.

Use **Branchfold** as the English product name and **丛序** as the Chinese name. Use *task tree* as the generic name for the underlying representation. The repository name, packaging, and chosen stack may evolve independently of the product identity.

## Product principles

1. **Capture first, formalize later.** A node may begin as an incomplete thought; creating and revising it must be inexpensive.
2. **Local focus, global context.** Users should be able to see a compact project outline or focus on a subtree without losing their place.
3. **Plan progressively.** Encourage considering important sibling tasks before pursuing a branch deeply, but do not enforce exhaustive breadth-first planning.
4. **Execute flexibly.** Support working on actionable leaves and returning to their parents; do not require rigid depth-first traversal.
5. **Treat plans as revisable.** Adding, moving, splitting, rewriting, or pruning branches should be routine, not exceptional.
6. **Separate activity from achievement.** Completing every planned child does not necessarily prove that a parent objective was achieved.
7. **Prefer low interaction cost.** Compact display, direct editing, keyboard navigation, and few mandatory fields matter more than elaborate dashboards.
8. **Remain local-first and portable.** Core editing must not require an account, network access, or AI services; task data must be recoverable and exportable.

## Conceptual model

A **forest** contains project roots. Each **node** may represent an objective, deliverable, action, question, or unresolved item. Parent-child relationships express *decomposition*, not necessarily execution dependencies. Avoid pretending a tree can encode every cross-branch dependency.

Keep distinct:

- **Execution state:** such as `todo`, `doing`, `done`, `blocked`.
- **Planning state:** such as `unexplored`, `partial`, `planned`.
- **Verification:** optional acceptance criteria or evidence that an outcome was achieved.
- **Derived progress:** an informative summary of descendants, **not** an estimate of remaining effort or a guarantee of success.

An unexplored leaf is legitimate. A leaf can be ready for action, ready for verification, or in need of further decomposition.

A parent may be marked **ready to verify** once its children are done, but outcome-oriented parents must not be declared achieved solely on that basis. Automatic roll-up may be appropriate for purely administrative grouping nodes if semantics are explicit.

The data model should maintain stable node IDs, explicit sibling order, valid parent relationships, and predictable subtree operations. Reparenting must not create cycles. Keep tree/domain logic testable without rendering the UI.

## MVP boundaries

Develop incrementally. These phases describe **priorities, not a blanket instruction to implement the entire roadmap**.

### Phase 1 — Usable outline

- Create, rename, delete, indent, outdent, and reorder nodes.
- Expand/collapse branches and focus on a subtree.
- Mark work done or not done; support a clear current-focus indicator.
- Provide efficient keyboard interaction and recovery from accidental edits.
- Save and restore work reliably, preserving hierarchy and ordering.

### Phase 2 — Task-tree semantics

- Represent planning state independently of execution state.
- Distinguish completed child tasks from a verified parent outcome.
- Make unexplored branches and actionable leaves easy to identify.
- Introduce brief notes or acceptance criteria only when demonstrably useful.

### Phase 3 — Portability and demonstration

- Support practical JSON and Markdown import/export.
- Provide a concise example project and usage documentation.
- Make a public demo possible without requiring signup.

**Out of scope for the initial prototype:** accounts, cloud sync, collaboration, calendars, reminders, notifications, AI-generated plans, advanced dependency graphs, gamification, and extensive analytics. Do not introduce these incidentally.

## Technical direction

The default direction for a browser-based MVP is **React + TypeScript + Vite**, with local browser persistence and no backend. A static deployable build should be feasible. However, this is a **preference, not a declaration that the stack already exists**. Respect explicit later decisions and inspect repository conventions before scaffolding.

Separate the domain model, pure tree operations, persistence adapters, and UI components. Start with the least complex storage that can reliably meet the current milestone; provide export/backup before treating browser data as durable user storage.

Python is optional. If Python becomes relevant, use the repository's established Python tooling (for example, uv, if configured). Do not add Python or a backend merely because a Python environment exists; uv is not a JavaScript package manager.

Avoid unnecessary global installations or system-level changes. Prefer small, reversible technology decisions and document important deviations from these defaults.

## Development task tree — `BRANCHES.md`

**Use Branchfold's own method to develop Branchfold.** Maintain a lightweight, human-readable development task tree in the repository root as `BRANCHES.md`. This is an **agent-maintained planning and execution scaffold**, not the application's internal task database and not a replacement for source-code tests.

- If `BRANCHES.md` is missing when substantive implementation begins, create it **before** major code changes. Read an existing version before planning or continuing work.
- Organize work as nested Markdown task-list items (`- [ ]` and `- [x]`). Start with the **current goal and nearby milestones**, not an exhaustive speculative roadmap.
- State a single **Current focus** near the top; reflect the actionable leaf or immediate decision. Mark uncertain items in ordinary text, e.g., `(needs decomposition)` or `(blocked: reason)`.
- Where useful, first identify the important children of a goal, then expand only the next relevant branch. Do not force every node to be fully decomposed before acting.
- Inspect and revise the tree at the beginning and end of every work round without requesting permission. Create, delete, restructure, or expand tasks as understanding, priorities, blockers, or useful ideas change—not only when checking off completed work. Keep revisions meaningful rather than rewriting after every command.
- Keep the forest lightweight: use only the title, Current focus, and task tree. Express actionable validation or limitations as tasks; put supporting evidence and explanations in appropriate documentation.
- Check a leaf only when its stated outcome has been achieved and, when applicable, validated. Check a parent only when **its own goal** is satisfied; all children being checked can instead mean it is *ready to verify*.
- Revise or prune obsolete branches; preserve useful context without allowing completed history to overwhelm active work. Never erase user-authored decisions or tasks casually.
- Treat `BRANCHES.md` as an editable plan, **not authorization** to implement everything it mentions. The user's latest instruction determines the actual work scope.

Suggested initial shape (adapt to the task; do not copy hypothetical checkmarks as facts):

```md
# Branchfold Development Branches

Current focus: Build the smallest working tree-editing slice.

- [ ] Deliver a usable outline editor
  - [ ] Set up the chosen application framework
  - [ ] Create and rename nodes
  - [ ] Complete and reopen nodes
  - [ ] Persist and restore the tree
  - [ ] Verify core behavior
- [ ] Add advanced tree editing (needs decomposition)
- [ ] Add planning and verification states (future)
```

Keep `AGENTS.md` for **durable instructions**, `BRANCHES.md` for **evolving work state**, and `README.md` for **human-facing project documentation**. Do not put temporary environment notes, today's blockers, or session-specific requirements in `AGENTS.md`.

## Engineering standards

- Prefer readable, maintainable code and small coherent changes over premature abstractions.
- Keep keyboard and pointer interactions consistent; provide visible focus states and accessible controls.
- Test pure tree operations independently, especially reorder/reparent, subtree deletion, persistence round trips, and completion semantics.
- Handle user data conservatively: no silent destructive resets, migrations, or lossy imports. Make limitations explicit.
- Do not transmit task content to external services by default.
- Maintain the Git working tree autonomously: inspect diffs and status, ignore generated files, and preserve unrelated changes. Commit each coherent, validated modification promptly rather than waiting for the whole work round to finish. Do not rewrite history or push unless explicitly requested.
- Where requirements are ambiguous, use the smallest reversible interpretation and disclose assumptions.

## Working protocol for coding agents

**Before implementing:**

1. Inspect the repository, tooling, and Git status; do not presume a framework or current state.
2. Inspect and revise `BRANCHES.md` for the current work round; initialize it if missing.
3. Identify the immediate deliverable, its acceptance checks, and the smallest coherent implementation slice. Align the task tree with that slice.

**During implementation:**

1. Work on the relevant branch; update the tree at meaningful checkpoints.
2. Change the plan when evidence invalidates it; do not continue an obsolete branch merely because it was written down.
3. Avoid broadening scope to unrelated features or the full roadmap.

**After implementation:**

1. Run relevant tests, checks, or builds where available.
2. Update `BRANCHES.md` to reflect actual verified work, unresolved issues, and next actionable items.
3. Summarize what changed, how it was checked, and any limitations. Do not claim validation that was not performed.

## First-prototype success criterion

A user can take a rough task tree, represent it in the application, edit and reorganize it rapidly, focus on one branch, mark finished work, reopen the application without losing the tree, and recover/export their data. The experience should be **lighter than maintaining that same tree in Markdown** during real work.
