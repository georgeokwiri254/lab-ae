/* ============================================================================
 * UAE CAPITALISM LAB  -  GLOBAL MARKETS ENGINE (NYSE / NASDAQ) & RICH LISTS
 *  - ensureGlobalMarkets(): adds the NYSE and NASDAQ indices and the US-listed
 *    companies (new games and older saves alike).
 *  - Global companies are `foreign`: legacy core business, dividends, tradable
 *    shares; no UAE firms, no AI expansion, no game CEO.
 *  - richUAE() / richGlobal(): real people (reported net worth, moving with the
 *    in-game price of their main listed company) ranked with every person in the
 *    game (you and the fictional CEOs).
 * Engine only - no DOM access.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.isForeign = function (co) { return !!(co && co.foreign); };
/** Price in the exchange's own currency (USD for NYSE / NASDAQ, AED otherwise). */
UAE.localPx = function (co) { return co.foreign ? co.price / UAE.RULES.usdAed : co.price; };

UAE.ensureGlobalMarkets = function () {
  var S = UAE.S, usd = UAE.RULES.usdAed;
  Object.keys(UAE.GLOBAL_EXCH).forEach(function (x) {
    var E = UAE.GLOBAL_EXCH[x];
    if (!S.index[x]) S.index[x] = { base: E.base, level: E.base, src: E.src, hist: [] };
  });
  UAE.GLOBAL_COMPANIES.forEach(function (g) {
    var old = S.companies[g.id];
    if (old && old.status === 'UNLISTED' && (g.st || 'LISTED') === 'LISTED' && !Object.keys(old.holders || {}).some(function (k) { return /^(P|C):/.test(k) && old.holders[k] > 0; })   /* no player / company holds it */) {
      delete S.companies[g.id]; old = null;                 // went public since (SpaceX IPO, Jun-2026): re-create as a listed company
    }
    if (old) return;
    UAE.seedCompany({ id: g.id, name: g.name, t: g.t, x: g.x, st: g.st || 'LISTED', hq: 'DXB', sec: g.sec,
      rev: g.rev * usd, ni: g.ni * usd, fin: 'EST', px: g.px * usd, pxs: g.pxs, sh: g.sh });
    var co = S.companies[g.id];
    co.foreign = true; co.home = g.home || 'US'; co.payout = g.div; co.brandBase = 80;
    if (co.ceo) { delete S.persons[co.ceo]; co.ceo = null; }   // real leadership is not simulated
  });
};

/** Current net worth (AED) of a real rich-list entry. */
UAE.realWealth = function (r) {
  var base = r.nw * 1e9 * UAE.RULES.usdAed, co = r.co && UAE.S.companies[r.co];
  if (!co || !co.seedPrice || !co.price) return base;
  return base * Math.max(0.05, 1 + r.w * (co.price / co.seedPrice - 1));
};
/** In-game people (you + fictional CEOs, founders, investors) with their net worth. */
UAE.gamePeopleWealth = function () {
  return Object.keys(UAE.S.persons).map(function (k) { return UAE.S.persons[k]; }).map(function (p) {
    var co = p.co && UAE.co(p.co), main = null, best = 0;
    UAE.allCos().forEach(function (c) {
      var n = c.holders && c.holders['P:' + p.id]; if (!n) return;
      var v = n * (UAE.isTradable(c) ? c.price : UAE.privateValue(c) / c.shares); if (v > best) { best = v; main = c; }
    });
    return { kind: 'game', p: p, name: p.name, nw: UAE.personWealth(p), co: main || co, what: (main || co) ? (main || co).name : '' };
  }).filter(function (r) { return r.nw > 0; });
};
UAE.richUAE = function () {
  var real = UAE.RICH_UAE.map(function (r) { return { kind: 'real', r: r, name: r.name, nw: UAE.realWealth(r), what: r.what, src: r.src, ctry: r.ctry }; });
  var game = UAE.gamePeopleWealth().filter(function (x) { return !x.co || !x.co.foreign; });
  return real.concat(game).sort(function (a, b) { return b.nw - a.nw; });
};
UAE.richGlobal = function () {
  var real = UAE.RICH_GLOBAL.concat(UAE.RICH_UAE).map(function (r) { return { kind: 'real', r: r, name: r.name, nw: UAE.realWealth(r), what: r.what, src: r.src, ctry: r.ctry }; });
  return real.concat(UAE.gamePeopleWealth()).sort(function (a, b) { return b.nw - a.nw; });
};
