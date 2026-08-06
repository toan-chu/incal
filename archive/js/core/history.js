(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IncalV3 = Object.assign(root.IncalV3 || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function summarizeReports(reports) {
    const clean = (reports || []).filter((report) => report && Array.isArray(report.per_person));
    const byQuarter = new Map();
    const people = new Map();
    for (const report of clean) {
      const quarter = normalizeQuarter(report.quarter);
      if (!byQuarter.has(quarter)) byQuarter.set(quarter, { quarter, gross: 0, penalty: 0, tax: 0, netPay: 0, peopleWithPay: 0 });
      const bucket = byQuarter.get(quarter);
      bucket.gross += number(report.totals?.grossIncentive);
      bucket.penalty += number(report.totals?.penalty);
      bucket.tax += number(report.totals?.tax);
      bucket.netPay += number(report.totals?.netPay);
      bucket.peopleWithPay += number(report.totals?.peopleWithPay);
      for (const person of report.per_person) {
        const key = person.employeeId || person.code || person.name;
        if (!people.has(key)) people.set(key, { code: person.code || '', name: person.name || key, team: person.team || '', netPay: 0, byQuarter: {} });
        const row = people.get(key);
        row.netPay += number(person.netPay);
        row.byQuarter[quarter] = number(row.byQuarter[quarter]) + number(person.netPay);
      }
    }
    const totalsByQuarter = Array.from(byQuarter.values()).sort((a, b) => compareQuarter(a.quarter, b.quarter));
    return {
      reportCount: clean.length,
      quarters: totalsByQuarter.map((row) => row.quarter),
      totalsByQuarter,
      totals: totalsByQuarter.reduce((acc, row) => ({ gross: acc.gross + row.gross, penalty: acc.penalty + row.penalty, tax: acc.tax + row.tax, netPay: acc.netPay + row.netPay }), { gross: 0, penalty: 0, tax: 0, netPay: 0 }),
      people: Array.from(people.values()).sort((a, b) => b.netPay - a.netPay || a.name.localeCompare(b.name, 'vi'))
    };
  }

  function normalizeQuarter(value) {
    const match = String(value || '').trim().toUpperCase().match(/Q([1-4])[-_ ]?(\d{4})|(\d{4})[-_ ]?Q([1-4])/);
    return match ? `Q${match[1] || match[4]}-${match[2] || match[3]}` : String(value || 'UNKNOWN');
  }
  function compareQuarter(a, b) { const x = parts(a); const y = parts(b); return x.year - y.year || x.quarter - y.quarter; }
  function parts(value) { const match = String(value).match(/Q([1-4])-(\d{4})/); return match ? { quarter: Number(match[1]), year: Number(match[2]) } : { quarter: 9, year: 9999 }; }
  function number(value) { const n = Number(value || 0); return Number.isFinite(n) ? n : 0; }

  return { summarizeReports, normalizeQuarter };
});

