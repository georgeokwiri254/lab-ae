/* ============================================================================
 * UAE CAPITALISM LAB  -  IC14 CITIES: graphs & features (Capitalism Lab City report)
 *   City Graphs   pick any of 24 series (population, unemployment, salary level,
 *                 consumer spending, land price, rents, inflation, purchasing
 *                 power, interest rate, tourists, jobs, firms …) over 1y / 5y / all
 *   Economic      GDP components (consumption, investment, government, net exports),
 *                 modelled exports & imports, inflation and purchasing power
 *   Real Estate   land & rent indices, modelled apartment / office occupancy, buildings
 *   Retail        retail sales, sales per capita, biggest consumer markets, leaders
 *   Tourism       visitors, hotel occupancy & ADR
 * Other tabs (overview, government, GDP, industries, QoL, rankings, bonds) come
 * from panels.js.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.CITY_SERIES = [
  ['pop', 'Population', 'num'], ['unemp', 'Unemployment rate', 'pct'], ['wage', 'Salary level (avg monthly pay, AED)', 'num'],
  ['retail', 'Consumer spending - modelled retail sales / month', 'aed'], ['retailPc', 'Retail sales per capita / month', 'num2'],
  ['gdp', 'Nominal GDP (AED bn)', 'num2'], ['cpi', 'Consumer price index', 'num2'], ['infl', 'Inflation rate (y/y)', 'pct'],
  ['ppower', 'Purchasing power (start = 100)', 'num2'], ['rate', 'Interest rate (CBUAE base)', 'pct'], ['land', 'Land price index', 'num2'],
  ['rent', 'Housing rent index', 'num2'], ['aptRent', 'Avg modelled apartment rent / unit / yr', 'aed'], ['aptOcc', 'Modelled apartment occupancy', 'pct'],
  ['offOcc', 'Modelled office occupancy', 'pct'], ['tourists', 'Tourists / year', 'num'], ['hotOcc', 'Modelled hotel occupancy', 'pct'],
  ['hotAdr', 'Modelled hotel ADR (AED)', 'num'], ['qol', 'Quality of life', 'num2'], ['jobs', 'Jobs in modelled firms', 'num'],
  ['firms', 'Number of modelled firms', 'num'], ['exports', 'Exports by modelled firms / month', 'aed'], ['imports', 'Imports by modelled firms / month', 'aed'],
  ['gov', 'Government balance YTD', 'aed'], ['fund', 'Government net position (−debt)', 'aed'],
  ['cons', 'Consumption / month', 'aed'], ['inv', 'Investment / month', 'aed'], ['govSp', 'Government spending / month', 'aed'], ['nx', 'Net exports / month', 'aed']
];
UI.fmtSeries = function (kind) {
  return { pct: function (v) { return (v * 100).toFixed(2) + '%'; }, aed: function (v) { return UAE.fmt.aed(v); }, num2: function (v) { return UAE.fmt.num(v, 2); } }[kind] || function (v) { return UAE.fmt.num(v); };
};
UI.cityHist = function (c) {
  var per = UI.tabState.cper || 'all', hs = c.hist;
  if (per === '1y') hs = hs.slice(-12); else if (per === '5y') hs = hs.slice(-60);
  return hs;
};
UI.cityChart = function (canvasId, c, keys) {
  var hs = UI.cityHist(c);
  UI.after(function () {
    var el = UI.$(canvasId); if (!el) return;
    var ser = keys.map(function (k, i) { var d = UI.CITY_SERIES.find(function (x) { return x[0] === k; }) || [k, k, 'num'];
      return { label: d[1], data: hs.map(function (x) { return x[k]; }).filter(function (v) { return v != null; }), color: UI.COLORS[i % UI.COLORS.length], kind: d[2] }; });
    UI.chart(el, ser, { fmt: UI.fmtSeries(ser[0].kind), labels: hs.map(function (x) { return UAE.cal.label(x.day).slice(3); }) });
  });
};

UI._citiesBase = UI._citiesBase || UI.R.cities;
UI.R.cities = function () {
  var id = UI.tabState.city || UAE.player().hq, tab = UI.tabState.ctab || 'overview', c = UAE.S.cities[id], C = UAE.CITIES[id];
  var NEW = ['graphs', 'econ', 'estate', 'retail', 'tourism'];
  if (['g1', 'g2'].indexOf(tab) >= 0) { tab = 'graphs'; UI.tabState.ctab = 'graphs'; }
  var h = UI.tabs('city', Object.keys(UAE.CITIES).map(function (k) { return [k, UAE.CITIES[k].name]; }), id) +
    UI.tabs('ctab', [['overview', 'Overview'], ['graphs', 'City Graphs'], ['econ', 'Economic Graphs'], ['gov', 'Government Budget'], ['gdp', 'GDP Components'], ['estate', 'Real Estate'],
      ['retail', 'Retail'], ['tourism', 'Tourism'], ['ind', 'Industries'], ['qol', 'Quality of Life'], ['rank', 'City Rankings'], ['bonds', 'Bonds']], tab);
  if (NEW.indexOf(tab) < 0) {
    // delegate to the original report but strip its duplicated tab rows
    var base = UI._citiesBase(), cut = base.indexOf('</div>', base.indexOf('</div>') + 6) + 6;
    return h + base.slice(cut);
  }
  if (tab !== 'retail') h += UI.tabs('cper', [['1y', 'Last 12 months'], ['5y', '5 years'], ['all', 'All']], UI.tabState.cper || 'all');
  if (!c.hist.length) return h + '<div class="note">City graphs start after the first month-end - let time run.</div>';
  if (tab === 'graphs') {
    var picks = (UI.tabState.cgraphs || 'pop,unemp,wage,retail').split(',');
    h += '<div class="row"><label>Graphs</label>' + [0, 1, 2, 3].map(function (i) {
      return '<select class="in" data-ch="cgraph" data-arg="' + i + '">' + UI.CITY_SERIES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === picks[i] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>';
    }).join('') + '</div><div class="grid2">';
    picks.forEach(function (k, i) { var d = UI.CITY_SERIES.find(function (x) { return x[0] === k; }); h += '<div class="box"><h3>' + (d ? d[1] : k) + '</h3><canvas class="chart" id="cgx' + i + '"></canvas></div>'; UI.cityChart('cgx' + i, c, [k]); });
    h += '</div>';
  } else if (tab === 'econ') {
    var last = c.hist[c.hist.length - 1];
    h += '<div class="cards">' + UI.card('Consumption / month', UAE.fmt.aed(last.cons), UI.tag('EST') + ' share of GDP') + UI.card('Investment / month', UAE.fmt.aed(last.inv), 'incl. modelled construction') +
      UI.card('Government spending / month', UAE.fmt.aed(last.govSp)) + UI.card('Net exports / month', UAE.fmt.aed(last.nx), 'residual') + UI.card('Inflation y/y', UAE.fmt.pct(last.infl, 2)) + UI.card('Purchasing power', last.ppower.toFixed(1), 'start = 100') + '</div>';
    h += '<div class="box"><h3>GDP = consumption + investment + government spending + net exports</h3><canvas class="chart" id="ce1"></canvas></div>';
    h += '<div class="grid2"><div class="box"><h3>Modelled exports & imports</h3><canvas class="chart" id="ce2"></canvas></div><div class="box"><h3>Inflation & interest rate</h3><canvas class="chart" id="ce3"></canvas></div></div>';
    h += '<div class="grid2"><div class="box"><h3>Purchasing power</h3><canvas class="chart" id="ce4"></canvas></div><div class="box"><h3>Salary level</h3><canvas class="chart" id="ce5"></canvas></div></div>';
    UI.cityChart('ce1', c, ['cons', 'inv', 'govSp', 'nx']); UI.cityChart('ce2', c, ['exports', 'imports']); UI.cityChart('ce3', c, ['infl', 'rate']);
    UI.cityChart('ce4', c, ['ppower']); UI.cityChart('ce5', c, ['wage']);
    h += '<div class="note">GDP components are a calibrated split ' + UI.tag('EST') + ' of the city\'s GDP (consumption ~38%, investment ~21% + modelled construction, government from the budget, net exports the residual). Exports and imports are those of modelled firms only.</div>';
  } else if (tab === 'estate') {
    var b = UAE.allFirms().filter(function (f) { return f.city === id && ['apartment', 'commercial', 'mall', 'hotel'].indexOf(f.type) >= 0; });
    h += '<div class="cards">' + UI.card('Land price index', c.landIdx.toFixed(3), 'start 1.000') + UI.card('Rent index', c.rentIdx.toFixed(3)) + UI.card('Market apartment rent', UAE.fmt.aed(UAE.RENT[id].unit * c.rentIdx) + '/yr', 'per unit ' + UI.tag('EST')) +
      UI.card('Market office rent', 'AED ' + Math.round(UAE.RENT[id].office * c.rentIdx) + '/m²/yr') + UI.card('Housing affordability', (1 / c.rentIdx).toFixed(3)) + '</div>';
    h += '<div class="grid2"><div class="box"><h3>Land & rent indices</h3><canvas class="chart" id="cr1"></canvas></div><div class="box"><h3>Modelled occupancy</h3><canvas class="chart" id="cr2"></canvas></div></div>';
    UI.cityChart('cr1', c, ['land', 'rent']); UI.cityChart('cr2', c, ['aptOcc', 'offOcc']);
    h += '<div class="box"><h3>Modelled buildings</h3><table class="t"><tr><th>Building</th><th>Owner</th><th>District</th><th class="n">Occupancy</th><th class="n">Rent / ADR</th><th class="n">Profit / mo</th></tr>' + b.map(function (f) {
      return '<tr class="click" data-act="openFirm" data-arg="' + f.id + '"><td>' + UAE.FIRM_TYPES[f.type].icon + ' ' + UI.esc(f.name) + '</td><td>' + UI.coLink(UAE.co(f.owner)) + '</td><td>' + UI.esc(UAE.geo.district(f.district).name) + '</td><td class="n">' + UAE.fmt.pct(f.type === 'mall' ? f.occTotal || f.occ || 0 : f.occ || 0) + '</td><td class="n">' + Math.round(f.type === 'hotel' ? f.adr : f.rent || 0).toLocaleString() + '</td><td class="n">' + UI.money(f.last.profit) + '</td></tr>';
    }).join('') + '</table></div>';
  } else if (tab === 'retail') {
    h += '<div class="grid2"><div class="box"><h3>Retail sales (modelled stores)</h3><canvas class="chart" id="cs1"></canvas></div><div class="box"><h3>Retail sales per capita</h3><canvas class="chart" id="cs2"></canvas></div></div>';
    UI.cityChart('cs1', c, ['retail']); UI.cityChart('cs2', c, ['retailPc']);
    var mk = UAE.PRODUCTS.filter(function (p) { return p.perCap; }).map(function (p) { var m = UAE.S.mkt && UAE.S.mkt[id + '|' + p.id]; return { p: p, m: m }; }).filter(function (x) { return x.m; })
      .sort(function (a, b) { return b.m.demand * b.p.ref - a.m.demand * a.p.ref; });
    h += '<div class="box"><h3>Consumer markets in ' + C.name + ' (by value)</h3><table class="t"><tr><th>Product</th><th class="n">Market / day</th><th class="n">Modelled share</th><th>Supply · Demand</th><th>Leader</th></tr>' + mk.map(function (x) {
      var sh = UAE.marketShares(id, x.p.id), lead = Object.keys(sh).filter(function (k) { return k !== 'BACKGROUND'; }).sort(function (a, b) { return sh[b] - sh[a]; })[0];
      var mx = Math.max(x.m.demand, x.m.supply, 1);
      return '<tr class="click" data-act="pdetail" data-arg="' + x.p.id + '|' + id + '"><td>' + x.p.name + '</td><td class="n">' + UAE.fmt.aed(x.m.demand * x.m.avgP) + '</td><td class="n">' + UAE.fmt.pct(x.m.demand ? x.m.sold / x.m.demand : 0, 2) + '</td>' +
        '<td>' + UI.bar(x.m.supply / mx * 100, '#ffd24d', UAE.fmt.num(x.m.supply, 0)) + '<br>' + UI.bar(x.m.demand / mx * 100, '#ff8a3d', UAE.fmt.num(x.m.demand, 0)) + '</td><td>' + (lead ? UI.coLink(UAE.co(lead)) : '<span class="muted">background retailers</span>') + '</td></tr>';
    }).join('') + '</table></div>';
  } else if (tab === 'tourism') {
    var last2 = c.hist[c.hist.length - 1];
    h += '<div class="cards">' + UI.card('Tourists / year', UAE.fmt.num(c.tourists)) + UI.card('Benchmark ADR', 'AED ' + C.hotelADR, id === 'DXB' ? 'REAL DET 2025' : 'EST') + UI.card('Benchmark occupancy', UAE.fmt.pct(C.hotelOcc)) +
      UI.card('Season (this month)', '×' + UAE.season('tourism').toFixed(2), 'peak Nov–Mar') + UI.card('Modelled hotel occupancy', last2.hotOcc == null ? '—' : UAE.fmt.pct(last2.hotOcc)) + '</div>';
    h += '<div class="grid2"><div class="box"><h3>Tourists / year</h3><canvas class="chart" id="ct1"></canvas></div><div class="box"><h3>Hotel occupancy</h3><canvas class="chart" id="ct2"></canvas></div></div>';
    UI.cityChart('ct1', c, ['tourists']); UI.cityChart('ct2', c, ['hotOcc']);
  }
  return h;
};
UI.act.cgraph = function (i, el) {
  var picks = (UI.tabState.cgraphs || 'pop,unemp,wage,retail').split(','); picks[+i] = el.value;
  UI.tabState.cgraphs = picks.join(','); UI.render();
};
