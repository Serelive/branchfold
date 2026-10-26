# Directory selection path

In Directory guides mode, the selected node and every visible ancestor receive darkened handles and a pale gold title highlight. The connector route from the visible root to the selected node turns dark green. Descendants and unrelated branches keep their ordinary styling; the route stops at the selected handle. Focused subtree views begin at their visible root. The original guide mode is unchanged.

`web/App.tsx` derives the path from `nodePath(shown, selectedId)` on every render. `on-path` marks its nodes, `path-ancestor` marks rows whose downward connector continues toward the selection, and `before-path` marks earlier siblings whose vertical trunk is traversed. Earlier sibling handles, titles, and horizontal connectors remain unhighlighted. `web/style.css` scopes the visual rules to `.directory-guides`, with direct-child selectors to avoid coloring unrelated descendants.

Selection uses the existing keyboard, pointer and editing focus behavior. Highlighting changes no task data or history. It supports plain rings, leaf drawings, checked nodes and collapsed branches; a selected collapsed branch highlights only its incoming path.

Validation: automated selection-path/focused-view regression plus the existing suite and production build. Firefox verified trunk continuity through an earlier expanded sibling, isolated sibling styling, the stopping point, title highlighting, focused views, mode switching and unchanged stored data; desktop and narrow screenshots inspected.
