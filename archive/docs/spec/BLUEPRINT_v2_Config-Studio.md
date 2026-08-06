# BLUEPRINT v2 - Direct Entry, Config Studio và Rule-aware Engine

**Ngày chốt:** 2026-07-20  
**Trạng thái:** Approved business direction - ready for implementation  
**Thay thế về hướng phát triển:** mở rộng `BLUEPRINT_v1.md`; không sửa hoặc xóa blueprint v1 đã đóng.  
**Nguồn đối chiếu:** workbook `docs/2026Q1_Incentive- (TEST) - Copy.xlsx`, policy 01/01/2026, checklist FIN, RTF quy trình, `docs/theory/HIEN-TRANG_Quy-tac-tinh-Incentive_v2.md`, engine hiện tại và các quyết định người dùng/FIN trong discovery ngày 20/07/2026.

## 1. Mục tiêu

Chuyển app từ "Excel template bắt buộc + một bảng config phẳng" thành công cụ offline có:

1. Nhập và chỉnh dữ liệu trực tiếp trong app.
2. Company Workspace JSON lưu nhân sự, lịch sử lương, assignment, policy và master data để FIN nhập một lần rồi cập nhật khi thay đổi.
3. Config Studio dùng rule template có kiểm soát; không cho chạy công thức tự do hoặc `eval`.
4. Một nhân sự có thể đồng thời hoặc lần lượt thuộc nhiều calculation profile; target chỉ áp vào đúng component/bucket.
5. Policy có version, trạng thái `DRAFT / ACTIVE / INACTIVE` và quý bắt đầu áp dụng; không có ngày kết thúc.
6. Excel cũ tiếp tục là adapter import optional. Các export BK, BKê, job data, PDF và report JSON vẫn hoạt động.
7. Engine deterministic, traceable, snapshot được policy/config và có regression tests.

## 2. Nguyên tắc kiến trúc

Tách bốn lớp:

```text
Company Workspace Data
  -> Policy / Rule Configuration
  -> Deterministic Calculation Engine
  -> Report / BK / BKê / Dashboard exports
```

- **Data** là sự kiện/sự thật: nhân sự, lương theo thời gian, jobs, KAE, khách hàng mới, Paid/Unpaid, phạt FIN nhập, payroll và project participation.
- **Config** là luật có version: đối tượng áp dụng, rate, target, routing, allocation mode, tax mode và validation requirements.
- **Derived** là số app tự tính: target, cost cuối, GP, level, waterfall, pool, incentive, tax và net pay.
- **Override** là điều chỉnh theo người/job/kỳ, phải có lý do; không biến ngoại lệ thành global config.

## 3. Company Workspace JSON

Tên download mặc định:

```text
TRUSTANA_INCENTIVE_WORKSPACE_yyyymmdd_hhmmss.json
```

Logical schema:

```json
{
  "schemaVersion": 2,
  "company": {},
  "employees": [],
  "salaryHistory": [],
  "profileAssignments": [],
  "policyVersions": [],
  "kaeAccounts": [],
  "newCustomers": [],
  "projectDefinitions": [],
  "quarterRuns": [],
  "updatedAt": ""
}
```

Yêu cầu:

- App autosave working copy vào local browser storage khi khả thi.
- Có nút rõ ràng `LƯU WORKSPACE JSON` và `MỞ WORKSPACE JSON`; JSON là backup/portability source of truth.
- Report calculation lưu immutable input + policy/config snapshot, không phụ thuộc master data bị sửa về sau.
- App là calculator, không phải HRIS: nhân sự có thể đặt `inactive`; UI có thể cho xóa hẳn khi người dùng chủ động chọn.
- Salary là history theo `effectiveFrom`; FIN chỉ nhập lại khi lương thay đổi.

## 4. Policy lifecycle

Mỗi company có tối đa một policy `ACTIVE` cho calculation mới.

```text
DRAFT -> ACTIVE -> INACTIVE
```

Fields tối thiểu:

```text
id
name
version
status
appliesFromQuarter
activatedAt
supersedesPolicyId
rules
```

Quy tắc:

- Không có `effectiveTo`/ngày kết thúc.
- Policy không đổi giữa quý. Policy mới luôn áp từ đầu một quý tương lai.
- Activate version mới tự chuyển version ACTIVE cũ thành INACTIVE.
- Chỉnh policy ACTIVE phải qua `Clone as draft`; không sửa đè lịch sử.
- Rerun report cũ mặc định dùng snapshot/version đã lưu, không dùng policy active hiện tại.

## 5. Nhân sự, salary và nhiều calculation profile

Không dùng một `calcType` duy nhất trên employee.

Employee master chứa identity/lifecycle. Salary history chứa lương theo thời gian. `profileAssignments` nối người với calculation profile theo khoảng thời gian và monthly weight.

Profiles chuẩn ban đầu:

```text
COM_SALES_OFFICIAL
COM_MANAGER
KAE_POOL_ELIGIBLE
DIRECT_SALES_8
PROJECT_PARTICIPANT
NO_INCENTIVE
```

Một người có thể có nhiều profile. Calculation chạy theo bucket rồi mới cộng về person.

Ví dụ chuyển KAE sang COM giữa tháng:

```text
KAE_POOL_ELIGIBLE weight = 0.5
COM_SALES_OFFICIAL weight = 0.5
```

- KAE nhận nửa share tháng đó.
- COM target tháng đó = gross salary x target factor x 0.5.
- Job/component thuộc COM mới bị target; project/direct/KAE component không bị target.

## 6. Job routing và cột AE

Nguồn routing chính của workbook hiện tại là `job quy (5)` cột AE.

Mapping mặc định:

```text
General   -> Level 2
KAE Admin -> Level 1 + KAE Admin pool
KAE Sale  -> Level 1 + KAE Sale pool
New       -> Level 3 nếu đủ điều kiện; nếu không HĐ/ngoài window thì Level 2
```

- App tin classification input/routing của FIN; master KAE/KH mới dùng để kiểm tra và cảnh báo mismatch.
- Cho phép override job với lý do.
- `KAE trước (1)` và mức trung bình 6 tháng chỉ là tham khảo, không tham gia target/incentive và không phải input bắt buộc.

## 7. Payment và penalty

- Payment status là binary `Paid / Unpaid`, lấy từ MISA; thiếu dù 1 đồng vẫn là `Unpaid`.
- App không tự suy luận trạng thái, partial payment hoặc aging.
- `Paid`: GP được đưa vào incentive.
- `Unpaid`: GP incentive = 0; job đi vào penalty.
- FIN nhập `penaltyAmount` cuối cùng theo job; engine không tự tính invoice balance/số tháng.
- Manual bad-debt provision và các khoản phạt khác cũng là input/override, không phải global constant.

## 8. Cost và GP

Input cost đã bao gồm COM.

```text
costWithoutCom = inputCost - com
comSmsGrossedUp = com x cfg.comSmsFactor
finalCost = costWithoutCom + comSmsGrossedUp + noInvoiceCost x cfg.noInvoiceTaxRate
gp = revenue - finalCost
```

Defaults Trustana:

```text
comSmsFactor = 1.125
noInvoiceTaxRate = 20%
```

## 9. COM Sales và KPI B2

`KPI B2 - Khách hàng mới` là khái niệm khác `Mức 2 - 12%`; UI phải ghi đầy đủ để tránh nhầm.

Defaults Trustana:

```text
Target = gross salary từng tháng x 3 x COM assignment weight
Waterfall order = Level 1 -> Level 2 -> Level 3
Rates = 8% / 12% / 17%
B2 target = 1 khách hàng mới đủ điều kiện / active COM month
B2 adjustment = +/-1% mỗi khách chênh lệch
B2 applies to = Level 2 và Level 3
Positive cap = +3%
New customer không có hợp đồng = Level 2
```

Engine tiếp tục count unique eligible customer per person/quarter và lưu trace achieved/target/adjustment.

## 10. Manager reward

Defaults Trustana:

```text
baseRate = 2.4%
missingB2Reduction = 0.2% / chỉ tiêu thiếu
maxReduction = 0.6%
base = paid team GP - team target
exclude manager from team base = true
```

Manager reward là component riêng; personal COM component của manager vẫn theo assignment của chính họ.

## 11. KAE/KAM pool

- Không dùng KPI gate.
- Product và CX dùng chung một KAE pool; chuyển CX -> Product không làm mất share.
- Pool tính theo tháng từ paid GP:

```text
monthlyPool = KAE Admin paid GP x 5% + KAE Sale paid GP x 2%
personShare = monthlyPool x personWeight / totalEligibleWeight
```

- Người làm đủ tháng weight 1; nửa tháng weight 0.5; nghỉ giữa quý vẫn hưởng phần tháng đã làm.
- Nhiều assignment cùng thuộc `KAE_POOL_ELIGIBLE` trong một tháng được cộng nhưng cap tổng weight ở 1, tránh CX 0.5 + Product 0.5 bị tính hai người.
- Chuyển KAE -> COM có thể có KAE 0.5 và COM 0.5 trong cùng tháng.
- Team penalty nếu có được trừ khỏi pool trước khi chia hoặc theo policy parameter đã chọn.

Defaults:

```text
KAE Admin rate = 5%
KAE Sale rate = 2%
allocation = weighted equal share
```

## 12. Direct Sales / BO / thử việc

```text
incentive = 8% x paid GP thuộc DIRECT_SALES_8 bucket
target = none
```

Người chuyển chính thức trong tháng dùng assignment weight để chia DIRECT/COM component.

## 13. Project Incentive framework

Không hardcode Spring. `projectDefinitions` cho phép tạo nhiều side project bằng template.

Fields:

```text
code, name, status
basis: paidRevenue | paidGp | fixedPool
rate
allocationMode: individual | equal | weighted | manual
stackMode: stack | exclusive
participantSource
```

Default tạm thời cho Spring:

```text
code = SPRING
basis = paidRevenue
rate = 2.5%
allocationMode = individual
stackMode = stack
```

Với `individual`: incentive mỗi người = rate x paid revenue của các job project do người đó sở hữu. FIN có thể đổi sang equal/weighted/manual trong Config Studio mà không sửa code.

## 14. Tax configuration

Tax là rule template có mode và parameters, không cho arbitrary JS/formula.

Modes ban đầu:

```text
PROGRESSIVE
FLAT_RATE
PROGRESSIVE_WITH_FLAT_FALLBACK
MANUAL
DISABLED
```

Parameters:

```text
progressive rates
quick deductions
flat rate
social insurance
family deduction
payroll taxable income/tax paid
per-person adjustment
```

Mọi calculation lưu tax trace và config snapshot.

## 15. Rule-aware requirements và validation

Requirements được resolve từ active assignment/rule, không hardcode global.

Ví dụ:

- Chỉ COM official month có salary-based target mới require gross salary của tháng đó.
- KAE, BO, direct sale, project không dùng target thì không require salary.
- Error message phải nêu người, tháng, profile và lý do cần field.
- Validation kiểm tra tổng assignment weight, policy status, job routing, duplicate job, unknown employee, project participant, missing penalty và missing payroll inputs theo tax mode.

## 16. UI information architecture

Top-level views:

```text
DỮ LIỆU
  Nhân sự
  Lịch sử lương
  Assignments
  Jobs
  KAE
  Khách hàng mới
  Phạt
  Payroll

CHÍNH SÁCH
  Policy versions
  COM Sales
  Manager
  KAE pool
  Direct/BO/Thử việc
  Projects
  Cost/GP
  Tax

KỲ TÍNH
  Quarter setup
  Import Excel optional
  Validation
  Calculation
  Results/trace/exports

DASHBOARD
  Giữ luồng report JSON hiện tại
```

Mỗi rule card hiển thị: áp dụng cho ai, cần dữ liệu gì, cách tính và ví dụ số. Các lựa chọn business dùng dropdown/toggle; không hiện raw expression editor.

## 17. Backward compatibility

- `parseWorkbook` trở thành adapter chuyển Excel template cũ sang canonical data model.
- Direct-entry và workspace JSON dùng cùng canonical model; engine không biết dữ liệu đến từ Excel hay form.
- Giữ nguyên các export đang có và report JSON cho Dashboard.
- Có migration `schemaVersion` cho workspace JSON.
- Không gửi source/docs/test cho HR; chỉ rebuild `dist` sau khi source tests và browser smoke pass.

## 18. Implementation phases

### Phase 1 - Canonical model và workspace

- Workspace schema, policy schema, migrations.
- JSON load/save/roundtrip.
- Employee, salary history, assignment weights.
- Excel adapter output cùng canonical shape.

### Phase 2 - Rule engine refactor

- Rule registry/templates.
- Policy activation/snapshot.
- Rule-aware validation.
- AE routing, Paid/Unpaid, penalty input.
- Fractional COM/KAE/direct assignments.
- Project framework và tax modes.

### Phase 3 - Direct-entry UI / Config Studio

- Editable tables/forms.
- Policy version lifecycle.
- Project/tax configuration.
- Validation explanations và trace.
- Preserve calculation/results/exports/dashboard.

### Phase 4 - Verification và distribution

- Unit/regression tests.
- Workspace JSON roundtrip.
- Existing Excel fixture parity.
- Browser smoke từ `file://`.
- Rebuild clean `dist` package only after pass.

## 19. Acceptance tests

1. COM official thiếu salary tháng active -> blocking error; KAE/non-target thiếu salary -> không lỗi.
2. Employee KAE 0.5 + COM 0.5 -> KAE half share, COM half target, không double-count.
3. Employee CX 0.5 + Product 0.5 -> full KAE weight 1.
4. Employee nghỉ giữa quý -> nhận đúng các month weights đã làm.
5. AE `KAE Admin/Sale/General/New` route đúng; KAE history sheet vắng không block.
6. Paid job tính incentive; Unpaid job incentive 0 và nhận penalty FIN nhập.
7. Cost đã gồm COM được gross-up đúng, không double-count COM.
8. B2 adjustment trace tách rõ KPI B2 và Level 2.
9. Project `individual` và `equal` cho kết quả đúng; Spring default individual.
10. Tax modes và parameter override hoạt động, report lưu trace.
11. Activate policy mới từ quý tiếp theo; report cũ vẫn dùng snapshot cũ.
12. Workspace JSON roundtrip bảo toàn calculation.
13. Existing Excel fixture vẫn tính cùng kết quả trong phần rule không đổi.
14. App chạy offline bằng `file://`, không network call, exports và Dashboard không regression.

## 20. Không nằm trong scope

- HRIS/database nhân sự đầy đủ.
- Đồng bộ trực tiếp API MISA.
- Formula editor tự do, JavaScript/eval hoặc user-defined executable code.
- Workflow email/phê duyệt nghỉ việc phức tạp.
- Tự suy luận Paid/Unpaid hoặc tự tính aging từ công nợ.

## 21. Trạng thái câu hỏi nghiệp vụ

Không còn blocker trước implementation. Các defaults chưa có dữ liệu thực tế, như Spring chưa từng chạy, phải hiển thị rõ trong Config Studio và có test cho việc đổi mode thay vì hardcode.
