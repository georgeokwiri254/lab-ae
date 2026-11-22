/* ============================================================================
 * UAE CAPITALISM LAB  -  SCREENS FOR THE AI TECH STACK
 *  Data centre (cloud), AI subscriptions on software companies, e-commerce
 *  catalogue + membership on internet companies.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.supplierSelect = function (f, i, pid, dis) {
  var l = f.lines[i], opts = UAE.supplyOptions(f, pid).slice(0, 12);
  return '<select class="in" style="max-width:230px" data-ch="lineSupplier" data-arg="' + f.id + '|' + i + '"' + dis + '>' + opts.map(function (o) {
    return '<option value="' + o.id + '"' + (o.id === l.supplier ? ' selected' : '') + '>' + UI.esc(o.name) + ' · AED ' + UAE.fmt.num(o.unit, 0) + (o.avail !== Infinity ? ' · ' + UAE.fmt.num(o.avail) + ' avail' : '') + '</option>';
  }).join('') + '</select>';
};

/* ----------------------------------------------------------- data centre */
UI.dcBox = function (f, mine) {
  var dis = mine ? '' : ' disabled', rev = (f.rented || 0) - (f.ownUse || 0);
  var h = '<div class="box"><h3>☁ Cloud data centre</h3>' + UI.productHero('server', '<div class="muted" style="margin-top:6px">Each AI server = 8 AI chips + 2 CPUs + 16 RAM modules. Businesses rent them as cloud compute.</div>');
  h += '<div class="cards">' + UI.card('Servers installed', UAE.fmt.num(f.servers || 0), 'target ' + UAE.fmt.num(f.serverTarget || 0) + ' · max ' + UAE.fmt.num(UAE.CLOUD.maxPerLevel * f.size)) +
    UI.card('Utilisation', UAE.fmt.pct(f.util || 0), UAE.fmt.num(f.rented || 0) + ' servers in use', (f.util || 0) > 0.85 ? 'a' : '') +
    UI.card('Rented to customers', UAE.fmt.num(Math.max(0, rev)), 'servers · AED ' + UAE.fmt.num(f.cloudPrice || UAE.CLOUD.pricePerServer) + '/server/month') +
    UI.card('Your own AI use', UAE.fmt.num(f.ownUse || 0), 'servers for your AI subscribers') +
    UI.card('Server quality', Math.round(f.serverQual || 0)) + UI.card('Servers in stock', UAE.fmt.num(UAE.stockQ(f, 'server'))) + '</div>';
  h += '<div class="row"><label>Cloud price</label><input class="in num" id="dcPrice" value="' + Math.round(f.cloudPrice || UAE.CLOUD.pricePerServer) + '"' + dis + '><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|cloudPrice|dcPrice"' + dis + '>Set</button><span class="muted">AED per server per month · market ~' + UAE.fmt.num(UAE.CLOUD.pricePerServer) + '</span></div>' +
    '<div class="row"><label>Server target</label><input class="in num" id="dcTarget" value="' + (f.serverTarget || 0) + '"' + dis + '><button class="btn sm" data-act="dcTarget" data-arg="' + f.id + '"' + dis + '>Set</button>' +
    '<label style="min-width:0;margin-left:12px"><input type="checkbox" data-ch="dcAuto" data-arg="' + f.id + '"' + (f.autoGrow !== false ? ' checked' : '') + dis + '> Add racks automatically when busy (&gt;85%)</label></div>' +
    (f.lines[0] ? '<div class="row"><label>Buy servers from</label>' + UI.supplierSelect(f, 0, 'server', dis) + '</div>' : '');
  return h + '<div class="note">Cloud demand in the UAE grows about 40% a year. You compete with global clouds on price, capacity and server quality. Your own AI Assistant / Frontier AI subscribers run on your cloud first (much cheaper than renting). Each rack uses ~10 kW of power.</div></div>';
};
UI.act.dcTarget = function (id) { var f = UAE.firm(id), v = Math.round(UI.num('dcTarget')); if (v >= 0) { f.serverTarget = Math.min(v, UAE.CLOUD.maxPerLevel * f.size); UI.toast('Server target ' + f.serverTarget + (v > f.serverTarget ? ' (max for this size – expand the building for more)' : '') + '.', 'good'); UI.render(); } };
UI.act.dcAuto = function (id, el) { UAE.firm(id).autoGrow = el.checked; };

/* -------------------------------------------------------- AI subscriptions */
UI.subsBox = function (f, mine) {
  var pid = UAE.swPid(f), C = UAE.SUBS[pid]; if (!C) return '';
  var dis = mine ? '' : ' disabled';
  return '<div class="box"><h3>🔁 Subscription plan</h3><div class="cards">' + UI.card('Subscribers', UAE.fmt.num(f.subs || 0), 'heading for ' + UAE.fmt.num(f.subTarget || 0), 'a') +
    UI.card('Global market', UAE.fmt.num(f.subMarket || 0), 'potential subscribers worldwide · levels off at ' + Math.round((C.max || 0) * 100) + '% of the world') +
    UI.card('Monthly revenue', UAE.fmt.aed((f.subs || 0) * (f.subPrice || C.ref)), 'average AED ' + Math.round(f.subPrice || C.ref) + ' per subscriber') +
    UI.card('Runs on your cloud', UAE.fmt.pct(f.ownCompute || 0, 0), (f.ownCompute || 0) < 1 ? 'rest rented – build data centres' : 'all compute in-house') + '</div>' +
    UI.subPlansTable(f, pid, mine) +
    '<div class="note">' + (pid === 'llm' ? 'Frontier AI Model: professionals and teams pay monthly; businesses also buy API usage (tokens) as enterprise licences. ' : 'AI Assistant: consumers pay monthly. ') +
    'Better quality (research the next model) and a lower price win subscribers from global AI labs. Every subscriber needs compute: about AED ' + UAE.CLOUD.computePerSubOwn + '/month on your own data centres, AED ' + UAE.CLOUD.computePerSub + ' if rented. Research runs faster when you own cloud capacity.</div></div>';
};

/* ------------------------------------------------------------ e-commerce */
UI.ecomBox = function (f, mine) {
  if (f.model !== 'ecommerce') return '';
  var dis = mine ? '' : ' disabled';
  var h = '<div class="box"><h3>🛒 Online store catalogue (' + f.lines.length + ' / ' + UAE.FIRM_TYPES.internet.lines + ')</h3><table class="t"><tr><th>Product</th><th>Supplier</th><th class="n">Price</th><th class="n">Stock</th><th class="n">Sold/day</th><th class="n">Demand</th><th></th></tr>';
  f.lines.forEach(function (l, i) {
    var P = UAE.P[l.pid], s = f.stock[l.pid];
    h += '<tr><td><span style="display:inline-flex;gap:8px;align-items:center">' + UI.productImg(l.pid, 48) + '<b>' + UI.esc(P.name) + '</b></span></td><td>' + UI.supplierSelect(f, i, l.pid, dis) + '</td>' +
      '<td class="n"><input class="in num" style="width:84px" value="' + l.price.toFixed(2) + '" data-ch="linePrice" data-arg="' + f.id + '|' + i + '"' + dis + '></td><td class="n">' + UAE.fmt.num(s ? s.q : 0) + '</td>' +
      '<td class="n">' + UAE.fmt.num(l.sold || 0, 1) + '</td><td class="n">' + UAE.fmt.num(l.demand || 0, 1) + '</td><td>' + (mine ? '<button class="btn sm m" data-act="lineDel" data-arg="' + f.id + '|' + i + '">✕</button>' : '') + '</td></tr>';
  });
  h += '</table>';
  if (mine && f.lines.length < UAE.FIRM_TYPES.internet.lines) {
    var prods = UAE.PRODUCTS.filter(function (p) { return p.perCap && (p.kind === 'consumer' || p.kind === 'software' || p.kind === 'fuel'); });
    h += '<div class="row"><select class="in" id="addPid">' + UI.productOptions(prods) + '</select><button class="btn a sm" data-act="lineAdd" data-arg="' + f.id + '">+ Add to catalogue</button>' +
      '<button class="btn sm" data-act="ecomFill" data-arg="' + f.id + '">Auto-fill with my products</button></div>';
  }
  h += '<h4>Membership (Prime-style subscription)</h4><div class="cards">' + UI.card('Members', UAE.fmt.num(f.members || 0), 'of ' + UAE.fmt.num(f.users || 0) + ' shoppers', 'a') +
    UI.card('Membership revenue', UAE.fmt.aed((f.members || 0) * (f.memberFee || UAE.ECOM.memberFee)) + '/mo') + UI.card('Member boost', '+' + Math.round(UAE.ECOM.memberBoost * 100) + '% sales', 'free delivery & deals') + '</div>' +
    '<div class="row"><label>Membership fee</label><input class="in num" id="memFee" value="' + (f.memberFee || UAE.ECOM.memberFee) + '"' + dis + '><button class="btn sm" data-act="fSet" data-arg="' + f.id + '|memberFee|memFee"' + dis + '>Set</button><span class="muted">AED / month · typical ' + UAE.ECOM.memberFee + '</span></div>';
  return h + '<div class="note">Your online store sells to the whole UAE: your own products (pick your factory or software company as supplier – or press "Supply my stores" on the factory), other companies\' products, or imports. About ' + Math.round(UAE.ECOM.onlineShare * 100) + '% of all shopping happens online, growing each year. Delivery costs ~AED ' + UAE.ECOM.deliveryPerUnit + ' per item (40% less with your own logistics company).</div></div>';
};
UI.act.ecomFill = function (id) { var f = UAE.firm(id), n0 = f.lines.length; UAE.ecomStock(UAE.co(f.owner), f); UI.toast((f.lines.length - n0) + ' products added.', 'good'); UI.render(); };

/* Subscription plans: price per plan, share of subscribers, revenue */
UI.subPlansTable = function (f, pid, mine) {
  var pl = UAE.subPlans(f, pid); if (!pl) return '';
  var A = UAE.fmt.aed, N = UAE.fmt.num, dis = mine ? '' : ' disabled', subs = f.subs || 0, q = f.quality || 40;
  return '<h4>Subscription plans</h4><table class="t"><tr><th>Plan</th><th class="n">Price / month</th><th class="n">Typical</th><th class="n">Needs quality</th><th class="n">Share</th><th class="n">Subscribers</th><th class="n">Revenue / month</th></tr>' +
    pl.tiers.map(function (t) {
      var sh = pl.mix[t.id], ok = q >= t.q;
      return '<tr><td><b>' + t.name + '</b></td><td class="n"><input class="in num" id="tier_' + t.id + '" style="width:76px" value="' + Math.round(f.tiers[t.id]) + '"' + dis + '>' +
        (mine ? ' <button class="btn sm" data-act="subTier" data-arg="' + f.id + '|' + t.id + '">Set</button>' : '') + '</td><td class="n">AED ' + t.ref + '</td>' +
        '<td class="n ' + (ok ? 'pos' : 'neg') + '">' + (t.q || '—') + (ok ? '' : ' (yours ' + Math.round(q) + ')') + '</td><td class="n">' + (sh * 100).toFixed(1) + '%</td><td class="n">' + N(subs * sh) + '</td><td class="n">' + A(subs * sh * f.tiers[t.id]) + '</td></tr>';
    }).join('') + '</table><div class="note">Subscribers choose a plan by price: below the typical price a plan draws more people, above it fewer. Premium plans sell little until your model reaches the quality they need – research the next model. The average price across plans decides how many subscribers you win from the global AI labs.</div>';
};
UI.act.subTier = function (arg) {
  var p = arg.split('|'), f = UAE.firm(p[0]), v = UI.num('tier_' + p[1]);
  if (!f || !(v > 0)) { UI.toast('Enter a price above 0.', 'bad'); return; }
  f.tiers = f.tiers || {}; f.tiers[p[1]] = v; var pl = UAE.subPlans(f, UAE.swPid(f)); f.subPrice = pl.avgPrice;
  UI.toast('Price set. Average across plans: AED ' + Math.round(pl.avgPrice) + '.', 'good'); UI.render();
};
