/* Provider onboarding (pages/join.html): account → business type → details → verification → submitted.
   One flow for every vertical and every country: the provider picks their country first, and the phone format,
   national sign-in, ID document and licences come from that market (data/markets.js). */
(function () {
  const { VERTICALS, LISTINGS } = UP;
  const { ico, esc, toast, initials } = UPUI;
  const KEY = 'upnow.join';

  /* ---------- provider types per vertical ---------- */
  const ROLES = {
    spaces: [
      ['agent', 'Real estate agent', 'I work at a licensed agency or brokerage', 'user'],
      ['agency', 'Agency / brokerage', 'Register the company, then invite your agents', 'building'],
      ['owner', 'Private owner / landlord', 'I own the property I want to list', 'key'],
      ['holiday', 'Holiday home operator', 'Licensed short-stay rentals', 'sun'],
      ['operator', 'Venue, court or yacht operator', 'Events, sports and charters', 'party']
    ],
    insurance: [['business', 'Insurer or broker', 'Licensed insurance company or broker', 'shield']],
    default: [
      ['business', 'Licensed business', 'Clinic, salon, company, school, operator…', 'brief'],
      ['freelancer', 'Freelancer / individual', 'Self-employed, working on my own', 'user']
    ]
  };
  const rolesOf = v => ROLES[v] || ROLES.default;
  const roleOf = s => rolesOf(s.v).find(r => r[0] === s.role);
  // categories each Spaces role can list
  const ROLE_CATS = { agent: ['residential', 'commercial', 'industrial', 'land', 'mixed'], agency: ['residential', 'commercial', 'industrial', 'land', 'mixed', 'holiday'], owner: ['residential', 'commercial', 'industrial', 'land', 'holiday'], holiday: ['holiday'], operator: ['venue', 'court', 'yacht'] };
  const catsFor = s => VERTICALS[s.v].offers.filter(o => s.v !== 'spaces' || !ROLE_CATS[s.role] || ROLE_CATS[s.role].includes(o.id));

  /* ---------- market (country) rules: data/markets.js ---------- */
  const M = () => MARKETS.market(S.country);
  const country = () => MARKETS.byIso(S.country) || MARKETS.byIso(MARKETS.DEFAULT);
  const digits = p => String(p).replace(/\D/g, '');
  const fmtPhone = p => { p = digits(p); const out = []; let i = 0; for (const g of M().phone.groups) { if (i >= p.length) break; out.push(p.slice(i, i + g)); i += g; } if (i < p.length) out.push(p.slice(i)); return out.join(' '); };
  const phoneOk = p => new RegExp(M().phone.pattern).test(digits(p));
  // "Real estate agent licence" → "real estate agent licence"; acronyms (RERA, REGA…) stay as they are
  const lc = t => /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
  const phoneErr = () => `Enter a ${country().name} mobile number${/\d/.test(M().phone.example) ? ', e.g. ' + M().phone.example : ''}`;

  /* ---------- documents asked for, by provider type (and vertical for businesses) ---------- */
  const SECTOR = { services: 'health', experiences: 'tour', programs: 'education', insurance: 'insurance' };
  function docsFor(s) {
    const L = M().licences;
    const doc = (id, key) => L[key] ? [id, ...L[key]] : null;
    const idDoc = who => ['eid', M().idDoc, who, true];
    return (({
      agent: [idDoc('Front and back · the account holder'), doc('brn', 'agentCard')],
      agency: [doc('tl', 'company'), doc('orn', 'office'), idDoc('Manager or authorised signatory')],
      owner: [idDoc('Front and back · the account holder'), doc('deed', 'ownership')],
      holiday: [doc('tl', 'company'), doc('dtcmh', 'shortStay'), idDoc('Owner or manager')],
      operator: [doc('tl', 'company'), idDoc('Owner or manager')],
      business: [doc('tl', 'company'), SECTOR[s.v] ? doc('sector', SECTOR[s.v]) : null, idDoc('Owner or manager')],
      freelancer: [idDoc('Front and back · the account holder'), doc('fp', 'freelance')]
    })[s.role] || [idDoc('Front and back · the account holder')]).filter(Boolean);
  }

  /* ---------- reference data ---------- */
  const LANGS = ['English', 'Arabic', 'Hindi', 'Urdu', 'Malayalam', 'Tagalog', 'Russian', 'French', 'Persian', 'Chinese', 'Spanish', 'German'];
  const AGENCIES = [...new Set(LISTINGS.filter(l => !/^Private/.test(l.provider.org) && l.v === 'spaces').map(l => l.provider.org))].sort();
  const HOURS = [['9-18', '9 AM – 6 PM'], ['9-22', '9 AM – 10 PM'], ['24', '24/7'], ['custom', 'Custom']];
  const CHANNELS = [['wa', 'WhatsApp', 'wa'], ['call', 'Phone call', 'phone'], ['email', 'Email', 'msg'], ['sms', 'SMS', 'msg']];
  const STEPS = [['Account', 'user'], ['Your business', 'brief'], ['Details', 'doc'], ['Verification', 'shield']];

  /* ---------- state (draft kept in this browser) ---------- */
  const fresh = () => ({ step: 1, country: MARKETS.DEFAULT, name: '', phone: '', email: '', otpSent: false, otp: '', verified: false, natSignIn: false, v: 'spaces', role: '', cats: [], d: { langs: ['English'], city: '', areas: [], wholeCity: false }, docs: {}, channels: ['wa', 'call'], hours: '9-22', agree: false, done: false });
  let S = fresh();
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && !saved.done) S = Object.assign(fresh(), saved, { docs: {} }); } catch (e) {}
  // drafts from before markets: area ids → names, Dubai as the city
  if ((S.d.areas || []).some(a => UP.areaById[a])) { S.d.areas = S.d.areas.map(a => UP.areaById[a] ? UP.areaById[a].n : a); S.d.city = S.d.city || 'Dubai'; }
  if (S.uaepass) { S.natSignIn = true; delete S.uaepass; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ ...S, docs: {} })); } catch (e) {} };
  let errors = {};

  /* ---------- small builders ---------- */
  const err = k => errors[k] ? `<span class="ob-err">${ico('x')}${esc(errors[k])}</span>` : '';
  const field = (k, label, input, hint = '') => `<div class="field ob-field ${errors[k] ? 'has-error' : ''}" data-f="${k}"><label for="ob-${k}">${esc(label)}</label>${input}${hint && !errors[k] ? `<small class="ob-hint">${esc(hint)}</small>` : ''}${err(k)}</div>`;
  const text = (k, label, ph = '', hint = '', attrs = '') => field(k, label, `<input id="ob-${k}" data-k="${k}" value="${esc(val(k) || '')}" placeholder="${esc(ph)}" ${attrs}>`, hint);
  const select = (k, label, opts, ph = 'Select…', hint = '') => field(k, label, `<span class="ob-select"><select id="ob-${k}" data-k="${k}"><option value="">${esc(ph)}</option>${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(val(k)) === String(v) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>${ico('chev')}</span>`, hint);
  const chips = (k, label, opts, max, hint = '') => field(k, label, `<div class="ob-chips">${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; const on = (val(k) || []).includes(v); return `<button type="button" class="chip ${on ? 'is-active' : ''}" data-chip="${k}" data-v="${esc(v)}" data-max="${max || ''}">${on ? ico('check') : ''}${esc(t)}</button>`; }).join('')}</div>`, hint);
  // top-level fields live on S, business details on S.d
  const TOP = ['name', 'phone', 'email', 'otp'];
  const val = k => TOP.includes(k) ? S[k] : S.d[k];
  const setVal = (k, v) => { if (TOP.includes(k)) S[k] = v; else S.d[k] = v; };

  /* ---------- steps ---------- */
  function stepAccount() {
    const m = M(), c = country(), si = m.signIn;
    return `<h1 class="ob-h1">Create your provider account</h1><p class="ob-sub">Free to join. Customers contact you directly by call, WhatsApp or email — ${esc(SITE.name)} never takes a commission.</p>
      ${field('country', 'Where do you work?', `<span class="ob-select"><select id="ob-country" data-country>${MARKETS.COUNTRIES.map(x => `<option value="${x.iso}" ${x.iso === S.country ? 'selected' : ''}>${x.flag} ${esc(x.name)}</option>`).join('')}</select>${ico('chev')}</span>`, 'Sets your phone format, the ID we check and the licences we ask for')}
      ${si ? `<button type="button" class="ob-uaepass ${S.natSignIn ? 'is-done' : ''}" data-act="natsignin">${S.natSignIn ? `${ico('check')}Signed in with ${esc(si.label)}` : `<b>${esc(si.badge)}</b> Continue with ${esc(si.label)}`}</button>
      <div class="or-divider"><span>or sign up with your mobile</span></div>` : ''}
      ${text('name', 'Full name', 'As on your ' + m.idDoc, '', 'autocomplete="name"')}
      ${field('phone', 'Mobile number', `<div class="ob-phone"><span>${c.flag} ${c.dial}</span><input id="ob-phone" data-k="phone" value="${esc(S.phone)}" placeholder="${esc(m.phone.example)}" inputmode="tel" autocomplete="tel-national" ${S.verified ? 'disabled' : ''}>
        ${S.verified ? `<em class="ob-verified">${ico('check')}Verified</em>` : `<button type="button" class="btn btn-outline btn-sm" data-act="otp">${S.otpSent ? 'Resend' : 'Send code'}</button>`}</div>`, S.verified ? '' : 'We send a 6-digit code by WhatsApp. Leads reach you on this number.')}
      ${S.otpSent && !S.verified ? field('otp', 'Verification code', `<div class="ob-phone"><input id="ob-otp" data-k="otp" value="${esc(S.otp)}" placeholder="6-digit code" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><button type="button" class="btn btn-primary btn-sm" data-act="verify">Verify</button></div>`, `Sent to ${c.dial} ${fmtPhone(S.phone)} — any 6 digits work in this demo`) : ''}
      ${text('email', 'Work email', m.emailExample, 'For lead summaries and account notices', 'type="email" autocomplete="email"')}`;
  }

  function stepBusiness() {
    const cats = catsFor(S);
    return `<h1 class="ob-h1">What do you offer on UpNow?</h1><p class="ob-sub">This decides your profile, the details we ask for and the documents we verify.</p>
      <div class="ob-label">Category</div>
      <div class="ob-verticals">${UP.VORDER.map(v => `<button type="button" class="${S.v === v ? 'is-active' : ''}" data-vert="${v}">${ico(VERTICALS[v].icon)}<span>${esc(VERTICALS[v].label)}</span></button>`).join('')}</div>
      <div class="ob-label">You are a…</div>
      <div class="ob-roles ${errors.role ? 'has-error' : ''}">${rolesOf(S.v).map(([id, t, sub, icon]) => `<button type="button" class="ob-role ${S.role === id ? 'is-active' : ''}" data-role="${id}"><i>${ico(icon)}</i><span><b>${esc(t)}</b><small>${esc(sub)}</small></span><span class="ob-radio"></span></button>`).join('')}</div>${err('role')}
      ${S.role ? `<div class="ob-label">What will you list? <small>Pick all that apply</small></div>
        <div class="ob-cats ${errors.cats ? 'has-error' : ''}">${cats.map(o => `<button type="button" class="chip ${S.cats.includes(o.id) ? 'is-active' : ''}" data-cat="${o.id}">${S.cats.includes(o.id) ? ico('check') : ico(o.icon || UPF.OICO[o.id] || VERTICALS[S.v].icon)}${esc(o.label)}</button>`).join('')}</div>${err('cats')}` : ''}`;
  }

  // where the provider works: city (suggested or typed) + areas (tags with suggestions, or the whole city)
  function locationBlock() {
    const m = M(), d = S.d, cities = Object.keys(m.cities), known = m.cities[d.city] || [];
    const sugg = known.filter(a => !(d.areas || []).includes(a));
    return `<div class="ob-label">Where you work</div>
      ${field('city', 'City', `<input id="ob-city" list="ob-cities" value="${esc(d.city || '')}" placeholder="${esc(cities[0] ? 'e.g. ' + cities[0] : 'Your city')}" autocomplete="address-level2"><datalist id="ob-cities">${cities.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`,
        cities.length ? `Start typing — or pick ${cities.slice(0, 3).join(', ')}` : 'Type the city you work in')}
      ${cities.length && !d.city ? `<div class="ob-suggest">${cities.map(x => `<button type="button" class="chip" data-city="${esc(x)}">${ico('pin')}${esc(x)}</button>`).join('')}</div>` : ''}
      ${d.city ? field('areas', 'Areas you cover', `<label class="ob-toggle-row"><input type="checkbox" data-whole ${d.wholeCity ? 'checked' : ''}><span>I cover all of ${esc(d.city)}</span></label>
        ${d.wholeCity ? '' : `<div class="ob-tags">${(d.areas || []).map(a => `<span class="loc-token">${esc(a)}<button type="button" data-rmarea="${esc(a)}" aria-label="Remove ${esc(a)}">${ico('x')}</button></span>`).join('')}<input id="ob-area" data-areainput placeholder="${(d.areas || []).length ? 'Add another area' : 'Type an area or neighbourhood, then Enter'}" autocomplete="off"></div>
        ${sugg.length ? `<div class="ob-suggest"><small>Popular in ${esc(d.city)}</small>${sugg.slice(0, 12).map(a => `<button type="button" class="chip" data-addarea="${esc(a)}">${ico('plus')}${esc(a)}</button>`).join('')}</div>` : ''}`}`,
        d.wholeCity ? 'Customers anywhere in the city will see you' : 'Up to 8 areas — customers searching these areas see you first') : ''}`;
  }

  function stepDetails() {
    const r = S.role, L = M().licences, auth = L.authorities;
    const common = chips('langs', 'Languages you speak', LANGS, 6) + locationBlock();
    const issuer = auth ? select('auth', 'Issued by', auth) : text('auth', 'Issued by', 'Registry or authority');
    const body = ({
      agent: select('agency', 'Agency', [...AGENCIES, ['__other', 'My agency isn’t listed']], 'Select your agency') + (S.d.agency === '__other' ? text('agencyName', 'Agency name', 'Registered company name') : '')
        + `<div class="form-grid">${text('brn', L.agentNo, L.agentCard && L.agentCard[2] ? (L.agentNoPattern ? 'e.g. 52926' : '') : 'If you have one', L.agentCard ? 'On your ' + lc(L.agentCard[0]) : '')}${select('exp', 'Experience', ['Under 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'])}</div>` + common
        + field('bio', 'Short bio (optional)', `<textarea id="ob-bio" data-k="bio" maxlength="300" placeholder="What you specialise in, how you work…">${esc(S.d.bio || '')}</textarea>`, 'Shown on your profile · 300 characters'),
      agency: text('company', 'Company name', 'As on the ' + lc(L.company[0])) + `<div class="form-grid">${text('orn', L.officeNo, 'Registration no.')}${text('licence', L.companyNo, 'e.g. 1234567')}</div>`
        + `<div class="form-grid">${text('office', 'Office address', 'Building, street, area')}${select('team', 'Number of agents', ['1–5', '6–15', '16–50', '50+'])}</div>` + common,
      owner: select('units', 'How many properties?', ['1', '2–5', '6–20', '20+']) + common,
      holiday: text('company', 'Company name', 'As on the ' + lc(L.company[0])) + `<div class="form-grid">${text('dtcm', L.shortStay ? L.shortStay[0] + ' no.' : 'Licence no. (if any)', L.shortStay && L.shortStay[2] ? 'Required' : 'If your city requires one')}${select('units', 'Units managed', ['1–5', '6–20', '21–100', '100+'])}</div>` + common,
      operator: text('company', 'Business name', 'Club, venue or charter company') + `<div class="form-grid">${text('licence', L.companyNo, 'e.g. 1234567')}${issuer}</div>` + chips('hoursDays', 'Open on', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) + common,
      business: text('company', 'Business name', 'As on the ' + lc(L.company[0])) + `<div class="form-grid">${text('licence', L.companyNo, 'e.g. 1234567')}${issuer}</div>` + common,
      freelancer: `<div class="form-grid">${text('display', 'Name customers see', S.name || 'e.g. Sara — Home cleaning')}${text('permit', L.freelance ? L.freelance[0] + ' no.' : 'Registration no.', L.freelance && L.freelance[2] ? '' : 'If you have one')}</div>` + common
    })[r] || '';
    return `<h1 class="ob-h1">${({ agent: 'Your agent details', agency: 'Your agency', owner: 'About your properties', holiday: 'Your holiday home business', operator: 'Your business', business: 'Your business', freelancer: 'About you' })[r] || 'Details'}</h1>
      <p class="ob-sub">This builds your public profile — you can edit it any time after approval.</p>${body}`;
  }

  function stepVerify() {
    const docs = docsFor(S);
    return `<h1 class="ob-h1">Verify and choose how leads reach you</h1><p class="ob-sub">We check documents within 24 hours. They are never shown publicly — your profile only shows a “Verified by UpNow” badge.</p>
      <div class="ob-label">Documents</div>
      <div class="ob-docs">${docs.map(([id, t, hint, req]) => { const f = S.docs[id]; return `<label class="ob-doc ${f ? 'is-done' : ''} ${errors['doc_' + id] ? 'has-error' : ''}"><input type="file" accept="image/*,.pdf" data-doc="${id}" hidden>
        <i>${ico(f ? 'check' : 'doc')}</i><span><b>${esc(t)}${req ? '' : ' <em>optional</em>'}</b><small>${f ? `${esc(f.name)} · ${f.size}` : esc(hint)}</small></span><span class="btn btn-outline btn-sm">${f ? 'Replace' : `${ico('plus')}Upload`}</span></label>`; }).join('')}</div>
      ${Object.keys(errors).some(k => k.startsWith('doc_')) ? `<span class="ob-err">${ico('x')}Upload the required documents to submit</span>` : ''}
      <div class="ob-label">How customers can reach you</div>
      <div class="ob-channels">${CHANNELS.map(([id, t, i]) => `<button type="button" class="chip ${S.channels.includes(id) ? 'is-active' : ''}" data-ch="${id}">${ico(i)}${t}</button>`).join('')}</div>${err('channels')}
      <div class="ob-label">When you reply</div>
      <div class="choice-buttons">${HOURS.map(([id, t]) => `<button type="button" class="${S.hours === id ? 'is-active' : ''}" data-hours="${id}">${t}</button>`).join('')}</div>
      <label class="ob-check ${errors.agree ? 'has-error' : ''}"><input type="checkbox" data-agree ${S.agree ? 'checked' : ''}><span>I confirm the details are correct and agree to the <a class="text-link" href="#" onclick="return false">Provider terms</a>. I will only list ${S.v === 'spaces' ? 'properties I am permitted to advertise' : 'services I am licensed to provide'}.</span></label>${err('agree')}`;
  }

  function stepDone() {
    const r = roleOf(S);
    return `<div class="ob-done"><span class="ob-done-ic">${ico('check')}</span><h1 class="ob-h1">Application submitted</h1>
      <p class="ob-sub">Thanks, ${esc(S.name.split(' ')[0] || 'there')}. We’re checking your documents — you’ll get a WhatsApp message on ${country().dial} ${esc(fmtPhone(S.phone))} as soon as your profile is live.</p>
      <ol class="ob-timeline"><li class="is-done"><i>${ico('check')}</i><span><b>Account created</b><small>${esc(r ? r[1] : '')} · ${esc(VERTICALS[S.v].label)}</small></span></li>
        <li class="is-now"><i>2</i><span><b>Documents under review</b><small>Usually within 24 hours</small></span></li>
        <li><i>3</i><span><b>Profile goes live</b><small>With your “Verified by UpNow” badge</small></span></li>
        <li><i>4</i><span><b>Add your first ${S.v === 'spaces' ? 'listing' : 'service'}</b><small>Leads start arriving by ${esc(S.channels.map(c => CHANNELS.find(x => x[0] === c)[1]).join(', '))}</small></span></li></ol>
      <div class="ob-done-cta"><button class="btn btn-primary" data-act="first">${ico('plus')}Prepare your first ${S.v === 'spaces' ? 'listing' : 'service'}</button><a class="btn btn-outline" href="${PATHS.href.home}">Back to UpNow</a></div>
      <button class="text-link" data-act="restart">Start a new application</button></div>`;
  }

  /* ---------- live profile preview (right column) ---------- */
  // same markup + styles as the agent card on the listing page (DM.agentCard), filled from the form
  function preview() {
    const r = roleOf(S), d = S.d, biz = ['agency', 'holiday', 'operator', 'business'].includes(S.role);
    const shown = (S.role === 'freelancer' && d.display) || (biz && d.company) || S.name || 'Your name';
    const agency = S.role === 'agent' ? (d.agency === '__other' ? d.agencyName : d.agency) : '';
    const org = S.role === 'agent' ? (agency || 'Your agency') : S.role === 'owner' ? 'Private owner' : r ? r[1] : 'Pick your provider type';
    const hue = [...shown].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 140);
    const NATIVE = (window.DM && DM.NATIVE) || {};
    const langs = (d.langs || []).map(x => NATIVE[x] || x);
    const hours = (HOURS.find(h => h[0] === S.hours) || HOURS[1])[1];
    const has = c => S.channels.includes(c);
    const docs = docsFor(S), up = docs.filter(x => S.docs[x[0]]).length;
    const footName = S.role === 'agent' ? (agency || 'Your agency') : biz ? (d.company || 'Your business') : shown;
    const footSub = ({ agent: 'Real estate broker L.L.C', agency: 'Real estate broker L.L.C', owner: 'Title deed verified', holiday: 'Holiday home operator · DTCM', operator: 'Licensed operator', business: r ? r[1] : '', freelancer: 'Freelance permit' })[S.role] || '';
    const allLabel = S.v === 'spaces' ? (S.cats.length && S.cats.every(c => ['venue', 'court', 'yacht'].includes(c)) ? 'View all listings' : 'View all properties') : 'View all services';
    const action = (c, icon, t, sub) => `<span class="agent-action">${ico(icon)}<span><b>${t}</b><small>${sub}</small></span>${ico('chevR', 'chevron')}</span>`;
    const alt = (cls, icon, t, sub) => `<span class="agent-alt-action ${cls}">${icon}<span><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span>${ico('chevR', 'chevron')}</span>`;
    const main = [has('call') && action('call', 'phone', 'Call', 'Direct call'), has('wa') && action('wa', 'wa', 'WhatsApp', 'Chat instantly')].filter(Boolean);
    const alts = [has('sms') && alt('is-sms', ico('msg'), 'SMS'), has('email') && alt('is-email', '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>', 'Email'),
      alt('is-chat', '<svg class="icon" viewBox="0 0 24 24"><path d="M12 4c4.97 0 9 3.36 9 7.5S16.97 19 12 19c-1.1 0-2.15-.16-3.12-.46L4 20l1.4-3.6C4.5 15.1 3 13.4 3 11.5 3 7.36 7.03 4 12 4z"/></svg>', 'Chat')].filter(Boolean);
    return `<div class="ob-preview"><div class="ob-preview-h">${ico('eye')}How customers will see you</div>
      <div class="agent-card ob-agent-card" aria-hidden="true">
        <div class="agent-cover"><svg viewBox="0 0 400 46" preserveAspectRatio="none"><path d="M0 46 L0 30 C90 2 170 4 250 22 C320 38 370 30 400 16 L400 46Z" fill="#fff"/></svg></div>
        <div class="agent-top">
          <div class="agent-avatar" style="--hue:${hue}${biz ? ';border-radius:24px' : ''}">${esc(initials(shown) || '?')}<span class="agent-online"></span></div>
          <div class="agent-info"><div class="agent-name"><span>${esc(shown)}</span>${S.done ? `<span class="agent-verified">${ico('badge')}</span>` : ''}</div>
            <div class="agent-org">${esc(org)}${S.role === 'agent' && d.brn ? ' • BRN ' + esc(d.brn) : ''}</div></div>
        </div>
        <div class="agent-stats">
          <div><div class="stat-head"><svg class="icon is-star" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg><span class="stat-value">New</span></div><div class="stat-sub">No ratings yet</div></div>
          <div><div class="stat-head">${ico('clock')}Replies</div><div class="stat-sub"><b>${esc(hours)}</b></div></div>
          <div><div class="stat-head">${ico('globe')}<span>${esc(langs.slice(0, 2).join(' • ') || '—')}</span></div><div class="stat-langs">${langs.length > 2 ? esc(langs.slice(2).join(' • ')) : '0 active listings'}</div></div>
        </div>
        <div class="agent-body">
          ${main.length ? `<div class="agent-actions">${main.join('')}</div>` : ''}
          ${alts.length ? `<div class="agent-more">${main.length ? 'More ways to contact' : 'Contact'}</div><div class="agent-alt-actions">${alts.join('')}</div>` : ''}
        </div>
        <div class="agent-footer"><span class="agent-logo">${ico(S.v === 'spaces' ? 'office' : 'shop')}</span><span class="agent-agency"><b>${esc(footName)}</b><small>${esc(footSub)}</small></span><span class="agent-view-all">${allLabel}${ico('chevR')}</span></div>
      </div>
      <div class="ob-card-status ${S.done ? 'is-review' : ''}">${ico('shield')}${S.done ? 'Verification in progress — your “Verified by UpNow” badge appears once approved' : `Verification · ${up}/${docs.length} documents uploaded`}</div>
      <ul class="ob-why"><li>${ico('bolt')}<span><b>Leads in minutes</b>Customers call or WhatsApp you directly — no middleman.</span></li>
        <li>${ico('tag')}<span><b>No commission</b>Free to list. You agree prices and payments with the customer.</span></li>
        <li>${ico('shield')}<span><b>Verified badge</b>Profiles with checked documents get up to 3× more enquiries.</span></li></ul></div>`;
  }

  /* ---------- validation ---------- */
  function validate(step) {
    const e = {}, d = S.d;
    if (step === 1) {
      if (S.name.trim().split(/\s+/).length < 2) e.name = 'Enter your first and last name';
      if (!phoneOk(S.phone)) e.phone = phoneErr();
      else if (!S.verified) e.phone = 'Verify your number with the code we send';
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(S.email.trim())) e.email = 'Enter a valid email address';
    }
    if (step === 2) { if (!S.role) e.role = 'Choose what describes you best'; else if (!S.cats.length) e.cats = 'Pick at least one category'; }
    if (step === 3) {
      const L = M().licences, req = key => L[key] && L[key][2];
      const need = ({ agent: ['agency', 'exp', req('agentCard') && 'brn'], agency: ['company', 'orn', 'licence', 'office'], owner: ['units'], holiday: ['company', 'units', req('shortStay') && 'dtcm'], operator: ['company', 'licence', 'auth'], business: ['company', 'licence', 'auth'], freelancer: ['display', req('freelance') && 'permit'] }[S.role] || []).filter(Boolean);
      need.forEach(k => { if (!String(d[k] || '').trim()) e[k] = 'Required'; });
      if (S.role === 'agent' && d.agency === '__other' && !String(d.agencyName || '').trim()) e.agencyName = 'Required';
      if (d.brn && L.agentNoPattern && !new RegExp(L.agentNoPattern).test(d.brn)) e.brn = `Check your ${L.agentNo}`;
      if (!(d.langs || []).length) e.langs = 'Pick at least one language';
      if (!String(d.city || '').trim()) e.city = 'Enter the city you work in';
      else if (!d.wholeCity && !(d.areas || []).length) e.areas = 'Add at least one area, or choose the whole city';
    }
    if (step === 4) {
      docsFor(S).forEach(([id, , , req]) => { if (req && !S.docs[id]) e['doc_' + id] = 'Required'; });
      if (!S.channels.length) e.channels = 'Choose at least one way to be contacted';
      if (!S.agree) e.agree = 'Please confirm to submit';
    }
    return e;
  }

  /* ---------- render ---------- */
  const root = document.getElementById('ob');
  function render() {
    const body = S.done ? stepDone() : [stepAccount, stepBusiness, stepDetails, stepVerify][S.step - 1]();
    root.innerHTML = `<div class="ob-grid"><main class="ob-main">
      ${S.done ? '' : `<ol class="ob-steps">${STEPS.map(([t, i], k) => `<li class="${S.step === k + 1 ? 'is-now' : S.step > k + 1 ? 'is-done' : ''}">${S.step > k + 1 ? `<button type="button" data-goto="${k + 1}">` : '<span>'}<i>${S.step > k + 1 ? ico('check') : k + 1}</i><b>${t}</b>${S.step > k + 1 ? '</button>' : '</span>'}</li>`).join('')}</ol>`}
      <div class="ob-panel">${body}
        ${S.done ? '' : `<div class="ob-nav">${S.step > 1 ? `<button type="button" class="btn btn-outline" data-act="back">${ico('chevL')}Back</button>` : '<span></span>'}
          <span class="ob-save">${ico('check')}Draft saved</span>
          <button type="button" class="btn btn-primary" data-act="next">${S.step === 4 ? 'Submit for verification' : 'Continue'}${ico(S.step === 4 ? 'check' : 'chevR')}</button></div>`}</div></main>
      <aside class="ob-aside">${preview()}</aside></div>`;
  }
  const refreshPreview = () => { const a = root.querySelector('.ob-aside'); if (a) a.innerHTML = preview(); };

  function go(step) {
    S.step = step; errors = {}; save(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function next() {
    errors = validate(S.step);
    if (Object.keys(errors).length) { render(); const f = root.querySelector('.has-error'); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    if (S.step < 4) return go(S.step + 1);
    S.done = true; save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- events ---------- */
  root.addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return;
    setVal(k, e.target.value);
    if (errors[k]) { delete errors[k]; const f = e.target.closest('.ob-field'); if (f) { f.classList.remove('has-error'); const m = f.querySelector('.ob-err'); if (m) m.remove(); } }
    save(); refreshPreview();
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('select[data-k]')) { setVal(t.dataset.k, t.value); delete errors[t.dataset.k]; save(); render(); return; }
    if (t.matches('[data-country]')) {
      // a new country changes the phone format, ID and licences: start those parts again
      S.country = t.value; Object.assign(S, { phone: '', otp: '', otpSent: false, verified: false, natSignIn: false }); Object.assign(S.d, { city: '', areas: [], wholeCity: false, brn: '', auth: '' });
      errors = {}; save(); render(); return;
    }
    if (t.matches('#ob-city')) { setCity(t.value); return; }
    if (t.matches('[data-whole]')) { S.d.wholeCity = t.checked; delete errors.areas; save(); render(); return; }
    if (t.matches('[data-agree]')) { S.agree = t.checked; delete errors.agree; save(); return; }
    if (t.matches('[data-doc]') && t.files[0]) {
      const f = t.files[0], kb = f.size / 1024;
      S.docs[t.dataset.doc] = { name: f.name, size: kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB' };
      delete errors['doc_' + t.dataset.doc]; render();
    }
  });
  const MAX_AREAS = 8;
  function setCity(v) { v = String(v).trim(); if (v !== S.d.city) Object.assign(S.d, { city: v, areas: [], wholeCity: false }); delete errors.city; save(); render(); }
  function addArea(v) {
    v = String(v).trim().replace(/\s+/g, ' '); if (!v) return;
    const cur = S.d.areas || [];
    if (cur.some(a => a.toLowerCase() === v.toLowerCase())) return;
    if (cur.length >= MAX_AREAS) { toast(`Up to ${MAX_AREAS} areas — or choose the whole city`); return; }
    S.d.areas = [...cur, v]; delete errors.areas; save(); render();
    const i = document.getElementById('ob-area'); if (i) i.focus();
  }
  root.addEventListener('keydown', e => {
    const i = e.target.closest('[data-areainput]'); if (!i) return;
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addArea(i.value); }
    else if (e.key === 'Backspace' && !i.value && (S.d.areas || []).length) { S.d.areas = S.d.areas.slice(0, -1); save(); render(); document.getElementById('ob-area').focus(); }
  });
  root.addEventListener('click', e => {
    const t = e.target, b = sel => t.closest(sel);
    let x;
    if ((x = b('[data-act]'))) {
      const a = x.dataset.act;
      if (a === 'next') next();
      else if (a === 'back') go(S.step - 1);
      else if (a === 'otp') { if (!phoneOk(S.phone)) { errors.phone = phoneErr(); render(); return; } S.otpSent = true; delete errors.phone; save(); render(); toast('Code sent by WhatsApp'); const o = document.getElementById('ob-otp'); if (o) o.focus(); }
      else if (a === 'verify') { if (!/^\d{6}$/.test(S.otp)) { errors.otp = 'Enter the 6-digit code'; render(); return; } S.verified = true; delete errors.otp; delete errors.phone; save(); render(); toast('Mobile number verified'); }
      else if (a === 'natsignin') { const si = M().signIn; if (si && !S.natSignIn) { S.natSignIn = true; S.verified = true; S.name = S.name || 'Ahmed Karim'; S.phone = S.phone || digits(M().phone.example); errors = {}; save(); render(); toast(`Signed in with ${si.label} — name and mobile verified`); } }
      else if (a === 'first') toast('The listing editor opens once your profile is approved');
      else if (a === 'restart') { try { localStorage.removeItem(KEY); } catch (er) {} S = fresh(); errors = {}; render(); }
      return;
    }
    if ((x = b('[data-goto]'))) return go(+x.dataset.goto);
    if ((x = b('[data-city]'))) return setCity(x.dataset.city);
    if ((x = b('[data-addarea]'))) return addArea(x.dataset.addarea);
    if ((x = b('[data-rmarea]'))) { S.d.areas = S.d.areas.filter(a => a !== x.dataset.rmarea); save(); render(); return; }
    if ((x = b('[data-vert]'))) { if (S.v !== x.dataset.vert) { S.v = x.dataset.vert; S.role = rolesOf(S.v).length === 1 ? rolesOf(S.v)[0][0] : ''; S.cats = []; } delete errors.role; save(); render(); return; }
    if ((x = b('[data-role]'))) { S.role = x.dataset.role; S.cats = S.cats.filter(c => catsFor(S).some(o => o.id === c)); if (catsFor(S).length === 1) S.cats = [catsFor(S)[0].id]; delete errors.role; save(); render(); return; }
    if ((x = b('[data-cat]'))) { const c = x.dataset.cat; S.cats = S.cats.includes(c) ? S.cats.filter(y => y !== c) : [...S.cats, c]; delete errors.cats; save(); render(); return; }
    if ((x = b('[data-chip]'))) {
      const k = x.dataset.chip, v = x.dataset.v, max = +x.dataset.max || 99, cur = S.d[k] || [];
      if (!cur.includes(v) && cur.length >= max) { toast(`Pick up to ${max}`); return; }
      S.d[k] = cur.includes(v) ? cur.filter(y => y !== v) : [...cur, v]; delete errors[k]; save(); render(); return;
    }
    if ((x = b('[data-ch]'))) { const c = x.dataset.ch; S.channels = S.channels.includes(c) ? S.channels.filter(y => y !== c) : [...S.channels, c]; delete errors.channels; save(); render(); return; }
    if ((x = b('[data-hours]'))) { S.hours = x.dataset.hours; save(); render(); }
  });

  render();
})();
