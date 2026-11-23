/* ============================================================================
 * UAE CAPITALISM LAB  -  LIVE NOTIFICATION FEED (left side of the screen)
 * Replaces pop-up toasts. Every message (your actions, CEO / CMO / CTO activity,
 * news, warnings, market events) is added to a feed on the empty left side of the
 * map: newest at the top, older entries slide down and fade out. Colour-coded,
 * collapsible, click an entry or the title to open the Event Tracker (F5).
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.FEED_MAX = 60;
UI.FEED_KIND = { bad: 'warn', warning: 'warn', good: 'mine', firm: 'mine', finance: 'fin', event: 'event', gov: 'gov', ai: 'ai', system: 'sys', info: 'sys' };
UI.feedEl = function () {
  var el = document.getElementById('feed');
  if (!el) {
    el = document.createElement('aside'); el.id = 'feed'; el.className = 'glass neon';
    var collapsed = false; try { collapsed = localStorage.getItem('feedCollapsed') === '1'; } catch (e) { }
    if (collapsed) el.classList.add('collapsed');
    el.innerHTML = '<header><span class="ft">◆ Live updates</span><select class="in ffilt" id="feedFilter" title="Show only some updates"></select><button class="fbtn" id="feedTog" title="Collapse / expand">▾</button></header><div class="flist" id="feedList"></div>';
    document.body.appendChild(el);
    var sel = el.querySelector('#feedFilter');
    UI.feedFilterOptions(sel);
    sel.onmousedown = sel.onfocus = function () { UI.feedFilterOptions(sel); };     // refresh company list (new subsidiaries)
    sel.onchange = function () { try { localStorage.setItem('feedFilter', sel.value); } catch (x) { } UI.feedApplyFilter(); };
    sel.onclick = function (e) { e.stopPropagation(); };
    el.querySelector('#feedTog').onclick = function (e) {
      e.stopPropagation(); el.classList.toggle('collapsed');
      try { localStorage.setItem('feedCollapsed', el.classList.contains('collapsed') ? '1' : '0'); } catch (x) { }
    };
    el.querySelector('header .ft').onclick = function () { if (UI.act.news) UI.act.news(); };
    el.querySelector('#feedList').onclick = function (e) { if (e.target.closest('.fi') && UI.act.news) UI.act.news(); };
  }
  return el;
};
/** Add one entry at the top of the feed. kind: bad|good|warning|firm|finance|event|ai|system */
UI.feedAdd = function (html, kind, when) {
  if (typeof document === 'undefined' || !document.body) return;
  var list = UI.feedEl().querySelector('#feedList'), it = document.createElement('div');
  it.className = 'fi ' + (UI.FEED_KIND[kind] || 'sys') + ' new';
  it.innerHTML = '<span class="fd">' + UI.esc(when || (UAE.S ? UAE.cal.label() : '')) + '</span><span class="fx">' + html + '</span>';
  UI.feedTag(it, html, kind);
  list.insertBefore(it, list.firstChild);
  UI.feedApplyFilter(it);
  setTimeout(function () { it.classList.remove('new'); }, 1800);
  while (list.children.length > UI.FEED_MAX) list.removeChild(list.lastChild);
  list.scrollTop = 0;
  if (kind === 'bad') { var f = UI.feedEl(); f.classList.add('alert'); setTimeout(function () { f.classList.remove('alert'); }, 1200); }
};
/* ---- filter: All / My companies / one of my companies / CEO-CMO-CTO / Finance / Competitors / Market & economy / Warnings */
UI.feedMine = function () { return UAE.S ? UAE.allCos().filter(function (c) { return c.controller === 'PLAYER'; }) : []; };
UI.feedFilterOptions = function (sel) {
  var cur = sel.value; if (!cur) { try { cur = localStorage.getItem('feedFilter') || 'all'; } catch (x) { cur = 'all'; } }
  var opts = [['all', 'All updates'], ['mine', 'My companies (all)']].concat(UI.feedMine().map(function (c) { return ['co:' + c.id, '· ' + c.name]; }))
    .concat([['exec', 'My CEO / CMO / CTO'], ['fin', 'Finance & investing'], ['warn', 'Warnings'], ['ai', 'Competitors'], ['gov', 'Government'], ['event', 'Market & economy']]);
  sel.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + UI.esc(o[1]) + '</option>'; }).join('');
  if (sel.value !== cur) sel.value = 'all';
};
/** Tag an entry: its kind, which of my companies it mentions, and whether it is about my executives. */
UI.feedTag = function (it, html, kind) {
  var txt = String(html).replace(/<[^>]*>/g, ''), cos = [], exec = /\((CEO|CMO|CTO)[,)]/.test(txt);
  UI.feedMine().forEach(function (c) {
    if (c.name && txt.indexOf(c.name.trim()) >= 0) cos.push(c.id);
    [c.ceo, c.cmo, c.cto].forEach(function (pid) { var p = pid && UAE.person(pid); if (p && !p.isPlayer && txt.indexOf(p.name) >= 0) { exec = true; if (cos.indexOf(c.id) < 0) cos.push(c.id); } });
  });
  it.dataset.k = UI.FEED_KIND[kind] || 'sys'; it.dataset.cos = cos.join(','); it.dataset.exec = exec && cos.length ? '1' : '';
  it.dataset.mine = (cos.length || kind === 'good' || kind === 'firm') ? '1' : '';
};
UI.feedMatch = function (it, f) {
  if (!f || f === 'all') return true;
  if (f === 'mine') return !!it.dataset.mine;
  if (f.indexOf('co:') === 0) return (',' + it.dataset.cos + ',').indexOf(',' + f.slice(3) + ',') >= 0;
  if (f === 'exec') return !!it.dataset.exec;
  return it.dataset.k === f;
};
UI.feedApplyFilter = function (only) {
  var sel = document.getElementById('feedFilter'), f = sel ? sel.value : 'all';
  (only ? [only] : Array.prototype.slice.call(document.querySelectorAll('#feedList .fi'))).forEach(function (it) { it.style.display = UI.feedMatch(it, f) ? '' : 'none'; });
};
/* Pop-up toasts now go to the feed instead. */
UI.toast = function (msg, kind) { UI.feedAdd(msg, kind === 'bad' ? 'bad' : kind === 'good' ? 'good' : 'system'); };
/** Pull new game news (UAE.news -> S.news, newest first) into the feed. */
UI.feedPull = function () {
  var S = UAE.S; if (!S || !S.news || !S.news.length) return;
  if (UI._feedTop === undefined) {                     // first run (new game / load): show the latest few
    UI._feedTop = null; S.news.slice(0, 8).reverse().forEach(function (n) { UI.feedAdd(UI.esc(n.text), n.kind, UAE.cal.label(n.day)); });
    UI._feedTop = S.news[0]; return;
  }
  var fresh = [];
  for (var i = 0; i < S.news.length && S.news[i] !== UI._feedTop && i < 40; i++) fresh.push(S.news[i]);
  fresh.reverse().forEach(function (n) { UI.feedAdd(UI.esc(n.text), n.kind, UAE.cal.label(n.day)); });
  UI._feedTop = S.news[0];
};
UI.feedReset = function () { UI._feedTop = undefined; var l = document.getElementById('feedList'); if (l) l.innerHTML = ''; };
(function () {
  var hud0 = UI.refreshHUD;
  UI.refreshHUD = function () { var r = hud0 && hud0.apply(this, arguments); try { UI.feedPull(); } catch (e) { } return r; };
  var load0 = UI.afterLoad;
  if (load0) UI.afterLoad = function () { UI.feedReset(); return load0.apply(this, arguments); };
  // the rich-list photo panel uses the same space: the feed steps aside while it is open
  // while placing a building the build banner sits at the top: move the feed below it
  var sb0 = UI.act.startBuild, cb0 = UI.cancelBuild;
  if (sb0) UI.act.startBuild = function () { var r = sb0.apply(this, arguments); if (document.body) document.body.classList.add('building'); return r; };
  if (cb0) UI.cancelBuild = function () { var r = cb0.apply(this, arguments); if (document.body) document.body.classList.remove('building'); return r; };
  var show0 = UI.spotShow, hide0 = UI.spotHide;
  if (show0) UI.spotShow = function () { var r = show0.apply(this, arguments); if (document.body) document.body.classList.add('spot-open'); return r; };
  if (hide0) UI.spotHide = function () { var r = hide0.apply(this, arguments); if (document.body) document.body.classList.remove('spot-open'); return r; };
})();
