/* ============================================================================
 * UAE CAPITALISM LAB  -  MICROECONOMICS, PRODUCT RATINGS, BRAND & MARKETING
 * (Capitalism Lab "Product Details": price / quality / brand ratings, city
 *  averages, market share, supply & demand indicators, brand awareness +
 *  brand loyalty, advertising campaigns through media firms.)
 *
 *  1. Demand curve      total city demand reacts to the market price level
 *                       (own-price elasticity), not only shares between stores.
 *  2. Market stats      S.mkt['CITY|pid'] = demand, supply, sold, averages.
 *  3. Ratings           price, quality, brand (awareness + loyalty) -> overall.
 *  4. Brand             per company x product x city: awareness (advertising)
 *                       and loyalty (quality experience, can be negative).
 *  5. Campaigns         per product ad campaigns bought from TV / radio /
 *                       newspaper firms (own or rivals') or outdoor / digital.
 *  6. Store traffic     district footfall, clustering, malls, store popularity.
 *  7. Wholesale market  UAE supply vs demand of raw & intermediate goods sets a
 *                       local price between export parity and import parity.
 * Engine only - no DOM access (runs in the headless tests).
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* ------------------------------------------------------------- brand --- */
/** Brand record of company `co` for product `pid` in `city` (created lazily). */
UAE.brand = function (co, pid, city) {
  var bp = co.brandP || (co.brandP = {});
  var byCity = bp[pid] || (bp[pid] = {});
  var b = byCity[city];
  if (!b) {
    var cls = UAE.P[pid] ? UAE.P[pid].cls : pid;
    var start = co.brand && co.brand[cls] != null ? co.brand[cls] : (co.brandBase || 10);
    b = byCity[city] = { aw: Math.min(80, start), loy: 0 };
  }
  return b;
};
/** Brand rating 0-100 = awareness + loyalty (Capitalism Lab rule). */
UAE.brandRating = function (co, pid, city) {
  var b = UAE.brand(co, pid, city); return Math.max(0, Math.min(100, b.aw + b.loy));
};

/* ------------------------------------------------------------ ratings --- */
UAE.LUXURY = { perfume: 1, jewelry: 1, watch: 1, fashion: 1, skincare: 1, car: 1 };
/** Rating weights for a product: staples are price-driven, luxury brand-driven. */
UAE.ratingWeights = function (pid) {
  var P = UAE.P[pid], el = Math.abs(P.el || 1);
  var wb = UAE.LUXURY[pid] ? 0.42 : 0.25, wp = UAE.LUXURY[pid] ? 0.2 : Math.min(0.45, 0.22 + el * 0.15);
  return { p: wp, b: wb, q: 1 - wp - wb };
};
UAE.priceRating = function (pid, price) {
  var P = UAE.P[pid], ref = P.ref || P.world || P.imp;
  return Math.max(0, Math.min(100, 50 * Math.pow(ref / Math.max(0.01, price), 1.3)));
};
/** Ratings of one retail line: {price, quality, brand, aw, loy, overall}. */
UAE.lineRatings = function (f, l) {
  var co = UAE.co(f.owner), s = f.stock[l.pid], b = UAE.brand(co, l.pid, f.city), w = UAE.ratingWeights(l.pid);
  var r = { price: UAE.priceRating(l.pid, l.price), quality: s ? s.qual : (l.lastQual || 50),
    aw: b.aw, loy: b.loy, brand: Math.max(0, Math.min(100, b.aw + b.loy)) };
  r.overall = r.price * w.p + r.quality * w.q + r.brand * w.b;
  return r;
};
/** Background incumbent retailers (not modelled as firms) - a fixed "city average" competitor. */
UAE.BG_RATING = { price: 50, quality: 50, brand: 30 };

/* ------------------------------------------------------- store traffic --- */
/** Customer traffic index of a store / service firm (0.05 .. ~3). Cached monthly. */
UAE.trafficIndex = function (f) {
  if (f._trafDay != null && UAE.S.day - f._trafDay < 30 && f._traffic != null) return f._traffic;
  var d = UAE.geo.district(f.district), t;
  if (f.mall && UAE.S.firms[f.mall]) {
    var m = UAE.S.firms[f.mall];
    t = Math.max(0.3, d.foot) * (0.55 + (m.mallRating || 50) / 100) * 1.35;   // inside a mall: driven by the mall's overall rating
  } else {
    var near = 0, svc = 0;
    // shops / services / malls on a ~0.6 km grid: only the 3x3 cells around the store can be within 0.5 km
    var CELL = 0.006, gx = Math.floor(f.c[0] / CELL), gy = Math.floor(f.c[1] / CELL);
    var grid = UAE.dayGroup('streetGrid', function (g) { var k = UAE.FIRM_TYPES[g.type].kind; return (k === 'retail' || k === 'service' || k === 'mall') ? g.city + '|' + Math.floor(g.c[0] / CELL) + '|' + Math.floor(g.c[1] / CELL) : null; });
    var local = [];
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var cell = grid[f.city + '|' + (gx + dx) + '|' + (gy + dy)]; if (cell) local = local.concat(cell); }
    local.forEach(function (g) {
      if (g === f || g.status !== 'open' || g.city !== f.city) return;
      var k = UAE.FIRM_TYPES[g.type].kind;
      if (k !== 'retail' && k !== 'service' && k !== 'mall') return;
      var km = UAE.geo.km(g.c, f.c); if (km > 0.5) return;
      if (k === 'retail') near++; else if (k === 'service') svc++;
      else near += 3;                                                             // a mall nearby pulls shoppers into the street too
    });
    t = Math.max(0.05, d.foot) * (1 + Math.min(0.35, near * 0.04) + Math.min(0.2, svc * 0.05));
  }
  f._traffic = t; f._trafDay = UAE.S.day;
  return t;
};
/** Store popularity multiplier (0.8 .. 1.2). */
UAE.popMult = function (f) { return 0.8 + 0.4 * (f.popu == null ? 30 : f.popu) / 100; };

/* ------------------------------------------------- city retail market --- */
/**
 * Retail competition for every city x product (replaces the old sim.js version).
 * Share  ~ attractiveness (quality, brand rating, price, traffic, popularity, size, manager)
 * Total  ~ base demand x (market price index)^elasticity  (a real downward-sloping demand curve)
 */
UAE.retailSales = function (open) {
  var S = UAE.S, groups = {};
  S.mkt = S.mkt || {};
  open.forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (k !== 'retail') return;
    if (f._mall == null || S.day % 30 === 0) f._mall = f.mall ? 0 : UAE.mallBoost(f) * 0.4;
    f.lines.forEach(function (l) { var key = f.city + '|' + l.pid; (groups[key] || (groups[key] = [])).push({ f: f, l: l }); });
  });
  // every city x consumer product gets market stats, even with no modelled seller
  Object.keys(S.cities).forEach(function (city) {
    UAE.PRODUCTS.forEach(function (P) { if (P.perCap && !groups[city + '|' + P.id]) groups[city + '|' + P.id] = []; });
  });
  Object.keys(groups).forEach(function (key) {
    var parts = key.split('|'), city = parts[0], pid = parts[1], P = UAE.P[pid];
    var D0 = UAE.cityDemand(city, pid), entries = groups[key], sumA = 0, sumAr = 0, sumQ = 0, sumB = 0, sumP = 0, supply = 0;
    entries.forEach(function (e) {
      var co = UAE.co(e.f.owner), s = e.f.stock[pid], q = s ? s.qual : (e.l.lastQual || 50);
      var brand = UAE.brandRating(co, pid, city);
      var r = e.l.price / P.ref;
      var mgr = e.f.manager && UAE.person(e.f.manager) ? 1 + UAE.person(e.f.manager).skill.mgmt / 400 : 1;
      e.q = q; e.b = brand; e.r = r;
      e.A = Math.pow(q / 50, 0.7) * Math.pow((brand + 15) / 45, 0.5) * Math.pow(r, -(1.5 + Math.abs(P.el || 1) * 1.5)) *
            Math.pow(UAE.trafficIndex(e.f), 0.6) * (1 + (e.f._mall || 0)) * Math.pow(1 + 0.1 * (e.f.size - 1), 0.5) * mgr * UAE.popMult(e.f);
      sumA += e.A; sumAr += e.A * r;
      e.cap = UAE.lineCap(e.f, e.l); supply += Math.min(e.cap, UAE.stockQ(e.f, pid));
    });
    var bg = 4 * S.cities[city].pop / 1e6 + 1;                // background incumbents at reference price, quality 50, brand 30
    var priceIdx = Math.max(0.4, Math.min(2.5, (sumAr + bg) / (sumA + bg)));
    var D = D0 * Math.pow(priceIdx, (P.el || -1) * 0.8);     // demand curve: a cheaper market sells more units
    var sold = 0, rev = 0;
    entries.forEach(function (e) {
      var want = D * e.A / (sumA + bg), have = UAE.stockQ(e.f, pid);
      var units = Math.min(want, e.cap, have);
      e.l.demand = want; e.l.cap = e.cap; e.l.lastQual = e.q;
      e.l.share = D > 0 ? units / D : 0;
      sumQ += e.q * Math.max(units, 0.01); sumB += e.b * Math.max(units, 0.01); sumP += e.l.price * Math.max(units, 0.01);
      if (units <= 0) { e.l.sold = 0; return; }
      var gross = units * e.l.price, net = gross / (1 + UAE.RULES.vat);
      var basis = UAE.stockTake(e.f, pid, units);
      UAE.fIncome(e.f, 'revenue', net); UAE.fCogs(e.f, basis);
      S.cities[city].vat += gross - net; S.cities[city].govRevYtd += gross - net;
      S.cities[city].retailSales += net;
      e.l.sold = units; sold += units; rev += net;
    });
    // background incumbents serve the rest of the market at reference price
    var bgUnits = D * bg / (sumA + bg), wsum = entries.reduce(function (s, e) { return s + Math.max(e.l.sold || 0, 0.01); }, 0) + bgUnits;
    var m = S.mkt[key] || (S.mkt[key] = { h: [] });
    m.base = D0; m.demand = D; m.priceIdx = priceIdx; m.supply = supply; m.sold = sold; m.rev = rev; m.sellers = entries.length;
    m.bgUnits = bgUnits;
    m.avgQ = (sumQ + 50 * bgUnits) / wsum; m.avgB = (sumB + UAE.BG_RATING.brand * bgUnits) / wsum; m.avgP = (sumP + P.ref * bgUnits) / wsum;
    m.acc = m.acc || { d: 0, s: 0, p: 0, n: 0 };
    m.acc.d += D; m.acc.s += sold; m.acc.p += m.avgP; m.acc.n++;
  });
};

/** Units a city would buy per day if the whole market priced at `price` (demand curve). */
UAE.demandAtPrice = function (city, pid, price) {
  var P = UAE.P[pid]; if (!P.perCap) return 0;
  return UAE.cityDemand(city, pid) * Math.pow(Math.max(0.4, Math.min(2.5, price / P.ref)), (P.el || -1) * 0.8);
};

/* ------------------------------------------------- wholesale (B2B) market --- */
/* Counters filled during the day by production / procurement hooks. */
UAE.wmCount = function (pid, field, q) {
  var S = UAE.S, w = S._wmDay || (S._wmDay = {}), r = w[pid] || (w[pid] = { made: 0, used: 0 });
  r[field] += q;
};
/** Daily: UAE-wide supply vs demand of each traded good -> local wholesale price. */
UAE.wholesaleDay = function () {
  var S = UAE.S, day = S._wmDay || {}; S._wmDay = {};
  S.wmkt = S.wmkt || {};
  UAE.PRODUCTS.forEach(function (P) {
    if (P.kind === 'consumer') return;
    var w = S.wmkt[P.id] || (S.wmkt[P.id] = { made: 0, used: 0, px: null, h: [] });
    var t = day[P.id] || { made: 0, used: 0 };
    w.made = w.made * 0.9 + t.made * 0.1; w.used = w.used * 0.9 + t.used * 0.1;   // 10-day smoothing
    var exp = UAE.worldPrice(P.id) * 0.94, imp = UAE.importBase(P.id) * (1 + UAE.RULES.customs) * 1.06;
    if (imp < exp) imp = exp * 1.02;
    var bal = (w.used + 1e-9) / (w.made + 1e-9);         // > 1 shortage, < 1 surplus
    if (!w.made && !w.used) bal = 1;
    var s = Math.max(0, Math.min(1, (bal - 0.5) / 1.0));  // 0 = deep surplus -> export parity, 1 = shortage -> import parity
    var target = exp + (imp - exp) * s;
    w.px = w.px == null ? target : w.px + (target - w.px) * 0.05;
    w.bal = bal; w.exp = exp; w.imp = imp;
  });
};
UAE.wholesalePrice = function (pid) {
  var w = UAE.S.wmkt && UAE.S.wmkt[pid];
  return w && w.px ? w.px : UAE.importBase(pid);
};

/* ------------------------------------------------- brand & marketing day --- */
UAE.MEDIA_REACH = { tv: 1.0, radio: 0.6, newspaper: 0.45, OUTDOOR: 0.35, DIGITAL: 0.7 };
/** Marketing expertise multiplier for a firm (manager) or the company (CMO / CEO). */
UAE.mktExpMult = function (co, f) {
  var e = 0;
  if (f && f.manager && UAE.person(f.manager)) e = Math.max(e, UAE.expertise(UAE.person(f.manager), 'marketing'));
  var cmo = co.cmo && UAE.person(co.cmo); if (cmo) e = Math.max(e, UAE.expertise(cmo, 'marketing') * 0.8);
  var ceo = UAE.person(co.ceo); if (ceo) e = Math.max(e, UAE.expertise(ceo, 'marketing') * 0.5);
  return 1 + e / 100;
};
/** Raise awareness of pid in city from `spend` AED today with effectiveness `eff`. */
UAE.pushAwareness = function (co, pid, city, spend, eff) {
  if (spend <= 0) return;
  var b = UAE.brand(co, pid, city), pop = UAE.S.cities[city] ? UAE.S.cities[city].pop : 1e6;
  var K = 9000 * Math.max(0.2, pop / 1e6);
  b.aw = Math.min(100, b.aw + 0.55 * eff * spend / (spend + K) * (1 - b.aw / 100));
};
/** Pay a media firm (or the outside market) for advertising. Balanced ledger both sides. */
UAE.payMedia = function (co, mediaId, city, amt) {
  if (amt <= 0) return;
  var m = UAE.S.firms[mediaId];
  UAE.L.expense(co, 'advertising', amt);
  if (m && m.status === 'open') UAE.fIncome(m, 'revenue', amt);
  else UAE.S.adPool[city] = (UAE.S.adPool[city] || 0) + amt * 0.5;      // outdoor / digital: half reaches local media pool
};
/** Daily brand dynamics for every company. */
UAE.brandDay = function () {
  var S = UAE.S;
  UAE.allCos().forEach(function (co) {
    if (co.status === 'BANKRUPT') return;
    var sells = {};                                     // pid -> {city: true}
    UAE.firmsOf(co.id).forEach(function (f) {
      if (f.status !== 'open') return;
      var k = UAE.FIRM_TYPES[f.type].kind;
      f.lines.forEach(function (l) { (sells[l.pid] || (sells[l.pid] = {}))[f.city] = true; });
      // in-store / local advertising budget pushes the firm's own products in its city
      if (f.adBudget && f.lines.length && (k === 'retail' || k === 'factory' || k === 'farm')) {
        var per = f.adBudget / 30 / f.lines.length, eff = 0.6 * UAE.mktExpMult(co, f);
        f.lines.forEach(function (l) { UAE.pushAwareness(co, l.pid, f.city, per, eff); });
      }
      // loyalty follows the experience customers have: quality vs city average, and price fairness
      if (k === 'retail') f.lines.forEach(function (l) {
        var m = S.mkt && S.mkt[f.city + '|' + l.pid]; if (!m || !l.sold) return;
        var b = UAE.brand(co, l.pid, f.city), q = l.lastQual || 50;
        var target = Math.max(-30, Math.min(40, (q - m.avgQ) * 0.8 + (UAE.priceRating(l.pid, l.price) - 50) * 0.12 + (co.prBoost || 0)));
        b.loy += (target - b.loy) * 0.004;
        // store popularity follows the overall ratings of what it sells
        var r = UAE.lineRatings(f, l);
        f.popu = f.popu == null ? 30 : f.popu + (r.overall - f.popu) * 0.003;
      });
    });
    // campaigns
    (co.campaigns || []).forEach(function (cp) {
      if (cp.until != null && S.day > cp.until) { cp.done = true; return; }
      var daily = cp.budget / 30; if (co.bs.cash < daily) return;
      var mf = S.firms[cp.media], kind = mf ? mf.type : cp.media;
      var reach = UAE.MEDIA_REACH[kind] || 0.4, q = mf ? (mf.quality || 50) / 50 : 1;
      var city = mf ? mf.city : cp.city;
      UAE.payMedia(co, cp.media, city, daily);
      var eff = reach * q * UAE.mktExpMult(co) * 1.2;
      if (city === 'UAE' || kind === 'DIGITAL') Object.keys(S.cities).forEach(function (c) { UAE.pushAwareness(co, cp.pid, c, daily / 3, eff * 0.6); });
      else UAE.pushAwareness(co, cp.pid, city, daily, eff);
      cp.spent = (cp.spent || 0) + daily;
    });
    if (co.campaigns) co.campaigns = co.campaigns.filter(function (c) { return !c.done; });
    // HQ CMO budget: company-wide awareness push; PR budget: loyalty
    var cmo = (co.hqBudget.cmo || 0) / 30, pr = (co.hqBudget.pr || 0) / 30, pids = Object.keys(sells);
    if (cmo && pids.length) {
      var n = 0; pids.forEach(function (p) { n += Object.keys(sells[p]).length; });
      pids.forEach(function (p) { Object.keys(sells[p]).forEach(function (c) { UAE.pushAwareness(co, p, c, cmo / n, 0.5 * UAE.mktExpMult(co)); }); });
    }
    co.prBoost = pr ? Math.min(8, 8 * pr / (pr + 50000)) : 0;
    // awareness decays without advertising (~4% a month); keep class-level brand for legacy screens
    var cls = {};
    for (var pid in (co.brandP || {})) {
      var byCity = co.brandP[pid], P = UAE.P[pid];
      for (var c in byCity) {
        var b = byCity[c]; b.aw *= 0.9986; if (!sells[pid]) b.loy *= 0.999;
        if (P) cls[P.cls] = Math.max(cls[P.cls] || 0, Math.max(0, Math.min(100, b.aw + b.loy)));
      }
    }
    for (var k in cls) co.brand[k] = cls[k];
  });
};

/* ------------------------------------------------- monthly market history --- */
UAE.microMonth = function () {
  var S = UAE.S;
  for (var key in (S.mkt || {})) {
    var m = S.mkt[key], a = m.acc;
    if (a && a.n) { m.h.push({ day: S.day, d: a.d / a.n, s: a.s / a.n, p: a.p / a.n }); if (m.h.length > 60) m.h.shift(); }
    m.acc = { d: 0, s: 0, p: 0, n: 0 };
  }
  for (var pid in (S.wmkt || {})) {
    var w = S.wmkt[pid]; w.h.push({ day: S.day, px: w.px, made: w.made, used: w.used }); if (w.h.length > 60) w.h.shift();
  }
};

/** Market share of each company for a product in a city (by units sold today). */
UAE.marketShares = function (city, pid) {
  var m = UAE.S.mkt && UAE.S.mkt[city + '|' + pid], out = {};
  if (!m || !m.demand) return out;
  UAE.allFirms().forEach(function (f) {
    if (f.city !== city || UAE.FIRM_TYPES[f.type].kind !== 'retail') return;
    f.lines.forEach(function (l) { if (l.pid === pid && l.sold) out[f.owner] = (out[f.owner] || 0) + l.sold / m.demand; });
  });
  out.BACKGROUND = m.bgUnits / m.demand;
  return out;
};

/* ------------------------------------------------- campaigns (player API) --- */
/** Start an advertising campaign. media = media firm id | 'OUTDOOR' | 'DIGITAL'. */
UAE.startCampaign = function (co, pid, media, city, budget, months) {
  if (!UAE.P[pid]) return { ok: false, why: 'Unknown product.' };
  if (!(budget > 0)) return { ok: false, why: 'Enter a monthly budget.' };
  var mf = UAE.S.firms[media];
  if (!mf && media !== 'OUTDOOR' && media !== 'DIGITAL') return { ok: false, why: 'Pick a media outlet.' };
  if (mf && UAE.FIRM_TYPES[mf.type].kind !== 'media') return { ok: false, why: 'Not a media firm.' };
  co.campaigns = co.campaigns || [];
  var cp = { id: UAE.uid('AD'), pid: pid, media: media, city: mf ? mf.city : (city || 'UAE'), budget: budget,
    start: UAE.S.day, until: months ? UAE.S.day + months * 30 : null, spent: 0 };
  co.campaigns.push(cp);
  return { ok: true, cp: cp };
};
UAE.stopCampaign = function (co, id) { co.campaigns = (co.campaigns || []).filter(function (c) { return c.id !== id; }); return { ok: true }; };
/** Media outlets a company can book (every open TV / radio / newspaper firm + outdoor + digital). */
UAE.mediaOutlets = function () {
  var out = UAE.allFirms().filter(function (f) { return f.status === 'open' && UAE.FIRM_TYPES[f.type].kind === 'media'; }).map(function (f) {
    return { id: f.id, name: f.name, city: f.city, kind: f.type, reach: UAE.MEDIA_REACH[f.type], quality: f.quality || 50, owner: f.owner };
  });
  out.push({ id: 'OUTDOOR', name: 'Outdoor billboards (Sheikh Zayed Rd, E11 …)', city: null, kind: 'OUTDOOR', reach: 0.35, quality: 50 });
  out.push({ id: 'DIGITAL', name: 'Digital / social ads (UAE-wide)', city: 'UAE', kind: 'DIGITAL', reach: 0.7, quality: 50 });
  return out;
};

/* ------------------------------------------- product insight (hover help) --- */
/** Products that use pid as an input (recipe), built once. */
UAE.usedBy = function (pid) {
  if (!UAE._usedBy) { UAE._usedBy = {}; UAE.PRODUCTS.forEach(function (P) { if (P.rec) P.rec.in.forEach(function (x) { (UAE._usedBy[x[0]] = UAE._usedBy[x[0]] || []).push(P.id); }); }); }
  return UAE._usedBy[pid] || [];
};
/** Market facts for one product, as plain-text lines (no DOM): demand, supply, shortage, wholesale balance,
 *  raw-material shortages of its inputs, what it is used for, necessity index, world market size. */
UAE.productInsight = function (pid) {
  var S = UAE.S, P = UAE.P[pid]; if (!P || !S) return [];
  var N = UAE.fmt.num, A = UAE.fmt.aed, out = [], u = P.unit || 'units';
  var nec = UAE.invNecessity ? UAE.invNecessity(P) : null;
  if (nec != null) out.push('Necessity index ' + Math.round(nec * 100) + '% - ' + (nec >= 0.6 ? 'essential: people and businesses keep buying when prices rise' : nec >= 0.3 ? 'normal: demand falls somewhat when prices rise' : 'luxury / optional: buyers drop it quickly when prices rise'));
  // consumer demand across all cities (units per day, from the retail market)
  var D = 0, sold = 0, sellers = 0;
  Object.keys(S.cities).forEach(function (c) { var m = S.mkt && S.mkt[c + '|' + pid]; if (m) { D += m.demand || 0; sold += Math.max(0, (m.sold || 0)); sellers += m.sellers || 0; } });
  if (D > 0) {
    var met = Math.min(1, sold / D);
    out.push('UAE shop demand ' + N(D) + ' ' + u + '/day · our modelled shops sell ' + N(sold) + ' (' + Math.round(met * 100) + '%) from ' + sellers + ' stores; the rest is bought from importers / small shops' + (met < 0.5 ? ' - plenty of room for new sellers' : ''));
  }
  // wholesale (B2B) balance: used vs made in the UAE
  var w = S.wmkt && S.wmkt[pid];
  if (w && (w.made > 0.01 || w.used > 0.01)) {
    var bal = (w.used + 1e-9) / (w.made + 1e-9);
    out.push('UAE production ' + N(w.made) + ' ' + u + '/day vs factory use ' + N(w.used) + '/day → ' + (w.made < 0.01 ? 'NO local production: all imported' : bal > 1.1 ? 'SHORTAGE (' + Math.round(bal * 100) + '% of output is needed)' : bal < 0.8 ? 'surplus (only ' + Math.round(bal * 100) + '% used)' : 'balanced') +
      (w.px ? ' · wholesale ' + A(w.px) + ' (import ' + A(w.imp || 0) + ')' : ''));
  }
  // raw materials / inputs and their shortages
  if (P.rec && P.rec.in.length) {
    var parts = P.rec.in.map(function (x) {
      var wi = S.wmkt && S.wmkt[x[0]], Q = UAE.P[x[0]], name = Q ? Q.name : x[0];
      if (!wi || (wi.made < 0.01 && wi.used < 0.01)) return name + ' (imported)';
      if (wi.made < 0.01) return name + ' (no UAE producer - imported: a gap to fill)';
      var b = wi.used / wi.made; return name + (b > 1.1 ? ' (SHORT ' + Math.round(b * 100) + '%)' : b < 0.8 ? ' (plenty)' : ' (ok)');
    });
    out.push('Made from: ' + parts.join(', '));
  }
  var ub = UAE.usedBy(pid);
  if (ub.length) out.push('Used to make: ' + ub.slice(0, 8).map(function (x) { return UAE.P[x] ? UAE.P[x].name : x; }).join(', ') + (ub.length > 8 ? ' +' + (ub.length - 8) + ' more' : '') + ' - demand for it follows those factories');
  if (UAE.wmSize) { var ws = UAE.wmSize(pid); if (ws > 0) out.push('World market about ' + A(ws) + ' a year (UAE firms can export)'); }
  return out;
};
