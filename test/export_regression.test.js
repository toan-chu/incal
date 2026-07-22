const test = require('node:test');
const assert = require('node:assert/strict');

global.XLSX = require('../js/vendor/xlsx.full.min.js');
const bk = require('../js/export/xlsx_bk');
const bke = require('../js/export/xlsx_bke');
const categories = require('../js/export/categories');
const reportExport = require('../js/export/report');

function sampleReport() {
  return {
    quarter: 'Q1-2026',
    generated_at: '2026-07-20T08:00:00.000Z',
    preset: { snapshot: { recipes: [
      { id: 'com', name: 'COM', component: 'com', enabled: true },
      { id: 'kae', name: 'KAE', component: 'kae', enabled: true },
      { id: 'bo', name: 'BO', component: 'bo', enabled: true },
      { id: 'pen', name: 'Phạt', component: 'penalty', enabled: true },
      { id: 'tax', name: 'Thuế', component: 'tax', enabled: true }
    ] } },
    per_person: [{
      employeeId: 'E1', code: 'NV01', name: 'Nguyễn An', team: 'COM', calcType: 'COM_SALES_OFFICIAL',
      salesIncentive: 120000, managerReward: 0, kamIncentive: 0, boIncentive: 0,
      springIncentive: 0, grossIncentive: 120000, penalty: 10000, otherAdjustments: 0,
      tax: { taxableIncome: 120000, totalTax: 12000, payrollTax: 0, taxOnIncentive: 12000 },
      components: { com: 120000, kae: 25000, bo: 0, penalty: 10000, tax: 12000 },
      netPay: 98000,
      trace: { sales: { lines: [{ level: 2, rate: 0.12, amount: 120000 }] } }
    }],
    per_job: [{ employeeId: 'E1', salesman: 'Nguyễn An', jobNo: 'JOB-01', customer: 'Khách A', month: 1, level: 2, gpTinh: 1000000, paid: true }]
  };
}

test('summary, group and tidy exporters build offline workbooks with generic names', () => {
  const written = [];
  const originalWriteFile = XLSX.writeFile;
  XLSX.writeFile = (workbook, filename) => written.push({ workbook, filename });
  try {
    const report = sampleReport();
    bk.writeBk(report);
    bke.writeBke(report);
    categories.writeComponentGroup(report, 'com');
    categories.writeComponentGroup(report, 'kae');
    categories.writeComponentGroup(report, 'bo');
    reportExport.writeTidyXlsx(report);
  } finally {
    XLSX.writeFile = originalWriteFile;
  }

  assert.deepEqual(written.map((item) => item.filename), [
    'INCENTIVE_SUMMARY_Q1-2026.xlsx',
    'INCENTIVE_DETAIL_Q1-2026.xlsx',
    'INCENTIVE_GROUP_COM_Q1-2026.xlsx',
    'INCENTIVE_GROUP_KAE_Q1-2026.xlsx',
    'INCENTIVE_GROUP_BO_Q1-2026.xlsx',
    'tidy_Q1-2026.xlsx'
  ]);
  assert.ok(written.every((item) => item.workbook.SheetNames.length > 0));
  assert.ok(written.every((item) => item.workbook.SheetNames.every((name) => !/^BK(?:e|ê)?(?:\b|-)/i.test(name))));
  assert.equal(reportExport.buildTidyRows(sampleReport())[1][0], 'Nguyễn An');
  assert.deepEqual(categories.incomeGroups(sampleReport()).map((item) => item.component), ['com', 'kae', 'bo']);
});

test('income export groups follow recipe components and exclude deductions', () => {
  const report = sampleReport();
  report.preset.snapshot.recipes.splice(1, 1, { id: 'project', name: 'Dự án', component: 'side_project', enabled: true });
  assert.deepEqual(categories.incomeGroups(report).map((item) => item.component), ['com', 'side_project', 'bo']);
  report.preset.snapshot.recipes = report.preset.snapshot.recipes.filter((recipe) => recipe.component !== 'bo');
  assert.deepEqual(categories.incomeGroups(report).map((item) => item.component), ['com', 'side_project']);
});

test('result columns and values follow recipe labels and omit absent deductions', () => {
  const report = sampleReport();
  report.preset.snapshot.recipes[0].meta = { presentation: { label: 'Thưởng dự án', role: 'income' } };
  let definitions = categories.resultColumns(report);
  assert.equal(definitions[0].label, 'Thưởng dự án');
  assert.equal(categories.componentValue(report.per_person[0], definitions.find((item) => item.component === 'penalty')), -10000);
  report.preset.snapshot.recipes = report.preset.snapshot.recipes.filter((recipe) => !['penalty', 'tax'].includes(recipe.component));
  definitions = categories.resultColumns(report);
  assert.ok(definitions.every((item) => !['deduction', 'tax'].includes(item.role)));
});

test('per-person PDF path renders the selected employee and their job', () => {
  let html = '';
  let printed = false;
  const originalWindow = global.window;
  const originalTimeout = global.setTimeout;
  global.window = {
    location: { href: 'file:///C:/tool/TinhIncentive.html' },
    open: () => ({
      document: { open() {}, write(value) { html += value; }, close() {} },
      focus() {},
      print() { printed = true; }
    })
  };
  global.setTimeout = (callback) => { callback(); return 1; };
  try {
    bke.writePersonPdf(sampleReport(), 0);
  } finally {
    global.window = originalWindow;
    global.setTimeout = originalTimeout;
  }

  assert.match(html, /Nguyễn An/);
  assert.match(html, /JOB-01/);
  assert.match(html, /Họ tên/);
  assert.doesNotMatch(html, /Sales chinh thuc|BO\/Thu viec|Thue TNCN tren incentive/);
  assert.equal(printed, true);
});
