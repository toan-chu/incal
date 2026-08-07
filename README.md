<div align="center">

# 💜 incal — Phiếu Incentive & Phụ cấp Trustana

**Đọc file Excel → xuất phiếu PDF cho từng nhân viên → dashboard so sánh nhiều kỳ.**
Hai loại phiếu: **incentive** theo quý và **phụ cấp trực đêm & OPS** theo tháng.

[![Mở trực tiếp](https://img.shields.io/badge/M%E1%BB%9F-Tr%E1%BB%B1c%20ti%E1%BA%BFp-ff6200?style=for-the-badge)](#-mở-công-cụ)
[![Chạy offline](https://img.shields.io/badge/Ch%E1%BA%A1y-100%25%20offline-4d148c?style=for-the-badge)](#-mở-công-cụ)
[![MIT License](https://img.shields.io/badge/License-MIT-147a50?style=for-the-badge)](LICENSE)

[![Excel là nguồn chân lý](https://img.shields.io/badge/Excel-Ngu%E1%BB%93n%20ch%C3%A2n%20l%C3%BD-147a50?logo=microsoftexcel&logoColor=white)](#-nguyên-tắc-vàng)
[![PDF chữ thật](https://img.shields.io/badge/PDF-Ch%E1%BB%AF%20th%E1%BA%ADt%2C%20copy%20%C4%91%C6%B0%E1%BB%A3c-b42318?logo=adobeacrobatreader&logoColor=white)](#-nội-dung-phiếu)
[![Dữ liệu không rời máy](https://img.shields.io/badge/D%E1%BB%AF%20li%E1%BB%87u-Kh%C3%B4ng%20r%E1%BB%9Di%20m%C3%A1y-a96200?logo=shieldsdotio&logoColor=white)](#-riêng-tư)
[![Kiểm thử](https://img.shields.io/badge/Ki%E1%BB%83m%20th%E1%BB%AD-77%20ti%C3%AAu%20ch%C3%AD-32105e?logo=nodedotjs&logoColor=white)](#-kiểm-thử)

</div>

---

## 🚀 Mở công cụ

> **Dùng hằng ngày:** vào thư mục `tool` → nhấp đúp **`Phieu-Incentive.html`**.

Không có bước cài đặt. Không cần chạy `build.py`, không cần Python, Node hay mạng khi sử dụng.

```
incal/
└── tool/
    └── Phieu-Incentive.html   ← nhấp đúp file này
```

[`tool/Phieu-Incentive.html`](tool/Phieu-Incentive.html) là sản phẩm hoàn chỉnh, tự chứa toàn bộ giao diện, font và thư viện. Muốn gửi cho đồng nghiệp thì chỉ cần gửi file này qua email hoặc Teams.

---

## 🔑 Nguyên tắc vàng

> **File Excel là nguồn chân lý duy nhất.**
> Công cụ **không tính lại** bất kỳ công thức nào. Nó chỉ đọc con số Excel đã tính sẵn rồi trình bày lại cho đẹp.

Nghĩa là: muốn sửa cách tính incentive hay phụ cấp → sửa trong Excel, không đụng tới công cụ. Công cụ không bao giờ là lý do khiến số bị sai.

Với file phụ cấp, mọi đơn giá đều nằm ở sheet `Assumption` dưới dạng named range (`rate_gio_bien`, `bca_blaze`, `ops_2200_0100`…) — đổi chính sách chỉ sửa một ô, không đụng công thức.

---

## 🔄 Quy trình

```
   ┌──────────────────────┐   ┌──────────────────────┐
   │  📊  FILE EXCEL      │   │  🌙  FILE EXCEL      │  Mở bằng Excel
   │  Incentive · quý     │   │  Phụ cấp · tháng     │  Nhập số → BẤM LƯU ⚠️
   └──────────┬───────────┘   └──────────┬───────────┘
              │         kéo thả          │
              ▼                          ▼
   ┌──────────────────────────────────────────────────────────┐
   │  🌐  tool/Phieu-Incentive.html                           │
   │                                                          │
   │   ┌────────────┐ ┌────────────┐ ┌────────────────┐       │
   │   │ 1 Phiếu    │ │ 2 Phiếu    │ │ 3 Dashboard    │       │
   │   │ incentive  │ │ phụ cấp    │ │   nhiều kỳ     │       │
   │   └─────┬──────┘ └─────┬──────┘ └───────┬────────┘       │
   │         │              │                │                │
   │  ✓ Kiểm tra file  ✓ Kiểm tra file  ✓ Tự phân loại        │
   │  ✓ Đối chiếu deal ✓ Đối chiếu ca   ✓ Gộp nhiều kỳ        │
   └─────────┼──────────────┼────────────────┼────────────────┘
             │              │                ▼
        ┌────┴────┐    ┌────┴────┐    📈 Biểu đồ xu hướng
        ▼         ▼    ▼         ▼        + bảng cộng dồn
    📄 PDF   🖨️ In   📄 PDF   🖨️ In
     (.zip)          (.zip)
```

Thả nhầm file vào nhầm thẻ thì công cụ nhận ra và chỉ đường sang thẻ đúng.

---

## 📋 Dùng thế nào

### 1️⃣ Xuất phiếu incentive

| Bước | Việc |
|:---:|---|
| **1** | Mở file Excel incentive bằng **Excel**, nhập số liệu, **bấm Lưu**. |
| **2** | Mở `tool/Phieu-Incentive.html`. |
| **3** | Kéo thả file Excel vào thẻ **Phiếu incentive**. |
| **4** | Xem bảng chi trả. Bấm **Xem phiếu** để soát từng người. |
| **5** | Xuất: **Tải tất cả phiếu PDF (.zip)** · **In tất cả phiếu** · hoặc tải/in từng người trong hộp thoại. |

### 2️⃣ Xuất phiếu phụ cấp trực đêm & OPS

Sang thẻ **Phiếu phụ cấp**, thả file Excel phụ cấp của một tháng vào. Cách dùng giống hệt thẻ 1.

Phiếu gồm: phụ cấp theo giờ tách khung biên (22–24 & 04–06) / khung lõi (00–04), thưởng BCA Spark · Blaze, phụ cấp OPS theo khung giờ có mặt, và **nhật ký từng ca** để nhân sự tự đối chiếu.

### 3️⃣ Dashboard nhiều kỳ

Sang thẻ **Dashboard nhiều kỳ**, thả nhiều file Excel vào cùng lúc — incentive theo quý và phụ cấp theo tháng đều nhận, công cụ **tự phân loại** và tách thành hai khối riêng.

Công cụ **tự nhận kỳ** từ tham số `ky_ten` trong sheet `Assumption` — không cần đặt tên file theo quy ước nào cả.

---

## ⚠️ Bước bắt buộc: lưu bằng Excel

File `.xlsx` lưu song song **hai thứ** cho mỗi ô công thức:

| | |
|---|---|
| 📐 Bản thân công thức | `=IFERROR(VLOOKUP(...))` |
| 🔢 Giá trị Excel đã tính lần lưu gần nhất | `190011921.32` |

Công cụ đọc **cái thứ hai**. Excel chỉ ghi nó khi bạn mở file bằng Excel và bấm Lưu.

Nếu file được tạo hoặc sửa bằng công cụ khác — script Python, thư viện, vài trình xem trực tuyến — phần giá trị sẽ trống. Khi đó công cụ **báo đỏ và khoá nút xuất**, không bao giờ xuất ra phiếu trắng.

> 🔧 **Cách xử lý:** mở file bằng Excel → bấm Lưu → nạp lại.

Hai file mẫu `Incentive-Template-TRONG.xlsx` và `PhuCap-Template-TRONG.xlsx` cũng sẽ báo đỏ khi mới tải về — đúng như thiết kế, vì chúng chưa có số nào.

---

## 🛡️ Công cụ tự kiểm tra những gì

| Tình huống | Phản ứng |
|---|---|
| Thiếu sheet bắt buộc (`Assumption`, `Data`, `Payout`) | 🔴 Chặn, nêu tên sheet thiếu |
| Ô công thức chưa có giá trị đã lưu | 🔴 Chặn, khoá nút xuất, hướng dẫn mở bằng Excel |
| Thả file phụ cấp vào thẻ incentive, hoặc ngược lại | 🔴 Chặn, chỉ đường sang thẻ đúng |
| Cộng lợi nhuận từ danh sách job không khớp bảng tính | 🟡 Cảnh báo, nêu rõ tên người và số lệch |
| Cộng tiền từ nhật ký ca không khớp bảng chi phụ cấp | 🟡 Cảnh báo, nêu rõ tên người và số lệch |
| Có ca trong `Data` nhưng người đó không có dòng trong `Payout` | 🟡 Cảnh báo, nhắc soát chính tả họ tên |
| Ca trực nằm ngoài khung 22:00–06:00 · lô hàng thiếu người so với định biên | 🟡 Cảnh báo, nêu ngày và tên người |
| Mọi thứ khớp | 🟢 Xanh, ghi rõ nguồn file, số người, số job hoặc số ca |

---

## 📄 Nội dung phiếu

### Phiếu incentive

- 👤 **Thông tin nhân viên** và nhóm tính (Sale COM / KAE / BO).
- 💰 **Bảng tiền:** Gross → thu nhập chịu thuế → thuế TNCN → thuế phải nộp → **thực nhận**.
- 🧮 **Cơ sở tính:** doanh thu, chi phí, lợi nhuận đã thu / chưa thu, chỉ tiêu quý, ba mức tỷ lệ, thưởng Trưởng bộ phận, phạt công nợ. Người thuộc nhóm KAE thì hiện pool từng tháng và tỷ lệ tham gia.
- 📑 **Danh sách deal đóng góp:** mã job, khách hàng, tháng, doanh thu, chi phí, lợi nhuận, đã thu / chưa thu. Để sales tự đối chiếu xem đã đủ deal chưa.
- ℹ️ Ghi chú: chi tiết công thức liên hệ phòng FIN.

### Phiếu phụ cấp

- 👤 **Thông tin nhân viên**, bộ phận và khoản hưởng (Trực đêm / OPS sân bay).
- 💰 **Bảng tiền:** phụ cấp theo giờ + thưởng BCA → phụ cấp trực đêm → phụ cấp OPS → gross → thuế TNCN → **thực nhận**.
- 🧮 **Cơ sở tính:** số ca trực và số chuyến OPS, giờ khung biên / khung lõi kèm đơn giá đang áp, số ca Spark · Blaze, tổng trọng lượng lô hàng, hệ số ngày lễ, cách tính thuế đang áp cho người đó.
- 🌙 **Nhật ký ca:** ngày, loại ca, ngày thường / lễ, giờ vào–ra, giờ biên, giờ lõi, mức BCA, mã job, trọng lượng, thành tiền từng ca. Để nhân sự tự đối chiếu xem đã đủ ca chưa.

Chữ trong PDF là **chữ thật** — tìm kiếm, bôi đen, copy được. Không phải ảnh chụp.

---

## 🔒 Riêng tư

Toàn bộ xử lý chạy trong trình duyệt trên máy bạn. File Excel **không được tải lên đâu cả**, công cụ không có bất kỳ kết nối mạng nào.

File Excel chứa số liệu thật **không nằm trong git** — `.gitignore` chặn mọi `.xlsx` trừ hai file mẫu rỗng ở gốc repo. Văn bản quy định nội bộ (`.docx`) và ảnh chụp màn hình cũng bị chặn: chúng ở lại trên máy anh, không lên GitHub.

---

## 🧰 Cấu trúc repo

```
incal/
├── 📗 Incentive-Template-TRONG.xlsx   mẫu rỗng incentive, đủ công thức
├── 🌙 PhuCap-Template-TRONG.xlsx      mẫu rỗng phụ cấp, đủ công thức
├── 🌐 tool/
│   ├── Phieu-Incentive.html           ← SẢN PHẨM (dựng ra, không sửa tay)
│   ├── build.py                       đóng gói src/ thành 1 file
│   ├── src/                           mã nguồn
│   └── test/                          kiểm thử khói
├── 📚 docs/
│   ├── REPO_SNAPSHOT.md               bản đồ repo
│   ├── BONUS_FORMULA_NOTES.md         log lỗi công thức phụ cấp — FIN duyệt
│   └── (file .xlsx và .docx)          số liệu thật + văn bản quy định, chỉ nằm trên máy
├── 📝 handoff/tasks/                  tờ giao việc
├── ⚖️ log/rules.md                    luật cứng
└── 🗄️ archive/                        bản cũ, giữ để tra cứu
```

---

## 🔧 Sửa công cụ

```bash
cd tool
# sửa file trong src/
python3 build.py     # dựng lại tool/Phieu-Incentive.html
```

| File trong `tool/src/` | Việc |
|---|---|
| `core.js` | Đọc workbook incentive, dựng dữ liệu, kiểm tra file. |
| `bonus.js` | Đọc workbook phụ cấp, nhận diện loại file, đối chiếu nhật ký ca. |
| `payslip.js` | Dựng phiếu incentive PDF. |
| `bonusslip.js` | Dựng phiếu phụ cấp PDF. |
| `ui.js` | Giao diện, biểu đồ, xuất file. |
| `app.css` | Trình bày, gồm cả kiểu dành cho lệnh In. |
| `index.template.html` | Khung HTML. |
| `vendor/` | SheetJS · jsPDF · autoTable · JSZip. |
| `assets/` | Logo và font. |

---

## 🧪 Kiểm thử

```bash
cd tool/test
npm install
npm test
```

Ba bài chạy công cụ trong DOM giả lập:

- **`smoke-happy.js`** — nạp file incentive có số liệu, đối chiếu tổng, mở phiếu, đếm deal.
- **`smoke-guard.js`** — thử file chưa lưu bằng Excel (phải bị chặn) và dashboard hai kỳ.
- **`smoke-bonus.js`** — nạp file phụ cấp, đối chiếu tổng, mở phiếu, thử thả nhầm thẻ.

Cần file Excel có số liệu thật. Đặt `2026Q1_Incentive_MASTER.xlsx` ở gốc repo và `2026M08_PhuCap_MASTER.xlsx` trong `docs/`, hoặc:

```bash
INCAL_MASTER=/duong/dan/incentive.xlsx \
INCAL_BONUS_MASTER=/duong/dan/phucap.xlsx npm test
```

Không có file đó thì bài kiểm thử in `BỎ QUA` và thoát sạch.

---

## 🗺️ Công cụ dựa vào gì trong file Excel

**File incentive (theo quý):**

| Sheet | Dùng để |
|---|---|
| `Assumption` | Tham số qua named range (`ky_ten`, `ky_bat_dau`, `rate_*`…) và danh sách nhân sự. |
| `Data` | Bảng job `tbl_jobs` — nhận diện qua tiêu đề `Thang`. |
| `Payout` | Bảng chi trả — nhận diện qua tiêu đề `Ma_NV`. |
| `Calc_Sale` · `Calc_KAE` · `Calc_Other` | Cơ sở tính hiển thị trên phiếu. |

**File phụ cấp (theo tháng):**

| Sheet | Dùng để |
|---|---|
| `Assumption` | Tham số qua named range (`rate_gio_bien`, `bca_blaze`, `ops_*`…), bậc thuế và danh sách nhân sự. |
| `Data` | Nhật ký ca `tbl_shifts` — nhận diện qua tiêu đề `Ngay`. Cột `Loai_Ca` tách `TRUC_DEM` / `OPS`. |
| `Calc_TrucDem` · `Calc_OPS` | Tổng hợp theo người, hiển thị trên phiếu. |
| `Payout` | Bảng chi phụ cấp + thuế TNCN. |

Công cụ phân biệt hai loại file qua sheet `Calc_TrucDem` / `Calc_OPS` và named range `loai_bang`.

Bảng được tìm theo **tên tiêu đề**, không theo vị trí ô. Thêm bớt dòng hoặc dịch bảng lên xuống vẫn chạy; đổi tên cột thì phải sửa `core.js` (incentive) hoặc `bonus.js` (phụ cấp).

> 📐 Bảy lỗi công thức của file phụ cấp bản cũ và cách sửa được ghi trong [`docs/BONUS_FORMULA_NOTES.md`](docs/BONUS_FORMULA_NOTES.md) — đọc trước khi chi.

---

<div align="center">

**Trustana Finance Workspace** · Dữ liệu không rời khỏi thiết bị

</div>
