/* Shared pieces for the agent (pages/provider.html) and agency (pages/agency.html) pages:
   a compact one-row filter (dropdown pills, like Bayut's profile pages) over the profile's own listings. */
(function () {
  const { ico, esc, card, valueLabel, empty, areaName = UP.areaName } = UPUI;
  const PRIVATE = /^Private (owner|landlord|host)$/;
  const PAGE = 12; // 3 rows of 4
  const SORTS = [['rec', 'Recommended'], ['new', 'Newest'], ['plh', 'Price: low to high'], ['phl', 'Price: high to low']];

  const agencyHref = org => PATHS.href.agency + '?a=' + encodeURIComponent(org);
  const isAgency = org => !!org && !PRIVATE.test(org);
  const catsOf = pool => [...new Set(pool.map(l => l.cat))];

  /* one sub-category → its fields show straight away; several → start on "All types" */
  function newState(pool) {
    const cats = catsOf(pool), B = UPUI.blankState(pool[0].v, cats.length === 1 ? cats[0] : undefined);
    return cats.length === 1 ? { ...B, limit: PAGE } : { ...B, o: null, f: {}, limit: PAGE };
  }
  const offerOfS = S => S.o ? UP.offerOf(S.v, S.o) : null;
  const userSet = (S, k) => { const O = offerOfS(S), d = O && O.def(k); return !empty(S.f[k]) && !(d && (d.required || (O.defaults && O.defaults[k] === S.f[k]))); };
  const filtered = (S, pool) => (S.o && catsOf(pool).length > 1) || S.loc.length || !!S.q || Object.keys(S.f).some(k => userSet(S, k));

  let CUR = null, open = null, shown = null; // CUR = { pool, S }

  const DATE_LIKE = ['date', 'time', 'checkin', 'checkout'];
  /* the sub-category's filter boxes, Bayut-style: type · second field (beds & baths for homes) · price */
  function fieldsOf(O) {
    const ids = O.fields.filter(f => f !== 'loc' && !DATE_LIKE.includes(f) && O.def(f));
    if (O.def('price') && !ids.includes('price')) ids.push('price');
    const boxes = ids.filter(f => f !== 'price').slice(0, 2).map(f => [f]);
    const beds = boxes.find(x => x[0] === 'beds'); if (beds && O.def('baths')) beds.push('baths');
    if (ids.includes('price')) boxes.push(['price']);
    return boxes;
  }
  const boxLabel = (ids, defs, i) => ids.includes('baths') ? 'Beds & Baths' : ids[0] === 'price' ? 'Price (AED)' : i === 0 && /type$/i.test(defs[0].label) ? 'Any type' : defs[0].label;

  function box(id, text, set, body, cls = '') {
    return `<div class="filter-pill pf-box ${cls}"><button class="pf-field ${set ? 'is-set' : ''}" data-pfp="${id}" aria-expanded="${open === id}"><span>${esc(text)}</span>${ico('chev')}</button>
      ${open === id ? `<div class="popover pf-pop">${body}<div class="popover-footer"><button class="btn btn-primary btn-sm" data-pfp-close>Done</button></div></div>` : ''}</div>`;
  }

  function barHTML(pool, S) {
    const cats = catsOf(pool), O = offerOfS(S), count = f => pool.filter(f).length;
    const out = [];
    if (cats.length > 1) out.push(box('type', O ? O.label : 'All', !!O,
      `<div class="pf-list">${[['', 'All', pool.length], ...cats.map(c => [c, UP.offerOf(S.v, c).label, count(l => l.cat === c)])].map(([k, t, n]) => `<button class="${(S.o || '') === k ? 'is-active' : ''}" data-pfo="${k}">${esc(t)}<em>${n}</em></button>`).join('')}</div>`, 'is-cat'));
    out.push(`<label class="pf-loc"><input data-pf-q placeholder="Enter location" value="${esc(S.q)}" aria-label="Location, building or keyword">${ico('pin')}</label>`);
    if (O) fieldsOf(O).forEach((ids, i) => {
      const defs = ids.map(id => O.def(id)), set = ids.some(id => userSet(S, id));
      const sum = ids.map((id, k) => userSet(S, id) ? valueLabel(defs[k], S.f[id]) : '').filter(Boolean).join(' · ');
      out.push(box(ids.join('+'), sum || boxLabel(ids, defs, i), set, defs.map(d => `<div class="popover-header">${esc(d.label)}</div>${UPF.controlHTML(d, S, { pool })}`).join('<div class="pf-gap"></div>')));
    });
    return `<div class="pf-row">${out.join('')}</div>`;
  }

  /* count (only when filtered — the tab already shows the total) · grid / list · sort; sits at the end of the tabs row */
  function toolsHTML(pool, S) {
    const n = UPUI.results(S, pool).length;
    return `${filtered(S, pool) ? `<span class="pf-count"><b>${n}</b> of ${pool.length} · <button class="text-link" data-pf-reset>Clear</button></span>` : ''}<span class="view-toggle" role="group" aria-label="View">${[['grid', 'grid4', 'Grid view'], ['list', 'list', 'List view']].map(([k, i, t]) => `<button class="${(S.view === 'list' ? 'list' : 'grid') === k ? 'is-active' : ''}" data-pf-view="${k}" aria-label="${t}" title="${t}">${ico(i)}</button>`).join('')}</span><label class="pf-select"><select data-pf-sort aria-label="Sort">${SORTS.map(([k, t]) => `<option value="${k}" ${S.sort === k ? 'selected' : ''}>${t}</option>`).join('')}</select>${ico('chev')}</label>`;
  }
  function resultsHTML(pool, S) {
    const res = UPUI.results(S, pool);
    const shown = res.slice(0, S.limit), SS = S.o ? S : null;
    const items = S.view === 'list'
      ? `<div class="row-list">${shown.map(l => { const pt = UPUI.priceText(l, SS); return `<a class="row-item" href="${PATHS.href.listing}?id=${l.id}">${UPUI.photo(l, 0)}<span><b>${esc(l.title)}</b><small>${ico('pin')} ${esc(UPUI.locText(l))}</small><small class="row-spec">${UPUI.specOf(l).map(esc).join(' · ')}</small></span><span class="row-price">${pt.n}<span>${esc(pt.u)}</span></span></a>`; }).join('')}</div>`
      : `<div class="compact-grid">${shown.map(l => card(l, SS)).join('')}</div>`;
    return (res.length ? `${items}
        ${res.length > S.limit ? `<div class="pf-more"><span>Showing ${S.limit} of ${res.length}</span><button class="btn btn-outline" data-pf-more>Show ${Math.min(PAGE, res.length - S.limit)} more</button></div>` : ''}`
      : `<div class="pf-empty">${ico('search')}<b>No listings match these filters</b><button class="btn btn-outline btn-sm" data-pf-reset>Clear filters</button></div>`);
  }

  /* placeholders; mount() fills them after the page is painted. listingsTools() goes at the end of the page's tabs row. */
  const listingsPanel = () => `<div id="pfBar"></div><div id="pfRes"></div>`;
  const listingsTools = () => `<span class="tabs-tools" id="pfTools"></span>`;
  const paintTools = () => { const el = document.getElementById('pfTools'); if (el) el.innerHTML = toolsHTML(CUR.pool, CUR.S); };
  function render(results = true) {
    if (!CUR) return;
    const bar = document.getElementById('pfBar'), res = document.getElementById('pfRes');
    if (bar) {
      bar.innerHTML = barHTML(CUR.pool, CUR.S);
      if (open && open === shown) bar.querySelectorAll('.popover').forEach(p => p.classList.add('is-shown')); // redraw, not a new open
      shown = open;
    }
    if (results && res) res.innerHTML = resultsHTML(CUR.pool, CUR.S);
    if (results) paintTools();
  }
  function mount(pool, S) { CUR = { pool, S }; open = null; render(); }
  const changed = () => { CUR.S.limit = PAGE; render(); };

  document.addEventListener('click', e => {
    if (!CUR) return;
    const t = e.target;
    if (open && !t.closest('.filter-pill')) { open = null; render(false); }
    const p = t.closest('[data-pfp]'); if (p) { open = open === p.dataset.pfp ? null : p.dataset.pfp; render(false); return; }
    if (t.closest('[data-pfp-close]')) { open = null; render(false); return; }
    const o = t.closest('[data-pfo]'); if (o) { const B = o.dataset.pfo ? UPUI.blankState(CUR.S.v, o.dataset.pfo) : null; Object.assign(CUR.S, { o: B ? B.o : null, f: B ? B.f : {} }); open = null; changed(); return; }
    const c = t.closest('[data-ctl]'); if (c && c.tagName !== 'INPUT' && t.closest('#pfBar')) { e.preventDefault(); if (UPF.handleControl(c, CUR.S)) changed(); return; }
    const vw = t.closest('[data-pf-view]'); if (vw) { CUR.S.view = vw.dataset.pfView; render(); return; }
    if (t.closest('[data-pf-more]')) { CUR.S.limit += PAGE; render(); return; }
    if (t.closest('[data-pf-reset]')) { const sort = CUR.S.sort; Object.keys(CUR.S).forEach(k => delete CUR.S[k]); Object.assign(CUR.S, newState(CUR.pool), { sort }); open = null; render(); }
  });
  document.addEventListener('change', e => {
    if (!CUR) return;
    const s = e.target.closest('[data-pf-sort]'); if (s) { CUR.S.sort = s.value; render(); return; }
    const c = e.target.closest('#pfBar [data-ctl]'); if (c && UPF.handleControl(c, CUR.S)) changed();
  });
  // location box filters as you type; only the results re-render so the input keeps focus
  document.addEventListener('input', e => { const q = e.target.closest('[data-pf-q]'); if (!q || !CUR) return; CUR.S.q = q.value; CUR.S.limit = PAGE; const el = document.getElementById('pfRes'); if (el) el.innerHTML = resultsHTML(CUR.pool, CUR.S); paintTools(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { open = null; render(false); } });

  /* compact About card for the profile sidebar: bio clamped to three lines (Read more) and short label · value facts.
     facts: [[label, valueHTML]] — values are HTML so a fact can carry a link. */
  const aboutBox = ({ title, text, facts }) => `<div class="about-box"><h4>${esc(title)}</h4>
    <p class="about-text is-clamped">${esc(text)}</p><button class="text-link about-more" type="button" data-about-more hidden>Read more</button>
    ${facts.map(([k, v]) => `<div class="about-fact"><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>`;
  function fitAbout() { document.querySelectorAll('.about-text.is-clamped').forEach(p => { p.nextElementSibling.hidden = p.scrollHeight <= p.clientHeight + 1; }); }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-about-more]'); if (!b) return;
    const p = b.previousElementSibling, open = p.classList.toggle('is-clamped');
    b.textContent = open ? 'Read more' : 'Show less';
  });

  /* the sidebar sticks below the header; when it is taller than the window it scrolls with the page until its
     bottom is in view, then sticks there — nothing is ever cut off */
  function stickySidebar() {
    const sb = document.querySelector('.provider-sidebar'); if (!sb) return;
    const set = () => sb.style.setProperty('--sb-h', sb.offsetHeight + 'px');
    set();
    if (!sb._ro) { sb._ro = new ResizeObserver(set); sb._ro.observe(sb); }
  }
  addEventListener('resize', fitAbout);

  window.PROFILE = { agencyHref, isAgency, newState, listingsPanel, listingsTools, mount, aboutBox, fitAbout, stickySidebar };
})();
