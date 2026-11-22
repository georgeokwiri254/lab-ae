/* ============================================================================
 * UAE CAPITALISM LAB  -  WORLD MARKETS: GLOBAL INDUSTRIES & THEIR LEADERS
 *
 * The UAE goes global: software, chips, AI hardware, devices, robots, EVs, pharma and e-commerce made by your
 * companies compete for WORLD demand against the real world leaders.
 *
 *  size   world market 2026, AED bn / year (approx. real 2025-26 figures converted at 3.6725 AED/USD - EST)
 *  grow   early yearly growth; the market levels off at `cap` x its 2026 size (S-curve)
 *  base   world price per unit in AED (default: the product's world / import price)
 *  leaders [name, country, tech index 2026, index gained per year, share of the world market]
 *          WORLD TECH INDEX: 100 = the world's best in 2026. Leaders keep improving every year, so standing
 *          still means falling behind. Shares are approximate (EST); the rest of the market is "others".
 *  margin real-world gross / operating margin of the leaders, for reference (shown in the game)
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* ---- new products: pharma chain + e-commerce platform technology ---------- */
UAE.PRODUCTS.push(
  { id:'pchem',    name:'Pharma Chemicals (kg)',          cls:'Chemicals',          kind:'raw',   unit:'kg',   world:120,  imp:130,  t:0.001,  src:'import', qImp:60 },
  { id:'api',      name:'Active Pharma Ingredient (kg)',  cls:'Pharma Ingredients', kind:'inter', unit:'kg',   world:950,  imp:1000, t:0.001,  src:'factory', qImp:65,
    rec:{ in:[['pchem',3]], cap:600, lab:160 } },
  { id:'generic',  name:'Generic Prescription Drugs (pack)', cls:'Drugs',          kind:'consumer', unit:'pack', ref:60, imp:34, t:0.0002, src:'factory', perCap:6, tour:0.8, el:-0.25, cap:300, qImp:70,
    rec:{ in:[['api',0.01],['polymer',0.00002]], cap:20000, lab:12 } },
  { id:'rxdrug',   name:'Patented Medicine (course)',     cls:'Drugs',              kind:'consumer', unit:'course', ref:900, imp:640, t:0.0003, src:'factory', perCap:0.8, tour:0.5, el:-0.2, cap:60, qImp:80,
    rec:{ in:[['api',0.03],['polymer',0.00003]], cap:4000, lab:60 } },
  { id:'biologic', name:'Biologic / GLP-1 Therapy (month)', cls:'Drugs',            kind:'consumer', unit:'month', ref:2500, imp:1800, t:0.0005, src:'factory', perCap:0.15, tour:0.3, el:-0.2, cap:20, qImp:82, grow:0.12,
    rec:{ in:[['api',0.05],['polymer',0.00005]], cap:1500, lab:300 } },
  { id:'ecom',     name:'E-commerce Platform Technology', cls:'E-commerce',         kind:'platform', unit:'platform', ref:0, imp:0, world:0, t:0, src:'research', qImp:60 }
);
UAE.PRODUCTS.forEach(function (p) { UAE.P[p.id] = p; });
// OTC medicine can now be made in the UAE (was import only)
if (UAE.P.medicine && !UAE.P.medicine.rec) { UAE.P.medicine.src = 'factory'; UAE.P.medicine.rec = { in: [['api', 0.004], ['polymer', 0.00002]], cap: 25000, lab: 6 }; }

/* ---- world markets --------------------------------------------------------- */
UAE.WORLD_MKT = {
  // software (digital: no factory capacity limit - grows with reach, brand and tech)
  os:       { size: 220,  grow: 0.04, cap: 2,   margin: '~70% gross · ~45% operating (Microsoft)', leaders: [['Microsoft Windows', 'US', 98, 1.0, 0.70], ['Apple macOS / iOS', 'US', 100, 1.0, 0.18], ['Google Android / ChromeOS', 'US', 96, 1.2, 0.08]] },
  office:   { size: 180,  grow: 0.06, cap: 2.5, margin: '~88% gross (Microsoft 365)', leaders: [['Microsoft 365', 'US', 100, 1.2, 0.62], ['Google Workspace', 'US', 95, 1.4, 0.22], ['Zoho', 'IN', 82, 1.5, 0.04]] },
  security: { size: 370,  grow: 0.12, cap: 4,   margin: '~75-80% gross (Palo Alto, CrowdStrike)', leaders: [['Microsoft Security', 'US', 94, 1.6, 0.18], ['Palo Alto Networks', 'US', 98, 1.8, 0.10], ['CrowdStrike', 'US', 100, 2.0, 0.06], ['Fortinet', 'US', 92, 1.5, 0.07], ['Check Point', 'IL', 90, 1.2, 0.04]] },
  game:     { size: 700,  grow: 0.07, cap: 2.5, margin: '~25-35% operating', leaders: [['Tencent Games', 'CN', 98, 1.5, 0.17], ['Sony PlayStation', 'JP', 100, 1.5, 0.14], ['Microsoft Gaming', 'US', 97, 1.5, 0.12], ['Nintendo', 'JP', 96, 1.2, 0.07], ['NetEase', 'CN', 90, 1.5, 0.04]] },
  chipip:   { size: 75,   grow: 0.10, cap: 4,   margin: '~80-90% gross (Arm, Synopsys)', leaders: [['Synopsys', 'US', 100, 2.0, 0.32], ['Cadence', 'US', 99, 2.0, 0.30], ['Arm', 'GB', 98, 2.2, 0.18]] },
  design:   { size: 55,   grow: 0.06, cap: 2.5, margin: '~88% gross (Adobe)', leaders: [['Adobe', 'US', 100, 1.5, 0.60], ['Canva', 'AU', 90, 2.0, 0.12], ['Autodesk', 'US', 92, 1.2, 0.10]] },
  video:    { size: 20,   grow: 0.05, cap: 2,   margin: '~85% gross', leaders: [['Adobe Premiere', 'US', 100, 1.3, 0.45], ['Apple Final Cut', 'US', 96, 1.0, 0.20], ['Blackmagic DaVinci', 'AU', 94, 1.5, 0.15]] },
  audio:    { size: 8,    grow: 0.04, cap: 2,   margin: '~80% gross', leaders: [['Avid Pro Tools', 'US', 96, 1.0, 0.25], ['Ableton', 'DE', 98, 1.2, 0.20], ['Apple Logic', 'US', 95, 1.0, 0.20]] },
  utility:  { size: 30,   grow: 0.03, cap: 1.6, margin: '~80% gross', leaders: [['Microsoft', 'US', 95, 0.8, 0.30], ['Gen Digital', 'US', 92, 0.8, 0.15]] },
  // AI (subscriptions run in engine/aistack.js - listed here for the world ranking)
  ai:       { size: 0, subs: true, margin: 'subscriptions: ~55-70% gross', leaders: [['OpenAI ChatGPT', 'US', 100, 4.0, 0.55], ['Google Gemini', 'US', 98, 4.0, 0.18], ['Anthropic Claude', 'US', 99, 4.0, 0.08], ['Meta AI', 'US', 92, 3.5, 0.08], ['DeepSeek', 'CN', 94, 3.5, 0.05]] },
  llm:      { size: 0, subs: true, margin: 'API: ~50-60% gross', leaders: [['OpenAI', 'US', 100, 4.0, 0.40], ['Anthropic', 'US', 100, 4.0, 0.25], ['Google DeepMind', 'US', 99, 4.0, 0.20], ['DeepSeek', 'CN', 94, 3.5, 0.05], ['Mistral', 'FR', 90, 3.0, 0.03]] },
  // semiconductors & AI hardware (sold from factory stock: capacity matters)
  aichip:   { size: 735,  grow: 0.30, cap: 4,   margin: '~75% gross · ~60% operating (Nvidia)', leaders: [['Nvidia', 'US', 100, 3.0, 0.80], ['AMD', 'US', 90, 3.0, 0.07], ['Google TPU', 'US', 94, 3.0, 0.06], ['Huawei Ascend', 'CN', 80, 3.0, 0.03]] },
  chips:    { size: 850,  grow: 0.07, cap: 2.5, margin: '~59% gross · ~49% operating (TSMC)', leaders: [['TSMC', 'TW', 100, 2.0, 0.55], ['Samsung Foundry', 'KR', 92, 2.0, 0.12], ['Intel', 'US', 88, 1.8, 0.10], ['SMIC', 'CN', 80, 2.0, 0.06], ['GlobalFoundries', 'US', 82, 1.2, 0.05]] },
  cpu:      { size: 370,  grow: 0.05, cap: 2,   margin: '~40-55% gross (Intel / AMD)', leaders: [['Intel', 'US', 92, 1.5, 0.55], ['AMD', 'US', 98, 2.0, 0.28], ['Apple Silicon', 'US', 100, 2.0, 0.10], ['Qualcomm', 'US', 94, 2.0, 0.04]] },
  ram:      { size: 620,  grow: 0.12, cap: 3,   margin: '~35-60% gross (cyclical)', leaders: [['SK hynix', 'KR', 100, 2.5, 0.35], ['Samsung', 'KR', 98, 2.2, 0.38], ['Micron', 'US', 95, 2.2, 0.22]] },
  gpu:      { size: 180,  grow: 0.08, cap: 2.5, margin: '~60% gross', leaders: [['Nvidia GeForce', 'US', 100, 2.5, 0.85], ['AMD Radeon', 'US', 90, 2.2, 0.12]] },
  server:   { size: 920,  grow: 0.25, cap: 4,   margin: '~10-15% gross (assembly)', leaders: [['Dell', 'US', 96, 2.0, 0.18], ['Foxconn / Quanta', 'TW', 94, 2.0, 0.35], ['Supermicro', 'US', 95, 2.0, 0.10], ['HPE', 'US', 92, 1.8, 0.10]] },
  wafer:    { size: 55,   grow: 0.06, cap: 2.5, margin: '~30-35% gross', leaders: [['Shin-Etsu', 'JP', 100, 1.0, 0.30], ['SUMCO', 'JP', 98, 1.0, 0.25], ['GlobalWafers', 'TW', 94, 1.0, 0.15], ['Siltronic', 'DE', 93, 1.0, 0.12]] },
  // devices, robots, EVs
  phone:    { size: 1800, grow: 0.02, cap: 1.4, margin: '~45% gross (Apple) · ~10% (Android makers)', leaders: [['Apple iPhone', 'US', 100, 1.5, 0.20], ['Samsung Galaxy', 'KR', 98, 1.5, 0.19], ['Xiaomi', 'CN', 92, 1.8, 0.13], ['Transsion', 'CN', 80, 1.5, 0.09], ['Oppo / Vivo', 'CN', 90, 1.5, 0.16]] },
  laptop:   { size: 740,  grow: 0.02, cap: 1.4, margin: '~15-40% gross', leaders: [['Lenovo', 'CN', 94, 1.2, 0.24], ['HP', 'US', 92, 1.0, 0.21], ['Dell', 'US', 92, 1.0, 0.16], ['Apple MacBook', 'US', 100, 1.5, 0.09]] },
  ev:       { size: 2600, grow: 0.15, cap: 4,   margin: '~15-20% gross (Tesla, BYD)', leaders: [['BYD', 'CN', 96, 2.5, 0.22], ['Tesla', 'US', 100, 2.5, 0.13], ['Geely', 'CN', 92, 2.5, 0.08], ['Volkswagen', 'DE', 88, 2.0, 0.06], ['Waymo (autonomy)', 'US', 100, 3.0, 0.01]] },
  battery:  { size: 550,  grow: 0.20, cap: 6,   margin: '~20-25% gross (CATL)', leaders: [['CATL', 'CN', 100, 2.5, 0.38], ['BYD', 'CN', 96, 2.5, 0.17], ['LG Energy', 'KR', 92, 2.0, 0.11], ['Panasonic', 'JP', 90, 1.8, 0.05]] },
  robot:    { size: 18,   grow: 0.60, cap: 60,  margin: 'early market', leaders: [['Unitree', 'CN', 96, 4.0, 0.30], ['Tesla Optimus', 'US', 94, 4.5, 0.10], ['Figure AI', 'US', 98, 4.5, 0.08], ['UBTech', 'CN', 90, 4.0, 0.12], ['Boston Dynamics', 'US', 100, 3.5, 0.06]] },
  drone:    { size: 37,   grow: 0.12, cap: 4,   margin: '~40% gross (DJI)', leaders: [['DJI', 'CN', 100, 2.0, 0.70], ['Autel', 'CN', 88, 2.0, 0.06], ['Skydio', 'US', 92, 2.2, 0.03]] },
  vr:       { size: 18,   grow: 0.30, cap: 15,  margin: 'loss-making for most', leaders: [['Meta Quest', 'US', 98, 3.0, 0.70], ['Apple Vision', 'US', 100, 3.0, 0.08], ['Sony PS VR', 'JP', 90, 2.0, 0.05]] },
  arglasses:{ size: 7,    grow: 0.40, cap: 25,  margin: 'early market', leaders: [['Meta Ray-Ban', 'US', 98, 3.5, 0.60], ['Xreal', 'CN', 90, 3.0, 0.10], ['Apple', 'US', 100, 3.5, 0.02]] },
  sensor:   { size: 25,   grow: 0.25, cap: 8,   margin: '~30-40% gross', leaders: [['Hesai', 'CN', 98, 3.0, 0.33], ['RoboSense', 'CN', 94, 3.0, 0.22], ['Luminar', 'US', 90, 2.5, 0.05], ['Valeo', 'FR', 90, 2.0, 0.08]] },
  motor:    { size: 110,  grow: 0.10, cap: 3,   margin: '~20-30% gross', leaders: [['Nidec', 'JP', 98, 1.5, 0.18], ['Bosch', 'DE', 96, 1.5, 0.12], ['BYD FinDreams', 'CN', 94, 2.0, 0.15]] },
  // pharma
  medicine: { size: 620,  grow: 0.04, cap: 2,   margin: '~60-70% gross (OTC brands)', leaders: [['Kenvue', 'US', 96, 1.0, 0.09], ['Haleon', 'GB', 98, 1.0, 0.08], ['Bayer Consumer', 'DE', 95, 1.0, 0.06], ['Sanofi Opella', 'FR', 94, 1.0, 0.05]] },
  generic:  { size: 1650, grow: 0.05, cap: 2,   margin: '~40-55% gross (Teva, Sun)', leaders: [['Teva', 'IL', 96, 1.0, 0.07], ['Sandoz', 'CH', 98, 1.0, 0.06], ['Viatris', 'US', 94, 1.0, 0.05], ['Sun Pharma', 'IN', 95, 1.2, 0.04], ['Dr. Reddy\'s', 'IN', 93, 1.2, 0.02]] },
  rxdrug:   { size: 4000, grow: 0.06, cap: 2.5, margin: '~75-80% gross · ~25-30% operating (big pharma)', leaders: [['Johnson & Johnson', 'US', 97, 2.0, 0.06], ['Roche', 'CH', 99, 2.0, 0.06], ['Merck & Co', 'US', 98, 2.0, 0.05], ['Pfizer', 'US', 96, 2.0, 0.05], ['AstraZeneca', 'GB', 98, 2.2, 0.05], ['AbbVie', 'US', 97, 2.0, 0.05]] },
  biologic: { size: 1800, grow: 0.12, cap: 4,   margin: '~80% gross (Eli Lilly, Novo Nordisk)', leaders: [['Eli Lilly', 'US', 100, 3.0, 0.16], ['Novo Nordisk', 'DK', 99, 2.8, 0.13], ['Roche / Genentech', 'CH', 98, 2.5, 0.10], ['Amgen', 'US', 95, 2.2, 0.07], ['Regeneron', 'US', 96, 2.5, 0.05]] },
  // e-commerce: marketplace revenue (take-rate + ads + fulfilment), not GMV
  ecom:     { size: 2900, grow: 0.09, cap: 2.5, ecom: true, margin: '~5-10% operating retail, ads/marketplace ~25-40% (Amazon, Alibaba)', leaders: [['Amazon', 'US', 100, 2.0, 0.38], ['Alibaba', 'CN', 96, 1.8, 0.20], ['PDD / Temu', 'CN', 94, 2.5, 0.12], ['JD.com', 'CN', 93, 1.5, 0.08], ['Shopee (Sea)', 'SG', 90, 2.0, 0.05], ['MercadoLibre', 'AR', 92, 2.0, 0.04], ['noon', 'AE', 80, 2.0, 0.005]] }
};
UAE.NATION_FLAG = { US: '🇺🇸', CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TW: '🇹🇼', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷', CH: '🇨🇭', IL: '🇮🇱', IN: '🇮🇳', DK: '🇩🇰', AU: '🇦🇺', SG: '🇸🇬', AR: '🇦🇷', AE: '🇦🇪', NL: '🇳🇱' };

/* ============================================================================
 * MORE GLOBAL INDUSTRIES the real UAE is not (yet) part of: payment networks, chipmaking equipment, financial data &
 * ratings, medical devices & surgical robots, luxury goods, jet engines, online advertising. (Chip fabs = 'chips'.)
 * Raw materials added: titanium, nickel superalloy; new parts: precision optics. Prices & recipes EST.
 * ==========================================================================*/
UAE.PRODUCTS.push(
  { id:'titanium',  name:'Titanium Alloy (kg)',            cls:'Aerospace Materials', kind:'raw',   unit:'kg', world:45,   imp:50,   t:0.001, src:'import', qImp:65 },
  { id:'nickel',    name:'Nickel Superalloy (kg)',         cls:'Aerospace Materials', kind:'raw',   unit:'kg', world:95,   imp:100,  t:0.001, src:'import', qImp:65 },
  { id:'optics',    name:'Precision Optics Module',        cls:'Optics',              kind:'inter', unit:'pc', world:60000, imp:65000, t:0.01, src:'factory', qImp:70,
    rec:{ in:[['glass',0.02],['rareearth',3]], cap:20, lab:25000 } },
  { id:'chiptool',  name:'Chipmaking Tool (litho / etch)', cls:'Chip Equipment',      kind:'inter', unit:'tool', world:18e6, imp:19e6, t:20, src:'factory', qImp:75, b2b:0.002,
    rec:{ in:[['optics',30],['sensor',40],['motor',60],['chips',800],['aluminium',2]], cap:0.4, lab:7.5e6 } },
  { id:'meddevice', name:'Medical Imaging & Monitoring Device', cls:'Medical Devices', kind:'inter', unit:'pc', world:180000, imp:190000, t:0.5, src:'factory', qImp:75, b2b:0.4,
    rec:{ in:[['chips',60],['sensor',8],['optics',0.5],['aluminium',0.2]], cap:15, lab:20000 } },
  { id:'surgrobot', name:'Surgical Robot System',          cls:'Medical Devices',     kind:'inter', unit:'system', world:7.5e6, imp:8e6, t:1, src:'factory', qImp:80, b2b:0.004,
    rec:{ in:[['optics',6],['sensor',30],['motor',40],['chips',600],['titanium',150]], cap:0.3, lab:1.6e6 } },
  { id:'luxbag',    name:'Luxury Leather Handbag',         cls:'Luxury Goods',        kind:'consumer', unit:'pc', ref:28000, imp:9500, t:0.002, src:'factory', perCap:0.006, tour:5, el:-0.6, cap:2, qImp:85,
    rec:{ in:[['leather',1.2],['gold',2]], cap:40, lab:1800 } },
  { id:'jetengine', name:'Jet Engine (narrow-body)',       cls:'Aerospace',           kind:'inter', unit:'engine', world:55e6, imp:58e6, t:3, src:'factory', qImp:80, b2b:0.0004,
    rec:{ in:[['nickel',2500],['titanium',1200],['sensor',60],['chips',300],['motor',10]], cap:0.08, lab:3.4e7 } },
  { id:'paynet',    name:'Card Payment Network (1k transactions)', cls:'Payments',    kind:'software', unit:'1k txns', ref:45, imp:30, t:0.000001, src:'software', perCap:0, tour:0, el:-0.3, cap:5000, qImp:70, b2b:900, sw:'Payment Network' },
  { id:'findata',   name:'Financial Data & Ratings (terminal-year)', cls:'Financial Data', kind:'software', unit:'seat-year', ref:110000, imp:90000, t:0.000001, src:'software', perCap:0, tour:0, el:-0.3, cap:5, qImp:75, b2b:0.15, sw:'Financial Data & Ratings' },
  { id:'adplat',    name:'Online Ad Platform (1k impressions)', cls:'Online Advertising', kind:'software', unit:'1k impr.', ref:28, imp:20, t:0.000001, src:'software', perCap:0, tour:0, el:-0.8, cap:20000, qImp:70, b2b:3000, sw:'Ad Platform' }
);
UAE.PRODUCTS.forEach(function (p) { UAE.P[p.id] = p; });
// luxury watches can now be made in the UAE (was import only)
if (UAE.P.watch && !UAE.P.watch.rec) { UAE.P.watch.src = 'factory'; UAE.P.watch.rec = { in: [['gold', 8], ['nickel', 0.15]], cap: 15, lab: 3000 }; }
if (UAE.SW_PID) { UAE.SW_PID['Payment Network'] = 'paynet'; UAE.SW_PID['Financial Data & Ratings'] = 'findata'; UAE.SW_PID['Ad Platform'] = 'adplat'; }

(function (W) {
  W.paynet    = { size: 400,  grow: 0.08, cap: 2.5, margin: '~55-67% operating (Visa, Mastercard)', leaders: [['Visa', 'US', 100, 1.5, 0.50], ['Mastercard', 'US', 99, 1.5, 0.30], ['UnionPay', 'CN', 85, 1.5, 0.10], ['American Express', 'US', 92, 1.2, 0.06]] };
  W.findata   = { size: 220,  grow: 0.07, cap: 2.5, margin: '~40-50% operating (S&P Global, Moody’s, MSCI)', leaders: [['Bloomberg', 'US', 100, 1.0, 0.30], ['S&P Global', 'US', 99, 1.0, 0.22], ['LSEG', 'GB', 96, 1.0, 0.17], ['Moody’s', 'US', 97, 1.0, 0.12], ['MSCI', 'US', 96, 1.0, 0.05]] };
  W.adplat    = { size: 2750, grow: 0.10, cap: 3,   margin: '~35-40% operating (Google, Meta)', leaders: [['Google', 'US', 100, 2.0, 0.38], ['Meta', 'US', 99, 2.0, 0.22], ['ByteDance / TikTok', 'CN', 97, 2.5, 0.15], ['Amazon Ads', 'US', 95, 2.2, 0.08]] };
  W.chiptool  = { size: 400,  grow: 0.09, cap: 3,   margin: '~50% gross · ~30% operating (ASML)', leaders: [['ASML', 'NL', 100, 2.0, 0.25], ['Applied Materials', 'US', 97, 1.8, 0.20], ['Lam Research', 'US', 96, 1.8, 0.15], ['Tokyo Electron', 'JP', 95, 1.8, 0.14], ['KLA', 'US', 97, 1.8, 0.08]] };
  W.meddevice = { size: 1800, grow: 0.06, cap: 2.5, margin: '~60-65% gross (Medtronic, Siemens Healthineers)', leaders: [['Medtronic', 'US', 96, 1.2, 0.07], ['J&J MedTech', 'US', 95, 1.2, 0.06], ['Siemens Healthineers', 'DE', 97, 1.3, 0.05], ['GE HealthCare', 'US', 95, 1.2, 0.04], ['Abbott', 'US', 96, 1.3, 0.04]] };
  W.surgrobot = { size: 44,   grow: 0.15, cap: 6,   margin: '~66% gross · ~28% operating (Intuitive Surgical)', leaders: [['Intuitive Surgical', 'US', 100, 2.0, 0.75], ['Stryker Mako', 'US', 93, 2.0, 0.10], ['Medtronic Hugo', 'US', 88, 2.5, 0.05]] };
  W.luxbag    = { size: 330,  grow: 0.05, cap: 2,   brandPow: 3, margin: '~70% gross · ~40% operating (Hermès)', leaders: [['Louis Vuitton', 'FR', 99, 0.5, 0.25], ['Hermès', 'FR', 100, 0.5, 0.12], ['Chanel', 'FR', 98, 0.5, 0.12], ['Gucci', 'IT', 94, 0.5, 0.08], ['Prada', 'IT', 95, 0.5, 0.05]] };
  W.watch     = { size: 220,  grow: 0.04, cap: 1.8, brandPow: 3, margin: '~60%+ gross (Rolex, Richemont)', leaders: [['Rolex', 'CH', 100, 0.3, 0.30], ['Cartier (Richemont)', 'CH', 97, 0.3, 0.15], ['Omega (Swatch)', 'CH', 95, 0.3, 0.12], ['Audemars Piguet', 'CH', 99, 0.3, 0.06], ['Patek Philippe', 'CH', 100, 0.2, 0.05]] };
  W.jetengine = { size: 370,  grow: 0.05, cap: 2.2, margin: '~20% operating (GE Aerospace) - engines near cost, profit on service', leaders: [['CFM (GE / Safran)', 'US', 100, 1.0, 0.55], ['Rolls-Royce', 'GB', 97, 1.0, 0.20], ['Pratt & Whitney', 'US', 96, 1.0, 0.20]] };
})(UAE.WORLD_MKT);
UAE.NATION_FLAG.IT = '🇮🇹';

/* ============================================================================
 * SPACE INDUSTRY (added 2026-11-22): reusable rockets, satellite launches, broadband satellites,
 * satellite internet and - the future upside - orbital data centres.
 * Chain:  Reusable Rocket Booster (factory) -> Satellite Launch to Orbit (launch site: rockets are reused ~12x,
 *         so each launch uses 0.08 of a booster + propellant + a new upper stage in the running cost)
 *         -> Broadband Satellite (needs 1/25 of a launch: one rocket carries ~25 satellites)
 *         -> Satellite Internet (subscriber-year: terminal + a share of the constellation)
 *         -> Orbital Compute Module (1 MW of AI servers in orbit, solar-powered: needs launches + AI servers)
 * Revenue comes from selling launches to the world's satellite operators, satellites, internet service and,
 * later, orbital compute. Orbital data centres are a tiny market in 2026 that grows very fast: R&D labs lose
 * money for years, the payoff comes when the market takes off. All prices, recipes and leader figures EST.
 * ==========================================================================*/
UAE.PRODUCTS.push(
  { id:'rocket',    name:'Reusable Rocket Booster',          cls:'Space Launch',    kind:'inter', unit:'booster', world:1.3e8, imp:1.45e8, t:25, src:'factory', qImp:75,
    rec:{ in:[['nickel',9000],['titanium',3000],['aluminium',25],['sensor',300],['chips',4000],['motor',40],['optics',10]], cap:0.02, lab:6.5e7 } },
  { id:'launch',    name:'Satellite Launch to Orbit',        cls:'Space Launch',    kind:'inter', unit:'launch', world:2.5e8, imp:2.6e8, t:0.000001, src:'factory', qImp:75,
    rec:{ in:[['rocket',0.08],['jetfuel',450]], cap:0.06, lab:3.2e7 } },
  { id:'satellite', name:'Broadband Satellite (LEO)',        cls:'Spacecraft',      kind:'inter', unit:'satellite', world:3.6e6, imp:3.9e6, t:0.8, src:'factory', qImp:70,
    rec:{ in:[['launch',0.04],['chips',600],['sensor',6],['optics',2],['battery',40],['aluminium',0.3]], cap:2, lab:7e5 } },
  { id:'satnet',    name:'Satellite Internet (subscriber-year)', cls:'Space Services', kind:'inter', unit:'sub-year', world:4400, imp:4800, t:0.000001, src:'factory', qImp:70, b2b:20,
    rec:{ in:[['satellite',0.0004],['chips',3],['aluminium',0.002]], cap:600, lab:300 } },
  { id:'orbitdc',   name:'Orbital Data Centre Module (1 MW)', cls:'Orbital Compute', kind:'inter', unit:'MW module', world:6e7, imp:6.5e7, t:0.000001, src:'factory', qImp:75,
    rec:{ in:[['launch',0.1],['server',125],['battery',2000],['optics',10],['satellite',2]], cap:0.05, lab:8e6 } }
);
UAE.PRODUCTS.forEach(function (p) { UAE.P[p.id] = p; });
(function (W) {
  W.launch    = { size: 55,  grow: 0.12, cap: 4,   margin: '~50%+ on reused Falcon 9 (price ~$70m vs ~$25m internal cost, EST)', leaders: [['SpaceX (Falcon 9 / Starship)', 'US', 100, 3.0, 0.65], ['China CASC (Long March)', 'CN', 86, 2.5, 0.12], ['Blue Origin (New Glenn)', 'US', 90, 3.0, 0.03], ['Rocket Lab', 'US', 88, 2.5, 0.03], ['Arianespace', 'FR', 82, 1.5, 0.04], ['ULA (Vulcan)', 'US', 84, 1.2, 0.03]] };
  W.satellite = { size: 75,  grow: 0.10, cap: 3,   margin: '~10-20% operating (satellite makers)', leaders: [['SpaceX Starlink', 'US', 100, 2.5, 0.45], ['China CAST', 'CN', 88, 2.5, 0.10], ['Airbus Defence & Space', 'FR', 92, 1.5, 0.08], ['Thales Alenia Space', 'FR', 90, 1.5, 0.07], ['Lanteris (ex-Maxar)', 'US', 88, 1.5, 0.04]] };
  W.satnet    = { size: 75,  grow: 0.35, cap: 8,   margin: '~60% gross once the constellation is built (Starlink, EST)', leaders: [['SpaceX Starlink', 'US', 100, 3.0, 0.70], ['Amazon Leo (Kuiper)', 'US', 88, 3.5, 0.02], ['Eutelsat OneWeb', 'FR', 80, 2.0, 0.04], ['Viasat', 'US', 78, 1.0, 0.06], ['SES', 'LU', 80, 1.0, 0.05]] };
  W.orbitdc   = { size: 0.4, grow: 0.90, cap: 300, margin: 'pre-revenue: R&D and demonstration satellites (EST)', leaders: [['Starcloud', 'US', 72, 6.0, 0.30], ['SpaceX', 'US', 74, 6.5, 0.20], ['Google Project Suncatcher', 'US', 66, 6.0, 0.10], ['ADA Space (Three-Body Computing)', 'CN', 68, 6.0, 0.20], ['Axiom Space', 'US', 60, 5.0, 0.05]] };
})(UAE.WORLD_MKT);
UAE.NATION_FLAG.LU = '🇱🇺'; UAE.NATION_FLAG.KE = '🇰🇪';
