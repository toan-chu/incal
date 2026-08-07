/* Hai chốt chặn:
   A. File chưa được Excel lưu (không có số đã tính) → phải báo đỏ và khoá nút xuất.
   B. Dashboard gộp nhiều kỳ → cột theo kỳ và cộng dồn phải đúng.
   C. Artifact giữ đúng design contract và chạy offline.                    */
const fs = require('fs');
const H = require('./helpers.js');

(async function () {
  const t = H.openTool();
  await H.wait(800);

  /* ---- A ---- */
  console.log('== A. File chưa lưu bằng Excel ==');
  const masterForGuard = H.masterPath();
  if (!masterForGuard) {
    H.skipNoMaster('phần chặn file chưa lưu');
  } else {
    t.feed('#fileSlip', [{ name: 'master-chua-luu.xlsx', buffer: H.cloneWithoutFormulaCache(masterForGuard) }]);
    await H.wait(900);
    H.check('loại băng trạng thái', t.$('#slipBanner').className, 'banner err');
    H.check('có chữ CHẶN', /CHẶN/.test(t.$('#slipBanner').textContent), 'true');
    H.check('nút tải zip bị khoá', t.$('#btnZip').disabled, 'true');
    H.check('nút in bị khoá', t.$('#btnPrintAll').disabled, 'true');
  }

  /* ---- B ---- */
  console.log('\n== B. Dashboard nhiều kỳ ==');
  const master = H.masterPath();
  if (!master) {
    H.skipNoMaster('phần dashboard');
  } else {
    const q2 = H.cloneWithPeriod(master, 'Q1/2026', 'Q2/2026');
    t.feed('#fileDash', [
      { name: 'ky1.xlsx', buffer: fs.readFileSync(master) },
      { name: 'ky2.xlsx', buffer: q2 }
    ]);
    await H.wait(1400);

    const head = t.$$('#dashHead th').map(function (x) { return x.textContent; }).join(' | ');
    console.log('  cột: ' + head);
    H.check('có cột Q1/2026', /Q1\/2026/.test(head), 'true');
    H.check('có cột Q2/2026', /Q2\/2026/.test(head), 'true');
    H.check('số người', t.$$('#dashBody tr').length, 15);
    const foot = t.$('#dashFoot').textContent.replace(/\s+/g, ' ');
    console.log('  tổng: ' + foot);
    H.check('cộng dồn hai kỳ 629.577.392', /629\.577\.392/.test(foot), 'true');
  }

  /* ---- C ---- */
  console.log('\n== C. Presentation contract offline ==');
  const html = fs.readFileSync(H.HTML, 'utf8');
  const css = fs.readFileSync(H.ROOT + '/tool/src/app.css', 'utf8');
  const payslip = fs.readFileSync(H.ROOT + '/tool/src/payslip.js', 'utf8');
  const build = fs.readFileSync(H.ROOT + '/tool/build.py', 'utf8');
  H.check('22 font WOFF2 được nhúng base64', (html.match(/data:font\/woff2;base64,/g) || []).length, 22);
  H.check('có font Quicksand', /font-family:Quicksand/.test(html), 'true');
  H.check('có font Montserrat', /font-family:Montserrat/.test(html), 'true');
  H.check('có font JetBrains Mono', /font-family:'JetBrains Mono'/.test(html), 'true');
  H.check('không có font tải qua mạng', /fonts\.googleapis|fonts\.gstatic|@import url\(http/i.test(html), 'false');
  H.check('không còn Roboto trong artifact/PDF/build', /roboto/i.test(html + payslip + build), 'false');
  H.check('đúng ba mức bo góc', /--radius-sm:10px; --radius:14px; --radius-lg:18px/.test(css), 'true');
  H.check('đúng easing', /--ease:180ms cubic-bezier\(\.2,\.8,\.2,1\)/.test(css), 'true');
  H.check('đúng bóng thẻ', /--shadow:0 12px 32px rgba\(53,30,68,\.08\)/.test(css), 'true');
  H.check('hover có nâng trục dọc', /\.metric:hover\{[^}]*translateY\(-2px\)/.test(css), 'true');
  H.check('focus cam mờ 3px cách 2px', /outline:3px solid rgba\(255,98,0,\.28\);outline-offset:2px/.test(css), 'true');
  H.check('tab đang chọn có bóng tím', /box-shadow:0 5px 14px rgba\(77,20,140,\.2\)/.test(css), 'true');
  H.check('dropzone cách khối sau đúng 18px', /\.drop\{[^}]*margin-bottom:18px/.test(css), 'true');
  H.check('danh sách file rỗng không tạo khoảng cách ma', /\.file-list:empty\{display:none\}/.test(css), 'true');
  H.check('heading dùng lại tỷ lệ bản thẩm mỹ gốc', /\.page-head h1\{[^}]*font-size:clamp\(28px,3vw,42px\)[^}]*line-height:1\.08[^}]*letter-spacing:-\.025em[^}]*color:var\(--brand-deep\)/.test(css), 'true');
  H.check('PDF dùng Quicksand cho heading', /headStyles: \{ font: 'Quicksand'/.test(payslip), 'true');
  H.check('PDF dùng Montserrat cho nội dung', /styles: \{ font: 'Montserrat'/.test(payslip), 'true');
  H.check('vùng thả file nhận focus bàn phím', (html.match(/class="drop"[^>]*tabindex="0"/g) || []).length, 3);

  console.log('\n== Lỗi trang ==');
  H.check('không có lỗi', t.errs.length, 0);
  if (t.errs.length) console.log(t.errs);

  H.finish();
})();
