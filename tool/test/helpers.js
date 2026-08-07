/* Tiện ích chung cho kiểm thử: dựng DOM giả lập và mồi file vào ô chọn file. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const HTML = path.join(__dirname, '..', 'Phieu-Incentive.html');
const TEMPLATE = path.join(ROOT, 'Incentive-Template-TRONG.xlsx');

/* File có số liệu thật. Không nằm trong git — chỉ có trên máy người dùng. */
function masterPath() {
  const p = process.env.INCAL_MASTER || path.join(ROOT, '2026Q1_Incentive_MASTER.xlsx');
  return fs.existsSync(p) ? p : null;
}

function skipNoMaster(what) {
  console.log('BỎ QUA ' + what + ': không tìm thấy file Excel có số liệu.');
  console.log('  Đặt file vào ' + path.join(ROOT, '2026Q1_Incentive_MASTER.xlsx'));
  console.log('  hoặc chạy: INCAL_MASTER=/duong/dan/file.xlsx npm test');
}

/* File phụ cấp có số liệu thật. Cũng không nằm trong git. */
function bonusMasterPath() {
  const p = process.env.INCAL_BONUS_MASTER ||
    path.join(ROOT, 'docs', '2026M08_PhuCap_MASTER.xlsx');
  return fs.existsSync(p) ? p : null;
}

function skipNoBonusMaster(what) {
  console.log('BỎ QUA ' + what + ': không tìm thấy file Excel phụ cấp có số liệu.');
  console.log('  Đặt file vào ' + path.join(ROOT, 'docs', '2026M08_PhuCap_MASTER.xlsx'));
  console.log('  hoặc chạy: INCAL_BONUS_MASTER=/duong/dan/file.xlsx node smoke-bonus.js');
}

/* Tạo bản sao của file gốc nhưng đổi nhãn kỳ — dùng để thử dashboard nhiều kỳ.
   Sửa thẳng trong gói zip nên giữ nguyên giá trị Excel đã lưu. */
function cloneWithPeriod(srcPath, fromLabel, toLabel) {
  const AdmZip = requireZip();
  const zip = new AdmZip(srcPath);
  const entry = zip.getEntry('xl/sharedStrings.xml');
  const xml = entry.getData().toString('utf8');
  if (xml.indexOf('<t>' + fromLabel + '</t>') === -1) {
    throw new Error('Không thấy nhãn kỳ "' + fromLabel + '" trong file gốc.');
  }
  zip.updateFile(entry, Buffer.from(xml.replace('<t>' + fromLabel + '</t>', '<t>' + toLabel + '</t>'), 'utf8'));
  return zip.toBuffer();
}

/* Giả lập file đã có công thức nhưng chưa được Excel ghi cache kết quả. */
function cloneWithoutFormulaCache(srcPath) {
  const XLSX = require('../src/vendor/xlsx.full.min.js');
  const wb = XLSX.read(fs.readFileSync(srcPath), { type: 'buffer', cellFormula: true });
  Object.keys(wb.Sheets).forEach(function (sheetName) {
    const ws = wb.Sheets[sheetName];
    Object.keys(ws).forEach(function (addr) {
      const cell = ws[addr];
      if (!cell || !cell.f) return;
      delete cell.v; delete cell.w;
    });
  });
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
function requireZip() {
  try { return require('adm-zip'); }
  catch (e) { throw new Error('Thiếu adm-zip. Chạy: npm install'); }
}

/* Mở công cụ trong DOM giả lập, bù các thứ jsdom chưa có. */
function openTool() {
  if (!fs.existsSync(HTML)) {
    throw new Error('Chưa có ' + HTML + '. Chạy: cd tool && python3 build.py');
  }
  const errs = [];
  const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
    runScripts: 'dangerously', url: 'file:///t/',
    beforeParse: function (w) {
      w.addEventListener('error', function (e) { errs.push('lỗi trang: ' + e.message); });
      w.HTMLCanvasElement.prototype.getContext = canvasContext;
    }
  });
  const w = dom.window;
  function canvasContext() {
    const noop = function () { };
    return new Proxy({}, {
      get: function (t, k) {
        if (k === 'measureText') return function () { return { width: 20 }; };
        if (k === 'createLinearGradient') return function () { return { addColorStop: noop }; };
        if (k === 'canvas') return {};
        return noop;
      }, set: function () { return true; }
    });
  }
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  w.print = function () { };
  w.URL.createObjectURL = function () { return 'blob:x'; };
  w.URL.revokeObjectURL = function () { };

  return {
    w: w, errs: errs,
    $: function (s) { return w.document.querySelector(s); },
    $$: function (s) { return Array.prototype.slice.call(w.document.querySelectorAll(s)); },
    /* items: [{name, buffer}] */
    feed: function (inputSel, items) {
      w.FileReader = function () {
        this.readAsArrayBuffer = function (f) {
          this.result = new w.Uint8Array(items[f.__i].buffer).buffer;
          setTimeout(function () { this.onload(); }.bind(this), 0);
        }.bind(this);
      };
      const files = items.map(function (it, i) { return { name: it.name, __i: i }; });
      const inp = w.document.querySelector(inputSel);
      Object.defineProperty(inp, 'files', { value: files, configurable: true });
      inp.dispatchEvent(new w.Event('change'));
    }
  };
}

function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

let failed = 0;
function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failed++;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + ': ' + actual + (ok ? '' : '   (mong đợi ' + expected + ')'));
  return ok;
}
function finish() {
  console.log(failed ? '\nTHẤT BẠI: ' + failed + ' tiêu chí không đạt.' : '\nĐẠT toàn bộ tiêu chí.');
  process.exit(failed ? 1 : 0);
}

module.exports = {
  ROOT, HTML, TEMPLATE, masterPath, skipNoMaster,
  bonusMasterPath, skipNoBonusMaster,
  cloneWithPeriod, cloneWithoutFormulaCache, openTool, wait, check, finish
};
