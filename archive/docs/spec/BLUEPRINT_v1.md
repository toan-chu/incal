# BLUEPRINT v1 — INCENTIVE CALCULATOR (Trustana FIN)

**Ngày:** 2026-07-13 · **Người viết:** Claude (Cowork) · **Người build:** Codex · **Người review:** Claude + user
**Tài liệu rules:** `docs/theory/HIEN-TRANG_Quy-tac-tinh-Incentive_v2.md` (mục 0 = rules đã chốt — mọi công thức dưới đây ref về đó bằng mã A1..A12)
**Input template:** `TEMPLATE_Input-Incentive_v2.xlsx` (bản FIN đã duyệt + sửa, 2026-07-13 — v1 lưu `docs/theory/`). Codex đọc schema từ bản này.

---

## 1. Sản phẩm

App HTML **offline một-folder**: chị FIN mở `TinhIncentive.html` bằng Chrome/Edge → kéo file `INPUT_Incentive_<quý>.xlsx` vào → tool validate (báo đỏ từng dòng) → bấm Tính → tải về: **BK.xlsx** (bảng chi + thuế TNCN), **BKê từng người** (COM/BO/Khác), **report JSON** + **tidy.xlsx** (cho dashboard/iMetriK). Không server, không mạng, data không rời máy.

**Non-goals (không build):** formula-builder cho user · dashboard trend nhiều quý (phase sau) · xử lý dump Misa thô · sheet Gen (FIN đã bỏ) · nhóm MAR/FIN (cuối năm mới tính — ngoài phạm vi quý).

## 2. Tech stack

| Thành phần | Chọn | Lý do |
|---|---|---|
| Ngôn ngữ | Vanilla JS (ES2020), **không build step, không framework** | Mở file là chạy; giống stack iMetriK; share GitHub cho người khác dùng ngay |
| Đọc/ghi Excel | SheetJS (vendor local) | Đã dùng ổn ở iMetriK |
| Tiền tệ | **Số nguyên VND** xuyên suốt; % nhân trước, `Math.round` tại các điểm chốt (theo vị trí ROUND trong file Q1) | Tránh lỗi floating point |
| Test | Node ≥18, `node --test`. Module calc viết dạng UMD-lite (`module.exports` guard) để chạy được cả browser lẫn Node | Golden test bắt buộc |
| UI | 1 trang: khung drop file → bảng lỗi validate → nút Tính → khu download + preview tổng | Không SPA, không router |
| Font/style | Be Vietnam Pro local (lấy từ iMetriK), CSS thuần | Glyph tiếng Việt |

## 3. Cấu trúc repo

**Trải nghiệm FIN (bắt buộc):** thứ duy nhất chị FIN thấy = folder có 1 file `TinhIncentive.html` ở gốc (double-click là mở) + folder `reports/` trống để lưu kết quả các quý. Mọi thứ khác (`js/`, `css/`, `config/`, `test/`, `docs/`) là nội bộ, chị ấy không bao giờ cần mở. Không compile, không cài đặt, không cần mạng; update = thay nguyên folder.

```
incentive-calculator/
├── TinhIncentive.html      # UI shell — file duy nhất FIN đụng tới
├── css/app.css
├── js/
│   ├── app.js              # wiring UI ↔ engine
│   ├── engine/
│   │   ├── parse.js        # đọc workbook → objects theo schema mục 5
│   │   ├── validate.js     # mục 6
│   │   ├── enrich.js       # bước E1 (chi phí, GP, phần đã thu)
│   │   ├── classify.js     # bước E2 (mức 1/2/3)
│   │   ├── commission.js   # bước E3-E5 (waterfall, trưởng BP, KAM, BO, Spring)
│   │   ├── penalty.js      # bước E6
│   │   ├── tax.js          # bước E7 (TNCN lũy tiến)
│   │   └── assemble.js     # bước E8 (ráp, floor, đối chiếu)
│   ├── export/
│   │   ├── xlsx_bk.js      # BK.xlsx
│   │   ├── xlsx_bke.js     # BKê từng người
│   │   └── report.js       # report JSON + tidy.xlsx
│   └── vendor/xlsx.full.min.js
├── config/default.json     # snapshot 7_Config (tool ưu tiên đọc từ file input; JSON là fallback + schema)
├── test/
│   ├── golden/             # input Q1 tái tạo + expected từ file Q1 gốc
│   ├── engine.test.js      # unit từng module
│   └── golden.test.js      # reconciliation 3 loại lệch
└── docs/ (đã có)
```

## 4. Pipeline engine (đoạn giữa = 8 bước)

```
parse → validate → E1 enrich → E2 classify → E3 commission Sales → E4 trưởng BP
                                            → E4b KAM → E4c BO/thử việc → E4d Spring
→ E6 penalty → E7 tax → E8 assemble/floor → export
```

### E1 — Enrich job (ref A8b, A8c, A4)
```
cp_chua_com = chi_phi - com
com_sms     = round(com × cfg.he_so_com_sms)        # 1.125 = 0.9/0.8 (A8b)
cp_final    = cp_chua_com + com_sms + round(cfg.tndn_gross_up × cp_khong_hoa_don)   # 20% (A8c)
gp          = doanh_thu - cp_final
# A4 — thanh toán một phần:
gp_tinh     = paid ? gp : (so_tien_da_thu > 0 ? round(gp × so_tien_da_thu / doanh_thu) : 0)
# ⚠ giả định pro-rata theo tỷ lệ đã thu/doanh thu — verify với FIN bằng 1 case Q1
```

### E2 — Phân loại mức (ref 0.1-A5, mục 3.2 HIEN-TRANG; cập nhật theo template v2)
**Nguồn chính:** cột `Phân loại` trong `1_Job` (từ list Trân), taxonomy 4 giá trị: `General`→mức 2 · `KAE Admin`→mức 1 (đồng thời vào pool KAM 5%) · `KAE Sale`→mức 1 (pool KAM 2%) · `New`→mức 3.
**Engine đối chiếu (cross-check, khóa match "Tên trên SMS" normalize):**
```
tự_phân: KH ∈ 4_KAE → mức 1 · KH ∈ 5_KHMoi có HĐ và job.tháng ≤ tháng_ký + 5 → mức 3 · còn lại → mức 2
KH mới KHÔNG có HĐ → mức 2 (A5) · New nhưng quá cửa sổ 6 tháng → hạ mức 2 + warning
Phân_loại_input ≠ tự_phân → WARNING liệt kê từng dòng (không chặn — input là chân lý, engine là người soát)
```
**Cột derived FIN thêm vào input (`Profit`, `Mức 1/2/3` trong 1_Job; `tính tháng kh mới` trong 5_KHMoi): engine ĐỌC BỎ QUA** — chỉ là cột hiển thị cho FIN, không phải nguồn số. Engine luôn tự tính theo E1/E3.

### E3 — Commission Sales chính thức (ref A3, 0.2-3; thay 3 công thức IFS × 2 block của XLS)
```
cho mỗi Sales:
  target  = Σ_tháng_chính_thức( cfg.he_so_target × lương_gross_tháng )   # pro-rate theo THÁNG (A6/A7)
  gp      = [Σgp_tinh mức1, mức2, mức3]        # chỉ job paid/partial-paid
  adj     = (số_KH_mới_đạt − cfg.chi_tieu_b2) × cfg.adj_per_kh   # cap cộng +3%, không cap trừ
  còn_lại = target; thưởng = 0
  for m in [1,2,3]:
      vượt     = max(0, gp[m] − còn_lại)
      còn_lại  = max(0, còn_lại − gp[m])
      rate     = cfg.rate[m] + (m ≥ 2 ? adj : 0)      # mức 1 không adj
      thưởng  += round(vượt × rate)
# số_KH_mới_đạt: đếm KH ∈ 5_KHMoi (Tổ chức) của Sales đó trong quý — thay cột H gõ tay
```

### E4 — Trưởng BP (ref 0.2-2, ảnh note FIN)
```
thiếu_b2   = max(0, Σ_thành_viên(chi_tiêu_b2_cá_nhân − đạt))       # tổng toàn team, không gồm trưởng
rate       = cfg.truong_bp_rate − min(thiếu_b2 × cfg.truong_bp_tru, cfg.truong_bp_cap_tru)  # 2.4% − min(n×0.2%, 0.6%)
thưởng_TBP = round(rate × (Σprofit_team − Σtarget_team))            # không gồm trưởng BP; Q1 = 1.8%
```

### E4b — KAM (PTSP + CX) (ref A6)
```
pool = round(Σgp_paid(KH nhóm "KAE Admin") × 5% + Σgp_paid(KH nhóm "KAE Sale") × 2%) − phạt_team_KAE
hệ_số_i = số tháng làm việc trong quý của người i (chính thức giữa quý → như ví dụ Trang: 2/3)
chia:   incentive_i = round(pool × hệ_số_i / Σhệ_số)
# ⚠ OPEN: block KPI 40/30/30 trong XLS Q1 (COM dòng 17-19) mâu thuẫn "chia đều" — Q1 Vi bị Failed=0.
#   Spec theo A6 (chia đều); KPI gate cá nhân đánh dấu chờ FIN xác nhận khi review golden test.
```

### E4c — BO / thử việc (ref A7): `round(8% × Σgp_tinh)` — điều kiện có doanh thu; người chuyển chính thức giữa quý: job các tháng thử việc tính 8%, các tháng chính thức vào E3.

### E4d — Spring (ref B9): `round(2.5% × cfg.spring_doanh_thu_da_thu)` chia người tham gia (cfg). ⚠ OPEN: chia đều hay theo đóng góp — hỏi FIN.

### E6 — Phạt (ref A1, A10)
```
phạt_unpaid_i = Σ_job_unpaid( round(doanh_thu × cfg.vat × cfg.phat_rate × số_tháng_unpaid) )
# số_tháng_unpaid: từ tháng job đến tháng cuối quý (khớp cột H sheet Phạt Q1) — verify golden
phạt_khác_i   = Σ 6_PhatNoXau theo NV (nợ xấu = số trích lập, trừ thẳng — A10; "Chia cho Team KAE" → vào pool E4b)
# CHỐNG TRỪ ĐÚP (template v2): phạt unpaid do ENGINE tự tính từ 1_Job. 6_PhatNoXau chỉ nhận
# loại {Nợ khó đòi, Truy thu, Phạt khác}. Dòng sheet 6 có Job No trùng job unpaid trong 1_Job
# → WARNING double-count, không cộng lần 2. (Chờ FIN xác nhận — câu hỏi mở 7)
```

### E7 — Thuế TNCN (công thức array trong BK, luật lũy tiến)
```
thu_nhập_tính_thuế = max(0, incentive + thu_nhập_chịu_thuế_bảng_lương − bhxh − giảm_trừ)
thuế_tổng = round(max( thu_nhập_tính_thuế × {5,10,20,30,35}% − {0; 0.5tr; 3.5tr; 9.5tr; 14.5tr} ))
thuế_trên_incentive = thuế_tổng − thuế_đã_trừ_bảng_lương (cột từ 3_NhanSu)
```

### E8 — Assemble
```
thực_nhận = max(0, thưởng + thưởng_TBP − phạt) − thuế_trên_incentive + cộng_trừ_khác   # floor 0 (Gen I7, COM N5)
tổng_toàn_cty; đối_chiếu nội bộ: Σ per-job = per-person = tổng (assert, không cần dòng reconciliation tay)
```

## 5. Schema input

Đọc theo **tên sheet + tên cột** (không theo vị trí). Sheet: `1_Job`, `2_ChotQuy`, `3_NhanSu`, `4_KAE`, `5_KHMoi`, `6_PhatNoXau`, `7_Config` — cột như TEMPLATE v1. Mọi khác biệt sau khi FIN duyệt template → cập nhật `parse.js` + file này.

## 6. Validate (chặn trước khi tính — thay việc FIN dò tay)

Blocking: sheet/cột thiếu · Job No trùng trong 1_Job · Salesman không có trong 3_NhanSu · người thiếu lương gross (trừ nhóm Không tính) · Paid/Unpaid ngoài {Paid, Unpaid} · job Unpaid có "số tiền đã thu" > doanh thu · config thiếu/không phải số.
Warning: job trong 1_Job không có trong 2_ChotQuy và ngược lại (thay 2 cột TEST cũ) · KH không match được 4_KAE/5_KHMoi (rơi về mức 2 — liệt kê để FIN liếc) · KH mới thiếu ngày ký HĐ · NV nghỉ việc có incentive (nhắc điều kiện A12).

## 7. Output

1. **BK.xlsx** — đúng cột file Q1 (trừ 4 cột payroll giờ lấy từ 3_NhanSu), có dòng tổng.
2. **BKe_<MaNV>_<quý>.xlsx** (hoặc 1 file nhiều sheet — hỏi FIN thích kiểu nào): format theo BKê-COM/Bkê-BO/Bkê-Khac Q1, kèm bảng job cấu thành (trace per-job — yêu cầu C2).
3. **report_<quý>.json** — run artifact: `{quarter, generated_at, config_snapshot, totals, per_person[], per_job[], validation{errors,warnings}}` → nguồn cho dashboard trend/CEO sau này.
4. **tidy_<quý>.xlsx** — 1 sheet phẳng: `NV | team | nhóm tính | job | KH | tháng | mức | GP | rate | thưởng | phạt | thuế | thực nhận` → iMetriK bản hiện tại mở được ngay.

## 7b. UI spec (P3)

**Nguyên tắc:** 1 trang duy nhất, chảy dọc theo thứ tự thao tác, không menu/tab/router. Phẳng, nền trắng, border mảnh, KHÔNG gradient/shadow/emoji. Màu chỉ mang nghĩa: đỏ = lỗi chặn, vàng = cảnh báo. Toàn bộ label tiếng Việt.

**Brand Trustana (assets/BRAND.md):**
- Tím `#4d148c` = màu accent chính: header wordmark, nút "Tính incentive", badge quý, link/focus.
- Cam `#ff6200` = điểm nhấn phụ, CHỈ dùng trang trí tĩnh (phần "ANA" trong wordmark, đường kẻ mảnh) — **cấm dùng cho trạng thái/cảnh báo** vì dễ nhầm với vàng warning.
- Font: **Roboto** cho heading (vendor local woff2 — bắt buộc offline, có glyph tiếng Việt), **Calibri** cho body (font hệ thống Windows, fallback: `Calibri, 'Segoe UI', system-ui`).
- Logo: lấy từ `assets/` (user bỏ file vào), hiển thị ở header, cao ≤ 28px.

**Layout từ trên xuống:**
1. Header: tên tool + badge quý (đọc từ file input) + nút Cài đặt (mở panel config, chỉ sửa Giá trị).
2. Drop zone: kéo/chọn file input → hiện tóm tắt đọc được (n sheet, n job, n nhân viên).
3. Khối "Kiểm tra dữ liệu": đếm lỗi chặn/cảnh báo; mỗi dòng = badge loại + sheet + dòng + mô tả cụ thể (vd: `1_Job dòng 87 — Salesman "Le Thi Hang " không khớp 3_NhanSu (thừa dấu cách)`). Còn lỗi chặn → nút Tính disabled kèm lý do.
4. Nút "Tính incentive" (nút đậm duy nhất trên trang).
5. Kết quả: 4 metric card (Tổng chi · Người có thưởng · Tổng phạt · Thuế TNCN) + bảng per-người (click tên → xổ chi tiết từng job cấu thành — yêu cầu C2) + hàng nút download: BK.xlsx / Bảng kê n người / tidy.xlsx / report.json.

**Số tiền:** format `toLocaleString('vi-VN')`, đơn vị ₫, không thập phân.

## 8. Golden test (bắt buộc pass trước khi giao)

- `test/golden/`: input Q1 tái tạo từ file gốc (`docs/origin/2026Q1...xlsx`) + expected = số đã chi 11/6.
- **Không yêu cầu match 100%.** Mỗi chênh lệch phải phân loại được: (a) bug XLS đã biết (VLOOKUP lệch hàng `Lũy tiến` D16-D20, `#REF!` D21, `COM!L5`=0...) — engine đúng, ghi nhận; (b) rule ngầm mới lộ — dừng, hỏi FIN; (c) bug engine — sửa.
- Output test = bảng reconciliation: `người | khoản | XLS | engine | lệch | phân loại | ghi chú`.
- Unit test riêng: waterfall E3 (5 case biên: target=0, gp<target, adj âm, đạt 0 khách, thử việc chuyển giữa quý), thuế E7 (5 bậc), phạt E6.

## 9. Phases cho Codex

| Phase | Giao | DoD |
|---|---|---|
| P1 | `engine/` + unit tests | `node --test` xanh; chạy được từ Node thuần không cần browser |
| P2 | golden Q1 + reconciliation | Bảng lệch có phân loại đầy đủ, không còn lệch loại (c) |
| P3 | UI + parse/validate + export BK/BKê | FIN kéo file thật Q1 → ra BK khớp golden |
| P4 | report JSON + tidy.xlsx | iMetriK mở tidy.xlsx hiển thị được |

## 10. Câu hỏi mở (không chặn P1)

1. KAM: KPI gate 40/30/30 còn hiệu lực trên từng người trước khi chia đều không? (E4b)
2. Spring: chia đều người tham gia? (E4d)
3. Số tháng unpaid đếm từ tháng job hay tháng xuất hóa đơn? (E6 — verify golden)
4. BKê: từng file/người hay 1 file nhiều sheet? (P3)
5. ~~Template FIN duyệt~~ → đã ráp v2 (E2, E6).
6. Cột "Chi phí" trong 1_Job đã gồm COM chưa? Header v2 nói gồm, nhưng công thức Profit FIN điền (`DT − CP − COM − CPkoHĐ`) ngụ ý chưa gồm + trừ 100% CP không HĐ thay vì gross-up 20%. **Engine tính theo E1 (logic Q1); đang chờ FIN trả lời — nếu "chưa gồm" thì bỏ phép trừ `chi_phi - com` trong E1.**
7. Phạt unpaid: engine tự tính từ 1_Job (spec hiện tại) hay FIN liệt kê tay trong 6_PhatNoXau? Chờ FIN — hiện áp rule chống trừ đúp ở E6.
