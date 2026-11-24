/* ============================================================================
 * UAE CAPITALISM LAB  -  STOCK MARKET (DFM / ADX), BONDS, FINANCIAL ACTIONS,
 *                        GOALS, SCORE & RANKINGS
 * Invariants (gap audit §5): a secondary trade never changes the issuer's cash
 * or share count; a share issue does; private companies have no tradable quote;
 * a bond issue raises cash + liabilities, never revenue.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* ----------------------------------------------------------- formatting */
UAE.fmt = {
  aed: function (v) {
    if (v == null || isNaN(v)) return '—';
    var a = Math.abs(v), s = v < 0 ? '-' : '';
    if (a >= 1e12) return s + 'AED ' + (a / 1e12).toFixed(2) + 'T';
    if (a >= 1e9) return s + 'AED ' + (a / 1e9).toFixed(2) + 'bn';
    if (a >= 1e6) return s + 'AED ' + (a / 1e6).toFixed(2) + 'm';
    if (a >= 1e3) return s + 'AED ' + (a / 1e3).toFixed(1) + 'k';
    return s + 'AED ' + a.toFixed(0);
  },
  num: function (v, d) {
    if (v == null || isNaN(v)) return '—';
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + 'bn';
    if (a >= 1e6) return (v / 1e6).toFixed(2) + 'm';
    if (a >= 1e4) return (v / 1e3).toFixed(1) + 'k';
    return v.toFixed(d == null ? 0 : d);
  },
  pct: function (v, d) { return v == null || isNaN(v) ? '—' : (v * 100).toFixed(d == null ? 1 : d) + '%'; },
  px: function (v) { return v == null ? '—' : v >= 100 ? v.toFixed(1) : v >= 10 ? v.toFixed(2) : v.toFixed(3); }
};

/** Total income for screens: sales + interest income + investment income (dividends, gains). Banks, insurers and
 *  holding companies report it this way; the game's 'revenue' line alone is sales of goods and services. */
UAE.totalRevenue = function (t) { return (t.revenue || 0) + Math.max(0, t.interestInc || 0) + Math.max(0, t.investInc || 0); };
UAE.isTradable = function (co) { return co.status === 'LISTED' && co.exch && co.price > 0; };
UAE.mcap = function (co) { return UAE.isTradable(co) ? co.price * co.shares : 0; };
UAE.bookValue = function (co) { return UAE.totals(co).equity; };
/** Sum of the parts: shares this company holds in other companies (subsidiaries, associates, stock
 *  portfolio). The balance sheet carries them at cost; valuation counts them at market value instead
 *  (listed: share price; private: their own estimated value) x the stake held.
 *  Returns { val, cost, list: [{ c, sh, val, cost }] }. Cached per game day. */
UAE.stakeValue = function (co, depth) {
  var X = UAE._idx, C = X && (X.stake || (X.stake = {}));
  if (C && C[co.id]) return C[co.id];
  depth = depth || 0;
  var out = { val: 0, cost: 0, list: [] }, key = 'C:' + co.id;
  if (depth > 3) return out;                                   // cross-holdings: stop the chain
  UAE.allCos().forEach(function (c) {
    if (c === co || !c.holders || !c.shares) return;
    var n = c.holders[key]; if (!(n > 0)) return;
    var sh = n / c.shares, whole = UAE.isTradable(c) ? UAE.mcap(c) : UAE.privateValue(c, depth + 1);
    var v = sh * Math.max(0, whole), cost = (co.portfolio && co.portfolio[c.id]) || 0;
    out.val += v; out.cost += cost; out.list.push({ c: c, sh: sh, val: v, cost: cost });
  });
  out.list.sort(function (a, b) { return b.val - a.val; });
  if (C && !depth) C[co.id] = out;
  return out;
};
/** Equity value for private companies (book + earnings multiple, EST) + stakes in other companies at market value. */
UAE.privateValue = function (co, depth) {
  var ni = UAE.netIncome(UAE.ttm(co)), sec = UAE.SECTORS[co.sector] || UAE.SECTORS.holding;
  var st = UAE.stakeValue(co, depth), bv = UAE.bookValue(co) - st.cost;   // own business: book without the stakes at cost
  return Math.max(bv, bv * 0.5 + Math.max(0, ni) * sec.pe * 0.8) + st.val;
};
UAE.companyValue = function (co) { return UAE.isTradable(co) ? UAE.mcap(co) : UAE.privateValue(co); };

/* ========================================================= PRICES ======= */
UAE.fundamental = function (co) {
  var sec = UAE.SECTORS[co.sector] || UAE.SECTORS.holding;
  var ttm = UAE.ttm(co), ni = UAE.netIncome(ttm), bv = UAE.bookValue(co);
  if (co.seed && co.seedPrice) {
    // anchor to the observed/estimated seed price, move with earnings vs seed earnings
    var ratio = co.seedNI > 0 && ni > 0 ? Math.pow(ni / co.seedNI, 0.5) : (ni <= 0 ? 0.7 : 1);
    if (UAE.S.day < 60) ratio = 1;   // first two months: not enough booked history
    ratio = 1 + (ratio - 1) * Math.min(1, UAE.S.day / 365);   // phase in over the first year
    return co.seedPrice * ratio * (co.splitAdj || 1);
  }
  var growth = 1;
  var h = co.history; if (h.length >= 13 && h[h.length - 13].rev > 0) growth = Math.max(0.7, Math.min(1.6, Math.pow(h[h.length - 1].rev / h[h.length - 13].rev, 0.5)));
  var earn = Math.max(0, ni) * sec.pe * growth;
  var irBoost = 1 + Math.min(0.1, (co.hqBudget.ir || 0) / 5e6 * 0.02);
  var st = UAE.stakeValue(co); bv -= st.cost;                   // sum of the parts: stakes at market value, not at cost
  return (Math.max(bv * 0.6, earn * 0.7 + bv * 0.45) * irBoost + st.val) / co.shares;
};

UAE.marketDay = function () {
  var S = UAE.S, m = S.macro;
  var mkt = { DFM: UAE.rng.normal() * 0.006, ADX: UAE.rng.normal() * 0.005 };
  var us = UAE.rng.normal(), reg = { US: us };               // one market factor per region: NYSE + NASDAQ move together, so do Europe's and Asia's exchanges
  Object.keys(UAE.GLOBAL_EXCH || {}).forEach(function (x) {
    var E = UAE.GLOBAL_EXCH[x], r = E.region || 'US', f = reg[r] != null ? reg[r] : (reg[r] = 0.5 * us + 0.87 * UAE.rng.normal());   // regions share part of the US move
    mkt[x] = (f * E.beta + UAE.rng.normal() * 0.4) * E.vol + 0.0003;
  });
  var before = {}, after = {}; Object.keys(S.index).forEach(function (x) { before[x] = 0; after[x] = 0; if (mkt[x] == null) mkt[x] = 0; });
  UAE.allCos().forEach(function (co) {
    if (!UAE.isTradable(co)) return;
    var fund = UAE.fundamental(co) * m.equity;
    before[co.exch] += co.price * co.shares;
    var vol = co.foreign ? 0.014 : co.seed ? 0.011 : 0.018;
    var drift = 0.03 * (fund / co.price - 1);
    co.price = Math.max(0.01, co.price * (1 + drift + mkt[co.exch] + UAE.rng.normal() * vol));
    co.priceHist.push(co.price); if (co.priceHist.length > 400) co.priceHist.shift();
    after[co.exch] += co.price * co.shares;
  });
  Object.keys(S.index).forEach(function (x) {
    var I = S.index[x];
    if (before[x] > 0) I.level *= after[x] / before[x];
    I.hist.push(I.level); if (I.hist.length > 400) I.hist.shift();
  });
  // bonds: price = PV of remaining coupons at current base rate + spread
  Object.keys(S.bonds).forEach(function (id) {
    var b = S.bonds[id];
    var yrs = Math.max(0, (b.maturity - S.day) / 365);
    var y = m.rate + b.spread + 0.005;
    var pv = 0, n = Math.ceil(yrs);
    for (var t = 1; t <= n; t++) pv += b.coupon * 100 / Math.pow(1 + y, t);
    pv += 100 / Math.pow(1 + y, Math.max(yrs, 0.01));
    b.price = Math.max(1, pv); b.ytm = y;
    b.hist.push(b.price); if (b.hist.length > 400) b.hist.shift();
    if (yrs <= 0 && !b.matured) UAE.bondMature(b);
  });
};

/* =================================================== SHARE TRADING ====== */
/** Holder key for the acting entity: 'P:<id>' (personal) or 'C:<id>' (company). */
UAE.holderKey = function (who) { return who.indexOf(':') > 0 ? who : 'C:' + who; };
UAE.holderCash = function (key) {
  if (key.indexOf('P:') === 0) return UAE.person(key.slice(2)).cash;
  return UAE.co(key.slice(2)).bs.cash;
};
/** Buy `qty` shares of `co` from the public float. Price impact grows with size vs float. */
UAE.buyShares = function (key, co, qty) {
  if (!UAE.isTradable(co)) return { ok: false, why: co.name + ' is not listed - no tradable quote on DFM/ADX.' };
  qty = Math.floor(Math.min(qty, co.holders.PUBLIC || 0));
  if (qty <= 0) return { ok: false, why: 'No shares available in the public float.' };
  var impact = 1 + 0.5 * qty / Math.max(1, co.holders.PUBLIC);
  var px = co.price * impact, cost = px * qty * (1 + UAE.RULES.tradingFee);
  UAE.S.brokeragePool = (UAE.S.brokeragePool || 0) + px * qty * UAE.RULES.tradingFee;          // brokers (banks) earn the fee
  if (UAE.holderCash(key) < cost) return { ok: false, why: 'Not enough cash (' + UAE.fmt.aed(cost) + ' needed).' };
  if (key.indexOf('P:') === 0) UAE.person(key.slice(2)).cash -= cost;
  else { var buyer = UAE.co(key.slice(2)); if (buyer.id === co.id) return { ok: false, why: 'Use Buyback for own shares.' }; UAE.L.invest(buyer, cost); buyer.portfolio[co.id] = (buyer.portfolio[co.id] || 0) + cost; }
  co.holders.PUBLIC -= qty; co.holders[key] = (co.holders[key] || 0) + qty;
  co.price = co.price * (1 + 0.3 * (impact - 1));
  UAE.controlCheck(co);
  return { ok: true, qty: qty, px: px, cost: cost };
};
UAE.sellShares = function (key, co, qty) {
  if (!UAE.isTradable(co)) return { ok: false, why: 'Not tradable.' };
  qty = Math.floor(Math.min(qty, co.holders[key] || 0));
  if (qty <= 0) return { ok: false, why: 'You hold no shares.' };
  var held = co.holders[key];
  var impact = 1 - 0.5 * qty / Math.max(1, (co.holders.PUBLIC || 0) + qty);
  var px = co.price * impact, proceeds = px * qty * (1 - UAE.RULES.tradingFee);
  UAE.S.brokeragePool = (UAE.S.brokeragePool || 0) + px * qty * UAE.RULES.tradingFee;
  if (key.indexOf('P:') === 0) UAE.person(key.slice(2)).cash += proceeds;
  else {
    var seller = UAE.co(key.slice(2)), basis = (seller.portfolio[co.id] || 0) * qty / held;
    seller.portfolio[co.id] -= basis; UAE.L.divest(seller, proceeds, basis); UAE.trackTradeGain(seller, proceeds - basis);
  }
  co.holders[key] -= qty; if (co.holders[key] <= 0) delete co.holders[key];
  co.holders.PUBLIC = (co.holders.PUBLIC || 0) + qty;
  co.price = co.price * (1 - 0.3 * (1 - impact));
  UAE.controlCheck(co);
  return { ok: true, qty: qty, px: px, proceeds: proceeds };
};
/** Combined stake of the human player (person + all player-controlled companies). */
UAE.playerStake = function (co) {
  var tot = 0, sum = 0;
  for (var k in co.holders) {
    tot += co.holders[k];
    if (k === 'P:' + UAE.S.playerPerson) sum += co.holders[k];
    else if (k.indexOf('C:') === 0 && UAE.isHuman(UAE.co(k.slice(2))) && k.slice(2) !== co.id) sum += co.holders[k];
  }
  return tot ? sum / tot : 0;
};
/** >50% combined stake = takeover: the company becomes a player subsidiary. */
UAE.controlCheck = function (co) {
  if (co.foreign) { if (co.controller === 'PLAYER') { co.controller = 'AI'; co.parent = null; if (UAE.S.activeCo === co.id) UAE.S.activeCo = UAE.S.playerCo; UAE.news('You no longer control ' + co.name + ' (US companies are trade-only).', 'finance'); } return; }
  var st = UAE.playerStake(co);
  if (st > 0.5 && co.controller !== 'PLAYER') {
    co.controller = 'PLAYER'; co.parent = UAE.S.playerCo; UAE.policy(co).backward = 100;
    UAE.news('TAKEOVER: you now control ' + co.name + ' (' + UAE.fmt.pct(st) + '). It is now your subsidiary.', 'finance');
  } else if (st <= 0.5 && co.controller === 'PLAYER' && co.id !== UAE.S.playerCo && !co.createdByPlayer) {
    co.controller = 'AI'; co.parent = null; if (UAE.S.activeCo === co.id) UAE.S.activeCo = UAE.S.playerCo;
    UAE.news('You lost control of ' + co.name + '.', 'finance');
  }
};

/* ================================================ FINANCIAL ACTIONS ==== */
UAE.loanRate = function (co) { return UAE.S.macro.rate + UAE.RULES.loanSpread + UAE.creditSpread(co) - 0.01; };
UAE.creditLimit = function (co) { return Math.max(0, UAE.totals(co).equity * 1.0 + UAE.netIncome(UAE.ttm(co)) * 2) - co.bs.loans; };
/** FA01 Borrow */
UAE.takeLoan = function (co, amt, force, opts) {
  opts = opts || {};
  if (!force && amt > UAE.creditLimit(co)) return { ok: false, why: 'Exceeds credit limit of ' + UAE.fmt.aed(UAE.creditLimit(co)) };
  var rate = UAE.loanRate(co), lender = UAE.pickLender ? UAE.pickLender(co, amt) : null;   // a game bank may offer a better rate
  var years = Math.max(1, Math.min(10, opts.years || (force ? 1 : 3)));
  var loan = { amt: amt, orig: amt, rate: lender ? lender.rate : rate, day: UAE.S.day, years: years, until: UAE.S.day + Math.round(years * 365), by: opts.by || (force ? 'emergency' : 'ceo') };
  if (lender) { loan.bank = lender.co.id; UAE.fundGameLoan(lender.co, amt); }
  co.loanList.push(loan); UAE.L.borrow(co, amt, 'loans');
  return { ok: true, rate: loan.rate, bank: lender ? lender.co.name : null, years: years, instalment: amt / (years * 12) };
};
/** Repay part of ONE loan (scheduled instalments). */
UAE.repayOne = function (co, l, amt) {
  amt = Math.min(amt, l.amt, Math.max(0, co.bs.cash), co.bs.loans); if (amt <= 0) return 0;
  l.amt -= amt;
  if (l.bank && UAE.co(l.bank) && UAE.co(l.bank).status !== 'BANKRUPT') UAE.gameLoanRepaid(UAE.co(l.bank), amt);
  UAE.L.repay(co, amt, 'loans');
  if (l.amt <= 1) co.loanList.splice(co.loanList.indexOf(l), 1);
  return amt;
};
/** Monthly: each loan pays its instalment (principal / months of the term); the last month clears it. */
UAE.loanInstalments = function (co) {
  co.loanList.slice().forEach(function (l) {
    var months = Math.max(1, Math.round(((l.until || UAE.S.day + 365) - UAE.S.day) / 30));
    var due = l.amt / months;
    var paid = UAE.repayOne(co, l, due);
    if (paid < due - 1 && UAE.isHuman(co)) UAE.news('Loan instalment of ' + UAE.fmt.aed(due) + ' could not be paid in full – short of cash.', 'warning');
  });
};
/** FA01 Repay (oldest first) */
UAE.repayLoan = function (co, amt) {
  amt = Math.min(amt, co.bs.loans, co.bs.cash); if (amt <= 0) return { ok: false, why: 'Nothing to repay or no cash.' };
  var left = amt;
  while (left > 0 && co.loanList.length) {
    var l = co.loanList[0], x = Math.min(left, l.amt); l.amt -= x; left -= x;
    if (l.bank && UAE.co(l.bank) && UAE.co(l.bank).status !== 'BANKRUPT') UAE.gameLoanRepaid(UAE.co(l.bank), x);   // cash goes back to the lending bank
    if (l.amt <= 1) co.loanList.shift();
  }
  UAE.L.repay(co, amt, 'loans'); return { ok: true, amt: amt };
};
/** FA02/FA08 Issue new shares to the public (listed only). */
UAE.issueShares = function (co, qty) {
  if (!UAE.isTradable(co)) return { ok: false, why: 'Company must be listed (do an IPO first).' };
  var px = co.price * 0.95, cash = px * qty * 0.98;       // 5% discount, 2% underwriting fee
  co.shares += qty; co.holders.PUBLIC = (co.holders.PUBLIC || 0) + qty;
  UAE.L.issueEquity(co, cash);
  if (UAE.underwrite) UAE.underwrite(co, px * qty * 0.02);                                     // lead bank's underwriting fee
  co.price *= 1 - 0.3 * qty / co.shares;
  UAE.controlCheck(co);
  return { ok: true, cash: cash, px: px };
};
/** FA03 Buy back shares (cancelled -> treasury). */
UAE.buyback = function (co, qty) {
  if (!UAE.isTradable(co)) return { ok: false, why: 'Only listed companies can buy back on market.' };
  qty = Math.floor(Math.min(qty, co.holders.PUBLIC || 0));
  var cost = co.price * 1.02 * qty;
  if (cost > co.bs.cash) return { ok: false, why: 'Not enough cash.' };
  co.holders.PUBLIC -= qty; co.shares -= qty; UAE.L.buyback(co, cost);
  co.price *= 1 + 0.2 * qty / co.shares;
  return { ok: true, cost: cost };
};
/** FA05 IPO on DFM or ADX (simulated listing, flagged fictional). */
UAE.ipo = function (co, exch, pctFloat, ticker) {
  if (co.status === 'LISTED') return { ok: false, why: 'Already listed.' };
  var eq = UAE.bookValue(co);
  if (eq < 50e6) return { ok: false, why: 'Equity must be at least AED 50m to list (yours: ' + UAE.fmt.aed(eq) + ').' };
  if (UAE.S.day - co.founded < 180) return { ok: false, why: 'Company needs at least 6 months of operating history.' };
  var value = UAE.privateValue(co) * 0.9;
  var px = Math.max(0.5, value / co.shares);
  var newShares = Math.round(co.shares * pctFloat / (1 - pctFloat));
  var proceeds = px * newShares * 0.97;
  co.status = 'LISTED'; co.exch = exch; co.ticker = (ticker || co.ticker || co.name.slice(0, 5)).toUpperCase();
  co.listingSrc = 'SIMULATED IPO (fictional listing)';
  co.shares += newShares; co.holders.PUBLIC = (co.holders.PUBLIC || 0) + newShares;
  co.price = px; co.seedPrice = 0; UAE.L.issueEquity(co, proceeds);
  if (UAE.underwrite) UAE.underwrite(co, px * newShares * 0.03);
  UAE.news(co.name + ' IPO on ' + exch + ' at AED ' + px.toFixed(2) + ' raises ' + UAE.fmt.aed(proceeds) + '.', 'finance');
  return { ok: true, px: px, proceeds: proceeds };
};
/** IPO wave: computer-run private companies go public on their own, about UAE.IPO_PER_YEAR a year
 *  (spread over the year). Best candidates first: fictional companies, then highest value. State-owned,
 *  foreign and your own companies are never listed for you. */
UAE.IPO_PER_YEAR = 5;
UAE.ipoCandidates = function () {
  var S = UAE.S;
  return UAE.allCos().filter(function (co) {
    return co.status === 'PRIVATE' && !co.foreign && !co.soe && !UAE.isHuman(co) && co.shares > 0 &&
      UAE.bookValue(co) >= 50e6 && S.day - (co.founded || 0) >= 180;
  }).map(function (co) { return { co: co, v: UAE.privateValue(co) }; })
    .sort(function (a, b) { return (b.co.fictional ? 1 : 0) - (a.co.fictional ? 1 : 0) || b.v - a.v; });
};
UAE.STARTUPS_PER_MONTH = 1;   // new private computer start-ups founded each month (the IPO pipeline)
UAE.startupMonth = function () {
  var S = UAE.S, pipe = UAE.allCos().filter(function (co) { return co.status === 'PRIVATE' && !co.foreign && !co.soe && !UAE.isHuman(co); }).length;
  if (pipe >= UAE.IPO_PER_YEAR * 3) return 0;
  var sectors = UAE.FICTIONAL_COMPANIES.map(function (x) { return x[1]; }), n = 0;
  for (var i = 0; i < UAE.STARTUPS_PER_MONTH; i++) {
    var sec = UAE.rng.pick(sectors), co = UAE.makeStartup(UAE.randomCompanyName(sec), sec, true);
    co.ticker = UAE.tickerFor(co.name); n++;
    UAE.news('🚀 New start-up: ' + co.name + ' (' + sec + ', ' + UAE.CITIES[co.hq].name + ') - privately funded, may IPO later.', 'finance');
  }
  return n;
};
UAE.ipoMonth = function () {
  if (UAE.startupMonth) UAE.startupMonth();
  var S = UAE.S, y = UAE.cal.year(), m = UAE.cal.date(S.day).getUTCMonth() + 1;
  S.ipoYear = S.ipoYear || {}; var done = S.ipoYear[y] || 0;
  var due = Math.round(UAE.IPO_PER_YEAR * m / 12) - done; if (due <= 0) return 0;
  var used = {}; UAE.allCos().forEach(function (c) { if (c.ticker) used[c.ticker.toUpperCase()] = true; });
  var n = 0;
  UAE.ipoCandidates().slice(0, due).forEach(function (x) {
    var co = x.co, base = (co.ticker || co.name.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'IPO').toUpperCase(), t = base, k = 2;
    if (co.status !== 'PRIVATE' || !co.ticker) { while (used[t]) t = base + (k++); }
    var exch = (co.hq === 'AUH' || co.hq === 'AAN') ? 'ADX' : 'DFM';
    var r = UAE.ipo(co, exch, UAE.rng.range(0.2, 0.3), t);
    if (r.ok) { used[co.ticker] = true; co.ipoDay = S.day; n++; }
  });
  S.ipoYear[y] = done + n;
  return n;
};
/** FA10 Privatise: buy out the whole public float at a 25% premium. */
UAE.privatize = function (co) {
  if (!UAE.isTradable(co)) return { ok: false, why: 'Not listed.' };
  var flt = co.holders.PUBLIC || 0, cost = flt * co.price * 1.25;
  if (cost > co.bs.cash) return { ok: false, why: 'Need ' + UAE.fmt.aed(cost) + ' cash.' };
  co.shares -= flt; delete co.holders.PUBLIC; UAE.L.buyback(co, cost);
  co.status = 'PRIVATE'; co.exch = '';
  UAE.news(co.name + ' delisted after a buy-out of the public float.', 'finance');
  return { ok: true, cost: cost };
};
/** FA11 Issue a 5-year bond. */
UAE.issueBond = function (co, amt, years) {
  years = years || 5;
  if (amt > UAE.totals(co).equity * 1.5 - co.bs.bonds) return { ok: false, why: 'Bond issue too large for equity base.' };
  var coupon = UAE.S.macro.rate + UAE.RULES.bondSpread + UAE.creditSpread(co) - 0.012;
  var id = 'B' + co.id + '_' + UAE.S.day;
  co.bondList.push({ id: id, amt: amt, coupon: coupon, maturity: UAE.S.day + years * 365 });
  UAE.S.bonds[id] = { id: id, name: co.name + ' ' + (UAE.cal.year() + years) + ' ' + (coupon * 100).toFixed(2) + '%', issuer: 'CO:' + co.id,
    face: amt, coupon: coupon, spread: UAE.creditSpread(co), maturity: UAE.S.day + years * 365, price: 100, hist: [] };
  UAE.L.borrow(co, amt, 'bonds');
  UAE.L.expense(co, 'otherOpex', amt * 0.01, 'fin');   // 1% underwriting fee
  return { ok: true, coupon: coupon };
};
UAE.bondMature = function (b) {
  b.matured = true;
  if (b.issuer.indexOf('CO:') === 0) {
    var co = UAE.co(b.issuer.slice(3));
    if (co) { var e = co.bondList.find(function (x) { return x.id === b.id; });
      if (e) { UAE.L.repay(co, Math.min(e.amt, co.bs.bonds), 'bonds'); co.bondList = co.bondList.filter(function (x) { return x !== e; }); } }
  }
  UAE.allCos().forEach(function (co) {
    var pos = co.bondPositions[b.id];
    if (pos && pos.face > 0) { UAE.L.divest(co, pos.face, pos.cost, 'invest'); delete co.bondPositions[b.id]; }
  });
};
/** FA17 buy / sell bonds on the secondary market (company account). */
UAE.tradeBond = function (co, bondId, face) {
  var b = UAE.S.bonds[bondId]; if (!b || b.matured) return { ok: false, why: 'Bond not available.' };
  var pos = co.bondPositions[bondId] || (co.bondPositions[bondId] = { face: 0, cost: 0 });
  if (face > 0) {
    var cost = face * b.price / 100; if (cost > co.bs.cash) return { ok: false, why: 'Not enough cash.' };
    UAE.L.invest(co, cost); pos.face += face; pos.cost += cost; return { ok: true, cost: cost };
  }
  face = Math.min(-face, pos.face); if (face <= 0) return { ok: false, why: 'No position.' };
  var basis = pos.cost * face / pos.face, proceeds = face * b.price / 100;
  pos.face -= face; pos.cost -= basis; UAE.L.divest(co, proceeds, basis); UAE.trackTradeGain(co, proceeds - basis);
  return { ok: true, proceeds: proceeds };
};
/** FA12 Bank deposit (term deposit at a UAE bank, base - 1.2%). */
UAE.deposit = function (co, amt) {
  if (amt > 0) {
    if (amt > co.bs.cash) return { ok: false, why: 'Not enough cash.' };
    var rate = Math.max(0.005, UAE.S.macro.rate + UAE.RULES.depositSpread);
    co.depositList.push({ amt: amt, rate: rate }); UAE.L.invest(co, amt, 'deposits'); return { ok: true, rate: rate };
  }
  var w = Math.min(-amt, co.bs.deposits), left = w;
  while (left > 0 && co.depositList.length) { var d = co.depositList[0], x = Math.min(left, d.amt); d.amt -= x; left -= x; if (d.amt <= 1) co.depositList.shift(); }
  UAE.L.divest(co, w, w, 'deposits'); return { ok: true, amt: w };
};
/** FA13 Special dividend */
UAE.specialDividend = function (co, amt) {
  if (amt > co.bs.cash * 0.8) return { ok: false, why: 'Special dividend limited to 80% of cash.' };
  if (amt > co.bs.retained) return { ok: false, why: 'Cannot exceed retained earnings.' };
  UAE.distribute(co, amt, 'special dividend'); return { ok: true };
};
/** FA14 Stock split N-for-1 */
UAE.split = function (co, n) {
  if (!UAE.isTradable(co)) return { ok: false, why: 'Listed companies only.' };
  for (var k in co.holders) co.holders[k] *= n;
  co.shares *= n; co.price /= n; co.splitAdj = (co.splitAdj || 1) / n;
  co.priceHist = co.priceHist.map(function (p) { return p / n; });
  UAE.news(co.name + ' completed a ' + n + '-for-1 stock split.', 'finance'); return { ok: true };
};
/** FA06 + FA07 New subsidiary with capital injection from parent. */
UAE.newSubsidiary = function (parent, name, capital, city) {
  if (capital > parent.bs.cash) return { ok: false, why: 'Parent lacks cash.' };
  var sub = UAE.makeCompany({ id: UAE.uid('C'), name: name, hq: city || parent.hq, sector: parent.sector, controller: 'PLAYER',
    parent: parent.id, shares: Math.round(capital / 1), price: 1, payout: 0 });
  sub.createdByPlayer = true; sub.color = '#2cffd5';
  UAE.S.companies[sub.id] = sub;
  UAE.L.invest(parent, capital); parent.portfolio[sub.id] = capital;
  UAE.L.issueEquity(sub, capital);
  sub.holders['C:' + parent.id] = sub.shares;
  UAE.PRODUCTS.forEach(function (p) { sub.tech[p.id] = parent.tech[p.id] || 45; });
  sub.brandBase = 15;
  var ceo = UAE.makePerson({ title: 'CEO', co: sub.id, salary: 80000 }); sub.ceo = ceo.id;
  UAE.news('Subsidiary ' + name + ' incorporated with ' + UAE.fmt.aed(capital) + ' capital.', 'finance');
  return { ok: true, co: sub };
};
UAE.injectCapital = function (parent, sub, amt) {
  if (amt > parent.bs.cash) return { ok: false, why: 'Parent lacks cash.' };
  var px = Math.max(0.01, UAE.bookValue(sub) / sub.shares), n = Math.round(amt / px);
  UAE.L.invest(parent, amt); parent.portfolio[sub.id] = (parent.portfolio[sub.id] || 0) + amt;
  UAE.L.issueEquity(sub, amt); sub.shares += n; sub.holders['C:' + parent.id] = (sub.holders['C:' + parent.id] || 0) + n;
  return { ok: true };
};
/** FA20 Acquire a private fictional company outright (state/real groups are not for sale). */
UAE.acquirePrivate = function (buyer, target) {
  if (target.real) return { ok: false, why: target.name + ' is a real state-linked/private group and is not for sale in this simulation.' };
  if (target.status === 'LISTED') return { ok: false, why: 'Listed - buy shares on the stock market instead.' };
  var price = UAE.privateValue(target) * 1.25;
  if (price > buyer.bs.cash) return { ok: false, why: 'Need ' + UAE.fmt.aed(price) + '.' };
  UAE.L.invest(buyer, price); buyer.portfolio[target.id] = price;
  for (var k in target.holders) {
    var share = price * target.holders[k] / target.shares;
    if (k.indexOf('P:') === 0) UAE.person(k.slice(2)).cash += share;
    else if (k.indexOf('V:') === 0 && UAE.vcCredit) UAE.vcCredit(k, share);   // venture funds are paid out
  }
  target.holders = {}; target.holders['C:' + buyer.id] = target.shares;
  target.controller = 'PLAYER'; target.parent = buyer.id; target.createdByPlayer = true; UAE.policy(target).backward = 100;
  UAE.news(buyer.name + ' acquired ' + target.name + ' for ' + UAE.fmt.aed(price) + '.', 'finance');
  return { ok: true, price: price };
};
/** FA21 Buy technology from another company (CTO office). */
UAE.buyTech = function (buyer, seller, pid) {
  var gap = (seller.tech[pid] || 0) - (buyer.tech[pid] || 0);
  if (gap <= 1) return { ok: false, why: 'No technology advantage to buy.' };
  var price = gap * 1.5e6;
  if (price > buyer.bs.cash) return { ok: false, why: 'Need ' + UAE.fmt.aed(price) + '.' };
  UAE.L.expense(buyer, 'rnd', price); UAE.L.income(seller, 'revenue', price);
  buyer.tech[pid] = seller.tech[pid] - 1;
  return { ok: true, price: price };
};

/* ================================================ NET WORTH & SCORE ===== */
UAE.personWealth = function (p) {
  var w = p.cash + (p.mansion ? p.mansionValue || 0 : 0);
  UAE.allCos().forEach(function (co) {
    var h = co.holders['P:' + p.id]; if (!h) return;
    w += h * (UAE.isTradable(co) ? co.price : UAE.privateValue(co) / co.shares);
  });
  return w;
};
UAE.score = function () {
  var co = UAE.co(UAE.S.playerCo), p = UAE.playerPerson();
  var val = UAE.companyValue(co), nw = UAE.personWealth(p), ni = UAE.netIncome(UAE.ttm(co));
  var firms = UAE.firmsOf(co.id).length;
  return Math.round(val / 1e6 * 0.5 + nw / 1e6 * 0.3 + Math.max(0, ni) / 1e6 * 2 + firms * 10);
};

/* =================================================== GOALS ============== */
UAE.initGoals = function () {
  UAE.S.goals = [
    { id:'hq',     text:'Build your corporate Headquarters', test:function (co) { return UAE.firmsOf(co.id).some(function (f) { return f.type === 'hq' && f.status === 'open'; }); } },
    { id:'retail3',text:'Operate 3 retail stores', test:function (co) { return UAE.firmsOf(co.id).filter(function (f) { return f.type === 'retail' && f.status === 'open'; }).length >= 3; } },
    { id:'vert',   text:'Supply your own store from your own factory (vertical integration)', test:function (co) {
        return UAE.firmsOf(co.id).some(function (f) { return f.type === 'retail' && f.lines.some(function (l) { var s = UAE.S.firms[l.supplier]; return s && s.owner === co.id; }); }); } },
    { id:'emir3',  text:'Have firms in 3 different emirates', test:function (co) {
        var e = {}; UAE.firmsOf(co.id).forEach(function (f) { e[UAE.CITIES[f.city].emirate] = 1; }); return Object.keys(e).length >= 3; } },
    { id:'profit', text:'Reach AED 50m trailing-12-month net profit', test:function (co) { return UAE.netIncome(UAE.ttm(co)) >= 50e6; } },
    { id:'ipo',    text:'List your company on DFM or ADX', test:function (co) { return co.status === 'LISTED'; } },
    { id:'bn',     text:'Reach AED 1bn company value', test:function (co) { return UAE.companyValue(co) >= 1e9; } },
    { id:'tower',  text:'Own a tower in Downtown Dubai or Dubai Marina', test:function (co) {
        return UAE.firmsOf(co.id).some(function (f) { return ['apartment','commercial','hotel'].indexOf(f.type) >= 0 && ['DXB_DOWNTOWN','DXB_MARINA','DXB_BBAY'].indexOf(f.district) >= 0; }); } },
    { id:'take',   text:'Take control (>50%) of another listed company', test:function () {
        return UAE.allCos().some(function (c) { return c.id !== UAE.S.playerCo && c.controller === 'PLAYER' && !c.createdByPlayer; }); } },
    { id:'bill',   text:'Become a billionaire (personal net worth AED 3.67bn)', test:function () { return UAE.personWealth(UAE.playerPerson()) >= 3.6725e9; } }
  ].map(function (g) { g.done = false; g.day = null; return g; });
};
UAE.checkGoals = function () {
  var co = UAE.co(UAE.S.playerCo);
  UAE.S.goals.forEach(function (g) {
    if (!g.done && g.test(co)) { g.done = true; g.day = UAE.S.day; UAE.news('GOAL ACHIEVED: ' + g.text, 'goal'); }
  });
};

/* ============================================= VALUATION BREAKDOWN ====== */
/** Every step of how the game values a company (same formulas as UAE.fundamental / privateValue / marketDay). */
UAE.valuationBreakdown = function (co) {
  var sec = UAE.SECTORS[co.sector] || UAE.SECTORS.holding, t = UAE.totals(co), ttm = UAE.ttm(co), ni = UAE.netIncome(ttm), bv = t.equity;
  var h = co.history, revNow = h.length ? h[h.length - 1].rev : 0, revAgo = h.length >= 13 ? h[h.length - 13].rev : 0;
  var rawGrowth = revAgo > 0 ? revNow / revAgo : null;
  var growth = rawGrowth ? Math.max(0.7, Math.min(1.6, Math.pow(rawGrowth, 0.5))) : 1;
  var earnValue = Math.max(0, ni) * sec.pe * growth;
  var ir = 1 + Math.min(0.1, (co.hqBudget && co.hqBudget.ir || 0) / 5e6 * 0.02);
  var st = UAE.stakeValue(co), bvOwn = bv - st.cost;            // stakes in other companies are valued separately (sum of the parts)
  var floor = bvOwn * 0.6, blend = earnValue * 0.7 + bvOwn * 0.45, fundEquity = Math.max(floor, blend) * ir + st.val;
  var listed = UAE.isTradable(co), mood = UAE.S.macro.equity;
  var r = { co: co, sector: sec.name, pe: sec.pe, assets: t.assets, liabs: t.liabs, book: bv, shareCap: co.bs.shareCap, retained: co.bs.retained,
    revTTM: ttm.revenue, ni: ni, revNow: revNow, revAgo: revAgo, rawGrowth: rawGrowth, growth: growth, earnValue: earnValue, ir: ir, floor: floor, blend: blend,
    fundEquity: fundEquity, mood: mood, listed: listed, shares: co.shares, seed: !!(co.seed && co.seedPrice), stakes: st.val, stakeCost: st.cost, stakeList: st.list, bookOwn: bvOwn };
  if (listed) {
    r.fundPrice = UAE.fundamental(co) * mood; r.price = co.price; r.mcap = UAE.mcap(co);
    r.gap = r.fundPrice / co.price - 1; r.value = r.mcap;
  } else {
    r.privFloor = bvOwn; r.privBlend = bvOwn * 0.5 + Math.max(0, ni) * sec.pe * 0.8; r.value = UAE.privateValue(co);
  }
  r.implied = r.value - bv;                         // value the balance sheet does not show (brand, technology, customers, growth)
  r.peRatio = ni > 0 ? r.value / ni : null; r.pb = bv > 0 ? r.value / bv : null;
  return r;
};
