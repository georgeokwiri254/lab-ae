/* ============================================================================
 * UAE CAPITALISM LAB  -  HQ: EXECUTIVE PAY & PERFORMANCE (engine/pay.js)
 *   Pay table (base, revenue bonus, profit share, motivation), raise requests with
 *   Accept / Decline, auto-accept switches for CEO / CMO / CTO, pay settings.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.payBox = function (co) {
  var A = UAE.fmt.aed, pp = UAE.payPol(co), L = co.payLast, ex = UAE.execsOf(co), tgt = UAE.revTarget(co);
  var h = '<div class="box"><h3>💼 Executive pay &amp; performance</h3>' +
    '<div class="note">Executives earn their base salary + a <b>revenue bonus</b> when the month\'s revenue reaches the target + a <b>share of the month\'s profit</b>. ' +
    'Bonuses and profits raise motivation; misses and turned-down raises lower it. Motivated executives work better (CEO builds more, CMO ads and CTO R&amp;D are stronger).</div>';
  h += '<div class="row"><span>Revenue target this month: <b>' + (tgt != null ? A(tgt) : '— (no history yet)') + '</b>' +
    (L ? ' · last month ' + A(L.rev) + ' ' + (L.hit ? '<span class="pos">✔ reached</span>' : L.target != null ? '<span class="neg">✘ missed</span>' : '') + ' · net profit ' + A(L.ni) + ' · paid ' + A(L.total) : '') + '</span></div>';
  if (ex.length) {
    h += '<table class="t nosort"><tr><th>Role</th><th>Name</th><th class="n">Base/mo</th><th class="n">Bonus</th><th class="n">Profit share</th><th class="n">Total</th><th class="n">Motivation</th><th>Raise request</th></tr>' +
      ex.map(function (e) {
        var p = e.p, py = p.pay || {}, r = p.raiseReq, m = Math.round(UAE.motivation(p));
        return '<tr><td><b>' + e.label + '</b></td><td>' + UI.esc(p.name) + '</td><td class="n">' + A(p.salary || 0) + '</td><td class="n">' + A(py.bonus || 0) + '</td><td class="n">' + A(py.profit || 0) + '</td><td class="n">' + A(py.total || 0) + '</td>' +
          '<td class="n"><span class="' + (m >= 60 ? 'pos' : m < 35 ? 'neg' : '') + '">' + m + '</span></td><td>' +
          (r ? '+' + Math.round(r.pct * 100) + '% → ' + A(r.to) + ' <span class="muted">(' + UI.esc(r.why) + ')</span> <button class="btn sm a" data-act="raiseYes" data-arg="' + co.id + '|' + e.role + '">Accept</button><button class="btn sm" data-act="raiseNo" data-arg="' + co.id + '|' + e.role + '">Decline</button>'
            : (p.lastRaise ? '<span class="muted">last raise ' + UAE.cal.label(p.lastRaise.day) + '</span> ' : '') + '<button class="btn sm" data-act="raiseAsk" data-arg="' + co.id + '|' + e.role + '" title="Let this executive ask for a raise now">Ask for raise</button>') + '</td></tr>';
      }).join('') + '</table>';
  } else h += '<div class="muted">No hired executives yet.</div>';
  h += '<div class="row"><b>Auto-accept raises</b> ' + UAE.EXEC_ROLES.map(function (r) {
    return '<label><input type="checkbox" data-ch="payAuto" data-arg="' + co.id + '|' + r[0] + '"' + (pp.autoRaise[r[0]] ? ' checked' : '') + '> ' + r[1] + '</label>';
  }).join(' ') + '</div>';
  h += '<div class="row"><label>Revenue growth target</label><input class="in num" id="payGrow" style="width:50px" value="' + Math.round(pp.revGrowth * 100) + '"> % a year' +
    ' · bonus <input class="in num" id="payBonus" style="width:50px" value="' + Math.round(pp.bonusPct * 100) + '"> % of base' +
    ' · profit share CEO <input class="in num" id="payCeoP" style="width:50px" value="' + +(pp.ceoProfit * 100).toFixed(2) + '"> % others <input class="in num" id="payExP" style="width:50px" value="' + +(pp.execProfit * 100).toFixed(2) + '"> %' +
    ' <button class="btn sm" data-act="paySet" data-arg="' + co.id + '">Set</button></div>' +
    '<div class="muted">Profit share is capped at ' + UAE.PAY.profitCapX + '× base salary a month. Unanswered raise requests count as declined after ' + UAE.PAY.answerDays + ' days.</div>';
  return h + '</div>';
};
(function () {
  var base = UI.execBox;
  if (base) UI.execBox = function (co) { return base.apply(this, arguments) + (UAE.isHuman(co) ? UI.payBox(co) : ''); };
})();
UI.payArg = function (a) { var i = a.lastIndexOf('|'); return { co: UAE.co(a.slice(0, i)), role: a.slice(i + 1) }; };
UI.act.raiseYes = function (a) { var x = UI.payArg(a); UI.result(UAE.raiseAnswer(x.co, x.role, true), 'Raise accepted.'); UI.render(); };
UI.act.raiseNo = function (a) { var x = UI.payArg(a); UI.result(UAE.raiseAnswer(x.co, x.role, false), 'Raise declined.'); UI.render(); };
UI.act.raiseAsk = function (a) {
  var x = UI.payArg(a), r = UAE.askRaise(x.co, x.role, 0.1, 'asked you directly');
  if (!r.ok) UI.toast(r.why, 'bad'); UI.render();
};
UI.act.payAuto = function (a, el) {
  var x = UI.payArg(a), pp = UAE.payPol(x.co); pp.autoRaise[x.role] = el.checked;
  UI.toast(x.role.toUpperCase() + ' raise requests will be ' + (el.checked ? 'accepted automatically.' : 'sent to you.'), 'good');
  var p = x.co[x.role] && UAE.person(x.co[x.role]); if (el.checked && p && p.raiseReq) { UAE.raiseAnswer(x.co, x.role, true, false, true); UI.render(); }
};
UI.act.paySet = function (id) {
  var pp = UAE.payPol(UAE.co(id)), v = function (k, lo, hi) { var n = UI.num(k); return isNaN(n) ? null : Math.max(lo, Math.min(hi, n)) / 100; };
  var g = v('payGrow', -50, 200), b = v('payBonus', 0, 500), c = v('payCeoP', 0, 10), e = v('payExP', 0, 10);
  if (g != null) pp.revGrowth = g; if (b != null) pp.bonusPct = b; if (c != null) pp.ceoProfit = c; if (e != null) pp.execProfit = e;
  UI.toast('Executive pay settings saved.', 'good'); UI.render();
};
