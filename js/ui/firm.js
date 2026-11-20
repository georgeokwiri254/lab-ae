/* ============================================================================
 * UAE CAPITALISM LAB  -  BUILD MENU, MAP PLACEMENT & FIRM MANAGEMENT PANEL
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.BUILD_GROUPS = [
  ['Retail & Services',   ['retail','service','mall','hotel','sports']],
  ['Industry & Resources',['factory','warehouse','farm','mine','oilwell','logging','solar']],
  ['Real Estate',         ['apartment','commercial','mansion']],
  ['Media & Digital',     ['tv','radio','newspaper','software','internet','telecom','datacenter','rnd']],
  ['Banking & Insurance', ['bankhq','bankbranch','inshq','insoffice']],
  ['Trade & Logistics',   ['importer','exporter','logistics']],
  ['Corporate & Civic',   ['hq','civic']]
];

/* ------------------------------------------------------------ build menu */
UI.buildMenu = function () {
  var co = UAE.player();
  var h = '<div class="note">Pick a building type, then click a glowing zone on the map. Each type is only allowed in matching zones ' +
    '(e.g. factories in industrial / free-zone / port areas, oil wells in Abu Dhabi oilfields). Land price comes from the district; construction cost and time are shown below.</div>';
  UI.BUILD_GROUPS.forEach(function (g) {
    h += '<div class="box"><h3>' + g[0] + '</h3><div class="tiles">';
    g[1].forEach(function (k) {
      var T = UAE.FIRM_TYPES[k], dis = T.disabled || (T.gov && !UAE.S.settings.govMode);
      var why = T.disabled || (T.gov ? 'Enable Government Mode (Settings) to build civic buildings.' : '');
      h += '<button class="tile' + (dis ? ' dis' : '') + '" data-act="' + (dis ? 'noop' : 'startBuild') + '" data-arg="' + k + '" title="' + UI.esc(why) + '">' +
        '<span class="code">' + T.code + (T.dlc ? ' · ' + T.dlc : '') + (T.ext ? ' · UAE ext' : '') + '</span><span class="ic">' + T.icon + '</span>' +
        '<span class="nm">' + T.name + '</span><span class="ds">' + (dis ? UI.esc(why) : 'from ' + UAE.fmt.aed(UAE.BUILD[k][0]) + ' + land · ' + UAE.BUILD[k][1] + ' days<br>' + T.zones.join(', ')) + '</span></button>';
    });
    h += '</div></div>';
  });
  h += '<div class="muted">Cash available: ' + UAE.fmt.aed(co.bs.cash) + '</div>';
  return h;
};
UI.act.noop = function (a, el) { if (el && el.title) UI.toast(el.title, 'bad'); };
UI.act.startBuild = function (type) {
  UI.buildType = type; UI.close();
  UI.showZones(true);
  var T = UAE.FIRM_TYPES[type];
  var b = UI.$('buildBanner'); b.classList.add('open');
  b.innerHTML = '🏗 Placing <b class="t-a">' + T.name + '</b> · allowed zones: ' + T.zones.map(function (z) { return '<span style="color:' + UI.ZONE_COLORS[z] + '">' + z + '</span>'; }).join(', ') +
    ' · click the map · <a href="#" id="cancelBuild">cancel (Esc)</a>';
  UI.$('cancelBuild').onclick = function (e) { e.preventDefault(); UI.cancelBuild(); };
  UI.map.getCanvas().style.cursor = 'crosshair';
  var n = UAE.plotSize(type), res = UAE.DEPOSIT_KINDS[T.kind];
  b.innerHTML += '<div class="bb-sub">Footprint ' + n + '×' + n + ' land plots (40 m grid) · ' + (res ? 'must sit on a ' + res.join(' / ') + ' site' : 'snaps to the plot grid') +
    ' · <span id="bbInfo" class="muted">move the cursor over the map</span></div>';
  UI.$('cancelBuild').onclick = function (e) { e.preventDefault(); UI.cancelBuild(); };
  // mines / wells: switch on the resource-site overlay and fly to the nearest free site
  var center = UI.map.getCenter(), here = [center.lat, center.lng];
  if (res) {
    UI.showZones(false); UI.showDeposits(true);
    var dep = UAE.DEPOSITS.filter(function (d) { return res.indexOf(d.res) >= 0 && !UAE.depState(d.id).firm; })
      .sort(function (a, b2) { return UAE.geo.km(here, a.c) - UAE.geo.km(here, b2.c); })[0];
    if (dep) UI.map.flyTo({ center: UI.ll(dep.c), zoom: 12, pitch: 45, duration: 2000 });
    return;
  }
  // zoom to the best matching district if the current view has none
  var ds = UAE.DISTRICTS.filter(function (d) { return T.zones.indexOf(d.zone) >= 0; })
    .sort(function (a, b2) { return UAE.geo.km(here, a.c) - UAE.geo.km(here, b2.c); });
  if (ds.length && UAE.geo.km(here, ds[0].c) > 25) UI.map.flyTo({ center: UI.ll(ds[0].c), zoom: 15, pitch: 50, duration: 2000 });
  else if (UI.map.getZoom() < 14.5) UI.map.easeTo({ zoom: 15, duration: 900 });
};
UI.cancelBuild = function () {
  var wasRes = UI.buildType && UAE.DEPOSIT_KINDS[UAE.FIRM_TYPES[UI.buildType].kind];
  UI.buildType = null; UI.$('buildBanner').classList.remove('open');
  UI.map.getCanvas().style.cursor = ''; UI.showZones(false);
  if (wasRes && !UI.$('zRes').dataset.user) UI.showDeposits(false);
  UI.map.getSource('preview').setData({ type: 'FeatureCollection', features: [] });
  UI.map.getSource('grid').setData({ type: 'FeatureCollection', features: [] });
};
/** Build-mode preview: the 40 m plot grid around the cursor, blocked plots in magenta and the
 *  snapped footprint (green = can build, magenta = cannot) with a live plot / cost read-out. */
UI.previewBuild = function (lngLat) {
  var p = [lngLat.lat, lngLat.lng], type = UI.buildType, q = UAE.quoteFirm(type, p, 1), T = UAE.FIRM_TYPES[type];
  var pl = q.plot || UAE.grid.blockAt(p, UAE.plotSize(type)), feats = [], R = Math.max(6, pl.n + 5);
  if (UI.map.getZoom() >= 13.5 && pl.n <= 8) {
    var x0 = pl.x - R, x1 = pl.x + pl.n + R, y0 = pl.y - R, y1 = pl.y + pl.n + R, idx = UAE.plotIndex();
    for (var x = x0; x <= x1; x++) { var a = UAE.grid.corner(x, y0), b = UAE.grid.corner(x, y1); feats.push({ type: 'Feature', properties: { k: 'line' }, geometry: { type: 'LineString', coordinates: [[a[1], a[0]], [b[1], b[0]]] } }); }
    for (var y = y0; y <= y1; y++) { var c = UAE.grid.corner(x0, y), d = UAE.grid.corner(x1, y); feats.push({ type: 'Feature', properties: { k: 'line' }, geometry: { type: 'LineString', coordinates: [[c[1], c[0]], [d[1], d[0]]] } }); }
    for (var gx = x0; gx < x1; gx++) for (var gy = y0; gy < y1; gy++) if (idx[gx + ',' + gy])
      feats.push({ type: 'Feature', properties: { k: 'bad' }, geometry: { type: 'Polygon', coordinates: [UAE.grid.ring({ x: gx, y: gy, n: 1 })] } });
  }
  (q.bad || []).forEach(function (cxy) { feats.push({ type: 'Feature', properties: { k: 'bad' }, geometry: { type: 'Polygon', coordinates: [UAE.grid.ring({ x: cxy[0], y: cxy[1], n: 1 })] } }); });
  UI.map.getSource('grid').setData({ type: 'FeatureCollection', features: feats });
  var col = q.ok ? '#b8ff2c' : '#ff2bd6';
  UI.map.getSource('preview').setData({ type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { col: col, h: Math.max(4, T.floors * 3.6) }, geometry: { type: 'Polygon', coordinates: [UAE.grid.ring(pl, pl.n === 1 ? 0.14 : pl.n * 0.12)] } },
    { type: 'Feature', properties: { col: col, h: 0 }, geometry: { type: 'LineString', coordinates: UAE.grid.ring(pl, 0) } }] });
  var info = UI.$('bbInfo'); if (!info) return;
  if (q.ok) {
    var dd = q.district;
    info.innerHTML = '<span class="t-a">✔ ' + UI.esc(q.deposit ? q.deposit.name : dd.name) + '</span> · ' + (q.deposit ? UAE.P[q.deposit.res].name + ' grade ×' + q.deposit.grade.toFixed(2) + ' · ' + UAE.fmt.num(UAE.depState(q.deposit.id).left) + ' left' :
      dd.zone + ' · AED ' + Math.round(dd.land * UAE.S.cities[dd.city].landIdx).toLocaleString() + '/m² · traffic ' + dd.foot.toFixed(1)) + ' · total ' + UAE.fmt.aed(q.total);
  } else info.innerHTML = '<span class="t-m">✖ ' + UI.esc(q.why) + '</span>';
};
UI.tryBuild = function (p) {
  var type = UI.buildType, q = UAE.quoteFirm(type, p, 1);
  if (!q.ok) { UI.toast(q.why, 'bad'); return; }
  UI.pendingBuild = { type: type, p: p };
  UI.buildModal(1);
};
UI.buildModal = function (size) {
  var pb = UI.pendingBuild, q = UAE.quoteFirm(pb.type, pb.p, size), T = q.T, C = UAE.CITIES[q.city], co = UAE.player();
  var staff = T.staff * (1 + 0.8 * (size - 1));
  var monthly = staff * C.wage * UAE.S.cities[q.city].wageIdx * T.wageMult + UAE.electricityBill(T.kwh * (1 + 0.8 * (size - 1)), ['factory','mine','oil','farm','warehouse','datacenter','logistics'].indexOf(T.kind) >= 0, C.emirate);
  var h = '<h2>' + T.icon + ' Build ' + T.name + '</h2>' +
    '<div class="row"><label>Location</label><b>' + UI.esc(q.district.name) + '</b> · ' + C.name + ' (' + UAE.EMIRATES[C.emirate].name + ')</div>' +
    '<div class="row"><label>Zone</label><span style="color:' + UI.ZONE_COLORS[q.district.zone] + '">' + q.district.zone + '</span> · land AED ' + q.district.land.toLocaleString() + '/m² ' + UI.tag('EST') + '</div>' +
    '<div class="row"><label>Plot</label><span class="mono">grid ' + q.plot.x + ',' + q.plot.y + ' · ' + q.plot.n + '×' + q.plot.n + ' plots · ' + q.c[0].toFixed(5) + ', ' + q.c[1].toFixed(5) + '</span></div>' +
    (q.deposit ? '<div class="row"><label>Resource site</label><b>' + UI.esc(q.deposit.name) + '</b> · ' + UAE.P[q.deposit.res].name + ' · grade ×' + q.deposit.grade.toFixed(2) + ' · cost ×' + q.deposit.cost.toFixed(2) + ' · ' + UAE.fmt.num(UAE.depState(q.deposit.id).left) + ' ' + UAE.P[q.deposit.res].unit + ' left</div>' :
      '<div class="row"><label>Customer traffic</label>' + UI.bar(q.district.foot / 2.3 * 100, '#00f0ff') + ' <span class="muted">district footfall ' + q.district.foot.toFixed(1) + '</span></div>') +
    '<div class="row"><label>Size (levels)</label><input type="range" min="1" max="6" value="' + size + '" data-ch="buildSize"> <b>' + size + '</b></div>' +
    '<div class="row"><label>Name</label><input class="in" id="bName" style="flex:1" value="' + UI.esc(co.name.split(' ')[0] + ' ' + T.name + ' ' + q.district.name.split(/[\/(]/)[0].trim()) + '"></div>' +
    '<hr class="divider"><div class="cards">' + UI.card(q.deposit ? 'Site rights' : 'Land', UAE.fmt.aed(q.land)) + UI.card('Construction', UAE.fmt.aed(q.building)) +
    UI.card('Total', UAE.fmt.aed(q.total), 'cash: ' + UAE.fmt.aed(co.bs.cash), q.total > co.bs.cash ? 'm' : 'a') +
    UI.card('Build time', q.days + ' days') + UI.card('Staff', Math.round(staff)) + UI.card('Run cost / month', UAE.fmt.aed(monthly), 'wages + DEWA-tariff power') + '</div>' +
    (T.dlc ? '<div class="note">' + T.dlc + ' DLC building.</div>' : '') +
    '<div class="row"><button class="btn a" data-act="confirmBuild" data-arg="' + size + '"' + (q.total > co.bs.cash ? ' disabled' : '') + '>Build for ' + UAE.fmt.aed(q.total) + '</button>' +
    '<button class="btn m" data-act="closeModal">Cancel</button></div>';
  UI.modal(h);
};
UI.act.buildSize = function (a, el) { UI.buildModal(+el.value); };
UI.act.confirmBuild = function (size) {
  var pb = UI.pendingBuild, name = UI.$('bName').value;
  var f = UAE.createFirm(UAE.S.activeCo, pb.type, pb.p, { size: +size, name: name });
  UI.closeModal();
  if (!f) { UI.toast('Not enough cash.', 'bad'); return; }
  UI.toast('Construction started: ' + UI.esc(f.name) + ' · opens ' + UAE.cal.label(f.openDay), 'good');
  UAE.news('Construction started on ' + f.name + ' (' + UAE.geo.district(f.district).name + ').', 'firm');
  UI.cancelBuild(); UI.refreshMap(); UI.refreshHUD();
  UI.openFirm(f.id, true);
};

/* ============================================================ FIRM PANEL */
UI.openFirm = function (id, noFly) {
  var f = UAE.firm(id); if (!f) return;
  if (!noFly) UI.flyTo(f.c, f.seed && f.h ? 15.2 : 16.3);
  UI.open(function () { var x = UAE.firm(id); return x ? x.name : 'Firm closed'; }, function () { return UI.firmPanel(id); });
};
UI.canEdit = function (f) { return UAE.isHuman(UAE.co(f.owner)); };

UI.firmPanel = function (id) {
  var f = UAE.firm(id); if (!f) return '<div class="note">This firm no longer exists.</div>';
  var T = UAE.FIRM_TYPES[f.type], co = UAE.co(f.owner), d = UAE.geo.district(f.district), C = UAE.CITIES[f.city], mine = UI.canEdit(f);
  var h = '<div class="row">' + UI.coLink(co) + ' <span class="pill">' + T.code + ' ' + T.name + '</span> <span class="pill">' + UI.esc(d.name) + '</span> <span class="pill">' + C.name + ', ' + UAE.EMIRATES[C.emirate].name + '</span>' +
    (f.seed ? ' <span class="pill real" title="Real-world asset at its actual location">REAL SITE</span>' : '') + '</div>';
  if (f.status === 'construction') {
    var total = UAE.BUILD[f.type][1], left = f.openDay - UAE.S.day;
    h += '<div class="box"><h3>Under construction</h3><div class="row">Opens ' + UAE.cal.label(f.openDay) + ' · ' + left + ' days left</div>' +
      '<div style="height:6px;border-radius:4px;background:#111;overflow:hidden"><div style="height:100%;width:' + Math.max(3, 100 - left / total * 100) + '%;background:linear-gradient(90deg,var(--cyan),var(--acid));box-shadow:var(--glow-a)"></div></div></div>';
  }
  h += '<div class="cards">' +
    UI.card('Revenue (last month)', UI.money(f.last.rev)) + UI.card('Profit (last month)', UI.money(f.last.profit), 'this month so far: ' + UAE.fmt.aed(f.m.rev - f.m.cost), f.last.profit >= 0 ? 'a' : 'm') +
    UI.card('Size', f.size + ' level' + (f.size > 1 ? 's' : ''), T.staff * (1 + 0.8 * (f.size - 1)) + ' staff') +
    UI.card('Efficiency', UAE.fmt.pct(f.eff, 0), 'training ' + Math.round(f.training || 0)) +
    UI.card('Book value', UAE.fmt.aed(f.ppe + f.land), f.seed ? 'part of group core assets' : 'land ' + UAE.fmt.aed(f.land)) + '</div>';
  h += '<div class="box"><h3>Profit trend</h3><canvas class="chart" id="fChart" style="height:120px"></canvas></div>';
  UI.after(function () { var cv = UI.$('fChart'); if (cv) UI.chart(cv, [{ label: 'Monthly profit', data: f.hist.slice(), color: '#b8ff2c' }], { bars: true, fmt: function (v) { return UAE.fmt.num(v); } }); });
  h += UI.firmBody(f, mine);
  // common controls
  if (mine) {
    var mgr = f.manager ? UAE.person(f.manager) : null;
    h += '<div class="box"><h3>Management</h3>' +
      '<div class="row"><label>Advertising / month</label><input class="in num" id="fAd" value="' + Math.round(f.adBudget || 0) + '"><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|adBudget|fAd">Set</button><span class="muted">builds brand in ' + C.name + '; pays local media</span></div>' +
      '<div class="row"><label>Training / month</label><input class="in num" id="fTr" value="' + Math.round(f.trainBudget || 0) + '"><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|trainBudget|fTr">Set</button><span class="muted">raises efficiency &amp; quality</span></div>' +
      '<div class="row"><label>Manager</label>' + (mgr ? '<b>' + UI.esc(mgr.name) + '</b> mgmt ' + mgr.skill.mgmt + ' · ' + UAE.fmt.aed(mgr.salary) + '/mo <button class="btn sm m" data-act="fireMgr" data-arg="' + f.id + '">Dismiss</button>' : '<span class="muted">none</span> <button class="btn sm" data-act="info" data-arg="managers">Hire in Manager Guide</button>') + '</div>' +
      '<div class="row"><button class="btn a" data-act="fExpand" data-arg="' + f.id + '">Expand +1 level (' + UAE.fmt.aed(UAE.BUILD[f.type][0] * 0.9) + ')</button>' +
      '<button class="btn" data-act="fRename" data-arg="' + f.id + '">Rename</button>' +
      '<button class="btn m" data-act="fSell" data-arg="' + f.id + '">Sell / demolish</button>' +
      '<button class="btn" data-act="fFly" data-arg="' + f.id + '">Fly to</button></div></div>';
  } else h += '<div class="row"><button class="btn" data-act="fFly" data-arg="' + f.id + '">Fly to</button><span class="muted">Competitor firm - view only.</span></div>';
  return h;
};

/** Type-specific section of the firm panel. */
UI.firmBody = function (f, mine) {
  var k = UAE.FIRM_TYPES[f.type].kind, h = '';
  var dis = mine ? '' : ' disabled';
  if (k === 'retail' || k === 'warehouse') {
    h += '<div class="box"><h3>' + (k === 'retail' ? 'Product lines (purchasing → sales)' : 'Stocked products (wholesale)') + '</h3><table class="t"><tr><th>Product</th><th>Supplier</th><th class="n">Price</th><th class="n">Stock</th>' +
      (k === 'retail' ? '<th class="n">Sold/day</th><th class="n">Demand</th><th class="n">Capacity</th>' : '') + '<th class="n">Unit cost</th><th class="n">Quality</th><th></th></tr>';
    f.lines.forEach(function (l, i) {
      var P = UAE.P[l.pid], s = f.stock[l.pid], opts = UAE.supplyOptions(f, l.pid).slice(0, 12);
      var sel = '<select class="in" data-ch="lineSupplier" data-arg="' + f.id + '|' + i + '"' + dis + '>' + opts.map(function (o) {
        return '<option value="' + o.id + '"' + (o.id === l.supplier ? ' selected' : '') + '>' + UI.esc(o.name) + ' · AED ' + o.unit.toFixed(2) + (o.avail !== Infinity ? ' · ' + UAE.fmt.num(o.avail) + ' avail' : '') + '</option>';
      }).join('') + '</select>';
      h += '<tr><td><b>' + P.name + '</b><br><span class="muted">' + P.cls + ' · ref AED ' + (P.ref || P.world) + '</span></td><td>' + sel + '</td>' +
        '<td class="n"><input class="in num" style="width:84px" value="' + l.price.toFixed(2) + '" data-ch="linePrice" data-arg="' + f.id + '|' + i + '"' + dis + '></td>' +
        '<td class="n">' + UAE.fmt.num(s ? s.q : 0) + '</td>' +
        (k === 'retail' ? '<td class="n">' + UAE.fmt.num(l.sold || 0, 1) + '</td><td class="n">' + UAE.fmt.num(l.demand || 0, 1) + '</td><td class="n">' + UAE.fmt.num(l.cap || UAE.lineCap(f, l), 0) + '</td>' : '') +
        '<td class="n">' + (s ? s.cost.toFixed(2) : '—') + '</td><td class="n">' + (s ? Math.round(s.qual) : '—') + '</td>' +
        '<td>' + (mine ? '<button class="btn sm m" data-act="lineDel" data-arg="' + f.id + '|' + i + '">✕</button>' : '') + '</td></tr>';
    });
    h += '</table>';
    if (mine && f.lines.length < UAE.FIRM_TYPES[f.type].lines) {
      var prods = UAE.PRODUCTS.filter(function (p) { return k === 'warehouse' || p.kind === 'consumer' || p.kind === 'fuel'; });
      h += '<div class="row"><select class="in" id="addPid">' + prods.map(function (p) { return '<option value="' + p.id + '">' + p.name + ' (' + p.cls + ')</option>'; }).join('') + '</select>' +
        '<button class="btn a sm" data-act="lineAdd" data-arg="' + f.id + '">+ Add product</button><span class="muted">' + f.lines.length + ' / ' + UAE.FIRM_TYPES[f.type].lines + ' lines</span></div>';
    }
    if (k === 'retail') h += '<div class="note">Retail prices include 5% VAT (REAL); revenue is booked net of VAT. Imports pay 5% customs on CIF (REAL) + freight from the nearest port. Demand = residents × income + tourists, by city and season.' +
      (mine ? ' Typing a price fixes it (the CEO / auto-pricing will not change it); <a href="#" data-act="releasePrices" data-arg="' + f.id + '">release fixed prices</a>.' : '') + '</div>';
    h += '</div>';
    if (k === 'retail') h += UI.storeBox(f) + UI.ratingsBox(f);
  }
  if (k === 'service') h += UI.storeBox(f);
  if (k === 'factory' || k === 'farm' || k === 'mine' || k === 'oil') {
    h += '<div class="box"><h3>Production</h3><table class="t"><tr><th>Output</th><th>Inputs (per unit)</th><th class="n">Rate</th><th class="n">Made (month)</th><th class="n">Stock</th><th class="n">Unit cost</th><th class="n">Sell price</th><th class="n">Quality</th><th></th></tr>';
    f.lines.forEach(function (l, i) {
      var P = UAE.P[l.pid], s = f.stock[l.pid];
      var ins = P.rec ? P.rec.in.map(function (x) { return UAE.P[x[0]].name + ' ×' + x[1] + ' <span class="muted">(stock ' + UAE.fmt.num(UAE.stockQ(f, x[0])) + ')</span>'; }).join('<br>') :
        (k === 'farm' ? 'land, water, feed' : 'natural deposit');
      h += '<tr><td><b>' + P.name + '</b><br><span class="muted">' + P.unit + '</span></td><td>' + ins + '</td>' +
        '<td class="n"><input type="range" min="0" max="100" value="' + Math.round((l.rate == null ? 1 : l.rate) * 100) + '" data-ch="lineRate" data-arg="' + f.id + '|' + i + '"' + dis + ' style="width:80px"> ' + Math.round((l.rate == null ? 1 : l.rate) * 100) + '%</td>' +
        '<td class="n">' + UAE.fmt.num(l.made || 0) + '</td><td class="n">' + UAE.fmt.num(s ? s.q : 0) + '</td><td class="n">' + (s ? s.cost.toFixed(2) : '—') + '</td>' +
        '<td class="n"><input class="in num" style="width:84px" value="' + (l.price || 0).toFixed(2) + '" data-ch="linePriceP" data-arg="' + f.id + '|' + i + '"' + dis + '></td>' +
        '<td class="n">' + (s ? Math.round(s.qual) : '—') + '</td><td>' + (mine ? '<button class="btn sm m" data-act="lineDel" data-arg="' + f.id + '|' + i + '">✕</button>' : '') + '</td></tr>';
    });
    h += '</table>';
    if (f.reserve != null) h += '<div class="row muted">Remaining reserve: ' + UAE.fmt.num(f.reserve) + ' units (SYN deposit size)</div>';
    if (mine && f.lines.length < Math.max(1, UAE.FIRM_TYPES[f.type].lines)) {
      var opts = k === 'factory' ? UAE.PRODUCTS.filter(function (p) { return p.rec; }) :
        k === 'farm' ? Object.keys(UAE.FARM).map(function (x) { return UAE.P[x]; }) :
        k === 'mine' ? [UAE.P.limestone, UAE.P.sand] : [UAE.P.crude, UAE.P.gas];
      h += '<div class="row"><select class="in" id="addPid">' + opts.map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('') + '</select>' +
        '<button class="btn a sm" data-act="lineAdd" data-arg="' + f.id + '">+ Add production line</button></div>';
    }
    h += '<div class="note">Output is sold to stores that pick this firm as supplier, to city construction/industrial demand (cement, aluminium, glass, jet fuel), and surplus is exported via the nearest port at world prices. Your own stores get it at cost.</div></div>';
  }
  if (k === 'hotel') {
    h += '<div class="box"><h3>Hotel operations</h3><div class="cards">' + UI.card('Rooms', UAE.FIRM_TYPES.hotel.roomsPerLevel * f.size) + UI.card('Occupancy', UAE.fmt.pct(f.occ)) +
      UI.card('ADR', 'AED ' + Math.round(f.adr)) + UI.card('RevPAR', 'AED ' + Math.round(f.revpar || 0)) + '</div>' +
      '<div class="row"><label>Average daily rate</label><input class="in num" id="fAdr" value="' + Math.round(f.adr) + '"' + dis + '><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|adr|fAdr"' + dis + '>Set</button></div>' +
      '<div class="note">Benchmark ' + UAE.CITIES[f.city].name + ': ADR AED ' + UAE.CITIES[f.city].hotelADR + ', occupancy ' + UAE.fmt.pct(UAE.CITIES[f.city].hotelOcc) + ' ' + UI.tag(f.city === 'DXB' ? 'REAL DET 2025' : 'EST') + '. Room revenue = rooms × occupancy × ADR; F&amp;B adds ~35%.</div></div>';
  }
  if (k === 'mall') h += UI.mallBox(f);
  if (f.deposit) h += UI.depositBox(f);
  if (k === 'apartment' || k === 'office') {
    var unit = k === 'apartment' ? 'per unit / year' : 'per m² / year', stock = k === 'apartment' ? UAE.LEASE.apartmentUnits * f.size + ' units' : (k === 'mall' ? UAE.LEASE.mallM2 : UAE.LEASE.officeM2) * f.size + ' m²';
    var co = UAE.co(f.owner);
    h += '<div class="box"><h3>Leasing</h3><div class="cards">' + UI.card('Leasable', stock) + UI.card('Occupancy', UAE.fmt.pct(f.occ)) + UI.card('Rent ' + unit, 'AED ' + Math.round(f.rent)) + UI.card('Market rent', 'AED ' + Math.round(UAE.marketRent(f)), 'EST by district') + '</div>' +
      '<div class="row"><label>Rent ' + unit + '</label><input class="in num" id="fRent" value="' + Math.round(f.rent) + '"' + dis + '><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|rent|fRent"' + dis + '>Set</button>' +
      '<label style="min-width:0"><input type="checkbox" data-ch="autoRent" data-arg="' + co.id + '"' + (co.autoRent ? ' checked' : '') + dis + '> Real Estate Dept auto-rent</label></div>' +
      (k === 'mall' ? '<div class="note">Malls boost every retail store within 600 m (+25% traffic and more by size), like Dubai Mall and Yas Mall.</div>' : '') + '</div>';
  }
  if (k === 'service') {
    h += '<div class="box"><h3>Service</h3><div class="row"><label>Service type</label><select class="in" data-ch="fSvc" data-arg="' + f.id + '"' + dis + '>' +
      Object.keys(UAE.SERVICES).map(function (s) { return '<option value="' + s + '"' + (s === f.svc ? ' selected' : '') + '>' + UAE.SERVICES[s].name + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><label>Price per customer</label><input class="in num" id="fPrice" value="' + f.price.toFixed(2) + '"' + dis + '><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|price|fPrice"' + dis + '>Set</button><span class="muted">reference AED ' + UAE.SERVICES[f.svc].price + '</span></div>' +
      '<div class="cards">' + UI.card('Customers / day', UAE.fmt.num(f.customers || 0)) + '</div></div>';
  }
  if (k === 'sports') {
    h += '<div class="box"><h3>Attraction / sports</h3><div class="row"><label>Ticket price</label><input class="in num" id="fPrice" value="' + f.price.toFixed(0) + '"' + dis + '><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|price|fPrice"' + dis + '>Set</button></div>' +
      '<div class="cards">' + UI.card('Visitors / day', UAE.fmt.num(f.visitors || 0)) + '</div><div class="note">Visitors depend on tourist season (peak Nov-Mar) and district footfall. Also raises city quality of life.</div></div>';
  }
  if (k === 'internet') {
    var M = UAE.INTERNET_MODELS[f.model];
    h += '<div class="box"><h3>Internet business</h3><div class="row"><label>Business model</label><select class="in" data-ch="fModel" data-arg="' + f.id + '"' + dis + '>' +
      Object.keys(UAE.INTERNET_MODELS).map(function (m) { return '<option value="' + m + '"' + (m === f.model ? ' selected' : '') + '>' + UAE.INTERNET_MODELS[m].name + '</option>'; }).join('') + '</select></div>' +
      '<div class="cards">' + UI.card('Active users', UAE.fmt.num(f.users || 0)) + (M.gmvPerUser ? UI.card('GMV / day', UAE.fmt.aed(f.gmv || 0), 'GMV ≠ revenue') + UI.card('Take rate', UAE.fmt.pct(M.takeRate)) : UI.card('ARPU / year', 'AED ' + M.arpu)) + '</div>' +
      '<div class="note">Competes nationally with real platforms (noon, Amazon.ae, talabat, Careem). Marketplace revenue = GMV × take-rate, never GMV itself.</div></div>';
  }
  if (k === 'software') {
    h += '<div class="box"><h3>Software</h3><div class="row"><label>Product class</label><select class="in" data-ch="fSw" data-arg="' + f.id + '"' + dis + '>' +
      UAE.SOFTWARE.map(function (s) { return '<option' + (s === f.swClass ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></div>';
  }
  if (k === 'telecom') h += '<div class="box"><h3>Telecom</h3><div class="cards">' + UI.card('Subscribers', UAE.fmt.num(f.subs || 0)) + UI.card('ARPU / month', 'AED ' + f.arpu) + '</div><div class="note">Competes with e&amp; and du (incumbents).</div></div>';
  if (k === 'datacenter') h += '<div class="box"><h3>Data centre</h3><div class="cards">' + UI.card('Capacity', UAE.FIRM_TYPES.datacenter.mw * f.size + ' MW') + UI.card('Utilisation', UAE.fmt.pct(f.util)) + '</div><div class="note">Colocation ~AED 551 per kW per month (EST). Power billed at DEWA industrial tariff.</div></div>';
  if (k === 'solar') h += '<div class="box"><h3>Solar farm</h3><div class="cards">' + UI.card('Capacity', UAE.FIRM_TYPES.solar.mw * f.size + ' MW') + UI.card('Output / day', UAE.fmt.num(f.kwhDay || 0) + ' kWh') + UI.card('PPA', 'AED 0.085/kWh', 'EST') + '</div></div>';
  if (k === 'media') h += '<div class="box"><h3>Media</h3><div class="note">Earns a share of all advertising spent in ' + UAE.CITIES[f.city].name + ' (by every company), plus audience revenue. Reach: ' + UAE.FIRM_TYPES[f.type].reach + '.</div></div>';
  if (k === 'rnd') {
    var co2 = UAE.co(f.owner);
    h += '<div class="box"><h3>Research</h3><div class="row"><label>Research product</label><select class="in" data-ch="fTarget" data-arg="' + f.id + '"' + dis + '>' +
      UAE.PRODUCTS.filter(function (p) { return p.rec || p.kind === 'raw'; }).map(function (p) { return '<option value="' + p.id + '"' + (p.id === f.target ? ' selected' : '') + '>' + p.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="cards">' + UI.card('Technology level', (co2.tech[f.target] || 0).toFixed(1) + ' / 100') + '</div><div class="note">Higher technology raises the quality of everything your factories make for this product.</div></div>';
  }
  if (k === 'bankhq') {
    var bco = UAE.co(f.owner);
    h += '<div class="box"><h3>Bank</h3><div class="cards">' + UI.card('Customer deposits', UAE.fmt.aed(bco.bs.custDeposits)) + UI.card('Loan book', UAE.fmt.aed(bco.bs.loanBook)) +
      UI.card('Market deposit rate', UAE.fmt.pct(Math.max(0.005, UAE.S.macro.rate + UAE.RULES.depositSpread), 2)) + UI.card('Market lending rate', UAE.fmt.pct(UAE.S.macro.rate + UAE.RULES.loanSpread + 0.01, 2)) + '</div>' +
      '<div class="row"><label>Deposit rate %</label><input class="in num" id="bDep" value="' + (bco.bankRates.deposit * 100).toFixed(2) + '"' + dis + '><label>Lending rate %</label><input class="in num" id="bLend" value="' + (bco.bankRates.lending * 100).toFixed(2) + '"' + dis + '><button class="btn sm" data-act="bankRates" data-arg="' + bco.id + '"' + dis + '>Set</button></div>' +
      '<div class="note">Branches grow the deposit base. Higher lending rates cut loan demand and raise default provisions. Deposits are your liability, loans your asset.</div></div>';
  }
  if (k === 'inshq') {
    var ico = UAE.co(f.owner);
    h += '<div class="box"><h3>Insurance</h3><div class="row"><label>Premium level (1 = market)</label><input class="in num" id="iRate" value="' + ico.insRate.toFixed(2) + '"' + dis + '><button class="btn sm" data-act="insRate" data-arg="' + ico.id + '"' + dis + '>Set</button></div>' +
      '<div class="cards">' + UI.card('Claims ratio', UAE.fmt.pct(ico._claims || 0.62)) + '</div></div>';
  }
  if (k === 'hq') {
    h += '<div class="box"><h3>Headquarters</h3><div class="row"><button class="btn a" data-act="hq">Open HQ departments</button></div></div>';
  }
  if (k === 'mansion') h += '<div class="box"><h3>Mansion</h3><div class="note">Your personal residence - adds prestige. Upkeep is paid by the owning company.</div></div>';
  if (k === 'importer' || k === 'exporter' || k === 'logistics') {
    var txt = { importer: 'Removes the 6% importer margin on every import your company makes in this emirate, and earns trading fees.',
      exporter: 'Your factories in this emirate export at 99% of world price instead of 94%.',
      logistics: 'Cuts your freight costs in this city by 25% and earns a share of all freight moved in the city.' }[k];
    h += '<div class="box"><h3>' + UAE.FIRM_TYPES[f.type].name + '</h3><div class="note">' + txt + '</div></div>';
  }
  return h;
};

/* ------------------------------------------- store: traffic, popularity, lease */
UI.storeBox = function (f) {
  var mine = UI.canEdit(f), m = f.mall && UAE.firm(f.mall);
  var h = '<div class="box"><h3>Store location</h3><div class="cards">' +
    UI.card('Customer traffic index', UAE.trafficIndex(f).toFixed(2), m ? 'from the mall overall rating (' + (m.mallRating || 0) + ')' : 'district footfall + nearby shops') +
    UI.card('Store popularity', Math.round(f.popu == null ? 30 : f.popu) + ' / 100', 'grows with good product ratings') +
    (m ? UI.card('Location', UI.esc(m.name), 'shopping mall · ' + UI.esc(UAE.co(m.owner).name)) : UI.card('Location', 'Street store', UI.esc(UAE.geo.district(f.district).name))) + '</div>';
  if (m && f.lease) {
    var mkt = UAE.unitMarketRent(m) * f.size;
    h += '<table class="t"><tr><td>Monthly rent</td><td class="n">' + UAE.fmt.aed(f.lease.rent) + '</td><td class="muted">market ' + UAE.fmt.aed(mkt) + ' (' + Math.round(f.lease.rent / Math.max(1, mkt) * 100) + '%)</td></tr>' +
      '<tr><td>Lease expiry</td><td class="n">' + UAE.cal.label(f.lease.until) + '</td><td class="muted">' + Math.max(0, f.lease.until - UAE.S.day) + ' days</td></tr></table>';
    if (mine && f.owner !== m.owner) h += '<div class="row"><label>Renew only if rent ≤</label><input class="in num" id="renewMax" value="' + Math.round(f.lease.renewMax * 100) + '"> % of market <button class="btn sm" data-act="renewMax" data-arg="' + f.id + '">Set</button>' +
      (m.mallPol && m.mallPol.rentRenew > f.lease.renewMax ? ' <span class="t-m">⚠ landlord asks ' + Math.round(m.mallPol.rentRenew * 100) + '%: the store will leave at expiry</span>' : '') + '</div>';
  }
  return h + '</div>';
};
UI.act.renewMax = function (id) { var f = UAE.firm(id), v = UI.num('renewMax'); if (v >= 50 && v <= 300) { f.lease.renewMax = v / 100; UI.toast('Renewal condition set.', 'good'); UI.render(); } };
UI.act.releasePrices = function (id) { UAE.firm(id).lines.forEach(function (l) { l.fixedPrice = false; }); UI.toast('Prices released to the CEO / auto-pricing.', 'good'); UI.render(); };

/** Capitalism Lab product rating indicators per line: price / quality / brand vs the city average,
 *  overall rating, market share and the supply & demand indicators. */
UI.ratingsBox = function (f) {
  if (!f.lines.length) return '';
  var co = UAE.co(f.owner);
  var h = '<div class="box"><h3>Product ratings vs city average (' + UAE.CITIES[f.city].name + ')</h3><table class="t"><tr><th>Product</th><th>Price</th><th>Quality</th><th>Brand [aw + loy]</th><th>Overall</th><th>Share</th><th>Supply · Demand</th><th></th></tr>';
  f.lines.forEach(function (l) {
    var r = UAE.lineRatings(f, l), m = UAE.S.mkt && UAE.S.mkt[f.city + '|' + l.pid], P = UAE.P[l.pid], w = UAE.ratingWeights(l.pid);
    var avgP = m ? UAE.priceRating(l.pid, m.avgP) : 50, avgQ = m ? m.avgQ : 50, avgB = m ? m.avgB : 30;
    var avgO = avgP * w.p + avgQ * w.q + avgB * w.b;
    var dem = l.demand || 0, sup = Math.min(l.cap || 0, UAE.stockQ(f, l.pid) + (l.sold || 0)), mx = Math.max(dem, sup, 1);
    h += '<tr><td><a href="#" data-act="pdetail" data-arg="' + l.pid + '|' + f.city + '">' + P.name + '</a></td>' +
      '<td>' + UI.bar(r.price, '#ffd24d', null, avgP) + '</td><td>' + UI.bar(r.quality, '#b8ff2c', null, avgQ) + '</td>' +
      '<td>' + UI.bar(r.brand, '#ff8a3d', Math.round(r.brand) + ' [' + Math.round(r.aw) + (r.loy >= 0 ? ' +' : ' ') + Math.round(r.loy) + ']', avgB) + '</td>' +
      '<td>' + UI.bar(r.overall, '#00f0ff', Math.round(r.overall) + ' <span class="muted">avg ' + Math.round(avgO) + '</span>') + '</td>' +
      '<td>' + UI.bar((l.share || 0) * 100 * 10, '#ff2bd6', UAE.fmt.pct(l.share || 0, 2)) + '</td>' +
      '<td>' + UI.bar(sup / mx * 100, '#ffd24d', 'S ' + UAE.fmt.num(sup, 0) + ' · fill ' + Math.round((l.supplyMet == null ? 1 : l.supplyMet) * 100) + '%') +
        UI.bar(dem / mx * 100, '#ff8a3d', 'D ' + UAE.fmt.num(dem, 0)) + '</td>' +
      '<td>' + (UI.canEdit(f) ? '<button class="btn sm" data-act="adFor" data-arg="' + l.pid + '|' + f.city + '">Advertise</button>' : '') + '</td></tr>';
  });
  return h + '</table><div class="note">Bars: yellow = price rating, green = quality, orange = brand (awareness + loyalty; loyalty can be negative), cyan = overall. The white tick is the city average of all sellers incl. background retailers. ' +
    'If supply (S) is shorter than demand (D) the store is losing sales - raise capacity (expand, train) or stock; "fill" is how much of each order the supplier delivered. Share bar is scaled ×10.</div></div>';
};

/* ------------------------------------------------------------- malls */
UI.mallBox = function (f) {
  var mine = UI.canEdit(f); if (!f.mallInfo) UAE.mallRate(f);
  var I = f.mallInfo, P = f.mallPol || { lease: 'any', rentNew: 1, rentRenew: 1, term: 12 }, slots = UAE.mallSlots(f), ten = UAE.mallTenants(f);
  var h = '<div class="box"><h3>Shopping mall</h3><div class="cards">' + UI.card('Overall rating', I.overall + ' / 100', '', 'a') +
    UI.card('Retail units', slots, UAE.MALL_UNIT_M2 + ' m² each') + UI.card('Space occupied', UAE.fmt.pct(f.occTotal || 0), 'own stores ' + (f.unitsOwn || 0) + ' · other companies ' + (f.unitsOther || 0) + ' · background ' + Math.round(Math.max(0, (f.occTotal || 0) * slots - (f.unitsOwn || 0) - (f.unitsOther || 0)))) +
    UI.card('Vacant units', UAE.mallVacancy(f) - Math.round(Math.max(0, (f.occTotal || 0) * slots - (f.unitsOwn || 0) - (f.unitsOther || 0))) + ' free · ' + UAE.mallVacancy(f) + ' leasable') +
    UI.card('Market rent / unit', UAE.fmt.aed(UAE.unitMarketRent(f)) + '/mo') + '</div>';
  h += '<table class="t">' + [['Area customer traffic', I.traffic, 40], ['Boost from service firms', I.service, 15], ['Range of products & services', I.range, 20], ['Average product / service rating', I.rating, 20], ['Mall size', I.size, 5]]
    .map(function (x) { return '<tr><td>' + x[0] + '</td><td>' + UI.bar(x[1] / x[2] * 100, '#00f0ff', x[1] + ' / ' + x[2]) + '</td></tr>'; }).join('') + '</table>';
  h += '<h4>Stores in this mall (' + ten.length + ')</h4><table class="t"><tr><th>Store</th><th>Company</th><th class="n">Units</th><th class="n">Rent / month</th><th>Lease until</th><th class="n">Profit / month</th></tr>' +
    ten.map(function (s) { return '<tr class="click" data-act="openFirm" data-arg="' + s.id + '"><td>' + UAE.FIRM_TYPES[s.type].icon + ' ' + UI.esc(s.name) + '</td><td>' + UI.coLink(UAE.co(s.owner)) + '</td><td class="n">' + s.size + '</td><td class="n">' + UAE.fmt.aed(s.lease ? s.lease.rent : 0) + '</td><td>' + (s.lease ? UAE.cal.label(s.lease.until) : '—') + '</td><td class="n">' + UI.money(s.last.profit) + '</td></tr>'; }).join('') + '</table>' +
    (ten.length ? '' : '<div class="note">No modelled stores yet - background tenants fill the occupied space.</div>');
  if (mine) {
    h += '<h4>Mall policies</h4><div class="row"><label>Lease to</label><select class="in" id="mpLease">' + [['any', 'Any firms'], ['own', 'Own firms'], ['group', 'Firms in my group']].map(function (o) { return '<option value="' + o[0] + '"' + (P.lease === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><label>Rent for new leases</label><input class="in num" id="mpNew" value="' + Math.round(P.rentNew * 100) + '"> % of market</div>' +
      '<div class="row"><label>Rent for renewing leases</label><input class="in num" id="mpRen" value="' + Math.round(P.rentRenew * 100) + '"> % of market <span class="muted">tenants may leave if too high</span></div>' +
      '<div class="row"><label>Lease term</label><input class="in num" id="mpTerm" value="' + P.term + '"> months <button class="btn sm a" data-act="mallPol" data-arg="' + f.id + '">Apply policies</button></div>';
  }
  if (f.status === 'open' && UAE.mallAccepts(f, UAE.S.activeCo)) {
    h += '<h4>Set up a store in this mall</h4><div class="row"><select class="in" id="msType"><option value="retail">Retail store</option>' +
      Object.keys(UAE.SERVICES).map(function (s) { return '<option value="service:' + s + '">' + UAE.SERVICES[s].name + '</option>'; }).join('') + '</select>' +
      '<label style="min-width:0">units</label><input class="in num" id="msSize" value="1" style="width:50px"><button class="btn a" data-act="mallStore" data-arg="' + f.id + '">Lease space & fit out</button>' +
      '<span class="muted">fit-out from ' + UAE.fmt.aed(UAE.BUILD.retail[0] * 0.5) + ' · rent ~' + UAE.fmt.aed(UAE.unitMarketRent(f) * (UAE.S.activeCo === f.owner ? 0 : P.rentNew)) + '/unit/month · no land needed</span></div>';
  } else if (f.status === 'open') h += '<div class="note">This mall does not lease space to your company (policy: ' + P.lease + ').</div>';
  return h + '<div class="note">Stores in a mall get their customer traffic from the mall\'s Overall Rating. Service firms (restaurants, cafés, cinemas) raise the rating for everyone.</div></div>';
};
UI.act.mallPol = function (id) {
  var f = UAE.firm(id), n = UI.num('mpNew'), r = UI.num('mpRen'), t = UI.num('mpTerm');
  if (!(n >= 50 && n <= 250 && r >= 50 && r <= 250 && t >= 3 && t <= 120)) { UI.toast('Rents 50-250% of market, term 3-120 months.', 'bad'); return; }
  f.mallPol = { lease: UI.$('mpLease').value, rentNew: n / 100, rentRenew: r / 100, term: Math.round(t) };
  UI.toast('Mall policies updated.', 'good'); UI.render();
};
UI.act.mallStore = function (id) {
  var v = UI.$('msType').value.split(':'), size = Math.max(1, Math.round(UI.num('msSize') || 1));
  var r = UAE.openMallStore(UAE.S.activeCo, id, v[0], { size: size, svc: v[1] });
  if (UI.result(r, 'Lease signed - fit-out takes 15 days.')) UI.openFirm(r.firm.id, true);
};

/* ------------------------------------------------- natural resource firm */
UI.depositBox = function (f) {
  var d = UAE.DEP[f.deposit]; if (!d) return '';
  var st = UAE.depState(d.id), P = UAE.P[d.res], used = 1 - st.left / d.reserve, perDay = UAE.RESOURCE[d.res].out * f.size * f.eff * d.grade;
  return '<div class="box"><h3>Natural resource site</h3><div class="cards">' + UI.card('Site', UI.esc(d.name), d.offshore ? 'offshore' : 'onshore') +
    UI.card('Reserve left', UAE.fmt.num(st.left) + ' ' + P.unit, UAE.fmt.pct(used) + ' extracted') + UI.card('Years left at this rate', (st.left / Math.max(1, perDay) / 365).toFixed(1)) +
    UI.card('Grade', '×' + d.grade.toFixed(2)) + UI.card('Extraction cost', 'AED ' + (UAE.RESOURCE[d.res].cost * d.cost).toFixed(2) + '/' + P.unit, '×' + d.cost.toFixed(2)) + UI.card('Ore quality', d.qual) + '</div>' +
    '<div>' + UI.bar((1 - used) * 100, '#ffcc33', 'reserve ' + UAE.fmt.pct(1 - used)) + '</div>' +
    '<div class="note">UAE wholesale price of ' + P.name + ': AED ' + UAE.wholesalePrice(d.res).toFixed(2) + ' (export parity ' + ((UAE.S.wmkt[d.res] || {}).exp || 0).toFixed(2) + ' – import parity ' + ((UAE.S.wmkt[d.res] || {}).imp || 0).toFixed(2) + ').</div></div>';
};

/* -------------------------------------------------------- firm actions */
UI.act.fFly = function (id) { var f = UAE.firm(id); if (f) UI.flyTo(f.c, 16.3); };
UI.act.fSet = function (arg) {
  var p = arg.split('|'), f = UAE.firm(p[0]), v = UI.num(p[2]);
  if (!f || !isFinite(v) || v < 0) { UI.toast('Enter a valid number.', 'bad'); return; }
  f[p[1]] = v; UI.toast('Updated.', 'good'); UI.render();
};
UI.act.fExpand = function (id) { var f = UAE.firm(id); UI.result({ ok: UAE.expandFirm(f), why: 'Not enough cash.' }, 'Expansion started.'); };
UI.act.fSell = function (id) {
  var f = UAE.firm(id);
  UI.modal('<h2>Sell ' + UI.esc(f.name) + '?</h2><p>Buildings recover 70% of book value; land is sold at today\'s land index; stock is liquidated at 80% of cost.</p>' +
    '<div class="row"><button class="btn m" data-act="fSellYes" data-arg="' + id + '">Sell</button><button class="btn" data-act="closeModal">Cancel</button></div>');
};
UI.act.fSellYes = function (id) { var f = UAE.firm(id); UAE.sellFirm(f); UI.closeModal(); UI.close(); UI.refreshMap(); UI.toast('Firm sold.', 'good'); };
UI.act.fRename = function (id) {
  var f = UAE.firm(id);
  UI.modal('<h2>Rename</h2><div class="row"><input class="in" id="rn" style="flex:1" value="' + UI.esc(f.name) + '"></div><div class="row"><button class="btn a" data-act="fRenameYes" data-arg="' + id + '">Save</button></div>');
};
UI.act.fRenameYes = function (id) { UAE.firm(id).name = UI.$('rn').value; UI.closeModal(); UI.render(); };
UI.act.lineSupplier = function (arg, el) { var p = arg.split('|'); UAE.firm(p[0]).lines[+p[1]].supplier = el.value; UI.toast('Supplier changed.', 'good'); };
UI.act.linePrice = function (arg, el) { var p = arg.split('|'), v = parseFloat(el.value); if (v > 0) { var l = UAE.firm(p[0]).lines[+p[1]]; l.price = v; l.fixedPrice = true; UI.toast('Price fixed (CEO / auto-pricing will keep it).', 'good'); } };
UI.act.linePriceP = function (arg, el) { var p = arg.split('|'), v = parseFloat(el.value), l = UAE.firm(p[0]).lines[+p[1]]; if (v > 0) { l.price = v; l.priceSet = true; UI.toast('Selling price fixed (auto-pricing off for this line).', 'good'); } };
UI.act.lineRate = function (arg, el) { var p = arg.split('|'); UAE.firm(p[0]).lines[+p[1]].rate = +el.value / 100; UI.render(); };
UI.act.lineDel = function (arg) { var p = arg.split('|'), f = UAE.firm(p[0]); var l = f.lines.splice(+p[1], 1)[0]; if (l) { /* keep the stock; it can still be sold if re-added */ } UI.render(); };
UI.act.lineAdd = function (id) {
  var f = UAE.firm(id), pid = UI.$('addPid').value, l = UAE.addLine(f, pid);
  if (!l) { UI.toast('Already stocked or no free line.', 'bad'); return; }
  if (UAE.FIRM_TYPES[f.type].kind === 'retail') { var best = UAE.supplyOptions(f, pid)[0]; l.supplier = best.avail > 0 ? best.id : 'IMPORT'; }
  UI.render();
};
UI.act.fSvc = function (id, el) { var f = UAE.firm(id); f.svc = el.value; f.price = UAE.SERVICES[f.svc].price; UI.render(); };
UI.act.fModel = function (id, el) { UAE.firm(id).model = el.value; UI.render(); };
UI.act.fSw = function (id, el) { UAE.firm(id).swClass = el.value; };
UI.act.fTarget = function (id, el) { UAE.firm(id).target = el.value; UI.render(); };
UI.act.autoRent = function (coId, el) { UAE.co(coId).autoRent = el.checked; };
UI.act.bankRates = function (coId) {
  var co = UAE.co(coId), d = UI.num('bDep') / 100, l = UI.num('bLend') / 100;
  if (!(d >= 0 && l > d)) { UI.toast('Lending rate must exceed deposit rate.', 'bad'); return; }
  co.bankRates = { deposit: d, lending: l }; UI.toast('Bank rates set.', 'good'); UI.render();
};
UI.act.insRate = function (coId) { var v = UI.num('iRate'); if (v > 0.3 && v < 3) { UAE.co(coId).insRate = v; UI.render(); } };
UI.act.fireMgr = function (id) { var f = UAE.firm(id); var p = UAE.person(f.manager); if (p) { p.co = null; p.title = 'Candidate'; } f.manager = null; UI.render(); };
