/* ============================================================================
 * UAE CAPITALISM LAB  -  LAND PLOT GRID (Capitalism Lab style construction)
 * The map is divided into square 40 m land plots. Every building occupies an
 * n x n block of plots that depends on its land footprint (a shop is 1 plot,
 * a factory 2x2, a mall 5x5, a farm 6x6, a solar farm 18x18). Placement snaps
 * to the grid, every plot must lie in a zone that allows the building, and
 * plots cannot be shared. Mines and wells sit on natural resource sites
 * instead (see data/resources.js). Mall stores lease space inside a mall and
 * take no land.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.GRID = { cell: 40, mLat: 110570, mLng: 111320 * Math.cos(24.4 * Math.PI / 180) };
UAE.grid = {
  /** Plot indices [x, y] of the cell containing point c = [lat, lng]. */
  cellOf: function (c) { var G = UAE.GRID; return [Math.floor(c[1] * G.mLng / G.cell), Math.floor(c[0] * G.mLat / G.cell)]; },
  /** [lat, lng] of a grid corner (x, y). */
  corner: function (x, y) { var G = UAE.GRID; return [y * G.cell / G.mLat, x * G.cell / G.mLng]; },
  /** Centre [lat, lng] of a plot block. */
  center: function (pl) { return UAE.grid.corner(pl.x + pl.n / 2, pl.y + pl.n / 2); },
  /** n x n block of plots centred on the cell under point c. */
  blockAt: function (c, n) { var cell = UAE.grid.cellOf(c), o = Math.floor((n - 1) / 2); return { x: cell[0] - o, y: cell[1] - o, n: n }; },
  /** Polygon ring [lng, lat] of a plot block (for the map). */
  ring: function (pl, inset) {
    var i = inset || 0, a = UAE.grid.corner(pl.x + i, pl.y + i), b = UAE.grid.corner(pl.x + pl.n - i, pl.y + pl.n - i);
    return [[a[1], a[0]], [b[1], a[0]], [b[1], b[0]], [a[1], b[0]], [a[1], a[0]]];
  }
};
/** Plots per side for a building type. */
UAE.plotSize = function (type) {
  var T = UAE.FIRM_TYPES[type]; if (!T || !T.m2) return 1;
  return Math.max(1, Math.min(18, Math.round(Math.sqrt(T.m2) / UAE.GRID.cell)));
};
/** Occupancy index 'x,y' -> firm id (rebuilt when firms change). */
UAE.plotIndex = function () {
  var S = UAE.S, stamp = S.nextId + ':' + Object.keys(S.firms).length;
  if (S._plotIdx && S._plotStamp === stamp) return S._plotIdx;
  var idx = {};
  UAE.allFirms().forEach(function (f) {
    if (f.mall) return;
    if (!f.plot) f.plot = UAE.grid.blockAt(f.c, UAE.plotSize(f.type));
    var p = f.plot;
    for (var x = p.x; x < p.x + p.n; x++) for (var y = p.y; y < p.y + p.n; y++) idx[x + ',' + y] = f.id;
  });
  S._plotIdx = idx; S._plotStamp = stamp;
  return idx;
};
UAE.plotOwnerAt = function (x, y) { return UAE.plotIndex()[x + ',' + y] || null; };
/** Check a block: every plot free and inside a district whose zone allows the type. */
UAE.checkBlock = function (pl, T, skipZone) {
  var idx = UAE.plotIndex(), bad = [], clash = null, zoneBad = null;
  for (var x = pl.x; x < pl.x + pl.n; x++) for (var y = pl.y; y < pl.y + pl.n; y++) {
    var o = idx[x + ',' + y];
    if (o) { clash = clash || o; bad.push([x, y]); continue; }
    if (!skipZone) {
      var d = UAE.geo.districtAt(UAE.grid.corner(x + 0.5, y + 0.5));
      if (!d || T.zones.indexOf(d.zone) < 0) { zoneBad = zoneBad || (d || { name: 'unzoned land', zone: 'none' }); bad.push([x, y]); }
    }
  }
  return { ok: !bad.length, bad: bad, clash: clash, zoneBad: zoneBad };
};
