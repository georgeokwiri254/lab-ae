/* ============================================================================
 * UAE CAPITALISM LAB  -  VALUE DRIVERS: WHY IS A COMPANY WORTH WHAT IT IS?
 * Explicit attribution of a company's value to named sources, using the game's
 * own demand formulas:
 *   - sales attraction grows with quality^e and brand^e, so the part of a firm's
 *     profit that comes from ABOVE-AVERAGE quality / brand is 1 - (baseline/actual)^e
 *   - recurring revenue (subscriptions, members, deposits, tenants, users) is the
 *     customer base
 *   - the rest of each firm's profit = operations & market position
 *   - growth premium and market mood come from the valuation itself
 * Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.valueDrivers = function (co) {
  var v = UAE.valuationBreakdown(co), tot = { brand: 0, tech: 0, cust: 0, ops: 0 }, firms = [], sumP = 0;
  var lift = function (x, base, e) { return x > base ? 1 - Math.pow(base / x, e) : 0; };
  UAE.firmsOf(co.id).forEach(function (f) {
    var p = (f.last && f.last.profit) || 0; if (p <= 0) return;
    var k = UAE.FIRM_TYPES[f.type].kind, sh = { brand: 0, tech: 0, cust: 0 }, n = 0;
    if (k === 'retail' || (k === 'internet' && f.model === 'ecommerce' && f.lines.length)) {
      f.lines.forEach(function (l) {
        var s = f.stock[l.pid], q = s ? s.qual : (l.lastQual || 50), b = UAE.brandRating(co, l.pid, f.city);
        sh.tech += lift(q, 50, 0.7); sh.brand += lift(b + 15, 45, 0.5); n++;
      });
      if (n) { sh.tech /= n; sh.brand /= n; }
      if (k === 'internet') sh.cust = Math.min(0.6, ((f.members || 0) * (f.memberFee || 25) / 30) / Math.max(1, f.last.rev / 30) + 0.2);
      if (f.mall) sh.cust += 0.05;
    } else if (k === 'software') {
      var pid = f.lines[0] && f.lines[0].pid, b2 = pid ? UAE.brandRating(co, pid, co.hq || 'DXB') : 30;
      sh.tech = lift(f.quality || 40, 55, 1.4); sh.brand = lift(b2 + 15, 45, 0.4);
      sh.cust = f.subs ? Math.min(0.7, f.subs * (f.subPrice || 0) / Math.max(1, f.last.rev)) : 0.15;
    } else if (k === 'factory' || k === 'farm' || k === 'mine' || k === 'oil') {
      f.lines.forEach(function (l) { var s = f.stock[l.pid]; sh.tech += lift(s ? s.qual : 50, 50, 0.5); n++; });
      if (n) sh.tech /= n;
    } else if (k === 'internet') { sh.cust = 0.65; sh.brand = lift((co.brand.Internet || 10) + 15, 45, 0.5); }
    else if (k === 'bankhq' || k === 'bankbranch') { sh.cust = 0.5; sh.brand = lift((co.brand.Banking || co.brandBase || 20) + 15, 45, 0.4); }
    else if (k === 'inshq' || k === 'insoffice') { sh.cust = 0.45; sh.brand = lift((co.brand.Insurance || co.brandBase || 20) + 15, 45, 0.4); }
    else if (k === 'telecom') sh.cust = 0.75;
    else if (k === 'datacenter') { sh.cust = 0.35; sh.tech = lift(f.serverQual || 60, 60, 0.6); }
    else if (k === 'apartment' || k === 'office' || k === 'mall' || k === 'hotel') sh.cust = 0.45;
    else if (k === 'service' || k === 'sports') { sh.tech = lift(f.quality || 50, 50, 0.5); sh.cust = 0.2; }
    var used = sh.brand + sh.tech + sh.cust;
    if (used > 0.9) { sh.brand *= 0.9 / used; sh.tech *= 0.9 / used; sh.cust *= 0.9 / used; used = 0.9; }
    tot.brand += p * sh.brand; tot.tech += p * sh.tech; tot.cust += p * sh.cust; tot.ops += p * (1 - used); sumP += p;
    firms.push({ f: f, p: p, sh: sh });
  });
  if (co.legacy) { var lp = Math.max(0, co.legacy.ni / 12); tot.ops += lp; sumP += lp; }   // real groups' core business
  var listed = v.listed && !v.seed, assets, todayEarn, growth, mood;
  if (listed) {                                   // your / AI listed companies: the game's own formula
    assets = v.book * 0.45 * v.ir * v.mood; todayEarn = Math.max(0, v.ni) * v.pe * 0.7 * v.ir * v.mood; growth = todayEarn * (v.growth - 1);
    mood = v.value - (assets + todayEarn + growth);
  } else if (v.seed) {                            // real listed companies: real market price; split it into assets + earning power
    assets = Math.min(v.value, Math.max(0, v.book) * 0.45); todayEarn = v.value - assets; growth = 0; mood = 0;
  } else {                                        // private companies
    var floor = v.value <= v.book + 1;
    assets = floor ? v.value : v.book * 0.5; todayEarn = floor ? 0 : v.value - assets; growth = 0; mood = 0;
  }         // listed: share price vs fair value; seeds: real price vs formula
  var share = function (x) { return sumP > 0 ? x / sumP : 0; };
  var opsShare = sumP > 0 ? share(tot.ops) : 1;
  var parts = [
    { k: 'assets', name: 'Assets you own', aed: assets, why: 'Cash, buildings, land and stock on the balance sheet' + (listed ? ' (investors count 45% of book value).' : '.') },
    { k: 'brand', name: 'Brand', aed: todayEarn * share(tot.brand), why: 'Extra sales because customers know and trust your name – built by advertising, your CMO and good experiences.' },
    { k: 'tech', name: 'Technology & product quality', aed: todayEarn * share(tot.tech), why: 'Extra sales and pricing power because your products beat the average – built by R&D, your CTO and research projects.' },
    { k: 'cust', name: 'Customer base', aed: todayEarn * share(tot.cust), why: 'Recurring customers who keep paying: subscribers, members, bank depositors, tenants, telecom and app users.' },
    { k: 'ops', name: 'Operations & market position', aed: todayEarn * opsShare, why: 'What your firms earn at average quality and brand: locations, factories, supply chain, scale and market share.' },
    { k: 'growth', name: 'Future expected growth', aed: growth, why: listed ? 'Investors pay extra because revenue is ' + (v.rawGrowth ? v.rawGrowth.toFixed(2) + '× a year ago' : 'growing') + ' – they expect profit to keep rising (growth factor ' + v.growth.toFixed(2) + ').' : 'Not separately priced for this company.' },
    { k: 'mood', name: mood >= 0 ? 'Market optimism' : 'Market discount', aed: mood, why: listed ? (mood >= 0 ? 'The share price is above fair value today – investors are more optimistic than the fundamentals.' : 'The share price is still below fair value and catching up (3% of the gap per trading day).') : 'Gap between the quoted value and the formula (real market pricing).' }
  ];
  firms.sort(function (a, b) { return b.p - a.p; });
  var top = firms.slice(0, 8).map(function (x) {
    var s = x.sh, d = s.brand + s.tech + s.cust < 0.15 ? 'operations' : s.brand >= s.tech && s.brand >= s.cust ? 'brand' : s.tech >= s.cust ? 'technology' : 'customer base';
    return { f: x.f, profit: x.p, value: sumP > 0 ? (todayEarn + growth) * x.p / sumP : 0, driver: d };
  });
  return { v: v, parts: parts, top: top, total: v.value };
};
