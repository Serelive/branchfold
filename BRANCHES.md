# Branchfold development tree

Current focus: Complete the GitHub maintenance baseline; resolve licensing and repository-side review settings. The first PR and Pages deployment are complete (reported by the maintainer).

Issues and PRs hold individual discussions. This tree tracks milestones, not Git branches or automatic authorization. See [product direction](docs/product-decisions.md) and [completed branch-1 history](docs/archive/BRANCHES_b1_v3.md).

- [x] Establish the Markdown-native direction
  - [x] Preserve the original [prototype tree](docs/archive/BRANCHES_v3.md)
  - [x] Implement shared Markdown/JSON editing and VS Code explicit saves
  - [x] Add conflicts, draft recovery, undo, and compatible backups
- [x] Refine the shared outline workflow
  - [x] Add keyboard/drag movement, subtree focus, completion, and selection
  - [x] Add directory paths, icons, indicators, themes, and Chinese controls
  - [x] Add multiple tool annotations and editable lists
- [x] Merge the first PR and deploy the browser app to Pages
- [ ] Establish a maintainable public repository
  - [x] Consolidate current guidance and archive superseded reports
  - [x] Add contribution and issue/PR templates; refine ignore rules
  - [x] Add PR/main CI for tests, types, and both builds
  - [x] Validate locally: 81 tests, TypeScript and both builds; check active documentation links, YAML syntax, and ignore rules
  - [ ] Choose a project license
  - [x] Confirm the first GitHub CI run after push (maintainer confirmed, 2026-10-31)
  - [ ] Consider requiring CI checks through a main-branch ruleset
  - [ ] Configure private security reporting before documenting it as available
- [ ] Connect a task to project work
  - [ ] Attach and open project-relative files using ordinary Markdown links
  - [ ] Test document-relative paths, spaces, encoding, moved/missing files
- [ ] Evaluate the complete workflow in a real repository
  - [ ] Compare reading, focusing, renaming, and opening artifacts with direct Markdown editing
  - [ ] Verify current keyboard, pointer, narrow-layout, IME, and recovery behavior in both hosts
  - [ ] Record benefits and friction, then choose the next small improvement
