# REPO SNAPSHOT — incal

Bản đồ repo. Đọc file này trước khi bắt đầu bất kỳ việc gì.

**Cập nhật:** 2026-08-07

---

## Repo này làm gì

Đọc file Excel của Trustana → xuất phiếu PDF cho từng nhân viên, và dựng dashboard so sánh nhiều kỳ. Hai loại:

- **Incentive** theo quý — hoa hồng Sale COM / KAE / BO.
- **Phụ cấp** theo tháng — trực đêm (giờ + thưởng BCA) và OPS sân bay / cảng / ga.

**Nguyên tắc bất di bất dịch:** file Excel là nguồn chân lý duy nhất. Công cụ **không tính lại** bất kỳ công thức nào — chỉ đọc giá trị Excel đã lưu sẵn trong file `.xlsx` rồi trình bày lại.

---

## Bản đồ thư mục

| Đường dẫn | Nội dung |
|---|---|
| `Incentive-Template-TRONG.xlsx` | Mẫu rỗng incentive: đủ công thức, đủ danh sách nhân sự, sạch dữ liệu giao dịch. |
| `PhuCap-Template-TRONG.xlsx` | Mẫu rỗng phụ cấp: 120 dòng ca trống đã cài sẵn công thức. |
| `docs/BONUS_FORMULA_NOTES.md` | **Đọc trước khi chi phụ cấp.** Log 7 lỗi công thức của file gốc `tính phụ cấp.xlsx` đã sửa, và 3 điểm chờ FIN quyết. |
| `tool/Phieu-Incentive.html` | **Sản phẩm.** Một file HTML tự chứa, mở bằng trình duyệt. Dựng ra từ `tool/src/`, KHÔNG sửa tay. |
| `tool/build.py` | Đóng gói `tool/src/` thành một file HTML duy nhất. |
| `tool/src/core.js` | Đọc workbook incentive, dựng dữ liệu, kiểm tra file hợp lệ. |
| `tool/src/bonus.js` | Đọc workbook phụ cấp, nhận diện loại file, đối chiếu nhật ký ca với bảng chi. |
| `tool/src/payslip.js` | Dựng phiếu incentive PDF (jsPDF + autoTable, nhúng font để hiện đúng tiếng Việt). |
| `tool/src/bonusslip.js` | Dựng phiếu phụ cấp PDF, cùng bộ font và bảng màu. |
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

Kiểm thử tự tìm file thật theo thứ tự: `INCAL_MASTER` → `2026Q1_Incentive_MASTER.xlsx` ở gốc repo; `INCAL_BONUS_MASTER` → `docs/2026M08_PhuCap_MASTER.xlsx`. Không thấy thì in "BỎ QUA" và thoát sạch, không báo lỗi giả.

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

## Số liệu chuẩn để đối chiếu (phụ cấp — kỳ mẫu Tháng 08/2026)

| Chỉ số | Giá trị |
|---|---|
| Số người | 12 |
| Ca trực đêm · chuyến OPS | 7 · 8 |
| Ca trực · chuyến OPS | 8 · 7 |
| Tổng phụ cấp trực đêm | 3.172.500 |
| Tổng phụ cấp OPS | 2.400.000 |
| **Tổng gross** | **5.572.500** |
| Ca 1 · 22:30–02:30 ngày thường | 1,5h biên + 2,5h lõi, Blaze — 370.000 |
| Ca 2 · 02:30–06:30 ngày thường | 2h biên + 1,5h lõi, Blaze — 335.000 |
| Ca 1 · 22:30–02:30 ngày lễ | 555.000 |
| Chuyến OPS 02:30 ngày lễ | 600.000 + 300.000 phụ trội = 900.000 |

Ba số gross ở trên là **cố định**. Thuế TNCN và thực nhận **không chốt cứng** vì phụ thuộc cột `Dang_Ky_Giam_Tru` do FIN nhập tay — kiểm thử chỉ soát quan hệ `thực nhận = gross − thuế`.

Bất kỳ thay đổi nào làm lệch các số này đều là lỗi.

---

## Việc đang mở

| Task | Trạng thái |
|---|---|
| `handoff/tasks/20260806_ui-balance-cleanup.md` | open - đang sửa spacing, cân bằng giao diện và dọn artifact sinh tự động |
| `handoff/tasks/20260806_cap-nhat-readme.md` | open - cập nhật README và MIT badge |
