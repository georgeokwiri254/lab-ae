/* ============================================================================
 * UAE CAPITALISM LAB  -  CEO INVESTMENT OPTIONS, PORTFOLIO & PERSONALITY BUTTONS
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.ceoInvestBox = function (co) {
  var pol = UAE.policy(co), ceo = UAE.ceoPerson(co), A = UAE.fmt.aed, dis = ceo ? '' : ' disabled', L = co.ceoInvest;
  UAE.investMix(pol); var sp = pol.stockPct, bp = pol.bondPct;
  var h = '<div class="box"><h3>CEO investments</h3>' + (ceo ? '' : '<div class="note">Appoint a CEO (Persons → Appoint as CEO) to use these.</div>') +
    '<label><input type="checkbox" data-ch="execInvEx" data-arg="' + co.id + '"' + (pol.investExcess ? ' checked' : '') + dis + '> Put excess cash to work after expansion: <b>' + bp + '% bonds, ' + sp + '% stocks, the rest 50/50 into our bank and insurer</b> (as capital – keeps a 6-month cash cushion; takes money back if cash runs short)</label>' +
    '<br><label><input type="checkbox" data-ch="execInvSt" data-arg="' + co.id + '"' + (pol.investStocks ? ' checked' : '') + dis + '> Invest in the stock exchange using investment analysis: P/E, fair value vs price, revenue growth, profit trend; sells overvalued or loss-making stocks</label>' +
    '<br><span style="margin-left:26px">Share of the excess for stocks <input type="range" class="slider" min="0" max="100" step="5" value="' + sp + '" data-in="execStockPct" data-arg="' + co.id + '" style="width:180px;vertical-align:middle"> <b id="stockPctOut" class="t-a">' + sp + '%</b></span>' +
    '<br><label><input type="checkbox" data-ch="execInvBd" data-arg="' + co.id + '"' + (pol.investBonds !== false ? ' checked' : '') + dis + '> Invest in the <b>bond market</b> (government &amp; corporate bonds, best yield first; sold first if cash runs short). If no bonds are on offer, that money goes to stocks</label>' +
    '<br><span style="margin-left:26px">Share of the excess for bonds <input type="range" class="slider" min="0" max="100" step="5" value="' + bp + '" data-in="execBondPct" data-arg="' + co.id + '" style="width:180px;vertical-align:middle"> <b id="bondPctOut" class="t-a">' + bp + '%</b></span>' +
    '<br><label style="margin-left:26px"><input type="checkbox" data-ch="execInvGl" data-arg="' + co.id + '"' + (pol.investGlobal !== false ? ' checked' : '') + dis + '> Include <b>global stocks</b> (NYSE / NASDAQ – quality growth companies)</label>' +
    ' <span>global share <input type="range" class="slider" min="0" max="100" step="5" value="' + (pol.globalPct == null ? 40 : pol.globalPct) + '" data-in="execGlobalPct" data-arg="' + co.id + '" style="width:120px;vertical-align:middle"> <b id="globalPctOut" class="t-a">' + (pol.globalPct == null ? 40 : pol.globalPct) + '%</b></span>' +
    '<br><label><input type="checkbox" data-ch="execViaIns" data-arg="' + co.id + '"' + (pol.stocksViaIns !== false ? ' checked' : '') + dis + '> Buy &amp; sell shares through the <b>insurance HQ</b> (its investment portfolio: gains and losses go on the insurer\'s income statement)' + (UAE.hasIns(co) ? '' : ' <span class="muted">– build an Insurance HQ first</span>') + '</label>';
  if (L) h += '<div class="muted" style="margin-top:6px">Last run ' + UAE.cal.label(L.day) + ': cushion ' + A(L.cushion) + ' · excess ' + A(L.excess) + ' · bank +' + A(L.bank) + ' · insurer +' + A(L.ins) + ' · bonds bought ' + A(L.bonds || 0) + (L.bondsSold ? ' (sold ' + A(L.bondsSold) + ')' : '') + ' · stocks bought ' + A(L.stocks) + ' · sold ' + A(L.sold) + '</div>';
  return h + '<div class="row"><button class="btn a" data-act="ceoPortfolio" data-arg="' + co.id + '">📈 Stock portfolio &amp; analysis</button><button class="btn" data-act="ceoInvAll" data-arg="' + co.id + '" title="Copy these CEO investment settings to every company you control">Use these settings for all my companies</button></div></div>';
};
(function () {
  var base = UI.execBox;
  if (base) UI.execBox = function (co) { return base.apply(this, arguments) + UI.ceoInvestBox(co); };
})();
UI.act.execInvEx = function (id, el) { UAE.policy(UAE.co(id)).investExcess = el.checked; UI.toast(el.checked ? 'CEO will put excess cash 50/50 into the bank and insurer each month.' : 'Excess-cash investing off.', 'good'); };
UI.act.execInvSt = function (id, el) { UAE.policy(UAE.co(id)).investStocks = el.checked; UI.toast(el.checked ? 'CEO will invest in the stock market each month.' : 'Stock investing off.', 'good'); };
UI.act.execInvGl = function (id, el) { UAE.policy(UAE.co(id)).investGlobal = el.checked; UI.toast(el.checked ? 'CEO will also buy global (NYSE / NASDAQ) stocks.' : 'UAE stocks only.', 'good'); };
UI.act.execGlobalPct = function (id, el) { UAE.policy(UAE.co(id)).globalPct = +el.value; var o = document.getElementById('globalPctOut'); if (o) o.textContent = el.value + '%'; };
UI.act.ceoInvAll = function (id) {
  var src = UAE.policy(UAE.co(id)), n = 0;
  UAE.allCos().forEach(function (c) {
    if (c.controller !== 'PLAYER' || c.foreign) return; var p = UAE.policy(c);
    ['investExcess', 'investStocks', 'stockPct', 'investBonds', 'bondPct', 'investGlobal', 'globalPct', 'stocksViaIns'].forEach(function (k) { p[k] = src[k]; }); n++;
  });
  UI.toast('CEO investment settings copied to ' + n + ' companies.', 'good'); UI.render();
};
UI.act.execInvBd = function (id, el) { UAE.policy(UAE.co(id)).investBonds = el.checked; UI.toast(el.checked ? 'CEO will buy bonds each month.' : 'Bond investing off - that share goes to stocks.', 'good'); };
UI.act.execBondPct = function (id, el) { UAE.policy(UAE.co(id)).bondPct = +el.value; var o = document.getElementById('bondPctOut'); if (o) o.textContent = el.value + '%'; };
UI.act.execViaIns = function (id, el) { UAE.policy(UAE.co(id)).stocksViaIns = el.checked; };
UI.act.execStockPct = function (id, el) { UAE.policy(UAE.co(id)).stockPct = +el.value; var o = document.getElementById('stockPctOut'); if (o) o.textContent = el.value + '%'; };

/* ---------------------------------------------- portfolio & stock analysis */
UI.act.ceoPortfolio = function (id) { UI.open('Stock portfolio & analysis · ' + UAE.co(id).name, function () { return UI.R.ceoPortfolio(id); }, { push: true }); };
UI.pctS = function (v) { return v == null ? '—' : '<span class="' + (v >= 0 ? 'pos' : 'neg') + '">' + (v >= 0 ? '+' : '') + (v * 100).toFixed(0) + '%</span>'; };
UI.R.ceoPortfolio = function (id) {
  var co = (id && UAE.co(id)) || UAE.player(), A = UAE.fmt.aed, pf = UAE.stockPortfolio(co), L = co.ceoInvest;
  var tv = pf.reduce(function (t, x) { return t + x.value; }, 0), tc = pf.reduce(function (t, x) { return t + x.cost; }, 0);
  var h = '<div class="cards">' + UI.card('Portfolio value', A(tv)) + UI.card('Cost', A(tc)) + UI.card('Unrealised gain', A(tv - tc), tc ? ((tv / tc - 1) * 100).toFixed(1) + '%' : '', tv >= tc ? 'a' : 'm') +
    UI.card('Booked through', UAE.hasIns(co) && UAE.policy(co).stocksViaIns !== false ? 'Insurance HQ' : co.name) + '</div>';
  h += '<div class="box"><h3>Holdings</h3>' + (pf.length ? '<table class="t"><tr><th>Company</th><th class="n">Shares</th><th class="n">Cost</th><th class="n">Value</th><th class="n">Gain</th><th class="n">P/E</th><th class="n">Upside to fair value</th></tr>' + pf.map(function (x) {
    return '<tr class="click" data-act="stockDetail" data-arg="' + x.c.id + '"><td>' + UI.esc(x.c.name) + ' <span class="muted">' + x.c.ticker + '</span></td><td class="n">' + UAE.fmt.num(x.qty) + '</td><td class="n">' + A(x.cost) + '</td><td class="n">' + A(x.value) + '</td><td class="n">' + UI.money(x.gain) + '</td><td class="n">' + (x.a && x.a.pe ? x.a.pe.toFixed(1) : '—') + '</td><td class="n">' + UI.pctS(x.a && x.a.upside) + '</td></tr>';
  }).join('') + '</table>' : '<div class="note">No holdings yet. Tick "Invest in the stock exchange" in HQ → Executive team, or buy on the Stock Market (choose this company as the account).</div>') + '</div>';
  if (L && L.picks && L.picks.length) h += '<div class="box"><h3>CEO trades last month</h3><table class="t"><tr><th>Action</th><th>Company</th><th class="n">Amount</th><th class="n">P/E</th><th class="n">Upside</th><th class="n">Growth</th><th>Why</th></tr>' + L.picks.map(function (p) {
    return '<tr><td>' + (p.action === 'buy' ? '<span class="pos">BUY</span>' : '<span class="neg">SELL</span>') + '</td><td>' + UI.esc(p.name) + (p.global ? ' <span class="pill">global</span>' : '') + '</td><td class="n">' + A(p.amount) + '</td><td class="n">' + (p.pe ? p.pe.toFixed(1) : '—') + '</td><td class="n">' + UI.pctS(p.upside) + '</td><td class="n">' + UI.pctS(p.growth) + '</td><td class="muted">' + (p.why || 'undervalued, profitable, growing') + '</td></tr>';
  }).join('') + '</table></div>';
  var an = UAE.investable(co).map(UAE.stockAnalysis).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 25);
  h += '<div class="box"><h3>Investment analysis – top 25 listed companies</h3><table class="t"><tr><th>Company</th><th class="n">Price</th><th class="n">P/E</th><th class="n">Fair value</th><th class="n">Upside</th><th class="n">Revenue growth / yr</th><th class="n">Profit trend</th><th class="n">PEG</th><th class="n">Score</th><th>Verdict</th></tr>' + an.map(function (a) {
    var buy = UAE.isBuy(a);
    return '<tr class="click" data-act="stockDetail" data-arg="' + a.c.id + '"' + (buy ? ' title="' + UI.esc(UAE.buyReason(a)) + '"' : '') + '><td>' + UI.esc(a.c.name) + (a.c.foreign ? ' <span class="muted">' + a.c.exch + '</span>' : '') + '</td><td class="n">AED ' + a.c.price.toFixed(2) + '</td><td class="n">' + (a.pe ? a.pe.toFixed(1) : 'loss') + '</td><td class="n">' + a.fair.toFixed(2) + '</td><td class="n">' + UI.pctS(a.upside) + '</td><td class="n">' + UI.pctS(a.growth) + '</td><td class="n">' + UI.pctS(a.trend) + '</td><td class="n">' + (a.peg ? a.peg.toFixed(2) : '—') + '</td><td class="n">' + a.score.toFixed(2) + '</td><td>' + (buy ? '<span class="pos">BUY</span>' : a.upside < -0.12 ? '<span class="neg">AVOID</span>' : '<span class="muted">hold</span>') + '</td></tr>';
  }).join('') + '</table><div class="note">Score = upside to fair value (earnings and book value) + half the revenue growth + profit trend + a bonus for a low P/E (below 18) and PEG below 1. UAE stocks: the CEO buys the top value picks with P/E under 30 and at least 8% upside. Global stocks (NYSE / NASDAQ): profitable companies with P/E under 30, priced within 5% of fair value and growing revenue 5%+ a year (a share of the stock budget set by the global slider). Never more than 20% of any company per buyer, and never more than 45% for your whole group (so the CEOs cannot take a company over by accident). Hover a BUY row for the reasons, and sells holdings that turn loss-making, rise 12% above fair value or reach a P/E above 45.</div></div>';
  return h;
};

/* ------------------------------------------------ personality: max buttons */
UI.act.maxPers = function (pid) { var p = UAE.person(pid); UAE.maxPersonality(p); UI.toast(p.name + ': expansion aggressiveness, risk appetite and diversification maxed to 100.', 'good'); UI.render(); };
UI.act.maxPersAll = function () {
  var n = 0; UAE.allCos().forEach(function (c) { var p = c.controller === 'PLAYER' && UAE.ceoPerson(c); if (p) { UAE.maxPersonality(p); n++; } });
  UI.toast('Maxed the personality of ' + n + ' CEO' + (n === 1 ? '' : 's') + ' of your companies.', 'good'); UI.render();
};

/* ------------------------------------------------ capital injection record */
UI.capRecordBox = function (co) {
  var A = UAE.fmt.aed, row = function (label, s) {
    return '<tr><td>' + label + '</td><td class="n pos">' + A(s.ceo) + '</td><td class="n neg">' + A(s.outCeo) + '</td><td class="n"><b>' + A(s.ceoNet) + '</b></td><td class="n">' + A(s.you - s.outYou) + '</td><td class="n">' + A(s.earlier) + '</td><td class="n"><b>' + A(s.funded) + '</b></td></tr>';
  };
  var b = UAE.capSummary(co, 'bank'), i = UAE.capSummary(co, 'ins');
  return '<div class="box"><h3>📒 Capital injection record</h3><table class="t cap-rec"><tr><th>Headquarters</th><th class="n">CEO injected</th><th class="n">CEO took back</th><th class="n">CEO net</th><th class="n">You (net)</th><th class="n">Earlier</th><th class="n">Total now in</th></tr>' +
    row('🏦 Bank HQ' + (UAE.hasBank(co) ? '' : ' <span class="neg">(no HQ)</span>'), b) + row('🛡 Insurance HQ' + (UAE.hasIns(co) ? '' : ' <span class="neg">(no HQ)</span>'), i) +
    '<tr><td><b>Both</b></td><td class="n pos">' + A(b.ceo + i.ceo) + '</td><td class="n neg">' + A(b.outCeo + i.outCeo) + '</td><td class="n"><b>' + A(b.ceoNet + i.ceoNet) + '</b></td><td class="n">' + A(b.you - b.outYou + i.you - i.outYou) + '</td><td class="n">' + A(b.earlier + i.earlier) + '</td><td class="n"><b>' + A(b.funded + i.funded) + '</b></td></tr></table>' +
    '<div class="note">"Earlier" is money that was already in before this record started (from you or the CEO). CEO amounts before then were rebuilt from the news feed. The CEO can never close a Bank or Insurance HQ.</div>' +
    '<div class="row"><button class="btn" data-act="capRecordAll" data-arg="' + co.id + '">See every injection</button></div></div>';
};
(function () {
  var base = UI.ceoInvestBox;
  UI.ceoInvestBox = function (co) { return base.apply(this, arguments) + UI.capRecordBox(co); };
})();
UI.act.capRecordAll = function (id) { UI.open('Capital injection record · ' + UAE.co(id).name, function () { return UI.R.capRecord(id); }, { push: true }); };
UI.R.capRecord = function (id) {
  var co = (id && UAE.co(id)) || UAE.player(), A = UAE.fmt.aed, L = UAE.capLog(co);
  var WHO = { ceo: 'CEO', you: 'You', auto: 'Automatic', earlier: 'Earlier' };
  var h = UI.capRecordBox(co) + '<div class="box"><h3>Every injection and withdrawal (newest first)</h3><table class="t"><tr><th>Date</th><th>Headquarters</th><th>By</th><th class="n">Amount</th><th>Note</th></tr>';
  h += L.list.slice().reverse().map(function (e) {
    return '<tr><td>' + UAE.cal.label(e.day) + '</td><td>' + (e.seg === 'bank' ? '🏦 Bank HQ' : '🛡 Insurance HQ') + '</td><td>' + (WHO[e.by] || e.by) + '</td><td class="n ' + (e.amt >= 0 ? 'pos' : 'neg') + '">' + (e.amt >= 0 ? '+' : '−') + A(Math.abs(e.amt)) + '</td><td class="muted">' + (e.note || (e.amt >= 0 ? 'injected' : 'taken back')) + '</td></tr>';
  }).join('') + '</table>' + (L.list.length ? '' : '<div class="note">No injections yet.</div>') + '</div>';
  return h;
};
