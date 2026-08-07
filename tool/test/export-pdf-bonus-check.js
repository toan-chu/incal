/* Xuất PDF phiếu phụ cấp thật từ đúng luồng UI để kiểm tra font và text tiếng Việt. */
const fs = require('fs');
const path = require('path');
const H = require('./helpers.js');

(async function () {
  const master = H.bonusMasterPath();
  if (!master) { H.skipNoBonusMaster('kiểm tra xuất PDF phụ cấp'); process.exit(0); }

  const out = path.resolve(process.argv[2] ||
    path.join(H.ROOT, 'tmp', 'pdfs', 'phucap-pham-thi-thuong-hoai.pdf'));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const t = H.openTool();
  let saved = false;
  const originalBuild = t.w.IncalBonusSlip.build;
  t.w.IncalBonusSlip.build = function () {
    const doc = originalBuild.apply(this, arguments);
    doc.save = function () {
      fs.writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
      saved = true;
    };
    return doc;
  };

  t.feed('#fileBonus', [{ name: 'phucap.xlsx', buffer: fs.readFileSync(master) }]);
  await H.wait(900);
  t.$('[data-bslip="0"]').click();
  t.$('#dlgPdf').click();

  H.check('đã gọi luồng tải PDF', saved, 'true');
  H.check('file PDF tồn tại', fs.existsSync(out), 'true');
  H.check('file PDF lớn hơn 10 KB', fs.existsSync(out) && fs.statSync(out).size > 10240, 'true');

  if (fs.existsSync(out)) {
    const raw = fs.readFileSync(out, 'latin1');
    H.check('PDF nhúng font Quicksand', /Quicksand/.test(raw), 'true');
    H.check('PDF nhúng font Montserrat', /Montserrat/.test(raw), 'true');
  }
  console.log('  PDF: ' + out);
  H.finish();
})();
