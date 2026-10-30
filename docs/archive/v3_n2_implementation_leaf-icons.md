# Leaf handle appearance

The **Leaf drawings** toolbar toggle selects two styles:

- Default: an empty 1.5px ring for unchecked leaves; the original filled circle/check mark when checked.
- Leaf drawings: a standalone asymmetric leaf outline, stalk and vein in 2px strokes, matching directory guides. Checked leaves use the original filled circle/check mark, as in the default mode. Expandable nodes retain their existing circular icons and 3px unchecked rings.

Both styles retain the 18px icon area and existing handle gestures. The outlined leaf's stalk begins at the left midpoint, aligned with the incoming directory connector and its 3px gap. This option is independent of Directory guides and lasts for the current session; it does not alter saved task data.

`web/App.tsx` owns the toggle state and workspace class. `web/NodeControl.tsx` supplies decorative SVGs and shared leaf paths. `web/style.css` switches the plain ring and outline, hides the SVG when checked, and respects reduced motion. SVG strokes preserve the fractional default width without CSS border rounding.

The checked leaf cutout was withdrawn after visual review; its SVG masks and styles have been removed. The standalone unchecked outline and stalk alignment are retained.

Validation after restoration: all 32 tests and production build pass. Firefox verified filled check marks, preserved unchecked outlines, and checking/reopening transitions.
