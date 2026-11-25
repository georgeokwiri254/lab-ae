/* ============================================================================
 * UAE CAPITALISM LAB  -  FACTORY, SOFTWARE COMPANY & R&D PANELS
 *  Factory:   pick a product (grouped by class, recipe + cost preview), then for
 *             every raw material choose the supplier (own farm/mine/factory,
 *             another company, or import), see stock, fill rate and margin.
 *  Software:  pick the title, set the online price, see online sales, licence
 *             stock and research the next version.
 *  R&D:       research any product (incl. futuristic goods and software) and
 *             launch "next model" projects.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

/** <option>s grouped by product class. */
UI.productOptions = function (list, sel) {
  var groups = {}, order = [];
  list.forEach(function (p) { var k = UAE.productGroup ? (UAE.PRODUCT_GROUPS.find(function (x) { return x[0] === UAE.productGroup(p); }) || [0, p.cls])[1] : p.cls; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(p); });
  if (UAE.PRODUCT_GROUPS) order.sort(function (a, b) { var f = function (x) { return UAE.PRODUCT_GROUPS.findIndex(function (g) { return g[1] === x; }); }; return f(a) - f(b); });
  return order.map(function (c) {
    return '<optgroup label="' + UI.esc(c) + '">' + groups[c].map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + UI.esc(p.name) + (p.grow >= 0.15 ? ' 🔥' : '') + '</option>';
    }).join('') + '</optgroup>';
  }).join('');
};
UI.recipeText = function (pid) {
  var rec = UAE.P[pid].rec; if (!rec) return '';
  return rec.in.map(function (x) { return UAE.fmt.num(x[1], x[1] < 1 ? 4 : 1) + ' ' + UAE.P[x[0]].unit + ' ' + UAE.P[x[0]].name; }).join(' + ');
};

/* ------------------------------------------------------------- factory */
UI.factoryBox = function (f, mine) {
  var dis = mine ? '' : ' disabled', co = UAE.co(f.owner);
  var h = '<div class="box"><h3>Manufacturing (' + f.lines.length + ' / ' + UAE.FIRM_TYPES[f.type].lines + ' production lines)</h3>';
  if (!f.lines.length) h += '<div class="note">This factory makes nothing yet. Choose a product below: the recipe shows the raw materials it needs.</div>';
  f.lines.forEach(function (l, i) {
    var P = UAE.P[l.pid], s = f.stock[l.pid], rec = P.rec, q = UAE.recipeQuote(f, l.pid);
    var rate = l.rate == null ? 1 : l.rate;
    h += '<div class="box" style="margin:8px 0;border-color:rgba(0,240,255,.25)"><div class="row">' + UI.productImg(l.pid, 96) + '<b style="font-size:1.05em">' + P.name + '</b>' +
      ' <span class="pill">' + UI.esc(P.cls) + '</span> <span class="pill">' + UI.esc(UAE.modelName(co, l.pid)) + '</span>' +
      ' <span class="muted">tech ' + (co.tech[l.pid] || 50).toFixed(0) + '</span></div>';
    h += '<div class="cards">' + UI.card('Output / day', UAE.fmt.num(q.perDay * rate, 0) + ' ' + P.unit, 'at ' + Math.round(rate * 100) + '% rate') +
      UI.card('Made this month', UAE.fmt.num(l.made || 0)) + UI.card('Sold this month', UAE.fmt.num(l.sold || 0), 'exported ' + UAE.fmt.num(l.exported || 0)) +
      UI.card('Stock', UAE.fmt.num(s ? s.q : 0)) + UI.card('Unit cost', s ? 'AED ' + s.cost.toFixed(2) : 'est. AED ' + q.unit.toFixed(2)) +
      UI.card('Market price', 'AED ' + q.market.toFixed(2), 'est. margin ' + Math.round(q.margin * 100) + '%', q.margin >= 0 ? 'a' : 'm') +
      UI.card('Quality', s ? Math.round(s.qual) : '—') + '</div>';
    h += '<div class="row"><label>Production rate</label><input type="range" min="0" max="100" value="' + Math.round(rate * 100) + '" data-ch="lineRate" data-arg="' + f.id + '|' + i + '"' + dis + ' style="width:140px"> ' + Math.round(rate * 100) + '%' +
      '<label style="min-width:0;margin-left:14px">Sell price</label><input class="in num" style="width:96px" value="' + (l.price || 0).toFixed(2) + '" data-ch="linePriceP" data-arg="' + f.id + '|' + i + '"' + dis + '>' +
      (l.priceSet && mine ? ' <a href="#" data-act="autoPriceP" data-arg="' + f.id + '|' + i + '">auto price</a>' : '') + '</div>';
    // raw materials / inputs with supplier choice
    h += '<h4>Raw materials &amp; components (purchasing)</h4><table class="t"><tr><th>Input</th><th class="n">Per unit</th><th class="n">Needed / day</th><th class="n">In stock</th><th>Supplier</th><th class="n">Landed cost</th><th class="n">From firms</th></tr>';
    rec.in.forEach(function (x, j) {
      var ip = UAE.P[x[0]], cur = (l.inSup && l.inSup[x[0]]) || '', opts = UAE.supplyOptions(f, x[0]).slice(0, 14);
      var selOpt = '<option value=""' + (!cur ? ' selected' : '') + '>Auto: own firms → other firms → import</option>' + opts.map(function (o) {
        return '<option value="' + o.id + '"' + (o.id === cur ? ' selected' : '') + '>' + UI.esc(o.name) + ' · AED ' + o.unit.toFixed(2) + ' · Q' + Math.round(o.quality) + (o.avail !== Infinity ? ' · ' + UAE.fmt.num(o.avail) + ' avail' : '') + '</option>';
      }).join('');
      var met = l.inMet && l.inMet[x[0]] != null ? l.inMet[x[0]] : null;
      h += '<tr><td><b>' + ip.name + '</b><br><span class="muted">' + UI.esc(ip.cls) + ' · ' + ip.kind + '</span></td><td class="n">' + UAE.fmt.num(x[1], x[1] < 1 ? 5 : 2) + ' ' + ip.unit + '</td>' +
        '<td class="n">' + UAE.fmt.num(x[1] * q.perDay * rate, 1) + '</td><td class="n">' + UAE.fmt.num(UAE.stockQ(f, x[0]), 1) + '</td>' +
        '<td><select class="in" style="max-width:230px" data-ch="inSup" data-arg="' + f.id + '|' + i + '|' + x[0] + '"' + dis + '>' + selOpt + '</select></td>' +
        '<td class="n">AED ' + q.ins[j].unit.toFixed(2) + '</td><td class="n">' + (cur === 'IMPORT' ? 'import' : met == null ? '—' : Math.round(met * 100) + '%') + '</td></tr>';
    });
    h += '<tr><td colspan="5" class="muted">Labour + energy per unit</td><td class="n">AED ' + q.lab.toFixed(2) + '</td><td></td></tr></table>';
    if (mine) h += '<div class="row"><button class="btn sm a" data-act="linkBuyers" data-arg="' + f.id + '|' + l.pid + '">Supply my stores &amp; factories</button>' +
      '<button class="btn sm" data-act="sellIn" data-arg="' + f.id + '|' + l.pid + '">Open a store selling it</button>' +
      '<button class="btn sm m" data-act="lineDel" data-arg="' + f.id + '|' + i + '">Remove line</button></div>';
    h += '</div>';
  });
  if (mine && f.lines.length < UAE.FIRM_TYPES[f.type].lines) {
    var makeable = UAE.PRODUCTS.filter(function (p) { return p.rec && !f.lines.some(function (l) { return l.pid === p.id; }); });
    var pick = (UI._facPick && UI._facPick[f.id]) || makeable[0].id;
    if (!UAE.P[pick] || !UAE.P[pick].rec) pick = makeable[0].id;
    var pq = UAE.recipeQuote(f, pick), pp = UAE.P[pick];
    h += '<h4>Add a product to manufacture</h4>' + UI.productHero(pick, '<div class="muted" style="margin-top:6px">Made from: ' + UI.recipeText(pick) + '</div>') + '<div class="row"><select class="in" id="addPid" data-ch="facPick" data-arg="' + f.id + '">' + UI.productOptions(makeable, pick) + '</select>' +
      '<button class="btn a" data-act="lineAdd" data-arg="' + f.id + '">+ Start manufacturing</button></div>' +
      '<table class="t"><tr><th>Raw material / component</th><th class="n">Per unit</th><th>Cheapest source</th><th class="n">Cost</th></tr>' +
      pq.ins.map(function (x) { return '<tr><td>' + UAE.P[x.pid].name + '</td><td class="n">' + UAE.fmt.num(x.qty, x.qty < 1 ? 5 : 2) + ' ' + UAE.P[x.pid].unit + '</td><td>' + UI.esc(x.src) + '</td><td class="n">AED ' + x.cost.toFixed(2) + '</td></tr>'; }).join('') +
      '<tr><td>Labour + energy</td><td></td><td></td><td class="n">AED ' + pq.lab.toFixed(2) + '</td></tr>' +
      '<tr><td><b>Estimated unit cost</b></td><td></td><td>market price AED ' + pq.market.toFixed(2) + (pp.ref ? ' · shelf price AED ' + pp.ref : '') + '</td><td class="n"><b>AED ' + pq.unit.toFixed(2) + '</b> <span class="' + (pq.margin >= 0 ? 'pos' : 'neg') + '">' + Math.round(pq.margin * 100) + '%</span></td></tr></table>' +
      (pp.grow ? '<div class="note">🔥 Demand for ' + pp.name + ' grows about ' + Math.round(pp.grow * 100) + '% a year.</div>' : '');
  }
  return h + '<div class="note">Inputs are kept at 3 days of production. "Auto" buys from your own firms first, then other companies, then imports via the nearest port. ' +
    'Choosing a firm makes it the first source; any shortfall is still imported so the line keeps running. Each extra line shares the factory\'s capacity.</div></div>';
};
UI.act.facPick = function (id, el) { UI._facPick = UI._facPick || {}; UI._facPick[id] = el.value; UI.render(); };
UI.act.inSup = function (arg, el) {
  var p = arg.split('|'), l = UAE.firm(p[0]).lines[+p[1]]; l.inSup = l.inSup || {};
  if (el.value) l.inSup[p[2]] = el.value; else delete l.inSup[p[2]];
  UI.toast('Supplier for ' + UAE.P[p[2]].name + ' set.', 'good'); UI.render();
};
UI.act.autoPriceP = function (arg) { var p = arg.split('|'); UAE.firm(p[0]).lines[+p[1]].priceSet = false; UI.render(); };
UI.act.linkBuyers = function (arg) {
  var p = arg.split('|'), n = UAE.linkOwnBuyers(UAE.firm(p[0]), p[1]);
  UI.toast(n ? n + ' of your store / factory lines now buy ' + UAE.P[p[1]].name + ' here.' : 'None of your stores or factories use ' + UAE.P[p[1]].name + ' yet.', n ? 'good' : 'bad'); UI.render();
};
UI.act.sellIn = function (arg) {
  var p = arg.split('|'); UI.toast('Build a Retail Store (B), then add ' + UAE.P[p[1]].name + ' and press "Supply my stores" here.', 'good');
  if (UI.act.startBuild) UI.act.startBuild('retail');
};

/* ------------------------------------------------------- research box */
UI.researchBox = function (f, pid, mine) {
  var co = UAE.co(f.owner), q = UAE.researchQuote(f, pid), pr = f.project;
  var active = {};
  UAE.allFirms().forEach(function (g) { if (g.owner !== co.id && (g.target === pid || g.lines.some(function (l) { return l.pid === pid; }))) active[g.owner] = 1; });
  var leader = UAE.allCos().filter(function (c) { return active[c.id]; }).sort(function (a, b) { return (b.tech[pid] || 0) - (a.tech[pid] || 0); })[0];
  var h = '<div class="cards">' + UI.card('Current model', UI.esc(UAE.modelName(co, pid))) + UI.card('Technology', (co.tech[pid] || 40).toFixed(1), 'no cap - every model adds more', 'a') +
    UI.card('Best rival', leader ? (leader.tech[pid] || 0).toFixed(1) : '—', leader ? UI.esc(leader.name) : 'no rival makes it yet') + '</div>';
  if (pr) {
    h += '<div class="row"><b>Researching ' + UI.esc(UAE.modelName(co, pid).replace(/(Gen |v)\d+/, function (m) { return m.replace(/\d+/, pr.gen); })) + '</b>' + (pr.paused ? ' <span class="t-m">⏸ paused: not enough cash</span>' : '') + '</div>' +
      '<div>' + UI.bar(pr.done / pr.days * 100, '#b98cff', pr.done + ' / ' + pr.days + ' days · spent ' + UAE.fmt.aed(pr.spent) + ' of ' + UAE.fmt.aed(pr.cost)) + '</div>' +
      (mine ? '<div class="row"><button class="btn sm m" data-act="resCancel" data-arg="' + f.id + '">Cancel project</button></div>' : '');
  } else if (UAE.canResearch ? !UAE.canResearch(co, pid) : (co.tech[pid] || 0) >= 99.5) {
    h += '<div class="row"><b class="t-a">✔ Maximum technology reached</b><span class="muted">this title / product cannot be improved further, so no research money is spent</span></div>';
  } else if (mine) {
    var gainTxt = 'technology +' + q.gain.toFixed(1) + (q.gGain != null ? ' · world tech index +' + q.gGain.toFixed(1) + ' (now ' + q.gNow.toFixed(1) + ' vs leader ' + q.frontier.toFixed(1) + ')' : '');
    h += '<div class="row"><button class="btn a" data-act="resStart" data-arg="' + f.id + '|' + pid + '">🔬 Research next model (' + (UAE.P[pid].kind === 'software' ? 'v' + q.next + '.0' : 'Gen ' + q.next) + ')</button>' +
      '<span class="muted">' + UAE.fmt.aed(q.cost) + ' over ' + q.days + ' days · ' + gainTxt + '</span></div>';
  }
  if (mine) h += '<div class="row"><label style="min-width:0"><input type="checkbox" data-ch="autoRes" data-arg="' + f.id + '"' + (UAE.autoResearchOn(f) ? ' checked' : '') + '> 🔁 Auto-research next ' + (UAE.P[pid].kind === 'software' ? 'version' : 'model') + '</label>' +
    '<span class="muted">starts the next project automatically whenever none is running (needs half the project cost in cash)</span></div>';
  return h;
};
UI.act.autoRes = function (id, el) { var f = UAE.firm(id); f.autoResearch = el.checked; UI.toast(el.checked ? 'Auto-research on: the next version starts automatically.' : 'Auto-research off.', 'good'); UI.render(); };
UI.act.resStart = function (arg) { var p = arg.split('|'), r = UAE.startResearch(UAE.firm(p[0]), p[1]); UI.result(r, 'Research project started.'); UI.render(); };
UI.act.resCancel = function (id) { UAE.cancelResearch(UAE.firm(id)); UI.toast('Project cancelled (money spent is not refunded).', 'bad'); UI.render(); };

/* ------------------------------------------------------ software company */
UI.softwareBox = function (f, mine) {
  var dis = mine ? '' : ' disabled', pid = UAE.swPid(f), P = UAE.P[pid], co = UAE.co(f.owner), l = f.lines[0], s = f.stock[pid];
  var titles = UAE.PRODUCTS.filter(function (p) { return p.kind === 'software'; });
  var h = '<div class="box"><h3>💾 Software development</h3>' + UI.productHero(pid) + '<div class="row"><label>Software title</label><select class="in" data-ch="fSw" data-arg="' + f.id + '"' + dis + '>' +
    titles.map(function (p) { return '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + p.name + (p.grow >= 0.15 ? ' 🔥' : '') + ' · AED ' + p.ref + '</option>'; }).join('') + '</select>' +
    '<span class="muted">changing title keeps your technology for each title</span></div>';
  h += UI.researchBox(f, pid, mine);
  var subT = UAE.SUBS && UAE.SUBS[pid], wmT = !subT && UAE.WM && UAE.WM[pid], salesCards;
  if (subT) {           // AI subscriptions: income = subscribers x plan price (aistack.js subsDay), not online licence sales
    var myS = 0, mk = f.subMarket || 0; UAE.firmsOf(co.id).forEach(function (g) { if (g.type === 'software' && g.status === 'open' && UAE.swPid(g) === pid) myS += g.subs || 0; });
    salesCards = UI.card('Subscribers (this studio)', UAE.fmt.num(f.subs || 0, 0), 'heading for ' + UAE.fmt.num(f.subTarget || 0, 0)) +
      UI.card('Subscription revenue / day', UAE.fmt.aed((f.subs || 0) * (f.subPrice || P.ref) / 30), 'avg AED ' + Math.round(f.subPrice || P.ref) + ' / subscriber / month') +
      UI.card('World share (' + UI.esc(co.name.split(' ')[0]) + ')', mk ? UAE.fmt.pct(myS / mk, 1) : '—', UAE.fmt.num(myS, 0) + ' of ' + UAE.fmt.num(mk, 0) + ' subscribers worldwide');
  } else if (wmT && (f.worldRev || f.worldUnits)) {
    salesCards = UI.card('World sales / day', UAE.fmt.aed(f.worldRev || 0), UAE.fmt.num(f.worldUnits || 0, 0) + ' licences abroad (tech index × brand × reach)') +
      UI.card('Online sales / day', UAE.fmt.num(f.online || 0, 0), 'UAE online · share ' + UAE.fmt.pct(f.onlineShare || 0, 1));
  } else salesCards = UI.card('Online sales / day', UAE.fmt.num(f.online || 0, 0), 'demand ' + UAE.fmt.num(f.onlineDemand || 0, 0) + ' · capacity ' + UAE.fmt.num(f.onlineCap || 0, 0)) +
    UI.card('Online market share', UAE.fmt.pct(f.onlineShare || 0, 1), 'vs global vendors');
  h += '<h4>Sales</h4><div class="cards">' + salesCards + UI.card('Quality', Math.round(f.quality || 0)) +
    UI.card('Licence stock', UAE.fmt.num(s ? s.q : 0), 'for stores &amp; factories') + UI.card('B2B / store sales this month', UAE.fmt.num(l.sold || 0)) +
    UI.card('Demand growth', '+' + Math.round((P.grow || 0) * 100) + '% / yr', P.b2b ? 'plus enterprise licences' : '') + '</div>';
  h += '<div class="row"><label>Online price (incl. VAT)</label><input class="in num" id="swPrice" value="' + Math.round(f.retailPrice || P.ref) + '"' + dis + '><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|retailPrice|swPrice"' + dis + '>Set</button><span class="muted">reference AED ' + P.ref + '</span></div>' +
    '<div class="row"><label>Wholesale licence price</label><input class="in num" style="width:96px" value="' + (l.price || 0).toFixed(2) + '" data-ch="linePriceP" data-arg="' + f.id + '|0"' + dis + '><span class="muted">what stores, device factories and businesses pay · import AED ' + P.imp + '</span></div>' +
    (mine ? '<div class="row"><button class="btn sm a" data-act="linkBuyers" data-arg="' + f.id + '|' + pid + '">Supply my stores &amp; factories</button></div>' : '') +
    '<div class="note">Licences cost about ' + Math.round(UAE.SW_UNIT_COST * 100) + '% of the import price to deliver, so margins are high. ' +
    (pid === 'os' ? 'Every smartphone, laptop, AR / VR headset, robot and electric car needs an Operating System licence: factories buy it from you if you are their supplier. ' : '') +
    (pid === 'ai' ? 'AI Assistant licences are built into robots and self-driving cars, and businesses buy enterprise seats. ' : '') +
    'Online sales compete on quality (technology), price and brand with global vendors.</div></div>';
  return h;
};

/* ------------------------------------------------------------- R&D centre */
UI.rndBox = function (f, mine) {
  var dis = mine ? '' : ' disabled', co = UAE.co(f.owner), pid = f.target;
  var list = UAE.PRODUCTS.filter(function (p) { return p.kind !== 'fuel'; });
  var h = '<div class="box"><h3>🧪 Research &amp; Development</h3>' + UI.productHero(pid) + '<div class="row"><label>Research product</label><select class="in" data-ch="fTarget" data-arg="' + f.id + '"' + dis + (f.project ? ' disabled' : '') + '>' +
    UI.productOptions(list, pid) + '</select>' + (f.project ? '<span class="muted">locked while a project runs</span>' : '') + '</div>';
  h += UI.researchBox(f, pid, mine);
  var mineTech = UAE.PRODUCTS.filter(function (p) { return co.gen && co.gen[p.id] > 1; });
  if (mineTech.length) h += '<h4>Your models</h4><table class="t"><tr><th>Model</th><th class="n">Technology</th></tr>' + mineTech.map(function (p) { return '<tr><td>' + UI.esc(UAE.modelName(co, p.id)) + '</td><td class="n">' + (co.tech[p.id] || 0).toFixed(1) + '</td></tr>'; }).join('') + '</table>';
  return h + '<div class="note">The centre also raises technology slowly every day. Higher technology = higher quality for everything you make or publish of this product. Software titles can also be researched at the Software Company that publishes them.</div></div>';
};
