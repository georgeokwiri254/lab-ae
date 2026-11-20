/* ============================================================================
 * UAE CAPITALISM LAB  -  DAILY MICRO SIMULATION
 * Order of one day (master_v3 §13.5 / F9.1):
 *   1 construction   2 production (farm/mine/oil/factory)   3 retail sales
 *   4 retail & warehouse purchasing   5 B2B + export sales
 *   6 services / hotels / real estate / media / digital / banks / insurance
 *   7 fixed costs (wages, DEWA-tariff utilities, ads, training, maintenance)
 *   8 legacy core business of real groups   9 brand & technology drift
 * Month/year closing, macro, markets and AI live in macro.js / market.js / ai.js
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

/* ------------------------------------------------ firm-level bookkeeping */
UAE.fIncome = function (f, line, amt) { UAE.L.income(UAE.co(f.owner), line, amt); f.m.rev += amt; };
UAE.fExpense = function (f, line, amt) { UAE.L.expense(UAE.co(f.owner), line, amt); f.m.cost += amt; };
UAE.fCogs = function (f, amt) { UAE.L.cogs(UAE.co(f.owner), amt); f.m.cost += amt; };

/* ------------------------------------------------------- stock helpers */
UAE.stockAdd = function (f, pid, q, unitCost, qual) {
  if (q <= 0) return;
  var s = f.stock[pid] || (f.stock[pid] = { q: 0, cost: 0, qual: 50 });
  var tot = s.q + q;
  s.cost = (s.q * s.cost + q * unitCost) / tot;
  s.qual = (s.q * s.qual + q * (qual == null ? 50 : qual)) / tot;
  s.q = tot;
};
/** Remove q units; returns cost basis removed. */
UAE.stockTake = function (f, pid, q) {
  var s = f.stock[pid]; if (!s || q <= 0) return 0;
  q = Math.min(q, s.q); s.q -= q; var c = q * s.cost;
  if (s.q < 1e-6) { delete f.stock[pid]; }
  return c;
};
UAE.stockQ = function (f, pid) { return f.stock[pid] ? f.stock[pid].q : 0; };

/* ------------------------------------------------------- price helpers */
/** Current world price of a product, applying oil/gold shocks. */
UAE.worldPrice = function (pid) {
  var P = UAE.P[pid], m = UAE.S.macro, base = P.world || P.imp;
  if (['crude','petrol','jetfuel','gas','polymer','urea'].indexOf(pid) >= 0) base *= m.oil;
  if (pid === 'gold' || pid === 'jewelry') base *= m.gold;
  return base;
};
UAE.importBase = function (pid) {
  var P = UAE.P[pid], m = UAE.S.macro, base = P.imp;
  if (['crude','petrol','jetfuel','gas','polymer','urea'].indexOf(pid) >= 0) base *= m.oil;
  if (pid === 'gold' || pid === 'jewelry') base *= m.gold;
  return base;
};
/** Freight cost per unit between two points (EST road tariff; own logistics firm -25%). */
UAE.freight = function (pid, a, b, coId, city) {
  var P = UAE.P[pid], km = UAE.geo.km(a, b) * 1.25 + 3;   // road factor
  var cost = P.t * km * UAE.RULES.freightPerTonKm;
  if (coId && UAE.hasFirmIn(coId, 'logistics', city)) cost *= 0.75;
  return cost;
};
UAE.hasFirmIn = function (coId, type, city, emirate) {
  var F = UAE.S.firms;
  for (var k in F) {
    var f = F[k];
    if (f.owner === coId && f.type === type && f.status === 'open' &&
        (!city || f.city === city) && (!emirate || UAE.CITIES[f.city].emirate === emirate)) return true;
  }
  return false;
};
/** Landed cost of importing one unit to a firm: CIF + 5% customs + importer margin + freight. */
UAE.landedImport = function (pid, f) {
  var gw = UAE.geo.nearestGateway(f.c);
  var em = UAE.CITIES[f.city].emirate;
  var margin = UAE.hasFirmIn(f.owner, 'importer', null, em) ? 0.0 : 0.06;
  var unit = UAE.importBase(pid) * (1 + UAE.RULES.customs) * (1 + margin);
  var fr = UAE.P[pid].t * (gw.km * 1.25 + 3) * UAE.RULES.freightPerTonKm;
  return { unit: unit + fr, freight: fr, gateway: gw.gw.name, quality: UAE.P[pid].qImp };
};

/** All supply options for product pid delivered to firm f, cheapest first. */
UAE.supplyOptions = function (f, pid) {
  var out = [], imp = UAE.landedImport(pid, f);
  out.push({ id: 'IMPORT', name: 'Import via ' + imp.gateway, unit: imp.unit, quality: imp.quality, avail: Infinity, owner: null });
  UAE.allFirms().forEach(function (g) {
    if (g.id === f.id || g.status !== 'open') return;
    var k = UAE.FIRM_TYPES[g.type].kind;
    if (['factory','farm','mine','oil','warehouse'].indexOf(k) < 0) return;
    var line = g.lines.find(function (l) { return l.pid === pid; });
    if (!line) return;
    var s = g.stock[pid], same = g.owner === f.owner;
    var unit = (same ? (s ? s.cost : UAE.importBase(pid)) : line.price) + UAE.freight(pid, g.c, f.c, f.owner, f.city);
    out.push({ id: g.id, name: g.name + (same ? ' (own)' : ' - ' + UAE.co(g.owner).name), unit: unit,
      quality: s ? s.qual : 50, avail: s ? s.q : 0, owner: g.owner, km: UAE.geo.km(g.c, f.c) });
  });
  out.sort(function (a, b) { return a.unit - b.unit; });
  return out;
};

/** Move q units of pid from a supplier into firm f, paying as appropriate. Returns units delivered. */
UAE.procure = function (f, pid, q, supplierId) {
  if (q <= 0) return 0;
  var buyer = UAE.co(f.owner);
  if (!supplierId || supplierId === 'IMPORT' || !UAE.S.firms[supplierId]) {
    var imp = UAE.landedImport(pid, f);
    var cost = imp.unit * q;
    UAE.L.buyInventory(buyer, cost);
    UAE.stockAdd(f, pid, q, imp.unit, imp.quality);
    UAE.S.freightPool[f.city] = (UAE.S.freightPool[f.city] || 0) + imp.freight * q;
    // customs duty flows to the federal/emirate budget (reported at city level)
    UAE.S.cities[f.city].govRevYtd += UAE.importBase(pid) * UAE.RULES.customs * q;
    UAE.S.cities[f.city].importsM = (UAE.S.cities[f.city].importsM || 0) + UAE.importBase(pid) * q;   // city graphs: imports
    return q;
  }
  var g = UAE.S.firms[supplierId], s = g.stock[pid];
  if (!s || s.q <= 0) return 0;
  q = Math.min(q, s.q);
  var qual = s.qual, fr = UAE.freight(pid, g.c, f.c, f.owner, f.city);
  var basis = UAE.stockTake(g, pid, q);
  UAE.S.freightPool[f.city] = (UAE.S.freightPool[f.city] || 0) + fr * q;
  if (g.owner === f.owner) {                 // internal transfer at cost (no profit, consolidates cleanly)
    UAE.L.buyInventory(buyer, fr * q);       // freight paid in cash, capitalised into stock
    UAE.stockAdd(f, pid, q, basis / q + fr, qual);
  } else {                                   // arm's-length sale
    var line = g.lines.find(function (l) { return l.pid === pid; });
    var price = line ? line.price : basis / q;
    UAE.fIncome(g, 'revenue', price * q); UAE.fCogs(g, basis);
    UAE.L.buyInventory(buyer, (price + fr) * q);
    UAE.stockAdd(f, pid, q, price + fr, qual);
    if (line) line.sold += q;
  }
  return q;
};

/* ------------------------------------------------ demand fundamentals */
UAE.season = function (kind) { return UAE.SEASON[kind][UAE.cal.month()]; };
/** Daily consumer demand (units) for product pid in a city. */
UAE.cityDemand = function (city, pid) {
  var P = UAE.P[pid], C = UAE.CITIES[city], c = UAE.S.cities[city], m = UAE.S.macro;
  if (!P.perCap) return 0;
  var income = Math.pow(C.income * c.wageIdx / (c.cpiIdx / 100), 0.8);
  var touristPresent = c.tourists * 3.8 / 365 * UAE.season('tourism') * m.tourism;
  var d = (c.pop * income + touristPresent * (P.tour || 0)) * P.perCap / 365;
  d *= UAE.season('retail') * m.retail;
  var fx = c.fx || {};
  if (fx.retail) d *= 1 + fx.retail;
  if (fx.elec && ['phone','laptop','tv'].indexOf(pid) >= 0) d *= 1 + fx.elec;
  return d;
};

/* ======================================================== DAILY TICK ==== */
UAE.simDay = function () {
  var S = UAE.S, firms = UAE.allFirms();
  // reset per-day pools
  var freightPrev = S.freightPool; S.freightPool = {}; S._freightYesterday = freightPrev;
  var adPrev = S.adPool; S.adPool = {}; S._adYesterday = adPrev;

  // 1 construction
  firms.forEach(function (f) {
    if (f.status === 'construction' && S.day >= f.openDay) {
      f.status = 'open';
      if (UAE.isHuman(UAE.co(f.owner))) UAE.news(f.name + ' is now open in ' + UAE.CITIES[f.city].name + '.', 'firm');
    }
  });
  var open = firms.filter(function (f) { return f.status === 'open'; });

  // 2 production
  open.forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (k === 'farm') UAE.produceFarm(f);
    else if (k === 'mine' || k === 'oil') UAE.produceResource(f);
    else if (k === 'factory') UAE.produceFactory(f);
  });

  // 3 retail sales (city x product competition)
  UAE.retailSales(open);

  // 4 purchasing (supplyMet = share of the order the supplier could fill: the purchasing supply indicator)
  open.forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (k === 'retail') f.lines.forEach(function (l) {
      var cap = UAE.lineCap(f, l), target = cap * 5, need = target - UAE.stockQ(f, l.pid);
      if (need > cap * 0.5) { var got = UAE.procure(f, l.pid, need, l.supplier); l.supplyMet = (l.supplyMet == null ? 1 : l.supplyMet) * 0.7 + 0.3 * got / need; }
      else l.supplyMet = (l.supplyMet == null ? 1 : l.supplyMet) * 0.7 + 0.3;
    });
    if (k === 'warehouse') f.lines.forEach(function (l) {
      var unit = UAE.landedImport(l.pid, f).unit, target = 2.5e6 * f.size / unit, need = target - UAE.stockQ(f, l.pid);
      if (need > target * 0.2) {
        var got = UAE.procure(f, l.pid, need, l.supplier === f.id ? 'IMPORT' : l.supplier);
        // bulk import discount 3% for warehouses
        if (got && (l.supplier === 'IMPORT' || !l.supplier)) {
          var s = f.stock[l.pid], refund = unit * got * 0.015;       // rebate lowers stock value by exactly the refund
          s.cost -= refund / s.q; UAE.L._cash(UAE.co(f.owner), refund, 'op');
        }
      }
      if (!l.priceSet) l.price = (f.stock[l.pid] ? f.stock[l.pid].cost : unit) * 1.05;
    });
  });

  // 5 B2B demand & exports
  UAE.b2bAndExport(open);

  // 6 service-type firms
  UAE.servicesDay(open);

  // 7 fixed costs
  open.forEach(UAE.fixedCosts);
  firms.forEach(function (f) { if (f.status === 'construction') UAE.constructionCosts(f); });

  // 8 legacy core business of real groups
  UAE.allCos().forEach(function (co) { if (co.legacy) UAE.legacyDay(co); });

  // 9 brand (awareness + loyalty, campaigns) & technology drift; wholesale price formation
  UAE.brandDay();
  UAE.allCos().forEach(UAE.brandTechDay);
  UAE.wholesaleDay();
};

/* ------------------------------------------------------------ capacity */
UAE.lineCap = function (f, l) {
  var P = UAE.P[l.pid];
  return (P.cap || 10) * (1 + 0.8 * (f.size - 1)) * f.eff;
};

/* -------------------------------------------------------------- farms */
UAE.produceFarm = function (f) {
  var co = UAE.co(f.owner);
  f.lines.forEach(function (l) {
    var spec = UAE.FARM[l.pid]; if (!spec) return;
    var mult = 1;
    if (spec.harvest) mult = spec.harvest.indexOf(UAE.cal.month()) >= 0 ? 3.2 : 0.15;
    if (l.pid === 'veg') mult = UAE.SEASON.tourism[UAE.cal.month()] > 0.9 ? 1.2 : 0.6; // greenhouse output lower in summer heat
    var q = spec.out * f.size * f.eff * mult / Math.max(1, f.lines.length) * (l.rate == null ? 1 : l.rate);
    if (UAE.stockQ(f, l.pid) > spec.out * f.size * 15) return;   // storage full
    var unit = spec.cost * (UAE.RULES.utilityMult[UAE.CITIES[f.city].emirate] || 1);
    UAE.L.buyInventory(co, unit * q);
    UAE.stockAdd(f, l.pid, q, unit, 45 + (co.tech[l.pid] || 50) * 0.4);
    l.made += q; UAE.wmCount(l.pid, 'made', q);
    if (!l.priceSet) l.price = Math.max(unit * 1.05, UAE.wholesalePrice(l.pid));
  });
};
/** Mines & wells extract from their natural resource site: grade sets output, cost multiplier the
 *  extraction cost, the deposit's ore quality the product quality. The reserve runs out. */
UAE.produceResource = function (f) {
  var co = UAE.co(f.owner), dep = f.deposit ? UAE.DEP[f.deposit] : null, st = dep ? UAE.depState(dep.id) : null;
  f.lines.forEach(function (l) {
    var spec = UAE.RESOURCE[l.pid]; if (!spec) return;
    if (dep && dep.res !== l.pid) return;                          // a site only yields its own resource
    if (!st && f.reserve == null) f.reserve = spec.out * 365 * 25 * f.size;   // legacy firms without a site (SYN)
    var left = st ? st.left : f.reserve;
    if (left <= 0) {
      if (!f._exhausted) { f._exhausted = true; UAE.news(f.name + ': the ' + (dep ? dep.name : 'deposit') + ' reserve is exhausted. Production stopped.', UAE.isHuman(co) ? 'warning' : 'ai'); }
      return;
    }
    if (UAE.stockQ(f, l.pid) > spec.out * f.size * 15) return;   // storage full
    var q = Math.min(left, spec.out * f.size * f.eff * (dep ? dep.grade : 1) * (l.rate == null ? 1 : l.rate));
    if (st) { st.left -= q; f.reserve = st.left; } else f.reserve -= q;
    var unit = spec.cost * (dep ? dep.cost : 1);          // offshore / sour-gas sites carry a higher cost multiplier
    UAE.L.buyInventory(co, unit * q);
    UAE.stockAdd(f, l.pid, q, unit, dep ? dep.qual : 60);
    l.made += q; UAE.wmCount(l.pid, 'made', q);
    if (!l.priceSet) l.price = Math.max(unit * 1.05, UAE.wholesalePrice(l.pid));
  });
};
UAE.produceFactory = function (f) {
  var co = UAE.co(f.owner);
  f.lines.forEach(function (l) {
    if (!l.on) return;
    var P = UAE.P[l.pid], rec = P.rec; if (!rec) return;
    var maxOut = rec.cap * (1 + 0.8 * (f.size - 1)) * f.eff / Math.max(1, f.lines.length) * 1.5 * (l.rate == null ? 1 : l.rate);
    if (UAE.stockQ(f, l.pid) > maxOut * 10) return;        // warehouse full: production pauses
    // keep 3 days of inputs on hand, own suppliers first, then market, then import
    rec.in.forEach(function (inp) {
      var want = maxOut * inp[1] * 3, have = UAE.stockQ(f, inp[0]);
      if (have >= want * 0.6) return;
      var need = want - have, opts = UAE.supplyOptions(f, inp[0]);
      var own = opts.filter(function (o) { return o.owner === f.owner && o.avail > 0; });
      var mkt = opts.filter(function (o) { return o.owner && o.owner !== f.owner && o.avail > 0; });
      var order = own.concat(mkt);
      for (var i = 0; i < order.length && need > 0; i++) need -= UAE.procure(f, inp[0], need, order[i].id);
      if (need > 0) UAE.procure(f, inp[0], need, 'IMPORT');
    });
    var units = maxOut;
    rec.in.forEach(function (inp) { units = Math.min(units, UAE.stockQ(f, inp[0]) / inp[1]); });
    if (units <= 0) return;
    var cost = 0, qIn = 0;
    rec.in.forEach(function (inp) {
      var s = f.stock[inp[0]]; qIn += s ? s.qual : 50; cost += UAE.stockTake(f, inp[0], units * inp[1]);
      UAE.wmCount(inp[0], 'used', units * inp[1]);
    });
    qIn /= rec.in.length;
    var lab = rec.lab * units * (UAE.RULES.utilityMult[UAE.CITIES[f.city].emirate] || 1);
    UAE.L.buyInventory(co, lab);
    var qual = Math.min(100, (co.tech[l.pid] || 50) * 0.75 + qIn * 0.25 + (f.training || 0) * 0.1);
    UAE.stockAdd(f, l.pid, units, (cost + lab) / units, qual);
    l.made += units; UAE.wmCount(l.pid, 'made', units);
    // default selling price: never below cost + 12%; B2B goods follow the UAE wholesale market, consumer goods import parity
    var mkt = UAE.P[l.pid].kind === 'consumer' ? UAE.importBase(l.pid) * 0.97 : UAE.wholesalePrice(l.pid);
    if (!l.priceSet) l.price = Math.max((cost + lab) / units * 1.12, mkt);
  });
};

/* ----------------------------------------------------------- retail */
UAE.mallBoost = function (f) {
  var b = 0;
  UAE.allFirms().forEach(function (m) { if (m.type === 'mall' && m.status === 'open' && UAE.geo.km(m.c, f.c) < 0.6) b = Math.max(b, 0.25 + 0.03 * m.size); });
  return b;
};
/* UAE.retailSales (city x product competition, demand curve, ratings, market stats) lives in engine/micro.js. */

/* -------------------------------------------------- B2B and exports */
UAE.b2bAndExport = function (open) {
  var S = UAE.S;
  var producers = open.filter(function (f) { return ['factory','farm','mine','oil','warehouse'].indexOf(UAE.FIRM_TYPES[f.type].kind) >= 0; });
  // B2B industrial demand per city (cement, aluminium, glass, jet fuel ...)
  UAE.PRODUCTS.forEach(function (P) {
    if (!P.b2b) return;
    var sellers = producers.filter(function (f) { return f.lines.some(function (l) { return l.pid === P.id; }) && UAE.stockQ(f, P.id) > 0; });
    if (!sellers.length) {                          // nobody local sells it: the whole city demand is imported
      Object.keys(S.cities).forEach(function (city) { UAE.wmCount(P.id, 'used', S.cities[city].gdp * P.b2b / 365 * S.macro.property); });
      return;
    }
    Object.keys(S.cities).forEach(function (city) {
      var D = S.cities[city].gdp * P.b2b / 365 * S.macro.property;
      var ctr = UAE.CITIES[city].center, imp = UAE.importBase(P.id) * (1 + UAE.RULES.customs) * 1.06;
      var sum = 1.5, w = sellers.map(function (f) {
        var l = f.lines.find(function (x) { return x.pid === P.id; });
        var landed = l.price + UAE.freight(P.id, f.c, ctr);
        var a = Math.pow(imp / landed, 3) * Math.pow((f.stock[P.id].qual) / 55, 0.5); sum += a; return { f: f, l: l, a: a };
      });
      UAE.wmCount(P.id, 'used', D);                    // city construction / industrial demand counts toward UAE demand
      w.forEach(function (x) {
        var q = Math.min(UAE.stockQ(x.f, P.id), D * x.a / sum);
        if (q <= 0) return;
        var basis = UAE.stockTake(x.f, P.id, q);
        UAE.fIncome(x.f, 'revenue', x.l.price * q); UAE.fCogs(x.f, basis); x.l.sold += q;
      });
    });
  });
  // exports: anything piling up beyond ~8 days of output leaves via the nearest port
  producers.forEach(function (f) {
    if (UAE.FIRM_TYPES[f.type].kind === 'warehouse') return;
    f.lines.forEach(function (l) {
      var s = f.stock[l.pid]; if (!s) return;
      var daily = Math.max(1, l.made / Math.max(1, (S.day % 30) + 1));
      if (s.q <= daily * 8) return;
      var q = s.q - daily * 5, gw = UAE.geo.nearestGateway(f.c);
      var exporter = UAE.hasFirmIn(f.owner, 'exporter', null, UAE.CITIES[f.city].emirate);
      var P = UAE.P[l.pid];
      var px = (P.kind === 'consumer' ? UAE.importBase(l.pid) * 0.92 : UAE.worldPrice(l.pid)) * (exporter ? 0.99 : 0.94);
      var fr = P.t * (gw.km * 1.25 + 3) * UAE.RULES.freightPerTonKm;
      if (px - fr < s.cost * 0.85 && !l.forceExport) return;   // not worth exporting at a big loss: hold stock
      var basis = UAE.stockTake(f, l.pid, q);
      UAE.fIncome(f, 'revenue', Math.max(0, px - fr) * q); UAE.fCogs(f, basis);
      l.exported = (l.exported || 0) + q;
      S.cities[f.city].exportsM = (S.cities[f.city].exportsM || 0) + px * q;                       // city graphs: exports
    });
  });
};

/* ------------------------------------------- service-type firms (daily) */
UAE.servicesDay = function (open) {
  var S = UAE.S, m = S.macro;
  var byKind = {};
  open.forEach(function (f) { var k = UAE.FIRM_TYPES[f.type].kind; (byKind[k] || (byKind[k] = [])).push(f); });
  var get = function (k) { return byKind[k] || []; };
  var tour = UAE.season('tourism') * m.tourism;

  // --- service firms (restaurants, cafés, gyms, salons, cinemas)
  get('service').forEach(function (f) {
    var svc = UAE.SERVICES[f.svc], c = S.cities[f.city];
    var n = get('service').filter(function (g) { return g.district === f.district && g.svc === f.svc && (g.mall || null) === (f.mall || null); }).length;
    var cust = svc.base * (1 + 0.8 * (f.size - 1)) * Math.pow(Math.max(0.2, UAE.trafficIndex(f)), 0.8) * Math.pow(f.quality / 50, 0.5) * UAE.popMult(f) *
               Math.pow(svc.price / f.price, 1.3) * UAE.season('retail') * UAE.CITIES[f.city].income * c.wageIdx /
               (1 + 0.35 * (n - 1)) * f.eff * (0.85 + 0.3 * tour / 1.1);
    var gross = cust * f.price, net = gross / 1.05;
    UAE.fIncome(f, 'revenue', net); UAE.fExpense(f, 'cogs', net * svc.foodCost);
    c.vat += gross - net; c.govRevYtd += gross - net; f.customers = cust;
  });

  // --- hotels: occupancy vs city benchmark (DXB 80.7% / ADR AED 579, REAL 2025)
  get('hotel').forEach(function (f) {
    var C = UAE.CITIES[f.city], d = UAE.geo.district(f.district), c = S.cities[f.city];
    var rooms = UAE.FIRM_TYPES.hotel.roomsPerLevel * f.size;
    var refADR = C.hotelADR * Math.sqrt(Math.max(0.4, d.foot) / 1.2) * (f.stars === 7 ? 3 : 1);
    var target = C.hotelOcc * tour * Math.pow(refADR / f.adr, 1.4) * Math.pow(f.quality / 50, 0.3) * (1 + (c.fx.hotel || 0));
    target = Math.max(0.05, Math.min(0.97, target));
    f.occ = f.occ + (target - f.occ) * 0.1;
    var roomRev = rooms * f.occ * f.adr, total = roomRev * 1.35, net = total / 1.05;
    UAE.fIncome(f, 'revenue', net); UAE.fExpense(f, 'cogs', net * 0.22);
    c.vat += total - net; c.govRevYtd += total - net;
    f.revpar = f.occ * f.adr;
  });

  // --- apartments, offices, malls: occupancy follows rent vs market rent
  get('mall').forEach(UAE.mallDay);                 // malls: tenants, leases, background letting (engine/mall.js)
  ['apartment','office'].forEach(function (k) {
    get(k).forEach(function (f) {
      var co = UAE.co(f.owner), mkt = UAE.marketRent(f);
      if (co.autoRent && (S.day % 30 === 0 || !f.rent)) f.rent = Math.round(mkt * 0.98);
      var target = Math.max(0.08, Math.min(0.98, 0.93 * Math.pow(mkt / f.rent, 2.2) * S.macro.property));
      f.occ += (target - f.occ) * 0.03;
      var stock = k === 'apartment' ? UAE.LEASE.apartmentUnits * f.size : (k === 'mall' ? UAE.LEASE.mallM2 : UAE.LEASE.officeM2) * f.size;
      var rev = stock * f.occ * f.rent / 365;
      if (k === 'mall') rev *= 1 + 0.15 * (UAE.geo.district(f.district).foot); // turnover rent from footfall
      UAE.fIncome(f, 'revenue', rev); UAE.fExpense(f, 'cogs', rev * (k === 'mall' ? 0.25 : 0.14));
    });
  });

  // --- media: share of the city advertising pool (yesterday's ad spend) + base audience revenue
  var mediaByCity = {};
  get('media').forEach(function (f) { (mediaByCity[f.city] || (mediaByCity[f.city] = [])).push(f); });
  Object.keys(mediaByCity).forEach(function (city) {
    var list = mediaByCity[city], pool = (S._adYesterday[city] || 0), sum = 2;
    list.forEach(function (f) { f._s = UAE.FIRM_TYPES[f.type].reach * f.size * f.quality / 50; sum += f._s; });
    list.forEach(function (f) {
      var base = 18000 * UAE.FIRM_TYPES[f.type].reach * f.size * Math.sqrt(S.cities[city].pop / 1e6);
      UAE.fIncome(f, 'revenue', pool * f._s / sum + base);
    });
  });

  // --- internet companies (national market: users x take-rate x GMV / ARPU)
  var net = get('internet'), uaePop = 0; Object.keys(S.cities).forEach(function (k) { uaePop += S.cities[k].pop; });
  var netSum = {};
  net.forEach(function (f) { var co = UAE.co(f.owner); f._s = f.size * Math.pow(f.quality / 50, 1.2) * (1 + (co.brand.Internet || co.brandBase || 10) / 50); netSum[f.model] = (netSum[f.model] || 6) + f._s; });
  net.forEach(function (f) {
    var M = UAE.INTERNET_MODELS[f.model];
    var pen = { ecommerce: 0.55, delivery: 0.45, search: 0.85, social: 0.8, streaming: 0.35 }[f.model];
    var target = uaePop * pen * f._s / netSum[f.model] * m.tech;
    f.users += (target - f.users) * 0.01;
    var rev = f.users * (M.gmvPerUser * M.takeRate + M.arpu) / 365;
    f.gmv = f.users * M.gmvPerUser / 365;
    UAE.fIncome(f, 'revenue', rev); UAE.fExpense(f, 'otherOpex', rev * 0.35); // servers, payments, couriers
  });

  // --- software companies
  get('software').forEach(function (f) {
    var rivals = get('software').filter(function (g) { return g.swClass === f.swClass; }).length;
    var rev = 25000 * f.size * Math.pow(f.quality / 50, 1.2) / (1 + 0.2 * (rivals - 1)) * m.tech;
    UAE.fIncome(f, 'revenue', rev);
  });

  // --- telecom: subscribers vs e&/du incumbents
  var tel = get('telecom'), telSum = 60;
  tel.forEach(function (f) { f._s = f.size * f.quality / 50; telSum += f._s; });
  tel.forEach(function (f) {
    var target = uaePop * 1.9 * f._s / telSum;
    f.subs += (target - f.subs) * 0.005;
    UAE.fIncome(f, 'revenue', f.subs * f.arpu / 30);
  });

  // --- data centres & solar
  get('datacenter').forEach(function (f) {
    f.util = Math.min(0.92, f.util + 0.002 * m.tech);
    UAE.fIncome(f, 'revenue', UAE.FIRM_TYPES.datacenter.mw * f.size * 1000 * 551 / 30 * f.util);
  });
  get('solar').forEach(function (f) {
    var kwh = UAE.FIRM_TYPES.solar.mw * f.size * 1000 * 24 * (0.21 + 0.06 * (UAE.SEASON.tourism[UAE.cal.month()] < 0.9 ? 1 : 0));
    f.kwhDay = kwh; UAE.fIncome(f, 'revenue', kwh * 0.085);   // PPA AED 0.085/kWh (EST)
  });

  // --- sports / attractions
  get('sports').forEach(function (f) {
    var d = UAE.geo.district(f.district);
    var vis = 1200 * f.size * Math.pow(Math.max(0.3, d.foot), 0.7) * tour * Math.pow(150 / f.price, 1.1) * f.eff;
    var gross = vis * f.price, netv = gross / 1.05;
    UAE.fIncome(f, 'revenue', netv); UAE.fExpense(f, 'cogs', netv * 0.15); f.visitors = vis;
    S.cities[f.city].vat += gross - netv;
  });

  // --- logistics: share of freight paid in the city yesterday + contract base
  var logi = get('logistics'), lc = {};
  logi.forEach(function (f) { (lc[f.city] || (lc[f.city] = [])).push(f); });
  Object.keys(lc).forEach(function (city) {
    var pool = S._freightYesterday[city] || 0, sum = 3;
    lc[city].forEach(function (f) { sum += f.size; });
    lc[city].forEach(function (f) {
      var rev = pool * f.size / sum + 9000 * f.size * S.macro.logistics;
      UAE.fIncome(f, 'revenue', rev); UAE.fExpense(f, 'otherOpex', rev * 0.45); // fuel, tolls (Salik), vehicles
    });
  });
  get('importer').forEach(function (f) { UAE.fIncome(f, 'revenue', 5000 * f.size * S.macro.logistics); });
  get('exporter').forEach(function (f) { UAE.fIncome(f, 'revenue', 4000 * f.size * S.macro.logistics); });

  // --- banks: deposits, lending, provisions (Banking & Finance DLC)
  get('bankhq').forEach(function (f) {
    var co = UAE.co(f.owner), br = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'bankbranch' && g.status === 'open'; });
    var mktDep = Math.max(0.005, m.rate + UAE.RULES.depositSpread), mktLend = m.rate + UAE.RULES.loanSpread + 0.01;
    var r = co.bankRates;
    var target = (300e6 * f.size + br.reduce(function (s, g) { return s + 120e6 * g.size; }, 0)) * Math.pow(r.deposit / mktDep, 2);
    var dDep = (target - co.bs.custDeposits) * 0.004;
    if (dDep < 0) dDep = Math.max(dDep, -co.bs.cash * 0.5);
    UAE.L.bankDeposit(co, dDep);
    var lendTarget = co.bs.custDeposits * 0.8 * Math.pow(mktLend / r.lending, 1.5);
    var dL = (Math.min(lendTarget, co.bs.custDeposits * 0.9) - co.bs.loanBook) * 0.004;
    if (dL > 0) dL = Math.min(dL, Math.max(0, co.bs.cash - co.bs.custDeposits * 0.1));
    if (dL > 0) UAE.L.bankLend(co, dL); else if (dL < 0) { UAE.L._cash(co, -dL, 'op'); co.bs.loanBook += dL; }
    UAE.fIncome(f, 'interestInc', co.bs.loanBook * r.lending / 365);
    UAE.fExpense(f, 'interestExp', co.bs.custDeposits * r.deposit / 365);
    var pd = 0.006 + Math.max(0, r.lending - mktLend) * 0.6;
    var prov = co.bs.loanBook * pd / 365;
    UAE.L.writeDown(co, 'otherOpex', prov, 'loanBook'); f.m.cost += prov;
  });

  // --- insurance: premiums from front offices, claims ratio
  get('inshq').forEach(function (f) {
    var co = UAE.co(f.owner), offices = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'insoffice' && g.status === 'open'; });
    var prem = (15000 * f.size + offices.reduce(function (s, g) { return s + 9000 * g.size; }, 0)) * Math.pow(1 / co.insRate, 1.5);
    co._claims = co._claims == null ? 0.62 : Math.max(0.4, Math.min(0.95, co._claims + UAE.rng.normal() * 0.01 + (0.62 - co._claims) * 0.02));
    UAE.fIncome(f, 'revenue', prem * co.insRate); UAE.fExpense(f, 'cogs', prem * co.insRate * co._claims);
  });

  // --- R&D centres raise company technology for a product
  get('rnd').forEach(function (f) {
    var co = UAE.co(f.owner), t = co.tech[f.target] || 40, cls = UAE.P[f.target] ? UAE.P[f.target].cls : '';
    var mgr = f.manager && UAE.person(f.manager), ceo = UAE.person(co.ceo);
    var classExp = Math.max(mgr && mgr.pexp ? mgr.pexp[cls] || 0 : 0, ceo && ceo.pexp ? (ceo.pexp[cls] || 0) * 0.5 : 0);
    co.tech[f.target] = Math.min(100, t + 0.012 * f.size * f.eff * (1 + classExp / 100) * (1 - t / 110));   // product-class expertise: +1%/point
  });
};

/* ---------------------------------------------- fixed costs per firm */
UAE.fixedCosts = function (f) {
  var T = UAE.FIRM_TYPES[f.type], c = UAE.S.cities[f.city], C = UAE.CITIES[f.city];
  var co = UAE.co(f.owner);
  if (f.seed && co.legacy) {     // seed flagship sites: staff already inside legacy core opex
    if (f.adBudget) { UAE.fExpense(f, 'advertising', f.adBudget / 30); UAE.S.adPool[f.city] = (UAE.S.adPool[f.city] || 0) + f.adBudget / 30; }
    return;
  }
  var staff = T.staff * (1 + 0.8 * (f.size - 1));
  var wages = staff * C.wage * c.wageIdx * T.wageMult / 30;
  if (f.manager) wages += UAE.person(f.manager).salary / 30;
  var kwh = T.kwh * (1 + 0.8 * (f.size - 1));
  var industrial = ['factory','mine','oil','farm','warehouse','datacenter','logistics'].indexOf(T.kind) >= 0;
  var util = UAE.electricityBill(kwh, industrial, C.emirate) / 30;
  UAE.fExpense(f, T.kind === 'rnd' ? 'rnd' : 'salaries', wages);
  UAE.fExpense(f, 'utilities', util);
  UAE.fExpense(f, 'maintenance', (f.ppe * 0.012) / 365);
  if (f.adBudget) { UAE.fExpense(f, 'advertising', f.adBudget / 30); UAE.S.adPool[f.city] = (UAE.S.adPool[f.city] || 0) + f.adBudget / 30; }
  if (f.trainBudget) { UAE.fExpense(f, 'training', f.trainBudget / 30); }
  // efficiency: training & manager push toward 1.2, otherwise drifts to 0.9; expertise adds unit levels
  // (Capitalism Lab: +1 unit level per 20 expertise points of the manager; the CEO adds a quarter of that company-wide)
  var tm = UAE.trainingMult(f);
  var tgt = 0.9 + Math.min(0.25, (f.trainBudget || 0) / Math.max(1, wages * 30) * 1.5 * tm) + (f.manager && UAE.person(f.manager) ? UAE.person(f.manager).skill.mgmt / 1000 : 0) +
            0.05 * UAE.expertLevels(f);
  f.training = Math.min(100, (f.training || 0) * 0.995 + (f.trainBudget ? 0.4 * tm : 0));
  f.eff += (tgt - f.eff) * 0.02;
};
UAE.constructionCosts = function (f) {
  // site security / project management during construction (SYN)
  UAE.fExpense(f, 'otherOpex', UAE.BUILD[f.type][0] * 0.0002);
};

/* --------------------------------- legacy core business of real groups */
UAE.legacyDay = function (co) {
  var L = co.legacy, m = UAE.S.macro, sec = co.sector;
  var macro = 1;
  if (sec === 'oilgas' || sec === 'chemicals') macro = 0.55 + 0.45 * m.oil;
  if (sec === 'property') macro = m.property;
  if (sec === 'logistics' || sec === 'transport') macro = m.logistics;
  if (sec === 'hospitality' || sec === 'aviation') macro = 0.6 + 0.4 * UAE.season('tourism') * m.tourism;
  if (sec === 'retail') macro = UAE.season('retail') * m.retail;
  if (sec === 'tech' || sec === 'internet' || sec === 'telecom') macro = m.tech;
  if (sec === 'bank') macro = 0.7 + 0.3 * (m.rate / UAE.RULES.baseRate);
  L.idx *= 1 + L.grow / 365;
  L.shock = (L.shock || 1) * (1 + UAE.rng.normal() * 0.004) * 0.98 + 0.02;
  var rev = L.rev / 365 * L.idx * macro * L.shock;
  var costBase = (L.rev - L.preTax) / 365;
  var opex = costBase * 0.45 * L.idx + costBase * 0.55 * (rev / (L.rev / 365));   // 45% fixed, 55% variable cost
  UAE.L.income(co, 'revenue', rev); UAE.L.expense(co, 'coreOpex', opex);
};

/* ---------------------------------------------- brand & technology drift */
UAE.brandTechDay = function (co) {
  // product brands (awareness + loyalty per product and city) live in engine/micro.js (UAE.brandDay);
  // here only the corporate "Internet" brand of online platforms is maintained.
  var ads = 0, net = false;
  UAE.firmsOf(co.id).forEach(function (f) { if (f.type === 'internet') { net = true; ads += (f.adBudget || 0) / 30; } });
  ads += ((co.hqBudget.cmo || 0) + (co.hqBudget.pr || 0)) / 30 * 0.3;
  if (net) {
    var push = ads > 0 ? 6 * ads / (ads + 60000) : 0, b = co.brand.Internet == null ? (co.brandBase || 10) : co.brand.Internet;
    co.brand.Internet = Math.max(0, Math.min(100, b * 0.998 + push * (1 - b / 100)));
  }
  if (co.hqBudget.cto) {
    var g = co.hqBudget.cto / 30 / 2e6 * 0.01;
    for (var p in co.tech) co.tech[p] = Math.min(100, co.tech[p] + g * (1 - co.tech[p] / 110));
  }
  if (co.hqBudget.hr) UAE.L.expense(co, 'training', co.hqBudget.hr / 30);
  if (co.hqBudget.cmo) UAE.L.expense(co, 'advertising', co.hqBudget.cmo / 30);
  if (co.hqBudget.pr) UAE.L.expense(co, 'advertising', co.hqBudget.pr / 30);
  if (co.hqBudget.cto) UAE.L.expense(co, 'rnd', co.hqBudget.cto / 30);
  if (co.hqBudget.ir) UAE.L.expense(co, 'otherOpex', co.hqBudget.ir / 30);
  if (co.hqBudget.community) { UAE.L.expense(co, 'otherOpex', co.hqBudget.community / 30); UAE.S.cities[co.hq].civic += co.hqBudget.community / 30; }
};
