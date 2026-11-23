/* ============================================================================
 * UAE CAPITALISM LAB  -  DAILY MICRO SIMULATION
 * Order of one day (master_v3 §13.5 / F9.1):
 *   1 construction   2 production (farm/mine/oil/factory)   3 retail sales
 *   4 retail & warehouse purchasing   5 B2B + export sales
 *   6 services / hotels / real estate / media / digital / banks / insurance
 *   7 fixed costs (wages, DEWA-tariff utilities, ads, training, maintenance)
 *   8 legacy core business of real groups   9 brand & technology drift
 * Month/year closing, macro, markets and AI live in macro.js / market.js / ai.js
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* ------------------------------------------------ firm-level bookkeeping */
UAE.fIncome = function (f, line, amt) { UAE.L.income(UAE.co(f.owner), line, amt); f.m.rev += amt; };
UAE.fExpense = function (f, line, amt) {
  UAE.L.expense(UAE.co(f.owner), line, amt); f.m.cost += amt;
  if (line === 'salaries' || line === 'rnd' || line === 'training') f.m.wage = (f.m.wage || 0) + amt;   // paid to people: part of value added
  else if (line === 'interestExp') f.m.int = (f.m.int || 0) + amt;                                      // interest: a distribution of profit, not a purchase
};
UAE.fCogs = function (f, amt) { UAE.L.cogs(UAE.co(f.owner), amt); f.m.cost += amt; };

/* ------------------------------------------------------- stock helpers */
UAE.stockAdd = function (f, pid, q, unitCost, qual) {
  if (q <= 0) return;
  var s = f.stock[pid] || (f.stock[pid] = { q: 0, cost: 0, qual: 50 });
  var tot = s.q + q;
  s.cost = (s.q * s.cost + q * unitCost) / tot;
  s.qual = (s.q * s.qual + q * (qual == null ? 50 : qual)) / tot;
  s.q = tot;
};
/** Remove q units; returns cost basis removed. */
UAE.stockTake = function (f, pid, q) {
  var s = f.stock[pid]; if (!s || q <= 0) return 0;
  q = Math.min(q, s.q); s.q -= q; var c = q * s.cost;
  if (s.q < 1e-6) { delete f.stock[pid]; }
  return c;
};
UAE.stockQ = function (f, pid) { return f.stock[pid] ? f.stock[pid].q : 0; };

/* ------------------------------------------------------- price helpers */
/** Current world price of a product, applying oil/gold shocks. */
UAE.worldPrice = function (pid) {
  var P = UAE.P[pid], m = UAE.S.macro, base = P.world || P.imp;
  if (['crude','petrol','jetfuel','gas','polymer','urea'].indexOf(pid) >= 0) base *= m.oil;
  if (pid === 'gold' || pid === 'jewelry') base *= m.gold;
  return base;
};
UAE.importBase = function (pid) {
  var P = UAE.P[pid], m = UAE.S.macro, base = P.imp;
  if (['crude','petrol','jetfuel','gas','polymer','urea'].indexOf(pid) >= 0) base *= m.oil;
  if (pid === 'gold' || pid === 'jewelry') base *= m.gold;
  return base;
};
/** Freight cost per unit between two points (EST road tariff; own logistics firm -25%). */
UAE.freight = function (pid, a, b, coId, city) {
  var P = UAE.P[pid], km = UAE.geo.km(a, b) * 1.25 + 3;   // road factor
  var cost = P.t * km * UAE.RULES.freightPerTonKm;
  if (coId && UAE.hasFirmIn(coId, 'logistics', city)) cost *= 0.75;
  return cost;
};
/* Per-day lookup cache (UAE._idx exists only while UAE.tick runs, so screens always see live data).
 * Built once per game day instead of scanning every firm on every call - big saves have thousands. */
UAE.dayIdx = function () {
  var X = UAE._idx; if (!X) return null;
  if (!X.has) {
    var has = {}, prod = {}, F = UAE.S.firms, KINDS = ['factory','farm','mine','oil','warehouse','software'];
    for (var k in F) {
      var f = F[k]; if (f.status !== 'open') continue;
      has[f.owner + '|' + f.type + '|' + f.city] = 1;
      has[f.owner + '|' + f.type + '|@' + UAE.CITIES[f.city].emirate] = 1;
      has[f.owner + '|' + f.type] = 1;
      if (KINDS.indexOf(UAE.FIRM_TYPES[f.type].kind) < 0) continue;
      f.lines.forEach(function (l) { (prod[l.pid] = prod[l.pid] || []).push(f); });
    }
    X.has = has; X.prod = prod;
  }
  return X;
};
/** Keep the per-day cache in step when a firm is built or removed mid-day (instead of rebuilding it all).
 *  Only these keys are updated in place; every other cached grouping is dropped and rebuilt on demand. */
UAE.IDX_KEEP = ['has', 'prod', 'sup', 'all', 'own', 'gw', 'typeCity', 'ownTypeCity'];   // typeCity / ownTypeCity: UAE.cityAppeal (engine/execs.js)
UAE.idxFirmChanged = function (f, removed) {
  var X = UAE._idx; if (!X) return;
  var keep = {}; UAE.IDX_KEEP.forEach(function (k) { if (X[k]) keep[k] = X[k]; });
  UAE._idx = keep; X = keep;
  var T = UAE.FIRM_TYPES[f.type], prodKind = ['factory','farm','mine','oil','warehouse','software'].indexOf(T.kind) >= 0;
  if (!removed) {
    if (f.status !== 'closed') {
      if (X.typeCity) (X.typeCity[f.type + '|' + f.city] = X.typeCity[f.type + '|' + f.city] || []).push(f);
      if (X.ownTypeCity) (X.ownTypeCity[f.owner + '|' + f.type + '|' + f.city] = X.ownTypeCity[f.owner + '|' + f.type + '|' + f.city] || []).push(f);
    }
    if (X.all) X.all.push(f);
    if (X.own) (X.own[f.owner] = X.own[f.owner] || []).push(f);
    if (X.has && f.status === 'open') {
      X.has[f.owner + '|' + f.type + '|' + f.city] = 1; X.has[f.owner + '|' + f.type + '|@' + UAE.CITIES[f.city].emirate] = 1; X.has[f.owner + '|' + f.type] = 1;
    }
    if (X.prod && prodKind && f.status === 'open') f.lines.forEach(function (l) {
      (X.prod[l.pid] = X.prod[l.pid] || []).push(f);
      var L = X.sup && X.sup[l.pid];
      if (L) L.push({ g: f, line: l, nm: f.name + ' - ' + UAE.co(f.owner).name, own: f.name + ' (own)' });
      if (X.supBy) delete X.supBy[l.pid];          // owner grouping of procureCheapest is rebuilt from the new list
    });
    return;
  }
  var not = function (g) { return g !== f; };
  [['typeCity', f.type + '|' + f.city], ['ownTypeCity', f.owner + '|' + f.type + '|' + f.city]].forEach(function (x) { var G = X[x[0]]; if (G && G[x[1]]) G[x[1]] = G[x[1]].filter(not); });
  if (X.all) X.all = X.all.filter(not);
  if (X.own && X.own[f.owner]) X.own[f.owner] = X.own[f.owner].filter(not);
  if (X.prod) for (var p in X.prod) if (X.prod[p].indexOf(f) >= 0) X.prod[p] = X.prod[p].filter(not);
  if (X.sup) for (var q in X.sup) X.sup[q] = X.sup[q].filter(function (e) { return e.g !== f; });
  if (X.supBy) X.supBy = {};
  if (X.gw) delete X.gw[f.id];
  if (X.has) {   // recompute this owner's keys for the firm's type
    var mine = (X.own ? X.own[f.owner] : UAE.firmsOf(f.owner)).filter(function (g) { return g.type === f.type && g.status === 'open' && g !== f; });
    delete X.has[f.owner + '|' + f.type + '|' + f.city]; delete X.has[f.owner + '|' + f.type + '|@' + UAE.CITIES[f.city].emirate]; delete X.has[f.owner + '|' + f.type];
    mine.forEach(function (g) { X.has[g.owner + '|' + g.type + '|' + g.city] = 1; X.has[g.owner + '|' + g.type + '|@' + UAE.CITIES[g.city].emirate] = 1; X.has[g.owner + '|' + g.type] = 1; });
  }
};
UAE.hasFirmIn = function (coId, type, city, emirate) {
  var X = UAE.dayIdx();
  if (X) return !!X.has[coId + '|' + type + (city ? '|' + city : emirate ? '|@' + emirate : '')] &&
    (!city || !emirate || UAE.CITIES[city].emirate === emirate);
  var F = UAE.S.firms;
  for (var k in F) {
    var f = F[k];
    if (f.owner === coId && f.type === type && f.status === 'open' &&
        (!city || f.city === city) && (!emirate || UAE.CITIES[f.city].emirate === emirate)) return true;
  }
  return false;
};
/** Landed cost of importing one unit to a firm: CIF + 5% customs + importer margin + freight. */
UAE.landedImport = function (pid, f) {
  var X = UAE._idx, gw;
  if (X) { var GW = X.gw || (X.gw = {}); gw = GW[f.id] || (GW[f.id] = UAE.geo.nearestGateway(f.c)); }
  else gw = UAE.geo.nearestGateway(f.c);
  var em = UAE.CITIES[f.city].emirate;
  var margin = UAE.hasFirmIn(f.owner, 'importer', null, em) ? 0.0 : 0.06;
  var unit = UAE.importBase(pid) * (1 + UAE.RULES.customs) * (1 + margin);
  var fr = UAE.P[pid].t * (gw.km * 1.25 + 3) * UAE.RULES.freightPerTonKm;
  return { unit: unit + fr, freight: fr, gateway: gw.gw.name, quality: UAE.P[pid].qImp };
};

/** All supply options for product pid delivered to firm f, cheapest first.
 *  stocked = true (game-day callers that only use IMPORT or suppliers with stock): skips empty suppliers. */
UAE.supplyOptions = function (f, pid, stocked) {
  var out = [], imp = UAE.landedImport(pid, f);
  out.push({ id: 'IMPORT', name: 'Import via ' + imp.gateway, unit: imp.unit, quality: imp.quality, avail: Infinity, owner: null });
  var X = UAE.dayIdx();
  if (X) {   // fast path during a game day: supplier line + names prepared once per product
    var info = X.sup || (X.sup = {}), L = info[pid];
    if (!L) {
      L = info[pid] = [];
      (X.prod[pid] || []).forEach(function (g) {
        if (g.status !== 'open') return;
        var line = g.lines.find(function (l) { return l.pid === pid; }); if (!line) return;
        L.push({ g: g, line: line, nm: g.name + ' - ' + UAE.co(g.owner).name, own: g.name + ' (own)' });
      });
    }
    var P = UAE.P[pid], perKm = P.t * UAE.RULES.freightPerTonKm, logi = f.owner && UAE.hasFirmIn(f.owner, 'logistics', f.city) ? 0.75 : 1;
    for (var i = 0; i < L.length; i++) {
      var e = L[i], g = e.g; if (g.id === f.id || g.status !== 'open') continue;
      var s = g.stock[pid]; if (stocked && !(s && s.q > 0)) continue;
      var same = g.owner === f.owner, km = UAE.geo.km(g.c, f.c);
      var unit = (same ? (s ? s.cost : UAE.importBase(pid)) : e.line.price) + perKm * (km * 1.25 + 3) * logi;   // = UAE.freight
      out.push({ id: g.id, name: same ? e.own : e.nm, unit: unit, quality: s ? s.qual : 50, avail: s ? s.q : 0, owner: g.owner, km: km });
    }
    out.sort(function (a, b) { return a.unit - b.unit; });
    return out;
  }
  var pool = UAE.allFirms();
  pool.forEach(function (g) {
    if (g.id === f.id || g.status !== 'open') return;
    var k = UAE.FIRM_TYPES[g.type].kind;
    if (['factory','farm','mine','oil','warehouse','software'].indexOf(k) < 0) return;
    var line = g.lines.find(function (l) { return l.pid === pid; });
    if (!line) return;
    var s = g.stock[pid], same = g.owner === f.owner;
    var unit = (same ? (s ? s.cost : UAE.importBase(pid)) : line.price) + UAE.freight(pid, g.c, f.c, f.owner, f.city);
    out.push({ id: g.id, name: g.name + (same ? ' (own)' : ' - ' + UAE.co(g.owner).name), unit: unit,
      quality: s ? s.qual : 50, avail: s ? s.q : 0, owner: g.owner, km: UAE.geo.km(g.c, f.c) });
  });
  out.sort(function (a, b) { return a.unit - b.unit; });
  return out;
};

/** Buy `need` units of pid for firm f from stocked suppliers: own firms first, then other companies, cheapest
 *  delivered price first (exactly the order of supplyOptions + sort), without building and sorting the whole list:
 *  usually one or two suppliers fill the order. Game-day only (uses the per-day index). Returns the unfilled need. */
UAE.procureCheapest = function (f, pid, need, pick) {
  var X = UAE.dayIdx(); if (!X) return need;
  if (!(X.sup && X.sup[pid])) UAE.supplyOptions(f, pid, true);          // builds X.sup[pid]
  var L = X.sup[pid] || [], P = UAE.P[pid], perKm = P.t * UAE.RULES.freightPerTonKm, logi = f.owner && UAE.hasFirmIn(f.owner, 'logistics', f.city) ? 0.75 : 1;
  // PERF (same picks, same order as scanning the whole list): suppliers grouped by owner once per day, so the
  // own-supplier pass only looks at our own firms; the market is scanned only if own stock did not fill the order.
  // Market prices/stock are read after our own purchases, which never change another company's stock or price.
  var BY = X.supBy || (X.supBy = {}), byO = BY[pid];
  if (!byO) { byO = BY[pid] = {}; for (var q = 0; q < L.length; q++) (byO[L[q].g.owner] || (byO[L[q].g.owner] = [])).push(L[q]); }
  var unit = function (e, same) { var s = e.g.stock[pid]; return (same ? s.cost : e.line.price) + perKm * (UAE.geo.km(e.g.c, f.c) * 1.25 + 3) * logi; };
  var ok = function (g) { if (g.id === f.id || g.status !== 'open') return false; var s = g.stock[pid]; return !!(s && s.q > 0); };
  var picked = null;
  if (pick) { var pg = UAE.S.firms[pick], pl = pg && byO[pg.owner];
    if (pl && ok(pg) && pl.some(function (e) { return e.g === pg; })) { picked = pg; need -= UAE.procure(f, pid, need, pick); } }   // the chosen supplier first
  // one pass: build the candidate list (snapshot of delivered cost), then take the cheapest until the need is met
  var run = function (list, same) {
    var cu = [], cg = [];
    for (var i = 0; i < list.length; i++) { var e = list[i], g = e.g; if (g === picked || (g.owner === f.owner) !== same || !ok(g)) continue; cu.push(unit(e, same)); cg.push(g); }
    var used = new Uint8Array(cu.length);
    while (need > 0) {
      var bi = -1;
      for (var j = 0; j < cu.length; j++) if (!used[j] && (bi < 0 || cu[j] < cu[bi])) bi = j;
      if (bi < 0) break;
      used[bi] = 1; need -= UAE.procure(f, pid, need, cg[bi].id);
    }
  };
  if (need > 0 && byO[f.owner]) run(byO[f.owner], true);
  if (need > 0) run(L, false);
  return need;
};
/** Store supplier choice (AI / CEO review): same result as supplyOptions(f, pid, true) + firstStocked + the
 *  'own' and best-value rules, but without building and sorting the whole list. mode: 'own' or anything else
 *  except 'quality' (that one walks the sorted list, so it keeps the original code). Returns { id, unit }. Game-day only. */
UAE.retailSupplier = function (f, l, coId, mode) {
  var X = UAE.dayIdx(), pid = l.pid; if (!X) return null;
  if (!(X.sup && X.sup[pid])) UAE.supplyOptions(f, pid, true);
  var L = X.sup[pid] || [], P = UAE.P[pid], perKm = P.t * UAE.RULES.freightPerTonKm, logi = f.owner && UAE.hasFirmIn(f.owner, 'logistics', f.city) ? 0.75 : 1;
  var imp = UAE.landedImport(pid, f), capx = UAE.lineCap(f, l) * 3;
  // candidate 0 = IMPORT (first before the sort, so it wins ties), then the stocked suppliers in list order
  var best = { id: 'IMPORT', unit: imp.unit, quality: imp.quality, ok: true, i: 0 }, own = null, n = 1, cands = [best];
  for (var i = 0; i < L.length; i++) {
    var g = L[i].g; if (g.id === f.id || g.status !== 'open') continue;
    var s = g.stock[pid]; if (!(s && s.q > 0)) continue;
    var same = g.owner === f.owner;
    var o = { id: g.id, unit: (same ? s.cost : L[i].line.price) + perKm * (UAE.geo.km(g.c, f.c) * 1.25 + 3) * logi, quality: s.qual, ok: s.q > capx, i: n++ };
    cands.push(o);
    if (o.unit < best.unit) best = o;                                                     // = firstStocked (cheapest; earlier wins ties)
    if (g.owner === coId && (!own || o.unit < own.unit)) own = o;
  }
  if (mode === 'own' && own && own.unit < best.unit * 1.25) return own;
  // best value: unit / quality; walking the sorted list keeps the first strictly better one
  var r = function (o) { return o.unit / Math.max(30, o.quality); }, rb = r(best), win = null, rw = Infinity;
  for (var j = 0; j < cands.length; j++) {
    var c = cands[j]; if (!c.ok) continue;
    var rc = r(c);
    if (rc < rw || (rc === rw && (c.unit < win.unit || (c.unit === win.unit && c.i < win.i)))) { win = c; rw = rc; }
  }
  if (!win || !(rw < rb)) return best;
  return win;
};
/** Move q units of pid from a supplier into firm f, paying as appropriate. Returns units delivered. */
UAE.procure = function (f, pid, q, supplierId) {
  if (q <= 0) return 0;
  var buyer = UAE.co(f.owner);
  if (!supplierId || supplierId === 'IMPORT' || !UAE.S.firms[supplierId]) {
    var imp = UAE.landedImport(pid, f);
    var cost = imp.unit * q;
    UAE.L.buyInventory(buyer, cost);
    UAE.stockAdd(f, pid, q, imp.unit, imp.quality);
    UAE.S.freightPool[f.city] = (UAE.S.freightPool[f.city] || 0) + imp.freight * q;
    // customs duty flows to the federal/emirate budget (reported at city level)
    UAE.S.cities[f.city].govRevYtd += UAE.importBase(pid) * UAE.RULES.customs * q;
    UAE.S.cities[f.city].importsM = (UAE.S.cities[f.city].importsM || 0) + UAE.importBase(pid) * q;   // city graphs: imports
    return q;
  }
  var g = UAE.S.firms[supplierId], s = g.stock[pid];
  if (!s || s.q <= 0) return 0;
  q = Math.min(q, s.q);
  var qual = s.qual, fr = UAE.freight(pid, g.c, f.c, f.owner, f.city);
  var basis = UAE.stockTake(g, pid, q);
  UAE.S.freightPool[f.city] = (UAE.S.freightPool[f.city] || 0) + fr * q;
  if (g.owner === f.owner) {                 // internal transfer at cost on company books (consolidates cleanly)
    UAE.L.buyInventory(buyer, fr * q);       // freight paid in cash, capitalised into stock
    UAE.stockAdd(f, pid, q, basis / q + fr, qual);
    var gl = g.lines.find(function (l) { return l.pid === pid; }); if (gl) gl.sold += q;   // counts as delivered this month
    // Cost-plus overhead internal transfer pricing for firm-level P&L (like Data Centres -> AI Labs):
    // covers the supplying factory/farm/mine/warehouse's fixed overhead + 20% margin without squeezing
    // downstream factories, warehouses or stores with full retail markups. Company ledger untouched; nets to 0.
    if (f.type !== 'datacenter' && f.type !== 'warehouse' && g.type !== 'software') {
      var unitCost = basis / q, Tg = UAE.FIRM_TYPES[g.type], Cg = UAE.CITIES[g.city], cg = UAE.S.cities[g.city];
      var staffG = Tg.staff * (1 + 0.8 * (g.size - 1)), nLines = Math.max(1, g.lines.length);
      var fixedM = staffG * Cg.wage * (cg ? cg.wageIdx : 1) * Tg.wageMult + (g.ppe || 0) * (0.012 / 12 + 1 / (UAE.RULES.depreciationYears * 12)) + (Tg.kwh || 0) * (1 + 0.8 * (g.size - 1)) * 0.44;
      var P0 = UAE.P[pid], capM = 0;
      if (Tg.kind === 'factory' && P0 && P0.rec) capM = P0.rec.cap * (1 + 0.8 * (g.size - 1)) * (g.eff || 1) * 1.5 / nLines * 30;
      else if (Tg.kind === 'farm' && UAE.FARM[pid]) capM = UAE.FARM[pid].out * Math.max((cg && cg.cpiIdx || 100) / 100, cg && cg.wageIdx || 1) * g.size * (g.eff || 1) / nLines * 30;
      else if ((Tg.kind === 'mine' || Tg.kind === 'oil') && UAE.RESOURCE[pid]) capM = UAE.RESOURCE[pid].out * g.size * (g.eff || 1) * 30;
      else capM = Math.max(1, 2.5e6 * g.size / Math.max(1, unitCost) * 4);
      var refPx = gl && gl.price > 0 ? gl.price : unitCost * 1.15;
      var impCap = UAE.landedImport(pid, f).unit * (g.type === 'warehouse' ? 1.0 : 0.95);
      var maxMarkup = Math.max(0, Math.min(refPx, impCap) - unitCost);
      var markup = maxMarkup;   // internal sales at FULL market price (supplier's price, capped at the landed import price) - user's choice 2026-11-22
      if (markup > 0) {
        g.m.rev += (unitCost + markup) * q; g.m.cost += basis;
        f.m.cost += markup * q;
      }
    }
  } else {                                   // arm's-length sale
    var line = g.lines.find(function (l) { return l.pid === pid; });
    var price = line ? line.price : basis / q;
    UAE.fIncome(g, 'revenue', price * q); UAE.fCogs(g, basis);
    UAE.L.buyInventory(buyer, (price + fr) * q);
    UAE.stockAdd(f, pid, q, price + fr, qual);
    if (line) line.sold += q;
  }
  return q;
};

/* ------------------------------------------------ demand fundamentals */
UAE.season = function (kind) { return UAE.SEASON[kind][UAE.cal.month()]; };
/** Daily consumer demand (units) for product pid in a city. */
UAE.cityDemand = function (city, pid) {
  var P = UAE.P[pid], C = UAE.CITIES[city], c = UAE.S.cities[city], m = UAE.S.macro;
  if (!P.perCap) return 0;
  var income = Math.pow(C.income * c.wageIdx / (c.cpiIdx / 100), 0.8);
  var touristPresent = c.tourists * 3.8 / 365 * UAE.season('tourism') * m.tourism;
  var d = (c.pop * income + touristPresent * (P.tour || 0)) * P.perCap / 365;
  d *= UAE.season('retail') * m.retail;
  var fx = c.fx || {};
  if (fx.retail) d *= 1 + fx.retail;
  if (fx.elec && ['phone','laptop','tv'].indexOf(pid) >= 0) d *= 1 + fx.elec;
  if (P.grow) d *= UAE.capGrowth ? UAE.capGrowth(P.grow, 6, UAE.S.day / 365) : Math.pow(1 + P.grow, UAE.S.day / 365);   // booming tech products: fast growth that levels off (6x)
  if (P.kind === 'software') d *= m.tech;
  return d;
};

/* ======================================================== DAILY TICK ==== */
UAE.simDay = function () {
  var S = UAE.S, firms = UAE.allFirms();
  // reset per-day pools
  var freightPrev = S.freightPool; S.freightPool = {}; S._freightYesterday = freightPrev;
  var adPrev = S.adPool; S.adPool = {}; S._adYesterday = adPrev;

  // 1 construction
  firms.forEach(function (f) {
    if (f.status === 'construction' && (S.day >= f.openDay || UAE.instantBuild())) {
      f.status = 'open';
      if (UAE.isHuman(UAE.co(f.owner))) UAE.news(f.name + ' is now open in ' + UAE.CITIES[f.city].name + '.', 'firm');
    }
  });
  var open = firms.filter(function (f) { return f.status === 'open'; });

  // 2 production
  open.forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (k === 'farm') UAE.produceFarm(f);
    else if (k === 'mine' || k === 'oil') UAE.produceResource(f);
    else if (k === 'factory') UAE.produceFactory(f);
  });

  // 3 retail sales (city x product competition)
  UAE.retailSales(open);

  // 4 purchasing (supplyMet = share of the order the supplier could fill: the purchasing supply indicator)
  open.forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (k === 'retail') f.lines.forEach(function (l) {
      var cap = UAE.lineCap(f, l), target = cap * 5, need = target - UAE.stockQ(f, l.pid);
      if (need > cap * 0.5) {
        var got = UAE.procure(f, l.pid, need, l.supplier); l.supplyMet = (l.supplyMet == null ? 1 : l.supplyMet) * 0.7 + 0.3 * got / need;
        // the chosen supplier (often your own factory, shared by hundreds of stores) ran dry: top up from imports so the
        // shelf is never empty (your own supplier stays first choice; tick 'no imports' on the line to stop this)
        var short = cap * 2 - UAE.stockQ(f, l.pid);
        if (short > 0 && l.supplier && l.supplier !== 'IMPORT' && !l.noImport) UAE.procure(f, l.pid, short, 'IMPORT');
      }
      else l.supplyMet = (l.supplyMet == null ? 1 : l.supplyMet) * 0.7 + 0.3;
    });
    if (k === 'warehouse') f.lines.forEach(function (l) {
      var unit = UAE.landedImport(l.pid, f).unit, target = 2.5e6 * f.size / unit, need = target - UAE.stockQ(f, l.pid);
      if (need > target * 0.2) {
        var got = UAE.procure(f, l.pid, need, l.supplier === f.id ? 'IMPORT' : l.supplier);
        // bulk import discount 3% for warehouses
        if (got && (l.supplier === 'IMPORT' || !l.supplier)) {
          var s = f.stock[l.pid], refund = unit * got * 0.015;       // rebate lowers stock value by exactly the refund
          s.cost -= refund / s.q; UAE.L._cash(UAE.co(f.owner), refund, 'op');
        }
      }
      if (!l.priceSet) l.price = (f.stock[l.pid] ? f.stock[l.pid].cost : unit) * 1.05;
    });
  });

  // 5 B2B demand & exports
  UAE.b2bAndExport(open);

  // 6 service-type firms
  UAE.servicesDay(open);

  // 7 fixed costs
  open.forEach(UAE.fixedCosts);
  firms.forEach(function (f) { if (f.status === 'construction') UAE.constructionCosts(f); });

  // 8 legacy core business of real groups
  UAE.allCos().forEach(function (co) { if (co.legacy) UAE.legacyDay(co); });

  // 9 brand (awareness + loyalty, campaigns) & technology drift; wholesale price formation
  UAE.brandDay();
  UAE.allCos().forEach(UAE.brandTechDay);
  UAE.wholesaleDay();
};

/* ------------------------------------------------------------ capacity */
UAE.lineCap = function (f, l) {
  var P = UAE.P[l.pid];
  return (P.cap || 10) * (1 + 0.8 * (f.size - 1)) * f.eff * (f.mall ? 1.4 : 1);   // mall stores: anchor footfall supports more sales per unit
};

/* -------------------------------------------------------------- farms */
UAE.produceFarm = function (f) {
  var co = UAE.co(f.owner), c = UAE.S.cities[f.city];
  var scale = Math.max(((c && c.cpiIdx) || 100) / 100, (c && c.wageIdx) || 1);
  f.lines.forEach(function (l) {
    var spec = UAE.FARM[l.pid]; if (!spec) return;
    var mult = 1;
    if (spec.harvest) mult = spec.harvest.indexOf(UAE.cal.month()) >= 0 ? 3.2 : 0.65;  // cold-storage / year-round packing off-season
    if (l.pid === 'veg') mult = UAE.SEASON.tourism[UAE.cal.month()] > 0.9 ? 1.2 : 0.75; // climate-controlled greenhouse
    // Agritech productivity rises with long-term city wages/CPI so fixed-price farm output keeps pace with 2050s wages
    var q = spec.out * scale * f.size * f.eff * mult / Math.max(1, f.lines.length) * (l.rate == null ? 1 : l.rate);
    if (UAE.stockQ(f, l.pid) > spec.out * scale * f.size * 15) return;   // storage full
    var unit = spec.cost * (UAE.RULES.utilityMult[UAE.CITIES[f.city].emirate] || 1);
    UAE.L.buyInventory(co, unit * q);
    UAE.stockAdd(f, l.pid, q, unit, 45 + (co.tech[l.pid] || 50) * 0.4);
    l.made += q; UAE.wmCount(l.pid, 'made', q);
    if (!l.priceSet) l.price = Math.max(unit * 1.05, UAE.wholesalePrice(l.pid));
  });
};
/** Mines & wells extract from their natural resource site: grade sets output, cost multiplier the
 *  extraction cost, the deposit's ore quality the product quality. The reserve runs out. */
UAE.produceResource = function (f) {
  var co = UAE.co(f.owner), dep = f.deposit ? UAE.DEP[f.deposit] : null, st = dep ? UAE.depState(dep.id) : null;
  f.lines.forEach(function (l) {
    var spec = UAE.RESOURCE[l.pid]; if (!spec) return;
    if (dep && dep.res !== l.pid) return;                          // a site only yields its own resource
    if (!st && f.reserve == null) f.reserve = spec.out * 365 * 25 * f.size;   // legacy firms without a site (SYN)
    var left = st ? st.left : f.reserve;
    if (left <= 0) {
      if (!f._exhausted) { f._exhausted = true; UAE.news(f.name + ': the ' + (dep ? dep.name : 'deposit') + ' reserve is exhausted. Production stopped.', UAE.isHuman(co) ? 'warning' : 'ai'); }
      return;
    }
    if (UAE.stockQ(f, l.pid) > spec.out * f.size * 15) return;   // storage full
    var q = Math.min(left, spec.out * f.size * f.eff * (dep ? dep.grade : 1) * (l.rate == null ? 1 : l.rate));
    if (st) { st.left -= q; f.reserve = st.left; } else f.reserve -= q;
    var unit = spec.cost * (dep ? dep.cost : 1);          // offshore / sour-gas sites carry a higher cost multiplier
    UAE.L.buyInventory(co, unit * q);
    UAE.stockAdd(f, l.pid, q, unit, dep ? dep.qual : 60);
    l.made += q; UAE.wmCount(l.pid, 'made', q);
    if (!l.priceSet) l.price = Math.max(unit * 1.05, UAE.wholesalePrice(l.pid));
  });
};
UAE.produceFactory = function (f) {
  var co = UAE.co(f.owner);
  f.lines.forEach(function (l) {
    if (!l.on) return;
    var P = UAE.P[l.pid], rec = P.rec; if (!rec) return;
    var maxOut = rec.cap * (1 + 0.8 * (f.size - 1)) * f.eff / Math.max(1, f.lines.length) * 1.5 * (l.rate == null ? 1 : l.rate);
    if (UAE.stockQ(f, l.pid) > maxOut * 10) return;        // warehouse full: production pauses
    // keep 3 days of inputs on hand, own suppliers first, then market, then import
    rec.in.forEach(function (inp) {
      var want = maxOut * inp[1] * 3, have = UAE.stockQ(f, inp[0]);
      if (have >= want * 0.6) return;
      var need = want - have, pick = l.inSup && l.inSup[inp[0]];
      if (pick === 'IMPORT') { l.inMet = l.inMet || {}; l.inMet[inp[0]] = 1; UAE.procure(f, inp[0], need, 'IMPORT'); return; }
      var need0 = need;
      if (UAE._idx) need = UAE.procureCheapest(f, inp[0], need, pick && UAE.S.firms[pick] ? pick : null);   // fast path, same order as below
      else {
        var opts = UAE.supplyOptions(f, inp[0], true);
        var own = opts.filter(function (o) { return o.owner === f.owner && o.avail > 0; });
        var mkt = opts.filter(function (o) { return o.owner && o.owner !== f.owner && o.avail > 0; });
        var order = own.concat(mkt);
        if (pick && UAE.S.firms[pick]) order = opts.filter(function (o) { return o.id === pick; }).concat(order.filter(function (o) { return o.id !== pick; }));
        for (var i = 0; i < order.length && need > 0; i++) need -= UAE.procure(f, inp[0], need, order[i].id);
      }
      l.inMet = l.inMet || {}; l.inMet[inp[0]] = need0 > 0 ? 1 - Math.max(0, need) / need0 : 1;   // share filled by firms (rest imported)
      if (need > 0 && !(l.noImport)) UAE.procure(f, inp[0], need, 'IMPORT');
    });
    var units = maxOut;
    rec.in.forEach(function (inp) { units = Math.min(units, UAE.stockQ(f, inp[0]) / inp[1]); });
    if (units <= 0) return;
    var cost = 0, qIn = 0;
    rec.in.forEach(function (inp) {
      var s = f.stock[inp[0]]; qIn += s ? s.qual : 50; cost += UAE.stockTake(f, inp[0], units * inp[1]);
      UAE.wmCount(inp[0], 'used', units * inp[1]);
    });
    qIn /= rec.in.length;
    var lab = rec.lab * units * (UAE.RULES.utilityMult[UAE.CITIES[f.city].emirate] || 1);
    UAE.L.buyInventory(co, lab);
    var qual = (co.tech[l.pid] || 50) * 0.75 + qIn * 0.25 + (f.training || 0) * 0.1;   // no cap: tech above 100 keeps improving quality
    UAE.stockAdd(f, l.pid, units, (cost + lab) / units, qual);
    l.made += units; UAE.wmCount(l.pid, 'made', units);
    // default selling price: never below cost + 12%; B2B goods follow the UAE wholesale market, consumer goods import parity
    var mkt = UAE.P[l.pid].kind === 'consumer' ? UAE.importBase(l.pid) * 0.97 : UAE.wholesalePrice(l.pid);
    if (!l.priceSet) l.price = Math.max((cost + lab) / units * 1.12, mkt);
  });
};

/* ----------------------------------------------------------- retail */
UAE.mallBoost = function (f) {
  var b = 0;
  var malls = UAE.dayGroup('openMalls', function (m) { return m.type === 'mall' && m.status === 'open' ? 'all' : null; }).all || [];
  malls.forEach(function (m) { if (UAE.geo.km(m.c, f.c) < 0.6) b = Math.max(b, 0.25 + 0.03 * m.size); });
  return b;
};
/* UAE.retailSales (city x product competition, demand curve, ratings, market stats) lives in engine/micro.js. */

/* -------------------------------------------------- B2B and exports */
UAE.b2bAndExport = function (open) {
  var S = UAE.S;
  var producers = open.filter(function (f) { return ['factory','farm','mine','oil','warehouse','software'].indexOf(UAE.FIRM_TYPES[f.type].kind) >= 0; });
  // B2B industrial demand per city (cement, aluminium, glass, jet fuel ...)
  UAE.PRODUCTS.forEach(function (P) {
    if (!P.b2b) return;
    var sellers = producers.filter(function (f) { return f.lines.some(function (l) { return l.pid === P.id; }) && UAE.stockQ(f, P.id) > 0; });
    if (!sellers.length) {                          // nobody local sells it: the whole city demand is imported
      Object.keys(S.cities).forEach(function (city) { UAE.wmCount(P.id, 'used', S.cities[city].gdp * P.b2b / 365 * (P.kind === 'software' ? S.macro.tech * Math.pow(1 + (P.grow || 0), S.day / 365) : S.macro.property)); });
      return;
    }
    Object.keys(S.cities).forEach(function (city) {
      var D = S.cities[city].gdp * P.b2b / 365 * (P.kind === 'software' ? S.macro.tech * Math.pow(1 + (P.grow || 0), S.day / 365) : S.macro.property);
      var ctr = UAE.CITIES[city].center, imp = UAE.importBase(P.id) * (1 + UAE.RULES.customs) * 1.06;
      // a seller may have sold out in an earlier city today: skip it (its stock record is gone)
      var sum = 1.5, w = sellers.filter(function (f) { return f.stock[P.id] && f.stock[P.id].q > 0; }).map(function (f) {
        var l = f.lines.find(function (x) { return x.pid === P.id; });
        var landed = l.price + UAE.freight(P.id, f.c, ctr);
        var a = Math.pow(imp / landed, 3) * Math.pow(f.stock[P.id].qual / 55, 0.5); sum += a; return { f: f, l: l, a: a };
      });
      UAE.wmCount(P.id, 'used', D);                    // city construction / industrial demand counts toward UAE demand
      w.forEach(function (x) {
        var q = Math.min(UAE.stockQ(x.f, P.id), D * x.a / sum);
        if (q <= 0) return;
        var basis = UAE.stockTake(x.f, P.id, q);
        UAE.fIncome(x.f, 'revenue', x.l.price * q); UAE.fCogs(x.f, basis); x.l.sold += q;
      });
    });
  });
  // exports: anything piling up beyond ~8 days of output leaves via the nearest port
  producers.forEach(function (f) {
    var pk = UAE.FIRM_TYPES[f.type].kind;
    if (pk === 'warehouse' || pk === 'software') return;
    f.lines.forEach(function (l) {
      var s = f.stock[l.pid]; if (!s) return;
      if (UAE.WM && UAE.WM[l.pid] && !UAE.WM[l.pid].subs) return;      // sold to the world market by tech & brand (engine/worldmkt.js)
      var daily = Math.max(1, l.made / Math.max(1, (S.day % 30) + 1));
      if (s.q <= daily * 8) return;
      var q = s.q - daily * 5, gw = UAE.geo.nearestGateway(f.c);
      var exporter = UAE.hasFirmIn(f.owner, 'exporter', null, UAE.CITIES[f.city].emirate);
      var P = UAE.P[l.pid];
      var px = (P.kind === 'consumer' ? UAE.importBase(l.pid) * 0.92 : UAE.worldPrice(l.pid)) * (exporter ? 0.99 : 0.94);
      var fr = P.t * (gw.km * 1.25 + 3) * UAE.RULES.freightPerTonKm;
      if (px - fr < s.cost * 0.85 && !l.forceExport) return;   // not worth exporting at a big loss: hold stock
      var basis = UAE.stockTake(f, l.pid, q);
      UAE.fIncome(f, 'revenue', Math.max(0, px - fr) * q); UAE.fCogs(f, basis);
      l.exported = (l.exported || 0) + q;
      S.cities[f.city].exportsM = (S.cities[f.city].exportsM || 0) + px * q;                       // city graphs: exports
    });
  });
};

/* ------------------------------------------- service-type firms (daily) */
UAE.servicesDay = function (open) {
  var S = UAE.S, m = S.macro;
  var byKind = {};
  open.forEach(function (f) { var k = UAE.FIRM_TYPES[f.type].kind; (byKind[k] || (byKind[k] = [])).push(f); });
  var get = function (k) { return byKind[k] || []; };
  var tour = UAE.season('tourism') * m.tourism;

  // --- service firms (restaurants, cafés, gyms, salons, cinemas)
  var svcN = {}, svcKey = function (g) { return g.district + '|' + g.svc + '|' + (g.mall || ''); };   // competitors in the same district / mall (counted once, not per firm)
  get('service').forEach(function (g) { var key = svcKey(g); svcN[key] = (svcN[key] || 0) + 1; });
  get('service').forEach(function (f) {
    var svc = UAE.SERVICES[f.svc], c = S.cities[f.city], sc = Math.max((c.cpiIdx || 100) / 100, c.wageIdx || 1);
    var n = svcN[svcKey(f)];
    var cust = svc.base * (0.8 + 0.4 * UAE.corpBrand(f, 'Hospitality')) * (1 + 0.8 * (f.size - 1)) * Math.pow(Math.max(0.2, UAE.trafficIndex(f)), 0.8) * Math.pow(f.quality / 50, 0.5) * UAE.popMult(f) *
               Math.pow((svc.price * sc) / f.price, 1.3) * UAE.season('retail') * UAE.CITIES[f.city].income * c.wageIdx /
               (1 + 0.35 * (n - 1)) * f.eff * (0.85 + 0.3 * tour / 1.1);
    var gross = cust * f.price, net = gross / 1.05;
    UAE.fIncome(f, 'revenue', net); UAE.fExpense(f, 'cogs', net * svc.foodCost);
    c.vat += gross - net; c.govRevYtd += gross - net; f.customers = cust;
  });

  // --- hotels: occupancy vs city benchmark (DXB 80.7% / ADR AED 579, REAL 2025, indexed to city CPI / wage growth)
  get('hotel').forEach(function (f) {
    var C = UAE.CITIES[f.city], d = UAE.geo.district(f.district), c = S.cities[f.city], sc = Math.max((c.cpiIdx || 100) / 100, c.wageIdx || 1);
    var rooms = UAE.FIRM_TYPES.hotel.roomsPerLevel * f.size;
    var refADR = C.hotelADR * sc * Math.sqrt(Math.max(0.4, d.foot) / 1.2) * (f.stars === 7 ? 3 : 1);
    var target = C.hotelOcc * tour * Math.pow(refADR / f.adr, 1.4) * Math.pow(f.quality / 50, 0.3) * (1 + (c.fx.hotel || 0)) * (0.85 + 0.3 * UAE.corpBrand(f, 'Hospitality'));
    target = Math.max(0.05, Math.min(0.97, target));
    f.occ = f.occ + (target - f.occ) * 0.1;
    var roomRev = rooms * f.occ * f.adr, total = roomRev * 1.35, net = total / 1.05;
    UAE.fIncome(f, 'revenue', net); UAE.fExpense(f, 'cogs', net * 0.22);
    c.vat += total - net; c.govRevYtd += total - net;
    f.revpar = f.occ * f.adr;
  });

  // --- apartments, offices, malls: occupancy follows rent vs market rent
  get('mall').forEach(UAE.mallDay);                 // malls: tenants, leases, background letting (engine/mall.js)
  ['apartment','office'].forEach(function (k) {
    get(k).forEach(function (f) {
      var co = UAE.co(f.owner), mkt = UAE.marketRent(f);
      if (co.autoRent && (S.day % 30 === 0 || !f.rent)) f.rent = Math.round(mkt * 0.98);
      var target = Math.max(0.08, Math.min(0.98, 0.93 * Math.pow(mkt / f.rent, 2.2) * S.macro.property * (0.9 + 0.2 * UAE.corpBrand(f, 'Real Estate'))));
      f.occ += (target - f.occ) * 0.03;
      var stock = k === 'apartment' ? UAE.LEASE.apartmentUnits * f.size : (k === 'mall' ? UAE.LEASE.mallM2 : UAE.LEASE.officeM2) * f.size;
      var rev = stock * f.occ * f.rent / 365;
      if (k === 'mall') rev *= 1 + 0.15 * (UAE.geo.district(f.district).foot); // turnover rent from footfall
      UAE.fIncome(f, 'revenue', rev); UAE.fExpense(f, 'cogs', rev * (k === 'mall' ? 0.25 : 0.14));
    });
  });

  // --- media: share of the city advertising pool (yesterday's ad spend) + base audience revenue
  var mediaByCity = {};
  get('media').forEach(function (f) { (mediaByCity[f.city] || (mediaByCity[f.city] = [])).push(f); });
  Object.keys(mediaByCity).forEach(function (city) {
    var list = mediaByCity[city], pool = (S._adYesterday[city] || 0), sum = 2;
    list.forEach(function (f) { f._s = UAE.FIRM_TYPES[f.type].reach * f.size * f.quality / 50; sum += f._s; });
    list.forEach(function (f) {
      var base = 18000 * UAE.FIRM_TYPES[f.type].reach * f.size * Math.sqrt(S.cities[city].pop / 1e6);
      UAE.fIncome(f, 'revenue', pool * f._s / sum + base);
    });
  });

  // --- internet companies (national market: users x take-rate x GMV / ARPU, indexed to UAE CPI)
  var net = get('internet'), uaePop = 0, cpiSum = 0; Object.keys(S.cities).forEach(function (k) { uaePop += S.cities[k].pop; cpiSum += S.cities[k].pop * ((S.cities[k].cpiIdx || 100) / 100); });
  var uaeCpi = uaePop > 0 ? cpiSum / uaePop : 1;
  var netSum = {};
  net.forEach(function (f) { var co = UAE.co(f.owner); f._s = f.size * Math.pow(f.quality / 50, 1.2) * (1 + (co.brand.Internet || co.brandBase || 10) / 50); netSum[f.model] = (netSum[f.model] || 6) + f._s; });
  net.forEach(function (f) {
    var M = UAE.INTERNET_MODELS[f.model];
    var pen = { ecommerce: 0.55, delivery: 0.45, search: 0.85, social: 0.8, streaming: 0.35 }[f.model];
    var target = uaePop * pen * f._s / netSum[f.model] * m.tech;
    f.users += (target - f.users) * 0.01;
    var rev = f.users * (M.gmvPerUser * M.takeRate + M.arpu) * uaeCpi / 365;
    f.gmv = f.users * M.gmvPerUser * uaeCpi / 365;
    UAE.fIncome(f, 'revenue', rev); UAE.fExpense(f, 'otherOpex', rev * 0.35); // servers, payments, couriers
  });
  UAE.ecomDay(net);                                 // engine/aistack.js: e-commerce catalogue sales + membership

  // --- software companies
  UAE.softwareDay(get('software'));                 // engine/tech.js: licences, online direct sales
  UAE.subsDay(get('software'));                     // engine/aistack.js: AI Assistant / Frontier AI subscriptions
  get('software').concat(get('rnd')).forEach(UAE.researchDay);   // research projects (next model / version)
  if (UAE.worldDay) UAE.worldDay(UAE.allFirms().filter(function (f) { return f.status === 'open'; }));   // world markets (engine/worldmkt.js)

  // --- telecom: subscribers vs e&/du incumbents
  var tel = get('telecom'), telSum = 60;
  tel.forEach(function (f) { f._s = f.size * f.quality / 50 * (0.8 + 0.4 * UAE.corpBrand(f, 'Telecom')); telSum += f._s; });
  tel.forEach(function (f) {
    var target = uaePop * 1.9 * f._s / telSum;
    f.subs += (target - f.subs) * 0.005;
    UAE.fIncome(f, 'revenue', f.subs * f.arpu / 30);
  });

  // --- data centres & solar
  UAE.dcDay(get('datacenter'));                     // engine/aistack.js: servers -> cloud compute rental
  get('solar').forEach(function (f) {
    var kwh = UAE.FIRM_TYPES.solar.mw * f.size * 1000 * 24 * (0.21 + 0.06 * (UAE.SEASON.tourism[UAE.cal.month()] < 0.9 ? 1 : 0));
    f.kwhDay = kwh; UAE.fIncome(f, 'revenue', kwh * 0.085);   // PPA AED 0.085/kWh (EST)
  });

  // --- sports / attractions
  get('sports').forEach(function (f) {
    var d = UAE.geo.district(f.district);
    var vis = 1200 * f.size * Math.pow(Math.max(0.3, d.foot), 0.7) * tour * Math.pow(150 / f.price, 1.1) * f.eff;
    var gross = vis * f.price, netv = gross / 1.05;
    UAE.fIncome(f, 'revenue', netv); UAE.fExpense(f, 'cogs', netv * 0.15); f.visitors = vis;
    S.cities[f.city].vat += gross - netv;
  });

  // --- logistics: share of freight paid in the city yesterday + contract base (indexed to city CPI & GDP growth)
  var logi = get('logistics'), lc = {};
  logi.forEach(function (f) { (lc[f.city] || (lc[f.city] = [])).push(f); });
  Object.keys(lc).forEach(function (city) {
    var c = S.cities[city], C = UAE.CITIES[city], cpi = (c.cpiIdx || 100) / 100, gdpScale = Math.sqrt(Math.max(1, c.gdp / C.gdp));
    var pool = (S._freightYesterday[city] || 0) * cpi, sum = 3;
    lc[city].forEach(function (f) { sum += f.size; });
    lc[city].forEach(function (f) {
      var rev = pool * f.size / sum + 9000 * f.size * S.macro.logistics * cpi * gdpScale;
      UAE.fIncome(f, 'revenue', rev); UAE.fExpense(f, 'otherOpex', rev * 0.45); // fuel, tolls (Salik), vehicles
    });
  });
  get('importer').forEach(function (f) { UAE.fIncome(f, 'revenue', 5000 * f.size * S.macro.logistics); });
  get('exporter').forEach(function (f) { UAE.fIncome(f, 'revenue', 4000 * f.size * S.macro.logistics); });

  // --- banks: deposits, lending, provisions (Banking & Finance DLC)
  // --- banks & insurers (engine/finance.js: segments, capital rules, game-company loans, catastrophes)
  UAE.bankDay(get('bankhq'));
  UAE.insDay(get('inshq'));


  // --- R&D centres raise company technology for a product
  get('rnd').forEach(function (f) {
    var co = UAE.co(f.owner), t = co.tech[f.target] || 40, cls = UAE.P[f.target] ? UAE.P[f.target].cls : '';
    var mgr = f.manager && UAE.person(f.manager), ceo = UAE.person(co.ceo);
    var classExp = Math.max(mgr && mgr.pexp ? mgr.pexp[cls] || 0 : 0, ceo && ceo.pexp ? (ceo.pexp[cls] || 0) * 0.5 : 0);
    co.tech[f.target] = t + 0.012 * f.size * f.eff * (1 + classExp / 100) * Math.max(0.15, 1 - t / 110);   // no cap: past ~94 it keeps rising at 15% of the base pace   // product-class expertise: +1%/point
  });
};

/* ---------------------------------------------- fixed costs per firm */
UAE.fixedCosts = function (f) {
  var T = UAE.FIRM_TYPES[f.type], c = UAE.S.cities[f.city], C = UAE.CITIES[f.city];
  var co = UAE.co(f.owner);
  if (f.seed && co.legacy) {     // seed flagship sites: staff already inside legacy core opex
    if (f.adBudget) { UAE.fExpense(f, 'advertising', f.adBudget / 30); UAE.S.adPool[f.city] = (UAE.S.adPool[f.city] || 0) + f.adBudget / 30; }
    return;
  }
  var staff = T.staff * (1 + 0.8 * (f.size - 1));
  var wages = staff * C.wage * c.wageIdx * T.wageMult / 30;
  if (f.manager) wages += UAE.person(f.manager).salary / 30;
  var kwh = T.kwh * (1 + 0.8 * (f.size - 1));
  var industrial = ['factory','mine','oil','farm','warehouse','datacenter','logistics'].indexOf(T.kind) >= 0;
  var util = UAE.electricityBill(kwh, industrial, C.emirate) / 30;
  UAE.fExpense(f, T.kind === 'rnd' ? 'rnd' : 'salaries', wages);
  UAE.fExpense(f, 'utilities', util);
  UAE.fExpense(f, 'maintenance', (f.ppe * 0.012) / 365);
  // Clear legacy CMO ad budgets left on bank branches / insurance offices / warehouses from older saves
  if (f.adByCmo && (f.type === 'bankbranch' || f.type === 'insoffice' || f.type === 'warehouse')) { f.adBudget = 0; f.adByCmo = false; }
  if (f.adBudget) { UAE.fExpense(f, 'advertising', f.adBudget / 30); UAE.S.adPool[f.city] = (UAE.S.adPool[f.city] || 0) + f.adBudget / 30; }
  if (f.trainBudget) { UAE.fExpense(f, 'training', f.trainBudget / 30); }
  // efficiency: training & manager push toward 1.2, otherwise drifts to 0.9; expertise adds unit levels
  // (Capitalism Lab: +1 unit level per 20 expertise points of the manager; the CEO adds a quarter of that company-wide)
  var tm = UAE.trainingMult(f);
  var tgt = 0.9 + Math.min(0.25, (f.trainBudget || 0) / Math.max(1, wages * 30) * 1.5 * tm) + (f.manager && UAE.person(f.manager) ? UAE.person(f.manager).skill.mgmt / 1000 : 0) +
            0.05 * UAE.expertLevels(f);
  f.training = Math.min(100, (f.training || 0) * 0.995 + (f.trainBudget ? 0.4 * tm : 0));
  f.eff += (tgt - f.eff) * 0.02;
};
UAE.constructionCosts = function (f) {
  // site security / project management during construction (SYN)
  UAE.fExpense(f, 'otherOpex', UAE.BUILD[f.type][0] * 0.0002);
};

/* --------------------------------- legacy core business of real groups */
/* Growth of a real group's core business fades from its sector's early rate to long-run world nominal growth
 * (4%/yr) over ~6 years. It used to compound the early rate forever: tech grew 15%/yr for 34 years (x116), so in
 * 2060 Apple's revenue was ~100x the whole world smartphone market. */
UAE.LEGACY_LR = 0.04; UAE.LEGACY_FADE = 6;
UAE.legacyGrow = function (L, yrs) { return L.grow > UAE.LEGACY_LR ? UAE.LEGACY_LR + (L.grow - UAE.LEGACY_LR) * Math.exp(-yrs / UAE.LEGACY_FADE) : L.grow; };
/** Size index of the core business after `yrs` years on that path (1 = start). */
UAE.legacyIdxPath = function (L, yrs) {
  var g = L.grow, lr = UAE.LEGACY_LR, T = UAE.LEGACY_FADE;
  return g > lr ? Math.exp(lr * yrs + (g - lr) * T * (1 - Math.exp(-yrs / T))) : Math.exp(g * yrs);
};
/** One-time restatement of saves made before the fix: core businesses that grew above the path are put back on it
 *  (revenue history and the last 12 months' statements are scaled the same way, so TTM figures are right at once). */
UAE.legacyRebase = function () {
  var S = UAE.S, yrs = S.day / 365, n = 0;
  UAE.allCos().forEach(function (co) {
    var L = co.legacy; if (!L || L.v2) return;
    L.v2 = 1;
    var path = UAE.legacyIdxPath(L, yrs); if (!(L.idx > path * 1.02)) return;
    var k = path / L.idx; L.idx = path; n++;
    (co.is.months || []).forEach(function (m) { ['revenue', 'coreOpex', 'tax', 'cogs'].forEach(function (x) { if (m[x]) m[x] *= k; }); });
    ['revenue', 'coreOpex'].forEach(function (x) { co.is.cur[x] *= k; });
    (co.history || []).forEach(function (h) { if (h.rev) h.rev *= k; if (h.ni) h.ni *= k; });
  });
  if (n) UAE.news('📉 Restated ' + n + ' real companies: their core business now grows at a realistic rate (fading to 4% a year) instead of compounding its early growth forever.', 'finance');
};
UAE.legacyDay = function (co) {
  var L = co.legacy, m = UAE.S.macro, sec = co.sector;
  var macro = 1;
  if (sec === 'oilgas' || sec === 'chemicals') macro = 0.55 + 0.45 * m.oil;
  if (sec === 'property') macro = m.property;
  if (sec === 'logistics' || sec === 'transport') macro = m.logistics;
  if (sec === 'hospitality' || sec === 'aviation') macro = 0.6 + 0.4 * UAE.season('tourism') * m.tourism;
  if (sec === 'retail') macro = UAE.season('retail') * m.retail;
  if (sec === 'tech' || sec === 'internet' || sec === 'telecom') macro = m.tech;
  if (sec === 'bank') macro = 0.7 + 0.3 * (m.rate / UAE.RULES.baseRate);
  L.idx *= 1 + UAE.legacyGrow(L, UAE.S.day / 365) / 365;
  L.shock = (L.shock || 1) * (1 + UAE.rng.normal() * 0.004) * 0.98 + 0.02;
  var rev = L.rev / 365 * L.idx * macro * L.shock;
  var costBase = (L.rev - L.preTax) / 365;
  var opex = costBase * 0.45 * L.idx + costBase * 0.55 * (rev / (L.rev / 365));   // 45% fixed, 55% variable cost
  UAE.L.income(co, 'revenue', rev); UAE.L.expense(co, 'coreOpex', opex);
};

/** Corporate brand of the firm's owner for a service sector, 0..1 (0.3 = typical). */
UAE.corpBrand = function (f, key) { var co = UAE.co(f.owner), b = co.brand && co.brand[key]; return Math.max(0, Math.min(1, (b == null ? (co.brandBase || 20) : b) / 100)); };
/* ---------------------------------------------- brand & technology drift */
UAE.brandTechDay = function (co) {
  // product brands (awareness + loyalty per product and city) live in engine/micro.js (UAE.brandDay);
  // here only the corporate "Internet" brand of online platforms is maintained.
  // corporate brands of service businesses (Internet, Banking, Insurance, Hospitality, Real Estate, Telecom):
  // built by the ad budgets of those firms (set by you or the CMO) plus HQ marketing / PR; fade slowly otherwise
  var adsBy = {}, corp = ((co.hqBudget.cmo || 0) + (co.hqBudget.pr || 0)) / 30 * 0.3;
  UAE.firmsOf(co.id).forEach(function (f) { var key = UAE.firmBrandGroup ? UAE.firmBrandGroup(f) : UAE.SERVICE_BRAND && UAE.SERVICE_BRAND[f.type]; if (key) adsBy[key] = (adsBy[key] || 0) + (f.adBudget || 0) / 30; });
  var keys = Object.keys(adsBy), mult = UAE.mktExpMult ? UAE.mktExpMult(co) : 1;
  keys.forEach(function (key) {
    var ads = adsBy[key] + corp / keys.length;
    var push = ads > 0 ? 6 * mult * ads / (ads + 60000) : 0, b = co.brand[key] == null ? (co.brandBase || 10) : co.brand[key];
    co.brand[key] = Math.max(0, Math.min(100, b * 0.998 + push * (1 - b / 100)));
  });
  if (co.hqBudget.cto) {
    var g = co.hqBudget.cto / 30 / 2e6 * 0.01;
    for (var p in co.tech) co.tech[p] = co.tech[p] + g * Math.max(0.15, 1 - co.tech[p] / 110);   // no cap
  }
  if (co.hqBudget.hr) UAE.L.expense(co, 'training', co.hqBudget.hr / 30);
  if (co.hqBudget.cmo) UAE.L.expense(co, 'advertising', co.hqBudget.cmo / 30);
  if (co.hqBudget.pr) UAE.L.expense(co, 'advertising', co.hqBudget.pr / 30);
  if (co.hqBudget.cto) UAE.L.expense(co, 'rnd', co.hqBudget.cto / 30);
  if (co.hqBudget.ir) UAE.L.expense(co, 'otherOpex', co.hqBudget.ir / 30);
  if (co.hqBudget.community) { UAE.L.expense(co, 'otherOpex', co.hqBudget.community / 30); UAE.S.cities[co.hq].civic += co.hqBudget.community / 30; }
};
