/* Core helpers for any page: HTML escaping, initials, local storage, display currency and translations.
   Reads SITE (data/site.js) for the storage prefix, currencies, languages and translation table. */
(function () {
  const U = window.UPUI = window.UPUI || {};

  function initials(n) { return n.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 1234 → "1K", 2500000 → "2.5M"
  const K = n => n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'K' : String(n);

  /* ---------- storage ---------- */
  const store = { get: k => { try { return JSON.parse(localStorage.getItem(SITE.storageKey + '.' + k)) } catch (e) { return null } }, set: (k, v) => localStorage.setItem(SITE.storageKey + '.' + k, JSON.stringify(v)) };
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
