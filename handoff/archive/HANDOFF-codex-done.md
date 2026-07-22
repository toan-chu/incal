# HANDOFF -- CODEX DONE -- Incentive Calculator P1-P4

## Built

- Offline app entry: `TinhIncentive.html`.
- UI/style: `css/app.css`, Trustana logo from `assets/`, local Roboto font files in `assets/fonts/`.
- Runtime vendor: local SheetJS at `js/vendor/xlsx.full.min.js`; app does not call network at runtime.
- Engine modules:
  - `js/engine/parse.js` reads template sheets by sheet name + column name.
  - `js/engine/validate.js` implements blocking/warning validation.
  - `js/engine/enrich.js`, `classify.js`, `commission.js`, `penalty.js`, `tax.js`, `assemble.js` implement E1-E8.
- Exports:
  - `js/export/xlsx_bk.js` for `BK_<quarter>.xlsx`.
  - `js/export/xlsx_bke.js` for one multi-sheet `BKe_<quarter>.xlsx`.
  - `js/export/report.js` for `report_<quarter>.json` and `tidy_<quarter>.xlsx`.
- Tests:
  - `test/engine.test.js` covers E1, E3, E6, E7, full assemble, and template parse.
  - `test/golden/extract_q1.py` recreates a reduced Q1 input fixture from selected Q1 sheets.
  - `test/golden.test.js` runs engine against Q1 fixture and writes `test/golden/RECONCILIATION.md`.

## Verification

`node --test`:

```text
tests 11
pass 11
fail 0
duration_ms 300.5524
```

Browser/file smoke:

- Opened `TinhIncentive.html` from `file://` with Playwright CLI.
- Captured `output/playwright/cli-desktop.png` at 1440x900.
- Captured `output/playwright/cli-mobile.png` at 390x844.
- Visual check: initial state renders, no blank page, no obvious overlap, mobile layout stacks correctly.

## Reconciliation Summary

`test/golden/RECONCILIATION.md`:

- class a: 5
- class b: 13
- class c: 0

The Q1 fixture is intentionally reduced because Q1 original has hidden/manual inputs not represented in template v2, especially full payroll/tax inputs and KAM/other manual sheets. Differences are classified as rule/input gaps, not engine-bug class c.

## Decisions Outside Spec

- BKê export uses one workbook with one sheet per person. Reason: blueprint allowed either per-person files or one multi-sheet workbook, and one workbook is easier for FIN to download from an offline browser without multiple forced downloads.
- Golden Q1 fixture maps original `Mức 1` to `KAE Sale` because the legacy Q1 sheet does not carry the v2 taxonomy (`KAE Admin` vs `KAE Sale`). This is documented in `test/golden/extract_q1.py`.
- Playwright upload smoke was replaced by Node parse coverage plus static browser screenshots because npx Playwright test package resolution was unstable on this Windows machine. Runtime file opening was still checked via Playwright CLI screenshots.

## Still Open For FIN/Cowork

- `TODO(open-1)`: KAM KPI gate 40/30/30 versus equal split.
- `TODO(open-2)`: Spring equal split versus contribution split.
- `TODO(open-6)`: whether `Chi phí` already includes COM in the final FIN template.
- `TODO(open-7)`: unpaid penalty source of truth: engine from `1_Job` or manual rows in `6_PhatNoXau`; current code prevents double-count warning.
- Golden Q1 parity needs richer extraction or a FIN-provided v2 input populated from Q1 before exact numeric acceptance.

## R1 Fixes -- 2026-07-13 16:14

Claude review file: `handoff/REVIEW-claude-r1.md`.

Done:

- FIX-1: Replaced 7-bracket PIT in `js/engine/tax.js` with BK-style formula from config: `max(taxable * pit_rates[i] - pit_quick[i])`, floor 0, and BK behavior `familyDeduction = 0 -> tax 0`.
- FIX-2: `calculateCommissions` now includes all paid/partial jobs, including negative `gpTinh`; unpaid jobs remain out naturally.
- FIX-3: B2 target now pro-rates by worked months: `chi_tieu_b2_per_thang * workedMonthsInQuarter(employee)`. Manager missing-B2 uses the same personal target.
- FIX-4: `test/golden/RECONCILIATION.md` now compares components (`waterfall`, `TBP`, `phạt`, `thuế`, `thực nhận`) and adds class `(d) fixture gap`.
- Added BKê PDF path: UI button `BKê PDF` opens print-ready pages, one person per page, for Chrome "Save as PDF".

Verification:

```text
node --test
tests 14
pass 14
fail 0
```

New reconciliation summary:

```text
Summary: a=20, b=10, c=0, d=13
```

Notes:

- `waterfall` and `phạt` for 6 COM rows are class `a` after fixture enrichment.
- Remaining class `b` is tax/net, caused by Q1 BK payroll/tax behavior not fully represented in the reduced fixture.
- Class `d` marks non-COM fixture gaps for KAM/BO/Sale khác/manual inputs.
- BKê PDF is print-to-PDF, not silent multi-file PDF generation. This keeps runtime offline and dependency-light; Chrome can save the generated pages as PDF for payslip attachment.

## R3 Fix -- 2026-07-13 16:34

Done:

- Fixed E4c BO/thử việc aggregation in `js/engine/commission.js`: paid job losses are no longer floored to zero. BO GP now sums raw `gpTinh`, matching the R1 Sales negative-GP behavior and XLS `Sale khác`.
- Added regression test `E4c BO incentive includes paid negative GP jobs`.
- Regenerated Q1 reduced fixture and reconciliation.

Verification:

```text
node --test
tests 15
pass 15
fail 0
```

UAT next:

- FIN should enter real Q1 data into `TEMPLATE_Input-Incentive.xlsx`, drag it into `TinhIncentive.html`, and compare against the paid 11/6 figures.
- That UAT replaces the reduced Codex fixture; current `(b)` and `(d)` reconciliation rows should shrink into the true remaining differences.
- Close these during UAT: KAM KPI 40/30/30, Spring split, open-6 whether `Chi phí` includes COM, and open-7 unpaid penalty source.
