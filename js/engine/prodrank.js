/* ============================================================================
 * UAE CAPITALISM LAB  -  GLOBAL TECH RANKING FOR EVERY OTHER PRODUCT
 * The 46 world-market products (software, chips, pharma ...) have their own race in worldmkt.js.
 * Every other product (food, fuel, metals, cars, fashion ...) is ranked here: real world leaders
 * (names REAL, tech index EST: 100 = best in 2026, leaders gain perYr points a year) against every
 * game company that actually makes the product (company technology co.tech[pid]).
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* pid: [[leader, country, index 2026 (EST), gain per year (EST)], ...] */
UAE.PRODUCT_LEADERS = {
  crude: [['Saudi Aramco', 'SA', 100, 0.6], ['ExxonMobil', 'US', 97, 0.8], ['Chevron', 'US', 95, 0.8]],
  gas: [['QatarEnergy', 'QA', 100, 0.7], ['Shell', 'GB', 98, 0.8], ['TotalEnergies', 'FR', 95, 0.8]],
  jetfuel: [['Shell', 'GB', 100, 0.8], ['ExxonMobil', 'US', 99, 0.8], ['Reliance Industries', 'IN', 95, 0.9]],
  petrol: [['ExxonMobil', 'US', 100, 0.7], ['Reliance Industries', 'IN', 98, 0.9], ['Sinopec', 'CN', 95, 0.9]],
  limestone: [['Holcim', 'CH', 100, 0.5], ['Heidelberg Materials', 'DE', 98, 0.5], ['CRH', 'IE', 97, 0.5]],
  sand: [['CRH', 'IE', 100, 0.4], ['Vulcan Materials', 'US', 98, 0.4], ['Holcim', 'CH', 97, 0.4]],
  bauxite: [['Alcoa', 'US', 100, 0.5], ['Rio Tinto', 'GB', 99, 0.5], ['Chalco', 'CN', 94, 0.7]],
  wheat: [['Cargill', 'US', 100, 0.8], ['ADM', 'US', 98, 0.8], ['Bunge', 'US', 95, 0.8]],
  dates: [['Bateel', 'SA', 100, 0.6], ['Hadiklaim', 'IL', 96, 0.6]],
  veg: [['Dole', 'US', 100, 0.8], ['Fresh Del Monte', 'US', 97, 0.8], ['Greenyard', 'BE', 95, 0.8]],
  coffeebn: [['Olam Food Ingredients', 'SG', 100, 0.7], ['Louis Dreyfus', 'NL', 97, 0.7], ['Neumann Kaffee', 'DE', 96, 0.7]],
  rawmilk: [['Arla Foods', 'DK', 100, 0.8], ['FrieslandCampina', 'NL', 98, 0.8], ['Fonterra', 'NZ', 97, 0.8]],
  milk: [['Nestlé', 'CH', 100, 0.9], ['Danone', 'FR', 99, 0.9], ['Lactalis', 'FR', 98, 0.9], ['Almarai', 'SA', 94, 1.0]],
  laban: [['Almarai', 'SA', 100, 0.9], ['Danone', 'FR', 98, 0.9], ['Arla Foods', 'DK', 95, 0.8]],
  poultry: [['Tyson Foods', 'US', 100, 0.8], ['JBS (Seara)', 'BR', 98, 0.9], ['BRF', 'BR', 97, 0.9]],
  cotton: [['Olam Agri', 'SG', 100, 0.6], ['Louis Dreyfus', 'NL', 98, 0.6], ['Cargill', 'US', 96, 0.6]],
  leather: [['Gruppo Mastrotto', 'IT', 100, 0.6], ['JBS Couros', 'BR', 97, 0.6], ['Pittards', 'GB', 95, 0.5]],
  gold: [['Newmont', 'US', 100, 0.7], ['Barrick', 'CA', 99, 0.7], ['Agnico Eagle', 'CA', 97, 0.7]],
  silicon: [['Hoshine Silicon', 'CN', 100, 1.2], ['Wacker Chemie', 'DE', 99, 1.0], ['Elkem', 'NO', 97, 1.0]],
  copper: [['Freeport-McMoRan', 'US', 100, 0.7], ['Codelco', 'CL', 98, 0.6], ['BHP', 'AU', 98, 0.7]],
  oud: [['Arabian Oud', 'SA', 100, 0.6], ['Abdul Samad Al Qurashi', 'SA', 98, 0.6]],
  perfume: [["L'Oréal", 'FR', 100, 1.0], ['Chanel', 'FR', 99, 0.9], ['Estée Lauder', 'US', 98, 0.9], ['Puig', 'ES', 96, 1.0]],
  alumina: [['Alcoa', 'US', 100, 0.6], ['Rio Tinto', 'GB', 99, 0.6], ['Chalco', 'CN', 96, 0.8]],
  aluminium: [['Rio Tinto', 'GB', 100, 0.7], ['Norsk Hydro', 'NO', 99, 0.8], ['Chalco', 'CN', 98, 0.9]],
  cement: [['Holcim', 'CH', 100, 0.6], ['Heidelberg Materials', 'DE', 99, 0.6], ['CNBM', 'CN', 96, 0.7], ['CEMEX', 'MX', 95, 0.6]],
  glass: [['Saint-Gobain', 'FR', 100, 0.8], ['Corning', 'US', 99, 1.0], ['AGC', 'JP', 99, 0.8]],
  polymer: [['Dow', 'US', 100, 0.8], ['BASF', 'DE', 99, 0.8], ['LyondellBasell', 'US', 98, 0.8], ['SABIC', 'SA', 97, 0.9]],
  urea: [['Yara', 'NO', 100, 0.7], ['Nutrien', 'CA', 98, 0.7], ['CF Industries', 'US', 97, 0.7]],
  flour: [['ADM', 'US', 100, 0.6], ['Cargill', 'US', 99, 0.6], ['Ardent Mills', 'US', 95, 0.6]],
  bread: [['Grupo Bimbo', 'MX', 100, 0.7], ['Yamazaki Baking', 'JP', 97, 0.7], ['Flowers Foods', 'US', 94, 0.6]],
  chicken: [['Tyson Foods', 'US', 100, 0.8], ['BRF', 'BR', 97, 0.9], ['JBS', 'BR', 97, 0.9]],
  vegbox: [['Bonduelle', 'FR', 100, 0.7], ['Fresh Del Monte', 'US', 97, 0.7], ['Dole', 'US', 96, 0.7]],
  datesbox: [['Bateel', 'SA', 100, 0.7], ['Hadiklaim', 'IL', 95, 0.6]],
  water: [['Danone (Evian)', 'FR', 100, 0.6], ['Nongfu Spring', 'CN', 98, 0.8], ['Coca-Cola', 'US', 97, 0.6]],
  coffee: [['Nestlé', 'CH', 100, 0.9], ['Starbucks', 'US', 98, 0.8], ['JDE Peet’s', 'NL', 96, 0.8]],
  snacks: [['PepsiCo', 'US', 100, 0.9], ['Mondelez', 'US', 98, 0.9], ['Mars', 'US', 97, 0.9]],
  skincare: [["L'Oréal", 'FR', 100, 1.1], ['Beiersdorf', 'DE', 97, 1.0], ['Shiseido', 'JP', 97, 1.0], ['Unilever', 'GB', 96, 0.9]],
  kandura: [['Lomar', 'SA', 100, 0.7], ['Daffah', 'SA', 96, 0.6]],
  fashion: [['Inditex', 'ES', 100, 1.0], ['LVMH', 'FR', 99, 1.0], ['Fast Retailing', 'JP', 98, 1.0], ['H&M', 'SE', 95, 0.9]],
  footwear: [['Nike', 'US', 100, 1.1], ['Adidas', 'DE', 98, 1.0], ['Anta Sports', 'CN', 95, 1.2]],
  jewelry: [['Cartier (Richemont)', 'CH', 100, 0.7], ['Tiffany & Co. (LVMH)', 'US', 99, 0.7], ['Chow Tai Fook', 'HK', 95, 0.8]],
  tv: [['Samsung Electronics', 'KR', 100, 1.5], ['LG Electronics', 'KR', 99, 1.4], ['Sony', 'JP', 97, 1.3], ['TCL', 'CN', 96, 1.7]],
  aircon: [['Daikin', 'JP', 100, 1.2], ['Gree', 'CN', 98, 1.3], ['Midea', 'CN', 97, 1.3], ['Carrier', 'US', 96, 1.1]],
  furniture: [['IKEA (Ingka)', 'SE', 100, 0.8], ['MillerKnoll', 'US', 97, 0.7], ['Ashley Furniture', 'US', 95, 0.7]],
  toys: [['LEGO', 'DK', 100, 1.0], ['Bandai Namco', 'JP', 96, 1.0], ['Mattel', 'US', 96, 0.9], ['Hasbro', 'US', 95, 0.9]],
  car: [['Toyota', 'JP', 100, 1.4], ['BYD', 'CN', 98, 2.2], ['Volkswagen', 'DE', 98, 1.3], ['Hyundai', 'KR', 96, 1.5]],
  lithium: [['Albemarle', 'US', 100, 1.5], ['SQM', 'CL', 99, 1.4], ['Ganfeng Lithium', 'CN', 98, 1.8]],
  rareearth: [['China Northern Rare Earth', 'CN', 100, 1.4], ['Lynas', 'AU', 96, 1.5], ['MP Materials', 'US', 94, 1.8]],
  pchem: [['BASF', 'DE', 100, 0.9], ['Dow', 'US', 98, 0.9], ['Sinopec', 'CN', 95, 1.0]],
  api: [['Lonza', 'CH', 100, 1.5], ['WuXi AppTec', 'CN', 97, 1.8], ['Divi’s Laboratories', 'IN', 96, 1.6]],
  titanium: [['VSMPO-AVISMA', 'RU', 100, 0.9], ['Howmet Aerospace', 'US', 99, 1.0], ['Toho Titanium', 'JP', 96, 0.9]],
  nickel: [['Precision Castparts', 'US', 100, 1.0], ['ATI', 'US', 99, 1.0], ['Haynes International', 'US', 97, 0.9]],
  optics: [['Carl Zeiss', 'DE', 100, 1.3], ['Nikon', 'JP', 96, 1.1], ['Canon', 'JP', 96, 1.1]],
  rocket: [['SpaceX', 'US', 100, 3.0], ['Blue Origin', 'US', 90, 3.0], ['ArianeGroup', 'FR', 88, 1.2]]
};
UAE.PR_FLAG = { SA: '🇸🇦', QA: '🇶🇦', RU: '🇷🇺', IE: '🇮🇪', MX: '🇲🇽', BR: '🇧🇷', CA: '🇨🇦', CL: '🇨🇱', NO: '🇳🇴', ES: '🇪🇸', BE: '🇧🇪', NZ: '🇳🇿', SE: '🇸🇪', HK: '🇭🇰', IT: '🇮🇹' };
UAE.prFlag = function (cc) { return UAE.PR_FLAG[cc] || (UAE.NATION_FLAG && UAE.NATION_FLAG[cc]) || '🏳'; };
/** Leader's index this game year: +perYr a year, fading to half speed after 15 years (no runaway). */
UAE.prLeaderIdx = function (L) {
  var y = Math.max(0, UAE.cal.year() - 2026), a = Math.min(y, 15), b = Math.max(0, y - 15);
  return L[2] + L[3] * (a + 0.5 * b);
};
/** Products ranked here = every product without a world market (UAE.WM). */
UAE.prProducts = function () {
  return UAE.PRODUCTS.filter(function (p) { return !(UAE.WM && UAE.WM[p.id]); });
};
UAE.PR_MAKER_KINDS = { factory: 1, farm: 1, mine: 1, oil: 1, software: 1 };
/** { pid: { coId: number of producing firms } } - one pass over all firms, cached per game day. */
UAE.prMakers = function () {
  var S = UAE.S, C = UAE._prCache;
  if (C && C.day === S.day && C.n === Object.keys(S.firms).length) return C.by;
  var by = {};
  UAE.allFirms().forEach(function (f) {
    if (f.status === 'closed' || !UAE.FIRM_TYPES[f.type] || !UAE.PR_MAKER_KINDS[UAE.FIRM_TYPES[f.type].kind]) return;
    var seen = {};
    (f.lines || []).forEach(function (l) {
      if (!l.pid || seen[l.pid]) return; seen[l.pid] = 1;
      var m = by[l.pid] || (by[l.pid] = {}); m[f.owner] = (m[f.owner] || 0) + 1;
    });
  });
  UAE._prCache = { day: S.day, n: Object.keys(S.firms).length, by: by };
  return by;
};
/** Global ranking for one product: world leaders + game makers, best first.
 *  Rows: { rank, name, flag, idx, leader:L|null, co, firms, human } */
UAE.prRanking = function (pid) {
  var rows = [], mk = UAE.prMakers()[pid] || {};
  (UAE.PRODUCT_LEADERS[pid] || []).forEach(function (L) { rows.push({ name: L[0], flag: UAE.prFlag(L[1]), idx: UAE.prLeaderIdx(L), leader: L, co: null, firms: 0, human: false }); });
  Object.keys(mk).forEach(function (id) {
    var co = UAE.co(id); if (!co || co.status === 'BANKRUPT') return;
    rows.push({ name: co.name, flag: co.foreign ? '🌐' : '🇦🇪', idx: (co.tech && co.tech[pid]) || 40, leader: null, co: co, firms: mk[id], human: UAE.isHuman(co) });
  });
  rows.sort(function (a, b) { return b.idx - a.idx; });
  rows.forEach(function (r, i) { r.rank = i + 1; });
  return rows;
};
/** World best index for a product (leaders only; 100 if no leader data). */
UAE.prFrontier = function (pid) {
  var L = UAE.PRODUCT_LEADERS[pid]; if (!L || !L.length) return 100;
  return L.reduce(function (m, x) { return Math.max(m, UAE.prLeaderIdx(x)); }, 0);
};
