/* ============================================================================
 * UAE CAPITALISM LAB  -  GLOBAL MARKETS (NYSE, NASDAQ) & REAL RICH LISTS
 * ----------------------------------------------------------------------------
 * US-listed companies trade on two separate exchanges with their own index.
 * They are "foreign": they trade, pay dividends and report earnings (a legacy
 * core business), but never build firms in the UAE and have no game CEO.
 * Figures are in USD here and converted to AED at the 3.6725 peg on load
 * (the engine keeps everything in AED; the UI shows US prices in USD).
 *
 *  px   share price USD   pxs provenance   sh shares outstanding (bn, EST)
 *  rev  revenue USD bn/yr (TTM, EST)        ni net income USD bn/yr (TTM, EST)
 *  div  dividend payout ratio
 *
 * Prices tagged REAL are the close of Fri 20-Nov-2026 (a sharp sell-off day:
 * Nasdaq -5.28%, Nvidia -14%); all other prices / financials are EST and
 * should be refreshed from nyse.com / nasdaq.com.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.GLOBAL_EXCH = {
  NYSE:   { name: 'New York Stock Exchange', index: 'NYSE Composite', base: 20500, src: 'EST ~Nov-2026', vol: 0.009, beta: 0.9 },
  NASDAQ: { name: 'Nasdaq Stock Market',     index: 'NASDAQ Composite', base: 22617.73, src: 'REAL close 20-Nov-2026', vol: 0.012, beta: 1.25 }
};

UAE.GLOBAL_COMPANIES = [
  // ---- NASDAQ
  { id:'US_NVDA', t:'NVDA', x:'NASDAQ', name:'NVIDIA Corp.',        sec:'tech',     px:125.53, pxs:'REAL 20-Nov-2026', sh:24.3,  rev:380, ni:205, div:0.01 },
  { id:'US_AAPL', t:'AAPL', x:'NASDAQ', name:'Apple Inc.',          sec:'tech',     px:342.56, pxs:'REAL 20-Nov-2026', sh:14.8,  rev:425, ni:118, div:0.15 },
  { id:'US_MSFT', t:'MSFT', x:'NASDAQ', name:'Microsoft Corp.',     sec:'tech',     px:484.52, pxs:'REAL 20-Nov-2026', sh:7.43,  rev:310, ni:118, div:0.25 },
  { id:'US_GOOGL',t:'GOOGL',x:'NASDAQ', name:'Alphabet Inc.',       sec:'internet', px:290,    pxs:'EST',              sh:12.1,  rev:410, ni:125, div:0.07 },
  { id:'US_AMZN', t:'AMZN', x:'NASDAQ', name:'Amazon.com Inc.',     sec:'internet', px:220,    pxs:'EST',              sh:10.7,  rev:710, ni:75,  div:0 },
  { id:'US_META', t:'META', x:'NASDAQ', name:'Meta Platforms',      sec:'internet', px:620,    pxs:'EST',              sh:2.52,  rev:200, ni:72,  div:0.08 },
  { id:'US_TSLA', t:'TSLA', x:'NASDAQ', name:'Tesla Inc.',          sec:'auto',     px:345.82, pxs:'REAL 20-Nov-2026', sh:3.3,   rev:98,  ni:6,   div:0 },
  { id:'US_AVGO', t:'AVGO', x:'NASDAQ', name:'Broadcom Inc.',       sec:'tech',     px:300,    pxs:'EST',              sh:4.7,   rev:72,  ni:30,  div:0.5 },
  { id:'US_NFLX', t:'NFLX', x:'NASDAQ', name:'Netflix Inc.',        sec:'media',    px:100,    pxs:'EST',              sh:4.25,  rev:46,  ni:11.5,div:0 },
  { id:'US_COST', t:'COST', x:'NASDAQ', name:'Costco Wholesale',    sec:'retail',   px:930,    pxs:'EST',              sh:0.443, rev:285, ni:8.4, div:0.3 },
  { id:'US_WMT',  t:'WMT',  x:'NASDAQ', name:'Walmart Inc.',        sec:'retail',   px:105,    pxs:'EST',              sh:7.98,  rev:700, ni:20,  div:0.35 },
  { id:'US_PLTR', t:'PLTR', x:'NASDAQ', name:'Palantir Technologies',sec:'tech',    px:150,    pxs:'EST',              sh:2.37,  rev:4.6, ni:1.6, div:0 },
  // ---- NYSE
  { id:'US_BRK',  t:'BRK.B',x:'NYSE',   name:'Berkshire Hathaway',  sec:'holding',  px:490,    pxs:'EST',              sh:2.16,  rev:375, ni:90,  div:0 },
  { id:'US_JPM',  t:'JPM',  x:'NYSE',   name:'JPMorgan Chase',      sec:'bank',     px:300,    pxs:'EST',              sh:2.75,  rev:280, ni:58,  div:0.3 },
  { id:'US_ORCL', t:'ORCL', x:'NYSE',   name:'Oracle Corp.',        sec:'tech',     px:220,    pxs:'EST',              sh:2.85,  rev:66,  ni:13,  div:0.3 },
  { id:'US_V',    t:'V',    x:'NYSE',   name:'Visa Inc.',           sec:'finance',  px:340,    pxs:'EST',              sh:1.95,  rev:40,  ni:21,  div:0.22 },
  { id:'US_LLY',  t:'LLY',  x:'NYSE',   name:'Eli Lilly',           sec:'pharma',   px:900,    pxs:'EST',              sh:0.897, rev:60,  ni:20,  div:0.25 },
  { id:'US_XOM',  t:'XOM',  x:'NYSE',   name:'Exxon Mobil',         sec:'oilgas',   px:115,    pxs:'EST',              sh:4.3,   rev:330, ni:32,  div:0.5 },
  { id:'US_DELL', t:'DELL', x:'NYSE',   name:'Dell Technologies',   sec:'tech',     px:130,    pxs:'EST',              sh:0.68,  rev:105, ni:5,   div:0.3 },
  { id:'US_KO',   t:'KO',   x:'NYSE',   name:'Coca-Cola Co.',       sec:'retail',   px:70,     pxs:'EST',              sh:4.3,   rev:48,  ni:12,  div:0.7 },
  { id:'US_DIS',  t:'DIS',  x:'NYSE',   name:'Walt Disney Co.',     sec:'media',    px:110,    pxs:'EST',              sh:1.8,   rev:95,  ni:10,  div:0.15 },
  { id:'US_GS',   t:'GS',   x:'NYSE',   name:'Goldman Sachs',       sec:'bank',     px:750,    pxs:'EST',              sh:0.31,  rev:55,  ni:14,  div:0.25 }
];

/* Sectors used only by global companies (valuation multiples). */
UAE.SECTORS = UAE.SECTORS || {};
UAE.SECTORS.pharma = UAE.SECTORS.pharma || { name:'Pharmaceuticals', pe:30, assetsPerRev:1.8, debtShare:0.30, grow:0.10, firms:['rnd'] };
UAE.SECTORS.auto   = UAE.SECTORS.auto   || { name:'Automotive',      pe:40, assetsPerRev:1.2, debtShare:0.25, grow:0.10, firms:['factory'] };

/* ---- REAL rich lists (net worth USD bn). These are REAL people shown with their
 * publicly reported net worth; the game does NOT simulate their decisions.
 * `co` + `w`: share of their wealth held in that listed company - their net worth
 * moves with its in-game share price. Without `co` the figure stays fixed.
 * Global figures: real-time billionaire trackers citing Forbes, ~17-19 Nov 2026 (EST).
 * UAE figures: Forbes Middle East "Richest Residents in the UAE 2026" (as of
 * 1 Mar 2026) where tagged REAL, other estimates tagged EST. */
UAE.RICH_GLOBAL = [
  { name:'Elon Musk', wiki:'Elon_Musk',          nw:895.6, src:'EST Nov-2026', ctry:'US', what:'Tesla, SpaceX, xAI',        co:'US_TSLA', w:0.25 },
  { name:'Jeff Bezos', wiki:'Jeff_Bezos',         nw:375.6, src:'EST Nov-2026', ctry:'US', what:'Amazon',                    co:'US_AMZN', w:0.85 },
  { name:'Larry Page', wiki:'Larry_Page',         nw:234.1, src:'EST Nov-2026', ctry:'US', what:'Alphabet (Google)',         co:'US_GOOGL',w:0.95 },
  { name:'Sergey Brin', wiki:'Sergey_Brin',        nw:215.5, src:'EST Nov-2026', ctry:'US', what:'Alphabet (Google)',         co:'US_GOOGL',w:0.95 },
  { name:'Mark Zuckerberg', wiki:'Mark_Zuckerberg',    nw:213.5, src:'EST Nov-2026', ctry:'US', what:'Meta Platforms',            co:'US_META', w:0.95 },
  { name:'Michael Dell', wiki:'Michael_Dell',       nw:199.2, src:'EST Nov-2026', ctry:'US', what:'Dell Technologies',         co:'US_DELL', w:0.6 },
  { name:'Jensen Huang', wiki:'Jensen_Huang',       nw:178,   src:'EST Nov-2026', ctry:'US', what:'NVIDIA',                    co:'US_NVDA', w:0.95 },
  { name:'Warren Buffett', wiki:'Warren_Buffett',     nw:162,   src:'EST Nov-2026', ctry:'US', what:'Berkshire Hathaway',        co:'US_BRK',  w:0.98 },
  { name:'Steve Ballmer', wiki:'Steve_Ballmer',      nw:157,   src:'EST Nov-2026', ctry:'US', what:'Microsoft',                 co:'US_MSFT', w:0.95 },
  { name:'Larry Ellison', wiki:'Larry_Ellison',      nw:154,   src:'EST Nov-2026', ctry:'US', what:'Oracle',                    co:'US_ORCL', w:0.85 },
  { name:'Alice Walton', wiki:'Alice_Walton',       nw:135,   src:'EST Nov-2026', ctry:'US', what:'Walmart',                   co:'US_WMT',  w:0.95 },
  { name:'Jim Walton', wiki:'Jim_Walton',         nw:133,   src:'EST',          ctry:'US', what:'Walmart',                   co:'US_WMT',  w:0.95 },
  { name:'Rob Walton', wiki:'S._Robson_Walton',         nw:130,   src:'EST',          ctry:'US', what:'Walmart',                   co:'US_WMT',  w:0.95 },
  { name:'Bernard Arnault & family', wiki:'Bernard_Arnault', nw:118, src:'EST Nov-2026', ctry:'FR', what:'LVMH' },
  { name:'Amancio Ortega', wiki:'Amancio_Ortega',     nw:120,   src:'EST',          ctry:'ES', what:'Inditex (Zara)' },
  { name:'Bill Gates', wiki:'Bill_Gates',         nw:105,   src:'EST',          ctry:'US', what:'Microsoft, investments',    co:'US_MSFT', w:0.2 },
  { name:'Mukesh Ambani', wiki:'Mukesh_Ambani',      nw:100,   src:'EST',          ctry:'IN', what:'Reliance Industries' },
  { name:'Carlos Slim Helú & family', wiki:'Carlos_Slim', nw:100, src:'EST',     ctry:'MX', what:'América Movil, Grupo Carso' },
  { name:'Michael Bloomberg', wiki:'Michael_Bloomberg',  nw:94.92, src:'EST Nov-2026', ctry:'US', what:'Bloomberg LP' },
  { name:'Gautam Adani', wiki:'Gautam_Adani',       nw:84.28, src:'EST Nov-2026', ctry:'IN', what:'Adani Group' }
];
UAE.RICH_UAE = [
  { name:'Hussain Sajwani', wiki:'Hussain_Sajwani',             nw:15.3, src:'REAL Forbes ME 2026', ctry:'AE', city:'DXB', what:'DAMAC Properties' },
  { name:'Abdul Aziz Al Ghurair', wiki:'Abdul_Aziz_Al_Ghurair',       nw:7.5,  src:'EST',                 ctry:'AE', city:'DXB', what:'Al Ghurair Group, Mashreq' },
  { name:'Yusuffali M.A.', wiki:'M._A._Yusuff_Ali',              nw:5.4,  src:'EST',                 ctry:'IN', city:'AUH', what:'Lulu Group' },
  { name:'Abdulla Al Futtaim & family', wiki:'Abdulla_Al_Futtaim', nw:4.7,  src:'REAL Forbes ME 2026', ctry:'AE', city:'DXB', what:'Al-Futtaim Group' },
  { name:'Ravi Pillai', wiki:'B._Ravi_Pillai',                 nw:4.0,  src:'EST',                 ctry:'IN', city:'AUH', what:'RP Group' },
  { name:'Saif Al Ghurair', wiki:'Saif_Ahmad_Al_Ghurair',             nw:3.1,  src:'EST',                 ctry:'AE', city:'DXB', what:'Al Ghurair Investment' }
];

/* ---- WORLD EXCHANGES & TOP GLOBAL COMPANIES (added 2026-11-22) -------------------------------
 * The world's largest listed companies that were missing: Saudi Aramco, TSMC, Samsung, Tencent,
 * LVMH, Toyota, Nestlé, ASML, Novo Nordisk ... on their home exchange (US-listed ADRs stay on
 * NYSE / NASDAQ). Same rules as the US companies: they trade, report earnings and pay dividends,
 * but do not build firms in the UAE. Figures in USD (converted to AED on load), all EST ~Nov-2026:
 * refresh from the exchanges' websites. `region` = which regional market factor moves the index. */
(function () {
  var X = {
    TADAWUL:  { name: 'Saudi Exchange (Tadawul)', index: 'TASI',          base: 11500, src: 'EST ~Nov-2026', vol: 0.008, beta: 0.7, region: 'ME', world: true, ctry: 'SA' },
    LSE:      { name: 'London Stock Exchange',    index: 'FTSE 100',      base: 9600,  src: 'EST ~Nov-2026', vol: 0.008, beta: 0.8, region: 'EU', world: true, ctry: 'GB' },
    EURONEXT: { name: 'Euronext Paris',           index: 'CAC 40',        base: 8000,  src: 'EST ~Nov-2026', vol: 0.009, beta: 0.9, region: 'EU', world: true, ctry: 'FR' },
    XETRA:    { name: 'Deutsche Börse Xetra',     index: 'DAX',           base: 24000, src: 'EST ~Nov-2026', vol: 0.009, beta: 0.9, region: 'EU', world: true, ctry: 'DE' },
    SIX:      { name: 'SIX Swiss Exchange',       index: 'SMI',           base: 12500, src: 'EST ~Nov-2026', vol: 0.007, beta: 0.6, region: 'EU', world: true, ctry: 'CH' },
    OMXC:     { name: 'Nasdaq Copenhagen',        index: 'OMXC25',        base: 1650,  src: 'EST ~Nov-2026', vol: 0.010, beta: 0.8, region: 'EU', world: true, ctry: 'DK' },
    BME:      { name: 'Bolsa de Madrid',          index: 'IBEX 35',       base: 15500, src: 'EST ~Nov-2026', vol: 0.009, beta: 0.9, region: 'EU', world: true, ctry: 'ES' },
    TSE:      { name: 'Tokyo Stock Exchange',     index: 'TOPIX',         base: 3200,  src: 'EST ~Nov-2026', vol: 0.010, beta: 0.9, region: 'ASIA', world: true, ctry: 'JP' },
    HKEX:     { name: 'Hong Kong Exchange',       index: 'Hang Seng',     base: 26000, src: 'EST ~Nov-2026', vol: 0.013, beta: 1.1, region: 'ASIA', world: true, ctry: 'HK' },
    TWSE:     { name: 'Taiwan Stock Exchange',    index: 'TAIEX',         base: 26000, src: 'EST ~Nov-2026', vol: 0.012, beta: 1.1, region: 'ASIA', world: true, ctry: 'TW' },
    KRX:      { name: 'Korea Exchange',           index: 'KOSPI',         base: 3900,  src: 'EST ~Nov-2026', vol: 0.012, beta: 1.0, region: 'ASIA', world: true, ctry: 'KR' },
    NSE:      { name: 'National Stock Exchange of India', index: 'Nifty 50', base: 26000, src: 'EST ~Nov-2026', vol: 0.009, beta: 0.8, region: 'ASIA', world: true, ctry: 'IN' }
  };
  for (var k in X) if (!UAE.GLOBAL_EXCH[k]) UAE.GLOBAL_EXCH[k] = X[k];
  UAE.GLOBAL_EXCH.NYSE.region = UAE.GLOBAL_EXCH.NASDAQ.region = 'US';
  var add = [
    // ---- US (NASDAQ / NYSE) - large companies that were missing
    { id:'US_AMD',  t:'AMD',  x:'NASDAQ', name:'Advanced Micro Devices', sec:'tech',    px:240,  pxs:'EST', sh:1.62,  rev:34,  ni:4.5, div:0 },
    { id:'US_ASML', t:'ASML', x:'NASDAQ', name:'ASML Holding',        sec:'tech',     px:1050, pxs:'EST', sh:0.39,  rev:37,  ni:11,  div:0.3,  home:'NL' },
    { id:'US_CSCO', t:'CSCO', x:'NASDAQ', name:'Cisco Systems',       sec:'tech',     px:75,   pxs:'EST', sh:3.95,  rev:57,  ni:10.5,div:0.55 },
    { id:'US_QCOM', t:'QCOM', x:'NASDAQ', name:'Qualcomm',            sec:'tech',     px:170,  pxs:'EST', sh:1.08,  rev:44,  ni:11,  div:0.35 },
    { id:'US_ADBE', t:'ADBE', x:'NASDAQ', name:'Adobe Inc.',          sec:'tech',     px:350,  pxs:'EST', sh:0.42,  rev:24,  ni:7.2, div:0 },
    { id:'US_INTC', t:'INTC', x:'NASDAQ', name:'Intel Corp.',         sec:'tech',     px:38,   pxs:'EST', sh:4.4,   rev:53,  ni:1,   div:0 },
    { id:'US_PEP',  t:'PEP',  x:'NASDAQ', name:'PepsiCo',             sec:'retail',   px:150,  pxs:'EST', sh:1.37,  rev:92,  ni:9,   div:0.7 },
    { id:'US_MA',   t:'MA',   x:'NYSE',   name:'Mastercard',          sec:'finance',  px:560,  pxs:'EST', sh:0.9,   rev:32,  ni:15,  div:0.18 },
    { id:'US_UNH',  t:'UNH',  x:'NYSE',   name:'UnitedHealth Group',  sec:'finance',  px:330,  pxs:'EST', sh:0.9,   rev:440, ni:15,  div:0.5 },
    { id:'US_JNJ',  t:'JNJ',  x:'NYSE',   name:'Johnson & Johnson',   sec:'pharma',   px:200,  pxs:'EST', sh:2.4,   rev:92,  ni:20,  div:0.55 },
    { id:'US_PG',   t:'PG',   x:'NYSE',   name:'Procter & Gamble',    sec:'retail',   px:150,  pxs:'EST', sh:2.34,  rev:85,  ni:16,  div:0.6 },
    { id:'US_HD',   t:'HD',   x:'NYSE',   name:'Home Depot',          sec:'retail',   px:370,  pxs:'EST', sh:0.99,  rev:165, ni:14.5,div:0.6 },
    { id:'US_BAC',  t:'BAC',  x:'NYSE',   name:'Bank of America',     sec:'bank',     px:52,   pxs:'EST', sh:7.4,   rev:105, ni:30,  div:0.3 },
    { id:'US_CVX',  t:'CVX',  x:'NYSE',   name:'Chevron',             sec:'oilgas',   px:150,  pxs:'EST', sh:2.0,   rev:190, ni:15,  div:0.7 },
    { id:'US_CRM',  t:'CRM',  x:'NYSE',   name:'Salesforce',          sec:'tech',     px:240,  pxs:'EST', sh:0.95,  rev:41,  ni:7,   div:0.15 },
    { id:'US_IBM',  t:'IBM',  x:'NYSE',   name:'IBM',                 sec:'tech',     px:300,  pxs:'EST', sh:0.93,  rev:66,  ni:8,   div:0.7 },
    { id:'US_UBER', t:'UBER', x:'NYSE',   name:'Uber Technologies',   sec:'internet', px:90,   pxs:'EST', sh:2.1,   rev:50,  ni:10,  div:0 },
    { id:'US_BABA', t:'BABA', x:'NYSE',   name:'Alibaba Group',       sec:'internet', px:160,  pxs:'EST', sh:2.3,   rev:140, ni:18,  div:0.15, home:'CN' },
    // ---- Saudi Arabia
    { id:'SA_ARAMCO', t:'2222', x:'TADAWUL', name:'Saudi Aramco',     sec:'oilgas',   px:6.9,  pxs:'EST', sh:242,   rev:440, ni:105, div:0.95, home:'SA' },
    { id:'SA_RAJHI',  t:'1120', x:'TADAWUL', name:'Al Rajhi Bank',    sec:'bank',     px:26,   pxs:'EST', sh:4.0,   rev:9,   ni:5.2, div:0.5,  home:'SA' },
    { id:'SA_ACWA',   t:'2082', x:'TADAWUL', name:'ACWA Power',       sec:'utility',  px:60,   pxs:'EST', sh:0.75,  rev:2,   ni:0.5, div:0.2,  home:'SA' },
    { id:'SA_MAADEN', t:'1211', x:'TADAWUL', name:"Ma'aden",          sec:'metals',   px:15,   pxs:'EST', sh:3.8,   rev:9,   ni:1.5, div:0,    home:'SA' },
    // ---- Europe
    { id:'GB_AZN',  t:'AZN',  x:'LSE',      name:'AstraZeneca',       sec:'pharma',   px:175,  pxs:'EST', sh:1.55,  rev:58,  ni:9,   div:0.5,  home:'GB' },
    { id:'GB_SHEL', t:'SHEL', x:'LSE',      name:'Shell plc',         sec:'oilgas',   px:37,   pxs:'EST', sh:5.9,   rev:280, ni:18,  div:0.45, home:'GB' },
    { id:'GB_HSBA', t:'HSBA', x:'LSE',      name:'HSBC Holdings',     sec:'bank',     px:14,   pxs:'EST', sh:17.5,  rev:67,  ni:23,  div:0.5,  home:'GB' },
    { id:'GB_ULVR', t:'ULVR', x:'LSE',      name:'Unilever',          sec:'retail',   px:62,   pxs:'EST', sh:2.5,   rev:65,  ni:7.5, div:0.7,  home:'GB' },
    { id:'GB_RR',   t:'RR.',  x:'LSE',      name:'Rolls-Royce Holdings', sec:'industrial', px:15, pxs:'EST', sh:8.4, rev:26,  ni:3,   div:0.1,  home:'GB' },
    { id:'FR_MC',   t:'MC',   x:'EURONEXT', name:'LVMH Moët Hennessy Louis Vuitton', sec:'retail', px:700, pxs:'EST', sh:0.50, rev:92, ni:14, div:0.5, home:'FR' },
    { id:'FR_RMS',  t:'RMS',  x:'EURONEXT', name:'Hermès International', sec:'retail', px:2500, pxs:'EST', sh:0.105, rev:17.5, ni:5,  div:0.35, home:'FR' },
    { id:'FR_OR',   t:'OR',   x:'EURONEXT', name:"L'Oréal",           sec:'retail',   px:430,  pxs:'EST', sh:0.535, rev:47,  ni:7,   div:0.5,  home:'FR' },
    { id:'FR_TTE',  t:'TTE',  x:'EURONEXT', name:'TotalEnergies',     sec:'oilgas',   px:62,   pxs:'EST', sh:2.2,   rev:200, ni:16,  div:0.5,  home:'FR' },
    { id:'FR_AIR',  t:'AIR',  x:'EURONEXT', name:'Airbus',            sec:'industrial', px:230, pxs:'EST', sh:0.79, rev:80,  ni:6,   div:0.3,  home:'FR' },
    { id:'DE_SAP',  t:'SAP',  x:'XETRA',    name:'SAP SE',            sec:'tech',     px:270,  pxs:'EST', sh:1.17,  rev:40,  ni:8,   div:0.3,  home:'DE' },
    { id:'DE_SIE',  t:'SIE',  x:'XETRA',    name:'Siemens AG',        sec:'industrial', px:270, pxs:'EST', sh:0.79, rev:85,  ni:10,  div:0.4,  home:'DE' },
    { id:'CH_NESN', t:'NESN', x:'SIX',      name:'Nestlé',            sec:'retail',   px:95,   pxs:'EST', sh:2.58,  rev:100, ni:12,  div:0.65, home:'CH' },
    { id:'CH_ROG',  t:'ROG',  x:'SIX',      name:'Roche Holding',     sec:'pharma',   px:330,  pxs:'EST', sh:0.80,  rev:68,  ni:12,  div:0.5,  home:'CH' },
    { id:'CH_NOVN', t:'NOVN', x:'SIX',      name:'Novartis',          sec:'pharma',   px:120,  pxs:'EST', sh:1.97,  rev:55,  ni:14,  div:0.5,  home:'CH' },
    { id:'DK_NOVO', t:'NOVO B', x:'OMXC',   name:'Novo Nordisk',      sec:'pharma',   px:50,   pxs:'EST', sh:4.44,  rev:45,  ni:15,  div:0.5,  home:'DK' },
    { id:'ES_ITX',  t:'ITX',  x:'BME',      name:'Inditex (Zara)',    sec:'retail',   px:55,   pxs:'EST', sh:3.12,  rev:43,  ni:7,   div:0.75, home:'ES' },
    // ---- Asia
    { id:'JP_TM',   t:'7203', x:'TSE',      name:'Toyota Motor',      sec:'auto',     px:19,   pxs:'EST', sh:13.0,  rev:330, ni:33,  div:0.3,  home:'JP' },
    { id:'JP_SONY', t:'6758', x:'TSE',      name:'Sony Group',        sec:'tech',     px:27,   pxs:'EST', sh:6.0,   rev:90,  ni:8,   div:0.1,  home:'JP' },
    { id:'JP_SBG',  t:'9984', x:'TSE',      name:'SoftBank Group',    sec:'holding',  px:25,   pxs:'EST', sh:5.7,   rev:47,  ni:10,  div:0.05, home:'JP' },
    { id:'CN_TCEHY',t:'0700', x:'HKEX',     name:'Tencent Holdings',  sec:'internet', px:80,   pxs:'EST', sh:9.2,   rev:105, ni:35,  div:0.15, home:'CN' },
    { id:'CN_BYD',  t:'1211', x:'HKEX',     name:'BYD Company',       sec:'auto',     px:14,   pxs:'EST', sh:9.1,   rev:110, ni:6,   div:0.3,  home:'CN' },
    { id:'CN_XIAOMI',t:'1810',x:'HKEX',     name:'Xiaomi Corp.',      sec:'tech',     px:6,    pxs:'EST', sh:26,    rev:60,  ni:5,   div:0,    home:'CN' },
    { id:'CN_CATL', t:'3750', x:'HKEX',     name:'CATL (Contemporary Amperex)', sec:'industrial', px:55, pxs:'EST', sh:4.56, rev:52, ni:9, div:0.5, home:'CN' },
    { id:'TW_TSMC', t:'2330', x:'TWSE',     name:'TSMC (Taiwan Semiconductor)', sec:'tech', px:45, pxs:'EST', sh:25.9, rev:115, ni:50, div:0.3, home:'TW' },
    { id:'TW_HONHAI',t:'2317',x:'TWSE',     name:'Hon Hai (Foxconn)', sec:'tech',     px:7,    pxs:'EST', sh:13.9,  rev:220, ni:5,   div:0.5,  home:'TW' },
    { id:'KR_SSNLF',t:'005930',x:'KRX',     name:'Samsung Electronics', sec:'tech',   px:70,   pxs:'EST', sh:5.9,   rev:220, ni:25,  div:0.25, home:'KR' },
    { id:'KR_HYNIX',t:'000660',x:'KRX',     name:'SK Hynix',          sec:'tech',     px:400,  pxs:'EST', sh:0.728, rev:65,  ni:30,  div:0.1,  home:'KR' },
    { id:'IN_RIL',  t:'RELIANCE', x:'NSE',  name:'Reliance Industries', sec:'holding', px:17,  pxs:'EST', sh:13.5,  rev:115, ni:9,   div:0.1,  home:'IN' },
    { id:'IN_TCS',  t:'TCS',  x:'NSE',      name:'Tata Consultancy Services', sec:'tech', px:38, pxs:'EST', sh:3.6, rev:30, ni:6, div:0.8, home:'IN' },
    { id:'IN_HDFCB',t:'HDFCBANK', x:'NSE',  name:'HDFC Bank',         sec:'bank',     px:11,   pxs:'EST', sh:15.3,  rev:40,  ni:9,   div:0.2,  home:'IN' }
  ];
  add.forEach(function (g) { if (!UAE.GLOBAL_COMPANIES.some(function (x) { return x.id === g.id; })) UAE.GLOBAL_COMPANIES.push(g); });
  // rich-list people whose fortune is one of these companies now move with its share price
  var link = { 'Bernard Arnault & family': ['FR_MC', 0.9], 'Amancio Ortega': ['ES_ITX', 0.85], 'Mukesh Ambani': ['IN_RIL', 0.5] };
  UAE.RICH_GLOBAL.forEach(function (r) { var l = link[r.name]; if (l && !r.co) { r.co = l[0]; r.w = l[1]; } });
  [{ name: 'Françoise Bettencourt Meyers & family', wiki: 'Françoise_Bettencourt_Meyers', nw: 95, src: 'EST', ctry: 'FR', what: "L'Oréal", co: 'FR_OR', w: 0.9 },
   { name: 'Ma Huateng', wiki: 'Ma_Huateng', nw: 60, src: 'EST', ctry: 'CN', what: 'Tencent', co: 'CN_TCEHY', w: 0.8 },
   { name: 'Lee Jae-yong & family', wiki: 'Lee_Jae-yong', nw: 15, src: 'EST', ctry: 'KR', what: 'Samsung', co: 'KR_SSNLF', w: 0.6 },
   { name: 'Akio Toyoda', wiki: 'Akio_Toyoda', nw: 1.5, src: 'EST', ctry: 'JP', what: 'Toyota Motor', co: 'JP_TM', w: 0.8 },
   { name: 'Masayoshi Son', wiki: 'Masayoshi_Son', nw: 30, src: 'EST', ctry: 'JP', what: 'SoftBank Group', co: 'JP_SBG', w: 0.9 },
   { name: 'Wang Chuanfu', wiki: 'Wang_Chuanfu', nw: 20, src: 'EST', ctry: 'CN', what: 'BYD', co: 'CN_BYD', w: 0.85 },
   { name: 'Lei Jun', wiki: 'Lei_Jun', nw: 35, src: 'EST', ctry: 'CN', what: 'Xiaomi', co: 'CN_XIAOMI', w: 0.8 },
   { name: 'Zeng Yuqun (Robin Zeng)', wiki: 'Zeng_Yuqun', nw: 60, src: 'EST', ctry: 'CN', what: 'CATL', co: 'CN_CATL', w: 0.85 }
  ].forEach(function (r) { if (!UAE.RICH_GLOBAL.some(function (x) { return x.name === r.name; })) UAE.RICH_GLOBAL.push(r); });
})();

/* ---- NAIROBI SECURITIES EXCHANGE (Kenya) + SPACEX (added 2026-11-22) --------------------------
 * Nairobi: the largest NSE-listed companies. Prices converted from KES at ~129 KES/USD; all figures
 * EST ~Nov-2026 (refresh from nse.co.ke). SpaceX is private: no share price, valued as a private company
 * (EST revenue ~USD 22bn in 2026); it leads the world launch and satellite-internet markets in the game. */
(function () {
  if (!UAE.GLOBAL_EXCH.NSEKE) UAE.GLOBAL_EXCH.NSEKE = { name: 'Nairobi Securities Exchange', index: 'NASI', base: 190, src: 'EST ~Nov-2026', vol: 0.008, beta: 0.5, region: 'AF', world: true, ctry: 'KE' };
  UAE.SECTORS.space = UAE.SECTORS.space || { name: 'Space', pe: 60, assetsPerRev: 2.0, debtShare: 0.15, grow: 0.25, firms: ['factory'] };
  var add = [
    { id:'KE_SCOM', t:'SCOM', x:'NSEKE', name:'Safaricom',                 sec:'telecom',  px:0.22,  pxs:'EST', sh:40.07, rev:2.8,  ni:0.33, div:0.9,  home:'KE' },
    { id:'KE_EQTY', t:'EQTY', x:'NSEKE', name:'Equity Group Holdings',     sec:'bank',     px:0.46,  pxs:'EST', sh:3.77,  rev:1.45, ni:0.45, div:0.3,  home:'KE' },
    { id:'KE_KCB',  t:'KCB',  x:'NSEKE', name:'KCB Group',                 sec:'bank',     px:0.43,  pxs:'EST', sh:3.21,  rev:1.6,  ni:0.48, div:0.25, home:'KE' },
    { id:'KE_EABL', t:'EABL', x:'NSEKE', name:'East African Breweries',    sec:'retail',   px:1.63,  pxs:'EST', sh:0.79,  rev:0.97, ni:0.1,  div:0.7,  home:'KE' },
    { id:'KE_COOP', t:'COOP', x:'NSEKE', name:'Co-operative Bank of Kenya', sec:'bank',    px:0.14,  pxs:'EST', sh:5.87,  rev:0.6,  ni:0.19, div:0.5,  home:'KE' },
    { id:'KE_NCBA', t:'NCBA', x:'NSEKE', name:'NCBA Group',                sec:'bank',     px:0.54,  pxs:'EST', sh:1.65,  rev:0.55, ni:0.17, div:0.6,  home:'KE' },
    { id:'KE_SBIC', t:'SBIC', x:'NSEKE', name:'Stanbic Holdings',          sec:'bank',     px:1.32,  pxs:'EST', sh:0.395, rev:0.35, ni:0.1,  div:0.6,  home:'KE' },
    { id:'KE_ABSA', t:'ABSA', x:'NSEKE', name:'Absa Bank Kenya',           sec:'bank',     px:0.155, pxs:'EST', sh:5.43,  rev:0.45, ni:0.14, div:0.5,  home:'KE' },
    { id:'KE_BAT',  t:'BAT',  x:'NSEKE', name:'BAT Kenya',                 sec:'retail',   px:3.1,   pxs:'EST', sh:0.1,   rev:0.2,  ni:0.04, div:0.9,  home:'KE' },
    { id:'KE_KEGN', t:'KEGN', x:'NSEKE', name:'KenGen',                    sec:'utility',  px:0.047, pxs:'EST', sh:6.59,  rev:0.43, ni:0.05, div:0.3,  home:'KE' },
    { id:'KE_KPLC', t:'KPLC', x:'NSEKE', name:'Kenya Power & Lighting',    sec:'utility',  px:0.093, pxs:'EST', sh:1.95,  rev:1.5,  ni:0.2,  div:0.1,  home:'KE' },
    { id:'US_SPACEX', t:'', x:'', st:'UNLISTED', name:'SpaceX (Space Exploration Technologies)', sec:'space', px:0, pxs:'', sh:1.3, rev:22, ni:3, div:0, home:'US' }
  ];
  add.forEach(function (g) { if (!UAE.GLOBAL_COMPANIES.some(function (x) { return x.id === g.id; })) UAE.GLOBAL_COMPANIES.push(g); });
})();
