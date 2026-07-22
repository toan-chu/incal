# 💜 Trustana Incentive

[![License: MIT](https://img.shields.io/badge/License-MIT-8A2BE2.svg)](./LICENSE)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-file%3A%2F%2F-E34F26?logo=html5&logoColor=white)
![SheetJS](https://img.shields.io/badge/Excel-SheetJS-217346?logo=microsoftexcel&logoColor=white)
![Offline](https://img.shields.io/badge/Offline-No%20network-1D9E75)
![Tests](https://img.shields.io/badge/tests-42%2F42%20passing-2ea44f)
![No dependencies](https://img.shields.io/badge/dependencies-0-lightgrey)

> Công cụ tính incentive offline dành cho Finance: nạp Excel, kiểm soát công thức bằng sơ đồ, đối soát từng khoản và xuất báo cáo.

## ✨ Từ bảng tính đến kết quả trong 3 bước

### 1️⃣ Nạp dữ liệu

Mở `index.html` bằng Chrome hoặc Edge, vào tab **Input** và chọn workbook. Mỗi sheet trở thành một bảng dữ liệu; bạn chọn bảng chủ thể tính và ánh xạ mã, tên, nhóm ngay trên card của bảng đó.

Bạn có thể thử ngay với [workbook mẫu đã ẩn danh](./INPUT-Incentive-mau.xlsx).

### 2️⃣ Kiểm tra công thức

Vào tab **Công thức**, nạp [preset Q1 mẫu](./presets/trustana-q1.json), rồi đọc luồng từ trái sang phải trên canvas:

- 🟣 kéo khối từ thư viện vào canvas;
- 🔗 nối output → input; kết nối sai kiểu bị chặn trước khi tính;
- 🧮 mở cài đặt khối để chọn cột, phép toán hoặc điều kiện;
- ✨ bấm **Tự xếp gọn** khi cần dọn sơ đồ;
- 🏁 khối cuối của mỗi recipe tự trở thành **KẾT QUẢ**.

### 3️⃣ Tính và xuất báo cáo

Vào tab **Tính**, chọn chủ thể cần xem và bấm **Tính incentive**. Mỗi dòng kết quả có trace để đối soát. Có thể xuất:

- 📊 Excel tổng hợp chi trả;
- 👥 Excel theo từng khoản thu nhập;
- 📄 PDF chi tiết từng người;
- 🧾 JSON dữ liệu job hoặc báo cáo đầy đủ.

Tab **Dashboard** là bước tùy chọn để ghép nhiều báo cáo JSON và xem tổng theo kỳ.

## 🧱 Các nhóm khối

| Nhóm | Dùng khi nào | Ví dụ |
|---|---|---|
| 📥 Nguồn | Chọn bảng và dòng thuộc chủ thể đang tính | **Lấy nguồn** |
| 🧹 Dữ liệu | Lọc, tra cứu hoặc tạo cột phái sinh | **Lọc điều kiện**, **Tra bảng**, **Tính cột** |
| 🧮 Tính toán | Cộng, trừ, nhân, chia, làm tròn, giới hạn | **Quét + Tổng**, **% của**, **Cap / Floor** |
| 🧠 Logic | Rẽ nhánh theo điều kiện nghiệp vụ | **Điều kiện**, **Boolean**, **Thời gian** |
| 🟠 Macro | Công thức đóng gói cho quy trình nhiều bước | Waterfall, thuế hoặc chia quỹ |

### Khối “Tính cột”

**Tính cột** nhận một bảng và trả lại bảng đó kèm cột mới. Mỗi khối thực hiện một phép toán `+`, `−`, `×` hoặc `÷` giữa hai toán hạng là cột hoặc hằng số. Có thể nối nhiều khối để tạo công thức dài hơn, ví dụ:

```text
Doanh thu sau thuế × Số tháng quá hạn × 1%
```

Kiểu dữ liệu được kiểm tra ngay khi cấu hình và khi nối khối. Chia cho hằng số `0` bị chặn.

## 💾 Preset là gì?

Preset là “bản thiết kế tính” gồm schema, ánh xạ, recipe, node và vị trí canvas. Preset **không chứa các dòng nhân sự, lương hay job**.

- **Nạp preset**: mở file JSON và tự nhớ cấu hình cho phiên sau.
- **Lưu preset**: tải JSON về máy để backup hoặc chia sẻ.
- Nếu workbook lệch sheet/header so với preset, nút tính bị khóa để tránh chạy nhầm dữ liệu.

## 🔒 Offline và riêng tư

- 🌐 Không CDN, không `fetch`, không gửi dữ liệu ra mạng.
- 🧠 Workbook chỉ sống trong bộ nhớ của tab đang mở.
- 💽 `localStorage` chỉ lưu preset; không lưu dòng dữ liệu Excel hay kết quả tính.
- 🧪 Repo chỉ kèm workbook mẫu ẩn danh; dữ liệu FIN thật không được đưa vào version control.
- 🛡️ Engine chỉ chạy các khối đã đăng ký, không dùng `eval` hay code động.

## 📁 Cấu trúc nhanh

```text
index.html                    App offline
INPUT-Incentive-mau.xlsx      Workbook mẫu ẩn danh
presets/trustana-q1.json      Preset Q1 mẫu
js/core/                      Engine, registry, validator
js/ui/                        Formula canvas
test/                         Regression tests
handoff/                      Directive và audit evidence
```

## ✅ Kiểm thử

```powershell
npm.cmd test
npm.cmd run qa
node --test
```

Kỳ vọng chính của preset mẫu: **Phạt 2.676.672 VND**, **NET 12.516.386 VND**, **lệch 0**.
