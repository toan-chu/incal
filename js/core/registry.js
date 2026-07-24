(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./schema'));
  else root.IncalV3 = Object.assign(root.IncalV3 || {}, factory(root.IncalV3));
})(typeof self !== 'undefined' ? self : this, function (schema) {
  'use strict';

  const T = schema.TYPES;
  const definitions = [
    block('source', 'Lấy nguồn', 'Nguồn', [], T.TABLE, [cfg('table', 'Bảng', 'select', ['jobs', 'roster']), cfg('ownerFieldId', 'Khoá người (tuỳ chọn)', 'field')], executeSource),
    block('filter', 'Lọc điều kiện', 'Dữ liệu', [port('table', T.TABLE)], T.TABLE, [cfg('fieldId', 'Cột', 'field'), cfg('operator', 'Điều kiện', 'select', ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in']), cfg('value', 'Giá trị', 'text')], executeFilter),
    block('scan_sum', 'Quét + Tổng', 'Dữ liệu', [port('table', T.TABLE)], T.MONEY, [cfg('fieldId', 'Cột tiền', 'field')], executeSum),
    block('count_distinct', 'Đếm giá trị khác nhau', 'Dữ liệu', [port('table', T.TABLE)], T.NUMBER, [cfg('fieldId', 'Cột cần đếm', 'field')], executeCountDistinct),
    block('lookup', 'Tra bảng + fallback', 'Dữ liệu', [port('key', T.ANY)], function (node) { return node.config?.returnType || T.ANY; }, [cfg('table', 'Bảng tra', 'select', ['jobs', 'roster']), cfg('lookupFieldId', 'Cột khoá', 'field'), cfg('returnFieldId', 'Cột trả về', 'field'), cfg('returnType', 'Kiểu trả về', 'select', Object.values(T)), cfg('fallback', 'Fallback', 'text')], executeLookup),
    block('map_lookup', 'Gắn cột tra cứu', 'Dữ liệu', [port('table', T.TABLE)], T.TABLE, [cfg('sourceKeyFieldId', 'Cột khoá nguồn', 'field'), cfg('table', 'Bảng tra', 'select', ['jobs', 'roster']), cfg('lookupFieldId', 'Cột khoá bảng tra', 'field'), cfg('returnFieldId', 'Cột trả về', 'field'), cfg('returnType', 'Kiểu cột mới', 'select', Object.values(T)), cfg('derivedFieldId', 'Mã cột mới', 'internal'), cfg('derivedFieldLabel', 'Tên cột mới', 'text'), cfg('fallback', 'Nếu không tìm thấy', 'text')], executeMapLookup),
    block('map_arithmetic', 'Tính cột', 'Dữ liệu', [port('table', T.TABLE)], T.TABLE, [cfg('leftMode', 'Toán hạng 1', 'select', ['field', 'literal']), cfg('leftFieldId', 'Cột 1', 'field'), cfg('leftLiteral', 'Hằng số 1', 'text'), cfg('leftLiteralType', 'Kiểu hằng số 1', 'select', [T.MONEY, T.NUMBER, T.PERCENT]), cfg('operator', 'Phép tính', 'select', ['+', '-', '*', '/']), cfg('rightMode', 'Toán hạng 2', 'select', ['field', 'literal']), cfg('rightFieldId', 'Cột 2', 'field'), cfg('rightLiteral', 'Hằng số 2', 'text'), cfg('rightLiteralType', 'Kiểu hằng số 2', 'select', [T.MONEY, T.NUMBER, T.PERCENT]), cfg('derivedFieldId', 'Mã cột mới', 'internal'), cfg('derivedFieldLabel', 'Tên cột mới', 'text')], executeMapArithmetic),
    block('map_rule_rate', 'Áp tỷ lệ theo quy tắc', 'Dữ liệu', [port('table', T.TABLE)], T.TABLE, [cfg('table', 'Bảng quy tắc', 'select', ['jobs', 'roster']), cfg('sourceJobFieldId', 'Job nguồn', 'field'), cfg('sourceTeamFieldId', 'Team nguồn', 'field'), cfg('sourceFactorFieldId', 'Nhân tố nguồn', 'field'), cfg('sourceMonthsFieldId', 'Số tháng nguồn', 'field'), cfg('rulePriorityFieldId', 'Ưu tiên', 'field'), cfg('ruleJobFieldId', 'Job trong quy tắc', 'field'), cfg('ruleTeamFieldId', 'Team trong quy tắc', 'field'), cfg('ruleFactorFieldId', 'Nhân tố trong quy tắc', 'field'), cfg('ruleMinMonthsFieldId', 'Từ tháng', 'field'), cfg('ruleMaxMonthsFieldId', 'Đến tháng', 'field'), cfg('ruleRateFieldId', 'Tỷ lệ trong quy tắc', 'field'), cfg('defaultRate', 'Tỷ lệ mặc định', 'number'), cfg('derivedFieldId', 'Mã cột mới', 'internal'), cfg('derivedFieldLabel', 'Tên cột mới', 'text')], executeMapRuleRate),
    block('arithmetic', '+ − × ÷', 'Tính toán', [port('left', T.ANY), port('right', T.ANY)], arithmeticOutputType, [cfg('operator', 'Phép toán', 'select', ['+', '-', '*', '/'])], executeArithmetic),
    block('percent_of', '% của', 'Tính toán', [port('base', T.MONEY), port('rate', T.PERCENT)], T.MONEY, [], function (i) { return result(i.base * i.rate); }),
    block('condition', 'Điều kiện', 'Logic', [port('condition', T.BOOLEAN), port('whenTrue', T.ANY), port('whenFalse', T.ANY)], function (node, inputTypes) { return inputTypes.whenTrue || node.outputType || T.ANY; }, [], function (i) { return result(i.condition ? i.whenTrue : i.whenFalse); }),
    block('progressive', 'Bậc lũy tiến', 'Tính toán', [port('value', T.MONEY)], T.MONEY, [cfg('rates', 'Các tỷ lệ', 'numberList'), cfg('quickDeductions', 'Trừ nhanh', 'numberList')], executeProgressive),
    block('cap_floor', 'Cap / Floor', 'Tính toán', [port('value', T.MONEY)], T.MONEY, [cfg('min', 'Floor', 'number'), cfg('max', 'Cap', 'number')], executeCapFloor),
    block('round_vnd', 'Làm tròn VND', 'Tính toán', [port('value', T.MONEY)], T.MONEY, [], function (i) { return result(round(i.value)); }),
    block('text_match', 'So khớp văn bản', 'Logic', [port('value', T.TEXT)], T.BOOLEAN, [cfg('operator', 'Kiểu so', 'select', ['eq', 'contains', 'startsWith']), cfg('compare', 'So với', 'text')], executeTextMatch),
    block('boolean', 'Boolean', 'Logic', [port('left', T.BOOLEAN), port('right', T.BOOLEAN)], T.BOOLEAN, [cfg('operator', 'Phép logic', 'select', ['AND', 'OR'])], function (i, c) { return result(c.operator === 'OR' ? Boolean(i.left || i.right) : Boolean(i.left && i.right)); }),
    block('time_weight', 'Thời gian', 'Logic', [port('month', T.NUMBER)], T.PERCENT, [cfg('activeMonths', 'Tháng active', 'numberList')], function (i, c) { return result((c.activeMonths || []).map(Number).includes(Number(i.month)) ? 1 : 0); }),
    block('negate', 'Đảo dấu', 'Tính toán', [port('value', T.MONEY)], T.MONEY, [], function (i) { return result(-i.value); }),
    macro('macro.waterfall', 'Waterfall Trustana', [port('gpLevel1', T.MONEY), port('gpLevel2', T.MONEY), port('gpLevel3', T.MONEY), port('target', T.MONEY), port('adjustment', T.PERCENT)], T.MONEY, [cfg('rates', 'Rate M1/M2/M3', 'numberList')], executeWaterfall),
    macro('macro.tax_dual', 'Thuế lũy tiến 2 nhánh', [port('taxableIncome', T.MONEY), port('hasLaborContract', T.BOOLEAN)], T.MONEY, [cfg('rates', 'Rates', 'numberList'), cfg('quickDeductions', 'Trừ nhanh', 'numberList'), cfg('flatRate', 'Thuế khoán', 'number')], executeDualTax),
    macro('macro.kae_pool', 'Pool KAE', [port('adminGp', T.MONEY), port('saleGp', T.MONEY), port('participantCount', T.NUMBER)], T.MONEY, [cfg('adminRate', 'Rate nhóm chính', 'number'), cfg('saleRate', 'Rate nhóm phụ', 'number')], executeKaePool)
  ];

  const registry = new Map(definitions.map((item) => [item.id, Object.freeze(item)]));

  function block(id, name, category, inputs, outputType, configSchema, execute) {
    return { id, name, category, inputs, outputType, configSchema, lockedMacro: false, execute };
  }
  function macro(id, name, inputs, outputType, configSchema, execute) {
    return { id, name, category: 'Macro', inputs, outputType, configSchema, lockedMacro: true, execute };
  }
  function port(id, type) { return { id, type }; }
  function cfg(id, label, kind, options) { return { id, label, kind, options: options || [] }; }
  function getBlock(id) { return registry.get(id); }
  function listBlocks() { return definitions.slice(); }

  function resolveOutputType(definition, node, inputTypes) {
    return typeof definition.outputType === 'function'
      ? definition.outputType(node || {}, inputTypes || {})
      : definition.outputType;
  }

  function arithmeticOutputType(node, inputTypes) {
    const left = inputTypes.left;
    const right = inputTypes.right;
    const op = node.config?.operator || '+';
    if (op === '+' || op === '-') return left === right ? left : T.ANY;
    if (op === '*') {
      if (left === T.MONEY && right === T.NUMBER) return T.MONEY;
      if (left === T.NUMBER && right === T.MONEY) return T.MONEY;
      if (left === T.NUMBER && right === T.NUMBER) return T.NUMBER;
      if ((left === T.NUMBER && right === T.PERCENT) || (left === T.PERCENT && right === T.NUMBER)) return T.PERCENT;
    }
    if (op === '/') {
      if (left === T.MONEY && right === T.NUMBER) return T.MONEY;
      if (left === T.MONEY && right === T.MONEY) return T.NUMBER;
      if (left === T.NUMBER && right === T.NUMBER) return T.NUMBER;
    }
    return T.ANY;
  }

  function executeSource(inputs, config, context) {
    let rows = (context.tables?.[config.table || 'jobs'] || []).slice();
    if (config.ownerFieldId && context.currentPerson) {
      const personId = context.currentPerson['roster.employee_id'] || context.currentPerson.employee_id || context.currentPerson.id || context.currentPerson.code;
      rows = rows.filter((row) => read(row, config.ownerFieldId) === personId);
    }
    return result(rows, rows);
  }

  function executeFilter(inputs, config) {
    const rows = Array.isArray(inputs.table) ? inputs.table : [];
    const filtered = rows.filter((row) => compare(read(row, config.fieldId), config.value, config.operator));
    return result(filtered, filtered);
  }

  function executeSum(inputs, config) {
    const rows = Array.isArray(inputs.table) ? inputs.table : [];
    return result(rows.reduce((sum, row) => sum + number(read(row, config.fieldId)), 0), rows);
  }

  function executeCountDistinct(inputs, config) {
    const rows = Array.isArray(inputs.table) ? inputs.table : [];
    const values = new Set(rows.map((row) => normalized(read(row, config.fieldId))).filter(Boolean));
    return result(values.size, rows, { rowCount: rows.length, distinctCount: values.size, fieldId: config.fieldId });
  }

  function executeLookup(inputs, config, context) {
    const rows = context.tables?.[config.table] || [];
    const match = rows.find((row) => normalized(read(row, config.lookupFieldId)) === normalized(inputs.key));
    return result(match ? read(match, config.returnFieldId) : config.fallback, match ? [match] : []);
  }

  function executeMapLookup(inputs, config, context) {
    const sourceRows = Array.isArray(inputs.table) ? inputs.table : [];
    const targetRows = context.tables?.[config.table] || [];
    const derivedFieldId = String(config.derivedFieldId || 'derived.lookup').trim() || 'derived.lookup';
    const index = new Map();
    for (const row of targetRows) {
      const key = normalized(read(row, config.lookupFieldId));
      if (!index.has(key)) index.set(key, row);
    }
    let matchedCount = 0;
    const fallback = coerceConfiguredValue(config.fallback, config.returnType);
    const rows = sourceRows.map((row) => {
      const match = index.get(normalized(read(row, config.sourceKeyFieldId)));
      if (match) matchedCount += 1;
      return Object.assign({}, row, {
        [derivedFieldId]: match ? read(match, config.returnFieldId) : fallback
      });
    });
    return result(rows, rows, { matchedCount, rowCount: rows.length, derivedFieldId });
  }

  function executeMapArithmetic(inputs, config) {
    const sourceRows = Array.isArray(inputs.table) ? inputs.table : [];
    const derivedFieldId = String(config.derivedFieldId || 'derived.calculation').trim() || 'derived.calculation';
    let invalidCount = 0;
    const rows = sourceRows.map((row) => {
      const left = mapOperandValue(row, config, 'left');
      const right = mapOperandValue(row, config, 'right');
      const value = calculateMapArithmetic(left, right, config.operator);
      if (!Number.isFinite(value)) invalidCount += 1;
      return Object.assign({}, row, { [derivedFieldId]: value });
    });
    return result(rows, rows, { rowCount: rows.length, invalidCount, derivedFieldId, operator: config.operator || '+' });
  }

  function executeMapRuleRate(inputs, config, context) {
    const sourceRows = Array.isArray(inputs.table) ? inputs.table : [];
    const ruleRows = context.tables?.[config.table] || [];
    const derivedFieldId = String(config.derivedFieldId || 'derived.rule-rate').trim() || 'derived.rule-rate';
    const defaultRate = number(config.defaultRate);
    const rules = ruleRows.map((row, index) => ({ row, index, priority: rulePriority(row, config) }));
    let matchedCount = 0;
    let defaultCount = 0;
    const appliedRuleRows = [];
    const rows = sourceRows.map((row) => {
      const winner = rules.filter((rule) => ruleMatches(row, rule.row, config)).sort((left, right) => left.priority - right.priority || left.index - right.index)[0];
      const rate = winner ? number(read(winner.row, config.ruleRateFieldId)) : defaultRate;
      if (winner) {
        matchedCount += 1;
        appliedRuleRows.push(winner.index + 2);
      } else defaultCount += 1;
      return Object.assign({}, row, { [derivedFieldId]: rate });
    });
    return result(rows, rows, { rowCount: rows.length, matchedCount, defaultCount, appliedRuleRows, derivedFieldId });
  }

  function ruleMatches(source, rule, config) {
    if (!matchesTextRule(read(source, config.sourceJobFieldId), read(rule, config.ruleJobFieldId))) return false;
    if (!matchesTextRule(read(source, config.sourceTeamFieldId), read(rule, config.ruleTeamFieldId))) return false;
    if (!matchesTextRule(read(source, config.sourceFactorFieldId), read(rule, config.ruleFactorFieldId))) return false;
    const months = optionalNumber(read(source, config.sourceMonthsFieldId));
    const min = optionalNumber(read(rule, config.ruleMinMonthsFieldId));
    const max = optionalNumber(read(rule, config.ruleMaxMonthsFieldId));
    if (min !== null && (months === null || months < min)) return false;
    if (max !== null && (months === null || months > max)) return false;
    return true;
  }

  function matchesTextRule(source, expected) {
    if (!normalized(expected)) return true;
    return normalized(source) === normalized(expected);
  }

  function rulePriority(row, config) {
    const value = optionalNumber(read(row, config.rulePriorityFieldId));
    return value === null ? Number.MAX_SAFE_INTEGER : value;
  }

  function mapOperandValue(row, config, side) {
    const value = config?.[`${side}Mode`] === 'literal'
      ? config?.[`${side}Literal`]
      : read(row, config?.[`${side}FieldId`]);
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  function calculateMapArithmetic(left, right, operator) {
    if (operator === '+') return left + right;
    if (operator === '-') return left - right;
    if (operator === '*') return left * right;
    if (operator === '/') return right === 0 ? NaN : left / right;
    return NaN;
  }

  function mapArithmeticOutputType(left, right, operator) {
    const numericTypes = [T.MONEY, T.NUMBER, T.PERCENT];
    if (!numericTypes.includes(left) || !numericTypes.includes(right)) return null;
    if (operator === '+' || operator === '-') return left === right ? left : null;
    if (operator === '*') {
      if (left === T.MONEY || right === T.MONEY) return left !== right && [left, right].some((type) => [T.NUMBER, T.PERCENT].includes(type)) ? T.MONEY : null;
      if (left === T.NUMBER && right === T.NUMBER) return T.NUMBER;
      if ((left === T.NUMBER && right === T.PERCENT) || (left === T.PERCENT && right === T.NUMBER)) return T.PERCENT;
      return null;
    }
    if (operator === '/') {
      if (left === T.MONEY && right === T.MONEY) return T.NUMBER;
      if (left === T.MONEY) return T.MONEY;
      if (left === T.PERCENT && right === T.PERCENT) return T.NUMBER;
      if (left === T.PERCENT && right === T.NUMBER) return T.PERCENT;
      if (left === T.NUMBER && [T.NUMBER, T.PERCENT].includes(right)) return T.NUMBER;
    }
    return null;
  }

  function executeArithmetic(inputs, config) {
    const left = number(inputs.left);
    const right = number(inputs.right);
    const op = config.operator || '+';
    if (op === '+') return result(left + right);
    if (op === '-') return result(left - right);
    if (op === '*') return result(left * right);
    if (op === '/') return result(right === 0 ? NaN : left / right);
    return result(0);
  }

  function executeProgressive(inputs, config) {
    const value = Math.max(0, number(inputs.value));
    const rates = config.rates || [];
    const quick = config.quickDeductions || [];
    const candidates = rates.map((rate, index) => value * number(rate) - number(quick[index]));
    return result(round(Math.max(0, ...candidates)));
  }

  function executeCapFloor(inputs, config) {
    let value = number(inputs.value);
    if (config.min !== '' && config.min !== null && config.min !== undefined) value = Math.max(value, number(config.min));
    if (config.max !== '' && config.max !== null && config.max !== undefined) value = Math.min(value, number(config.max));
    return result(value);
  }

  function executeTextMatch(inputs, config) {
    const value = normalized(inputs.value);
    const compareValue = normalized(config.compare);
    if (config.operator === 'contains') return result(value.includes(compareValue));
    if (config.operator === 'startsWith') return result(value.startsWith(compareValue));
    return result(value === compareValue);
  }

  function executeWaterfall(inputs, config) {
    const gps = [inputs.gpLevel1, inputs.gpLevel2, inputs.gpLevel3].map(number);
    const rates = config.rates?.length === 3 ? config.rates.map(number) : [0, 0, 0];
    const target = round(inputs.target);
    const adjustment = number(inputs.adjustment);
    let remaining = target;
    let priorAwarded = false;
    let total = 0;
    const lines = [];
    gps.forEach((gp, index) => {
      const level = index + 1;
      let excess;
      if (level === 1) excess = Math.max(0, gp - remaining);
      else if (priorAwarded) excess = Math.max(0, gp);
      else if (level === 2) excess = Math.max(0, gp - remaining);
      else excess = Math.max(0, gp - target);
      remaining = Math.max(0, remaining - gp);
      const rate = rates[index] + (level >= 2 ? adjustment : 0);
      const amount = excess * rate;
      if (amount > 0) priorAwarded = true;
      total += amount;
      lines.push({ level, gp: round(gp), excess: round(excess), rate, amount: round(amount) });
    });
    return result(total, [], { lines, target });
  }

  function executeDualTax(inputs, config) {
    const taxable = Math.max(0, number(inputs.taxableIncome));
    if (!inputs.hasLaborContract) return result(round(taxable * number(config.flatRate)));
    return executeProgressive({ value: taxable }, { rates: config.rates || [], quickDeductions: config.quickDeductions || [] });
  }

  function executeKaePool(inputs, config) {
    const count = number(inputs.participantCount);
    const pool = number(inputs.adminGp) * number(config.adminRate) + number(inputs.saleGp) * number(config.saleRate);
    return result(count > 0 ? pool / count : NaN, [], { pool: round(pool), participantCount: count });
  }

  function result(value, rows, detail) { return { value, rows: rows || [], detail: detail || null }; }
  function coerceConfiguredValue(value, type) {
    if (type === T.BOOLEAN) return value === true || String(value).toLowerCase() === 'true';
    if ([T.MONEY, T.NUMBER, T.PERCENT].includes(type)) return number(value);
    return value;
  }
  function round(value) { const n = Number(value || 0); return Number.isFinite(n) ? Math.round(n) : NaN; }
  function number(value) { const n = Number(value || 0); return Number.isFinite(n) ? n : 0; }
  function optionalNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  function normalized(value) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
  function read(row, fieldId) { return row?.[fieldId] ?? row?.[String(fieldId || '').split('.').pop()]; }
  function compare(left, right, operator) {
    if (operator === 'contains') return normalized(left).includes(normalized(right));
    if (operator === 'in') return String(right ?? '').split(/[,;\r\n]+/).map(normalized).filter(Boolean).includes(normalized(left));
    if (operator === 'eq') return normalized(left) === normalized(right);
    if (operator === 'neq') return normalized(left) !== normalized(right);
    const a = number(left); const b = number(right);
    if (operator === 'gt') return a > b;
    if (operator === 'gte') return a >= b;
    if (operator === 'lt') return a < b;
    if (operator === 'lte') return a <= b;
    return false;
  }

  return { getBlock, listBlocks, resolveOutputType, arithmeticOutputType, mapArithmeticOutputType };
});
