(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IncentiveExport = Object.assign(root.IncentiveExport || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COLORS = {
    purple: '4D148C',
    orange: 'FF6200',
    softOrange: 'FFF4EA',
    line: 'DED9E6',
    white: 'FFFFFF',
    red: 'B42318'
  };

  function saveJson(report) {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `DATA_${safeQuarter(report.quarter)}_${timestamp(report.generated_at)}.json`);
  }

  function buildTidyRows(report) {
    const rows = [[
      'NV', 'team', 'nhom tinh', 'job', 'KH', 'thang', 'muc', 'GP', 'rate', 'thuong', 'phat', 'thue', 'thuc nhan'
    ]];
    const peopleByName = new Map((report.per_person || []).map((person) => [person.name, person]));
    const peopleById = new Map((report.per_person || []).map((person) => [person.employeeId, person]));
    for (const job of report.per_job || []) {
      const person = peopleById.get(job.employeeId) || peopleByName.get(job.salesman) || {};
      const salesTrace = person.trace?.sales;
      const line = salesTrace?.lines?.find((item) => item.level === job.level);
      rows.push([
        job.salesman,
        person.team || '',
        person.calcType || '',
        job.jobNo,
        job.customer,
        job.month,
        job.level,
        job.gpTinh,
        line ? line.rate : '',
        line ? line.amount : '',
        person.penalty || 0,
        person.tax?.taxOnIncentive || 0,
        person.netPay || 0
      ]);
    }
    return rows;
  }

  function writeTidyXlsx(report) {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['TRUSTANA - TIDY INCENTIVE DATA'],
      [`Ky: ${report.quarter || ''}`, `Generated: ${new Date(report.generated_at || Date.now()).toLocaleString('vi-VN')}`],
      [],
      ...buildTidyRows(report)
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 30 }, { wch: 9 }, { wch: 8 },
      { wch: 15 }, { wch: 9 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];
    ws['!autofilter'] = { ref: rangeRef(3, 0, Math.max(rows.length - 1, 3), 12) };
    ws['!freeze'] = { xSplit: 0, ySplit: 4 };
    styleTidy(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'tidy');
    XLSX.writeFile(wb, `tidy_${safeQuarter(report.quarter)}.xlsx`);
  }

  function styleTidy(ws, rows) {
    applyStyle(ws, 0, 0, {
      font: { bold: true, sz: 16, color: { rgb: COLORS.purple } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });
    for (let c = 0; c <= 12; c += 1) applyStyle(ws, 3, c, headerStyle());
    for (let r = 4; r < rows.length; r += 1) {
      for (let c = 0; c <= 12; c += 1) {
        const style = bodyStyle();
        if (c >= 7) {
          style.numFmt = c === 8 ? '0.00%' : '#,##0';
          style.alignment = { horizontal: 'right', vertical: 'center' };
        }
        if ([10, 11].includes(c) && Number(rows[r][c] || 0) > 0) style.font = { color: { rgb: COLORS.red } };
        applyStyle(ws, r, c, style);
      }
    }
  }

  function headerStyle() {
    return {
      font: { bold: true, color: { rgb: COLORS.white } },
      fill: { fgColor: { rgb: COLORS.purple } },
      border: allBorders(),
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
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

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function safeQuarter(value) {
    return String(value || 'Q').replace(/[^\w-]+/g, '_');
  }

  function timestamp(value) {
    const date = value ? new Date(value) : new Date();
    const pad = (num) => String(num).padStart(2, '0');
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('') + '_' + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join('');
  }

  return { saveJson, writeTidyXlsx, buildTidyRows, safeQuarter };
});
