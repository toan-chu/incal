(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IncalV3 = Object.assign(root.IncalV3 || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCHEMA_VERSION = 3;
  const SOURCE_SCHEMA_VERSION = 2;
  const TYPES = Object.freeze({
    TABLE: 'Table', MONEY: 'Money', NUMBER: 'Number', PERCENT: 'Percent',
    TEXT: 'Text', BOOLEAN: 'Boolean', DATE: 'Date', ANY: 'Any'
  });

  // Canonical aliases are retained solely as the locked engine/export contract.
  // Formula fields come from the user-defined entities in sourceSchema.
  const FIELD_CATALOG = Object.freeze([
    field('roster.employee_id', 'Mã nhân sự', TYPES.TEXT, 'roster', true),
    field('roster.name', 'Họ tên', TYPES.TEXT, 'roster', true),
    field('roster.title', 'Title', TYPES.TEXT, 'roster', true),
    field('roster.salary_m1', 'Lương gross T1', TYPES.MONEY, 'roster', true),
    field('roster.salary_m2', 'Lương gross T2', TYPES.MONEY, 'roster', true),
    field('roster.salary_m3', 'Lương gross T3', TYPES.MONEY, 'roster', true),
    field('roster.start_month', 'Tháng vào', TYPES.NUMBER, 'roster', true),
    field('roster.end_month', 'Tháng nghỉ', TYPES.NUMBER, 'roster', true),
    field('roster.profile', 'Hồ sơ tính', TYPES.TEXT, 'roster', true),
    field('roster.has_labor_contract', 'Có HĐLĐ', TYPES.BOOLEAN, 'roster', true),
    field('roster.salary_quarter', 'Tổng lương quý', TYPES.MONEY, 'roster', false),
    field('roster.target_quarter', 'Target quý', TYPES.MONEY, 'roster', false),
    field('job.month', 'Tháng', TYPES.NUMBER, 'jobs', true),
    field('job.id', 'Mã job', TYPES.TEXT, 'jobs', true),
    field('job.owner_employee_id', 'Mã nhân sự phụ trách', TYPES.TEXT, 'jobs', true),
    field('job.customer', 'Khách hàng', TYPES.TEXT, 'jobs', true),
    field('job.product_group', 'Nhóm SP', TYPES.TEXT, 'jobs', true),
    field('job.product', 'Product', TYPES.TEXT, 'jobs', true),
    field('job.team', 'Team', TYPES.TEXT, 'jobs', true),
    field('job.revenue', 'Doanh thu', TYPES.MONEY, 'jobs', true),
    field('job.cost', 'Chi phí', TYPES.MONEY, 'jobs', true),
    field('job.cost_without_com', 'CP chưa có COM', TYPES.MONEY, 'jobs', true),
    field('job.com', 'COM', TYPES.MONEY, 'jobs', true),
    field('job.com_sms', 'COM SMS', TYPES.MONEY, 'jobs', true),
    field('job.no_invoice_cost', '20% CP không HĐ', TYPES.MONEY, 'jobs', true),
    field('job.penalty', 'Điều chỉnh/phạt job', TYPES.MONEY, 'jobs', true),
    field('job.adjustment_reason', 'Lý do điều chỉnh', TYPES.TEXT, 'jobs', true),
    field('job.total_cost', 'Tổng chi phí', TYPES.MONEY, 'jobs', true),
    field('job.gp', 'GP', TYPES.MONEY, 'jobs', true),
    field('job.payment_status', 'Trạng thái thu', TYPES.TEXT, 'jobs', true),
    field('job.paid_percent', '% đã thu', TYPES.PERCENT, 'jobs', true),
    field('job.posting_date', 'Posting date', TYPES.DATE, 'jobs', true),
    field('job.tier', 'Mức', TYPES.TEXT, 'jobs', true)
  ]);

  function field(id, label, type, table, input, source) {
    return Object.freeze({ id, label, type, table, input: Boolean(input), derived: !input, source: source || null });
  }

  function tableIdForSheet(sheet) {
    return `table:${encodeURIComponent(String(sheet))}`;
  }

  function sourceFieldId(sheet, header) {
    return `source:${encodeURIComponent(String(sheet))}::${encodeURIComponent(String(header))}`;
  }

  function createSourceField(sheet, header, type, tableId, columnIndex) {
    const resolvedTableId = tableId || tableIdForSheet(sheet);
    return field(
      sourceFieldId(sheet, header),
      String(header),
      type || TYPES.TEXT,
      resolvedTableId,
      true,
      { sheet: String(sheet), header: String(header), tableId: resolvedTableId, columnIndex: Number(columnIndex) }
    );
  }

  function normalizeSourceSchema(value) {
    if (!value) return null;
    const source = clone(value);
    const rawSheets = Array.isArray(source.sheets) ? source.sheets : [];
    const legacySubject = rawSheets.find((sheet) => sheet.role === 'roster');
    source.sourceSchemaVersion = SOURCE_SCHEMA_VERSION;
    source.sheets = rawSheets.map((sheet, index) => {
      const tableId = sheet.tableId || tableIdForSheet(sheet.name);
      const legacyRole = sheet.role;
      const role = ['roster', 'jobs', 'ignore'].includes(legacyRole)
        ? (legacyRole === 'roster' ? 'Chủ thể' : legacyRole === 'jobs' ? 'Giao dịch' : 'Tra cứu')
        : String(legacyRole || 'Nguồn');
      return Object.assign({}, sheet, {
        tableId,
        label: String(sheet.label || sheet.entityName || sheet.name || `Bảng ${index + 1}`),
        role,
        keyFieldId: String(sheet.keyFieldId || ''),
        fields: (sheet.fields || []).map((item) => Object.assign({}, item, {
          id: item.id || sourceFieldId(sheet.name, item.header)
        }))
      });
    });
    source.subjectTableId = source.subjectTableId
      || (legacySubject && tableIdForSheet(legacySubject.name))
      || source.sheets[0]?.tableId
      || '';
    source.relations = Array.isArray(source.relations) ? source.relations : [];
    return source;
  }

  function sourceFields(sourceSchema) {
    return (sourceSchema?.sheets || []).flatMap((sheet) => (sheet.fields || []).map((item) => createSourceField(
      sheet.name,
      item.header,
      item.type,
      sheet.tableId || tableIdForSheet(sheet.name),
      item.columnIndex
    )));
  }

  function tableById(sourceSchema, tableId) {
    return (sourceSchema?.sheets || []).find((sheet) => sheet.tableId === tableId) || null;
  }

  function subjectTable(sourceSchema) {
    return tableById(sourceSchema, sourceSchema?.subjectTableId);
  }

  function fieldMap(fields) {
    return new Map((fields || FIELD_CATALOG).map((item) => [item.id, item]));
  }

  function displayLabel(fieldId, preset, fields) {
    const item = fieldMap(fields).get(fieldId);
    return preset?.fieldLabels?.[fieldId] || item?.label || fieldId;
  }

  function createPreset(seed) {
    const input = seed || {};
    const rawSchema = input.sourceSchema || null;
    const legacyTables = new Map((rawSchema?.sheets || []).map((sheet) => [sheet.role, tableIdForSheet(sheet.name)]));
    const sourceSchema = normalizeSourceSchema(rawSchema);
    const bindings = clone(input.bindings || {});
    if (!bindings['subject.id'] && bindings['roster.employee_id']) bindings['subject.id'] = bindings['roster.employee_id'];
    if (!bindings['subject.name'] && bindings['roster.name']) bindings['subject.name'] = bindings['roster.name'];
    if (!bindings['subject.group'] && bindings['roster.profile']) bindings['subject.group'] = bindings['roster.profile'];
    const recipes = clone(input.recipes || []);
    for (const recipe of recipes) {
      for (const node of recipe.nodes || []) {
        if (!['source', 'lookup', 'map_lookup'].includes(node.blockId)) continue;
        const table = node.config?.table;
        if (legacyTables.has(table)) node.config.table = legacyTables.get(table);
      }
    }
    const preset = {
      schemaVersion: SCHEMA_VERSION,
      id: String(input.id || `PRESET-${Date.now()}`),
      name: String(input.name || 'Bộ công thức mới'),
      version: String(input.version || '1.0.0'),
      sourceSchema,
      bindings,
      fieldLabels: Object.assign({}, input.fieldLabels || {}),
      recipes
    };
    return syncPresetRelations(preset);
  }

  function syncPresetRelations(preset) {
    if (!preset?.sourceSchema) return preset;
    const relations = [];
    for (const recipe of preset.recipes || []) {
      for (const node of recipe.nodes || []) {
        if (!['lookup', 'map_lookup'].includes(node.blockId)) continue;
        relations.push({
          id: `${recipe.id}:${node.id}`,
          recipeId: recipe.id,
          nodeId: node.id,
          targetTableId: String(node.config?.table || ''),
          lookupFieldId: String(node.config?.lookupFieldId || ''),
          returnFieldId: String(node.config?.returnFieldId || ''),
          source: clone(node.blockId === 'map_lookup' ? node.inputs?.table || null : node.inputs?.key || null),
          sourceKeyFieldId: String(node.config?.sourceKeyFieldId || ''),
          derivedFieldId: String(node.config?.derivedFieldId || ''),
          derivedFieldLabel: String(node.config?.derivedFieldLabel || '')
        });
      }
    }
    preset.sourceSchema.relations = relations;
    return preset;
  }

  function createRecipe(seed) {
    const input = seed || {};
    const id = String(input.id || `RECIPE-${Date.now()}`);
    return {
      id,
      name: String(input.name || 'Công thức mới'),
      enabled: input.enabled !== false,
      scope: input.scope || 'person',
      component: input.component || 'incentive',
      nodes: clone(input.nodes || []),
      output: Object.assign({ nodeId: null, type: TYPES.MONEY, label: 'Kết quả' }, clone(input.output || {}))
    };
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  return {
    SCHEMA_VERSION, SOURCE_SCHEMA_VERSION, TYPES, FIELD_CATALOG,
    fieldMap, displayLabel, createPreset, createRecipe, clone,
    tableIdForSheet, tableById, subjectTable, normalizeSourceSchema, syncPresetRelations,
    sourceFieldId, createSourceField, sourceFields
  };
});
