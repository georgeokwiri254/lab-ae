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
