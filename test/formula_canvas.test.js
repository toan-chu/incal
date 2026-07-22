const test = require('node:test');
const assert = require('node:assert/strict');
const Canvas = require('../js/ui/formula_canvas');
const schema = require('../js/core/schema');
const validator = require('../js/core/validator');

function graphRecipe() {
  return schema.createRecipe({
    id: 'graph', component: 'demo',
    nodes: [
      { id: 'money', blockId: 'lookup', inputs: { key: { kind: 'literal', type: 'Text', value: 'A' } }, config: { returnType: 'Money' } },
      { id: 'rate', blockId: 'time_weight', inputs: { month: { kind: 'literal', type: 'Number', value: 1 } }, config: { activeMonths: [1] } },
      { id: 'result', blockId: 'percent_of', inputs: { base: { kind: 'node', nodeId: 'money' }, rate: { kind: 'node', nodeId: 'rate' } }, config: {} }
    ],
    output: { nodeId: 'result', type: 'Money' }
  });
}

test('canvas auto-arranges dependencies on a snapped left-to-right grid and persists metadata', () => {
  const recipe = graphRecipe();
  assert.equal(Canvas.ensureLayout(recipe), true);
  const money = Canvas.position(recipe.nodes[0]);
  const rate = Canvas.position(recipe.nodes[1]);
  const result = Canvas.position(recipe.nodes[2]);
  assert.equal(money.x % Canvas.GRID, 0);
  assert.equal(result.x % Canvas.GRID, 0);
  assert.ok(result.x > money.x);
  assert.equal(rate.x, money.x);
  const roundTrip = schema.createRecipe(JSON.parse(JSON.stringify(recipe)));
  assert.deepEqual(Canvas.position(roundTrip.nodes[2]), result);
  assert.equal(Canvas.ensureLayout(roundTrip), false);
});

test('sink detection chooses one automatic output and reports hanging branches', () => {
  const recipe = graphRecipe();
  assert.deepEqual(Canvas.sinkNodeIds(recipe), ['result']);
  Canvas.syncOutput(recipe, () => 'Money');
  assert.equal(recipe.output.nodeId, 'result');
  recipe.nodes.push({ id: 'hanging', blockId: 'round_vnd', inputs: { value: { kind: 'literal', type: 'Money', value: 0 } }, config: {} });
  assert.deepEqual(Canvas.sinkNodeIds(recipe), ['result', 'hanging']);
  assert.match(Canvas.closureMessage(recipe), /2 nhánh kết quả/);
  Canvas.syncOutput(recipe, () => 'Money');
  assert.equal(recipe.output.nodeId, null);
});

test('bezier path is curved and validator rejects Money into Percent plus cycles', () => {
  assert.match(Canvas.bezierPath({ x: 0, y: 24 }, { x: 300, y: 120 }), /^M 0 24 C .+ 300 120$/);
  const mismatch = graphRecipe();
  mismatch.nodes[2].inputs.rate = { kind: 'node', nodeId: 'money' };
  const mismatchValidation = validator.validateRecipe(mismatch, []);
  assert.ok(mismatchValidation.errors.some((item) => item.code === 'TYPE_MISMATCH' && item.nodeId === 'result' && item.portId === 'rate'));
  const cycle = graphRecipe();
  cycle.nodes[0].inputs.key = { kind: 'node', nodeId: 'result' };
  assert.ok(validator.validateRecipe(cycle, []).errors.some((item) => item.code === 'CYCLE'));
});

test('zoom camera clamps, keeps the anchor stable and fits node bounds', () => {
  assert.equal(Canvas.clampZoom(0.1), 0.5);
  assert.equal(Canvas.clampZoom(4), 1.6);
  const camera = Canvas.zoomAt({ x: 20, y: 30, zoom: 1 }, 1.5, { x: 220, y: 180 });
  assert.deepEqual(camera, { x: -80, y: -45, zoom: 1.5 });
  assert.equal((220 - camera.x) / camera.zoom, 200, 'world x under cursor stays fixed');
  assert.equal((180 - camera.y) / camera.zoom, 150, 'world y under cursor stays fixed');

  const recipe = graphRecipe();
  Canvas.autoArrange(recipe);
  const fitted = Canvas.fitCamera(recipe, { width: 800, height: 500 });
  assert.ok(fitted.zoom >= Canvas.MIN_FIT_ZOOM && fitted.zoom <= 1);
  assert.ok(Number.isFinite(fitted.x) && Number.isFinite(fitted.y));

  const wideRecipe = graphRecipe();
  wideRecipe.nodes.forEach((node, index) => Canvas.setPosition(node, index * 900, 0));
  const wideFit = Canvas.fitCamera(wideRecipe, { width: 960, height: 540 });
  assert.ok(wideFit.zoom < Canvas.MIN_ZOOM, 'Fit may zoom farther out than manual controls so edge nodes stay visible');
  const left = wideFit.x;
  const right = wideFit.x + (1800 + Canvas.nodeWidth(wideRecipe.nodes[2])) * wideFit.zoom;
  assert.ok(left >= 0 && right <= 960, `fitted graph must stay inside viewport: ${left}..${right}`);
});

test('node width is clamped, snapped and survives position updates', () => {
  const node = { meta: { canvas: { x: 24, y: 48 } } };
  assert.equal(Canvas.setNodeWidth(node, 347), 348);
  Canvas.setPosition(node, 71, 95);
  assert.deepEqual(node.meta.canvas, { x: 72, y: 96, width: 348 });
  assert.equal(Canvas.setNodeWidth(node, 40), Canvas.MIN_NODE_WIDTH);
  assert.equal(Canvas.setNodeWidth(node, 900), Canvas.MAX_NODE_WIDTH);
});
