/* Core helpers for any page: HTML escaping, initials, local storage, display currency and translations.
   Reads SITE (data/site.js) for the storage prefix, currencies, languages and translation table. */
(function () {
  const U = window.UPUI = window.UPUI || {};

  function initials(n) { return n.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 1234 → "1K", 2500000 → "2.5M"
  const K = n => n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'K' : String(n);

  /* ---------- storage ----------
     Activity belongs to the account that did it: saved listings, enquiries, saved searches, the account page's own record
     (lists, notes, documents…), recently viewed and contact details are kept per signed-in account. Signed out, they go to
     a guest area; logging in moves the guest's activity into that account (store.adopt), creating an account starts empty. Device settings
     (language, currency), the sign-in itself and the list of accounts stay shared. */
  const OWN = ['favs', 'leads', 'alerts', 'dash', 'recent', 'me'];
  const raw = k => SITE.storageKey + '.' + k;
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const ownerOf = u => u ? (u.phone ? (u.dial || '') + u.phone : String(u.email || '').toLowerCase()) : '';
  const keyFor = (k, who) => OWN.includes(k) && who ? raw(k) + '@' + who : raw(k);
  const store = {
    get: k => read(keyFor(k, ownerOf(read(raw('user'))))),
    set: (k, v) => localStorage.setItem(keyFor(k, ownerOf(read(raw('user')))), JSON.stringify(v)),
    // after sign-in: what was done signed out joins the account (nothing the account already had is lost), then the guest area is cleared
    adopt() {
      const who = ownerOf(read(raw('user'))); if (!who) return;
      OWN.forEach(k => {
        const guest = read(raw(k)); if (guest == null) return;
        const mine = read(keyFor(k, who));
        const merged = Array.isArray(guest) ? (k === 'leads' ? [...(mine || []), ...guest.filter(g => !(mine || []).some(x => x.id === g.id))].sort((a, b) => b.t - a.t) : [...new Set([...(mine || []), ...guest])])
          : guest && typeof guest === 'object' ? Object.assign({}, guest, mine || {}) : mine == null ? guest : mine;
        localStorage.setItem(keyFor(k, who), JSON.stringify(merged)); localStorage.removeItem(raw(k));
      });
    },
    // after creating an account: it starts empty, so the guest area is dropped instead
    clearGuest() { OWN.forEach(k => localStorage.removeItem(raw(k))); }
  };
  // once: activity saved before accounts were separate belongs to whoever is signed in now (nothing is lost);
  // saved searches move from their old key
  if (!localStorage.getItem(raw('scoped'))) {
    if (raw('alerts') !== 'upnow.alerts') { const old = read('upnow.alerts'); if (old && !read(raw('alerts'))) localStorage.setItem(raw('alerts'), JSON.stringify(old)); localStorage.removeItem('upnow.alerts'); }
    store.adopt(); localStorage.setItem(raw('scoped'), '1');
  }
  const base = Object.keys(SITE.currencies)[0];
  const prefs = Object.assign({ lang: SITE.languages[0][0], cur: base }, store.get('prefs') || {});

  /* ---------- currency (display only — prices are stored in the base currency) ---------- */
  const CUR = SITE.currencies;
  const money = n => { const [r, s] = CUR[prefs.cur] || CUR[base]; const v = n * r; return s + ' ' + (v < 100 ? (Math.round(v * 10) / 10).toLocaleString() : Math.round(v).toLocaleString()); };
  const moneyK = n => { const [r, s] = CUR[prefs.cur] || CUR[base]; return s + ' ' + K(Math.round(n * r)); };

  /* ---------- i18n ---------- */
  const t = s => (SITE.i18n[prefs.lang] || {})[s] || s;
  function applyLang() { document.documentElement.lang = prefs.lang; document.documentElement.dir = (SITE.rtl || []).includes(prefs.lang) ? 'rtl' : 'ltr'; }
  applyLang();

  const fmtPhone = p => p.replace(/^\+971(\d{2})(\d{3})(\d{4})$/, '+971 $1 $2 $3');

  Object.assign(U, { initials, esc, K, store, prefs, CUR, money, moneyK, t, fmtPhone });
})();
