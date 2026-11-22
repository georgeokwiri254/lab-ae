/* ============================================================================
 * UAE CAPITALISM LAB - PWA runtime (Android / phone build only)
 *  - saves: IndexedDB on the phone (each save is ~2-3 MB, too big for
 *    localStorage). Exposed as window.desktop so engine/save.js needs no change:
 *    slots live in memory and every save is written through to IndexedDB.
 *  - offline: registers sw.js (game files + visited map tiles are cached)
 *  - install banner, auto-save + pause when the app goes to the background
 * Loaded before the game scripts.
 * ==========================================================================*/
(function () {
  var DB_NAME = 'uaecl', STORE = 'slots', mem = {}, db = null;

  function openDb() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('no IndexedDB'));
      var rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE); };
      rq.onsuccess = function () { res(rq.result); };
      rq.onerror = function () { rej(rq.error); };
    });
  }
  function put(key, val) {
    if (!db) return Promise.reject(new Error('storage not ready'));
    return new Promise(function (res, rej) {
      var tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(val, key);
      tx.oncomplete = function () { res(true); }; tx.onerror = function () { rej(tx.error); };
    });
  }
  function readAll() {
    return new Promise(function (res, rej) {
      var tx = db.transaction(STORE, 'readonly'), st = tx.objectStore(STORE), out = {};
      var rq = st.openCursor();
      rq.onsuccess = function () { var c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      rq.onerror = function () { rej(rq.error); };
    });
  }
  function warn(msg) { if (window.UI && UI.toast) UI.toast(msg, 'bad'); else console.warn(msg); }

  // ready: memory filled from IndexedDB (and any old localStorage saves migrated)
  window.PWA_READY = openDb().then(function (d) { db = d; return readAll(); }).then(function (all) {
    mem = all || {};
    try {
      for (var s = 0; s < 4; s++) {
        var j = localStorage.getItem('uaecl_save_' + s);
        if (j && !mem['save_' + s]) { mem['save_' + s] = j; mem['meta_' + s] = localStorage.getItem('uaecl_meta_' + s); put('save_' + s, j); put('meta_' + s, mem['meta_' + s]); }
      }
    } catch (e) { /* no localStorage */ }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();   // ask Android not to evict saves
  }).catch(function (e) { console.warn('IndexedDB unavailable, saves stay in memory only', e); });

  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  window.desktop = {
    isDesktop: true, isPwa: true,
    saveSlot: function (slot, json, meta) {
      mem['save_' + slot] = json; mem['meta_' + slot] = meta;
      Promise.all([put('save_' + slot, json), put('meta_' + slot, meta)])
        .catch(function (e) { warn('Could not write the save to phone storage: ' + (e && e.message || e)); });
      return true;
    },
    loadSlot: function (slot) { return mem['save_' + slot] || null; },
    slotMeta: function (slot) { return mem['meta_' + slot] || null; },
    savesDir: function () { return 'this phone (app storage) - use Export to keep a copy'; },
    // Export: Android share sheet (Drive, Files, WhatsApp …) when available, else a download
    exportFile: function (name, text) {
      try {
        var f = new File([text], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [f] }))
          return navigator.share({ files: [f], title: name }).then(function () { return true; }, function () { download(name, text); return true; });
      } catch (e) { /* fall through */ }
      download(name, text); return Promise.resolve(true);
    }
  };

  /* ---------------- service worker + install / update banner ---------------- */
  var deferred = null;
  function bar(html) {
    var b = document.getElementById('pwaBar');
    if (!b) { b = document.createElement('div'); b.id = 'pwaBar'; b.className = 'glass neon-a'; document.body.appendChild(b); }
    b.innerHTML = html; b.classList.add('open'); return b;
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    var b = bar('<span>Install UAE Capitalism Lab as an app?</span><button class="btn a sm" id="pwaInstall">Install</button><button class="btn sm" id="pwaNo">Later</button>');
    b.querySelector('#pwaInstall').onclick = function () { b.classList.remove('open'); deferred.prompt(); deferred = null; };
    b.querySelector('#pwaNo').onclick = function () { b.classList.remove('open'); };
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      // updateViaCache 'none': always ask GitHub for a fresh sw.js (never a stale HTTP-cached copy)
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
        // a new version waiting -> banner; "Update now" saves, switches the new version in and reloads once it controls the page
        var offer = function (w) {
          if (!w || !navigator.serviceWorker.controller) return;
          var b = bar('<span>A new version of the game is ready.</span><button class="btn a sm" id="pwaUpd">Update now</button>');
          b.querySelector('#pwaUpd').onclick = function () {
            try { if (window.UAE && UAE.S && window.UI && UI.started) UAE.saveSlot(0); } catch (e) { /* ignore */ }
            b.querySelector('#pwaUpd').textContent = 'Updating…';
            w.postMessage('skipWaiting');
            setTimeout(function () { location.reload(); }, 4000);          // fallback if controllerchange never fires
          };
        };
        if (reg.waiting) offer(reg.waiting);                                // downloaded earlier, still waiting
        // Settings -> "Check for updates": ask the server now; install straight away if there is a new version
        window.pwaCheckUpdate = function (install) {
          if (window.UI && UI.toast) UI.toast('Checking for a new version…', 'good');
          var go = function (w) {
            if (!install) return offer(w);
            try { if (window.UAE && UAE.S && window.UI && UI.started) UAE.saveSlot(0); } catch (e) { /* ignore */ }
            if (window.UI && UI.toast) UI.toast('New version found – installing and restarting…', 'good');
            w.postMessage('skipWaiting'); setTimeout(function () { location.reload(); }, 4000);
          };
          if (reg.waiting) return go(reg.waiting);
          reg.update().then(function () {
            var w = reg.installing || reg.waiting;
            if (!w) { if (window.UI && UI.toast) UI.toast('You have the latest version.', 'good'); return; }
            if (w.state === 'installed') return go(w);
            w.addEventListener('statechange', function () { if (w.state === 'installed') go(w); });
          }).catch(function () { if (window.UI && UI.toast) UI.toast('No connection – try again when online.', 'bad'); });
        };
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing; if (!nw) return;
          nw.addEventListener('statechange', function () { if (nw.state === 'installed') offer(nw); });
        });
        // check for a new version on start and whenever the app comes back to the front
        reg.update().catch(function () {});
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
      }).catch(function (e) { console.warn('service worker failed', e); });
      var reloading = false, hadController = !!navigator.serviceWorker.controller;   // first visit: no reload
      navigator.serviceWorker.addEventListener('controllerchange', function () { if (reloading || !hadController) return; reloading = true; location.reload(); });
    });
  }

  /* ---------------- phone behaviour ---------------- */
  // phone CPU: shorter simulation slices per frame (smooth touch & scrolling), less frequent map / window redraws
  window.addEventListener('DOMContentLoaded', function () {
    if (!window.UI) return;
    UI.SIM_BUDGET = 35; UI.HUD_EVERY = 500; UI.MAP_EVERY = 2500; UI.PANEL_EVERY = 2500;
  });
  // Android may kill a backgrounded app: pause and auto-save (slot 0) when it is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'hidden' || !window.UI || !UI.started || !UAE.S) return;
    if (UAE.S.speed) { UI.lastSpeed = UAE.S.speed; UI.setSpeed(0); }
    try { UAE.saveSlot(0); } catch (e) { /* ignore */ }
  });
  window.addEventListener('DOMContentLoaded', function () {
    // portrait game: lock the orientation where Android allows it (installed app / full screen)
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(function () {}); } catch (e) { /* not supported */ }
    // a tap has no hover: show the plot footprint where the player tapped, then the build dialog
    if (window.UI && UI.tryBuild && UI.previewBuild) {
      var tb = UI.tryBuild;
      UI.tryBuild = function (p) { try { UI.previewBuild({ lat: p[0], lng: p[1] }); } catch (e) { /* preview is cosmetic */ } return tb.apply(this, arguments); };
    }
    // "Load saved game" right after launch: wait until phone storage has been read
    var lb = document.getElementById('ngLoad');
    if (lb) lb.addEventListener('click', function (e) {
      if (lb.dataset.ready) return;
      e.stopImmediatePropagation(); e.preventDefault();
      window.PWA_READY.then(function () { lb.dataset.ready = '1'; lb.click(); });
    }, true);
  });
})();
