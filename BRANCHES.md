# Branchfold — Markdown-native project interface

Current focus: Review the N2 cache/rendering recommendations; await an explicit request before starting N2-3 format design.

Stage: branch 1, version 1 (`feat/markdown-integration`), inherited from `main`, version 3.

The working outline editor provides the interaction foundation. Its development history is preserved in [the v3 task tree](docs/archive/BRANCHES_v3.md). Product principles and data-integrity requirements live in [AGENTS.md](AGENTS.md).

- [x] Establish the Markdown-native direction and public project documentation
  - [x] Update contributor guidance and the GitHub README
  - [x] Archive the original v3 plan and start a dedicated development tree
- [ ] Read a project task document
  - [x] Prepare an ignored, self-contained sandbox project from the local JSON backup; verify task fidelity and project boundaries
  - [x] Select `sandbox/BRANCHES.md` as the anchor and record the trial workflow in [the N2 answers](docs/b1_v1_n2_review-r1_questions.md)
  - [ ] N2-3: after an explicit request, design the flexible Markdown format and rendering rules in `docs/b1_v1_n2_design_renderer.md`
  - [ ] Map supported tasks to source ranges and display a user-selected file in the existing tree view
  - [ ] Preserve selection and subtree focus as view operations
  - [ ] Verify that reading leaves document bytes unchanged, including mixed content and line endings
- [ ] Safely persist one task edit
  - [ ] Choose one host/file integration for the trial, with access limited to the selected document
  - [ ] Rename a supported task through a narrow source edit, preserving notes, descendants, and unrelated formatting
  - [ ] Detect external changes, refresh safely, and present a conflict before a stale write
  - [ ] Provide undo or original-document recovery; test malformed input, concurrent edits, and failed writes
  - [ ] Decide and test an explicit compatibility or migration path for existing JSON trees
- [ ] Connect a task to project work
  - [ ] Attach and open a project-relative file link using ordinary Markdown
  - [ ] Test document-relative resolution, spaces, encoded paths, and moved or missing files
- [ ] Evaluate the complete workflow in a real repository
  - [ ] Compare reading, focusing, renaming, and opening artifacts with editing Markdown directly
  - [ ] Verify keyboard, pointer, IME, and recovery behavior in the chosen host
  - [ ] Record workflow benefits and friction, then choose the next small improvement

The [N2 review](docs/b1_v1_n2_review.md) remains active and unarchived. Cache and rendering recommendations are recorded in [the response](docs/b1_v1_n2_review-r1_questions.md); the format design and implementation are pending. Host choice and the supported Markdown subset remain open. Broader editing operations, planning/verification metadata, and multi-project views can follow demonstrated needs from the trial.
