/* Đường đi thuận: nạp file Excel có số liệu, kiểm tra bảng chi và phiếu từng người. */
const fs = require('fs');
const H = require('./helpers.js');

(async function () {
  const master = H.masterPath();
  if (!master) { H.skipNoMaster('kiểm thử đường thuận'); process.exit(0); }

  const t = H.openTool();
  await H.wait(800);

  console.log('== Khởi tạo ==');
  H.check('thư viện đọc Excel', typeof t.w.XLSX, 'object');
  H.check('thư viện dựng PDF', typeof t.w.jspdf, 'object');
  H.check('thư viện nén', typeof t.w.JSZip, 'function');
  H.check('bộ đọc workbook', typeof t.w.IncalCore, 'object');
  H.check('bộ dựng phiếu', typeof t.w.IncalPayslip, 'object');

  t.feed('#fileSlip', [{ name: 'master.xlsx', buffer: fs.readFileSync(master) }]);
  await H.wait(900);

  console.log('\n== Sau khi nạp file ==');
  H.check('loại băng trạng thái', t.$('#slipBanner').className, 'banner ok');
  H.check('số dòng trong bảng', t.$$('#peopleBody tr').length, 15);

  const foot = t.$('#peopleFoot').textContent.replace(/\s+/g, ' ');
  H.check('tổng gross 349.765.221', /349\.765\.221/.test(foot), 'true');
  H.check('tổng thuế TNCN 34.976.523', /34\.976\.523/.test(foot), 'true');
  H.check('tổng thực nhận 314.788.696', /314\.788\.696/.test(foot), 'true');

  const metrics = t.$$('#slipMetrics .metric').map(function (m) {
    return m.querySelector('span').textContent + '=' + m.querySelector('strong').textContent;
  }).join(' | ');
  console.log('  chỉ số: ' + metrics);
  H.check('số người = 15', /SỐ NGƯỜI=15/.test(metrics), 'true');
  H.check('số job = 345', /SỐ JOB=345/.test(metrics), 'true');

  console.log('\n== Phiếu người đầu bảng ==');
  t.$('[data-slip="0"]').click();
  const slip = t.$('#dlgBody .slip');
  H.check('tên trên phiếu', /Phạm Thị Thương Hoài/.test(t.$('#dlgTitle').textContent), 'true');
  H.check('thực nhận', slip.querySelector('.slip-net b').textContent, '171.010.729 đ');
  H.check('số dòng deal', slip.querySelectorAll('table.slip-t')[1].querySelectorAll('tbody tr').length, 159);
  H.check('mục cơ sở tính > 8', slip.querySelectorAll('.basis div').length > 8, 'true');

  console.log('\n== Lỗi trang ==');
  H.check('không có lỗi', t.errs.length, 0);
  if (t.errs.length) console.log(t.errs);

  H.finish();
})();
