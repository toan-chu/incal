# TEST-SCENARIO v3 — Kịch bản nghiệm thu "lệch = 0"

**Ngày:** 2026-07-21 · Tác giả: Claude (CEO). **Trạng thái: PASS (lệch = 0).**
Harness chạy được: `test/v3_scenario.test.js` — lệnh `node --test test/v3_scenario.test.js`.

## Mục đích
Chứng minh **engine v3 tái tạo đúng số tính tay** trước khi đụng số Trustana thật. Đây là gate acceptance số học trong Directive. Kịch bản **synthetic** (không dùng dữ liệu thật), phủ toàn bộ mắt xích: source → filter → scan_sum → **waterfall / thuế 2 nhánh / pool KAE** → phạt → làm tròn → gộp net.

## Đầu vào (3 người, 7 job)
| Job | Người | Team | Tier | Paid | GP | Phạt |
|---|---|---|---|---|---|---|
| J1 | E-01 | COM | Mức 1 | Paid | 120.000.000 | 0 |
| J2 | E-01 | COM | Mức 2 | Paid | 50.000.000 | 0 |
| J3 | E-01 | COM | Mức 3 | Paid | 30.000.000 | 0 |
| J4 | E-01 | COM | — | Unpaid | 0 | 1.000.000 |
| J5 | E-02 | BO | — | Paid | 40.000.000 | 0 |
| J6 | E-03 | KAE-ADMIN | — | Paid | 100.000.000 | 0 |
| J7 | E-03 | KAE-SALE | — | Paid | 50.000.000 | 0 |

Roster: E-01 (COM, có HĐLĐ) · E-02 (BO, không HĐLĐ) · E-03 (KAE, có HĐLĐ).
Tham số: target COM = 100.000.000, điều chỉnh +1% · rate waterfall 8/12/17% · thuế lũy tiến {5,10,20,30,35}% trừ {0; 500k; 3,5tr; 9,5tr; 14,5tr}, khoán 10% · pool 5%+2% chia 3.

## Số kỳ vọng (tính tay)
**E-01 COM — waterfall:** remaining=100tr.
- L1: excess = 120tr−100tr = 20tr × 8% = **1.600.000** → đã có thưởng, remaining=0.
- L2: đã có thưởng → full 50tr × (12%+1%) = **6.500.000**.
- L3: đã có thưởng → full 30tr × (17%+1%) = **5.400.000**.
- COM = 13.500.000. Phạt = 1.000.000. Thuế lũy tiến trên 13,5tr = max(…) = 13,5tr×10%−500k = **850.000**. **Net = 11.650.000**.

**E-02 BO:** 40tr × 8% = 3.200.000. Không HĐLĐ → thuế khoán 10% = 320.000. **Net = 2.880.000**.

**E-03 KAE — pool:** (100tr×5% + 50tr×2%)/3 = (5tr+1tr)/3 = 2.000.000. Có HĐLĐ → lũy tiến trên 2tr = 2tr×5% = **100.000**. **Net = 1.900.000**.

**Tổng:** gross 18.700.000 · phạt 1.000.000 · thuế 1.270.000 · **net 16.430.000**.

## Kết quả chạy (engine v3)
Khớp 100% từng ô, **lệch = 0** trên cả 3 người + tổng. Test `1 pass`.

## Phát hiện thiết kế (cho giai đoạn preset thật)
Recipe trong engine chạy **độc lập, không tham chiếu chéo** — thuế phụ thuộc tổng thu nhập nên recipe thuế phải **tính lại base** (ở đây dup node COM/BO/KAE). Khi dựng preset Trustana thật, cân nhắc bước "gộp component → rồi mới thuế" để tránh nhân đôi logic. Không chặn nghiệm thu hiện tại.

## Ghi chú
Kịch bản này verify **engine**, chưa phải số Trustana thật. Đối chiếu với file Excel thật là bước preset-phase kế tiếp (Claude dựng preset → reconcile với `2026Q1_Incentive- (TEST) - Copy.xlsx`).
