/* ============================================================================
 * UAE CAPITALISM LAB  -  PRODUCT PICTURES, NAMED PEOPLE & EXECUTIVE TEAM UI
 *  - Product pictures: a real photo of each product type (Wikipedia / Wikimedia
 *    Commons, free licences, loaded at runtime) shown in a dark "hyper-render"
 *    frame: deep black, neon border (cyan / magenta / acid green by product kind),
 *    contrast + glow grading, scanlines and a 3D-style reflection.
 *    No photo available -> a neon icon tile.
 *  - People: rename anyone on your staff and give them a photo from a Wikipedia
 *    page (e.g. Jensen_Huang) - used by portraits and the spotlight.
 *  - HQ: Executive team (CEO tech focus, CMO advertising policy, CTO R&D).
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UAE.PRODUCT_WIKI = {
  crude: 'Petroleum', gas: 'Natural_gas', limestone: 'Limestone', sand: 'Sand', bauxite: 'Bauxite', wheat: 'Wheat', rawmilk: 'Milk',
  poultry: 'Chicken', dates: 'Date_palm', veg: 'Vegetable', cotton: 'Cotton', leather: 'Leather', gold: 'Bullion', chips: 'Integrated_circuit',
  coffeebn: 'Coffee_bean', oud: 'Agarwood', alumina: 'Aluminium_oxide', aluminium: 'Aluminium', cement: 'Cement', glass: 'Float_glass',
  polymer: 'Polyethylene', urea: 'Fertilizer', flour: 'Flour', jetfuel: 'Jet_fuel', petrol: 'Gasoline', water: 'Bottled_water', milk: 'Milk',
  laban: 'Buttermilk', bread: 'Pita', chicken: 'Chicken_as_food', vegbox: 'Vegetable', datesbox: 'Date_palm', snacks: 'Potato_chip',
  coffee: 'Arabic_coffee', perfume: 'Attar', skincare: 'Cosmetics', kandura: 'Thawb', fashion: 'Clothing', footwear: 'Shoe',
  jewelry: 'Jewellery', watch: 'Watch', phone: 'Smartphone', laptop: 'Laptop', tv: 'Smart_TV', aircon: 'Air_conditioning', furniture: 'Couch',
  medicine: 'Medication', toys: 'Toy', car: 'Car', os: 'Operating_system', ai: 'Virtual_assistant', office: 'Microsoft_Office',
  security: 'Antivirus_software', design: 'Graphics_software', video: 'Video_editing_software', audio: 'Digital_audio_workstation',
  utility: 'Computer_program', game: 'Video_game', chipip: 'Integrated_circuit_design', lithium: 'Lithium_carbonate',
  rareearth: 'Rare-earth_element', battery: 'Lithium-ion_battery', aichip: 'AI_accelerator', motor: 'Electric_motor', sensor: 'Lidar',
  ev: 'Electric_car', robot: 'Humanoid_robot', arglasses: 'Smartglasses', vr: 'Virtual_reality_headset', drone: 'Quadcopter',
  silicon: 'Polycrystalline_silicon', copper: 'Copper', wafer: 'Wafer_(electronics)', gpu: 'Video_card'
};
UI.PRODUCT_GLYPH = { raw: '⛏', inter: '⚙', consumer: '🛍', fuel: '⛽', software: '💾' };
UI.kindColor = function (P) { return P.kind === 'software' ? '#ff2bd6' : P.kind === 'raw' || P.kind === 'inter' ? '#b8ff2c' : '#00f0ff'; };

/* Wikipedia photo lookups resolve asynchronously: re-render the open panel once when new photos arrive. */
UI._photoRerender = null;
UI.wantPhoto = function (title) {
  if (!title || !UI.wikiPhoto) return null;
  if (UI._wikiImg[title]) return UI._wikiImg[title];
  if (UI._wikiImg[title] === '') return null;
  if (!UI._wikiPending) UI._wikiPending = {};
  if (!UI._wikiPending[title]) {
    UI._wikiPending[title] = 1;
    UI.wikiPhoto(title).then(function (src) {
      delete UI._wikiPending[title];
      if (src && !UI._photoRerender) UI._photoRerender = setTimeout(function () { UI._photoRerender = null; if (UI.stack && UI.stack.length) UI.render(); }, 250);
    });
  }
  return null;
};

/** Product picture tile in the dark neon hyper-render frame. size = width in px. */
UI.productImg = function (pid, size) {
  var P = UAE.P[pid]; if (!P) return '';
  var s = size || 64, col = UI.kindColor(P), src = UI.wantPhoto(UAE.PRODUCT_WIKI[pid]);
  var inner = src ? '<img src="' + src + '" alt="" loading="lazy">' : '<span class="glyph">' + (UI.PRODUCT_GLYPH[P.kind] || '◆') + '</span>';
  return '<span class="pimg" style="width:' + s + 'px;height:' + Math.round(s * 0.75) + 'px;--nc:' + col + '" title="' + UI.esc(P.name) + '">' + inner + '<i class="fx"></i></span>';
};
/** Large product hero: picture + name + key facts (Product Details, factory lines). */
UI.productHero = function (pid, extra) {
  var P = UAE.P[pid];
  return '<div class="phero" style="--nc:' + UI.kindColor(P) + '">' + UI.productImg(pid, 220) + '<div class="ptxt"><div class="pname">' + UI.esc(P.name) + '</div>' +
    '<div class="muted">' + UI.esc(P.cls) + ' · ' + P.kind + ' · ' + P.unit + '</div>' + (extra || '') +
    (UAE.PRODUCT_WIKI[pid] ? '<div class="credit">Photo: Wikimedia Commons via Wikipedia (free licence)</div>' : '') + '</div></div>';
};

/* ---------------------------------------------- people: name & photo edit */
UI.act.personEdit = function (pid) {
  var p = UAE.person(pid); if (!p) return;
  UI.modal('<h2>Name &amp; photo</h2><div class="row"><label>Name</label><input class="in" id="peName" style="flex:1" value="' + UI.esc(p.name) + '"></div>' +
    '<div class="row"><label>Photo</label><input class="in" id="peWiki" style="flex:1" value="' + UI.esc(p.wiki || '') + '" placeholder="Wikipedia page, e.g. Jensen_Huang"></div>' +
    '<div class="note">Optional: the name of a Wikipedia page about this person. Its main photo (Wikimedia Commons, free licence) becomes the portrait. Leave empty for a drawn portrait.</div>' +
    '<div class="row"><button class="btn a" data-act="personEditYes" data-arg="' + p.id + '">Save</button><button class="btn" data-act="closeModal">Cancel</button></div>');
};
UI.act.personEditYes = function (pid) {
  var p = UAE.person(pid), n = UI.$('peName').value.trim(), w = UI.$('peWiki').value.trim().replace(/^https?:\/\/[^/]+\/wiki\//, '').replace(/ /g, '_');
  if (n) p.name = n; p.wiki = w || null;
  UI.closeModal(); UI.toast('Updated ' + UI.esc(p.name) + '.', 'good'); UI.render();
};
UI.act.hireCto = function (pid) { var co = UAE.co(UI.$('hireCo').value); UI.result(UAE.appointCto(co, pid), 'CTO appointed - now managing R&D projects.'); };
UI.act.newPerson = function () {
  var p = UAE.makePerson({ title: 'Candidate' }); UAE.S.candidates = UAE.S.candidates || []; UAE.S.candidates.unshift(p.id); p.elite = 'staff';
  UI.tabState.pflt = 'cand'; UI.tabState.person = p.id; UI.render(); UI.act.personEdit(p.id);
};

/* ---------------------------------------------------- HQ: executive team */
UI.execBox = function (co) {
  var pol = UAE.policy(co), ceo = UAE.person(co.ceo), cmo = co.cmo && UAE.person(co.cmo), cto = co.cto && UAE.person(co.cto);
  var row = function (label, p, body) {
    return '<div class="row" style="align-items:center;gap:12px">' + (p ? UI.portrait(p, 44) : '<span class="logo mono" style="width:44px;height:44px">?</span>') +
      '<div style="min-width:170px"><b>' + label + '</b><br>' + (p ? UI.esc(p.name) : '<span class="muted">vacant</span>') + '</div><div style="flex:1">' + body + '</div></div>';
  };
  var h = '<div class="box"><h3>Executive team</h3>';
  h += row('CEO', ceo, '<label><input type="checkbox" data-ch="execFocus" data-arg="' + co.id + '"' + (pol.focus === 'tech' ? ' checked' : '') + '> Tech focus: build the chip & AI supply chain first (chip design → wafers → chips → AI chips / GPUs → AI software → devices), then other businesses</label>' +
    '<br><label><input type="checkbox" data-ch="execDelegate" data-arg="' + co.id + '"' + (co.ceoAuto ? ' checked' : '') + (ceo && ceo.isPlayer ? ' disabled' : '') + '> CEO runs the company (expansion, pricing, policies)</label>' + (ceo && ceo.isPlayer ? ' <span class="muted">appoint a CEO in Persons first</span>' : '') +
    ' <button class="btn sm" data-act="execAllBiz" data-arg="' + co.id + '">Allow all businesses</button>' +
    '<br>New firms the CEO may create per month <input type="range" class="slider" min="0" max="100" step="1" value="' + (pol.maxNewPerMonth != null ? pol.maxNewPerMonth : (UAE.AGGRESSION[pol.aggression || 'normal'] || UAE.AGGRESSION.normal).n) + '" data-in="execMaxNew" data-ch="execMaxNewDone" data-arg="' + co.id + '" style="width:220px;vertical-align:middle"> <b id="maxNewOut" class="t-a">' + (pol.maxNewPerMonth != null ? pol.maxNewPerMonth : (UAE.AGGRESSION[pol.aggression || 'normal'] || UAE.AGGRESSION.normal).n) + '</b> <span class="muted">(0 = only normal moves · keeps a cash reserve)</span>');
  h += row('CMO', cmo, '<label><input type="checkbox" data-ch="execCmo" data-arg="' + co.id + '"' + (pol.cmoAuto !== false ? ' checked' : '') + (cmo ? '' : ' disabled') + '> Markets <b>every business</b>: campaigns for the best-selling products in every city + an ad budget for every firm (banks, insurance, shops, factories, hotels, malls…)</label>' +
    '<br>Budget <input class="in num" id="cmoPct" style="width:56px" value="' + (pol.cmoPct == null ? 3 : pol.cmoPct) + '"> % of monthly revenue + <input class="in num" id="cmoCashPct" style="width:56px" value="' + (pol.cmoCashPct || 0) + '"> % of cash each month <button class="btn sm" data-act="execCmoPct" data-arg="' + co.id + '">Set</button>' +
    '<br><label><input type="checkbox" data-ch="execCeoCmo" data-arg="' + co.id + '"' + (pol.ceoRaiseCmo !== false ? ' checked' : '') + '> CEO raises the CMO budget when it is not enough, up to</label> <input class="in num" id="cmoMaxPct" style="width:50px" value="' + (pol.cmoMaxPct == null ? UAE.CMO.maxPct : pol.cmoMaxPct) + '"> % of revenue <button class="btn sm" data-act="execCmoMax" data-arg="' + co.id + '">Set</button>' +
    '<br><span class="muted">This month ≈ ' + UAE.fmt.aed(UAE.cmoBudget(co)) + (co.cmoLast ? ' · last month: ' + UAE.fmt.aed(co.cmoLast.budget) + ' on ' + (co.cmoLast.firms || co.cmoLast.serviceFirms) + ' businesses, ' + co.cmoLast.campaigns + ' product campaigns' + (co.cmoLast.need ? ' · needed ' + UAE.fmt.aed(co.cmoLast.need) + ' (covered ' + Math.round(Math.min(1, co.cmoLast.cover) * 100) + '%)' : '') + (co.cmoLast.raised ? ' · CEO raised the budget ' + co.cmoLast.raised.from + '% → ' + co.cmoLast.raised.to + '%' : '') : '') + '</span>' +
    (co.cmoLast && co.cmoLast.groups ? '<br><span class="muted">By business: ' + Object.keys(co.cmoLast.groups).sort(function (a, b) { return co.cmoLast.groups[b] - co.cmoLast.groups[a]; }).map(function (g) { return g + ' ' + UAE.fmt.aed(co.cmoLast.groups[g]); }).join(' · ') + ' · products ' + UAE.fmt.aed(co.cmoLast.products) + '</span>' : ''));
  h += row('CTO', cto, '<label><input type="checkbox" data-ch="execCto" data-arg="' + co.id + '"' + (pol.ctoAuto !== false ? ' checked' : '') + (cto ? '' : ' disabled') + '> Manages R&amp;D: keeps every R&amp;D centre and software company researching the next model, biggest gaps first</label>' +
    (cto ? '<br><span class="muted">R&amp;D speed ×' + UAE.ctoMult(co).toFixed(2) + ' · ' + UAE.firmsOf(co.id).filter(function (f) { return f.project; }).length + ' projects running</span>' : ' <span class="muted">appoint a CTO in Persons (Appoint as CTO)</span>'));
  return h + '<div class="row"><button class="btn a" data-act="hireForCo" data-arg="' + co.id + '">👔 Hire for ' + UI.esc(co.name) + '</button><button class="btn" data-act="persCand">Candidates</button><button class="btn" data-act="newPerson">+ New person (name &amp; photo)</button></div></div>';
};
UI.act.execFocus = function (id, el) { UAE.policy(UAE.co(id)).focus = el.checked ? 'tech' : null; UI.toast(el.checked ? 'CEO tech focus on.' : 'Tech focus off.', 'good'); };
UI.act.execDelegate = function (id, el) { UAE.co(id).ceoAuto = el.checked; UI.toast(el.checked ? 'The CEO now runs the company.' : 'You run the company again.', 'good'); };
UI.act.execAllBiz = function (id) { var pol = UAE.policy(UAE.co(id)); UAE.EXPANSION.forEach(function (x) { pol.expand[x[0]] = true; }); pol.expandRetail = true; UI.toast('All expansion strategies enabled.', 'good'); UI.render(); };
UI.act.execAggr = function (id, el) { UAE.policy(UAE.co(id)).aggression = el.value; UI.toast('CEO aggressiveness: ' + el.value + '.', 'good'); };
UI.act.execCmo = function (id, el) { UAE.policy(UAE.co(id)).cmoAuto = el.checked; };
UI.act.execCeoCmo = function (id, el) { UAE.policy(UAE.co(id)).ceoRaiseCmo = el.checked; UI.toast(el.checked ? 'The CEO will raise the CMO budget when it is short.' : 'The CEO will leave the CMO budget alone.', 'good'); };
UI.act.execCmoMax = function (id) {
  var v = UI.num('cmoMaxPct'); if (!(v >= 1 && v <= 30)) { UI.toast('Limit 1–30% of revenue.', 'bad'); return; }
  var co = UAE.co(id); UAE.policy(co).cmoMaxPct = v; co._cmoCapWarned = false; UI.toast('The CEO may raise the CMO budget up to ' + v + '% of revenue.', 'good'); UI.render();
};
UI.act.execCto = function (id, el) { UAE.policy(UAE.co(id)).ctoAuto = el.checked; };
UI.act.execCmoPct = function (id) {
  var v = UI.num('cmoPct'), c = UI.num('cmoCashPct');
  if (!(v >= 0 && v <= 30) || !(c >= 0 && c <= 20)) { UI.toast('Revenue 0–30%, cash 0–20% per month.', 'bad'); return; }
  var pol = UAE.policy(UAE.co(id)); pol.cmoPct = v; pol.cmoCashPct = c;
  UI.toast('CMO budget: ' + v + '% of revenue + ' + c + '% of cash per month (≈ ' + UAE.fmt.aed(UAE.cmoBudget(UAE.co(id))) + ').', 'good'); UI.render();
};

/* ------------------------------------------- product categories (by item) */
UAE.PRODUCT_GROUPS = [
  ['food', '🍞 Food & Drink'], ['fashion', '👗 Fashion & Beauty'], ['electronics', '📱 Electronics & Devices'], ['ai', '🧠 AI & Chips'],
  ['software', '💾 Software'], ['vehicles', '🚗 Vehicles & Robots'], ['home', '🏠 Home & Health'], ['energy', '⛽ Fuel & Energy'],
  ['industrial', '🏗 Industrial Materials'], ['space', '🚀 Space'], ['raw', '⛏ Raw Materials']
];
UAE.productGroup = function (P) {
  var c = P.cls;
  if (['Space Launch', 'Spacecraft', 'Space Services', 'Orbital Compute'].indexOf(c) >= 0) return 'space';
  if (['AI Hardware', 'Semiconductors', 'Semiconductor Materials', 'Chip Design'].indexOf(c) >= 0) return 'ai';
  if (P.kind === 'software') return 'software';
  if (['Electric Vehicles', 'Automobile', 'Robotics', 'Robotics Components', 'Drones', 'Batteries', 'Battery Materials'].indexOf(c) >= 0) return 'vehicles';
  if (['Fuel', 'Oil & Gas', 'Petrochemicals'].indexOf(c) >= 0) return P.kind === 'raw' ? 'raw' : 'energy';
  if (P.kind === 'raw') return 'raw';
  if (P.kind === 'inter') return 'industrial';
  if (['Beverage', 'Food', 'Livestock Products', 'Snacks'].indexOf(c) >= 0) return 'food';
  if (['Apparel', 'Footwear', 'Jewelry', 'Watch', 'Cosmetics', 'Body Care Products'].indexOf(c) >= 0) return 'fashion';
  if (['Communication Devices', 'Computer', 'Electronic Products', 'Home Appliances', 'Wearables'].indexOf(c) >= 0) return 'electronics';
  return 'home';
};
/** Category tabs + clickable picture tiles for choosing a product (Product Details). */
UI.productBrowser = function (pid) {
  var g = UI.tabState.pdGroup || UAE.productGroup(UAE.P[pid]);
  var list = UAE.PRODUCTS.filter(function (p) { return UAE.productGroup(p) === g; });
  return UI.tabs('pdGroup', UAE.PRODUCT_GROUPS.map(function (x) {
      var n = UAE.PRODUCTS.filter(function (p) { return UAE.productGroup(p) === x[0]; }).length; return [x[0], x[1] + ' <span class="muted">' + n + '</span>'];
    }), g) +
    '<div class="pd-grid">' + list.map(function (p) {
      return '<button class="pd-tile' + (p.id === pid ? ' on' : '') + '" data-act="pdPick" data-arg="' + p.id + '" data-help="' + UI.esc(p.cls + (p.ref ? ' · shelf price AED ' + p.ref : '') + (p.grow ? ' · demand +' + Math.round(p.grow * 100) + '%/yr' : '')) + '" data-help-title="' + UI.esc(p.name) + '">' +
        UI.productImg(p.id, 76) + '<span>' + UI.esc(p.name) + '</span></button>';
    }).join('') + '</div>';
};
UI.act.pdPick = function (pid) { UI.tabState.pdPid = pid; UI.render(); };
