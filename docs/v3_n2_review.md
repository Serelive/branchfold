# Review for Version 3, Node 2

## Test Results

- **[Pass]** The prototype works well with Fcitx5. I did not encounter issues with Chinese input during testing.
- **[Pass]** The current navigation and editing key mappings feel natural overall. I have one additional shortcut suggestion below.

## Visual Hierarchy and Indentation Guides

- **[UI Issue]** The vertical indentation guides on the left do not yet communicate the tree hierarchy clearly enough. In Obsidian's outline view (see the reference screenshot), each task has a bullet marker, and vertical guides align with the markers of sibling tasks, making their grouping visually apparent. In the current Branchfold prototype, the rectangular drag handles at the left edge of each row do not align with the indentation guides. As a result, the relationship between the guides, the task rows, and the draggable elements is unclear.

- **[Design Alternatives]** I see two possible directions. These are alternatives to explore, not features that must both be implemented:

  1. **Refine the dot-and-line approach.** Give each task a clear visual anchor (such as a bullet or a consistently positioned drag handle) and align the vertical indentation guides with those anchors. Adjust the guides' contrast, thickness, and spacing, or the anchors' size and position, so that the hierarchy is easy to follow. Drag handles should fit into this alignment system rather than appear disconnected from it.
  2. **Use background color to express hierarchy.** One variant colors individual task rows or cells. Another uses nested background regions: a parent branch forms a base layer, and its children appear in progressively inset, raised, or recessed layers. The goal is to make parent-child relationships visible through containment and depth rather than relying entirely on lines.

  Please assess which approach communicates the hierarchy most clearly without adding excessive visual clutter. There is no need to implement both.

## Deletion Shortcuts

- **[Suggestion]** Add a direct deletion shortcut that respects the current interaction mode:
  - **Navigation mode:** `Delete` deletes the selected node (and its subtree, if applicable).
  - **Editing mode:** If the current task title is empty, `Backspace` deletes that node. Otherwise, `Backspace` retains its normal text-editing behavior.

  Preserve the existing undo/redo behavior. For nodes with descendants, provide an appropriate safeguard against accidental subtree deletion. Ensure that the shortcut does not interfere with Fcitx5 composition.

## Scope

The existing navigation/editing model is satisfactory overall; this review does **not** request another wholesale redesign. Please focus on improving hierarchy cues and adding the deletion behavior while preserving working tree operations, subtree focus, and keyboard interactions.
