# Review for Version 3, Node 2

## Test and Suggestions

- \[Result\] The prototype works well under Fcitx5. 
- \[Result\] The mapping is natural now. One suggestion is below.
- \[Issue\] The lines on the left hand side to align tasks might not be capable of this job. The common realization for alignment uses "dot and line" structure. In detail, there is large black dot in front of each task. And the alignment line is directly pointing to that line. However, our implementation seems to ignore this consideration. The drag rectangles do not align with the alignment line.
- \[Questions\] Two solutions are easy to come up with: Align the line with something clearly, which might ask us to darken the color or adapt the size of the line and the anchor elements. Another method is to assign each task with a background color. We also have at least two alternatives. One is that we only print color on the task cell, and another one is that we print color to form something like layers. We can regard the first level branch as the bottom/top layer and pile its sons above it/ dig layers for its sons. 
- \[Suggestion\] Add a deletion method: In navigation mode, use `Delete` to delete the current node; In editing mode, if the blanket is empty, use `Delete` delete the current node.