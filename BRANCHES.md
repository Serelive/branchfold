# Branchfold — Markdown-native project interface

Current focus: Define and implement a read-only view of a real project's Markdown task document.

The working outline editor provides the interaction foundation. Its development history is preserved in [the v3 task tree](docs/archive/BRANCHES_v3.md). Product principles and data-integrity requirements live in [AGENTS.md](AGENTS.md).

- [x] Establish the Markdown-native direction and public project documentation
  - [x] Update contributor guidance and the GitHub README
  - [x] Archive the original v3 plan and start a dedicated development tree
- [ ] Read a project task document
  - [x] Prepare an ignored, self-contained sandbox project from the local JSON backup; verify task fidelity and project boundaries
  - [ ] Select a real Markdown document and record the tasks users should accomplish with it
  - [ ] Define supported checklist structures and how surrounding prose, notes, links, and ambiguous input appear
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

Host choice and the supported Markdown subset are the first open decisions. Broader editing operations, planning/verification metadata, and multi-project views can follow demonstrated needs from the trial.
