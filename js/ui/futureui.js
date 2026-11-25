/* ============================================================================
 * UAE CAPITALISM LAB  -  UI: FUTURE TECHNOLOGY TIMELINE (Economy -> 🔮 Future tech)
 * Invention windows 2026-2100, research status, your invention teams, the CEO's 2-year cash rule.
 * Pictures: free Wikimedia Commons photos bundled in vendor/pics/future (credits in UAE.FUTURE_PIC_CREDITS).
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

/* local pictures ('local:path') - no network needed (works offline on the phone) */
(function () {
  var baseWant = UI.wantPhoto, baseWiki = UI.wikiPhoto;
  UI.wantPhoto = function (title) { if (title && title.indexOf('local:') === 0) return title.slice(6); return baseWant ? baseWant(title) : null; };
  if (baseWiki) UI.wikiPhoto = function (title) { if (title && title.indexOf('local:') === 0) return Promise.resolve(title.slice(6)); return baseWiki(title); };
  (UAE.FUTURE_PICS || []).forEach(function (pid) { UAE.PRODUCT_WIKI[pid] = 'local:vendor/pics/future/' + pid + '.jpg'; });
})();

UI.futTeams = function (pid) {
  var n = 0; UAE.allCos().forEach(function (c) { if (UAE.isHuman(c) && !c.foreign) n += UAE.activeResearchCount(c, pid); }); return n;
};
/** Small timeline bar 2026-2100: research opens (dim) -> invention window (bright) -> now (white line) -> invented (dot). */
UI.futBar = function (pid) {
  var T = UAE.FUTURE_TECH[pid], st = UAE.S.fut && UAE.S.fut[pid], y0 = 2026, y1 = 2100, W = function (y) { return Math.max(0, Math.min(100, (y - y0) / (y1 - y0) * 100)); };
  var now = UAE.futYear(), inv = st && st.inv != null ? UAE.futYear(st.inv) : null;
  return '<div class="futbar" title="' + (T.from - UAE.FUT.preYears) + ' research opens · ' + T.from + '-' + T.to + ' invention window"><i class="r" style="left:' + W(T.from - UAE.FUT.preYears) + '%;width:' + (W(T.from) - W(T.from - UAE.FUT.preYears)) + '%"></i>' +
    '<i class="w" style="left:' + W(T.from) + '%;width:' + Math.max(1, W(T.to) - W(T.from)) + '%"></i>' + (inv != null ? '<i class="d" style="left:' + W(inv) + '%"></i>' : '') + '<i class="n" style="left:' + W(now) + '%"></i></div>';
};
/** Invention year: the year it was invented, or the year the world's labs are expected to invent it (your research can beat it). */
UI.futInvYearTxt = function (pid) {
  if (UAE.FUTURE_PRE && UAE.FUTURE_PRE[pid]) return 'Invented ' + UAE.FUTURE_PRE[pid][0];
  if (!UAE.isFut || !UAE.isFut(pid)) return '';
  var st = UAE.futState(pid);
  if (UAE.futInvented(pid)) return 'Invented ' + Math.floor(UAE.futYear(st.inv)) + (st.byName ? ' by ' + st.byName : '');
  return st.worldDay != null ? 'Expected invention ' + Math.floor(UAE.futYear(st.worldDay)) + ' (world labs; your research can beat it)' : '';
};
UI.futStatusTxt = function (pid) {
  var T = UAE.FUTURE_TECH[pid], st = UAE.futState(pid), s = UAE.futStatus(pid);
  var exp = st.worldDay != null ? ' · expected invention <b>' + Math.floor(UAE.futYear(st.worldDay)) + '</b>' : '';
  if (s === 'locked') return '<span class="muted">🔒 research opens ' + (T.from - UAE.FUT.preYears) + exp + '</span>';
  if (s === 'research') return '<span class="t-a">🔬 open for invention research' + exp + '</span>';
  var mine = st && st.human, by = st && st.byName ? st.byName : '';
  return '<span class="' + (mine ? 'pos' : '') + '">💡 invented <b>' + Math.floor(UAE.futYear(st.inv)) + '</b>' + (by ? ' · ' + UI.esc(by) : '') + (mine ? ' (you)' : '') + '</span>';
};
/** Big invention-year cell for the timeline table. */
UI.futYearCell = function (pid) {
  var st = UAE.futState(pid);
  if (UAE.futInvented(pid)) return '<b class="pos" style="font-size:1.15em">' + Math.floor(UAE.futYear(st.inv)) + '</b><br><span class="muted">invented</span>';
  return '<b class="t-a" style="font-size:1.15em">~' + Math.floor(UAE.futYear(st.worldDay)) + '</b><br><span class="muted">expected</span>';
};

UI.econ_future = function () {
  var A = UAE.fmt.aed, S = UAE.S, co = UAE.player(), y = UAE.futYear(), ids = Object.keys(UAE.FUTURE_TECH);
  if (!S.fut) UAE.futInit();
  var cnt = { locked: 0, research: 0, invented: 0 }, mineInv = 0, teams = 0;
  ids.forEach(function (pid) { cnt[UAE.futStatus(pid)]++; var st = S.fut[pid]; if (st && st.human) mineInv++; teams += UI.futTeams(pid); });
  var R = UAE.futCashOk(co), plan = co.futPlan, applies = UAE.futRuleApplies(co);
  var h = '<div class="cards">' + UI.card('Year', String(Math.floor(y)), 'research opens 5 years before each window') +
    UI.card('Invented', cnt.invented + ' of ' + ids.length, 'markets open') + UI.card('Open for research', String(cnt.research), cnt.locked + ' still locked') +
    UI.card('Your inventions', String(mineInv), 'first in the world') + UI.card('Your invention teams', String(teams), 'research projects running now') +
    (applies ? UI.card('2-year cash rule · ' + UI.esc(co.name.split(' ').slice(0, 2).join(' ')), R.ok ? '✔ met' : '✖ not met', R.why, R.ok ? 'a' : 'm') : UI.card('2-year cash rule', 'you decide', 'applies when a hired CEO runs ' + UI.esc(co.name.split(' ').slice(0, 2).join(' ')) + ' · now: ' + R.why)) + '</div>';
  h += '<div class="note"><b>Invention first, innovation follows.</b> Each product below has a forecast <b>invention window</b>. Research opens 5 years before it. ' +
    'Every finished R&amp;D project on a product nobody has invented yet is a <b>chance to invent it</b> (0.5% five years early, rising to 6% at the window, 10-20% inside it, 30% after it), so <b>more R&amp;D teams = more chances = invented sooner</b>. ' +
    'The world’s leading labs invent it on their own somewhere inside the window. The inventor starts ' + UAE.FUT.headStart + ' tech points ahead of the world; then the market opens and grows, and everyone innovates: better models, plants, exports. ' +
    '<b>CEO rule:</b> the CEO only funds future research while the last 12 months were profitable and cash covers 24 months of all costs' + (applies ? '' : ' (you run ' + UI.esc(co.name) + ' yourself: start projects in an R&amp;D centre, no rule)') + '.' +
    (plan && plan.ok && plan.picks && plan.picks.length ? ' This month: ' + plan.picks.map(function (x) { return UI.esc(UAE.shortProduct(x.pid)) + ' ×' + x.teams; }).join(', ') + ' (budget ' + A(plan.budgetM) + '/month).' : '') + '</div>';
  Object.keys(UAE.FUTURE_FIELDS).forEach(function (fk) {
    var list = ids.filter(function (pid) { return UAE.FUTURE_TECH[pid].field === fk; });
    if (!list.length) return;
    list.sort(function (a, b) { return UAE.FUTURE_TECH[a].from - UAE.FUTURE_TECH[b].from || UAE.FUTURE_TECH[a].to - UAE.FUTURE_TECH[b].to; });
    h += '<div class="box"><h3>' + UAE.FUTURE_FIELDS[fk] + '</h3><table class="t nosort fut-t"><tr><th></th><th>Product · status</th><th>Invention year</th><th>Window</th><th class="fut-tl">2026 ─ timeline ─ 2100</th><th class="n">Your teams · chance</th><th class="n">World market</th></tr>' +
      list.map(function (pid) {
        var T = UAE.FUTURE_TECH[pid], P = UAE.P[pid], s = UAE.futStatus(pid), tm = UI.futTeams(pid);
        var mk = s === 'invented' ? A(UAE.wmSize(pid)) + '/yr' : 'opens ~' + A(UAE.futLaunchSize(pid)) + '/yr';
        return '<tr' + (s === 'invented' ? ' class="click" data-act="worldProd" data-arg="' + pid + '"' : '') + '><td>' + UI.productImg(pid, 56) + '</td>' +
          '<td><b>' + UI.esc(P.name) + '</b><br>' + UI.futStatusTxt(pid) + '<br><span class="muted">' + UI.esc(T.stage) + ' · ' + (P.kind === 'software' ? 'software' : A(P.world) + ' / ' + UI.esc(P.unit)) + ' · ' + UI.esc(UAE.WM[pid].margin) + '</span></td>' +
          '<td>' + UI.futYearCell(pid) + '</td><td>' + T.from + '-' + T.to + '</td><td class="fut-tl">' + UI.futBar(pid) + '</td>' +
          '<td class="n">' + (s === 'research' ? (tm ? '<b>' + tm + '</b>' : '0') + '<br><span class="muted">' + (UAE.futChance(pid, co) * 100).toFixed(1) + '% / project</span>' : s === 'invented' ? (tm ? tm + ' innovating' : '—') : '—') + '</td>' +
          '<td class="n">' + mk + '<br><span class="muted">' + UAE.WM[pid].leaders.slice(0, 2).map(function (L) { return (UAE.NATION_FLAG[L[1]] || '') + ' ' + UI.esc(L[0]); }).join(', ') + '</span></td></tr>';
      }).join('') + '</table></div>';
  });
  var pre = Object.keys(UAE.FUTURE_PRE || {});
  if (pre.length) h += '<div class="box"><h3>Already invented before 2026 (now normal world markets)</h3><div class="note">' +
    pre.map(function (pid) { var x = UAE.FUTURE_PRE[pid]; return '<a data-act="worldProd" data-arg="' + pid + '">' + UI.esc(UAE.P[pid].name) + '</a> <span class="muted">(' + x[0] + ': ' + UI.esc(x[1]) + ')</span>'; }).join(' · ') + '</div></div>';
  h += '<div class="note muted">Windows are illustrative forecasts (research roadmap, Nov 2026) - passing a window does not mean a technology works in reality. Leaders are real companies and labs; prices, recipes, market sizes and margins are EST. Photos: Wikimedia Commons (free licences, see each product page).</div>';
  return h;
};

/* invented future products join the global tech race table */
UI._econRaceFut = UI._econRaceFut || UI.econ_race;
UI.econ_race = function () {
  var g = UI.WM_GROUPS.find(function (x) { return x[0] === '💡 Invented future tech'; });
  if (!g) { g = ['💡 Invented future tech', []]; UI.WM_GROUPS.push(g); }
  g[1] = Object.keys(UAE.FUTURE_TECH || {}).filter(function (pid) { return UAE.futInvented(pid); });
  return UI._econRaceFut();
};

/* research box: what this research means for a future product */
UI._resBoxFut = UI._resBoxFut || UI.researchBox;
UI.researchBox = function (f, pid, mine) {
  if (!UAE.isFut || !UAE.isFut(pid)) return UI._resBoxFut(f, pid, mine);
  var T = UAE.FUTURE_TECH[pid], s = UAE.futStatus(pid), co = UAE.co(f.owner);
  var head = '<div class="note">🔮 <b>Future technology</b> · invention window ' + T.from + '-' + T.to + ' · ' + UI.futStatusTxt(pid) +
    (s === 'research' ? ' · each finished project here has a <b>' + (UAE.futChance(pid, co) * 100).toFixed(1) + '%</b> chance to invent it (more teams = more chances)' : '') +
    (s === 'locked' ? ' · research opens in ' + (T.from - UAE.FUT.preYears) : '') + '</div>';
  return head + (s === 'locked' ? '' : UI._resBoxFut(f, pid, mine));
};

/* product page credit for bundled photos */
UI._heroFut = UI._heroFut || UI.productHero;
UI.productHero = function (pid, extra) {
  var c = UAE.FUTURE_PIC_CREDITS && UAE.FUTURE_PIC_CREDITS[pid];
  var h = UI._heroFut(pid, extra);
  return c ? h.replace('Photo: Wikimedia Commons via Wikipedia (free licence)', 'Photo: ' + UI.esc(c[1] || 'Wikimedia Commons') + ' · ' + UI.esc(c[0]) + ' · Wikimedia Commons') : h;
};

/* world-market page of a future product: invention status, market size from the invention date */
UI._wpFut = UI._wpFut || UI.R.worldProd;
UI.R.worldProd = function (pid) {
  var h = UI._wpFut(pid);
  if (!UAE.isFut || !UAE.isFut(pid)) return h;
  var T = UAE.FUTURE_TECH[pid], inv = UAE.futInvented(pid);
  h = h.replace(/levels off at ([\d.]+)× 2026/, 'levels off at $1× its launch size');
  if (!inv) h = h.replace(/AED 0\/yr/, 'not invented yet');
  return '<div class="note">🔮 <b>Future technology</b> · invention window ' + T.from + '-' + T.to + ' · ' + UI.futStatusTxt(pid) +
    (inv ? '' : ' · the market opens at about ' + UAE.fmt.aed(UAE.futLaunchSize(pid)) + ' a year when someone invents it (put R&amp;D centres on it: each finished project is a ' + (UAE.futChance(pid, UAE.player()) * 100).toFixed(1) + '% chance)') + '</div>' + h;
};

/* invention year in the product hover tip, the product page and the tech race list */
UI._tipFut = UI._tipFut || UI.productTip;
UI.productTip = function (pid) {
  var h = UI._tipFut(pid), y = UI.futInvYearTxt(pid);
  return y ? h.replace(/data-help="/, 'data-help="' + UI.esc(y) + String.fromCharCode(10)) : h;
};
UI._heroFutY = UI._heroFutY || UI.productHero;
UI.productHero = function (pid, extra) { var y = UI.futInvYearTxt(pid); return UI._heroFutY(pid, (y ? '<div class="t-a">🔮 ' + UI.esc(y) + '</div>' : '') + (extra || '')); };
UI._wmStFut = UI._wmStFut || UI.wmStatus;
if (UI._wmStFut) UI.wmStatus = function (pid) { var h = UI._wmStFut(pid), y = UI.futInvYearTxt(pid); return y ? h + ' · ' + UI.esc(y.replace(/ \(world labs.*\)/, '')) : h; };
