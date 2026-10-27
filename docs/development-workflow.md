# Development workflow

The operating rules live in [AGENTS.md](../AGENTS.md). This document preserves the
reasoning and review conventions agreed in [the N2 review](archive/N2_review.md).

## Planning and commits

The agent owns BRANCHES.md as its working planning and execution system. Inspect it
at the beginning and end of each work round and revise it without asking permission.
Restructure or replace obsolete tasks, add useful ideas at an appropriate level, and
keep a single current focus. Do not reduce maintenance to checking completed items.
The task tree is a plan, not authorization to implement every listed feature.

Keep the forest lightweight: title, current focus, and nested tasks. Put validation
outcomes and explanatory limitations in documentation; represent remaining checks
and actionable limitations as tasks when they belong to the current plan.

Commit each coherent, validated modification as it becomes ready. A coherent change
may span multiple files; committing every individual text edit would fragment the
history without improving reviewability. Inspect staged changes, preserve unrelated
work, ignore generated artifacts, and do not push or rewrite history without an
explicit request.

## Review references and archival

QuickFix requests use direct implementation without a report or review gate.
QuickFeature requests also skip reports, but retain a concise implementation
document for future reference, updated with behavior, relevant code, and validation.

Development is currently **branch 1, version 1** on `feat/markdown-integration`, inherited from `main`, version 3. These review versions are independent of package versions and the version 1 JSON storage format.

Use `bB_vV_nN_<type>[_topic].md` for branch B, version V, node N documents. For example, `b1_v1_n2_review.md` reviews node 2, “Read a project task document”; `b1_v1_n2_review-r1_questions.md` answers its questions. Nested node paths may use `n2-3`. Keep the task title with positional references because a living plan can change. Existing `vX_nY_...` and unversioned documents retain their historical names.

The **anchor** is `sandbox/BRANCHES.md`, the selected test Markdown document within the independent sandbox project root. The **renderer** is Branchfold's Markdown rendering interface. Keep sandbox artifacts and links within that project root.

A review item marked **Next** needs an additional user request before work begins. The current N2-3 format-design step is such a gate; its eventual output is `b1_v1_n2_design_renderer.md`.

**Archiving** means absorbing important information into durable documents and the
working plan, dropping temporary information from active guidance, and preserving
the raw source in `docs/archive/`. Active revision responses stay in `docs/` until
reviewed. Keep historical evidence distinct from present acceptance, unresolved
questions, and unverified claims. Repair relative links in relocated reports when
needed; preserve raw review text unchanged.

When the user requests re-review before continuing, leave an explicit unchecked
review gate in BRANCHES.md and stop after the requested changes and validation.
