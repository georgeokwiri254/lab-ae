/* ============================================================================
 * UAE CAPITALISM LAB  -  AI COMPANIES
 * Every AI company is run by its CEO persona. Traits:
 *   aggression -> how much cash it spends expanding and how often
 *   risk       -> willingness to borrow
 *   pricing    -> discount (0) vs premium (1) pricing
 *   diversify  -> chance to enter an industry outside its home sector
 * AI obeys the same rules as the player: cash, land zoning, plot collisions,
 * supply links and the same accounting. Each company reviews itself monthly
 * (staggered over the month so the load is spread).
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});
UAE.AI = {};

UAE.AI.hash = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

UAE.AI.day = function () {
  var S = UAE.S;
  UAE.allCos().forEach(function (co) {
    if (co.status === 'BANKRUPT' || co.foreign) return;          // NYSE / NASDAQ companies only trade
    if ((S.day + UAE.AI.hash(co.id)) % 30 !== 0) return;
    if (co.controller === 'PLAYER') { if (co.autoPricing) UAE.AI.operate(co); return; }
    UAE.AI.operate(co);
    UAE.AI.strategy(co);
  });
};

/* ------------------------------------------------ day-to-day operations */
UAE.AI.operate = function (co) {
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status !== 'open') return;
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (k === 'retail') f.lines.forEach(function (l) {
      var P = UAE.P[l.pid];
      // pick the best-value supplier (own production preferred)
      var opts = UAE.supplyOptions(f, l.pid, true), best = UAE.firstStocked(opts), own = opts.find(function (o) { return o.owner === co.id && o.avail > 0; });
      if (own && own.unit < best.unit * 1.25) best = own;
      else opts.forEach(function (o) { if ((o.avail > UAE.lineCap(f, l) * 3 || o.id === 'IMPORT') && o.unit / Math.max(30, o.quality) < best.unit / Math.max(30, best.quality)) best = o; });
      l.supplier = best.id;
      var floor = best.unit * (1 + UAE.RULES.vat) * 1.06;
      var cap = l.cap || UAE.lineCap(f, l);
      if ((l.sold || 0) >= cap * 0.95) l.price *= 1.03;
      else if ((l.demand || 0) < cap * 0.5) l.price *= 0.97;
      var target = P.ref * (0.9 + 0.2 * co.traits.pricing);
      l.price = l.price * 0.85 + target * 0.15;
      l.price = Math.max(floor, Math.min(P.ref * 1.6, l.price));
    });
    if (k === 'hotel') { if (f.occ > 0.9) f.adr *= 1.04; else if (f.occ < 0.6) f.adr *= 0.96; }
    if (k === 'service') {
      var svc = UAE.SERVICES[f.svc];
      if (f.customers > svc.base * f.size * 1.2) f.price *= 1.03; else if (f.customers < svc.base * 0.5) f.price *= 0.97;
      f.price = Math.max(svc.price * 0.6, Math.min(svc.price * 1.8, f.price));
    }
    if (k === 'sports') { if (f.visitors > 1500 * f.size) f.price *= 1.03; else f.price *= 0.99; }
    // advertising: spend ~1.5% of monthly revenue on consumer-facing firms
    if (['retail','service','hotel','internet','mall'].indexOf(k) >= 0 && !(f.adByCmo && co.cmo && UAE.policy(co).cmoAuto !== false)) f.adBudget = Math.max(0, f.last.rev * 0.015);
    // training if efficiency is low
    f.trainBudget = f.eff < 0.95 ? Math.max(0, f.last.rev * 0.005) : 0;
  });
};

/* ---------------------------------------------------- strategic review */
UAE.AI.strategy = function (co) {
  var S = UAE.S, R = UAE.rng, t = co.traits;
  var tot = UAE.totals(co);
  // 1 close chronically loss-making firms (not the real flagship assets)
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.seed || UAE.neverCloseAsLoser(f) || S.day - f.openDay < 730 || f.hist.length < 12) return;
    var last6 = f.hist.slice(-12);                     // 12 losing months in a row (was 6)
    if (last6.every(function (p) { return p < 0; }) && R.chance(0.5)) {
      UAE.news(co.name + ' closes loss-making ' + f.name + '.', 'ai'); UAE.sellFirm(f);
    }
  });
  // 2 liquidity: borrow when short, repay when flush
  var monthlyCost = Math.max(1e6, co.is.months.length ? co.is.months[co.is.months.length - 1].salaries * 3 : 1e6);
  if (co.bs.cash < monthlyCost * 2 && UAE.creditLimit(co) > monthlyCost * 3 && R.chance(0.3 + t.risk * 0.6))
    UAE.takeLoan(co, Math.min(UAE.creditLimit(co) * 0.5, monthlyCost * 6));
  if (co.bs.loans > 0 && co.bs.cash > monthlyCost * 10) { var spare = co.bs.cash - monthlyCost * 8; co.loanList.slice().forEach(function (l) { if (spare > 0 && l.by !== 'player') spare -= UAE.repayOne(co, l, spare); }); }
  // 3 expansion (real groups expand slowly; fictional start-ups by aggression)
  var p = co.seed ? 0.08 : 0.25 + 0.6 * t.aggression;
  if (R.chance(p)) UAE.AI.expand(co, false);
  // 4 upgrade a successful firm
  var best = UAE.firmsOf(co.id).filter(function (f) { return f.status === 'open' && !f.seed && f.size < 8 && f.last.profit > 0; })
    .sort(function (a, b) { return b.last.profit - a.last.profit; })[0];
  if (best && R.chance(0.15 + 0.3 * t.aggression) && co.bs.cash > UAE.BUILD[best.type][0] * 3) UAE.expandFirm(best);
  // 5 portfolio: buy into undervalued listed companies
  if (!co.seed && R.chance(0.08 * t.aggression) && co.bs.cash > 100e6) {
    var cands = UAE.allCos().filter(function (c) { return c.id !== co.id && UAE.isTradable(c) && (c.holders.PUBLIC || 0) > 0; });
    if (cands.length) {
      var c = R.pick(cands), budget = co.bs.cash * 0.05, qty = Math.floor(budget / c.price);
      var r = UAE.buyShares('C:' + co.id, c, qty);
      if (r.ok && r.cost > 20e6) UAE.news(co.name + ' bought a stake in ' + c.name + ' (' + UAE.fmt.aed(r.cost) + ').', 'ai');
    }
  }
  // 6 listed AI companies issue shares when cash-starved and the price is healthy
  if (UAE.isTradable(co) && !co.seed && co.bs.cash < monthlyCost && co.price > UAE.bookValue(co) / co.shares)
    UAE.issueShares(co, Math.round(co.shares * 0.05));
};

/* --------------------------------------------------------- expansion */
UAE.AI.GENERAL = ['retail','retail','service','factory','warehouse','apartment','hotel','commercial','internet','software','radio','farm','logistics','importer'];

UAE.AI.expand = function (co, instant) {
  var R = UAE.rng, S = UAE.S;
  var sec = UAE.SECTORS[co.sector] || UAE.SECTORS.holding;
  var type = R.chance(co.traits.diversify) ? R.pick(UAE.AI.GENERAL) : R.pick(sec.firms);
  // vertical integration: if we import a lot of something we could make, build the factory
  var integ = UAE.AI.integrationTarget(co);
  if (integ && R.chance(0.5)) type = integ.type;
  var T = UAE.FIRM_TYPES[type]; if (!T || T.disabled || T.gov) return null;
  // city choice: bigger, richer markets first; home city favoured
  var cities = Object.keys(S.cities).map(function (k) {
    var c = S.cities[k], n = UAE.allFirms().filter(function (f) { return f.city === k && f.type === type; }).length;
    var w = c.pop / 1e6 * UAE.CITIES[k].income / (1 + 0.15 * n) * (k === co.hq ? 2 : 1);
    if (['mine','oilwell','farm','solar'].indexOf(type) >= 0) w = 1;
    return { k: k, w: w };
  });
  var choice = null;
  for (var tries = 0; tries < 6 && !choice; tries++) {
    var tw = cities.reduce(function (s, x) { return s + x.w; }, 0), r = R.next() * tw, city = cities[0].k;
    for (var i = 0; i < cities.length; i++) { r -= cities[i].w; if (r <= 0) { city = cities[i].k; break; } }
    var ds = UAE.DISTRICTS.filter(function (d) { return d.city === city && T.zones.indexOf(d.zone) >= 0; });
    if (!ds.length) continue;
    var d = R.pick(ds), pnt = UAE.randomPointIn(d);
    if (pnt) choice = { p: pnt, d: d };
  }
  if (!choice) return null;
  var q = UAE.quoteFirm(type, choice.p, 1);
  if (!q.ok) return null;
  var budget = co.seed ? Math.min(co.bs.cash * 0.05, 1.5e9) : co.bs.cash * (0.25 + 0.45 * co.traits.aggression);
  if (q.total > budget) return null;
  var f = UAE.createFirm(co.id, type, choice.p, { instant: instant, name: UAE.AI.firmName(co, type, choice.d) });
  if (!f) return null;
  UAE.AI.configure(co, f, integ && integ.type === type ? integ.pid : null);
  if (!instant && (UAE.rng.chance(0.4) || co.seed))
    UAE.news(co.name + ' is building a new ' + T.name + ' in ' + choice.d.name + '.', 'ai');
  return f;
};

UAE.AI.firmName = function (co, type, d) {
  var short = co.name.split(' ')[0];
  var label = { retail:'Store', factory:'Plant', farm:'Farm', warehouse:'Distribution Centre', hotel:'Hotel', apartment:'Residences',
    commercial:'Tower', service:'', internet:'Online', software:'Software', mine:'Quarry', oilwell:'Field', mall:'Mall', hq:'HQ',
    logistics:'Logistics', importer:'Trading', exporter:'Exports', radio:'FM', tv:'TV', newspaper:'Daily', rnd:'Labs' }[type] || UAE.FIRM_TYPES[type].name;
  var place = d.name.split(/[\/(]/)[0].trim();
  return short + ' ' + label + ' ' + place;
};

/** Find a product this company sells heavily from imports that it could manufacture. */
UAE.AI.integrationTarget = function (co) {
  var vol = {};
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.type !== 'retail') return;
    f.lines.forEach(function (l) { if (l.supplier === 'IMPORT' && UAE.P[l.pid].rec) vol[l.pid] = (vol[l.pid] || 0) + (l.sold || 0); });
  });
  var best = null, bv = 0;
  for (var pid in vol) {
    var P = UAE.P[pid], made = UAE.firmsOf(co.id).some(function (f) { return f.lines.some(function (l) { return l.pid === pid && f.type !== 'retail'; }); });
    if (made) continue;
    var v = vol[pid] * (P.ref - P.imp);
    if (v > bv && vol[pid] > P.rec.cap * 0.15) { bv = v; best = pid; }
  }
  return best ? { type: 'factory', pid: best } : null;
};

/** Set up a freshly built AI firm (products, supplier links, prices). */
UAE.AI.configure = function (co, f, pid) {
  var R = UAE.rng, k = UAE.FIRM_TYPES[f.type].kind;
  var consumer = UAE.PRODUCTS.filter(function (p) { return p.kind === 'consumer' || p.kind === 'fuel' || p.kind === 'software'; });
  if (k === 'retail') {
    // choose products by expected margin x demand, with some randomness; stores specialise by sector
    var scored = consumer.filter(function (p) { return p.id !== 'petrol' || co.sector === 'retail'; }).map(function (p) {
      var land = UAE.landedImport(p.id, f).unit, margin = (p.ref / 1.05 - land) / p.ref;
      return { p: p, s: margin * Math.log(2 + UAE.cityDemand(f.city, p.id) * p.ref / 1e5) * R.range(0.5, 1.5) };
    }).sort(function (a, b) { return b.s - a.s; });
    var n = R.int(2, 4);
    // group-coherent assortment: stick to the class of the top pick when possible
    var top = scored[0].p.cls, picks = scored.filter(function (x) { return x.p.cls === top; }).slice(0, n);
    scored.forEach(function (x) { if (picks.length < n && picks.indexOf(x) < 0) picks.push(x); });
    picks.forEach(function (x) {
      var line = UAE.addLine(f, x.p.id); if (!line) return;
      var opts = UAE.supplyOptions(f, x.p.id), own = opts.find(function (o) { return o.owner === co.id && o.avail > 0; });
      line.supplier = own ? own.id : opts[0].avail > 0 ? opts[0].id : 'IMPORT';
      line.price = Math.round(x.p.ref * (0.9 + 0.2 * co.traits.pricing) * 100) / 100;
    });
  } else if (k === 'factory') {
    var choice = pid;
    if (!choice) {
      var bySector = { industrial:['cement','glass'], chemicals:['polymer','urea'], metals:['aluminium','alumina'], oilgas:['petrol','jetfuel'] }[co.sector];
      var makeable = UAE.PRODUCTS.filter(function (p) { return p.rec; });
      choice = bySector ? R.pick(bySector) : R.pick(makeable).id;
    }
    UAE.addLine(f, choice);
    // point own stores at the new plant
    UAE.firmsOf(co.id).forEach(function (g) { g.lines.forEach(function (l) { if (g.type === 'retail' && l.pid === choice) l.supplier = f.id; }); });
  } else if (k === 'farm') UAE.addLine(f, R.pick(['rawmilk','poultry','dates','veg']));
  else if (k === 'mine') UAE.addLine(f, R.pick(['limestone','sand']));
  else if (k === 'oil') UAE.addLine(f, R.pick(['crude','crude','gas']));
  else if (k === 'warehouse') {
    var sold = {}; UAE.firmsOf(co.id).forEach(function (g) { g.lines.forEach(function (l) { if (g.type === 'retail') sold[l.pid] = 1; }); });
    var list = Object.keys(sold); if (!list.length) list = [R.pick(consumer).id];
    list.slice(0, 4).forEach(function (p) { UAE.addLine(f, p); });
  } else if (k === 'service') { f.svc = R.pick(Object.keys(UAE.SERVICES)); f.price = UAE.SERVICES[f.svc].price; }
  else if (k === 'internet') f.model = R.pick(Object.keys(UAE.INTERNET_MODELS));
  else if (k === 'software') UAE.setSoftware(f, R.pick(['os','os','ai','ai','ai','office','security','game','design','video','audio','utility']));
  else if (k === 'rnd') {
    var made = []; UAE.firmsOf(co.id).forEach(function (g) { g.lines.forEach(function (l) { made.push(l.pid); }); });
    f.target = made.length ? R.pick(made) : 'phone';
  }
};
