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

Development is currently at **version 3** (the interaction revision has been reviewed). This review
version is independent of package versions and the version 1 JSON storage format.
A node reference belongs to a particular development version; an unqualified node
means a node of the latest version. Version-qualified references must retain the
reviewed task title/context because positions can still change within a living plan.

Use `vX_nY_<type>[_keyword].md` for version X, node Y documents, for example
`v2_n2_review.md`, `v2_n2_review-r1.md`, and `v2_n2_report_implementation.md`.
Nested nodes may extend the positional path, e.g. `v2_n2-1_review.md`; positions are
one-based. Earlier unversioned archives remain historical records; do not guess their
version or rewrite their contents to make them appear current.

**Archiving** means absorbing important information into durable documents and the
working plan, dropping temporary information from active guidance, and preserving
the raw source in `docs/archive/`. Active revision responses stay in `docs/` until
reviewed. Keep historical evidence distinct from present acceptance, unresolved
questions, and unverified claims. Repair relative links in relocated reports when
needed; preserve raw review text unchanged.

When the user requests re-review before continuing, leave an explicit unchecked
review gate in BRANCHES.md and stop after the requested changes and validation.
