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
  h += '<div class="box"><h3>Government reinvestment</h3><div class="row"><label style="min-width:0">Share of each emirate\'s revenue reinvested in development</label>' +
    '<input type="range" class="slider" min="0" max="60" step="5" value="' + Math.round(Gs.share * 100) + '" data-in="govShare" style="width:220px;vertical-align:middle"> <b id="govShareOut" class="t-a">' + Math.round(Gs.share * 100) + '%</b></div>' +
    '<div class="note">Each month every emirate spends this share of its revenue where the shortage is biggest: <b>housing</b> (homes for newcomers), <b>commercial buildings</b> (offices the jobs need), <b>civic facilities</b> (schools, hospitals, parks – raise quality of life) and <b>roads</b>. Anything left over builds extra homes and civic facilities to attract more people. Investment also opens <b>new zones</b> (planned districts) where companies can build.</div></div>';
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
  h += '</table><div class="note">Zones open one at a time per city, in this order, as the government invests there. Opened zones appear on the map and you (and AI companies) can build in them. ' + UAE.GOVDEV.src + '.</div></div>';
  return h;
};
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
      '<tr><td>🛣 Roads</td><td class="n">' + A(L.need.roads) + '</td><td class="n">' + A(L.spend.roads) + '</td><td class="n">capacity +' + N(L.add.roads) + ' residents</td></tr></table>' +
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
