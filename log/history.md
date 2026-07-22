# History

## [2026-07-22 15:08] -- [AUTO] Align graph popup and add map lookup primitive

**Type:** feature
**Files Changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `js/core/registry.js`, `js/core/validator.js`, `js/core/schema.js`, `test/v3_core.test.js`, `test/formula_canvas.test.js`, `test/v3_acceptance.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Replaced mismatched Unicode popup glyphs with one aligned SVG icon system, clamped menus below the sticky header and inside the viewport, and allowed Fit to show wide graphs without clipping. Implemented Claude's new `Gắn cột tra cứu` Table-to-Table primitive with immutable row enrichment, typed derived fields, finance-friendly settings and browser coverage. Windows tests pass 39/39; Chrome QA passes at 1440/1280 with NET 11.65/2.88/1.9 million and zero runtime/network/overflow errors.
**Decision:** Kept manual zoom at 50%-160% while giving Fit a separate 38% floor. Added only the authorized map-lookup registry entry; existing primitive/macro executors and Claude's rounding engine remain unchanged.

---

## [2026-07-21 12:58] -- [AUTO] Build Incentive Calculator v3

**Type:** feature
**Files Changed:** `.gitignore`, `v3/**`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `scripts/v3_browser_runner.js`, `memory/semantic/v3-runtime.md`, `handoff/todo.md`, `handoff/audit.md`, `log/failure.md`, `log/history.md`
**Summary:** Built the isolated offline v3 app with four tabs, persistent roster, typed recipe builder, one deterministic 14-primitive/3-macro registry, exact-column Excel generation/import, traceable calculation, exports and multi-period Dashboard. Added synthetic unit/acceptance/browser QA without adding real business data or a real Trustana preset.
**Decision:** Kept v2 frozen and copied only local vendor/font/export assets into v3. Chose versioned localStorage plus roster JSON backup, stable field ids plus editable labels, and hidden Excel metadata/fingerprint. v3 tests pass 14/14 and file browser QA passes, but the CEO numeric parity gate remains blocked because `docs/spec/TEST-SCENARIO_v3.md` is absent.

---

## [2026-07-21 09:12] -- [AUTO] Prepare Claude review prompt for drag-and-drop calculator

**Type:** research
**Files Changed:** `handoff/PROMPT_CLAUDE_REVIEW_Drag-Drop-Calculator.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Added a copy-ready prompt directing Claude to review the proposed Run Mode and typed Rule Recipe Builder, audit the complete formula catalog, and produce a 14-decision evidence matrix. The prompt explicitly forbids implementation, closed-blueprint edits and premature Blueprint v3 creation.

---

## [2026-07-21 08:56] -- [AUTO] Design typed drag-and-drop calculator and consolidate formulas

**Type:** architecture
**Files Changed:** `handoff/REVIEW-PACKET_Drag-Drop-Calculator.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Documented a beginner-first Run Mode and a safe typed Rule Recipe Builder, then consolidated all known Trustana calculation formulas, parameters, workbook aggregation patterns, data dependencies, historical variants and unresolved conflicts into one Claude review packet. No application source or closed blueprint was changed.
**Decision:** Recommend a vertical recipe editor with explicit `% OF base` semantics, typed arithmetic and locked domain macros instead of an unrestricted formula string or full free-form node canvas. Before implementation, converge legacy helper formulas and the canonical v2 engine into one versioned executable rule registry.

---

## [2026-07-20 16:56] -- [AUTO] Create Config Studio beginner test kit

**Type:** feature
**Files Changed:** `outputs/019f7eb3-9464-7f63-8fc4-89f54f30b8d6/Beginner-Test-Kit/SAMPLE_Input_Q1-2026.xlsx`, `outputs/019f7eb3-9464-7f63-8fc4-89f54f30b8d6/Beginner-Test-Kit/SAMPLE_Workspace_Q1-2026.json`, `outputs/019f7eb3-9464-7f63-8fc4-89f54f30b8d6/Beginner-Test-Kit/HUONG_DAN_SU_DUNG.md`, `test/sample_kit.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Built a compact three-person/seven-job Q1 training kit so a first-time user can test Config Studio by opening either Workspace JSON or the legacy-compatible Excel sample. Added a Vietnamese quick-start guide, spreadsheet validation/visual QA and automated parity tests; the full suite passes 40/40.
**Decision:** Kept Workspace JSON as the recommended beginner path and Excel as an optional import demonstration. Selected real Q1 job rows but simplified KAE/BO profile assignments for teaching, with an explicit do-not-use-for-payment warning.

---

## [2026-07-13 15:53] -- Build offline incentive calculator

**Type:** feature
**Files Changed:** `TinhIncentive.html`, `css/app.css`, `js/app.js`, `js/engine/*.js`, `js/export/*.js`, `config/default.json`, `test/*.js`, `test/golden/*`, `handoff/*`, `log/*`
**Summary:** Built the Trustana FIN incentive calculator as an offline HTML app with SheetJS local vendor, pure JS engine modules, parser/validator, BK/BKê/report/tidy exports, Q1 golden reconciliation, and Node tests. Added workspace journals and test plan required by AGENTS.md.
**Decision:** Export BKê as one multi-sheet workbook to avoid multiple browser downloads; Q1 golden is classified as reduced-fixture reconciliation until FIN provides a fully populated v2 input.

---

## [2026-07-13 16:45] -- Populate Q1 five-person template fixture

**Type:** config
**Files Changed:** `TEMPLATE_Input-Incentive.xlsx`, `test/engine.test.js`, `handoff/*`
**Summary:** Filled the root template workbook with 5 selected Q1 COM Sales and all 86 matching jobs from the source Q1 workbook so the offline tool can be tested against known 11/6 payout figures. Added an `8_DoiChieu_Q1` sheet with expected source values and verified the tool parses the workbook without validation issues.
**Decision:** Preserved traceability to the Q1 source while suffixing one duplicated Job No with `-DUP2` because the tool correctly blocks duplicate job IDs.

---

## [2026-07-13 16:34] -- Fix BO negative GP aggregation

**Type:** bugfix
**Files Changed:** `js/engine/commission.js`, `test/engine.test.js`, `test/golden/*`, `handoff/*`
**Summary:** BO/thử việc incentive no longer floors negative job GP to zero. Added a regression test proving a positive and negative BO job net together before applying the 8% rate.
**Decision:** Matched Sales R1 behavior and XLS `Sale khác`: paid losses reduce the GP pool instead of being ignored.

---

## [2026-07-13 16:14] -- Apply Claude R1 incentive fixes

**Type:** bugfix
**Files Changed:** `js/engine/common.js`, `js/engine/tax.js`, `js/engine/commission.js`, `js/engine/assemble.js`, `js/engine/parse.js`, `js/app.js`, `js/export/xlsx_bke.js`, `config/default.json`, `test/engine.test.js`, `test/golden/*`, `handoff/*`
**Summary:** Fixed R1 review blockers: PIT now follows BK config formula, negative paid GP jobs stay in commission pools, B2 target pro-rates by worked months, and Q1 reconciliation now breaks down components with class `(d)` fixture gaps. Added BKê print-to-PDF flow for Sales payslip use.
**Decision:** Used browser print-to-PDF instead of adding a PDF generation library so the offline app stays lightweight; true per-person silent PDF files can be added later if FIN needs it.

---

## [2026-07-13 17:16] -- Clean internal package and polish exports

**Type:** feature
**Files Changed:** `TinhIncentive.html`, `css/app.css`, `js/export/*.js`, `js/vendor/xlsx-js-style.bundle.js`, `reports/README.md`, `TEMPLATE_Input-Incentive.xlsx`, `handoff/*`
**Summary:** Cleaned the internal handoff package by removing git/agent metadata and stale root Excel files, leaving one standard root input template. Improved the UI copy and styling, added orange accents and hover animation, upgraded BK/BKe/tidy exports with styled headers and number formats, and added the Trustana logo to the BKe PDF print layout.
**Decision:** Added a local `xlsx-js-style` browser vendor so exported XLSX files can contain real styles while the app remains offline at runtime.

---

## [2026-07-13 17:25] -- Add report JSON history charts

**Type:** feature
**Files Changed:** `TinhIncentive.html`, `css/app.css`, `js/app.js`, `js/engine/history.js`, `test/history.test.js`, `reports/README.md`, `handoff/*`
**Summary:** Added a multi-report JSON reader to the offline HTML tool so FIN can drag several quarterly `report_*.json` files into the page and see YTD totals, total chi by quarter, top people, and a summary table. Added regression coverage for quarter sorting and person aggregation.
**Decision:** Used native Canvas charts instead of a charting dependency so the dashboard stays fully offline and easy to distribute.

---

## [2026-07-14 09:36] -- Polish dashboard toggle and exports

**Type:** feature
**Files Changed:** `TinhIncentive.html`, `css/app.css`, `js/app.js`, `js/engine/history.js`, `js/export/report.js`, `js/export/xlsx_bke.js`, `test/history.test.js`, `reports/README.md`, `handoff/*`
**Summary:** Reworked the UI into top-level `INCENTIVE` and `DASHBOARD` views, moved JSON history into the dashboard, and added a Power-BI-style chart builder with common chart types. Cleaned export naming, added timestamped data JSON filenames, changed phiếu chi PDF to per-person buttons in the result table, aligned numeric columns, and added footer credits.
**Decision:** Kept charts on native Canvas and local JSON import so the app remains a single offline HTML tool without runtime network dependencies.

---

## [2026-07-14 09:54] -- Port imetrik visual system

**Type:** feature
**Files Changed:** `css/app.css`, `js/app.js`, `assets/fonts/*.woff2`, `handoff/*`, `log/history.md`
**Summary:** Ported imetrik's offline typography and visual style into the incentive calculator: Be Vietnam Pro, JetBrains Mono, compact Trustana purple/orange tokens, refined topbar/toggle/buttons, dashboard sidebar, chart builder, cards, tables, and chart action controls.
**Decision:** Reused local font assets instead of remote fonts so the tool remains fully offline when the folder is shared internally.

---

## [2026-07-14 10:01] -- Build HR distribution package

**Type:** config
**Files Changed:** `dist/Trustana-Incentive-Tool-20260714-1000/**`, `dist/Trustana-Incentive-Tool-20260714-1000.zip`, `handoff/*`, `log/history.md`
**Summary:** Created a clean user distribution package containing only the offline app, current input template, runtime CSS/JS/vendor files, logo, active fonts, reports README, and a quick guide. Excluded docs, test fixtures, handoff logs, memory, source workbooks, Q1 report data, old Roboto fonts, and unused browser vendor files from the package.
**Decision:** Kept dev/audit material in the source tree for maintainability, but separated a minimal `dist` zip for HR/FIN use.

---

## [2026-07-20 14:35] -- [AUTO] Map FIN workbook and Config Studio architecture

**Type:** research
**Files Changed:** `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Read the complete 13-sheet Q1 FIN test workbook, policy, FIN checklist, process note, legacy theory/blueprint, and current engine. Mapped formulas and dependencies, separated input/config/derived/override responsibilities, and designed a versioned rule-template Config Studio for Trustana and reusable company profiles.
**Decision:** Keep deterministic rule templates in code, business parameters and supported modes in versioned policy config, quarter facts in input data, and exceptional person/job changes as audited overrides. The source workbook is evidence of behavior but cannot be copied literally because it contains broken references, external links, and mixed input/derived columns.

---

## [2026-07-20 15:43] -- [AUTO] Close Config Studio blueprint and handoff

**Type:** architecture
**Files Changed:** `docs/spec/BLUEPRINT_v2_Config-Studio.md`, `handoff/PROMPT_CHAT_MOI_Config-Studio.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Converted the completed FIN discovery into a durable v2 blueprint and a copy-ready prompt for a fresh implementation task. The blueprint covers workspace JSON, policy activation by quarter, multi-profile employee assignments, AE routing, binary MISA payment status, KAE sharing, configurable side projects, tax modes, direct-entry UI, migration and verification.
**Decision:** Start implementation in a fresh task from the durable blueprint. `/compact` is useful for freeing tokens in the same chat, but a new task plus file-based handoff provides a cleaner execution context and protects detailed decisions from summarization loss.

---

## [2026-07-21 13:45] -- Test official root app and remove compatibility metadata

**Type:** refactor
**Files Changed:** `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `test/v3_scenario.test.js`, `scripts/app_browser_runner.js`, `package.json`, `README.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`; removed `v3/`, `AGENTS.md`, `memory/`, `tmp/`.
**Summary:** Updated all accepted v3 tests and browser QA to exercise the official root runtime directly, then removed the obsolete filesystem bridge. Removed project-only agent instruction/memory scaffolding at the Chairman's direction and kept the operation recoverable through Windows Recycle Bin. `npm.cmd test` passes 15/15 and file browser QA passes at four viewports with zero console, request or overflow errors.
**Decision:** Keep version naming in test filenames for historical clarity, but make root `index.html`, `js/`, and `presets/` the only executable/test source. Limit the default npm test command to the official v3 suite; retain legacy v2 tests as historical files only.

---

## [2026-07-21 15:28] -- Replace template workflow with dynamic Excel schema

**Type:** architecture
**Files Changed:** `index.html`, `css/app.css`, `branding.json`, `README.md`, `js/branding.js`, `js/core/schema.js`, `js/adapters/storage.js`, `js/adapters/xlsx.js`, `js/app.js`, `presets/empty-preset.json`, `scripts/app_browser_runner.js`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Replaced the app-generated Excel template and persisted roster model with a three-tab workflow where FIN workbooks define a dynamic multi-sheet schema. Presets now retain only sheet/header metadata, types, bindings, and formulas; same schemas auto-map, changed headers fail closed, and period rows remain in memory only. Browser QA passed at four viewports and the 15-test suite, including the zero-variance engine scenario, passed.
**Decision:** Kept the deterministic engine and 14+3 registry untouched behind an adapter that materializes workbook sheets into engine tables. Used exact schema fingerprints instead of fuzzy matching to prevent silent financial errors, and used the local TrustanaSans/JetBrains font pair with the existing Trustana brand colors.

---

## [2026-07-21 15:34] -- Restore Dashboard as the fourth tab

**Type:** feature
**Files Changed:** `index.html`, `css/app.css`, `js/app.js`, `README.md`, `scripts/app_browser_runner.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Restored the file-driven multi-period Dashboard after the Chairman clarified that it remains required. The fourth tab loads multiple Report JSON files, summarizes quarter and YTD totals, renders two charts and a people table, and preserves the preset-only privacy boundary. Tests remain 15/15 and browser QA passes with two reports at four viewports.
**Decision:** Keep the application desktop-first for FIN operations. Mobile responsiveness is only a low-cost no-break fallback, while Dashboard remains an explicit fourth workflow tab.

---

## [2026-07-21 17:04] -- Open data model to N tables and cross-table lookup

**Type:** architecture
**Files Changed:** `index.html`, `css/app.css`, `README.md`, `package.json`, `js/app.js`, `js/branding.js`, `js/core/schema.js`, `js/core/validator.js`, `js/adapters/xlsx.js`, `scripts/app_browser_runner.js`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `assets/fonts/*`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`; removed seven dead v2 tests and `test/golden/`.
**Summary:** Replaced the hardcoded jobs/roster sheet model with user-defined N-table entities, one selectable subject table, table-scoped keys, and exact cross-table lookup. The real four-sheet sample now auto-maps, runs a three-table formula with NV01 equal to 199,000,000, and stores only preset metadata. Updated the operational UI to local Quicksand and Montserrat, retained Dashboard, and verified 22/22 tests plus browser QA at four viewports.
**Decision:** Preserve the deterministic engine and 14+3 registry byte-for-byte by projecting the selected subject table to the existing roster alias. Keep recipe nodes as executable relationship truth, exact schema matching as the financial safety gate, and lookup limited to one-key first-match semantics rather than expanding into a relational database.

---

## [2026-07-22 09:38] -- Dọn UX tab Công thức

**Type:** feature
**Files Changed:** `index.html`, `css/app.css`, `js/app.js`, `test/v3_acceptance.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Thay toàn bộ node/operator/field id phơi ra ở Formula bằng nhãn nghiệp vụ; chuyển quản lý recipe xuống dưới flow; rút preset còn hai hành động nạp+cache ngầm và tải JSON; bỏ panel định danh thừa. Bổ sung regression + browser QA cho label/value separation, disabled reason, file download và guardrail NET Trustana.
**Decision:** Giữ mapper ở UI để preset, node id, operator code và engine không đổi. `Nạp preset` là điểm cache tự động; `Lưu preset` chỉ có nghĩa xuất file JSON. `node --test` và `npm.cmd test` pass 24/24; QA 4 viewport pass với NET 11.650.000 / 2.880.000 / 1.900.000 và 0 console/network/overflow.

---

## [2026-07-22 10:03] -- [AUTO] Normalize controls and export language

**Type:** bugfix
**Files Changed:** `index.html`, `css/app.css`, `js/app.js`, `js/export/categories.js`, `js/export/xlsx_bk.js`, `js/export/xlsx_bke.js`, `README.md`, `test/export_regression.test.js`, `test/v3_acceptance.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Fixed select caret alignment across the application, removed redundant step and Offline badges, and replaced FIN-specific BK/BKe labels with generic export names. Added browser regressions that download both Q2 JSON variants, verify their distinct payload shapes, and prove that changing the report period changes metadata and filenames without recalculating values.
**Decision:** Keep legacy internal function and element IDs for compatibility while changing only user-visible labels, workbook names, and filenames. Preserve the report period as export metadata only. Core hashes remained unchanged; 25 tests and four-viewport browser QA passed with the Trustana NET guardrail intact.

---

## [2026-07-22 11:02] -- Formula canvas and dynamic recipe exports

**Type:** feature
**Files Changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `js/export/categories.js`, `package.json`, `scripts/app_browser_runner.js`, `test/formula_canvas.test.js`, `test/export_regression.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Rebuilt the Formula tab as an offline desktop node canvas with grid-snapped drag and drop, panning, SVG bezier connections, validator-gated type and cycle checks, automatic result sink detection, compact Subject Bridge, and a node inspector. Replaced fixed COM/Other/BO exports with recipe-component groups so the Trustana preset now exports COM, BO, and KAE independently.
**Decision:** Use absolute DOM nodes plus one SVG edge layer and keep `node.inputs` as the only edge contract. Persist layout only in additive `node.meta.canvas`; derive export groups from enabled income recipe components while excluding penalty, tax, and adjustment. Node tests passed 30/30; Chrome QA passed at 1440x900 and 1280x800 with zero console, page, network, or overflow errors and unchanged NET values.

---

## [2026-07-22 12:07] -- [AUTO] Mature canvas interactions and transient settings

**Type:** feature
**Files Changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `scripts/app_browser_runner.js`, `test/formula_canvas.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`, `log/failure.md`
**Summary:** Upgraded Formula Canvas with cursor-anchored zoom/fit, visible ghost arrows, replace-source and retarget-target connections, semantic node/port colors, unified chevrons, node context actions, and on-demand settings dialog. Removed the permanent right inspector so the graph owns the workspace width; fixed SVG hidden handling and no-movement node rerenders uncovered by real Chrome gestures.
**Decision:** Follow Obsidian/React Flow/FigJam/tldraw interaction conventions without adding a library or CDN. Keep one frontend camera and continue using `node.inputs` as the sole edge contract; validate a cloned recipe before atomic reconnect. Node tests passed 32/32, Chrome QA passed at 1440x900 and 1280x800 with zero console/page/network/overflow errors, and Trustana NET stayed 11.650.000 / 2.880.000 / 1.900.000 with immutable core hashes unchanged.

---

## [2026-07-22 13:32] -- [AUTO] Complete Finance-first minimal UX

**Type:** feature
**Files Changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `js/export/categories.js`, `js/export/xlsx_bk.js`, `js/export/xlsx_bke.js`, `test/v3_acceptance.test.js`, `test/formula_canvas.test.js`, `test/export_regression.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`
**Summary:** Removed duplicate subject controls and moved the single calculation-subject selector to Calculate, with three identity bindings embedded only in the active Input sheet. Simplified Formula into recipe controls plus a dominant canvas; added whole-node drag, persistent width resize, editable macro instance names, direct edge endpoint reconnect/disconnect, clean empty-recipe state, and recipe-derived result/PDF/XLSX labels instead of COM/KAE/BO hardcoding.
**Decision:** Treat the selected sheet as the only subject source of truth and use additive presentation/layout metadata rather than changing preset identifiers or engine semantics. Keep macros technically locked while exposing instance labels, supported config overrides, and read-only formula descriptions. All 35 tests and Windows Chrome QA passed; NET remained 11.650.000 / 2.880.000 / 1.900.000 and engine/registry hashes remained unchanged.

---

## [2026-07-22 16:09] -- Add map arithmetic and ship anonymized FIN sample

**Type:** feature
**Files Changed:** `.gitignore`, `README.md`, `INPUT-Incentive-mau.xlsx`, `index.html`, `js/app.js`, `js/core/registry.js`, `js/core/validator.js`, `presets/trustana-q1.json`, `scripts/app_browser_runner.js`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`; recycled `tmp/`, `docs/INPUT-Incentive_mau.xlsx`, `presets/trustana-q1-demo.json`, `INPUT-Incentive-mau.xlsx.inspect.ndjson`.
**Summary:** Added the `map_arithmetic` Table-to-Table primitive with typed field/literal arithmetic and chainable derived columns. Rebuilt the official root sample as an anonymized four-sheet workbook without a precomputed penalty column, rewired the Q1 preset to calculate penalty from raw revenue, overdue months and 1%, and rewrote the GitHub README for Finance users. Final sample produces penalty 2,676,672 and NET 12,516,386 with zero variance; Node passes 42/42 and desktop Chrome QA has zero console, page, request or overflow errors.
**Decision:** Keep row arithmetic additive in the registry and share one type-algebra helper across validator/UI; do not alter the engine or rounding policy. Represent a three-factor formula as two ordinary map nodes, keep derived values runtime-only, and make the anonymized root workbook the only Excel exception to the repository ignore policy.

---
