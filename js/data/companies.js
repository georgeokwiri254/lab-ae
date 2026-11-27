/* ============================================================================
 * UAE CAPITALISM LAB  -  COMPANY SEED
 * ----------------------------------------------------------------------------
 * Real UAE companies from uae_companies_and_stocks_seed.csv (+ a few listed
 * companies of the northern emirates so every emirate has a corporate base).
 *
 * Columns (per row):
 *   t    ticker (blank = not tradable)        x   exchange DFM | ADX | ''
 *   st   LISTED | UNLISTED | DELISTED          hq  home city id
 *   sec  sector key (drives AI behaviour, valuation multiples)
 *   rev  revenue / total income AED bn / year  ni  net profit AED bn / year
 *   fin  provenance of rev/ni                  px  share price AED
 *   pxs  provenance of price                   sh  shares outstanding (bn, EST)
 *   own  strategic holders [[holder, %]] (EST, approximate, not tradable float)
 *   sites  flagship physical assets at REAL locations (approximate to the
 *          district - "rep" = representative point, not a surveyed address)
 *
 * Prices marked REAL come from a market report dated ~18-Nov-2026 (FXStreet);
 * everything else is EST - refresh against dfm.ae / adx.ae before relying on it.
 * Financials marked REAL come from FY2025 filings cited in master_v3 §10/F3.3.
 * The legacy revenue of these groups is simulated as a "core business" block;
 * firms you see on the map are the playable part that the AI can expand.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.HOLDERS = {
  ICD:'Investment Corporation of Dubai', GOVDU:'Government of Dubai', DUBAIHOLD:'Dubai Holding',
  ADNOC:'ADNOC (state parent)', MUBADALA:'Mubadala', ADQ:'ADQ', EIA:'Emirates Investment Authority',
  IHC:'International Holding Co.', ROYAL:'Royal Group (private)', G42:'G42', DH:'Delivery Hero SE',
  BOREALIS:'Borealis AG', ALPHA:'Alpha Dhabi', GOVSH:'Government of Sharjah', GOVRK:'Government of RAK',
  GOVFU:'Government of Fujairah', OCI:'OCI Global', FOUND:'Founding shareholders', GOVAD:'Government of Abu Dhabi'
};

UAE.SEED_COMPANIES = [
  // ------------------------------- DFM -----------------------------------
  { id:'EMAAR', name:'Emaar Properties', t:'EMAAR', x:'DFM', st:'LISTED', hq:'DXB', sec:'property', rev:49.60, ni:22.0, fin:'REAL rev/EBITDA FY2025; NI EST from PBT 25.7', px:14.80, pxs:'EST', sh:8.84, own:[['ICD',22]],
    sites:[ {type:'mall', name:'The Dubai Mall', c:[25.1985,55.2796], size:10},
            {type:'commercial', name:'Burj Khalifa (offices & residences)', c:[25.1972,55.2744], size:10, h:828},
            {type:'hotel', name:'Address Downtown', c:[25.1934,55.2795], size:4},
            {type:'apartment', name:'Dubai Creek Harbour Residences', c:[25.2015,55.3480], size:6},
            {type:'mall', name:'Dubai Hills Mall', c:[25.1020,55.2400], size:6} ] },
  { id:'EMAARDEV', name:'Emaar Development', t:'EMAARDEV', x:'DFM', st:'LISTED', hq:'DXB', sec:'property', rev:18.0, ni:7.5, fin:'EST', px:14.0, pxs:'EST', sh:4.0, own:[['EMAAR',80]],
    sites:[ {type:'apartment', name:'Dubai Hills Estate Residences', c:[25.1060,55.2500], size:6} ] },
  { id:'DEWA', name:'Dubai Electricity & Water Authority', t:'DEWA', x:'DFM', st:'LISTED', hq:'DXB', sec:'utility', rev:32.84, ni:9.09, fin:'REAL FY2025 prelim', px:2.82, pxs:'REAL ~18-Nov-2026', sh:50.0, own:[['GOVDU',82]],
    sites:[ {type:'solar', name:'MBR Al Maktoum Solar Park', c:[24.7635,55.3699], size:10} ] },
  { id:'ENBD', name:'Emirates NBD', t:'ENBD', x:'DFM', st:'LISTED', hq:'DXB', sec:'bank', rev:49.30, ni:25.5, fin:'REAL total income FY2025; NI EST from PBT 29.8', px:36.18, pxs:'REAL ~18-Nov-2026', sh:6.317, own:[['ICD',56]],
    sites:[ {type:'bankhq', name:'Emirates NBD Head Office (Deira, rep)', c:[25.2648,55.3115], size:6},
            {type:'bankbranch', name:'ENBD Dubai Marina', c:[25.0790,55.1420], size:1},
            {type:'bankbranch', name:'ENBD Mall of the Emirates', c:[25.1175,55.2000], size:1} ] },
  { id:'SALIK', name:'Salik', t:'SALIK', x:'DFM', st:'LISTED', hq:'DXB', sec:'transport', rev:3.097, ni:1.553, fin:'REAL FY2025', px:6.10, pxs:'EST', sh:7.5, own:[['GOVDU',75]], sites:[] },
  { id:'PARKIN', name:'Parkin', t:'PARKIN', x:'DFM', st:'LISTED', hq:'DXB', sec:'transport', rev:1.326, ni:0.6255, fin:'REAL FY2025', px:6.40, pxs:'EST', sh:3.0, own:[['GOVDU',75]], sites:[] },
  { id:'DTC', name:'Dubai Taxi Company', t:'DTC', x:'DFM', st:'LISTED', hq:'DXB', sec:'transport', rev:2.474, ni:0.356, fin:'REAL FY2025', px:2.60, pxs:'EST', sh:2.5, own:[['GOVDU',75]],
    sites:[ {type:'logistics', name:'DTC Fleet Depot (Al Quoz, rep)', c:[25.1350,55.2300], size:3} ] },
  { id:'TECOM', name:'TECOM Group', t:'TECOM', x:'DFM', st:'LISTED', hq:'DXB', sec:'property', rev:2.858, ni:1.478, fin:'REAL FY2025 recurring', px:3.30, pxs:'EST', sh:5.0, own:[['DUBAIHOLD',85]],
    sites:[ {type:'commercial', name:'Dubai Internet City offices', c:[25.0955,55.1595], size:6},
            {type:'commercial', name:'Dubai Media City offices', c:[25.0965,55.1530], size:4} ] },
  { id:'TALABAT', name:'Talabat Holding', t:'TALABAT', x:'DFM', st:'LISTED', hq:'DXB', sec:'internet', rev:11.0, ni:1.8, fin:'EST', px:1.195, pxs:'REAL ~18-Nov-2026', sh:23.29, own:[['DH',80]],
    sites:[ {type:'internet', name:'talabat UAE HQ (rep)', c:[25.0970,55.1640], size:4, model:'delivery'} ] },
  { id:'DU', name:'Emirates Integrated Telecom (du)', t:'DU', x:'DFM', st:'LISTED', hq:'DXB', sec:'telecom', rev:15.5, ni:2.6, fin:'EST', px:12.90, pxs:'REAL ~18-Nov-2026', sh:4.53, own:[['EIA',50],['ICD',20],['MUBADALA',10]],
    sites:[ {type:'telecom', name:'du HQ Dubai Hills/Media City (rep)', c:[25.0935,55.1660], size:6} ] },
  { id:'DFMX', name:'Dubai Financial Market PJSC', t:'DFM', x:'DFM', st:'LISTED', hq:'DXB', sec:'finance', rev:1.55, ni:0.969, fin:'REAL NI FY2025; rev EST', px:1.55, pxs:'EST', sh:8.0, own:[['ICD',80]], sites:[] },
  { id:'AIRARABIA', name:'Air Arabia', t:'AIRARABIA', x:'DFM', st:'LISTED', hq:'SHJ', sec:'aviation', rev:7.0, ni:1.6, fin:'EST', px:3.90, pxs:'EST', sh:4.67, own:[['GOVSH',20]],
    sites:[ {type:'hq', name:'Air Arabia HQ, Sharjah Airport', c:[25.3286,55.5172], size:3} ] },
  { id:'DIB', name:'Dubai Islamic Bank', t:'DIB', x:'DFM', st:'LISTED', hq:'DXB', sec:'bank', rev:13.0, ni:7.5, fin:'EST', px:7.80, pxs:'REAL ~18-Nov-2026', sh:7.24, own:[['ICD',28]],
    sites:[ {type:'bankhq', name:'DIB Head Office (Deira, rep)', c:[25.2600,55.3180], size:5} ] },
  { id:'SPINNEYS', name:'Spinneys 1961 Holding', t:'SPINNEYS', x:'DFM', st:'LISTED', hq:'DXB', sec:'retail', rev:3.6, ni:0.25, fin:'EST', px:1.55, pxs:'EST', sh:3.6, own:[['FOUND',75]],
    sites:[ {type:'retail', name:'Spinneys Jumeirah', c:[25.2045,55.2465], size:3, sells:['milk','bread','vegbox','chicken','water']},
            {type:'retail', name:'Spinneys Dubai Marina', c:[25.0800,55.1430], size:2, sells:['milk','bread','water','snacks']},
            {type:'retail', name:'Spinneys Al Khalidiya (Abu Dhabi)', c:[24.4720,54.3520], size:2, sells:['milk','bread','vegbox','water']} ] },
  { id:'TAALEEM', name:'Taaleem Holdings', t:'TAALEEM', x:'DFM', st:'LISTED', hq:'DXB', sec:'education', rev:1.1, ni:0.2, fin:'EST', px:4.0, pxs:'EST', sh:1.0, own:[['FOUND',70]], sites:[] },
  { id:'TABREED', name:'National Central Cooling (Tabreed)', t:'TABREED', x:'DFM', st:'LISTED', hq:'AUH', sec:'utility', rev:2.6, ni:0.65, fin:'EST', px:2.90, pxs:'EST', sh:2.85, own:[['MUBADALA',42]], sites:[] },
  { id:'AJMANBANK', name:'Ajman Bank', t:'AJMANBANK', x:'DFM', st:'LISTED', hq:'AJM', sec:'bank', rev:1.0, ni:0.45, fin:'EST', px:1.90, pxs:'EST', sh:2.72, own:[['GOVAD',0],['FOUND',30]],
    sites:[ {type:'bankhq', name:'Ajman Bank HQ (rep)', c:[25.4060,55.4480], size:2} ] },
  // ------------------------------- ADX -----------------------------------
  { id:'ALDAR', name:'Aldar Properties', t:'ALDAR', x:'ADX', st:'LISTED', hq:'AUH', sec:'property', rev:30.0, ni:7.5, fin:'EST (audited FY2025 available from issuer)', px:8.82, pxs:'REAL ~18-Nov-2026', sh:7.86, own:[['ALPHA',25]],
    sites:[ {type:'mall', name:'Yas Mall', c:[24.4890,54.6080], size:8},
            {type:'apartment', name:'Al Reem Island Residences', c:[24.4975,54.4060], size:5},
            {type:'hotel', name:'Yas Island hotel (rep)', c:[24.4700,54.6060], size:3} ] },
  { id:'FAB', name:'First Abu Dhabi Bank', t:'FAB', x:'ADX', st:'LISTED', hq:'AUH', sec:'bank', rev:32.0, ni:18.0, fin:'EST', px:22.22, pxs:'REAL ~18-Nov-2026', sh:11.05, own:[['MUBADALA',38]],
    sites:[ {type:'bankhq', name:'FAB Head Office (rep)', c:[24.4995,54.3885], size:7},
            {type:'bankbranch', name:'FAB Downtown Dubai', c:[25.1960,55.2720], size:1} ] },
  { id:'ADCB', name:'Abu Dhabi Commercial Bank', t:'ADCB', x:'ADX', st:'LISTED', hq:'AUH', sec:'bank', rev:15.0, ni:9.0, fin:'EST', px:13.0, pxs:'EST', sh:7.32, own:[['GOVAD',60]],
    sites:[ {type:'bankhq', name:'ADCB HQ Corniche (rep)', c:[24.4870,54.3560], size:5} ] },
  { id:'ADIB', name:'Abu Dhabi Islamic Bank', t:'ADIB', x:'ADX', st:'LISTED', hq:'AUH', sec:'bank', rev:10.5, ni:6.5, fin:'EST', px:24.0, pxs:'EST', sh:3.63, own:[['EIA',40]],
    sites:[ {type:'bankhq', name:'ADIB HQ (rep)', c:[24.4900,54.3680], size:4} ] },
  { id:'ADPORTS', name:'AD Ports Group', t:'ADPORTS', x:'ADX', st:'LISTED', hq:'AUH', sec:'logistics', rev:20.77, ni:2.07, fin:'REAL FY2025', px:5.0, pxs:'EST', sh:5.09, own:[['ADQ',75]],
    sites:[ {type:'logistics', name:'Khalifa Port terminals', c:[24.8100,54.6500], size:9},
            {type:'warehouse', name:'KEZAD Logistics Park', c:[24.6881,54.7359], size:5} ] },
  { id:'ADNOCGAS', name:'ADNOC Gas', t:'ADNOCGAS', x:'ADX', st:'LISTED', hq:'AUH', sec:'oilgas', rev:88.0, ni:19.1, fin:'REAL NI US$5.2bn FY2025; rev EST', px:3.20, pxs:'REAL (undated StockAnalysis)', sh:76.7, own:[['ADNOC',90]],
    sites:[ {type:'oilwell', name:'Habshan gas processing (rep)', c:[23.8400,53.6200], size:8, out:'gas'} ] },
  { id:'ADNOCDRILL', name:'ADNOC Drilling', t:'ADNOCDRILL', x:'ADX', st:'LISTED', hq:'AUH', sec:'oilgas', rev:17.0, ni:5.0, fin:'EST', px:5.6, pxs:'EST', sh:16.0, own:[['ADNOC',78]], sites:[] },
  { id:'ADNOCDIST', name:'ADNOC Distribution', t:'ADNOCDIST', x:'ADX', st:'LISTED', hq:'AUH', sec:'retail', rev:33.0, ni:2.6, fin:'EST', px:3.6, pxs:'EST', sh:12.5, own:[['ADNOC',75]],
    sites:[ {type:'retail', name:'ADNOC Station Corniche', c:[24.4800,54.3600], size:2, sells:['petrol','water','snacks']},
            {type:'retail', name:'ADNOC Station Al Ain', c:[24.2150,55.7400], size:2, sells:['petrol','water','snacks']},
            {type:'retail', name:'ADNOC Station Al Barsha (Dubai)', c:[25.1080,55.1980], size:2, sells:['petrol','water','snacks']} ] },
  { id:'ADNOCLS', name:'ADNOC Logistics & Services', t:'ADNOCLS', x:'ADX', st:'LISTED', hq:'AUH', sec:'logistics', rev:13.5, ni:3.0, fin:'EST', px:7.22, pxs:'REAL ~18-Nov-2026', sh:7.4, own:[['ADNOC',81]],
    sites:[ {type:'logistics', name:'Ruwais marine logistics base', c:[24.1300,52.7300], size:4} ] },
  { id:'BOROUGE', name:'Borouge', t:'BOROUGE', x:'ADX', st:'LISTED', hq:'AUH', sec:'chemicals', rev:21.0, ni:4.5, fin:'EST', px:2.5, pxs:'EST', sh:30.0, own:[['ADNOC',54],['BOREALIS',36]],
    sites:[ {type:'factory', name:'Borouge Ruwais polymers', c:[24.0950,52.6900], size:9, makes:['polymer']} ] },
  { id:'FERTIGLB', name:'Fertiglobe', t:'FERTIGLB', x:'ADX', st:'LISTED', hq:'AUH', sec:'chemicals', rev:9.5, ni:1.0, fin:'EST', px:2.6, pxs:'EST', sh:8.3, own:[['ADNOC',86]],
    sites:[ {type:'factory', name:'Fertil Ruwais urea plant', c:[24.1250,52.7500], size:6, makes:['urea']} ] },
  { id:'ETISALAT', name:'e& (Emirates Telecommunications)', t:'ETISALAT', x:'ADX', st:'LISTED', hq:'AUH', sec:'telecom', rev:59.0, ni:10.5, fin:'EST', px:21.14, pxs:'REAL (undated StockAnalysis)', sh:8.7, own:[['EIA',60]],
    sites:[ {type:'telecom', name:'e& Headquarters (rep)', c:[24.4880,54.3620], size:8} ] },
  { id:'IHC', name:'International Holding Company', t:'IHC', x:'ADX', st:'LISTED', hq:'AUH', sec:'holding', rev:100.0, ni:24.0, fin:'EST', px:313.0, pxs:'REAL ~18-Nov-2026', sh:2.19, own:[['ROYAL',62]],
    sites:[ {type:'hq', name:'IHC HQ Al Maryah (rep)', c:[24.5020,54.3920], size:4} ] },
  { id:'ALPHADHABI', name:'Alpha Dhabi Holding', t:'ALPHADHABI', x:'ADX', st:'LISTED', hq:'AUH', sec:'holding', rev:18.0, ni:4.0, fin:'EST', px:11.0, pxs:'EST', sh:10.0, own:[['IHC',44],['ROYAL',30]], sites:[] },
  { id:'PRESIGHT', name:'Presight AI Holding', t:'PRESIGHT', x:'ADX', st:'LISTED', hq:'AUH', sec:'tech', rev:2.8, ni:0.65, fin:'EST', px:3.0, pxs:'EST', sh:5.6, own:[['G42',60]],
    sites:[ {type:'software', name:'Presight AI (Masdar, rep)', c:[24.4270,54.6170], size:4} ] },
  { id:'RAKCEC', name:'RAK Ceramics', t:'RAKCEC', x:'ADX', st:'LISTED', hq:'RAK', sec:'industrial', rev:3.2, ni:0.3, fin:'EST', px:2.6, pxs:'EST', sh:0.99, own:[['GOVRK',30]],
    sites:[ {type:'factory', name:'RAK Ceramics plant, Al Hamra (rep)', c:[25.6900,55.8100], size:5, makes:['glass']} ] },
  { id:'RAKBANK', name:'RAKBANK', t:'RAKBANK', x:'ADX', st:'LISTED', hq:'RAK', sec:'bank', rev:5.0, ni:2.2, fin:'EST', px:6.5, pxs:'EST', sh:2.0, own:[['GOVRK',52]],
    sites:[ {type:'bankhq', name:'RAKBANK HQ (rep)', c:[25.7930,55.9400], size:3} ] },
  { id:'GCEM', name:'Gulf Cement Company', t:'GCEM', x:'ADX', st:'LISTED', hq:'RAK', sec:'industrial', rev:0.6, ni:0.03, fin:'EST', px:0.55, pxs:'EST', sh:0.82, own:[['FOUND',40]],
    sites:[ {type:'mine', name:'Khor Khwair limestone quarry', c:[25.9672,56.0544], size:5, out:'limestone'},
            {type:'factory', name:'Gulf Cement kiln (Khor Khwair, rep)', c:[25.9550,56.0400], size:4, makes:['cement']} ] },
  { id:'FCI', name:'Fujairah Cement Industries', t:'FCI', x:'ADX', st:'LISTED', hq:'FUJ', sec:'industrial', rev:0.55, ni:0.02, fin:'EST', px:0.40, pxs:'EST', sh:0.36, own:[['GOVFU',30]],
    sites:[ {type:'mine', name:'Fujairah limestone quarry (rep)', c:[25.2500,56.2400], size:3, out:'limestone'} ] },
  { id:'SIB', name:'Sharjah Islamic Bank', t:'SIB', x:'ADX', st:'LISTED', hq:'SHJ', sec:'bank', rev:3.0, ni:1.2, fin:'EST', px:2.6, pxs:'EST', sh:3.24, own:[['GOVSH',40]],
    sites:[ {type:'bankhq', name:'SIB HQ Sharjah (rep)', c:[25.3400,55.3900], size:3} ] },
  // -------------------- UNLISTED / DELISTED (not tradable) -----------------
  { id:'NOON', name:'Noon E-Commerce', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'internet', rev:13.0, ni:-0.5, fin:'EST (private, not disclosed)', sh:1, own:[['FOUND',100]],
    sites:[ {type:'internet', name:'noon (Dubai, rep)', c:[25.1880,55.2650], size:6, model:'ecommerce'},
            {type:'warehouse', name:'noon fulfilment centre Dubai South (rep)', c:[24.9000,55.1500], size:5} ] },
  { id:'EMIRATES', name:'Emirates Group', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'aviation', rev:150.5, ni:21.0, fin:'REAL FY2025-26 (31-Mar-2026)', sh:1, own:[['ICD',100]],
    sites:[ {type:'logistics', name:'Emirates SkyCargo / DXB', c:[25.2532,55.3657], size:10},
            {type:'hq', name:'Emirates Group HQ (Garhoud)', c:[25.2460,55.3520], size:5} ] },
  { id:'FLYDUBAI', name:'flydubai', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'aviation', rev:13.0, ni:2.0, fin:'EST', sh:1, own:[['GOVDU',100]], sites:[] },
  { id:'DPWORLD', name:'DP World', t:'', x:'', st:'DELISTED', hq:'DXB', sec:'logistics', rev:89.6, ni:6.0, fin:'REAL rev US$24.4bn FY2025; NI EST', sh:1, own:[['DUBAIHOLD',0],['GOVDU',100]],
    sites:[ {type:'logistics', name:'Jebel Ali Port container terminals', c:[25.0223,55.0618], size:10},
            {type:'warehouse', name:'JAFZA logistics park', c:[25.0000,55.0900], size:6},
            {type:'importer', name:'DP World Trade Services (JAFZA)', c:[25.0100,55.0750], size:4} ] },
  { id:'EGA', name:'Emirates Global Aluminium', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'metals', rev:31.98, ni:4.93, fin:'REAL FY2025 underlying', sh:1, own:[['MUBADALA',50],['ICD',50]],
    sites:[ {type:'factory', name:'EGA Jebel Ali smelter', c:[24.9950,55.1050], size:9, makes:['aluminium']},
            {type:'factory', name:'EGA Al Taweelah smelter & alumina refinery', c:[24.7700,54.6950], size:10, makes:['alumina','aluminium']} ] },
  { id:'DUBAIHOLDING', name:'Dubai Holding', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'holding', rev:25.0, ni:6.0, fin:'EST', sh:1, own:[['GOVDU',100]],
    sites:[ {type:'apartment', name:'Business Bay residences (rep)', c:[25.1850,55.2650], size:4} ] },
  { id:'JUMEIRAH', name:'Jumeirah Group', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'hospitality', rev:6.0, ni:0.9, fin:'EST', sh:1, own:[['DUBAIHOLD',100]],
    sites:[ {type:'hotel', name:'Burj Al Arab Jumeirah', c:[25.1412,55.1853], size:3, stars:7},
            {type:'hotel', name:'Jumeirah Beach Hotel', c:[25.1418,55.1904], size:4},
            {type:'hotel', name:'Madinat Jumeirah', c:[25.1325,55.1840], size:6} ] },
  { id:'ADNOC', name:'ADNOC (parent)', t:'', x:'', st:'UNLISTED', hq:'AUH', sec:'oilgas', rev:400.0, ni:80.0, fin:'EST (state-owned, consolidated not published)', sh:1, own:[['GOVAD',100]],
    sites:[ {type:'oilwell', name:'Bab onshore field (rep)', c:[23.8100,53.7300], size:10, out:'crude'},
            {type:'oilwell', name:'Upper Zakum offshore (rep)', c:[24.8500,53.6500], size:10, out:'crude'},
            {type:'factory', name:'Ruwais Refinery', c:[24.1100,52.7300], size:10, makes:['petrol','jetfuel']} ] },
  { id:'MUBADALA', name:'Mubadala Investment Company', t:'', x:'', st:'UNLISTED', hq:'AUH', sec:'holding', rev:50.0, ni:15.0, fin:'EST', sh:1, own:[['GOVAD',100]],
    sites:[ {type:'commercial', name:'Mubadala Tower, Al Maryah', c:[24.4985,54.3870], size:5} ] },
  { id:'MIRAL', name:'Miral', t:'', x:'', st:'UNLISTED', hq:'AUH', sec:'hospitality', rev:4.0, ni:0.6, fin:'EST', sh:1, own:[['GOVAD',100]],
    sites:[ {type:'sports', name:'Ferrari World Yas Island', c:[24.4837,54.6072], size:6},
            {type:'sports', name:'Warner Bros. World / SeaWorld Yas (rep)', c:[24.4920,54.5990], size:5} ] },
  { id:'ETIHAD', name:'Etihad Airways', t:'', x:'', st:'UNLISTED', hq:'AUH', sec:'aviation', rev:25.0, ni:1.7, fin:'EST', sh:1, own:[['ADQ',100]],
    sites:[ {type:'logistics', name:'Etihad Cargo, Zayed Intl', c:[24.4330,54.6511], size:6} ] },
  { id:'G42', name:'G42', t:'', x:'', st:'UNLISTED', hq:'AUH', sec:'tech', rev:12.0, ni:1.0, fin:'EST', sh:1, own:[['FOUND',100]],
    sites:[ {type:'datacenter', name:'G42 / Khazna data centre (rep)', c:[24.4310,54.6230], size:5} ] },
  { id:'AMAZONAE', name:'Amazon.ae UAE operations', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'internet', rev:15.0, ni:0.5, fin:'EST (parent NASDAQ:AMZN, not DFM/ADX)', sh:1, own:[['FOUND',100]],
    sites:[ {type:'warehouse', name:'Al Quoz fulfilment site', c:[25.128375,55.21963], size:5},
            {type:'internet', name:'Amazon.ae marketplace', c:[25.0975,55.1600], size:5, model:'ecommerce'} ] },
  { id:'CAREEM', name:'Careem', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'internet', rev:3.0, ni:-0.2, fin:'EST', sh:1, own:[['FOUND',100]],
    sites:[ {type:'internet', name:'Careem super-app (rep)', c:[25.0985,55.1590], size:3, model:'delivery'} ] },
  { id:'LANDMARK', name:'Landmark Group', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'retail', rev:25.0, ni:1.5, fin:'EST', sh:1, own:[['FOUND',100]],
    sites:[ {type:'retail', name:'Centrepoint Mall of the Emirates', c:[25.1190,55.2015], size:3, sells:['fashion','footwear','toys']},
            {type:'retail', name:'Home Centre Deira City Centre', c:[25.2520,55.3340], size:2, sells:['furniture','toys']},
            {type:'retail', name:'Centrepoint Yas Mall', c:[24.4885,54.6090], size:2, sells:['fashion','footwear']} ] },
  { id:'INSTASHOP', name:'InstaShop', t:'', x:'', st:'UNLISTED', hq:'DXB', sec:'internet', rev:1.0, ni:-0.05, fin:'EST', sh:1, own:[['DH',100]], sites:[] }
];

/* Sector parameters for valuation and AI behaviour (EST) */
UAE.SECTORS = {
  property:   { name:'Real Estate',   pe:9,  assetsPerRev:3.2, debtShare:0.30, grow:0.06, firms:['apartment','commercial','mall','hotel'] },
  utility:    { name:'Utilities',     pe:16, assetsPerRev:5.5, debtShare:0.35, grow:0.04, firms:['solar','datacenter'] },
  bank:       { name:'Banking',       pe:8,  assetsPerRev:20,  debtShare:0.85, grow:0.05, firms:['bankbranch','bankhq'] },
  transport:  { name:'Transport',     pe:20, assetsPerRev:3.0, debtShare:0.30, grow:0.05, firms:['logistics'] },
  internet:   { name:'Internet',      pe:22, assetsPerRev:0.8, debtShare:0.10, grow:0.15, firms:['internet','warehouse','logistics'] },
  telecom:    { name:'Telecom',       pe:14, assetsPerRev:2.2, debtShare:0.35, grow:0.04, firms:['telecom','datacenter'] },
  finance:    { name:'Financial Svcs',pe:14, assetsPerRev:3.0, debtShare:0.20, grow:0.05, firms:['inshq','insoffice'] },
  aviation:   { name:'Aviation',      pe:9,  assetsPerRev:1.4, debtShare:0.45, grow:0.06, firms:['logistics','hotel'] },
  retail:     { name:'Retail',        pe:18, assetsPerRev:0.9, debtShare:0.25, grow:0.06, firms:['retail','warehouse','service'] },
  education:  { name:'Education',     pe:20, assetsPerRev:2.5, debtShare:0.25, grow:0.07, firms:['civic'] },
  logistics:  { name:'Logistics',     pe:16, assetsPerRev:2.4, debtShare:0.35, grow:0.06, firms:['logistics','warehouse','importer','exporter'] },
  oilgas:     { name:'Oil & Gas',     pe:13, assetsPerRev:1.8, debtShare:0.20, grow:0.03, firms:['oilwell','factory'] },
  chemicals:  { name:'Chemicals',     pe:14, assetsPerRev:2.0, debtShare:0.25, grow:0.03, firms:['factory'] },
  holding:    { name:'Holding',       pe:30, assetsPerRev:2.5, debtShare:0.25, grow:0.08, firms:['commercial','hotel','retail','factory'] },
  tech:       { name:'Technology',    pe:30, assetsPerRev:1.5, debtShare:0.10, grow:0.15, firms:['software','datacenter','rnd'] },
  metals:     { name:'Metals',        pe:10, assetsPerRev:2.3, debtShare:0.35, grow:0.03, firms:['factory'] },
  hospitality:{ name:'Hospitality',   pe:16, assetsPerRev:3.0, debtShare:0.35, grow:0.06, firms:['hotel','service','sports'] },
  industrial: { name:'Industrials',   pe:12, assetsPerRev:1.6, debtShare:0.30, grow:0.04, firms:['factory','mine','warehouse'] },
  media:      { name:'Media',         pe:12, assetsPerRev:1.2, debtShare:0.20, grow:0.03, firms:['tv','radio','newspaper'] },
  trading:    { name:'Trading',       pe:12, assetsPerRev:1.0, debtShare:0.30, grow:0.06, firms:['importer','retail','warehouse'] }
};

/* Names for fictional AI start-ups and executives (SYN - any resemblance to real
 * persons is coincidental; real company leadership is NOT modelled). */
UAE.FICTIONAL_COMPANIES = [
  ['Brightwater Retail','retail'], ['Harrison Trading Co.','trading'], ['Maplewood Foods','retail'],
  ['Oakridge Dairy Co.','industrial'], ['Sterling Electronics','retail'], ['Bayview Properties','property'],
  ['Kensington Hospitality','hospitality'], ['Atlas Freight & Logistics','logistics'], ['Granite Peak Cement','industrial'],
  ['Lakeview Media Group','media'], ['Northstar Digital','internet'], ['Redwood Software','tech'],
  ['Green Valley Farms','industrial'], ['Kingsbridge Holdings','holding'], ['Whitmore Fragrances','retail'],
  ['Westbrook Ventures','holding'], ['Fairfield Apparel','retail'], ['Clearwater Springs','industrial']
];
/** Random company name parts (SYN), English / US style. Patterns (UAE.randomCompanyName):
 *  place + core + suffix ("Northfield Robotics Inc."), surname + suffix ("Whitmore Group"),
 *  two surnames ("Harrison & Clarke"), surname + family ("Bennett & Sons"), initials ("J.R. Caldwell Co."). */
UAE.CO_NAME_PARTS = {
  prefix: ['Northfield','Brightwater','Oakridge','Silver Creek','Redwood','Granite Peak','Bluestone','Lakeshore','Westbrook','Pinecrest','Ironwood',
    'Stonebridge','Riverside','Maplewood','Highland','Cedar Point','Fairview','Kingsbridge','Pioneer','Frontier','Keystone','Heritage','Sterling',
    'Evergreen','Summit','Bayview','Harbor','Clearwater','Blackstone Ridge','Copper Hill','Golden Gate','Willow Creek','Eastgate','Southport',
    'Hawthorne','Ashford','Thornbury','Wellington','Kensington','Chesterfield','Brookline','Hamilton','Lexington','Cambridge','Windsor',
    'Northstar','Lighthouse','Eagle Rock','Red Oak','Elm Street','Crescent Bay','Falcon Ridge','Mountain View','Prairie','Canyon','Liberty Bell',
    'Atlas','Orion','Titan','Apex','Vertex','Aurora','Nova','Zenith','Horizon','Meridian','Beacon','Paragon','Vanguard','Sentinel','Crestview'],
  core: ['Quantum','Digital','Dynamics','Energy','Logistics','Foods','Retail','Tech','Labs','Robotics','Capital','Industries','Systems','Networks','Media',
    'Pharma','Motors','Materials','Trading','Properties','Hospitality','Electronics','Aerospace','Biotech','Analytics','Mobility','Solar','Water','Textiles',
    'Brands','Software','Semiconductor','Health','Data','Manufacturing','Instruments','Devices'],
  suffix: ['Inc.','Corp.','Holdings','Group','Co.','LLC','Industries','Enterprises','International','Partners','Global','Company','Brands','& Co.'],
  surname: ['Whitmore','Harrison','Caldwell','Bennett','Clarke','Hargrove','Prescott','Sullivan','Montgomery','Fletcher','Donovan','Whitaker','Ellison',
    'Bradford','Lancaster','Sinclair','Pemberton','Thornton','Holloway','Beaumont','Carrington','Hale','Mercer','Sterling','Langford','Ashby','Crawford',
    'Davenport','Garrison','Kensington','Maxwell','Norwood','Radcliffe','Stanton','Walsh','Barrett','Callahan','Fitzgerald','Grayson','Hudson','Kendall',
    'Lawson','Merritt','Prentice','Quinn','Rutherford','Sheridan','Tate','Vaughn','Wyatt','Calloway','Ellsworth','Hollis','Kingsley','Marlowe','Whitfield'],
  family: ['& Sons','Brothers','& Daughters','Family Holdings','& Partners','& Associates']
};
/* Executives (SYN): English / US style names. */
UAE.FIRST_NAMES = ['James','Emma','Michael','Olivia','William','Sophia','Benjamin','Charlotte','Daniel','Amelia','Matthew','Grace','Henry','Lily',
  'Jack','Hannah','Samuel','Ella','Thomas','Chloe','Andrew','Lucy','Christopher','Abigail','Ryan','Madison','Nathan','Emily','Ethan','Victoria',
  'Alexander','Natalie','Jonathan','Rachel','David','Sarah','Patrick','Megan','Robert','Elizabeth','Edward','Caroline','Arthur','Katherine',
  'Lucas','Harper','Owen','Ava','Connor','Zoe','Tyler','Brooke','Jason','Claire','Mark','Laura','Brian','Rebecca','Kevin','Jessica','Scott','Hailey'];
UAE.LAST_NAMES = ['Smith','Johnson','Williams','Brown','Taylor','Anderson','Thompson','Walker','Wright','Mitchell','Carter','Turner','Parker','Collins',
  'Edwards','Stewart','Morris','Murphy','Cook','Rogers','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Ward','Cox','Richardson',
  'Wood','Watson','Brooks','Bennett','Gray','Hughes','Price','Sanders','Myers','Long','Foster','Powell','Jenkins','Perry','Russell','Sullivan',
  'Bell','Coleman','Butler','Henderson','Barnes','Fisher','Hayes','Graham','Wallace','Hamilton','Ellis','Harrison','Fletcher','Whitmore','Caldwell','Prescott'];
/* CEO traits drive AI decisions: aggression (expansion speed), risk (leverage),
 * pricing (discount vs premium), diversify (chance to enter new industries). */
