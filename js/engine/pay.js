/* ============================================================================
 * UAE CAPITALISM LAB  -  EXECUTIVE PAY, PERFORMANCE BONUSES, MOTIVATION & RAISES
 *   CEO, COO, CMO and CTO are paid every month end (from UAE.monthEnd, before the month rolls):
 *     base salary
 *   + revenue bonus  (bonusPct of base) when this month's revenue reaches the target:
 *                    average monthly revenue of the last 12 months x (1 + yearly growth target)^(6.5/12)
 *   + profit share   (CEO ceoProfit, others execProfit of the month's net profit; capped at profitCapX x base)
 *   Motivation (0-100) rises with bonuses and profits, falls with misses and turned-down raises.
 *   Motivated executives work better: CEO builds more, COO runs firms more efficiently, CMO's ads and
 *   CTO's R&D get stronger (UAE.motMult 0.85 .. 1.15).
 *   Raises: executives ask for one after a strong run (or when unhappy). Computer companies decide on
 *   their own; in your companies you accept / decline in HQ, or tick auto-accept per role.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.PAY = { revGrowth: 0.10, bonusPct: 0.5, ceoProfit: 0.005, execProfit: 0.001, profitCapX: 24, raiseEvery: 365, answerDays: 60 };
UAE.EXEC_ROLES = [['ceo', 'CEO'], ['coo', 'COO'], ['cmo', 'CMO'], ['cto', 'CTO']];

/** Pay settings of a company (stored in its policy). */
UAE.payPol = function (co) {
  var pol = UAE.policy(co), P = UAE.PAY;
  if (pol.pay == null) pol.pay = { revGrowth: P.revGrowth, bonusPct: P.bonusPct, ceoProfit: P.ceoProfit, execProfit: P.execProfit, autoRaise: { ceo: false, coo: false, cmo: false, cto: false } };
  pol.pay.autoRaise = pol.pay.autoRaise || {};
  return pol.pay;
};
/** Hired (non-player) executives of a company: [{ role, label, p }]. */
UAE.execsOf = function (co) {
  return UAE.EXEC_ROLES.map(function (r) { var p = co[r[0]] && UAE.person(co[r[0]]); return p && !p.isPlayer ? { role: r[0], label: r[1], p: p } : null; }).filter(Boolean);
};
UAE.motivation = function (p) { if (p.motivation == null) p.motivation = 60; return p.motivation; };
/** Work-quality multiplier from motivation: 0.85 (0) .. 1 (50) .. 1.15 (100). */
UAE.motMult = function (p) { return p ? 0.85 + 0.3 * UAE.motivation(p) / 100 : 1; };
UAE.coRevenue = function (m) { return m ? (m.revenue || 0) + (m.interestInc || 0) + (m.investInc || 0) : 0; };
/** This month's revenue target, or null when there is no history yet. */
UAE.revTarget = function (co) {
  var ms = (co.is.months || []).slice(-12); if (!ms.length) return null;
  var avg = ms.reduce(function (s, m) { return s + UAE.coRevenue(m); }, 0) / ms.length;
  return avg > 0 ? avg * Math.pow(1 + UAE.payPol(co).revGrowth, 6.5 / 12) : null;
};

/** Month-end pay for every executive of co (books salaries on the month that is closing). */
UAE.payExecs = function (co) {
  var ex = UAE.execsOf(co), S = UAE.S;
  if (!ex.length) return;
  var pp = UAE.payPol(co), cur = co.is.cur, rev = UAE.coRevenue(cur), ni = UAE.netIncome(cur), target = UAE.revTarget(co);
  var hit = target != null && rev >= target, total = 0;
  ex.forEach(function (e) {
    var p = e.p, base = p.salary || 0;
    var bonus = hit ? base * pp.bonusPct : 0;
    var share = ni > 0 ? Math.min(ni * (e.role === 'ceo' ? pp.ceoProfit : pp.execProfit), base * UAE.PAY.profitCapX) : 0;
    var pay = base + bonus + share; if (pay <= 0) return;
    UAE.L.expense(co, 'salaries', pay); p.cash = (p.cash || 0) + pay * 0.9; total += pay;
    p.pay = { day: S.day, base: base, bonus: bonus, profit: share, total: pay, hit: hit, target: target, rev: rev };
    p.payHist = p.payHist || []; p.payHist.push({ day: S.day, total: pay, hit: hit }); if (p.payHist.length > 24) p.payHist.shift();
    var m = UAE.motivation(p);
    m += (hit ? 1.5 : target == null ? 0 : -3) + (ni > 0 ? 1 : -4) + (50 - m) * 0.1;
    p.motivation = Math.max(0, Math.min(100, m));
    UAE.raiseCheck(co, e);
  });
  co.payLast = { day: S.day, target: target, rev: rev, hit: hit, ni: ni, total: total };
};

/** Does this executive ask for a raise? Strong run (target hit in 3 of the last 4 months) or very unhappy. */
UAE.raiseCheck = function (co, e) {
  var p = e.p, S = UAE.S, P = UAE.PAY, R = UAE.rng;
  if (p.raiseReq) {                                    // unanswered for too long counts as a no
    if (S.day - p.raiseReq.day > P.answerDays) UAE.raiseAnswer(co, e.role, false, true);
    return;
  }
  if (S.day - (p.lastRaiseAsk || p.hiredDay || 0) < P.raiseEvery) return;
  var h = (p.payHist || []).slice(-4), hits = h.filter(function (x) { return x.hit; }).length;
  var strong = h.length >= 4 && hits >= 3, unhappy = UAE.motivation(p) < 30;
  if (!strong && !unhappy) return;
  var pct = strong ? R.range(0.04, 0.08) : R.range(0.03, 0.06);
  UAE.askRaise(co, e.role, pct, strong ? 'revenue target reached ' + hits + ' of the last 4 months' : 'motivation is low (' + Math.round(UAE.motivation(p)) + ')');
};
/** Executive in `role` asks for a raise of pct (0.1 = +10%). Auto-accepted per policy; computer companies decide at once. */
UAE.askRaise = function (co, role, pct, why) {
  var p = co[role] && UAE.person(co[role]); if (!p || p.isPlayer) return { ok: false, why: 'No hired ' + role.toUpperCase() + '.' };
  if (p.raiseReq) return { ok: false, why: p.name + ' is already waiting for an answer.' };
  pct = pct || 0.1;
  var lab = role.toUpperCase(), nw = Math.round((p.salary || 0) * (1 + pct) / 1000) * 1000;
  p.raiseReq = { day: UAE.S.day, role: role, pct: pct, from: p.salary || 0, to: nw, why: why || 'asked for a raise' };
  p.lastRaiseAsk = UAE.S.day;
  var pp = UAE.payPol(co);
  if (!UAE.isHuman(co)) return UAE.raiseAnswer(co, role, co.payLast ? co.payLast.hit || co.payLast.ni > 0 : true);
  if (pp.autoRaise[role]) return UAE.raiseAnswer(co, role, true, false, true);
  UAE.news('💼 ' + p.name + ' (' + lab + ', ' + co.name + ') asks for a raise: ' + UAE.fmt.aed(p.raiseReq.from) + ' → ' + UAE.fmt.aed(nw) + ' a month (+' + Math.round(pct * 100) + '%) - ' + p.raiseReq.why + '. Answer in HQ → Executive pay.', 'firm');
  return { ok: true, pending: true };
};
/** Accept or decline the pending raise of the executive in `role`. */
UAE.raiseAnswer = function (co, role, yes, timeout, auto) {
  var p = co[role] && UAE.person(co[role]); if (!p || !p.raiseReq) return { ok: false, why: 'No raise request.' };
  var r = p.raiseReq, lab = role.toUpperCase(); p.raiseReq = null;
  if (yes) { p.salary = r.to; p.motivation = Math.min(100, UAE.motivation(p) + 12); p.lastRaise = { day: UAE.S.day, from: r.from, to: r.to }; }
  else p.motivation = Math.max(0, UAE.motivation(p) - (timeout ? 15 : 10));
  p.career = p.career || []; p.career.push({ day: UAE.S.day, text: (yes ? 'Raise to ' + UAE.fmt.aed(r.to) + '/mo' : 'Raise request turned down') + ' at ' + co.name });
  if (UAE.isHuman(co)) UAE.news('💼 ' + p.name + ' (' + lab + ', ' + co.name + '): raise ' + (yes ? (auto ? 'auto-accepted' : 'accepted') + ' - now ' + UAE.fmt.aed(r.to) + ' a month' : (timeout ? 'not answered in ' + UAE.PAY.answerDays + ' days - motivation falls' : 'declined - motivation falls')) + '.', yes ? 'firm' : 'warning');
  return { ok: true, salary: p.salary };
};

/* ---- COO: runs day-to-day operations (firm efficiency + the HQ "Delegate operations" switch) */
UAE.appointCoo = function (co, personId) {
  var p = UAE.person(personId); if (!p) return { ok: false, why: 'Unknown person.' };
  if (p.co && p.co !== co.id) UAE.leavePost(p);
  var old = co.coo && UAE.person(co.coo); if (old && old !== p) { old.title = 'Candidate'; old.co = null; }
  UAE.ensurePerson(p);
  p.title = 'Chief Operating Officer'; p.co = co.id; co.coo = p.id; p.salary = p.salary || 140000; p.hiredDay = UAE.S.day;
  UAE.news(p.name + ' appointed COO of ' + co.name + '.', 'firm');
  return { ok: true };
};
/** Extra firm efficiency target from the company's COO (management skill x motivation). */
UAE.cooEff = function (co) {
  var c = co && co.coo && UAE.S.persons[co.coo];
  return c ? (c.skill.mgmt / 1000) * UAE.motMult(c) : 0;
};

/* ---- wire into the rest of the engine (wrappers keep the old functions intact) */
(function () {
  var lp = UAE.leavePost;
  UAE.leavePost = function (p) { var old = p.co && UAE.co(p.co); if (old && old.coo === p.id) old.coo = null; p.raiseReq = null; return lp.apply(this, arguments); };
  ['appointCeo', 'appointCmo', 'appointCto'].forEach(function (k) {
    var f = UAE[k]; if (!f) return;
    UAE[k] = function (co, pid) { var r = f.apply(this, arguments), p = UAE.person(pid); if (r && r.ok !== false && p) { p.hiredDay = UAE.S.day; p.raiseReq = null; if (!p.salary) p.salary = k === 'appointCmo' ? 120000 : 150000; } return r; };
  });
  var cm = UAE.ctoMult;
  if (cm) UAE.ctoMult = function (co) { var c = co && co.cto && UAE.person(co.cto), v = cm.apply(this, arguments); return c ? 1 + (v - 1) * UAE.motMult(c) : v; };
  var mk = UAE.mktExpMult;
  if (mk) UAE.mktExpMult = function (co, f) { var v = mk.apply(this, arguments), c = co.cmo && UAE.person(co.cmo); return c ? 1 + (v - 1) * UAE.motMult(c) : v; };
})();
