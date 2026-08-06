# Trustana Brand — cho tool Incentive Calculator

## Màu
| Vai trò | Hex | Dùng cho |
|---|---|---|
| Tím brand (chính) | `#4d148c` | Wordmark "TRUST", nút chính, badge, focus ring |
| Cam brand (phụ) | `#ff6200` | Wordmark "ANA", điểm nhấn trang trí tĩnh. KHÔNG dùng cho trạng thái (nhầm với warning) |
| Đỏ lỗi | theo hệ semantic | Lỗi chặn validate |
| Vàng cảnh báo | theo hệ semantic | Warning validate |

CSS tokens gợi ý:
```css
:root {
  --brand-primary: #4d148c;
  --brand-secondary: #ff6200;
}
```

## Typeface
- **Roboto** — heading (vendor woff2 local trong `js/vendor/` hoặc `assets/fonts/` — tool chạy offline, không load Google Fonts)
- **Calibri** — body (font hệ thống Windows). Fallback: `Calibri, 'Segoe UI', system-ui, sans-serif`

## Logo
Bỏ file logo vào folder này (`assets/`):
- `logo-trustana.svg` hoặc `.png` (nền trong suốt, bản ngang)
- Tool hiển thị ở header, chiều cao ≤ 28px
