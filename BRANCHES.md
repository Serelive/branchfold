# Branchfold — Markdown-native project interface

Current focus: Completed multi-tool assignment, editable tool lists, and relocated Focus controls in both hosts. Await the next requested refinement.

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
- [x] Unify website and extension refinements after lifting the website-only restriction
  - [x] Share the deletion tray, child promotion, expansion rule, and handle indicators across both hosts
  - [x] Add an enabled-by-default unchecked branch bar toggle; checked parent bars remain visible
  - [x] Rotate sharp 18 × 3 px bars around the handle center, matching the unchecked parent ring thickness
  - [x] Validate shared behavior and explicit-save isolation with automated tests; build website and extension
- [x] Add Expanded branch bars and verify all four A/B combinations in both hosts; folded-only bars are vertical and switch instantly
- [x] Add shared appearance and language settings with a compact control drawer
  - [x] Keep the drawer closed by default; group appearance, tree display, and import/export, retaining existing visualization defaults
  - [x] Add light/dark palettes and English/Chinese UI; persist appearance separately from task data
  - [x] Verify drawer focus/closure, language switching, storage fallback, task preservation, and extension save isolation; build both hosts
  - [ ] Run the real-browser appearance and narrow-layout checks when a usable browser is available
- [x] Investigate the reported VS Code loading indicator and fix light-mode colors
  - [x] Run the real VS Code integration suite against the current build
  - [x] Probe startup in an isolated window: scripts/styles load, tasks render, page reaches complete, and no JavaScript error is reported
  - [x] Reproduce host foreground inheritance and explicitly apply the shared palette to the page body
  - [x] Verify task rendering and light/dark/light colors in the real VS Code webview, alongside save, undo, recovery, and conflict checks
  - [x] Inspect the supplied screenshot: the stationary tab-width line appears to be the active-tab underline; no loading stall reproduced
- [x] Complete the accepted b1_v3 review
  - [x] Examine intent, current data flow, and alternatives; compose the re-review
  - [x] Obtain acceptance of the declarative annotation and labeled-badge design
  - [x] Implement annotations across Markdown/JSON, shared UI, persistence, and undo; default unchecked bars off
  - [x] Validate 70 automated tests, type checking, both builds, and real VS Code badge themes/narrow layout, editor focus, annotated saves, recovery, undo, and conflicts
  - [x] Absorb lasting decisions into the shared editor reference and archive the version-3 implementation, review, and re-review
- [x] Refine shared tool assignment controls
  - [x] Move Focus into slide actions; add +Tool with multiple selection and Create
  - [x] Discover imported names, seed defaults, persist editable lists, and support frequency/manual order
  - [x] Validate 73 tests, both builds, legacy/multi-tool round trips, shared interactions, and real VS Code save/recovery, theme, and layout checks
- [ ] Connect a task to project work
  - [ ] Attach and open a project-relative file link using ordinary Markdown
  - [ ] Test document-relative resolution, spaces, encoded paths, and moved or missing files
- [ ] Evaluate the complete workflow in a real repository
  - [ ] Compare reading, focusing, renaming, and opening artifacts with editing Markdown directly
  - [ ] Verify keyboard, pointer, IME, and recovery behavior in the chosen host
  - [ ] Record workflow benefits and friction, then choose the next small improvement

The accepted [version-2 review](docs/archive/b1_v2_review.md) and [previous report](docs/archive/b1_v2_report.md) are archived. Their current decisions live in [the shared editor reference](docs/shared-editor.md). Completed version-2 milestones above record history; explicit-save structured conversion supersedes the earlier context renderer and narrow rename workflow. Broader artifact navigation and workflow evaluation remain future work.
