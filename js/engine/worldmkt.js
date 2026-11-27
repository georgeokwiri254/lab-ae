/* ============================================================================
 * UAE CAPITALISM LAB  -  GOING GLOBAL: WORLD MARKETS & THE TECH RACE
 *
 *  World tech index (co.gtech[pid]): 100 = the world's best in 2026. The real leaders (data/worldtech.js) gain
 *  index points every year, so a company that stops researching falls behind. Research projects (R&D centres,
 *  software companies) add index points - more when you are far behind (fast follower), ~3 per project at the top.
 *
 *  World sales, daily, per product with a world market:
 *    attractiveness = global reach x brand x e^((your index - frontier) / 10)
 *    leaders' weight = their market share x e^((their index - frontier) / 10)
 *    your share     = your attractiveness / (leaders + all UAE challengers)
 *    price          = world price x e^((your index - world average) / 25)   (0.5x .. 2.2x: technology is pricing power)
 *  Goods (chips, devices, EVs, drugs) ship from factory stock, so factory capacity limits exports.
 *  Software sells licences worldwide (digital, no capacity limit). E-commerce earns marketplace revenue
 *  (take-rate + ads) minus fulfilment costs.
 *
 *  Global reach (co.reach[pid], 0-100%): distribution & customer base abroad. Starts at 5%, grows every month you
 *  sell a credible product abroad (faster with a strong brand), shrinks if you stop.
 *
 *  CEO / CTO: research what has the biggest (world gap x market size) - the race to beat the world leaders.
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});
UAE.WM = UAE.WORLD_MKT || {};
UAE.WORLD = { reach0: 0.05, reachUp: 0.05, reachDown: 0.04, maxShare: 0.6, rndPct: 0.004, others: 0.2 };

UAE.wmYears = function () { return UAE.S.day / 365; };
/** World market size for pid, AED / year (S-curve growth from the 2026 size). */
UAE.wmSize = function (pid) {
  var M = UAE.WM[pid]; if (!M || !M.size) return 0;
  return M.size * 1e9 * (UAE.capGrowth ? UAE.capGrowth(M.grow || 0, M.cap || 2, UAE.wmYears()) : 1);
};
/** A leader's world tech index today. */
UAE.leaderIdx = function (L) { return L[2] + L[3] * UAE.wmYears(); };
/** World frontier (best leader today) and the share-weighted world average index. */
UAE.wmFrontier = function (pid) {
  var M = UAE.WM[pid]; if (!M) return 100;
  return M.leaders.reduce(function (b, L) { return Math.max(b, UAE.leaderIdx(L)); }, 0);
};
UAE.wmAverage = function (pid) {
  var M = UAE.WM[pid], s = 0, w = 0; M.leaders.forEach(function (L) { s += L[4] * UAE.leaderIdx(L); w += L[4]; });
  return w ? s / w : UAE.wmFrontier(pid);
};
/** World price base per unit (AED) - goods: world / import price; software: licence ref price. */
UAE.wmBase = function (pid) { var P = UAE.P[pid]; return P.kind === 'software' ? P.ref : (P.world || P.imp || P.ref || 1); };

/** A company's world tech index for pid (set the first time it is needed from its UAE technology). */
UAE.gtech = function (co, pid) {
  co.gtech = co.gtech || {};
  if (co.gtech[pid] == null) {
    var t = (co.tech && co.tech[pid]) || 40, F = UAE.WM[pid] ? UAE.wmFrontier(pid) : 100;
    // a strong UAE player starts as a credible challenger ~15 points behind the world leader
    // UAE tech has no cap any more (can be 400+): only up to 100 counts here, so a newcomer starts at best ~15 behind the leader
    // and has to out-research it (before this, tech 465 put a brand-new subsidiary 200 points AHEAD of the world)
    co.gtech[pid] = Math.max(10, F - (UAE.isHuman(co) ? 15 : 25) - (100 - Math.min(100, t)) * 0.6);
    var par = co.parent && UAE.co(co.parent);             // a subsidiary copies its parent company’s technology (normal inside a group)
    if (par && par !== co && par.gtech && par.gtech[pid] != null) co.gtech[pid] = Math.max(co.gtech[pid], par.gtech[pid]);
  }
  return co.gtech[pid];
};
UAE.reach = function (co, pid) { co.reach = co.reach || {}; if (co.reach[pid] == null) co.reach[pid] = UAE.WORLD.reach0; return co.reach[pid]; };
/** World brand factor from the company's average UAE brand rating for the product (0.6 .. 1.3). */
UAE.wmBrand = function (co, pid) {
  var X = UAE._idx, key = co.id + '|' + pid;
  if (X && X.wmB && X.wmB[key] != null) return X.wmB[key];
  var b = 0, n = 0; Object.keys(UAE.S.cities).forEach(function (c) { b += UAE.brandRating(co, pid, c); n++; });
  var v = Math.pow(((n ? b / n : 20) + 15) / 45, 0.5);
  if (X) { X.wmB = X.wmB || {}; X.wmB[key] = v; }
  return v;
};
/** Research gain in world index points for one completed project (fast follower when far behind). */
UAE.gtechGain = function (co, pid) { var F = UAE.wmFrontier(pid), g = UAE.gtech(co, pid); return 3 + 0.25 * Math.max(0, F - g); };

/** Which of a company's firms sell pid abroad. */
UAE.wmSellers = function (pid, open) {
  var M = UAE.WM[pid], P = UAE.P[pid]; if (!M || M.subs || !P) return [];
  if (open._wmBy) return open._wmBy[pid] || [];
  if (M.ecom) return open.filter(function (f) { return f.type === 'internet' && f.model === 'ecommerce'; });
  if (P.kind === 'software') return open.filter(function (f) { return f.type === 'software' && f.lines.length && f.lines[0].pid === pid; });
  return open.filter(function (f) { return f.type === 'factory' && f.lines.some(function (l) { return l.pid === pid; }); });
};

/** Daily world sales for every product with a world market. */
UAE.worldDay = function (open) {
  var S = UAE.S; S.world2 = S.world2 || {};
  // sellers of every world product in one pass (factories by line, software by title, e-commerce platforms)
  var by = {}; open.forEach(function (f) {
    if (f.type === 'internet') { if (f.model === 'ecommerce') (by.ecom = by.ecom || []).push(f); return; }
    if (f.type === 'software') { if (f.lines.length && UAE.WM[f.lines[0].pid]) (by[f.lines[0].pid] = by[f.lines[0].pid] || []).push(f); return; }
    if (f.type === 'factory') { var seen = {}; f.lines.forEach(function (l) { if (UAE.WM[l.pid] && !seen[l.pid]) { seen[l.pid] = 1; (by[l.pid] = by[l.pid] || []).push(f); } }); }
  });
  open._wmBy = by;
  Object.keys(UAE.WM).forEach(function (pid) {
    var M = UAE.WM[pid]; if (M.subs) return;
    var firms = UAE.wmSellers(pid, open), W = UAE.wmSize(pid), F = UAE.wmFrontier(pid), avg = UAE.wmAverage(pid);
    var lead = 0, others = 1; M.leaders.forEach(function (L) { lead += L[4] * Math.exp((UAE.leaderIdx(L) - F) / 10); others -= L[4]; });
    lead += Math.max(0, others) * Math.exp(-UAE.WORLD.others * 100 / 10);     // the rest of the world, ~20 points behind
    var byCo = {};
    firms.forEach(function (f) { (byCo[f.owner] = byCo[f.owner] || []).push(f); });
    var cos = Object.keys(byCo).map(function (id) {
      var co = UAE.co(id), g = UAE.gtech(co, pid);
      return { co: co, firms: byCo[id], g: g, A: UAE.reach(co, pid) * Math.pow(UAE.wmBrand(co, pid), M.brandPow || 1) * Math.exp((g - F) / 10) };
    });
    var sum = lead + cos.reduce(function (s, x) { return s + x.A; }, 0);
    var st = S.world2[pid] = { day: S.day, W: W, F: F, avg: avg, lead: lead, sum: sum, cos: {} };
    var base = UAE.wmBase(pid), P = UAE.P[pid];
    cos.forEach(function (x) {
      var share = Math.min(UAE.WORLD.maxShare, x.A / sum), price = base * Math.max(0.5, Math.min(2.2, Math.exp((x.g - avg) / 25)));
      var rev = 0, units = 0, dayAED = share * W / 365;
      if (M.ecom) {
        // marketplace revenue split over the company's e-commerce firms by size; fulfilment, payments & servers ~62%
        var tot = x.firms.reduce(function (s, f) { return s + f.size; }, 0), logi = UAE.hasFirmIn(x.co.id, 'logistics') ? 0.55 : 0.62;
        x.firms.forEach(function (f) {
          var r = dayAED * f.size / tot; UAE.fIncome(f, 'revenue', r); UAE.fExpense(f, 'otherOpex', r * logi);
          f.worldRev = r; f.worldUsers = r * 365 / 600;                       // ~AED 600 marketplace revenue per active buyer a year (EST)
        });
        rev = dayAED; units = dayAED * 365 / 600;
      } else if (P.kind === 'software') {
        units = dayAED / base;
        var totS = x.firms.reduce(function (s, f) { return s + f.size * (f.eff || 1); }, 0);
        x.firms.forEach(function (f) {
          var u = units * f.size * (f.eff || 1) / totS, r = u * price;
          UAE.fIncome(f, 'revenue', r); UAE.fExpense(f, 'cogs', u * P.imp * (UAE.SW_UNIT_COST || 0.03));
          f.worldRev = r; f.worldUnits = u;
        });
        rev = units * price;
      } else {
        // goods: ship from factory stock, keeping ~3 days of output for UAE buyers and own factories
        var want = dayAED / base, gwCost = function (f) { var gw = UAE.geo.nearestGateway(f.c); return P.t * (gw.km * 1.25 + 3) * UAE.RULES.freightPerTonKm; };
        var exp = UAE.hasFirmIn(x.co.id, 'exporter') ? 1 : 0.95;
        var avail = x.firms.map(function (f) {
          var l = f.lines.find(function (y) { return y.pid === pid; }), s = f.stock[pid];
          var daily = l ? Math.max(1, l.made / Math.max(1, (S.day % 30) + 1)) : 1;
          var netPx = price * exp - gwCost(f);
          // Do not dump exports below unit manufacturing cost (hold stock until R&D lifts world pricing or sell locally)
          var ok = s && (netPx >= s.cost * 1.02 || (l && l.forceExport));
          return { f: f, l: l, q: ok ? Math.max(0, s.q - daily * 3) : 0, netPx: Math.max(0, netPx) };
        });
        var have = avail.reduce(function (s, a) { return s + a.q; }, 0), fill = have > 0 ? Math.min(1, want / have) : 0;
        avail.forEach(function (a) {
          var q = a.q * fill; if (q <= 0) return;
          var basis = UAE.stockTake(a.f, pid, q), r = q * a.netPx;
          UAE.fIncome(a.f, 'revenue', r); UAE.fCogs(a.f, basis);
          if (a.l) { a.l.exported = (a.l.exported || 0) + q; a.l.worldSold = q; }
          a.f.worldRev = r; S.cities[a.f.city].exportsM = (S.cities[a.f.city].exportsM || 0) + r;
          units += q; rev += r;
        });
        share = W > 0 ? units * base / (W / 365) : 0;                         // what actually shipped
      }
      var unitCost = 0, nc = 0; x.firms.forEach(function (f) { var s = f.stock[pid]; if (s && s.cost) { unitCost += s.cost; nc++; } });
      st.cos[x.co.id] = { share: share, g: x.g, A: x.A, price: price, units: units, rev: rev, reach: UAE.reach(x.co, pid),
        want: Math.min(UAE.WORLD.maxShare, x.A / sum) * W / 365, unitCost: nc ? unitCost / nc : 0 };
      var wm = x.co.worldM = x.co.worldM || {}; var r0 = wm[pid] = wm[pid] || { rev: 0, units: 0 }; r0.rev += rev; r0.units += units;
    });
  });
};

/** Which companies are really in each world market (make, publish, sell or research it) - one pass over all firms,
 *  cached per game day and firm count. */
UAE.wmActive = function () {
  var S = UAE.S, X = UAE._idx, n = S.nextId, C = UAE._wmAct;
  if (X && X.wmAct) return X.wmAct;
  if (!X && C && C.day === S.day && C.n === n && C.S === S) return C.by;
  var by = {};
  var add = function (pid, id) { if (UAE.WM[pid]) (by[pid] = by[pid] || {})[id] = 1; };
  for (var k in S.firms) {
    var f = S.firms[k]; if (f.status === 'closed') continue;
    if (f.type === 'factory' || f.type === 'software') f.lines.forEach(function (l) { add(l.pid, f.owner); });
    else if (f.type === 'rnd' && f.target) add(f.target, f.owner);
    else if (f.type === 'internet' && f.model === 'ecommerce') add('ecom', f.owner);
  }
  UAE._wmAct = { day: S.day, n: n, S: S, by: by }; if (X) X.wmAct = by;
  return by;
};
/** Standing of everyone in pid's world market: leaders + UAE companies, sorted by index. */
UAE.wmRanking = function (pid) {
  var M = UAE.WM[pid]; if (!M) return [];
  var st = UAE.S.world2 && UAE.S.world2[pid], rows = M.leaders.map(function (L) {
    return { name: L[0], flag: UAE.NATION_FLAG[L[1]] || L[1], idx: UAE.leaderIdx(L), share: L[4], leader: true };
  });
  UAE.allCos().forEach(function (co) {
    if (co.foreign || co.status === 'BANKRUPT') return;
    var act = UAE.wmActive()[pid], sells = st && st.cos[co.id], makes = sells || (act && act[co.id]);
    if (!makes) return;
    rows.push({ name: co.name, flag: '🇦🇪', idx: UAE.gtech(co, pid), share: sells ? sells.share : 0, co: co, human: UAE.isHuman(co), rev: sells ? sells.rev : 0 });
  });
  if (M.subs) UAE.wmSubsShares(pid, rows);            // AI models sell subscriptions (aistack.js subsDay), not shipped goods
  rows.sort(function (a, b) { return b.idx - a.idx; });
  rows.forEach(function (r, i) { r.rank = i + 1; });
  return rows;
};
/** Subscription markets (ai, llm): real share = the company's subscribers / world subscribers; the world labs share what is left. */
UAE.wmSubsShares = function (pid, rows) {
  var by = {}, rev = {}, px = {}, mk = 0, P = UAE.P[pid];
  UAE.allFirms().forEach(function (f) {
    if (f.type !== 'software' || f.status !== 'open' || UAE.swPid(f) !== pid || !f.subs) return;
    by[f.owner] = (by[f.owner] || 0) + f.subs; rev[f.owner] = (rev[f.owner] || 0) + f.subs * (f.subPrice || 0) / 30;
    if (f.subMarket > mk) mk = f.subMarket;
  });
  var tot = 0; Object.keys(by).forEach(function (k) { tot += by[k]; }); mk = Math.max(mk, tot, 1);
  var lead = 0; rows.forEach(function (r) { if (r.leader) lead += r.share; });
  rows.forEach(function (r) {
    if (r.leader) { r.share = lead > 0 ? r.share / lead * Math.max(0, 1 - tot / mk) : 0; return; }
    var n = by[r.co.id] || 0; r.share = n / mk; r.subs = n; r.subRev = rev[r.co.id] || 0; r.subPx = n && P && P.ref ? r.subRev * 30 / n / P.ref : 0;
  });
  UAE.allCos().forEach(function (co) {                  // companies selling subscriptions without a world-race entry
    if (!by[co.id] || rows.some(function (r) { return r.co && r.co.id === co.id; })) return;
    rows.push({ name: co.name, flag: '🇦🇪', idx: UAE.gtech(co, pid), share: by[co.id] / mk, co: co, human: UAE.isHuman(co), subs: by[co.id], subRev: rev[co.id] || 0, subPx: P && P.ref ? (rev[co.id] || 0) * 30 / by[co.id] / P.ref : 0 });
  });
  rows.subsMarket = mk;
};
/** Best UAE company (by index) of a group - the player's companies when human=true. */
UAE.wmBestUAE = function (pid, human) {
  return UAE.wmRanking(pid).filter(function (r) { return r.co && (!human || r.human); })[0] || null;
};
/** How much a company should want to research pid: world gap x market size (bigger, further behind = first). */
UAE.techPriority = function (co, pid) {
  var M = UAE.WM[pid]; if (!M) return null;
  var gap = UAE.wmFrontier(pid) + 5 - UAE.gtech(co, pid);                   // aim to lead by 5 points
  var size = M.subs ? 2000e9 : UAE.wmSize(pid);
  return Math.max(0, gap) * Math.sqrt(size / 1e9);
};

/** Monthly: global reach, milestones, world revenue history. */
UAE.worldMonth = function () {
  var S = UAE.S;
  UAE.allCos().forEach(function (co) {
    if (co.foreign) return;
    var wm = co.worldM || {}; co.worldLast = wm; co.worldM = {};
    Object.keys(UAE.WM).forEach(function (pid) {
      var st = S.world2 && S.world2[pid], me = st && st.cos[co.id];
      if (!co.reach || co.reach[pid] == null) { if (!me) return; }
      var r = UAE.reach(co, pid), F = UAE.wmFrontier(pid);
      if (me && me.units > 0) {
        var credible = UAE.gtech(co, pid) >= F - 30 ? 1 : 0.4;              // nobody abroad buys a product far behind
        co.reach[pid] = Math.min(1, r + UAE.WORLD.reachUp * credible * UAE.wmBrand(co, pid) * (1 - r));
      } else co.reach[pid] = Math.max(UAE.WORLD.reach0, r * (1 - UAE.WORLD.reachDown));
    });
  });
  // milestone news: overtaking a world leader (each product's ranking built once)
  Object.keys(UAE.WM).forEach(function (pid) {
    var rows = UAE.wmRanking(pid);
    rows.forEach(function (mine, i) {
      var co = mine.co; if (!co) return;
      co.wmRank = co.wmRank || {};
      var old = co.wmRank[pid]; co.wmRank[pid] = mine.rank;
      if (old && mine.rank < old) {
        var passed = rows[i + 1];                                   // the one now right behind
        if (passed && passed.leader) UAE.news('🌍 ' + co.name + ' overtakes ' + passed.name + ' in ' + UAE.P[pid].name + ' - now #' + mine.rank + ' in the world (tech index ' + mine.idx.toFixed(1) + ').', UAE.isHuman(co) ? 'firm' : 'ai');
      }
    });
  });
};

/** CEO / CTO tech race (monthly): keep R&D centres on the products with the biggest world gap x market. */
UAE.ceoTechRace = function (co) {
  if (co.foreign || co.status === 'BANKRUPT') return;
  var human = UAE.isHuman(co), delegated = human && co.ceoAuto && UAE.person(co.ceo) && !UAE.person(co.ceo).isPlayer;
  if (human && !delegated && !(co.cto && UAE.policy(co).ctoAuto !== false)) return;    // your own decisions
  var mine = {};
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status !== 'open') return;
    if (f.type === 'internet' && f.model === 'ecommerce') mine.ecom = 1;
    f.lines.forEach(function (l) { if (UAE.WM[l.pid]) mine[l.pid] = 1; });
  });
  // entry markets the company is researching from scratch count too (R&D first, launch later)
  UAE.firmsOf(co.id).forEach(function (f) { if (f.type === 'rnd' && f.target && UAE.WM[f.target] && UAE.P[f.target].kind === 'software') mine[f.target] = 1; });
  var cand = Object.keys(mine).filter(function (pid) { return UAE.P[pid].kind !== 'software' || (UAE.SUBS && UAE.SUBS[pid]) || !UAE.firmsOf(co.id).some(function (f) { return f.type === 'software' && f.lines.length && f.lines[0].pid === pid; }); })
    .map(function (pid) { return { pid: pid, p: UAE.techPriority(co, pid) }; }).filter(function (x) { return x.p > 0; })
    .sort(function (a, b) { return b.p - a.p; });
  if (!cand.length) return;
  var used = {};
  UAE.firmsOf(co.id).forEach(function (f) { if (f.project) used[f.project.pid] = (used[f.project.pid] || 0) + 1; });
  UAE.firmsOf(co.id).forEach(function (f) {
    if (!f.entryFor) return;
    var launched = UAE.firmsOf(co.id).some(function (g) { return (g.type === 'factory' || g.type === 'software') && g.lines.some(function (l) { return l.pid === f.entryFor; }); }) ||
      (f.entryFor === 'ecom' && UAE.firmsOf(co.id).some(function (g) { return g.type === 'internet' && g.model === 'ecommerce'; }));
    if (launched) delete f.entryFor;                                                    // entered the market: normal R&D planning from now on
    else if (!f.project && co.bs.cash > UAE.researchQuote(f, f.entryFor).cost * 0.5) { f.target = f.entryFor; UAE.startResearch(f, f.entryFor); }
  });
  var idle = !human && UAE.rndOverBudget(co) ? [] : UAE.firmsOf(co.id).filter(function (f) { return f.type === 'rnd' && f.status === 'open' && !f.project && !f.entryFor && !f.futFor; });   // computer-run: no new projects over budget
  if (idle.length) {
    // Spread labs across all lagging world products, capped at MAX_AUTO_RND active teams per product so
    // hundreds of labs don't pile duplicate multi-billion projects onto the same product.
    var assigned = [], capOf = {};
    cand.forEach(function (x) { capOf[x.pid] = UAE.rndTeamCap(co, x.pid); });   // more teams where the gap is big and cash allows
    idle.forEach(function (f) {
      var pick = null;
      for (var round = 0; round < 16 && !pick; round++) {
        var c = cand.find(function (x) { return (used[x.pid] || 0) <= round && (used[x.pid] || 0) < capOf[x.pid]; });
        if (c) pick = c.pid;
      }
      if (!pick) return;
      used[pick] = (used[pick] || 0) + 1;
      f.target = pick; f.autoResearch = true; assigned.push(f);
    });
    if (assigned.length) {
      if (UAE._idx) UAE._idx.rndT = null;                 // refresh team counts before quoting parallel R&D budgets
      assigned.forEach(function (f) {
        if (co.bs.cash > UAE.researchQuote(f, f.target).cost * 0.5) UAE.startResearch(f, f.target);
      });
    }
  }
  // not enough labs for the teams the gaps call for: the CEO opens more R&D centres (up to 8 a month)
  if ((!human || delegated) && co.bs.cash > 1e11 && UAE.buildFor && (human || !UAE.rndOverBudget(co))) {
    var short = [], nNew = 0;
    cand.slice(0, 10).forEach(function (x) { var want = UAE.rndTeamCap(co, x.pid) - (used[x.pid] || 0); for (var q = 0; q < want; q++) short.push(x.pid); });
    for (var s2 = 0; s2 < short.length && nNew < 8; s2++) {
      var lab = UAE.buildFor(co, 'rnd', short[s2]); if (!lab) break;
      nNew++; lab.target = short[s2]; lab.autoResearch = true; used[short[s2]] = (used[short[s2]] || 0) + 1;
      if (co.bs.cash > UAE.researchQuote(lab, short[s2]).cost * 0.5) UAE.startResearch(lab, short[s2]);
    }
    if (nNew && human) UAE.news('🧪 ' + co.name + ' (CEO) opens ' + nNew + ' new R&D centre' + (nNew > 1 ? 's' : '') + ' to close the gap to the world leaders.', 'firm');
  }
  // own cloud for own AI labs: owning a server is ~27% cheaper than renting compute
  if ((!human || delegated) && UAE.ceoComputePlan) UAE.ceoComputePlan(co);
  // export capacity: the world wants more than the factories can make (and it pays) -> build more factories
  if (!human || delegated) UAE.ceoExportCapacity(co);
  // no R&D centre yet but selling to the world: the CEO opens one (AI companies / CEO-run)
  if (!idle.length && !UAE.firmsOf(co.id).some(function (f) { return f.type === 'rnd'; }) && co.bs.cash > 5e9 && UAE.buildFor && (!human || delegated))
    UAE.buildFor(co, 'rnd', cand[0].pid);
};

/** CEO: build factories where world demand for the company's product is well above what it ships (max 3 a month). */
UAE.ceoExportCapacity = function (co) {
  var S = UAE.S, gaps = [];
  Object.keys(UAE.WM).forEach(function (pid) {
    var M = UAE.WM[pid], P = UAE.P[pid]; if (M.subs || M.ecom || P.kind === 'software' || !P.rec) return;
    var me = S.world2 && S.world2[pid] && S.world2[pid].cos[co.id]; if (!me || !me.want) return;
    var shipped = me.units * UAE.wmBase(pid), gap = me.want - shipped;
    if (gap < me.want * 0.4 || (me.unitCost && me.price < me.unitCost * 1.15)) return;     // enough capacity, or not profitable
    var perFactory = P.rec.cap * 1.5 * UAE.wmBase(pid);                                     // one new factory line, AED / day
    gaps.push({ pid: pid, gap: gap, n: Math.ceil(gap / perFactory) });
  });
  gaps.sort(function (a, b) { return b.gap - a.gap; });
  var pol = UAE.policy(co), lim = Math.max(3, Math.ceil((pol.maxNewPerMonth || 0) / 2)), built = 0;   // follows the "new firms per month" slider
  for (var i = 0; i < gaps.length && built < lim; i++) {
    // upgrade this product's existing plants first (cheaper than a new site), then build new ones
    var plants = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'factory' && g.status === 'open' && g.size < 20 && g.lines.some(function (l) { return l.pid === gaps[i].pid; }); })
      .sort(function (a, b) { return a.size - b.size; });
    for (var u = 0; u < plants.length && gaps[i].n > 0 && built < lim; u++) if (UAE.expandFirm(plants[u])) { gaps[i].n--; built++; }
    for (var k = 0; k < gaps[i].n && built < lim; k++) {
      var f = UAE.buildFor(co, 'factory', gaps[i].pid); if (!f) return;
      built++; UAE.news('🌍 ' + co.name + ' opens ' + f.name + ' to export ' + UAE.P[gaps[i].pid].name + ' - world demand ' + UAE.fmt.aed(gaps[i].gap * 30) + '/month more than it can ship.', UAE.isHuman(co) ? 'firm' : 'ai');
    }
  }
};

/** Every world market with YOUR standing (all your companies together): size, growth, your share and rank, the
 *  biggest rival, your best tech vs the frontier, revenue not captured yet, and how involved you are
 *  ('none' | 'research' | 'low' (<1%) | 'in'). Used by Product Details -> Market overview and the AI fact sheet. */
UAE.wmOverview = function () {
  var act = UAE.wmActive(), mine = UAE.allCos().filter(function (c) { return UAE.isHuman(c) && !c.foreign && c.status !== 'BANKRUPT'; }), ids = {};
  mine.forEach(function (c) { ids[c.id] = 1; });
  return Object.keys(UAE.WM || {}).filter(function (pid) { return UAE.P[pid] && UAE.wmSize(pid) > 0; }).map(function (pid) {
    var R = UAE.wmRanking(pid), my = 0, best = null, top = null, inv = false;
    R.forEach(function (r) {
      if (r.co && ids[r.co.id]) { my += r.share || 0; if (!best || r.idx > best.idx) best = r; }
      else if (!top || (r.share || 0) > (top.share || 0)) top = r;
    });
    Object.keys(act[pid] || {}).forEach(function (id) { if (ids[id]) inv = true; });
    var W = UAE.wmSize(pid), F = UAE.wmFrontier(pid);
    var tech = best ? best.idx : mine.reduce(function (m, c) { return Math.max(m, UAE.gtech(c, pid)); }, 0);
    var cap = Math.min(UAE.WORLD.maxShare || 0.5, Math.max(top ? top.share || 0 : 0, 0.05));
    return { pid: pid, W: W, grow: UAE.WM[pid].grow || 0, my: my, top: top, tech: tech, F: F, gap: Math.max(0, cap - my) * W / 12,
      status: !inv ? 'none' : my <= 0 ? 'research' : my < 0.01 ? 'low' : 'in', rank: best ? best.rank : null, n: R.length };
  });
};
