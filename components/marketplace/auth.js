/* Sign in / sign up — one modal for every entry point (header "Sign in", "Become a provider", the provider signup page).
   Log in with phone or email → 6-digit code (SMS or email). Create account: name, mobile, email → code by SMS.
   Mobile + code is the main way in; Google and Apple are the alternatives. Providers always end with a verified mobile,
   because leads reach them by call and WhatsApp.
   Prototype: the signed-in user and known accounts live in localStorage; any 6-digit code is accepted.

   UPUI.auth.user()                       → { first, last, name, dial, phone, email, via } | null
   UPUI.auth.open({ intent, next, onDone })  intent 'provider' changes the wording; next = URL to go to afterwards
   UPUI.auth.signOut()
   Links to the provider signup page open this modal first when nobody is signed in. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc, store, openModal, closeModal, toast } = U;
  const HREF = PATHS.href;

  const user = () => store.get('user');
  const accounts = () => store.get('accounts') || {};
  const keyOf = (a) => a.phone ? a.dial + a.phone : (a.email || '').toLowerCase();

  /* ---------- countries & phone formats (data/markets.js when loaded, a short list otherwise) ---------- */
  const FALLBACK = [['AE', 'United Arab Emirates', '+971', '🇦🇪'], ['SA', 'Saudi Arabia', '+966', '🇸🇦'], ['QA', 'Qatar', '+974', '🇶🇦'], ['KW', 'Kuwait', '+965', '🇰🇼'], ['BH', 'Bahrain', '+973', '🇧🇭'], ['OM', 'Oman', '+968', '🇴🇲'], ['GB', 'United Kingdom', '+44', '🇬🇧'], ['IN', 'India', '+91', '🇮🇳'], ['US', 'United States', '+1', '🇺🇸']]
    .map(([iso, name, dial, flag]) => ({ iso, name, dial, flag }));
  const COUNTRIES = window.MARKETS ? MARKETS.COUNTRIES : FALLBACK;
  const byIso = iso => COUNTRIES.find(c => c.iso === iso) || COUNTRIES.find(c => c.iso === 'AE');
  const rules = iso => window.MARKETS ? MARKETS.market(iso) : { phone: iso === 'AE' ? { example: '50 123 4567', pattern: '^5\\d{8}$', groups: [2, 3, 4] } : { example: 'Mobile number', pattern: '^\\d{6,14}$', groups: [3, 3, 4] }, signIn: iso === 'AE' ? { label: 'UAE PASS', badge: 'UAE' } : null };
  const digits = p => String(p || '').replace(/\D/g, '');
  const fmt = (iso, p) => { p = digits(p); const out = []; let i = 0; for (const g of rules(iso).phone.groups) { if (i >= p.length) break; out.push(p.slice(i, i + g)); i += g; } if (i < p.length) out.push(p.slice(i)); return out.join(' '); };
  const phoneOk = (iso, p) => new RegExp(rules(iso).phone.pattern).test(digits(p));
  const emailOk = e => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(String(e || '').trim());

  const SVG = {
    // official marks: Google "G" (brand colours), Apple logo
    google: '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
    apple: '<svg viewBox="0 0 814 1000" width="18" height="20" aria-hidden="true"><path fill="#000" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>',
    mail: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
  };

  /* ---------- illustrations (brand greens, drawn inline) ---------- */
  const ART = {
    // a phone receiving the code
    phone: `<svg viewBox="0 0 220 120" aria-hidden="true"><ellipse cx="110" cy="64" rx="86" ry="52" fill="#eef7f2"/>
      <rect x="84" y="14" width="52" height="96" rx="11" fill="#136142"/><rect x="89" y="24" width="42" height="74" rx="5" fill="#fff"/><rect x="102" y="18" width="16" height="3" rx="1.5" fill="#0b3d2a"/>
      <rect x="94" y="32" width="24" height="5" rx="2.5" fill="#d8efe3"/><rect x="94" y="41" width="32" height="5" rx="2.5" fill="#d8efe3"/>
      <g class="auth-art-bubble"><rect x="122" y="50" width="74" height="30" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="m130 78-6 8 12-6z" fill="#fff"/>
        <g fill="#136142"><circle cx="138" cy="65" r="3.5"/><circle cx="150" cy="65" r="3.5"/><circle cx="162" cy="65" r="3.5"/><circle cx="174" cy="65" r="3.5"/><circle cx="186" cy="65" r="3.5" class="auth-art-blink"/></g>
        <circle cx="194" cy="51" r="9" fill="#25946a"/><path d="M190.5 52.5l2.3 2 4-4.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g class="auth-art-lock"><rect x="30" y="58" width="30" height="24" rx="6" fill="#e0a526"/><path d="M37 58v-6a8 8 0 0 1 16 0v6" fill="none" stroke="#e0a526" stroke-width="4"/><circle cx="45" cy="70" r="3.5" fill="#fff"/></g>
      <path class="auth-art-spark" d="M64 26v8M60 30h8M180 22v6M177 25h6" stroke="#25946a" stroke-width="2" stroke-linecap="round"/></svg>`,
    // a message with the code boxes
    code: `<svg viewBox="0 0 220 110" aria-hidden="true"><ellipse cx="110" cy="58" rx="86" ry="48" fill="#eef7f2"/>
      <g class="auth-art-bubble"><rect x="46" y="22" width="128" height="62" rx="16" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="m64 82-8 14 18-12z" fill="#fff"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${60 + i * 17}" y="44" width="13" height="18" rx="4" fill="${i < 4 ? '#136142' : '#d8efe3'}" ${i === 4 ? 'class="auth-art-blink"' : ''}/>`).join('')}
        <rect x="60" y="32" width="40" height="5" rx="2.5" fill="#d8efe3"/></g>
      <circle cx="170" cy="26" r="13" fill="#14853f"/><path d="M164.5 27.5l3.5 3.2 6.5-7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    // a profile card being filled in
    finish: `<svg viewBox="0 0 220 100" aria-hidden="true"><ellipse cx="110" cy="54" rx="84" ry="44" fill="#eef7f2"/>
      <rect x="56" y="18" width="108" height="66" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2"/><circle cx="84" cy="51" r="16" fill="#25946a"/><circle cx="84" cy="46" r="6" fill="#fff"/><path d="M73 61c2.5-5 6-7 11-7s8.5 2 11 7" fill="#fff"/>
      <rect x="108" y="40" width="42" height="6" rx="3" fill="#136142"/><rect x="108" y="52" width="30" height="5" rx="2.5" fill="#d8efe3"/>
      <g class="auth-art-lock"><circle cx="160" cy="22" r="12" fill="#e0a526"/><path d="m154.5 22 3.8 3.6 7-7.4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`
  };

  /* ---------- modal state ----------
     Two linked screens, as on Bayut / Dubizzle (no tabs): "Log in" (mobile → code) with "New here? Create an account",
     and "Create account" (name, mobile, email → code) with "Already have an account? Log in". What was typed carries
     across. Safety nets: a new number on Log in goes on to "Finish signing up"; a known number on Create account just
     logs in. Google / Apple fill name and email; providers then add and verify a mobile. No modal title. */
  let A = null; // { pane: login|signup|code|finish, from, intent, next, onDone, iso, phone, email, first, last, via, useEmail, codeFor, err, sent, phoneVerified }
  function open(opts = {}) {
    const u = user();
    if (u) { done(opts, u); return; }
    // providers have one door: mobile → code; a new number then only adds an email (their name comes from their ID)
    const pane = opts.intent === 'provider' ? 'login' : opts.mode || 'login';
    A = { pane, from: pane, intent: opts.intent || '', next: opts.next || '', onDone: opts.onDone, iso: 'AE', phone: '', email: '', via: '', first: '', last: '', err: {}, sent: 0 };
    paint();
  }
  const provider = () => A.intent === 'provider';
  const emailRequired = () => provider(); // providers get approvals and lead summaries by email; customers may skip it
  // providers don't type their name: it comes from the ID they upload in onboarding (js/pages/join.js → setName)
  const askName = () => !provider();

  function paint() {
    const c = byIso(A.iso), r = rules(A.iso);
    const err = k => A.err[k] ? `<span class="auth-err">${ico('x')}${esc(A.err[k])}</span>` : '';
    const field = (k, label, attrs = '', hint = '') => `<div class="field ${A.err[k] ? 'has-error' : ''}"><label for="au-${k}">${label}</label><input id="au-${k}" data-au-k="${k}" value="${esc(A[k])}" ${attrs}>${hint ? `<small class="auth-small">${hint}</small>` : ''}</div>`;
    // one row: [flag +code ▾ | number] — the country list opens from the flag
    const phoneBox = () => `<div class="field auth-tel-f ${A.err.phone ? 'has-error' : ''}"><label for="au-phone">Mobile number</label>
        <div class="auth-tel"><label class="auth-tel-cc" title="${esc(c.name)}"><span>${c.flag} ${c.dial}</span>${ico('chev')}<select data-au-cc aria-label="Country">${COUNTRIES.map(x => `<option value="${x.iso}" ${x.iso === A.iso ? 'selected' : ''}>${x.flag} ${esc(x.name)} (${x.dial})</option>`).join('')}</select></label>
        <input id="au-phone" data-au-k="phone" value="${esc(A.phone)}" placeholder="${esc(r.phone.example)}" inputmode="tel" autocomplete="tel-national"></div></div>${err('phone')}`;
    // one compact row: Google · Apple
    const socials = () => `<div class="or-divider"><span>or continue with</span></div>
      <div class="auth-alts is-row">${[['google', 'Google'], ['apple', 'Apple']].map(([k, t]) => `<button type="button" class="auth-alt" data-au="${k}" aria-label="Continue with ${t}">${SVG[k]}<span>${t}</span></button>`).join('')}</div>`;
    const terms = `<p class="auth-fine">By continuing you agree to ${esc(SITE.name)}'s <a class="text-link" href="#" onclick="return false">Terms</a> and <a class="text-link" href="#" onclick="return false">Privacy Policy</a>.</p>`;
    let body = '';
    if (A.pane === 'login') body = `
        <div class="auth-art">${ART.phone}</div>
        <div class="auth-hello">${provider() ? `<h4>List on ${esc(SITE.name)}</h4><p>Enter your mobile number and we'll text you a code. It works whether you're new or coming back.</p>` : `<h4>Welcome back</h4><p>Log in with your mobile number or email. We'll send you a code — no password needed.</p>`}</div>
        ${A.useEmail ? `${field('email', 'Email', 'type="email" placeholder="you@example.com" autocomplete="email"')}${err('email')}` : phoneBox()}
        <button class="text-link auth-use" type="button" data-au="use">${A.useEmail ? `${ico('phone')}Use phone instead` : `${SVG.mail}Use email instead`}</button>
        <button class="btn btn-primary auth-cta" type="button" data-au="login">${provider() ? 'Continue' : 'Send code'}${ico('chevR')}</button>
        ${socials()}
        ${provider() ? terms : `<p class="auth-switch">New to ${esc(SITE.name)}? <button class="text-link" type="button" data-au="go" data-to="signup">Create an account</button></p>`}`;
    if (A.pane === 'signup') body = `
        <div class="auth-art is-xs">${ART.finish}</div>
        <div class="auth-hello"><h4>${provider() ? 'Create your provider account' : 'Create your account'}</h4><p>${provider() ? 'Just your mobile and email for now — we take your name from your ID later.' : 'Save places you like, keep track of enquiries and get faster replies.'}</p></div>
        ${askName() ? `<div class="form-grid">${field('first', 'First name', 'autocomplete="given-name"')}${field('last', 'Last name', 'autocomplete="family-name"')}</div>${err('first') || err('last')}` : ''}
        ${phoneBox()}
        ${field('email', `Email${emailRequired() ? '' : ' <small>(optional)</small>'}`, 'type="email" placeholder="you@example.com" autocomplete="email"')}${err('email')}
        <p class="auth-hint">${ico('phone')}We'll text you a 6-digit code to confirm your number.</p>
        <button class="btn btn-primary auth-cta" type="button" data-au="signup">Create account${ico('chevR')}</button>
        ${socials()}${terms}
        <p class="auth-switch">Already have an account? <button class="text-link" type="button" data-au="go" data-to="login">Log in</button></p>`;
    if (A.pane === 'code') {
      const byEmail = A.codeFor === 'email', to = byEmail ? esc(A.email) : `${c.dial} ${esc(fmt(A.iso, A.phone))}`;
      body = `<div class="auth-art is-sm">${ART.code}</div>
        <div class="auth-hello"><h4>Enter your code</h4><p>We ${byEmail ? 'emailed' : 'texted'} a 6-digit code to <b>${to}</b> · <button class="text-link" type="button" data-au="edit">Change</button></p></div>
        <div class="auth-otp ${A.err.code ? 'has-error' : ''}">${[0, 1, 2, 3, 4, 5].map(i => `<input data-otp="${i}" inputmode="numeric" maxlength="1" autocomplete="${i ? 'off' : 'one-time-code'}" aria-label="Digit ${i + 1}">`).join('')}</div>${err('code')}
        <div class="auth-code-foot"><span data-resend></span></div>
        <button class="btn btn-primary auth-cta" type="button" data-au="verify" disabled>Verify${ico('chevR')}</button>
        <p class="auth-fine">Demo: any 6 digits work.</p>`;
    }
    if (A.pane === 'finish') {
      const needPhone = !A.phoneVerified, needEmail = !A.email || A.via === 'phone', social = A.via === 'google' || A.via === 'apple';
      body = `<div class="auth-art is-sm">${ART.finish}</div>
        <div class="auth-hello"><h4>${social && A.first ? `Almost there, ${esc(A.first)}` : provider() ? 'One last thing' : 'Finish signing up'}</h4><p>${provider()
          ? `Add your ${[needEmail && 'email', needPhone && 'mobile number'].filter(Boolean).join(' and ') || 'details'} so we can send you updates on your application. We'll take your name from your ID in the next step.`
          : social ? 'Check your name and you’re in.' : `Welcome! Just your name${needEmail ? ' and email' : ''} and you’re in.`}</p></div>
        ${askName() ? `<div class="form-grid">${field('first', 'First name', 'autocomplete="given-name"')}${field('last', 'Last name', 'autocomplete="family-name"')}</div>${err('first') || err('last')}` : ''}
        ${needEmail ? `${field('email', `Email${emailRequired() ? '' : ' <small>(optional)</small>'}`, 'type="email" placeholder="you@example.com" autocomplete="email"')}${err('email')}` : `<p class="auth-known">${SVG.mail}${esc(A.email)}</p>`}
        ${needPhone ? `${phoneBox()}<p class="auth-hint">${ico('phone')}${provider() ? 'Customers will reach you on this number. ' : 'Optional. '}We'll text you a code to confirm it.</p>` : `<p class="auth-known">${ico('check')}${c.dial} ${esc(fmt(A.iso, A.phone))} · verified</p>`}
        <button class="btn btn-primary auth-cta" type="button" data-au="finish">${needPhone && provider() ? 'Continue' : 'Create account'}${ico('chevR')}</button>${terms}`;
    }
    const back = A.pane === 'code' || A.pane === 'finish' ? `<button class="auth-back" type="button" data-au="back" aria-label="Back">${ico('chevL')}</button>` : '<span></span>';
    openModal(`<div class="auth-head">${back}<button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div><div class="auth-body is-${A.pane} ${A.pane === 'login' || A.pane === 'signup' ? 'is-form' : ''}">${body}</div>`, 'auth-modal is-' + A.pane);
    const f = document.querySelector('.auth-modal [data-otp="0"]') || [...document.querySelectorAll('.auth-modal input[data-au-k]')].find(i => !i.value);
    if (f) setTimeout(() => f.focus(), 30);
    if (A.pane === 'code') tick();
  }

  // resend countdown on the code pane
  function tick() {
    clearInterval(A.timer);
    const el = () => document.querySelector('.auth-modal [data-resend]');
    const draw = () => { const left = Math.max(0, 30 - Math.round((Date.now() - A.sent) / 1000)); const e = el(); if (!e) return clearInterval(A.timer); e.innerHTML = left ? `You can resend in 0:${String(left).padStart(2, '0')}` : `Didn't get it? <button class="text-link" type="button" data-au="resend">Resend code</button>`; if (!left) clearInterval(A.timer); };
    draw(); A.timer = setInterval(draw, 1000);
  }

  /* ---------- steps ---------- */
  const phoneErr = () => `Check your number${/\d/.test(rules(A.iso).phone.example) ? ` — a ${byIso(A.iso).name} mobile looks like ${rules(A.iso).phone.example}` : ''}`;
  function sendCode(to = 'phone') { A.err = {}; A.codeFor = to; A.sent = Date.now(); A.pane = 'code'; paint(); }
  function submitLogin() {
    A.from = 'login';
    if (A.useEmail) {
      if (!emailOk(A.email)) { A.err = { email: 'That email doesn’t look right — check for typos' }; return paint(); }
      A.via = 'email'; return sendCode('email');
    }
    if (!phoneOk(A.iso, A.phone)) { A.err = { phone: phoneErr() }; return paint(); }
    A.via = 'phone'; sendCode('phone');
  }
  function submitSignup() {
    const e = {};
    if (askName() && !A.first.trim()) e.first = 'Enter your first name';
    else if (askName() && !A.last.trim()) e.last = 'Enter your last name';
    if (!phoneOk(A.iso, A.phone)) e.phone = phoneErr();
    if ((emailRequired() || A.email.trim()) && !emailOk(A.email)) e.email = emailRequired() && !A.email.trim() ? 'Add your email address' : 'That email doesn’t look right — check for typos';
    A.err = e; if (Object.keys(e).length) return paint();
    A.via = 'phone'; A.from = 'signup'; sendCode();
  }
  function codeEntered() {
    const byEmail = A.codeFor === 'email';
    if (!byEmail) A.phoneVerified = true;
    const known = accounts()[keyOf(byEmail ? { email: A.email } : { dial: byIso(A.iso).dial, phone: digits(A.phone) })];
    // an existing account logs in, whichever screen they came from (providers still need a verified mobile)
    if (known && !(provider() && !known.phone && !A.phoneVerified)) {
      if (A.from === 'signup') toast('This number already has an account, so we’ve logged you in');
      return finish(known, true);
    }
    if ((!askName() || (A.first.trim() && A.last.trim())) && (!emailRequired() || emailOk(A.email)) && (A.phoneVerified || !provider())) return complete();
    A.pane = 'finish'; A.err = {}; paint();
  }
  function social(kind) {
    // simulated identity providers: they return a verified name and email
    const P = { google: { first: 'Sara', last: 'Ahmed', email: 'sara.ahmed@gmail.com' }, apple: { first: 'Sara', last: 'Ahmed', email: 'sara.a@privaterelay.appleid.com' } }[kind];
    Object.assign(A, P, { via: kind, err: {} });
    const known = accounts()[keyOf({ email: P.email })];
    if (known && !(provider() && !known.phone)) return finish(known, true);
    A.pane = 'finish'; paint();
  }
  function submitFinish() {
    const e = {};
    if (askName() && !A.first.trim()) e.first = 'Enter your first name';
    else if (askName() && !A.last.trim()) e.last = 'Enter your last name';
    if ((emailRequired() || A.email.trim()) && !emailOk(A.email)) e.email = A.email.trim() ? 'That email doesn’t look right — check for typos' : 'Add your email address';
    const needPhone = !A.phoneVerified;
    if (needPhone && (A.phone || provider()) && !phoneOk(A.iso, A.phone)) e.phone = phoneErr();
    A.err = e; if (Object.keys(e).length) return paint();
    if (needPhone && A.phone) return sendCode('phone'); // verify the mobile, then come back done
    complete();
  }
  function complete() {
    const u = { first: A.first.trim(), last: A.last.trim(), email: A.email.trim(), iso: A.iso, dial: byIso(A.iso).dial, phone: A.phoneVerified ? digits(A.phone) : '', via: A.via, since: Date.now() };
    finish(u, false);
  }
  function finish(u, returning) {
    u.name = (u.first + ' ' + u.last).trim();
    const all = accounts(); all[keyOf(u)] = u; if (u.email) all[u.email.toLowerCase()] = u; store.set('accounts', all);
    store.set('user', u);
    const opts = A; clearInterval(A.timer); A = null; closeModal();
    toast(returning ? `Welcome back${u.first ? ', ' + u.first : ''}` : `You’re in — welcome to ${SITE.name}${u.first ? ', ' + u.first : ''}`);
    document.dispatchEvent(new CustomEvent('upnow:auth', { detail: u }));
    done(opts, u);
  }
  function done(opts, u) {
    if (opts.onDone) opts.onDone(u);
    else if (opts.next) location.href = opts.next;
    else refreshHeader();
  }
  function signOut() {
    store.set('user', null);
    document.dispatchEvent(new CustomEvent('upnow:auth', { detail: null }));
    toast('You’ve signed out'); refreshHeader();
  }
  // the header shows "Sign in" or the account menu: re-render that slot in place
  function refreshHeader() {
    const slot = document.querySelector('.header-actions [data-auth-slot]');
    if (slot && U.accountButton) slot.outerHTML = U.accountButton();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    // provider signup links: sign in first
    const a = e.target.closest('a[href]');
    if (a && !user() && /(^|\/)join\.html(\?|#|$)/.test(a.getAttribute('href'))) { e.preventDefault(); e.stopPropagation(); open({ intent: 'provider', next: a.href }); return; }
    if (e.target.closest('[data-auth-out]')) { e.preventDefault(); const m = e.target.closest('.account-menu'); if (m) m.classList.remove('is-open'); signOut(); return; }
    const acc = e.target.closest('[data-account]'); document.querySelectorAll('.account-menu').forEach(m => { if (!acc || m !== acc.parentNode) m.classList.remove('is-open'); });
    if (acc) { acc.parentNode.classList.toggle('is-open'); return; }
    if (!A) return;
    const b = e.target.closest('[data-au]'); if (!b) return;
    const k = b.dataset.au;
    if (k === 'login') submitLogin();
    else if (k === 'signup') submitSignup();
    else if (k === 'go') { A.pane = A.from = b.dataset.to; A.err = {}; paint(); }
    else if (k === 'google' || k === 'apple') social(k);
    else if (k === 'finish') submitFinish();
    else if (k === 'verify') { const code = [...document.querySelectorAll('.auth-modal [data-otp]')].map(x => x.value).join(''); if (/^\d{6}$/.test(code)) codeEntered(); else { A.err = { code: 'Enter all 6 digits of the code' }; paint(); } }
    else if (k === 'edit' || k === 'back') { A.pane = A.pane === 'code' && (A.via === 'google' || A.via === 'apple') || (A.pane === 'code' && A.from !== 'signup' && A.via === 'email' && A.codeFor === 'phone') ? 'finish' : A.from; A.err = {}; paint(); }
    else if (k === 'resend') { A.sent = Date.now(); tick(); toast(A.codeFor === 'email' ? 'We’ve emailed you a new code' : 'We’ve texted you a new code'); }
    else if (k === 'use') { A.useEmail = !A.useEmail; A.err = {}; paint(); }
  }, true);
  document.addEventListener('input', e => {
    if (!A) return;
    const i = e.target.closest('[data-au-k]');
    if (i) { A[i.dataset.auK] = i.value; if (A.err[i.dataset.auK]) { delete A.err[i.dataset.auK]; const m = i.closest('.auth-body').querySelector('.auth-err'); if (m) m.remove(); i.closest('.has-error') && i.closest('.has-error').classList.remove('has-error'); } if (i.dataset.auK === 'phone') A.phoneVerified = false; return; }
    const o = e.target.closest('[data-otp]'); if (!o) return;
    const boxes = [...document.querySelectorAll('.auth-modal [data-otp]')];
    const v = o.value.replace(/\D/g, '');
    if (v.length > 1) { v.slice(0, 6).split('').forEach((d, j) => { if (boxes[j]) boxes[j].value = d; }); } // pasted the whole code
    else o.value = v;
    const idx = +o.dataset.otp; if (v && boxes[idx + 1] && v.length === 1) boxes[idx + 1].focus();
    const code = boxes.map(x => x.value).join('');
    const vb = document.querySelector('.auth-modal [data-au="verify"]'); if (vb) vb.disabled = !/^\d{6}$/.test(code);
    if (/^\d{6}$/.test(code)) { A.err = {}; codeEntered(); }
  });
  document.addEventListener('keydown', e => {
    if (!A) return;
    const o = e.target.closest('[data-otp]');
    if (o && e.key === 'Backspace' && !o.value) { const p = document.querySelector(`.auth-modal [data-otp="${+o.dataset.otp - 1}"]`); if (p) { p.focus(); p.value = ''; } }
    if (e.key === 'Enter' && e.target.closest('.auth-modal input')) { e.preventDefault(); const cta = document.querySelector('.auth-modal .auth-cta'); if (cta) cta.click(); }
  });
  document.addEventListener('change', e => {
    if (!A) return;
    const s = e.target.closest('[data-au-cc]'); if (s) { A.iso = s.value; A.phoneVerified = false; delete A.err.phone; paint(); }
  });
  // the modal was closed (×, Esc, backdrop) — forget the half-finished flow
  document.addEventListener('upnow:modal-closed', () => { if (A) { clearInterval(A.timer); A = null; } });

  const initialsOf = u => ((u.first || '')[0] || '') + ((u.last || '')[0] || '') || (u.email || '?')[0].toUpperCase();
  // the verified name (read from the provider's ID) becomes the account name
  function setName(first, last) {
    const u = user(); if (!u || !first) return;
    Object.assign(u, { first, last: last || '', name: (first + ' ' + (last || '')).trim() });
    store.set('user', u);
    const all = accounts(); all[keyOf(u)] = u; if (u.email) all[u.email.toLowerCase()] = u; store.set('accounts', all);
    refreshHeader(); document.dispatchEvent(new CustomEvent('upnow:auth', { detail: u }));
  }

  /* ---------- header account button (used by components/layout.js) ---------- */
  U.accountButton = () => {
    const u = user();
    if (!u) return `<button class="btn btn-outline btn-sm" data-open="signin" data-auth-slot>${ico('user')}${U.t ? U.t('Log in') : 'Log in'}</button>`;
    // this account's provider application (js/pages/join.js), if any
    const app = (() => { try { const d = JSON.parse(localStorage.getItem('upnow.join') || 'null'); return d && (!d.owner || d.owner === (u.email || u.dial + u.phone)) ? d : null; } catch (e) { return null; } })();
    const st = app && (app.status || (app.done ? 'submitted' : 'draft')), applied = st === 'submitted', approved = st === 'approved', draft = st === 'draft' && app.role;
    return `<div class="account-menu" data-auth-slot><button class="account-btn" type="button" data-account aria-label="Account menu"><span class="account-av">${esc(initialsOf(u))}</span><span class="account-name">${esc(u.first || 'Account')}</span>${ico('chev')}</button>
      <div class="account-drop"><div class="account-who"><b>${esc(u.name || u.email || 'Your account')}</b><small>${u.phone ? esc(u.dial + ' ' + fmt(u.iso || 'AE', u.phone)) : esc(u.email)}</small></div>
        <a href="${HREF.account}">${ico('home')}My account</a>
        <a href="${HREF.join}">${ico('brief')}${applied || approved ? 'Provider application · in review' : draft ? 'Finish your provider application' : 'Become a provider'}</a>
        <button type="button" data-open="enq">${ico('msg')}My enquiries</button>
        <button type="button" data-open="saved">${ico('heart')}Saved</button>
        <button type="button" data-auth-out>${ico('x')}Sign out</button></div></div>`;
  };

  Object.assign(U, { auth: { user, open, signOut, setName, initialsOf } });
})();
