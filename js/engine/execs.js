/* ============================================================================
 * UAE CAPITALISM LAB  -  EXECUTIVE TEAM: CEO TECH FOCUS, CMO ADVERTISING, CTO R&D
 *
 *  CEO tech focus (policy.focus = 'tech'): when the CEO runs the company
 *  (delegated / AI), most expansions build the tech supply chain first -
 *  chip design house -> wafer fab -> chip fab -> AI chips -> GPUs, AI Assistant
 *  and OS software, device factories, then stores selling tech products and
 *  R&D centres. The rest of the time the CEO still expands into other
 *  businesses (normal strategy). Factories / stores it opens prefer tech products.
 *
 *  CMO (co.cmo + policy.cmoAuto): every month keeps advertising campaigns running
 *  for the company's best-selling products in each city it sells them,
 *  spending policy.cmoPct % of last month's revenue (own media firms first).
 *
 *  CTO (co.cto + policy.ctoAuto): every month keeps every R&D centre and software
 *  company of the company researching (next model / version), choosing the
 *  products where the company is furthest behind its best rival. The CTO's R&D
 *  expertise speeds research up (+0.5% per point).
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.TECH_FOCUS_CLASSES = ['Chip Design', 'Semiconductor Materials', 'Semiconductors', 'AI Hardware', 'Software', 'Electronics',
  'Communication Devices', 'Computer', 'Electronic Products', 'Robotics', 'Robotics Components', 'Wearables', 'Drones',
  'Electric Vehicles', 'Batteries', 'Battery Materials', 'Drugs', 'Pharma Ingredients', 'E-commerce'];
/* Build order of the tech supply chain: [firm type, product] - missing links are built first. */
UAE.TECH_CHAIN = [['software', 'chipip'], ['factory', 'wafer'], ['factory', 'chips'], ['factory', 'aichip'], ['factory', 'gpu'],
  ['software', 'ai'], ['software', 'os'], ['factory', 'cpu'], ['factory', 'ram'], ['factory', 'server'], ['datacenter', null],
  ['software', 'llm'], ['internet', 'ecommerce'], ['rnd', 'aichip'], ['factory', 'phone'], ['factory', 'laptop'], ['factory', 'battery'],
  ['factory', 'sensor'], ['factory', 'motor'], ['factory', 'robot'], ['factory', 'arglasses'], ['rnd', 'gpu'], ['factory', 'ev'],
  ['factory', 'drone'], ['factory', 'vr'], ['datacenter', null], ['rnd', 'robot'],
  ['factory', 'api'], ['factory', 'medicine'], ['factory', 'generic'], ['rnd', 'rxdrug'], ['factory', 'rxdrug'], ['rnd', 'biologic'], ['factory', 'biologic'], ['rnd', 'ecom']];

UAE.isTechPid = function (pid) { var P = UAE.P[pid]; return !!P && UAE.TECH_FOCUS_CLASSES.indexOf(P.cls) >= 0; };
UAE.focusOn = function (co) { return UAE.policy(co).focus === 'tech'; };

/** Does company co already produce pid (factory line or software title) / research it? */
UAE.coMakes = function (co, type, pid) {
  return UAE.firmsOf(co.id).some(function (f) {
    if (f.type !== type) return false;
    if (type === 'rnd') return f.target === pid;
    if (type === 'internet') return f.model === pid;
    if (!pid) return true;
    return f.lines.some(function (l) { return l.pid === pid; });
  });
};
/** Next missing link of the tech chain the company is allowed to build. */
UAE.nextTechStep = function (co) {
  var allowed = UAE.allowedTypes(co);
  for (var i = 0; i < UAE.TECH_CHAIN.length; i++) {
    var st = UAE.TECH_CHAIN[i];
    if (allowed.indexOf(st[0]) < 0) continue;
    if (st[1] && UAE.P[st[1]] && !UAE.inScope(co, st[1])) continue;
    if (!UAE.coMakes(co, st[0], st[1])) return { type: st[0], pid: st[1] };
  }
  return null;
};
/** Build a firm of `type` for company co in its HQ city (or the best city with a matching zone). */
/** Cities to try for a new firm, in a weighted-random order: bigger, richer markets first, but less attractive where
 * you (and others) already have many firms of this type. HQ city x1.5. Resource firms spread evenly. */
UAE.cityOrderFor = function (co, type) {
  var S = UAE.S, R = UAE.rng, nAll = {}, nOwn = {};
  UAE.allFirms().forEach(function (f) { if (f.type !== type || f.status === 'closed') return; nAll[f.city] = (nAll[f.city] || 0) + 1; if (f.owner === co.id) nOwn[f.city] = (nOwn[f.city] || 0) + 1; });
  var res = ['farm', 'solar', 'mine', 'oilwell', 'logging'].indexOf(type) >= 0;
  var list = Object.keys(S.cities).map(function (k) {
    var c = S.cities[k], w = res ? 1 / (1 + (nOwn[k] || 0)) : c.pop / 1e6 * UAE.CITIES[k].income / (1 + 0.15 * (nAll[k] || 0) + 0.6 * (nOwn[k] || 0)) * (k === co.hq ? 1.5 : 1);
    return { k: k, w: Math.max(1e-6, w) };
  }), out = [];
  while (list.length) {
    var tw = list.reduce(function (t, x) { return t + x.w; }, 0), r = R.next() * tw, i = 0;
    for (; i < list.length - 1; i++) { r -= list[i].w; if (r <= 0) break; }
    out.push(list[i].k); list.splice(i, 1);
  }
  return out;
};
UAE.buildFor = function (co, type, pid, instant) {
  var T = UAE.FIRM_TYPES[type], R = UAE.rng, S = UAE.S;
  var cities = UAE.cityOrderFor(co, type);           // market-weighted, spread across the emirates (was: HQ city first, always Dubai)
  for (var c = 0; c < cities.length; c++) {
    var ds = UAE.DISTRICTS.filter(function (d) { return d.city === cities[c] && T.zones.indexOf(d.zone) >= 0; });
    for (var tries = 0; tries < 8 && ds.length; tries++) {
      var d = R.pick(ds), pnt = UAE.randomPointIn(d, type); if (!pnt) continue;
      var q = UAE.quoteFirm(type, pnt, 1); if (!q.ok) continue;
      var budget = co.bs.cash * UAE.policy(co).mgmt.expandCashPct / 100;
      if (q.total > Math.max(budget, co.bs.cash * 0.25)) return null;      // focus projects may use up to 25% of cash
      var f = UAE.createFirm(co.id, type, pnt, { instant: instant, name: UAE.AI.firmName ? UAE.AI.firmName(co, type, d) : co.name + ' ' + T.name });
      if (!f) return null;
      if (type === 'software') UAE.setSoftware(f, pid || 'ai');
      else if (type === 'rnd') { f.target = pid || 'aichip'; f.autoResearch = true; }
      else if (type === 'factory') { UAE.addLine(f, pid); UAE.linkOwnBuyers(f, pid); }
      else if (type === 'internet') { f.model = pid || 'ecommerce'; UAE.ecomStock(co, f); }
      else if (type === 'datacenter') { UAE.addLine(f, 'server'); var sv = UAE.firmsOf(co.id).find(function (g) { return g.type === 'factory' && g.lines.some(function (l) { return l.pid === 'server'; }); }); if (sv) f.lines[0].supplier = sv.id; }
      else UAE.AI.configure(co, f, pid);
      // own suppliers for the new factory's inputs
      if (type === 'factory' && UAE.P[pid] && UAE.P[pid].rec) UAE.P[pid].rec.in.forEach(function (x) {
        var own = UAE.firmsOf(co.id).find(function (g) { return g !== f && g.lines.some(function (l) { return l.pid === x[0]; }); });
        if (own) { f.lines[0].inSup = f.lines[0].inSup || {}; f.lines[0].inSup[x[0]] = own.id; }
      });
      if (type === 'software') UAE.linkOwnBuyers(f, pid || 'ai');
      if (UAE.nameSync) UAE.nameSync(f);
      UAE.news(co.name + ' (CEO tech focus) opened ' + f.name + (pid && UAE.P[pid] ? ' for ' + UAE.P[pid].name : '') + '.', UAE.isHuman(co) ? 'firm' : 'ai');
      return f;
    }
  }
  return null;
};

/* Wrap the CEO's expansion: with tech focus, ~70% of expansions follow the tech chain. */
UAE.AI._expandBase = UAE.AI._expandBase || UAE.AI.expand;
UAE.AI.expand = function (co, instant) {
  if (UAE.focusOn(co) && UAE.rng.chance(0.7)) {
    var step = UAE.nextTechStep(co);
    if (step) { var f = UAE.buildFor(co, step.type, step.pid, instant); if (f) return f; }
    // chain complete: open stores selling tech products, more R&D or data centres
    var nRnd = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'rnd'; }).length;
    var pick = UAE.rng.pick(nRnd < 6 ? ['retail', 'retail', 'rnd', 'datacenter', 'software'] : ['retail', 'retail', 'datacenter', 'software', 'factory']);
    if (UAE.allowedTypes(co).indexOf(pick) >= 0) {
      var techSw = ['ai', 'os', 'chipip', 'security', 'game'];
      var g = UAE.buildFor(co, pick, pick === 'software' ? UAE.rng.pick(techSw) : pick === 'rnd' ? UAE.rng.pick(['gpu', 'aichip', 'robot', 'ai', 'chips']) : null, instant);
      if (g) return g;
    }
  }
  return UAE.AI._expandBase(co, instant);
};
/* Stores / factories the CEO configures prefer tech products under tech focus. */
UAE.AI._configureFocusBase = UAE.AI._configureFocusBase || UAE.AI.configure;
UAE.AI.configure = function (co, f, pid) {
  var k = UAE.FIRM_TYPES[f.type].kind;
  if (UAE.focusOn(co) && k === 'retail' && !f.lines.length) {
    var tech = UAE.PRODUCTS.filter(function (p) { return (p.kind === 'consumer' || p.kind === 'software') && p.perCap && UAE.isTechPid(p.id) && UAE.inScope(co, p.id); })
      .sort(function (a, b) { return UAE.cityDemand(f.city, b.id) * b.ref - UAE.cityDemand(f.city, a.id) * a.ref; }).slice(0, UAE.FIRM_TYPES.retail.lines);
    tech.forEach(function (p) {
      var line = UAE.addLine(f, p.id); if (!line) return;
      var own = UAE.supplyOptions(f, p.id, true).find(function (o) { return o.owner === co.id && o.avail > 0; });
      line.supplier = own ? own.id : 'IMPORT'; line.price = Math.round(p.ref * UAE.priceLevel(co, p.id) * 100) / 100;
    });
    if (f.lines.length) return;
  }
  if (UAE.focusOn(co) && k === 'factory' && !pid) {
    var mk = UAE.PRODUCTS.filter(function (p) { return p.rec && UAE.isTechPid(p.id) && UAE.inScope(co, p.id); });
    if (mk.length) pid = UAE.rng.pick(mk).id;
  }
  return UAE.AI._configureFocusBase(co, f, pid);
};

/* ------------------------------------------------------------------ CTO --- */
UAE.appointCto = function (co, personId) {
  var p = UAE.person(personId); if (!p) return { ok: false, why: 'Unknown person.' };
  if (p.co && p.co !== co.id && UAE.leavePost) UAE.leavePost(p);
  var old = UAE.person(co.cto); if (old && old !== p) { old.title = 'Candidate'; old.co = null; }
  p.title = 'Chief Technology Officer'; p.co = co.id; co.cto = p.id; p.salary = p.salary || 150000;
  UAE.ensurePerson(p); p.career.push({ day: UAE.S.day, text: 'Appointed CTO of ' + co.name });
  UAE.policy(co).ctoAuto = true;
  UAE.news(p.name + ' appointed CTO of ' + co.name + ' - now managing R&D projects.', 'firm');
  return { ok: true };
};
/** Research speed multiplier from the company's CTO (R&D expertise). */
UAE.ctoMult = function (co) { var c = co && co.cto && UAE.person(co.cto); return c ? 1 + UAE.expertise(c, 'rnd') / 200 : 1; };
UAE.ctoMonth = function (co) {
  var pol = UAE.policy(co), cto = co.cto && UAE.person(co.cto);
  if (!cto || pol.ctoAuto === false) return;
  // products worth researching: what the company makes / sells, tech first, biggest gap to the best rival first
  var mine = {};
  UAE.firmsOf(co.id).forEach(function (f) { f.lines.forEach(function (l) { mine[l.pid] = 1; }); });
  var best = function (pid) { var b = 0; UAE.allCos().forEach(function (c) { if (c !== co) b = Math.max(b, c.tech[pid] || 0); }); return b; };
  var cand = Object.keys(mine).filter(function (pid) { return (co.tech[pid] || 40) < 99.5; })
    .sort(function (a, b) { return ((UAE.isTechPid(b) ? 30 : 0) + best(b) - (co.tech[b] || 40)) - ((UAE.isTechPid(a) ? 30 : 0) + best(a) - (co.tech[a] || 40)); });
  if (UAE.techPriority) {   // world race: products with a world market first, biggest (gap to the world leader x market) first
    cand = Object.keys(mine).filter(function (pid) { return UAE.WM[pid] && UAE.P[pid].kind !== 'software' && (UAE.techPriority(co, pid) || 0) > 0; })
      .sort(function (a, b) { return UAE.techPriority(co, b) - UAE.techPriority(co, a); }).concat(cand.filter(function (pid) { return !UAE.WM[pid]; }));
  }
  var used = {}, cap = UAE.MAX_AUTO_RND || 4;
  var rndIdle = [], swCands = [];
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status !== 'open' || f.project) { if (f.project) used[f.project.pid] = (used[f.project.pid] || 0) + 1; return; }
    if (f.type === 'software') { f.autoResearch = true; swCands.push(f); return; }
    if (f.type !== 'rnd') return;
    if (f.entryFor) { f.target = f.entryFor; if (co.bs.cash > UAE.researchQuote(f, f.entryFor).cost * 0.5) { UAE.startResearch(f, f.entryFor); used[f.entryFor] = (used[f.entryFor] || 0) + 1; } return; }
    rndIdle.push(f);
  });
  // Software studios: pick the highest-revenue studio per title (at most 1 running per title) so duplicate studios don't burn cash into losses
  swCands.sort(function (a, b) { return (b.last && b.last.rev || 0) - (a.last && a.last.rev || 0); });
  swCands.forEach(function (f) {
    var sp = UAE.swPid(f);
    if (!used[sp] && (!UAE.canAutoSoftwareResearch || UAE.canAutoSoftwareResearch(co, f, sp))) {
      if (UAE.startResearch(f, sp).ok) used[sp] = (used[sp] || 0) + 1;
    }
  });
  // R&D labs: spread across all lagging products, capped at MAX_AUTO_RND active teams per product
  var nonSw = cand.filter(function (x) { return UAE.P[x] && UAE.P[x].kind !== 'software'; });
  var assigned = [];
  rndIdle.forEach(function (f) {
    var pick = null;
    for (var round = 0; round < cap && !pick; round++) {
      pick = nonSw.find(function (x) { return (used[x] || 0) <= round; });
    }
    if (!pick) return;
    used[pick] = (used[pick] || 0) + 1; f.target = pick; f.autoResearch = true; assigned.push(f);
  });
  if (assigned.length) {
    if (UAE._idx) UAE._idx.rndT = null;                   // refresh team counts so parallel R&D cost scaling is exact
    assigned.forEach(function (f) { if (co.bs.cash > UAE.researchQuote(f, f.target).cost * 0.5) UAE.startResearch(f, f.target); });
  }
};

/* ------------------------------------------------------------------ CMO --- */
/* Service businesses and the corporate brand they build (advertised through their firms' ad budgets). */
UAE.SERVICE_BRAND = { bankhq: 'Banking', bankbranch: 'Banking', inshq: 'Insurance', insoffice: 'Insurance', hotel: 'Hospitality', service: 'Hospitality', sports: 'Hospitality',
  apartment: 'Real Estate', commercial: 'Real Estate', mall: 'Real Estate', telecom: 'Telecom', internet: 'Internet', datacenter: 'Internet' };
UAE.cmoBudget = function (co) {
  var pol = UAE.policy(co);
  return Math.max(0, co.lastMonthRev || 0) * (pol.cmoPct == null ? 3 : pol.cmoPct) / 100 + Math.max(0, co.bs.cash) * (pol.cmoCashPct || 0) / 100;
};
/* Every marketed business belongs to a brand group: service brands above, plus Retail, Industry, Logistics, Media,
 * Technology and Energy. Head offices, mansions and civic buildings are not marketed. */
UAE.FIRM_BRAND_BY_KIND = { retail: 'Retail', factory: 'Industry', farm: 'Industry', mine: 'Industry', oil: 'Industry', warehouse: 'Industry', none: 'Industry',
  logistics: 'Logistics', importer: 'Logistics', exporter: 'Logistics', media: 'Media', software: 'Technology', solar: 'Energy' };
UAE.firmBrandGroup = function (f) { return UAE.SERVICE_BRAND[f.type] || UAE.FIRM_BRAND_BY_KIND[UAE.FIRM_TYPES[f.type].kind] || null; };
/* CMO targets: 4% of each business's revenue on advertising, at least AED 30k a month per firm (so new firms are marketed too).
 * The CEO may raise the CMO budget (% of revenue) by up to 3 points a month, to at most 15%, when it does not cover that. */
UAE.CMO = { rate: 0.04, minPerFirm: 30000, maxPct: 15, step: 3, maxDivisionAd: 25e6 };
/** What the CMO needs this month to market every firm and the top-selling products. */
UAE.cmoNeed = function (co) {
  var allOpen = UAE.firmsOf(co.id).filter(function (f) { return f.status === 'open' && UAE.firmBrandGroup(f); });
  // Banking & Insurance corporate brand ads are placed centrally at Bank HQ / Insurance HQ (not on branches / front offices,
  // which previously burned hundreds of millions/month per branch on saturated brand spend). Warehouses are internal depots.
  var firms = allOpen.filter(function (f) { return f.type !== 'bankbranch' && f.type !== 'insoffice' && f.type !== 'warehouse'; });
  var prod = {};
  firms.forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind, nat = k === 'software' || k === 'internet';
    f.lines.forEach(function (l) {
      var P = UAE.P[l.pid]; if (!P || (!P.perCap && P.kind !== 'software')) return;          // consumer-facing products only
      var key = l.pid + '|' + (nat ? 'UAE' : f.city);
      prod[key] = (prod[key] || 0) + Math.max(1, (l.sold || 0) * (l.price || P.ref || 1) * (nat ? 1 : 30));
    });
  });
  var gRev = {};
  allOpen.forEach(function (f) { var g = UAE.firmBrandGroup(f); gRev[g] = (gRev[g] || 0) + Math.max(0, f.last.rev); });
  var day = UAE.S ? UAE.S.day : 0;
  var list = firms.map(function (f) {
    var g = UAE.firmBrandGroup(f);
    var isFinHq = f.type === 'bankhq' || f.type === 'inshq';
    var rev = isFinHq ? (gRev[g] || 0) : Math.max(0, f.last.rev);
    var isNew = day - (f.openDay || 0) < 180;
    // Brand-new firms (<180 days) get a launch floor; mature zero-revenue firms are not forced to burn AED 30k/mo.
    var floor = (rev > 0 || isNew) ? UAE.CMO.minPerFirm : 0;
    var need = Math.max(floor, rev * UAE.CMO.rate);
    // Corporate service brand formula saturates well below AED 25m/mo: cap Bank/Insurance HQ brand ads so excess cash isn't wasted.
    if (isFinHq) need = Math.min(UAE.CMO.maxDivisionAd, need);
    // Never let CMO firm-level ads push a mature low-margin or internal-transfer firm into a loss (cap at 25% of pre-ad profit).
    else if (!isNew && f.last) {
      var preAd = (f.last.profit || 0) + (f.adBudget || 0);
      need = preAd > 0 ? Math.min(need, preAd * 0.25) : 0;
    }
    return { f: f, group: g, rev: rev, need: need };
  });
  var keys = Object.keys(prod).sort(function (x, y) { return prod[y] - prod[x]; }).slice(0, 25);
  var prodNeed = keys.reduce(function (t, k) { return t + prod[k] * UAE.CMO.rate; }, 0), firmNeed = list.reduce(function (t, x) { return t + x.need; }, 0);
  return { firms: list, prod: prod, keys: keys, prodNeed: prodNeed, firmNeed: firmNeed, total: prodNeed + firmNeed };
};
/** CMO: markets EVERY business of the company each month.
 *  - products: the 25 best-selling consumer products x city get campaigns (software / online UAE-wide on digital)
 *  - every firm gets an ad budget: services build their corporate brand (Banking, Insurance, Hospitality, Real Estate,
 *    Telecom, Internet); shops, factories and farms push their own products' awareness in their city; the rest build
 *    the Industry / Logistics / Media / Technology / Energy brand
 *  Budget = % of last month's revenue + % of cash. When it is not enough, the CEO raises the % of revenue. */
UAE.cmoMonth = function (co) {
  var pol = UAE.policy(co), cmo = co.cmo && UAE.person(co.cmo);
  if (!cmo || pol.cmoAuto === false) return;
  co.campaigns = (co.campaigns || []).filter(function (c) { return !c.until || c.until > UAE.S.day; });
  var N = UAE.cmoNeed(co), budget = UAE.cmoBudget(co), ceo = UAE.ceoPerson(co), raised = null;
  // the CEO tops up the CMO budget when it does not cover the need
  if (ceo && pol.ceoRaiseCmo !== false && budget < N.total * 0.95 && (co.lastMonthRev || 0) > 0) {
    var pct = pol.cmoPct == null ? 3 : pol.cmoPct, max = pol.cmoMaxPct == null ? UAE.CMO.maxPct : pol.cmoMaxPct;
    var want = pct + (N.total - budget) / co.lastMonthRev * 100, np = Math.round(Math.min(max, pct + UAE.CMO.step, want) * 10) / 10;
    if (np > pct && co.bs.cash > N.total * 3) {
      pol.cmoPct = np; budget = UAE.cmoBudget(co); raised = { from: pct, to: np };
      UAE.news(ceo.name + ' (CEO, ' + co.name + ') raised the CMO budget from ' + pct + '% to ' + np + '% of monthly revenue: marketing every business needs about ' + UAE.fmt.aed(N.total) + ' a month.', 'finance');
    } else if (np <= pct && UAE.isHuman(co) && !co._cmoCapWarned) {
      co._cmoCapWarned = true;
      UAE.news(co.name + ': the CMO budget (' + pct + '% of revenue) is at the CEO\'s limit of ' + max + '% and covers ' + Math.round(budget / N.total * 100) + '% of what marketing every business needs. Raise the limit in HQ → Executive team.', 'warning');
    }
  }
  if (ceo && pol.ceoRaiseCmo !== false && budget > N.total * 1.3 && (co.lastMonthRev || 0) > 0) {
    var p0 = pol.cmoPct == null ? 3 : pol.cmoPct, cash = Math.max(0, co.bs.cash) * (pol.cmoCashPct || 0) / 100;
    var lo = Math.max(0.5, Math.round(Math.max(0, N.total * 1.1 - cash) / co.lastMonthRev * 1000) / 10);
    if (lo < p0) { pol.cmoPct = lo; budget = UAE.cmoBudget(co);
      UAE.news(ceo.name + ' (CEO, ' + co.name + ') cut the CMO budget from ' + p0 + '% to ' + lo + '% of monthly revenue: marketing every business needs about ' + UAE.fmt.aed(N.total) + ' a month.', 'finance'); }
  }
  if (budget <= 0) return;
  var cover = Math.min(1, budget / Math.max(1, N.total));          // share of the need the budget covers (never spends more than the need)
  // 1) product campaigns
  var started = 0, live = 0, pSpent = 0;
  N.keys.forEach(function (k) {
    var pid = k.split('|')[0], city = k.split('|')[1], monthly = Math.round(N.prod[k] * UAE.CMO.rate * cover);
    if (monthly < 10000) return;
    pSpent += monthly;
    var cp = co.campaigns.find(function (c) { return c.auto && c.pid === pid && c.city === city; });
    if (cp) { cp.budget = monthly; cp.until = UAE.S.day + 90; live++; return; }
    var media = city === 'UAE' ? null : UAE.allFirms().filter(function (m) { return m.city === city && m.status === 'open' && UAE.FIRM_TYPES[m.type].kind === 'media'; })
      .sort(function (a, b) { return (b.owner === co.id) - (a.owner === co.id) || (UAE.FIRM_TYPES[b.type].reach || 0) - (UAE.FIRM_TYPES[a.type].reach || 0); })[0];
    var r = UAE.startCampaign(co, pid, media ? media.id : 'DIGITAL', city, monthly, 3);
    if (r.ok) { r.cp.auto = true; r.cp.by = cmo.name; started++; live++; }
  });
  // 2) every firm's own ad budget (firms the CMO no longer markets, e.g. R&D labs, lose a budget it set earlier)
  var marketed = {}; N.firms.forEach(function (x) { marketed[x.f.id] = 1; });
  UAE.firmsOf(co.id).forEach(function (f) { if (f.adByCmo && !marketed[f.id]) { f.adBudget = 0; f.adByCmo = false; } });
  var fSpent = 0, groups = {};
  N.firms.forEach(function (x) { x.f.adBudget = Math.round(x.need * cover); x.f.adByCmo = true; fSpent += x.f.adBudget; groups[x.group] = (groups[x.group] || 0) + x.f.adBudget; });
  var svcCount = N.firms.filter(function (x) { return UAE.SERVICE_BRAND[x.f.type]; }).length;
  co.cmoLast = { budget: pSpent + fSpent, need: N.total, cover: cover, products: pSpent, services: fSpent, firms: N.firms.length, serviceFirms: svcCount,
    groups: groups, campaigns: live, pct: pol.cmoPct == null ? 3 : pol.cmoPct, raised: raised, day: UAE.S.day };
  if (UAE.isHuman(co)) UAE.news(cmo.name + ' (CMO) is spending ' + UAE.fmt.aed(pSpent + fSpent) + ' this month on all ' + N.firms.length + ' businesses: ' + live + ' product campaigns + ad budgets for every firm (' + Math.round(Math.min(1, cover) * 100) + '% of the target).', 'firm');
};

/** Monthly executive work for every company (called from the daily tick on the company's day). */
UAE.execsDay = function () {
  var S = UAE.S;
  UAE.allCos().forEach(function (co) {
    if (co.foreign || co.status === 'BANKRUPT') return;
    if ((S.day + 7 + (UAE.AI.hash ? UAE.AI.hash(co.id) : 0)) % 30 !== 0) return;
    co.lastMonthRev = co.is && co.is.months && co.is.months.length ? co.is.months[co.is.months.length - 1].revenue || 0 : 0;
    UAE.cmoMonth(co); UAE.ctoMonth(co);
    if (UAE.ceoTechRace) UAE.ceoTechRace(co);         // research to beat the world leaders (engine/worldmkt.js)
    if (UAE.syncTraits) UAE.syncTraits(co);            // your companies act with their CEO's personality
    UAE.aggressiveExpand(co);
    if (UAE.segAutoCapital) UAE.segAutoCapital(co);
    if (UAE.ensureHQs) UAE.ensureHQs(co);              // reopen a missing Bank / Insurance HQ
    if (UAE.ceoInvestMonth) UAE.ceoInvestMonth(co);    // excess cash -> bank / insurer, stock picks (engine/ceoinvest.js)
  });
};

/* -------------------------------------------- CEO aggressiveness (policy.aggression) */
UAE.AGGRESSION = { normal: { n: 0, reserve: 0.3 }, high: { n: 4, reserve: 0.25 }, max: { n: 10, reserve: 0.15 } };
/** Extra expansions each month for an aggressive CEO: keeps building (tech chain first, then any business)
 *  while cash stays above the reserve, and expands its most profitable firms. */
UAE.aggressiveExpand = function (co) {
  var pol = UAE.policy(co), A0 = UAE.AGGRESSION[pol.aggression || 'normal'] || UAE.AGGRESSION.normal;
  var A = { n: pol.maxNewPerMonth != null ? pol.maxNewPerMonth : A0.n, reserve: pol.cashReserve != null ? pol.cashReserve : A0.reserve };
  if (!A.n || co.foreign) return;
  if (UAE.isHuman(co) && !co.ceoAuto) return;                       // only when the CEO runs the company
  var start = co.bs.cash, built = 0, grown = 0;
  for (var i = 0; i < A.n; i++) {
    if (co.bs.cash < start * A.reserve || co.bs.cash < 2e8) break;
    var f = i % 3 === 2 ? UAE.diversify(co) : UAE.AI.expand(co); if (f) built++;   // every 3rd move: a non-tech business
  }
  // grow the best firms (top profit, below size 6)
  UAE.firmsOf(co.id).filter(function (f) { return f.status === 'open' && f.size < 6 && f.last.profit > 0 && !f.seed; })
    .sort(function (a, b) { return b.last.profit - a.last.profit; }).slice(0, Math.ceil(A.n / 3)).forEach(function (f) {
      if (co.bs.cash > start * A.reserve + UAE.BUILD[f.type][0] * 2 && UAE.expandFirm(f)) grown++;
    });
  if ((built || grown) && UAE.isHuman(co)) UAE.news((UAE.person(co.ceo) || {}).name + ' (CEO) expanded aggressively: ' + built + ' new firm' + (built === 1 ? '' : 's') + ', ' + grown + ' upgraded.', 'firm');
};

/** A non-tech business for an aggressive CEO ("venture in all businesses"). */
UAE.DIVERSIFY = ['apartment', 'commercial', 'hotel', 'mall', 'service', 'logistics', 'warehouse', 'bankhq', 'bankbranch', 'sports', 'tv', 'farm', 'solar', 'telecom', 'inshq', 'insoffice'];
UAE.diversify = function (co) {
  var allowed = UAE.allowedTypes(co), have = {};
  UAE.firmsOf(co.id).forEach(function (f) { have[f.type] = (have[f.type] || 0) + 1; });
  var opts = UAE.DIVERSIFY.filter(function (t) { return allowed.indexOf(t) >= 0 && !(t === 'bankhq' && have.bankhq) && !(t === 'inshq' && have.inshq); })
    .sort(function (a, b) { return (have[a] || 0) - (have[b] || 0); });                    // least-owned business types first
  if (!opts.length) return UAE.AI.expand(co);
  var t = UAE.rng.pick(opts.slice(0, 4));
  if (t === 'bankbranch' && !have.bankhq) t = 'bankhq';
  if (t === 'insoffice' && !have.inshq) t = 'inshq';                                        // offices sell nothing without an Insurance HQ
  return UAE.buildFor(co, t, null) || UAE.AI.expand(co);
};

/** A company with insurance offices (or capital in its insurer) but no Insurance HQ gets one back; same for banks.
 * Without the HQ the offices sell no policies and the injected capital can't be reached. */
UAE.ensureHQs = function (co) {
  if (co.foreign || co.status === 'BANKRUPT') return;
  var have = {}; UAE.firmsOf(co.id).forEach(function (f) { have[f.type] = (have[f.type] || 0) + 1; });
  [['inshq', 'insoffice', 'ins', 'Insurance'], ['bankhq', 'bankbranch', 'bank', 'Bank']].forEach(function (x) {
    if (have[x[0]] || !(have[x[1]] || (co[x[2]] && co[x[2]].funded > 0))) return;
    var f = UAE.buildFor(co, x[0], null);
    if (UAE.isHuman(co)) UAE.news(f ? co.name + ' (CEO) opened a new ' + x[3] + ' HQ: ' + f.name + ' – its ' + x[3].toLowerCase() + ' business can trade again.'
      : co.name + ' has ' + x[3].toLowerCase() + ' offices but no ' + x[3] + ' HQ, and the CEO could not build one (cash or space). Build one yourself.', f ? 'finance' : 'warning');
  });
};
