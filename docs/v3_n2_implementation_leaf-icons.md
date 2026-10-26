# Leaf handle appearance

The **Leaf drawings** toolbar toggle selects two styles for unchecked leaves:

- Default: an empty 1.5px ring, thicker than the previous 1px outline but thinner than the 2px directory guides.
- Optional: a 2px ring and simple leaf outline/vein, matching the guides. Expandable nodes retain their 3px rings.

Both styles retain the 18px icon size and existing handle gestures. Checked leaves keep the existing filled circle/check mark. This option is independent of Directory guides and lasts for the current session; it does not alter saved task data.

`web/App.tsx` owns the toggle state and workspace class. `web/NodeControl.tsx` supplies a decorative SVG for leaves; `web/style.css` switches stroke widths and leaf drawing visibility, hides the SVG when checked, and respects reduced motion. SVG strokes preserve the fractional default width without CSS border rounding.

Validation: all 32 automated tests and production build; Firefox desktop/narrow visual inspection, computed stroke widths, unchanged parent/checked styles, switching, completion/reopening, and unchanged task data.
