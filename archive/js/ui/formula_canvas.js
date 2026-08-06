(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FormulaCanvas = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GRID = 24;
  const MIN_ZOOM = 0.5;
  const MIN_FIT_ZOOM = 0.38;
  const MAX_ZOOM = 1.6;
  const MIN_NODE_WIDTH = 180;
  const MAX_NODE_WIDTH = 420;
  const DEFAULT_NODE_WIDTH = 220;
  const DEFAULTS = Object.freeze({ originX: 24, originY: 72, gapX: 240, gapY: 180, grid: GRID });

  function snap(value, grid) {
    const size = Number(grid || GRID);
    return Math.round(Number(value || 0) / size) * size;
  }

  function clampZoom(value) {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value) || 1));
  }

  function zoomAt(camera, nextZoom, anchor) {
    const current = clampZoom(camera?.zoom);
    const next = clampZoom(nextZoom);
    const panX = Number(camera?.x || 0);
    const panY = Number(camera?.y || 0);
    const anchorX = Number(anchor?.x || 0);
    const anchorY = Number(anchor?.y || 0);
    const worldX = (anchorX - panX) / current;
    const worldY = (anchorY - panY) / current;
    return { x: anchorX - worldX * next, y: anchorY - worldY * next, zoom: next };
  }

  function fitCamera(recipe, viewport, measure) {
    const nodes = recipe?.nodes || [];
    if (!nodes.length) return { x: 0, y: 0, zoom: 1 };
    const options = Object.assign({ width: DEFAULT_NODE_WIDTH, height: 126, padding: 52 }, measure || {});
    const positioned = nodes.map((node) => ({ point: position(node), node })).filter((item) => item.point);
    const points = positioned.map((item) => item.point);
    if (!points.length) return { x: 0, y: 0, zoom: 1 };
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...positioned.map((item) => item.point.x + (measure ? options.width : nodeWidth(item.node))));
    const maxY = Math.max(...points.map((point) => point.y + options.height));
    const contentWidth = Math.max(1, maxX - minX);
    const contentHeight = Math.max(1, maxY - minY);
    const viewWidth = Math.max(1, Number(viewport?.width || 1));
    const viewHeight = Math.max(1, Number(viewport?.height || 1));
    const zoom = Math.max(MIN_FIT_ZOOM, Math.min(MAX_ZOOM, (viewWidth - options.padding * 2) / contentWidth, (viewHeight - options.padding * 2) / contentHeight, 1));
    return {
      x: (viewWidth - contentWidth * zoom) / 2 - minX * zoom,
      y: (viewHeight - contentHeight * zoom) / 2 - minY * zoom,
      zoom
    };
  }

  function position(node) {
    const point = node?.meta?.canvas;
    return point && Number.isFinite(point.x) && Number.isFinite(point.y) ? { x: point.x, y: point.y } : null;
  }

  function setPosition(node, x, y, grid) {
    if (!node) return null;
    node.meta = Object.assign({}, node.meta || {});
    node.meta.canvas = Object.assign({}, node.meta.canvas || {}, { x: snap(x, grid), y: snap(y, grid) });
    return node.meta.canvas;
  }

  function clampNodeWidth(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return DEFAULT_NODE_WIDTH;
    return Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, Math.round(number / 12) * 12));
  }

  function nodeWidth(node) {
    return clampNodeWidth(node?.meta?.canvas?.width || DEFAULT_NODE_WIDTH);
  }

  function setNodeWidth(node, width) {
    if (!node) return DEFAULT_NODE_WIDTH;
    node.meta = Object.assign({}, node.meta || {});
    node.meta.canvas = Object.assign({}, node.meta.canvas || {}, { width: clampNodeWidth(width) });
    return node.meta.canvas.width;
  }

  function connections(recipe) {
    const result = [];
    for (const target of recipe?.nodes || []) {
      for (const [portId, ref] of Object.entries(target.inputs || {})) {
        if (ref?.kind === 'node') result.push({ sourceId: ref.nodeId, targetId: target.id, portId });
      }
    }
    return result;
  }

  function sinkNodeIds(recipe) {
    const usedAsSource = new Set(connections(recipe).map((edge) => edge.sourceId));
    return (recipe?.nodes || []).filter((node) => !usedAsSource.has(node.id)).map((node) => node.id);
  }

  function syncOutput(recipe, resolveType) {
    const sinks = sinkNodeIds(recipe);
    if (!recipe?.output) return sinks;
    if (sinks.length !== 1) {
      recipe.output.nodeId = null;
      return sinks;
    }
    const node = recipe.nodes.find((item) => item.id === sinks[0]);
    recipe.output.nodeId = node.id;
    if (resolveType) recipe.output.type = resolveType(node, recipe) || recipe.output.type;
    return sinks;
  }

  function closureMessage(recipe) {
    const sinks = sinkNodeIds(recipe);
    if (!recipe?.nodes?.length) return 'Recipe chưa có khối.';
    if (sinks.length === 1) return '';
    if (!sinks.length) return 'Công thức không có khối kết quả; hãy kiểm tra vòng lặp.';
    return `Công thức chưa khép: còn ${sinks.length} nhánh kết quả (${sinks.join(', ')}).`;
  }

  function autoArrange(recipe, options) {
    const settings = Object.assign({}, DEFAULTS, options || {});
    const nodes = recipe?.nodes || [];
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const incoming = new Map(nodes.map((node) => [node.id, 0]));
    const dependents = new Map(nodes.map((node) => [node.id, []]));
    const depth = new Map(nodes.map((node) => [node.id, 0]));

    for (const edge of connections(recipe)) {
      if (!byId.has(edge.sourceId) || !byId.has(edge.targetId)) continue;
      incoming.set(edge.targetId, incoming.get(edge.targetId) + 1);
      dependents.get(edge.sourceId).push(edge.targetId);
    }

    const queue = nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id);
    const visited = new Set();
    while (queue.length) {
      const id = queue.shift();
      visited.add(id);
      for (const targetId of dependents.get(id) || []) {
        depth.set(targetId, Math.max(depth.get(targetId), depth.get(id) + 1));
        incoming.set(targetId, incoming.get(targetId) - 1);
        if (incoming.get(targetId) === 0) queue.push(targetId);
      }
    }

    for (const node of nodes) if (!visited.has(node.id)) depth.set(node.id, 0);
    const layers = new Map();
    for (const node of nodes) {
      const layer = depth.get(node.id) || 0;
      if (!layers.has(layer)) layers.set(layer, []);
      layers.get(layer).push(node);
    }
    for (const [layer, items] of layers.entries()) {
      items.forEach((node, row) => setPosition(
        node,
        settings.originX + layer * settings.gapX,
        settings.originY + row * settings.gapY,
        settings.grid
      ));
    }
    return nodes.map((node) => ({ id: node.id, ...position(node) }));
  }

  function ensureLayout(recipe, options) {
    const nodes = recipe?.nodes || [];
    if (nodes.every((node) => position(node))) return false;
    autoArrange(recipe, options);
    return true;
  }

  function bezierPath(start, end) {
    if (!start || !end) return '';
    const distance = Math.abs(Number(end.x) - Number(start.x));
    const bend = Math.max(72, Math.min(220, distance * 0.48));
    return `M ${round(start.x)} ${round(start.y)} C ${round(start.x + bend)} ${round(start.y)}, ${round(end.x - bend)} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`;
  }

  function round(value) { return Math.round(Number(value || 0) * 10) / 10; }

  return {
    GRID,
    MIN_ZOOM,
    MIN_FIT_ZOOM,
    MAX_ZOOM,
    MIN_NODE_WIDTH,
    MAX_NODE_WIDTH,
    DEFAULT_NODE_WIDTH,
    snap,
    clampZoom,
    zoomAt,
    fitCamera,
    position,
    setPosition,
    clampNodeWidth,
    nodeWidth,
    setNodeWidth,
    connections,
    sinkNodeIds,
    syncOutput,
    closureMessage,
    autoArrange,
    ensureLayout,
    bezierPath
  };
});
