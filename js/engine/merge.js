/* ============================================================================
 * UAE CAPITALISM LAB  -  MERGE DUPLICATE FIRMS (fewer firms = faster game, same business)
 * The simulation cost grows with the number of firms. Many of a big empire's firms are copies:
 *   software studios of the same title, internet platforms of the same model (their world revenue is split
 *   over the copies anyway), idle R&D labs with the same target in the same city, factories making the same
 *   single product in the same city, data centres in the same city, street stores with the same product range
 *   in the same district.
 * UAE.mergePlan(co) lists the groups; UAE.mergeFirms(co, kinds) merges each group into its biggest firm:
 *   size adds up, buildings & land (book value), stock, subscribers / users / servers and the month's running
 *   totals move to the survivor; suppliers and input links pointing at a merged firm now point at the survivor;
 *   a running research project moves over if the survivor has none. The balance sheet does not change.
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.MERGE_KINDS = {
  sw: { label: 'Software studios (same title)', key: function (f) { return f.type === 'software' && f.lines.length ? 'sw|' + UAE.swPid(f) : null; } },
  net: { label: 'Internet platforms (same model)', key: function (f) { return f.type === 'internet' ? 'net|' + (f.model || 'ecommerce') : null; } },
  rnd: { label: 'Idle R&D labs (same target, same city)', key: function (f) { return f.type === 'rnd' && !f.project && !f.futFor && !f.entryFor ? 'rnd|' + f.target + '|' + f.city : null; } },
  fac: { label: 'Factories (same product, same city)', key: function (f) { return f.type === 'factory' && f.lines.length === 1 && !f.project ? 'fac|' + f.lines[0].pid + '|' + f.city : null; } },
  dc: { label: 'Data centres (same city)', key: function (f) { return f.type === 'datacenter' ? 'dc|' + f.city : null; } },
  ret: { label: 'Street stores (same products, same district)', key: function (f) { return f.type === 'retail' && f.lines.length ? 'ret|' + f.district + '|' + f.lines.map(function (l) { return l.pid; }).sort().join(',') : null; } }
};
UAE.MERGE_MAX_SIZE = 200;
UAE.MERGE_SUM = ['subs', 'users', 'gmv', 'members', 'servers', 'serverTarget', 'rented', 'ownUse', 'worldRev', 'worldUnits', 'worldUsers', 'online'];

/** Groups of mergeable firms of a company: { kind: [[survivor, ...others]] }. Only open, non-seed, non-mall firms. */
UAE.mergePlan = function (co, kinds) {
  var ks = kinds || Object.keys(UAE.MERGE_KINDS), g = {};
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status !== 'open' || f.seed || f.mall || f.deposit || f.lease) return;
    for (var i = 0; i < ks.length; i++) { var k = UAE.MERGE_KINDS[ks[i]].key(f); if (k) { (g[ks[i] + '#' + k] = g[ks[i] + '#' + k] || []).push(f); break; } }
  });
  var out = {}; ks.forEach(function (k) { out[k] = []; });
  Object.keys(g).forEach(function (k) {
    var list = g[k]; if (list.length < 2) return;
    list.sort(function (a, b) { return (b.size - a.size) || ((b.last && b.last.rev || 0) - (a.last && a.last.rev || 0)); });
    out[k.split('#')[0]].push(list);
  });
  return out;
};

/** Move firm g into survivor s (same owner). */
UAE.absorbFirm = function (s, g) {
  var S = UAE.S;
  if (s.size + g.size > UAE.MERGE_MAX_SIZE) return false;
  s.size += g.size; s.ppe += g.ppe || 0; s.land += g.land || 0;
  s.quality = s.quality != null && g.quality != null ? Math.max(s.quality, g.quality) : s.quality;
  s.eff = Math.max(s.eff || 1, g.eff || 1); s.training = Math.max(s.training || 0, g.training || 0);
  s.adBudget = (s.adBudget || 0) + (g.adBudget || 0); s.trainBudget = (s.trainBudget || 0) + (g.trainBudget || 0);
  UAE.MERGE_SUM.forEach(function (k) { if (typeof g[k] === 'number') s[k] = (s[k] || 0) + g[k]; });
  // stock: quantities add, cost & quality weighted
  for (var pid in g.stock) {
    var a = s.stock[pid], b = g.stock[pid]; if (!b || !(b.q > 0)) continue;
    if (!a) { s.stock[pid] = { q: b.q, cost: b.cost, qual: b.qual }; continue; }
    var q = a.q + b.q; a.cost = (a.cost * a.q + b.cost * b.q) / q; a.qual = ((a.qual || 0) * a.q + (b.qual || 0) * b.q) / q; a.q = q;
  }
  // line counters
  g.lines.forEach(function (lg) {
    var ls = s.lines.find(function (l) { return l.pid === lg.pid; }); if (!ls) return;
    ['sold', 'made', 'exported', 'worldSold'].forEach(function (k) { if (typeof lg[k] === 'number') ls[k] = (ls[k] || 0) + lg[k]; });
    if (lg.inSup && !ls.inSup) ls.inSup = lg.inSup;
  });
  // this month's running totals (firm P&L for the month-end statements)
  ['m', 'last'].forEach(function (o) { if (g[o] && s[o]) for (var k in g[o]) if (typeof g[o][k] === 'number') s[o][k] = (s[o][k] || 0) + g[o][k]; });
  // research: a running project moves over when the survivor has none, otherwise it is cancelled (money already spent stays spent)
  if (g.project) { if (!s.project && s.type === g.type) { s.project = g.project; if (g.target) s.target = g.target; } else if (UAE.actRAdj) UAE.actRAdj(g.owner, g.project.pid, -1); g.project = null; }
  if (g.manager && UAE.person(g.manager)) { if (!s.manager) { s.manager = g.manager; } else { var mp = UAE.person(g.manager); mp.title = 'Candidate'; mp.co = null; } }
  return true;
};

/** Merge the planned groups. Returns { removed, byKind }. */
UAE.mergeFirms = function (co, kinds) {
  var plan = UAE.mergePlan(co, kinds), gone = {}, res = { removed: 0, byKind: {} };
  Object.keys(plan).forEach(function (k) {
    var n = 0;
    plan[k].forEach(function (list) {
      var s = list[0];
      for (var i = 1; i < list.length; i++) if (UAE.absorbFirm(s, list[i])) { gone[list[i].id] = s.id; n++; }
      if (UAE.nameSync) UAE.nameSync(s);
    });
    res.byKind[k] = n; res.removed += n;
  });
  if (!res.removed) return res;
  // suppliers / input links / mall references now point at the survivor; then remove the merged firms
  UAE.allFirms().forEach(function (f) {
    if (gone[f.id]) return;
    f.lines.forEach(function (l) {
      if (l.supplier && gone[l.supplier]) l.supplier = gone[l.supplier];
      if (l.inSup) for (var p in l.inSup) if (gone[l.inSup[p]]) l.inSup[p] = gone[l.inSup[p]];
    });
  });
  Object.keys(gone).forEach(function (id) {
    var f = UAE.S.firms[id]; if (!f) return;
    if (UAE.plotRemove) UAE.plotRemove(f);
    delete UAE.S.firms[id];
  });
  UAE._idx = UAE._idx ? {} : UAE._idx;                 // per-day caches rebuild from the new firm list
  UAE._wmAct = null; if (UAE.allCos) UAE.allCos().forEach(function (c) { if (c.invA) c.invA.day = -1e9; });
  co.mergeLog = co.mergeLog || []; co.mergeLog.unshift({ day: UAE.S.day, removed: res.removed, byKind: res.byKind });
  UAE.news('🧩 ' + co.name + ' merged ' + res.removed + ' duplicate firms into bigger ones (same capacity, buildings and stock; fewer firms to run).', 'firm');
  return res;
};
/** All your companies at once. */
UAE.mergeAllMine = function (kinds) {
  var tot = { removed: 0, byKind: {} };
  UAE.allCos().forEach(function (c) {
    if (!UAE.isHuman(c) || c.foreign) return;
    var r = UAE.mergeFirms(c, kinds); tot.removed += r.removed;
    for (var k in r.byKind) tot.byKind[k] = (tot.byKind[k] || 0) + r.byKind[k];
  });
  return tot;
};
