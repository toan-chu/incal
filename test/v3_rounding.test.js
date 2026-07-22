// Khoá chính sách làm tròn: các khối tiền GIỮ SỐ LẺ nội bộ, chỉ tròn VND ở đầu ra.
// Bảo vệ khớp cách kế toán/FIN tính (tròn 1 lần cuối), tránh lệch ±1đ do tròn giữa chừng.
// Nguồn: [COWORK-EXEC] 2026-07-22 — đối chiếu 5 người COM thật, 5/5 lệch=0.
const test = require('node:test');
const assert = require('node:assert/strict');
const schema = require('../js/core/schema');
const engine = require('../js/core/engine');

const L = (type, value) => ({ kind: 'literal', type, value });

function recipe(node) {
  return schema.createRecipe({ id: node.blockId, nodes: [node], output: { nodeId: node.id, type: 'Money' } });
}

test('Waterfall giữ số lẻ (không làm tròn giữa chừng)', () => {
  const r = recipe({ id: 'm', blockId: 'macro.waterfall', inputs: {
    gpLevel1: L('Money', 0), gpLevel2: L('Money', 149670493), gpLevel3: L('Money', 50250084),
    target: L('Money', 72000000), adjustment: L('Percent', -0.01)
  }, config: { rates: [0.08, 0.12, 0.17] } });
  // 77.670.493×11% + 50.250.084×16% = 8.543.754,23 + 8.040.013,44 = 16.583.767,67
  const v = engine.executeRecipe(r, { tables: {} }).value;
  assert.ok(Math.abs(v - 16583767.67) < 0.005, `waterfall = ${v}, kỳ vọng 16583767.67`);
});

test('% của và Quét+Tổng giữ số lẻ', () => {
  const pct = recipe({ id: 'p', blockId: 'percent_of', inputs: { base: L('Money', 22309097), rate: L('Percent', 0.1) }, config: {} });
  assert.equal(engine.executeRecipe(pct, { tables: {} }).value, 2230909.7);
});
