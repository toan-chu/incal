# UI LAYOUT v3 — Wireframe 4 tab + Design language

**Ngày:** 2026-07-21 · Trạng thái: **layout đã chốt với Chairman** (v3.1), làm nền cho Directive Codex.
Bản trực quan: `docs/spec/UI-MOCKUP_v3.html` (mở bằng trình duyệt).

---

## 0.1 Quyết định đã chốt (2026-07-21) + phát hiện đọc sống Excel

**Chairman chốt:**
1. **Data model = app-memory.** Roster (mã/tên/title/lương/vào-nghỉ/hồ sơ) + KPI/target quý nhập **1 lần**, dán cả list kiểu Excel, **persist qua các phiên** (cơ chế lưu bền để Codex quyết: localStorage hoặc file JSON roster).
2. **Excel input do app đẻ.** Sau khi công thức hoàn thiện, app phát 1 template Excel có cột đúng bằng cái công thức cần. **Đổi công thức → đẻ lại Excel input.** FIN điền mỗi kỳ → nạp → tính. App chỉ nhận đúng template nó đẻ, không nhận Excel tùy ý.
3. **Builder full** 12 khối kéo-thả + type-checker ngay đợt v1 (không làm từng phần; audit sau).
4. **Dashboard đa kỳ** — nạp nhiều Report JSON của các kỳ, dựng Q1→Q4/YTD.
5. Tách tên nhập nhằng: topbar = **"Kỳ"** (kỳ dữ liệu); tab Công thức = **"Bộ công thức"** (preset).

**Phát hiện đọc sống `2026Q1_Incentive- (TEST) - Copy.xlsx` (13 sheet, khớp ảnh flow FIN):**
- **Thuế 2 nhánh** (BK 10): `IF(có HĐLĐ → lũy tiến MAX{5,10,20,30,35}% trừ bậc {0;500k;3,5tr;9,5tr;14,5tr}, ngược lại → 10% khoán)`. KHÔNG chỉ `taxable×10%`.
- **File móc 3 nguồn ngoài** phải nội hoá thành input: báo cáo công nợ tuần · bảng kê incentive đã lưu · **`2026Q1_Incentive- CHI 11.06.26.xlsx` = số chi thật = số vàng nghiệm thu**.
- **Partial-paid trong XLS đang binary** (Paid/Unpaid). Quyết định "theo tỷ lệ đã thu" là hành vi MỚI → thêm cột "% đã thu" ở Excel input + FIN xác nhận công thức.
- **Lớp lỗi cần app xoá:** `#REF!` sống (KQ.KAE), số cứng cắm tay `−210.483.804` (Phạt), lẫn `"Paid"/"paid"`.
- **Chuỗi tính:** job quy(5) gán Mức 1/2/3 theo loại KH (KH mới 6 tháng = Mức 3, TRIM/LOWER) → waterfall per-level ở KQ Sale(7), điều chỉnh ±1%/người → BK 10 + thuế → BKê-COM/Khác/BO.

---

## 0. App shell

```
┌────────────────────────────────────────────────────────────────────┐
│ [◆ logo] TRUSTANA · Incentive Calculator        [Kỳ: Q1-2026 ▾] [⚙] │
├────────────────────────────────────────────────────────────────────┤
│  ● Nhân sự    │   Công thức   │   Tính Incentive   │   Dashboard     │
└────────────────────────────────────────────────────────────────────┘
```
Offline (`file://`), không network. Topbar tím Trustana, nút chính cam.

---

## 1. Tab Nhân sự — lưới kiểu Excel, dán hàng loạt

```
┌ Nhân sự ───────────────────────────────────────────────────────────┐
│ [+ Thêm dòng] [⧉ Dán từ Excel] [⭳ Nhập file] [🗑 Xóa]      24 người  │
├────┬────────────────┬──────────┬─────────────┬─────────┬───────────┤
│ Mã │ Họ tên         │ Title    │ Lương gross │ Vào/Nghỉ│ Hồ sơ tính │
├────┼────────────────┼──────────┼─────────────┼─────────┼───────────┤
│ 01 │ Phạm T.T Hoài  │ COM Sale │  15.000.000 │ T1 →    │ ⬤ COM      │
│ 02 │ Lê N.C Tú      │ COM Sale │  12.000.000 │ T1 →    │ ⬤ COM      │
│ 03 │ Nguyễn Vi      │ CX       │     (trống) │ T1 →    │ ◐ KAE      │
│ 04 │ Trần Tân       │ BO       │     (trống) │ T2 →    │ ○ BO 8%    │
│ ▟  … dán 50 dòng từ clipboard cùng lúc …                            │
└────┴────────────────┴──────────┴─────────────┴─────────┴───────────┘
  Auto-gán hồ sơ: Title chứa "COM" + có lương → COM ·
  không COM & không lương → KAE · "BO/thử việc" → BO 8% · sửa tay được.
```
Cột "Hồ sơ tính" app tự suy từ Title + lương (đúng ý Chairman "bùm ra"), nhưng chỉ là *routing* — tiền vẫn chạy engine trên dữ liệu job ở tab Tính.
**App-memory:** roster + lương + KPI/target quý nhập 1 lần (dán cả list), lưu bền qua các phiên; không nhập lại mỗi kỳ, không trùng với Excel job.

---

## 2. Tab Công thức — Recipe Builder 3 cột (màn hình chữ ký)

```
┌ Công thức ──────────────────────────────────────────────────────────┐
│ Bộ công thức: [Waterfall COM ▾] [+ Mới] [⭳ Nạp JSON] [⭱ Lưu JSON] [⎋ Đẻ Excel input]│
├───────────────┬────────────────────────────┬───────────────────────┤
│ THƯ VIỆN KHỐI  │ CÔNG THỨC (đọc trên → dưới)│ CÀI ĐẶT KHỐI           │
│ ▸ Lấy nguồn    │ 1  Lấy jobs của người      │ Khối:  % CỦA          │
│ ▸ Lọc cột      │ 2  Lọc: Payment = Đã thu   │ Tỷ lệ:  [  8 % ]      │
│ ▸ Quét + Tổng  │ 3  Tổng cột GP             │ Cơ sở:  Tổng GP  ▾    │
│ ▸ Tra bảng     │ 4 ▸8% CỦA Tổng GP◀━ đang sửa│ Nguồn:  policy        │
│ ▸ + − × ÷      │ 5  Làm tròn VND            │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│ ▸ % của        │ 6  → Xuất: Thưởng BO       │ Xem thử:              │
│ ▸ Điều kiện    │                            │  8% × 120.000.000     │
│ ▸ Bậc lũy tiến │ [ + thêm khối ]            │   = 9.600.000  ✓      │
│ ▸ Cap / Floor  │                            │ Kiểm lỗi: hợp lệ       │
│ ▸ So văn bản   │                            │                       │
│ ▸ Thời gian    │                            │                       │
│ ▸ Đảo dấu      │                            │                       │
└───────────────┴────────────────────────────┴───────────────────────┘
  Kéo khối từ trái vào giữa · reorder bằng kéo · khối % không lưu được
  nếu chưa chọn "cơ sở" · type-checker chặn Money+Percent, chia 0, vòng lặp.
```
Nhiều công thức = nhiều recipe nối chuỗi (GP job → GP người → waterfall → phạt → thuế → net), app tự sắp thứ tự theo phụ thuộc. **Builder full 12 khối + type-checker ngay v1.** Nút **"Đẻ Excel input"** phát template Excel theo đúng cột bộ công thức đang dùng; đổi công thức → đẻ lại. Khối **Thuế** phải cover 2 nhánh (lũy tiến HĐLĐ / 10% khoán).

---

## 3. Tab Tính Incentive — 3 bước gọn

```
┌ Tính Incentive ─────────────────────────────────────────────────────┐
│  ⭳ Kéo / nạp Excel dữ liệu kỳ này                                    │
│  ┌ Kỳ Q1-2026 ┐ ┌ 24 người ┐ ┌ 202 jobs ┐ ┌ 176 đã thu ┐ ┌ 3 phạt ┐│
│  └────────────┘ └──────────┘ └──────────┘ └────────────┘ └────────┘│
│  Việc cần xử lý (2):                                                 │
│   ⚠ Phạm A thiếu lương T02 (tháng có COM target)      [ Nhập lương ] │
│   ⚠ Job J-102 Unpaid chưa có mức phạt                 [ Nhập phạt ]  │
│                                                                     │
│                    [ ▶  TÍNH INCENTIVE ]                            │
│  ┌ Kết quả ────────────────────────────────────────────────────┐   │
│  │ Người          COM      KAE  Phạt     Thuế      Thực nhận    │   │
│  │ Phạm T.T Hoài  8.916.996  0  −86.691  −883.031  7.947.274 [⋯]│   │
│  │ Lê N.C Tú      5.204.000  0       0   −402.100  4.801.900 [⋯]│   │
│  └──────────────────────────────────────────────────────────────┘   │
│  Xuất: [BK] [BKê] [PDF/người] [Job JSON] [Report JSON]             │
└──────────────────────────────────────────────────────────────────────┘
```
[⋯] mở "Giải thích kết quả": từng dòng component → trace tới job + khối công thức.

---

## 4. Tab Dashboard

```
┌ Dashboard ──────────────────────────────────────────────────────────┐
│ ┌ Tổng chi quý ┐ ┌ Top Sales ┐ ┌ GP / team ┐ ┌ KH mới ┐             │
│ │  1,42 tỷ     │ │  Hoài     │ │  …        │ │  38    │             │
│ └──────────────┘ └───────────┘ └───────────┘ └────────┘             │
│ ┌ Net pay theo quý ──────────┐  ┌ Top người YTD ───────────┐        │
│ │   ▁ ▃ ▅ ▇                   │  │ ▇▇▇▇▇ Hoài                │        │
│ │   Q1 Q2 Q3 Q4              │  │ ▇▇▇   Tú                  │        │
│ └────────────────────────────┘  └───────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────┘
```
**Đa kỳ:** Dashboard nạp nhiều Report JSON (mỗi kỳ 1 file) để dựng Q1→Q4/YTD. Kỳ hiện tại + lịch sử cùng một chỗ; không có server, dữ liệu đến từ các file Report JSON người dùng nạp.

---

## 5. Design language (frontend)

| Yếu tố | Quy ước |
|---|---|
| Màu chính | Tím Trustana (topbar, tab active, tiêu đề) |
| Màu nhấn | Cam Trustana (nút chính, số dương, highlight) |
| Nền | Trắng/xám rất nhạt; card trắng, bo góc 12px, viền 0.5px |
| Font UI | Be Vietnam Pro (offline, đã có trong `assets/fonts`) |
| Font số/công thức | JetBrains Mono (căn cột số, khối recipe) |
| Số tiền | VND nguyên, phân tách hàng nghìn (9.600.000); số âm màu đỏ nhạt |
| Phong cách | Phẳng, thoáng, không gradient/shadow nặng — tránh "AI slop" |
| Trạng thái khối | Xanh = hợp lệ · Vàng = cảnh báo · Đỏ = chặn |
| Lớp thương hiệu | `branding.json` (logo/màu/font/tên) tách khỏi engine, đổi để share |
| Ràng buộc | Offline `file://`, không network, desktop + mobile không tràn |
```
```
