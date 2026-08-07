#!/usr/bin/env python3
"""Đóng gói toàn bộ nguồn trong tool/src thành MỘT file HTML chạy độc lập.

Chạy:  python3 build.py
Kết quả: tool/Phieu-Incentive.html
"""
import base64, mimetypes, pathlib, re, sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

HERE = pathlib.Path(__file__).resolve().parent      # tool/
SRC = HERE / "src"
VENDOR = SRC / "vendor"
ASSETS = SRC / "assets"
FONTS = ASSETS / "fonts"
OUT = HERE / "Phieu-Incentive.html"


def read(p: pathlib.Path) -> str:
    if not p.exists():
        sys.exit(f"Thiếu file: {p}")
    return p.read_text(encoding="utf-8")


def b64(p: pathlib.Path) -> str:
    if not p.exists():
        sys.exit(f"Thiếu file: {p}")
    return base64.b64encode(p.read_bytes()).decode("ascii")


def inline_font_urls(css: str) -> str:
    """Đổi URL font local trong CSS thành data URI để artifact chạy offline."""
    pattern = re.compile(r"url\((['\"]?)(assets/fonts/[^)'\"]+)\1\)")

    def replace(match: re.Match[str]) -> str:
        path = (SRC / match.group(2)).resolve()
        if FONTS.resolve() not in path.parents:
            sys.exit(f"Đường dẫn font nằm ngoài thư mục cho phép: {path}")
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        return f"url('data:{mime};base64,{b64(path)}')"

    inlined = pattern.sub(replace, css)
    if "assets/fonts/" in inlined:
        sys.exit("Còn URL font chưa được nhúng trong CSS")
    return inlined


def main() -> None:
    html = read(SRC / "index.template.html")
    parts = {
        "__CSS__":       inline_font_urls(read(SRC / "fonts.css") + "\n" + read(SRC / "app.css")),
        "__XLSX__":      read(VENDOR / "xlsx.full.min.js"),
        "__JSPDF__":     read(VENDOR / "jspdf.umd.min.js"),
        "__AUTOTABLE__": read(VENDOR / "jspdf.plugin.autotable.min.js"),
        "__JSZIP__":     read(VENDOR / "jszip.min.js"),
        "__CORE__":      read(SRC / "core.js"),
        "__BONUS__":     read(SRC / "bonus.js"),
        "__PAYSLIP__":   read(SRC / "payslip.js"),
        "__BONUSSLIP__": read(SRC / "bonusslip.js"),
        "__UI__":        read(SRC / "ui.js"),
        "__LOGO__":      "data:image/png;base64," + b64(ASSETS / "logo.png"),
        "__FONT_M400__": b64(FONTS / "ttf" / "montserrat-400.ttf"),
        "__FONT_M700__": b64(FONTS / "ttf" / "montserrat-700.ttf"),
        "__FONT_Q400__": b64(FONTS / "ttf" / "quicksand-400.ttf"),
        "__FONT_Q700__": b64(FONTS / "ttf" / "quicksand-700.ttf"),
    }
    for key, value in parts.items():
        token = "/*" + key + "*/"
        if token not in html:
            sys.exit(f"Khung HTML không có chỗ cắm {token}")
        html = html.replace(token, value, 1)

    OUT.write_text(html, encoding="utf-8")
    print(f"Đã dựng {OUT}  ({OUT.stat().st_size / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    main()
