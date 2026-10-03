/* Search engine: normalises category definitions, filters and sorts listings, and reads/writes search state in the URL. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { moneyK, CUR, prefs } = U;
  const { VERTICALS, VORDER, LISTINGS, areaById, areaName, offerOf } = UP;

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
  function results(S, pool = LISTINGS) {
    const r = pool.filter(l => matches(l, S));
    const so = {
      rec: (a, b) => (b.featured - a.featured) || (b.rating * Math.log(b.reviews + 2)) - (a.rating * Math.log(a.reviews + 2)),
      plh: (a, b) => priceOf(a, S) - priceOf(b, S), phl: (a, b) => priceOf(b, S) - priceOf(a, S),
      new: (a, b) => a.posted - b.posted, fast: (a, b) => a.provider.reply - b.provider.reply,
      szl: (a, b) => (b.a.sqft || b.a.capacity || 0) - (a.a.sqft || a.a.capacity || 0)
    };
    return r.sort(so[S.sort] || so.rec);
  }
  const facetCount = (S, id, value, pool = LISTINGS) => pool.filter(l => matches(l, { ...S, f: { ...S.f, [id]: value } })).length;
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

  Object.assign(U, { TABS, offer, defsOf, empty, priceOf, matches, results, facetCount, SORTS, blankState, parseState, toQuery, rangeLabel, valueLabel, factValue });
})();
