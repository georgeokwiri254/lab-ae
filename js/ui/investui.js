/* ============================================================================
 * UAE CAPITALISM LAB  -  UI: HQ -> Investment analysis & expansion (the CEO's reasons for every new firm)
 * Loaded after panels.js (wraps UI.R.hq).
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.INV_ICON = { factory: '🏭', software: '💾', retail: '🛍', rnd: '🧪', internet: '🌐', apartment: '🏢', commercial: '🏬', hotel: '🏨', mall: '🛒', service: '☕',
  logistics: '🚚', warehouse: '📦', sports: '🏟', tv: '📺', radio: '📻', newspaper: '📰', telecom: '📡', solar: '☀', datacenter: '🖥', bankbranch: '🏦', insoffice: '🛡' };
UI.invName = function (c) {
  var T = UAE.FIRM_TYPES[c.type], P = c.pid && UAE.P[c.pid];
  if (c.entry || c.group === 'entry') return '🧪 Market entry R&D' + (P ? ' · ' + P.name : '');
  return (UI.INV_ICON[c.type] || '🏗') + ' ' + (T ? T.name : c.type) + (P ? ' · ' + P.name : c.type === 'internet' && c.pid ? ' · ' + c.pid : '');
};
UI.invBox = function (co) {
  var A = UAE.fmt.aed, An = UAE.investAnalysis(co), L = co.expLog || [];
  var best = An.list[0], last = L.find(function (x) { return !x.skip; });
  var h = '<div class="box"><h3>🧮 Investment analysis &amp; expansion</h3><div class="cards">' +
    UI.card('Projects that pass', An.list.length + ' of ' + (An.considered || An.list.length), 'payback under ' + UAE.INVEST.hurdleMonths + ' months') +
    UI.card('Best project', best ? UI.invName(best) : '—', best ? A(best.profitM) + '/mo · payback ' + best.payback.toFixed(1) + ' months' : 'nothing pays now') +
    UI.card('Last opening', last ? UI.esc(last.firm) : '—', last ? UAE.cal.label(last.day) : '') +
    UI.card('Analysis date', UAE.cal.label(An.day), 'refreshed monthly') + '</div>' +
    '<div class="row"><button class="btn sm a" data-act="invRun">Re-run analysis now</button><span class="muted">the CEO builds from the top of this list when the company expands (CEO-run companies)</span></div>';
  h += '<table class="t nosort inv-t"><tr><th class="n">#</th><th>Project</th><th class="n">Investment</th><th class="n">Revenue / mo</th><th class="n">Running cost / mo</th><th class="n">Profit / mo</th><th class="n">Margin</th><th class="n">Necessity</th><th class="n">World share</th><th class="n">Payback</th></tr>' +
    An.list.slice(0, 15).map(function (c, i) {
      return '<tr' + (c.done ? ' class="sub"' : '') + '><td class="n">' + (i + 1) + '</td><td><b>' + UI.esc(UI.invName(c)) + '</b>' + (c.need > 1 ? ' <span class="muted">×' + c.need + '</span>' : '') + (c.done ? ' <span class="t-a">built</span>' : '') + '</td>' +
        '<td class="n">' + A(c.invest) + '</td><td class="n">' + A(c.revM) + '</td><td class="n">' + A(c.fixedM + c.varM) + '</td><td class="n pos">' + A(c.profitM) + '</td>' +
        '<td class="n">' + UI.pc(c.margin, 0) + '</td><td class="n">' + UI.pc(c.nec, 0) + '</td><td class="n">' + (c.share != null ? UI.pc(c.share, 2) : '—') + '</td><td class="n">' + c.payback.toFixed(1) + ' mo</td></tr>' +
        '<tr class="sub"><td></td><td colspan="9" class="muted" style="white-space:normal">' + UI.esc(c.why) + '</td></tr>';
    }).join('') + '</table>' +
    '<div class="note"><b>How the CEO decides:</b> every factory product, software title, store, business type and R&amp;D option is costed: price vs unit cost (margin), demand still open to the company (UAE + world), market share it can win, necessity (how much people need it), running costs (staff, electricity, R&amp;D programme) and the investment. ' +
    'Score = monthly profit × necessity × margin, discounted by payback. Only projects that pay back within ' + UAE.INVEST.hurdleMonths + ' months and fit 25% of cash are built - otherwise the cash is kept. ' +
    '<b>R&amp;D</b> loses money on its own, so it is judged by the <b>tech-lead bonus</b>: extra world tech index → more world share and higher prices for products already sold abroad. R&amp;D centres are never closed as loss-makers.</div></div>';
  h += '<div class="box"><h3>Expansion log · why each firm was opened</h3>' + (L.length ? '<table class="t inv-log"><tr><th>Date</th><th>Industry · product / firm</th><th class="n">Investment</th><th class="n">Expected profit / mo</th><th class="n">Payback</th><th>Reason</th></tr>' +
    L.slice(0, 25).map(function (x) {
      if (x.skip) return '<tr><td>' + UAE.cal.label(x.day) + '</td><td class="muted">nothing</td><td></td><td></td><td></td><td class="muted" style="white-space:normal">' + UI.esc(x.why) + '</td></tr>';
      return '<tr><td>' + UAE.cal.label(x.day) + '</td><td><b>' + UI.esc(UI.invName(x)) + '</b><br>' + (UAE.firm(x.fid) ? '<a data-act="openFirm" data-arg="' + x.fid + '">' + UI.esc(UAE.firm(x.fid).name) + '</a>' + (x.up ? ' <span class="muted">(upgrade)</span>' : '') : UI.esc(x.firm)) + '</td><td class="n">' + A(x.invest) + '</td><td class="n">' + A(x.profitM) + '</td><td class="n">' + (x.payback || 0).toFixed(1) + ' mo</td><td class="muted" style="white-space:normal">' + UI.esc(x.why) + '</td></tr>';
    }).join('') + '</table>' : '<div class="note">No expansion yet since the analysis was introduced.</div>') + '</div>';
  return h;
};
UI.act.invRun = function () { UAE.investAnalysis(UAE.player(), true); UI.toast('Investment analysis updated.', 'good'); UI.render(); };
UI._hqBase = UI._hqBase || UI.R.hq;
UI.R.hq = function () { return UI._hqBase() + UI.invBox(UAE.player()); };
