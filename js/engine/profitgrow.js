/* ============================================================================
 * UAE CAPITALISM LAB  -  PROFIT-LED REINVESTMENT (your companies, hired CEO)
 * Every month, BEFORE spare cash goes to bonds / stocks / the bank / the insurer, the CEO:
 *  1. ranks the company's own businesses by what they REALLY earn (average profit per firm last month,
 *     firms older than 6 months; business = firm type + product / model);
 *  2. for the most profitable ones, checks every city: where the business is missing (or thin per
 *     million people) it opens one there, in the city with the best appeal (engine/execs.js cityAppeal);
 *     where every city already has it, it upgrades the best-earning existing firm instead;
 *  3. diversifies: no business gets more than DIV_CAP of the month's moves, and every 4th move goes to a
 *     business type the company does not own yet that passes the investment analysis (engine/invest.js).
 * Budget: pol.bizPct (default 40)% of the cash above the cushion, at most pol.bizMax (default 20) new firms
 * + 2x that in upgrades a month (firm count drives game speed). Log: co.prGrow (HQ -> Investment analysis).
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.PG = { bizPct: 40, bizMax: 20, top: 12, minAge: 180, divCap: 0.25, divEvery: 4 };
UAE.PG_SKIP = ['hq', 'bankhq', 'inshq', 'rnd', 'software'];           // head offices, research and global titles have no city market

/** Business key of a firm: type + what it makes / sells. */
UAE.pgKey = function (f) {
  if (f.type === 'factory' || f.type === 'farm' || f.type === 'mine') return f.type + '|' + ((f.lines && f.lines[0] && f.lines[0].pid) || '');
  if (f.type === 'internet') return 'internet|' + (f.model || 'ecommerce');
  return f.type + '|';
};
UAE.pgLabel = function (key) {
  var p = key.split('|'), T = UAE.FIRM_TYPES[p[0]] || { name: p[0] };
  if (p[1] && UAE.P[p[1]]) return UAE.shortProduct(p[1]) + ' ' + T.name.toLowerCase();
  if (p[0] === 'internet' && UAE.INET_LABEL) return UAE.INET_LABEL[p[1]] || p[1];
  return T.name;
};

/** Own businesses ranked by average monthly profit per firm, with the city gaps of each. */
UAE.pgAnalysis = function (co) {
  var S = UAE.S, by = {};
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status === 'closed' || UAE.PG_SKIP.indexOf(f.type) >= 0) return;
    var k = UAE.pgKey(f), b = by[k] || (by[k] = { key: k, type: f.type, pid: k.split('|')[1] || null, n: 0, nOld: 0, profit: 0, rev: 0, cities: {}, firms: [] });
    b.n++; b.cities[f.city] = (b.cities[f.city] || 0) + 1; b.firms.push(f);
    if (f.status === 'open' && S.day - (f.openDay || 0) >= UAE.PG.minAge) { b.nOld++; b.profit += (f.last && f.last.profit) || 0; b.rev += (f.last && f.last.rev) || 0; }
  });
  var list = Object.keys(by).map(function (k) { return by[k]; }).filter(function (b) { return b.nOld > 0 && b.profit > 0; });
  list.forEach(function (b) {
    b.avg = b.profit / b.nOld; b.margin = b.rev > 0 ? b.profit / b.rev : 0;
    b.cost = UAE.invBuildCost(b.type); b.ret = b.avg * 12 / b.cost;                // yearly return on a new firm like the average one
    var app = UAE.cityAppeal(co, b.type).filter(function (x) { return !x.f.none; });
    var popT = 0, nT = 0; app.forEach(function (x) { popT += UAE.S.cities[x.k].pop; nT += b.cities[x.k] || 0; });
    var avgD = nT / Math.max(0.1, popT / 1e6);
    b.gaps = app.map(function (x) {
      var have = b.cities[x.k] || 0, pm = Math.max(0.05, UAE.S.cities[x.k].pop / 1e6), dens = have / pm;
      return { city: x.k, have: have, missing: have === 0, thin: have > 0 && dens < avgD * 0.5, w: x.w / (1 + have) };
    }).filter(function (g) { return g.missing || g.thin; }).sort(function (a, c) { return (c.missing - a.missing) || (c.w - a.w); });
  });
  list.sort(function (a, c) { return c.avg * (0.7 + 0.3 * Math.min(1, Math.max(0, c.margin) * 2)) - a.avg * (0.7 + 0.3 * Math.min(1, Math.max(0, a.margin) * 2)); });
  return list.filter(function (b) { return b.ret > UAE.invCostOfCapital(co); }).slice(0, UAE.PG.top);
};

/** Software titles: revenue depends on tech index x brand x reach and is SPLIT over the company's firms making it,
 *  so a second copy earns nothing extra. Their profit is reinvested as R&D labs on the title (more teams = faster tech gains). */
UAE.pgSoftware = function (co) {
  var by = {}, S = UAE.S;
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.type !== 'software' || f.status !== 'open') return;
    var pid = UAE.swPid ? UAE.swPid(f) : (f.lines[0] && f.lines[0].pid); if (!pid) return;
    var b = by[pid] || (by[pid] = { key: 'software|' + pid, type: 'software', pid: pid, n: 0, profit: 0, rev: 0 });
    b.n++; b.profit += (f.last && f.last.profit) || 0; b.rev += (f.last && f.last.rev) || 0;
  });
  return Object.keys(by).map(function (k) { var b = by[k]; b.avg = b.profit / b.n; b.margin = b.rev > 0 ? b.profit / b.rev : 0;
    b.teams = UAE.activeResearchCount ? UAE.activeResearchCount(co, b.pid) : 0; b.cap = UAE.rndTeamCap ? UAE.rndTeamCap(co, b.pid) : 3;
    b.gap = UAE.WM && UAE.WM[b.pid] ? UAE.wmFrontier(b.pid) - UAE.gtech(co, b.pid) : 0; return b; })
    .filter(function (b) { return b.profit > 0; }).sort(function (a, c) { return c.profit - a.profit; }).slice(0, 8);
};

/** Build one firm of a business in a given city (factories: same product line). */
UAE.pgBuildIn = function (co, b, city) {
  return UAE.buildFor(co, b.type, b.pid, false, city);
};

UAE.profitReinvest = function (co) {
  if (co.foreign || co.status === 'BANKRUPT' || !UAE.isHuman(co) || !UAE.ceoPerson(co) || !co.ceoAuto) return;
  var pol = UAE.policy(co); if (pol.profitGrow === false) return;
  var A = UAE.fmt.aed, cushion = UAE.cashCushion(co), excess = UAE.groupFreeCash(co) - cushion;
  var budget = Math.min(excess, co.bs.cash - cushion * 0.5) * (pol.bizPct == null ? UAE.PG.bizPct : pol.bizPct) / 100;
  var maxNew = pol.bizMax != null ? pol.bizMax : pol.maxNewPerMonth != null ? pol.maxNewPerMonth : UAE.PG.bizMax,   // follows the CEO 'new firms per month' slider
      maxUp = maxNew * 2;
  var R = co.prGrow = { day: UAE.S.day, budget: Math.max(0, budget), spent: 0, built: [], upgraded: [], diversified: [], top: [] };
  if (!(budget > 5e7) || !maxNew) return;
  R.slots = UAE.fillIdlePlants(co);                    // idle plants first: free production slots get a paying product
  var list = UAE.pgAnalysis(co);
  R.top = list.map(function (b) { return { key: b.key, label: UAE.pgLabel(b.key), n: b.n, avg: b.avg, margin: b.margin, ret: b.ret, cities: Object.keys(b.cities).length, gaps: b.gaps.slice(0, 4).map(function (g) { return { city: g.city, have: g.have }; }) }; });
  var moves = 0, per = {}, cap = Math.max(1, Math.ceil(maxNew * UAE.PG.divCap)), spend0 = co.bs.cash;
  var spent = function () { return Math.max(0, spend0 - co.bs.cash); };
  var log = function (f, b, why) { co.expLog = co.expLog || []; co.expLog.unshift({ day: UAE.S.day, firm: f.name, fid: f.id, type: f.type, pid: b && b.pid, invest: b ? b.cost : UAE.invBuildCost(f.type), profitM: b ? b.avg : 0, payback: b ? b.cost / b.avg : 0, margin: b ? b.margin : 0, why: why }); if (co.expLog.length > 80) co.expLog.length = 80; };
  var divTry = function () {                                         // a business type the company does not own yet (investment analysis)
    var own = {}; UAE.firmsOf(co.id).forEach(function (f) { own[f.type + '|' + (f.type === 'internet' ? f.model : '')] = 1; });
    var An = UAE.investAnalysis(co), c = An.list.find(function (x) { return !x.done && (x.group === 'business' || x.group === 'retail') && !own[x.type + '|' + (x.type === 'internet' ? x.pid : '')] && x.invest <= budget - spent(); });
    if (!c) return null;
    var f = UAE.invBuild(co, c); if (f) R.diversified.push({ name: f.name, why: c.why }); return f;
  };
  // pass 1: open the best businesses in the cities that lack them (round-robin over the top earners)
  for (var round = 0; round < 3 && moves < maxNew; round++) {
    for (var i = 0; i < list.length && moves < maxNew; i++) {
      if (spent() >= budget) break;
      if (moves && moves % UAE.PG.divEvery === UAE.PG.divEvery - 1 && divTry()) { moves++; continue; }
      var b = list[i]; if ((per[b.key] || 0) >= cap) continue;
      var g = b.gaps.shift(); if (!g) continue;
      var f = UAE.pgBuildIn(co, b, g.city); if (!f) continue;
      moves++; per[b.key] = (per[b.key] || 0) + 1; b.cities[g.city] = (b.cities[g.city] || 0) + 1;
      var cn = UAE.CITIES[g.city].name, why = UAE.pgLabel(b.key) + ' is one of your most profitable businesses (' + A(b.avg) + '/mo per firm, ' + Math.round(b.margin * 100) + '% margin, ' + Math.round(b.ret * 100) + '%/yr on cost) and ' + cn + (g.missing ? ' had none' : ' had only ' + g.have + ' for its population') + '.';
      R.built.push({ name: f.name, city: cn, why: why }); log(f, b, 'Profit reinvestment: ' + why);
    }
  }
  if (moves < maxNew && spent() < budget && divTry()) moves++;
  // pass 2: every city covered -> upgrade the best-earning firms of the top businesses (more capacity, no extra firms)
  var ups = 0;
  list.forEach(function (b) {
    b.firms.filter(function (f) { return f.status === 'open' && f.last && f.last.profit > b.avg * 0.8 && f.size < (f.type === 'factory' ? UAE.INVEST.maxPlantSize || 20 : 10); })
      .sort(function (x, y) { return y.last.profit - x.last.profit; }).slice(0, 3).forEach(function (f) {
        if (ups >= maxUp || spent() >= budget) return;
        if (UAE.expandFirm(f)) { ups++; R.upgraded.push({ name: f.name, size: f.size }); if (UAE.nameSync) UAE.nameSync(f); }
      });
  });
  R.spent = spent();
  if (UAE._idx) UAE._idx.invProd = null;
  if (R.built.length || R.upgraded.length || R.diversified.length || R.slots) {
    var cities = {}; R.built.forEach(function (x) { cities[x.city] = 1; });
    UAE.news('💹 ' + UAE.ceoPerson(co).name + ' (CEO, ' + co.name + ') reinvested ' + A(R.spent) + ' in the most profitable businesses: ' + R.built.length + ' new firm' + (R.built.length === 1 ? '' : 's') +
      (R.built.length ? ' in cities that lacked them (' + Object.keys(cities).join(', ') + ')' : '') + ', ' + R.upgraded.length + ' upgraded' + (R.slots ? ', ' + R.slots + ' idle plant slot' + (R.slots === 1 ? '' : 's') + ' put to work' : '') +
      (R.diversified.length ? ', ' + R.diversified.length + ' new business line' + (R.diversified.length === 1 ? '' : 's') + ' (' + R.diversified.map(function (x) { return x.name; }).join(', ') + ')' : '') + '. The rest goes to the financial portfolio.', 'firm');
  }
};

/* ------------------------------------------------ 100% productivity (your firms) */
/** Training budget (AED / month) that keeps a firm's efficiency target at 102%, so it climbs to and stays at 100%+. */
UAE.fullEffBudget = function (f) {
  var T = UAE.FIRM_TYPES[f.type], c = UAE.S.cities[f.city], C = UAE.CITIES[f.city], co = UAE.co(f.owner);
  if (!T || !c || !C || (f.seed && co && co.legacy)) return 0;
  var wages = T.staff * (1 + 0.8 * (f.size - 1)) * C.wage * c.wageIdx * T.wageMult / 30 + (f.manager && UAE.person(f.manager) ? UAE.person(f.manager).salary / 30 : 0);
  var mgr = f.manager && UAE.person(f.manager) ? UAE.person(f.manager).skill.mgmt / 1000 : 0;
  var x = 1.02 - 0.9 - mgr - 0.05 * (UAE.expertLevels ? UAE.expertLevels(f) : 0);
  if (x <= 0) return 0;
  return Math.min(0.25, x) / (1.5 * UAE.trainingMult(f)) * wages * 30;
};

/* ------------------------------------------------ idle plants: every production slot at work */
/** Products whose own plants stand idle (stock over 10 days of output - production paused). Cached per company per day. */
UAE.pgIdlePids = function (co) {
  var S = UAE.S;
  if (co._idle && co._idle.day === S.day) return co._idle.pids;
  var pids = {}, plants = [];
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.type !== 'factory' || f.status !== 'open' || !f.lines.length) return;
    var idle = f.lines.every(function (l) {
      var P = UAE.P[l.pid]; if (!P || !P.rec) return false;
      var maxOut = P.rec.cap * (1 + 0.8 * (f.size - 1)) * f.eff / Math.max(1, f.lines.length) * 1.5;
      return UAE.stockQ(f, l.pid) > maxOut * 10;
    });
    if (idle) { plants.push(f); f.lines.forEach(function (l) { pids[l.pid] = 1; }); }
  });
  co._idle = { day: S.day, pids: pids, plants: plants };
  Object.defineProperty(co, '_idle', { enumerable: false, writable: true, configurable: true, value: co._idle });   // not saved
  return pids;
};
/** Free production slots of idle plants get the best paying factory product of the investment analysis
 *  (a product whose own plants are not idle, not already in the plant). Returns the number of slots filled. */
UAE.fillIdlePlants = function (co, max) {
  UAE.pgIdlePids(co);
  var plants = co._idle.plants, An = UAE.investAnalysis(co), n = 0, used = {}, lim = max || 400;
  var cands = An.list.filter(function (c) { return c.type === 'factory' && c.pid && UAE.P[c.pid] && UAE.P[c.pid].rec; });
  if (!plants.length || !cands.length) return 0;
  var maxL = UAE.FIRM_TYPES.factory.lines || 3;
  plants.forEach(function (f) {
    while (n < lim && f.lines.length < maxL) {
      var c = cands.filter(function (x) { return !f.lines.some(function (l) { return l.pid === x.pid; }); })
        .sort(function (a, b) { return (used[a.pid] || 0) - (used[b.pid] || 0) || b.score - a.score; })[0];
      if (!c) break;
      UAE.addLine(f, c.pid); var l = f.lines[f.lines.length - 1];
      if (UAE.linkOwnBuyers) UAE.linkOwnBuyers(f, c.pid);
      UAE.P[c.pid].rec.in.forEach(function (x) {
        var own = UAE.firmsOf(co.id).find(function (g) { return g !== f && g.status === 'open' && g.lines.some(function (m) { return m.pid === x[0]; }); });
        if (own) { l.inSup = l.inSup || {}; l.inSup[x[0]] = own.id; }
      });
      used[c.pid] = (used[c.pid] || 0) + 1; n++;
    }
    if (UAE.nameSync) UAE.nameSync(f);
  });
  if (n && UAE._idx) UAE._idx.invProd = null;   // addLine keeps the day cache of suppliers in step
  return n;
};
