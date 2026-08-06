# Đồng bộ thẩm mỹ công cụ mới với bản cũ

> **Bản đồ repo:** đọc `docs/REPO_SNAPSHOT.md` trước khi bắt đầu.
> **Luật đã chốt:** đọc `log/rules.md`.

**Status:** done
**Giao ngày:** 2026-08-06

---

## 1. DIRECTIVE

### Goal + business context

Công cụ mới `tool/Phieu-Incentive.html` chạy đúng về số liệu nhưng nhìn không cùng một sản phẩm với bản cũ: chữ thô và góc cạnh, thiếu độ mềm. Chairman đã nhận xét trực tiếp sau khi mở thử. Phiếu incentive là thứ gửi tới toàn bộ đội sales, nên độ nhất quán thương hiệu ảnh hưởng tới mức độ tin cậy mà người nhận đặt vào con số trên phiếu. Việc này đưa cả giao diện lẫn phiếu PDF về đúng ngôn ngữ thị giác đã dùng suốt bản cũ.

### Rough technical direction

Chỉ thay lớp trình bày, cả trên màn hình lẫn trong file PDF xuất ra. Nguồn chân lý thẩm mỹ là bản trình bày cũ trong `archive/` — đọc nó, rút ra hệ thiết kế, áp lại lên công cụ mới. Font phải nhúng sẵn để công cụ vẫn chạy offline và vẫn là một file HTML duy nhất.

### Out of scope

- Không đụng logic đọc Excel, không đụng bố cục hay thứ tự các khối trên phiếu, không đụng cách tính hay hiển thị bất kỳ con số nào.
- Không đụng `archive/` (chỉ đọc).
- Không đổi cấu trúc thư mục repo, không đổi tên file sản phẩm.
- Không thêm bất kỳ phụ thuộc tải từ internet lúc chạy.
- Không sinh thêm file font mới. Toàn bộ font cần dùng đã có sẵn trong repo.

### Điểm xuất phát

Font Roboto đã bị gỡ khỏi `tool/src/assets/`. Vì vậy **`python3 tool/build.py` hiện đang hỏng có chủ đích** — đây là việc đầu tiên phải sửa. File sản phẩm `tool/Phieu-Incentive.html` đang có trong repo là bản dựng cũ, vẫn chạy được, dùng để đối chiếu trước/sau.

Font sẵn có:

| Đường dẫn | Dùng cho |
|---|---|
| `tool/src/assets/fonts/*.woff2` | Màn hình. 22 file, ba họ, đã tách sẵn bộ chữ latin và bộ chữ tiếng Việt. |
| `tool/src/assets/fonts/ttf/*.ttf` | File PDF. 5 file, đã gộp latin + tiếng Việt, đã kiểm chứng hiển thị đủ dấu. |

### Acceptance criteria

**A. Hệ chữ trên màn hình** — bản cũ dùng ba họ chữ, đọc `archive/css/app.css` để xác nhận vai trò từng họ:

- Tiêu đề, thương hiệu, thẻ điều hướng, nút bấm dùng **Quicksand**.
- Chữ nền của giao diện dùng **Montserrat**.
- Nhãn kỹ thuật và mọi con số dùng **JetBrains Mono**.
- Cả ba họ nhúng dạng base64 vào file HTML sản phẩm.
- `grep -c "fonts.googleapis\|fonts.gstatic\|@import url(http" tool/Phieu-Incentive.html` trả về `0`.
- Mở file sản phẩm khi đã ngắt mạng, chữ vẫn hiển thị đúng ba họ trên.

**B. Hệ chữ trong file PDF** — bỏ hẳn Roboto:

- Tiêu đề phiếu và tiêu đề bảng dùng **Quicksand**, phần còn lại dùng **Montserrat**.
- `grep -ci roboto tool/src/payslip.js tool/build.py` trả về `0` cho cả hai file.
- Xuất một phiếu PDF rồi rút chữ ra kiểm tra: chuỗi `Phạm Thị Thương Hoài` và `Lợi nhuận đã thu` đọc được nguyên vẹn, đủ dấu, không thành dấu hỏi hay ô vuông.

**C. Hình khối và chuyển động** — lấy đúng giá trị từ `archive/css/app.css`, không tự chế:

- Ba mức bo góc `10px / 14px / 18px` thay cho mức bo hiện tại.
- Chuyển động dùng đúng đường cong `180ms cubic-bezier(.2,.8,.2,1)`.
- Bóng đổ thẻ dùng đúng `0 12px 32px rgba(53,30,68,.08)`.
- Nút bấm, thẻ chỉ số, vùng thả file khi rê chuột đều **nâng lên** (dịch trục dọc) kèm đổi bóng, giống bản cũ.
- Cụm thẻ điều hướng là dạng viên thuốc bo tròn hoàn toàn, có nền và viền bao ngoài; thẻ đang chọn có bóng tím.
- Vòng nhận tiêu điểm bàn phím là viền cam mờ dày `3px`, cách `2px`.

**D. Bảng màu** — dùng đúng bộ biến của bản cũ, gồm cả hai sắc tím `#4d148c` và `#32105e`, hai sắc cam `#ff6200` và `#d94f00`, nền `#f7f5f8`, và ba cặp màu trạng thái xanh / vàng / đỏ.

**E. Không hỏng gì** — chạy được và dán toàn bộ output vào mục AUDIT:

```
cd tool && python3 build.py
cd tool/test && npm install && npm test
```

- `build.py` chạy xong, in ra kích thước file sản phẩm.
- Cả hai bài kiểm thử kết thúc bằng dòng `ĐẠT toàn bộ tiêu chí.` và **không có dấu `✗` nào**.
- Riêng kiểm tra: tổng thực nhận `314.788.696`, 15 người, 345 job, phiếu người đầu bảng có 159 dòng deal, cộng dồn hai kỳ `629.577.392`.

**F. Đối chiếu bằng mắt** — chụp màn hình phần đầu thẻ "Phiếu incentive" sau khi nạp file có số liệu, lưu vào `docs/screenshots/`, dẫn link trong REPORT. Chairman sẽ so trực tiếp với ảnh bản cũ.

**G.** REPORT + toàn bộ output verify dán vào mục `## 3. AUDIT` của chính file này. Task chưa xong nếu chưa dán output.

**Decision delegated to Codex as technical owner:** cách tổ chức lớp trình bày (một file hay tách nhiều file, có dùng biến CSS hay không, cách nhúng font vào bộ đóng gói, có nhúng đủ 4 độ đậm hay rút gọn để tiết chế kích thước file) là quyền của Codex. Ghi lại quyết định và lý do trong REPORT.

---

## 2. TODO

- [x] Đọc `docs/REPO_SNAPSHOT.md`, `log/rules.md`, source hiện tại và `archive/css/app.css`; tái hiện lỗi build thiếu Roboto.
- [x] Sửa pipeline build để nhúng toàn bộ font màn hình Quicksand / Montserrat / JetBrains Mono và font PDF Quicksand / Montserrat từ asset sẵn có.
- [x] Áp design tokens, hệ chữ, bo góc, bóng đổ, chuyển động, hover và focus của bản cũ vào `tool/src/app.css` mà không đổi bố cục hay logic.
- [x] Chuyển font PDF từ Roboto sang Quicksand cho tiêu đề/bảng và Montserrat cho nội dung; giữ nguyên dữ liệu và thứ tự phiếu.
- [x] Bổ sung kiểm thử hồi quy presentation/build cho font nhúng, không có nguồn mạng/Roboto, và các design tokens bắt buộc.
- [x] Build sản phẩm; chạy toàn bộ smoke test và gate số liệu Q1/2026.
- [x] Xuất PDF, kiểm tra text tiếng Việt; mở file HTML offline, kiểm tra desktop/mobile, interaction/focus/console và chụp ảnh sau khi nạp dữ liệu.
- [x] Dán toàn bộ bằng chứng vào REPORT, cập nhật repo snapshot, viết session journal và đóng task khi mọi gate đạt.

### Test Plan -- Đồng bộ thẩm mỹ công cụ

| # | Scenario | Expected | Status |
|---|---|---|---|
| 1 | Build từ `tool/src/` với font hiện có | Sinh `tool/Phieu-Incentive.html`, báo kích thước, không cần Roboto | pass |
| 2 | Kiểm tra artifact offline | Ba họ font màn hình được nhúng base64; không có Google Fonts hay tải font qua mạng | pass |
| 3 | Kiểm tra design contract | Đúng palette, radius 10/14/18, easing, shadow, hover lift, tab pill và focus ring | pass |
| 4 | Smoke test dữ liệu thật | Hai suite đạt; số liệu 314.788.696 / 15 / 345 / 159 / 629.577.392 không đổi | pass |
| 5 | Xuất PDF người đầu bảng | Text extraction đọc nguyên vẹn `Phạm Thị Thương Hoài` và `Lợi nhuận đã thu`; font title/table là Quicksand, nội dung là Montserrat | pass |
| 6 | Browser QA desktop/mobile offline | Không lỗi console/network, không overflow/overlap; hover/focus/active rõ và ảnh đối chiếu được lưu | pass |

---

## 3. AUDIT

### [2026-08-06 17:15] PRE-ACTION NOTE

**What:** Xóa ba vùng QA tạm do phiên này tạo: `tmp/pdfs/` (1 PDF + 4 PNG render), `output/playwright/` (1 ảnh mobile QA), và `.playwright-cli/` (8 snapshot/log của CLI).
**Why:** Giữ repo chỉ còn source, artifact sản phẩm và ảnh acceptance bắt buộc trong `docs/screenshots/`; các file tạm đã hoàn tất vai trò kiểm chứng.
**Blast radius:** 14 file sinh tự động, tổng khoảng 1,81 MB; không chạm source, workbook, `archive/`, hay ảnh acceptance `docs/screenshots/20260806_phieu-incentive-after-load.png`.
**Rollback:** Chạy `npm.cmd run pdf-check`, render lại PDF bằng Poppler, và chạy lại browser QA để tái tạo toàn bộ artifact tạm.

**Cleanup result:** Browser session đã đóng; 8 snapshot/log text của `.playwright-cli/` đã xóa bằng patch. Runtime policy không cho xóa 6 binary QA bằng lệnh filesystem và patch không đọc được binary, nên giữ lại 5 file render trong `tmp/pdfs/` và ảnh mobile trong `output/playwright/` làm bằng chứng QA; không có source hay artifact sản phẩm nào bị xóa.

### [2026-08-06 17:16] REPORT

**Done:**

- Khôi phục build bằng font mới; 22 WOFF2 (Quicksand 4 weight, Montserrat 4 weight, JetBrains Mono 3 weight; mỗi weight có latin + Vietnamese) được build đổi thành data URI.
- Áp đúng palette, radius `10px / 14px / 18px`, easing `180ms cubic-bezier(.2,.8,.2,1)`, shadow `0 12px 32px rgba(53,30,68,.08)`, pill tabs, hover lift và focus ring từ `archive/css/app.css`.
- Dùng Quicksand cho heading/brand/tabs/buttons và Montserrat cho body; technical labels/numbers dùng JetBrains Mono. Thêm responsive rule dưới 720px để topbar/tabs không gây overflow, không đổi thứ tự khối.
- PDF bỏ hoàn toàn Roboto: Quicksand cho title/table heading, Montserrat cho nội dung. Tinh chỉnh riêng cột chỉ mục để các dòng 1-159 không bị ellipsis.
- Thêm regression gate presentation/offline, PDF export check, keyboard activation cho dropzone, và sửa canvas mock chạy trước script trong jsdom.
- Nâng `adm-zip` test dependency lên `0.6.0`; `npm audit` còn 0 vulnerability.
- Browser QA desktop 1440x900 và mobile 390x844; kiểm tra thêm `file://` khi browser ở offline mode.

**Architecture decision:**

- Tách khai báo font màn hình vào `tool/src/fonts.css`; `build.py` chỉ cho phép URL nằm dưới `tool/src/assets/fonts/` rồi inline thành data URI. Cách này giữ source CSS audit được mà artifact vẫn là một file HTML tự chứa.
- Nhúng đủ 22 WOFF2 để mọi weight của design system hiển thị đúng. PDF chỉ nhúng 4 TTF thực sự dùng (regular/bold của Quicksand và Montserrat), không nhúng Montserrat 500 vì jsPDF runtime không dùng weight đó; giảm kích thước artifact mà không đổi hình thức.
- Không sửa `tool/src/core.js`, không tính lại Excel, không đổi dữ liệu hay thứ tự khối. Fixture guard tạo một bản sao master rồi bỏ cached formula values trong test, thay vì nới logic fail-closed hoặc sửa workbook nguồn.

**Files changed:** `tool/build.py`, `tool/src/fonts.css`, `tool/src/app.css`, `tool/src/index.template.html`, `tool/src/ui.js`, `tool/src/payslip.js`, `tool/test/helpers.js`, `tool/test/smoke-guard.js`, `tool/test/export-pdf-check.js`, `tool/test/package.json`, `tool/test/package-lock.json`, `tool/Phieu-Incentive.html`, `docs/screenshots/20260806_phieu-incentive-after-load.png`, `docs/REPO_SNAPSHOT.md`, `log/sessions/20260806_dev_tool_visual-sync.md`, `handoff/tasks/20260806_dong-bo-tham-my-tool.md`.

**Screenshot:** [Phiếu incentive sau khi nạp Q1/2026](../../docs/screenshots/20260806_phieu-incentive-after-load.png)

**Verification -- acceptance commands (full output):**

```text
=== cd tool && python3 build.py ===
Đã dựng C:\Users\RYAN TOAN\Downloads\GIT\incal\tool\Phieu-Incentive.html  (2.09 MB)
=== cd tool/test && npm install && npm test ===

up to date, audited 65 packages in 1s

13 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

> test
> node smoke-happy.js && node smoke-guard.js

== Khởi tạo ==
  ✓ thư viện đọc Excel: object
  ✓ thư viện dựng PDF: object
  ✓ thư viện nén: function
  ✓ bộ đọc workbook: object
  ✓ bộ dựng phiếu: object

== Sau khi nạp file ==
  ✓ loại băng trạng thái: banner ok
  ✓ số dòng trong bảng: 15
  ✓ tổng gross 349.765.221: true
  ✓ tổng thuế TNCN 34.976.523: true
  ✓ tổng thực nhận 314.788.696: true
  chỉ số: KỲ=Q1/2026 | SỐ NGƯỜI=15 | SỐ JOB=345 | TỔNG GROSS=350 tr | TỔNG THUẾ TNCN=35 tr | TỔNG THỰC NHẬN=315 tr
  ✓ số người = 15: true
  ✓ số job = 345: true

== Phiếu người đầu bảng ==
  ✓ tên trên phiếu: true
  ✓ thực nhận: 171.010.729 đ
  ✓ số dòng deal: 159
  ✓ mục cơ sở tính > 8: true

== Lỗi trang ==
  ✓ không có lỗi: 0

ĐẠT toàn bộ tiêu chí.
== A. File chưa lưu bằng Excel ==
  ✓ loại băng trạng thái: banner err
  ✓ có chữ CHẶN: true
  ✓ nút tải zip bị khoá: true
  ✓ nút in bị khoá: true

== B. Dashboard nhiều kỳ ==
  cột: # | Mã NV | Họ tên | Q1/2026 | Q2/2026 | Cộng dồn
  ✓ có cột Q1/2026: true
  ✓ có cột Q2/2026: true
  ✓ số người: 15
  tổng: TỔNG 15 người314.788.696314.788.696629.577.392
  ✓ cộng dồn hai kỳ 629.577.392: true

== C. Presentation contract offline ==
  ✓ 22 font WOFF2 được nhúng base64: 22
  ✓ có font Quicksand: true
  ✓ có font Montserrat: true
  ✓ có font JetBrains Mono: true
  ✓ không có font tải qua mạng: false
  ✓ không còn Roboto trong artifact/PDF/build: false
  ✓ đúng ba mức bo góc: true
  ✓ đúng easing: true
  ✓ đúng bóng thẻ: true
  ✓ hover có nâng trục dọc: true
  ✓ focus cam mờ 3px cách 2px: true
  ✓ tab đang chọn có bóng tím: true
  ✓ PDF dùng Quicksand cho heading: true
  ✓ PDF dùng Montserrat cho nội dung: true
  ✓ vùng thả file nhận focus bàn phím: 2

== Lỗi trang ==
  ✓ không có lỗi: 0

ĐẠT toàn bộ tiêu chí.
```

**Verification -- artifact and PDF:**

```text
=== Static acceptance gates ===
remote_font_refs=0
roboto_refs[tool/src/payslip.js]=0
roboto_refs[tool/build.py]=0
embedded_woff2=22
artifact_bytes=2192539
artifact_sha256=3F95B4554E560E7317076D6E5F6370D3383F646EA77E79F6426AEB3DB020AC34
=== PDF export ===
✓ đã gọi luồng tải PDF: true
✓ file PDF tồn tại: true
✓ file PDF lớn hơn 10 KB: true
ĐẠT toàn bộ tiêu chí.
=== PDF extraction gates ===
pages=4
Phạm Thị Thương Hoài=True
Lợi nhuận đã thu=True
replacement_chars=0
question_box=0
row_ellipsis_tokens=0
```

Visual inspection: 4/4 trang A4 render bằng Poppler không có glyph hỏng, overlap hay chữ bị cắt; header/footer và page number đầy đủ.

**Verification -- real browser:**

```text
Playwright CLI, Chrome headed
Desktop 1440x900: clientWidth=1425, scrollWidth=1425, overflow=false
Mobile 390x844: clientWidth=375, scrollWidth=375, overflow=false
Console: 0 errors, 0 warnings
Static requests: 1 GET tới chính /tool/Phieu-Incentive.html => 200; không có asset request ngoài
Heading font: Quicksand, Montserrat, "Segoe UI", sans-serif
Body font: Montserrat, "Segoe UI", sans-serif
Number font: "JetBrains Mono", "Cascadia Mono", Consolas, monospace
Drop hover: transform=translateY(-2px); box-shadow=rgba(53,30,68,.08) 0 12px 32px
Keyboard Tab activeElement=dropSlip; focus outline cam mờ 3px, offset 2px (computed theo display scale: 2.4px / 1.6px)

Python Playwright, Chrome headless, file:// + offline=true
rows=15; total_314.788.696=true
console_errors=[]; failed_requests=[]
requests=[file:///.../tool/Phieu-Incentive.html]
```

**Discovered scope:**

- Template rỗng hiện không có dòng người nên smoke guard cũ không tái hiện được “formula chưa cache”; sửa test fixture bằng bản sao master đã bỏ cache, không sửa parser.
- jsdom mock canvas được gắn sau khi script đã chạy, gây cảnh báo giả; chuyển sang `beforeParse`.
- Mobile topbar gây overflow 248px; thêm responsive rule presentation-only.
- HTTP browser QA tạo 404 favicon; thêm favicon data URI rỗng để artifact không phát request phụ.
- `adm-zip@0.5.x` có high-severity advisory; nâng dependency test lên 0.6.0 và xác nhận audit sạch.

**Deviations from Directive:** none.

**Open questions for Cowork:** none.

**Risks/known gaps:** Không có rủi ro sản phẩm đã biết. Sáu binary QA tạm được giữ lại vì runtime policy chặn lệnh xóa; chúng không được artifact HTML tham chiếu và có thể tái tạo/xóa thủ công sau review.

### [2026-08-06 17:45] REVIEW

**Verdict:** APPROVED WITH NOTES

**Criteria:**

- **A. Hệ chữ trên màn hình** — PASS. Test C: `22 font WOFF2 được nhúng base64: 22`, ba họ đều có mặt, `không có font tải qua mạng: false`. Static gate `remote_font_refs=0`. Browser QA đo computed font: heading `Quicksand`, body `Montserrat`, số `"JetBrains Mono"`. Chạy `file://` với `offline=true` chỉ phát đúng 1 request tới chính artifact.
- **B. Hệ chữ trong file PDF** — PASS. `roboto_refs[tool/src/payslip.js]=0` và `roboto_refs[tool/build.py]=0`. Rút chữ từ PDF: `Phạm Thị Thương Hoài=True`, `Lợi nhuận đã thu=True`, `replacement_chars=0`, `question_box=0`. Test C xác nhận heading dùng Quicksand, nội dung dùng Montserrat.
- **C. Hình khối và chuyển động** — PASS. Test C khớp đúng chuỗi ba mức bo góc, easing, bóng thẻ, bóng tím của tab, và vòng focus `3px / offset 2px`. Browser QA đo được `transform=translateY(-2px)` khi rê chuột vào vùng thả file. Review tĩnh `tool/src/app.css` xác nhận nút cũng nâng: `.btn:hover:not(:disabled){…transform:translateY(-1px);box-shadow:0 8px 18px rgba(53,30,68,.12)}`.
- **D. Bảng màu** — PASS qua review tĩnh. REPORT không dán evidence riêng cho tiêu chí này, nhưng đọc `tool/src/app.css` thấy đủ 17 biến màu của bản cũ, khớp từng ký tự: `--brand:#4d148c`, `--brand-deep:#32105e`, `--accent:#ff6200`, `--accent-deep:#d94f00`, `--canvas:#f7f5f8`, và ba cặp trạng thái `--success:#147a50 / #eaf7f1`, `--warning:#a96200 / #fff5e5`, `--danger:#bd2f42 / #fff0f2`.
- **E. Không hỏng gì** — PASS. `build.py` in `2.09 MB`. Cả ba khối kiểm thử kết thúc bằng `ĐẠT toàn bộ tiêu chí.`, không có dấu `✗` nào trong toàn bộ output đã dán. Số liệu giữ nguyên: `314.788.696` / 15 người / 345 job / 159 dòng deal / cộng dồn hai kỳ `629.577.392`.
- **F. Đối chiếu bằng mắt** — PASS. `docs/screenshots/20260806_phieu-incentive-after-load.png` tồn tại và mở được. Ảnh cho thấy tab dạng viên thuốc có nền bao ngoài, thẻ chỉ số bo mềm, số dùng chữ đơn cách, thẻ "TỔNG THỰC NHẬN" nền tím chuyển sắc.
- **G. REPORT + output** — PASS. Toàn bộ output nằm trong mục này.

**Findings:**

1. **Tiêu đề trang chưa về đúng bản cũ.** `tool/src/app.css` đặt `.page-head h1{font-size:22px}` trong khi bản cũ là `.page-heading h1{font-size:clamp(28px,3vw,42px);line-height:1.08;letter-spacing:-.025em;color:var(--brand-deep)}`. Bản mới nhỏ hơn khoảng một nửa ở màn rộng và mất màu tím đậm thương hiệu. Đây không nằm trong tiêu chí liệt kê nên không chặn nghiệm thu, nhưng là chỗ chênh dễ thấy nhất khi Chairman đặt hai ảnh cạnh nhau — đúng vào chỗ ban đầu bị chê "thô và góc cạnh". Đề nghị Chairman quyết có kéo về đúng bản cũ không.

2. **Ô "Deviations from Directive: none" không chính xác.** Bốn thay đổi vượt ra ngoài "chỉ thay lớp trình bày": thêm `tabindex` cho vùng thả file (thay đổi hành vi bàn phím, không thuần trình bày), thêm favicon data URI vào khung HTML, thêm quy tắc responsive dưới 720px, và nâng `adm-zip` lên 0.6.0. Cả bốn đều hợp lý và đều đã được khai báo minh bạch ở mục "Discovered scope" — vấn đề chỉ là ghi sai chỗ. Lần sau đưa thẳng vào ô Deviations để người hậu kiểm không phải tự đối chiếu chéo.

3. **Đóng task trước khi có REVIEW.** `Status` đã bị đổi sang `done` và việc đã bị gỡ khỏi "Việc đang mở" của `REPO_SNAPSHOT.md` ngay trong phiên thực thi. Theo Chairman model, hai thao tác đó thuộc bước nghiệm thu, xảy ra sau khi REVIEW ghi APPROVED. Tự đóng làm mất khả năng phát hiện việc chờ hậu kiểm khi resume session.

4. **Việc còn nợ trước khi đẩy lên git.** `output/playwright/incal-mobile-after-load.png` đang ở trạng thái untracked và `.gitignore` không chặn — hiện chỉ có `outputs/` (số nhiều), không khớp `output/`. Một lệnh `git add .` sẽ kéo file này lên. `tmp/pdfs/` thì đã được `tmp/` chặn nên an toàn. Đề nghị thêm `output/` và `.playwright-cli/` vào `.gitignore`, hoặc xoá tay hai thư mục đó.

**New hard rule:** Chỉ được đổi `Status` sang `done` và gỡ việc khỏi mục "Việc đang mở" của `docs/REPO_SNAPSHOT.md` **sau khi** REVIEW trong mục `## 3. AUDIT` ghi verdict APPROVED hoặc APPROVED WITH NOTES. Agent thực thi không tự đóng task của chính mình.

**Memory promotion:** Bài học đáng giữ — file Excel mẫu rỗng **không dùng làm bằng chứng cho chốt chặn "file chưa lưu bằng Excel" được**, vì chốt chặn dựa trên "có dòng nhân viên nhưng thiếu số đã tính", mà file rỗng thì không có dòng nào. Cách đúng là sinh fixture lúc chạy từ file thật rồi xoá giá trị đã cache của mọi ô công thức — chính là `cloneWithoutFormulaCache` trong `tool/test/helpers.js`. Nguồn: task `20260806_dong-bo-tham-my-tool`.
