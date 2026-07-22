const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

function loadPlaywright() {
  try { return require('playwright'); }
  catch (originalError) {
    const npxRoot = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    if (fs.existsSync(npxRoot)) {
      const candidates = fs.readdirSync(npxRoot)
        .map((name) => path.join(npxRoot, name, 'node_modules', 'playwright'))
        .filter((candidate) => fs.existsSync(path.join(candidate, 'package.json')))
        .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
      if (candidates[0]) return require(candidates[0]);
    }
    throw originalError;
  }
}

const { chromium } = loadPlaywright();
const XLSX = require('../js/vendor/xlsx.full.min.js');
const schema = require('../js/core/schema');
const xlsxAdapter = require('../js/adapters/xlsx');

const root = path.join(__dirname, '..');
const appUrl = pathToFileURL(path.join(root, 'index.html')).href;
const samplePath = path.join(root, 'INPUT-Incentive-mau.xlsx');
const trustanaPresetPath = path.join(root, 'presets', 'trustana-q1.json');
const shotDir = fs.mkdtempSync(path.join(os.tmpdir(), 'incal-app-qa-'));

function loadSampleWorkbook() {
  return XLSX.read(fs.readFileSync(samplePath), { type: 'buffer', cellDates: true });
}

function buildMismatchWorkbook() {
  const source = loadSampleWorkbook();
  const changed = XLSX.utils.book_new();
  source.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(source.Sheets[sheetName], { header: 1, raw: true, defval: null });
    if (sheetName === 'Jobs') rows[0] = rows[0].map((header) => header === 'GP' ? 'GP Actual' : header);
    XLSX.utils.book_append_sheet(changed, XLSX.utils.aoa_to_sheet(rows), sheetName);
  });
  return changed;
}

function dynamicPreset() {
  const sourceSchema = xlsxAdapter.prepareSourceSchema(xlsxAdapter.discoverWorkbook(loadSampleWorkbook(), XLSX));
  const bindings = xlsxAdapter.suggestBindings(sourceSchema, {});
  const field = (sheetName, header) => schema.sourceFieldId(sheetName, header);
  return schema.createPreset({
    id: 'QA-N-TABLE', name: 'QA mô hình N-bảng', version: '1.0.0', sourceSchema, bindings,
    recipes: [{
      id: 'qa-net', name: 'GP sau lương tham chiếu', enabled: true, component: 'income',
      nodes: [
        { id: 'jobs', blockId: 'source', inputs: {}, config: { table: schema.tableIdForSheet('Jobs'), ownerFieldId: field('Jobs', 'Mã NV') } },
        { id: 'gp', blockId: 'scan_sum', inputs: { table: { kind: 'node', nodeId: 'jobs' } }, config: { fieldId: field('Jobs', 'GP') } },
        {
          id: 'debt', blockId: 'lookup', inputs: { key: { kind: 'field', fieldId: field('Nhân sự', 'Mã NV') } },
          config: {
            table: schema.tableIdForSheet('Nhân sự'),
            lookupFieldId: field('Nhân sự', 'Mã NV'),
            returnFieldId: field('Nhân sự', 'Lương T1'),
            returnType: 'Money', fallback: 0
          }
        },
        { id: 'net', blockId: 'arithmetic', inputs: { left: { kind: 'node', nodeId: 'gp' }, right: { kind: 'node', nodeId: 'debt' } }, config: { operator: '-' } }
      ],
      output: { nodeId: 'net', type: 'Money', label: 'GP sau lương tham chiếu' }
    }]
  });
}

function connectionQaRecipe() {
  const recipe = schema.createRecipe({
    id: 'bo', name: 'QA kết nối', enabled: false, component: 'qa',
    nodes: [
      { id: 'src', blockId: 'source', inputs: {}, config: { table: schema.tableIdForSheet('Jobs'), ownerFieldId: schema.sourceFieldId('Jobs', 'Mã NV') } },
      { id: 'sum', blockId: 'scan_sum', inputs: { table: { kind: 'node', nodeId: 'src' } }, config: { fieldId: schema.sourceFieldId('Jobs', 'GP') } },
      { id: 'pct', blockId: 'percent_of', inputs: { base: { kind: 'node', nodeId: 'sum' }, rate: { kind: 'literal', type: 'Percent', value: 0.1 } }, config: {} }
    ],
    output: { nodeId: 'pct', type: 'Money' }
  });
  recipe.enabled = false;
  return recipe;
}

async function main() {
  fs.mkdirSync(shotDir, { recursive: true });
  const mismatchPath = path.join(shotDir, 'INPUT_CHANGED_HEADER.xlsx');
  fs.writeFileSync(mismatchPath, XLSX.write(buildMismatchWorkbook(), { type: 'buffer', bookType: 'xlsx' }));

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--allow-file-access-from-files', '--disable-background-networking']
  });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const selectRecipe = (recipeId) => page.evaluate((id) => {
    const select = document.querySelector('#recipeSelect');
    select.value = id;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, recipeId);
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} :: ${request.failure()?.errorText}`));

  try {
    await page.goto(appUrl, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    assert.equal(await page.locator('.tab').count(), 4, 'four workflow tabs');
    assert.equal(await page.locator('#tab-input').isVisible(), true, 'Input visible');
    await page.evaluate(() => document.fonts.ready);
    const brand = await page.evaluate(() => ({
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
      primary: getComputedStyle(document.documentElement).getPropertyValue('--brand').trim().toLowerCase(),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase(),
      logoLoaded: Boolean(document.querySelector('#brandLogo')?.naturalWidth)
    }));
    assert.match(brand.bodyFont, /Montserrat/, 'Montserrat body font');
    assert.match(brand.headingFont, /Quicksand/, 'Quicksand heading font');
    assert.equal(brand.primary, '#4d148c');
    assert.equal(brand.accent, '#ff6200');
    assert.equal(brand.logoLoaded, true);
    assert.equal(await page.locator('.offline-pill').count(), 0, 'static Offline badge removed');
    assert.equal(await page.locator('.step-note').count(), 0, 'redundant step badges removed');
    assert.match(await page.locator('.period-field').getAttribute('title'), /không tự tính lại số liệu/);

    assert.equal(await page.locator('#savePreset').isDisabled(), true, 'invalid preset save is locked');
    assert.match(await page.locator('#savePresetReason').textContent(), /Chưa thể lưu:/);
    assert.match(await page.locator('#savePreset').getAttribute('title'), /Chưa thể lưu:/);
    assert.equal(await page.locator('.preset-actions .button').count(), 2, 'preset area has exactly two actions');
    assert.doesNotMatch(await page.locator('body').textContent(), /Khai báo bảng và định danh/);

    await page.locator('#presetFileInput').setInputFiles(trustanaPresetPath);
    await page.waitForFunction(() => window.__INCAL_V3__?.state?.preset?.id === 'TRUSTANA-Q1');
    const importedCache = await page.evaluate(() => ({ keys: Object.keys(localStorage), value: localStorage.getItem('incal.v3.preset.v2') }));
    assert.deepEqual(importedCache.keys, ['incal.v3.preset.v2']);
    assert.match(importedCache.value, /TRUSTANA-Q1/);
    assert.match(importedCache.value, /"canvas":\{"x":\d+,"y":\d+\}/, 'canvas coordinates persist as additive node metadata');
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.__INCAL_V3__?.state?.preset?.id === 'TRUSTANA-Q1');

    await page.locator('#excelInput').setInputFiles(samplePath);
    await page.waitForFunction(() => window.__INCAL_V3__?.state?.sourceSchema?.sheets?.length === 4);
    await page.waitForFunction(() => window.__INCAL_V3__?.state?.compatibility === 'exact');
    assert.equal(await page.locator('#metricSheets').textContent(), '4');
    assert.equal(await page.locator('#metricFields').textContent(), '24');
    assert.equal(await page.locator('.sheet-panel').count(), 4, 'all source sheets become tables');
    assert.equal(await page.locator('.source-field').count(), 24, 'all headers become fields');
    assert.equal(await page.locator('.sheet-panel.is-subject').count(), 1, 'exactly one subject table');
    const entityText = await page.locator('#sheetList').textContent();
    for (const sheet of ['Jobs', 'Nhân sự', 'Khách hàng', 'Công nợ chi tiết']) assert.match(entityText, new RegExp(sheet.replace(/[&]/g, '\\&')));
    assert.doesNotMatch(entityText, /Bỏ qua/i);
    const fieldLabels = await page.locator('.source-field strong').allTextContents();
    assert.ok(fieldLabels.includes('GP'));
    assert.ok(fieldLabels.includes('Mã NV'));
    assert.ok(fieldLabels.every((label) => !label.includes('source:')), 'entity map hides encoded field ids');
    assert.equal(await page.locator('[data-subject-table]').count(), 0, 'per-card subject radio is removed');
    assert.equal(await page.locator('.subject-map').count(), 1, 'identity mapping lives inside the active subject sheet');
    assert.deepEqual(await page.locator('.subject-map select').evaluateAll((items) => items.map((item) => item.value)), [
      schema.sourceFieldId('Nhân sự', 'Mã NV'),
      schema.sourceFieldId('Nhân sự', 'Họ tên'),
      schema.sourceFieldId('Nhân sự', 'Hồ sơ')
    ]);

    await page.locator('[data-tab="calculate"]').click();
    assert.equal(await page.locator('#calculationSubject option').count(), 4, 'the Calculate tab offers every workbook table as a subject');
    await page.locator('#calculationSubject').selectOption(schema.tableIdForSheet('Jobs'));
    await page.locator('[data-tab="input"]').click();
    assert.match(await page.locator('.sheet-panel.is-subject summary').textContent(), /Jobs/, 'changing the calculation subject activates the matching sheet card');
    assert.ok((await page.locator('.subject-map option').allTextContents()).every((label) => !label.includes('·')), 'subject mapping uses raw headers from the selected sheet');
    await page.locator('[data-tab="calculate"]').click();
    await page.locator('#calculationSubject').selectOption(schema.tableIdForSheet('Nhân sự'));
    await page.locator('[data-tab="input"]').click();
    assert.deepEqual(await page.locator('.subject-map select').evaluateAll((items) => items.map((item) => item.value)), [
      schema.sourceFieldId('Nhân sự', 'Mã NV'),
      schema.sourceFieldId('Nhân sự', 'Họ tên'),
      schema.sourceFieldId('Nhân sự', 'Hồ sơ')
    ], 'each subject table restores its own identity mapping');

    await page.locator('[data-tab="formulas"]').click();
    assert.equal(await page.locator('.library-block').count(), 19, '16 primitive + 3 macros');
    assert.equal(await page.locator('.library-block[data-block-id="map_lookup"]').count(), 1, 'Claude map-lookup primitive is visible in the block library');
    assert.equal(await page.locator('.library-block[data-block-id="map_arithmetic"]').count(), 1, 'Tính cột primitive is visible in the block library');
    assert.equal(await page.locator('.preset-actions .button').count(), 2, 'only Load and Save preset actions remain');
    assert.equal(await page.locator('#savePreset').isEnabled(), true, 'valid Trustana preset can export');
    assert.equal(await page.locator('#subjectBridge').count(), 0, 'duplicate Subject Bridge is removed');
    assert.equal(await page.locator('#formulaCanvas').isVisible(), true, 'formula canvas is visible');
    assert.match(await page.locator('#formulaCanvas').evaluate((element) => getComputedStyle(element).backgroundImage), /radial-gradient/, 'canvas uses an offline dotted grid');
    assert.match(await page.locator('#recipeMenuButton').evaluate((element) => getComputedStyle(element).fontFamily), /Montserrat/);
    await page.locator('#recipeMenuButton').click();
    assert.equal(await page.locator('#recipeMenu').isVisible(), true, 'custom recipe list opens consistently');
    await page.locator('#recipeMenuButton').click();
    const selectStyles = await page.locator('#tab-formulas select:visible').evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element);
      return { paddingRight: parseFloat(style.paddingRight), backgroundImage: style.backgroundImage };
    }));
    assert.ok(selectStyles.length > 0, 'Formula tab has visible select controls');
    assert.ok(selectStyles.every((style) => style.paddingRight >= 34 && style.backgroundImage !== 'none'), 'all Formula select carets have reserved space and a consistent icon');

    await page.locator('#newRecipe').click();
    const canvasBox = await page.locator('#formulaCanvas').boundingBox();
    assert.ok(canvasBox, 'canvas has a measurable desktop surface');
    const libraryBox = await page.locator('.block-library').boundingBox();
    assert.ok(libraryBox && canvasBox.width > libraryBox.width * 4, 'removing the fixed inspector gives the canvas the dominant width');
    assert.equal(await page.locator('.inspector-panel').count(), 0, 'no permanent right settings panel remains');
    await page.locator('.library-block[data-block-id="round_vnd"]').dragTo(page.locator('#formulaCanvas'), {
      targetPosition: { x: Math.round(canvasBox.width / 2), y: Math.round(canvasBox.height / 2) }
    });
    assert.equal(await page.locator('.graph-node').count(), 1, 'dragging a block creates one graph node');
    assert.equal(await page.locator('.result-badge').count(), 1, 'single sink is automatically marked KẾT QUẢ');
    const droppedPosition = await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes.find((recipe) => recipe.id === window.__INCAL_V3__.state.selectedRecipeId).nodes[0].meta.canvas);
    assert.equal(droppedPosition.x % 24, 0);
    assert.equal(droppedPosition.y % 24, 0);
    const dragHandle = page.locator('.graph-node .node-head');
    const dragBox = await dragHandle.boundingBox();
    assert.ok(dragBox, 'node drag handle is visible');
    await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dragBox.x + dragBox.width / 2 + 71, dragBox.y + dragBox.height / 2 + 43, { steps: 5 });
    await page.mouse.up();
    const movedPosition = await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes.find((recipe) => recipe.id === window.__INCAL_V3__.state.selectedRecipeId).nodes[0].meta.canvas);
    assert.notDeepEqual(movedPosition, droppedPosition, 'node drag updates coordinates');
    assert.equal(movedPosition.x % 24, 0, 'node x snaps to grid');
    assert.equal(movedPosition.y % 24, 0, 'node y snaps to grid');
    const resizeHandle = page.locator('.graph-node .node-resize-handle');
    const resizeBox = await resizeHandle.boundingBox();
    const widthBefore = await page.locator('.graph-node').evaluate((element) => element.getBoundingClientRect().width);
    await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(resizeBox.x + resizeBox.width / 2 + 84, resizeBox.y + resizeBox.height / 2, { steps: 5 });
    await page.mouse.up();
    const widthAfter = await page.locator('.graph-node').evaluate((element) => element.getBoundingClientRect().width);
    assert.ok(widthAfter > widthBefore, 'resize handle changes node width');
    assert.ok((await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes.find((recipe) => recipe.id === window.__INCAL_V3__.state.selectedRecipeId).nodes[0].meta.canvas.width)) >= 180, 'node width persists in additive metadata');
    assert.equal(await page.locator('.graph-node').getAttribute('data-node-status'), 'valid', 'a complete result node uses the semantic green status');
    assert.ok(await page.locator('.graph-node .graph-input-port.bound').count(), 'bound inputs are marked as active');
    const inputColorBefore = await page.locator('.graph-node .graph-input-port').evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.locator('.graph-node .graph-input-port').hover();
    await page.waitForTimeout(180);
    const inputColorAfter = await page.locator('.graph-node .graph-input-port').evaluate((element) => getComputedStyle(element).backgroundColor);
    assert.notEqual(inputColorBefore, inputColorAfter, 'input hover has a visible semantic highlight');
    const zoomStart = await page.evaluate(() => window.__INCAL_V3__.state.canvasZoom);
    await page.locator('#zoomIn').click();
    assert.ok(await page.evaluate(() => window.__INCAL_V3__.state.canvasZoom) > zoomStart, 'zoom-in control changes canvas scale');
    await page.locator('#zoomReset').click();
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.canvasZoom), 1, '100% resets canvas scale');
    await page.locator('#formulaCanvas').dispatchEvent('wheel', { deltaY: -120, ctrlKey: true, clientX: canvasBox.x + canvasBox.width / 2, clientY: canvasBox.y + canvasBox.height / 2 });
    assert.ok(await page.evaluate(() => window.__INCAL_V3__.state.canvasZoom) > 1, 'Ctrl+wheel zooms around the pointer');
    await page.locator('#zoomReset').click();
    await page.locator('.graph-node').click({ button: 'right' });
    assert.equal(await page.locator('#nodeContextMenu').isVisible(), true, 'right-click opens node actions');
    assert.deepEqual(await page.locator('#nodeContextMenu [data-context-action]').evaluateAll((items) => items.map((item) => item.dataset.contextAction)), ['settings', 'duplicate', 'focus', 'disconnect', 'delete']);
    const menuVisual = await page.locator('#nodeContextMenu').evaluate((menu) => {
      const rect = menu.getBoundingClientRect();
      const topbar = document.querySelector('.topbar').getBoundingClientRect();
      const rows = Array.from(menu.querySelectorAll('button')).map((button) => {
        const row = button.getBoundingClientRect();
        const icon = button.querySelector('.menu-icon').getBoundingClientRect();
        const svg = button.querySelector('svg').getBoundingClientRect();
        return { rowCenter: row.top + row.height / 2, iconCenter: icon.top + icon.height / 2, iconWidth: icon.width, iconHeight: icon.height, svgWidth: svg.width, svgHeight: svg.height };
      });
      return { top: rect.top, right: rect.right, topbarBottom: topbar.bottom, viewportWidth: innerWidth, rows };
    });
    assert.ok(menuVisual.top >= menuVisual.topbarBottom + 7 && menuVisual.right <= menuVisual.viewportWidth - 7, 'context menu stays clear of the sticky header and viewport edge');
    assert.ok(menuVisual.rows.every((row) => Math.abs(row.rowCenter - row.iconCenter) < 1 && row.iconWidth === 28 && row.iconHeight === 28 && row.svgWidth === 18 && row.svgHeight === 18), 'popup icons use one aligned SVG grid');
    await page.screenshot({ path: path.join(shotDir, 'formula-context-menu-1440x900.png'), fullPage: true });
    await page.locator('#nodeContextMenu [data-context-action="settings"]').click();
    assert.equal(await page.locator('#nodeSettingsDialog').getAttribute('open'), '', 'settings action opens the node dialog');
    await page.screenshot({ path: path.join(shotDir, 'formula-settings-dialog-1440x900.png'), fullPage: true });
    await page.locator('#closeNodeSettings').click();
    await page.locator('.graph-node').click({ button: 'right' });
    await page.locator('#nodeContextMenu [data-context-action="duplicate"]').click();
    assert.equal(await page.locator('.graph-node').count(), 2, 'context menu can duplicate a node');
    assert.ok(await page.locator('.graph-node[data-node-status="warning"]').count() >= 1, 'incomplete/ambiguous graph state uses amber, not red');
    await page.locator('.graph-node.selected').click({ button: 'right' });
    await page.locator('#nodeContextMenu [data-context-action="delete"]').click();
    assert.equal(await page.locator('.graph-node').count(), 1, 'context menu can delete the selected duplicate');
    await page.locator('.graph-node .node-head').dblclick();
    assert.equal(await page.locator('#nodeSettingsDialog').getAttribute('open'), '', 'double-click opens settings without a fixed inspector');
    await page.locator('#closeNodeSettings').click();
    await page.locator('#autoArrange').click();
    assert.match(await page.locator('#toast').textContent(), /tự xếp graph/i);
    const panBefore = await page.evaluate(() => ({ ...window.__INCAL_V3__.state.canvasPan }));
    await page.mouse.move(canvasBox.x + 24, canvasBox.y + 40);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 78, canvasBox.y + 76, { steps: 4 });
    await page.mouse.up();
    const panAfter = await page.evaluate(() => ({ ...window.__INCAL_V3__.state.canvasPan }));
    assert.notDeepEqual(panAfter, panBefore, 'dragging empty canvas pans the graph');
    await page.locator('#recipeMeta .recipe-advanced summary').click();
    await page.locator('#recipeMeta [data-delete-recipe]').click();
    assert.equal(await page.locator('#ghostEdge').isHidden(), true, 'switching after recipe deletion clears the ghost arrow');
    assert.equal(await page.locator('#nodeContextMenu').isHidden(), true, 'switching after recipe deletion clears the node menu');

    await selectRecipe('com');
    await page.waitForFunction(() => document.querySelectorAll('.graph-edge-visual').length === 12);
    assert.equal(await page.locator('.graph-node').count(), 11, 'COM recipe renders eleven graph nodes');
    assert.equal(await page.locator('.graph-edge-visual').count(), 12, 'all COM node inputs render as bezier connections');
    assert.equal(await page.locator('.graph-edge-hit').count(), 12, 'each edge has a wide transparent hit path');
    assert.equal(await page.locator('.result-badge').count(), 1, 'COM has one automatic result sink');
    assert.equal(await page.locator('[data-set-output]').count(), 0, 'manual output control is absent');
    await page.locator('.graph-node[data-node-id="f1"] .node-head').dblclick();
    assert.equal(await page.locator('#nodeSettingsDialog').getAttribute('open'), '', 'node settings are shown on demand');
    assert.match(await page.locator('#inspector .connected-source').textContent(), /Đã nối từ canvas/);
    const conditionOptions = await page.locator('#inspector select[data-config="operator"] option').evaluateAll((options) => options.map((option) => ({ value: option.value, label: option.textContent })));
    assert.deepEqual(conditionOptions, [
      { value: 'eq', label: 'bằng' },
      { value: 'neq', label: 'khác' },
      { value: 'gt', label: 'lớn hơn' },
      { value: 'gte', label: 'lớn hơn hoặc bằng' },
      { value: 'lt', label: 'nhỏ hơn' },
      { value: 'lte', label: 'nhỏ hơn hoặc bằng' },
      { value: 'contains', label: 'chứa' }
    ]);
    await page.locator('#closeNodeSettings').click();
    assert.doesNotMatch(await page.locator('#tab-formulas').textContent(), /source:[^\s]+|%C3|%E1/);

    await page.locator('.graph-node[data-node-id="wf"] .node-head').dblclick();
    assert.equal(await page.locator('#inspector [data-node-label]').count(), 1, 'a locked macro instance has an editable display name');
    await page.locator('#inspector [data-node-label]').fill('Thưởng quý theo bậc');
    assert.equal(await page.locator('.graph-node[data-node-id="wf"] .node-head strong').textContent(), 'Thưởng quý theo bậc');
    assert.match(await page.locator('#inspector .macro-formula').textContent(), /Công thức của khối/, 'macro internals are disclosed without unlocking registry logic');
    await page.locator('#closeNodeSettings').click();

    await page.evaluate((recipe) => {
      const preset = JSON.parse(JSON.stringify(window.__INCAL_V3__.state.preset));
      preset.recipes.push(recipe);
      window.__INCAL_V3__.setPreset(preset);
    }, connectionQaRecipe());
    await selectRecipe('bo');
    await page.evaluate(() => {
      const canvas = document.querySelector('#formulaCanvas');
      const world = document.querySelector('#canvasWorld');
      window.__INCAL_V3__.state.canvasPan = { x: 0, y: 0 };
      world.style.transform = 'translate(0px, 0px)';
      const shift = canvas.getBoundingClientRect().left + 80 - document.querySelector('[data-node-id="sum"]').getBoundingClientRect().left;
      window.__INCAL_V3__.state.canvasPan = { x: shift, y: 0 };
      world.style.transform = `translate(${shift}px, 0px)`;
      window.scrollTo(0, Math.max(0, document.querySelector('#formulaCanvas').offsetTop - 120));
    });
    const badSource = page.locator('.graph-node[data-node-id="sum"] .graph-output-port');
    const badTarget = page.locator('.graph-node[data-node-id="pct"] .graph-input-port[data-port-id="rate"]');
    const badSourceBox = await badSource.boundingBox();
    const badTargetBox = await badTarget.boundingBox();
    assert.ok(badSourceBox && badTargetBox, 'invalid connection ports are visible');
    await badSource.dispatchEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, pointerId: 30, pointerType: 'mouse', clientX: badSourceBox.x + badSourceBox.width / 2, clientY: badSourceBox.y + badSourceBox.height / 2 });
    assert.equal(await page.locator('#connectionCursor').isVisible(), true, 'connection feedback follows the pointer');
    assert.ok(await page.locator('.graph-input-port.candidate-valid').count() > 0, 'compatible input ports highlight during a connection drag');
    const connectionDebug = await page.evaluate(() => ({ sourceId: window.__INCAL_V3__.state.connectionDrag?.sourceId, scrollX, pan: window.__INCAL_V3__.state.canvasPan, worldTransform: getComputedStyle(document.querySelector('#canvasWorld')).transform, sumLeft: document.querySelector('[data-node-id="sum"]').style.left, sumRect: document.querySelector('[data-node-id="sum"]').getBoundingClientRect().toJSON(), sumOutputRect: document.querySelector('[data-node-id="sum"] .graph-output-port').getBoundingClientRect().toJSON(), canvas: document.querySelector('#formulaCanvas').getBoundingClientRect().toJSON(), grid: document.querySelector('.canvas-builder').getBoundingClientRect().toJSON() }));
    assert.equal(connectionDebug.sourceId, 'sum', `output pointerdown starts a connection drag; source=${JSON.stringify(badSourceBox)} target=${JSON.stringify(badTargetBox)} layout=${JSON.stringify(connectionDebug)}`);
    await page.mouse.move(badTargetBox.x + badTargetBox.width / 2, badTargetBox.y + badTargetBox.height / 2, { steps: 8 });
    const ghostArrow = await page.locator('#ghostEdge').evaluate((element) => ({
      hidden: element.hasAttribute('hidden'),
      path: element.getAttribute('d'),
      marker: element.getAttribute('marker-end'),
      stroke: getComputedStyle(element).stroke,
      length: element.getTotalLength()
    }));
    assert.equal(ghostArrow.hidden, false, 'ghost arrow is unhidden during drag');
    assert.ok(ghostArrow.length > 0 && ghostArrow.path, 'a bezier ghost path follows the pointer during drag');
    assert.equal(ghostArrow.marker, 'url(#ghostArrow)', 'ghost connection includes an arrow head');
    const cursorBox = await page.locator('#connectionCursor').boundingBox();
    assert.ok(cursorBox && Math.abs(cursorBox.x - (badTargetBox.x + badTargetBox.width / 2 + 12)) < 6, `connection label tracks the pointer x position: ${JSON.stringify({ cursorBox, badTargetBox })}`);
    assert.ok(Math.abs(cursorBox.y - (badTargetBox.y + badTargetBox.height / 2 + 12)) < 6, 'connection label tracks the pointer y position');
    await page.screenshot({ path: path.join(shotDir, 'formula-connection-drag-1440x900.png'), fullPage: true });
    const liveBadTargetBox = await badTarget.boundingBox();
    await badTarget.dispatchEvent('pointermove', { bubbles: true, buttons: 1, pointerId: 1, pointerType: 'mouse', clientX: liveBadTargetBox.x + liveBadTargetBox.width / 2, clientY: liveBadTargetBox.y + liveBadTargetBox.height / 2 });
    const targetDebug = await page.evaluate(({ x, y }) => ({ portId: window.__INCAL_V3__.state.connectionDrag?.target?.dataset.portId, hit: document.elementFromPoint(x, y)?.outerHTML?.slice(0, 180) }), { x: badTargetBox.x + badTargetBox.width / 2, y: badTargetBox.y + badTargetBox.height / 2 });
    assert.equal(targetDebug.portId, 'rate', `connection drag detects the target input; target=${JSON.stringify(badTargetBox)} hit=${targetDebug.hit}`);
    await page.mouse.up();
    assert.equal(await page.locator('#connectionCursor').isHidden(), true, 'connection feedback clears after drop');
    const typeToast = await page.locator('#toast').textContent();
    assert.match(typeToast, /Percent|Money/, `type mismatch explains expected and actual types; actual toast: ${typeToast}`);
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes.find((recipe) => recipe.id === 'bo').nodes.find((node) => node.id === 'pct').inputs.rate.kind), 'literal', 'invalid edge is rejected');
    await page.locator('.graph-node[data-node-id="pct"] .node-head').dblclick();
    await page.locator('#inspector [data-disconnect-port="base"]').click();
    await page.locator('#closeNodeSettings').click();
    assert.match(await page.locator('#graphStatus').textContent(), /chưa khép/i, 'hanging branch is visible after disconnect');
    const goodSourceBox = await badSource.boundingBox();
    const goodTargetBox = await page.locator('.graph-node[data-node-id="pct"] .graph-input-port[data-port-id="base"]').boundingBox();
    assert.ok(goodSourceBox && goodTargetBox, 'valid connection ports are visible');
    await badSource.dispatchEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, pointerId: 2, pointerType: 'mouse', clientX: goodSourceBox.x + goodSourceBox.width / 2, clientY: goodSourceBox.y + goodSourceBox.height / 2 });
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.connectionDrag?.sourceId), 'sum', 'valid drag starts from the output port');
    await page.mouse.move(goodTargetBox.x + goodTargetBox.width / 2, goodTargetBox.y + goodTargetBox.height / 2, { steps: 8 });
    const liveGoodTargetBox = await page.locator('.graph-node[data-node-id="pct"] .graph-input-port[data-port-id="base"]').boundingBox();
    await page.locator('.graph-node[data-node-id="pct"] .graph-input-port[data-port-id="base"]').dispatchEvent('pointermove', { bubbles: true, buttons: 1, pointerId: 1, pointerType: 'mouse', clientX: liveGoodTargetBox.x + liveGoodTargetBox.width / 2, clientY: liveGoodTargetBox.y + liveGoodTargetBox.height / 2 });
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.connectionDrag?.target?.dataset.portId), 'base', 'valid drag detects the base input');
    await page.locator('.graph-node[data-node-id="pct"] .graph-input-port[data-port-id="base"]').dispatchEvent('pointerup', { bubbles: true, button: 0, buttons: 0, pointerId: 2, pointerType: 'mouse' });
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes.find((recipe) => recipe.id === 'bo').nodes.find((node) => node.id === 'pct').inputs.base.nodeId), 'sum', 'valid edge updates node.inputs');
    assert.equal(await page.locator('.result-badge').count(), 1, 'valid reconnect restores one automatic result');
    await selectRecipe('com');

    await page.locator('[data-tab="calculate"]').click();
    await page.locator('#calculateButton:enabled').click();
    await page.locator('#resultsBody tr').first().waitFor();
    const trustanaReport = await page.evaluate(() => window.__INCAL_V3__.state.report);
    assert.deepEqual(trustanaReport.per_person.map((person) => person.netPay), [12516386]);
    assert.deepEqual(trustanaReport.per_person.map((person) => person.penalty), [2676672]);
    const trustanaHeaders = await page.locator('#resultsHead th').allTextContents();
    assert.deepEqual(trustanaHeaders.slice(1, -2), ['COM Waterfall', 'Khấu trừ', 'Thuế incentive'], 'result columns come from recipe definitions');
    assert.ok(trustanaHeaders.every((label) => !/^(COM|KAE|KHÁC\/BO)$/i.test(label.trim())), 'preset-specific component codes stay internal');
    const trustanaExportGroups = await page.locator('[data-export-component]').evaluateAll((buttons) => buttons.map((button) => button.dataset.exportComponent));
    assert.deepEqual(trustanaExportGroups, ['com'], 'export groups derive from enabled income recipe components');
    const [comDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-export-component="com"]').click()
    ]);
    assert.equal(comDownload.suggestedFilename(), 'INCENTIVE_GROUP_COM_WATERFALL_Q1-2026.xlsx');

    await page.locator('[data-tab="formulas"]').click();
    const [presetDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#savePreset').click()
    ]);
    assert.match(presetDownload.suggestedFilename(), /^TRUSTANA-Q1\.json$/i, 'Save preset downloads JSON');

    const formula = dynamicPreset();
    await page.evaluate((value) => window.__INCAL_V3__.setPreset(value), formula);
    await page.evaluate(() => window.__INCAL_V3__.fitCanvas());
    await page.waitForTimeout(80);

    await page.locator('.graph-node[data-node-id="jobs"] .node-head').dblclick();
    const sourceTables = await page.locator('#inspector select[data-config="table"] option').allTextContents();
    for (const sheet of ['Jobs', 'Nhân sự', 'Khách hàng', 'Công nợ chi tiết']) assert.ok(sourceTables.some((option) => option.includes(sheet)), `source picker includes ${sheet}`);

    await page.locator('#closeNodeSettings').click();
    await page.locator('.graph-node[data-node-id="debt"] .node-head').dblclick();
    const lookupTables = await page.locator('#inspector select[data-config="table"] option').allTextContents();
    assert.equal(lookupTables.length, 4, 'lookup can target every table');
    assert.match(await page.locator('#inspector select[data-config="lookupFieldId"]').textContent(), /Mã NV/);
    assert.match(await page.locator('#inspector select[data-config="returnFieldId"]').textContent(), /Lương T1/);
    await page.locator('#closeNodeSettings').click();
    assert.equal(await page.locator('.result-badge').count(), 1, 'dynamic recipe has one automatic result sink');
    const debtOutput = page.locator('.graph-node[data-node-id="debt"] .graph-output-port');
    const netLeft = page.locator('.graph-node[data-node-id="net"] .graph-input-port[data-port-id="left"]');
    let sourceBox = await debtOutput.boundingBox();
    let targetBox = await netLeft.boundingBox();
    assert.ok(sourceBox && targetBox, 'same-type source replacement ports are visible');
    await debtOutput.dispatchEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, pointerId: 31, pointerType: 'mouse', clientX: sourceBox.x + sourceBox.width / 2, clientY: sourceBox.y + sourceBox.height / 2 });
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
    await netLeft.dispatchEvent('pointermove', { bubbles: true, buttons: 1, pointerId: 31, pointerType: 'mouse', clientX: targetBox.x + targetBox.width / 2, clientY: targetBox.y + targetBox.height / 2 });
    await netLeft.dispatchEvent('pointerup', { bubbles: true, button: 0, buttons: 0, pointerId: 31, pointerType: 'mouse', clientX: targetBox.x + targetBox.width / 2, clientY: targetBox.y + targetBox.height / 2 });
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes[0].nodes.find((node) => node.id === 'net').inputs.left.nodeId), 'debt', 'dropping on an occupied input replaces its source');
    await page.evaluate(() => window.__INCAL_V3__.connectNodes('gp', 'net', 'left'));
    const retargetSource = page.locator('.graph-node[data-node-id="net"] .graph-input-port[data-port-id="left"]');
    const retargetDestination = page.locator('.graph-node[data-node-id="net"] .graph-input-port[data-port-id="right"]');
    sourceBox = await retargetSource.boundingBox();
    targetBox = await retargetDestination.boundingBox();
    assert.ok(sourceBox && targetBox, 'connected input endpoints are visible for retargeting');
    await retargetSource.dispatchEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, pointerId: 32, pointerType: 'mouse', clientX: sourceBox.x + sourceBox.width / 2, clientY: sourceBox.y + sourceBox.height / 2 });
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
    await retargetDestination.dispatchEvent('pointermove', { bubbles: true, buttons: 1, pointerId: 32, pointerType: 'mouse', clientX: targetBox.x + targetBox.width / 2, clientY: targetBox.y + targetBox.height / 2 });
    await retargetDestination.dispatchEvent('pointerup', { bubbles: true, button: 0, buttons: 0, pointerId: 32, pointerType: 'mouse', clientX: targetBox.x + targetBox.width / 2, clientY: targetBox.y + targetBox.height / 2 });
    const retargetedInputs = await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes[0].nodes.find((node) => node.id === 'net').inputs);
    assert.equal(retargetedInputs.left, undefined, 'dragging a connected input releases its original endpoint');
    assert.equal(retargetedInputs.right.nodeId, 'gp', 'dragging a connected input retargets the arrow atomically');
    await page.evaluate(() => {
      window.__INCAL_V3__.connectNodes('gp', 'net', 'left');
      window.__INCAL_V3__.connectNodes('debt', 'net', 'right');
    });
    const editableEdge = page.locator('.graph-edge-group[data-edge-source="gp"][data-edge-target="net"][data-edge-port="left"]');
    await editableEdge.locator('.graph-edge-hit').hover();
    await page.waitForTimeout(180);
    assert.ok(Number(await editableEdge.locator('.edge-source-endpoint').evaluate((element) => getComputedStyle(element).opacity)) > 0.9, 'hovering an arrow reveals draggable endpoints');
    const edgeSourceHandle = editableEdge.locator('.edge-source-endpoint');
    sourceBox = await edgeSourceHandle.boundingBox();
    targetBox = await debtOutput.boundingBox();
    assert.ok(sourceBox && targetBox, 'arrow source handle and replacement output are measurable');
    await edgeSourceHandle.dispatchEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, pointerId: 33, pointerType: 'mouse', clientX: sourceBox.x + sourceBox.width / 2, clientY: sourceBox.y + sourceBox.height / 2 });
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
    await debtOutput.dispatchEvent('pointermove', { bubbles: true, buttons: 1, pointerId: 33, pointerType: 'mouse', clientX: targetBox.x + targetBox.width / 2, clientY: targetBox.y + targetBox.height / 2 });
    await debtOutput.dispatchEvent('pointerup', { bubbles: true, button: 0, buttons: 0, pointerId: 33, pointerType: 'mouse', clientX: targetBox.x + targetBox.width / 2, clientY: targetBox.y + targetBox.height / 2 });
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes[0].nodes.find((node) => node.id === 'net').inputs.left.nodeId), 'debt', 'dragging the source end of an existing arrow updates node.inputs atomically');
    await page.evaluate(() => window.__INCAL_V3__.connectNodes('gp', 'net', 'left'));
    const removableEdge = page.locator('.graph-edge-group[data-edge-source="debt"][data-edge-target="net"][data-edge-port="right"] .graph-edge-hit');
    await removableEdge.click({ button: 'right' });
    assert.equal(await page.locator('#edgeContextMenu').isVisible(), true, 'right-clicking an arrow opens its compact action menu');
    await page.locator('#edgeContextMenu [data-edge-action="disconnect"]').click();
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.preset.recipes[0].nodes.find((node) => node.id === 'net').inputs.right), undefined, 'the edge menu disconnects its target input');
    await page.evaluate(() => window.__INCAL_V3__.connectNodes('debt', 'net', 'right'));
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.connectNodes('net', 'debt', 'key')), false, 'cycle connection is rejected');
    const persisted = await page.evaluate(() => ({ keys: Object.keys(localStorage), value: localStorage.getItem('incal.v3.preset.v2') }));
    assert.deepEqual(persisted.keys, ['incal.v3.preset.v2']);
    assert.doesNotMatch(persisted.value, /Nguyễn Văn A|ALPHA CO|120000000|1000000/);

    await page.locator('[data-tab="calculate"]').click();
    await page.locator('#calculateButton:enabled').waitFor();
    assert.equal(await page.locator('#metricPeople').textContent(), '1');
    assert.equal(await page.locator('#metricJobs').textContent(), '4');
    assert.equal(await page.locator('#metricSchema').textContent(), 'AUTO');
    await page.locator('#calculateButton').click();
    await page.locator('#resultsBody tr').first().waitFor();
    assert.match(await page.locator('#resultsBody tr').first().textContent(), /225\.050\.577/);
    await page.locator('[data-action="trace"]').first().click();
    assert.match(await page.locator('#traceContent').textContent(), /J01/);
    await page.locator('#closeTrace').click();
    const report = await page.evaluate(() => window.__INCAL_V3__.state.report);
    assert.equal(report.per_person[0].netPay, 225050577);
    assert.equal(report.totals.netPay, 225050577);

    const resultExportText = await page.locator('.export-bar').textContent();
    for (const label of ['Tổng hợp chi trả', 'GP sau lương tham chiếu', 'Dữ liệu job', 'Báo cáo đầy đủ']) assert.match(resultExportText, new RegExp(label));
    for (const absent of ['Nhóm COM', 'Nhóm KAE', 'Nhóm Khác']) assert.doesNotMatch(resultExportText, new RegExp(absent), `unused ${absent} export is absent`);
    assert.doesNotMatch(resultExportText, /BKê|(?:^|\s)BK(?:\s|$)/i);
    await page.locator('#quarterInput').fill('Q2-2026');
    await page.waitForFunction(() => window.__INCAL_V3__.state.report?.quarter === 'Q2-2026');
    const netBeforeExports = await page.evaluate(() => window.__INCAL_V3__.state.report.totals.netPay);

    const [jobDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportJobJson').click()
    ]);
    assert.equal(jobDownload.suggestedFilename(), 'JOB_DATA_Q2-2026.json');
    const jobPayload = JSON.parse(fs.readFileSync(await jobDownload.path(), 'utf8'));
    assert.deepEqual(Object.keys(jobPayload).sort(), ['generated_at', 'jobs', 'kind', 'quarter', 'schemaVersion'].sort());
    assert.equal(jobPayload.kind, 'incal-job-export');
    assert.equal(jobPayload.quarter, 'Q2-2026');
    assert.ok(Array.isArray(jobPayload.jobs));
    assert.equal(jobPayload.per_person, undefined);
    assert.equal(jobPayload.totals, undefined);

    const [fullReportDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportReportJson').click()
    ]);
    assert.equal(fullReportDownload.suggestedFilename(), 'INCENTIVE_REPORT_Q2-2026.json');
    const fullReportPayload = JSON.parse(fs.readFileSync(await fullReportDownload.path(), 'utf8'));
    assert.equal(fullReportPayload.quarter, 'Q2-2026');
    for (const key of ['preset', 'validation', 'totals', 'per_person', 'per_job']) assert.ok(key in fullReportPayload, `full report contains ${key}`);
    assert.ok(fullReportPayload.per_person.every((person) => person.trace), 'full report retains per-person trace');
    assert.equal(await page.evaluate(() => window.__INCAL_V3__.state.report.totals.netPay), netBeforeExports, 'changing period does not recalculate results');
    await page.locator('#quarterInput').fill('Q1-2026');
    await page.waitForFunction(() => window.__INCAL_V3__.state.report?.quarter === 'Q1-2026');

    const report2 = JSON.parse(JSON.stringify(report));
    report2.quarter = 'Q2-2026';
    report2.generated_at = '2026-04-01T00:00:00.000Z';
    const report1Path = path.join(shotDir, 'REPORT_Q1-2026.json');
    const report2Path = path.join(shotDir, 'REPORT_Q2-2026.json');
    fs.writeFileSync(report1Path, JSON.stringify(report));
    fs.writeFileSync(report2Path, JSON.stringify(report2));
    await page.locator('[data-tab="dashboard"]').click();
    await page.locator('#reportFiles').setInputFiles([report1Path, report2Path]);
    await page.waitForFunction(() => document.querySelector('#dashReports')?.textContent === '2');
    assert.equal(await page.locator('#dashPeopleCount').textContent(), '1 người');
    assert.match(await page.locator('#dashboardPeople').textContent(), /Nhân viên 01/);
    assert.equal(await page.locator('#dashboardEmpty').isHidden(), true);

    await page.locator('[data-tab="input"]').click();
    await page.locator('#excelInput').setInputFiles(mismatchPath);
    await page.waitForFunction(() => window.__INCAL_V3__?.state?.compatibility === 'mismatch');
    assert.match(await page.locator('#inputStatus').textContent(), /Header lệch preset/);
    await page.locator('[data-tab="calculate"]').click();
    assert.equal(await page.locator('#calculateButton').isDisabled(), true, 'header mismatch blocks calculate');
    assert.match(await page.locator('#runGate').textContent(), /Header lệch/);

    await page.locator('[data-tab="input"]').click();
    await page.locator('#excelInput').setInputFiles(samplePath);
    await page.waitForFunction(() => window.__INCAL_V3__?.state?.compatibility === 'exact');
    await page.locator('[data-tab="calculate"]').click();
    await page.locator('#calculateButton:enabled').click();
    await page.locator('#resultsBody tr').first().waitFor();
    const viewports = [{ width: 1440, height: 900 }, { width: 1280, height: 800 }];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const tab of ['input', 'formulas', 'calculate', 'dashboard']) {
        await page.locator(`[data-tab="${tab}"]`).click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.locator('#toast').evaluate((element) => element.classList.remove('show'));
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(shotDir, `${tab}-${viewport.width}x${viewport.height}.png`), fullPage: true });
        const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(width.scroll <= width.client + 1, `${tab} ${viewport.width}px overflow: ${width.scroll} > ${width.client}`);
      }
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('[data-tab="input"]').click();
    const hoverBefore = await page.locator('.sheet-panel').first().evaluate((element) => getComputedStyle(element).borderColor);
    await page.locator('.sheet-panel').first().hover();
    await page.waitForTimeout(220);
    const hoverAfter = await page.locator('.sheet-panel').first().evaluate((element) => getComputedStyle(element).borderColor);
    assert.notEqual(hoverBefore, hoverAfter, 'hover highlight visible');

    await page.locator('[data-tab="formulas"]').click();
    await page.evaluate((value) => window.__INCAL_V3__.setPreset(value), dynamicPreset());
    await page.locator('.library-block[data-block-id="map_lookup"]').click();
    const mapLookupNode = page.locator('.graph-node[data-block-id="map_lookup"]');
    assert.equal(await mapLookupNode.count(), 1, 'map lookup can be added to the graph');
    await mapLookupNode.locator('.node-head').dblclick();
    assert.equal(await page.locator('#inspector [data-config="derivedFieldLabel"]').count(), 1, 'map lookup exposes a friendly derived-column name');
    assert.equal(await page.locator('#inspector [data-config="derivedFieldId"]').count(), 0, 'internal derived field id stays out of the finance UI');
    assert.equal(await page.locator('#inspector [data-config="returnType"]').count(), 1, 'map lookup keeps explicit output type-check configuration');
    await page.locator('#closeNodeSettings').click();
    await mapLookupNode.click({ button: 'right' });
    await page.locator('#nodeContextMenu [data-context-action="delete"]').click();
    await page.locator('.library-block[data-block-id="map_arithmetic"]').click();
    const mapArithmeticNode = page.locator('.graph-node[data-block-id="map_arithmetic"]');
    assert.equal(await mapArithmeticNode.count(), 1, 'Tính cột can be added to the graph');
    await mapArithmeticNode.locator('.node-head').dblclick();
    assert.equal(await page.locator('#inspector [data-config="derivedFieldLabel"]').count(), 1, 'Tính cột exposes a friendly derived-column name');
    assert.equal(await page.locator('#inspector [data-config="derivedFieldId"]').count(), 0, 'Tính cột hides its internal derived field id');
    assert.equal(await page.locator('#inspector [data-config="operator"] option').count(), 4, 'Tính cột offers four arithmetic operators');
    await page.locator('#closeNodeSettings').click();
    await mapArithmeticNode.click({ button: 'right' });
    await page.locator('#nodeContextMenu [data-context-action="delete"]').click();
    await page.locator('#recipeMeta .recipe-advanced summary').click();
    await page.locator('#recipeMeta [data-delete-recipe]').click();
    assert.equal(await page.locator('.graph-node').count(), 0, 'deleting the final recipe clears every node');
    assert.equal(await page.locator('.graph-edge-visual').count(), 0, 'deleting the final recipe clears stale arrows');
    assert.equal(await page.locator('#ghostEdge').isHidden(), true, 'deleting the final recipe clears the ghost arrow');

    assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join(' | ')}`);
    assert.deepEqual(failedRequests, [], `failed requests: ${failedRequests.join(' | ')}`);
    console.log(JSON.stringify({
      status: 'pass', url: appUrl, tabs: 4, sheets: 4, fields: 24, blocks: 19,
      autoMapped: true, mismatchBlocked: true, subjectRows: 1, tables: 4,
      trustanaNets: trustanaReport.per_person.map((person) => person.netPay),
      lookupResult: report.per_person[0].netPay, netPay: report.totals.netPay,
      dashboardReports: 2, persistedKeys: persisted.keys, sensitiveRowsPersisted: false, brand,
      selectCaretAligned: true, genericExportLabels: true, quarterExportVerified: true,
      canvasNodes: 10, canvasEdges: 11, nodeDragSnapped: true, panVerified: true, zoomVerified: true,
      customRecipeMenu: true, contextMenuVerified: true, contextMenuSvgAligned: true, modalSettingsVerified: true, semanticPortColors: true,
      mapLookupUiVerified: true, mapArithmeticUiVerified: true,
      ghostArrowVerified: true, sourceReplacementVerified: true, endpointRetargetVerified: true, edgeSourceRetargetVerified: true, edgeContextDisconnectVerified: true,
      invalidConnectionBlocked: true, cycleConnectionBlocked: true, autoOutput: true,
      trustanaExportGroups, componentExportFilename: comDownload.suggestedFilename(), dynamicExportGroups: ['income'],
      jobJsonKeys: Object.keys(jobPayload).sort(), fullReportKeysVerified: ['preset', 'validation', 'totals', 'per_person', 'per_job'],
      viewports: viewports.map((item) => `${item.width}x${item.height}`),
      consoleErrors: 0, pageErrors: 0, failedRequests: 0, horizontalOverflow: 0,
      screenshots: shotDir
    }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
