const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const schema = require('../js/core/schema');
const registry = require('../js/core/registry');
const validator = require('../js/core/validator');
const engine = require('../js/core/engine');
const storage = require('../js/adapters/storage');
const xlsx = require('../js/adapters/xlsx');
const XLSX = require('../js/vendor/xlsx.full.min.js');

function workbook(changedHeader) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['Employee ID', 'Name', 'Target', 'Rate %', 'Labor Contract'],
    ['E-01', 'Synthetic One', 100000000, 0.08, true]
  ]), 'Nhan Su');
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['Job ID', 'Employee ID', changedHeader || 'GP', 'Paid %', 'Payment Status'],
    ['J-01', 'E-01', 120000000, 0.08, 'Paid']
  ]), 'Jobs MISA');
  return book;
}

function discovered(changedHeader) {
  return xlsx.discoverWorkbook(workbook(changedHeader), XLSX);
}

function sampleWorkbook() {
  return XLSX.read(fs.readFileSync(path.join(__dirname, '..', 'INPUT-Incentive-mau.xlsx')), { type: 'buffer', cellDates: true });
}

test('v3 registry remains exactly 16 primitive blocks and 3 locked macros', () => {
  const blocks = registry.listBlocks();
  assert.equal(blocks.filter((block) => !block.lockedMacro).length, 16);
  assert.equal(blocks.filter((block) => block.lockedMacro).length, 3);
});

test('filter in matches any comma, semicolon or newline item after case and accent normalization', () => {
  const fields = [{ id: 'job.team', label: 'Team', type: 'Text', table: 'jobs' }];
  const recipe = schema.createRecipe({
    id: 'team-in-list',
    nodes: [
      { id: 'src', blockId: 'source', inputs: {}, config: { table: 'jobs', ownerFieldId: '' } },
      { id: 'teams', blockId: 'filter', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: {
        fieldId: 'job.team', operator: 'in', value: ' general, NEW ;\n Moi ; '
      } }
    ],
    output: { nodeId: 'teams', type: 'Table' }
  });
  const rows = [
    { id: 'J1', 'job.team': 'General' },
    { id: 'J2', 'job.team': 'new' },
    { id: 'J3', 'job.team': 'Mới' },
    { id: 'J4', 'job.team': 'Khác' }
  ];
  const output = engine.executeRecipe(recipe, { fields, tables: { jobs: rows } });
  assert.deepEqual(output.value.map((row) => row.id), ['J1', 'J2', 'J3']);
  assert.deepEqual(rows.map((row) => row['job.team']), ['General', 'new', 'Mới', 'Khác']);
});

test('map lookup attaches a derived field that downstream filter and sum can type-check', () => {
  const fields = [
    { id: 'jobs.customer', label: 'Khách hàng', type: 'Text', table: 'jobs' },
    { id: 'jobs.gp', label: 'GP', type: 'Money', table: 'jobs' },
    { id: 'customers.name', label: 'Khách hàng', type: 'Text', table: 'customers' },
    { id: 'customers.tier', label: 'Mức khách hàng', type: 'Text', table: 'customers' }
  ];
  const recipe = schema.createRecipe({
    id: 'map-and-sum',
    nodes: [
      { id: 'src', blockId: 'source', inputs: {}, config: { table: 'jobs', ownerFieldId: '' } },
      { id: 'map', blockId: 'map_lookup', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: {
        sourceKeyFieldId: 'jobs.customer', table: 'customers', lookupFieldId: 'customers.name',
        returnFieldId: 'customers.tier', returnType: 'Text', derivedFieldId: 'derived:customer-tier',
        derivedFieldLabel: 'Mức khách hàng', fallback: 'Chưa xếp'
      } },
      { id: 'gold', blockId: 'filter', inputs: { table: { kind: 'node', nodeId: 'map' } }, config: { fieldId: 'derived:customer-tier', operator: 'eq', value: 'Gold' } },
      { id: 'sum', blockId: 'scan_sum', inputs: { table: { kind: 'node', nodeId: 'gold' } }, config: { fieldId: 'jobs.gp' } }
    ],
    output: { nodeId: 'sum', type: 'Money' }
  });
  const jobs = [
    { 'job.id': 'J1', 'jobs.customer': 'Alpha', 'jobs.gp': 100 },
    { 'job.id': 'J2', 'jobs.customer': 'Beta', 'jobs.gp': 200 },
    { 'job.id': 'J3', 'jobs.customer': 'Missing', 'jobs.gp': 300 }
  ];
  const output = engine.executeRecipe(recipe, { fields, tables: {
    jobs,
    customers: [
      { 'customers.name': 'Alpha', 'customers.tier': 'Gold' },
      { 'customers.name': 'Beta', 'customers.tier': 'Silver' }
    ]
  } });
  assert.equal(output.value, 100);
  assert.deepEqual(output.trace.nodes.find((node) => node.nodeId === 'map').detail, {
    matchedCount: 2, rowCount: 3, derivedFieldId: 'derived:customer-tier'
  });
  assert.ok(jobs.every((row) => !Object.hasOwn(row, 'derived:customer-tier')), 'workbook rows stay immutable');
});

test('map lookup clones every row and applies a typed fallback when no key matches', () => {
  const fields = [
    { id: 'jobs.customer', label: 'Khách hàng', type: 'Text', table: 'jobs' },
    { id: 'customers.name', label: 'Khách hàng', type: 'Text', table: 'customers' },
    { id: 'customers.score', label: 'Điểm', type: 'Number', table: 'customers' }
  ];
  const recipe = schema.createRecipe({
    id: 'map-fallback',
    nodes: [
      { id: 'src', blockId: 'source', inputs: {}, config: { table: 'jobs', ownerFieldId: '' } },
      { id: 'map', blockId: 'map_lookup', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: {
        sourceKeyFieldId: 'jobs.customer', table: 'customers', lookupFieldId: 'customers.name',
        returnFieldId: 'customers.score', returnType: 'Number', derivedFieldId: 'derived:score',
        derivedFieldLabel: 'Điểm khách hàng', fallback: '0'
      } }
    ],
    output: { nodeId: 'map', type: 'Table' }
  });
  const sourceRow = { 'job.id': 'J1', 'jobs.customer': 'Missing' };
  const output = engine.executeRecipe(recipe, { fields, tables: { jobs: [sourceRow], customers: [] } });
  assert.equal(output.value[0]['derived:score'], 0);
  assert.notEqual(output.value[0], sourceRow);
  assert.equal(Object.hasOwn(sourceRow, 'derived:score'), false);
});

test('map arithmetic chains derived fields for a three-factor row calculation without mutating source rows', () => {
  const fields = [
    { id: 'debt.revenue', label: 'Doanh thu sau thuế', type: 'Money', table: 'debt' },
    { id: 'debt.months', label: 'Số tháng quá hạn', type: 'Number', table: 'debt' }
  ];
  const recipe = schema.createRecipe({
    id: 'penalty-from-raw',
    nodes: [
      { id: 'src', blockId: 'source', inputs: {}, config: { table: 'debt', ownerFieldId: '' } },
      { id: 'revenue-months', blockId: 'map_arithmetic', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: {
        leftMode: 'field', leftFieldId: 'debt.revenue', leftLiteral: 0, leftLiteralType: 'Number',
        operator: '*', rightMode: 'field', rightFieldId: 'debt.months', rightLiteral: 0, rightLiteralType: 'Number',
        derivedFieldId: 'derived:revenue-months', derivedFieldLabel: 'Doanh thu × tháng'
      } },
      { id: 'penalty-row', blockId: 'map_arithmetic', inputs: { table: { kind: 'node', nodeId: 'revenue-months' } }, config: {
        leftMode: 'field', leftFieldId: 'derived:revenue-months', leftLiteral: 0, leftLiteralType: 'Number',
        operator: '*', rightMode: 'literal', rightFieldId: '', rightLiteral: 0.01, rightLiteralType: 'Percent',
        derivedFieldId: 'derived:penalty-row', derivedFieldLabel: 'Phạt dòng tự tính'
      } },
      { id: 'sum', blockId: 'scan_sum', inputs: { table: { kind: 'node', nodeId: 'penalty-row' } }, config: { fieldId: 'derived:penalty-row' } }
    ],
    output: { nodeId: 'sum', type: 'Money' }
  });
  const debtRows = [
    { 'job.id': 'D1', 'debt.revenue': 78840000, 'debt.months': 2 },
    { 'job.id': 'D2', 'debt.revenue': 54993600, 'debt.months': 2 }
  ];
  const output = engine.executeRecipe(recipe, { fields, tables: { debt: debtRows } });
  assert.equal(output.value, 2676672);
  assert.equal(output.trace.nodes.find((node) => node.nodeId === 'penalty-row').detail.invalidCount, 0);
  assert.ok(debtRows.every((row) => !Object.hasOwn(row, 'derived:revenue-months') && !Object.hasOwn(row, 'derived:penalty-row')));
});

test('map arithmetic type-check rejects text math and literal division by zero', () => {
  const fields = [
    { id: 'rows.label', label: 'Nhãn', type: 'Text', table: 'rows' },
    { id: 'rows.amount', label: 'Số tiền', type: 'Money', table: 'rows' }
  ];
  const recipe = schema.createRecipe({
    id: 'bad-map-math',
    nodes: [
      { id: 'src', blockId: 'source', inputs: {}, config: { table: 'rows', ownerFieldId: '' } },
      { id: 'bad-type', blockId: 'map_arithmetic', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: {
        leftMode: 'field', leftFieldId: 'rows.label', leftLiteral: 0, leftLiteralType: 'Number', operator: '*',
        rightMode: 'field', rightFieldId: 'rows.amount', rightLiteral: 0, rightLiteralType: 'Number',
        derivedFieldId: 'derived:bad-type', derivedFieldLabel: 'Sai kiểu'
      } },
      { id: 'divide-zero', blockId: 'map_arithmetic', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: {
        leftMode: 'field', leftFieldId: 'rows.amount', leftLiteral: 0, leftLiteralType: 'Number', operator: '/',
        rightMode: 'literal', rightFieldId: '', rightLiteral: 0, rightLiteralType: 'Number',
        derivedFieldId: 'derived:divide-zero', derivedFieldLabel: 'Chia không'
      } }
    ],
    output: { nodeId: 'divide-zero', type: 'Table' }
  });
  const errors = validator.validateRecipe(recipe, fields).errors;
  assert.ok(errors.some((error) => error.code === 'TYPE_MISMATCH' && error.nodeId === 'bad-type'));
  assert.ok(errors.some((error) => error.code === 'DIVIDE_BY_ZERO' && error.nodeId === 'divide-zero'));
  assert.equal(registry.mapArithmeticOutputType('Money', 'Percent', '*'), 'Money');
  assert.equal(registry.mapArithmeticOutputType('Money', 'Money', '*'), null);
});

test('type checker blocks Money + Percent, divide by zero and cycles once', () => {
  const recipe = schema.createRecipe({ id: 'bad', nodes: [
    { id: 'a', blockId: 'arithmetic', inputs: { left: { kind: 'literal', type: 'Money', value: 10 }, right: { kind: 'literal', type: 'Percent', value: .1 } }, config: { operator: '+' } },
    { id: 'b', blockId: 'arithmetic', inputs: { left: { kind: 'literal', type: 'Money', value: 10 }, right: { kind: 'literal', type: 'Number', value: 0 } }, config: { operator: '/' } },
    { id: 'c', blockId: 'round_vnd', inputs: { value: { kind: 'node', nodeId: 'd' } }, config: {} },
    { id: 'd', blockId: 'round_vnd', inputs: { value: { kind: 'node', nodeId: 'c' } }, config: {} }
  ], output: { nodeId: 'a', type: 'Money' } });
  const codes = validator.validateRecipe(recipe, schema.FIELD_CATALOG).errors.map((error) => error.code);
  assert.equal(codes.filter((code) => code === 'TYPE_MISMATCH').length, 1);
  assert.equal(codes.filter((code) => code === 'DIVIDE_BY_ZERO').length, 1);
  assert.equal(codes.filter((code) => code === 'CYCLE').length, 1);
});

test('multi-sheet workbook headers become dynamic fields and decimal percentages stay raw', () => {
  const source = discovered();
  assert.deepEqual(source.sheets.map((sheet) => [sheet.name, sheet.role]), [['Nhan Su', 'Chủ thể'], ['Jobs MISA', 'Giao dịch']]);
  assert.equal(source.sheets[0].fields.find((field) => field.header === 'Rate %').type, 'Percent');
  assert.equal(source.sheets[1].fields.find((field) => field.header === 'GP').type, 'Money');
  const prepared = xlsx.prepareSourceSchema(source);
  const bindings = xlsx.suggestBindings(prepared, {});
  const data = xlsx.materializeWorkbook(workbook(), prepared, bindings, XLSX);
  const rateId = schema.sourceFieldId('Nhan Su', 'Rate %');
  assert.equal(data.roster[0][rateId], 0.08);
});

test('same workbook schema reconciles exactly while a changed header requires remap', () => {
  const saved = xlsx.prepareSourceSchema(discovered());
  const same = xlsx.reconcileSourceSchema(discovered(), saved);
  const changed = xlsx.reconcileSourceSchema(discovered('Gross Profit'), saved);
  assert.equal(same.comparison.exact, true);
  assert.equal(changed.comparison.exact, false);
  assert.ok(changed.comparison.missing.some((key) => key.includes(':GP')));
  assert.ok(changed.comparison.added.some((key) => key.includes('Gross Profit')));
});

test('materializer copies GP and target directly into engine aliases without recomputing', () => {
  const source = xlsx.prepareSourceSchema(discovered());
  const bindings = xlsx.suggestBindings(source, {});
  const data = xlsx.materializeWorkbook(workbook(), source, bindings, XLSX);
  assert.equal(data.jobs[0]['job.gp'], 120000000);
  assert.equal(data.roster[0]['roster.target_quarter'], 100000000);
  assert.equal(data.jobs[0]['job.owner_employee_id'], 'E-01');
  assert.equal(data.roster[0]['roster.employee_id'], 'E-01');
});

test('preset persistence stores metadata only and rejects embedded period rows', () => {
  const values = new Map();
  const local = { setItem(key, value) { values.set(key, value); }, getItem(key) { return values.get(key) || null; } };
  const preset = schema.createPreset({ id: 'SAFE', sourceSchema: xlsx.prepareSourceSchema(discovered()), bindings: {}, recipes: [] });
  storage.savePreset(local, preset);
  assert.deepEqual(storage.loadPreset(local).id, 'SAFE');
  assert.deepEqual(Array.from(values.keys()), ['incal.v3.preset.v2']);
  assert.throws(() => storage.savePreset(local, Object.assign({}, preset, { rows: [{ salary: 1 }] })), /không được chứa dữ liệu kỳ/);
});

test('dynamic Job and Nhân sự fields run together and keep component-job-block trace', () => {
  const source = xlsx.prepareSourceSchema(discovered());
  const bindings = xlsx.suggestBindings(source, {});
  const data = xlsx.materializeWorkbook(workbook(), source, bindings, XLSX);
  const gp = schema.sourceFieldId('Jobs MISA', 'GP');
  const owner = schema.sourceFieldId('Jobs MISA', 'Employee ID');
  const rate = schema.sourceFieldId('Nhan Su', 'Rate %');
  const preset = schema.createPreset({ id: 'DYNAMIC', sourceSchema: source, bindings, recipes: [{
    id: 'award', name: 'GP x rate', enabled: true, component: 'bo',
    nodes: [
      { id: 'src', blockId: 'source', inputs: {}, config: { table: schema.tableIdForSheet('Jobs MISA'), ownerFieldId: owner } },
      { id: 'sum', blockId: 'scan_sum', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: { fieldId: gp } },
      { id: 'pct', blockId: 'percent_of', inputs: { base: { kind: 'node', nodeId: 'sum' }, rate: { kind: 'field', fieldId: rate } }, config: {} }
    ], output: { nodeId: 'pct', type: 'Money' }
  }] });
  const result = engine.runPreset(preset, Object.assign({ quarter: 'Q-TEST' }, data));
  assert.equal(result.validation.valid, true);
  assert.equal(result.per_person[0].netPay, 9600000);
  assert.deepEqual(result.per_person[0].trace.components[0].nodes[1].jobIds, ['J-01']);
});

test('four-sheet sample becomes four user-defined entities and subject table controls result grain', () => {
  const book = sampleWorkbook();
  const source = xlsx.prepareSourceSchema(xlsx.discoverWorkbook(book, XLSX));
  assert.equal(source.sheets.length, 4);
  assert.equal(source.sheets.some((table) => table.role === 'ignore'), false);
  assert.equal(schema.subjectTable(source).name, 'Nhân sự');
  const peopleData = xlsx.materializeWorkbook(book, source, xlsx.suggestBindings(source, {}), XLSX);
  assert.equal(peopleData.roster.length, 1);
  const jobsSource = schema.clone(source);
  jobsSource.subjectTableId = schema.tableIdForSheet('Jobs');
  const jobsData = xlsx.materializeWorkbook(book, jobsSource, xlsx.suggestBindings(jobsSource, {}), XLSX);
  assert.equal(jobsData.roster.length, 10);
});

test('lookup crosses from a Job row to the customer table by key without changing registry', () => {
  const book = sampleWorkbook();
  const source = xlsx.prepareSourceSchema(xlsx.discoverWorkbook(book, XLSX));
  const data = xlsx.materializeWorkbook(book, source, xlsx.suggestBindings(source, {}), XLSX);
  const customerOnJob = schema.sourceFieldId('Jobs', 'Khách hàng');
  const customerKey = schema.sourceFieldId('Khách hàng', 'Khách hàng');
  const tier = schema.sourceFieldId('Khách hàng', 'Mức');
  const recipe = schema.createRecipe({ id: 'customer-lookup', nodes: [{
    id: 'lookup', blockId: 'lookup',
    inputs: { key: { kind: 'field', fieldId: customerOnJob } },
    config: { table: schema.tableIdForSheet('Khách hàng'), lookupFieldId: customerKey, returnFieldId: tier, returnType: 'Text', fallback: '' }
  }], output: { nodeId: 'lookup', type: 'Text' } });
  const result = engine.executeRecipe(recipe, { fields: data.fields, tables: data.tables, currentRow: data.tables[schema.tableIdForSheet('Jobs')][0] });
  assert.equal(result.value, 'Mức 3');
});

test('official Q1 preset derives penalty rows and preserves the approved zero-delta NET', () => {
  const book = sampleWorkbook();
  const preset = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'presets', 'trustana-q1.json'), 'utf8'));
  const data = xlsx.materializeWorkbook(book, preset.sourceSchema, preset.bindings, XLSX);
  const result = engine.runPreset(preset, Object.assign({ quarter: 'Q1-2026' }, data));
  assert.equal(result.validation.valid, true);
  assert.equal(result.per_person.length, 1);
  assert.equal(result.per_person[0].penalty, 2676672);
  assert.equal(result.per_person[0].netPay, 12516386);
  assert.equal(result.per_person[0].netPay - 12516386, 0);
  const penaltyRecipe = preset.recipes.find((recipe) => recipe.component === 'penalty');
  assert.deepEqual(penaltyRecipe.nodes.map((node) => node.blockId), ['source', 'map_arithmetic', 'map_arithmetic', 'scan_sum']);
  assert.equal(preset.sourceSchema.sheets.some((sheet) => sheet.fields.some((field) => field.header === 'Phạt dòng')), false);
});

test('exact reload preserves N-table labels, roles, keys, subject and lookup relation', () => {
  const book = sampleWorkbook();
  const saved = xlsx.prepareSourceSchema(xlsx.discoverWorkbook(book, XLSX));
  saved.sheets.find((table) => table.name === 'Khách hàng').label = 'Danh mục khách';
  saved.sheets.find((table) => table.name === 'Khách hàng').role = 'Phân loại tier';
  saved.relations = [{ id: 'r1', targetTableId: schema.tableIdForSheet('Khách hàng') }];
  const exact = xlsx.reconcileSourceSchema(xlsx.discoverWorkbook(book, XLSX), saved);
  assert.equal(exact.comparison.exact, true);
  assert.equal(exact.schema.sheets.find((table) => table.name === 'Khách hàng').label, 'Danh mục khách');
  assert.equal(exact.schema.sheets.find((table) => table.name === 'Khách hàng').role, 'Phân loại tier');
  assert.equal(exact.schema.subjectTableId, saved.subjectTableId);
  assert.deepEqual(exact.schema.relations, saved.relations);
});
