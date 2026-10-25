# Branchfold Development Branches

Current focus: Implement and verify safe outline editing, recovery, subtree focus, and backup restoration (N2).

- [x] Address N2 review and obtain re-review
  - [x] Adopt automatic commits and agent-owned task-tree maintenance
  - [x] Validate and commit the existing persistent editor slice
  - [x] Reorder upcoming work and keep the forest lightweight
  - [x] Preserve durable review decisions and archive the original review
  - [x] Review the N2 implementation again (accepted)
- [ ] Deliver a flexible outline editor
  - [x] Create roots and children, rename, complete/reopen, persist, and export JSON
  - [ ] Reorder and reparent nodes safely with pointer and keyboard controls
  - [ ] Delete subtrees with undo and redo
  - [ ] Collapse branches and focus on a subtree with a route back
  - [ ] Validate and preview JSON backups before replacing the tree; allow undo
  - [ ] Verify domain invariants, UI workflows, and production build
- [ ] Evaluate the flexible editor with a real task tree
- [ ] Add planning and verification states (future)
