# Branchfold — Markdown-native project interface

Current focus: Website-only UI refinements: minimal deletion tray, animated expandable-handle indicators, and expansion toward unfinished work. Keep the extension UI unchanged until the user revokes this scope. Node 4 artifact links remain future work.

Stage: branch 1, version 3 (`feat/markdown-integration`), inherited from `main`, version 3.

The working outline editor provides the interaction foundation. Its development history is preserved in [the v3 task tree](docs/archive/BRANCHES_v3.md). Product principles and data-integrity requirements live in [AGENTS.md](AGENTS.md).

- [x] Establish the Markdown-native direction and public project documentation
  - [x] Update contributor guidance and the GitHub README
  - [x] Archive the original v3 plan and start a dedicated development tree
- [x] Read a project task document (version-2 milestone)
  - [x] Prepare an ignored, self-contained sandbox project from the local JSON backup; verify task fidelity and project boundaries
  - [x] Select `sandbox/BRANCHES.md` as the anchor and record the trial workflow in [the N2 answers](docs/archive/b1_v1_n2_review-r1_questions.md)
  - [x] N2-3: design the flexible Markdown format and rendering rules in [the renderer reference](docs/b1_v1_n2_design_renderer.md)
  - [x] Map supported tasks to source ranges and display a user-selected file in the Markdown outline view
  - [x] Preserve selection and subtree focus as view operations
  - [x] Verify that reading leaves document bytes unchanged, including mixed content and line endings
  - [x] Replace the separate Markdown view with the shared editor; import/export structured tasks and support append/replace
  - [x] Enable directory guides, ancestor titles, and leaf drawings by default in both hosts
- [x] Safely persist one task edit (version-2 milestone)
  - [x] Implement a VS Code host scoped to the selected document; keep browser opening read-only
  - [x] Rename a supported task through a narrow source edit, preserving notes, descendants, and unrelated formatting
  - [x] Detect external changes, refresh safely, and present a conflict before a stale write
  - [x] Provide undo or original-document recovery; test malformed input, concurrent edits, and failed writes
  - [x] Keep and test the legacy JSON editor as an explicit separate mode; Markdown opening never replaces its data
  - [x] Extend the shared editing gestures to Markdown working trees; save only on explicit request
  - [x] Refresh clean views automatically; retain drafts on conflict, save failure, and view closure
  - [x] Validate canonical Markdown saves, host recovery, and browser interaction parity
- [x] Refine the website outline controls (extension behavior retained)
  - [x] Keep the slide trigger; show right-aligned Delete cell (promote children in place) and Delete subtree actions with undo
  - [x] Add an animated 18 × 2 px expandable-handle bar: horizontal below when folded, vertical at right when expanded
  - [x] On opening, fold preceding branches, reveal the first unchecked leaf's ancestor path, and expand later branches within that subtree; show immediate children when all leaves are checked
  - [x] Validate domain/UI behavior and extension isolation with automated tests and a production build
  - [ ] Run the added real-browser regression: local Firefox cannot launch because snap-confine lacks required permissions; no connected browser is available
- [ ] Connect a task to project work
  - [ ] Attach and open a project-relative file link using ordinary Markdown
  - [ ] Test document-relative resolution, spaces, encoded paths, and moved or missing files
- [ ] Evaluate the complete workflow in a real repository
  - [ ] Compare reading, focusing, renaming, and opening artifacts with editing Markdown directly
  - [ ] Verify keyboard, pointer, IME, and recovery behavior in the chosen host
  - [ ] Record workflow benefits and friction, then choose the next small improvement

The accepted [version-2 review](docs/archive/b1_v2_review.md) and [previous report](docs/archive/b1_v2_report.md) are archived. Their current decisions live in [the shared editor reference](docs/b1_v3_implementation.md). Completed version-2 milestones above record history; explicit-save structured conversion supersedes the earlier context renderer and narrow rename workflow. Broader artifact navigation and workflow evaluation remain future work.
