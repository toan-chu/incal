# Audit

## [2026-07-22 15:52] -- Map arithmetic + penalty automation + FIN handoff -- TECHNICAL PLAN

**Baseline and scope:** Directive 15:41 authorizes exactly one new primitive. Windows baseline before implementation: engine SHA-256 `B60CC43D997560CB74746ED0FA79B98705EFF3907225DBF982261CF0068AE090`; registry SHA-256 `6BBBBA66DD0E643292153950AE0FBFA475A6D8898F13EE1BF20C21C23D96006B`; `node --test` most recently 39/39. `js/core/engine.js`, executors/contracts of the existing 15 primitives (14 original + `map_lookup`), 3 macros and rounding policy are immutable. Registry may change only because `map_arithmetic` is appended.

**Primitive contract:** Add `map_arithmetic` / `Tính cột` as `Table -> Table`. Config is flat and preset-safe: `leftMode/rightMode = field|literal`, `leftFieldId/rightFieldId`, `leftLiteral/rightLiteral`, `leftLiteralType/rightLiteralType`, operator `+|-|*|/`, internal `derivedFieldId`, visible `derivedFieldLabel`. Numeric type algebra is local to this primitive: same-type `+/-`; `Money×Number`, `Money×Percent`, `Number×Number`, and symmetric forms; compatible division yields `Money`, `Number` or `Percent` as appropriate. Validator resolves field types, rejects incompatible operands and literal divisor zero, registers the derived type before downstream validation, and keeps duplicate/collision protection. Executor shallow-clones every input row and writes only the namespaced derived key. Chaining is `map1 Table -> map2 Table`, with map2 selecting map1's derived field; no variadic config or third operand UI is added.

**App/schema integration:** Reuse the derived-field adapter shared with `map_lookup`, generalizing it for both enriching blocks. Internal IDs remain hidden; duplicate node regenerates its derived ID. Settings progressively show either field selector or literal value/type per operand. Node summary uses human labels and operator glyph. Canvas edges still persist only through `node.inputs.table`; preset schema version and old node/operator codes do not change.

**Penalty recipe:** `presets/trustana-q1.json` will replace the imported `Phạt dòng` dependency with two explicit derived steps: `Doanh thu sau thuế × Số tháng` -> `× 1%` -> `Quét + Tổng`. No rounding node is inserted. Acceptance is verified through the actual workbook discover/materialize/run path: penalty `2,676,672`, NET `12,516,386`, delta 0.

**Workbook/privacy plan:** Treat `docs/INPUT-real-TVH.xlsx` as read-only FIN data. Create the distributable root artifact `INPUT-Incentive-mau.xlsx` from it using the spreadsheet runtime: remove only the `Phạt dòng` column, replace employee/customer display names with deterministic generic labels, preserve identifiers, keys, numeric values, sheet order and formatting. Inspect all used ranges and render every sheet before export. `.gitignore` will continue ignoring all `.xlsx` except this exact sanitized root filename. Source FIN workbooks remain untouched and ignored.

**README direction:** A concise Trustana finance handoff page for non-technical FIN users: business outcome first, icon-led 3-step workflow, short concepts for Excel/preset/block/derived column, standard block examples, privacy/offline notes, expected verification numbers and a technical appendix. Use GitHub-native Markdown only; no generated badge/CDN dependency.

**Verification:** Unit tests cover happy path, chained three-factor calculation, immutability/fallback-free execution, type mismatch and divide-by-zero. Existing tests/QA move to the root sample and production preset. Final gates: `node --test`, Chrome 1440x900 + 1280x800, zero console/page/network/overflow, exact penalty/NET, engine hash unchanged, workbook privacy/header scan, artifact-tool inspect/render pass and repo hygiene scan.

**Pre-action note for cleanup:** After all regression and visual evidence is captured, remove only generated/obsolete artifacts: the complete ignored `tmp/` tree (25 QA screenshots/downloads/mismatch fixtures), `docs/INPUT-Incentive_mau.xlsx` (obsolete 8 KB synthetic sample superseded by the sanitized root sample), and `presets/trustana-q1-demo.json` (obsolete 28 KB duplicate demo superseded by `trustana-q1.json`). Why: Directive requires one official sample/preset and no generated test debris before FIN handoff. Blast radius: ignored QA output plus two superseded fixtures; no runtime source, tests, specs, handoff/logs or real FIN workbook. Rollback: move material files to Windows Recycle Bin rather than permanent delete; source versions can be restored, and the root sample/preset remain reproducible from the untouched real workbook plus documented preset. Before cleanup, re-resolve every absolute path and verify it is inside this repo; do not touch `docs/INPUT-real-TVH.xlsx` or `docs/2026Q1_Incentive- (TEST) - Copy.xlsx`.

**Risk/rollback:** Main risk is wrong derived type or anonymization breaking joins. Mitigate with type matrix tests, original-row immutability assertions, exact workbook header/value checks and end-to-end finance delta. Code rollback removes only the new definition/executor/generalized derived adapter; binary rollback restores Recycle Bin items. No CI/CD or production state is touched.

---

## [2026-07-22 15:08] -- Claude update + popup alignment polish -- REPORT

**Done:** Thay toàn bộ glyph popup bằng 5 SVG line icon cùng hệ 18px/1.7 stroke trong well 28px; icon, text, divider và danger state đã căn theo một grid. Popup node/edge dùng một hàm đặt vị trí, clamp dưới sticky topbar và trong viewport/canvas. `Fit` có ngưỡng thu nhỏ riêng 38% để graph rộng không cắt node đầu/cuối, còn zoom tay vẫn giữ clamp 50%-160%. Bổ sung primitive duy nhất `map_lookup` (`Gắn cột tra cứu`) theo acceptance Claude: nhận `Table`, index bảng tra theo khoá, clone từng row, gắn cột phái sinh có type/label/fallback, không mutate workbook row. Derived field được validator và downstream field picker nhận biết; id nội bộ bị ẩn khỏi finance UI và được regenerate khi duplicate node. Library hiện 15 primitive + 3 macro.

**Architecture decision:** Giữ edge/input/preset contract hiện hữu. `map_lookup` chỉ thêm một registry definition + executor và metadata relation/derived-field adapter; không sửa executor của 14 primitive/3 macro cũ. Duplicate lookup key giữ first-row semantics giống block `lookup`. Manual zoom và Fit dùng hai minimum khác nhau để không phá UX 50% của người dùng nhưng vẫn fit được graph demo dài.

**Files changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `js/core/registry.js`, `js/core/validator.js`, `js/core/schema.js`, `test/v3_core.test.js`, `test/formula_canvas.test.js`, `test/v3_acceptance.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.

**Verification:** Windows-native commands on the real checkout:

```text
> node --check js/core/registry.js
> node --check js/core/validator.js
> node --check js/core/schema.js
> node --check js/app.js
> node --check js/ui/formula_canvas.js
> node --check scripts/app_browser_runner.js
Exit code: 0

> node --test
tests 39 | pass 39 | fail 0 | duration_ms 357.291

> npm.cmd run qa
status: pass
blocks: 18
trustanaNets: [11650000, 2880000, 1900000]
contextMenuSvgAligned: true
mapLookupUiVerified: true
viewports: [1440x900, 1280x800]
consoleErrors: 0 | pageErrors: 0 | failedRequests: 0 | horizontalOverflow: 0

> Get-FileHash js/core/engine.js,js/core/registry.js -Algorithm SHA256
engine.js   B60CC43D997560CB74746ED0FA79B98705EFF3907225DBF982261CF0068AE090
registry.js 6BBBBA66DD0E643292153950AE0FBFA475A6D8898F13EE1BF20C21C23D96006B
```

Visual inspection: `tmp/app-qa/formula-context-menu-1440x900.png`, `tmp/app-qa/formulas-1440x900.png`, `tmp/app-qa/formulas-1280x800.png`. Popup rows/icons are optically aligned; Trustana demo and 1280 layout keep graph nodes inside the canvas.

**Open questions for Cowork:** Claude nghiệm static bản cuối theo Directive 10:15 và update 14:17/14:22. Runtime verdict above is Windows-native.

**Risks/known gaps:** Target key trùng dùng row đầu tiên có chủ đích, giống `lookup`; chưa có UI cảnh báo riêng cho duplicate key vì nằm ngoài acceptance hiện tại. Không có CDN/network dependency mới. Engine hash giữ nguyên baseline Claude; registry hash chỉ đổi do primitive được Directive cho phép.

---

## [2026-07-22 14:56] -- Claude update + popup alignment polish -- TECHNICAL PLAN

**Trigger/evidence:** Chairman cung cấp screenshot popup node: menu action còn dùng 5 glyph Unicode khác optical size (`⌘`, `⧉`, `◎`, `↯`, `×`), nên dù CSS grid 22px vẫn nhìn lệch và không cùng visual language. Menu hiện clamp trong canvas nhưng chưa trừ topbar/viewport. Claude vừa sửa rounding core có chủ đích và thêm acceptance `map_lookup` vào Directive; Windows verification trước code: 37/37 pass, engine hash `B60CC43D997560CB74746ED0FA79B98705EFF3907225DBF982261CF0068AE090`, registry hash `2BAD54BE7AAE718704D299271981F7C786A08396B675712450606AE161E2BF70`.

**Primitive architecture:** Thêm một definition mới, không sửa execute contract của 14 primitive + 3 macro cũ. `map_lookup` nhận một input `Table`, config gồm source key field, target table, target key, return field/type, fallback, internal derived id và display label. Executor lập index chuẩn hoá trên target table, shallow-clone từng source row, gắn value/fallback và trả `Table`; input/workbook row bất biến. Validator chỉ mở rộng field map cho derived definition của chính recipe, nên downstream `filter`/`scan_sum` type-check được mà không nới `Any`. UI sinh optgroup `Cột phái sinh` từ node config, không ghi derived field vào workbook schema.

**Popup/layout decision:** Inline SVG 20x20, stroke 1.7, round caps/joins, nằm trong icon well 28x28; row dù grid `28px 1fr`, line-height cố định. Icon dùng semantic shapes: sliders/settings, overlapping cards/duplicate, focus corners, broken link/disconnect, trash/delete. Position menu clamp bằng giao của canvas bounds và viewport safe area dưới sticky topbar. `Tự xếp gọn` tiếp tục auto-arrange rồi fit, nhưng fit cho phép minimum zoom riêng đủ để graph demo không cắt hai đầu; manual zoom vẫn có clamp an toàn.

**Verification:** Hai test primitive (match/downstream + fallback/immutability), static UI contract 15 primitive + 3 macro, browser screenshot/menu bounding-box/icon geometry, auto-arrange fit bounds, full `node --test` và `npm.cmd run qa`. Demo preset/workbook phải giữ NET 11.650.000 / 2.880.000 / 1.900.000. Engine hash phải giữ baseline Claude; registry hash được phép đổi chỉ do primitive mới.

**Risk/rollback:** Rủi ro derived field là va chạm id; dùng id namespaced theo node và duplicate node được regenerate id. Rủi ro duplicate target key: giữ first-row semantics giống `lookup` hiện tại, trace ghi matched rows. Rollback UI độc lập; rollback primitive bỏ duy nhất definition/executor/derived-field adapter và tests. Không có destructive operation.

---

## [2026-07-22 12:56] -- Finance-first minimal UX completion -- TECHNICAL PLAN

**Context:** Chairman chốt nguyên tắc minimalism và cho triển khai sau chuỗi review trực tiếp. Kiểm kê runtime xác nhận `Subject Bridge` và lựa chọn chủ thể đang là hai UI cho cùng `sourceSchema.subjectTableId + preset.bindings`; result table và `xlsx_bke.js` vẫn hardcode COM/KAE/BO/Phạt/Thuế; `.connection-layer { pointer-events:none }` khiến không thể nắm edge trực tiếp; `drawConnections()` return trước khi clear SVG khi recipe rỗng.

**Boundary:** Không sửa `js/core/engine.js`, `js/core/registry.js`, node id, operator code, block implementation hay preset demo. Giữ edge là projection duy nhất từ `node.inputs`. Metadata hiển thị mới là additive: `recipe.meta.presentation = {label, role}` và `node.meta.canvas.width/label`; engine clone snapshot nhưng bỏ qua các field này. Adapter workbook chỉ tiếp tục materialize một subject tại một thời điểm.

**Input/subject decision:** Một selector `Tính cho` ở tab Tính là control duy nhất thay `radio` trên mỗi card. Tab Input chỉ cấu hình sheet; card trùng `subjectTableId` mở một dải định danh gồm `subject.id`, `subject.name`, `subject.group`. `subject.id` đồng thời đồng bộ `keyFieldId`, loại bỏ control khóa trùng. Khi đổi subject, cache mapping theo table trong session/preset metadata nếu có; mapping hợp lệ được phục hồi, nếu chưa có thì chạy `suggestBindings`. Các card khác không hiển thị metadata không có tác dụng trực tiếp. Header trong card dùng raw header; selector chéo bảng mới dùng `Sheet · Header`.

**Canvas decision:** Giữ DOM + SVG offline hiện hữu. Node health dùng một dot cạnh title; selection dùng border tím; kết quả dùng badge/border cam. Bỏ stripe và type text lặp, nhưng giữ type trong `title`, `aria-label` và connection cursor. Whole-card drag loại trừ port/button/input/resize handle. Width clamp 180-420px, height auto, lưu additive metadata. Edge render thành cặp path: visual path + hit path trong suốt 14px. Hover edge hiện endpoint handles; kéo handle reuse trial-validator và atomic reconnect hiện hữu; chuột phải edge ngắt input target. Empty recipe chạy một `resetCanvasTransientState()` để clear SVG, ghost, drag, selection, menu/dialog và camera.

**Macro decision:** `lockedMacro` chỉ đổi nhãn UI thành `Khối dựng sẵn`; không có bypass lock kỹ thuật. Settings cho sửa `node.meta.canvas.label`, tiếp tục sửa config override như hiện tại, và có phần `Công thức` read-only dựng từ input/output/config schema để người dùng hiểu contract. Không unpack hay sửa macro implementation vì vi phạm boundary engine/registry/logic.

**Recipe/result decision:** Recipe có presentation metadata được backfill trong RAM từ `recipe.name` và component role (`penalty` = deduction, `tax` = tax, `adjustment` = adjustment, còn lại income). Toolbar hiển thị label + role; component/output type/delete nằm trong mục nâng cao. Result columns được derive theo thứ tự recipe, gộp component, và lấy value từ `person.components[component]`; deduction/tax hiển thị âm bằng field canonical tương ứng, adjustment giữ dấu, net luôn cuối. Cùng helper presentation cấp nhãn cho output group, XLSX chi tiết và PDF, nên không còn COM/KAE legacy trong code exporter trừ khi chính preset đặt label đó.

**Verification gates:** Unit/static tests phải chứng minh metadata round-trip, subject mapping scope, dynamic result definitions, edge hit/reconnect/empty cleanup và PDF/XLSX labels. Browser runner thực hiện pointer gesture thật cho resize, direct edge reconnect/right-click disconnect, empty recipe cleanup và macro alias. Cuối cùng nạp `presets/trustana-q1-demo.json` + `docs/INPUT-Incentive_mau.xlsx`, NET bắt buộc 11.650.000 / 2.880.000 / 1.900.000; `node --test` và desktop QA 1440/1280 zero console/page/network/overflow; hashes engine/registry khớp baseline.

**Rollback/risk:** Thay đổi UI rộng nhưng data contract additive. Rủi ro lớn nhất là pointer priority giữa node drag/port/resize/edge; xử lý bằng explicit closest guards, pointer capture/document listeners và gesture regression. Export rows động có chiều dài biến đổi, vì vậy style dùng computed row offsets thay index cố định. Không có destructive operation.

---

## [2026-07-22 13:32] -- Finance-first minimal UX completion -- REPORT

**Done:** Tối giản luồng Input -> Công thức -> Tính theo một source of truth. Tab Input không còn radio chủ thể hay metadata sheet thừa; card chủ thể duy nhất chứa ba ánh xạ định danh và selector `Tính cho` nằm ở tab Tính. Formula toolbar gom recipe label/role, giấu component/type/delete dưới `Tuỳ chọn`, đưa `Tự xếp gọn` vào graph. Node kéo được từ toàn card, resize 180-420px có metadata, wrap text, health dot xanh/cam/đỏ, selection tím và result cam. Macro dựng sẵn cho đổi tên instance/config và xem mô tả công thức read-only. Edge có hit path 16px, hover hiện hai tay nắm cam, kéo source/target để reconnect có type/cycle validation, chuột phải để ngắt; xoá recipe cuối clear node/edge/ghost/transient state. Kết quả, nút xuất nhóm, XLSX chi tiết và PDF cùng derive từ `recipe.meta.presentation`; COM/KAE/BO không còn là nhãn UI mặc định, recipe không có deduction/tax thì không sinh cột tương ứng.

**Files changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `js/export/categories.js`, `js/export/xlsx_bk.js`, `js/export/xlsx_bke.js`, `test/v3_acceptance.test.js`, `test/formula_canvas.test.js`, `test/export_regression.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.

**Verification:**

```text
node --check js/app.js js/ui/formula_canvas.js js/export/categories.js
node --check js/export/xlsx_bk.js js/export/xlsx_bke.js scripts/app_browser_runner.js
=> all exit 0

node --test
=> tests 35; pass 35; fail 0

npm.cmd run qa
=> status pass
=> trustanaNets [11650000, 2880000, 1900000]
=> subject selector + per-table mapping restore: pass
=> node drag + resize metadata: pass
=> ghost arrow + invalid type block + cycle block: pass
=> input endpoint retarget + edge source retarget: pass
=> edge right-click disconnect: pass
=> final recipe empty cleanup: pass
=> generic result/export labels: pass
=> Chrome file:// 1440x900 + 1280x800
=> consoleErrors 0; pageErrors 0; failedRequests 0; horizontalOverflow 0

Get-FileHash js/core/engine.js -Algorithm SHA256
=> 5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C
Get-FileHash js/core/registry.js -Algorithm SHA256
=> 587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC
```

Visual QA đã xem trực tiếp `tmp/app-qa/input-1440x900.png`, `formulas-1440x900.png`, `calculate-1440x900.png`, `input-1280x800.png`, `formulas-1280x800.png`, `formula-context-menu-1440x900.png`, `formula-settings-dialog-1440x900.png` và `formula-connection-drag-1440x900.png`. Header/control thẳng hàng, canvas là vùng lớn nhất, card không lặp prefix, text node wrap, menu/dialog nằm trong viewport. Static/runtime test xác nhận không có CDN hay network-capable API; hai URL `xmlns` chỉ nằm trong SVG data URI của local select chevron, không phải network request.

**Open questions for Cowork:** Không. Sẵn sàng Claude nghiệm bản cuối.

**Risks/known gaps:** Desktop-only theo Directive. `recipe.meta.presentation`, `sourceSchema.subjectBindings` và `node.meta.canvas.width/label` là additive metadata; engine bỏ qua. Macro registry/logic vẫn khoá, chỉ instance label/config hiển hữu được sửa. Workspace không có `.git`, nên không có `git diff --check`; syntax, 35 test, Windows Chrome QA, conflict-marker scan và immutable-core hashes là bằng chứng thay thế.

---

## [2026-07-13 15:53] -- Build Incentive Calculator P1-P4 -- REPORT

**Done:** Built offline one-folder incentive calculator from Claude spec: engine E1-E8, parser/validator, BK/BKê/report/tidy exports, UI, local SheetJS/Roboto assets, Q1 golden fixture/reconciliation, and tests.
**Files changed:** `TinhIncentive.html`, `css/app.css`, `js/app.js`, `js/engine/*.js`, `js/export/*.js`, `js/vendor/xlsx.full.min.js`, `assets/fonts/*.ttf`, `config/default.json`, `test/*.js`, `test/golden/*`, `handoff/*`, `log/*`, `memory/*`.
**Verification:** `node --test` passed 11/11. Playwright CLI opened `TinhIncentive.html` from `file://` and captured desktop/mobile screenshots in `output/playwright/`. Q1 reconciliation generated with a=5, b=13, c=0.
**Open questions for Cowork:** Review remaining FIN open items marked `TODO(open-1)`, `TODO(open-2)`, `TODO(open-6)`, and the unpaid penalty source-of-truth behavior.
**Risks/known gaps:** Q1 golden fixture is reduced from legacy Q1 sheets and lacks full payroll/KAM/manual context; numeric parity needs FIN-populated v2 input or expanded extractor. Browser upload smoke was covered by Node parse test plus static Playwright screenshots, not Playwright file-upload interaction.

---

## [2026-07-21 13:21] -- Promote v3 to root and remove obsolete runtime/artifacts -- PRE-ACTION

**What:** Replace the root v2 runtime (`incal-dashboard.html`, `css/`, `js/`, `config/`) with the accepted v3 runtime; remove the obsolete v2 distribution (`dist/`) and generated/non-runtime folders (`output/`, `outputs/`, `reports/`, `test-results/`, `tmp/`) after the promotion. Remove the standalone `v3/` source copy after root verification, retaining only a filesystem compatibility bridge required by the immutable v3 tests.

**Why:** The 13:14 Directive makes root `index.html` the official FIN app and requires a clean repository with no root v2 runtime, stale distribution, real/sample report data, or dangling runtime paths.

**Blast radius:** Runtime and generated artifacts only. `test/`, `handoff/`, `docs/`, `log/`, `memory/`, `.gitignore`, `package.json`, `AGENTS.md`, and root `assets/` are excluded and will not be modified or deleted. v3 engine/recipe/macro source is relocated byte-for-byte; only HTML/CSS shell and local paths may change.

**Rollback path:** `archive/v2-reference-20260721-1314.zip` contains 44 entries from the last root v2 runtime. Its verified SHA-256 is `63A8F07DB6ED776B44487F38FE079CEECBB6AB3B66BAEDAB3DF9DD972B990842`; `archive/RESTORE-v2.md` restores it into a separate folder without overwriting v3.

---

## [2026-07-13 16:45] -- Fill Q1 5-Person Template Fixture -- REPORT

**Done:** Populated root `TEMPLATE_Input-Incentive.xlsx` with a Q1 test fixture for 5 COM Sales: Phạm Thị Thương Hoài, Trần Văn Hiếu, Phạm Trần Hiếu, Lê Thị Hằng, and Kim Thanh Thư. Included 86 jobs, supporting Chốt Quý/Nhân Sự/KAE/KH Mới/Phạt/Config rows, and added `8_DoiChieu_Q1` for direct comparison against Q1 paid figures.
**Files changed:** `TEMPLATE_Input-Incentive.xlsx`, `test/engine.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** Tool engine parsed the filled workbook with 0 schema errors, 0 validation errors, and 0 warnings. Engine output matched Q1 BK values for the 5 selected people. `node --test` passed 15/15.
**Open questions for Cowork:** None for this fixture. Remaining FIN UAT questions stay as previously logged.
**Risks/known gaps:** One duplicate Q1 Job No (`IMHANA26010140`) was suffixed to `IMHANA26010140-DUP2` in the template so the tool's duplicate-job validation can pass; note preserved in `1_Job`.

---

## [2026-07-13 16:34] -- Round 3 BO Negative GP Fix -- REPORT

**Done:** Fixed BO/thử việc incentive aggregation to include negative `gpTinh` instead of flooring job losses to zero. Added regression coverage and documented FIN UAT steps.
**Files changed:** `js/engine/commission.js`, `test/engine.test.js`, `test/golden/q1_recreated_input.json`, `test/golden/RECONCILIATION.md`, `handoff/todo.md`, `handoff/HANDOFF-codex-done.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** Regenerated Q1 reduced fixture and ran `node --test`: 15 tests passed, 0 failed.
**Open questions for Cowork:** UAT with FIN should replace reduced fixture and close KAM KPI, Spring split, open-6 Chi phí/COM, and open-7 unpaid penalty source.
**Risks/known gaps:** Real parity still depends on FIN entering full Q1 into template v2; reduced fixture remains intentionally incomplete.

---

## [2026-07-13 16:14] -- Claude R1 Fixes -- REPORT

**Done:** Applied all four Claude R1 fixes: BK-style configurable PIT, paid/partial negative-GP inclusion, B2 pro-rate by worked months, and component-level reconciliation with class `(d) fixture gap`. Added BKê PDF print-to-PDF export path for Sales payslip attachments.
**Files changed:** `js/engine/common.js`, `js/engine/tax.js`, `js/engine/commission.js`, `js/engine/assemble.js`, `js/engine/parse.js`, `js/app.js`, `js/export/xlsx_bke.js`, `config/default.json`, `TinhIncentive.html`, `test/engine.test.js`, `test/golden/extract_q1.py`, `test/golden.test.js`, `test/golden/RECONCILIATION.md`, `handoff/HANDOFF-codex-done.md`, `handoff/todo.md`, `log/history.md`.
**Verification:** `node --test` passed 14/14. Q1 reconciliation regenerated with `a=20, b=10, c=0, d=13`. Playwright CLI captured R2 desktop/mobile file screenshots in `output/playwright/r2-desktop.png` and `output/playwright/r2-mobile.png`.
**Open questions for Cowork:** Confirm whether print-to-PDF BKê is enough, or whether FIN needs true one-click generated PDF files per person with an added PDF library.
**Risks/known gaps:** Tax/net class `b` remains because Q1 BK payroll/tax behavior is not fully represented in the reduced fixture. Non-COM rows are class `d` until KAM/BO/Sale khác/manual fixture inputs are modeled.

---

## [2026-07-13 17:04] -- Destructive cleanup pre-action

**What:** Remove local VCS/agent metadata folders (.git, .agents, .codex) and root-level stale Excel backups; rename the current root sample workbook to a standard non-versioned template name.
**Why:** User requested internal-only distribution without git history/agent metadata and without extra Excel clutter that could leak incentive formulas or confuse FIN testing.
**Blast radius:** Only root metadata/cache folders and root backup/sample workbook names. Source/audit documents under docs/ are retained. App/runtime/source files are retained.
**Rollback path:** No git rollback after deleting .git; rollback for Excel root workbook is via retained docs/ source files and current sample content before deletion/rename. If needed, recreate git with git init later.

---

## [2026-07-13 17:16] -- Solo Cleanup And Export Polish -- REPORT

**Done:** Removed local git/agent metadata and root Excel clutter; standardized the root sample as `TEMPLATE_Input-Incentive.xlsx`; clarified in-app meanings for BK, BKe, tidy, and report JSON; stated that browser settings do not overwrite Excel; polished the UI with rounded panels, hover states, animation, and orange accents; added styled XLSX exports; added Trustana logo to the BKe PDF print layout; documented quarterly report JSON archiving.
**Files changed:** `TinhIncentive.html`, `css/app.css`, `js/export/xlsx_bk.js`, `js/export/xlsx_bke.js`, `js/export/report.js`, `js/vendor/xlsx-js-style.bundle.js`, `reports/README.md`, `test/engine.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`, `TEMPLATE_Input-Incentive.xlsx`.
**Verification:** Root now has no `.git`, `.agents`, or `.codex` directories and only one root Excel workbook. `npm test` passed 15/15. Browser smoke confirmed `window.XLSX=true`, template load, result render, and successful downloads for `BK_Q1-2026.xlsx`, `BKe_Q1-2026.xlsx`, `tidy_Q1-2026.xlsx`, and `report_Q1-2026.json` with no page errors. Exported BK workbook contains `xl/styles.xml`.
**Open questions for Cowork:** None; this was user-approved solo execution.
**Risks/known gaps:** Browser print-to-PDF opens the print dialog with logo rather than silently writing PDF files, because silent PDF generation would require a heavier PDF library or a packaged runtime.

---

## [2026-07-13 17:25] -- Multi-Report JSON History Charts -- REPORT

**Done:** Added an offline `Lich su report JSON` section that accepts multiple quarterly `report_*.json` files, aggregates YTD totals, renders metrics, draws Canvas charts for total net pay by quarter and top people YTD, and shows a top-person table. Added `js/engine/history.js` for quarter normalization and aggregation plus report workflow docs.
**Files changed:** `TinhIncentive.html`, `css/app.css`, `js/app.js`, `js/engine/history.js`, `test/history.test.js`, `reports/README.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** `npm test` passed 16/16. Browser smoke uploaded two temp report JSON files, confirmed the history panel rendered two rows, chart canvases had painted pixels, desktop/mobile had no page errors, and mobile had no page-level horizontal overflow.
**Open questions for Cowork:** None.
**Risks/known gaps:** This is a read-only dashboard over downloaded JSON files; it does not persist a yearly database by itself.

---

## [2026-07-14 09:36] -- Dashboard Toggle And Export UX Polish -- REPORT

**Done:** Moved JSON history into a top `INCENTIVE / DASHBOARD` toggle, rebuilt Dashboard as a Power-BI-style mini builder with sidebar fields, chart controls, default cards, and chart remove/wide actions. Renamed exports, moved JSON export to a bottom `EXPORT DATA` action with timestamped `DATA_<quarter>_<timestamp>.json` filename, added per-person `PDF` buttons instead of a single long PDF, aligned result-table columns, added footer credit lines, and updated report storage docs.
**Files changed:** `TinhIncentive.html`, `css/app.css`, `js/app.js`, `js/engine/history.js`, `js/export/report.js`, `js/export/xlsx_bke.js`, `test/history.test.js`, `reports/README.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** `npm test` passed 16/16. Browser smoke loaded the sample workbook, calculated results, confirmed 5 per-person PDF buttons, opened one PDF popup containing only `Phạm Thị Thương Hoài`, downloaded timestamped `DATA_Q1-2026_20260714_093637.json`, imported two JSON files into Dashboard, rendered 4 default chart cards with painted canvas pixels, and found no page errors or horizontal overflow.
**Open questions for Cowork:** None.
**Risks/known gaps:** Dashboard is a local read-only chart builder over imported JSON files; it does not save custom chart layouts between browser sessions yet.

---

## [2026-07-14 09:54] -- Port Imetrik Visual System -- REPORT

**Done:** Ported the imetrik visual language into the incentive calculator: offline Be Vietnam Pro and JetBrains Mono fonts, Trustana purple/orange tokens, compact topbar, pill toggle, button style, upload zones, metric cards, tables, dashboard sidebar, chart builder, and chart action controls. Updated Canvas chart text to use Be Vietnam Pro so charts match the UI.
**Files changed:** `css/app.css`, `js/app.js`, `assets/fonts/*.woff2`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** `npm.cmd test` passed 16/16. Playwright smoke opened `TinhIncentive.html` from `file://`, loaded `TEMPLATE_Input-Incentive.xlsx`, calculated results, imported `reports/report_Q1-2026.json` into Dashboard, found no console/page errors, and confirmed no horizontal overflow on 1440px desktop or 390px mobile.
**Open questions for Cowork:** None.
**Risks/known gaps:** This is a visual/style port only; it does not add persistent saved dashboard layouts.

---

## [2026-07-14 10:01] -- HR Distribution Package -- REPORT

**Done:** Built a clean HR/FIN distribution folder and zip under `dist/Trustana-Incentive-Tool-20260714-1000`. The package includes only the offline app, current input template, required CSS/JS/vendor bundle, logo, active `.woff2` fonts, reports README, and a quick user guide. It excludes dev/audit/source material and Q1 sample data.
**Files changed:** `dist/Trustana-Incentive-Tool-20260714-1000/**`, `dist/Trustana-Incentive-Tool-20260714-1000.zip`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** Playwright smoke opened packaged `TinhIncentive.html` from `file://`, loaded packaged `TEMPLATE_Input-Incentive.xlsx`, calculated results, found 5 per-person PDF buttons, imported a JSON report into Dashboard, found no console/page errors, and found no horizontal overflow. Zip created successfully at 473,819 bytes.
**Open questions for Cowork:** None.
**Risks/known gaps:** Source tree still keeps dev/test/audit files for maintainability; distribute the zip/folder under `dist`, not the repo root.

---

## [2026-07-20 14:35] -- [AUTO] Reverse-engineer FIN workbook and design Config Studio -- REPORT

**Done:** Inspected all 13 workbook sheets and formulas; reconstructed the dependency graph from `(1)` historical KAE data through `(10)` BK and the three payslip sheets; read all 9 policy pages, the completed FIN checklist, RTF process note, theory and blueprint; audited current config/validation/engine behavior; classified data, config, derived values and overrides; designed the Config Studio layout and versioned policy flow.
**Files changed:** `handoff/todo.md`, `handoff/audit.md`, `log/history.md`. A requested durable memory update was added outside the repo at `%USERPROFILE%\.codex\memories\extensions\ad_hoc\notes\2026-07-20T1435-incentive-workbook-map.md`.
**Verification:** Workbook profile output accounted for 13 sheets, including 1,443 formulas in `job quy (5)`, 126 in `KQ Sale. (7)`, 53 in `KQ.KAE (8)`, 31 in `KQ. Sale khác (9)`, and 65 in `BK 10`. Formula-edge aggregation showed the dominant links `job quy (5) -> KH mới từ Q1(3)` (691), `job quy (5) -> List KAE (2)` (346), `KQ Sale. (7) -> job quy (5)` (212), and `List KAE (2) -> KAE trước (1)` (66). Error scan found 345 `#REF!` formulas in the job validation residue, 51 in the new-customer residue, and broken payslip lookups; these were treated as source defects, not intended rules. Current-code search confirmed global `MISSING_GROSS`, partial-payment GP proration, unresolved KAM/Spring/cost/penalty assumptions, and the no-family-deduction PIT branch returning zero.
**Open questions for Cowork:** Partial-payment eligibility; KAM day versus month proration and KPI gate; PIT flat-10-percent branch; whether job cost includes COM; unpaid-month origin; Spring allocation mode.
**Risks/known gaps:** No implementation was made. The proposed layout is ready for product approval, but the listed business decisions must remain explicit Draft settings until FIN/BGD approves them.

---

## [2026-07-20 15:43] -- [AUTO] Close Blueprint v2 and new-task handoff -- REPORT

**Done:** Created `BLUEPRINT_v2_Config-Studio.md` with all final business decisions, canonical workspace/policy architecture, calculation-profile behavior, implementation phases and acceptance tests. Created a copy-ready new-task prompt that directs Codex to implement the blueprint without repeating discovery. Verified current `/compact` behavior from the Codex manual before recommending the transition path.
**Files changed:** `docs/spec/BLUEPRINT_v2_Config-Studio.md`, `handoff/PROMPT_CHAT_MOI_Config-Studio.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** Blueprint exists at 13,902 bytes / 412 lines and contains policy `DRAFT/ACTIVE/INACTIVE`, `appliesFromQuarter`, monthly-weight assignments, AE routing, KAE/Project/Tax rules, phased implementation and 14 acceptance tests. Handoff prompt exists at 2,774 bytes / 44 lines and names the exact blueprint, project path, verification commands and distribution boundary. `rg` checks resolved every required section and instruction.
**Open questions for Cowork:** None. Business discovery has no implementation blocker.
**Risks/known gaps:** `/compact` retains a generated summary rather than every verbatim detail; implementation should treat the v2 blueprint and current files as source of truth even if the same task is compacted.

---

## [2026-07-20 16:31] -- [AUTO] Implement Blueprint v2 Config Studio -- VERIFICATION BLOCKER

**Completed evidence so far:** Canonical workspace/policy/profile engine and Config Studio UI are implemented. `npm.cmd test` passes 38/38 (`pass 38`, `fail 0`), including acceptance cases 1-13, workspace migration/roundtrip, legacy Excel adapter parity, offline DOM/module contract and BK/BKe/PDF/job export regression. `node --check` passes for `js/app.js`, `js/engine/policy.js`, `js/engine/workspace.js`, `js/engine/profiles.js` and `js/engine/calculator.js`. Null-byte scan reports `none`. Runtime search output: `PASS: no eval/new Function in runtime or tests`.
**Blocked gate:** Acceptance test 14 requires a real browser opened directly from `file://`. The available Playwright CLI returned `Access to "file:" protocol is blocked`; the Codex in-app Browser independently rejected the same URL under its URL security policy and explicitly prohibited alternate browser/localhost workarounds.
**Impact:** Source implementation and automated regression are complete, but frontend visual/interaction/console/overflow QA is not proven on the current v2 UI. Per blueprint, `dist` has not been rebuilt and no completion REPORT/history entry has been written.
**Required continuation:** Run the manual `file://` smoke at 1440x900, 1280x800, 390x844 and 360x740; confirm direct entry, Workspace JSON, policy clone/activate, calculation, BK/BKe/PDF/job/report exports, Dashboard import, console/network and page overflow. Once that evidence is available, rebuild the clean HR package, smoke the packaged HTML, append the final REPORT and history entry.

---

## [2026-07-20 16:34] -- Generated PDF render cleanup pre-action

**What:** Remove only `tmp/pdfs/policy-1.png` through `policy-9.png`, nine generated page renders used to visually inspect the source policy PDF.
**Why:** These 6-9 MB review intermediates are not application source, test evidence or distribution output.
**Blast radius:** Only `C:\Users\RYAN TOAN\Downloads\TRUSTANA\FIN\incentive-calculator\tmp\pdfs`; the original policy PDF and all project/application files remain untouched.
**Rollback path:** Re-render the original 9-page policy PDF into `tmp/pdfs` with the PDF inspection workflow.
**Execution result:** Cleanup command was rejected by the execution policy before running; the nine generated PNG files remain present and no file was deleted.

---

## [2026-07-20 16:55] -- Sample kit support-file cleanup pre-action

**What:** Remove only `outputs/019f7eb3-9464-7f63-8fc4-89f54f30b8d6/Beginner-Test-Kit/SAMPLE_Input_Q1-2026.xlsx.inspect.ndjson`.
**Why:** The spreadsheet runtime created this 226 KB inspection trace automatically; it is QA support data, not part of the three-file beginner kit.
**Blast radius:** One generated NDJSON trace. The final Excel, Workspace JSON and Vietnamese guide remain untouched.
**Rollback path:** Re-run the artifact-tool workbook verification to regenerate the trace.

---

## [2026-07-20 16:56] -- [AUTO] Create Config Studio beginner test kit -- REPORT

**Done:** Created a three-file beginner test kit derived from selected Q1 legacy rows: a compact parser-compatible Excel workbook with 8 readable sheets and validation lists, a canonical schema v2 Workspace JSON containing the same 3 employees/7 jobs plus snapshots, and a plain-language Vietnamese guide covering Workspace-first and Excel-import flows. Added regression tests for both entry paths, the Unpaid penalty edge and rule-aware missing-salary behavior.
**Files changed:** `outputs/019f7eb3-9464-7f63-8fc4-89f54f30b8d6/Beginner-Test-Kit/SAMPLE_Input_Q1-2026.xlsx`, `outputs/019f7eb3-9464-7f63-8fc4-89f54f30b8d6/Beginner-Test-Kit/SAMPLE_Workspace_Q1-2026.json`, `outputs/019f7eb3-9464-7f63-8fc4-89f54f30b8d6/Beginner-Test-Kit/HUONG_DAN_SU_DUNG.md`, `test/sample_kit.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** Artifact-tool inspection found exactly 8 sheets (`BAT_DAU`, `1_Job`, `2_ChotQuy`, `3_NhanSu`, `4_KAE`, `5_KHMoi`, `6_PhatNoXau`, `7_Config`) and zero formula-error matches. All 8 rendered sheet previews were visually inspected; wrapped headers/data are readable. Parser/engine evidence: `schemaErrors: 0`, `validationErrors: 0`, `warnings: 0`, 3 employees, 7 jobs. Excel and JSON roundtrip both produce gross incentive 1,512,837 VND, penalty 500,000 VND, tax 101,283 VND and net pay 911,554 VND. `node --test test/sample_kit.test.js` passed 2/2; `npm.cmd test` passed 40/40 with fail 0.
**Open questions for Cowork:** None.
**Risks/known gaps:** This kit is intentionally simplified training data. KAE/BO profile mapping demonstrates v2 behavior and must not be treated as approved payroll truth. The separate Blueprint v2 browser `file://` acceptance gate remains open; this artifact task does not claim to close it.

---

## [2026-07-21 08:56] -- [AUTO] Drag-and-drop calculator discovery and formula handoff -- REPORT

**Done:** Produced a Chairman/Claude review packet recommending a beginner-first `RUN CALCULATOR` plus a typed vertical `RULE RECIPE BUILDER`. Defined the block type system, `% OF base` contract, safe JSON rule graph, validation/activation gates, trace model, migration path and proposed v3 acceptance criteria. Consolidated the full known formula foundation from the 13-sheet Q1 workbook, theory, Blueprint v1/v2, current config, canonical engine, retained legacy helpers and regression evidence. Separated V2, XLS, V1, CODE and REVIEW behavior rather than silently resolving conflicts.
**Files changed:** `handoff/REVIEW-PACKET_Drag-Drop-Calculator.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** Review packet is 1,294 lines / 44,771 bytes. A section/keyword coverage script passed all 23 required checks: Run Mode, Recipe Builder, typed percent base, Cost/GP, Payment, Routing, Profiles, Target, B2, Waterfall, Manager, KAE, Direct, Project, Penalty, Tax, Assemble, workbook aggregation, parameters, data theory, safety, review questions and acceptance criteria. Rate/source search found all known defaults and historical variants. `npm.cmd test` passed 40/40 with fail 0. Artifact-tool inspection reconfirmed the 13-sheet workbook formula patterns used in the catalog.
**Open questions for Cowork:** Review the 14 decisions in section 10 of the packet. Highest priority: XLS/CODE Level 3 waterfall behavior versus a pure remaining-target waterfall; BK flat fallback `taxableIncome x 10%` versus canonical CODE `incentiveBeforeTax x 10%`; and whether the product uses vertical recipes as the primary editor or a full node canvas.
**Risks/known gaps:** No application source or closed blueprint was changed. Current repo retains canonical v2 calculation plus directly testable v1 helper formulas with contradictory historical behavior; Recipe Builder should not be implemented until one executable formula registry/version contract is selected. Existing v2 browser `file://` QA blocker remains unrelated and open.

---

## [2026-07-21 09:12] -- [AUTO] Prepare Claude review prompt -- REPORT

**Done:** Created a copy-ready Claude/Cowork prompt that routes review through the completed drag-and-drop review packet, requires product/UX, typed rule architecture, formula completeness and a 14-item decision matrix, and explicitly prevents implementation or modification of closed blueprints before Chairman decisions.
**Files changed:** `handoff/PROMPT_CLAUDE_REVIEW_Drag-Drop-Calculator.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.
**Verification:** Prompt names the exact workspace, primary review packet, source reading order, required output file, audit REVIEW entry, three highest-priority formula conflicts, runtime jurisdiction and all no-implementation boundaries.
**Open questions for Cowork:** None; use the prompt as written for the next review task.
**Risks/known gaps:** Claude review and Chairman decisions have not happened yet. The prompt does not authorize Blueprint v3 or implementation.

---

## [2026-07-21 12:27] -- [AUTO] Incentive Calculator v3 -- TECHNICAL PLAN

**Directive contract:** Build the new offline v3 under `v3/` only. The existing v2 runtime, tests, distribution and source data remain frozen references. No real employee/payroll/customer data, no real Trustana formula preset, no emulation of hardcoded `-210,483,804` or `#REF!`, and no external file/network links.

**Architecture decision:** Use a static UMD application that runs from `file://` with no build step. Layers are `core/schema` -> `core/registry` -> `core/validator` -> `core/interpreter` -> `adapters/xlsx` and `adapters/storage` -> `exports` -> `ui`. Recipe Graph JSON is the sole executable source. UI labels resolve through stable field ids; calculations never bind by display header. No `eval`, `new Function`, dynamic script loading or call into either v2 formula path.

**Unified registry decision:** Create one v3 `BlockRegistry` containing the 14 primitive definitions and 3 parameterized domain macros. Each entry owns id, input ports, output type, config validation, dependency extraction and deterministic executor. Recipe nodes reference registry ids only. Validator builds the node dependency graph, type-checks ports, rejects divide-by-zero constants and missing bases, then topologically sorts or reports one cycle error. v1/v2 functions are evidence for ports/fixtures only; none remain executable in v3.

**Data and field contract:** Field catalog records `id`, display `label`, type, table and input/derived role. Recipes consume stable ids. Excel template generation walks active recipe dependencies, keeps only external INPUT fields, orders them by field catalog and writes a hidden metadata sheet with schema version, recipe id/version and deterministic field-set fingerprint. Import requires the same fingerprint and exact header-id mapping. Manual adjustments are explicit Money input rows with reason; no opaque constants.

**Roster persistence:** Persist the small canonical roster/field-label state in `localStorage` under a versioned v3 key, because acceptance requires close/reopen on the same local app path and the payload is well below quota. Add explicit roster JSON Import/Export as backup and portability path. Storage failures are surfaced without destroying in-memory edits. Roster is not copied into period Excel job input.

**P0:** Create isolated v3 scaffold and data guards; local branding/assets; schema, field catalog, unified registry, validator/toposort/interpreter; empty preset only; automated registry/security tests. This removes formula ambiguity before UI work.

**P1:** Build roster paste/edit/persist; full vertical builder with 14 primitives + 3 macros; label editing; exact-column Excel generation/import; deterministic run and trace component -> job -> block; synthetic tests for mismatch/divide-zero/cycle, label invariance and column dependencies.

**P2:** Complete the four-tab responsive UI; adapt v2 export shapes into isolated v3 export modules for BK, BKê COM/Khác/BO, print-to-PDF/person, Job JSON and Report JSON; add multi-report Dashboard; run file/browser QA and package-local smoke.

**Library decision:** Reuse only copied local assets and the already-vendored SheetJS bundle inside `v3/`. Use native HTML5 drag/drop and Canvas; add no package manager or CDN dependency. Copy/adapt export and font/brand assets so v3 has no runtime link to v2 files.

**Verification contract:** Unit tests cover happy/edge paths for every high-risk boundary. Browser QA must exercise `file://` at 1440x900, 1280x800, 390x844 and 360x740 with console/network/overflow checks. The required `docs/spec/TEST-SCENARIO_v3.md` is absent from the current checkout (confirmed by direct path read and repository-wide search at plan time), so numeric delta=0 is an explicit open acceptance gate; Codex will not invent expected numbers. All other work proceeds now.

**Discovered scope:** Root contains historical real/sample XLSX and `docs/origin`, and the workspace has no `.git` directory. They belong to frozen v2/reference history and will not be deleted or modified. A root `.gitignore` will prevent future Git inclusion of sensitive XLSX/origin/report paths; v3 itself contains no real data.

---

## [2026-07-21 12:49] -- Superseded browser spec cleanup pre-action

**What:** Remove only `test/v3_browser.spec.js`, the first QA harness that depends on unavailable `@playwright/test`/`playwright/test` runner modules.
**Why:** The same `file://` workflow is now covered by the passing standalone `test/v3_browser_runner.js` using the locally cached Playwright browser API and installed Chrome. Keeping the non-runnable spec would create a false test failure during broad discovery.
**Blast radius:** One newly created v3-only test file. No v2 source/test/runtime file and no QA screenshots are affected.
**Rollback path:** Recreate the runner-style assertions from `test/v3_browser_runner.js`; it contains the same and expanded workflow checks.

---

## [2026-07-21 12:58] -- [AUTO] Incentive Calculator v3 -- REPORT

**Done:** Dựng app v3 độc lập tại `v3/index.html` với 4 tab; roster paste/edit/persist; builder vertical drag-drop; một registry duy nhất gồm 14 primitive + 3 macro khoá cấu trúc/mở tham số; validator type/divide-zero/cycle; stable field id + editable label; Excel dependency generator có hidden metadata/fingerprint; importer chuẩn hoá enum và chặn template lệch; interpreter deterministic + trace component -> job -> block; BK, BKê-COM/Khác/BO, PDF/người, Job JSON, Report JSON; Dashboard nhiều kỳ. Chỉ ship preset rỗng và synthetic test data trong runtime QA; không có dữ liệu/preset Trustana thật.

**Files changed:** `.gitignore`, `v3/**`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `scripts/v3_browser_runner.js`, `memory/semantic/v3-runtime.md`, `handoff/todo.md`, `handoff/audit.md`, `log/failure.md`, `log/history.md`.

**Technical decisions:** v3 là static UMD self-contained chạy `file://`; chỉ copy local fonts/logo/SheetJS/export code vào namespace v3, không runtime-link hay sửa v2. Roster dùng versioned `localStorage` vì payload nhỏ và acceptance cần reload cùng file, kèm roster JSON backup/portability. Recipe Graph JSON là executable truth; `BlockRegistry` là đường tính duy nhất. Excel input gom đúng external INPUT dependency và tự thêm `job.id` cho trace; nếu dùng điều chỉnh/phạt thì tự thêm `job.adjustment_reason`. Branding tách qua `branding.json`/local branding adapter.

**Verification:** Windows-native outputs:

```text
> node --test test/v3_core.test.js test/v3_acceptance.test.js
tests 14
pass 14
fail 0
```

```json
{
  "status": "pass",
  "url": "file:///C:/Users/RYAN%20TOAN/Downloads/GIT/incal/v3/index.html",
  "tabs": 4,
  "blocks": 17,
  "rosterPersisted": 20,
  "jobs": 1,
  "netPay": 9600000,
  "reportFiles": 2,
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0
}
```

```text
PASS: no eval/new Function/#REF/hardcoded -210483804/network URL in v3 runtime/content
PASS: no known real employee/customer names in v3
PASS JSON: v3\branding.json
PASS JSON: v3\presets\empty-preset.json
V3 files: 37
TEST-SCENARIO exists: False
```

`npm.cmd test` broad regression result is `tests 51, pass 48, fail 3`. All three failures are frozen v2 tests reading root files already absent in this checkout: `TEMPLATE_Input-Incentive.xlsx` (A13 and P3) and `TinhIncentive.html` (`ui_contract.test.js`). v2 runtime timestamps remain before this Directive (2026-07-13/20); Codex did not restore or modify v2 to make these pass.

**Open questions for Cowork:** Cung cấp artifact `docs/spec/TEST-SCENARIO_v3.md` đã được Directive nêu. Khi file có mặt, chạy numeric parity gate và điền delta từng expected value.

**Risks/known gaps:** Acceptance numeric `lệch = 0` chưa thể chứng minh vì source scenario không tồn tại; đây là gate duy nhất của v3 chưa đóng. Real Trustana preset chưa dựng đúng out-of-scope, nên browser QA dùng formula/roster/job synthetic. Broad v2 regression vẫn đỏ do hai artifact v2 root thiếu sẵn; không phải regression v3.

---

## [2026-07-21 13:09] -- REVIEW (Claude/CEO): Nghiệm thu v3 build + đóng gate "lệch = 0"

**Verdict: ĐẠT.** Gate cuối (numeric parity) đã đóng.

**Hậu kiểm tĩnh (đọc source, không tin REPORT mù):**
- Registry: 14 primitive + 3 macro khoá; một registry, không gọi engine v1/v2. Waterfall khớp **nhánh đặc biệt L3** (trừ toàn target khi chưa bậc nào thưởng) + điều chỉnh ±1% chỉ áp L2/L3; **thuế 2 nhánh** (lũy tiến/khoán) đúng BK 10; **pool** (5%+2%)/đầu người đúng.
- Validator đủ 3 chốt: TYPE_MISMATCH · DIVIDE_BY_ZERO (arithmetic `/` + kae_pool count) · CYCLE (topo-sort) + missing-input/output-type; khoá Save theo `valid`.
- Bind cột↔khối bằng field id (read fallback last-segment), KHÔNG dò header text. Normalize bỏ dấu + lowercase.
- Chạy lại độc lập: core+acceptance = 14/14 pass.

**Gate "lệch = 0" (đóng):**
- Cấp `docs/spec/TEST-SCENARIO_v3.md` + `test/v3_scenario.test.js`.
- Kịch bản synthetic 3 người phủ COM waterfall + BO flat-tax + KAE pool + phạt + thuế 2 nhánh + làm tròn.
- Engine tái tạo **đúng số tính tay, lệch = 0** (per-person + totals). Toàn suite v3 = **15/15 pass**.
- Số chốt: E-01 net 11.650.000 · E-02 net 2.880.000 · E-03 net 1.900.000 · tổng net 16.430.000.

**Finding (preset-phase, không chặn):** recipe chạy độc lập, không tham chiếu chéo → recipe thuế phải tính lại base (dup node). Cân nhắc bước "gộp component → rồi thuế" khi dựng preset Trustana thật.

**v2 regression 48/51:** 3 lỗi thuộc v2 (thiếu `TEMPLATE_Input-Incentive.xlsx`, `TinhIncentive.html`) — không phải regression v3, v2 đóng băng out-of-scope. Chấp nhận.

**Còn treo (không chặn):** số Trustana thật chưa dựng — đúng out-of-scope Directive, là preset-phase kế tiếp (Claude dựng preset → reconcile file Excel thật).

---

## [2026-07-21 13:35] -- Đưa v3 ra root, dọn repo, khoác vỏ cũ -- REPORT

**Done:**
- Đưa app đã nghiệm thu ra `index.html` ở root; runtime chính còn một đường `js/core` + `js/adapters` + `js/export`, không còn HTML/config/`js/engine` v2 ở root.
- Khoác shell cũ lên UI v3: topbar trắng sticky, logo Trustana gốc, Be Vietnam Pro + JetBrains Mono local, pill navigation, tím `#4d148c`, cam `#ff6200`, card/shadow/table/dropzone và footer quen thuộc. Giữ nguyên 4 tab và builder 3 cột; mobile chuyển thành luồng dọc.
- Dọn `dist/`, `output/`, `outputs/`, `reports/`, `test-results/`, `tmp/` và runtime v2 khỏi root bằng Windows Recycle Bin. Root `assets/`, `test/`, `docs/`, `log/`, `memory/`, `.gitignore` không bị sửa.
- Lưu v2 trước cutover vào `archive/v2-reference-20260721-1314.zip` và viết `archive/RESTORE-v2.md`.
- Vì guardrail cấm sửa `test/` trong khi 15 test hiện vẫn require/read `v3/...`, giữ bridge test-only không nhân đôi source: `v3/js` và `v3/presets` là junction tới root; `v3/index.html` là hardlink tới root. Runtime/browser/scripts không tham chiếu đường dẫn `v3/`.

**Technical decisions:** Chọn ZIP archive thay git tag vì checkout không có `.git`; ZIP tự chứa đúng last v2 runtime và có hash độc lập. Giữ layout nghiệp vụ v3 (builder/trace/dashboard) nhưng port visual system cũ thay vì quay lại information architecture v2. Engine, recipe và macro được relocate byte-for-byte; chỉ UI shell, branding text và runner path đổi. Compatibility bridge dùng filesystem link vì `test/` là immutable và cách này giữ một executable source duy nhất.

**Files changed:** Root `index.html`, `css/app.css`, `js/**`, `branding.json`, `presets/empty-preset.json`, `README.md`; `scripts/v3_browser_runner.js`; `archive/v2-reference-20260721-1314.zip`; `archive/RESTORE-v2.md`; test-only bridge `v3/`; `handoff/audit.md`. Removed root v2/runtime/generated folders listed above. No `test/`, brand asset, engine logic, recipe logic, macro logic, real data or real Trustana preset was changed.

**Verification:** Windows-native outputs:

```text
Cutover integrity
RootIndex           : True
CoreFiles           : 11
CoreHashMismatches  : 0
BrandFiles          : 21
BrandHashMismatches : 0
```

```text
> node --check js/app.js
> node --check js/branding.js
> node --test test/v3_core.test.js test/v3_acceptance.test.js test/v3_scenario.test.js
tests 15
pass 15
fail 0
```

```json
{
  "status": "pass",
  "url": "file:///C:/Users/RYAN%20TOAN/Downloads/GIT/incal/index.html",
  "tabs": 4,
  "blocks": 17,
  "rosterPersisted": 20,
  "jobs": 1,
  "netPay": 9600000,
  "reportFiles": 2,
  "brand": {
    "font": "Be Vietnam Pro",
    "primary": "#4d148c",
    "accent": "#ff6200",
    "logoLoaded": true,
    "topbar": "rgb(255, 255, 255)",
    "activeTab": "rgb(77, 20, 140)"
  },
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0
}
```

```text
PASS authored runtime grep: 0 eval/new Function/#REF!/legacy hardcoded amount/network URL
PASS all JS network API grep: 0 network-capable calls
PASS: 0 dangling v3 path in runtime/scripts
TinhIncentive=False; IncalDashboard=False; LegacyEngine=False
HTML refs=16; missing=0; networkRefs=0
```

```text
v2 archive SHA-256: 63A8F07DB6ED776B44487F38FE079CEECBB6AB3B66BAEDAB3DF9DD972B990842
entries: 44
incal-dashboard.html: present
js\engine\calculator.js: present
brand logo: present
restore guide: present
```

Screenshots ở cả bốn viewport và các màn roster/builder/dashboard đã được xem trực tiếp; QA artifacts sau đó được đưa vào Recycle Bin để root cuối không giữ `tmp/`.

**Cách khôi phục v2:** Chạy `Expand-Archive -LiteralPath .\archive\v2-reference-20260721-1314.zip -DestinationPath .\restored-v2 -Force`, rồi mở `.\restored-v2\incal-dashboard.html`. Không giải nén đè lên root v3. Có thể đối chiếu hash trước bằng `Get-FileHash` với SHA-256 ở trên.

**Open questions for Cowork:** None.

**Risks/known gaps:** Bridge `v3/` là test compatibility dành cho checkout Windows hiện tại; FIN không dùng bridge này và luôn mở root `index.html`. Các artifact đã dọn còn có thể phục hồi từ Windows Recycle Bin; v2 còn có archive độc lập. Thư viện SheetJS vendored chứa chuỗi XML namespace/license URL nội bộ nhưng runtime không có network API và browser ghi nhận 0 request lỗi/0 network dependency.

---

## [2026-07-21 13:41] -- Remove test bridge and agent metadata -- PRE-ACTION

**What:** Sau khi sửa test sang root và chứng minh 15/15 pass, gỡ ba filesystem link trong `v3/` rồi xóa thư mục rỗng. Đưa root `AGENTS.md` và toàn bộ project `memory/` (gồm cả `memory/source/README.md`) vào Windows Recycle Bin theo chỉ đạo trực tiếp của Chairman.

**Why:** Test phải chạy trên app chính thức ở root, không qua compatibility path. `AGENTS.md` hiện chỉ là stub 47 byte (`Imported Claude Cowork project instructions`); project `memory/` chỉ chứa 4 agent-journal Markdown files tổng 1,071 byte và không có runtime dependency.

**Blast radius:** Ba test v3, browser runner/README/package test command và agent-only metadata. Root `index.html`, `js/`, `presets/`, `assets/`, engine/recipe/macro, business data, `docs/`, `handoff/`, `log/`, `archive/` không thuộc target xóa.

**Rollback path:** `AGENTS.md` và `memory/` có thể Restore từ Windows Recycle Bin. Bridge `v3/` có thể tái tạo bằng junction/hardlink, nhưng sẽ không cần sau khi test đọc root. Trước và sau gỡ bridge phải xác nhận root `index.html`, `js/core/schema.js`, `presets/empty-preset.json` còn tồn tại và 15/15 test vẫn pass.

**Explicit override:** Prompt của Chairman ngày 2026-07-21 cho phép xóa project `memory/`; đây là override trực tiếp cho guard bảo vệ `memory/source/` trong tác vụ này.

---

## [2026-07-21 13:44] -- Root app QA artifact cleanup -- PRE-ACTION

**What:** Đưa duy nhất `tmp/` vừa được `npm.cmd run qa` tạo vào Windows Recycle Bin.

**Why:** Đây là screenshot, synthetic Excel và Report JSON tạm; kết quả QA đã được ghi vào output/audit và repo chính thức không nên giữ fixture phát sinh.

**Blast radius:** Chỉ `tmp/`; không gồm app, test, scripts, audit hoặc archive.

**Rollback path:** Chạy lại `npm.cmd run qa` để tái tạo toàn bộ artifact.

---

## [2026-07-21 13:45] -- Test root app and remove agent-only folders -- REPORT

**Done:** Chuyển toàn bộ v3 unit/acceptance/scenario test từ `../v3/...` sang runtime thật tại root `js/`, `index.html`, `presets/`. Acceptance test hiện đọc root HTML/runtime trực tiếp. Đổi `scripts/v3_browser_runner.js` thành `scripts/app_browser_runner.js`, thêm local Playwright cache fallback để `npm.cmd run qa` chạy thẳng không cần set `NODE_PATH`, và cấu hình `npm.cmd test` chỉ chạy official v3 suite 15 test. Sau khi test root pass, tháo an toàn hai junction + một hardlink và xóa `v3/`. Đưa `AGENTS.md`, `memory/` và QA `tmp/` vào Windows Recycle Bin.

**Why agent files existed:** Root `AGENTS.md` là placeholder do workspace/agent bootstrap tạo để chứa imported Cowork instructions; file thực tế chỉ có một heading 47 byte và không điều khiển runtime. `memory/` là skeleton nhật ký semantic/procedural/source/episodic của workflow agent, không phải bộ nhớ của app hay dữ liệu FIN. Không có code/runtime reference tới hai target.

**Files changed:** `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `test/v3_scenario.test.js`, `scripts/app_browser_runner.js` (renamed), `package.json`, `README.md`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`. Removed `v3/`, root `AGENTS.md`, project `memory/`, generated `tmp/`.

**Verification:** Windows-native outputs:

```text
> npm.cmd test
tests 15
pass 15
fail 0

root HTML exposes four tabs and all runtime links stay local: pass
root runtime contains no dynamic execution and empty preset contains no business rules: pass
TEST-SCENARIO_v3 zero variance: pass
```

```json
{
  "command": "npm.cmd run qa",
  "status": "pass",
  "url": "file:///C:/Users/RYAN%20TOAN/Downloads/GIT/incal/index.html",
  "tabs": 4,
  "blocks": 17,
  "rosterPersisted": 20,
  "jobs": 1,
  "netPay": 9600000,
  "reportFiles": 2,
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0
}
```

```text
Bridge removal integrity:
index.html                exists=True  hashMatch=True
js/core/schema.js         exists=True  hashMatch=True
presets/empty-preset.json exists=True  hashMatch=True

V3=False; AGENTS=False; Memory=False; Tmp=False
RootIndex=True; RootEngine=True; RootPreset=True; Runner=True
PASS: 0 old bridge/runner paths
```

**Open questions for Cowork:** None.

**Risks/known gaps:** `AGENTS.md`, `memory/` và `tmp/` còn recoverable trong Windows Recycle Bin nếu Chairman đổi ý. Xóa project metadata không ảnh hưởng global Codex instructions ngoài repo. Các test legacy v2 vẫn nằm trong `test/` làm historical coverage nhưng script mặc định chỉ chạy 15 test của official root app.

---

## [2026-07-21 13:51] -- REVIEW (Claude/CEO): Nghiệm thu dọn repo v3-ra-root

**Verdict: ĐẠT — 2 điểm cần Chairman quyết (không chặn).**

**Kiểm tĩnh (khớp acceptance Directive 13:14):**
- `index.html` + `js/{core,adapters,export,vendor}` + `css/app.css` + `presets/` ở **root**. Runtime v2 (`TinhIncentive.html`, `js/engine`) và các thư mục build/tạm (`dist/output/outputs/reports/config/tmp`) đã gỡ.
- `node --test` 3 suite v3 = **15/15 pass** sau đổi path (`../js/core`). QA browser của Codex: 4 tab, roster 20 persist, 0 console/network/overflow.
- Grep sạch: 0 `eval`/`new Function`/`#REF!`/`210483804`/URL network trong runtime root.
- Guardrail còn nguyên: `docs/ handoff/ log/ test/ .gitignore` + brand (`assets/Logo`, `fonts/`, `BRAND.md`). `log/failure.md` + `history.md` (nhật ký bền) sống. Code không tham chiếu `memory/` hay `AGENTS.md` (không vỡ phụ thuộc).

**Điểm 1 — lệch Directive: đã xóa `memory/` + root `AGENTS.md`.** Directive 13:14 cấm đụng `memory/`. Codex override bằng chỉ đạo dọn dẹp trực tiếp của Chairman, ghi rõ + rollback (Recycle Bin). Đánh giá: tác động thấp — root `AGENTS.md` chỉ là stub 47 byte (bản v2.0 thật nằm ngoài repo), `memory/` chỉ 4 file nhật ký agent ~1KB, không runtime dependency. **Cần Chairman xác nhận** có chủ đích gỡ luôn scaffold agent, không chỉ app cũ.

**Điểm 2 — tham chiếu v2 chưa có tag rõ.** Acceptance yêu cầu bản tham chiếu v2 (tag git/archive) + cách khôi phục. REPORT dựa vào Recycle Bin (agent files) + git history (repo trên GIT) nhưng **không tạo tag tường minh**. Sandbox không lộ `.git` nên tôi không kiểm được. **Khuyến nghị:** Chairman tạo 1 git tag ở commit trước khi dọn (vd `v2-frozen`) để đảm bảo đường lùi trước khi dọn Recycle Bin.

**Còn treo (đúng out-of-scope):** preset Trustana thật chưa dựng — bước kế tiếp.

**[Chairman chốt 2026-07-21]** Cả 2 điểm là chủ đích, không phải lỗi: `memory/` thuộc repo Agentic riêng · root `AGENTS.md` rỗng · v2 đã xóa. Không cần khôi phục. Dọn repo v3-ra-root: **CLOSED — ĐẠT.**

## [2026-07-21 15:07] -- Dynamic Excel schema + 3-tab workflow -- TECHNICAL PLAN

**Architecture:** Giữ nguyên `js/core/engine.js` và `js/core/registry.js` (14 primitive + 3 macro). Thay lớp biên bằng workbook-schema adapter: đọc mọi sheet, chọn hàng header đầu tiên có dữ liệu, tạo field id deterministic từ cặp `(sheet, header)`, infer kiểu nhẹ (`Text/Number/Money/Percent/Boolean/Date`) và giữ raw numeric value, bao gồm `0.08`. Adapter execution sẽ gom các sheet theo vai trò preset (`roster`, `jobs`, `ignore`) rồi thêm canonical aliases tối thiểu cho identity/report trước khi gọi engine; GP và target chỉ copy thẳng từ cột đã bind, không có phép tái tính.

**Preset + persistence:** `schemaVersion` engine vẫn là 3; preset bổ sung `sourceSchema` gồm fingerprint sheet/header, type override, sheet role và canonical bindings. localStorage chỉ lưu preset JSON này. Workbook, rows, lương và toàn bộ dữ liệu kỳ chỉ nằm trong state RAM; bỏ hoàn toàn roster/localStorage cũ. Khi nạp file, exact fingerprint dùng lại binding tự động; mismatch tạo trạng thái `remap-required`, hiện diff và khóa Tính. Người dùng phải áp schema file mới rồi chọn lại field/binding thiếu trước khi lưu/chạy.

**Modules:** `js/adapters/xlsx.js` sở hữu discover/compare/materialize; `js/adapters/storage.js` chỉ persist preset; `js/core/schema.js` sở hữu source-schema/preset contracts và dynamic field helpers; `js/app.js` điều phối ba tab, builder và run gate. `js/core/engine.js`, `js/core/registry.js`, macro implementations và export calculation logic không đổi. HTML/CSS chuyển còn `Input · Công thức · Tính`.

**UI/visual:** Input hiển thị workbook summary và từng sheet như tool panel, cho gán vai trò + sửa kiểu cột. Công thức giữ editor 3 cột; field selector dùng `<optgroup>` theo sheet và nhóm riêng `Giá trị nhập tay`, kèm mapping định danh. Tính hiển thị compatibility gate, số hàng theo role, kết quả/trace/export. Dùng `TrustanaSans` từ bộ Roboto TTF local sẵn có làm UI font mới (repo không có Gilroy), JetBrains Mono giữ cho số/công thức; Trustana purple/orange, radius 14-18px, transition 160-220ms, hover/focus có tương phản, không gradient/decorative blob/nested-card.

**Priority:** P0 data contract, mismatch gate và privacy trước; P1 ba-tab workflow + preset auto-map; P2 polish, responsive, regressions, browser QA. Test tập trung vào workbook đa sheet, field groups chéo sheet, exact auto-map, changed-header block, raw GP/target, localStorage privacy và numeric parity lệch=0.

**Alternatives rejected:** Không sửa registry/source block để hiểu sheet tùy ý vì vi phạm guardrail engine/macro; không lưu workbook/roster vì dữ liệu nhạy cảm; không fuzzy-map header đã lệch vì rủi ro tính sai âm thầm; không tiếp tục cơ chế app sinh template vì đã bị Directive thay thế.

---

## [2026-07-21 15:25] -- Dynamic-schema browser QA artifact cleanup -- PRE-ACTION

**What:** Đưa duy nhất thư mục `tmp/` vừa được `npm.cmd run qa` tạo vào Windows Recycle Bin. Thư mục có 16 file synthetic (2 workbook giả + screenshot), tổng 1,515,300 byte.

**Why:** Kết quả QA đã được đọc trực tiếp và sẽ được chép vào REPORT; repo chính thức không giữ workbook/screenshot phát sinh.

**Blast radius:** Chỉ `C:\Users\RYAN TOAN\Downloads\GIT\incal\tmp`. Không gồm runtime, test, preset, docs, handoff, log hay dữ liệu nguồn.

**Rollback path:** Restore `tmp/` từ Windows Recycle Bin, hoặc chạy lại `npm.cmd run qa` để tái tạo toàn bộ artifact synthetic.

---

## [2026-07-21 15:28] -- Dynamic Excel schema + 3-tab workflow -- REPORT

**Done:**
- Thay mô hình app sinh template bằng workbook discovery đa sheet. Mỗi header thành field id deterministic `source:<sheet>::<header>`; type inference nhẹ nhận `Money/Number/Percent/Text/Boolean/Date` và giữ raw `%` thập phân (`0.08`).
- Preset v3 nay lưu snapshot schema, vai trò sheet (`jobs/roster/ignore`), type override, canonical bindings và recipe. Workbook/rows/lương không đi vào preset hoặc localStorage; adapter storage từ chối các payload có `rows/records/workbook/rawData/salaryValues`.
- Exact fingerprint sheet+header tự dùng lại role/type/binding. Header thêm/đổi/mất tạo mismatch công khai, hiện diff, khóa Tính và yêu cầu `Ướm schema file này`; không fuzzy-map âm thầm.
- Adapter materialize gom nhiều sheet theo vai trò và copy các binding định danh vào aliases engine. `job.gp` và `roster.target_quarter` là giá trị copy trực tiếp từ cột được chọn; không có bước recompute.
- UI chính thức còn đúng 3 tab `Input · Công thức · Tính`. Input hiển thị sheet/header/type/row count; Công thức có field picker `<optgroup>` theo sheet + `Giá trị nhập tay`, mapping định danh và đủ 17 block; Tính giữ deterministic engine, trace, BK/BKê/PDF/Job JSON/Report JSON.
- Làm lại visual shell bằng logo Trustana, tím/cam, `TrustanaSans` từ TTF local + JetBrains Mono, radius 14-18px, surface phẳng, hover/focus/active/disabled và transition có chủ đích. Responsive 4 viewport không page overflow.
- Cập nhật 15 test để bao phủ dynamic schema, mixed-sheet formula, exact auto-map, mismatch gate, raw GP/target, preset-only persistence và scenario lệch=0. Browser runner chạy workflow lưu preset → reload → tự ướm → tính, rồi đổi header để kiểm gate.
- Đưa `tmp/` synthetic QA vào Windows Recycle Bin sau khi xem trực tiếp ảnh Input/Công thức/Tính desktop + mobile.

**Architecture decisions:** Giữ `js/core/engine.js` và `js/core/registry.js` nguyên trạng; dynamic workbook chỉ tồn tại ở schema/adapter/UI boundary. Chọn exact fingerprint thay fuzzy match vì sai header phải fail closed. Chọn field id encode trực tiếp `(sheet, header)` để preset tự mô tả, không có catalog business hardcode làm nguồn chân lý. Chọn localStorage preset-only thay session data; reload cần nạp workbook lại nhưng không để lương sống ngoài phiên. Font plan đổi từ Gilroy sang `TrustanaSans` backed by local Roboto TTF vì repo không có Gilroy và guard cấm link ngoài.

**Files changed:** `index.html`, `css/app.css`, `branding.json`, `README.md`, `js/branding.js`, `js/core/schema.js`, `js/adapters/storage.js`, `js/adapters/xlsx.js`, `js/app.js`, `presets/empty-preset.json`, `scripts/app_browser_runner.js`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`. `js/core/engine.js`, `js/core/registry.js`, macro logic và export calculation logic không sửa.

**Verification:** Windows-native outputs:

```text
> npm.cmd test
tests 15
pass 15
fail 0

Covered: 3 tabs/local assets; multi-sheet dynamic headers; mixed Job + Nhân sự formula;
exact auto-map; changed-header mismatch; GP/target direct copy; preset-only persistence;
14 primitive + 3 macros; typed validation; trace; TEST-SCENARIO_v3 delta = 0.
```

```json
{
  "command": "npm.cmd run qa",
  "status": "pass",
  "url": "file:///C:/Users/RYAN%20TOAN/Downloads/GIT/incal/index.html",
  "tabs": 3,
  "sheets": 2,
  "fields": 11,
  "blocks": 17,
  "autoMapped": true,
  "mismatchBlocked": true,
  "jobs": 1,
  "people": 1,
  "netPay": 9600000,
  "persistedKeys": ["incal.v3.preset.v2"],
  "sensitiveRowsPersisted": false,
  "font": "TrustanaSans",
  "logoLoaded": true,
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0
}
```

```json
{
  "tabs": 3,
  "tmpExists": false,
  "dynamicExec": 0,
  "networkApis": 0,
  "refErrors": 0,
  "legacyAmount": 0,
  "oldWorkflow": 0,
  "presetStorageKeyHits": 1,
  "htmlRefs": 16,
  "missingRefs": 0,
  "networkRefs": 0,
  "primitive": 14,
  "macros": 3
}
```

```text
engine SHA-256   5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C
registry SHA-256 587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC
Both files retain pre-Directive modification timestamps (engine 12:34, registry 12:44 local).
```

**Open questions for Cowork:** None.

**Risks/known gaps:** Type inference cố ý nhẹ; FIN có thể sửa type ngay ở tab Input. Preset Trustana thật và dữ liệu thật vẫn chưa có, đúng out-of-scope. Khi FIN đổi tên sheet/header, họ phải ướm và lưu preset phiên bản mới thay vì app đoán.

---

## [2026-07-21 15:34] -- Dashboard follow-up QA artifact cleanup -- PRE-ACTION

**What:** Đưa duy nhất `tmp/` do browser QA follow-up tạo vào Windows Recycle Bin. Thư mục có 22 file synthetic (workbook/report JSON/screenshot), tổng 1,789,407 byte.

**Why:** Dashboard và 4-tab screenshots đã được xem trực tiếp; output QA được giữ trong REPORT, còn repo không giữ dữ liệu test phát sinh.

**Blast radius:** Chỉ `C:\Users\RYAN TOAN\Downloads\GIT\incal\tmp`; không gồm runtime, tests, docs, handoff hoặc log.

**Rollback path:** Restore từ Windows Recycle Bin hoặc chạy lại `npm.cmd run qa`.

---

## [2026-07-21 15:34] -- Restore Dashboard as tab 4 -- [AUTO] REPORT

**Done:** Phục hồi tab 4 `Dashboard` theo chỉ đạo mới của Chairman. Dashboard dùng lại `js/core/history.js` để nạp nhiều Report JSON, tổng hợp Q1-Q4/YTD, KPI gross/thuế/net, top người, bảng chi tiết theo quý và hai canvas chart. Visual giữ cùng Trustana shell mới, desktop-first; mobile chỉ là fallback không vỡ. Không thay workbook schema, preset persistence, engine, registry, recipe hoặc macro.

**Files changed:** `index.html`, `css/app.css`, `js/app.js`, `README.md`, `scripts/app_browser_runner.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.

**Verification:** 

```text
> npm.cmd test
tests 15
pass 15
fail 0

Dashboard acceptance: 4 tabs + 2-period aggregation + YTD total pass.
TEST-SCENARIO_v3 numeric delta = 0 remains pass.
```

```json
{
  "command": "npm.cmd run qa",
  "status": "pass",
  "tabs": 4,
  "dashboardReports": 2,
  "dashboardQuarterChartPainted": true,
  "autoMapped": true,
  "mismatchBlocked": true,
  "netPay": 9600000,
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0,
  "sensitiveRowsPersisted": false
}
```

```text
Runtime grep: tabs=4; dashboardSections=1; dynamicExec=0; networkApis=0; rosterStorage=0
QA artifact cleanup: tmpExists=False
```

**Open questions for Cowork:** None.

**Risks/known gaps:** Dashboard vẫn là file-driven và không persist report, đúng privacy boundary. Mobile không phải target vận hành; chỉ được giữ responsive để không vỡ nếu mở nhầm trên màn hình hẹp.

---

## [2026-07-21 16:42] - N-table model + cross-table lookup - TECHNICAL PLAN

**Architecture decision:** Giữ `engine.runPreset()` và toàn bộ `BlockRegistry` nguyên byte. Bridge mới biểu diễn mỗi sheet bằng một entity `{ tableId, sheetName, name, role, keyFieldId, fields[] }`; `tableId` ổn định theo sheet để recipe không phụ thuộc tên hiển thị. `sourceSchema.subjectTableId` chọn bảng chủ thể. Adapter materialize tất cả entity vào `tables[tableId]`, rồi chiếu riêng bảng chủ thể sang alias `roster` mà engine đang lặp. Vì vậy đổi chủ thể chỉ đổi bridge input, không đổi engine hay block semantics.

**Lookup/relationship decision:** `source` và `lookup` đã đọc `context.tables[config.table]` nên không cần sửa registry. UI sẽ thay options tĩnh bằng entity hiện tại, lọc khóa/return field theo target table. Preset lưu khóa từng entity và snapshot quan hệ lookup được chuẩn hóa từ recipe node (`recipeId`, `nodeId`, target table, lookup key, return field, source ref); recipe vẫn là executable truth để tránh hai nguồn logic.

**Identity and migration:** Bỏ binding theo role cứng `jobs/roster`. Bridge chỉ bắt buộc `subject.id`, còn `subject.name` và `subject.group` tùy chọn để render/export. Preset cũ có role `roster/jobs/ignore` được nâng khi load: sheet roster thành subject, mọi sheet kể cả ignore cũ trở thành entity dùng được, config table `roster/jobs` trong node được ánh xạ sang tableId tương ứng. Row/workbook không bao giờ đi vào preset/localStorage.

**UI direction:** Operational desktop tool cho FIN, Trustana-branded, scannable và ít trang trí. Design dials: variance 4, motion 3, density 6. Dùng Quicksand cho heading/identity, Montserrat cho body/control/numbers, đều local/offline từ repo iMetriK có license. Giữ 4 tab và Dashboard; làm rõ flow `Nạp bảng -> đặt tên/vai/khóa/chủ thể -> cấu hình source/lookup -> tính`.

**P0:** contract N-bảng, migration, materializer, subject alias, privacy/fingerprint gates.

**P1:** entity/key UI, dynamic field/config pickers, lookup relation snapshot, formula run trên workbook 4 sheet.

**P2:** typography/layout polish, regression + browser QA, audit/hash/grep close.

**Core lock evidence before code:** `engine.js` SHA256 `5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C`; `registry.js` SHA256 `587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC`.

**Pre-action note for test cleanup:** Sau khi các regression v3 mới chạy xanh, gỡ 7 file test v2 chết khỏi `test/`: `blueprint_v2.test.js`, `engine.test.js`, `export_regression.test.js`, `golden.test.js`, `history.test.js`, `sample_kit.test.js`, `ui_contract.test.js`, `workspace.test.js` sẽ được kiểm lại để chốt đúng 7 theo REVIEW (danh sách hiện thấy có 8 candidate, không xóa khi chưa xác minh). Lý do: chúng import runtime v2 đã bị gỡ và làm `node --test test/*` đỏ giả. Blast radius chỉ là legacy test code, không runtime/fixture v3. Rollback: chuyển file đã xác minh vào Windows Recycle Bin, có thể Restore về đúng `test/`; không đụng `test/v3_*` hoặc `test/golden/` nếu còn được v3 dùng.

**Acceptance proof planned:** workbook mẫu 4 sheet; subject 3 vs 7 rows; ALPHA customer lookup; numeric derivation NV01 `120,000,000 + 50,000,000 + 30,000,000 + 0 - 1,000,000 = 199,000,000`; exact schema reload; mismatch fail-closed; full Node suite; 4-viewports file QA; storage/network/dynamic-code grep; engine/registry hash equality.

---

## [2026-07-21 16:44] - Legacy test cleanup - PRE-ACTION CLARIFICATION

Windows-native baseline `node --test test/*` xác nhận đúng 7 file v2 chết: `blueprint_v2.test.js`, `engine.test.js`, `golden.test.js`, `history.test.js`, `sample_kit.test.js`, `ui_contract.test.js`, `workspace.test.js`. `export_regression.test.js` chạy xanh 2 test và sẽ được giữ. Thất bại thứ 8 là Node cố chạy thư mục `test/golden` do glob `test/*`, không phải file test thứ 8; thư mục fixture này sẽ chỉ được gỡ nếu reference audit chứng minh không còn consumer sau khi 7 file legacy được bỏ. Rollback và blast radius giữ nguyên như note 16:42.

---

## [2026-07-21 17:01] - N-table browser QA artifacts - PRE-ACTION

**What:** Đưa `tmp/` do browser runner tạo vào Windows Recycle Bin sau khi đã xem trực tiếp ảnh của Input, Công thức, Tính và Dashboard. Thư mục chỉ có `app-qa/`: workbook lệch-header synthetic, hai Report JSON synthetic và screenshots, tổng 2,482,668 byte.

**Why:** Giữ repo sạch và không để output test chứa tên/số mẫu nằm lại trong workspace.

**Blast radius:** Chỉ `C:\Users\RYAN TOAN\Downloads\GIT\incal\tmp`; không đụng runtime, test, docs, handoff, log hoặc workbook nguồn.

**Rollback path:** Restore từ Windows Recycle Bin hoặc chạy lại `npm.cmd run qa` để tái tạo.

---

## [2026-07-21 15:47] -- REVIEW (Claude/CEO): Nghiệm thu mô hình Excel-định-nghĩa-schema

**Verdict: ĐẠT.** Codex nộp technical plan trước (đúng quy trình), build khớp Directive.

**Kiểm chứng độc lập (không tin REPORT mù):**
- `js/core/engine.js` (mtime 12:34) + `registry.js` (12:44) **giữ nguyên trước Directive 15:01** → lõi 14 khối + 3 macro (đã nghiệm lệch=0) không bị đụng. v3 suite chính thức **15/15 pass**.
- Bind theo `source:<sheet>::<header>` (tự mô tả); type infer nhẹ (% thập phân → Percent; gp/target/lương/doanh thu → Money). Khớp "schema động theo file".
- Persist: chỉ `incal.v3.preset.v2`; `FORBIDDEN_KEYS` chặn rows/records/workbook/rawData/salaryValues → lương thật KHÔNG persist. Mạnh hơn yêu cầu.
- Reload cùng fingerprint → tự ướm; header lệch → fail-closed, hiện diff, khóa Tính, đòi "Ướm schema" — không fuzzy âm thầm. GP/target copy thẳng, không recompute.
- Style: radius 14-18px, hover/focus/active/transition, font mới (`TrustanaSans` nền Roboto TTF local vì repo không có Gilroy + cấm link ngoài), brand Trustana. QA 4 viewport 0 lỗi.

**2 điểm cần lưu (không chặn):**
1. **7 test v2-chết** (`blueprint_v2/engine/golden/history/sample_kit/ui_contract/workspace`) trỏ `js/engine` đã gỡ → làm `node --test test/*` đỏ giả. `npm test` (chỉ 3 file v3) vẫn 15/15. **Khuyến nghị:** gỡ/lưu-trữ các test v2-chết cho suite sạch.
2. **Dashboard bị bỏ rồi khôi phục thành tab 4** — do Directive tôi ghi "3 tab" (sót Dashboard). Lỗi diễn giải của tôi; Chairman bắt kịp, Codex restore bằng `history.js`. Giờ đủ 4 tab. Ghi nhận để lần sau tôi không sót.

**Còn treo (đúng out-of-scope):** preset Trustana thật + dữ liệu thật — bước kế tiếp.

---

## [2026-07-21 17:04] - N-table model + cross-table lookup - REPORT

**Done:** Mở bridge từ hai bảng cứng thành N bảng tự mô tả. Mỗi sheet có `tableId` ổn định, tên/vai trò user đặt, khóa và field riêng; user chọn đúng một `subjectTableId`. Adapter materialize toàn bộ sheet vào `tables[tableId]` rồi chiếu bảng chủ thể sang alias `roster`, vì vậy engine tiếp tục lặp per-row mà không đổi logic. `Lấy nguồn` và `Tra bảng` chọn được mọi bảng; lookup key/return field được scope theo target table và quan hệ được snapshot trong preset. Preset cũ được normalize từ roles `jobs/roster/ignore`; dữ liệu kỳ không được persist.

UI Input/Công thức được làm lại theo hướng operational desktop: Quicksand cho heading/identity, Montserrat cho body/control/number, font và license đều local; giữ logo, Trustana purple/orange, Dashboard tab 4, hover/focus/transition và responsive fallback. Ảnh của cả bốn tab tại desktop/mobile đã được xem trực tiếp; đã sửa field-id overlap và node summary mã hóa trước khi chốt.

Đã gỡ đúng bảy test v2 chết: `blueprint_v2.test.js`, `engine.test.js`, `golden.test.js`, `history.test.js`, `sample_kit.test.js`, `ui_contract.test.js`, `workspace.test.js`. Giữ `export_regression.test.js` vì vẫn chạy xanh. `test/golden/` chỉ phục vụ test v2 cũ và không còn consumer; cũng được gỡ để lệnh nghiệm thu `node --test test/*` không chạy nhầm directory. Tất cả được đưa vào Windows Recycle Bin, có thể Restore về `test/`.

**Architecture decisions:** Chọn compatibility projection `subject -> roster` thay vì sửa engine; chọn recipe là executable truth và relations là metadata dẫn đường thay vì tạo một engine quan hệ thứ hai; chọn exact sheet/header fingerprint thay fuzzy mapping để sai schema luôn fail closed. Lookup giữ đúng scope VLOOKUP một khóa sang một bảng, không mở thành BI/DB hoặc many-to-many join.

**Files changed:** `index.html`, `css/app.css`, `README.md`, `package.json`, `js/app.js`, `js/branding.js`, `js/core/schema.js`, `js/core/validator.js`, `js/adapters/xlsx.js`, `scripts/app_browser_runner.js`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `assets/fonts/LICENSE-montserrat.txt`, `assets/fonts/LICENSE-quicksand.txt`, 16 file WOFF2 Quicksand/Montserrat, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`. Removed the seven v2 test files and `test/golden/` listed above. `js/core/engine.js` and `js/core/registry.js` were not modified.

**Verification:** Windows-native outputs:

```text
> npm.cmd test
tests 22
pass 22
fail 0

> node --test test/*
tests 22
pass 22
fail 0
```

Coverage includes actual `docs/INPUT-Incentive_mau.xlsx`: 4 sheets -> 4 entities; `Nhân sự` subject = 3 rows, `Jobs` subject = 7 rows; Jobs -> Khách hàng lookup returns `Đã bàn giao = true`; three-table formula computes NV01 `120,000,000 + 50,000,000 + 30,000,000 + 0 - 1,000,000 = 199,000,000`, delta 0; exact preset reload preserves entities/keys/subject/relation; mismatch header blocks calculation.

```json
{
  "command": "npm.cmd run qa",
  "status": "pass",
  "url": "file:///C:/Users/RYAN%20TOAN/Downloads/GIT/incal/index.html",
  "tabs": 4,
  "sheets": 4,
  "fields": 34,
  "blocks": 17,
  "subjectRows": 3,
  "tables": 4,
  "lookupResult": 199000000,
  "netPay": 389000000,
  "autoMapped": true,
  "mismatchBlocked": true,
  "persistedKeys": ["incal.v3.preset.v2"],
  "sensitiveRowsPersisted": false,
  "bodyFont": "Montserrat",
  "headingFont": "Quicksand",
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0
}
```

```json
{
  "DynamicExec": 0,
  "NetworkAPIs": 0,
  "RefErrors": 0,
  "ForcedIgnore": 0,
  "TmpExists": false,
  "RemainingTests": ["export_regression.test.js", "v3_acceptance.test.js", "v3_core.test.js", "v3_scenario.test.js"]
}
```

```text
engine SHA-256   5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C
registry SHA-256 587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC
Result: both equal pre-code hashes recorded at 16:42.
```

**Open questions for Cowork:** None.

**Risks/known gaps:** Lookup là exact first-match theo khóa, cố ý không xử lý many-to-many hoặc aggregation như database. Đổi tên sheet/header vẫn yêu cầu ướm lại và lưu preset version mới. Preset Trustana thật và dữ liệu thật chưa được dựng/commit, đúng out-of-scope.

---

## [2026-07-21 17:12] -- REVIEW (Claude/CEO): Nghiệm thu mở lớp data-model (N bảng + lookup chéo)

**Verdict: ĐẠT.** Codex nộp technical plan trước, build khớp Directive 16:34.

**Kiểm chứng độc lập:**
- 22/22 pass (npm test + node --test test/*); 7 test v2-chết + test/golden/ đã gỡ (Recycle Bin), giữ export_regression.
- engine.js (12:34) + registry.js (12:44) SHA-256 khớp hash trước code → lõi 14+3 khối KHÔNG đụng. Cơ chế: chiếu bảng chủ thể → alias roster, engine lặp per-row nguyên trạng.
- N-bảng: mỗi sheet có tableId/vai/khoá; materialize đổ mọi sheet vào tables[tableId]; chọn 1 subjectTableId. File mẫu docs/INPUT-Incentive_mau.xlsx → 4 thực thể/34 field chạy được, không sheet nào kẹt ignore.
- Lookup chéo bảng chạy trên file thật (Jobs→Khách hàng). Giữ đúng phạm vi VLOOKUP một-khoá, không many-to-many/BI — đúng điểm dừng đã chốt.
- Preset metadata-only, không persist data thật; header lệch fail-closed.

**Ghi chú:** số 199tr/389tr trong REPORT là formula demo của Codex (tổng GP − phạt), KHÔNG phải số incentive Trustana — đúng, preset thật là việc kế tiếp của Claude.

**Còn treo (đúng out-of-scope):** dựng preset Trustana thật + đối chiếu lệch=0 — bước Claude làm ngay sau.

---

## [2026-07-22 09:38] -- Dọn UX tab Công thức -- REPORT

**Done:** Hoàn tất 6 điểm UX ở lớp hiển thị/bố cục. Dropdown tham chiếu node dùng `Bước NN · tên khối: mô tả nghiệp vụ` thay id; operator hiện tiếng Việt nhưng `value` vẫn là code gốc; field hiện `Sheet · Header` và có fallback giải mã id cũ. Toàn bộ control chọn/tạo/xóa/metadata recipe đã chuyển xuống dưới danh sách node và dùng Montserrat thống nhất. Bỏ step-note `Khai báo bảng và định danh`. Khu preset còn đúng hai nút: `Nạp preset` nạp JSON + cache ngầm vào `incal.v3.preset.v2`; `Lưu preset` tải JSON, khi khóa có lý do visible + `title`/`aria-describedby`.

**Architecture decisions:** Dùng mapper UI thuần trong `js/app.js`; không normalize hay rewrite object preset. Node reference vẫn lưu `node:<nodeId>`, option condition vẫn lưu `eq/neq/gt/gte/lt/lte/contains`. Tên field lấy từ schema hiện hành; chỉ khi schema thiếu mới parse và `decodeURIComponent` định danh `source:<sheet>::<header>`. Cache chỉ là side effect ngầm sau khi nạp file; hành động `Lưu preset` có một nghĩa duy nhất là download backup/chia sẻ.

**Files changed:** `index.html`, `css/app.css`, `js/app.js`, `test/v3_acceptance.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`. Không sửa `presets/trustana-q1-demo.json`, `js/core/engine.js`, `js/core/registry.js`, schema preset, node id, operator code hoặc engine logic.

**Verification:** Windows-native outputs:

```text
> node --test
tests 24
pass 24
fail 0

> npm.cmd test
tests 24
pass 24
fail 0
```

```json
{
  "command": "npm.cmd run qa",
  "status": "pass",
  "url": "file:///C:/Users/RYAN%20TOAN/Downloads/GIT/incal/index.html",
  "tabs": 4,
  "sheets": 4,
  "fields": 35,
  "blocks": 17,
  "subjectRows": 3,
  "tables": 4,
  "trustanaNets": [11650000, 2880000, 1900000],
  "autoMapped": true,
  "mismatchBlocked": true,
  "persistedKeys": ["incal.v3.preset.v2"],
  "sensitiveRowsPersisted": false,
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0
}
```

QA thực hiện đúng luồng file: `presets/trustana-q1-demo.json` -> reload để chứng minh cache qua phiên -> `docs/INPUT-Incentive_mau.xlsx` -> tính; NET lần lượt 11.650.000 / 2.880.000 / 1.900.000. Runner còn kiểm option node không phơi `src/f1/wf`, option condition có label tiếng Việt nhưng value code gốc, entity map không còn `source:`/percent-encoding, đúng 2 action preset, recipe controls nằm sau node list, `Lưu preset` tạo download `TRUSTANA-Q1.json`, và nút khóa hiện lý do. Ảnh Công thức 1440x900 + 390x844 đã được xem trực tiếp.

```text
engine SHA-256   5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C
registry SHA-256 587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC
Result: khớp hash baseline đã ghi ở REPORT/REVIEW trước; core không đổi.
```

```json
{
  "ExportPresetControl": 0,
  "RedundantPanel": 0,
  "DynamicExec": 0,
  "NetworkAPIs": 0
}
```

**Open questions for Cowork:** None.

**Risks/known gaps:** Không có hồi quy đã biết trong phạm vi. QA artifact/screenshots nằm ở `tmp/app-qa/` để Cowork có thể xem lại; đây là output tái tạo được từ `npm.cmd run qa`, không phải runtime source.

---

## [2026-07-22 10:03] -- [AUTO] Rà soát UX control và chuẩn hóa tên file xuất -- REPORT

**Done:** Chuẩn hóa caret và khoảng trống bên phải cho toàn bộ `select` ở desktop/mobile; sửa thêm checkbox chọn khối kết quả bị co thành ô vuông trong Inspector. Xóa mọi badge bước 02/03/04 và pill `Offline` cố định. Đổi `Kỳ` thành `Kỳ báo cáo` với tooltip nói rõ đây là metadata/tên file xuất, không tự tính lại. Loại bỏ BK/BKê khỏi lớp người dùng và thay bằng `Tổng hợp chi trả`, `Nhóm COM/Khác/BO`, `Dữ liệu job` và `Báo cáo đầy đủ` ở nút, tooltip, workbook sheet/header và filename.

**Architecture decisions:** Dùng một caret SVG nội tuyến và right padding chung cho mọi native select để tránh sai lệch giữa control/browser. Giữ nguyên ID/hàm nội bộ `exportBk`/`writeBke` để không tạo blast radius lên wiring; chỉ đổi ngôn ngữ và artifact người dùng nhận. Bỏ pill `Offline` vì đây là nhãn cố định, không phải health indicator thật. `quarterInput` tiếp tục cập nhật `report.quarter` mà không gọi engine; regression browser chứng minh đổi Q1 sang Q2 chỉ đổi filename/payload, NET không đổi.

**Files changed:** `index.html`, `css/app.css`, `js/app.js`, `js/export/categories.js`, `js/export/xlsx_bk.js`, `js/export/xlsx_bke.js`, `README.md`, `test/export_regression.test.js`, `test/v3_acceptance.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.

**Verification:** Windows-native outputs:

```text
> node --test
tests 25
pass 25
fail 0

> npm.cmd test
tests 25
pass 25
fail 0
```

```json
{
  "command": "npm.cmd run qa",
  "status": "pass",
  "trustanaNets": [11650000, 2880000, 1900000],
  "selectCaretAligned": true,
  "genericExportLabels": true,
  "quarterExportVerified": true,
  "jobJsonKeys": ["generated_at", "jobs", "kind", "quarter", "schemaVersion"],
  "fullReportKeysVerified": ["preset", "validation", "totals", "per_person", "per_job"],
  "viewports": ["1440x900", "1280x800", "390x844", "360x740"],
  "consoleErrors": 0,
  "pageErrors": 0,
  "failedRequests": 0,
  "horizontalOverflow": 0
}
```

Browser QA tải thật `JOB_DATA_Q2-2026.json` và `INCENTIVE_REPORT_Q2-2026.json`. File job chỉ có metadata + `jobs`; báo cáo đầy đủ có preset, validation, totals, per-person (kèm trace) và per-job. Đổi kỳ sau khi tính giữ nguyên tổng NET. Ảnh Công thức 1440x900, 1280x800 và 390x844 được xem trực tiếp; caret không chạm border/nút và checkbox kết quả là 18x18.

```json
{
  "EngineSHA256": "5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C",
  "RegistrySHA256": "587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC",
  "CoreHashesMatch": true,
  "StepNotes": 0,
  "OfflinePill": 0,
  "DynamicExec": 0,
  "NetworkAPIs": 0,
  "NullBytes": 0
}
```

**Open questions for Cowork:** None.

**Risks/known gaps:** Tên file/sheet export thay đổi có chủ đích nên quy trình ngoài app đang dựa vào tên BK/BKê cũ cần nhận tên generic mới. Payload JSON, preset format, node id, operator code và engine không đổi. Kỳ báo cáo vẫn là nhãn kỳ của artifact, không phải trigger tính lại chính sách.

---

## [2026-07-22 10:28] -- REVIEW (Claude/CEO): Nghiệm thu #5 (dọn UX tab Công thức) -- ĐẠT

**Verdict: ĐẠT.** Gate #6 (Canvas) mở — Codex được bắt đầu bằng technical plan.

**Kiểm chứng độc lập:**
- `node --test` 25/25 pass. Preset thật `presets/trustana-q1-demo.json` chạy lại qua đúng đường app: NET 11.650.000 / 2.880.000 / 1.900.000 — **không hồi quy**.
- engine/registry SHA-256 khớp baseline → lõi không đụng.
- 6 điểm #5 đạt: operator tiếng Việt (đủ 7, value vẫn eq/neq/…); dropdown node dùng "Bước · tên khối" không phơi id; entity map "Sheet · Header" hết %-encode; nút quản lý recipe xuống dưới + font đồng nhất; panel "Khai báo bảng và định danh" đã xoá (grep=0); preset còn đúng 2 nút "Nạp preset"/"Lưu preset" (bỏ "lưu vào máy"), nút khoá hiện lý do.

**Ghi nhận follow-up [AUTO] 10:03 (chấp nhận):** căn caret select, checkbox kết quả 18x18, bỏ badge bước + pill Offline, đổi "Kỳ"→"Kỳ báo cáo" + tooltip. **1 điểm cần Chairman/FIN xác nhận:** Codex đổi tên xuất BK/BKê → tên generic ("Tổng hợp chi trả", "Nhóm COM/Khác/BO", "Dữ liệu job", "Báo cáo đầy đủ"). Wiring không đổi nhưng FIN có thể quen "BK/BKê" — xác nhận tên mới có hợp không, nếu không thì đổi nhãn lại (chỉ lớp hiển thị).

**Kế tiếp:** Directive #6 (Canvas) `[2026-07-22 10:15]` — Codex nộp technical plan trước.

---

## [2026-07-22 10:32] -- Canvas dựng công thức + nhóm xuất theo recipe -- TECHNICAL PLAN

**Gate:** REVIEW 10:28 xác nhận #5 ĐẠT. Chairman ủy quyền Codex triển khai tự chủ tới hoàn thiện; plan này được ghi trước mọi thay đổi runtime.

**Baseline bất biến:** `js/core/engine.js` SHA-256 `5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C`; `js/core/registry.js` SHA-256 `587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC`. Không sửa hai file, block contract 14+3, operator code, node id hoặc preset demo.

**Architecture decision:** Tự dựng canvas bằng DOM tuyệt đối + một SVG overlay, không thêm thư viện/CDN. DOM giữ node/card và accessibility; SVG chỉ vẽ edge/arrow/ghost. Một world layer dùng chung transform pan cho node và edge. Cách này nhỏ hơn vendor graph library, chạy trực tiếp `file://`, không phát sinh supply-chain hoặc bundler, và đủ cho graph recipe quy mô nhỏ.

**Persistence/migration:** Toạ độ lưu dưới `node.meta.canvas = {x,y}` theo grid 24px. Đây là metadata bổ sung trên node; `createPreset/createRecipe` hiện clone node nguyên vẹn, storage serializer giữ metadata và engine bỏ qua. Preset cũ thiếu toạ độ được auto-arrange trong RAM ngay khi load; không rewrite node/input/config. Layout theo topological depth trái→phải, node cùng layer xếp dọc ổn định theo thứ tự recipe.

**Graph contract:** Edge là projection duy nhất từ `targetNode.inputs[portId] = {kind:'node', nodeId:sourceId}`; không có edge store thứ hai. Sink được suy từ node không có dependent. Đúng một sink thì UI đồng bộ `recipe.output.nodeId` và output type; 0 hoặc >1 sink đặt output null và thêm lỗi graph chưa khép trước validator, vì vậy lưu/tính fail closed. Inspector tiếp tục cấu hình field/literal/config; node-to-node chỉ tạo bằng kéo cổng và có hành động ngắt rõ ràng.

**Type/cycle gate:** Khi drop edge, tạo clone recipe tạm, gắn input dự kiến rồi chạy validator hiện hữu. Chỉ commit nếu không có `TYPE_MISMATCH` tại target port và không có `CYCLE`/unknown source. Validator hiện hữu là verdict duy nhất nên không có luật type song song. Nối sai chỉ đổi ghost/port sang đỏ và hiện lý do, không chạm recipe thật.

**Interaction/layout:** Workspace desktop dạng tool panel: library 184px, canvas `minmax(680px,1fr)` là vùng lớn nhất, inspector 300px. Subject Bridge dùng `<details>` một dòng. Kéo library→canvas tạo node tại world coordinate; pointer drag node snap khi thả; drag nền pan; `Tự xếp gọn` chạy layout và animate nhẹ. Node dùng màu category, badge type, trạng thái valid/warning/error và badge cam `= KẾT QUẢ`.

**Dynamic exports:** Thay ba rule COM/KHAC/BO bằng `incomeGroups(report.preset)` suy từ recipe component theo thứ tự preset, bỏ `penalty`, `tax`, `adjustment`, gộp component trùng. Mỗi nút gọi exporter chung và lọc `person.components[component] != 0`; filename/sheet dùng component đã sanitize. Vì report đã snapshot preset và components, không cần đổi engine/report shape. UI render lại nhóm sau mỗi lần tính; KAE tự thành nhóm riêng.

**Test/verification gates:** Unit test utility layout/sink/path, storage round-trip metadata, edge compatible/mismatch/cycle, dynamic groups/exclusions. Browser runner thao tác thật drag/drop node, move+snap, edge valid và invalid, pan, auto-arrange, single/multiple sink, KAE export, preset save metadata; chụp 1440x900 và 1280x800 rồi xem trực tiếp. Cuối cùng chạy `node --test`, `npm.cmd test`, `npm.cmd run qa`; nạp `presets/trustana-q1-demo.json` + `docs/INPUT-Incentive_mau.xlsx` phải giữ NET 11.650.000 / 2.880.000 / 1.900.000; 0 console/page/network/overflow; hash core khớp baseline.

**Risks/rollback:** Pointer hit-test và SVG geometry là vùng rủi ro chính; giới hạn desktop, dùng document-level pointer handlers và DOM bounding boxes. Metadata layout là additive nên rollback runtime chỉ cần trả HTML/CSS/app và bỏ module canvas; preset có `node.meta.canvas` vẫn được engine/schema cũ bỏ qua. Không có destructive operation hoặc dữ liệu thật trong scope.

---

## [2026-07-22 11:02] -- Canvas dựng công thức + nhóm xuất theo recipe -- REPORT

**Done:** Dựng lại tab Công thức thành graph editor desktop offline bằng DOM + SVG: kéo block vào canvas, kéo node snap 24px, pan nền, nối output sang input bằng bezier, ghost edge, hit-test cổng ổn định, validator chặn type mismatch/cycle, sink duy nhất tự gắn `= KẾT QUẢ`, nhiều sink báo graph chưa khép, `Tự xếp gọn`, Subject Bridge gập nhỏ và inspector theo node. Toạ độ chỉ thêm tại `node.meta.canvas`; edge vẫn chỉ là projection từ `node.inputs`. Thay export COM/Khác/BO hardcode bằng nhóm tự sinh theo component thu nhập; preset demo sinh COM/BO/KAE và KAE xuất file riêng.

**Files changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `js/export/categories.js`, `package.json`, `scripts/app_browser_runner.js`, `test/formula_canvas.test.js`, `test/export_regression.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`

**Architecture decision:** Chọn DOM node tuyệt đối + SVG overlay thay vì graph library để giữ `file://`, không CDN/bundler/supply-chain mới. Không lưu edge store riêng; mọi đường nối dựng lại từ `node.inputs`. Auto-layout topological và metadata additive giữ tương thích preset cũ. Type/cycle dùng validator hiện hữu trên recipe clone trước khi commit.

**Verification:** Windows-native output trên workspace thật:

```text
> node --test
tests 30 | pass 30 | fail 0 | duration_ms 394.1972

> npm.cmd test
tests 30 | pass 30 | fail 0 | duration_ms 357.8725

> node --check js/app.js; node --check js/ui/formula_canvas.js; node --check js/export/categories.js; node --check scripts/app_browser_runner.js
Exit code: 0

> npm.cmd run qa
status: pass
trustanaNets: [11650000, 2880000, 1900000]
canvasNodes: 10 | canvasEdges: 11
nodeDragSnapped: true | panVerified: true | autoOutput: true
invalidConnectionBlocked: true | cycleConnectionBlocked: true
trustanaExportGroups: [com, bo, kae]
kaeExportFilename: INCENTIVE_GROUP_KAE_Q1-2026.xlsx
dynamicExportGroups: [bo]
viewports: [1440x900, 1280x800]
consoleErrors: 0 | pageErrors: 0 | failedRequests: 0 | horizontalOverflow: 0

> Get-FileHash -Algorithm SHA256 js/core/engine.js,js/core/registry.js
engine.js   5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C
registry.js 587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC
```

Visual QA đã xem trực tiếp `tmp/app-qa/formulas-1440x900.png`, `formulas-1280x800.png` và `calculate-1440x900.png`: canvas không blank, lưới chấm/edge/node/inspector hiển thị đúng, canvas là cột lớn nhất, export bar chỉ có nhóm component hiện hữu. Static acceptance cũng xác nhận không có CDN/network-capable API và không còn output checkbox/CATEGORY_RULES.

**Open questions for Cowork:** Không. Sẵn sàng nghiệm bản cuối.

**Risks/known gaps:** Theo Directive, editor là desktop-only. Workspace này không có `.git`, nên không có `git diff --check`; đã thay bằng syntax checks, test suite, browser QA và scan conflict marker. Không sửa `js/core/engine.js`, `js/core/registry.js`, preset demo hoặc block registry 14+3.

---

## [2026-07-22 11:46] -- Canvas interaction refinement -- RESEARCH + TECHNICAL PLAN

**Trigger:** Chairman phản hồi trực tiếp ba ảnh: chevron không đồng nhất, thiếu zoom, ghost arrow không rõ, chưa reconnect edge, muốn context menu node, bỏ inspector phải cố định và cần hệ màu có nghĩa. Đây là follow-up frontend [AUTO] trên Directive Canvas đã hoàn tất.

**Market research (official sources):**
- Obsidian Canvas: hover cạnh card mới hiện handle; drag handle để nối; hover edge hiện hai endpoint và có thể kéo endpoint sang card khác; right-click card/edge cho edit/delete/navigation; pan bằng Space/middle mouse; Ctrl+wheel, +/- và Zoom to fit/selection.
- React Flow: connection preview là một path riêng; `isValidConnection` chặn trước commit; edge có lifecycle reconnect source/target; node context menu là pattern chính thức với duplicate/delete; reconnect/drop có radius thay vì đòi đúng 1 pixel.
- FigJam: board là vùng lớn nhất, properties chỉ hiện theo selection; zoom hiển thị bằng phần trăm, có +/-/fit, Ctrl+wheel và zoom-to-selection.
- tldraw: zoom menu nằm trong navigation controls; context menu/actions là component theo editor state; style panel có thể ẩn hoàn toàn và chỉ mở khi workflow cần.

**Decision:** Không thêm library/CDN. Nâng DOM+SVG hiện tại theo đúng pattern đã nghiên cứu: camera `{pan, zoom}` duy nhất; SVG edge projection vẫn đọc `node.inputs`; reconnect input endpoint thực hiện trên recipe clone rồi commit atomically; context menu + modal settings là transient UI. Permanent right inspector bị bỏ để canvas tăng từ 2 cột `library + canvas + inspector` thành `library + canvas`.

**Layout:** Subject Bridge và Recipe thành hai tool panels ngang. Canvas toolbar chỉ giữ trạng thái graph, auto-arrange và camera controls. Library vẫn trái để drag nhanh; canvas chiếm phần còn lại. Double-click node hoặc `Cài đặt...` trong context menu mở dialog; single click chỉ select. Context menu gồm Settings, Duplicate, Zoom to node, Disconnect all, Delete.

**Color contract:** Border/selection tím Trustana. Node complete có status green; node thiếu required input hoặc chưa có outgoing edge (trừ result sink) amber; validator structural/type/cycle errors red. Port neutral purple outline, bound/connected green, missing amber; compatible candidate green halo, invalid hovered target red. Category chỉ còn text label, không dùng màu cạnh tranh với health status.

**Camera/geometry:** `canvasZoom` chỉ session state, clamp 0.5-1.6. World transform `translate(pan) scale(zoom)`; pointer→world và DOM→SVG đều chia zoom; node drag delta chia zoom. Zoom quanh cursor giữ cùng world point; Fit tính node bounds và padding. Background dot size/position đi cùng camera. `Shift+1` fit; Ctrl+wheel zoom; buttons −/%/+/Fit.

**Reconnect contract:** Kéo output vào input đã nối là replace source. Kéo chính connected input bắt đầu retarget mode với source cũ; edge cũ vẫn tồn tại trong recipe thật cho tới valid drop vào target input mới. Trial clone bỏ original ref rồi gắn ref mới, validator hiện hữu quyết định. Drop hụt/invalid không sửa recipe.

**Verification gates:** Test zoom coordinate invariants, fit/clamp, ghost marker/cursor, candidate colors, replace-source, retarget-target rollback, context menu/dialog actions and unified chevron. Browser QA thực hiện mouse gestures thật ở 1440x900 và 1280x800, xem screenshot. Guardrail preset/workbook NET, type/cycle, offline/no CDN, core hashes giữ nguyên.

**Sources:** `https://obsidian.md/help/plugins/canvas`, `https://reactflow.dev/api-reference/react-flow`, `https://reactflow.dev/examples/interaction/context-menu`, `https://help.figma.com/hc/en-us/articles/1500004414582-Pan-and-zoom-in-FigJam`, `https://tldraw.dev/examples/custom-menus`.

---

## [2026-07-22 12:07] -- Canvas interaction refinement -- REPORT

**Done:** Bỏ inspector phải cố định và mở rộng canvas thành layout 2 cột library + graph. Subject Bridge/Recipe dùng cùng chevron. Thêm camera zoom 50%-160%, Ctrl+wheel neo con trỏ, −/100%/+/Fit và Shift+1. Ghost bezier có arrowhead và badge bám chuột; compatible input highlight xanh, invalid target đỏ. Output có thể replace source của input đã nối; kéo connected input có thể retarget sang cổng khác với trial validation và atomic commit vào `node.inputs`. Chuột phải node có Settings, Duplicate, Zoom, Disconnect, Delete; double-click mở dialog settings. Màu health được chuẩn hoá: tím selection, xanh complete/connected, cam incomplete, đỏ chỉ lỗi. Sửa hai lỗi interaction phát hiện bởi QA: no-move pointer không còn re-render node làm mất `dblclick`; SVG ghost path dùng `removeAttribute('hidden')`/`setAttribute('hidden','')` nên thực sự hiển thị.

**Files changed:** `index.html`, `css/app.css`, `js/app.js`, `js/ui/formula_canvas.js`, `scripts/app_browser_runner.js`, `test/formula_canvas.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`, `log/failure.md`.

**Verification:** 

```text
node --check js/app.js
node --check js/ui/formula_canvas.js
node --check scripts/app_browser_runner.js
=> exit 0

node --test
=> tests 32; pass 32; fail 0

npm.cmd run qa
=> status pass
=> trustanaNets [11650000, 2880000, 1900000]
=> zoomVerified true
=> unifiedChevrons true
=> contextMenuVerified true
=> modalSettingsVerified true
=> semanticPortColors true
=> ghostArrowVerified true
=> sourceReplacementVerified true
=> endpointRetargetVerified true
=> invalidConnectionBlocked true
=> cycleConnectionBlocked true
=> Chrome 1440x900 + 1280x800
=> consoleErrors 0; pageErrors 0; failedRequests 0; horizontalOverflow 0

Get-FileHash js/core/engine.js -Algorithm SHA256
=> 5D4F79D5A1637F4F890897749E140B4B31727FF70004BAC75FECA5A4953C9B3C
Get-FileHash js/core/registry.js -Algorithm SHA256
=> 587DBFDC9C739C1116C6DBCC9C2F5457F5699E3F0B241492AD31170B67E86DCC
```

Visual QA đã xem trực tiếp `tmp/app-qa/formulas-1440x900.png`, `formulas-1280x800.png`, `formula-context-menu-1440x900.png`, `formula-settings-dialog-1440x900.png`, `formula-connection-drag-1440x900.png`. Ghost screenshot xác nhận bezier cam, arrowhead và pill `Nối Money` nằm sát con trỏ. Menu/dialog nằm trong viewport; canvas là vùng lớn nhất; không còn cột inspector phải.

**Open questions for Cowork:** Không. Sẵn sàng Claude nghiệm bản cuối.

**Risks/known gaps:** Desktop-only đúng Directive. Camera là session state, không ghi preset; chỉ `node.meta.canvas` tiếp tục được persist. Không sửa engine/registry/preset demo. Workspace không có `.git`, nên không có `git diff --check`; syntax, unit/static suite, Windows Chrome QA và immutable-core hashes là bằng chứng thay thế.

---

## [2026-07-22 11:20] -- [COWORK-EXEC] Sửa engine: làm tròn 1 lần ở cuối (khớp kế toán/FIN)

**Ai + vì sao:** Claude thực thi trực tiếp (Codex hết session). Đối chiếu 5 người COM thật với Excel FIN lộ **lệch −1đ** ở 1 người (Trần Văn Hiếu) do engine **làm tròn VND ở mỗi khối tiền**, trong khi FIN giữ số lẻ tới cuối. Chairman yêu cầu "không được lệch".

**Đã sửa (chỉ chính sách làm tròn, KHÔNG đổi logic công thức):**
- `js/core/registry.js`: bỏ `round()` trong `scan_sum`, `percent_of`, `macro.waterfall` (dòng + total), `macro.kae_pool`, `negate`, và không pre-round `taxableIncome`. GIỮ `round()` ở: khối **"Làm tròn VND"** (explicit), **thuế** (progressive + flat — FIN cũng tròn thuế), tham số target.
- `js/core/engine.js` (`calculatePerson`): component/gross/penalty/adjustment **giữ số lẻ**; chỉ **làm tròn ở net cuối** + tròn cho các field hiển thị.
→ Kết quả: khối tiền carry precision, tròn 1 lần ở đầu ra = đúng cách kế toán tính tay.

**Verification (node, thuần logic — runtime Windows giao Codex/Chairman):**
- `node --test test/*` = **37/37 pass** (thêm `test/v3_rounding.test.js` khoá chính sách).
- Demo `presets/trustana-q1-demo.json` KHÔNG hồi quy: NET 11.650.000 / 2.880.000 / 1.900.000.
- **Đối chiếu 5 người COM thật qua đúng đường app** (discover→materialize→runPreset): **5/5 lệch = 0** (Hoài 156.942.766 · Phạm Trần Hiếu 20.078.187 · Trần Văn Hiếu 12.516.386 · Lê Thị Hằng 31.211.090 · Kim Thanh Thư 37.658.043).

**HASH BASELINE MỚI (thay baseline cũ đã dùng ở các REVIEW trước):**
- engine.js SHA-256 16 đầu: `b60cc43d997560cb`
- registry.js SHA-256 16 đầu: `2bad54be7aae7187`
→ **Codex lưu ý:** engine/registry ĐỔI CÓ CHỦ ĐÍCH lần này; đừng cờ đỏ. Directive #6 vẫn giữ nguyên (canvas không đụng engine); baseline đối chiếu từ nay là hash trên. Runtime-verify trên Windows: chạy `npm test` + nạp preset demo xác nhận số.

**Còn treo:** đối chiếu nhánh KAE/BO trên người thật (làm khi cần) + dựng preset Trustana thật đầy đủ.

## [2026-07-22 12:40] -- REVIEW (Claude/CEO): Nghiệm thu #6 (canvas + map-lookup + nhóm xuất) -- ĐẠT

**Verdict: ĐẠT.** App coi như hoàn thiện tính năng.

**Kiểm chứng độc lập:**
- `node --test` 39/39 pass.
- **engine.js hash = b60cc43d... KHÔNG đổi** → chính sách làm-tròn [11:20] còn nguyên; Codex chỉ thêm block vào registry (đúng ngoại lệ Directive).
- Khối mới `map_lookup` ("Gắn cột tra cứu"): table→table, gắn cột phái sinh có type-check, không sửa dữ liệu Excel gốc. Đúng yêu cầu (app tự suy Mức được).
- `categories.js`: bỏ hardcode CATEGORY_RULES (=0) → nhóm xuất theo component recipe.
- KHÔNG hồi quy: demo `trustana-q1-demo.json` NET 11.650.000/2.880.000/1.900.000; **đối chiếu 5 người COM thật qua đường app vẫn 5/5 lệch=0**.
- Canvas node-graph + kéo mũi tên + Fit/popup fixes; QA Chrome 1440/1280 0 lỗi.

**Còn lại (không chặn):** dựng preset Trustana đầy đủ (dùng map-lookup auto-tier) + mang số qua Excel mẫu để Chairman test nhanh → rồi git giao FIN.

---

## [2026-07-22 16:09] -- Khối map-arithmetic + phạt auto + sample/README/hygiene -- REPORT

**Done:**
- Thêm đúng một primitive `map_arithmetic` / **Tính cột** (`Table -> Table`) vào registry. Hai toán hạng hỗ trợ field hoặc hằng `Money/Number/Percent`, bốn operator `+ - * /`; executor clone từng row và gắn derived field, không mutate source. Validator đăng ký derived field theo chuỗi, suy luận type, chặn field thiếu, type algebra sai, duplicate derived id và literal chia 0. UI canvas có block thứ 19, field picker đọc được derived field của node trước, config nội bộ `derivedFieldId` không lộ ra Finance UI.
- Cập nhật `presets/trustana-q1.json`: cả recipe Phạt và nhánh tính thuế đều dùng `Doanh thu sau thuế × Số tháng quá hạn`, tiếp tục `× 1%`, rồi `Quét + Tổng`. Schema fingerprint khớp sample mới và không còn field `Phạt dòng`.
- Tạo `INPUT-Incentive-mau.xlsx` tại root bằng `@oai/artifact-tool`: 4 sheet, 24 field, 17 dòng dữ liệu; bỏ cột `Phạt dòng`; đổi tên người thành `Nhân viên 01`, khách hàng thành `Khách hàng 01..04`; mọi numeric ở Jobs/Nhân sự/Công nợ giữ nguyên. Hai workbook FIN trong `docs/` chỉ được đọc và vẫn nguyên kích thước.
- Viết lại README theo luồng kinh doanh 3 bước, icon, bảng nhóm khối, hướng dẫn `Tính cột`, preset, export và privacy; hai link local đều tồn tại. `.gitignore` chỉ mở ngoại lệ cho sample root đã ẩn danh, vẫn ignore mọi workbook khác.
- QA runner chuyển screenshot/file tạm sang `%TEMP%`; cập nhật test và browser flow sang sample/preset chính thức. Engine, rounding, 15 primitive cũ và 3 macro cũ không đổi.

**Architecture decisions:** Giữ `map_arithmetic` là primitive row-map độc lập trong registry, không thêm nhánh riêng vào engine. Type algebra nằm trong helper export của registry để validator và UI dùng chung; phép ba toán hạng được biểu diễn bằng hai node liên tiếp thay vì config expression động. Derived id vẫn là metadata preset, còn value chỉ tồn tại trong row clone runtime. Đây là đường ít blast radius nhất và giữ nguyên execution/topological contract hiện hữu.

**Files changed:** `.gitignore`, `README.md`, `INPUT-Incentive-mau.xlsx`, `index.html`, `js/app.js`, `js/core/registry.js`, `js/core/validator.js`, `presets/trustana-q1.json`, `scripts/app_browser_runner.js`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.

**Verification:**

```text
node --check js/core/registry.js js/core/validator.js js/app.js scripts/app_browser_runner.js
=> all exit 0

npm.cmd test
=> tests 40; pass 40; fail 0

node --test
=> tests 42; pass 42; fail 0

npm.cmd run qa
=> status pass; file://; 4 sheets; 24 fields; 19 blocks
=> trustanaNets [12516386]; mapArithmeticUiVerified true
=> Chrome 1440x900 + 1280x800
=> consoleErrors 0; pageErrors 0; failedRequests 0; horizontalOverflow 0
=> POST_CLEANUP_REPO_TMP_ABSENT

Official sample + preset, real app path discover -> materialize -> validate -> runPreset:
=> validation true
=> penalty 2676672
=> net 12516386
=> delta 0

Sample privacy/numeric verification against read-only source:
=> sourceOverlap 0
=> anonymous employee ["Nhân viên 01"]
=> anonymous customers ["Khách hàng 01".."Khách hàng 04"]
=> debtHeaderCount 4; no `Phạt dòng`
=> numericPreserved { jobs:true, people:true, debt:true }

SHA-256:
=> engine.js B60CC43D997560CB74746ED0FA79B98705EFF3907225DBF982261CF0068AE090 (unchanged)
=> registry.js 77548B8AFE5212FB0C94C65B337072B31B7E564A81BD126E43DB2F6528B1BC36
=> INPUT-Incentive-mau.xlsx 237C961EECC849133B221B6029258876C5A20D6EFE96765D5F806BFC9A33C2F0
=> trustana-q1.json B1E4D363A9DA5130D57835F0767D6B9695232D64E15A3D8C6907691CF18CC1DC

Real FIN inputs retained:
=> docs/INPUT-real-TVH.xlsx 12620 bytes
=> docs/2026Q1_Incentive- (TEST) - Copy.xlsx 894723 bytes
=> .git metadata absent; no commit was created; `.gitignore` continues to ignore these files
```

**Cleanup executed (Windows Recycle Bin, recoverable):**
- `tmp/` -- generated browser screenshots, downloads and scratch QA outputs.
- `docs/INPUT-Incentive_mau.xlsx` -- obsolete duplicate sample.
- `presets/trustana-q1-demo.json` -- obsolete duplicate preset.
- `INPUT-Incentive-mau.xlsx.inspect.ndjson` -- artifact-tool inspection sidecar.

Post-cleanup checks: all four targets absent; `tmp/` is not recreated by QA; `docs/`, `handoff/`, `log/`, `test/` retained. Rollback is restore from Windows Recycle Bin.

**Open questions for Cowork:** Nghiệm thu static cuối theo Directive [15:41]. Runtime verdict above thuộc Windows Codex jurisdiction.

**Risks/known gaps:** Repo snapshot hiện không có `.git`, nên không thể chạy `git status`/tracked-file audit; bù lại không có commit nào được tạo và policy ignore + privacy overlap scan đã được xác minh. Không còn known runtime/QA regression.

---

## [2026-07-22 15:58] -- REVIEW (Claude/CEO): Nghiệm thu map-arithmetic + phạt auto + sample + README + dọn sạch -- ĐẠT

**Verdict: ĐẠT. App hoàn thiện, sẵn sàng git → giao FIN.**

**Kiểm chứng độc lập:**
- `node --test` 42/42 pass.
- engine.js SHA-256 = **B60CC43D...** KHÔNG đổi → chính sách làm-tròn còn nguyên; Codex chỉ THÊM khối vào registry.
- Khối mới `map_arithmetic` ("Tính cột"): field/hằng × `+−×÷`, type-check, chia 0 chặn, đăng ký derived field, nối chuỗi được.
- Sample gốc `INPUT-Incentive-mau.xlsx`: **Công nợ chi tiết BỎ cột "Phạt dòng"** (chỉ còn Doanh thu sau thuế + Số tháng); ẩn danh (grep 0 tên/khách thật).
- **Đối chiếu qua đúng đường app** (sample root + `presets/trustana-q1.json`): schema adopted; **phạt app tự nhân = 2.676.672, NET = 12.516.386, lệch = 0.**
- README mới (Finance language, 3 bước). Repo dọn (tmp/ + scratch + preset cũ vào Recycle Bin); data thật FIN không sửa, gitignored.

**Toàn tuyến giờ AUTO từ dữ liệu thô:** tier (map-lookup) · phạt (map-arithmetic + quét-tổng) · incentive (waterfall/BO/KAE) · thuế — khớp FIN tuyệt đối.

**Còn lại:** git (GitHub Desktop — workspace không có `.git` nên Chairman tự commit) → giao FIN.

---

## [2026-07-23 09:24] -- Filter `thuộc danh sách` (`in`) -- REPORT

**Done:** Thêm duy nhất operator code `in` vào schema của block `filter`. Matcher tách ô Giá trị theo dấu phẩy, chấm phẩy hoặc xuống dòng, trim/bỏ mục rỗng và dùng nguyên hàm `normalized()` hiện hữu cho từng mục nên không phân biệt hoa-thường/dấu. UI hiển thị `thuộc danh sách`, preset vẫn lưu `operator: "in"`; khi chọn operator này ô Giá trị gợi ý `General, New` và giải thích ba loại dấu phân cách. Không thêm toán tử phủ định.

**Files changed:** `js/core/registry.js`, `js/app.js`, `test/v3_core.test.js`, `test/v3_acceptance.test.js`, `scripts/app_browser_runner.js`, `handoff/todo.md`, `handoff/audit.md`, `log/history.md`.

**Verification:**

```text
Baseline reproduction before fix:
=> INVALID_RECIPE / BAD_CONFIG: Lọc điều kiện: giá trị "in" không hợp lệ cho Điều kiện.

node --check js/core/registry.js js/app.js scripts/app_browser_runner.js
=> all exit 0

node --test test/v3_core.test.js
=> tests 16; pass 16; fail 0
=> filter in matches comma, semicolon, newline after case/accent normalization
=> matched ids J1/J2/J3 for General/new/Mới; excluded Khác

npm.cmd test
=> tests 41; pass 41; fail 0

node --test
=> tests 43; pass 43; fail 0

npm.cmd run qa
=> status pass; file://
=> UI option { value:"in", label:"thuộc danh sách" }
=> placeholder "General, New" verified in real settings dialog
=> Chrome 1440x900 + 1280x800
=> consoleErrors 0; pageErrors 0; failedRequests 0; horizontalOverflow 0

Official sample + presets/trustana-q1.json:
=> filterOperators [eq,neq,gt,gte,lt,lte,contains,in]
=> validation true
=> penalty 2676672
=> net 12516386
=> delta 0

SHA-256:
=> engine.js B60CC43D997560CB74746ED0FA79B98705EFF3907225DBF982261CF0068AE090 (unchanged)
=> registry.js EAB15CF0CC1E2BB957B82DF1E9206B177F851DCBD4DFF78D1894E716601E47E9
=> trustana-q1.json B1E4D363A9DA5130D57835F0767D6B9695232D64E15A3D8C6907691CF18CC1DC (unchanged)
```

Visual QA inspected `formula-settings-dialog-1440x900.png` and `formulas-1280x800.png`: dialog/canvas remain framed with no clipping or overlap. Mobile was not run because the Formula canvas is explicitly desktop-only; both supported desktop widths passed.

**Open questions for Cowork:** Không.

**Risks/known gaps:** Empty list intentionally matches nothing. Separator characters inside a literal list item are not supported, consistent with the delegated plain-text syntax. No engine, rounding, other block executor, macro or preset logic changed.

---
