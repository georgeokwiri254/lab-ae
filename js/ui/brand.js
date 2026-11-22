/* ============================================================================
 * UAE CAPITALISM LAB  -  ANIMATED PLAYER PORTRAIT & COMPANY LOGO PICKER
 *  - Your photo is animated: a slow cinematic camera move over the original shot
 *    (img/player_full.jpg) that pushes in to your face and back, a breathing
 *    neon glow and a holographic scan sweep. Small portraits pulse gently.
 *    (Desktop app only: the photo files are never copied into the public phone site.)
 *  - Company logos: pick one of the neon emblem designs, a colour and your
 *    initials, or upload your own image. Stored in the save (co.logo / co.logoImg).
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});
UI.PLAYER_PHOTO_FULL = '';

/** Big animated hero of the player (person card, spotlight). */
UI.playerHero = function (p, h) {
  var src = p.photo || UI.PLAYER_PHOTO_FULL;
  return '<div class="anim-hero" style="height:' + (h || 360) + 'px"><img class="kb" src="' + src + '" alt="" onerror="this.remove()"><i class="sweep"></i><i class="fx"></i>' +
    '<div class="ah-cap"><b>' + UI.esc(p.name) + '</b><br><span>' + UI.esc(p.title || '') + '</span></div></div>';
};

/* --------------------------------------------------------- logo designs */
/* Colourful 3-tone palettes [light, main, deep] for hyper-rendered 3D emblems. */
UI.LOGO_PALETTES = [
  ['#7ff9ff', '#00c8ff', '#5b2bff'], ['#ff9cf0', '#ff2bd6', '#6a0dad'], ['#e6ff8a', '#7dff2c', '#00a86b'], ['#fff1a8', '#ffc928', '#c25a00'],
  ['#ffb3a1', '#ff4d6d', '#8a0f3c'], ['#c7b8ff', '#8b5cff', '#2a0f8a'], ['#ffffff', '#b9c7d6', '#3c4a5c'], ['#a8fff0', '#1de9b6', '#00597a']
];
UI.LOGO_COLORS = UI.LOGO_PALETTES.map(function (p) { return p[1]; });   // older saves stored one colour
UI._lgN = 0;
/* Designs: svg(ids, pal, T). ids.g main gradient, ids.m metal, ids.h highlight, ids.bev bevel filter, ids.glow glow filter. */
UI.LOGO_DESIGNS = [
  { name: 'Glass Orb', mono: true, svg: function (I, p, T) {
    return '<circle cx="32" cy="33" r="27" fill="url(#' + I.r + ')" filter="url(#' + I.bev + ')"/>' +
      '<ellipse cx="32" cy="19" rx="18" ry="10" fill="url(#' + I.h + ')"/><circle cx="32" cy="33" r="27" fill="none" stroke="' + p[0] + '" stroke-opacity=".7" stroke-width="1.2"/>' + UI._lt3(T, I, 18, 35); } },
  { name: 'Chrome Shield', mono: true, svg: function (I, p, T) {
    return '<path d="M32 3 57 12v19c0 16-11 26-25 31C18 57 7 47 7 31V12Z" fill="url(#' + I.m + ')" filter="url(#' + I.bev + ')"/>' +
      '<path d="M32 9 51 16v15c0 12-8 20-19 24C21 51 13 43 13 31V16Z" fill="url(#' + I.g + ')" filter="url(#' + I.bev + ')"/>' +
      '<path d="M13 18 51 16v8C40 22 25 24 13 30Z" fill="#fff" opacity=".22"/>' + UI._lt3(T, I, 16, 32); } },
  { name: 'Gold Crest', mono: true, svg: function (I, p, T) {
    return '<path d="M32 3l7 9 11-2-1 11 9 7-9 7 1 11-11-2-7 9-7-9-11 2 1-11-9-7 9-7-1-11 11 2Z" fill="url(#' + I.gold + ')" filter="url(#' + I.bev + ')"/>' +
      '<circle cx="32" cy="31" r="15" fill="url(#' + I.g + ')" filter="url(#' + I.bev + ')"/><ellipse cx="32" cy="23" rx="10" ry="5" fill="#fff" opacity=".3"/>' + UI._lt3(T, I, 12, 32); } },
  { name: 'Crystal', svg: function (I, p) {
    return '<g filter="url(#' + I.glow + ')"><path d="M14 9h36l11 15-29 35L3 24Z" fill="url(#' + I.g + ')"/>' +
      '<path d="M3 24h58L50 9H14Z" fill="#fff" opacity=".28"/><path d="M14 9l8 15 10-15 10 15 8-15" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>' +
      '<path d="M3 24l29 35 10-35" fill="#000" opacity=".22"/><path d="M22 24l10 35 10-35" fill="#fff" opacity=".14"/></g>'; } },
  { name: 'Holo Disc', mono: true, svg: function (I, p, T) {
    return '<circle cx="32" cy="32" r="28" fill="url(#' + I.holo + ')" filter="url(#' + I.bev + ')"/><circle cx="32" cy="32" r="16" fill="#05060a" opacity=".55"/>' +
      '<circle cx="32" cy="32" r="16" fill="none" stroke="url(#' + I.m + ')" stroke-width="2.5"/><ellipse cx="24" cy="18" rx="12" ry="5" transform="rotate(-25 24 18)" fill="#fff" opacity=".35"/>' + UI._lt3(T, I, 12, 32); } },
  { name: '3D Monogram', mono: true, svg: function (I, p, T) {
    var t = T || 'A', s = t.length > 2 ? 17 : 23, d = '';
    for (var k = 5; k > 0; k--) d += '<text x="' + (32 + k * 0.6) + '" y="' + (34 + k * 0.8) + '" dy=".35em" font-size="' + s + '" font-family="Orbitron,Inter,Arial" font-weight="900" fill="' + p[2] + '" text-anchor="middle" opacity="' + (0.5 + k * 0.1) + '">' + UI.esc(t) + '</text>';
    return '<rect x="3" y="3" width="58" height="58" rx="14" fill="url(#' + I.r + ')" filter="url(#' + I.bev + ')"/><rect x="3" y="3" width="58" height="26" rx="14" fill="#fff" opacity=".13"/>' + d +
      '<text x="32" y="34" dy=".35em" font-size="' + s + '" font-family="Orbitron,Inter,Arial" font-weight="900" fill="url(#' + I.m + ')" text-anchor="middle" filter="url(#' + I.bev + ')">' + UI.esc(t) + '</text>'; } },
  { name: 'Neon Hex', mono: true, svg: function (I, p, T) {
    return '<path d="M32 3 57 17.5v29L32 61 7 46.5v-29Z" fill="url(#' + I.r + ')" filter="url(#' + I.bev + ')"/><path d="M32 9 52 20.5v23L32 55 12 43.5v-23Z" fill="#05060a" opacity=".55"/>' +
      '<path d="M32 9 52 20.5v23L32 55 12 43.5v-23Z" fill="none" stroke="' + p[0] + '" stroke-width="1.6" filter="url(#' + I.glow + ')"/>' + UI._lt3(T, I, 15, 32); } },
  { name: 'Liquid Ring', svg: function (I, p) {
    return '<circle cx="32" cy="32" r="21" fill="none" stroke="url(#' + I.m + ')" stroke-width="13" filter="url(#' + I.bev + ')"/>' +
      '<circle cx="32" cy="32" r="21" fill="none" stroke="url(#' + I.g + ')" stroke-width="9" opacity=".75"/><path d="M15 22a21 21 0 0 1 20-11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>'; } },
  { name: 'Prism Pyramid', svg: function (I, p) {
    return '<g filter="url(#' + I.glow + ')"><path d="M32 4 60 54H4Z" fill="url(#' + I.g + ')"/><path d="M32 4 32 54 4 54Z" fill="#000" opacity=".3"/><path d="M32 4 46 54H32Z" fill="#fff" opacity=".18"/>' +
      '<path d="M32 4 60 54" stroke="#fff" stroke-opacity=".6" stroke-width="1"/><path d="M14 40h36" stroke="' + p[0] + '" stroke-opacity=".5" stroke-width="1"/></g>'; } },
  { name: 'Burj Spire', svg: function (I, p) {
    return '<circle cx="32" cy="36" r="26" fill="url(#' + I.r + ')" opacity=".55"/><path d="M32 3c1 9 3 15 5 21l3 10 2 10 3 16H19l3-16 2-10 3-10c2-6 4-12 5-21Z" fill="url(#' + I.m + ')" filter="url(#' + I.bev + ')"/>' +
      '<path d="M32 3v57" stroke="#fff" stroke-opacity=".7" stroke-width="1"/><path d="M10 60h44" stroke="url(#' + I.g + ')" stroke-width="3" stroke-linecap="round"/>'; } },
  { name: 'Chip Core', mono: true, svg: function (I, p, T) {
    var pins = '';
    for (var k = 0; k < 4; k++) { var x = 19 + k * 8.7; pins += '<rect x="' + (x - 1.6) + '" y="3" width="3.2" height="9" rx="1" fill="url(#' + I.gold + ')"/><rect x="' + (x - 1.6) + '" y="52" width="3.2" height="9" rx="1" fill="url(#' + I.gold + ')"/><rect x="3" y="' + (x - 1.6) + '" width="9" height="3.2" rx="1" fill="url(#' + I.gold + ')"/><rect x="52" y="' + (x - 1.6) + '" width="9" height="3.2" rx="1" fill="url(#' + I.gold + ')"/>'; }
    return pins + '<rect x="12" y="12" width="40" height="40" rx="7" fill="url(#' + I.r + ')" filter="url(#' + I.bev + ')"/><rect x="18" y="18" width="28" height="28" rx="4" fill="#05060a" opacity=".6"/>' + UI._lt3(T, I, 11, 32); } },
  { name: 'Planet', svg: function (I, p) {
    return '<ellipse cx="32" cy="34" rx="29" ry="8" fill="none" stroke="url(#' + I.gold + ')" stroke-width="3.2" transform="rotate(-18 32 34)" opacity=".9"/>' +
      '<circle cx="32" cy="32" r="18" fill="url(#' + I.r + ')" filter="url(#' + I.bev + ')"/><ellipse cx="26" cy="24" rx="8" ry="4.5" transform="rotate(-25 26 24)" fill="url(#' + I.h + ')"/>' +
      '<path d="M5 41a29 8 -18 0 0 52 -17" fill="none" stroke="url(#' + I.gold + ')" stroke-width="3.2" transform="rotate(0)" opacity=".95"/>'; } }
];
/* 3D lettering: metal face, deep shadow, bevel. */
UI._lt3 = function (T, I, fs, y) {
  if (!T) return '';
  var s = T.length > 2 ? fs * 0.72 : fs;
  return '<text x="32.8" y="' + ((y || 32) + 1.2) + '" dy=".36em" font-size="' + s + '" font-family="Orbitron,Inter,Arial" font-weight="900" fill="#000" opacity=".55" text-anchor="middle">' + UI.esc(T) + '</text>' +
    '<text x="32" y="' + (y || 32) + '" dy=".36em" font-size="' + s + '" font-family="Orbitron,Inter,Arial" font-weight="900" fill="url(#' + I.m + ')" text-anchor="middle" filter="url(#' + I.bev + ')">' + UI.esc(T) + '</text>';
};
UI._lt = UI._lt3;
UI.logoPalette = function (L) {
  if (L.pal != null && UI.LOGO_PALETTES[L.pal]) return UI.LOGO_PALETTES[L.pal];
  var i = UI.LOGO_COLORS.indexOf(L.color); return UI.LOGO_PALETTES[i >= 0 ? i : 0];
};
/** Hyper-rendered 3D logo (SVG lighting: bevel + specular, metal / glass / gold gradients). */
UI.logoSvg = function (L, size) {
  var d = UI.LOGO_DESIGNS[L.design] || UI.LOGO_DESIGNS[0], p = UI.logoPalette(L), n = 'lg' + (UI._lgN++), T = L.text || '';
  var I = { g: n + 'g', m: n + 'm', r: n + 'r', h: n + 'h', gold: n + 'au', holo: n + 'ho', bev: n + 'bv', glow: n + 'gl', bg: n + 'bg' };
  var wm = !d.mono && T && size >= 56, H = wm ? 78 : 64;
  return '<svg class="logo lg3" width="' + size + '" height="' + Math.round(size * H / 64) + '" viewBox="0 0 64 ' + H + '" style="border-color:' + p[1] + '88">' +
    '<defs>' +
    '<linearGradient id="' + I.g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset=".5" stop-color="' + p[1] + '"/><stop offset="1" stop-color="' + p[2] + '"/></linearGradient>' +
    '<radialGradient id="' + I.r + '" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="' + p[0] + '"/><stop offset=".45" stop-color="' + p[1] + '"/><stop offset="1" stop-color="' + p[2] + '"/></radialGradient>' +
    '<linearGradient id="' + I.m + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="' + p[0] + '"/><stop offset=".5" stop-color="#5a6070"/><stop offset=".55" stop-color="' + p[1] + '"/><stop offset="1" stop-color="#ffffff"/></linearGradient>' +
    '<linearGradient id="' + I.gold + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".3" stop-color="#ffd24d"/><stop offset=".55" stop-color="#a86a00"/><stop offset=".75" stop-color="#ffcf4a"/><stop offset="1" stop-color="#7a4a00"/></linearGradient>' +
    '<linearGradient id="' + I.holo + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00f0ff"/><stop offset=".25" stop-color="#b8ff2c"/><stop offset=".5" stop-color="#ffd24d"/><stop offset=".75" stop-color="#ff2bd6"/><stop offset="1" stop-color="#5b2bff"/></linearGradient>' +
    '<radialGradient id="' + I.h + '" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="' + I.bg + '" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="' + p[1] + '" stop-opacity=".35"/><stop offset=".7" stop-color="#05060a"/></radialGradient>' +
    // bevel: blur the alpha into a height map, light it from the top-left (specular), keep it inside the shape, add to the colour
    '<filter id="' + I.bev + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>' +
    '<feSpecularLighting in="b" surfaceScale="4" specularConstant="1.1" specularExponent="22" lighting-color="#ffffff" result="s"><fePointLight x="-40" y="-60" z="90"/></feSpecularLighting>' +
    '<feComposite in="s" in2="SourceAlpha" operator="in" result="si"/><feComposite in="SourceGraphic" in2="si" operator="arithmetic" k1="0" k2="1" k3=".85" k4="0" result="lit"/>' +
    '<feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-color="#000" flood-opacity=".75"/></filter>' +
    '<filter id="' + I.glow + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '</defs><rect width="64" height="' + H + '" rx="12" fill="url(#' + I.bg + ')"/>' + d.svg(I, p, T) +
    (wm ? '<text x="32" y="73" font-size="9.5" font-family="Orbitron,Inter,Arial" font-weight="900" letter-spacing="2" fill="url(#' + I.g + ')" text-anchor="middle">' + UI.esc(T) + '</text>' : '') + '</svg>';
};
UI.initials = function (name) {
  return (name || '').replace(/\(.*?\)/g, '').split(/[\s&]+/).filter(function (w) { return w && /[A-Za-z0-9]/.test(w[0]) && ['of', 'and', 'the'].indexOf(w.toLowerCase()) < 0; })
    .map(function (w) { return w[0].toUpperCase(); }).join('').slice(0, 3);
};

/* Logos: a chosen design or uploaded image wins over the website logo / monogram. */
UI._logoBase = UI._logoBase || UI.logo;
UI.logo = function (co, size) {
  if (co && co.logoImg) return '<img class="logo" src="' + co.logoImg + '" alt="" width="' + (size || 18) + '" height="' + (size || 18) + '" style="border-color:' + (UI.ownerColor ? UI.ownerColor(co) : '#00f0ff') + '">';
  if (co && co.logo) return UI.logoSvg(co.logo, size || 18);
  return UI._logoBase(co, size);
};

/* ----------------------------------------------------------- the picker */
UI.act.logoPick = function (coId) {
  var co = UAE.co(coId), cur = co.logo || { design: 0, pal: 0, text: UI.initials(co.name) };
  var pal = cur.pal != null ? cur.pal : Math.max(0, UI.LOGO_COLORS.indexOf(cur.color));
  UI._logoDraft = { id: coId, design: cur.design || 0, pal: pal, text: cur.text == null ? UI.initials(co.name) : cur.text };
  UI.logoModal();
};
UI.logoModal = function () {
  var d = UI._logoDraft, co = UAE.co(d.id);
  var h = '<h2>🎨 Company logo · ' + UI.esc(co.name) + '</h2><div class="row" style="gap:16px;align-items:center">' + UI.logoSvg(d, 96) +
    '<div><div class="row"><label style="min-width:0">Initials / text</label><input class="in" id="lgText" maxlength="4" style="width:90px" value="' + UI.esc(d.text) + '"><button class="btn sm" data-act="lgText">Apply</button></div>' +
    '<div class="row">' + UI.LOGO_PALETTES.map(function (c, i) { return '<button class="btn sm" data-act="lgColor" data-arg="' + i + '" style="width:34px;height:34px;padding:0;border-radius:50%;background:linear-gradient(135deg,' + c[0] + ',' + c[1] + ',' + (c[2] || c[1]) + ');border:2px solid ' + (i === d.pal ? '#fff' : '#222') + ';box-shadow:' + (i === d.pal ? '0 0 10px ' + c[0] : 'none') + '"></button>'; }).join('') + '</div></div></div>';
  h += '<div class="lg-grid">' + UI.LOGO_DESIGNS.map(function (x, i) {
    return '<button class="lg-cell' + (i === d.design ? ' on' : '') + '" data-act="lgDesign" data-arg="' + i + '">' + UI.logoSvg({ design: i, pal: d.pal, text: d.text }, 64) + '<span>' + x.name + '</span></button>';
  }).join('') + '</div>';
  h += '<div class="row"><label style="min-width:0">Or upload your own image</label><input type="file" accept="image/*" data-ch="lgUpload" data-arg="' + d.id + '"></div>';
  h += '<div class="row"><button class="btn a" data-act="lgSave">Use this logo</button><button class="btn" data-act="lgReset">Default logo</button><button class="btn m" data-act="closeModal">Cancel</button></div>';
  UI.modal(h);
};
UI.act.lgDesign = function (i) { UI._logoDraft.design = +i; UI.logoModal(); };
UI.act.lgColor = function (i) { UI._logoDraft.pal = +i; UI.logoModal(); };
UI.act.lgText = function () { UI._logoDraft.text = UI.$('lgText').value.trim().toUpperCase().slice(0, 4); UI.logoModal(); };
UI.act.lgSave = function () {
  var d = UI._logoDraft, co = UAE.co(d.id), t = UI.$('lgText'); if (t) d.text = t.value.trim().toUpperCase().slice(0, 4);
  co.logo = { design: d.design, pal: d.pal, text: d.text }; delete co.logoImg;
  UI.closeModal(); UI.toast('New logo for ' + UI.esc(co.name) + '.', 'good'); UI.render(); if (UI.refreshHUD) UI.refreshHUD();
};
UI.act.lgReset = function () { var co = UAE.co(UI._logoDraft.id); delete co.logo; delete co.logoImg; UI.closeModal(); UI.render(); };
UI.act.lgUpload = function (coId, el) {
  var file = el.files && el.files[0]; if (!file) return;
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () {                     // square-crop to 128 px so saves stay small
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var s = Math.min(img.width, img.height), g = c.getContext('2d');
      g.fillStyle = '#05060a'; g.fillRect(0, 0, 128, 128);
      g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
      var co = UAE.co(coId); co.logoImg = c.toDataURL('image/png'); delete co.logo;
      UI.closeModal(); UI.toast('Uploaded logo set for ' + UI.esc(co.name) + '.', 'good'); UI.render();
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
};
