# Prompt cho task mới - Implement Blueprint v2 Config Studio

Copy nguyên prompt dưới đây vào task Codex mới:

---

Làm việc tại:

`C:\Users\RYAN TOAN\Downloads\TRUSTANA\FIN\incentive-calculator`

Hãy triển khai đầy đủ blueprint mới:

`docs/spec/BLUEPRINT_v2_Config-Studio.md`

Business discovery đã hoàn tất; không nghiên cứu lại từ đầu và không hỏi lại các quyết định đã được chốt trong blueprint. Trước khi sửa, đọc `AGENTS.md` đang áp dụng, `log/failure.md`, blueprint v2, `handoff/todo.md`, `handoff/audit.md`, engine/UI/tests hiện tại và các source được blueprint dẫn trực tiếp. Không sửa `docs/spec/BLUEPRINT_v1.md` vì đó là blueprint lịch sử đã đóng.

Mục tiêu implementation:

1. Canonical data model độc lập Excel.
2. Company Workspace JSON lưu nhân sự, salary history, assignments, policies và master data; load/save/roundtrip.
3. Policy version `DRAFT/ACTIVE/INACTIVE`, áp từ quý tương lai, snapshot vào report.
4. Một người có nhiều calculation profiles với monthly weight; target chỉ áp đúng COM bucket.
5. AE routing, Paid/Unpaid từ MISA, penalty FIN nhập.
6. KAE pool chung Product/CX, không KPI gate, hỗ trợ full/half-month và chuyển KAE/COM.
7. Project Incentive framework; Spring default paid revenue 2.5%, allocation individual nhưng đổi được equal/weighted/manual.
8. Tax modes + editable parameters.
9. Rule-aware requirements: không bắt gross salary cho role/profile không dùng target.
10. Direct-entry UI + Config Studio; Excel import optional; giữ BK/BKê/PDF/job/report JSON/Dashboard.

Kỷ luật triển khai:

- Viết technical plan và Test Plan dưới task mới trong `handoff/todo.md` trước khi code.
- Dùng architecture đơn giản, deterministic; không `eval`, không formula editor tự do.
- Thực hiện theo phases của blueprint và verify từng phase; không stack nhiều thay đổi chưa test.
- Bảo toàn dữ liệu/chỉnh sửa hiện hữu; không cleanup ngoài scope.
- Thêm happy-path và edge-case tests theo 14 acceptance tests trong blueprint.
- Chạy `npm.cmd test`, targeted schema/roundtrip/regression tests và browser smoke từ `file://`.
- Dùng frontend implementation QA sau khi sửa UI; kiểm tra console, interaction, overflow desktop/mobile.
- Chỉ rebuild `dist` sau khi source tests và browser smoke pass; không gửi root project cho HR.
- Ghi verification output thật vào `handoff/audit.md` và append `log/history.md` theo AGENTS.md.

Hãy tự thực hiện đến khi acceptance criteria đạt, chỉ dừng hỏi nếu phát hiện business conflict mới không thể suy ra an toàn từ blueprint.

---
