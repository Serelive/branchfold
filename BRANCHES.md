# Branchfold — Markdown-native project interface

Current focus: Review the completed N2 Markdown reader and N3 safe rename slice in [the version 2 report](docs/b1_v2_report.md). Node 4 artifact links remain next.

Stage: branch 1, version 2 (`feat/markdown-integration`), inherited from `main`, version 3.

The working outline editor provides the interaction foundation. Its development history is preserved in [the v3 task tree](docs/archive/BRANCHES_v3.md). Product principles and data-integrity requirements live in [AGENTS.md](AGENTS.md).

- [x] Establish the Markdown-native direction and public project documentation
  - [x] Update contributor guidance and the GitHub README
  - [x] Archive the original v3 plan and start a dedicated development tree
- [x] Read a project task document
  - [x] Prepare an ignored, self-contained sandbox project from the local JSON backup; verify task fidelity and project boundaries
  - [x] Select `sandbox/BRANCHES.md` as the anchor and record the trial workflow in [the N2 answers](docs/archive/b1_v1_n2_review-r1_questions.md)
  - [x] N2-3: design the flexible Markdown format and rendering rules in [the renderer reference](docs/b1_v1_n2_design_renderer.md)
  - [x] Map supported tasks to source ranges and display a user-selected file in the Markdown outline view
  - [x] Preserve selection and subtree focus as view operations
  - [x] Verify that reading leaves document bytes unchanged, including mixed content and line endings
- [x] Safely persist one task edit
  - [x] Implement a VS Code host scoped to the selected document; keep browser opening read-only
  - [x] Rename a supported task through a narrow source edit, preserving notes, descendants, and unrelated formatting
  - [x] Detect external changes, refresh safely, and present a conflict before a stale write
  - [x] Provide undo or original-document recovery; test malformed input, concurrent edits, and failed writes
  - [x] Keep and test the legacy JSON editor as an explicit separate mode; Markdown opening never replaces its data
- [ ] Connect a task to project work
  - [ ] Attach and open a project-relative file link using ordinary Markdown
  - [ ] Test document-relative resolution, spaces, encoded paths, and moved or missing files
- [ ] Evaluate the complete workflow in a real repository
  - [ ] Compare reading, focusing, renaming, and opening artifacts with editing Markdown directly
  - [ ] Verify keyboard, pointer, IME, and recovery behavior in the chosen host
  - [ ] Record workflow benefits and friction, then choose the next small improvement

The accepted [N2 review](docs/archive/b1_v1_n2_review.md) and [response](docs/archive/b1_v1_n2_review-r1_questions.md) are archived. The [design](docs/b1_v1_n2_design_renderer.md) records their durable decisions; [the report](docs/b1_v2_report.md) records implementation and validation. Broader Markdown editing, planning/verification metadata, and multi-project views remain later work.
