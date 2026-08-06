/* ==========================================================================
   INCAL CORE — đọc file Excel Incentive (v6 trở lên) và dựng dữ liệu phiếu.
   Không tính toán lại bất kỳ công thức nào: chỉ đọc giá trị Excel đã lưu.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IncalCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- tiện ích ô ---------- */

  function colName(n) {              // 0 -> A, 26 -> AA
    let s = '';
    n += 1;
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
    return s;
  }
  function colIndex(s) {             // 'A' -> 0
    let n = 0;
    for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
    return n - 1;
  }
  function cell(ws, r, c) { return ws[colName(c) + (r + 1)]; }     // r,c là chỉ số từ 0
  function val(ws, r, c) { const x = cell(ws, r, c); return x ? x.v : undefined; }
  function formula(ws, r, c) { const x = cell(ws, r, c); return x && x.f ? x.f : ''; }
  function txt(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function num(v) { const n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : 0; }

  function sheetBounds(ws) {
    const ref = ws['!ref'] || 'A1:A1';
    const [a, b] = ref.split(':');
    const pa = a.match(/([A-Z]+)(\d+)/), pb = (b || a).match(/([A-Z]+)(\d+)/);
    return { r0: +pa[2] - 1, c0: colIndex(pa[1]), r1: +pb[2] - 1, c1: colIndex(pb[1]) };
  }

  /* Tìm ô chứa đúng nhãn `key`, trả về {r, c}. occurrence=0 là lần đầu. */
  function findLabel(ws, key, occurrence) {
    const b = sheetBounds(ws);
    let seen = 0;
    for (let r = b.r0; r <= b.r1; r++) {
      for (let c = b.c0; c <= Math.min(b.c1, b.c0 + 60); c++) {
        if (txt(val(ws, r, c)) === key) {
          if (seen === (occurrence || 0)) return { r: r, c: c };
          seen++;
        }
      }
    }
    return null;
  }

  /* Đọc một bảng: hàng tiêu đề chứa `key`, dữ liệu chạy tới khi cột key rỗng.
     Tiêu đề dừng ở ô trống đầu tiên — tránh nuốt sang bảng bên cạnh. */
  function readTable(ws, key, occurrence, maxCols) {
    const at = findLabel(ws, key, occurrence);
    if (!at) return { headers: [], rows: [], headerRow: -1, keyCol: -1 };
    const b = sheetBounds(ws);
    const cEnd = Math.min(b.c1, at.c + (maxCols || 40));
    const headers = [];
    for (let c = at.c; c <= cEnd; c++) {
      const name = txt(val(ws, at.r, c));
      if (!name) break;
      headers.push({ name: name, col: c });
    }

    const rows = [];
    for (let r = at.r + 1; r <= b.r1; r++) {
      const k = txt(val(ws, r, at.c));
      if (!k) break;
      const o = { __row: r };
      headers.forEach(function (h) { if (h.name) o[h.name] = val(ws, r, h.col); });
      rows.push(o);
    }
    return { headers: headers, rows: rows, headerRow: at.r, keyCol: at.c };
  }

  /* ---------- named range ---------- */

  function namedValue(wb, name) {
    const names = (wb.Workbook && wb.Workbook.Names) || [];
    const hit = names.find(function (n) { return n.Name === name; });
    if (!hit || !hit.Ref) return undefined;
    const m = String(hit.Ref).match(/^'?([^'!]+)'?!\$?([A-Z]+)\$?(\d+)/);
    if (!m) return undefined;
    const ws = wb.Sheets[m[1]];
    if (!ws) return undefined;
    const c = ws[m[2] + m[3]];
    return c ? c.v : undefined;
  }

  /* Dự phòng khi file không có named range: đọc bảng tham số theo cột "Named Range". */
  function paramsFromAssumption(ws) {
    const out = {};
    if (!ws) return out;
    const b = sheetBounds(ws);
    for (let r = b.r0; r <= b.r1; r++) {
      for (let c = b.c0; c <= Math.min(b.c1, b.c0 + 12); c++) {
        const key = txt(val(ws, r, c));
        if (/^[a-z][a-z0-9_]{2,}$/.test(key) && key !== 'text' && key !== 'date') {
          // cột "Giá trị" nằm ở D khi "Named Range" ở G — lùi 3 cột
          const v = val(ws, r, c - 3);
          if (v !== undefined) out[key] = v;
        }
      }
    }
    return out;
  }

  /* ---------- Excel serial date ---------- */

  function excelDate(v) {
    if (v instanceof Date) return v;
    if (typeof v !== 'number') return null;
    const ms = Math.round((v - 25569) * 86400 * 1000);
    return new Date(ms);
  }

  /* ---------- đọc toàn bộ workbook ---------- */

  const PAYOUT_FIELDS = [
    'Incentive_Gross', 'TN_Luong_Chiu_Thue', 'Phi_OPS', 'BHXH', 'Giam_Tru',
    'TN_Chiu_Thue', 'Thue_TNCN', 'Thue_Da_Tru_Luong', 'Thue_Da_Tru_OPS',
    'Thue_Phai_Nop', 'Cong_Tru_Khac', 'Incentive_Thuc_Nhan'
  ];
  /* Các cột do công thức sinh ra — dùng để phát hiện file chưa được Excel lưu. */
  const KEY_FIELDS = ['Incentive_Gross', 'TN_Chiu_Thue', 'Thue_TNCN', 'Incentive_Thuc_Nhan'];

  function parse(wb, fileName) {
    const warnings = [];
    const S = wb.Sheets;
    const need = ['Assumption', 'Data', 'Payout'];
    const missing = need.filter(function (n) { return !S[n]; });
    if (missing.length) {
      throw new Error('File không đúng mẫu Incentive. Thiếu sheet: ' + missing.join(', '));
    }

    /* --- tham số & kỳ --- */
    const params = {};
    const NAMES = ['ky_ten', 'ky_bat_dau', 'ky_ket_thuc', 'tygia_usd_vnd', 'rate_muc1',
      'rate_muc2', 'rate_muc3', 'khmoi_step', 'incentive_floor', 'rate_bpsale',
      'bpsale_step_cong', 'bpsale_step_tru', 'bpsale_cap_cong', 'bpsale_cap_tru',
      'head_ma_nv', 'head_bonus_apply', 'pool_kae_admin', 'pool_kae_sale', 'rate_bo',
      'phat_no_ratio', 'phat_60plus_giam', 'giam_tru_ca_nhan_quy', 'giam_tru_phu_thuoc_quy'];
    NAMES.forEach(function (n) { const v = namedValue(wb, n); if (v !== undefined) params[n] = v; });
    if (params.ky_ten === undefined) {
      Object.assign(params, paramsFromAssumption(S.Assumption));
      if (params.ky_ten === undefined) warnings.push('Không đọc được tên kỳ (ky_ten). Dùng tên file thay thế.');
    }
    const period = {
      name: txt(params.ky_ten) || (fileName || '').replace(/\.xlsx?$/i, ''),
      from: excelDate(params.ky_bat_dau),
      to: excelDate(params.ky_ket_thuc)
    };

    /* --- danh sách nhân sự trong Assumption (Team, lương, target) --- */
    const staff = readTable(S.Assumption, 'Ma_NV', 0, 20).rows;
    const staffByName = {};
    staff.forEach(function (s) { if (txt(s.Ho_Ten)) staffByName[txt(s.Ho_Ten)] = s; });

    /* --- jobs --- */
    const jobsTbl = readTable(S.Data, 'Thang', 0, 20);
    const jobs = jobsTbl.rows
      .filter(function (j) { return txt(j.Ma_Job); })
      .map(function (j) {
        return {
          thang: num(j.Thang), maJob: txt(j.Ma_Job), sale: txt(j.Sale),
          khachHang: txt(j.Khach_Hang), nhomSP: txt(j.Nhom_SP), product: txt(j.Product),
          team: txt(j.Team), doanhThu: num(j.Doanh_Thu), chiPhi: num(j.Chi_Phi),
          profit: num(j.Profit), paidStatus: txt(j.Paid_Status),
          khLoai: txt(j.KH_Loai), kae: txt(j.KAE)
        };
      });
    if (!jobs.length) warnings.push('Không đọc được dòng job nào trong sheet Data.');

    /* --- các bảng tính --- */
    const calcSale = S.Calc_Sale ? readTable(S.Calc_Sale, 'Ma_NV', 0, 24).rows : [];
    const calcKae = S.Calc_KAE ? readTable(S.Calc_KAE, 'Ma_NV', 0, 14).rows : [];
    const calcOther = S.Calc_Other ? readTable(S.Calc_Other, 'Ma_NV', 0, 10).rows : [];
    const kaePool = S.Calc_KAE ? readTable(S.Calc_KAE, 'Nguon', 0, 10).rows : [];
    const kaeCount = S.Calc_KAE ? readTable(S.Calc_KAE, 'Thang', 0, 4).rows : [];

    const byName = function (arr) {
      const m = {}; arr.forEach(function (r) { if (txt(r.Ho_Ten)) m[txt(r.Ho_Ten)] = r; }); return m;
    };
    const saleByName = byName(calcSale), kaeByName = byName(calcKae), otherByName = byName(calcOther);

    /* --- Payout --- */
    const pt = readTable(S.Payout, 'Ma_NV', 0, 16);
    if (pt.headerRow < 0) throw new Error('Không tìm thấy bảng Payout (cột Ma_NV).');

    let blank = 0;
    const people = pt.rows.filter(function (r) { return txt(r.Ma_NV); }).map(function (r) {
      const name = txt(r.Ho_Ten);
      const f = formula(S.Payout, r.__row, pt.keyCol + 2);   // cột Incentive_Gross
      const groups = [];
      if (/Calc_Sale/.test(f) || saleByName[name]) groups.push('SALE');
      if (/Calc_KAE/.test(f) || kaeByName[name]) groups.push('KAE');
      if (/Calc_Other/.test(f) || otherByName[name]) groups.push('BO');

      const p = { maNV: txt(r.Ma_NV), hoTen: name, stt: num(r.STT), groups: groups };
      PAYOUT_FIELDS.forEach(function (k) { p[k] = num(r[k]); });
      /* Ô công thức chưa được Excel lưu thì không có giá trị — đó là dấu hiệu file chưa dùng được. */
      const hasValue = KEY_FIELDS.some(function (k) { return typeof r[k] === 'number'; });
      if (!hasValue) blank++;
      p.__blank = !hasValue;

      p.team = staffByName[name] ? txt(staffByName[name].Team) : (groups[0] || '');
      p.jobs = jobs.filter(function (j) { return j.sale === name; });
      p.jobSummary = summariseJobs(p.jobs);
      p.sale = saleByName[name] || null;
      p.kae = kaeByName[name] || null;
      p.other = otherByName[name] || null;
      return p;
    });

    const allBlank = blank === people.length && people.length > 0;
    if (allBlank) {
      warnings.push('CHẶN: file không chứa số đã tính. Excel chỉ ghi lại kết quả công thức khi bạn ' +
        'mở file bằng Excel và bấm Lưu. Hãy mở file, bấm Lưu, rồi nạp lại.');
    } else if (blank > 0) {
      warnings.push('CHẶN: ' + blank + '/' + people.length + ' dòng trong Payout không có số đã tính. ' +
        'Mở file bằng Excel, bấm Lưu, rồi nạp lại.');
    }

    /* --- đối chiếu: tổng profit từ job so với Calc_Sale --- */
    if (!blank) {
      people.forEach(function (p) {
        if (!p.sale) return;
        const excelTotal = num(p.sale.Profit_Total);
        const jobTotal = p.jobSummary.profit;
        if (Math.abs(excelTotal - jobTotal) > 1) {
          warnings.push('Lệch lợi nhuận của ' + p.hoTen + ': bảng tính ' + Math.round(excelTotal) +
            ' nhưng cộng từ danh sách job ra ' + Math.round(jobTotal) + '.');
        }
      });
    }

    const totals = {};
    PAYOUT_FIELDS.forEach(function (k) {
      totals[k] = people.reduce(function (s, p) { return s + p[k]; }, 0);
    });

    return {
      fileName: fileName || '', period: period, params: params, warnings: warnings,
      people: people, totals: totals, jobs: jobs,
      kaePool: kaePool, kaeCount: kaeCount,
      headBonus: readHeadBonus(S.Calc_Sale)
    };
  }

  function summariseJobs(list) {
    const s = { count: list.length, doanhThu: 0, chiPhi: 0, profit: 0, profitPaid: 0, profitUnpaid: 0 };
    list.forEach(function (j) {
      s.doanhThu += j.doanhThu; s.chiPhi += j.chiPhi; s.profit += j.profit;
      if (/^paid$/i.test(j.paidStatus)) s.profitPaid += j.profit; else s.profitUnpaid += j.profit;
    });
    return s;
  }

  function readHeadBonus(ws) {
    if (!ws) return null;
    const at = findLabel(ws, 'TỔNG HEAD BONUS', 0);
    if (!at) return null;
    for (let c = at.c + 1; c <= at.c + 8; c++) {
      const v = val(ws, at.r, c);
      if (typeof v === 'number') return v;
    }
    return null;
  }

  return {
    parse: parse, readTable: readTable, namedValue: namedValue,
    colName: colName, colIndex: colIndex, summariseJobs: summariseJobs
  };
});
