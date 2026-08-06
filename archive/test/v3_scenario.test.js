// TEST-SCENARIO_v3 — acceptance gate "lệch = 0" (Claude/CEO).
// Kịch bản synthetic chứng minh engine v3 tái tạo đúng số tính tay.
// Đặc tả người-đọc: docs/spec/TEST-SCENARIO_v3.md
const test = require('node:test');
const assert = require('node:assert/strict');
const schema = require('../js/core/schema');
const engine = require('../js/core/engine');

const L = (type, value) => ({ kind: 'literal', type, value });
const N = (nodeId) => ({ kind: 'node', nodeId });
const F = (fieldId) => ({ kind: 'field', fieldId });

function comBaseNodes() {
  return [
    { id: 'src', blockId: 'source', inputs: {}, config: { table: 'jobs', ownerFieldId: 'job.owner_employee_id' } },
    { id: 'com', blockId: 'filter', inputs: { table: N('src') }, config: { fieldId: 'job.team', operator: 'eq', value: 'COM' } },
    { id: 'paid', blockId: 'filter', inputs: { table: N('com') }, config: { fieldId: 'job.payment_status', operator: 'eq', value: 'Paid' } },
    { id: 'f1', blockId: 'filter', inputs: { table: N('paid') }, config: { fieldId: 'job.tier', operator: 'eq', value: 'Mức 1' } },
    { id: 's1', blockId: 'scan_sum', inputs: { table: N('f1') }, config: { fieldId: 'job.gp' } },
    { id: 'f2', blockId: 'filter', inputs: { table: N('paid') }, config: { fieldId: 'job.tier', operator: 'eq', value: 'Mức 2' } },
    { id: 's2', blockId: 'scan_sum', inputs: { table: N('f2') }, config: { fieldId: 'job.gp' } },
    { id: 'f3', blockId: 'filter', inputs: { table: N('paid') }, config: { fieldId: 'job.tier', operator: 'eq', value: 'Mức 3' } },
    { id: 's3', blockId: 'scan_sum', inputs: { table: N('f3') }, config: { fieldId: 'job.gp' } },
    { id: 'wf', blockId: 'macro.waterfall', inputs: { gpLevel1: N('s1'), gpLevel2: N('s2'), gpLevel3: N('s3'), target: L('Money', 100000000), adjustment: L('Percent', 0.01) }, config: { rates: [0.08, 0.12, 0.17] } }
  ];
}
function boBaseNodes() {
  return [
    { id: 'src', blockId: 'source', inputs: {}, config: { table: 'jobs', ownerFieldId: 'job.owner_employee_id' } },
    { id: 'bo', blockId: 'filter', inputs: { table: N('src') }, config: { fieldId: 'job.team', operator: 'eq', value: 'BO' } },
    { id: 'paid', blockId: 'filter', inputs: { table: N('bo') }, config: { fieldId: 'job.payment_status', operator: 'eq', value: 'Paid' } },
    { id: 'sum', blockId: 'scan_sum', inputs: { table: N('paid') }, config: { fieldId: 'job.gp' } },
    { id: 'pct', blockId: 'percent_of', inputs: { base: N('sum'), rate: L('Percent', 0.08) }, config: {} }
  ];
}
function kaeBaseNodes() {
  return [
    { id: 'src', blockId: 'source', inputs: {}, config: { table: 'jobs', ownerFieldId: 'job.owner_employee_id' } },
    { id: 'fa', blockId: 'filter', inputs: { table: N('src') }, config: { fieldId: 'job.team', operator: 'eq', value: 'KAE-ADMIN' } },
    { id: 'admin', blockId: 'scan_sum', inputs: { table: N('fa') }, config: { fieldId: 'job.gp' } },
    { id: 'fs', blockId: 'filter', inputs: { table: N('src') }, config: { fieldId: 'job.team', operator: 'eq', value: 'KAE-SALE' } },
    { id: 'sale', blockId: 'scan_sum', inputs: { table: N('fs') }, config: { fieldId: 'job.gp' } },
    { id: 'pool', blockId: 'macro.kae_pool', inputs: { adminGp: N('admin'), saleGp: N('sale'), participantCount: L('Number', 3) }, config: { adminRate: 0.05, saleRate: 0.02 } }
  ];
}
const TAX_CFG = { rates: [0.05, 0.10, 0.20, 0.30, 0.35], quickDeductions: [0, 500000, 3500000, 9500000, 14500000], flatRate: 0.10 };
function taxRecipe(id, baseNodes, baseOut) {
  return { id, name: id, enabled: true, scope: 'person', component: 'tax',
    nodes: baseNodes.concat([{ id: 'tax', blockId: 'macro.tax_dual', inputs: { taxableIncome: N(baseOut), hasLaborContract: F('roster.has_labor_contract') }, config: TAX_CFG }]),
    output: { nodeId: 'tax', type: 'Money' } };
}

function buildPreset() {
  return schema.createPreset({ id: 'SCENARIO-Q-TEST', name: 'Kịch bản kiểm thử engine', version: '1.0.0', recipes: [
    { id: 'com', name: 'COM Waterfall', enabled: true, scope: 'person', component: 'com', nodes: comBaseNodes(), output: { nodeId: 'wf', type: 'Money' } },
    { id: 'bo', name: 'BO 8%', enabled: true, scope: 'person', component: 'bo', nodes: boBaseNodes(), output: { nodeId: 'pct', type: 'Money' } },
    { id: 'kae', name: 'KAE Pool', enabled: true, scope: 'person', component: 'kae', nodes: kaeBaseNodes(), output: { nodeId: 'pool', type: 'Money' } },
    { id: 'penalty', name: 'Điều chỉnh/phạt', enabled: true, scope: 'person', component: 'penalty',
      nodes: [{ id: 'src', blockId: 'source', inputs: {}, config: { table: 'jobs', ownerFieldId: 'job.owner_employee_id' } },
              { id: 'sum', blockId: 'scan_sum', inputs: { table: N('src') }, config: { fieldId: 'job.penalty' } }], output: { nodeId: 'sum', type: 'Money' } },
    taxRecipe('tax_com', comBaseNodes(), 'wf'),
    taxRecipe('tax_bo', boBaseNodes(), 'pct'),
    taxRecipe('tax_kae', kaeBaseNodes(), 'pool')
  ] });
}
function buildInput() {
  const roster = [
    { 'roster.employee_id': 'E-01', 'roster.name': 'P1 COM', 'roster.profile': 'COM', 'roster.has_labor_contract': true },
    { 'roster.employee_id': 'E-02', 'roster.name': 'P2 BO', 'roster.profile': 'BO', 'roster.has_labor_contract': false },
    { 'roster.employee_id': 'E-03', 'roster.name': 'P3 KAE', 'roster.profile': 'KAE', 'roster.has_labor_contract': true }
  ];
  const job = (o) => Object.assign({ 'job.payment_status': 'Paid', 'job.penalty': 0, 'job.tier': '' }, o);
  const jobs = [
    job({ 'job.id': 'J1', 'job.owner_employee_id': 'E-01', 'job.team': 'COM', 'job.tier': 'Mức 1', 'job.gp': 120000000 }),
    job({ 'job.id': 'J2', 'job.owner_employee_id': 'E-01', 'job.team': 'COM', 'job.tier': 'Mức 2', 'job.gp': 50000000 }),
    job({ 'job.id': 'J3', 'job.owner_employee_id': 'E-01', 'job.team': 'COM', 'job.tier': 'Mức 3', 'job.gp': 30000000 }),
    job({ 'job.id': 'J4', 'job.owner_employee_id': 'E-01', 'job.team': 'COM', 'job.payment_status': 'Unpaid', 'job.penalty': 1000000, 'job.gp': 0 }),
    job({ 'job.id': 'J5', 'job.owner_employee_id': 'E-02', 'job.team': 'BO', 'job.gp': 40000000 }),
    job({ 'job.id': 'J6', 'job.owner_employee_id': 'E-03', 'job.team': 'KAE-ADMIN', 'job.gp': 100000000 }),
    job({ 'job.id': 'J7', 'job.owner_employee_id': 'E-03', 'job.team': 'KAE-SALE', 'job.gp': 50000000 })
  ];
  return { roster, jobs, quarter: 'Q-TEST' };
}

// Số kỳ vọng tính tay (xem docs/spec/TEST-SCENARIO_v3.md để có lập luận từng dòng).
const EXPECTED = {
  'E-01': { com: 13500000, bo: 0, kae: 0, gross: 13500000, penalty: 1000000, tax: 850000, net: 11650000 },
  'E-02': { com: 0, bo: 3200000, kae: 0, gross: 3200000, penalty: 0, tax: 320000, net: 2880000 },
  'E-03': { com: 0, bo: 0, kae: 2000000, gross: 2000000, penalty: 0, tax: 100000, net: 1900000 }
};
const EXPECTED_TOTALS = { grossIncentive: 18700000, penalty: 1000000, tax: 1270000, netPay: 16430000, peopleWithPay: 3 };

test('TEST-SCENARIO_v3: engine reproduces hand-computed numbers with zero variance', () => {
  const out = engine.runPreset(buildPreset(), buildInput());
  assert.equal(out.validation.valid, true, 'preset phải hợp lệ');
  for (const p of out.per_person) {
    const e = EXPECTED[p.code];
    assert.ok(e, `thiếu kỳ vọng cho ${p.code}`);
    assert.equal(p.components.com || 0, e.com, `${p.code} com`);
    assert.equal(p.components.bo || 0, e.bo, `${p.code} bo`);
    assert.equal(p.components.kae || 0, e.kae, `${p.code} kae`);
    assert.equal(p.grossIncentive, e.gross, `${p.code} gross`);
    assert.equal(p.penalty, e.penalty, `${p.code} penalty`);
    assert.equal(p.tax.taxOnIncentive, e.tax, `${p.code} tax`);
    assert.equal(p.netPay, e.net, `${p.code} net`);
  }
  assert.equal(out.totals.grossIncentive, EXPECTED_TOTALS.grossIncentive);
  assert.equal(out.totals.penalty, EXPECTED_TOTALS.penalty);
  assert.equal(out.totals.tax, EXPECTED_TOTALS.tax);
  assert.equal(out.totals.netPay, EXPECTED_TOTALS.netPay);
  assert.equal(out.totals.peopleWithPay, EXPECTED_TOTALS.peopleWithPay);
});
