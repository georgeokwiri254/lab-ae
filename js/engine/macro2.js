/* ============================================================================
 * UAE CAPITALISM LAB  -  NATIONAL & WORLD MACROECONOMY
 *  - World economies (data/nations.js) start from real figures and each runs its own
 *    business cycle: GDP growth, inflation, unemployment, government debt.
 *  - Central banks set policy rates monthly with a Taylor rule (inflation vs target,
 *    economic slack), in 0.25% steps. The CBUAE follows the US Fed (dirham peg:
 *    base rate = Fed mid-point + 0.025%), and that rate drives every loan, deposit
 *    and bond in the game (S.macro.rate).
 *  - UAE business cycle (boom / expansion / slowdown / recession / recovery) driven
 *    by the world economy and oil; it moves consumer demand, property, the stock
 *    market, tourism, GDP and unemployment in every emirate.
 *  - Government: fiscal stance (stimulus in recessions, consolidation in booms) and
 *    taxes collected (corporate tax, VAT, customs) from game companies.
 *  - SCA (UAE securities regulator): ownership disclosures at 5 / 10 / 25 / 30 / 50%.
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.ECON = { dataYear: 2026, peg: 0.00025, step: 0.0025 };
UAE.PHASES = { boom: 'Boom', expansion: 'Expansion', slowdown: 'Slowdown', recession: 'Recession', recovery: 'Recovery' };
UAE.phaseOf = function (cyc, vel, growth) {
  if (cyc < -0.3 || growth < 0) return 'recession';
  if (cyc > 0.5) return 'boom';
  if (vel < -0.005 && cyc > -0.3) return 'slowdown';
  if (vel > 0.005 && cyc < 0.1) return 'recovery';
  return 'expansion';
};
/* neutral rate: half the textbook value (real growth/2 + inflation target), half the bank's real current rate */
UAE.neutralRate = function (n) { var t = Math.max(0.005, n.trend * 0.5) + n.target, d = (UAE.NATIONS.filter(function (x) { return x.id === n.id; })[0] || {}).rate; return d != null ? (t + d) / 2 : t; };
UAE.taylor = function (n) {
  var t = UAE.neutralRate(n) + 1.5 * (n.infl - n.target) + 0.8 * (n.nat - n.unemp);
  return Math.max(0, Math.min(0.25, t));
};

/** Create world + national economy state (on a new game or an older save). */
UAE.econInit = function () {
  var S = UAE.S; if (S.world && S.econ) return;
  var yrs = Math.max(0, UAE.cal.year(S.day) - UAE.ECON.dataYear), W = { nations: {} };
  UAE.NATIONS.forEach(function (d) {
    var n = JSON.parse(JSON.stringify(d)); n.real = { gdp: d.gdp, growth: d.growth, infl: d.infl, unemp: d.unemp, rate: d.rate, debt: d.debt };
    if (yrs > 0) {          // older save: project from the real data to today's game year along the long-run trend
      n.gdp = d.gdp * Math.pow(1 + d.trend + d.target, yrs); n.pop = d.pop * Math.pow(1.006, yrs);
      var w = Math.min(1, yrs / 3); n.growth = d.growth + (d.trend - d.growth) * w; n.infl = d.infl + (d.target - d.infl) * w; n.unemp = d.unemp + (d.nat - d.unemp) * w;
      n.rate = d.rate + (UAE.neutralRate(d) - d.rate) * w;
    }
    n.cycle = Math.max(-0.8, Math.min(0.8, (n.growth - n.trend) * 20)); n.vel = 0; n.phase = UAE.phaseOf(n.cycle, 0, n.growth); n.hist = [];
    W.nations[n.id] = n;
  });
  S.world = W;
  var fed = W.nations.US;
  S.econ = { cycle: 0.1, vel: 0, phase: 'expansion', cbRate: Math.round((fed.rate + UAE.ECON.peg) * 10000) / 10000, stance: 'neutral', hist: [], disc: {}, decisions: [] };
  S.macro.rate = S.econ.cbRate;
};

/** National UAE totals from the game's emirate economies. */
UAE.uaeStats = function () {
  var S = UAE.S, gdp = 0, pop = 0, un = 0, inf = 0, ct = 0, vat = 0, govRev = 0, govExp = 0, debt = 0;
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], C = UAE.CITIES[k], h = c.hist[c.hist.length - 1];
    gdp += c.gdp; pop += c.pop; un += c.unemp * c.pop; inf += (h ? h.infl : C.cpi) * c.pop;
    ct += c.ct || 0; vat += c.vat || 0; govRev += c.govRevYtd || 0; govExp += c.govExpYtd || 0; debt += c.govDebt || 0;
  });
  var E = S.econ || {}, H = E.hist || [], yr = H.length >= 12 ? H[H.length - 12] : null;
  var tax = 0; UAE.allCos().forEach(function (co) { if (!co.foreign) tax += (co.is.ytd && co.is.ytd.tax) || 0; });
  return { gdp: gdp, pop: pop, unemp: un / Math.max(1, pop), infl: inf / Math.max(1, pop), growth: yr ? gdp / yr.gdp - 1 - inf / Math.max(1, pop) : (UAE.NATIONS.filter(function (n) { return n.id === 'AE'; })[0] || {}).growth,
    ct: ct, vat: vat, govRev: govRev, govExp: govExp, debt: debt, coTax: tax, gdpUsd: gdp / UAE.RULES.usdAed };
};

/* --------------------------------------------------------- monthly update */
UAE.econMonth = function () {
  UAE.econInit();
  var S = UAE.S, W = S.world, E = S.econ, m = S.macro, R = UAE.rng, oil = (m.oil || 1) - 1;
  // 1 world economies: cycle, growth, unemployment, inflation, central bank, GDP, debt
  Object.keys(W.nations).forEach(function (id) {
    var n = W.nations[id]; if (n.game) return;
    n.vel = (n.vel - 0.03 * n.cycle + R.normal() * 0.05) * 0.88; n.cycle = Math.max(-1, Math.min(1, n.cycle + n.vel));
    n.growth += (n.trend + 0.03 * n.cycle - n.growth) * 0.3;
    n.unemp = Math.max(0.01, n.unemp + (n.nat * (1 - 0.35 * n.cycle) - n.unemp) * 0.15);
    var oilFx = id === 'SA' ? -oil * 0.01 : oil * 0.02;
    n.infl += (n.target + 0.015 * n.cycle + oilFx - n.infl) * 0.12 + R.normal() * 0.001;
    var tgt = UAE.taylor(n), diff = tgt - n.rate, old = n.rate;
    if (Math.abs(diff) >= UAE.ECON.step * 0.6 && R.chance(0.6)) n.rate = Math.max(0, n.rate + (diff > 0 ? 1 : -1) * UAE.ECON.step * (Math.abs(diff) > 0.015 ? 2 : 1));
    if (n.rate !== old) { n.lastMove = { day: S.day, from: old, to: n.rate }; if (id === 'US') UAE.news('Federal Reserve ' + (n.rate > old ? 'raises' : 'cuts') + ' rates by ' + ((Math.abs(n.rate - old)) * 100).toFixed(2) + '% to ' + ((n.rate - 0.00125) * 100).toFixed(2) + '–' + ((n.rate + 0.00125) * 100).toFixed(2) + '% (US inflation ' + (n.infl * 100).toFixed(1) + '%, unemployment ' + (n.unemp * 100).toFixed(1) + '%).', 'event'); }
    n.gdp *= 1 + (n.growth + n.infl) / 12; n.pop *= 1.0005;
    n.debt = Math.max(0.05, n.debt + (0.03 - 0.03 * n.cycle - (n.growth + n.infl) * n.debt) / 12);
    var oldPhase = n.phase; n.phase = UAE.phaseOf(n.cycle, n.vel, n.growth);
    if (n.phase !== oldPhase && (id === 'US' || id === 'CN')) UAE.news(n.name + ' economy enters ' + UAE.PHASES[n.phase].toLowerCase() + ' (growth ' + (n.growth * 100).toFixed(1) + '%).', 'event');
    n.hist.push({ day: S.day, gdp: n.gdp, growth: n.growth, infl: n.infl, unemp: n.unemp, rate: n.rate }); if (n.hist.length > 240) n.hist.shift();
  });
  // 2 UAE business cycle: follows the world (US 40%, China 30%, others 30%) and oil prices
  var others = Object.keys(W.nations).filter(function (k) { return k !== 'US' && k !== 'CN' && !W.nations[k].game; });
  var world = 0.4 * W.nations.US.cycle + 0.3 * W.nations.CN.cycle + 0.3 * others.reduce(function (t, k) { return t + W.nations[k].cycle; }, 0) / Math.max(1, others.length);
  E.vel = (E.vel - 0.03 * E.cycle + 0.04 * (world - E.cycle) + 0.08 * oil + R.normal() * 0.04) * 0.88;
  E.cycle = Math.max(-1, Math.min(1, E.cycle + E.vel));
  // effects on the game economy (the macro multipliers decay 10%/month, so these settle near 6-8% x cycle)
  m.retail += 0.006 * E.cycle; m.property += 0.008 * E.cycle; m.equity += 0.006 * E.cycle; m.tourism += 0.004 * E.cycle;
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], C = UAE.CITIES[k];
    c.unemp = Math.max(0.004, Math.min(0.2, c.unemp + (C.unemp * (1 - 0.5 * E.cycle) * (1 + 3 * Math.max(0, E.cbRate - 0.04)) - c.unemp) * 0.15));
    c.gdp *= 1 + 0.0015 * E.cycle;
  });
  // 3 central bank: CBUAE base rate follows the Fed (peg)
  var fed = W.nations.US, cb = Math.round((fed.rate + UAE.ECON.peg) * 10000) / 10000;
  if (Math.abs(cb - E.cbRate) > 1e-6) {
    E.decisions.unshift({ day: S.day, from: E.cbRate, to: cb }); if (E.decisions.length > 40) E.decisions.pop();
    UAE.news('CBUAE ' + (cb > E.cbRate ? 'raises' : 'cuts') + ' the base rate to ' + (cb * 100).toFixed(2) + '%, following the Fed (dirham peg). Loan, deposit and bond rates move with it.', 'finance');
    E.cbRate = cb;
  }
  m.rate = E.cbRate;
  // 4 government fiscal stance
  var st = E.cycle < -0.3 ? 'stimulus' : E.cycle > 0.5 ? 'consolidation' : 'neutral';
  if (st !== E.stance) UAE.news('UAE government fiscal stance: ' + (st === 'stimulus' ? 'STIMULUS – extra public spending to support the economy.' : st === 'consolidation' ? 'consolidation – spending held back while the economy booms.' : 'neutral.'), 'event');
  E.stance = st;
  if (st === 'stimulus') { m.retail += 0.004; Object.keys(S.cities).forEach(function (k) { var c = S.cities[k], C = UAE.CITIES[k]; c.govExpYtd += C.govExp * 1e9 / 12 * 0.08; }); }
  // 5 national statistics
  var oldPhase = E.phase, u = UAE.uaeStats();
  E.phase = UAE.phaseOf(E.cycle, E.vel, u.growth || 0);
  if (E.phase !== oldPhase) UAE.news('UAE economy enters ' + UAE.PHASES[E.phase].toUpperCase() + ' (growth ' + ((u.growth || 0) * 100).toFixed(1) + '%, unemployment ' + (u.unemp * 100).toFixed(1) + '%).', 'event');
  E.hist.push({ day: S.day, gdp: u.gdp, growth: u.growth, infl: u.infl, unemp: u.unemp, rate: E.cbRate, cycle: E.cycle, pop: u.pop }); if (E.hist.length > 240) E.hist.shift();
  var AE = W.nations.AE; if (AE) { AE.gdp = u.gdpUsd; AE.growth = u.growth || AE.growth; AE.infl = u.infl; AE.unemp = u.unemp; AE.rate = E.cbRate; AE.pop = u.pop / 1e6; AE.cycle = E.cycle; AE.phase = E.phase; AE.debt = u.debt / Math.max(1, u.gdp); }
};

/* ---------------------------------------------- SCA ownership disclosures */
UAE.SCA = { thresholds: [0.05, 0.10, 0.25, 0.30, 0.50] };
UAE.scaCheck = function (key, co) {
  var S = UAE.S; if (!S.econ || !co.shares) return;
  var st = (co.holders[key] || 0) / co.shares, k = key + '|' + co.id, last = S.econ.disc[k] || 0, hit = 0;
  UAE.SCA.thresholds.forEach(function (t) { if (st >= t) hit = t; });
  if (hit > last) {
    var who = key.indexOf('P:') === 0 ? (UAE.person(key.slice(2)) || {}).name : (UAE.co(key.slice(2)) || {}).name;
    var mine = key.indexOf('P:') === 0 ? key.slice(2) === S.playerPerson : UAE.isHuman(UAE.co(key.slice(2)));
    UAE.news('SCA disclosure: ' + who + ' now owns ' + (st * 100).toFixed(1) + '% of ' + co.name + ' (crossed ' + hit * 100 + '%).', mine ? 'finance' : 'ai');
  }
  S.econ.disc[k] = hit;
};
(function () {
  var b0 = UAE.buyShares, s0 = UAE.sellShares;
  if (b0) UAE.buyShares = function (key, co, qty) { var r = b0.apply(this, arguments); if (r && r.ok) UAE.scaCheck(key, co); return r; };
  if (s0) UAE.sellShares = function (key, co, qty) { var r = s0.apply(this, arguments); if (r && r.ok) UAE.scaCheck(key, co); return r; };
})();
