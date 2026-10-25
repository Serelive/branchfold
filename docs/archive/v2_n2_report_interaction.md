# v2 N2 — interaction implementation report

Reviewed node: **Deliver a fluid, flexible outline editor**. The user accepted
[v2_n2_review-r1](v2_n2_review-r1.md) and selected Enter-to-edit / B-to-create as
the starting navigation mapping. Implementation is delivered; final interaction
acceptance remains open for desktop IME and the real-task-tree trial.

## Changes

- Separate selected node, editing node, `viewRootId`, and dragged node. Row selection
  does not place a caret or zoom. Visible mode guidance and keyboard help explain the
  transition. Titles edit directly; new nodes receive the caret.
- Editing Enter inserts a sibling after the current subtree. Tab/Shift+Tab indent or
  outdent. Escape returns to navigation. Navigation arrows traverse visible nodes;
  Left/Right collapse/expand or visit parent/child. Enter/F2 edit, B/C create sibling/
  child, Space completes, Delete requests subtree deletion. Native text undo and IME
  composition are protected from structural commands.
- Ctrl+Up/Down moves subtrees from navigation, including checkbox/button focus.
  Secondary controls remain available when system shortcuts conflict. Ordinary Tab
  navigation is available after Escape leaves editing.
- Pointer-captured handles provide before/after/inside previews, autoscroll, invalid
  target rejection, and Escape cancellation. After lines appear below the complete
  subtree. Local moves do not require opening a menu. The existing parent chooser is
  retained; no new searchable distant-move feature was added.
- Breadcrumbs include every ancestor. Moves preserve view/collapse; hidden results
  offer Go to moved node. Undo/redo restores contextual snapshots. Parent deletion
  names its descendants and requires confirmation; all structural changes are undoable.
- Empty imports offer Import tree without overwrite language. Nonempty imports retain
  replacement warnings and explicit confirmation. Validation, cancel, and undo remain.

No runtime dependency or storage schema change was required. The optional browser
regression runner uses Python's standard library and the already installed geckodriver.

## Reproduction and verification

**Original shortcut failure:** in headless Firefox on Ubuntu, Alt+Up reached the page
with a checkbox focused but did not reorder. Focusing the title made it work. The old
handler lived only on title inputs. This reproduces a specific focus-dependent failure;
it does not prove it was the only cause of the user's desktop experience. The revised
Ctrl+Up path passed from checkbox and navigation-row focus, while Ctrl+Up in a title
preserved ordinary text behavior.

**Original empty-import issue:** loaded the previous committed component in an isolated
test origin. An empty forest displayed “Current work will be replaced,” but confirming
successfully imported the backup. The reproduced defect was confirmation wording.
The revised empty/nonempty paths, cancellation, undo/redo, and reload passed in Firefox.

**Automated checks:**

- `npm test`: 20 domain/rendered UI tests pass.
- `npm run build`: TypeScript and Vite production build pass.
- `python3 tests/browser_regression.py`: headless Firefox suite passes. Covers 32-node
  continuous keyboard entry without menus, Enter/B mapping, Ctrl+Up, Tab indentation,
  pointer before/after/inside previews and drops, collapsed targets, cycle rejection,
  subtree-context moves, undo, ancestor breadcrumbs, edge autoscroll, Escape drag
  cancellation, native text undo, deletion confirmation/recovery, imports, and reload.
- Browser composition-event guards pass with synthetic composition/key events. This
  is deliberately distinct from an OS IME test.
- Populated desktop and narrow-window screenshots were inspected. Firefox's minimum
  window width limited the narrow capture to 500 pixels; this was not a phone-device
  or touch-gesture test. Deep trees can scroll horizontally.
- Git whitespace and active documentation links checked.

## Remaining acceptance and limits

- Test actual Chinese Fcitx5 candidate selection/commit/cancel on the desktop. The
  environment has Fcitx5, but WebDriver's headless/synthetic events do not traverse the
  desktop input-method path. No claim of end-to-end Fcitx5 validation is made.
- Confirm desktop shortcut conflicts and ergonomics using the user's real task tree.
  The user chose the starting Enter mapping; the alternative mapping was not trialed.
- A 32-node automated entry exercise is useful evidence, not proof that the whole
  experience is materially easier than Markdown during real work. N2 stays open for
  acceptance; N3's broader real-work evaluation was not completed.
- Session history is limited to 100 changes, clears on reload, and is not a durable
  backup. Imports remain replacement-only with a 2 MB limit. Single-tab usage and
  startup/write-error protections remain unchanged.
- Pointer gestures were verified with mouse actions in Firefox; touch devices and
  other browsers are not yet verified. View state is temporary across reloads.
