/* UpNow mobile app — single-page router inside a phone frame. Reuses data, filter engine, lead capture and DM detail modules. */
(function () {
  const { VERTICALS, VORDER, LISTINGS, AREAS, areaName, offerOf } = UP;
  const { ico, esc, money, t, initials } = UPUI;
  const scr = document.getElementById('scr');
  const OICO = UPF.OICO;
  const iconOf = (v, o) => o.icon || OICO[o.id] || VERTICALS[v].icon;
  const KEY = 'upnow.mobile';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  const S = UPUI.blankState(saved.v || 'spaces', saved.o || 'residential');
  if (saved.loc) S.loc = saved.loc.filter(x => UP.areaById[x]);
  let stack = saved.stack && saved.stack.length ? saved.stack : [{ s: 'home' }];
  let tab = saved.tab || 'home', view = 'list', mapSel = null, sheet = null, locQ = '', ptab = 'list';
  const cur = () => stack[stack.length - 1];
  const persist = () => localStorage.setItem(KEY, JSON.stringify({ v: S.v, o: S.o, loc: S.loc, stack, tab }));
  function go(s, p = {}) { stack.push({ s, ...p }); sheet = null; render(true); }
  function back() { if (stack.length > 1) stack.pop(); sheet = null; render(true); }
  function setTab(tb) { tab = tb; stack = [{ s: tb }]; sheet = null; render(true); }

  const sbar = ov => `<div class="sb ${ov ? 'ov' : ''}"><span>9:41</span><span class="si"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor"/><rect x="2" y="2" width="17" height="8" rx="1.5"/><rect x="23.5" y="4" width="2" height="4" rx="1"/></svg></span></div>`;
  const tbar = () => `<nav class="tbar">${[['home', 'home', 'Explore'], ['search', 'search', 'Search'], ['saved', 'heart', 'Saved', UPUI.favs.size], ['inbox', 'msg', 'Enquiries', UPUI.leads().length], ['account', 'user', 'Account']].map(([k, i, l, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${ico(i)}${l}${n ? `<em>${n}</em>` : ''}</button>`).join('')}</nav>`;
  const top = (title, right = '') => `<div class="mtop"><button class="cb" data-back>${ico('chevL')}</button><h1>${esc(title)}</h1>${right || '<span style="width:40px"></span>'}</div>`;
  const O = () => S.v === 'all' ? null : offerOf(S.v, S.o);

  /* ---------- cards ---------- */
  function hcard(l) {
    const pt = UPUI.priceText(l, S);
    return `<button class="hc" data-l="${l.id}"><div class="ph">${UPUI.photo(l)}${UPUI.badges(l)}<span class="fav ${UPUI.favs.has(l.id) ? 'on' : ''}" data-fav="${l.id}">${ico('heart')}</span></div>
      <div class="bd"><div class="pr">${pt.n}<span>${pt.u}</span></div><div class="t">${esc(l.title)}</div><div class="l">${esc(UPUI.locText(l))}</div><div class="s">${UPUI.specOf(l).map(esc).join(' · ')}</div></div></button>`;
  }
  function mcard(l) {
    const pt = UPUI.priceText(l, S), O2 = offerOf(l.v, l.cat), meta = O2.meta(l.a, l, { def: d => O2.def(d) }).slice(0, 3), P = DM.prov(l.provider.name);
    const imgs = l.img.length ? l.img.slice(0, 4) : [null];
    return `<div class="mc" data-l="${l.id}"><div class="gal"><div class="tr">${imgs.map((x, i) => x ? `<img src="${x}" alt="" loading="lazy">` : UPUI.photo(l)).join('')}</div>${UPUI.badges(l)}<button class="fav ${UPUI.favs.has(l.id) ? 'on' : ''}" data-fav="${l.id}">${ico('heart')}</button>${imgs.length > 1 ? `<div class="dots">${imgs.map(() => '<i></i>').join('')}</div>` : ''}</div>
      <div class="bd"><div class="pr">${pt.n}<span> ${pt.u}</span></div><div class="t">${esc(l.title)}</div><div class="l">${ico('pin')}${esc(UPUI.locText(l))}</div>
      <div class="sp">${meta.map(([i, x]) => `<span>${ico(i)}${esc(x)}</span>`).join('')}</div></div>
      <div class="ag"><span class="av" style="--hue:${P.hue}">${initials(P.name)}</span><span><b>${esc(P.name)}</b> · replies ~${P.reply} min</span><button class="c" data-call="${l.id}">${ico('phone')}</button><button class="w" data-wa="${l.id}">${ico('wa')}</button></div></div>`;
  }

  /* ---------- screens ---------- */
  function home() {
    const Oo = O(), base = S.v === 'all' ? null : UPUI.blankState(S.v, S.o);
    const offers = S.v === 'all' ? VORDER.map(v => ({ id: v, label: VERTICALS[v].label, icon: VERTICALS[v].icon, vert: 1 })) : VERTICALS[S.v].offers.map(o => ({ ...o, icon: iconOf(S.v, o) }));
    const feat = (Oo ? UPUI.results(base) : LISTINGS.slice().sort((a, b) => b.rating - a.rating)).slice(0, 8);
    const fresh = (Oo ? UPUI.results({ ...base, sort: 'new' }) : []).slice(0, 8);
    const typeDef = Oo && Oo.defs.find(d => (d.type === 'multi' || d.type === 'select') && !d.isDate && d.options && d.options.length <= 8 && !['price', 'term', 'amenities', 'time'].includes(d.id));
    const rec = UPUI.recent().slice(0, 6);
    const areaImg = ['img/hero.jpg', 'img/apt2.jpg', 'img/villa1.jpg', 'img/office1.jpg', 'img/apt3.jpg', 'img/hotel1.jpg'];
    const pool = Oo ? LISTINGS.filter(l => l.cat === S.o) : LISTINGS;
    const ar = AREAS.map(a => ({ ...a, c: pool.filter(l => l.loc === a.id).length })).filter(a => a.c).sort((a, b) => b.c - a.c).slice(0, 4);
    return `${sbar()}<div class="view" data-screen-label="M01 Home">
      <div class="mh-hd"><div class="loc"><small>Explore in</small><b>${ico('pin')}Dubai, UAE ${ico('chev')}</b></div><button class="cb">${ico('bell')}</button></div>
      <div class="mh-ttl">${esc(Oo ? (Oo.hero ? Oo.hero.join(' ') : Oo.h1) : 'Everything Dubai, one search.')}</div>
      <button class="mpill" data-go="search">${ico('search')}<span><b>${esc(Oo ? Oo.h1 : 'Search UpNow')}</b><small>${esc(S.loc.length ? S.loc.map(areaName).join(', ') : Oo ? 'Any area · ' + Oo.fields.filter(f => f !== 'loc').map(f => (Oo.def(f) || {}).label).filter(Boolean).join(' · ') : 'Homes, cleaners, safaris, schools…')}</small></span><i>${ico('sliders')}</i></button>
      <div class="vchips">${UPUI.TABS.map(v => `<button class="${S.v === v ? 'on' : ''}" data-v="${v}">${ico(VERTICALS[v].icon)}${esc(VERTICALS[v].label)}</button>`).join('')}</div>
      <div class="ctiles">${offers.map(o => `<button data-${o.vert ? 'v' : 'o'}="${o.id}" ${!o.vert && o.id === S.o ? 'style="color:var(--g8)"' : ''}><i ${!o.vert && o.id === S.o ? 'style="background:var(--g7);color:#fff"' : ''}>${ico(o.icon)}</i>${esc(o.label)}</button>`).join('')}</div>
      ${typeDef ? `<div class="msec"><div class="msec-h"><div><h2>Browse ${esc(Oo.label.toLowerCase())}</h2><p>By ${esc(typeDef.label.toLowerCase())}</p></div></div><div class="hscroll" style="gap:6px">${typeDef.options.map(op => { const f = { [typeDef.id]: typeDef.type === 'multi' ? [op.v] : op.v }; const n = UPUI.results({ ...base, f: { ...base.f, ...f } }).length; return n ? `<button class="chip" data-type="${typeDef.id}" data-tv="${esc(op.v)}">${esc(typeDef.id === 'beds' && op.v !== '0' ? op.l + ' bed' : op.l)} <span class="c">${n}</span></button>` : ''; }).join('')}</div></div>` : ''}
      ${rec.length ? `<div class="msec"><div class="msec-h"><h2>Recently viewed</h2></div><div class="hscroll">${rec.map(hcard).join('')}</div></div>` : ''}
      <div class="msec"><div class="msec-h"><div><h2>${Oo ? 'Top ' + esc(Oo.label.toLowerCase()) : 'Top rated'}</h2><p>Verified providers · ${feat.length}+ results</p></div><button data-go="results">See all</button></div><div class="hscroll">${feat.map(hcard).join('')}</div></div>
      ${fresh.length ? `<div class="msec"><div class="msec-h"><div><h2>New this week</h2><p>Listed in the last 7 days</p></div><button data-go="results" data-sort="new">See all</button></div><div class="hscroll">${fresh.map(hcard).join('')}</div></div>` : ''}
      ${ar.length && !(Oo && Oo.locAll) ? `<div class="msec"><div class="msec-h"><h2>Popular areas</h2></div><div class="areas2">${ar.map((a, i) => `<button data-area="${a.id}"><img src="${areaImg[i % areaImg.length]}" alt=""><span><b>${esc(a.n)}</b><small>${a.c} listings</small></span></button>`).join('')}</div></div>` : ''}
      <div class="promo"><div style="flex:1"><b>List on UpNow</b><small>Get leads by call & WhatsApp — free.</small></div><a class="btn" href="provider-workspace/index.html">Start</a></div>
      </div>${tbar()}`;
  }

  function search() {
    const Oo = O();
    const sug = AREAS.filter(a => !S.loc.includes(a.id) && (!locQ || a.n.toLowerCase().includes(locQ.toLowerCase()))).map(a => ({ ...a, c: LISTINGS.filter(l => (S.v === 'all' || (l.v === S.v && l.cat === S.o)) && (l.loc === a.id || (l.coverage || []).includes(a.id))).length })).filter(a => a.c || locQ).sort((a, b) => b.c - a.c).slice(0, locQ ? 8 : 5);
    const fields = Oo ? Oo.fields.filter(f => f !== 'loc').map(f => Oo.def(f)).filter(Boolean) : [];
    const n = UPUI.results(S).length;
    return `${sbar()}<div class="view" data-screen-label="M02 Search">
      ${top(stack.length > 1 ? 'Search' : 'Search', `<button class="cb" data-reset>${ico('x')}</button>`)}
      <div class="vchips" style="padding-top:2px">${UPUI.TABS.map(v => `<button class="${S.v === v ? 'on' : ''}" data-v="${v}">${ico(VERTICALS[v].icon)}${esc(VERTICALS[v].label)}</button>`).join('')}</div>
      ${S.v !== 'all' ? `<div class="vchips" style="padding-top:6px">${VERTICALS[S.v].offers.map(o => `<button class="${S.o === o.id ? 'on' : ''}" style="${S.o === o.id ? 'background:var(--g1);color:var(--g8);border-color:var(--g5)' : ''}" data-o="${o.id}">${ico(iconOf(S.v, o))}${esc(o.label)}</button>`).join('')}</div>` : ''}
      ${Oo && Oo.locAll ? '' : `<div class="slab">${esc((Oo && Oo.locLabel) || 'Location')}</div>
      <label class="sin">${ico('pin')}${S.loc.map(id => `<span class="tok">${esc(areaName(id))}<button data-rmloc="${id}">${ico('x')}</button></span>`).join('')}<input id="mLoc" placeholder="${S.loc.length ? 'Add area' : 'Area, community or building'}" value="${esc(locQ)}" autocomplete="off"></label>
      <div class="slist" id="mSug">${sug.map(a => `<button data-addloc="${a.id}"><i>${ico('pin')}</i><span><b>${esc(a.n)}</b><small>Dubai</small></span><em>${a.c}</em></button>`).join('')}</div>`}
      ${fields.map(d => `<div class="slab">${esc(d.label)}</div><div class="mfld">${UPF.controlHTML(d, S, { counts: d.type !== 'range' })}</div>`).join('')}
      <div style="height:20px"></div>
      <div class="fbar"><button class="btn btn-o" data-reset style="flex:none;padding:0 18px">Clear</button><button class="btn btn-g" style="flex:1" data-go="results">${ico('search')}Show ${n} results</button></div>
      </div>${stack.length > 1 ? '' : tbar()}`;
  }

  function results() {
    const Oo = O(), R = UPUI.results(S);
    const active = Oo ? Oo.defs.filter(d => !UPUI.empty(S.f[d.id]) && !d.required).length + (S.loc.length ? 1 : 0) : 0;
    const pills = Oo ? Oo.defs.filter(d => d.type !== 'toggle' || d.id === 'verified').slice(0, 6) : [];
    const sub = [S.loc.length ? S.loc.map(areaName).join(', ') : 'All Dubai', ...(Oo ? Oo.fields.filter(f => f !== 'loc').map(f => UPUI.valueLabel(Oo.def(f), S.f[f])).filter(Boolean) : [])].join(' · ');
    const list = `<div class="rbar"><span><b>${R.length}</b> ${esc(Oo ? Oo.h1.toLowerCase() : 'results')}</span><button data-sheet="sort">${ico('sliders')}${esc(UPUI.SORTS.find(s => s[0] === S.sort)[1])}</button></div>${R.slice(0, 24).map(mcard).join('') || `<div class="mempty">${ico('search')}<b>No matches</b>Try removing a filter.</div>`}<div style="height:70px"></div>`;
    const sel = R.find(l => l.id === mapSel) || R[0];
    const map = `<div class="mmap"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${[12, 30, 48, 66, 84].map(x => `<line x1="${x}" y1="0" x2="${x - 8}" y2="100" stroke="#fff" stroke-width=".6"/>`).join('')}${[22, 44, 66].map(y => `<line x1="0" y1="${y}" x2="100" y2="${y - 6}" stroke="#fff" stroke-width=".9"/>`).join('')}<path d="M0 0 L40 0 C30 12,20 22,0 30Z" fill="#cfe3ea"/></svg>
      ${R.slice(0, 18).map((l, i) => { const a = UP.areaById[l.loc] || { x: 50, y: 50 }; return `<button class="pin ${sel && sel.id === l.id ? 'on' : ''}" data-pin="${l.id}" style="left:${Math.min(90, Math.max(10, a.x + (i % 3 - 1) * 4))}%;top:${Math.min(80, Math.max(16, a.y * .8 + 10 + (i % 2) * 3))}%">${UP.K(UPUI.priceOf(l, S))}</button>`; }).join('')}
      ${sel ? `<div class="rail"><div class="hscroll">${[sel, ...R.filter(x => x.id !== sel.id).slice(0, 4)].map(hcard).join('')}</div></div>` : ''}</div>`;
    return `${sbar()}<div class="rhead"><div class="rq"><button class="cb" data-back>${ico('chevL')}</button><button class="q" data-go="search">${ico('search')}<span><b>${esc(Oo ? Oo.h1 : 'All results')}</b><small>${esc(sub)}</small></span></button><button class="cb" onclick="UPUI.toast('Search saved — we’ll alert you on WhatsApp')">${ico('bell')}</button></div>
      <div class="fpills"><button class="ff" data-sheet="filters">${ico('sliders')}Filters${active ? `<em>${active}</em>` : ''}</button>${pills.map(d => { const v = UPUI.valueLabel(d, S.f[d.id]); return `<button class="${v && !d.required ? 'on' : ''}" data-sheet="f:${d.id}">${esc(v && d.type !== 'toggle' ? v : d.label)}${d.type === 'toggle' ? '' : ico('chev')}</button>`; }).join('')}</div></div>
      <div class="view" data-screen-label="M03 Results" style="${view === 'map' ? 'overflow:hidden' : ''}">${view === 'map' ? map : list}</div>
      <button class="mapfab" data-view>${ico(view === 'map' ? 'grid4' : 'map')}${view === 'map' ? 'List' : 'Map'}</button>${tbar()}`;
  }

  let DMB = null;
  function listing() {
    const l = UPUI.byId(cur().id) || LISTINGS[0], O2 = offerOf(l.v, l.cat), pt = UPUI.priceText(l);
    UPUI.pushRecent(l.id);
    DMB = DM.build(l);
    const meta = O2.meta(l.a, l, { def: d => O2.def(d) });
    const imgs = l.img.length ? l.img : [null];
    const about = `${l.title} in ${UPUI.locText(l)}${O2.locAll ? '' : ', Dubai'}. Offered by ${l.provider.name} (${l.provider.org}). Priced ${O2.basis.toLowerCase()}. Ref ${l.ref}${l.permit ? ' · ' + O2.permit + ' ' + l.permit : ''}.`;
    const lease = !!O2.lease;
    return `${sbar(true)}<div class="view" data-screen-label="M04 Listing">
      <div class="dg"><div class="tr" id="dgTr">${imgs.map(x => x ? `<img src="${x}" alt="">` : UPUI.photo(l)).join('')}</div>
        <div class="tl"><button class="cb gl" data-back>${ico('chevL')}</button><span class="sp"></span><button class="cb gl" onclick="UPUI.toast('Link copied')">${ico('share')}</button><button class="cb gl ${UPUI.favs.has(l.id) ? 'on' : ''}" data-fav="${l.id}">${ico('heart')}</button></div>
        <div class="vb">${l.a.verified ? `<span>${ico('shield')}${esc(O2.permit || 'Verified')}</span>` : ''}${l.a.tour ? `<span>${ico('video')}Tour</span>` : ''}</div><span class="cnt" id="dgN">1 / ${imgs.length}</span></div>
      <div class="dsh"><div class="pr">${pt.n}<span> ${pt.u}</span></div><h1>${esc(l.title)}</h1><div class="lo">${ico('pin')}${esc(UPUI.locText(l))} · <span class="stars">${ico('star')}${l.rating}</span> (${l.reviews})</div>
        <div class="kr">${meta.map(([i, x]) => `<div>${ico(i)}${esc(x)}</div>`).join('')}</div>
        <div class="msecd" style="border:0;margin-top:6px;padding-top:16px"><p class="about3">${esc(about)}</p></div>
        ${DMB.secs.map(([h, b]) => `<div class="msecd"><h2>${esc(h)}</h2>${b}</div>`).join('')}
        <div class="msecd"><h2>${lease ? 'Listed by' : 'Your provider'}</h2>${DM.agentCard(l)}</div>
        <div class="msecd"><div class="dm-note" style="margin:0">${ico('shield')}<span><b>Deal safely.</b> ${lease ? 'Never pay a deposit before viewing and checking the permit on Dubai REST.' : 'Confirm details before paying any deposit.'} UpNow never takes payments.</span></div></div>
        <div style="height:24px"></div></div></div>
      <div class="ctab"><div class="p"><b>${pt.n}</b><small>${esc(pt.u.replace('/', 'per '))}</small></div><button class="ib c" data-call="${l.id}">${ico('phone')}</button><button class="ib w" data-wa="${l.id}">${ico('wa')}</button><button class="go" data-sheet="book">${esc(lease ? 'Book viewing' : O2.action.replace('Request a ', '').replace('Check ', 'Check ').replace(/^./, m => m.toUpperCase()))}</button></div>`;
  }

  function provider() {
    const P = DM.prov(cur().p), L0 = P.L[0], first = P.name.split(' ')[0], SP = P.v === 'spaces';
    const sup = P.rating >= 4.5 && P.reply <= 15;
    const body = ptab === 'list' ? P.L.slice(0, 12).map(mcard).join('') : ptab === 'rev' ? `<div class="dm-box"><div style="display:flex;gap:14px;align-items:center"><b style="font-size:40px">${P.rating.toFixed(1)}</b><span><span style="color:#f2a71b">★★★★★</span><br><small style="color:var(--ink3)">${P.reviews.toLocaleString()} verified reviews</small></span></div></div>` + [['Nadia K.', `${first} sent a video walkthrough within 10 minutes and arranged the viewing the same evening.`], ['James P.', 'Honest about service charges and didn’t push us towards the most expensive option.'], ['Omar H.', 'Quick on WhatsApp, always picks up.']].map(([n, x]) => `<div style="padding:14px 0;border-bottom:1px solid var(--line)"><b style="font-size:13.5px">${n}</b> <span style="color:#f2a71b;font-size:12px">★★★★★</span><p style="margin:4px 0 0;font-size:13px;color:var(--ink2)">${x}</p></div>`).join('')
      : H2([['Company', P.person ? P.org : offerOf(L0.v, L0.cat).org[0]], P.brn && ['BRN', P.brn], ['Languages', P.langs.join(', ')], ['On UpNow since', P.since], ['Areas', [...new Set(P.L.map(l => areaName(l.loc)))].slice(0, 4).join(', ')], ['Specialises in', [...new Set(P.L.map(l => offerOf(l.v, l.cat).label))].join(', ')]]);
    return `${sbar(true)}<div class="view" data-screen-label="M05 Provider">
      <div class="pvm-cv"><div class="dg" style="height:0"><div class="tl"><button class="cb gl" data-back>${ico('chevL')}</button><span class="sp"></span><button class="cb gl" onclick="UPUI.toast('Profile link copied')">${ico('share')}</button></div></div><svg viewBox="0 0 400 44" preserveAspectRatio="none"><path d="M0 44 L0 28 C90 0 180 2 260 20 C330 36 370 30 400 14 L400 44Z" fill="#fff"/></svg></div>
      <div class="pvm"><div class="av ${P.person ? '' : 'biz'}" style="--hue:${P.hue}">${initials(P.name)}<i></i></div>
        <div class="nm">${esc(P.name)}<svg class="ico" viewBox="0 0 24 24">${UPUI.ICONS.badge}</svg></div><div class="or">${esc(P.person ? P.org : offerOf(L0.v, L0.cat).org[0])}${P.brn ? ' • BRN ' + P.brn : ''}</div>
        <div class="bdg">${sup ? `<span class="gold">${ico('star')}${SP ? 'SuperAgent' : 'Top provider'}</span>` : ''}<span>${ico('shield')}Licence verified</span><span>${ico('user')}ID checked</span><span>${ico('clock')}Replies ~${P.reply} min</span></div>
        <div class="pst"><div><b>${P.rating.toFixed(1)}★</b><span>${P.reviews} ratings</span></div><div><b>${P.L.length}</b><span>listings</span></div><div><b>${Math.round(P.L.length * 9)}</b><span>${SP ? 'deals' : 'bookings'}</span></div><div><b>${2026 - P.since}y</b><span>on UpNow</span></div></div>
        <div class="pct"><button class="btn btn-g" data-call="${L0.id}" style="height:46px">${ico('phone')}Call</button><button class="btn btn-wa" data-wa="${L0.id}" style="height:46px">${ico('wa')}WhatsApp</button></div>
        <div class="ptabs">${[['list', SP ? 'Listings' : 'Services'], ['rev', 'Reviews'], ['about', 'About']].map(([k, x]) => `<button class="${ptab === k ? 'on' : ''}" data-ptab="${k}">${x}</button>`).join('')}</div>
        <div style="margin:0 -16px">${ptab === 'list' ? body : `<div style="padding:0 16px">${body}</div>`}</div><div style="height:30px"></div></div></div>${tbar()}`;
  }
  const H2 = rows => rows.filter(Boolean).map(([k, v]) => `<div class="dm-kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');

  function savedS() {
    const L = [...UPUI.favs].map(UPUI.byId).filter(Boolean);
    return `${sbar()}<div class="view" data-screen-label="M06 Saved"><div class="mtop"><h1 style="text-align:left;font-size:24px">Saved</h1></div>${L.length ? L.map(mcard).join('') : `<div class="mempty">${ico('heart')}<b>Nothing saved yet</b>Tap ♡ on any listing to shortlist it.</div>`}</div>${tbar()}`;
  }
  function inbox() {
    const L = UPUI.leads();
    return `${sbar()}<div class="view" data-screen-label="M07 Enquiries"><div class="mtop"><h1 style="text-align:left;font-size:24px">Enquiries</h1></div>
      ${L.length ? L.map(r => `<button class="enq" style="width:100%;padding:12px 16px;text-align:left" data-l="${r.lid}"><img src="${r.img}" alt=""><div class="bd"><div class="r1"><b>${esc(r.title)}</b></div><small>${esc(r.provider)} · ${esc(r.area)}</small><small>${{ request: 'Enquiry', email: 'Email', call: 'Call', whatsapp: 'WhatsApp' }[r.type]} · ${new Date(r.t).toLocaleDateString()}</small></div></button>`).join('') : `<div class="mempty">${ico('msg')}<b>No enquiries yet</b>Calls, WhatsApps and booking requests you send appear here.</div>`}</div>${tbar()}`;
  }
  function account() {
    return `${sbar()}<div class="view" data-screen-label="M08 Account"><div class="mtop"><h1 style="text-align:left;font-size:24px">Account</h1></div>
      <div style="padding:0 16px 16px;display:flex;gap:12px;align-items:center"><span class="cb" style="width:56px;height:56px">${ico('user')}</span><div style="flex:1"><b>Guest</b><br><small style="color:var(--ink3)">Sign in to sync saved & enquiries</small></div><button class="btn btn-g btn-sm" data-open="signin">Sign in</button></div>
      <div class="acct">${[['globe', 'Language', UPUI.prefs.lang === 'ar' ? 'العربية' : 'English'], ['tag', 'Currency', UPUI.prefs.cur], ['bell', 'Saved searches & alerts', '2'], ['shield', 'Safety centre', ''], ['brief', 'Become a provider', ''], ['doc', 'Help & support', '']].map(([i, x, v]) => `<button>${ico(i)}<span>${x}</span><em>${v}</em>${ico('chevR')}</button>`).join('')}</div></div>${tbar()}`;
  }

  /* ---------- sheets ---------- */
  function sheetHTML() {
    if (!sheet) return '<div class="bsh"><div class="sc"></div><div class="pn"></div></div>';
    const Oo = O();
    let title = '', body = '', foot = '', full = false;
    if (sheet === 'book') { const l = UPUI.byId(cur().id); title = offerOf(l.v, l.cat).action; body = `<div class="bk">${DMB.bk()}</div>`; full = true; }
    else if (sheet === 'sort') { title = 'Sort by'; body = `<div class="optl">${UPUI.SORTS.map(([k, x]) => `<button class="opt ${S.sort === k ? 'on' : ''}" data-sort="${k}"><span class="rd"></span><div><b>${x}</b></div></button>`).join('')}</div>`; }
    else if (sheet === 'filters') { title = 'Filters'; full = true; body = Oo.defs.map(d => d.type === 'toggle' ? `<div class="mfld">${UPF.controlHTML(d, S)}</div>` : `<div class="slab" style="margin-left:0">${esc(d.label)}</div><div class="mfld" style="padding:0">${UPF.controlHTML(d, S)}</div>`).join(''); foot = 1; }
    else if (sheet.startsWith('f:')) { const d = Oo.def(sheet.slice(2)); title = d.label; body = `<div class="mfld" style="padding:0">${UPF.controlHTML(d, S)}</div>`; foot = 1; }
    if (foot) foot = `<div class="fbar"><button class="btn btn-o" data-clearf style="flex:none;padding:0 18px">Clear</button><button class="btn btn-g" style="flex:1" data-closesheet>Show ${UPUI.results(S).length} results</button></div>`;
    return `<div class="bsh on ${full ? 'full' : ''}"><div class="sc" data-closesheet></div><div class="pn"><div class="gr"></div><div class="hd"><b>${esc(title)}</b><button class="cb" data-closesheet>${ico('x')}</button></div><div class="bd">${body}</div>${foot || ''}</div></div>`;
  }

  /* ---------- render ---------- */
  function render(resetScroll) {
    persist();
    const keep = !resetScroll && scr.querySelector('.view') ? scr.querySelector('.view').scrollTop : 0;
    const s = cur().s;
    const html = ({ home, search, results, listing, provider, saved: savedS, inbox, account })[s]();
    const keepModal = [...scr.children].filter(x => x.matches('.scrim,.side-s,.toast,.isl'));
    scr.innerHTML = html + sheetHTML();
    keepModal.forEach(x => scr.appendChild(x));
    const v = scr.querySelector('.view'); if (v) v.scrollTop = keep;
    document.querySelectorAll('.mside a[data-demo]').forEach(a => a.classList.toggle('on', a.dataset.demo === s));
    bindLive();
  }
  function bindLive() {
    const inp = document.getElementById('mLoc');
    if (inp) inp.oninput = e => { locQ = e.target.value; const pos = inp.selectionStart; render(); const i = document.getElementById('mLoc'); i.focus(); i.setSelectionRange(pos, pos); };
    const tr = document.getElementById('dgTr');
    if (tr) tr.onscroll = () => { const n = document.getElementById('dgN'); if (n) n.textContent = (Math.round(tr.scrollLeft / tr.clientWidth) + 1) + ' / ' + tr.children.length; };
  }
  const reSheet = () => { const old = scr.querySelector('.bsh'); const bd = old && old.querySelector('.bd'); const st = bd ? bd.scrollTop : 0; const tmp = document.createElement('div'); tmp.innerHTML = sheetHTML(); old.replaceWith(tmp.firstChild); const nb = scr.querySelector('.bsh .bd'); if (nb) nb.scrollTop = st; };

  scr.addEventListener('click', e => {
    if (e.target.closest('[data-fav],[data-call],[data-wa],[data-email],[data-sms],[data-chat],[data-bk],[data-open],.scrim,.side-s')) { setTimeout(() => { if (e.target.closest('[data-fav]')) { const tb = scr.querySelector('.tbar'); if (tb) tb.outerHTML = tbar(); } }, 0); return; }
    const ctl = e.target.closest('[data-ctl]');
    if (ctl && ctl.tagName !== 'INPUT') { e.preventDefault(); if (UPF.handleControl(ctl, S)) { if (sheet) reSheet(); else render(); } return; }
    const b = e.target.closest('[data-tab],[data-back],[data-go],[data-v],[data-o],[data-l],[data-type],[data-area],[data-addloc],[data-rmloc],[data-reset],[data-view],[data-pin],[data-sheet],[data-closesheet],[data-sort],[data-clearf],[data-ptab],[data-prov]');
    if (!b) return; e.preventDefault();
    const d = b.dataset;
    if (d.tab) setTab(d.tab);
    else if ('back' in d) back();
    else if (d.v) { UPF.switchVertical(S, d.v); render(); }
    else if (d.o) { UPF.switchOffer(S, d.o); render(); }
    else if (d.go) { if (d.sort) S.sort = d.sort; if (d.go === 'results' && cur().s === 'results') { stack.pop(); } go(d.go); }
    else if (d.l) go('listing', { id: d.l });
    else if (d.type) { const def = O().def(d.type); S.f[d.type] = def.type === 'multi' ? [d.tv] : d.tv; go('results'); }
    else if (d.area) { S.loc = [d.area]; go('results'); }
    else if (d.addloc) { S.loc.push(d.addloc); locQ = ''; render(); }
    else if (d.rmloc) { S.loc = S.loc.filter(x => x !== d.rmloc); render(); }
    else if ('reset' in d) { const B = UPUI.blankState(S.v, S.o); Object.assign(S, { f: B.f, loc: [], q: '' }); locQ = ''; render(); }
    else if ('view' in d) { view = view === 'map' ? 'list' : 'map'; render(true); }
    else if (d.pin) { mapSel = d.pin; render(); }
    else if (d.sheet) { sheet = d.sheet; render(); }
    else if ('closesheet' in d) { sheet = null; render(); }
    else if (d.sort) { S.sort = d.sort; sheet = null; render(true); }
    else if ('clearf' in d) { if (sheet.startsWith('f:')) delete S.f[sheet.slice(2)]; else { const B = UPUI.blankState(S.v, S.o); S.f = B.f; } reSheet(); }
    else if (d.ptab) { ptab = d.ptab; render(); }
  });
  scr.addEventListener('change', e => { const c = e.target.closest('[data-ctl]'); if (c && UPF.handleControl(c, S)) { if (sheet) reSheet(); else render(); } });
  /* agent-card links → in-app provider screen */
  scr.addEventListener('click', e => { const a = e.target.closest('a[href^="Provider.html"]'); if (a) { e.preventDefault(); e.stopPropagation(); ptab = 'list'; go('provider', { p: new URLSearchParams(a.getAttribute('href').split('?')[1]).get('p') }); } }, true);
  document.addEventListener('upnow:leads', () => { if (cur().s !== 'listing') render(); });

  /* move modals/toast into the phone */
  UPUI.closeModal(); UPUI.closeSide();
  ['.scrim', '.side-s', '#toast'].forEach(q => { const el = document.querySelector(q); if (el) scr.appendChild(el); });

  /* demo jump links */
  document.querySelectorAll('.mside a[data-demo]').forEach(a => a.onclick = () => {
    const k = a.dataset.demo; sheet = null;
    if (['home', 'search', 'saved', 'inbox', 'account'].includes(k)) return setTab(k);
    if (a.dataset.v) { UPF.switchVertical(S, a.dataset.v); UPF.switchOffer(S, a.dataset.o); }
    tab = 'home';
    if (k === 'results') { stack = [{ s: 'home' }, { s: 'results' }]; return render(true); }
    if (k === 'listing') { const l = LISTINGS.find(x => x.cat === (a.dataset.o || 'residential')); stack = [{ s: 'home' }, { s: 'listing', id: l.id }]; return render(true); }
    if (k === 'provider') { stack = [{ s: 'home' }, { s: 'provider', p: 'Tariq Hassan' }]; ptab = 'list'; return render(true); }
  });
  render(true);
})();
