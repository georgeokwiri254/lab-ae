/* ============================================================================
 * UAE CAPITALISM LAB  -  IC04 PRODUCT DETAILS & MARKETING
 *   Overview      every seller in the city: price / quality / brand / overall
 *                 ratings vs city average, market share
 *   Supply & Demand  per-city S/D indicators, demand curve, monthly history,
 *                 UAE wholesale balance for raw & intermediate goods
 *   Brand         awareness + loyalty of every company in the city
 *   Technology    tech level by company
 *   Supply chain  recipe tree, producers, import route, natural resource sites
 *   Marketing     advertising campaigns on TV / radio / newspapers / outdoor / digital
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.act.pdetail = function (arg) {
  var p = String(arg || '').split('|');
  if (p[0]) UI.tabState.pdPid = p[0];
  if (p[1]) UI.tabState.pdCity = p[1];
  UI.open('Product Details', UI.R.pdetail, { push: UI.stack.length > 0 });
};
UI.act.pdPid = function (a, el) { UI.tabState.pdPid = el.value; UI.render(); };
UI.act.product = function (pid) { UI.act.pdetail(pid); };   // IC03 rows open IC04 Product Details
UI.act.adFor = function (arg) { var p = arg.split('|'); UI.tabState.pdTab = 'mkt'; UI.act.pdetail(p[0] + '|' + p[1]); };

UI.R.pdetail = function () {
  var pid = UI.tabState.pdPid || 'phone', P = UAE.P[pid], city = UI.tabState.pdCity || UAE.player().hq, tab = UI.tabState.pdTab || 'ov';
  var view = UI.tabState.pdView || 'one';
  var h = UI.tabs('pdView', [['one', '📦 Product'], ['mk', '🌍 Market overview – biggest markets & your share']], view);
  if (view === 'mk') return h + UI.pdMarkets();
  h += UI.productBrowser(pid);
  h += UI.productHero(pid, '<div style="margin-top:6px">' + (P.ref ? 'Shelf price ' + UAE.fmt.aed(P.ref) : 'World price ' + UAE.fmt.aed(P.world || P.imp)) + (P.grow ? ' · demand +' + Math.round(P.grow * 100) + '%/yr 🔥' : '') + (P.rec ? '<br><span class="muted">Made from: ' + UI.recipeText(pid) + '</span>' : '') + '</div>');
  h += UI.tabs('pdCity', Object.keys(UAE.CITIES).map(function (k) { return [k, UAE.CITIES[k].name]; }), city);
  h += UI.tabs('pdTab', [['ov', 'Overview'], ['sd', 'Supply & Demand'], ['brand', 'Brand'], ['tech', 'Technology'], ['chain', 'Supply Chain'], ['mkt', 'Marketing']], tab);
  if (tab === 'ov') h += UI.pdOverview(pid, city);
  else if (tab === 'sd') h += UI.pdSupplyDemand(pid, city);
  else if (tab === 'brand') h += UI.pdBrand(pid, city);
  else if (tab === 'tech') h += UI.pdTech(pid);
  else if (tab === 'chain') h += UI.pdChain(pid);
  else h += UI.pdMarketing(pid, city);
  return h;
};

UI.pdOverview = function (pid, city) {
  var P = UAE.P[pid], m = UAE.S.mkt && UAE.S.mkt[city + '|' + pid];
  if (!P.perCap) return '<div class="note">' + P.name + ' is a ' + P.kind + ' good traded business-to-business - see Supply & Demand and Supply Chain.</div>' + UI.pdSupplyDemand(pid, city);
  if (!m) return '<div class="note">No market data yet - let a day pass.</div>';
  var w = UAE.ratingWeights(pid);
  var h = '<div class="cards">' + UI.card('Demand / day', UAE.fmt.num(m.demand, 0) + ' ' + P.unit, 'base ' + UAE.fmt.num(m.base, 0) + ' · price index ' + m.priceIdx.toFixed(2)) +
    UI.card('Modelled sales / day', UAE.fmt.num(m.sold, 1), m.sellers + ' modelled stores') + UI.card('Background retailers', UAE.fmt.pct(m.demand ? m.bgUnits / m.demand : 0), 'incumbents not modelled as firms') +
    UI.card('Avg price', 'AED ' + m.avgP.toFixed(2), 'ref ' + P.ref) + UI.card('Avg quality', m.avgQ.toFixed(1)) + UI.card('Avg brand', m.avgB.toFixed(1)) +
    UI.card('Rating weights', 'P ' + Math.round(w.p * 100) + ' · Q ' + Math.round(w.q * 100) + ' · B ' + Math.round(w.b * 100), UAE.LUXURY[pid] ? 'luxury: brand-driven' : 'staple: price/quality') + '</div>';
  var rows = [];
  UAE.allFirms().forEach(function (f) {
    if (f.city !== city || UAE.FIRM_TYPES[f.type].kind !== 'retail') return;
    f.lines.forEach(function (l) { if (l.pid === pid) rows.push({ f: f, l: l, r: UAE.lineRatings(f, l) }); });
  });
  rows.sort(function (a, b) { return (b.l.sold || 0) - (a.l.sold || 0); });
  h += '<div class="box"><h3>Sellers in ' + UAE.CITIES[city].name + '</h3><table class="t"><tr><th>Store</th><th>Company</th><th class="n">AED</th><th>Price rating</th><th>Quality</th><th>Brand</th><th>Overall</th><th class="n">Sold/day</th><th class="n">Share</th></tr>';
  rows.forEach(function (x) {
    h += '<tr class="click' + (UAE.isHuman(UAE.co(x.f.owner)) ? ' me' : '') + '" data-act="openFirm" data-arg="' + x.f.id + '"><td>' + UI.esc(x.f.name) + (x.f.mall ? ' 🏬' : '') + '</td><td>' + UI.coLink(UAE.co(x.f.owner)) + '</td><td class="n">' + x.l.price.toFixed(2) + '</td>' +
      '<td>' + UI.bar(x.r.price, '#ffd24d') + '</td><td>' + UI.bar(x.r.quality, '#b8ff2c') + '</td><td>' + UI.bar(x.r.brand, '#ff8a3d', Math.round(x.r.brand) + ' [' + Math.round(x.r.aw) + (x.r.loy >= 0 ? '+' : '') + Math.round(x.r.loy) + ']') + '</td>' +
      '<td>' + UI.bar(x.r.overall, '#00f0ff') + '</td><td class="n">' + UAE.fmt.num(x.l.sold || 0, 1) + '</td><td class="n">' + UAE.fmt.pct(x.l.share || 0, 2) + '</td></tr>';
  });
  var avgO = UAE.priceRating(pid, m.avgP) * w.p + m.avgQ * w.q + m.avgB * w.b;
  h += '<tr class="sub"><td>City average</td><td>all sellers incl. background</td><td class="n">' + m.avgP.toFixed(2) + '</td><td>' + UI.bar(UAE.priceRating(pid, m.avgP), '#ffd24d') + '</td><td>' + UI.bar(m.avgQ, '#b8ff2c') + '</td><td>' + UI.bar(m.avgB, '#ff8a3d') + '</td><td>' + UI.bar(avgO, '#00f0ff') + '</td><td></td><td></td></tr>';
  h += '</table>' + (rows.length ? '' : '<div class="note">No modelled store sells ' + P.name + ' in ' + UAE.CITIES[city].name + ' - the whole market is served by background retailers. An opportunity?</div>') + '</div>';
  // market share by company
  var sh = UAE.marketShares(city, pid), keys = Object.keys(sh).sort(function (a, b) { return sh[b] - sh[a]; });
  h += '<div class="box"><h3>Market share by company</h3><table class="t">' + keys.map(function (k) {
    return '<tr><td>' + (k === 'BACKGROUND' ? '<span class="muted">Background retailers (not modelled)</span>' : UI.coLink(UAE.co(k))) + '</td><td>' + UI.bar(sh[k] * 100, k === 'BACKGROUND' ? '#3d4f5f' : UI.ownerColor(UAE.co(k)), UAE.fmt.pct(sh[k], 2)) + '</td></tr>';
  }).join('') + '</table></div>';
  return h;
};

UI.pdSupplyDemand = function (pid, city) {
  var P = UAE.P[pid], h = '';
  if (P.perCap) {
    h += '<div class="box"><h3>Supply & demand by city (today)</h3><table class="t"><tr><th>City</th><th class="n">Demand/day</th><th class="n">Modelled supply</th><th>Supply · Demand</th><th class="n">Avg price</th><th class="n">Sellers</th></tr>';
    Object.keys(UAE.CITIES).forEach(function (k) {
      var m = UAE.S.mkt && UAE.S.mkt[k + '|' + pid]; if (!m) return;
      var mx = Math.max(m.demand, m.supply, 1);
      h += '<tr class="click" data-act="tab" data-arg="pdCity|' + k + '"><td>' + UAE.CITIES[k].name + '</td><td class="n">' + UAE.fmt.num(m.demand, 0) + '</td><td class="n">' + UAE.fmt.num(m.supply, 0) + '</td>' +
        '<td>' + UI.bar(m.supply / mx * 100, '#ffd24d', 'S') + '<br>' + UI.bar(m.demand / mx * 100, '#ff8a3d', 'D') + '</td><td class="n">' + m.avgP.toFixed(2) + '</td><td class="n">' + m.sellers + '</td></tr>';
    });
    h += '</table><div class="note">Yellow = supply offered by modelled stores (capacity-limited stock), orange = total consumer demand. Background retailers serve the gap at the reference price.</div></div>';
    // demand curve
    h += '<div class="box"><h3>Demand curve · ' + UAE.CITIES[city].name + '</h3><canvas class="chart" id="pdCurve"></canvas><div class="note">Units the whole city would buy per day if the market price level were X (own-price elasticity ' + P.el + ' ' + UI.tag('EST') + '). The dashed reference is AED ' + P.ref + '.</div></div>';
    h += '<div class="box"><h3>History · ' + UAE.CITIES[city].name + '</h3><canvas class="chart" id="pdHist"></canvas><canvas class="chart" id="pdHistP" style="height:130px"></canvas></div>';
    UI.after(function () {
      var pts = [], lab = [];
      for (var x = 0.5; x <= 2.001; x += 0.1) { pts.push(UAE.demandAtPrice(city, pid, P.ref * x)); lab.push(Math.round(P.ref * x)); }
      UI.chart(UI.$('pdCurve'), [{ label: 'Units / day vs price (AED)', data: pts, color: '#ff8a3d' }], { labels: lab, zero: true });
      var m = UAE.S.mkt[city + '|' + pid], hs = m ? m.h : [];
      UI.chart(UI.$('pdHist'), [{ label: 'Demand / day', data: hs.map(function (x) { return x.d; }), color: '#ff8a3d' }, { label: 'Modelled sales / day', data: hs.map(function (x) { return x.s; }), color: '#ffd24d' }],
        { labels: hs.map(function (x) { return UAE.cal.label(x.day).slice(3); }) });
      UI.chart(UI.$('pdHistP'), [{ label: 'Average price AED', data: hs.map(function (x) { return x.p; }), color: '#00f0ff' }], { fmt: function (v) { return v.toFixed(1); } });
    });
  }
  var w = UAE.S.wmkt && UAE.S.wmkt[pid];
  if (w) {
    var bal = w.bal || 1;
    h += '<div class="box"><h3>UAE wholesale market (B2B)</h3><div class="cards">' + UI.card('UAE production / day', UAE.fmt.num(w.made, 0) + ' ' + P.unit) + UI.card('UAE use / day', UAE.fmt.num(w.used, 0) + ' ' + P.unit, 'factories + construction demand') +
      UI.card('Balance', bal > 1.05 ? 'Shortage' : bal < 0.95 ? 'Surplus' : 'Balanced', 'demand / supply ' + bal.toFixed(2), bal > 1.05 ? 'm' : 'a') + UI.card('Wholesale price', 'AED ' + (w.px || 0).toFixed(2), 'export parity ' + w.exp.toFixed(2) + ' · import parity ' + w.imp.toFixed(2)) + '</div>' +
      '<canvas class="chart" id="pdW" style="height:140px"></canvas><div class="note">Local producers in surplus must export (price falls to export parity); in a shortage buyers pay import parity. Factories and mines price their B2B sales off this market.</div></div>';
    UI.after(function () { UI.chart(UI.$('pdW'), [{ label: 'Wholesale price', data: w.h.map(function (x) { return x.px; }), color: '#b8ff2c' }], { fmt: function (v) { return v.toFixed(1); } }); });
  }
  return h || '<div class="note">No data yet.</div>';
};

UI.pdBrand = function (pid, city) {
  var rows = UAE.allCos().map(function (c) {
    var b = c.brandP && c.brandP[pid] && c.brandP[pid][city]; return b ? { c: c, b: b } : null;
  }).filter(Boolean).sort(function (a, b) { return (b.b.aw + b.b.loy) - (a.b.aw + a.b.loy); });
  var h = '<div class="box"><h3>Brand in ' + UAE.CITIES[city].name + '</h3><table class="t"><tr><th>Company</th><th>Awareness</th><th>Loyalty</th><th>Brand rating</th><th class="n">Campaigns</th></tr>';
  rows.forEach(function (x) {
    var n = (x.c.campaigns || []).filter(function (cp) { return cp.pid === pid; }).length;
    h += '<tr class="' + (UAE.isHuman(x.c) ? 'me' : '') + '"><td>' + UI.coLink(x.c) + '</td><td>' + UI.bar(x.b.aw, '#ff8a3d') + '</td><td>' + UI.bar(Math.abs(x.b.loy) * 2.5, x.b.loy >= 0 ? '#b8ff2c' : '#ff4d6d', (x.b.loy >= 0 ? '+' : '') + x.b.loy.toFixed(1)) + '</td><td>' + UI.bar(x.b.aw + x.b.loy, '#00f0ff') + '</td><td class="n">' + n + '</td></tr>';
  });
  return h + '</table>' + (rows.length ? '' : '<div class="note">No company has built a brand for this product here yet.</div>') +
    '<div class="note"><b>Brand awareness</b> comes from advertising (store ad budgets, campaigns, the CMO) and fades ~4% a month without it. <b>Brand loyalty</b> comes from customers\' experience: quality above the city average and fair prices raise it, poor quality makes it negative. Brand rating = awareness + loyalty.</div></div>';
};

UI.pdTech = function (pid) {
  var rows = UAE.allCos().filter(function (c) { return c.tech[pid] != null; }).sort(function (a, b) { return (b.tech[pid] || 0) - (a.tech[pid] || 0); }).slice(0, 30);
  return '<div class="box"><h3>Technology - ' + UAE.P[pid].name + '</h3><table class="t">' + rows.map(function (c) {
    return '<tr class="' + (UAE.isHuman(c) ? 'me' : '') + '"><td>' + UI.coLink(c) + '</td><td>' + UI.bar(c.tech[pid], '#8f7bff', (c.tech[pid] || 0).toFixed(1)) + '</td><td class="muted">' + (UAE.policy(c).sellTech ? 'sells tech' : 'does not sell tech') + '</td></tr>';
  }).join('') + '</table><div class="note">Factory output quality = 75% technology + 25% input quality (+ training). Buy technology in Corporate Details → Technology.</div></div>';
};

UI.pdChain = function (pid) {
  var P = UAE.P[pid];
  var tree = function (id, depth) {
    var X = UAE.P[id], s = '<div style="margin-left:' + depth * 18 + 'px">' + (depth ? '└ ' : '') + '<a href="#" data-act="pdetail" data-arg="' + id + '">' + X.name + '</a> <span class="muted">' + X.kind + ' · ' + X.src + '</span></div>';
    if (X.rec && depth < 4) X.rec.in.forEach(function (x) { s += '<div style="margin-left:' + (depth + 1) * 18 + 'px" class="muted">× ' + x[1] + ' ' + UAE.P[x[0]].unit + '</div>' + tree(x[0], depth + 1); });
    return s;
  };
  var h = '<div class="box"><h3>Production chain</h3>' + tree(pid, 0) + (P.rec ? '<div class="note">Labour + energy AED ' + P.rec.lab + ' per unit · ' + P.rec.cap + ' units/day per factory line.</div>' : '') + '</div>';
  var prods = UAE.allFirms().filter(function (f) { return UAE.FIRM_TYPES[f.type].kind !== 'retail' && f.lines.some(function (l) { return l.pid === pid; }); });
  h += '<div class="box"><h3>Producers & wholesalers</h3><table class="t"><tr><th>Firm</th><th>Company</th><th>City</th><th class="n">Price</th><th class="n">Stock</th><th class="n">Quality</th></tr>' + prods.map(function (f) {
    var l = f.lines.find(function (x) { return x.pid === pid; }), s = f.stock[pid];
    return '<tr class="click" data-act="openFirm" data-arg="' + f.id + '"><td>' + UI.esc(f.name) + '</td><td>' + UI.coLink(UAE.co(f.owner)) + '</td><td>' + UAE.CITIES[f.city].name + '</td><td class="n">' + l.price.toFixed(2) + '</td><td class="n">' + UAE.fmt.num(s ? s.q : 0) + '</td><td class="n">' + (s ? Math.round(s.qual) : '—') + '</td></tr>';
  }).join('') + '</table>' + (prods.length ? '' : '<div class="note">No UAE producer yet - all supply is imported.</div>') + '</div>';
  h += '<div class="box"><h3>Import route</h3><table class="t">' + UAE.GATEWAYS.filter(function (g) { return g.kind === 'sea'; }).map(function (g) {
    return '<tr><td>' + g.name + '</td><td class="n">CIF AED ' + UAE.importBase(pid).toFixed(2) + '</td><td class="n">+ customs ' + (UAE.importBase(pid) * UAE.RULES.customs).toFixed(2) + '</td><td class="muted">then road freight ' + UAE.RULES.freightPerTonKm + ' AED/t·km</td></tr>';
  }).join('') + '</table></div>';
  var deps = UAE.DEPOSITS.filter(function (d) { return d.res === pid; });
  if (deps.length) h += '<div class="box"><h3>Natural resource sites</h3><table class="t"><tr><th>Site</th><th class="n">Reserve left</th><th class="n">Grade</th><th class="n">Cost ×</th><th>Owner</th></tr>' + deps.map(function (d) {
    var st = UAE.depState(d.id), f = st.firm && UAE.firm(st.firm);
    return '<tr class="click" data-act="depInfo" data-arg="' + d.id + '"><td>' + UI.esc(d.name) + '</td><td class="n">' + UAE.fmt.num(st.left) + '</td><td class="n">' + d.grade.toFixed(2) + '</td><td class="n">' + d.cost.toFixed(2) + '</td><td>' + (f ? UI.coLink(UAE.co(f.owner)) : '<span class="t-a">for sale ' + UAE.fmt.aed(d.price) + '</span>') + '</td></tr>';
  }).join('') + '</table></div>';
  return h;
};
UI.act.depInfo = function (id) { UI.flyTo(UAE.DEP[id].c, 12); UI.showDeposits(true); UI.depositInfo(id); };

UI.pdMarketing = function (pid, city) {
  var co = UAE.player(), mine = (co.campaigns || []).filter(function (c) { return c.pid === pid; }), b = UAE.brand(co, pid, city);
  var h = '<div class="cards">' + UI.card('Your awareness in ' + UAE.CITIES[city].name, b.aw.toFixed(1)) + UI.card('Your loyalty', (b.loy >= 0 ? '+' : '') + b.loy.toFixed(1)) +
    UI.card('Brand rating', UAE.brandRating(co, pid, city).toFixed(1), '', 'a') + UI.card('Marketing expertise bonus', '×' + UAE.mktExpMult(co).toFixed(2), 'CMO / CEO expertise') + '</div>';
  h += '<div class="box"><h3>Your campaigns for ' + UAE.P[pid].name + '</h3><table class="t"><tr><th>Media</th><th>Market</th><th class="n">Budget / month</th><th class="n">Spent</th><th>Ends</th><th></th></tr>' + mine.map(function (c) {
    var mf = UAE.firm(c.media);
    return '<tr><td>' + (mf ? UAE.FIRM_TYPES[mf.type].icon + ' ' + UI.esc(mf.name) + ' <span class="muted">' + UI.esc(UAE.co(mf.owner).name) + '</span>' : c.media === 'DIGITAL' ? '🌐 Digital / social (UAE-wide)' : '🪧 Outdoor billboards') + '</td><td>' + (c.city === 'UAE' ? 'All UAE' : UAE.CITIES[c.city].name) + '</td>' +
      '<td class="n">' + UAE.fmt.aed(c.budget) + '</td><td class="n">' + UAE.fmt.aed(c.spent || 0) + '</td><td>' + (c.until != null ? UAE.cal.label(c.until) : 'ongoing') + '</td><td><button class="btn sm m" data-act="adStop" data-arg="' + c.id + '">Stop</button></td></tr>';
  }).join('') + '</table>' + (mine.length ? '' : '<div class="note">No campaign running for this product.</div>') + '</div>';
  var outlets = UAE.mediaOutlets().filter(function (o) { return o.city === city || o.city === 'UAE' || o.id === 'OUTDOOR'; });
  h += '<div class="box"><h3>New advertising campaign</h3><div class="row"><label>Media</label><select class="in" id="adMedia" style="flex:1">' + outlets.map(function (o) {
    return '<option value="' + o.id + '">' + (o.kind === 'tv' ? '📺 ' : o.kind === 'radio' ? '📻 ' : o.kind === 'newspaper' ? '📰 ' : '') + UI.esc(o.name) + ' · reach ' + o.reach + (o.owner ? ' · ' + UI.esc(UAE.co(o.owner).name) : '') + '</option>';
  }).join('') + '</select></div>' +
    '<div class="row"><label>Budget / month</label><input class="in num" id="adBudget" value="250k"><label style="min-width:0">months (0 = ongoing)</label><input class="in num" id="adMonths" value="6" style="width:60px">' +
    '<button class="btn a" data-act="adStart" data-arg="' + pid + '|' + city + '">Launch campaign</button></div>' +
    '<div class="note">TV reach 1.0, radio 0.6, digital 0.7 (UAE-wide, thinner per city), newspapers 0.45, outdoor 0.35. The money goes to the media firm\'s owner - build your own TV station to keep it in the group. ' +
    'Awareness gains shrink as awareness rises and bigger cities need bigger budgets.</div></div>';
  return h;
};
UI.act.adStart = function (arg) {
  var p = arg.split('|'), v = UI.num('adBudget'), mo = Math.max(0, Math.round(UI.num('adMonths') || 0));
  UI.result(UAE.startCampaign(UAE.player(), p[0], UI.$('adMedia').value, p[1], v, mo), 'Campaign launched.');
};
UI.act.adStop = function (id) { UAE.stopCampaign(UAE.player(), id); UI.toast('Campaign stopped.', 'good'); UI.render(); };

/** Marketing overview of the active company (all campaigns + brand table). */
UI.R.marketing = function () {
  var co = UAE.player(), cps = co.campaigns || [];
  var h = '<div class="box"><h3>Active campaigns</h3><table class="t"><tr><th>Product</th><th>Media</th><th>Market</th><th class="n">Budget / month</th><th class="n">Spent</th><th></th></tr>' + cps.map(function (c) {
    var mf = UAE.firm(c.media);
    return '<tr><td><a href="#" data-act="pdetail" data-arg="' + c.pid + '|' + (c.city === 'UAE' ? co.hq : c.city) + '">' + UAE.P[c.pid].name + '</a></td><td>' + (mf ? UI.esc(mf.name) : c.media) + '</td><td>' + (c.city === 'UAE' ? 'All UAE' : UAE.CITIES[c.city].name) + '</td><td class="n">' + UAE.fmt.aed(c.budget) + '</td><td class="n">' + UAE.fmt.aed(c.spent || 0) + '</td><td><button class="btn sm m" data-act="adStop" data-arg="' + c.id + '">Stop</button></td></tr>';
  }).join('') + '</table>' + (cps.length ? '' : '<div class="note">No campaigns. Open a product line in a store and press Advertise, or use Product Details → Marketing.</div>') + '</div>';
  h += '<div class="box"><h3>Product brands by city</h3><table class="t"><tr><th>Product</th><th>City</th><th>Awareness</th><th>Loyalty</th><th>Rating</th></tr>';
  Object.keys(co.brandP || {}).forEach(function (pid) {
    Object.keys(co.brandP[pid]).forEach(function (c) {
      var b = co.brandP[pid][c];
      h += '<tr class="click" data-act="pdetail" data-arg="' + pid + '|' + c + '"><td>' + UAE.P[pid].name + '</td><td>' + UAE.CITIES[c].name + '</td><td>' + UI.bar(b.aw, '#ff8a3d') + '</td><td>' + UI.bar(Math.abs(b.loy) * 2.5, b.loy >= 0 ? '#b8ff2c' : '#ff4d6d', (b.loy >= 0 ? '+' : '') + b.loy.toFixed(1)) + '</td><td>' + UI.bar(b.aw + b.loy, '#00f0ff') + '</td></tr>';
    });
  });
  return h + '</table></div>';
};

/* ============================================================================
 * MARKET OVERVIEW (Product Details -> 🌍 Market overview)
 * Every world market, biggest first: size, growth, a pie of YOUR share next to the biggest rival, your technology vs
 * the frontier and the revenue you are not capturing yet. Sort by size / uncaptured / your share / growth and filter
 * to markets with no or low involvement - the places to venture into next. Data: UAE.wmOverview (engine/worldmkt.js).
 * ==========================================================================*/
UI.pie = function (mine, rival, size) {     // tiny donut: your share (acid), biggest rival (magenta), the rest (dim)
  var s = size || 34, c = s / 2, r = c - 4, C = 2 * Math.PI * r, a = Math.max(0, Math.min(1, mine || 0)), b = Math.max(0, Math.min(1 - a, rival || 0));
  var seg = function (v, off, col) {
    return v > 0 ? '<circle r="' + r + '" cx="' + c + '" cy="' + c + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-dasharray="' + (v * C).toFixed(2) + ' ' + C.toFixed(2) +
      '" stroke-dashoffset="' + (-off * C).toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>' : '';
  };
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" style="vertical-align:middle;flex:0 0 auto"><circle r="' + r + '" cx="' + c + '" cy="' + c + '" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="7"/>' +
    seg(b, a, 'var(--magenta)') + seg(a > 0 ? Math.max(a, 0.012) : 0, 0, 'var(--acid)') + '</svg>';
};
UI.pdMarkets = function () {
  var sort = UI.tabState.pdMkSort || 'size', filt = UI.tabState.pdMkFilter || 'all';
  var rows = UAE.wmOverview(), all = rows.length, cnt = { none: 0, research: 0, low: 0, 'in': 0 };
  rows.forEach(function (r) { cnt[r.status]++; });
  var totW = rows.reduce(function (s, r) { return s + r.W; }, 0), myW = rows.reduce(function (s, r) { return s + r.W * r.my; }, 0);
  if (filt === 'none') rows = rows.filter(function (r) { return r.status === 'none'; });
  else if (filt === 'low') rows = rows.filter(function (r) { return r.status !== 'in'; });
  else if (filt === 'in') rows = rows.filter(function (r) { return r.status === 'in' || r.status === 'low'; });
  var key = { size: function (r) { return -r.W; }, share: function (r) { return r.my; }, gap: function (r) { return -r.gap; }, growth: function (r) { return -r.grow; } }[sort] || function (r) { return -r.W; };
  rows.sort(function (a, b) { return key(a) - key(b) || b.W - a.W; });
  var lbl = { none: '<span class="muted">not in it</span>', research: '<span style="color:var(--gold)">researching</span>', low: '<span style="color:var(--gold)">low (&lt;1%)</span>', 'in': '<span class="pos">selling</span>' };
  var btn = function (k, v, t, cur) { return '<button class="btn sm' + (cur === v ? ' a' : '') + '" data-act="tab" data-arg="' + k + '|' + v + '">' + t + '</button>'; };
  var h = '<div class="cards">' + UI.card('World markets', all, 'together ' + UAE.fmt.aed(totW) + '/yr') +
    UI.card('Your world sales', UAE.fmt.aed(myW / 12) + '/mo', UAE.fmt.pct(totW ? myW / totW : 0, 3) + ' of all world markets') +
    UI.card('Not involved', cnt.none, 'markets you could enter') + UI.card('Low / researching', cnt.low + cnt.research, 'share under 1%') + UI.card('Selling 1%+', cnt['in']) + '</div>';
  h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0"><span class="muted">Sort</span>' +
    btn('pdMkSort', 'size', 'Biggest market', sort) + btn('pdMkSort', 'gap', 'Most uncaptured', sort) + btn('pdMkSort', 'share', 'Lowest share', sort) + btn('pdMkSort', 'growth', 'Fastest growth', sort) +
    '<span class="muted" style="margin-left:10px">Show</span>' +
    btn('pdMkFilter', 'all', 'All', filt) + btn('pdMkFilter', 'none', 'Not involved', filt) + btn('pdMkFilter', 'low', 'No or low involvement', filt) + btn('pdMkFilter', 'in', 'Where I sell', filt) + '</div>';
  h += '<table class="t"><tr><th>#</th><th>Product</th><th class="n">World market /yr</th><th class="n">Growth</th><th>Your share</th><th>Biggest rival</th><th>Your tech</th><th class="n">Uncaptured /mo</th><th>You</th></tr>' +
    rows.map(function (r, i) {
      var t = r.F ? Math.round(r.tech / r.F * 100) : 0;
      return '<tr class="click" data-act="pdMkOpen" data-arg="' + r.pid + '"><td class="muted">' + (i + 1) + '</td><td>' + UI.esc(UAE.shortProduct(r.pid)) + '</td>' +
        '<td class="n">' + UAE.fmt.aed(r.W) + '</td><td class="n">' + (r.grow ? '+' + Math.round(r.grow * 100) + '%' : '–') + '</td>' +
        '<td style="white-space:nowrap">' + UI.pie(r.my, r.top ? r.top.share : 0) + ' <b>' + UAE.fmt.pct(r.my, 2) + '</b>' + (r.rank ? ' <span class="muted">#' + r.rank + '/' + r.n + '</span>' : '') + '</td>' +
        '<td>' + (r.top ? UI.esc(r.top.name) + ' <span class="muted">' + UAE.fmt.pct(r.top.share || 0, 1) + '</span>' : '–') + '</td>' +
        '<td>' + UI.bar(t, t >= 97 ? 'var(--acid)' : t >= 80 ? 'var(--gold)' : 'var(--red)', Math.round(r.tech) + ' / ' + Math.round(r.F)) + '</td>' +
        '<td class="n">' + UAE.fmt.aed(r.gap) + '</td><td>' + lbl[r.status] + '</td></tr>';
    }).join('') + '</table>' +
    '<div class="note">Pie: <b style="color:var(--acid)">your share</b> (all your companies) · <b style="color:var(--magenta)">biggest rival</b> · grey = everyone else. ' +
    'Uncaptured = revenue a month you would add by reaching the biggest rival&#39;s share (capped at the world maximum). Your tech = your best index vs the world leader: far below it you cannot win share abroad, research first. Click a row for that product.</div>';
  return h;
};
UI.act.pdMkOpen = function (pid) { UI.tabState.pdView = 'one'; UI.tabState.pdPid = pid; UI.tabState.pdGroup = UAE.productGroup(UAE.P[pid]); UI.tabState.pdTab = 'tech'; UI.render(); };
