# Cập nhật README cho công cụ hiện tại

> **Bản đồ repo:** đọc `docs/REPO_SNAPSHOT.md` trước khi bắt đầu.
> **Luật đã chốt:** đọc `log/rules.md`.

**Status:** open
**Giao ngày:** 2026-08-06

## 1. DIRECTIVE

### [AUTO] Mục tiêu và bối cảnh

Cập nhật README để phản ánh đúng công cụ offline hiện tại, làm rõ đường dẫn sử dụng hằng ngày và thêm nút MIT License.

### Hướng kỹ thuật sơ bộ

Chỉ sửa tài liệu root README; dùng liên kết tương đối để hoạt động trên GitHub và kiểm tra lại badge, anchor, đường dẫn nội bộ.

### Ngoài phạm vi

- Không sửa công cụ, workbook, build, test hoặc license text.
- Không commit/push hay thay đổi Git state.

### Tiêu chí nghiệm thu

1. README có MIT badge liên kết đến `LICENSE`.
2. Quick start nêu rõ `tool/Phieu-Incentive.html` là file cần nhấp đúp và không cần build/cài đặt khi sử dụng.
3. Số lượng tiêu chí kiểm thử phản ánh đúng 44 `H.check` hiện có.
4. Các đường dẫn nội bộ được kiểm tra tồn tại.
5. Task giữ `Status: open` để chờ REVIEW.

## 2. TODO

- [x] Cập nhật badge và phần mở công cụ.
- [x] Đồng bộ thông tin kiểm thử hiện tại.
- [x] Kiểm tra link/path và ghi REPORT + session journal.

## 3. AUDIT

### [2026-08-06 17:55] REPORT [AUTO]

**Done:** Cập nhật phần đầu README với nút Mở trực tiếp, Offline và MIT License; làm rõ thao tác sử dụng hằng ngày; cập nhật badge kiểm thử từ 24 lên đúng 44 tiêu chí hiện có.

**Files changed:** `README.md`, `docs/REPO_SNAPSHOT.md`, `handoff/tasks/20260806_cap-nhat-readme.md`, `log/sessions/20260806_dev_docs_cap-nhat-readme.md`.

**Verification:**

```text
H.check total=44
LICENSE exists=True
Tool exists=True
README.md:9  [MIT License](LICENSE)
README.md:14 Kiểm thử-44 tiêu chí
README.md:20 ## 🚀 Mở công cụ
README.md:32 tool/Phieu-Incentive.html link exists
```

**Deviations from Directive:** none.

**Open questions for Cowork:** Hậu kiểm và đóng task nếu APPROVED/APPROVED WITH NOTES.

**Risks/known gaps:** Badge hình ảnh do shields.io cung cấp chỉ cần mạng khi GitHub render README; công cụ HTML vẫn hoàn toàn offline.
