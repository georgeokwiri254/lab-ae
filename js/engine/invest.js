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
    if (c.payback > I.hurdleMonths) return;
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
    var rev = w.demandM * w.price / w.base, varC = rev * 0.03 * P.imp / Math.max(1, P.ref), fixed = UAE.invFixedM('software', hq) + UAE.WORLD.rndPct * UAE.wmSize(pid) / 3;
    push({ type: 'software', pid: pid, group: 'tech', invest: UAE.invBuildCost('software'), revM: rev, varM: varC, fixedM: fixed, profitM: rev - varC - fixed, margin: (rev - varC) / Math.max(1, rev),
      nec: UAE.invNecessity(P), share: w.share, demandM: w.demandM,
      why: 'world market ' + A(UAE.wmSize(pid)) + '/yr, ' + (w.share * 100).toFixed(2) + '% share once global reach is built, ~97% gross margin, R&D programme ' + A(UAE.WORLD.rndPct * UAE.wmSize(pid) / 3) + '/mo' });
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
  out.sort(function (a, b) { return b.score - a.score; });
  co.invA = { day: S.day, list: out.slice(0, I.keep), considered: out.length };
  return co.invA;
};

/** Log of the CEO's expansion decisions (with the reason). */
UAE.invLog = function (co, f, c, upgraded) {
  co.expLog = co.expLog || [];
  if (!f) { if (co.expLog[0] && co.expLog[0].skip && UAE.S.day - co.expLog[0].day < 30) return; co.expLog.unshift({ day: UAE.S.day, skip: true, why: 'No project passes the hurdle (positive profit, payback under ' + UAE.INVEST.hurdleMonths + ' months, within 25% of cash) - cash kept.' }); }
  else co.expLog.unshift({ day: UAE.S.day, firm: f.name + (upgraded ? ' (upgraded to size ' + f.size + ')' : ''), fid: f.id, type: c.type, pid: c.pid, invest: c.invest, profitM: c.profitM, payback: c.payback, margin: c.margin, why: c.why, up: !!upgraded });
  if (co.expLog.length > 80) co.expLog.length = 80;
  if (f && UAE.isHuman(co)) UAE.news('🧮 ' + ((UAE.person(co.ceo) || {}).name || 'CEO') + ' (' + co.name + ') ' + (upgraded ? 'upgrades ' + f.name + ' to size ' + f.size : 'opens ' + f.name) + ': ' + c.why + ' - payback ' + c.payback.toFixed(0) + ' months.', 'firm');
};
/** Best project the company can afford now (group optional). */
UAE.invPick = function (co, group) {
  var A = UAE.investAnalysis(co);
  return A.list.find(function (c) { return !c.done && (!group || c.group === group) && c.invest <= co.bs.cash * UAE.INVEST.cashPct; }) || null;
};
UAE.INVEST.maxPlantSize = 20;
UAE.invBuild = function (co, c, instant) {
  if (c.type === 'factory' && c.pid) {                       // upgrade the smallest own plant making this product first
    var plant = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'factory' && g.status === 'open' && g.size < UAE.INVEST.maxPlantSize && g.lines.some(function (l) { return l.pid === c.pid; }); })
      .sort(function (a, b) { return a.size - b.size; })[0];
    if (plant && UAE.expandFirm(plant)) {
      c.built = (c.built || 0) + 1; if (c.built >= (c.need || 1)) c.done = true;
      UAE.invLog(co, plant, c, true); return plant;
    }
  }
  var f = UAE.buildFor(co, c.type, c.pid, instant);
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
