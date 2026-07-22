const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const schema = require('../js/core/schema');
const validator = require('../js/core/validator');
const history = require('../js/core/history');
const xlsx = require('../js/adapters/xlsx');
const XLSX = require('../js/vendor/xlsx.full.min.js');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function book(header = 'GP') {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Employee ID', 'Name', 'Target'], ['E1', 'P1', 50000000]]), 'Nhan Su');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Job ID', 'Employee ID', header], ['J1', 'E1', 100000000]]), 'Jobs');
  return workbook;
}

test('root app exposes four workflow tabs, local assets and multi-period Dashboard aggregation', () => {
  const html = read('index.html');
  assert.equal((html.match(/class="tab(?: |")/g) || []).length, 4);
  for (const id of ['tab-input', 'tab-formulas', 'tab-calculate', 'tab-dashboard']) assert.match(html, new RegExp(`id="${id}"`));
  assert.doesNotMatch(html, /tab-roster|Đẻ Excel input/);
  const refs = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), (match) => match[1]).filter((value) => value !== '#');
  assert.ok(refs.every((value) => !/^(?:https?:)?\/\//i.test(value)));
  assert.ok(refs.every((value) => fs.existsSync(path.join(root, value))));
  const report = (quarter, netPay) => ({ quarter, totals: { grossIncentive: netPay, penalty: 0, tax: 0, netPay, peopleWithPay: 1 }, per_person: [{ employeeId: 'E1', name: 'P1', team: 'BO', netPay }] });
  const summary = history.summarizeReports([report('Q1-2026', 100), report('Q2-2026', 200)]);
  assert.equal(summary.reportCount, 2);
  assert.equal(summary.totals.netPay, 300);
  assert.equal(summary.people[0].netPay, 300);
});

test('runtime contains no dynamic execution or network-capable API and empty preset has no rules', () => {
  const runtime = ['js/app.js', 'js/core/engine.js', 'js/core/registry.js', 'js/adapters/xlsx.js', 'js/adapters/storage.js'].map(read).join('\n');
  assert.doesNotMatch(runtime, /\beval\s*\(|new\s+Function\b/);
  assert.doesNotMatch(runtime, /\bfetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//);
  const preset = JSON.parse(read('presets/empty-preset.json'));
  assert.deepEqual(preset.recipes, []);
});

test('a recipe can bind a Job column and a Nhân sự column from grouped source fields', () => {
  const source = xlsx.prepareSourceSchema(xlsx.discoverWorkbook(book(), XLSX));
  const gp = schema.sourceFieldId('Jobs', 'GP');
  const owner = schema.sourceFieldId('Jobs', 'Employee ID');
  const target = schema.sourceFieldId('Nhan Su', 'Target');
  const recipe = schema.createRecipe({ id: 'mixed', nodes: [
    { id: 'src', blockId: 'source', inputs: {}, config: { table: schema.tableIdForSheet('Jobs'), ownerFieldId: owner } },
    { id: 'sum', blockId: 'scan_sum', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: { fieldId: gp } },
    { id: 'delta', blockId: 'arithmetic', inputs: { left: { kind: 'node', nodeId: 'sum' }, right: { kind: 'field', fieldId: target } }, config: { operator: '-' } }
  ], output: { nodeId: 'delta', type: 'Money' } });
  const validation = validator.validateRecipe(recipe, schema.sourceFields(source));
  assert.equal(validation.valid, true);
  assert.match(gp, /^source:Jobs::GP$/);
  assert.match(target, /^source:Nhan%20Su::Target$/);
});

test('saved sheet roles and types are reused on exact schema reload', () => {
  const source = xlsx.prepareSourceSchema(xlsx.discoverWorkbook(book(), XLSX));
  source.sheets.find((sheet) => sheet.name === 'Jobs').fields.find((field) => field.header === 'GP').type = 'Number';
  const exact = xlsx.reconcileSourceSchema(xlsx.discoverWorkbook(book(), XLSX), source);
  assert.equal(exact.comparison.exact, true);
  assert.equal(exact.schema.sheets.find((sheet) => sheet.name === 'Jobs').fields.find((field) => field.header === 'GP').type, 'Number');
});

test('changed header produces an explicit mismatch instead of a silent mapping', () => {
  const saved = xlsx.prepareSourceSchema(xlsx.discoverWorkbook(book(), XLSX));
  const changed = xlsx.discoverWorkbook(book('GP Actual'), XLSX);
  const comparison = xlsx.compareSourceSchema(saved, changed);
  assert.equal(comparison.exact, false);
  assert.ok(comparison.missing.length > 0);
  assert.ok(comparison.added.length > 0);
  assert.match(read('js/app.js'), /Header lệch preset/);
});

test('localStorage runtime key is preset-only and no salary or roster data key remains', () => {
  const storage = read('js/adapters/storage.js');
  const app = read('js/app.js');
  assert.match(storage, /incal\.v3\.preset\.v2/);
  assert.doesNotMatch(storage, /ROSTER_KEY|saveRoster|loadRoster|incal\.v3\.roster/i);
  assert.doesNotMatch(app, /saveRoster|loadRoster|parseRosterTsv/);
});

test('Trustana visual system uses local new font, rounded surfaces, transitions and native hidden guard', () => {
  const css = read('css/app.css');
  const html = read('index.html');
  assert.match(css, /font-family:Quicksand/);
  assert.match(css, /font-family:Montserrat/);
  assert.match(css, /quicksand-vietnamese-700-normal\.woff2/);
  assert.match(css, /montserrat-vietnamese-400-normal\.woff2/);
  assert.match(css, /--brand:#4d148c/);
  assert.match(css, /--accent:#ff6200/);
  assert.match(css, /border-radius:var\(--radius-lg\)/);
  assert.match(css, /transition:/);
  assert.match(css, /\.chart-grid/);
  assert.match(css, /\[hidden\]\{display:none!important\}/);
  assert.match(html, /Logo_Trustana_PNGPurpleOrange\.png/);
});

test('runtime UI uses one calculation subject selector and in-card identity mappings', () => {
  const html = read('index.html');
  const app = read('js/app.js');
  const adapter = read('js/adapters/xlsx.js');
  assert.match(html, /id="calculationSubject"/);
  assert.match(app, /data-subject-binding/);
  assert.match(app, /function changeCalculationSubject/);
  assert.match(app, /subjectBindings/);
  assert.doesNotMatch(app, /data-subject-table/);
  assert.doesNotMatch(app, /data-entity-role/);
  assert.doesNotMatch(adapter, /ROLE_OPTIONS|\['jobs', 'roster', 'ignore'\]/);
  assert.match(adapter, /tables\[table\.tableId\]/);
});

test('Formula tab exposes human-readable labels while preserving internal node and operator values', () => {
  const html = read('index.html');
  const app = read('js/app.js');
  assert.match(app, /eq: 'bằng'/);
  assert.match(app, /neq: 'khác'/);
  assert.match(app, /gte: 'lớn hơn hoặc bằng'/);
  assert.match(app, /lte: 'nhỏ hơn hoặc bằng'/);
  assert.match(app, /contains: 'chứa'/);
  assert.match(app, /trialTarget\.inputs\[portId\] = \{ kind: 'node', nodeId: sourceId \}/);
  assert.match(app, /V3\.validateRecipe\(trial, currentFields\(\)\)/);
  assert.match(app, /nodeReferenceLabel\(sourceNode, recipe\)/);
  assert.match(app, /`\$\{sheet\.name\} · \$\{field\.header\}`/);
  assert.match(app, /function humanizeFieldId/);
  assert.doesNotMatch(html, /Khai báo bảng và định danh/);
  assert.doesNotMatch(app, /data-set-output/);
});

test('Formula tab has two preset actions, exports JSON on save, and explains a disabled save', () => {
  const html = read('index.html');
  const app = read('js/app.js');
  const actions = html.match(/<div class="preset-actions"[\s\S]*?<\/div>/)?.[0] || '';
  assert.equal((actions.match(/class="button/g) || []).length, 2);
  assert.match(actions, />Nạp preset</);
  assert.match(actions, />Lưu preset</);
  assert.doesNotMatch(html, /id="exportPreset"|>Xuất JSON</);
  assert.match(html, /id="formulaCanvas"/);
  assert.match(html, /id="autoArrange"[^>]*>Tự xếp gọn</);
  assert.match(html, /id="recipeMenuButton"/);
  assert.doesNotMatch(html, /subjectBridge|SUBJECT BRIDGE/);
  assert.match(app, /V3\.savePreset\(localStorage, state\.preset\)/);
  assert.match(app, /function exportPresetFile\(\)[\s\S]*downloadText\(V3\.serializePreset/);
  assert.match(app, /savePresetReason\.textContent = disabledReason/);
  assert.match(app, /savePreset\.title = disabledReason/);
});

test('workflow chrome and exports use aligned controls and generic user-facing language', () => {
  const html = read('index.html');
  const css = read('css/app.css');
  const exportUi = [
    read('js/export/categories.js'),
    read('js/export/xlsx_bk.js'),
    read('js/export/xlsx_bke.js')
  ].join('\n');

  assert.doesNotMatch(html, /class="(?:offline-pill|step-note)/);
  assert.match(html, />Kỳ báo cáo</);
  assert.match(html, /đổi kỳ không tự tính lại số liệu/);
  for (const label of [
    'Tổng hợp chi trả · XLSX',
    'Dữ liệu job · JSON',
    'Báo cáo đầy đủ · JSON'
  ]) assert.match(html, new RegExp(label));
  assert.match(html, /id="componentExportButtons"/);
  assert.doesNotMatch(html, /Nhóm COM · XLSX|Nhóm Khác · XLSX|Nhóm BO · XLSX/);
  assert.doesNotMatch(html, />\s*BK(?:ê[^<]*)?\s*</i);
  assert.doesNotMatch(exportUi, /BẢNG KÊ|BANG KE|BKê|BKe-/i);
  assert.match(css, /select\{-webkit-appearance:none;appearance:none;padding-right:34px!important/);
  assert.match(css, /background-position:right 11px center!important/);
});

test('Formula canvas is offline SVG, stores additive node metadata and derives one automatic output', () => {
  const html = read('index.html');
  const app = read('js/app.js');
  const canvas = read('js/ui/formula_canvas.js');
  const categories = read('js/export/categories.js');
  assert.match(html, /js\/ui\/formula_canvas\.js/);
  assert.match(html, /id="connectionLayer"/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(canvas, /node\.meta\.canvas = Object\.assign\(\{\}, node\.meta\.canvas \|\| \{\}, \{ x: snap\(x, grid\), y: snap\(y, grid\) \}\)/);
  assert.match(canvas, /function sinkNodeIds/);
  assert.match(canvas, /function autoArrange/);
  assert.match(canvas, /function bezierPath/);
  assert.match(app, /Canvas\.syncOutput/);
  assert.match(app, /TYPE_MISMATCH/);
  assert.match(app, /item\.code === 'CYCLE'/);
  assert.doesNotMatch(categories, /CATEGORY_RULES|KHAC/);
  assert.match(categories, /person\.components\?\.\[key\]/);
  assert.match(categories, /SPECIAL_COMPONENT_ROLES/);
});

test('Tính cột is an additive table primitive with derived-field registration and no engine rewrite', () => {
  const registry = read('js/core/registry.js');
  const validator = read('js/core/validator.js');
  const app = read('js/app.js');
  const engine = read('js/core/engine.js');
  assert.match(registry, /block\('map_arithmetic', 'Tính cột'/);
  assert.match(registry, /mapArithmeticOutputType/);
  assert.match(validator, /validateMapArithmetic/);
  assert.match(validator, /registerDerivedFields/);
  assert.match(app, /blockId === 'map_arithmetic'/);
  assert.match(app, /derivedFieldLabel/);
  assert.doesNotMatch(engine, /map_arithmetic/);
});

test('Formula canvas exposes mature camera, reconnect and transient node actions', () => {
  const html = read('index.html');
  const css = read('css/app.css');
  const app = read('js/app.js');
  const canvas = read('js/ui/formula_canvas.js');
  for (const id of ['zoomOut', 'zoomReset', 'zoomIn', 'zoomFit', 'connectionCursor', 'nodeSettingsDialog', 'nodeContextMenu']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html, /class="builder-column inspector-panel"/);
  assert.match(html, /marker-end="url\(#ghostArrow\)"/);
  assert.match(css, /--chevron-icon:/);
  assert.match(css, /grid-template-columns:184px minmax\(0,1fr\)/);
  assert.match(css, /graph-input-port\.candidate-valid/);
  assert.match(css, /graph-edge-hit/);
  assert.match(css, /node-status-dot/);
  assert.match(app, /function beginInputRetarget/);
  assert.match(app, /function onEdgePointerDown/);
  assert.match(app, /function beginEdgeSourceRetarget/);
  assert.match(app, /function resetCanvasTransientState/);
  assert.match(app, /function onNodeContextMenu/);
  assert.match(app, /function placeCanvasMenu/);
  assert.match(app, /function setCanvasZoom/);
  assert.match(app, /originalTarget\.inputs\[original\.portId\]/);
  assert.match(canvas, /function zoomAt/);
  assert.match(canvas, /function fitCamera/);
  assert.match(html, /class="menu-icon" aria-hidden="true"><svg/);
  assert.doesNotMatch(html, /<span aria-hidden="true">[⌘⧉◎↯×]<\/span>/);
});

test('results and person exports derive visible columns from recipe presentation metadata', () => {
  const html = read('index.html');
  const app = read('js/app.js');
  const categories = read('js/export/categories.js');
  const detail = read('js/export/xlsx_bke.js');
  assert.match(html, /id="resultsHead"/);
  assert.doesNotMatch(html, /<th>COM<\/th>|<th>KAE<\/th>|<th>Khác\/BO<\/th>/);
  assert.match(app, /Export\.resultColumns\(state\.report \|\| state\.preset\)/);
  assert.match(categories, /meta\?\.presentation\?\.label/);
  assert.match(categories, /function componentValue/);
  assert.match(detail, /presentation\.resultColumns\(report\)/);
  assert.doesNotMatch(detail, /Sales chinh thuc|Truong BP|BO\/Thu viec|Thue TNCN tren incentive/);
});
