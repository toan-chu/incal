# Cân bằng giao diện và dọn artifact sinh tự động

> **Bản đồ repo:** đọc `docs/REPO_SNAPSHOT.md` trước khi bắt đầu.
> **Luật đã chốt:** đọc `log/rules.md`.

**Status:** open
**Giao ngày:** 2026-08-06

## 1. DIRECTIVE

### [AUTO] Mục tiêu và bối cảnh

Sửa khoảng cách giữa vùng thả file và card trạng thái rỗng trên cả hai tab; đồng thời hậu kiểm toàn diện tính thẩm mỹ, tỷ lệ và cân bằng của giao diện desktop/mobile. Dọn các artifact/cache sinh tự động không cần giữ trong repo làm việc.

### Hướng kỹ thuật sơ bộ

Chỉ sửa lớp trình bày trong `tool/src/`, build lại artifact một-file, bổ sung regression test và đo bằng trình duyệt thật. Chỉ xóa các thư mục/output có thể tái tạo; giữ nguyên source, build script, test harness và hồ sơ quản trị repo.

### Ngoài phạm vi

- Không thay đổi logic đọc Excel, số liệu, công thức, PDF, workbook mẫu hoặc `archive/`.
- Không xóa `tool/src/`, `tool/build.py`, `tool/test/`, `docs/`, `handoff/` hoặc `log/`.
- Không commit, push hoặc thay đổi lịch sử Git.

### Tiêu chí nghiệm thu

1. Khoảng cách giữa dropzone và empty-state card là 18px trên cả tab Phiếu và Dashboard, ở desktop lẫn mobile.
2. Tiêu đề trang lấy lại tỷ lệ của bản thẩm mỹ gốc: `clamp(28px,3vw,42px)`, line-height `1.08`, tracking `-.025em`, màu `--brand-deep`.
3. Browser QA ở 1440px, 1280px, 390px và 360px: không tràn ngang; hai tab rỗng và trạng thái đã nạp dữ liệu không có console error hoặc request lỗi.
4. Build và toàn bộ test liên quan pass; các mốc Q1/2026 không đổi.
5. Xóa `tmp/`, `output/`, `.playwright-cli/` và dependency cache `tool/test/node_modules/`; mọi thứ bị xóa đều có thể tái tạo.
6. Task giữ `Status: open` sau REPORT để chờ hậu kiểm độc lập.

## 2. TODO

- [x] Đọc repo map, hard rules, memory và hồ sơ REVIEW trước đó.
- [x] Tái hiện bằng browser: tab Phiếu gap 0px, tab Dashboard gap 16px, heading 22px.
- [x] Sửa spacing và tỷ lệ heading trong source CSS.
- [x] Thêm regression tests cho các contract trình bày mới.
- [x] Build lại `tool/Phieu-Incentive.html` và chạy test suite.
- [x] Browser QA desktop/mobile, cả empty-state và loaded-state; review ảnh trực quan.
- [x] Xóa artifact/cache tái tạo được và xác nhận phần source/governance còn nguyên.
- [x] Ghi REPORT và session journal; giữ task mở chờ REVIEW.

### Test Plan -- UI balance cleanup

| # | Scenario | Expected | Status |
|---|---|---|---|
| 1 | Hai tab ở trạng thái chưa nạp file | Dropzone cách empty card đúng 18px | pass |
| 2 | Heading ở các viewport 1440/1280/390/360 | Đúng scale/màu bản gốc, không lấn hoặc tràn | pass |
| 3 | Nạp workbook thật ở tab Phiếu và Dashboard | Bố cục cân bằng, số liệu chuẩn, không console/network error | pass |
| 4 | Chạy build và test suite | Tất cả test pass, mốc Q1 không đổi | pass |
| 5 | Dọn artifact/cache | Chỉ generated files bị xóa; source/build/test/governance còn nguyên | pass |

## 3. AUDIT

### [2026-08-06] PRE-ACTION NOTE -- dọn file sinh tự động

**What:** Xóa `tmp/` (5 file QA), `output/` (1 ảnh Playwright), `.playwright-cli/` (rỗng), và `tool/test/node_modules/` (1.439 file dependency cache).

**Why:** Đây là PDF/ảnh kiểm thử, state tạm và dependency cài cục bộ; không phải source hoặc sản phẩm giao cho người dùng.

**Blast radius:** Khoảng 13,3 MB dữ liệu tái tạo được. Không xóa `tool/src/`, `tool/build.py`, `tool/test/package*.json`, `docs/`, `handoff/`, `log/`, workbook hoặc HTML sản phẩm.

**Rollback:** Chạy lại browser/PDF QA để sinh `tmp/` và `output/`; chạy `npm.cmd install` trong `tool/test/` để tái tạo `node_modules/`.

### [2026-08-06 17:45] REPORT [AUTO]

**Done:**

- Chuẩn hóa khoảng cách giữa dropzone và khối kế tiếp thành 18px; ẩn `.file-list` khi rỗng để Dashboard không cộng thêm 16px khoảng cách ma.
- Khôi phục heading theo thẩm mỹ gốc: scale 28-42px, line-height 1.08, tracking âm nhẹ và màu tím thương hiệu.
- Bổ sung hai regression checks cho spacing và heading; build lại HTML một-file.
- QA trực quan desktop/mobile cho hai empty-state và loaded-state; không thấy lỗi cân bằng, clipping ngoài table scroll có chủ ý, hoặc overflow ngang.
- Xóa `tmp/`, `output/`, `.playwright-cli/`, `tool/test/node_modules/`; giữ source, build/test harness và hồ sơ repo.

**Files changed:** `tool/src/app.css`, `tool/test/smoke-guard.js`, `tool/Phieu-Incentive.html`, `docs/REPO_SNAPSHOT.md`, `handoff/tasks/20260806_ui-balance-cleanup.md`, `log/sessions/20260806_dev_tool_ui-balance-cleanup.md`.

**Files/directories removed:** `tmp/` (5 files, 1.696.659 bytes), `output/` (5 files, 424.629 bytes), `.playwright-cli/` (5 files, 17.681 bytes), `tool/test/node_modules/` (1.439 files, 11.503.566 bytes).

**Verification:**

```text
python3 -B tool/build.py
Đã dựng ...\tool\Phieu-Incentive.html (2.09 MB)

cd tool/test && npm.cmd test
ĐẠT toàn bộ tiêu chí.  (smoke-happy.js)
ĐẠT toàn bộ tiêu chí.  (smoke-guard.js)
15 người; 345 job; gross 349.765.221; thuế 34.976.523; thực nhận 314.788.696.

Browser measurement, Chromium:
1440x900: slip=18px, dash=18px, overflow=0
1280x800: slip=18px, dash=18px, overflow=0
390x844:  slip=18px, dash=18px, overflow=0
360x800:  slip=18px, dash=18px, overflow=0
Heading: 42px @1440; 38.4px @1280; 28px @390/360; rgb(50,16,94).
Loaded workbook: 15 rows; totals 349.765.221 / 34.976.523 / 314.788.696 / 345; console errors=0; request failures=0.

Cleanup verification:
tmp=False; output=False; .playwright-cli=False; tool/test/node_modules=False
tool/src=True; tool/build.py=True; tool/test/package.json=True; docs=True; handoff=True; log=True
```

**Architecture decision:** Giữ `tool/src/`, `tool/build.py` và `tool/test/` vì HTML sản phẩm là build artifact, không phải nguồn có thể bảo trì trực tiếp. Giữ `docs/`, `handoff/`, `log/` vì đây là source-of-truth và audit trail bắt buộc của repo. Chỉ dependency cache và QA artifacts được dọn.

**Deviations from Directive:** Không xóa các thư mục source/build/test/governance dù yêu cầu dọn ban đầu nêu chúng như ứng viên; xác minh repo map và hard rules cho thấy chúng đang có tác dụng trực tiếp. `node_modules/` được xóa thay cho cả `tool/test/` vì có thể tái tạo bằng `npm.cmd install`.

**Open questions for Cowork:** Hậu kiểm REPORT và đóng task nếu APPROVED/APPROVED WITH NOTES.

**Risks/known gaps:** `git status` vẫn hiển thị khối thay đổi tái cấu trúc có sẵn từ task trước; phiên này không commit, stage, reset hoặc thay đổi lịch sử Git.
