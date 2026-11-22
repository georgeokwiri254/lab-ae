/* ============================================================================
 * UAE CAPITALISM LAB  -  REAL PHOTOS OF BUILDINGS & LANDMARKS
 *  - Every firm window opens with a photo in the dark neon frame:
 *      real sites (Burj Khalifa, The Dubai Mall, Jebel Ali Port ...) -> their own photo,
 *      stores inside a mall -> that mall, service firms -> their kind (cafe, gym ...),
 *      everything else -> a real photo of that kind of building (UAE examples first).
 *  - The 42 landmark labels on the map are clickable: photo + Wikipedia summary.
 * Photos: Wikipedia / Wikimedia Commons (free licences), loaded at runtime.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

/* Real sites of real companies (seed firm name -> Wikipedia page). */
UAE.SITE_WIKI = {
  'The Dubai Mall': 'The_Dubai_Mall', 'Burj Khalifa (offices & residences)': 'Burj_Khalifa', 'Address Downtown': 'Address_Downtown',
  'Dubai Creek Harbour Residences': 'Dubai_Creek', 'Dubai Hills Mall': 'Dubai_Hills_Mall', 'Dubai Hills Estate Residences': 'Dubai_Hills_Estate',
  'MBR Al Maktoum Solar Park': 'Mohammed_bin_Rashid_Al_Maktoum_Solar_Park', 'Emirates NBD Head Office (Deira, rep)': 'Emirates_NBD',
  'Dubai Internet City offices': 'Dubai_Internet_City', 'Dubai Media City offices': 'Dubai_Media_City', 'Yas Mall': 'Yas_Mall',
  'Al Reem Island Residences': 'Al_Reem_Island', 'Khalifa Port terminals': 'Container_terminal', 'KEZAD Logistics Park': 'Warehouse',
  'Borouge Ruwais polymers': 'Borouge', 'Jebel Ali Port container terminals': 'Jebel_Ali_Port', 'JAFZA logistics park': 'Jebel_Ali_Free_Zone',
  'EGA Jebel Ali smelter': 'Aluminium_smelting', 'EGA Al Taweelah smelter & alumina refinery': 'Aluminium_smelting',
  'Burj Al Arab Jumeirah': 'Burj_Al_Arab', 'Jumeirah Beach Hotel': 'Jumeirah_Beach_Hotel', 'Madinat Jumeirah': 'Madinat_Jumeirah',
  'Ruwais Refinery': 'Ruwais', 'Mubadala Tower, Al Maryah': 'Al_Maryah_Island', 'Ferrari World Yas Island': 'Ferrari_World',
  'Warner Bros. World / SeaWorld Yas (rep)': 'Warner_Bros._World_Abu_Dhabi', 'Emirates Group HQ (Garhoud)': 'Emirates_(airline)',
  'Emirates SkyCargo / DXB': 'Emirates_SkyCargo', 'Business Bay residences (rep)': 'Business_Bay', 'Upper Zakum offshore (rep)': 'Oil_platform',
  'Etihad Cargo, Zayed Intl': 'Zayed_International_Airport', 'Centrepoint Mall of the Emirates': 'Mall_of_the_Emirates',
  'ENBD Mall of the Emirates': 'Mall_of_the_Emirates', 'Home Centre Deira City Centre': 'Deira_City_Centre', 'Centrepoint Yas Mall': 'Yas_Mall',
  'ENBD Dubai Marina': 'Dubai_Marina', 'FAB Downtown Dubai': 'Downtown_Dubai', 'IHC HQ Al Maryah (rep)': 'Al_Maryah_Island',
  'Presight AI (Masdar, rep)': 'Masdar', 'Air Arabia HQ, Sharjah Airport': 'Sharjah_International_Airport',
  'G42 / Khazna data centre (rep)': 'Data_center', 'Khor Khwair limestone quarry': 'Quarry', 'Spinneys Jumeirah': 'Jumeirah'
};
/* Your own (and AI) buildings: a real photo of that kind of building, UAE examples where possible. */
UAE.TYPE_WIKI = {
  retail: 'Supermarket', rnd: 'Laboratory', farm: 'Greenhouse', warehouse: 'Warehouse', factory: 'Factory', logging: 'Logging',
  mine: 'Quarry', oilwell: 'Oil_well', tv: 'Television_studio', newspaper: 'Printing_press', radio: 'Broadcasting',
  hq: 'Emirates_Towers', mansion: 'Mansion', apartment: 'Dubai_Marina', commercial: 'Jumeirah_Lake_Towers',
  civic: 'Abu_Dhabi_Municipality', sports: 'Hazza_bin_Zayed_Stadium', software: 'Dubai_Internet_City',
  internet: 'Data_center', telecom: 'Telecommunications_tower', bankhq: 'Dubai_International_Financial_Centre', bankbranch: 'Bank',
  inshq: 'Office', insoffice: 'Office', service: 'Coffeehouse', mall: 'Mall_of_the_Emirates', importer: 'Jebel_Ali_Port',
  exporter: 'Container_ship', logistics: 'Freight_transport', hotel: 'Hotel', solar: 'Photovoltaic_power_station', datacenter: 'Data_center'
};
UAE.SERVICE_WIKI = { restaurant: 'Restaurant', cafe: 'Coffeehouse', gym: 'Gym', salon: 'Beauty_salon', cinema: 'Movie_theater' };
UAE.LANDMARK_WIKI = {
  'The Dubai Mall': 'The_Dubai_Mall', 'Dubai Fountain': 'The_Dubai_Fountain', 'Atlantis The Palm': 'Atlantis,_The_Palm',
  'Ain Dubai (Bluewaters)': 'Ain_Dubai', 'DIFC Gate': 'Dubai_International_Financial_Centre', 'Gold Souk': 'Dubai_Gold_Souk', 'Dubai International (DXB)': 'Dubai_International_Airport',
  'Al Maktoum Intl (DWC)': 'Al_Maktoum_International_Airport', 'Global Village': 'Global_Village_(Dubai)', 'Dubai Creek Tower site': 'Dubai_Creek_Tower',
  'MBR Solar Park': 'Mohammed_bin_Rashid_Al_Maktoum_Solar_Park', 'Ferrari World': 'Ferrari_World', 'Zayed Intl Airport (AUH)': 'Zayed_International_Airport',
  'ADGM Square': 'Al_Maryah_Island', 'Ruwais Refinery': 'Ruwais', 'Barakah Nuclear Plant': 'Barakah_nuclear_power_plant',
  'Sharjah Intl Airport': 'Sharjah_International_Airport', 'Ajman Corniche': 'Ajman', 'Port of Fujairah': 'Fujairah', 'Khalifa Port': 'Container_terminal', 'Masdar City': 'Masdar'
};
UAE.landmarkWiki = function (l) { return UAE.LANDMARK_WIKI[l.name] || l.name.replace(/ /g, '_'); };

/** Which photo a firm shows: [wikiTitle, caption]. */
UI.firmPhotoTitle = function (f) {
  if (f.wiki) return [f.wiki, 'Photo of ' + f.wiki.replace(/_/g, ' ')];
  if (UAE.SITE_WIKI[f.name]) return [UAE.SITE_WIKI[f.name], 'Real site'];
  var mall = f.mall && UAE.S.firms[f.mall];
  if (mall) { var mt = UAE.SITE_WIKI[mall.name] || UAE.TYPE_WIKI.mall; return [mt, 'Inside ' + mall.name]; }
  if (f.type === 'service' && UAE.SERVICE_WIKI[f.svc]) return [UAE.SERVICE_WIKI[f.svc], 'Typical ' + UAE.SERVICES[f.svc].name.toLowerCase()];
  var t = UAE.TYPE_WIKI[f.type]; return t ? [t, 'Typical ' + UAE.FIRM_TYPES[f.type].name.toLowerCase() + ' (illustration)'] : null;
};
/** Wide photo banner in the dark neon frame. */
UI.placeBanner = function (title, caption, col) {
  var src = UI.wantPhoto(title), c = col || '#00f0ff';
  return '<div class="pbanner" style="--nc:' + c + '">' + (src ? '<img src="' + src + '" alt="">' : '<div class="pb-wait">' + (UI._wikiImg[title] === '' ? 'No photo available' : 'Loading photo…') + '</div>') +
    '<i class="fx"></i><div class="pb-cap">' + UI.esc(caption || '') + ' · <span>Wikimedia Commons via Wikipedia (free licence)</span></div></div>';
};
UI.firmBanner = function (f) {
  var t = UI.firmPhotoTitle(f); if (!t) return '';
  return UI.placeBanner(t[0], t[1], UI.ownerColor ? UI.ownerColor(UAE.co(f.owner)) : '#00f0ff');
};

/* ------------------------------------------------------- landmark panels */
UI._wikiText = {};
UI.wikiSummary = function (title) {
  if (UI._wikiText[title]) return Promise.resolve(UI._wikiText[title]);
  return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title)).then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (!j) return null; UI._wikiText[title] = { text: j.extract || '', title: j.title || title }; return UI._wikiText[title]; }).catch(function () { return null; });
};
UI.openLandmark = function (name) {
  var l = UAE.LANDMARKS.find(function (x) { return x.name === name; }); if (!l) return;
  var title = UAE.landmarkWiki(l);
  UI.wikiSummary(title).then(function () { if (UI.stack.length && UI.stack[UI.stack.length - 1].lm === name) UI.render(); });
  UI.open(name, function () {
    var s = UI._wikiText[title], firms = UAE.allFirms().filter(function (f) { return UAE.geo.km(f.c, l.c) < 0.6; });
    var h = UI.placeBanner(title, name + ' · ' + UAE.CITIES[l.city].name, '#ff2bd6');
    h += '<div class="box"><h3>' + UI.esc(name) + '</h3><div>' + (s ? UI.esc(s.text) : '<span class="muted">Loading description…</span>') + '</div>' +
      '<div class="row"><button class="btn" data-act="lmFly" data-arg="' + UI.esc(name) + '">Fly to</button></div></div>';
    if (firms.length) h += '<div class="box"><h3>Firms within 600 m</h3>' + UI.firmTable(firms.slice(0, 20)) + '</div>';
    return h;
  });
  UI.stack[UI.stack.length - 1].lm = name;
};
UI.act.lmFly = function (name) { var l = UAE.LANDMARKS.find(function (x) { return x.name === name; }); if (l) UI.flyTo(l.c, 16); };
