# Planning and documentation workflow

[CONTRIBUTING.md](../CONTRIBUTING.md) describes GitHub contributions; [development.md](development.md) contains validation commands. [AGENTS.md](../AGENTS.md) supplies agent instructions.

Use issues for bugs and feature discussions, PRs for review, and [BRANCHES.md](../BRANCHES.md) for current focus, milestones, and acceptance criteria. The task tree does not authorize every listed task. Preserve user-authored plans and compact completed history.

QuickFix requests go directly to implementation without a report. QuickFeature requests also skip reports; update the relevant stable implementation reference. When explicitly asked for re-review, record the gate and wait for acceptance.

Archive completed reviews by absorbing lasting decisions into current references, abandoning temporary instructions, and retaining raw records under `docs/archive/`. Keep raw reviews unchanged and use the archive index to explain context. Prefer descriptive document names over branch/version names unless the user requests a named review artifact.

Commit coherent, validated changes. Agents need user authorization for publishing, pushes, branch switches, and GitHub settings changes.
