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
    rows += '<tr class="h"><td colspan="5">' + g[0] + '</td></tr>';
    g[1].forEach(function (pid) {
      var M = UAE.WM[pid], P = UAE.P[pid]; if (!M || !P) return;
      var R = UAE.wmRanking(pid), top = R[0], me = R.find(function (r) { return r.human; }), st = S.world2 && S.world2[pid];
      var mine = 0; if (st) Object.keys(st.cos).forEach(function (id) { if (UAE.isHuman(UAE.co(id))) mine += st.cos[id].rev; });
      tot += mine * 30; if (me) { n++; if (me.rank === 1) lead++; if (me.rank <= 3) top3++; }
      var gap = me ? me.idx - top.idx : null;
      var sells = me && me.co && UAE.S.world2 && UAE.S.world2[pid] && UAE.S.world2[pid].cos[me.co.id], status = UI.wmStatus(pid);
      rows += '<tr class="click" data-act="worldProd" data-arg="' + pid + '"><td><b>' + UI.esc(UAE.shortProduct(pid)) + '</b><br><span class="muted">' + (M.subs ? 'subscriptions' : A(UAE.wmSize(pid)) + '/yr') + '</span><span class="m-only muted"><br>leader: ' + top.flag + ' ' + UI.esc(top.name) + ' ' + UI.wmIdx(top.idx) + '</span></td>' +
        '<td>' + top.flag + ' ' + UI.esc(top.name) + '<br><span class="muted">index ' + UI.wmIdx(top.idx) + '</span></td>' +
        '<td>' + (me ? UI.esc(me.name.split(' ').slice(0, 2).join(' ')) + '<br><span class="muted">index ' + UI.wmIdx(me.idx) + ' · <span class="' + (gap >= 0 ? 'pos' : 'neg') + '">' + (gap >= 0 ? '+' : '') + gap.toFixed(1) + '</span></span>' : '<span class="muted">not in this market</span>') + '</td>' +
        '<td class="n">' + (me ? '<b>#' + me.rank + '</b>/' + R.length : '—') + '</td><td class="n">' + (mine ? A(mine * 30) : '—') + '<br><span class="muted">' + status + '</span></td></tr>';
    });
  });
  var h = '<div class="cards">' + UI.card('Your exports to the world', A(tot) + '/mo', 'software, chips, devices, pharma, e-commerce') +
    UI.card('World #1 in', lead + ' of ' + n, 'products you compete in') + UI.card('Top 3 in', top3 + ' of ' + n) +
    UI.card('World tech index', '100 = best in 2026', 'leaders improve every year') + '</div>';
  h += '<div class="box"><h3>🚀 Global tech race · your best company vs the world leaders</h3><table class="t nosort wm-race" style="table-layout:auto;width:100%"><tr><th>Product · world market</th><th>World leader</th><th>Your best · index · gap</th><th class="n">Rank</th><th class="n">Exports / mo · status</th></tr>' + rows + '</table>' +
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
  h += '<div class="box"><h3>World ranking</h3><table class="t wm-rank"><tr><th class="n">#</th><th>Company</th><th class="n">Tech index</th><th class="n">Gains / yr</th><th class="n">World share</th><th class="n">Global reach</th><th class="n">Exports / day</th><th class="n">Price vs world</th></tr>' +
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
/* Modern product photos (2026): hand-picked Wikimedia Commons files replace article lead images that were
 * dated (2015 phones, window air-conditioners, museum shoes) or diagrams (OS, LLM, server, GPU). Free licences. */
(function (W) {
  var M = {
  phone: 'File:Apple iPhone 15 Pro.jpg',
  laptop: 'File:Apple MacBook Pro (M3).jpg',
  tv: 'File:Samsung OLED TV.jpg',
  watch: 'File:Apple Watch Series 10.jpg',
  car: 'File:2022 Lucid Air Grand Touring in Zenith Red, front left.jpg',
  ev: 'File:Tesla Model 3 (2023) Autofrühling Ulm IMG 9282.jpg',
  os: 'File:Lenovo ThinkPad P15v 1st Gen (2020).jpg',
  ai: 'File:Smartphone with ChatGPT app (52917381673).jpg',
  llm: 'File:Google Data Center, Council Bluffs Iowa (49062863796).jpg',
  office: 'File:2-in-1 laptop.jpg',
  security: 'File:Rear of rack at NERSC data center - closeup.jpg',
  design: 'File:M3 Macbook Pro 14 inch Space Grey model.jpg',
  video: 'File:Mastering and production room at Audio Mix House, Studio D (13431466874).jpg',
  audio: 'File:Solid State Logic (SSL) Matrix Mixing Console at Audio Mix House, Studio C (13430799763).jpg',
  utility: 'File:Laptop coding programs (Unsplash).jpg',
  game: 'File:Riot Games Arena VCT Americas February 2024.jpg',
  server: 'File:Server Rack (54126210834).jpg',
  ram: 'File:2023 Pamięci Corsair Vengeance RGB.jpg',
  aichip: 'File:Nvidia DGX GB200.jpg',
  chips: 'File:Integrated circuit on microchip.jpg',
  chipip: 'File:NVIDIA H100 (极客湾Geekerwan) 021.png',
  wafer: 'File:12-inch silicon wafer.jpg',
  robot: 'File:Latest Tesla Optimus Humanoid Robot.jpg',
  vr: 'File:Apple Vision Pro with Solo Knit Band.jpg',
  arglasses: 'File:Ray-Ban Stories.jpg',
  drone: 'File:DJI - Drohne Mavic 4 Pro.JPG',
  battery: 'File:Battery pack of an EV.jpg',
  motor: 'File:Tesla Plaid dual motor 01.jpg',
  sensor: 'File:Velodyne High-Def LIDAR.jpg',
  aircon: 'File:Heat pump unit.webp',
  toys: 'File:Lego bricks.jpg',
  footwear: 'File:HK clothing NIKE brand Vaporfly Next sneakers white n silver shoes October 2022 Px3 05 (cropped).jpg',
  jewelry: 'File:Diamond Engagement Ring White Gold by 1791 Diamond.jpg',
  fashion: "File:HK Central Queen's Road H&M Department Store clothing fashion figures night Aug-2012.JPG",
  medicine: 'File:Pharmacy Products on Shelves in Chandigarh, India.jpg',
  generic: 'File:Generic medicines with the yellow G stripe on pharmacy shelves, São Paulo.jpg',
  api: 'File:Rundläuferpresse an der Uni Tübingen, in Betrieb 04.jpg',
  rxdrug: 'File:Ozempic (53899794358).jpg',
  biologic: 'File:Sotrovimab.jpg',
  ecom: 'File:Rivian EDV-700 front.jpg',
  adplat: 'File:Lee Ko – A Way Coming Back digital billboard display, Myeongdong, Seoul, South Korea.jpg',
  paynet: 'File:Tappr Card Reader NFC.jpg',
  luxbag: 'File:Luxury goods, Prada and Chanel Handbags.jpg',
  jetengine: 'File:Airbus A350 A7-ALD Rolls-Royce Trent XWB.jpg',
  meddevice: 'File:MRI-Philips.JPG',
  chiptool: 'File:Extreme ultraviolet lithography tool.jpg',
  surgrobot: 'File:Laproscopic Surgery Robot.jpg',
  findata: 'File:Bloomberg Terminal Museum.jpg'
  };
  for (var k in M) W[k] = M[k];
})(UAE.PRODUCT_WIKI);
UI.WM_GROUPS.push(['💳 Finance & data', ['paynet', 'findata', 'adplat']], ['🏥 Medical devices', ['meddevice', 'surgrobot']], ['✈ Aerospace', ['jetengine']], ['🛠 Chip equipment', ['chiptool']], ['👜 Luxury', ['luxbag', 'watch']]);

/** Where your group stands in a world market: exporting / launch-ready / R&D under way / not started. */
UI.wmStatus = function (pid) {
  var S = UAE.S, st = S.world2 && S.world2[pid], human = UAE.allCos().filter(function (c) { return UAE.isHuman(c) && !c.foreign; });
  if (st && human.some(function (c) { return st.cos[c.id] && st.cos[c.id].rev > 0; })) return 'exporting';
  var rnd = 0, proj = 0; human.forEach(function (c) { UAE.firmsOf(c.id).forEach(function (f) { if (f.type === 'rnd' && f.target === pid) { rnd++; if (f.project) proj++; } }); });
  var sellsLocal = UAE.WM[pid] && UAE.wmActive()[pid] && human.some(function (c) { return UAE.wmActive()[pid][c.id]; });
  var best = human.reduce(function (b, c) { return Math.max(b, c.gtech && c.gtech[pid] != null ? c.gtech[pid] : 0); }, 0), F = UAE.wmFrontier(pid);
  if (rnd) return '🧪 R&D: ' + rnd + ' lab' + (rnd > 1 ? 's' : '') + (proj ? ', ' + proj + ' running' : '') + (best < F - 30 ? ' · ' + Math.ceil(F - 30 - best) + ' pts to launch' : '');
  if (sellsLocal) return best < F - 30 ? 'too far behind to export' : 'no spare output';
  return 'not started';
};
