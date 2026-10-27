# Local sandbox project

`sandbox/` is an independent test project root containing its own README and Markdown task tree. It is seeded from the local version 1 backup at `materials/branchfold-backup.json`. The sandbox and source backup are ignored by Git; their task contents remain local.

The one-time conversion emits nested Markdown checklists with two-space indentation, preserving each title, completion flag, sibling order, and parent-child relationship. Prototype node IDs are omitted. This fixture preparation does not add an application import or migration feature.

Open `sandbox/` as the project root. Keep artifacts and links inside it. The README links only to its own task document. Modify the fixture freely for reading, editing, and recovery trials; Git will not restore these local edits.

Validation compares every emitted task's depth, title, and completion with the source, checks links and symlinks stay inside the sandbox, and verifies Git ignores both the fixture and backup.
