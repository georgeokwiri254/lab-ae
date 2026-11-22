/* ============================================================================
 * UAE CAPITALISM LAB  -  PERSON SPOTLIGHT (Capitalism Lab style portrait panel)
 * A large "hyper-rendered" dark-mode picture next to the Rankings window. It shows the
 * person you click or hover, and follows the list while you scroll.
 *  - Real people (rich lists): their photo from Wikipedia / Wikimedia Commons
 *    (freely licensed, loaded at runtime, needs internet; cached by the app).
 *    No photo found -> a large monogram.
 *  - You: your own profile photo (img/player.jpg).
 *  - Fictional CEOs: their drawn portrait, enlarged.
 * Rows opt in with UI.spotAttr(obj) -> data-spot="<key>".
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI._spots = {};           // key -> { name, sub, nw, rank, what, tag, wiki, p, ctry }
UI._spotKey = null;
UI._wikiImg = {};         // wiki title -> image url | '' (none) | Promise
UI.spotAttr = function (o) { var k = 's' + Object.keys(UI._spots).length; UI._spots[k] = o; return ' data-spot="' + k + '"'; };

/** Look up a Wikipedia page photo (Wikimedia Commons thumbnail). Cached in memory and localStorage. */
UI.wikiPhoto = function (title) {
  if (UI._wikiImg[title] != null) return Promise.resolve(UI._wikiImg[title]);
  try { var c = localStorage.getItem('wikiimg2:' + title); if (c) { UI._wikiImg[title] = c; return Promise.resolve(c); } } catch (e) { }
  // 'File:Name.jpg' = a specific Wikimedia Commons photo (picked by hand, e.g. modern product shots): direct 500 px thumbnail
  // (looked up once through the Commons API: the direct image address works offline in the phone app's photo cache;
  //  the Special:FilePath redirect does not allow that. Remembered in localStorage like every other photo.)
  if (/^File:/.test(title)) {
    var fallback = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(title.slice(5)) + '?width=500';
    return fetch('https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url&iiurlwidth=500&titles=' + encodeURIComponent(title))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var pg = j && j.query && j.query.pages && Object.keys(j.query.pages).map(function (k) { return j.query.pages[k]; })[0];
        var src = (pg && pg.imageinfo && pg.imageinfo[0] && pg.imageinfo[0].thumburl || '').replace(/\?.*$/, '') || fallback;
        UI._wikiImg[title] = src; try { localStorage.setItem('wikiimg2:' + title, src); } catch (e) { }
        return src;
      }).catch(function () { UI._wikiImg[title] = fallback; return fallback; });   // offline / blocked: the redirect address
  }
  return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j) return '';                       // busy / rate-limited / offline: not remembered, retried next time
      var src = (j.thumbnail && j.thumbnail.source) || '';
      // Wikimedia only serves standard thumbnail sizes (330 / 500 / 960 px); 500 is sharp enough for the panel
      if (src) src = src.replace(/\/\d+px-/, '/500px-').replace(/\?.*$/, '');
      UI._wikiImg[title] = src; if (src) try { localStorage.setItem('wikiimg2:' + title, src); } catch (e) { }
      return src;
    }).catch(function () { return ''; });       // offline: no cache entry, try again next time
};

UI.spotEl = function () {
  var el = document.getElementById('spot');
  if (!el) { el = document.createElement('aside'); el.id = 'spot'; el.className = 'glass neon'; document.body.appendChild(el); }
  return el;
};
UI.spotHide = function () { var el = document.getElementById('spot'); if (el) el.classList.remove('open'); };

/** Show a person in the spotlight panel. */
UI.spotShow = function (key) {
  var o = UI._spots[key]; if (!o) return;
  UI._spotKey = key + '|' + o.name;
  var el0 = document.getElementById('spot');
  if (el0 && el0.classList.contains('open') && el0.getAttribute('data-who') === o.name) {
    var n = el0.querySelector('.nw'), rk = el0.querySelector('.rank'); if (n) n.textContent = UAE.fmt.aed(o.nw); if (rk) rk.textContent = '#' + o.rank; return;
  }
  var el = UI.spotEl(); el.setAttribute('data-who', o.name);
  var pic, mono = o.name.replace(/&.*$/, '').split(' ').filter(Boolean).map(function (x) { return x[0]; }).join('').slice(0, 2);
  if (o.p && o.p.isPlayer && !(o.p.look && o.p.look.noPhoto)) pic = '<img class="hyper kb" src="' + (o.p.photo || UI.PLAYER_PHOTO_FULL || UI.PLAYER_PHOTO) + '" alt=""><i class="sweep"></i>';
  else if (o.p && !o.wiki) pic = '<div class="drawn">' + UI.drawnPortrait(o.p, 300) + '</div>';
  else pic = '<div class="mono">' + UI.esc(mono) + '</div><img class="hyper" alt="" style="opacity:0">';
  el.innerHTML = '<div class="frame">' + pic + '<div class="fx"></div><div class="rank">#' + o.rank + '</div></div>' +
    '<div class="info"><div class="nm">' + UI.esc(o.name) + '</div><div class="sub">' + UI.esc(o.sub || '') + '</div>' +
    '<div class="nw">' + UAE.fmt.aed(o.nw) + '</div><div class="what">' + UI.esc(o.what || '') + '</div>' +
    '<div class="row">' + (o.tag || '') + (o.p ? ' <button class="btn sm" data-spot-open="' + o.p.id + '">Open profile</button>' : '') + '</div>' +
    (o.wiki ? '<div class="credit">Photo: Wikimedia Commons via Wikipedia (free licence)</div>' : '') + '</div>';
  el.classList.add('open');
  var b = el.querySelector('[data-spot-open]');
  if (b) b.onclick = function () { UI.act.richPerson(b.getAttribute('data-spot-open')); };
  if (o.wiki) UI.wikiPhoto(o.wiki).then(function (src) {
    if (!src || UI._spotKey !== key + '|' + o.name) return;
    var img = el.querySelector('img.hyper'); if (!img) return;
    img.onerror = function () { if (img.src.indexOf('/500px-') > 0) img.src = img.src.replace('/500px-', '/330px-'); };
    img.onload = function () { img.style.opacity = 1; var m = el.querySelector('.mono'); if (m) m.style.opacity = 0; };
    img.src = src;
  });
};

/** After each render of the drawer: keep the selected person, or show the first row. */
UI.spotRefresh = function () {
  var body = UI.$('dBody'), rows = body ? body.querySelectorAll('[data-spot]') : [];
  if (!rows.length) { UI.spotHide(); return; }
  var want = UI._spotKey && UI._spotKey.split('|');
  for (var i = 0; i < rows.length; i++) {
    var k = rows[i].getAttribute('data-spot');
    if (want && UI._spots[k] && UI._spots[k].name === want[1]) { UI.spotShow(k); return; }
  }
  UI.spotShow(rows[0].getAttribute('data-spot'));
};
UI.spotFromScroll = function () {
  var body = UI.$('dBody'), rows = body.querySelectorAll('[data-spot]'); if (!rows.length) return;
  var top = body.getBoundingClientRect().top + 40;
  for (var i = 0; i < rows.length; i++) if (rows[i].getBoundingClientRect().bottom > top) { UI.spotShow(rows[i].getAttribute('data-spot')); UI.spotMark(rows[i]); return; }
};
UI.spotMark = function (row) {
  UI.$('dBody').querySelectorAll('.spot-on').forEach(function (r) { r.classList.remove('spot-on'); });
  if (row) row.classList.add('spot-on');
};

/* Wiring: wrap UI.render / UI.close once, plus hover, click and scroll on the drawer. */
(function () {
  var render0 = UI.render, close0 = UI.close;
  UI.render = function (resetScroll) { UI._spots = {}; render0(resetScroll); UI.spotRefresh(); };
  UI.close = function () { close0(); UI.spotHide(); };
  var wire = function () {
    var body = document.getElementById('dBody'); if (!body) return;
    body.addEventListener('mouseover', function (e) { var r = e.target.closest('[data-spot]'); if (r) { UI.spotShow(r.getAttribute('data-spot')); UI.spotMark(r); } });
    body.addEventListener('click', function (e) { var r = e.target.closest('[data-spot]'); if (r) { UI.spotShow(r.getAttribute('data-spot')); UI.spotMark(r); } });
    var t = null; body.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(UI.spotFromScroll, 60); });
  };
  if (typeof document !== 'undefined' && document.addEventListener) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  }
})();
