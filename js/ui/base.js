/* ============================================================================
 * UAE CAPITALISM LAB  -  UI BASICS
 * Panels are plain functions returning HTML strings. Buttons use
 *   data-act="actionName" data-arg="..."      -> UI.act.actionName(arg, element)
 * inputs/selects use
 *   data-ch="actionName" data-arg="..."       -> UI.act.actionName(arg, element) on change
 * so every interaction is easy to find in one place.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});
UI.act = {};
UI.stack = [];
UI._after = [];

UI.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); };
UI.$ = function (id) { return document.getElementById(id); };
/** Queue code to run after the current panel HTML is in the DOM (charts etc.). */
UI.after = function (fn) { UI._after.push(fn); };
UI.cls = function (v) { return v >= 0 ? 'pos' : 'neg'; };
UI.money = function (v) { return '<span class="' + UI.cls(v) + '">' + UAE.fmt.aed(v) + '</span>'; };
UI.tag = function (src) {
  src = String(src || '');
  if (/^REAL/i.test(src)) return '<span class="pill real" title="' + UI.esc(src) + '">REAL</span>';
  if (/SIM|SYN/i.test(src)) return '<span class="pill syn" title="' + UI.esc(src) + '">SIM</span>';
  return '<span class="pill est" title="' + UI.esc(src) + '">EST</span>';
};
UI.exch = function (co) {
  if (!co.exch) return '<span class="pill">' + (co.status === 'DELISTED' ? 'DELISTED' : co.status === 'BANKRUPT' ? 'BANKRUPT' : 'PRIVATE') + '</span>';
  return '<span class="pill ' + co.exch.toLowerCase() + '">' + co.exch + ' · ' + UI.esc(co.ticker) + '</span>';
};
UI.coLink = function (co) {
  return '<a href="#" data-act="corp" data-arg="' + co.id + '" class="colink">' + (UI.logo ? UI.logo(co, 18) : '<span class="dot" style="background:' + UI.ownerColor(co) + '"></span>') + UI.esc(co.name) + '</a>';
};
UI.card = function (label, value, small, kind) {
  return '<div class="card ' + (kind || '') + '"><label>' + label + '</label><b>' + value + '</b>' + (small ? '<small>' + small + '</small>' : '') + '</div>';
};
/** Horizontal neon bar 0-100 (Capitalism Lab rating / indicator bars). `mark` draws a city-average tick. */
UI.bar = function (pct, color, label, mark) {
  var v = Math.max(0, Math.min(100, pct || 0));
  return '<span class="bar" title="' + UI.esc(label || Math.round(v)) + '"><i style="width:' + v + '%;background:' + (color || 'var(--cyan)') + ';box-shadow:0 0 6px ' + (color || 'var(--cyan)') + '"></i>' +
    (mark != null ? '<u style="left:' + Math.max(0, Math.min(100, mark)) + '%"></u>' : '') + '</span><span class="barv">' + (label != null ? label : Math.round(v)) + '</span>';
};
UI.tabs = function (key, list, cur) {
  return '<div class="tabs">' + list.map(function (t) {
    return '<button data-act="tab" data-arg="' + key + '|' + t[0] + '" class="' + (t[0] === cur ? 'on' : '') + '">' + t[1] + '</button>';
  }).join('') + '</div>';
};
UI.tabState = {};
UI.act.tab = function (arg) { var p = arg.split('|'); UI.tabState[p[0]] = p[1]; UI.render(); };

/* ----------------------------------------------------------- drawer */
UI.open = function (title, render, opt) {
  opt = opt || {};
  if (!opt.push) UI.stack = [];
  UI.stack.push({ title: title, render: render, live: opt.live !== false });
  UI.$('drawer').classList.add('open');
  UI.render(true);
};
UI.render = function (resetScroll) {
  var top = UI.stack[UI.stack.length - 1]; if (!top) return;
  var body = UI.$('dBody'), y = body.scrollTop;
  UI.$('dTitle').textContent = typeof top.title === 'function' ? top.title() : top.title;
  UI.$('dBack').style.visibility = UI.stack.length > 1 ? 'visible' : 'hidden';
  UI._after = [];
  try { body.innerHTML = top.render(); }
  catch (e) { body.innerHTML = '<div class="note">Panel error: ' + UI.esc(e.message) + '</div>'; console.error(e); }
  UI._after.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  body.scrollTop = resetScroll ? 0 : y;
};
UI.close = function () { UI.stack = []; UI.$('drawer').classList.remove('open'); document.querySelectorAll('#rail button').forEach(function (b) { b.classList.remove('on'); }); };
UI.back = function () { if (UI.stack.length > 1) { UI.stack.pop(); UI.render(true); } };
/** Refresh the open panel unless the user is typing in it. */
UI.liveRefresh = function () {
  var top = UI.stack[UI.stack.length - 1]; if (!top || !top.live) return;
  var a = document.activeElement;
  if (a && UI.$('drawer').contains(a) && (a.tagName === 'INPUT' || a.tagName === 'SELECT')) return;
  UI.render();
};

/* ------------------------------------------------------ toast & modal */
UI.toast = function (msg, kind) {
  var t = document.createElement('div');
  t.className = 'toast ' + (kind === 'bad' ? 'neon-m' : kind === 'good' ? 'neon-a' : 'neon');
  t.innerHTML = msg; UI.$('toasts').appendChild(t);
  setTimeout(function () { t.remove(); }, 4600);
};
UI.result = function (r, okMsg) {
  if (r && r.ok) { UI.toast(okMsg || 'Done.', 'good'); UI.render(); UI.refreshHUD(); UI.refreshMap(); }
  else UI.toast((r && r.why) || 'Not possible.', 'bad');
  return r && r.ok;
};
UI.modal = function (html) { UI.$('mWin').innerHTML = html; UI.$('modal').classList.add('open'); };
UI.closeModal = function () { UI.$('modal').classList.remove('open'); };
UI.act.closeModal = UI.closeModal;

/* ----------------------------------------------------- event wiring */
UI.wireEvents = function () {
  var handler = function (attr) {
    return function (e) {
      var el = e.target.closest('[' + attr + ']'); if (!el) return;
      if (attr === 'data-act' && el.tagName === 'A') e.preventDefault();
      var fn = UI.act[el.getAttribute(attr)];
      if (fn) fn(el.getAttribute('data-arg'), el, e);
      else console.warn('no action', el.getAttribute(attr));
    };
  };
  ['dBody', 'mWin', 'rail', 'cities'].forEach(function (id) {
    UI.$(id).addEventListener('click', handler('data-act'));
    UI.$(id).addEventListener('change', handler('data-ch'));
    UI.$(id).addEventListener('input', function (e) { if (e.target.closest('[data-in]')) handler('data-in')(e); });
  });
  UI.$('dClose').onclick = UI.close; UI.$('dBack').onclick = UI.back;
  UI.$('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') UI.closeModal(); });
};
/** Read a number from an input element by id (supports 10m / 2.5bn / 300k shorthand). */
UI.num = function (id) {
  var el = UI.$(id); if (!el) return NaN;
  var s = String(el.value).trim().toLowerCase().replace(/,/g, '').replace(/aed/, '').trim();
  var m = s.match(/^(-?[\d.]+)\s*(k|m|bn|b)?$/); if (!m) return NaN;
  var v = parseFloat(m[1]); return v * ({ k: 1e3, m: 1e6, bn: 1e9, b: 1e9 }[m[2]] || 1);
};
