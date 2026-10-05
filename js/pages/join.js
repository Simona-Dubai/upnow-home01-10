/* Provider onboarding (pages/join.html). Sign-in comes first (components/marketplace/auth.js) — name, verified mobile and
   email come from the account (signed out, the sign-in modal opens over an empty step 1). Then three steps:
     1 Your business — what you offer, individual or company, where you work (each part appears once the one above is answered)
     2 Your profile  — photo / logo, public name, about, languages, how customers reach you (as on the agency page)
     3 Verify        — licence details next to their documents, then submit
   Country rules — ID document, licences, issuers, cities — come from data/markets.js. */
(function () {
  const { VERTICALS } = UP;
  const { ico, esc, toast, initials, auth } = UPUI;
  const KEY = 'upnow.join';
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- provider types per vertical ---------- */
  // two account types everywhere (as in the provider OS); Spaces adds one question for companies — own vs owners' properties
  const ROLES = {
    spaces: [
      ['individual', 'Individual', 'I own the property and list it in my name', 'user'],
      ['company', 'Company', 'Landlord company, brokerage, holiday-home or venue operator', 'building']
    ],
    // company only — no individual providers
    memberships: [['business', 'Company', 'Licensed gym, club or membership operator', 'building']],
    health: [['business', 'Company', 'Licensed clinic, hospital, lab or healthcare provider', 'building']],
    insurance: [['business', 'Insurer or broker', 'Licensed insurance company or broker', 'shield']],
    default: [
      ['freelancer', 'Individual', 'Self-employed, working under my own name', 'user'],
      ['business', 'Company', 'Licensed business — clinic, salon, school, operator…', 'building']
    ]
  };
  const rolesOf = v => ROLES[v] || ROLES.default;
  // categories on this page: Memberships sits after Programs
  const JOIN_ORDER = ['spaces', 'services', 'experiences', 'programs', 'memberships', 'health', 'insurance'];
  const verticalsInOrder = () => [...JOIN_ORDER.filter(v => UP.VORDER.includes(v)), ...UP.VORDER.filter(v => !JOIN_ORDER.includes(v))];
  const roleOf = s => rolesOf(s.v).find(r => r[0] === s.role);
  // categories an individual can list in Spaces (companies can list everything)
  const ROLE_CATS = { individual: ['residential', 'commercial', 'industrial', 'land', 'holiday'] };
  const PROPERTY_CATS = ['residential', 'commercial', 'industrial', 'land', 'mixed'];
  const listsProperty = s => s.v === 'spaces' && s.role === 'company' && s.cats.some(c => PROPERTY_CATS.includes(c));
  // a company that adds an office registration (ORN) is shown as a brokerage
  const isBrokerage = s => listsProperty(s) && !!(s.docs.orn || String(s.d.orn || '').trim());
  const isBiz = s => s.role === 'company' || s.role === 'business';
  const blockedIndividual = () => S.v === 'spaces' && S.role === 'individual' && S.cats.length && !S.cats.some(c => ROLE_CATS.individual.includes(c));

  /* ---------- market (country) rules: data/markets.js ---------- */
  const M = () => MARKETS.market(S.country);
  const country = () => MARKETS.byIso(S.country) || MARKETS.byIso(MARKETS.DEFAULT);
  const digits = p => String(p).replace(/\D/g, '');
  const fmtPhone = p => { p = digits(p); const out = []; let i = 0; for (const g of M().phone.groups) { if (i >= p.length) break; out.push(p.slice(i, i + g)); i += g; } if (i < p.length) out.push(p.slice(i)); return out.join(' '); };
  // "Real estate agent licence" → "real estate agent licence"; acronyms (RERA, REGA…) stay as they are
  const lc = t => /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;

  /* ---------- documents asked for, by provider type (and vertical for businesses) ---------- */
  const SECTOR = { health: 'health', experiences: 'tour', programs: 'education', insurance: 'insurance' };
  function docsFor(s) {
    const L = M().licences;
    const doc = (id, key, req) => L[key] ? [id, L[key][0], L[key][1], req == null ? L[key][2] : req] : null;
    const idDoc = who => ['eid', M().idDoc, who, true];
    const passport = ['passport', 'Passport', 'Bio-data page of a valid passport', false];
    const holiday = s.cats.includes('holiday') && doc('dtcmh', 'shortStay');
    if (s.v === 'spaces' && s.role === 'individual')
      return [idDoc('Front and back'), holiday, L.ownership && ['deed', L.ownership[0], 'You can also add it to each listing later', false], passport].filter(Boolean);
    if (s.v === 'spaces' && s.role === 'company')
      return [doc('tl', 'company'), idDoc('Authorised signatory · front and back'), listsProperty(s) && L.office && ['orn', L.office[0], 'Only for brokerages — managing other owners’ properties', false], holiday,
        ['vat', 'Tax / VAT certificate', 'If the company is tax-registered', false], passport].filter(Boolean);
    return (({
      business: [doc('tl', 'company'), SECTOR[s.v] ? doc('sector', SECTOR[s.v]) : null, idDoc('Owner or authorised signatory'), passport],
      freelancer: [idDoc('Front and back'), doc('fp', 'freelance'), passport]
    })[s.role] || [idDoc('Front and back')]).filter(Boolean);
  }
  // the numbers that belong to a document are asked right next to it
  function docFields(id) {
    const L = M().licences, authorities = L.authorities;
    if (id === 'tl') return [['company', 'Company name', 'As on the ' + lc(L.company[0])], ['licence', L.companyNo, 'e.g. 1234567'], ['auth', 'Issued by', authorities || 'Registry or authority']];
    if (id === 'orn') return [['orn', L.officeNo, 'e.g. 12345']];
    if (id === 'fp') return [['permit', L.freelance ? L.freelance[0] + ' no.' : 'Registration no.', 'Permit number']];
    return [];
  }

  /* ---------- reference data ---------- */
  // most-spoken first: the first ones not yet picked are offered as one-tap suggestions
  const LANGS = ['English', 'Arabic', 'Hindi', 'Urdu', 'Malayalam', 'Tagalog', 'Russian', 'French', 'Persian', 'Chinese', 'Spanish', 'German',
    'Tamil', 'Telugu', 'Bengali', 'Sinhala', 'Nepali', 'Pashto', 'Turkish', 'Italian', 'Portuguese', 'Dutch', 'Ukrainian', 'Japanese', 'Korean', 'Indonesian', 'Thai', 'Vietnamese', 'Swahili', 'Kurdish', 'Greek', 'Polish'];
  const MAX_LANGS = 6;
  const HOURS = [['9-18', '9 AM – 6 PM'], ['9-22', '9 AM – 10 PM'], ['24', '24/7']];
  const CHANNELS = [['wa', 'WhatsApp', 'wa'], ['call', 'Calls', 'phone'], ['email', 'Email', 'mail'], ['sms', 'SMS', 'msg']];
  const STEPS = [['Your business', 'What you offer, how and where'], ['Your profile', 'What customers see'], ['Verify', 'Licence and documents']];
  const LAST = STEPS.length;
  const MINUTES = [5, 3, 1];

  /* ---------- state (draft kept in this browser) ---------- */
  const fresh = () => ({ flow: 3, step: 1, country: MARKETS.DEFAULT, name: '', phone: '', email: '', v: 'spaces', role: '', cats: [], d: { langs: ['English'], city: '', areas: [] }, docs: {}, channels: ['wa', 'call'], hours: '9-22', agree: false, done: false });
  let S = fresh();
  // a submitted application reopens on its "under review" screen
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) S = Object.assign(fresh(), saved); } catch (e) {}
  // drafts from before markets: area ids → names, Dubai as the city
  if ((S.d.areas || []).some(a => UP.areaById[a])) { S.d.areas = S.d.areas.map(a => UP.areaById[a] ? UP.areaById[a].n : a); S.d.city = S.d.city || 'Dubai'; }
  // drafts from the earlier 4- and 5-step flows: keep the answers, restart at step 1
  if (S.flow !== 3) { S.flow = 3; S.step = 1; }
  // drafts from the old five Spaces types → Individual / Company
  if (S.v === 'spaces' && ['agent', 'agency', 'owner', 'holiday', 'operator'].includes(S.role)) {
    S.role = { owner: 'individual', agent: '' }[S.role] ?? 'company';
  }
  if (rolesOf(S.v).length === 1) S.role = rolesOf(S.v)[0][0];
  if (S.d.wholeCity) { S.d.areas = []; delete S.d.wholeCity; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  let errors = {};
  // the account (sign-in) supplies name, verified mobile and email
  function fromAccount() {
    const u = auth.user(); if (!u) return false;
    // the draft belongs to one account: someone else signing in on this browser starts their own
    const owner = u.email || u.dial + u.phone;
    if (S.owner && S.owner !== owner) { S = fresh(); errors = {}; }
    if (S.owner !== owner) { S.owner = owner; save(); }
    Object.assign(S, { name: u.name, phone: u.phone, email: u.email, dial: u.dial });
    return true;
  }

  /* ---------- motion bookkeeping (view only, never saved) ----------
     dir: the step slides in from this side on the next render · pop: selector of the control just picked (it springs)
     seen: sections already on screen (a new one fades up and scrolls into view) · fill: progress-bar widths last drawn */
  const A = { otherCity: false, areasOpen: false, dir: '', pop: '', seen: new Set(), entering: true, revealed: '', fill: [0, 0, 0], preview: '', saved: false, uploading: {}, optOpen: false };
  let previewOpen = false;

  /* ---------- small builders ---------- */
  const err = k => errors[k] ? `<span class="ob-err">${ico('x')}${esc(errors[k])}</span>` : '';
  const field = (k, label, input, hint = '') => `<div class="field ob-field ${errors[k] ? 'has-error' : ''}" data-f="${k}"><label for="ob-${k}">${esc(label)}</label>${input}${hint && !errors[k] ? `<small class="ob-hint">${esc(hint)}</small>` : ''}${err(k)}</div>`;
  const text = (k, label, ph = '', hint = '') => field(k, label, `<input id="ob-${k}" data-k="${k}" value="${esc(S.d[k] || '')}" placeholder="${esc(ph)}">`, hint);
  const select = (k, label, opts, ph = 'Select…') => field(k, label, `<span class="ob-select"><select id="ob-${k}" data-k="${k}"><option value="">${esc(ph)}</option>${opts.map(o => `<option value="${esc(o)}" ${S.d[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>${ico('chev')}</span>`);
  const firstName = () => (S.name || '').split(' ')[0];
  // a part of a step; parts that appear later fade up the first time they're shown
  function sec(id, title, body, aside = '') {
    const key = S.step + ':' + id, isNew = !A.seen.has(key);
    A.seen.add(key);
    if (isNew && !A.entering) A.revealed = id;
    return `<section class="ob-sec ${isNew && !A.entering ? 'is-enter' : ''}" data-sec="${id}"><div class="ob-sec-h"><h2>${title}</h2>${aside}</div>${body}</section>`;
  }

  /* ---------- step illustrations (brand greens, drawn inline) ---------- */
  const ART = {
    business: `<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="86" cy="62" r="50" fill="#eef7f2"/>
      <rect x="44" y="52" width="26" height="50" rx="4" fill="#d8efe3"/><rect x="74" y="34" width="32" height="68" rx="4" fill="#136142"/><rect x="110" y="60" width="22" height="42" rx="4" fill="#25946a"/>
      <g fill="#fff" opacity=".85"><rect x="80" y="42" width="7" height="7" rx="1.5"/><rect x="93" y="42" width="7" height="7" rx="1.5"/><rect x="80" y="55" width="7" height="7" rx="1.5"/><rect x="93" y="55" width="7" height="7" rx="1.5"/><rect x="80" y="68" width="7" height="7" rx="1.5"/><rect x="93" y="68" width="7" height="7" rx="1.5"/><rect x="115" y="68" width="5" height="5" rx="1"/><rect x="123" y="68" width="5" height="5" rx="1"/><rect x="115" y="78" width="5" height="5" rx="1"/><rect x="123" y="78" width="5" height="5" rx="1"/></g>
      <g fill="#136142" opacity=".55"><rect x="50" y="60" width="5" height="5" rx="1"/><rect x="59" y="60" width="5" height="5" rx="1"/><rect x="50" y="70" width="5" height="5" rx="1"/><rect x="59" y="70" width="5" height="5" rx="1"/></g>
      <rect x="86" y="88" width="10" height="14" rx="2" fill="#fff"/><path d="M30 102h112" stroke="#d3dad5" stroke-width="2" stroke-linecap="round"/>
      <g class="ob-art-pin"><path d="M128 14c-9 0-15 7-15 15 0 11 15 24 15 24s15-13 15-24c0-8-6-15-15-15z" fill="#e0a526"/><circle cx="128" cy="29" r="5.5" fill="#fff"/></g></svg>`,
    profile: `<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="80" cy="62" r="50" fill="#eef7f2"/>
      <rect x="34" y="30" width="96" height="70" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="M34 42a12 12 0 0 1 12-12h72a12 12 0 0 1 12 12v6H34z" fill="#136142"/>
      <circle cx="58" cy="58" r="14" fill="#25946a" stroke="#fff" stroke-width="3"/><circle cx="58" cy="54" r="5" fill="#fff"/><path d="M49 66c2-5 5-7 9-7s7 2 9 7" fill="#fff"/>
      <rect x="78" y="54" width="38" height="6" rx="3" fill="#136142"/><rect x="78" y="65" width="26" height="5" rx="2.5" fill="#d3dad5"/>
      <rect x="46" y="80" width="30" height="10" rx="5" fill="#d8efe3"/><rect x="80" y="80" width="30" height="10" rx="5" fill="#d8efe3"/>
      <g class="ob-art-star"><circle cx="130" cy="30" r="13" fill="#e0a526"/><path d="m130 23 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fff"/></g>
      <path class="ob-art-spark" d="M24 30v8M20 34h8M140 94v6M137 97h6" stroke="#25946a" stroke-width="2" stroke-linecap="round"/></svg>`,
    verify: `<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="80" cy="62" r="50" fill="#eef7f2"/>
      <rect x="44" y="22" width="60" height="78" rx="8" fill="#fff" stroke="#d8efe3" stroke-width="2" transform="rotate(-6 74 61)"/>
      <g transform="rotate(-6 74 61)"><rect x="54" y="36" width="34" height="5" rx="2.5" fill="#136142"/><rect x="54" y="48" width="40" height="4" rx="2" fill="#d3dad5"/><rect x="54" y="57" width="36" height="4" rx="2" fill="#d3dad5"/><rect x="54" y="66" width="28" height="4" rx="2" fill="#d3dad5"/></g>
      <g class="ob-art-shield"><path d="M112 44l22 8v16c0 15-10 24-22 28-12-4-22-13-22-28V52z" fill="#136142"/><path d="m102 70 7 7 13-14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g><rect x="30" y="76" width="22" height="18" rx="4" fill="#e0a526"/><path d="M35 76v-5a6 6 0 0 1 12 0v5" fill="none" stroke="#e0a526" stroke-width="3"/><circle cx="41" cy="85" r="2.5" fill="#fff"/></g></svg>`
  };
  const hero = (title, sub, art) => `<div class="ob-hero"><div><h1 class="ob-h1">${title}</h1><p class="ob-sub">${sub}</p></div><div class="ob-art">${ART[art]}</div></div>`;

  /* ---------- step 1: your business ---------- */
  function stepBusiness() {
    const sp = S.v === 'spaces', cats = VERTICALS[S.v].offers, role = roleOf(S);
    const roleDone = S.role && !blockedIndividual();
    let html = hero('Tell us about your business', `${firstName() ? `Hi ${esc(firstName())} — a` : 'A'} few taps. Everything else follows from your answers.`, 'business');
    html += sec('what', 'What do you offer?', `<div class="ob-verticals">${verticalsInOrder().map(v => `<button type="button" class="ob-tile ${S.v === v ? 'is-active' : ''}" data-vert="${v}"><i>${ico(VERTICALS[v].icon)}</i><span>${esc(VERTICALS[v].label)}</span></button>`).join('')}</div>`);
    html += sec('list', `What will you list?`, `<div class="ob-cats ${errors.cats ? 'has-error' : ''}">${cats.map(o => { const on = S.cats.includes(o.id); return `<button type="button" class="ob-chip ${on ? 'is-active' : ''}" data-cat="${o.id}">${ico(o.icon || UPF.OICO[o.id] || VERTICALS[S.v].icon)}<span>${esc(o.label)}</span><span class="ob-tick">${ico('check')}</span></button>`; }).join('')}</div>${err('cats')}`, '<small>Pick all that apply</small>');
    if (S.cats.length) {
      const only = rolesOf(S.v).length === 1 && rolesOf(S.v)[0];
      if (only) html += `<p class="ob-only">${ico(only[3])}<span>You'll list as a <b>${esc(only[1] === 'Company' ? 'company' : only[1].toLowerCase())}</b> — ${esc(VERTICALS[S.v].label)} is for licensed businesses only.</span></p>`;
      else html += sec('as', 'You’re listing as', `<div class="ob-roles ${errors.role ? 'has-error' : ''}">${rolesOf(S.v).map(([id, t, sub, icon]) => `<button type="button" class="ob-role ${S.role === id ? 'is-active' : ''}" data-role="${id}"><i>${ico(icon)}</i><span><b>${esc(t)}</b><small>${esc(sub)}</small></span><span class="ob-radio"></span></button>`).join('')}</div>${err('role')}
        ${blockedIndividual() ? `<p class="ob-note is-warn">${ico('x')}<span>Individuals can list homes, offices, warehouses, land and holiday homes. For venues, courts or yachts choose <b>Company</b>.</span></p>` : ''}`);
    }
    if (S.cats.length && roleDone) {
      const pick = `<label class="ob-country" title="Country">${country().flag}<select data-country aria-label="Country">${MARKETS.COUNTRIES.map(x => `<option value="${x.iso}" ${x.iso === S.country ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>${ico('chev')}</label>`;
      html += sec('where', 'Where do you work?', locationBlock(), pick);
    }
    if (sp && !role) html += `<p class="ob-foot-note">${ico('user')}Real estate agent? Your agency adds you from its ${esc(SITE.name)} workspace.</p>`;
    return html;
  }

  // city: one tap on a known city (or type another) · areas are optional — none means the whole city
  function locationBlock() {
    const m = M(), d = S.d, cities = Object.keys(m.cities), known = m.cities[d.city] || [];
    const other = A.otherCity || !cities.length || (d.city && !cities.includes(d.city));
    const areas = d.areas || [], sugg = known.filter(a => !areas.includes(a));
    const cityRow = `<div class="ob-cities ${errors.city ? 'has-error' : ''}">${cities.map(x => `<button type="button" class="ob-chip is-sm ${d.city === x && !other ? 'is-active' : ''}" data-city="${esc(x)}">${esc(x)}</button>`).join('')}
      ${cities.length ? `<button type="button" class="ob-chip is-sm ${other ? 'is-active' : ''}" data-act="othercity">${ico('pin')}Other</button>` : ''}</div>
      ${other ? `<input id="ob-city" class="ob-city-in" value="${esc(cities.includes(d.city) ? '' : d.city || '')}" placeholder="Type your city" autocomplete="address-level2">` : ''}${err('city')}`;
    const areaRow = !d.city ? '' : (areas.length || A.areasOpen)
      ? `<div class="ob-areas"><div class="ob-tags">${areas.map(a => `<span class="loc-token">${esc(a)}<button type="button" data-rmarea="${esc(a)}" aria-label="Remove ${esc(a)}">${ico('x')}</button></span>`).join('')}<input id="ob-area" data-areainput placeholder="${areas.length ? 'Add another area' : `Area in ${esc(d.city)}, then Enter`}" autocomplete="off"></div>
        ${sugg.length ? `<div class="ob-suggest">${sugg.slice(0, 8).map(a => `<button type="button" class="chip" data-addarea="${esc(a)}">${ico('plus')}${esc(a)}</button>`).join('')}</div>` : ''}
        <small class="ob-hint">Optional · up to 8 — customers searching these areas see you first${areas.length ? '' : '. Leave empty to cover all of ' + esc(d.city)}</small></div>`
      : `<p class="ob-area-line">${ico('check')}<span>Covering <b>all of ${esc(d.city)}</b></span><button type="button" class="text-link" data-act="areas">${ico('plus')}Pick specific areas</button></p>`;
    return cityRow + areaRow;
  }

  /* ---------- step 2: your profile — the same pieces as the agent / agency page ---------- */
  function kindOf() {
    const r = roleOf(S), d = S.d, sp = S.v === 'spaces';
    const onlyCats = list => S.cats.length && S.cats.every(c => list.includes(c));
    return !sp ? (r ? r[1] : '') : S.role === 'individual' ? 'Private owner'
      : isBrokerage(S) ? 'Real estate brokerage' : onlyCats(['holiday']) ? 'Holiday home operator' : onlyCats(['venue', 'court', 'yacht']) ? 'Licensed operator' : S.role === 'company' ? 'Property company' : '';
  }
  // a first draft of the About text from the answers so far — the provider edits it
  function aboutStarter() {
    const d = S.d, biz = isBiz(S), sp = S.v === 'spaces';
    const cats = S.cats.map(id => (VERTICALS[S.v].offers.find(o => o.id === id) || {}).label).filter(Boolean).map(x => x.toLowerCase());
    const list = cats.length > 1 ? cats.slice(0, -1).join(', ') + ' and ' + cats[cats.length - 1] : cats[0] || VERTICALS[S.v].label.toLowerCase();
    const where = !(d.areas || []).length ? (d.city ? `across ${d.city}` : '') : (d.areas || []).length ? `in ${(d.areas || []).slice(0, 3).join(', ')}${d.city ? ', ' + d.city : ''}` : d.city ? `in ${d.city}` : '';
    const what = sp ? `${list} properties` : list;
    const langs = d.langs || ['English'];
    const kind = (kindOf() || 'provider').toLowerCase();
    if (biz) return `${d.display || d.company || 'We'} is a ${kind} offering ${what} ${where}. We reply quickly on WhatsApp and calls, in ${langs.join(', ')}, and every listing is checked before it goes live.`.replace(/\s+/g, ' ');
    return `I'm ${firstName() || 'a'}${S.name ? ', a' : ''} ${kind} offering ${what} ${where}. I reply quickly on WhatsApp and calls, and speak ${langs.join(', ')}.`.replace(/\s+/g, ' ');
  }
  // languages: tags + type to add (themed suggestions) + a few one-tap picks
  function langPicker() {
    const cur = S.d.langs || [], left = LANGS.filter(l => !cur.includes(l)), full = cur.length >= MAX_LANGS;
    return `<div class="ob-tags ob-langs ${errors.langs ? 'has-error' : ''}">${cur.map(l => `<span class="loc-token">${esc(l)}<button type="button" data-rmlang="${esc(l)}" aria-label="Remove ${esc(l)}">${ico('x')}</button></span>`).join('')}
        ${full ? '' : `<input id="ob-lang" data-langinput list="ob-langlist" placeholder="${cur.length ? 'Add another' : 'Type a language'}" autocomplete="off"><datalist id="ob-langlist">${left.map(l => `<option value="${esc(l)}">`).join('')}</datalist>`}</div>
      ${full ? '' : `<div class="ob-quick">${left.slice(0, 3).map(l => `<button type="button" data-addlang="${esc(l)}">${ico('plus')}${esc(l)}</button>`).join('')}</div>`}${err('langs')}`;
  }
  function addLang(v) {
    const l = LANGS.find(x => x.toLowerCase() === String(v).trim().toLowerCase()) || (String(v).trim() && String(v).trim()[0].toUpperCase() + String(v).trim().slice(1));
    const cur = S.d.langs || [];
    if (!l || cur.includes(l)) return;
    if (cur.length >= MAX_LANGS) { toast(`Up to ${MAX_LANGS} languages`); return; }
    S.d.langs = [...cur, l]; delete errors.langs; commit();
    const i = document.getElementById('ob-lang'); if (i) { i.value = ''; i.focus({ preventScroll: true }); }
  }
  function stepProfile() {
    const d = S.d, biz = isBiz(S), bio = d.bio || '';
    if (!d.display) d.display = (biz ? d.company : S.name) || ''; // start from what we already know
    const shown = d.display || S.name || '?';
    const where = d.city ? [(d.areas || [])[0], d.city].filter(Boolean).join(', ') : '';
    return `${hero('Make your profile stand out', `This is what customers see on your ${biz ? 'company ' : ''}page and next to every listing.`, 'profile')}
      ${sec('who', biz ? 'Logo and name' : 'Photo and name', `<div class="ob-idcard">
        <label class="ob-avatar-up ${biz ? 'is-logo' : ''} ${d.photo ? 'has-photo' : ''}" title="${d.photo ? 'Change' : 'Add'} ${biz ? 'logo' : 'photo'}">
          <input type="file" accept="image/*" data-photo hidden>${d.photo ? `<img src="${d.photo}" alt="">` : `<span class="ob-avatar-ini">${esc(initials(shown) || '?')}</span>`}<span class="ob-cam">${ico('camera')}</span></label>
        <div class="ob-idcard-txt">${text('display', 'Name customers see', biz ? 'Your brand or trading name' : 'Your full name')}
          <small class="ob-idcard-sub">${esc([kindOf(), where].filter(Boolean).join(' · '))}</small>
          <small class="ob-idcard-tip">${d.photo ? `<button type="button" class="text-link" data-act="rmphoto">Remove ${biz ? 'logo' : 'photo'}</button>` : `${ico('spark')}Profiles with a ${biz ? 'logo' : 'photo'} get 2× more enquiries`}</small></div>
      </div>`)}
      ${sec('about', 'About', `<div class="ob-field ob-about ${errors.bio ? 'has-error' : ''}" data-f="bio">
          <textarea id="ob-bio" data-k="bio" maxlength="600" placeholder="What you offer, where, and why customers choose you…">${esc(bio)}</textarea>
          <div class="ob-about-foot"><button type="button" class="ob-magic" data-act="starter">${ico('spark')}${bio ? 'Rewrite it for me' : 'Write it for me'}</button><span class="ob-count ${bio.trim().length >= 60 ? 'is-ok' : ''}" data-bio-count>${bio.length < 60 ? `${bio.length}/60 min` : `${bio.length}/600`}</span></div>${err('bio')}</div>
        ${biz ? text('office', 'Office address', 'Building, street, area') : ''}`)}
      ${sec('langs', 'Languages you speak', langPicker(), `<small>${(d.langs || []).length}/${MAX_LANGS}</small>`)}
      ${sec('reach', 'How customers reach you', `<div class="ob-channels ${errors.channels ? 'has-error' : ''}">${CHANNELS.map(([id, t, i]) => `<button type="button" class="ob-chtile ${S.channels.includes(id) ? 'is-active' : ''}" data-ch="${id}"><i>${ico(i)}</i><span>${t}</span><span class="ob-tick">${ico('check')}</span></button>`).join('')}</div>${err('channels')}
        <div class="ob-hours"><span>${ico('clock')}Replies</span><div class="ob-seg-ctl">${HOURS.map(([id, t]) => `<button type="button" class="${S.hours === id ? 'is-active' : ''}" data-hours="${id}">${t}</button>`).join('')}</div></div>`)}`;
  }

  /* ---------- step 3: verify ---------- */
  function docCard([id, t, hint, req]) {
    const f = S.docs[id], up = A.uploading[id], fields = docFields(id);
    const input = ([k, label, ph]) => Array.isArray(ph) ? select(k, label, ph) : text(k, label, ph);
    return `<div class="ob-doc ${f && !up ? 'is-done' : ''} ${errors['doc_' + id] ? 'has-error' : ''}" data-docid="${id}">
      <div class="ob-doc-h"><i>${ico(f && !up ? 'check' : 'doc')}</i><span><b>${esc(t)}</b><small>${esc(hint)}</small></span><em class="${f && !up ? 'is-up' : req ? 'is-req' : ''}">${f && !up ? 'Added' : req ? 'Required' : 'Optional'}</em></div>
      ${fields.length ? `<div class="ob-doc-fields ${fields.length === 3 ? 'is-3' : ''}">${fields.map(input).join('')}</div>` : ''}
      <label class="ob-drop ${up ? 'is-uploading' : ''}"><input type="file" accept="image/*,.pdf" data-doc="${id}" hidden>
        ${up ? `<span class="ob-file">${ico('doc')}<span><b>${esc(f.name)}</b><span class="ob-bar"><span></span></span></span></span>`
        : f ? `<span class="ob-file">${ico('doc')}<span><b>${esc(f.name)}</b><small>${f.size}</small></span><span class="ob-file-act">Replace</span></span>`
        : `<span class="ob-drop-empty">${ico('upload')}<span><b>Drop file or <u>browse</u></b><small>PDF, JPG or PNG · up to 10 MB</small></span></span>`}
      </label>${err('doc_' + id)}</div>`;
  }
  function stepVerify() {
    const docs = docsFor(S), req = docs.filter(x => x[3]), opt = docs.filter(x => !x[3]);
    if (isBiz(S) && !S.d.company && S.d.display) S.d.company = S.d.display; // legal name usually starts as the brand name
    return `${hero('Verify and go live', 'Last step. Our team checks these within 1–2 business days.', 'verify')}
      <p class="ob-private">${ico('lock')}<span>Private — documents are never shown on your profile. Customers only see the “Verified by ${esc(SITE.name)}” badge.</span></p>
      <div class="ob-docs">${req.map(docCard).join('')}</div>
      ${opt.length ? `<details class="ob-more" ${A.optOpen ? 'open' : ''}><summary>${ico('plus')}Optional documents <small>${opt.map(x => x[1]).join(' · ')}</small></summary><div class="ob-docs">${opt.map(docCard).join('')}</div></details>` : ''}
      <label class="ob-check ${errors.agree ? 'has-error' : ''}"><input type="checkbox" data-agree ${S.agree ? 'checked' : ''}><span>I confirm the details are correct and agree to the <a class="text-link" href="#" onclick="return false">Provider terms</a>. I will only list ${S.v === 'spaces' ? 'properties I am permitted to advertise' : 'services I am licensed to provide'}.</span></label>${err('agree')}`;
  }

  /* ---------- submitted ---------- */
  function stepDone() {
    const bits = Array.from({ length: 18 }, (_, k) => { const a = k / 18 * Math.PI * 2, r = 70 + (k % 3) * 22; return `<span style="--x:${Math.round(Math.cos(a) * r)}px;--y:${Math.round(Math.sin(a) * r)}px;--r:${k * 47}deg;--d:${(k % 4) * 40}ms" class="c${k % 4}"></span>`; }).join('');
    return `<div class="ob-done"><div class="ob-done-mark"><span class="ob-confetti" aria-hidden="true">${bits}</span><span class="ob-done-ic"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span></div>
      <h1 class="ob-h1">You're all set, ${esc(firstName() || 'there')}!</h1>
      <p class="ob-sub">Your profile is <b>under review</b>. We'll WhatsApp you on ${S.dial || country().dial} ${esc(fmtPhone(S.phone))} as soon as it's approved — usually within 1–2 business days.</p>
      <ol class="ob-timeline"><li class="is-done" style="--i:0"><i>${ico('check')}</i><span><b>Application submitted</b><small>Details and documents received</small></span></li>
        <li class="is-now" style="--i:1"><i>2</i><span><b>Compliance review</b><small>We verify your identity${isBiz(S) ? ' and licences' : ''}</small></span></li>
        <li style="--i:2"><i>3</i><span><b>Profile live</b><small>Add ${S.v === 'spaces' ? 'listings' : 'services'} and receive leads by ${esc(S.channels.map(c => CHANNELS.find(x => x[0] === c)[1]).join(', '))}</small></span></li></ol>
      <div class="ob-done-cta"><button class="btn btn-primary" data-act="first">${ico('plus')}Prepare your first ${S.v === 'spaces' ? 'listing' : 'service'}</button><a class="btn btn-outline" href="${PATHS.href.home}">Back to ${esc(SITE.name)}</a></div>
      ${S.email ? `<p class="ob-done-note">A copy is on its way to <b>${esc(S.email)}</b> · <button class="text-link" data-act="restart">Start a new application</button></p>` : `<button class="text-link" data-act="restart">Start a new application</button>`}</div>`;
  }

  /* ---------- progress: one line + three segments that fill as you answer ---------- */
  function partsDone(n) {
    const d = S.d;
    if (n === 1) return [S.cats.length, S.role && !blockedIndividual(), d.city];
    if (n === 2) return [d.photo, String(d.display || '').trim(), String(d.bio || '').trim().length >= 60, (d.langs || []).length, S.channels.length];
    const docs = docsFor(S).filter(x => x[3]);
    return [...docs.map(x => S.docs[x[0]]), ...docs.flatMap(x => docFields(x[0]).map(f => String(d[f[0]] || '').trim())), S.agree];
  }
  const fillOf = n => n < S.step ? 1 : n > S.step ? 0 : (p => p.filter(Boolean).length / p.length)(partsDone(n));
  function stepSummary(n) {
    const d = S.d, r = roleOf(S);
    if (n === 1) return [r && r[1], VERTICALS[S.v].label, d.city].filter(Boolean).join(' · ');
    if (n === 2) return [d.display, d.photo && 'photo'].filter(Boolean).join(' · ');
    return '';
  }
  const progress = () => `<div class="ob-head"><div class="ob-progress"><span><b>Step ${S.step} of ${LAST}</b> · ${STEPS[S.step - 1][0]}</span><span>About ${MINUTES[S.step - 1]} min left</span></div>
    <ol class="ob-seg">${STEPS.map(([t], k) => { const n = k + 1, st = n < S.step ? 'is-done' : n === S.step ? 'is-now' : '', tag = n < S.step ? 'button' : 'span';
      return `<li class="${st}"><${tag} ${n < S.step ? `type="button" data-goto="${n}" title="Edit ${t}"` : ''}><i><b style="width:${Math.round(A.fill[k] * 100)}%" data-w="${Math.round(fillOf(n) * 100)}%"></b></i><small>${n < S.step ? ico('check') : ''}${t}</small>${n < S.step && stepSummary(n) ? `<em>${esc(stepSummary(n))}</em>` : ''}</${tag}></li>`; }).join('')}</ol></div>`;

  /* ---------- live profile preview (right column) ---------- */
  // same markup + styles as the agent card on the listing page (DM.agentCard), filled from the form
  function card() {
    const d = S.d, biz = isBiz(S), sp = S.v === 'spaces';
    const shown = d.display || (biz && d.company) || S.name || 'Your name';
    const kind = kindOf();
    const hue = [...shown].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 140);
    const NATIVE = (window.DM && DM.NATIVE) || {};
    const langs = (d.langs || []).map(x => NATIVE[x] || x);
    const hours = (HOURS.find(h => h[0] === S.hours) || HOURS[1])[1];
    const has = c => S.channels.includes(c);
    const footName = biz ? (d.display || d.company || 'Your company') : shown;
    const footSub = sp ? ({ 'Real estate brokerage': 'Real estate broker L.L.C', 'Holiday home operator': 'Holiday home operator · DTCM', 'Private owner': 'Private owner' })[kind] || (biz ? 'Licensed company' : 'Private owner') : S.role === 'freelancer' ? 'Freelance permit' : kind;
    const allLabel = S.v === 'spaces' ? (S.cats.length && S.cats.every(c => ['venue', 'court', 'yacht'].includes(c)) ? 'View all listings' : 'View all properties') : 'View all services';
    const action = (icon, t, sub) => `<span class="agent-action">${ico(icon)}<span><b>${t}</b><small>${sub}</small></span>${ico('chevR', 'chevron')}</span>`;
    const alt = (cls, icon, t) => `<span class="agent-alt-action ${cls}">${icon}<span><b>${t}</b></span>${ico('chevR', 'chevron')}</span>`;
    const main = [has('call') && action('phone', 'Call', 'Direct call'), has('wa') && action('wa', 'WhatsApp', 'Chat instantly')].filter(Boolean);
    const alts = [has('sms') && alt('is-sms', ico('msg'), 'SMS'), has('email') && alt('is-email', '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>', 'Email'),
      alt('is-chat', '<svg class="icon" viewBox="0 0 24 24"><path d="M12 4c4.97 0 9 3.36 9 7.5S16.97 19 12 19c-1.1 0-2.15-.16-3.12-.46L4 20l1.4-3.6C4.5 15.1 3 13.4 3 11.5 3 7.36 7.03 4 12 4z"/></svg>', 'Chat')].filter(Boolean);
    return `<div class="agent-card ob-agent-card" aria-hidden="true">
        <div class="agent-cover"><svg viewBox="0 0 400 46" preserveAspectRatio="none"><path d="M0 46 L0 30 C90 2 170 4 250 22 C320 38 370 30 400 16 L400 46Z" fill="#fff"/></svg></div>
        <div class="agent-top">
          <div class="agent-avatar ${d.photo ? 'has-photo' : ''}" style="--hue:${hue}">${d.photo ? `<img src="${d.photo}" alt="">` : esc(initials(shown) || '?')}<span class="agent-online"></span></div>
          <div class="agent-info"><div class="agent-name"><span>${esc(shown)}</span>${S.done ? `<span class="agent-verified">${ico('badge')}</span>` : ''}</div>
            <div class="agent-org">${esc(kind || 'Individual or company?')}</div></div>
        </div>
        <div class="agent-stats">
          <div><div class="stat-head"><svg class="icon is-star" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg><span class="stat-value">New</span></div><div class="stat-sub is-empty">No ratings yet</div></div>
          <div><div class="stat-head">${ico('clock')}Replies</div><div class="stat-sub"><b>${esc(hours)}</b></div></div>
          <div><div class="stat-head">${ico('globe')}<span>${esc(langs.slice(0, 2).join(' • ') || '—')}</span></div><div class="stat-langs">${langs.length > 2 ? esc(langs.slice(2).join(' • ')) : '0 active listings'}</div></div>
        </div>
        <div class="agent-body">
          ${main.length ? `<div class="agent-actions">${main.join('')}</div>` : ''}
          ${alts.length ? `<div class="agent-more">${main.length ? 'More ways to contact' : 'Contact'}</div><div class="agent-alt-actions">${alts.join('')}</div>` : ''}
        </div>
        <div class="agent-footer"><span class="agent-logo">${ico(S.v === 'spaces' ? 'office' : 'shop')}</span><span class="agent-agency"><b>${esc(footName)}</b><small>${esc(footSub)}</small></span><span class="agent-view-all">${allLabel}${ico('chevR')}</span></div>
      </div>`;
  }
  function preview() {
    const docs = docsFor(S), up = docs.filter(x => x[3] && S.docs[x[0]]).length, need = docs.filter(x => x[3]).length;
    return `<div class="ob-preview"><div class="ob-preview-h">${ico('eye')}Live preview<span>Updates as you type</span></div>
      ${card()}
      <div class="ob-card-status ${S.done ? 'is-review' : ''}">${ico('shield')}${S.done ? 'Under review — your “Verified by ' + esc(SITE.name) + '” badge appears once approved' : `Verification · ${up}/${need} required documents`}<span class="ob-mini"><span style="width:${need ? Math.round(up / need * 100) : 0}%"></span></span></div>
      <ul class="ob-why"><li>${ico('bolt')}<span><b>Leads in minutes</b>Customers call or WhatsApp you directly.</span></li>
        <li>${ico('tag')}<span><b>No commission</b>Free to list. You agree prices with the customer.</span></li>
        <li>${ico('shield')}<span><b>Verified badge</b>Verified profiles get up to 3× more enquiries.</span></li></ul></div>`;
  }

  /* ---------- validation ---------- */
  function validate(step) {
    const e = {}, d = S.d;
    if (step === 1) {
      if (!S.cats.length) e.cats = 'Pick at least one thing you will list';
      else if (!S.role) e.role = 'Choose individual or company';
      else if (blockedIndividual()) e.role = 'Individuals can’t list only venues, courts or yachts — choose Company';
      else if (!String(d.city || '').trim()) e.city = 'Enter the city you work in';
    }
    if (step === 2) {
      if (!String(d.display || '').trim()) e.display = 'Add the name customers will see';
      if (String(d.bio || '').trim().length < 60) e.bio = 'Write at least 60 characters — or tap “Write it for me”';
      if (!(d.langs || []).length) e.langs = 'Pick at least one language';
      if (!S.channels.length) e.channels = 'Choose at least one way to be contacted';
    }
    if (step === 3) {
      docsFor(S).forEach(([id, , , req]) => {
        if (req && !S.docs[id]) e['doc_' + id] = 'Upload this document';
        if (req || S.docs[id]) docFields(id).forEach(([k]) => { if (!String(d[k] || '').trim()) e[k] = 'Required'; });
      });
      if (!S.agree) e.agree = 'Please confirm to submit';
    }
    return e;
  }

  /* ---------- in-place update ----------
     A click inside a step changes a few classes and texts, so the new markup is merged into the page instead of
     replacing it: nothing re-animates or reloads (images, entrance fades), CSS transitions run, focus and scroll stay. */
  const keyOf = n => n.nodeType === 1 && (n.id || n.dataset.sec || n.dataset.docid) || '';
  const sameKind = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || a.tagName === b.tagName);
  function morph(from, to) {
    if (from.nodeType === 3 || from.nodeType === 8) { if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue; return; }
    for (const { name } of [...from.attributes]) if (!to.hasAttribute(name)) from.removeAttribute(name);
    for (const { name, value } of [...to.attributes]) if (from.getAttribute(name) !== value) from.setAttribute(name, value);
    const tag = from.tagName, focused = from === document.activeElement;
    if (tag === 'INPUT') {
      if (from.type === 'checkbox' || from.type === 'radio') from.checked = to.hasAttribute('checked');
      else if (from.type !== 'file' && !focused && from.value !== (to.getAttribute('value') || '')) from.value = to.getAttribute('value') || '';
      return;
    }
    if (tag === 'TEXTAREA') { if (!focused && from.value !== to.textContent) from.value = to.textContent; return; }
    const want = tag === 'SELECT' ? ([...to.options].find(o => o.hasAttribute('selected')) || to.options[0] || {}).value : null;
    morphKids(from, to);
    if (tag === 'SELECT' && want != null && from.value !== want) from.value = want;
  }
  function morphKids(from, to) {
    const keyed = new Map();
    [...from.childNodes].forEach(k => { const key = keyOf(k); if (key) keyed.set(key, k); });
    let i = 0;
    for (const nk of [...to.childNodes]) {
      const cur = from.childNodes[i], key = keyOf(nk);
      let match = null;
      if (key) { match = keyed.get(key) || null; keyed.delete(key); }
      else if (cur && !keyOf(cur) && sameKind(cur, nk)) match = cur;
      if (match) { if (match !== cur) from.insertBefore(match, cur || null); morph(match, nk); }
      else from.insertBefore(nk, cur || null);
      i++;
    }
    while (from.childNodes.length > i) from.lastChild.remove();
  }
  function paint(html, whole) {
    const t = document.createElement('div'); t.innerHTML = html;
    if (whole || !root.firstElementChild || !t.firstElementChild || root.firstElementChild.className.split(' ')[0] !== t.firstElementChild.className.split(' ')[0]) root.innerHTML = html;
    else morphKids(root, t);
  }

  /* ---------- render ---------- */
  const root = document.getElementById('ob');
  // signed out: an empty step 1 sits behind the sign-in modal (never a previous visitor's draft); any click opens sign-in
  function render() {
    const acc = document.querySelector('.ob-top [data-auth-slot]'); if (acc && UPUI.accountButton) acc.outerHTML = UPUI.accountButton();
    if (fromAccount()) return draw(false);
    const keep = S, keepErr = errors;
    S = fresh(); errors = {};
    try { draw(true); } finally { S = keep; errors = keepErr; }
  }
  function draw(locked) {
    const scroller = root.querySelector('.ob-scroll'), keep = !A.dir && scroller ? scroller.scrollTop : 0, winY = scrollY;
    if (A.dir) A.entering = true;
    A.revealed = '';
    const body = S.done ? stepDone() : [stepBusiness, stepProfile, stepVerify][S.step - 1]();
    const pv = preview();
    const wasDone = !!root.querySelector('.ob-done');
    paint(`<div class="ob-grid ${S.done ? 'is-done' : ''} ${locked ? 'is-locked' : ''}"><main class="ob-main">
      ${S.done ? '' : progress()}
      <div class="ob-panel ${S.done ? 'is-done' : ''}"><div class="ob-scroll"><div class="ob-step ${A.dir ? 'is-in-' + A.dir : ''}">${body}</div></div>
        ${S.done ? '' : `<div class="ob-nav">${S.step > 1 ? `<button type="button" class="btn btn-ghost" data-act="back">${ico('chevL')}Back</button>` : '<span></span>'}
          <span class="ob-save ${A.saved ? 'is-on' : ''}">${ico('check')}Saved</span>
          ${locked ? `<button type="button" class="btn btn-primary ob-next" data-act="signin">Sign in to start${ico('chevR')}</button>` : `<button type="button" class="btn btn-primary ob-next" data-act="next">${S.step === LAST ? 'Submit for review' : 'Continue'}${ico(S.step === LAST ? 'check' : 'chevR')}</button>`}</div>`}</div>
    </main>
      <aside class="ob-aside ${previewOpen ? 'is-open' : ''}"><button type="button" class="ob-preview-toggle" data-act="preview">${ico('eye')}<span>${previewOpen ? 'Hide profile preview' : 'Preview your profile'}</span>${ico('chev')}</button>${pv}</aside></div>`, !!A.dir || wasDone !== !!S.done);
    // motion: keep the reading position, fill the bar, spring the control just picked, bring a new part into view
    const sc = root.querySelector('.ob-scroll');
    if (sc && keep) sc.scrollTop = keep;
    if (!A.dir) scrollTo(0, winY);
    const bars = [...root.querySelectorAll('.ob-seg [data-w]')];
    requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach(b => { b.style.width = b.dataset.w; })));
    A.fill = STEPS.map((_, k) => fillOf(k + 1));
    if (A.pop) { const p = root.querySelector(A.pop); if (p) p.classList.add('is-pop'); }
    if (A.revealed && !calm.matches) { const r = root.querySelector(`[data-sec="${A.revealed}"]`); if (r) setTimeout(() => r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 120); }
    if (A.preview && A.preview !== pv && !A.dir) { const c = root.querySelector('.ob-preview .agent-card'); if (c) c.classList.add('is-bump'); }
    fitBio();
    A.preview = pv; A.pop = ''; A.dir = ''; A.entering = false; A.saved = false;
  }
  // after a change in the current step: save, show "Saved", redraw
  function commit(pop) { A.pop = pop || ''; A.saved = true; save(); render(); }
  // the About box grows with its text (field-sizing where supported, by hand elsewhere)
  function fitBio() { const b = document.getElementById('ob-bio'); if (!b || CSS.supports('field-sizing', 'content')) return; b.style.height = 'auto'; b.style.height = b.scrollHeight + 'px'; }
  function flashSaved() { const s = root.querySelector('.ob-save'); if (!s) return; s.classList.remove('is-on'); void s.offsetWidth; s.classList.add('is-on'); }
  function refreshPreview() {
    const p = root.querySelector('.ob-preview'); if (!p) return;
    const pv = preview(); if (pv === A.preview) return;
    const t = document.createElement('div'); t.innerHTML = pv; morph(p, t.firstElementChild); A.preview = pv;
    const fill = root.querySelector('.ob-seg li.is-now [data-w]'); if (fill) fill.style.width = Math.round(fillOf(S.step) * 100) + '%';
  }

  function go(step) {
    A.dir = step > S.step ? 'fwd' : 'back';
    S.step = step; errors = {}; save(); render();
    window.scrollTo({ top: 0, behavior: calm.matches ? 'auto' : 'smooth' });
  }
  function next() {
    errors = validate(S.step);
    if (Object.keys(errors).length) {
      render();
      const f = root.querySelector('.has-error'); if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.classList.add('is-shake'); }
      return;
    }
    if (S.step < LAST) return go(S.step + 1);
    S.done = true; save(); A.dir = 'fwd'; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // "Write it for me": the draft types itself in
  function typeAbout(textValue) {
    const ta = document.getElementById('ob-bio'); if (!ta) return;
    const box = ta.closest('.ob-about'), count = root.querySelector('[data-bio-count]');
    const show = v => { ta.value = v; S.d.bio = v; fitBio(); if (count) { count.textContent = v.length < 60 ? `${v.length}/60 min` : `${v.length}/600`; count.classList.toggle('is-ok', v.trim().length >= 60); } };
    delete errors.bio; box.classList.remove('has-error'); const m = box.querySelector('.ob-err'); if (m) m.remove();
    if (calm.matches) { show(textValue); save(); refreshPreview(); return; }
    box.classList.add('is-typing');
    let i = 0; const stepBy = Math.max(2, Math.ceil(textValue.length / 45));
    const tick = () => {
      i = Math.min(textValue.length, i + stepBy); show(textValue.slice(0, i));
      if (i < textValue.length) requestAnimationFrame(tick);
      else { box.classList.remove('is-typing'); save(); flashSaved(); refreshPreview(); ta.focus(); ta.setSelectionRange(i, i); }
    };
    tick();
  }

  function setPhoto(f) {
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const size = 240, c = document.createElement('canvas'), k = Math.max(size / img.width, size / img.height);
      c.width = c.height = size;
      const w = img.width * k, h = img.height * k;
      c.getContext('2d').drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      S.d.photo = c.toDataURL('image/jpeg', .82); URL.revokeObjectURL(url); commit('.ob-avatar-up');
    };
    img.src = url;
  }
  // a short upload bar, then the file row with its check
  function setDoc(id, f) {
    const kb = f.size / 1024;
    S.docs[id] = { name: f.name, size: kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB' };
    delete errors['doc_' + id];
    if (calm.matches) return commit(`[data-docid="${id}"]`);
    A.uploading[id] = true; save(); render();
    setTimeout(() => { delete A.uploading[id]; commit(`[data-docid="${id}"]`); }, 900);
  }

  /* ---------- events ---------- */
  root.addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return;
    S.d[k] = e.target.value;
    if (errors[k]) { delete errors[k]; const f = e.target.closest('.ob-field'); if (f) { f.classList.remove('has-error'); const m = f.querySelector('.ob-err'); if (m) m.remove(); } }
    save(); flashSaved(); refreshPreview();
    if (k === 'bio') fitBio();
    if (k === 'bio') { const c = root.querySelector('[data-bio-count]'), v = e.target.value; if (c) { c.textContent = v.length < 60 ? `${v.length}/60 min` : `${v.length}/600`; c.classList.toggle('is-ok', v.trim().length >= 60); } }
    if (k === 'display') { const ini = root.querySelector('.ob-avatar-ini'); if (ini) ini.textContent = initials(e.target.value || S.name) || '?'; }
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('select[data-k]')) { S.d[t.dataset.k] = t.value; delete errors[t.dataset.k]; commit(); return; }
    if (t.matches('[data-country]')) {
      // a new country changes the ID, licences and cities: start those parts again
      S.country = t.value; Object.assign(S.d, { city: '', areas: [], auth: '', orn: '', licence: '' }); A.otherCity = false; A.areasOpen = false;
      errors = {}; commit(); return;
    }
    if (t.matches('#ob-city')) { setCity(t.value); return; }
    if (t.matches('[data-langinput]')) { if (LANGS.some(l => l.toLowerCase() === t.value.trim().toLowerCase())) addLang(t.value); return; }
    if (t.matches('[data-agree]')) { S.agree = t.checked; delete errors.agree; const l = t.closest('.ob-check'); l.classList.remove('has-error'); const m = l.nextElementSibling; if (m && m.matches('.ob-err')) m.remove(); save(); flashSaved(); refreshPreview(); const fill = root.querySelector('.ob-seg li.is-now [data-w]'); if (fill) fill.style.width = Math.round(fillOf(S.step) * 100) + '%'; return; }
    if (t.matches('[data-doc]') && t.files[0]) setDoc(t.dataset.doc, t.files[0]);
    if (t.matches('[data-photo]') && t.files[0]) setPhoto(t.files[0]);
  });
  root.addEventListener('toggle', e => { if (e.target.matches('.ob-more')) A.optOpen = e.target.open; }, true);
  const MAX_AREAS = 8;
  function setCity(v) { v = String(v).trim(); if (v !== S.d.city) { Object.assign(S.d, { city: v, areas: [] }); A.areasOpen = false; } delete errors.city; commit(); }
  function addArea(v) {
    v = String(v).trim().replace(/\s+/g, ' '); if (!v) return;
    const cur = S.d.areas || [];
    if (cur.some(a => a.toLowerCase() === v.toLowerCase())) return;
    if (cur.length >= MAX_AREAS) { toast(`Up to ${MAX_AREAS} areas — or leave them empty to cover the whole city`); return; }
    S.d.areas = [...cur, v]; delete errors.areas; commit();
    const i = document.getElementById('ob-area'); if (i) i.focus({ preventScroll: true });
  }
  // drag a file onto a document
  root.addEventListener('dragover', e => { const d = e.target.closest('.ob-doc, .ob-avatar-up'); if (!d) return; e.preventDefault(); d.classList.add('is-drag'); });
  root.addEventListener('dragleave', e => { const d = e.target.closest('.ob-doc, .ob-avatar-up'); if (d && !d.contains(e.relatedTarget)) d.classList.remove('is-drag'); });
  root.addEventListener('drop', e => {
    const d = e.target.closest('.ob-doc, .ob-avatar-up'); if (!d) return; e.preventDefault(); const f = e.dataTransfer.files[0]; if (!f) return;
    if (d.matches('.ob-avatar-up')) setPhoto(f); else setDoc(d.dataset.docid, f);
  });
  root.addEventListener('keydown', e => {
    const i = e.target.closest('[data-areainput]');
    if (i) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addArea(i.value); }
      else if (e.key === 'Backspace' && !i.value && (S.d.areas || []).length) { S.d.areas = S.d.areas.slice(0, -1); commit(); document.getElementById('ob-area').focus(); }
      return;
    }
    if (e.target.matches('[data-langinput]')) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLang(e.target.value); }
      else if (e.key === 'Backspace' && !e.target.value && (S.d.langs || []).length) { S.d.langs = S.d.langs.slice(0, -1); commit(); const i = document.getElementById('ob-lang'); if (i) i.focus(); }
      return;
    }
    if (e.key === 'Enter' && e.target.id === 'ob-city') { e.preventDefault(); setCity(e.target.value); return; }
    // Enter in a field: continue
    if (e.key === 'Enter' && !e.defaultPrevented && e.target.tagName === 'INPUT' && !e.target.matches('#ob-city, [type=checkbox]')) { e.preventDefault(); next(); }
  });
  root.addEventListener('animationend', e => { if (e.target.classList) e.target.classList.remove('is-pop', 'is-bump', 'is-shake'); });
  function signIn() { auth.open({ intent: 'provider', onDone: () => { A.dir = 'fwd'; render(); } }); }
  // signed out: the form behind the modal only reopens sign-in
  root.addEventListener('click', e => { if (!auth.user()) { e.preventDefault(); e.stopPropagation(); signIn(); } }, true);
  root.addEventListener('click', e => {
    const b = sel => e.target.closest(sel);
    let x;
    if ((x = b('[data-act]'))) {
      const a = x.dataset.act;
      if (a === 'next') next();
      else if (a === 'back') go(S.step - 1);
      else if (a === 'preview') { previewOpen = !previewOpen; render(); }
      else if (a === 'signin') signIn();
      else if (a === 'starter') typeAbout(aboutStarter());
      else if (a === 'othercity') { A.otherCity = true; if (Object.keys(M().cities).includes(S.d.city)) { S.d.city = ''; S.d.areas = []; } commit('[data-act="othercity"]'); const c = document.getElementById('ob-city'); if (c) c.focus(); }
      else if (a === 'areas') { A.areasOpen = true; render(); const i = document.getElementById('ob-area'); if (i) i.focus({ preventScroll: true }); }
      else if (a === 'rmphoto') { delete S.d.photo; commit(); }
      else if (a === 'first') toast('The listing editor opens once your profile is approved');
      else if (a === 'restart') { try { localStorage.removeItem(KEY); } catch (er) {} S = fresh(); errors = {}; A.seen.clear(); A.dir = 'fwd'; render(); }
      return;
    }
    if ((x = b('[data-goto]'))) return go(+x.dataset.goto);
    if ((x = b('[data-city]'))) { A.otherCity = false; return setCity(x.dataset.city); }
    if ((x = b('[data-addarea]'))) return addArea(x.dataset.addarea);
    if ((x = b('[data-rmarea]'))) { S.d.areas = S.d.areas.filter(a => a !== x.dataset.rmarea); commit(); return; }
    if ((x = b('[data-vert]'))) {
      const v = x.dataset.vert;
      if (S.v !== v) { S.v = v; S.role = rolesOf(v).length === 1 ? rolesOf(v)[0][0] : ''; S.cats = []; [...A.seen].forEach(k => k.startsWith('1:') && k !== '1:what' && k !== '1:list' && A.seen.delete(k)); }
      delete errors.role; commit(`[data-vert="${v}"]`); return;
    }
    if ((x = b('[data-role]'))) { S.role = x.dataset.role; delete errors.role; commit(`[data-role="${S.role}"]`); return; }
    if ((x = b('[data-cat]'))) { const c = x.dataset.cat; S.cats = S.cats.includes(c) ? S.cats.filter(y => y !== c) : [...S.cats, c]; delete errors.cats; commit(`[data-cat="${c}"]`); return; }
    if ((x = b('[data-addlang]'))) return addLang(x.dataset.addlang);
    if ((x = b('[data-rmlang]'))) { S.d.langs = (S.d.langs || []).filter(l => l !== x.dataset.rmlang); commit(); return; }
    if ((x = b('[data-ch]'))) { const c = x.dataset.ch; S.channels = S.channels.includes(c) ? S.channels.filter(y => y !== c) : [...S.channels, c]; delete errors.channels; commit(`[data-ch="${c}"]`); return; }
    if ((x = b('[data-hours]'))) { S.hours = x.dataset.hours; commit(`[data-hours="${S.hours}"]`); }
  });

  document.addEventListener('upnow:auth', () => render());
  render();
  if (!auth.user()) signIn();
})();
