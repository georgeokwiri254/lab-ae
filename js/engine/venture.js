/* ============================================================================
 * UAE CAPITALISM LAB  -  VENTURE CAPITAL & ANGEL INVESTORS
 * Real UAE / Gulf venture funds (names REAL, fund sizes EST) and SYN angel investors fund the
 * private computer start-ups in rounds: Seed -> Series A -> B -> C -> D. Each round issues new
 * shares at a pre-money valuation (start-up premium over the book/earnings value). Funds hold the
 * stakes (holder key 'V:<fund>'; angels are people, 'P:<person>'), collect dividends, are paid out
 * when a start-up is acquired, and sell their shares on the market after an IPO (6-month lock-up).
 * You can: invest in start-ups yourself (angel, personal cash) or with your company (corporate VC),
 * and pitch your own PRIVATE companies to investors for term sheets (only you can accept - never the CEO).
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* [id, name, base, kind, fund size AED (EST), stages invested in] */
UAE.VC_FUNDS = [
  ['MUBV', 'Mubadala Ventures', 'Abu Dhabi', 'gov', 18e9, [3, 4, 5]],
  ['STV', 'STV', 'Riyadh', 'vc', 5.5e9, [2, 3, 4]],
  ['BECO', 'BECO Capital', 'Dubai', 'vc', 3.7e9, [1, 2, 3]],
  ['SHOROOQ', 'Shorooq Partners', 'Abu Dhabi', 'vc', 3.0e9, [1, 2, 3]],
  ['MEVP', 'MEVP', 'Dubai', 'vc', 1.5e9, [2, 3]],
  ['GV', 'Global Ventures', 'Dubai', 'vc', 1.1e9, [1, 2, 3]],
  ['WAMDA', 'Wamda Capital', 'Dubai', 'vc', 1.1e9, [2, 3]],
  ['DFDF', 'Dubai Future District Fund', 'Dubai', 'gov', 1.0e9, [1, 2, 3]],
  ['NUWA', 'Nuwa Capital', 'Dubai', 'vc', 0.8e9, [1, 2]],
  ['VSOUQ', 'VentureSouq', 'Dubai', 'vc', 0.6e9, [0, 1, 2]],
  ['DAI', 'Dubai Angel Investors (network)', 'Dubai', 'angel', 0.15e9, [0, 1]]
];
/* round sizes in AED and the share of the company sold (dilution) */
UAE.VC_STAGES = [
  { k: 'Pre-seed', min: 1e6, max: 5e6, dil: [0.08, 0.15], prem: [1.0, 1.4] },
  { k: 'Seed', min: 4e6, max: 25e6, dil: [0.12, 0.2], prem: [1.2, 1.8] },
  { k: 'Series A', min: 20e6, max: 90e6, dil: [0.15, 0.22], prem: [1.4, 2.2] },
  { k: 'Series B', min: 80e6, max: 350e6, dil: [0.12, 0.2], prem: [1.5, 2.5] },
  { k: 'Series C', min: 300e6, max: 1.2e9, dil: [0.1, 0.16], prem: [1.5, 2.6] },
  { k: 'Series D', min: 1e9, max: 3.5e9, dil: [0.08, 0.14], prem: [1.4, 2.4] }
];
/** Round that fits a start-up's venture value (bigger companies skip the small rounds). */
UAE.VC_BANDS = [40e6, 150e6, 600e6, 2.5e9, 8e9];
UAE.vcStageFor = function (value) { var i = 0; while (i < UAE.VC_BANDS.length && value >= UAE.VC_BANDS[i]) i++; return i; };
UAE.VC_ANGELS = 12;          // SYN angel investors in the UAE
UAE.VC_LOCKUP = 180;         // days after an IPO before funds start selling
UAE.VC_SELL_PCT = 0.15;      // share of the remaining stake sold each month after the lock-up

UAE.vcInit = function () {
  var S = UAE.S, V = S.vc || (S.vc = { funds: {}, angels: [], deals: [], offers: {} });
  V.offers = V.offers || {}; V.deals = V.deals || []; V.angels = V.angels || [];
  UAE.VC_FUNDS.forEach(function (d) {
    if (V.funds[d[0]]) return;
    V.funds[d[0]] = { id: d[0], name: d[1], base: d[2], kind: d[3], aum: d[4], cash: d[4] * 0.7, stages: d[5], deployed: 0, returned: 0, cost: {}, deals: 0 };
  });
  while (V.angels.length < UAE.VC_ANGELS) {
    var p = UAE.makePerson({ title: 'Angel investor', cash: Math.round(UAE.rng.range(25e6, 450e6) / 1e6) * 1e6, age: UAE.rng.int(38, 70) });
    p.angel = true; p.angelCost = {}; V.angels.push(p.id);
  }
  return V;
};
UAE.vcFund = function (key) { var V = UAE.S.vc; return V && V.funds[key.indexOf('V:') === 0 ? key.slice(2) : key]; };
UAE.vcHolderName = function (key) {
  if (key.indexOf('V:') === 0) { var f = UAE.vcFund(key); return f ? f.name : key.slice(2); }
  var p = UAE.person(key.slice(2)); return p ? p.name : key;
};
/** Money paid to a venture holder (dividend, acquisition, share sale). */
UAE.vcCredit = function (key, amt) {
  var f = UAE.vcFund(key); if (!f) return;
  f.cash += amt; f.returned += amt;
};
/** Can computer investors put money into this company? Private, computer-run, fictional start-up. */
UAE.vcEligible = function (co) {
  return co && co.status === 'PRIVATE' && !co.foreign && !co.soe && !co.real && !UAE.isHuman(co) && co.shares > 0 && co.fictional;
};
/** Venture valuation (pre-money): book/earnings value x a start-up premium that grows with revenue growth. */
UAE.vcPremium = function (co) {
  var h = co.history || [], g = 0;
  if (h.length >= 13 && h[h.length - 13].rev > 0) g = h[h.length - 1].rev / h[h.length - 13].rev - 1;
  else if (h.length >= 2 && h[h.length - 1].rev > 0) g = 0.5;
  return Math.max(1, Math.min(3, 1.3 + Math.max(-0.3, Math.min(1.2, g))));
};
UAE.vcValuation = function (co) {
  var pv = Math.max(1e6, UAE.privateValue(co)), v = pv * UAE.vcPremium(co);
  if (co.vc && co.vc.post) v = Math.max(v, co.vc.post * (UAE.netIncome(UAE.ttm(co)) >= 0 ? 1 : 0.7));   // no down round unless losing money
  return v;
};
/** Issue `amt` of new shares to holder `key` at pre-money `pre`. Returns the shares issued. */
UAE.vcIssue = function (co, key, amt, pre) {
  var n = Math.max(1, Math.round(co.shares * amt / pre));
  UAE.L.issueEquity(co, amt); co.shares += n; co.holders[key] = (co.holders[key] || 0) + n;
  if (key.indexOf('V:') === 0) { var f = UAE.vcFund(key); f.cash -= amt; f.deployed += amt; f.cost[co.id] = (f.cost[co.id] || 0) + amt; }
  else if (key.indexOf('P:') === 0) { var p = UAE.person(key.slice(2)); p.cash -= amt; if (p.angel) p.angelCost[co.id] = (p.angelCost[co.id] || 0) + amt; }
  return n;
};
UAE.vcLog = function (d) { var V = UAE.S.vc; V.deals.unshift(d); if (V.deals.length > 300) V.deals.length = 300; };

/** A computer start-up raises its next round. Returns the deal or null. */
UAE.vcRound = function (co, stage) {
  var V = UAE.vcInit(), R = UAE.rng, st = UAE.VC_STAGES[stage]; if (!st) return null;
  var dil = R.range(st.dil[0], st.dil[1]);
  var pre = Math.max(UAE.vcValuation(co) * R.range(st.prem[0], st.prem[1]) / UAE.vcPremium(co), st.min * (1 - dil) / dil);
  var amt = Math.max(st.min, Math.min(st.max, pre * dil / (1 - dil)));
  // lead fund + co-investors (funds that invest at this stage, weighted by cash)
  var funds = Object.keys(V.funds).map(function (k) { return V.funds[k]; }).filter(function (f) { return f.stages.indexOf(stage) >= 0 && f.cash > amt * 0.2; });
  var angels = stage <= 2 ? V.angels.map(UAE.person).filter(function (p) { return p && p.cash > 2e6; }) : [];
  if (!funds.length && !angels.length) return null;
  var pick = function (list, w) { var t = list.reduce(function (s, x) { return s + w(x); }, 0), r = R.next() * t; for (var i = 0; i < list.length; i++) { r -= w(list[i]); if (r <= 0) return list[i]; } return list[list.length - 1]; };
  var parts = [], left = amt, lead = null;
  if (funds.length) {
    lead = pick(funds, function (f) { return f.cash; });
    var x = Math.min(lead.cash * 0.35, amt * R.range(0.5, 0.75)); parts.push(['V:' + lead.id, x]); left -= x;
    funds = funds.filter(function (f) { return f !== lead; });
    for (var i = 0; i < 2 && funds.length && left > amt * 0.1; i++) {
      var f = pick(funds, function (q) { return q.cash; }), y = Math.min(f.cash * 0.25, left * (stage <= 2 ? 0.6 : 0.9));
      parts.push(['V:' + f.id, y]); left -= y; funds = funds.filter(function (q) { return q !== f; });
    }
  }
  for (var j = 0; j < 3 && angels.length && left > 2e5; j++) {
    var a = pick(angels, function (p) { return p.cash; }), z = Math.min(a.cash * 0.12, left, Math.max(5e5, amt * 0.15));
    parts.push(['P:' + a.id, z]); left -= z; angels = angels.filter(function (p) { return p !== a; });
  }
  amt -= Math.max(0, left);
  if (amt < st.min * 0.5) return null;
  parts.forEach(function (p) { if (p[1] > 0) UAE.vcIssue(co, p[0], p[1], pre); });
  co.vc = co.vc || { stage: 0, raised: 0 };
  co.vc.stage = stage + 1; co.vc.last = UAE.S.day; co.vc.raised += amt; co.vc.post = pre + amt; co.vc.round = st.k;
  if (lead) lead.deals++;
  var names = parts.map(function (p) { return UAE.vcHolderName(p[0]); });
  var d = { day: UAE.S.day, co: co.id, name: co.name, round: st.k, amt: amt, pre: pre, post: pre + amt, lead: lead ? lead.name : names[0], who: names };
  UAE.vcLog(d);
  UAE.news('💸 ' + st.k + ': ' + co.name + ' raised ' + UAE.fmt.aed(amt) + ' at ' + UAE.fmt.aed(pre + amt) + ' post-money, led by ' + d.lead +
    (names.length > 1 ? ' (with ' + names.slice(1).join(', ') + ')' : '') + '.', 'finance');
  return d;
};

/** Sell a venture holder's listed shares into the market (same mechanics as UAE.sellShares). */
UAE.vcSell = function (key, co, qty) {
  if (!UAE.isTradable(co)) return 0;
  qty = Math.floor(Math.min(qty, co.holders[key] || 0)); if (qty <= 0) return 0;
  if (key.indexOf('P:') === 0) { var r = UAE.sellShares(key, co, qty); return r.ok ? r.proceeds : 0; }
  var impact = 1 - 0.5 * qty / Math.max(1, (co.holders.PUBLIC || 0) + qty);
  var px = co.price * impact, proceeds = px * qty * (1 - UAE.RULES.tradingFee);
  UAE.S.brokeragePool = (UAE.S.brokeragePool || 0) + px * qty * UAE.RULES.tradingFee;
  UAE.vcCredit(key, proceeds);
  co.holders[key] -= qty; if (co.holders[key] <= 0) delete co.holders[key];
  co.holders.PUBLIC = (co.holders.PUBLIC || 0) + qty;
  co.price = co.price * (1 - 0.3 * (1 - impact));
  UAE.controlCheck(co);
  return proceeds;
};

/** Monthly: rounds for start-ups, exits after IPOs, new fund money each January. */
UAE.vcMonth = function () {
  var V = UAE.vcInit(), S = UAE.S, R = UAE.rng, rounds = 0;
  var angelSet = {}; V.angels.forEach(function (id) { angelSet[id] = 1; });
  UAE.allCos().forEach(function (co) {
    if (co.status === 'BANKRUPT') return;
    // exits: funds and angels sell listed shares after the lock-up
    if (UAE.isTradable(co) && !co.foreign && S.day - (co.ipoDay || 0) >= UAE.VC_LOCKUP) {
      Object.keys(co.holders).forEach(function (k) {
        if (k.indexOf('V:') === 0 || (k.indexOf('P:') === 0 && angelSet[k.slice(2)])) UAE.vcSell(k, co, Math.ceil(co.holders[k] * UAE.VC_SELL_PCT));
      });
      return;
    }
    if (!UAE.vcEligible(co)) return;
    if (!co.vc) {   // first look: brand-new start-ups raise a seed round from angels; older ones are past seed
      var young = S.day - (co.founded || 0) <= 45;
      co.vc = { stage: young ? 0 : 2, raised: 0, last: young ? S.day - 999 : S.day - R.int(0, 300) };
    }
    if (co.vc.stage >= UAE.VC_STAGES.length || rounds >= 4) return;
    var gap = S.day - (co.vc.last || 0);
    var m = co.is.months[co.is.months.length - 1], burn = m ? Math.max(0, -UAE.netIncome(m)) : 0;
    var needCash = burn > 0 && co.bs.cash < burn * 6;
    var traction = co.vc.stage <= 1 || UAE.ttm(co).revenue > 0;
    var go = co.vc.stage === 0 || (traction && ((gap >= 300 && R.chance(0.15)) || (needCash && gap >= 120 && R.chance(0.5))));
    if (go && UAE.vcRound(co, Math.max(co.vc.stage, UAE.vcStageFor(UAE.vcValuation(co))))) rounds++;
  });
  // January: limited partners commit fresh money (new fund vintage), more for funds that returned cash
  if (UAE.cal.date(S.day).getUTCMonth() === 0) Object.keys(V.funds).forEach(function (k) {
    var f = V.funds[k], mult = f.deployed > 0 ? (f.returned + UAE.vcFundValue(f).stakes) / f.deployed : 1;
    var add = f.aum * 0.12 * Math.max(0.5, Math.min(2, mult));
    f.cash += add; f.aum += add * 0.5;
  });
  return rounds;
};
/** Stake value of a fund (or angel) + cash. */
UAE.vcFundValue = function (f) {
  var key = 'V:' + f.id, stakes = 0, list = [];
  UAE.allCos().forEach(function (c) {
    var n = c.holders && c.holders[key]; if (!(n > 0) || !c.shares) return;
    var v = c.status === 'BANKRUPT' ? 0 : n / c.shares * Math.max(0, UAE.companyValue(c));
    stakes += v; list.push({ c: c, sh: n / c.shares, val: v, cost: f.cost[c.id] || 0 });
  });
  list.sort(function (a, b) { return b.val - a.val; });
  return { cash: f.cash, stakes: stakes, total: f.cash + stakes, list: list };
};

/* ------------------------------------------------ YOU AS AN INVESTOR ---- */
/** Invest in a computer start-up at its venture valuation. who = 'me' (personal angel money) or a company id (corporate VC). */
UAE.vcPlayerInvest = function (target, amt, who) {
  if (!UAE.vcEligible(target)) return { ok: false, why: target.name + ' is not a private start-up open to investors.' };
  if (!(amt >= 1e5)) return { ok: false, why: 'Minimum investment is AED 100k.' };
  var pre = UAE.vcValuation(target);
  if (amt > pre * 0.25) return { ok: false, why: 'At most 25% of the pre-money value (' + UAE.fmt.aed(pre * 0.25) + ') per investment.' };
  var tot = 0; for (var k in target.holders) tot += target.holders[k];
  var n = Math.round(target.shares * amt / pre), mine = UAE.playerStake(target) * tot;
  if ((mine + n) / (tot + n) > 0.49) return { ok: false, why: 'Venture stakes stay below 49% - to take control, use Corporations → Make acquisition offer.' };
  var key;
  if (who === 'me') {
    var p = UAE.playerPerson(); if (p.cash < amt) return { ok: false, why: 'Not enough personal cash (' + UAE.fmt.aed(p.cash) + ').' };
    key = 'P:' + p.id; p.cash -= amt;
  } else {
    var co = UAE.co(who); if (!co || !UAE.isHuman(co)) return { ok: false, why: 'Pick one of your companies.' };
    if (co.bs.cash < amt) return { ok: false, why: co.name + ' lacks cash (' + UAE.fmt.aed(co.bs.cash) + ').' };
    key = 'C:' + co.id; UAE.L.invest(co, amt); co.portfolio[target.id] = (co.portfolio[target.id] || 0) + amt;
  }
  UAE.L.issueEquity(target, amt); target.shares += n; target.holders[key] = (target.holders[key] || 0) + n;
  target.vc = target.vc || { stage: 1, raised: 0, last: UAE.S.day };
  target.vc.raised += amt; target.vc.post = pre + amt;
  var who2 = who === 'me' ? UAE.playerPerson().name + ' (angel)' : UAE.co(who).name + ' (corporate VC)';
  UAE.vcLog({ day: UAE.S.day, co: target.id, name: target.name, round: 'Your investment', amt: amt, pre: pre, post: pre + amt, lead: who2, who: [who2], mine: true });
  UAE.news('💸 You invested ' + UAE.fmt.aed(amt) + ' in ' + target.name + ' at ' + UAE.fmt.aed(pre) + ' pre-money (' + UAE.fmt.pct(n / (tot + n), 1) + ').', 'finance');
  return { ok: true, pre: pre, stake: n / (tot + n) };
};

/* ------------------------------------------- YOUR COMPANY RAISES MONEY -- */
/** Pitch a private player company to investors: 1-3 term sheets, valid 30 days, once a month. */
UAE.vcPitch = function (co) {
  var V = UAE.vcInit(), S = UAE.S, R = UAE.rng;
  if (!UAE.isHuman(co)) return { ok: false, why: 'Only your own companies.' };
  if (co.status !== 'PRIVATE') return { ok: false, why: 'Listed companies raise money on the stock market (Financial Actions → Issue new shares).' };
  var old = V.offers[co.id];
  if (old && old.day > S.day - 30) return { ok: false, why: 'Investors already gave you term sheets this month - next pitch from ' + UAE.cal.label(old.day + 30) + '.' };
  if (S.day - (co.founded || 0) < 60) return { ok: false, why: 'Investors want at least 2 months of trading history.' };
  var pre = Math.max(5e6, UAE.privateValue(co)) * UAE.vcPremium(co);
  var funds = Object.keys(V.funds).map(function (k) { return V.funds[k]; }).filter(function (f) { return f.cash > 2e6; })
    .sort(function () { return R.next() - 0.5; }).slice(0, R.int(1, 3));
  var list = funds.map(function (f) {
    var p = pre * R.range(0.85, 1.25), dil = R.range(0.08, 0.22), amt = Math.min(f.cash * 0.35, p * dil / (1 - dil));
    return { fund: f.id, name: f.name, amt: Math.round(amt / 1e5) * 1e5, pre: p, exp: S.day + 30 };
  }).filter(function (o) { return o.amt >= 1e6; });
  V.offers[co.id] = { day: S.day, list: list };
  if (!list.length) return { ok: false, why: 'No investor had enough capital for a deal this month.' };
  return { ok: true, n: list.length };
};
/** Accept term sheet i: new shares to the fund, cash to the company. You must keep control (> 50%). */
UAE.vcAccept = function (co, i) {
  var V = UAE.vcInit(), S = UAE.S, of = V.offers[co.id], o = of && of.list[i];
  if (!o) return { ok: false, why: 'Offer not found.' };
  if (o.exp < S.day) return { ok: false, why: 'This term sheet expired.' };
  if (co.status !== 'PRIVATE') return { ok: false, why: 'Company is listed now.' };
  var f = V.funds[o.fund]; if (!f || f.cash < o.amt) return { ok: false, why: o.name + ' no longer has the money.' };
  var tot = 0; for (var k in co.holders) tot += co.holders[k];
  var n = Math.round(co.shares * o.amt / o.pre), mine = UAE.playerStake(co) * tot;
  if (mine / (tot + n) <= 0.5) return { ok: false, why: 'You would lose control (stake after the deal ' + UAE.fmt.pct(mine / (tot + n), 1) + ').' };
  UAE.vcIssue(co, 'V:' + f.id, o.amt, o.pre);
  co.vc = co.vc || { stage: 0, raised: 0 }; co.vc.raised += o.amt; co.vc.last = S.day; co.vc.post = o.pre + o.amt; f.deals++;
  of.list = [];   // one deal per pitch
  UAE.vcLog({ day: S.day, co: co.id, name: co.name, round: 'Your raise', amt: o.amt, pre: o.pre, post: o.pre + o.amt, lead: f.name, who: [f.name], mine: true });
  UAE.news('💸 ' + co.name + ' raised ' + UAE.fmt.aed(o.amt) + ' from ' + f.name + ' at ' + UAE.fmt.aed(o.pre) + ' pre-money.', 'finance');
  return { ok: true };
};

/* hooks: monthly after the IPO / start-up wave; set up on load */
(function () {
  var baseIpo = UAE.ipoMonth;
  UAE.ipoMonth = function () { var r = baseIpo.apply(this, arguments); UAE.vcMonth(); return r; };
  var baseLoad = UAE.afterLoad;
  UAE.afterLoad = function () { var r = baseLoad ? baseLoad.apply(this, arguments) : undefined; UAE.vcInit(); return r; };
})();
