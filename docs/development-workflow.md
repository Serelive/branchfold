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

`Node x-y-z-...-w` refers to the subtree at root x, child y, grandchild z, and so on;
positions are one-based. Its short name is `Nx-y-z-...-w`. Review-related Markdown
files use `<node>_<type>[_keyword].md`, such as `archive/N2_review_draft.md`. A requested revision
may use `N2_review-r1.md`.

These positional references are temporary: moving tasks changes their meaning.
Record the reviewed task's title and context in reviews rather than assuming the
same position will identify it later. After digesting a review, move its original
text unchanged into `docs/archive/`, link to it from durable documentation, and keep
active revision reports in `docs/` until their review is complete.

When the user requests re-review before continuing, leave an explicit unchecked
review gate in BRANCHES.md and stop after the requested changes and validation.
