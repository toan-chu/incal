(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./schema'), require('./registry'));
  else root.IncalV3 = Object.assign(root.IncalV3 || {}, factory(root.IncalV3, root.IncalV3));
})(typeof self !== 'undefined' ? self : this, function (schema, registry) {
  'use strict';

  const T = schema.TYPES;

  function validateRecipe(recipe, fields) {
    const errors = [];
    const fieldLookup = schema.fieldMap(fields);
    const nodes = recipe?.nodes || [];
    const nodeLookup = new Map();
    for (const node of nodes) {
      if (!node?.id) add(errors, issue('MISSING_NODE_ID', '', '', 'Khối thiếu id.'));
      else if (nodeLookup.has(node.id)) add(errors, issue('DUPLICATE_NODE_ID', node.id, '', `Khối id "${node.id}" bị trùng.`));
      else nodeLookup.set(node.id, node);
      if (!registry.getBlock(node?.blockId)) add(errors, issue('UNKNOWN_BLOCK', node?.id, '', `Khối "${node?.blockId || ''}" không có trong registry.`));
    }

    registerDerivedFields(nodes, fieldLookup, errors);

    const graph = buildGraph(nodes, nodeLookup, errors);
    const order = topologicalOrder(nodes, graph, errors);
    const outputTypes = new Map();
    for (const nodeId of order) {
      const node = nodeLookup.get(nodeId);
      const definition = registry.getBlock(node.blockId);
      if (!definition) continue;
      const inputTypes = {};
      for (const port of definition.inputs) {
        const ref = node.inputs?.[port.id];
        if (!ref) {
          add(errors, issue('MISSING_INPUT', node.id, port.id, `${definition.name}: thiếu đầu vào "${port.id}".`));
          continue;
        }
        const actual = referenceType(ref, fieldLookup, outputTypes, nodeLookup, errors, node.id, port.id);
        inputTypes[port.id] = actual;
        if (!compatible(actual, port.type, node, port.id, inputTypes)) {
          add(errors, issue('TYPE_MISMATCH', node.id, port.id, `${definition.name}: ${port.id} cần ${port.type}, đang nhận ${actual || 'không xác định'}.`));
        }
      }
      validateConfig(node, definition, fieldLookup, errors);
      if (node.blockId === 'map_arithmetic') validateMapArithmetic(node, fieldLookup, errors, definition.name);
      if (node.blockId === 'map_rule_rate') validateMapRuleRate(node, fieldLookup, errors, definition.name);
      if (node.blockId === 'arithmetic' && node.config?.operator === '/' && isZeroLiteral(node.inputs?.right)) {
        add(errors, issue('DIVIDE_BY_ZERO', node.id, 'right', `${definition.name}: không được chia cho 0.`));
      }
      if (node.blockId === 'macro.kae_pool' && isZeroLiteral(node.inputs?.participantCount)) {
        add(errors, issue('DIVIDE_BY_ZERO', node.id, 'participantCount', `${definition.name}: số người chia phải lớn hơn 0.`));
      }
      const outputType = registry.resolveOutputType(definition, node, inputTypes);
      if (!outputType || outputType === T.ANY) {
        if (node.blockId === 'arithmetic') add(errors, issue('TYPE_MISMATCH', node.id, '', `${definition.name}: tổ hợp kiểu dữ liệu không hợp lệ.`));
      }
      outputTypes.set(node.id, outputType || T.ANY);
    }

    const outputNodeId = recipe?.output?.nodeId || nodes[nodes.length - 1]?.id;
    if (!outputNodeId || !nodeLookup.has(outputNodeId)) {
      add(errors, issue('MISSING_OUTPUT', '', '', 'Công thức chưa chọn khối kết quả.'));
    } else if (recipe.output?.type && !compatible(outputTypes.get(outputNodeId), recipe.output.type)) {
      add(errors, issue('OUTPUT_TYPE_MISMATCH', outputNodeId, '', `Kết quả cần ${recipe.output.type}, đang là ${outputTypes.get(outputNodeId)}.`));
    }
    return { valid: errors.length === 0, errors, order, outputTypes };
  }

  function validatePreset(preset, fields) {
    const errors = [];
    if (Number(preset?.schemaVersion) !== schema.SCHEMA_VERSION) add(errors, issue('BAD_SCHEMA_VERSION', '', '', `Preset phải là schemaVersion ${schema.SCHEMA_VERSION}.`));
    const ids = new Set();
    const recipes = [];
    for (const recipe of preset?.recipes || []) {
      if (ids.has(recipe.id)) add(errors, issue('DUPLICATE_RECIPE_ID', recipe.id, '', `Recipe "${recipe.id}" bị trùng.`));
      ids.add(recipe.id);
      const validation = validateRecipe(recipe, fields);
      recipes.push({ recipeId: recipe.id, validation });
      for (const error of validation.errors) add(errors, Object.assign({ recipeId: recipe.id }, error));
    }
    return { valid: errors.length === 0, errors, recipes };
  }

  function buildGraph(nodes, nodeLookup, errors) {
    const graph = new Map(nodes.map((node) => [node.id, new Set()]));
    for (const node of nodes) {
      for (const [portId, ref] of Object.entries(node.inputs || {})) {
        if (ref?.kind !== 'node') continue;
        if (!nodeLookup.has(ref.nodeId)) {
          add(errors, issue('UNKNOWN_NODE_REFERENCE', node.id, portId, `${node.id}: tham chiếu khối "${ref.nodeId}" không tồn tại.`));
          continue;
        }
        graph.get(node.id)?.add(ref.nodeId);
      }
    }
    return graph;
  }

  function topologicalOrder(nodes, graph, errors) {
    const indegree = new Map(nodes.map((node) => [node.id, graph.get(node.id)?.size || 0]));
    const dependents = new Map(nodes.map((node) => [node.id, []]));
    for (const [nodeId, deps] of graph.entries()) for (const dep of deps) dependents.get(dep)?.push(nodeId);
    const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
    const order = [];
    while (queue.length) {
      const id = queue.shift();
      order.push(id);
      for (const dependent of dependents.get(id) || []) {
        indegree.set(dependent, indegree.get(dependent) - 1);
        if (indegree.get(dependent) === 0) queue.push(dependent);
      }
    }
    if (order.length !== nodes.length) {
      const cycleNodes = nodes.map((node) => node.id).filter((id) => !order.includes(id));
      add(errors, issue('CYCLE', cycleNodes[0] || '', '', `Công thức có vòng lặp: ${cycleNodes.join(' -> ')}.`));
      for (const node of nodes) if (!order.includes(node.id)) order.push(node.id);
    }
    return order;
  }

  function referenceType(ref, fields, outputTypes, nodes, errors, nodeId, portId) {
    if (ref.kind === 'literal') return ref.type || inferLiteralType(ref.value);
    if (ref.kind === 'field') {
      const field = fields.get(ref.fieldId);
      if (!field) add(errors, issue('UNKNOWN_FIELD', nodeId, portId, `Field id "${ref.fieldId}" không tồn tại.`));
      return field?.type;
    }
    if (ref.kind === 'node') return outputTypes.get(ref.nodeId) || registry.resolveOutputType(registry.getBlock(nodes.get(ref.nodeId)?.blockId) || {}, nodes.get(ref.nodeId), {});
    add(errors, issue('BAD_REFERENCE', nodeId, portId, `${nodeId}: input "${portId}" không hợp lệ.`));
    return null;
  }

  function validateConfig(node, definition, fields, errors) {
    for (const spec of definition.configSchema || []) {
      if (node.blockId === 'map_arithmetic' && spec.kind === 'field' && node.config?.[spec.id.startsWith('left') ? 'leftMode' : 'rightMode'] === 'literal') continue;
      const value = node.config?.[spec.id];
      if (spec.kind === 'field' && value && !fields.has(value)) add(errors, issue('UNKNOWN_FIELD', node.id, spec.id, `${definition.name}: field "${value}" không tồn tại.`));
      if (spec.kind === 'select' && spec.id === 'table' && ['source', 'lookup', 'map_lookup', 'map_rule_rate'].includes(node.blockId)) {
        const tableIds = new Set(Array.from(fields.values()).map((field) => field.table));
        if (value && !tableIds.has(value)) add(errors, issue('BAD_CONFIG', node.id, spec.id, `${definition.name}: bảng "${value}" không tồn tại trong workbook.`));
      } else if (spec.kind === 'select' && value && spec.options?.length && !spec.options.includes(value)) {
        add(errors, issue('BAD_CONFIG', node.id, spec.id, `${definition.name}: giá trị "${value}" không hợp lệ cho ${spec.label}.`));
      }
    }
  }

  function registerDerivedFields(nodes, fields, errors) {
    const owners = new Map();
    const derivedNodes = nodes.filter((node) => ['map_lookup', 'map_arithmetic', 'map_rule_rate'].includes(node.blockId));
    for (const node of derivedNodes) {
      const id = derivedFieldId(node);
      const existingOwner = owners.get(id);
      if (existingOwner) add(errors, issue('DUPLICATE_DERIVED_FIELD', node.id, 'derivedFieldId', `Cột phái sinh "${id}" bị trùng với khối "${existingOwner}".`));
      else if (fields.has(id) && !fields.get(id)?.derived) add(errors, issue('DUPLICATE_DERIVED_FIELD', node.id, 'derivedFieldId', `Cột phái sinh "${id}" trùng field workbook.`));
      else owners.set(id, node.id);
    }
    for (const node of derivedNodes.filter((item) => item.blockId === 'map_lookup')) {
      const id = derivedFieldId(node);
      if (owners.get(id) !== node.id) continue;
      fields.set(id, derivedField(node, node.config?.returnType || T.ANY, 'Cột tra cứu'));
    }
    for (const node of derivedNodes.filter((item) => item.blockId === 'map_rule_rate')) {
      const id = derivedFieldId(node);
      if (owners.get(id) === node.id) fields.set(id, derivedField(node, T.PERCENT, 'Tỷ lệ theo quy tắc'));
    }
    let pending = derivedNodes.filter((item) => item.blockId === 'map_arithmetic' && owners.get(derivedFieldId(item)) === item.id);
    do {
      const before = pending.length;
      pending = pending.filter((node) => {
        const left = mapArithmeticOperandType(node, 'left', fields);
        const right = mapArithmeticOperandType(node, 'right', fields);
        if (!left || !right) return true;
        fields.set(derivedFieldId(node), derivedField(node, registry.mapArithmeticOutputType(left, right, node.config?.operator) || T.ANY, 'Cột tính toán'));
        return false;
      });
      if (pending.length === before) break;
    } while (pending.length);
    for (const node of pending) fields.set(derivedFieldId(node), derivedField(node, T.ANY, 'Cột tính toán'));
  }

  function derivedField(node, type, fallbackLabel) {
    const id = derivedFieldId(node);
    return { id, label: node.config?.derivedFieldLabel || fallbackLabel, type, table: 'derived', derived: true, sourceNodeId: node.id };
  }

  function validateMapArithmetic(node, fields, errors, blockName) {
    for (const side of ['left', 'right']) {
      if (node.config?.[`${side}Mode`] === 'field' && !node.config?.[`${side}FieldId`]) {
        add(errors, issue('BAD_CONFIG', node.id, `${side}FieldId`, `${blockName}: chưa chọn cột cho toán hạng ${side === 'left' ? '1' : '2'}.`));
      }
    }
    const left = mapArithmeticOperandType(node, 'left', fields);
    const right = mapArithmeticOperandType(node, 'right', fields);
    if (left && right && !registry.mapArithmeticOutputType(left, right, node.config?.operator)) {
      add(errors, issue('TYPE_MISMATCH', node.id, 'operator', `${blockName}: không thể tính ${left} ${node.config?.operator || '?'} ${right}.`));
    }
    if (node.config?.operator === '/' && node.config?.rightMode === 'literal' && Number(node.config?.rightLiteral) === 0) {
      add(errors, issue('DIVIDE_BY_ZERO', node.id, 'rightLiteral', `${blockName}: không được chia cho 0.`));
    }
  }

  function validateMapRuleRate(node, fields, errors, blockName) {
    const config = node.config || {};
    if (!config.table) add(errors, issue('BAD_CONFIG', node.id, 'table', `${blockName}: chưa chọn bảng quy tắc.`));
    if (!config.ruleRateFieldId) add(errors, issue('BAD_CONFIG', node.id, 'ruleRateFieldId', `${blockName}: chưa chọn cột tỷ lệ.`));
    const defaultRate = Number(config.defaultRate);
    if (!Number.isFinite(defaultRate) || defaultRate < 0 || defaultRate > 1) add(errors, issue('BAD_CONFIG', node.id, 'defaultRate', `${blockName}: tỷ lệ mặc định phải từ 0 đến 1 (ví dụ 0.01).`));
    validateRuleFieldPair(node, fields, errors, 'sourceJobFieldId', 'ruleJobFieldId', T.TEXT, blockName);
    validateRuleFieldPair(node, fields, errors, 'sourceTeamFieldId', 'ruleTeamFieldId', T.TEXT, blockName);
    validateRuleFieldPair(node, fields, errors, 'sourceFactorFieldId', 'ruleFactorFieldId', T.TEXT, blockName);
    const ruleTable = config.table;
    for (const fieldId of ['rulePriorityFieldId', 'ruleMinMonthsFieldId', 'ruleMaxMonthsFieldId']) {
      const field = fields.get(config[fieldId]);
      if (config[fieldId] && field && field.type !== T.NUMBER) add(errors, issue('TYPE_MISMATCH', node.id, fieldId, `${blockName}: ${field.label} phải là Number.`));
      if (config[fieldId] && field && field.table !== ruleTable) add(errors, issue('BAD_CONFIG', node.id, fieldId, `${blockName}: ${field.label} phải thuộc bảng quy tắc.`));
    }
    const rate = fields.get(config.ruleRateFieldId);
    if (rate && rate.type !== T.PERCENT) add(errors, issue('TYPE_MISMATCH', node.id, 'ruleRateFieldId', `${blockName}: cột tỷ lệ phải có kiểu Percent.`));
    if (rate && rate.table !== ruleTable) add(errors, issue('BAD_CONFIG', node.id, 'ruleRateFieldId', `${blockName}: cột tỷ lệ phải thuộc bảng quy tắc.`));
    const months = fields.get(config.sourceMonthsFieldId);
    if ((config.ruleMinMonthsFieldId || config.ruleMaxMonthsFieldId) && !config.sourceMonthsFieldId) add(errors, issue('BAD_CONFIG', node.id, 'sourceMonthsFieldId', `${blockName}: phải chọn số tháng nguồn khi dùng khoảng tháng.`));
    if (config.sourceMonthsFieldId && months && months.type !== T.NUMBER) add(errors, issue('TYPE_MISMATCH', node.id, 'sourceMonthsFieldId', `${blockName}: số tháng nguồn phải có kiểu Number.`));
  }

  function validateRuleFieldPair(node, fields, errors, sourceId, ruleId, expectedType, blockName) {
    const source = node.config?.[sourceId];
    const rule = node.config?.[ruleId];
    if (Boolean(source) !== Boolean(rule)) add(errors, issue('BAD_CONFIG', node.id, source || rule ? (source ? ruleId : sourceId) : sourceId, `${blockName}: điều kiện nguồn và điều kiện quy tắc phải được chọn cùng nhau.`));
    for (const fieldId of [sourceId, ruleId]) {
      const field = fields.get(node.config?.[fieldId]);
      if (node.config?.[fieldId] && field && field.type !== expectedType) add(errors, issue('TYPE_MISMATCH', node.id, fieldId, `${blockName}: ${field.label} phải có kiểu ${expectedType}.`));
    }
    const ruleField = fields.get(rule);
    if (rule && ruleField && ruleField.table !== node.config?.table) add(errors, issue('BAD_CONFIG', node.id, ruleId, `${blockName}: ${ruleField.label} phải thuộc bảng quy tắc.`));
  }

  function mapArithmeticOperandType(node, side, fields) {
    if (node.config?.[`${side}Mode`] === 'literal') return node.config?.[`${side}LiteralType`] || T.NUMBER;
    return fields.get(node.config?.[`${side}FieldId`])?.type || null;
  }

  function compatible(actual, expected, node, portId, inputTypes) {
    if (!actual || expected === T.ANY || actual === T.ANY) return true;
    if (actual === expected) return true;
    if (node?.blockId === 'arithmetic') {
      const op = node.config?.operator || '+';
      if ((op === '*' || op === '/') && portId && [T.MONEY, T.NUMBER].includes(actual)) return true;
      if ((op === '+' || op === '-') && inputTypes && inputTypes.left === inputTypes.right) return true;
    }
    return false;
  }

  function isZeroLiteral(ref) { return ref?.kind === 'literal' && Number(ref.value) === 0; }
  function derivedFieldId(node) { return String(node?.config?.derivedFieldId || `derived:${node?.id || 'lookup'}`).trim(); }
  function inferLiteralType(value) {
    if (typeof value === 'boolean') return T.BOOLEAN;
    if (typeof value === 'number') return T.NUMBER;
    return T.TEXT;
  }
  function issue(code, nodeId, portId, message) { return { code, nodeId: nodeId || '', portId: portId || '', message }; }
  function add(errors, item) {
    const key = [item.recipeId || '', item.code, item.nodeId, item.portId].join('|');
    if (!errors.some((existing) => [existing.recipeId || '', existing.code, existing.nodeId, existing.portId].join('|') === key)) errors.push(item);
  }

  return { validateRecipe, validatePreset, topologicalOrder, compatible };
});
