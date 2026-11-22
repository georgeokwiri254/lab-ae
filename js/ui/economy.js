/* ============================================================================
 * UAE CAPITALISM LAB  -  ECONOMY SCREEN (🌐)
 * UAE economy | Central banks | Government & taxes | SCA (securities regulator) | World ranking
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.act.economy = function (tab) { if (tab) UI.tabState.econTab = tab; UI.open('Economy', UI.R.economy); };
UI.pc = function (v, d) { return v == null || isNaN(v) ? '—' : (v * 100).toFixed(d == null ? 1 : d) + '%'; };
UI.phasePill = function (p) {
  var col = { boom: '#b8ff2c', expansion: '#00f0ff', slowdown: '#ffd24d', recession: '#ff2bd6', recovery: '#8b9cff' }[p] || '#8b9cff';
  return '<span class="pill" style="border-color:' + col + ';color:' + col + ';box-shadow:0 0 10px ' + col + '55">' + (UAE.PHASES[p] || p) + '</span>';
};
UI.R.economy = function () {
  UAE.econInit();
  var tab = UI.tabState.econTab || 'uae';
  var h = UI.tabs('econTab', [['uae', '🇦🇪 UAE economy'], ['cb', '🏛 Central banks'], ['gov', '🧾 Government & taxes'], ['sca', '⚖ SCA regulator'], ['world', '🌍 World ranking'], ['dev', '🏗 Development & jobs']], tab);
  return h + (UI['econ_' + tab] || UI.econ_uae)();
};

/* ----------------------------------------------------------- UAE economy */
UI.econ_uae = function () {
  var S = UAE.S, E = S.econ, u = UAE.uaeStats(), A = UAE.fmt.aed, H = E.hist;
  var h = '<div class="cards">' + UI.card('Business cycle', UI.phasePill(E.phase), 'cycle index ' + (E.cycle >= 0 ? '+' : '') + E.cycle.toFixed(2)) +
    UI.card('GDP', 'AED ' + UAE.fmt.num(u.gdp) + 'bn') + UI.card('Real growth (yr)', UI.pc(u.growth)) +
    UI.card('Inflation', UI.pc(u.infl)) + UI.card('Unemployment', UI.pc(u.unemp)) + UI.card('CBUAE base rate', UI.pc(E.cbRate, 2), 'follows the Fed') +
    UI.card('Population', UAE.fmt.num(u.pop)) + UI.card('Fiscal stance', E.stance) + '</div>';
  h += '<div class="box"><h3>What the cycle does to your business</h3><table class="t">' +
    [['Consumer demand (shops, malls, services)', 6], ['Property demand & rents', 8], ['Stock market sentiment', 6], ['Tourism', 4]].map(function (x) {
      var v = x[1] * E.cycle; return '<tr><td>' + x[0] + '</td><td class="n ' + (v >= 0 ? 'pos' : 'neg') + '">' + (v >= 0 ? '+' : '') + v.toFixed(1) + '%</td></tr>';
    }).join('') + '<tr><td>Unemployment vs normal</td><td class="n">' + (E.cycle >= 0 ? '−' : '+') + Math.abs(50 * E.cycle).toFixed(0) + '%</td></tr>' +
    '<tr><td>Loan &amp; deposit rates</td><td class="n">base ' + UI.pc(E.cbRate, 2) + '</td></tr></table>' +
    '<div class="note">The UAE cycle follows the world economy (US 40%, China 30%, others 30%) and oil prices. Booms lift spending, rents and share prices and cut unemployment; recessions do the opposite, and the government switches to stimulus spending.</div></div>';
  if (H.length > 1) {
    h += '<div class="box"><h3>History</h3><canvas class="chart" id="ecU1" style="height:150px"></canvas><canvas class="chart" id="ecU2" style="height:150px"></canvas></div>';
    UI.after(function () {
      var c1 = UI.$('ecU1'), c2 = UI.$('ecU2'), f = function (v) { return (v * 100).toFixed(1) + '%'; };
      if (c1) UI.chart(c1, [{ label: 'Growth', data: H.map(function (x) { return x.growth || 0; }), color: '#b8ff2c' }, { label: 'Inflation', data: H.map(function (x) { return x.infl; }), color: '#ffd24d' }], { fmt: f });
      if (c2) UI.chart(c2, [{ label: 'Unemployment', data: H.map(function (x) { return x.unemp; }), color: '#ff2bd6' }, { label: 'Base rate', data: H.map(function (x) { return x.rate; }), color: '#00f0ff' }], { fmt: f });
    });
  } else h += '<div class="note">Charts fill in month by month.</div>';
  h += '<div class="box"><h3>Emirates</h3><table class="t"><tr><th>Emirate</th><th class="n">GDP (AED bn)</th><th class="n">Inflation</th><th class="n">Unemployment</th><th class="n">Population</th><th class="n">Corporate tax YTD</th><th class="n">VAT YTD</th></tr>' +
    Object.keys(S.cities).map(function (k) { var c = S.cities[k], hh = c.hist[c.hist.length - 1];
      return '<tr><td>' + UAE.CITIES[k].name + '</td><td class="n">' + UAE.fmt.num(c.gdp) + '</td><td class="n">' + UI.pc(hh ? hh.infl : UAE.CITIES[k].cpi) + '</td><td class="n">' + UI.pc(c.unemp) + '</td><td class="n">' + UAE.fmt.num(c.pop) + '</td><td class="n">' + A(c.ct || 0) + '</td><td class="n">' + A(c.vat || 0) + '</td></tr>'; }).join('') + '</table></div>';
  return h;
};

/* --------------------------------------------------------- central banks */
UI.econ_cb = function () {
  var S = UAE.S, E = S.econ, W = S.world, fed = W.nations.US;
  var h = '<div class="cards">' + UI.card('CBUAE base rate', UI.pc(E.cbRate, 2)) + UI.card('US Fed target', UI.pc(fed.rate - 0.00125, 2) + '–' + UI.pc(fed.rate + 0.00125, 2)) +
    UI.card('US inflation', UI.pc(fed.infl)) + UI.card('US unemployment', UI.pc(fed.unemp)) + UI.card('Fed rule says', UI.pc(UAE.taylor(fed), 2), 'Taylor rule') + '</div>';
  h += '<div class="note">The dirham is pegged to the US dollar (3.6725), so the Central Bank of the UAE moves its base rate with the Fed (base rate = Fed mid-point + 0.025%; real: 3.90% with the Fed at 3.75–4.00%, Nov 2026). Every loan, deposit, bond and bank rate in the game is priced off this base rate.</div>';
  h += '<div class="box"><h3>CBUAE decisions</h3>' + (E.decisions.length ? '<table class="t"><tr><th>Date</th><th>Decision</th><th class="n">From</th><th class="n">To</th></tr>' + E.decisions.map(function (d) {
    return '<tr><td>' + UAE.cal.label(d.day) + '</td><td>' + (d.to > d.from ? '<span class="neg">Hike</span>' : '<span class="pos">Cut</span>') + '</td><td class="n">' + UI.pc(d.from, 2) + '</td><td class="n">' + UI.pc(d.to, 2) + '</td></tr>'; }).join('') + '</table>' : '<div class="muted">No change yet.</div>') + '</div>';
  h += '<div class="box"><h3>World central banks</h3><table class="t"><tr><th>Country</th><th>Central bank</th><th class="n">Policy rate</th><th class="n">Inflation</th><th class="n">Target</th><th class="n">Unemployment</th><th class="n">Rule-implied rate</th><th>Last move</th></tr>' +
    Object.keys(W.nations).map(function (k) { var n = W.nations[k];
      return '<tr><td>' + n.flag + ' ' + n.name + '</td><td class="muted">' + n.cb + '</td><td class="n">' + UI.pc(n.rate, 2) + '</td><td class="n">' + UI.pc(n.infl) + '</td><td class="n">' + UI.pc(n.target, 0) + '</td><td class="n">' + UI.pc(n.unemp) + '</td><td class="n">' + (n.game ? 'follows Fed' : UI.pc(UAE.taylor(n), 2)) + '</td><td>' + (n.lastMove ? UAE.cal.label(n.lastMove.day) + ' ' + (n.lastMove.to > n.lastMove.from ? '▲' : '▼') : '—') + '</td></tr>'; }).join('') + '</table>' +
    '<div class="note">Each central bank follows a Taylor rule: neutral rate + 1.5 × (inflation − target) + 0.8 × (natural unemployment − unemployment), moving in 0.25% steps (0.5% when far off).</div></div>';
  return h;
};

/* ---------------------------------------------------- government & taxes */
UI.econ_gov = function () {
  var S = UAE.S, E = S.econ, u = UAE.uaeStats(), A = UAE.fmt.aed, Rr = UAE.RULES;
  var h = '<div class="cards">' + UI.card('Fiscal stance', E.stance, E.stance === 'stimulus' ? '+8% public spending' : E.stance === 'consolidation' ? 'spending held back' : 'normal budget') +
    UI.card('Government revenue YTD', A(u.govRev)) + UI.card('Government spending YTD', A(u.govExp)) + UI.card('Balance YTD', A(u.govRev - u.govExp), '', u.govRev >= u.govExp ? 'a' : 'm') + UI.card('Government debt', A(u.debt * 1e9)) + '</div>';
  h += '<div class="box"><h3>UAE tax rules</h3><table class="t">' +
    '<tr><td>Corporate tax</td><td class="n">' + UI.pc(Rr.corpTax, 0) + '</td><td class="muted">on annual taxable profit above AED ' + UAE.fmt.num(Rr.corpTaxFree) + ' (REAL, since June 2023)</td></tr>' +
    '<tr><td>VAT</td><td class="n">' + UI.pc(Rr.vat, 0) + '</td><td class="muted">on retail sales and services (REAL)</td></tr>' +
    '<tr><td>Customs duty</td><td class="n">' + UI.pc(Rr.customs, 0) + '</td><td class="muted">of import value, GCC common tariff (REAL)</td></tr>' +
    '<tr><td>Personal income tax</td><td class="n">0%</td><td class="muted">none in the UAE (REAL)</td></tr></table></div>';
  h += '<div class="box"><h3>Taxes collected this year</h3><div class="cards">' + UI.card('Corporate tax', A(u.ct)) + UI.card('VAT', A(u.vat)) + UI.card('Tax paid by all game companies', A(u.coTax)) + '</div>';
  var mine = UAE.allCos().filter(function (c) { return c.controller === 'PLAYER'; });
  h += '<table class="t"><tr><th>Your company</th><th class="n">Corporate tax YTD</th><th class="n">Profit before tax YTD</th><th class="n">Effective rate</th></tr>' + mine.map(function (c) {
    var y = c.is.ytd, pbt = UAE.netIncome(y) + (y.tax || 0); return '<tr><td>' + UI.coLink(c) + '</td><td class="n">' + A(y.tax || 0) + '</td><td class="n">' + A(pbt) + '</td><td class="n">' + (pbt > 0 ? UI.pc((y.tax || 0) / pbt) : '—') + '</td></tr>'; }).join('') + '</table></div>';
  h += '<div class="box"><h3>Emirate budgets (YTD)</h3><table class="t"><tr><th>Emirate</th><th class="n">Revenue</th><th class="n">Spending</th><th class="n">Balance</th><th class="n">Debt</th></tr>' + Object.keys(S.cities).map(function (k) { var c = S.cities[k];
    return '<tr><td>' + UAE.CITIES[k].name + '</td><td class="n">' + A(c.govRevYtd || 0) + '</td><td class="n">' + A(c.govExpYtd || 0) + '</td><td class="n">' + UI.money((c.govRevYtd || 0) - (c.govExpYtd || 0)) + '</td><td class="n">' + A((c.govDebt || 0) * 1e9) + '</td></tr>'; }).join('') + '</table>' +
    '<div class="note">Government revenue = published budget baseline + taxes your and rival companies actually pay (VAT on sales, corporate tax at year end, customs on imports). In a recession the government adds stimulus spending, which supports consumer demand.</div></div>';
  return h;
};

/* ---------------------------------------------------- SCA regulator (SEC) */
UI.econ_sca = function () {
  var S = UAE.S, W = S.world;
  var disc = (S.news || []).filter(function (n) { return /^SCA disclosure/.test(n.text); }).slice(0, 25);
  var h = '<div class="box"><h3>⚖ SCA – Securities and Commodities Authority (the UAE\'s SEC)</h3><table class="t">' +
    '<tr><td>Supervises</td><td>DFM (Dubai Financial Market) and ADX (Abu Dhabi Securities Exchange) listings, trading and disclosure</td></tr>' +
    '<tr><td>Ownership disclosure</td><td>anyone reaching 5% of a listed company must disclose it (REAL); further disclosures at 10, 25, 30 and 50% (game rule)</td></tr>' +
    '<tr><td>Trading fee</td><td>' + UI.pc(UAE.RULES.tradingFee || 0.0015, 2) + ' per trade (brokerage, paid to banks)</td></tr>' +
    '<tr><td>Control</td><td>above 50% you control the company and its board</td></tr>' +
    '<tr><td>Bonds &amp; sukuk</td><td>issued and traded under SCA rules; priced off the CBUAE base rate</td></tr></table></div>';
  h += '<div class="box"><h3>Recent disclosures</h3>' + (disc.length ? '<table class="t">' + disc.map(function (n) { return '<tr><td class="muted">' + UAE.cal.label(n.day) + '</td><td>' + UI.esc(n.text.replace(/^SCA disclosure: /, '')) + '</td></tr>'; }).join('') + '</table>' : '<div class="muted">None yet – they appear when any investor crosses 5%.</div>') + '</div>';
  h += '<div class="box"><h3>Securities regulators worldwide</h3><table class="t">' + Object.keys(W.nations).map(function (k) { var n = W.nations[k]; return '<tr><td>' + n.flag + ' ' + n.name + '</td><td>' + n.reg + '</td></tr>'; }).join('') + '</table></div>';
  return h;
};

/* --------------------------------------------------------- world ranking */
UI.WCOLS = [['gdp', 'GDP (AED)'], ['pc', 'GDP per person (AED)'], ['growth', 'Real growth'], ['infl', 'Inflation'], ['unemp', 'Unemployment'], ['rate', 'Policy rate'], ['debt', 'Gov. debt / GDP'], ['tax', 'Corporate tax'], ['pop', 'Population (m)']];
UI.econWorldRows = function (real) {
  return Object.keys(UAE.S.world.nations).map(function (k) {
    var n = UAE.S.world.nations[k], v = real ? n.real : n, pop = real ? UAE.NATIONS.filter(function (d) { return d.id === k; })[0].pop : n.pop;
    var usd = UAE.RULES.usdAed;                    // data is in US$ - shown in AED at the 3.6725 peg
    return { n: n, gdp: v.gdp * 1e9 * usd, pc: v.gdp * 1e9 * usd / (pop * 1e6), growth: v.growth, infl: v.infl, unemp: v.unemp, rate: v.rate, debt: v.debt, tax: n.tax, pop: pop };
  });
};
UI.econ_world = function () {
  var sort = UI.tabState.wSort || 'gdp', real = UI.tabState.wReal === 'real', asc = ['unemp', 'infl', 'debt', 'tax'].indexOf(sort) >= 0;
  var rows = UI.econWorldRows(real).sort(function (a, b) { return asc ? a[sort] - b[sort] : b[sort] - a[sort]; });
  var h = UI.tabs('wReal', [['game', 'Now (' + UAE.cal.year(UAE.S.day) + ', simulated)'], ['real', 'Real data (' + UAE.NATIONS_ASOF + ')']], real ? 'real' : 'game') +
    '<div class="row"><label>Rank by</label>' + UI.WCOLS.map(function (c) { return '<button class="btn sm' + (sort === c[0] ? ' a' : '') + '" data-act="wSort" data-arg="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>';
  h += '<table class="t"><tr><th class="n">#</th><th>Country</th><th>Cycle</th>' + UI.WCOLS.map(function (c) { return '<th class="n">' + c[1] + '</th>'; }).join('') + '</tr>' + rows.map(function (r, i) {
    var n = r.n; return '<tr' + (n.id === 'AE' ? ' class="me"' : '') + '><td class="n">' + (i + 1) + '</td><td>' + n.flag + ' ' + n.name + (n.src === 'EST' ? ' <span class="muted">est.</span>' : '') + '</td><td>' + UI.phasePill(n.phase) + '</td><td class="n">' + UAE.fmt.aed(r.gdp) + '</td><td class="n">' + UAE.fmt.aed(r.pc) + '</td><td class="n">' + UI.pc(r.growth) + '</td><td class="n">' + UI.pc(r.infl) + '</td><td class="n">' + UI.pc(r.unemp) + '</td><td class="n">' + UI.pc(r.rate, 2) + '</td><td class="n">' + UI.pc(r.debt, 0) + '</td><td class="n">' + UI.pc(r.tax, 0) + '</td><td class="n">' + r.pop.toFixed(1) + '</td></tr>';
  }).join('') + '</table><div class="note">Real data: US, China and UAE figures are recent official or IMF numbers (Fed 3.75–4.00%, US unemployment 4.1% and CPI 3.7%; China growth 4.5%, CPI ~0.9%, urban unemployment 5.3%, 1-year LPR 3.0%; UAE growth 0.2% and inflation ~5% per the IMF, Nov 2026). GDP for the biggest economies is from the IMF (Apr 2026). Rows marked est. are approximate. All money is shown in AED (US$ figures × 3.6725, the dirham peg). From there each economy runs its own business cycle in the game; the UAE row is your game\'s own economy.</div>';
  return h;
};
UI.act.wSort = function (k) { UI.tabState.wSort = k; UI.render(); };
