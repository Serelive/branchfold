# Leaf handle appearance

The **Leaf drawings** toolbar toggle selects two styles:

- Default: an empty 1.5px ring for unchecked leaves; the original filled circle/check mark when checked.
- Leaf drawings: a standalone asymmetric leaf outline, stalk and vein in 2px strokes, matching directory guides. Checked leaves use an 18px filled circle with a transparent leaf-and-stalk silhouette inside. Expandable nodes retain their existing circular icons and 3px unchecked rings.

Both styles retain the 18px icon area and existing handle gestures. The outlined leaf's stalk begins at the left midpoint, aligned with the incoming directory connector and its 3px gap. The checked cutout reuses the same outline and stalk, scaled to 70% to leave a solid circle border. This option is independent of Directory guides and lasts for the current session; it does not alter saved task data.

`web/App.tsx` owns the toggle state and workspace class. `web/NodeControl.tsx` supplies decorative SVGs, shared leaf paths, and per-control `useId` masks for genuine transparency. `web/style.css` switches the plain ring, outline and masked circle, removes the background behind the cutout, and respects reduced motion. SVG strokes preserve the fractional default width without CSS border rounding.

Validation: all 32 automated tests and production build; Firefox checks for connector/stalk alignment, unique masks, transparency, style switching and completion/reopening, plus desktop/narrow visual inspection. Default checked icons and task data remain unchanged.
