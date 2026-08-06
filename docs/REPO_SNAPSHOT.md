# REPO SNAPSHOT — incal

Bản đồ repo. Đọc file này trước khi bắt đầu bất kỳ việc gì.

**Cập nhật:** 2026-08-06

---

## Repo này làm gì

Đọc file Excel incentive của Trustana → xuất phiếu incentive PDF cho từng nhân viên, và dựng dashboard so sánh nhiều quý.

**Nguyên tắc bất di bất dịch:** file Excel là nguồn chân lý duy nhất. Công cụ **không tính lại** bất kỳ công thức nào — chỉ đọc giá trị Excel đã lưu sẵn trong file `.xlsx` rồi trình bày lại.

---

## Bản đồ thư mục

| Đường dẫn | Nội dung |
|---|---|
| `Incentive-Template-TRONG.xlsx` | File mẫu rỗng: đủ công thức, đủ danh sách nhân sự, sạch dữ liệu giao dịch. Đây là file duy nhất được đẩy lên git. |
| `tool/Phieu-Incentive.html` | **Sản phẩm.** Một file HTML tự chứa, mở bằng trình duyệt. Dựng ra từ `tool/src/`, KHÔNG sửa tay. |
| `tool/build.py` | Đóng gói `tool/src/` thành một file HTML duy nhất. |
| `tool/src/core.js` | Đọc workbook, dựng dữ liệu, kiểm tra file hợp lệ. |
| `tool/src/payslip.js` | Dựng phiếu PDF (jsPDF + autoTable, nhúng font để hiện đúng tiếng Việt). |
| `tool/src/ui.js` | Giao diện, biểu đồ canvas, xuất file. |
| `tool/src/app.css` | Trình bày, gồm cả kiểu dành cho lệnh In. |
| `tool/src/index.template.html` | Khung HTML có chỗ cắm `/*__TÊN__*/`. |
| `tool/src/vendor/` | SheetJS, jsPDF, autoTable, JSZip. |
| `tool/src/assets/fonts/*.woff2` | Font cho màn hình: Quicksand, Montserrat, JetBrains Mono. |
| `tool/src/assets/fonts/ttf/*.ttf` | Font cho file PDF: Quicksand, Montserrat — đã gộp bộ latin + tiếng Việt. |
| `tool/test/` | Kiểm thử khói chạy trong DOM giả lập (jsdom). |
| `archive/` | Toàn bộ bản cũ: bộ máy tính toán trong trình duyệt, docs, spec, log, handoff cũ. Giữ để tra cứu, **không còn dùng**. |

---

## Nguồn chân lý thẩm mỹ

`archive/css/app.css` là bản trình bày gốc mà Chairman muốn giữ. Mọi thay đổi giao diện của công cụ mới phải bám theo file này về màu, bo góc, chuyển động, hệ chữ.

---

## Dữ liệu thật không nằm trong git

File có số liệu thật (`2026Q1_Incentive_MASTER.xlsx` và các kỳ sau) do người dùng giữ trên máy, `.gitignore` chặn mọi `.xlsx` trừ file mẫu rỗng.

Kiểm thử tự tìm file thật theo thứ tự: biến môi trường `INCAL_MASTER` → `2026Q1_Incentive_MASTER.xlsx` ở gốc repo. Không thấy thì in "BỎ QUA" và thoát sạch, không báo lỗi giả.

---

## Bố cục file Excel mà công cụ dựa vào

| Sheet | Dùng để |
|---|---|
| `Assumption` | Tham số qua named range (`ky_ten`, `ky_bat_dau`, `rate_*`…) và danh sách nhân sự (tiêu đề `Ma_NV`). |
| `Data` | Bảng job `tbl_jobs` — nhận diện qua tiêu đề `Thang` ở hàng đầu bảng. |
| `Payout` | Bảng chi trả — nhận diện qua tiêu đề `Ma_NV`. |
| `Calc_Sale`, `Calc_KAE`, `Calc_Other` | Cơ sở tính hiển thị trên phiếu. Nhóm tính của mỗi người đọc từ công thức cột `Incentive_Gross`. |

Bảng được tìm theo **tên tiêu đề**, không theo vị trí ô.

---

## Số liệu chuẩn để đối chiếu (kỳ Q1/2026)

| Chỉ số | Giá trị |
|---|---|
| Số người | 15 |
| Số job | 345 |
| Tổng Incentive Gross | 349.765.221 |
| Tổng Thuế TNCN | 34.976.523 |
| **Tổng Incentive Thực nhận** | **314.788.696** |
| Người đầu bảng | Phạm Thị Thương Hoài — thực nhận 171.010.729, 159 deal |
| Cộng dồn hai kỳ (kiểm thử dashboard) | 629.577.392 |

Bất kỳ thay đổi nào làm lệch các số này đều là lỗi.

---

## Việc đang mở

| Task | Trạng thái |
|---|---|
| `handoff/tasks/20260806_ui-balance-cleanup.md` | open - đang sửa spacing, cân bằng giao diện và dọn artifact sinh tự động |
| `handoff/tasks/20260806_cap-nhat-readme.md` | open - cập nhật README và MIT badge |
