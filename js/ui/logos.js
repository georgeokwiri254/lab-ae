/* ============================================================================
 * UAE CAPITALISM LAB  -  COMPANY LOGOS IN THE UI
 * UI.logo(co, size): the real company's logo (its official website icon, see
 * data/logos.js) or, for fictional / player companies or when offline, a neon
 * monogram badge in the owner's colour. Used next to every company name.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.logoUrl = function (co) {
  var d = co && UAE.LOGO_DOMAINS[co.id];
  return d ? 'https://www.google.com/s2/favicons?domain=' + d + '&sz=128' : null;
};
UI.monogram = function (co, size) {
  var col = UI.ownerColor ? UI.ownerColor(co) : '#00f0ff', s = size || 18;
  var ini = (co.name || '?').replace(/\(.*?\)/g, '').split(/[\s&]+/).filter(function (w) { return w && /[A-Za-z0-9]/.test(w[0]) && ['of', 'and', 'the', 'Co.', 'PJSC'].indexOf(w) < 0; })
    .map(function (w) { return w[0].toUpperCase(); }).join('').slice(0, 2);
  return '<span class="logo mono" style="width:' + s + 'px;height:' + s + 'px;font-size:' + Math.max(8, Math.round(s * 0.42)) + 'px;color:' + col + ';border-color:' + col + ';box-shadow:0 0 6px ' + col + '66">' + UI.esc(ini) + '</span>';
};
UI.logo = function (co, size) {
  if (!co) return '';
  var s = size || 18, url = UI.logoUrl(co);
  if (!url) return UI.monogram(co, s);
  var col = UI.ownerColor ? UI.ownerColor(co) : '#00f0ff';
  // on error (offline, blocked) the image is swapped for the monogram badge
  return '<img class="logo" src="' + url + '" alt="" width="' + s + '" height="' + s + '" style="border-color:' + col + '" ' +
    'onerror="this.outerHTML=' + UI.esc(JSON.stringify(UI.monogram(co, s))).replace(/'/g, '&#39;') + '">';
};
