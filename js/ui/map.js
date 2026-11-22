/* ============================================================================
 * UAE CAPITALISM LAB  -  MAP (MapLibre GL, WebGL)
 *  - Photoreal base: Esri World Imagery satellite (default) or CARTO dark map
 *  - 3D: real OpenStreetMap building footprints extruded (OpenFreeMap tiles)
 *  - Game layers: buildable districts, firms (neon dots), your structures in 3D
 * All coordinates are real: Burj Khalifa, Jebel Ali, Yas Island etc. sit where
 * they are in reality. Note MapLibre uses [lng, lat]; the game data uses [lat, lng].
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.ZONE_COLORS = { cbd:'#00f0ff', commercial:'#8fd3ff', residential:'#b8ff2c', tourism:'#ff2bd6', industrial:'#ff8a3d',
  port:'#5ea0ff', freezone:'#8f7bff', tech:'#c08bff', agri:'#6fdc6f', quarry:'#d8b98a', oilfield:'#ffd24d', desert:'#ffe066' };

UI.ll = function (c) { return [c[1], c[0]]; };   // [lat,lng] -> [lng,lat]

UI.circlePoly = function (c, rKm, n) {
  n = n || 64; var pts = [];
  for (var i = 0; i <= n; i++) {
    var a = 2 * Math.PI * i / n;
    pts.push([c[1] + rKm / (111.32 * Math.cos(c[0] * Math.PI / 180)) * Math.cos(a), c[0] + rKm / 110.57 * Math.sin(a)]);
  }
  return pts;
};
UI.squarePoly = function (c, sideM) {
  var dLat = sideM / 2 / 110570, dLng = sideM / 2 / (111320 * Math.cos(c[0] * Math.PI / 180));
  return [[c[1] - dLng, c[0] - dLat], [c[1] + dLng, c[0] - dLat], [c[1] + dLng, c[0] + dLat], [c[1] - dLng, c[0] + dLat], [c[1] - dLng, c[0] - dLat]];
};

/** Colour of a company on the map: you = acid green, your subsidiaries = teal, real groups = cyan, AI start-ups = magenta. */
UI.ownerColor = function (co) {
  if (!co) return '#777';
  if (co.id === UAE.S.playerCo) return '#b8ff2c';
  if (co.controller === 'PLAYER') return '#2cffd5';
  if (co.real) return '#00f0ff';
  if (!co.color) { var h = UAE.AI.hash(co.id) % 60; co.color = 'hsl(' + (290 + h) + ',100%,62%)'; }
  return co.color;
};

UI.initMap = function () {
  var style = {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      sat: { type: 'raster', tileSize: 256, maxzoom: 19,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' },
      dark: { type: 'raster', tileSize: 256, maxzoom: 16,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
        attribution: '© Esri, HERE, Garmin, © OpenStreetMap contributors' },
      labels: { type: 'raster', tileSize: 256, maxzoom: 19,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'] },
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenFreeMap © OpenStreetMap' }
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#000' } },
      { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-brightness-max': 0.78, 'raster-saturation': -0.2, 'raster-contrast': 0.18 } },
      { id: 'dark', type: 'raster', source: 'dark', layout: { visibility: 'none' } },
      { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.75 } },
      { id: 'osm-3d', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 12.5,
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8],
            0, '#06141c', 40, '#0b3445', 120, '#0f5a70', 300, '#16a3c2', 600, '#00f0ff'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.55, 'fill-extrusion-vertical-gradient': true } }
    ]
  };
  var map = UI.map = new maplibregl.Map({
    container: 'map', style: style, center: [55.2744, 25.1972], zoom: 15.4, pitch: 64, bearing: -28,
    maxPitch: 80, antialias: true, attributionControl: { compact: true },
    boxZoom: false                                      // Shift is reserved for Shift+click "build & keep placing"
  });
  map.on('error', function (e) { if (window.console) console.warn('map:', e && e.error && e.error.message); });
  map.on('load', function () {
    map.addSource('districts', { type: 'geojson', data: UI.districtGeo() });
    map.addLayer({ id: 'dist-fill', type: 'fill', source: 'districts', layout: { visibility: 'none' },
      paint: { 'fill-color': ['get', 'col'], 'fill-opacity': 0.08 } });
    map.addLayer({ id: 'dist-line', type: 'line', source: 'districts', layout: { visibility: 'none' },
      paint: { 'line-color': ['get', 'col'], 'line-width': 1.6, 'line-blur': 0.6, 'line-dasharray': [3, 2] } });
    var empty = function () { return { type: 'FeatureCollection', features: [] }; };
    // customer traffic overlay (Capitalism Lab "Customer Traffic Overlay")
    map.addSource('traffic', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'traffic-heat', type: 'heatmap', source: 'traffic', layout: { visibility: 'none' }, paint: {
      'heatmap-weight': ['get', 'w'], 'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 14, 1.6],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 14, 12, 40, 15, 90], 'heatmap-opacity': 0.55,
      'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, '#103a5a', 0.45, '#00f0ff', 0.7, '#b8ff2c', 1, '#ff2bd6'] } });
    // natural resource sites ("Land Ownership & Resources" mode)
    map.addSource('deposits', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'dep-fill', type: 'fill', source: 'deposits', filter: ['==', ['geometry-type'], 'Polygon'], layout: { visibility: 'none' },
      paint: { 'fill-color': ['get', 'col'], 'fill-opacity': ['case', ['get', 'owned'], 0.06, 0.16] } });
    map.addLayer({ id: 'dep-line', type: 'line', source: 'deposits', filter: ['==', ['geometry-type'], 'Polygon'], layout: { visibility: 'none' },
      paint: { 'line-color': ['get', 'col'], 'line-width': 1.8, 'line-dasharray': [1, 1.5] } });
    map.addLayer({ id: 'dep-label', type: 'symbol', source: 'deposits', filter: ['==', ['geometry-type'], 'Point'], layout: { visibility: 'none',
      'text-field': ['step', ['zoom'], ['get', 'short'], 9.5, ['get', 'label']], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 0.6], 'text-allow-overlap': false },
      paint: { 'text-color': ['get', 'col'], 'text-halo-color': '#000', 'text-halo-width': 1.4 } });
    map.addLayer({ id: 'dep-dot', type: 'circle', source: 'deposits', filter: ['==', ['geometry-type'], 'Point'], layout: { visibility: 'none' },
      paint: { 'circle-color': ['get', 'col'], 'circle-radius': 5, 'circle-stroke-color': '#000', 'circle-stroke-width': 1.5 } });
    // land plots under every building + the buildings themselves
    map.addSource('lots', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'lots-fill', type: 'fill', source: 'lots', paint: { 'fill-color': ['get', 'col'], 'fill-opacity': 0.18 } });
    map.addLayer({ id: 'lots-line', type: 'line', source: 'lots', paint: { 'line-color': ['get', 'col'], 'line-width': 1.2, 'line-opacity': 0.8 } });
    map.addSource('foot', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'foot-line', type: 'line', source: 'foot', paint: { 'line-color': ['get', 'col'], 'line-width': 2, 'line-blur': 1.2 } });
    map.addLayer({ id: 'foot-3d', type: 'fill-extrusion', source: 'foot',
      paint: { 'fill-extrusion-color': ['get', 'col'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': ['coalesce', ['get', 'b'], 0], 'fill-extrusion-opacity': 0.82 } });
    // build mode: plot grid, blocked plots, footprint ghost
    map.addSource('grid', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'grid-bad', type: 'fill', source: 'grid', filter: ['==', ['get', 'k'], 'bad'], paint: { 'fill-color': '#ff2bd6', 'fill-opacity': 0.35 } });
    map.addLayer({ id: 'grid-line', type: 'line', source: 'grid', filter: ['==', ['get', 'k'], 'line'], paint: { 'line-color': '#00f0ff', 'line-width': 0.7, 'line-opacity': 0.45 } });
    map.addSource('preview', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'preview-lot', type: 'line', source: 'preview', paint: { 'line-color': ['get', 'col'], 'line-width': 2.4 } });
    map.addLayer({ id: 'preview-3d', type: 'fill-extrusion', source: 'preview',
      paint: { 'fill-extrusion-color': ['get', 'col'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-opacity': 0.6 } });
    map.addSource('firms', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'firm-glow', type: 'circle', source: 'firms', paint: {
      'circle-color': ['get', 'col'], 'circle-blur': 1, 'circle-opacity': ['case', ['==', ['get', 'st'], 'open'], 0.55, 0.3],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 4, 12, 10, 16, 22] } });
    map.addLayer({ id: 'firm-core', type: 'circle', source: 'firms', paint: {
      'circle-color': ['case', ['==', ['get', 'st'], 'open'], ['get', 'col'], '#000'],
      'circle-stroke-color': ['get', 'col'], 'circle-stroke-width': ['case', ['==', ['get', 'st'], 'open'], 1, 2],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 1.6, 12, 3.5, 16, 7] } });
    map.addLayer({ id: 'firm-name', type: 'symbol', source: 'firms', minzoom: 15.2, layout: {
      'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 10.5, 'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-max-width': 10 },
      paint: { 'text-color': ['get', 'col'], 'text-halo-color': '#000', 'text-halo-width': 1.2 } });
    UI.addLabels();
    UI.mapReady = true;
    if (UAE.S) UI.refreshMap();
  });
  map.on('mousemove', function (e) {
    var el = document.getElementById('coords');
    var d = UAE.geo.districtAt([e.lngLat.lat, e.lngLat.lng]);
    el.textContent = e.lngLat.lat.toFixed(5) + 'N, ' + e.lngLat.lng.toFixed(5) + 'E' + (d ? '  ·  ' + d.name + ' [' + d.zone + '] AED ' + d.land.toLocaleString() + '/m²' : '');
    if (UI.buildType && !UI._pvPending) {             // throttle the grid preview to one per animation frame
      UI._pvPending = true; var ll = e.lngLat;
      requestAnimationFrame(function () { UI._pvPending = false; if (UI.buildType) UI.previewBuild(ll); });
    }
  });
  map.on('zoom', UI.labelVisibility);
  var popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
  map.on('mouseenter', 'firm-core', function (e) {
    map.getCanvas().style.cursor = 'pointer';
    var f = UAE.firm(e.features[0].properties.id); if (!f) return;
    var co = UAE.co(f.owner);
    popup.setLngLat(e.lngLat).setHTML('<b>' + UI.esc(f.name) + '</b><br><span style="color:' + UI.ownerColor(co) + '">' + UI.esc(co.name) + '</span><br>' +
      UAE.FIRM_TYPES[f.type].name + ' · size ' + f.size + (f.status !== 'open' ? ' · <span class="t-m">under construction</span>' :
      '<br>Last month profit: <span class="' + (f.last.profit >= 0 ? 'pos' : 'neg') + '">' + UAE.fmt.aed(f.last.profit) + '</span>')).addTo(map);
  });
  map.on('mouseleave', 'firm-core', function () { map.getCanvas().style.cursor = UI.buildType ? 'crosshair' : ''; popup.remove(); });
  map.on('click', function (e) {
    if (UI.buildType) { UI.tryBuild([e.lngLat.lat, e.lngLat.lng], UI._shift || (e.originalEvent && e.originalEvent.shiftKey)); return; }
    var hits = map.queryRenderedFeatures(e.point, { layers: ['firm-core', 'firm-glow'] });
    if (hits.length) { UI.openFirm(hits[0].properties.id); return; }
    if (UI.depOn) { var dh = map.queryRenderedFeatures(e.point, { layers: ['dep-dot'] }); if (dh.length) UI.depositInfo(dh[0].properties.id); }
  });
};

UI.districtGeo = function () {
  return { type: 'FeatureCollection', features: UAE.DISTRICTS.map(function (d) {
    return { type: 'Feature', properties: { id: d.id, col: UI.ZONE_COLORS[d.zone] || '#fff', name: d.name },
      geometry: { type: 'Polygon', coordinates: [UI.circlePoly(d.c, d.r)] } };
  }) };
};

UI.addLabels = function () {
  UI.lmMarkers = [];
  UAE.LANDMARKS.forEach(function (l) {
    var el = document.createElement('div'); el.className = 'map-label'; el.textContent = l.name; el.title = 'Click for photo & info';
    el.addEventListener('click', function (ev) { ev.stopPropagation(); if (!UI.buildType && UI.openLandmark) UI.openLandmark(l.name); });
    UI.lmMarkers.push(new maplibregl.Marker({ element: el, anchor: 'left', offset: [6, 0] }).setLngLat(UI.ll(l.c)).addTo(UI.map));
  });
  Object.keys(UAE.CITIES).forEach(function (k) {
    var el = document.createElement('div'); el.className = 'city-label'; el.textContent = UAE.CITIES[k].name;
    new maplibregl.Marker({ element: el }).setLngLat(UI.ll(UAE.CITIES[k].center)).addTo(UI.map);
  });
  UI.labelVisibility();
};
UI.labelVisibility = function () {
  var z = UI.map.getZoom(), c = document.getElementById('map');
  c.classList.toggle('hide-lm', z < 11.3);
  c.classList.toggle('hide-city', z >= 10.6);
};

/** Firm height in metres for the 3D extrusion. */
UI.firmHeight = function (f) {
  var T = UAE.FIRM_TYPES[f.type], full = Math.max(2.5, T.floors * 3.6 * (1 + 0.18 * (f.size - 1)));
  if (f.status !== 'open') return Math.max(1.5, full * UI.buildProgress(f));     // rises floor by floor while under construction
  return full;
};
/** 0..1 construction progress of a firm. */
UI.buildProgress = function (f) {
  if (f.status === 'open') return 1;
  var total = f.buildDays || UAE.BUILD[f.type][1], left = f.openDay - UAE.S.day;
  return Math.max(0.04, Math.min(1, 1 - left / Math.max(1, total)));
};
/** Building footprint inside its plot block (a margin of land is left around it, like Capitalism Lab lots). */
UI.firmRing = function (f) {
  var T = UAE.FIRM_TYPES[f.type], pl = f.plot || UAE.grid.blockAt(f.c, UAE.plotSize(f.type));
  var inset = pl.n === 1 ? 0.14 : T.floors < 0.5 ? 0.05 : pl.n * 0.12;
  return UAE.grid.ring(pl, inset);
};

/** Rebuild the firm layers from the game state. Called a few times a second. */
UI.refreshMap = function () {
  if (!UI.mapReady || !UAE.S) return;
  var pts = [], foot = [], lots = [];
  UAE.plotIndex();                                    // makes sure every firm has a plot block
  UAE.allFirms().forEach(function (f) {
    var co = UAE.co(f.owner), col = UI.ownerColor(co);
    pts.push({ type: 'Feature', properties: { id: f.id, col: col, st: f.status, name: f.name }, geometry: { type: 'Point', coordinates: UI.ll(f.c) } });
    if (f.mall) return;                               // mall stores sit inside the mall building
    if (f.plot) lots.push({ type: 'Feature', properties: { col: col }, geometry: { type: 'Polygon', coordinates: [UAE.grid.ring(f.plot, 0)] } });
    if (f.seed) return;                               // real sites: the real building is already in the OSM 3D layer
    var ring = UI.firmRing(f), h = UI.firmHeight(f);
    if (f.status === 'open') foot.push({ type: 'Feature', properties: { id: f.id, col: col, h: h }, geometry: { type: 'Polygon', coordinates: [ring] } });
    else {
      // construction site: concrete core + orange scaffold cap growing with progress
      foot.push({ type: 'Feature', properties: { id: f.id, col: '#3a4652', h: h * 0.9 }, geometry: { type: 'Polygon', coordinates: [ring] } });
      foot.push({ type: 'Feature', properties: { id: f.id, col: '#ff8a3d', h: h, b: h * 0.9 }, geometry: { type: 'Polygon', coordinates: [ring] } });
    }
  });
  UI.map.getSource('firms').setData({ type: 'FeatureCollection', features: pts });
  UI.map.getSource('foot').setData({ type: 'FeatureCollection', features: foot });
  UI.map.getSource('lots').setData({ type: 'FeatureCollection', features: lots });
  if (UI.depOn) UI.map.getSource('deposits').setData(UI.depositGeo());
  if (UI.trafOn && (!UI._trafT || UAE.S.day - UI._trafT > 15)) { UI._trafT = UAE.S.day; UI.map.getSource('traffic').setData(UI.trafficGeo()); }
};

/* ------------------------------------------- resource sites & traffic overlays */
UI.DEP_COLORS = { crude: '#ffcc33', gas: '#7ad7ff', limestone: '#d8b98a', sand: '#ffe9a8' };
UI.depositGeo = function () {
  var feats = [];
  UAE.DEPOSITS.forEach(function (d) {
    var st = UAE.depState(d.id), f = st.firm && UAE.S.firms[st.firm], col = UI.DEP_COLORS[d.res];
    var label = d.name + '\n' + UAE.P[d.res].name + ' · ' + UAE.fmt.num(st.left) + ' ' + UAE.P[d.res].unit + ' left · grade ' + d.grade.toFixed(2) +
      (f ? '\nowned: ' + UAE.co(f.owner).name : '\nfor sale ' + UAE.fmt.aed(d.price));
    feats.push({ type: 'Feature', properties: { col: col, owned: !!f }, geometry: { type: 'Polygon', coordinates: [UI.circlePoly(d.c, d.r)] } });
    var short = d.name.split('(')[0].trim() + (f ? '' : ' ●');          // ● = still for sale
    feats.push({ type: 'Feature', properties: { col: col, label: label, short: short, id: d.id }, geometry: { type: 'Point', coordinates: UI.ll(d.c) } });
  });
  return { type: 'FeatureCollection', features: feats };
};
UI.showDeposits = function (on) {
  UI.depOn = on;
  ['dep-fill', 'dep-line', 'dep-label', 'dep-dot'].forEach(function (id) { if (UI.map.getLayer(id)) UI.map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); });
  if (on) UI.map.getSource('deposits').setData(UI.depositGeo());
  var b = document.getElementById('zRes'); if (b) b.classList.toggle('on', on);
};
UI.trafficGeo = function () {
  var feats = [];
  UAE.DISTRICTS.forEach(function (d) {
    if (!d.foot) return;
    var n = Math.max(1, Math.round(d.r * 3));       // spread the district's footfall over a few points
    for (var i = 0; i < n; i++) {
      var a = i * 2.39996, rr = d.r * 0.7 * Math.sqrt((i + 0.5) / n);
      feats.push({ type: 'Feature', properties: { w: d.foot / 2.3 }, geometry: { type: 'Point', coordinates: [d.c[1] + rr / (111.32 * Math.cos(d.c[0] * Math.PI / 180)) * Math.cos(a), d.c[0] + rr / 110.57 * Math.sin(a)] } });
    }
  });
  UAE.allFirms().forEach(function (f) {
    var k = UAE.FIRM_TYPES[f.type].kind;
    if (f.status !== 'open' || (k !== 'retail' && k !== 'service' && k !== 'mall')) return;
    feats.push({ type: 'Feature', properties: { w: k === 'mall' ? 1 : 0.35 }, geometry: { type: 'Point', coordinates: UI.ll(f.c) } });
  });
  return { type: 'FeatureCollection', features: feats };
};
UI.showTraffic = function (on) {
  UI.trafOn = on; UI._trafT = null;
  if (UI.map.getLayer('traffic-heat')) UI.map.setLayoutProperty('traffic-heat', 'visibility', on ? 'visible' : 'none');
  if (on) UI.map.getSource('traffic').setData(UI.trafficGeo());
  var b = document.getElementById('zTraf'); if (b) b.classList.toggle('on', on);
};

UI.showZones = function (on) {
  UI.zonesOn = on;
  ['dist-fill', 'dist-line'].forEach(function (id) { if (UI.map.getLayer(id)) UI.map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); });
  document.getElementById('zZones').classList.toggle('on', on);
};
UI.setBase = function (sat) {
  UI.map.setLayoutProperty('sat', 'visibility', sat ? 'visible' : 'none');
  UI.map.setLayoutProperty('dark', 'visibility', sat ? 'none' : 'visible');
  document.getElementById('zSat').classList.toggle('on', sat);
};
UI.flyCity = function (id) {
  if (id === 'UAE') { UI.map.flyTo({ center: [54.6, 24.6], zoom: 7.3, pitch: 35, bearing: 0, duration: 2600 }); return; }
  var C = UAE.CITIES[id];
  UI.map.flyTo({ center: UI.ll(C.center), zoom: C.zoom, pitch: 55, bearing: -20, duration: 2600, essential: true });
};
UI.flyTo = function (c, zoom) {
  UI.map.flyTo({ center: UI.ll(c), zoom: zoom || 16.2, pitch: 62, bearing: UI.map.getBearing() + 25, duration: 2200, essential: true });
};

/** Information window for a natural resource site, with a shortcut to build on it. */
UI.depositInfo = function (id) {
  var d = UAE.DEP[id], st = UAE.depState(id), f = st.firm && UAE.S.firms[st.firm], P = UAE.P[d.res];
  var type = d.res === 'crude' || d.res === 'gas' ? 'oilwell' : 'mine';
  UI.modal('<h2>⛏ ' + UI.esc(d.name) + '</h2>' +
    '<div class="cards">' + UI.card('Resource', P.name) + UI.card('Reserve left', UAE.fmt.num(st.left) + ' ' + P.unit, 'of ' + UAE.fmt.num(d.reserve) + ' ' + UI.tag('SYN')) +
    UI.card('Grade', '×' + d.grade.toFixed(2), 'output vs a standard site') + UI.card('Extraction cost', '×' + d.cost.toFixed(2), d.offshore ? 'offshore' : 'onshore') +
    UI.card('Ore quality', d.qual) + UI.card('Site rights', UAE.fmt.aed(d.price), 'paid to the ' + UAE.EMIRATES[UAE.CITIES[d.city].emirate].name + ' government') + '</div>' +
    '<div class="note">Position ' + UI.tag('EST') + ' ' + d.c[0].toFixed(3) + 'N ' + d.c[1].toFixed(3) + 'E (real field / quarry name, approximate location). One firm per site; production stops when the reserve is exhausted.</div>' +
    '<div class="row">' + (f ? 'Owned by ' + UI.coLink(UAE.co(f.owner)) + ' · <a href="#" data-act="openFirm" data-arg="' + f.id + '">' + UI.esc(f.name) + '</a>' :
      '<button class="btn a" data-act="buildDeposit" data-arg="' + id + '|' + type + '">Build ' + UAE.FIRM_TYPES[type].name + ' here</button>') +
    '<button class="btn m" data-act="closeModal">Close</button></div>');
};
UI.act.buildDeposit = function (arg) {
  var p = arg.split('|'), d = UAE.DEP[p[0]];
  UI.closeModal(); UI.buildType = p[1];
  var q = UAE.quoteFirm(p[1], d.c, 1);
  if (!q.ok) { UI.buildType = null; UI.toast(q.why, 'bad'); return; }
  UI.pendingBuild = { type: p[1], p: d.c }; UI.buildModal(1);
};

/* ------------------------------------------------- cinematic intro orbit */
UI.orbit = function () {
  if (!UI.map || UI.started) return;
  if (UI.mapReady && !UI.map.isMoving()) UI.map.setBearing(UI.map.getBearing() + 0.06);
  requestAnimationFrame(UI.orbit);
};
