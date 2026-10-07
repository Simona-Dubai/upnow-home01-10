/* Site header and footer, rendered from the SITE config (data/site.js).
   header(activeNavId, { nav: false, tabs: false }) → logo, navigation (nav: false leaves it out, e.g. where the page has its own category tabs) (with "More" dropdown), currency / language selects, saved / enquiries counters,
   sign-in and a call-to-action button — each part can be switched off in SITE.header.
   On phones the header is joined by a bottom tab bar (Explore · Search · Saved · Enquiries · Log in/Me); tabs: false leaves it out
   (e.g. the listing page, where a sticky action bar takes its place). It is hidden on wider screens by CSS.
   footer({ cta: false }) → optional CTA band (cta: false leaves it out), about text, link columns and legal lines. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc, t, prefs, store, CUR } = U;
  const HREF = PATHS.href;

  // phone bottom tab bar
  const tabOn = name => ({ search: /search\.html/, home: /(index\.html|\/)$/ })[name].test(location.pathname);
  function meTab() {
    const u = U.auth && U.auth.user();
    return u ? `<button type="button" data-me-tab data-account-tab><span class="mobile-tabs-avatar">${esc(U.auth.initialsOf(u))}</span>${esc(t('Me'))}</button>`
      : `<button type="button" data-me-tab data-open="signin">${ico('user')}${esc(t('Log in'))}</button>`;
  }
  const mTabs = () => `<nav class="mobile-tabs" aria-label="Main">
      <a href="${SITE.homeHref || HREF.home}" class="${tabOn('home') ? 'is-active' : ''}">${ico('home')}${esc(t('Explore'))}</a>
      <a href="${HREF.search}" class="${tabOn('search') ? 'is-active' : ''}">${ico('search')}${esc(t('Search'))}</a>
      <button type="button" data-open="saved">${ico('heart')}${esc(t('Saved'))}<em id="mtFav" hidden></em></button>
      <button type="button" data-open="enq">${ico('msg')}${esc(t('Enquiries'))}<em id="mtLead" hidden></em></button>
      ${meTab()}</nav>`;
  // sign-in / sign-out changes the last tab
  document.addEventListener('upnow:auth', () => { const m = document.querySelector('.mobile-tabs [data-me-tab]'); if (m) m.outerHTML = meTab(); });
  // "Me" opens the header account menu (a bottom sheet on phones)
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-account-tab]')) return;
    const m = document.querySelector('.site-header .account-menu'); if (!m) return;
    e.stopImmediatePropagation(); m.classList.toggle("is-open");
  }, true);

  function header(active, { nav = true, tabs = true } = {}) {
    const H = SITE.header, main = H.nav.slice(0, H.visible), rest = H.nav.slice(H.visible), cur = rest.find(x => x.id === active);
    const link = x => `<a href="${x.href}" data-nav="${x.id}" class="${active === x.id ? 'is-active' : ''}">`;
    return `<header class="site-header"><div class="wrap">
      <a class="logo" href="${SITE.homeHref || HREF.home}"><b>${esc(SITE.logoMark)}</b><span>${esc(SITE.name)}</span></a>
      ${nav ? `<nav class="nav">${main.map(x => `${link(x)}${esc(t(x.label))}</a>`).join('')}
        ${rest.length ? `<div class="nav-more"><button class="${cur ? 'is-active' : ''}" type="button">${cur ? esc(t(cur.label)) : 'More'}${ico('chev')}</button>
          <div class="nav-dropdown">${rest.map(x => `${link(x)}${ico(x.icon)}<span><b>${esc(t(x.label))}</b><small>${esc(x.blurb)}</small></span></a>`).join('')}</div></div>` : ''}</nav>` : ''}
      <span class="spacer"></span>
      <div class="header-actions">
        ${H.currency ? `<label class="header-select"><select id="hCur">${Object.keys(CUR).map(k => `<option value="${k}" ${prefs.cur === k ? 'selected' : ''}>${CUR[k][2]} ${k}</option>`).join('')}</select>${ico('chev')}</label>` : ''}
        ${H.language ? `<label class="header-select is-subtle"><select id="hLang">${SITE.languages.map(([k, l]) => `<option value="${k}" ${prefs.lang === k ? 'selected' : ''}>${l}</option>`).join('')}</select>${ico('chev')}</label>` : ''}
        ${H.saved ? `<button class="icon-btn" data-open="saved" title="${t('Saved')}">${ico('heart')}<em id="hdrFav">0</em></button>` : ''}
        ${H.enquiries ? `<button class="icon-btn" data-open="enq" title="${t('Enquiries')}">${ico('msg')}<em id="hdrLead">0</em></button>` : ''}
        ${H.signIn ? (U.accountButton ? U.accountButton() : `<button class="btn btn-outline btn-sm" data-open="signin">${ico('user')}${t('Sign in')}</button>`) : ''}
        ${H.cta ? `<a class="btn btn-primary btn-sm" href="${H.cta.href}">${H.cta.icon ? ico(H.cta.icon) : ''}${t(H.cta.label)}</a>` : ''}
      </div></div></header>${tabs ? mTabs() : ''}`;
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
  // counters come from the marketplace state module when it is loaded
  function updateHdrCounts() {
    [['hdrFav', 'mtFav'], ['hdrLead', 'mtLead']].forEach(([a, b], i) => {
      const n = i ? (U.leads ? U.leads().length : null) : (U.favs ? U.favs.size : null); if (n == null) return;
      [a, b].forEach(id => { const el = document.getElementById(id); if (el) { el.textContent = n; el.hidden = !n; } });
    });
  }
  const BTN = { light: 'background:#fff;color:var(--color-primary-darkest)', outline: 'border:1.5px solid rgba(255,255,255,.4)' };
  function footer({ cta = true } = {}) {
    const F = SITE.footer, C = cta && F.cta;
    return `${C ? `<div class="wrap"><section class="cta"${C.id ? ` id="${C.id}"` : ''}><div><div class="cta-kicker">${esc(C.kicker)}</div>
      <h2>${C.title}</h2><p style="margin:16px 0 22px">${esc(C.text)}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${C.buttons.map(b => `<a class="btn" style="${BTN[b.style] || ''}" href="${b.href}">${b.icon ? ico(b.icon) : ''}${esc(b.label)}</a>`).join('')}</div></div>
      <div class="stats">${C.stats.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('')}</div></section></div>` : ''}
      <footer class="site-footer"><div class="wrap footer-grid">
        <div><a class="logo" href="${SITE.homeHref || HREF.home}"><b>${esc(SITE.logoMark)}</b>${esc(SITE.name)}</a><p>${esc(F.about)}</p></div>
        ${F.columns.map(c => `<div><h5>${esc(c.title)}</h5>${c.links.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div>`).join('\n        ')}
      </div><div class="wrap footer-bottom">${F.legal.map(x => `<span>${esc(x)}</span>`).join('')}</div></footer>`;
  }

  Object.assign(U, { header, bindHeader, updateHdrCounts, footer });
})();
