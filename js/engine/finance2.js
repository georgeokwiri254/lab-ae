/* ============================================================================
 * UAE CAPITALISM LAB  -  BANK & INSURER AS RING-FENCED DIVISIONS
 *  Each bank / insurer has its OWN capital, balance sheet and income statement:
 *   capital      money the parent company injected (inject / withdraw)
 *   retained     profits the division kept (month-end, from its firms' P&L)
 *   equity       capital + retained + this month's profit so far
 *   bank cash    equity + deposits - loans   (its own liquidity)
 *  The bank's lending limits (CAR 13%, reserve 7%) use ITS equity and cash, not the
 *  whole group's. Insurer solvency uses the insurer's equity.
 *  Loan book by credit rating: corporate AAA..B, personal Prime / Near-prime /
 *  Subprime (mix from risk appetite and the minimum rating you lend to), each with
 *  its own rate add-on and default probability. Game-company loans carry the
 *  borrower's own rating. Insurance risk classes: low / standard / high risk.
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.GRADES = {
  corp: [['AAA', -0.006, 0.0003], ['AA', -0.004, 0.0008], ['A', -0.001, 0.0015], ['BBB', 0.003, 0.004], ['BB', 0.015, 0.015], ['B', 0.035, 0.045]],
  cons: [['Prime', 0, 0.012], ['Near-prime', 0.03, 0.035], ['Subprime', 0.08, 0.09]]
};
UAE.GRADE_MIX = {
  corp: { conservative: [25, 30, 30, 15, 0, 0], normal: [10, 20, 30, 25, 10, 5], aggressive: [5, 10, 20, 30, 20, 15] },
  cons: { conservative: [80, 20, 0], normal: [55, 30, 15], aggressive: [35, 35, 30] }
};
/** Rating mix of a segment after the minimum-rating policy: [{g, share, addOn, pd}], plus the share of borrowers still eligible. */
UAE.gradeMix = function (B, seg) {
  var G = UAE.GRADES[seg], mix = UAE.GRADE_MIX[seg][B.appetite || 'normal'].slice(), minI = seg === 'corp' ? (B.minGrade == null ? 5 : B.minGrade) : (B.minCons == null ? 2 : B.minCons);
  var full = mix.reduce(function (s, x) { return s + x; }, 0);
  mix = mix.map(function (x, i) { return i <= minI ? x : 0; });
  var tot = mix.reduce(function (s, x) { return s + x; }, 0) || 1;
  return { rows: G.map(function (g, i) { return { g: g[0], share: mix[i] / tot, addOn: g[1], pd: g[2] }; }), eligible: tot / full };
};
UAE.mixRate = function (B, seg) { return UAE.gradeMix(B, seg).rows.reduce(function (s, r) { return s + r.share * r.addOn; }, 0); };
UAE.mixPD = function (B, seg) { return UAE.gradeMix(B, seg).rows.reduce(function (s, r) { return s + r.share * r.pd; }, 0); };

/* ---------------------------------------------------- bank division books */
UAE.bankFirms = function (co) { return UAE.firmsOf(co.id).filter(function (f) { return f.type === 'bankhq' || f.type === 'bankbranch'; }); };
UAE.insFirms = function (co) { return UAE.firmsOf(co.id).filter(function (f) { return f.type === 'inshq' || f.type === 'insoffice'; }); };
UAE.monthPL = function (firms) { return firms.reduce(function (s, f) { return s + (f.m.rev - f.m.cost); }, 0); };
UAE.bankLoans = function (co) { var B = UAE.bankOf(co); return B.book.corp + B.book.mort + B.book.cons + B.game + (UAE.intlTotal ? UAE.intlTotal(B) : 0); };
UAE.bankSeg = function (co) {
  var B = UAE.bankOf(co);
  if (B.capital == null) {                         // first time: allocate enough of the group's equity to run safely today
    var rw = B.book.corp * 1 + B.book.mort * 0.5 + B.book.cons * 1 + B.game;
    B.capital = Math.max(rw * 0.2, co.bs.custDeposits * 0.12, 5e7); B.retained = 0;
    B.is = { months: [], ytd: {} };
  }
  return B;
};
UAE.bankEquity = function (co) { var B = UAE.bankSeg(co); return B.capital + B.retained + UAE.monthPL(UAE.bankFirms(co)); };
UAE.bankCash = function (co) { return UAE.bankEquity(co) + co.bs.custDeposits - UAE.bankLoans(co); };
/* capital rules now use the bank's own equity and cash (never more than the group really has) */
UAE.bankCAR = function (co) { var rw = UAE.riskWeighted(co); return rw > 0 ? UAE.bankEquity(co) / rw : 9.99; };
UAE.bankLendRoom = function (co) {
  var byCapital = UAE.bankEquity(co) / UAE.BANK.minCAR - UAE.riskWeighted(co);
  var bankCash = Math.min(UAE.bankCash(co), co.bs.cash);
  var byCash = bankCash - co.bs.custDeposits * UAE.BANK.reserve;
  return Math.max(0, Math.min(byCapital, byCash));
};
/** Move money between the parent company and its bank (positive = inject, negative = withdraw). */
/* Injected money really leaves the company's cash: it is booked as an investment in the division
 * (balance sheet: "Investments ... subsidiaries at cost") and tracked in B.funded. Withdrawing moves
 * it back to cash. Only injected money can be withdrawn - the division's profits already land in the
 * company's cash every day, and the starting capital is tied up in the loan book. */
UAE.groupFreeCash = function (co) { return Math.max(0, co.bs.cash - (co.bs.custDeposits || 0) * UAE.BANK.reserve); };
UAE.bankCapital = function (co, amt, by) {
  var B = UAE.bankSeg(co); B.funded = B.funded || 0; if (UAE.capLog) UAE.capLog(co);
  if (amt > 0) {
    var free = UAE.groupFreeCash(co);
    if (amt > free) return { ok: false, why: 'The company only has ' + UAE.fmt.aed(free) + ' of cash available (7% of customer deposits stays as reserve).' };
    UAE.L.invest(co, amt); B.capital += amt; B.funded += amt; UAE.capRecord(co, 'bank', amt, by); return { ok: true };
  }
  var w = -amt, max = UAE.bankMaxWithdraw(co);
  if (w > max) return { ok: false, why: 'You can withdraw at most ' + UAE.fmt.aed(max) + ' – only money you injected (' + UAE.fmt.aed(B.funded) + '), and the bank must keep capital ≥ 13% of risk-weighted loans and 7% of deposits in cash.' };
  UAE.L.divest(co, w, w); B.capital -= w; B.funded -= w; UAE.capRecord(co, 'bank', -w, by); return { ok: true };
};
UAE.bankMaxWithdraw = function (co) {
  var B = UAE.bankSeg(co), eq = UAE.bankEquity(co), rw = UAE.riskWeighted(co);
  var byCapital = eq - rw * UAE.BANK.minCAR, byCash = UAE.bankCash(co) - co.bs.custDeposits * (UAE.BANK.reserve + 0.02);
  return Math.max(0, Math.min(B.funded || 0, byCapital, byCash, co.bs.invest));
};

/* ------------------------------------------------- insurer division books */
UAE.insSeg = function (co) {
  var I = UAE.insOf(co);
  if (I.capital == null) { I.capital = Math.max((I.gwpYear || 0) * 0.35, 5e7); I.retained = 0; I.is = { months: [], ytd: {} }; I.standard = I.standard || 'normal'; }
  return I;
};
UAE.insEquity = function (co) { var I = UAE.insSeg(co); return I.capital + I.retained + UAE.monthPL(UAE.insFirms(co)) + ((I.cur && I.cur.trade) || 0); };
/** Realised gains / losses on shares and bonds sold by a company with an insurer: they go to the insurer's own income statement. */
UAE.trackTradeGain = function (co, g) { if (co.ins && UAE.insFirms(co).length && (!co.policy || co.policy.stocksViaIns !== false)) UAE.segAdd(UAE.insSeg(co), 'trade', g); };
/** Trading account choices: personal account plus every company you control (parent, subsidiaries, insurer). */
UAE.tradeAccounts = function (excludeCoId) {
  var S = UAE.S, out = [{ key: 'P:' + S.playerPerson, label: 'Personal account (' + UAE.fmt.aed(UAE.playerPerson().cash) + ')' }];
  UAE.allCos().forEach(function (c) { if (c.controller === 'PLAYER' && !c.foreign && c.status !== 'BANKRUPT' && c.id !== excludeCoId) out.push({ key: 'C:' + c.id, label: c.name + ' (' + UAE.fmt.aed(c.bs.cash) + ')' }); });
  return out;
};
UAE.insReserves = function (co) { var I = UAE.insSeg(co); return (I.gwpYear || 0) * (0.25 + 0.2 * (co._claims || 0.6)); };   // unearned premiums + claims not yet paid
UAE.insCash = function (co) { return UAE.insEquity(co) + UAE.insReserves(co); };
UAE.insSolvency = function (co) { var I = UAE.insSeg(co), net = (I.gwpYear || 0) * (1 - I.reinsure); return net > 0 ? UAE.insEquity(co) / net : 9.99; };
UAE.insCapital = function (co, amt, by) {
  var I = UAE.insSeg(co); I.funded = I.funded || 0; if (UAE.capLog) UAE.capLog(co);
  if (amt > 0) {
    var free = UAE.groupFreeCash(co);
    if (amt > free) return { ok: false, why: 'The company only has ' + UAE.fmt.aed(free) + ' of cash available.' };
    UAE.L.invest(co, amt); I.capital += amt; I.funded += amt; UAE.capRecord(co, 'ins', amt, by); return { ok: true };
  }
  var w = -amt, max = UAE.insMaxWithdraw(co);
  if (w > max) return { ok: false, why: 'You can withdraw at most ' + UAE.fmt.aed(max) + ' – only money you injected (' + UAE.fmt.aed(I.funded) + '), and solvency must stay above 15% (with a safety margin).' };
  UAE.L.divest(co, w, w); I.capital -= w; I.funded -= w; UAE.capRecord(co, 'ins', -w, by); return { ok: true };
};
UAE.insMaxWithdraw = function (co) {
  var I = UAE.insSeg(co), net = (I.gwpYear || 0) * (1 - I.reinsure);
  return Math.max(0, Math.min(I.funded || 0, UAE.insEquity(co) - net * UAE.INS.minSolvency * 1.2, co.bs.invest));
};
UAE.INS.standards = { strict: { share: 0.75, loss: 0.85, mix: [55, 35, 10] }, normal: { share: 1, loss: 1, mix: [35, 45, 20] }, loose: { share: 1.3, loss: 1.2, mix: [20, 45, 35] } };

/* ---------------------------------------------- month end: close the books */
UAE.financeMonth = function () {
  UAE.allCos().forEach(function (co) {
    if (co.bank && UAE.bankFirms(co).length) {
      var B = UAE.bankSeg(co), firms = UAE.bankFirms(co), pl = firms.reduce(function (s, f) { return s + (f.last ? f.last.profit : 0); }, 0);
      var c = B.cur || {}, opex = firms.reduce(function (s, f) { return s + (f.last ? f.last.cost : 0); }, 0) - (c.intExp || 0) - (c.prov || 0);
      var row = { day: UAE.S.day, intInc: c.intInc || 0, gameInt: c.gameInt || 0, treas: c.treas || 0, fees: c.fees || 0, brokerage: c.brokerage || 0, underwriting: c.underwriting || 0,
        intExp: c.intExp || 0, prov: c.prov || 0, opex: Math.max(0, opex), net: pl };
      B.retained += pl; B.is.months.push(row); if (B.is.months.length > 24) B.is.months.shift();
      Object.keys(row).forEach(function (k) { if (k !== 'day') B.is.ytd[k] = (B.is.ytd[k] || 0) + row[k]; });
      if (UAE.cal.isYearEnd(UAE.S.day)) B.is.ytd = {};
      B.cur = {};
    }
    if (co.ins && UAE.insFirms(co).length) {
      var I = UAE.insSeg(co), ifs = UAE.insFirms(co), ipl = ifs.reduce(function (s, f) { return s + (f.last ? f.last.profit : 0); }, 0), d = I.cur || {};
      var tg = d.trade || 0;
      var irow = { day: UAE.S.day, gwp: d.gwp || 0, ceded: d.ceded || 0, claims: d.claims || 0, recovered: d.recovered || 0, comm: d.comm || 0, invest: d.invest || 0, trade: tg,
        opex: Math.max(0, ifs.reduce(function (s, f) { return s + (f.last ? f.last.cost : 0); }, 0) - ((d.claims || 0) - (d.recovered || 0)) - (d.ceded || 0) - (d.comm || 0)), net: ipl + tg };
      I.retained += ipl + tg; I.is.months.push(irow); if (I.is.months.length > 24) I.is.months.shift();
      Object.keys(irow).forEach(function (k) { if (k !== 'day') I.is.ytd[k] = (I.is.ytd[k] || 0) + irow[k]; });
      if (UAE.cal.isYearEnd(UAE.S.day)) I.is.ytd = {};
      I.cur = {};
    }
  });
};
/** Daily accumulation of the division income-statement lines (called by bankDay / insDay). */
UAE.segAdd = function (seg, k, v) { seg.cur = seg.cur || {}; seg.cur[k] = (seg.cur[k] || 0) + (v || 0); };

/* AI banks / insurers manage their own capital: keep CAR around 18% and solvency around 40%. */
UAE.segAutoCapital = function (co) {
  if (UAE.isHuman(co)) return;
  if (co.bank && UAE.bankFirms(co).length) { var car = UAE.bankCAR(co), rw = UAE.riskWeighted(co); if (car < 0.16) UAE.bankCapital(co, Math.min(rw * 0.18 - UAE.bankEquity(co), co.bs.cash * 0.3), 'auto'); }
  if (co.ins && UAE.insFirms(co).length && UAE.insSolvency(co) < 0.3) UAE.insCapital(co, Math.min((co.ins.gwpYear || 0) * 0.1, co.bs.cash * 0.2), 'auto');
};

/* ============================================================================
 * INTERNATIONAL LENDING DESK
 * UAE customers only want so much credit; a bank with far more cash (e.g. capital injected by the CEO) lends the
 * SURPLUS abroad: loans to borrowers in the 11 other World-ranking countries (syndicated corporate & sovereign loans).
 * Rate = that country's current policy rate + a risk spread; default risk rises in that country's recessions.
 * The surplus = bank cash beyond depositor reserves, a liquidity buffer and room for UAE loan growth, so UAE customers
 * always come first. Capital limits apply (risk weight 100%). Spreads & default rates are EST.
 * ==========================================================================*/
UAE.INTL_RISK = {   // spread over the policy rate, yearly default rate (EST)
  US: [0.012, 0.004], CN: [0.018, 0.009], DE: [0.010, 0.003], JP: [0.009, 0.003], IN: [0.026, 0.016], GB: [0.012, 0.004],
  FR: [0.011, 0.0035], CA: [0.011, 0.0035], BR: [0.032, 0.022], KR: [0.013, 0.005], SA: [0.016, 0.007]
};
UAE.INTL = { share: 0.8, maxCountry: 0.35, drift: 0.01 };
UAE.intlBook = function (B) { if (!B.intl) B.intl = {}; return B.intl; };
UAE.intlTotal = function (B) { var t = 0, I = B.intl || {}; for (var k in I) t += I[k]; return t; };
/** Today's terms for lending to one country. */
UAE.intlTerms = function (id) {
  var n = UAE.S.world && UAE.S.world.nations[id], r = UAE.INTL_RISK[id] || [0.02, 0.01]; if (!n) return null;
  var pd = r[1] * Math.max(0.5, 1 - 1.2 * (n.cycle || 0));                     // recessions (cycle < 0) raise defaults
  return { rate: (n.rate || 0.03) + r[0], pd: pd, net: (n.rate || 0.03) + r[0] - pd, n: n };
};
/** Surplus the bank can lend abroad after UAE needs (reserves, buffer, room to reach UAE loan demand). */
UAE.intlSurplus = function (co) {
  var B = UAE.bankOf(co), T = B.target || {}, dom = ['corp', 'mort', 'cons'].reduce(function (s, k) { return s + Math.max(0, (T[k] || 0) - B.book[k]); }, 0);
  var cash = Math.min(UAE.bankCash(co), co.bs.cash), keep = co.bs.custDeposits * (UAE.BANK.reserve + UAE.BANK.buffer + 0.05) + dom;
  return Math.max(0, cash + UAE.intlTotal(B) - keep);                        // what could be abroad in total
};
/** Daily: move the foreign loan books toward their targets, earn interest, book defaults. */
UAE.intlLendDay = function (co, f) {
  var B = UAE.bankOf(co), I = UAE.intlBook(B), share = B.intlShare == null ? UAE.INTL.share : B.intlShare;
  var ids = Object.keys(UAE.INTL_RISK).filter(function (id) { return UAE.S.world && UAE.S.world.nations[id]; });
  if (!ids.length) return;
  var terms = {}; ids.forEach(function (id) { terms[id] = UAE.intlTerms(id); });
  var capRoom = Math.max(0, UAE.bankEquity(co) / UAE.BANK.minCAR - (UAE.riskWeighted(co) - UAE.intlTotal(B)));
  var total = Math.min(UAE.intlSurplus(co) * share, capRoom);
  // allocation: by return after expected losses (squared, so better terms get more), at most 35% per country
  var w = {}, tw = 0; ids.forEach(function (id) { w[id] = Math.pow(Math.max(0.001, terms[id].net), 2); tw += w[id]; });
  var tgt = {}, spill = 0; ids.forEach(function (id) { tgt[id] = total * w[id] / tw; if (tgt[id] > total * UAE.INTL.maxCountry) { spill += tgt[id] - total * UAE.INTL.maxCountry; tgt[id] = total * UAE.INTL.maxCountry; } });
  if (spill > 0) { var free = ids.filter(function (id) { return tgt[id] < total * UAE.INTL.maxCountry; }), fw = free.reduce(function (s, id) { return s + w[id]; }, 0); free.forEach(function (id) { tgt[id] = Math.min(total * UAE.INTL.maxCountry, tgt[id] + spill * w[id] / fw); }); }
  var inc = 0, loss = 0;
  ids.forEach(function (id) {
    var cur = I[id] || 0, d = (tgt[id] - cur) * UAE.INTL.drift;
    if (d > 0) { d = Math.min(d, Math.max(0, Math.min(UAE.bankCash(co), co.bs.cash) - co.bs.custDeposits * (UAE.BANK.reserve + UAE.BANK.buffer))); if (d > 0) UAE.L.bankLend(co, d); }
    else if (d < 0) { d = Math.max(d, -cur); UAE.L._cash(co, -d, 'op'); co.bs.loanBook += d; }
    cur += d; I[id] = cur;
    var t = terms[id]; inc += cur * t.rate / 365;
    var l = Math.min(cur, cur * t.pd / 365); I[id] -= l; loss += l;
  });
  if (inc > 0) { UAE.fIncome(f, 'interestInc', inc); UAE.segAdd(B, 'intInc', inc); UAE.segAdd(B, 'intl', inc); }
  if (loss > 0) { UAE.L.writeDown(co, 'otherOpex', loss, 'loanBook'); f.m.cost += loss; UAE.segAdd(B, 'prov', loss); UAE.segAdd(B, 'intlLoss', loss); }
  B.intlLast = { day: UAE.S.day, target: total, inc: inc, loss: loss };
};
