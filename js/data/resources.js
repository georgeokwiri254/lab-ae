/* ============================================================================
 * UAE CAPITALISM LAB  -  NATURAL RESOURCE SITES
 * Like Capitalism Lab's "Land Ownership & Resources" map mode: mines and wells
 * can only be built ON a known deposit. Each deposit has a finite reserve,
 * a grade (output multiplier), an extraction-cost multiplier and an ore
 * quality. The government sells the site rights once; one firm per site.
 *
 * Coordinates: REAL field / quarry names, positions approximate (EST, ~2-5 km).
 * Reserve sizes are game-scaled (SYN) - not real ADNOC reserve figures.
 *   res      product id produced (crude | gas | limestone | sand)
 *   reserve  units recoverable at the site (SYN game scale)
 *   grade    output multiplier vs UAE.RESOURCE base (richness of the deposit)
 *   cost     extraction cost multiplier (offshore / sour gas / deep = higher)
 *   qual     quality of the raw material 0-100
 *   price    government price for the site rights, AED (EST)
 *   r        km radius in which the firm may be placed
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.DEPOSITS = [
  // ---------------- crude oil (Abu Dhabi onshore + offshore, Dubai offshore) --------
  { id:'D_BAB',     name:'Bab field (Murban, onshore)',      res:'crude', c:[23.8100,53.7300], city:'RUW', reserve:9.0e7, grade:1.25, cost:0.85, qual:72, price:420e6, r:6 },
  { id:'D_BUHASA',  name:'Bu Hasa field (onshore)',          res:'crude', c:[23.4800,53.2000], city:'RUW', reserve:8.0e7, grade:1.15, cost:0.90, qual:70, price:380e6, r:6 },
  { id:'D_ASAB',    name:'Asab field (onshore)',             res:'crude', c:[23.2800,54.2000], city:'RUW', reserve:5.5e7, grade:1.00, cost:0.95, qual:68, price:260e6, r:6 },
  { id:'D_SAHIL',   name:'Sahil field (onshore)',            res:'crude', c:[23.6200,54.0500], city:'RUW', reserve:3.5e7, grade:0.90, cost:1.00, qual:66, price:160e6, r:5 },
  { id:'D_UZAKUM',  name:'Upper Zakum (offshore)',           res:'crude', c:[24.8500,53.6500], city:'RUW', reserve:1.2e8, grade:1.40, cost:1.55, qual:64, price:650e6, r:8, offshore:true },
  { id:'D_LZAKUM',  name:'Lower Zakum (offshore)',           res:'crude', c:[24.7600,53.8200], city:'RUW', reserve:6.0e7, grade:1.10, cost:1.45, qual:70, price:330e6, r:7, offshore:true },
  { id:'D_UMMSHAIF',name:'Umm Shaif (offshore)',             res:'crude', c:[25.2000,53.1500], city:'RUW', reserve:5.0e7, grade:1.05, cost:1.50, qual:69, price:280e6, r:7, offshore:true },
  { id:'D_FATEH',   name:'Fateh field (Dubai offshore, mature)', res:'crude', c:[25.5800,54.4300], city:'DXB', reserve:1.2e7, grade:0.60, cost:1.70, qual:62, price:45e6, r:6, offshore:true },
  // ---------------- natural gas -----------------------------------------------
  { id:'D_HABSHAN', name:'Habshan gas (onshore)',            res:'gas',   c:[23.8400,53.6200], city:'RUW', reserve:1.6e9, grade:1.20, cost:0.90, qual:70, price:300e6, r:5 },
  { id:'D_SHAH',    name:'Shah sour gas field',              res:'gas',   c:[23.4300,53.6500], city:'RUW', reserve:1.2e9, grade:1.10, cost:1.60, qual:58, price:220e6, r:6 },
  { id:'D_GHASHA',  name:'Hail & Ghasha (offshore gas)',     res:'gas',   c:[24.3000,52.5500], city:'RUW', reserve:1.5e9, grade:1.20, cost:1.70, qual:62, price:260e6, r:8, offshore:true },
  { id:'D_MARGHAM', name:'Margham gas field (Dubai)',        res:'gas',   c:[24.9000,55.4300], city:'DXB', reserve:2.5e8, grade:0.70, cost:1.10, qual:66, price:55e6, r:4 },
  { id:'D_SAJAA',   name:'Sajaa gas field (Sharjah)',        res:'gas',   c:[25.3300,55.7200], city:'SHJ', reserve:3.0e8, grade:0.75, cost:1.10, qual:66, price:60e6, r:4 },
  // ---------------- limestone (cement feed) -----------------------------------
  { id:'D_KHORKH',  name:'Khor Khwair limestone (RAK)',      res:'limestone', c:[25.9672,56.0544], city:'RAK', reserve:6.0e7, grade:1.20, cost:0.90, qual:68, price:90e6, r:3 },
  { id:'D_GHALILA', name:'Ghalilah limestone (RAK)',         res:'limestone', c:[26.0300,56.1000], city:'RAK', reserve:4.0e7, grade:1.05, cost:0.95, qual:65, price:60e6, r:3 },
  { id:'D_FUJLIME', name:'Fujairah quarries (limestone/aggregate)', res:'limestone', c:[25.2500,56.2400], city:'FUJ', reserve:3.5e7, grade:0.95, cost:1.00, qual:60, price:45e6, r:3 },
  { id:'D_DIBBA',   name:'Dibba limestone (Fujairah)',       res:'limestone', c:[25.5500,56.2100], city:'FUJ', reserve:2.5e7, grade:0.90, cost:1.05, qual:62, price:35e6, r:3 },
  { id:'D_HAFEET',  name:'Jebel Hafeet foothills limestone (Al Ain)', res:'limestone', c:[24.1100,55.8400], city:'AAN', reserve:2.0e7, grade:0.85, cost:1.10, qual:60, price:30e6, r:3 },
  // ---------------- silica sand (glass feed) -----------------------------------
  { id:'D_MLEIHA',  name:'Mleiha silica sand (Sharjah)',     res:'sand',  c:[25.1200,55.8800], city:'SHJ', reserve:2.5e7, grade:1.15, cost:0.90, qual:66, price:30e6, r:3 },
  { id:'D_MADAM',   name:'Al Madam sands (Sharjah)',         res:'sand',  c:[24.9600,55.7800], city:'SHJ', reserve:2.0e7, grade:1.00, cost:0.95, qual:60, price:22e6, r:3 },
  { id:'D_HAMRA',   name:'Al Hamraniyah sand (RAK)',         res:'sand',  c:[25.6200,55.9600], city:'RAK', reserve:1.8e7, grade:0.95, cost:1.00, qual:62, price:20e6, r:3 },
  { id:'D_LIWASND', name:'Liwa dune sand (low grade)',       res:'sand',  c:[23.2000,53.8500], city:'RUW', reserve:5.0e7, grade:0.70, cost:1.20, qual:48, price:12e6, r:6 }
];
/* Reserve figures above are per "size 1" planning; x5 gives a site roughly 25 years at size 10 (game balance, SYN). */
UAE.DEP = {}; UAE.DEPOSITS.forEach(function (d) { d.reserve *= 5; d.src = 'EST position / SYN reserve'; UAE.DEP[d.id] = d; });

/** Which deposit resources a resource firm type can exploit. */
UAE.DEPOSIT_KINDS = { mine: ['limestone', 'sand'], oil: ['crude', 'gas'] };

/** Live state of a deposit (owner firm, remaining reserve) - created lazily in UAE.S.deposits. */
UAE.depState = function (id) {
  var S = UAE.S; if (!S.deposits) S.deposits = {};
  var st = S.deposits[id];
  if (!st) { var d = UAE.DEP[id]; st = S.deposits[id] = { id: id, left: d.reserve, firm: null, surveyed: false }; }
  return st;
};

/** Nearest deposit usable by firm kind `kind` at point c (within its radius). */
UAE.depositAt = function (c, kind) {
  var ok = UAE.DEPOSIT_KINDS[kind] || [], best = null, bd = 1e9;
  UAE.DEPOSITS.forEach(function (d) {
    if (ok.indexOf(d.res) < 0) return;
    var k = UAE.geo.km(c, d.c);
    if (k <= d.r && k < bd) { bd = k; best = d; }
  });
  return best;
};
