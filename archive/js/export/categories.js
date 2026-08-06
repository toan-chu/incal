(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IncentiveExport = Object.assign(root.IncentiveExport || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ROLE_LABELS = Object.freeze({
    income: 'Thu nhập',
    deduction: 'Khấu trừ',
    tax: 'Thuế',
    adjustment: 'Điều chỉnh'
  });
  const SPECIAL_COMPONENT_ROLES = Object.freeze({ penalty: 'deduction', tax: 'tax', adjustment: 'adjustment' });

  function presetFrom(value) {
    return value?.preset?.snapshot || value?.preset || value || {};
  }

  function recipeRole(recipe) {
    const explicit = recipe?.meta?.presentation?.role;
    if (ROLE_LABELS[explicit]) return explicit;
    return SPECIAL_COMPONENT_ROLES[normalizeComponent(recipe?.component)] || 'income';
  }

  function recipeLabel(recipe) {
    const explicit = String(recipe?.meta?.presentation?.label || '').trim();
    if (explicit) return explicit;
    const name = String(recipe?.name || '').trim();
    return name || componentLabel(recipe?.component || recipe?.id);
  }

  function recipeDefinitions(value) {
    const result = new Map();
    for (const recipe of presetFrom(value).recipes || []) {
      const component = normalizeComponent(recipe.component || recipe.id);
      if (!component || recipe.enabled === false || result.has(component)) continue;
      result.set(component, {
        component,
        label: recipeLabel(recipe),
        role: recipeRole(recipe),
        roleLabel: ROLE_LABELS[recipeRole(recipe)],
        recipeId: recipe.id
      });
    }
    return Array.from(result.values());
  }

  function resultColumns(value) {
    return recipeDefinitions(value);
  }

  function incomeGroups(value) {
    return recipeDefinitions(value).filter((item) => item.role === 'income');
  }

  function componentValue(person, definition) {
    const raw = Number(person?.components?.[definition.component] || 0);
    if (definition.role === 'deduction') return -Math.abs(Number(person?.penalty ?? raw));
    if (definition.role === 'tax') return -Math.abs(Number(person?.tax?.taxOnIncentive ?? raw));
    if (definition.role === 'adjustment') return Number(person?.otherAdjustments ?? raw);
    return raw;
  }

  function componentLabel(component) {
    const value = String(component || '').trim();
    if (/^[a-z0-9]{1,5}$/i.test(value)) return value.toUpperCase();
    return value.split(/[_\-\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
  }

  function writeComponentGroup(report, component) {
    if (!globalThis.XLSX) throw new Error('Thiếu SheetJS local.');
    const key = normalizeComponent(component);
    const group = incomeGroups(report).find((item) => item.component === key);
    if (!group) throw new Error(`Khoản thu nhập "${component}" không có trong preset của báo cáo.`);
    const people = (report.per_person || []).filter((person) => Number(person.components?.[key] || 0) !== 0);
    const rows = [['DANH SÁCH INCENTIVE THEO KHOẢN', group.label, report.quarter || ''], [], ['Mã', 'Họ tên', 'Nhóm', group.label, 'Tổng thu nhập', 'Tổng khấu trừ', 'Thuế', 'Thực nhận']];
    for (const person of people) rows.push([person.code, person.name, person.team, Number(person.components?.[key] || 0), person.grossIncentive, person.penalty, person.tax?.taxOnIncentive || 0, person.netPay]);
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, sheet, safeSheet(group.label));
    XLSX.writeFile(workbook, `INCENTIVE_GROUP_${safe(group.label).toUpperCase()}_${safe(report.quarter)}.xlsx`);
  }

  function saveJobJson(report) {
    downloadJson({ schemaVersion: 3, kind: 'incal-job-export', quarter: report.quarter, generated_at: report.generated_at, jobs: report.per_job || [] }, `JOB_DATA_${safe(report.quarter)}.json`);
  }
  function saveReportJson(report) { downloadJson(report, `INCENTIVE_REPORT_${safe(report.quarter)}.json`); }
  function downloadJson(value, filename) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  function normalizeComponent(value) { return String(value || '').trim().toLowerCase(); }
  function safe(value) { return String(value || 'Q').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, ''); }
  function safeSheet(value) { return String(value || 'Khoan').replace(/[\\/?*\[\]:]+/g, '_').slice(0, 31); }

  return {
    ROLE_LABELS,
    recipeRole,
    recipeLabel,
    recipeDefinitions,
    resultColumns,
    componentValue,
    incomeGroups,
    componentLabel,
    writeComponentGroup,
    saveJobJson,
    saveReportJson
  };
});
