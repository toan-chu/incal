/* Xuất PDF thật từ đúng luồng UI để kiểm tra font và text tiếng Việt. */
const fs = require('fs');
const path = require('path');
const H = require('./helpers.js');

(async function () {
  const master = H.masterPath();
  if (!master) { H.skipNoMaster('kiểm tra xuất PDF'); process.exit(0); }

  const out = path.resolve(process.argv[2] || path.join(H.ROOT, 'tmp', 'pdfs', 'q1-pham-thi-thuong-hoai.pdf'));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const t = H.openTool();
  let saved = false;
  const originalBuild = t.w.IncalPayslip.build;
  t.w.IncalPayslip.build = function () {
    const doc = originalBuild.apply(this, arguments);
    doc.save = function () {
      fs.writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
      saved = true;
    };
    return doc;
  };

  t.feed('#fileSlip', [{ name: 'master.xlsx', buffer: fs.readFileSync(master) }]);
  await H.wait(900);
  t.$('[data-slip="0"]').click();
  t.$('#dlgPdf').click();

  H.check('đã gọi luồng tải PDF', saved, 'true');
  H.check('file PDF tồn tại', fs.existsSync(out), 'true');
  H.check('file PDF lớn hơn 10 KB', fs.existsSync(out) && fs.statSync(out).size > 10240, 'true');
  console.log('  PDF: ' + out);
  H.finish();
})();
