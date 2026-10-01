/* Shared UI for the UpNow customer site: icons, i18n, currency, header/footer, 4-line cards,
   filter engine, URL state, lead capture (request / call / WhatsApp), saved + enquiries drawers.
   Leads are written to localStorage `upnow.leads` — the provider workspace reads the same key,
   so an enquiry sent here appears in Provider → Demand / Leads / Communications. */
(function () {
  const { VERTICALS, VORDER, LISTINGS, AREAS, areaById, areaName, offerOf } = UP;
  const ROOT = /provider-workspace\//.test(location.pathname) ? '../' : '';

  /* ---------- icons ---------- */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/>',
    factory: '<path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
    plot: '<path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    party: '<path d="M5 21 9 9l6 6z"/><path d="M13 5a3 3 0 0 1 3-2M17 9a3 3 0 0 1 3-1M14 3l1 3M20 12l-3 1M18 4l-2 2"/>',
    racket: '<ellipse cx="10" cy="9" rx="6" ry="6.5"/><path d="m14.5 13.5 5.5 6.5M7 6l6 6M13 6l-6 6"/>',
    boat: '<path d="M3 17h18l-2 4H5zM5 17l2-6h10l2 6M12 11V3l5 5h-5"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
    bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 4.8a3.2 3.2 0 0 1 0 6.2M18 14.8c1.8.6 3 2.4 3 5.2"/>',
    ruler: '<path d="m3 17 14-14 4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.3-4.4"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    phone: '<path d="M5 3h3.5l1.8 4.6-2.3 1.5a11 11 0 0 0 6 6l1.5-2.3L20 14.5V18a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    wa: '<path d="M4 20l1.2-3.8A8.5 8.5 0 1 1 8 19z"/><path d="M9 9.2c.2 2.6 3 5.2 5.6 5.6l1.1-1.3-1.8-.9-.8.8c-1-.4-2.2-1.6-2.6-2.6l.8-.8-.9-1.8z"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chev: '<path d="m6 9 6 6 6-6"/>', chevR: '<path d="m9 6 6 6-6 6"/>', chevL: '<path d="m15 6-6 6 6 6"/>',
    grid4: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    car: '<path d="M5 17h14M5 17v2M19 17v2M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v4H3z"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    doc: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    grad: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 11h11l2-8H6.5"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 17l-2 4M15 17l2 4M9 14h.01M15 14h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    badge: '<path d="M12 2.5 14.6 5l3.6-.2.4 3.6L21 11l-2 3 .6 3.6-3.6.8-2 3-2.9-1.7L8.2 21l-1.8-3.2-3.5-1 .5-3.6L1.5 10 4.4 7.9 4.5 4.3 8 4.6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    villa: '<path d="M3 21V11l9-7 9 7v10"/><path d="M9 21v-6h6v6M3 21h18"/>',
    office: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    shop: '<path d="M4 9h16l-1-5H5zM4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M10 20v-5h4v5"/>',
    warehouse: '<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-8h10v8M7 16h10"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    snow: '<path d="M12 2v20M4 7l16 10M20 7 4 17"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
    ring: '<circle cx="12" cy="15" r="6"/><path d="m9 5 3 4 3-4-3-2z"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 5h-5L8 10zM12 3v4M21 10l-5 0M3 10h5M7 20l2-5M17 20l-2-5"/>',
    tree: '<path d="M12 22v-6M7 16h10l-5-13z"/>',
    seat: '<path d="M6 20v-4h12v4M6 16V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9M4 11h2M18 11h2"/>'
  };
  function initials(n) { return n.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24">${P[n] || P.grid4}</svg>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- normalise defs ---------- */
  const DATE_OPTS = [{ v: '0', l: 'Today' }, { v: '1', l: 'Tomorrow' }, { v: '3', l: 'Next 3 days' }, { v: '7', l: 'This week' }, { v: '14', l: 'Next 2 weeks' }, { v: '30', l: 'This month' }];
  VORDER.forEach(v => VERTICALS[v].offers.forEach(off => {
    off.defs.forEach(d => {
      if (d.type === 'date') { d.type = 'select'; d.options = DATE_OPTS; d.isDate = 1; if (!d.noMatch) d.test = (lv, val) => lv <= +val; d.fmtFact = x => x === 0 ? 'Available now' : x === 1 ? 'From tomorrow' : 'In ' + x + ' days'; }
    });
    off.def = id => off.defs.find(d => d.id === id);
    off.optional = off.defs.filter(d => !off.fields.includes(d.id));
    if (!off.spec) off.spec = (a, l) => off.meta(a, l).slice(0, 3).map(x => x[1]);
    if (!off.form) off.form = off.fields.filter(f => f !== 'loc').map(f => off.def(f)).filter(Boolean).slice(0, 4).map(d => [d.id, d.label, d.isDate ? 'date' : 'select', d.isDate ? null : d.options.map(o => o.l)]);
  }));
  VERTICALS.all = { id: 'all', label: 'All', icon: 'grid4', blurb: 'Everything on UpNow', offers: [] };
  const TABS = ['all', ...VORDER];

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

  /* ---------- favourites + leads ---------- */
  const favs = new Set(store.get('favs') || []);
  const leads = () => store.get('leads') || [];
  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id); store.set('favs', [...favs]);
    document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => b.classList.toggle('on', favs.has(id)));
    toast(favs.has(id) ? 'Saved to your shortlist' : 'Removed from shortlist'); updateHdrCounts();
  }
  const recent = () => (store.get('recent') || []).map(id => LISTINGS.find(l => l.id === id)).filter(Boolean);
  const pushRecent = id => store.set('recent', [id, ...(store.get('recent') || []).filter(x => x !== id)].slice(0, 12));

  /* ---------- header / footer ---------- */
  const NAV = [['spaces', 'Find a Space'], ['services', 'Book a Service'], ['experiences', 'Experiences'], ['memberships', 'Memberships'], ['programs', 'Programs'], ['insurance', 'Insurance']];
  const COUNTRIES = { AED: ['🇦🇪', 'UAE'], USD: ['🇺🇸', 'USD view'], EUR: ['🇪🇺', 'EUR view'], GBP: ['🇬🇧', 'GBP view'], SAR: ['🇸🇦', 'Saudi Arabia'], INR: ['🇮🇳', 'INR view'] };
  function header(active) {
    const main = NAV.slice(0, 3), rest = NAV.slice(3), restOn = rest.some(x => x[0] === active);
    return `<header class="hdr"><div class="wrap">
      <a class="logo" href="${ROOT}Home.html"><b>U</b><span>UpNow</span></a>
      <nav class="nav">${main.map(([id, l]) => `<a href="${ROOT}Search.html?v=${id}" data-nav="${id}" class="${active === id ? 'on' : ''}">${esc(t(l))}</a>`).join('')}
        <div class="nmore"><button class="${restOn ? 'on' : ''}" type="button">${restOn ? esc(t(rest.find(x => x[0] === active)[1])) : 'More'}${ico('chev')}</button>
          <div class="ndrop">${rest.map(([id, l]) => `<a href="${ROOT}Search.html?v=${id}" data-nav="${id}" class="${active === id ? 'on' : ''}">${ico(VERTICALS[id].icon)}<span><b>${esc(t(l))}</b><small>${esc(VERTICALS[id].blurb)}</small></span></a>`).join('')}</div></div></nav>
      <span class="sp"></span>
      <div class="hdr-r">
        <label class="tsel"><select id="hCur">${Object.keys(CUR).map(k => `<option value="${k}" ${prefs.cur === k ? 'selected' : ''}>${COUNTRIES[k][0]} ${k}</option>`).join('')}</select>${ico('chev')}</label>
        <label class="tsel g"><select id="hLang"><option value="en" ${prefs.lang === 'en' ? 'selected' : ''}>EN</option><option value="ar" ${prefs.lang === 'ar' ? 'selected' : ''}>عربي</option></select>${ico('chev')}</label>
        <button class="ib" data-open="saved" title="${t('Saved')}">${ico('heart')}<em id="hdrFav">0</em></button>
        <button class="ib" data-open="enq" title="${t('Enquiries')}">${ico('msg')}<em id="hdrLead">0</em></button>
        <button class="btn btn-o btn-sm" data-open="signin">${ico('user')}${t('Sign in')}</button>
        <a class="btn btn-g btn-sm" href="${ROOT}provider-workspace/index.html">${ico('brief')}${t('Become a provider')}</a>
      </div></div></header>`;
  }
  document.addEventListener('click', e => {
    const m = e.target.closest('.nmore > button'); document.querySelectorAll('.nmore').forEach(x => { if (!m || x !== m.parentNode) x.classList.remove('open'); });
    if (m) m.parentNode.classList.toggle('open');
  });
  function bindHeader() {
    const L = document.getElementById('hLang'), C = document.getElementById('hCur');
    if (L) L.onchange = () => { prefs.lang = L.value; store.set('prefs', prefs); location.reload(); };
    if (C) C.onchange = () => { prefs.cur = C.value; store.set('prefs', prefs); location.reload(); };
    updateHdrCounts();
  }
  function updateHdrCounts() { const f = document.getElementById('hdrFav'), l = document.getElementById('hdrLead'); if (f) { f.textContent = favs.size; f.hidden = !favs.size; } if (l) { l.textContent = leads().length; l.hidden = !leads().length; } }
  function footer() {
    const cats = VERTICALS.spaces.offers;
    return `<div class="wrap"><section class="cta"><div><div class="cta-k">FOR OWNERS, AGENTS & OPERATORS</div>
      <h2>List your space.<br>Get leads in 42 minutes.</h2><p style="margin:16px 0 22px">Homes, offices, warehouses, plots, holiday homes, venues, courts and yachts — customers reach you directly by call, WhatsApp or request. Manage every lead in the UpNow provider workspace.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" style="background:#fff;color:var(--g9)" href="${ROOT}provider-workspace/index.html">${ico('brief')}Become a provider</a><a class="btn" style="border:1.5px solid rgba(255,255,255,.4)" href="${ROOT}provider-workspace/leads.html">See how leads arrive</a></div></div>
      <div class="stats"><div><b>12,000+</b><span>active listings</span></div><div><b>850+</b><span>verified providers</span></div><div><b>42 min</b><span>avg. first reply</span></div><div><b>0 AED</b><span>fees for customers</span></div></div></section></div>
      <footer class="foot"><div class="wrap fgrid">
        <div><a class="logo" href="${ROOT}Home.html"><b>U</b>UpNow</a><p>Find verified spaces across Dubai and talk to the owner, agent or operator directly. No booking fees, no checkout.</p></div>
        <div><h5>Spaces</h5>${cats.map(o => `<a href="${ROOT}Search.html?v=spaces&o=${o.id}">${esc(o.label)}</a>`).join('')}</div>
        <div><h5>Popular areas</h5>${['dubai-marina', 'downtown', 'business-bay', 'jvc', 'al-quoz', 'palm-jumeirah', 'dip'].map(a => `<a href="${ROOT}Search.html?v=spaces&o=${['al-quoz', 'dip'].includes(a) ? 'industrial' : 'residential'}&loc=${a}">${esc(areaName(a))}</a>`).join('')}</div>
        <div><h5>UpNow</h5><a href="#">About</a><a href="#">Help centre</a><a href="#">Report a listing</a><a href="${ROOT}provider-workspace/index.html">Provider workspace</a><a href="#">Terms</a><a href="#">Privacy</a></div>
      </div><div class="wrap fbot"><span>© 2026 UpNow Technologies FZ-LLC · Dubai, UAE</span><span>Listings show DLD, DTCM or trade-licence numbers where applicable. UpNow never takes payments from customers.</span></div></footer>`;
  }

  /* ---------- engine ---------- */
  const offer = S => S.v === 'all' ? null : offerOf(S.v, S.o);
  const defsOf = S => { const O = offer(S); return O ? O.defs : []; };
  const toArr = x => Array.isArray(x) ? x.map(String) : [String(x)];
  const empty = v => v == null || v === '' || (Array.isArray(v) && !v.length);
  const priceOf = (l, S) => { const O = offerOf(l.v, l.cat); return O.priceOf ? O.priceOf(l, S && S.o === l.cat ? S : null) : l.price; };
  function fieldVal(d, l, S) { if (d.get) return d.get(l, S); if (d.id === 'price') return priceOf(l, S); return l.a[d.field || d.id]; }
  function testDef(d, val, l, S) {
    if (empty(val) || d.noMatch) return true;
    const lv = fieldVal(d, l, S);
    if (d.type === 'range') return lv != null && (val.min == null || lv >= val.min) && (val.max == null || lv <= val.max);
    if (d.type === 'toggle') return !!lv;
    if (lv == null) return false;
    if (d.test) return d.test(lv, Array.isArray(val) ? val : val);
    const arr = toArr(lv);
    if (d.type === 'multi') return d.all ? val.every(x => arr.includes(x)) : val.some(x => arr.includes(x));
    return arr.includes(String(val));
  }
  function matches(l, S, skip) {
    if (S.v !== 'all') { if (l.v !== S.v) return false; if (S.o && l.cat !== S.o) return false; }
    const O = offerOf(l.v, l.cat);
    if (S.loc.length && !O.locAll && !S.loc.some(id => l.loc === id || (l.coverage || []).includes(id))) return false;
    if (S.q) { const hay = (l.title + ' ' + (l.building || '') + ' ' + areaName(l.loc) + ' ' + l.provider.name + ' ' + l.provider.org + ' ' + O.label).toLowerCase(); if (!S.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w))) return false; }
    if (S.v !== 'all') for (const d of O.defs) { if (d.id === skip) continue; if (!testDef(d, S.f[d.id], l, S)) return false; }
    return true;
  }
  function results(S) {
    const r = LISTINGS.filter(l => matches(l, S));
    const so = {
      rec: (a, b) => (b.featured - a.featured) || (b.rating * Math.log(b.reviews + 2)) - (a.rating * Math.log(a.reviews + 2)),
      plh: (a, b) => priceOf(a, S) - priceOf(b, S), phl: (a, b) => priceOf(b, S) - priceOf(a, S),
      new: (a, b) => a.posted - b.posted, fast: (a, b) => a.provider.reply - b.provider.reply,
      szl: (a, b) => (b.a.sqft || b.a.capacity || 0) - (a.a.sqft || a.a.capacity || 0)
    };
    return r.sort(so[S.sort] || so.rec);
  }
  const facetCount = (S, id, value) => LISTINGS.filter(l => matches(l, { ...S, f: { ...S.f, [id]: value } })).length;
  const SORTS = [['rec', 'Recommended'], ['new', 'Newest'], ['plh', 'Price: low to high'], ['phl', 'Price: high to low'], ['szl', 'Largest first'], ['fast', 'Fastest reply']];

  /* ---------- URL state ---------- */
  function blankState(v, o) {
    v = VERTICALS[v] ? v : 'spaces';
    const O = v === 'all' ? null : offerOf(v, o);
    return { v, o: O ? O.id : null, q: '', loc: [], sort: 'rec', page: 1, view: 'grid', f: O ? { ...(O.defaults || {}) } : {} };
  }
  function parseState(qs) {
    const p = new URLSearchParams(qs || location.search);
    const S = blankState(p.get('v'), p.get('o'));
    S.q = p.get('q') || ''; S.loc = (p.get('loc') || '').split(',').filter(x => areaById[x]);
    S.sort = p.get('sort') || 'rec'; S.page = +p.get('page') || 1; S.view = p.get('view') || 'grid';
    defsOf(S).forEach(d => {
      if (d.type === 'range') { const a = p.get(d.id + '_min'), b = p.get(d.id + '_max'); if (a || b) S.f[d.id] = { min: a ? +a : null, max: b ? +b : null }; }
      else if (d.type === 'multi') { const x = p.get(d.id); if (x) S.f[d.id] = x.split(','); }
      else if (d.type === 'toggle') { if (p.get(d.id) === '1') S.f[d.id] = true; }
      else { const x = p.get(d.id); if (x) S.f[d.id] = x; }
    });
    return S;
  }
  function toQuery(S) {
    const p = new URLSearchParams(); p.set('v', S.v); if (S.o) p.set('o', S.o);
    if (S.loc.length) p.set('loc', S.loc.join(',')); if (S.q) p.set('q', S.q);
    defsOf(S).forEach(d => {
      const val = S.f[d.id]; if (empty(val)) return;
      if (d.type === 'range') { if (val.min != null) p.set(d.id + '_min', val.min); if (val.max != null) p.set(d.id + '_max', val.max); }
      else if (d.type === 'multi') p.set(d.id, val.join(','));
      else if (d.type === 'toggle') p.set(d.id, '1'); else p.set(d.id, val);
    });
    if (S.sort && S.sort !== 'rec') p.set('sort', S.sort);
    if (S.view && S.view !== 'grid') p.set('view', S.view);
    if (S.page > 1) p.set('page', S.page);
    return '?' + p.toString().replace(/%2C/g, ',');
  }
  function rangeLabel(r, unit) {
    if (!r) return '';
    const f = n => unit === 'sqft' ? UP.K(n) + ' sqft' : moneyK(n);
    if (r.min != null && r.max != null) return unit === 'sqft' ? UP.K(r.min) + '–' + UP.K(r.max) + ' sqft' : moneyK(r.min) + '–' + UP.K(Math.round(r.max * CUR[prefs.cur][0]));
    if (r.min != null) return f(r.min) + '+'; return 'Up to ' + f(r.max);
  }
  function valueLabel(d, val) {
    if (empty(val)) return '';
    if (d.type === 'range') return rangeLabel(val, d.unit);
    if (d.type === 'toggle') return d.label;
    const lab = x => (d.options.find(o => o.v === x) || {}).l || x;
    if (d.type === 'multi') { const ls = val.map(lab); return ls.length > 2 ? ls.slice(0, 2).join(', ') + ' +' + (ls.length - 2) : ls.join(', '); }
    return lab(val);
  }
  function factValue(d, l) {
    const lv = l.a[d.field || d.id];
    if (lv == null || d.type === 'range') return null;
    if (d.type === 'toggle') return lv ? 'Yes' : 'No';
    if (d.fmtFact) return d.fmtFact(lv);
    if (d.fmt) return d.fmt(lv);
    const lab = x => (d.options.find(o => o.v === String(x)) || {}).l || x;
    return Array.isArray(lv) ? lv.map(lab).join(', ') : lab(lv);
  }

  /* ---------- cards: exactly 4 lines — title · location · spec · price ---------- */
  const badges = l => `<div class="badges">${l.featured ? `<span class="bdg f">${t('Featured')}</span>` : ''}${l.a.verified ? `<span class="bdg v">${ico('shield')}${t('Verified')}</span>` : ''}</div>`;
  function photo(l, i = 0) {
    if (l.img && l.img.length) return `<img src="${ROOT}${l.img[i % l.img.length]}" alt="${esc(l.title)}" loading="lazy">`;
    return `<div class="tile" style="--h:165"><b>${esc(initials(l.provider.name))}</b><span>${esc(l.provider.name)}</span><small>${esc(offerOf(l.v, l.cat).label)} insurance</small></div>`;
  }
  function priceText(l, S) { const O = offerOf(l.v, l.cat); const SS = S && S.o === l.cat ? S : null; return { n: money(priceOf(l, SS)), u: O.unit(l, SS) }; }
  const specOf = l => { const O = offerOf(l.v, l.cat); return O.spec(l.a, l, { def: id => O.def(id) }); };
  const locText = l => offerOf(l.v, l.cat).locAll ? 'All UAE' : (l.building ? l.building + ', ' : '') + areaName(l.loc);
  function card(l, S) {
    const pt = priceText(l, S);
    return `<a class="card" href="${ROOT}Listing.html?id=${l.id}" data-id="${l.id}">
      <div class="ph">${photo(l)}${badges(l)}<button class="fav ${favs.has(l.id) ? 'on' : ''}" data-fav="${l.id}" aria-label="Save">${ico('heart')}</button>${l.img.length > 1 ? `<span class="cnt">${ico('grid4')}${l.img.length}</span>` : ''}</div>
      <div class="bd"><div class="t">${esc(l.title)}</div>
        <div class="loc">${ico('pin')}<span>${esc(locText(l))}</span></div>
        <div class="spec">${specOf(l).map(s => `<span>${esc(s)}</span>`).join('')}</div>
        <div class="pr">${pt.n}<span>${pt.u}</span></div></div></a>`;
  }

  /* ---------- modal / drawer / toast ---------- */
  let scrim, side;
  function ensure() {
    if (scrim) return;
    scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.innerHTML = '<div class="modal" role="dialog"></div>';
    scrim.addEventListener('click', e => { if (e.target === scrim) closeModal(); }); document.body.appendChild(scrim);
    side = document.createElement('div'); side.className = 'side-s'; side.innerHTML = '<aside class="side-d"></aside>';
    side.addEventListener('click', e => { if (e.target === side) closeSide(); }); document.body.appendChild(side);
    const tt = document.createElement('div'); tt.className = 'toast'; tt.id = 'toast'; document.body.appendChild(tt);
  }
  const closeModal = () => { ensure(); const was = scrim.classList.contains('on'); scrim.classList.remove('on'); if (was) document.dispatchEvent(new Event('upnow:leads')); };
  function openModal(html, cls = '') { ensure(); const m = scrim.firstChild; m.className = 'modal ' + cls; m.innerHTML = html; scrim.classList.add('on'); m.scrollTop = 0; m.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal); }
  const closeSide = () => { ensure(); side.classList.remove('on'); };
  function openSide(html) { ensure(); side.firstChild.innerHTML = html; side.classList.add('on'); side.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSide); }
  function toast(msg) { ensure(); const tt = document.getElementById('toast'); tt.innerHTML = ico('check') + esc(msg); tt.classList.add('on'); clearTimeout(tt._t); tt._t = setTimeout(() => tt.classList.remove('on'), 2600); }

  /* ---------- lead capture ---------- */
  const byId = id => LISTINGS.find(l => l.id === id);
  const fmtPhone = p => p.replace(/^\+971(\d{2})(\d{3})(\d{4})$/, '+971 $1 $2 $3');
  function waText(l) { return `Hi ${l.provider.name.split(' ')[0]}, I found your listing on UpNow and I'm interested.\n\n${l.title}\n${locText(l)}\nRef ${l.ref}\n\nIs it still available?`; }
  const waLink = l => 'https://wa.me/' + l.provider.phone.replace('+', '') + '?text=' + encodeURIComponent(waText(l));
  function providerHead(l, big) {
    return `<div class="phead ${big ? 'big' : ''}"><div class="av">${esc(initials(l.provider.name))}</div>
      <div><div class="nm">${esc(l.provider.name)} ${l.a.verified ? `<span class="vt">${ico('shield')}</span>` : ''}</div><div class="or">${esc(l.provider.org)}${l.provider.brn ? ' · BRN ' + l.provider.brn : ''}</div></div></div>`;
  }
  function me() { return store.get('me') || { name: '', phone: '+971 ', email: '' }; }
  function logLead(type, l, extra = {}) {
    const O = offerOf(l.v, l.cat), pt = priceText(l);
    const rec = { id: 'Q' + Date.now().toString(36).toUpperCase(), type, lid: l.id, t: Date.now(), title: l.title, img: l.img[0] || 'img/hero.jpg', cat: l.cat, catLabel: O.label, area: areaName(l.loc), building: l.building,
      price: l.price, unit: O.unit(l), spec: specOf(l), provider: l.provider.name, org: l.provider.org, pphone: l.provider.phone, reply: l.provider.reply, ref: l.ref, action: O.action, flow: O.flow, ...extra };
    store.set('leads', [rec, ...leads()]); updateHdrCounts(); return rec;
  }
  /* contact modals — clean, customer-focused */
  function cHead(l, sub) {
    const pt = priceText(l);
    return `<div class="cm-h"><div class="av">${esc(initials(l.provider.name))}${l.a.verified ? `<em>${ico('shield')}</em>` : ''}</div>
      <div class="cm-t"><b>${esc(l.provider.name)}</b><span>${esc(l.provider.org)}</span><span class="rp"><i></i>${esc(sub || 'Usually replies in ~' + l.provider.reply + ' min')}</span></div><button class="x" data-close>${ico('x')}</button></div>
      <div class="cm-l"><img src="${ROOT}${l.img[0] || 'img/hero.jpg'}" alt=""><div><b>${esc(l.title)}</b><span>${esc(locText(l))} · ${pt.n}${pt.u}</span></div><em>Ref ${l.ref}</em></div>`;
  }
  const cSwitch = (l, skip) => `<div class="cm-alt">${[['call', 'phone', 'Call'], ['wa', 'wa', 'WhatsApp'], ['email', 'msg', 'Email']].filter(x => x[0] !== skip).map(([k, i, lb]) => `<button class="btn btn-o" data-${k}="${l.id}">${ico(i)}${lb}</button>`).join('')}</div>`;
  function call(id) {
    const l = byId(id); logLead('call', l, { name: me().name || 'Customer', phone: me().phone, msg: 'Called from listing' });
    openModal(`${cHead(l, 'Available 9 AM – 9 PM')}
      <div class="cm-b"><a href="tel:${l.provider.phone}" class="cm-num">${ico('phone')}<span>${fmtPhone(l.provider.phone)}</span></a>
        <div class="cm-row"><button class="btn btn-o" onclick="navigator.clipboard&&navigator.clipboard.writeText('${l.provider.phone}');UPUI.toast('Number copied')">${ico('doc')}Copy number</button><a class="btn btn-g" href="tel:${l.provider.phone}">${ico('phone')}Call now</a></div>
        <p class="cm-tip">Say you found it on <b>UpNow</b> and quote <b>${l.ref}</b>.</p>
        <div class="cm-or"><span>or contact by</span></div>${cSwitch(l, 'call')}</div>`, 'cm');
  }
  function whatsapp(id) {
    const l = byId(id);
    openModal(`${cHead(l)}
      <div class="cm-b"><label class="cm-lb">Your message</label><textarea class="cm-msg" id="waTxt">${esc(waText(l))}</textarea>
        <a class="btn btn-wa cm-go" href="${waLink(l)}" target="_blank" id="waGo">${ico('wa')}Continue in WhatsApp</a>
        <div class="cm-or"><span>or contact by</span></div>${cSwitch(l, 'wa')}</div>`, 'cm');
    const tx = document.getElementById('waTxt'), go = document.getElementById('waGo');
    tx.oninput = () => { go.href = 'https://wa.me/' + l.provider.phone.replace('+', '') + '?text=' + encodeURIComponent(tx.value); };
    go.onclick = () => { logLead('whatsapp', l, { name: me().name || 'Customer', phone: me().phone, msg: tx.value.split('\n')[0] }); setTimeout(closeModal, 250); toast('Opening WhatsApp…'); };
  }
  function request(id) {
    const l = byId(id), m = me(), fn = l.provider.name.split(' ')[0];
    openModal(`${cHead(l)}
      <form class="cm-b" id="leadForm"><div class="fgrid2">
          <div class="fld"><label>Full name</label><input required name="name" value="${esc(m.name)}" placeholder="Your name"></div>
          <div class="fld"><label>Mobile</label><input required name="phone" value="${esc(m.phone)}" inputmode="tel"></div>
          <div class="fld full"><label>Email</label><input name="email" type="email" required value="${esc(m.email)}" placeholder="you@email.com"></div>
          <div class="fld full"><label>Message</label><textarea name="msg" rows="4">${esc(`Hi ${fn}, I'm interested in ${l.title} (Ref ${l.ref}). Is it still available?`)}</textarea></div></div>
        <button class="btn btn-g cm-go">${ico('msg')}Send email to ${esc(fn)}</button>
        <p class="cm-tip">Shared only with ${esc(fn)}. UpNow never asks for payment.</p></form>`, 'cm');
    document.getElementById('leadForm').onsubmit = e => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target).entries());
      store.set('me', { name: fd.name, phone: fd.phone, email: fd.email });
      const rec = logLead('email', l, { name: fd.name, phone: fd.phone, email: fd.email, msg: fd.msg, pref: 'Email' });
      openModal(`<div class="cm-ok"><button class="x" data-close>${ico('x')}</button><div class="okc">${ico('check')}</div><h3>Email sent to ${esc(fn)}</h3><p>${esc(fn)} usually replies within ~${l.provider.reply} min. We’ll let you know on WhatsApp too.</p>
        <div class="cm-steps"><div class="on"><i>${ico('check')}</i><span>Sent</span></div><div><i>2</i><span>${esc(fn)} replies</span></div><div><i>3</i><span>${LEASE_CAT(l) ? 'Viewing' : 'Confirm'}</span></div></div>
        <div class="cm-row"><button class="btn btn-o" data-open="enq">${ico('msg')}My enquiries</button><button class="btn btn-wa" data-wa="${l.id}">${ico('wa')}Also WhatsApp</button></div><small>Reference ${rec.id}</small></div>`, 'cm');
    };
  }
  const LEASE_CAT = l => !!offerOf(l.v, l.cat).lease;
  /* customer-side status (preview of the customer dashboard) */
  function status(r) {
    const m = (Date.now() - r.t) / 60000;
    if (r.type === 'call') return ['Number viewed', 'mute'];
    if (m < 1) return ['Sent', 'info'];
    if (m < 4) return ['Seen by provider', 'warn'];
    return [r.type === 'whatsapp' ? 'Chat opened' : 'Provider replied', 'ok'];
  }
  const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  function enquiries() {
    const L = leads();
    openSide(`<div class="sd-h"><div><h3>My enquiries</h3><small>${L.length} sent · replies come by WhatsApp, call or email</small></div><button class="x" data-close>${ico('x')}</button></div>
      <div class="sd-b">${L.length ? L.map(r => { const [s, k] = status(r); return `<a class="enq" href="${ROOT}Listing.html?id=${r.lid}"><img src="${ROOT}${r.img}" alt=""><div class="bd"><div class="r1"><b>${esc(r.title)}</b><span class="stp ${k}">${s}</span></div>
        <small>${esc(r.catLabel)} · ${esc(r.area)} · ${esc(r.provider)}</small>
        <small>${{ request: 'Enquiry', email: 'Email enquiry', call: 'Phone call', whatsapp: 'WhatsApp' }[r.type]} · ${ago(r.t)} · ${esc(r.id)}</small></div></a>`; }).join('')
        : `<div class="sd-empty">${ico('msg')}<b>No enquiries yet</b><span>When you request a viewing, call or WhatsApp a provider, it's tracked here.</span></div>`}</div>
      <div class="sd-f"><span>Full tracking, documents and payments arrive with your UpNow account.</span></div>`);
  }
  function saved() {
    const L = [...favs].map(byId).filter(Boolean);
    openSide(`<div class="sd-h"><div><h3>Saved</h3><small>${L.length} spaces on your shortlist</small></div><button class="x" data-close>${ico('x')}</button></div>
      <div class="sd-b">${L.length ? `<div class="sd-grid">${L.map(l => card(l)).join('')}</div>` : `<div class="sd-empty">${ico('heart')}<b>Nothing saved yet</b><span>Tap the heart on any listing to keep it here.</span></div>`}</div>`);
  }
  function signin() {
    openModal(`<div class="mh"><h3>Sign in to UpNow</h3><button class="x" data-close>${ico('x')}</button></div>
      <div class="mb"><p style="margin:0 0 14px;color:var(--ink2)">Keep your saved spaces and enquiries on every device.</p>
      <div class="fld"><label>Mobile number</label><input value="+971 " inputmode="tel"></div>
      <button class="btn btn-g" style="width:100%;height:46px" onclick="UPUI.closeModal();UPUI.toast('We sent a code by WhatsApp')">${ico('wa')}Continue with WhatsApp code</button>
      <div class="or"><span>or</span></div><button class="btn btn-o" style="width:100%" onclick="UPUI.closeModal();UPUI.toast('Signed in')">Continue with UAE PASS</button>
      <p class="fine">Listing a space? <a class="lnk" href="${ROOT}provider-workspace/index.html">Become a provider</a></p></div>`);
  }

  document.addEventListener('click', e => {
    const f = e.target.closest('[data-fav]'); if (f) { e.preventDefault(); e.stopPropagation(); toggleFav(f.dataset.fav); return; }
    const c = e.target.closest('[data-call]'); if (c) { e.preventDefault(); e.stopPropagation(); call(c.dataset.call); return; }
    const w = e.target.closest('[data-wa]'); if (w) { e.preventDefault(); e.stopPropagation(); whatsapp(w.dataset.wa); return; }
    const b = e.target.closest('[data-req],[data-email]'); if (b) { e.preventDefault(); e.stopPropagation(); request(b.dataset.req || b.dataset.email); return; }
    const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); closeModal(); ({ enq: enquiries, saved, signin })[o.dataset.open](); return; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeSide(); } });

  window.UPUI = {
    ICONS: P, ico, esc, t, prefs, money, moneyK, header, bindHeader, footer, updateHdrCounts, card, photo, badges, priceText, priceOf, specOf, locText, offer, defsOf, matches, results, facetCount, SORTS,
    TABS, blankState, parseState, toQuery, valueLabel, factValue, rangeLabel, empty, call, whatsapp, request, toast, favs, byId, providerHead, initials, openModal, closeModal, openSide, closeSide,
    leads, recent, pushRecent, ROOT, fmtPhone
  };
})();
