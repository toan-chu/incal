# GHI CHÚ CÔNG THỨC — PHỤ CẤP TRỰC ĐÊM & OPS

**Người lập:** Claude (Cowork) · **Ngày:** 2026-08-07 · **Trạng thái:** CHỜ FIN DUYỆT

File này ghi lại mọi chỗ file master mới **khác** file `tính phụ cấp.xlsx` đang dùng. Đọc hết trước khi ký duyệt chi.

**Nguồn quy định:**

- `docs/phụ cấp trực đêm.doc (2) (2).docx`
- `docs/tính OPS và Overtime 2 (1).docx`

**File mới:** `docs/2026M08_PhuCap_MASTER.xlsx` · **Mẫu rỗng:** `PhuCap-Template-TRONG.xlsx`

---

## 1. Bảy lỗi đã sửa

| # | Vị trí trong file cũ | Lỗi | Cách sửa | Ảnh hưởng tiền |
|:-:|---|---|---|---|
| 1 | `J16:J27` | `IF(E16<D16,**0**,0)` — hằng số 0 ở cả hai nhánh, lẽ ra là `1`. Chỉ dòng 15 viết đúng | Bỏ hẳn cách cộng giờ cũ, xem mục 2 | **Thiếu tiền.** Mọi ca qua nửa đêm mất sạch giờ khung 00:00–02:00 |
| 2 | `I15:K27` | Cột J, K so `E` đã cộng ngày với `D` chưa cộng ngày → ca 22:00–02:00 ra 0 giờ lõi | Quy đổi về trục liên tục 22→30 giờ | **Thiếu tiền.** Ví dụ chính trong .docx (22:00–02:00) tính ra 60.000đ thay vì 160.000đ |
| 3 | `L15:L27` | Ngày lễ = `J*45000 + K*75000` — **rơi mất cột I** (khung 22–24 & 04–06) | Ngày lễ = (giờ biên × 30.000 + giờ lõi × 50.000) × 1,5 | **Thiếu tiền.** Ca lễ chạm khung biên không được trả phần đó |
| 4 | `E15` | Nhập `1900-01-24` (kiểu ngày) vào ô giờ kết thúc | Ô giờ có định dạng `hh:mm`, có kiểm tra đầu vào | Sai dữ liệu gốc |
| 5 | `O20` | Bị đè bằng công thức của cột R → `SUM(N20:O20)` tự tham chiếu chính nó | Cột `Phi_OPS` có công thức riêng, đồng nhất mọi dòng | Vòng lặp; `O21:O27` không có công thức nào |
| 6 | `S15:S27` | Thuế TNCN tính **trên từng ca** | Thuế tính một lần trên tổng phụ cấp cả tháng, ở sheet `Payout` | Sai bản chất thuế lũy tiến |
| 7 | Toàn bộ | Mọi dòng ca đều được cộng phí OPS, kể cả ca trực đêm từ xa | Tách cột `Loai_Ca` = `TRUC_DEM` / `OPS` | **Thừa tiền.** Ca trực đêm cũ được cộng thêm 400.000–600.000đ dù không ra sân bay |
| 8 | Cột `Gio_KT_Chuan` | Mốc chia ngày đặt ở 06:00, nên ca kết thúc **sau** 06:00 bị hiểu nhầm là 6h sáng cùng ngày — tức trước cả giờ vào ca | Mốc chia ngày thành tham số `moc_chia_ngay`, mặc định 12:00 | **Mất trắng cả ca.** Xem mục 2b |

---

## 2. Cách cộng giờ trực đêm — thay thế toàn bộ logic cũ

Bài toán: một ca có thể vắt qua nửa đêm, nên không thể so giờ bắt đầu với giờ kết thúc theo kiểu thông thường.

**Cách làm mới — quy đổi về một trục thời gian liên tục từ 22 đến 30 giờ:**

```
Gio_BD_Chuan = nếu giờ bắt đầu < 6:00 thì (giờ + 24) ngược lại giữ nguyên
Gio_KT_Chuan = nếu giờ kết thúc ≤ 6:00 thì (giờ + 24) ngược lại giữ nguyên
```

Trên trục này: 22:00 → 22 · 00:00 → 24 · 04:00 → 28 · 06:00 → 30. Ca 22:00–02:00 thành đoạn `[22, 26]`, không còn hiện tượng giờ kết thúc nhỏ hơn giờ bắt đầu.

```
Gio_Bien = phần giao với [22,24] + phần giao với [28,30]     → đơn giá 30.000 đ/h
Gio_Loi  = phần giao với [24,28]                             → đơn giá 50.000 đ/h
```

**Đối chiếu với bảng trong .docx — khớp toàn bộ:**

| Ca | Giờ biên | Giờ lõi | Phụ cấp giờ (thường) |
|---|---|---|---|
| 22:00–02:00 | 2h | 2h | 2×30.000 + 2×50.000 = **160.000** |
| 00:00–02:00 | 0h | 2h | **100.000** |
| 02:00–06:00 | 2h | 2h | **160.000** |
| 04:00–06:00 | 2h | 0h | **60.000** |
| 22:00–06:00 | 4h | 4h | **320.000** |

**Mức BCA:** chạm khung lõi → `Blaze`; chỉ chạm khung biên → `Spark`. Mỗi ca hưởng **một** mức, lấy mức cao nhất.

---

## 2b. Lỗi mất trắng ca 2 — và cách khung giờ được tham số hoá

Lịch trực thực tế chia **hai ca một đêm cho hai người**: ca 1 từ 22:30 đến 02:30, ca 2 từ 02:30 đến 06:30. Ca 2 kết thúc **sau** mốc 06:00.

Bản đầu tiên đặt mốc chia ngày đúng bằng 06:00: giờ nào ≤ 06:00 mới được hiểu là rạng sáng hôm sau. Ca 2 kết thúc 06:30 → 6,5 > 6 → hệ thống hiểu là **6h30 sáng cùng ngày**, tức trước cả giờ vào ca 02:30 → mọi phép giao khoảng ra âm → **0 đồng**.

Chạy thử 3 đêm: ca 1 trả đủ, ca 2 ra 0. Quy ra tháng 30 đêm là **thiếu khoảng 10 triệu đồng**.

**Cách sửa:** tách mốc chia ngày thành tham số `moc_chia_ngay`, mặc định **12** (12 giờ trưa). Giờ nào trước trưa đều được hiểu là rạng sáng hôm sau. Ca 2 quy đổi thành đoạn `[26,5 ; 30,5]`, rồi bị cắt về khung đêm nhờ `moc_dem_den` — trả đúng 2h biên + 1,5h lõi = **335.000đ**.

**Đồng thời toàn bộ khung giờ được đưa ra Assumption thành tham số nhập tay**, thay cho bốn số cứng 22 / 24 / 28 / 30 của bản trước:

| Named range | Mặc định | Ý nghĩa |
|---|---|---|
| `gio_dem_bat_dau` | 22:00 | Khung đêm bắt đầu |
| `gio_dem_ket_thuc` | 06:00 | Khung đêm kết thúc (rạng sáng hôm sau) |
| `gio_loi_bat_dau` | 00:00 | Khung lõi bắt đầu — đơn giá cao |
| `gio_loi_ket_thuc` | 04:00 | Khung lõi kết thúc |
| `moc_chia_ngay` | 12 | Giờ nhỏ hơn mốc này là rạng sáng hôm sau |

Bốn mốc trên trục (`moc_dem_tu`, `moc_loi_tu`, `moc_loi_den`, `moc_dem_den`) giờ là **ô tự tính**, nền xám, không sửa tay. Ô `kiem_tra_khung` phải hiện "Hợp lệ"; nếu khung lõi bị đặt ra ngoài khung đêm thì nó báo lỗi ngay.

**Nghĩa là: đổi chính sách chỉ cần sửa ô giờ, không đụng một công thức nào.** Đã chạy thử ba kịch bản:

| Kịch bản | Ca 1 · 22:30–02:30 | Ca 2 · 02:30–06:30 |
|---|---|---|
| Khung 22:00–06:00, lõi 00–04 (hiện hành) | 1,5h biên + 2,5h lõi = **370.000** | 2h biên + 1,5h lõi = **335.000** |
| Nới khung đêm tới 06:30 | 370.000 — không đổi | 2,5h biên + 1,5h lõi = **350.000** |
| Đổi hẳn 21:00–07:00, lõi 23:00–03:00 | 0,5h biên + 3,5h lõi = **390.000** | 3,5h biên + 0,5h lõi = **330.000** |

Phiếu PDF và bản xem trên màn hình **tự đọc nhãn khung giờ từ file** — đổi chính sách thì dòng "Khung biên 22:00–00:00 & 04:00–06:00" trên phiếu cũng đổi theo, không viết cứng trong mã.

**Nhập giờ hệ 24:** mọi ô giờ định dạng `HH:mm` và có kiểm tra dữ liệu — gõ chữ hoặc AM/PM là Excel chặn ngay kèm thông báo tiếng Việt.

> **VẪN CẦN FIN QUYẾT:** với khung hiện hành, ca 2 được trả 3,5h chứ không phải 4h — đoạn 06:00–06:30 nằm ngoài khung quy định nên không tính, mỗi đêm hụt 15.000đ. Ba hướng: (a) đổi lịch ca 2 thành 02:30–06:00, (b) sửa `gio_dem_ket_thuc` thành 06:30 — đây là **nới chính sách**, phải có văn bản duyệt, (c) giữ nguyên, coi 30 phút bàn giao là không tính tiền.

**Ngày lễ:** cả phụ cấp giờ và BCA nhân `he_so_le` = 1,5. Kiểm chứng: 30.000×1,5 = 45.000 · 50.000×1,5 = 75.000 · 100.000×1,5 = 150.000 · 200.000×1,5 = 300.000 — trùng khít bảng trong .docx.

---

## 3. Ba điểm cần FIN quyết — chưa có căn cứ trong văn bản

### 3.1. Bậc thuế TNCN quy đổi từ QUÝ sang THÁNG

File `2026Q1_Incentive_MASTER.xlsx` dùng bộ 5 bậc `{5%, 10%, 20%, 30%, 35%}` với giảm trừ nhanh `{0 · 500.000 · 3.500.000 · 9.500.000 · 14.500.000}` — đây là con số của **kỳ quý**. File `tính phụ cấp.xlsx` bê nguyên bộ này dù bảng tính theo tháng.

File master mới **chia 3** để về kỳ tháng: `{0 · 166.667 · 1.166.667 · 3.166.667 · 4.833.333}`.

> Nằm ở `Assumption` mục 8, named range `thue_giam_1` … `thue_giam_5`. Muốn quay lại bộ cũ chỉ cần sửa 5 ô, không đụng công thức.
>
> **Lưu ý thêm:** bộ 5 bậc này không trùng biểu thuế lũy tiến 7 bậc theo Luật Thuế TNCN hiện hành. Đây là cách đơn giản hoá nội bộ có từ trước, tôi giữ nguyên cấu trúc để không tự ý đổi chính sách. FIN xác nhận có đúng ý không.

### 3.2. Giảm trừ gia cảnh — mặc định KHÔNG áp ở bảng phụ cấp

Bản nháp đầu tôi cho tự động áp 11 triệu/tháng + 4,4 triệu/người phụ thuộc vào bảng phụ cấp. **Sai** — giảm trừ đã dùng hết ở bảng lương, áp lần nữa ở đây là tính hai lần và làm thuế phụ cấp về 0 cho gần như mọi người.

Cách làm chốt lại, cột `Cach_Tinh_Thue` tự sinh từ danh sách nhân sự:

| Trạng thái nhân sự | Cột `Cach_Tinh_Thue` | Thuế ở bảng này |
|---|---|---|
| Có đăng ký giảm trừ tại công ty | `Gộp bảng lương` | **0** — phụ cấp cộng vào thu nhập tháng, quyết toán lũy tiến trên bảng lương |
| Không đăng ký (thu nhập vãng lai) | `Khấu trừ 10%` | Khấu trừ thẳng 10% ngay tại bảng này |

Cột `Giam_Tru_Ap_Dung` để trống (0), chỉ nhập tay khi bảng phụ cấp là **nguồn thu nhập duy nhất** của nhân sự trong tháng.

> **FIN xác nhận:** cách bắc cầu sang bảng lương này có khớp quy trình đang chạy không? Nếu FIN muốn khấu trừ dứt điểm ngay tại bảng phụ cấp thì phải đổi lại.

### 3.3. Ví dụ trong .docx tự mâu thuẫn với bảng của chính nó

Văn bản `phụ cấp trực đêm.docx` viết:

> "Nhân viên trực **ngày thường**. Trực 22:00–02:00. … BAC: **Spark = 150.000 đồng**. → Tổng phụ cấp = 310.000 đồng/ca"

Hai chỗ vênh với bảng ngay phía trên trong cùng văn bản đó:

1. Bảng ghi Spark **ngày thường** = 100.000đ; 150.000đ là mức **ngày lễ**.
2. Ca 22:00–02:00 có chạm khung 00:00–02:00, tức đã vào vùng **Blaze** chứ không phải Spark.

File master áp theo **bảng**, không theo ví dụ → ca này ra `Blaze`, ngày thường:

```
160.000 (phụ cấp giờ) + 200.000 (BCA Blaze) = 360.000 đ/ca
```

thay vì 310.000đ như ví dụ. **FIN chốt lại con số đúng.**

---

## 4. Bố cục file master

| Sheet | Nội dung |
|---|---|
| `Assumption` | 9 mục tham số, mọi số cứng đều có named range. Kèm danh sách nhân sự `tbl_staff_pc` |
| `Data` | `tbl_shifts` — nhật ký ca, mỗi dòng một ca. Ô nền vàng nhập tay, còn lại là công thức |
| `Calc_TrucDem` | Tổng hợp trực đêm theo người: số ca, giờ biên/lõi, số ca Spark/Blaze, tiền |
| `Calc_OPS` | Tổng hợp OPS theo người: số chuyến, tổng kg, số chuyến cần 2 người, tiền |
| `Payout` | Bảng chi cuối cùng + thuế TNCN. Công cụ HTML đọc sheet này |

**Named range đã đặt** (dùng được ở mọi công thức, đổi chính sách chỉ sửa một ô):

```
NHẬP TAY (nền vàng)
ky_ten · ky_bat_dau · ky_ket_thuc · loai_bang
gio_dem_bat_dau · gio_dem_ket_thuc · gio_loi_bat_dau · gio_loi_ket_thuc · moc_chia_ngay
rate_gio_bien · rate_gio_loi · he_so_le
bca_spark · bca_blaze
ops_0600_0800 · ops_0800_1800 · ops_1800_2200 · ops_2200_0100 · ops_0100_0600 · ops_phu_troi_le
ops_kg_1nguoi · ops_nguoi_toi_da
giam_tru_ca_nhan_thang · giam_tru_phu_thuoc_thang · rate_khau_tru_vang_lai
thue_rate_1..5 · thue_giam_1..5

TỰ TÍNH (nền xám — không sửa tay)
moc_dem_tu · moc_loi_tu · moc_loi_den · moc_dem_den · kiem_tra_khung
```

**Cột tự kiểm tra** trong `Data`:

- `NS_Chuan` — định biên chuẩn theo trọng lượng lô (≤30kg: 1 người · từ 31kg: 2 người)
- `Canh_Bao` — báo "Ca ngoài khung 22:00–06:00" hoặc "Thiếu người so với định biên". Công cụ HTML hiện các cảnh báo này lên băng vàng khi nạp file

---

## 5. Điểm quy định chưa được đưa vào công thức

Hai văn bản có một số nội dung **không lượng hoá được**, nên file master chỉ ghi nhận bằng cột đánh dấu, không tự tính:

| Nội dung | Xử lý trong file |
|---|---|
| Người backup nhận ca thay khi trực chính không phản hồi | Cột `Backup_Nhan_Ca`. FIN ghi thẳng tên người **thực sự được trả** vào cột `Ho_Ten`, đúng nguyên tắc "mỗi sáng FIN chốt lại ca đó tính cho ai" |
| 5 mức xử phạt (nhắc nhở → bồi thường) | Không tự tính. Trừ tiền qua cột `Cong_Tru_Khac` ở `Payout`, kèm ghi chú |
| Chi phí đi lại (Be công ty / xe công ty, hoá đơn VAT) | Ngoài phạm vi bảng phụ cấp — đây là chi phí hoàn ứng, không phải thu nhập của nhân sự |
| Tính chi phí dự kiến trước khi nhận lô OBC/PET/CFS | Ngoài phạm vi. Bảng này tính **sau** khi ca đã chạy xong |
| "Overtime" trong tên file `tính OPS và Overtime` | **Văn bản không có bảng hệ số làm thêm giờ nào.** Nội dung mục 1–6 chỉ nói về OPS, chi phí đi lại và định biên. Nếu công ty có chế độ overtime riêng, cần văn bản bổ sung mới làm được |

---

## 6. Đã kiểm chứng những gì

Toàn bộ công thức được tính lại độc lập ngoài Excel rồi đối chiếu:

- 5 tình huống ca trực đêm trong bảng mục 2 — khớp bảng đơn giá trong .docx
- Ca ngày lễ: đơn giá sau hệ số ra đúng 45.000 / 75.000 / 150.000 / 300.000
- Ca kết thúc đúng 00:00 (22:00–24:00) — ra 2h biên, 0h lõi, Spark
- Giờ lẻ tới từng phút: 22:30–02:30 · 23:15–05:45 · 23:45–04:15 · 22:10–22:40 — đúng hết
- Ranh giới 06:00: ca kết thúc 05:00 · 05:59 · 06:00 · 06:01 · 06:30 · 07:00 — đúng hết sau khi sửa lỗi 8
- Ba kịch bản đổi chính sách khung giờ ở mục 2b — chỉ sửa ô giờ, không đụng công thức
- Phí OPS cả 5 khung giờ + phụ trội lễ
- Thuế: `Khấu trừ 10%` trên 900.000 ra 90.000, thực nhận 810.000
- Tổng kỳ mẫu: trực đêm 3.172.500 + OPS 2.400.000 = **gross 5.572.500**, 8 ca trực · 7 chuyến OPS
- Chạy lại kiểm thử incentive cũ: 15 người, 345 job, thực nhận 314.788.696 — **không đổi**
- 80 tiêu chí kiểm thử tự động, đạt toàn bộ

---

## 7. Bước bắt buộc trước khi dùng

File master được sinh bằng script, chưa có kết quả công thức Excel ghi sẵn. Công cụ HTML sẽ **báo đỏ và khoá nút xuất** — đúng như thiết kế.

> Mở `2026M08_PhuCap_MASTER.xlsx` bằng **Excel** → bấm **Lưu** → nạp lại vào công cụ.

Sang tháng sau: nhân bản file, sửa `ky_ten` / `ky_bat_dau` / `ky_ket_thuc` ở `Assumption`, xoá dữ liệu trong `Data`, nhập ca mới.
