(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IncalV3 = Object.assign(root.IncalV3 || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRESET_KEY = 'incal.v3.preset.v2';
  const FORBIDDEN_KEYS = new Set(['rows', 'records', 'workbook', 'rawData', 'salaryValues']);

  function savePreset(storage, preset) {
    assertPresetSafe(preset);
    return save(storage, PRESET_KEY, preset);
  }

  function loadPreset(storage) {
    return load(storage, PRESET_KEY, null);
  }

  function serializePreset(preset) {
    assertPresetSafe(preset);
    return JSON.stringify(preset, null, 2);
  }

  function deserializePreset(text) {
    const parsed = JSON.parse(String(text || ''));
    if (Number(parsed?.schemaVersion) !== 3 || !Array.isArray(parsed?.recipes)) throw new Error('Preset JSON không đúng schema v3.');
    assertPresetSafe(parsed);
    return parsed;
  }

  function assertPresetSafe(value, path) {
    if (!value || typeof value !== 'object') return true;
    for (const [key, item] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (FORBIDDEN_KEYS.has(key)) throw new Error(`Preset không được chứa dữ liệu kỳ tại "${nextPath}".`);
      assertPresetSafe(item, nextPath);
    }
    return true;
  }

  function save(storage, key, value) {
    if (!storage?.setItem) throw new Error('Trình duyệt không cho phép lưu preset trên máy. Hãy xuất JSON để backup.');
    const text = JSON.stringify(value);
    storage.setItem(key, text);
    return text.length;
  }

  function load(storage, key, fallback) {
    if (!storage?.getItem) return fallback;
    const text = storage.getItem(key);
    if (!text) return fallback;
    try { return JSON.parse(text); }
    catch (error) { throw new Error(`Preset đã lưu bị lỗi: ${error.message}`); }
  }

  return { PRESET_KEY, savePreset, loadPreset, serializePreset, deserializePreset, assertPresetSafe };
});
