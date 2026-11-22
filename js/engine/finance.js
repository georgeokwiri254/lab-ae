/* ============================================================================
 * UAE CAPITALISM LAB  -  BANKING & INSURANCE (Banking & Finance DLC style)
 *
 * BANK (Bank HQ + branches)
 *  Segments, each with its own interest rate:
 *   - Corporate loans to GAME companies: when any company takes a loan (FA01, AI
 *     borrowing, emergency credit) the cheapest game bank with spare capacity lends
 *     it; the borrower's monthly interest is paid to that bank, repayments return
 *     the cash, a bankrupt borrower is written off.
 *   - Corporate & SME loans (wider economy), mortgages, personal loans & cards:
 *     market shares per city from branch presence, brand and rate vs market.
 *   - Deposits per city from branch presence and the deposit rate.
 *  Rules (CBUAE-style): cash reserve 7% of deposits, capital adequacy >= 13% of
 *  risk-weighted loans (corporate 100%, mortgages 50%, personal 100%).
 *  Income: interest, account & card fees, brokerage (share of all share-trading fees),
 *  underwriting (2% fee on share issues / IPOs goes to the lead game bank), treasury.
 *  Losses: provisions per segment (rate vs market, risk appetite, unemployment).
 *
 * INSURANCE (Insurance HQ + front offices)
 *  Lines: motor, health, property, life - premium level per line, market shares per
 *  city. Commercial property: every company pays 0.12%/yr of its buildings' value,
 *  shared among game insurers (rest to insurers not in the game). Claims with
 *  randomness and catastrophe events (floods, sandstorms); reinsurance cedes a share
 *  of premiums and recovers the same share of claims; sales commission 12%;
 *  investment income on the float; solvency ratio = equity / yearly net premiums.
 * Engine only - no DOM. All money flows through the double-entry ledger.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.BANK = {
  segs: { corp: { name: 'Corporate & SME loans', spread: 0.015, pd: 0.009, rw: 1.0 }, mort: { name: 'Mortgages', spread: 0.012, pd: 0.003, rw: 0.5 },
          cons: { name: 'Personal loans & cards', spread: 0.075, pd: 0.03, rw: 1.0 } },
  depPerCap: 120000, mortPerCap: 45000, consPerCap: 25000, corpPerGdp: 0.35,      // EST market sizes (AED)
  bgWeight: 60, reserve: 0.07, buffer: 0.08, minCAR: 0.13, feeDep: 0.003, feeCons: 0.01, underwriting: 0.02, brokerageShare: 0.6,
  appetite: { conservative: { share: 0.7, pd: 0.7 }, normal: { share: 1, pd: 1 }, aggressive: { share: 1.4, pd: 1.6 } }
};
UAE.INS = {
  lines: { motor: { name: 'Motor', perCap: 630, loss: 0.68 }, health: { name: 'Health', perCap: 2600, loss: 0.82 },
           property: { name: 'Property & home', perCap: 350, loss: 0.45 }, life: { name: 'Life & savings', perCap: 400, loss: 0.55 } },
  bgWeight: 45, commission: 0.12, commercialRate: 0.0012, minSolvency: 0.15
};

/* ------------------------------------------------------------ bank state */
UAE.bankOf = function (co) {
  if (!co.bank) {
    var m = UAE.mktRates();                                                      // start at market rates
    co.bank = { rates: { dep: m.dep, corp: m.corp, mort: m.mort, cons: m.cons }, book: { corp: 0, mort: 0, cons: 0 },
      game: 0, appetite: 'normal', fees: 0, prov: 0, m: {} };
  }
  return co.bank;
};
UAE.mktRates = function () {
  var b = UAE.S.macro.rate, S = UAE.BANK.segs;
  return { dep: Math.max(0.005, b + UAE.RULES.depositSpread), corp: b + S.corp.spread, mort: b + S.mort.spread, cons: b + S.cons.spread };
};
UAE.isBank = function (co) { return UAE.firmsOf(co.id).some(function (f) { return f.type === 'bankhq' && f.status === 'open'; }); };
/** Bank presence in a city: HQ (counts everywhere a little) + branches in that city. */
UAE.bankPresence = function (co, city) {
  var p = 0;
  UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status !== 'open') return;
    if (f.type === 'bankhq') p += f.city === city ? f.size * 1.2 : f.size * 0.3;
    if (f.type === 'bankbranch' && f.city === city) p += f.size * 0.7;
  });
  var brand = co.brand && co.brand.Banking != null ? co.brand.Banking : (co.brandBase || 20);
  return p * (0.7 + brand / 100);
};
UAE.riskWeighted = function (co) { var B = UAE.bankOf(co), s = UAE.BANK.segs; return B.book.corp * s.corp.rw + B.book.mort * s.mort.rw + B.book.cons * s.cons.rw + B.game * 1.0 + (UAE.intlTotal ? UAE.intlTotal(B) : 0); };
UAE.bankCAR = function (co) { var rw = UAE.riskWeighted(co); return rw > 0 ? UAE.totals(co).equity / rw : 9.99; };
UAE.bankLendRoom = function (co) {     // how much more this bank can lend today
  var B = UAE.bankOf(co), eq = UAE.totals(co).equity;
  var byCapital = eq / UAE.BANK.minCAR - UAE.riskWeighted(co);
  var byCash = co.bs.cash - co.bs.custDeposits * UAE.BANK.reserve;
  return Math.max(0, Math.min(byCapital, byCash));
};

/** Daily operation of every bank. */
UAE.bankDay = function (hqs) {
  var S = UAE.S, M = UAE.mktRates(), seen = {};
  hqs.forEach(function (f) {
    var co = UAE.co(f.owner); if (seen[co.id] || co.foreign) return; seen[co.id] = 1;
    var B = UAE.bankOf(co), A = UAE.BANK.appetite[B.appetite] || UAE.BANK.appetite.normal, r = B.rates;
    var tDep = 0, tSeg = { corp: 0, mort: 0, cons: 0 };
    Object.keys(S.cities).forEach(function (city) {
      var c = S.cities[city], C = UAE.CITIES[city], P = UAE.bankPresence(co, city); if (P <= 0) return;
      var inc = C.income * c.wageIdx;
      var dA = P * Math.pow(r.dep / M.dep, 2), dShare = dA / (dA + UAE.BANK.bgWeight);
      tDep += c.pop * inc * UAE.BANK.depPerCap * dShare;
      [['corp', c.gdp * 1e9 * UAE.BANK.corpPerGdp], ['mort', c.pop * UAE.BANK.mortPerCap * c.rentIdx], ['cons', c.pop * inc * UAE.BANK.consPerCap]].forEach(function (x) {
        var elig = (x[0] === 'corp' || x[0] === 'cons') && UAE.gradeMix ? UAE.gradeMix(B, x[0]).eligible : 1;
        var a = P * Math.pow(M[x[0]] / r[x[0]], 2.5) * A.share * elig; tSeg[x[0]] += x[1] * a / (a + UAE.BANK.bgWeight);
      });
    });
    B.target = { dep: tDep, corp: tSeg.corp, mort: tSeg.mort, cons: tSeg.cons };
    // deposits drift towards the target (0.4%/day); outflows are limited by cash
    var dDep = (tDep - co.bs.custDeposits) * 0.004;
    if (dDep < 0) dDep = Math.max(dDep, -Math.max(0, co.bs.cash) * 0.5);
    if (dDep) UAE.L.bankDeposit(co, dDep);
    // loan books drift towards their targets within capital & cash limits
    ['corp', 'mort', 'cons'].forEach(function (k) {
      var d = (tSeg[k] - B.book[k]) * 0.004;
      if (d > 0) d = Math.min(d, Math.max(0, UAE.bankLendRoom(co) - co.bs.custDeposits * UAE.BANK.buffer));   // keep a liquidity buffer for corporate deals
      if (d > 0) { UAE.L.bankLend(co, d); B.book[k] += d; }
      else if (d < 0) { d = Math.max(d, -B.book[k]); UAE.L._cash(co, -d, 'op'); co.bs.loanBook += d; B.book[k] += d; }
    });
    if (UAE.intlLendDay) UAE.intlLendDay(co, f);           // surplus lent abroad (engine/finance2.js)
    // interest, fees, treasury
    var addC = UAE.mixRate ? UAE.mixRate(B, 'corp') : 0, addP = UAE.mixRate ? UAE.mixRate(B, 'cons') : 0;
    var intInc = (B.book.corp * (r.corp + addC) + B.book.mort * r.mort + B.book.cons * (r.cons + addP)) / 365;
    var intExp = co.bs.custDeposits * r.dep / 365;
    var fees = (co.bs.custDeposits * UAE.BANK.feeDep + B.book.cons * UAE.BANK.feeCons) / 365;
    var excess = Math.max(0, Math.min((UAE.bankCash ? Math.min(UAE.bankCash(co), co.bs.cash) : co.bs.cash) - co.bs.custDeposits * UAE.BANK.reserve, co.bs.custDeposits));
    var treas = excess * Math.max(0, S.macro.rate - 0.005) / 365;
    UAE.fIncome(f, 'interestInc', intInc + treas); UAE.fExpense(f, 'interestExp', intExp); UAE.fIncome(f, 'revenue', fees);
    // provisions (expected losses) per segment
    var stress = 1 + Math.max(0, (Object.keys(S.cities).reduce(function (s, k) { return s + S.cities[k].unemp; }, 0) / Object.keys(S.cities).length) - 0.03) * 12;
    var prov = 0;
    ['corp', 'mort', 'cons'].forEach(function (k) {
      var basePd = (k === 'corp' || k === 'cons') && UAE.mixPD ? UAE.mixPD(B, k) : UAE.BANK.segs[k].pd;
      var pd = basePd * Math.pow(Math.max(0.5, r[k] / M[k]), 1.5) * stress;
      var loss = Math.min(B.book[k], B.book[k] * pd / 365); B.book[k] -= loss; prov += loss;
    });
    if (prov > 0) { UAE.L.writeDown(co, 'otherOpex', prov, 'loanBook'); f.m.cost += prov; }
    // brokerage: a share of the day's share-trading fees, by bank size
    B.m = { intInc: intInc, intExp: intExp, fees: fees, treas: treas, prov: prov };
    if (UAE.segAdd) { UAE.segAdd(B, 'intInc', intInc); UAE.segAdd(B, 'treas', treas); UAE.segAdd(B, 'fees', fees); UAE.segAdd(B, 'intExp', intExp); UAE.segAdd(B, 'prov', prov); }
    B.prov = (B.prov || 0) * (1 - 1 / 365) + prov;
    // Internal revenue attribution from Bank HQ to open branches by presence share (nets to 0 for the bank division and company).
    var branches = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'bankbranch' && g.status === 'open'; });
    if (branches.length) {
      var hqW = f.size * (1.2 + 0.3 * Math.max(0, Object.keys(S.cities).length - 1));
      var brW = branches.reduce(function (s, g) { return s + g.size * 0.7; }, 0);
      var intlInc = B.intlLast && B.intlLast.day === S.day ? (B.intlLast.inc || 0) : 0;
      var netBankRev = Math.max(0, intInc + treas + fees + intlInc - intExp);
      var allocTot = netBankRev * brW / (hqW + brW);
      if (allocTot > 0 && brW > 0) {
        f.m.rev -= allocTot;
        branches.forEach(function (g) { g.m.rev += allocTot * (g.size * 0.7 / brW); });
      }
    }
  });
  // distribute the brokerage pool (fees collected on every share trade) among banks by presence
  var pool = S.brokeragePool || 0; S.brokeragePool = 0;
  if (pool > 0) {
    var banks = Object.keys(seen).map(UAE.co), w = banks.map(function (co) { return Object.keys(S.cities).reduce(function (s, c) { return s + UAE.bankPresence(co, c); }, 0); });
    var tot = w.reduce(function (s, x) { return s + x; }, 0) + UAE.BANK.bgWeight;
    banks.forEach(function (co, i) {
      var amt = pool * UAE.BANK.brokerageShare * w[i] / tot; if (amt <= 0) return;
      var hq = UAE.firmsOf(co.id).find(function (g) { return g.type === 'bankhq'; });
      if (hq) { UAE.fIncome(hq, 'revenue', amt); UAE.bankOf(co).brokerage = (UAE.bankOf(co).brokerage || 0) + amt; if (UAE.segAdd) UAE.segAdd(UAE.bankOf(co), 'brokerage', amt); }
    });
  }
};

/* -------------------------- corporate loans between game companies (FA01 link) */
/** Cheapest game bank able to lend `amt` to `borrower` (null = outside bank). */
UAE.pickLender = function (borrower, amt) {
  var best = null, bestRate = UAE.loanRate(borrower), bestP = -1;
  UAE.allCos().forEach(function (co) {
    if (co.id === borrower.id || co.foreign || co.status === 'BANKRUPT' || !co.bank || !UAE.isBank(co)) return;
    var rate = co.bank.rates.corp + UAE.creditSpread(borrower);
    if (rate > bestRate + 1e-9 || UAE.bankLendRoom(co) <= amt * 1.5) return;
    var P = Object.keys(UAE.S.cities).reduce(function (t, c) { return t + UAE.bankPresence(co, c); }, 0);   // ties: the bigger branch network wins
    if (rate < bestRate - 1e-9 || P > bestP) { best = co; bestRate = rate; bestP = P; }
  });
  return best ? { co: best, rate: bestRate } : null;
};
UAE.fundGameLoan = function (lender, amt) { UAE.L.bankLend(lender, amt); UAE.bankOf(lender).game += amt; };
UAE.gameLoanRepaid = function (lender, amt) { UAE.L._cash(lender, amt, 'op'); lender.bs.loanBook -= amt; UAE.bankOf(lender).game -= amt; };
UAE.gameLoanInterest = function (lender, amt) {
  UAE.L.income(lender, 'interestInc', amt);
  var hq = UAE.firmsOf(lender.id).find(function (g) { return g.type === 'bankhq'; }); if (hq) hq.m.rev += amt;
  var B = UAE.bankOf(lender); B.gameInt = (B.gameInt || 0) + amt; if (UAE.segAdd) UAE.segAdd(B, 'gameInt', amt);
};
UAE.gameLoanDefault = function (borrower) {
  (borrower.loanList || []).forEach(function (l) {
    var lender = l.bank && UAE.co(l.bank); if (!lender || !l.amt) return;
    var x = Math.min(l.amt, lender.bs.loanBook);
    UAE.L.writeDown(lender, 'otherOpex', x, 'loanBook'); UAE.bankOf(lender).game -= x;
    if (UAE.isHuman(lender)) UAE.news(lender.name + ' wrote off a ' + UAE.fmt.aed(x) + ' loan to bankrupt ' + borrower.name + '.', 'warning');
    l.bank = null;
  });
};
/** Underwriting fee on share issues / IPOs (already deducted from the issuer's proceeds): earned by the lead game bank. */
UAE.underwrite = function (issuer, fee) {
  var lead = null, lw = 0;
  UAE.allCos().forEach(function (co) {
    if (co.id === issuer.id || !co.bank || !UAE.isBank(co)) return;
    var w = Object.keys(UAE.S.cities).reduce(function (s, c) { return s + UAE.bankPresence(co, c); }, 0); if (w > lw) { lw = w; lead = co; }
  });
  if (!lead || lw < 3) return 0;                            // small banks don't win mandates
  var lhq = UAE.firmsOf(lead.id).find(function (g) { return g.type === 'bankhq'; });
  if (lhq) UAE.fIncome(lhq, 'revenue', fee); else UAE.L.income(lead, 'revenue', fee);
  var B = UAE.bankOf(lead); B.underwriting = (B.underwriting || 0) + fee; if (UAE.segAdd) UAE.segAdd(B, 'underwriting', fee);
  if (UAE.isHuman(lead)) UAE.news(lead.name + ' earned ' + UAE.fmt.aed(fee) + ' underwriting ' + issuer.name + '’s share issue.', 'firm');
  return fee;
};

/* ------------------------------------------------------------- insurance */
UAE.insOf = function (co) {
  if (!co.ins) co.ins = { price: { motor: co.insRate || 1, health: co.insRate || 1, property: co.insRate || 1, life: co.insRate || 1 }, reinsure: 0.2, gwp: {}, claims: {}, m: {}, cat: 0 };
  return co.ins;
};
UAE.insPresence = function (co, city) {
  var p = 0, X = UAE._idx;
  if (X) {   // during a game day: HQ total + offices per city, one pass per company
    var M = X.insP || (X.insP = {}), r = M[co.id];
    if (!r) {
      r = M[co.id] = { hq: 0, hqCity: {}, off: {} };
      UAE.firmsOf(co.id).forEach(function (f) {
        if (f.status !== 'open') return;
        if (f.type === 'inshq') { r.hq += f.size; r.hqCity[f.city] = (r.hqCity[f.city] || 0) + f.size; }
        if (f.type === 'insoffice') r.off[f.city] = (r.off[f.city] || 0) + f.size;
      });
    }
    var inCity = r.hqCity[city] || 0;
    p = inCity * 1.2 + (r.hq - inCity) * 0.3 + (r.off[city] || 0) * 0.7;
  } else UAE.firmsOf(co.id).forEach(function (f) {
    if (f.status !== 'open') return;
    if (f.type === 'inshq') p += f.city === city ? f.size * 1.2 : f.size * 0.3;
    if (f.type === 'insoffice' && f.city === city) p += f.size * 0.7;
  });
  var brand = co.brand && co.brand.Insurance != null ? co.brand.Insurance : (co.brandBase || 20);
  return p * (0.7 + brand / 100);
};
UAE.insDay = function (hqs) {
  var S = UAE.S, seen = {}, cos = [];
  hqs.forEach(function (f) { var co = UAE.co(f.owner); if (!seen[co.id] && !co.foreign) { seen[co.id] = f; cos.push(co); } });
  // catastrophe events (~1 a year somewhere in the UAE): claims spike for a few days
  if (!S.insCat || S.insCat.until < S.day) {
    if (UAE.rng.chance(1 / 365)) {
      var ev = UAE.rng.pick([['Severe floods after record rainfall', { motor: 6, property: 9 }], ['Major sandstorm damages vehicles and buildings', { motor: 3, property: 3 }], ['Heatwave hospitalisations surge', { health: 2.5 }]]);
      S.insCat = { title: ev[0], mult: ev[1], until: S.day + 5 };
      UAE.news('Insurance catastrophe: ' + ev[0] + ' – claims spike for insurers.', 'event');
    } else S.insCat = null;
  }
  var cat = S.insCat && S.insCat.until >= S.day ? S.insCat.mult : {};
  // commercial property premiums paid by every company's buildings
  var commercialPool = 0;
  UAE.allCos().forEach(function (co) {
    if (co.foreign || co.status === 'BANKRUPT' || co.bs.ppe <= 0) return;
    var p = co.bs.ppe * UAE.INS.commercialRate / 365; UAE.L.expense(co, 'otherOpex', p); commercialPool += p;
  });
  var totalP = cos.reduce(function (s, co) { return s + Object.keys(S.cities).reduce(function (t, c) { return t + UAE.insPresence(co, c); }, 0); }, 0) + UAE.INS.bgWeight;
  cos.forEach(function (co) {
    var f = seen[co.id], I = UAE.insOf(co), gwp = 0, claims = 0, byLine = {};
    Object.keys(UAE.INS.lines).forEach(function (k) {
      var L = UAE.INS.lines[k], price = I.price[k] || 1, prem = 0;
      Object.keys(S.cities).forEach(function (city) {
        var c = S.cities[city], P = UAE.insPresence(co, city); if (P <= 0) return;
        var Std = UAE.INS.standards ? UAE.INS.standards[I.standard || 'normal'] : { share: 1 };
        var a = P * Math.pow(1 / price, 2.2) * Std.share, share = a / (a + UAE.INS.bgWeight);
        prem += c.pop * L.perCap * UAE.CITIES[city].income * share * price / 365;
      });
      var stdLoss = UAE.INS.standards ? UAE.INS.standards[I.standard || 'normal'].loss : 1;
      var cl = prem * L.loss * stdLoss / price * (1 + UAE.rng.normal() * 0.08) * (cat[k] || 1);    // cheap premiums / loose underwriting = worse risks
      byLine[k] = { prem: prem, claims: Math.max(0, cl) }; gwp += prem; claims += Math.max(0, cl);
    });
    // commercial property line: share of the pool paid by all companies
    var myW = Object.keys(S.cities).reduce(function (t, c) { return t + UAE.insPresence(co, c); }, 0);
    var com = commercialPool * myW / totalP, comCl = com * 0.4 * (cat.property || 1);
    byLine.commercial = { prem: com, claims: comCl }; gwp += com; claims += comCl;
    var ceded = gwp * I.reinsure, recovered = claims * I.reinsure, comm = gwp * UAE.INS.commission;
    var float = (I.gwpYear || gwp * 365) * 0.45, invest = Math.min(Math.max(0, co.bs.cash), float) * Math.max(0, S.macro.rate - 0.005) / 365;
    UAE.fIncome(f, 'revenue', gwp); UAE.fExpense(f, 'cogs', claims - recovered); UAE.fExpense(f, 'otherOpex', ceded + comm); UAE.fIncome(f, 'interestInc', invest);
    I.m = { gwp: gwp, claims: claims, ceded: ceded, recovered: recovered, comm: comm, invest: invest, byLine: byLine };
    if (UAE.segAdd) { UAE.segAdd(I, 'gwp', gwp); UAE.segAdd(I, 'ceded', ceded); UAE.segAdd(I, 'claims', claims); UAE.segAdd(I, 'recovered', recovered); UAE.segAdd(I, 'comm', comm); UAE.segAdd(I, 'invest', invest); }
    // Internal revenue attribution from Insurance HQ to open front offices by presence share (nets to 0 for the insurer and company).
    var offs = UAE.firmsOf(co.id).filter(function (g) { return g.type === 'insoffice' && g.status === 'open'; });
    if (offs.length) {
      var hqW = f.size * (1.2 + 0.3 * Math.max(0, Object.keys(S.cities).length - 1));
      var offW = offs.reduce(function (s, g) { return s + g.size * 0.7; }, 0);
      var netInsRev = Math.max(0, gwp - ceded - comm - Math.max(0, claims - recovered));
      var allocTot = netInsRev * offW / (hqW + offW);
      if (allocTot > 0 && offW > 0) {
        f.m.rev -= allocTot;
        offs.forEach(function (g) { g.m.rev += allocTot * (g.size * 0.7 / offW); });
      }
    }
    I.gwpYear = (I.gwpYear || gwp * 365) * (1 - 1 / 365) + gwp; I.claimsYear = (I.claimsYear || claims * 365) * (1 - 1 / 365) + claims;
    co._claims = I.claimsYear / Math.max(1, I.gwpYear);
  });
};
UAE.insSolvency = function (co) { var I = UAE.insOf(co), net = (I.gwpYear || 0) * (1 - I.reinsure); return net > 0 ? UAE.totals(co).equity / net : 9.99; };
