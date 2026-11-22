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
  zoneShare: 0.25,         // share of development spending that goes to the next new zone
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
  { id: 'GZ_AAN_CBD', city: 'AAN', name: 'Al Ain Business District', c: [24.235, 55.725], r: 0.8, zone: 'commercial', land: 1600, foot: 0.9, cost: 2e9, homes: 2000, office: 200000 },
  { id: 'GZ_RUW_HOUSING', city: 'RUW', name: 'Ruwais Housing Community', c: [24.100, 52.730], r: 1.0, zone: 'residential', land: 600, foot: 0.5, cost: 2e9, homes: 10000, office: 0 },
  { id: 'GZ_RUW_MZAYED', city: 'RUW', name: 'Madinat Zayed', c: [23.685, 53.705], r: 1.0, zone: 'commercial', land: 500, foot: 0.6, cost: 1.5e9, homes: 6000, office: 60000 },
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
  { id: 'GZ_FUJ_CBD', city: 'FUJ', name: 'Fujairah Business District', c: [25.130, 56.340], r: 0.7, zone: 'commercial', land: 900, foot: 0.7, cost: 1.5e9, homes: 3000, office: 80000 },
  { id: 'GZ_FUJ_AQAH', city: 'FUJ', name: 'Al Aqah Coast', c: [25.495, 56.360], r: 0.9, zone: 'tourism', land: 1100, foot: 0.7, cost: 1.5e9, homes: 4000, office: 0 },
  { id: 'GZ_FUJ_HOUSE', city: 'FUJ', name: 'Fujairah New Housing (Al Faseel)', c: [25.160, 56.330], r: 0.8, zone: 'residential', land: 700, foot: 0.5, cost: 1.2e9, homes: 8000, office: 0 },
  { id: 'GZ_SHJ_HAMRIYAH', city: 'SHJ', name: 'Hamriyah Free Zone extension', c: [25.490, 55.530], r: 1.0, zone: 'industrial', land: 500, foot: 0.3, cost: 2e9, homes: 0, office: 60000 },
  { id: 'GZ_AAN_IND', city: 'AAN', name: 'Al Ain Industrial City 2', c: [24.150, 55.820], r: 1.0, zone: 'industrial', land: 300, foot: 0.3, cost: 1.5e9, homes: 0, office: 50000 }
];
UAE.GOV_ZONE_COLORS = { residential: 'Housing', commercial: 'Business', tourism: 'Waterfront & tourism', industrial: 'Industry & logistics', freezone: 'Free zone' };

UAE.govState = function () {
  var S = UAE.S;
  if (!S.gov) S.gov = { share: UAE.GOVDEV.share, zones: [], log: [] };
  return S.gov;
};
UAE.govCost = function (k) { var em = UAE.CITIES[k].emirate, C = UAE.GOVDEV.cost; return em === 'DU' ? C.DU : em === 'AD' ? C.AD : C.other; };
/** Opened planned zones become real districts (map, building, plots). Called after loading a save. */
UAE.govRestoreZones = function () {
  for (var i = UAE.DISTRICTS.length - 1; i >= 0; i--) if (UAE.DISTRICTS[i].gov) UAE.DISTRICTS.splice(i, 1);
  var G = UAE.S && UAE.S.gov; if (!G) return;
  G.zones.forEach(function (id) { var z = UAE.PLANNED_ZONES.find(function (x) { return x.id === id; }); if (z) UAE.govAddDistrict(z); });
};
UAE.govAddDistrict = function (z) {
  if (UAE.DISTRICTS.some(function (d) { return d.id === z.id; })) return;
  UAE.DISTRICTS.push({ id: z.id, city: z.city, name: z.name, c: z.c, r: z.r, zone: z.zone, land: z.land, foot: z.foot, gov: true, src: 'EST' });
  if (UAE.S) UAE.S._plotIdx = null;
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
  return Math.max(-10, Math.min(15, (s.civic - 1) * 25)) + Math.max(-8, Math.min(8, (s.roads - 1) * 15));
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
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], C = UAE.CITIES[k], d = c.dev, st = d && d.stats; if (!st) return;
    var cost = UAE.govCost(k), rev = C.govRev * 1e9 / 12 * (c.gdp / C.gdp), budget = rev * Gs.share;
    var grow = 1 + C.growth / 2;                                                     // plan ~6 months ahead
    var need = {
      homes: Math.max(0, st.households * 1.06 * grow - st.homes) * cost.home,
      office: Math.max(0, st.jobs * G.officeShare * G.officeM2 * 1.05 * grow - d.office) * cost.office,
      civic: Math.max(0, c.pop / G.civicPer * 1.1 - d.civic) * G.cost.civic,
      roads: Math.max(0, c.pop * 1.05 - d.roadCap) * G.cost.road
    };
    var tot = need.homes + need.office + need.civic + need.roads, spend = { homes: 0, office: 0, civic: 0, roads: 0 }, left = budget;
    if (tot > 0) Object.keys(need).forEach(function (x) { spend[x] = Math.min(need[x], budget * need[x] / tot); left -= spend[x]; });
    // the rest attracts residents: extra homes (60%) and civic facilities (40%) above target
    if (left > 0) { spend.homes += left * 0.6; spend.civic += left * 0.4; left = 0; }
    var add = { homes: spend.homes / cost.home, office: spend.office / cost.office, civic: spend.civic / G.cost.civic, roads: spend.roads / G.cost.road };
    d.homes += add.homes; d.govHomes += add.homes; d.office += add.office; d.civic += add.civic; d.roadCap += add.roads;
    Object.keys(add).forEach(function (x) { d.built[x] += add[x]; });
    var spent = spend.homes + spend.office + spend.civic + spend.roads;
    c.govExpYtd += spent; d.spentYtd += spent; d.spentTotal += spent; d.sinceZone += spent * UAE.GOVDEV.zoneShare;   // a quarter of it funds the next new zone
    // new zones: the next planned district of this city opens once enough has been invested since the last one
    var zone = null, next = UAE.PLANNED_ZONES.filter(function (z) { return z.city === k && Gs.zones.indexOf(z.id) < 0; })[0];
    if (next && d.sinceZone >= next.cost) {
      d.sinceZone -= next.cost; Gs.zones.push(next.id); UAE.govAddDistrict(next); zone = next;
      d.homes += next.homes; d.govHomes += next.homes; d.office += next.office; d.roadCap += next.homes * G.household;
      Gs.log.unshift({ day: S.day, city: k, zone: next.id, name: next.name }); if (Gs.log.length > 60) Gs.log.pop();
      UAE.news('🏗 Government of ' + UAE.EMIRATES[C.emirate].name + ' opens a new zone: ' + next.name + ' (' + next.zone + (next.homes ? ', ' + UAE.fmt.num(next.homes) + ' homes' : '') +
        (next.office ? ', ' + UAE.fmt.num(next.office) + ' m² of offices' : '') + '). Companies can now build there.', 'event');
    }
    d.last = { day: S.day, budget: budget, spent: spent, spend: spend, add: add, need: need, zone: zone ? zone.name : null };
    d.hist.push({ day: S.day, pop: c.pop, migrants: st.migrants, openings: st.openings, housing: st.housing, unemp: c.unemp, spent: spent });
    if (d.hist.length > 120) d.hist.shift();
    // unemployment: at least the share of the labour force without a job
    c.unemp = Math.max(c.unemp, Math.min(0.25, d.structUnemp || 0));
    if (UAE.cal.isYearEnd(S.day)) d.spentYtd = 0;
  });
};
/** UAE-wide totals for the screens. */
UAE.govTotals = function () {
  var S = UAE.S, t = { pop: 0, labour: 0, jobs: 0, firmJobs: 0, openings: 0, migrants: 0, homes: 0, households: 0, spent: 0, budget: 0, spentYtd: 0, govHomes: 0 };
  Object.keys(S.cities).forEach(function (k) {
    var c = S.cities[k], d = c.dev, s = d && d.stats; t.pop += c.pop; if (!s) return;
    t.labour += s.labour; t.jobs += s.jobs; t.firmJobs += s.firmJobs; t.openings += s.openings; t.migrants += s.migrants; t.homes += s.homes; t.households += s.households;
    t.govHomes += d.govHomes; t.spentYtd += d.spentYtd; if (d.last) { t.spent += d.last.spent; t.budget += d.last.budget; }
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
