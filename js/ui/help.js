/* ============================================================================
 * UAE CAPITALISM LAB  -  BEGINNER HELP
 *  1. Hover help: point the mouse at a menu button, building type, number card,
 *     table column, tab or button and a neon tooltip explains it in plain words.
 *     Switch off in Settings (F9) -> "Beginner hover help".
 *  2. Help guide (F1 or the ? button): short getting-started topics.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

/* --------------------------------------------- what the menu buttons do */
UI.HELP_ACT = {
  build: 'Build a new business: shops, factories, offices, malls, farms, software companies… Pick a type, then click a glowing zone on the map. Hold Shift and click to build several quickly.',
  info: 'Information Center: all reports in one place – market data, products, people, rankings and guides.',
  firms: 'A list of every business (firm) you own, with its profit. Click one to manage it.',
  fin: 'Your company’s accounts: income statement (what you earned and spent), balance sheet (what you own and owe) and cash flow.',
  corp: 'Your company’s page: overview, firms, products, accounts, shareholders and your logo.',
  factions: 'Money tools: take a loan, issue shares, list your company on the stock exchange (IPO), pay dividends, buy back shares or buy other companies.',
  stock: 'Stock market: buy and sell shares of companies on DFM, ADX, NYSE and NASDAQ, with your own money or your company’s.',
  bonds: 'Bonds: lend money to governments or companies and earn interest (lower risk than shares).',
  cities: 'City economics: population, wages, prices, rents and how each city’s economy is doing. Strong cities buy more.',
  rank: 'Rankings: the richest people (UAE and world), the best CEOs and the biggest companies and cities.',
  hq: 'Headquarters: your executive team (CEO, CMO, CTO) and department budgets for marketing, training and research.',
  ceo: 'CEO policies: what your CEO is allowed to build, which products you make and how prices and budgets are set.',
  pdetail: 'Product Details: everything about one product – who sells it, prices, quality, brand, demand and supply chain.',
  news: 'News and events: what is happening in the economy, to your firms and to your rivals.',
  save: 'Save and load your game, backups, options, add cash and elite people.',
  marketing: 'Marketing: advertising campaigns that make customers know and like your products (brand).',
  startBuild: 'Start placing this building on the map. Green outline = you can build here, magenta = not allowed.',
  confirmBuild: 'Pay for the land and construction and open the building.',
  fExpand: 'Make this firm bigger: more staff and capacity so it can make or sell more.',
  fSell: 'Sell or demolish this firm and get most of its value back in cash.',
  fDup: 'Copy this firm: same size, products, prices and suppliers. Then Shift+click the map to place copies.',
  lineAdd: 'Add another product to this firm (each firm has a limited number of lines).',
  linkBuyers: 'Make your own shops and factories buy this product from here instead of importing it – cheaper and you keep the profit.',
  resStart: 'Start a research project: costs money over some days, then your technology (product quality) jumps and you get a new model.',
  trade: 'Buy or sell these shares at the current price (a small fee applies).',
  logoPick: 'Choose a logo for your company, or upload your own picture.',
  maxMe: 'Cheat: set all your skills and expertise to 100.',
  eliteHire: 'Cheat: create top-level (maxed) candidates you can hire as CEO or CMO.',
  addCash: 'Cheat: add money to your company.', addCashQ: 'Cheat: add this amount to your company.',
  hireCeo: 'Make this person your CEO. A CEO can run the company for you (switch on “CEO runs the company” in HQ).',
  hireCmo: 'Make this person your Chief Marketing Officer – they run advertising campaigns for your products.',
  hireCto: 'Make this person your Chief Technology Officer – they keep your research projects going.',
  personEdit: 'Rename this person and give them a photo (from a Wikipedia page).',
  mallStore: 'Rent space in this mall and open a shop or café inside – no land needed, you pay monthly rent.',
  adFor: 'Start an advertising campaign for this product in this city.',
  restoreAsk: 'Put this backup back into its save slot (the current save is backed up first).'
};
UI.HELP_BUILD = {
  retail: 'Shop: buys products (from your factories or imports) and sells them to the public. Pick busy districts – more people walk past.',
  service: 'Restaurant, café, gym, salon or cinema: sells a service to customers every day. Great inside malls.',
  mall: 'Shopping mall: you rent space to shops (yours or other companies’) and earn rent. Very expensive, very valuable.',
  hotel: 'Hotel: earns from tourists – busy in winter (Nov–Mar), quieter in summer.',
  sports: 'Sports or attraction: sells tickets; tourists love it.',
  factory: 'Factory: turns raw materials into products (e.g. chips → smartphones). Sell to your shops, other companies or export.',
  warehouse: 'Warehouse: imports in bulk a little cheaper and supplies your shops.',
  farm: 'Farm: produces milk, chickens, dates or vegetables for food factories.',
  mine: 'Mine / quarry: digs limestone or sand from a real resource site – inputs for cement and glass.',
  oilwell: 'Oil & gas well: pumps crude oil or gas from a real oilfield – inputs for fuel and plastics.',
  solar: 'Solar farm: sells electricity under a long contract – steady income.',
  apartment: 'Apartment tower: rent flats to residents – steady rental income.',
  commercial: 'Office tower: rent offices to businesses.',
  mansion: 'Your private mansion – a status symbol.',
  tv: 'TV station: earns money from everyone’s advertising in this city.', radio: 'Radio station: earns from advertising.', newspaper: 'Newspaper: earns from advertising.',
  software: 'Software company: creates software (Operating System, AI Assistant, chip design…) and sells licences – very high margins.',
  internet: 'Internet company: e-commerce, delivery, search, social or streaming – earns from users.',
  telecom: 'Telecom: mobile subscribers paying monthly – huge build cost, steady income.',
  datacenter: 'Data centre: rents computing power to businesses.',
  rnd: 'R&D centre: researches a product to raise its technology, which makes everything you make better quality.',
  bankhq: 'Bank: takes deposits and lends money, earning the difference in interest.', bankbranch: 'Bank branch: brings in more customer deposits for your bank.',
  inshq: 'Insurance company: collects premiums and pays claims.', insoffice: 'Insurance office: sells more insurance.',
  importer: 'Import company: makes all your imports in this emirate cheaper.', exporter: 'Export company: you get a better price when your factories export.',
  logistics: 'Logistics company: cuts your transport costs and earns from freight.',
  hq: 'Headquarters: your company’s main office.', civic: 'Government building (Government Mode only).'
};
/* ------------------------------------------------ words on cards, columns */
UI.HELP_TERMS = {
  'cash': 'Money your company has right now. If it runs out you must borrow – keep a safety cushion.',
  'net profit ttm': 'Profit over the last 12 months (revenue minus all costs and tax). TTM = trailing twelve months.',
  'net profit': 'What is left after all costs and tax. Positive = making money.',
  'company value': 'What your company is worth: share price × shares if listed, otherwise an estimate from profit and assets.',
  'revenue': 'All the money coming in from sales before any costs.',
  'revenue ttm': 'Sales over the last 12 months.',
  'profit': 'Revenue minus costs. Green = earning, red = losing money.',
  'date': 'Game date. Use 1–5 to change speed, Space to pause.',
  'dfm gi': 'Dubai Financial Market index – rises when Dubai-listed shares rise.', 'dfm general index': 'Dubai Financial Market index – rises when Dubai-listed shares rise.',
  'adx fadgi': 'Abu Dhabi stock market index.', 'nyse composite': 'New York Stock Exchange index (US shares, shown in AED).', 'nasdaq composite': 'NASDAQ index – mostly US tech companies (shown in AED).',
  'size': 'How big the firm is (levels). Bigger = more capacity and staff. Use Expand to grow.',
  'efficiency': 'How well the firm runs (100% = normal). Training and good managers raise it.',
  'book value': 'What the building and land are worth on your accounts.',
  'quality': 'How good the product is (0–100). Comes from technology (R&D) and inputs. Customers pay more for quality.',
  'price': 'Your selling price. Lower = more sales but less profit per item.',
  'stock': 'How many units are stored, ready to sell or use.',
  'supplier': 'Where this firm buys the product: your own factory (cheapest), another company, or import.',
  'demand': 'How many units customers want per day at your price.',
  'capacity': 'The most this line can sell or make per day. Expand or train to raise it.',
  'sold/day': 'Units sold yesterday.', 'sold this month': 'Units sold or delivered this month.',
  'unit cost': 'What one unit costs you to buy or make.',
  'market price': 'Typical price buyers pay for this product right now.',
  'output / day': 'How many units this production line makes per day.',
  'made this month': 'Units produced so far this month.',
  'technology': 'Your know-how for a product (0–100). Higher technology = higher quality. Raise it with R&D.',
  'brand': 'How well-known and liked your product is. Built by advertising and good quality.',
  'overall': 'Overall rating customers use to choose: a mix of price, quality and brand.',
  'share': 'Your share of all sales of this product in the city.',
  'mkt cap': 'Market capitalisation: share price × number of shares = what the market says the company is worth.',
  'p/e': 'Price/earnings: how many years of profit the company costs. Low = cheap, high = expensive or fast-growing.',
  'float': 'Share of the company that anyone can buy on the market.',
  'you hold': 'How much of this company you (and your company) own.',
  '1d': 'Price change since yesterday.', '30d': 'Price trend over the last 30 days.',
  'ticker': 'The short code of a listed company (e.g. EMAAR, AAPL).',
  'equity': 'What the owners own: assets minus debts.', 'equity (book)': 'What the owners own: assets minus debts.',
  'total assets': 'Everything the company owns: cash, buildings, land, stock, investments.', 'assets': 'Everything the company owns.',
  'credit rating': 'How safe it is to lend to you (AAA best). Better rating = cheaper loans.',
  'est. equity value': 'Estimated value of a private company.',
  'net worth': 'A person’s total wealth: cash + shares + property.',
  'customer traffic index': 'How many shoppers pass the store – busy districts and malls score higher.',
  'store popularity': 'How much customers like this store – grows with good products and prices.',
  'occupancy': 'Share of rooms, flats or offices that are rented out.',
  'rent': 'What tenants pay you (or you pay the landlord).',
  'market rent': 'Typical rent in this area.',
  'staff': 'Employees – they get salaries every month.',
  'run cost / month': 'Monthly running cost: salaries plus electricity.',
  'land': 'Price of the land (depends on the district).', 'construction': 'Cost to construct the building.', 'build time': 'How long until it opens (instant by default).',
  'online sales / day': 'Licences sold directly online each day.',
  'licence stock': 'Ready licences for shops and factories to buy.',
  'demand growth': 'How fast demand for this product grows each year.',
  'current model': 'Your latest version of this product. Research makes the next one.',
  'best rival': 'The competitor with the best technology for this product.',
  'overall rating': 'How attractive the mall is to shoppers.',
  'retail units': 'How many shop spaces the mall has.',
  'richest in the uae': 'The wealthiest person in the UAE right now.', 'richest in the world': 'The wealthiest person in the world right now.',
  'your rank': 'Your position in this list.', 'people listed': 'How many people are in this list.',
  'your personal cash': 'Your own money (not the company’s) – use it to buy shares personally.'
};
UI.helpNorm = function (s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); };
UI.helpLookup = function (text) {
  var t = UI.helpNorm(text); if (!t || t.length > 60) return null;
  var tries = [t, t.replace(/\s*\(.*$/, ''), t.replace(/[^a-z0-9/ %.&]/g, '').trim(), t.split(' ').slice(0, 3).join(' '), t.split(' ').slice(0, 2).join(' '), t.split(' ')[0]];
  for (var i = 0; i < tries.length; i++) if (UI.HELP_TERMS[tries[i]]) return UI.HELP_TERMS[tries[i]];
  return null;
};
/** What to explain for the element under the mouse. Returns [title, text] or null. */
UI.helpFor = function (el) {
  var h = el.closest('[data-help]'); if (h) return [h.getAttribute('data-help-title') || '', h.getAttribute('data-help')];
  var a = el.closest('[data-act]');
  if (a) {
    var act = a.getAttribute('data-act'), arg = a.getAttribute('data-arg');
    if (act === 'startBuild' && UI.HELP_BUILD[arg]) return [UAE.FIRM_TYPES[arg].name, UI.HELP_BUILD[arg]];
    if (act === 'info' && arg && UI.HELP_ACT[arg]) return [a.getAttribute('data-tip') || '', UI.HELP_ACT[arg]];
    if (UI.HELP_ACT[act]) return [a.getAttribute('data-tip') || a.textContent.trim().slice(0, 40), UI.HELP_ACT[act]];
  }
  var card = el.closest('.card'); if (card) { var lb = card.querySelector('label'); var t = lb && UI.helpLookup(lb.textContent); if (t) return [lb.textContent, t]; }
  var th = el.closest('th'); if (th) { var t2 = UI.helpLookup(th.textContent); if (t2) return [th.textContent, t2]; }
  var lab = el.closest('label, .tabs button'); if (lab) { var t3 = UI.helpLookup(lab.textContent); if (t3) return [lab.textContent, t3]; }
  var hud = el.closest('.kpi'); if (hud) { var l2 = hud.querySelector('label, .lbl, small, span'); var t4 = l2 && UI.helpLookup(l2.textContent); if (t4) return [l2.textContent, t4]; }
  return null;
};
UI.helpOn = function () { return !(UAE.S && UAE.S.settings && UAE.S.settings.hoverHelp === false); };
(function () {
  if (typeof document === 'undefined' || !document.addEventListener) return;
  var tip = null, timer = null, last = null;
  var hide = function () { clearTimeout(timer); if (tip) tip.style.display = 'none'; last = null; };
  var place = function (x, y) {
    var w = tip.offsetWidth, h = tip.offsetHeight, X = x + 18, Y = y + 18;
    if (X + w > window.innerWidth - 8) X = x - w - 14; if (Y + h > window.innerHeight - 8) Y = y - h - 14;
    tip.style.left = Math.max(6, X) + 'px'; tip.style.top = Math.max(6, Y) + 'px';
  };
  document.addEventListener('mouseover', function (e) {
    if (document.body) document.body.classList.toggle('helpon', UI.helpOn());
    if (!UI.helpOn() || !e.target || !e.target.closest) return;
    var r = UI.helpFor(e.target);
    if (!r) { if (!e.target.closest('#helptip')) hide(); return; }
    if (last && last === r[1]) return;
    last = r[1]; clearTimeout(timer);
    var x = e.clientX, y = e.clientY;
    timer = setTimeout(function () {
      if (!tip) { tip = document.createElement('div'); tip.id = 'helptip'; document.body.appendChild(tip); }
      tip.innerHTML = (r[0] ? '<b>' + UI.esc(String(r[0]).replace(/\s+/g, ' ').trim()) + '</b>' : '') + '<div>' + UI.esc(r[1]) + '</div>';
      tip.style.display = 'block'; place(x, y);
    }, 380);
  });
  document.addEventListener('mousemove', function (e) { if (tip && tip.style.display === 'block') place(e.clientX, e.clientY); });
  document.addEventListener('mousedown', hide); document.addEventListener('keydown', hide);
})();

/* --------------------------------------------------------- the Help guide */
UI.HELP_TOPICS = [
  ['start', '🚀 Getting started', '<ol><li><b>Your goal</b>: grow your company and your personal wealth. Watch <b>Cash</b> and <b>Net profit</b> at the top.</li>' +
    '<li><b>Press B</b> (or 🏗) to build. Start simple: a <b>Shop</b> in a busy district of Dubai selling 3–4 products you can import (phones, perfume, fashion…).</li>' +
    '<li>Press <b>2–3</b> to let time run, <b>Space</b> to pause. Click your shop to see sales, prices and profit.</li>' +
    '<li>Once shops make money, build a <b>Factory</b> that makes what they sell, then press <b>“Supply my stores”</b> – you stop paying importers.</li>' +
    '<li>Keep a cash cushion. If cash runs low, take a loan (💼 Financial Actions).</li></ol>'],
  ['money', '💰 Money basics', '<p><b>Revenue</b> is money in from sales. <b>Costs</b> are salaries, electricity, rent, products you buy, advertising. <b>Profit</b> = revenue − costs.</p><p><b>Cash</b> is what you have now; buildings cost cash up front. A firm can be profitable but still need time to pay back its building cost.</p><p>Hover over any number to see what it means.</p>'],
  ['retail', '🛍 Shops & selling', '<p>Shops sell to the public. Sales depend on <b>price</b>, <b>quality</b>, <b>brand</b> and how busy the street or mall is.</p><ul><li>Price too high → few sales. Too low → little profit.</li><li><b>Supply</b> lower than <b>Demand</b>? Expand the shop or train staff.</li><li>Shops in malls get more customers but pay rent.</li></ul>'],
  ['factory', '🏭 Factories & supply chains', '<p>A factory turns <b>inputs</b> into a product. The factory window shows each raw material, where it comes from and the cost per unit.</p><ul><li>Buy inputs from <b>your own</b> farms/mines/factories (cheapest), other companies, or import.</li><li><b>Supply my stores &amp; factories</b> links your own buyers in one click.</li><li>Example chain: silicon → wafers → chips → AI chips → GPUs.</li></ul>'],
  ['tech', '🧪 R&D, software & technology', '<p><b>Technology</b> (0–100) sets product quality. Raise it with an <b>R&amp;D centre</b> or, for software, the software company itself: press <b>Research next model</b>.</p><p>Software (Operating System, AI Assistant…) costs almost nothing to copy, so margins are high. Devices need OS licences.</p>'],
  ['people', '👔 CEO, CMO, CTO', '<p>Hire people in <b>Persons → Candidates</b>. A <b>CEO</b> can run the company for you; a <b>CMO</b> runs advertising; a <b>CTO</b> keeps research going. Set what they do in <b>Headquarters (H)</b>.</p>'],
  ['stocks', '📈 Shares & the stock market', '<p>Shares are pieces of companies. Buy low, sell high, collect dividends. Own more than 50% of a company and you control it.</p><p>You can also list your own company (IPO) to raise money – 💼 Financial Actions.</p>'],
  ['keys', '⌨ Keys', '<p><b>Click a column title</b> to sort any list (again to reverse) · <b>B</b> build · <b>Shift+click</b> build several · <b>Esc</b> cancel · <b>Q</b> back to the previous screen · <b>I</b> info · <b>H</b> HQ · <b>P</b> products · <b>C</b> CEO · <b>F1</b> help · <b>F4</b> stocks · <b>F6</b> financials · <b>F9</b> save · <b>F10</b> company · <b>0–5</b> speed · <b>Space</b> pause · <b>W</b> whole UAE.</p>']
];
UI.act.help = function (topic) { if (topic) UI.tabState.help = topic; UI.open('Help guide', UI.R.help); };
UI.R = UI.R || {};
UI.R.help = function () {
  var t = UI.tabState.help || 'start', cur = UI.HELP_TOPICS.find(function (x) { return x[0] === t; }) || UI.HELP_TOPICS[0];
  return UI.tabs('help', UI.HELP_TOPICS.map(function (x) { return [x[0], x[1]]; }), cur[0]) + '<div class="box help-body">' + cur[2] + '</div>' +
    '<div class="note">Tip: point the mouse at almost anything – buttons, numbers, column titles – and a short explanation appears. Turn this off in Settings (F9).</div>';
};
UI.act.hoverHelp = function (a, el) { UAE.S.settings.hoverHelp = el.checked; UI.toast(el.checked ? 'Hover help on.' : 'Hover help off.', 'good'); };
