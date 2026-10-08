/* Filter controls + Category → Search-fields bar. Shared by Home and Search. */
(function () {
  const { VERTICALS, VORDER, AREAS, areaName, LISTINGS } = UP;
  const { ico, esc, facetCount, valueLabel, offer, empty, t } = UPUI;

  const OICO = { cleaning: 'spark', ac: 'snow', haircut: 'user', photography: 'camera', design: 'palette', makeup: 'smile', handyman: 'wrench', nursery: 'smile', higher: 'book', doctor: 'medic', dental: 'tooth', physio: 'wave', diagnostics: 'flask', mental: 'leaf', homecare: 'home', safari: 'sun', workshop: 'tool', tour: 'compass', gym: 'bolt', credits: 'tag', school: 'grad', course: 'doc', camp: 'sun', academy: 'ball', motor: 'car', health: 'heart', property: 'home' };
  function switchVertical(S, v) { const B = UPUI.blankState(v); Object.assign(S, { v: B.v, o: B.o, f: B.f, page: 1, sort: 'rec' }); }
  function switchOffer(S, o) { const B = UPUI.blankState(S.v, o); Object.assign(S, { o: B.o, f: B.f, page: 1, sort: 'rec' }); }
  function setVal(S, d, val) { if (empty(val)) delete S.f[d.id]; else S.f[d.id] = val; if (d.type === 'seg') delete S.f.price; S.page = 1; }

  function controlHTML(d, S, opts = {}) {
    const val = S.f[d.id]; const counts = opts.counts !== false;
    if (d.type === 'seg') return `<div class="segmented">${d.options.map(o => `<button class="${val === o.v ? 'is-active' : ''}" data-ctl="${d.id}" data-act="seg" data-val="${o.v}">${esc(o.l)}</button>`).join('')}</div>`;
    if (d.type === 'multi' || d.type === 'select') {
      const multi = d.type === 'multi'; const cur = multi ? (val || []) : val;
      return `<div class="option-chips">${d.options.map(o => {
        const on = multi ? cur.includes(o.v) : cur === o.v;
        const c = counts ? facetCount(S, d.id, multi ? (on ? cur : d.all ? [...cur, o.v] : [o.v]) : o.v, opts.pool) : 1;
        return `<button class="chip ${on ? 'is-active' : ''} ${!on && c === 0 ? 'is-disabled' : ''}" data-ctl="${d.id}" data-act="${multi ? 'multi' : 'single'}" data-val="${esc(o.v)}">${esc(o.l)}${counts ? ` <span class="count">${c}</span>` : ''}</button>`;
      }).join('')}</div>`;
    }
    if (d.type === 'toggle') return `<label class="toggle"><span><b>${esc(d.label)}</b></span><input type="checkbox" data-ctl="${d.id}" data-act="toggle" ${val ? 'checked' : ''}><i></i></label>`;
    if (d.type === 'range') {
      const r = val || {}; const pre = (d.presets && d.presets(S)) || []; const u = d.unit === 'sqft' ? 'sqft' : 'AED';
      return `<div class="rng"><div class="range-inputs"><label><span>Min</span><input inputmode="numeric" data-ctl="${d.id}" data-act="min" value="${r.min != null ? r.min : ''}" placeholder="Any"></label><em>–</em>
        <label><span>Max</span><input inputmode="numeric" data-ctl="${d.id}" data-act="max" value="${r.max != null ? r.max : ''}" placeholder="Any"></label><b>${u}</b></div>
        ${pre.length ? `<div class="option-chips">${pre.map(p => `<button class="chip ${val && r.min == p[0] && r.max == p[1] ? 'is-active' : ''}" data-ctl="${d.id}" data-act="preset" data-val="${p[0] ?? ''}|${p[1] ?? ''}">${UPUI.rangeLabel({ min: p[0], max: p[1] }, d.unit)}</button>`).join('')}</div>` : ''}</div>`;
    }
    return '';
  }
  function handleControl(el, S) {
    const d = UPUI.defsOf(S).find(x => x.id === el.dataset.ctl); if (!d) return false;
    const act = el.dataset.act, v = el.dataset.val;
    if (act === 'single') setVal(S, d, S.f[d.id] === v ? null : v);
    else if (act === 'seg') setVal(S, d, d.required ? v : (S.f[d.id] === v ? null : v));
    else if (act === 'multi') { const cur = S.f[d.id] || []; setVal(S, d, cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]); }
    else if (act === 'toggle') setVal(S, d, el.checked || null);
    else if (act === 'preset') { const [a, b] = v.split('|'); const r = { min: a === '' ? null : +a, max: b === '' ? null : +b }; const c = S.f[d.id]; setVal(S, d, c && c.min === r.min && c.max === r.max ? null : r); }
    else if (act === 'min' || act === 'max') { const n = parseInt(String(el.value).replace(/[^\d]/g, ''), 10); const r = { ...(S.f[d.id] || {}) }; r[act] = isNaN(n) ? null : n; setVal(S, d, r.min == null && r.max == null ? null : r); }
    else return false;
    return true;
  }

  /* ---- search bar ---- */
  /* onFilters: when given, the bar shows a Filters button (with the number of extra filters set) that calls it */
  function SearchBar(root, S, { mode, onChange, onSubmit, onFilters }) {
    let open = null, shown = null, locQuery = '';
    const O = () => offer(S);
    function locSuggestions() {
      const q = locQuery.trim().toLowerCase();
      const base = LISTINGS.filter(l => S.v === 'all' || (l.v === S.v && l.cat === S.o));
      const cnt = id => base.filter(l => l.loc === id || (l.coverage || []).includes(id)).length;
      let a = AREAS.filter(x => !S.loc.includes(x.id) && (!q || x.n.toLowerCase().includes(q))).map(x => ({ ...x, c: cnt(x.id) })).filter(x => x.c > 0 || q);
      if (!q) a.sort((x, y) => y.c - x.c);
      return a.slice(0, 7);
    }
    function locPanel() {
      const sug = locSuggestions();
      return `<div class="popover-header">${esc((O() && O().locLabel) || t('Location'))}${S.loc.length ? `<button class="text-link" data-b="clearloc">Clear</button>` : ''}</div>
        ${S.loc.length ? `<div class="option-chips" style="margin-bottom:10px">${S.loc.map(id => `<button class="chip is-active" data-b="rmloc" data-val="${id}">${esc(areaName(id))} ${ico('x')}</button>`).join('')}</div>` : ''}
        <div class="location-list">${sug.map(a => `<button data-b="addloc" data-val="${a.id}">${ico('pin')}<span>${esc(a.n)}<small>Dubai</small></span><em>${a.c}</em></button>`).join('') || `<div class="empty-hint">${locQuery ? `Press Enter to search “${esc(locQuery)}”` : 'No areas'}</div>`}</div>`;
    }
    function segHTML(fid) {
      const Oo = O();
      if (fid === 'loc') {
        const ph = S.v === 'all' ? 'Search anything — apartments, warehouses, dentists, yachts…' : Oo.locLabel === 'Marina' ? 'Marina or harbour' : 'Area, community, building or keyword';
        return `<div class="search-field location ${open === 'loc' ? 'is-open' : ''}" data-seg="loc"><span class="field-label">${esc(S.v === 'all' ? t('Search') : (Oo.locLabel || t('Location')))}</span>
          <div class="location-input">${ico(S.v === 'all' ? 'search' : 'pin')}${S.loc.slice(0, 2).map(id => `<span class="loc-token">${esc(areaName(id))}<button data-b="rmloc" data-val="${id}">${ico('x')}</button></span>`).join('')}${S.loc.length > 2 ? `<span class="loc-token">+${S.loc.length - 2}</span>` : ''}
          <input id="locInput" autocomplete="off" placeholder="${S.loc.length ? 'Add area' : esc(ph)}" value="${esc(locQuery || (S.loc.length ? '' : S.q))}"></div>
          ${open === 'loc' ? `<div class="popover is-wide">${locPanel()}</div>` : ''}</div>`;
      }
      const d = Oo.def(fid); if (!d) return '';
      const sum = valueLabel(d, S.f[fid]);
      return `<div class="search-field ${open === fid ? 'is-open' : ''}" data-seg="${fid}"><button class="search-field-btn" data-b="open" data-val="${fid}"><span class="field-label">${esc(d.label)}</span><span class="field-value ${sum ? '' : 'is-placeholder'}">${esc(sum || (d.isDate ? 'Any date' : 'Any'))}</span>${ico('chev')}</button>
        ${open === fid ? `<div class="popover ${d.type === 'range' ? 'is-range' : ''}"><div class="popover-header">${esc(d.label)}${!empty(S.f[fid]) && !d.required ? `<button class="text-link" data-b="clearf" data-val="${fid}">Clear</button>` : ''}</div>${controlHTML(d, S)}<div class="popover-footer"><button class="btn btn-primary btn-sm" data-b="close">Done</button></div></div>` : ''}</div>`;
    }
    function render() {
      const Oo = O();
      const fields = S.v === 'all' ? ['loc'] : Oo.fields;
      const offers = S.v === 'all' ? VORDER.map(v => ({ id: v, label: VERTICALS[v].label, basis: VERTICALS[v].blurb, icon: VERTICALS[v].icon, all: 1 })) : VERTICALS[S.v].offers;
      const extra = Oo ? Oo.optional.filter(d => d.id !== 'verified').slice(0, mode === 'hero' ? 7 : 0) : [];
      const nSet = Oo ? Oo.optional.filter(d => !d.required && !empty(S.f[d.id])).length : 0;
      const filtersBtn = onFilters && Oo ? `<button class="search-filters ${nSet ? 'is-set' : ''}" data-b="filters">${ico('sliders')}<span>${t('Filters')}</span>${nSet ? `<em>${nSet}</em>` : ''}</button>` : '';
      root.innerHTML = `
        <div class="vertical-tabs ${mode} no-scrollbar">${UPUI.TABS.map(id => `<button class="${S.v === id ? 'is-active' : ''}" data-b="vert" data-val="${id}">${ico(VERTICALS[id].icon)}${esc(t(VERTICALS[id].label))}</button>`).join('')}</div>
        <div class="search-panel ${mode}">
          <div class="offer-rail-wrap"><button class="rail-arrow is-prev" data-b="oscroll" data-val="-1">${ico('chevL')}</button><div class="offer-rail">${offers.map(x => `<button class="offer ${!x.all && S.o === x.id ? 'is-active' : ''}" data-b="${x.all ? 'vert' : 'offer'}" data-val="${x.id}"><i>${ico(x.icon || OICO[x.id] || VERTICALS[S.v].icon)}</i><span><b>${esc(t(x.label))}</b><small>${esc(x.basis)}</small></span></button>`).join('')}</div><button class="rail-arrow is-next" data-b="oscroll" data-val="1">${ico('chevR')}</button></div>
          <div class="search-bar ${mode}">${fields.map(segHTML).join('')}${filtersBtn}<button class="search-submit" data-b="submit">${ico('search')}<span>${t('Search')}</span></button></div>
          ${mode === 'hero' && !Oo ? `<div class="more-filters"><span>Pick a vertical above, or search everything at once.</span></div>` : ''}${mode === 'hero' && Oo ? `<div class="more-filters"><span>${t('More filters')}:</span>${extra.map(d => { const sv = valueLabel(d, S.f[d.id]); return `<button class="chip ${sv && !d.required ? 'is-active' : ''}" data-b="${d.type === 'toggle' ? 'tgl' : 'open'}" data-val="${d.id}">${d.type === 'toggle' && sv ? ico('check') : ''}${esc(sv && d.type !== 'toggle' ? d.label + ': ' + sv : d.label)}${d.type === 'toggle' ? '' : ico('chev')}</button>`; }).join('')}<span class="spacer"></span><span class="price-basis">${ico('tag')}Priced ${esc(Oo.basis)}</span></div>
            ${open && extra.some(d => d.id === open) ? `<div class="more-filters-popover"><div class="popover-header">${esc(Oo.def(open).label)}${!empty(S.f[open]) && !Oo.def(open).required ? `<button class="text-link" data-b="clearf" data-val="${open}">Clear</button>` : ''}</div>${controlHTML(Oo.def(open), S)}<div class="popover-footer"><button class="btn btn-primary btn-sm" data-b="close">Done</button></div></div>` : ''}` : ''}
        </div>`;
      // a popover that was already open is only being redrawn: don't replay its open animation
      if (open && open === shown) root.querySelectorAll('.popover, .more-filters-popover').forEach(p => p.classList.add('is-shown'));
      shown = open;
      const inp = root.querySelector('#locInput'); if (!inp) return;
      inp.addEventListener('focus', () => { if (open !== 'loc') { open = 'loc'; locQuery = S.loc.length ? '' : S.q; render(); const i = root.querySelector('#locInput'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
      inp.addEventListener('input', e => { locQuery = e.target.value; const p = root.querySelector('.search-field.location .popover'); if (p) p.innerHTML = locPanel(); });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); const q = locQuery.trim(); const ex = locSuggestions().find(a => a.n.toLowerCase() === q.toLowerCase()); if (ex) addLoc(ex.id); else { setQuery(q); locQuery = ''; open = null; S.page = 1; commit(true); render(); } }
        if (e.key === 'Backspace' && !inp.value && S.loc.length) { S.loc.pop(); commit(); render(); root.querySelector('#locInput').focus(); }
        if (e.key === 'Escape') { open = null; render(); }
      });
    }
    // a typed category name ("dentists", "AC", "yachts") opens that category; anything else is a keyword search
    function setQuery(q) {
      const hit = q && UPUI.offerForQuery(q, S.v);
      if (!hit) { S.q = q; return; }
      if (hit.v !== S.v) switchVertical(S, hit.v);
      if (hit.o !== S.o) switchOffer(S, hit.o);
      S.q = '';
    }
    function addLoc(id) { if (!S.loc.includes(id)) S.loc.push(id); locQuery = ''; S.q = ''; S.page = 1; commit(); open = 'loc'; render(); root.querySelector('#locInput').focus(); }
    function commit(submit) { if (onChange) onChange(); if (submit && onSubmit) onSubmit(); }

    root.addEventListener('click', e => {
      const ctl = e.target.closest('[data-ctl]');
      if (ctl && ctl.tagName !== 'INPUT') { e.preventDefault(); if (handleControl(ctl, S)) { commit(); render(); } return; }
      const b = e.target.closest('[data-b]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const a = b.dataset.b, v = b.dataset.val;
      if (a === 'vert') { switchVertical(S, v); open = null; locQuery = ''; commit(); render(); }
      else if (a === 'offer') { switchOffer(S, v); open = null; commit(); render(); }
      else if (a === 'oscroll') { const o = root.querySelector('.offer-rail'); o.scrollLeft += +v * o.clientWidth * .7; }
      else if (a === 'open') { open = open === v ? null : v; render(); }
      else if (a === 'close') { open = null; render(); }
      else if (a === 'filters') { open = null; render(); onFilters(); }
      else if (a === 'tgl') { const d = O().def(v); setVal(S, d, S.f[v] ? null : true); commit(); render(); }
      else if (a === 'addloc') addLoc(v);
      else if (a === 'rmloc') { S.loc = S.loc.filter(x => x !== v); S.page = 1; commit(); render(); }
      else if (a === 'clearloc') { S.loc = []; commit(); render(); }
      else if (a === 'clearf') { delete S.f[v]; commit(); render(); }
      else if (a === 'submit') { if (locQuery.trim()) { const ex = locSuggestions().find(x => x.n.toLowerCase() === locQuery.trim().toLowerCase()); if (ex) S.loc.push(ex.id); else setQuery(locQuery.trim()); locQuery = ''; } open = null; render(); commit(true); }
    });
    root.addEventListener('change', e => { const c = e.target.closest('[data-ctl]'); if (c && handleControl(c, S)) { commit(); render(); } });
    document.addEventListener('mousedown', e => { if (open && !root.contains(e.target)) { open = null; locQuery = ''; render(); } });
    root.addEventListener('wheel', e => { const o = e.target.closest('.offer-rail'); if (o && o.scrollWidth > o.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); o.scrollLeft += e.deltaY; } }, { passive: false });
    render();
    return { render };
  }

  window.UPF = { OICO, controlHTML, handleControl, SearchBar, switchVertical, switchOffer, setVal };
})();
