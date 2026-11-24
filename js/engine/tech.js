/* ============================================================================
 * UAE CAPITALISM LAB  -  SOFTWARE COMPANIES & R&D RESEARCH PROJECTS
 *
 *  Software company (B18)
 *   - Develops ONE software title (Operating System, AI Assistant, Office ...).
 *   - Its quality is the company's technology level for that title.
 *   - Licences have no raw materials: each one costs ~3% of the import price to
 *     deliver (cloud, payments, support). The firm keeps a licence stock that
 *     retail stores and device factories can buy from (pick it as supplier).
 *   - It also sells ONLINE DIRECT to UAE consumers (30% of national demand is an
 *     online channel shared with global vendors) and B2B enterprise licences.
 *
 *  Research projects (R&D centre B02 for any product, software company for its title)
 *   - "Research next model": a fixed budget spent over N days, then technology
 *     jumps and the product's model generation goes up (Gen 3 -> Gen 4, v2.0 -> v3.0).
 *   - Running cost is booked daily as R&D expense; the project pauses if cash runs out.
 * Engine only - no DOM access.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.SW_ONLINE_SHARE = 0.30;     // SYN share of consumer software demand bought online direct
UAE.SW_GLOBAL_VENDORS = 3;      // SYN attraction weight of global vendors (imports) in the online channel
UAE.SW_UNIT_COST = 0.03;        // SYN delivery cost per licence as a share of import price

/** Software title a software firm develops (migrates v1.1 saves that only had swClass). */
UAE.swPid = function (f) {
  if (!f.lines.length) {
    var pid = UAE.SW_PID[f.swClass] || (/AI/i.test(f.name) ? 'ai' : 'os');
    UAE.addLine(f, pid, { price: UAE.P[pid].ref });
  }
  return f.lines[0].pid;
};
/** Change the title a software company develops (keeps the technology the company already has). */
UAE.setSoftware = function (f, pid) {
  var P = UAE.P[pid]; if (!P || P.kind !== 'software') return false;
  f.lines = []; UAE.addLine(f, pid, { price: P.ref }); f.swClass = P.sw;
  return true;
};

/** Model generation of a product for a company (1 = first model). */
UAE.gen = function (co, pid) { return (co.gen && co.gen[pid]) || 1; };
UAE.modelName = function (co, pid) {
  var P = UAE.P[pid], g = UAE.gen(co, pid), brand = co.name.split(' ')[0];
  return brand + ' ' + P.name.replace(/ \(.*\)$/, '') + (P.kind === 'software' ? ' v' + g + '.0' : ' Gen ' + g);
};
/** Cost (AED) and duration (days) of researching the next model of pid at firm f. */
UAE.researchQuote = function (f, pid) {
  var co = UAE.co(f.owner), P = UAE.P[pid], g = UAE.gen(co, pid);
  var base = P.kind === 'software' ? 3e6 : P.kind === 'raw' ? 1.5e6 : 2.5e6;
  if ((P.ref || P.world || 0) > 10000) base *= 2;                      // cars, robots, watches: bigger programmes
  var cost = Math.round(base * (1 + 0.35 * (g - 1)) / 1e4) * 1e4;
  var days = Math.max(20, Math.round(90 / (1 + 0.4 * (f.size - 1)) / (f.eff || 1)));
  var t = co.tech[pid] || 40, gain = 12 * Math.max(0.2, 1 - t / 130);   // no cap: past ~104 each model still adds 2.4
  var out = { cost: cost, days: days, gain: gain, next: g + 1 };
  if (UAE.WM && UAE.WM[pid]) {   // world-class R&D programme: ~0.4% of the world market per project, shared by parallel projects
    var n = UAE.rndTeams(co, pid);
    out.cost += Math.round(UAE.WORLD.rndPct * UAE.wmSize(pid) * Math.pow(n, -0.7) / 1e4) * 1e4;
    out.gGain = UAE.gtechGain(co, pid) * Math.pow(n, -0.7); out.gNow = UAE.gtech(co, pid); out.frontier = UAE.wmFrontier(pid);
  }
  return out;
};
/** Count how many open firms of company co already have an active research project on pid (cached per game day). */
UAE.activeResearchCount = function (co, pid) {
  var X = UAE._idx, m = X && X.actRC && X.actRC[co.id];
  if (!m) {   // one scan per company per day builds the counts for every product (big empires: 20k+ firms)
    m = {};
    UAE.firmsOf(co.id).forEach(function (g) { if (g.status === 'open' && g.project) m[g.project.pid] = (m[g.project.pid] || 0) + 1; });
    if (X) { X.actRC = X.actRC || {}; X.actRC[co.id] = m; }
  }
  return m[pid] || 0;
};
/** Keep the per-day research counts live when a project starts (+1) or ends (-1). */
UAE.actRAdj = function (coId, pid, d) {
  var m = UAE._idx && UAE._idx.actRC && UAE._idx.actRC[coId]; if (m) m[pid] = Math.max(0, (m[pid] || 0) + d);
};
/** Max automatic parallel projects on one product (4 labs already captures strong speed without burning
 *  duplicate budgets into n^-0.7 diminishing returns). */
UAE.MAX_AUTO_RND = 4;
/** How many R&D teams the CEO may run in parallel on one product. 4 normally; when far behind the world leader the
 *  CEO adds teams (+1 per 3 points of gap, up to 16) if the company can afford it (cash > AED 500bn), else +1 per 8 points
 *  (up to 8). Parallel teams cost less each but add up with diminishing returns (n^0.3 overall), so they close gaps faster. */
/** Computer-run (AI / real / state) companies keep yearly R&D within 15% of their revenue (incl. interest & investment income). */
UAE.rndOverBudget = function (co) {
  var t = UAE.ttm(co); return (t.rnd || 0) > 0.15 * Math.max(0, UAE.totalRevenue ? UAE.totalRevenue(t) : t.revenue);
};
UAE.rndTeamCap = function (co, pid) {
  var base = UAE.MAX_AUTO_RND; if (!UAE.WM || !UAE.WM[pid] || !UAE.gtech) return base;
  var gap = UAE.wmFrontier(pid) - UAE.gtech(co, pid); if (gap <= 5) return base;
  if (!UAE.isHuman(co) && UAE.rndOverBudget(co)) return base;          // computer-run companies: R&D within 15% of revenue
  return co.bs.cash > 5e11 ? Math.min(16, base + Math.ceil(gap / 3)) : Math.min(8, base + Math.ceil(gap / 8));
};
/** Can company co still run research projects on pid? Local UAE tech stops at 100,
 *  but world-market products have an uncapped World Tech Index racing advancing leaders. */
/** Technology has no cap (user rule): research is always possible and auto-research never pauses for being "ahead". */
UAE.canResearch = function (co, pid) { return !!UAE.P[pid]; };
UAE.needsAutoResearch = function (co, pid) { return !!UAE.P[pid]; };
/** Guard for automatic software-studio research: at most 1 active project per title on a studio,
 *  and once local tech is 100 only auto-run on studios whose revenue comfortably covers the project cost. */
UAE.canAutoSoftwareResearch = function (co, f, pid) {
  if (!UAE.needsAutoResearch(co, pid)) return false;
  if (UAE.activeResearchCount(co, pid) >= 1) return false;
  if ((co.tech[pid] || 0) < 99.5) return true;
  var q = UAE.researchQuote(f, pid), mCost = q.cost / Math.max(1, q.days) * 30;
  return (f.last && f.last.rev || 0) * 0.7 >= mCost || co.bs.cash > q.cost * 50;   // past 100: pays for itself, or the company is rich enough to keep inventing
};
UAE.startResearch = function (f, pid) {
  var co = UAE.co(f.owner), k = UAE.FIRM_TYPES[f.type].kind, P = UAE.P[pid];
  if (!P) return { ok: false, why: 'Unknown product.' };
  if (k !== 'rnd' && k !== 'software') return { ok: false, why: 'Only R&D centres and software companies run research projects.' };
  if (k === 'software' && pid !== UAE.swPid(f)) return { ok: false, why: 'A software company researches its own title.' };
  if (f.status !== 'open') return { ok: false, why: 'The firm is not open yet.' };
  if (f.project) return { ok: false, why: 'A project is already running here: ' + UAE.P[f.project.pid].name + '.' };
  if (!UAE.canResearch(co, pid)) return { ok: false, why: P.name + ' cannot be researched.' };
  var q = UAE.researchQuote(f, pid);
  if (co.bs.cash < q.cost * 0.25) return { ok: false, why: 'Needs at least ' + UAE.fmt.aed(q.cost * 0.25) + ' cash to start.' };
  f.project = { pid: pid, cost: q.cost, days: q.days, done: 0, spent: 0, gen: q.next, start: UAE.S.day };
  if (k === 'rnd') f.target = pid;
  UAE.actRAdj(co.id, pid, 1);
  return { ok: true, quote: q };
};
UAE.cancelResearch = function (f) {
  if (f.project && f.status === 'open') UAE.actRAdj(f.owner, f.project.pid, -1);
  f.project = null;
};

/** Auto-research: software companies default ON, R&D centres default OFF (tick the box). */
UAE.autoResearchOn = function (f) { return f.autoResearch != null ? f.autoResearch : f.type === 'software'; };

/** Daily: project spending and completion (all R&D centres and software companies). */
UAE.researchDay = function (f) {
  if (!f.project && f.status === 'open' && UAE.autoResearchOn(f) && UAE.isHuman(UAE.co(f.owner))) {
    var co0 = UAE.co(f.owner), pid0 = f.type === 'software' ? UAE.swPid(f) : f.target, q0 = UAE.researchQuote(f, pid0);
    var allowAuto = f.type === 'software'
      ? UAE.canAutoSoftwareResearch(co0, f, pid0)
      : (UAE.needsAutoResearch(co0, pid0) && UAE.activeResearchCount(co0, pid0) < UAE.rndTeamCap(co0, pid0) && (UAE.isHuman(co0) || !UAE.rndOverBudget(co0)));
    if (allowAuto && co0.bs.cash >= q0.cost * 0.5 && UAE.startResearch(f, pid0).ok)       // keeps a cash buffer before starting
      UAE.news(f.name + ' auto-started research on ' + UAE.modelName(co0, pid0).replace(/(Gen |v)\d+/, function (m) { return m.replace(/\d+/, q0.next); }) + ' (' + UAE.fmt.aed(q0.cost) + ', ' + q0.days + ' days).', 'firm');
  }
  var p = f.project; if (!p) return;
  if (!UAE.canResearch(UAE.co(f.owner), p.pid)) { UAE.actRAdj(f.owner, p.pid, -1); f.project = null; return; }   // non-world product at maximum: stop spending
  var co = UAE.co(f.owner), daily = p.cost / p.days;
  if (co.bs.cash < daily) { p.paused = true; return; }
  p.paused = false;
  UAE.fExpense(f, 'rnd', daily); p.spent += daily; p.done++;
  if (p.done < p.days) return;
  var t = co.tech[p.pid] || 40, mgr = f.manager && UAE.person(f.manager);
  var exp = mgr && mgr.pexp ? (mgr.pexp[UAE.P[p.pid].cls] || 0) : 0;
  co.tech[p.pid] = (t + 12 * Math.max(0.2, 1 - t / 130) * (1 + exp / 100) * (UAE.ctoMult ? UAE.ctoMult(co) : 1) * ((p.pid === 'llm' || p.pid === 'ai') && UAE.computeBoost ? UAE.computeBoost(co) : 1));   // a CTO's R&D expertise adds up to +50%
  co.gen = co.gen || {}; co.gen[p.pid] = p.gen;
  if (UAE.WM && UAE.WM[p.pid]) {   // world tech index: the race against the world leaders (engine/worldmkt.js)
    var gg = UAE.gtechGain(co, p.pid) * Math.pow(UAE.rndTeams(co, p.pid), -0.7) * (1 + exp / 100) * (UAE.ctoMult ? UAE.ctoMult(co) : 1);
    co.gtech[p.pid] = UAE.gtech(co, p.pid) + gg;
  }
  f.project = null;
  UAE.actRAdj(co.id, p.pid, -1);
  if (UAE.SUBS && UAE.SUBS[p.pid] && UAE.frontierRelease) UAE.frontierRelease(co, p.pid);   // AI: a new frontier model ships
  var wNote = UAE.WM && UAE.WM[p.pid] && co.gtech && co.gtech[p.pid] != null ? ' · world tech index ' + co.gtech[p.pid].toFixed(1) : '';
  UAE.news(f.name + ' completed ' + UAE.modelName(co, p.pid) + ' - technology now ' + co.tech[p.pid].toFixed(1) + wNote + '.', UAE.isHuman(co) ? 'firm' : 'ai');
  if (!UAE.isHuman(co) && !UAE.rndOverBudget(co) && UAE.needsAutoResearch(co, p.pid) && UAE.activeResearchCount(co, p.pid) < UAE.rndTeamCap(co, p.pid) && co.bs.cash > p.cost * 3) UAE.startResearch(f, p.pid);   // AI keeps its pipeline going
};

/** A finished AI research project ships a new frontier model: every AI studio of the company serving that market
 *  gets a ~4-month launch boost, and the release is announced with its standing against the world's best. */
UAE.frontierRelease = function (co, pid) {
  co.frontier = co.frontier || {};
  var n = co.frontier[pid] = (co.frontier[pid] || 0) + 1, S = UAE.S;
  var name = co.name.split(' ')[0] + (pid === 'llm' ? ' Frontier ' : ' Assistant ') + n;
  co.frontierName = co.frontierName || {}; co.frontierName[pid] = name;
  UAE.firmsOf(co.id).forEach(function (f) { if (f.type === 'software' && f.status === 'open' && UAE.swPid(f) === pid) f.launchDay = S.day; });
  var idx = UAE.gtech(co, pid), F = UAE.wmFrontier(pid), lead = UAE.WM[pid].leaders.slice().sort(function (a, b) { return UAE.leaderIdx(b) - UAE.leaderIdx(a); })[0];
  if (UAE.isHuman(co) || n % 5 === 0)
    UAE.news('🤖 ' + co.name + ' releases ' + name + ': world AI index ' + idx.toFixed(1) + (idx >= F ? ' - now the world\'s best model, ahead of ' + lead[0] : ' vs ' + lead[0] + ' ' + UAE.leaderIdx(lead).toFixed(1) + ' (' + (F - idx).toFixed(1) + ' behind)') + '.', UAE.isHuman(co) ? 'firm' : 'ai');
};
/** Daily operation of every software company: development drift, licence stock, online direct sales. */
UAE.softwareDay = function (list) {
  var S = UAE.S, m = S.macro, byPid = {};
  list.forEach(function (f) {
    var pid = UAE.swPid(f), P = UAE.P[pid], co = UAE.co(f.owner), l = f.lines[0];
    // the development team slowly improves the title on its own (projects give the big jumps)
    var t = co.tech[pid] || 40;
    co.tech[pid] = t + 0.008 * f.size * f.eff * Math.max(0.15, 1 - t / 110);   // no cap
    f.quality = co.tech[pid] * 0.9 + (f.training || 0) * 0.1;
    // licence stock (what stores and factories buy): keep ~10 days of capacity on hand
    var target = 4000 * f.size, have = UAE.stockQ(f, pid);
    if (have < target * 0.8) {
      var q = target - have, unit = P.imp * UAE.SW_UNIT_COST;
      UAE.L.buyInventory(co, unit * q); UAE.stockAdd(f, pid, q, unit, f.quality);
      l.made += q;
    } else if (f.stock[pid]) f.stock[pid].qual = f.quality;        // a new version upgrades licences in stock
    if (!l.priceSet) l.price = Math.round(P.imp * 0.85 * 100) / 100;  // B2B / wholesale price to stores and factories
    if (!f.retailPrice) f.retailPrice = P.ref;
    (byPid[pid] || (byPid[pid] = [])).push(f);
  });
  // online direct sales: UAE consumers buy a share of software online; global vendors take the rest
  Object.keys(byPid).forEach(function (pid) {
    var P = UAE.P[pid], firms = byPid[pid], D = 0;
    Object.keys(S.cities).forEach(function (city) { D += UAE.cityDemand(city, pid); });
    D *= UAE.SW_ONLINE_SHARE * m.tech;
    var sum = UAE.SW_GLOBAL_VENDORS;
    firms.forEach(function (f) {
      var co = UAE.co(f.owner), brand = 0, nb = 0;
      Object.keys(S.cities).forEach(function (c) { brand += UAE.brandRating(co, pid, c); nb++; });
      f._swA = Math.pow(f.quality / 55, 1.4) * Math.pow(f.retailPrice / P.ref, -(1.5 + Math.abs(P.el) * 2)) * Math.pow((brand / nb + 15) / 45, 0.4);
      sum += f._swA;
    });
    firms.forEach(function (f) {
      var cap = 1500 * f.size * f.eff, units = Math.min(cap, D * f._swA / sum);
      var gross = units * f.retailPrice, net = gross / (1 + UAE.RULES.vat);
      var unit = P.imp * UAE.SW_UNIT_COST;
      UAE.fIncome(f, 'revenue', net); UAE.fExpense(f, 'cogs', units * unit);
      S.cities[f.city].vat += gross - net;
      f.online = units; f.onlineDemand = D * f._swA / sum; f.onlineCap = cap; f.onlineShare = D > 0 ? units / D : 0;
    });
  });
};

/** Factory recipe estimate for firm f making pid: per-input cheapest source, unit cost, market price, margin. */
UAE.recipeQuote = function (f, pid) {
  var P = UAE.P[pid], rec = P.rec; if (!rec) return null;
  var ins = rec.in.map(function (x) {
    var o = UAE.supplyOptions(f, x[0], true), best = o.find(function (s) { return s.avail > 0 && s.id !== 'IMPORT'; }) || o.find(function (s) { return s.id === 'IMPORT'; });
    var imp = o.find(function (s) { return s.id === 'IMPORT'; });
    return { pid: x[0], qty: x[1], unit: best.unit, src: best.name, cost: best.unit * x[1], importUnit: imp.unit };
  });
  var lab = rec.lab * (UAE.RULES.utilityMult[UAE.CITIES[f.city].emirate] || 1);
  var unit = ins.reduce(function (s, x) { return s + x.cost; }, 0) + lab;
  var mkt = P.kind === 'consumer' ? UAE.importBase(pid) * 0.97 : UAE.wholesalePrice(pid);
  var perDay = rec.cap * (1 + 0.8 * (f.size - 1)) * f.eff * 1.5 / Math.max(1, f.lines.length + (f.lines.some(function (l) { return l.pid === pid; }) ? 0 : 1));
  return { ins: ins, lab: lab, unit: unit, market: mkt, margin: mkt > 0 ? (mkt - unit) / mkt : 0, perDay: perDay };
};
/** Point every own retail store / factory that uses pid at supplier firm f. Returns how many lines changed. */
UAE.linkOwnBuyers = function (f, pid) {
  var n = 0;
  UAE.firmsOf(f.owner).forEach(function (g) {
    if (g.id === f.id) return;
    var k = UAE.FIRM_TYPES[g.type].kind;
    g.lines.forEach(function (l) {
      if ((k === 'retail' || k === 'internet' || k === 'datacenter') && l.pid === pid) { l.supplier = f.id; n++; }
      if (k === 'factory' && UAE.P[l.pid].rec && UAE.P[l.pid].rec.in.some(function (x) { return x[0] === pid; })) { l.inSup = l.inSup || {}; l.inSup[pid] = f.id; n++; }
    });
  });
  return n;
};
/** Settings cheat: owner capital injection (books as share capital, so the ledger stays balanced). */
UAE.addCash = function (co, amt) {
  if (!(amt > 0) || !isFinite(amt)) return false;
  UAE.L.issueEquity(co, amt);
  co.cheatCash = (co.cheatCash || 0) + amt;
  return true;
};

/** Firms of a company working on pid's technology (software firms publishing it + R&D centres targeting it). */
UAE.rndTeams = function (co, pid) {
  var X = UAE._idx, M = X && X.rndT && X.rndT[co.id];
  if (!M) {   // one pass over the company's firms per game day
    M = {}; UAE.firmsOf(co.id).forEach(function (f) {
      var p = f.type === 'software' && f.lines.length ? f.lines[0].pid : f.type === 'rnd' ? f.target : null;
      if (p) M[p] = (M[p] || 0) + 1;
    });
    if (X) { X.rndT = X.rndT || {}; X.rndT[co.id] = M; }
  }
  return Math.max(1, M[pid] || 0);
};
