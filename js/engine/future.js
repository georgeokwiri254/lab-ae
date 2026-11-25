/* ============================================================================
 * UAE CAPITALISM LAB  -  FUTURE TECHNOLOGY: INVENTION FIRST, INNOVATION FOLLOWS
 * (products + windows in data/futuretech.js)
 *
 *  Status of a future product:
 *    LOCKED    - before (window start - 5 years): nobody can research it yet.
 *    RESEARCH  - invention research is open in R&D centres. Every finished project is a chance to invent it:
 *                  before the window  0.5% -> 6% per project (rising as the window nears)
 *                  inside the window  10% -> 20%            after the window  30%
 *                so more R&D teams = more finished projects = more chances = invented sooner.
 *                The world's leading labs invent it on their own at a date inside the window (drawn once per game).
 *    INVENTED  - the world market opens at its invention size and grows from that day (S-curve); the leaders'
 *                tech index starts rising from the invention date. A game company that invents it first starts
 *                +12 index points ahead of the world. From then on it is a normal world market: R&D teams innovate
 *                (next models), plants / software sell worldwide, CEOs build capacity when it pays.
 *  2-YEAR CASH RULE (CEO-run and computer companies): money goes into future research only while trailing-12-month
 *  net profit is positive AND cash covers 24 months of all costs (current costs + the future research itself).
 *  If the rule fails, running future projects pause until it holds again. Your own (non-delegated) projects never pause.
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.FUT = { preYears: 5, headStart: 12, months: 24, maxTeams: 8, maxNewLabs: 6, aiMinCash: 5e10, aiTeams: 2, aiTop: 1, humanShare: 0.5, aiShare: 0.15 };

/** Calendar year with fraction (day 0 = 20 Nov 2026). */
UAE.futYear = function (day) {
  var d = UAE.cal.date(day == null ? UAE.S.day : day);
  return d.getUTCFullYear() + (d.getUTCMonth() + (d.getUTCDate() - 1) / 31) / 12;
};
UAE.futDayOf = function (y) {
  var yr = Math.floor(y), t = Date.UTC(yr, 0, 1) + (y - yr) * 365.25 * 864e5;
  return Math.round((t - UAE.cal.START) / 864e5);
};
UAE.isFut = function (pid) { return !!(UAE.FUTURE_TECH && UAE.FUTURE_TECH[pid]); };
UAE.futState = function (pid) { var S = UAE.S; S.fut = S.fut || {}; return S.fut[pid] || (S.fut[pid] = { inv: null }); };
UAE.futInvented = function (pid) {
  if (!UAE.isFut(pid)) return true;
  var s = UAE.S && UAE.S.fut && UAE.S.fut[pid];
  return !!(s && s.inv != null && s.inv <= UAE.S.day);
};
/** 'locked' | 'research' | 'invented' ('n/a' = an ordinary product). */
UAE.futStatus = function (pid) {
  if (!UAE.isFut(pid)) return UAE.FUTURE_PRE && UAE.FUTURE_PRE[pid] ? 'invented' : 'n/a';
  if (UAE.futInvented(pid)) return 'invented';
  return UAE.futYear() >= UAE.FUTURE_TECH[pid].from - UAE.FUT.preYears ? 'research' : 'locked';
};
UAE.futOpensYear = function (pid) { var T = UAE.FUTURE_TECH[pid]; return T ? T.from - UAE.FUT.preYears : null; };
UAE.futYearsSince = function (pid) { var s = UAE.S && UAE.S.fut && UAE.S.fut[pid]; return s && s.inv != null ? Math.max(0, (UAE.S.day - s.inv) / 365) : 0; };
UAE.futHash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

/** Chance that one finished research project invents pid now. */
UAE.futChance = function (pid, co) {
  var T = UAE.FUTURE_TECH[pid], y = UAE.futYear(), p;
  if (y < T.from) p = 0.005 * Math.pow(12, Math.max(0, Math.min(1, 1 - (T.from - y) / UAE.FUT.preYears)));   // 0.5% five years early -> 6% at the window
  else if (y <= T.to) p = 0.10 + 0.10 * (y - T.from) / Math.max(1, T.to - T.from);
  else p = 0.30;
  if (co && UAE.ctoMult) p *= UAE.ctoMult(co);                            // a strong CTO invents sooner
  return Math.min(0.6, p);
};

/* ----------------------------------------------------------- set-up / load */
UAE.futInit = function () {
  var S = UAE.S; if (!S || !UAE.FUTURE_TECH) return;
  S.fut = S.fut || {};
  if (S.futSeed == null) S.futSeed = Math.floor(UAE.rng.next() * 1e9);
  Object.keys(UAE.FUTURE_TECH).forEach(function (pid) {
    var T = UAE.FUTURE_TECH[pid], st = UAE.futState(pid);
    if (st.worldDay == null) {           // the date the world's labs invent it (inside the window, drawn once per game)
      var h = UAE.futHash(pid + ':' + S.futSeed);
      st.worldDay = UAE.futDayOf(T.from + (T.to - T.from) * (0.1 + 0.8 * h));
    }
    if (st.inv == null && st.worldDay <= S.day) {             // already happened before this game / save knew about it
      st.inv = st.worldDay; var L = UAE.futTopLeader(pid); st.by = L[0]; st.byName = L[0]; st.world = true; st.hist = true;
    }
  });
};
UAE.futTopLeader = function (pid) { return UAE.WM[pid].leaders.slice().sort(function (a, b) { return b[2] - a[2]; })[0]; };

/* ---------------------------------------------- world market follows the invention date */
(function () {
  // leaders' index of a future product rises from its invention date (before it: their prototype level)
  Object.keys(UAE.FUTURE_TECH || {}).forEach(function (pid) { var M = UAE.WM[pid]; if (M) M.leaders.forEach(function (L) { L.fp = pid; }); });
  var baseIdx = UAE.leaderIdx;
  UAE.leaderIdx = function (L) { return L.fp ? L[2] + L[3] * UAE.futYearsSince(L.fp) : baseIdx(L); };
  var baseSize = UAE.wmSize;
  UAE.wmSize = function (pid) {
    if (!UAE.isFut(pid)) return baseSize(pid);
    if (!UAE.futInvented(pid)) return 0;                    // no market before the invention
    var M = UAE.WM[pid];
    return M.size * 1e9 * (UAE.capGrowth ? UAE.capGrowth(M.grow || 0, M.cap || 2, UAE.futYearsSince(pid)) : 1);
  };
  /** Market size the day it is invented (for planning and the timeline screen). */
  UAE.futLaunchSize = function (pid) { var M = UAE.WM[pid]; return M ? M.size * 1e9 : 0; };
})();

/* ------------------------------------------------------------- research hooks */
(function () {
  var baseCan = UAE.canResearch;
  UAE.canResearch = function (co, pid) { if (UAE.isFut(pid) && UAE.futStatus(pid) === 'locked') return false; return baseCan(co, pid); };
  var baseNeeds = UAE.needsAutoResearch;
  UAE.needsAutoResearch = function (co, pid) {
    if (UAE.isFut(pid) && !UAE.futInvented(pid)) return UAE.futStatus(pid) === 'research' && UAE.futRuleApplies(co) ? UAE.futCashOk(co).ok : UAE.futStatus(pid) === 'research';
    return baseNeeds(co, pid);
  };
  // invention research costs ~0.4% of the market it will open, per project (parallel teams share it, n^-0.7)
  var baseQuote = UAE.researchQuote;
  UAE.researchQuote = function (f, pid) {
    var q = baseQuote(f, pid);
    if (UAE.isFut(pid) && !UAE.futInvented(pid)) {
      var co = UAE.co(f.owner), n = UAE.rndTeams ? UAE.rndTeams(co, pid) : 1;
      q.cost += Math.round(UAE.WORLD.rndPct * UAE.futLaunchSize(pid) * Math.pow(Math.max(1, n), -0.7) / 1e4) * 1e4;
      q.invent = UAE.futChance(pid, co);
    }
    return q;
  };
  var baseStart = UAE.startResearch;
  UAE.startResearch = function (f, pid) {
    if (UAE.isFut(pid) && UAE.futStatus(pid) === 'locked') { var T = UAE.FUTURE_TECH[pid]; return { ok: false, why: 'Research on ' + UAE.P[pid].name + ' opens in ' + (T.from - UAE.FUT.preYears) + ' (5 years before its invention window ' + T.from + '-' + T.to + ').' }; }
    return baseStart(f, pid);
  };
  var baseDay = UAE.researchDay;
  UAE.researchDay = function (f) {
    var p = f.project;
    if (p && UAE.isFut(p.pid) && !UAE.futInvented(p.pid) && f.futFor) {
      var co = UAE.co(f.owner);
      if (UAE.futRuleApplies(co) && !UAE.futCashOk(co).ok) { p.paused = true; p.futHold = true; return; }   // 2-year cash rule
      p.futHold = false;
    }
    baseDay(f);
    if (p && f.project !== p && p.done >= p.days) UAE.futProjectDone(f, p);
  };
})();

/** A finished project on a product not invented yet: chance to invent it. */
UAE.futProjectDone = function (f, p) {
  if (!UAE.isFut(p.pid) || UAE.futInvented(p.pid)) return;
  var co = UAE.co(f.owner), st = UAE.futState(p.pid), ch = UAE.futChance(p.pid, co);
  st.tries = (st.tries || 0) + 1; st.triesBy = st.triesBy || {}; st.triesBy[co.id] = (st.triesBy[co.id] || 0) + 1;
  if (UAE.rng.next() < ch) UAE.futInvent(p.pid, co);
  else if (UAE.isHuman(co) && (st.triesBy[co.id] % 4 === 1)) UAE.news('🔬 ' + f.name + ': prototype of ' + UAE.P[p.pid].name + ' improved, not a breakthrough yet (' + Math.round(ch * 100) + '% chance per finished project, ' + st.triesBy[co.id] + ' tried so far).', 'firm');
};

/** pid is invented - by a game company (co) or by the world's labs. */
UAE.futInvent = function (pid, co) {
  var st = UAE.futState(pid); if (st.inv != null && st.inv <= UAE.S.day) return;
  var P = UAE.P[pid], L = UAE.futTopLeader(pid), A = UAE.fmt.aed, y = Math.floor(UAE.futYear());
  st.inv = UAE.S.day; st.world = !co; st.by = co ? co.id : L[0]; st.byName = co ? co.name : L[0]; st.human = !!(co && UAE.isHuman(co));
  if (co) {
    var F = UAE.wmFrontier(pid); co.gtech = co.gtech || {};
    co.gtech[pid] = Math.max(UAE.gtech(co, pid), F + UAE.FUT.headStart);
    co.tech[pid] = Math.max(co.tech[pid] || 40, 60);
    co.inventions = co.inventions || []; co.inventions.push({ pid: pid, day: UAE.S.day });
  }
  UAE.allFirms().forEach(function (f) { if (f.futFor === pid) delete f.futFor; });   // invention labs carry on as innovation labs
  if (UAE._idx) UAE._idx.invProd = null;
  UAE.allCos().forEach(function (c) { if (c.invA) c.invA.day = -1e9; });             // every CEO re-runs the investment analysis
  var T = UAE.FUTURE_TECH[pid];
  UAE.news('💡 INVENTED ' + y + ': ' + P.name + ' - by ' + (co ? co.name + (st.human ? ' (your company!)' : '') : L[0] + ' (' + (UAE.NATION_FLAG[L[1]] || L[1]) + ')') +
    '. The world market opens at about ' + A(UAE.futLaunchSize(pid)) + ' a year' + (T ? ' (forecast window ' + T.from + '-' + T.to + ')' : '') +
    (co ? '; the inventor starts ' + UAE.FUT.headStart + ' points ahead of the world.' : '; UAE companies now race to catch up.'), st.human ? 'firm' : 'event');
};

/** World labs invent on their scheduled date (checked monthly). */
UAE.futWorldCheck = function () {
  var S = UAE.S; if (!S.fut) UAE.futInit();
  Object.keys(UAE.FUTURE_TECH).forEach(function (pid) { var st = UAE.futState(pid); if (st.inv == null && st.worldDay != null && st.worldDay <= S.day) UAE.futInvent(pid, null); });
};

/* --------------------------------------------------------- the 2-year cash rule */
/** CEO-run companies of yours and computer companies follow the rule; your own hand-started projects do not. */
UAE.futRuleApplies = function (co) { return !UAE.isHuman(co) || !!(co.ceoAuto && UAE.ceoPerson && UAE.ceoPerson(co)); };
UAE.futSpendM = function (co) {
  var m = 0; UAE.firmsOf(co.id).forEach(function (f) { var p = f.project; if (p && f.futFor && UAE.isFut(p.pid) && !UAE.futInvented(p.pid)) m += p.cost / Math.max(1, p.days) * 30; });
  return m;
};
UAE.futCashOk = function (co) {
  var C = UAE._futOkC; if (!C || C.day !== UAE.S.day) C = UAE._futOkC = { day: UAE.S.day };
  if (C[co.id]) return C[co.id];
  var t = UAE.ttm(co), ni = UAE.netIncome(t), costM = UAE.monthCosts ? UAE.monthCosts(co) : 0, futM = UAE.futSpendM(co), cash = UAE.groupFreeCash ? UAE.groupFreeCash(co) : co.bs.cash;   // bank deposits are not the company's money
  var need = UAE.FUT.months * (costM + futM), ok = ni > 0 && cash >= need;
  var why = ni <= 0 ? 'no profit over the last 12 months' : cash < need ? 'cash ' + UAE.fmt.aed(cash) + ' does not cover 24 months of costs (' + UAE.fmt.aed(need) + ')' : 'cash covers ' + (cash / Math.max(1, costM + futM)).toFixed(0) + ' months of costs';
  return (C[co.id] = { ok: ok, why: why, cash: cash, costM: costM, futM: futM, ni: ni, need: need });
};

/* ------------------------------------------------------------ CEO planning */
/** Computer companies race for inventions only if they are technology companies (factories, software or R&D centres). */
UAE.futIsTechCo = function (co) {
  if (co.sector && /bank|finance|insur|property|hospitality|retail|education/i.test(co.sector)) return false;   // banks, property, hotels, shops: not inventors
  return UAE.firmsOf(co.id).some(function (f) { return f.status === 'open' && (f.type === 'factory' || f.type === 'software' || f.type === 'rnd'); });
};
/** Expected value of researching pid now (market it opens x margin x how close the window is). */
UAE.futValue = function (pid) {
  var T = UAE.FUTURE_TECH[pid], P = UAE.P[pid], y = UAE.futYear();
  var urgency = y < T.from ? 0.4 + 0.12 * (UAE.FUT.preYears - (T.from - y)) : y <= T.to ? 1 : 1.3;
  return UAE.futLaunchSize(pid) * (P.rec ? P.rec.gm : 0.9) * urgency;
};
/** Monthly (execsDay): a CEO-run company puts invention teams on the most valuable open future products,
 *  within the 2-year cash rule: budget = min(what the rule leaves, a share of monthly profit). */
UAE.futureMonth = function (co) {
  if (co.foreign || co.status === 'BANKRUPT' || !UAE.FUTURE_TECH) return;
  var human = UAE.isHuman(co);
  if (human && !UAE.futRuleApplies(co)) return;                                   // you run it yourself: R&D centre screens
  if (!human && (co.bs.cash < UAE.FUT.aiMinCash || UAE.rndOverBudget(co) || !UAE.futIsTechCo(co))) return;
  var R = UAE.futCashOk(co), A = UAE.fmt.aed;
  var plan = co.futPlan = { day: UAE.S.day, ok: R.ok, why: R.why, budgetM: 0, picks: [], newLabs: 0 };
  if (!R.ok) return;
  var room = R.cash / UAE.FUT.months - R.costM - R.futM, budgetM = Math.max(0, Math.min(room, R.ni / 12 * (human ? UAE.FUT.humanShare : UAE.FUT.aiShare)));
  plan.budgetM = budgetM; if (budgetM <= 0) return;
  var cands = Object.keys(UAE.FUTURE_TECH).filter(function (pid) { return UAE.futStatus(pid) === 'research'; })
    .sort(function (a, b) { return UAE.futValue(b) - UAE.futValue(a); });
  if (!human) cands = cands.slice(0, UAE.FUT.aiTop);
  var labs = UAE.firmsOf(co.id).filter(function (f) { return f.type === 'rnd' && f.status === 'open'; });
  var maxT = human ? UAE.FUT.maxTeams : UAE.FUT.aiTeams, spent = 0, built = 0;
  cands.forEach(function (pid) {
    var mine = labs.filter(function (f) { return f.futFor === pid; }), teams = mine.length;
    // labs already assigned: (re)start their project
    mine.forEach(function (f) { if (!f.project && co.bs.cash > UAE.researchQuote(f, pid).cost * 0.5) UAE.startResearch(f, pid); });
    while (teams < maxT) {
      var f = labs.find(function (g) { return !g.project && !g.futFor && !g.entryFor; }), fresh = false;
      if (!f) {
        if (built >= UAE.FUT.maxNewLabs || !UAE.buildFor) break;
        f = UAE.buildFor(co, 'rnd', pid); if (!f) break;
        built++; fresh = true; labs.push(f);
      }
      var q = UAE.researchQuote(f, pid), costM = q.cost / Math.max(1, q.days) * 30;
      if (spent + costM > budgetM) { if (fresh) { f.target = pid; f.futFor = pid; f.autoResearch = true; } break; }
      f.target = pid; f.futFor = pid; f.autoResearch = true; if (UAE.nameSync) UAE.nameSync(f);
      if (f.status === 'open' && co.bs.cash > q.cost * 0.5) UAE.startResearch(f, pid);
      spent += costM; teams++;
    }
    if (teams) plan.picks.push({ pid: pid, teams: teams, chance: UAE.futChance(pid, co) });
  });
  plan.newLabs = built; plan.spentM = spent;
  if (human && (plan.picks.length || built)) UAE.news('🔮 ' + ((UAE.ceoPerson(co) || {}).name || 'CEO') + ' (' + co.name + ') funds invention research: ' + plan.picks.slice(0, 6).map(function (x) { return UAE.shortProduct(x.pid) + ' ×' + x.teams; }).join(', ') +
    (plan.picks.length > 6 ? ' +' + (plan.picks.length - 6) + ' more' : '') + (built ? ' (' + built + ' new R&D centre' + (built > 1 ? 's' : '') + ')' : '') + '. 2-year rule: ' + R.why + '; budget ' + A(budgetM) + '/month.', 'firm');
};

/* --------------------------------------------- nothing is made, sold or imported before it exists */
(function () {
  var baseAdd = UAE.addLine;
  UAE.addLine = function (f, pid, o) { if (UAE.isFut(pid) && !UAE.futInvented(pid)) return null; return baseAdd(f, pid, o); };
  var baseProc = UAE.procure;
  UAE.procure = function (f, pid, q, sup) { if (UAE.isFut(pid) && !UAE.futInvented(pid)) return 0; return baseProc(f, pid, q, sup); };
  var baseWM = UAE.worldMonth;
  if (baseWM) UAE.worldMonth = function () { UAE.futWorldCheck(); return baseWM.apply(this, arguments); };
  var baseNew = UAE.newGame;
  UAE.newGame = function () { var r = baseNew.apply(this, arguments); UAE.futInit(); return r; };
  var baseLoad = UAE.afterLoad;
  UAE.afterLoad = function () { var r = baseLoad ? baseLoad.apply(this, arguments) : undefined; UAE.futInit(); return r; };
})();
