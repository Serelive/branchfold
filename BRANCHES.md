# Branchfold Development Branches — v2

Current focus: Review the implemented interaction revision; finish desktop Fcitx5 and real-task-tree acceptance checks.

- [x] Address the earlier workflow review and obtain re-review
- [ ] Deliver a fluid, flexible outline editor (v2 N2; structural foundation provisionally accepted)
  - [x] Preserve create/edit/complete, safe subtree operations, session recovery, and JSON persistence/backup
  - [x] Absorb the v2 N2 review and reconstruct the interaction plan
  - [x] Accept v2_n2_review-r1 before further implementation
  - [ ] Revise keyboard navigation and continuous editing
    - [x] Specify independent selection, editing, view-root, and drag states
    - [x] Use the user-selected Enter-to-edit / B-to-create starting mapping
    - [ ] Confirm the mapping in the user’s real-task-tree trial
    - [x] Support visible-node navigation, sibling/child creation, indentation, completion, and IME-safe commands
    - [x] Reproduce Alt+Up/Down failure on Ubuntu; test candidate bindings and visible fallbacks
    - [x] Reconstruct a 30+ node sample mostly by keyboard without the secondary menu
  - [x] Add direct pointer movement
    - [x] Provide drag handles, before/after/inside previews, autoscroll, and accessible alternatives
    - [x] Verify subtree integrity, cycle rejection, collapsed targets, view-root boundaries, and undo
  - [ ] Preserve navigation context and verify real interactions
    - [x] Add breadcrumbs and preserve view/collapse across moves and undo; offer Go to moved node when needed
    - [x] Communicate descendant deletion and verify recovery
    - [x] Reproduce empty-forest import behavior; distinguish import from replacement and test cancellation/undo
    - [x] Verify keyboard, pointer drag, composition-event guards, deletion, and reload in headless Firefox on Ubuntu
    - [ ] Verify desktop Fcitx5 candidate selection and desktop shortcut conflicts (requires interactive desktop trial)
  - [ ] Verify improved editing fluidity without structural regressions
- [ ] Evaluate the revised editor with a real task tree
- [ ] Add planning and verification states (future)
