/* ============================================================================
 * UAE CAPITALISM LAB  -  BANK & INSURANCE DASHBOARDS
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.pctIn = function (id, v, dis) { return '<input class="in num" style="width:70px" id="' + id + '" value="' + (v * 100).toFixed(2) + '"' + dis + '>'; };
UI.gauge = function (v, min, label) {
  var ok = v >= min, w = Math.max(3, Math.min(100, v / (min * 2) * 100));
  return UI.bar(w, ok ? '#b8ff2c' : '#ff2bd6', (v * 100).toFixed(1) + '% ' + (ok ? '✔' : '⚠ below ' + (min * 100).toFixed(0) + '%') + (label ? ' · ' + label : ''), 50);
};

/* ------------------------------------------------------------------ bank */
UI.bankBox = function (f, mine) {
  var co = UAE.co(f.owner), B = UAE.bankOf(co), M = UAE.mktRates(), r = B.rates, m = B.m || {}, T = B.target || {}, A = UAE.fmt.aed, dis = mine ? '' : ' disabled';
  var loans = B.book.corp + B.book.mort + B.book.cons + B.game, car = UAE.bankCAR(co), ldr = co.bs.custDeposits ? loans / co.bs.custDeposits : 0;
  var nii = ((m.intInc || 0) - (m.intExp || 0)) * 365, nim = loans ? nii / loans : 0, eq = UAE.totals(co).equity;
  var h = '<div class="box"><h3>🏦 ' + UI.esc(co.name) + ' – bank dashboard</h3><div class="cards">' +
    UI.card('Customer deposits', A(co.bs.custDeposits), 'heading for ' + A(T.dep || 0)) + UI.card('Total loans', A(loans), 'loan-to-deposit ' + (ldr * 100).toFixed(0) + '%') +
    UI.card('Net interest margin', (nim * 100).toFixed(2) + '%', 'interest earned − paid, per AED lent') + UI.card('Capital adequacy (CAR)', (car * 100).toFixed(1) + '%', 'minimum 13%', car >= 0.13 ? 'a' : 'm') +
    UI.card('Cost of risk', A((B.prov || 0)), 'bad-loan provisions, last 12 months') + UI.card('Spare lending room', A(UAE.bankLendRoom(co))) + '</div>';
  h += '<div class="row" style="gap:20px"><div style="flex:1"><b>Capital adequacy</b>' + UI.gauge(car, UAE.BANK.minCAR, 'equity ' + A(eq) + ' ÷ risk-weighted loans ' + A(UAE.riskWeighted(co))) + '</div>' +
    '<div style="flex:1"><b>Cash reserve</b>' + UI.gauge(co.bs.custDeposits ? co.bs.cash / co.bs.custDeposits : 1, UAE.BANK.reserve, 'cash ' + A(co.bs.cash)) + '</div></div>';
  h += '<h4>Products &amp; interest rates</h4><table class="t"><tr><th>Product</th><th class="n">Your rate %</th><th class="n">Market %</th><th class="n">Your book</th><th class="n">Heading for</th><th class="n">Interest / day</th></tr>' +
    '<tr><td><b>Deposits</b> (what you pay savers)</td><td class="n">' + UI.pctIn('bkDep', r.dep, dis) + '</td><td class="n">' + (M.dep * 100).toFixed(2) + '</td><td class="n">' + A(co.bs.custDeposits) + '</td><td class="n">' + A(T.dep || 0) + '</td><td class="n neg">' + A(m.intExp || 0) + '</td></tr>';
  [['corp', 'bkCorp'], ['mort', 'bkMort'], ['cons', 'bkCons']].forEach(function (x) {
    var k = x[0], S = UAE.BANK.segs[k];
    h += '<tr><td><b>' + S.name + '</b></td><td class="n">' + UI.pctIn(x[1], r[k], dis) + '</td><td class="n">' + (M[k] * 100).toFixed(2) + '</td><td class="n">' + A(B.book[k]) + '</td><td class="n">' + A(T[k] || 0) + '</td><td class="n pos">' + A(B.book[k] * r[k] / 365) + '</td></tr>';
  });
  h += '<tr><td><b>Loans to game companies</b> <span class="muted">(when they borrow, the cheapest bank lends)</span></td><td class="n">corporate rate + their credit spread</td><td></td><td class="n">' + A(B.game) + '</td><td></td><td class="n pos">' + A(B.gameInt || 0) + ' <span class="muted">so far</span></td></tr></table>';
  h += '<div class="row"><label>Risk appetite</label><select class="in" data-ch="bkAppetite" data-arg="' + co.id + '"' + dis + '>' + [['conservative', 'Conservative – fewer, safer loans'], ['normal', 'Normal'], ['aggressive', 'Aggressive – grow fast, more bad loans']].map(function (o) { return '<option value="' + o[0] + '"' + (B.appetite === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
    '<button class="btn a sm" data-act="bkRates" data-arg="' + co.id + '"' + dis + '>Save rates</button><button class="btn sm" data-act="bkMarket" data-arg="' + co.id + '"' + dis + '>Set all to market</button></div>';
  h += '<h4>Income (per day)</h4><div class="cards">' + UI.card('Interest earned', A((m.intInc || 0)), 'incl. treasury ' + A(m.treas || 0)) + UI.card('Interest paid', A(m.intExp || 0)) +
    UI.card('Fees', A(m.fees || 0), 'accounts & cards') + UI.card('Bad-loan provisions', A(m.prov || 0)) + UI.card('Brokerage (total)', A(B.brokerage || 0), 'share-trading fees') + UI.card('Underwriting (total)', A(B.underwriting || 0), 'share issues & IPOs') + '</div>';
  var br = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'bankbranch'; });
  h += '<div class="note"><b>How your bank grows:</b> deposits and loans come from each city where you have the HQ or branches (' + br.length + ' branch' + (br.length === 1 ? '' : 'es') + ' now) – open branches in big cities. Paying savers more than the market wins deposits; charging borrowers less wins loans but squeezes your margin and attracts riskier customers. ' +
    'Rules: keep 7% of deposits as cash and capital ≥ 13% of risk-weighted loans (mortgages count half) – below that the bank stops lending. When any company in the game borrows, the cheapest bank with spare room lends it (ties go to the bigger branch network).</div></div>';
  return h;
};
UI.act.bkRates = function (id) {
  var B = UAE.bankOf(UAE.co(id)), v = {}, bad = false;
  [['dep', 'bkDep'], ['corp', 'bkCorp'], ['mort', 'bkMort'], ['cons', 'bkCons']].forEach(function (x) { var n = UI.num(x[1]); if (!(n >= 0 && n < 60)) bad = true; v[x[0]] = n / 100; });
  if (bad || v.corp <= v.dep || v.mort <= v.dep) { UI.toast('Loan rates must be above the deposit rate (0–60%).', 'bad'); return; }
  B.rates = v; UI.toast('Bank rates saved.', 'good'); UI.render();
};
UI.act.bkMarket = function (id) { var M = UAE.mktRates(); UAE.bankOf(UAE.co(id)).rates = { dep: M.dep, corp: M.corp, mort: M.mort, cons: M.cons }; UI.toast('Rates set to market.', 'good'); UI.render(); };
UI.act.bkAppetite = function (id, el) { UAE.bankOf(UAE.co(id)).appetite = el.value; UI.toast('Risk appetite: ' + el.value + '.', 'good'); };

/* ------------------------------------------------------------- insurance */
UI.insBox = function (f, mine) {
  var co = UAE.co(f.owner), I = UAE.insOf(co), m = I.m || {}, A = UAE.fmt.aed, dis = mine ? '' : ' disabled', sol = UAE.insSolvency(co), lr = co._claims || 0;
  var h = '<div class="box"><h3>🛡 ' + UI.esc(co.name) + ' – insurance dashboard</h3><div class="cards">' +
    UI.card('Premiums (12 months)', A(I.gwpYear || 0), 'gross written premiums') + UI.card('Claims ratio', (lr * 100).toFixed(1) + '%', 'claims ÷ premiums', lr < 0.85 ? 'a' : 'm') +
    UI.card('Combined ratio', ((lr + UAE.INS.commission) * 100).toFixed(1) + '%', 'below 100% = underwriting profit') + UI.card('Solvency', (sol * 100).toFixed(0) + '%', 'equity ÷ net premiums, min 15%', sol >= UAE.INS.minSolvency ? 'a' : 'm') +
    UI.card('Investment income / day', A(m.invest || 0), 'on the float (premiums held before claims)') + UI.card('Reinsurance', (I.reinsure * 100).toFixed(0) + '%', 'of risk passed on') + '</div>';
  h += '<h4>Insurance lines</h4><table class="t"><tr><th>Line</th><th class="n">Price level</th><th class="n">Premiums / day</th><th class="n">Claims / day</th><th class="n">Claims ratio</th></tr>';
  Object.keys(UAE.INS.lines).concat(['commercial']).forEach(function (k) {
    var L = UAE.INS.lines[k], x = (m.byLine || {})[k] || { prem: 0, claims: 0 };
    h += '<tr><td><b>' + (L ? L.name : 'Commercial property (all companies’ buildings)') + '</b></td><td class="n">' + (L ? '<input class="in num" style="width:64px" id="ins_' + k + '" value="' + (I.price[k] || 1).toFixed(2) + '"' + dis + '>' : '<span class="muted">0.12%/yr of building value</span>') + '</td>' +
      '<td class="n">' + A(x.prem) + '</td><td class="n">' + A(x.claims) + '</td><td class="n">' + (x.prem ? (x.claims / x.prem * 100).toFixed(0) + '%' : '—') + '</td></tr>';
  });
  h += '</table><div class="row"><label>Reinsurance %</label><input class="in num" id="insRe" style="width:60px" value="' + Math.round(I.reinsure * 100) + '"' + dis + '><button class="btn a sm" data-act="insSave" data-arg="' + co.id + '"' + dis + '>Save</button>' +
    '<span class="muted">price level 1.00 = market price; 0.90 = 10% cheaper (more customers, more risky ones)</span></div>';
  var cat = UAE.S.insCat; if (cat && cat.until >= UAE.S.day) h += '<div class="note" style="border-color:#ff2bd6">⚠ Catastrophe in progress: ' + UI.esc(cat.title) + ' – claims are spiking.</div>';
  return h + '<div class="note"><b>How insurance works:</b> customers pay premiums up front and claim later, so you hold their money (the float) and earn interest on it. Price too low and you attract risky customers, so claims rise; too high and customers go elsewhere. Reinsurance passes part of every premium and every claim to a reinsurer – less profit, but catastrophes (floods, sandstorms) hurt less. Front offices in more cities bring more customers.</div></div>';
};
UI.act.insSave = function (id) {
  var I = UAE.insOf(UAE.co(id)), bad = false;
  Object.keys(UAE.INS.lines).forEach(function (k) { var v = UI.num('ins_' + k); if (!(v >= 0.5 && v <= 2)) bad = true; else I.price[k] = v; });
  var re = UI.num('insRe'); if (re >= 0 && re <= 90) I.reinsure = re / 100; else bad = true;
  UI.toast(bad ? 'Price levels 0.50–2.00, reinsurance 0–90%.' : 'Insurance settings saved.', bad ? 'bad' : 'good'); UI.render();
};
UI.branchBox = function (f) {
  var co = UAE.co(f.owner), hq = UAE.firmsOf(co.id).find(function (g) { return g.type === (f.type === 'bankbranch' ? 'bankhq' : 'inshq'); });
  var P = f.type === 'bankbranch' ? UAE.bankPresence(co, f.city) : UAE.insPresence(co, f.city);
  return '<div class="box"><h3>' + (f.type === 'bankbranch' ? '🏦 Bank branch' : '🛡 Insurance office') + '</h3><div class="cards">' + UI.card('Presence in ' + UAE.CITIES[f.city].name, P.toFixed(2), 'HQ + branches here') + '</div>' +
    (hq ? '<div class="row"><button class="btn a" data-act="openFirm" data-arg="' + hq.id + '">Open the ' + (f.type === 'bankbranch' ? 'bank' : 'insurance') + ' dashboard (HQ)</button></div>' : '<div class="note">Build a ' + (f.type === 'bankbranch' ? 'Bank HQ' : 'Insurance HQ') + ' – branches only work with a headquarters.</div>') +
    '<div class="note">Each branch / office wins customers in its city – more presence = bigger market share.</div></div>';
};
