# Product decisions and deferred ideas

Source: [N2 review](archive/N2_review.md).

## Flexible editing before the real-work trial

Reordering, reparenting, and deletion are basic capabilities for a revisable task
tree. Plan them before the broader trial that asks whether Branchfold is easier than
maintaining a Markdown outline. The initial create/rename/complete/persist slice is
a validated foundation, not proof of the full first-prototype success criterion.

The N2 reviewer confirmed the browser launched and root/child creation, text editing,
and checkbox completion worked. Keep this feedback; it does not replace the later
trial of flexible editing and recovery.

## Permanent references for development tasks — deferred idea

Automatically generated permanent IDs could let development reviews refer to tasks
across edits and reordering. N2 explicitly proposes this as an idea, not an immediate
implementation requirement. Revisit only if positional references become costly;
choose a lightweight representation compatible with human-edited Markdown then.

This concerns the development plan and review references. Application task nodes
already use stable UUIDs; no application schema change is requested here.
