# HANDOFF — Context cho Claude (Trustana Incentive Calculator v3)

**Mục đích:** để một phiên Claude mới (mở repo này bên GIT) nắm ngay vai trò, trạng thái và việc tiếp theo mà không phải đọc lại từ đầu. Đọc file này TRƯỚC.

**Cập nhật:** 2026-07-21

---

## 1. Vai của Claude ở đây

Chairman model. Claude = **CEO** (nắm business intent, brainstorm với Chairman, viết Directive 4 trường, hậu kiểm REPORT của Codex bằng review tĩnh). Chairman = **Nam** (vision, duyệt big bet, phân xử). Codex = **CTO** (toàn quyền technical plan + execute). Tranh chấp: evidence thắng, không phải vai vế.

Nguyên tắc bắt buộc:
- **Evidence trước, kết luận sau.** Đọc đủ file/cell rồi mới phán. Mọi claim factual kèm nguồn.
- **Tư duy phản biện mặc định.** Tìm điểm yếu trước, đưa alternative, rồi mới confirm.
- **Không runtime-verify artifact Windows từ sandbox.** Chỉ review tĩnh; runtime giao Codex/Chairman.
- Ngôn ngữ kinh doanh, tiếng Việt, ngắn gọn.

## 2. Dự án là gì

Công cụ tính incentive **offline** cho FIN Trustana, thay file Excel 41 sheet dễ lỗi. Định hướng v3 (Chairman chốt 2026-07-21):
- App tạo công thức trực quan **có kiểu dữ liệu** (khối kéo-thả, không gõ text thô, không eval).
- Công thức lưu **JSON preset**, tái dùng + chia sẻ được; **dữ liệu sống trong Excel do FIN tự nạp** — không lên GitHub.
- Công thức **tự sinh Excel input** đúng các cột nó dùng.
- 4 tab: **Nhân sự · Công thức · Tính Incentive · Dashboard**.
- Lớp **thương hiệu** (logo/màu/font) tách rời, đổi để share.
- Đập v3 dựng lại, đưa GitHub; đóng băng v2 làm tham chiếu; tái dùng engine deterministic + export + font/BRAND.

## 3. Trạng thái hiện tại

- **Đã xong:** review v3 đầy đủ → `handoff/REVIEW-Claude_Drag-Drop-Calculator.md` (verdict, ma trận 14 quyết định, 14 khối element, ranh giới data/branding/scope, kiến trúc, P0/P1/P2, scope Directive).
- **Đã kiểm chứng:** trích sống 4.637 công thức từ `docs/2026Q1_Incentive- (TEST) - Copy.xlsx`; khớp catalog của Sol (`REVIEW-PACKET_Drag-Drop-Calculator.md`).
- **Chưa làm:** Directive cho Codex (chờ Chairman trả 3 câu §9 của REVIEW). Chưa đập/sửa code.

## 4. Bộ 14 khối element (scope cứng v1)

Lấy nguồn · Lọc điều kiện · Quét+Tổng (SUM/SUMIF/SUMIFS/SUBTOTAL) · Tra bảng+fallback (VLOOKUP/IFNA/IFERROR) · +−×÷ · % của · Điều kiện (IF/IFS) · Bậc lũy tiến (MAX+mảng) · Cap/Floor · Làm tròn VND · So khớp văn bản (TRIM/LOWER) · Boolean (AND/OR) · Thời gian (EDATE/YEAR/MONTH) · Đảo dấu. Toàn bộ công thức file hiện tại nằm trong 14 họ này; thêm khối mới chỉ khi phát sinh.

## 5. Hai việc CHẶN trước khi Codex code

1. **Tách dữ liệu khỏi repo** — `.gitignore` chặn `*.xlsx` dữ liệu, `docs/origin`, report thật. Repo chỉ có code + preset rỗng + Excel mẫu rỗng. (Lương, thuế, tên NV, công nợ KH = nhạy cảm.)
2. **Gộp 2 lớp công thức về 1 registry** — hiện `calculator.js` (v2) và `commission.js/enrich.js` (v1) chồng nhau, test pass cả hai hành vi mâu thuẫn (packet §11.1).

## 6. Ba câu đang chờ Chairman (§9 của REVIEW)

1. **#7 Partial-paid:** theo FIN (tính GP theo tỷ lệ đã thu, theory A4) hay ép binary như Blueprint v2 §7? *(KN: theo FIN.)*
2. **#5/#6/#10/#12:** gật theo khuyến nghị (giữ đúng hành vi XLS + thuế theo BK `taxable×10%`) hay bàn từng cái?
3. **Số vàng nghiệm thu:** xin tổng chi thật Q1 (11/6) từ FIN, hay treo tới UAT?

## 7. Bản đồ file quan trọng

| File | Vai trò |
|---|---|
| `handoff/REVIEW-Claude_Drag-Drop-Calculator.md` | Review v3 — nguồn quyết định |
| `handoff/REVIEW-PACKET_Drag-Drop-Calculator.md` | Discovery của Sol (formula catalog §6) |
| `docs/spec/BLUEPRINT_v2_Config-Studio.md` | Blueprint v2 (tham chiếu, không sửa) |
| `docs/theory/HIEN-TRANG_Quy-tac-tinh-Incentive_v2.md` | Quy tắc nghiệp vụ + chốt checklist FIN |
| `docs/2026Q1_Incentive- (TEST) - Copy.xlsx` | Nguồn công thức thật (13 sheet) — **KHÔNG commit** |
| `docs/spec/UI-LAYOUT_v3.md` | Wireframe 4 tab + design language |
| `docs/spec/UI-MOCKUP_v3.html` | Mockup trực quan Trustana |
| `js/engine/*` | Engine v2 hiện tại (tái dùng phần deterministic) |

## 8. Việc tiếp theo (khi Chairman trả §6)

Viết Directive 4 trường (goal+context / rough technical direction / out-of-scope / acceptance criteria) vào `handoff/todo.md` giao Codex, theo scope §8 của REVIEW. Kèm ranh giới data/branding/scope §5 REVIEW làm out-of-scope + acceptance criteria.
