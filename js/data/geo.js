/* ============================================================================
 * UAE CAPITALISM LAB  -  GEOGRAPHY DATA
 * ----------------------------------------------------------------------------
 * Everything here is plain data. Coordinates are WGS84 [lat, lng].
 *
 * Provenance tags used throughout the data files:
 *   REAL  = published figure / real-world location (see README "Sources")
 *   EST   = estimate or calibration value chosen by the designer, NOT official
 *   SYN   = synthetic game value (needed for gameplay, no real equivalent)
 *
 * Hierarchy (do not collapse - see master_v3 F1):
 *   Nation (UAE)  ->  Emirate  ->  City market  ->  District (buildable zone)
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* ---- Emirates (administrative level) ------------------------------------ */
UAE.EMIRATES = {
  DU: { id: 'DU', name: 'Dubai',          capital: 'DXB', exchange: 'DFM' },
  AD: { id: 'AD', name: 'Abu Dhabi',      capital: 'AUH', exchange: 'ADX' },
  SH: { id: 'SH', name: 'Sharjah',        capital: 'SHJ' },
  AJ: { id: 'AJ', name: 'Ajman',          capital: 'AJM' },
  UQ: { id: 'UQ', name: 'Umm Al Quwain',  capital: 'UAQ' },
  RK: { id: 'RK', name: 'Ras Al Khaimah', capital: 'RAK' },
  FU: { id: 'FU', name: 'Fujairah',       capital: 'FUJ' }
};

/* ---- City markets (each has its own demand, wages, rents, government) ----
 * pop        resident population                      (DXB REAL end-2025 4.58m;
 *                                                        AD emirate REAL 2024 4.136m,
 *                                                        split across AUH/AAN/RUW = EST;
 *                                                        others EST)
 * gdp        nominal GDP, AED bn / year               (DXB REAL 2025 972; AD emirate
 *                                                        ~1,200 2024 REAL-approx split EST;
 *                                                        others EST)
 * growth     trend real growth / year                 (DXB REAL 2025 +5.4%; others EST)
 * cpi        inflation / year                         (DXB REAL 2025 2.79%; others EST)
 * wage       avg monthly compensation AED             (DXB = CALC proxy 7,267; others EST)
 * income     spending-power index vs Dubai = 1.00     (EST)
 * tourists   international overnight visitors / year  (DXB REAL 2025 19.59m; others EST)
 * unemp      unemployment rate                        (DXB REAL 2024 0.9%; others EST)
 * govRev / govExp   government revenue / spend, AED bn (DXB REAL Budget-2026 107.7 / 99.5)
 * govDebt    government debt AED bn                   (DXB REAL 30-Sep-2026 110.9; others EST)
 * hotelADR / hotelOcc                                  (DXB REAL 2025 AED 579 / 80.7%; others EST)
 * --------------------------------------------------------------------------*/
UAE.CITIES = {
  DXB: { id:'DXB', name:'Dubai',          emirate:'DU', center:[25.2048,55.2708], zoom:11.2,
         pop:4580000, gdp:972, growth:0.054, cpi:0.0279, wage:7267, income:1.00, tourists:19590000,
         unemp:0.009, govRev:107.7, govExp:99.5, govDebt:110.9, hotelADR:579, hotelOcc:0.807,
         officeRent:1900, resiRent:1150, src:'REAL (DSC, DET, DoF Dubai) + EST' },
  AUH: { id:'AUH', name:'Abu Dhabi City', emirate:'AD', center:[24.4539,54.3773], zoom:11.0,
         pop:2450000, gdp:780, growth:0.040, cpi:0.022, wage:8100, income:1.08, tourists:4200000,
         unemp:0.020, govRev:95, govExp:88, govDebt:60, hotelADR:520, hotelOcc:0.78,
         officeRent:1500, resiRent:1000, src:'EST split of SCAD 2024 emirate totals' },
  AAN: { id:'AAN', name:'Al Ain',         emirate:'AD', center:[24.2075,55.7447], zoom:11.5,
         pop:1150000, gdp:150, growth:0.030, cpi:0.020, wage:5600, income:0.78, tourists:600000,
         unemp:0.030, govRev:18, govExp:20, govDebt:0, hotelADR:330, hotelOcc:0.66,
         officeRent:650, resiRent:520, src:'EST' },
  RUW: { id:'RUW', name:'Al Dhafra / Ruwais', emirate:'AD', center:[24.1100,52.7300], zoom:10.5,
         pop:540000, gdp:270, growth:0.035, cpi:0.020, wage:9200, income:0.85, tourists:150000,
         unemp:0.015, govRev:20, govExp:9, govDebt:0, hotelADR:380, hotelOcc:0.70,
         officeRent:600, resiRent:600, src:'EST (oil/petrochem heavy region)' },
  SHJ: { id:'SHJ', name:'Sharjah',        emirate:'SH', center:[25.3463,55.4209], zoom:11.4,
         pop:1810000, gdp:145, growth:0.035, cpi:0.024, wage:5400, income:0.72, tourists:1900000,
         unemp:0.028, govRev:22, govExp:24, govDebt:40, hotelADR:320, hotelOcc:0.72,
         officeRent:700, resiRent:650, src:'EST' },
  AJM: { id:'AJM', name:'Ajman',          emirate:'AJ', center:[25.4052,55.5136], zoom:12.2,
         pop:540000, gdp:34, growth:0.032, cpi:0.024, wage:4600, income:0.62, tourists:400000,
         unemp:0.030, govRev:4, govExp:4.2, govDebt:3, hotelADR:290, hotelOcc:0.70,
         officeRent:500, resiRent:520, src:'EST' },
  UAQ: { id:'UAQ', name:'Umm Al Quwain',  emirate:'UQ', center:[25.5647,55.5552], zoom:12.0,
         pop:85000, gdp:6, growth:0.025, cpi:0.022, wage:4300, income:0.60, tourists:120000,
         unemp:0.035, govRev:1.0, govExp:1.1, govDebt:0.5, hotelADR:260, hotelOcc:0.60,
         officeRent:380, resiRent:420, src:'EST' },
  RAK: { id:'RAK', name:'Ras Al Khaimah', emirate:'RK', center:[25.7895,55.9432], zoom:11.0,
         pop:420000, gdp:56, growth:0.040, cpi:0.022, wage:5000, income:0.66, tourists:1300000,
         unemp:0.030, govRev:7, govExp:6.8, govDebt:14, hotelADR:420, hotelOcc:0.74,
         officeRent:480, resiRent:480, src:'EST' },
  FUJ: { id:'FUJ', name:'Fujairah',       emirate:'FU', center:[25.1288,56.3265], zoom:11.3,
         pop:330000, gdp:31, growth:0.030, cpi:0.022, wage:4900, income:0.64, tourists:450000,
         unemp:0.032, govRev:3.5, govExp:3.7, govDebt:2, hotelADR:340, hotelOcc:0.68,
         officeRent:420, resiRent:450, src:'EST' }
};

/* ---- Buildable districts ------------------------------------------------
 * Clicking the map in Build mode finds the district whose circle contains the
 * click.  zone controls which building types are allowed (see FIRM_TYPES.zones).
 *   land   = land price AED per m2 (EST, ranked to match real market tiers)
 *   foot   = footfall / shopper traffic multiplier (EST)
 *   r      = radius in km of the buildable circle
 * zones: cbd, commercial, residential, tourism, industrial, port, freezone, tech,
 *        agri, quarry, oilfield, desert
 * --------------------------------------------------------------------------*/
UAE.DISTRICTS = [
  // ---------------- DUBAI ----------------
  { id:'DXB_DOWNTOWN', city:'DXB', name:'Downtown Dubai (Burj Khalifa)', c:[25.1950,55.2760], r:1.2, zone:'cbd',         land:9000, foot:2.3 },
  { id:'DXB_BBAY',     city:'DXB', name:'Business Bay',                  c:[25.1860,55.2620], r:1.1, zone:'cbd',         land:6500, foot:1.6 },
  { id:'DXB_DIFC',     city:'DXB', name:'DIFC / Sheikh Zayed Road',      c:[25.2130,55.2800], r:0.9, zone:'cbd',         land:9500, foot:1.8 },
  { id:'DXB_MARINA',   city:'DXB', name:'Dubai Marina',                  c:[25.0805,55.1410], r:1.3, zone:'tourism',     land:7500, foot:1.9 },
  { id:'DXB_JBR',      city:'DXB', name:'JBR / Bluewaters',              c:[25.0790,55.1300], r:0.6, zone:'tourism',     land:7200, foot:2.0 },
  { id:'DXB_PALM',     city:'DXB', name:'Palm Jumeirah',                 c:[25.1150,55.1380], r:1.6, zone:'tourism',     land:11000,foot:1.7 },
  { id:'DXB_JUMEIRAH', city:'DXB', name:'Jumeirah / City Walk',          c:[25.2050,55.2480], r:1.8, zone:'residential', land:5500, foot:1.2 },
  { id:'DXB_UMMSUQ',   city:'DXB', name:'Umm Suqeim (Burj Al Arab)',     c:[25.1440,55.2050], r:1.4, zone:'tourism',     land:6000, foot:1.4 },
  { id:'DXB_BARSHA',   city:'DXB', name:'Al Barsha (Mall of the Emirates)', c:[25.1120,55.2000], r:1.5, zone:'commercial', land:4500, foot:1.5 },
  { id:'DXB_HILLS',    city:'DXB', name:'Dubai Hills Estate',            c:[25.1020,55.2450], r:1.7, zone:'residential', land:5000, foot:1.2 },
  { id:'DXB_TECOMCITY',city:'DXB', name:'Internet City / Media City',    c:[25.0950,55.1620], r:1.0, zone:'tech',        land:5000, foot:1.1 },
  { id:'DXB_QUOZ',     city:'DXB', name:'Al Quoz Industrial',            c:[25.1380,55.2350], r:1.9, zone:'industrial',  land:1800, foot:0.7 },
  { id:'DXB_DEIRA',    city:'DXB', name:'Deira (Gold Souk, City Centre)',c:[25.2680,55.3150], r:1.9, zone:'commercial',  land:4000, foot:1.6 },
  { id:'DXB_BURDUBAI', city:'DXB', name:'Bur Dubai / Karama',            c:[25.2500,55.2980], r:1.3, zone:'commercial',  land:3800, foot:1.4 },
  { id:'DXB_CREEKHB',  city:'DXB', name:'Dubai Creek Harbour',           c:[25.2010,55.3460], r:1.1, zone:'residential', land:4800, foot:1.1 },
  { id:'DXB_FESTIVAL', city:'DXB', name:'Dubai Festival City',           c:[25.2220,55.3520], r:0.9, zone:'commercial',  land:4000, foot:1.3 },
  { id:'DXB_DSO',      city:'DXB', name:'Dubai Silicon Oasis',           c:[25.1200,55.3870], r:1.6, zone:'tech',        land:2200, foot:0.9 },
  { id:'DXB_JAFZA',    city:'DXB', name:'Jebel Ali Port & JAFZA',        c:[25.0050,55.0800], r:4.0, zone:'port',        land:900,  foot:0.4 },
  { id:'DXB_DIC',      city:'DXB', name:'Dubai Industrial City',         c:[24.8480,55.0770], r:3.0, zone:'industrial',  land:500,  foot:0.3 },
  { id:'DXB_SOUTH',    city:'DXB', name:'Dubai South (Al Maktoum Airport)', c:[24.8900,55.1600], r:4.0, zone:'freezone', land:700,  foot:0.4 },
  { id:'DXB_DIP',      city:'DXB', name:'Dubai Investments Park',        c:[24.9800,55.1700], r:2.4, zone:'industrial',  land:800,  foot:0.5 },
  { id:'DXB_MIRDIF',   city:'DXB', name:'Mirdif',                        c:[25.2200,55.4200], r:1.9, zone:'residential', land:3200, foot:1.0 },
  { id:'DXB_INTCITY',  city:'DXB', name:'International City',            c:[25.1650,55.4100], r:1.4, zone:'residential', land:1800, foot:0.9 },
  { id:'DXB_JVC',      city:'DXB', name:'Jumeirah Village Circle',       c:[25.0580,55.2100], r:1.7, zone:'residential', land:3000, foot:0.9 },
  { id:'DXB_RASALKHOR',city:'DXB', name:'Ras Al Khor / Umm Ramool',      c:[25.2300,55.3650], r:1.4, zone:'industrial',  land:1600, foot:0.6 },
  { id:'DXB_SOLAR',    city:'DXB', name:'MBR Solar Park (Seih Al Dahal)',c:[24.7600,55.3700], r:4.0, zone:'desert',      land:150,  foot:0.05 },
  { id:'DXB_LISAILI',  city:'DXB', name:'Al Lisaili farms',              c:[24.9500,55.4600], r:4.0, zone:'agri',        land:120,  foot:0.1 },
  { id:'DXB_HATTA',    city:'DXB', name:'Hatta',                         c:[24.8000,56.1200], r:3.0, zone:'tourism',     land:800,  foot:0.4 },
  // ---------------- ABU DHABI CITY ----------------
  { id:'AUH_CORNICHE', city:'AUH', name:'Abu Dhabi Corniche / Downtown', c:[24.4750,54.3550], r:2.0, zone:'cbd',         land:6000, foot:1.4 },
  { id:'AUH_MARYAH',   city:'AUH', name:'Al Maryah Island (ADGM)',       c:[24.5010,54.3900], r:0.8, zone:'cbd',         land:8000, foot:1.4 },
  { id:'AUH_REEM',     city:'AUH', name:'Al Reem Island',                c:[24.4980,54.4050], r:1.2, zone:'residential', land:5000, foot:1.0 },
  { id:'AUH_SAADIYAT', city:'AUH', name:'Saadiyat Island (Louvre)',      c:[24.5400,54.4300], r:2.4, zone:'tourism',     land:6500, foot:1.1 },
  { id:'AUH_YAS',      city:'AUH', name:'Yas Island',                    c:[24.4880,54.6050], r:2.4, zone:'tourism',     land:5500, foot:1.5 },
  { id:'AUH_KHCITY',   city:'AUH', name:'Khalifa City',                  c:[24.4200,54.5800], r:2.4, zone:'residential', land:2800, foot:0.8 },
  { id:'AUH_GMOSQUE',  city:'AUH', name:'Grand Mosque / Al Maqta',       c:[24.4150,54.4750], r:1.4, zone:'commercial',  land:4200, foot:1.2 },
  { id:'AUH_MBZ',      city:'AUH', name:'Mohammed Bin Zayed City',       c:[24.3600,54.5500], r:2.4, zone:'residential', land:2400, foot:0.8 },
  { id:'AUH_MUSSAFAH', city:'AUH', name:'Mussafah Industrial (ICAD)',    c:[24.3490,54.4880], r:3.0, zone:'industrial',  land:700,  foot:0.5 },
  { id:'AUH_MASDAR',   city:'AUH', name:'Masdar City',                   c:[24.4290,54.6180], r:1.1, zone:'tech',        land:3000, foot:0.8 },
  { id:'AUH_KIZAD',    city:'AUH', name:'KEZAD / Khalifa Port (Al Taweelah)', c:[24.7500,54.7000], r:6.0, zone:'port',   land:500,  foot:0.3 },
  // ---------------- AL AIN ----------------
  { id:'AAN_CENTRE',   city:'AAN', name:'Al Ain Centre',                 c:[24.2100,55.7450], r:3.0, zone:'commercial',  land:2000, foot:1.0 },
  { id:'AAN_AGRI',     city:'AAN', name:'Al Ain agriculture belt',       c:[24.0900,55.6500], r:6.0, zone:'agri',        land:100,  foot:0.1 },
  { id:'AAN_IND',      city:'AAN', name:'Al Ain Industrial',             c:[24.1700,55.8000], r:2.0, zone:'industrial',  land:400,  foot:0.3 },
  // ---------------- AL DHAFRA / RUWAIS ----------------
  { id:'RUW_IND',      city:'RUW', name:'Ruwais Industrial Complex',     c:[24.1200,52.7200], r:4.0, zone:'industrial',  land:300,  foot:0.2 },
  { id:'RUW_BAB',      city:'RUW', name:'Bab / Habshan onshore fields',  c:[23.8000,53.7000], r:20,  zone:'oilfield',    land:50,   foot:0 },
  { id:'RUW_ZAKUM',    city:'RUW', name:'Upper Zakum offshore field',    c:[24.8500,53.6500], r:18,  zone:'oilfield',    land:0,    foot:0 },
  { id:'RUW_LIWA',     city:'RUW', name:'Liwa Oasis',                    c:[23.1300,53.7700], r:10,  zone:'agri',        land:60,   foot:0.1 },
  // ---------------- SHARJAH ----------------
  { id:'SHJ_MAJAZ',    city:'SHJ', name:'Sharjah City (Al Majaz)',       c:[25.3250,55.3900], r:2.0, zone:'commercial',  land:3000, foot:1.2 },
  { id:'SHJ_NAHDA',    city:'SHJ', name:'Al Nahda Sharjah',              c:[25.3000,55.3750], r:1.4, zone:'residential', land:2600, foot:1.0 },
  { id:'SHJ_IND',      city:'SHJ', name:'Sharjah Industrial Area',       c:[25.3050,55.4250], r:2.4, zone:'industrial',  land:900,  foot:0.5 },
  { id:'SHJ_SAIF',     city:'SHJ', name:'SAIF Zone / Sharjah Airport',   c:[25.3300,55.5200], r:2.0, zone:'freezone',    land:800,  foot:0.5 },
  { id:'SHJ_KHORF',    city:'SHJ', name:'Khor Fakkan Port',              c:[25.3550,56.3600], r:2.0, zone:'port',        land:400,  foot:0.3 },
  // ---------------- AJMAN / UAQ ----------------
  { id:'AJM_CITY',     city:'AJM', name:'Ajman City',                    c:[25.4050,55.4500], r:2.4, zone:'commercial',  land:2000, foot:1.0 },
  { id:'AJM_IND',      city:'AJM', name:'Ajman Industrial',              c:[25.3850,55.4900], r:1.5, zone:'industrial',  land:600,  foot:0.4 },
  { id:'UAQ_CITY',     city:'UAQ', name:'Umm Al Quwain City',            c:[25.5650,55.5550], r:3.0, zone:'residential', land:900,  foot:0.5 },
  // ---------------- RAS AL KHAIMAH ----------------
  { id:'RAK_CITY',     city:'RAK', name:'Ras Al Khaimah City',           c:[25.7900,55.9450], r:3.0, zone:'commercial',  land:1500, foot:0.8 },
  { id:'RAK_MARJAN',   city:'RAK', name:'Al Marjan Island',              c:[25.6750,55.7350], r:1.5, zone:'tourism',     land:3500, foot:1.0 },
  { id:'RAK_KHOR',     city:'RAK', name:'Khor Khwair quarries',          c:[25.9670,56.0540], r:4.0, zone:'quarry',      land:60,   foot:0 },
  { id:'RAK_GHAIL',    city:'RAK', name:'Al Ghail Industrial',           c:[25.6000,55.9000], r:3.0, zone:'industrial',  land:300,  foot:0.2 },
  // ---------------- FUJAIRAH ----------------
  { id:'FUJ_CITY',     city:'FUJ', name:'Fujairah City',                 c:[25.1250,56.3300], r:2.4, zone:'commercial',  land:1300, foot:0.7 },
  { id:'FUJ_PORT',     city:'FUJ', name:'Port of Fujairah',              c:[25.1650,56.3600], r:2.0, zone:'port',        land:500,  foot:0.3 },
  { id:'FUJ_DIBBA',    city:'FUJ', name:'Dibba coast',                   c:[25.6000,56.2700], r:2.0, zone:'tourism',     land:1000, foot:0.5 },
  { id:'FUJ_QUARRY',   city:'FUJ', name:'Fujairah quarries',             c:[25.2500,56.2500], r:4.0, zone:'quarry',      land:50,   foot:0 }
];

/* ---- Landmarks (labels on the map; REAL coordinates, approx. to ~50 m) --- */
UAE.LANDMARKS = [
  { name:'Burj Khalifa',              c:[25.1972,55.2744], icon:'tower',   city:'DXB' },
  { name:'The Dubai Mall',            c:[25.1985,55.2796], icon:'mall',    city:'DXB' },
  { name:'Dubai Fountain',            c:[25.1953,55.2753], icon:'star',    city:'DXB' },
  { name:'Burj Al Arab',              c:[25.1412,55.1853], icon:'hotel',   city:'DXB' },
  { name:'Atlantis The Palm',         c:[25.1304,55.1171], icon:'hotel',   city:'DXB' },
  { name:'Palm Jumeirah',             c:[25.1124,55.1390], icon:'star',    city:'DXB' },
  { name:'Ain Dubai (Bluewaters)',    c:[25.0798,55.1231], icon:'star',    city:'DXB' },
  { name:'Mall of the Emirates',      c:[25.1181,55.2006], icon:'mall',    city:'DXB' },
  { name:'Museum of the Future',      c:[25.2192,55.2818], icon:'star',    city:'DXB' },
  { name:'Emirates Towers',           c:[25.2175,55.2830], icon:'tower',   city:'DXB' },
  { name:'DIFC Gate',                 c:[25.2129,55.2794], icon:'bank',    city:'DXB' },
  { name:'Dubai Frame',               c:[25.2355,55.3003], icon:'star',    city:'DXB' },
  { name:'Gold Souk',                 c:[25.2700,55.2976], icon:'mall',    city:'DXB' },
  { name:'Deira City Centre',         c:[25.2525,55.3335], icon:'mall',    city:'DXB' },
  { name:'Dubai International (DXB)', c:[25.2532,55.3657], icon:'plane',   city:'DXB' },
  { name:'Jebel Ali Port',            c:[25.0223,55.0618], icon:'port',    city:'DXB' },
  { name:'Al Maktoum Intl (DWC)',     c:[24.8963,55.1614], icon:'plane',   city:'DXB' },
  { name:'Expo City Dubai',           c:[24.9634,55.1500], icon:'star',    city:'DXB' },
  { name:'Global Village',            c:[25.0700,55.3050], icon:'star',    city:'DXB' },
  { name:'Dubai Hills Mall',          c:[25.1020,55.2400], icon:'mall',    city:'DXB' },
  { name:'Dubai Creek Tower site',    c:[25.2010,55.3460], icon:'tower',   city:'DXB' },
  { name:'MBR Solar Park',            c:[24.7635,55.3699], icon:'sun',     city:'DXB' },
  { name:'Sheikh Zayed Grand Mosque', c:[24.4128,54.4750], icon:'star',    city:'AUH' },
  { name:'Emirates Palace',           c:[24.4615,54.3172], icon:'hotel',   city:'AUH' },
  { name:'Louvre Abu Dhabi',          c:[24.5337,54.3983], icon:'star',    city:'AUH' },
  { name:'Ferrari World',             c:[24.4837,54.6072], icon:'star',    city:'AUH' },
  { name:'Yas Marina Circuit',        c:[24.4672,54.6031], icon:'star',    city:'AUH' },
  { name:'Yas Mall',                  c:[24.4890,54.6080], icon:'mall',    city:'AUH' },
  { name:'Zayed Intl Airport (AUH)',  c:[24.4330,54.6511], icon:'plane',   city:'AUH' },
  { name:'Khalifa Port',              c:[24.8100,54.6500], icon:'port',    city:'AUH' },
  { name:'ADGM Square',               c:[24.5010,54.3900], icon:'bank',    city:'AUH' },
  { name:'Masdar City',               c:[24.4292,54.6183], icon:'sun',     city:'AUH' },
  { name:'Qasr Al Watan',             c:[24.4620,54.3050], icon:'star',    city:'AUH' },
  { name:'Al Ain Oasis',              c:[24.2160,55.7600], icon:'leaf',    city:'AAN' },
  { name:'Jebel Hafeet',              c:[24.0590,55.7770], icon:'star',    city:'AAN' },
  { name:'Ruwais Refinery',           c:[24.1100,52.7300], icon:'factory', city:'RUW' },
  { name:'Barakah Nuclear Plant',     c:[23.9580,52.2580], icon:'sun',     city:'RUW' },
  { name:'Sharjah Intl Airport',      c:[25.3286,55.5172], icon:'plane',   city:'SHJ' },
  { name:'Al Noor Island',            c:[25.3290,55.3850], icon:'star',    city:'SHJ' },
  { name:'Ajman Corniche',            c:[25.4140,55.4350], icon:'star',    city:'AJM' },
  { name:'Jebel Jais',                c:[25.9400,56.1300], icon:'star',    city:'RAK' },
  { name:'Port of Fujairah',          c:[25.1612,56.3658], icon:'port',    city:'FUJ' }
];

/* ---- Import / export gateways (ports & airports) -------------------------
 * Imports enter through a gateway; freight to a firm = distance x tariff.
 * Jebel Ali TEU 15.5m (2024, REAL) is used only to size capacity labels. */
UAE.GATEWAYS = [
  { id:'JEBELALI', name:'Jebel Ali Port',     c:[25.0223,55.0618], city:'DXB', kind:'sea' },
  { id:'KHALIFA',  name:'Khalifa Port',       c:[24.8100,54.6500], city:'AUH', kind:'sea' },
  { id:'FUJPORT',  name:'Port of Fujairah',   c:[25.1612,56.3658], city:'FUJ', kind:'sea' },
  { id:'KHORF',    name:'Khor Fakkan Port',   c:[25.3550,56.3600], city:'SHJ', kind:'sea' },
  { id:'RUWPORT',  name:'Ruwais Port',        c:[24.1300,52.7300], city:'RUW', kind:'sea' },
  { id:'DXBAIR',   name:'DXB Air Cargo',      c:[25.2532,55.3657], city:'DXB', kind:'air' }
];

/* ---- Geometry helpers ---------------------------------------------------- */
UAE.geo = {
  /** Great-circle distance in km between two [lat,lng] points. */
  km: function (a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toRad, dLng = (b[1] - a[1]) * toRad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a[0] * toRad) * Math.cos(b[0] * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  },
  /** Returns the district containing point p (smallest matching circle), or null. */
  districtAt: function (p) {
    var best = null, bestR = 1e9;
    UAE.DISTRICTS.forEach(function (d) {
      var dist = UAE.geo.km(p, d.c);
      if (dist <= d.r && d.r < bestR) { best = d; bestR = d.r; }
    });
    return best;
  },
  district: function (id) { return UAE.DISTRICTS.find(function (d) { return d.id === id; }); },
  /** Nearest import gateway to a point (sea ports preferred). */
  nearestGateway: function (p) {
    var best = null, bd = 1e9;
    UAE.GATEWAYS.forEach(function (g) {
      var d = UAE.geo.km(p, g.c) * (g.kind === 'air' ? 1.6 : 1);
      if (d < bd) { bd = d; best = g; }
    });
    return { gw: best, km: UAE.geo.km(p, best.c) };
  }
};
