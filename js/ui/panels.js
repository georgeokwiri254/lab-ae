/* ============================================================================
 * UAE CAPITALISM LAB  -  INFORMATION CENTER (all 21 Capitalism Lab reports)
 *   IC01 Corporations      IC08 Goal              IC15 Nations
 *   IC02 Corporate Details IC09 Score             IC16 Party (UAE: Government)
 *   IC03 Products          IC10 Billionaires 100  IC17 Financial Actions
 *   IC04 Product Details   IC11 Manufacturer Guide IC18 Stock Market
 *   IC05 Firms             IC12 Farmer Guide      IC19 Software
 *   IC06 Financials        IC13 Manager Guide     IC20 Digital Guide
 *   IC07 Persons           IC14 Cities            IC21 Bond Market
 * + Rankings (companies, CEOs, cities), HQ, Event Tracker, Data Sources, Settings
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});
UI.R = UI.R || {};
var F = function () { return UAE.fmt; };

UI.REPORTS = [
  ['corps','IC01','🏛','Corporations','All companies, listed & private'],
  ['corp','IC02','🏢','Corporate Details','Dossier, statements, shareholders'],
  ['products','IC03','📦','Products','Market size, sellers, leaders'],
  ['pdetail','IC04','🔎','Product Details','Ratings, supply & demand, brand, chain'],
  ['firms','IC05','🏭','Firms','Every firm on the map'],
  ['fin','IC06','📊','Financials','Income, balance sheet, cash flow'],
  ['persons','IC07','👤','Persons','Executives, founders, wealth'],
  ['goals','IC08','🎯','Goal','Mission objectives'],
  ['score','IC09','⭐','Score','Your score and breakdown'],
  ['billionaires','IC10','💎','Billionaires 100','Personal wealth ranking'],
  ['manufacturer','IC11','⚙','Manufacturer Guide','Recipes & unit economics'],
  ['farmer','IC12','🌴','Farmer Guide','Farms, mines, oil & gas'],
  ['managers','IC13','🧑‍💼','Manager Guide','Hire managers for firms'],
  ['cities','IC14','🌆','Cities','City economics & government'],
  ['nations','IC15','🇦🇪','Nations','UAE totals by emirate'],
  ['party','IC16','🏛','Party / Government','UAE governance mode'],
  ['factions','IC17','💼','Financial Actions','Loans, shares, IPO, bonds …'],
  ['stock','IC18','📈','Stock Market','DFM & ADX trading'],
  ['software','IC19','💾','Software','Software market'],
  ['digital','IC20','🌐','Digital Guide','Internet, telecom, data'],
  ['bonds','IC21','🧾','Bond Market','Sovereign & corporate bonds'],
  ['rank','EXT','🏆','Rankings & CEOs','Company, CEO and city rankings'],
  ['hq','EXT','👔','Headquarters','CEO/CTO/CMO … departments'],
  ['ceo','EXT','🧠','CEO & Policies','Expansion strategies, scope, policies'],
  ['marketing','EXT','📣','Marketing','Ad campaigns & product brands'],
  ['news','EXT','📰','Event Tracker','News & events'],
  ['sources','EXT','📚','Data Sources','REAL / EST / SYN provenance'],
  ['settings','EXT','⚙','Save & Settings','Save, load, export, options']
];

UI.act.info = function (key) {
  if (!key) { UI.open('Information Center', UI.R.center); return; }
  var r = UI.REPORTS.find(function (x) { return x[0] === key; });
  if (key === 'corp') return UI.act.corp(UAE.S.activeCo);
  if (key === 'ceo') return UI.act.ceo(UAE.S.activeCo);
  if (key === 'pdetail') return UI.act.pdetail();
  if (key === 'managers') return UI.open('Manager Guide', UI.R.managers, { push: UI.stack.length > 0 });
  UI.open(r ? r[3] : key, UI.R[key], { push: UI.stack.length > 0 && UI.stack[0].title === 'Information Center' });
};
UI.R.center = function () {
  return '<div class="tiles">' + UI.REPORTS.map(function (r) {
    return '<button class="tile" data-act="info" data-arg="' + r[0] + '"><span class="code">' + r[1] + '</span><span class="ic">' + r[2] + '</span><span class="nm">' + r[3] + '</span><span class="ds">' + r[4] + '</span></button>';
  }).join('') + '</div><div class="note">Shortcut keys follow Capitalism Lab: I Info · B Build · F4 Stock · F5 Events · F6 Financials · F9 Settings · F10 Corporate · F11 Financial Actions · H HQ · W whole UAE · 0-5 speed · Space pause.</div>';
};

/* ============================================================ IC01 */
UI.R.corps = function () {
  var flt = UI.tabState.corps || 'all';
  var list = UAE.allCos().filter(function (c) {
    if (flt === 'listed') return c.status === 'LISTED'; if (flt === 'private') return c.status !== 'LISTED';
    if (flt === 'real') return c.real; if (flt === 'ai') return c.fictional; if (flt === 'mine') return c.controller === 'PLAYER'; return true;
  }).map(function (c) { var t = UAE.ttm(c); return { c: c, rev: t.revenue, ni: UAE.netIncome(t), val: UAE.companyValue(c) }; })
    .sort(function (a, b) { return b.val - a.val; });
  var h = UI.tabs('corps', [['all','All'],['listed','Listed'],['private','Private / state'],['real','Real UAE'],['ai','AI start-ups'],['mine','Mine']], flt);
  h += '<table class="t"><tr><th>Company</th><th>Listing</th><th>HQ</th><th>Sector</th><th class="n">Revenue TTM</th><th class="n">Net profit TTM</th><th class="n">Value</th><th class="n">Firms</th></tr>';
  list.forEach(function (x) {
    var c = x.c;
    h += '<tr class="click' + (c.controller === 'PLAYER' ? ' me' : '') + '" data-act="corp" data-arg="' + c.id + '"><td>' + UI.coLink(c) + (c.real ? ' ' + UI.tag(c.finSrc) : c.fictional ? ' <span class="pill syn">AI</span>' : '') + '</td><td>' + UI.exch(c) + '</td><td>' + UAE.CITIES[c.hq].name + '</td><td>' + ((UAE.SECTORS[c.sector] || {}).name || c.sector) + '</td>' +
      '<td class="n">' + F().aed(x.rev) + '</td><td class="n">' + UI.money(x.ni) + '</td><td class="n">' + F().aed(x.val) + '</td><td class="n">' + UAE.firmsOf(c.id).length + '</td></tr>';
  });
  return h + '</table>';
};

/* ============================================================ IC02 */
UI.act.corp = function (id) {
  id = id || UAE.S.activeCo;
  UI.open(function () { return UAE.co(id).name; }, function () { return UI.R.corp(id); }, { push: UI.stack.length > 0 });
};
UI.R.corp = function (id) {
  var co = UAE.co(id), tab = UI.tabState.corp || 'overview';
  var h = UI.tabs('corp', [['overview','Overview'],['firms','Firms'],['products','Products'],['is','Income Statement'],['bs','Balance Sheet'],['cf','Cash Flow'],['seg','🏦 Bank & 🛡 Insurance'],
    ['valuation','💎 Valuation'],['holders','Shareholders'],['debt','Bonds & Loans'],['tech','Technology'],['brand','Brand'],['graphs','Graphs'],['history','History'],['rank','Rankings'],['mgmt','Management']], tab);
  h = '<div class="row" style="gap:14px;margin-bottom:8px">' + UI.logo(co, 64) + '<div><b style="font-size:1.25em">' + UI.esc(co.name) + '</b><br>' + UI.exch(co) + (co.foreign ? ' <span class="pill">United States</span>' : '') + '</div>' + (UAE.isHuman(co) ? '<span style="margin-left:auto"></span><button class="btn a" data-act="hireForCo" data-arg="' + co.id + '">👔 Hire CEO / CMO / CTO</button><button class="btn a" data-act="logoPick" data-arg="' + co.id + '">🎨 Change logo</button>' : '') + '</div>' + h;
  if (tab === 'overview') h += UI.corpOverview(co);
  else if (tab === 'firms') h += UI.firmsByCategory ? UI.firmsByCategory(UAE.firmsOf(co.id).slice().sort(function (a, b) { return b.last.profit - a.last.profit; }), 'corpFcat') : UI.firmTable(UAE.firmsOf(co.id));
  else if (tab === 'products') h += UI.corpProducts(co);
  else if (tab === 'is' || tab === 'bs' || tab === 'cf' || tab === 'seg') h += UI.statements(co, tab);
  else if (tab === 'holders') h += UI.holdersTable(co);
  else if (tab === 'valuation') h += UI.valuationBox(co);
  else if (tab === 'debt') h += UI.debtTable(co);
  else if (tab === 'tech') h += UI.techTable(co);
  else if (tab === 'brand') h += UI.brandTable(co);
  else if (tab === 'graphs') h += UI.corpGraphs(co);
  else if (tab === 'history') h += UI.newsList(UAE.S.news.filter(function (n) { return n.text.indexOf(co.name) >= 0; }));
  else if (tab === 'rank') h += UI.rankTable('value', co.id);
  else if (tab === 'mgmt') h += UI.mgmtBox(co);
  return h;
};
UI.corpOverview = function (co) {
  var t = UAE.totals(co), ttm = UAE.ttm(co), ni = UAE.netIncome(ttm), ceo = UAE.person(co.ceo);
  var pe = UAE.isTradable(co) && ni > 0 ? UAE.mcap(co) / ni : null;
  var h = '<div class="cards">' +
    UI.card('Revenue TTM', F().aed(ttm.revenue)) + UI.card('Net profit TTM', UI.money(ni), 'margin ' + F().pct(ttm.revenue ? ni / ttm.revenue : 0), ni >= 0 ? 'a' : 'm') +
    UI.card(UAE.isTradable(co) ? 'Market cap' : 'Est. equity value', F().aed(UAE.companyValue(co)), UAE.isTradable(co) ? 'AED ' + F().px(co.price) + ' / share' : 'private - not tradable') +
    UI.card('Total assets', F().aed(t.assets)) + UI.card('Equity (book)', F().aed(t.equity)) + UI.card('Cash', F().aed(co.bs.cash)) +
    UI.card('P/E', pe ? pe.toFixed(1) + 'x' : '—') + UI.card('Credit rating', co.credit || '—', 'loan rate ' + F().pct(UAE.loanRate(co), 2)) + '</div>';
  h += '<div class="box"><h3>Identity</h3><table class="t">' +
    '<tr><td>Legal / brand name</td><td>' + UI.esc(co.name) + '</td></tr>' +
    '<tr><td>Listing</td><td>' + UI.exch(co) + ' ' + (co.listingSrc ? '<span class="pill syn">' + co.listingSrc + '</span>' : '') + (co.priceSrc ? ' price ' + UI.tag(co.priceSrc) + ' <span class="muted">' + UI.esc(co.priceSrc) + '</span>' : '') + '</td></tr>' +
    '<tr><td>Headquarters</td><td>' + UAE.CITIES[co.hq].name + ' (' + UAE.EMIRATES[UAE.CITIES[co.hq].emirate].name + ')</td></tr>' +
    '<tr><td>Sector</td><td>' + ((UAE.SECTORS[co.sector] || {}).name || co.sector) + '</td></tr>' +
    '<tr><td>CEO</td><td>' + (ceo ? UI.esc(ceo.name) + ' <span class="muted">' + UI.esc(ceo.title) + '</span>' : '—') + '</td></tr>' +
    '<tr><td>Controlled by</td><td>' + (co.controller === 'PLAYER' ? '<span class="t-a">YOU</span>' : 'AI management') + (co.parent ? ' · parent ' + UI.esc(UAE.co(co.parent).name) : '') + '</td></tr>' +
    (co.real ? '<tr><td>Financial data</td><td>' + UI.tag(co.finSrc) + ' ' + UI.esc(co.finSrc) + '<br><span class="muted">Group "core business" is simulated from FY2025 figures; map firms are the playable part.</span></td></tr>' : '') +
    '</table></div>';
  if (co.controller === 'PLAYER' && co.id !== UAE.S.activeCo) h += '<div class="row"><button class="btn a" data-act="switchCo" data-arg="' + co.id + '">Manage this company</button></div>';
  if (UAE.isTradable(co)) h += '<div class="row"><button class="btn" data-act="stockDetail" data-arg="' + co.id + '">Open in Stock Market</button></div>';
  if (!co.real && co.status !== 'LISTED' && co.controller !== 'PLAYER') h += '<div class="row"><button class="btn m" data-act="acquire" data-arg="' + co.id + '">Make acquisition offer (' + F().aed(UAE.privateValue(co) * 1.25) + ')</button></div>';
  return h;
};
UI.corpProducts = function (co) {
  var rows = {};
  UAE.firmsOf(co.id).forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind;
    f.lines.forEach(function (l) {
      var r = rows[l.pid] || (rows[l.pid] = { sold: 0, made: 0, firms: 0, retail: 0 });
      r.firms++; if (k === 'retail') { r.sold += l.sold || 0; r.retail += (l.sold || 0) * l.price; } else r.made += l.made || 0;
    });
  });
  var h = '<table class="t"><tr><th>Product</th><th>Class</th><th class="n">Firms</th><th class="n">Retail units/day</th><th class="n">Retail sales/day</th><th class="n">Produced (month)</th><th class="n">Tech</th><th class="n">Brand</th></tr>';
  Object.keys(rows).forEach(function (pid) {
    var P = UAE.P[pid], r = rows[pid];
    h += '<tr class="click" data-act="product" data-arg="' + pid + '"><td>' + P.name + '</td><td>' + P.cls + '</td><td class="n">' + r.firms + '</td><td class="n">' + F().num(r.sold, 1) + '</td><td class="n">' + F().aed(r.retail) + '</td><td class="n">' + F().num(r.made) + '</td><td class="n">' + (co.tech[pid] || 0).toFixed(0) + '</td><td class="n">' + (co.brand[P.cls] || co.brandBase || 0).toFixed(0) + '</td></tr>';
  });
  return h + '</table>' + (Object.keys(rows).length ? '' : '<div class="note">No product lines yet.</div>');
};

/* ----------------------------------------------- financial statements */
UI.periodData = function (co, per) {
  if (per === 'cur') return { is: co.is.cur, cf: co.cf.cur, label: 'Month to date' };
  if (per === 'last') { var m = co.is.months[co.is.months.length - 1]; return { is: m || UAE.newIS(), cf: co.cf.months[co.cf.months.length - 1] || UAE.newCF(), label: 'Last month' }; }
  if (per === 'ytd') return { is: co.is.ytd, cf: co.cf.ytd, label: 'Year to date ' + UAE.cal.year() };
  if (per === 'ly') { var y = co.is.years[co.is.years.length - 1]; return { is: y || UAE.newIS(), cf: co.cf.years[co.cf.years.length - 1] || UAE.newCF(), label: y ? 'Year ' + y.year : 'No closed year yet' }; }
  var ttm = UAE.ttm(co), cf = UAE.newCF(); co.cf.months.slice(-12).forEach(function (m) { cf.op += m.op; cf.inv += m.inv; cf.fin += m.fin; });
  return { is: ttm, cf: cf, label: 'Trailing 12 months' };
};
UI.statements = function (co, tab) {
  if (tab === 'seg' && UI.statementsSeg) return UI.statementsSeg(co);              // bank & insurance on their own (financeui2.js)
  var per = UI.tabState.period || 'ytd', P = UI.periodData(co, per), is = P.is;
  var h = UI.tabs('period', [['cur','Month to date'],['last','Last month'],['ytd','Year to date'],['ttm','TTM'],['ly','Last year']], per);
  var row = function (label, v, cls) { return '<tr class="' + (cls || '') + '"><td>' + label + '</td><td class="n">' + UI.money(v) + '</td></tr>'; };
  if (tab === 'is') {
    var gross = is.revenue - is.cogs, ebitda = UAE.ebitda(is), ebit = ebitda - is.depreciation, pbt = UAE.pbt(is), ni = UAE.netIncome(is);
    h += '<div class="box"><h3>Income statement · ' + P.label + '</h3><table class="t fs">' +
      row('Revenue (net of VAT)', is.revenue, 'h') + row('Cost of goods sold', -is.cogs) + row('Gross profit', gross, 'total') +
      row('Salaries & wages', -is.salaries) + row('Utilities (DEWA / ADDC tariffs)', -is.utilities) + row('Advertising & PR', -is.advertising) +
      row('Training', -is.training) + row('Research & development', -is.rnd) + row('Maintenance', -is.maintenance) +
      (is.coreOpex ? row('Core group operations (legacy business)', -is.coreOpex) : '') + row('Other operating expenses', -is.otherOpex) +
      row('EBITDA', ebitda, 'total') + row('Depreciation', -is.depreciation) + row('Operating profit (EBIT)', ebit, 'total') +
      row('Interest income', is.interestInc) + row('Investment income & gains', is.investInc) + row('Interest expense', -is.interestExp) +
      row('Profit before tax', pbt, 'total') + row('UAE corporate tax (9% above AED 375k)', -is.tax) + row('NET PROFIT', ni, 'total') + '</table></div>';
  } else if (tab === 'bs') {
    var t = UAE.totals(co), b = co.bs;
    h = '<div class="box"><h3>Balance sheet · today ' + UAE.cal.label() + '</h3><table class="t fs">' +
      '<tr class="h"><td colspan="2">Assets</td></tr>' + row('Cash', b.cash) + row('Inventory', t.inventory) + row('Bank deposits', b.deposits) +
      row('Investments (shares, bonds, subsidiaries at cost)', b.invest) + UI.bsInvestSplit(co) + (b.loanBook ? row('🏦 Bank: loans to customers', b.loanBook) + UI.bsLoanSplit(co) : '') +
      row('Land', b.land) + row('Buildings & equipment', b.ppe) + (b.coreAssets ? row('Group core operating assets', b.coreAssets) : '') + row('TOTAL ASSETS', t.assets, 'total') +
      '<tr class="h"><td colspan="2">Liabilities</td></tr>' + row('Bank loans', b.loans) + row('Bonds issued', b.bonds) + (b.custDeposits ? row('Customer deposits (bank)', b.custDeposits) : '') +
      (b.coreLiab ? row('Group core liabilities', b.coreLiab) : '') + row('TOTAL LIABILITIES', t.liabs, 'total') +
      '<tr class="h"><td colspan="2">Shareholders\' equity</td></tr>' + row('Share capital', b.shareCap) + row('Retained earnings', b.retained) + row('Treasury shares', -b.treasury) +
      row('TOTAL EQUITY', t.equity, 'total') + row('Check: assets − liabilities − equity', t.check, 'sub') + '</table></div>';
  } else {
    var cf = P.cf;
    h += '<div class="box"><h3>Cash flow statement · ' + P.label + '</h3><table class="t fs">' +
      row('Cash from operating activities', cf.op) + row('Cash from investing activities', cf.inv) + row('Cash from financing activities', cf.fin) +
      row('NET CHANGE IN CASH', cf.op + cf.inv + cf.fin, 'total') + '</table><div class="note">Every cash movement in the engine is tagged operating / investing / financing at the moment it is booked, so this statement always reconciles to the change in cash.</div></div>';
  }
  if (UI.statementsExtra) h += UI.statementsExtra(co, tab);                         // bank & insurance sections (financeui2.js)
  h += '<div class="box"><h3>Monthly history</h3><canvas class="chart" id="isChart"></canvas></div>';
  UI.after(function () {
    var ms = co.is.months.slice(-24);
    UI.chart(UI.$('isChart'), [{ label: 'Revenue', data: ms.map(function (m) { return m.revenue; }) }, { label: 'Net profit', data: ms.map(UAE.netIncome), color: '#b8ff2c' }],
      { fmt: function (v) { return UAE.fmt.num(v); }, labels: ms.map(function (m) { return UAE.cal.label(m.day).slice(-8); }) });
  });
  return h;
};
UI.holderName = function (k) {
  if (k === 'PUBLIC') return 'Public free float (DFM/ADX investors)';
  if (k.indexOf('P:') === 0) { var p = UAE.person(k.slice(2)); return p ? p.name + (p.isPlayer ? ' (YOU)' : '') : k; }
  if (k.indexOf('C:') === 0) { var c = UAE.co(k.slice(2)); return c ? c.name : k; }
  return (UAE.HOLDERS[k.slice(2)] || k.slice(2)) + ' <span class="pill est">EST stake</span>';
};
UI.holdersTable = function (co) {
  var tot = 0; for (var k in co.holders) tot += co.holders[k];
  var rows = Object.keys(co.holders).sort(function (a, b) { return co.holders[b] - co.holders[a]; });
  var h = '<div class="cards">' + UI.card('Shares outstanding', F().num(co.shares)) + UI.card('Free float', F().pct((co.holders.PUBLIC || 0) / Math.max(1, tot))) + UI.card('Your combined stake', F().pct(UAE.playerStake(co)), '>50% = control') + '</div>';
  h += '<table class="t"><tr><th>Holder</th><th class="n">Shares</th><th class="n">Stake</th><th class="n">Value</th></tr>';
  rows.forEach(function (k) {
    var v = co.holders[k] * (UAE.isTradable(co) ? co.price : UAE.privateValue(co) / co.shares);
    h += '<tr><td>' + UI.holderName(k) + '</td><td class="n">' + F().num(co.holders[k]) + '</td><td class="n">' + F().pct(co.holders[k] / tot, 2) + '</td><td class="n">' + F().aed(v) + '</td></tr>';
  });
  return h + '</table>';
};
UI.debtTable = function (co) {
  var h = '<div class="box"><h3>Bank loans</h3><table class="t"><tr><th>Since</th><th class="n">Still owed</th><th class="n">Borrowed</th><th class="n">Rate</th><th>Repaid by</th><th class="n">Instalment / month</th><th>Lender</th><th>Taken by</th></tr>';
  co.loanList.forEach(function (l) {
    var months = Math.max(1, Math.round(((l.until || UAE.S.day + 365) - UAE.S.day) / 30));
    h += '<tr><td>' + UAE.cal.label(l.day) + '</td><td class="n">' + F().aed(l.amt) + '</td><td class="n">' + F().aed(l.orig || l.amt) + '</td><td class="n">' + F().pct(l.rate, 2) + '</td><td>' + (l.until ? UAE.cal.label(l.until) : '—') + '</td>' +
      '<td class="n">' + F().aed(l.amt / months) + '</td><td>' + (l.bank && UAE.co(l.bank) ? UI.esc(UAE.co(l.bank).name) : 'outside bank') + '</td><td>' + ({ player: 'you', ceo: 'CEO', emergency: 'emergency credit' }[l.by] || 'CEO') + '</td></tr>';
  });
  h += '</table></div><div class="box"><h3>Bonds issued</h3><table class="t"><tr><th>Bond</th><th class="n">Amount</th><th class="n">Coupon</th><th>Maturity</th></tr>';
  co.bondList.forEach(function (b) { h += '<tr><td>' + UI.esc((UAE.S.bonds[b.id] || {}).name || b.id) + '</td><td class="n">' + F().aed(b.amt) + '</td><td class="n">' + F().pct(b.coupon, 2) + '</td><td>' + UAE.cal.label(b.maturity) + '</td></tr>'; });
  h += '</table></div><div class="box"><h3>Deposits held</h3><table class="t"><tr><th class="n">Amount</th><th class="n">Rate</th></tr>';
  co.depositList.forEach(function (d) { h += '<tr><td class="n">' + F().aed(d.amt) + '</td><td class="n">' + F().pct(d.rate, 2) + '</td></tr>'; });
  return h + '</table></div>';
};
UI.techTable = function (co) {
  var h = '<table class="t"><tr><th>Product</th><th>Class</th><th class="n">Technology</th><th class="n">Best rival</th><th></th></tr>';
  UAE.PRODUCTS.filter(function (p) { return p.rec || p.src !== 'import'; }).forEach(function (p) {
    var best = null; UAE.allCos().forEach(function (c) { if (c.id !== co.id && (!best || (c.tech[p.id] || 0) > (best.tech[p.id] || 0))) best = c; });
    h += '<tr><td>' + p.name + '</td><td>' + p.cls + '</td><td class="n">' + (co.tech[p.id] || 0).toFixed(1) + '</td><td class="n">' + (best ? (best.tech[p.id] || 0).toFixed(1) + ' · ' + UI.esc(best.name) : '—') + '</td><td>' +
      (UAE.isHuman(co) && best && (best.tech[p.id] || 0) > (co.tech[p.id] || 0) + 1 ? '<button class="btn sm" data-act="buyTech" data-arg="' + best.id + '|' + p.id + '">Buy (' + F().aed(((best.tech[p.id] || 0) - (co.tech[p.id] || 0)) * 1.5e6) + ')</button>' : '') + '</td></tr>';
  });
  return h + '</table>';
};
UI.brandTable = function (co) {
  var h = '<table class="t"><tr><th>Product class</th><th class="n">Brand awareness</th></tr>';
  Object.keys(co.brand).forEach(function (k) { h += '<tr><td>' + k + '</td><td class="n">' + co.brand[k].toFixed(1) + '</td></tr>'; });
  return h + '</table><div class="note">Corporate brand base: ' + (co.brandBase || 0) + '. Advertising (firm budgets, CMO and PR departments) raises brand; it decays slowly without spend.</div>';
};
UI.corpGraphs = function (co) {
  UI.after(function () {
    var hs = co.history;
    UI.chart(UI.$('g1'), [{ label: 'Revenue / month', data: hs.map(function (x) { return x.rev; }) }, { label: 'Net profit / month', data: hs.map(function (x) { return x.ni; }), color: '#b8ff2c' }], { fmt: function (v) { return UAE.fmt.num(v); } });
    UI.chart(UI.$('g2'), [{ label: 'Equity', data: hs.map(function (x) { return x.equity; }), color: '#ff2bd6' }, { label: 'Cash', data: hs.map(function (x) { return x.cash; }), color: '#ffd24d' }], { fmt: function (v) { return UAE.fmt.num(v); } });
    if (co.priceHist.length) UI.chart(UI.$('g3'), [{ label: 'Share price AED', data: co.priceHist.slice() }], { fmt: function (v) { return v.toFixed(2); } });
  });
  return '<div class="box"><h3>Revenue & profit</h3><canvas class="chart" id="g1"></canvas></div><div class="box"><h3>Equity & cash</h3><canvas class="chart" id="g2"></canvas></div>' +
    (co.priceHist.length ? '<div class="box"><h3>Share price</h3><canvas class="chart" id="g3"></canvas></div>' : '');
};
UI.mgmtBox = function (co) {
  var ceo = UAE.person(co.ceo);
  var h = '<div class="box"><h3>CEO</h3>' + (ceo ? '<b>' + UI.esc(ceo.name) + '</b> · ' + UI.esc(ceo.title) + ' · salary ' + F().aed(ceo.salary) + '/mo<br>Skills: management ' + ceo.skill.mgmt + ', technology ' + ceo.skill.tech + ', marketing ' + ceo.skill.marketing + ', finance ' + ceo.skill.finance : '—') + '</div>';
  h += '<div class="row"><button class="btn a" data-act="ceo" data-arg="' + co.id + '">CEO expertise, expansion strategies, scope of production & management policies</button></div>';
  h += '<div class="box"><h3>AI strategy traits</h3><table class="t">' + Object.keys(co.traits).map(function (k) { return '<tr><td>' + k + '</td><td class="n">' + co.traits[k].toFixed(2) + '</td></tr>'; }).join('') + '</table>' +
    '<div class="note">AI companies review operations monthly: re-pick suppliers, reprice, advertise, close chronic loss-makers, borrow/repay, expand into their sector or diversify, integrate vertically and buy stakes in listed rivals.</div></div>';
  return h;
};
UI.act.switchCo = function (id) { UAE.S.activeCo = id; UI.fillCoSwitch(); UI.refreshHUD(); UI.toast('Now managing ' + UI.esc(UAE.co(id).name), 'good'); UI.render(); };
UI.act.acquire = function (id) { UI.result(UAE.acquirePrivate(UAE.player(), UAE.co(id)), 'Acquisition completed.'); };
UI.act.buyTech = function (arg) { var p = arg.split('|'); UI.result(UAE.buyTech(UAE.player(), UAE.co(p[0]), p[1]), 'Technology acquired.'); };

/* ============================================================ IC03/04 */
UI.R.products = function () {
  var cls = UI.tabState.pcls || 'all';
  var classes = []; UAE.PRODUCTS.forEach(function (p) { if (classes.indexOf(p.cls) < 0) classes.push(p.cls); });
  var h = '<div class="row"><label>Class</label><select class="in" data-ch="pcls"><option value="all">All classes</option>' + classes.map(function (c) { return '<option' + (c === cls ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>';
  h += '<table class="t"><tr><th>Product</th><th>Class</th><th>Type</th><th class="n">Ref price</th><th class="n">UAE demand/day</th><th class="n">Modelled sales/day</th><th class="n">Sellers</th><th>Leader</th></tr>';
  UAE.PRODUCTS.filter(function (p) { return cls === 'all' || p.cls === cls; }).forEach(function (p) {
    var dem = 0; Object.keys(UAE.S.cities).forEach(function (c) { dem += UAE.cityDemand(c, p.id); });
    var sold = 0, sellers = 0, by = {};
    UAE.allFirms().forEach(function (f) { f.lines.forEach(function (l) { if (l.pid !== p.id) return; sellers++; var s = UAE.FIRM_TYPES[f.type].kind === 'retail' ? (l.sold || 0) : (l.made || 0) / 30; sold += UAE.FIRM_TYPES[f.type].kind === 'retail' ? s : 0; by[f.owner] = (by[f.owner] || 0) + s; }); });
    var lead = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; })[0];
    h += '<tr class="click" data-act="product" data-arg="' + p.id + '"><td>' + p.name + '</td><td>' + p.cls + '</td><td>' + p.kind + '</td><td class="n">' + (p.ref || p.world || p.imp) + '</td><td class="n">' + (p.perCap ? F().num(dem) : 'B2B') + '</td><td class="n">' + F().num(sold, 1) + '</td><td class="n">' + sellers + '</td><td>' + (lead ? UI.coLink(UAE.co(lead)) : '—') + '</td></tr>';
  });
  return h + '</table>';
};
UI.act.pcls = function (a, el) { UI.tabState.pcls = el.value; UI.render(); };
UI.act.product = function (pid) { UI.open(UAE.P[pid].name, function () { return UI.R.product(pid); }, { push: true }); };
UI.R.product = function (pid) {
  var P = UAE.P[pid], city = UI.tabState.pcity || UAE.player().hq;
  var h = UI.tabs('pcity', Object.keys(UAE.CITIES).map(function (k) { return [k, UAE.CITIES[k].name]; }), city);
  h += '<div class="cards">' + UI.card('Demand / day in ' + UAE.CITIES[city].name, P.perCap ? F().num(UAE.cityDemand(city, pid)) + ' ' + P.unit : 'B2B only') +
    UI.card('Reference price', 'AED ' + (P.ref || P.world)) + UI.card('Import landed (to city centre)', 'AED ' + (UAE.importBase(pid) * 1.05 * 1.06).toFixed(2), 'CIF + 5% customs + margin') +
    UI.card('Price elasticity', P.el || '—', 'EST') + '</div>';
  var lines = [], tot = 0;
  UAE.allFirms().forEach(function (f) { if (f.city !== city || UAE.FIRM_TYPES[f.type].kind !== 'retail') return; f.lines.forEach(function (l) { if (l.pid === pid) { lines.push({ f: f, l: l }); tot += l.sold || 0; } }); });
  lines.sort(function (a, b) { return (b.l.sold || 0) - (a.l.sold || 0); });
  h += '<div class="box"><h3>Retail competition in ' + UAE.CITIES[city].name + '</h3><table class="t"><tr><th>Store</th><th>Company</th><th class="n">Price</th><th class="n">Quality</th><th class="n">Brand</th><th class="n">Sold/day</th><th class="n">Share of modelled</th></tr>';
  lines.forEach(function (x) {
    var co = UAE.co(x.f.owner), s = x.f.stock[pid];
    h += '<tr class="click" data-act="openFirm" data-arg="' + x.f.id + '"><td>' + UI.esc(x.f.name) + '</td><td>' + UI.coLink(co) + '</td><td class="n">' + x.l.price.toFixed(2) + '</td><td class="n">' + (s ? Math.round(s.qual) : '—') + '</td><td class="n">' + (co.brand[P.cls] || co.brandBase || 0).toFixed(0) + '</td><td class="n">' + F().num(x.l.sold || 0, 1) + '</td><td class="n">' + F().pct(tot ? (x.l.sold || 0) / tot : 0) + '</td></tr>';
  });
  h += '</table><div class="note">Modelled stores compete with a background of incumbent retailers sized to the city population; the rest of demand is served by them.</div></div>';
  var prods = UAE.allFirms().filter(function (f) { return UAE.FIRM_TYPES[f.type].kind !== 'retail' && f.lines.some(function (l) { return l.pid === pid; }); });
  h += '<div class="box"><h3>Producers & wholesalers (UAE)</h3><table class="t"><tr><th>Firm</th><th>Company</th><th>City</th><th class="n">Price</th><th class="n">Stock</th></tr>';
  prods.forEach(function (f) { var l = f.lines.find(function (x) { return x.pid === pid; }); h += '<tr class="click" data-act="openFirm" data-arg="' + f.id + '"><td>' + UI.esc(f.name) + '</td><td>' + UI.coLink(UAE.co(f.owner)) + '</td><td>' + UAE.CITIES[f.city].name + '</td><td class="n">' + l.price.toFixed(2) + '</td><td class="n">' + F().num(UAE.stockQ(f, pid)) + '</td></tr>'; });
  h += '</table></div>';
  if (P.rec) h += '<div class="box"><h3>Recipe</h3>' + P.rec.in.map(function (x) { return UAE.P[x[0]].name + ' × ' + x[1] + ' ' + UAE.P[x[0]].unit; }).join(' + ') + ' + AED ' + P.rec.lab + ' labour/energy → 1 ' + P.unit + ' · ' + P.rec.cap + ' units/day per line</div>';
  return h;
};
UI.act.openFirm = function (id) { UI.openFirm(id); };

/* ============================================================ IC05 */
UI.firmTable = function (list) {
  var h = '<table class="t"><tr><th>Firm</th><th>Type</th><th>Owner</th><th>District</th><th class="n">Size</th><th>Status</th><th class="n">Revenue / mo</th><th class="n">Profit / mo</th><th>Trend</th></tr>';
  list.slice(0, 400).forEach(function (f, i) {
    var co = UAE.co(f.owner);
    h += '<tr class="click' + (co.controller === 'PLAYER' ? ' me' : '') + '" data-act="openFirm" data-arg="' + f.id + '"><td>' + UAE.FIRM_TYPES[f.type].icon + ' ' + UI.esc(f.name) + '</td><td>' + UAE.FIRM_TYPES[f.type].name + '</td><td>' + UI.coLink(co) + '</td><td>' + UI.esc(UAE.geo.district(f.district).name) + '</td><td class="n">' + f.size + '</td><td>' + (f.status === 'open' ? '<span class="pos">open</span>' : '<span class="t-m">building</span>') + '</td>' +
      '<td class="n">' + F().aed(f.last.rev) + '</td><td class="n">' + UI.money(f.last.profit) + '</td><td><canvas class="spark" id="sp' + i + '"></canvas></td></tr>';
    UI.after(function () { var c = UI.$('sp' + i); if (c) UI.spark(c, f.hist); });
  });
  return h + '</table>' + (list.length ? '' : '<div class="note">No firms yet - press B to build.</div>');
};
UI.R.firms = function () {
  var own = UI.tabState.fown || 'mine', city = UI.tabState.fcity || 'all';
  var h = UI.tabs('fown', [['mine','My companies'],['all','All'],['ai','Competitors']], own) + UI.tabs('fcity', [['all','All cities']].concat(Object.keys(UAE.CITIES).map(function (k) { return [k, UAE.CITIES[k].name]; })), city);
  var list = UAE.allFirms().filter(function (f) {
    var co = UAE.co(f.owner);
    if (own === 'mine' && co.controller !== 'PLAYER') return false; if (own === 'ai' && co.controller === 'PLAYER') return false;
    return city === 'all' || f.city === city;
  }).sort(function (a, b) { return b.last.profit - a.last.profit; });
  return h + UI.firmTable(list);
};

/* ============================================================ IC06 */
UI.R.fin = function () {
  var co = UAE.player(), tab = UI.tabState.fintab || 'is';
  return '<div class="row">' + UI.coLink(co) + '</div>' + UI.tabs('fintab', [['is','Income Statement'],['bs','Balance Sheet'],['cf','Cash Flow'],['seg','🏦 Bank & 🛡 Insurance']], tab) + UI.statements(co, tab);
};

/* ============================================================ IC07 / IC10 */
UI.R.persons = function () {
  var list = Object.keys(UAE.S.persons).map(function (k) { return UAE.S.persons[k]; }).sort(function (a, b) { return UAE.personWealth(b) - UAE.personWealth(a); });
  var h = '<div class="note">All executives and founders are fictional personas. Real executives of real UAE companies are not modelled.</div><table class="t"><tr><th>Person</th><th>Role</th><th>Company</th><th class="n">Net worth</th><th class="n">Mgmt</th><th class="n">Tech</th><th class="n">Mkt</th><th class="n">Fin</th></tr>';
  list.slice(0, 250).forEach(function (p) {
    var co = p.co && UAE.co(p.co);
    h += '<tr class="' + (p.isPlayer ? 'me' : '') + '"><td>' + UI.esc(p.name) + (p.isPlayer ? ' <span class="t-a">YOU</span>' : '') + '</td><td>' + UI.esc(p.title) + '</td><td>' + (co ? UI.coLink(co) : '—') + '</td><td class="n">' + F().aed(UAE.personWealth(p)) + '</td><td class="n">' + p.skill.mgmt + '</td><td class="n">' + p.skill.tech + '</td><td class="n">' + p.skill.marketing + '</td><td class="n">' + p.skill.finance + '</td></tr>';
  });
  return h + '</table>';
};
UI.R.billionaires = function () {
  var list = Object.keys(UAE.S.persons).map(function (k) { return UAE.S.persons[k]; }).map(function (p) { return { p: p, w: UAE.personWealth(p) }; }).sort(function (a, b) { return b.w - a.w; }).slice(0, 100);
  var h = '<div class="note">Billionaire threshold: AED 3.67bn (US$1bn at the dirham peg, REAL). State, sovereign and family holdings in real groups are institutions, not ranked persons.</div>';
  h += '<table class="t"><tr><th>#</th><th>Person</th><th>Company</th><th class="n">Net worth</th></tr>';
  list.forEach(function (x, i) { var co = x.p.co && UAE.co(x.p.co); h += '<tr class="' + (x.p.isPlayer ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + UI.esc(x.p.name) + (x.w >= 3.6725e9 ? ' 💎' : '') + '</td><td>' + (co ? UI.coLink(co) : '—') + '</td><td class="n">' + F().aed(x.w) + '</td></tr>'; });
  return h + '</table>';
};

/* ============================================================ IC08 / IC09 */
UI.R.goals = function () {
  var done = UAE.S.goals.filter(function (g) { return g.done; }).length;
  return '<div class="cards">' + UI.card('Goals achieved', done + ' / ' + UAE.S.goals.length, '', 'a') + '</div><table class="t"><tr><th></th><th>Objective</th><th>Achieved</th></tr>' +
    UAE.S.goals.map(function (g) { return '<tr><td>' + (g.done ? '✅' : '⬜') + '</td><td>' + g.text + '</td><td>' + (g.done ? UAE.cal.label(g.day) : '') + '</td></tr>'; }).join('') + '</table>';
};
UI.R.score = function () {
  var co = UAE.co(UAE.S.playerCo), p = UAE.playerPerson(), ni = UAE.netIncome(UAE.ttm(co));
  return '<div class="cards">' + UI.card('Score', UAE.score(), '', 'a') + UI.card('Company value', F().aed(UAE.companyValue(co)), '× 0.5 pts per AED m') +
    UI.card('Personal net worth', F().aed(UAE.personWealth(p)), '× 0.3 pts per AED m') + UI.card('Net profit TTM', UI.money(ni), '× 2 pts per AED m') + UI.card('Firms', UAE.firmsOf(co.id).length, '× 10 pts') + '</div>' + UI.rankTable('value', co.id);
};

/* ============================================================ IC11 / IC12 */
UI.R.manufacturer = function () {
  var h = '<div class="note">Unit cost uses imported inputs at today\'s landed price (CIF + 5% customs + 6% importer margin) plus labour/energy. Own farms, mines and plants are usually cheaper.</div>';
  h += '<table class="t"><tr><th>Output</th><th>Inputs per unit</th><th class="n">Units/day per line</th><th class="n">Labour+energy</th><th class="n">Est. unit cost</th><th class="n">Import price</th><th class="n">Retail ref</th></tr>';
  UAE.PRODUCTS.filter(function (p) { return p.rec; }).forEach(function (p) {
    var c = p.rec.lab; p.rec.in.forEach(function (x) { c += UAE.importBase(x[0]) * 1.05 * 1.06 * x[1]; });
    h += '<tr class="click" data-act="product" data-arg="' + p.id + '"><td><b>' + p.name + '</b></td><td>' + p.rec.in.map(function (x) { return UAE.P[x[0]].name + ' ' + x[1] + ' ' + UAE.P[x[0]].unit; }).join('<br>') + '</td><td class="n">' + F().num(p.rec.cap) + '</td><td class="n">' + p.rec.lab + '</td><td class="n">' + c.toFixed(2) + '</td><td class="n">' + (UAE.importBase(p.id) * 1.05).toFixed(2) + '</td><td class="n">' + (p.ref || '—') + '</td></tr>';
  });
  return h + '</table>';
};
UI.R.farmer = function () {
  var h = '<div class="box"><h3>Farms (Al Ain, Liwa, Al Lisaili)</h3><table class="t"><tr><th>Product</th><th class="n">Output/day per level</th><th class="n">Variable cost / unit</th><th class="n">World price</th><th>Season</th></tr>';
  Object.keys(UAE.FARM).forEach(function (k) { var s = UAE.FARM[k], P = UAE.P[k]; h += '<tr><td>' + P.name + '</td><td class="n">' + s.out + ' ' + P.unit + '</td><td class="n">' + s.cost + '</td><td class="n">' + P.world + '</td><td>' + (s.harvest ? 'Date harvest Jul-Sep (×3.2), off-season ×0.15' : k === 'veg' ? 'Greenhouse: lower output in summer heat' : 'All year') + '</td></tr>'; });
  h += '</table><div class="note">Water and feed costs scale with the emirate utility tariff. The UAE imports most of its food; local farming is a niche with real water constraints.</div></div>';
  h += '<div class="box"><h3>Natural resources</h3><table class="t"><tr><th>Resource</th><th>Where (real)</th><th class="n">Output/day per level</th><th class="n">Extraction cost</th><th class="n">World price</th></tr>';
  [['crude','Abu Dhabi oilfields: Bab/Habshan onshore, Upper Zakum offshore'],['gas','Abu Dhabi oilfields (associated & non-associated gas)'],['limestone','Ras Al Khaimah (Khor Khwair), Fujairah quarries'],['sand','RAK & Fujairah quarries']].forEach(function (r) {
    var s = UAE.RESOURCE[r[0]], P = UAE.P[r[0]];
    h += '<tr><td>' + P.name + '</td><td>' + r[1] + '</td><td class="n">' + F().num(s.out) + ' ' + P.unit + '</td><td class="n">' + s.cost + '</td><td class="n">' + UAE.worldPrice(r[0]).toFixed(1) + '</td></tr>';
  });
  return h + '</table><div class="note">Logging is disabled - there is no commercial forestry in the UAE (gap audit B06). Bauxite, wheat, gold, chips and cotton are import-only.</div></div>';
};

/* ============================================================ IC13 */
UI.candidates = function () {
  var S = UAE.S;
  if (!S.candidates || S.candDay == null || S.day - S.candDay > 30) {
    var keep = (S.candidates || []).filter(function (id) { var q = UAE.person(id); return q && q.elite && q.title === 'Candidate'; });   // elite hires stay listed
    S.candidates = keep; S.candDay = S.day;
    for (var i = 0; i < 10; i++) {
      var p = UAE.makePerson({ title: 'Candidate' }); p.salary = Math.round((15000 + p.skill.mgmt * 600) / 1000) * 1000; S.candidates.push(p.id);
    }
  }
  return S.candidates.map(UAE.person).filter(function (p) { return p && p.title === 'Candidate'; });
};
UI.R.managers = function () {
  var firms = UAE.firmsOf(UAE.S.activeCo).filter(function (f) { return f.status === 'open' && !f.manager; });
  var h = '<div class="note">A manager raises a firm\'s efficiency (mgmt skill / 1000) and retail attractiveness. Salary is charged monthly to the firm.</div>';
  h += '<table class="t"><tr><th>Candidate</th><th class="n">Mgmt</th><th class="n">Tech</th><th class="n">Mkt</th><th class="n">Fin</th><th class="n">Salary/mo</th><th>Assign to</th></tr>';
  UI.candidates().forEach(function (p) {
    h += '<tr><td>' + UI.esc(p.name) + '</td><td class="n">' + p.skill.mgmt + '</td><td class="n">' + p.skill.tech + '</td><td class="n">' + p.skill.marketing + '</td><td class="n">' + p.skill.finance + '</td><td class="n">' + F().aed(p.salary) + '</td><td>' +
      (firms.length ? '<select class="in" id="mg_' + p.id + '">' + firms.map(function (f) { return '<option value="' + f.id + '">' + UI.esc(f.name) + '</option>'; }).join('') + '</select> <button class="btn sm a" data-act="hire" data-arg="' + p.id + '">Hire</button>' : '<span class="muted">no firm without manager</span>') + '</td></tr>';
  });
  h += '</table><div class="box"><h3>Current managers</h3><table class="t">';
  UAE.firmsOf(UAE.S.activeCo).filter(function (f) { return f.manager; }).forEach(function (f) { var p = UAE.person(f.manager); h += '<tr><td>' + UI.esc(p.name) + '</td><td>' + UI.esc(f.name) + '</td><td class="n">mgmt ' + p.skill.mgmt + '</td><td class="n">' + F().aed(p.salary) + '/mo</td></tr>'; });
  return h + '</table></div>';
};
UI.act.hire = function (pid) { var p = UAE.person(pid), f = UAE.firm(UI.$('mg_' + pid).value); if (!f) return; f.manager = pid; p.title = 'Manager'; p.co = f.owner; UI.toast(UI.esc(p.name) + ' now manages ' + UI.esc(f.name), 'good'); UI.render(); };

/* ============================================================ IC14 */
UI.act.cities = function (id) { if (id) UI.tabState.city = id; UI.open('Cities', UI.R.cities); };
UI.R.cities = function () {
  var id = UI.tabState.city || UAE.player().hq, tab = UI.tabState.ctab || 'overview', c = UAE.S.cities[id], C = UAE.CITIES[id];
  var h = UI.tabs('city', Object.keys(UAE.CITIES).map(function (k) { return [k, UAE.CITIES[k].name]; }), id) +
    UI.tabs('ctab', [['overview','Overview'],['g1','City Graphs 1'],['g2','City Graphs 2'],['econ','Economic Graphs'],['gov','Government Budget'],['gdp','GDP Components'],['ind','Industries'],['qol','Quality of Life'],['rank','City Rankings'],['bonds','Bonds']], tab);
  var src = UI.tag(C.src);
  if (tab === 'overview') {
    h += '<div class="cards">' + UI.card('Population', F().num(c.pop), 'start ' + F().num(C.pop) + ' ' + (id === 'DXB' ? '(REAL end-2025)' : '(EST)')) +
      UI.card('Nominal GDP', 'AED ' + UAE.cityGdp(c).toFixed(1) + 'bn', 'companies ' + (c.modelVA || 0).toFixed(1) + 'bn + rest of economy ' + c.gdp.toFixed(1) + 'bn') + UI.card('GDP per capita', F().aed(UAE.cityGdp(c) * 1e9 / c.pop)) +
      UI.card('CPI index', c.cpiIdx.toFixed(1), 'start = 100; trend ' + F().pct(C.cpi, 2)) + UI.card('Avg compensation', F().aed(C.wage * c.wageIdx) + '/mo', id === 'DXB' ? 'CALC proxy from DSC' : 'EST') +
      UI.card('Unemployment', F().pct(c.unemp, 2)) + UI.card('Tourists / yr', F().num(c.tourists)) + UI.card('Hotel ADR / occ', 'AED ' + C.hotelADR + ' · ' + F().pct(C.hotelOcc, 1)) +
      UI.card('Rent index', c.rentIdx.toFixed(3)) + UI.card('Quality of life', c.qol.toFixed(1)) + UI.card('Companies value added', 'AED ' + (c.modelVA || 0).toFixed(2) + 'bn/yr', F().pct((c.modelVA || 0) / UAE.cityGdp(c), 1) + ' of GDP') + '</div>' +
      '<div class="note">Source quality: ' + src + ' ' + UI.esc(C.src) + '. Dubai and Abu Dhabi are separate city economies inside one UAE: federal VAT (5%), corporate tax (9%) and the CBUAE base rate are shared; demand, wages, rents and budgets are city-specific.</div>';
  } else if (tab === 'g1' || tab === 'g2' || tab === 'econ') {
    var defs = { g1: [['pop','Population'],['rent','Rent index']], g2: [['qol','Quality of life'],['unemp','Unemployment']], econ: [['gdp','Nominal GDP (AED bn)'],['cpi','CPI index']] }[tab];
    defs.forEach(function (d, i) { h += '<div class="box"><h3>' + d[1] + '</h3><canvas class="chart" id="cg' + i + '"></canvas></div>'; });
    UI.after(function () { defs.forEach(function (d, i) { UI.chart(UI.$('cg' + i), [{ label: d[1], data: c.hist.map(function (x) { return x[d[0]]; }), color: UI.COLORS[i] }], { fmt: function (v) { return d[0] === 'unemp' ? (v * 100).toFixed(2) + '%' : UAE.fmt.num(v, 2); } }); }); });
  } else if (tab === 'gov') {
    var L = c.lastGov;
    h += '<div class="box"><h3>Government income statement</h3><table class="t fs">' +
      '<tr><td>Revenue year to date</td><td class="n">' + F().aed(c.govRevYtd) + '</td></tr><tr class="sub"><td>of which VAT collected (modelled firms)</td><td class="n">' + F().aed(c.vat) + '</td></tr>' +
      '<tr class="sub"><td>of which corporate tax (modelled firms)</td><td class="n">' + F().aed(c.ct) + '</td></tr><tr><td>Expenditure year to date</td><td class="n">' + F().aed(c.govExpYtd) + '</td></tr>' +
      '<tr class="total"><td>Balance</td><td class="n">' + UI.money(c.govRevYtd - c.govExpYtd) + '</td></tr>' +
      (L ? '<tr class="sub"><td>Last year balance</td><td class="n">' + UI.money(L.bal) + '</td></tr>' : '') + '</table>' +
      '<div class="note">Baseline: planned revenue AED ' + C.govRev + 'bn, spend AED ' + C.govExp + 'bn per year ' + (id === 'DXB' ? UI.tag('REAL Dubai Budget 2026') : UI.tag('EST')) + ', scaled by GDP. VAT and corporate tax are federal (FTA); they are shown where generated for gameplay - not a statement of real revenue sharing.</div></div>' +
      '<div class="box"><h3>Government balance sheet</h3><table class="t fs"><tr><td>Government debt</td><td class="n">' + F().aed(c.govDebt) + '</td></tr></table><div class="note">' + (id === 'DXB' ? 'Opening AED 110.9bn at 30 Sep 2026 ' + UI.tag('REAL') : 'Opening debt ' + UI.tag('EST')) + '</div></div>';
  } else if (tab === 'gdp') {
    if (id === 'DXB') {
      h += '<div class="box"><h3>Dubai real GDP by industry, 2025 (AED bn)</h3><table class="t">';
      UAE.GDP_SECTORS_DXB.forEach(function (s) { h += '<tr><td>' + s[0] + '</td><td class="n">' + s[1].toFixed(1) + '</td><td class="n">' + F().pct(s[1] / 937) + '</td></tr>'; });
      h += '<tr class="total"><td>Total real GDP</td><td class="n">937.0</td><td class="n">100%</td></tr></table><div class="note">' + UI.tag('REAL') + ' Dubai Statistics Center; residual is calculated.</div></div>';
      h += '<div class="box"><h3>Dubai CPI basket (2019 weights, 2025 change)</h3><table class="t"><tr><th>Component</th><th class="n">Weight</th><th class="n">2025 change</th></tr>' + UAE.CPI_BASKET.map(function (b) { return '<tr><td>' + b[0] + '</td><td class="n">' + b[1].toFixed(2) + '%</td><td class="n ' + UI.cls(b[2]) + '">' + b[2].toFixed(2) + '%</td></tr>'; }).join('') + '</table></div>';
    } else h += '<div class="note">Official sector breakdown not loaded for ' + C.name + ' - refresh from the emirate statistics centre (SCAD for Abu Dhabi). Only Dubai sector GDP is REAL in this build.</div>';
  } else if (tab === 'ind') {
    var by = {};
    UAE.allFirms().forEach(function (f) { if (f.city !== id) return; var r = by[f.type] || (by[f.type] = { n: 0, rev: 0, mine: 0 }); r.n++; r.rev += f.last.rev; if (UAE.co(f.owner).controller === 'PLAYER') r.mine++; });
    h += '<table class="t"><tr><th>Industry</th><th class="n">Firms</th><th class="n">Yours</th><th class="n">Revenue / month</th></tr>' + Object.keys(by).sort(function (a, b) { return by[b].rev - by[a].rev; }).map(function (k) { return '<tr><td>' + UAE.FIRM_TYPES[k].icon + ' ' + UAE.FIRM_TYPES[k].name + '</td><td class="n">' + by[k].n + '</td><td class="n">' + by[k].mine + '</td><td class="n">' + F().aed(by[k].rev) + '</td></tr>'; }).join('') + '</table>';
  } else if (tab === 'qol') {
    h += '<div class="cards">' + UI.card('Quality of life', c.qol.toFixed(1)) + UI.card('Housing affordability', (1 / c.rentIdx).toFixed(3)) + UI.card('Civic & sports facilities', UAE.allFirms().filter(function (f) { return f.city === id && (f.type === 'civic' || f.type === 'sports'); }).length) + '</div>' +
      '<div class="note">QoL rises with civic and sports facilities, community donations (HQ), tourism and affordable rents. Higher QoL attracts residents and so consumer demand.</div>';
  } else if (tab === 'rank') {
    h += UI.cityRankTable();
  } else if (tab === 'bonds') {
    h += UI.bondTable(Object.keys(UAE.S.bonds).map(function (k) { return UAE.S.bonds[k]; }).filter(function (b) { return b.city === id; }));
  }
  return h;
};

UI.cityRankTable = function () {
  return '<table class="t"><tr><th>City</th><th class="n">Population</th><th class="n">GDP bn</th><th class="n">GDP/capita</th><th class="n">QoL</th><th class="n">Unemployment</th><th class="n">Tourists</th></tr>' +
    Object.keys(UAE.S.cities).sort(function (a, b) { return UAE.cityGdp(UAE.S.cities[b]) - UAE.cityGdp(UAE.S.cities[a]); }).map(function (k) {
      var x = UAE.S.cities[k];
      return '<tr class="click" data-act="cities" data-arg="' + k + '"><td>' + UAE.CITIES[k].name + '</td><td class="n">' + F().num(x.pop) + '</td><td class="n">' + UAE.cityGdp(x).toFixed(1) + '</td><td class="n">' + F().aed(UAE.cityGdp(x) * 1e9 / x.pop) + '</td><td class="n">' + x.qol.toFixed(1) + '</td><td class="n">' + F().pct(x.unemp, 2) + '</td><td class="n">' + F().num(x.tourists) + '</td></tr>';
    }).join('') + '</table>';
};

/* ============================================================ IC15 / IC16 */
UI.R.nations = function () {
  var S = UAE.S, tot = { pop: 0, gdp: 0, tour: 0 }, em = {};
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], e = UAE.CITIES[k].emirate, r = em[e] || (em[e] = { pop: 0, gdp: 0, cities: [] });
    r.pop += c.pop; r.gdp += UAE.cityGdp(c); r.cities.push(UAE.CITIES[k].name); tot.pop += c.pop; tot.gdp += UAE.cityGdp(c); tot.tour += c.tourists;
  });
  var h = '<div class="cards">' + UI.card('UAE population (modelled)', F().num(tot.pop)) + UI.card('UAE GDP (sum of emirates)', 'AED ' + tot.gdp.toFixed(0) + 'bn') +
    UI.card('CBUAE base rate', F().pct(S.macro.rate, 2), 'start 3.90% REAL') + UI.card('VAT / Corporate tax', '5% / 9%', 'REAL federal') + UI.card('AED per USD', UAE.RULES.usdAed, 'REAL peg') +
    UI.card('Oil price index', S.macro.oil.toFixed(2), 'Brent proxy') + UI.card('Gold price index', S.macro.gold.toFixed(2)) + '</div>';
  h += '<table class="t"><tr><th>Emirate</th><th>City markets</th><th class="n">Population</th><th class="n">GDP bn</th><th class="n">Share</th></tr>';
  Object.keys(em).forEach(function (e) { h += '<tr><td>' + UAE.EMIRATES[e].name + '</td><td>' + em[e].cities.join(', ') + '</td><td class="n">' + F().num(em[e].pop) + '</td><td class="n">' + em[e].gdp.toFixed(1) + '</td><td class="n">' + F().pct(em[e].gdp / tot.gdp) + '</td></tr>'; });
  return h + '</table><div class="note">Totals add emirate city-markets once (no double counting of Dubai inside UAE totals). Abu Dhabi emirate = Abu Dhabi City + Al Ain + Al Dhafra/Ruwais.</div>';
};
UI.R.party = function () {
  var on = UAE.S.settings.govMode;
  return '<div class="note">The UAE is a federation of seven emirates governed by their Rulers and the Federal Supreme Council. It has no city mayors or party elections of the kind Capitalism Lab simulates, so the Party / Mayor system is replaced here by an <b>Emirate Government &amp; Planning</b> mode (fictional gameplay - not real UAE law).</div>' +
    '<div class="box"><h3>Government Mode</h3><div class="row"><label><input type="checkbox" data-ch="govMode"' + (on ? ' checked' : '') + '> Enable Government Mode</label></div>' +
    '<div class="note">When on, you may build Civic Buildings (schools, hospitals, parks) which raise quality of life and population growth in their city. Their running costs are charged to your company as community investment.</div></div>';
};
UI.act.govMode = function (a, el) { UAE.S.settings.govMode = el.checked; UI.toast('Government Mode ' + (el.checked ? 'on' : 'off'), 'good'); };

/* ============================================================ IC17 */
UI.R.factions = function () {
  var co = UAE.player(), t = UAE.totals(co), listed = UAE.isTradable(co);
  var h = '<div class="row">' + UI.coLink(co) + ' ' + UI.exch(co) + ' · cash ' + F().aed(co.bs.cash) + ' · equity ' + F().aed(t.equity) + ' · rating ' + co.credit + '</div>';
  var box = function (code, title, body) { return '<div class="box"><h3>' + code + ' · ' + title + '</h3>' + body + '</div>'; };
  h += '<div class="grid2"><div>';
  h += box('FA01', 'Bank loan', '<div class="row">Rate ' + F().pct(UAE.loanRate(co), 2) + ' (base ' + F().pct(UAE.S.macro.rate, 2) + ' + spread) · limit ' + F().aed(UAE.creditLimit(co)) + ' · owed ' + F().aed(co.bs.loans) + '</div>' +
    '<div class="row"><input class="in num" id="faLoan" value="50m"> over <select class="in" id="faYears">' + [1, 2, 3, 5, 7, 10].map(function (y) { return '<option value="' + y + '"' + (y === 5 ? ' selected' : '') + '>' + y + ' year' + (y > 1 ? 's' : '') + '</option>'; }).join('') + '</select>' +
    '<button class="btn a sm" data-act="fa" data-arg="loan">Borrow</button><button class="btn sm" data-act="fa" data-arg="repay">Repay early</button></div>' +
    '<div class="note">Loans are repaid in equal monthly instalments over the term. Your CEO never repays loans you took yourself early – only you can.</div>');
  h += box('FA11', 'Issue bonds (5 years)', '<div class="row">Coupon ≈ ' + F().pct(UAE.S.macro.rate + UAE.RULES.bondSpread + UAE.creditSpread(co) - 0.012, 2) + ' · 1% fee</div><div class="row"><input class="in num" id="faBond" value="100m"><button class="btn a sm" data-act="fa" data-arg="bond">Issue</button></div>');
  h += box('FA12', 'Bank deposits', '<div class="row">Deposit rate ' + F().pct(Math.max(0.005, UAE.S.macro.rate + UAE.RULES.depositSpread), 2) + ' · held ' + F().aed(co.bs.deposits) + '</div><div class="row"><input class="in num" id="faDep" value="20m"><button class="btn a sm" data-act="fa" data-arg="deposit">Deposit</button><button class="btn sm" data-act="fa" data-arg="withdraw">Withdraw</button></div>');
  h += box('FA04', 'Dividend policy', '<div class="row">Payout ratio of quarterly profit: <input class="in num" id="faPay" value="' + Math.round(co.payout * 100) + '">% <button class="btn sm" data-act="fa" data-arg="payout">Set</button></div>');
  h += box('FA13', 'Special dividend', '<div class="row"><input class="in num" id="faSpec" value="10m"><button class="btn sm" data-act="fa" data-arg="special">Pay</button></div>');
  h += '</div><div>';
  if (!listed) h += box('FA05', 'IPO on DFM or ADX', '<div class="row">Needs equity ≥ AED 50m and 6 months history. Est. valuation ' + F().aed(UAE.privateValue(co) * 0.9) + '</div>' +
    '<div class="row"><select class="in" id="faEx"><option>DFM</option><option>ADX</option></select> float <input class="in num" id="faFloat" value="25" style="width:60px">% ticker <input class="in" id="faTick" value="' + UI.esc(co.ticker || 'NEWCO') + '" style="width:90px"><button class="btn a sm" data-act="fa" data-arg="ipo">Go public</button></div><div class="note">Your listing is SIMULATED - a fictional company on a real exchange name.</div>');
  else {
    h += box('FA02', 'Issue new shares', '<div class="row">Price ' + F().px(co.price) + ' (5% discount, 2% fees) · <input class="in num" id="faIss" value="' + Math.round(co.shares * 0.05) + '"> shares <button class="btn a sm" data-act="fa" data-arg="issue">Issue</button></div>');
    h += box('FA03', 'Buy back shares', '<div class="row"><input class="in num" id="faBuy" value="' + Math.round(co.shares * 0.02) + '"> shares <button class="btn sm" data-act="fa" data-arg="buyback">Buy back</button></div>');
    h += box('FA14', 'Stock split', '<div class="row"><select class="in" id="faSplit"><option>2</option><option>3</option><option>5</option><option>10</option></select>-for-1 <button class="btn sm" data-act="fa" data-arg="split">Split</button></div>');
    h += box('FA10', 'Privatise (buy out float +25%)', '<div class="row">Cost ' + F().aed((co.holders.PUBLIC || 0) * co.price * 1.25) + ' <button class="btn m sm" data-act="fa" data-arg="privatize">Privatise</button></div>');
  }
  h += box('FA06/07', 'Subsidiaries', '<div class="row"><input class="in" id="faSubName" value="' + UI.esc(co.name.split(' ')[0]) + ' Ventures" style="flex:1"><input class="in num" id="faSubCap" value="50m"><select class="in" id="faSubCity">' + Object.keys(UAE.CITIES).map(function (k) { return '<option value="' + k + '">' + UAE.CITIES[k].name + '</option>'; }).join('') + '</select><button class="btn a sm" data-act="fa" data-arg="sub">Create</button></div>' +
    UAE.allCos().filter(function (c) { return c.parent === co.id; }).map(function (c) { return '<div class="row">' + UI.coLink(c) + ' <input class="in num" id="inj_' + c.id + '" value="10m"><button class="btn sm" data-act="inject" data-arg="' + c.id + '">Inject capital</button><button class="btn sm a" data-act="switchCo" data-arg="' + c.id + '">Manage</button></div>'; }).join(''));
  h += box('FA16', 'Shares & takeovers', '<div class="row"><button class="btn" data-act="stock">Open Stock Market</button></div><div class="note">Buy >50% of a listed company (personal + corporate holdings combined) to take control and run it as a subsidiary.</div>');
  h += box('FA20', 'Acquire private company', '<div class="row">Open a private AI company in Corporations → Make acquisition offer. Real state-linked groups are not for sale.</div>');
  h += '</div></div>';
  return h;
};
UI.act.fa = function (kind) {
  var co = UAE.player(), r;
  switch (kind) {
    case 'loan': r = UAE.takeLoan(co, UI.num('faLoan'), false, { years: +UI.$('faYears').value, by: 'player' }); if (r.ok) r.why = ''; if (r.ok) UI.toast('Loan of ' + F().aed(UI.num('faLoan')) + ' over ' + r.years + ' years at ' + F().pct(r.rate, 2) + (r.bank ? ' from ' + UI.esc(r.bank) : '') + ' – instalment ' + F().aed(r.instalment) + '/month.', 'good'); break;
    case 'repay': r = UAE.repayLoan(co, UI.num('faLoan')); break;
    case 'bond': r = UAE.issueBond(co, UI.num('faBond'), 5); break;
    case 'deposit': r = UAE.deposit(co, UI.num('faDep')); break;
    case 'withdraw': r = UAE.deposit(co, -UI.num('faDep')); break;
    case 'payout': co.payout = Math.max(0, Math.min(1, UI.num('faPay') / 100)); r = { ok: true }; break;
    case 'special': r = UAE.specialDividend(co, UI.num('faSpec')); break;
    case 'ipo': r = UAE.ipo(co, UI.$('faEx').value, Math.max(0.1, Math.min(0.49, UI.num('faFloat') / 100)), UI.$('faTick').value); break;
    case 'issue': r = UAE.issueShares(co, Math.round(UI.num('faIss'))); break;
    case 'buyback': r = UAE.buyback(co, Math.round(UI.num('faBuy'))); break;
    case 'split': r = UAE.split(co, +UI.$('faSplit').value); break;
    case 'privatize': r = UAE.privatize(co); break;
    case 'sub': r = UAE.newSubsidiary(co, UI.$('faSubName').value, UI.num('faSubCap'), UI.$('faSubCity').value); if (r.ok) UI.fillCoSwitch(); break;
  }
  if (r && isNaN(UI.num('faLoan')) && kind === 'loan') r = { ok: false, why: 'Enter an amount like 50m' };
  UI.result(r, 'Transaction completed.');
};
UI.act.inject = function (id) { UI.result(UAE.injectCapital(UAE.player(), UAE.co(id), UI.num('inj_' + id)), 'Capital injected.'); };

/* ============================================================ IC18 */
UI.act.stock = function () { UI.open('Stock Market', UI.R.stock); };
UI.SECTOR_FILTER = { consumer: ['retail','hospitality','aviation','education'], tech: ['tech','internet','telecom','media'], realestate: ['property'], finance: ['bank','finance','holding'], energy: ['oilgas','chemicals','utility','metals','industrial'], transport: ['transport','logistics'] };
UI.R.stock = function () {
  var ex = UI.tabState.sx || 'DFM', sec = UI.tabState.ssec || 'all', S = UAE.S;
  var IDXN = { DFM: 'DFM General Index', ADX: 'ADX FADGI', NYSE: 'NYSE Composite', NASDAQ: 'NASDAQ Composite' };
  var WX = function (x) { return UAE.GLOBAL_EXCH[x] && UAE.GLOBAL_EXCH[x].world; };   // world exchanges: listed in their own tab, not as cards
  var h = '<div class="cards">' + Object.keys(S.index).filter(function (x) { return !WX(x); }).map(function (x) { var I = S.index[x], ch = I.hist.length > 1 ? I.level / I.hist[Math.max(0, I.hist.length - 2)] - 1 : 0; return UI.card(IDXN[x] || x, I.level.toFixed(2), '<span class="' + UI.cls(ch) + '">' + F().pct(ch, 2) + '</span> · base ' + I.base + ' ' + UI.tag(I.src), x === 'ADX' || x === 'NASDAQ' ? 'm' : ''); }).join('') +
    UI.card('Your personal cash', F().aed(UAE.playerPerson().cash), '', 'a') + '</div>';
  h += UI.tabs('sx', [['DFM','Dubai Financial Market'],['ADX','Abu Dhabi Securities Exchange'],['NYSE','🌐 NYSE'],['NASDAQ','🌐 NASDAQ'],['WORLD','🌍 World'],['ALL','All'],['OWN','My holdings']], ex) +
    UI.tabs('ssec', [['all','All sectors'],['consumer','Consumer'],['tech','Tech & Media'],['realestate','Real Estate'],['finance','Banks & Investment'],['energy','Energy & Industry'],['transport','Transport']], sec);
  var me = 'P:' + S.playerPerson, myco = 'C:' + S.activeCo;
  var list = UAE.allCos().filter(function (c) {
    if (!UAE.isTradable(c)) return false;
    if (ex === 'OWN') return c.holders[me] || c.holders[myco];
    if (ex === 'WORLD') { if (!WX(c.exch)) return false; } else if (ex !== 'ALL' && c.exch !== ex) return false;
    return sec === 'all' || UI.SECTOR_FILTER[sec].indexOf(c.sector) >= 0;
  }).sort(function (a, b) { return UAE.mcap(b) - UAE.mcap(a); });
  if (ex === 'WORLD') h += '<table class="t nosort"><tr><th>Exchange</th><th>Index</th><th class="n">Level</th><th class="n">1d</th><th class="n">Companies</th></tr>' + Object.keys(UAE.GLOBAL_EXCH).filter(WX).map(function (x) {
    var E = UAE.GLOBAL_EXCH[x], I = S.index[x]; if (!I) return '';
    var ch = I.hist.length > 1 ? I.level / I.hist[I.hist.length - 2] - 1 : 0, n = UAE.allCos().filter(function (c) { return c.exch === x && UAE.isTradable(c); }).length;
    return '<tr><td>' + (UAE.flag ? UAE.flag(E.ctry) + ' ' : '') + UI.esc(E.name) + '</td><td>' + E.index + '</td><td class="n">' + I.level.toFixed(1) + '</td><td class="n ' + UI.cls(ch) + '">' + F().pct(ch, 2) + '</td><td class="n">' + n + '</td></tr>';
  }).join('') + '</table>';
  h += '<table class="t stk"><tr><th>Ticker</th><th>Company</th><th class="n">Price</th><th class="n">1d</th><th class="n">Mkt cap</th><th class="n">P/E</th><th class="n">Float</th><th class="n">You hold</th><th>30d</th></tr>';
  list.forEach(function (c, i) {
    var ph = c.priceHist, ch = ph.length > 1 ? c.price / ph[ph.length - 2] - 1 : 0, ni = UAE.netIncome(UAE.ttm(c));
    var tot = 0; for (var k in c.holders) tot += c.holders[k];
    var mine = (c.holders[me] || 0) + (c.holders[myco] || 0);
    h += '<tr class="click' + (mine ? ' me' : '') + '" data-act="stockDetail" data-arg="' + c.id + '"><td>' + UI.exch(c) + '</td><td>' + UI.logo(c, 22) + ' ' + UI.esc(c.name) + ' ' + (c.priceSrc ? UI.tag(c.priceSrc) : c.fictional || c.controller === 'PLAYER' ? '<span class="pill syn">SIM</span>' : '') + '</td><td class="n">' + F().px(c.price) + '</td><td class="n ' + UI.cls(ch) + '">' + F().pct(ch, 2) + '</td><td class="n">' + F().aed(UAE.mcap(c)) + '</td>' +
      '<td class="n">' + (ni > 0 ? (UAE.mcap(c) / ni).toFixed(1) : '—') + '</td><td class="n">' + F().pct((c.holders.PUBLIC || 0) / tot) + '</td><td class="n">' + (mine ? F().pct(mine / tot, 2) : '') + '</td><td><canvas class="spark" id="ss' + i + '"></canvas></td></tr>';
    UI.after(function () { var cv = UI.$('ss' + i); if (cv) UI.spark(cv, c.priceHist.slice(-30)); });
  });
  h += '</table><div class="note">Private, state-owned and delisted groups (noon, Emirates, ADNOC parent, DP World, EGA, Mubadala, G42 …) have no tradable quote. Prices tagged REAL are a dated market snapshot; EST prices need refreshing from dfm.ae / adx.ae. Weekend: Saturday-Sunday. NYSE and NASDAQ are US exchanges with their own index; their shares are shown in AED (USD × 3.6725 peg). US and world companies only trade on the market: they do not build firms in the UAE. 🌍 World = the largest companies on Tadawul, London, Paris, Frankfurt, Zurich, Copenhagen, Madrid, Tokyo, Hong Kong, Taiwan, Korea and India (prices EST, shown in AED).</div>';
  return h;
};
UI.act.stockDetail = function (id) { UI.open(function () { return UAE.co(id).name + ' · ' + UAE.co(id).ticker; }, function () { return UI.R.stockDetail(id); }, { push: true }); };
UI.R.stockDetail = function (id) {
  var c = UAE.co(id), ttm = UAE.ttm(c), ni = UAE.netIncome(ttm), S = UAE.S;
  var h = '<div class="row" style="gap:14px">' + UI.logo(c, 56) + '<div><b style="font-size:1.2em">' + UI.esc(c.name) + '</b><br>' + UI.exch(c) + '</div></div><div class="cards">' + UI.card('Last price', 'AED ' + F().px(c.price), c.priceSrc ? 'seed ' + UI.esc(c.priceSrc) : '') + UI.card('Market cap', F().aed(UAE.mcap(c))) +
    UI.card('EPS TTM', (ni / c.shares).toFixed(3)) + UI.card('P/E', ni > 0 ? (UAE.mcap(c) / ni).toFixed(1) + 'x' : '—') + UI.card('Book / share', (UAE.bookValue(c) / c.shares).toFixed(3)) +
    UI.card('Fundamental est.', 'AED ' + F().px(UAE.fundamental(c))) + '</div>';
  h += '<div class="box"><h3>Price history</h3><canvas class="chart" id="sdC"></canvas></div>';
  UI.after(function () { UI.chart(UI.$('sdC'), [{ label: c.ticker, data: c.priceHist.slice() }], { fmt: function (v) { return v.toFixed(2); } }); });
  var me = 'P:' + S.playerPerson, coHold = UAE.allCos().filter(function (x) { return x.controller === 'PLAYER' && x.id !== id; }).reduce(function (t, x) { return t + (c.holders['C:' + x.id] || 0); }, 0);
  h += '<div class="box"><h3>Trade ticket</h3><div class="row"><label>Account</label><select class="in" id="stAcc"><option value="' + me + '">Personal (' + F().aed(UAE.playerPerson().cash) + ')</option>' +
    UAE.tradeAccounts(id).slice(1).map(function (a) { return '<option value="' + a.key + '">' + UI.esc(a.label) + '</option>'; }).join('') + '</select></div>' +
    '<div class="row"><label>Shares</label><input class="in num" id="stQty" value="1m"> <span class="muted">≈ ' + F().aed(c.price * 1e6) + ' per 1m shares · fee 0.15%' + (c.foreign ? ' · US-listed, priced in AED' : '') + '</span></div>' +
    '<div class="row"><button class="btn a" data-act="trade" data-arg="buy|' + id + '">Buy</button><button class="btn m" data-act="trade" data-arg="sell|' + id + '">Sell</button>' +
    '<span class="muted">You hold: personal ' + F().num(c.holders[me] || 0) + ' · your companies ' + F().num(coHold) + ' · combined stake ' + F().pct(UAE.playerStake(c), 2) + '</span></div></div>';
  h += '<div class="row"><button class="btn a" data-act="valuationOf" data-arg="' + c.id + '">💎 How is this valued?</button></div>';
  h += '<div class="box"><h3>Shareholder register</h3>' + UI.holdersTable(c) + '</div><div class="row"><button class="btn" data-act="corp" data-arg="' + id + '">Corporate details</button></div>';
  return h;
};
UI.act.trade = function (arg) {
  var p = arg.split('|'), co = UAE.co(p[1]), key = UI.$('stAcc').value, q = Math.round(UI.num('stQty'));
  if (!(q > 0)) { UI.toast('Enter a share quantity (e.g. 500k, 2m).', 'bad'); return; }
  var r = p[0] === 'buy' ? UAE.buyShares(key, co, q) : UAE.sellShares(key, co, q);
  UI.result(r, r.ok ? (p[0] === 'buy' ? 'Bought ' : 'Sold ') + F().num(r.qty) + ' ' + co.ticker + ' @ ' + r.px.toFixed(3) : '');
};

/* ============================================================ IC19 / IC20 */
UI.R.software = function () {
  var h = '<div class="note">Digital Age DLC software classes (REAL class names from capitalismlab.com). UAE clusters: Dubai Internet City, Dubai Silicon Oasis, Masdar City.</div><table class="t"><tr><th>Class</th><th class="n">Publishers</th><th>Leader</th><th class="n">Leader revenue / mo</th></tr>';
  UAE.SOFTWARE.forEach(function (s) {
    var fs = UAE.allFirms().filter(function (f) { return f.type === 'software' && f.swClass === s; }).sort(function (a, b) { return b.last.rev - a.last.rev; });
    h += '<tr><td>' + s + '</td><td class="n">' + fs.length + '</td><td>' + (fs[0] ? UI.coLink(UAE.co(fs[0].owner)) : '—') + '</td><td class="n">' + (fs[0] ? F().aed(fs[0].last.rev) : '—') + '</td></tr>';
  });
  return h + '</table>' + UI.firmTable(UAE.allFirms().filter(function (f) { return f.type === 'software'; }));
};
UI.R.digital = function () {
  var h = '<div class="box"><h3>Internet business models</h3><table class="t"><tr><th>Model</th><th class="n">Take rate</th><th class="n">GMV / user / yr</th><th class="n">ARPU / yr</th><th>Players</th></tr>';
  Object.keys(UAE.INTERNET_MODELS).forEach(function (k) {
    var M = UAE.INTERNET_MODELS[k], who = UAE.allFirms().filter(function (f) { return f.type === 'internet' && f.model === k; }).map(function (f) { return UAE.co(f.owner).name; });
    h += '<tr><td>' + M.name + '</td><td class="n">' + (M.takeRate ? F().pct(M.takeRate) : '—') + '</td><td class="n">' + (M.gmvPerUser || '—') + '</td><td class="n">' + (M.arpu || '—') + '</td><td>' + UI.esc(who.slice(0, 5).join(', ')) + '</td></tr>';
  });
  h += '</table><div class="note">GMV is not revenue: a marketplace books only its take (commission + fees). All values EST.</div></div>';
  h += '<div class="box"><h3>Prerequisites & economics</h3><table class="t">' +
    '<tr><td>Internet company</td><td>Tech / CBD / free-zone district. Users grow toward a national share vs incumbents; brand (Internet) and quality matter.</td></tr>' +
    '<tr><td>Software company</td><td>Choose a class; revenue falls with the number of rivals in that class.</td></tr>' +
    '<tr><td>Telecom</td><td>Very capital-intensive (AED 900m / level). Competes with e&amp; and du for ~1.9 SIMs per resident.</td></tr>' +
    '<tr><td>Data centre (UAE ext.)</td><td>8 MW per level, ~4.5 GWh/month DEWA industrial power; utilisation ramps with the AI/tech cycle.</td></tr>' +
    '<tr><td>R&amp;D centre</td><td>Raises technology for one product → higher factory quality.</td></tr></table></div>';
  return h;
};

/* ============================================================ IC21 */
UI.act.bonds = function () { UI.open('Bond Market', UI.R.bonds); };
UI.bondTable = function (list) {
  var co = UAE.co(UI.tabState.bdAcc || UAE.player().id);
  var h = '<table class="t"><tr><th>Bond</th><th>Issuer</th><th class="n">Coupon</th><th>Maturity</th><th class="n">Price</th><th class="n">YTM</th><th class="n">You hold (face)</th><th>Trade (face AED)</th></tr>';
  list.forEach(function (b) {
    var pos = co.bondPositions[b.id];
    h += '<tr><td>' + UI.esc(b.name) + '</td><td>' + (b.sovereign ? '<span class="pill syn">SYN sovereign</span>' : UI.esc((UAE.co(b.issuer.slice(3)) || {}).name || '')) + '</td><td class="n">' + F().pct(b.coupon, 2) + '</td><td>' + UAE.cal.label(b.maturity) + '</td><td class="n">' + b.price.toFixed(2) + '</td><td class="n">' + F().pct(b.ytm || 0, 2) + '</td><td class="n">' + F().aed(pos ? pos.face : 0) + '</td>' +
      '<td>' + (b.matured ? 'matured' : '<input class="in num" style="width:80px" id="bd_' + b.id + '" value="10m"> <button class="btn sm a" data-act="bondTrade" data-arg="buy|' + b.id + '">Buy</button> <button class="btn sm m" data-act="bondTrade" data-arg="sell|' + b.id + '">Sell</button>') + '</td></tr>';
  });
  return h + '</table>';
};
UI.R.bonds = function () {
  var all = Object.keys(UAE.S.bonds).map(function (k) { return UAE.S.bonds[k]; });
  return '<div class="row"><label>Trade bonds with</label>' + UI.accountSelect('bdAcc', null, 'C:' + (UI.tabState.bdAcc || UAE.player().id)) + '</div><div class="note">Bond prices move inversely with the CBUAE base rate (' + F().pct(UAE.S.macro.rate, 2) + '). Sovereign issues here are synthetic illustrations, not real Dubai/Abu Dhabi securities. Real UAE sukuk should be loaded separately.</div>' + UI.bondTable(all);
};
UI.act.bondTrade = function (arg) {
  var p = arg.split('|'), face = UI.num('bd_' + p[1]), el = UI.$('bdAcc'), co = el ? UAE.co(el.value.slice(2)) : UAE.player();
  UI.result(UAE.tradeBond(co, p[1], p[0] === 'buy' ? face : -face), 'Bond trade done.');
};

/* ============================================================ Rankings & CEOs */
UI.act.rank = function () { UI.open('Rankings & CEOs', UI.R.rank); };
UI.rankTable = function (by, highlight) {
  var rows = UAE.allCos().filter(function (c) { return c.status !== 'BANKRUPT' && !c.foreign; }).map(function (c) {
    var t = UAE.ttm(c); return { c: c, rev: t.revenue, ni: UAE.netIncome(t), value: UAE.companyValue(c), assets: UAE.totals(c).assets };
  }).sort(function (a, b) { return b[by] - a[by]; });
  var h = '<table class="t"><tr><th>#</th><th>Company</th><th class="n">Revenue TTM</th><th class="n">Net profit TTM</th><th class="n">Value</th><th class="n">Assets</th></tr>';
  rows.forEach(function (r, i) {
    h += '<tr class="click' + (r.c.id === highlight || r.c.controller === 'PLAYER' ? ' me' : '') + '" data-act="corp" data-arg="' + r.c.id + '"><td>' + (i + 1) + '</td><td>' + UI.coLink(r.c) + '</td><td class="n">' + F().aed(r.rev) + '</td><td class="n">' + UI.money(r.ni) + '</td><td class="n">' + F().aed(r.value) + '</td><td class="n">' + F().aed(r.assets) + '</td></tr>';
  });
  return h + '</table>';
};
UI.ceoScore = function (c) {
  var t = UAE.ttm(c), ni = UAE.netIncome(t), eq = Math.max(1, UAE.bookValue(c));
  var roe = ni / eq, h = c.history, growth = 0;
  if (h.length >= 13 && h[h.length - 13].rev > 0) growth = h[h.length - 1].rev / h[h.length - 13].rev - 1;
  var tsr = c.priceHist.length > 250 ? c.price / c.priceHist[c.priceHist.length - 250] - 1 : 0;
  return { score: Math.round(Math.max(0, Math.min(100, 50 + roe * 120 + growth * 40 + tsr * 30))), roe: roe, growth: growth, tsr: tsr };
};
/** Rich list: real people (reported net worth) ranked together with everyone in the game. */
UI.richTable = function (rows, where) {
  var me = UAE.playerPerson(), myRank = rows.findIndex(function (r) { return r.p && me && r.p.id === me.id; }) + 1, total = rows.reduce(function (t, r) { return t + r.nw; }, 0);
  var badge = function (r) {
    if (r.p) return UI.portrait(r.p, 40);
    var ini = r.name.replace(/&.*$/, '').split(' ').filter(Boolean).map(function (x) { return x[0]; }).join('').slice(0, 2);
    return '<span class="portrait" style="width:40px;height:40px;border-radius:50%;display:inline-grid;place-items:center;background:radial-gradient(circle at 50% 35%,#ffd24d55,#05060a);border:1.5px solid #ffd24d;font-family:var(--display);font-size:13px;color:#ffd24d">' + UI.esc(ini) + '</span>';
  };
  var h = '<div class="cards">' + (rows[0] ? UI.card('Richest in ' + where, F().aed(rows[0].nw), UI.esc(rows[0].name), 'a') : '') +
    (myRank ? UI.card('Your rank', '#' + myRank + ' of ' + rows.length, F().aed(rows[myRank - 1].nw)) : '') +
    UI.card('People listed', rows.length, 'combined ' + F().aed(total)) + '</div>';
  h += '<table class="t"><tr><th>#</th><th>Person</th><th class="n">Net worth</th><th>Source of wealth</th><th></th></tr>';
  rows.slice(0, 150).forEach(function (r, i) {
    var mine = r.p && me && r.p.id === me.id;
    h += '<tr class="click' + (mine ? ' me' : '') + '"' + UI.spotAttr({ name: r.name, rank: i + 1, nw: r.nw, what: r.what, p: r.p, wiki: (r.r && r.r.wiki) || (r.p && r.p.wiki), sub: r.p ? r.p.title : (r.ctry ? r.ctry + ' · real person' : ''), tag: r.kind === 'real' ? UI.tag(r.src) : '<span class="pill syn">GAME</span>' }) + '><td>' + (i + 1) + '</td>' +
      '<td><span style="display:inline-flex;align-items:center;gap:10px">' + badge(r) + '<span><b>' + UI.esc(r.name) + '</b>' + (mine ? ' <span class="t-a">YOU</span>' : '') +
      '<br><span class="muted">' + (r.p ? UI.esc(r.p.title) : UI.esc(r.ctry || '')) + '</span></span></span></td>' +
      '<td class="n t-a"><b>' + F().aed(r.nw) + '</b></td><td>' + UI.esc(r.what || '') + '</td>' +
      '<td>' + (r.kind === 'real' ? UI.tag(r.src) : '<span class="pill syn">GAME</span>') + '</td></tr>';
  });
  return h + '</table><div class="note">REAL / EST rows are real people at their publicly reported net worth (in AED, USD × 3.6725). If their main company is listed in the game (Tesla, Amazon, Alphabet, Meta, NVIDIA …), their wealth moves with its in-game share price; the game does not simulate their decisions. GAME rows are you and the fictional characters: cash + shares at market price + mansion. The UAE list covers UAE residents.</div>';
};
UI.act.richPerson = function (id) { UI.tabState.person = id; UI.tabState.pflt = 'all'; UI.tabState.ptab = 'sum'; UI.open('Persons', UI.R.persons, { push: true }); };
UI.R.rank = function () {
  var tab = UI.tabState.rk || 'richuae';
  var h = UI.tabs('rk', [['richuae','💰 UAE Rich List'],['richworld','🌍 Global Rich List'],['ceo','CEO rankings'],['value','By value'],['rev','By revenue'],['ni','By profit'],['assets','By assets'],['city','Cities']], tab);
  if (tab === 'richuae') return h + UI.richTable(UAE.richUAE(), 'the UAE');
  if (tab === 'richworld') return h + UI.richTable(UAE.richGlobal(), 'the world');
  if (tab === 'ceo') {
    var by = UI.tabState.ceoSort || 'nw';
    var rows = UAE.allCos().filter(function (c) { return c.ceo && c.status !== 'BANKRUPT' && UAE.person(c.ceo); }).map(function (c) {
      var p = UAE.person(c.ceo), stake = c.holders ? (c.holders['P:' + p.id] || 0) / c.shares : 0;
      return { c: c, p: p, s: UI.ceoScore(c), nw: UAE.personWealth(p), stake: stake };
    });
    // the player is always listed, even after hiring someone else as CEO
    var me = UAE.playerPerson && UAE.playerPerson();
    if (me && !rows.some(function (r) { return r.p.id === me.id; })) { var pc = UAE.co(UAE.S.playerCo); rows.push({ c: pc, p: me, s: UI.ceoScore(pc), nw: UAE.personWealth(me), stake: pc.holders ? (pc.holders['P:' + me.id] || 0) / pc.shares : 0, owner: true }); }
    rows.sort(function (a, b) { return by === 'nw' ? b.nw - a.nw : b.s.score - a.s.score; });
    var total = rows.reduce(function (t, r) { return t + r.nw; }, 0), myRank = me ? rows.findIndex(function (r) { return r.p.id === me.id; }) + 1 : 0;
    h += UI.tabs('ceoSort', [['nw', 'By net worth'], ['score', 'By performance score']], by);
    if (myRank) h += '<div class="cards">' + UI.card('Your rank', '#' + myRank + ' of ' + rows.length, by === 'nw' ? 'by net worth' : 'by score', 'a') + UI.card('Your net worth', F().aed(rows[myRank - 1].nw)) +
      UI.card('Richest CEO', UI.portrait(rows.slice().sort(function (a, b) { return b.nw - a.nw; })[0].p, 40) + ' ' + F().aed(rows.slice().sort(function (a, b) { return b.nw - a.nw; })[0].nw), UI.esc(rows.slice().sort(function (a, b) { return b.nw - a.nw; })[0].p.name)) + '</div>';
    h += '<div class="note">Net worth = personal cash + shares held at market price (private companies at estimated value) + mansion. CEO score = 50 + ROE×120 + revenue growth×40 + 1-year share return×30, capped 0-100. All CEO personas are fictional.</div>' +
      '<table class="t"><tr><th>#</th><th>CEO</th><th>Company</th><th class="n">Net worth</th><th>Share of all CEO wealth</th><th class="n">Stake</th><th class="n">Score</th><th class="n">ROE</th><th class="n">Rev growth</th><th class="n">TSR 1y</th></tr>';
    rows.forEach(function (r, i) {
      h += '<tr class="click ' + (r.p.isPlayer || (me && r.p.id === me.id) ? 'me' : '') + '"' + UI.spotAttr({ name: r.p.name, rank: i + 1, nw: r.nw, p: r.p, wiki: r.p.wiki, what: r.c.name, sub: r.p.title, tag: '<span class="pill syn">GAME</span> score ' + r.s.score }) + '><td>' + (i + 1) + '</td><td><span style="display:inline-flex;align-items:center;gap:8px">' + UI.portrait(r.p, 34) + UI.esc(r.p.name) + '</span>' + (r.owner ? ' <span class="muted">(owner)</span>' : '') + '</td><td>' + UI.coLink(r.c) + '</td>' +
        '<td class="n t-a">' + F().aed(r.nw) + '</td><td>' + UI.bar(total ? r.nw / total * 100 * 4 : 0, '#b8ff2c', F().pct(total ? r.nw / total : 0, 1)) + '</td>' +
        '<td class="n">' + F().pct(r.stake, 1) + '</td><td class="n">' + r.s.score + '</td><td class="n">' + F().pct(r.s.roe) + '</td><td class="n">' + F().pct(r.s.growth) + '</td><td class="n">' + F().pct(r.s.tsr) + '</td></tr>';
    });
    return h + '</table>';
  }
  if (tab === 'city') return h + UI.cityRankTable();
  return h + UI.rankTable(tab);
};

/* ============================================================ HQ */
UI.act.hq = function () { UI.open('Headquarters', UI.R.hq); };
UI.R.hq = function () {
  var co = UAE.player(), hasHQ = UAE.firmsOf(co.id).some(function (f) { return f.type === 'hq' && f.status === 'open'; });
  var dep = [['cmo','Chief Marketing Officer','Corporate advertising - raises brand of every product class you sell'],['pr','Public Relations','Corporate image (brand)'],
    ['hr','Human Resources','Group-wide training budget'],['cto','Chief Technology Officer','Raises technology of all products'],['ir','Investor Relations','Supports share valuation (+ up to 10%)'],['community','Community Engagement','Donations - raise quality of life in your HQ city']];
  var h = hasHQ ? '' : '<div class="note">You have no Headquarters yet. Build one (B12) in a CBD or commercial district. Departments still run, but an HQ is required for the "HQ" goal.</div>';
  h += '<div class="box"><h3>CEO Office</h3><div class="row"><label><input type="checkbox" data-ch="autoPricing"' + (co.autoPricing ? ' checked' : '') + '> Delegate day-to-day operations to the COO (AI picks suppliers, prices, ads & training monthly for your firms)</label></div>' +
    '<div class="row"><label><input type="checkbox" data-ch="autoRent" data-arg="' + co.id + '"' + (co.autoRent ? ' checked' : '') + '> Real Estate Department sets rents automatically</label></div>' +
    '<div class="row"><label>CEO</label><b>' + UI.esc((UAE.person(co.ceo) || {}).name || '—') + '</b>' + (co.ceoAuto ? ' <span class="t-a">running the company</span>' : '') +
    ' <button class="btn sm a" data-act="ceo" data-arg="' + co.id + '">Expansion strategies · scope · policies</button></div>' +
    '<div class="row"><label>CMO</label><b>' + UI.esc((UAE.person(co.cmo) || {}).name || 'none') + '</b> <span class="muted">marketing expertise strengthens all advertising</span> <button class="btn sm" data-act="persCand">Hire from candidates (Persons)</button></div></div>';
  h += UI.execBox(co);
  h += '<div class="box"><h3>Departments (monthly budgets, AED)</h3>';
  dep.forEach(function (d) { h += '<div class="row"><label>' + d[1] + '</label><input class="in num" id="hq_' + d[0] + '" value="' + Math.round(co.hqBudget[d[0]] || 0) + '"><button class="btn sm" data-act="hqSet" data-arg="' + d[0] + '">Set</button><span class="muted">' + d[2] + '</span></div>'; });
  return h + '</div>';
};
UI.act.hqSet = function (k) { var v = UI.num('hq_' + k); if (v >= 0) { UAE.player().hqBudget[k] = v; UI.toast('Budget set.', 'good'); UI.render(); } };
UI.act.autoPricing = function (a, el) { UAE.player().autoPricing = el.checked; };

/* ============================================================ News */
UI.act.news = function () { UI.open('Event Tracker', UI.R.news); };
UI.newsList = function (list) {
  return '<table class="t">' + list.slice(0, 200).map(function (n) { return '<tr><td class="mono muted" style="white-space:nowrap">' + UAE.cal.label(n.day) + '</td><td><span class="pill">' + n.kind + '</span></td><td>' + UI.esc(n.text) + '</td></tr>'; }).join('') + '</table>';
};
UI.R.news = function () {
  var k = UI.tabState.nk || 'all';
  return UI.tabs('nk', [['all','All'],['event','Economy'],['finance','Finance'],['ai','Competitors'],['firm','My firms'],['goal','Goals'],['warning','Warnings']], k) +
    UI.newsList(UAE.S.news.filter(function (n) { return k === 'all' || n.kind === k; }));
};

/* ============================================================ Sources */
UI.R.sources = function () {
  var src = [
    ['REAL','Dubai GDP 2025 nominal AED 972bn / real 937bn, sectors, CPI basket','Dubai Statistics Center','https://www.dsc.gov.ae'],
    ['REAL','Dubai population 4.58m (end-2025), daytime 6.39m','Dubai Statistics Center','https://www.dsc.gov.ae'],
    ['REAL','19.59m visitors, 80.7% occupancy, ADR AED 579, RevPAR 467 (2025)','Dubai Department of Economy & Tourism','https://www.dubaidet.gov.ae'],
    ['REAL','Dubai Budget 2026: revenue 107.7bn, spend 99.5bn; debt 110.9bn','Government of Dubai, Department of Finance','https://www.dof.gov.ae'],
    ['REAL','Abu Dhabi population 4,135,985 (Census 2024)','Statistics Centre Abu Dhabi','https://www.scad.gov.ae'],
    ['REAL','DEWA electricity & water slab tariffs + fuel surcharge','DEWA','https://www.dewa.gov.ae'],
    ['REAL','VAT 5%, corporate tax 9% above AED 375k','UAE Federal Tax Authority / MoF','https://tax.gov.ae'],
    ['REAL','Customs 5% of CIF','Dubai Customs / GCC common tariff','https://www.dubaicustoms.gov.ae'],
    ['REAL','Base rate 3.90% (28 Oct 2026), AED/USD 3.6725 peg','Central Bank of the UAE','https://www.centralbank.ae'],
    ['REAL','Listed securities DFM & ADX','DFM / ADX directories','https://www.dfm.ae'],
    ['REAL','Share prices ~18 Nov 2026: ENBD 36.18, DEWA 2.82, DIB 7.80, du 12.90, Talabat 1.195, FAB 22.22, Aldar 8.82, ADNOC L&S 7.22, IHC 313; FADGI 9,797.48','FXStreet market report','https://www.fxstreet.com/news/uae-stocks-dfmsi-eases-020-while-fadgi-climbs-027-as-jpmorgan-upgrades-uae-equities-to-overweight-202611181027'],
    ['REAL','e& 21.14, ADNOC Gas 3.20 (undated listing)','StockAnalysis ADX list','https://stockanalysis.com/list/abu-dhabi-securities-exchange/'],
    ['REAL','FY2025 financials: Emaar, DEWA, ENBD, Salik, TECOM, DTC, Parkin, DFM, Emirates Group, DP World, EGA, AD Ports, ADNOC Gas','Company annual results (see master_v3 §10, F3.3)',''],
    ['REAL','Capitalism Lab menus: 21 reports, 29 building types, financial actions, HQ departments','capitalismlab.com documentation','https://www.capitalismlab.com/scripts/script-locks/'],
    ['REAL','Landmark & facility coordinates (Burj Khalifa, Jebel Ali, Ruwais, Yas …)','OpenStreetMap / Mapcarta / operators','https://www.openstreetmap.org'],
    ['EST','Other emirates\' population/GDP splits, rents, land prices, product prices & recipes, strategic stakes, other share prices','Designer calibration - replace with official data when available',''],
    ['SYN','AI start-ups, CEO personas, sovereign bond issues, resource reserve sizes, simulated listings','Game content','']
  ];
  return '<div class="note">Every number in the game carries a tag. REAL = published figure. EST = calibrated estimate. SYN = synthetic game content. The raw research is in the UAE Capitalism folder (master_v3.md, gap audit, CSV, GeoJSON).</div><table class="t"><tr><th>Tag</th><th>Data</th><th>Source</th></tr>' +
    src.map(function (s) { return '<tr><td>' + UI.tag(s[0]) + '</td><td>' + s[1] + '</td><td>' + (s[3] ? '<a href="' + s[3] + '" target="_blank" rel="noopener">' + s[2] + '</a>' : s[2]) + '</td></tr>'; }).join('') + '</table>' +
    '<div class="note">Map imagery © Esri, Maxar, Earthstar Geographics. Map data © OpenStreetMap contributors, © OpenFreeMap; reference labels © Esri.</div>';
};

/* ============================================================ Settings */
UI.act.save = function () { UI.open('Save & Settings', UI.R.settings); };
UI.R.settings = function () {
  var D = UAE.desktop();
  var h = '<div class="box"><h3>Save slots ' + (D ? (D.isPwa ? '(on this phone)' : '(files on this PC)') : '(this browser)') + '</h3>' +
    (D ? '<div class="note">Saved in ' + UI.esc(D.savesDir()) + (D.openSavesDir ? ' <a href="#" data-act="openSaves">open folder</a>' : '') + '</div>' : '') + '<table class="t">';
  [1, 2, 3].forEach(function (s) {
    var m = UAE.slotMeta(s);
    h += '<tr><td>Slot ' + s + '</td><td>' + (m ? UI.esc(m.co) + ' · ' + m.date : '<span class="muted">empty</span>') + '</td><td><button class="btn sm a" data-act="saveSlot" data-arg="' + s + '">Save</button> <button class="btn sm" data-act="loadSlot" data-arg="' + s + '"' + (m ? '' : ' disabled') + '>Load</button></td></tr>';
  });
  h += '</table><div class="row"><label><input type="checkbox" data-ch="autosave"' + (UAE.S.settings.autosave !== false ? ' checked' : '') + '> Autosave to slot 0 every month</label></div></div>';
  h += '<div class="box"><h3>File</h3><div class="row"><button class="btn" data-act="exportSave">Export save (.json)</button><button class="btn" data-act="exportCsv">Export my financials (.csv)</button><button class="btn m" data-act="newGame">New game</button></div>' +
    '<div class="note">Saves are plain, readable JSON - open them in any editor.</div></div>';
  h += '<div class="box"><h3>Options</h3><div class="row"><label><input type="checkbox" data-ch="govMode"' + (UAE.S.settings.govMode ? ' checked' : '') + '> Government Mode (civic buildings)</label></div>' +
    '<div class="row"><label><input type="checkbox" data-ch="constructionTime"' + (UAE.S.settings.constructionTime ? ' checked' : '') + '> Realistic construction time (off = buildings open instantly, like Capitalism Lab)</label></div>' +
    '<div class="row"><label><input type="checkbox" data-ch="hoverHelp"' + (UAE.S.settings.hoverHelp !== false ? ' checked' : '') + '> Beginner hover help (explanations when the mouse points at buttons and numbers)</label> <a href="#" data-act="help">Open Help guide (F1)</a></div>' +
    '<div class="row"><button class="btn" data-act="reloadGame">⟳ Load new game version (Ctrl+Shift+R)</button><span class="muted">after an update: save first, reload, then load your save</span></div></div>';
  if (D && D.listBackups) {
    var bk = D.listBackups().slice(0, 30);
    h += '<div class="box"><h3>🛟 Backups</h3><div class="note">Automatic: before any save slot is overwritten (Save, monthly autosave, restore) the old version is kept (last 20 per slot), plus a full copy of all saves once a day (14 days). ' +
      (D.openBackupsDir ? '<a href="#" data-act="openBackups">Open backups folder</a>' : '') + '</div>';
    h += bk.length ? '<table class="t"><tr><th>Backed up</th><th>Slot</th><th>Company</th><th>Game date</th><th class="n">Size</th><th></th></tr>' + bk.map(function (b) {
      return '<tr><td>' + new Date(b.when).toLocaleString() + ' <span class="pill">' + b.kind + '</span></td><td>' + b.slot + '</td><td>' + UI.esc(b.meta ? b.meta.co : '?') + '</td><td>' + UI.esc(b.meta ? b.meta.date : '?') + '</td>' +
        '<td class="n">' + (b.size / 1048576).toFixed(1) + ' MB</td><td><button class="btn sm" data-act="restoreAsk" data-arg="' + UI.esc(b.file) + '|' + b.slot + '">Restore</button></td></tr>';
    }).join('') + '</table>' : '<div class="muted">No backups yet - they appear the first time a slot is overwritten.</div>';
    h += '</div>';
  }
  var me0 = UAE.playerPerson();
  h += '<div class="box"><h3>🧠 Elite people</h3><div class="row"><button class="btn a" data-act="maxMe">Max my expertise</button>' +
    '<button class="btn" data-act="eliteHire" data-arg="ceo">+ Elite CEO candidate</button><button class="btn" data-act="eliteHire" data-arg="cmo">+ Elite CMO candidate</button>' +
    '<button class="btn" data-act="eliteHire" data-arg="both">+ Both, then open Candidates</button></div>' +
    '<div class="note">Maxed = management, technology, marketing and finance 100, every industry expertise 100 and every product-class expertise 100.' + (me0 && me0.maxed ? ' <span class="t-a">✔ Your expertise is maxed.</span>' : '') +
    ' Elite candidates wait in Persons → Candidates until you appoint them (Appoint as CEO / Appoint as CMO).</div></div>';
  var co = UAE.co(UAE.S.activeCo);
  h += '<div class="box"><h3>💰 Add company cash</h3><div class="row"><label>Company</label><b>' + UI.esc(co.name) + '</b> · cash ' + UAE.fmt.aed(co.bs.cash) + '</div>' +
    '<div class="row"><label>Amount (AED)</label><input class="in num" id="cheatAmt" value="100000000" style="width:160px"><button class="btn a" data-act="addCash">Add cash</button>' +
    [1e8, 1e9, 1e10, 1e11].map(function (v) { return '<button class="btn sm" data-act="addCashQ" data-arg="' + v + '">+' + UAE.fmt.aed(v) + '</button>'; }).join('') + '</div>' +
    '<div class="note">Any amount you like. It is booked as an owner capital injection (share capital) so the balance sheet still balances.' + (co.cheatCash ? ' Added so far: ' + UAE.fmt.aed(co.cheatCash) + '.' : '') + '</div></div>';
  return h;
};
UI.act.constructionTime = function (a, el) { UAE.S.settings.constructionTime = el.checked; UI.toast(el.checked ? 'Buildings now take real construction time.' : 'Buildings now open instantly.', 'good'); };
UI.act.maxMe = function () { UAE.maxExpertise(UAE.playerPerson()); UI.toast('Your expertise is now maxed (100 everywhere).', 'good'); UI.render(); };
UI.act.eliteHire = function (role) {
  var made = role === 'both' ? [UAE.eliteCandidate('ceo'), UAE.eliteCandidate('cmo')] : [UAE.eliteCandidate(role)];
  UI.toast('Elite candidate' + (made.length > 1 ? 's' : '') + ' ready: ' + made.map(function (p) { return UI.esc(p.name) + ' (' + p.elite.toUpperCase() + ')'; }).join(', ') + '. Appoint in Persons → Candidates.', 'good');
  UI.tabState.pflt = 'cand'; UI.tabState.person = made[0].id; UI.tabState.ptab = 'exp'; UI.open('Persons', UI.R.persons, { push: true });
};
UI.act.openBackups = function () { var D = UAE.desktop(); if (D && D.openBackupsDir) D.openBackupsDir(); };
UI.act.restoreAsk = function (arg) {
  var i = arg.lastIndexOf('|'), file = arg.slice(0, i), slot = arg.slice(i + 1);
  UI.modal('<h2>Restore backup to slot ' + UI.esc(slot) + '?</h2><p>The save currently in slot ' + UI.esc(slot) + ' is backed up first, so nothing is lost. Then load slot ' + UI.esc(slot) + ' to play the restored game.</p>' +
    '<div class="row"><button class="btn a" data-act="restoreYes" data-arg="' + UI.esc(arg) + '">Restore</button><button class="btn" data-act="closeModal">Cancel</button></div>');
};
UI.act.restoreYes = function (arg) {
  var i = arg.lastIndexOf('|'), D = UAE.desktop(), ok = D && D.restoreBackup(arg.slice(0, i), arg.slice(i + 1));
  UI.closeModal(); UI.toast(ok ? 'Restored to slot ' + arg.slice(i + 1) + '. Load it from the Save slots list.' : 'Restore failed.', ok ? 'good' : 'bad'); UI.render();
};
UI.act.reloadGame = function () { UI.modal('<h2>Load the new game version?</h2><p>Unsaved progress is lost – save first (Save slots above). After the reload, load your save.</p><div class="row"><button class="btn a" data-act="reloadYes">Reload now</button><button class="btn" data-act="closeModal">Cancel</button></div>'); };
UI.act.reloadYes = function () { location.reload(); };
UI.act.addCash = function () { UI.act.addCashQ(UI.num('cheatAmt')); };
UI.act.addCashQ = function (v) {
  var co = UAE.co(UAE.S.activeCo); v = +v;
  if (!UAE.addCash(co, v)) { UI.toast('Enter an amount above 0.', 'bad'); return; }
  UI.toast('Added ' + UAE.fmt.aed(v) + ' to ' + UI.esc(co.name) + '.', 'good'); UI.refreshHUD && UI.refreshHUD(); UI.render();
};
UI.act.saveSlot = function (s) { UI.result({ ok: UAE.saveSlot(s), why: UAE.desktop() ? 'Could not write the save file.' : 'Browser storage unavailable or full - use the desktop app or export to .json.' }, 'Saved to slot ' + s + '.'); };
UI.act.openSaves = function () { var D = UAE.desktop(); if (D) D.openSavesDir(); };
UI.act.loadSlot = function (s) { if (UAE.loadSlot(s)) { UI.afterLoad(); UI.toast('Loaded slot ' + s, 'good'); } else UI.toast('Load failed.', 'bad'); };
UI.act.autosave = function (a, el) { UAE.S.settings.autosave = el.checked; };
UI.download = function (name, text, type) {
  var D = UAE.desktop();
  if (D) { D.exportFile(name, text).then(function (ok) { if (ok) UI.toast('Exported ' + UI.esc(name), 'good'); }); return; }
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name; a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
};
UI.act.exportSave = function () { UI.download('uae-capitalism-' + UAE.cal.label().replace(/ /g, '-') + '.json', UAE.serialize()); };
UI.act.exportCsv = function () {
  var co = UAE.player(), rows = ['month_end,' + UAE.IS_LINES.join(',') + ',net_income'];
  co.is.months.forEach(function (m) { rows.push(UAE.cal.label(m.day) + ',' + UAE.IS_LINES.map(function (k) { return Math.round(m[k]); }).join(',') + ',' + Math.round(UAE.netIncome(m))); });
  UI.download(co.name.replace(/\W+/g, '_') + '_income_statement.csv', rows.join('\n'), 'text/csv');
};
UI.act.newGame = function () { location.reload(); };
