# HANDOFF — Đối soát preset Q1 với file input mới (Claude → Codex)

**Ngày:** 2026-07-23 · **Từ:** Claude (CEO) · **Cho:** Codex (CTO) + Chairman
**Kết luận 1 dòng:** Engine/preset KHÔNG hỏng. Sau khi vá 3 lỗi dữ liệu trong file input + cấp giá trị điều chỉnh ±1%, **cả 7 người khớp FIN tới đồng (7/7, lệch 0)**.

---

## 1. Bối cảnh

- File input mới: `2026Q1-Incentive-Table.xlsx` (root) — 4 sheet Jobs · Nhân sự · Khách hàng · Công nợ chi tiết; 345 job thật Q1.
- Số vàng đối chiếu: `docs/2026Q1_Incentive- (TEST) - Copy.xlsx`, sheet **`KQ Sale. (7)`**, cột **AB = "Tổng Incentive"**.
- Yêu cầu Chairman: (a) bộ lọc quét đủ 4 tuyến `General/New/KAE Admin/KAE Sale`; (b) mọi người khớp FIN.

## 2. Số vàng FIN (sheet KQ Sale 7, cột AB)

| Mã (chuẩn FIN) | Tên | Incentive (AB) |
|---|---|---|
| TTN22.005 | Phạm Thị Thương Hoài | 174.380.850,85 |
| TTN24.002 | Phạm Trần Hiếu | 22.309.097,34 |
| TTN24.006 | Trần Văn Hiếu | 13.907.095,67 |
| TTN25.001 | Lê Thị Hằng | 34.678.989,24 |
| TTN25.005 | Kim Thanh Thư | 41.842.269,76 |
| TTN25.010 | Nguyễn Duy Tân | 0 (Failed, thử việc) |
| TTN25.099 | Nguyễn Gia Bảo | 0 (học việc) |

## 3. Mô hình toán đã xác nhận (khớp tay + khớp engine cả 5 người)

**3.1. Reconcile gốc (khớp tuyệt đối):** với mỗi người, tổng GP job **đã thu (Paid)** tách theo Mức khách hàng = R/S/T của FIN:
- Mức 1 = KH hiện hữu đã bàn giao KAE; Mức 2 = KH hiện hữu chưa bàn giao; Mức 3 = KH mới ≤6 tháng.
- Mức lấy từ sheet Khách hàng (map theo tên KH; đã kiểm: 0 mâu thuẫn Mức/KH).

**3.2. Waterfall** = `js/core/registry.js :: executeWaterfall` (rates gốc `[0.08, 0.12, 0.17]`):
```
remaining = target; priorAwarded = false; total = 0
level 1: excess = max(0, gp1 - remaining);                 rate = 0.08
level 2: excess = priorAwarded ? max(0,gp2) : max(0,gp2-remaining);  rate = 0.12 + adj
level 3: excess = priorAwarded ? max(0,gp3) : max(0,gp3-target);     rate = 0.17 + adj
remaining -= gp (mỗi bước, sàn 0); nếu amount>0 → priorAwarded=true; total += excess*rate
```
→ Chỉ tiêu (target) bị trừ dần từ Mức 1 rồi Mức 2. Điều chỉnh `adj` chỉ áp cho **Mức 2 & Mức 3**.

**3.3. Điều chỉnh ±1% (KH mới) — CÔNG THỨC ĐÚNG, không phải cộng phức tạp:**
```
adj = 0.01 × (số KH-mới ĐẠT − số KH-mới GIAO)     [FIN: Q = "Mức đạt", P = "Mức giao (KH mới)"]
```
Q1: Hoài 0 · P.T.Hiếu **+0,01** (Q4−P3) · T.V.Hiếu **−0,01** (Q2−P3) · Lê Hằng **+0,02** (Q5−P3) · Kim **−0,01** (Q2−P3).
`executeWaterfall` HIỆN TẠI đã implement đúng (`rate = rates[i] + (level>=2 ? adjustment : 0)`). Không cần sửa macro.

**3.4. Phạt** = `Σ (Doanh thu sau thuế × Số tháng quá hạn × 1%)` trên sheet Công nợ chi tiết (khớp từng dòng).

**3.5. Incentive cuối = Waterfall(gross) − Phạt.** (Hoài: 179.904.205,88 − 5.523.355,03 = 174.380.850,85 ✓.)

## 4. Ba lỗi DỮ LIỆU trong file input (không phải lỗi code)

| # | Lỗi | Chi tiết | Trạng thái |
|---|---|---|---|
| 1 | Mã 2 Hiếu hoán ở sheet Nhân sự | Nhân sự ghi TTN24.002=Trần Văn Hiếu, nhưng Jobs+FIN = Phạm Trần Hiếu (và ngược lại) | **Claude ĐÃ SỬA** (đổi tên trong Nhân sự khớp FIN) |
| 2 | "Target quý" nhập nhầm tháng | 4 người (TTN24.002/24.006/25.001/25.005) = **24.000.000**, phải là **72.000.000** (24tr×3). Hoài 90tr đúng | **CHƯA sửa** — cần sửa trong Excel |
| 3 | Ô Team trống | Job `EXSANA26010130` (Lê Hằng, GRAND FORWARDING) để trống cột Team → bộ lọc `in` bỏ sót, mất 5.246.070 ở Mức 3 | **CHƯA sửa** — cần điền tuyến |

## 5. Thay đổi Claude đã ghi vào repo

- `presets/trustana-q1.json` (version 4):
  - 2 node `filter` Team: `eq "COM"` → `in "General, New, KAE Admin, KAE Sale"` (recipe `com` + `tax`).
  - 2 node `macro.waterfall`: input `adjustment` → `{kind:"literal", value:0}` **(TẠM, vì file bỏ cột Điều chỉnh %)** — Codex thay bằng nguồn adj thật.
- `2026Q1-Incentive-Table.xlsx`: sửa lỗi #1 (mã Hiếu).

## 6. Việc còn lại cho Codex

1. **Cấp giá trị `adj` per người** (Chairman chọn "làm khối tự tính"):
   - Dựng khối/logic tính `adj = 0.01 × (KH-mới đạt − KH-mới giao)`. Cần 2 dữ liệu đầu vào: **số KH-mới giao/người** (chỉ tiêu) và **cờ KH-mới** để đếm KH-mới đạt (KH có Mức 3 / mới ≤6 tháng).
   - Trỏ input `adjustment` của `macro.waterfall` sang nguồn này (thay literal 0).
2. **Sửa 2 lỗi data còn lại** (#2 Target 24→72tr, #3 ô Team trống) — hoặc thêm **validate cảnh báo**: Target quý < tổng 3 tháng lương*hệ số, và job thiếu Team.
3. **Cân nhắc bộ lọc Team**: hiện `in [4 tuyến]` sẽ rớt ô trống. Vì incentive COM đếm mọi job của người (đã scope theo Mã NV), có thể bỏ hẳn filter Team hoặc chấp nhận cả ô trống — Chairman chốt.

## 7. Cách verify (số vàng)

Chạy engine per-person (`engine.runPreset(preset, materializeWorkbook(...))`), lấy `grossIncentive − penalty`, so bảng §2. Khi vá đủ #1/#2/#3 + cấp adj §3.3 → **7/7 khớp lệch 0** (Claude đã chứng minh trong sandbox Node).

## 8. Điểm nghiệp vụ lặp lại (cho Chairman)

Cả 3 lỗi đều là **nhập tay sai trong Excel** (mã hoán, tháng/quý, bỏ trống) — đúng rủi ro Chairman lo về Mã NV. Engine chỉ trung thực phản chiếu dữ liệu. Hướng giảm lỗi: dropdown ràng buộc + validate đầu vào (đưa vào scope Config Studio).

---

## 9. BỔ SUNG 2026-07-23 (đợt 2) — 3 điều kiện trước khi giao file mẫu cho FIN

Chairman xác nhận quy trình: Codex sửa → sinh file mẫu → FIN input đầy đủ → nạp preset. Trước khi "nạp là chạy đúng", Codex PHẢI xử 3 chỗ sau:

**9.1. Khối ±1% cần thêm cột dữ liệu vào file mẫu.**
Công thức `adj = 0.01 × (KH-mới ĐẠT − KH-mới GIAO)`. "Đạt" đếm được từ số KH distinct ở Mức 3 của người. "Giao" (chỉ tiêu KH mới/người, Q1 hầu hết = 3) **hiện KHÔNG có cột nào** → thêm cột **"Chỉ tiêu KH mới"** vào sheet Nhân sự của file mẫu, để trống cho FIN nhập (mặc định gợi ý 3). Không có cột này thì khối không tính được.

**9.2. Chốt phạm vi trước khi mở "đầy đủ mọi người".**
Preset Q1 hiện chỉ có recipe **COM** (7 người trong Nhân sự). Nhóm **BO** (Trần Thiên Hương, Ngô Thúy Hằng, Võ Lê Huyền Trân — 8% profit đã thu) và **KAE/Admin** (pool 5%/2%) CHƯA có recipe. Nếu FIN nhập cả nhóm này → họ ra 0/sai. Hai lựa chọn, Codex trình Chairman chốt:
- (A) Giữ phạm vi COM, file mẫu chỉ nhận nhóm COM (an toàn, đúng "test trước").
- (B) Bổ sung recipe BO + KAE_pool (macro `kae_pool` đã có sẵn trong registry) → việc lớn hơn, cần số vàng BO/KAE từ FIN sheet `KQ.KAE (8)` và `KQ. Sale khác (9)`.

**9.3. Validate chống tái phạm lỗi nhập tay** (3 lỗi vừa rồi đều do gõ tay):
- Cảnh báo khi "Target quý" < tổng lương 3 tháng hoặc nghi là số tháng (vd < 30tr mà có job lớn).
- Cảnh báo job thiếu cột Team (như `EXSANA26010130`).
- Cảnh báo Mã NV có tên lệch giữa sheet Nhân sự và Jobs (như 2 Hiếu).
- Dropdown ràng buộc tên/tuyến khi có thể.

**9.4. Cập nhật README.** Codex update `README.md`: cách nạp preset Q1 mới, các cột file mẫu (kèm cột mới "Chỉ tiêu KH mới"), 4 tuyến Team hợp lệ, và ghi chú 3 lỗi data đã sửa để FIN tránh lặp.

---

## 10. VIỆC CỦA CHAIRMAN (chỉ cần đọc mục này)

1. **Đưa file handoff này cho Codex.** Bảo nó: làm §6 + §9, và update README (§9.4).
2. **Chờ Codex xong**, nó sẽ hỏi lại 1 điều: giữ phạm vi COM (A) hay thêm BO/KAE (B) — §9.2. Trả lời "A" nếu chỉ muốn test nhanh nhóm COM.
3. **Một ô Excel cần điền tay:** job `EXSANA26010130` (Lê Thị Hằng) đang trống cột Team → điền tuyến của nó (hỏi FIN: General/New/KAE Admin/KAE Sale).
4. **Khi Codex giao file mẫu mới**, đưa FIN nhập → nạp preset → cả nhóm COM khớp FIN là đạt.

*Nghỉ được rồi. Danh sách này đợi sẵn khi Chairman quay lại.*
