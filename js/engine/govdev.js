/* ============================================================================
 * UAE CAPITALISM LAB  -  GOVERNMENT DEVELOPMENT, HOUSING, JOBS & IMMIGRATION
 * (Capitalism Lab-style city growth)
 *  - Jobs: every city has a labour force (62% of residents), jobs in the wider economy (grow with
 *    the city's trend growth, held back if offices run short) plus the staff of every modelled firm.
 *    Job openings = jobs - workers available. New factories and firms create openings.
 *  - Immigration: people come for the openings, but only if there are homes for them (housing supply
 *    vs demand index) and more of them when quality of life is high. Natural growth ~1%/yr.
 *    Not enough jobs -> unemployment rises and some people leave.
 *  - Housing: homes = market stock (private developers build more when rents are high) + government
 *    housing + apartments built by companies in the game. Rents follow the housing index.
 *  - Government: each emirate reinvests a share of its revenue (default 25%) in housing, commercial
 *    buildings (offices), civic facilities (schools, hospitals, parks) and roads, biggest shortage first,
 *    and develops NEW ZONES (planned districts, based on real UAE projects) that open on the map.
 * All costs and planned-zone outlines are EST. Engine only - no DOM.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.GOVDEV = {
  share: 0.25,             // share of each emirate's revenue reinvested in development (setting)
  labour: 0.62,            // residents in the labour force (UAE: high expatriate participation, EST)
  household: 2.9,          // people per home (same as the rent model)
  dependents: 1.6,         // people arriving per worker (worker + family, EST)
  natural: 0.010,          // natural growth & family reunion per year
  zoneShare: 0.40,         // share of development spending that goes to the next new zones (was 0.25: zones opened too slowly)
  projShare: 0.20,         // default share of the development budget for ECONOMIC PROJECTS (metro, ports, airports, power, digital) - setting
  projYield: 0.22,         // AED of extra yearly GDP per AED invested in economic projects (infrastructure capital-output ~4.5x, EST)
  projLag: 18,             // projects come into service over ~18 months (1/18 of the pipeline each month)
  bondSpread: 0.015,       // development bonds pay the CBUAE base rate + 1.5% (EST, typical infrastructure / PPP bond)
  bondYears: 10,           // term of a development bond
  bondEarlyFee: 0.02,      // redeeming early returns 98% of the face value
  savingsSpend: 0.18,      // share of accumulated savings (surplus) spent per year - setting
  savingsSplit: { proj: 0.35, soe: 0.35, util: 0.20, homes: 0.10 },   // how savings are spent
  utilShare: 0.10,         // share of the normal development budget for public utilities (power, water, grids, district cooling)
  utilMaxCut: 0.40,        // utilities investment can cut business power & water prices by up to 40%
  fill: 0.20,              // share of open jobs filled by newcomers each month (if homes exist)
  officeM2: 14, officeShare: 0.30,                 // office workers x m2 each
  civicPer: 40000,         // residents per civic facility (school / clinic / park mix)
  // build costs (EST): per home, per m2 of offices, per civic facility, per resident of road capacity
  cost: { DU: { home: 1.1e6, office: 6500 }, AD: { home: 1.0e6, office: 6000 }, other: { home: 0.6e6, office: 4000 }, civic: 1.8e8, road: 4000 },
  src: 'EST (model); planned zones based on real UAE development projects, outlines approximate'
};

/* Planned zones: real UAE development areas, opened by the government in order once enough has been
 * invested in that city. homes / office = capacity the new zone adds. */
UAE.PLANNED_ZONES = [
  { id: 'GZ_DXB_DSRES', city: 'DXB', name: 'Dubai South Residential City', c: [24.885, 55.165], r: 1.4, zone: 'residential', land: 2600, foot: 0.9, cost: 6e9, homes: 30000, office: 0 },
  { id: 'GZ_DXB_EXPO', city: 'DXB', name: 'Expo City Dubai', c: [24.963, 55.152], r: 1.1, zone: 'commercial', land: 3800, foot: 1.2, cost: 7e9, homes: 8000, office: 600000 },
  { id: 'GZ_DXB_ISLANDS', city: 'DXB', name: 'Dubai Islands', c: [25.305, 55.300], r: 1.3, zone: 'tourism', land: 5200, foot: 1.3, cost: 9e9, homes: 20000, office: 100000 },
  { id: 'GZ_DXB_DLAND', city: 'DXB', name: 'Dubailand / Villanova', c: [25.060, 55.330], r: 1.5, zone: 'residential', land: 2400, foot: 0.8, cost: 8e9, homes: 40000, office: 0 },
  { id: 'GZ_DXB_DLOG', city: 'DXB', name: 'Dubai South Logistics District', c: [24.915, 55.105], r: 1.2, zone: 'industrial', land: 1200, foot: 0.5, cost: 5e9, homes: 0, office: 200000 },
  { id: 'GZ_DXB_MBR', city: 'DXB', name: 'MBR City – District One', c: [25.150, 55.300], r: 0.9, zone: 'residential', land: 4800, foot: 1.0, cost: 7e9, homes: 15000, office: 0 },
  { id: 'GZ_DXB_PJA', city: 'DXB', name: 'Palm Jebel Ali', c: [25.005, 54.990], r: 1.6, zone: 'tourism', land: 6000, foot: 1.4, cost: 14e9, homes: 25000, office: 50000 },
  { id: 'GZ_AUH_SHAMKHA', city: 'AUH', name: 'Al Shamkha / Riyadh City', c: [24.400, 54.700], r: 1.8, zone: 'residential', land: 1800, foot: 0.7, cost: 6e9, homes: 35000, office: 0 },
  { id: 'GZ_AUH_HUDAY', city: 'AUH', name: 'Hudayriyat Island', c: [24.405, 54.335], r: 1.1, zone: 'tourism', land: 4200, foot: 1.1, cost: 7e9, homes: 10000, office: 50000 },
  { id: 'GZ_AUH_RAHA', city: 'AUH', name: 'Al Raha Beach', c: [24.455, 54.605], r: 0.9, zone: 'residential', land: 4000, foot: 1.0, cost: 5e9, homes: 12000, office: 150000 },
  { id: 'GZ_AUH_JUBAIL', city: 'AUH', name: 'Al Jubail Island', c: [24.545, 54.480], r: 1.0, zone: 'residential', land: 3600, foot: 0.8, cost: 6e9, homes: 12000, office: 0 },
  { id: 'GZ_AUH_MAMOURA', city: 'AUH', name: "Al Ma'mourah Logistics Park", c: [24.330, 54.560], r: 1.2, zone: 'industrial', land: 900, foot: 0.4, cost: 4e9, homes: 0, office: 150000 },
  { id: 'GZ_AAN_FOAH', city: 'AAN', name: 'Al Foah New Town', c: [24.300, 55.780], r: 1.3, zone: 'residential', land: 900, foot: 0.6, cost: 2.5e9, homes: 15000, office: 0 },
  { id: 'GZ_AAN_CBD', city: 'AAN', name: 'Al Ain Business District', c: [24.235, 55.725], r: 0.8, zone: 'cbd', land: 1600, foot: 0.9, cost: 2e9, homes: 2000, office: 200000 },
  { id: 'GZ_RUW_HOUSING', city: 'RUW', name: 'Ruwais Housing Community', c: [24.100, 52.730], r: 1.0, zone: 'residential', land: 600, foot: 0.5, cost: 2e9, homes: 10000, office: 0 },
  { id: 'GZ_RUW_MZAYED', city: 'RUW', name: 'Madinat Zayed', c: [23.685, 53.705], r: 1.0, zone: 'cbd', land: 500, foot: 0.6, cost: 1.5e9, homes: 6000, office: 60000 },
  { id: 'GZ_SHJ_ALJADA', city: 'SHJ', name: 'Aljada', c: [25.310, 55.465], r: 1.2, zone: 'residential', land: 1800, foot: 1.0, cost: 3.5e9, homes: 25000, office: 80000 },
  { id: 'GZ_SHJ_TILAL', city: 'SHJ', name: 'Tilal City', c: [25.255, 55.620], r: 1.3, zone: 'residential', land: 1000, foot: 0.6, cost: 2.5e9, homes: 20000, office: 0 },
  { id: 'GZ_SHJ_WATER', city: 'SHJ', name: 'Sharjah Waterfront City', c: [25.470, 55.500], r: 1.2, zone: 'tourism', land: 2000, foot: 0.9, cost: 4e9, homes: 12000, office: 30000 },
  { id: 'GZ_AJM_ZORAH', city: 'AJM', name: 'Al Zorah', c: [25.440, 55.475], r: 0.9, zone: 'tourism', land: 1500, foot: 0.8, cost: 2e9, homes: 6000, office: 20000 },
  { id: 'GZ_AJM_HELIO', city: 'AJM', name: 'Al Helio / Al Yasmeen', c: [25.385, 55.560], r: 1.1, zone: 'residential', land: 700, foot: 0.5, cost: 1.5e9, homes: 12000, office: 0 },
  { id: 'GZ_UAQ_SINIYA', city: 'UAQ', name: 'Siniya Island', c: [25.590, 55.620], r: 0.9, zone: 'tourism', land: 900, foot: 0.6, cost: 1.5e9, homes: 4000, office: 10000 },
  { id: 'GZ_UAQ_FTZ', city: 'UAQ', name: 'UAQ Free Trade Zone', c: [25.515, 55.590], r: 0.8, zone: 'freezone', land: 400, foot: 0.3, cost: 1e9, homes: 0, office: 50000 },
  { id: 'GZ_RAK_HAMRA', city: 'RAK', name: 'Al Hamra Village', c: [25.695, 55.785], r: 0.8, zone: 'residential', land: 1400, foot: 0.8, cost: 2e9, homes: 8000, office: 0 },
  { id: 'GZ_RAK_DHAIT', city: 'RAK', name: 'Al Dhait New Town', c: [25.760, 55.990], r: 1.0, zone: 'residential', land: 700, foot: 0.5, cost: 1.5e9, homes: 10000, office: 20000 },
  { id: 'GZ_RAK_ECON', city: 'RAK', name: 'RAK Economic Zone (Al Hamra)', c: [25.715, 55.840], r: 0.9, zone: 'freezone', land: 500, foot: 0.4, cost: 1.5e9, homes: 0, office: 80000 },
  { id: 'GZ_FUJ_CBD', city: 'FUJ', name: 'Fujairah Business District', c: [25.130, 56.340], r: 0.7, zone: 'cbd', land: 900, foot: 0.7, cost: 1.5e9, homes: 3000, office: 80000 },
  { id: 'GZ_FUJ_AQAH', city: 'FUJ', name: 'Al Aqah Coast', c: [25.495, 56.360], r: 0.9, zone: 'tourism', land: 1100, foot: 0.7, cost: 1.5e9, homes: 4000, office: 0 },
  { id: 'GZ_FUJ_HOUSE', city: 'FUJ', name: 'Fujairah New Housing (Al Faseel)', c: [25.160, 56.330], r: 0.8, zone: 'residential', land: 700, foot: 0.5, cost: 1.2e9, homes: 8000, office: 0 },
  { id: 'GZ_SHJ_HAMRIYAH', city: 'SHJ', name: 'Hamriyah Free Zone extension', c: [25.490, 55.530], r: 1.0, zone: 'industrial', land: 500, foot: 0.3, cost: 2e9, homes: 0, office: 60000 },
  { id: 'GZ_AAN_IND', city: 'AAN', name: 'Al Ain Industrial City 2', c: [24.150, 55.820], r: 1.0, zone: 'industrial', land: 300, foot: 0.3, cost: 1.5e9, homes: 0, office: 50000 }
];
/* More planned zones (added 2026-11-22): further real UAE development projects and master-plan areas
 * (Dubai 2040, Abu Dhabi 2030 ...). Same rules; they open after the zones above, in this order per city. EST outlines. */
UAE.PLANNED_ZONES.push(
  { id: 'GZ_DXB_FURJAN', city: 'DXB', name: 'Al Furjan', c: [25.030, 55.150], r: 1.0, zone: 'residential', land: 2800, foot: 0.8, cost: 5e9, homes: 22000, office: 20000 },
  { id: 'GZ_DXB_IMPZ', city: 'DXB', name: 'Dubai Production City (IMPZ)', c: [25.030, 55.195], r: 0.9, zone: 'commercial', land: 2600, foot: 0.8, cost: 5e9, homes: 9000, office: 250000 },
  { id: 'GZ_DXB_SPORTS', city: 'DXB', name: 'Dubai Sports City & Motor City', c: [25.045, 55.232], r: 1.0, zone: 'residential', land: 2700, foot: 0.8, cost: 5e9, homes: 18000, office: 40000 },
  { id: 'GZ_DXB_MEYDAN', city: 'DXB', name: 'Meydan Horizon', c: [25.168, 55.320], r: 0.7, zone: 'commercial', land: 4500, foot: 1.0, cost: 6e9, homes: 9000, office: 300000 },
  { id: 'GZ_DXB_NADSHEBA', city: 'DXB', name: 'Nad Al Sheba Gardens', c: [25.152, 55.362], r: 1.0, zone: 'residential', land: 3500, foot: 0.8, cost: 5e9, homes: 16000, office: 0 },
  { id: 'GZ_DXB_ACADEMIC', city: 'DXB', name: 'Dubai Academic City', c: [25.130, 55.422], r: 1.0, zone: 'commercial', land: 1800, foot: 0.7, cost: 3e9, homes: 6000, office: 150000 },
  { id: 'GZ_DXB_KHAWANEEJ', city: 'DXB', name: 'Al Khawaneej & Al Warqa', c: [25.200, 55.480], r: 1.5, zone: 'residential', land: 2200, foot: 0.7, cost: 5e9, homes: 25000, office: 0 },
  { id: 'GZ_DXB_ARANCH3', city: 'DXB', name: 'Arabian Ranches 3 / The Valley', c: [25.030, 55.320], r: 1.3, zone: 'residential', land: 2400, foot: 0.7, cost: 6e9, homes: 24000, office: 0 },
  { id: 'GZ_DXB_DAMAC2', city: 'DXB', name: 'Damac Hills 2 / Al Qudra', c: [24.985, 55.390], r: 1.4, zone: 'residential', land: 1500, foot: 0.6, cost: 5e9, homes: 30000, office: 0 },
  { id: 'GZ_DXB_BARARI', city: 'DXB', name: 'Al Barari', c: [25.098, 55.318], r: 0.7, zone: 'residential', land: 5500, foot: 0.8, cost: 3e9, homes: 4000, office: 0 },
  { id: 'GZ_AUH_REEF', city: 'AUH', name: 'Al Reef & Al Samha', c: [24.455, 54.680], r: 1.0, zone: 'residential', land: 2200, foot: 0.7, cost: 4e9, homes: 18000, office: 0 },
  { id: 'GZ_AUH_ZAYEDCITY', city: 'AUH', name: 'Zayed City', c: [24.385, 54.640], r: 1.4, zone: 'residential', land: 2400, foot: 0.8, cost: 7e9, homes: 30000, office: 100000 },
  { id: 'GZ_AUH_MINA', city: 'AUH', name: 'Mina Zayed waterfront', c: [24.520, 54.378], r: 0.8, zone: 'commercial', land: 5000, foot: 1.1, cost: 5e9, homes: 6000, office: 250000 },
  { id: 'GZ_AUH_RAMHAN', city: 'AUH', name: 'Ramhan Island', c: [24.560, 54.625], r: 0.8, zone: 'tourism', land: 4800, foot: 1.0, cost: 5e9, homes: 6000, office: 30000 },
  { id: 'GZ_AUH_BAHIA', city: 'AUH', name: 'Al Bahia & Al Shahama', c: [24.540, 54.690], r: 1.2, zone: 'residential', land: 1800, foot: 0.6, cost: 4e9, homes: 20000, office: 0 },
  { id: 'GZ_AAN_HILI', city: 'AAN', name: 'Al Hili', c: [24.262, 55.760], r: 1.0, zone: 'residential', land: 1000, foot: 0.6, cost: 2e9, homes: 12000, office: 0 },
  { id: 'GZ_AAN_ZAKHER', city: 'AAN', name: 'Zakher / Al Ain South', c: [24.135, 55.700], r: 1.1, zone: 'residential', land: 900, foot: 0.5, cost: 2e9, homes: 12000, office: 20000 },
  { id: 'GZ_AAN_HAFEET', city: 'AAN', name: 'Jebel Hafeet resort', c: [24.070, 55.770], r: 0.8, zone: 'tourism', land: 1200, foot: 0.7, cost: 1.5e9, homes: 2000, office: 10000 },
  { id: 'GZ_RUW_SILA', city: 'RUW', name: "Al Sila'", c: [24.040, 51.770], r: 1.0, zone: 'residential', land: 500, foot: 0.4, cost: 1.5e9, homes: 6000, office: 10000 },
  { id: 'GZ_RUW_MIRFA', city: 'RUW', name: 'Al Mirfa', c: [24.105, 53.445], r: 0.8, zone: 'tourism', land: 600, foot: 0.5, cost: 1.2e9, homes: 4000, office: 10000 },
  { id: 'GZ_SHJ_SRTIP', city: 'SHJ', name: 'Sharjah Research, Technology & Innovation Park', c: [25.290, 55.478], r: 0.9, zone: 'tech', land: 1500, foot: 0.8, cost: 2.5e9, homes: 3000, office: 200000 },
  { id: 'GZ_SHJ_MARYAM', city: 'SHJ', name: 'Maryam Island', c: [25.345, 55.392], r: 0.5, zone: 'tourism', land: 2600, foot: 1.0, cost: 2e9, homes: 4000, office: 20000 },
  { id: 'GZ_SHJ_MASAAR', city: 'SHJ', name: 'Masaar (Suyoh)', c: [25.240, 55.590], r: 1.2, zone: 'residential', land: 900, foot: 0.5, cost: 2.5e9, homes: 18000, office: 0 },
  { id: 'GZ_SHJ_KALBA', city: 'SHJ', name: 'Kalba waterfront', c: [25.040, 56.355], r: 0.8, zone: 'tourism', land: 800, foot: 0.6, cost: 1.2e9, homes: 4000, office: 10000 },
  { id: 'GZ_AJM_JURF', city: 'AJM', name: 'Al Jurf Industrial', c: [25.430, 55.535], r: 1.0, zone: 'industrial', land: 450, foot: 0.3, cost: 1.2e9, homes: 0, office: 40000 },
  { id: 'GZ_AJM_AMERAH', city: 'AJM', name: 'Al Amerah / Ajman Uptown', c: [25.390, 55.600], r: 1.0, zone: 'residential', land: 650, foot: 0.5, cost: 1.5e9, homes: 12000, office: 10000 },
  { id: 'GZ_AJM_MASFOUT', city: 'AJM', name: 'Masfout', c: [24.825, 56.095], r: 0.7, zone: 'tourism', land: 400, foot: 0.4, cost: 0.8e9, homes: 2000, office: 0 },
  { id: 'GZ_UAQ_SALAM', city: 'UAQ', name: 'Al Salam City', c: [25.495, 55.660], r: 1.3, zone: 'residential', land: 500, foot: 0.4, cost: 1.5e9, homes: 15000, office: 10000 },
  { id: 'GZ_RAK_MINAARAB', city: 'RAK', name: 'Mina Al Arab', c: [25.740, 55.870], r: 0.9, zone: 'tourism', land: 1600, foot: 0.8, cost: 2e9, homes: 8000, office: 20000 },
  { id: 'GZ_RAK_CENTRAL', city: 'RAK', name: 'RAK Central business district', c: [25.772, 55.962], r: 0.6, zone: 'cbd', land: 1200, foot: 0.8, cost: 1.5e9, homes: 2000, office: 120000 },
  { id: 'GZ_RAK_JAIS', city: 'RAK', name: 'Jebel Jais mountain resort', c: [25.950, 56.130], r: 1.0, zone: 'tourism', land: 900, foot: 0.6, cost: 1.5e9, homes: 2000, office: 0 },
  { id: 'GZ_FUJ_MIRBAH', city: 'FUJ', name: 'Mirbah & Qidfa', c: [25.270, 56.360], r: 0.8, zone: 'residential', land: 600, foot: 0.5, cost: 1e9, homes: 8000, office: 0 },
  { id: 'GZ_FUJ_BIDIYAH', city: 'FUJ', name: 'Al Bidiyah coast', c: [25.440, 56.362], r: 0.7, zone: 'tourism', land: 900, foot: 0.6, cost: 1e9, homes: 3000, office: 0 },
  { id: 'GZ_FUJ_SAKAMKAM', city: 'FUJ', name: 'Fujairah Industrial (Sakamkam)', c: [25.200, 56.330], r: 0.8, zone: 'industrial', land: 400, foot: 0.3, cost: 1e9, homes: 0, office: 40000 }
);
/* Business & tech districts for every emirate, not only Dubai (real free zones / parks; outlines EST). They come first
 * in each city's queue so the government opens them next. */
(function (Z) {
  var add = [
    { id: 'GZ_AAN_SIP', city: 'AAN', name: 'UAE University Science & Innovation Park', c: [24.196, 55.684], r: 0.7, zone: 'tech', land: 1500, foot: 0.7, cost: 1.5e9, homes: 1000, office: 120000 },
    { id: 'GZ_AJM_FZ', city: 'AJM', name: 'Ajman Free Zone', c: [25.418, 55.448], r: 0.7, zone: 'freezone', land: 900, foot: 0.6, cost: 1e9, homes: 0, office: 120000 },
    { id: 'GZ_AJM_CBD', city: 'AJM', name: 'Ajman Downtown business district', c: [25.404, 55.462], r: 0.5, zone: 'cbd', land: 1400, foot: 0.9, cost: 1e9, homes: 3000, office: 80000 },
    { id: 'GZ_FUJ_CREATIVE', city: 'FUJ', name: 'Fujairah Creative City', c: [25.140, 56.320], r: 0.6, zone: 'tech', land: 800, foot: 0.6, cost: 0.8e9, homes: 0, office: 60000 },
    { id: 'GZ_SHJ_PUB', city: 'SHJ', name: 'Sharjah Publishing City Free Zone', c: [25.287, 55.530], r: 0.6, zone: 'freezone', land: 900, foot: 0.6, cost: 1e9, homes: 0, office: 90000 },
    { id: 'GZ_UAQ_CBD', city: 'UAQ', name: 'Umm Al Quwain business district', c: [25.552, 55.590], r: 0.5, zone: 'cbd', land: 500, foot: 0.6, cost: 0.6e9, homes: 1000, office: 40000 },
    { id: 'GZ_RUW_TECH', city: 'RUW', name: 'Ruwais Energy & Technology Park', c: [24.110, 52.700], r: 0.7, zone: 'tech', land: 500, foot: 0.4, cost: 1e9, homes: 0, office: 60000 }
  ];
  add.forEach(function (z) {
    if (Z.some(function (x) { return x.id === z.id; })) return;
    var i = Z.findIndex(function (x) { return x.city === z.city; });          // first in that city's queue
    Z.splice(i < 0 ? Z.length : i, 0, z);
  });
})(UAE.PLANNED_ZONES);
UAE.GOV_ZONE_COLORS = { residential: 'Housing', commercial: 'Business', tourism: 'Waterfront & tourism', industrial: 'Industry & logistics', freezone: 'Free zone' };

UAE.govState = function () {
  var S = UAE.S;
  if (!S.gov) S.gov = { share: UAE.GOVDEV.share, zones: [], log: [] };
  return S.gov;
};
UAE.govCost = function (k) { var em = UAE.CITIES[k].emirate, C = UAE.GOVDEV.cost; return em === 'DU' ? C.DU : em === 'AD' ? C.AD : C.other; };
/** Opened planned zones become real districts (map, building, plots). Called after loading a save. */
UAE.govRestoreZones = function () {
  if (UAE.UTIL_BASE) { for (var em in UAE.UTIL_BASE) UAE.RULES.utilityMult[em] = UAE.UTIL_BASE[em]; }
  try { UAE.govUtilPrices(); } catch (e) { /* new game: no cities yet */ }
  for (var i = UAE.DISTRICTS.length - 1; i >= 0; i--) if (UAE.DISTRICTS[i].gov) UAE.DISTRICTS.splice(i, 1);
  var G = UAE.S && UAE.S.gov; if (!G) return;
  G.zones.forEach(function (id) { var z = UAE.PLANNED_ZONES.find(function (x) { return x.id === id; }); if (z) UAE.govAddDistrict(z); });
};
UAE.govAddDistrict = function (z) {
  if (UAE.DISTRICTS.some(function (d) { return d.id === z.id; })) return;
  UAE.DISTRICTS.push({ id: z.id, city: z.city, name: z.name, c: z.c, r: z.r, zone: z.zone, land: z.land, foot: z.foot, gov: true, src: 'EST' });
  UAE._plotIdx = null;                    // new districts: rebuild the plot index (engine/plots.js)
};

/** City development state, calibrated on first use so a running save starts in balance. */
UAE.govCity = function (k, jobs, aptUnits) {
  var c = UAE.S.cities[k], C = UAE.CITIES[k], G = UAE.GOVDEV;
  if (!c.dev) {
    var hh = c.pop / G.household, idx0 = Math.max(0.9, Math.min(1.08, 1.05 - (c.rentIdx - 1) * 0.1)), labour = c.pop * G.labour;
    var jobsTot = labour * (1 - Math.max(c.unemp, C.unemp));
    c.dev = { homes: Math.max(0, hh * idx0 - (aptUnits || 0)), govHomes: 0, baseJobs: Math.max(0, jobsTot - (jobs || 0)),
      office: jobsTot * G.officeShare * G.officeM2 * 1.03, civic: c.pop / G.civicPer, roadCap: c.pop,
      spentYtd: 0, spentTotal: 0, sinceZone: 0, built: { homes: 0, office: 0, civic: 0, roads: 0 }, hist: [], stats: null, last: null };
  }
  return c.dev;
};
UAE.govIndexes = function (k, c, jobs, aptUnits) {
  var d = c.dev, G = UAE.GOVDEV, hh = c.pop / G.household, supply = d.homes + (aptUnits || 0), jobsTot = d.baseJobs + (jobs || 0);
  return { households: hh, homes: supply, housing: supply / Math.max(1, hh), jobs: jobsTot, labour: c.pop * G.labour,
    office: d.office / Math.max(1, jobsTot * G.officeShare * G.officeM2), civic: d.civic / Math.max(1, c.pop / G.civicPer), roads: d.roadCap / Math.max(1, c.pop) };
};
/** Quality-of-life bonus from civic facilities and roads (added to the city QoL). */
UAE.govQolBonus = function (c) {
  if (!c.dev || !c.dev.stats) return 0; var s = c.dev.stats;
  return Math.max(-10, Math.min(15, (s.civic - 1) * 25)) + Math.max(-8, Math.min(8, (s.roads - 1) * 15)) + (c.dev.util && c.dev.util.inv > 0 ? Math.min(4, c.dev.util.inv / Math.max(1, c.gdp * 1e9) * 20) : 0);
};
/** Monthly city step, called by UAE.macroMonth: jobs, immigration, housing. Returns population growth and rent pressure. */
UAE.govCityMonth = function (k, c, C, jobs, aptUnits) {
  var G = UAE.GOVDEV, d = UAE.govCity(k, jobs, aptUnits), E = UAE.S.econ || {}, cyc = E.cycle || 0, m = UAE.S.macro;
  var ix0 = UAE.govIndexes(k, c, jobs, aptUnits);
  // private developers build when rents are high (and in property booms)
  d.homes += ix0.households * C.growth / 12 * Math.max(0.3, Math.min(1.8, c.rentIdx)) * (0.7 + 0.3 * (m.property || 1));
  // jobs in the wider economy grow with the city's trend, faster in booms, held back when offices run short
  d.baseJobs *= 1 + C.growth / 12 * Math.min(1, ix0.office) * (1 + 0.5 * cyc);
  d.office += ix0.jobs * G.officeShare * G.officeM2 * C.growth / 12 * 0.8;          // private office building
  var ix = UAE.govIndexes(k, c, jobs, aptUnits), fric = Math.max(0.01, C.unemp);
  var workers = ix.labour * (1 - fric), openings = Math.max(0, ix.jobs - workers), shortfall = Math.max(0, workers - ix.jobs);
  var vacantHomes = Math.max(0, ix.homes - ix.households), attract = Math.max(0.5, Math.min(1.6, c.qol / 60));
  var newWorkers = Math.min(openings * G.fill * attract, vacantHomes * G.household / G.dependents * 0.5);
  var leavers = shortfall * 0.03;
  var migrants = (newWorkers - leavers) * G.dependents, natural = c.pop * G.natural / 12;
  d.stats = { households: ix.households, homes: ix.homes, housing: ix.housing, labour: ix.labour, jobs: ix.jobs, firmJobs: jobs || 0, baseJobs: d.baseJobs,
    openings: openings, shortfall: shortfall, vacant: vacantHomes, migrants: migrants, natural: natural, office: ix.office, civic: ix.civic, roads: ix.roads,
    blockedByHousing: openings * G.fill * attract > vacantHomes * G.household / G.dependents * 0.5 };
  d.structUnemp = ix.labour > 0 ? Math.max(0, 1 - ix.jobs / ix.labour) : 0;
  return { popG: (migrants + natural) / Math.max(1, c.pop), rentPressure: Math.max(-0.3, Math.min(0.3, (1.05 - ix.housing) * 1.2)) };
};

/** Monthly government reinvestment (after the city step): housing, offices, civic, roads, new zones. */
UAE.govDevMonth = function () {
  var S = UAE.S, Gs = UAE.govState(), G = UAE.GOVDEV;
  UAE.govBondsMonth();
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], C = UAE.CITIES[k], d = c.dev, st = d && d.stats; if (!st) return;
    var cost = UAE.govCost(k), base = C.govRev * 1e9 / 12 * (c.gdp / C.gdp);
    var actual = Math.max(c.lastGov ? c.lastGov.rev / 12 : 0, (c.govRevYtd || 0) / Math.max(1, UAE.cal.date(S.day).getUTCMonth() + 1));
    var rev = Math.max(base, actual), budget = rev * Gs.share;          // actual tax income (incl. corporate tax) when it is higher
    var grow = 1 + C.growth / 2;                                                     // plan ~6 months ahead
    var need = {
      homes: Math.max(0, st.households * 1.06 * grow - st.homes) * cost.home,
      office: Math.max(0, st.jobs * G.officeShare * G.officeM2 * 1.05 * grow - d.office) * cost.office,
      civic: Math.max(0, c.pop / G.civicPer * 1.1 - d.civic) * G.cost.civic,
      roads: Math.max(0, c.pop * 1.05 - d.roadCap) * G.cost.road
    };
    // economic projects get their share first (setting), the rest goes to the biggest shortages
    var ppp = d.ppp || {}; d.ppp = { growth: 0, zone: 0, housing: 0 };
    if (c.devPpp) { ['growth', 'zone', 'housing'].forEach(function (x) { ppp[x] = (ppp[x] || 0) + (c.devPpp[x] || 0); }); delete c.devPpp; }            // money companies invested through development bonds last month
    var pShare = Gs.proj != null ? Gs.proj : G.projShare, projBudget = budget * pShare + (ppp.growth || 0);
    var utilBudget = budget * G.utilShare;
    budget -= budget * (pShare + G.utilShare);
    // savings: the emirate spends part of what it has saved (negative debt) every month instead of sitting on it
    var sav = Math.max(0, -(c.govDebt || 0)), draw = sav * (Gs.savings != null ? Gs.savings : G.savingsSpend) / 12, Sp = G.savingsSplit;
    var soeAmt = draw * Sp.soe;
    projBudget += draw * Sp.proj; utilBudget += draw * Sp.util; ppp.housing = (ppp.housing || 0) + draw * Sp.homes;
    if (draw > 0) c.govDebt += draw;                                    // savings drawn down
    d.savDraw = draw;
    UAE.govUtilities(k, c, d, utilBudget);
    if (soeAmt > 0) UAE.govSOEInvest(k, soeAmt);
    var tot = need.homes + need.office + need.civic + need.roads, spend = { homes: 0, office: 0, civic: 0, roads: 0 }, left = budget;
    if (tot > 0) Object.keys(need).forEach(function (x) { spend[x] = Math.min(need[x], budget * need[x] / tot); left -= spend[x]; });
    // the rest attracts residents: extra homes (60%) and civic facilities (40%) above target
    if (left > 0) { spend.homes += left * 0.6; spend.civic += left * 0.4; left = 0; }
    // 'Housing for newcomers' money (development bonds + savings) builds homes AND offices for the people moving in,
    // split by which shortage is bigger this month (homes 30-80%, the rest office space)
    var H = ppp.housing || 0;
    if (H > 0) { var nh = need.homes + need.office, sh = nh > 0 ? Math.max(0.3, Math.min(0.8, need.homes / nh)) : 0.6; spend.homes += H * sh; spend.office += H * (1 - sh); d.housingSplit = sh; }
    var add = { homes: spend.homes / cost.home, office: spend.office / cost.office, civic: spend.civic / G.cost.civic, roads: spend.roads / G.cost.road };
    d.homes += add.homes; d.govHomes += add.homes; d.office += add.office; d.civic += add.civic; d.roadCap += add.roads;
    Object.keys(add).forEach(function (x) { d.built[x] += add[x]; });
    var spent = spend.homes + spend.office + spend.civic + spend.roads;
    c.govExpYtd += spent; d.spentYtd += spent; d.spentTotal += spent; d.sinceZone += spent * G.zoneShare + (ppp.zone || 0);   // 40% of it (+ bond money for zones) funds the next new zones
    // new zones: the next planned districts of this city open as soon as they are funded (several in one month if the money is there)
    var zone = null, opened = [], next;
    while ((next = UAE.PLANNED_ZONES.filter(function (z) { return z.city === k && Gs.zones.indexOf(z.id) < 0; })[0]) && d.sinceZone >= next.cost) {
      d.sinceZone -= next.cost; Gs.zones.push(next.id); UAE.govAddDistrict(next); zone = next; opened.push(next.name);
      d.homes += next.homes; d.govHomes += next.homes; d.office += next.office; d.roadCap += next.homes * G.household;
      Gs.log.unshift({ day: S.day, city: k, zone: next.id, name: next.name }); if (Gs.log.length > 60) Gs.log.pop();
      UAE.news('🏗 Government of ' + UAE.EMIRATES[C.emirate].name + ' opens a new zone: ' + next.name + ' (' + next.zone + (next.homes ? ', ' + UAE.fmt.num(next.homes) + ' homes' : '') +
        (next.office ? ', ' + UAE.fmt.num(next.office) + ' m² of offices' : '') + '). Companies can now build there.', 'gov');
    }
    // every planned zone of this city is open: the zone fund goes to economic projects instead of sitting idle
    if (!next && d.sinceZone > 0) { projBudget += d.sinceZone; d.sinceZone = 0; }
    UAE.govProjects(k, c, d, projBudget);
    d.last = { day: S.day, budget: budget + projBudget + utilBudget, spent: spent + projBudget + utilBudget, spend: spend, add: add, need: need, zone: zone ? opened.join(', ') : null, proj: projBudget, util: utilBudget, soe: soeAmt, draw: draw, ppp: ppp };
    d.hist.push({ day: S.day, pop: c.pop, migrants: st.migrants, openings: st.openings, housing: st.housing, unemp: c.unemp, spent: spent });
    if (d.hist.length > 120) d.hist.shift();
    // unemployment: at least the share of the labour force without a job
    c.unemp = Math.max(c.unemp, Math.min(0.25, d.structUnemp || 0));
    if (UAE.cal.isYearEnd(S.day)) d.spentYtd = 0;
  });
  UAE.govNewsMonth();
};
/** Events log: one 'gov' line per emirate each month with what its government did (from each city's d.last),
 *  plus milestones (power & water price cuts every 5 points, yearly budget summary in December). */
UAE.govNewsMonth = function () {
  var S = UAE.S, Gs = UAE.govState(), A = UAE.fmt.aed, N = UAE.fmt.num, em = {};
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], d = c.dev, L = d && d.last; if (!L || L.day !== S.day) return;
    var e = em[UAE.CITIES[k].emirate] || (em[UAE.CITIES[k].emirate] = { homes: 0, office: 0, civic: 0, roads: 0, spent: 0, proj: 0, util: 0, soe: 0, draw: 0, gdp: 0, zones: [], ppp: 0, rev: 0, exp: 0 });
    e.homes += L.add.homes || 0; e.office += L.add.office || 0; e.civic += L.spend.civic || 0; e.roads += L.spend.roads || 0;
    e.spent += L.spent || 0; e.proj += L.proj || 0; e.util += L.util || 0; e.soe += L.soe || 0; e.draw += L.draw || 0;
    e.gdp += d.proj ? d.proj.lastGdp || 0 : 0; if (L.zone) e.zones.push(L.zone);
    e.ppp += (L.ppp.growth || 0) + (L.ppp.zone || 0) + (L.ppp.housing || 0);
    e.rev += c.govRevYtd || 0; e.exp += c.govExpYtd || 0;
  });
  Gs.utilNote = Gs.utilNote || {};
  Object.keys(em).forEach(function (x) {
    var e = em[x], name = UAE.EMIRATES[x].name, bits = [];
    if (e.spent < 1e6) return;
    if (e.homes >= 1) bits.push(N(e.homes) + ' homes');
    if (e.office >= 1) bits.push(N(e.office) + ' m² of offices');
    if (e.civic > 1e6) bits.push(A(e.civic) + ' civic facilities (schools, clinics, parks)');
    if (e.roads > 1e6) bits.push(A(e.roads) + ' roads & transport');
    if (e.proj > 1e6) bits.push(A(e.proj) + ' economic projects' + (e.gdp > 0.0005 ? ' (+' + A(e.gdp * 1e9) + ' a year of GDP came into service)' : ''));
    if (e.util > 1e6) bits.push(A(e.util) + ' power & water utilities');
    if (e.soe > 1e6) { var so = UAE.govSOE(x); bits.push(A(e.soe) + ' capital into ' + (so ? so.name : 'its state company')); }
    var tail = [];
    if (e.draw > 1e6) tail.push('drew ' + A(e.draw) + ' from savings');
    if (e.ppp > 1e6) tail.push(A(e.ppp) + ' of it came from company development bonds');
    UAE.news('🏛 Government of ' + name + ' spent ' + A(e.spent) + ' this month: ' + (bits.join(', ') || 'running costs') + (tail.length ? '; ' + tail.join(', ') : '') + '.', 'gov');
    var cut = UAE._utilCut && UAE._utilCut[x] ? UAE._utilCut[x].cut : 0, step = Math.floor(cut * 100 / 5) * 5;
    if (step > (Gs.utilNote[x] || 0)) { Gs.utilNote[x] = step; UAE.news('⚡ ' + name + ': utility investment has cut business power & water prices by ' + step + '% (now ' + (cut * 100).toFixed(1) + '% below the published tariff).', 'gov'); }
    if (UAE.cal.isYearEnd(S.day)) UAE.news('📊 ' + name + ' government ' + UAE.cal.year() + ': revenue ' + A(e.rev) + ', spending ' + A(e.exp) + ' - ' + (e.rev >= e.exp ? 'surplus ' + A(e.rev - e.exp) : 'deficit ' + A(e.exp - e.rev)) + '.', 'gov');
  });
};
/** Economic projects (metro, ports, airports, power, digital infrastructure): money enters a pipeline and
 *  comes into service over ~18 months; each AED in service adds projYield AED of yearly GDP to the city
 *  (c.gdp is the demand driver, so shops, factories and services sell more) plus the jobs that come with it. */
UAE.govProjects = function (k, c, d, amt) {
  var G = UAE.GOVDEV, p = d.proj || (d.proj = { pipe: 0, total: 0, live: 0, gdp: 0, last: 0, lastGdp: 0 });
  if (amt > 0) { p.pipe += amt; p.total += amt; c.govExpYtd += amt; d.spentYtd += amt; d.spentTotal += amt; }
  var done = p.pipe / G.projLag; p.pipe -= done; p.live += done; p.last = amt || 0;
  var gain = done * G.projYield / 1e9;                         // AED bn of yearly GDP
  if (gain > 0 && c.gdp > 0) {
    if (d.baseJobs) d.baseJobs *= 1 + gain / c.gdp;            // the wider economy hires for the extra output
    c.gdp += gain; p.gdp += gain;
  }
  p.lastGdp = gain;
};

/* ---- Public utilities: power plants, water desalination, grids, district cooling ----------------------
 * Investment builds up an emirate utility stock; the more of it (relative to the emirate's economy), the cheaper
 * electricity and water are for every business there (up to -40%), and quality of life rises a little. */
UAE.UTIL_BASE = UAE.UTIL_BASE || JSON.parse(JSON.stringify(UAE.RULES.utilityMult));
UAE.govUtilities = function (k, c, d, amt) {
  var u = d.util || (d.util = { inv: 0, last: 0 });
  if (amt > 0) { u.inv += amt; c.govExpYtd += amt; d.spentYtd += amt; d.spentTotal += amt; }
  u.last = amt || 0;
  UAE.govUtilPrices();
};
/** Business power & water price multiplier per emirate = published tariff x (1 - cut); cut grows with utility investment. */
UAE.govUtilPrices = function () {
  var S = UAE.S; if (!S || !S.cities) return;
  var byEm = {};
  Object.keys(S.cities).forEach(function (k) {
    var em = UAE.CITIES[k].emirate, c = S.cities[k], inv = c.dev && c.dev.util ? c.dev.util.inv : 0;
    var e = byEm[em] || (byEm[em] = { inv: 0, gdp: 0 }); e.inv += inv; e.gdp += c.gdp * 1e9;
  });
  Object.keys(byEm).forEach(function (em) {
    var e = byEm[em], cut = UAE.GOVDEV.utilMaxCut * (1 - Math.exp(-e.inv / Math.max(1, e.gdp * 0.15)));   // ~15% of a year's GDP invested -> 63% of the max cut
    e.cut = cut; UAE.RULES.utilityMult[em] = (UAE.UTIL_BASE[em] || 1) * (1 - cut);
  });
  UAE._utilCut = byEm;
};

/* ---- State-owned companies: governments own businesses that earn money ---------------------------------
 * Dubai -> Dubai Holding, Abu Dhabi (incl. Al Ain, Al Dhafra) -> Mubadala; the other emirates get a state
 * enterprise company (SYN). Part of the savings is injected as capital; the company's CEO builds businesses
 * with it, and its dividends (and those of every company the government owns shares in) go to the budget. */
UAE.GOV_OWNER_CITY = { GOVDU: 'DXB', ICD: 'DXB', DUBAIHOLD: 'DXB', GOVAD: 'AUH', MUBADALA: 'AUH', ADQ: 'AUH', EIA: 'AUH', GOVSH: 'SHJ', GOVRK: 'RAK', GOVFU: 'FUJ', GOVAJ: 'AJM', GOVUQ: 'UAQ' };
UAE.SOE_FOR = { DU: ['DUBAIHOLDING', 'GOVDU'], AD: ['MUBADALA', 'GOVAD'],
  SH: ['SOE_SHJ', 'GOVSH', 'Sharjah State Enterprises', 'SHJ'], AJ: ['SOE_AJM', 'GOVAJ', 'Ajman State Enterprises', 'AJM'], UQ: ['SOE_UAQ', 'GOVUQ', 'Umm Al Quwain State Enterprises', 'UAQ'],
  RK: ['SOE_RAK', 'GOVRK', 'Ras Al Khaimah State Enterprises', 'RAK'], FU: ['SOE_FUJ', 'GOVFU', 'Fujairah State Enterprises', 'FUJ'] };
UAE.govSOE = function (em) {
  var x = UAE.SOE_FOR[em]; if (!x) return null;
  var co = UAE.S.companies[x[0]];
  if (!co && x[2]) {                                   // small emirates: a state enterprise company (SYN), founded on first use
    UAE.seedCompany({ id: x[0], name: x[2], t: '', x: '', st: 'UNLISTED', hq: x[3], sec: 'holding', rev: 0.2, ni: 0.02, fin: 'SYN (state enterprise)', sh: 1, own: [[x[1], 100]] });
    co = UAE.S.companies[x[0]]; if (co) { co.real = true; co.soe = true; co.payout = 0.5; }
  }
  if (co) co.soe = true;
  return co && co.status !== 'BANKRUPT' ? co : null;
};
UAE.govSOEInvest = function (k, amt) {
  var em = UAE.CITIES[k].emirate, co = UAE.govSOE(em); if (!co) return;
  var pol = UAE.policy(co); pol.aggression = 'max'; if (!(pol.maxNewPerMonth >= 10)) pol.maxNewPerMonth = 10;   // state company keeps building
  // it can only put so much to work: once it holds more than ~6 months of injections as idle cash, the rest goes to projects
  var idle = co.bs.cash - amt * 6;
  if (idle > 0) { var back = Math.min(amt, idle); amt -= back; var cc = UAE.S.cities[k]; if (cc.dev) UAE.govProjects(k, cc, cc.dev, back); }
  if (amt <= 0) return;
  var code = UAE.SOE_FOR[em][1], px = Math.max(0.01, UAE.bookValue(co) / Math.max(1, co.shares)), n = Math.round(amt / px);
  UAE.L.issueEquity(co, amt); co.shares += n; co.holders['I:' + code] = (co.holders['I:' + code] || 0) + n;
  var c = UAE.S.cities[k]; c.govExpYtd += amt; c.dev.soeTotal = (c.dev.soeTotal || 0) + amt;
  co.payout = Math.max(co.payout || 0, 0.5);           // state companies pay half their profit back to the budget
};
/** Dividends to government holders go into that emirate's budget (called from UAE.distribute). */
UAE.govDividend = function (holderKey, amt) {
  var code = holderKey.slice(2), k = UAE.GOV_OWNER_CITY[code]; if (!k || !UAE.S.cities[k]) return false;
  var c = UAE.S.cities[k]; c.govRevYtd += amt; c.soeDivYtd = (c.soeDivYtd || 0) + amt; c.soeDivTotal = (c.soeDivTotal || 0) + amt;
  return true;
};

/* ---- Development bonds: companies invest in the government's programmes ----------------------------
 * The money joins the city's development budget at the next month end (economic projects, new zones or
 * housing). The bond pays the CBUAE base rate + 1.5% a year (monthly coupons, rate fixed at purchase) and
 * the face value back after 10 years; it can be redeemed early at 98%. Booked as an investment (asset),
 * coupons as interest income - the government pays them from its budget. */
UAE.GOV_PROGRAMMES = { growth: '🚇 Economic projects (metro, ports, airports, power, digital)', zone: '🏗 New zones (opens planned districts sooner)', housing: '🏠 Housing & offices for newcomers' };
UAE.govInvest = function (co, city, amt, prog) {
  var S = UAE.S, c = S.cities[city];
  if (!co || co.foreign) return { ok: false, why: 'No company selected.' };
  if (!c) return { ok: false, why: 'Choose a city.' };
  if (!UAE.GOV_PROGRAMMES[prog]) prog = 'growth';
  amt = Math.round(+amt || 0);
  if (amt < 1e6) return { ok: false, why: 'Minimum AED 1m.' };
  if (amt > co.bs.cash) return { ok: false, why: 'Not enough cash (' + UAE.fmt.aed(co.bs.cash) + ').' };
  var G = UAE.GOVDEV, pend = c.dev ? (c.dev.ppp = c.dev.ppp || { growth: 0, zone: 0, housing: 0 }) : (c.devPpp = c.devPpp || { growth: 0, zone: 0, housing: 0 });   // before the first month end: held until the city model starts
  UAE.L.invest(co, amt, 'invest');
  pend[prog] = (pend[prog] || 0) + amt;
  var b = { id: 'GB' + (S.nextId++), city: city, prog: prog, face: amt, rate: S.macro.rate + G.bondSpread, day: S.day, mat: S.day + Math.round(G.bondYears * 365), paid: 0 };
  (co.devBonds = co.devBonds || []).push(b);
  var Gs = UAE.govState(); Gs.ppp = (Gs.ppp || 0) + amt;
  UAE.news('🏛 ' + co.name + ' invests ' + UAE.fmt.aed(amt) + ' in ' + UAE.CITIES[city].name + ' development bonds (' + UAE.GOV_PROGRAMMES[prog].replace(/^\S+ /, '').toLowerCase() + ', ' + (b.rate * 100).toFixed(2) + '% a year for ' + G.bondYears + ' years).', 'gov');
  return { ok: true, bond: b };
};
UAE.govRedeem = function (co, id) {
  var i = (co.devBonds || []).findIndex(function (b) { return b.id === id; }); if (i < 0) return { ok: false, why: 'Bond not found.' };
  var b = co.devBonds[i], early = UAE.S.day < b.mat, cash = b.face * (early ? 1 - UAE.GOVDEV.bondEarlyFee : 1);
  UAE.L.divest(co, cash, b.face, 'invest'); co.devBonds.splice(i, 1);
  var c = UAE.S.cities[b.city]; if (c) c.govExpYtd += cash;    // the government repays the bond from its budget
  return { ok: true, cash: cash, early: early };
};
/** Monthly coupons and maturities (called from govDevMonth). */
UAE.govBondsMonth = function () {
  UAE.allCos().forEach(function (co) {
    if (!co.devBonds || !co.devBonds.length) return;
    co.devBonds.slice().forEach(function (b) {
      var cpn = b.face * b.rate / 12; UAE.L.income(co, 'interestInc', cpn, 'op'); b.paid += cpn;
      var c = UAE.S.cities[b.city]; if (c) c.govExpYtd += cpn;
      if (UAE.S.day >= b.mat) { UAE.govRedeem(co, b.id); UAE.news('🏛 ' + co.name + ': ' + UAE.CITIES[b.city].name + ' development bond of ' + UAE.fmt.aed(b.face) + ' repaid at maturity.', 'gov'); }
    });
  });
};
UAE.devBondTotal = function (co) { return (co.devBonds || []).reduce(function (s, b) { return s + b.face; }, 0); };

/** UAE-wide totals for the screens. */
UAE.govTotals = function () {
  var S = UAE.S, t = { pop: 0, labour: 0, jobs: 0, firmJobs: 0, openings: 0, migrants: 0, homes: 0, households: 0, spent: 0, budget: 0, spentYtd: 0, govHomes: 0, proj: 0, projGdp: 0, projPipe: 0 };
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], d = c.dev, s = d && d.stats; t.pop += c.pop; if (!s) return;
    t.labour += s.labour; t.jobs += s.jobs; t.firmJobs += s.firmJobs; t.openings += s.openings; t.migrants += s.migrants; t.homes += s.homes; t.households += s.households;
    t.govHomes += d.govHomes; t.spentYtd += d.spentYtd; if (d.last) { t.spent += d.last.spent; t.budget += d.last.budget; }
    if (d.proj) { t.proj += d.proj.last; t.projGdp += d.proj.gdp; t.projPipe += d.proj.pipe; }
  });
  t.housing = t.homes / Math.max(1, t.households);
  return t;
};
/** Job openings created by firms in a city, by owner (for the jobs table). */
UAE.cityFirmJobs = function (k) {
  var out = { total: 0, mine: 0, byType: {} };
  UAE.allFirms().forEach(function (f) {
    if (f.city !== k || f.status !== 'open') return;
    var T = UAE.FIRM_TYPES[f.type], j = T.staff * (1 + 0.8 * (f.size - 1));
    out.total += j; if (UAE.isHuman(UAE.co(f.owner))) out.mine += j;
    var kind = T.kind; out.byType[kind] = (out.byType[kind] || 0) + j;
  });
  return out;
};
