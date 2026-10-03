/* Core helpers: escaping, initials, local storage, display currency and translations (EN / AR). */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { LISTINGS } = UP;

  function initials(n) { return n.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));


  /* ---------- storage ---------- */
  const store = { get: k => { try { return JSON.parse(localStorage.getItem('upnow.' + k)) } catch (e) { return null } }, set: (k, v) => localStorage.setItem('upnow.' + k, JSON.stringify(v)) };
  const prefs = Object.assign({ lang: 'en', cur: 'AED' }, store.get('prefs') || {});

  /* ---------- currency (marketplace display only — providers price in AED) ---------- */
  const CUR = { AED: [1, 'AED'], USD: [.2723, 'USD'], EUR: [.2512, 'EUR'], GBP: [.2105, 'GBP'], SAR: [1.021, 'SAR'], INR: [22.7, 'INR'] };
  const money = n => { const [r, s] = CUR[prefs.cur] || CUR.AED; const v = n * r; return s + ' ' + (v < 100 ? (Math.round(v * 10) / 10).toLocaleString() : Math.round(v).toLocaleString()); };
  const moneyK = n => { const [r, s] = CUR[prefs.cur] || CUR.AED; return s + ' ' + UP.K(Math.round(n * r)); };

  /* ---------- i18n (chrome + shared labels) ---------- */
  const AR = {
    'Rent': 'إيجار', 'Residential': 'سكني', 'Commercial': 'تجاري', 'Industrial': 'صناعي', 'Land': 'أراضٍ', 'Mixed-use': 'متعدد الاستخدامات', 'Holiday homes': 'بيوت العطلات', 'Venues': 'قاعات', 'Sports courts': 'ملاعب', 'Yachts': 'يخوت',
    'Saved': 'المحفوظات', 'Enquiries': 'استفساراتي', 'Sign in': 'تسجيل الدخول', 'Become a provider': 'انضم كمزوّد', 'Search': 'بحث', 'Location': 'الموقع', 'More filters': 'فلاتر إضافية', 'All filters': 'كل الفلاتر',
    'Call': 'اتصال', 'WhatsApp': 'واتساب', 'Save search': 'حفظ البحث', 'See all': 'عرض الكل', 'Popular areas': 'مناطق شائعة', 'How UpNow works': 'كيف يعمل أب ناو', 'Verified': 'موثّق', 'Featured': 'مميّز',
    'Explore spaces': 'استكشف المساحات', 'Recently viewed': 'شوهدت مؤخرًا', 'results': 'نتيجة', 'Grid': 'شبكة', 'Map': 'خريطة'
  };
  const t = s => prefs.lang === 'ar' ? (AR[s] || s) : s;
  function applyLang() { document.documentElement.lang = prefs.lang; document.documentElement.dir = prefs.lang === 'ar' ? 'rtl' : 'ltr'; }
  applyLang();


  /* ---------- lookups ---------- */
  const byId = id => LISTINGS.find(l => l.id === id);
  const fmtPhone = p => p.replace(/^\+971(\d{2})(\d{3})(\d{4})$/, '+971 $1 $2 $3');

  Object.assign(U, { initials, esc, store, prefs, CUR, money, moneyK, t, byId, fmtPhone });
})();
