/* ============================================================================
 * UAE CAPITALISM LAB  -  UI: other-product tech ranking (in Economy -> Global tech race)
 *                          + Economy -> 💸 Venture capital (funds, angels, start-ups, your raises)
 * Loaded after panels.js / worldui.js.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

/* ---------------------------------------------- other products ranking --- */
UI.prOtherSection = function () {
  var A = UAE.fmt.aed, rows = '', byCls = {}, n = 0, lead = 0, top3 = 0;
  UAE.prProducts().forEach(function (P) { (byCls[P.cls] = byCls[P.cls] || []).push(P); });
  Object.keys(byCls).forEach(function (cls) {
    rows += '<tr class="h"><td colspan="5">' + UI.esc(cls) + '</td></tr>';
    byCls[cls].forEach(function (P) {
      var R = UAE.prRanking(P.id), top = R[0], me = R.find(function (r) { return r.human; });
      var uae = R.find(function (r) { return r.co && !r.co.foreign; });
      var myTech = null; if (!me) UAE.allCos().forEach(function (c) { if (UAE.isHuman(c) && !c.foreign && c.tech && c.tech[P.id] != null) myTech = Math.max(myTech || 0, c.tech[P.id]); });
      if (me) { n++; if (me.rank === 1) lead++; if (me.rank <= 3) top3++; }
      var gap = me ? me.idx - top.idx : null;
      rows += '<tr class="click" data-act="prodRank" data-arg="' + P.id + '"><td><b>' + UI.esc(P.name) + '</b><span class="m-only muted"><br>#1 ' + (top ? top.flag + ' ' + UI.esc(top.name) + ' ' + UI.wmIdx(top.idx) : '—') + '</span></td>' +
        '<td>' + (top ? top.flag + ' ' + UI.esc(top.name) + '<br><span class="muted">index ' + UI.wmIdx(top.idx) + '</span>' : '—') + '</td>' +
        '<td>' + (uae ? UI.esc(uae.name.split(' ').slice(0, 3).join(' ')) + '<br><span class="muted">' + UI.wmIdx(uae.idx) + ' · #' + uae.rank + '</span>' : '<span class="muted">no UAE maker</span>') + '</td>' +
        '<td>' + (me ? UI.wmIdx(me.idx) + ' <span class="' + (gap >= 0 ? 'pos' : 'neg') + '">' + (gap >= 0 ? '+' : '') + gap.toFixed(1) + '</span>' : (myTech != null ? '<span class="muted">tech ' + UI.wmIdx(myTech) + ' · not making it</span>' : '<span class="muted">—</span>')) + '</td>' +
        '<td class="n">' + (me ? '<b>#' + me.rank + '</b>/' + R.length : '—') + '</td></tr>';
    });
  });
  return '<div class="box"><h3>🏭 Other products · global tech ranking</h3><div class="cards">' + UI.card('You make', n + ' of ' + UAE.prProducts().length, 'other products') +
    UI.card('World #1 in', lead + ' of ' + n) + UI.card('Top 3 in', top3 + ' of ' + n) + '</div>' +
    '<table class="t nosort wm-race" style="table-layout:auto;width:100%"><tr><th>Product</th><th>World #1</th><th>Best UAE maker</th><th>Your best · gap</th><th class="n">Your rank</th></tr>' + rows + '</table>' +
    '<div class="note">Every product that is not one of the export markets above. World leaders are real companies (<span class="pill est">EST</span> tech index: 100 = best in 2026, they gain about 0.5-2 points a year). ' +
    'Game companies are ranked by their technology for the product, but only if they make it (factory, farm, mine, oil well or software firm). Raise your technology with R&amp;D centres. Click a product for the full ranking.</div></div>';
};
UI._econRaceBase = UI._econRaceBase || UI.econ_race;
UI.econ_race = function () { return UI._econRaceBase() + UI.prOtherSection(); };

UI.act.prodRank = function (pid) { UI.open('🏭 ' + UAE.P[pid].name + ' · global tech ranking', function () { return UI.R.prodRank(pid); }, { push: true }); };
UI.R.prodRank = function (pid) {
  if (!UAE.P[pid] || (UAE.WM && UAE.WM[pid])) pid = UAE.prProducts()[0].id;
  var R = UAE.prRanking(pid), me = R.find(function (r) { return r.human; }), P = UAE.P[pid];
  var h = '<div class="cards">' + UI.card('World best', UI.wmIdx(UAE.prFrontier(pid)), R[0] ? R[0].name : '') + UI.card('Your best', me ? UI.wmIdx(me.idx) + ' · #' + me.rank + ' / ' + R.length : '—', me ? me.name : 'you do not make it') +
    UI.card('Makers in the game', R.filter(function (r) { return r.co; }).length) + UI.card('Class', UI.esc(P.cls)) + '</div>';
  h += '<div class="box"><h3>Global ranking</h3><table class="t"><tr><th class="n">#</th><th>Company</th><th class="n">Tech index</th><th class="n">Gains / yr</th><th class="n">Firms making it</th><th>Type</th></tr>' +
    R.map(function (r) {
      return '<tr' + (r.human ? ' class="me"' : '') + '><td class="n">' + r.rank + '</td><td>' + r.flag + ' ' + (r.co ? '<a data-act="company" data-arg="' + r.co.id + '">' + UI.esc(r.name) + '</a>' : UI.esc(r.name)) + '</td>' +
        '<td class="n"><b>' + UI.wmIdx(r.idx) + '</b></td><td class="n">' + (r.leader ? '+' + r.leader[3].toFixed(1) : 'R&amp;D') + '</td><td class="n">' + (r.co ? r.firms : '—') + '</td>' +
        '<td>' + (r.leader ? 'world leader <span class="pill est">EST</span>' : r.human ? 'yours' : 'game company') + '</td></tr>';
    }).join('') + '</table><div class="note">Real company names; their tech indexes are estimates for the game. Your index rises with each R&amp;D project and slowly with production.</div></div>';
  return h;
};

/* ---------------------------------------------- venture capital screen --- */
UI.econ_vc = function () {
  var V = UAE.vcInit(), A = UAE.fmt.aed, S = UAE.S, yr = S.day - 365;
  var funds = Object.keys(V.funds).map(function (k) { var f = V.funds[k]; return { f: f, v: UAE.vcFundValue(f) }; }).sort(function (a, b) { return b.v.total - a.v.total; });
  var deals = V.deals.filter(function (d) { return d.day >= yr; }), dealAmt = deals.reduce(function (s, d) { return s + d.amt; }, 0);
  var starts = UAE.allCos().filter(UAE.vcEligible).sort(function (a, b) { return UAE.vcValuation(b) - UAE.vcValuation(a); });
  var pp = UAE.playerPerson(), co = UAE.player();
  var h = '<div class="cards">' + UI.card('Venture funds', funds.length, 'UAE &amp; Gulf · names REAL, sizes EST') +
    UI.card('Dry powder', A(funds.reduce(function (s, x) { return s + x.f.cash; }, 0)), 'cash ready to invest') +
    UI.card('Deals (12 months)', deals.length, A(dealAmt) + ' raised') + UI.card('Start-ups open to investors', starts.length) +
    UI.card('Your personal cash', A(pp.cash), 'for angel investing', 'a') + '</div>';

  // your companies raising money
  var mine = UAE.allCos().filter(function (c) { return UAE.isHuman(c) && !c.foreign && c.status === 'PRIVATE'; });
  h += '<div class="box"><h3>💼 Raise venture money for your private companies</h3>';
  if (!mine.length) h += '<div class="note">All your companies are listed - raise money with Financial Actions → Issue new shares.</div>';
  mine.forEach(function (c) {
    var of = V.offers[c.id], list = of && of.list.filter(function (o) { return o.exp >= S.day; }) || [];
    h += '<div class="row">' + UI.coLink(c) + ' <span class="muted">value ' + A(UAE.privateValue(c)) + ' · your stake ' + UI.pc(UAE.playerStake(c), 1) + (c.vc ? ' · raised so far ' + A(c.vc.raised) : '') + '</span> <button class="btn a sm" data-act="vcPitch" data-arg="' + c.id + '">📣 Pitch investors</button></div>';
    if (list.length) h += '<table class="t nosort"><tr><th>Investor</th><th class="n">Invests</th><th class="n">Pre-money</th><th class="n">Stake sold</th><th>Valid until</th><th></th></tr>' +
      of.list.map(function (o, i) {
        if (o.exp < S.day) return '';
        return '<tr><td>' + UI.esc(o.name) + '</td><td class="n">' + A(o.amt) + '</td><td class="n">' + A(o.pre) + '</td><td class="n">' + UI.pc(o.amt / (o.pre + o.amt), 1) + '</td><td>' + UAE.cal.label(o.exp) + '</td>' +
          '<td><button class="btn a sm" data-act="vcAccept" data-arg="' + c.id + '|' + i + '">Accept</button></td></tr>';
      }).join('') + '</table>';
  });
  h += '<div class="note">Funds buy NEW shares: the cash goes into the company, you keep control (deals that would take you to 50% or below are refused). One term sheet per pitch, one pitch a month. Your CEO never does this - only you.</div></div>';

  // start-ups
  h += '<div class="box"><h3>🚀 Start-ups open to investors</h3><table class="t vc-t"><tr><th>Start-up</th><th>Last round</th><th class="n">Raised</th><th class="n">Venture value</th><th class="n">Your stake</th><th>Invest (AED)</th></tr>' +
    starts.slice(0, 40).map(function (c) {
      var v = UAE.vcValuation(c), st = c.vc;
      return '<tr><td>' + UI.coLink(c) + '<br><span class="muted">' + UI.esc(UAE.SECTORS[c.sector] ? UAE.SECTORS[c.sector].name || c.sector : c.sector) + ' · ' + UI.esc(UAE.CITIES[c.hq] ? UAE.CITIES[c.hq].name : c.hq) + '</span></td>' +
        '<td>' + (st && st.round ? UI.esc(st.round) + '<br><span class="muted">' + UAE.cal.label(st.last) + '</span>' : '<span class="muted">founders</span>') + '</td>' +
        '<td class="n">' + A(st ? st.raised : 0) + '</td><td class="n">' + A(v) + '</td><td class="n">' + UI.pc(UAE.playerStake(c), 1) + '</td>' +
        '<td><input class="in num" id="vcAmt_' + c.id + '" value="' + UAE.fmt.num(Math.min(v * 0.05, 50e6) / 1e6) + 'm" style="width:70px"> ' +
        '<button class="btn a sm" data-act="vcInv" data-arg="' + c.id + '|me" title="From your personal cash (angel investor)">👤 Me</button> ' +
        '<button class="btn sm" data-act="vcInv" data-arg="' + c.id + '|co" title="From ' + UI.esc(co.name) + ' (corporate venture capital)">🏢 Company</button></td></tr>';
    }).join('') + '</table><div class="note">You buy new shares at the venture value (book &amp; earnings value × a start-up premium for growth), at most 25% of it per investment and below 49% in total. Private shares cannot be sold until the start-up lists (IPO) or is bought - then they pay out like the funds.</div></div>';

  // funds
  h += '<div class="box"><h3>🏦 Venture funds</h3><table class="t"><tr><th>Fund</th><th>Stages</th><th class="n">Cash</th><th class="n">Portfolio value</th><th class="n">Invested</th><th class="n">Returned</th><th class="n">Multiple</th><th class="n">Companies</th></tr>' +
    funds.map(function (x) {
      var f = x.f, mult = f.deployed > 0 ? (f.returned + x.v.stakes) / f.deployed : 0;
      return '<tr class="click" data-act="vcFund" data-arg="' + f.id + '"><td><b>' + UI.esc(f.name) + '</b><br><span class="muted">' + UI.esc(f.base) + ' · ' + ({ vc: 'venture capital', gov: 'government-backed', angel: 'angel network' }[f.kind]) + '</span></td>' +
        '<td>' + f.stages.map(function (s) { return UAE.VC_STAGES[s].k; }).join(', ') + '</td><td class="n">' + A(f.cash) + '</td><td class="n">' + A(x.v.stakes) + '</td><td class="n">' + A(f.deployed) + '</td><td class="n">' + A(f.returned) + '</td>' +
        '<td class="n">' + (mult ? mult.toFixed(2) + '×' : '—') + '</td><td class="n">' + x.v.list.length + '</td></tr>';
    }).join('') + '</table></div>';

  // angels
  h += '<div class="box"><h3>👼 Angel investors <span class="pill">SYN</span></h3><table class="t"><tr><th>Angel</th><th class="n">Cash</th><th class="n">Net worth</th><th class="n">Start-ups</th></tr>' +
    V.angels.map(UAE.person).filter(Boolean).map(function (p) {
      var n = UAE.allCos().filter(function (c) { return c.holders && c.holders['P:' + p.id] > 0; }).length;
      return '<tr><td>' + UI.esc(p.name) + '<br><span class="muted">age ' + p.age + '</span></td><td class="n">' + A(p.cash) + '</td><td class="n">' + A(UAE.personWealth(p)) + '</td><td class="n">' + n + '</td></tr>';
    }).join('') + '</table><div class="note">Angels write the first cheques (Pre-seed, Seed, Series A). They sell their shares after an IPO like the funds.</div></div>';

  // deals
  h += '<div class="box"><h3>📜 Recent deals</h3><table class="t"><tr><th>Date</th><th>Company</th><th>Round</th><th class="n">Amount</th><th class="n">Post-money</th><th>Investors</th></tr>' +
    V.deals.slice(0, 40).map(function (d) {
      var c = UAE.co(d.co);
      return '<tr' + (d.mine ? ' class="me"' : '') + '><td>' + UAE.cal.label(d.day) + '</td><td>' + (c ? UI.coLink(c) : UI.esc(d.name)) + '</td><td>' + UI.esc(d.round) + '</td><td class="n">' + A(d.amt) + '</td><td class="n">' + A(d.post) + '</td><td>' + UI.esc(d.who.join(', ')) + '</td></tr>';
    }).join('') + (V.deals.length ? '' : '<tr><td colspan="6" class="muted">No deals yet - rounds happen at month end.</td></tr>') + '</table></div>';
  return h;
};
UI.act.vcInv = function (arg) {
  var p = String(arg).split('|'), c = UAE.co(p[0]), amt = UI.num('vcAmt_' + p[0]);
  UI.result(UAE.vcPlayerInvest(c, amt, p[1] === 'me' ? 'me' : UAE.player().id), 'Investment done.');
};
UI.act.vcPitch = function (id) { var r = UAE.vcPitch(UAE.co(id)); UI.result(r, r.ok ? r.n + ' term sheet' + (r.n > 1 ? 's' : '') + ' received.' : ''); };
UI.act.vcAccept = function (arg) { var p = String(arg).split('|'); UI.result(UAE.vcAccept(UAE.co(p[0]), +p[1]), 'Funding round closed - cash received.'); };
UI.act.vcFund = function (id) { UI.open('🏦 ' + UAE.S.vc.funds[id].name, function () { return UI.R.vcFund(id); }, { push: true }); };
UI.R.vcFund = function (id) {
  var V = UAE.vcInit(); if (!V.funds[id]) id = Object.keys(V.funds)[0];
  var f = UAE.S.vc.funds[id], v = UAE.vcFundValue(f), A = UAE.fmt.aed;
  var h = '<div class="cards">' + UI.card('Fund size', A(f.aum), 'EST') + UI.card('Cash', A(f.cash)) + UI.card('Portfolio value', A(v.stakes)) + UI.card('Returned to investors', A(f.returned)) + '</div>';
  h += '<div class="box"><h3>Portfolio</h3><table class="t"><tr><th>Company</th><th>Status</th><th class="n">Stake</th><th class="n">Cost</th><th class="n">Value</th><th class="n">Multiple</th></tr>' +
    v.list.map(function (x) {
      return '<tr><td>' + UI.coLink(x.c) + '</td><td>' + UI.esc(x.c.status === 'LISTED' ? 'listed ' + (x.c.exch || '') : (x.c.vc && x.c.vc.round) || x.c.status) + '</td><td class="n">' + UI.pc(x.sh, 2) + '</td><td class="n">' + A(x.cost) + '</td><td class="n">' + A(x.val) + '</td><td class="n">' + (x.cost ? (x.val / x.cost).toFixed(2) + '×' : '—') + '</td></tr>';
    }).join('') + (v.list.length ? '' : '<tr><td colspan="6" class="muted">No investments yet.</td></tr>') + '</table></div>';
  return h;
};

/* Financial Actions: pointer to venture funding */
UI._factionsVcBase = UI._factionsVcBase || UI.R.factions;
UI.R.factions = function () {
  return UI._factionsVcBase() + '<div class="box"><h3>FA22 · Venture capital &amp; angel investors</h3><div class="row">Pitch your private companies to VC funds, or invest in start-ups as an angel. <button class="btn a sm" data-act="vcOpen">💸 Open Venture capital</button></div></div>';
};
UI.act.vcOpen = function () { UI.act.economy('vc'); };
