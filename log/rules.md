# Hard Rules

Luật đã chốt cho repo `incal`. Vi phạm là lỗi, không phải lựa chọn.

1. **Không tính lại công thức Excel.** Công cụ chỉ đọc giá trị Excel đã lưu. Mọi logic incentive sống trong file `.xlsx`, không sống trong mã.
2. **Không sửa tay `tool/Phieu-Incentive.html`.** File đó là sản phẩm dựng ra. Sửa nguồn ở `tool/src/` rồi chạy `python3 tool/build.py`.
3. **Không đụng `archive/`.** Chỉ đọc để tra cứu.
4. **Số liệu chuẩn Q1/2026 là bất biến:** tổng thực nhận 314.788.696 · 15 người · 345 job. Thay đổi làm lệch số này là lỗi.
5. **Công cụ phải chạy offline.** Không tải font, thư viện, hay bất cứ thứ gì từ internet lúc chạy.
6. **Agent thực thi không tự đóng task của chính mình.** Chỉ được đổi `Status` sang `done` và gỡ việc khỏi mục "Việc đang mở" của `docs/REPO_SNAPSHOT.md` sau khi REVIEW trong mục `## 3. AUDIT` ghi verdict APPROVED hoặc APPROVED WITH NOTES. Nguồn: REVIEW task `20260806_dong-bo-tham-my-tool`.
