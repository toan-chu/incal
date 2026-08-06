<div align="center">

# 💜 incal — Phiếu Incentive Trustana

**Đọc file Excel incentive → xuất phiếu PDF cho từng nhân viên → dashboard so sánh nhiều quý.**

[![Chạy offline](https://img.shields.io/badge/Ch%E1%BA%A1y-100%25%20offline-4d148c?style=for-the-badge)](#-cài-đặt)
[![Một file](https://img.shields.io/badge/C%C3%A0i%20%C4%91%E1%BA%B7t-Kh%C3%B4ng%20c%E1%BA%A7n-ff6200?style=for-the-badge)](#-cài-đặt)
[![Trình duyệt](https://img.shields.io/badge/Ch%E1%BA%A1y%20b%E1%BA%B1ng-Tr%C3%ACnh%20duy%E1%BB%87t-1a5fb4?style=for-the-badge)](#-cài-đặt)

[![Excel là nguồn chân lý](https://img.shields.io/badge/Excel-Ngu%E1%BB%93n%20ch%C3%A2n%20l%C3%BD-147a50?logo=microsoftexcel&logoColor=white)](#-nguyên-tắc-vàng)
[![PDF chữ thật](https://img.shields.io/badge/PDF-Ch%E1%BB%AF%20th%E1%BA%ADt%2C%20copy%20%C4%91%C6%B0%E1%BB%A3c-b42318?logo=adobeacrobatreader&logoColor=white)](#-nội-dung-phiếu)
[![Dữ liệu không rời máy](https://img.shields.io/badge/D%E1%BB%AF%20li%E1%BB%87u-Kh%C3%B4ng%20r%E1%BB%9Di%20m%C3%A1y-a96200?logo=shieldsdotio&logoColor=white)](#-riêng-tư)
[![Kiểm thử](https://img.shields.io/badge/Ki%E1%BB%83m%20th%E1%BB%AD-24%20ti%C3%AAu%20ch%C3%AD-32105e?logo=nodedotjs&logoColor=white)](#-kiểm-thử)

</div>

---

## 🚀 Cài đặt

**Không có bước cài đặt.** Tải repo về, mở `tool/Phieu-Incentive.html` bằng trình duyệt (nhấp đúp là được). Không cần Python, không cần Node, không cần mạng.

```
tool/Phieu-Incentive.html   ←  nhấp đúp vào đây
```

Muốn gửi cho đồng nghiệp thì gửi đúng một file đó qua email hoặc Teams. Nó tự chứa mọi thứ.

---

## 🔑 Nguyên tắc vàng

> **File Excel là nguồn chân lý duy nhất.**
> Công cụ **không tính lại** bất kỳ công thức nào. Nó chỉ đọc con số Excel đã tính sẵn rồi trình bày lại cho đẹp.

Nghĩa là: muốn sửa cách tính incentive → sửa trong Excel, không đụng tới công cụ. Công cụ không bao giờ là lý do khiến số bị sai.

---

## 🔄 Quy trình

```
   ┌──────────────────────┐
   │  📊  FILE EXCEL      │   Mở bằng Excel
   │  Incentive kỳ này    │   Nhập số → BẤM LƯU  ⚠️ bắt buộc
   └──────────┬───────────┘
              │  kéo thả
              ▼
   ┌──────────────────────────────────────────────┐
   │  🌐  tool/Phieu-Incentive.html               │
   │                                              │
   │   ┌────────────────┐  ┌────────────────┐     │
   │   │ 1 Phiếu        │  │ 2 Dashboard    │     │
   │   │   incentive    │  │   nhiều kỳ     │     │
   │   └───────┬────────┘  └───────┬────────┘     │
   │           │                   │              │
   │   ✓ Kiểm tra file      ✓ Tự nhận kỳ          │
   │   ✓ Đối chiếu deal     ✓ Gộp nhiều quý       │
   └───────────┼───────────────────┼──────────────┘
               │                   │
      ┌────────┴────────┐          ▼
      ▼                 ▼     📈 Biểu đồ xu hướng
  📄 15 file PDF   🖨️ 1 PDF      + bảng cộng dồn
     (.zip)          15 trang
```

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

### 2️⃣ Dashboard nhiều quý

Sang thẻ **Dashboard nhiều kỳ**, thả nhiều file Excel của các quý khác nhau vào cùng lúc.

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

File mẫu `Incentive-Template-TRONG.xlsx` cũng sẽ báo đỏ khi mới tải về — đúng như thiết kế, vì nó chưa có số nào.

---

## 🛡️ Công cụ tự kiểm tra những gì

| Tình huống | Phản ứng |
|---|---|
| Thiếu sheet bắt buộc (`Assumption`, `Data`, `Payout`) | 🔴 Chặn, nêu tên sheet thiếu |
| Ô công thức chưa có giá trị đã lưu | 🔴 Chặn, khoá nút xuất, hướng dẫn mở bằng Excel |
| Cộng lợi nhuận từ danh sách job không khớp bảng tính | 🟡 Cảnh báo, nêu rõ tên người và số lệch |
| Mọi thứ khớp | 🟢 Xanh, ghi rõ nguồn file, số người, số job |

---

## 📄 Nội dung phiếu

- 👤 **Thông tin nhân viên** và nhóm tính (Sale COM / KAE / BO).
- 💰 **Bảng tiền:** Gross → thu nhập chịu thuế → thuế TNCN → thuế phải nộp → **thực nhận**.
- 🧮 **Cơ sở tính:** doanh thu, chi phí, lợi nhuận đã thu / chưa thu, chỉ tiêu quý, ba mức tỷ lệ, thưởng Trưởng bộ phận, phạt công nợ. Người thuộc nhóm KAE thì hiện pool từng tháng và tỷ lệ tham gia.
- 📑 **Danh sách deal đóng góp:** mã job, khách hàng, tháng, doanh thu, chi phí, lợi nhuận, đã thu / chưa thu. Để sales tự đối chiếu xem đã đủ deal chưa.
- ℹ️ Ghi chú: chi tiết công thức liên hệ phòng FIN.

Chữ trong PDF là **chữ thật** — tìm kiếm, bôi đen, copy được. Không phải ảnh chụp.

---

## 🔒 Riêng tư

Toàn bộ xử lý chạy trong trình duyệt trên máy bạn. File Excel **không được tải lên đâu cả**, công cụ không có bất kỳ kết nối mạng nào.

File Excel chứa số liệu thật **không nằm trong git** — `.gitignore` chặn mọi `.xlsx` trừ file mẫu rỗng.

---

## 🧰 Cấu trúc repo

```
incal/
├── 📗 Incentive-Template-TRONG.xlsx   file mẫu rỗng, đủ công thức
├── 🌐 tool/
│   ├── Phieu-Incentive.html           ← SẢN PHẨM (dựng ra, không sửa tay)
│   ├── build.py                       đóng gói src/ thành 1 file
│   ├── src/                           mã nguồn
│   └── test/                          kiểm thử khói
├── 📚 docs/REPO_SNAPSHOT.md           bản đồ repo
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
| `core.js` | Đọc workbook, dựng dữ liệu, kiểm tra file. |
| `payslip.js` | Dựng phiếu PDF. |
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

Hai bài chạy công cụ trong DOM giả lập:

- **`smoke-happy.js`** — nạp file có số liệu, đối chiếu tổng, mở phiếu, đếm deal.
- **`smoke-guard.js`** — thử file chưa lưu bằng Excel (phải bị chặn) và dashboard hai kỳ.

Cần một file Excel có số liệu thật. Đặt tên `2026Q1_Incentive_MASTER.xlsx` ở gốc repo, hoặc:

```bash
INCAL_MASTER=/duong/dan/file.xlsx npm test
```

Không có file đó thì bài kiểm thử in `BỎ QUA` và thoát sạch.

---

## 🗺️ Công cụ dựa vào gì trong file Excel

| Sheet | Dùng để |
|---|---|
| `Assumption` | Tham số qua named range (`ky_ten`, `ky_bat_dau`, `rate_*`…) và danh sách nhân sự. |
| `Data` | Bảng job `tbl_jobs` — nhận diện qua tiêu đề `Thang`. |
| `Payout` | Bảng chi trả — nhận diện qua tiêu đề `Ma_NV`. |
| `Calc_Sale` · `Calc_KAE` · `Calc_Other` | Cơ sở tính hiển thị trên phiếu. |

Bảng được tìm theo **tên tiêu đề**, không theo vị trí ô. Thêm bớt dòng hoặc dịch bảng lên xuống vẫn chạy; đổi tên cột thì phải sửa `core.js`.

---

<div align="center">

**Trustana Finance Workspace** · Dữ liệu không rời khỏi thiết bị

</div>
