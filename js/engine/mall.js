/* ============================================================================
 * UAE CAPITALISM LAB  -  SHOPPING MALLS & MALL STORES (Service Industry DLC)
 *  - A mall has retail units (50 x 600 m2 per size level).
 *  - Any company may "Set Up a Store" (retail or service firm) inside a mall:
 *    no land is bought, only a fit-out; the store pays monthly rent to the mall
 *    owner under a lease (term, renewal rent, renewal conditions).
 *  - Units not taken by modelled stores are let to background tenants.
 *  - Mall Overall Rating = area customer traffic + boost from service firms
 *    + range of products & services + average product/service rating + size.
 *    Stores inside a mall get their customer traffic from this rating.
 *  - Mall policies: lease to any firms / own firms / own group, rent for new
 *    leases and for renewals as % of market, lease term.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.MALL_UNIT_M2 = 600;
UAE.mallSlots = function (m) { return Math.round(UAE.LEASE.mallM2 * m.size / UAE.MALL_UNIT_M2); };
UAE.mallTenants = function (m) {
  if (!UAE._idx) return UAE.allFirms().filter(function (f) { return f.mall === m.id; });
  return (UAE.dayGroup('mallT', function (f) { return f.mall || null; })[m.id] || []).slice();
};
UAE.mallUsed = function (m) { return UAE.mallTenants(m).reduce(function (s, f) { return s + f.size; }, 0); };
UAE.mallVacancy = function (m) { return Math.max(0, UAE.mallSlots(m) - UAE.mallUsed(m)); };
UAE.sameGroup = function (a, b) {
  if (a === b) return true;
  var A = UAE.co(a), B = UAE.co(b); if (!A || !B) return false;
  if (A.parent === b || B.parent === a || (A.parent && A.parent === B.parent)) return true;
  return A.controller === 'PLAYER' && B.controller === 'PLAYER';
};
UAE.mallAccepts = function (m, coId) {
  var p = m.mallPol || { lease: 'any' };
  if (p.lease === 'own') return coId === m.owner;
  if (p.lease === 'group') return UAE.sameGroup(coId, m.owner);
  return true;
};
/** Market rent of one 600 m2 unit per month in this mall (AED). */
UAE.unitMarketRent = function (m) {
  return UAE.marketRent(m) * UAE.MALL_UNIT_M2 / 12 * (0.6 + (m.mallRating || 50) / 125);
};
UAE.newLease = function (m, f, coId) {
  var p = m.mallPol || { rentNew: 1, term: 12 };
  return { rent: UAE.unitMarketRent(m) * (coId === m.owner ? 0 : p.rentNew) * f.size, start: UAE.S.day,
    until: UAE.S.day + p.term * 30, renewMax: 1.25, own: coId === m.owner };
};

/** Open a store inside a mall. type = 'retail' | 'service'. */
UAE.openMallStore = function (coId, mallId, type, opts) {
  opts = opts || {};
  var m = UAE.S.firms[mallId], co = UAE.co(coId);
  if (!m || m.type !== 'mall') return { ok: false, why: 'Not a shopping mall.' };
  if (m.status !== 'open') return { ok: false, why: 'The mall is still under construction.' };
  if (['retail', 'service'].indexOf(type) < 0) return { ok: false, why: 'Only retail stores and service firms can lease mall space.' };
  if (!UAE.mallAccepts(m, coId)) return { ok: false, why: m.mallPol.lease === 'own' ? 'The mall owner only leases space to its own stores.' : 'The mall owner only leases space to stores within its own group.' };
  var size = opts.size || 1;
  if (UAE.mallVacancy(m) < size) return { ok: false, why: 'Sorry, there is no space available in this shopping mall for a store of this size.' };
  var cost = UAE.BUILD[type][0] * 0.5 * size;
  if (co.bs.cash < cost) return { ok: false, why: 'Fit-out costs ' + UAE.fmt.aed(cost) + '.' };
  var f = UAE.createFirm(coId, type, m.c, { mall: mallId, size: size, instant: opts.instant, name: opts.name || (co.name.split(' ')[0] + ' ' + (type === 'retail' ? 'Store' : 'Outlet') + ' @ ' + m.name), svc: opts.svc });
  if (!f) return { ok: false, why: 'Could not open the store.' };
  if (!opts.instant && UAE.isHuman(co)) UAE.news('Lease signed: ' + f.name + ' (' + UAE.fmt.aed(f.lease.rent) + '/month).', 'firm');
  return { ok: true, firm: f };
};

/** Recompute the mall's overall rating and its components (monthly, or on demand). */
UAE.mallRate = function (m) {
  var d = UAE.geo.district(m.district), ten = UAE.mallTenants(m).filter(function (f) { return f.status === 'open'; });
  var slots = UAE.mallSlots(m), used = ten.reduce(function (s, f) { return s + f.size; }, 0);
  var bgShare = Math.max(0, (slots - used) / slots) * (m.occ || 0.6);
  var svc = ten.filter(function (f) { return f.type === 'service'; }).length;
  var classes = {}, rs = 0, rn = 0;
  ten.forEach(function (f) {
    if (f.type === 'service') { classes['svc:' + f.svc] = 1; rs += Math.min(100, 50 * Math.pow((f.quality || 50) / 50, 0.5) * Math.pow(UAE.SERVICES[f.svc].price / f.price, 0.5)); rn++; }
    f.lines.forEach(function (l) { classes[UAE.P[l.pid].cls] = 1; rs += UAE.lineRatings(f, l).overall; rn++; });
  });
  var info = {
    traffic: Math.round(40 * Math.min(1, Math.max(0.1, d.foot) / 2.2)),
    service: Math.round(Math.min(15, svc * 3 + bgShare * 6)),
    range: Math.round(Math.min(20, Object.keys(classes).length * 2 + bgShare * 10)),
    rating: Math.round(Math.min(20, ((rn ? rs / rn : 45) * (1 - bgShare) + 45 * bgShare) * 0.25)),
    size: Math.min(5, m.size)
  };
  info.overall = Math.min(100, info.traffic + info.service + info.range + info.rating + info.size);
  m.mallInfo = info; m.mallRating = info.overall;
  return info;
};

/** Daily mall operation: background letting, tenant rents, lease expiry and renewal. */
UAE.mallDay = function (m) {
  var S = UAE.S, co = UAE.co(m.owner);
  if (!m.mallPol) m.mallPol = { lease: 'any', rentNew: 1.0, rentRenew: 1.0, term: 12 };
  if (m.mallRating == null || S.day % 30 === 0) UAE.mallRate(m);
  var mkt = UAE.marketRent(m);
  if (co.autoRent && (S.day % 30 === 0 || !m.rent)) m.rent = Math.round(mkt * 0.98 * m.mallPol.rentNew);
  if (!m.rent) m.rent = Math.round(mkt);
  // background tenants on the units not leased to modelled stores
  var target = Math.max(0.08, Math.min(0.98, 0.93 * Math.pow(mkt / m.rent, 2.2) * S.macro.property * (0.8 + (m.mallRating || 50) / 250)));
  m.occ = m.occ == null ? 0.6 : m.occ + (target - m.occ) * 0.03;
  var slots = UAE.mallSlots(m), used = UAE.mallUsed(m), bgUnits = Math.max(0, slots - used) * m.occ;
  var bgRev = bgUnits * UAE.MALL_UNIT_M2 * m.rent / 365 * (1 + 0.15 * UAE.geo.district(m.district).foot);
  UAE.fIncome(m, 'revenue', bgRev); UAE.fExpense(m, 'cogs', bgRev * 0.25);
  m.occTotal = (used + bgUnits) / slots; m.unitsOwn = 0; m.unitsOther = 0;
  // modelled tenants pay rent; leases expire and are renewed or not
  UAE.mallTenants(m).forEach(function (f) {
    var tenant = UAE.co(f.owner); if (f.owner === m.owner) m.unitsOwn += f.size; else m.unitsOther += f.size;
    if (!f.lease) f.lease = UAE.newLease(m, f, f.owner);
    if (f.lease.rent > 0 && f.status === 'open') {
      var r = f.lease.rent / 30;
      UAE.fExpense(f, 'otherOpex', r); UAE.fIncome(m, 'revenue', r);
      f.lease.paid = (f.lease.paid || 0) + r;
    }
    if (S.day >= f.lease.until) {
      var market = UAE.unitMarketRent(m) * f.size, newRent = f.owner === m.owner ? 0 : market * m.mallPol.rentRenew;
      if (f.owner !== m.owner && newRent > market * f.lease.renewMax && !UAE.isHeadOffice(f)) {   // a Bank / Insurance HQ always renews
        UAE.news(f.name + ' left ' + m.name + ': renewal rent ' + UAE.fmt.aed(newRent) + '/month exceeded its condition (' + Math.round(f.lease.renewMax * 100) + '% of market).', UAE.isHuman(tenant) ? 'warning' : 'ai');
        UAE.sellFirm(f); return;
      }
      if (UAE.isHuman(tenant) && f.owner !== m.owner && newRent > market * (tenant.renewAlert || 1.1))
        UAE.news('Lease of ' + f.name + ' renewed at ' + UAE.fmt.aed(newRent) + '/month (' + Math.round(newRent / market * 100) + '% of market).', 'warning');
      f.lease.rent = newRent; f.lease.start = S.day; f.lease.until = S.day + m.mallPol.term * 30;
    }
  });
};
