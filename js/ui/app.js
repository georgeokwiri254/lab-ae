/* ============================================================================
 * UAE CAPITALISM LAB  -  APP SHELL: title screen, game loop, HUD, shortcuts
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

/* ms of real time per simulated day for speeds 0-5 */
UI.SPEED_MS = [0, 1400, 650, 280, 110, 35];

/* ------------------------------------------------------------- startup */
window.addEventListener('DOMContentLoaded', function () {
  UI.wireEvents();
  UI.initMap();
  UI.orbit();
  var sel = UI.$('ngCity');
  Object.keys(UAE.CITIES).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = UAE.CITIES[k].name + ' (' + UAE.EMIRATES[UAE.CITIES[k].emirate].name + ')'; sel.appendChild(o); });
  UI.$('ngGo').onclick = function () {
    UAE.newGame({
      playerName: UI.$('ngName').value, companyName: UI.$('ngCo').value, ticker: UI.$('ngTick').value, hq: UI.$('ngCity').value,
      difficulty: UI.$('ngDiff').value, listing: UI.$('ngList').value, aiCount: Math.max(0, Math.min(18, +UI.$('ngAI').value || 0)),
      realCompanies: UI.$('ngReal').value === '1', seed: +UI.$('ngSeed').value || 20261120
    });
    UI.start();
    UI.welcome();
  };
  UI.$('ngLoad').onclick = function () {
    var best = null, bm = null;
    [0, 1, 2, 3].forEach(function (s) { var m = UAE.slotMeta(s); if (m && (!bm || m.saved > bm.saved)) { bm = m; best = s; } });
    if (best == null) { UI.toast('No saved game found.', 'bad'); return; }
    if (UAE.loadSlot(best)) { UI.start(); UI.toast('Loaded ' + UI.esc(bm.co) + ' · ' + bm.date, 'good'); }
  };
  UI.$('ngImport').onclick = function () { UI.$('ngFile').click(); };
  UI.$('ngFile').onchange = function (e) {
    var file = e.target.files[0]; if (!file) return;
    var rd = new FileReader();
    rd.onload = function () { try { UAE.deserialize(rd.result); UI.start(); UI.toast('Save imported.', 'good'); } catch (err) { UI.toast('Invalid save file.', 'bad'); } };
    rd.readAsText(file);
  };
  // rail
  UI.$('rail').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    document.querySelectorAll('#rail button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
  });
  // speed
  UI.$('speed').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) UI.setSpeed(+b.dataset.s); });
  // map controls
  UI.$('zIn').onclick = function () { UI.map.zoomIn(); };
  UI.$('zOut').onclick = function () { UI.map.zoomOut(); };
  UI.$('z3d').onclick = function () { var on = UI.map.getPitch() < 10; UI.map.easeTo({ pitch: on ? 60 : 0, duration: 900 }); UI.$('z3d').classList.toggle('on', on); UI.$('z3d').textContent = on ? '3D' : '2D'; };
  UI.$('zRot').onclick = function () { UI.map.easeTo({ bearing: 0, duration: 700 }); };
  UI.$('zSat').onclick = function () { UI.setBase(!UI.$('zSat').classList.contains('on')); };
  UI.$('zZones').onclick = function () { UI.showZones(!UI.zonesOn); };
  UI.$('zRes').onclick = function () { var on = !UI.depOn; UI.$('zRes').dataset.user = on ? '1' : ''; UI.showDeposits(on); if (on && UI.map.getZoom() > 10) UI.flyCity('UAE'); };
  UI.$('zTraf').onclick = function () { UI.showTraffic(!UI.trafOn); };
  UI.$('zUAE').onclick = function () { UI.flyCity('UAE'); };
  UI.$('coSwitch').onchange = function (e) { UI.act.switchCo(e.target.value); };
  document.addEventListener('keydown', UI.keys);
});

UI.start = function () {
  UI.started = true;
  UI.$('title').classList.add('hidden');
  ['rail', 'topbar', 'mapctl', 'coords', 'bottom'].forEach(function (id) { UI.$(id).classList.remove('hidden'); });
  var cb = UI.$('cities');
  cb.innerHTML = Object.keys(UAE.CITIES).map(function (k) { return '<button data-act="flyCity" data-arg="' + k + '">' + UAE.CITIES[k].name + '</button>'; }).join('') + '<button data-act="flyCity" data-arg="UAE">🇦🇪 UAE</button>';
  UAE.onNews = UI.onNews;
  UI.fillCoSwitch(); UI.refreshHUD(); UI.refreshMap(); UI.refreshTicker();
  UI.flyCity(UAE.co(UAE.S.playerCo).hq);
  UI.setSpeed(UAE.S.speed || 0);
  if (!UI.loopStarted) { UI.loopStarted = true; UI.lastT = performance.now(); UI.acc = 0; requestAnimationFrame(UI.loop); }
};
UI.afterLoad = function () { UI.close(); UI.start(); };
UI.act.flyCity = function (id) { UI.flyCity(id); };

UI.welcome = function () {
  var co = UAE.player();
  UI.modal('<h2>Welcome, ' + UI.esc(UAE.playerPerson().name) + '</h2>' +
    '<p>You run <b class="t-a">' + UI.esc(co.name) + '</b> with <b>' + UAE.fmt.aed(co.bs.cash) + '</b> of capital in ' + UAE.CITIES[co.hq].name + '.</p>' +
    '<p>The map is the real UAE. Neon dots are firms: <span class="t-a">yours</span>, <span class="t-c">real UAE groups</span> (Emaar, ADNOC, ENBD …) at their real sites, and <span class="t-m">AI start-ups</span> that will compete and expand.</p>' +
    '<ol><li>Press <b>B</b> and build a <b>Headquarters</b> in a CBD (Downtown, DIFC, Business Bay, ADGM …).</li>' +
    '<li>Build a <b>Retail Store</b> near footfall (Dubai Mall, Marina, Deira) and add products - imports arrive via Jebel Ali / Khalifa Port.</li>' +
    '<li>Press <b>1</b>-<b>5</b> to run time, <b>Space</b> to pause. Open <b>I</b> for the 21 Information Center reports.</li>' +
    '<li>Integrate: farms → factories → your stores; then real estate, hotels, banks, digital … and IPO on DFM or ADX.</li></ol>' +
    '<div class="row"><button class="btn a" data-act="closeModal">Let\'s build</button><button class="btn" data-act="welcomeBuild">Build HQ now</button></div>');
};
UI.act.welcomeBuild = function () { UI.closeModal(); UI.act.startBuild('hq'); };

/* ------------------------------------------------------------ the loop */
UI.setSpeed = function (s) {
  UAE.S.speed = s;
  document.querySelectorAll('#speed button').forEach(function (b) { b.classList.toggle('on', +b.dataset.s === s); });
};
UI.loop = function (t) {
  var dt = Math.min(250, t - UI.lastT); UI.lastT = t;
  var S = UAE.S;
  if (S && S.speed > 0) {
    UI.acc += dt;
    var ms = UI.SPEED_MS[S.speed], n = 0;
    while (UI.acc >= ms && n < 12) {
      UI.acc -= ms; n++;
      var month = UAE.cal.month();
      try { UAE.tick(); } catch (e) { console.error(e); UI.setSpeed(0); UI.toast('Simulation error: ' + UI.esc(e.message), 'bad'); break; }
      if (UAE.cal.month() !== month && S.settings.autosave !== false) UAE.saveSlot(0);
    }
    if (n) UI.dirty = true;
  }
  UI.frame = (UI.frame || 0) + 1;
  if (UI.dirty && t - (UI.hudT || 0) > 250) { UI.hudT = t; UI.refreshHUD(); }
  if (UI.dirty && t - (UI.mapT || 0) > 1200) { UI.mapT = t; UI.refreshMap(); UI.refreshTicker(); }
  if (UI.dirty && t - (UI.panT || 0) > 1500) { UI.panT = t; UI.liveRefresh(); UI.dirty = false; }
  requestAnimationFrame(UI.loop);
};

/* ----------------------------------------------------------------- HUD */
UI.refreshHUD = function () {
  if (!UAE.S) return;
  var co = UAE.player(), p = UAE.playerPerson(), S = UAE.S, ni = UAE.netIncome(UAE.ttm(co));
  UI.$('kDate').textContent = UAE.cal.label();
  UI.$('kCash').textContent = UAE.fmt.aed(co.bs.cash);
  UI.$('kCash').className = co.bs.cash >= 0 ? 't-a' : 'neg';
  UI.$('kNI').innerHTML = UI.money(ni);
  UI.$('kVal').textContent = UAE.fmt.aed(UAE.companyValue(co));
  UI.$('kNW').textContent = UAE.fmt.aed(UAE.personWealth(p));
  ['DFM', 'ADX'].forEach(function (x) {
    var I = S.index[x], prev = I.hist.length > 1 ? I.hist[I.hist.length - 2] : I.base, ch = I.level / prev - 1;
    UI.$('k' + x).innerHTML = I.level.toFixed(1) + ' <span class="' + UI.cls(ch) + '">' + (ch >= 0 ? '▲' : '▼') + UAE.fmt.pct(Math.abs(ch), 2) + '</span>';
  });
};
UI.fillCoSwitch = function () {
  var sel = UI.$('coSwitch');
  sel.innerHTML = UAE.allCos().filter(function (c) { return c.controller === 'PLAYER'; })
    .map(function (c) { return '<option value="' + c.id + '"' + (c.id === UAE.S.activeCo ? ' selected' : '') + '>' + UI.esc(c.name) + '</option>'; }).join('');
};
UI.refreshTicker = function () {
  var S = UAE.S, parts = [];
  UAE.allCos().filter(UAE.isTradable).sort(function (a, b) { return UAE.mcap(b) - UAE.mcap(a); }).slice(0, 18).forEach(function (c) {
    var ph = c.priceHist, ch = ph.length > 1 ? c.price / ph[ph.length - 2] - 1 : 0;
    parts.push('<span><b class="t-c">' + UI.esc(c.ticker) + '</b> ' + UAE.fmt.px(c.price) + ' <span class="' + UI.cls(ch) + '">' + (ch >= 0 ? '▲' : '▼') + UAE.fmt.pct(Math.abs(ch), 2) + '</span></span>');
  });
  S.news.slice(0, 6).forEach(function (n) { parts.push('<span class="t-m">◆</span><span>' + UI.esc(n.text) + '</span>'); });
  parts.push('<span>Brent idx ' + S.macro.oil.toFixed(2) + '</span><span>CBUAE ' + UAE.fmt.pct(S.macro.rate, 2) + '</span>');
  var tr = UI.$('tickTrack'); if (tr.dataset.n !== String(S.day)) { tr.innerHTML = parts.join(''); tr.dataset.n = S.day; }
};
UI.onNews = function (n) {
  if (['goal', 'warning'].indexOf(n.kind) >= 0) UI.toast((n.kind === 'goal' ? '🎯 ' : '⚠ ') + UI.esc(n.text), n.kind === 'goal' ? 'good' : 'bad');
  else if (n.kind === 'firm' || n.kind === 'finance') UI.toast(UI.esc(n.text));
};

/* ----------------------------------------------- rail / shortcut actions */
UI.act.build = function () { UI.open('Build Firm', UI.buildMenu, { live: false }); };
UI.act.firms = function () { UI.tabState.fown = 'mine'; UI.open('Firms', UI.R.firms); };
UI.act.fin = function () { UI.open('Financials', UI.R.fin); };
UI.act.factions = function () { UI.open('Financial Actions', UI.R.factions, { live: false }); };

UI.keys = function (e) {
  if (!UI.started) return;
  var tag = (document.activeElement || {}).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { if (e.key === 'Escape') document.activeElement.blur(); return; }
  var k = e.key, map = {
    'i': function () { UI.act.info(); }, 'b': UI.act.build, 'h': UI.act.hq, 'w': function () { UI.flyCity('UAE'); },
    'c': function () { UI.act.ceo(); }, 'p': function () { UI.act.pdetail(); },
    'F4': UI.act.stock, 'F5': UI.act.news, 'F6': UI.act.fin, 'F7': function () { UI.act.info('score'); }, 'F9': UI.act.save,
    'F10': function () { UI.act.corp(); }, 'F11': UI.act.factions,
    'Escape': function () { if (UI.buildType) UI.cancelBuild(); else if (UI.$('modal').classList.contains('open')) UI.closeModal(); else UI.close(); },
    ' ': function () { UI.setSpeed(UAE.S.speed ? 0 : (UI.lastSpeed || 2)); }
  };
  if (/^[0-5]$/.test(k)) { UI.setSpeed(+k); if (+k) UI.lastSpeed = +k; e.preventDefault(); return; }
  var fn = map[k] || map[k.toLowerCase()];
  if (fn) { e.preventDefault(); fn(); }
};
