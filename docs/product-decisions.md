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

## v2 N2: interaction revision before broader evaluation

Source: [v2 N2 review](archive/v2_n2_review.md). The structural foundation is
**provisionally accepted**; overall interaction acceptance remains open. Preserve
working tree operations and regression tests while revising the interaction layer.
The earlier implementation report's 14 passing tests/build are historical automated
evidence, not proof that Ubuntu keyboard, drag, or IME behavior works.

The retained foundation includes stable-ID subtree moves with cycle rejection,
independent completion, deletion and import recovery through session undo/redo,
collapse/subtree views, and validated version 1 JSON persistence/backups. Current
limits are 100 session-only history steps, 2 MB replacement imports, and single-tab
usage. Unreadable startup data must remain protected and failed saves must remain
visible. View state is currently temporary; the redesign should preserve context
within the session rather than reset the full outline after every operation.

### Interaction model and open choices

- Keep selected node, editing node, view root (`viewRootId`), and dragged node
  independent. Selecting a row must not implicitly edit or zoom.
- Editing Enter commits the title and creates/edits a sibling after its subtree;
  Tab/Shift+Tab indents/outdents where applicable; Escape returns to navigation.
  New nodes receive a caret. Ordinary text editing and IME composition must not
  trigger whole-node commands.
- Navigation arrows traverse visible nodes; Left collapses or visits the parent,
  Right expands or visits the first child. Provide direct create sibling/child,
  completion, movement, and edit commands.
- The user selected **Enter-to-edit and B-to-create** as the starting navigation
  mapping. Editing Enter creates the next sibling; F2 also edits. This mapping passed
  a 32-node Firefox entry workflow. Ergonomic acceptance on the user’s real task tree
  remains open; do not represent the alternative mapping as trialed.
- Alt+Up/Down failing in manual use is an observed bug despite jsdom passes.
  Reproduce in an actual Ubuntu browser and investigate event interception, DOM
  focus, mode, and handler delivery. Ctrl+Up/Down is only a candidate remedy;
  verify conflicts and retain a visible menu fallback. Prefer Tab indentation in
  outline editing, while checking accessibility and normal text behavior.

### Pointer movement and context

Keep checkbox, chevron, title edit, row selection, drag handle, and subtree-focus
controls distinct. Common actions should be visible and direct; reserve the
secondary menu for less frequent operations and shortcut discovery. Favor immediate
response, clear spatial feedback, subtle affordances, and reversibility.

Drag previews must distinguish a line before the target, a line after its whole
subtree, and an inside-parent highlight. Preserve subtree IDs/content/order/state,
reject self/descendant drops, support autoscroll, collapsed branches, and the view
root, and retain keyboard/accessibility alternatives. Defer searchable distant
Move to commands until local movement is sound.

Use ancestor breadcrumbs and a route to the forest. Preserve view/collapse across
moves and undo where possible; if a node leaves the view, offer **Go to moved node**
instead of jumping automatically. Escape may step from editing to navigation to a
parent view only if the mode is clear. Deletion must communicate descendant removal;
structural changes must remain reversible.

### Import investigation and acceptance

Empty-forest imports currently present replacement language. Reproduce whether this
is wording alone or behavioral failure. Import into an empty forest should not warn
that existing tasks will be overwritten. Nonempty replacement must retain validation
and explicit destructive confirmation. Test both paths, cancellation, and undo.

Sequence the work: keyboard/editing and mode trials, then pointer movement, then
context preservation and real-browser verification. Reconstruct a 30+ node sample
mostly by keyboard without the secondary menu. Verify Ubuntu browser shortcuts,
dragging, Chinese IME including Fcitx5, accidental deletion, and storage reload.
Success means materially more fluid creation/revision/reorganization without
structural regression, not a larger shortcut list. No AI, accounts, collaboration,
cloud sync, rich text, or unrelated features are included.

### Implemented revision and remaining acceptance

See [v2 N2 interaction report](archive/v2_n2_report_interaction.md). The accepted review response
is [archived](archive/v2_n2_review-r1.md). The implementation preserves the domain
foundation and adds explicit modes, pointer-captured movement, breadcrumbs, view-aware
history, and empty/nonempty import language. Ctrl+Up/Down is the implemented navigation
binding and was verified in Firefox with row and checkbox focus. Alt+arrows are no
longer structural bindings in text inputs. Headless browser results do not establish
absence of desktop window-manager conflicts or Fcitx5 candidate-selection correctness.

## v3 N2: refine hierarchy and empty-title deletion

The [v3 review](archive/v3_n2_review.md) reports successful Fcitx5 Chinese input and
accepts the current key mappings as natural overall. This supersedes the earlier
pending user checks; the broader comparison with Markdown remains a separate trial.
Preserve the interaction model and tested structural operations.

Use aligned circular drag anchors and sibling guides: one consistent indentation
system makes grouping visible without introducing competing nested background layers.
The review's color-layer alternative is not an additional requirement. Keep generous
handle hit targets despite the smaller visual dots.

Navigation Delete remains unchanged. In editing, unmodified Backspace deletes an
exactly empty title's node; nonempty titles retain normal text editing. Composition
events must never trigger deletion. Descendants require confirmation, and deletion
remains recoverable through session undo/redo.
