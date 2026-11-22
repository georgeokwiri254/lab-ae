/* ============================================================================
 * UAE CAPITALISM LAB  -  CLICK A COLUMN HEADER TO SORT ANY TABLE
 * Works on every table.t in a window or dialog. Click = sort (numbers high -> low first, text A -> Z),
 * click again = reverse. The sort is remembered per window + table and re-applied every time the window
 * refreshes (the game redraws open windows as time passes). Not sorted: financial statements (table.fs),
 * tables marked .nosort and tables with merged cells. Rows marked total / sub stay at the bottom.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});
UI.sortState = {};

UI.sortVal = function (td) {
  if (!td) return { s: '' };
  var el = td.querySelector('input, select'), t;
  if (el) t = el.tagName === 'SELECT' ? (el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '') : el.value;
  else t = td.textContent;
  t = (t || '').trim();
  if (/^\d{1,2} [A-Z][a-z]{2} \d{4}/.test(t)) { var d = Date.parse(t.slice(0, 11)); if (!isNaN(d)) return { n: d }; }
  var s = t.replace(/AED|US\$|\$/g, '').replace(/,/g, '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
  var m = s.match(/^([+-]?)\s*(\d+(?:\.\d+)?)\s*(T|bn|m|k|%)?/);
  if (m) { var v = parseFloat(m[2]) * ({ T: 1e12, bn: 1e9, m: 1e6, k: 1e3 }[m[3]] || 1); return { n: m[1] === '-' ? -v : v }; }
  return { s: t.replace(/^[^A-Za-z0-9]+/, '').toLowerCase() };          // ignore leading flags / icons
};
UI.sortParts = function (table) {
  if (!table || !table.classList.contains('t') || table.classList.contains('fs') || table.classList.contains('nosort')) return null;
  var rows = Array.prototype.slice.call(table.rows); if (rows.length < 3) return null;
  var head = rows[0]; if (!head.cells.length || Array.prototype.some.call(head.cells, function (c) { return c.tagName !== 'TH' || c.colSpan > 1; })) return null;
  var body = rows.slice(1);
  if (body.some(function (r) { return Array.prototype.some.call(r.cells, function (c) { return c.colSpan > 1; }) || r.classList.contains('h'); })) return null;
  return { head: head, rows: body.filter(function (r) { return !r.classList.contains('total') && !r.classList.contains('sub'); }), pinned: body.filter(function (r) { return r.classList.contains('total') || r.classList.contains('sub'); }) };
};
UI.sortKey = function (table) {
  var root = table.closest('#dBody') ? (UI.$('dTitle') ? UI.$('dTitle').textContent : 'w') : 'modal';
  var all = Array.prototype.slice.call((table.closest('#dBody') || table.closest('#mWin') || document).querySelectorAll('table.t'));
  var head = Array.prototype.map.call(table.rows[0].cells, function (c) { return c.textContent.trim(); }).join('|');
  return root + '#' + all.indexOf(table) + '|' + head;
};
UI.sortTable = function (table, col, dir) {
  var P = UI.sortParts(table); if (!P || col >= P.head.cells.length) return;
  var parent = P.rows.length ? P.rows[0].parentNode : null; if (!parent) return;
  var keyed = P.rows.map(function (r, i) { return { r: r, v: UI.sortVal(r.cells[col]), i: i }; });
  keyed.sort(function (a, b) {
    var x = a.v, y = b.v, c;
    if (x.n != null && y.n != null) c = x.n - y.n;
    else if (x.n != null) c = -1; else if (y.n != null) c = 1;          // numbers before text
    else c = x.s < y.s ? -1 : x.s > y.s ? 1 : 0;
    return (c * dir) || (a.i - b.i);
  });
  UI._sorting = true;
  keyed.forEach(function (k) { parent.appendChild(k.r); });
  P.pinned.forEach(function (r) { parent.appendChild(r); });
  Array.prototype.forEach.call(P.head.cells, function (c, i) { c.classList.remove('sort-asc', 'sort-desc'); if (i === col) c.classList.add(dir > 0 ? 'sort-asc' : 'sort-desc'); });
  setTimeout(function () { UI._sorting = false; }, 0);
};
UI.applySorts = function (root) {
  if (!root) return;
  root.querySelectorAll('table.t').forEach(function (t) {
    var P = UI.sortParts(t); if (!P) return; t.classList.add('sortable');
    var st = UI.sortState[UI.sortKey(t)]; if (st) UI.sortTable(t, st.col, st.dir);
  });
};
UI.initTableSort = function () {
  if (typeof document === 'undefined' || UI._sortInit) return; UI._sortInit = true;
  document.addEventListener('click', function (e) {
    var th = e.target.closest && e.target.closest('table.t th'); if (!th) return;
    if (e.target.closest('button, input, select, a, label')) return;           // let controls inside headers work
    var table = th.closest('table'), P = UI.sortParts(table); if (!P || th.parentNode !== P.head) return;
    var col = Array.prototype.indexOf.call(P.head.cells, th), key = UI.sortKey(table), st = UI.sortState[key];
    // first click: numbers high -> low, text A -> Z; next click reverses
    var first = UI.sortVal(P.rows[0] && P.rows[0].cells[col]).n != null ? -1 : 1;
    var dir = st && st.col === col ? -st.dir : first;
    UI.sortState[key] = { col: col, dir: dir };
    UI.sortTable(table, col, dir);
  }, true);
  ['dBody', 'mWin'].forEach(function (id) {
    var el = document.getElementById(id); if (!el || typeof MutationObserver === 'undefined') return;
    new MutationObserver(function () { if (!UI._sorting) UI.applySorts(el); }).observe(el, { childList: true });
  });
};
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', UI.initTableSort); else UI.initTableSort();
}
