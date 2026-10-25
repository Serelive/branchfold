# Branchfold Development Branches — v2

Current focus: Implement independent navigation/editing states and continuous outline writing, then pointer movement and browser verification.

- [x] Address the earlier workflow review and obtain re-review
- [ ] Deliver a fluid, flexible outline editor (v2 N2; structural foundation provisionally accepted)
  - [x] Preserve create/edit/complete, safe subtree operations, session recovery, and JSON persistence/backup
  - [x] Absorb the v2 N2 review and reconstruct the interaction plan
  - [x] Accept v2_n2_review-r1 before further implementation
  - [ ] Revise keyboard navigation and continuous editing
    - [ ] Specify independent selection, editing, view-root, and drag states
    - [ ] Trial navigation Enter-to-edit versus Enter-to-create; keep the choice open
    - [ ] Support visible-node navigation, sibling/child creation, indentation, completion, and IME-safe commands
    - [ ] Reproduce Alt+Up/Down failure on Ubuntu; test candidate bindings and visible fallbacks
    - [ ] Reconstruct a 30+ node sample mostly by keyboard without the secondary menu
  - [ ] Add direct pointer movement (needs decomposition)
    - [ ] Provide drag handles, before/after/inside previews, autoscroll, and accessible alternatives
    - [ ] Verify subtree integrity, cycle rejection, collapsed targets, view-root boundaries, and undo
  - [ ] Preserve navigation context and verify real interactions
    - [ ] Add breadcrumbs and preserve view/collapse across moves and undo; offer Go to moved node when needed
    - [ ] Communicate descendant deletion and verify recovery
    - [ ] Reproduce empty-forest import behavior; distinguish import from replacement and test cancellation/undo
    - [ ] Verify keyboard, drag, Chinese IME/Fcitx5, accidental deletion, and reload in a real Ubuntu browser
  - [ ] Verify improved editing fluidity without structural regressions
- [ ] Evaluate the revised editor with a real task tree
- [ ] Add planning and verification states (future)
