# Product direction and decisions

Branchfold supports progressive task decomposition. Tasks may be actions, objectives, questions, or investigations. Trees evolve as users learn, without exhaustive planning or a rigid execution order.

## Current choices

- **Project-owned Markdown is the direction.** Ordinary checklists and portable links are the foundation. The current editor imports checklist tasks; extension Save converts the working tree back to Markdown. Mixed-content source preservation is future work, not current Save behavior.
- **One editor, two hosts.** Browser imports are independent copies with local storage/export. VS Code owns document access, explicit saves, external-edit detection, and recovery.
- **Revision is central.** Creation, rename, movement, focus, and undo are core. Selection, text editing, focused view, and dragging are independent states.
- **Completion is explicit.** Checking cascades to descendants; unchecking changes only that task. Child completion does not automatically complete parents or estimate progress.
- **Tools are labels.** Optional Markdown comments name tools without launching applications or transmitting tasks. See the [format reference](shared-editor.md).
- **Compatibility matters.** Version-1 JSON backups remain supported. Unreadable saved data is retained; imports are previewed and reversible within session history.

## Next questions

Evaluate ordinary Markdown task-to-file links and compare the complete workflow with editing Markdown directly. Test portable paths and useful navigation before expanding the artifact model.

Permanent Markdown task IDs, a standalone reader, multi-project views, and richer verification metadata remain hypotheses. Revisit them when usage demonstrates a need. Accounts, sync, and a backend are not required for the current workflow.

Historical reviews remain in the [archive](archive/README.md); the [task tree](../BRANCHES.md) identifies unfinished work.
