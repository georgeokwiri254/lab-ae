/* ============================================================================
 * UAE CAPITALISM LAB  -  CEO INVESTMENT ANALYSIS & EXPANSION
 *
 * Before opening anything, the CEO scores every option:
 *   factories   - each product: unit cost (inputs + labour) vs selling price (world price at the company's tech
 *                 index for products with a world market, UAE price otherwise), demand still open to the company
 *                 (unmet world demand + UAE demand served by background sellers), capacity of one factory.
 *   software    - titles with a world market the company does not publish yet (share once reach is built).
 *   stores      - the best UAE consumer products to sell (margin x open demand x necessity).
 *   businesses  - hotels, housing, offices, media, logistics, telecom ...: what such a firm really earns in the game
 *                 economy today (average of all open firms of that type, diluted by one more competitor).
 *   R&D centres - for products the company sells abroad: the centre loses money on its own, but each extra team
 *                 raises the world tech index -> more world share and pricing power (the tech-lead bonus).
 * Monthly profit = revenue - variable costs - running costs (staff, electricity, R&D programme).
 * Score = profit x (necessity) x (margin) / (1 + payback / 2 yrs). Only projects that pay back within 3 years
 * and fit 25% of cash are built; each opening is logged with its reason (HQ -> Investment analysis).
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});
UAE.INVEST = { hurdleMonths: 36, cashPct: 0.25, reachPlan: 0.3, keep: 30 };

/** Money the CEO can put to work: 25% of cash plus half the unused credit line (if the company may borrow). */
UAE.invBudget = function (co) {
  var pol = UAE.policy ? UAE.policy(co) : {}, cash = Math.max(0, co.bs.cash) * UAE.INVEST.cashPct;
  var debt = pol.mgmt && pol.mgmt.takeLoans === false ? 0 : Math.max(0, UAE.creditLimit ? UAE.creditLimit(co) * 0.5 : 0);
  return { cash: cash, debt: debt, total: cash + debt };
};
/** Cost of capital: what borrowing costs this company (idle cash only earns the deposit rate). */
UAE.invCostOfCapital = function (co) { return UAE.loanRate ? UAE.loanRate(co) : 0.06; };
/** Deep pockets: the project is small next to the company's cash. */
UAE.invDeep = function (co, invest) { return co.bs.cash > 0 && invest < co.bs.cash * 0.05; };
UAE.invBuildCost = function (type) { var b = UAE.BUILD[type]; return (b ? b[0] : 20e6) * 1.2; };        // + land (EST)
UAE.invFixedM = function (type, city) {
  var T = UAE.FIRM_TYPES[type], k = city || 'DXB', C = UAE.CITIES[k], c = UAE.S.cities[k] || {};
  return T.staff * C.wage * (c.wageIdx || 1) * T.wageMult + (T.kwh || 0) * 0.38;                     // staff + electricity / month
};
UAE.invLanded = function (pid) { return UAE.importBase(pid) * (1 + UAE.RULES.customs) * 1.06; };
UAE.invUnitCost = function (pid) {
  var P = UAE.P[pid]; if (!P.rec) return UAE.invLanded(pid);
  var c = P.rec.lab; P.rec.in.forEach(function (x) { c += x[1] * Math.min(UAE.wholesalePrice(x[0]), UAE.invLanded(x[0])); });
  return c;
};
UAE.invNecessity = function (P) {
  if (P.kind === 'consumer' || P.kind === 'fuel') return Math.max(0.05, 1 - Math.min(1.5, Math.abs(P.el || 1)) / 1.5);
  return P.kind === 'software' ? 0.6 : 0.7;                                                            // business-critical inputs
};
UAE.invUaeOpen = function (pid) {
  var S = UAE.S, bg = 0, D = 0; Object.keys(S.cities).forEach(function (c) { var m = S.mkt && S.mkt[c + '|' + pid]; if (m) { bg += m.bgUnits || 0; D += m.demand || 0; } });
  return { bg: bg, D: D };
};
/** World potential for company co in pid (with global reach built up to the plan level). */
UAE.invWorld = function (co, pid) {
  var M = UAE.WM && UAE.WM[pid]; if (!M || M.subs) return null;
  var st = UAE.S.world2 && UAE.S.world2[pid], W = UAE.wmSize(pid), F = UAE.wmFrontier(pid), avg = UAE.wmAverage(pid), g = UAE.gtech(co, pid);
  var reach = Math.max(UAE.reach(co, pid), UAE.INVEST.reachPlan);
  var A = reach * Math.pow(UAE.wmBrand(co, pid), M.brandPow || 1) * Math.exp((g - F) / 10);
  var lead = 0, oth = 1; M.leaders.forEach(function (L) { lead += L[4] * Math.exp((UAE.leaderIdx(L) - F) / 10); oth -= L[4]; });
  lead += Math.max(0, oth) * Math.exp(-2);
  var me = st && st.cos[co.id], rivals = st ? Math.max(0, st.sum - st.lead - (me ? me.A : 0)) : 0;
  var share = Math.min(UAE.WORLD.maxShare, A / (lead + rivals + A)), base = UAE.wmBase(pid);
  var price = base * Math.max(0.5, Math.min(2.2, Math.exp((g - avg) / 25)));
  var demandM = share * W / 12, shippedM = me ? me.units * base * 30 : 0;
  var credible = g >= F - 30;                       // world buyers ignore products far behind the leaders: research first
  return { share: share, price: price, base: base, demandM: credible ? demandM : 0, unmetM: credible ? Math.max(0, demandM - shippedM) : 0, g: g, F: F, sells: !!me, rev: me ? me.rev * 30 : 0, credible: credible };
};
UAE.invFmt = function (v) { return UAE.fmt.aed(v); };

/** Average real results of one firm type across the whole economy (open firms older than 6 months). */
UAE.invTypeStats = function (type, model) {
  var X = UAE._idx, key = 'invT|' + type + '|' + (model || '');
  if (X && X[key]) return X[key];
  var n = 0, rev = 0, prof = 0;
  UAE.allFirms().forEach(function (f) {
    if (f.type !== type || f.status !== 'open' || (model && f.model !== model) || UAE.S.day - (f.openDay || 0) < 180) return;
    n++; rev += f.last.rev || 0; prof += f.last.profit || 0;
  });
  var r = { n: n, rev: n ? rev / n : 0, profit: n ? prof / n : 0 };
  if (X) X[key] = r; return r;
};

/** UAE factories already making pid (any company) - they share the open UAE demand. */
UAE.invProducers = function (pid) {
  var X = UAE._idx, by = X && X.invProd;
  if (!by) { by = {}; UAE.allFirms().forEach(function (f) { if (f.type === 'factory' && f.status !== 'closed') f.lines.forEach(function (l) { by[l.pid] = (by[l.pid] || 0) + 1; }); }); if (X) X.invProd = by; }
  return by[pid] || 0;
};
/** Share of all advertising in the economy that the company's own group pays (last month). */
UAE.invOwnAdShare = function (co) {
  var mine = 0, all = 0, human = UAE.isHuman(co);
  UAE.allCos().forEach(function (c) {
    if (c.foreign || !c.is || !c.is.months || !c.is.months.length) return;
    var a = c.is.months[c.is.months.length - 1].advertising || 0; all += a;
    if (c.id === co.id || (human && UAE.isHuman(c)) || c.parent === co.id || co.parent === c.id) mine += a;
  });
  return all > 0 ? mine / all : 0;
};
UAE.INV_BUSINESS = [['apartment', 0.8], ['commercial', 0.5], ['hotel', 0.4], ['mall', 0.5], ['service', 0.5], ['logistics', 0.6], ['warehouse', 0.6],
  ['sports', 0.3], ['tv', 0.4], ['radio', 0.3], ['newspaper', 0.2], ['telecom', 0.9], ['solar', 0.8], ['datacenter', 0.7], ['bankbranch', 0.7], ['insoffice', 0.6]];

/** Full analysis for a company: every candidate with its numbers and reason, best first. */
UAE.investAnalysis = function (co, force) {
  var S = UAE.S;
  if (!force && co.invA && S.day - co.invA.day < 30) return co.invA;
  var allowed = UAE.allowedTypes ? UAE.allowedTypes(co) : Object.keys(UAE.FIRM_TYPES), out = [], A = UAE.invFmt, I = UAE.INVEST;
  var ok = function (t) { return allowed.indexOf(t) >= 0 && UAE.FIRM_TYPES[t]; };
  var hq = co.hq || 'DXB', vat = UAE.RULES.vat;
  var push = function (c) {
    if (!(c.profitM > 0) || !(c.invest > 0)) return;
    c.payback = c.invest / c.profitM;
    c.ret = c.profitM * 12 / c.invest;
    if (c.ret < UAE.invCostOfCapital(co) + 0.03 || c.payback > I.hurdleMonths) return;
    c.score = c.profitM * (0.75 + 0.25 * c.nec) * (0.8 + 0.4 * Math.min(1, Math.max(0, c.margin) / 0.5)) / (1 + c.payback / 24);
    out.push(c);
  };
  // 1 factories (every manufactured product)
  if (ok('factory')) UAE.PRODUCTS.forEach(function (P) {
    if (!P.rec || P.src !== 'factory' || (UAE.inScope && !UAE.inScope(co, P.id))) return;
    var capU = P.rec.cap * 1.5 * 30, uc = UAE.invUnitCost(P.id), w = UAE.invWorld(co, P.id);
    var localPx = P.kind === 'consumer' ? UAE.importBase(P.id) * 0.97 : UAE.wholesalePrice(P.id), localU = 0;
    if (P.kind === 'consumer') localU = UAE.invUaeOpen(P.id).bg * 30 * 0.25 / (1 + UAE.invProducers(P.id));   // a quarter of the background sellers' sales, shared with existing UAE factories
    else { var wk = S.wmkt && S.wmkt[P.id]; if (wk) localU = Math.max(0, (wk.used || 0) - (wk.made || 0)) * 30; }   // UAE shortage
    var worldU = w ? w.unmetM / w.base : 0;
    var uW = Math.min(capU, worldU), uL = Math.min(capU - uW, localU), units = uW + uL;
    if (units <= 0) return;
    var rev = uW * (w ? w.price : 0) + uL * localPx, varC = units * uc, fixed = UAE.invFixedM('factory', hq);
    var need = w && worldU > capU ? Math.min(5, Math.ceil(worldU / capU)) : 1;
    push({ type: 'factory', pid: P.id, group: 'industry', invest: UAE.invBuildCost('factory'), revM: rev, varM: varC, fixedM: fixed, profitM: rev - varC - fixed,
      margin: (rev - varC) / rev, nec: UAE.invNecessity(P), share: w ? w.share : null, demandM: (w ? w.unmetM : 0) + localU * localPx, need: need,
      why: 'margin ' + Math.round((rev - varC) / rev * 100) + '% (unit cost ' + A(uc) + ' vs price ' + A(rev / units) + ')' +
        (w && w.credible ? ', unmet world demand ' + A(w.unmetM) + '/mo at tech index ' + w.g.toFixed(0) + ' vs leader ' + w.F.toFixed(0) : w ? ', no exports yet (tech ' + w.g.toFixed(0) + ' vs leader ' + w.F.toFixed(0) + ': research first)' : '') +
        (localU ? ', UAE demand open ' + A(localU * localPx) + '/mo' : '') + ', necessity ' + Math.round(UAE.invNecessity(P) * 100) + '%' });
  });
  // 2 software titles with a world market the company does not publish yet
  if (ok('software')) Object.keys(UAE.WM || {}).forEach(function (pid) {
    var P = UAE.P[pid], M = UAE.WM[pid]; if (!P || P.kind !== 'software' || M.subs || (UAE.inScope && !UAE.inScope(co, pid))) return;
    if (UAE.firmsOf(co.id).some(function (f) { return f.type === 'software' && f.lines.length && f.lines[0].pid === pid; })) return;
    var w = UAE.invWorld(co, pid); if (!w) return;
    var rev = w.demandM * w.price / w.base, varC = rev * 0.03 * P.imp / Math.max(1, P.ref), fixed = UAE.invFixedM('software', hq) + UAE.WORLD.rndPct * UAE.wmSize(pid) / 12;
    push({ type: 'software', pid: pid, group: 'tech', invest: UAE.invBuildCost('software'), revM: rev, varM: varC, fixedM: fixed, profitM: rev - varC - fixed, margin: (rev - varC) / Math.max(1, rev),
      nec: UAE.invNecessity(P), share: w.share, demandM: w.demandM,
      why: 'world market ' + A(UAE.wmSize(pid)) + '/yr, ' + (w.share * 100).toFixed(2) + '% share once global reach is built, ~97% gross margin, R&D programme ' + A(UAE.WORLD.rndPct * UAE.wmSize(pid) / 12) + '/mo' });
  });
  // 3 a store selling the best UAE consumer products
  if (ok('retail')) {
    var lines = UAE.PRODUCTS.filter(function (P) { return P.perCap && P.kind === 'consumer' && P.ref && (!UAE.inScope || UAE.inScope(co, P.id)); }).map(function (P) {
      var own = UAE.firmsOf(co.id).some(function (f) { return f.type === 'factory' && f.lines.some(function (l) { return l.pid === P.id; }); });
      var cost = own ? UAE.invUnitCost(P.id) : UAE.invLanded(P.id), net = P.ref / (1 + vat), o = UAE.invUaeOpen(P.id);
      var u = Math.min(P.cap * 30, o.bg * 30 * 0.03);
      return { P: P, profit: u * (net - cost), rev: u * net, nec: UAE.invNecessity(P), own: own };
    }).filter(function (x) { return x.profit > 0; }).sort(function (a, b) { return b.profit * (0.6 + 0.4 * b.nec) - a.profit * (0.6 + 0.4 * a.nec); }).slice(0, UAE.FIRM_TYPES.retail.lines || 4);
    if (lines.length) {
      var rv = 0, pf = 0, nc = 0; lines.forEach(function (x) { rv += x.rev; pf += x.profit; nc += x.nec / lines.length; });
      var fx = UAE.invFixedM('retail', hq);
      push({ type: 'retail', pid: null, group: 'retail', invest: UAE.invBuildCost('retail'), revM: rv, varM: rv - pf, fixedM: fx, profitM: pf - fx, margin: pf / rv, nec: nc, demandM: rv,
        why: 'store selling ' + lines.map(function (x) { return x.P.name + (x.own ? ' (own factory)' : ''); }).join(', ') + ' - open UAE demand, avg necessity ' + Math.round(nc * 100) + '%' });
    }
  }
  // 4 other businesses: what such a firm really earns in the game economy today
  UAE.INV_BUSINESS.forEach(function (b) {
    var t = b[0]; if (!ok(t)) return;
    if (t === 'bankbranch' && !UAE.firmsOf(co.id).some(function (f) { return f.type === 'bankhq'; })) return;
    if (t === 'insoffice' && !UAE.firmsOf(co.id).some(function (f) { return f.type === 'inshq'; })) return;
    var st = UAE.invTypeStats(t); if (st.n < 3) return;
    var pool = ['tv', 'radio', 'newspaper', 'telecom', 'logistics'].indexOf(t) >= 0 ? st.n / (st.n + 1) : 1;   // shares a fixed pool with rivals
    var media = ['tv', 'radio', 'newspaper'].indexOf(t) >= 0, own = media ? UAE.invOwnAdShare(co) : 0;
    var p = st.rev * pool * (1 - own) - (st.rev - st.profit);                                       // media: your own group's ads just move money in a circle
    push({ type: t, pid: null, group: 'business', invest: UAE.invBuildCost(t), revM: st.rev * pool, varM: 0, fixedM: st.rev * pool - p, profitM: p, margin: st.rev ? p / st.rev : 0, nec: b[1], demandM: st.rev,
      why: 'the ' + st.n + ' open ' + UAE.FIRM_TYPES[t].name + 's in the UAE earn ' + A(st.profit) + '/mo on ' + A(st.rev) + ' revenue' + (pool < 1 ? ' (one more shares the same pool)' : '') +
        (own > 0.01 ? '; ' + Math.round(own * 100) + '% of that ad money is your own group\'s, which is not new profit' : '') });
  });
  ['ecommerce', 'delivery', 'streaming', 'search', 'social'].forEach(function (m) {
    if (!ok('internet')) return;
    var st = UAE.invTypeStats('internet', m); if (st.n < 3) return;
    var p = st.profit * st.n / (st.n + 1);
    push({ type: 'internet', pid: m, group: 'business', invest: UAE.invBuildCost('internet'), revM: st.rev, varM: 0, fixedM: st.rev - p, profitM: p, margin: st.rev ? p / st.rev : 0, nec: 0.5, demandM: st.rev,
      why: st.n + ' ' + m + ' platforms earn ' + A(st.profit) + '/mo each' + (m === 'ecommerce' ? ' (plus world e-commerce with platform technology)' : '') });
  });
  // 5 R&D centres: the tech-lead bonus for products the company already sells abroad
  if (ok('rnd')) Object.keys(UAE.WM || {}).forEach(function (pid) {
    var st = S.world2 && S.world2[pid], me = st && st.cos[co.id]; if (!me || !(me.rev > 0) || UAE.WM[pid].subs) return;
    var n = UAE.rndTeams(co, pid), gain = UAE.gtechGain(co, pid) * (Math.pow(n + 1, 0.3) - Math.pow(n, 0.3));   // extra index per ~90-day cycle
    var dgYear = gain * 4, worldProfitM = me.rev * 30 * 0.5;
    var bonusM = worldProfitM * (Math.exp(dgYear / 2 * (1 / 10 + 1 / 25)) - 1);                               // more share + pricing power, average over the year
    var costM = UAE.invFixedM('rnd', hq) + UAE.WORLD.rndPct * UAE.wmSize(pid) * Math.pow(n + 1, -0.7) / 3;
    push({ type: 'rnd', pid: pid, group: 'rnd', invest: UAE.invBuildCost('rnd'), revM: bonusM, varM: 0, fixedM: costM, profitM: bonusM - costM, margin: (bonusM - costM) / Math.max(1, bonusM), nec: 0.7,
      share: me.share, demandM: me.rev * 30,
      why: 'R&D loses ' + A(costM) + '/mo on its own, but +' + dgYear.toFixed(1) + ' world tech index a year (now ' + UAE.gtech(co, pid).toFixed(0) + ' vs leader ' + UAE.wmFrontier(pid).toFixed(0) +
        ') lifts world share & price power: about +' + A(bonusM) + '/mo profit on ' + A(me.rev * 30) + '/mo exports' });
  });
  // 6 market entry: world markets the company is not in yet and is too far behind for - open an R&D centre to catch up
  if (ok('rnd')) UAE.invEntryCandidates(co, hq).forEach(function (c) {
    var maxPay = UAE.invDeep(co, c.invest) ? 120 : I.hurdleMonths + 12;              // deep pockets: strategic markets may take up to 10 years to pay back
    c.ret = c.profitM * 12 / c.invest;
    if (!(c.profitM > 0) || c.payback > maxPay || c.ret < UAE.invCostOfCapital(co)) return;
    c.score = c.profitM * (0.75 + 0.25 * c.nec) * (0.8 + 0.4 * Math.min(1, Math.max(0, c.margin) / 0.5)) / (1 + c.payback / 24);
    out.push(c);
  });
  out.sort(function (a, b) { return b.score - a.score; });
  co.invA = { day: S.day, list: out.slice(0, I.keep), considered: out.length };
  return co.invA;
};

/** Log of the CEO's expansion decisions (with the reason). */
UAE.invLog = function (co, f, c, upgraded) {
  co.expLog = co.expLog || [];
  if (!f) { if (co.expLog[0] && co.expLog[0].skip && UAE.S.day - co.expLog[0].day < 30) return; co.expLog.unshift({ day: UAE.S.day, skip: true, why: 'No project passes the hurdle (positive profit, payback under ' + UAE.INVEST.hurdleMonths + ' months, within 25% of cash) - cash kept.' }); }
  else co.expLog.unshift({ day: UAE.S.day, firm: f.name + (upgraded ? ' (upgraded to size ' + f.size + ')' : ''), fid: f.id, type: c.type, pid: c.pid, invest: upgraded ? UAE.BUILD[f.type][0] * 0.9 : c.invest, profitM: c.profitM, payback: c.payback, margin: c.margin, why: c.why, up: !!upgraded });
  if (co.expLog.length > 80) co.expLog.length = 80;
  if (f && UAE.isHuman(co)) UAE.news('🧮 ' + ((UAE.person(co.ceo) || {}).name || 'CEO') + ' (' + co.name + ') ' + (upgraded ? 'upgrades ' + f.name + ' to size ' + f.size : 'opens ' + f.name) + ': ' + c.why + ' - payback ' + c.payback.toFixed(0) + ' months.', 'firm');
};
/** Best project the company can afford now (group optional). */
UAE.invPick = function (co, group) {
  var A = UAE.investAnalysis(co);
  var B = UAE.invBudget(co), k = UAE.invCostOfCapital(co);
  return A.list.find(function (c) {
    if (c.done || (group && c.group !== group)) return false;
    var spend = c.entry ? UAE.invBuildCost('rnd') : c.invest;                       // entry: only the labs are built now; R&D is paid as it runs
    return spend <= B.cash || (spend <= B.total && (c.ret || 0) > k + 0.02);       // borrow only when the project earns more than the loan costs
  }) || null;
};
UAE.INVEST.maxPlantSize = 20;
UAE.invBuild = function (co, c, instant) {
  // financial leverage: borrow the part of the build cost above the cash budget (5-year loan)
  var spend = c.type === 'factory' && c.pid ? UAE.BUILD.factory[0] * 0.9 : UAE.invBuildCost(c.type), B = UAE.invBudget(co);
  if (spend > B.cash && UAE.takeLoan) {
    var r = UAE.takeLoan(co, Math.min(spend - B.cash + 1e6, B.debt), false, { years: 5, by: 'ceo-invest' });
    if (r && r.ok) { co.expLog = co.expLog || []; co.expLog.unshift({ day: UAE.S.day, skip: true, why: 'Borrowed ' + UAE.fmt.aed(spend - B.cash) + ' at ' + (r.rate * 100).toFixed(2) + '% for 5 years to fund ' + UAE.shortProduct(c.pid || '') + ' ' + c.type + ' - it returns ' + Math.round((c.ret || 0) * 100) + '% a year.' }); }
  }
  if (c.type === 'factory' && c.pid) {                       // upgrade the smallest own plant making this product first
    var plant = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'factory' && g.status === 'open' && g.size < UAE.INVEST.maxPlantSize && g.lines.some(function (l) { return l.pid === c.pid; }); })
      .sort(function (a, b) { return a.size - b.size; })[0];
    if (plant && UAE.expandFirm(plant)) {
      c.built = (c.built || 0) + 1; if (c.built >= (c.need || 1)) c.done = true;
      UAE.nameSync(plant); UAE.invLog(co, plant, c, true); return plant;
    }
  }
  var f = UAE.buildFor(co, c.type, c.pid, instant);
  if (f && c.entry) { f.entryFor = c.pid; f.target = c.pid; f.autoResearch = true; if (co.bs.cash > UAE.researchQuote(f, c.pid).cost * 0.5) UAE.startResearch(f, c.pid); }
  if (f) UAE.nameSync(f);
  if (f) { c.built = (c.built || 0) + 1; if (c.built >= (c.need || 1)) c.done = true; UAE.invLog(co, f, c); if (UAE._idx) UAE._idx.invProd = null; }
  else c.done = true;
  return f;
};

/* The CEO's expansion goes through the analysis: the best-scoring project first; nothing if nothing pays. */
UAE.AI._expandPreInvest = UAE.AI._expandPreInvest || UAE.AI.expand;
UAE.AI.expand = function (co, instant) {
  if (co.foreign) return null;
  for (var tries = 0; tries < 3; tries++) {
    var c = UAE.invPick(co); if (!c) break;
    var f = UAE.invBuild(co, c, instant); if (f) return f;
  }
  UAE.invLog(co, null, null);
  return null;
};
/* "Venture into other businesses": the best non-tech business by the same analysis. */
UAE.diversify = function (co) {
  var c = UAE.invPick(co, 'business') || UAE.invPick(co, 'retail');
  return c ? UAE.invBuild(co, c) : UAE.AI.expand(co);
};

/* ============================================================================
 * FIRM NAMES SAY WHAT THE FIRM MAKES OR DOES
 * "Realm Li-ion Battery Module Plant · Dubai South", "Realm Cyber Security Suite R&D Labs · Dubai Silicon Oasis",
 * "Realm Cinema · Dubai Marina", "Realm E-commerce Platform · Business Bay".
 * Firms named automatically (old pattern "Realm Plant Dubai South") are renamed; names you typed are never changed.
 * ==========================================================================*/
UAE.INET_LABEL = { ecommerce: 'E-commerce Platform', delivery: 'Food Delivery App', search: 'Search Portal', social: 'Social Network', streaming: 'Streaming Service' };
UAE.shortProduct = function (pid) { var P = UAE.P[pid]; return P ? P.name.replace(/\s*\(.*\)\s*$/, '').replace(/\s+\d+(x\d+(\.\d+)?)?(ml|L|g|kg|m2)?$/i, '') : pid; };
/** What a firm makes or does, in words. */
UAE.firmWhat = function (f) {
  var T = UAE.FIRM_TYPES[f.type], k = T.kind, L = f.lines || [];
  var prod = L.length ? UAE.shortProduct(L[0].pid) + (L.length > 1 ? ' & more' : '') : '';
  if (f.type === 'factory') return (prod || 'Manufacturing') + ' Plant';
  if (f.type === 'software') return (L.length ? UAE.shortProduct(L[0].pid) : 'Software') + ' Studio';
  if (f.type === 'rnd') return (f.target ? UAE.shortProduct(f.target) + ' ' : '') + 'R&D Labs';
  if (f.type === 'internet') return UAE.INET_LABEL[f.model] || 'Online Platform';
  if (f.type === 'service') return (UAE.SERVICES && UAE.SERVICES[f.svc] ? UAE.SERVICES[f.svc].name : 'Services');
  if (f.type === 'retail') { var P = L.length && UAE.P[L[0].pid]; return P ? P.cls + ' Store' : 'Store'; }
  if (f.type === 'farm' || f.type === 'mine' || f.type === 'oilwell') return (prod ? prod + ' ' : '') + ({ farm: 'Farm', mine: 'Quarry', oilwell: 'Field' }[f.type]);
  if (f.type === 'datacenter') return 'AI Cloud Data Centre';
  if (f.type === 'warehouse') return (prod ? prod + ' ' : '') + 'Distribution Centre';
  return T.name;
};
/** The automatic name: brand + what it does + place. */
UAE.autoName = function (f) {
  var co = UAE.co(f.owner), d = UAE.geo.district(f.district), place = d ? d.name.split(/[\/(]/)[0].trim() : UAE.CITIES[f.city].name;
  return co.name.split(' ')[0] + ' ' + UAE.firmWhat(f) + ' · ' + place;
};
/** Was this name generated by the game (old pattern or new)? Names typed by the player are left alone. */
UAE.isAutoName = function (f) {
  if (f.autoNamed) return true;
  var co = UAE.co(f.owner), d = UAE.geo.district(f.district); if (!co || !d || !UAE.AI.firmName) return false;
  var old = UAE.AI.firmName(co, f.type, d);
  return f.name === old || f.name.replace(/\s+/g, ' ') === old.replace(/\s+/g, ' ') || f.name === co.name + ' ' + UAE.FIRM_TYPES[f.type].name;
};
UAE.nameSync = function (f) {
  if (!f || f.seed || f.type === 'hq' || f.type === 'mansion' || f.type === 'bankhq' || f.type === 'inshq' || !UAE.isAutoName(f)) return;
  var n = UAE.autoName(f); if (n !== f.name) f.name = n; f.autoNamed = true;
};
UAE.nameSyncAll = function () { for (var k in UAE.S.firms) UAE.nameSync(UAE.S.firms[k]); };

/** Entry R&D: for each world market the company does not serve and is > 30 index points behind in, estimate the
 * catch-up (projects and months), the R&D cost of getting there and the monthly profit once it can sell. */
UAE.invEntryCandidates = function (co, hq) {
  var S = UAE.S, out = [], act = UAE.wmActive(), A = UAE.invFmt;
  Object.keys(UAE.WM || {}).forEach(function (pid) {
    var M = UAE.WM[pid], P = UAE.P[pid]; if (!P || M.subs || (UAE.inScope && !UAE.inScope(co, pid))) return;
    if (act[pid] && act[pid][co.id]) return;                                            // already making, selling or researching it
    var group = UAE.invGroup(co);
    if (act[pid] && group.some(function (c) { return act[pid][c.id]; })) return;       // a sister company is already in this market
    var bestCo = group.concat([co]).sort(function (a, b) { return (UAE.gtech(b, pid) - UAE.gtech(a, pid)) || (b.bs.cash - a.bs.cash); })[0];
    if (bestCo !== co) return;                                                           // the group enters through its best-placed company
    var type = M.ecom ? 'internet' : P.kind === 'software' ? 'software' : 'factory';
    if (UAE.allowedTypes && UAE.allowedTypes(co).indexOf(type) < 0) return;
    var F = UAE.wmFrontier(pid), g = UAE.gtech(co, pid), target = type === 'factory' ? Math.max(F - 20, UAE.wmAverage(pid)) : F - 20;
    if (g >= F - 30) return;                                                           // close enough: the normal analysis launches it
    // catch-up with one new lab (fast follower: bigger jumps when far behind); the leaders keep moving
    var labs = co.bs.cash > UAE.WORLD.rndPct * UAE.wmSize(pid) * 40 ? 3 : 1, boost = Math.pow(labs, 0.3);   // deep pockets: 3 labs in parallel
    var gg = g, cycles = 0; while (gg < target && cycles < 40) { gg += (3 + 0.25 * Math.max(0, F + cycles * 0.75 - gg)) * boost; cycles++; }
    var months = cycles * 3, rcost = (UAE.WORLD.rndPct * UAE.wmSize(pid) * boost * cycles) + UAE.invFixedM('rnd', hq) * months * labs;
    // profit once launched at target index (world share with reach built up)
    var reach = UAE.INVEST.reachPlan, lead = 0, oth = 1; M.leaders.forEach(function (L) { lead += L[4] * Math.exp((UAE.leaderIdx(L) - F) / 10); oth -= L[4]; });
    lead += Math.max(0, oth) * Math.exp(-2);
    var Aco = reach * Math.pow(UAE.wmBrand(co, pid), M.brandPow || 1) * Math.exp((target - F) / 10), share = Math.min(UAE.WORLD.maxShare, Aco / (lead + Aco));
    var base = UAE.wmBase(pid), price = base * Math.max(0.5, Math.min(2.2, Math.exp((target - UAE.wmAverage(pid)) / 25))), W = UAE.wmSize(pid), profitM, margin, launch;
    if (type === 'factory') {
      var uc = UAE.invUnitCost(pid); if (price <= uc * 1.1) return;
      // once competitive the CEO builds as many plants as the world demand supports (max 20)
      var capU = P.rec ? P.rec.cap * 1.5 * 30 : 0, demandU = share * W / 12 / base, plants = capU > 0 ? Math.max(1, Math.min(20, Math.ceil(demandU / capU))) : 0;
      var units = Math.min(capU * plants, demandU);
      profitM = units * (price - uc) - UAE.invFixedM('factory', hq) * plants; margin = (price - uc) / price; launch = UAE.invBuildCost('factory') * plants;
    } else {
      var rev = share * W / 12 * price / base; profitM = rev * 0.97 - UAE.invFixedM(type, hq) - UAE.WORLD.rndPct * W / 12; margin = 0.9; launch = UAE.invBuildCost(type);
    }
    if (!(profitM > 0)) return;
    var invest = UAE.invBuildCost('rnd') * labs + launch + rcost, payback = months + invest / profitM;
    if (invest > Math.max(0, co.bs.cash) + UAE.invBudget(co).debt) return;                   // cannot fund the whole programme: not an option for this company
    out.push({ type: 'rnd', pid: pid, group: 'entry', invest: invest, need: labs, revM: profitM, varM: 0, fixedM: rcost / Math.max(1, months), profitM: profitM, margin: margin, nec: UAE.invNecessity(P),
      share: share, demandM: share * W / 12, payback: payback, entry: true, months: months,
      why: 'ENTER ' + UAE.shortProduct(pid) + ': tech ' + g.toFixed(0) + ' vs leader ' + F.toFixed(0) + ' - too far behind to sell abroad, so research first with ' + labs + ' lab' + (labs > 1 ? 's in parallel' : '') + ': about ' + cycles + ' rounds (' + months + ' months, R&D ' + A(rcost) +
        ') to reach ' + target.toFixed(0) + ', then ~' + (share * 100).toFixed(2) + '% of a ' + A(W) + '/yr world market = ' + A(profitM) + '/mo profit' });
  });
  return out;
};

/** Sister companies: for your companies, every other company you control; for AI groups, parent / subsidiaries. */
UAE.invGroup = function (co) {
  return UAE.allCos().filter(function (c) {
    if (c === co || c.foreign || c.status === 'BANKRUPT') return false;
    if (UAE.isHuman(co)) return UAE.isHuman(c);
    return c.parent === co.id || co.parent === c.id || (co.parent && c.parent === co.parent);
  });
};
