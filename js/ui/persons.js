/* ============================================================================
 * UAE CAPITALISM LAB  -  IC07 PERSONS & THE CEO (Capitalism Lab Persons report)
 *   Person tabs: Summary · Wealth · Career · Expertise · Personality
 *   CEO tabs (for the CEO of any company; editable for companies you control):
 *     Expansion Strategies · Scope of Production · Management Policies · Financial
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.R.persons = function () {
  var S = UAE.S, flt = UI.tabState.pflt || 'ceo';
  if (UI.candidates) UI.candidates();                 // keep a fresh pool of candidates to hire
  var list = Object.keys(S.persons).map(function (k) { return UAE.ensurePerson(S.persons[k]); }).filter(function (p) {
    if (flt === 'mine') return p.isPlayer || (p.co && UAE.isHuman(UAE.co(p.co)));
    if (flt === 'ceo') return p.co && UAE.co(p.co) && UAE.co(p.co).ceo === p.id;
    if (flt === 'cand') return p.title === 'Candidate';
    return true;
  }).sort(function (a, b) { return (b.elite ? 1 : 0) - (a.elite ? 1 : 0) || UAE.personWealth(b) - UAE.personWealth(a); });   // elite candidates first
  var sel = UI.tabState.person && S.persons[UI.tabState.person] ? S.persons[UI.tabState.person] : (flt === 'cand' && list[0] ? list[0] : UAE.playerPerson());   // opens on you
  var h = '<div class="note">Executives are game characters. Real executives of real companies are not modelled; any real names you give your own staff are for fun, and their decisions are simulated by the game.</div>' +
    UI.tabs('pflt', [['ceo', 'CEOs'], ['mine', 'My staff only'], ['cand', 'Candidates'], ['all', 'Everyone']], flt);
  h += '<div class="split"><div class="plist"><table class="t">' + list.slice(0, 120).map(function (p) {
    var co = p.co && UAE.co(p.co);
    return '<tr class="click' + (p === sel ? ' me' : '') + '" data-act="personSel" data-arg="' + p.id + '"><td style="width:40px">' + UI.portrait(p, 34) + '</td><td>' + UI.esc(p.name) + (p.isPlayer ? ' <span class="t-a">YOU</span>' : '') + (p.elite ? ' <span class="pill real">ELITE ' + p.elite.toUpperCase() + '</span>' : '') + '<br><span class="muted">' + UI.esc(p.title) + (co ? ' · ' + UI.esc(co.name) : '') + '</span></td></tr>';
  }).join('') + '</table></div><div class="pdet">' + UI.personDetail(sel) + '</div></div>';
  return h;
};
UI.act.personSel = function (id) { UI.tabState.person = id; UI.render(); };
UI.act.persCand = function () { UI.tabState.pflt = 'cand'; UI.tabState.person = null; UI.tabState.ptab = 'exp'; UI.open('Persons', UI.R.persons, { push: UI.stack.length > 0 }); };
UI.act.ceo = function (coId) {
  var co = UAE.co(coId || UAE.S.activeCo); UAE.ensurePerson(UAE.person(co.ceo));
  UI.tabState.person = co.ceo; UI.tabState.pflt = 'ceo'; UI.tabState.ptab = UI.tabState.ptab && UI.tabState.ptab.indexOf('c') === 0 ? UI.tabState.ptab : 'cexp';
  UI.open('Persons · CEO', UI.R.persons, { push: UI.stack.length > 0 });
};

UI.personDetail = function (p) {
  if (!p) return '<div class="note">Nobody selected.</div>';
  UAE.ensurePerson(p);
  var co = p.co && UAE.co(p.co), isCeo = co && co.ceo === p.id, tab = UI.tabState.ptab || 'sum';
  var tabs = [['sum', 'Summary'], ['wealth', 'Wealth'], ['career', 'Career'], ['exp', 'Expertise'], ['pers', 'Personality']];
  if (isCeo) tabs = tabs.concat([['cexp', 'Expansion Strategies'], ['cscope', 'Scope of Production'], ['cmgmt', 'Management Policies'], ['cfin', 'Financial']]);
  if (!isCeo && tab.indexOf('c') === 0) tab = 'sum';
  var h = '<div class="pcard">' + UI.portrait(p, 84) + '<div><b>' + UI.esc(p.name) + '</b>' + (p.isPlayer ? ' <span class="t-a">YOU</span>' : '') +
    '<br><span class="muted">' + UI.esc(p.title) + (co ? ' · ' + UI.coLink(co) : '') + '</span>' + (p.isPlayer ? ' <button class="btn sm a" data-act="maxPerson" data-arg="' + p.id + '">' + (p.maxed ? '✔ Expertise maxed' : 'Max my expertise') + '</button> <button class="btn sm" data-act="myLook" data-arg="photo">' + (p.look && p.look.noPhoto ? 'Use my photo' : 'Use drawn portrait') + '</button><button class="btn sm" data-act="myLook" data-arg="style">Change look</button><button class="btn sm" data-act="myLook" data-arg="fem">Man / woman</button><button class="btn sm" data-act="myLook" data-arg="trad">National dress</button>' : '') + ((!p.isPlayer && (!co || UAE.isHuman(co))) ? ' <button class="btn sm" data-act="personEdit" data-arg="' + p.id + '">Edit name &amp; photo</button>' : '') + '<br><span class="muted">age ' + p.age + ' · salary ' + UAE.fmt.aed(p.salary || 0) + '/mo · attitude towards you ' + Math.round(p.attitude || 0) + (p.co && !p.isPlayer ? ' · motivation ' + Math.round(UAE.motivation(p)) + (p.pay ? ' · last month paid ' + UAE.fmt.aed(p.pay.total) : '') : '') + '</span></div></div>';
  if (p.isPlayer && !(p.look && p.look.noPhoto) && UI.playerHero) h += UI.playerHero(p, 340);
  h += UI.tabs('ptab', tabs, tab);
  if (tab === 'sum') {
    h += '<div class="cards">' + UI.card('Net worth', UAE.fmt.aed(UAE.personWealth(p))) + UI.card('Management', p.skill.mgmt) + UI.card('Technology', p.skill.tech) + UI.card('Marketing', p.skill.marketing) + UI.card('Finance', p.skill.finance) + '</div>';
    var managed = UAE.allFirms().filter(function (f) { return f.manager === p.id; });
    if (managed.length) h += '<div class="box"><h3>Manages</h3>' + managed.map(function (f) { return '<a href="#" data-act="openFirm" data-arg="' + f.id + '">' + UI.esc(f.name) + '</a>'; }).join(' · ') + '</div>';
    if (p.title === 'Candidate' || (!p.isPlayer && p.co && UAE.isHuman(UAE.co(p.co)))) h += UI.hireBox(p);   // candidates, or your own staff (move them)
  } else if (tab === 'wealth') {
    var rows = UAE.allCos().filter(function (c) { return c.holders['P:' + p.id]; }).map(function (c) {
      var n = c.holders['P:' + p.id], px = UAE.isTradable(c) ? c.price : UAE.privateValue(c) / c.shares; return { c: c, n: n, v: n * px };
    });
    h += '<div class="cards">' + UI.card('Cash', UAE.fmt.aed(p.cash)) + UI.card('Shareholdings', UAE.fmt.aed(rows.reduce(function (s, r) { return s + r.v; }, 0))) + '</div><table class="t"><tr><th>Company</th><th class="n">Shares</th><th class="n">Value</th></tr>' +
      rows.map(function (r) { return '<tr><td>' + UI.coLink(r.c) + '</td><td class="n">' + UAE.fmt.num(r.n) + '</td><td class="n">' + UAE.fmt.aed(r.v) + '</td></tr>'; }).join('') + '</table>';
  } else if (tab === 'career') {
    h += '<table class="t">' + (p.career || []).slice().reverse().map(function (c) { return '<tr><td>' + UAE.cal.label(c.day) + '</td><td>' + UI.esc(c.text) + '</td></tr>'; }).join('') + '</table>' +
      ((p.career || []).length ? '' : '<div class="note">No career events recorded in this game yet.</div>');
  } else if (tab === 'exp') {
    h += '<div class="box"><h3>Expertise</h3><table class="t">' + UAE.EXPERTISE.map(function (x) {
      var v = p.exp[x[0]] || 0; return '<tr><td>' + x[1] + '</td><td>' + UI.bar(v, '#b8ff2c', Math.round(v) + (v >= 20 ? ' · +' + Math.floor(v / 20) + ' unit level' + (v >= 40 ? 's' : '') : '')) + '</td></tr>';
    }).join('') + '</table></div>';
    var pc = Object.keys(p.pexp || {}).filter(function (k) { return p.pexp[k] >= 1; });
    h += '<div class="box"><h3>Product class expertise</h3>' + (pc.length ? '<table class="t">' + pc.map(function (k) { return '<tr><td>' + k + '</td><td>' + UI.bar(p.pexp[k], '#8f7bff', Math.round(p.pexp[k]) + ' · R&D +' + Math.round(p.pexp[k]) + '%') + '</td></tr>'; }).join('') + '</table>' : '<div class="note">None yet - grows while managing firms that make or sell the class.</div>') + '</div>';
    h += '<div class="note">Every 20 points of expertise in an industry raises the unit level (capacity & productivity) of the firms this person manages. Marketing expertise makes advertising 1% stronger per point, training expertise makes staff learn 1% faster per point, product-class expertise speeds up R&amp;D 1% per point. A CEO applies a quarter of the industry bonus company-wide. Expertise grows with experience.</div>';
  } else if (tab === 'pers') {
    var P = p.pers;
    h += '<table class="t">' + [['aggression', 'Expansion aggressiveness'], ['risk', 'Risk appetite (borrowing)'], ['pricing', 'Pricing (0 discount … 1 premium)'], ['diversify', 'Diversification']].map(function (x) {
      return '<tr><td>' + x[1] + '</td><td>' + UI.bar(P[x[0]] * 100, '#ff2bd6', (P[x[0]] * 100).toFixed(0)) + '</td></tr>';
    }).join('') + '</table>' + (p.co && UAE.co(p.co) && UAE.co(p.co).controller === 'PLAYER' && !p.isPlayer ? '<div class="row"><button class="btn a" data-act="maxPers" data-arg="' + p.id + '">⚡ Max personality &amp; risk appetite</button><button class="btn" data-act="maxPersAll">Max all my CEOs</button></div>' : '') +
      '<div class="note">The CEO\'s personality drives how a company is run (expansion speed, borrowing, pricing, branching into new businesses) – for your companies too when a hired CEO runs them. Max = aggressiveness, risk appetite and diversification at 100; pricing is left as it is.</div>';
  } else h += UI.ceoTab(co, tab);
  return h;
};

UI.hireBox = function (p) {
  var cos = UAE.allCos().filter(function (c) { return c.controller === 'PLAYER'; }), target = UI.tabState.hireFor && UAE.co(UI.tabState.hireFor) ? UI.tabState.hireFor : UAE.S.activeCo;
  var title = p.title === 'Candidate' ? 'Hire' : 'Move to another of your companies';
  return '<div class="box"><h3>' + title + '</h3><div class="row"><label>For company</label><select class="in" id="hireCo" data-ch="hireFor">' + cos.map(function (c) { return '<option value="' + c.id + '"' + (c.id === target ? ' selected' : '') + '>' + UI.esc(c.name) + (c.parent ? ' (subsidiary)' : '') + '</option>'; }).join('') + '</select></div><div class="row">' +
    '<button class="btn a" data-act="hireCeo" data-arg="' + p.id + '">Appoint as CEO</button><button class="btn" data-act="hireCmo" data-arg="' + p.id + '">Appoint as CMO</button><button class="btn" data-act="hireCto" data-arg="' + p.id + '">Appoint as CTO</button>' +
    '<button class="btn" data-act="info" data-arg="managers">Make firm manager…</button>' +
    (p.maxed ? ' <span class="t-a">✔ maxed</span>' : ' <button class="btn sm" data-act="maxPerson" data-arg="' + p.id + '">Max expertise</button>') + '</div></div>';
};
UI.act.hireCeo = function (pid) { var co = UAE.co(UI.$('hireCo').value), p = UAE.person(pid); p.salary = Math.max(p.salary || 0, 60000 + p.skill.mgmt * 1500); UI.result(UAE.appointCeo(co, pid), 'CEO appointed.'); };
UI.act.maxPerson = function (pid) { UAE.maxExpertise(UAE.person(pid)); UI.toast('Expertise maxed.', 'good'); UI.render(); };
UI.act.hireFor = function (a, el) { UI.tabState.hireFor = el.value; };
/** From a company page: open the candidate list with this company preselected. */
UI.act.hireForCo = function (coId) { UI.tabState.hireFor = coId; UI.tabState.pflt = 'cand'; UI.tabState.person = null; UI.tabState.ptab = 'sum'; UI.open('Persons · hire for ' + UAE.co(coId).name, UI.R.persons, { push: true }); };
UI.act.hireCmo = function (pid) { var co = UAE.co(UI.$('hireCo').value); UI.result(UAE.appointCmo(co, pid), 'CMO appointed.'); };

/* ---------------------------------------------------------- CEO tabs */
UI.ceoTab = function (co, tab) {
  var pol = UAE.policy(co), ed = UAE.isHuman(co), dis = ed ? '' : ' disabled', ceo = UAE.person(co.ceo), h = '';
  if (ed) {
    var hired = ceo && !ceo.isPlayer;
    h += '<div class="box"><h3>Delegation</h3><div class="row"><label><input type="checkbox" data-ch="ceoAuto" data-arg="' + co.id + '"' + (co.ceoAuto ? ' checked' : '') + (hired ? '' : ' disabled') + '> Delegate day-to-day running and expansion of ' + UI.esc(co.name) + ' to the CEO</label></div>' +
      (hired ? '<div class="row"><button class="btn m sm" data-act="resumeCeo" data-arg="' + co.id + '">Dismiss CEO and take the role yourself</button></div>' :
        '<div class="note">You are the CEO. Hire a CEO from <a href="#" data-act="tab" data-arg="pflt|cand">Candidates</a> to delegate - the CEO then runs pricing, purchasing, advertising and expansion within the policies below.</div>') + '</div>';
  } else h += '<div class="note">Policies of ' + UI.esc(co.name) + '\'s CEO (view only).</div>';
  if (tab === 'cexp') {
    h += '<div class="box"><h3>Expansion strategies</h3>' +
      '<div class="row"><label><input type="checkbox" data-ch="polFlag" data-arg="' + co.id + '|acquireTech"' + (pol.acquireTech ? ' checked' : '') + dis + '> Acquire tech</label><label><input type="checkbox" data-ch="polFlag" data-arg="' + co.id + '|sellTech"' + (pol.sellTech ? ' checked' : '') + dis + '> Sell tech</label></div>' +
      '<div class="row"><label>Backward integration</label><input type="range" min="0" max="100" value="' + pol.backward + '" data-ch="polBackward" data-arg="' + co.id + '"' + dis + ' style="flex:1"> <b>' + pol.backward + '</b></div>' +
      '<div class="note">Backward integration: tendency to build factories, farms and natural resource firms that supply the inputs your existing factories import.</div>' +
      '<div class="row"><label><input type="checkbox" data-ch="polFlag" data-arg="' + co.id + '|expandRetail"' + (pol.expandRetail ? ' checked' : '') + dis + '> CEO may expand in retail</label></div>' +
      '<div class="grid3">' + UAE.EXPANSION.map(function (x) {
        return '<label><input type="checkbox" data-ch="polExp" data-arg="' + co.id + '|' + x[0] + '"' + (pol.expand[x[0]] ? ' checked' : '') + dis + '> ' + x[1] + '</label>';
      }).join('') + '</div>' + (ed ? '<div class="row"><button class="btn sm a" data-act="polAll" data-arg="' + co.id + '|1">Enable all</button><button class="btn sm m" data-act="polAll" data-arg="' + co.id + '|0">Disable all</button></div>' : '') + '</div>';
  } else if (tab === 'cscope') {
    var classes = UAE.productClasses();
    h += '<div class="box"><h3>Scope of production</h3><div class="note">Product classes the CEO may make, farm, mine and sell. A class cannot be disabled while it is an input of an enabled class; enabling a class enables its inputs.</div><div class="grid3">' + classes.map(function (c) {
      var prods = UAE.PRODUCTS.filter(function (p) { return p.cls === c; }).map(function (p) { return p.name; }).join(', ');
      return '<label title="' + UI.esc(prods) + '"><input type="checkbox" data-ch="polScope" data-arg="' + co.id + '|' + c + '"' + (pol.scope[c] !== false ? ' checked' : '') + dis + '> ' + c + '</label>';
    }).join('') + '</div>' + (ed ? '<div class="row"><button class="btn sm a" data-act="scopeAll" data-arg="' + co.id + '|1">Enable all</button><button class="btn sm m" data-act="scopeAll" data-arg="' + co.id + '|0">Disable all</button></div>' : '') + '</div>';
  } else if (tab === 'cmgmt') {
    var m = pol.mgmt;
    var sel = function (id, opts, cur) { return '<select class="in" id="' + id + '"' + dis + '>' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
    var chk = function (k, label) { return '<label><input type="checkbox" id="mp_' + k + '"' + (m[k] ? ' checked' : '') + dis + '> ' + label + '</label>'; };
    h += '<div class="box"><h3>Management policies</h3>' +
      '<div class="row"><label>Pricing policy</label>' + sel('mpPrice', UAE.PRICE_LEVELS, m.price) + '</div>' +
      '<div class="row"><label>Purchasing policy</label>' + sel('mpPurch', [['own', 'Prefer own supply'], ['cheap', 'Best value (price / quality)'], ['quality', 'Highest quality']], m.purchasing) + '</div>' +
      '<div class="row"><label>Advertising budget</label><input class="in num" id="mpAd" value="' + m.adPct + '"' + dis + '> % of firm revenue<label style="min-width:0">Training</label><input class="in num" id="mpTr" value="' + m.trainPct + '"' + dis + '> %</div>' +
      '<div class="row"><label>Spend on one expansion</label><input class="in num" id="mpCash" value="' + m.expandCashPct + '"' + dis + '> % of cash at most</div>' +
      '<div class="row"><label>Adequate cash for expansion</label><input class="in num" id="mpMinCash" value="' + (m.minCash || 0) + '"' + dis + '><label style="min-width:0">annual profit</label><input class="in num" id="mpMinProfit" value="' + (m.minProfit == null ? '' : m.minProfit) + '" placeholder="none"' + dis + '></div>' +
      '<div class="grid2">' + chk('takeLoans', 'CEO may take bank loans') + '<label class="muted"><input type="checkbox" disabled> CEO may issue new shares – <b>never</b> in your companies (only you can, in Financial Actions)</label>' + chk('issueBonds', 'CEO may issue bonds') +
      chk('closeLosers', 'Close firms losing money for') + chk('farmForRetail', 'Set up farms for retail (not only as inputs)') + '</div>' +
      '<div class="row"><label>Loss months before closing</label><input class="in num" id="mpLoser" value="' + m.loserMonths + '"' + dis + '></div>' +
      (ed ? '<div class="row"><button class="btn a" data-act="polMgmt" data-arg="' + co.id + '">Apply policies</button></div>' : '') +
      '<div class="note">If the company runs out of cash, the CEO issues shares / borrows to survive regardless of these settings (Capitalism Lab rule).</div></div>';
    var over = Object.keys(m.priceOverride || {});
    h += '<div class="box"><h3>Product pricing overrides</h3><div class="row"><select class="in" id="poPid">' + UAE.PRODUCTS.filter(function (p) { return p.perCap; }).map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('') + '</select>' +
      sel('poLvl', UAE.PRICE_LEVELS, 'avg') + (ed ? '<button class="btn sm" data-act="polOverride" data-arg="' + co.id + '">Set for this product</button>' : '') + '</div>' +
      '<table class="t">' + over.map(function (pid) { return '<tr><td>' + UAE.P[pid].name + '</td><td>' + (UAE.PRICE_LEVELS.find(function (x) { return x[0] === m.priceOverride[pid]; }) || [0, '?'])[1] + '</td><td>' + (ed ? '<button class="btn sm m" data-act="polOverrideDel" data-arg="' + co.id + '|' + pid + '">✕</button>' : '') + '</td></tr>'; }).join('') + '</table></div>';
  } else if (tab === 'cfin') {
    h += '<div class="box"><h3>Financial policy</h3><div class="row"><label>Dividend payout ratio</label><input class="in num" id="cfPay" value="' + Math.round((co.payout || 0) * 100) + '"' + dis + '> % of quarterly profit' +
      (ed ? '<button class="btn sm a" data-act="cfPay" data-arg="' + co.id + '">Set</button>' : '') + '</div>' +
      '<div class="cards">' + UI.card('Cash', UAE.fmt.aed(co.bs.cash)) + UI.card('Loans', UAE.fmt.aed(co.bs.loans)) + UI.card('Bonds', UAE.fmt.aed(co.bs.bonds)) + UI.card('Credit rating', co.credit) + UI.card('Credit line left', UAE.fmt.aed(UAE.creditLimit(co))) + '</div>' +
      '<div class="note">Borrowing, share issues and bonds by the CEO follow Management Policies. Use Financial Actions (F11) to act yourself.</div></div>';
  }
  return h;
};
UI.act.ceoAuto = function (id, el) { UAE.co(id).ceoAuto = el.checked; UI.toast(el.checked ? 'The CEO now runs the company within your policies.' : 'You run the company again.', 'good'); };
UI.act.resumeCeo = function (id) { UAE.resumeAsCeo(UAE.co(id)); UI.toast('You are CEO again.', 'good'); UI.render(); };
UI.act.polFlag = function (arg, el) { var p = arg.split('|'); UAE.policy(UAE.co(p[0]))[p[1]] = el.checked; };
UI.act.polBackward = function (arg, el) { UAE.policy(UAE.co(arg)).backward = +el.value; UI.render(); };
UI.act.polExp = function (arg, el) { var p = arg.split('|'); UAE.policy(UAE.co(p[0])).expand[p[1]] = el.checked; };
UI.act.polAll = function (arg) { var p = arg.split('|'), pol = UAE.policy(UAE.co(p[0])); UAE.EXPANSION.forEach(function (x) { pol.expand[x[0]] = p[1] === '1'; }); UI.render(); };
UI.act.polScope = function (arg, el) {
  var p = arg.split('|'), r = UAE.setScope(UAE.co(p[0]), p[1], el.checked);
  if (!r.ok) { UI.toast(UI.esc(r.why), 'bad'); el.checked = true; return; }
  if (r.auto && r.auto.length) UI.toast('Inputs enabled automatically: ' + UI.esc(r.auto.join(', ')), 'good');
  UI.render();
};
UI.act.scopeAll = function (arg) { var p = arg.split('|'), s = UAE.policy(UAE.co(p[0])).scope; UAE.productClasses().forEach(function (c) { s[c] = p[1] === '1'; }); UI.render(); };
UI.act.polMgmt = function (id) {
  var m = UAE.policy(UAE.co(id)).mgmt, n = function (x) { return UI.num(x); };
  m.price = UI.$('mpPrice').value; m.purchasing = UI.$('mpPurch').value;
  if (n('mpAd') >= 0) m.adPct = n('mpAd'); if (n('mpTr') >= 0) m.trainPct = n('mpTr');
  if (n('mpCash') > 0 && n('mpCash') <= 100) m.expandCashPct = n('mpCash');
  m.minCash = n('mpMinCash') >= 0 ? n('mpMinCash') : 0;
  m.minProfit = UI.$('mpMinProfit').value.trim() === '' ? null : n('mpMinProfit');
  if (n('mpLoser') >= 2) m.loserMonths = Math.round(n('mpLoser'));
  ['takeLoans', 'issueBonds', 'closeLosers', 'farmForRetail'].forEach(function (k) { m[k] = UI.$('mp_' + k).checked; }); m.issueShares = false;
  UI.toast('Management policies applied.', 'good'); UI.render();
};
UI.act.polOverride = function (id) { var m = UAE.policy(UAE.co(id)).mgmt; m.priceOverride = m.priceOverride || {}; m.priceOverride[UI.$('poPid').value] = UI.$('poLvl').value; UI.render(); };
UI.act.polOverrideDel = function (arg) { var p = arg.split('|'); delete UAE.policy(UAE.co(p[0])).mgmt.priceOverride[p[1]]; UI.render(); };
UI.act.cfPay = function (id) { var v = UI.num('cfPay'); if (v >= 0 && v <= 100) { UAE.co(id).payout = v / 100; UI.toast('Payout set.', 'good'); UI.render(); } };

/** Player portrait: cycle hair style / skin / glasses, switch man / woman, national dress on / off. */
UI.act.myLook = function (what) {
  var p = UAE.playerPerson(), L = UI.portraitLook(p); p.look = p.look || {};
  if (what === 'photo') p.look.noPhoto = !p.look.noPhoto;
  else if (what === 'fem') p.look.fem = !L.fem;
  else if (what === 'trad') p.look.trad = !L.trad;
  else { var n = ((p.look.n || 0) + 1) % 24; p.look.n = n; p.look.style = n % 4; p.look.skin = ['#f1c9a5', '#e0ac7e', '#c68b5e', '#a86d43', '#8a5533', '#5e3a22'][Math.floor(n / 4) % 6]; p.look.glasses = n % 3 === 0; p.look.beard = n % 2 === 1; }
  UI.render();
};
