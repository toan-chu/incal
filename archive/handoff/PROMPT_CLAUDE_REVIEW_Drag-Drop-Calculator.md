# Prompt cho Claude Cowork review Drag-and-drop Calculator

Copy nguyên prompt dưới đây vào task Claude/Cowork:

---

Làm việc tại:

`C:\Users\RYAN TOAN\Downloads\TRUSTANA\FIN\incentive-calculator`

Chairman chưa yêu cầu implementation. Đây là vòng product/business/formula review kỹ trước khi quyết định Blueprint v3.

## Mục tiêu review

Review đề xuất chuyển app hiện tại thành:

1. `RUN CALCULATOR` cực gọn cho người dùng FIN: kéo dữ liệu -> xử lý việc còn thiếu -> tính và xuất.
2. `RULE RECIPE BUILDER` dạng vertical drag-and-drop, hỗ trợ cộng/trừ/nhân/chia, filter, condition, pool, allocation và bắt buộc mọi tỷ lệ phải xác định rõ `% CỦA cơ sở nào`.
3. Rule lưu dạng typed JSON graph, không formula text, JavaScript, `eval` hoặc arbitrary executable code.
4. Các rule phức tạp như COM waterfall, progressive tax, policy lifecycle dùng domain macro có trace.

## Đọc trước khi review

Đọc theo thứ tự:

1. `AGENTS.md` đang áp dụng và `log/failure.md`.
2. `handoff/REVIEW-PACKET_Drag-Drop-Calculator.md` - tài liệu review chính, gồm toàn bộ formula catalog và 14 quyết định cần chốt.
3. `docs/spec/BLUEPRINT_v2_Config-Studio.md` - business direction gần nhất. Không sửa file này.
4. `docs/theory/HIEN-TRANG_Quy-tac-tinh-Incentive_v2.md`.
5. `handoff/audit.md`, đặc biệt REPORT ngày 20/07 và 21/07.
6. Formula implementation hiện tại:
   - `js/engine/calculator.js`
   - `js/engine/policy.js`
   - `js/engine/profiles.js`
   - `js/engine/tax.js`
   - `js/engine/assemble.js`
   - các helper v1 `enrich.js`, `commission.js`, `penalty.js`
7. Regression evidence:
   - `test/blueprint_v2.test.js`
   - `test/engine.test.js`
   - `test/golden/RECONCILIATION.md`

Chỉ mở workbook `docs/2026Q1_Incentive- (TEST) - Copy.xlsx` khi cần kiểm tra một formula cụ thể bị tranh chấp. Không nghiên cứu lại toàn bộ từ đầu; formula inventory đã nằm trong review packet.

## Phạm vi review bắt buộc

### A. Product/UX

- Đánh giá liệu tách `RUN CALCULATOR` và `RULE RECIPE BUILDER` có thực sự giúp một người không chuyên dùng được app hay không.
- So sánh vertical recipe với full node canvas và spreadsheet/formula editor.
- Kiểm tra người dùng có thể hoàn thành kỳ tính mà không hiểu workspace schema, profile assignment hoặc policy internals.
- Chỉ ra khái niệm nào vẫn còn quá kỹ thuật và đề xuất ngôn ngữ business thay thế.

### B. Rule architecture

- Review typed block vocabulary, unit/type safety và `% OF base` contract.
- Review JSON rule graph, cycle detection, divide-by-zero guard, allocation reconciliation, trace và policy snapshot.
- Xác định macro nào phải khóa internals, macro nào cho phép user compose bằng primitive blocks.
- Review migration từ Workspace/Policy schema v2 sang recipe model; tránh tạo hai source of truth.
- Đánh giá phát hiện repo đang giữ canonical v2 engine cùng các helper formula v1 có hành vi lịch sử mâu thuẫn.

### C. Formula completeness và correctness

Kiểm tra review packet đã bao phủ đủ:

- Cost/GP và COM SMS/no-invoice gross-up.
- Binary Paid/Unpaid và historical partial-paid proration.
- AE routing và new-customer 6-month window.
- Multi-profile monthly weights.
- COM salary target.
- B2 target/achieved/adjustment.
- COM waterfall 8%/12%/17%.
- Manager 2.4% và B2 reduction.
- KAE Admin 5% + KAE Sale 2%, pool/weight/penalty.
- Direct/BO/probation 8%.
- Project individual/equal/weighted/manual; Spring 2.5% paid revenue.
- FIN-entered penalty và historical unpaid formula.
- Tax modes, BK progressive candidates và flat fallback.
- Gross incentive, penalty, tax, other adjustment và net pay.
- Workbook aggregation/reconciliation/output formulas.

Không gộp các nguồn mâu thuẫn thành một công thức duy nhất. Phân biệt rõ:

`V2 direction | XLS behavior | V1 historical rule | current CODE | recommendation`.

### D. 14 quyết định cần chốt

Review từng câu ở mục 10 của review packet. Với mỗi câu, ghi:

| # | Evidence/source | Các lựa chọn thực tế | Ảnh hưởng business | Ảnh hưởng implementation/data migration | Khuyến nghị của Claude | Ai cần chốt |
|---|---|---|---|---|---|---|

Ưu tiên kiểm tra độc lập ba điểm:

1. COM waterfall Level 3 trong XLS/CODE so với pure remaining-target waterfall.
2. BK flat fallback `taxableIncome x 10%` so với canonical CODE `incentiveBeforeTax x 10%`.
3. Hai lớp formula v1/v2 đang cùng tồn tại và được test riêng, có thể làm cả hai hành vi mâu thuẫn cùng pass.

## Output yêu cầu

1. Tạo file:

   `handoff/REVIEW-Claude_Drag-Drop-Calculator.md`

2. Cấu trúc review:

```markdown
# Claude Review - Drag-and-drop Calculator

## Verdict
APPROVE | APPROVE WITH CHANGES | REJECT

## Executive findings

## Product/UX review

## Rule architecture review

## Formula coverage audit

## Decision matrix - 14 items

## P0/P1/P2 findings

## Recommended scope for the next Directive

## Questions requiring Chairman decision
```

3. Append một REVIEW entry ngắn vào `handoff/audit.md`, dẫn link tới file review đầy đủ.

4. Nếu phát hiện review packet thiếu formula hoặc mô tả sai, ghi finding với source/file/section cụ thể. Không tự sửa review packet trong vòng này.

5. Review runtime/file integrity thuộc Codex trên Windows. Có thể sử dụng evidence `npm.cmd test` 40/40 đã ghi trong audit, nhưng không tự tuyên bố runtime pass/fail từ môi trường khác nếu chưa có Windows-native evidence.

## Không được làm trong vòng này

- Không sửa source app, tests, Workspace JSON hoặc sample Excel.
- Không sửa `docs/spec/BLUEPRINT_v1.md` hay `BLUEPRINT_v2_Config-Studio.md`.
- Không tạo Blueprint v3 trước khi Chairman review các quyết định.
- Không rebuild `dist`.
- Không chọn library drag-and-drop hoặc bắt đầu implementation.
- Không biến recommendation của Claude thành business decision đã chốt nếu Chairman chưa xác nhận.

Mục tiêu cuối của vòng này là một review có evidence, giúp Chairman chốt product direction và formula conflicts. Sau khi Chairman phản hồi, Claude mới viết Directive 4 phần theo AGENTS.md cho Codex triển khai.

---
