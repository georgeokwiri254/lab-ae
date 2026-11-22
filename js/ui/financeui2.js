/* ============================================================================
 * UAE CAPITALISM LAB  -  BANK & INSURER DIVISION SCREENS
 * Tabs on the Bank HQ / Insurance HQ dashboards: Overview | Balance Sheet |
 * Income Statement | Loans by rating (bank) / Risk classes (insurer) | Capital.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI._bankOverview = UI._bankOverview || UI.bankBox;
UI._insOverview = UI._insOverview || UI.insBox;
UI.stmtTable = function (rows) {   // rows: [label, value, note, bold]
  return '<table class="t">' + rows.map(function (r) {
    if (r === '-') return '<tr><td colspan="3"><hr class="divider"></td></tr>';
    return '<tr><td>' + (r[3] ? '<b>' + r[0] + '</b>' : r[0]) + '</td><td class="n ' + (r[1] < 0 ? 'neg' : '') + '">' + (r[3] ? '<b>' + UAE.fmt.aed(r[1]) + '</b>' : UAE.fmt.aed(r[1])) + '</td><td class="muted">' + (r[2] || '') + '</td></tr>';
  }).join('') + '</table>';
};

/* ------------------------------------------------------------------ bank */
UI.bankBox = function (f, mine) {
  var co = UAE.co(f.owner), tab = UI.tabState.bkTab || 'ov';
  UAE.bankSeg(co);
  var h = UI.tabs('bkTab', [['ov', 'Overview'], ['bs', 'Balance sheet'], ['is', 'Income statement'], ['loans', 'Loans by rating'], ['intl', '🌍 International'], ['cap', 'Capital: inject / withdraw']], tab);
  if (tab === 'ov') return h + UI._bankOverview(f, mine);
  if (tab === 'bs') return h + UI.bankBS(co);
  if (tab === 'is') return h + UI.bankIS(co);
  if (tab === 'loans') return h + UI.bankLoansBox(co, mine);
  if (tab === 'intl') return h + UI.bankIntlBox(co, mine);
  return h + UI.bankCapBox(co, mine);
};
UI.bankBS = function (co) {
  var B = UAE.bankSeg(co), cash = UAE.bankCash(co), eq = UAE.bankEquity(co), cur = UAE.monthPL(UAE.bankFirms(co));
  return '<div class="box"><h3>🏦 Bank balance sheet · ' + UAE.cal.label() + '</h3>' + UI.stmtTable([
    ['Cash &amp; central-bank reserves', cash, 'must be ≥ 7% of deposits (' + UAE.fmt.aed(co.bs.custDeposits * UAE.BANK.reserve) + ')'],
    ['Corporate &amp; SME loans', B.book.corp], ['Mortgages', B.book.mort], ['Personal loans &amp; cards', B.book.cons], ['Loans to game companies', B.game],
    ['Total assets', cash + UAE.bankLoans(co), '', true], '-',
    ['Customer deposits', co.bs.custDeposits, 'owed to savers'], ['Total liabilities', co.bs.custDeposits, '', true], '-',
    ['Capital injected by ' + UI.esc(co.name), B.capital, 'net of withdrawals'], ['Retained profits', B.retained, 'kept from past months'], ['Profit this month so far', cur],
    ['Bank equity', eq, 'capital adequacy ' + (UAE.bankCAR(co) * 100).toFixed(1) + '%', true], ['Liabilities + equity', co.bs.custDeposits + eq, 'equals total assets', true]
  ]) + '<div class="note">The bank is a ring-fenced division with its own money: its lending limits use the bank\'s equity and cash, not the whole group\'s. Move money in or out on the Capital tab.</div></div>';
};
UI.bankIS = function (co) {
  var B = UAE.bankSeg(co), mm = B.is.months, last = mm[mm.length - 1] || {}, y = B.is.ytd || {}, c = B.cur || {};
  var col = function (r) {
    var rev = (r.intInc || 0) + (r.gameInt || 0) + (r.treas || 0), nii = rev - (r.intExp || 0), fee = (r.fees || 0) + (r.brokerage || 0) + (r.underwriting || 0);
    return [rev, r.intExp || 0, nii, fee, nii + fee, r.prov || 0, r.opex || 0, r.net != null ? r.net : nii + fee - (r.prov || 0) - (r.opex || 0)];
  };
  var cols = [['This month (so far)', col(c)], ['Last month', col(last)], ['Year to date', col(y)]];
  var labels = ['Interest earned (loans, game-company loans, treasury)', '− Interest paid to depositors', '= Net interest income', '+ Fees, brokerage &amp; underwriting', '= Operating income', '− Bad-loan provisions', '− Operating costs (staff, buildings, power)', '= Net profit'];
  var h = '<div class="box"><h3>🏦 Bank income statement</h3><table class="t"><tr><th>Line</th>' + cols.map(function (x) { return '<th class="n">' + x[0] + '</th>'; }).join('') + '</tr>';
  labels.forEach(function (l, i) { var bold = l.charAt(0) === '='; h += '<tr><td>' + (bold ? '<b>' + l + '</b>' : l) + '</td>' + cols.map(function (x) { var v = x[1][i] * (l.charAt(0) === '−' ? -1 : 1); return '<td class="n ' + (v < 0 ? 'neg' : '') + '">' + (bold ? '<b>' + UAE.fmt.aed(v) + '</b>' : UAE.fmt.aed(v)) + '</td>'; }).join('') + '</tr>'; });
  h += '</table>';
  if (mm.length) h += '<h4>Monthly net profit</h4><canvas class="chart" id="bkIsC" style="height:120px"></canvas>';
  UI.after(function () { var cv = UI.$('bkIsC'); if (cv) UI.chart(cv, [{ label: 'Net profit', data: mm.map(function (m) { return m.net; }), color: '#b8ff2c' }], { bars: true, fmt: function (v) { return UAE.fmt.num(v); } }); });
  return h + '<div class="note">This month\'s column fills in day by day; the books close at month end.</div></div>';
};
UI.bankLoansBox = function (co, mine) {
  var B = UAE.bankSeg(co), r = B.rates, dis = mine ? '' : ' disabled', A = UAE.fmt.aed;
  var seg = function (key, title, book, base) {
    var g = UAE.gradeMix(B, key), h = '<h4>' + title + ' · ' + A(book) + '</h4><table class="t"><tr><th>Rating</th><th class="n">Share</th><th class="n">Outstanding</th><th class="n">Rate %</th><th class="n">Default risk / yr</th><th class="n">Expected loss / yr</th></tr>';
    g.rows.forEach(function (x) { h += '<tr' + (x.share ? '' : ' class="muted"') + '><td><b>' + x.g + '</b></td><td class="n">' + (x.share * 100).toFixed(0) + '%</td><td class="n">' + A(book * x.share) + '</td><td class="n">' + ((base + x.addOn) * 100).toFixed(2) + '</td><td class="n">' + (x.pd * 100).toFixed(2) + '%</td><td class="n">' + A(book * x.share * x.pd) + '</td></tr>'; });
    return h + '</table><div class="muted">' + (g.eligible * 100).toFixed(0) + '% of borrowers in this market qualify under your minimum rating.</div>';
  };
  var h = '<div class="box"><h3>Loan book by credit rating</h3><div class="row"><label>Lend to companies rated</label><select class="in" data-ch="bkMinGrade" data-arg="' + co.id + '"' + dis + '>' +
    UAE.GRADES.corp.map(function (g, i) { return '<option value="' + i + '"' + ((B.minGrade == null ? 5 : B.minGrade) === i ? ' selected' : '') + '>' + g[0] + ' or better</option>'; }).join('') + '</select>' +
    '<label style="min-width:0;margin-left:14px">Personal loans to</label><select class="in" data-ch="bkMinCons" data-arg="' + co.id + '"' + dis + '>' +
    UAE.GRADES.cons.map(function (g, i) { return '<option value="' + i + '"' + ((B.minCons == null ? 2 : B.minCons) === i ? ' selected' : '') + '>' + g[0] + (i ? ' or better' : ' only') + '</option>'; }).join('') + '</select></div>';
  h += seg('corp', 'Corporate &amp; SME loans', B.book.corp, r.corp) + seg('cons', 'Personal loans &amp; cards', B.book.cons, r.cons);
  h += '<h4>Mortgages · ' + A(B.book.mort) + '</h4><div class="muted">Secured on homes: rate ' + (r.mort * 100).toFixed(2) + '%, default risk ~0.3% a year, half risk-weight.</div>';
  var gl = []; UAE.allCos().forEach(function (b) { (b.loanList || []).forEach(function (l) { if (l.bank === co.id && l.amt > 0) gl.push({ b: b, l: l }); }); });
  h += '<h4>Loans to game companies · ' + A(B.game) + '</h4>' + (gl.length ? '<table class="t"><tr><th>Borrower</th><th>Rating</th><th class="n">Outstanding</th><th class="n">Rate</th><th>Repaid by</th></tr>' + gl.sort(function (a, b) { return b.l.amt - a.l.amt; }).slice(0, 40).map(function (x) {
    return '<tr><td>' + UI.coLink(x.b) + '</td><td><b>' + (x.b.credit || 'A') + '</b></td><td class="n">' + A(x.l.amt) + '</td><td class="n">' + (x.l.rate * 100).toFixed(2) + '%</td><td>' + (x.l.until ? UAE.cal.label(x.l.until) : '—') + '</td></tr>';
  }).join('') + '</table>' : '<div class="muted">None yet – when companies borrow, the cheapest bank with room lends. Lower your corporate rate to win more.</div>');
  return h + '<div class="note">Higher-rated borrowers pay less and rarely default; lower ratings pay more but default more often. Your risk appetite (Overview) shifts the mix; the minimum rating cuts off weaker borrowers (safer, but a smaller market).</div></div>';
};
UI.bankCapBox = function (co, mine) {
  var B = UAE.bankSeg(co), eq = UAE.bankEquity(co), rw = UAE.riskWeighted(co), A = UAE.fmt.aed, dis = mine ? '' : ' disabled';
  var maxW = UAE.bankMaxWithdraw(co), free = UAE.groupFreeCash(co);
  return '<div class="box"><h3>Bank capital</h3><div class="cards">' + UI.card('Bank equity', A(eq), 'capital ' + A(B.capital) + ' + retained ' + A(B.retained)) +
    UI.card('Capital adequacy', (UAE.bankCAR(co) * 100).toFixed(1) + '%', 'minimum 13%', UAE.bankCAR(co) >= 0.13 ? 'a' : 'm') +
    UI.card('Money you injected', A(B.funded || 0), 'moved out of company cash') + UI.card('Can withdraw up to', A(maxW), 'injected money only · keeps CAR ≥ 13%') + UI.card(UI.esc(co.name) + ' cash', A(co.bs.cash), A(free) + ' available to inject') + '</div>' +
    '<div class="row"><label>Amount (AED)</label><input class="in num" id="bkCapAmt" value="1bn"' + dis + '><button class="btn a" data-act="bkCap" data-arg="' + co.id + '|in"' + dis + '>⬆ Inject into bank</button><button class="btn m" data-act="bkCap" data-arg="' + co.id + '|out"' + dis + '>⬇ Withdraw to ' + UI.esc(co.name) + '</button></div>' +
    '<div class="note">Injecting moves money out of ' + UI.esc(co.name) + '’s cash into the bank (it shows on the company balance sheet under Investments). More capital lets the bank lend more (each AED of equity supports ~7.7 AED of risk-weighted loans). You can withdraw money you injected, while the bank stays above the minimums. The bank’s monthly profits already go into the company’s cash every day, so they never need withdrawing.</div></div>';
};
UI.act.bkCap = function (arg) {
  var p = arg.split('|'), co = UAE.co(p[0]), v = UI.num('bkCapAmt');
  if (!(v > 0)) { UI.toast('Enter an amount like 500m or 2bn.', 'bad'); return; }
  UI.result(UAE.bankCapital(co, p[1] === 'in' ? v : -v, 'you'), (p[1] === 'in' ? 'Injected ' : 'Withdrew ') + UAE.fmt.aed(v) + (p[1] === 'in' ? ' into the bank.' : ' from the bank.'));
};
UI.act.bkMinGrade = function (id, el) { UAE.bankOf(UAE.co(id)).minGrade = +el.value; UI.render(); };
UI.act.bkMinCons = function (id, el) { UAE.bankOf(UAE.co(id)).minCons = +el.value; UI.render(); };

/* ------------------------------------------------------------- insurance */
UI.insBox = function (f, mine) {
  var co = UAE.co(f.owner), tab = UI.tabState.inTab || 'ov';
  UAE.insSeg(co);
  var h = UI.tabs('inTab', [['ov', 'Overview'], ['bs', 'Balance sheet'], ['is', 'Income statement'], ['risk', 'Risk classes'], ['inv', 'Stock investments'], ['cap', 'Capital: inject / withdraw']], tab);
  if (tab === 'ov') return h + UI._insOverview(f, mine);
  if (tab === 'bs') return h + UI.insBS(co);
  if (tab === 'is') return h + UI.insIS(co);
  if (tab === 'risk') return h + UI.insRisk(co, mine);
  if (tab === 'inv') return h + UI.insStocks(co);
  return h + UI.insCapBox(co, mine);
};
UI.insBS = function (co) {
  var I = UAE.insSeg(co), res = UAE.insReserves(co), eq = UAE.insEquity(co);
  return '<div class="box"><h3>🛡 Insurer balance sheet · ' + UAE.cal.label() + '</h3>' + UI.stmtTable([
    ['Cash &amp; investments (the float)', res + eq, 'earns interest until claims are paid'], ['Total assets', res + eq, '', true], '-',
    ['Unearned premiums &amp; claims reserves', res, 'owed to policyholders'], ['Total liabilities', res, '', true], '-',
    ['Capital injected by ' + UI.esc(co.name), I.capital], ['Retained profits', I.retained], ['Profit this month so far', UAE.monthPL(UAE.insFirms(co))],
    ['Insurer equity', eq, 'solvency ' + (UAE.insSolvency(co) * 100).toFixed(0) + '% (minimum 15%)', true], ['Liabilities + equity', res + eq, 'equals total assets', true]
  ]) + '</div>';
};
UI.insIS = function (co) {
  var I = UAE.insSeg(co), mm = I.is.months, last = mm[mm.length - 1] || {}, y = I.is.ytd || {}, c = I.cur || {};
  var col = function (r) { var net = (r.gwp || 0) - (r.ceded || 0), cl = (r.claims || 0) - (r.recovered || 0), uw = net - cl - (r.comm || 0) - (r.opex || 0);
    return [r.gwp || 0, r.ceded || 0, net, r.claims || 0, r.recovered || 0, r.comm || 0, r.opex || 0, uw, r.invest || 0, r.trade || 0, r.net != null ? r.net : uw + (r.invest || 0) + (r.trade || 0)]; };
  var cols = [['This month (so far)', col(c)], ['Last month', col(last)], ['Year to date', col(y)]];
  var labels = ['Gross premiums written', '− Premiums passed to reinsurers', '= Net premiums', '− Claims', '+ Claims recovered from reinsurers', '− Sales commission', '− Operating costs', '= Underwriting result', '+ Investment income on the float', '+ Gains / losses on shares & bonds traded', '= Net profit'];
  var h = '<div class="box"><h3>🛡 Insurer income statement</h3><table class="t"><tr><th>Line</th>' + cols.map(function (x) { return '<th class="n">' + x[0] + '</th>'; }).join('') + '</tr>';
  labels.forEach(function (l, i) { var bold = l.charAt(0) === '='; h += '<tr><td>' + (bold ? '<b>' + l + '</b>' : l) + '</td>' + cols.map(function (x) { var v = x[1][i] * (l.charAt(0) === '−' ? -1 : 1); return '<td class="n ' + (v < 0 ? 'neg' : '') + '">' + (bold ? '<b>' + UAE.fmt.aed(v) + '</b>' : UAE.fmt.aed(v)) + '</td>'; }).join('') + '</tr>'; });
  return h + '</table></div>';
};
UI.insRisk = function (co, mine) {
  var I = UAE.insSeg(co), St = UAE.INS.standards, cur = I.standard || 'normal', dis = mine ? '' : ' disabled', mix = St[cur].mix;
  var cls = [['Low risk', 0.7, 'careful drivers, healthy, sprinklers, young buildings'], ['Standard', 1.0, 'typical customers'], ['High risk', 1.6, 'young drivers, health conditions, older buildings']];
  var h = '<div class="box"><h3>Risk classes &amp; underwriting</h3><div class="row"><label>Underwriting standard</label><select class="in" data-ch="insStd" data-arg="' + co.id + '"' + dis + '>' +
    [['strict', 'Strict – fewer, safer customers'], ['normal', 'Normal'], ['loose', 'Loose – accept almost everyone']].map(function (o) { return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
  h += '<table class="t"><tr><th>Risk class</th><th class="n">Share of customers</th><th class="n">Claims vs average</th><th>Typical customer</th></tr>' + cls.map(function (c, i) {
    return '<tr><td><b>' + c[0] + '</b></td><td class="n">' + mix[i] + '%</td><td class="n">' + (c[1] * 100).toFixed(0) + '%</td><td class="muted">' + c[2] + '</td></tr>'; }).join('') + '</table>';
  return h + '<div class="cards">' + UI.card('Customers won vs normal', (St[cur].share * 100).toFixed(0) + '%') + UI.card('Claims vs normal', (St[cur].loss * 100).toFixed(0) + '%') + '</div>' +
    '<div class="note">Strict underwriting turns away high-risk customers: fewer premiums but much lower claims. Loose underwriting grows fast but claims rise.</div></div>';
};
UI.insCapBox = function (co, mine) {
  var I = UAE.insSeg(co), A = UAE.fmt.aed, dis = mine ? '' : ' disabled', maxW = UAE.insMaxWithdraw(co);
  return '<div class="box"><h3>Insurer capital</h3><div class="cards">' + UI.card('Insurer equity', A(UAE.insEquity(co)), 'capital ' + A(I.capital) + ' + retained ' + A(I.retained)) +
    UI.card('Solvency', (UAE.insSolvency(co) * 100).toFixed(0) + '%', 'minimum 15%', UAE.insSolvency(co) >= 0.15 ? 'a' : 'm') + UI.card('Money you injected', A(I.funded || 0)) + UI.card('Can withdraw up to', A(maxW), 'injected money only') + UI.card(UI.esc(co.name) + ' cash', A(co.bs.cash), A(UAE.groupFreeCash(co)) + ' available to inject') + '</div>' +
    '<div class="row"><label>Amount (AED)</label><input class="in num" id="inCapAmt" value="500m"' + dis + '><button class="btn a" data-act="inCap" data-arg="' + co.id + '|in"' + dis + '>⬆ Inject into insurer</button><button class="btn m" data-act="inCap" data-arg="' + co.id + '|out"' + dis + '>⬇ Withdraw to ' + UI.esc(co.name) + '</button></div></div>';
};
UI.act.inCap = function (arg) {
  var p = arg.split('|'), co = UAE.co(p[0]), v = UI.num('inCapAmt');
  if (!(v > 0)) { UI.toast('Enter an amount like 500m.', 'bad'); return; }
  UI.result(UAE.insCapital(co, p[1] === 'in' ? v : -v, 'you'), (p[1] === 'in' ? 'Injected ' : 'Withdrew ') + UAE.fmt.aed(v) + (p[1] === 'in' ? ' into the insurer.' : ' from the insurer.'));
};
/* account picker for share / bond trades: personal, parent, subsidiaries or the insurer */
UI.accountSelect = function (id, excludeCoId, selected) {
  return '<select class="in" id="' + id + '">' + UAE.tradeAccounts(excludeCoId).map(function (a) { return '<option value="' + a.key + '"' + (a.key === selected ? ' selected' : '') + '>' + UI.esc(a.label) + '</option>'; }).join('') + '</select>';
};
UI.act.insStd = function (id, el) { UAE.insSeg(UAE.co(id)).standard = el.value; UI.toast('Underwriting standard: ' + el.value + '.', 'good'); UI.render(); };

/* ------------------------------------------ CEO: firms per month slider */
UI.act.execMaxNew = function (id, el) {
  var v = +el.value, pol = UAE.policy(UAE.co(id)); pol.maxNewPerMonth = v;
  var out = document.getElementById('maxNewOut'); if (out) out.textContent = v;
};
UI.act.execMaxNewDone = function (id, el) { UAE.policy(UAE.co(id)).maxNewPerMonth = +el.value; UI.toast('CEO may now create up to ' + el.value + ' new firms a month (plus normal moves).', 'good'); };

/* Insurance HQ: the shares the company trades through its insurer (its investment portfolio). */
UI.insStocks = function (co) {
  var A = UAE.fmt.aed, I = UAE.insSeg(co), via = UAE.policy(co).stocksViaIns !== false, pf = UAE.stockPortfolio ? UAE.stockPortfolio(co) : [];
  var tv = 0, tc = 0, gl = 0; pf.forEach(function (x) { tv += x.value; tc += x.cost; if (x.c.foreign) gl += x.value; });
  var mm = (I.is && I.is.months) || [], ytd = (I.is && I.is.ytd) || {}, cur = I.cur || {};
  var h = '<div class="cards">' + UI.card('Portfolio value', A(tv)) + UI.card('Cost', A(tc)) + UI.card('Unrealised gain', A(tv - tc), tc ? ((tv / tc - 1) * 100).toFixed(1) + '%' : '', tv >= tc ? 'a' : 'm') +
    UI.card('Realised trading gains', A((ytd.trade || 0) + (cur.trade || 0)), 'this year, on the insurer\'s income statement') + UI.card('Global share', tv ? Math.round(gl / tv * 100) + '%' : '—', 'NYSE / NASDAQ') + '</div>';
  if (!via) h += '<div class="note">Trades are booked at ' + UI.esc(co.name) + ', not the insurer: tick "Buy &amp; sell shares through the insurance HQ" in HQ → Executive team.</div>';
  h += '<div class="box"><h3>🛡 Shares held through the insurer</h3>' + (pf.length ? '<table class="t"><tr><th>Company</th><th>Exchange</th><th class="n">Shares</th><th class="n">Cost</th><th class="n">Value</th><th class="n">Gain</th><th class="n">P/E</th></tr>' + pf.map(function (x) {
    return '<tr class="click" data-act="stockDetail" data-arg="' + x.c.id + '"><td>' + UI.esc(x.c.name) + ' <span class="muted">' + x.c.ticker + '</span></td><td>' + (x.c.exch || '') + '</td><td class="n">' + UAE.fmt.num(x.qty) + '</td><td class="n">' + A(x.cost) + '</td><td class="n">' + A(x.value) + '</td><td class="n">' + UI.money(x.gain) + '</td><td class="n">' + (x.a && x.a.pe ? x.a.pe.toFixed(1) : '—') + '</td></tr>';
  }).join('') + '</table>' : '<div class="note">No shares yet. The CEO buys them each month when "Invest in the stock exchange" is ticked (HQ → Executive team).</div>') +
    '<div class="row"><button class="btn a" data-act="ceoPortfolio" data-arg="' + co.id + '">📈 Full analysis &amp; CEO trades</button></div></div>';
  return h;
};

/* ============================================================================
 * Company income statement & balance sheet: the bank and the insurer shown separately
 * (segment results), reconciled to the company's own totals.
 * ==========================================================================*/
/** One segment's income lines for the chosen period (cur / last / ytd / ttm / ly). */
UI.segPeriod = function (seg, per, liveNet) {
  var mm = (seg.is && seg.is.months) || [], c = seg.cur || {}, add = function (a, b) { var o = {}; [a, b].forEach(function (r) { for (var k in r) if (k !== 'day') o[k] = (o[k] || 0) + (r[k] || 0); }); return o; };
  if (per === 'cur') { var r = Object.assign({}, c); r.net = liveNet; return r; }
  if (per === 'last') return mm[mm.length - 1] || null;
  if (per === 'ytd') { var y = add(seg.is.ytd || {}, c); y.net = ((seg.is.ytd || {}).net || 0) + liveNet; return y; }
  if (per === 'ttm') return mm.slice(-12).reduce(function (t, m) { return add(t, m); }, {});
  return null;                                   // last closed year: divisions keep monthly books only
};
UI.segBank = function (r) {
  var rev = (r.intInc || 0) + (r.gameInt || 0) + (r.treas || 0), fee = (r.fees || 0) + (r.brokerage || 0) + (r.underwriting || 0);
  return { rev: rev, intExp: r.intExp || 0, fee: fee, prov: r.prov || 0, opex: r.opex || 0, net: r.net != null ? r.net : rev - (r.intExp || 0) + fee - (r.prov || 0) - (r.opex || 0) };
};
UI.segIns = function (r) {
  var prem = (r.gwp || 0) - (r.ceded || 0), cl = (r.claims || 0) - (r.recovered || 0);
  return { gwp: r.gwp || 0, prem: prem, claims: cl, costs: (r.comm || 0) + (r.opex || 0), uw: prem - cl - (r.comm || 0) - (r.opex || 0), invest: r.invest || 0, trade: r.trade || 0,
    net: r.net != null ? r.net : prem - cl - (r.comm || 0) - (r.opex || 0) + (r.invest || 0) + (r.trade || 0) };
};
UI.segmentIS = function (co) {
  var per = UI.tabState.period || 'ytd', P = UI.periodData(co, per), is = P.is, pbt = UAE.pbt(is), ni = UAE.netIncome(is);
  var hasB = !!(co.bank && (UAE.bankFirms(co).length || (co.bank.is && co.bank.is.months.length))), hasI = !!(co.ins && (UAE.insFirms(co).length || (co.ins.is && co.ins.is.months.length)));
  if (!hasB && !hasI) return '';
  var row = function (label, v, cls) { return '<tr class="' + (cls || '') + '"><td>' + label + '</td><td class="n">' + (v == null ? '—' : UI.money(v)) + '</td></tr>'; };
  var h = '<div class="box"><h3>Bank &amp; insurance results · ' + P.label + '</h3><table class="t fs">', bn = 0, inn = 0, none = false;
  if (hasB) {
    var rb = UI.segPeriod(UAE.bankSeg(co), per, UAE.monthPL(UAE.bankFirms(co)));
    if (!rb) none = true; else {
      var b = UI.segBank(rb); bn = b.net;
      h += '<tr class="h"><td colspan="2">🏦 Bank</td></tr>' + row('Interest earned (loans, game-company loans, treasury)', b.rev) + row('Interest paid to depositors', -b.intExp) +
        row('Fees, brokerage &amp; underwriting', b.fee) + row('Bad-loan provisions', -b.prov) + row('Operating costs (staff, buildings, power)', -b.opex) + row('Bank profit', b.net, 'total');
    }
  }
  if (hasI) {
    var I = UAE.insSeg(co), ri = UI.segPeriod(I, per, UAE.monthPL(UAE.insFirms(co)) + ((I.cur && I.cur.trade) || 0));
    if (!ri) none = true; else {
      var x = UI.segIns(ri); inn = x.net;
      h += '<tr class="h"><td colspan="2">🛡 Insurance</td></tr>' + row('Gross premiums written', x.gwp) + row('Net premiums (after reinsurance)', x.prem) + row('Claims (net of reinsurance)', -x.claims) +
        row('Sales commission &amp; operating costs', -x.costs) + row('Underwriting result', x.uw, 'sub') + row('Investment income on the float', x.invest) +
        row('Gains / losses on shares traded through the insurer', x.trade) + row('Insurance profit', x.net, 'total');
    }
  }
  if (none) return h + '</table><div class="note">The bank and insurer keep monthly books only, so there is no split for a closed year. Choose Month to date, Last month, Year to date or TTM.</div></div>';
  h += '<tr class="h"><td colspan="2">How they add up</td></tr>' + (hasB ? row('Bank profit', bn) : '') + (hasI ? row('Insurance profit', inn) : '') +
    row('Rest of the company (all other businesses, HQ, interest, other investments)', pbt - bn - inn) + row('= Profit before tax', pbt, 'total') + row('UAE corporate tax', -is.tax) + row('= NET PROFIT', ni, 'total') + '</table>' +
    '<div class="note">The bank and insurer are part of ' + UI.esc(co.name) + ', so their revenue and costs are already inside the lines above. This section shows them on their own. Their profits are before corporate tax, which is paid by the whole company.</div></div>';
  return h;
};
UI.segmentBS = function (co) {
  var b = co.bs, hasB = !!co.bank && (b.loanBook || b.custDeposits || co.bank.capital), hasI = !!co.ins && (co.ins.capital || UAE.insFirms(co).length);
  var row = function (label, v, cls) { return '<tr class="' + (cls || '') + '"><td>' + label + '</td><td class="n">' + UI.money(v) + '</td></tr>'; };
  var pf = UAE.stockPortfolio ? UAE.stockPortfolio(co) : [], pCost = 0, pVal = 0; pf.forEach(function (x) { pCost += x.cost; pVal += x.value; });
  var bF = (co.bank && co.bank.funded) || 0, iF = (co.ins && co.ins.funded) || 0;
  var h = '<div class="box"><h3>What the investments are</h3><table class="t fs">' + row('Capital injected into the bank', bF) + row('Capital injected into the insurer', iF) +
    row('Shares bought on the stock market (at cost)', pCost) + row('Other investments (bonds, subsidiaries, stakes)', b.invest - bF - iF - pCost) + row('= Investments on the balance sheet', b.invest, 'total') +
    (pf.length ? row('Shares at today\'s market value', pVal, 'sub') + row('Unrealised gain on shares', pVal - pCost, 'sub') : '') + '</table></div>';
  if (hasB) {
    var B = UAE.bankSeg(co), loans = UAE.bankLoans(co), eqB = UAE.bankEquity(co);
    h += '<div class="box"><h3>🏦 Bank balance sheet</h3><table class="t fs"><tr class="h"><td colspan="2">Assets</td></tr>' + row('Loans to customers', loans) + row('Cash &amp; liquid assets', UAE.bankCash(co)) +
      row('TOTAL BANK ASSETS', loans + UAE.bankCash(co), 'total') + '<tr class="h"><td colspan="2">Liabilities &amp; equity</td></tr>' + row('Customer deposits', b.custDeposits || 0) +
      row('Capital injected by ' + UI.esc(co.name), B.capital) + row('Retained profits', B.retained) + row('Profit this month so far', UAE.monthPL(UAE.bankFirms(co))) + row('Bank equity', eqB, 'total') +
      row('LIABILITIES + EQUITY', (b.custDeposits || 0) + eqB, 'total') + '</table><div class="note">Capital ratio ' + (UAE.bankCAR ? (UAE.bankCAR(co) * 100).toFixed(1) + '% (minimum 13%)' : '') + '.</div></div>';
  }
  if (hasI) {
    var I = UAE.insSeg(co), res = UAE.insReserves(co), eqI = UAE.insEquity(co);
    h += '<div class="box"><h3>🛡 Insurance balance sheet</h3><table class="t fs"><tr class="h"><td colspan="2">Assets</td></tr>' + row('Cash &amp; investments (the float)', res + eqI) +
      row('TOTAL INSURANCE ASSETS', res + eqI, 'total') +
      '<tr class="h"><td colspan="2">Liabilities &amp; equity</td></tr>' + row('Unearned premiums &amp; claims reserves (owed to policyholders)', res) + row('Capital injected by ' + UI.esc(co.name), I.capital) +
      row('Retained profits', I.retained) + row('Profit this month so far', UAE.monthPL(UAE.insFirms(co)) + ((I.cur && I.cur.trade) || 0)) + row('Insurer equity', eqI, 'total') + row('LIABILITIES + EQUITY', res + eqI, 'total') + '</table>' +
      '<div class="note">Solvency ' + (UAE.insSolvency(co) * 100).toFixed(0) + '% (minimum 15%).' + (pf.length && UAE.policy(co).stocksViaIns !== false ? ' The insurer also manages the company\x27s share portfolio (' + UAE.fmt.aed(pVal) + ' at market value): the shares are owned by the company, so they sit under Investments on the company balance sheet, and gains when they are sold go on the insurance income statement.' : '') + (UAE.hasIns(co) ? '' : ' <span class="neg">No Insurance HQ open.</span>') + '</div></div>';
  }
  return h + '<div class="note">The bank and insurer are divisions of ' + UI.esc(co.name) + ': their loans, deposits and cash are already in the company balance sheet above. These tables show each one on its own.</div>';
};
/* Called by UI.statements (panels.js, which loads after this file). */
UI.statementsSeg = function (co) {
  if (UI.tabState.period === 'ly') UI.tabState.period = 'ytd';      // divisions keep monthly books only
  {                       // own tab: bank & insurance income statement + balance sheet
      var per = UI.tabState.period || 'ytd', s = UI.tabs('period', [['cur','Month to date'],['last','Last month'],['ytd','Year to date'],['ttm','TTM']], per === 'ly' ? 'ytd' : per);
      var body = UI.segmentIS(co) + UI.segmentBS(co);
      return s + (UI.segmentIS(co) ? '<h3>Income statement</h3>' : '') + UI.segmentIS(co) + '<h3>Balance sheet</h3>' + UI.segmentBS(co) + (body ? '' : '<div class="note">This company has no bank or insurer.</div>');
    }
};
UI.statementsExtra = function (co, tab) { return tab === 'is' ? UI.segmentIS(co) : tab === 'bs' ? UI.segmentBS(co) : ''; };

/* Bank HQ -> International: the surplus lent abroad */
UI.bankIntlBox = function (co, mine) {
  var A = UAE.fmt.aed, B = UAE.bankOf(co), I = UAE.intlBook(B), tot = UAE.intlTotal(B), share = B.intlShare == null ? UAE.INTL.share : B.intlShare, T = B.target || {};
  var dom = B.book.corp + B.book.mort + B.book.cons, domT = (T.corp || 0) + (T.mort || 0) + (T.cons || 0), L = B.intlLast || {};
  var yr = Object.keys(I).reduce(function (s, id) { var t = UAE.intlTerms(id); return s + (t ? I[id] * t.rate : 0); }, 0);
  var h = '<div class="cards">' + UI.card('UAE loans', A(dom), 'UAE customers want ' + A(domT)) + UI.card('Lent abroad', A(tot), tot ? 'avg ' + (yr / tot * 100).toFixed(2) + '% a year' : '') +
    UI.card('Interest from abroad', A(yr / 12) + '/mo') + UI.card('Bank cash', A(Math.min(UAE.bankCash(co), co.bs.cash)), 'surplus over UAE needs ' + A(Math.max(0, UAE.intlSurplus(co) - tot))) + '</div>';
  h += '<div class="box"><h3>🌍 International lending desk</h3><div class="row"><label style="min-width:0">Share of the surplus lent abroad</label>' +
    '<input type="range" class="slider" min="0" max="100" step="5" value="' + Math.round(share * 100) + '" data-in="bkIntlShare" data-arg="' + co.id + '" style="width:200px;vertical-align:middle"' + (mine ? '' : ' disabled') + '> <b id="bkIntlOut" class="t-a">' + Math.round(share * 100) + '%</b></div>' +
    '<div class="note">UAE customers only want so much credit: the bank lends at most what borrowers in its cities want (more branches in more emirates = more UAE lending). The <b>surplus</b> – cash beyond depositor reserves, a liquidity buffer and room for UAE loan growth – is lent abroad: syndicated corporate &amp; sovereign loans at each country\'s central-bank rate plus a risk spread. Defaults rise in that country\'s recessions. No country gets more than 35%. Loans move 1% a day toward the target, so a big surplus is lent out over a few months.</div>';
  h += '<table class="t"><tr><th>Country</th><th>Cycle</th><th class="n">Policy rate</th><th class="n">Our rate</th><th class="n">Default risk / yr</th><th class="n">Lent</th><th class="n">Interest / yr</th></tr>' +
    Object.keys(UAE.INTL_RISK).map(function (id) {
      var t = UAE.intlTerms(id); if (!t) return '';
      return '<tr><td>' + t.n.flag + ' ' + t.n.name + '</td><td>' + (UI.phasePill ? UI.phasePill(t.n.phase) : '') + '</td><td class="n">' + (t.n.rate * 100).toFixed(2) + '%</td><td class="n">' + (t.rate * 100).toFixed(2) + '%</td><td class="n">' + (t.pd * 100).toFixed(2) + '%</td><td class="n">' + A(I[id] || 0) + '</td><td class="n">' + A((I[id] || 0) * t.rate) + '</td></tr>';
    }).join('') + '</table><div class="note">Spreads and default rates are EST. Interest goes into "Interest earned" and defaults into "Bad-loan provisions" on the bank income statement.</div></div>';
  return h;
};
UI.act.bkIntlShare = function (id, el) { UAE.bankOf(UAE.co(id)).intlShare = +el.value / 100; var o = document.getElementById('bkIntlOut'); if (o) o.textContent = el.value + '%'; };

/* Main balance sheet: what the Investments and bank loan lines are made of (indented "of which" rows). */
UI.bsSubRow = function (label, v) { return '<tr class="sub"><td style="padding-left:22px">' + label + '</td><td class="n">' + UI.money(v) + '</td></tr>'; };
UI.bsInvestSplit = function (co) {
  var b = co.bs; if (!b.invest) return '';
  var bF = (co.bank && co.bank.funded) || 0, iF = (co.ins && co.ins.funded) || 0, pc = 0, pv = 0;
  (UAE.stockPortfolio ? UAE.stockPortfolio(co) : []).forEach(function (x) { pc += x.cost; pv += x.value; });
  if (!bF && !iF && !pc) return '';
  var h = '';
  if (bF) h += UI.bsSubRow('of which 🏦 capital in the bank (bank equity now ' + UAE.fmt.aed(UAE.bankEquity(co)) + ')', bF);
  if (iF) h += UI.bsSubRow('of which 🛡 capital in the insurer (insurer equity now ' + UAE.fmt.aed(UAE.insEquity(co)) + ')', iF);
  if (pc) h += UI.bsSubRow('of which 📈 shares on stock markets (at cost; market value ' + UAE.fmt.aed(pv) + ')', pc);
  var other = b.invest - bF - iF - pc; if (Math.abs(other) > 1) h += UI.bsSubRow('of which other (bonds, subsidiaries, stakes)', other);
  return h;
};
UI.bsLoanSplit = function (co) {
  if (!co.bank || !UAE.bankOf) return '';
  var B = UAE.bankOf(co), dom = B.book.corp + B.book.mort + B.book.cons, intl = UAE.intlTotal ? UAE.intlTotal(B) : 0;
  return UI.bsSubRow('of which UAE businesses, mortgages &amp; consumers', dom) + (B.game > 1 ? UI.bsSubRow('of which loans to other game companies', B.game) : '') + (intl ? UI.bsSubRow('of which 🌍 lent abroad', intl) : '');
};
