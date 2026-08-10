/* ==========================================================================
   INCAL BONUS SLIP — dựng phiếu PHỤ CẤP (trực đêm + OPS) PDF khổ A4.
   Cùng bộ font và bảng màu với phiếu incentive.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.IncalBonusSlip = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  root = root || (typeof self !== 'undefined' ? self : {});

  const PURPLE = [77, 20, 140];
  const ORANGE = [255, 98, 0];
  const GREEN = [20, 122, 80];
  const INK = [32, 28, 40];
  const MUTE = [120, 114, 132];
  const LINE = [222, 217, 230];
  const SOFT = [246, 243, 250];

  function vnd(n) {
    const neg = n < 0;
    let s = String(Math.round(Math.abs(n) || 0));
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + s;
  }
  function hrs(n) {
    return (Math.round((n || 0) * 10) / 10).toString().replace('.', ',') + 'h';
  }
  function dmy(d) {
    if (!d) return '';
    const p = function (x) { return String(x).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function num(v) { const n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : 0; }

  const GROUP_LABEL = { TRUC_DEM: 'Trực đêm', OPS: 'OPS sân bay' };

  /* --------------------------------------------------------------------- */

  function build(jsPDFCtor, fonts, report, person, opts) {
    opts = opts || {};
    const doc = new jsPDFCtor({ unit: 'mm', format: 'a4', compress: true });

    doc.addFileToVFS('Montserrat-Regular.ttf', fonts.montserrat.regular);
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
    doc.addFileToVFS('Montserrat-Bold.ttf', fonts.montserrat.bold);
    doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
    doc.addFileToVFS('Quicksand-Regular.ttf', fonts.quicksand.regular);
    doc.addFont('Quicksand-Regular.ttf', 'Quicksand', 'normal');
    doc.addFileToVFS('Quicksand-Bold.ttf', fonts.quicksand.bold);
    doc.addFont('Quicksand-Bold.ttf', 'Quicksand', 'bold');
    doc.setFont('Montserrat', 'normal');

    const W = doc.internal.pageSize.getWidth();
    const M = 14;
    let y = 0;

    /* ---- đầu trang ---- */
    const range = report.period.from && report.period.to
      ? dmy(report.period.from) + ' — ' + dmy(report.period.to) : '';

    if (opts.logo) {
      const lw = 32, lh = lw * (opts.logoRatio || 137 / 871);
      try { doc.addImage(opts.logo, 'PNG', M, 13 - lh / 2, lw, lh); } catch (e) { /* bỏ qua logo lỗi */ }
    } else {
      doc.setFont('Quicksand', 'bold'); doc.setFontSize(13);
      doc.setTextColor.apply(doc, PURPLE);
      doc.text(opts.company || 'TRUSTANA', M, 15);
    }

    doc.setFont('Quicksand', 'bold'); doc.setFontSize(14);
    doc.setTextColor.apply(doc, PURPLE);
    doc.text('PHIẾU PHỤ CẤP', W - M, 12.5, { align: 'right' });
    doc.setFont('Montserrat', 'normal'); doc.setFontSize(8);
    doc.setTextColor.apply(doc, MUTE);
    doc.text('Trực đêm & OPS  ·  ' + (report.period.name || '') + (range ? '  ·  ' + range : ''),
      W - M, 18, { align: 'right' });

    doc.setFillColor.apply(doc, PURPLE); doc.rect(M, 22, W - 2 * M, 0.8, 'F');
    doc.setFillColor.apply(doc, GREEN); doc.rect(M, 22, 26, 0.8, 'F');

    y = 30;

    /* ---- khối nhân viên ---- */
    doc.setDrawColor.apply(doc, LINE);
    doc.setFillColor.apply(doc, SOFT);
    doc.roundedRect(M, y, W - 2 * M, 18, 1.5, 1.5, 'FD');
    doc.setTextColor.apply(doc, MUTE); doc.setFontSize(7.5);
    doc.text('HỌ VÀ TÊN', M + 4, y + 6);
    doc.text('MÃ NHÂN VIÊN', M + 84, y + 6);
    doc.text('BỘ PHẬN', M + 118, y + 6);
    doc.text('KHOẢN HƯỞNG', M + 142, y + 6);
    doc.setTextColor.apply(doc, INK); doc.setFont('Montserrat', 'bold'); doc.setFontSize(11);
    doc.text(person.hoTen || '', M + 4, y + 13);
    doc.setFontSize(9.5);
    doc.text(person.maNV || '', M + 84, y + 13);
    doc.text(person.boPhan || '—', M + 118, y + 13);
    doc.setFontSize(8);
    doc.text(person.groups.map(function (g) { return GROUP_LABEL[g] || g; }).join(' + ') || '—',
      M + 142, y + 13);
    y += 25;

    /* ---- bảng tiền ---- */
    const s = person.shiftSummary;
    const money = [
      ['Phụ cấp theo giờ  (' + hrs(s.gioBien) + ' khung biên + ' + hrs(s.gioLoi) + ' khung lõi)', s.pcGio],
      ['Thưởng BCA  (' + s.spark + ' ca Spark, ' + s.blaze + ' ca Blaze)', s.thuongBCA],
      ['Phụ cấp trực đêm', person.PC_TrucDem, 'sub'],
      ['Phụ cấp OPS  (' + person.So_Chuyen_OPS + ' chuyến)', person.Phi_OPS],
      ['TỔNG PHỤ CẤP (gross)', person.Tong_PC_Gross, 'strong'],
      ['Bảo hiểm xã hội', -Math.abs(person.BHXH)],
      ['Giảm trừ gia cảnh áp dụng', -Math.abs(person.Giam_Tru_Ap_Dung)],
      ['Thu nhập chịu thuế', person.TN_Chiu_Thue, 'sub'],
      ['Thuế TNCN  (' + (person.cachTinhThue || '—') + ')', -Math.abs(person.Thue_TNCN), 'sub'],
      ['Cộng / trừ khác', person.Cong_Tru_Khac]
    ].filter(function (r) { return r[1] !== 0 || r[2]; });

    doc.autoTable({
      startY: y,
      margin: { left: M, right: M },
      head: [['DIỄN GIẢI', 'SỐ TIỀN (VND)']],
      body: money.map(function (r) { return [r[0], vnd(r[1])]; }),
      styles: { font: 'Montserrat', fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
      headStyles: { font: 'Quicksand', fontStyle: 'bold', fontSize: 7.5, fillColor: PURPLE, textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: 'right', font: 'Montserrat' } },
      didParseCell: function (d) {
        if (d.section !== 'body') return;
        const kind = money[d.row.index][2];
        if (kind === 'strong' || kind === 'sub') d.cell.styles.fontStyle = 'bold';
        if (kind === 'sub') d.cell.styles.fillColor = SOFT;
        if (kind === 'strong') d.cell.styles.fillColor = [237, 246, 242];
      }
    });
    y = doc.lastAutoTable.finalY;

    /* ---- dòng THỰC NHẬN ---- */
    doc.setFillColor.apply(doc, ORANGE);
    doc.rect(M, y, W - 2 * M, 13, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('Quicksand', 'bold');
    doc.setFontSize(10); doc.text('PHỤ CẤP THỰC NHẬN', M + 3, y + 8.5);
    doc.setFontSize(13);
    doc.text(vnd(person.PC_Thuc_Nhan) + ' đ', W - M - 3, y + 8.7, { align: 'right' });
    y += 20;

    /* ---- cơ sở tính ---- */
    doc.setTextColor.apply(doc, PURPLE); doc.setFont('Quicksand', 'bold'); doc.setFontSize(9);
    doc.text('CƠ SỞ TÍNH', M, y); y += 2;

    const p = report.params || {};
    const basis = [];
    basis.push(['Số ca trực đêm', String(s.caTruc), 'Số chuyến OPS', String(s.chuyenOPS)]);
    basis.push(['Ca / chuyến ngày lễ', String(s.caLe), 'Tổng giờ trực', hrs(s.tongGio)]);
    if (s.caTruc) {
      const kh = (root.IncalBonus || {}).nhanKhung
        ? root.IncalBonus.nhanKhung(p) : { bien: 'Khung biên', loi: 'Khung lõi' };
      basis.push([
        kh.bien, hrs(s.gioBien) + '  ×  ' + vnd(p.rate_gio_bien) + ' đ/h',
        kh.loi, hrs(s.gioLoi) + '  ×  ' + vnd(p.rate_gio_loi) + ' đ/h'
      ]);
      basis.push([
        'BCA Spark', s.spark + ' ca  ×  ' + vnd(p.bca_spark) + ' đ',
        'BCA Blaze', s.blaze + ' ca  ×  ' + vnd(p.bca_blaze) + ' đ'
      ]);
    }
    if (s.chuyenOPS) {
      basis.push(['Tổng trọng lượng lô hàng', vnd(s.tongKG) + ' kg',
        'Ngưỡng 1 người', vnd(p.ops_kg_1nguoi) + ' kg']);
    }
    if (s.caLe) {
      basis.push(['Hệ số ngày lễ (giờ + BCA)', String(p.he_so_le || 1.5).replace('.', ',') + ' lần',
        'Phụ trội lễ mỗi chuyến OPS', vnd(p.ops_phu_troi_le) + ' đ']);
    }
    basis.push(['Cách tính thuế TNCN', person.cachTinhThue || '—',
      'Người phụ thuộc khai báo', person.staff ? String(num(person.staff.So_Phu_Thuoc)) : '—']);

    doc.autoTable({
      startY: y,
      margin: { left: M, right: M },
      body: basis,
      theme: 'grid',
      styles: { font: 'Montserrat', fontSize: 8.5, cellPadding: { top: 1.6, bottom: 1.6, left: 3, right: 3 }, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 45, textColor: MUTE },
        1: { halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: 45, textColor: MUTE },
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });
    y = doc.lastAutoTable.finalY + 8;

    /* ---- nhật ký ca ---- */
    const list = person.shifts || [];
    if (list.length) {
      if (y > 225) { doc.addPage(); y = 20; }
      doc.setTextColor.apply(doc, PURPLE); doc.setFont('Quicksand', 'bold'); doc.setFontSize(9);
      doc.text('NHẬT KÝ CA  (' + list.length + ' ca)', M, y);
      doc.setFont('Montserrat', 'normal'); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTE);
      doc.text('Đối chiếu xem đã đủ ca chưa. Thiếu ca — báo FIN trước hạn chốt bảng lương.', M, y + 4);
      y += 7;

      doc.autoTable({
        startY: y,
        margin: { left: M, right: M },
        head: [['#', 'Ngày', 'Loại ca', 'Loại ngày', 'Giờ', 'Biên', 'Lõi', 'BCA', 'Mã job', 'KG', 'Thành tiền']],
        body: list.map(function (x, i) {
          const gio = x.gioBatDau + (x.gioKetThuc ? '–' + x.gioKetThuc : '');
          return [
            i + 1, dmy(x.ngay),
            x.loaiCa === 'OPS' ? 'OPS' : 'Trực đêm',
            x.loaiNgay || '', gio,
            x.gioBien ? hrs(x.gioBien) : '', x.gioLoi ? hrs(x.gioLoi) : '',
            x.mucBCA || '', x.maJob || '',
            x.trongLuong ? vnd(x.trongLuong) : '',
            vnd(x.tongDong)
          ];
        }),
        foot: [['', '', '', '', 'TỔNG ' + list.length + ' ca', hrs(s.gioBien), hrs(s.gioLoi),
          '', '', '', vnd(s.tong)]],
        styles: { font: 'Montserrat', fontSize: 6.8, cellPadding: { top: 1.2, bottom: 1.2, left: 1.6, right: 1.6 }, textColor: INK, lineColor: LINE, lineWidth: 0.1, overflow: 'ellipsize' },
        headStyles: { font: 'Quicksand', fontStyle: 'bold', fontSize: 6.4, fillColor: PURPLE, textColor: [255, 255, 255] },
        footStyles: { font: 'Montserrat', fontStyle: 'bold', fontSize: 6.8, fillColor: SOFT, textColor: INK },
        alternateRowStyles: { fillColor: [251, 250, 253] },
        columnStyles: {
          0: { cellWidth: 7, halign: 'right', cellPadding: { left: 0.4, right: 0.6 } },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 21, halign: 'center' },
          5: { cellWidth: 11, halign: 'right' },
          6: { cellWidth: 11, halign: 'right' },
          7: { cellWidth: 13, halign: 'center' },
          8: { cellWidth: 'auto' },
          9: { cellWidth: 11, halign: 'right' },
          10: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (d) {
          if (d.section !== 'body') return;
          if (d.column.index === 3 && d.cell.raw === 'Lễ') {
            d.cell.styles.textColor = ORANGE; d.cell.styles.fontStyle = 'bold';
          }
          if (d.column.index === 7 && d.cell.raw === 'Blaze') {
            d.cell.styles.textColor = PURPLE; d.cell.styles.fontStyle = 'bold';
          }
          if (d.column.index === 2 && d.cell.raw === 'OPS') {
            d.cell.styles.textColor = GREEN; d.cell.styles.fontStyle = 'bold';
          }
        }
      });
      y = doc.lastAutoTable.finalY + 5;

      doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTE); doc.setFont('Montserrat', 'normal');
      doc.text('Trực đêm: ' + vnd(s.pcTrucDem) + ' đ   ·   OPS: ' + vnd(s.phiOPS) + ' đ', M, y);
    } else {
      doc.setFontSize(7.8); doc.setTextColor.apply(doc, MUTE);
      doc.text('Kỳ này không có ca trực đêm hoặc chuyến OPS nào được ghi nhận.', M, y);
    }

    /* ---- chân trang ---- */
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const H = doc.internal.pageSize.getHeight();
      doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.2);
      doc.line(M, H - 14, W - M, H - 14);
      doc.setFont('Montserrat', 'normal'); doc.setFontSize(6.8); doc.setTextColor.apply(doc, MUTE);
      doc.text('Số liệu lấy trực tiếp từ file Excel phụ cấp kỳ ' + (report.period.name || '') +
        '. Chi tiết công thức: liên hệ phòng FIN.', M, H - 9);
      doc.text('Xuất ' + dmy(new Date()) + '  ·  Trang ' + i + '/' + pages, W - M, H - 9, { align: 'right' });
    }

    return doc;
  }

  function fileName(report, person) {
    const q = String(report.period.name || 'PhuCap').replace(/[\\/:*?"<>|]/g, '-');
    const nm = String(person.hoTen || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\s+/g, '-');
    return 'Phieu-PhuCap_' + q + '_' + person.maNV + '_' + nm + '.pdf';
  }

  return { build: build, fileName: fileName, vnd: vnd, hrs: hrs };
});
