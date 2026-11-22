/* ============================================================================
 * UAE CAPITALISM LAB  -  FIRMS BY CATEGORY
 * "My Firms" (and the firm lists of every company) grouped by business category:
 * a summary card per category (count, revenue, profit), category tabs, and the
 * firm table of the chosen category. Same categories as the Build menu.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.FIRM_CATS = [
  ['retail', '🛍 Retail & Services', ['retail', 'service', 'mall', 'hotel', 'sports']],
  ['industry', '🏭 Industry & Resources', ['factory', 'warehouse', 'farm', 'mine', 'oilwell', 'logging', 'solar']],
  ['tech', '💾 Tech, Media & Digital', ['software', 'internet', 'telecom', 'datacenter', 'rnd', 'tv', 'radio', 'newspaper']],
  ['estate', '🏙 Real Estate', ['apartment', 'commercial', 'mansion']],
  ['finance', '🏦 Banking & Insurance', ['bankhq', 'bankbranch', 'inshq', 'insoffice']],
  ['trade', '🚢 Trade & Logistics', ['importer', 'exporter', 'logistics']],
  ['corp', '🏢 Corporate & Civic', ['hq', 'civic']]
];
UI.firmCat = function (type) { var c = UI.FIRM_CATS.find(function (x) { return x[2].indexOf(type) >= 0; }); return c ? c[0] : 'corp'; };

/** Category cards + tabs + table for a list of firms. key = tabState key for the chosen category. */
UI.firmsByCategory = function (list, key) {
  key = key || 'fcat';
  var cur = UI.tabState[key] || 'all', A = UAE.fmt.aed;
  var stats = {}; UI.FIRM_CATS.forEach(function (c) { stats[c[0]] = { n: 0, rev: 0, profit: 0 }; });
  list.forEach(function (f) { var s = stats[UI.firmCat(f.type)]; s.n++; s.rev += f.last.rev || 0; s.profit += f.last.profit || 0; });
  var cats = UI.FIRM_CATS.filter(function (c) { return stats[c[0]].n; });
  var h = '<div class="fcats">' + cats.map(function (c) {
    var s = stats[c[0]];
    return '<button class="fcat' + (cur === c[0] ? ' on' : '') + '" data-act="tab" data-arg="' + key + '|' + c[0] + '"><span class="fcn">' + c[1] + '</span><b>' + s.n + ' firm' + (s.n === 1 ? '' : 's') + '</b>' +
      '<span class="muted">revenue ' + A(s.rev) + '/mo</span><span class="' + (s.profit >= 0 ? 'pos' : 'neg') + '">profit ' + A(s.profit) + '/mo</span></button>';
  }).join('') + '</div>';
  h += UI.tabs(key, [['all', 'All categories (' + list.length + ')']].concat(cats.map(function (c) { return [c[0], c[1] + ' (' + stats[c[0]].n + ')']; })), cur);
  var shown = cur === 'all' ? list : list.filter(function (f) { return UI.firmCat(f.type) === cur; });
  if (cur === 'all') {                                   // all: one table per category, biggest profit first inside each
    return h + cats.map(function (c) {
      var part = shown.filter(function (f) { return UI.firmCat(f.type) === c[0]; });
      return '<div class="box"><h3>' + c[1] + ' · ' + part.length + '</h3>' + UI.firmTable(part) + '</div>';
    }).join('');
  }
  return h + UI.firmTable(shown);
};

/* My Firms: owner and city filters as before, now grouped by category */
UI.R.firms = function () {
  var own = UI.tabState.fown || 'mine', city = UI.tabState.fcity || 'all';
  var h = UI.tabs('fown', [['mine', 'My companies'], ['all', 'All'], ['ai', 'Competitors']], own) + UI.tabs('fcity', [['all', 'All cities']].concat(Object.keys(UAE.CITIES).map(function (k) { return [k, UAE.CITIES[k].name]; })), city);
  var list = UAE.allFirms().filter(function (f) {
    var co = UAE.co(f.owner);
    if (own === 'mine' && co.controller !== 'PLAYER') return false; if (own === 'ai' && co.controller === 'PLAYER') return false;
    return city === 'all' || f.city === city;
  }).sort(function (a, b) { return b.last.profit - a.last.profit; });
  return h + UI.firmsByCategory(list, 'fcat');
};
