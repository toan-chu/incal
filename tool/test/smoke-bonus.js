/* Thẻ 2 — Phụ cấp: nạp file Excel phụ cấp, kiểm tra bảng chi, phiếu và cơ chế chặn nhầm thẻ. */
const fs = require('fs');
const H = require('./helpers.js');

(async function () {
  const master = H.bonusMasterPath();
  if (!master) { H.skipNoBonusMaster('kiểm thử phụ cấp'); process.exit(0); }

  const t = H.openTool();
  await H.wait(800);

  console.log('== Khởi tạo ==');
  H.check('bộ đọc file phụ cấp', typeof t.w.IncalBonus, 'object');
  H.check('bộ dựng phiếu phụ cấp', typeof t.w.IncalBonusSlip, 'object');
  H.check('số thẻ trên thanh điều hướng', t.$$('.tab').length, 3);
  H.check('thứ tự thẻ', t.$$('.tab').map(function (x) { return x.dataset.tab; }).join(','),
    'slip,bonus,dash');
  H.check('thẻ 2 là phụ cấp', /Phiếu phụ cấp/.test(t.$$('.tab')[1].textContent), 'true');
  H.check('thẻ 3 là dashboard', /Dashboard/.test(t.$$('.tab')[2].textContent), 'true');

  t.feed('#fileBonus', [{ name: 'phucap.xlsx', buffer: fs.readFileSync(master) }]);
  await H.wait(900);

  console.log('\n== Sau khi nạp file phụ cấp ==');
  H.check('loại băng trạng thái', t.$('#bonusBanner').className, 'banner ok');
  H.check('số dòng trong bảng', t.$$('#bonusBody tr').length, 12);

  /* Chỉ chốt cứng các số KHÔNG phụ thuộc cột Dang_Ky_Giam_Tru do FIN nhập tay.
     Thuế và thực nhận đổi theo cột đó nên chỉ kiểm tra quan hệ cộng trừ. */
  const foot = t.$('#bonusFoot').textContent.replace(/\s+/g, ' ');
  console.log('  dòng tổng: ' + foot);
  H.check('tổng trực đêm 2.310.000', /2\.310\.000/.test(foot), 'true');
  H.check('tổng OPS 2.600.000', /2\.600\.000/.test(foot), 'true');
  H.check('tổng gross 4.910.000', /4\.910\.000/.test(foot), 'true');
  H.check('tổng ca 7 trực · 8 chuyến', /7 · 8/.test(foot), 'true');

  const cells = t.$$('#bonusFoot td').map(function (td) {
    return Number(String(td.textContent).replace(/\./g, '')) || 0;
  });
  /* Ô đầu dòng tổng có colspan=4 nên cột dồn: [1] ca·chuyến, [2] trực đêm,
     [3] OPS, [4] gross, [5] thuế, [6] thực nhận. */
  const gross = cells[4], thue = cells[5], net = cells[6];
  H.check('gross = trực đêm + OPS', cells[2] + cells[3], gross);
  H.check('thực nhận = gross − thuế', gross - thue, net);
  H.check('thuế không âm và không vượt gross', thue >= 0 && thue <= gross, 'true');

  console.log('\n== Phiếu người đầu bảng (Phạm Thị Thương Hoài) ==');
  t.$('[data-bslip="0"]').click();
  const slip = t.$('#dlgBody .slip');
  H.check('tiêu đề hộp thoại', /Phiếu phụ cấp · Phạm Thị Thương Hoài/.test(t.$('#dlgTitle').textContent), 'true');
  H.check('gross 660.000 (2 ca Blaze)', /660\.000/.test(slip.textContent), 'true');
  H.check('phụ cấp giờ 260.000', /260\.000/.test(slip.textContent), 'true');
  H.check('thưởng BCA 400.000', /400\.000/.test(slip.textContent), 'true');
  H.check('nhãn phiếu', slip.querySelector('.slip-top h2').textContent, 'PHIẾU PHỤ CẤP');
  H.check('số dòng nhật ký ca', slip.querySelectorAll('table.slip-t')[1].querySelectorAll('tbody tr').length, 2);
  H.check('có mục cơ sở tính', slip.querySelectorAll('.basis div').length > 6, 'true');
  t.$('#dlgClose').click();

  console.log('\n== Phiếu người chỉ có OPS, ngày lễ (Phan Thị Kiều Trang) ==');
  const idx = t.$$('#bonusBody tr').findIndex(function (tr) {
    return /Phan Thị Kiều Trang/.test(tr.textContent);
  });
  t.$('[data-bslip="' + idx + '"]').click();
  const s2 = t.$('#dlgBody .slip');
  H.check('gross 900.000 (600k khung 01–06 + 300k phụ trội lễ)', /900\.000/.test(s2.textContent), 'true');
  H.check('có nhãn cách tính thuế', /(Khấu trừ 10%|Gộp bảng lương)/.test(s2.textContent), 'true');
  H.check('ca ngày lễ hiện trên nhật ký', /Lễ/.test(s2.textContent), 'true');
  t.$('#dlgClose').click();

  console.log('\n== Chặn thả nhầm thẻ ==');
  const inc = H.masterPath();
  if (inc) {
    t.feed('#fileBonus', [{ name: 'incentive.xlsx', buffer: fs.readFileSync(inc) }]);
    await H.wait(900);
    H.check('file incentive bị chặn ở thẻ phụ cấp', t.$('#bonusBanner').className, 'banner err');
    H.check('có hướng dẫn sang thẻ 1', /thẻ "1 Phiếu incentive"/.test(t.$('#bonusBanner').textContent), 'true');

    t.feed('#fileSlip', [{ name: 'phucap.xlsx', buffer: fs.readFileSync(master) }]);
    await H.wait(900);
    H.check('file phụ cấp bị chặn ở thẻ incentive', t.$('#slipBanner').className, 'banner err');
    H.check('có hướng dẫn sang thẻ 2', /thẻ "2 Phiếu phụ cấp"/.test(t.$('#slipBanner').textContent), 'true');
  } else {
    console.log('  (bỏ qua phần chặn nhầm thẻ: không có file incentive)');
  }

  console.log('\n== Dashboard tự phân loại ==');
  t.feed('#fileDash', [{ name: 'phucap.xlsx', buffer: fs.readFileSync(master) }]);
  await H.wait(900);
  H.check('khối phụ cấp hiện ra', t.$('#dashBonusContent').style.display, 'block');
  H.check('chip kỳ phụ cấp', t.$$('#fileList .file-chip.bonus').length, 1);
  H.check('bảng phụ cấp theo người', t.$$('#dashBonusBody tr').length, 12);

  console.log('\n== Lỗi trang ==');
  H.check('không có lỗi', t.errs.length, 0);
  if (t.errs.length) console.log(t.errs);

  H.finish();
})();
