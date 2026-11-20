/* ============================================================================
 * UAE CAPITALISM LAB  -  ECONOMY DATA (macro rules, products, building types)
 * Provenance tags: REAL / EST / SYN (see geo.js header).
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* ---- Federal rules (apply to every emirate) ------------------------------ */
UAE.RULES = {
  vat: 0.05,                 // REAL  UAE VAT standard rate 5%
  corpTax: 0.09,             // REAL  9% on taxable income ...
  corpTaxFree: 375000,       // REAL  ... above AED 375,000 per year
  customs: 0.05,             // REAL  5% of CIF import value (general tariff)
  baseRate: 0.039,           // REAL  CBUAE base rate 3.90% (28 Oct 2026)
  usdAed: 3.6725,            // REAL  dirham peg
  depositSpread: -0.012,     // EST   deposit rate = base - 1.2%
  loanSpread: 0.025,         // EST   prime corporate spread over base
  bondSpread: 0.018,         // EST   investment-grade bond spread
  freightPerTonKm: 0.35,     // EST   AED per tonne-km road freight
  freightMinPerUnit: 0.02,   // SYN   minimum freight share of value per shipment
  depreciationYears: 25,     // EST   straight-line buildings
  equipmentYears: 10,        // EST   straight-line equipment
  tradingFee: 0.0015,        // EST   brokerage + clearing on share trades
  // DEWA tariffs (REAL, dewa.gov.ae, Nov 2026)
  dewaElecSlabs: [[2000,0.23],[2000,0.28],[2000,0.32],[Infinity,0.38]],
  dewaIndustrial: [[10000,0.23],[Infinity,0.38]],
  dewaFuelSurcharge: 0.06,   // REAL  AED/kWh, Nov 2026 (time-varying)
  waterSlabs: [[27,7.70],[27,8.80],[Infinity,10.12]],
  // Utility multipliers for other emirates vs DEWA (EST: ADDC/SEWA/EtihadWE differ)
  utilityMult: { DU:1.00, AD:0.85, SH:1.05, AJ:1.05, UQ:1.05, RK:1.05, FU:1.05 }
};

/* Cost of electricity for a month of kWh, industrial or commercial schedule. */
UAE.electricityBill = function (kwh, industrial, emirate) {
  var slabs = industrial ? UAE.RULES.dewaIndustrial : UAE.RULES.dewaElecSlabs;
  var left = kwh, cost = 0;
  for (var i = 0; i < slabs.length && left > 0; i++) {
    var use = Math.min(left, slabs[i][0]);
    cost += use * slabs[i][1]; left -= use;
  }
  cost += kwh * UAE.RULES.dewaFuelSurcharge;
  return cost * (UAE.RULES.utilityMult[emirate] || 1);
};

/* ---- Dubai CPI basket (REAL DSC weights, 2025 changes) -------------------- */
UAE.CPI_BASKET = [
  ['Food & non-alcoholic beverages', 11.66, 0.21], ['Tobacco', 0.32, 3.00],
  ['Clothing & footwear', 4.96, -0.48], ['Housing, water, electricity, gas', 40.68, 6.36],
  ['Furnishings & household', 3.51, 0.50], ['Health', 0.88, 2.23], ['Transport', 9.32, -2.63],
  ['Information & communication', 5.69, -0.99], ['Recreation, sport & culture', 2.37, 2.50],
  ['Education', 8.15, 2.57], ['Restaurants & accommodation', 6.10, 0.87],
  ['Insurance & financial', 1.26, 1.07], ['Personal care & misc', 5.10, 1.60]
];

/* Dubai 2025 real GDP by industry, AED bn (REAL DSC; residual = CALC) */
UAE.GDP_SECTORS_DXB = [
  ['Wholesale & retail trade', 208.8], ['Real estate + construction', 168.2],
  ['Financial & insurance', 115.1], ['Transportation & storage', 98.9],
  ['Manufacturing', 47.4], ['All other sectors (residual)', 298.6]
];

/* Monthly seasonality multipliers (EST: UAE peak season Nov-Mar, summer trough) */
UAE.SEASON = {
  tourism: [1.25,1.20,1.15,1.05,0.90,0.72,0.75,0.80,0.90,1.05,1.20,1.28],
  retail:  [1.12,1.00,1.00,1.02,0.98,0.92,0.92,0.95,1.00,1.03,1.05,1.15]
};

/* ---- Product catalogue ----------------------------------------------------
 * kind   raw | inter (B2B intermediate) | consumer | fuel
 * cls    product class (Capitalism Lab classes + UAE additions)
 * ref    reference retail price AED (EST, typical UAE shelf price incl. VAT)
 * imp    landed import cost per unit before customs (EST, CIF)
 * world  world/export price per unit (raw & intermediates, EST)
 * perCap annual units per resident (consumer demand, EST)
 * tour   tourist spending multiplier (1 = residents only)
 * el     own-price elasticity (negative, EST)
 * cap    units/day one retail line can sell at store size 1 (SYN)
 * qImp   quality of imported goods 0-100 (SYN)
 * t      tonnes per unit (for freight)
 * src    where it can come from: import | farm | mine | oil | factory
 * rec    recipe if a factory can make it: in=[[product,qty per unit]], cap units/day
 *        per production line at size 1, lab = labour+energy AED per unit
 * b2b    industrial demand units per AED bn of city GDP per year (construction etc.)
 * --------------------------------------------------------------------------*/
UAE.PRODUCTS = [
  // ---- raw materials (farms, mines, oil wells, imports) ----
  { id:'crude',    name:'Crude Oil',        cls:'Oil & Gas',   kind:'raw',  unit:'bbl',   world:265,  imp:275,  t:0.137, src:'oil',    qImp:60 },
  { id:'gas',      name:'Natural Gas',      cls:'Oil & Gas',   kind:'raw',  unit:'MMBtu', world:13,   imp:16,   t:0.02,  src:'oil',    qImp:60 },
  { id:'limestone',name:'Limestone',        cls:'Minerals',    kind:'raw',  unit:'t',     world:28,   imp:45,   t:1,     src:'mine',   qImp:55 },
  { id:'sand',     name:'Silica Sand',      cls:'Minerals',    kind:'raw',  unit:'t',     world:45,   imp:60,   t:1,     src:'mine',   qImp:55 },
  { id:'bauxite',  name:'Bauxite',          cls:'Minerals',    kind:'raw',  unit:'t',     world:230,  imp:240,  t:1,     src:'import', qImp:60 },
  { id:'wheat',    name:'Wheat',            cls:'Agriculture', kind:'raw',  unit:'t',     world:1050, imp:1100, t:1,     src:'import', qImp:60 },
  { id:'rawmilk',  name:'Raw Milk',         cls:'Livestock Products', kind:'raw', unit:'kL', world:2100, imp:2600, t:1.03, src:'farm', qImp:55 },
  { id:'poultry',  name:'Live Poultry',     cls:'Livestock',   kind:'raw',  unit:'t',     world:6200, imp:6800, t:1,     src:'farm',   qImp:55 },
  { id:'dates',    name:'Fresh Dates',      cls:'Agriculture', kind:'raw',  unit:'t',     world:5500, imp:6500, t:1,     src:'farm',   qImp:60 },
  { id:'veg',      name:'Greenhouse Vegetables', cls:'Agriculture', kind:'raw', unit:'t', world:3800, imp:4200, t:1,     src:'farm',   qImp:55 },
  { id:'cotton',   name:'Cotton Fabric',    cls:'Textiles',    kind:'raw',  unit:'100m',  world:1100, imp:1200, t:0.03,  src:'import', qImp:60 },
  { id:'leather',  name:'Leather',          cls:'Textiles',    kind:'raw',  unit:'m2',    world:85,   imp:95,   t:0.002, src:'import', qImp:60 },
  { id:'gold',     name:'Gold Bullion',     cls:'Precious Metals', kind:'raw', unit:'g',  world:400,  imp:405,  t:0.000001, src:'import', qImp:90 },
  { id:'chips',    name:'Semiconductors',   cls:'Electronics', kind:'raw',  unit:'pc',    world:340,  imp:350,  t:0.0001,src:'import', qImp:70 },
  { id:'coffeebn', name:'Green Coffee Beans',cls:'Agriculture',kind:'raw',  unit:'kg',    world:38,   imp:42,   t:0.001, src:'import', qImp:65 },
  { id:'oud',      name:'Oud & Fragrance Oils', cls:'Cosmetics', kind:'raw', unit:'kg',   world:850,  imp:900,  t:0.001, src:'import', qImp:65 },
  // ---- intermediates (B2B) ----
  { id:'alumina',  name:'Alumina',          cls:'Metals',      kind:'inter',unit:'t',     world:1350, imp:1450, t:1, src:'factory', qImp:60, rec:{ in:[['bauxite',2.0]],               cap:600,  lab:180 } },
  { id:'aluminium',name:'Primary Aluminium',cls:'Metals',      kind:'inter',unit:'t',     world:9600, imp:10200,t:1, src:'factory', qImp:65, rec:{ in:[['alumina',1.93]],              cap:250,  lab:3600 }, b2b:9 },
  { id:'cement',   name:'Cement',           cls:'Building Materials', kind:'inter', unit:'t', world:240, imp:280, t:1, src:'factory', qImp:60, rec:{ in:[['limestone',1.5]],        cap:2500, lab:95 }, b2b:420 },
  { id:'glass',    name:'Float Glass',      cls:'Building Materials', kind:'inter', unit:'t', world:1900,imp:2050,t:1, src:'factory', qImp:60, rec:{ in:[['sand',1.2],['gas',5]],     cap:300,  lab:520 }, b2b:22 },
  { id:'polymer',  name:'Polyethylene',     cls:'Petrochemicals', kind:'inter', unit:'t', world:4200, imp:4500, t:1, src:'factory', qImp:65, rec:{ in:[['gas',45]],                 cap:400,  lab:900 }, b2b:6 },
  { id:'urea',     name:'Urea Fertiliser',  cls:'Petrochemicals', kind:'inter', unit:'t', world:1450, imp:1600, t:1, src:'factory', qImp:60, rec:{ in:[['gas',24]],                 cap:800,  lab:260 } },
  { id:'flour',    name:'Flour',            cls:'Food',        kind:'inter',unit:'t',     world:1500, imp:1650, t:1, src:'factory', qImp:60, rec:{ in:[['wheat',1.3]],               cap:200,  lab:90 } },
  { id:'jetfuel',  name:'Jet Fuel',         cls:'Oil & Gas',   kind:'inter',unit:'kL',    world:2450, imp:2600, t:0.8, src:'factory', qImp:65, rec:{ in:[['crude',6.6]],             cap:1200, lab:160 }, b2b:28 },
  // ---- fuel retail ----
  { id:'petrol',   name:'Petrol (Special 95)', cls:'Fuel',     kind:'fuel', unit:'kL',    ref:2690, imp:2050, world:2000, t:0.75, src:'factory', perCap:0.55, tour:1.0, el:-0.15, cap:14, qImp:65, rec:{ in:[['crude',6.4]], cap:1500, lab:120 } },
  // ---- consumer goods ----
  { id:'water',    name:'Bottled Water 6x1.5L',cls:'Beverage', kind:'consumer', unit:'pack', ref:9,    imp:5.2,  t:0.009, src:'factory', perCap:60,  tour:1.6, el:-0.8, cap:900, qImp:55, rec:{ in:[['polymer',0.00025]], cap:9000, lab:2.2 } },
  { id:'milk',     name:'Fresh Milk 2L',      cls:'Livestock Products', kind:'consumer', unit:'btl', ref:13, imp:8.4, t:0.002, src:'factory', perCap:45, tour:1.1, el:-0.6, cap:700, qImp:55, rec:{ in:[['rawmilk',0.002],['polymer',0.00004]], cap:6000, lab:2.4 } },
  { id:'laban',    name:'Laban 1L',           cls:'Livestock Products', kind:'consumer', unit:'btl', ref:6,  imp:4.0, t:0.001, src:'factory', perCap:30, tour:1.0, el:-0.6, cap:600, qImp:55, rec:{ in:[['rawmilk',0.001],['polymer',0.00002]], cap:6000, lab:1.2 } },
  { id:'bread',    name:'Arabic Bread (pack)',cls:'Food',      kind:'consumer', unit:'pack', ref:4,    imp:2.8,  t:0.0005, src:'factory', perCap:95,  tour:1.1, el:-0.4, cap:1200, qImp:50, rec:{ in:[['flour',0.0004]], cap:12000, lab:1.1 } },
  { id:'chicken',  name:'Fresh Chicken 1kg',  cls:'Food',      kind:'consumer', unit:'kg',   ref:22,   imp:14,   t:0.001, src:'factory', perCap:28,  tour:1.2, el:-0.7, cap:500, qImp:55, rec:{ in:[['poultry',0.0013]], cap:5000, lab:3.5 } },
  { id:'vegbox',   name:'Fresh Vegetables 1kg',cls:'Food',     kind:'consumer', unit:'kg',   ref:9,    imp:5.6,  t:0.001, src:'factory', perCap:55,  tour:1.2, el:-0.5, cap:800, qImp:50, rec:{ in:[['veg',0.00105]], cap:8000, lab:1.0 } },
  { id:'datesbox', name:'Premium Dates 1kg',  cls:'Food',      kind:'consumer', unit:'box',  ref:48,   imp:30,   t:0.0011, src:'factory', perCap:3.5, tour:3.0, el:-1.0, cap:180, qImp:60, rec:{ in:[['dates',0.0011]], cap:2500, lab:6 } },
  { id:'snacks',   name:'Snacks',             cls:'Snacks',    kind:'consumer', unit:'pack', ref:6,    imp:3.4,  t:0.0002, src:'factory', perCap:60,  tour:1.5, el:-1.1, cap:800, qImp:55, rec:{ in:[['flour',0.00012],['polymer',0.00002]], cap:12000, lab:1.2 } },
  { id:'coffee',   name:'Arabic Coffee 500g', cls:'Beverage',  kind:'consumer', unit:'bag',  ref:45,   imp:26,   t:0.0005, src:'factory', perCap:4,   tour:1.5, el:-0.9, cap:150, qImp:60, rec:{ in:[['coffeebn',0.6]], cap:2000, lab:5 } },
  { id:'perfume',  name:'Oud Perfume 100ml',  cls:'Cosmetics', kind:'consumer', unit:'btl',  ref:380,  imp:190,  t:0.0003, src:'factory', perCap:0.8, tour:4.0, el:-1.3, cap:40,  qImp:60, rec:{ in:[['oud',0.025],['glass',0.0002]], cap:800, lab:35 } },
  { id:'skincare', name:'Skincare Set',       cls:'Body Care Products', kind:'consumer', unit:'set', ref:140, imp:72, t:0.0004, src:'import', perCap:1.6, tour:2.0, el:-1.2, cap:60, qImp:65 },
  { id:'kandura',  name:'Kandura / Abaya',    cls:'Apparel',   kind:'consumer', unit:'pc',   ref:320,  imp:160,  t:0.0008, src:'factory', perCap:0.9, tour:1.3, el:-1.1, cap:35,  qImp:55, rec:{ in:[['cotton',0.045]], cap:600, lab:60 } },
  { id:'fashion',  name:'Fashion Apparel',    cls:'Apparel',   kind:'consumer', unit:'pc',   ref:160,  imp:78,   t:0.0005, src:'factory', perCap:6,   tour:2.2, el:-1.3, cap:120, qImp:60, rec:{ in:[['cotton',0.02]], cap:1500, lab:24 } },
  { id:'footwear', name:'Footwear',           cls:'Footwear',  kind:'consumer', unit:'pair', ref:240,  imp:120,  t:0.001, src:'factory', perCap:1.8, tour:1.8, el:-1.2, cap:50,  qImp:60, rec:{ in:[['leather',0.45],['polymer',0.0003]], cap:800, lab:40 } },
  { id:'jewelry',  name:'22K Gold Jewellery (20g)', cls:'Jewelry', kind:'consumer', unit:'pc', ref:9200, imp:8400, t:0.00003, src:'factory', perCap:0.035, tour:5.0, el:-1.4, cap:6, qImp:70, rec:{ in:[['gold',20]], cap:150, lab:450 } },
  { id:'watch',    name:'Luxury Watch',       cls:'Watch',     kind:'consumer', unit:'pc',   ref:19500,imp:13800,t:0.0002, src:'import', perCap:0.004, tour:6.0, el:-1.5, cap:2, qImp:85 },
  { id:'phone',    name:'Smartphone',         cls:'Communication Devices', kind:'consumer', unit:'pc', ref:3300, imp:2450, t:0.0004, src:'factory', perCap:0.33, tour:1.6, el:-1.2, cap:30, qImp:75, rec:{ in:[['chips',4],['glass',0.00005],['aluminium',0.00003]], cap:500, lab:180 } },
  { id:'laptop',   name:'Laptop',             cls:'Computer',  kind:'consumer', unit:'pc',   ref:4600, imp:3500, t:0.002, src:'factory', perCap:0.11, tour:1.2, el:-1.2, cap:12, qImp:75, rec:{ in:[['chips',6],['aluminium',0.0012],['polymer',0.0006]], cap:300, lab:240 } },
  { id:'tv',       name:'Smart TV 55"',       cls:'Electronic Products', kind:'consumer', unit:'pc', ref:2300, imp:1650, t:0.018, src:'factory', perCap:0.07, tour:1.0, el:-1.1, cap:10, qImp:70, rec:{ in:[['chips',2],['glass',0.009],['polymer',0.004]], cap:300, lab:130 } },
  { id:'aircon',   name:'Split Air Conditioner', cls:'Home Appliances', kind:'consumer', unit:'pc', ref:2200, imp:1500, t:0.045, src:'factory', perCap:0.06, tour:1.0, el:-0.9, cap:8, qImp:65, rec:{ in:[['aluminium',0.008],['chips',1],['polymer',0.005]], cap:250, lab:180 } },
  { id:'furniture',name:'Sofa Set',           cls:'Furniture', kind:'consumer', unit:'set',  ref:3600, imp:2200, t:0.09, src:'import', perCap:0.035, tour:1.0, el:-1.1, cap:5, qImp:60 },
  { id:'medicine', name:'OTC Medicine',       cls:'Drugs',     kind:'consumer', unit:'pack', ref:36,   imp:21,   t:0.0002, src:'import', perCap:9,  tour:1.3, el:-0.3, cap:250, qImp:75 },
  { id:'toys',     name:'Toys',               cls:'Toy',       kind:'consumer', unit:'pc',   ref:95,   imp:48,   t:0.001, src:'factory', perCap:1.6, tour:1.6, el:-1.2, cap:60, qImp:55, rec:{ in:[['polymer',0.0008]], cap:2000, lab:14 } },
  { id:'car',      name:'Sedan Car',          cls:'Automobile',kind:'consumer', unit:'car',  ref:115000, imp:88000, t:1.4, src:'import', perCap:0.022, tour:0, el:-1.3, cap:1.2, qImp:75 }
];
UAE.P = {}; UAE.PRODUCTS.forEach(function (p) { UAE.P[p.id] = p; });

/* ---- Building / firm types -----------------------------------------------
 * The 29 Capitalism Lab Build-menu entries (B01-B29, ids match the gap audit)
 * plus UAE extensions (Hotel, Solar Farm, Data Centre).
 *   zones   allowed district zones
 *   m2      land footprint per size level (m2)
 *   cpm     construction cost AED per m2 of gross floor area (EST)
 *   floors  gross floor area multiplier (storeys), drives 3D height
 *   staff   employees per size level (wage = city avg x wageMult)
 *   lines   product lines (Capitalism Lab 3x3 units simplified to lines)
 *   kwh     monthly electricity per size level
 *   kind    engine handler name (see engine/sim.js)
 * --------------------------------------------------------------------------*/
UAE.FIRM_TYPES = {
  retail:     { code:'B01', name:'Retail Store',       icon:'🛍', color:'#3ad6ff', zones:['cbd','commercial','residential','tourism'], m2:600,  cpm:3200, floors:1, staff:18, wageMult:0.75, lines:4, kwh:22000, kind:'retail' },
  rnd:        { code:'B02', name:'R&D Center',         icon:'🧪', color:'#b98cff', zones:['tech','cbd','freezone'],    m2:1500, cpm:4200, floors:3, staff:40, wageMult:2.2, lines:1, kwh:60000, kind:'rnd' },
  farm:       { code:'B03', name:'Farm',               icon:'🌴', color:'#6fdc6f', zones:['agri'],                     m2:60000,cpm:120,  floors:0.1, staff:30, wageMult:0.5, lines:2, kwh:40000, kind:'farm' },
  warehouse:  { code:'B04', name:'Warehouse',          icon:'📦', color:'#c9a25f', zones:['industrial','port','freezone'], m2:8000, cpm:1500, floors:1, staff:25, wageMult:0.7, lines:4, kwh:30000, kind:'warehouse' },
  factory:    { code:'B05', name:'Factory',            icon:'🏭', color:'#ff8a3d', zones:['industrial','freezone','port'], m2:9000, cpm:2600, floors:1.2, staff:90, wageMult:0.8, lines:3, kwh:250000, kind:'factory' },
  logging:    { code:'B06', name:'Logging Camp',       icon:'🌲', color:'#777', zones:[], disabled:'No commercial forestry exists in the UAE - timber is imported (gap audit B06).', m2:1, cpm:1, floors:0, staff:0, wageMult:0, lines:0, kwh:0, kind:'none' },
  mine:       { code:'B07', name:'Mine / Quarry',      icon:'⛏', color:'#bfa27a', zones:['quarry'],                   m2:80000,cpm:180,  floors:0.1, staff:60, wageMult:0.8, lines:1, kwh:180000, kind:'mine' },
  oilwell:    { code:'B08', name:'Oil & Gas Well',     icon:'🛢', color:'#ffcc33', zones:['oilfield'],                 m2:20000,cpm:2500, floors:0.2, staff:35, wageMult:1.6, lines:1, kwh:120000, kind:'oil' },
  tv:         { code:'B09', name:'TV Station',         icon:'📺', color:'#ff5c8a', zones:['cbd','tech','commercial'], m2:2500, cpm:5000, floors:4, staff:120, wageMult:1.4, lines:0, kwh:90000, kind:'media', reach:1.0 },
  newspaper:  { code:'B10', name:'Newspaper Publisher',icon:'📰', color:'#ff9fb9', zones:['cbd','tech','commercial'], m2:1500, cpm:3800, floors:3, staff:80, wageMult:1.1, lines:0, kwh:40000, kind:'media', reach:0.45 },
  radio:      { code:'B11', name:'Radio Station',      icon:'📻', color:'#ff7aa8', zones:['cbd','tech','commercial'], m2:900,  cpm:3800, floors:2, staff:35, wageMult:1.1, lines:0, kwh:25000, kind:'media', reach:0.6 },
  hq:         { code:'B12', name:'Headquarters',       icon:'🏢', color:'#f5d06f', zones:['cbd','commercial'],         m2:2000, cpm:6500, floors:12, staff:60, wageMult:2.5, lines:0, kwh:80000, kind:'hq' },
  mansion:    { code:'B13', name:'Mansion',            icon:'🏰', color:'#ffd27f', zones:['residential','tourism'],    m2:3000, cpm:9000, floors:1, staff:12, wageMult:0.6, lines:0, kwh:20000, kind:'mansion' },
  apartment:  { code:'B14', name:'Apartment Tower',    icon:'🏙', color:'#78b4ff', zones:['residential','cbd','tourism'], m2:3500, cpm:4200, floors:30, staff:15, wageMult:0.7, lines:0, kwh:350000, kind:'apartment', unitM2:95 },
  commercial: { code:'B15', name:'Commercial / Office Tower', icon:'🏬', color:'#9fc6ff', zones:['cbd','commercial','tech'], m2:3500, cpm:4800, floors:35, staff:20, wageMult:0.8, lines:0, kwh:500000, kind:'office', unitM2:130 },
  civic:      { code:'B16', name:'Civic Building',     icon:'🏛', color:'#9de0d0', zones:['cbd','commercial','residential'], m2:6000, cpm:5200, floors:2, staff:110, wageMult:1.2, lines:0, kwh:120000, kind:'civic', gov:true },
  sports:     { code:'B17', name:'Sports Facility',    icon:'🏟', color:'#7df0b0', zones:['residential','tourism','commercial'], m2:25000, cpm:2200, floors:0.6, staff:50, wageMult:0.7, lines:0, kwh:150000, kind:'sports' },
  software:   { code:'B18', name:'Software Company',   icon:'💾', color:'#a98bff', zones:['tech','cbd'], dlc:'Digital Age', m2:1200, cpm:4500, floors:4, staff:70, wageMult:2.4, lines:0, kwh:45000, kind:'software' },
  internet:   { code:'B19', name:'Internet / E-commerce Co.', icon:'🌐', color:'#5fe0ff', zones:['tech','cbd','freezone'], dlc:'Digital Age', m2:1500, cpm:4500, floors:4, staff:90, wageMult:2.0, lines:0, kwh:70000, kind:'internet' },
  telecom:    { code:'B20', name:'Telecom Company',    icon:'📡', color:'#40c8ff', zones:['tech','cbd'], dlc:'Digital Age', m2:3000, cpm:6000, floors:5, staff:200, wageMult:1.8, lines:0, kwh:600000, kind:'telecom' },
  bankhq:     { code:'B21', name:'Bank Headquarters',  icon:'🏦', color:'#4dd2a8', zones:['cbd'], dlc:'Banking & Finance', m2:2500, cpm:7000, floors:20, staff:150, wageMult:2.4, lines:0, kwh:150000, kind:'bankhq' },
  bankbranch: { code:'B22', name:'Bank Branch',        icon:'💳', color:'#68e0b9', zones:['cbd','commercial','residential','tourism'], dlc:'Banking & Finance', m2:400, cpm:4200, floors:1, staff:12, wageMult:1.3, lines:0, kwh:15000, kind:'bankbranch' },
  inshq:      { code:'B23', name:'Insurance HQ',       icon:'🛡', color:'#7fd6c2', zones:['cbd'], dlc:'Banking & Finance', m2:1800, cpm:6500, floors:14, staff:110, wageMult:2.0, lines:0, kwh:100000, kind:'inshq' },
  insoffice:  { code:'B24', name:'Insurance Front Office', icon:'📋', color:'#9be3d3', zones:['cbd','commercial','residential'], dlc:'Banking & Finance', m2:300, cpm:4000, floors:1, staff:8, wageMult:1.2, lines:0, kwh:10000, kind:'insoffice' },
  service:    { code:'B25', name:'Service Firm (Restaurant/Café/Gym/Salon)', icon:'☕', color:'#ffb36b', zones:['cbd','commercial','residential','tourism'], dlc:'Service Industry', m2:350, cpm:3800, floors:1, staff:22, wageMult:0.65, lines:1, kwh:18000, kind:'service' },
  mall:       { code:'B26', name:'Shopping Mall',      icon:'🏬', color:'#ffd24d', zones:['commercial','cbd','tourism'], dlc:'Service Industry', m2:40000, cpm:5500, floors:2.5, staff:300, wageMult:0.8, lines:0, kwh:1600000, kind:'mall' },
  importer:   { code:'B27', name:'Import Company',     icon:'🚢', color:'#7ab8ff', zones:['port','freezone','industrial'], dlc:'Service Industry', m2:2000, cpm:2500, floors:2, staff:30, wageMult:1.2, lines:0, kwh:20000, kind:'importer' },
  exporter:   { code:'B28', name:'Export Company',     icon:'⚓', color:'#5ea0ff', zones:['port','freezone','industrial'], dlc:'Service Industry', m2:2000, cpm:2500, floors:2, staff:30, wageMult:1.2, lines:0, kwh:20000, kind:'exporter' },
  logistics:  { code:'B29', name:'Logistics Company',  icon:'🚚', color:'#9ab0ff', zones:['port','freezone','industrial'], dlc:'Service Industry', m2:12000, cpm:1600, floors:1, staff:160, wageMult:0.7, lines:0, kwh:60000, kind:'logistics' },
  // ---- UAE extensions (not in Capitalism Lab's 29) ----
  hotel:      { code:'UAE1', name:'Hotel / Resort',    icon:'🏨', color:'#ffcf8a', zones:['tourism','cbd'], ext:true, m2:5000, cpm:7500, floors:25, staff:220, wageMult:0.7, lines:0, kwh:900000, kind:'hotel', roomsPerLevel:180 },
  solar:      { code:'UAE2', name:'Solar Farm',        icon:'☀', color:'#ffe066', zones:['desert'], ext:true, m2:500000, cpm:55, floors:0.05, staff:25, wageMult:1.2, lines:0, kwh:0, kind:'solar', mw:50 },
  datacenter: { code:'UAE3', name:'Data Centre',       icon:'🖥', color:'#8ef', zones:['tech','industrial','freezone'], ext:true, m2:6000, cpm:9000, floors:2, staff:45, wageMult:2.0, lines:0, kwh:4500000, kind:'datacenter', mw:8 }
};

/* Construction cost per size level, AED (EST - typical UAE build costs), and
 * construction time in days. Land is charged separately: footprint m2 x district price. */
UAE.BUILD = {
  retail:[2.0e6,30], rnd:[12e6,90], farm:[6e6,60], warehouse:[14e6,75], factory:[30e6,120], logging:[0,0],
  mine:[18e6,120], oilwell:[60e6,180], tv:[25e6,90], newspaper:[9e6,60], radio:[5e6,45], hq:[20e6,90],
  mansion:[25e6,180], apartment:[150e6,360], commercial:[180e6,360], civic:[40e6,180], sports:[60e6,240],
  software:[8e6,45], internet:[12e6,60], telecom:[900e6,365], bankhq:[60e6,150], bankbranch:[2.5e6,30],
  inshq:[35e6,120], insoffice:[1.2e6,20], service:[1.8e6,25], mall:[600e6,540], importer:[6e6,40],
  exporter:[6e6,40], logistics:[45e6,120], hotel:[260e6,420], solar:[110e6,240], datacenter:[120e6,270]
};
UAE.LEASE = { apartmentUnits:300, officeM2:25000, mallM2:30000 };   // leasable stock per size level (EST)
/* Farm / resource output per size level per day, variable cost per unit (EST) */
UAE.FARM = { rawmilk:{ out:6, cost:900 }, poultry:{ out:3, cost:3600 }, dates:{ out:1.6, cost:2100, harvest:[6,7,8] }, veg:{ out:4, cost:1500 } };
UAE.RESOURCE = { crude:{ out:4000, cost:28 }, gas:{ out:60000, cost:3 }, limestone:{ out:2500, cost:9 }, sand:{ out:1500, cost:12 } };

/* Service firm offers (Service Industry DLC) - price AED, customers per day base (EST) */
UAE.SERVICES = {
  restaurant: { name:'Restaurant',  price:85,  base:260, foodCost:0.32 },
  cafe:       { name:'Coffee Shop', price:24,  base:520, foodCost:0.25 },
  gym:        { name:'Gym (day-equivalent)', price:18, base:420, foodCost:0.02 },
  salon:      { name:'Salon & Spa', price:160, base:70,  foodCost:0.10 },
  cinema:     { name:'Cinema',      price:55,  base:600, foodCost:0.12 }
};

/* Software classes (Digital Age DLC - REAL class names from capitalismlab.com) */
UAE.SOFTWARE = ['Operating System','Office Software','Computer Security','Graphic Design Software',
                'Video Software','Utility Software','Audio Software'];

/* Internet business models (Digital Age DLC + UAE extension) */
UAE.INTERNET_MODELS = {
  ecommerce: { name:'E-commerce marketplace (GMV take-rate)', arpu:0, takeRate:0.13, gmvPerUser:2400 },
  delivery:  { name:'Food / quick-commerce delivery', arpu:0, takeRate:0.22, gmvPerUser:1500 },
  search:    { name:'Search / portal (ads)', arpu:38, takeRate:0, gmvPerUser:0 },
  social:    { name:'Social network (ads)', arpu:52, takeRate:0, gmvPerUser:0 },
  streaming: { name:'Streaming subscription', arpu:360, takeRate:0, gmvPerUser:0 }
};

/* Random / scheduled economic events (EST scenario library; H1-2026 shock = REAL rates) */
UAE.EVENTS = [
  { id:'oilup',   p:0.010, title:'Brent rallies on OPEC+ cuts', fx:{ oil:+0.18 } },
  { id:'oildown', p:0.010, title:'Oil slumps on demand fears', fx:{ oil:-0.20 } },
  { id:'ratecut', p:0.006, title:'CBUAE cuts base rate 25bp following the Fed', fx:{ rate:-0.0025 } },
  { id:'ratehike',p:0.004, title:'CBUAE raises base rate 25bp', fx:{ rate:+0.0025 } },
  { id:'tourboom',p:0.006, title:'Record winter tourist arrivals forecast', fx:{ tourism:+0.10 } },
  { id:'h1shock', p:0.003, title:'Trade & logistics slowdown (H1-2026 style shock)', fx:{ retail:-0.06, logistics:-0.074, property:-0.025 } },
  { id:'propboom',p:0.005, title:'Off-plan property sales surge', fx:{ property:+0.06 } },
  { id:'goldup',  p:0.006, title:'Gold hits fresh record high', fx:{ gold:+0.08 } },
  { id:'tech',    p:0.005, title:'AI investment wave hits UAE tech clusters', fx:{ tech:+0.08 } },
  { id:'mkt_dn',  p:0.004, title:'Regional equities sell-off', fx:{ equity:-0.07 } },
  { id:'mkt_up',  p:0.004, title:'Foreign inflows lift UAE equities (index upgrade)', fx:{ equity:+0.06 } }
];
/* Fixed calendar events (month index 0-11) */
UAE.CALENDAR = [
  { m:11, d:15, title:'Dubai Shopping Festival begins - retail demand +15%', fx:{ retailDXB:0.15 }, days:45 },
  { m:9,  d:12, title:'GITEX Global - electronics demand +20% in Dubai', fx:{ elecDXB:0.20 }, days:7 },
  { m:11, d:5,  title:'Abu Dhabi F1 Grand Prix at Yas - AUH hotel demand spike', fx:{ hotelAUH:0.35 }, days:5 },
  { m:0,  d:20, title:'Ras Al Khaimah tourism season peak', fx:{ hotelRAK:0.15 }, days:30 }
];
