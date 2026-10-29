# Re-review — branch 1, version 3

Status: proposed; awaiting acceptance. This re-review covers only requirements 2 and 3 in [the review](b1_v3_review.md). No application changes are included. Requirements 1 and 4 are outside this review.

## 2. Mark tasks with a suggested tool

The intent is reasonable: a task can indicate where the user may continue working, without forcing a particular workflow. Treat a pointer as an optional annotation on an ordinary task. It retains its title, children, completion, and existing editing interactions.

The proposed `specify pointer --toolname ChatGPT` can express this, but command syntax suggests execution and introduces unnecessary argument-parsing rules. “The string after the toolname is passed to the toolname” is also ambiguous: the example supplies a tool name, but no separate payload or destination. For this slice, I recommend interpreting `ChatGPT` solely as a tool label. Opening tools, passing prompts, and invoking commands would require a separate interaction design.

**Recommended representation:** one namespaced, declarative trailing HTML comment:

```markdown
- [ ] Project: Routines <!--branchfold:{"tool":"ChatGPT"}-->
- [ ] Review changes <!--branchfold:{"tool":"VS Code"}-->
```

The optional `tool` field itself makes the task a pointer; a separate `type: pointer` field would duplicate that information. JSON provides familiar quoting for spaces and punctuation. Keep this first format limited to one nonempty tool name per task. Trim surrounding whitespace, preserve the displayed spelling, and match names case-insensitively for coloring. Names containing HTML comment delimiters should be rejected with a clear explanation.

Recognize the annotation only as a trailing HTML comment in the task's first paragraph, outside inline code. A literal example, malformed annotation, unknown field, or duplicate annotation should remain visible as title content rather than being partly interpreted. Hide only a fully recognized annotation. This keeps mistakes discoverable and avoids silently discarding information.

Two simpler alternatives are useful in different circumstances:

- A visible title suffix such as `Project: Routines — ChatGPT` works immediately in ordinary Markdown, but provides no dependable distinction between a tool label and title text.
- An ordinary Markdown link is better when the user has a concrete project, conversation, or file destination. A tool name alone does not identify one, so links complement this annotation rather than replacing it for the proposed examples.

For the requested structured grouping and clean title, the namespaced comment is the better fit. Accepting the original command spelling instead is possible, but it should still be parsed as inert metadata, with a defined quoted-name grammar and no execution semantics.

## 3. Show tool identity clearly

Consistent colors are useful for scanning tasks that share a tool. A small **tool-name badge** beside the title is preferable to tinting the whole cell or changing the handle. The editor already uses those areas for selection, ancestor-path emphasis, completion, and expansion. A badge adds the tool cue without competing with them, and its text identifies the tool when colors are similar.

Use a fixed macaron palette with coordinated light/dark variants. Choose the palette slot deterministically from the normalized tool name, so importing, reordering, or reopening a tree does not change its assignments. Keep the same palette family across themes, with readable text and sufficient separation from the background. A finite palette can repeat colors across different tools; the visible name resolves that ambiguity. Unique colors for every tool would require additional assignment state and are unnecessary for this slice.

Display the badge in both hosts, including on completed tasks. Keep normal title editing free of annotation syntax, and provide a compact way to edit or clear the tool label through the existing cell options. Checking, folding, and dragging continue to operate on the task normally. Do not inherit tool annotations automatically from ancestors: each annotation describes its own task.

## Implementation implications and acceptance checks

The current [Markdown adapter](../../web/markdown.ts) imports inline comments as literal title content and escapes them during export. The [task model](../../web/tree.ts) has no tool field. Hiding comment text with a rendering-only change would therefore be insufficient: recognized metadata must be stored separately and emitted as a real trailing comment on Markdown export or explicit extension Save.

After acceptance, validate that:

- Annotated tasks round-trip through Markdown, JSON backups, browser persistence, and extension draft recovery; existing unannotated trees still load unchanged.
- Rename, move, append, completion, and undo preserve the annotation; editing or clearing the tool label is undoable.
- Malformed comments and literal examples remain visible, and repeated saves do not duplicate metadata. Annotation-only blank tasks round-trip too.
- The same tool receives the same badge color after reordering and reopening. Light/dark mode, selected rows, completed tasks, Chinese tool names, and narrow layouts remain readable in both hosts.
- Importing remains read-only; explicit extension Save and existing external-change conflict handling continue to govern writes.

**Decision requested:** accept the declarative tool annotation and labeled macaron badge as the revised scope for requirements 2 and 3. Implementation waits for acceptance.
