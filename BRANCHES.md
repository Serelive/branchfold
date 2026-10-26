# Branchfold Development Branches — v3

Current focus: Continue the real-task-tree trial with switchable directory guides.

- [x] Address the earlier workflow review and obtain re-review
- [x] Refine the flexible outline editor (v3 N2)
  - [x] Preserve verified navigation/editing, subtree movement/focus, history, and persistence
  - [x] Accept user-reported Fcitx5 input and natural keyboard mappings
  - [x] Absorb v3 review and archive it with the previous interaction report
  - [x] Align circular drag anchors and sibling guides with consistent indentation
  - [x] Delete empty titles with Backspace while protecting composition and descendants
  - [x] Verify deletion undo/redo, ordinary text editing, hierarchy rendering, and existing interactions
  - [x] QuickFix: directly delete selected subtrees with navigation Backspace and preserve undo
  - [x] QuickFix: unify drag/expand/complete and reveal row actions without changing layout
  - [x] QuickFix: animate concentric circle controls, shorten folding delay, and lighten edge actions
  - [x] QuickFix: use a light bold ring when expanded and a dark bold ring when folded
  - [x] QuickFix: preview completion on hold, commit on release, or cancel into dragging on movement; clicks still fold
  - [x] QuickFix: leaf clicks toggle completion; checking cascades down, unchecking preserves descendants, and drag cancels subtree previews
  - [x] QuickFix: switch between indentation guides and CSS directory connectors without changing tree interactions
  - [x] QuickFix: match downward and incoming directory connector gaps at 3px; verify desktop/narrow layouts and folding
  - [x] QuickFix: protect nonempty titles for the entire Backspace press; verify fresh-press deletion and upward blank-cell repeat deletion
  - [x] QuickFix: accelerate held text Backspace to three characters per repeat; verify Unicode, cell protection, and native undo
- [ ] Evaluate the revised editor with a real task tree
- [ ] Add planning and verification states (future)
