/* ============================================================================
 * UAE CAPITALISM LAB  -  ECONOMY -> DEVELOPMENT & JOBS
 * Government reinvestment, housing supply / demand, job openings, immigration, new zones.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.idxCell = function (v, lo, hi) {   // index cell: red below lo (shortage), green above hi
  if (v == null || !isFinite(v)) return '<td class="n">—</td>';
  return '<td class="n ' + (v < lo ? 'neg' : v > hi ? 'pos' : '') + '">' + v.toFixed(2) + '</td>';
};
UI.econ_dev = function () {
  var S = UAE.S, A = UAE.fmt.aed, N = function (v) { return UAE.fmt.num(Math.round(v || 0)); }, Gs = UAE.govState(), t = UAE.govTotals();
  UI.govMapSync();
  var h = '<div class="cards">' + UI.card('UAE population', N(t.pop)) + UI.card('Newcomers last month', (t.migrants >= 0 ? '+' : '') + N(t.migrants), 'people who came for jobs (with families)') +
    UI.card('Job openings', N(t.openings), 'jobs waiting for workers') + UI.card('Jobs at firms in the game', N(t.firmJobs), 'factories, shops, offices… (all companies)') +
    UI.card('Housing index', t.households ? t.housing.toFixed(2) : '—', 'homes ÷ households · 1.00 = full, 1.05 = healthy') + UI.card('Gov. development spend', A(t.spent) + '/mo', A(t.spentYtd) + ' this year') + '</div>';
  if (!t.households) h += '<div class="note">Figures appear after the next month end (the model starts from your save\'s cities so they begin in balance).</div>';
  var pj = Gs.proj != null ? Gs.proj : UAE.GOVDEV.projShare;
  h += '<div class="box"><h3>Government reinvestment</h3><div class="row"><label style="min-width:0">Share of each emirate\'s revenue reinvested in development</label>' +
    '<input type="range" class="slider" min="0" max="100" step="5" value="' + Math.round(Gs.share * 100) + '" data-in="govShare" style="width:220px;max-width:100%;vertical-align:middle"> <b id="govShareOut" class="t-a">' + Math.round(Gs.share * 100) + '%</b></div>' +
    '<div class="row"><label style="min-width:0">of which 🚇 economic projects (metro, ports, airports, power, digital)</label>' +
    '<input type="range" class="slider" min="0" max="80" step="5" value="' + Math.round(pj * 100) + '" data-in="govProj" style="width:220px;max-width:100%;vertical-align:middle"> <b id="govProjOut" class="t-a">' + Math.round(pj * 100) + '%</b></div>' +
    '<div class="cards">' + UI.card('Economic projects', A(t.proj) + '/mo', 'coming into service over ~18 months') + UI.card('Projects under construction', A(t.projPipe)) +
    UI.card('GDP added by projects', 'AED ' + t.projGdp.toFixed(1) + 'bn/yr', 'every AED invested adds ~' + Math.round(UAE.GOVDEV.projYield * 100) + ' fils of yearly GDP') + '</div>' +
    '<div class="note"><b>Economic projects</b> raise each city\'s GDP for good – and GDP drives what households and businesses buy, so your shops, factories and services sell more and firms create more jobs. Up to 100% of revenue can be reinvested; the higher the share, the faster homes, offices and new zones appear.</div>' +
    '<div class="note">Each month every emirate spends this share of its revenue where the shortage is biggest: <b>housing</b> (homes for newcomers), <b>commercial buildings</b> (offices the jobs need), <b>civic facilities</b> (schools, hospitals, parks – raise quality of life) and <b>roads</b>. Anything left over builds extra homes and civic facilities to attract more people. Investment also opens <b>new zones</b> (planned districts) where companies can build.</div></div>';
  h += UI.govSavingsBox();
  h += UI.govInvestBox();
  // per-city tables (two, so they fit the window)
  var cities = Object.keys(S.cities);
  h += '<div class="box"><h3>👷 Jobs &amp; immigration</h3><table class="t"><tr><th>City</th><th class="n">Population</th><th class="n">Newcomers /mo</th><th class="n">Jobs</th><th class="n">at firms</th><th class="n">Job openings</th><th class="n">Unemployed</th></tr>';
  cities.forEach(function (k) {
    var c = S.cities[k], s = c.dev && c.dev.stats;
    h += '<tr class="click" data-act="govCity" data-arg="' + k + '"><td><b>' + UAE.CITIES[k].name + '</b></td><td class="n">' + N(c.pop) + '</td>' +
      (s ? '<td class="n ' + (s.migrants >= 0 ? 'pos' : 'neg') + '">' + (s.migrants >= 0 ? '+' : '') + N(s.migrants) + '</td><td class="n">' + N(s.jobs) + '</td><td class="n">' + N(s.firmJobs) + '</td>' +
        '<td class="n ' + (s.openings > 0 ? 'pos' : '') + '">' + N(s.openings) + (s.blockedByHousing ? ' <span class="neg" title="Not enough homes: newcomers are held back">🏠</span>' : '') + '</td>' : '<td colspan="4" class="muted">after next month end</td>') +
      '<td class="n">' + (c.unemp * 100).toFixed(1) + '%</td></tr>';
  });
  h += '</table><div class="note">Jobs = wider economy + staff of every firm in the game. Each new factory, shop or office adds job openings; people move in to fill them when there are homes. 🏠 = newcomers held back by a housing shortage. Click a city for details.</div></div>';
  h += '<div class="box"><h3>🚇 Economic projects by city</h3><table class="t"><tr><th>City</th><th class="n">GDP AED bn/yr</th><th class="n">Projects /mo</th><th class="n">Under construction</th><th class="n">In service</th><th class="n">GDP added bn/yr</th></tr>';
  cities.forEach(function (k) {
    var c = S.cities[k], P = c.dev && c.dev.proj;
    h += '<tr class="click" data-act="govCity" data-arg="' + k + '"><td><b>' + UAE.CITIES[k].name + '</b></td><td class="n">' + (UAE.cityGdp ? UAE.cityGdp(c) : c.gdp).toFixed(0) + '</td>' +
      (P ? '<td class="n">' + A(P.last) + '</td><td class="n">' + A(P.pipe) + '</td><td class="n">' + A(P.live) + '</td><td class="n pos">+' + P.gdp.toFixed(1) + '</td>' : '<td colspan="4" class="muted">after next month end</td>') + '</tr>';
  });
  h += '</table></div>';
  h += '<div class="box"><h3>🏠 Housing &amp; public amenities</h3><table class="t"><tr><th>City</th><th class="n">Housing index</th><th class="n">Offices</th><th class="n">Civic</th><th class="n">Roads</th><th class="n">QoL</th><th class="n">Gov. revenue /mo</th><th class="n">Dev. spend /mo</th><th class="n">Built so far</th></tr>';
  cities.forEach(function (k) {
    var c = S.cities[k], C = UAE.CITIES[k], d = c.dev, s = d && d.stats, L = d && d.last, rev = C.govRev * 1e9 / 12 * (c.gdp / C.gdp);
    h += '<tr class="click" data-act="govCity" data-arg="' + k + '"><td><b>' + C.name + '</b></td>' +
      (s ? UI.idxCell(s.housing, 1.0, 1.08) + UI.idxCell(s.office, 0.98, 1.1) + UI.idxCell(s.civic, 0.95, 1.15) + UI.idxCell(s.roads, 0.97, 1.1) : '<td></td><td></td><td></td><td></td>') +
      '<td class="n">' + Math.round(c.qol) + '</td><td class="n">' + A(rev) + '</td><td class="n">' + (L ? A(L.spent) : A(rev * Gs.share)) + '</td>' +
      '<td class="n muted">' + (d ? N(d.built.homes) + ' homes · ' + Math.round(d.built.civic) + ' civic' : '—') + '</td></tr>';
  });
  h += '</table><div class="note">Index = supply ÷ demand: housing = homes ÷ households, offices = office space ÷ office jobs, civic = schools / hospitals / parks ÷ need (1 per 40,000 residents), roads = capacity ÷ residents. Red = shortage, green = surplus. Civic facilities and roads raise quality of life (QoL), and higher QoL brings more newcomers.</div></div>';
  // zones
  h += '<div class="box"><h3>🏗 New zones (planned districts)</h3><table class="t"><tr><th>Zone</th><th>City</th><th>Type</th><th class="n">Homes</th><th class="n">Offices m²</th><th class="n">Investment needed</th><th>Status</th></tr>';
  UAE.PLANNED_ZONES.forEach(function (z) {
    var open = Gs.zones.indexOf(z.id) >= 0, d = S.cities[z.city].dev, first = !open && UAE.PLANNED_ZONES.filter(function (x) { return x.city === z.city && Gs.zones.indexOf(x.id) < 0; })[0] === z;
    var lg = open ? Gs.log.find(function (e) { return e.zone === z.id; }) : null;
    h += '<tr' + (open ? ' class="me"' : '') + '><td>' + (open ? '<a href="#" data-act="govFly" data-arg="' + z.id + '">' + UI.esc(z.name) + '</a>' : UI.esc(z.name)) + '</td><td>' + UAE.CITIES[z.city].name + '</td><td>' + (UAE.GOV_ZONE_COLORS[z.zone] || z.zone) + '</td>' +
      '<td class="n">' + (z.homes ? N(z.homes) : '—') + '</td><td class="n">' + (z.office ? N(z.office) : '—') + '</td><td class="n">' + A(z.cost) + '</td><td>' +
      (open ? '<span class="pos">OPEN</span>' + (lg ? ' since ' + UAE.cal.label(lg.day) : '') : first ? 'next · ' + Math.min(99, Math.round((d ? d.sinceZone : 0) / z.cost * 100)) + '% funded' : '<span class="muted">planned</span>') + '</td></tr>';
  });
  h += '</table><div class="note">Each city opens its zones in this order as soon as they are funded (40% of development spending goes to the zone fund, plus any development bonds you buy for new zones; several can open in one month). When all of a city\'s zones are open, the zone fund goes to economic projects. Opened zones appear on the map and you (and AI companies) can build in them. ' + UAE.GOVDEV.src + '.</div></div>';
  return h;
};
/** Invest company cash in the government's development programmes (development bonds). */
UI.govInvestBox = function () {
  var S = UAE.S, co = UAE.player(), A = UAE.fmt.aed, G = UAE.GOVDEV, bonds = (co && co.devBonds) || [];
  var cityOpts = Object.keys(S.cities).map(function (k) { return '<option value="' + k + '"' + (k === (UI._govInvCity || co.hq || 'DXB') ? ' selected' : '') + '>' + UAE.CITIES[k].name + '</option>'; }).join('');
  var progOpts = Object.keys(UAE.GOV_PROGRAMMES).map(function (k) { return '<option value="' + k + '"' + (k === (UI._govInvProg || 'growth') ? ' selected' : '') + '>' + UAE.GOV_PROGRAMMES[k] + '</option>'; }).join('');
  var rate = S.macro.rate + G.bondSpread, tot = UAE.devBondTotal(co), inc = bonds.reduce(function (s, b) { return s + b.face * b.rate / 12; }, 0);
  var h = '<div class="box"><h3>🏛 Invest in the government (development bonds)</h3>' +
    '<div class="note">Put ' + UI.esc(co.name) + '\'s cash into a city\'s development programme. The money is spent at the next month end – on <b>economic projects</b> (more GDP and jobs), <b>new zones</b> (planned districts open sooner) or <b>housing &amp; offices</b> (homes and office space for newcomers, split by whichever is shorter). You get <b>' + (rate * 100).toFixed(2) + '% a year</b> (CBUAE base rate + ' + (G.bondSpread * 100).toFixed(1) + '%, fixed when you buy), paid monthly, and your money back after ' + G.bondYears + ' years. Sell back early at ' + Math.round((1 - G.bondEarlyFee) * 100) + '%.</div>' +
    '<div class="row gov-inv"><select class="in" id="govInvCity" data-ch="govInvKeep">' + cityOpts + '</select><select class="in" id="govInvProg" data-ch="govInvKeep">' + progOpts + '</select></div>' +
    '<div class="row gov-inv"><label style="min-width:0">Amount (AED)</label><input class="in" id="govInvAmt" data-ch="govInvKeep" type="number" min="1000000" step="1000000" value="' + (UI._govInvAmt || 1e9) + '" style="width:170px">' +
    [1e9, 1e10, 1e11].map(function (v) { return '<button class="btn sm" data-act="govInvSet" data-arg="' + v + '">' + A(v) + '</button>'; }).join('') +
    '<button class="btn sm" data-act="govInvSet" data-arg="pct10">10% of cash</button><button class="btn a" data-act="govInvest">Invest</button></div>' +
    '<div class="cards">' + UI.card('Your company cash', A(co.bs.cash)) + UI.card('Development bonds held', A(tot), bonds.length + ' bond' + (bonds.length === 1 ? '' : 's')) + UI.card('Interest income', A(inc) + '/mo') + UI.card('All companies invested', A(UAE.govState().ppp || 0)) + '</div>';
  if (bonds.length) {
    h += '<table class="t"><tr><th>City</th><th>Programme</th><th class="n">Amount</th><th class="n">Rate</th><th class="n">Interest paid</th><th>Matures</th><th></th></tr>' + bonds.map(function (b) {
      return '<tr><td>' + UAE.CITIES[b.city].name + '</td><td>' + UAE.GOV_PROGRAMMES[b.prog].split(' (')[0] + '</td><td class="n">' + A(b.face) + '</td><td class="n">' + (b.rate * 100).toFixed(2) + '%</td><td class="n pos">' + A(b.paid) + '</td><td>' + UAE.cal.label(b.mat) + '</td>' +
        '<td><button class="btn sm m" data-act="govRedeem" data-arg="' + b.id + '" title="Sell back now at ' + Math.round((1 - G.bondEarlyFee) * 100) + '%">Redeem ' + A(b.face * (1 - G.bondEarlyFee)) + '</button></td></tr>';
    }).join('') + '</table>';
  }
  return h + '<div class="note">On the balance sheet the bonds are an investment (Investments → "of which government development bonds"); interest is interest income. ' + G.src.split(';')[0] + '.</div></div>';
};
/** Savings, public utilities and state-owned companies per emirate. */
UI.govSavingsBox = function () {
  var S = UAE.S, A = UAE.fmt.aed, Gs = UAE.govState(), G = UAE.GOVDEV, sv = Gs.savings != null ? Gs.savings : G.savingsSpend, cut = UAE._utilCut || {};
  var h = '<div class="box"><h3>💰 Savings, public utilities &amp; state-owned companies</h3>' +
    '<div class="row"><label style="min-width:0">Share of savings the governments spend per year</label><input type="range" class="slider" min="0" max="50" step="2" value="' + Math.round(sv * 100) + '" data-in="govSav" style="width:220px;max-width:100%;vertical-align:middle"> <b id="govSavOut" class="t-a">' + Math.round(sv * 100) + '%</b></div>' +
    '<div class="note">Budgets now follow <b>actual tax income</b> (incl. the corporate tax companies pay), and emirates with savings spend part of them every month: ' +
    Math.round(G.savingsSplit.proj * 100) + '% economic projects, ' + Math.round(G.savingsSplit.soe * 100) + '% capital for <b>state-owned companies</b> (Dubai Holding, Mubadala and a state enterprise company in each other emirate – their CEOs build businesses and pay half their profit back to the budget), ' +
    Math.round(G.savingsSplit.util * 100) + '% <b>public utilities</b> (power, desalination, grids, district cooling – cheaper electricity and water for every business, up to −' + Math.round(G.utilMaxCut * 100) + '%) and ' + Math.round(G.savingsSplit.homes * 100) + '% housing. ' +
    Math.round(G.utilShare * 100) + '% of the normal development budget also goes to utilities.</div>';
  h += '<table class="t"><tr><th>City</th><th class="n">Savings</th><th class="n">Spent from savings /mo</th><th class="n">Utilities invested</th><th class="n">Power &amp; water price</th><th class="n">State company capital</th><th class="n">Gov. dividends YTD</th></tr>';
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], d = c.dev || {}, em = UAE.CITIES[k].emirate, e = cut[em];
    h += '<tr><td><b>' + UAE.CITIES[k].name + '</b></td><td class="n">' + A(Math.max(0, -(c.govDebt || 0))) + '</td><td class="n">' + A(d.savDraw || 0) + '</td><td class="n">' + A(d.util ? d.util.inv : 0) + '</td>' +
      '<td class="n ' + (e && e.cut > 0.005 ? 'pos' : '') + '">' + (e ? '−' + (e.cut * 100).toFixed(1) + '%' : '—') + '</td><td class="n">' + A(d.soeTotal || 0) + '</td><td class="n">' + A(c.soeDivYtd || 0) + '</td></tr>';
  });
  h += '</table>';
  var soes = Object.keys(UAE.SOE_FOR).map(function (em) { var x = UAE.SOE_FOR[em], co = S.companies[x[0]]; return co ? co : null; }).filter(Boolean);
  if (soes.length) h += '<table class="t"><tr><th>State-owned company</th><th class="n">Firms</th><th class="n">Revenue TTM</th><th class="n">Profit TTM</th><th class="n">Cash</th></tr>' + soes.map(function (co) {
    var t = UAE.ttm(co); return '<tr class="click" data-act="corp" data-arg="' + co.id + '"><td>' + UI.logo(co, 18) + ' ' + UI.esc(co.name) + '</td><td class="n">' + UAE.firmsOf(co.id).length + '</td><td class="n">' + A(UAE.totalRevenue(t)) + '</td><td class="n">' + UI.money(UAE.netIncome(t)) + '</td><td class="n">' + A(co.bs.cash) + '</td></tr>';
  }).join('') + '</table>';
  return h + '</div>';
};
UI.act.govSav = function (a, el) { UAE.govState().savings = +el.value / 100; var o = document.getElementById('govSavOut'); if (o) o.textContent = el.value + '%'; };
UI.act.govInvKeep = function () { UI._govInvCity = UI.$('govInvCity').value; UI._govInvProg = UI.$('govInvProg').value; UI._govInvAmt = +UI.$('govInvAmt').value; };
UI.act.govInvSet = function (v) {
  var el = UI.$('govInvAmt'); if (!el) return;
  el.value = v === 'pct10' ? Math.floor(UAE.player().bs.cash * 0.1 / 1e6) * 1e6 : v; UI._govInvAmt = +el.value;
};
UI.act.govInvest = function () {
  var city = UI.$('govInvCity').value, prog = UI.$('govInvProg').value, amt = +UI.$('govInvAmt').value;
  UI._govInvCity = city; UI._govInvProg = prog; UI._govInvAmt = amt;
  var r = UAE.govInvest(UAE.player(), city, amt, prog);
  UI.toast(r.ok ? 'Invested ' + UAE.fmt.aed(amt) + ' in ' + UAE.CITIES[city].name + ' (' + UAE.GOV_PROGRAMMES[prog].split(' (')[0] + ') at ' + (r.bond.rate * 100).toFixed(2) + '%.' : r.why, r.ok ? 'good' : 'bad');
  UI.render();
};
UI.act.govRedeem = function (id) {
  var r = UAE.govRedeem(UAE.player(), id);
  UI.toast(r.ok ? 'Bond redeemed: ' + UAE.fmt.aed(r.cash) + ' back in cash.' : r.why, r.ok ? 'good' : 'bad'); UI.render();
};
UI.act.govProj = function (a, el) { UAE.govState().proj = +el.value / 100; var o = document.getElementById('govProjOut'); if (o) o.textContent = el.value + '%'; };
UI.act.govShare = function (a, el) { UAE.govState().share = +el.value / 100; var o = document.getElementById('govShareOut'); if (o) o.textContent = el.value + '%'; };
UI.act.govFly = function (id) { var d = UAE.geo.district(id); if (d && UI.flyTo) UI.flyTo(d.c, 13.5); };
UI.act.govCity = function (k) { UI.open('Development · ' + UAE.CITIES[k].name, function () { return UI.R.govCity(k); }, { push: true }); };
UI.R.govCity = function (k) {
  k = k && UAE.S.cities[k] ? k : 'DXB';
  var c = UAE.S.cities[k], d = c.dev, s = d && d.stats, L = d && d.last, A = UAE.fmt.aed, N = function (v) { return UAE.fmt.num(Math.round(v || 0)); };
  if (!s) return '<div class="note">Figures appear after the next month end.</div>';
  var fj = UAE.cityFirmJobs(k);
  var h = '<div class="cards">' + UI.card('Population', N(c.pop)) + UI.card('Newcomers last month', (s.migrants >= 0 ? '+' : '') + N(s.migrants)) + UI.card('Job openings', N(s.openings)) +
    UI.card('Unemployment', (c.unemp * 100).toFixed(1) + '%') + UI.card('Housing index', s.housing.toFixed(2), N(s.homes) + ' homes / ' + N(s.households) + ' households') + UI.card('Quality of life', Math.round(c.qol)) + '</div>';
  h += '<div class="box"><h3>Jobs</h3><table class="t fs"><tr><td>Labour force (62% of residents)</td><td class="n">' + N(s.labour) + '</td></tr><tr><td>Jobs in the wider economy</td><td class="n">' + N(s.baseJobs) + '</td></tr>' +
    '<tr><td>Jobs at firms in the game (factories, shops, offices, banks…)</td><td class="n">' + N(fj.total) + '</td></tr><tr><td>&nbsp;&nbsp;of which at your companies</td><td class="n">' + N(fj.mine) + '</td></tr>' +
    '<tr class="total"><td>Total jobs</td><td class="n">' + N(s.jobs) + '</td></tr><tr><td>Job openings (jobs without a worker)</td><td class="n pos">' + N(s.openings) + '</td></tr><tr><td>Workers without a job</td><td class="n neg">' + N(s.shortfall) + '</td></tr></table>' +
    '<div class="note">Every new factory, shop or office creates jobs (staff × size). When there are more jobs than workers, people move here for them – if there are homes.</div>' +
    '<h4>Jobs at firms by business</h4><table class="t">' + Object.keys(fj.byType).sort(function (a, b) { return fj.byType[b] - fj.byType[a]; }).map(function (x) { return '<tr><td>' + x + '</td><td class="n">' + N(fj.byType[x]) + '</td></tr>'; }).join('') + '</table></div>';
  h += '<div class="box"><h3>Immigration last month</h3><table class="t fs"><tr><td>Newcomers for jobs (workers + families)</td><td class="n">' + N(s.migrants) + '</td></tr><tr><td>Natural growth &amp; family reunion</td><td class="n">' + N(s.natural) + '</td></tr>' +
    '<tr><td>Empty homes available</td><td class="n">' + N(s.vacant) + '</td></tr></table>' + (s.blockedByHousing ? '<div class="note neg">Newcomers are held back by the housing shortage: more homes would bring more workers.</div>' : '') + '</div>';
  if (L) {
    h += '<div class="box"><h3>Government development last month · budget ' + A(L.budget) + '</h3><table class="t"><tr><th>Programme</th><th class="n">Shortage (cost to fix)</th><th class="n">Spent</th><th class="n">Built</th></tr>' +
      '<tr><td>🏠 Housing</td><td class="n">' + A(L.need.homes) + '</td><td class="n">' + A(L.spend.homes) + '</td><td class="n">' + N(L.add.homes) + ' homes</td></tr>' +
      '<tr><td>🏢 Commercial buildings</td><td class="n">' + A(L.need.office) + '</td><td class="n">' + A(L.spend.office) + '</td><td class="n">' + N(L.add.office) + ' m²</td></tr>' +
      '<tr><td>🏛 Civic facilities</td><td class="n">' + A(L.need.civic) + '</td><td class="n">' + A(L.spend.civic) + '</td><td class="n">' + (L.add.civic).toFixed(1) + ' facilities</td></tr>' +
      '<tr><td>🛣 Roads</td><td class="n">' + A(L.need.roads) + '</td><td class="n">' + A(L.spend.roads) + '</td><td class="n">capacity +' + N(L.add.roads) + ' residents</td></tr>' +
      (d.proj ? '<tr><td>🚇 Economic projects</td><td class="n">—</td><td class="n">' + A(L.proj || 0) + '</td><td class="n">GDP +' + d.proj.lastGdp.toFixed(2) + 'bn/yr this month (' + d.proj.gdp.toFixed(1) + 'bn total)</td></tr>' : '') + '</table>' +
      '<div class="note">Built so far: ' + N(d.built.homes) + ' homes, ' + N(d.built.office) + ' m² of offices, ' + Math.round(d.built.civic) + ' civic facilities. Total invested ' + A(d.spentTotal) + '.' + (L.zone ? ' New zone opened: ' + UI.esc(L.zone) + '.' : '') + '</div></div>';
  }
  if (d.hist.length > 1) {
    h += '<div class="box"><h3>History</h3><canvas class="chart" id="govChart"></canvas></div>';
    UI.after(function () { var cv = UI.$('govChart'); if (cv) UI.chart(cv, [{ label: 'Newcomers / month', data: d.hist.map(function (x) { return x.migrants; }) }, { label: 'Job openings', data: d.hist.map(function (x) { return x.openings; }), color: '#b8ff2c' }],
      { fmt: function (v) { return UAE.fmt.num(v); }, labels: d.hist.map(function (x) { return UAE.cal.label(x.day).slice(-8); }) }); });
  }
  return h;
};
/** Show newly opened zones on the map. */
UI.govMapSync = function () {
  try {
    if (!UI.map || !UI.map.getSource || !UI.map.getSource('districts')) return;
    if (UI._govDistricts === UAE.DISTRICTS.length) return;
    UI._govDistricts = UAE.DISTRICTS.length; UI.map.getSource('districts').setData(UI.districtGeo());
  } catch (e) { /* map not ready */ }
};
(function () {
  var base = UI.refreshMap;
  if (base) UI.refreshMap = function () { var r = base.apply(this, arguments); UI.govMapSync(); return r; };
})();
