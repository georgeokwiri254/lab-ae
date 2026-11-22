/* ============================================================================
 * UAE CAPITALISM LAB  -  NEW GAME SETUP & FIRM CONSTRUCTION
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* Average buildable land price per city (used to scale rents by district). */
UAE.cityLandAvg = function (city) {
  var ds = UAE.DISTRICTS.filter(function (d) {
    return d.city === city && ['agri','quarry','oilfield','desert'].indexOf(d.zone) < 0;
  });
  if (!ds.length) return 1000;
  return ds.reduce(function (s, d) { return s + d.land; }, 0) / ds.length;
};

/* ------------------------------------------------------------ Persons --- */
UAE.makePerson = function (o) {
  var R = UAE.rng, id = UAE.uid('P');
  var p = {
    id: id, name: o.name || (R.pick(UAE.FIRST_NAMES) + ' ' + R.pick(UAE.LAST_NAMES)),
    title: o.title || 'CEO', co: o.co || null, isPlayer: !!o.isPlayer, age: o.age || R.int(34, 66),
    cash: o.cash || 0, salary: o.salary || 0, fictional: true, mansion: null,
    skill: o.skill || { mgmt: R.int(35, 95), tech: R.int(25, 95), marketing: R.int(25, 95), finance: R.int(30, 95) },
    history: []
  };
  UAE.S.persons[id] = p;
  if (o.exp) p.exp = o.exp;
  if (UAE.ensurePerson) UAE.ensurePerson(p);   // expertise, personality, attitude (engine/ceo.js)
  return p;
};

/* ---------------------------------------------------------- Buildings --- */
/** Cost quote for a new firm of `type` at point c (does not build). */
UAE.quoteFirm = function (type, c, size) {
  var T = UAE.FIRM_TYPES[type], size_ = size || 1;
  if (!T) return { ok: false, why: 'Unknown building type' };
  if (T.disabled) return { ok: false, why: T.disabled };
  var pl = UAE.grid.blockAt(c, UAE.plotSize(type)), center = UAE.grid.center(pl);
  var kind = T.kind, land, d, dep = null;
  if (UAE.DEPOSIT_KINDS[kind]) {
    // mines and wells: only on a natural resource site, one firm per site
    dep = UAE.depositAt(center, kind);
    if (!dep) return { ok: false, why: 'A ' + T.name + ' can only be built on a natural resource site (' + UAE.DEPOSIT_KINDS[kind].join(' / ') + '). Turn on ⛏ Resources on the map to see the sites.', plot: pl };
    var st = UAE.depState(dep.id);
    if (st.firm && UAE.S.firms[st.firm]) return { ok: false, why: dep.name + ' is already owned by ' + UAE.co(UAE.S.firms[st.firm].owner).name + '.', plot: pl, deposit: dep };
    if (st.left <= 0) return { ok: false, why: dep.name + ' is exhausted.', plot: pl, deposit: dep };
    var chk0 = UAE.checkBlock(pl, T, true);
    if (!chk0.ok) return { ok: false, why: 'Plot occupied by ' + UAE.S.firms[chk0.clash].name, plot: pl, bad: chk0.bad, deposit: dep };
    d = UAE.DISTRICTS.filter(function (x) { return x.city === dep.city; }).sort(function (a, b) { return UAE.geo.km(center, a.c) - UAE.geo.km(center, b.c); })[0];
    land = dep.price;
  } else {
    d = UAE.geo.districtAt(center);
    if (!d) return { ok: false, why: 'Outside any buildable district. Zoom in and click inside a highlighted zone.', plot: pl };
    if (T.zones.indexOf(d.zone) < 0)
      return { ok: false, why: T.name + ' is not allowed in a ' + d.zone + ' zone (' + d.name + '). Allowed: ' + T.zones.join(', '), district: d, plot: pl };
    var chk = UAE.checkBlock(pl, T, false);
    if (!chk.ok) return { ok: false, why: chk.clash ? 'Plot occupied by ' + UAE.S.firms[chk.clash].name :
      'The ' + pl.n + '×' + pl.n + ' plot block crosses into ' + chk.zoneBad.name + ' (' + chk.zoneBad.zone + ') - move it fully inside an allowed zone.', district: d, plot: pl, bad: chk.bad };
    // land = building footprint (m2) x district price x city land index (plots are a placement grid, not extra land)
    land = T.m2 * d.land * (1 + 0.15 * (size_ - 1)) * (UAE.S.cities[d.city] ? UAE.S.cities[d.city].landIdx : 1);
  }
  var building = UAE.BUILD[type][0] * size_;
  return { ok: true, district: d, city: dep ? dep.city : d.city, land: land, building: building, total: land + building,
           days: UAE.BUILD[type][1], T: T, plot: pl, c: center, deposit: dep };
};

/** Capitalism Lab rule: buildings open the moment you place them. Settings -> "Realistic construction time" turns build times back on. */
UAE.instantBuild = function () { return !(UAE.S && UAE.S.settings && UAE.S.settings.constructionTime); };

/** Create a firm. opts: {name,size,instant,seed,lines,...}. Charges the owner unless seed. */
UAE.createFirm = function (ownerId, type, c, opts) {
  opts = opts || {};
  var co = UAE.co(ownerId), T = UAE.FIRM_TYPES[type];
  var size = opts.size || 1, land, building = UAE.BUILD[type][0] * size, d, plot = null, dep = null, days = UAE.BUILD[type][1];
  var mall = opts.mall ? UAE.S.firms[opts.mall] : null;
  if (mall) {                                   // store leasing space inside a shopping mall: no land, fit-out only
    d = UAE.geo.district(mall.district); land = 0; building = UAE.BUILD[type][0] * 0.5 * size; days = 15;
    var k0 = UAE.firmsOf ? UAE.allFirms().filter(function (x) { return x.mall === mall.id; }).length : 0, ang = k0 * 2.39996;
    var rr = 0.03 + 0.012 * Math.sqrt(k0);
    c = [mall.c[0] + rr / 110.57 * Math.sin(ang), mall.c[1] + rr / (111.32 * Math.cos(mall.c[0] * Math.PI / 180)) * Math.cos(ang)];
  } else if (!opts.seed) {
    var q = UAE.quoteFirm(type, c, size);
    if (!q.ok) return null;
    d = q.district; land = q.land; plot = q.plot; c = q.c; dep = q.deposit;
  } else {
    d = opts.district ? UAE.geo.district(opts.district) : UAE.geo.districtAt(c);
    if (!d) { // seed assets may sit just outside a circle - snap to nearest district
      var best = null, bd = 1e9;
      UAE.DISTRICTS.forEach(function (x) { var k = UAE.geo.km(c, x.c); if (k < bd) { bd = k; best = x; } });
      d = best;
    }
    land = 0; plot = UAE.grid.blockAt(c, UAE.plotSize(type));
    var kind0 = T.kind;
    if (UAE.DEPOSIT_KINDS[kind0]) {           // real resource sites sit on their deposit
      var outPid = (opts.lines && opts.lines[0] && opts.lines[0].pid) || null;
      dep = UAE.DEPOSITS.filter(function (x) { return (!outPid || x.res === outPid) && UAE.geo.km(c, x.c) <= x.r + 5 && !UAE.depState(x.id).firm; })
        .sort(function (a, b) { return UAE.geo.km(c, a.c) - UAE.geo.km(c, b.c); })[0] || null;
    }
  }
  if (!opts.seed) {
    if (co.bs.cash < land + building && !opts.allowDebt) return null;
    UAE.L.capex(co, building, land);
    if (dep) UAE.S.cities[dep.city].govRevYtd += land;            // site rights are sold by the emirate government
    var cc = UAE.S.cities[dep ? dep.city : d.city]; cc.investM = (cc.investM || 0) + building;   // city graphs: investment
  }
  var id = UAE.uid('F');
  var f = {
    id: id, type: type, name: opts.name || (co.name + ' ' + T.name), owner: ownerId, city: dep ? dep.city : d.city, district: d.id,
    c: c, size: size, built: UAE.S.day, seed: !!opts.seed, plot: plot, mall: mall ? mall.id : null, deposit: dep ? dep.id : null,
    status: opts.instant || opts.seed || UAE.instantBuild() ? 'open' : 'construction',
    openDay: opts.instant || opts.seed || UAE.instantBuild() ? UAE.S.day : UAE.S.day + days, buildDays: days,
    ppe: opts.seed ? 0 : building, land: opts.seed ? 0 : land,
    quality: opts.quality || 50, eff: 1, training: 0, adBudget: 0, trainBudget: 0, manager: null, popu: 30,
    lines: [], stock: {}, m: { rev:0, cost:0 }, last: { rev:0, cost:0, profit:0 }, hist: [],
    h: opts.h || null
  };
  if (dep) UAE.depState(dep.id).firm = id;
  if (mall) f.lease = UAE.newLease(mall, f, ownerId);
  if (T.kind === 'mall') f.mallPol = { lease: 'any', rentNew: 1.0, rentRenew: 1.0, term: 12 };
  // kind-specific defaults
  var C = UAE.CITIES[d.city];
  if (T.kind === 'hotel') { f.adr = Math.round(C.hotelADR * Math.sqrt(Math.max(0.4, d.foot) / 1.2) * (opts.stars === 7 ? 3 : 1)); f.occ = C.hotelOcc; f.stars = opts.stars || 5; }
  if (T.kind === 'apartment') { f.rent = Math.round(UAE.marketRent(f)); f.occ = 0.6; }
  if (T.kind === 'office' || T.kind === 'mall') { f.rent = Math.round(UAE.marketRent(f)); f.occ = 0.6; }
  if (T.kind === 'service') { f.svc = opts.svc || 'cafe'; f.price = UAE.SERVICES[f.svc].price; }
  if (T.kind === 'internet') { f.model = opts.model || 'ecommerce'; f.users = 0; }
  if (T.kind === 'software') { f.swClass = opts.swClass || UAE.SOFTWARE[1]; }
  if (T.kind === 'telecom') { f.subs = 0; f.arpu = 95; }
  if (T.kind === 'datacenter') { f.util = 0.3; }
  if (T.kind === 'rnd') { f.target = opts.target || 'phone'; }
  if (T.kind === 'sports') { f.price = opts.price || 150; }
  if (T.kind === 'bankhq') { co.bankRates = co.bankRates || { deposit: 0.03, lending: 0.065 }; }
  // product lines
  (opts.lines || []).forEach(function (l) { UAE.addLine(f, l.pid, l); });
  UAE.S.firms[id] = f;
  if (!opts.name) f.autoNamed = true;     // generated name: kept in step with what the firm makes (engine/invest.js UAE.nameSync)
  if (UAE.plotAdd) UAE.plotAdd(f);        // map plot index (engine/plots.js)
  if (UAE._idx) UAE.idxFirmChanged(f);    // firm list changed: update the per-day lookup cache (engine/sim.js)
  return f;
};

/** Add a product line to a firm (retail/factory/farm/mine/oil/warehouse). */
UAE.addLine = function (f, pid, o) {
  o = o || {}; var P = UAE.P[pid], T = UAE.FIRM_TYPES[f.type];
  if (!P || f.lines.length >= Math.max(1, T.lines)) return null;
  if (f.lines.some(function (l) { return l.pid === pid; })) return null;
  var line = { pid: pid, supplier: o.supplier || 'IMPORT', sold: 0, made: 0, on: true };
  if (T.kind === 'retail') line.price = o.price || P.ref;
  else line.price = o.price || Math.round((P.world || P.imp * 1.1) * 100) / 100;
  f.lines.push(line);
  var X = UAE._idx;                       // a producer that is already in the per-day cache: list the new line as a supplier now
  if (X && X.prod && UAE.S.firms[f.id] === f && f.status === 'open' && ['factory','farm','mine','oil','warehouse','software'].indexOf(T.kind) >= 0) {
    (X.prod[pid] = X.prod[pid] || []).push(f);
    if (X.sup && X.sup[pid]) X.sup[pid].push({ g: f, line: line, nm: f.name + ' - ' + UAE.co(f.owner).name, own: f.name + ' (own)' });
  }
  return line;
};

/** Market rent per unit / m2 per year for a leasing firm (EST model). */
UAE.marketRent = function (f) {
  var d = UAE.geo.district(f.district), R = UAE.RENT[f.city];
  var loc = Math.pow(Math.max(50, d.land) / UAE.cityLandAvg(f.city), 0.35);
  var idx = UAE.S.cities[f.city] ? UAE.S.cities[f.city].rentIdx : 1;
  if (f.type === 'apartment') return R.unit * loc * idx;
  if (f.type === 'mall') return R.office * 1.8 * Math.max(0.5, d.foot) * idx;
  return R.office * loc * idx;
};

/** Expand a firm by one size level (charges building cost, 50% of build time). */
UAE.expandFirm = function (f) {
  var co = UAE.co(f.owner), cost = UAE.BUILD[f.type][0] * (f.mall ? 0.45 : 0.9);
  if (co.bs.cash < cost) return false;
  if (f.mall && UAE.S.firms[f.mall] && UAE.mallVacancy(UAE.S.firms[f.mall]) < 1) return false;   // needs another vacant unit in the mall
  UAE.L.capex(co, cost, 0); f.ppe += cost; f.size += 1;
  if (!UAE.instantBuild()) { f.status = 'construction'; f.buildDays = Math.ceil((f.mall ? 15 : UAE.BUILD[f.type][1]) * 0.5); f.openDay = UAE.S.day + f.buildDays; }
  if (f.lease) f.lease.rent *= f.size / (f.size - 1);
  return true;
};

/** Sell / demolish a firm. Buildings recover 70% of book value, land 100% x land index. */
UAE.sellFirm = function (f, opts) {
  // headquarters (company HQ, Bank HQ, Insurance HQ): only the player (by hand) or a bankruptcy may sell them
  if ((f.type === 'hq' || f.type === 'bankhq' || f.type === 'inshq') && !(opts && opts.allowHQ)) return false;
  var co = UAE.co(f.owner);
  // liquidate stock at cost (sold to liquidator)
  var stockVal = 0; for (var p in f.stock) stockVal += f.stock[p].q * f.stock[p].cost;
  if (stockVal) { UAE.L._cash(co, stockVal * 0.8, 'op'); UAE.L._is(co, 'otherOpex', stockVal * 0.2); co.bs.retained -= stockVal * 0.2; }
  f.stock = {};
  var landBack = f.land * (UAE.S.cities[f.city].landIdx || 1);
  if (f.deposit) { var st = UAE.depState(f.deposit); landBack = f.land * Math.max(0, st.left / UAE.DEP[f.deposit].reserve); st.firm = null; }
  if (!f.seed) UAE.L.disposal(co, f.ppe * (f.mall ? 0.3 : 0.7) + landBack, f.ppe, f.land);
  else if (f.deposit) UAE.depState(f.deposit).firm = null;
  // detach any buyers that used this firm as supplier; tenants of a demolished mall become street stores
  UAE.allFirms().forEach(function (g) {
    g.lines.forEach(function (l) { if (l.supplier === f.id) l.supplier = 'IMPORT'; });
    if (g.mall === f.id) { g.mall = null; g.lease = null; g._trafDay = null; if (UAE.plotAdd) UAE.plotAdd(g); }   // now a street store: takes its plot
  });
  if (UAE.plotRemove) UAE.plotRemove(f);
  if (f.manager && UAE.person(f.manager)) { var mp = UAE.person(f.manager); mp.title = 'Candidate'; mp.co = null; }
  delete UAE.S.firms[f.id];
  if (UAE._idx) UAE.idxFirmChanged(f, true);
};

/* ============================================================== NEW GAME == */
UAE.newGame = function (opt) {
  opt = opt || {};
  UAE.S = {
    version: 1, seed: opt.seed || 20261120, nextId: 1, day: 0, speed: 0,
    companies: {}, firms: {}, persons: {}, cities: {}, bonds: {}, news: [], goals: [],
    activeCo: null, playerCo: null, playerPerson: null, difficulty: opt.difficulty || 'normal',
    macro: { oil: 1, gold: 1, rate: UAE.RULES.baseRate, tourism: 1, retail: 1, property: 1, logistics: 1, tech: 1, equity: 1, timed: [] },
    index: { DFM: { base: 6200, level: 6200, src:'EST', hist: [] }, ADX: { base: 9797.48, level: 9797.48, src:'REAL FADGI ~18-Nov-2026', hist: [] } },
    freightPool: {}, adPool: {}, settings: { govMode: false, fictionalPolitics: false }
  };
  var S = UAE.S, R = UAE.rng;
  if (UAE.govRestoreZones) UAE.govRestoreZones();                  // a new game starts without the previous game's new zones

  // ---- cities (dynamic copy)
  Object.keys(UAE.CITIES).forEach(function (k) {
    var c = UAE.CITIES[k];
    S.cities[k] = { id: k, pop: c.pop, gdp: c.gdp, cpiIdx: 100, wageIdx: 1, rentIdx: 1, landIdx: 1, qol: 60,
      unemp: c.unemp, tourists: c.tourists, govRevYtd: 0, govExpYtd: 0, govDebt: c.govDebt * 1e9,
      vat: 0, ct: 0, retailSales: 0, retailSalesM: 0, civic: 0, hist: [], fx: {} };
  });

  // ---- real seed companies
  if (opt.realCompanies !== false) UAE.SEED_COMPANIES.forEach(function (s) { UAE.seedCompany(s); });
  if (UAE.ensureGlobalMarkets) UAE.ensureGlobalMarkets();          // NYSE + NASDAQ (engine/global.js)

  // ---- player
  var cap = { easy: 1000e6, normal: 300e6, hard: 100e6 }[S.difficulty] || 300e6;
  var listing = opt.listing || 'private';
  var pco = UAE.makeCompany({ id: 'PLAYER', name: opt.companyName || 'Sanchez Holdings', ticker: (opt.ticker || 'SANCHZ').toUpperCase(),
    exch: listing === 'private' ? '' : listing, status: listing === 'private' ? 'PRIVATE' : 'LISTED',
    hq: opt.hq || 'DXB', sector: 'holding', controller: 'PLAYER', price: 3.0, shares: Math.round(cap / 3.0), payout: 0 });
  pco.listingSrc = listing === 'private' ? '' : 'SIMULATED listing (fictional)';
  pco.color = '#b8ff2c';
  S.companies.PLAYER = pco;
  UAE.L.issueEquity(pco, cap);
  var me = UAE.makePerson({ name: opt.playerName || 'Sanchez', title: 'Chairman & CEO', co: 'PLAYER', isPlayer: true,
    cash: cap * 0.1, age: 38, skill: { mgmt: 70, tech: 60, marketing: 65, finance: 70 } });
  pco.ceo = me.id; S.playerPerson = me.id; S.playerCo = 'PLAYER'; S.activeCo = 'PLAYER';
  if (listing === 'private') pco.holders['P:' + me.id] = pco.shares;
  else { pco.holders['P:' + me.id] = Math.round(pco.shares * 0.6); pco.holders.PUBLIC = pco.shares - pco.holders['P:' + me.id]; }
  pco.cf.cur = UAE.newCF(); pco.cf.ytd = UAE.newCF();   // opening capital is not a period flow

  // ---- fictional AI start-ups (Capitalism Lab style competitors)
  var n = opt.aiCount == null ? 10 : opt.aiCount;
  var pool = UAE.FICTIONAL_COMPANIES.slice();
  for (var i = 0; i < n && pool.length; i++) {
    var pickI = Math.floor(R.next() * pool.length), fc = pool.splice(pickI, 1)[0];
    UAE.makeStartup(fc[0], fc[1]);
  }

  // ---- synthetic sovereign & municipal bonds (SYN - illustrative issues)
  [['GOVDXB31','Government of Dubai 2031 (SYN)','DXB',5,8e9],['GOVAUH33','Abu Dhabi Govt 2033 (SYN)','AUH',7,10e9],
   ['GOVSHJ30','Sharjah Govt 2030 (SYN)','SHJ',4,3e9],['GOVRAK32','RAK Govt 2032 (SYN)','RAK',6,2e9],
   ['UAEFED35','UAE Federal T-Bond 2035 (SYN)','',9,6e9]].forEach(function (b) {
    var spread = { DXB: 0.008, AUH: 0.004, SHJ: 0.018, RAK: 0.012, '': 0.002 }[b[2]];
    S.bonds[b[0]] = { id: b[0], name: b[1], issuer: 'GOV:' + (b[2] || 'UAE'), city: b[2], face: b[4], coupon: Math.round((S.macro.rate + spread + 0.005) * 1e4) / 1e4,
      spread: spread, maturity: S.day + b[3] * 365, price: 100, hist: [], sovereign: true };
  });

  // CEO policies (expansion strategies, scope of production, management policies) and CEO expertise
  UAE.allCos().forEach(function (co) { UAE.policy(co); if (co.id !== 'PLAYER') UAE.seedCeoExpertise(co); });
  UAE.initGoals();
  UAE.news('Welcome to the UAE. Markets open: DFM index ' + Math.round(S.index.DFM.level) + ' (EST), ADX FADGI ' + S.index.ADX.level.toFixed(2) + ' (REAL).', 'system');
  UAE.news('CBUAE base rate 3.90%, VAT 5%, corporate tax 9% above AED 375k - all REAL federal rules.', 'system');
  return S;
};

/** Turn one row of UAE.SEED_COMPANIES into a live company with legacy core business. */
UAE.seedCompany = function (s) {
  var S = UAE.S, sec = UAE.SECTORS[s.sec] || UAE.SECTORS.holding;
  var listed = s.st === 'LISTED';
  var shares = Math.round((s.sh || 1) * 1e9);
  var co = UAE.makeCompany({ id: s.id, name: s.name, ticker: s.t, exch: s.x, status: s.st, hq: s.hq, sector: s.sec,
    seed: true, price: listed ? s.px : 0, shares: shares, payout: listed ? 0.55 : 0.4 });
  co.priceSrc = s.pxs || ''; co.finSrc = s.fin; co.real = true;
  var rev = s.rev * 1e9, ni = s.ni * 1e9;
  var assets = rev * sec.assetsPerRev, liab = assets * sec.debtShare, eq = assets - liab;
  co.bs.cash = assets * (s.sec === 'bank' ? 0.05 : 0.08);
  co.bs.coreAssets = assets - co.bs.cash; co.bs.coreLiab = liab;
  co.bs.shareCap = eq * 0.3; co.bs.retained = eq * 0.7;
  co.legacy = { rev: rev, ni: ni, preTax: ni > 0 ? ni / 0.91 : ni, grow: sec.grow, idx: 1 };
  co.seedNI = ni;
  // ownership: strategic holders (EST) + public float
  var used = 0;
  (s.own || []).forEach(function (o) {
    if (!o[1]) return;
    var key = UAE.SEED_COMPANIES.some(function (x) { return x.id === o[0]; }) ? 'C:' + o[0] : 'I:' + o[0];
    co.holders[key] = Math.round(shares * o[1] / 100); used += co.holders[key];
  });
  if (listed) co.holders.PUBLIC = shares - used;
  else if (shares - used > 0) co.holders['I:' + ((s.own && s.own[0] && s.own[0][0]) || 'FOUND')] = (co.holders['I:' + ((s.own && s.own[0] && s.own[0][0]) || 'FOUND')] || 0) + shares - used;
  co.traits = { aggression: 0.25, risk: 0.3, pricing: 0.5, diversify: 0.15 };
  // starting technology / brand by sector
  UAE.PRODUCTS.forEach(function (p) { co.tech[p.id] = 50; });
  co.brandBase = 55;
  S.companies[co.id] = co;
  var ceo = UAE.makePerson({ title: 'CEO (fictional persona)', co: co.id, salary: 12e6 / 12 });
  co.ceo = ceo.id;
  // flagship physical assets at real locations
  (s.sites || []).forEach(function (site) {
    var lines = [];
    if (site.sells) site.sells.forEach(function (pid) { lines.push({ pid: pid }); });
    if (site.makes) site.makes.forEach(function (pid) { lines.push({ pid: pid }); });
    if (site.out) lines.push({ pid: site.out });
    if (site.type === 'mine' && !site.out) lines.push({ pid: 'limestone' });
    UAE.createFirm(co.id, site.type, site.c, { name: site.name, size: site.size || 1, seed: true, lines: lines,
      model: site.model, stars: site.stars, h: site.h, quality: 70 });
  });
};

/** A fictional AI-run start-up with a founder, HQ and 1-3 first firms. */
UAE.makeStartup = function (name, sector) {
  var S = UAE.S, R = UAE.rng;
  var cityW = [['DXB',5],['AUH',3],['SHJ',1.4],['AAN',0.8],['AJM',0.6],['RAK',0.6],['FUJ',0.4]];
  var tot = cityW.reduce(function (s, x) { return s + x[1]; }, 0), r = R.next() * tot, city = 'DXB';
  for (var i = 0; i < cityW.length; i++) { r -= cityW[i][1]; if (r <= 0) { city = cityW[i][0]; break; } }
  var cap = Math.round(R.range(60e6, 350e6) / 1e6) * 1e6;
  var listed = R.chance(0.6), exch = UAE.CITIES[city].emirate === 'AD' ? 'ADX' : 'DFM';
  var tick = name.replace(/[^A-Z]/g, '').slice(0, 4) + 'X';
  var price = Math.round(R.range(1.5, 8) * 100) / 100;
  var co = UAE.makeCompany({ id: UAE.uid('C'), name: name, ticker: listed ? tick : '', exch: listed ? exch : '',
    status: listed ? 'LISTED' : 'PRIVATE', hq: city, sector: sector, fictional: true, price: price, shares: Math.round(cap / price),
    traits: { aggression: R.range(0.3, 0.95), risk: R.range(0.2, 0.8), pricing: R.range(0.2, 0.8), diversify: R.range(0.1, 0.6) },
    payout: R.range(0, 0.4) });
  co.listingSrc = listed ? 'SIMULATED listing (fictional company)' : '';
  S.companies[co.id] = co;
  UAE.L.issueEquity(co, cap);
  co.cf.cur = UAE.newCF(); co.cf.ytd = UAE.newCF();
  UAE.PRODUCTS.forEach(function (p) { co.tech[p.id] = R.int(35, 55); });
  co.brandBase = 20;
  var founder = UAE.makePerson({ title: 'Founder & CEO', co: co.id, cash: cap * R.range(0.05, 0.3), salary: 150000 });
  co.ceo = founder.id;
  var fs = Math.round(co.shares * R.range(0.55, 0.85));
  co.holders['P:' + founder.id] = fs;
  co.holders[listed ? 'PUBLIC' : 'I:FOUND'] = co.shares - fs;
  // HQ + opening moves (instant, so the map is alive at start)
  var cbd = UAE.DISTRICTS.filter(function (d) { return d.city === city && (d.zone === 'cbd' || d.zone === 'commercial'); });
  if (cbd.length) {
    var d = R.pick(cbd), p = UAE.randomPointIn(d, 'hq');
    if (p) UAE.createFirm(co.id, 'hq', p, { name: name + ' HQ', instant: true });
  }
  var moves = R.int(1, 3);
  for (var m = 0; m < moves; m++) UAE.AI.expand(co, true);
  return co;
};

/** Random free point inside a district circle (null if none found). */
UAE.randomPointIn = function (d, type) {
  var R = UAE.rng;
  for (var tries = 0; tries < 25; tries++) {
    var ang = R.next() * Math.PI * 2, rad = Math.sqrt(R.next()) * d.r * 0.85;
    var lat = d.c[0] + (rad / 110.57) * Math.sin(ang);
    var lng = d.c[1] + (rad / (111.32 * Math.cos(d.c[0] * Math.PI / 180))) * Math.cos(ang);
    var q = UAE.quoteFirm(type || 'retail', [lat, lng], 1);     // snapped to the plot grid, zone + collision checked
    if (q.ok) return q.c;
  }
  return null;
};

/* --------------------------------------------------------------- News --- */
UAE.news = function (text, kind) {
  UAE.S.news.unshift({ day: UAE.S.day, text: text, kind: kind || 'info' });
  if (UAE.S.news.length > 400) UAE.S.news.length = 400;
  if (UAE.onNews) UAE.onNews(UAE.S.news[0]);
};

/** Duplicate firms: copy the setup of `src` onto the new firm `dst` (same type).
 *  Product lines with prices, suppliers and rates, factory input suppliers, ad & training budgets,
 *  service type & price, internet model, software title & price, R&D target, rents. */
UAE.copyFirmSetup = function (src, dst) {
  if (!src || !dst || src.type !== dst.type) return dst;
  var k = UAE.FIRM_TYPES[dst.type].kind;
  if (k !== 'software' && ['mine', 'oil'].indexOf(k) < 0) {          // mines / wells keep the resource of their own site
    dst.lines = [];
    src.lines.forEach(function (l) {
      var n = UAE.addLine(dst, l.pid, { price: l.price, supplier: l.supplier }); if (!n) return;
      ['priceSet', 'fixedPrice', 'rate', 'forceExport'].forEach(function (x) { if (l[x] != null) n[x] = l[x]; });
      if (l.inSup) n.inSup = JSON.parse(JSON.stringify(l.inSup));
      if (n.supplier === dst.id) n.supplier = 'IMPORT';
    });
  }
  ['adBudget', 'trainBudget', 'svc', 'price', 'model', 'target', 'autoResearch', 'retailPrice', 'rent', 'adr'].forEach(function (x) { if (src[x] != null) dst[x] = src[x]; });
  if (k === 'software' && src.lines[0]) { UAE.setSoftware(dst, src.lines[0].pid); dst.lines[0].price = src.lines[0].price; dst.lines[0].priceSet = src.lines[0].priceSet; }
  if (src.mallPol) dst.mallPol = JSON.parse(JSON.stringify(src.mallPol));
  return dst;
};
