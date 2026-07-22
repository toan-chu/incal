# BLOCK CATALOG v3 — Từ điển cột + Catalog khối công thức

**Ngày:** 2026-07-21 · Trạng thái: **để Chairman confirm** trước khi viết Directive.
**Nguồn:** đọc sống `docs/2026Q1_Incentive- (TEST) - Copy.xlsx` (13 sheet). Mọi ánh xạ cột trích từ formula thật, không đoán.

Mục đích: trả lời "GP từ đâu ra", và chốt **Công thức → tham số → định danh → cột** cho từng khối, để Codex đẻ Excel input đúng và dựng engine đúng.

---

## 0. Nguyên tắc: INPUT vs DERIVED

Excel do app đẻ có 2 loại cột:
- **INPUT** (nền trắng, FIN điền/dán): dữ liệu thô từ hệ thống job.
- **DERIVED** (nền xám, khoá, app tự tính): kết quả khối công thức — FIN không gõ.

Phát hiện chốt từ file thật: cột **Profit (GP) hiện là INPUT** — FIN dán sẵn số từ hệ thống, KHÔNG phải formula. Chỉ **Tier (Mức 1/2/3) là DERIVED**. → xem quyết định **Q-GP** ở §1.

---

## 1. Từ điển cột — Excel input "Jobs trong quý" (app đẻ)

Tương ứng sheet `job quy (5)`. Mỗi dòng = 1 job.

| Định danh (app) | Cột XLS | Kiểu | INPUT/DERIVED | Ghi chú |
|---|---|---|---|---|
| Tháng | A | Số (1/2/3) | INPUT | Quyết định tháng active để weight target |
| Mã job | B | Text | INPUT | Định danh job (dùng TRIM) |
| Người (Sale) | C, Q | Text | INPUT | Khớp roster; Q là khoá gộp |
| Khách hàng | T | Text | INPUT | Để tra Tier |
| Nhóm SP / Product / Team | E, F, G | Text | INPUT | Phân loại |
| Doanh thu (DT) | H | Money VND | INPUT | Revenue |
| Chi phí (CP) | I | Money VND | INPUT | Cost |
| CP chưa có COM | J | Money VND | INPUT | Cost chưa gồm COM (xem Q-COST) |
| COM / COM SMS | K, L | Money VND | INPUT | Thành phần COM |
| 20% CP không HĐ | M | Money VND | INPUT | Phụ phí không hoá đơn |
| Phạt (job) | N | Money VND | INPUT | Phạt cấp job |
| Tổng chi phí | O | Money VND | INPUT | = tổng các thành phần cost |
| **Profit (GP)** | **P** | Money VND | **INPUT (hiện tại)** | = DT − Tổng CP. **Q-GP:** giữ dán tay hay app tự tính? |
| Paid / Unpaid | R | Enum | INPUT | Trạng thái thu tiền |
| **% đã thu** | *(mới)* | Percent | INPUT | **MỚI** cho partial-paid (quyết định #1) |
| Posting date | AD | Date | INPUT | Ngày ghi sổ |
| Tier (Mức 1/2/3) | U/X/W → Y | Text | **DERIVED** | App tính, xem §3.0 |

**Quyết định cần chốt:**
- **Q-GP:** GP là (A) FIN dán tay như cũ, hay (B) app tự tính `GP = DT − Tổng CP` (khoá cột, bắt lỗi dán). *Khuyến nghị B* — đúng tinh thần app chống lỗi.
- **Q-COST:** "cost gồm COM" — có 2 cột (CP `I` gồm COM, CP chưa COM `J`). Chốt GP dùng gốc nào. *Khuyến nghị: GP = DT − CP(I) gồm COM,* khớp Profit hiện tại.

---

## 2. Từ điển — Roster + Lương (app-memory, nhập 1 lần)

Tương ứng sheet `lương (4)` + tab Nhân sự.

| Định danh | Cột XLS | Kiểu | Ghi chú |
|---|---|---|---|
| Mã NV / Tên / Title | A / B / — | Text | Roster |
| Hồ sơ tính (COM/KAE/BO) | — | Enum | App suy từ Title+lương, sửa tay |
| Lương gross T1/T2/T3 | C/D/E | Money | Nhập theo tháng; tháng = 0 → không active |
| Tổng lương quý | F | Money | = SUM(T1:T3) — DERIVED |
| **Target tháng** | H/I/J | Money | = **lương tháng × 3** — DERIVED |
| **Target quý (Mức giao chỉ tiêu)** | G | Money | = SUM(target tháng) — DERIVED |
| Phụ cấp KD | K | Money | Max phụ cấp = K × 3 |

→ **COM target = Σ(lương tháng active × 3).** Proration vào/nghỉ = để lương tháng đó trống/0, KHÔNG cần hàm ngày.

---

## 3. Catalog khối — 14 primitive + 3 macro khoá

### 14 khối primitive
| # | Khối | Hàm XLS tương ứng | Kiểu vào → ra |
|---|---|---|---|
| 1 | Lấy nguồn | (chọn bảng jobs/roster) | → bảng |
| 2 | Lọc điều kiện | tiêu chí SUMIFS | bảng → bảng |
| 3 | Quét + Tổng | SUM/SUMIF/SUMIFS/SUBTOTAL | bảng+cột → Money |
| 4 | Tra bảng + fallback | VLOOKUP/IFNA/IFERROR | khoá → giá trị |
| 5 | + − × ÷ | số học | Money/số → Money |
| 6 | % của | ×tỷ lệ | Money+Percent → Money |
| 7 | Điều kiện | IF/IFS | bool → nhánh |
| 8 | Bậc lũy tiến | MAX + mảng | Money → Money |
| 9 | Cap / Floor | MAX/MIN, chặn âm | Money → Money |
| 10 | Làm tròn VND | ROUND(x,0) | Money → Money |
| 11 | So khớp văn bản | TRIM/LOWER | Text → Text/bool |
| 12 | Boolean | AND/OR | bool → bool |
| 13 | Thời gian | tháng active / weight | Số tháng → weight |
| 14 | Đảo dấu | ×(−1) | Money → Money |

### 3 macro khoá (tham số hoá, FIN không lắp tay)
- **M1 — Waterfall Trustana:** IFS lồng 3 bậc + nhánh đặc biệt Level 3 + điều chỉnh ±1%/người. Tham số: rate mức 1/2/3, target, cờ nhánh L3.
- **M2 — Thuế lũy tiến TNCN:** 2 nhánh (HĐLĐ → MAX{5,10,20,30,35}% trừ bậc; ngược lại → 10% khoán).
- **M3 — Pool KAE/KAM:** (5% + 2%) chia đầu người theo tháng.

---

## 3.0 Recipe: Tier (Mức 1/2/3) — DERIVED per job
| Bước | Khối | Tham số | Định danh | Cột nguồn |
|---|---|---|---|---|
| 1 | Tra bảng | VLOOKUP KH vào `List KAE(2)` cột "=1" | KH đã bàn giao? | T (KH) → List KAE(2) |
| 2 | Tra bảng | VLOOKUP KH vào `KH mới(3)` = "6 tháng" | KH mới ≤6 th? | T (KH) → KH mới(3) |
| 3 | So văn bản + Điều kiện | TRIM/LOWER + IF/OR | Mức 1 / Mức 3 / còn lại Mức 2 | U, W, X |
| 4 | Điều kiện | IF ưu tiên 1→3→2 | **Tier Y** | Y |

Mức 1 = KH hiện hữu đã bàn giao · Mức 2 = KH hiện hữu chưa bàn giao · Mức 3 = KH mới ≤6 tháng.

---

## 4. Recipe: COM Waterfall (→ Kết quả COM Sales, sheet 7)

Rate: **Mức 1 = 8% · Mức 2 = 12% · Mức 3 = 17%** (±1% điều chỉnh/người). Target = từ §2.

| Bước | Khối | Tham số | Định danh | Cột nguồn |
|---|---|---|---|---|
| 1 | Lấy nguồn | jobs của người | Jobs người | job quy(5), khoá Q |
| 2 | Lọc | R = "Paid" | Jobs đã thu | R |
| 3 | Quét+Tổng | SUMIFS Profit, theo Tier=Mức1 | GP Mức 1 (R6) | P, lọc Y=Mức1 |
| 4 | Quét+Tổng | SUMIFS Profit, Tier=Mức2 | GP Mức 2 (S6) | P, lọc Y=Mức2 |
| 5 | Quét+Tổng | SUMIFS Profit, Tier=Mức3 | GP Mức 3 (T6) | P, lọc Y=Mức3 |
| 6 | Tra bảng | VLOOKUP người → `lương(4)` G | Target (M6) | lương(4).G |
| 7 | **M1 Waterfall** | rate 8/12/17%, target, ±1% | Thưởng bậc (U6:W6) | R6,S6,T6,M6 |
| 8 | Quét+Tổng | SUM(U:W) | Tổng thưởng COM (X6) | — |
| 9 | Đảo dấu + Tra bảng | −VLOOKUP người → `Phạt(6)` | Trừ phạt (AA6) | Phạt(6) |
| 10 | Cap/Floor | nếu thưởng < phạt → 0 | Sau phạt (AB6) | — |
| 11 | Làm tròn VND | ROUND(,0) | COM ròng | — |

**Nhánh đặc biệt Level 3** (M1 tham số): nếu chưa bậc nào tạo thưởng, Level 3 trừ **toàn target** thay vì remaining — giữ đúng XLS (REVIEW-PACKET §6.7).

---

## 5. Recipe: KAE / Pool KAM (sheet 8)
| Bước | Khối | Tham số | Định danh | Cột nguồn |
|---|---|---|---|---|
| 1 | Quét+Tổng | SUMIFS Profit theo agent KAE + tháng | GP KAE tháng | P, khoá agent (cần FIN xác nhận cột) |
| 2 | **M3 Pool** | 5% nhóm chính + 2% phụ, chia đầu người/tháng | Pool chia (G9,G10) | — |
| 3 | Lọc | Paid | Phần đã thu | R |
| 4 | Làm tròn VND | ROUND | KAE ròng | — |

*Cần FIN xác nhận:* cột định danh agent KAE và số người chia pool mỗi tháng (/4, /5, /6 trong file).

---

## 6. Recipe: BO / Thử việc / Sale khác (sheet 9)
| Bước | Khối | Tham số | Định danh | Cột nguồn |
|---|---|---|---|---|
| 1 | Lấy nguồn + Lọc | jobs người, Paid | Jobs đã thu | job quy(5), R |
| 2 | Quét+Tổng | SUMIFS Profit paid | Profit đã thu (M4) | P |
| 3 | % của | × 8% | Thưởng BO | N=0.08 |
| 4 | Làm tròn VND | ROUND(M×8%,0) | BO ròng (O4) | — |

BO = **8% × profit đã thu**, phẳng.

---

## 7. Recipe: Phạt (sheet 6)
| Bước | Khối | Tham số | Định danh | Cột nguồn |
|---|---|---|---|---|
| 1 | Tra bảng | VLOOKUP người → bảng phạt | Mức phạt/người | Phạt(6) B:F |
| 2 | Đảo dấu | ×(−1) | Trừ vào thưởng | — |

*Bỏ số cứng `−210.483.804` (cắm tay trong file gốc) — app dùng lookup/input, không plug tay.* Base phạt (`×1.08 × 1%`) cần FIN xác nhận công thức.

---

## 8. Recipe: BK + Thuế TNCN (sheet 10) — Net pay
| Bước | Khối | Tham số | Định danh | Cột nguồn |
|---|---|---|---|---|
| 1 | Quét+Tổng | gom COM+KAE+BO/người | Tổng thu nhập tính thuế | KQ(7),(8),(9) |
| 2 | Điều kiện | IF có HĐLĐ | Chọn nhánh thuế | roster |
| 3a | **M2 Thuế** (HĐLĐ) | MAX{5,10,20,30,35}% − bậc {0;500k;3,5tr;9,5tr;14,5tr} | Thuế lũy tiến | — |
| 3b | **M2 Thuế** (còn lại) | × 10% | Thuế khoán | — |
| 4 | + − × ÷ | thưởng − thuế | **Thực nhận** (O6) | — |
| 5 | Làm tròn VND | ROUND | Net pay | — |
| 6 | (xuất) | tách BKê-COM / Khác / BO | 3 bảng kê | — |

---

## 9. Câu cần Chairman confirm

1. **Q-GP:** GP dán tay (A) hay app tự tính DT−CP (B)? *(KN: B)*
2. **Q-COST:** GP dùng CP gồm COM (I) — đúng không? *(KN: đúng)*
3. Cột INPUT §1 + roster §2 đã đủ/đúng chưa? Thiếu cột nào FIN thực dùng?
4. Cột "% đã thu" (mới, cho partial-paid) — đặt ở Excel input job, đúng ý chứ?
5. KAE pool §5 + base phạt §7 — Chairman có số/quy tắc, hay để hỏi FIN?
