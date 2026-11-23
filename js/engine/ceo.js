/* ============================================================================
 * UAE CAPITALISM LAB  -  CEO: EXPERTISE, EXPANSION STRATEGIES, SCOPE OF
 * PRODUCTION, MANAGEMENT POLICIES  (Capitalism Lab: Persons > CEO tabs)
 *
 * Expertise (0-100 per area) - every 20 points = +1 "unit level":
 *   retail, manufacturing, farming, raw (mines/wells), rnd, marketing, training,
 *   realestate, media, software, internet, banking, service, logistics
 *   + product-class expertise (speeds up R&D in that class).
 *   Managers apply their expertise to the firm they run; the CEO applies a
 *   smaller company-wide bonus. Expertise grows with experience.
 *
 * Expansion strategies: which industries the CEO may enter, backward
 *   integration tendency (0-100), acquire / sell technology, expand in retail.
 * Scope of production: product classes the CEO may make / sell.
 * Management policies: pricing level, purchasing, issuing shares / bonds,
 *   loans, closing loss makers, ad & training budgets, cash & profit needed
 *   before expanding, dividend payout.
 * AI companies obey their own CEO's policies. The player's company follows them
 * too when "Delegate to CEO" (co.ceoAuto) is switched on and a CEO is hired.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.EXPERTISE = [
  ['retail', 'Retailing'], ['manufacturing', 'Manufacturing'], ['farming', 'Farming'], ['raw', 'Raw Material Production'],
  ['rnd', 'Research & Development'], ['marketing', 'Marketing'], ['training', 'Training'], ['realestate', 'Real Estate'],
  ['media', 'Media'], ['software', 'Software'], ['internet', 'Internet & Telecom'], ['banking', 'Banking & Insurance'],
  ['service', 'Services & Hospitality'], ['logistics', 'Trade & Logistics']
];
/** Firm type -> expertise area. */
UAE.INDUSTRY = {
  retail: 'retail', factory: 'manufacturing', farm: 'farming', mine: 'raw', oilwell: 'raw', solar: 'raw', rnd: 'rnd',
  tv: 'media', radio: 'media', newspaper: 'media', apartment: 'realestate', commercial: 'realestate', mall: 'realestate', mansion: 'realestate',
  software: 'software', internet: 'internet', telecom: 'internet', datacenter: 'internet', bankhq: 'banking', bankbranch: 'banking',
  inshq: 'banking', insoffice: 'banking', service: 'service', hotel: 'service', sports: 'service',
  importer: 'logistics', exporter: 'logistics', logistics: 'logistics', warehouse: 'logistics'
};
/** Expansion-strategy toggles (Capitalism Lab names) -> firm types they unlock. */
UAE.EXPANSION = [
  ['retail', 'Retail', ['retail']], ['production', 'Production', ['factory']], ['farming', 'Farming', ['farm']],
  ['resources', 'Natural Resources', ['mine', 'oilwell', 'solar']], ['rnd', 'Research and Development', ['rnd']],
  ['media', 'Media', ['tv', 'radio', 'newspaper']], ['realestate', 'Real Estate', ['apartment', 'commercial']],
  ['software', 'Software', ['software']], ['internet', 'Internet', ['internet', 'datacenter']], ['telecom', 'Telecom', ['telecom']],
  ['bank', 'Bank', ['bankhq', 'bankbranch']], ['insurance', 'Insurance', ['inshq', 'insoffice']],
  ['mall', 'Shopping Mall', ['mall']], ['service', 'Service Firms', ['service', 'sports']], ['hotel', 'Hotels', ['hotel']],
  ['importer', 'Import Company', ['importer']], ['exporter', 'Export Company', ['exporter']], ['logistics', 'Logistics Company', ['logistics', 'warehouse']]
];
UAE.PRICE_LEVELS = [['low', 'Low price (-15%)', 0.85], ['below', 'Below average (-7%)', 0.93], ['avg', 'Market average', 1.0],
  ['above', 'Above average (+8%)', 1.08], ['premium', 'Premium (+20%)', 1.2]];

/* ------------------------------------------------------------ persons --- */
UAE.ensurePerson = function (p) {
  if (!p) return p;
  if (!p.exp) {
    var R = UAE.rng, e = {};
    UAE.EXPERTISE.forEach(function (x) { e[x[0]] = R.chance(0.35) ? R.int(5, 45) : 0; });
    e.marketing = Math.max(e.marketing, Math.round((p.skill.marketing - 30) * 0.6));
    e.training = Math.max(e.training, Math.round((p.skill.mgmt - 40) * 0.4));
    p.exp = e; p.pexp = p.pexp || {};
  }
  if (!p.pers) {
    var co = p.co && UAE.S.companies[p.co];
    var t = co && co.ceo === p.id && co.traits ? co.traits : null, R2 = UAE.rng;
    p.pers = t ? { aggression: t.aggression, risk: t.risk, pricing: t.pricing, diversify: t.diversify }
               : { aggression: R2.range(0.2, 0.9), risk: R2.range(0.2, 0.8), pricing: R2.range(0.2, 0.8), diversify: R2.range(0.1, 0.6) };
  }
  if (p.attitude == null) p.attitude = 0;
  if (!p.career) p.career = [];
  return p;
};
UAE.expertise = function (p, area) { if (!p) return 0; UAE.ensurePerson(p); return p.exp[area] || 0; };
/** Unit-level bonus for a firm from its manager (full) and the company CEO (25%). */
UAE.expertLevels = function (f) {
  var area = UAE.INDUSTRY[f.type]; if (!area) return 0;
  var lv = 0, co = UAE.co(f.owner);
  if (f.manager && UAE.person(f.manager)) lv += Math.floor(UAE.expertise(UAE.person(f.manager), area) / 20);
  var ceo = co && UAE.person(co.ceo); if (ceo) lv += Math.floor(UAE.expertise(ceo, area) / 20) * 0.25;
  return lv;
};
UAE.trainingMult = function (f) {
  var e = f.manager && UAE.person(f.manager) ? UAE.expertise(UAE.person(f.manager), 'training') : 0;
  return 1 + e / 100;
};

/** Seed CEO expertise from the company's sector so real groups and AI make sense. */
UAE.SECTOR_EXPERT = {
  property: ['realestate', 'service'], utility: ['raw', 'manufacturing'], bank: ['banking'], finance: ['banking'], holding: ['realestate', 'retail'],
  retail: ['retail', 'marketing'], hospitality: ['service', 'marketing'], aviation: ['service', 'logistics'], logistics: ['logistics'],
  transport: ['logistics'], oilgas: ['raw', 'manufacturing'], chemicals: ['manufacturing'], metals: ['manufacturing', 'raw'],
  industrial: ['manufacturing'], tech: ['software', 'internet'], internet: ['internet', 'marketing'], telecom: ['internet'],
  media: ['media', 'marketing'], food: ['farming', 'manufacturing', 'retail'], education: ['service'], health: ['service']
};
UAE.seedCeoExpertise = function (co) {
  var p = UAE.person(co.ceo); if (!p) return;
  UAE.ensurePerson(p);
  (UAE.SECTOR_EXPERT[co.sector] || []).forEach(function (a, i) { p.exp[a] = Math.max(p.exp[a] || 0, UAE.rng.int(35, 75) - i * 10); });
};

/* ------------------------------------------------------------- policies --- */
UAE.defaultPolicy = function (co) {
  var t = co.traits || { aggression: 0.5, risk: 0.5, pricing: 0.5, diversify: 0.3 }, sec = UAE.SECTORS[co.sector] || UAE.SECTORS.holding;
  var exp = {}, home = {};
  (sec.firms || []).forEach(function (ty) { UAE.EXPANSION.forEach(function (x) { if (x[2].indexOf(ty) >= 0) home[x[0]] = 1; }); });
  UAE.EXPANSION.forEach(function (x) { exp[x[0]] = co.controller === 'PLAYER' ? true : (home[x[0]] || UAE.rng.chance(0.25 + t.diversify * 0.6)); });
  exp.retail = exp.retail || co.sector === 'retail' || co.fictional;
  var scope = {}; UAE.productClasses().forEach(function (c) { scope[c] = true; });
  return {
    expand: exp, acquireTech: true, sellTech: true, backward: Math.round(30 + t.aggression * 50), expandRetail: true,
    scope: scope,
    mgmt: { price: t.pricing < 0.3 ? 'below' : t.pricing > 0.7 ? 'above' : 'avg', priceOverride: {}, purchasing: 'own',
      issueShares: true, issueBonds: false, takeLoans: true, closeLosers: true, loserMonths: 12,
      adPct: 1.5, trainPct: 0.5, farmForRetail: false, expandCashPct: Math.round((0.25 + 0.45 * t.aggression) * 100),
      minCash: 0, minProfit: null }        // "adequate cash / annual profit for expansion" - none by default
  };
};
UAE.policy = function (co) { if (!co.policy) co.policy = UAE.defaultPolicy(co); return co.policy; };
UAE.productClasses = function () { var out = []; UAE.PRODUCTS.forEach(function (p) { if (out.indexOf(p.cls) < 0) out.push(p.cls); }); return out; };
/** May this company make / sell product pid under its Scope of Production? */
UAE.inScope = function (co, pid) { var s = UAE.policy(co).scope, P = UAE.P[pid]; return !P || s[P.cls] !== false; };
/** Classes whose products need class `cls` as an input (cannot disable an input of an enabled class). */
UAE.scopeDependents = function (co, cls) {
  var s = UAE.policy(co).scope, out = [];
  UAE.PRODUCTS.forEach(function (p) {
    if (!p.rec || s[p.cls] === false || p.cls === cls) return;
    if (p.rec.in.some(function (x) { return UAE.P[x[0]].cls === cls; }) && out.indexOf(p.cls) < 0) out.push(p.cls);
  });
  return out;
};
/** Toggle a class in scope. Enabling auto-enables input classes (Capitalism Lab PCAI rule). */
UAE.setScope = function (co, cls, on) {
  var s = UAE.policy(co).scope;
  if (!on) {
    var dep = UAE.scopeDependents(co, cls);
    if (dep.length) return { ok: false, why: 'Cannot disable ' + cls + ': it is an input for ' + dep.join(', ') + ' which are enabled.' };
    s[cls] = false; return { ok: true };
  }
  s[cls] = true; var auto = [];
  UAE.PRODUCTS.forEach(function (p) {
    if (p.cls !== cls || !p.rec) return;
    p.rec.in.forEach(function (x) { var c = UAE.P[x[0]].cls; if (s[c] === false) { s[c] = true; auto.push(c); } });
  });
  return { ok: true, auto: auto };
};
UAE.allowedTypes = function (co) {
  var pol = UAE.policy(co), out = [];
  UAE.EXPANSION.forEach(function (x) { if (pol.expand[x[0]]) x[2].forEach(function (t) { out.push(t); }); });
  if (!pol.expandRetail) out = out.filter(function (t) { return t !== 'retail'; });
  return out;
};
UAE.priceLevel = function (co, pid) {
  var m = UAE.policy(co).mgmt, lv = (m.priceOverride && m.priceOverride[pid]) || m.price;
  var row = UAE.PRICE_LEVELS.find(function (x) { return x[0] === lv; });
  return row ? row[2] : 1;
};

/* ---------------------------------------------- hire CEO / CMO (player) --- */
UAE.leavePost = function (p) {
  var old = p.co && UAE.co(p.co); if (!old) return;
  if (old.ceo === p.id) { old.ceo = null; old.ceoAuto = false; var me = UAE.playerPerson(); if (UAE.isHuman(old) && me) { old.ceo = me.id; } }
  if (old.cmo === p.id) old.cmo = null; if (old.cto === p.id) old.cto = null;
};
UAE.appointCeo = function (co, personId) {
  var p = UAE.person(personId); if (!p) return { ok: false, why: 'Unknown person.' };
  if (p.co && p.co !== co.id) UAE.leavePost(p);
  UAE.ensurePerson(p);
  var old = UAE.person(co.ceo);
  if (old && !old.isPlayer) { old.title = 'Former CEO'; old.co = null; old.career.push({ day: UAE.S.day, text: 'Left ' + co.name }); }
  if (old && old.isPlayer) old.title = 'Chairman';
  p.title = 'CEO'; p.co = co.id; p.salary = p.salary || 120000;
  p.career.push({ day: UAE.S.day, text: 'Appointed CEO of ' + co.name });
  co.ceo = p.id; co.chair = co.chair || (old && old.isPlayer ? old.id : null);
  UAE.news(p.name + ' appointed CEO of ' + co.name + '.', 'firm');
  return { ok: true };
};
UAE.resumeAsCeo = function (co) {
  var me = UAE.playerPerson(), old = UAE.person(co.ceo);
  if (old && !old.isPlayer) { old.title = 'Candidate'; old.co = null; }
  co.ceo = me.id; me.title = 'Chairman & CEO'; co.ceoAuto = false;
  return { ok: true };
};
UAE.appointCmo = function (co, personId) {
  var p = UAE.person(personId); if (!p) return { ok: false, why: 'Unknown person.' };
  if (p.co && p.co !== co.id) UAE.leavePost(p);
  var old = UAE.person(co.cmo); if (old) { old.title = 'Candidate'; old.co = null; }
  p.title = 'Chief Marketing Officer'; p.co = co.id; co.cmo = p.id;
  return { ok: true };
};

/* -------------------------------------------- expertise growth (monthly) --- */
UAE.expertiseMonth = function () {
  var S = UAE.S;
  UAE.allFirms().forEach(function (f) {
    if (!f.manager || f.status !== 'open') return;
    var p = UAE.person(f.manager); if (!p) { f.manager = null; return; }
    UAE.ensurePerson(p);
    var a = UAE.INDUSTRY[f.type]; if (a) p.exp[a] = Math.min(100, (p.exp[a] || 0) + 0.5 * (1 - (p.exp[a] || 0) / 120));
    if (f.trainBudget) p.exp.training = Math.min(100, (p.exp.training || 0) + 0.15);
    if (f.adBudget) p.exp.marketing = Math.min(100, (p.exp.marketing || 0) + 0.1);
    f.lines.forEach(function (l) { var c = UAE.P[l.pid].cls; p.pexp[c] = Math.min(100, (p.pexp[c] || 0) + 0.15); });
  });
  UAE.allCos().forEach(function (co) {
    var p = UAE.person(co.ceo); if (!p || co.status === 'BANKRUPT') return;
    UAE.ensurePerson(p);
    var areas = {};
    UAE.firmsOf(co.id).forEach(function (f) { var a = UAE.INDUSTRY[f.type]; if (a) areas[a] = (areas[a] || 0) + 1; });
    for (var a in areas) p.exp[a] = Math.min(100, (p.exp[a] || 0) + 0.12 * Math.min(3, areas[a]) * (1 - (p.exp[a] || 0) / 120));
    if (co.ceo !== S.playerPerson) p.attitude = Math.min(100, (p.attitude || 0) + 0.3);
  });
};

/* ========================================================== AI (CEO) ==== */
/* Replaces UAE.AI.day / operate / expand from ai.js with policy-driven versions. */
UAE.AI.day = function () {
  var S = UAE.S;
  UAE.allCos().forEach(function (co) {
    if (co.status === 'BANKRUPT' || co.foreign) return;          // NYSE / NASDAQ companies only trade
    // running the business (prices, suppliers, budgets): every firm once a month, spread over the month (1/30 of the
    // firms each day) so a company with thousands of firms does not freeze the game on its review day
    var human = co.controller === 'PLAYER', delegated = human && co.ceoAuto && UAE.person(co.ceo) && !UAE.person(co.ceo).isPlayer;
    var review = (S.day + UAE.AI.hash(co.id)) % 30 === 0;
    if (!human || co.autoPricing || delegated) UAE.AI.operate(co, true, review);
    if (!review) return;
    if (!human || delegated) UAE.AI.strategy(co);
  });
};

UAE.AI.operate = function (co, slice, review) {
  var pol = UAE.policy(co), m = pol.mgmt, day = UAE.S.day;
  if (!slice) review = true;
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status !== 'open') return;
    if (slice && (day + UAE.AI.hash(f.id)) % 30 !== 0) return;           // this firm's review day
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (k === 'retail') f.lines.forEach(function (l) {
      var P = UAE.P[l.pid];
      var best = m.purchasing !== 'quality' && UAE._idx ? UAE.retailSupplier(f, l, co.id, m.purchasing) : null;   // engine/sim.js: same pick, no full sort
      if (!best) {
        var opts = UAE.supplyOptions(f, l.pid, true), best = UAE.firstStocked(opts), own = opts.find(function (o) { return o.owner === co.id && o.avail > 0; });
        if (m.purchasing === 'own' && own && own.unit < best.unit * 1.25) best = own;
        else if (m.purchasing === 'quality') opts.forEach(function (o) { if ((o.avail > UAE.lineCap(f, l) * 3 || o.id === 'IMPORT') && o.quality > best.quality + 3) best = o; });
        else opts.forEach(function (o) { if ((o.avail > UAE.lineCap(f, l) * 3 || o.id === 'IMPORT') && o.unit / Math.max(30, o.quality) < best.unit / Math.max(30, best.quality)) best = o; });
      }
      l.supplier = best.id;
      if (l.fixedPrice) return;                              // player fixed this price by hand
      var floor = best.unit * (1 + UAE.RULES.vat) * 1.06, cap = l.cap || UAE.lineCap(f, l);
      if ((l.sold || 0) >= cap * 0.95) l.price *= 1.03; else if ((l.demand || 0) < cap * 0.5) l.price *= 0.97;
      var target = P.ref * UAE.priceLevel(co, l.pid);
      l.price = l.price * 0.8 + target * 0.2;
      l.price = Math.max(floor, Math.min(P.ref * 1.8, l.price));
    });
    if ((k === 'factory' || k === 'farm' || k === 'mine' || k === 'oil') && !f.lines.some(function (l) { return l.priceSet; }))
      f.lines.forEach(function (l) { var s = f.stock[l.pid], px = UAE.wholesalePrice(l.pid); l.price = Math.max(s ? s.cost * 1.04 : 0, px * (0.97 + 0.06 * (UAE.priceLevel(co, l.pid) - 1))); });
    if (k === 'hotel') {
      var hc = UAE.S.cities[f.city], hC = UAE.CITIES[f.city], hd = UAE.geo.district(f.district);
      var hSc = Math.max(((hc && hc.cpiIdx) || 100) / 100, (hc && hc.wageIdx) || 1);
      var hRef = hC.hotelADR * hSc * Math.sqrt(Math.max(0.4, hd.foot) / 1.2) * (f.stars === 7 ? 3 : 1);
      if (f.adr < hRef * 0.75) f.adr = f.adr * 0.65 + hRef * 0.35;               // catch up faster after long-term inflation
      else if (f.occ > 0.9) f.adr *= 1.04; else if (f.occ < 0.6) f.adr *= 0.96;
    }
    if (k === 'service') {
      var svc = UAE.SERVICES[f.svc], sc0 = UAE.S.cities[f.city], sSc = Math.max(((sc0 && sc0.cpiIdx) || 100) / 100, (sc0 && sc0.wageIdx) || 1), sRef = svc.price * sSc;
      if (f.price < sRef * 0.75) f.price = f.price * 0.65 + sRef * 0.35;
      else if (f.customers > svc.base * f.size * 1.2) f.price *= 1.03; else if (f.customers < svc.base * 0.5) f.price *= 0.97;
      f.price = Math.max(sRef * 0.6, Math.min(sRef * 1.8, f.price));
    }
    if (k === 'sports') { if (f.visitors > 1500 * f.size) f.price *= 1.03; else f.price *= 0.99; }
    if (k === 'mall' && f.mallPol) { f.mallPol.rentNew = f.occ > 0.92 ? Math.min(1.3, f.mallPol.rentNew + 0.02) : f.occ < 0.7 ? Math.max(0.8, f.mallPol.rentNew - 0.02) : f.mallPol.rentNew; }
    if (['retail', 'service', 'hotel', 'internet', 'mall'].indexOf(k) >= 0 && !(f.adByCmo && co.cmo && pol.cmoAuto !== false)) f.adBudget = Math.max(0, f.last.rev * m.adPct / 100);
    f.trainBudget = f.eff < 0.95 ? Math.max(0, f.last.rev * m.trainPct / 100) : 0;
  });
  // product campaigns for the best-selling consumer products (AI only, modest)
  if (review && (co.controller !== 'PLAYER' || co.ceoAuto)) UAE.AI.marketing(co);
};

/** AI advertising: book a campaign on the best local media for its top product per city. */
UAE.AI.marketing = function (co) {
  if (co.bs.cash < 50e6 || !UAE.rng.chance(0.3)) return;
  var best = null, bv = 0;
  UAE.firmsOf(co.id).forEach(function (f) {
    if (UAE.FIRM_TYPES[f.type].kind !== 'retail') return;
    f.lines.forEach(function (l) { var v = (l.sold || 0) * l.price; if (v > bv) { bv = v; best = { pid: l.pid, city: f.city }; } });
  });
  if (!best || bv < 20000) return;
  if ((co.campaigns || []).some(function (c) { return c.pid === best.pid; })) return;
  var media = UAE.mediaOutlets().filter(function (m) { return m.city === best.city || m.city === 'UAE'; })
    .sort(function (a, b) { return b.reach * b.quality - a.reach * a.quality; })[0];
  if (media) UAE.startCampaign(co, best.pid, media.id, best.city, Math.round(bv * 30 * 0.02), 6);
};

UAE.AI.strategy = function (co) {
  var S = UAE.S, R = UAE.rng, t = co.traits, pol = UAE.policy(co), m = pol.mgmt;
  var mine = co.controller === 'PLAYER';
  // 1 close chronically loss-making firms
  if (m.closeLosers) UAE.firmsOf(co.id).forEach(function (f) {
    if (m.loserMonths === 6 && !m._lm12) { m.loserMonths = 12; m._lm12 = true; }      // older saves: 6 -> 12 months
    if (f.seed || UAE.neverCloseAsLoser(f) || S.day - f.openDay < 730 || f.hist.length < m.loserMonths) return;
    if (f.hist.slice(-m.loserMonths).every(function (p) { return p < 0; }) && R.chance(0.5)) {
      UAE.news(co.name + ' (CEO) closes loss-making ' + f.name + '.', mine ? 'warning' : 'ai'); UAE.sellFirm(f);
    }
  });
  // 2 liquidity
  var monthlyCost = Math.max(1e6, co.is.months.length ? co.is.months[co.is.months.length - 1].salaries * 3 : 1e6);
  if (m.takeLoans && co.bs.cash < monthlyCost * 2 && UAE.creditLimit(co) > monthlyCost * 3 && R.chance(0.3 + t.risk * 0.6))
    UAE.takeLoan(co, Math.min(UAE.creditLimit(co) * 0.5, monthlyCost * 6));
  if (co.bs.loans > 0 && co.bs.cash > monthlyCost * 10) {                     // early repayment: only loans the CEO took itself, never yours
    var spare = co.bs.cash - monthlyCost * 8;
    co.loanList.slice().forEach(function (l) { if (spare > 0 && l.by !== 'player' && (!mine || l.by === 'ceo' || l.by === 'emergency')) spare -= UAE.repayOne(co, l, spare); });
  }
  if (m.issueBonds && co.bs.cash < monthlyCost * 2 && UAE.issueBond && UAE.netIncome(UAE.ttm(co)) > 0 && R.chance(0.2))
    UAE.issueBond(co, Math.min(500e6, monthlyCost * 12), 5);
  // 3 expansion, only with adequate cash and profit (CE06 / CE07)
  var ttmNI = UAE.netIncome(UAE.ttm(co));
  var p = co.seed ? 0.08 : 0.25 + 0.6 * t.aggression;
  if (R.chance(p)) {
    if (co.bs.cash < (m.minCash || 0) || (m.minProfit != null && ttmNI < m.minProfit)) {
      if (mine) UAE.news('CEO of ' + co.name + ' considered expanding but decided not to: ' + (co.bs.cash < m.minCash ? 'cash below the adequate level (' + UAE.fmt.aed(m.minCash) + ').' : 'annual profit below the adequate level.'), 'firm');
    } else {
      var f = UAE.AI.expand(co, false);
      if (f && mine) UAE.news('CEO of ' + co.name + ' started building ' + f.name + '.', 'firm');
    }
  }
  // 4 upgrade a successful firm
  var best = UAE.firmsOf(co.id).filter(function (f) { return f.status === 'open' && !f.seed && f.size < 8 && f.last.profit > 0 && !f.mall; })
    .sort(function (a, b) { return b.last.profit - a.last.profit; })[0];
  if (best && R.chance(0.15 + 0.3 * t.aggression) && co.bs.cash > Math.max(m.minCash, UAE.BUILD[best.type][0] * 3)) UAE.expandFirm(best);
  // 5 technology: buy from the leader when far behind on something we make
  if (pol.acquireTech && R.chance(0.2)) UAE.AI.acquireTech(co);
  // 6 portfolio: buy into undervalued listed companies (AI only)
  if (!mine && !co.seed && R.chance(0.08 * t.aggression) && co.bs.cash > 100e6) {
    var cands = UAE.allCos().filter(function (c) { return c.id !== co.id && UAE.isTradable(c) && (c.holders.PUBLIC || 0) > 0; });
    if (cands.length) {
      var c = R.pick(cands), qty = Math.floor(co.bs.cash * 0.05 / c.price), r = UAE.buyShares('C:' + co.id, c, qty);
      if (r.ok && r.cost > 20e6) UAE.news(co.name + ' bought a stake in ' + c.name + ' (' + UAE.fmt.aed(r.cost) + ').', 'ai');
    }
  }
  // 7 equity: issue shares only when allowed (or when the company is about to run dry)
  var dry = co.bs.cash < monthlyCost * 0.3;
  if (UAE.isTradable(co) && !co.seed && (m.issueShares || dry) && co.bs.cash < monthlyCost && co.price > UAE.bookValue(co) / co.shares)
    UAE.issueShares(co, Math.round(co.shares * 0.05));
};

UAE.AI.acquireTech = function (co) {
  var made = {};
  UAE.firmsOf(co.id).forEach(function (f) { if (UAE.FIRM_TYPES[f.type].kind === 'factory') f.lines.forEach(function (l) { made[l.pid] = 1; }); });
  Object.keys(made).forEach(function (pid) {
    var leader = null;
    UAE.allCos().forEach(function (c) { if (c.id !== co.id && UAE.policy(c).sellTech && (!leader || (c.tech[pid] || 0) > (leader.tech[pid] || 0))) leader = c; });
    if (leader && (leader.tech[pid] || 0) - (co.tech[pid] || 0) > 12 && co.bs.cash > 200e6) {
      var r = UAE.buyTech(co, leader, pid);
      if (r.ok && co.controller === 'PLAYER') UAE.news('CEO bought ' + UAE.P[pid].name + ' technology from ' + leader.name + ' for ' + UAE.fmt.aed(r.price) + '.', 'firm');
    }
  });
};

/** Backward integration: find an input our factories import that we could produce ourselves. */
UAE.AI.backwardTarget = function (co) {
  var pol = UAE.policy(co), need = {};
  UAE.firmsOf(co.id).forEach(function (f) {
    if (UAE.FIRM_TYPES[f.type].kind !== 'factory' || f.status !== 'open') return;
    f.lines.forEach(function (l) { var rec = UAE.P[l.pid].rec; if (rec) rec.in.forEach(function (x) { need[x[0]] = (need[x[0]] || 0) + (l.made || 0) * x[1]; }); });
  });
  var produced = {};
  UAE.firmsOf(co.id).forEach(function (f) { if (UAE.FIRM_TYPES[f.type].kind !== 'retail') f.lines.forEach(function (l) { produced[l.pid] = 1; }); });
  var best = null, bv = 0;
  Object.keys(need).forEach(function (pid) {
    if (produced[pid] || !UAE.inScope(co, pid)) return;
    var P = UAE.P[pid], type = null;
    if (P.rec) type = 'factory';
    else if (UAE.FARM[pid]) type = 'farm';
    else if (pid === 'crude' || pid === 'gas') type = 'oilwell';
    else if (pid === 'limestone' || pid === 'sand') type = 'mine';
    if (!type || UAE.allowedTypes(co).indexOf(type) < 0) return;
    var v = need[pid] * UAE.importBase(pid);
    if (v > bv) { bv = v; best = { type: type, pid: pid }; }
  });
  return best;
};

/** Forward integration target (retail imports something we could make) - from ai.js, scope-aware. */
UAE.AI.integrationTarget = function (co) {
  var vol = {};
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.type !== 'retail') return;
    f.lines.forEach(function (l) { if (l.supplier === 'IMPORT' && UAE.P[l.pid].rec && UAE.inScope(co, l.pid)) vol[l.pid] = (vol[l.pid] || 0) + (l.sold || 0); });
  });
  var best = null, bv = 0;
  for (var pid in vol) {
    var P = UAE.P[pid], made = UAE.firmsOf(co.id).some(function (f) { return f.type !== 'retail' && f.lines.some(function (l) { return l.pid === pid; }); });
    if (made) continue;
    var v = vol[pid] * (P.ref - P.imp);
    if (v > bv && vol[pid] > P.rec.cap * 0.15) { bv = v; best = pid; }
  }
  return best && UAE.allowedTypes(co).indexOf('factory') >= 0 ? { type: 'factory', pid: best } : null;
};

UAE.AI.expand = function (co, instant) {
  var R = UAE.rng, S = UAE.S, pol = UAE.policy(co), m = pol.mgmt;
  var sec = UAE.SECTORS[co.sector] || UAE.SECTORS.holding, allowed = UAE.allowedTypes(co);
  if (!allowed.length) return null;
  var ceo = UAE.person(co.ceo);
  // candidate types: home sector, general list (diversify), weighted by CEO expertise
  var pool = sec.firms.filter(function (t) { return allowed.indexOf(t) >= 0; });
  if (!pool.length || R.chance(co.traits.diversify)) pool = UAE.AI.GENERAL.filter(function (t) { return allowed.indexOf(t) >= 0; });
  if (!pool.length) pool = allowed.slice();
  var weights = pool.map(function (t) { return 1 + (ceo ? UAE.expertise(ceo, UAE.INDUSTRY[t] || 'retail') / 25 : 0); });
  var tot = weights.reduce(function (s, w) { return s + w; }, 0), r0 = R.next() * tot, type = pool[0];
  for (var i = 0; i < pool.length; i++) { r0 -= weights[i]; if (r0 <= 0) { type = pool[i]; break; } }
  // integration overrides
  var integ = UAE.AI.integrationTarget(co), back = UAE.AI.backwardTarget(co), pid = null;
  if (back && R.chance(pol.backward / 100)) { type = back.type; pid = back.pid; }
  else if (integ && R.chance(0.5)) { type = integ.type; pid = integ.pid; }
  if (type === 'farm' && !pid && !m.farmForRetail && co.sector !== 'food') type = allowed.indexOf('retail') >= 0 ? 'retail' : type;
  var T = UAE.FIRM_TYPES[type]; if (!T || T.disabled || T.gov) return null;
  // stores and service firms: sometimes lease space in a shopping mall instead of buying land
  if ((type === 'retail' || type === 'service') && UAE.openMallStore && R.chance(0.35)) {
    var mall = UAE.AI.pickMall(co); if (mall) {
      var ms = UAE.openMallStore(co.id, mall.id, type, { instant: instant, name: UAE.AI.firmName(co, type, UAE.geo.district(mall.district)) });
      if (ms.ok) { UAE.AI.configure(co, ms.firm, null); return ms.firm; }
    }
  }
  // natural resources: pick a free deposit
  if (type === 'mine' || type === 'oilwell') return UAE.AI.buildOnDeposit(co, type, pid, instant);
  var cities = Object.keys(S.cities).map(function (k) {
    var c = S.cities[k], n = UAE.allFirms().filter(function (f) { return f.city === k && f.type === type; }).length;
    var w = c.pop / 1e6 * UAE.CITIES[k].income / (1 + 0.15 * n) * (k === co.hq ? 2 : 1);
    if (['farm', 'solar'].indexOf(type) >= 0) w = 1;
    return { k: k, w: w };
  });
  var choice = null;
  for (var tries = 0; tries < 6 && !choice; tries++) {
    var tw = cities.reduce(function (s, x) { return s + x.w; }, 0), rr = R.next() * tw, city = cities[0].k;
    for (var j = 0; j < cities.length; j++) { rr -= cities[j].w; if (rr <= 0) { city = cities[j].k; break; } }
    var ds = UAE.DISTRICTS.filter(function (d) { return d.city === city && T.zones.indexOf(d.zone) >= 0; });
    if (!ds.length) continue;
    // retail: prefer high-traffic districts
    var d = type === 'retail' || type === 'service' ? UAE.AI.pickWeighted(ds, function (x) { return 0.2 + x.foot; }) : R.pick(ds);
    var pnt = UAE.randomPointIn(d, type);
    if (pnt) choice = { p: pnt, d: d };
  }
  if (!choice) return null;
  var q = UAE.quoteFirm(type, choice.p, 1);
  if (!q.ok) return null;
  var budget = co.seed ? Math.min(co.bs.cash * 0.05, 1.5e9) : co.bs.cash * m.expandCashPct / 100;
  if (q.total > budget) return null;
  var f = UAE.createFirm(co.id, type, choice.p, { instant: instant, name: UAE.AI.firmName(co, type, choice.d) });
  if (!f) return null;
  UAE.AI.configure(co, f, pid);
  if (!instant && (R.chance(0.4) || co.seed)) UAE.news(co.name + ' is building a new ' + T.name + ' in ' + choice.d.name + '.', 'ai');
  return f;
};
UAE.AI.pickWeighted = function (arr, wf) {
  var tot = 0; arr.forEach(function (x) { tot += wf(x); });
  var r = UAE.rng.next() * tot;
  for (var i = 0; i < arr.length; i++) { r -= wf(arr[i]); if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
};
UAE.AI.pickMall = function (co) {
  var malls = UAE.allFirms().filter(function (m) { return m.type === 'mall' && m.status === 'open' && UAE.mallVacancy && UAE.mallVacancy(m) > 0 && UAE.mallAccepts(m, co.id); });
  if (!malls.length) return null;
  return UAE.AI.pickWeighted(malls, function (m) { return 0.2 + (m.mallRating || 50) / 50; });
};
UAE.AI.buildOnDeposit = function (co, type, pid, instant) {
  var kind = UAE.FIRM_TYPES[type].kind, kinds = UAE.DEPOSIT_KINDS[kind];
  var free = UAE.DEPOSITS.filter(function (d) {
    return kinds.indexOf(d.res) >= 0 && (!pid || d.res === pid) && !UAE.depState(d.id).firm && UAE.depState(d.id).left > 0;
  });
  if (!free.length) return null;
  var d = UAE.AI.pickWeighted(free, function (x) { return x.grade * x.reserve / x.price; });
  var q = UAE.quoteFirm(type, d.c, 1);
  if (!q.ok) return null;
  var budget = co.seed ? Math.min(co.bs.cash * 0.08, 2e9) : co.bs.cash * UAE.policy(co).mgmt.expandCashPct / 100;
  if (q.total > budget) return null;
  var f = UAE.createFirm(co.id, type, d.c, { instant: instant, name: co.name.split(' ')[0] + ' ' + d.name.split('(')[0].trim() });
  if (!f) return null;
  UAE.addLine(f, d.res);
  if (!instant) UAE.news(co.name + ' bought the rights to ' + d.name + ' (' + UAE.fmt.aed(d.price) + ').', 'ai');
  return f;
};

/* Scope-aware configure: wraps ai.js configure so AI never sells or makes out-of-scope products. */
UAE.AI._configureBase = UAE.AI._configureBase || UAE.AI.configure;
UAE.AI.configure = function (co, f, pid) {
  var k = UAE.FIRM_TYPES[f.type].kind;
  if (k === 'retail') {
    var R = UAE.rng, consumer = UAE.PRODUCTS.filter(function (p) { return (p.kind === 'consumer' || p.kind === 'fuel' || p.kind === 'software') && UAE.inScope(co, p.id); });
    if (!consumer.length) return;
    var scored = consumer.filter(function (p) { return p.id !== 'petrol' || co.sector === 'retail'; }).map(function (p) {
      var land = UAE.landedImport(p.id, f).unit, margin = (p.ref / 1.05 - land) / p.ref;
      return { p: p, s: margin * Math.log(2 + UAE.cityDemand(f.city, p.id) * p.ref / 1e5) * R.range(0.5, 1.5) };
    }).sort(function (a, b) { return b.s - a.s; });
    var n = R.int(2, 4), top = scored[0].p.cls, picks = scored.filter(function (x) { return x.p.cls === top; }).slice(0, n);
    scored.forEach(function (x) { if (picks.length < n && picks.indexOf(x) < 0) picks.push(x); });
    picks.forEach(function (x) {
      var line = UAE.addLine(f, x.p.id); if (!line) return;
      var opts = UAE.supplyOptions(f, x.p.id), own = opts.find(function (o) { return o.owner === co.id && o.avail > 0; });
      line.supplier = own ? own.id : opts[0].avail > 0 ? opts[0].id : 'IMPORT';
      line.price = Math.round(x.p.ref * UAE.priceLevel(co, x.p.id) * 100) / 100;
    });
    return;
  }
  if (k === 'factory' && !pid) {
    var bySector = { industrial: ['cement', 'glass'], chemicals: ['polymer', 'urea'], metals: ['aluminium', 'alumina'], oilgas: ['petrol', 'jetfuel'] }[co.sector];
    var ok = (bySector || UAE.PRODUCTS.filter(function (p) { return p.rec; }).map(function (p) { return p.id; })).filter(function (x) { return UAE.inScope(co, x); });
    if (!ok.length) return;
    pid = UAE.rng.pick(ok);
  }
  if (k === 'farm' && !pid) {
    var farms = Object.keys(UAE.FARM).filter(function (x) { return UAE.inScope(co, x); });
    if (!farms.length) return; pid = UAE.rng.pick(farms);
  }
  if (k === 'farm' || k === 'mine' || k === 'oil') { if (pid && !f.lines.length) UAE.addLine(f, pid); else if (!f.lines.length) UAE.AI._configureBase(co, f, pid); return; }
  UAE.AI._configureBase(co, f, pid);
};

/* ------------------------------------------------- cheats: elite people --- */
/** Set every skill, industry expertise and product-class expertise of person p to 100. */
UAE.maxExpertise = function (p) {
  if (!p) return false;
  UAE.ensurePerson(p);
  p.skill = { mgmt: 100, tech: 100, marketing: 100, finance: 100 };
  UAE.EXPERTISE.forEach(function (x) { p.exp[x[0]] = 100; });
  p.pexp = p.pexp || {}; UAE.productClasses().forEach(function (c) { p.pexp[c] = 100; });
  p.attitude = Math.max(p.attitude || 0, 80);
  p.maxed = true;
  return true;
};
/** A maxed-out candidate ready to hire: role 'ceo' or 'cmo'. Stays in the candidate list until hired. */
UAE.eliteCandidate = function (role) {
  var p = UAE.makePerson({ title: 'Candidate', age: role === 'ceo' ? 48 : 41 });
  UAE.maxExpertise(p);
  p.pers = role === 'ceo' ? { aggression: 0.85, risk: 0.45, pricing: 0.5, diversify: 0.6 } : { aggression: 0.6, risk: 0.35, pricing: 0.55, diversify: 0.3 };
  p.elite = role; p.salary = role === 'ceo' ? 250000 : 180000;
  var S = UAE.S; S.candidates = S.candidates || []; S.candidates.unshift(p.id);
  return p;
};
/** Talent market: every month UAE.TALENT_PER_MONTH elite CEOs join the candidate list on their own.
 *  Unhired elite CEOs beyond UAE.TALENT_MAX_WAITING leave (oldest first) so the list does not grow forever. */
UAE.TALENT_PER_MONTH = 3;
UAE.TALENT_MAX_WAITING = 12;
UAE.talentMonth = function () {
  var S = UAE.S, made = [];
  for (var i = 0; i < UAE.TALENT_PER_MONTH; i++) {
    var p = UAE.eliteCandidate('ceo'); p.age = UAE.rng.int(38, 58); p.talentDay = S.day; made.push(p);
  }
  var waiting = S.candidates.filter(function (id) { var q = UAE.person(id); return q && q.elite === 'ceo' && q.title === 'Candidate'; });
  waiting.slice(UAE.TALENT_MAX_WAITING).forEach(function (id) {   // list is newest first
    var q = UAE.person(id); q.title = 'Executive (elsewhere)';
    S.candidates.splice(S.candidates.indexOf(id), 1);
  });
  if (UAE.news) UAE.news('👔 New talent: ' + made.map(function (p) { return p.name; }).join(', ') + ' (elite CEOs) are on the market - Persons → Candidates.', 'good');
  return made;
};
