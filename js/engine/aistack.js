/* ============================================================================
 * UAE CAPITALISM LAB  -  AI TECH STACK: CLOUD DATA CENTRES, AI SUBSCRIPTIONS,
 *                        E-COMMERCE CATALOGUE & MEMBERSHIP
 *
 *  Data centres (cloud): buy AI servers (own server factory, other companies or
 *  import) and install them (stock -> equipment, booked as PPE). Businesses rent
 *  them as cloud compute: a UAE-wide cloud market (server-months, growing ~40%/yr)
 *  is shared by price, quality and capacity against global hyperscalers. Your own
 *  AI labs (LLM / AI Assistant titles) use your own cloud first.
 *
 *  AI subscriptions: software companies with the AI Assistant or Frontier AI
 *  Model title sell a monthly subscription (consumers + teams). Subscribers move
 *  towards a target set by quality, price and brand; every subscriber needs
 *  compute (AED / month): cheap on your own cloud, otherwise rented.
 *
 *  E-commerce: an internet company on the e-commerce model has a product
 *  catalogue (up to 8 lines, own or other companies' products, or imports)
 *  and sells online to the whole UAE, plus a paid membership (Prime-style):
 *  members pay monthly and buy ~30% more.
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.CLOUD = { pricePerServer: 6000, baseDemand: 12000, grow: 0.4, hyperscalers: 300, computePerSub: 6, computePerSubOwn: 1.5, perLevel: 400, maxPerLevel: 2000 };
/* AI subscriptions are a GLOBAL market: potential subscribers = world population x adoption. Adoption follows an
 * S-curve: it starts at 'adoption' (2026), grows ~'grow' a year early on and levels off at 'max' (share of the world
 * that pays for it at the reference price - EST). 'labs' = weight of the global AI labs (OpenAI, Google, Anthropic...)
 * already serving the market: new firms win share with quality, price and brand. */
UAE.SUBS = { ai: { ref: 75, adoption: 0.05, grow: 0.35, max: 0.35, labs: 40 }, llm: { ref: 220, adoption: 0.01, grow: 0.6, max: 0.10, labs: 40 } };
/* Subscription plans (tiers). mix = share of subscribers on that plan at typical prices; q = model quality the plan
 * needs (below it the plan barely sells). Prices are monthly, typical market levels (EST). */
UAE.SUB_TIERS = {
  ai:  [{ id: 'basic', name: 'Basic', ref: 35, mix: 0.55, q: 0 }, { id: 'plus', name: 'Plus', ref: 75, mix: 0.30, q: 40 },
        { id: 'pro', name: 'Pro', ref: 199, mix: 0.12, q: 65 }, { id: 'biz', name: 'Business (per seat)', ref: 450, mix: 0.03, q: 75 }],
  llm: [{ id: 'basic', name: 'Basic', ref: 99, mix: 0.50, q: 0 }, { id: 'plus', name: 'Plus', ref: 220, mix: 0.30, q: 40 },
        { id: 'pro', name: 'Pro', ref: 799, mix: 0.15, q: 65 }, { id: 'ent', name: 'Enterprise (per seat)', ref: 2500, mix: 0.05, q: 80 }]
};
/** A firm's plans: prices (set by you), share of subscribers on each, average price and the price index vs typical. */
UAE.subPlans = function (f, pid) {
  var T = UAE.SUB_TIERS[pid]; if (!T) return null;
  f.tiers = f.tiers || {};
  var q = f.quality || 40, raw = {}, tot = 0;
  T.forEach(function (t) {
    if (!(f.tiers[t.id] > 0)) f.tiers[t.id] = t.ref;
    var gate = q >= t.q ? 1 : Math.max(0.05, Math.pow(q / t.q, 3));
    raw[t.id] = t.mix * Math.pow(t.ref / f.tiers[t.id], 1.5) * gate; tot += raw[t.id];
  });
  var mix = {}, avg = 0, avgRef = 0;
  T.forEach(function (t) { mix[t.id] = raw[t.id] / tot; avg += mix[t.id] * f.tiers[t.id]; avgRef += mix[t.id] * t.ref; });
  return { tiers: T, mix: mix, avgPrice: avg, priceIndex: avgRef / Math.max(1, avg) };
};
UAE.WORLD_POP = { base: 8.2e9, grow: 0.008 };                                   // 2026, UN (REAL ~8.2bn), +0.8%/yr EST
UAE.worldPop = function () { return UAE.WORLD_POP.base * Math.pow(1 + UAE.WORLD_POP.grow, UAE.S.day / 365); };
/** S-curve: starts at a0, grows ~g a year early on, levels off at max (logistic). */
UAE.sCurve = function (a0, g, max, yrs) { return max / (1 + (max / a0 - 1) * Math.exp(-Math.log(1 + g) * yrs)); };
/** Growth multiplier that starts at 1, grows ~g a year early on and levels off at cap (x times the start). */
UAE.capGrowth = function (g, cap, yrs) { return UAE.sCurve(1, g, cap, yrs); };
UAE.ECOM = { onlineShare: 0.12, onlineGrow: 0.08, bgWeight: 3, memberFee: 25, memberBoost: 0.3, deliveryPerUnit: 9 };

/* ------------------------------------------------------------ data centres */
UAE.cloudCapacity = function (coId) {   // servers installed in a company's open data centres
  return UAE.firmsOf(coId).reduce(function (s, f) { return s + (f.type === 'datacenter' && f.status === 'open' ? (f.servers || 0) : 0); }, 0);
};
UAE.dcDay = function (list) {
  var S = UAE.S, m = S.macro, yrs = S.day / 365;
  var cg = UAE.capGrowth(UAE.CLOUD.grow, 60, yrs);                                  // fast growth that levels off at 60x
  var demand = UAE.CLOUD.baseDemand * cg * m.tech;                                   // server-months rented UAE-wide
  var sum = UAE.CLOUD.hyperscalers * cg;                                             // global clouds compete for the same demand
  list.forEach(function (f) {
    if (!f.lines.length) UAE.addLine(f, 'server', { price: 0 });
    if (f.cloudPrice == null) f.cloudPrice = UAE.CLOUD.pricePerServer;
    if (f.serverTarget == null) f.serverTarget = UAE.CLOUD.perLevel * f.size;
    // auto-grow: a busy data centre (>85% used) adds racks while the company has cash
    if (f.autoGrow !== false && f.util > 0.85 && f.servers >= f.serverTarget && f.serverTarget < UAE.CLOUD.maxPerLevel * f.size && UAE.co(f.owner).bs.cash > 3e8)
      f.serverTarget = Math.min(UAE.CLOUD.maxPerLevel * f.size, f.serverTarget + 100 * f.size);
    // buy + install servers up to the target (installed servers become equipment)
    var need = f.serverTarget - (f.servers || 0);
    if (need > 0) {
      var have = UAE.stockQ(f, 'server');
      if (have < need) UAE.procure(f, 'server', need - have, f.lines[0].supplier || 'IMPORT');
      var n = Math.min(need, Math.floor(UAE.stockQ(f, 'server')));
      if (n > 0) {
        var q = f.stock.server ? f.stock.server.qual : 60, basis = UAE.stockTake(f, 'server', n), co = UAE.co(f.owner);
        co.bs.ppe += basis; f.ppe += basis; f.servers = (f.servers || 0) + n;
        f.serverQual = ((f.serverQual || q) * (f.servers - n) + q * n) / f.servers;
      }
    }
    f._dcA = (f.servers || 0) * Math.pow((f.serverQual || 60) / 60, 0.6) * Math.pow(UAE.CLOUD.pricePerServer / Math.max(1000, f.cloudPrice), 1.6);
    sum += f._dcA;
  });
  var subsOf = {}, needOf = {}, labsOf = {};                  // computed once per company, not once per firm
  list.forEach(function (f) {
    if (needOf[f.owner] == null) {
      needOf[f.owner] = UAE.ownComputeNeed(f.owner);
      subsOf[f.owner] = Math.max(1, UAE.ownSubs(f.owner));                                               // own AI labs fill their own cloud first
      labsOf[f.owner] = UAE.firmsOf(f.owner).filter(function (g) { return g.type === 'software' && g.subs; });
    }
    var own = needOf[f.owner];
    var ext = demand * f._dcA / sum;
    var rented = Math.min(f.servers || 0, ext + Math.min(own, (f.servers || 0) * 0.5));
    f.util = f.servers ? Math.min(1, rented / f.servers) : 0;
    f.rented = rented;
    var ownUse = Math.min(own, rented), rev = Math.max(0, rented - ownUse) * f.cloudPrice / 30;
    UAE.fIncome(f, 'revenue', rev);
    // your own AI labs pay the data centre internally at cost: shows in each firm's profit, nets to zero for the company
    var internal = ownUse * 1600 / 30; f.m.rev += internal; f.ownUse = ownUse;
    labsOf[f.owner].forEach(function (g) { g.m.cost += internal * (g.subs / subsOf[f.owner]); });
    UAE.fExpense(f, 'utilities', (f.servers || 0) * 1400 / 30 * (UAE.RULES.utilityMult[UAE.CITIES[f.city].emirate] || 1));   // ~10 kW per rack (EST)
  });
};
/** Server-months of compute a company's own AI subscriptions need. */
UAE.ownSubs = function (coId) { return UAE.firmsOf(coId).reduce(function (s, f) { return s + (f.type === 'software' ? (f.subs || 0) : 0); }, 0); };
UAE.ownComputeNeed = function (coId) {
  return UAE.firmsOf(coId).reduce(function (s, f) { return s + (f.type === 'software' && f.subs ? f.subs * UAE.CLOUD.computePerSub / UAE.CLOUD.pricePerServer : 0); }, 0);
};

/* ------------------------------------------------------- AI subscriptions */
UAE.subsDay = function (list) {
  var S = UAE.S, pop = 0, capOf = {}; Object.keys(S.cities).forEach(function (k) { pop += S.cities[k].pop; });
  var byPid = {};
  list.forEach(function (f) { var pid = UAE.swPid(f); if (UAE.SUBS[pid]) (byPid[pid] || (byPid[pid] = [])).push(f); });
  Object.keys(byPid).forEach(function (pid) {
    var C = UAE.SUBS[pid], firms = byPid[pid];
    var market = UAE.worldPop() * UAE.sCurve(C.adoption, C.grow, C.max, S.day / 365) * S.macro.tech;   // global, levels off
    var sum = C.labs || 40;                                              // global AI labs (incumbents)
    firms.forEach(function (f) {
      var pl = UAE.subPlans(f, pid); f._plans = pl; f.tierMix = pl.mix; f.subPrice = pl.avgPrice;     // average price across plans
      var co = UAE.co(f.owner), b = UAE.brandRating(co, pid, co.hq || 'DXB');
      f._sA = Math.pow((f.quality || 40) / 55, 2) * Math.pow(pl.priceIndex, 1.8) * Math.pow((b + 15) / 45, 0.5);
      sum += f._sA;
    });
    firms.forEach(function (f) {
      var target = market * f._sA / sum; f.subs = f.subs || 0;
      f.subs += (target - f.subs) * 0.02;
      var rev = f.subs * f.subPrice / 30;                                   // = sum over plans of subscribers x price
      var cap = capOf[f.owner] != null ? capOf[f.owner] : (capOf[f.owner] = UAE.cloudCapacity(f.owner)), needServers = f.subs * UAE.CLOUD.computePerSub / UAE.CLOUD.pricePerServer;
      var ownShare = needServers > 0 ? Math.min(1, cap / needServers) : 1;
      var compute = f.subs / 30 * (UAE.CLOUD.computePerSubOwn * ownShare + UAE.CLOUD.computePerSub * (1 - ownShare));
      UAE.fIncome(f, 'revenue', rev / (1 + UAE.RULES.vat)); UAE.fExpense(f, 'otherOpex', compute);
      f.subTarget = target; f.subMarket = market; f.ownCompute = ownShare;
    });
  });
};
/** LLM research runs faster with your own cloud (compute for training). */
UAE.computeBoost = function (co) { return 1 + Math.min(0.6, UAE.cloudCapacity(co.id) / 400); };

/* --------------------------------------------------------------- e-commerce */
UAE.ecomDay = function (list) {
  var S = UAE.S, share = UAE.sCurve(UAE.ECOM.onlineShare, UAE.ECOM.onlineGrow, 0.5, S.day / 365);   // levels off at 50% of shopping
  var groups = {};
  list.forEach(function (f) {
    if (f.model !== 'ecommerce') return;
    if (f.memberFee == null) f.memberFee = UAE.ECOM.memberFee;
    f.members = f.members || 0;
    var target = (f.users || 0) * 0.25 * Math.pow(UAE.ECOM.memberFee / Math.max(1, f.memberFee), 1.5);
    f.members += (target - f.members) * 0.01;
    UAE.fIncome(f, 'revenue', f.members * f.memberFee / 30 / (1 + UAE.RULES.vat));
    f.lines.forEach(function (l) { (groups[l.pid] || (groups[l.pid] = [])).push({ f: f, l: l }); });
    // keep stock: ~5 days of capacity (own factories / other companies / import)
    f.lines.forEach(function (l) {
      var cap = UAE.ecomCap(f, l), need = cap * 5 - UAE.stockQ(f, l.pid);
      if (need > cap) UAE.procure(f, l.pid, need, l.supplier || 'IMPORT');
    });
  });
  Object.keys(groups).forEach(function (pid) {
    var P = UAE.P[pid], D = 0;
    Object.keys(S.cities).forEach(function (c) { D += UAE.cityDemand(c, pid); });
    D *= share;
    var sum = UAE.ECOM.bgWeight;
    groups[pid].forEach(function (e) {
      var co = UAE.co(e.f.owner), s = e.f.stock[pid], q = s ? s.qual : 50;
      e.A = Math.pow(q / 50, 0.7) * Math.pow((P.ref || P.imp) / Math.max(0.01, e.l.price), 2.2) * (1 + (co.brand.Internet || 10) / 100) * (1 + UAE.ECOM.memberBoost * Math.min(1, e.f.members / Math.max(1, e.f.users || 1) * 4));
      sum += e.A;
    });
    groups[pid].forEach(function (e) {
      var units = Math.min(D * e.A / sum, UAE.ecomCap(e.f, e.l), UAE.stockQ(e.f, pid));
      e.l.demand = D * e.A / sum; e.l.cap = UAE.ecomCap(e.f, e.l);
      if (units <= 0) { e.l.sold = 0; return; }
      var gross = units * e.l.price, net = gross / (1 + UAE.RULES.vat), basis = UAE.stockTake(e.f, pid, units);
      UAE.fIncome(e.f, 'revenue', net); UAE.fCogs(e.f, basis);
      var deliv = units * UAE.ECOM.deliveryPerUnit * (UAE.hasFirmIn(e.f.owner, 'logistics', e.f.city) ? 0.6 : 1);
      UAE.fExpense(e.f, 'otherOpex', deliv);
      e.l.sold = units; S.cities[e.f.city].vat += gross - net;
    });
  });
};
UAE.ecomCap = function (f, l) { return (UAE.P[l.pid].cap || 10) * 6 * (1 + 0.8 * (f.size - 1)) * (f.eff || 1); };

/** Fill an e-commerce catalogue: the company's own consumer products first, then best-selling imports. */
UAE.ecomStock = function (co, f) {
  var own = [];
  UAE.firmsOf(co.id).forEach(function (g) { if (g.type === 'factory' || g.type === 'software') g.lines.forEach(function (l) { var P = UAE.P[l.pid]; if (P && P.perCap && own.indexOf(l.pid) < 0) own.push(l.pid); }); });
  var extra = UAE.PRODUCTS.filter(function (p) { return p.perCap && (p.kind === 'consumer' || p.kind === 'software') && own.indexOf(p.id) < 0 && UAE.inScope(co, p.id); })
    .sort(function (a, b) { return b.ref * b.perCap - a.ref * a.perCap; }).map(function (p) { return p.id; });
  own.concat(extra).slice(0, UAE.FIRM_TYPES.internet.lines).forEach(function (pid) {
    var l = UAE.addLine(f, pid, { price: Math.round(UAE.P[pid].ref * 0.97 * 100) / 100 }); if (!l) return;
    var o = UAE.supplyOptions(f, pid).find(function (x) { return x.owner === co.id && x.avail > 0; });
    l.supplier = o ? o.id : 'IMPORT';
  });
};
