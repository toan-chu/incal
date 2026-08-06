(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./categories'));
  else root.IncentiveExport = Object.assign(root.IncentiveExport || {}, factory(root.IncentiveExport));
})(typeof self !== 'undefined' ? self : this, function (presentation) {
  'use strict';

  const COLORS = {
    purple: '4D148C',
    orange: 'FF6200',
    softPurple: 'F4EFFA',
    softOrange: 'FFF4EA',
    line: 'DED9E6',
    white: 'FFFFFF',
    red: 'B42318',
    green: '0F766E'
  };

  function writeBke(report) {
    const wb = XLSX.utils.book_new();
    for (const person of report.per_person || []) {
      if (!person.netPay && !person.grossIncentive && !person.penalty) continue;
      const rows = buildPersonRows(report, person);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 20 }, { wch: 34 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 12 }];
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
      const jobHeader = rows.findIndex((row) => row[0] === 'Mã công việc');
      ws['!autofilter'] = { ref: rangeRef(jobHeader, 0, Math.max(rows.length - 1, jobHeader), 5) };
      ws['!freeze'] = { xSplit: 0, ySplit: jobHeader + 1 };
      stylePersonSheet(ws, rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName(person));
    }
    if (!wb.SheetNames.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Không có dữ liệu']]), 'Trống');
    XLSX.writeFile(wb, `INCENTIVE_DETAIL_${safeQuarter(report.quarter)}.xlsx`);
  }

  function buildPersonRows(report, person) {
    const jobs = (report.per_job || []).filter((job) => job.employeeId === person.employeeId || job.salesman === person.name);
    const definitions = presentation.resultColumns(report);
    const rows = [
      ['TRUSTANA - CHI TIẾT INCENTIVE', '', '', '', '', ''],
      ['Kỳ', report.quarter || '', '', 'Mã', person.code || '', ''],
      ['Họ tên', person.name || '', '', 'Nhóm', person.team || '', ''],
      [],
      ['Khoản', 'Số tiền', '', '', '', ''],
      ...definitions.map((definition) => [definition.label, presentation.componentValue(person, definition), '', '', '', '']),
      ['Thực nhận', person.netPay, '', '', '', ''],
      [],
      ['Chi tiết công việc', '', '', '', '', ''],
      ['Mã công việc', 'Khách hàng', 'Tháng', 'Mức', 'GP tính', 'Trạng thái']
    ];
    for (const job of jobs) rows.push([job.jobNo, job.customer, job.month, job.level, job.gpTinh, job.paid ? 'Đã thu' : 'Chưa thu']);
    return rows;
  }

  function stylePersonSheet(ws, rows) {
    const summaryHeader = rows.findIndex((row) => row[0] === 'Khoản');
    const netRow = rows.findIndex((row) => row[0] === 'Thực nhận');
    const jobSection = rows.findIndex((row) => row[0] === 'Chi tiết công việc');
    const jobHeader = rows.findIndex((row) => row[0] === 'Mã công việc');
    applyStyle(ws, 0, 0, titleStyle(16, COLORS.purple));
    for (let c = 0; c <= 5; c += 1) {
      applyStyle(ws, summaryHeader, c, sectionStyle());
      applyStyle(ws, jobSection, c, sectionStyle());
      applyStyle(ws, jobHeader, c, headerStyle());
    }
    for (let r = 1; r <= 2; r += 1) {
      for (let c = 0; c <= 5; c += 1) applyStyle(ws, r, c, metaStyle(c % 3 === 0));
    }
    for (let r = summaryHeader + 1; r <= netRow; r += 1) {
      applyStyle(ws, r, 0, bodyStyle());
      const style = bodyStyle();
      style.numFmt = '#,##0';
      style.alignment = { horizontal: 'right', vertical: 'center' };
      if (Number(rows[r][1] || 0) < 0) style.font = { color: { rgb: COLORS.red } };
      if (r === netRow) {
        style.font = { bold: true, color: { rgb: COLORS.green } };
        style.fill = { fgColor: { rgb: COLORS.softOrange } };
      }
      applyStyle(ws, r, 1, style);
    }
    for (let r = jobHeader + 1; r < rows.length; r += 1) {
      for (let c = 0; c <= 5; c += 1) {
        const style = bodyStyle();
        if (c === 4) {
          style.numFmt = '#,##0';
          style.alignment = { horizontal: 'right', vertical: 'center' };
          if (Number(rows[r][c] || 0) < 0) style.font = { color: { rgb: COLORS.red } };
        }
        if (c === 5 && rows[r][c] === 'Chưa thu') style.fill = { fgColor: { rgb: COLORS.softOrange } };
        applyStyle(ws, r, c, style);
      }
    }
  }

  function writeBkePdf(report) {
    const people = (report.per_person || []).filter((person) => person.netPay || person.grossIncentive || person.penalty);
    openPrintablePeople(report, people);
  }

  function writePersonPdf(report, personIndex) {
    const person = (report.per_person || [])[personIndex];
    if (!person) return;
    openPrintablePeople(report, [person]);
  }

  function openPrintablePeople(report, people) {
    const popup = window.open('', '_blank');
    if (!popup) {
      alert('Chrome đang chặn cửa sổ in PDF. Hãy cho phép pop-up cho file này rồi thử lại.');
      return;
    }
    const logoUrl = new URL('assets/Logo_Trustana_PNGPurpleOrange.png', window.location.href).href;
    popup.document.open();
    popup.document.write(buildPrintableHtml(report, people, logoUrl));
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }

  function buildPrintableHtml(report, people, logoUrl) {
    return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Chi tiết incentive ${escapeHtml(report.quarter || '')}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #211b2e; font-family: Calibri, "Segoe UI", sans-serif; font-size: 12px; }
    h1, h2 { margin: 0; color: #4d148c; font-family: Arial, sans-serif; }
    h1 { font-size: 18px; }
    h2 { font-size: 15px; margin-top: 4px; color: #ff6200; }
    .page { page-break-after: always; min-height: 260mm; }
    .head { display: flex; justify-content: space-between; gap: 16px; border-bottom: 3px solid #ff6200; padding-bottom: 8px; margin-bottom: 12px; }
    .logo { display: block; height: 30px; max-width: 160px; object-fit: contain; margin-bottom: 6px; }
    .meta { text-align: right; color: #5f586b; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ded9e6; padding: 6px 7px; text-align: left; vertical-align: top; }
    th { background: #4d148c; color: #fff; font-weight: 700; }
    .section th { background: #fff4ea; color: #4d148c; }
    .number { text-align: right; white-space: nowrap; }
    .summary { width: 64%; }
    .net { font-size: 15px; font-weight: 700; color: #0f766e; }
    .negative { color: #b42318; }
    .muted { color: #6c6578; }
  </style>
</head>
<body>
  ${people.map((person) => printablePerson(report, person, logoUrl)).join('')}
</body>
</html>`;
  }

  function printablePerson(report, person, logoUrl) {
    const jobs = (report.per_job || []).filter((job) => job.employeeId === person.employeeId || job.salesman === person.name);
    return `<section class="page">
      <div class="head">
        <div>
          <img class="logo" src="${escapeHtml(logoUrl)}" alt="Trustana">
          <h1>Chi tiết incentive</h1>
          <h2>${escapeHtml(person.name || '')}</h2>
        </div>
        <div class="meta">
          <div>${escapeHtml(report.quarter || '')}</div>
          <div>${escapeHtml(person.code || '')}</div>
        </div>
      </div>
      <table class="summary">
        <tr><th>Họ tên</th><td>${escapeHtml(person.name || '')}</td></tr>
        <tr><th>Nhóm</th><td>${escapeHtml(person.team || '')}</td></tr>
      </table>
      <table>
        <thead><tr><th>Khoản</th><th class="number">Số tiền</th></tr></thead>
        <tbody>
          ${presentation.resultColumns(report).map((definition) => {
            const amount = presentation.componentValue(person, definition);
            return `<tr><td>${escapeHtml(definition.label)}</td><td class="number ${amount < 0 ? 'negative' : ''}">${vnd(amount)}</td></tr>`;
          }).join('')}
          <tr><td class="net">Thực nhận</td><td class="number net">${vnd(person.netPay)}</td></tr>
        </tbody>
      </table>
      <table>
        <thead><tr><th>Mã công việc</th><th>Khách hàng</th><th>Tháng</th><th>Mức</th><th class="number">GP tính</th><th>Trạng thái</th></tr></thead>
        <tbody>
          ${jobs.length ? jobs.map((job) => `<tr><td>${escapeHtml(job.jobNo)}</td><td>${escapeHtml(job.customer)}</td><td>${job.month || ''}</td><td>${job.level || ''}</td><td class="number ${Number(job.gpTinh || 0) < 0 ? 'negative' : ''}">${vnd(job.gpTinh)}</td><td>${job.paid ? 'Đã thu' : 'Chưa thu'}</td></tr>`).join('') : '<tr><td colspan="6" class="muted">Không có công việc cấu thành trong dữ liệu đầu vào.</td></tr>'}
        </tbody>
      </table>
    </section>`;
  }

  function titleStyle(size, color) {
    return {
      font: { bold: true, sz: size, color: { rgb: color } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  function sectionStyle() {
    return {
      font: { bold: true, color: { rgb: COLORS.purple } },
      fill: { fgColor: { rgb: COLORS.softOrange } },
      border: allBorders(),
      alignment: { vertical: 'center' }
    };
  }

  function headerStyle() {
    return {
      font: { bold: true, color: { rgb: COLORS.white } },
      fill: { fgColor: { rgb: COLORS.purple } },
      border: allBorders(),
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };
  }

  function metaStyle(isLabel) {
    return {
      font: { bold: isLabel, color: { rgb: isLabel ? COLORS.purple : '211B2E' } },
      border: allBorders(),
      alignment: { vertical: 'center' }
    };
  }

  function bodyStyle() {
    return {
      border: allBorders(),
      alignment: { vertical: 'center' }
    };
  }

  function allBorders() {
    const line = { style: 'thin', color: { rgb: COLORS.line } };
    return { top: line, right: line, bottom: line, left: line };
  }

  function applyStyle(ws, row, col, style) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
    ws[cellRef].s = style;
    if (typeof ws[cellRef].v === 'number') ws[cellRef].z = style.numFmt || '#,##0';
  }

  function rangeRef(r1, c1, r2, c2) {
    return `${XLSX.utils.encode_cell({ r: r1, c: c1 })}:${XLSX.utils.encode_cell({ r: r2, c: c2 })}`;
  }

  function sheetName(person) {
    return String(person.code || person.name || 'NV').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
  }

  function safeQuarter(value) {
    return String(value || 'Q').replace(/[^\w-]+/g, '_');
  }

  function vnd(value) {
    return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')} VND`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  return { writeBke, writeBkePdf, writePersonPdf };
});
