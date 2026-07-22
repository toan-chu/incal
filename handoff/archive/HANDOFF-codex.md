# HANDOFF → CODEX — Build Incentive Calculator, một lèo P1→P4

**Vai trò của mày:** build toàn bộ tool theo spec, từ engine tới UI, không chờ review giữa chừng. Claude (Cowork) sẽ review sau khi xong hết.

## Đọc trước khi viết dòng code nào (theo thứ tự)

1. `docs/spec/BLUEPRINT_v1.md` — spec đầy đủ: kiến trúc, 8 bước engine E1-E8, schema, validate, output, UI spec 7b, golden test, 4 phases.
2. `docs/theory/HIEN-TRANG_Quy-tac-tinh-Incentive_v2.md` — **mục 0 là rules đã chốt** (mã A1..A12 mà blueprint ref tới). Mục 3-9: giải nghĩa công thức gốc + bug đã biết trong file Q1.
3. `TEMPLATE_Input-Incentive_v2.xlsx` — schema input 8 sheets, bản FIN đã duyệt (đọc bằng script, xem tên cột thật). Lưu ý: các cột derived trong input (`Profit`, `Mức 1/2/3`, `tính tháng kh mới`) engine ĐỌC BỎ QUA — xem E2 blueprint.
4. `docs/origin/2026Q1_Incentive- CHI 11.06.26 (mẫu) (1).xlsx` — file Q1 gốc 41 sheets: nguồn số liệu golden test. Chỉ đọc các sheet nêu trong blueprint mục 8; ĐỪNG load cả file vào RAM một lần (32MB, có sheet 1M dòng rác — đọc read-only, chọn sheet).
5. `assets/BRAND.md` — màu + font.

## Làm một lèo, thứ tự bắt buộc

P1 engine + unit tests → P2 golden Q1 + reconciliation → P3 UI + export → P4 report JSON + tidy.xlsx. DoD từng phase trong blueprint mục 9. Không skip P2: engine chưa đối chiếu xong với Q1 thì UI vô nghĩa.

## Ràng buộc cứng (vi phạm = làm lại)

- Vanilla JS, **không build step, không framework, không npm dependency runtime** (SheetJS vendor local). Mở `TinhIncentive.html` bằng Chrome là chạy từ `file://`.
- Tiền = **số nguyên VND** xuyên suốt. `Math.round` tại đúng các điểm blueprint chỉ định.
- Module engine chạy được cả browser lẫn Node (UMD-lite guard) — `node --test` phải xanh mà không cần browser.
- Không gọi mạng bất kỳ đâu (kể cả font — Roboto vendor woff2 local).
- Label UI 100% tiếng Việt, theo UI spec 7b + brand (tím #4d148c accent; cam #ff6200 cấm dùng cho trạng thái).
- Parse input theo **tên sheet + tên cột**, không theo vị trí — template có thể đổi nhẹ sau khi FIN duyệt.

## Golden test — định nghĩa hoàn thành

- Tự tái tạo input Q1 từ file gốc (script trong `test/golden/`, ghi rõ sheet/cột nguồn).
- Chạy engine → so với số đã chi trong file gốc (BK cột E + P, Lũy tiến, Phạt).
- **Không yêu cầu khớp 100%.** Xuất `test/golden/RECONCILIATION.md`: bảng `người | khoản | XLS | engine | lệch | phân loại (a/b/c) | ghi chú` theo blueprint mục 8. Lệch loại (c) = bug engine → sửa cho hết. Lệch loại (b) = nghi rule ngầm → GHI LẠI, đừng tự chế rule, đừng sửa engine cho khớp.
- 5 câu hỏi mở (blueprint mục 10): implement theo spec hiện tại, đánh dấu `// TODO(open-N)` tại đúng chỗ code liên quan.

## Khi xong

1. `node --test` xanh toàn bộ — dán output vào handoff.
2. Cập nhật `handoff/HANDOFF-codex-done.md`: cấu trúc file đã build, quyết định tự đưa ra ngoài spec (nếu có, kèm lý do), RECONCILIATION tóm tắt (bao nhiêu lệch mỗi loại), việc còn treo.
3. Đừng đụng vào: `docs/`, `TEMPLATE_*.xlsx`, `assets/BRAND.md`.
