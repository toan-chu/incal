(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./schema'), require('./registry'), require('./validator'));
  else root.IncalV3 = Object.assign(root.IncalV3 || {}, factory(root.IncalV3, root.IncalV3, root.IncalV3));
})(typeof self !== 'undefined' ? self : this, function (schema, registry, validator) {
  'use strict';

  function executeRecipe(recipe, context, options) {
    const validation = validator.validateRecipe(recipe, context.fields || schema.FIELD_CATALOG);
    if (!validation.valid) {
      const error = new Error(validation.errors[0].message);
      error.code = 'INVALID_RECIPE';
      error.validation = validation;
      throw error;
    }
    const nodes = new Map((recipe.nodes || []).map((node) => [node.id, node]));
    const values = new Map();
    const traces = [];
    for (const nodeId of validation.order) {
      const node = nodes.get(nodeId);
      const definition = registry.getBlock(node.blockId);
      const resolvedInputs = {};
      const inheritedRows = [];
      for (const port of definition.inputs) {
        const resolved = resolveReference(node.inputs[port.id], values, context);
        resolvedInputs[port.id] = resolved.value;
        inheritedRows.push(...(resolved.rows || []));
      }
      const output = definition.execute(resolvedInputs, node.config || {}, context);
      const rows = uniqueRows((output.rows?.length ? output.rows : inheritedRows));
      values.set(node.id, { value: output.value, rows, detail: output.detail || null });
      traces.push({
        nodeId: node.id,
        blockId: node.blockId,
        blockName: definition.name,
        value: serializable(output.value),
        jobIds: rows.map(jobId).filter(Boolean),
        detail: output.detail || null
      });
    }
    const outputNodeId = recipe.output?.nodeId || recipe.nodes[recipe.nodes.length - 1]?.id;
    const output = values.get(outputNodeId);
    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      component: recipe.component || 'incentive',
      value: output?.value,
      trace: { outputNodeId, nodes: traces }
    };
  }

  function runPreset(preset, input, options) {
    const validation = validator.validatePreset(preset, input?.fields || schema.FIELD_CATALOG);
    if (!validation.valid) return { validation, per_person: [], per_job: [], totals: emptyTotals() };
    const roster = input?.roster || [];
    const jobs = input?.jobs || [];
    const tables = Object.assign({ roster, jobs }, input?.tables || {});
    const perPerson = roster.map((person) => calculatePerson(preset, person, tables, input));
    const totals = perPerson.reduce((acc, row) => {
      acc.grossIncentive += row.grossIncentive;
      acc.penalty += row.penalty;
      acc.tax += row.tax.taxOnIncentive;
      acc.netPay += row.netPay;
      if (row.netPay > 0) acc.peopleWithPay += 1;
      return acc;
    }, emptyTotals());
    return {
      schemaVersion: schema.SCHEMA_VERSION,
      preset: { id: preset.id, name: preset.name, version: preset.version, snapshot: schema.clone(preset) },
      quarter: input?.quarter || 'Q1-2026',
      generated_at: options?.generatedAt || new Date().toISOString(),
      validation,
      totals: mapMoney(totals),
      per_person: perPerson,
      per_job: jobs.map(normalizeJob)
    };
  }

  function calculatePerson(preset, person, tables, input) {
    const components = {};
    const trace = { components: [] };
    for (const recipe of (preset.recipes || []).filter((item) => item.enabled !== false)) {
      const output = executeRecipe(recipe, {
        fields: input?.fields || schema.FIELD_CATALOG,
        tables,
        currentPerson: person,
        currentRow: person
      });
      const amount = output.value;
      components[recipe.component || recipe.id] = (components[recipe.component || recipe.id] || 0) + amount;
      trace.components.push({ recipeId: recipe.id, recipeName: recipe.name, component: output.component, amount, nodes: output.trace.nodes });
    }
    const penalty = Math.abs(components.penalty || 0);
    const tax = Math.abs(components.tax || 0);
    const adjustment = components.adjustment || 0;
    const gross = Object.entries(components).filter(([key]) => !['penalty', 'tax', 'adjustment'].includes(key)).reduce((sum, entry) => sum + entry[1], 0);
    const net = round(Math.max(0, gross - penalty - tax + adjustment));
    return {
      employeeId: person['roster.employee_id'] || person.employee_id || person.id || '',
      code: person['roster.employee_id'] || person.employee_id || person.code || '',
      name: person['roster.name'] || person.name || '',
      team: person.team || '',
      calcType: person['roster.profile'] || person.profile || '',
      components,
      salesIncentive: round(components.com || components.incentive || 0),
      managerReward: round(components.manager || 0),
      kamIncentive: round(components.kae || 0),
      boIncentive: round(components.bo || components.other || 0),
      springIncentive: round(components.project || 0),
      grossIncentive: round(gross),
      penalty: round(penalty),
      tax: { taxableIncome: round(gross), totalTax: round(tax), payrollTax: 0, taxOnIncentive: round(tax) },
      otherAdjustments: adjustment,
      netPay: net,
      trace
    };
  }

  function resolveReference(ref, values, context) {
    if (ref.kind === 'node') return values.get(ref.nodeId) || { value: undefined, rows: [] };
    if (ref.kind === 'field') return { value: read(context.currentRow || context.currentPerson, ref.fieldId), rows: [] };
    return { value: coerceLiteral(ref.value, ref.type), rows: [] };
  }

  function coerceLiteral(value, type) {
    if (['Money', 'Number', 'Percent'].includes(type)) return Number(value || 0);
    if (type === 'Boolean') return value === true || String(value).toLowerCase() === 'true';
    return value;
  }
  function normalizeJob(job) {
    return {
      jobNo: read(job, 'job.id') || '',
      employeeId: read(job, 'job.owner_employee_id') || '',
      salesman: job.salesman || '',
      customer: read(job, 'job.customer') || '',
      month: Number(read(job, 'job.month') || 0),
      level: read(job, 'job.tier') || '',
      gp: round(read(job, 'job.gp')),
      gpTinh: round(read(job, 'job.gp')),
      paid: normalize(read(job, 'job.payment_status')) === 'paid',
      paymentStatus: read(job, 'job.payment_status') || ''
    };
  }
  function read(row, id) { return row?.[id] ?? row?.[String(id || '').split('.').pop()]; }
  function jobId(row) { return read(row, 'job.id') || row?.jobNo || row?.id || ''; }
  function uniqueRows(rows) { const seen = new Set(); return rows.filter((row) => { const key = jobId(row) || row; if (seen.has(key)) return false; seen.add(key); return true; }); }
  function serializable(value) { return Array.isArray(value) ? { rowCount: value.length } : value; }
  function normalize(value) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
  function round(value) { const n = Number(value || 0); return Number.isFinite(n) ? Math.round(n) : 0; }
  function emptyTotals() { return { grossIncentive: 0, penalty: 0, tax: 0, netPay: 0, peopleWithPay: 0 }; }
  function mapMoney(totals) { return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, key === 'peopleWithPay' ? value : round(value)])); }

  return { executeRecipe, runPreset };
});

