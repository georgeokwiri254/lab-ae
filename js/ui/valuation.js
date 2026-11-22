/* ============================================================================
 * UAE CAPITALISM LAB  -  "HOW IS THIS COMPANY VALUED?"
 * Step-by-step valuation shown with the company's own live numbers
 * (Corporate Details -> Valuation tab, and on every stock page).
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.valuationBox = function (co) {
  var v = UAE.valuationBreakdown(co), A = UAE.fmt.aed, N = function (x, d) { return x == null ? '—' : x.toFixed(d == null ? 2 : d); };
  var step = function (n, title, body) { return '<div class="vstep"><div class="vnum">' + n + '</div><div><h4>' + title + '</h4>' + body + '</div></div>'; };
  var row = function (a, b, c) { return '<tr><td>' + a + '</td><td class="n">' + b + '</td><td class="muted">' + (c || '') + '</td></tr>'; };
  var h = UI.driversBox(co) + '<div class="box"><h3>How is ' + UI.esc(co.name) + ' valued?</h3>';
  h += '<div class="cards">' + UI.card('Book equity', A(v.book), 'on the balance sheet') + UI.card(v.listed ? 'Market value' : 'Estimated value', A(v.value), v.listed ? 'share price × shares' : 'private company', 'a') +
    UI.card('Value not on the balance sheet', A(v.implied), 'brand, technology, customers, growth', 'm') + UI.card('Price / book', v.pb ? N(v.pb, 1) + '×' : '—') + UI.card('Price / earnings', v.peRatio ? N(v.peRatio, 1) + '×' : '—') + '</div>';

  h += step(1, 'What the balance sheet says (book value)', '<table class="t">' + row('Total assets', A(v.assets), 'cash, buildings, land, stock, investments') + row('− Liabilities', A(v.liabs), 'loans, bonds, deposits owed') +
    row('<b>= Book equity</b>', '<b>' + A(v.book) + '</b>', 'share capital ' + A(v.shareCap) + ' + retained profits ' + A(v.retained)) + '</table>' +
    '<div class="note">There are <b>no intangible assets</b> on the balance sheet on purpose: under accounting rules (IFRS, IAS 38) a brand, technology, customer base or software you <i>built yourself</i> is not recorded as an asset – only things you bought. So book equity is only what the company has physically put in: cash, buildings, land and stock.</div>');

  h += step(2, 'What investors pay for: earnings', '<table class="t">' + row('Net profit, last 12 months (TTM)', A(v.ni), 'revenue ' + A(v.revTTM)) +
    row('× Sector P/E multiple', N(v.pe, 0) + '×', v.sector + ' – what investors pay per AED 1 of yearly profit') +
    row('× Growth factor', N(v.growth), v.rawGrowth ? 'monthly revenue is ' + N(v.rawGrowth) + '× a year ago → √' + N(v.rawGrowth) + ' = ' + N(Math.sqrt(v.rawGrowth)) + (v.growth !== Math.sqrt(v.rawGrowth) ? ', limited to 0.70–1.60' : '') : 'not enough history yet') +
    row('<b>= Earnings value</b>', '<b>' + A(v.earnValue) + '</b>', 'profit × P/E × growth') + '</table>' +
    '<div class="note">A company making ' + A(v.ni) + ' a year and growing fast is worth many years of that profit – the same way real markets value NVIDIA or Apple far above their book value.</div>');

  if (v.listed && !v.seed) {
    h += step(3, 'Fair (fundamental) value', '<table class="t">' + row('0.70 × earnings value', A(v.earnValue * 0.7), 'investors discount future profit a little') + row('+ 0.45 × book equity', A(v.book * 0.45), 'assets give a safety cushion') +
      row('= Blend', A(v.blend), 'never below 0.6 × book = ' + A(v.floor)) + row('× Investor-relations boost', N(v.ir, 3), 'from your HQ investor-relations budget (max +10%)') +
      row('× Market mood', N(v.mood, 3), 'whole-market sentiment (crashes, booms)') + row('<b>÷ ' + UAE.fmt.num(v.shares) + ' shares = fair price</b>', '<b>AED ' + N(v.fundPrice) + '</b>', 'per share') + '</table>');
    h += step(4, 'The share price chases the fair price', '<table class="t">' + row('Today\'s share price', 'AED ' + N(v.price), (v.gap >= 0 ? 'fair price is ' : 'fair price is ') + Math.abs(v.gap * 100).toFixed(1) + '% ' + (v.gap >= 0 ? 'higher → price tends to rise' : 'lower → price tends to fall')) +
      row('× Shares', UAE.fmt.num(v.shares)) + row('<b>= Market value (market cap)</b>', '<b>' + A(v.mcap) + '</b>', 'this is the "Company value" at the top of the screen') + '</table>' +
      '<div class="note">Every trading day the price moves 3% of the way towards the fair price, plus random daily noise and the whole market\'s mood. So the market value follows profit and growth with a delay, and can overshoot either way.</div>');
  } else if (v.listed && v.seed) {
    h += step(3, 'Real listed company', '<div class="note">Real companies start at their real share price and then move with their profit: price = starting price × √(profit now ÷ profit at the start), phased in over the first year, plus market mood and daily noise.</div>' +
      '<table class="t">' + row('Fair price', 'AED ' + N(v.fundPrice)) + row('Share price', 'AED ' + N(v.price)) + row('<b>Market value</b>', '<b>' + A(v.mcap) + '</b>') + '</table>');
  } else {
    h += step(3, 'Private company value', '<table class="t">' + row('0.5 × book equity', A(v.book * 0.5)) + row('+ profit × P/E × 0.8', A(Math.max(0, v.ni) * v.pe * 0.8), 'private shares can\'t be sold easily, so 20% less') +
      row('= Earnings-based value', A(v.privBlend)) + row('Floor: book equity', A(v.privFloor)) + row('<b>Value = the higher of the two</b>', '<b>' + A(v.value) + '</b>') + '</table>');
  }
  h += step(listed5(v), 'So where does the gap come from?', '<div class="note">Value (' + A(v.value) + ') − book equity (' + A(v.book) + ') = <b>' + A(v.implied) + '</b>. That is the market\'s price for things accounting does not record: your brand, technology, customers, team and expected growth. ' +
    'If profit falls or growth slows, this gap shrinks fast; book equity only changes when you earn, lose, raise or pay out money.</div>');
  return h + '</div>';
};
function listed5(v) { return v.listed && !v.seed ? 5 : 4; }
UI.act.valuationOf = function (id) { UI.tabState.corp = 'valuation'; UI.act.corp(id); };

/* ------------------------------------------------ WHY is it worth this much? */
UI.DRIVER_COL = { assets: '#9fb3c8', brand: '#ff2bd6', tech: '#00f0ff', cust: '#b8ff2c', ops: '#ffd24d', growth: '#b98cff', mood: '#ff8a3d' };
UI.driversBox = function (co) {
  var D = UAE.valueDrivers(co), A = UAE.fmt.aed, T = Math.max(1, D.total);
  var pos = D.parts.filter(function (p) { return p.aed > 0; }), posSum = pos.reduce(function (s, p) { return s + p.aed; }, 0);
  var h = '<div class="box"><h3>Why is ' + UI.esc(co.name) + ' worth ' + A(D.total) + '?</h3>';
  h += '<div class="vbar">' + pos.map(function (p) { return '<span style="flex:' + p.aed / posSum + ';background:' + UI.DRIVER_COL[p.k] + '" title="' + UI.esc(p.name + ': ' + A(p.aed)) + '"></span>'; }).join('') + '</div>';
  h += '<table class="t"><tr><th>Source of value</th><th class="n">AED</th><th class="n">Share</th><th>Why</th></tr>' + D.parts.map(function (p) {
    return '<tr><td><span class="vdot" style="background:' + UI.DRIVER_COL[p.k] + '"></span><b>' + p.name + '</b></td><td class="n ' + (p.aed < 0 ? 'neg' : '') + '">' + A(p.aed) + '</td><td class="n">' + (p.aed / T * 100).toFixed(1) + '%</td><td class="muted">' + UI.esc(p.why) + '</td></tr>';
  }).join('') + '<tr><td><b>Total</b></td><td class="n"><b>' + A(D.total) + '</b></td><td class="n">100%</td><td></td></tr></table>';
  // the biggest single reasons, in words
  var main = D.parts.filter(function (p) { return p.k !== 'mood' && p.aed > 0; }).sort(function (a, b) { return b.aed - a.aed; }).slice(0, 3);
  h += '<div class="note"><b>In short:</b> ' + main.map(function (p, i) { return (i ? (i === main.length - 1 ? ' and ' : ', ') : '') + '<b>' + p.name.toLowerCase() + '</b> (' + (p.aed / T * 100).toFixed(0) + '%)'; }).join('') +
    ' make up most of the value. ' + (D.parts[6].aed < 0 ? 'The share price is still ' + A(-D.parts[6].aed) + ' below fair value, so it tends to rise if profits hold.' : D.parts[6].aed > 0 ? 'Investors currently pay ' + A(D.parts[6].aed) + ' above fair value – that premium can disappear quickly.' : '') + '</div>';
  if (D.top.length) h += '<h4>Businesses creating the most value</h4><table class="t"><tr><th>Business</th><th class="n">Profit / month</th><th class="n">Value it creates</th><th>Main reason</th></tr>' +
    D.top.map(function (t) { return '<tr class="click" data-act="openFirm" data-arg="' + t.f.id + '"><td>' + UI.esc(t.f.name) + '</td><td class="n">' + A(t.profit) + '</td><td class="n">' + A(t.value) + '</td><td>' + t.driver + '</td></tr>'; }).join('') + '</table>';
  return h + '<div class="note">How the split is worked out: the game\'s own sales formulas say how much extra sales come from above-average quality and brand, and which revenue is recurring (subscribers, members, depositors, tenants). That share of each business\'s profit is credited to technology, brand or customer base; the rest to operations. Growth and market mood come from the valuation steps below.</div></div>';
};
