# REVIEW — Claude → Chairman: Drag-and-drop Incentive Calculator (v3)

**Ngày:** 2026-07-21
**Người review:** Claude (Cowork, vai CEO) → Chairman
**Phạm vi:** Chốt hướng sản phẩm v3 + trả 14 quyết định làm nền cho Directive giao Codex. Chưa sửa code, chưa đập repo, chưa triển khai.
**Nguồn đối chiếu (đã đọc trực tiếp phiên này):** `docs/2026Q1_Incentive- (TEST) - Copy.xlsx` (13 sheet, trích 4.637 công thức sống), `docs/spec/BLUEPRINT_v2_Config-Studio.md`, `docs/theory/HIEN-TRANG_Quy-tac-tinh-Incentive_v2.md`, `handoff/REVIEW-PACKET_Drag-Drop-Calculator.md` (Sol), `handoff/HANDOFF-codex-done.md`, `js/engine/*`, `config/default.json`.

---

## 1. Verdict

Hướng Chairman chốt phiên 2026-07-21 — **app tạo công thức trực quan có kiểu dữ liệu, công thức lưu trong JSON preset, tự sinh Excel input, đập repo cũ dựng lại v3, đưa GitHub, giao Codex thực thi** — là hướng **đúng và làm được**. Không phải "A hay B" mà là *A về cơ chế (khối có kiểu, chống lỗi) + B về độ tự do lắp ghép*. Điểm ăn tiền: **công thức định nghĩa luôn input Excel**, và **dữ liệu không bao giờ lên GitHub** vì chỉ công thức (JSON) được chia sẻ.

Kiểm chứng công thức của Sol: **khớp**. Waterfall cột U/V/W, thuế BK J24, phạt I27 trong packet Sol trùng khít cell sống. Các điểm Sol đánh dấu "cần xác nhận" không phải đọc sai — là mâu thuẫn thật trong file, liệt kê ở §4.

Còn **2 việc chặn** trước khi Codex code: (a) tách data khỏi repo, (b) chốt các quyết định formula treo ở §4. Chi tiết §5–§7.

---

## 2. Quyết định Chairman đã chốt phiên này

| Chủ đề | Chốt |
|---|---|
| Bề mặt app | 4 tab: Nhân sự · Công thức · Tính Incentive · Dashboard. Tab Công thức = trình tạo công thức. |
| Kiểu editor | Recipe có kiểu (vertical typed), tự do lắp ghép; không gõ text thô, không full node canvas. |
| Tự do công thức | Ghép +−×÷, lọc, quét cột, %, điều kiện, nối chuỗi vô hạn; waterfall/thuế đóng gói thành preset mở chỉnh được. |
| Tham số | Điền số cụ thể, hoặc trỏ vào cột/ô đối ứng trong dữ liệu. |
| Input | Công thức chốt xong → app tự sinh Excel mẫu (đúng các cột công thức dùng) → user điền → nạp lại → chạy. |
| Preset | Bộ công thức lưu JSON, tái sử dụng, chia sẻ được; user tự đẻ preset riêng. |
| Thương hiệu | Theme/font/màu/logo tách thành lớp riêng, đổi được để share. |
| Nền code | Đập v3, dựng lại, đưa GitHub. Đóng băng v2 làm tham chiếu; tái dùng cái tái được (engine deterministic, font, BRAND, export). |
| Vận hành | Không quăng version qua lại. FIN tải từ link repo, Chairman gửi JSON preset, FIN load → đẻ Excel → test trên máy chị ấy. |

---

## 3. Kiểm chứng công thức — bao phủ 4.637 công thức bằng 14 khối

Quét toàn bộ file, mọi hàm/toán tử đều rơi vào **14 họ khối** (bao đóng của miền GP/hoa hồng/thuế/phạt — không hàm nào lọt ra ngoài):

| # | Khối element | Hàm Excel thật (tần suất) |
|---|---|---|
| 1 | Lấy nguồn (jobs/người/KH) | vùng dữ liệu |
| 2 | Lọc theo điều kiện | tiêu chí SUMIFS |
| 3 | Quét + tổng hợp | SUM 158 · SUMIF 82 · SUMIFS 72 · SUBTOTAL 34 |
| 4 | Tra bảng + fallback | VLOOKUP 1492 · IFNA 1047 · IFERROR 345 |
| 5 | Số học + − × ÷ | −514 · ×128 · +85 · ÷50 |
| 6 | % của | phần trăm 37 |
| 7 | Điều kiện rẽ nhánh | IF 2182 · IFS 12 |
| 8 | Bậc lũy tiến | MAX + mảng `{5,10,20,30,35}%` |
| 9 | Cap / Floor (≥0) | IF so sánh 467 |
| 10 | Làm tròn VND | ROUND 31 |
| 11 | So khớp văn bản | TRIM 1035 · LOWER 345 |
| 12 | Logic Boolean | OR 345 · AND 69 |
| 13 | Thời gian (cửa sổ 6 tháng, gom quý) | EDATE 75 · YEAR 69 · MONTH 69 |
| 14 | Đảo dấu (phạt) | unary − (6) |

Khối 11–14 là logic **phân loại** (so tên khách, "KH mới trong 6 tháng", điều kiện kép) — phần dễ đổi nhất giữa các công ty, bắt buộc có để "trộn ra kết quả cần thiết". Bộ 14 khối = **scope cứng của v1**; thêm khối mới chỉ khi phát sinh, tránh phình thành nền tảng công thức đa năng.

### Chuỗi tính thật (đã trích sống, để Codex dựng preset)

```text
① job quy (5)   : phân mức 1/2/3 = IFNA(IF(VLOOKUP(KH, List KAE)=1,"Mức 1")) /
                  IF(VLOOKUP(KH, KH mới)="6 tháng","Mức 3") / else "Mức 2"; GP job.
② KQ Sale (7)   : GP = DT − CP; Target M = VLOOKUP(lương);
                  GP mức R/S/T = SUMIFS(paid, theo mức, theo người);
                  U = IF(R−M>0,(R−M)×8%,0);
                  V = IFS(U>0→S×12% ; S−(M−R)>0→(S−(M−R))×12% ; else 0);
                  W = IFS(V>0→T×17% ; T−S−R−(M−R−S)>0→(…)×17% ; else 0);
                  X = SUM(U:W); Z = trưởng BP; AA = −phạt; AB = floor0(X+Z+AA).
③ Phạt (6)      : D = C×1.08(VAT); Phạt = D × số_tháng × 1%.
④ KQ.KAE (8)    : pool tháng ÷ số người → chia đều; N = pool − trừ.
⑤ Sale khác (9) : O = ROUND(paid GP × 8%).
⑥ BK 10        : I = thu nhập tính thuế; J = ROUND(IF(H>0, MAX(I×{5,10,20,30,35}%
                  − {0;500k;3,5tr;9,5tr;14,5tr}), I×10%),0); O = net.
```

---

## 4. Ma trận 14 quyết định

Cột trạng thái: **CHỐT** = Chairman đã quyết phiên này · **KN** = Claude khuyến nghị, chờ Chairman gật · **CHỜ** = cần Chairman quyết, còn mâu thuẫn.

### Nhóm sản phẩm

| # | Quyết định | Bằng chứng / lý do | Khuyến nghị | TT |
|---|---|---|---|---|
| 1 | Một màn hình hay tách Run/Builder | Chairman muốn 4 tab, tab Công thức là builder | 4 tab; builder nằm trong tab Công thức, mặc định mở tab Tính Incentive | CHỐT |
| 2 | Vertical recipe hay full canvas | Chairman: A cơ chế + B tự do; canvas rối cho người mới (packet §1.3) | Vertical typed recipe; graph chỉ để debug | CHỐT |
| 3 | Ai được sửa recipe/preset | Tool offline tải về, self-serve; chia sẻ qua JSON | Không cần hệ phân quyền; ai có tool đều sửa, preset dùng chung qua file JSON | CHỐT |
| 4 | Khóa cứng macro waterfall/thuế | Chairman muốn chỉnh được | Không khóa; đóng gói preset mở, type-checker bảo vệ thay vì khóa | CHỐT |

### Nhóm công thức

| # | Quyết định | Bằng chứng / lý do | Khuyến nghị | TT |
|---|---|---|---|---|
| 5 | Waterfall Level 3 giữ nhánh XLS hay waterfall thuần | Cột W = IFS có nhánh đặc thù (nếu chưa level nào thưởng, trừ toàn target); nguyên tắc handoff "theo bản FIN dùng" | **Giữ đúng nhánh XLS**, đóng preset, ghi chú rõ; không đổi thành waterfall thuần trong vòng này | KN |
| 6 | Thuế fallback base | BK J24: fallback = `I×10%`, I = "Tổng thu nhập tính thuế" (cột I5). CODE v2 lệch sang incentiveBeforeTax×10% | **Theo BK: thu nhập tính thuế × 10%.** Bỏ nhánh CODE v2 | KN |
| 7 | Paid/Unpaid tuyệt đối hay partial | **Mâu thuẫn:** theory A4 chị FIN chốt "tính phần GP tương ứng số tiền đã thu" (partial); Blueprint v2 §7 ép binary | **Theo FIN: hỗ trợ partial theo tỷ lệ đã thu**; binary là ca đặc biệt (0%/100%). Cần 1 case Q1 verify | CHỜ |
| 8 | inputCost gồm COM là invariant hay setting | theory A8b/c: COM SMS gross-up + 20% CP không HĐ; gross-up COM đúng 1 lần | Mặc định Trustana = có COM; để **setting theo nguồn dữ liệu** cho tính generic | KN |
| 9 | Penalty FIN nhập hay app gợi ý | Phạt I27 = `D×tháng×1%` là công thức đã biết | App **hiện số gợi ý theo công thức**, FIN ghi đè số cuối. Được cả hai | KN |
| 10 | Manager base floor trước hay sau | XLS: Z = `(2.4%−2.4%)×(ΣM−ΣN)` rồi AB floor ở person | Để component âm, **floor 0 ở tổng person** (theo XLS) | CHỜ |
| 11 | Manual project allocation = pool | Tránh chia lệch quỹ | **Bắt buộc tổng manual = pool**; chênh = lỗi chặn | KN |
| 12 | Component âm giảm khác trước floor | XLS AB: cộng mọi component rồi floor 0 ở person | Giữ đúng XLS: cộng dồn rồi floor cuối | CHỜ |

### Nhóm migration

| # | Quyết định | Bằng chứng / lý do | Khuyến nghị | TT |
|---|---|---|---|---|
| 13 | Hoàn thiện v2 hay làm v3 mới | Chairman: đập, git, dựng lại | **v3 mới**; đóng băng v2 tham chiếu; tái dùng engine deterministic + export + font/BRAND | CHỐT |
| 14 | JSON schema là source | Chairman: công thức sống trong JSON preset | **Recipe graph JSON = source of truth**; không giữ v2 policy làm nguồn | CHỐT |

---

## 5. Ranh giới v3 (đưa vào Directive)

**Dữ liệu — CHẶN (P0):** Repo GitHub **chỉ chứa code + JSON preset rỗng + Excel mẫu rỗng**. Lương, thuế TNCN, tên nhân sự, công nợ khách (Vinh Giang, CDEK…) **không bao giờ commit**. `.gitignore` chặn `*.xlsx` dữ liệu, thư mục `docs/origin`, report thật. App đọc Excel do FIN tự nạp lúc chạy, không đóng gói kèm.

**Thương hiệu:** một file `branding.json` (logo, màu, font, tên công ty) tách khỏi engine. Đổi để share = đổi 1 file, không đụng công thức. Tái dùng `assets/BRAND.md` + font Be Vietnam Pro sẵn có.

**Scope cứng:** đúng 14 khối §3. Không general-purpose formula platform. Waterfall + thuế lũy tiến ship dạng **preset dựng sẵn**, mở chỉnh được, không bắt lắp tay từ số 0.

**Executable truth — CHẶN (P0):** repo hiện có 2 lớp công thức chồng nhau (`calculator.js` v2 vs `commission.js/enrich.js` v1), test pass cả hai hành vi mâu thuẫn (packet §11.1). v3 phải **chỉ còn 1 registry**; công thức lịch sử chuyển thành fixture/tài liệu, không để code gọi nhầm.

---

## 6. Kiến trúc đề xuất (giữ engine, thêm lớp)

```text
Tab Công thức (recipe builder có kiểu)
  → Recipe Graph JSON (preset, versioned, source of truth)
  → Validator + Type-checker + Topo-sort (chặn Money+Percent, chia 0, thiếu input, vòng lặp)
  → Block Registry / domain macros (waterfall, thuế) — tái dùng engine deterministic cũ
  → Bộ sinh Excel input (gom cột mọi recipe đang bật)
  → Chạy trên dữ liệu FIN nạp → trace từng bước
  → Export BK / BKê / PDF / report JSON / Dashboard (tái dùng)
```

Không viết canvas trước engine schema. Thứ tự: định nghĩa 14 khối + schema recipe → biểu diễn từng rule hiện tại thành preset → golden/regression chứng minh không đổi số → Run UI dùng engine → mở builder.

---

## 7. Rủi ro P0/P1/P2

**P0 (chặn, làm trước khi code):**
- Tách data khỏi repo + `.gitignore` (rò rỉ dữ liệu nhạy cảm).
- Gộp 2 lớp công thức về 1 registry (nếu không, xây trên nền mâu thuẫn).
- Số vàng nghiệm thu: tổng chi thật 1 quý (11/6) — FIN test trên máy chị ấy làm mốc.

**P1:**
- Chốt quyết định #7 (partial-paid) — ảnh hưởng số của nhiều người.
- Đóng băng 14 khối; schema recipe + bộ sinh Excel.
- Type-checker: block `%` không lưu nếu chưa chọn base.

**P2:**
- Lớp branding; UX lưu/nạp preset; port Dashboard.

---

## 8. Scope đề xuất cho Directive kế tiếp (giao Codex)

1. Scaffold repo v3 sạch + `.gitignore` chặn data; đóng băng v2 vào thư mục tham chiếu.
2. Định nghĩa 14 khối (type signature) + schema Recipe Graph JSON + validator/type-check/topo-sort.
3. Preset dựng sẵn: waterfall COM, KAE pool, BO 8%, phạt, thuế lũy tiến — theo công thức §3.
4. Bộ sinh Excel input từ recipe đang bật.
5. Engine chạy recipe trên dữ liệu nạp + trace; gộp về 1 registry.
6. 4 tab UI + lớp branding; export tái dùng.
7. Golden/regression theo số thật 1 quý; test file:// (Codex chạy, Chairman/Codex runtime verify).

---

## 9. Câu hỏi cần Chairman chốt trước khi viết Directive

1. **#7 Partial-paid:** theo FIN (tính phần GP theo tỷ lệ đã thu) hay ép binary như Blueprint v2? *(Khuyến nghị: theo FIN.)*
2. **#5, #6, #10, #12:** gật theo khuyến nghị (giữ đúng hành vi XLS + thuế theo BK) hay muốn bàn từng cái?
3. **Số vàng:** Chairman xin được tổng chi thật Q1 từ FIN để làm mốc test, hay ghi là điều kiện nghiệm thu treo tới buổi UAT?

---

## 10. Ngoài phạm vi vòng này

Chưa sửa/đập code. Chưa viết Directive (chờ Chairman trả §9). Chưa chọn thư viện drag-drop. Chưa coi khuyến nghị KN là quyết định đã chốt. Chưa runtime-verify artifact Windows từ sandbox — giao Codex/Chairman.
