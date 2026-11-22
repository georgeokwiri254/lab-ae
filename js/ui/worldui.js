/* ============================================================================
 * UAE CAPITALISM LAB  -  UI: GLOBAL TECH RACE (Economy -> 🚀 Global tech race) + world standing on firm pages
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.WM_GROUPS = [
  ['💾 Software', ['os', 'office', 'security', 'game', 'chipip', 'design', 'video', 'audio', 'utility']],
  ['🧠 AI', ['ai', 'llm']],
  ['🔬 Semiconductors & AI hardware', ['aichip', 'chips', 'cpu', 'ram', 'gpu', 'server', 'wafer']],
  ['🤖 Devices, robots & EVs', ['phone', 'laptop', 'ev', 'battery', 'robot', 'drone', 'vr', 'arglasses', 'sensor', 'motor']],
  ['💊 Pharma', ['medicine', 'generic', 'rxdrug', 'biologic']],
  ['🛒 E-commerce', ['ecom']]
];
UI.wmIdx = function (v) { return v == null ? '—' : v.toFixed(1); };

/* Economy -> Global tech race */
UI.econ_race = function () {
  var A = UAE.fmt.aed, S = UAE.S, tot = 0, lead = 0, top3 = 0, n = 0;
  var rows = '';
  UI.WM_GROUPS.forEach(function (g) {
    rows += '<tr class="h"><td colspan="9">' + g[0] + '</td></tr>';
    g[1].forEach(function (pid) {
      var M = UAE.WM[pid], P = UAE.P[pid]; if (!M || !P) return;
      var R = UAE.wmRanking(pid), top = R[0], me = R.find(function (r) { return r.human; }), st = S.world2 && S.world2[pid];
      var mine = 0; if (st) Object.keys(st.cos).forEach(function (id) { if (UAE.isHuman(UAE.co(id))) mine += st.cos[id].rev; });
      tot += mine * 30; if (me) { n++; if (me.rank === 1) lead++; if (me.rank <= 3) top3++; }
      var gap = me ? me.idx - top.idx : null;
      rows += '<tr class="click" data-act="worldProd" data-arg="' + pid + '"><td>' + UI.esc(P.name) + '</td>' +
        '<td class="n">' + (M.subs ? 'subscriptions' : A(UAE.wmSize(pid))) + '</td>' +
        '<td>' + top.flag + ' ' + UI.esc(top.name) + '</td><td class="n">' + UI.wmIdx(top.idx) + '</td>' +
        '<td>' + (me ? UI.esc(me.name) : '<span class="muted">not in this market</span>') + '</td><td class="n">' + (me ? UI.wmIdx(me.idx) : '—') + '</td>' +
        '<td class="n ' + (gap == null ? '' : gap >= 0 ? 'pos' : 'neg') + '">' + (gap == null ? '—' : (gap >= 0 ? '+' : '') + gap.toFixed(1)) + '</td>' +
        '<td class="n">' + (me ? '<b>#' + me.rank + '</b> / ' + R.length : '—') + '</td><td class="n">' + (mine ? A(mine * 30) : '—') + '</td></tr>';
    });
  });
  var h = '<div class="cards">' + UI.card('Your exports to the world', A(tot) + '/mo', 'software, chips, devices, pharma, e-commerce') +
    UI.card('World #1 in', lead + ' of ' + n, 'products you compete in') + UI.card('Top 3 in', top3 + ' of ' + n) +
    UI.card('World tech index', '100 = best in 2026', 'leaders improve every year') + '</div>';
  h += '<div class="box"><h3>🚀 Global tech race · your best company vs the world leaders</h3><table class="t nosort"><tr><th>Product</th><th class="n">World market / yr</th><th>World leader</th><th class="n">Index</th><th>Your best company</th><th class="n">Index</th><th class="n">Gap</th><th class="n">World rank</th><th class="n">Your exports / mo</th></tr>' + rows + '</table>' +
    '<div class="note"><b>How to win:</b> research raises your <b>world tech index</b> (R&amp;D centres and software companies, ~3 points per project at the top, much more when you are far behind). ' +
    'The world leaders gain 1-4 points every year, so standing still means falling behind. Your share of world demand = <b>global reach × brand × e^((your index − leader) / 10)</b>, and a higher index also lets you charge more (up to 2.2× the world price). ' +
    'Global reach is your distribution &amp; customer base abroad: it grows each month you sell a credible product abroad. Chips, devices and drugs ship from factory stock, so you need factory capacity; software and e-commerce scale digitally. Click a product for details.</div></div>';
  return h;
};

/* Product detail: everyone in the world market */
UI.act.worldProd = function (pid) { UI.open('🌍 ' + UAE.P[pid].name + ' · world market', function () { return UI.R.worldProd(pid); }, { push: true }); };
UI.R.worldProd = function (pid) {
  if (!UAE.WM[pid]) pid = 'aichip';
  var A = UAE.fmt.aed, M = UAE.WM[pid], P = UAE.P[pid], R = UAE.wmRanking(pid), st = UAE.S.world2 && UAE.S.world2[pid];
  var me = R.find(function (r) { return r.human; });
  var h = '<div class="cards">' + UI.card('World market', M.subs ? 'subscriptions' : A(UAE.wmSize(pid)) + '/yr', M.subs ? 'see the software company page' : '+' + Math.round((M.grow || 0) * 100) + '%/yr early, levels off at ' + M.cap + '× 2026') +
    UI.card('World frontier', UI.wmIdx(UAE.wmFrontier(pid)), R[0].name) + UI.card('Your best', me ? UI.wmIdx(me.idx) + ' · #' + me.rank : '—', me ? me.name : 'not in this market') +
    UI.card('Real-world margins', M.margin || '—') + '</div>';
  h += '<div class="box"><h3>World ranking</h3><table class="t"><tr><th class="n">#</th><th>Company</th><th class="n">Tech index</th><th class="n">Gains / yr</th><th class="n">World share</th><th class="n">Global reach</th><th class="n">Exports / day</th><th class="n">Price vs world</th></tr>' +
    R.map(function (r) {
      var c = r.co && st && st.cos[r.co.id], L = r.leader ? M.leaders.find(function (x) { return x[0] === r.name; }) : null;
      return '<tr' + (r.human ? ' class="me"' : '') + '><td class="n">' + r.rank + '</td><td>' + r.flag + ' ' + (r.co ? '<a data-act="company" data-arg="' + r.co.id + '">' + UI.esc(r.name) + '</a>' : UI.esc(r.name)) + '</td>' +
        '<td class="n"><b>' + UI.wmIdx(r.idx) + '</b></td><td class="n">' + (L ? '+' + L[3].toFixed(1) : 'your R&amp;D') + '</td>' +
        '<td class="n">' + UI.pc(r.share, 2) + '</td><td class="n">' + (r.co ? UI.pc(UAE.reach(r.co, pid), 0) : 'global') + '</td>' +
        '<td class="n">' + (c ? A(c.rev) : '—') + '</td><td class="n">' + (c ? (c.price / UAE.wmBase(pid)).toFixed(2) + '×' : '—') + '</td></tr>';
    }).join('') + '</table></div>';
  if (me && me.co) {
    var c = st && st.cos[me.co.id], teams = UAE.rndTeams(me.co, pid), q = null;
    var rf = UAE.firmsOf(me.co.id).find(function (f) { return f.type === 'rnd' || (f.type === 'software' && f.lines.length && f.lines[0].pid === pid); });
    if (rf) q = UAE.researchQuote(rf, pid);
    h += '<div class="box"><h3>Your position · ' + UI.esc(me.co.name) + '</h3><div class="cards">' +
      UI.card('Gap to the leader', (me.idx - R[0].idx >= 0 ? '+' : '') + (me.idx - R[0].idx).toFixed(1), me.rank === 1 ? 'you lead the world' : 'behind ' + R[0].name) +
      UI.card('R&amp;D teams on it', teams, 'R&D centres + software firms') + (q && q.gGain ? UI.card('Next project', '+' + q.gGain.toFixed(1) + ' index', A(q.cost) + ' · ' + q.days + ' days') : '') +
      (c && c.want ? UI.card('World demand for you', A(c.want * 30) + '/mo', 'shipped ' + A(c.units * UAE.wmBase(pid) * 30) + '/mo') : '') + '</div>' +
      '<div class="note">' + (P.kind === 'software' || M.ecom || M.subs ? 'Digital product: sales grow with tech index, brand and global reach.' : 'Shipped from factory stock (keeping 3 days for UAE buyers). If world demand is well above what you ship, the CEO builds more factories (when the CEO runs the company).') +
      ' Put more R&amp;D centres on this product to close the gap faster: parallel projects add up with diminishing returns.</div></div>';
  }
  return h;
};

/* World standing box on factory / software / e-commerce / R&D pages */
UI.worldStandingBox = function (f) {
  var k = UAE.FIRM_TYPES[f.type].kind, pids = [];
  if (k === 'factory') f.lines.forEach(function (l) { if (UAE.WM[l.pid]) pids.push(l.pid); });
  if (k === 'software' && f.lines.length && UAE.WM[f.lines[0].pid]) pids.push(f.lines[0].pid);
  if (k === 'internet' && f.model === 'ecommerce') pids.push('ecom');
  if (k === 'rnd' && f.target && UAE.WM[f.target]) pids.push(f.target);
  if (!pids.length) return '';
  var co = UAE.co(f.owner), A = UAE.fmt.aed;
  return '<div class="box"><h3>🌍 World standing</h3><table class="t nosort"><tr><th>Product</th><th class="n">Your index</th><th>World leader</th><th class="n">Rank</th><th class="n">Global reach</th><th class="n">This firm exports / day</th></tr>' +
    pids.map(function (pid) {
      var R = UAE.wmRanking(pid), me = R.find(function (r) { return r.co === co; }), top = R[0];
      return '<tr class="click" data-act="worldProd" data-arg="' + pid + '"><td>' + UI.esc(UAE.P[pid].name) + '</td><td class="n"><b>' + UI.wmIdx(UAE.gtech(co, pid)) + '</b></td><td>' + top.flag + ' ' + UI.esc(top.name) + ' ' + UI.wmIdx(top.idx) + '</td>' +
        '<td class="n">' + (me ? '#' + me.rank + ' / ' + R.length : '—') + '</td><td class="n">' + UI.pc(UAE.reach(co, pid), 0) + '</td><td class="n">' + A(f.worldRev || 0) + '</td></tr>';
    }).join('') + '</table><div class="note">Research raises the world tech index; the leaders keep improving every year. Click for the full world ranking.</div></div>';
};
UI._firmBodyBase = UI._firmBodyBase || UI.firmBody;
UI.firmBody = function (f, mine) { return UI._firmBodyBase(f, mine) + UI.worldStandingBox(f); };

/* Pictures for the new industries (Wikipedia article photos, cached like every product picture) */
(function (W) {
  var add = { pchem: 'Chemical_substance', api: 'Active_ingredient', generic: 'Generic_drug', rxdrug: 'Prescription_drug', biologic: 'Biopharmaceutical',
    ecom: 'E-commerce', titanium: 'Titanium', nickel: 'Superalloy', optics: 'Lens', chiptool: 'Photolithography', meddevice: 'Magnetic_resonance_imaging',
    surgrobot: 'Da_Vinci_Surgical_System', luxbag: 'Handbag', jetengine: 'Turbofan', paynet: 'Payment_card', findata: 'Bloomberg_Terminal',
    adplat: 'Online_advertising', cpu: 'Central_processing_unit', ram: 'Random-access_memory', server: 'Server_(computing)', llm: 'Large_language_model' };
  for (var k in add) if (!W[k]) W[k] = add[k];
})(UAE.PRODUCT_WIKI || (UAE.PRODUCT_WIKI = {}));
UI.WM_GROUPS.push(['💳 Finance & data', ['paynet', 'findata', 'adplat']], ['🏥 Medical devices', ['meddevice', 'surgrobot']], ['✈ Aerospace', ['jetengine']], ['🛠 Chip equipment', ['chiptool']], ['👜 Luxury', ['luxbag', 'watch']]);
