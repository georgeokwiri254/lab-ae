/* ============================================================================
 * UAE CAPITALISM LAB  -  SAVE / LOAD (plain readable JSON)
 * Desktop app: saves are JSON files in %APPDATA%/UAE Capitalism Lab/saves
 * (window.desktop from desktop/preload.js). In a plain browser they fall back
 * to localStorage slots. Any save can also be exported to / imported from a .json file.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.serialize = function () {
  var S = UAE.S;
  var goals = S.goals.map(function (g) { return { id: g.id, done: g.done, day: g.day }; });
  var copy = Object.assign({}, S, { goals: goals });
  // runtime caches (keys starting with "_", e.g. the plot index) are rebuilt after loading
  return JSON.stringify(copy, function (k, v) { return k.charAt(0) === '_' && k !== '_claims' ? undefined : v; });
};
UAE.deserialize = function (json) {
  var data = typeof json === 'string' ? JSON.parse(json) : json;
  UAE.S = data;
  var saved = data.goals || [];
  UAE.initGoals();
  UAE.S.goals.forEach(function (g) { var s = saved.find(function (x) { return x.id === g.id; }); if (s) { g.done = s.done; g.day = s.day; } });
  // migrate saves from v1.0 (no expertise / CEO policies / plots): fill in defaults
  Object.keys(UAE.S.persons).forEach(function (k) { UAE.ensurePerson(UAE.S.persons[k]); });
  UAE.allCos().forEach(function (co) { UAE.policy(co); });
  UAE.S._plotIdx = null;
  return UAE.S;
};
UAE.desktop = function () { return typeof window !== 'undefined' && window.desktop && window.desktop.isDesktop ? window.desktop : null; };
UAE.saveSlot = function (slot) {
  var json = UAE.serialize();
  var meta = JSON.stringify({ day: UAE.S.day, date: UAE.cal.label(), co: UAE.co(UAE.S.playerCo).name, saved: Date.now() });
  var D = UAE.desktop();
  if (D) return D.saveSlot(slot, json, meta);
  try {
    localStorage.setItem('uaecl_save_' + slot, json);
    localStorage.setItem('uaecl_meta_' + slot, meta);
    return true;
  } catch (e) { return false; }
};
UAE.loadSlot = function (slot) {
  try {
    var D = UAE.desktop(), j = D ? D.loadSlot(slot) : localStorage.getItem('uaecl_save_' + slot);
    if (!j) return false; UAE.deserialize(j); return true;
  } catch (e) { return false; }
};
UAE.slotMeta = function (slot) {
  try { var D = UAE.desktop(); return JSON.parse((D ? D.slotMeta(slot) : localStorage.getItem('uaecl_meta_' + slot)) || 'null'); } catch (e) { return null; }
};
