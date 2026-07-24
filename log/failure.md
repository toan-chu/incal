# Failure Log

## 2026-07-21 -- Derive numeric expectations explicitly

When adding deterministic finance tests, calculate and record each component before setting the expected total. Do not rely on mental rounding of intermediate values.

## 2026-07-21 -- Preserve native hidden semantics

When a component class sets `display`, define a global `[hidden] { display: none !important; }` guard and visually verify hidden states after data loads. CSS display rules must not override native hidden state.

## 2026-07-22 -- Verify canvas gestures, not only graph state

For interactive SVG canvas work, browser QA must exercise the actual pointer gesture and visually verify its transient feedback. Do not assume `SVGElement.hidden = false` removes the `hidden` attribute; use `removeAttribute`/`setAttribute`. Do not replace a node DOM element on a no-movement pointer cycle, because that prevents the browser from completing `dblclick`.

## 2026-07-22 -- Minimalism before adding UI objects

Do not preserve or introduce controls, panels, labels, or future-facing configuration that users do not need in the current workflow. Prefer one control with a clear effect, progressive disclosure for advanced settings, and allocating the largest area to the primary task. Remove duplicated metadata and repeated context before compressing useful content.

## 2026-07-24 -- Do not equate tier with FIN new-customer KPI

The Q1 adjustment implementation counted every distinct paid `Mức 3` customer as a new-customer KPI achievement. FIN's gold workbook instead uses the separately curated `KH mới từ Q1(3)` list with contract-date and six-month eligibility. For policy parity, preserve the FIN eligibility source as an explicit input table/flag and reconcile its person-level counts before claiming a payout match.

## 2026-07-24 -- Keep FIN comparison basis separate from take-home pay

FIN's `Tổng Incentive` is a pre-tax reconciliation value, while the app's `Thực nhận` must retain applicable tax deductions. Do not disable tax merely to make those differently defined columns equal. Reconcile FIN gold against `gross incentive - penalty`, and present tax plus take-home separately.
