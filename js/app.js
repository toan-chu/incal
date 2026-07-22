(function () {
  'use strict';

  const V3 = window.IncalV3;
  const Export = window.IncentiveExport;
  const Canvas = window.FormulaCanvas;
  const state = {
    preset: V3.createPreset({ id: 'EMPTY-PRESET', name: 'Bộ công thức mới', version: '1.0.0' }),
    workbook: null,
    discovery: null,
    sourceSchema: null,
    compatibility: 'empty',
    fileName: '',
    selectedRecipeId: null,
    selectedNodeId: null,
    input: null,
    report: null,
    reports: [],
    runErrors: [],
    canvasPan: { x: 0, y: 0 },
    canvasZoom: 1,
    nodeDrag: null,
    nodeResize: null,
    connectionDrag: null,
    panDrag: null,
    contextNodeId: null,
    contextEdge: null
  };
  const els = {};
  const OPERATOR_LABELS = Object.freeze({
    eq: 'bằng',
    neq: 'khác',
    gt: 'lớn hơn',
    gte: 'lớn hơn hoặc bằng',
    lt: 'nhỏ hơn',
    lte: 'nhỏ hơn hoặc bằng',
    contains: 'chứa',
    startsWith: 'bắt đầu bằng',
    AND: 'và',
    OR: 'hoặc',
    field: 'Cột dữ liệu',
    literal: 'Hằng số',
    Money: 'Tiền',
    Number: 'Số',
    Percent: 'Tỷ lệ'
  });
  const BLOCK_LABELS = Object.freeze({
    'macro.waterfall': 'Thưởng theo nhiều bậc',
    'macro.tax_dual': 'Thuế theo hai trường hợp',
    'macro.kae_pool': 'Chia quỹ theo số người'
  });
  const PORT_LABELS = Object.freeze({
    table: 'Dữ liệu', key: 'Giá trị cần tra', left: 'Vế trái', right: 'Vế phải', base: 'Số tiền gốc', rate: 'Tỷ lệ',
    condition: 'Điều kiện', whenTrue: 'Khi đúng', whenFalse: 'Khi sai', value: 'Giá trị', month: 'Tháng',
    gpLevel1: 'Giá trị bậc 1', gpLevel2: 'Giá trị bậc 2', gpLevel3: 'Giá trị bậc 3', target: 'Chỉ tiêu',
    adjustment: 'Điều chỉnh', taxableIncome: 'Thu nhập tính thuế', hasLaborContract: 'Có hợp đồng lao động',
    adminGp: 'Quỹ quản trị', saleGp: 'Quỹ kinh doanh', participantCount: 'Số người tham gia'
  });
  let toastTimer = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    applyBranding(window.IncalBranding || {});
    bindTabs();
    bindInput();
    bindBuilder();
    bindRun();
    bindDashboard();
    try {
      const storedPreset = V3.loadPreset(localStorage);
      if (storedPreset) state.preset = V3.createPreset(storedPreset);
    } catch (error) { toast(error.message, true); }
    state.sourceSchema = state.preset.sourceSchema ? V3.clone(state.preset.sourceSchema) : null;
    state.compatibility = state.sourceSchema ? 'waiting' : 'empty';
    state.selectedRecipeId = state.preset.recipes[0]?.id || null;
    ensureRecipePresentations(state.preset);
    restoreSubjectBindings(state.sourceSchema?.subjectTableId, false);
    prepareRecipeLayouts(state.preset);
    renderAll();
    window.__INCAL_V3__ = {
      state,
      setPreset(preset) { setPreset(preset); },
      adoptCurrentSchema,
      calculate: calculateReport,
      fields: currentFields,
      autoArrange: arrangeCurrentRecipe,
      connectNodes: commitConnection,
      fitCanvas,
      setCanvasZoom
    };
  }

  function cacheElements() {
    document.querySelectorAll('[id]').forEach((element) => { els[element.id] = element; });
  }

  function applyBranding(brand) {
    els.brandCompany.textContent = brand.productName || 'Incentive';
    els.brandProduct.textContent = 'Workspace cho FIN';
    document.title = `${brand.companyName || 'Trustana'} - ${brand.productName || 'Tính Incentive'}`;
    if (brand.logo) els.brandLogo.src = brand.logo;
    if (brand.colors?.primary) document.documentElement.style.setProperty('--brand', brand.colors.primary);
    if (brand.colors?.accent) document.documentElement.style.setProperty('--accent', brand.colors.accent);
  }

  function bindTabs() {
    document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => activateTab(button.dataset.tab)));
  }

  function activateTab(name) {
    document.querySelectorAll('.tab').forEach((button) => {
      const active = button.dataset.tab === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const active = panel.id === `tab-${name}`;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    document.querySelector(`#tab-${name}`)?.focus({ preventScroll: true });
    if (name === 'dashboard') renderDashboard();
    if (name === 'formulas') requestAnimationFrame(() => { applyCanvasPan(); drawConnections(); });
  }

  function bindInput() {
    els.excelInput.addEventListener('change', () => loadExcelFile(els.excelInput.files[0]));
    ['dragenter', 'dragover'].forEach((name) => els.excelDropzone.addEventListener(name, (event) => {
      event.preventDefault();
      els.excelDropzone.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((name) => els.excelDropzone.addEventListener(name, (event) => {
      event.preventDefault();
      els.excelDropzone.classList.remove('dragging');
    }));
    els.excelDropzone.addEventListener('drop', (event) => loadExcelFile(event.dataTransfer.files[0]));
    els.adoptSchema.addEventListener('click', adoptCurrentSchema);
    els.sheetList.addEventListener('change', onSchemaEdit);
  }

  async function loadExcelFile(file) {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true, cellNF: true });
      const discovery = V3.discoverWorkbook(workbook, XLSX);
      const reconciled = V3.reconcileSourceSchema(discovery, state.preset.sourceSchema);
      state.workbook = workbook;
      state.discovery = discovery;
      state.sourceSchema = reconciled.schema;
      state.fileName = file.name;
      state.report = null;
      if (state.preset.sourceSchema && reconciled.comparison.exact) {
        state.compatibility = 'exact';
        state.preset.sourceSchema = V3.clone(state.sourceSchema);
        restoreSubjectBindings(state.sourceSchema.subjectTableId, false);
      } else {
        state.compatibility = state.preset.sourceSchema ? 'mismatch' : 'new';
      }
      renderAll();
      toast(reconciled.comparison.exact ? 'Schema khớp preset. Đã tự ướm cột.' : `Đã đọc ${discovery.sheets.length} sheet. Hãy kiểm tra và ướm schema.`);
    } catch (error) {
      state.workbook = null;
      state.discovery = null;
      state.input = null;
      state.fileName = '';
      state.compatibility = state.preset.sourceSchema ? 'waiting' : 'empty';
      toast(error.message, true);
      renderAll();
    } finally {
      els.excelInput.value = '';
    }
  }

  function adoptCurrentSchema() {
    if (!state.workbook || !state.sourceSchema) return;
    state.preset.sourceSchema = V3.clone(state.sourceSchema);
    restoreSubjectBindings(state.sourceSchema.subjectTableId, state.compatibility === 'mismatch');
    state.compatibility = 'adopted';
    state.report = null;
    renderAll();
    toast('Đã ướm schema file hiện tại. Hoàn tất binding rồi lưu preset.');
  }

  function onSchemaEdit(event) {
    const tableId = event.target.dataset.tableId || event.target.dataset.subjectTable;
    const sheet = state.sourceSchema?.sheets?.find((item) => item.tableId === tableId);
    if (!sheet) return;
    if (event.target.dataset.entityName !== undefined) sheet.label = event.target.value.trim() || sheet.name;
    if (event.target.dataset.entityRole !== undefined) sheet.role = event.target.value.trim() || 'Nguồn';
    if (event.target.dataset.keyField !== undefined) sheet.keyFieldId = event.target.value;
    if (event.target.dataset.subjectBinding !== undefined) {
      const key = event.target.dataset.subjectBinding;
      if (event.target.value) state.preset.bindings[key] = event.target.value;
      else delete state.preset.bindings[key];
      if (key === 'subject.id') sheet.keyFieldId = event.target.value;
      rememberSubjectBindings(sheet.tableId);
    }
    if (event.target.dataset.fieldType !== undefined) {
      const field = sheet.fields.find((item) => item.id === event.target.dataset.fieldType);
      if (field) field.type = event.target.value;
    }
    if (state.compatibility === 'exact' || state.compatibility === 'adopted') {
      state.preset.sourceSchema = V3.clone(state.sourceSchema);
      state.compatibility = 'adopted';
    }
    state.report = null;
    renderAll();
  }

  function renderInput() {
    const schemaValue = state.sourceSchema;
    const sheets = schemaValue?.sheets || [];
    const fields = sheets.flatMap((sheet) => sheet.fields || []);
    els.metricFile.textContent = state.fileName || '—';
    els.metricFile.title = state.fileName || '';
    els.metricSheets.textContent = sheets.length;
    els.metricFields.textContent = fields.length;
    els.metricRows.textContent = sheets.reduce((sum, sheet) => sum + Number(sheet.rowCount || 0), 0);
    els.schemaEmpty.hidden = Boolean(schemaValue?.sheets?.length);
    els.sheetList.innerHTML = (schemaValue?.sheets || []).map(renderSheet).join('');
    renderCalculationSubject();
    setStatus(els.inputStatus, inputStatusModel());
    els.adoptSchema.hidden = !['new', 'mismatch'].includes(state.compatibility);
  }

  function inputStatusModel() {
    if (state.compatibility === 'exact') return { kind: 'success', icon: '✓', title: 'Đã tự ướm mô hình N-bảng', detail: `${state.fileName} khớp sheet/header, tên bảng, khóa và chủ thể đã được phục hồi từ preset.` };
    if (state.compatibility === 'adopted') return { kind: 'success', icon: '✓', title: 'Đang dùng mô hình file hiện tại', detail: 'Kiểm tra kiểu cột và định danh của bảng đang tính rồi lưu preset để dùng lại kỳ sau.' };
    if (state.compatibility === 'mismatch') {
      const comparison = V3.compareSourceSchema(state.preset.sourceSchema, state.discovery);
      const diff = [...comparison.missing.slice(0, 2).map((item) => `thiếu ${item}`), ...comparison.added.slice(0, 2).map((item) => `mới ${item}`)].join(' · ');
      return { kind: 'danger', icon: '!', title: 'Header lệch preset — chưa được tính', detail: diff || comparison.reason };
    }
    if (state.compatibility === 'new') return { kind: 'warning', icon: '→', title: 'Workbook mới, chưa có mô hình preset', detail: 'Kiểm tra kiểu cột, chọn đối tượng ở bước Tính, rồi bấm Ướm schema file này.' };
    if (state.compatibility === 'waiting') return { kind: 'neutral', icon: '○', title: 'Preset đã có schema', detail: 'Nạp file cùng định dạng để app tự ướm.' };
    return { kind: 'neutral', icon: '○', title: 'Chưa có workbook', detail: 'Nạp file để app đọc sheet và header.' };
  }

  function renderSheet(sheet) {
    const subject = state.sourceSchema?.subjectTableId === sheet.tableId;
    const badge = String(sheet.label || sheet.name).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'TB';
    const subjectMapping = subject ? `<div class="subject-map"><div class="subject-map-heading"><span><b>Định danh kết quả</b><small>Ba cột này lấy trực tiếp từ sheet ${escapeHtml(sheet.name)}.</small></span></div><div class="binding-grid">${V3.BINDING_SPECS.map((spec) => renderSubjectBinding(sheet, spec)).join('')}</div></div>` : '';
    return `<details class="sheet-panel ${subject ? 'is-subject' : ''}" data-entity="${escapeHtml(sheet.tableId)}" ${subject ? 'open' : ''}><summary class="sheet-head"><span class="sheet-badge">${escapeHtml(badge)}</span><div class="sheet-title"><strong>${escapeHtml(sheet.label)}</strong><span>${sheet.fields.length} cột · ${sheet.rowCount} dòng</span></div>${subject ? '<span class="subject-badge">Đối tượng tính</span>' : '<span class="sheet-expand-hint">Xem cột</span>'}<i class="chevron-icon" aria-hidden="true"></i></summary>${subjectMapping}<div class="field-grid">${sheet.fields.map((field) => `<div class="source-field"><strong title="${escapeHtml(field.header)}">${escapeHtml(field.header)}</strong><select class="field-type" data-table-id="${escapeHtml(sheet.tableId)}" data-field-type="${escapeHtml(field.id)}" aria-label="Kiểu của ${escapeHtml(field.header)}">${V3.TYPE_OPTIONS.map((type) => `<option value="${type}" ${type === field.type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>`).join('')}</div></details>`;
  }

  function renderSubjectBinding(sheet, spec) {
    const selected = state.preset.bindings?.[spec.id] || '';
    const options = (sheet.fields || []).map((field) => `<option value="${escapeHtml(field.id)}" ${field.id === selected ? 'selected' : ''}>${escapeHtml(field.header)}</option>`).join('');
    const label = spec.id === 'subject.id' ? 'Mã định danh' : spec.id === 'subject.group' ? 'Nhóm phân tích' : spec.label;
    return `<label class="binding-item"><span>${escapeHtml(label)}${spec.required ? '<em>Bắt buộc</em>' : ''}</span><select data-table-id="${escapeHtml(sheet.tableId)}" data-subject-binding="${escapeHtml(spec.id)}"><option value="">-- chưa gán --</option>${options}</select></label>`;
  }

  function renderCalculationSubject() {
    if (!els.calculationSubject) return;
    const sheets = currentTables();
    const selected = state.sourceSchema?.subjectTableId || '';
    els.calculationSubject.innerHTML = sheets.map((sheet) => `<option value="${escapeHtml(sheet.tableId)}" ${sheet.tableId === selected ? 'selected' : ''}>${escapeHtml(sheet.label)}</option>`).join('');
    els.calculationSubject.disabled = sheets.length < 2;
    els.calculationSubject.title = sheets.length < 2 ? 'Workbook chỉ có một bảng có thể tính.' : 'Chọn bảng mà mỗi dòng sẽ tạo một kết quả.';
  }

  function rememberSubjectBindings(tableId) {
    if (!state.sourceSchema || !tableId) return;
    state.sourceSchema.subjectBindings = Object.assign({}, state.sourceSchema.subjectBindings || {});
    state.sourceSchema.subjectBindings[tableId] = V3.clone(state.preset.bindings || {});
    if (state.preset.sourceSchema) {
      state.preset.sourceSchema.subjectBindings = V3.clone(state.sourceSchema.subjectBindings);
      state.preset.sourceSchema.subjectTableId = state.sourceSchema.subjectTableId;
    }
  }

  function restoreSubjectBindings(tableId, forceFresh) {
    if (!state.sourceSchema || !tableId) return;
    state.sourceSchema.subjectTableId = tableId;
    const saved = state.sourceSchema.subjectBindings?.[tableId]
      || state.preset.sourceSchema?.subjectBindings?.[tableId]
      || (!forceFresh ? state.preset.bindings : {});
    state.preset.bindings = V3.suggestBindings(state.sourceSchema, saved || {});
    const subject = V3.subjectTable(state.sourceSchema);
    if (subject && state.preset.bindings['subject.id']) subject.keyFieldId = state.preset.bindings['subject.id'];
    rememberSubjectBindings(tableId);
  }

  function changeCalculationSubject(tableId) {
    const previous = state.sourceSchema?.subjectTableId;
    if (!state.sourceSchema || !tableId || tableId === previous) return;
    rememberSubjectBindings(previous);
    restoreSubjectBindings(tableId, false);
    if (['exact', 'adopted'].includes(state.compatibility)) {
      state.preset.sourceSchema = V3.clone(state.sourceSchema);
      state.compatibility = 'adopted';
    }
    state.report = null;
    renderAll();
    toast(`Đã chuyển đối tượng tính sang ${V3.subjectTable(state.sourceSchema)?.label || 'bảng đã chọn'}.`);
  }

  function bindBuilder() {
    els.newRecipe.addEventListener('click', () => {
      const recipe = V3.createRecipe({ id: uniqueId('RECIPE'), name: `Công thức ${state.preset.recipes.length + 1}` });
      ensureRecipePresentation(recipe);
      state.preset.recipes.push(recipe);
      state.selectedRecipeId = recipe.id;
      resetCanvasTransientState(true);
      renderBuilder();
    });
    els.presetName.addEventListener('input', () => { state.preset.name = els.presetName.value; });
    els.presetVersion.addEventListener('input', () => { state.preset.version = els.presetVersion.value; });
    els.recipeSelect.addEventListener('change', () => selectRecipe(els.recipeSelect.value));
    els.recipeMenuButton.addEventListener('click', () => toggleRecipeMenu());
    els.recipeMenu.addEventListener('click', (event) => {
      const option = event.target.closest('[data-recipe-option]');
      if (option) selectRecipe(option.dataset.recipeOption);
    });
    els.presetFileInput.addEventListener('change', async () => {
      try {
        setPreset(V3.deserializePreset(await readTextFile(els.presetFileInput.files[0])));
        V3.savePreset(localStorage, state.preset);
        toast('Đã nạp preset và tự nhớ cho lần mở sau.');
      }
      catch (error) { toast(error.message, true); }
      finally { els.presetFileInput.value = ''; }
    });
    els.savePreset.addEventListener('click', exportPresetFile);
    els.recipeMeta.addEventListener('input', onRecipeMetaEdit);
    els.recipeMeta.addEventListener('change', onRecipeMetaEdit);
    els.nodeList.addEventListener('click', onNodeClick);
    els.nodeList.addEventListener('pointerdown', onCanvasNodePointerDown);
    els.nodeList.addEventListener('dblclick', onNodeDoubleClick);
    els.nodeList.addEventListener('contextmenu', onNodeContextMenu);
    els.edgeLayer.addEventListener('pointerdown', onEdgePointerDown);
    els.edgeLayer.addEventListener('contextmenu', onEdgeContextMenu);
    els.recipeMeta.addEventListener('click', (event) => {
      if (event.target.dataset.deleteRecipe === undefined) return;
      state.preset.recipes = state.preset.recipes.filter((recipe) => recipe.id !== state.selectedRecipeId);
      state.selectedRecipeId = state.preset.recipes[0]?.id || null;
      resetCanvasTransientState(true);
      renderBuilder();
    });
    els.inspector.addEventListener('change', onInspectorChange);
    els.inspector.addEventListener('input', onInspectorInput);
    els.inspector.addEventListener('click', (event) => {
      if (event.target.dataset.disconnectPort !== undefined) {
        const recipe = currentRecipe();
        const node = currentNode();
        if (recipe && node) {
          delete node.inputs[event.target.dataset.disconnectPort];
          syncRecipeOutput(recipe);
          renderBuilder();
        }
        return;
      }
      if (event.target.dataset.deleteNode === undefined) return;
      deleteSelectedNode();
    });
    els.blockLibrary.addEventListener('click', (event) => { const block = event.target.closest('.library-block'); if (block) addBlock(block.dataset.blockId); });
    els.blockLibrary.addEventListener('dragstart', (event) => { const block = event.target.closest('.library-block'); if (block) event.dataTransfer.setData('application/x-incal-block', block.dataset.blockId); });
    els.formulaCanvas.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; });
    els.formulaCanvas.addEventListener('drop', onLibraryDrop);
    els.formulaCanvas.addEventListener('pointerdown', onCanvasPanStart);
    els.formulaCanvas.addEventListener('wheel', onCanvasWheel, { passive: false });
    els.autoArrange.addEventListener('click', arrangeCurrentRecipe);
    els.zoomOut.addEventListener('click', () => setCanvasZoom(state.canvasZoom - 0.1));
    els.zoomReset.addEventListener('click', () => setCanvasZoom(1));
    els.zoomIn.addEventListener('click', () => setCanvasZoom(state.canvasZoom + 0.1));
    els.zoomFit.addEventListener('click', fitCanvas);
    els.closeNodeSettings.addEventListener('click', () => els.nodeSettingsDialog.close());
    els.nodeContextMenu.addEventListener('click', onContextMenuAction);
    els.edgeContextMenu.addEventListener('click', onEdgeMenuAction);
    document.addEventListener('pointerdown', (event) => {
      if (!els.nodeContextMenu.contains(event.target)) closeNodeContextMenu();
      if (!els.edgeContextMenu.contains(event.target)) closeEdgeContextMenu();
      if (!els.recipeMenu.contains(event.target) && !els.recipeMenuButton.contains(event.target)) closeRecipeMenu();
    });
    document.addEventListener('keydown', onCanvasKeyDown);
    window.addEventListener('resize', () => requestAnimationFrame(drawConnections));
  }

  function selectRecipe(recipeId) {
    state.selectedRecipeId = recipeId;
    els.recipeSelect.value = recipeId;
    resetCanvasTransientState(true);
    renderBuilder();
    requestAnimationFrame(fitCanvas);
  }

  function toggleRecipeMenu(force) {
    const open = force === undefined ? els.recipeMenu.hidden : Boolean(force);
    els.recipeMenu.hidden = !open;
    els.recipeMenuButton.setAttribute('aria-expanded', String(open));
  }

  function closeRecipeMenu() { toggleRecipeMenu(false); }

  function resetCanvasTransientState(resetCamera) {
    document.removeEventListener('pointermove', onCanvasNodeMove);
    document.removeEventListener('pointermove', onNodeResizeMove);
    document.removeEventListener('pointermove', onConnectionMove);
    document.removeEventListener('pointermove', onSourceReconnectMove);
    document.removeEventListener('pointermove', onCanvasPanMove);
    state.nodeDrag = null;
    state.nodeResize = null;
    state.panDrag = null;
    state.selectedNodeId = null;
    clearConnectionGesture();
    closeNodeContextMenu();
    closeEdgeContextMenu();
    closeRecipeMenu();
    if (els.nodeSettingsDialog?.open) els.nodeSettingsDialog.close();
    if (els.edgeLayer) els.edgeLayer.innerHTML = '';
    if (resetCamera) {
      state.canvasPan = { x: 0, y: 0 };
      state.canvasZoom = 1;
    }
  }

  function setPreset(value) {
    state.preset = V3.createPreset(value);
    ensureRecipePresentations(state.preset);
    prepareRecipeLayouts(state.preset);
    state.selectedRecipeId = state.preset.recipes[0]?.id || null;
    state.selectedNodeId = null;
    state.canvasPan = { x: 0, y: 0 };
    state.canvasZoom = 1;
    if (state.workbook && state.discovery) {
      const reconciled = V3.reconcileSourceSchema(state.discovery, state.preset.sourceSchema);
      state.sourceSchema = reconciled.schema;
      state.compatibility = reconciled.comparison.exact ? 'exact' : 'mismatch';
      if (reconciled.comparison.exact) restoreSubjectBindings(state.sourceSchema.subjectTableId, false);
    } else {
      state.sourceSchema = state.preset.sourceSchema ? V3.clone(state.preset.sourceSchema) : null;
      state.compatibility = state.sourceSchema ? 'waiting' : 'empty';
      restoreSubjectBindings(state.sourceSchema?.subjectTableId, false);
    }
    state.report = null;
    renderAll();
  }

  function exportPresetFile() {
    const readiness = formulaReadiness();
    if (!readiness.valid) { toast(readiness.errors[0], true); return; }
    try {
      state.preset.sourceSchema = V3.clone(state.sourceSchema);
      V3.syncPresetRelations(state.preset);
      downloadText(V3.serializePreset(state.preset), `${safeName(state.preset.id)}.json`, 'application/json');
      toast('Đã tải preset JSON để backup hoặc chia sẻ.');
    } catch (error) { toast(error.message, true); }
  }

  function ensureRecipePresentation(recipe) {
    recipe.meta = Object.assign({}, recipe.meta || {});
    recipe.meta.presentation = Object.assign({
      label: defaultRecipeLabel(recipe),
      role: Export.recipeRole(recipe)
    }, recipe.meta.presentation || {});
    return recipe.meta.presentation;
  }

  function defaultRecipeLabel(recipe) {
    const name = String(recipe?.name || '').trim();
    const component = String(recipe?.component || recipe?.id || '').trim();
    if (component.toLowerCase() === 'penalty') return 'Khấu trừ';
    if (component.toLowerCase() === 'tax') return 'Thuế incentive';
    if (component.toLowerCase() === 'adjustment') return 'Điều chỉnh';
    const technical = !name || normalizeText(name) === normalizeText(component) || /^tax[_\-\s]/i.test(name);
    if (!technical) return name;
    const blocks = new Set((recipe?.nodes || []).map((node) => node.blockId));
    if (blocks.has('macro.waterfall')) return 'Thưởng theo nhiều bậc';
    if (blocks.has('macro.kae_pool')) return 'Chia quỹ theo số người';
    if (blocks.has('percent_of')) return 'Thưởng trực tiếp';
    return 'Khoản thu nhập';
  }

  function ensureRecipePresentations(preset) {
    for (const recipe of preset?.recipes || []) ensureRecipePresentation(recipe);
  }

  function renderBlockLibrary() {
    const groups = new Map();
    for (const block of V3.listBlocks()) {
      if (!groups.has(block.category)) groups.set(block.category, []);
      groups.get(block.category).push(block);
    }
    els.blockLibrary.innerHTML = Array.from(groups.entries()).map(([category, blocks]) => `<section class="library-group"><h3>${escapeHtml(category === 'Macro' ? 'KHỐI DỰNG SẴN' : category)}</h3>${blocks.map((block) => `<button class="library-block ${block.lockedMacro ? 'macro' : ''}" type="button" draggable="true" data-block-id="${block.id}"><i class="block-dot"></i><strong>${escapeHtml(blockDisplayName(block))}</strong></button>`).join('')}</section>`).join('');
    els.blockCount.textContent = V3.listBlocks().length;
  }

  function renderBuilder() {
    prepareRecipeLayouts(state.preset);
    syncAllRecipeOutputs();
    els.presetName.value = state.preset.name;
    els.presetVersion.value = state.preset.version;
    els.recipeSelect.innerHTML = state.preset.recipes.length ? state.preset.recipes.map((recipe) => `<option value="${escapeHtml(recipe.id)}" ${recipe.id === state.selectedRecipeId ? 'selected' : ''}>${escapeHtml(recipe.name)}</option>`).join('') : '<option value="">Chưa có recipe</option>';
    els.recipeMenu.innerHTML = state.preset.recipes.length ? state.preset.recipes.map((recipe) => `<button type="button" role="option" aria-selected="${recipe.id === state.selectedRecipeId}" data-recipe-option="${escapeHtml(recipe.id)}"><span>${escapeHtml(Export.recipeLabel(recipe))}</span><small>${escapeHtml(Export.ROLE_LABELS[Export.recipeRole(recipe)])}</small></button>`).join('') : '<div class="recipe-menu-empty">Chưa có công thức</div>';
    els.recipeMenuLabel.textContent = currentRecipe() ? Export.recipeLabel(currentRecipe()) : 'Chưa có công thức';
    renderRecipeMeta();
    renderNodeList();
    renderInspector();
    renderValidation();
    applyCanvasPan();
    requestAnimationFrame(drawConnections);
  }

  function currentRecipe() { return state.preset.recipes.find((recipe) => recipe.id === state.selectedRecipeId) || null; }
  function currentNode() { return currentRecipe()?.nodes.find((node) => node.id === state.selectedNodeId) || null; }

  function renderRecipeMeta() {
    const recipe = currentRecipe();
    if (!recipe) { els.recipeMeta.innerHTML = ''; return; }
    const presentation = ensureRecipePresentation(recipe);
    els.recipeMeta.innerHTML = `<label class="recipe-name-field"><span>Tên khoản</span><input data-recipe="presentation.label" value="${escapeHtml(presentation.label)}"></label><label class="recipe-role-field"><span>Loại khoản</span><select data-recipe="presentation.role">${Object.entries(Export.ROLE_LABELS).map(([value, label]) => `<option value="${value}" ${presentation.role === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label><details class="recipe-advanced"><summary>Tuỳ chọn</summary><div><label><span>Mã nội bộ</span><input data-recipe="component" value="${escapeHtml(recipe.component)}"></label><label><span>Kiểu kết quả</span><select data-recipe="output.type">${['Money', 'Number', 'Percent', 'Text', 'Boolean'].map((type) => `<option ${recipe.output.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></label><button class="mini-button danger" type="button" data-delete-recipe>Xoá công thức</button></div></details>`;
  }

  function onRecipeMetaEdit(event) {
    const recipe = currentRecipe();
    if (!recipe || !event.target.dataset.recipe) return;
    const key = event.target.dataset.recipe;
    const presentation = ensureRecipePresentation(recipe);
    if (key === 'output.type') recipe.output.type = event.target.value;
    else if (key === 'presentation.label') {
      presentation.label = event.target.value;
      recipe.name = event.target.value || 'Công thức chưa đặt tên';
      renderRecipeSelectLabel(recipe);
      els.recipeMenuLabel.textContent = presentation.label || recipe.name;
    } else if (key === 'presentation.role') {
      presentation.role = event.target.value;
      if (event.target.value === 'deduction') recipe.component = 'penalty';
      else if (event.target.value === 'tax') recipe.component = 'tax';
      else if (event.target.value === 'adjustment') recipe.component = 'adjustment';
      else if (['penalty', 'tax', 'adjustment'].includes(String(recipe.component).toLowerCase())) recipe.component = `income_${safeName(recipe.id).toLowerCase()}`;
    } else recipe[key] = event.target.value;
    renderValidation();
    renderComponentExportButtons();
  }

  function renderRecipeSelectLabel(recipe) {
    const option = Array.from(els.recipeSelect.options).find((item) => item.value === recipe.id);
    if (option) option.textContent = recipe.name;
    const menuOption = els.recipeMenu.querySelector(`[data-recipe-option="${cssEscape(recipe.id)}"] span`);
    if (menuOption) menuOption.textContent = Export.recipeLabel(recipe);
  }

  function renderNodeList() {
    const recipe = currentRecipe();
    const nodes = recipe?.nodes || [];
    els.nodeEmpty.hidden = nodes.length > 0;
    const validation = recipe ? V3.validateRecipe(recipe, currentFields()) : { errors: [], outputTypes: new Map() };
    const sinkIds = new Set(recipe ? Canvas.sinkNodeIds(recipe) : []);
    const outgoingIds = new Set(recipe ? Canvas.connections(recipe).map((edge) => edge.sourceId) : []);
    els.nodeList.innerHTML = nodes.map((node) => {
      const def = V3.getBlock(node.blockId);
      const point = Canvas.position(node) || Canvas.setPosition(node, 72, 72);
      const errors = validation.errors.filter((item) => item.nodeId === node.id);
      const result = sinkIds.size === 1 && sinkIds.has(node.id);
      const missingInput = (def?.inputs || []).some((port) => !node.inputs?.[port.id]);
      const fatalError = errors.some((item) => !['MISSING_INPUT', 'MISSING_OUTPUT'].includes(item.code));
      const outputUsed = outgoingIds.has(node.id) || result;
      const status = fatalError ? 'error' : !missingInput && outputUsed && !(sinkIds.size > 1 && sinkIds.has(node.id)) ? 'valid' : 'warning';
      const ports = (def?.inputs || []).map((port) => {
        const ref = node.inputs?.[port.id];
        const connected = ref?.kind === 'node';
        const bound = Boolean(ref);
        const label = portDisplayName(port.id);
        return `<button class="graph-input-port ${connected ? 'connected' : ''} ${bound ? 'bound' : 'missing'}" type="button" data-input-node="${escapeHtml(node.id)}" data-port-id="${escapeHtml(port.id)}" data-port-type="${escapeHtml(port.type)}" aria-label="${escapeHtml(`${label}, kiểu ${port.type}`)}" title="${escapeHtml(`${label} · ${port.type}${connected ? ' · đã nối' : bound ? ' · đã có giá trị' : ' · còn thiếu'}`)}"><i class="port-dot"></i><span>${escapeHtml(label)}</span></button>`;
      }).join('');
      const outputType = validation.outputTypes.get(node.id) || outputTypeForNode(node, recipe);
      const statusLabel = status === 'valid' ? 'Đã nối đủ' : status === 'warning' ? 'Còn thiếu kết nối' : 'Có lỗi';
      const width = Canvas.nodeWidth(node);
      const title = nodeDisplayName(node, def);
      return `<article class="graph-node category-${categorySlug(def?.category)} state-${status} ${node.id === state.selectedNodeId ? 'selected' : ''} ${result ? 'is-result' : ''}" style="left:${point.x}px;top:${point.y}px;width:${width}px" data-node-id="${escapeHtml(node.id)}" data-block-id="${escapeHtml(node.blockId)}" data-node-status="${status}" title="${escapeHtml(statusLabel)}"><header class="node-head"><i class="node-status-dot" aria-label="${escapeHtml(statusLabel)}"></i><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(nodeSummary(node, def))}</small></span></header><div class="graph-port-list">${ports || '<span class="no-inputs">Không cần đầu vào</span>'}</div>${result ? '<span class="result-badge">= KẾT QUẢ</span>' : ''}<button class="graph-output-port ${outputUsed ? 'used' : 'unused'}" type="button" data-output-node="${escapeHtml(node.id)}" data-output-type="${escapeHtml(outputType)}" aria-label="Đầu ra ${escapeHtml(outputType)}" title="Kéo để nối đầu ra · ${escapeHtml(outputType)}"><i class="port-dot"></i></button><button class="node-resize-handle" type="button" data-resize-node="${escapeHtml(node.id)}" aria-label="Thay đổi độ rộng khối" title="Kéo để đổi độ rộng"></button></article>`;
    }).join('');
    els.graphStatus.textContent = graphStatusText(recipe);
    els.graphStatus.className = `graph-status ${recipe && Canvas.sinkNodeIds(recipe).length === 1 ? 'valid' : 'invalid'}`;
  }

  function nodeSummary(node, def) {
    if (node.blockId === 'source') return `Bảng ${displayTable(node.config?.table)}`;
    if (node.blockId === 'filter') return `${displayFieldOrValue(node.config?.fieldId)} ${displayOperator(node.config?.operator)} ${displayFieldOrValue(node.config?.value)}`;
    if (node.blockId === 'scan_sum') return `Tổng ${displayFieldOrValue(node.config?.fieldId)}`;
    if (node.blockId === 'lookup') return `${displayTable(node.config?.table)} · trả về ${displayFieldOrValue(node.config?.returnFieldId)}`;
    if (node.blockId === 'map_lookup') return `${displayFieldOrValue(node.config?.returnFieldId)} → ${node.config?.derivedFieldLabel || 'Cột tra cứu'}`;
    if (node.blockId === 'map_arithmetic') return `${mapOperandSummary(node, 'left')} ${node.config?.operator || '?'} ${mapOperandSummary(node, 'right')} → ${node.config?.derivedFieldLabel || 'Cột tính toán'}`;
    const configs = (def?.configSchema || []).map((item) => node.config?.[item.id]).filter((value) => value !== undefined && value !== '').slice(0, 2);
    return configs.length ? configs.map((value) => Array.isArray(value) ? value.join(' / ') : displayFieldOrValue(value)).join(' · ') : 'Chưa có tham số';
  }

  function displayFieldOrValue(value) {
    const field = currentFields().find((item) => item.id === value);
    if (field) return field.derived ? field.label : `${field.source?.sheet || displayTable(field.table)} · ${field.label}`;
    const table = currentTables().find((item) => item.tableId === value);
    if (table) return table.label;
    return humanizeFieldId(value);
  }

  function displayTable(value) {
    return currentTables().find((item) => item.tableId === value)?.label || humanizeTableId(value);
  }

  function displayOperator(value) { return OPERATOR_LABELS[value] || String(value ?? ''); }

  function mapOperandSummary(node, side) {
    if (node.config?.[`${side}Mode`] !== 'literal') return displayFieldOrValue(node.config?.[`${side}FieldId`]);
    const value = Number(node.config?.[`${side}Literal`] || 0);
    return node.config?.[`${side}LiteralType`] === 'Percent' ? `${value * 100}%` : String(value);
  }

  function nodeReferenceLabel(node, recipe) {
    const index = recipe.nodes.indexOf(node);
    const def = V3.getBlock(node.blockId);
    const detail = nodeSummary(node, def);
    return `Bước ${String(index + 1).padStart(2, '0')} · ${nodeDisplayName(node, def)}${detail && detail !== 'Chưa có tham số' ? `: ${detail}` : ''}`;
  }

  function blockDisplayName(def) { return BLOCK_LABELS[def?.id] || def?.name || def?.id || 'Khối'; }
  function nodeDisplayName(node, def) { return String(node?.meta?.canvas?.label || '').trim() || blockDisplayName(def); }
  function portDisplayName(portId) { return PORT_LABELS[portId] || String(portId || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (char) => char.toUpperCase()); }

  function onNodeClick(event) {
    const card = event.target.closest('.graph-node');
    if (!card) return;
    state.selectedNodeId = card.dataset.nodeId;
    markSelectedNode();
    renderInspector();
  }

  function markSelectedNode() {
    for (const card of els.nodeList.querySelectorAll('.graph-node')) card.classList.toggle('selected', card.dataset.nodeId === state.selectedNodeId);
  }

  function onNodeDoubleClick(event) {
    if (event.target.closest('.graph-input-port,.graph-output-port')) return;
    const card = event.target.closest('.graph-node');
    if (card) openNodeSettings(card.dataset.nodeId);
  }

  function onNodeContextMenu(event) {
    const card = event.target.closest('.graph-node');
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    state.selectedNodeId = card.dataset.nodeId;
    state.contextNodeId = card.dataset.nodeId;
    renderNodeList();
    renderInspector();
    els.nodeContextMenu.hidden = false;
    placeCanvasMenu(els.nodeContextMenu, event.clientX, event.clientY);
    els.nodeContextMenu.querySelector('button')?.focus();
  }

  function closeNodeContextMenu() {
    if (!els.nodeContextMenu) return;
    els.nodeContextMenu.hidden = true;
    state.contextNodeId = null;
  }

  function onEdgeContextMenu(event) {
    const edge = event.target.closest('[data-edge-source]');
    if (!edge) return;
    event.preventDefault();
    event.stopPropagation();
    state.contextEdge = { sourceId: edge.dataset.edgeSource, targetId: edge.dataset.edgeTarget, portId: edge.dataset.edgePort };
    closeNodeContextMenu();
    els.edgeContextMenu.hidden = false;
    placeCanvasMenu(els.edgeContextMenu, event.clientX, event.clientY);
  }

  function placeCanvasMenu(menu, clientX, clientY) {
    const rect = menu.getBoundingClientRect();
    const bounds = els.formulaCanvas.getBoundingClientRect();
    const topbarBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0;
    const safeLeft = Math.max(8, bounds.left + 8);
    const safeRight = Math.min(window.innerWidth - 8, bounds.right - 8);
    const safeTop = Math.max(8, bounds.top + 8, topbarBottom + 8);
    const safeBottom = Math.min(window.innerHeight - 8, bounds.bottom - 8);
    menu.style.left = `${Math.max(safeLeft, Math.min(clientX, safeRight - rect.width))}px`;
    menu.style.top = `${Math.max(safeTop, Math.min(clientY, safeBottom - rect.height))}px`;
  }

  function closeEdgeContextMenu() {
    if (!els.edgeContextMenu) return;
    els.edgeContextMenu.hidden = true;
    state.contextEdge = null;
  }

  function onEdgeMenuAction(event) {
    if (!event.target.closest('[data-edge-action="disconnect"]')) return;
    const edge = state.contextEdge;
    closeEdgeContextMenu();
    if (edge) disconnectEdge(edge.targetId, edge.portId);
  }

  function disconnectEdge(targetId, portId) {
    const recipe = currentRecipe();
    const target = recipe?.nodes.find((node) => node.id === targetId);
    if (!target?.inputs?.[portId]) return;
    delete target.inputs[portId];
    syncRecipeOutput(recipe);
    renderBuilder();
    toast('Đã ngắt kết nối.');
  }

  function onContextMenuAction(event) {
    const action = event.target.closest('[data-context-action]')?.dataset.contextAction;
    if (!action) return;
    const nodeId = state.contextNodeId;
    closeNodeContextMenu();
    if (!nodeId) return;
    state.selectedNodeId = nodeId;
    if (action === 'settings') openNodeSettings(nodeId);
    if (action === 'duplicate') duplicateSelectedNode();
    if (action === 'focus') focusSelectedNode();
    if (action === 'disconnect') disconnectSelectedNode();
    if (action === 'delete') deleteSelectedNode();
  }

  function openNodeSettings(nodeId) {
    if (nodeId) state.selectedNodeId = nodeId;
    const node = currentNode();
    if (!node) return;
    renderNodeList();
    renderInspector();
    const def = V3.getBlock(node.blockId);
    els.nodeSettingsTitle.textContent = def?.name || 'Khối công thức';
    if (!els.nodeSettingsDialog.open) els.nodeSettingsDialog.showModal();
  }

  function duplicateSelectedNode() {
    const recipe = currentRecipe();
    const node = currentNode();
    if (!recipe || !node) return;
    const copy = V3.clone(node);
    copy.id = uniqueId(String(node.blockId || 'NODE').toUpperCase());
    if (isDerivedBlock(copy)) copy.config.derivedFieldId = derivedFieldIdForNode(copy.id);
    const point = Canvas.position(node) || { x: 24, y: 72 };
    Canvas.setPosition(copy, point.x + 48, point.y + 48);
    recipe.nodes.push(copy);
    state.selectedNodeId = copy.id;
    syncRecipeOutput(recipe);
    renderBuilder();
    toast('Đã nhân bản khối.');
  }

  function disconnectSelectedNode() {
    const recipe = currentRecipe();
    const node = currentNode();
    if (!recipe || !node) return;
    for (const [portId, ref] of Object.entries(node.inputs || {})) if (ref?.kind === 'node') delete node.inputs[portId];
    for (const candidate of recipe.nodes) for (const [portId, ref] of Object.entries(candidate.inputs || {})) {
      if (ref?.kind === 'node' && ref.nodeId === node.id) delete candidate.inputs[portId];
    }
    syncRecipeOutput(recipe);
    renderBuilder();
    toast('Đã ngắt các kết nối của khối.');
  }

  function deleteSelectedNode() {
    const recipe = currentRecipe();
    const nodeId = state.selectedNodeId;
    if (!recipe || !nodeId) return;
    recipe.nodes = recipe.nodes.filter((node) => node.id !== nodeId);
    for (const node of recipe.nodes) for (const [portId, ref] of Object.entries(node.inputs || {})) {
      if (ref?.kind === 'node' && ref.nodeId === nodeId) delete node.inputs[portId];
    }
    state.selectedNodeId = null;
    syncRecipeOutput(recipe);
    if (els.nodeSettingsDialog.open) els.nodeSettingsDialog.close();
    renderBuilder();
  }

  function focusSelectedNode() {
    const node = currentNode();
    const point = Canvas.position(node);
    if (!node || !point) return;
    const zoom = Canvas.clampZoom(Math.max(1, state.canvasZoom));
    state.canvasZoom = zoom;
    state.canvasPan = {
      x: els.formulaCanvas.clientWidth / 2 - (point.x + Canvas.nodeWidth(node) / 2) * zoom,
      y: els.formulaCanvas.clientHeight / 2 - (point.y + 63) * zoom
    };
    applyCanvasPan();
    requestAnimationFrame(drawConnections);
  }

  function onCanvasKeyDown(event) {
    if (event.key === 'Escape') closeNodeContextMenu();
    if (event.shiftKey && event.key === '1' && !els['tab-formulas'].hidden) {
      event.preventDefault();
      fitCanvas();
    }
  }

  function addBlock(blockId, canvasPoint) {
    let recipe = currentRecipe();
    if (!recipe) {
      recipe = V3.createRecipe({ id: uniqueId('RECIPE'), name: 'Công thức 1' });
      state.preset.recipes.push(recipe);
      state.selectedRecipeId = recipe.id;
    }
    const def = V3.getBlock(blockId);
    if (!def) return;
    const node = { id: uniqueNodeId(recipe, blockId.replace('macro.', 'macro-')), blockId, inputs: {}, config: defaultConfig(blockId, def), meta: { canvas: canvasPoint || nextNodePosition(recipe) } };
    if (isDerivedBlock(node)) node.config.derivedFieldId = derivedFieldIdForNode(node.id);
    for (const port of def.inputs) {
      const reference = defaultInputReference(recipe, port);
      if (reference) node.inputs[port.id] = reference;
    }
    recipe.nodes.push(node);
    syncRecipeOutput(recipe);
    state.selectedNodeId = node.id;
    renderBuilder();
  }

  function defaultConfig(blockId, def) {
    const output = {};
    for (const spec of def.configSchema || []) {
      if (spec.kind === 'select') output[spec.id] = spec.options[0] || '';
      else if (spec.kind === 'numberList') output[spec.id] = [];
      else if (spec.kind === 'number') output[spec.id] = 0;
      else if (spec.kind === 'field') output[spec.id] = currentFields()[0]?.id || '';
      else output[spec.id] = '';
    }
    if (blockId === 'source') {
      const sourceTable = currentTables().find((table) => table.tableId !== state.sourceSchema?.subjectTableId) || currentTables()[0];
      output.table = sourceTable?.tableId || '';
      output.ownerFieldId = suggestJoinField(sourceTable?.tableId) || '';
    }
    if (blockId === 'lookup') {
      const lookupTable = currentTables().find((table) => table.tableId !== state.sourceSchema?.subjectTableId) || currentTables()[0];
      output.table = lookupTable?.tableId || '';
      output.lookupFieldId = lookupTable?.keyFieldId || fieldsForTable(lookupTable?.tableId)[0]?.id || '';
      output.returnFieldId = fieldsForTable(lookupTable?.tableId).find((field) => field.id !== output.lookupFieldId)?.id || output.lookupFieldId;
      output.returnType = currentFields().find((field) => field.id === output.returnFieldId)?.type || 'Any';
    }
    if (blockId === 'map_lookup') {
      const lookupTable = currentTables().find((table) => table.tableId !== state.sourceSchema?.subjectTableId) || currentTables()[0];
      output.sourceKeyFieldId = currentFields()[0]?.id || '';
      output.table = lookupTable?.tableId || '';
      output.lookupFieldId = lookupTable?.keyFieldId || fieldsForTable(lookupTable?.tableId)[0]?.id || '';
      output.returnFieldId = fieldsForTable(lookupTable?.tableId).find((field) => field.id !== output.lookupFieldId)?.id || output.lookupFieldId;
      output.returnType = currentFields().find((field) => field.id === output.returnFieldId)?.type || 'Any';
      output.derivedFieldLabel = 'Cột tra cứu';
      output.fallback = '';
    }
    if (blockId === 'map_arithmetic') {
      const numericFields = currentFields().filter((field) => ['Money', 'Number', 'Percent'].includes(field.type));
      output.leftMode = 'field';
      output.leftFieldId = numericFields[0]?.id || '';
      output.leftLiteral = 0;
      output.leftLiteralType = 'Number';
      output.operator = '*';
      output.rightMode = 'field';
      output.rightFieldId = numericFields[1]?.id || numericFields[0]?.id || '';
      output.rightLiteral = 0;
      output.rightLiteralType = 'Number';
      output.derivedFieldLabel = 'Cột tính toán';
    }
    return output;
  }

  function defaultInputReference(recipe, port) {
    if (port.type === 'Table') return null;
    const subjectId = state.sourceSchema?.subjectTableId;
    const subjectField = currentFields().find((field) => field.table === subjectId && (port.type === 'Any' || field.type === port.type));
    if (subjectField) return { kind: 'field', fieldId: subjectField.id };
    return { kind: 'literal', type: port.type === 'Any' ? 'Number' : port.type, value: port.type === 'Boolean' ? false : port.type === 'Text' ? '' : 0 };
  }

  function outputTypeForNode(node, recipe) {
    const validation = V3.validateRecipe(recipe || currentRecipe(), currentFields());
    return validation.outputTypes.get(node.id) || V3.resolveOutputType(V3.getBlock(node.blockId) || {}, node, {}) || 'Any';
  }

  function renderInspector() {
    const node = currentNode();
    if (!node) {
      els.inspector.innerHTML = '<div class="empty-state"><strong>Chưa chọn khối</strong><span>Chọn một bước ở giữa để cấu hình.</span></div>';
      if (els.nodeSettingsDialog?.open) els.nodeSettingsDialog.close();
      return;
    }
    const def = V3.getBlock(node.blockId);
    const displayName = nodeDisplayName(node, def);
    if (els.nodeSettingsTitle) els.nodeSettingsTitle.textContent = displayName;
    const formula = def.lockedMacro ? `<details class="macro-formula"><summary>Công thức của khối</summary><div><code>${escapeHtml(macroFormulaDescription(def))}</code><p>Đây là cấu trúc dựng sẵn. Anh có thể đổi tên và tham số, nhưng logic bên trong vẫn được bảo vệ để kết quả có thể kiểm toán.</p></div></details>` : '';
    els.inspector.innerHTML = `<div class="inspector-heading"><p class="eyebrow">${def.lockedMacro ? 'KHỐI DỰNG SẴN' : escapeHtml(def.category)}</p><h3>${escapeHtml(displayName)}</h3></div><label class="inspector-field">Tên hiển thị<input data-node-label value="${escapeHtml(node.meta?.canvas?.label || '')}" placeholder="${escapeHtml(blockDisplayName(def))}"></label><section class="inspector-section"><h4>Cấu hình</h4>${def.inputs.map((port) => renderPortBinding(node, port)).join('')}${(def.configSchema || []).map((spec) => renderConfigField(node, spec)).join('')}</section>${formula}<div class="inspector-actions"><button class="mini-button danger" type="button" data-delete-node>Xoá khối</button></div>`;
  }

  function macroFormulaDescription(def) {
    const inputs = (def.inputs || []).map((port) => portDisplayName(port.id)).join(' + ');
    const configs = (def.configSchema || []).map((spec) => spec.label).join(', ');
    return `${blockDisplayName(def)}(${inputs || 'không có đầu vào'})${configs ? `; tham số: ${configs}` : ''} → kết quả đã định kiểu`;
  }

  function renderPortBinding(node, port) {
    const ref = node.inputs?.[port.id];
    const recipe = currentRecipe();
    const sourceNode = ref?.kind === 'node' ? recipe.nodes.find((candidate) => candidate.id === ref.nodeId) : null;
    const connection = sourceNode ? `<div class="connected-source"><span><b>Đã nối từ canvas</b>${escapeHtml(nodeReferenceLabel(sourceNode, recipe))}</span><button type="button" data-disconnect-port="${escapeHtml(port.id)}">Ngắt</button></div>` : '';
    const fieldGroups = port.type === 'Table' ? '' : portFieldOptionGroups(ref?.kind === 'field' ? ref.fieldId : '', port.type);
    const literalOptions = port.type === 'Table' ? '' : `<optgroup label="Giá trị nhập tay">${literalTypes(port.type).map((type) => `<option value="literal:${type}" ${ref?.kind === 'literal' && ref.type === type ? 'selected' : ''}>${type}</option>`).join('')}</optgroup>`;
    const alternative = port.type === 'Table' ? '<span class="canvas-only-hint">Đầu vào Table được nối trực tiếp trên canvas.</span>' : `<span class="input-binding"><select data-port="${port.id}"><option value="">-- chọn field / giá trị --</option>${fieldGroups}${literalOptions}</select>${ref?.kind === 'literal' ? literalInput(ref, port.id) : ''}</span>`;
    return `<label class="inspector-field"><span>${escapeHtml(portDisplayName(port.id))}<small title="Kiểu dữ liệu nội bộ">${escapeHtml(port.type)}</small></span>${connection}${sourceNode ? '' : alternative}</label>`;
  }

  function portFieldOptionGroups(selected, expectedType) {
    return currentTables().map((sheet) => {
      const options = sheet.fields.filter((field) => expectedType === 'Any' || field.type === expectedType).map((field) => `<option value="field:${escapeHtml(field.id)}" ${field.id === selected ? 'selected' : ''}>${escapeHtml(`${sheet.name} · ${field.header}`)}</option>`).join('');
      return options ? `<optgroup label="${escapeHtml(sheet.label)} · ${escapeHtml(sheet.role)}">${options}</optgroup>` : '';
    }).join('');
  }

  function literalInput(ref, portId) {
    if (ref.type === 'Boolean') return `<select data-literal-port="${portId}"><option value="true" ${ref.value === true ? 'selected' : ''}>true</option><option value="false" ${ref.value !== true ? 'selected' : ''}>false</option></select>`;
    return `<input data-literal-port="${portId}" type="${['Money', 'Number', 'Percent'].includes(ref.type) ? 'number' : 'text'}" step="any" value="${escapeHtml(ref.value)}">`;
  }

  function literalTypes(expected) { return expected === 'Any' ? ['Money', 'Number', 'Percent', 'Text', 'Boolean'] : [expected]; }

  function renderConfigField(node, spec) {
    if (spec.kind === 'internal') return '';
    if (node.blockId === 'map_arithmetic') {
      if (spec.id === 'leftFieldId' && node.config?.leftMode !== 'field') return '';
      if (['leftLiteral', 'leftLiteralType'].includes(spec.id) && node.config?.leftMode !== 'literal') return '';
      if (spec.id === 'rightFieldId' && node.config?.rightMode !== 'field') return '';
      if (['rightLiteral', 'rightLiteralType'].includes(spec.id) && node.config?.rightMode !== 'literal') return '';
    }
    const value = node.config?.[spec.id];
    let control;
    if (spec.kind === 'select' && spec.id === 'table' && ['source', 'lookup', 'map_lookup'].includes(node.blockId)) {
      control = `<select data-config="table">${currentTables().map((table) => `<option value="${escapeHtml(table.tableId)}" ${table.tableId === value ? 'selected' : ''}>${escapeHtml(table.label)} · ${escapeHtml(table.role)}</option>`).join('')}</select>`;
    } else if (spec.kind === 'select') control = `<select data-config="${spec.id}">${spec.options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? 'selected' : ''}>${escapeHtml(displayOperator(option))}</option>`).join('')}</select>`;
    else if (spec.kind === 'field') {
      const tableId = node.blockId === 'source' && spec.id === 'ownerFieldId'
        ? node.config?.table
        : ['lookup', 'map_lookup'].includes(node.blockId) && ['lookupFieldId', 'returnFieldId'].includes(spec.id)
          ? node.config?.table
          : node.blockId === 'map_lookup' && spec.id === 'sourceKeyFieldId' ? inputTableId(node) : null;
      const arithmeticField = node.blockId === 'map_arithmetic' && ['leftFieldId', 'rightFieldId'].includes(spec.id);
      control = `<select data-config="${spec.id}"><option value="">-- không dùng --</option>${sourceOptionGroups(value, arithmeticField ? inputTableId(node) : tableId, arithmeticField ? ['Money', 'Number', 'Percent'] : null, arithmeticField)}</select>`;
    }
    else control = `<input data-config="${spec.id}" data-kind="${spec.kind}" type="${spec.kind === 'number' || (node.blockId === 'map_arithmetic' && ['leftLiteral', 'rightLiteral'].includes(spec.id)) ? 'number' : 'text'}" step="any" value="${escapeHtml(Array.isArray(value) ? value.join(', ') : value ?? '')}">`;
    return `<label class="inspector-field">${escapeHtml(spec.label)}${control}</label>`;
  }

  function sourceOptionGroups(selected, tableId, expectedType, includeDerived) {
    const groups = currentTables().filter((sheet) => !tableId || sheet.tableId === tableId).map((sheet) => {
      const options = sheet.fields.filter((field) => matchesExpectedType(field.type, expectedType)).map((field) => `<option value="${escapeHtml(field.id)}" ${field.id === selected ? 'selected' : ''}>${escapeHtml(`${sheet.name} · ${field.header}`)}</option>`).join('');
      return options ? `<optgroup label="${escapeHtml(sheet.label)} · ${escapeHtml(sheet.role)}">${options}</optgroup>` : '';
    }).join('');
    if (tableId && !includeDerived) return groups;
    const derived = derivedFields().filter((field) => matchesExpectedType(field.type, expectedType)).map((field) => `<option value="${escapeHtml(field.id)}" ${field.id === selected ? 'selected' : ''}>${escapeHtml(field.label)}</option>`).join('');
    return `${groups}${derived ? `<optgroup label="Cột phái sinh">${derived}</optgroup>` : ''}`;
  }

  function matchesExpectedType(actual, expected) {
    if (!expected || expected === 'Any') return true;
    return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
  }

  function onInspectorChange(event) {
    const node = currentNode();
    if (!node) return;
    if (event.target.dataset.nodeLabel !== undefined) {
      node.meta = Object.assign({}, node.meta || {});
      node.meta.canvas = Object.assign({}, node.meta.canvas || {}, { label: event.target.value.trim() });
      renderNodeList();
      return;
    }
    if (event.target.dataset.port) {
      const [kind, ...rest] = event.target.value.split(':');
      const value = rest.join(':');
      if (!kind) delete node.inputs[event.target.dataset.port];
      else if (kind === 'node') node.inputs[event.target.dataset.port] = { kind, nodeId: value };
      else if (kind === 'field') node.inputs[event.target.dataset.port] = { kind, fieldId: value };
      else node.inputs[event.target.dataset.port] = { kind, type: value, value: value === 'Boolean' ? false : value === 'Text' ? '' : 0 };
      syncRecipeOutput(currentRecipe());
      renderBuilder();
      return;
    }
    if (event.target.dataset.literalPort) updateLiteral(event.target, node);
    else applyInspectorValue(event.target, node);
    if (node.blockId === 'map_arithmetic' && ['leftMode', 'rightMode'].includes(event.target.dataset.config)) renderInspector();
    if (event.target.dataset.config === 'table') {
      if (node.blockId === 'source') node.config.ownerFieldId = suggestJoinField(node.config.table) || '';
      if (['lookup', 'map_lookup'].includes(node.blockId)) {
        const table = currentTables().find((item) => item.tableId === node.config.table);
        node.config.lookupFieldId = table?.keyFieldId || fieldsForTable(node.config.table)[0]?.id || '';
        node.config.returnFieldId = fieldsForTable(node.config.table).find((field) => field.id !== node.config.lookupFieldId)?.id || node.config.lookupFieldId;
        node.config.returnType = currentFields().find((field) => field.id === node.config.returnFieldId)?.type || 'Any';
      }
      renderInspector();
    }
    if (['lookup', 'map_lookup'].includes(node.blockId)) V3.syncPresetRelations(state.preset);
    if (['lookup', 'map_lookup'].includes(node.blockId) && event.target.dataset.config === 'returnFieldId') {
      node.config.returnType = currentFields().find((field) => field.id === node.config.returnFieldId)?.type || node.config.returnType || 'Any';
      renderInspector();
    }
    renderNodeList();
    renderValidation();
    validateRun();
  }

  function onInspectorInput(event) {
    const node = currentNode();
    if (!node) return;
    if (event.target.dataset.nodeLabel !== undefined) {
      node.meta = Object.assign({}, node.meta || {});
      node.meta.canvas = Object.assign({}, node.meta.canvas || {}, { label: event.target.value });
    } else if (event.target.dataset.literalPort) updateLiteral(event.target, node);
    else applyInspectorValue(event.target, node);
    renderNodeList();
    renderValidation();
  }

  function updateLiteral(target, node) {
    const ref = node.inputs[target.dataset.literalPort];
    if (!ref) return;
    ref.value = ['Money', 'Number', 'Percent'].includes(ref.type) ? Number(target.value || 0) : ref.type === 'Boolean' ? target.value === 'true' : target.value;
  }

  function applyInspectorValue(target, node) {
    const key = target.dataset.config;
    if (!key) return;
    if (target.dataset.kind === 'numberList') node.config[key] = target.value.split(/[;,]/).map((item) => Number(item.trim())).filter(Number.isFinite);
    else if (target.dataset.kind === 'number') node.config[key] = Number(target.value || 0);
    else node.config[key] = target.value;
  }

  function formulaReadiness() {
    const errors = [];
    syncAllRecipeOutputs();
    if (!state.sourceSchema) errors.push('Chưa có schema workbook.');
    if (['new', 'mismatch', 'waiting', 'empty'].includes(state.compatibility)) errors.push(state.compatibility === 'mismatch' ? 'Header lệch preset, phải ướm lại trước.' : 'Schema chưa được ướm với preset.');
    const bindingValidation = V3.validateBindings(state.sourceSchema, state.preset.bindings);
    errors.push(...bindingValidation.errors);
    for (const recipe of state.preset.recipes || []) {
      const closure = Canvas.closureMessage(recipe);
      if (closure) errors.push(`${recipe.name}: ${closure}`);
    }
    const validation = V3.validatePreset(state.preset, currentFields());
    errors.push(...validation.errors.map((item) => item.message));
    if (!state.preset.recipes.length) errors.push('Preset chưa có recipe.');
    return { valid: errors.length === 0, errors: Array.from(new Set(errors)), validation, bindingValidation };
  }

  function renderValidation() {
    const readiness = formulaReadiness();
    setStatus(els.formulaErrors, readiness.valid
      ? { kind: 'success', icon: '✓', title: 'Preset hợp lệ', detail: `${state.preset.recipes.length} recipe · ${currentTables().length} bảng · chủ thể ${V3.subjectTable(state.sourceSchema)?.label || ''}.` }
      : { kind: 'danger', icon: '!', title: `${readiness.errors.length} lỗi chặn`, detail: readiness.errors[0] });
    els.savePreset.disabled = !readiness.valid;
    const disabledReason = readiness.valid ? '' : `Chưa thể lưu: ${readiness.errors[0]}`;
    els.savePreset.title = disabledReason || 'Tải preset JSON để backup hoặc chia sẻ.';
    els.savePresetReason.textContent = disabledReason;
    els.savePresetReason.hidden = readiness.valid;
  }

  function onLibraryDrop(event) {
    event.preventDefault();
    const blockId = event.dataTransfer.getData('application/x-incal-block');
    if (blockId) {
      const raw = canvasPointFromClient(event.clientX, event.clientY);
      addBlock(blockId, { x: Canvas.snap(raw.x), y: Canvas.snap(raw.y) });
    }
  }

  function prepareRecipeLayouts(preset) {
    for (const recipe of preset?.recipes || []) Canvas.ensureLayout(recipe);
  }

  function syncRecipeOutput(recipe) {
    return Canvas.syncOutput(recipe, (node, value) => {
      const type = outputTypeForNode(node, value);
      return type && type !== 'Any' ? type : value.output?.type;
    });
  }

  function syncAllRecipeOutputs() {
    for (const recipe of state.preset.recipes || []) syncRecipeOutput(recipe);
  }

  function graphStatusText(recipe) {
    if (!recipe?.nodes?.length) return 'Kéo khối vào canvas';
    const sinks = Canvas.sinkNodeIds(recipe);
    if (sinks.length === 1) return `${recipe.nodes.length} khối · ${Canvas.connections(recipe).length} kết nối · đã khép`;
    return Canvas.closureMessage(recipe);
  }

  function categorySlug(category) {
    const value = String(category || 'khac').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (value.includes('nguon')) return 'source';
    if (value.includes('du lieu')) return 'data';
    if (value.includes('tinh')) return 'math';
    if (value.includes('logic')) return 'logic';
    return 'macro';
  }

  function nextNodePosition(recipe) {
    const index = recipe?.nodes?.length || 0;
    const viewCenter = canvasPointFromClient(
      els.formulaCanvas.getBoundingClientRect().left + els.formulaCanvas.clientWidth / 2,
      els.formulaCanvas.getBoundingClientRect().top + els.formulaCanvas.clientHeight / 2
    );
    return { x: Canvas.snap(viewCenter.x + (index % 3) * Canvas.GRID), y: Canvas.snap(viewCenter.y + (index % 4) * Canvas.GRID) };
  }

  function arrangeCurrentRecipe() {
    const recipe = currentRecipe();
    if (!recipe?.nodes?.length) return;
    Canvas.autoArrange(recipe);
    state.canvasPan = { x: 0, y: 0 };
    state.canvasZoom = 1;
    renderBuilder();
    requestAnimationFrame(fitCanvas);
    toast('Đã tự xếp graph từ trái sang phải.');
  }

  function applyCanvasPan() {
    if (!els.canvasWorld || !els.formulaCanvas) return;
    state.canvasZoom = Math.max(Canvas.MIN_FIT_ZOOM || Canvas.MIN_ZOOM, Math.min(Canvas.MAX_ZOOM, Number(state.canvasZoom) || 1));
    els.canvasWorld.style.transform = `translate(${state.canvasPan.x}px, ${state.canvasPan.y}px) scale(${state.canvasZoom})`;
    els.formulaCanvas.style.backgroundPosition = `${state.canvasPan.x}px ${state.canvasPan.y}px`;
    els.formulaCanvas.style.backgroundSize = `${Canvas.GRID * state.canvasZoom}px ${Canvas.GRID * state.canvasZoom}px`;
    if (els.zoomLabel) els.zoomLabel.textContent = `${Math.round(state.canvasZoom * 100)}%`;
  }

  function canvasPointFromClient(clientX, clientY) {
    const rect = els.formulaCanvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.canvasPan.x) / state.canvasZoom,
      y: (clientY - rect.top - state.canvasPan.y) / state.canvasZoom
    };
  }

  function setCanvasZoom(value, clientPoint) {
    const rect = els.formulaCanvas.getBoundingClientRect();
    const anchor = clientPoint
      ? { x: clientPoint.x - rect.left, y: clientPoint.y - rect.top }
      : { x: rect.width / 2, y: rect.height / 2 };
    const camera = Canvas.zoomAt({ x: state.canvasPan.x, y: state.canvasPan.y, zoom: state.canvasZoom }, value, anchor);
    state.canvasPan = { x: camera.x, y: camera.y };
    state.canvasZoom = camera.zoom;
    applyCanvasPan();
    requestAnimationFrame(drawConnections);
    return camera;
  }

  function fitCanvas() {
    const recipe = currentRecipe();
    if (!recipe?.nodes?.length || !els.formulaCanvas.clientWidth) return;
    const camera = Canvas.fitCamera(recipe, { width: els.formulaCanvas.clientWidth, height: els.formulaCanvas.clientHeight });
    state.canvasPan = { x: camera.x, y: camera.y };
    state.canvasZoom = camera.zoom;
    applyCanvasPan();
    requestAnimationFrame(drawConnections);
  }

  function onCanvasWheel(event) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const next = state.canvasZoom * Math.exp(-event.deltaY * 0.0015);
    setCanvasZoom(next, { x: event.clientX, y: event.clientY });
  }

  function portWorldPoint(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const world = els.canvasWorld.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2 - world.left) / state.canvasZoom,
      y: (rect.top + rect.height / 2 - world.top) / state.canvasZoom
    };
  }

  function findNodeElement(nodeId) {
    return Array.from(els.nodeList.querySelectorAll('.graph-node')).find((item) => item.dataset.nodeId === nodeId) || null;
  }

  function findInputElement(nodeId, portId) {
    return Array.from(els.nodeList.querySelectorAll('.graph-input-port')).find((item) => item.dataset.inputNode === nodeId && item.dataset.portId === portId) || null;
  }

  function drawConnections() {
    const recipe = currentRecipe();
    if (!els.edgeLayer) return;
    if (!recipe?.nodes?.length) {
      els.edgeLayer.innerHTML = '';
      els.ghostEdge?.setAttribute('hidden', '');
      return;
    }
    const validation = V3.validateRecipe(recipe, currentFields());
    els.edgeLayer.innerHTML = Canvas.connections(recipe).map((edge) => {
      const source = findNodeElement(edge.sourceId)?.querySelector('.graph-output-port .port-dot');
      const target = findInputElement(edge.targetId, edge.portId)?.querySelector('.port-dot');
      const path = Canvas.bezierPath(portWorldPoint(source), portWorldPoint(target));
      const invalid = validation.errors.some((item) => item.nodeId === edge.targetId && item.portId === edge.portId);
      const data = `data-edge-source="${escapeHtml(edge.sourceId)}" data-edge-target="${escapeHtml(edge.targetId)}" data-edge-port="${escapeHtml(edge.portId)}"`;
      const start = portWorldPoint(source);
      const end = portWorldPoint(target);
      return path ? `<g class="graph-edge-group ${invalid ? 'invalid' : ''}" ${data}><path class="graph-edge-visual ${invalid ? 'invalid' : ''}" d="${path}" marker-end="url(#graphArrow)"></path><path class="graph-edge-hit" d="${path}" ${data}></path><circle class="edge-endpoint edge-source-endpoint" cx="${start.x}" cy="${start.y}" r="7" data-edge-end="source" ${data}></circle><circle class="edge-endpoint edge-target-endpoint" cx="${end.x}" cy="${end.y}" r="7" data-edge-end="target" ${data}></circle></g>` : '';
    }).join('');
  }

  function onEdgePointerDown(event) {
    const endpoint = event.target.closest('.edge-endpoint');
    if (!endpoint || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const edge = { sourceId: endpoint.dataset.edgeSource, targetId: endpoint.dataset.edgeTarget, portId: endpoint.dataset.edgePort };
    if (endpoint.dataset.edgeEnd === 'target') beginEdgeTargetRetarget(event, edge);
    else beginEdgeSourceRetarget(event, edge);
  }

  function beginEdgeTargetRetarget(event, edge) {
    const source = findNodeElement(edge.sourceId)?.querySelector('.graph-output-port');
    if (!source) return;
    startConnectionDrag(event, {
      sourceId: edge.sourceId,
      outputType: source.dataset.outputType,
      start: portWorldPoint(source.querySelector('.port-dot')),
      original: { targetId: edge.targetId, portId: edge.portId }
    });
  }

  function beginEdgeSourceRetarget(event, edge) {
    const target = findInputElement(edge.targetId, edge.portId)?.querySelector('.port-dot');
    if (!target) return;
    state.connectionDrag = {
      mode: 'source',
      original: { targetId: edge.targetId, portId: edge.portId },
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      portId: edge.portId,
      fixedTarget: portWorldPoint(target),
      target: null,
      verdict: null
    };
    els.ghostEdge.removeAttribute('hidden');
    els.ghostEdge.setAttribute('d', Canvas.bezierPath(canvasPointFromClient(event.clientX, event.clientY), state.connectionDrag.fixedTarget));
    els.formulaCanvas.classList.add('connecting');
    showOutputCandidates(edge.targetId, edge.portId, edge);
    updateConnectionCursor(event, null);
    document.addEventListener('pointermove', onSourceReconnectMove);
    document.addEventListener('pointerup', endSourceReconnect, { once: true });
  }

  function showOutputCandidates(targetId, portId, original) {
    for (const output of els.nodeList.querySelectorAll('.graph-output-port')) {
      const verdict = connectionVerdict(output.dataset.outputNode, targetId, portId, original);
      output.classList.toggle('candidate-valid', verdict.valid);
    }
  }

  function outputPortAt(clientX, clientY) {
    const direct = document.elementFromPoint(clientX, clientY)?.closest('.graph-output-port');
    if (direct) return direct;
    return Array.from(els.nodeList.querySelectorAll('.graph-output-port')).find((port) => {
      const rect = port.getBoundingClientRect();
      return clientX >= rect.left - 8 && clientX <= rect.right + 8 && clientY >= rect.top - 8 && clientY <= rect.bottom + 8;
    }) || null;
  }

  function onSourceReconnectMove(event) {
    const drag = state.connectionDrag;
    if (!drag || drag.mode !== 'source') return;
    const output = outputPortAt(event.clientX, event.clientY);
    const verdict = output ? connectionVerdict(output.dataset.outputNode, drag.targetId, drag.portId, drag.original) : null;
    drag.target?.classList.remove('drop-valid', 'drop-invalid');
    drag.target = output;
    drag.verdict = verdict;
    if (output) output.classList.add(verdict?.valid ? 'drop-valid' : 'drop-invalid');
    els.ghostEdge.classList.toggle('invalid', Boolean(output && !verdict?.valid));
    const start = output ? portWorldPoint(output.querySelector('.port-dot')) : canvasPointFromClient(event.clientX, event.clientY);
    els.ghostEdge.setAttribute('d', Canvas.bezierPath(start, drag.fixedTarget));
    updateConnectionCursor(event, verdict);
  }

  function endSourceReconnect() {
    document.removeEventListener('pointermove', onSourceReconnectMove);
    const drag = state.connectionDrag;
    const sourceId = drag?.target?.dataset.outputNode;
    clearConnectionGesture();
    if (!drag?.target) return;
    if (!drag.verdict?.valid) { toast(drag.verdict?.message || 'Không thể đổi đầu kết nối.', true); return; }
    commitConnection(sourceId, drag.targetId, drag.portId, drag.original);
  }

  function onCanvasNodePointerDown(event) {
    const output = event.target.closest('.graph-output-port');
    if (output) {
      event.preventDefault();
      event.stopPropagation();
      beginConnectionDrag(event, output);
      return;
    }
    const input = event.target.closest('.graph-input-port.connected');
    if (input && event.button === 0) {
      event.preventDefault();
      event.stopPropagation();
      beginInputRetarget(event, input);
      return;
    }
    const resize = event.target.closest('.node-resize-handle');
    if (resize && event.button === 0) {
      const card = resize.closest('.graph-node');
      const node = currentRecipe()?.nodes.find((item) => item.id === card?.dataset.nodeId);
      if (!node) return;
      event.preventDefault();
      event.stopPropagation();
      state.nodeResize = { node, card, clientX: event.clientX, width: Canvas.nodeWidth(node) };
      card.classList.add('resizing');
      document.addEventListener('pointermove', onNodeResizeMove);
      document.addEventListener('pointerup', endNodeResize, { once: true });
      return;
    }
    if (event.button !== 0 || event.target.closest('button,input,select,textarea,a')) return;
    const card = event.target.closest('.graph-node');
    if (!card) return;
    const node = currentRecipe()?.nodes.find((item) => item.id === card.dataset.nodeId);
    const start = Canvas.position(node);
    if (!node || !start) return;
    event.preventDefault();
    event.stopPropagation();
    state.selectedNodeId = node.id;
    state.nodeDrag = { node, card, clientX: event.clientX, clientY: event.clientY, x: start.x, y: start.y };
    card.classList.add('dragging');
    document.addEventListener('pointermove', onCanvasNodeMove);
    document.addEventListener('pointerup', endCanvasNodeMove, { once: true });
  }

  function onNodeResizeMove(event) {
    const resize = state.nodeResize;
    if (!resize) return;
    const width = Canvas.setNodeWidth(resize.node, resize.width + (event.clientX - resize.clientX) / state.canvasZoom);
    resize.card.style.width = `${width}px`;
    drawConnections();
  }

  function endNodeResize() {
    document.removeEventListener('pointermove', onNodeResizeMove);
    state.nodeResize?.card.classList.remove('resizing');
    state.nodeResize = null;
    renderNodeList();
    requestAnimationFrame(drawConnections);
  }

  function onCanvasNodeMove(event) {
    const drag = state.nodeDrag;
    if (!drag) return;
    const point = Canvas.setPosition(drag.node, drag.x + (event.clientX - drag.clientX) / state.canvasZoom, drag.y + (event.clientY - drag.clientY) / state.canvasZoom);
	drag.moved = drag.moved || point.x !== drag.x || point.y !== drag.y;
    drag.card.style.left = `${point.x}px`;
    drag.card.style.top = `${point.y}px`;
    drawConnections();
  }

  function endCanvasNodeMove() {
    document.removeEventListener('pointermove', onCanvasNodeMove);
    const moved = state.nodeDrag?.moved;
    state.nodeDrag?.card.classList.remove('dragging');
    state.nodeDrag = null;
    if (moved) {
      renderNodeList();
      renderInspector();
    } else markSelectedNode();
    requestAnimationFrame(drawConnections);
  }

  function beginConnectionDrag(event, output) {
    const sourceId = output.dataset.outputNode;
    const start = portWorldPoint(output.querySelector('.port-dot'));
    startConnectionDrag(event, { sourceId, outputType: output.dataset.outputType, start, original: null });
  }

  function beginInputRetarget(event, input) {
    const recipe = currentRecipe();
    const target = recipe?.nodes.find((node) => node.id === input.dataset.inputNode);
    const ref = target?.inputs?.[input.dataset.portId];
    if (ref?.kind !== 'node') return;
    const source = findNodeElement(ref.nodeId)?.querySelector('.graph-output-port');
    if (!source) return;
    startConnectionDrag(event, {
      sourceId: ref.nodeId,
      outputType: source.dataset.outputType,
      start: portWorldPoint(source.querySelector('.port-dot')),
      original: { targetId: target.id, portId: input.dataset.portId }
    });
  }

  function startConnectionDrag(event, details) {
    state.connectionDrag = { ...details, target: null, verdict: null };
    els.ghostEdge.removeAttribute('hidden');
    els.ghostEdge.setAttribute('d', Canvas.bezierPath(details.start, canvasPointFromClient(event.clientX, event.clientY)));
    els.formulaCanvas.classList.add('connecting');
    showConnectionCandidates(details.sourceId, details.original);
    updateConnectionCursor(event, null);
    document.addEventListener('pointermove', onConnectionMove);
    document.addEventListener('pointerup', endConnectionDrag, { once: true });
  }

  function onConnectionMove(event) {
    const drag = state.connectionDrag;
    if (!drag) return;
    const target = inputPortAt(event.clientX, event.clientY);
    const verdict = target ? connectionVerdict(drag.sourceId, target.dataset.inputNode, target.dataset.portId, drag.original) : null;
    drag.target?.classList.remove('drop-valid', 'drop-invalid');
    drag.target = target;
    drag.verdict = verdict;
    if (target) target.classList.add(verdict?.valid ? 'drop-valid' : 'drop-invalid');
    els.ghostEdge.classList.toggle('invalid', Boolean(target && !verdict?.valid));
    const end = target ? portWorldPoint(target.querySelector('.port-dot')) : canvasPointFromClient(event.clientX, event.clientY);
    els.ghostEdge.setAttribute('d', Canvas.bezierPath(drag.start, end));
    updateConnectionCursor(event, verdict);
  }

  function showConnectionCandidates(sourceId, original) {
    for (const input of els.nodeList.querySelectorAll('.graph-input-port')) {
      const verdict = connectionVerdict(sourceId, input.dataset.inputNode, input.dataset.portId, original);
      input.classList.toggle('candidate-valid', verdict.valid);
    }
  }

  function clearConnectionCandidates() {
    for (const input of els.nodeList.querySelectorAll('.graph-input-port')) input.classList.remove('candidate-valid', 'drop-valid', 'drop-invalid');
    for (const output of els.nodeList.querySelectorAll('.graph-output-port')) output.classList.remove('candidate-valid', 'drop-valid', 'drop-invalid');
  }

  function clearConnectionGesture() {
    state.connectionDrag?.target?.classList.remove('drop-valid', 'drop-invalid');
    clearConnectionCandidates();
    els.formulaCanvas.classList.remove('connecting');
    els.ghostEdge.setAttribute('hidden', '');
    els.ghostEdge.classList.remove('invalid');
    els.connectionCursor.hidden = true;
    state.connectionDrag = null;
  }

  function updateConnectionCursor(event, verdict) {
    els.connectionCursor.hidden = false;
    els.connectionCursor.style.left = `${event.clientX}px`;
    els.connectionCursor.style.top = `${event.clientY}px`;
    els.connectionCursor.className = `connection-cursor ${verdict ? verdict.valid ? 'valid' : 'invalid' : ''}`;
    els.connectionCursor.querySelector('span').textContent = verdict ? verdict.valid ? 'Thả để nối' : 'Không hợp lệ' : `Nối ${state.connectionDrag?.outputType || ''}`;
  }

  function inputPortAt(clientX, clientY) {
    const direct = document.elementFromPoint(clientX, clientY)?.closest('.graph-input-port');
    if (direct) return direct;
    return Array.from(els.nodeList.querySelectorAll('.graph-input-port')).find((port) => {
      const rect = port.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }) || null;
  }

  function endConnectionDrag() {
    document.removeEventListener('pointermove', onConnectionMove);
    const drag = state.connectionDrag;
    clearConnectionGesture();
    if (!drag?.target) return;
    if (!drag.verdict?.valid) { toast(drag.verdict?.message || 'Không thể nối hai cổng này.', true); return; }
    commitConnection(drag.sourceId, drag.target.dataset.inputNode, drag.target.dataset.portId, drag.original);
  }

  function connectionVerdict(sourceId, targetId, portId, original) {
    const recipe = currentRecipe();
    if (!recipe) return { valid: false, message: 'Chưa có recipe.' };
    if (sourceId === targetId) return { valid: false, message: 'Một khối không thể tự nối vào chính nó.' };
    const source = recipe.nodes.find((node) => node.id === sourceId);
    const target = recipe.nodes.find((node) => node.id === targetId);
    const port = V3.getBlock(target?.blockId)?.inputs?.find((item) => item.id === portId);
    if (!source || !target || !port) return { valid: false, message: 'Cổng nối không còn tồn tại.' };
    const trial = V3.clone(recipe);
    if (original) {
      const originalTarget = trial.nodes.find((node) => node.id === original.targetId);
      if (originalTarget?.inputs) delete originalTarget.inputs[original.portId];
    }
    const trialTarget = trial.nodes.find((node) => node.id === targetId);
    trialTarget.inputs[portId] = { kind: 'node', nodeId: sourceId };
    const validation = V3.validateRecipe(trial, currentFields());
    const blocking = validation.errors.find((item) => item.code === 'CYCLE' || (item.nodeId === targetId && item.portId === portId && item.code === 'TYPE_MISMATCH'));
    return blocking ? { valid: false, message: blocking.message } : { valid: true, message: '' };
  }

  function commitConnection(sourceId, targetId, portId, original) {
    const verdict = connectionVerdict(sourceId, targetId, portId, original);
    if (!verdict.valid) { toast(verdict.message, true); return false; }
    const recipe = currentRecipe();
    if (original) {
      const originalTarget = recipe.nodes.find((node) => node.id === original.targetId);
      if (originalTarget?.inputs) delete originalTarget.inputs[original.portId];
    }
    const target = recipe.nodes.find((node) => node.id === targetId);
    target.inputs[portId] = { kind: 'node', nodeId: sourceId };
    syncRecipeOutput(recipe);
    state.selectedNodeId = targetId;
    renderBuilder();
    return true;
  }

  function onCanvasPanStart(event) {
    if (event.button !== 0 || event.target.closest('.graph-node,.canvas-toolbar,.canvas-help')) return;
    event.preventDefault();
    state.panDrag = { clientX: event.clientX, clientY: event.clientY, x: state.canvasPan.x, y: state.canvasPan.y };
    els.formulaCanvas.classList.add('panning');
    document.addEventListener('pointermove', onCanvasPanMove);
    document.addEventListener('pointerup', endCanvasPan, { once: true });
  }

  function onCanvasPanMove(event) {
    const drag = state.panDrag;
    if (!drag) return;
    state.canvasPan = { x: drag.x + event.clientX - drag.clientX, y: drag.y + event.clientY - drag.clientY };
    applyCanvasPan();
  }

  function endCanvasPan() {
    document.removeEventListener('pointermove', onCanvasPanMove);
    state.panDrag = null;
    els.formulaCanvas.classList.remove('panning');
  }

  function bindRun() {
    els.calculationSubject.addEventListener('change', () => changeCalculationSubject(els.calculationSubject.value));
    els.quarterInput.addEventListener('input', () => {
      els.metricQuarter.textContent = els.quarterInput.value;
      if (state.report) state.report.quarter = els.quarterInput.value;
    });
    els.calculateButton.addEventListener('click', calculateReport);
    els.resultsBody.addEventListener('click', (event) => {
      const index = Number(event.target.dataset.personIndex);
      if (!Number.isInteger(index) || !state.report) return;
      if (event.target.dataset.action === 'trace') openTrace(index);
      if (event.target.dataset.action === 'pdf') Export.writePersonPdf(state.report, index);
    });
    els.closeTrace.addEventListener('click', () => els.traceDialog.close());
    els.exportBk.addEventListener('click', () => Export.writeBk(state.report));
    els.componentExportButtons.addEventListener('click', (event) => {
      const button = event.target.closest('[data-export-component]');
      if (button && state.report) Export.writeComponentGroup(state.report, button.dataset.exportComponent);
    });
    els.exportJobJson.addEventListener('click', () => Export.saveJobJson(state.report));
    els.exportReportJson.addEventListener('click', () => Export.saveReportJson(state.report));
  }

  function validateRun() {
    const errors = [];
    state.input = null;
    const readiness = formulaReadiness();
    errors.push(...readiness.errors);
    if (!state.workbook) errors.unshift('Chưa nạp workbook cho kỳ này.');
    if (!errors.length) {
      try {
        state.input = V3.materializeWorkbook(state.workbook, state.sourceSchema, state.preset.bindings, XLSX);
        if (!state.input.roster.length) errors.push(`Bảng chủ thể "${state.input.subjectLabel}" không có dòng dữ liệu.`);
      } catch (error) { errors.push(error.message); }
    }
    state.runErrors = Array.from(new Set(errors));
    renderRun();
    return state.runErrors.length === 0;
  }

  function renderRun() {
    const ready = state.runErrors.length === 0 && state.input;
    setStatus(els.runGate, ready
      ? { kind: 'success', icon: '✓', title: 'Sẵn sàng tính', detail: `${state.input.roster.length} dòng chủ thể "${state.input.subjectLabel}" · ${Object.keys(state.input.tables || {}).length} bảng · schema ${state.compatibility === 'exact' ? 'tự ướm' : 'đã xác nhận'}.` }
      : { kind: state.compatibility === 'mismatch' ? 'danger' : 'neutral', icon: state.compatibility === 'mismatch' ? '!' : '○', title: 'Chưa sẵn sàng', detail: state.runErrors[0] || 'Nạp workbook và hoàn tất preset.' });
    els.runIssues.innerHTML = state.runErrors.slice(1).map((message) => `<div class="issue">${escapeHtml(message)}</div>`).join('');
    els.calculateButton.disabled = !ready;
    els.metricQuarter.textContent = els.quarterInput.value;
    els.metricPeople.textContent = state.input?.roster?.length || 0;
    els.metricJobs.textContent = Object.keys(state.input?.tables || {}).length;
    els.metricSchema.textContent = state.compatibility === 'exact' ? 'AUTO' : state.compatibility === 'adopted' ? 'OK' : '—';
    els.metricErrors.textContent = state.runErrors.length;
  }

  function calculateReport() {
    if (!validateRun()) { toast(state.runErrors[0], true); return null; }
    const result = V3.runPreset(state.preset, Object.assign({ quarter: els.quarterInput.value }, state.input));
    if (!result.validation.valid) { toast(result.validation.errors[0]?.message || 'Preset không hợp lệ.', true); return result; }
    state.report = result;
    renderResults();
    toast(`Đã tính ${result.per_person.length} dòng chủ thể. Kết quả có trace theo bảng và khối.`);
    return result;
  }

  function renderResults() {
    const people = state.report?.per_person || [];
    const columns = Export.resultColumns(state.report || state.preset);
    els.resultsEmpty.hidden = people.length > 0;
    els.resultSummary.textContent = people.length ? `${people.length} dòng · ${vnd(state.report.totals.netPay)}` : 'Chưa tính';
    els.resultsHead.innerHTML = `<th>Chủ thể</th>${columns.map((column) => `<th class="numeric">${escapeHtml(column.label)}</th>`).join('')}<th class="numeric">Thực nhận</th><th>Chi tiết</th>`;
    els.resultsBody.innerHTML = people.map((person, index) => {
      const componentCells = columns.map((column) => {
        const amount = Export.componentValue(person, column);
        return `<td class="numeric ${amount < 0 ? 'negative' : ''}">${amount < 0 ? `−${money(Math.abs(amount))}` : money(amount)}</td>`;
      }).join('');
      return `<tr><td><strong>${escapeHtml(person.name)}</strong><br><small>${escapeHtml(person.code)}</small></td>${componentCells}<td class="numeric net">${money(person.netPay)}</td><td><button class="trace-button" data-action="trace" data-person-index="${index}" title="Xem cách tính">Giải thích</button> <button class="trace-button" data-action="pdf" data-person-index="${index}" title="In PDF">PDF</button></td></tr>`;
    }).join('');
    renderComponentExportButtons();
    [els.exportBk, els.exportJobJson, els.exportReportJson].forEach((button) => { button.disabled = !people.length; });
  }

  function renderComponentExportButtons() {
    const groups = state.report ? Export.incomeGroups(state.report) : [];
    els.componentExportButtons.innerHTML = groups.map((group) => `<button class="button secondary" type="button" data-export-component="${escapeHtml(group.component)}" title="Xuất các chủ thể có khoản ${escapeHtml(group.label)}.">${escapeHtml(group.label)} · XLSX</button>`).join('');
  }

  function openTrace(index) {
    const person = state.report?.per_person?.[index];
    if (!person) return;
    els.traceTitle.textContent = `Giải thích · ${person.name}`;
    els.traceContent.innerHTML = (person.trace.components || []).map((component) => `<section class="trace-component"><header><strong>${escapeHtml(component.recipeName)}</strong><b>${money(component.amount)}</b></header>${component.nodes.map((node, step) => `<div class="trace-step"><span>${step + 1}</span><code>${escapeHtml(node.blockName)} · ${escapeHtml(node.nodeId)}${node.jobIds.length ? ` · jobs: ${escapeHtml(node.jobIds.join(', '))}` : ''}</code><strong>${formatTraceValue(node.value)}</strong></div>`).join('')}</section>`).join('') || '<div class="empty-state"><strong>Không có trace</strong></div>';
    els.traceDialog.showModal();
  }

  function bindDashboard() {
    els.reportFiles.addEventListener('change', async () => {
      const loaded = [];
      for (const file of els.reportFiles.files) {
        try {
          const report = JSON.parse(await readTextFile(file));
          if (!Array.isArray(report.per_person) || !report.totals) throw new Error(`${file.name} không phải Báo cáo đầy đủ JSON hợp lệ.`);
          loaded.push(report);
        } catch (error) { toast(error.message, true); }
      }
      state.reports = loaded;
      renderDashboard();
      els.reportFiles.value = '';
      if (loaded.length) toast(`Đã nạp ${loaded.length} report để tổng hợp YTD.`);
    });
  }

  function renderDashboard() {
    const summary = V3.summarizeReports(state.reports);
    els.dashReports.textContent = summary.reportCount;
    els.dashGross.textContent = compactVnd(summary.totals.gross);
    els.dashTax.textContent = compactVnd(summary.totals.tax);
    els.dashNet.textContent = compactVnd(summary.totals.netPay);
    els.dashPeopleCount.textContent = `${summary.people.length} người`;
    els.dashboardEmpty.hidden = summary.reportCount > 0;
    els.dashboardTableEmpty.hidden = summary.people.length > 0;
    els.dashboardPeople.innerHTML = summary.people.slice(0, 30).map((person) => `<tr><td><strong>${escapeHtml(person.name)}</strong><br><small>${escapeHtml(person.code)}</small></td><td>${escapeHtml(person.team || '—')}</td><td class="numeric net">${money(person.netPay)}</td><td><code class="quarter-list">${escapeHtml(Object.entries(person.byQuarter).map(([quarter, value]) => `${quarter}: ${money(value)}`).join(' · '))}</code></td></tr>`).join('');
    drawBarChart(els.quarterChart, summary.totalsByQuarter.map((row) => ({ label: row.quarter, value: row.netPay })), '#4d148c');
    drawBarChart(els.peopleChart, summary.people.slice(0, 8).map((person) => ({ label: person.name, value: person.netPay })), '#ff6200', true);
  }

  function drawBarChart(canvas, rows, color, horizontal) {
    const width = Math.max(320, canvas.parentElement.clientWidth || 640);
    const height = 300;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.font = '500 11px Montserrat';
    ctx.fillStyle = '#746c7c';
    if (!rows.length) return;
    const max = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
    const pad = horizontal ? { l: 116, r: 26, t: 18, b: 24 } : { l: 46, r: 18, t: 20, b: 48 };
    ctx.strokeStyle = '#e6e0e9';
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, height - pad.b);
    ctx.lineTo(width - pad.r, height - pad.b);
    ctx.stroke();
    if (horizontal) {
      const slot = (height - pad.t - pad.b) / rows.length;
      rows.forEach((row, index) => {
        const y = pad.t + index * slot + 5;
        const bar = (width - pad.l - pad.r) * Number(row.value || 0) / max;
        ctx.fillStyle = color;
        ctx.fillRect(pad.l, y, bar, Math.max(8, slot - 10));
        ctx.fillStyle = '#5b5262';
        ctx.textAlign = 'right';
        ctx.fillText(shorten(row.label, 15), pad.l - 8, y + Math.max(12, slot - 10) / 2 + 4);
      });
    } else {
      const slot = (width - pad.l - pad.r) / rows.length;
      const barWidth = Math.min(54, slot * .58);
      rows.forEach((row, index) => {
        const barHeight = (height - pad.t - pad.b) * Number(row.value || 0) / max;
        const x = pad.l + index * slot + (slot - barWidth) / 2;
        ctx.fillStyle = color;
        ctx.fillRect(x, height - pad.b - barHeight, barWidth, barHeight);
        ctx.fillStyle = '#5b5262';
        ctx.textAlign = 'center';
        ctx.fillText(row.label, x + barWidth / 2, height - pad.b + 19);
      });
    }
  }

  function renderAll() {
    renderInput();
    renderBlockLibrary();
    renderBuilder();
    validateRun();
    renderResults();
    renderDashboard();
  }

  function currentTables() { return state.sourceSchema?.sheets || state.preset.sourceSchema?.sheets || []; }
  function currentFields() { return baseSourceFields().concat(derivedFields()); }
  function baseSourceFields() { return V3.sourceFields(state.sourceSchema || state.preset.sourceSchema); }
  function fieldsForTable(tableId) { return currentFields().filter((field) => field.table === tableId); }
  function derivedFields() {
    return (state.preset?.recipes || []).flatMap((recipe) => {
      const result = [];
      const lookup = new Map(baseSourceFields().map((field) => [field.id, field]));
      for (const node of recipe.nodes || []) {
        if (node.blockId !== 'map_lookup') continue;
        const field = derivedFieldModel(recipe, node, node.config?.returnType || 'Any', 'Cột tra cứu');
        result.push(field);
        lookup.set(field.id, field);
      }
      let pending = (recipe.nodes || []).filter((node) => node.blockId === 'map_arithmetic');
      do {
        const before = pending.length;
        pending = pending.filter((node) => {
          const left = mapArithmeticOperandType(node, 'left', lookup);
          const right = mapArithmeticOperandType(node, 'right', lookup);
          if (!left || !right) return true;
          const field = derivedFieldModel(recipe, node, V3.mapArithmeticOutputType(left, right, node.config?.operator) || 'Any', 'Cột tính toán');
          result.push(field);
          lookup.set(field.id, field);
          return false;
        });
        if (pending.length === before) break;
      } while (pending.length);
      for (const node of pending) result.push(derivedFieldModel(recipe, node, 'Any', 'Cột tính toán'));
      return result;
    });
  }
  function derivedFieldModel(recipe, node, type, fallbackLabel) { return { id: node.config?.derivedFieldId || derivedFieldIdForNode(node.id), label: node.config?.derivedFieldLabel || fallbackLabel, type, table: `derived:${recipe.id}`, derived: true, sourceNodeId: node.id }; }
  function mapArithmeticOperandType(node, side, fields) { return node.config?.[`${side}Mode`] === 'literal' ? node.config?.[`${side}LiteralType`] || 'Number' : fields.get(node.config?.[`${side}FieldId`])?.type || null; }
  function isDerivedBlock(node) { return ['map_lookup', 'map_arithmetic'].includes(node?.blockId); }
  function derivedFieldIdForNode(nodeId) { return `derived:${String(nodeId || 'lookup')}`; }
  function inputTableId(node, seen) {
    const visited = seen || new Set();
    if (!node || visited.has(node.id)) return null;
    visited.add(node.id);
    if (node.blockId === 'source') return node.config?.table || null;
    const ref = node.inputs?.table;
    if (ref?.kind !== 'node') return null;
    return inputTableId(currentRecipe()?.nodes.find((candidate) => candidate.id === ref.nodeId), visited);
  }
  function suggestJoinField(tableId) {
    const subject = V3.subjectTable(state.sourceSchema || state.preset.sourceSchema);
    const subjectKey = currentFields().find((field) => field.id === subject?.keyFieldId);
    const fields = fieldsForTable(tableId);
    if (subjectKey) {
      const sameHeader = fields.find((field) => normalizeText(field.label) === normalizeText(subjectKey.label));
      if (sameHeader) return sameHeader.id;
    }
    return fields.find((field) => ['ma nv', 'ma nhan su', 'employee id', 'staff id', 'owner employee id'].includes(normalizeText(field.label)))?.id || '';
  }
  function setStatus(element, model) {
    element.className = `status-banner ${model.kind || 'neutral'}`;
    const icon = element.querySelector('.status-icon');
    const title = element.querySelector('strong');
    const detail = element.querySelector('p');
    if (icon) icon.textContent = model.icon || '○';
    if (title) title.textContent = model.title || '';
    if (detail) detail.textContent = model.detail || '';
  }
  function readTextFile(file) { if (!file) throw new Error('Chưa chọn file.'); return file.text(); }
  function downloadText(text, filename, type) { const blob = new Blob([text], { type: `${type};charset=utf-8` }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }
  function toast(message, isError) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.toggle('error', Boolean(isError)); els.toast.classList.add('show'); toastTimer = setTimeout(() => els.toast.classList.remove('show'), 3300); }
  function money(value) { return Math.round(Number(value || 0)).toLocaleString('vi-VN'); }
  function vnd(value) { return `${money(value)} VND`; }
  function compactVnd(value) { const number = Number(value || 0); if (Math.abs(number) >= 1e9) return `${(number / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`; if (Math.abs(number) >= 1e6) return `${(number / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`; return money(number); }
  function formatTraceValue(value) { return value && typeof value === 'object' ? `${value.rowCount ?? ''}${value.rowCount !== undefined ? ' dòng' : ''}` : money(value); }
  function shorten(value, max) { const text = String(value || ''); return text.length > max ? `${text.slice(0, max - 1)}…` : text; }
  function uniqueId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
  function uniqueNodeId(recipe, base) { let index = recipe.nodes.length + 1; let id = `${base}-${index}`; while (recipe.nodes.some((node) => node.id === id)) id = `${base}-${++index}`; return id; }
  function safeName(value) { return String(value || 'preset').replace(/[^a-z0-9_-]+/gi, '_'); }
  function humanizeFieldId(value) {
    const text = String(value ?? '');
    const match = text.match(/^source:([^:]+)::(.+)$/);
    if (!match) return text;
    return `${safeDecode(match[1])} · ${safeDecode(match[2])}`;
  }
  function humanizeTableId(value) { return safeDecode(String(value ?? '').replace(/^table:/, '')); }
  function safeDecode(value) { try { return decodeURIComponent(value); } catch (error) { return String(value ?? ''); } }
  function normalizeText(value) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
  function cssEscape(value) { return String(value ?? '').replace(/["\\]/g, '\\$&'); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
})();
