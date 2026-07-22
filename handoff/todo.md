# Todo

## [2026-07-22 15:41] -- Directive: Khối map-arithmetic + phạt auto + sample ra root + README + dọn sạch (chuẩn bị giao FIN)

Codex đọc `handoff/audit.md` (REVIEW gần nhất). Việc lớn có thêm primitive → **nộp technical plan vào `handoff/audit.md` trước khi code.** Chairman ủy quyền tự chạy tới 100%.

1. **Goal + business context:** Hoàn thiện để git + giao FIN. (a) App tự tính phạt **100% từ dữ liệu thô** (`Doanh thu sau thuế × Số tháng × 1%` từng dòng) — cần 1 khối mới. (b) File mẫu (hiện `docs/INPUT-real-TVH.xlsx`) thành **sample chuẩn** ở gốc repo. (c) README dễ hiểu cho GitHub. (d) Repo **sạch**, không rác test.

2. **Rough technical direction:**
   - **THÊM 1 primitive "Tính cột" (map-arithmetic):** table→table, tạo **cột phái sinh = phép toán 2 toán hạng** (mỗi toán hạng là field hoặc hằng số) với `+ − × ÷`; type-check; đăng ký derived field ở validator (như `map_lookup`); hiện trong thư viện khối canvas. Nối chuỗi được để làm phép 3 toán hạng (VD `DT×tháng` rồi `×1%`).
   - **Cập nhật sample + preset `presets/trustana-q1.json`:** bỏ cột "Phạt dòng" khỏi sample; recipe Phạt dùng map-arithmetic tính phạt dòng rồi Quét+Tổng → ra đúng phạt.
   - **Sample ra gốc repo** làm file mẫu chính thức. **ẨN DANH** tên NV/khách hàng thật → generic (GIỮ nguyên số để vẫn khớp) vì file đang có data thật; Chairman đổi tên file sau.
   - **README:** viết lại, nhiều **icon**, **ngôn ngữ kinh doanh**, hướng dẫn 3 bước (nạp Excel → nạp preset → Tính), giải thích khối + preset; render đẹp trên GitHub.
   - **Dọn sạch:** xóa mọi file test phát sinh (tmp/, output tạm, preset/demo trùng lặp, scratch). KHÔNG đụng data thật của FIN (Chairman tự move tay).

3. **Out of scope:**
   - KHÔNG sửa 14 khối cũ + 3 macro + chính sách làm-tròn (baseline engine [11:20]); chỉ **THÊM** primitive map-arithmetic.
   - KHÔNG commit data thật (giữ `.gitignore`); KHÔNG xóa `docs/spec`, `handoff`, `log`, `test`.
   - KHÔNG đổi engine rounding, KHÔNG đổi logic tính.

4. **Acceptance criteria:**
   - Khối "Tính cột" (map-arithmetic) trong registry + thư viện canvas; type-check chặn sai kiểu; đăng ký derived field cho khối sau dùng.
   - Sample **không còn cột "Phạt dòng"**; nạp sample + `presets/trustana-q1.json` → **phạt app tự tính = 2.676.672, NET = 12.516.386** (lệch=0).
   - Sample ẩn danh (không tên thật) đặt ở gốc repo; số vẫn khớp.
   - README mới: có icon + business language + hướng dẫn 3 bước + giải thích preset/khối; đọc GitHub hiểu ngay.
   - `node --test` pass (thêm test cho map-arithmetic); QA desktop 0 lỗi console/network/overflow.
   - Repo sạch: liệt kê file đã xóa trong REPORT; grep 0 data thật committed.
   - REPORT + output verify dán vào `handoff/audit.md`.

   *Decision delegated to Codex (CTO):* config khối map-arithmetic, cấu trúc README, danh sách file dọn, tên/vị trí sample. Nộp technical plan trước.

### Technical execution plan -- Codex CTO

- [x] P0 -- khóa baseline và dữ liệu đầu vào
  - [x] Giữ nguyên `js/core/engine.js` hash `B60CC43...`; chỉ cho phép registry đổi do thêm đúng một primitive `map_arithmetic`.
  - [x] Kiểm kê workbook/preset hiện tại; không sửa hoặc xóa `docs/INPUT-real-TVH.xlsx` và `docs/2026Q1_Incentive- (TEST) - Copy.xlsx`.
- [x] P1 -- primitive `Tính cột`
  - [x] Thêm block `Table -> Table` với hai toán hạng field/hằng, operator `+ - * /`, derived id/label và type suy luận theo numeric algebra riêng của block.
  - [x] Clone row, không mutate input; đăng ký derived field trong validator/app, ẩn config nội bộ, cho field picker của block sau đọc cột phái sinh để nối chuỗi.
  - [x] Chặn sai kiểu, duplicate derived id và literal chia 0; thêm happy/chain/type/divide-by-zero/immutability tests.
- [x] P2 -- sample + preset phạt tự động
  - [x] Từ file nguồn thật chỉ đọc, tạo `INPUT-Incentive-mau.xlsx` tại root; bỏ cột `Phạt dòng`, ẩn danh tên nhân viên/khách hàng bằng nhãn generic, giữ ID/join/numeric/style.
  - [x] Cập nhật `presets/trustana-q1.json` để recipe Phạt dùng hai node `map_arithmetic` (`Doanh thu sau thuế × Số tháng`, rồi `× 1%`) và `Quét + Tổng`.
  - [x] Cập nhật test/QA sang sample root + preset chính, khóa phạt `2.676.672`, NET `12.516.386`, lệch 0.
- [x] P3 -- README và hygiene
  - [x] Viết README GitHub theo business flow, icon rõ nghĩa, hướng dẫn 3 bước, giải thích preset/khối và data privacy.
  - [x] Cho phép git theo dõi duy nhất sample root đã ẩn danh; tiếp tục ignore mọi workbook thật/khác.
  - [x] Sau verification, dọn `tmp/`, sample cũ trong `docs/` và preset demo cũ; giữ nguyên `docs/spec`, `handoff`, `log`, `test`.
- [x] P4 -- verification + handoff
  - [x] Chạy syntax/full Node/Chrome QA 1440/1280, scan privacy và repo hygiene; inspect/render đủ sheet sample.
  - [x] Dán command/output/hash/file-delete list vào REPORT, cập nhật history và test plan.

## Test Plan -- Map arithmetic + FIN handoff

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | `Money field × Number field` | Sinh derived `Money`, clone row và giữ input bất biến | pass |
| 2 | Nối `map_arithmetic` thứ hai với derived field thứ nhất × hằng `Percent` | Suy luận `Money`, downstream `scan_sum` đọc được | pass |
| 3 | Toán hạng không tương thích / literal chia 0 | Validator chặn với lỗi type/divide-by-zero | pass |
| 4 | Sample chính thức | Ở root, không cột `Phạt dòng`, không tên nhân viên/khách hàng thật, số và join giữ nguyên | pass |
| 5 | Sample + `trustana-q1.json` | Phạt `2.676.672`, NET `12.516.386`, lệch 0 | pass |
| 6 | UI canvas | Library có `Tính cột`, config field/hằng và derived label; block sau chọn được derived field | pass |
| 7 | Full regression + hygiene | Node pass; Chrome 1440/1280 0 lỗi; không CDN; repo không `tmp/`/scratch/preset demo trùng | pass |

---

## [2026-07-22 14:56] -- [AUTO] Claude update + popup alignment polish

**Goal:** Xử lý phản hồi Chairman về popup node còn lệch/icon glyph xấu, đồng thời hoàn tất hai update Claude vừa ghi: xác minh baseline làm tròn mới trên Windows và bổ sung primitive `map_lookup` đã được thêm vào acceptance criteria Directive 10:15.

### Technical execution plan -- Codex CTO

- [x] P0 -- khoá baseline Claude và contract primitive mới
  - [x] Xác minh Windows `node --test` 37/37 và engine hash `B60CC43...`; không sửa chính sách làm tròn mới.
  - [x] Thêm duy nhất primitive `map_lookup` kiểu `Table -> Table`: mỗi row input tra bảng đích theo khoá, clone row và gắn cột phái sinh; không mutate workbook row, fallback rõ ràng.
- [x] P1 -- UI cấu hình `Gắn cột tra cứu`
  - [x] Block xuất hiện trong thư viện, chọn được bảng đích, khoá nguồn/khoá tra/cột trả về, kiểu và tên cột mới.
  - [x] Cột phái sinh hiện trong field picker của block downstream theo nhãn người-đọc; validator biết type và edge vẫn type-check bình thường.
- [x] P2 -- popup alignment/icon polish
  - [x] Thay glyph Unicode bằng inline SVG line icon cùng stroke, kích thước và optical box; căn icon/text hàng dọc, divider và danger state.
  - [x] Menu clamp theo viewport + canvas và không bị topbar che; auto-fit graph giữ node đầu/cuối trong khung sau `Tự xếp gọn`.
- [x] P3 -- regression + handoff
  - [x] Thêm happy/edge tests cho map lookup, UI/static tests cho block/icon/menu alignment và browser gesture QA popup.
  - [x] Chạy full Node + Chrome 1440/1280; giữ NET demo 11.650.000 / 2.880.000 / 1.900.000, 0 console/page/network/overflow; ghi REPORT/history và hash core mới.

## Test Plan -- Claude update + popup polish

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Row Jobs có khách hàng khớp bảng tra | `map_lookup` gắn giá trị trả về và downstream filter/sum đọc được cột mới | pass |
| 2 | Row không có khoá khớp | Gắn fallback, không mutate row/bảng nguồn | pass |
| 3 | Cấu hình block trên canvas | Field/table picker đúng scope, return type và derived label được lưu trong preset | pass |
| 4 | Chuột phải node gần cạnh canvas | Menu nằm trọn trong viewport, không bị topbar che | pass |
| 5 | Quan sát 5 action popup | SVG icon cùng 18px/stroke, icon/text căn giữa và danger row nhất quán | pass |
| 6 | `Tự xếp gọn` preset demo | Graph fit trong canvas, node đầu/cuối không bị cắt | pass |
| 7 | Full regression | 39+ tests pass; NET demo giữ nguyên; Chrome 1440/1280 0 lỗi/overflow | pass |

---

## [2026-07-22 12:56] -- [AUTO] Finance-first minimal UX completion

**Goal:** Hoàn thiện luồng Input -> Công thức -> Tính theo phản hồi Chairman: bỏ đối tượng giao diện trùng/thừa, gom định danh chủ thể vào đúng sheet, dành phần lớn diện tích cho canvas, làm node/edge thao tác trực tiếp được, và sinh bảng/PDF/XLSX từ recipe thay vì hardcode COM/KAE. Chỉ thay lớp frontend, adapter hiển thị và exporter; không đổi engine/registry/operator/node id hoặc preset demo.

### Technical execution plan -- Codex CTO

- [x] P0 -- khóa contract và tối giản cấu trúc
  - [x] Giữ nguyên hash engine/registry và NET mẫu; mọi metadata mới nằm ở `recipe.meta.presentation` hoặc `node.meta.canvas` để core bỏ qua.
  - [x] Bỏ Subject Bridge riêng và radio từng card; sheet đang được chọn làm đối tượng tính hiển thị trực tiếp ba ánh xạ `Mã định danh / Tên hiển thị / Nhóm phân tích`.
  - [x] Đưa selector `Tính cho` sang tab Tính; đổi sheet sẽ phục hồi mapping hợp lệ hoặc tự gợi ý lần đầu, không tự ghi đè mapping hợp lệ.
- [x] P1 -- canvas tối giản và thao tác trưởng thành
  - [x] Đưa recipe name/role lên toolbar; component/type/delete vào progressive disclosure; chuyển `Tự xếp gọn` vào toolbar graph.
  - [x] Bỏ stripe màu và type label lặp; dot cạnh tên là health status, viền tím là selection, cam chỉ cho kết quả/hover chi tiết.
  - [x] Cho kéo node từ toàn thân card, resize chiều rộng lưu tại `node.meta.canvas.width`, wrap text dài; alias tên macro/port thuần Việt và cho đổi tên instance.
  - [x] Edge có hit path trong suốt, hover + endpoint handle, kéo đầu/cuối để reconnect, chuột phải để ngắt; recipe rỗng phải xóa sạch edge/ghost/transient state.
  - [x] Settings macro hiển thị `Khối dựng sẵn`, cho sửa tên hiển thị/config và xem công thức mô tả read-only; không mở khóa registry/logic.
- [x] P2 -- kết quả và export theo recipe
  - [x] Sinh cột kết quả theo component/role recipe, dùng tên khoản hiển thị; recipe không có Phạt/Thuế thì không có cột tương ứng; `Thực nhận` luôn là cột hệ thống.
  - [x] Dùng cùng metadata cho nút xuất nhóm, XLSX chi tiết và PDF; tiếng Việt có dấu, không còn danh sách legacy Sales/KAM/BO hardcode.
  - [x] Căn phải header số, sửa header/toolbar lệch và tăng badge bước 1-4.
- [x] P3 -- regression và QA
  - [x] Unit/static test cho subject selection/mapping, recipe presentation, node width, edge hit/reconnect/empty cleanup và result/export columns động.
  - [x] Browser QA thao tác thật selector subject, resize/drag node, nắm edge reconnect/ngắt, rename macro, xóa recipe, kiểm tra bảng/PDF/XLSX.
  - [x] Chạy `node --test`, `npm.cmd run qa`, preset/workbook NET 11.650.000 / 2.880.000 / 1.900.000, 1440/1280 zero console/page/network/overflow, so hash core và ghi REPORT/history.

## Test Plan -- Finance-first minimal UX completion

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Input có 4 sheet | Không radio/Subject Bridge riêng; card chủ thể có đúng 3 ánh xạ, header cột không lặp prefix sheet | pass |
| 2 | Đổi `Tính cho` ở tab Tính | Ba ánh xạ dùng field của sheet mới; mapping hợp lệ đã lưu được phục hồi | pass |
| 3 | Formula toolbar | Recipe metadata ở trên, auto-arrange đi cùng zoom; canvas là vùng lớn nhất | pass |
| 4 | Node complete/incomplete/error/selected/result | Dot xanh/cam/đỏ, viền tím selection, badge cam result; không stripe/type label thừa | pass |
| 5 | Kéo node và resize | Nắm mọi vùng không phải port/control đều kéo; width 180-420px lưu trong metadata và text wrap | pass |
| 6 | Hover/nắm cạnh và reconnect | Hit target rộng, endpoint hiện khi hover; reconnect source/target type-check; drop hụt giữ edge cũ | pass |
| 7 | Xóa recipe cuối | Canvas empty không còn path/ghost/context/dialog/transient state | pass |
| 8 | Macro dựng sẵn | Đổi tên instance + config được; tab Công thức cho xem mô tả công thức, registry không đổi | pass |
| 9 | Preset không có component Phạt | Bảng/PDF/XLSX không có dòng/cột Phạt; thêm recipe thì tự xuất hiện theo tên hiển thị | pass |
| 10 | Full regression | 32+ tests pass; NET mẫu giữ nguyên; Chrome 1440/1280 zero lỗi/overflow; core hash giữ nguyên | pass |

---

## [2026-07-22 11:46] -- [AUTO] Canvas interaction refinement after Chairman feedback

**Goal:** Làm graph editor hành xử như infinite canvas trưởng thành: zoom/fit, ghost arrow bám chuột, reconnect edge, context menu node và settings theo yêu cầu; đồng thời bỏ inspector phải cố định để canvas rộng hơn. Chỉ frontend/preset metadata, không đổi engine/registry/logic.

### Technical execution plan -- Codex CTO

- [x] P0 -- chuẩn hóa layout và visual semantics
  - [x] Gom Subject Bridge + Recipe thành control row; bỏ inspector phải cố định, chuyển settings thành dialog mở bằng double-click/context menu; canvas giữ library trái và chiếm toàn bộ phần còn lại.
  - [x] Dùng cùng một chevron SVG cho `<select>` và Subject Bridge; giữ tím cho identity/selection, xanh cho node/port đã đủ kết nối, cam cho thiếu input/output, đỏ chỉ cho lỗi validator/drop sai.
- [x] P1 -- camera zoom/pan
  - [x] Thêm `canvasZoom` session state, nút − / % / + / Fit, Ctrl+wheel và `Shift+1`; zoom neo theo con trỏ, transform/grid/edge/node coordinate cùng một camera.
  - [x] Clamp 50%-160%, fit graph theo bounds và không ghi zoom vào preset.
- [x] P2 -- connection UX và reconnect
  - [x] Ghost bezier có arrowhead + cursor badge đi theo chuột; compatible input sáng xanh, invalid target đỏ và luôn có lý do.
  - [x] Kéo output mới vào input đã nối để đổi source; kéo input đã nối sang input khác để đổi target; commit atomically vào `node.inputs`, thả hụt giữ nguyên edge cũ.
- [x] P3 -- node actions
  - [x] Chuột phải node mở menu có Cài đặt, Nhân bản, Zoom vào khối, Ngắt mọi kết nối, Xoá; clamp menu trong viewport, click ngoài/Escape đóng.
  - [x] Double-click mở settings; duplicate dùng node id mới + offset metadata, không sửa registry/block contract.
- [x] P4 -- tests, visual QA và handoff
  - [x] Bổ sung unit/static/browser regressions cho zoom math, reconnect source/target, ghost cursor, context menu/dialog, duplicate/delete và color states.
  - [x] Chạy Node tests + Chrome 1440/1280; nạp preset/workbook thật giữ NET 11.650.000 / 2.880.000 / 1.900.000; 0 console/page/network/overflow; so core hash và ghi REPORT/history.

## Test Plan -- Canvas interaction refinement

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Subject Bridge và select | Cùng chevron, kích thước/căn lề nhất quán | pass |
| 2 | Nút −/%/+/Fit và Ctrl+wheel | Zoom 50%-160%, neo con trỏ, grid/node/edge không lệch | pass |
| 3 | Kéo output qua canvas | Ghost bezier có đầu mũi tên và badge theo con trỏ | pass |
| 4 | Hover/drop input hợp lệ hoặc sai kiểu | Hợp lệ xanh; sai đỏ + lý do; không tạo edge sai | pass |
| 5 | Kéo output khác vào input đã nối | Source của input được thay atomically | pass |
| 6 | Kéo input đã nối sang input khác | Target đổi; thả hụt giữ edge cũ | pass |
| 7 | Chuột phải node | Menu trong viewport; settings/duplicate/zoom/disconnect/delete hoạt động và đóng đúng | pass |
| 8 | Double-click node | Dialog settings mở; sửa field/literal/config giữ behavior hiện hữu | pass |
| 9 | Node complete/incomplete/error/selected | Xanh/cam/đỏ/tím đúng vai trò, không phụ thuộc category ngẫu nhiên | pass |
| 10 | Full regression | 30+ tests pass; NET giữ nguyên; Chrome 1440/1280 không lỗi/overflow | pass |

---

## [2026-07-22 10:15] -- Directive: Canvas dựng công thức (node graph, kéo mũi tên nối) — làm SAU khi #5 [09:22] xong

Codex đọc `handoff/audit.md` (REVIEW gần nhất). #5 đã có REVIEW ĐẠT [10:28] → gate mở. **Chairman ủy quyền Codex chạy tự chủ tới hoàn thiện 100%:** ghi technical plan vào `handoff/audit.md` làm hồ sơ rồi **tự triển khai + tự quyết**, không chờ duyệt từng bước; Claude chỉ nghiệm bản cuối. Việc lớn đổi paradigm màn Công thức **+ dọn nốt nhóm-xuất-theo-recipe** (mục 5 bổ sung).

1. **Goal + business context:** Màn Công thức hiện là danh sách khối dọc + nối bằng dropdown "chọn nguồn" ẩn → user không nhìn ra cấu trúc công thức, thấy "quá kỹ thuật". Chuyển sang **canvas node graph**: mỗi khối là 1 thẻ trên canvas, nối nhau bằng **kéo mũi tên output→input**, nhìn là hiểu luồng tính (A→B→D, C→D). Người non-tech tự ráp được công thức như vẽ sơ đồ.

2. **Rough technical direction:** Chỉ dựng lại **frontend** màn Công thức thành canvas; đọc/ghi đúng `node.inputs` (kind node/field/literal) + thêm toạ độ node vào metadata preset (engine bỏ qua). **Offline `file://`, không CDN** — tự dựng SVG hoặc vendor lib canvas, Codex quyết. **Desktop-only** (bỏ mobile).

3. **Out of scope:**
   - KHÔNG sửa logic 14 khối + 3 macro cũ, KHÔNG đổi chính sách làm-tròn (baseline engine [11:20]); số KHÔNG hồi quy. **NGOẠI LỆ được phép:** thêm **1 primitive mới "Gắn cột tra cứu" (map-lookup)** vào registry (xem mục 4).
   - KHÔNG nới type-check (nối sai kiểu vẫn phải chặn).
   - KHÔNG mobile; KHÔNG persist/commit data thật.
   - KHÔNG đổi tab khác (Input/Tính/Dashboard) trừ phần dùng chung.

4. **Acceptance criteria:**
   - Tab Công thức là **canvas nền lưới-chấm** (kiểu Obsidian): kéo khối từ Thư viện → tạo node trên canvas; node **bám lưới**, kéo di chuyển được.
   - Nối 2 node bằng **kéo mũi tên từ cổng output sang cổng input**; đường nối là **bezier cong mềm**; thả vào cổng sai kiểu (VD Money vào cổng Percent) bị **chặn + báo lý do** (không tạo nối).
   - **Khối cuối (không có mũi tên đi ra) tự đánh dấu "= KẾT QUẢ"** — bỏ hẳn checkbox "khối kết quả"; nếu công thức chưa khép (>1 nhánh treo) thì báo lỗi rõ.
   - Nút **"Tự xếp gọn"** dàn node trái→phải cho thẳng.
   - **SUBJECT BRIDGE thu thành dải gập nhỏ**; RECIPE + quản lý recipe gọn; **canvas là vùng lớn nhất**. Click node → panel Cài đặt khối bên phải (tham số + literal).
   - Nạp lại `presets/trustana-q1-demo.json` (không có toạ độ) → app **tự xếp gọn** rồi tính vẫn ra NET **11.650.000 / 2.880.000 / 1.900.000** (không hồi quy).
   - `node --test` pass; QA desktop (1440/1280) 0 lỗi console/network/overflow.
   - **Nhóm xuất theo recipe (gộp từ #7):** bỏ hardcode 3 nhóm COM/Khác/BO trong `js/export/categories.js`. Nhóm xuất **tự sinh theo component "thu nhập" của preset** (mọi component trừ phạt/thuế/điều chỉnh), mỗi component = 1 nhóm, tên nhóm theo component. Quan sát: preset demo có component **KAE riêng → xuất có nhóm KAE riêng** (không nhét vào "Khác"); thêm/bớt recipe → danh sách nhóm đổi theo. Không đổi engine, không hồi quy số.
   - **THÊM 1 primitive mới "Gắn cột tra cứu" (map-lookup):** với mỗi dòng bảng A, tra bảng B theo khoá → gắn giá trị trả về thành **một cột phái sinh** trên bảng A. Khác khối "Tra bảng" hiện tại (vô hướng, 1 khoá→1 giá trị). VD: mỗi job tra Khách hàng theo tên KH → gắn cột "Mức" → app **tự suy tier**, FIN khỏi điền tay. Khối này hiện trong thư viện canvas, qua type-check, và bind được bảng bất kỳ. **CHỈ THÊM khối mới — KHÔNG sửa 14 khối + 3 macro cũ, KHÔNG đổi chính sách làm-tròn (baseline engine mới [11:20] giữ nguyên).**
   - REPORT + output verify dán vào `handoff/audit.md`.

   **Yêu cầu thẩm mỹ (bám Obsidian Canvas + brand Trustana):**
   - Canvas nền **lưới chấm mờ**, pan được, thoáng.
   - Node = thẻ **bo góc mềm (~12px), viền mảnh, shadow nhẹ**, tiêu đề khối + **chấm màu theo nhóm** (Nguồn/Dữ liệu/Tính toán/Logic như thư viện hiện có).
   - Cổng nối = **chấm tròn** cạnh phải (output) / cạnh trái (input), hover phóng nhẹ; kéo ra **đường cong "ma"** theo con trỏ.
   - Mũi tên **bezier mềm**, màu tím Trustana trung tính, hover sáng; đầu mũi tên nhọn nhẹ; nối sai kiểu → đường **đỏ**.
   - Node kết quả **viền/nhãn cam Trustana "= KẾT QUẢ"**. Trạng thái node: xanh hợp lệ · vàng cảnh báo · đỏ lỗi.
   - Chuyển động **mượt** (kéo/nối/tự-xếp có transition, easing nhẹ). Giữ font hiện hành, phẳng-thoáng, tránh AI slop.

   *Decision delegated to Codex (CTO):* thư viện canvas (tự SVG vs vendor), lưu toạ độ node, thuật toán auto-arrange, hit-test cổng nối, cách suy nhóm-xuất từ component + tên nhóm. Codex tự quyết + tự triển khai tới 100%, Claude nghiệm bản cuối.

### Technical execution plan -- Codex CTO

- [x] P0 -- khóa contract và dựng graph utility thuần frontend
  - [x] Giữ hash `engine.js`/`registry.js`; không sửa core execution, block definitions hoặc preset demo.
  - [x] Thêm utility DOM/SVG offline cho snap-grid, edge list, sink detection, bezier path và auto-arrange trái→phải; toạ độ lưu tại `node.meta.canvas` để schema v3 cũ vẫn tương thích.
  - [x] Preset không có toạ độ được auto-arrange trong RAM; serializer hiện có giữ metadata và tiếp tục chặn dữ liệu thật.
- [x] P1 -- canvas node graph desktop
  - [x] Thay danh sách dọc bằng workspace 3 vùng: thư viện gọn, canvas lưới-chấm lớn, inspector phải; Subject Bridge thành dải `<details>` gập nhỏ.
  - [x] Kéo block vào canvas để tạo node; kéo node có snap-grid; pan nền; `Tự xếp gọn` dùng topological depth.
  - [x] Render cổng input/output và SVG bezier; kéo output→input tạo `node.inputs[port] = {kind:'node', nodeId}` sau khi validator hiện hữu chấp nhận; mismatch/cycle bị chặn và báo lý do.
  - [x] Sink duy nhất tự cập nhật `recipe.output`; >1 sink đặt trạng thái chưa khép và chặn lưu/tính; bỏ hoàn toàn checkbox output thủ công.
- [x] P2 -- visual polish và recipe workflow
  - [x] Node có màu nhóm, trạng thái valid/warning/error, badge `= KẾT QUẢ`, hover/focus/drag/ghost edge theo tím-cam Trustana.
  - [x] Inspector chỉ dùng dropdown cho field/literal; liên kết node được nhìn và ngắt tại cổng, không còn nối ẩn bằng dropdown.
  - [x] Recipe/preset controls giữ semantics hiện có nhưng thu gọn để canvas chiếm vùng lớn nhất; desktop 1440/1280 không overflow.
- [x] P3 -- nhóm xuất động theo component recipe
  - [x] Suy danh sách component theo thứ tự recipe, loại `penalty`/`tax`/`adjustment`, gộp recipe trùng component; render nút xuất động sau khi tính.
  - [x] Lọc từng nhóm bằng `person.components[component]`, tên file/sheet theo component; KAE là nhóm riêng và thêm/bớt recipe làm danh sách thay đổi.
- [x] P4 -- verification và handoff
  - [x] Unit test graph layout/sink/bezier + type mismatch/cycle; export component happy path và exclusion edge case.
  - [x] Browser QA thao tác kéo block, kéo node, nối hợp lệ, chặn nối sai kiểu, auto-arrange, pan, output tự động, preset metadata và export KAE.
  - [x] Nạp preset/workbook thật, xác nhận NET 11.650.000 / 2.880.000 / 1.900.000; `node --test`, `npm test`, QA 1440/1280 0 console/network/overflow; so hash và ghi REPORT/history.

## Test Plan -- Formula Canvas + dynamic recipe exports

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Nạp preset demo không có `node.meta.canvas` | Tự xếp node trái→phải, snap 24px, không đổi node id/input/config | pass |
| 2 | Kéo block từ thư viện vào canvas và kéo node | Node mới xuất hiện đúng vị trí; di chuyển bám lưới; toạ độ nằm trong metadata preset | pass |
| 3 | Kéo output Money vào input Money/Any hợp lệ | Tạo đúng `{kind:'node', nodeId}` và render bezier tím | pass |
| 4 | Kéo output Money vào input Percent hoặc tạo cycle | Không sửa `node.inputs`; ghost/port đỏ và toast nêu lý do | pass |
| 5 | Graph có đúng một sink / nhiều sink | Một sink tự `= KẾT QUẢ`; nhiều sink báo chưa khép và chặn lưu/tính | pass |
| 6 | Bấm `Tự xếp gọn` và pan canvas | Node dàn theo dependency, edge cập nhật, canvas pan được | pass |
| 7 | Preset component COM/BO/KAE + penalty/tax | Nút nhóm sinh COM/BO/KAE; không sinh penalty/tax; KAE lọc theo `person.components.kae` | pass |
| 8 | Thêm/bớt recipe thu nhập | Danh sách nút nhóm đổi theo component mà không sửa exporter hardcode | pass |
| 9 | Preset demo + workbook mẫu | NET = 11.650.000 / 2.880.000 / 1.900.000 | pass |
| 10 | Full Node + browser QA desktop | Tests pass; 1440/1280 0 console/page/network/overflow; canvas/SVG không blank | pass |

---

## [2026-07-22 09:52] -- [AUTO] Rà soát UX control và chuẩn hóa tên file xuất

**Goal:** Sửa các lỗi nhìn thấy trong 4 ảnh Chairman gửi: caret select lệch, badge bước và pill Offline thừa, thuật ngữ BK/BKê không chuẩn, và nhãn JSON chưa giải thích được nội dung. Giữ nguyên công thức/preset/engine và số tính.

### Technical execution plan -- Codex CTO

- [x] P0 -- control/header cleanup
  - [x] Chuẩn hóa caret + right padding cho mọi `select`; kiểm cả recipe picker, output type, entity và inspector.
  - [x] Bỏ toàn bộ step-note bên phải ở Công thức/Tính/Dashboard và bỏ pill Offline cố định.
  - [x] Đổi nhãn Kỳ thành Kỳ báo cáo, ghi rõ kỳ chỉ đi vào metadata/tên file xuất, không tự tính lại số liệu.
- [x] P1 -- generic export language
  - [x] Đổi BK/BKê thành `Tổng hợp chi trả` và `Nhóm COM/Khác/BO` ở nút, workbook sheet/header và filename.
  - [x] Đổi `Job JSON` thành `Dữ liệu job · JSON`, `Report JSON` thành `Báo cáo đầy đủ · JSON`; thêm tooltip mô tả khác biệt.
  - [x] Giữ internal export functions/shape tương thích; không đổi dữ liệu hoặc phép tính trong file.
- [x] P2 -- regression + visual QA
  - [x] Test filename/sheet generic, payload Job-only vs full Report, và Q1→Q2 phản ánh trong cả filename/payload.
  - [x] Chạy `node --test`, preset/workbook guardrail NET, QA 4 viewport, kiểm caret/overflow/console/network và xem ảnh trực tiếp.
  - [x] So hash engine/registry; ghi REPORT + verification vào audit/history.

## Test Plan -- UX follow-up from Chairman screenshots

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Mọi select desktop/mobile | Caret cách mép phải ổn định, không đè border/nút kế bên | pass |
| 2 | Heading 4 tab + topbar | Không còn step-note 02/03/04 hoặc pill Offline | pass |
| 3 | Xuất Excel | Không còn nhãn/tên file/sheet BK hoặc BKê; dùng tên generic | pass |
| 4 | Đổi Kỳ báo cáo Q1→Q2 sau khi tính | Job data và full report JSON có filename + `quarter` Q2; số liệu không tự tính lại | pass |
| 5 | Hai JSON export | Job data chỉ có danh sách job + metadata; full report có totals/person/job/preset/validation/trace | pass |
| 6 | Regression tài chính | NET vẫn 11.650.000 / 2.880.000 / 1.900.000 | pass |
| 7 | Full Node + browser QA | Tests pass; 4 viewport 0 console/page/network/overflow | pass |

---

## [2026-07-22 09:22] -- Directive: Dọn UX tab Công thức (nhãn người-đọc + gọn khu quản lý)

Codex đọc `handoff/audit.md` (REVIEW gần nhất). Bối cảnh: Chairman nghiệm tab Công thức (đã tính đúng số bằng preset `presets/trustana-q1-demo.json`), 6 điểm UX cần dọn. **Chỉ lớp hiển thị/bố cục — KHÔNG đổi định dạng preset, node id, operator code hay logic engine.**

1. **Goal + business context:** Tab Công thức đang phơi id/mã kỹ thuật ra mặt người dùng (node id `src/f1`, operator `eq/gt`, field id `source:Jobs::Th%C3%A1...`) và khu quản lý recipe/preset đặt khó tìm, rối. Người dùng nghiệp vụ (FIN) không đọc được. Nguyên tắc: **luôn hiển thị nhãn người-đọc, không phơi định danh nội bộ; khu điều khiển gọn, dễ tìm.**

2. **Rough technical direction:** Chỉ sửa lớp render + CSS + bố cục của tab Công thức. Bản đồ id↔nhãn dùng để hiển thị, giữ nguyên id/operator/config bên dưới. Không đụng engine/registry/schema data.

3. **Out of scope:**
   - KHÔNG đổi định dạng preset, node id, mã operator, logic 14 khối + 3 macro (preset `trustana-q1-demo.json` phải vẫn nạp + tính ra đúng số).
   - KHÔNG đổi các tab khác ngoài phần chung (font/preset controls dùng chung thì cho đồng nhất).
   - KHÔNG persist/commit data thật; offline.

4. **Acceptance criteria:**
   - Dropdown tham chiếu khối hiển thị **tên khối người-đọc** (vd "Lọc: Team = COM", "Tổng GP Mức 1"), không phải node id `src/f1/wf`.
   - Dropdown điều kiện hiển thị **tiếng Việt**: bằng / khác / lớn hơn / lớn hơn hoặc bằng / nhỏ hơn / nhỏ hơn hoặc bằng / chứa (giá trị lưu vẫn eq/neq/…).
   - Entity map: mỗi field hiển thị dạng **"Sheet · Header"** người-đọc, KHÔNG còn chuỗi `source:...%C3...` mã hoá.
   - Nút quản lý recipe (chọn recipe · + Recipe · Xoá recipe · tên khoản/component/kiểu) **chuyển xuống dưới**, dễ tìm; **font dropdown recipe đồng nhất** với phần còn lại.
   - **Xoá** panel/nhãn "Khai báo bảng và định danh" thừa ở góc phải.
   - Khu preset còn **đúng 2 nút**: **"Nạp preset"** (nạp file, app tự nhớ qua phiên — localStorage là cache ngầm, KHÔNG có nút "lưu vào máy" riêng) và **"Lưu preset"** = xuất file JSON để backup/chia sẻ. Bỏ nút thừa. Nếu nút nào bị khoá phải hiện lý do.
   - Nạp lại `presets/trustana-q1-demo.json` + `docs/INPUT-Incentive_mau.xlsx` → vẫn ra NET 11.650.000 / 2.880.000 / 1.900.000 (không hồi quy).
   - `node --test` pass; QA 4 viewport 0 lỗi console/network/overflow.
   - REPORT + output verify dán vào `handoff/audit.md`.

   *Decision delegated to Codex (CTO):* cách sinh nhãn người-đọc cho khối/field, bố cục mới của khu quản lý recipe + preset, cơ chế map id↔nhãn. Ghi quyết định vào REPORT.

### Technical execution plan -- Codex CTO

- [x] P0 -- khóa contract và nhãn hiển thị
  - [x] Ghi hash `js/core/engine.js` + `js/core/registry.js`; chỉ sửa HTML/CSS/renderer, không đổi preset JSON, node id hay operator code.
  - [x] Thêm mapper hiển thị thuần UI cho node reference, operator và field; giá trị `value`/config bên dưới giữ nguyên.
- [x] P1 -- dọn bố cục Công thức
  - [x] Chuyển chọn/tạo/xóa/metadata recipe xuống dưới danh sách khối và đồng nhất font control.
  - [x] Rút khu preset còn đúng `Nạp preset` và `Lưu preset`; nạp file cache ngầm qua phiên, lưu là tải JSON, nút khóa có lý do.
  - [x] Bỏ step-note `Khai báo bảng và định danh` thừa; giữ layout responsive và `[hidden]` semantics.
- [x] P2 -- regression và browser QA
  - [x] Bổ sung test happy path + edge case cho nhãn người-đọc, mã lưu bất biến, semantics preset và disabled reason.
  - [x] Nạp `presets/trustana-q1-demo.json` + `docs/INPUT-Incentive_mau.xlsx`, xác nhận NET 11.650.000 / 2.880.000 / 1.900.000.
  - [x] Chạy `node --test test/*`, QA 1440x900 / 1280x800 / 390x844 / 360x740, kiểm console/network/overflow và so hash lõi.

## Test Plan -- Formula UX cleanup

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Mở preset Trustana ở tab Công thức | Node/field/operator chỉ hiện nhãn người-đọc; không phơi `src/f1/wf`, `eq/neq` hoặc field id mã hóa | pass |
| 2 | Đổi tham chiếu/operator trong inspector | UI tiếng Việt nhưng preset trong RAM vẫn giữ nguyên node id và operator code | pass |
| 3 | Quản lý recipe và preset | Recipe controls nằm dưới flow; khu preset đúng 2 nút với semantics nạp+cache ngầm và tải JSON | pass |
| 4 | Nút `Lưu preset` chưa hợp lệ | Nút bị khóa và có lý do đọc được bằng tooltip/assistive text | pass |
| 5 | Preset + workbook mẫu | NET từng người = 11.650.000 / 2.880.000 / 1.900.000 | pass |
| 6 | Full Node suite | `node --test test/*` pass | pass |
| 7 | Browser QA 4 viewport | 0 console/page/network error và 0 horizontal overflow | pass |

---

## [2026-07-21 16:34] -- Directive: Mở lớp data-model — user tự khai N bảng + lookup chéo bảng

Codex đọc `handoff/audit.md` (REVIEW gần nhất). **Việc lớn đổi kiến trúc lớp bridge → nộp technical plan vào `handoff/audit.md` trước khi code.** Test target: `docs/INPUT-Incentive_mau.xlsx` (4 sheet: Jobs · Nhân sự · Khách hàng · Công nợ & Điều chỉnh).

1. **Goal + business context:** App hiện đóng cứng đúng 2 thực thể `jobs` + `roster`; sheet khác bị `ignore`, và không lookup được sang bảng thứ 3. Vì thế không tái hiện được VLOOKUP-chéo-sheet của Excel (suy Tier từ Khách hàng, đọc phạt từ Công nợ) và không hợp mô hình mọi công ty. Cần **mở lớp data-model cho user tự định nghĩa**: khối tính (14+3) là bảng chữ cái cố định — đúng; nhưng **bảng/định danh/quan hệ mỗi công ty một kiểu, phải để user tạo, không map vào khuôn cứng**.

2. **Rough technical direction:**
   - Bỏ giới hạn role cứng `jobs/roster/ignore` → **N bảng do user khai** (mỗi sheet = 1 thực thể có tên/vai trò user đặt).
   - User chọn **1 bảng "chủ thể tính"** (engine lặp per-row bảng đó ra 1 kết quả/dòng — vd Nhân sự → 1 kết quả/người); các bảng còn lại là nguồn/tra cứu.
   - Khối "Lấy nguồn" chọn **bất kỳ bảng nào**; khối "Tra bảng" lookup sang **bất kỳ bảng nào theo cột khoá** (không chỉ jobs/roster).
   - Preset lưu **mô hình N-bảng + khoá/quan hệ** (self-describing, mở rộng cơ chế binding hiện có); nạp lại file cùng định dạng → tự ướm → tính.
   - Giữ engine 14 khối + 3 macro nguyên trạng; offline `file://`; không persist dữ liệu thật.

3. **Out of scope:**
   - KHÔNG đổi logic 14 khối + 3 macro (chỉ mở lớp bảng/nguồn/lookup + adapter + UI).
   - KHÔNG biến thành BI/relational DB đầy đủ — chỉ **N bảng + lookup theo khoá**, đủ tái hiện VLOOKUP.
   - KHÔNG dựng preset Trustana thật (Claude làm sau khi bridge xong).
   - KHÔNG persist/commit dữ liệu thật; giữ offline.

4. **Acceptance criteria:**
   - Nạp file ≥3 sheet → gán mỗi sheet 1 bảng có tên/vai; **sheet thứ 3 KHÔNG bị buộc `ignore`** (quan sát: cả 4 sheet của file mẫu đều dùng được).
   - Chọn được 1 bảng làm "chủ thể tính"; đổi lựa chọn → kết quả lặp theo bảng đó.
   - Khối Tra bảng lookup **chéo bảng theo khoá**: vd job.Khách hàng → bảng Khách hàng trả về "Đã bàn giao" / ngày ký HĐ.
   - Dựng 1 công thức đọc từ **≥2 bảng khác nhau + 1 lookup chéo bảng** → ra số đúng (kịch bản nhỏ Codex tự dựng hoặc dùng file mẫu).
   - Preset lưu mô hình N-bảng + khoá; nạp lại file cùng định dạng → tự map + tính, không phải khai lại.
   - `node --test` pass; QA 4 viewport 0 lỗi console/network/overflow. Tiện thể **gỡ/lưu-trữ 7 test v2-chết** để `node --test test/*` xanh.
   - REPORT + output verify dán vào `handoff/audit.md`.

   *Decision delegated to Codex (CTO):* cấu trúc mô hình bảng/khoá, cách khai quan hệ + chọn "chủ thể tính" trên UI, cách migrate preset cũ. Nộp technical plan trước khi code.

### Technical execution plan - Codex CTO

- [x] P0 - khóa lõi + mở contract N-bảng
  - [x] Giữ nguyên byte/hash `js/core/engine.js` và `js/core/registry.js`; adapter cấp `roster` alias từ bảng chủ thể để engine hiện hữu vẫn lặp per-row.
  - [x] Mỗi sheet trở thành một entity có `tableId` ổn định, tên/vai trò user đặt, cột khóa và trạng thái chủ thể; không còn role `ignore`.
  - [x] Preset lưu `subjectTableId`, metadata N-bảng, keys và quan hệ lookup tự mô tả; migrate preset 2-role cũ mà không lưu row data.
- [x] P1 - bridge + formula builder
  - [x] Materialize toàn bộ sheet vào `tables[tableId]`; bảng chủ thể được alias vào `roster`, các source/lookup block nhận tableId động qua UI.
  - [x] Field picker nhóm theo entity; config `Lấy nguồn` và `Tra bảng` chỉ hiện bảng/cột phù hợp, lookup node sinh quan hệ target/key/return trong preset.
  - [x] Định danh kết quả tối thiểu bằng `subject.id`, tùy chọn `subject.name` và `subject.group`; đổi chủ thể làm số kết quả đổi theo đúng số dòng bảng được chọn.
- [x] P2 - visual + verification
  - [x] Port Quicksand/Montserrat local từ repo iMetriK cùng license; làm lại Input/Công thức theo nhịp operational UI, giữ Trustana purple/orange, 4 tab và Dashboard.
  - [x] Gỡ 7 test v2 chết khỏi `test/` sau khi ghi rollback; thêm regression cho workbook mẫu 4 sheet, subject switch, cross-table lookup, exact preset remap và privacy.
  - [x] Chạy `node --test test/*`, `npm.cmd test`, QA `file://` 1440x900, 1280x800, 390x844, 360x740; kiểm console/network/overflow, hash engine/registry và runtime grep.

## Test Plan - N-table model + cross-table lookup

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Nạp `docs/INPUT-Incentive_mau.xlsx` | Nhận đủ 4 sheet thành 4 entity, không entity nào bị `ignore` | pass |
| 2 | Đặt `Nhân sự` làm chủ thể | Kết quả lặp 3 dòng; đổi sang `Jobs` thì lặp 7 dòng | pass |
| 3 | Lookup `Jobs.Khách hàng` sang `Khách hàng.Khách hàng` | Trả đúng `Đã bàn giao` cho ALPHA CO | pass |
| 4 | Công thức theo nhân sự: tổng GP Jobs trừ lookup Tổng trừ Công nợ | NV01 = 120m + 50m + 30m + 0 - 1m = 199m; delta = 0 | pass |
| 5 | Lưu/nạp preset cùng workbook | Giữ 4 entity, tên/vai, khóa, chủ thể, lookup relation; exact auto-map và tính không khai lại | pass |
| 6 | Workbook lệch header | Fail-closed và yêu cầu ướm lại, không tính âm thầm | pass |
| 7 | Privacy | localStorage chỉ có preset metadata/config, không có workbook rows hoặc salary values | pass |
| 8 | Regression lõi | 14 primitive + 3 macro, engine/registry SHA256 không đổi | pass |
| 9 | Full Node suite | Sau khi gỡ 7 test v2 chết, `node --test test/*` xanh | pass |
| 10 | Browser QA 4 viewport | 4 tab; formula cross-table chạy; 0 console/network/page overflow | pass |

---

## [2026-07-21 15:01] -- Directive: Đổi mô hình dữ liệu — Excel định nghĩa schema (Input · Công thức · Tính) + làm đẹp

**SUPERSEDES** bản nháp cũ (mô hình "app đẻ Excel chuẩn" + "roster app-memory" đã BỎ). Codex đọc `handoff/audit.md` (REVIEW gần nhất) trước. Việc lớn, đổi kiến trúc lớp dữ liệu → **nộp technical plan vào `handoff/audit.md` trước khi code**.

1. **Goal + business context:** Đổi tư duy: app KHÔNG đẻ Excel chuẩn nữa. **FIN tự tạo file Excel input** (số thô từ MISA, đã gồm GP + target; nhiều sheet: job + nhân sự; tự do định dạng; % để dạng thập phân 0.08). App **nạp file → đọc header thành field → gán vào khối công thức → lưu preset**; kỳ sau nạp Excel cùng định dạng thì **tự ướm, tự tính**. Biến app thành công cụ thay Excel tính toán — nhẹ, preset tái dùng.

2. **Rough technical direction:**
   - Schema **động theo file nạp** (đa sheet); bỏ field-catalog cứng làm nguồn chân lý; source table = các sheet trong file.
   - Field picker khi tạo công thức **nhóm theo sheet** (Cột sheet Job / Cột sheet Nhân sự / Giá trị nhập tay) — hết trộn lẫn khó đọc.
   - Bind cột theo **(sheet + tên header)**; preset lưu binding đó; nạp lại file cùng định dạng → tự map → tính; **header lệch → nhắc ướm lại thủ công**, KHÔNG tính sai lặng lẽ.
   - GP + target **đọc thẳng từ Excel** (MISA chuẩn), app không recompute; app chỉ tính **lớp incentive** (14 khối + 3 macro giữ nguyên).
   - Type nhẹ (số / chữ / tiền / phần trăm-thập phân), không ép chặt — FIN tự chủ bảng.
   - Dữ liệu nhạy cảm (lương) **không persist**, chỉ sống trong phiên; chỉ **preset** (không chứa số thật) được lưu.
   - Vỏ: **bo tròn, transition mượt, hover có highlight, thoáng**; giữ brand Trustana (tím/cam, logo) + **font mới**; tránh AI slop.

3. **Out of scope:**
   - KHÔNG đổi logic engine/registry/macro (14 khối + 3 macro giữ nguyên).
   - KHÔNG còn "app đẻ Excel input" và "roster app-memory nhập 1 lần" (bỏ 2 cơ chế cũ).
   - KHÔNG persist dữ liệu roster/lương vào localStorage.
   - KHÔNG commit dữ liệu thật; KHÔNG dựng preset Trustana thật.
   - Giữ offline `file://`, không network.

4. **Acceptance criteria:**
   - Tab **Input** nạp file Excel đa sheet → app liệt kê sheet + cột từng sheet; đổi sang file có cột khác → danh sách field đổi theo (không schema hardcode).
   - Tab **Công thức**: field picker nhóm theo sheet; gán được 1 cột từ nhóm "sheet Nhân sự" và 1 cột từ "sheet Job" vào cùng công thức.
   - Lưu preset → nạp lại file cùng định dạng → **tự map + tính, không phải gán lại** (quan sát). File lệch header → hiện nhắc ướm lại, không ra số sai âm thầm.
   - GP + target lấy thẳng từ cột Excel (không có bước recompute trong luồng).
   - `node --test` pass (điều chỉnh binding trong test scenario nếu cần) — phép tính lõi vẫn đúng.
   - Style: bo góc + hover highlight + transition mượt toàn app; font mới; brand Trustana; QA 4 viewport 0 lỗi console/network/overflow.
   - Grep runtime: 0 khoá localStorage chứa dữ liệu lương/roster.
   - REPORT + output verify dán vào `handoff/audit.md`.

   *Decision delegated to Codex (CTO):* cấu trúc binding (sheet,header), độ sâu type-inference/type-check giữ lại, nơi đặt UI ướm cột, cơ chế persist preset, chọn font. Nộp technical plan trước khi code.

### Technical execution plan -- Codex CTO

- [x] P0 -- data contract + privacy boundary
  - [x] Thay adapter template cũ bằng workbook discovery đa sheet: header là schema, field id ổn định từ `(sheet, header)`, type inference nhẹ và giữ nguyên số `%` dạng thập phân.
  - [x] Mở rộng preset bằng snapshot schema, vai trò sheet và canonical bindings; chỉ preset được lưu, workbook/rows/lương chỉ sống trong RAM.
  - [x] So fingerprint sheet+header khi nạp lại; exact match tự map, mismatch khóa Tính và yêu cầu ướm lại công khai.
- [x] P1 -- workflow 3 tab
  - [x] Tab Input nạp Excel, liệt kê sheet/cột/type/row count và cho chọn vai trò `Nhân sự` / `Job` / `Bỏ qua`.
  - [x] Tab Công thức giữ builder 14 primitive + 3 macro, nhưng field picker nhóm theo từng sheet và có nhóm giá trị nhập tay; bổ sung mapping các cột định danh cần cho engine/export.
  - [x] Tab Tính dùng workbook đang nạp + preset đã map để tạo `roster/jobs`, chạy engine deterministic hiện hữu, giữ trace và các export.
- [x] P2 -- visual + verification
  - [x] Chuyển app còn đúng 3 tab, dùng `TrustanaSans` từ font TTF local, Trustana purple/orange, surface bo tròn, hover/focus/transition có chủ đích và responsive không overflow.
  - [x] Cập nhật unit/acceptance/scenario và browser runner cho auto-map, mixed-sheet picker, mismatch gate, raw GP/target và không persist dữ liệu nhạy cảm.
  - [x] Chạy `npm.cmd test`, QA `file://` tại 4 viewport, grep privacy/network/dynamic-code; dán output thật vào REPORT.

## Test Plan -- Dynamic Excel schema v3

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Nạp workbook synthetic có sheet Job + Nhân sự | Liệt kê đúng sheet/header/type; `%` 0.08 giữ là 0.08 | pass |
| 2 | Field picker của một recipe | Có nhóm theo sheet và chọn được cột cả Job lẫn Nhân sự | pass |
| 3 | Lưu preset rồi nạp workbook cùng schema | Fingerprint exact match, auto-map và Tính được không gán lại | pass |
| 4 | Nạp workbook đổi/mất header | Hiện cảnh báo ướm lại, khóa Tính, không chạy âm thầm | pass |
| 5 | GP + target từ workbook | Adapter chuyển thẳng giá trị cột, không recompute | pass |
| 6 | Privacy persistence | localStorage chỉ có preset metadata/binding, không có roster/lương/row data | pass |
| 7 | Engine scenario | Kết quả synthetic lệch = 0, registry vẫn 14 primitive + 3 macro | pass |
| 8 | Browser QA 4 viewport | 3 tab, 0 console/network/overflow; hover/focus/disabled rõ | pass |

### [2026-07-21 15:31] Chairman follow-up -- phục hồi Dashboard

- [x] Thêm lại tab 4 `Dashboard` theo visual system mới; app vẫn desktop-first, mobile chỉ là fallback không vỡ.
- [x] Khôi phục nạp nhiều Report JSON, tổng hợp quý/YTD, top người, bảng và hai biểu đồ bằng `js/core/history.js` hiện hữu.
- [x] Cập nhật official tests/browser QA thành 4 tab; kiểm >=2 report, canvas có nội dung, 4 viewport không page overflow.
- [x] Ghi REPORT + verify vào `handoff/audit.md` và append `log/history.md`.

| # | Follow-up scenario | Expected | Status |
|---|--------------------|----------|--------|
| D1 | Nạp 2 Report JSON Q1/Q2 | Dashboard tổng hợp 2 kỳ, YTD đúng | pass |
| D2 | Dashboard browser QA | Tab 4 render, canvas có nội dung, 0 console/network/page overflow | pass |

---

## [2026-07-21 13:14] -- Directive: Đưa v3 ra root, dọn repo, khoác vỏ cũ (theme/font/logo)

Codex đọc trước: `handoff/audit.md` — REVIEW mới nhất (v3 đã nghiệm thu, 15/15 pass, gate lệch=0 đã đóng).

1. **Goal + business context:** v3 đã nghiệm thu (engine đúng, deterministic). Đưa v3 thành **app chính thức ở gốc repo** để FIN mở trực tiếp; dọn sạch bản cũ gây rối. **"Vỏ cũ ruột mới":** giữ **nhận diện hình ảnh của app cũ** (theme màu, font, logo, bố cục quen thuộc) để FIN không phải làm quen lại, còn lõi tính toán là v3.

2. **Rough technical direction:** Di chuyển toàn bộ v3 ra root làm runtime chính; gỡ runtime v2 + artifact build/tạm không dùng; áp theme/font/logo/style của app cũ lên cấu trúc + engine v3. Vẫn offline `file://`, không network. Sửa đường dẫn (test, asset) khớp vị trí mới.

3. **Out of scope:**
   - KHÔNG xóa/sửa: `handoff/`, `docs/`, `log/`, `memory/`, `test/` (chứa test v3), `.gitignore`, assets thương hiệu (logo/font).
   - KHÔNG xóa v2 vĩnh viễn khi chưa lưu **1 bản tham chiếu** (git tag hoặc `/archive`) — phải khôi phục được.
   - KHÔNG đổi logic engine v3 / recipe / macro (chỉ đụng vỏ + vị trí file).
   - KHÔNG commit dữ liệu thật; KHÔNG dựng preset Trustana thật.

4. **Acceptance criteria:**
   - `index.html` ở **gốc repo** mở từ `file://`: 4 tab render, 0 console/network error, 0 page overflow.
   - App dùng **logo + font + theme của bộ nhận diện cũ** (quan sát: logo hiện, màu/typography khớp app cũ).
   - `node --test` toàn repo: test v3 (gồm `v3_scenario`) **pass 15/15** sau khi di chuyển (đường dẫn đã sửa).
   - Không còn runtime v2 ở root (đếm: `TinhIncentive.html` + js engine v2 = 0); không còn path `v3/` treo trong code (grep = 0).
   - Grep xác nhận: 0 `eval`/`new Function`/`#REF!`/số cắm tay/URL network trong runtime.
   - Bản tham chiếu v2 tồn tại (tag git hoặc thư mục archive) — nêu cách khôi phục trong REPORT.
   - REPORT + output verify dán vào `handoff/audit.md`.

   *Decision delegated to Codex (CTO):* cách lưu tham chiếu v2 (tag vs archive), cấu trúc thư mục root sau dọn, mức độ áp style cũ vs giữ layout v3. Ghi quyết định + lý do vào REPORT.

### Follow-up cleanup -- test trực tiếp trên root

- [x] Chuyển test v3 từ compatibility path sang `index.html`, `js/`, `presets/` ở root.
- [x] Đổi browser runner sang tên/path app chính thức và chạy lại file QA.
- [x] Sau khi 15/15 pass, gỡ bridge `v3/` mà không tác động target root.
- [x] Gỡ `AGENTS.md` stub và project `memory/` theo chỉ đạo trực tiếp; giữ thao tác recoverable.

---

## [2026-07-21 12:18] -- Directive: Dựng v3 Incentive Calculator (app khối công thức, offline)

Codex đọc trước: `handoff/REVIEW-Claude_Drag-Drop-Calculator.md` (14 quyết định + ranh giới), `docs/spec/BLOCK-CATALOG_v3.md` (từ điển cột + 14 khối + 3 macro + 6 recipe), `docs/spec/UI-LAYOUT_v3.md` (4 tab + design). Kịch bản test Claude cấp riêng tại `docs/spec/TEST-SCENARIO_v3.md`.

1. **Goal + business context:** Thay file Excel 41 sheet dễ lỗi (đã phát hiện `#REF!` sống + số cắm tay) bằng công cụ tính incentive **offline** cho FIN Trustana. Công thức dựng bằng **khối có kiểu dữ liệu** (không gõ text thô, không eval), lưu **JSON preset** tái dùng/chia sẻ; app **tự đẻ Excel input** đúng cột công thức cần; kết quả **deterministic, truy vết được tới job**. Đích cuối: dựng lại **đúng số như file Excel hiện hành**.

2. **Rough technical direction:** Web app **offline local-first** (chạy `file://`, không network). Engine deterministic tách khỏi UI; **tái dùng phần deterministic + export + font/BRAND của v2, gộp về 1 registry công thức duy nhất** (v1/v2 hiện chồng nhau — REVIEW-PACKET §11.1). Lớp **thương hiệu** (logo/màu/tên) tách rời engine, đổi để share. **Nhãn hiển thị tách khỏi định danh nội bộ**; bind cột↔khối bằng id, không bằng chữ header; giá trị enum mà khối lọc (Paid, Mức 1/2/3) đi qua **bảng quy đổi chuẩn hoá**.

3. **Out of scope:**
   - KHÔNG commit dữ liệu thật (lương/thuế/tên NV/công nợ KH) — `.gitignore` chặn `*.xlsx` dữ liệu, `docs/origin`, report thật. Repo chỉ code + preset rỗng + Excel mẫu rỗng.
   - KHÔNG dựng preset công thức Trustana thật (COM/KAE/BO/thuế) — **Claude làm sau** khi app xong (giai đoạn JSON preset).
   - KHÔNG bắt chước số cắm tay `−210.483.804`/`#REF!` — mọi điều chỉnh tay phải là **dòng input khai rõ**.
   - KHÔNG sửa/đụng v2 (đóng băng làm tham chiếu).
   - KHÔNG phụ thuộc link file ngoài — nguồn ngoài (công nợ/ledger/CHI) nếu cần là input nạp vào, không link.

4. **Acceptance criteria:**
   - App mở từ `file://` không cần mạng; 4 tab (Nhân sự · Công thức · Tính Incentive · Dashboard) render.
   - Tab Nhân sự: dán 1 list ≥20 dòng roster+lương một lần; đóng rồi mở lại app, dữ liệu còn nguyên (persist).
   - Tab Công thức: đủ **14 khối primitive + 3 macro khoá** (Waterfall Trustana · Thuế lũy tiến 2 nhánh · Pool KAE); type-checker chặn Money+Percent, chia 0, vòng lặp — mỗi lỗi hiện 1 thông báo và **chặn Lưu**.
   - Đổi nhãn 1 field (vd "GP"→"Lãi gộp"): mọi nơi hiển thị tên mới, **kết quả số không đổi**.
   - Nút **"Đẻ Excel input"**: sau khi lưu 1 formula, sinh Excel có **đúng tập cột** formula tiêu thụ (đếm cột khớp, không thừa/thiếu).
   - Nạp Excel đã điền → bấm Tính → bảng kết quả có trace `[⋯]` (component → job → khối).
   - Xuất được: BK, BKê-COM/Khác/BO, PDF/người, Job JSON, Report JSON.
   - Dashboard nạp ≥2 Report JSON dựng đa kỳ.
   - Chạy kịch bản `docs/spec/TEST-SCENARIO_v3.md` — mọi số kỳ vọng khớp **lệch = 0**.
   - REPORT + output verify dán vào `handoff/audit.md`.

   *Decision delegated to Codex (CTO):* kiến trúc, cơ chế persist (localStorage/file JSON roster), cách gộp registry, thư viện, thứ tự làm. Ghi quyết định + lý do vào REPORT.

### Technical execution plan -- Codex CTO

- [x] P0 -- boundary + executable truth
  - [x] Dựng app mới hoàn toàn dưới `v3/`; không sửa runtime, test, dist hay data của v2.
  - [x] Thêm data guard (`.gitignore`, preset rỗng, không fixture thật) và branding local tách khỏi engine.
  - [x] Định nghĩa schema v3 cho field/recipe/node/template/report; dùng một `BlockRegistry` duy nhất cho 14 primitive + 3 macro.
  - [x] Validator/type-check/topological sort chặn type mismatch, chia 0, thiếu input và cycle; không `eval`/`new Function`.
- [x] P1 -- workflow lõi
  - [x] Roster grid paste >=20 dòng; persist bằng `localStorage`, kèm import/export roster JSON để backup/migrate.
  - [x] Builder recipe 3 cột, drag/reorder/configure; label hiển thị tách khỏi stable field id.
  - [x] Sinh Excel input từ đúng dependency input-field của recipe, kèm metadata/fingerprint; parser chỉ nhận template tương thích.
  - [x] Chạy interpreter deterministic, lưu trace component -> job -> block và render lỗi duy nhất/chặn Lưu.
- [x] P2 -- bề mặt và output
  - [x] Hoàn thiện 4 tab responsive theo UI-LAYOUT v3 và local branding/fonts.
  - [x] Tái dùng/adapt export BK, BKê COM/Khác/BO, PDF/người, Job JSON, Report JSON trong namespace v3.
  - [x] Dashboard nạp nhiều Report JSON, tổng hợp đa kỳ/YTD.
- [ ] Verification + close
  - [x] Unit tests cho registry/type/cycle/divide-zero/label invariance/required columns/trace/roster serialization/dashboard.
  - [x] Browser QA `file://` tại 1440x900, 1280x800, 390x844, 360x740; console/network/overflow/interactions.
  - [ ] Chạy `docs/spec/TEST-SCENARIO_v3.md` khi file có mặt; yêu cầu mọi delta = 0.
  - [x] Dán output thật vào REPORT, cập nhật checklist và append `log/history.md`.

## Test Plan -- Incentive Calculator v3

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Mở `v3/index.html` trực tiếp | 4 tab render, không network/console error | pass |
| 2 | Paste roster >=20 dòng, reload cùng file | Roster và label còn nguyên | pass |
| 3 | Kiểm catalog | Đúng 14 primitive + 3 macro, một registry | pass |
| 4 | Money + Percent, chia 0, cycle | Mỗi case một lỗi và Save bị disable | pass |
| 5 | Đổi label field, chạy cùng input | Tất cả UI dùng label mới, số không đổi | pass |
| 6 | Sinh rồi nạp Excel | Header set đúng dependency, fingerprint hợp lệ | pass |
| 7 | Tính fixture tổng hợp | Deterministic output và trace component/job/block | pass |
| 8 | Export | BK, 3 BKê, PDF/người, Job JSON, Report JSON hoạt động | pass |
| 9 | Nạp >=2 Report JSON | Dashboard đa kỳ/YTD đúng | pass |
| 10 | `TEST-SCENARIO_v3.md` | Mọi expected delta = 0 | blocked - source file missing at plan time |

---

## [2026-07-13 15:45] -- Build Incentive Calculator P1-P4

- [x] Bootstrap workspace journals and reports folder
- [x] Inspect input template schema and Q1 source sheets safely
- [x] Build offline JS engine modules P1 with unit tests
- [x] Build golden Q1 extraction and reconciliation P2
- [x] Build one-page offline UI, parse/validate, and exports P3
- [x] Build report JSON and tidy workbook P4
- [x] Run `node --test` and browser/file smoke QA
- [x] Write `handoff/HANDOFF-codex-done.md`, audit report, and history entry

## Test Plan -- Incentive Calculator

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Valid template workbook with required sheets/columns | Parse succeeds, validation has no blocking schema errors | pass |
| 2 | Missing required sheet/column | Validation blocks calculation with sheet/column-specific error | pass |
| 3 | Sales waterfall edge cases | Target absorption, rate adjustment, and rounding match spec | pass |
| 4 | Tax bracket edge cases | Progressive PIT calculation matches 5 bracket formulas | pass |
| 5 | Penalty unpaid edge cases | Unpaid months and VAT penalty round to integer VND | pass |
| 6 | Q1 golden run | Reconciliation generated with no class (c) engine bugs remaining | pass |
| 7 | Offline UI smoke | `TinhIncentive.html` opens from `file://`, no network dependency, core controls render | pass |

## [2026-07-13 16:14] -- Claude R1 Fixes

- [x] Move PIT formula to BK-style max-rate config (`pit_rates`, `pit_quick`) and remove hardcoded brackets from `tax.js`
- [x] Include paid/partial jobs with negative GP in commission pools
- [x] Pro-rate B2 by worked months via `chi_tieu_b2_per_thang`
- [x] Rebuild Q1 reconciliation with component breakdown and class `(d) fixture gap`
- [x] Add BKê PDF print/export path for Sales payslip attachments
- [x] Run `node --test` and file UI smoke screenshots

## [2026-07-13 16:34] -- Round 3 BO Negative GP Fix

- [x] Change BO/thử việc GP aggregation to include negative `gpTinh`
- [x] Add regression test for BO positive + negative GP
- [x] Regenerate Q1 reduced fixture reconciliation
- [x] Run `node --test`
- [ ] UAT with FIN: paste real Q1 numbers into `TEMPLATE_Input-Incentive.xlsx`, drag into tool, compare against 11/6 payout
- [ ] During UAT, close open questions: KAM KPI gate, Spring split, open-6 Chi phí/COM, open-7 unpaid penalty source

## [2026-07-13 16:45] -- Fill Q1 5-Person Template Fixture

- [x] Back up root `TEMPLATE_Input-Incentive.xlsx`
- [x] Populate root template with 5 Q1 COM people and their selected Q1 jobs
- [x] Fill supporting sheets: `2_ChotQuy`, `3_NhanSu`, `4_KAE`, `5_KHMoi`, `6_PhatNoXau`, `7_Config`
- [x] Add `8_DoiChieu_Q1` with source Q1 expected waterfall/phạt/gross/tax/net
- [x] Verify workbook parses with 0 schema errors, 0 validation errors, 0 warnings
- [x] Run `node --test`

## [2026-07-13 17:16] -- Solo Cleanup And Export Polish

- [x] Remove `.git`, `.agents`, `.codex`, stale root Excel backups, and keep one root `TEMPLATE_Input-Incentive.xlsx`
- [x] Clarify config panel behavior: browser settings do not overwrite Excel
- [x] Clarify BK, BKe, tidy, and `report.json` meanings in the UI
- [x] Add `reports/README.md` for quarterly JSON archive workflow
- [x] Polish HTML UI with rounded boxes, hover states, animation, and orange accent
- [x] Add styled XLSX exports with header colors, widths, freeze/filter, number formats, and visual cues
- [x] Add Trustana logo to BKe PDF print layout
- [x] Run `npm test` and browser smoke for load/calculate/downloads

## [2026-07-13 17:25] -- Multi-Report JSON History Charts

- [x] Add history section to `TinhIncentive.html` for multiple `report_*.json` files
- [x] Add `js/engine/history.js` to normalize quarters and aggregate YTD totals by quarter/person
- [x] Draw offline Canvas charts for total net pay by quarter and top people YTD
- [x] Render history metrics and top-person summary table
- [x] Document the workflow in `reports/README.md`
- [x] Add Node regression test for multi-quarter JSON aggregation
- [x] Run browser smoke for multi-file JSON upload, canvas rendering, desktop/mobile layout

## [2026-07-14 09:36] -- Dashboard Toggle And Export UX Polish

- [x] Move JSON dashboard behind a top `INCENTIVE / DASHBOARD` toggle
- [x] Rename export buttons: `BẢNG KÊ`, `BẢNG KÊ TỪNG NGƯỜI`, `DỮ LIỆU JOB`, `EXPORT DATA`
- [x] Move `EXPORT DATA` to the bottom of result panel and save JSON with quarter + timestamp filename
- [x] Replace global long BKe PDF with per-person `PDF` buttons in the result table
- [x] Align result table columns and add a `Phiếu chi` column between name and team
- [x] Add dashboard sidebar, field list, chart builder controls, default charts, and chart remove/wide controls
- [x] Support common chart types: column, bar, line, area, donut, scatter, table, KPI
- [x] Add footer credit lines
- [x] Run `npm test` and browser smoke for incentive flow, per-person PDF, export data, dashboard charts, and mobile overflow

## [2026-07-14 09:54] -- Port Imetrik Visual System

- [x] Inspect `C:\Users\RYAN TOAN\Downloads\GIT\imetrik\dashboard.html` style tokens, typography, buttons, toggles, cards, and sidebar treatment
- [x] Copy offline Be Vietnam Pro and JetBrains Mono `.woff2` fonts into `assets/fonts`
- [x] Replace Roboto/Calibri UI styling with imetrik-style Trustana purple/orange tokens
- [x] Restyle topbar, `INCENTIVE / DASHBOARD` toggle, buttons, upload boxes, metric cards, tables, dashboard sidebar, chart builder, and chart action buttons
- [x] Update Canvas chart text to use Be Vietnam Pro
- [x] Run `npm.cmd test` and Playwright smoke for workbook calculate, report JSON dashboard import, desktop overflow, and mobile overflow

## [2026-07-14 10:01] -- HR Distribution Package

- [x] Identify runtime files needed by `TinhIncentive.html`
- [x] Exclude dev/audit/source files from user package: `docs`, `test`, `handoff`, `log`, `memory`, `config`, Q1 sample report, old Roboto fonts, and unused browser vendor
- [x] Build clean folder `dist/Trustana-Incentive-Tool-20260714-1000`
- [x] Add quick user guide `HUONG_DAN_NHANH.txt`
- [x] Smoke test packaged HTML from `file://`
- [x] Create zip `dist/Trustana-Incentive-Tool-20260714-1000.zip`

## [2026-07-20 14:35] -- [AUTO] Reverse-engineer FIN workbook and design Config Studio

- [x] Inspect all 13 sheets, used ranges, formulas, and cross-sheet dependencies in the FIN Q1 test workbook
- [x] Read the 9-page policy, completed FIN checklist, RTF process note, theory document, and blueprint
- [x] Compare workbook behavior with current parser, validation, config merge, and engine branches
- [x] Separate source data, policy/config parameters, derived fields, and audited overrides
- [x] Design a versioned Config Studio layout and rule-aware validation flow
- [x] Record the durable formula/config map in a Codex memory update note

## Test Plan -- FIN workbook and Config Studio research

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Workbook inventory | All 13 sheets and formula counts are accounted for | pass |
| 2 | Dependency trace | Inputs (1)-(5), intermediate outputs (6)-(9), BK, and BKê links are traceable | pass |
| 3 | Policy reconciliation | Policy/checklist/workbook disagreements are explicit, not silently resolved | pass |
| 4 | Config boundary | Every important field is classified as input, versioned config, derived value, or audited override | pass |
| 5 | Current-engine audit | Hardcoded assumptions and non-rule-aware validation paths are identified | pass |

## [2026-07-20 15:43] -- [AUTO] Close Blueprint v2 and new-task handoff

- [x] Verify current Codex `/compact` behavior from the current manual
- [x] Create a new blueprint without modifying closed `BLUEPRINT_v1.md`
- [x] Capture all FIN/user decisions for policy lifecycle, assignments, KAE, payment, projects and tax
- [x] Define phased implementation and 14 acceptance tests
- [x] Create a copy-ready prompt for a fresh implementation task
- [x] Verify both Markdown artifacts exist and contain the required sections

## [2026-07-20 15:54] -- [AUTO] Implement Blueprint v2 Config Studio

- [x] Phase 1 - Canonical model and Company Workspace
  - [x] Add schema v2 defaults, migration, validation, clone-safe serialization and JSON roundtrip
  - [x] Model employees, salary history, profile assignments, policies, master data, projects and quarter runs independently from Excel
  - [x] Convert the legacy Excel template into the same canonical workspace/run shape
  - [x] Verify workspace migration and calculation-preserving roundtrip tests
- [x] Phase 2 - Rule-aware deterministic engine
  - [x] Add fixed rule templates and policy DRAFT/ACTIVE/INACTIVE lifecycle with future-quarter activation
  - [x] Resolve monthly profile weights and salary-based COM targets without applying target to other buckets
  - [x] Route AE classifications, enforce binary Paid/Unpaid and use FIN-entered job penalties
  - [x] Implement monthly shared KAE pool, direct sales, manager and generic project allocations
  - [x] Implement tax modes, editable parameters, input/policy snapshots and calculation traces
  - [x] Verify targeted engine tests after each causal area
- [x] Phase 3 - Direct-entry UI and Config Studio
  - [x] Add Data, Policy, Calculation and Dashboard top-level views while preserving existing outputs
  - [x] Add editable direct-entry tables/forms for employees, salary, assignments, jobs, penalties and payroll
  - [x] Add workspace open/save/autosave, optional Excel import and policy lifecycle controls
  - [x] Add controlled project/tax/rule cards, validation explanations and trace details without formula editor/eval
- [ ] Phase 4 - Verification and distribution
  - [x] Run targeted schema/roundtrip/acceptance/regression tests and npm.cmd test
  - [ ] Run file:// browser smoke for direct entry, workspace, calculation, exports and Dashboard
  - [ ] Run frontend QA at 1440x900, 1280x800, 390x844 and 360x740 including console, interaction and overflow
  - [ ] Rebuild clean dist only after all source/browser gates pass; exclude docs/test/handoff/log/memory/config
  - [ ] Paste real verification output into handoff/audit.md and append log/history.md

## Test Plan -- Blueprint v2 Config Studio

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | COM official has an active month without salary; KAE/non-target profile has no salary | COM produces a blocking person/month/profile requirement; non-target profiles do not | pass |
| 2 | One employee has KAE 0.5 and COM 0.5 in the same month | KAE receives half share, COM target is half weighted, and person is not double-counted | pass |
| 3 | One employee has CX 0.5 and Product 0.5 KAE assignments | Combined KAE eligible weight is capped at 1 for the month | pass |
| 4 | Employee leaves during the quarter | KAE/direct/COM calculations use only explicit monthly weights worked | pass |
| 5 | AE routes KAE Admin, KAE Sale, General and New while KAE history is absent | Routes are correct; missing historical KAE reference does not block | pass |
| 6 | Paid and Unpaid jobs with FIN-entered penalty | Paid contributes incentive; Unpaid contributes zero and uses the entered penalty | pass |
| 7 | Input cost already includes COM | COM is removed once, grossed up once and not double-counted | pass |
| 8 | COM employee is above/below KPI B2 | Trace clearly separates KPI B2 achieved/target/adjustment from Level 2 rate | pass |
| 9 | Project allocation runs in individual and equal modes | Both allocations are correct and Spring defaults to individual paid revenue at 2.5% | pass |
| 10 | Each tax mode and a per-person parameter override are exercised | Output and tax trace follow the selected fixed template and parameters | pass |
| 11 | A new future-quarter policy is activated and an old report rerun | Old ACTIVE becomes INACTIVE; new policy starts on the future quarter; old report uses its snapshot | pass |
| 12 | Workspace JSON is saved, loaded and serialized again | Canonical data roundtrips and the calculation result is preserved | pass |
| 13 | Existing Excel fixture is imported | Unchanged legacy rule components retain their expected result | pass |
| 14 | App is opened from file:// and primary outputs are exercised | No network calls or console errors; BK, BKe, PDF, job/report JSON and Dashboard remain operational | blocked - browser tooling rejects file:// |

## [2026-07-20 16:48] -- [AUTO] Create Config Studio beginner test kit

- [x] Select a small representative dataset derived from the Q1 legacy workbook
- [x] Build a parser-compatible Excel sample with clear instructions, input formatting and validation lists
- [x] Generate a canonical schema v2 Workspace JSON from the same sample
- [x] Write a plain-language Vietnamese quick-start guide for Workspace-first and Excel-import testing
- [x] Verify Excel schema/rendering, JSON roundtrip, zero blocking validation errors, deterministic calculation and full test suite
- [x] Append completion evidence to audit/history

## Test Plan -- Config Studio beginner test kit

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Import sample Excel through the current parser | All seven required legacy-adapter sheets/columns are accepted | pass |
| 2 | Open generated Workspace JSON | Schema v2 roundtrips without data loss | pass |
| 3 | Validate and calculate both files | No blocking errors and both routes produce the same three-person totals | pass |
| 4 | Inspect every sample workbook sheet | Headers, instructions, numbers and editable fields are readable without clipping | pass |
| 5 | Follow the quick-start guide | A first-time user can load data, calculate and export without reading the blueprint | pass |

## [2026-07-21 08:44] -- [AUTO] Drag-and-drop calculator discovery and formula handoff

- [x] Inventory every formula, parameter, data dependency and unresolved business conflict from the legacy workbook, policy/theory documents, previous handoffs and current engine
- [x] Separate confirmed business rules from implementation behavior, historical workbook artifacts and decisions still requiring Chairman/Claude review
- [x] Recommend a beginner-first drag-and-drop calculator model that supports arithmetic and percentage operands without arbitrary executable formulas
- [x] Define the rule-block vocabulary, validation, traceability, versioning and migration boundaries
- [x] Write the complete review packet under `handoff/` and link it from the audit report
- [x] Verify the packet against source search results and append the completion entry to history

## Test Plan -- Drag-and-drop calculator discovery handoff

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Formula catalog is checked against workbook, theory, config and engine | Every known incentive, penalty, tax and net-pay formula is represented with provenance and status | pass |
| 2 | A reviewer searches for key rule families | COM, B2, manager, KAE/KAM, BO, project, cost/GP, payment, penalty and PIT are all present | pass |
| 3 | A non-technical user reads the proposed workflow | The primary calculate flow is understandable without knowing schema, profiles or policy internals | pass |
| 4 | A reviewer inspects calculator safety | Arithmetic is composable, but unsupported fields, divide-by-zero, cycles and arbitrary code are blocked | pass |
| 5 | Review packet is prepared for Claude | Confirmed rules, conflicts, recommendations and explicit review questions are clearly separated | pass |

## [2026-07-21 09:12] -- [AUTO] Prepare Claude review prompt

- [x] Create a copy-ready Claude/Cowork review prompt under `handoff/`
- [x] Require product, typed-rule architecture and complete formula review
- [x] Require a 14-item decision matrix and evidence-based findings
- [x] Prevent implementation, blueprint edits and premature business decisions
