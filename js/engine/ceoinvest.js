/* ============================================================================
 * UAE CAPITALISM LAB  -  CEO PERSONALITY & CEO INVESTMENTS
 *  1. Personality: a company run by a hired CEO now behaves with that CEO's personality
 *     (expansion aggressiveness, risk appetite, pricing, diversification -> co.traits).
 *  2. Excess cash (tick in HQ -> Executive team): after the month's expansion, cash above a
 *     6-month cushion goes 50% into the company's bank and 50% into its insurer (as capital).
 *     If cash later runs short, the CEO takes injected money back.
 *  3. Stock investing (tick): the CEO analyses every listed company - P/E, fair value vs price
 *     (earnings & book value), revenue growth, profit trend - buys the best-value stocks and
 *     sells overvalued or loss-making ones. With "through the insurance HQ" ticked, the gains
 *     and losses are reported on the insurer's income statement (its investment portfolio).
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/** Headquarters are never closed as "loss-making": the Bank / Insurance HQ hold the division's capital. */
UAE.isHeadOffice = function (f) { return f.type === 'hq' || f.type === 'bankhq' || f.type === 'inshq'; };
/** Never closed as "loss-making": headquarters, and bank branches / insurance offices (their revenue is booked at the HQ). */
UAE.neverCloseAsLoser = function (f) {
  if (UAE.isHeadOffice(f) || f.type === 'bankbranch' || f.type === 'insoffice') return true;
  if (f.type === 'rnd') return true;                                          // R&D is an investment: always a loss on its own
  if (f.project) return true;                                                 // a firm with a research project running (software, R&D)
  // producers that supply your own firms deliver at cost (no revenue of their own): their profit shows at the store, so a
  // factory / farm / mine / warehouse that delivered goods this month is not a loser
  var k = UAE.FIRM_TYPES[f.type].kind;
  return ['factory', 'farm', 'mine', 'oil', 'warehouse'].indexOf(k) >= 0 && f.lines.some(function (l) { return (l.sold || 0) > 0; });
};
UAE.ceoPerson = function (co) { var p = co && co.ceo && UAE.person(co.ceo); return p && !p.isPlayer ? p : null; };
/** The company takes on its hired CEO's personality. */
UAE.syncTraits = function (co) {
  var p = UAE.ceoPerson(co); if (!p || !p.pers || !UAE.isHuman(co)) return;
  co.traits = { aggression: p.pers.aggression, risk: p.pers.risk, pricing: p.pers.pricing, diversify: p.pers.diversify };
};
/** Max a CEO's drive: expansion aggressiveness, risk appetite and diversification to 100 (pricing unchanged). */
UAE.maxPersonality = function (p) {
  UAE.ensurePerson(p); p.pers.aggression = 1; p.pers.risk = 1; p.pers.diversify = 1;
  if (p.co) UAE.syncTraits(UAE.co(p.co));
};

/* ------------------------------------------------------------ excess cash */
UAE.monthCosts = function (co) {
  var ms = co.is && co.is.months; if (!ms || !ms.length) return 0;
  var m = ms[ms.length - 1]; return Math.max(0, (m.revenue || 0) + (m.interestInc || 0) + (m.investInc || 0) - UAE.netIncome(m));
};
UAE.cashCushion = function (co) { return Math.max(UAE.monthCosts(co) * 6, 5e8); };
UAE.hasBank = function (co) { return !!(co.bank && UAE.bankFirms(co).some(function (f) { return f.type === 'bankhq'; })); };
UAE.hasIns = function (co) { return !!(co.ins && UAE.insFirms(co).some(function (f) { return f.type === 'inshq'; })); };

UAE.ceoInvestMonth = function (co) {
  var pol = UAE.policy(co), ceo = UAE.ceoPerson(co);
  if (!ceo || co.foreign || (!pol.investExcess && !pol.investStocks)) return;
  var A = UAE.fmt.aed, cushion = UAE.cashCushion(co), free = UAE.groupFreeCash(co), log = [];
  // short of cash: take injected money back from the bank / insurer first
  if (free < cushion * 0.5) {
    var need = cushion - free;
    if (UAE.hasBank(co)) { var wb = Math.min(need, UAE.bankMaxWithdraw(co)); if (wb > 1e6 && UAE.bankCapital(co, -wb, 'ceo').ok) { need -= wb; log.push('took ' + A(wb) + ' back from the bank'); } }
    if (need > 0 && UAE.hasIns(co)) { var wi = Math.min(need, UAE.insMaxWithdraw(co)); if (wi > 1e6 && UAE.insCapital(co, -wi, 'ceo').ok) log.push('took ' + A(wi) + ' back from the insurer'); }
  }
  var excess = UAE.groupFreeCash(co) - cushion;
  co.ceoInvest = { day: UAE.S.day, cushion: cushion, excess: Math.max(0, excess), bank: 0, ins: 0, stocks: 0, bonds: 0, bondsSold: 0, sold: 0, picks: [] };
  UAE.investMix(pol);
  // still short after the bank / insurer: sell bonds (they are the most liquid)
  if (UAE.groupFreeCash(co) < cushion * 0.5) {
    var gotB = UAE.ceoSellBonds(co, cushion - UAE.groupFreeCash(co)); if (gotB > 0) { log.push('sold ' + A(gotB) + ' of bonds to rebuild the cash cushion'); excess = UAE.groupFreeCash(co) - cushion; }
  }
  // 1 bond market - pol.bondPct of the excess (default 10%); whatever finds no bond goes to stocks
  var bondBudget = 0, bondLeft = 0;
  if (pol.investBonds !== false && excess > 0) {
    bondBudget = excess * pol.bondPct / 100;
    var bspent = UAE.ceoBuyBonds(co, bondBudget); co.ceoInvest.bonds = bspent; excess -= bspent;
    bondLeft = Math.max(0, bondBudget - bspent);
    if (bspent > 0) log.push('bought ' + A(bspent) + ' of bonds');
  }
  // 2 stock market (analysis below) - pol.stockPct of the excess (default 40%) + any unspent bond money, and sells overvalued holdings every month
  if (pol.investStocks) {
    var sold = UAE.ceoSellStocks(co); co.ceoInvest.sold = sold; if (sold > 0) log.push('sold ' + A(sold) + ' of overvalued shares');
    if (excess > 0) {
      var spent = UAE.ceoBuyStocks(co, Math.min(excess, (excess + (bondBudget - bondLeft)) * pol.stockPct / 100 + bondLeft));
      co.ceoInvest.stocks = spent; excess -= spent;
      if (spent > 0) log.push('invested ' + A(spent) + ' in ' + co.ceoInvest.picks.filter(function (p) { return !p.bond && p.action === 'buy'; }).length + ' stocks');
    }
  }
  // 3 the rest: 50% bank, 50% insurer (all to one if the other does not exist)
  if (pol.investExcess && excess > 1e6) {
    var hb = UAE.hasBank(co), hi = UAE.hasIns(co);
    var toBank = hb ? (hi ? excess / 2 : excess) : 0, toIns = hi ? excess - toBank : 0;
    if (toBank > 0 && UAE.bankCapital(co, toBank, 'ceo').ok) { co.ceoInvest.bank = toBank; log.push(A(toBank) + ' into the bank'); }
    if (toIns > 0 && UAE.insCapital(co, toIns, 'ceo').ok) { co.ceoInvest.ins = toIns; log.push(A(toIns) + ' into the insurer'); }
    if (!hb && !hi) log.push('no bank or insurer to invest in – build a Bank HQ / Insurance HQ');
    else if (!hi) log.push('no Insurance HQ, so the insurer\'s half went to the bank' + ((co.ins && co.ins.funded) ? ' (build an Insurance HQ to reach the ' + A(co.ins.funded) + ' already in the insurer)' : ''));
    else if (!hb) log.push('no Bank HQ, so the bank\'s half went to the insurer');
  }
  if (log.length && UAE.isHuman(co)) UAE.news(ceo.name + ' (CEO, ' + co.name + ') ' + log.join(', ') + '.', 'finance');
};

/* ------------------------------------------------------------ bond market */
/** Investment mix: 40% stocks, 10% bonds (rest to bank / insurer). Old saves move to the new mix once. */
UAE.investMix = function (pol) {
  if (pol.bondPct == null) { pol.bondPct = 10; pol.stockPct = 40; }
  if (pol.stockPct == null) pol.stockPct = 40;
  return pol;
};
/** Face value of bond b still held by the market (not by companies). */
UAE.bondFloat = function (b) {
  var held = 0; UAE.allCos().forEach(function (c) { var p = c.bondPositions && c.bondPositions[b.id]; if (p) held += p.face; });
  return Math.max(0, b.face - held);
};
/** Bonds the CEO may buy: not matured, more than 6 months left, not our own issue; best yield first. */
UAE.bondPicks = function (co) {
  var S = UAE.S;
  return Object.keys(S.bonds).map(function (id) { return S.bonds[id]; }).filter(function (b) {
    if (b.matured || b.maturity - S.day < 180) return false;
    if (b.issuer === 'CO:' + co.id) return false;
    if (b.issuer.indexOf('CO:') === 0) { var ic = UAE.co(b.issuer.slice(3)); if (!ic || ic.status === 'BANKRUPT' || (UAE.isHuman(co) && UAE.isHuman(ic)) || ic.parent === co.id || co.parent === ic.id) return false; }   // never our own group
    return UAE.bondFloat(b) > 1e5;
  }).sort(function (a, b) { return (b.ytm || b.coupon) - (a.ytm || a.coupon); });
};
/** Spend up to budget on bonds (max 5 issues, at most 50% of any issue's float). Returns AED spent. */
UAE.ceoBuyBonds = function (co, budget, reserve) {
  if (budget < 1e6) return 0;
  // best yield first; keep going down the list until the budget is spent (max 5 issues a month).
  // reserve = share of each issue left for other investors (computer companies leave 40% for you)
  var picks = UAE.bondPicks(co), spent = 0, buys = 0, slots = 5;
  for (var i = 0; i < picks.length && buys < slots; i++) {
    var b = picks[i], left = budget - spent; if (left < 1e5) break;
    var avail = UAE.bondFloat(b) - b.face * (reserve || 0); if (avail < 1e6) continue;
    var amt = Math.min(left / (slots - buys), avail * 0.5 * b.price / 100, UAE.groupFreeCash(co));
    var face = Math.floor(amt / (b.price / 100)); if (face < 1e5) continue;
    var r = UAE.tradeBond(co, b.id, face);
    if (r.ok) { spent += r.cost; buys++; if (co.ceoInvest) co.ceoInvest.picks.push({ id: b.id, name: b.name, ticker: 'BOND', amount: r.cost, action: 'buy', why: 'bond yield ' + ((b.ytm || b.coupon) * 100).toFixed(2) + '%, matures ' + UAE.cal.label(b.maturity), bond: true }); }
  }
  return spent;
};
/** Sell bonds (lowest yield first) to raise about need. Returns AED raised. */
UAE.ceoSellBonds = function (co, need) {
  var got = 0, S = UAE.S;
  Object.keys(co.bondPositions || {}).map(function (id) { return S.bonds[id]; }).filter(function (b) { return b && !b.matured && co.bondPositions[b.id].face > 0; })
    .sort(function (a, b) { return (a.ytm || a.coupon) - (b.ytm || b.coupon); }).forEach(function (b) {
      if (got >= need) return;
      var pos = co.bondPositions[b.id], face = Math.min(pos.face, Math.ceil((need - got) / (b.price / 100)));
      var r = UAE.tradeBond(co, b.id, -face);
      if (r.ok) { got += r.proceeds; if (co.ceoInvest) co.ceoInvest.picks.push({ id: b.id, name: b.name, ticker: 'BOND', amount: r.proceeds, action: 'sell', why: 'cash cushion', bond: true }); }
    });
  if (co.ceoInvest) co.ceoInvest.bondsSold = got;
  return got;
};

/* ---- a living bond market: governments roll over their debt, companies issue, investors buy ---------------
 * Monthly (from UAE.monthEnd):
 *  1 every emirate (and the federal government) keeps 2 sovereign issues outstanding (SYN): when fewer than 2
 *    have more than a year left, it issues a new 3-15 year bond sized ~0.4% of its GDP;
 *  2 a few profitable listed computer companies issue 5-10 year corporate bonds (5% of equity);
 *  3 computer companies with spare cash put 3% of it into bonds (best yield first, up to 50% of an issue);
 *  4 bonds that matured more than a year ago leave the list. */
UAE.SOV_ISSUERS = [['DXB', 'Government of Dubai', 0.008], ['AUH', 'Abu Dhabi Govt', 0.004], ['SHJ', 'Sharjah Govt', 0.018], ['RAK', 'RAK Govt', 0.012],
  ['AJM', 'Ajman Govt', 0.02], ['FUJ', 'Fujairah Govt', 0.02], ['UAQ', 'Umm Al Quwain Govt', 0.022], ['', 'UAE Federal T-Bond', 0.002]];
UAE.bondMarketMonth = function () {
  var S = UAE.S, R = UAE.rng, rate = S.macro.rate, A = UAE.fmt.aed, ids = Object.keys(S.bonds);
  // 4 tidy up
  ids.forEach(function (id) { var b = S.bonds[id]; if (b.matured && b.maturity < S.day - 365) delete S.bonds[id]; });
  // 1 sovereign rollover
  UAE.SOV_ISSUERS.forEach(function (g) {
    var k = g[0], iss = 'GOV:' + (k || 'UAE');
    if (k && !S.cities[k]) return;
    var live = Object.keys(S.bonds).filter(function (id) { var b = S.bonds[id]; return b.issuer === iss && !b.matured && b.maturity - S.day > 365; }).length;
    if (live >= 2) return;
    var gdp = k ? (UAE.cityGdp ? UAE.cityGdp(S.cities[k]) : S.cities[k].gdp) : Object.keys(S.cities).reduce(function (t, c) { return t + (UAE.cityGdp ? UAE.cityGdp(S.cities[c]) : S.cities[c].gdp); }, 0) * 0.5;
    var yrs = R.pick([3, 5, 7, 10, 15]), face = Math.max(1e9, Math.round(gdp * 1e9 * 0.004 / 1e8) * 1e8), yr = UAE.cal.year() + yrs;
    var id = 'GOV' + (k || 'UAE') + yr + '_' + S.day;
    S.bonds[id] = { id: id, name: g[1] + ' ' + yr + ' (SYN)', issuer: iss, city: k, face: face, coupon: Math.round((rate + g[2] + 0.005) * 1e4) / 1e4,
      spread: g[2], maturity: S.day + yrs * 365, price: 100, hist: [], sovereign: true };
    UAE.news('🏛 ' + g[1] + ' issues a new ' + yrs + '-year bond: ' + A(face) + ' at ' + ((rate + g[2] + 0.005) * 100).toFixed(2) + '% (Bond Market).', 'gov');
  });
  // 2 corporate issues
  var live = {}; Object.keys(S.bonds).forEach(function (id) { var b = S.bonds[id]; if (!b.matured && b.issuer.indexOf('CO:') === 0) live[b.issuer.slice(3)] = 1; });
  UAE.allCos().filter(function (c) {
    return !UAE.isHuman(c) && !c.foreign && c.status === 'LISTED' && !live[c.id] && (c.credit === 'AA' || c.credit === 'A') && UAE.netIncome(UAE.ttm(c)) > 0 && UAE.totals(c).equity > 2e9;
  }).sort(function () { return R.next() - 0.5; }).slice(0, 2).forEach(function (c) {
    if (!R.chance(0.35)) return;
    var amt = Math.min(UAE.totals(c).equity * 0.05, 50e9), yrs = R.pick([5, 7, 10]);
    if (UAE.issueBond(c, amt, yrs).ok) UAE.news(c.name + ' issues a ' + yrs + '-year corporate bond: ' + A(amt) + ' (Bond Market).', 'finance');
  });
  // 3 computer investors buy
  UAE.allCos().forEach(function (c) {
    if (UAE.isHuman(c) || c.foreign || c.status === 'BANKRUPT') return;
    var spare = UAE.groupFreeCash(c) - UAE.cashCushion(c) * 1.5; if (spare < 5e7) return;
    var keep = c.ceoInvest; c.ceoInvest = null;
    UAE.ceoBuyBonds(c, spare * 0.03, 0.4);
    c.ceoInvest = keep;
  });
};

/* ---------------------------------------------------------- stock analysis */
/** Investment analysis of a listed company: P/E, fair value, upside, revenue growth, profit trend, score. */
UAE.stockAnalysis = function (c) {
  if (!UAE.isTradable(c) || !(c.price > 0)) return null;
  var ttm = UAE.ttm(c), ni = UAE.netIncome(ttm), eps = ni / Math.max(1, c.shares), pe = eps > 0 ? c.price / eps : null;
  var ms = (c.is && c.is.months) || [], n = Math.min(12, Math.floor(ms.length / 2)), growth = 0, trend = 0;
  if (n >= 3) {
    var sum = function (a, k) { return a.reduce(function (t, m) { return t + (k === 'ni' ? UAE.netIncome(m) : m.revenue || 0); }, 0); };
    var rNow = sum(ms.slice(-n)), rPrev = sum(ms.slice(-2 * n, -n)); growth = rPrev > 0 ? rNow / rPrev - 1 : 0;
    var pNow = sum(ms.slice(-n), 'ni'), pPrev = sum(ms.slice(-2 * n, -n), 'ni'); trend = pPrev > 0 ? pNow / pPrev - 1 : (pNow > 0 ? 0.3 : -0.3);
    if (n < 12) { growth = Math.pow(1 + growth, 12 / n) - 1; trend = Math.pow(Math.max(0.01, 1 + trend), 12 / n) - 1; }
  } else if (c.foreign) { growth = c.growth || 0.05; trend = growth; }
  var fair = UAE.fundamental(c), upside = fair > 0 ? fair / c.price - 1 : 0;
  growth = Math.max(-0.5, Math.min(1.5, growth)); trend = Math.max(-1, Math.min(2, trend));
  var peg = pe && growth > 0.01 ? pe / (growth * 100) : null;
  var score = upside + 0.5 * growth + 0.15 * trend + (pe ? (18 - Math.min(pe, 60)) / 40 : -1) + (peg && peg < 1 ? 0.15 : 0);
  return { c: c, pe: pe, eps: eps, fair: fair, upside: upside, growth: growth, trend: trend, peg: peg, ni: ni, score: score };
};
/** Listed companies the CEO may invest in: not your own companies or their parents / subsidiaries. */
UAE.investable = function (co) {
  return UAE.allCos().filter(function (c) {
    return c.id !== co.id && c.status !== 'BANKRUPT' && c.controller !== 'PLAYER' && UAE.isTradable(c) && (c.holders.PUBLIC || 0) > 0 && c.parent !== co.id && co.parent !== c.id;
  });
};
/** Buy rule. UAE stocks: value picks (P/E < 30, 8%+ below fair value). Global (NYSE / NASDAQ):
 * quality growth - big profitable companies priced near fair value, growing revenue 5%+ a year. */
UAE.CEO_GROUP_CAP = 0.45;   // CEOs stop when your group (you + all your companies) would own more than this
UAE.isBuy = function (a) {
  if (!a || !a.pe || a.ni <= 0 || a.pe >= 30) return false;
  return a.c.foreign ? a.upside > -0.05 && a.growth > 0.05 && a.score > 0.2 : a.upside > 0.08 && a.score > 0;
};
/** Plain-language reasons the CEO gives for buying. */
UAE.buyReason = function (a) {
  var r = [];
  r.push('P/E ' + a.pe.toFixed(1) + (a.pe < 10 ? ' (very cheap)' : a.pe < 18 ? ' (cheap)' : ''));
  if (a.upside > 0.02) r.push(Math.round(a.upside * 100) + '% below fair value'); else r.push('priced near fair value');
  if (a.growth > 0.01) r.push('revenue +' + Math.round(a.growth * 100) + '%/yr');
  r.push(a.trend > 0.05 ? 'profit rising ' + Math.round(a.trend * 100) + '%' : a.trend < -0.05 ? 'profit dipping but still profitable' : 'steady profit');
  if (a.peg && a.peg < 1) r.push('PEG ' + a.peg.toFixed(2) + ' (growth is cheap)');
  if (a.c.foreign) r.push('global diversification (' + a.c.exch + ')');
  return r.join(', ');
};
UAE.ceoBuyStocks = function (co, budget) {
  if (budget < 1e6) return 0;
  var pol = UAE.policy(co), all = UAE.investable(co).map(UAE.stockAnalysis).filter(UAE.isBuy).sort(function (a, b) { return b.score - a.score; });
  var glob = pol.investGlobal === false ? [] : all.filter(function (a) { return a.c.foreign; }).slice(0, 4);
  var home = all.filter(function (a) { return !a.c.foreign; }).slice(0, 6);
  var gShare = glob.length ? (home.length ? (pol.globalPct == null ? 40 : pol.globalPct) / 100 : 1) : 0;
  return UAE.ceoBuyList(co, home, budget * (1 - gShare)) + UAE.ceoBuyList(co, glob, budget * gShare);
};
UAE.ceoBuyList = function (co, picks, budget) {
  if (!picks.length || budget < 1e6) return 0;
  var tw = picks.reduce(function (t, a) { return t + a.score; }, 0), spent = 0, key = 'C:' + co.id;
  picks.forEach(function (a) {
    var c = a.c, held = c.holders[key] || 0, cap = Math.max(0, c.shares * 0.2 - held);       // at most 20% of any company per buyer
    var tot = 0; for (var hk in c.holders) tot += c.holders[hk];
    cap = Math.min(cap, Math.max(0, tot * UAE.CEO_GROUP_CAP - UAE.playerStake(c) * tot));     // and the whole group at most 45%: never an accidental takeover
    var qty = Math.floor(Math.min(budget * a.score / tw / (c.price * 1.01), cap, (c.holders.PUBLIC || 0) * 0.25));
    if (qty < 1) return;
    var r = UAE.buyShares(key, c, qty);
    if (r.ok) { spent += r.cost; co.ceoInvest.picks.push({ id: c.id, name: c.name, ticker: c.ticker, pe: a.pe, upside: a.upside, growth: a.growth, amount: r.cost, action: 'buy', why: UAE.buyReason(a), global: !!c.foreign }); }
  });
  return spent;
};
UAE.ceoSellStocks = function (co) {
  var key = 'C:' + co.id, got = 0;
  UAE.investable(co).forEach(function (c) {
    var q = c.holders[key] || 0; if (!q) return;
    var a = UAE.stockAnalysis(c); if (!a) return;
    var why = a.ni <= 0 ? 'now loss-making' : a.upside < -0.12 ? 'overvalued (' + Math.round(-a.upside * 100) + '% above fair value)' : a.pe > 45 ? 'P/E ' + a.pe.toFixed(0) + ' too high' : null;
    if (!why) return;
    var r = UAE.sellShares(key, c, q);
    if (r.ok) { got += r.proceeds; co.ceoInvest.picks.push({ id: c.id, name: c.name, ticker: c.ticker, pe: a.pe, upside: a.upside, growth: a.growth, amount: r.proceeds, action: 'sell', why: why }); }
  });
  return got;
};
/** The company's stock portfolio (held by the company itself) with current value and gain vs cost. */
UAE.stockPortfolio = function (co) {
  var key = 'C:' + co.id, out = [];
  UAE.allCos().forEach(function (c) {
    var q = c.holders && c.holders[key]; if (!q || !UAE.isTradable(c) || c.controller === 'PLAYER') return;
    var cost = co.portfolio[c.id] || 0, val = q * c.price; out.push({ c: c, qty: q, cost: cost, value: val, gain: val - cost, a: UAE.stockAnalysis(c) });
  });
  return out.sort(function (a, b) { return b.value - a.value; });
};

/* ------------------------------------------------ capital injection record */
/* co.capLog: running totals per HQ (bank / ins) and per source (ceo / you / auto), plus the latest 400 entries.
 * Saves from before the record: rebuilt from the news feed (CEO lines) and an "earlier" opening balance. */
UAE.parseAedText = function (s) {
  var m = /AED ([\d.]+)(T|bn|m|k)?/.exec(s); if (!m) return 0;
  return +m[1] * ({ T: 1e12, bn: 1e9, m: 1e6, k: 1e3 }[m[2]] || 1);
};
/* CEO injections recovered from older saves / backups (news lines that have since scrolled out of the feed). */
UAE.CAP_HISTORY = { PLAYER: [[4728, 'bank', 665.03e9], [4728, 'ins', 665.03e9], [4758, 'bank', 22.17e9], [4758, 'ins', 22.17e9]] };
UAE.capLog = function (co) {
  if (co.capLog) return co.capLog;
  var L = co.capLog = { bank: { ceo: 0, you: 0, auto: 0, earlier: 0, outCeo: 0, outYou: 0, outAuto: 0 }, ins: { ceo: 0, you: 0, auto: 0, earlier: 0, outCeo: 0, outYou: 0, outAuto: 0 }, list: [], since: UAE.S.day };
  var tag = '(CEO, ' + co.name + ')', net = { bank: 0, ins: 0 }, had = {};
  (UAE.CAP_HISTORY[co.id] || []).forEach(function (h) {
    if (!co[h[1]] || !(co[h[1]].funded > 0)) return;
    L[h[1]].ceo += h[2]; net[h[1]] += h[2]; had[h[0] + h[1]] = 1;
    L.list.push({ day: h[0], seg: h[1], amt: h[2], by: 'ceo', note: 'recovered from an older save' });
  });
  (UAE.S.news || []).slice().reverse().forEach(function (n) {
    var t = n.text || ''; if (t.indexOf(tag) < 0) return;
    t.split(', ').forEach(function (part) {
      var seg = /into the bank/.test(part) ? 'bank' : /into the insurer/.test(part) ? 'ins' : null, out = false;
      if (!seg && /back from the bank/.test(part)) { seg = 'bank'; out = true; }
      if (!seg && /back from the insurer/.test(part)) { seg = 'ins'; out = true; }
      var v = seg && UAE.parseAedText(part); if (!v || had[n.day + seg]) return;
      if (out) L[seg].outCeo += v; else L[seg].ceo += v;
      net[seg] += out ? -v : v;
      L.list.push({ day: n.day, seg: seg, amt: out ? -v : v, by: 'ceo', note: 'rebuilt from the news feed' });
    });
  });
  ['bank', 'ins'].forEach(function (s) {
    var funded = (co[s] && co[s].funded) || 0, rest = funded - net[s];
    if (rest > 1e6) { L[s].earlier = rest; L.list.unshift({ day: L.since, seg: s, amt: rest, by: 'earlier', note: 'injected before this record started (you or the CEO)' }); }
  });
  L.list.sort(function (a, b) { return a.day - b.day; });
  return L;
};
UAE.capRecord = function (co, seg, amt, by) {
  if (!co || !amt) return; by = by || 'auto';
  var L = UAE.capLog(co), T = L[seg];
  if (amt > 0) T[by] = (T[by] || 0) + amt; else T['out' + by.charAt(0).toUpperCase() + by.slice(1)] = (T['out' + by.charAt(0).toUpperCase() + by.slice(1)] || 0) - amt;
  L.list.push({ day: UAE.S.day, seg: seg, amt: amt, by: by });
  if (L.list.length > 400) L.list.shift();
};
/** Totals for one HQ: injected and withdrawn by each source, and the net amount still in. */
UAE.capSummary = function (co, seg) {
  var T = UAE.capLog(co)[seg];
  var inn = T.ceo + T.you + T.auto + T.earlier, out = T.outCeo + T.outYou + T.outAuto;
  return { ceo: T.ceo, you: T.you, auto: T.auto, earlier: T.earlier, outCeo: T.outCeo, outYou: T.outYou, outAuto: T.outAuto,
    ceoNet: T.ceo - T.outCeo, total: inn, withdrawn: out, net: inn - out, funded: (co[seg] && co[seg].funded) || 0 };
};

/* ---------------------------------------- one-time fix: accidental takeovers (Jan 2046 save) */
UAE.fixAccidentalTakeovers = function () {
  var S = UAE.S; S.fixes = S.fixes || {}; if (S.fixes.takeover2046) return; S.fixes.takeover2046 = true;
  ['ALDAR', 'US_DELL'].forEach(function (id) {
    var c = S.companies[id]; if (!c || c.controller !== 'PLAYER' || c.createdByPlayer || !UAE.isTradable(c)) return;
    var tot = 0, keys = []; for (var k in c.holders) { tot += c.holders[k]; if (k.indexOf('C:') === 0 && UAE.isHuman(UAE.co(k.slice(2))) && c.holders[k] > 0) keys.push(k); }
    var mine = UAE.playerStake(c) * tot, excess = mine - tot * 0.49; if (excess <= 0) return;
    var got = 0;
    keys.forEach(function (k) { var q = Math.ceil(excess * c.holders[k] / mine); var r = UAE.sellShares(k, c, q); if (r.ok) got += r.proceeds; });
    UAE.controlCheck(c);
    UAE.news('Your companies sold ' + UAE.fmt.aed(got) + ' of ' + c.name + ' shares to bring the group stake down to ' + UAE.fmt.pct(UAE.playerStake(c)) +
      ' – the CEOs had taken it over by accident. ' + (c.controller === 'PLAYER' ? '' : c.name + ' is no longer your subsidiary; you keep the stake and its dividends.'), 'finance');
  });
};

/** First supply option that can deliver: has stock, or import. Used so shops never stay stuck on an empty supplier. */
UAE.firstStocked = function (opts) { return opts.find(function (o) { return o.id === 'IMPORT' || o.avail > 0; }) || opts[0]; };
