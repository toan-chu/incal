# REVIEW PACKET - Drag-and-drop Incentive Calculator

**Ngày:** 2026-07-21  
**Trạng thái:** Discovery / architecture proposal - chưa triển khai  
**Người review:** Chairman + Claude Cowork  
**Phạm vi:** Thay cách người dùng vận hành và cấu hình app; bảo toàn dữ liệu, calculation trace, policy version và các export hiện có.

---

## 0. Kết luận đề xuất

Không nên tiếp tục mở rộng UI hiện tại theo kiểu thêm bảng, thêm tab và thêm field config. UI hiện tại đang phản ánh trực tiếp mô hình kỹ thuật (`workspace`, `salaryHistory`, `profileAssignments`, `policyVersions`, `quarterRuns`) nên người dùng phải hiểu kiến trúc trước khi tính được incentive.

Đề xuất đổi sản phẩm thành hai chế độ tách biệt:

1. **RUN CALCULATOR - mặc định cho FIN:** chỉ có 3 bước `Kéo dữ liệu vào -> Sửa việc còn thiếu -> Tính và xuất`.
2. **RULE RECIPE BUILDER - chế độ nâng cao:** drag-and-drop các block có kiểu dữ liệu rõ ràng. Người dùng được tùy biến cộng, trừ, nhân, chia, điều kiện, tập job, tổng hợp, phân bổ và phần trăm; nhưng không nhập JavaScript, không `eval`, không gõ công thức tự do.

Không khuyến nghị node canvas tự do kiểu sơ đồ dây nối mọi hướng làm giao diện chính. Với người không chuyên, dạng đó nhanh biến thành "mì spaghetti". Khuyến nghị **vertical recipe builder**: công thức đọc từ trên xuống như một công thức nấu ăn; drag để thêm/reorder block, liên kết ngầm theo input/output, chỉ mở graph view khi debug.

Điểm quan trọng nhất cho yêu cầu phần trăm:

```text
Không có block "12%" đứng một mình.
Mọi block phần trăm phải là: [12%] CỦA [đối tượng/cơ sở nào].
```

Ví dụ:

```text
12% CỦA GP mức 2 vượt target
5% CỦA Paid GP nhóm KAE Admin
2.5% CỦA Paid Revenue dự án Spring
1% CỦA doanh thu hóa đơn gồm VAT x số tháng unpaid
```

Như vậy UI cho phép tùy biến mạnh nhưng vẫn buộc người dùng trả lời đúng câu hỏi nghiệp vụ: "% của cái gì?".

---

## 1. Chẩn đoán app hiện tại

### 1.1 Vấn đề không nằm ở màu sắc

App hiện có bốn tab `DỮ LIỆU / CHÍNH SÁCH / KỲ TÍNH / DASHBOARD`. Người dùng gặp ngay các khái niệm:

- Company Workspace JSON.
- Nhân sự, lịch sử lương, assignments, jobs, KAE, khách hàng mới, phạt, payroll.
- Policy `DRAFT / ACTIVE / INACTIVE`, clone và activate.
- Calculation profiles.
- Project basis, allocation mode, stack mode.
- Validation, snapshot, history và export.

Các khái niệm này đúng về kỹ thuật nhưng không phải ngôn ngữ của tác vụ hàng quý. Kết quả là app giống admin console hơn calculator.

### 1.2 Mô hình thao tác phù hợp hơn

Người dùng bình thường chỉ cần trả lời lần lượt:

1. Kỳ nào đang tính?
2. Dữ liệu jobs, nhân sự, thanh toán và phạt đã đủ chưa?
3. Dùng bộ chính sách nào?
4. Có lỗi nào cần sửa?
5. Kết quả và nguyên nhân từng khoản là gì?

Các đối tượng kỹ thuật như workspace schema, assignment table và policy lifecycle nên được app quản lý phía sau hoặc chỉ xuất hiện trong chế độ nâng cao.

### 1.3 So sánh ba kiểu editor

| Kiểu | Điểm mạnh | Rủi ro | Kết luận |
|---|---|---|---|
| Spreadsheet/formula text | Quen với người dùng Excel, rất tự do | Khó type-check, dễ sai reference, khó version/audit, gần như đưa lỗi Excel cũ vào app | Không chọn |
| Full node canvas | Nhìn thấy dependency, phù hợp workflow kỹ thuật | Dây nối rối nhanh; khó dùng trên laptop/mobile; người mới khó biết bắt đầu từ đâu | Chỉ dùng debug/advanced graph |
| Vertical typed recipe | Đọc từ trên xuống; drag-drop đơn giản; mỗi block có input/output rõ | Ít tự do hơn code, cần thư viện block/macros đủ tốt | **Khuyến nghị làm editor chính** |

---

## 2. Information architecture đề xuất

## 2.1 Màn hình mặc định: RUN CALCULATOR

### Bước 1 - Kéo dữ liệu vào

Một vùng drop duy nhất nhận:

- Workspace JSON đã dùng lần trước.
- Excel input chuẩn.
- Các file nguồn riêng theo wizard về sau, nếu có adapter MISA/HR/CX.

Sau khi thả file, app chỉ hiện các thẻ dễ hiểu:

```text
Kỳ tính: Q1-2026
Nhân sự: 24
Jobs: 202
Đã thanh toán: 176
Chưa thanh toán: 26
Phạt cần FIN nhập: 3
```

Không bắt người dùng chọn bảng dữ liệu trước khi họ biết cần sửa gì.

### Bước 2 - Việc cần xử lý

Validation không hiện thành log kỹ thuật. Mỗi lỗi trở thành một task card có nút hành động:

```text
[Cần xử lý] Phạm A thiếu lương tháng 02/2026
Lý do: tháng này có COM target.
[Nhập lương]

[Cần xử lý] Job J-102 đang Unpaid nhưng chưa có mức phạt FIN
[Nhập phạt]

[Cảnh báo] Job J-077 được đánh New nhưng không thấy trong danh sách KH mới
[Giữ phân loại của FIN] [Sửa]
```

### Bước 3 - Tính và xuất

Một nút chính `TÍNH INCENTIVE`. Kết quả ưu tiên:

- Tổng incentive trước phạt/thuế.
- Tổng phạt.
- Tổng thuế.
- Thực nhận.
- Danh sách người và trạng thái bất thường.
- Download BK, BKê, PDF, job JSON, report JSON.

Click một người mở `Giải thích kết quả`, đọc như statement:

```text
COM Sales                         8.916.996
KAE pool                                  0
Project                                   0
Phạt unpaid                         -86.691
Thuế TNCN                          -883.031
Điều chỉnh khác                           0
Thực nhận                         7.947.274
```

Mỗi dòng có thể mở trace tới job, rule version và calculation block.

## 2.2 Chế độ nâng cao: RULE RECIPE BUILDER

Chỉ mở từ `Cài đặt nâng cao -> Cách tính`.

Layout đề xuất:

```text
┌─────────────────┬──────────────────────────────────────┬──────────────────────┐
│ BLOCK LIBRARY   │ RECIPE - đọc từ trên xuống          │ BLOCK SETTINGS       │
│ Data            │ 1. Lấy jobs của người               │ Tên: Paid GP         │
│ Filter          │ 2. Chỉ giữ Payment = Paid           │ Field: GP            │
│ Sum/Average     │ 3. Tổng GP                           │ Filter: Paid          │
│ + - x /         │ 4. 8% CỦA Tổng GP                   │ Rate: 8%              │
│ Percent of      │ 5. Làm tròn VND                      │ Source: policy        │
│ Cap/Floor       │ 6. Xuất Direct Sales Incentive      │ Example preview       │
│ Allocate        │                                      │ Validation            │
└─────────────────┴──────────────────────────────────────┴──────────────────────┘
```

Recipe là danh sách block có thể kéo thả. Dây nối chỉ xuất hiện khi một block dùng output không liền kề hoặc khi mở chế độ debug.

## 2.3 Ba mức độ tùy biến

1. **Basic:** đổi tham số và lựa chọn business bằng form: rate, target factor, basis, allocation, cap.
2. **Recipe:** thêm/reorder block từ thư viện đã duyệt.
3. **Locked macro:** waterfall Trustana, progressive tax, policy resolution và snapshot. Có thể đổi parameters/strategy nhưng không sửa code nội bộ trên UI bình thường.

Mục tiêu là 80% thay đổi chỉ cần Basic, 15% dùng Recipe, 5% cần developer thêm một block/macro mới.

---

## 3. Ngôn ngữ block có kiểu dữ liệu

## 3.1 Kiểu dữ liệu bắt buộc

| Kiểu | Ví dụ | Quy tắc |
|---|---|---|
| `Money<VND>` | doanh thu, GP, incentive | Làm tròn tại block được chỉ định |
| `Percent` | 8%, 12%, 2.5% | Lưu dạng decimal, ví dụ 0.08 |
| `Number` | 3, 1.125 | Số vô hướng |
| `Count` | số KH mới, số tháng | Không tự coi là Money |
| `Weight` | 0.5 tháng, trọng số chia pool | Mặc định trong [0,1] ở profile assignment |
| `Boolean` | Paid, có hợp đồng | Chỉ dùng cho condition/filter |
| `Date/Month/Quarter` | 2026-01, Q1-2026 | Có phép so sánh thời gian riêng |
| `Person` | employeeId | Không nối nhầm với tên text |
| `JobSet` | các job Paid của một người | Chỉ aggregate/filter, không cộng trực tiếp |
| `MoneyByLevel` | GP mức 1/2/3 | Dùng cho waterfall |

## 3.2 Chữ ký operator

| Block | Input hợp lệ | Output | Guard |
|---|---|---|---|
| `ADD` | cùng kiểu và cùng đơn vị | cùng kiểu | Không cộng Money với Percent |
| `SUBTRACT` | cùng kiểu và cùng đơn vị | cùng kiểu | Sign phải hiện rõ trong preview |
| `MULTIPLY` | Number x Number; Money x Number | Number/Money | Không dùng thay `PERCENT_OF` nếu operand là Percent |
| `DIVIDE` | Money / Number; Money / Money | Money/Ratio | Block khi mẫu số 0 |
| `PERCENT_OF` | Percent + base Money/Number | cùng kiểu với base | Bắt buộc chọn base port |
| `FILTER` | JobSet + conditions | JobSet | Field/enum phải tồn tại trong schema |
| `SUM` | JobSet + numeric field | Money/Number | Empty set = 0 và có trace |
| `IF` | Boolean + hai nhánh cùng kiểu | kiểu của nhánh | Hai nhánh khác đơn vị bị chặn |
| `MIN/MAX` | cùng kiểu | cùng kiểu | Không trộn đơn vị |
| `CAP/FLOOR` | Number/Money/Percent | cùng kiểu | Hiện cap/floor trên trace |
| `ROUND_VND` | Money<VND> | Money<VND> | Mode cố định `Math.round` trừ khi policy thêm mode |
| `ALLOCATE` | Pool Money + participants + mode | Money per person | Tổng allocation phải reconcile pool |
| `WATERFALL` | MoneyByLevel + target + rates | Money | Macro stateful, có trace từng level |

## 3.3 Rule JSON - không lưu formula string

Ví dụ Direct Sales 8%:

```json
{
  "id": "DIRECT_SALES_8",
  "scope": "PER_PERSON_PER_QUARTER",
  "appliesToProfile": "DIRECT_SALES_8",
  "nodes": [
    { "id": "jobs", "type": "SOURCE_JOBS" },
    { "id": "paid", "type": "FILTER", "input": "jobs", "where": [{ "field": "paymentStatus", "op": "EQ", "value": "Paid" }] },
    { "id": "gp", "type": "SUM", "input": "paid", "field": "gpEligible" },
    { "id": "award", "type": "PERCENT_OF", "percentParam": "directSales.rate", "base": "gp" },
    { "id": "rounded", "type": "ROUND_VND", "input": "award" }
  ],
  "output": "rounded"
}
```

Engine validate schema, type-check, phát hiện cycle, topological-sort rồi chạy registry function tương ứng. Không compile chuỗi, không `new Function`, không `eval`.

---

## 4. Lý thuyết nền tảng của app

Đây là các nguyên tắc phải giữ dù UI thay đổi hoàn toàn.

### F1. Data khác Policy khác Derived khác Override

- **Data:** sự thật của kỳ tính: nhân sự, lương theo thời gian, job, revenue/cost, Paid/Unpaid, KAE/KH mới, payroll, penalty FIN nhập.
- **Policy:** luật có version: đối tượng áp dụng, rate, target, routing, allocation và tax mode.
- **Derived:** app tự tính: GP, target, level, waterfall, pool, tax, net pay.
- **Override:** ngoại lệ theo người/job/kỳ, phải có lý do; không tự biến thành policy toàn công ty.

### F2. Canonical model độc lập nguồn nhập

Excel cũ, form nhập trực tiếp và Workspace JSON phải cùng chuyển thành một canonical calculation context. Engine không biết dữ liệu đến từ đâu.

### F3. Tính theo component/bucket rồi mới cộng về người

Một người có thể có COM 0.5 + KAE 0.5 hoặc nhiều project. Target COM chỉ đánh vào COM component; KAE/direct/project không bị kéo vào target.

### F4. Assignment là time-weighted

Profile assignment có hiệu lực theo tháng và weight. Tổng cùng một profile trong tháng được cap 1. Việc chuyển role phải được thể hiện bằng weights, không sửa lịch sử nhân sự cũ.

### F5. Policy bất biến theo quý

Policy lifecycle `DRAFT -> ACTIVE -> INACTIVE`. Policy mới chỉ áp từ đầu quý tương lai. Report cũ rerun bằng input/policy snapshot cũ.

### F6. Rule-aware requirements

Không có danh sách required field toàn cục. Chỉ rule đang active mới được yêu cầu input. Ví dụ KAE không dùng salary target thì không được block vì thiếu gross salary.

### F7. Deterministic, integer VND và traceable

Cùng input + policy snapshot phải ra cùng output. Tiền dùng integer VND. Mọi phép làm tròn, cap, floor, filter và allocation phải xuất trace.

### F8. Source workbook là bằng chứng, không phải executable truth

Workbook cũ có `#REF!`, external links, hardcode và formula thử nghiệm. Dùng nó để hiểu intent và đối chiếu output, không copy công thức hỏng sang engine.

### F9. Validation trước calculation

Không cho tính khi thiếu dữ liệu bắt buộc, unknown employee, duplicate job, policy invalid, weight invalid hoặc allocation không reconcile. Warning không chặn phải cho người dùng quyết định rõ.

### F10. Output phải giải thích được

Mọi số ở BK/BKê/PDF/Dashboard phải truy ngược được tới person component -> rule block -> job/input -> policy version.

---

## 5. Quy ước trạng thái trong formula catalog

| Mã | Ý nghĩa |
|---|---|
| `V2` | Quyết định mới nhất trong Blueprint v2/current canonical direction |
| `XLS` | Hành vi hoặc formula trong workbook Q1 |
| `V1` | Hành vi trong theory/Blueprint v1 trước discovery v2 |
| `CODE` | Hành vi engine hiện đang triển khai |
| `REVIEW` | Có khác biệt nguồn hoặc cần Chairman/Claude xác nhận lại |

Nguồn đã đối chiếu:

- `docs/2026Q1_Incentive- (TEST) - Copy.xlsx` - 13 sheets.
- `docs/theory/HIEN-TRANG_Quy-tac-tinh-Incentive_v2.md`.
- `docs/spec/BLUEPRINT_v1.md` - lịch sử đã đóng, không sửa.
- `docs/spec/BLUEPRINT_v2_Config-Studio.md`.
- `config/default.json`.
- `js/engine/common.js`, `enrich.js`, `classify.js`, `commission.js`, `penalty.js`, `tax.js`.
- `js/engine/policy.js`, `profiles.js`, `calculator.js`, `workspace.js`, `validate.js`.
- `test/golden/RECONCILIATION.md`, `test/blueprint_v2.test.js`.
- Các REPORT trước trong `handoff/audit.md`.

Formula inventory cũ đã ghi nhận: 1,443 formula ở `job quy (5)`, 126 ở `KQ Sale. (7)`, 53 ở `KQ.KAE (8)`, 31 ở `KQ. Sale khác (9)` và 65 ở `BK 10`. Các formula lặp được gom thành pattern dưới đây.

---

## 6. Formula catalog - canonical/business rules

## 6.1 Cost và GP per job

### Công thức V2/CODE

```text
costWithoutCom    = inputCost - com
comSmsGrossedUp   = roundVnd(com x comSmsFactor)
noInvoiceTaxCost  = noInvoiceCost x noInvoiceTaxRate
finalCost         = roundVnd(costWithoutCom + comSmsGrossedUp + noInvoiceTaxCost)
gp                = roundVnd(revenue - finalCost)
```

Default:

```text
comSmsFactor      = 1.125
noInvoiceTaxRate  = 20%
```

Giải nghĩa lịch sử:

```text
1.125 = 0.9 / 0.8
```

Tiền PM SMS được coi là số sau thuế 10%, sau đó gross-up về cơ sở chi phí bằng tỷ lệ 0.9/0.8. Chi phí không hóa đơn cộng thêm 20% gross-up thuế TNDN.

`REVIEW`: công thức `inputCost - com` chỉ đúng khi inputCost đã bao gồm COM. Blueprint v2 đã chọn cách này; workbook/template lịch sử từng có dấu hiệu input cost chưa bao gồm COM. Recipe phải đặt đây là một strategy có label rõ, không giấu trong phép trừ.

Block đề xuất:

```text
[NORMALIZE COST - input includes COM]
[PERCENT OF - COM x 112.5%]
[PERCENT OF - No-invoice cost x 20%]
[SUBTRACT - Revenue - Final cost]
```

## 6.2 Payment eligibility

### V2/CODE - binary

```text
paid       = paymentStatus == "Paid"
gpEligible = paid ? gp : 0
```

Nguồn Paid/Unpaid là MISA/FIN. Thiếu dù 1 đồng vẫn là `Unpaid`. App không tự suy luận partial payment hoặc aging.

### V1/historical partial-payment formula

```text
partialPaid = paymentStatus != Paid AND paidAmount > 0
gpTinh      = Paid ? gp :
              partialPaid AND revenue > 0
                ? roundVnd(gp x paidAmount / revenue)
                : 0
```

`REVIEW`: đây là conflict lịch sử. Blueprint v2 đã thay bằng binary, nhưng review packet giữ công thức cũ để Claude thấy đầy đủ nguồn gốc.

## 6.3 Job routing và level

### V2/CODE

```text
General   -> Level 2
KAE Admin -> Level 1 + kaePoolGroup admin
KAE Sale  -> Level 1 + kaePoolGroup sale
New       -> Level 3
New không hợp đồng hoặc ngoài cửa sổ 6 tháng -> fallback Level 2
```

Eligibility window:

```text
monthDiff = (jobYear - contractYear) x 12 + jobMonth - contractMonth
eligibleNew = hasContract AND 0 <= monthDiff <= 5
```

Classification input/override của FIN là route chính. Master KAE/KH mới dùng cross-check và warning.

### XLS representative formulas

```excel
=IFNA(IF(VLOOKUP(customer,'List KAE (2)'!D:I,2,0)=1,"Mức 1",""),"")
=IFNA(IF(VLOOKUP(customer,'KH mới từ Q1(3)'!C:F,4,0)="6 tháng","Mức 3",""),"")
=IFERROR(IF(OR(level1="mức 1",level3="mức 3"),"","Mức 2"),"")
=IF(level1<>"",level1,IF(level3<>"",level3,level2))
```

## 6.4 Calculation profile weight

```text
profileWeight(person, profile, month)
  = clamp(sum(active assignment weights), 0, 1)

componentGp(job, profile)
  = roundVnd(job.gpEligible x profileWeight(person, profile, job.month))
```

Base profiles hiện có:

```text
COM_SALES_OFFICIAL
COM_MANAGER
KAE_POOL_ELIGIBLE
DIRECT_SALES_8
PROJECT_PARTICIPANT
NO_INCENTIVE
```

Ví dụ KAE 0.5 + COM 0.5: KAE nhận half share, COM target và job component chỉ nhận 0.5.

## 6.5 COM target

```text
monthlyTarget(person, month)
  = roundVnd(grossSalaryEffectiveAtMonthEnd x targetFactor x COM_month_weight)

quarterTarget
  = sum(monthlyTarget for active COM months)
```

Default:

```text
targetFactor = 3
```

Gross salary chỉ required cho tháng có COM weight > 0.

## 6.6 KPI B2 - khách hàng mới

```text
b2Target
  = sum(COM active month weights) x b2TargetPerActiveMonth

b2Achieved
  = count(unique eligible organization customers owned by person)

b2AdjustmentRaw
  = (b2Achieved - b2Target) x b2AdjustmentPerCustomer

b2Adjustment
  = min(b2AdjustmentRaw, b2PositiveCap)
```

Default:

```text
b2TargetPerActiveMonth    = 1 customer
b2AdjustmentPerCustomer  = 1%
b2PositiveCap             = +3%
b2AppliesToLevels         = [2, 3]
```

Không có negative cap riêng; với target 3 và achieved 0, floor tự nhiên là -3%.

Eligible B2 customer hiện tại:

```text
ownerEmployeeId matches person
AND organization type
AND eligibleForB2 != false
AND hasContract != false
AND unique by normalized SMS/customer name
```

## 6.7 COM waterfall Trustana

Đây là **macro stateful**, không nên bắt người dùng tự nối bằng các block cộng/trừ cơ bản.

Input:

```text
gpByLevel = {1: paid weighted GP Level 1,
             2: paid weighted GP Level 2,
             3: paid weighted GP Level 3}
target
baseRates = {1: 8%, 2: 12%, 3: 17%}
b2Adjustment applied to Level 2/3
order = [1,2,3]
```

CODE/XLS-compatible algorithm:

```text
remainingTarget = target
priorAwarded = false
total = 0

for level in [1,2,3]:
  gp = gpByLevel[level]

  if level == 1:
      excess = max(0, gp - remainingTarget)
  else if priorAwarded:
      excess = max(0, gp)
  else if level == 2:
      excess = max(0, gp - remainingTarget)
  else:
      excess = max(0, gp - target)

  remainingTarget = max(0, remainingTarget - gp)
  rate = baseRate[level] + (level in [2,3] ? b2Adjustment : 0)
  amount = roundVnd(excess x rate)
  if amount > 0: priorAwarded = true
  total += amount
```

Default rates:

```text
Level 1 = 8%
Level 2 = 12% + B2 adjustment
Level 3 = 17% + B2 adjustment
```

`REVIEW`: Blueprint v1 từng diễn giải giản lược mọi level bằng `excess=max(0,gp-remainingTarget)`. Formula XLS và CODE hiện tại có nhánh đặc biệt ở Level 3: nếu chưa level nào tạo thưởng, Level 3 trừ toàn target thay vì remaining target. Cần Claude xác nhận giữ đúng behavior XLS hay đổi thành waterfall thuần; không nên để sự khác biệt này ẩn trong macro.

### XLS representative formulas

```excel
Level1Award = IF(GP1-Target>0,(GP1-Target)*8%,0)

Level2Award = IFS(
  Level1Award>0, GP2*(12%+adj),
  GP2-(Target-GP1)>0, (GP2-(Target-GP1))*(12%+adj),
  GP2-(Target-GP1)<0, 0
)

Level3Award = IFS(
  Level2Award>0, GP3*(17%+adj),
  GP3-GP2-GP1-(Target-GP1-GP2)>0,
    (GP3-GP2-GP1-(Target-GP1-GP2))*(17%+adj),
  otherwise, 0
)

TotalCOM = SUM(Level1Award:Level3Award)
```

## 6.8 Manager reward

```text
members       = COM members in same team, excluding manager
teamGp        = sum(member GP Level 1 + Level 2 + Level 3)
teamTarget    = sum(member COM target)
missingB2     = sum(max(0, memberB2Target - memberB2Achieved))
managerRate   = baseRate - min(missingB2 x missingB2Reduction, maxReduction)
managerBase   = roundVnd(teamGp - teamTarget)
managerReward = roundVnd(max(0, managerBase) x managerRate)
```

Default:

```text
baseRate             = 2.4%
missingB2Reduction   = 0.2% per missing target
maxReduction         = 0.6%
excludeManager       = true
```

XLS Q1 có formula chết/hardcode:

```excel
=(2.4%-2.4%)*(SUM(teamTarget)-SUM(teamPaidGp))
```

Formula đó tạo 0 và không được coi là rule chuẩn.

## 6.9 KAE/KAM monthly pool

```text
adminGp(month) = sum(Paid GP where kaePoolGroup=admin)
saleGp(month)  = sum(Paid GP where kaePoolGroup=sale)

grossPool(month)
  = roundVnd(adminGp x adminRate + saleGp x saleRate)
```

Default:

```text
adminRate = 5%
saleRate  = 2%
kpiGate   = false
allocationMode = weighted_equal
```

Penalty mode `before_pool`:

```text
distributablePool = roundVnd(grossPool - teamPenalty)
grossShare_i      = roundVnd(distributablePool x weight_i / totalWeight)
penaltyShare_i    = 0
amount_i          = grossShare_i
```

Penalty mode `after_allocation`:

```text
grossShare_i   = roundVnd(grossPool x weight_i / totalWeight)
penaltyShare_i = roundVnd(teamPenalty x weight_i / totalWeight)
amount_i       = roundVnd(grossShare_i - penaltyShare_i)
```

Weight theo người/tháng:

```text
personWeight = clamp(sum(KAE assignments),0,1)
totalWeight  = sum(personWeight of eligible people)
```

Product và CX dùng chung pool. CX 0.5 + Product 0.5 = một full KAE weight 1. Nghỉ giữa quý giữ share các tháng đã làm.

### XLS representative formulas

```excel
MonthlyPool = KAE_Admin_GP*5% + KAE_Sale_GP*2%
FullShare   = MonthlyPool / activeHeadcount
HalfMonth   = (MonthlyPool / activeHeadcount) / 2
TeamPenaltyShare = TeamPenalty / teamHeadcount
```

Workbook lịch sử cũng từng có KPI gate 40/30/30. Blueprint v2 đã chọn `kpiGate=false`; catalog vẫn giữ dấu vết này để reviewer biết tại sao macro có field `kpiGate`.

## 6.10 Direct Sales / BO / thử việc

```text
directPaidGp
  = sum(roundVnd(job.gpEligible x DIRECT_SALES_8 month weight))

directIncentive
  = roundVnd(directPaidGp x directRate)
```

Default:

```text
directRate = 8%
target = none
```

Paid GP âm vẫn tham gia tổng, tức job lỗ kéo giảm pool thưởng. Chuyển thử việc sang chính thức dùng month weights để chia DIRECT/COM.

### XLS representative formula

```excel
=ROUND(PaidProfit * 8%,0)
```

## 6.11 Project Incentive framework

Basis:

```text
paidRevenue -> basis per job = revenue của job Paid
paidGp      -> basis per job = gpEligible của job Paid
fixedPool   -> basis/pool = configured fixedPool
```

Pool:

```text
projectPool = fixedPool mode
                ? roundVnd(fixedPool)
                : roundVnd(sum(basis) x projectRate)
```

Allocation `individual`:

```text
personAmount = roundVnd(personBasis x projectRate)
```

Allocation `equal`:

```text
personAmount = participantCount > 0
                 ? roundVnd(projectPool / participantCount)
                 : 0
```

Allocation `weighted`:

```text
personAmount = totalWeight > 0
                 ? roundVnd(projectPool x personWeight / totalWeight)
                 : 0
```

Allocation `manual`:

```text
personAmount = roundVnd(manualAmount)
```

Stack mode:

```text
stack     -> project component cộng thêm vào component thông thường
exclusive -> job project bị loại khỏi COM/Direct/KAE component
```

Spring default V2:

```text
code           = SPRING
basis          = paidRevenue
rate           = 2.5%
allocationMode = individual
stackMode      = stack
```

V1 từng chia đều một pool Spring cho danh sách người. Blueprint v2 đổi default sang individual nhưng vẫn hỗ trợ equal/weighted/manual.

## 6.12 Penalty

### V2/CODE - FIN nhập số cuối cùng

```text
Unpaid job penalty = roundVnd(job.penaltyAmount)
Manual penalty     = roundVnd(penalty.amount)
Person penalty     = sum(all individual penalty lines)
Team KAE penalty   = sum(lines with shareTo=TEAM_KAE)
```

Unpaid job có `gpEligible=0`. Engine không tự tính invoice balance, aging hoặc partial payment.

### XLS/V1 - formula lịch sử

```text
invoiceWithVat = revenue x vatFactor
unpaidPenalty  = roundVnd(invoiceWithVat x penaltyRate x unpaidMonths)
```

Default lịch sử:

```text
vatFactor   = 1.08
penaltyRate = 1% per month
```

XLS exact patterns:

```excel
=C27*1.08
=D27*H27*1%
=ROUND(SUMPRODUCT((employeeRange=employee)*invoiceVatRange*1%*unpaidMonthRange),0)
```

V1 từng suy ra:

```text
unpaidMonths = max(1, lastQuarterMonth - jobMonth + 1)
```

`REVIEW`: V2 đã bỏ phép suy ra này và chọn penaltyAmount do FIN nhập. Formula cũ phải tồn tại như một optional `Suggested penalty` recipe nếu sau này muốn hỗ trợ, không được tự động trở lại thành số trừ chính thức.

Bad debt:

```text
badDebtPenalty = FIN-entered provision amount
```

Case Vinh Giang trong workbook:

```excel
=ROUND(baseProvision*50%,0)
```

Đây là case-specific provision, không phải global constant.

## 6.13 Tax

### Common taxable income

```text
taxableIncome
  = max(0,
      incentiveBeforeTax
      + payrollTaxableIncome
      - socialInsurance
      - familyDeduction)
```

### Progressive candidates

```text
candidate_i = taxableIncome x progressiveRate_i - quickDeduction_i
progressiveTotalTax = roundVnd(max(0, all candidate_i))
```

Default table theo BK Q1:

| i | Rate | Quick deduction |
|---|---:|---:|
| 1 | 5% | 0 |
| 2 | 10% | 500,000 |
| 3 | 20% | 3,500,000 |
| 4 | 30% | 9,500,000 |
| 5 | 35% | 14,500,000 |

Mode `PROGRESSIVE`:

```text
totalTax      = progressiveTotalTax
taxOnIncentive = max(0, totalTax - payrollTaxPaid)
```

Mode `FLAT_RATE`:

```text
totalTax       = roundVnd(taxableIncome x flatRate)
taxOnIncentive = max(0, totalTax - payrollTaxPaid)
```

Mode `PROGRESSIVE_WITH_FLAT_FALLBACK` - CODE:

```text
if familyDeduction > 0:
    totalTax       = progressiveTotalTax
    taxOnIncentive = max(0,totalTax-payrollTaxPaid)
else:
    taxOnIncentive = roundVnd(incentiveBeforeTax x flatRate)
    totalTax       = payrollTaxPaid + taxOnIncentive
```

Mode `MANUAL`:

```text
taxOnIncentive = max(0, roundVnd(manualTaxOnIncentive))
```

Mode `DISABLED`:

```text
taxOnIncentive = 0
```

Adjustment cuối:

```text
taxOnIncentive = max(0, roundVnd(taxOnIncentive + taxAdjustment))
totalTax       = roundVnd(payrollTaxPaid + taxOnIncentive)
```

### BK 10 exact formula

```excel
Taxable = IF(SUM(D:F)-G-H>0,SUM(D:F)-G-H,0)
Tax = ROUND(
        IF(H>0,
           MAX(Taxable*{5,10,20,30,35}%-{0,500000,3500000,9500000,14500000},0),
           Taxable*10%),
        0)
```

`REVIEW`: nhánh flat của BK dùng `Taxable x 10%`; CODE v2 hiện dùng `incentiveBeforeTax x 10%`. Hai số chỉ giống nhau khi không có payroll taxable income/BHXH liên quan. Đây là một decision cần Claude/FIN xác nhận rõ trong rule macro.

Workbook còn có các manual adjustments tax hardcode ở một số dòng, ví dụ trừ 86,109 hoặc 116,773. Các khoản này phải là `taxAdjustment` có lý do, không nằm trong formula toàn cục.

## 6.14 Assemble gross, penalty, tax và net pay

```text
grossIncentive
  = roundVnd(
      salesIncentive
      + managerReward
      + kaePoolIncentive
      + directSalesIncentive
      + projectIncentive)

incentiveBeforeTax
  = max(0, roundVnd(grossIncentive - penalty))

netPay
  = roundVnd(max(0,
      incentiveBeforeTax
      - taxOnIncentive
      + otherAdjustment))
```

Company totals:

```text
totalGross   = sum(person.grossIncentive)
totalPenalty = sum(person.penalty)
totalTax     = sum(person.taxOnIncentive)
totalNetPay  = sum(person.netPay)
peoplePaid   = count(person.netPay > 0)
```

### XLS/BK representative formulas

```excel
RemainingTax = TaxTotal - TaxPayroll - OtherTax
NetPaid      = ROUND(Incentive - RemainingTax + OtherAdjustment,0)
```

### XLS/BKê representative formulas

```excel
GrossDetail   = SUM(component rows)
AfterTaxBase  = GrossDetail - TaxFromBK
NetDetail     = ROUND(AfterTaxBase - OtherDeductionFromBK,0)
```

Broken `#REF!` lookups trong BKê là source defects, không phải formula specification.

## 6.15 Workbook aggregation và reconciliation formulas

Các công thức dưới đây không phải policy độc lập; chúng là cách workbook gom dữ liệu và tự kiểm tra. Recipe engine vẫn cần chức năng tương đương để trace/reconcile.

### `job quy (5)`

```excel
TotalRevenueVisible = SUBTOTAL(9,RevenueRange)
TotalGpVisible      = SUBTOTAL(9,GpRange)
TrimmedJobNo        = TRIM(JobNo)
CheckDifference     = SourceValue - CopiedValue
```

### `KQ Sale. (7)` per person

```excel
RevenueTotal = SUMIF(JobSalesRange,Person,JobRevenueRange)

CostTotal = SUMIF(JobSalesRange,Person,JobBaseCostRange)
          + SUMIF(JobSalesRange,Person,JobComSmsRange)
          + SUMIF(JobSalesRange,Person,JobNoInvoiceCostRange)

ProfitTotal = RevenueTotal - CostTotal - OtherCost

MonthGp = SUMIFS(JobGpRange,
                 JobSalesRange,Person,
                 JobMonthRange,SelectedMonth)

PaidGp = SUMIFS(JobGpRange,
                JobSalesRange,Person,
                JobPaymentRange,"Paid")

UnpaidGp = ProfitTotal - PaidGp

Target = VLOOKUP(Person,SalaryTable,TargetColumn,0)

LevelGp = SUMIFS(JobGpRange,
                 JobLevelRange,SelectedLevel,
                 JobSalesRange,Person,
                 JobPaymentRange,"Paid")

KpiB1Status = IF(PaidGp>Target,"Achieved","Failed")
GrossComIncentive = SUM(Level1Award:Level3Award)
PenaltySigned = -IFNA(VLOOKUP(Person,PenaltyTable,PenaltyColumn,0),0)
NetBeforeTaxFloor = IF(GrossComIncentive+ManagerReward<-PenaltySigned,
                       0,
                       GrossComIncentive+ManagerReward+PenaltySigned)
```

Workbook còn có reconciliation block:

```excel
ExpectedLevel23 = Level2Excess*AdjustedLevel2Rate + Level3Gp*AdjustedLevel3Rate
WaterfallDifference = ActualWaterfall - ExpectedLevel23
PaidGpCheck = SUM(Level1Gp:Level3Gp) == PaidGp
```

### `KQ.KAE (8)`

```excel
RevenueTotal = SUMIF(JobOwnerRange,GroupOrPerson,JobRevenueRange)
CostTotal    = SUMIF(...BaseCost) + SUMIF(...ComSms) + SUMIF(...NoInvoiceCost)
ProfitTotal  = RevenueTotal - CostTotal - OtherCost
PaidGp       = SUMIFS(JobGpRange,OwnerRange,GroupOrPerson,PaymentRange,"Paid")
UnpaidGp     = ProfitTotal - PaidGp

AdminPoolMonth = AdminPaidGpMonth*5%
SalePoolMonth  = SalePaidGpMonth*2%
PoolMonth      = AdminPoolMonth + SalePoolMonth

PersonMonthShare = PoolMonth / ActiveWeightDenominator
HalfMonthShare   = PersonMonthShare / 2
PersonQuarterKae = SUM(PersonMonthShares) - PersonPenalty + OtherAdjustment
```

### `KQ. Sale khác (9)`

```excel
RevenueTotal = SUMIF(JobSalesRange,Person,JobRevenueRange)
CostTotal    = SUMIF(...BaseCost) + SUMIF(...ComSms) + SUMIF(...NoInvoiceCost)
ProfitTotal  = RevenueTotal - CostTotal - OtherCost
MonthGp      = SUMIFS(JobGpRange,JobSalesRange,Person,JobMonthRange,Month)
PaidGp       = SUMIFS(JobGpRange,JobSalesRange,Person,JobPaymentRange,"Paid")
UnpaidGp     = ProfitTotal - PaidGp
DirectAward = ROUND(PaidGp*DirectRate,0)
```

### `Phạt (6)`

```excel
ProvisionShare     = ROUND(ProvisionBase*50%,0)
InvoiceIncludingVat = InvoiceRevenue*1.08
UnpaidPenaltyLine   = InvoiceIncludingVat*UnpaidMonths*1%
PersonUnpaidPenalty = ROUND(SUMPRODUCT(PersonMatch*InvoiceIncludingVat*1%*UnpaidMonths),0)
PersonPenaltyTotal  = Provision + UnpaidPenalty + ManualAdjustment
```

### `BK 10`

```excel
TaxableIncome = MAX(0,Incentive+PayrollTaxableItems-SocialInsurance-FamilyDeduction)
TaxTotal      = IF(FamilyDeduction>0,
                   ROUND(MAX(TaxableIncome*Rates-QuickDeductions,0),0),
                   ROUND(TaxableIncome*10%,0))
RemainingTax  = TaxTotal-PayrollTaxPaid-OtherTaxPaid
NetPaid       = ROUND(Incentive-RemainingTax+OtherAdjustment,0)
```

BK group checks:

```excel
ComDifference    = ComSourceTotal - ComBkTotal
KaeDifference    = KaeSourceTotal - KaeBkTotal
DirectDifference = DirectSourceTotal - DirectBkTotal
CompanyDifference = CompanySourceTotal - CompanyBkTotal
```

### `BKê-COM / Bkê-Khac / Bkê-BO`

```excel
ComponentTotal = SUM(ComponentRows)
TaxFromBk      = lookup(BK,Person,RemainingTax)
OtherFromBk    = lookup(BK,Person,OtherDeduction)
NetStatement   = ROUND(ComponentTotal-TaxFromBk-OtherFromBk,0)
```

Các `#REF!`, external links như `'[1]Q1'!…` và manual constants trong các sheet này phải được thay bằng canonical IDs/explicit adjustments; không được đưa nguyên chuỗi vào recipe.

---

## 7. Parameter catalog hiện có

| Rule path / legacy key | Default | Ý nghĩa |
|---|---:|---|
| `cost.comSmsFactor` / `he_so_com_sms` | 1.125 | Gross-up COM SMS |
| `cost.noInvoiceTaxRate` / `tndn_gross_up` | 20% | CP không hóa đơn |
| `comSales.targetFactor` / `he_so_target` | 3 | Target mỗi tháng so với gross salary |
| `comSales.rates.1` | 8% | Level 1 |
| `comSales.rates.2` | 12% | Level 2 |
| `comSales.rates.3` | 17% | Level 3 |
| `comSales.b2TargetPerActiveMonth` | 1 | KH mới/tháng active |
| `comSales.b2AdjustmentPerCustomer` | 1% | Điều chỉnh mỗi KH chênh lệch |
| `comSales.b2PositiveCap` | 3% | Cap cộng |
| `manager.baseRate` | 2.4% | Rate trưởng BP |
| `manager.missingB2Reduction` | 0.2% | Trừ mỗi B2 thiếu |
| `manager.maxReduction` | 0.6% | Cap trừ rate manager |
| `kaePool.adminRate` | 5% | KAE Admin pool |
| `kaePool.saleRate` | 2% | KAE Sale pool |
| `kaePool.penaltyMode` | before_pool | Cách trừ team penalty |
| `directSales.rate` | 8% | BO/thử việc/direct |
| `project.rate` Spring | 2.5% | Paid revenue project |
| `tax.flatRate` | 10% | Flat tax/fallback |
| `tax.progressiveRates` | 5/10/20/30/35% | BK progressive candidates |
| `tax.quickDeductions` | 0/0.5/3.5/9.5/14.5m | BK quick deductions |
| legacy `vat` | 1.08 | VAT factor phạt tự suy ra, historical |
| legacy `phat_rate` | 1% | Phạt unpaid/tháng, historical |

Mọi parameter trên cần metadata:

```text
label tiếng Việt
unit
valid range
source/owner
effective policy version
example calculation
whether editable in Basic or Advanced mode
```

---

## 8. Data catalog và dependency theory

## 8.1 Inputs/facts

- Employee identity, team, status.
- Salary history by `effectiveFrom`.
- Profile assignments by month/weight.
- Job facts: owner, month, customer, revenue, cost, COM, no-invoice cost, classification, payment status, project.
- KAE master/history and new-customer contract facts for cross-check.
- FIN-entered penalties/bad-debt/manual adjustments.
- Payroll taxable income, social insurance, family deduction, payroll tax paid, tax/manual adjustments.
- Project definitions and participants.

## 8.2 Derived values

- Normalized cost, GP, paid GP.
- Level and routing trace.
- COM target, B2 target/achieved/adjustment.
- Waterfall excess/rate/award per level.
- Manager base/rate/reward.
- KAE monthly pool/weights/shares.
- Direct/project incentive.
- Penalty/tax/net pay.

## 8.3 Workbook dependency map

```text
KAE trước (1) -> List KAE (2) -> job quy (5)
KH mới từ Q1(3) -------------> job quy (5)
lương (4) -------------------> KQ Sale. (7) target
job quy (5) -----------------> KQ Sale. (7)
                             -> KQ.KAE (8)
                             -> KQ. Sale khác (9)
Phạt (6) --------------------> KQ Sale. (7) / KQ.KAE (8)
KQ outputs ------------------> BK 10
BK 10 -----------------------> BKê-COM / Bkê-Khac / Bkê-BO
```

Trong app mới, dependency này phải được biểu diễn bằng data lineage/trace, không bằng vị trí sheet.

---

## 9. Safety, validation và audit cho Rule Builder

### 9.1 Chặn khi save/activate recipe

- Unknown block type hoặc unknown field.
- Type/unit mismatch.
- Missing required input port.
- Divide by zero có thể xác định trước hoặc không có zero guard.
- Cycle trong graph.
- Output không phải Money cho incentive rule.
- Filter không giới hạn đúng scope person/month/quarter.
- Allocation total không reconcile pool ngoài tolerance rounding.
- Profile weights không hợp lệ.
- Percent ngoài configured safe range nếu policy đặt guard.
- Rule không có example test.
- Active policy bị sửa trực tiếp.

### 9.2 Preview bắt buộc

Mỗi thay đổi rule phải chạy ba preview:

1. Ví dụ nhỏ do block/template cung cấp.
2. Quarter snapshot gần nhất.
3. Diff với policy ACTIVE hiện tại: tổng công ty và top người thay đổi.

### 9.3 Activation gate

Một DRAFT chỉ activate khi:

- Schema/type validation pass.
- Không có cycle.
- Example tests pass.
- Regression snapshot chạy xong.
- Reviewer thấy diff.
- `appliesFromQuarter` là quý tương lai.

### 9.4 Trace format

Mỗi node ghi:

```json
{
  "nodeId": "award",
  "blockType": "PERCENT_OF",
  "inputs": { "percent": 0.08, "base": 1000000 },
  "output": 80000,
  "rounding": "VND_HALF_UP",
  "sourceRows": ["JOB-123", "JOB-124"]
}
```

---

## 10. Những điểm cần Chairman + Claude review

### Quyết định sản phẩm

1. Chấp thuận tách `RUN CALCULATOR` và `RULE RECIPE BUILDER` hay vẫn muốn một màn hình duy nhất?
2. Chấp thuận vertical recipe là editor chính, graph chỉ dùng debug, hay muốn full node canvas?
3. Ai được sửa recipe/activate policy: FIN, Finance Manager hay chỉ admin?
4. Có cần khóa các macro `Waterfall`, `Tax`, `Policy lifecycle`, chỉ cho chỉnh parameters không?

### Quyết định formula

5. COM waterfall giữ đúng nhánh Level 3 của XLS/CODE hay đổi sang waterfall thuần theo remaining target?
6. Tax flat fallback dùng `taxableIncome x 10%` như BK hay `incentiveBeforeTax x 10%` như CODE v2?
7. Binary Paid/Unpaid của Blueprint v2 có giữ tuyệt đối không, hay cần optional partial-paid strategy?
8. `inputCost includes COM` có phải invariant của mọi input adapter hay là setting theo data source?
9. Penalty unpaid luôn FIN nhập số cuối cùng hay app được hiển thị suggested penalty theo formula lịch sử?
10. Manager base có floor 0 trước khi nhân rate hay để negative component rồi floor ở final person?
11. Manual project allocation có bắt buộc tổng manual = project pool không? Nếu không bằng, phần chênh xử lý thế nào?
12. Negative Direct/Project/KAE component có được giảm các component khác trước final floor không?

### Quyết định migration

13. Blueprint v2 hiện đã implement phần lớn nhưng browser `file://` QA chưa đóng. Có tiếp tục hoàn thiện v2 rồi refactor UI, hay đóng băng current source và làm v3 trực tiếp?
14. Workspace JSON schema v2 có migrate rule templates sang recipe graph, hay giữ v2 policy làm source rồi compile sang graph nội bộ?

---

## 11. Recommendation kỹ thuật

Khuyến nghị không vứt engine deterministic hiện tại. Làm lớp mới theo hướng:

```text
Simple Run UI
  -> Canonical Workspace v2/v3
  -> Versioned Rule Recipe JSON
  -> Validator + Typed Rule Compiler
  -> Existing deterministic block registry / domain macros
  -> Calculation trace
  -> Existing BK/BKê/PDF/JSON/Dashboard outputs
```

### 11.1 Cần hợp nhất executable truth trước khi mở editor

Repo hiện còn hai lớp formula:

- `calculator.js` là canonical v2 path đang được `runCalculation` gọi.
- `enrich.js / commission.js / penalty.js / calculateTaxOnIncentive` là helper v1 được giữ làm historical reference; phần assemble v1 phía dưới `return` không còn reachable.

Test suite vẫn test trực tiếp một số helper v1, nên có thể đồng thời pass hai behavior mâu thuẫn, ví dụ partial-paid proration và binary payment, hoặc family-deduction-zero tax = 0 và canonical flat fallback. Trước khi Recipe Builder trở thành source of truth, phải:

1. Chỉ còn một executable block registry.
2. Chuyển formula lịch sử sang fixtures/documentation, không để dưới dạng code có thể bị gọi nhầm.
3. Viết contract tests theo policy version thay vì theo tên module legacy/v2.
4. Mọi recipe migration phải chỉ rõ formula version nào được chọn.

Migration an toàn:

1. Định nghĩa block types và recipe schema.
2. Biểu diễn từng rule hiện tại thành recipe/macro tương đương.
3. Chạy golden/regression để chứng minh không đổi số.
4. Làm Run UI mới dùng engine cũ/compiled recipes.
5. Sau khi Run UI ổn mới mở Recipe Builder.

Không khuyến nghị viết canvas trước engine schema. Nếu làm UI drag-drop trước, ta sẽ khóa kiến trúc vào hình vẽ và rất khó test deterministically.

---

## 12. Acceptance criteria đề xuất cho Blueprint v3

1. Người mới mở app, kéo sample JSON/Excel, tính và tải BK mà không vào Data/Policy/Assignment tables.
2. Mọi validation error có một hành động sửa trực tiếp bằng ngôn ngữ nghiệp vụ.
3. User tạo được `8% of Paid GP`, `2.5% of Paid Revenue`, `Pool x Weight / TotalWeight` bằng drag-drop.
4. Block `%` không save được nếu chưa chọn base.
5. Type checker chặn Money + Percent, divide-by-zero, missing input và cycle.
6. Các macro COM waterfall, KAE pool, tax và final net tạo trace node-by-node.
7. Import policy v2 -> recipe v3 cho cùng input phải giữ nguyên kết quả ở các rule không chủ ý đổi.
8. DRAFT diff hiển thị ảnh hưởng trước activation; ACTIVE không sửa trực tiếp.
9. Report lưu immutable input, policy và recipe snapshot.
10. BK, BKê, PDF, job/report JSON và Dashboard không regression.
11. Offline `file://`, không network, không arbitrary code execution.
12. Desktop/mobile không overflow; keyboard có thể add/move/configure block mà không bắt buộc drag chuột.

---

## 13. Out of scope của vòng review này

- Chưa sửa UI/source engine.
- Chưa rebuild `dist`.
- Chưa chọn thư viện drag-drop.
- Chưa thay Blueprint v1 hoặc Blueprint v2.
- Chưa coi proposal này là policy đã duyệt.
- Chưa đóng các formula conflicts ở mục 10.

---

## 14. Kết luận cho reviewer

Hướng phù hợp nhất không phải "Excel trong browser" và cũng không phải "node editor tự do". Nên là một **guided calculator có Run Mode cực gọn + typed Recipe Builder**.

Thiết kế này đáp ứng đồng thời:

- Người mới không phải hiểu workspace/policy schema để chạy một kỳ.
- Người quản trị có thể tùy biến cộng/trừ/nhân/chia, điều kiện, tỷ lệ và cơ sở của từng tỷ lệ.
- Engine vẫn deterministic, testable, versioned và audit được.
- Các rule phức tạp của Trustana được đóng gói thành macro có trace thay vì công thức text không kiểm soát.

Claude nên review trước hết 14 câu ở mục 10, đặc biệt hai khác biệt formula đang tồn tại: COM waterfall Level 3 và tax flat fallback.
