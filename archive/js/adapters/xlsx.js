(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core/schema'));
  else root.IncalV3 = Object.assign(root.IncalV3 || {}, factory(root.IncalV3));
})(typeof self !== 'undefined' ? self : this, function (schema) {
  'use strict';

  const TYPE_OPTIONS = ['Text', 'Number', 'Money', 'Percent', 'Boolean', 'Date'];
  const BINDING_SPECS = Object.freeze([
    binding('subject.id', 'Mã chủ thể', true, ['ma nv', 'ma nhan su', 'employee id', 'staff id', 'ma job', 'job id', 'id']),
    binding('subject.name', 'Tên hiển thị', false, ['ho ten', 'ten nhan su', 'ten nhan vien', 'employee name', 'name', 'nhan vien', 'ma job']),
    binding('subject.group', 'Nhóm / vai trò', false, ['ho so', 'ho so tinh', 'profile', 'team', 'bo phan', 'title'])
  ]);

  function binding(id, label, required, synonyms) {
    return Object.freeze({ id, label, required: Boolean(required), scope: 'subject', synonyms });
  }

  function discoverWorkbook(workbook, xlsx) {
    const XLSX = xlsx || globalThis.XLSX;
    if (!XLSX) throw new Error('Thiếu thư viện SheetJS local.');
    if (!workbook?.SheetNames?.length) throw new Error('Workbook không có sheet.');
    const issues = [];
    const sheets = [];
    for (const name of workbook.SheetNames) {
      if (name === '__INCAL_META') continue;
      const worksheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true, blankrows: false });
      const headerRow = rows.findIndex((row) => Array.isArray(row) && row.some((cell) => text(cell)));
      if (headerRow < 0) continue;
      const headers = rows[headerRow].map((cell) => text(cell));
      let lastHeader = headers.length - 1;
      while (lastHeader >= 0 && !headers[lastHeader]) lastHeader -= 1;
      const seen = new Set();
      const fields = [];
      for (let columnIndex = 0; columnIndex <= lastHeader; columnIndex += 1) {
        const header = headers[columnIndex];
        if (!header) continue;
        const key = normalize(header);
        if (seen.has(key)) {
          issues.push(`Sheet "${name}" có header trùng "${header}".`);
          continue;
        }
        seen.add(key);
        const values = rows.slice(headerRow + 1).map((row) => row[columnIndex]).filter(present);
        fields.push({
          id: schema.sourceFieldId(name, header),
          header,
          columnIndex,
          type: inferType(header, values, worksheet, headerRow, columnIndex, XLSX)
        });
      }
      const dataRows = rows.slice(headerRow + 1).filter((row) => fields.some((field) => present(row[field.columnIndex])));
      const role = inferEntityRole(name, fields);
      sheets.push({
        tableId: schema.tableIdForSheet(name),
        name,
        label: name,
        role,
        headerRow,
        rowCount: dataRows.length,
        keyFieldId: inferKeyField(fields, dataRows),
        fields
      });
    }
    if (!sheets.length) throw new Error('Không tìm thấy sheet có hàng header.');
    const subject = sheets.find((sheet) => sheet.role === 'Chủ thể') || sheets[0];
    const schemaFingerprint = fingerprint(sheets.flatMap((sheet) => [`sheet:${sheet.name}`, ...sheet.fields.map((field) => `header:${field.header}`)]));
    return {
      sourceSchemaVersion: schema.SOURCE_SCHEMA_VERSION,
      fingerprint: schemaFingerprint,
      subjectTableId: subject.tableId,
      sheets,
      relations: [],
      issues
    };
  }

  function prepareSourceSchema(discovery) {
    return schema.normalizeSourceSchema(discovery);
  }

  function reconcileSourceSchema(discovery, saved) {
    const comparison = compareSourceSchema(saved, discovery);
    if (!comparison.exact) return { schema: prepareSourceSchema(discovery), comparison };
    const normalizedSaved = schema.normalizeSourceSchema(saved);
    const savedSheets = new Map((normalizedSaved.sheets || []).map((sheet) => [sheet.name, sheet]));
    const current = prepareSourceSchema(discovery);
    for (const table of current.sheets) {
      const oldTable = savedSheets.get(table.name);
      if (!oldTable) continue;
      table.tableId = oldTable.tableId || table.tableId;
      table.label = oldTable.label || table.label;
      table.role = oldTable.role || table.role;
      table.keyFieldId = oldTable.keyFieldId || table.keyFieldId;
      const oldFields = new Map((oldTable.fields || []).map((field) => [field.id, field]));
      for (const field of table.fields) {
        const oldField = oldFields.get(field.id);
        if (oldField && TYPE_OPTIONS.includes(oldField.type)) field.type = oldField.type;
      }
    }
    current.subjectTableId = normalizedSaved.subjectTableId || current.subjectTableId;
    current.relations = schema.clone(normalizedSaved.relations || []);
    return { schema: current, comparison };
  }

  function compareSourceSchema(expected, actual) {
    if (!expected) return { exact: false, reason: 'Chưa có schema trong preset.', missing: [], added: schemaKeys(actual) };
    const expectedKeys = schemaKeys(expected);
    const actualKeys = schemaKeys(actual);
    const actualSet = new Set(actualKeys);
    const expectedSet = new Set(expectedKeys);
    const missing = expectedKeys.filter((key) => !actualSet.has(key));
    const added = actualKeys.filter((key) => !expectedSet.has(key));
    return {
      exact: expected.fingerprint === actual.fingerprint && missing.length === 0 && added.length === 0,
      reason: missing.length || added.length ? 'Sheet hoặc header đã thay đổi.' : 'Fingerprint schema không khớp.',
      missing,
      added
    };
  }

  function suggestBindings(sourceSchema, existing) {
    const fields = schema.sourceFields(sourceSchema);
    const subject = schema.subjectTable(sourceSchema);
    const candidates = fields.filter((field) => field.table === subject?.tableId);
    const valid = new Set(candidates.map((field) => field.id));
    const output = {};
    for (const spec of BINDING_SPECS) {
      if (existing?.[spec.id] && valid.has(existing[spec.id])) {
        output[spec.id] = existing[spec.id];
        continue;
      }
      if (spec.id === 'subject.id' && subject?.keyFieldId && valid.has(subject.keyFieldId)) {
        output[spec.id] = subject.keyFieldId;
        continue;
      }
      const exact = candidates.find((field) => spec.synonyms.includes(normalize(field.label)));
      if (exact) output[spec.id] = exact.id;
    }
    return output;
  }

  function validateBindings(sourceSchema, bindings) {
    const subject = schema.subjectTable(sourceSchema);
    const fields = schema.sourceFields(sourceSchema);
    const lookup = new Map(fields.map((field) => [field.id, field]));
    const errors = [];
    if (!subject) errors.push('Chưa chọn bảng chủ thể tính.');
    if (subject && !subject.keyFieldId) errors.push(`Bảng chủ thể "${subject.label}" chưa chọn cột khóa.`);
    for (const spec of BINDING_SPECS) {
      const fieldId = bindings?.[spec.id];
      if (!fieldId) {
        if (spec.required) errors.push(`Chưa gán "${spec.label}".`);
        continue;
      }
      const field = lookup.get(fieldId);
      if (!field) errors.push(`Binding "${spec.label}" trỏ tới cột không còn tồn tại.`);
      else if (field.table !== subject?.tableId) errors.push(`Binding "${spec.label}" phải lấy từ bảng chủ thể "${subject?.label || ''}".`);
    }
    return { valid: errors.length === 0, errors };
  }

  function materializeWorkbook(workbook, sourceSchema, bindings, xlsx) {
    const XLSX = xlsx || globalThis.XLSX;
    const bindingValidation = validateBindings(sourceSchema, bindings);
    if (!bindingValidation.valid) throw new Error(bindingValidation.errors[0]);
    const allFields = schema.sourceFields(sourceSchema);
    const fieldLookup = new Map(allFields.map((field) => [field.id, field]));
    const tables = {};
    for (const table of sourceSchema.sheets || []) {
      const worksheet = workbook?.Sheets?.[table.name];
      if (!worksheet) throw new Error(`Thiếu sheet "${table.name}" so với preset.`);
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true, blankrows: false });
      const fields = (table.fields || []).map((item) => fieldLookup.get(item.id)).filter(Boolean);
      tables[table.tableId] = [];
      for (const values of rows.slice(Number(table.headerRow) + 1)) {
        if (!fields.some((field) => present(values[field.source.columnIndex]))) continue;
        const row = { __sourceSheet: table.name, __tableId: table.tableId };
        for (const field of fields) row[field.id] = coerce(values[field.source.columnIndex], field.type);
        applyLegacyAliases(row, fields);
        tables[table.tableId].push(row);
      }
    }
    const subject = schema.subjectTable(sourceSchema);
    const roster = (tables[subject.tableId] || []).map((row, index) => aliasSubject(row, bindings, index));
    assertUniqueSubject(roster, subject);
    const transaction = (sourceSchema.sheets || []).find((table) => normalize(table.role) === 'giao dich' || /job|transaction|sales/.test(normalize(table.name)));
    const jobs = transaction ? tables[transaction.tableId] || [] : [];
    const input = { roster, jobs, tables, fields: allFields, subjectTableId: subject.tableId, subjectLabel: subject.label };
    input.warnings = validateBusinessData(sourceSchema, tables);
    return input;
  }

  function validateBusinessData(sourceSchema, tables) {
    const warnings = [];
    const fieldId = (sheetName, header) => sourceSchema.sheets?.find((sheet) => sheet.name === sheetName)?.fields?.find((field) => normalize(field.header) === normalize(header))?.id || '';
    const jobsSheet = sourceSchema.sheets?.find((sheet) => /job/.test(normalize(sheet.name)) || normalize(sheet.role) === normalize('Giao dịch'));
    if (jobsSheet) {
      const teamId = jobsSheet.fields.find((field) => normalize(field.header) === 'team')?.id;
      const jobId = jobsSheet.fields.find((field) => ['ma job', 'job id', 'job no'].includes(normalize(field.header)))?.id;
      if (!teamId) warnings.push(`Jobs: thiếu cột Team; không thể kiểm tra tuyến.`);
      else {
        const missing = (tables[jobsSheet.tableId] || []).filter((row) => !text(row[teamId]));
        if (missing.length) warnings.push(`Jobs: ${missing.length} job thiếu Team${jobId ? ` (${missing.slice(0, 3).map((row) => text(row[jobId])).join(', ')})` : ''}. Hỏi FIN trước khi áp dụng rule theo Team.`);
      }
    }
    const people = sourceSchema.sheets?.find((sheet) => /nhan su|employee|staff|roster/.test(normalize(sheet.name)));
    if (people) {
      const targetId = people.fields.find((field) => normalize(field.header) === normalize('Target quý'))?.id;
      const salaries = ['Lương T1', 'Lương T2', 'Lương T3'].map((header) => fieldId(people.name, header)).filter(Boolean);
      const employeeId = people.fields.find((field) => ['ma nv', 'ma nhan su', 'employee id', 'staff id'].includes(normalize(field.header)))?.id;
      const nameId = people.fields.find((field) => ['ho ten', 'ten nhan vien', 'employee name', 'name'].includes(normalize(field.header)))?.id;
      if (targetId && salaries.length === 3) {
        for (const row of tables[people.tableId] || []) {
          const salaryTotal = salaries.reduce((sum, id) => sum + number(row[id]), 0);
          if (number(row[targetId]) > 0 && number(row[targetId]) < salaryTotal) warnings.push(`Nhân sự ${text(row[employeeId]) || 'không mã'}: Target quý nhỏ hơn tổng lương 3 tháng; kiểm tra lại tháng/quý.`);
        }
      }
      if (jobsSheet && employeeId && nameId) {
        const jobEmployeeId = jobsSheet.fields.find((field) => ['ma nv', 'ma nhan su', 'employee id', 'staff id'].includes(normalize(field.header)))?.id;
        const jobNameId = jobsSheet.fields.find((field) => ['nhan vien', 'ho ten', 'ten nhan vien', 'employee name', 'name'].includes(normalize(field.header)))?.id;
        if (jobEmployeeId && jobNameId) {
          const peopleNames = new Map((tables[people.tableId] || []).map((row) => [text(row[employeeId]), text(row[nameId])]).filter(([id, name]) => id && name));
          const mismatches = (tables[jobsSheet.tableId] || []).filter((row) => peopleNames.has(text(row[jobEmployeeId])) && normalize(peopleNames.get(text(row[jobEmployeeId]))) !== normalize(row[jobNameId]));
          if (mismatches.length) warnings.push(`Jobs/Nhân sự: ${new Set(mismatches.map((row) => text(row[jobEmployeeId]))).size} Mã NV có tên lệch giữa hai sheet.`);
        }
      }
    }
    return warnings;
  }

  function aliasSubject(row, bindings, index) {
    const id = row[bindings['subject.id']];
    const name = bindings['subject.name'] ? row[bindings['subject.name']] : id;
    const group = bindings['subject.group'] ? row[bindings['subject.group']] : '';
    return Object.assign(row, {
      id,
      code: id,
      employee_id: id,
      name: name || id || `Dòng ${index + 1}`,
      team: group || '',
      profile: group || '',
      'roster.employee_id': id,
      'roster.name': name || id || `Dòng ${index + 1}`,
      'roster.profile': group || ''
    });
  }

  function assertUniqueSubject(rows, subject) {
    const seen = new Set();
    for (const [index, row] of rows.entries()) {
      const id = String(row['roster.employee_id'] ?? '').trim();
      if (!id) throw new Error(`Bảng chủ thể "${subject.label}" dòng ${index + 2}: thiếu mã chủ thể.`);
      if (seen.has(id)) throw new Error(`Bảng chủ thể "${subject.label}" có mã trùng "${id}".`);
      seen.add(id);
    }
  }

  function applyLegacyAliases(row, fields) {
    const aliases = {
      'roster.target_quarter': ['target', 'target quy', 'chi tieu', 'chi tieu quy'],
      'roster.has_labor_contract': ['hdld', 'co hdld', 'labor contract'],
      'job.id': ['ma job', 'job id', 'job no'],
      'job.owner_employee_id': ['ma nv', 'ma nhan su', 'employee id', 'owner employee id'],
      'job.customer': ['khach hang', 'customer', 'client'],
      'job.gp': ['gp', 'gross profit', 'lai gop'],
      'job.payment_status': ['trang thai thu', 'payment status', 'paid status'],
      'job.month': ['thang', 'month'],
      'job.tier': ['muc', 'tier', 'level']
    };
    for (const [alias, synonyms] of Object.entries(aliases)) {
      const match = fields.find((field) => synonyms.includes(normalize(field.label)));
      if (match) row[alias] = row[match.id];
    }
  }

  function inferType(header, values, worksheet, headerRow, columnIndex, XLSX) {
    const key = normalize(header);
    const hasPercentFormat = values.some((_, index) => {
      const address = XLSX.utils.encode_cell({ r: headerRow + 1 + index, c: columnIndex });
      return String(worksheet?.[address]?.z || '').includes('%');
    });
    if (key.includes('%') || key.includes('phan tram') || key.includes('ty le') || hasPercentFormat) return 'Percent';
    if (key.includes('nhan to')) return 'Text';
    if (/(uu tien|tu thang|[dđ]en thang|so thang|chi tieu kh moi|kh moi dat)/.test(key)) return 'Number';
    if (/(gp|gross profit|lai gop|target|chi tieu|luong|doanh thu|chi phi|thue|phat|no qua han|du phong|dieu chinh|tong tru|\bcom\b|tien)/.test(key)) return 'Money';
    if (!values.length) return 'Text';
    if (values.every((value) => value instanceof Date)) return 'Date';
    if (values.every((value) => typeof value === 'boolean' || ['true', 'false', 'yes', 'no', 'co', 'khong'].includes(normalize(value)))) return 'Boolean';
    if (values.every((value) => typeof value === 'number' && Number.isFinite(value))) return 'Number';
    return 'Text';
  }

  function inferEntityRole(name, fields) {
    const sheet = normalize(name);
    const headers = new Set((fields || []).map((field) => normalize(field.header)));
    if (/(nhan su|nhansu|employee|staff|roster)/.test(sheet) || (headers.has('ma nv') && (headers.has('ho ten') || headers.has('ten nhan vien')))) return 'Chủ thể';
    if (/(job|misa|sales|doanh so|transaction)/.test(sheet) || headers.has('gp') || headers.has('ma job')) return 'Giao dịch';
    return 'Tra cứu';
  }

  function inferKeyField(fields, rows) {
    const preferred = ['ma nv', 'ma nhan su', 'employee id', 'staff id', 'ma job', 'job id', 'khach hang', 'customer', 'client'];
    for (const key of preferred) {
      const field = fields.find((item) => normalize(item.header) === key);
      if (field && uniqueColumn(field, rows)) return field.id;
    }
    const unique = fields.find((field) => uniqueColumn(field, rows));
    return unique?.id || fields[0]?.id || '';
  }

  function uniqueColumn(field, rows) {
    const values = rows.map((row) => row[field.columnIndex]).filter(present).map((value) => normalize(value));
    return values.length > 0 && new Set(values).size === values.length;
  }

  function schemaKeys(value) {
    return (value?.sheets || []).flatMap((sheet) => [`sheet:${sheet.name}`, ...(sheet.fields || []).map((field) => `header:${sheet.name}:${field.header}`)]);
  }

  function fingerprint(parts) {
    let hash = 2166136261;
    const input = (parts || []).join('|');
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `FNV1A-${(hash >>> 0).toString(16).padStart(8, '0')}-${parts.length}`;
  }

  function coerce(value, type) {
    if (value === null || value === undefined || value === '') return type === 'Text' ? '' : 0;
    if (['Money', 'Number', 'Percent'].includes(type)) {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    }
    if (type === 'Boolean') return value === true || ['true', 'yes', 'co', '1'].includes(normalize(value));
    return value;
  }

  function text(value) { return String(value ?? '').trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function present(value) { return value !== null && value !== undefined && value !== ''; }
  function normalize(value) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }

  return {
    TYPE_OPTIONS, BINDING_SPECS,
    discoverWorkbook, prepareSourceSchema, reconcileSourceSchema, compareSourceSchema,
    suggestBindings, validateBindings, materializeWorkbook, validateBusinessData, fingerprint
  };
});
