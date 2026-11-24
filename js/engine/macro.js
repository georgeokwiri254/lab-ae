/* ============================================================================
 * UAE CAPITALISM LAB  -  PERIOD CLOSING, TAX, MACRO-ECONOMY & EVENTS
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/** Net income of an income-statement object. */
UAE.netIncome = function (is) {
  return is.revenue + is.interestInc + is.investInc -
    (is.cogs + is.salaries + is.utilities + is.advertising + is.training + is.rnd + is.maintenance +
     is.coreOpex + is.otherOpex + is.depreciation + is.interestExp + is.tax);
};
UAE.pbt = function (is) { return UAE.netIncome(is) + is.tax; };
UAE.ebitda = function (is) {
  return is.revenue - (is.cogs + is.salaries + is.utilities + is.advertising + is.training + is.rnd + is.maintenance + is.coreOpex + is.otherOpex);
};
/** Trailing-twelve-month income statement (sum of last 12 closed months). */
UAE.ttm = function (co) {
  var o = UAE.newIS(), ms = co.is.months.slice(-12);
  ms.forEach(function (m) { for (var k in o) o[k] += m[k] || 0; });
  if (ms.length < 12 && ms.length > 0) { var f = 12 / ms.length; for (var k in o) o[k] *= f; }
  if (!ms.length) { var d = Math.max(1, UAE.S.day % 31 + 1), g = 365 / d; for (var j in o) o[j] = co.is.cur[j] * g; }
  return o;
};

/* ========================================================= MONTH END ==== */
UAE.monthEnd = function () {
  var S = UAE.S, month = UAE.cal.month();
  UAE.allCos().forEach(function (co) {
    // depreciation on buildings & equipment (straight-line 25y, SYN mix)
    UAE.firmsOf(co.id).forEach(function (f) {
      if (f.seed || !f.ppe) return;
      var dep = f.ppe / (UAE.RULES.depreciationYears * 12);
      f.ppe -= dep; UAE.L.writeDown(co, 'depreciation', dep, 'ppe'); f.m.cost += dep;
    });
    // loans & bonds interest, deposits interest
    co.loanList.forEach(function (l) {
      UAE.L.expense(co, 'interestExp', l.amt * l.rate / 12);
      var lender = l.bank && UAE.co(l.bank); if (lender && lender.status !== 'BANKRUPT' && UAE.gameLoanInterest) UAE.gameLoanInterest(lender, l.amt * l.rate / 12);   // paid to the game bank
    });
    co.bondList.forEach(function (b) { UAE.L.expense(co, 'interestExp', b.amt * b.coupon / 12); });
    if (UAE.loanInstalments && co.loanList.length) UAE.loanInstalments(co);        // scheduled principal repayments
    co.depositList.forEach(function (d) { UAE.L.income(co, 'interestInc', d.amt * d.rate / 12); });
    // bond coupons received
    for (var bid in co.bondPositions) {
      var pos = co.bondPositions[bid], bond = S.bonds[bid];
      if (bond && pos.face > 0) UAE.L.income(co, 'interestInc', pos.face * bond.coupon / 12, 'inv');
    }
    // corporate tax accrual: 9% of YTD profit above AED 375,000 (REAL rule)
    var ytd = UAE.pbt(co.is.ytd);
    var due = Math.max(0, ytd - UAE.RULES.corpTaxFree) * UAE.RULES.corpTax - co.is.ytd.tax;
    if (due > 0) { UAE.L.expense(co, 'tax', due); S.cities[co.hq].ct += due; S.cities[co.hq].govRevYtd += due; }
    // legacy groups reinvest part of profit into their core asset base
    if (co.legacy) {
      var ni = UAE.netIncome(co.is.cur);
      if (ni > 0 && co.bs.cash > co.bs.coreAssets * 0.06) {
        var capex = ni * 0.35; UAE.L._cash(co, -capex, 'inv'); co.bs.coreAssets += capex;
      }
    }
    // CEO salary from company to person
    var ceo = UAE.person(co.ceo);
    if (ceo && ceo.isPlayer && ceo.salary) { UAE.L.expense(co, 'salaries', ceo.salary); ceo.cash += ceo.salary * 0.9; }   // your own salary
    if (UAE.payExecs) UAE.payExecs(co);   // hired CEO / CMO / CTO: base + revenue bonus + profit share (engine/pay.js)
    else if (ceo && !ceo.isPlayer && ceo.salary) { UAE.L.expense(co, 'salaries', ceo.salary); ceo.cash += ceo.salary * 0.9; }
    // roll the month
    co.is.months.push(Object.assign({ day: S.day }, co.is.cur)); if (co.is.months.length > 60) co.is.months.shift();
    co.cf.months.push(Object.assign({ day: S.day }, co.cf.cur)); if (co.cf.months.length > 60) co.cf.months.shift();
    co.is.cur = UAE.newIS(); co.cf.cur = UAE.newCF();
    var tot = UAE.totals(co);
    co.history.push({ day: S.day, cash: co.bs.cash, assets: tot.assets, equity: tot.equity, price: co.price,
      mcap: co.price * co.shares, ni: UAE.netIncome(co.is.months[co.is.months.length - 1]), rev: co.is.months[co.is.months.length - 1].revenue });
    if (co.history.length > 120) co.history.shift();
    // credit rating from leverage & coverage
    var debt = co.bs.loans + co.bs.bonds, eq = Math.max(1, tot.equity);
    var lev = debt / eq;
    co.credit = lev < 0.3 ? 'AA' : lev < 0.7 ? 'A' : lev < 1.2 ? 'BBB' : lev < 2 ? 'BB' : 'B';
  });
  // quarterly dividends (Mar, Jun, Sep, Dec closings)
  if (month % 3 === 2) UAE.allCos().forEach(UAE.payDividend);
  // firms: roll monthly P&L
  UAE.allFirms().forEach(function (f) {
    f.last = { rev: f.m.rev, cost: f.m.cost, profit: f.m.rev - f.m.cost, va: UAE.firmVA(f) };
    f.hist.push(f.last.profit); if (f.hist.length > 24) f.hist.shift();
    f.m = { rev: 0, cost: 0 };
    f.lines.forEach(function (l) { l.made = 0; l.exported = 0; if (UAE.FIRM_TYPES[f.type].kind !== 'retail') l.sold = 0; });   // producers: monthly counters
  });
  if (UAE.financeMonth) UAE.financeMonth();      // bank & insurer division books (engine/finance2.js)
  UAE.macroMonth();
  if (UAE.econMonth) UAE.econMonth();
  if (UAE.govDevMonth) UAE.govDevMonth();     // government reinvests revenue: housing, offices, civic, roads, new zones (engine/govdev.js)      // national & world macroeconomy, central banks (engine/macro2.js)
  UAE.microMonth();          // product market history (engine/micro.js)
  if (UAE.worldMonth) UAE.worldMonth();
  if (UAE.talentMonth) UAE.talentMonth();
  if (UAE.ipoMonth) UAE.ipoMonth();
  if (UAE.bondMarketMonth) UAE.bondMarketMonth();   // new government & corporate bonds, computer investors buy (engine/ceoinvest.js)           // about 5 private computer companies list on DFM / ADX each year (engine/market.js)     // 3 elite CEO candidates join the talent market each month (engine/ceo.js)
  if (UAE.nameSyncAll) UAE.nameSyncAll();    // names follow the product / title / research target     // global reach, world rankings (engine/worldmkt.js)
  UAE.expertiseMonth();      // managers and CEOs gain expertise (engine/ceo.js)
  UAE.checkGoals();
};

UAE.creditSpread = function (co) {
  return { AA: 0.010, A: 0.018, BBB: 0.028, BB: 0.045, B: 0.07 }[co.credit || 'A'];
};

/** Pay dividend = payout x last-quarter profit, pro rata to holders. */
UAE.payDividend = function (co) {
  if (!co.payout || co.status === 'BANKRUPT') return;
  var q = co.is.months.slice(-3).reduce(function (s, m) { return s + UAE.netIncome(m); }, 0);
  var amt = q * co.payout;
  if (amt <= 0 || co.bs.cash < amt * 1.5) return;
  UAE.distribute(co, amt, 'dividend');
};
/** Distribute cash to shareholders (dividend or special dividend). */
UAE.distribute = function (co, amt, kind) {
  UAE.L.dividend(co, amt);
  var outstanding = 0; for (var h in co.holders) outstanding += co.holders[h];
  if (!outstanding) return;
  for (var k in co.holders) {
    var share = amt * co.holders[k] / outstanding;
    if (k.indexOf('P:') === 0) { var p = UAE.person(k.slice(2)); if (p) p.cash += share; }
    else if (k.indexOf('C:') === 0) { var c = UAE.co(k.slice(2)); if (c) UAE.L.income(c, 'investInc', share, 'inv'); }
    else if (k.indexOf('V:') === 0 && UAE.vcCredit) UAE.vcCredit(k, share);                  // venture funds
    else if (k.indexOf('I:') === 0 && UAE.govDividend) UAE.govDividend(k, share);           // government shareholders: into the emirate budget
  }
  if (UAE.isHuman(co) || co.holders['P:' + UAE.S.playerPerson] || co.holders['C:' + UAE.S.playerCo])
    UAE.news(co.name + ' paid a ' + (kind || 'dividend') + ' of ' + UAE.fmt.aed(amt) + '.', 'finance');
};

/* ========================================================== YEAR END ==== */
UAE.yearEnd = function () {
  var S = UAE.S, yr = UAE.cal.year();
  UAE.allCos().forEach(function (co) {
    co.is.years.push(Object.assign({ year: yr }, co.is.ytd)); if (co.is.years.length > 20) co.is.years.shift();
    co.cf.years.push(Object.assign({ year: yr }, co.cf.ytd));
    co.is.ytd = UAE.newIS(); co.cf.ytd = UAE.newCF(); co.divPaidYtd = 0;
  });
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], C = UAE.CITIES[k];
    c.lastGov = { rev: c.govRevYtd, exp: c.govExpYtd, bal: c.govRevYtd - c.govExpYtd, vat: c.vat, ct: c.ct };
    c.govDebt -= (c.govRevYtd - c.govExpYtd) * 0.5;   // half of surplus/deficit to debt (SYN rule)
    c.govRevYtd = 0; c.govExpYtd = 0; c.vat = 0; c.ct = 0;
  });
  UAE.news('Year ' + yr + ' closed. Annual reports published for all companies.', 'system');
};

/* ===================================================== CITY MACRO ==== */
/* GDP (income / production approach): value added of a firm = its revenue minus what it buys from other firms
 * (goods, utilities, advertising, rent, services) = wages + profit + depreciation + interest it pays.
 * Banks: interest paid to depositors is their main input, so it is deducted (interest margin = their output). */
UAE.firmVA = function (f) {
  var bank = /^bank/.test(f.type);
  return Math.max(0, f.m.rev - f.m.cost + (f.m.wage || 0) + (bank ? 0 : (f.m.int || 0)));
};
/** City GDP shown in the game = the rest of the economy (c.gdp, real 2025 figures growing on trend - drives demand)
 *  + the value added of every modelled company's firms in that city (last month x 12). AED bn / year. */
UAE.cityGdp = function (c) { return c.gdp + (c.modelVA || 0); };
UAE.macroMonth = function () {
  var S = UAE.S, m = S.macro;
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], C = UAE.CITIES[k];
    // modelled firms' activity in this city (value added ~ 35% of revenue, EST)
    var rev = 0, jobs = 0, housing = 0, civic = 0;
    UAE.allFirms().forEach(function (f) {
      if (f.city !== k || f.status !== 'open') return;
      rev += f.last.va != null ? f.last.va : f.last.rev * 0.35; var T = UAE.FIRM_TYPES[f.type]; jobs += T.staff * (1 + 0.8 * (f.size - 1));
      if (f.type === 'apartment') housing += UAE.LEASE.apartmentUnits * f.size;
      if (f.type === 'civic' || f.type === 'sports') civic += f.size;
    });
    c.modelVA = rev * 12 / 1e9;                                   // value added of modelled firms, AED bn / year
    var shock = UAE.rng.normal() * 0.002;
    var g = C.growth / 12 * (0.5 + 0.5 * m.property) + shock + (m.retail - 1) * 0.01;
    c.gdp *= 1 + g;
    // population follows jobs, quality of life and housing affordability
    var affordability = 1 / c.rentIdx;
    c.qol = Math.max(20, Math.min(95, 55 + civic * 1.5 + (c.civic / 1e6) * 0.2 + (affordability - 1) * 25 + (m.tourism - 1) * 10 + (UAE.govQolBonus ? UAE.govQolBonus(c) : 0)));
    // jobs, immigration and housing (engine/govdev.js): people come for open jobs when there are homes for them
    var GD = UAE.govCityMonth ? UAE.govCityMonth(k, c, C, jobs, housing) : null;
    var popG = GD ? GD.popG : C.growth * 0.6 / 12 * (c.qol / 60) + (jobs / Math.max(1, c.pop)) * 0.02;
    c.pop *= 1 + popG;
    // prices: CPI drifts with the city trend; housing rents follow demand vs new supply
    var housingStock = c.pop / 2.9;
    var rentPressure = GD ? GD.rentPressure : popG * 12 - (housing / housingStock) * 0.02;   // rents follow the housing supply / demand index
    c.rentIdx *= 1 + rentPressure / 12 + (m.property - 1) * 0.004;
    c.rentIdx = Math.max(0.6, Math.min(2.2, c.rentIdx));
    c.landIdx *= 1 + (c.rentIdx - 1) * 0.004 + (m.property - 1) * 0.003;
    var cpiM = C.cpi / 12 + (c.rentIdx - 1) * 0.0005 + (m.oil - 1) * 0.0008;
    c.cpiIdx *= 1 + cpiM;
    c.wageIdx *= 1 + cpiM * 0.7 + C.growth / 12 * 0.3;
    c.unemp = Math.max(0.005, Math.min(0.15, c.unemp * 0.97 + C.unemp * 0.03 - jobs / Math.max(1, c.pop) * 0.002));
    c.tourists = C.tourists * Math.pow(1 + C.growth, S.day / 365) * m.tourism;
    // government budget: published baseline + modelled taxes (VAT/CT/customs posted during the month)
    c.govRevYtd += C.govRev * 1e9 / 12 * (c.gdp / C.gdp);
    c.govExpYtd += C.govExp * 1e9 / 12 * (c.gdp / C.gdp) + c.civic;
    c.civic = 0;
    // ---- city statistics for the City Graphs (Capitalism Lab: city / economic / government graphs)
    var apt = { occ: 0, rent: 0, n: 0 }, off = { occ: 0, rent: 0, n: 0 }, hot = { occ: 0, adr: 0, n: 0 }, firmsN = 0;
    UAE.allFirms().forEach(function (f) {
      if (f.city !== k || f.status !== 'open') return; firmsN++;
      if (f.type === 'apartment') { apt.occ += f.occ; apt.rent += f.rent; apt.n++; }
      if (f.type === 'commercial') { off.occ += f.occ; off.rent += f.rent; off.n++; }
      if (f.type === 'hotel') { hot.occ += f.occ; hot.adr += f.adr; hot.n++; }
    });
    var yrAgo = c.hist.length >= 12 ? c.hist[c.hist.length - 12] : null;
    var gdpM = c.gdp * 1e9 / 12, govM = C.govExp * 1e9 / 12 * (c.gdp / C.gdp);
    var cons = gdpM * 0.38 * m.retail * UAE.season('retail'), inv = gdpM * 0.21 * (0.7 + 0.3 * m.property) + (c.investM || 0);
    c.hist.push({ day: S.day, gdp: c.gdp, pop: c.pop, cpi: c.cpiIdx, unemp: c.unemp, qol: c.qol, rent: c.rentIdx,
      retail: c.retailSales, tourists: c.tourists, gov: c.govRevYtd - c.govExpYtd,
      wage: C.wage * c.wageIdx, land: c.landIdx, rate: m.rate, ppower: 100 / c.cpiIdx * 100,
      infl: yrAgo ? c.cpiIdx / yrAgo.cpi - 1 : C.cpi, jobs: jobs, firms: firmsN,
      cons: cons, inv: inv, govSp: govM, nx: gdpM - cons - inv - govM, exports: c.exportsM || 0, imports: c.importsM || 0,
      retailPc: c.retailSales / Math.max(1, c.pop), aptOcc: apt.n ? apt.occ / apt.n : null, aptRent: apt.n ? apt.rent / apt.n : null,
      offOcc: off.n ? off.occ / off.n : null, hotOcc: hot.n ? hot.occ / hot.n : null, hotAdr: hot.n ? hot.adr / hot.n : null,
      fund: -c.govDebt });
    if (c.hist.length > 240) c.hist.shift();
    c.retailSalesM = c.retailSales; c.retailSales = 0; c.exportsM = 0; c.importsM = 0; c.investM = 0;
  });
  // macro shocks decay back toward 1
  ['oil','gold','tourism','retail','property','logistics','tech','equity'].forEach(function (k) {
    m[k] = 1 + (m[k] - 1) * 0.9;
  });
  m.oil *= 1 + UAE.rng.normal() * 0.04;
};

/* ===================================================== DAILY EVENTS ==== */
UAE.eventsDay = function () {
  var S = UAE.S, m = S.macro, d = UAE.cal.date();
  UAE.EVENTS.forEach(function (ev) {
    if (!UAE.rng.chance(ev.p / 30)) return;     // p is per-month probability
    for (var k in ev.fx) {
      if (k === 'rate') m.rate = Math.max(0.0025, Math.min(0.08, m.rate + ev.fx[k]));
      else m[k] = (m[k] || 1) * (1 + ev.fx[k]);
    }
    UAE.news(ev.title, 'event');
  });
  // fixed calendar events
  UAE.CALENDAR.forEach(function (ev) {
    if (d.getUTCMonth() === ev.m && d.getUTCDate() === ev.d) {
      UAE.news(ev.title, 'event');
      m.timed.push({ until: S.day + ev.days, fx: ev.fx });
    }
  });
  // apply timed city effects
  Object.keys(S.cities).forEach(function (k) { S.cities[k].fx = {}; });
  m.timed = m.timed.filter(function (t) { return t.until >= S.day; });
  m.timed.forEach(function (t) {
    for (var key in t.fx) {
      var city = key.slice(-3), kind = key.slice(0, -3);
      if (S.cities[city]) S.cities[city].fx[kind] = (S.cities[city].fx[kind] || 0) + t.fx[key];
    }
  });
  // slow mean reversion of oil to 1 each day + noise (Brent proxy)
  m.oil = Math.max(0.4, Math.min(2.2, m.oil * (1 + UAE.rng.normal() * 0.012) + (1 - m.oil) * 0.003));
  m.gold = Math.max(0.5, Math.min(2.5, m.gold * (1 + UAE.rng.normal() * 0.008) + (1 - m.gold) * 0.002));
};

/* ===================================================== MASTER TICK ==== */
UAE.tick = function () {
  var S = UAE.S;
  if (UAE.fixAccidentalTakeovers && !(S.fixes && S.fixes.takeover2046)) UAE.fixAccidentalTakeovers();
  UAE._idx = {};                                     // per-day lookup cache (engine/sim.js UAE.dayIdx)
  try { UAE.tickBody(S); } finally { UAE._idx = null; }
};
UAE.tickBody = function (S) {
  UAE.eventsDay();
  UAE.simDay();
  if (UAE.cal.tradingDay(S.day)) UAE.marketDay();
  UAE.AI.day();
  if (UAE.execsDay) UAE.execsDay();                 // CMO advertising + CTO research (engine/execs.js)
  if (UAE.cal.isMonthEnd(S.day)) UAE.monthEnd();
  if (UAE.cal.isYearEnd(S.day)) UAE.yearEnd();
  UAE.bankruptcyCheck();
  S.day += 1;
};

/** Companies with negative cash after credit lines are exhausted go bankrupt. */
UAE.bankruptcyCheck = function () {
  UAE.allCos().forEach(function (co) {
    if (co.bs.cash >= 0 || co.status === 'BANKRUPT') return;
    // automatic emergency credit line if equity allows
    var tot = UAE.totals(co), limit = Math.max(0, tot.equity * 0.6) - co.bs.loans;
    var need = -co.bs.cash + 1e6;
    if (limit > need) {
      UAE.takeLoan(co, need, true);
      if (UAE.isHuman(co)) UAE.news(co.name + ' drew an emergency credit line of ' + UAE.fmt.aed(need) + ' (cash went negative).', 'warning');
      return;
    }
    if (co.controller === 'PLAYER' && co.id === UAE.S.playerCo) {
      UAE.news('WARNING: ' + co.name + ' is insolvent. Sell assets or raise equity immediately!', 'warning');
      return;
    }
    co.status = 'BANKRUPT';
    if (UAE.gameLoanDefault) UAE.gameLoanDefault(co);                                            // lending banks write their loans off
    UAE.news(co.name + ' has been declared bankrupt. Its firms are being liquidated.', 'event');
    UAE.firmsOf(co.id).slice().forEach(function (f) { UAE.sellFirm(f, { allowHQ: true }); });
    co.price = 0.01;
  });
};
