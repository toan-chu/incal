/* ==========================================================================
   INCAL PAYSLIP — dựng phiếu incentive PDF (A4) bằng jsPDF + autoTable.
   Chữ tiếng Việt là chữ thật (nhúng Quicksand + Montserrat), không phải ảnh.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IncalPayslip = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PURPLE = [77, 20, 140];
  const ORANGE = [255, 98, 0];
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
  function pct(n) { return (Math.round((n || 0) * 10000) / 100).toString().replace('.', ',') + '%'; }
  function dmy(d) {
    if (!d) return '';
    const p = function (x) { return String(x).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  const GROUP_LABEL = { SALE: 'Sale COM', KAE: 'KAE (chia pool)', BO: 'BO / Sale khác' };

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
    doc.text('PHIẾU INCENTIVE', W - M, 12.5, { align: 'right' });
    doc.setFont('Montserrat', 'normal'); doc.setFontSize(8);
    doc.setTextColor.apply(doc, MUTE);
    doc.text('Kỳ ' + (report.period.name || '') + (range ? '  ·  ' + range : ''), W - M, 18, { align: 'right' });

    doc.setFillColor.apply(doc, PURPLE); doc.rect(M, 22, W - 2 * M, 0.8, 'F');
    doc.setFillColor.apply(doc, ORANGE); doc.rect(M, 22, 26, 0.8, 'F');

    y = 30;

    /* ---- khối nhân viên ---- */
    doc.setDrawColor.apply(doc, LINE);
    doc.setFillColor.apply(doc, SOFT);
    doc.roundedRect(M, y, W - 2 * M, 18, 1.5, 1.5, 'FD');
    doc.setTextColor.apply(doc, MUTE); doc.setFontSize(7.5);
    doc.text('HỌ VÀ TÊN', M + 4, y + 6);
    doc.text('MÃ NHÂN VIÊN', M + 92, y + 6);
    doc.text('NHÓM TÍNH', M + 132, y + 6);
    doc.setTextColor.apply(doc, INK); doc.setFont('Montserrat', 'bold'); doc.setFontSize(11);
    doc.text(person.hoTen || '', M + 4, y + 13);
    doc.setFontSize(9.5);
    doc.text(person.maNV || '', M + 92, y + 13);
    doc.text(person.groups.map(function (g) { return GROUP_LABEL[g] || g; }).join(' + ') || '—', M + 132, y + 13);
    y += 25;

    /* ---- bảng tiền ---- */
    const money = [
      ['Incentive Gross', person.Incentive_Gross, 'strong'],
      ['Thu nhập lương chịu thuế', person.TN_Luong_Chiu_Thue],
      ['Phí OPS', person.Phi_OPS],
      ['Bảo hiểm xã hội', -Math.abs(person.BHXH)],
      ['Giảm trừ gia cảnh', -Math.abs(person.Giam_Tru)],
      ['Thu nhập chịu thuế', person.TN_Chiu_Thue, 'sub'],
      ['Thuế TNCN', person.Thue_TNCN],
      ['Thuế đã trừ ở lương', -Math.abs(person.Thue_Da_Tru_Luong)],
      ['Thuế đã trừ ở OPS', -Math.abs(person.Thue_Da_Tru_OPS)],
      ['Thuế phải nộp', -Math.abs(person.Thue_Phai_Nop), 'sub'],
      ['Cộng / trừ khác', person.Cong_Tru_Khac]
    ].filter(function (r, i) { return i === 0 || r[1] !== 0 || r[2]; });

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
      }
    });
    y = doc.lastAutoTable.finalY;

    /* ---- dòng THỰC NHẬN ---- */
    doc.setFillColor.apply(doc, ORANGE);
    doc.rect(M, y, W - 2 * M, 13, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('Quicksand', 'bold');
    doc.setFontSize(10); doc.text('INCENTIVE THỰC NHẬN', M + 3, y + 8.5);
    doc.setFontSize(13); doc.text(vnd(person.Incentive_Thuc_Nhan) + ' đ', W - M - 3, y + 8.7, { align: 'right' });
    y += 20;

    /* ---- cơ sở tính ---- */
    doc.setTextColor.apply(doc, PURPLE); doc.setFont('Quicksand', 'bold'); doc.setFontSize(9);
    doc.text('CƠ SỞ TÍNH', M, y); y += 2;

    const basis = [];
    if (person.sale) {
      const s = person.sale;
      basis.push(['Doanh thu', vnd(s.Doanh_Thu), 'Chi phí', vnd(s.Chi_Phi)]);
      basis.push(['Lợi nhuận (tổng)', vnd(s.Profit_Total), 'Lợi nhuận đã thu', vnd(s.Profit_Paid)]);
      basis.push(['Lợi nhuận chưa thu', vnd(s.Profit_Unpaid), 'Chỉ tiêu quý', vnd(s.Target_Q)]);
      basis.push(['Mức 1 (' + pct(s.Rate_M1) + ')', vnd(s.U_Muc1), 'Mức 2 (' + pct(s.Rate_M2) + ')', vnd(s.V_Muc2)]);
      basis.push(['Mức 3 (' + pct(s.Rate_M3) + ')', vnd(s.W_Muc3), 'Cộng ba mức', vnd(s.X_Gross)]);
      if (num(s.Z_BP)) basis.push(['Thưởng Trưởng bộ phận', vnd(s.Z_BP), '', '']);
      if (num(s.AA_Phat)) basis.push(['Phạt công nợ', vnd(s.AA_Phat), '', '']);
    }
    if (person.kae) {
      const k = person.kae;
      const pool = report.kaePool.find(function (p) { return /TỔNG/i.test(String(p.Nguon)); }) || {};
      basis.push(['Pool tháng 1', vnd(pool.T1_Pool), 'Tỷ lệ tham gia T1', String(k.T1_Ratio)]);
      basis.push(['Pool tháng 2', vnd(pool.T2_Pool), 'Tỷ lệ tham gia T2', String(k.T2_Ratio)]);
      basis.push(['Pool tháng 3', vnd(pool.T3_Pool), 'Tỷ lệ tham gia T3', String(k.T3_Ratio)]);
      basis.push(['Được chia từ pool', vnd(k.Tong_Chia), 'Trừ / phạt', vnd(num(k.Tru) + num(k.Phat))]);
      basis.push(['Incentive KAE', vnd(k.Incentive), '', '']);
    }
    if (person.other) {
      const o = person.other;
      basis.push(['Doanh thu (BO)', vnd(o.Doanh_Thu), 'Chi phí (BO)', vnd(o.Chi_Phi)]);
      basis.push(['Lợi nhuận đã thu', vnd(o.Profit_Paid), 'Tỷ lệ áp dụng', pct(o.Rate)]);
      basis.push(['Incentive BO', vnd(o.Incentive), '', '']);
    }

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

    /* ---- danh sách deal ---- */
    const jobs = person.jobs || [];
    if (jobs.length) {
      if (y > 235) { doc.addPage(); y = 20; }
      doc.setTextColor.apply(doc, PURPLE); doc.setFont('Quicksand', 'bold'); doc.setFontSize(9);
      doc.text('DANH SÁCH DEAL ĐÓNG GÓP  (' + jobs.length + ' job)', M, y);
      doc.setFont('Montserrat', 'normal'); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTE);
      doc.text('Đối chiếu xem đã đủ deal chưa. Thiếu deal — báo FIN trước hạn chốt.', M, y + 4);
      y += 7;

      const s = person.jobSummary;
      doc.autoTable({
        startY: y,
        margin: { left: M, right: M },
        head: [['#', 'Th', 'Mã job', 'Khách hàng', 'Mức', 'Doanh thu', 'Chi phí', 'Lợi nhuận', 'T.thái']],
        body: jobs.map(function (j, i) {
          return [i + 1, j.thang || '', j.maJob, j.khachHang, j.khLoai,
            vnd(j.doanhThu), vnd(j.chiPhi), vnd(j.profit),
            /^paid$/i.test(j.paidStatus) ? 'Đã thu' : 'Chưa thu'];
        }),
        foot: [['', '', '', 'TỔNG ' + jobs.length + ' job', '', vnd(s.doanhThu), vnd(s.chiPhi), vnd(s.profit), '']],
        styles: { font: 'Montserrat', fontSize: 6.6, cellPadding: { top: 1.1, bottom: 1.1, left: 1.6, right: 1.6 }, textColor: INK, lineColor: LINE, lineWidth: 0.1, overflow: 'ellipsize' },
        headStyles: { font: 'Quicksand', fontStyle: 'bold', fontSize: 6.4, fillColor: PURPLE, textColor: [255, 255, 255] },
        footStyles: { font: 'Montserrat', fontStyle: 'bold', fontSize: 6.6, fillColor: SOFT, textColor: INK },
        alternateRowStyles: { fillColor: [251, 250, 253] },
        columnStyles: {
          0: { cellWidth: 7, halign: 'right', cellPadding: { left: 0.4, right: 0.6 } },
          1: { cellWidth: 6, halign: 'center' },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 11 },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 20, halign: 'right' },
          8: { cellWidth: 13, halign: 'center' }
        },
        didParseCell: function (d) {
          if (d.section === 'body' && d.column.index === 8 && d.cell.raw === 'Chưa thu') {
            d.cell.styles.textColor = ORANGE; d.cell.styles.fontStyle = 'bold';
          }
        }
      });
      y = doc.lastAutoTable.finalY + 5;

      doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTE); doc.setFont('Montserrat', 'normal');
      doc.text('Đã thu: ' + vnd(s.profitPaid) + ' đ   ·   Chưa thu: ' + vnd(s.profitUnpaid) + ' đ', M, y);
    } else if (person.groups.indexOf('KAE') >= 0) {
      doc.setFontSize(7.8); doc.setTextColor.apply(doc, MUTE);
      doc.text('KAE hưởng theo pool chung của nhóm, không gắn với deal riêng lẻ.', M, y);
    }

    /* ---- chân trang ---- */
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const H = doc.internal.pageSize.getHeight();
      doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.2);
      doc.line(M, H - 14, W - M, H - 14);
      doc.setFont('Montserrat', 'normal'); doc.setFontSize(6.8); doc.setTextColor.apply(doc, MUTE);
      doc.text('Số liệu lấy trực tiếp từ file Excel incentive kỳ ' + (report.period.name || '') +
        '. Chi tiết công thức: liên hệ phòng FIN.', M, H - 9);
      doc.text('Xuất ' + dmy(new Date()) + '  ·  Trang ' + i + '/' + pages, W - M, H - 9, { align: 'right' });
    }

    return doc;
  }

  function num(v) { const n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : 0; }

  function fileName(report, person) {
    const q = String(report.period.name || 'Incentive').replace(/[\\/:*?"<>|]/g, '-');
    const nm = String(person.hoTen || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\s+/g, '-');
    return 'Phieu-Incentive_' + q + '_' + person.maNV + '_' + nm + '.pdf';
  }

  return { build: build, fileName: fileName, vnd: vnd };
});
