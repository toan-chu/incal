/* ==========================================================================
   INCAL UI — điều khiển giao diện công cụ phiếu incentive.
   Phụ thuộc: XLSX (SheetJS), jspdf, jspdf-autotable, JSZip, IncalCore, IncalPayslip.
   ========================================================================== */
(function () {
  'use strict';

  const $ = function (s) { return document.querySelector(s); };
  const $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  const P = window.IncalPayslip, C = window.IncalCore;
  const B = window.IncalBonus, BS = window.IncalBonusSlip;
  const vnd = P.vnd;
  const hrs = BS.hrs;
  const GROUP = { SALE: ['Sale COM', ''], KAE: ['KAE', 'kae'], BO: ['BO', 'bo'] };
  const BGROUP = { TRUC_DEM: ['Trực đêm', 'night'], OPS: ['OPS', 'ops'] };

  const state = {
    report: null, reports: [],
    bonus: null, bonusReports: [],
    logo: null, fonts: null
  };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function dmy(d) {
    if (!d) return '';
    const p = function (x) { return String(x).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function toast(msg, ms) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, ms || 2600);
  }
  function short(n) {
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace('.', ',') + ' tỷ';
    if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',') + ' tr';
    if (a >= 1e3) return Math.round(n / 1e3) + 'k';
    return String(Math.round(n));
  }

  /* ------------------------------------------------------------------ đọc file */

  /* Đọc file rồi tự phân loại: file phụ cấp hay file incentive. */
  function readFile(file, want) {
    return new Promise(function (resolve, reject) {
      const fr = new FileReader();
      fr.onerror = function () { reject(new Error('Không đọc được file ' + file.name)); };
      fr.onload = function () {
        try {
          const wb = XLSX.read(new Uint8Array(fr.result), { type: 'array', cellFormula: true });
          const isBonus = B.looksLikeBonus(wb);
          if (want === 'INCENTIVE' && isBonus) {
            throw new Error('đây là file PHỤ CẤP. Hãy thả vào thẻ "2 Phiếu phụ cấp".');
          }
          if (want === 'BONUS' && !isBonus) {
            throw new Error('đây là file INCENTIVE. Hãy thả vào thẻ "1 Phiếu incentive".');
          }
          if (isBonus) resolve(B.parse(wb, file.name));
          else {
            const rep = C.parse(wb, file.name);
            rep.kind = 'INCENTIVE';
            resolve(rep);
          }
        } catch (e) { reject(new Error(file.name + ': ' + e.message)); }
      };
      fr.readAsArrayBuffer(file);
    });
  }

  /* ------------------------------------------------------------------ thẻ Phiếu */

  function loadSingle(files) {
    const f = Array.prototype.slice.call(files).filter(isXlsx)[0];
    if (!f) { toast('Hãy chọn file Excel (.xlsx)'); return; }
    readFile(f, 'INCENTIVE').then(function (rep) {
      state.report = rep;
      renderSlipTab();
      toast('Đã nạp ' + rep.people.length + ' người từ ' + f.name);
    }).catch(function (e) { showBanner('#slipBanner', 'err', 'Không nạp được file', [e.message]); });
  }
  function isXlsx(f) { return /\.xlsx?$/i.test(f.name); }

  function showBanner(sel, kind, title, lines) {
    const b = $(sel);
    b.className = 'banner ' + kind;
    b.innerHTML = '<div class="dot">' + (kind === 'ok' ? '✓' : kind === 'warn' ? '!' : '×') + '</div><div><strong>' +
      esc(title) + '</strong>' + (lines && lines.length ? '<ul>' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    b.style.display = 'flex';
  }

  function renderSlipTab() {
    const r = state.report;
    if (!r) return;
    $('#slipEmpty').style.display = 'none';
    $('#slipContent').style.display = 'block';
    $('#periodChip').innerHTML = '<small>KỲ BÁO CÁO</small><b>' + esc(r.period.name) + '</b>';
    $('#dropSlip').classList.add('compact');

    const blocking = r.warnings.filter(function (w) { return /^CHẶN/.test(w); });
    if (blocking.length) showBanner('#slipBanner', 'err', 'File chưa dùng được', r.warnings);
    else if (r.warnings.length) showBanner('#slipBanner', 'warn', 'Đã nạp, có điểm cần kiểm tra', r.warnings);
    else showBanner('#slipBanner', 'ok', 'Số liệu đọc từ file khớp bảng tính. Không phát hiện sai lệch.',
      ['Nguồn: ' + r.fileName + '  ·  ' + r.people.length + ' người  ·  ' + r.jobs.length + ' job.']);

    const t = r.totals;
    $('#slipMetrics').innerHTML = [
      m('KỲ', r.period.name), m('SỐ NGƯỜI', r.people.length), m('SỐ JOB', r.jobs.length),
      m('TỔNG GROSS', short(t.Incentive_Gross)), m('TỔNG THUẾ TNCN', short(t.Thue_TNCN)),
      m('TỔNG THỰC NHẬN', short(t.Incentive_Thuc_Nhan), true)
    ].join('');

    $('#peopleBody').innerHTML = r.people.map(function (p, i) {
      const zero = p.Incentive_Gross === 0;
      return '<tr' + (zero ? ' class="zero-row"' : '') + '>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><code>' + esc(p.maNV) + '</code></td>' +
        '<td><strong>' + esc(p.hoTen) + '</strong></td>' +
        '<td>' + p.groups.map(function (g) {
          return '<span class="pill ' + (GROUP[g] ? GROUP[g][1] : '') + '">' + (GROUP[g] ? GROUP[g][0] : g) + '</span>';
        }).join(' ') + '</td>' +
        '<td class="num">' + vnd(p.Incentive_Gross) + '</td>' +
        '<td class="num">' + vnd(p.Thue_TNCN) + '</td>' +
        '<td class="num"><strong>' + vnd(p.Incentive_Thuc_Nhan) + '</strong></td>' +
        '<td class="num">' + (p.jobs.length || '—') + '</td>' +
        '<td><button class="btn sm" data-slip="' + i + '">Xem phiếu</button></td></tr>';
    }).join('');

    $('#peopleFoot').innerHTML = '<tr><td colspan="4">TỔNG ' + r.people.length + ' người</td>' +
      '<td class="num">' + vnd(t.Incentive_Gross) + '</td>' +
      '<td class="num">' + vnd(t.Thue_TNCN) + '</td>' +
      '<td class="num">' + vnd(t.Incentive_Thuc_Nhan) + '</td>' +
      '<td class="num">' + r.jobs.length + '</td><td></td></tr>';

    $$('#slipContent .bar .btn').forEach(function (b) { b.disabled = !!blocking.length; });
  }

  function m(label, value, accent) {
    return '<article class="metric' + (accent ? ' accent' : '') + '"><span>' + esc(label) +
      '</span><strong>' + esc(value) + '</strong></article>';
  }

  /* ------------------------------------------------------------------ thẻ Phụ cấp */

  function loadBonus(files) {
    const f = Array.prototype.slice.call(files).filter(isXlsx)[0];
    if (!f) { toast('Hãy chọn file Excel (.xlsx)'); return; }
    readFile(f, 'BONUS').then(function (rep) {
      state.bonus = rep;
      renderBonusTab();
      toast('Đã nạp ' + rep.people.length + ' người, ' + rep.shifts.length + ' ca từ ' + f.name);
    }).catch(function (e) { showBanner('#bonusBanner', 'err', 'Không nạp được file', [e.message]); });
  }

  function renderBonusTab() {
    const r = state.bonus;
    if (!r) return;
    $('#bonusEmpty').style.display = 'none';
    $('#bonusContent').style.display = 'block';
    $('#periodChip').innerHTML = '<small>KỲ BÁO CÁO</small><b>' + esc(r.period.name) + '</b>';
    $('#dropBonus').classList.add('compact');

    const blocking = r.warnings.filter(function (w) { return /^CHẶN/.test(w); });
    if (blocking.length) showBanner('#bonusBanner', 'err', 'File chưa dùng được', r.warnings);
    else if (r.warnings.length) showBanner('#bonusBanner', 'warn', 'Đã nạp, có điểm cần kiểm tra', r.warnings);
    else showBanner('#bonusBanner', 'ok', 'Số liệu đọc từ file khớp nhật ký ca. Không phát hiện sai lệch.',
      ['Nguồn: ' + r.fileName + '  ·  ' + r.people.length + ' người  ·  ' + r.shifts.length + ' ca.']);

    const t = r.totals;
    $('#bonusMetrics').innerHTML = [
      m('KỲ', r.period.name),
      m('SỐ NGƯỜI CÓ PHỤ CẤP', r.people.filter(function (p) { return p.Tong_PC_Gross > 0; }).length),
      m('CA TRỰC · CHUYẾN OPS', t.So_Ca_Truc + ' · ' + t.So_Chuyen_OPS),
      m('TỔNG TRỰC ĐÊM', short(t.PC_TrucDem)),
      m('TỔNG OPS', short(t.Phi_OPS)),
      m('TỔNG THỰC NHẬN', short(t.PC_Thuc_Nhan), true)
    ].join('');

    $('#bonusBody').innerHTML = r.people.map(function (p, i) {
      const zero = p.Tong_PC_Gross === 0;
      return '<tr' + (zero ? ' class="zero-row"' : '') + '>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><code>' + esc(p.maNV) + '</code></td>' +
        '<td><strong>' + esc(p.hoTen) + '</strong></td>' +
        '<td>' + (p.groups.map(function (g) {
          return '<span class="pill ' + (BGROUP[g] ? BGROUP[g][1] : '') + '">' +
            (BGROUP[g] ? BGROUP[g][0] : g) + '</span>';
        }).join(' ') || '—') + '</td>' +
        '<td class="num">' + (p.So_Ca_Truc || 0) + ' · ' + (p.So_Chuyen_OPS || 0) + '</td>' +
        '<td class="num">' + vnd(p.PC_TrucDem) + '</td>' +
        '<td class="num">' + vnd(p.Phi_OPS) + '</td>' +
        '<td class="num">' + vnd(p.Tong_PC_Gross) + '</td>' +
        '<td class="num">' + vnd(p.Thue_TNCN) + '</td>' +
        '<td class="num"><strong>' + vnd(p.PC_Thuc_Nhan) + '</strong></td>' +
        '<td><button class="btn sm" data-bslip="' + i + '">Xem phiếu</button></td></tr>';
    }).join('');

    $('#bonusFoot').innerHTML = '<tr><td colspan="4">TỔNG ' + r.people.length + ' người</td>' +
      '<td class="num">' + t.So_Ca_Truc + ' · ' + t.So_Chuyen_OPS + '</td>' +
      '<td class="num">' + vnd(t.PC_TrucDem) + '</td>' +
      '<td class="num">' + vnd(t.Phi_OPS) + '</td>' +
      '<td class="num">' + vnd(t.Tong_PC_Gross) + '</td>' +
      '<td class="num">' + vnd(t.Thue_TNCN) + '</td>' +
      '<td class="num">' + vnd(t.PC_Thuc_Nhan) + '</td><td></td></tr>';

    $('#bonusCount').textContent = r.shifts.length + ' ca';
    $$('#bonusContent .bar .btn').forEach(function (b) { b.disabled = !!blocking.length; });
  }

  function bonusSlipHtml(r, p) {
    const s = p.shiftSummary;
    const rows = [
      ['Phụ cấp theo giờ (' + hrs(s.gioBien) + ' biên + ' + hrs(s.gioLoi) + ' lõi)', s.pcGio],
      ['Thưởng BCA (' + s.spark + ' Spark, ' + s.blaze + ' Blaze)', s.thuongBCA],
      ['Phụ cấp trực đêm', p.PC_TrucDem, 'sub'],
      ['Phụ cấp OPS (' + p.So_Chuyen_OPS + ' chuyến)', p.Phi_OPS],
      ['Tổng phụ cấp (gross)', p.Tong_PC_Gross, 'strong'],
      ['Bảo hiểm xã hội', -Math.abs(p.BHXH)],
      ['Giảm trừ gia cảnh áp dụng', -Math.abs(p.Giam_Tru_Ap_Dung)],
      ['Thu nhập chịu thuế', p.TN_Chiu_Thue, 'sub'],
      ['Thuế TNCN (' + (p.cachTinhThue || '—') + ')', -Math.abs(p.Thue_TNCN), 'sub'],
      ['Cộng / trừ khác', p.Cong_Tru_Khac]
    ].filter(function (x) { return x[1] !== 0 || x[2]; });

    const pa = r.params || {};
    const basis = [
      ['Số ca trực đêm', String(s.caTruc)],
      ['Số chuyến OPS', String(s.chuyenOPS)],
      ['Ca / chuyến ngày lễ', String(s.caLe)],
      ['Tổng giờ trực', hrs(s.tongGio)]
    ];
    if (s.caTruc) {
      basis.push(['Khung biên 22–24 & 04–06', hrs(s.gioBien) + ' × ' + vnd(pa.rate_gio_bien) + ' đ/h']);
      basis.push(['Khung lõi 00–04', hrs(s.gioLoi) + ' × ' + vnd(pa.rate_gio_loi) + ' đ/h']);
      basis.push(['BCA Spark', s.spark + ' ca × ' + vnd(pa.bca_spark) + ' đ']);
      basis.push(['BCA Blaze', s.blaze + ' ca × ' + vnd(pa.bca_blaze) + ' đ']);
    }
    if (s.chuyenOPS) {
      basis.push(['Tổng trọng lượng lô hàng', vnd(s.tongKG) + ' kg']);
      basis.push(['Ngưỡng định biên 1 người', vnd(pa.ops_kg_1nguoi) + ' kg']);
    }
    if (s.caLe) {
      basis.push(['Hệ số ngày lễ', String(pa.he_so_le || 1.5).replace('.', ',') + ' lần']);
      basis.push(['Phụ trội lễ / chuyến OPS', vnd(pa.ops_phu_troi_le) + ' đ']);
    }
    basis.push(['Cách tính thuế TNCN', p.cachTinhThue || '—']);

    const log = p.shifts.length ? (
      '<h3>NHẬT KÝ CA (' + p.shifts.length + ' ca)</h3>' +
      '<p class="deal-hint">Đối chiếu xem đã đủ ca chưa. Thiếu ca — báo FIN trước hạn chốt bảng lương.</p>' +
      '<table class="slip-t"><thead><tr><th>#</th><th>Ngày</th><th>Loại ca</th><th>Loại ngày</th><th>Giờ</th>' +
      '<th class="num">Biên</th><th class="num">Lõi</th><th>BCA</th><th>Mã job</th>' +
      '<th class="num">KG</th><th class="num">Thành tiền</th></tr></thead><tbody>' +
      p.shifts.map(function (x, i) {
        const gio = x.gioBatDau + (x.gioKetThuc ? '–' + x.gioKetThuc : '');
        return '<tr><td>' + (i + 1) + '</td><td>' + esc(B.fmtDate(x.ngay)) + '</td>' +
          '<td>' + (x.loaiCa === 'OPS' ? 'OPS' : 'Trực đêm') + '</td>' +
          '<td' + (x.loaiNgay === 'Lễ' ? ' class="tag-unpaid"' : '') + '>' + esc(x.loaiNgay) + '</td>' +
          '<td>' + esc(gio) + '</td>' +
          '<td class="num">' + (x.gioBien ? hrs(x.gioBien) : '') + '</td>' +
          '<td class="num">' + (x.gioLoi ? hrs(x.gioLoi) : '') + '</td>' +
          '<td>' + esc(x.mucBCA) + '</td><td><code>' + esc(x.maJob) + '</code></td>' +
          '<td class="num">' + (x.trongLuong ? vnd(x.trongLuong) : '') + '</td>' +
          '<td class="num">' + vnd(x.tongDong) + '</td></tr>';
      }).join('') +
      '</tbody><tfoot><tr class="sub"><td colspan="5">TỔNG ' + p.shifts.length + ' ca</td>' +
      '<td class="num">' + hrs(s.gioBien) + '</td><td class="num">' + hrs(s.gioLoi) + '</td>' +
      '<td></td><td></td><td></td><td class="num">' + vnd(s.tong) + '</td></tr></tfoot></table>' +
      '<p class="deal-hint" style="margin-top:8px">Trực đêm: <b>' + vnd(s.pcTrucDem) +
      ' đ</b> · OPS: <b>' + vnd(s.phiOPS) + ' đ</b></p>'
    ) : '<p class="deal-hint">Kỳ này không có ca trực đêm hoặc chuyến OPS nào được ghi nhận.</p>';

    const range = r.period.from && r.period.to ? dmy(r.period.from) + ' — ' + dmy(r.period.to) : '';

    return '<article class="slip" data-person="' + esc(p.maNV) + '">' +
      '<div class="slip-top">' + (state.logo ? '<img src="' + state.logo + '" alt="Trustana">' : '<strong>TRUSTANA</strong>') +
      '<div class="r"><h2>PHIẾU PHỤ CẤP</h2><small>Trực đêm &amp; OPS · ' + esc(r.period.name) +
      (range ? ' · ' + range : '') + '</small></div></div>' +
      '<div class="slip-id"><div><span>HỌ VÀ TÊN</span><b>' + esc(p.hoTen) + '</b></div>' +
      '<div><span>MÃ NHÂN VIÊN</span><b>' + esc(p.maNV) + '</b></div>' +
      '<div><span>KHOẢN HƯỞNG</span><b>' + (p.groups.map(function (g) {
        return BGROUP[g] ? BGROUP[g][0] : g;
      }).join(' + ') || '—') + '</b></div></div>' +
      '<table class="slip-t"><thead><tr><th>DIỄN GIẢI</th><th class="num">SỐ TIỀN (VND)</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr class="' + (x[2] || '') + '"><td>' + esc(x[0]) + '</td><td class="num">' + vnd(x[1]) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="slip-net"><span>PHỤ CẤP THỰC NHẬN</span><b>' + vnd(p.PC_Thuc_Nhan) + ' đ</b></div>' +
      '<h3>CƠ SỞ TÍNH</h3><div class="basis">' + basis.map(function (b) {
        return '<div><span>' + esc(b[0]) + '</span><b>' + esc(b[1]) + '</b></div>';
      }).join('') + '</div>' +
      log +
      '<p class="slip-note">Số liệu lấy trực tiếp từ file Excel phụ cấp kỳ ' + esc(r.period.name) +
      '. Chi tiết công thức: liên hệ phòng FIN. · Xuất ' + dmy(new Date()) + '</p></article>';
  }

  function makeBonusPdf(p) {
    return BS.build(window.jspdf.jsPDF, state.fonts, state.bonus, p,
      { logo: state.logo, company: 'TRUSTANA' });
  }

  function downloadBonusZip() {
    const r = state.bonus;
    if (!r) return;
    const btn = $('#btnBonusZip'); btn.disabled = true; const old = btn.textContent;
    btn.textContent = 'Đang dựng…';
    setTimeout(function () {
      try {
        const zip = new JSZip();
        r.people.forEach(function (p) {
          zip.file(BS.fileName(r, p), makeBonusPdf(p).output('arraybuffer'));
        });
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
          saveBlob(blob, 'Phieu-PhuCap_' + String(r.period.name).replace(/[\\/:*?"<>|]/g, '-') + '.zip');
          toast('Đã tải ' + r.people.length + ' phiếu PDF trong 1 file nén');
        }).catch(function (e) { toast('Lỗi nén file: ' + e.message, 4000); })
          .then(function () { btn.disabled = false; btn.textContent = old; });
      } catch (e) {
        toast('Lỗi dựng PDF: ' + e.message, 4000); btn.disabled = false; btn.textContent = old;
      }
    }, 30);
  }

  function exportBonusCsv() {
    const r = state.bonus;
    const head = ['STT', 'Ma_NV', 'Ho_Ten', 'Bo_Phan', 'So_Ca_Truc', 'So_Chuyen_OPS',
      'PC_TrucDem', 'Phi_OPS', 'Tong_PC_Gross', 'Cach_Tinh_Thue', 'Thue_TNCN', 'PC_Thuc_Nhan'];
    const rows = r.people.map(function (p, i) {
      return [i + 1, p.maNV, p.hoTen, p.boPhan, p.So_Ca_Truc, p.So_Chuyen_OPS,
        p.PC_TrucDem, p.Phi_OPS, p.Tong_PC_Gross, p.cachTinhThue, p.Thue_TNCN, p.PC_Thuc_Nhan];
    });
    const csv = '﻿' + [head].concat(rows).map(function (r2) {
      return r2.map(function (c) { return /[",;\n]/.test(String(c)) ? '"' + String(c).replace(/"/g, '""') + '"' : c; }).join(';');
    }).join('\r\n');
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      'PhuCap_' + String(r.period.name).replace(/[\\/:*?"<>|]/g, '-') + '.csv');
  }

  function printAllBonus() {
    const r = state.bonus;
    $('#printArea').innerHTML = r.people.map(function (p) { return bonusSlipHtml(r, p); }).join('');
    document.body.classList.add('printing-all');
    setTimeout(function () { window.print(); }, 60);
  }

  /* ------------------------------------------------------------------ phiếu HTML */

  function slipHtml(r, p) {
    const rows = [
      ['Incentive Gross', p.Incentive_Gross, 'strong'],
      ['Thu nhập lương chịu thuế', p.TN_Luong_Chiu_Thue],
      ['Phí OPS', p.Phi_OPS],
      ['Bảo hiểm xã hội', -Math.abs(p.BHXH)],
      ['Giảm trừ gia cảnh', -Math.abs(p.Giam_Tru)],
      ['Thu nhập chịu thuế', p.TN_Chiu_Thue, 'sub'],
      ['Thuế TNCN', p.Thue_TNCN],
      ['Thuế đã trừ ở lương', -Math.abs(p.Thue_Da_Tru_Luong)],
      ['Thuế đã trừ ở OPS', -Math.abs(p.Thue_Da_Tru_OPS)],
      ['Thuế phải nộp', -Math.abs(p.Thue_Phai_Nop), 'sub'],
      ['Cộng / trừ khác', p.Cong_Tru_Khac]
    ].filter(function (x, i) { return i === 0 || x[1] !== 0 || x[2]; });

    const basis = [];
    const pc = function (v) { return (Math.round((v || 0) * 10000) / 100).toString().replace('.', ',') + '%'; };
    if (p.sale) {
      const s = p.sale;
      basis.push(['Doanh thu', vnd(s.Doanh_Thu)], ['Chi phí', vnd(s.Chi_Phi)],
        ['Lợi nhuận (tổng)', vnd(s.Profit_Total)], ['Lợi nhuận đã thu', vnd(s.Profit_Paid)],
        ['Lợi nhuận chưa thu', vnd(s.Profit_Unpaid)], ['Chỉ tiêu quý', vnd(s.Target_Q)],
        ['Mức 1 (' + pc(s.Rate_M1) + ')', vnd(s.U_Muc1)], ['Mức 2 (' + pc(s.Rate_M2) + ')', vnd(s.V_Muc2)],
        ['Mức 3 (' + pc(s.Rate_M3) + ')', vnd(s.W_Muc3)], ['Cộng ba mức', vnd(s.X_Gross)]);
      if (+s.Z_BP) basis.push(['Thưởng Trưởng bộ phận', vnd(s.Z_BP)]);
      if (+s.AA_Phat) basis.push(['Phạt công nợ', vnd(s.AA_Phat)]);
    }
    if (p.kae) {
      const k = p.kae;
      const pool = r.kaePool.filter(function (x) { return /TỔNG/i.test(String(x.Nguon)); })[0] || {};
      basis.push(['Pool tháng 1', vnd(pool.T1_Pool)], ['Tỷ lệ tham gia T1', String(k.T1_Ratio)],
        ['Pool tháng 2', vnd(pool.T2_Pool)], ['Tỷ lệ tham gia T2', String(k.T2_Ratio)],
        ['Pool tháng 3', vnd(pool.T3_Pool)], ['Tỷ lệ tham gia T3', String(k.T3_Ratio)],
        ['Được chia từ pool', vnd(k.Tong_Chia)], ['Trừ / phạt', vnd((+k.Tru || 0) + (+k.Phat || 0))]);
    }
    if (p.other) {
      const o = p.other;
      basis.push(['Doanh thu (BO)', vnd(o.Doanh_Thu)], ['Chi phí (BO)', vnd(o.Chi_Phi)],
        ['Lợi nhuận đã thu (BO)', vnd(o.Profit_Paid)], ['Tỷ lệ áp dụng', pc(o.Rate)],
        ['Incentive BO', vnd(o.Incentive)]);
    }

    const s = p.jobSummary;
    const deals = p.jobs.length ? (
      '<h3>DANH SÁCH DEAL ĐÓNG GÓP (' + p.jobs.length + ' job)</h3>' +
      '<p class="deal-hint">Đối chiếu xem đã đủ deal chưa. Thiếu deal — báo FIN trước hạn chốt.</p>' +
      '<table class="slip-t"><thead><tr><th>#</th><th>Th</th><th>Mã job</th><th>Khách hàng</th><th>Mức</th>' +
      '<th class="num">Doanh thu</th><th class="num">Chi phí</th><th class="num">Lợi nhuận</th><th>T.thái</th></tr></thead><tbody>' +
      p.jobs.map(function (j, i) {
        const paid = /^paid$/i.test(j.paidStatus);
        return '<tr><td>' + (i + 1) + '</td><td>' + (j.thang || '') + '</td><td><code>' + esc(j.maJob) + '</code></td>' +
          '<td>' + esc(j.khachHang) + '</td><td>' + esc(j.khLoai) + '</td>' +
          '<td class="num">' + vnd(j.doanhThu) + '</td><td class="num">' + vnd(j.chiPhi) + '</td>' +
          '<td class="num">' + vnd(j.profit) + '</td>' +
          '<td' + (paid ? '' : ' class="tag-unpaid"') + '>' + (paid ? 'Đã thu' : 'Chưa thu') + '</td></tr>';
      }).join('') +
      '</tbody><tfoot><tr class="sub"><td colspan="5">TỔNG ' + p.jobs.length + ' job</td>' +
      '<td class="num">' + vnd(s.doanhThu) + '</td><td class="num">' + vnd(s.chiPhi) + '</td>' +
      '<td class="num">' + vnd(s.profit) + '</td><td></td></tr></tfoot></table>' +
      '<p class="deal-hint" style="margin-top:8px">Đã thu: <b>' + vnd(s.profitPaid) + ' đ</b> · Chưa thu: <b>' + vnd(s.profitUnpaid) + ' đ</b></p>'
    ) : (p.groups.indexOf('KAE') >= 0
      ? '<p class="deal-hint">KAE hưởng theo pool chung của nhóm, không gắn với deal riêng lẻ.</p>' : '');

    const range = r.period.from && r.period.to ? dmy(r.period.from) + ' — ' + dmy(r.period.to) : '';

    return '<article class="slip" data-person="' + esc(p.maNV) + '">' +
      '<div class="slip-top">' + (state.logo ? '<img src="' + state.logo + '" alt="Trustana">' : '<strong>TRUSTANA</strong>') +
      '<div class="r"><h2>PHIẾU INCENTIVE</h2><small>Kỳ ' + esc(r.period.name) + (range ? ' · ' + range : '') + '</small></div></div>' +
      '<div class="slip-id"><div><span>HỌ VÀ TÊN</span><b>' + esc(p.hoTen) + '</b></div>' +
      '<div><span>MÃ NHÂN VIÊN</span><b>' + esc(p.maNV) + '</b></div>' +
      '<div><span>NHÓM TÍNH</span><b>' + p.groups.map(function (g) { return GROUP[g] ? GROUP[g][0] : g; }).join(' + ') + '</b></div></div>' +
      '<table class="slip-t"><thead><tr><th>DIỄN GIẢI</th><th class="num">SỐ TIỀN (VND)</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr class="' + (x[2] || '') + '"><td>' + esc(x[0]) + '</td><td class="num">' + vnd(x[1]) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="slip-net"><span>INCENTIVE THỰC NHẬN</span><b>' + vnd(p.Incentive_Thuc_Nhan) + ' đ</b></div>' +
      (basis.length ? '<h3>CƠ SỞ TÍNH</h3><div class="basis">' + basis.map(function (b) {
        return '<div><span>' + esc(b[0]) + '</span><b>' + esc(b[1]) + '</b></div>';
      }).join('') + '</div>' : '') +
      deals +
      '<p class="slip-note">Số liệu lấy trực tiếp từ file Excel incentive kỳ ' + esc(r.period.name) +
      '. Chi tiết công thức: liên hệ phòng FIN. · Xuất ' + dmy(new Date()) + '</p></article>';
  }

  /* ------------------------------------------------------------------ PDF */

  function makePdf(p) {
    return P.build(window.jspdf.jsPDF, state.fonts, state.report, p,
      { logo: state.logo, company: 'TRUSTANA' });
  }

  function downloadOne(p) {
    makePdf(p).save(P.fileName(state.report, p));
  }

  function downloadZip() {
    const r = state.report;
    if (!r) return;
    const btn = $('#btnZip'); btn.disabled = true; const old = btn.textContent;
    btn.textContent = 'Đang dựng…';
    setTimeout(function () {
      try {
        const zip = new JSZip();
        r.people.forEach(function (p) {
          zip.file(P.fileName(r, p), makePdf(p).output('arraybuffer'));
        });
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
          saveBlob(blob, 'Phieu-Incentive_' + String(r.period.name).replace(/[\\/:*?"<>|]/g, '-') + '.zip');
          toast('Đã tải ' + r.people.length + ' phiếu PDF trong 1 file nén');
        }).catch(function (e) { toast('Lỗi nén file: ' + e.message, 4000); })
          .then(function () { btn.disabled = false; btn.textContent = old; });
      } catch (e) {
        toast('Lỗi dựng PDF: ' + e.message, 4000); btn.disabled = false; btn.textContent = old;
      }
    }, 30);
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  function exportCsv() {
    const r = state.report;
    const head = ['STT', 'Ma_NV', 'Ho_Ten', 'Nhom', 'Incentive_Gross', 'Thue_TNCN', 'Incentive_Thuc_Nhan', 'So_Deal'];
    const rows = r.people.map(function (p, i) {
      return [i + 1, p.maNV, p.hoTen, p.groups.join('+'), p.Incentive_Gross, p.Thue_TNCN, p.Incentive_Thuc_Nhan, p.jobs.length];
    });
    const csv = '﻿' + [head].concat(rows).map(function (r2) {
      return r2.map(function (c) { return /[",;\n]/.test(String(c)) ? '"' + String(c).replace(/"/g, '""') + '"' : c; }).join(';');
    }).join('\r\n');
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      'Incentive_' + String(r.period.name).replace(/[\\/:*?"<>|]/g, '-') + '.csv');
  }

  /* ------------------------------------------------------------------ in */

  function printAll() {
    const r = state.report;
    $('#printArea').innerHTML = r.people.map(function (p) { return slipHtml(r, p); }).join('');
    document.body.classList.add('printing-all');
    setTimeout(function () { window.print(); }, 60);
  }

  /* ------------------------------------------------------------------ dashboard */

  function loadMulti(files) {
    const list = Array.prototype.slice.call(files).filter(isXlsx);
    if (!list.length) { toast('Hãy chọn file Excel (.xlsx)'); return; }
    Promise.all(list.map(function (f) {
      return readFile(f).then(function (r) { return r; }, function (e) { return { __err: e.message }; });
    })).then(function (res) {
      const errs = res.filter(function (r) { return r.__err; }).map(function (r) { return r.__err; });
      const good = res.filter(function (r) { return !r.__err; });
      good.forEach(function (r) {
        const bucket = r.kind === 'BONUS' ? state.bonusReports : state.reports;
        const i = bucket.findIndex(function (x) { return x.period.name === r.period.name; });
        if (i >= 0) bucket[i] = r; else bucket.push(r);
      });
      const byDate = function (a, b) {
        const t = function (r) { return r.period.from ? r.period.from.getTime() : 0; };
        return t(a) - t(b) || String(a.period.name).localeCompare(String(b.period.name));
      };
      state.reports.sort(byDate);
      state.bonusReports.sort(byDate);
      const label = state.reports.map(function (r) { return r.period.name; })
        .concat(state.bonusReports.map(function (r) { return r.period.name + ' (phụ cấp)'; }));
      if (errs.length) showBanner('#dashBanner', 'warn', 'Một số file không nạp được', errs);
      else if (label.length) showBanner('#dashBanner', 'ok',
        'Đã nạp ' + label.length + ' kỳ: ' + label.join(', '), []);
      renderDashboard();
    });
  }

  function renderDashboard() {
    const rs = state.reports, bs = state.bonusReports;
    const any = rs.length || bs.length;
    $('#dashEmpty').style.display = any ? 'none' : 'block';
    $('#dashContent').style.display = rs.length ? 'block' : 'none';
    $('#dashBonusContent').style.display = bs.length ? 'block' : 'none';
    $('#fileList').innerHTML = rs.map(function (r, i) {
      return '<span class="file-chip"><b>' + esc(r.period.name) + '</b> ' + esc(r.fileName) +
        '<button data-drop="' + i + '" title="Bỏ kỳ này">×</button></span>';
    }).concat(bs.map(function (r, i) {
      return '<span class="file-chip bonus"><b>' + esc(r.period.name) + '</b> ' + esc(r.fileName) +
        '<button data-bdrop="' + i + '" title="Bỏ kỳ này">×</button></span>';
    })).join('');
    if (bs.length) renderBonusDashboard(bs);
    if (!rs.length) return;

    const sum = function (key) { return rs.reduce(function (a, r) { return a + r.totals[key]; }, 0); };
    $('#dashMetrics').innerHTML = [
      m('SỐ KỲ', rs.length),
      m('TỔNG GROSS', short(sum('Incentive_Gross'))),
      m('TỔNG THUẾ', short(sum('Thue_TNCN'))),
      m('TỔNG THỰC NHẬN', short(sum('Incentive_Thuc_Nhan')), true)
    ].join('');

    /* gộp người theo kỳ */
    const names = [];
    const byPerson = {};
    rs.forEach(function (r) {
      r.people.forEach(function (p) {
        const k = p.maNV || p.hoTen;
        if (!byPerson[k]) { byPerson[k] = { maNV: p.maNV, hoTen: p.hoTen, per: {}, total: 0 }; names.push(k); }
        byPerson[k].per[r.period.name] = (byPerson[k].per[r.period.name] || 0) + p.Incentive_Thuc_Nhan;
        byPerson[k].total += p.Incentive_Thuc_Nhan;
      });
    });
    const people = names.map(function (k) { return byPerson[k]; })
      .sort(function (a, b) { return b.total - a.total; });

    barChart($('#chartPeriod'), rs.map(function (r) {
      return { label: r.period.name, value: r.totals.Incentive_Thuc_Nhan };
    }));
    groupedChart($('#chartPeople'), rs.map(function (r) { return r.period.name; }), people.slice(0, 8));

    $('#dashBody').innerHTML = people.map(function (p, i) {
      return '<tr><td>' + (i + 1) + '</td><td><code>' + esc(p.maNV) + '</code></td><td><strong>' + esc(p.hoTen) + '</strong></td>' +
        rs.map(function (r) { return '<td class="num">' + vnd(p.per[r.period.name] || 0) + '</td>'; }).join('') +
        '<td class="num"><strong>' + vnd(p.total) + '</strong></td></tr>';
    }).join('');
    $('#dashHead').innerHTML = '<tr><th>#</th><th>Mã NV</th><th>Họ tên</th>' +
      rs.map(function (r) { return '<th class="num">' + esc(r.period.name) + '</th>'; }).join('') +
      '<th class="num">Cộng dồn</th></tr>';
    $('#dashFoot').innerHTML = '<tr><td colspan="3">TỔNG ' + people.length + ' người</td>' +
      rs.map(function (r) { return '<td class="num">' + vnd(r.totals.Incentive_Thuc_Nhan) + '</td>'; }).join('') +
      '<td class="num">' + vnd(sum('Incentive_Thuc_Nhan')) + '</td></tr>';
    $('#dashCount').textContent = people.length + ' người';
  }

  function renderBonusDashboard(bs) {
    const sum = function (key) { return bs.reduce(function (a, r) { return a + r.totals[key]; }, 0); };
    $('#dashBonusMetrics').innerHTML = [
      m('SỐ KỲ', bs.length),
      m('CA TRỰC · CHUYẾN OPS', sum('So_Ca_Truc') + ' · ' + sum('So_Chuyen_OPS')),
      m('TỔNG TRỰC ĐÊM', short(sum('PC_TrucDem'))),
      m('TỔNG OPS', short(sum('Phi_OPS'))),
      m('TỔNG THỰC NHẬN', short(sum('PC_Thuc_Nhan')), true)
    ].join('');

    const names = [];
    const byPerson = {};
    bs.forEach(function (r) {
      r.people.forEach(function (p) {
        const k = p.maNV || p.hoTen;
        if (!byPerson[k]) { byPerson[k] = { maNV: p.maNV, hoTen: p.hoTen, per: {}, total: 0 }; names.push(k); }
        byPerson[k].per[r.period.name] = (byPerson[k].per[r.period.name] || 0) + p.PC_Thuc_Nhan;
        byPerson[k].total += p.PC_Thuc_Nhan;
      });
    });
    const people = names.map(function (k) { return byPerson[k]; })
      .sort(function (a, b) { return b.total - a.total; });

    barChart($('#chartBonusPeriod'), bs.map(function (r) {
      return { label: r.period.name, value: r.totals.PC_Thuc_Nhan };
    }));
    stackedChart($('#chartBonusSplit'), bs.map(function (r) { return r.period.name; }), [
      { label: 'Trực đêm', color: '#4d148c', values: bs.map(function (r) { return r.totals.PC_TrucDem; }) },
      { label: 'OPS', color: '#147a50', values: bs.map(function (r) { return r.totals.Phi_OPS; }) }
    ]);

    $('#dashBonusHead').innerHTML = '<tr><th>#</th><th>Mã NV</th><th>Họ tên</th>' +
      bs.map(function (r) { return '<th class="num">' + esc(r.period.name) + '</th>'; }).join('') +
      '<th class="num">Cộng dồn</th></tr>';
    $('#dashBonusBody').innerHTML = people.map(function (p, i) {
      return '<tr><td>' + (i + 1) + '</td><td><code>' + esc(p.maNV) + '</code></td>' +
        '<td><strong>' + esc(p.hoTen) + '</strong></td>' +
        bs.map(function (r) { return '<td class="num">' + vnd(p.per[r.period.name] || 0) + '</td>'; }).join('') +
        '<td class="num"><strong>' + vnd(p.total) + '</strong></td></tr>';
    }).join('');
    $('#dashBonusFoot').innerHTML = '<tr><td colspan="3">TỔNG ' + people.length + ' người</td>' +
      bs.map(function (r) { return '<td class="num">' + vnd(r.totals.PC_Thuc_Nhan) + '</td>'; }).join('') +
      '<td class="num">' + vnd(sum('PC_Thuc_Nhan')) + '</td></tr>';
    $('#dashBonusCount').textContent = people.length + ' người';
  }

  /* ------------------------------------------------------------------ vẽ biểu đồ */

  function setupCanvas(cv, h) {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.parentElement.clientWidth - 2;
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.font = '11px ' + getComputedStyle(document.body).fontFamily;
    return { g: g, w: w, h: h };
  }
  function axis(g, w, h, pad, max) {
    g.strokeStyle = '#e6e2ee'; g.fillStyle = '#787286'; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (h - pad.t - pad.b) * (1 - i / 4);
      g.beginPath(); g.moveTo(pad.l, y + .5); g.lineTo(w - pad.r, y + .5); g.stroke();
      g.textAlign = 'right'; g.fillText(short(max * i / 4), pad.l - 6, y + 3.5);
    }
  }
  function barChart(cv, data) {
    const { g, w, h } = setupCanvas(cv, 260);
    if (!data.length) return;
    const pad = { l: 54, r: 10, t: 12, b: 28 };
    const max = Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.15 || 1;
    axis(g, w, h, pad, max);
    const iw = (w - pad.l - pad.r) / data.length;
    data.forEach(function (d, i) {
      const bw = Math.min(iw * .55, 64);
      const x = pad.l + iw * i + (iw - bw) / 2;
      const bh = (h - pad.t - pad.b) * (d.value / max);
      const y = h - pad.b - bh;
      const grad = g.createLinearGradient(0, y, 0, h - pad.b);
      grad.addColorStop(0, '#6b2bb0'); grad.addColorStop(1, '#4d148c');
      g.fillStyle = grad; roundRect(g, x, y, bw, bh, 5); g.fill();
      g.fillStyle = '#201c28'; g.textAlign = 'center'; g.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
      g.fillText(short(d.value), x + bw / 2, y - 6);
      g.fillStyle = '#787286'; g.font = '11px ' + getComputedStyle(document.body).fontFamily;
      g.fillText(d.label, x + bw / 2, h - pad.b + 15);
    });
  }
  /* Cột chồng: mỗi kỳ một cột, các lớp xếp lên nhau. */
  function stackedChart(cv, periods, series) {
    const { g, w, h } = setupCanvas(cv, 260);
    if (!periods.length) return;
    const pad = { l: 54, r: 10, t: 12, b: 28 };
    const totals = periods.map(function (_, i) {
      return series.reduce(function (a, s) { return a + (s.values[i] || 0); }, 0);
    });
    const max = Math.max.apply(null, totals) * 1.15 || 1;
    axis(g, w, h, pad, max);
    const iw = (w - pad.l - pad.r) / periods.length;
    periods.forEach(function (q, i) {
      const bw = Math.min(iw * .55, 64);
      const x = pad.l + iw * i + (iw - bw) / 2;
      let base = h - pad.b;
      series.forEach(function (s) {
        const v = s.values[i] || 0;
        if (v <= 0) return;
        const bh = (h - pad.t - pad.b) * (v / max);
        g.fillStyle = s.color;
        roundRect(g, x, base - bh, bw, bh, 3); g.fill();
        base -= bh;
      });
      g.fillStyle = '#201c28'; g.textAlign = 'center';
      g.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
      g.fillText(short(totals[i]), x + bw / 2, base - 6);
      g.fillStyle = '#787286'; g.font = '11px ' + getComputedStyle(document.body).fontFamily;
      g.fillText(q, x + bw / 2, h - pad.b + 15);
    });
    cv.parentElement.querySelector('.legend').innerHTML = series.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + esc(s.label) + '</span>';
    }).join('');
  }

  const PALETTE = ['#4d148c', '#ff6200', '#1a5fb4', '#0f7b4f', '#9a6300', '#b42318', '#6b2bb0', '#00857a'];
  function groupedChart(cv, periods, people) {
    const { g, w, h } = setupCanvas(cv, 260);
    if (!people.length) return;
    const pad = { l: 54, r: 10, t: 12, b: 44 };
    const max = Math.max.apply(null, people.map(function (p) {
      return Math.max.apply(null, periods.map(function (q) { return p.per[q] || 0; }));
    })) * 1.15 || 1;
    axis(g, w, h, pad, max);
    const iw = (w - pad.l - pad.r) / periods.length;
    const bw = Math.max(3, Math.min((iw * .8) / people.length, 22));
    periods.forEach(function (q, qi) {
      const start = pad.l + iw * qi + (iw - bw * people.length) / 2;
      people.forEach(function (p, pi) {
        const v = p.per[q] || 0;
        const bh = (h - pad.t - pad.b) * (v / max);
        g.fillStyle = PALETTE[pi % PALETTE.length];
        roundRect(g, start + bw * pi, h - pad.b - bh, bw - 1.5, bh, 2); g.fill();
      });
      g.fillStyle = '#787286'; g.textAlign = 'center';
      g.font = '11px ' + getComputedStyle(document.body).fontFamily;
      g.fillText(q, pad.l + iw * qi + iw / 2, h - pad.b + 15);
    });
    cv.parentElement.querySelector('.legend').innerHTML = people.map(function (p, i) {
      return '<span><i style="background:' + PALETTE[i % PALETTE.length] + '"></i>' + esc(p.hoTen) + '</span>';
    }).join('');
  }
  function roundRect(g, x, y, w, h, r) {
    if (h <= 0) { g.beginPath(); return; }
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, 0);
    g.arcTo(x, y + h, x, y, 0); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /* ------------------------------------------------------------------ khởi động */

  function bindDrop(zone, input, handler) {
    zone.addEventListener('click', function (e) { if (e.target.tagName !== 'INPUT') input.click(); });
    zone.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); input.click();
    });
    input.addEventListener('change', function () { handler(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('over'); });
    });
    zone.addEventListener('drop', function (e) { handler(e.dataTransfer.files); });
  }

  function init(assets) {
    state.logo = assets.logo; state.fonts = assets.fonts;

    if (assets.logo) $$('.brand img').forEach(function (i) { i.src = assets.logo; });

    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tab').forEach(function (x) { x.classList.remove('active'); });
        $$('.panel').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        const which = t.dataset.tab;
        $('#panel-' + which).classList.add('active');
        if (which === 'dash' && (state.reports.length || state.bonusReports.length)) renderDashboard();
        /* Chip kỳ báo cáo bám theo thẻ đang mở, tránh hiển thị nhầm kỳ của thẻ kia. */
        const cur = which === 'bonus' ? state.bonus : which === 'slip' ? state.report : null;
        $('#periodChip').innerHTML = '<small>KỲ BÁO CÁO</small><b>' +
          esc(cur ? cur.period.name : '—') + '</b>';
      });
    });

    bindDrop($('#dropSlip'), $('#fileSlip'), loadSingle);
    bindDrop($('#dropBonus'), $('#fileBonus'), loadBonus);
    bindDrop($('#dropDash'), $('#fileDash'), loadMulti);

    $('#peopleBody').addEventListener('click', function (e) {
      const b = e.target.closest('[data-slip]'); if (!b) return;
      const p = state.report.people[+b.dataset.slip];
      $('#dlgTitle').textContent = 'Phiếu incentive · ' + p.hoTen;
      $('#dlgBody').innerHTML = slipHtml(state.report, p);
      $('#dlg').dataset.person = b.dataset.slip;
      $('#dlg').dataset.kind = 'INCENTIVE';
      $('#dlg').showModal();
    });
    $('#bonusBody').addEventListener('click', function (e) {
      const b = e.target.closest('[data-bslip]'); if (!b) return;
      const p = state.bonus.people[+b.dataset.bslip];
      $('#dlgTitle').textContent = 'Phiếu phụ cấp · ' + p.hoTen;
      $('#dlgBody').innerHTML = bonusSlipHtml(state.bonus, p);
      $('#dlg').dataset.person = b.dataset.bslip;
      $('#dlg').dataset.kind = 'BONUS';
      $('#dlg').showModal();
    });
    $('#dlgClose').addEventListener('click', function () { $('#dlg').close(); });
    $('#dlgPdf').addEventListener('click', function () {
      const dlg = $('#dlg'), i = +dlg.dataset.person;
      if (dlg.dataset.kind === 'BONUS') {
        const p = state.bonus.people[i];
        makeBonusPdf(p).save(BS.fileName(state.bonus, p));
      } else {
        downloadOne(state.report.people[i]);
      }
    });
    $('#dlgPrint').addEventListener('click', function () {
      document.body.classList.remove('printing-all'); window.print();
    });

    $('#btnZip').addEventListener('click', downloadZip);
    $('#btnPrintAll').addEventListener('click', printAll);
    $('#btnCsv').addEventListener('click', exportCsv);
    $('#btnBonusZip').addEventListener('click', downloadBonusZip);
    $('#btnBonusPrintAll').addEventListener('click', printAllBonus);
    $('#btnBonusCsv').addEventListener('click', exportBonusCsv);

    $('#fileList').addEventListener('click', function (e) {
      const b = e.target.closest('[data-drop]');
      if (b) { state.reports.splice(+b.dataset.drop, 1); renderDashboard(); return; }
      const c = e.target.closest('[data-bdrop]');
      if (c) { state.bonusReports.splice(+c.dataset.bdrop, 1); renderDashboard(); }
    });

    window.addEventListener('afterprint', function () {
      document.body.classList.remove('printing-all'); $('#printArea').innerHTML = '';
    });
    window.addEventListener('resize', function () {
      clearTimeout(init._r);
      init._r = setTimeout(function () {
        if (state.reports.length || state.bonusReports.length) renderDashboard();
      }, 200);
    });
  }

  window.IncalUI = { init: init };
})();
