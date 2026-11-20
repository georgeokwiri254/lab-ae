/* ============================================================================
 * UAE CAPITALISM LAB  -  ENGINE CORE
 * State container, deterministic RNG, ids, calendar and the ACCOUNTING LEDGER.
 *
 * Accounting rule: every money movement goes through UAE.L.* so that
 *   Assets = Liabilities + Equity   holds at every tick, and the cash-flow
 *   statement (op / inv / fin buckets) reconciles to the change in cash.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* Rent anchors (EST): annual rent per apartment unit, office rent per m2/yr */
UAE.RENT = {
  DXB:{ unit:90000, office:1400 }, AUH:{ unit:80000, office:1100 }, AAN:{ unit:45000, office:500 },
  RUW:{ unit:50000, office:500 },  SHJ:{ unit:38000, office:550 },  AJM:{ unit:32000, office:420 },
  UAQ:{ unit:28000, office:300 },  RAK:{ unit:35000, office:400 },  FUJ:{ unit:32000, office:350 }
};
/* Hotel room supply per city, rooms (DXB ~154k EST from DET; others EST) */
UAE.HOTEL_ROOMS = { DXB:154000, AUH:34000, AAN:4500, RUW:1500, SHJ:9000, AJM:3500, UAQ:900, RAK:9500, FUJ:3500 };

/* ---------------------------------------------------------------- RNG --- */
UAE.rng = {
  /** mulberry32 - deterministic so a saved game replays identically */
  next: function () {
    var S = UAE.S; var t = (S.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
  range: function (a, b) { return a + (b - a) * UAE.rng.next(); },
  int: function (a, b) { return Math.floor(UAE.rng.range(a, b + 1)); },
  pick: function (arr) { return arr[Math.floor(UAE.rng.next() * arr.length)]; },
  normal: function () { // Box-Muller
    var u = Math.max(1e-9, UAE.rng.next()), v = UAE.rng.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },
  chance: function (p) { return UAE.rng.next() < p; }
};

/* ---------------------------------------------------------------- IDs --- */
UAE.uid = function (prefix) { UAE.S.nextId = (UAE.S.nextId || 1) + 1; return prefix + UAE.S.nextId; };

/* ------------------------------------------------------------ Calendar --- */
UAE.cal = {
  START: Date.UTC(2026, 10, 20),                 // 20 Nov 2026 = data snapshot date
  date: function (day) { return new Date(UAE.cal.START + (day == null ? UAE.S.day : day) * 864e5); },
  month: function (day) { return UAE.cal.date(day).getUTCMonth(); },
  year: function (day) { return UAE.cal.date(day).getUTCFullYear(); },
  /** UAE weekend is Saturday-Sunday since 2022 (REAL) - exchanges closed */
  tradingDay: function (day) { var d = UAE.cal.date(day).getUTCDay(); return d !== 0 && d !== 6; },
  isMonthEnd: function (day) { return UAE.cal.date(day + 1).getUTCDate() === 1; },
  isYearEnd: function (day) { var n = UAE.cal.date(day + 1); return n.getUTCDate() === 1 && n.getUTCMonth() === 0; },
  label: function (day) {
    var d = UAE.cal.date(day);
    return d.getUTCDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
};

/* ------------------------------------------------------- Lookup helpers --- */
UAE.co = function (id) { return UAE.S.companies[id]; };
UAE.firm = function (id) { return UAE.S.firms[id]; };
UAE.person = function (id) { return UAE.S.persons[id]; };
UAE.player = function () { return UAE.S.companies[UAE.S.activeCo]; };
UAE.playerPerson = function () { return UAE.S.persons[UAE.S.playerPerson]; };
UAE.firmsOf = function (coId) {
  var out = [], F = UAE.S.firms; for (var k in F) if (F[k].owner === coId) out.push(F[k]); return out;
};
UAE.allFirms = function () { var F = UAE.S.firms, out = []; for (var k in F) out.push(F[k]); return out; };
UAE.allCos = function () { var C = UAE.S.companies, out = []; for (var k in C) out.push(C[k]); return out; };
/** True if the human controls this company (own, subsidiary or taken-over). */
UAE.isHuman = function (co) { return co && co.controller === 'PLAYER'; };

/* ================================================================ LEDGER ==
 * Income-statement lines (co.is.cur / ytd):
 *   revenue cogs salaries utilities advertising training rnd maintenance
 *   coreOpex otherOpex depreciation interestExp interestInc investInc tax
 * Balance sheet (co.bs):
 *   ASSETS  cash, land, ppe, invest (shares/bonds at cost), deposits,
 *           loanBook (bank lending), coreAssets (legacy group assets)
 *           + inventory (computed from firm stock, see UAE.inventoryValue)
 *   LIABS   loans, bonds, custDeposits (bank deposits), coreLiab
 *   EQUITY  shareCap, retained, -treasury
 * ========================================================================*/
UAE.IS_LINES = ['revenue','cogs','salaries','utilities','advertising','training','rnd','maintenance',
  'coreOpex','otherOpex','depreciation','interestExp','interestInc','investInc','tax'];
UAE.newIS = function () { var o = {}; UAE.IS_LINES.forEach(function (k) { o[k] = 0; }); return o; };
UAE.newCF = function () { return { op:0, inv:0, fin:0 }; };

UAE.L = {
  _cash: function (co, amt, bucket) {
    co.bs.cash += amt;
    co.cf.cur[bucket] += amt; co.cf.ytd[bucket] += amt;
  },
  _is: function (co, line, amt) { co.is.cur[line] += amt; co.is.ytd[line] += amt; },
  /** Revenue or other income received in cash. */
  income: function (co, line, amt, bucket) {
    if (!amt) return; UAE.L._cash(co, amt, bucket || 'op'); UAE.L._is(co, line, amt); co.bs.retained += amt;
  },
  /** Expense paid in cash. */
  expense: function (co, line, amt, bucket) {
    if (!amt) return; UAE.L._cash(co, -amt, bucket || 'op'); UAE.L._is(co, line, amt); co.bs.retained -= amt;
  },
  /** Cash spent on inventory (asset swap: cash -> firm stock). */
  buyInventory: function (co, amt) { UAE.L._cash(co, -amt, 'op'); },
  /** Inventory consumed by a sale (non-cash expense). */
  cogs: function (co, amt) { UAE.L._is(co, 'cogs', amt); co.bs.retained -= amt; },
  /** Non-cash expense that reduces an asset (depreciation, loan provisions). */
  writeDown: function (co, line, amt, assetKey) {
    co.bs[assetKey] -= amt; UAE.L._is(co, line, amt); co.bs.retained -= amt;
  },
  capex: function (co, building, land) {
    UAE.L._cash(co, -(building + land), 'inv'); co.bs.ppe += building; co.bs.land += land;
  },
  /** Sale of a fixed asset; gain/loss vs book value goes to investInc. */
  disposal: function (co, proceeds, bookPpe, bookLand) {
    UAE.L._cash(co, proceeds, 'inv'); co.bs.ppe -= bookPpe; co.bs.land -= bookLand;
    var gain = proceeds - bookPpe - bookLand; UAE.L._is(co, 'investInc', gain); co.bs.retained += gain;
  },
  borrow: function (co, amt, key) { UAE.L._cash(co, amt, 'fin'); co.bs[key] += amt; },
  repay: function (co, amt, key) { UAE.L._cash(co, -amt, 'fin'); co.bs[key] -= amt; },
  issueEquity: function (co, amt) { UAE.L._cash(co, amt, 'fin'); co.bs.shareCap += amt; },
  buyback: function (co, amt) { UAE.L._cash(co, -amt, 'fin'); co.bs.treasury += amt; },
  dividend: function (co, amt) { UAE.L._cash(co, -amt, 'fin'); co.bs.retained -= amt; co.divPaidYtd += amt; },
  /** Buy a financial asset (shares, bonds, deposits). */
  invest: function (co, amt, key) { UAE.L._cash(co, -amt, 'inv'); co.bs[key || 'invest'] += amt; },
  /** Sell a financial asset; realised gain booked to investInc. */
  divest: function (co, proceeds, basis, key) {
    UAE.L._cash(co, proceeds, 'inv'); co.bs[key || 'invest'] -= basis;
    var g = proceeds - basis; UAE.L._is(co, 'investInc', g); co.bs.retained += g;
  },
  /** Bank: customer deposit in/out (liability) and lending out/in (asset). */
  bankDeposit: function (co, amt) { UAE.L._cash(co, amt, 'fin'); co.bs.custDeposits += amt; },
  bankLend: function (co, amt) { UAE.L._cash(co, -amt, 'op'); co.bs.loanBook += amt; }
};

/** Inventory value = sum of every firm's stock at average cost. */
UAE.inventoryValue = function (co) {
  var v = 0; UAE.firmsOf(co.id).forEach(function (f) {
    for (var p in f.stock) v += f.stock[p].q * f.stock[p].cost;
  }); return v;
};
UAE.totals = function (co) {
  var b = co.bs, inv = UAE.inventoryValue(co);
  var assets = b.cash + inv + b.land + b.ppe + b.invest + b.deposits + b.loanBook + b.coreAssets;
  var liabs = b.loans + b.bonds + b.custDeposits + b.coreLiab;
  var equity = b.shareCap + b.retained - b.treasury;
  return { inventory: inv, assets: assets, liabs: liabs, equity: equity, check: assets - liabs - equity };
};

/** Fresh company object. Most fields are filled by UAE.newGame. */
UAE.makeCompany = function (o) {
  var co = {
    id: o.id, name: o.name, ticker: o.ticker || '', exch: o.exch || '', status: o.status || 'PRIVATE',
    hq: o.hq, sector: o.sector, seed: !!o.seed, fictional: !!o.fictional, controller: o.controller || 'AI',
    parent: o.parent || null, ceo: null, founded: UAE.S ? UAE.S.day : 0, color: o.color || null,
    bs: { cash:0, land:0, ppe:0, invest:0, deposits:0, loanBook:0, coreAssets:0,
          loans:0, bonds:0, custDeposits:0, coreLiab:0, shareCap:0, retained:0, treasury:0 },
    is: { cur: UAE.newIS(), ytd: UAE.newIS(), months: [], years: [] },
    cf: { cur: UAE.newCF(), ytd: UAE.newCF(), months: [], years: [] },
    shares: o.shares || 0, holders: {}, price: o.price || 0, priceHist: [], seedPrice: o.price || 0,
    legacy: null, loanList: [], bondList: [], depositList: [], portfolio: {}, bondPositions: {},
    brand: {}, tech: {}, payout: o.payout == null ? 0.4 : o.payout, divPaidYtd: 0,
    hqBudget: { cmo:0, pr:0, hr:0, cto:0, ir:0, community:0 }, autoPricing: false, autoRent: true,
    traits: o.traits || { aggression:0.5, risk:0.5, pricing:0.5, diversify:0.3 },
    history: [], credit: 'A', bankRates: { deposit: 0.03, lending: 0.065 }, insRate: 1.0
  };
  return co;
};
