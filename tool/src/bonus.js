/* ==========================================================================
   INCAL BONUS — đọc file Excel PHỤ CẤP (trực đêm + OPS) và dựng dữ liệu phiếu.
   Cùng nguyên tắc với core.js: không tính lại bất kỳ công thức nào,
   chỉ đọc giá trị Excel đã lưu sẵn.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(
    typeof require === 'function' ? require('./core.js') : null);
  else root.IncalBonus = factory(root.IncalCore);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  'use strict';

  function C() { return Core || (typeof window !== 'undefined' ? window.IncalCore : null); }

  function txt(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function num(v) { const n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : 0; }

  function excelDate(v) {
    if (v instanceof Date) return v;
    if (typeof v !== 'number') return null;
    return new Date(Math.round((v - 25569) * 86400 * 1000));
  }

  /* Excel lưu giờ dưới dạng phân số của một ngày. 0,916666 -> "22:00". */
  function hhmm(v) {
    if (v === undefined || v === null || v === '') return '';
    if (v instanceof Date) {
      return String(v.getHours()).padStart(2, '0') + ':' + String(v.getMinutes()).padStart(2, '0');
    }
    if (typeof v !== 'number') return txt(v);
    const mins = Math.round((v % 1) * 24 * 60);
    return String(Math.floor(mins / 60) % 24).padStart(2, '0') + ':' +
      String(mins % 60).padStart(2, '0');
  }

  const NAMES = ['ky_ten', 'ky_bat_dau', 'ky_ket_thuc', 'loai_bang',
    'gio_dem_bat_dau', 'gio_dem_ket_thuc', 'gio_loi_bat_dau', 'gio_loi_ket_thuc',
    'rate_gio_bien', 'rate_gio_loi', 'he_so_le', 'bca_spark', 'bca_blaze',
    'ops_0600_0800', 'ops_0800_1800', 'ops_1800_2200', 'ops_2200_0100',
    'ops_0100_0600', 'ops_phu_troi_le', 'ops_kg_1nguoi', 'ops_nguoi_toi_da',
    'giam_tru_ca_nhan_thang', 'giam_tru_phu_thuoc_thang', 'rate_khau_tru_vang_lai'];

  const PAYOUT_FIELDS = [
    'So_Ca_Truc', 'So_Chuyen_OPS', 'PC_TrucDem', 'Phi_OPS', 'Tong_PC_Gross',
    'BHXH', 'Giam_Tru_Ap_Dung', 'TN_Chiu_Thue', 'Thue_TNCN', 'Cong_Tru_Khac',
    'PC_Thuc_Nhan'
  ];
  /* Cột do công thức sinh ra — dùng để phát hiện file chưa được Excel lưu. */
  const KEY_FIELDS = ['Tong_PC_Gross', 'TN_Chiu_Thue', 'PC_Thuc_Nhan'];

  /* Nhận diện: đúng file phụ cấp thì mới nhận, tránh nuốt nhầm file incentive. */
  function looksLikeBonus(wb) {
    const S = wb.Sheets || {};
    if (S.Calc_TrucDem || S.Calc_OPS) return true;
    const core = C();
    return core ? txt(core.namedValue(wb, 'loai_bang')) === 'PHU_CAP' : false;
  }

  function parse(wb, fileName) {
    const core = C();
    if (!core) throw new Error('Thiếu IncalCore.');
    const warnings = [];
    const S = wb.Sheets;

    const need = ['Assumption', 'Data', 'Payout'];
    const missing = need.filter(function (n) { return !S[n]; });
    if (missing.length) {
      throw new Error('File không đúng mẫu Phụ cấp. Thiếu sheet: ' + missing.join(', '));
    }
    if (!S.Calc_TrucDem && !S.Calc_OPS) {
      throw new Error('File không đúng mẫu Phụ cấp. Thiếu sheet Calc_TrucDem / Calc_OPS. ' +
        'Có phải anh đang thả nhầm file Incentive vào thẻ Phụ cấp?');
    }

    /* --- tham số & kỳ --- */
    const params = {};
    NAMES.forEach(function (n) {
      const v = core.namedValue(wb, n);
      if (v !== undefined) params[n] = v;
    });
    if (params.ky_ten === undefined) {
      warnings.push('Không đọc được tên kỳ (ky_ten). Dùng tên file thay thế.');
    }
    const period = {
      name: txt(params.ky_ten) || (fileName || '').replace(/\.xlsx?$/i, ''),
      from: excelDate(params.ky_bat_dau),
      to: excelDate(params.ky_ket_thuc)
    };

    /* --- nhân sự trong Assumption --- */
    const staff = core.readTable(S.Assumption, 'Ma_NV', 0, 10).rows;
    const staffByName = {};
    staff.forEach(function (s) { if (txt(s.Ho_Ten)) staffByName[txt(s.Ho_Ten)] = s; });

    /* --- nhật ký ca: neo vào tiêu đề "Ngay" (khớp chính xác, khác "Loai_Ngay") --- */
    const shiftTbl = core.readTable(S.Data, 'Ngay', 0, 30);
    const shifts = shiftTbl.rows
      .filter(function (s) { return txt(s.Ho_Ten); })
      .map(function (s) {
        return {
          ngay: excelDate(s.Ngay), maNV: txt(s.Ma_NV), hoTen: txt(s.Ho_Ten),
          loaiCa: txt(s.Loai_Ca), loaiNgay: txt(s.Loai_Ngay),
          gioBatDau: hhmm(s.Gio_Bat_Dau), gioKetThuc: hhmm(s.Gio_Ket_Thuc),
          maJob: txt(s.Ma_Job), trongLuong: num(s.Trong_Luong_Kg),
          soNhanSu: num(s.So_Nhan_Su), backup: txt(s.Backup_Nhan_Ca),
          gioBien: num(s.Gio_Bien), gioLoi: num(s.Gio_Loi), tongGio: num(s.Tong_Gio),
          mucBCA: txt(s.Muc_BCA), pcGio: num(s.PC_Gio), thuongBCA: num(s.Thuong_BCA),
          pcTrucDem: num(s.PC_TrucDem), phiOPS: num(s.Phi_OPS), tongDong: num(s.Tong_Dong),
          canhBao: txt(s.Canh_Bao), ghiChu: txt(s.Ghi_Chu)
        };
      });
    if (!shifts.length) warnings.push('Không đọc được dòng ca nào trong sheet Data.');

    const byName = function (arr) {
      const m = {};
      arr.forEach(function (r) { if (txt(r.Ho_Ten)) m[txt(r.Ho_Ten)] = r; });
      return m;
    };
    const trucByName = byName(S.Calc_TrucDem ? core.readTable(S.Calc_TrucDem, 'Ma_NV', 0, 14).rows : []);
    const opsByName = byName(S.Calc_OPS ? core.readTable(S.Calc_OPS, 'Ma_NV', 0, 10).rows : []);

    /* --- Payout --- */
    const pt = core.readTable(S.Payout, 'Ma_NV', 0, 18);
    if (pt.headerRow < 0) throw new Error('Không tìm thấy bảng Payout (cột Ma_NV).');

    let blank = 0;
    const people = pt.rows.filter(function (r) { return txt(r.Ma_NV); }).map(function (r) {
      const name = txt(r.Ho_Ten);
      const p = {
        maNV: txt(r.Ma_NV), hoTen: name, stt: num(r.STT),
        boPhan: txt(r.Bo_Phan) || (staffByName[name] ? txt(staffByName[name].Bo_Phan) : ''),
        cachTinhThue: txt(r.Cach_Tinh_Thue)
      };
      PAYOUT_FIELDS.forEach(function (k) { p[k] = num(r[k]); });

      const hasValue = KEY_FIELDS.some(function (k) { return typeof r[k] === 'number'; });
      if (!hasValue) blank++;
      p.__blank = !hasValue;

      p.shifts = shifts.filter(function (s) { return s.hoTen === name; });
      p.shiftSummary = summarise(p.shifts);
      p.truc = trucByName[name] || null;
      p.ops = opsByName[name] || null;
      p.staff = staffByName[name] || null;
      p.groups = [];
      if (p.So_Ca_Truc > 0 || p.PC_TrucDem > 0) p.groups.push('TRUC_DEM');
      if (p.So_Chuyen_OPS > 0 || p.Phi_OPS > 0) p.groups.push('OPS');
      return p;
    });

    if (blank === people.length && people.length > 0) {
      warnings.push('CHẶN: file không chứa số đã tính. Excel chỉ ghi lại kết quả công thức khi anh ' +
        'mở file bằng Excel và bấm Lưu. Hãy mở file, bấm Lưu, rồi nạp lại.');
    } else if (blank > 0) {
      warnings.push('CHẶN: ' + blank + '/' + people.length + ' dòng trong Payout không có số đã tính. ' +
        'Mở file bằng Excel, bấm Lưu, rồi nạp lại.');
    }

    /* --- đối chiếu: cộng từ nhật ký ca so với Payout --- */
    if (!blank) {
      people.forEach(function (p) {
        const fromLog = p.shiftSummary.tong;
        if (Math.abs(fromLog - p.Tong_PC_Gross) > 1) {
          warnings.push('Lệch phụ cấp của ' + p.hoTen + ': bảng chi ' + Math.round(p.Tong_PC_Gross) +
            ' nhưng cộng từ nhật ký ca ra ' + Math.round(fromLog) + '.');
        }
      });
      const orphan = {};
      shifts.forEach(function (s) {
        if (!people.some(function (p) { return p.hoTen === s.hoTen; })) orphan[s.hoTen] = true;
      });
      Object.keys(orphan).forEach(function (n) {
        warnings.push('Có ca của "' + n + '" trong sheet Data nhưng không có dòng trong Payout. ' +
          'Kiểm tra chính tả họ tên hoặc bổ sung vào danh sách nhân sự.');
      });
      shifts.forEach(function (s) {
        if (s.canhBao) {
          warnings.push('Ca ngày ' + fmtDate(s.ngay) + ' của ' + s.hoTen + ': ' + s.canhBao + '.');
        }
      });
    }

    const totals = {};
    PAYOUT_FIELDS.forEach(function (k) {
      totals[k] = people.reduce(function (s, p) { return s + p[k]; }, 0);
    });

    return {
      kind: 'BONUS', fileName: fileName || '', period: period, params: params,
      warnings: warnings, people: people, totals: totals, shifts: shifts,
      staff: staff
    };
  }

  function fmtDate(d) {
    if (!d) return '';
    const p = function (x) { return String(x).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function summarise(list) {
    const s = {
      count: list.length, caTruc: 0, chuyenOPS: 0, caLe: 0,
      gioBien: 0, gioLoi: 0, tongGio: 0, spark: 0, blaze: 0,
      pcGio: 0, thuongBCA: 0, pcTrucDem: 0, phiOPS: 0, tong: 0, tongKG: 0
    };
    list.forEach(function (x) {
      if (x.loaiCa === 'OPS') { s.chuyenOPS++; s.tongKG += x.trongLuong; }
      else s.caTruc++;
      if (x.loaiNgay === 'Lễ') s.caLe++;
      if (x.mucBCA === 'Spark') s.spark++;
      if (x.mucBCA === 'Blaze') s.blaze++;
      s.gioBien += x.gioBien; s.gioLoi += x.gioLoi; s.tongGio += x.tongGio;
      s.pcGio += x.pcGio; s.thuongBCA += x.thuongBCA;
      s.pcTrucDem += x.pcTrucDem; s.phiOPS += x.phiOPS; s.tong += x.tongDong;
    });
    return s;
  }

  /* Nhãn khung giờ dựng từ tham số trong file, KHÔNG viết cứng —
     đổi chính sách trong Excel thì phiếu tự đổi theo. */
  function nhanKhung(params) {
    const p = params || {};
    const d1 = hhmm(p.gio_dem_bat_dau), d2 = hhmm(p.gio_dem_ket_thuc);
    const l1 = hhmm(p.gio_loi_bat_dau), l2 = hhmm(p.gio_loi_ket_thuc);
    if (!d1 || !d2 || !l1 || !l2) return { bien: 'Khung biên', loi: 'Khung lõi' };
    const doan = [];
    if (d1 !== l1) doan.push(d1 + '–' + l1);
    if (l2 !== d2) doan.push(l2 + '–' + d2);
    return {
      bien: 'Khung biên ' + (doan.join(' & ') || '—'),
      loi: 'Khung lõi ' + l1 + '–' + l2
    };
  }

  return {
    parse: parse, looksLikeBonus: looksLikeBonus,
    summarise: summarise, hhmm: hhmm, fmtDate: fmtDate, nhanKhung: nhanKhung
  };
});
