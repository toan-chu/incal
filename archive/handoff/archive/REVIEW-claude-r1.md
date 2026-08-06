# REVIEW R1 — Claude → Codex (2026-07-13)

Khung đạt: cấu trúc, 11/11 test, offline sạch, UMD, chống trừ đúp, TODO đúng chỗ. **Chưa nghiệm thu** — sửa 4 mục sau rồi chạy lại golden.

## FIX-1 (blocker) — Thuế TNCN sai spec
`js/engine/tax.js` hardcode biểu 7 bậc chuẩn tháng — SAI. Spec E7 = đúng công thức BK của FIN: 5 bậc.
- Đọc bảng thuế từ config (thêm vào `config/default.json` + parse từ `7_Config` khi có):
  `pit_rates: [0.05, 0.10, 0.20, 0.30, 0.35]`, `pit_quick: [0, 500000, 3500000, 9500000, 14500000]`
- Công thức đúng theo BK: `thuế = round(max_i( taxable × rate_i − quick_i ), 0)`, floor 0 (chỉ tính khi giảm trừ > 0 theo array formula BK — giữ nguyên hành vi `IF(I>0,...)`: nếu Giảm trừ gia cảnh = 0 → thuế 0, xem BK dòng 20-23).
- CẤM hardcode bảng thuế trong engine. Nguyên tắc handoff: theo bản FIN dùng, không "sửa cho đúng luật".

## FIX-2 (blocker) — Job GP âm bị loại
`js/engine/commission.js`: `jobs.filter(job => job.gpTinh > 0)` vứt job lỗ. XLS Q1 SUMIFS cộng CẢ job GP âm. Sửa: nhận mọi job paid/partial (kể cả gpTinh âm); chỉ loại unpaid (gpTinh = 0 tự nhiên). Thêm unit test: 1 job âm kéo giảm gp mức tương ứng.

## FIX-3 — Chỉ tiêu B2 pro-rate
`chi_tieu_b2` đang cứng 3/quý. Sửa: `chi_tieu_b2_cá_nhân = 1 khách × số tháng làm việc trong quý` (Q1 thật: Tân vào giữa quý → chỉ tiêu 2 — xem `Lũy tiến` G10). Dùng cho cả adj cá nhân (E3) lẫn missingB2 của trưởng BP (E4). Config đổi thành `chi_tieu_b2_per_thang: 1`.

## FIX-4 — RECONCILIATION làm lại cho tử tế
- Nhóm KAM/BO engine ra 0 vì fixture thiếu data → phân loại lại thành **(d) fixture gap** (thêm loại d), không phải (b). Ghi rõ thiếu input gì.
- 6 sales COM: sau FIX-1/2/3 chạy lại; từng dòng lệch còn lại phải có ghi chú RIÊNG chỉ ra khoản nào gây lệch (so từng cấu phần: thưởng waterfall / TBP / phạt / thuế — engine xuất breakdown, so với XLS từng cột thay vì chỉ so thực nhận).
- Mục tiêu thực tế: lệch (b) chỉ được phép nằm ở cấu phần thiếu input (payroll/KAM manual), KHÔNG nằm ở waterfall/phạt của 6 sales.

## Khi xong
`node --test` xanh + RECONCILIATION mới + cập nhật `HANDOFF-codex-done.md` (mục R1 fixes). Vẫn không đụng `docs/spec`, template, BRAND.
