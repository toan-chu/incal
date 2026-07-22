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

  function writeBk(report) {
    const generatedAt = new Date(report.generated_at || Date.now()).toLocaleString('vi-VN');
    const definitions = presentation.resultColumns(report);
    const headers = ['STT', 'Mã', 'Họ và tên', 'Nhóm', ...definitions.map((item) => item.label), 'Thực nhận'];
    const lastColumn = headers.length - 1;
    const rows = [
      ['TRUSTANA'],
      ['BẢNG TỔNG HỢP CHI INCENTIVE'],
      [`Kỳ: ${report.quarter || ''}`, `Tạo lúc: ${generatedAt}`],
      [],
      headers
    ];
    (report.per_person || []).forEach((person, index) => {
      rows.push([index + 1, person.code, person.name, person.team, ...definitions.map((item) => presentation.componentValue(person, item)), person.netPay]);
    });
    rows.push(['', '', 'Tổng cộng', '', ...definitions.map((item) => sumDefinition(report, item)), sum(report.per_person, 'netPay')]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, ...definitions.map(() => ({ wch: 18 })), { wch: 18 }];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } }
    ];
    ws['!autofilter'] = { ref: rangeRef(4, 0, Math.max(rows.length - 1, 4), lastColumn) };
    ws['!freeze'] = { xSplit: 0, ySplit: 5 };
    styleBkSheet(ws, rows, definitions, lastColumn);
    XLSX.utils.book_append_sheet(wb, ws, 'Tong hop chi tra');
    XLSX.writeFile(wb, `INCENTIVE_SUMMARY_${safeQuarter(report.quarter)}.xlsx`);
  }

  function styleBkSheet(ws, rows, definitions, lastColumn) {
    applyStyle(ws, 0, 0, titleStyle(18, COLORS.purple));
    applyStyle(ws, 1, 0, titleStyle(14, COLORS.orange));
    for (let c = 0; c <= lastColumn; c += 1) {
      applyStyle(ws, 4, c, headerStyle());
    }
    for (let r = 5; r < rows.length; r += 1) {
      const isTotal = r === rows.length - 1;
      for (let c = 0; c <= lastColumn; c += 1) {
        const style = isTotal ? totalStyle() : bodyStyle();
        if (c >= 4) {
          style.numFmt = '#,##0';
          style.alignment = { horizontal: 'right', vertical: 'center' };
        }
        if (!isTotal && c === lastColumn && Number(rows[r][c] || 0) > 0) {
          style.font = { bold: true, color: { rgb: COLORS.green } };
        }
        const definition = definitions[c - 4];
        if (!isTotal && definition && ['deduction', 'tax'].includes(definition.role) && Number(rows[r][c] || 0) < 0) {
          style.font = { color: { rgb: COLORS.red } };
        }
        applyStyle(ws, r, c, style);
      }
    }
  }

  function titleStyle(size, color) {
    return {
      font: { bold: true, sz: size, color: { rgb: color } },
      alignment: { horizontal: 'center', vertical: 'center' }
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

  function bodyStyle() {
    return {
      border: allBorders(),
      alignment: { vertical: 'center' }
    };
  }

  function totalStyle() {
    return {
      font: { bold: true, color: { rgb: COLORS.purple } },
      fill: { fgColor: { rgb: COLORS.softOrange } },
      border: allBorders(),
      alignment: { vertical: 'center' },
      numFmt: '#,##0'
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

  function sum(rows, key) {
    return (rows || []).reduce((acc, row) => acc + Math.round(Number(row[key] || 0)), 0);
  }

  function sumDefinition(report, definition) {
    return (report.per_person || []).reduce((acc, row) => acc + Math.round(presentation.componentValue(row, definition)), 0);
  }

  function safeQuarter(value) {
    return String(value || 'Q').replace(/[^\w-]+/g, '_');
  }

  return { writeBk };
});
