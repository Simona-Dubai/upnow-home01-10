/* Site header (navigation, currency, language, saved / enquiries / sign-in) and footer (provider CTA, links). */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc, t, prefs, store, CUR, favs, leads } = U;
  const { VERTICALS, areaName } = UP;
  const HREF = PATHS.href;

  /* ---------- header / footer ---------- */
  const NAV = [['spaces', 'Find a Space'], ['services', 'Book a Service'], ['experiences', 'Experiences'], ['memberships', 'Memberships'], ['programs', 'Programs'], ['insurance', 'Insurance']];
  const COUNTRIES = { AED: ['🇦🇪', 'UAE'], USD: ['🇺🇸', 'USD view'], EUR: ['🇪🇺', 'EUR view'], GBP: ['🇬🇧', 'GBP view'], SAR: ['🇸🇦', 'Saudi Arabia'], INR: ['🇮🇳', 'INR view'] };
  function header(active) {
    const main = NAV.slice(0, 3), rest = NAV.slice(3), restOn = rest.some(x => x[0] === active);
    return `<header class="site-header"><div class="wrap">
      <a class="logo" href="${HREF.home}"><b>U</b><span>UpNow</span></a>
      <nav class="nav">${main.map(([id, l]) => `<a href="${HREF.search}?v=${id}" data-nav="${id}" class="${active === id ? 'is-active' : ''}">${esc(t(l))}</a>`).join('')}
        <div class="nav-more"><button class="${restOn ? 'is-active' : ''}" type="button">${restOn ? esc(t(rest.find(x => x[0] === active)[1])) : 'More'}${ico('chev')}</button>
          <div class="nav-dropdown">${rest.map(([id, l]) => `<a href="${HREF.search}?v=${id}" data-nav="${id}" class="${active === id ? 'is-active' : ''}">${ico(VERTICALS[id].icon)}<span><b>${esc(t(l))}</b><small>${esc(VERTICALS[id].blurb)}</small></span></a>`).join('')}</div></div></nav>
      <span class="spacer"></span>
      <div class="header-actions">
        <label class="header-select"><select id="hCur">${Object.keys(CUR).map(k => `<option value="${k}" ${prefs.cur === k ? 'selected' : ''}>${COUNTRIES[k][0]} ${k}</option>`).join('')}</select>${ico('chev')}</label>
        <label class="header-select is-subtle"><select id="hLang"><option value="en" ${prefs.lang === 'en' ? 'selected' : ''}>EN</option><option value="ar" ${prefs.lang === 'ar' ? 'selected' : ''}>عربي</option></select>${ico('chev')}</label>
        <button class="icon-btn" data-open="saved" title="${t('Saved')}">${ico('heart')}<em id="hdrFav">0</em></button>
        <button class="icon-btn" data-open="enq" title="${t('Enquiries')}">${ico('msg')}<em id="hdrLead">0</em></button>
        <button class="btn btn-outline btn-sm" data-open="signin">${ico('user')}${t('Sign in')}</button>
        <a class="btn btn-primary btn-sm" href="${HREF.join}">${ico('brief')}${t('Become a provider')}</a>
      </div></div></header>`;
  }
  document.addEventListener('click', e => {
    const m = e.target.closest('.nav-more > button'); document.querySelectorAll('.nav-more').forEach(x => { if (!m || x !== m.parentNode) x.classList.remove('is-open'); });
    if (m) m.parentNode.classList.toggle('is-open');
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
    return `<div class="wrap"><section class="cta" id="provider-cta"><div><div class="cta-kicker">FOR OWNERS, AGENTS & OPERATORS</div>
      <h2>List your space.<br>Get leads in 42 minutes.</h2><p style="margin:16px 0 22px">Homes, offices, warehouses, plots, holiday homes, venues, courts and yachts — customers reach you directly by call, WhatsApp or request. Manage every lead in the UpNow provider workspace.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" style="background:#fff;color:var(--g9)" href="${HREF.join}">${ico('brief')}Become a provider</a><a class="btn" style="border:1.5px solid rgba(255,255,255,.4)" href="${HREF.join}">See how leads arrive</a></div></div>
      <div class="stats"><div><b>12,000+</b><span>active listings</span></div><div><b>850+</b><span>verified providers</span></div><div><b>42 min</b><span>avg. first reply</span></div><div><b>0 AED</b><span>fees for customers</span></div></div></section></div>
      <footer class="site-footer"><div class="wrap footer-grid">
        <div><a class="logo" href="${HREF.home}"><b>U</b>UpNow</a><p>Find verified spaces across Dubai and talk to the owner, agent or operator directly. No booking fees, no checkout.</p></div>
        <div><h5>Spaces</h5>${cats.map(o => `<a href="${HREF.search}?v=spaces&o=${o.id}">${esc(o.label)}</a>`).join('')}</div>
        <div><h5>Popular areas</h5>${['dubai-marina', 'downtown', 'business-bay', 'jvc', 'al-quoz', 'palm-jumeirah', 'dip'].map(a => `<a href="${HREF.search}?v=spaces&o=${['al-quoz', 'dip'].includes(a) ? 'industrial' : 'residential'}&loc=${a}">${esc(areaName(a))}</a>`).join('')}</div>
        <div><h5>UpNow</h5><a href="#">About</a><a href="#">Help centre</a><a href="#">Report a listing</a><a href="${HREF.join}">Provider information</a><a href="#">Terms</a><a href="#">Privacy</a></div>
      </div><div class="wrap footer-bottom"><span>© 2026 UpNow Technologies FZ-LLC · Dubai, UAE</span><span>Listings show DLD, DTCM or trade-licence numbers where applicable. UpNow never takes payments from customers.</span></div></footer>`;
  }

  Object.assign(U, { header, bindHeader, updateHdrCounts, footer });
})();
