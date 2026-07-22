# Failure Log

## 2026-07-21 -- Derive numeric expectations explicitly

When adding deterministic finance tests, calculate and record each component before setting the expected total. Do not rely on mental rounding of intermediate values.

## 2026-07-21 -- Preserve native hidden semantics

When a component class sets `display`, define a global `[hidden] { display: none !important; }` guard and visually verify hidden states after data loads. CSS display rules must not override native hidden state.

## 2026-07-22 -- Verify canvas gestures, not only graph state

For interactive SVG canvas work, browser QA must exercise the actual pointer gesture and visually verify its transient feedback. Do not assume `SVGElement.hidden = false` removes the `hidden` attribute; use `removeAttribute`/`setAttribute`. Do not replace a node DOM element on a no-movement pointer cycle, because that prevents the browser from completing `dblclick`.

## 2026-07-22 -- Minimalism before adding UI objects

Do not preserve or introduce controls, panels, labels, or future-facing configuration that users do not need in the current workflow. Prefer one control with a clear effect, progressive disclosure for advanced settings, and allocating the largest area to the primary task. Remove duplicated metadata and repeated context before compressing useful content.
