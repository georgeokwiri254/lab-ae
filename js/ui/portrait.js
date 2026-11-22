/* ============================================================================
 * UAE CAPITALISM LAB  -  CEO PORTRAITS
 * Every person gets a drawn portrait (inline SVG, no image files, works offline).
 * The look is fixed per person (seeded from their id) so it never changes
 * between sessions. All CEOs are fictional characters, so the portraits are
 * illustrations, not photos of real people.
 *  - Emirati family names (Al ..., Bin ...): ghutra + agal, or a shayla.
 *  - Others: one of several hair styles, optional beard / glasses.
 *  - Suit colour, tie and background glow vary.
 * The player can cycle their own look (p.look) in Persons.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.FEMALE_NAMES = { Layla: 1, Mariam: 1, Fatima: 1, Noura: 1, Aisha: 1, Hessa: 1, Reem: 1, Sara: 1, Priya: 1, Elena: 1, Sofia: 1, Nadia: 1, Leila: 1 };
UI._hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Portrait features for a person (seeded; p.look overrides for the player). */
UI.portraitLook = function (p) {
  var h = UI._hash(p.id + '|' + p.name), pick = function (arr, k) { return arr[(h >>> k) % arr.length]; };
  var first = p.name.split(' ')[0], emirati = /\b(Al|Bin)\b/.test(p.name);
  var look = {
    fem: p.look && p.look.fem != null ? p.look.fem : !!UI.FEMALE_NAMES[first],
    skin: pick(['#f1c9a5', '#e0ac7e', '#c68b5e', '#a86d43', '#8a5533', '#5e3a22'], 1),
    hair: pick(['#1a1110', '#2b1a12', '#4a2c1a', '#6b4a2b', '#a87842', '#7a7a7a'], 4),
    suit: pick(['#0b1b3a', '#1b1b1b', '#2a2f3a', '#3a1030', '#0f2f2a', '#26262e'], 7),
    tie: pick(['#00f0ff', '#ff2bd6', '#b8ff2c', '#ffd24d', '#ff8a3d', '#b98cff'], 10),
    glow: pick(['#00f0ff', '#ff2bd6', '#b8ff2c', '#b98cff'], 13),
    style: (h >>> 16) % 4, beard: (h >>> 19) % 3 === 0, glasses: (h >>> 21) % 4 === 0,
    trad: emirati && (h >>> 23) % 5 !== 0           // most Emirati executives wear national dress
  };
  if (p.look) for (var k in p.look) look[k] = p.look[k];
  if (look.fem) look.beard = false;
  return look;
};

/* The player's own profile photo (desktop app only: img/player.jpg is NOT copied into the public phone/PWA site). */
UI.PLAYER_PHOTO = '';
/** Portrait of a person: the player's photo when available (falls back to the drawing), else the drawn portrait. */
UI.portrait = function (p, size) {
  if (!p) return '';
  var s = size || 64;
  if (p.isPlayer && !(p.look && p.look.noPhoto)) {
    var photo = p.photo || UI.PLAYER_PHOTO;
    return '<span class="portrait me-anim" style="position:relative;display:inline-block;width:' + s + 'px;height:' + s + 'px">' + UI.drawnPortrait(p, s) +
      '<img src="' + photo + '" alt="' + UI.esc(p.name) + '" onerror="this.remove()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid #00f0ff;box-sizing:border-box"></span>';
  }
  if (p.wiki && UI.wantPhoto) {
    var src = UI.wantPhoto(p.wiki);
    if (src) return '<span class="portrait" style="position:relative;display:inline-block;width:' + s + 'px;height:' + s + 'px"><img src="' + src + '" alt="' + UI.esc(p.name) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 20%;border-radius:50%;border:2px solid #ff2bd6;box-sizing:border-box;filter:contrast(1.15) saturate(1.15)"></span>';
  }
  return UI.drawnPortrait(p, s);
};
/** Drawn (SVG) portrait. size in px. */
UI.drawnPortrait = function (p, size) {
  if (!p) return '';
  var L = UI.portraitLook(p), s = size || 64, id = 'pg' + UI._hash(p.id).toString(36);
  var g = '<svg class="portrait" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" role="img" aria-label="' + UI.esc(p.name) + '">' +
    '<defs><radialGradient id="' + id + '" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="' + L.glow + '" stop-opacity=".55"/><stop offset="1" stop-color="#05060a" stop-opacity="1"/></radialGradient>' +
    '<clipPath id="' + id + 'c"><circle cx="32" cy="32" r="31"/></clipPath></defs>' +
    '<g clip-path="url(#' + id + 'c)"><rect width="64" height="64" fill="url(#' + id + ')"/>';
  // shoulders / clothing
  if (L.trad && !L.fem) g += '<path d="M6 64 C8 48 20 44 32 44 C44 44 56 48 58 64Z" fill="#f4f4f0"/><path d="M30 44 L32 56 L34 44Z" fill="#dcdcd6"/>';
  else if (L.trad && L.fem) g += '<path d="M6 64 C8 47 20 43 32 43 C44 43 56 47 58 64Z" fill="#111"/>';
  else g += '<path d="M6 64 C8 48 20 44 32 44 C44 44 56 48 58 64Z" fill="' + L.suit + '"/><path d="M26 44 L32 54 L38 44Z" fill="#f2f2f2"/>' +
    (L.fem ? '' : '<path d="M31 46 L33 46 L34 58 L32 61 L30 58Z" fill="' + L.tie + '"/>');
  // neck + head
  g += '<rect x="27" y="36" width="10" height="10" rx="3" fill="' + L.skin + '"/><ellipse cx="32" cy="27" rx="11" ry="13" fill="' + L.skin + '"/>';
  // head wear / hair
  if (L.trad && !L.fem) {
    g += '<path d="M19 26 C18 12 46 12 45 26 L49 46 C44 40 41 36 43 28 L21 28 C23 36 20 40 15 46Z" fill="#fbfbf7"/>' +
      '<path d="M20 20 C24 13 40 13 44 20 L44 23 C38 19 26 19 20 23Z" fill="#fff"/><rect x="19" y="17" width="26" height="3.4" rx="1.7" fill="#111"/>';
  } else if (L.trad && L.fem) {
    g += '<path d="M18 30 C16 10 48 10 46 30 L50 48 C44 42 42 38 43 30 C42 20 22 20 21 30 C22 38 20 42 14 48Z" fill="#141414"/><path d="M21 24 C24 17 40 17 43 24" stroke="#2a2a2a" stroke-width="2" fill="none"/>';
  } else if (L.fem) {
    g += ['<path d="M20 28 C18 12 46 12 44 28 L46 44 C42 40 42 30 40 22 C34 20 28 20 24 22 C22 30 22 40 18 44Z" fill="' + L.hair + '"/>',
      '<path d="M20 26 C19 12 45 12 44 26 C40 18 26 18 20 26Z" fill="' + L.hair + '"/><circle cx="32" cy="12" r="5" fill="' + L.hair + '"/>',
      '<path d="M20 30 C17 11 47 11 44 30 L44 38 C42 32 42 24 38 20 C30 22 26 24 22 22 C22 30 22 34 20 38Z" fill="' + L.hair + '"/>',
      '<path d="M20 27 C19 12 45 12 44 27 L45 36 C43 30 41 22 32 20 C25 21 22 26 21 36Z" fill="' + L.hair + '"/>'][L.style];
  } else {
    g += ['<path d="M21 24 C21 13 43 13 43 24 C40 19 24 19 21 24Z" fill="' + L.hair + '"/>',
      '<path d="M20 26 C19 12 45 12 44 26 L43 22 C38 17 26 17 21 22Z" fill="' + L.hair + '"/>',
      '<path d="M22 21 C26 15 38 15 42 21 C38 19 26 19 22 21Z" fill="' + L.hair + '"/>',
      '<path d="M20 25 C20 11 44 11 44 25 C42 18 34 16 30 19 C26 17 22 19 20 25Z" fill="' + L.hair + '"/>'][L.style];
  }
  // face
  g += '<ellipse cx="27.5" cy="27" rx="1.4" ry="1.6" fill="#1a1a1a"/><ellipse cx="36.5" cy="27" rx="1.4" ry="1.6" fill="#1a1a1a"/>' +
    '<path d="M25 23.5 Q27.5 22.4 30 23.4 M34 23.4 Q36.5 22.4 39 23.5" stroke="#2a1a12" stroke-width="1" fill="none"/>' +
    '<path d="M32 28 L31 32 L33 32" stroke="rgba(0,0,0,.25)" stroke-width=".9" fill="none"/>' +
    '<path d="M28.5 35 Q32 37.2 35.5 35" stroke="#7a3b2e" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
  if (L.beard) g += '<path d="M22 30 C22 42 42 42 42 30 C40 37 36 39 32 39 C28 39 24 37 22 30Z" fill="' + L.hair + '" opacity=".92"/><path d="M28.5 35.4 Q32 37 35.5 35.4" stroke="' + L.skin + '" stroke-width="1.1" fill="none"/>';
  if (L.glasses) g += '<g stroke="#0a0a0a" stroke-width="1.1" fill="rgba(0,240,255,.12)"><circle cx="27.5" cy="27" r="3.4"/><circle cx="36.5" cy="27" r="3.4"/><path d="M30.9 27 L33.1 27"/></g>';
  g += '</g><circle cx="32" cy="32" r="31" fill="none" stroke="' + L.glow + '" stroke-width="1.5" opacity=".8"/></svg>';
  return g;
};
