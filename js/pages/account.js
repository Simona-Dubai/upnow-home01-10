/* Customer account — one page, sections chosen by the URL hash:
   #overview (Home) · #enquiries (#enquiry=ID for one enquiry) · #messages (#messages=ID) · #saved · #documents · #alerts · #profile.
   Owners, managers and companies list across Spaces, Services, Experiences, Memberships, Programs, Health and Protection;
   customers contact them directly by phone, WhatsApp, email, chat or SMS. Each contact becomes a lead in the provider's
   dashboard (New → Contacted → Won / Lost); here the customer follows the reply, answers, and closes the enquiry.
   There are no viewing requests, bookings or payments on UpNow; listing cards show the lister's price, as on the rest of the site.
   Reads what the rest of the site keeps for the signed-in account (saved listings, enquiries, recently viewed, saved
   searches) and adds its own record under 'dash'. */
(function () {
  const U = UPUI, { ico, esc, store, money, initials, byId, favs, leads, recent, toast, openModal, closeModal } = U;
  const { offerOf, areaName, LISTINGS } = UP;
  const HREF = PATHS.href;
  const root = document.getElementById('account-dashboard');

  document.getElementById('hdr').innerHTML = U.header(null);
  document.getElementById('ftr').innerHTML = U.footer({ cta: false });
  U.bindHeader();

  /* ---------- data ---------- */
  // saved searches, written by the search page's "Save search" — per account, like everything below
  const alerts = () => store.get('alerts') || [];
  const setAlerts = a => store.set('alerts', a);
  const DASH0 = () => ({
    lead: {}, lists: [], notes: {}, read: [], check: {}, alert: {},
    notify: { replies: { on: true, ch: ['wa', 'push'] }, matches: { on: true, ch: ['wa'] }, tips: { on: false, ch: ['email'] } },
    quiet: true, privacy: { history: true, share: true }
  });
  const D = Object.assign(DASH0(), store.get('dash') || {});
  // another account signed in: this page now shows (and saves) theirs
  const reloadD = () => { Object.keys(D).forEach(k => delete D[k]); Object.assign(D, DASH0(), store.get('dash') || {}); };
  const save = () => store.set('dash', D);
  const user = () => U.auth.user();
  const first = s => String(s || '').split(' ')[0];
  const now = () => Date.now();
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };

  /* ---------- time ---------- */
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const fmtSlot = ts => { const d = new Date(ts); return `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}, ${hm(d)}`; };
  const mins = ms => Math.max(1, Math.round(ms / 60000));
  const ago = ts => { const m = Math.round((now() - ts) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

  /* ---------- an enquiry, as the customer sees it ----------
     Owners, managers and companies list on UpNow; the customer contacts them directly by phone, WhatsApp, email, chat or SMS.
     That contact is the whole journey: it becomes a lead in the provider's dashboard, the provider replies, and either side
     closes it. There are no viewing requests, bookings or payments on UpNow.
     Provider activity arrives as events: { k: 'reply' | 'closed', t, text }. Prototype: there is no server, so sample
     activity carries its own events, and an email, chat or SMS gets a reply once the provider's usual reply time has passed
     (about one in four never replies, to show that path). Calls and WhatsApps happen outside UpNow — the customer tells us.
     stages: sent (email · chat · SMS, waiting for a reply) | direct (call · WhatsApp, did you get through?) → talking → closed */
  const CH = { call: ['Phone', 'phone', '#b7791f', 'called'], whatsapp: ['WhatsApp', 'wa', '#1faa59', 'messaged on WhatsApp'], email: ['Email', 'mail', '#256aa5', 'emailed'], chat: ['Chat', 'msg', '#136142', 'chatted with'], sms: ['SMS', 'msg', '#7b5ea7', 'texted'] };
  const chOf = r => CH[r.type] || CH.email;
  const SLA = 15 * 60000; // the provider's reply target, same as the provider dashboard
  function simulate(r, direct) {
    if (direct) return [];
    const wait = (r.reply || 8) * 60000;
    if (hash(r.id) % 4 === 0 || now() - r.t < wait) return [];
    return [{ k: 'reply', t: r.t + wait, text: hash(r.id) % 2 ? `Hi! Yes, ${r.title} is still available. Happy to answer any questions — call or WhatsApp me anytime.` : `Thanks for getting in touch about ${r.title}. What would you like to know?` }];
  }
  function model(r) {
    const l = byId(r.lid), O = l ? offerOf(l.v, l.cat) : null, S = D.lead[r.id] || {};
    const lease = !!(O && O.lease);
    // how we name the lister: a person by first name ("Dr. Priya", "Ahmed"), a company in full ("Commit Fitness") — like the listing page
    const isPerson = l && window.DM && DM.prov ? DM.prov(r.provider).person : /^(Dr\.|[A-Z][a-z]+ [A-Z][a-z]+( Al)?)$/.test(r.provider);
    const who = !isPerson ? r.provider : /^Dr\.\s/.test(r.provider) ? r.provider.split(' ').slice(0, 2).join(' ') : first(r.provider);
    // owners, managers and companies all list on UpNow — the customer sees them as listers
    const role = 'lister', Role = 'Lister';
    const direct = r.type === 'call' || r.type === 'whatsapp';
    const ev = S.ev || simulate(r, direct);
    const closedEv = ev.filter(e => e.k === 'closed').pop(), replyEv = ev.find(e => e.k === 'reply' && e.t <= now());
    const stage = closedEv || S.outcome ? 'closed' : replyEv || S.heard === true ? 'talking' : direct ? 'direct' : 'sent';
    const late = stage === 'sent' && now() - r.t > SLA;
    const OUT = { got: 'Got what I needed', no: 'Not for me', noreply: 'No reply', other: 'You closed it', withdrawn: 'You closed it', found: 'Got what I needed' };
    const waited = mins(now() - r.t) < 120 ? mins(now() - r.t) + ' min' : ago(r.t).replace(' ago', '');
    const pill = {
      sent: late ? ['No reply yet', 'is-warning'] : ['Awaiting reply', 'is-muted'],
      direct: S.heard === false ? ['No answer yet', 'is-warning'] : [r.type === 'call' ? 'Called' : 'WhatsApp sent', 'is-muted'],
      talking: replyEv ? ['Replied', 'is-info'] : ['In touch', 'is-info'],
      closed: closedEv ? ['Closed by ' + role, 'is-muted'] : [OUT[S.outcome] || 'Closed', 'is-muted']
    }[stage];
    const next = {
      sent: late ? `No reply in ${waited} — nudge ${who} or try another channel` : `Sent ${ago(r.t)} · usually replies in ${r.reply || 10} min`,
      direct: S.heard === false ? `${who} didn’t answer — try again or another channel` : `You ${chOf(r)[3]} ${who} ${ago(r.t)} — did you get through?`,
      talking: replyEv ? `${who}: ${replyEv.text}` : `You’re in touch with ${who}`,
      closed: closedEv ? closedEv.text : S.why ? S.why : 'Closed ' + (S.closedAt ? ago(S.closedAt) : '')
    }[stage];
    const needs = stage === 'direct' || late;
    const replyMin = replyEv ? mins(replyEv.t - r.t) : null;
    return { r, l, O, S, ev, lease, who, role, Role, direct, stage, late, pill, next, needs, closedEv, replyEv, replyMin, gone: !l };
  }
  const all = () => leads().map(model);
  const orgOf = r => (!r.org || r.org === 'Private owner' ? r.provider : r.org);
  const typeLabel = { call: 'Phone call', whatsapp: 'WhatsApp message', email: 'Email', chat: 'Chat', sms: 'SMS' };
  const logLine = (id, text, via = SITE.name) => { const S = D.lead[id] = D.lead[id] || {}; (S.log = S.log || []).push({ t: now(), out: true, text, via }); };

  /* ---------- saved ---------- */
  const savedList = () => [...favs];

  /* ---------- saved searches ---------- */
  function searchInfo(q) {
    const S = U.parseState(q), O = U.offer(S);
    const where = S.loc.length ? S.loc.map(areaName).join(', ') : 'All areas';
    const bits = U.defsOf(S).filter(d => !/price|budget|rent|cost/i.test(d.id + ' ' + (d.label || ''))).map(d => U.valueLabel(d, S.f[d.id])).filter(v => v && !/AED|\$|€|£|price/i.test(v)).slice(0, 4); // no prices on the account
    const res = U.results(S);
    return { q, S, title: `${O ? O.label : 'Everything'} · ${where}`, sub: bits.join(' · '), count: res.length, fresh: res.filter(l => l.posted <= 2), href: HREF.search + q };
  }
  const alertMeta = q => D.alert[q] || (D.alert[q] = { freq: 'instant', ch: 'wa' });

  /* ---------- notifications (built from what the agents did) ---------- */
  /* every alert: { id, kind (reply · remind · listing · document), img, title, text, t, go, m? } — what happened, about
     which place (its photo), and when. A reply to an enquiry that was closed afterwards is history, not news. */
  function feed() {
    const out = [];
    all().forEach(m => {
      const { r } = m, at = '#enquiry=' + r.id, img = PATHS.img(r.img);
      if (m.replyEv) out.push({ id: 'rep' + r.id + m.replyEv.t, kind: 'reply', type: 'reply', m, img, badge: 'msg', tone: 'info', t: m.replyEv.t, title: `${r.provider} replied`, text: `“${m.replyEv.text}”`, sub: r.title, go: '#messages=' + r.id, stale: m.stage === 'closed' });
      if (m.late) out.push({ id: 'late' + r.id, kind: 'remind', type: 'late', m, img, badge: 'clock', tone: 'amber', t: r.t + SLA, title: `No reply yet from ${m.who}`, text: 'Nudge them, or try WhatsApp or a call.', sub: r.title, go: at });
      if (m.closedEv) out.push({ id: 'cls' + r.id, kind: 'reply', type: 'closed', m, img, badge: 'x', tone: 'red', t: m.closedEv.t, title: `${r.provider} closed your enquiry`, text: `“${m.closedEv.text}”`, sub: r.title, go: at });
    });
    alerts().forEach(q => { const s = searchInfo(q); if (s.fresh.length && alertMeta(q).freq !== 'paused') out.push({ id: 'new' + q + s.fresh.length, kind: 'listing', type: 'match', count: s.fresh.length, img: s.fresh[0].img[0], badge: 'search', tone: 'ok', t: now() - 6 * 3600000, title: `${s.fresh.length} new ${s.fresh.length === 1 ? 'listing' : 'listings'} for your search`, text: s.title, sub: `Including ${s.fresh[0].title}`, go: s.href }); });
    // agents and agencies you follow: what they posted this week
    U.follows.all().forEach(f => { const Ls = LISTINGS.filter(l => (f.k === 'agency' ? l.provider.org : l.provider.name) === f.n && l.posted <= 7).sort((a, b) => a.posted - b.posted);
      if (Ls.length) out.push({ id: 'fol' + f.k + f.n + Ls.length, kind: 'listing', type: 'follow', count: Ls.length, img: Ls[0].img[0], badge: 'bell', tone: 'ok', t: now() - Ls[0].posted * 864e5 - 2 * 3600000, title: `${f.n} posted ${Ls.length} new ${Ls.length === 1 ? 'listing' : 'listings'}`, text: Ls[0].title, sub: 'Someone you follow', go: f.k === 'agency' ? HREF.agency + '?a=' + encodeURIComponent(f.n) : provHref(f.n) }); });
    docsDue().forEach(doc => { const e = expOf(doc), d = daysTo(e); out.push({ id: 'doc' + doc.id + e, kind: 'document', type: 'document', badge: 'doc', tone: d < 0 ? 'red' : 'amber', icon: 'doc', t: now() - 3600000, title: `Your ${doc.t} ${d < 0 ? 'has expired' : 'expires in ' + d + ' days'}`, text: 'Listers ask for a valid ID before a contract or sign-up.', sub: niceD(e), go: '#documents' }); });
    return out.sort((a, b) => b.t - a.t);
  }
  const isRead = n => n.stale || D.read.includes(n.id);
  const unread = () => feed().filter(n => !isRead(n)).length;

  /* ---------- routing ---------- */
  const SECTIONS = [['overview', 'Home', 'home'], ['enquiries', 'My enquiries', 'list'], ['messages', 'Messages', 'msg'], ['saved', 'Saved', 'heart'], ['documents', 'Documents', 'doc'], ['alerts', 'Alerts', 'bell'], ['profile', 'Profile & privacy', 'user']];
  const route = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h.startsWith('enquiry=')) return { s: 'enquiries', id: h.slice(8) };
    if (h.startsWith('messages=')) return { s: 'messages', id: h.slice(9) };
    return { s: SECTIONS.some(x => x[0] === h) ? h : 'overview' };
  };
  const go = h => { if (location.hash === '#' + h) render(); else location.hash = h; };
  const A = { etab: 'active', stab: 'items', list: 'all', pick: new Set(), ntab: 'all' }; // view state

  function nav(cur) {
    const L = all(), need = L.filter(m => m.needs).length, n = unread();
    const badge = { enquiries: need || null, messages: unreadMsgs() || null, saved: favs.size || null, documents: docsDue().length || null, alerts: n || null };
    const u = user();
    return `<aside class="account-sidebar">
      <div class="account-user">${meAvatar(u)}<div><b>${esc(u.name || u.email || 'Your account')}</b><small>${u.phone ? `${ico('shield')}Verified mobile` : esc(u.email || '')}</small></div></div>
      <nav class="account-nav" aria-label="Account">${SECTIONS.map(([id, l, i]) => `${id === 'documents' ? '<small class="account-nav-group">Account</small>' : ''}<a href="#${id}" class="${cur === id ? 'is-active' : ''}">${ico(i)}<span>${l}</span>${badge[id] ? `<em class="${id === 'messages' ? 'is-red' : id === 'enquiries' || id === 'alerts' || id === 'documents' ? 'is-hot' : ''}">${badge[id]}</em>` : ''}</a>`).join('')}</nav>
      <a class="account-explore" href="${SITE.homeHref || HREF.home}">${ico('compass')}Explore marketplace</a>
    </aside>`;
  }

  // your avatar: the photo you added on Profile, otherwise your initials
  const meAvatar = (u, cls = '') => D.photo ? `<span class="account-avatar has-photo ${cls}"><img src="${D.photo}" alt=""></span>` : `<span class="account-avatar ${cls}">${esc(U.auth.initialsOf(u))}</span>`;
  // a picked photo: cropped to a square from the centre and scaled to 256 px, so it stays small in storage
  function setPhoto(file) {
    if (!/^image\//.test(file.type)) return toast('Choose an image file');
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement('canvas'), n = 256, side = Math.min(img.width, img.height); c.width = c.height = n;
      c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, n, n);
      URL.revokeObjectURL(url); D.photo = c.toDataURL('image/jpeg', 0.85); try { save(); } catch (e) { delete D.photo; return toast('That photo is too large'); } render(); toast('Profile photo updated'); };
    img.onerror = () => toast('We couldn’t read that image'); img.src = url;
  }
  let asked = false, shown = false;
  function render() {
    const u = user();
    // signed out: no in-between page — the sign-in sheet opens over the page; signing out here or closing it goes home
    if (!u) { root.innerHTML = ''; if (shown || asked) { location.href = HREF.home; return; } asked = true; U.auth.open({ onDone: render }); return; }
    shown = true;
    // a new account (Create account) starts empty; someone logging back in has history. Prototype: no server, so a
    // returning account with nothing on this device gets its sample history once
    if (store.get('session') === 'login' && !D.seeded && !leads().length && !favs.size && !alerts().length) return sample(true);
    const R = route();
    const body = { overview, enquiries: () => R.id ? tracking(R.id) : enquiries(), messages: () => messages(R.id), saved, documents, alerts: alertsView, profile }[R.s]();
    root.innerHTML = nav(R.s) + `<section class="account-main">${body}</section>`;
    root.querySelectorAll('.account-enquiry-filters .lead-bar').forEach(b => { const f = () => b.classList.toggle('is-overflowing', b.scrollWidth > b.clientWidth + 1 && b.scrollLeft + b.clientWidth < b.scrollWidth - 1); f(); b.addEventListener('scroll', f, { passive: true }); });
    document.title = `${R.s === 'overview' ? 'My account' : (SECTIONS.find(x => x[0] === R.s) || [])[1]} | ${SITE.name}`;
    U.updateHdrCounts();
  }

  /* ---------- shared bits ---------- */
  const head = (title, sub, actions = '') => `<header class="account-header"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="account-header-actions">${actions}</div>` : ''}</header>`;
  const empty = (icon, title, text, action = '') => `<div class="account-empty">${ico(icon)}<b>${title}</b><span>${text}</span>${action}</div>`;
  const thumb = r => `<img class="account-thumbnail" src="${esc(PATHS.img(r.img))}" alt="" loading="lazy">`;
  const pill = ([t, k]) => `<span class="status-pill ${k}">${esc(t)}</span>`;
  const waHref = (phone, text) => 'https://wa.me/' + String(phone || '').replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');
  const provHref = name => HREF.provider + '?p=' + encodeURIComponent(name);
  const similarHref = r => { const l = byId(r.lid); return l ? HREF.search + U.toQuery({ ...U.blankState(l.v, l.cat), loc: [l.loc] }) : HREF.search; };
  const tabs = (items, cur, key) => `<div class="account-tabs" role="tablist">${items.map(([id, l, n]) => `<button type="button" class="${id === cur ? 'is-active' : ''}" data-tab="${key}" data-v="${id}">${l}${n != null ? `<em>${n}</em>` : ''}</button>`).join('')}</div>`;
  const stars = (n, who) => n ? `<p class="account-stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)} <small>you rated ${esc(who)}</small></p>` : '';

  // how you contacted them — a source tag per channel, like the provider's Leads board
  const srcTag = r => { const [t, , c] = chOf(r); return `<span class="lead-source" style="--c:${c}"><i></i>${t}</span>`; };
  const av = (n, cls = '') => `<span class="lead-avatar ${cls}">${esc(initials(n))}</span>`;
  const spec = r => [...(r.spec || []).slice(0, 2), r.building || r.area].filter(Boolean).join(' · ');
  // the latest thing said in the conversation, like the message line on a provider's lead card;
  // each card leads with the listing's photo, so you know which place it is at a glance
  const lastMsg = m => { const e = [...m.ev].reverse().find(x => x.text && x.t <= now()); return e ? m.who + ': ' + e.text : m.r.msg ? 'You: ' + m.r.msg : m.next; };
  function leadCard(m) {
    const { r } = m, waited = m.late ? Math.round((now() - r.t) / 60000) : 0;
    return `<a class="lead-card ${m.needs ? 'is-hot' : ''}" href="#enquiry=${r.id}">
      <div class="lead-card-top">${thumb(r)}<span><b>${esc(r.title)}</b><small>${esc(r.provider)}</small></span></div>
      <p>${esc(lastMsg(m))}</p>
      <div class="lead-footer">${srcTag(r)}<span class="spacer"></span>${m.needs && !m.late ? '<span class="lead-tag">Your turn</span>' : m.late ? `<span class="late">${waited < 120 ? waited + 'm' : waited < 2880 ? Math.round(waited / 60) + 'h' : Math.round(waited / 1440) + 'd'} no reply</span>` : `<span>${ago(m.ev.length ? m.ev[m.ev.length - 1].t : r.t)}</span>`}</div></a>`;
  }

  /* ---------- home — a customer activity centre, in priority order:
     needs your attention → your enquiries → messages → continue where you left off → saved → discover more ---------- */
  // one row per decision, with its own colour and button: replied → Review, no reply → Nudge (calls and WhatsApps are
  // grouped into one "did you get through?" row; expiring documents ask for an update)
  function homeAction(m) {
    const { r } = m, id = r.id;
    const call = `<a class="btn btn-outline btn-sm" href="tel:${esc(r.pphone)}" data-calllog="${id}">${ico('phone')}Call</a>`;
    const wa = `<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="${waHref(r.pphone, `Hi ${m.who}, about ${r.title} (Ref ${r.ref}) on ${SITE.name}.`)}" data-walog="${id}">${ico('wa')}WhatsApp</a>`;
    const waited = ago(r.t).replace(' ago', '');
    const waGreen = `<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(r.pphone, `Hi ${m.who}, about ${r.title} (Ref ${r.ref}) on ${SITE.name}.`)}" data-walog="${id}">${ico('wa')}WhatsApp</a>`;
    if (m.stage !== 'closed' && m.replyEv && isUnreadMsg(m)) return { p: 1, t0: m.replyEv.t, m, kicker: 'New reply', one: `<a class="btn btn-primary btn-sm" href="#messages=${id}">${ico('msg')}Reply</a>`, href: `#messages=${id}`, icon: 'msg', tone: 'green', t: `${esc(m.who)} replied`, sub: `${ago(m.replyEv.t)} · ${r.title}`, quote: m.replyEv.text, b: `<a class="btn btn-primary btn-sm" href="#messages=${id}">${ico('msg')}Reply</a>${call}` };
    if (m.late) return { p: 2, t0: r.t, m, href: `#enquiry=${id}`, icon: 'clock', tone: 'red', t: m.S.nudged ? `${esc(m.who)} hasn’t replied in ${waited}` : `No reply from ${esc(m.who)} in ${waited}`, sub: m.S.nudged ? `You nudged ${ago(m.S.nudged)} · ${r.title}` : r.title,
      one: m.S.nudged ? waGreen : `<button class="btn btn-primary btn-sm" type="button" data-act="nudge" data-id="${id}">${ico('bell')}Nudge</button>`,
      b: m.S.nudged ? `${wa}<a class="btn btn-ghost btn-sm" href="${esc(similarHref(r))}">See similar</a>` : `<button class="btn btn-primary btn-sm" type="button" data-act="nudge" data-id="${id}">${ico('bell')}Nudge ${esc(m.who)}</button>${wa}` };
    return null;
  }
  function overview() {
    const u = user(), L = all(), open = L.filter(m => m.stage !== 'closed');
    const follow = L.filter(m => m.stage === 'direct' && m.S.heard !== false);
    const people = [...new Map(follow.map(m => [m.r.provider, m])).values()]; // each lister once
    const waiting = L.filter(m => colOf(m) === 0).length;
    const al = alerts()[0] && searchInfo(alerts()[0]);
    const saved = savedList().map(byId).filter(Boolean);
    const h = new Date().getHours(), hi = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const name = esc(first(u.first || u.name) || 'there');

    // new account: nothing empty — where to start
    if (!L.length) return `<header class="dashboard-header"><div><h1>${hi}, ${name}</h1><p>Let’s get you started.</p></div></header>${ES.home()}`;

    // 1 · needs your attention
    const rows = L.map(homeAction).filter(Boolean);
    // calls and WhatsApps: one row for one lister ("Did you get through to Dr. Priya Mehta?"), grouped when there are several
    if (follow.length) rows.push({ p: 3, href: follow.length === 1 ? `#enquiry=${follow[0].r.id}` : '#enquiries', tone: 'amber', icon: 'phone', stack: people.length > 1 ? people.slice(0, 3).map(m => av(m.r.provider)).join('') : '',
      t: people.length === 1 ? `Did you get through to ${esc(people[0].r.provider)}?` : `Did ${people.length} listers get back to you?`,
      sub: people.length === 1 ? people[0].r.title : `You called or messaged ${people.slice(0, 3).map(m => m.who).join(', ')}${people.length > 3 ? ' +' + (people.length - 3) : ''}`,
      one: follow.length === 1 ? `<button class="btn btn-primary btn-sm" type="button" data-act="heard" data-id="${follow[0].r.id}">${ico('check')}Yes, in touch</button>` : `<button class="btn btn-primary btn-sm" type="button" data-act="heardall">${ico('check')}All in touch</button>`,
      b: follow.length === 1 ? `<button class="btn btn-primary btn-sm" type="button" data-act="heard" data-id="${follow[0].r.id}">Yes, we’re in touch</button><button class="btn btn-outline btn-sm" type="button" data-act="noanswer" data-id="${follow[0].r.id}">No answer</button>`
        : `<button class="btn btn-primary btn-sm" type="button" data-act="heardall">Yes, all in touch</button><a class="btn btn-outline btn-sm" href="#enquiries">Answer one by one</a>` });
    docsDue().forEach(doc => { const d = daysTo(expOf(doc)); rows.push({ p: 4, href: '#documents', icon: 'doc', tone: d < 0 ? 'red' : 'amber', t: `Your ${doc.t} ${d < 0 ? 'has expired' : 'expires ' + niceD(expOf(doc))}`, sub: 'Upload the renewed one — listers ask for a valid ID', one: `<a class="btn btn-primary btn-sm" href="#documents">${ico('upload')}Update</a>`, b: `<a class="btn btn-primary btn-sm" href="#documents">Update</a>` }); });
    rows.sort((a, b) => a.p - b.p || (b.t0 || 0) - (a.t0 || 0));
    const nNeed = rows.length;
    // the most urgent reply opens up: the lister's avatar, a kicker ("New reply · 20 h ago"), the whole message, the listing,
    // Reply and Call; every other row is a tinted icon, what happened, and one button
    const actionRow = (a, k) => { const featured = k === 0 && a.quote;
      if (featured) return `<div class="dashboard-action is-${a.tone} is-featured"><a class="dashboard-action-link" href="${a.href}">${av(a.m.r.provider, 'is-lg')}<span><small class="dashboard-kicker">${ico(a.icon)}${esc(a.kicker)} · ${esc(ago(a.t0))}</small><b>${a.t}</b></span></a>
        <blockquote class="dashboard-action-quote">“${esc(a.quote)}”</blockquote><a class="dashboard-action-listing" href="#enquiry=${a.m.r.id}">${thumb(a.m.r)}<span>${esc(a.m.r.title)}</span>${ico('chevR')}</a>
        <div class="dashboard-action-body">${a.b}</div></div>`;
      return `<div class="dashboard-action is-${a.tone}"><a class="dashboard-action-link" href="${a.href}">${a.stack ? `<span class="dashboard-stack">${a.stack}</span>` : `<i>${ico(a.icon)}</i>`}<span><b>${a.t}</b><small>${esc(a.quote ? '“' + a.quote + '”' : a.sub || '')}</small></span></a>
        <div class="dashboard-action-body">${a.one || a.b}</div></div>`; };
    const needBox = `<section class="dashboard-panel dashboard-needs ${nNeed ? 'is-need' : 'is-clear'}"><div class="dashboard-panel-header"><h2>Up next${nNeed ? ` <em>${nNeed}</em>` : ''}</h2>${nNeed > 1 ? '<span class="dashboard-hint">Most urgent first</span>' : ''}</div>
      ${nNeed ? rows.map(actionRow).join('')
        : `<p class="dashboard-none">${ico('check')}You’re all caught up — we’ll tell you when a lister replies.</p>`}</section>`;

    // light glance figures — links, not tiles, so they don't compete with the actions
    const glance = `<nav class="dashboard-glance" aria-label="At a glance">${[['#enquiries', open.length, 'active enquiries'], ['#enquiries', waiting, 'waiting for reply'], ['#messages', unreadMsgs(), 'unread messages'], ['#saved', favs.size, 'saved']].map(([href, v, l]) => `<a href="${href}"><b>${v}</b>${l}</a>`).join('')}</nav>`;

    const card = (title, link, body, cls = '') => `<section class="dashboard-panel ${cls}"><div class="dashboard-panel-header"><h2>${title}</h2>${link || ''}</div>${body}</section>`;
    const viewAll = (href, label = 'View all') => `<a href="${href}">${label}${ico('chevR')}</a>`;

    // 2 · your enquiries — the same three stages as My enquiries (Waiting → In touch → Closed), then each open one
    // with its step track and the next thing that happens; closed ones fold into one line
    const cnt = i => L.filter(m => colOf(m) === i).length;
    // opens on the most useful stage: waiting, else in touch, else closed — until you pick one
    const tab = A.htab != null ? +A.htab : cnt(0) ? 0 : cnt(1) ? 1 : 2;
    // the three stages as the account's usual tabs: name, count badge, underline on the chosen one
    const stages = `<div class="dashboard-stage-tabs">${tabs(COLS.map((c, i) => [i, c[1], cnt(i)]), tab, 'htab')}</div>`;
    const lastAt = m => (lastIn(m) || m.r).t;
    const inTab = L.filter(m => colOf(m) === tab).sort((a, b) => lastAt(b) - lastAt(a)), SHOW = 4;
    const openRows = inTab.slice(0, SHOW).map(m => `<a class="dashboard-enquiry" href="#enquiry=${m.r.id}">${thumb(m.r)}<span class="dashboard-enquiry-main"><b>${esc(m.r.title)}</b><small>${srcTag(m.r)} · ${esc(m.r.provider)} · ${esc(ago(lastAt(m)))}</small>
        <span class="dashboard-enquiry-next"><span>${esc(m.next)}</span></span></span>${pill(m.pill)}</a>`).join('')
      || `<p class="dashboard-none">${ico('check')}Nothing ${tab === 0 ? 'waiting for a reply' : tab === 1 ? 'in touch yet' : 'closed yet'}.</p>`;
    const enqBox = card('Your enquiries', viewAll('#enquiries', `View all ${L.length}`), stages + openRows
      + (inTab.length > SHOW ? `<a class="dashboard-closed" href="#enquiries">${ico('plus')}<span>${inTab.length - SHOW} more ${esc(COLS[tab][1].toLowerCase())}</span>${ico('chevR')}</a>` : ''), 'is-enquiry');

    // 3 · continue searching (one card, no panel around a single row) · 4 · saved
    const resume = al ? `<a class="dashboard-search" href="${esc(al.href)}"><i>${ico('search')}</i><span><small>Continue searching</small><b>${esc(al.title)}</b><em>${[al.sub, al.count + ' ' + (al.count === 1 ? 'listing' : 'listings')].filter(Boolean).map(esc).join(' · ')}</em></span>${al.fresh.length ? `<span class="dashboard-new">${al.fresh.length} new</span>` : ico('chevR')}</a>` : '';
    const contacted = l => L.some(m => m.r.lid === l.id), notYet = saved.filter(l => !contacted(l)).length;
    const savedBox = saved.length ? card(`Saved <em>${saved.length}</em>`, viewAll('#saved'), saved.slice(0, 3).map(l => `<a class="dashboard-saved-item" href="${HREF.listing}?id=${l.id}"><img src="${esc(l.img[0] || '')}" alt="" loading="lazy"><span><b>${esc(l.title)}</b><small>${contacted(l) ? `<span class="dashboard-contacted">${ico('check')}Contacted</span> · ` : ''}${esc(U.locText(l))}</small></span></a>`).join('')
      + (notYet ? `<a class="dashboard-saved-tip" href="#saved" data-saved-filter="new">${ico('msg')}<span>${notYet} saved but not contacted yet</span>${ico('chevR')}</a>` : ''), 'is-saved') : '';

    // 6 · discover more — picked from what they enquired about, not another menu of the verticals
    const lastLead = L.find(m => m.l), near = lastLead ? lastLead.r.area : '';
    const more = lastLead && lastLead.lease ? [['services', 'cleaning', 'wrench', 'Move-in cleaning', 'Verified cleaners near ' + near], ['services', 'movers', 'car', 'Movers & packers', 'Compare verified movers'], ['insurance', 'property', 'shield', 'Tenant contents insurance', 'Compare licensed insurers']]
      : [['services', 'cleaning', 'wrench', 'Home cleaning', near ? 'Verified cleaners near ' + near : 'Verified cleaners near you'], ['experiences', '', 'compass', 'Weekend experiences', 'Hosted by verified operators'], ['insurance', '', 'shield', 'Insurance', 'Compare licensed insurers']];
    const why = lastLead ? `Because you enquired about ${esc(lastLead.r.title)}${near ? ' in ' + esc(near) : ''}` : 'Picked for you';
    const discover = `<section class="dashboard-panel dashboard-discover"><div class="dashboard-panel-header"><div><h2>Discover more on ${esc(SITE.name)}</h2><small>${why}</small></div></div>
      <div class="dashboard-suggestions">${more.map(([v, o, i, t, sub]) => `<a href="${HREF.search}?v=${v}${o ? '&o=' + o : ''}"><i>${ico(i)}</i><span><b>${t}</b><small>${esc(sub)}</small></span>${ico('chevR')}</a>`).join('')}</div></section>`;

    const side = [resume, savedBox].filter(Boolean).join('');
    return `<header class="dashboard-header"><div><h1>${hi}, ${name}</h1><p>${nNeed ? `<b>${nNeed} ${nNeed === 1 ? 'thing needs' : 'things need'} your attention</b>` : 'You’re all caught up.'}</p>${glance}</div>
        <a class="btn btn-outline btn-sm" href="${HREF.search}">${ico('search')}Search ${esc(SITE.name)}</a></header>
      ${needBox}
      <div class="dashboard-grid"><div class="dashboard-main">${enqBox}</div>${side ? `<aside class="dashboard-side">${side}</aside>` : ''}</div>
      ${discover}`;
  }


  /* ---------- my enquiries — a board (default) or a list, both filtered by vertical and search ----------
     Board: Waiting for reply → In touch → Closed, like the provider's leads; each column shows five, then "Show N more".
     List: the same enquiries in sections — Needs you → Waiting → In touch, closed folded. Verticals, not channels:
     customers think "the cleaners", "the flat"; the channel is a tag on each card. */
  const COLS = [['sent', 'Waiting for reply', ['sent', 'direct']], ['talking', 'In touch', ['talking']], ['closed', 'Closed', ['closed']]];
  const colOf = m => COLS.findIndex(c => c[2].includes(m.stage));
  const needsYou = m => m.stage !== 'closed' && (m.needs || (m.replyEv && isUnreadMsg(m)));
  // the one button that moves an enquiry on (the enquiry page has the rest)
  function enquiryAction(m) {
    const id = m.r.id;
    if (m.stage !== 'closed' && m.replyEv && isUnreadMsg(m)) return `<a class="btn btn-primary btn-sm" href="#messages=${id}">${ico('msg')}Reply</a>`;
    if (m.late) return m.S.nudged ? `<a class="btn btn-outline btn-sm" href="${esc(similarHref(m.r))}">See similar</a>` : `<button class="btn btn-primary btn-sm" type="button" data-act="nudge" data-id="${id}">${ico('bell')}Nudge</button>`;
    if (m.stage === 'direct') return m.S.heard === false ? `<a class="btn btn-outline btn-sm" href="tel:${esc(m.r.pphone)}" data-calllog="${id}">${ico('phone')}Call again</a>` : `<button class="btn btn-primary btn-sm" type="button" data-act="heard" data-id="${id}">Yes, in touch</button>`;
    return '';
  }
  function enquiries() {
    const L = all();
    if (!L.length) return head('My enquiries', `Everyone you called, WhatsApped, emailed, chatted with or texted on ${esc(SITE.name)}.`) + ES.enquiries();
    const vOf = m => m.l ? m.l.v : '', verts = START.filter(([v]) => L.some(m => vOf(m) === v));
    const sv = verts.some(([v]) => v === A.ev) ? A.ev : 'all', q = (A.eq || '').trim().toLowerCase();
    // channel: how you contacted them (Phone · WhatsApp · Email · Chat · SMS), on top of vertical and search
    const chOfM = m => CH[m.r.type] ? m.r.type : 'email', chans = Object.keys(CH).filter(k => L.some(m => chOfM(m) === k)), sc = chans.includes(A.ech) ? A.ech : 'all';
    const LL = L.filter(m => (sv === 'all' || vOf(m) === sv) && (sc === 'all' || chOfM(m) === sc) && (!q || [m.r.title, m.r.provider, m.r.org, m.r.ref].join(' ').toLowerCase().includes(q)));
    const lastAt = m => (lastIn(m) || m.r).t;
    const row = m => { const a = enquiryAction(m);
      return `<div class="account-enquiry-row ${needsYou(m) ? 'is-needs' : ''}"><a class="account-enquiry-row-link" href="#enquiry=${m.r.id}">${thumb(m.r)}<span class="account-enquiry-row-main"><b>${esc(m.r.title)}</b>
        <small>${esc(m.r.provider)} · ${srcTag(m.r)} · ${esc(ago(lastAt(m)))}</small><small class="account-enquiry-row-next">${esc(m.next)}</small></span>${pill(m.pill)}</a>${a ? `<div class="account-enquiry-row-action">${a}</div>` : ''}</div>`; };
    const GROUPS = [['needs', 'Needs you', m => needsYou(m)], ['sent', 'Waiting for reply', m => !needsYou(m) && colOf(m) === 0], ['talking', 'In touch', m => !needsYou(m) && colOf(m) === 1], ['closed', 'Closed', m => colOf(m) === 2]];
    const SHOW = 5, more = A.emore || (A.emore = {});
    const group = ([k, t, test]) => {
      const ms = LL.filter(test).sort((a, b) => lastAt(b) - lastAt(a)); if (!ms.length) return '';
      if (k === 'closed' && !more.closed) return `<button type="button" class="account-enquiry-closed" data-more="closed">${ico('check')}<span>${ms.length} closed ${ms.length === 1 ? 'enquiry' : 'enquiries'} · outcomes and ratings</span><em>Show</em>${ico('chevR')}</button>`;
      const open = more[k] || ms.length <= SHOW + 1;
      return `<section class="account-enquiry-group is-${k}"><h2>${t} <em>${ms.length}</em></h2><div class="account-box account-enquiry-list">${(open ? ms : ms.slice(0, SHOW)).map(row).join('')}
        ${open ? '' : `<button type="button" class="account-enquiry-more" data-more="${k}">Show ${ms.length - SHOW} more${ico('chevR')}</button>`}</div></section>`;
    };
    // channels: round icon buttons in the channel's colour after a "Via" label — clearly not another vertical;
    // click one to filter, click it again to clear
    const channels = chans.length > 1 ? `<div class="account-enquiry-channels" role="group" aria-label="Contacted by"><span>Via</span>${chans.map(k => { const n = L.filter(m => chOfM(m) === k).length, on = sc === k;
      return `<button type="button" class="${on ? 'is-on' : ''}" data-tab="ech" data-v="${on ? 'all' : k}" style="--c:${CH[k][2]}" title="${CH[k][0]} · ${n}" aria-label="${CH[k][0]}, ${n} ${n === 1 ? 'enquiry' : 'enquiries'}" aria-pressed="${on}">${k === 'sms' ? '<b>SMS</b>' : ico(CH[k][1])}<em>${n}</em></button>`; }).join('')}</div>` : '';
    const filters = `<div class="account-enquiry-filters">${verts.length > 1 ? `<div class="lead-bar account-saved-verticals"><button class="chip ${sv === 'all' ? 'is-active' : ''}" data-tab="ev" data-v="all">All <em>${L.length}</em></button>${verts.map(([v, i, t]) => `<button class="chip ${sv === v ? 'is-active' : ''}" data-tab="ev" data-v="${v}">${ico(i)}${t}<em>${L.filter(m => vOf(m) === v).length}</em></button>`).join('')}</div>` : ''}
${channels}</div>`;
    const search = L.length > 5 ? `<label class="account-enquiry-search">${ico('search')}<input type="search" data-enq-search value="${esc(A.eq || '')}" placeholder="Search enquiries" aria-label="Search by listing, lister or ref" title="Search by listing, lister or ref"></label>` : '';
    const view = A.eview || 'board';
    // board, kept short however many there are: five per column then "Show N more"; enquiries waiting over a week fold
    // into one line (they rarely come back); Closed shows the last 30 days — older ones stay a click (or a search) away
    const DAY = 864e5, foldOf = i => q ? null : i === 0 ? ['stale', 7, n => `${n} waiting over a week — try someone similar`] : i === 2 ? ['old', 30, n => `${n} closed more than a month ago`] : null;
    const column = (c, i) => {
      const ms = LL.filter(m => colOf(m) === i).sort((a, b) => lastAt(b) - lastAt(a)), k = 'col' + i, f = foldOf(i);
      const old = f && !more[f[0]] ? ms.filter(m => now() - lastAt(m) > f[1] * DAY) : [], fresh = ms.filter(m => !old.includes(m));
      const open = more[k] || fresh.length <= SHOW + 1;
      return `<div class="lead-column"><div class="lead-column-header">${c[1]}<span>${ms.length}</span></div>${(open ? fresh : fresh.slice(0, SHOW)).map(leadCard).join('') || (old.length ? '' : '<div class="lead-column-empty">—</div>')}
        ${open ? '' : `<button type="button" class="lead-column-more" data-more="${k}">Show ${fresh.length - SHOW} more${ico('chevR')}</button>`}
        ${old.length ? `<button type="button" class="lead-column-fold" data-more="${f[0]}">${ico(i === 0 ? 'clock' : 'check')}<span>${f[2](old.length)}</span><em>Show</em></button>` : ''}</div>`;
    };
    const listHint = LL.length > 15 ? `<p class="lead-board-hint">${ico('list')}<span>Lots of enquiries? The list is easier to scan.</span><button type="button" data-tab="eview" data-v="list">Switch to List</button></p>` : '';
    const board = `${listHint}<div class="lead-board is-3">${COLS.map(column).join('')}</div>`;
    const seg = `<div class="lead-view-switch">${[['board', 'Board', 'grid4'], ['list', 'List', 'list']].map(([k, l, i]) => `<button type="button" class="${view === k ? 'is-on' : ''}" data-tab="eview" data-v="${k}">${ico(i)}${l}</button>`).join('')}</div>`;
    const body = LL.length ? (view === 'board' ? board : GROUPS.map(group).join('')) : empty('search', 'No enquiries match', q ? `Nothing for “${esc(A.eq)}” with these filters.` : 'Nothing with these filters yet.', `<button class="btn btn-outline btn-sm" type="button" data-act="enqreset">Show all enquiries</button>`);
    // the controls sit top right, beside the title (they drop under it where there isn't room)
    return `${head('My enquiries', 'Everyone you contacted, and where each one stands.', search + seg)}${filters}${body}
      <p class="account-footer">${ico('shield')}Calls and WhatsApps happen outside ${esc(SITE.name)} — tell us when you got through so we can keep track.</p>`;
  }

  /* ---------- one enquiry — what you asked about, where it stands, what to do next ----------
     The lister is named once (the contact card); the timeline is the only progress view, and each step carries only
     its own action. Contact buttons live in the card, tips beside it: one for this step, two questions worth asking
     for this kind of listing, and the safety line — UpNow never asks for money. */
  const QUESTIONS = {
    lease: ['Ask for the Trakheesi permit number and who the landlord is', 'Ask how many cheques, and whether DEWA, chiller and parking are included'],
    spaces: ['Confirm the dates, the total for your group and what’s included', 'Ask about the cancellation policy before you commit'],
    services: ['Ask what’s included and whether materials are extra', 'Ask for a time window and who will come'],
    experiences: ['Confirm pick-up, duration and what’s included', 'Ask what happens if the weather changes'],
    memberships: ['Ask for a free trial or day pass first', 'Ask how freezing and cancelling work'],
    programs: ['Ask for a trial session and who teaches it', 'Ask about make-up sessions if you miss one'],
    health: ['Check the DHA licence on their profile', 'Ask whether your insurance is accepted'],
    insurance: ['Ask for the policy wording and the main exclusions', 'Ask how a claim works and how long it takes']
  };
  function tipsFor(m) {
    const { r, l, stage } = m, ref = r.ref ? ' ' + r.ref : '';
    const now_ = {
      sent: m.late ? ['wa', `A WhatsApp often gets a faster answer than ${chOf(r)[0].toLowerCase()} — quote the listing ref${ref} so they know which one.`]
        : ['clock', 'Most listers reply within the hour. We’ll tell you the moment they do — no need to keep checking.'],
      direct: ['phone', `If they didn’t pick up, a short WhatsApp with the listing ref${ref} usually gets a call back.`],
      talking: ['doc', 'Ask them to confirm the key details in writing — by WhatsApp or email — before you decide.'],
      closed: ['search', 'Similar listings nearby often have the same lister type — your saved search keeps an eye out for new ones.']
    }[stage];
    const qs = QUESTIONS[m.lease ? 'lease' : l ? l.v : ''] || [];
    return [now_, ...(stage === 'closed' ? [] : qs.map(q => ['msg', q])), ['shield', `Never pay before you’ve seen it or signed a contract — ${SITE.name} never asks you for money.`]];
  }
  function tracking(id) {
    const r = leads().find(x => x.id === id);
    if (!r) return `${head('Enquiry not found', '')}${empty('msg', 'We couldn’t find this enquiry', 'It may have been removed from this account.', `<a class="btn btn-outline btn-sm" href="#enquiries">Back to my enquiries</a>`)}`;
    const m = model(r), { S, l, who, role, stage } = m, [chName, chIco] = chOf(r);
    const st = (cls, icon, title, when, extra = '') => `<li class="${cls}"><i>${icon}</i><div><b>${title}</b>${when ? `<small>${when}</small>` : ''}${extra}</div></li>`;
    const acts = (...b) => `<div class="account-timeline-actions">${b.filter(Boolean).join('')}</div>`;
    const similar = (cls = 'btn btn-ghost btn-sm') => `<a class="${cls}" href="${esc(similarHref(r))}">${ico('search')}Similar listings</a>`;
    const SENT = { call: 'You called', whatsapp: 'You sent a WhatsApp', email: 'You sent an email', chat: 'You started a chat', sms: 'You sent a text' };
    const items = [];
    // 1 · you made contact
    items.push(st('is-done', ico(chIco), SENT[r.type] || 'You sent an enquiry', fmtSlot(r.t), r.msg ? `<blockquote>“${esc(r.msg)}”</blockquote>` : ''));
    // 2 · their reply — the one action this step needs; calling and WhatsApp are in the contact card
    if (stage === 'sent') items.push(m.late
      ? st('is-current is-warn', ico('clock'), 'No reply yet', `Sent ${ago(r.t)} · listers on ${esc(SITE.name)} aim to reply within 15 min${S.nudged ? ` · you nudged ${ago(S.nudged)}` : ''}`,
        acts(S.nudged ? '' : `<button class="btn btn-primary btn-sm" data-act="nudge" data-id="${r.id}">${ico('bell')}Send a reminder</button>`, similar()))
      : st('is-current', ico('clock'), 'Waiting for a reply', `Usually within ${r.reply || 10} min · we’ll let you know`));
    else if (stage === 'direct') items.push(S.heard === false
      ? st('is-current is-warn', ico(chIco), 'No answer yet', 'Listers often call back within the hour — or try another way in the card.', acts(`<button class="btn btn-outline btn-sm" data-act="heard" data-id="${r.id}">We’re in touch now</button>`))
      : st('is-current', ico(chIco), 'Did you get through?', `${chName} happens outside ${esc(SITE.name)} — tell us so we can keep track.`, acts(`<button class="btn btn-primary btn-sm" data-act="heard" data-id="${r.id}">Yes, we’re in touch</button>`, `<button class="btn btn-outline btn-sm" data-act="noanswer" data-id="${r.id}">No answer</button>`)));
    else items.push(st('is-done', ico('check'), m.replyEv ? 'They replied' : 'You’re in touch',
      m.replyEv ? `${fmtSlot(m.replyEv.t)} · in ${m.replyMin} min` : 'You confirmed you got through', m.replyEv ? `<blockquote>“${esc(m.replyEv.text)}”</blockquote>` + (stage === 'closed' ? '' : acts(`<a class="btn btn-primary btn-sm" href="#messages=${r.id}">${ico('msg')}Reply</a>`)) : ''));
    // 3 · closed
    if (stage === 'closed') items.push(st('is-done', ico(m.closedEv ? 'x' : 'check'), m.closedEv ? 'Closed by the lister' : esc(m.pill[0]),
      m.closedEv ? `${fmtSlot(m.closedEv.t)} · “${esc(m.closedEv.text)}”` : (S.closedAt ? fmtSlot(S.closedAt) : '') + (S.why ? ' · ' + esc(S.why) : ''),
      stars(S.rating, who) + (S.outcome === 'got' || S.outcome === 'found' ? '' : acts(similar('btn btn-outline btn-sm')))));
    else items.push(st('', '3', 'Close it when you’re done', `Got what you needed, or not for you? Close it and rate the ${role} — it keeps ${esc(SITE.name)} honest.`, acts(`<button class="btn btn-outline btn-sm" data-act="withdraw" data-id="${r.id}">Close enquiry</button>`)));

    // the lister, once: who they are and every way to reach them (the listing page's channel buttons)
    const P = l && window.DM ? DM.prov(l.provider.name) : null;
    const lister = `<section class="account-box account-lister"><a class="account-lister-header" href="${provHref(r.provider)}">${av(r.provider, 'is-lg')}<span><b>${esc(r.provider)}${l && l.a.verified ? ico('badge') : ''}</b><small>${esc(orgOf(r) === r.provider ? (P ? offerOf(l.v, l.cat).org[0] : 'Lister') : orgOf(r))}</small>
        <small>${P ? `${ico('star')}${P.rating.toFixed(1)} (${P.reviews.toLocaleString()}) · ` : ''}replies in ~${P ? P.reply : r.reply || 10}&nbsp;min</small></span>${ico('chevR')}</a>
      ${l && window.DM ? DM.agentCard(l, { channels: true }) : `<div class="account-button-pair"><a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(r.pphone, `Hi ${who}, about ${r.title} (Ref ${r.ref}) on ${SITE.name}.`)}" data-walog="${r.id}">${ico('wa')}WhatsApp</a><a class="btn btn-outline btn-sm" href="tel:${esc(r.pphone)}" data-calllog="${r.id}">${ico('phone')}Call</a></div>`}</section>`;
    const tips = `<section class="account-box account-tips"><h3>${ico('spark')}Tips for this enquiry</h3><ul>${tipsFor(m).map(([i, t]) => `<li>${ico(i)}<span>${esc(t)}</span></li>`).join('')}</ul></section>`;

    return `<nav class="account-breadcrumbs"><a href="#enquiries">${ico('chevL')}My enquiries</a></nav>
      <header class="account-box account-enquiry-header"><a class="account-enquiry-listing" href="${l ? HREF.listing + '?id=' + r.lid : '#'}">${thumb(r)}</a>
        <div class="account-enquiry-title"><h1>${esc(r.title)}</h1><small>${esc(spec(r))}${l ? '' : ' · no longer listed'}</small>
          <small>${srcTag(r)} · ${ago(r.t)}${r.ref ? ` · Ref ${esc(r.ref)}` : ''}${l ? ` · <a class="text-link" href="${HREF.listing}?id=${r.lid}">View listing</a>` : ''}</small></div>${pill(m.pill)}</header>
      <div class="account-tracking"><div class="account-box"><h2>Progress</h2><ol class="account-timeline">${items.join('')}</ol></div>
        <aside class="account-tracking-side">${lister}${tips}
          <div class="account-enquiry-links"><button class="text-link" type="button" data-act="report" data-id="${r.id}">${ico('flag')}Report a problem</button></div>
        </aside></div>
      <p class="account-footer">${ico('eye')}They see your name${user() && user().phone ? ' and mobile' : ''}${r.msg ? ' and your message' : ''} — shared when you contacted them. Documents are never shared automatically.</p>`;
  }

  /* ---------- close an enquiry: how it went, and an optional rating ---------- */
  function withdrawModal(id) {
    const m = model(leads().find(x => x.id === id));
    const OPTS = [['got', 'check', 'Got what I needed'], ['no', 'x', 'Not for me'], ['noreply', 'clock', `No reply from the ${m.role}`], ['other', 'flag', 'Something else']];
    const P = { o: 'got', rate: m.S.rating || 0 };
    const paint = () => openModal(`<div class="account-modal"><div class="account-modal-header"><div><h3>Close this enquiry?</h3><p>${esc(m.r.title)} · ${esc(m.r.provider)}</p></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div>
      <div class="account-radios">${OPTS.map(([v, i, t]) => `<button type="button" class="${P.o === v ? 'is-active' : ''}" data-o="${v}"><i>${ico(i)}</i><span><b>${t}</b></span><em></em></button>`).join('')}</div>
      <div class="account-rate"><b>Rate ${esc(m.r.provider)} <small>(optional)</small></b><div>${[1, 2, 3, 4, 5].map(n => `<button type="button" data-rate="${n}" class="${n <= P.rate ? 'is-on' : ''}" aria-label="${n} star">${ico('star')}</button>`).join('')}</div></div>
      <button class="btn btn-primary account-modal-submit" type="button" data-out-go>Close enquiry</button>
      <p class="account-modal-footer">Ratings are anonymous to other users and help keep ${esc(SITE.name)} verified.</p></div>`, 'account-modal-wrap');
    paint();
    const sc = document.querySelector('.scrim');
    sc.onclick = e => {
      const b = e.target.closest('[data-o],[data-rate],[data-out-go]'); if (!b) return;
      if (b.dataset.o) P.o = b.dataset.o;
      if (b.dataset.rate) P.rate = +b.dataset.rate;
      if (b.hasAttribute('data-out-go')) {
        const S = D.lead[id] = D.lead[id] || {}, why = OPTS.find(x => x[0] === P.o)[2];
        Object.assign(S, { outcome: P.o, rating: P.rate, why, closedAt: now() }); logLine(id, 'You closed the enquiry · ' + why);
        sc.onclick = null; closeModal(); save(); render(); toast('Enquiry closed'); return;
      }
      paint();
    };
  }

  /* ---------- saved (C21) ---------- */
  function saved() {
    const ids = savedList();
    const searches = alerts();
    const L = all(), agents = [...new Map(leads().map(r => [r.provider, r])).values()];
    const item = id => {
      const l = byId(id);
      if (!l) return `<div class="account-saved is-gone"><div class="account-gone">${ico('x')}<b>No longer available</b><small>This listing was removed by the lister.</small><button class="btn btn-outline btn-sm" data-fav="${esc(id)}">Remove</button></div></div>`;
      const v = L.find(m => m.r.lid === id && m.stage !== 'closed');
      return `<div class="account-saved">${v ? `<a class="account-dropzone is-view" href="#enquiry=${v.r.id}">${ico(chOf(v.r)[1])}${esc(v.pill[0])}</a>` : ''}${U.card(l)}
        <div class="account-saved-bar"><label class="account-compare-pick"><input type="checkbox" data-pick="${id}" ${A.pick.has(id) ? 'checked' : ''}><span>Compare</span></label></div></div>`;
    };
    // list view: the search page's compact row (components.css .row-item), plus contact, compare and remove
    const row = id => {
      const l = byId(id); if (!l) return '';
      const pt = U.priceText(l), v = L.find(m => m.r.lid === id && m.stage !== 'closed');
      return `<div class="account-saved-row"><a class="row-item" href="${HREF.listing}?id=${l.id}">${U.photo(l, 0)}
          <span><small class="row-category">${esc(offerOf(l.v, l.cat).label)}${v ? ` · <em>${esc(v.pill[0])}</em>` : ''}</small><b>${esc(l.title)}</b><small>${ico('pin')} ${esc(U.locText(l))}</small><small class="row-spec">${U.specOf(l).map(esc).join(' · ')}</small></span>
          <span class="row-price">${pt.n}<span>${esc(pt.u)}</span></span></a>
        <div class="account-saved-row-actions"><button class="btn btn-outline btn-sm" type="button" data-call="${l.id}" aria-label="Call" title="Call">${ico('phone')}</button><button class="btn btn-whatsapp btn-sm" type="button" data-wa="${l.id}" aria-label="WhatsApp" title="WhatsApp">${ico('wa')}</button>
          <label class="account-compare-pick"><input type="checkbox" data-pick="${id}" ${A.pick.has(id) ? 'checked' : ''}><span>Compare</span></label>
          <button class="icon-btn" type="button" data-fav="${esc(id)}" aria-label="Remove from saved" title="Remove from saved">${ico('heart')}</button></div></div>`;
    };
    const sview = D.sview || 'grid';
    // narrow the shortlist like a search: by vertical, by whether you already contacted the lister, and in which order
    const contacted = id => L.some(m => m.r.lid === id);
    const vOf = id => (byId(id) || {}).v, verts = START.filter(([v]) => ids.some(id => vOf(id) === v));
    const sv = verts.some(([v]) => v === A.sv) ? A.sv : 'all', st = A.sstat || 'all', so = A.ssort || 'recent';
    let shown = ids.filter(id => (sv === 'all' || vOf(id) === sv) && (st === 'all' || (st === 'new' ? !contacted(id) : contacted(id))));
    shown = so === 'rated' ? shown.slice().sort((a, b) => ((byId(b) || {}).rating || 0) - ((byId(a) || {}).rating || 0)) : shown.slice().reverse();
    const option = (v, t, cur) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${t}</option>`;
    // one toolbar: vertical chips on the left; show, sort and grid / list on the right (the count only when filtered)
    const filters = `<div class="account-saved-toolbar">${verts.length > 1 ? `<div class="account-saved-verticals"><button class="chip ${sv === 'all' ? 'is-active' : ''}" data-tab="sv" data-v="all">All <em>${ids.length}</em></button>${verts.map(([v, i, t]) => `<button class="chip ${sv === v ? 'is-active' : ''}" data-tab="sv" data-v="${v}">${ico(i)}${t}<em>${ids.filter(id => vOf(id) === v).length}</em></button>`).join('')}</div>` : '<span></span>'}
      <div class="account-saved-tools">${shown.length !== ids.length ? `<span class="account-saved-count">${shown.length} of ${ids.length}</span>` : ''}
        <label class="account-text-select"><span>Show</span><select data-saved-status aria-label="Show">${option('all', 'All', st)}${option('new', 'Not contacted', st)}${option('contacted', 'Contacted', st)}</select></label>
        <label class="account-text-select"><span>Sort</span><select data-saved-sort aria-label="Sort by">${option('recent', 'Recent', so)}${option('rated', 'Top rated', so)}</select></label>
        <div class="lead-view-switch is-icons">${[['grid', 'Grid', 'grid4'], ['list', 'List', 'list']].map(([k, t, i]) => `<button type="button" class="${sview === k ? 'is-on' : ''}" data-sview="${k}" aria-label="${t} view" title="${t} view">${ico(i)}</button>`).join('')}</div></div></div>`;
    const results = !shown.length ? empty('heart', 'Nothing matches these filters', st === 'new' ? 'You’ve contacted every listing you saved here.' : 'Try another vertical or show all saved.', `<button class="btn btn-outline btn-sm" type="button" data-act="savedreset">Show all saved</button>`)
      : sview === 'list' ? `<div class="row-list account-saved-list">${shown.map(row).join('')}</div>` : `<div class="account-grid is-saved">${shown.map(item).join('')}</div>`;
    const body = {
      items: () => ids.length ? `${filters}${results}
          <p class="account-footer">${ico('grid4')}Tick up to 3 listings to compare them side by side.</p>`
        : ES.saved(),
      searches: () => searches.length ? `<div class="account-searches">${searches.map(q => { const s = searchInfo(q), a = alertMeta(q), off = a.freq === 'paused'; return `<div class="account-box account-search">
          <div class="account-search-top"><span class="account-search-icon">${ico('search')}</span><div class="account-search-text"><b>${esc(s.title)}</b><small>${[s.sub, s.count + ' ' + (s.count === 1 ? 'listing' : 'listings')].filter(Boolean).map(esc).join(' · ')}</small></div>
            ${s.fresh.length && !off ? `<span class="status-pill is-success">${s.fresh.length} new</span>` : ''}</div>
          <div class="account-search-bottom"><div class="account-search-alert">${ico('bell')}<span>Alert me</span>
              <select class="account-pill-select" data-afreq="${esc(q)}" aria-label="How often">${[['instant', 'instantly'], ['daily', 'daily'], ['weekly', 'weekly'], ['paused', 'never (paused)']].map(([v, t]) => `<option value="${v}" ${a.freq === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
              ${off ? '' : `<span>by</span><select class="account-pill-select" data-ach="${esc(q)}" aria-label="Channel">${[['wa', 'WhatsApp'], ['push', 'push'], ['email', 'email']].map(([v, t]) => `<option value="${v}" ${a.ch === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`}</div>
            <div class="account-search-open"><a class="btn btn-outline btn-sm" href="${esc(s.href)}">View ${s.count ? s.count + ' ' : ''}${s.count === 1 ? 'listing' : 'listings'}</a><button class="icon-btn" type="button" data-act="delsearch" data-q="${esc(q)}" aria-label="Delete saved search" title="Delete saved search">${ico('x')}</button></div></div></div>`; }).join('')}</div>
          <p class="account-footer">${ico('bell')}We check every few minutes. WhatsApp alerts are opt-in — pause them any time.</p>`
        : ES.searches(),
      // the agents and agencies you follow (Follow on their page), searchable and nine at a time; under them, people
      // you contacted but don't follow yet, one line each with a Follow button
      agents: () => {
        const F = U.follows.all(), q = (A.fq || '').trim().toLowerCase(), SHOW = 9;
        const info = f => {
          const Ls = LISTINGS.filter(l => f.k === 'agency' ? l.provider.org === f.n : l.provider.name === f.n); if (!Ls.length) return null;
          const P = f.k === 'agent' && window.DM ? DM.prov(f.n) : null, l0 = Ls[0];
          const reviews = Ls.reduce((n, l) => n + l.reviews, 0), rating = reviews ? Ls.reduce((n, l) => n + l.rating * l.reviews, 0) / reviews : 0;
          const mine = L.filter(m => f.k === 'agency' ? m.r.org === f.n : m.r.provider === f.n).sort((a, b) => b.r.t - a.r.t);
          return { f, Ls, l0, rating, mine, fresh: Ls.filter(l => l.posted <= 7).length, reply: P ? P.reply : Math.min(...Ls.map(l => l.provider.reply)),
            sub: f.k === 'agency' ? `Agency · ${Ls.length} ${Ls.length === 1 ? 'listing' : 'listings'}` : P && P.person ? l0.provider.org : offerOf(l0.v, l0.cat).org[0],
            href: f.k === 'agency' ? HREF.agency + '?a=' + encodeURIComponent(f.n) : provHref(f.n) };
        };
        const all_ = F.map(info).filter(Boolean), shown = all_.filter(x => !q || (x.f.n + ' ' + x.sub).toLowerCase().includes(q));
        const followBtn = (k, n) => `<button class="btn btn-outline btn-sm btn-follow ${U.follows.has(k, n) ? 'is-following' : ''}" type="button" data-follow="${k}|${esc(n)}">${ico('bell')}<span>${U.followLabel(U.follows.has(k, n))}</span></button>`;
        // the card: who (avatar, name, company · rating, a bell to unfollow) → what's new → your last enquiry → reach them
        const bell = (k, n) => { const on = U.follows.has(k, n); return `<button class="account-lister-bell ${on ? 'is-following' : ''}" type="button" data-follow="${k}|${esc(n)}" aria-pressed="${on}" aria-label="${on ? 'Unfollow' : 'Follow'} ${esc(n)}" title="${on ? 'Following — tap to unfollow' : 'Follow'}">${ico('bell')}</button>`; };
        const card = x => { const latest = x.mine[0], open = x.mine.filter(m => m.stage !== 'closed').length;
          // three even figures: what's new, where you stand, how fast they answer
          const tags = [
            `<a href="${x.href}" class="${x.fresh ? 'is-new' : ''}" title="Listings they posted in the last 7 days"><b>${x.fresh || x.Ls.length}</b><small>${x.fresh ? 'new this week' : x.Ls.length === 1 ? 'listing' : 'listings'}</small></a>`,
            `<a href="${latest ? '#enquiry=' + latest.r.id : x.href}"><b>${open || x.mine.length || 0}</b><small>${open ? (open === 1 ? 'open enquiry' : 'open enquiries') : x.mine.length ? 'closed' : 'enquiries'}</small></a>`,
            `<span><b>~${x.reply}<i>min</i></b><small>reply time</small></span>`].join('');
          const row = latest
            ? `<a class="account-lister-latest" href="#enquiry=${latest.r.id}">${thumb(latest.r)}<span><b>${esc(latest.r.title)}</b><small><em class="is-${latest.pill[1]}">${esc(latest.pill[0])}</em> · ${esc(ago(latest.r.t))}</small></span>${ico('chevR')}</a>`
            : `<a class="account-lister-latest" href="${HREF.listing}?id=${x.l0.id}"><img class="account-thumbnail" src="${esc(x.l0.img[0] || '')}" alt="" loading="lazy"><span><b>${esc(x.l0.title)}</b><small>Latest listing</small></span>${ico('chevR')}</a>`;
          return `<article class="account-lister-card">
            <div class="account-lister-card-head"><a href="${x.href}">${mav(x.f.n, 'is-md')}</a><a class="account-lister-who" href="${x.href}"><b><span>${esc(x.f.n)}</span>${ico('badge')}</b><small><span>${esc(x.sub)}</span>${x.rating ? `<em>${ico('star')}${x.rating.toFixed(1)}</em>` : ''}</small></a>${bell(x.f.k, x.f.n)}</div>
            <div class="account-lister-stats">${tags}</div>${row}
            <div class="account-lister-actions">${x.f.k === 'agent' ? `<a class="message-icon-btn is-whatsapp" target="_blank" rel="noopener" href="${waHref(x.l0.provider.phone, `Hi ${first(x.f.n)}, I found you on ${SITE.name}.`)}" aria-label="WhatsApp" title="WhatsApp">${ico('wa')}</a><a class="message-icon-btn" href="tel:${esc(x.l0.provider.phone)}" aria-label="Call" title="Call">${ico('phone')}</a>` : ''}
              <a class="account-lister-profile" href="${x.href}">${x.f.k === 'agency' ? 'View agency' : 'View profile'}${ico('chevR')}</a></div></article>`; };
        const more = A.fmore ? shown : shown.slice(0, SHOW);
        const followed = new Set(F.filter(f => f.k === 'agent').map(f => f.n));
        const contacted = agents.filter(r => !followed.has(r.provider));
        const suggest = contacted.length ? `<section class="account-section account-contacted"><div class="account-section-header"><h2>People you’ve contacted</h2><small>Follow the ones you’d go back to</small></div>
          <div class="account-contacted-list">${contacted.map(r => `<div class="account-contacted-row">${mav(r.provider)}<a href="${provHref(r.provider)}"><b>${esc(r.provider)}</b><small>${esc(r.title)}</small></a>${followBtn('agent', r.provider)}</div>`).join('')}</div></section>` : '';
        const tools = all_.length > 3 ? `<div class="account-following-tools"><label class="account-enquiry-search">${ico('search')}<input type="search" data-follow-search value="${esc(A.fq || '')}" placeholder="Search who you follow" aria-label="Search who you follow"></label><span>${all_.length} followed</span></div>` : '';
        const grid = !all_.length ? empty('bell', 'You’re not following anyone yet', 'Tap Follow on an agent’s or agency’s page to see their new listings here.', contacted.length ? '' : `<a class="btn btn-primary btn-sm" href="${HREF.search}">${ico('search')}Browse listings</a>`)
          : !shown.length ? empty('search', 'No one matches', `Nothing for “${esc(A.fq)}”.`)
          : `<div class="account-listers">${more.map(card).join('')}</div>${shown.length > SHOW && !A.fmore ? `<button type="button" class="account-enquiry-more account-following-more" data-act="fmore">Show ${shown.length - SHOW} more${ico('chevR')}</button>` : ''}`;
        return tools + grid + suggest + `<p class="account-footer">${ico('bell')}Following an agent or agency shows their new listings here. They aren’t told you follow them.</p>`;
      }
    };
    return `${head('Saved', 'Your shortlist, saved searches and who you follow — synced to your account.', A.stab === 'items' && A.pick.size > 1 ? `<button class="btn btn-primary btn-sm" type="button" data-act="compare">${ico('grid4')}Compare ${A.pick.size}</button>` : '')}
      ${tabs([['items', 'Listings', ids.length], ['searches', 'Searches', searches.length], ['agents', 'Following', U.follows.all().length]], A.stab, 'stab')}
      ${(body[A.stab] || body.items)()}`;
  }
  function compareModal() {
    const L = [...A.pick].map(byId).filter(Boolean).slice(0, 3);
    const rows = [['Location', l => esc(U.locText(l))], ['Category', l => esc(offerOf(l.v, l.cat).label)],
      ['Key facts', l => esc(U.specOf(l).join(' · '))], ['Rating', l => `${ico('star')}${l.rating} <small>(${l.reviews})</small>`], ['Lister', l => `${esc(l.provider.name)}<small>replies in ~${l.provider.reply} min</small>`],
      ['Verified', l => l.a.verified ? `<span class="status-pill is-success">Verified</span>` : '<small>Not yet</small>'], ['Reference', l => esc(l.ref)]];
    openModal(`<div class="account-modal account-compare-modal"><div class="account-modal-header"><div><h3>Compare ${L.length}</h3><p>Side by side from your saved listings</p></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div>
      <div class="account-compare" style="--n:${L.length}"><div></div>${L.map(l => `<a href="${HREF.listing}?id=${l.id}" class="account-compare-header"><img src="${esc(l.img[0] || PATHS.img('hero.jpg'))}" alt=""><b>${esc(l.title)}</b></a>`).join('')}
        ${rows.map(([t, f]) => `<div class="account-compare-label">${t}</div>${L.map(l => `<div>${f(l)}</div>`).join('')}`).join('')}
        <div></div>${L.map(l => `<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(l.provider.phone, `Hi ${first(l.provider.name)}, is ${l.title} (Ref ${l.ref}) still available?`)}">${ico('wa')}WhatsApp</a>`).join('')}</div></div>`, 'account-modal-wrap is-wide');
  }

  /* ---------- alerts — what happened, newest first, each with the one button that answers it;
     new ones apart from earlier ones; how we reach you as plain channel switches per kind of alert ---------- */
  function alertsView() {
    const F = feed(), n = unread();
    if (!F.length) return `${head('Alerts', '')}<div class="account-alerts"><div>${ES.alerts()}</div>${alertSettings()}</div>`;
    const KINDS = [['all', 'All'], ['reply', 'Replies'], ['remind', 'Reminders'], ['listing', 'New listings'], ['document', 'Documents']]
      .map(([k, t]) => [k, t, k === 'all' ? F.length : F.filter(x => x.kind === k).length]).filter(k => k[0] === 'all' || k[2]);
    const cur = KINDS.some(k => k[0] === A.ntab) ? A.ntab : 'all', list = cur === 'all' ? F : F.filter(x => x.kind === cur);
    const action = x => {
      const id = x.m && x.m.r.id;
      if (x.type === 'reply') return x.m.stage === 'closed' ? '' : `<a class="btn btn-primary btn-sm" href="#messages=${id}">Reply</a>`;
      if (x.type === 'late') return x.m.stage !== 'sent' ? '' : x.m.S.nudged ? `<a class="btn btn-outline btn-sm" href="${esc(similarHref(x.m.r))}">See similar</a>` : `<button class="btn btn-primary btn-sm" type="button" data-act="nudge" data-id="${id}">Nudge</button>`;
      if (x.type === 'closed') return `<a class="btn btn-outline btn-sm" href="${esc(similarHref(x.m.r))}">See similar</a>`;
      if (x.type === 'document') return `<a class="btn btn-primary btn-sm" href="#documents">Update</a>`;
      return `<a class="btn btn-outline btn-sm" href="${esc(x.go)}">View ${x.count > 1 ? x.count : ''}</a>`;
    };
    // the place it's about, with a small badge for what happened
    const media = x => `<span class="account-alert-media">${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy">` : `<span class="account-alert-tile is-${x.tone}">${ico(x.icon)}</span>`}<i class="is-${x.tone}">${ico(x.badge)}</i></span>`;
    const item = x => `<div class="account-alert ${isRead(x) ? '' : 'is-unread'}" data-read="${esc(x.id)}">${media(x)}
      <a class="account-alert-text" href="${esc(x.go)}"><b>${esc(x.title)}</b><span>${esc(x.text)}</span><small>${x.sub ? esc(x.sub) + ' · ' : ''}${ago(x.t)}</small></a>${action(x) ? `<div class="account-alert-action">${action(x)}</div>` : ''}</div>`;
    // by day: Today · Yesterday · This week · Earlier
    const startOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return +x; }, today = startOf(now());
    const bucket = t => t >= today ? 'Today' : t >= today - 864e5 ? 'Yesterday' : t >= today - 6 * 864e5 ? 'This week' : 'Earlier';
    const groups = ['Today', 'Yesterday', 'This week', 'Earlier'].map(g => [g, list.filter(x => bucket(x.t) === g)]).filter(g => g[1].length);
    return `${head('Alerts', n ? `${n} new since you last looked` : 'You’re up to date', n ? `<button class="btn btn-outline btn-sm" type="button" data-act="readall">${ico('check')}Mark all as read</button>` : '')}
      <div class="account-alerts"><div>
        ${KINDS.length > 2 ? `<div class="lead-bar account-alert-kinds">${KINDS.map(([k, t, c]) => `<button class="chip ${cur === k ? 'is-active' : ''}" data-tab="ntab" data-v="${k}">${t}<em>${c}</em></button>`).join('')}</div>` : ''}
        ${groups.map(([g, xs]) => `<section class="account-feed-group"><h2>${g}</h2><div class="account-box account-alert-list">${xs.map(item).join('')}</div></section>`).join('')}</div>
        ${alertSettings()}</div>`;
  }
  // per kind of alert: a sentence of what it is and the channels as switches (WhatsApp · Push · Email)
  function alertSettings() {
    const TYPES = [['replies', 'Replies from listers', 'When an owner, manager or company replies or closes your enquiry'], ['matches', 'New listings', 'For your saved searches and people you follow'], ['tips', 'Tips & news', 'Occasional — never more than once a month']];
    const CHN = [['wa', 'WhatsApp', 'wa'], ['push', 'Push', 'bell'], ['email', 'Email', 'mail']];
    const pref = k => D.notify[k] || (D.notify[k] = { on: false, ch: [] });
    const nSearch = alerts().length;
    return `<aside class="account-box account-preferences"><h3>How we reach you</h3><p class="account-preferences-note">Pick any channels — or none to turn an alert off.</p>
      ${TYPES.map(([k, t, sub]) => `<div class="account-preference"><b>${t}</b><small>${sub}</small>
        <div class="account-channels">${CHN.map(([c, l, i]) => `<label class="account-channel"><input type="checkbox" data-pref="${k}" data-ch="${c}" ${pref(k).ch.includes(c) ? 'checked' : ''}><span>${ico(i)}${ico('check', 'channel-tick')}${l}</span></label>`).join('')}</div>
        ${k === 'matches' && nSearch ? `<a class="account-preference-link" href="#saved" data-tab="stab" data-v="searches">${nSearch} saved ${nSearch === 1 ? 'search' : 'searches'} · set how often for each${ico('chevR')}</a>` : ''}</div>`).join('')}
      <label class="toggle account-quiet-hours"><span><b>Quiet hours</b><small>No WhatsApp or push between 22:00 and 08:00</small></span><input type="checkbox" data-quiet ${D.quiet ? 'checked' : ''}><i></i></label></aside>`;
  }

  /* ---------- profile & privacy ----------
     Verification beside personal details; family (Programs, Health) beside addresses (Services, home visits);
     how we reach you (a summary of Alerts) beside privacy and your data, then sign out. ID documents live in Documents only. */
  const familyOf = () => D.family || (D.family = []);
  const placesOf = () => D.places || (D.places = []);
  function profile() {
    const u = user(), L = leads(), shared = [...new Map(L.map(r => [r.provider, r])).values()];
    const since = u.since ? new Date(u.since) : null;
    const eid = idocs().eid, eidOk = eid && eid.ok;
    const nationality = eidOk && eid.d && eid.d.nationality ? String(eid.d.nationality).replace(/^\?/, '') : '';
    const CHN = { wa: 'WhatsApp', push: 'Push', email: 'Email' }, rep = D.notify.replies || { on: false, ch: [] };
    const fam = familyOf(), places = placesOf();
    // one row style for every setting: soft icon, value over a muted line, action on the right
    const row = (icon, title, sub, right = '', cls = '') => `<div class="account-setting ${cls}"><i>${ico(icon)}</i><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${right}</div>`;
    const select = (k, opts) => `<label class="account-select"><select data-prefs="${k}" aria-label="${k === 'cur' ? 'Currency' : 'Language'}">${opts}</select></label>`;
    const boxHead = (title, act = '') => `<div class="account-box-header"><h3>${title}</h3>${act}</div>`;
    const addBtn = (act, label) => `<button class="text-link account-add" type="button" data-act="${act}">${ico('plus')}${label}</button>`;
    return `${head('Profile &amp; privacy', 'How listers reach you, and what they can see.')}
      <div class="account-profile-grid">
        <section class="account-box">
          <div class="account-details-header"><label class="account-photo" title="${D.photo ? 'Change photo' : 'Add a photo'}">${meAvatar(u, 'is-lg')}<i>${ico('camera')}</i><input type="file" accept="image/*" data-photo hidden></label><div><h3>${esc(u.name || 'Add your name')}</h3><small>${since ? `Member since ${MON[since.getMonth()]} ${since.getFullYear()}` : ''}${nationality ? ` · ${esc(nationality)}` : ''}</small><span class="account-photo-links">${D.photo ? `<label>${ico('camera')}Change photo<input type="file" accept="image/*" data-photo hidden></label><button type="button" data-act="delphoto">Remove</button>` : `<label>${ico('camera')}Add a photo<input type="file" accept="image/*" data-photo hidden></label>`}</span></div><button class="btn btn-ghost btn-sm" type="button" data-act="editname">${ico('pen')}Edit</button></div>
          ${u.phone ? row('phone', esc(U.fmtPhone(u.dial + u.phone)), 'Verified · used to sign in', '<span class="status-pill is-success">Verified</span>') : row('phone', 'No mobile yet', 'Add one so listers can reach you', '', 'is-todo')}
          ${row('mail', esc(u.email || 'No email yet'), u.email ? 'Copies of your enquiries and replies' : 'Get a copy of every enquiry and reply', `<button class="${u.email ? 'text-link' : 'btn btn-outline btn-sm'}" type="button" data-act="editemail">${u.email ? 'Change' : `${ico('plus')}Add`}</button>`, u.email ? '' : 'is-todo')}
          ${row('shield', 'UAE PASS', 'Share your verified ID with listers in one tap', '<span class="status-pill is-muted">Coming soon</span>', 'is-later')}
        </section>
        <section class="account-box"><h3>Preferences</h3>
          ${row('globe', 'Language', 'Used across the site', select('lang', SITE.languages.map(([k, l]) => `<option value="${k}" ${U.prefs.lang === k ? 'selected' : ''}>${l}</option>`).join('')))}
          ${row('tag', 'Currency', 'Prices on listings are shown in this currency', select('cur', Object.keys(U.CUR).map(k => `<option value="${k}" ${U.prefs.cur === k ? 'selected' : ''}>${k}</option>`).join('')))}
          <a class="account-setting is-link" href="#alerts"><i>${ico('bell')}</i><span><b>Notifications</b><small>${rep.on && rep.ch.length ? 'Replies by ' + rep.ch.map(c => CHN[c] || c).join(' & ') : 'Replies off'}${D.quiet ? ' · quiet 22:00–08:00' : ''}</small></span>${ico('chevR')}</a>
          <label class="account-setting"><i>${ico('eye')}</i><span><b>Search history</b><small>Used for “Recently viewed” and suggestions</small></span><span class="toggle"><input type="checkbox" data-priv="history" ${D.privacy.history ? 'checked' : ''}><i></i></span></label>
        </section>
        <section class="account-box">${boxHead('Family', addBtn('addfamily', 'Add'))}
          <p class="account-box-note">Enquire for a child or parent — handy for Programs and Health.</p>
          ${fam.length ? fam.map(m => `<div class="account-setting"><span class="lead-avatar">${esc(initials(m.name))}</span><span><b>${esc(m.name)}</b><small>${[m.rel, m.age ? m.age + ' yrs' : ''].filter(Boolean).map(esc).join(' · ')}</small></span><button class="icon-btn" type="button" data-act="delfamily" data-id="${m.id}" aria-label="Remove ${esc(m.name)}">${ico('x')}</button></div>`).join('')
            : `<p class="account-box-empty">No family members yet.</p>`}
        </section>
        <section class="account-box">${boxHead('Addresses', addBtn('addplace', 'Add'))}
          <p class="account-box-note">Save your area once — cleaners, movers and home visits need it.</p>
          ${places.length ? places.map(a => row('pin', esc(a.label), esc(a.addr), `<button class="icon-btn" type="button" data-act="delplace" data-id="${a.id}" aria-label="Remove ${esc(a.label)}">${ico('x')}</button>`)).join('')
            : `<p class="account-box-empty">No addresses yet.</p>`}
        </section>
        <section class="account-box account-privacy">
          <div><h3>Privacy &amp; data</h3>
            <p class="account-privacy-note">${ico('lock')}<span>Listers only see your name and mobile when you contact them. Documents are never shared automatically.</span></p>
            <details class="account-shared"><summary>${ico('users')}Who has your details <em>${shared.length}</em></summary>${shared.length ? shared.map(r => `<div><b>${esc(r.provider)}</b><small>${esc(r.org)} · first contact ${ago(r.t)}</small></div>`).join('') : '<p>No lister has your details yet.</p>'}</details></div>
          <div>
            <button type="button" class="account-setting is-link" data-act="export"><i>${ico('upload')}</i><span><b>Download my data</b><small>Account, saved listings, enquiries and settings</small></span>${ico('chevR')}</button>
            <button type="button" class="account-setting is-link" data-act="signout"><i>${ico('arrow')}</i><span><b>Sign out</b><small>Signed in as ${esc(u.phone ? U.fmtPhone(u.dial + u.phone) : u.email || u.name || 'you')} on this device</small></span>${ico('chevR')}</button>
            <button type="button" class="account-setting is-link is-danger" data-act="delete"><i>${ico('x')}</i><span><b>Delete my account</b><small>Removes your account and everything saved with it</small></span>${ico('chevR')}</button></div>
        </section>
      </div>
      <p class="account-footer">${ico('lock')}We handle your data under the UAE Personal Data Protection Law.</p>`;
  }





  /* ---------- empty states — what this place is for, three steps, an illustration, where to start ----------
     Illustrations are drawn inline in the onboarding style (brand greens, a pale circle, one amber accent that bobs). */
  const ESA = {
    home: `<svg viewBox="0 0 300 210" aria-hidden="true"><circle cx="160" cy="112" r="88" fill="#eef7f2"/>
      <rect x="62" y="40" width="190" height="132" rx="14" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="M62 54a14 14 0 0 1 14-14h162a14 14 0 0 1 14 14v6H62z" fill="#136142"/>
      <circle cx="76" cy="50" r="3" fill="#fff" opacity=".6"/><circle cx="86" cy="50" r="3" fill="#fff" opacity=".6"/>
      <rect x="74" y="72" width="44" height="88" rx="8" fill="#eef7f2"/><rect x="82" y="82" width="28" height="5" rx="2.5" fill="#136142"/><rect x="82" y="94" width="22" height="4" rx="2" fill="#bfd9cb"/><rect x="82" y="104" width="26" height="4" rx="2" fill="#bfd9cb"/><rect x="82" y="114" width="18" height="4" rx="2" fill="#bfd9cb"/>
      <rect x="128" y="72" width="54" height="34" rx="8" fill="#d8efe3"/><rect x="136" y="82" width="20" height="10" rx="3" fill="#136142"/><rect x="136" y="96" width="34" height="4" rx="2" fill="#fff"/>
      <rect x="188" y="72" width="54" height="34" rx="8" fill="#fbf1e2"/><rect x="196" y="82" width="20" height="10" rx="3" fill="#e0a526"/><rect x="196" y="96" width="34" height="4" rx="2" fill="#fff"/>
      <rect x="128" y="114" width="114" height="46" rx="8" fill="#fff" stroke="#d8efe3" stroke-width="2"/><circle cx="144" cy="130" r="7" fill="#25946a"/><rect x="157" y="125" width="54" height="5" rx="2.5" fill="#136142"/><rect x="157" y="135" width="38" height="4" rx="2" fill="#d3dad5"/><rect x="200" y="146" width="34" height="8" rx="4" fill="#136142"/>
      <g class="onboarding-illustration-pin"><path d="M248 20c-10 0-17 8-17 17 0 12 17 27 17 27s17-15 17-27c0-9-7-17-17-17z" fill="#e0a526"/><circle cx="248" cy="37" r="6" fill="#fff"/></g>
      <path class="onboarding-illustration-spark" d="M40 70v10M35 75h10M270 150v8M266 154h8" stroke="#25946a" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    enquiries: `<svg viewBox="0 0 300 210" aria-hidden="true"><circle cx="150" cy="112" r="88" fill="#eef7f2"/>
      <rect x="58" y="44" width="124" height="128" rx="14" fill="#fff" stroke="#d8efe3" stroke-width="2"/><rect x="70" y="56" width="100" height="58" rx="8" fill="#d8efe3"/><path d="M78 104l22-24 16 16 12-10 34 18z" fill="#25946a"/><circle cx="150" cy="72" r="7" fill="#fff"/>
      <rect x="70" y="122" width="70" height="6" rx="3" fill="#136142"/><rect x="70" y="134" width="48" height="4" rx="2" fill="#d3dad5"/>
      <g><circle cx="80" cy="155" r="9" fill="#b7791f"/><circle cx="102" cy="155" r="9" fill="#1faa59"/><circle cx="124" cy="155" r="9" fill="#256aa5"/><circle cx="146" cy="155" r="9" fill="#136142"/><circle cx="168" cy="155" r="9" fill="#7b5ea7"/>
        <g fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M76.5 151.5h2l.9 2.3-1.2.8a5.5 5.5 0 0 0 3 3l.8-1.2 2.3.9v2a1 1 0 0 1-1 1 8 8 0 0 1-7.8-7.8 1 1 0 0 1 1-1z"/><path d="M97.5 159l.8-2.6a4.6 4.6 0 1 1 1.9 1.8z"/><rect x="119.5" y="151.5" width="9" height="7" rx="1"/><path d="M119.5 152.5l4.5 3 4.5-3"/><path d="M141.5 151.5h9v5.5h-5.5l-3.5 2.5z"/><path d="M163.5 152h9v5.5h-3l-3 2v-2h-3z"/></g></g>
      <g><rect x="176" y="70" width="88" height="34" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="M186 104l-4 10 14-10z" fill="#fff"/><rect x="186" y="80" width="56" height="5" rx="2.5" fill="#136142"/><rect x="186" y="90" width="40" height="4" rx="2" fill="#d3dad5"/></g>
      <g class="onboarding-illustration-pin"><rect x="206" y="118" width="58" height="46" rx="12" fill="#e0a526"/><path d="M220 133h30M220 143h20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="252" cy="152" r="7" fill="#fff"/><path d="m249 152 2 2 4-4" fill="none" stroke="#e0a526" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>
      <path class="onboarding-illustration-spark" d="M42 60v10M37 65h10M272 46v8M268 50h8" stroke="#25946a" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    messages: `<svg viewBox="0 0 300 210" aria-hidden="true"><circle cx="150" cy="110" r="88" fill="#eef7f2"/>
      <g><rect x="56" y="52" width="130" height="62" rx="18" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="M78 114l-6 18 22-18z" fill="#fff" stroke="#d8efe3" stroke-width="2" stroke-linejoin="round"/><path d="M80 112h20" stroke="#fff" stroke-width="4"/>
        <circle cx="80" cy="76" r="10" fill="#25946a"/><rect x="98" y="70" width="70" height="6" rx="3" fill="#136142"/><rect x="98" y="82" width="52" height="5" rx="2.5" fill="#d3dad5"/><rect x="72" y="96" width="96" height="5" rx="2.5" fill="#d3dad5"/></g>
      <g class="onboarding-illustration-pin"><rect x="126" y="112" width="124" height="54" rx="18" fill="#136142"/><path d="M226 166l8 16-22-16z" fill="#136142"/><rect x="142" y="128" width="78" height="6" rx="3" fill="#fff"/><rect x="142" y="140" width="56" height="5" rx="2.5" fill="#bfe2cf"/>
        <path d="m222 150 4 4 8-8" fill="none" stroke="#e0a526" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
      <path class="onboarding-illustration-spark" d="M44 140v10M39 145h10M262 64v8M258 68h8" stroke="#25946a" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    saved: `<svg viewBox="0 0 300 210" aria-hidden="true"><circle cx="150" cy="112" r="88" fill="#eef7f2"/>
      <g transform="rotate(-7 110 112)"><rect x="56" y="58" width="104" height="110" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2"/><rect x="66" y="68" width="84" height="54" rx="8" fill="#d8efe3"/><path d="M72 114l20-22 14 14 10-8 30 16z" fill="#25946a" opacity=".7"/><rect x="66" y="132" width="60" height="6" rx="3" fill="#136142"/><rect x="66" y="144" width="42" height="4" rx="2" fill="#d3dad5"/></g>
      <rect x="140" y="50" width="108" height="118" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2"/><rect x="150" y="60" width="88" height="58" rx="8" fill="#d8efe3"/><path d="M156 110l22-24 16 16 12-10 32 18z" fill="#136142" opacity=".75"/><circle cx="222" cy="74" r="6" fill="#fff"/>
      <rect x="150" y="128" width="64" height="6" rx="3" fill="#136142"/><rect x="150" y="140" width="46" height="4" rx="2" fill="#d3dad5"/><rect x="150" y="150" width="30" height="8" rx="4" fill="#eef7f2"/><rect x="184" y="150" width="30" height="8" rx="4" fill="#eef7f2"/>
      <g class="onboarding-illustration-pin"><circle cx="246" cy="52" r="20" fill="#e0a526"/><path d="M246 63s-11-6.8-11-14.6a6 6 0 0 1 11-3.4 6 6 0 0 1 11 3.4C257 56.2 246 63 246 63z" fill="#fff"/></g>
      <path class="onboarding-illustration-spark" d="M40 76v10M35 81h10M270 150v8M266 154h8" stroke="#25946a" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    searches: `<svg viewBox="0 0 300 210" aria-hidden="true"><circle cx="150" cy="112" r="88" fill="#eef7f2"/>
      <rect x="50" y="46" width="180" height="120" rx="14" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="M50 60a14 14 0 0 1 14-14h152a14 14 0 0 1 14 14v4H50z" fill="#d8efe3"/>
      <rect x="64" y="76" width="152" height="18" rx="9" fill="#eef7f2"/><rect x="74" y="82" width="70" height="6" rx="3" fill="#136142"/>
      <rect x="64" y="104" width="68" height="50" rx="8" fill="#d8efe3"/><rect x="140" y="104" width="76" height="8" rx="4" fill="#136142"/><rect x="140" y="118" width="58" height="5" rx="2.5" fill="#d3dad5"/><rect x="140" y="130" width="64" height="5" rx="2.5" fill="#d3dad5"/>
      <g class="onboarding-illustration-shield"><circle cx="196" cy="98" r="30" fill="none" stroke="#136142" stroke-width="10"/><circle cx="196" cy="98" r="23" fill="#fff" opacity=".55"/><path d="m217 120 28 28" stroke="#136142" stroke-width="12" stroke-linecap="round"/></g>
      <g class="onboarding-illustration-pin"><rect x="226" y="34" width="44" height="30" rx="9" fill="#e0a526"/><path d="M240 42h16v16l-8-5-8 5z" fill="#fff"/></g>
      <path class="onboarding-illustration-spark" d="M36 150v10M31 155h10M270 108v8M266 112h8" stroke="#25946a" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    alerts: `<svg viewBox="0 0 300 210" aria-hidden="true"><circle cx="150" cy="112" r="88" fill="#eef7f2"/>
      <rect x="150" y="62" width="112" height="34" rx="10" fill="#fff" stroke="#d8efe3" stroke-width="2"/><circle cx="168" cy="79" r="8" fill="#25946a"/><rect x="182" y="72" width="62" height="5" rx="2.5" fill="#136142"/><rect x="182" y="82" width="44" height="4" rx="2" fill="#d3dad5"/>
      <rect x="150" y="104" width="112" height="34" rx="10" fill="#fff" stroke="#d8efe3" stroke-width="2"/><circle cx="168" cy="121" r="8" fill="#e0a526"/><rect x="182" y="114" width="56" height="5" rx="2.5" fill="#136142"/><rect x="182" y="124" width="40" height="4" rx="2" fill="#d3dad5"/>
      <g class="onboarding-illustration-shield"><path d="M74 140V108a40 40 0 0 1 80 0v32l10 12H64z" fill="#136142"/><path d="M100 160a14 14 0 0 0 28 0" fill="#136142"/><rect x="108" y="56" width="12" height="12" rx="6" fill="#136142"/></g>
      <g class="onboarding-illustration-pin"><circle cx="146" cy="74" r="13" fill="#e0a526"/><text x="146" y="79" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-weight="800" font-size="14" fill="#fff">3</text></g>
      <path class="onboarding-illustration-spark" d="M46 70v10M41 75h10M270 160v8M266 164h8" stroke="#25946a" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    documents: `<svg viewBox="0 0 300 210" aria-hidden="true"><circle cx="150" cy="112" r="88" fill="#eef7f2"/>
      <rect x="78" y="40" width="96" height="128" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2" transform="rotate(-6 126 104)"/>
      <g transform="rotate(-6 126 104)"><rect x="92" y="58" width="44" height="34" rx="6" fill="#d8efe3"/><circle cx="114" cy="70" r="7" fill="#25946a"/><path d="M102 88c2-6 6-9 12-9s10 3 12 9" fill="#25946a"/><rect x="92" y="102" width="66" height="6" rx="3" fill="#136142"/><rect x="92" y="114" width="56" height="5" rx="2.5" fill="#d3dad5"/><rect x="92" y="124" width="62" height="5" rx="2.5" fill="#d3dad5"/><rect x="92" y="134" width="40" height="5" rx="2.5" fill="#d3dad5"/></g>
      <rect x="60" y="96" width="132" height="6" rx="3" fill="#25946a" opacity=".45"/>
      <g class="onboarding-illustration-shield"><path d="M200 70l32 12v24c0 22-15 35-32 41-17-6-32-19-32-41V82z" fill="#136142"/><path d="m186 108 10 10 18-20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g class="onboarding-illustration-pin"><rect x="216" y="140" width="34" height="28" rx="6" fill="#e0a526"/><path d="M223 140v-7a10 10 0 0 1 20 0v7" fill="none" stroke="#e0a526" stroke-width="4"/><circle cx="233" cy="154" r="3.5" fill="#fff"/></g>
      <path class="onboarding-illustration-spark" d="M48 60v10M43 65h10M264 54v8M260 58h8" stroke="#25946a" stroke-width="2.5" stroke-linecap="round"/></svg>`
  };
  // the small UI sketches beside a step ("2. Tap the heart" shows a card with a heart, like the real control)
  const ESM = {
    contact: `<svg viewBox="0 0 168 56" aria-hidden="true"><rect x="1" y="1" width="166" height="54" rx="10" fill="#fff" stroke="#e4e9e5"/><rect x="10" y="10" width="36" height="36" rx="7" fill="#d8efe3"/><rect x="54" y="12" width="60" height="5" rx="2.5" fill="#136142"/><rect x="54" y="21" width="40" height="4" rx="2" fill="#d3dad5"/>
      <rect x="54" y="32" width="32" height="14" rx="7" fill="#fff" stroke="#136142"/><rect x="90" y="32" width="38" height="14" rx="7" fill="#1faa59"/><rect x="132" y="32" width="28" height="14" rx="7" fill="#136142"/>
      <text x="70" y="41.5" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="6.5" font-weight="700" fill="#136142">Call</text><text x="109" y="41.5" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="6.5" font-weight="700" fill="#fff">WhatsApp</text><text x="146" y="41.5" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="6.5" font-weight="700" fill="#fff">Chat</text></svg>`,
    reply: `<svg viewBox="0 0 168 56" aria-hidden="true"><rect x="1" y="1" width="166" height="54" rx="10" fill="#fff" stroke="#e4e9e5"/><circle cx="20" cy="20" r="9" fill="#25946a"/><rect x="34" y="12" width="96" height="18" rx="9" fill="#eef7f2"/><rect x="42" y="18" width="62" height="5" rx="2.5" fill="#136142"/><rect x="70" y="34" width="88" height="14" rx="7" fill="#d8efe3"/><rect x="78" y="39" width="50" height="4" rx="2" fill="#136142"/></svg>`,
    heart: `<svg viewBox="0 0 168 56" aria-hidden="true"><rect x="1" y="1" width="166" height="54" rx="10" fill="#fff" stroke="#e4e9e5"/><rect x="10" y="9" width="54" height="38" rx="7" fill="#d8efe3"/><rect x="72" y="14" width="60" height="5" rx="2.5" fill="#136142"/><rect x="72" y="25" width="44" height="4" rx="2" fill="#d3dad5"/><rect x="72" y="35" width="30" height="4" rx="2" fill="#d3dad5"/><circle cx="148" cy="20" r="11" fill="#fff" stroke="#e4e9e5"/><path d="M148 26s-6-3.7-6-8a3.3 3.3 0 0 1 6-1.9 3.3 3.3 0 0 1 6 1.9c0 4.3-6 8-6 8z" fill="#c2413b"/></svg>`,
    save: `<svg viewBox="0 0 168 56" aria-hidden="true"><rect x="1" y="1" width="166" height="54" rx="10" fill="#f6f8f6" stroke="#e4e9e5"/><rect x="10" y="10" width="40" height="8" rx="4" fill="#d3dad5"/><rect x="56" y="10" width="34" height="8" rx="4" fill="#d3dad5"/><rect x="10" y="26" width="30" height="22" rx="5" fill="#e4e9e5"/><rect x="46" y="28" width="50" height="5" rx="2.5" fill="#d3dad5"/><rect x="46" y="38" width="36" height="4" rx="2" fill="#d3dad5"/>
      <rect x="98" y="8" width="64" height="20" rx="10" fill="#fff" stroke="#136142" stroke-width="1.5"/><path d="M107 13h7v11l-3.5-2.4-3.5 2.4z" fill="#136142"/><text x="139" y="21" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="7" font-weight="700" fill="#136142">Save search</text></svg>`,
    scan: `<svg viewBox="0 0 168 56" aria-hidden="true"><rect x="1" y="1" width="166" height="54" rx="10" fill="#eef7f2" stroke="#d8efe3"/><rect x="12" y="9" width="30" height="38" rx="5" fill="#fff"/><rect x="17" y="16" width="20" height="3" rx="1.5" fill="#136142"/><rect x="17" y="23" width="16" height="3" rx="1.5" fill="#d3dad5"/><rect x="17" y="30" width="18" height="3" rx="1.5" fill="#d3dad5"/><rect x="10" y="26" width="34" height="3" rx="1.5" fill="#25946a" opacity=".6"/><rect x="52" y="16" width="70" height="6" rx="3" fill="#136142"/><rect x="52" y="28" width="48" height="5" rx="2.5" fill="#bfd9cb"/><rect x="128" y="14" width="30" height="12" rx="6" fill="#fff"/><text x="143" y="22.5" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="6" font-weight="800" fill="#136142">From doc</text></svg>`,
    bell: `<svg viewBox="0 0 168 56" aria-hidden="true"><rect x="1" y="1" width="166" height="54" rx="10" fill="#fff" stroke="#e4e9e5"/><circle cx="22" cy="28" r="12" fill="#1faa59"/><path d="M17 29l3.5 3.5 7-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="42" y="18" width="80" height="6" rx="3" fill="#136142"/><rect x="42" y="30" width="62" height="5" rx="2.5" fill="#d3dad5"/><text x="150" y="25" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="7" fill="#7b877f">now</text></svg>`
  };
  const START = [['spaces', 'building', 'Spaces'], ['services', 'wrench', 'Services'], ['experiences', 'compass', 'Experiences'], ['memberships', 'badge', 'Memberships'], ['programs', 'grad', 'Programs'], ['health', 'medic', 'Health'], ['insurance', 'shield', 'Protection']];
  function emptyState({ art, title, sub, steps, mock, cta = '', chips = true, chipsTitle = 'Start searching' }) {
    return `<section class="empty-state">
      <div class="empty-state-text"><h2>${title}</h2><p class="empty-state-subtitle">${sub}</p>
        <ol class="empty-state-steps">${steps.map((t, i) => `<li><span class="empty-state-number">${i + 1}</span><div><b>${t}</b>${i === 1 && mock ? `<div class="empty-state-mock">${ESM[mock]}</div>` : ''}</div></li>`).join('')}</ol>
        ${cta ? `<div class="empty-state-actions">${cta}</div>` : ''}</div>
      <div class="empty-state-illustration">${ESA[art]}</div>
      ${chips ? `<div class="empty-state-start"><b>${chipsTitle}</b><div class="empty-state-chips">${START.map(([v, i, l]) => `<a href="${HREF.search}?v=${v}">${ico(i)}${l}</a>`).join('')}</div></div>` : ''}
    </section>`;
  }
  const ES = {
    home: () => emptyState({ art: 'home', title: 'Welcome to your account', sub: 'Everyone you contact on UpNow, their replies and the places you love — in one place.', steps: ['Find a space, service or provider across the seven verticals', 'Call, WhatsApp, email, chat or text the owner, manager or company', 'Follow every reply here and pick up where you left off'], mock: 'contact', cta: `<a class="btn btn-primary" href="${HREF.search}">${ico('search')}Start exploring</a><button class="btn btn-ghost" type="button" data-act="sample">Preview with sample activity</button>` }),
    enquiries: () => emptyState({ art: 'enquiries', title: 'You haven’t contacted anyone yet', sub: 'Enquiries keep track of every lister you reach — so you always know who replied.', steps: ['Open any listing you like', 'Call, WhatsApp, email, chat or text the lister', 'Come back here to see who replied and close it when you’re done'], mock: 'contact' }),
    messages: () => emptyState({ art: 'messages', title: 'No conversations yet', sub: 'Replies from listers come straight here — no digging through WhatsApp to find them.', steps: ['Contact a lister from any listing', 'Their replies appear here, next to the listing', 'Answer from here — it opens WhatsApp and keeps a copy'], mock: 'reply' }),
    saved: () => emptyState({ art: 'saved', title: 'You have no saved listings yet', sub: 'Saving helps you compare and come back to places faster.', steps: ['Browse listings', 'Tap the heart on the ones you like', 'Compare them side by side and add notes here'], mock: 'heart' }),
    searches: () => emptyState({ art: 'searches', title: 'You have no saved searches yet', sub: 'Saving a search helps you find the right place faster.', steps: ['Start a search with the filters you need', 'Select Save search', 'Get new matches on WhatsApp — and return here anytime'], mock: 'save' }),
    alerts: () => emptyState({ art: 'alerts', title: 'No alerts yet', sub: 'We tell you the moment something happens — never more than you choose.', steps: ['Contact a lister or save a search', 'We alert you when they reply or something new matches', 'Choose WhatsApp, push or email in the panel'], mock: 'bell', chips: false }),
    documents: () => emptyState({ art: 'documents', title: 'Keep your documents ready', sub: 'Owners and providers often ask for your ID before a contract or sign-up. Upload once and it’s ready when you need it.', steps: ['Upload your Emirates ID or passport', 'We read the details — you just check them', 'Share it yourself when a lister asks — never automatically'], mock: 'scan', chips: false })
  };


  /* ---------- messages — one conversation per enquiry, linked to its listing ---------- */
  function logOf(m) {
    const { r, S } = m;
    return [{ t: r.t, out: true, text: r.msg || typeLabel[r.type] || 'Enquiry' },
      ...m.ev.filter(e => e.text).map(e => ({ t: e.t, text: e.text })), ...(S.log || [])].filter(x => x.t <= now()).sort((a, b) => a.t - b.t);
  }
  function lastIn(m) { return m.ev.filter(e => e.text && e.t <= now()).pop(); }
  function isUnreadMsg(m) { const e = lastIn(m); return !!e && e.t > ((D.seen || {})[m.r.id] || 0); }
  function unreadMsgs() { return all().filter(isUnreadMsg).length; }
  const when = ts => { const d = new Date(ts), t = new Date(); return d.toDateString() === t.toDateString() ? 'Today ' + hm(d) : now() - ts < 6 * 864e5 ? DAY[d.getDay()] + ' ' + hm(d) : d.getDate() + ' ' + MON[d.getMonth()]; };
  // each lister keeps one colour, so conversations are told apart at a glance
  const hueOf = n => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const mav = (n, cls = '') => `<span class="message-avatar ${cls}" style="--hue:${hueOf(n)}">${esc(initials(n))}</span>`;
  const dayLabel = ts => { const d = new Date(ts), t = new Date(), y = new Date(t); y.setDate(t.getDate() - 1);
    return d.toDateString() === t.toDateString() ? 'Today' : d.toDateString() === y.toDateString() ? 'Yesterday' : `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
  function messages(id) {
    const L = all().sort((a, b) => (logOf(b).pop() || b.r).t - (logOf(a).pop() || a.r).t);
    const sub = `<header class="account-header"><div><h1>Messages</h1><p>Every conversation is linked to its listing, so nothing gets lost.</p></div></header>`;
    if (!L.length) return sub + ES.messages();
    const cur = L.find(m => m.r.id === id) || (matchMedia('(max-width: 860px)').matches ? null : L[0]);
    if (cur) { D.seen = D.seen || {}; D.seen[cur.r.id] = now(); save(); }
    const list = L.map(m => { const last = logOf(m).pop(), unread = isUnreadMsg(m) && cur !== m;
      return `<a href="#messages=${m.r.id}" class="message-row ${cur === m ? 'is-on' : ''} ${unread ? 'is-unread' : ''}">${mav(m.r.provider)}
      <span><span class="message-row-text"><b>${esc(m.r.provider)}</b><em>${when((last || m.r).t)}</em></span><small class="message-row-listing">${srcTag(m.r)}<span>${esc(m.r.title)}</span></small><small class="message-row-last">${last ? (last.out ? 'You: ' : '') + esc(last.text) : ''}</small></span>${unread ? '<i aria-label="Unread"></i>' : ''}</a>`; }).join('');
    let pane = '';
    if (cur) {
      const { r, who } = cur, l = byId(r.lid);
      const quick = cur.stage === 'closed' ? [] : cur.replyEv ? ['Thanks! When can I call you?', 'Can you share more photos?', 'Is the price negotiable?'] : ['Is it still available?', 'Could you call me back?'];
      // the conversation, with a date line whenever the day changes; their messages carry their avatar
      let lastDay = '';
      const bubbles = logOf(cur).map(x => { const dl = dayLabel(x.t), sep = dl !== lastDay ? `<div class="message-day"><span>${dl}</span></div>` : ''; lastDay = dl;
        return sep + (x.out
          ? `<div class="message-bubble is-out">${esc(x.text)}<small>${hm(new Date(x.t))}${x.via && x.via !== SITE.name ? ' · via ' + esc(x.via) : ''}<span class="message-ticks" aria-label="Delivered">${ico('check')}${ico('check')}</span></small></div>`
          : `<div class="message-in">${mav(r.provider, 'is-sm')}<div class="message-bubble">${esc(x.text)}<small>${hm(new Date(x.t))}</small></div></div>`); }).join('');
      pane = `<section class="message-pane"><header class="message-pane-header"><a class="message-back" href="#messages" aria-label="All messages">${ico('chevL')}</a>${mav(r.provider, 'is-md')}<span><b>${esc(r.provider)}</b><small>${esc(orgOf(r) === r.provider ? 'Lister' : orgOf(r))} · replies in ~${r.reply || 10}&nbsp;min</small></span>
          <a class="message-icon-btn is-whatsapp" target="_blank" rel="noopener" href="${waHref(r.pphone, `Hi ${who}, about ${r.title} (Ref ${r.ref}) on ${SITE.name}.`)}" data-walog="${r.id}" aria-label="WhatsApp" title="WhatsApp">${ico('wa')}</a><a class="btn btn-outline btn-sm" href="tel:${esc(r.pphone)}" data-calllog="${r.id}">${ico('phone')}<span>Call</span></a></header>
        <a class="message-context" href="#enquiry=${r.id}">${thumb(r)}<span><b>${esc(r.title)}</b><small>Ref ${esc(r.ref)}</small></span>${pill(cur.pill)}${ico('chevR')}</a>
        <div class="message-list">${bubbles}</div>
        ${quick.length ? `<div class="message-quick"><span>${ico('spark')}Suggested</span>${quick.map(q => `<button type="button" class="chip" data-quick="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
        ${cur.stage === 'closed' ? `<p class="message-closed">${ico('check')}This enquiry is closed — the conversation is kept here for reference.</p>` : `<form class="message-compose" data-send="${r.id}"><a class="message-plus" href="${l ? HREF.listing + '?id=' + r.lid : '#'}" aria-label="Open listing" title="Open listing">${ico('plus')}</a><input name="t" placeholder="Write a message — it opens WhatsApp and keeps a copy here" autocomplete="off" aria-label="Message"><button class="message-send" type="submit" aria-label="Send">${ico('arrow')}</button></form>`}</section>`;
    } else pane = `<section class="message-pane is-empty">${ico('msg')}<b>Pick a conversation</b></section>`;
    return `${sub}<div class="message-wrap ${id ? 'has-current' : ''}"><aside class="message-rows">${list}</aside>${pane}</div>`;
  }

  /* ---------- documents — the onboarding reader: upload → "Reading your document…" → check the details → ✓ ----------
     Same components as Verify in onboarding (css/pages/join.css). Reading a document is not verification: the customer
     checks what we filled in. Documents stay in the account and are never sent to an agent automatically. */
  const IDOCS = [
    { id: 'eid', t: 'Emirates ID', hint: 'Front and back', icon: 'user', fields: [['fullName', 'Full name'], ['eidNo', 'ID number'], ['nationality', 'Nationality'], ['eidExp', 'Expiry date', 'date']] },
    { id: 'passport', t: 'Passport', hint: 'Photo page', icon: 'globe', fields: [['passNo', 'Passport no.'], ['passCountry', 'Issuing country'], ['passExp', 'Expiry date', 'date']] },
    { id: 'visa', t: 'Residence visa', hint: 'If you’re a resident — often asked for with your ID', icon: 'flag', fields: [['visaNo', 'Visa / file no.'], ['visaSponsor', 'Sponsor'], ['visaExp', 'Expiry date', 'date']] },
    { id: 'tenancy', t: 'Current tenancy contract', hint: 'Useful when you rent a new place', icon: 'key', fields: [['tenProp', 'Property', 'wide'], ['tenEjari', 'Ejari no.'], ['tenEnd', 'Contract ends', 'date']] }
  ];
  const idocs = () => D.idoc || (D.idoc = {});
  const isoD = v => { if (!v) return ''; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; const t = Date.parse(v); if (isNaN(t)) return ''; const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const niceD = v => { const i = isoD(v); if (!i) return v || ''; const [y, m, d] = i.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const daysTo = v => Math.round((new Date(isoD(v)) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  const expOf = doc => { const f = doc.fields.find(x => x[2] === 'date'), v = f && (idocs()[doc.id] || {}).d; return v ? v[f[0]] : ''; };
  // documents expiring within 60 days (or expired) — shown as a banner and a sidebar badge
  const docsDue = () => IDOCS.filter(doc => { const f = idocs()[doc.id], e = f && f.ok && expOf(doc); return e && daysTo(e) <= 60; });
  // demo reader: what a scan returns. '' = not on the document; '?' = unsure, please check
  function readIdoc(id) {
    const u = user() || {}, name = u.name || 'Aisha Al Mansoori', T = new Date(), y = n => { const d = new Date(T); d.setFullYear(d.getFullYear() + n); return isoD(d); };
    const soon = (() => { const d = new Date(T.getTime() + 40 * 864e5); return isoD(d); })();
    return ({
      eid: { fullName: name, eidNo: '784-1990-4417291-3', nationality: '?United Arab Emirates', eidExp: soon },
      passport: { passNo: 'N4417291', passCountry: '?United Kingdom', passExp: y(5) },
      visa: { visaNo: '201/2023/7712093', visaSponsor: 'Self', visaExp: y(1) },
      tenancy: { tenProp: '?Marina Gate 2, Apt 1804', tenEjari: '', tenEnd: y(1) }
    })[id] || {};
  }
  function setIdoc(id, file) {
    const kb = file.size / 1024, rec = { name: file.name, size: kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB', state: 'scan', ok: false, d: {}, src: {}, orig: {}, t: now() };
    idocs()[id] = rec; A.docOpen = A.docOpen || {}; A.docOpen[id] = true; save(); render();
    const keep = data => { rec.data = data; try { save(); } catch (e) { rec.data = ''; save(); } };
    if (file.size < 1.5e6) { const fr = new FileReader(); fr.onload = () => keep(fr.result); fr.readAsDataURL(file); }
    setTimeout(() => readIdocInto(id), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1700);
  }
  function readIdocInto(id) {
    const doc = IDOCS.find(x => x.id === id), f = idocs()[id]; if (!doc || !f || f.state !== 'scan') return;
    const got = readIdoc(id);
    doc.fields.forEach(([k, , kind]) => { let v = got[k] == null ? '' : String(got[k]); const unsure = v.startsWith('?'); if (unsure) v = v.slice(1); if (kind === 'date') v = isoD(v); f.d[k] = v; f.orig[k] = v; f.src[k] = !v ? 'missing' : unsure ? 'check' : 'doc'; });
    f.state = 'read'; save(); if (route().s === 'documents') render();
  }
  // a detail read from the document: editable, with where it came from (as in onboarding)
  function idocField(id, [k, label, kind]) {
    const f = idocs()[id], v = f.d[k] || '', src = f.src[k], edited = src && f.orig[k] !== undefined && f.orig[k] !== v;
    const tag = !src ? '' : edited ? `<em class="onboarding-tag is-edit">${ico('pen')}Edited by you</em>` : src === 'missing' && !v ? `<em class="onboarding-tag is-miss">Not on the document — please add</em>`
      : src === 'check' ? `<em class="onboarding-tag is-check">Double-check this</em>` : src === 'missing' ? `<em class="onboarding-tag is-edit">${ico('pen')}Added by you</em>` : `<em class="onboarding-tag is-from-document">${ico('doc')}From your document</em>`;
    const bad = kind === 'date' && v && daysTo(v) < 0;
    return `<div class="field onboarding-field onboarding-extracted-field ${kind === 'wide' ? 'is-wide' : ''} ${bad ? 'has-error' : ''} ${src === 'missing' && !v ? 'is-missing' : ''} ${src === 'check' && !edited ? 'is-check' : ''}">
      <label for="id-${k}">${esc(label)}${tag}</label>${kind === 'date' ? `<input type="date" class="onboarding-date" id="id-${k}" data-ik="${id}:${k}" value="${esc(isoD(v))}">` : `<input id="id-${k}" data-ik="${id}:${k}" value="${esc(v)}">`}${bad ? `<span class="onboarding-error">${ico('x')}This document has expired — upload a current one</span>` : ''}</div>`;
  }
  function idocCard(doc) {
    const f = idocs()[doc.id], st = f.state, open = (A.docOpen || {})[doc.id];
    const replace = `<label class="onboarding-document-replace">Replace<input type="file" accept="image/*,.pdf" data-idoc="${doc.id}" hidden></label>`;
    if (st === 'read' && f.ok && !open) {
      const e = expOf(doc), soon = e && daysTo(e) <= 60;
      const vals = doc.fields.map(([k, , kind]) => kind === 'date' ? f.d[k] && 'valid to ' + niceD(f.d[k]) : f.d[k]).filter(Boolean).slice(0, 3).join(' · ');
      return `<div class="onboarding-document is-done is-compact ${soon ? 'is-soon' : ''}"><div class="onboarding-document-header"><i>${ico(soon ? 'clock' : 'check')}</i><span><b>${esc(doc.t)}</b><small>${esc(vals)}</small></span>
        ${soon ? `<em class="account-document-expiry">${daysTo(e) < 0 ? 'Expired' : 'Expires in ' + daysTo(e) + ' days'}</em>` : ''}
        ${f.data ? `<a class="text-link" href="${f.data}" download="${esc(f.name)}">Download</a>` : ''}<button type="button" class="text-link" data-idocedit="${doc.id}">Edit</button>
        ${soon ? `<label class="btn btn-primary btn-sm">${ico('upload')}Upload renewed<input type="file" hidden accept="image/*,.pdf" data-idoc="${doc.id}"></label>` : ''}</div></div>`;
    }
    const head = `<div class="onboarding-document-header"><i>${ico('doc')}</i><span><b>${esc(doc.t)}</b><small>${esc(f.name)} · ${esc(f.size)}</small></span>${st === 'scan' ? '<em class="is-scan">Reading…</em>' : replace}</div>`;
    let body = '';
    if (st === 'scan') body = `<div class="onboarding-scan" aria-live="polite"><div class="onboarding-scan-document"><i></i><i></i><i></i><i></i><span class="onboarding-scan-beam"></span></div><div><b>Reading your document…</b><small>A few seconds</small></div></div>`;
    if (st === 'read') {
      const found = doc.fields.filter(([k]) => f.src[k] && f.src[k] !== 'missing').length;
      body = `<div class="onboarding-extracted"><p class="onboarding-extracted-header">${ico('spark')}<span>We filled in ${found} of ${doc.fields.length} details — check them against your document.</span></p>
        <div class="onboarding-extracted-grid">${doc.fields.map(x => idocField(doc.id, x)).join('')}</div>
        <label class="onboarding-extracted-confirm"><input type="checkbox" data-idocok="${doc.id}" ${f.ok ? 'checked' : ''}><span>Everything matches my document</span></label>
        <div class="account-id-document-footer"><button type="button" class="text-link" data-act="deldoc" data-id="${doc.id}">Remove document</button></div></div>`;
    }
    return `<div class="onboarding-document">${head}${body}</div>`;
  }
  function documents() {
    const have = IDOCS.filter(d => idocs()[d.id]), missing = IDOCS.filter(d => !idocs()[d.id]);
    const main = !idocs().eid ? `<label class="onboarding-main-upload"><input type="file" accept="image/*,.pdf" data-idoc="eid" hidden><i>${ico('doc')}</i><span><b>Upload your Emirates ID</b><small>A photo or PDF — we’ll read it and fill in the details for you</small></span><span class="btn btn-primary">Choose file</span></label>` : '';
    return `<header class="account-header"><div><h1>Documents</h1>${have.length ? '<p>Ready for when a lister asks — you share them yourself.</p>' : ''}</div></header>
      ${have.length ? '' : ES.documents()}
      <div class="account-id-documents">${main}${have.map(idocCard).join('')}</div>
      ${missing.filter(d => d.id !== 'eid' || idocs().eid).length ? `<section class="account-section"><div class="account-section-header"><h2>${have.length ? 'Also useful' : 'Listers may also ask for'}</h2></div>
        <div class="onboarding-needs">${missing.filter(d => d.id !== 'eid').map(d => `<div class="onboarding-need"><i>${ico(d.icon)}</i><span><b>${esc(d.t)}</b><small>${esc(d.hint)}</small></span><em class="onboarding-need-tag">Optional</em>
          <label class="btn btn-outline btn-sm onboarding-need-upload">${ico('upload')}Upload<input type="file" accept="image/*,.pdf" data-idoc="${d.id}" hidden></label></div>`).join('')}</div></section>` : ''}
      <section class="account-box document-health"><div class="document-health-header"><i>${ico('medic')}</i><span><b>Health records</b><small>Private. Only you and the clinics you choose can see these. Every view is logged.</small></span></div>
        <div class="document-health-body">${ico('lock')}<small>No health records yet — reports and results that clinics share with you will appear here.</small></div></section>
      ${have.length ? `<p class="account-footer">${ico('lock')}Reading a document isn’t verification — you check the details. ${esc(SITE.name)} never sends your documents to a lister.</p>` : ''}`;
  }

  /* ---------- small dialogs ---------- */
  function ask({ title, text = '', label, value = '', placeholder = '', ok = 'Save', danger, fields }, done) {
    const F = fields || [{ name: 'v', label, value, placeholder }];
    openModal(`<form class="account-modal" id="accAsk"><div class="account-modal-header"><div><h3>${title}</h3>${text ? `<p>${text}</p>` : ''}</div><button class="close-btn" type="button" data-close aria-label="Close">${ico('x')}</button></div>
      ${F.map(f => `<div class="field"><label for="account-${f.name}">${esc(f.label)}</label>${f.options ? `<select id="account-${f.name}" name="${f.name}">${f.options.map(o => `<option ${o === f.value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : f.area ? `<textarea id="account-${f.name}" name="${f.name}" rows="4" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>` : `<input id="account-${f.name}" name="${f.name}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}" ${f.type ? `type="${f.type}"` : ''}>`}</div>`).join('')}
      <button class="btn ${danger ? 'account-danger' : 'btn-primary'} account-modal-submit">${ok}</button></form>`, 'account-modal-wrap');
    const f = document.getElementById('accAsk'), i = f.querySelector('input,textarea'); if (i) i.focus();
    f.onsubmit = e => { e.preventDefault(); const v = Object.fromEntries(new FormData(f).entries()); if (done(v) !== false) closeModal(); };
  }

  /* ---------- sample activity (empty accounts, for a preview) ----------
     one enquiry per channel, across the verticals: a chat the provider replied to, an email with no reply yet,
     an SMS just sent, a call to follow up, a WhatsApp you're in touch on, and an email the provider closed */
  function sample(quiet) {
    const used = new Set(), pickL = (...vs) => { for (const v of vs) { const l = LISTINGS.find(x => x.v === v && x.img.length && !used.has(x.id)); if (l) { used.add(l.id); return l; } } return null; };
    const L = [pickL('spaces'), pickL('services', 'spaces'), pickL('experiences', 'spaces'), pickL('health', 'spaces'), pickL('insurance', 'spaces'), pickL('memberships', 'programs', 'spaces')];
    if (L.some(x => !x)) return toast('Not enough listings for a preview');
    const mk = (l, type, t, msg) => { const O = offerOf(l.v, l.cat); return { id: 'Q' + (t.toString(36) + Math.random().toString(36).slice(2, 5)).toUpperCase(), type, lid: l.id, t, title: l.title, img: l.img[0], cat: l.cat, catLabel: O.label, area: areaName(l.loc), building: l.building, spec: U.specOf(l), provider: l.provider.name, org: l.provider.org, pphone: l.provider.phone, reply: l.provider.reply, ref: l.ref, msg }; };
    const T = now();
    const recs = [mk(L[0], 'chat', T - 50 * 60000, 'Hi, is this still available? Is parking included?'), mk(L[1], 'email', T - 40 * 60000, 'Hello, do you cover Dubai Marina, and how soon can you start?'), mk(L[2], 'sms', T - 9 * 60000, 'Hi, is this available this weekend for 4 people?'),
      mk(L[3], 'call', T - 3 * 3600000), mk(L[4], 'whatsapp', T - 26 * 3600000, 'Hi, I’d like to know what’s covered.'), mk(L[5], 'email', T - 6 * 864e5, 'Hi, is this still open?')];
    const set = (r, S) => { D.lead[r.id] = S; };
    set(recs[0], { ev: [{ k: 'reply', t: recs[0].t + 7 * 60000, text: 'Hi! Yes, it’s available and one covered parking bay is included. Call me anytime.' }] });
    set(recs[1], { ev: [] });
    set(recs[2], { ev: [] });
    set(recs[3], { ev: [] });
    set(recs[4], { ev: [], heard: true });
    set(recs[5], { ev: [{ k: 'reply', t: recs[5].t + 15 * 60000, text: 'Thanks for your interest! Let me check and come back to you.' }, { k: 'closed', t: recs[5].t + 2 * 864e5, text: 'Sorry — this one is no longer available.' }] });
    store.set('leads', [...recs, ...leads()]);
    const ids = [L[0], L[1], L[2], ...LISTINGS.filter(l => l.img.length && !used.has(l.id)).slice(0, 3)].map(l => l.id);
    ids.forEach(id => favs.add(id)); store.set('favs', [...favs]);
    // the saved search goes where most homes are listed, so the preview never shows "0 listings"
    const byArea = {}; LISTINGS.filter(l => l.v === 'spaces' && l.cat === 'residential').forEach(l => byArea[l.loc] = (byArea[l.loc] || 0) + 1);
    const q = U.toQuery({ ...U.blankState('spaces', 'residential'), loc: [Object.keys(byArea).sort((a, b) => byArea[b] - byArea[a])[0] || 'dubai-marina'] });
    if (!alerts().includes(q)) setAlerts([...alerts(), q]);
    if (!Object.keys(idocs()).length) ['eid', 'passport', 'visa'].forEach(id => { const got = readIdoc(id), d = {}, src = {}; IDOCS.find(x => x.id === id).fields.forEach(([k, , kind]) => { const v = String(got[k] || '').replace(/^\?/, ''); d[k] = kind === 'date' ? isoD(v) : v; src[k] = 'doc'; }); idocs()[id] = { name: id + '.pdf', size: '240 KB', state: 'read', ok: true, d, src, orig: { ...d }, t: T }; });
    if (!familyOf().length) familyOf().push({ id: 'f' + T, name: 'Sami ' + ((user() || {}).last || ''), rel: 'Child', age: '7' });
    if (!placesOf().length) placesOf().push({ id: 'p' + T, label: 'Home', addr: (L[0].building ? L[0].building + ', ' : '') + areaName(L[0].loc) });
    store.set('recent', [...ids.slice(2), ...(store.get('recent') || [])].slice(0, 12));
    D.seeded = true; save(); if (!quiet) toast('Sample activity added'); render();
  }

  /* ---------- events ---------- */
  // on this page, Saved / My enquiries (header, account menu, phone tabs) open the sections instead of the side drawers
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open="saved"],[data-open="enq"]'); if (!o || !user()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    document.querySelectorAll('.account-menu').forEach(m => m.classList.remove('is-open'));
    go(o.dataset.open === 'saved' ? 'saved' : o.dataset.enq ? 'enquiry=' + o.dataset.enq : 'enquiries'); scrollTo({ top: 0, behavior: 'smooth' });
  }, true);

  root.addEventListener('input', e => {
    const k = e.target.hasAttribute('data-enq-search') ? 'data-enq-search' : e.target.hasAttribute('data-follow-search') ? 'data-follow-search' : ''; if (!k) return;
    if (k === 'data-enq-search') A.eq = e.target.value; else A.fq = e.target.value;
    const at = e.target.selectionStart; render();
    const i = root.querySelector('[' + k + ']'); if (i) { i.focus(); i.setSelectionRange(at, at); }
  });
  // following or unfollowing from Saved redraws the tab
  document.addEventListener('upnow:follow', () => { if (route().s === 'saved') render(); });
  root.addEventListener('input', e => { const k = e.target.dataset.ik; if (!k || e.target.type === 'date') return; const [id, f] = k.split(':'); idocs()[id].d[f] = e.target.value; save(); });

  root.addEventListener('submit', e => {
    const f = e.target; if (!f.dataset.send) return; e.preventDefault();
    const t = f.t.value.trim(); if (!t) return;
    const m = model(leads().find(x => x.id === f.dataset.send));
    window.open(waHref(m.r.pphone, t), '_blank', 'noopener'); logLine(m.r.id, t, 'WhatsApp'); save(); render();
  });

  root.addEventListener('click', e => {
    const de = e.target.closest('[data-idocedit]'); if (de) { A.docOpen = A.docOpen || {}; A.docOpen[de.dataset.idocedit] = true; render(); return; }
    const qk = e.target.closest('[data-quick]'); if (qk) { const i = root.querySelector('.message-compose input'); if (i) { i.value = qk.dataset.quick; i.focus(); } return; }
    const mo = e.target.closest('[data-more]'); if (mo) { (A.emore = A.emore || {})[mo.dataset.more] = true; render(); return; }
    const sf = e.target.closest('[data-saved-filter]'); if (sf) { A.stab = 'items'; A.sv = 'all'; A.sstat = sf.dataset.savedFilter; }
    const sv = e.target.closest('[data-sview]'); if (sv) { D.sview = sv.dataset.sview; save(); render(); return; }
    const tab = e.target.closest('[data-tab]'); if (tab) { A[tab.dataset.tab] = tab.dataset.v; render(); return; }
    const rd = e.target.closest('[data-read]'); if (rd && !D.read.includes(rd.dataset.read)) { D.read.push(rd.dataset.read); save(); }
    // contacting the agent from here is logged on the enquiry, like the provider's timeline
    const wl = e.target.closest('[data-walog],[data-calllog]'); if (wl) { logLine(wl.dataset.walog || wl.dataset.calllog, wl.dataset.walog ? 'WhatsApp message' : 'You called', wl.dataset.walog ? 'WhatsApp' : 'Phone'); save(); setTimeout(render, 300); return; }
    const tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) { location.hash = tr.dataset.href; return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.dataset.id, S = id && (D.lead[id] = D.lead[id] || {});
    const M = () => model(leads().find(x => x.id === id));
    const act = {
      sample,
      withdraw: () => withdrawModal(id),
      heard: () => { S.heard = true; logLine(id, 'You confirmed you’re in touch'); save(); render(); toast('Great — we’ll keep it in your enquiries'); },
      noanswer: () => { S.heard = false; logLine(id, 'No answer'); save(); render(); },
      nudge: () => { const m = M(); S.nudged = now(); logLine(id, `Reminder sent to ${orgOf(m.r)}`); save(); render(); toast(`We’ve reminded ${m.who} — most listers reply within the hour`); },
      report: () => ask({ title: 'Report a problem', text: 'Our team reviews every report within one working day.', fields: [{ name: 'why', label: 'What happened?', area: true, placeholder: 'e.g. asked me to pay before I saw it' }], ok: 'Send report' }, () => toast('Thanks — we’ll look into it')),
      compare: compareModal,
      enqreset: () => { A.ev = 'all'; A.ech = 'all'; A.eq = ''; render(); },
      delphoto: () => { delete D.photo; save(); render(); toast('Photo removed'); },
      fmore: () => { A.fmore = true; render(); },
      savedreset: () => { A.sv = 'all'; A.sstat = 'all'; render(); },
      heardall: () => { all().filter(m => m.stage === 'direct' && m.S.heard !== false).forEach(m => { const S2 = D.lead[m.r.id] = D.lead[m.r.id] || {}; S2.heard = true; logLine(m.r.id, 'You confirmed you’re in touch'); }); save(); render(); toast('Updated'); },
      deldoc: () => { delete idocs()[id]; save(); render(); toast('Removed'); },
      delsearch: () => { setAlerts(alerts().filter(q => q !== b.dataset.q)); delete D.alert[b.dataset.q]; save(); render(); toast('Saved search deleted'); },
      readall: () => { D.read = [...new Set([...D.read, ...feed().map(n => n.id)])]; save(); render(); },
      addfamily: () => ask({ title: 'Add a family member', text: 'Used when you enquire for them — never shared on its own.', fields: [{ name: 'n', label: 'Name', placeholder: 'e.g. Lina' }, { name: 'r', label: 'Relationship', options: ['Child', 'Spouse', 'Parent', 'Other'], value: 'Child' }, { name: 'a', label: 'Age (optional)', type: 'number', placeholder: 'e.g. 7' }], ok: 'Add' }, v => { if (!v.n.trim()) return false; familyOf().push({ id: 'f' + now(), name: v.n.trim(), rel: v.r, age: v.a.trim() }); save(); render(); toast('Family member added'); }),
      delfamily: () => { D.family = familyOf().filter(m => m.id !== id); save(); render(); },
      addplace: () => ask({ title: 'Add an address', text: 'Only shared when you send it to a lister.', fields: [{ name: 'l', label: 'Label', options: ['Home', 'Work', 'Other'], value: placesOf().some(a => a.label === 'Home') ? 'Work' : 'Home' }, { name: 'a', label: 'Building and area', placeholder: 'e.g. Marina Gate 2, Dubai Marina' }], ok: 'Add' }, v => { if (!v.a.trim()) return false; placesOf().push({ id: 'p' + now(), label: v.l, addr: v.a.trim() }); save(); render(); toast('Address saved'); }),
      delplace: () => { D.places = placesOf().filter(a => a.id !== id); save(); render(); },
      editname: () => { const u = user(); ask({ title: 'Your name', text: 'Shown to listers when you contact them.', fields: [{ name: 'f', label: 'First name', value: u.first }, { name: 'l', label: 'Last name', value: u.last }] }, v => { if (!v.f.trim()) return false; U.auth.setName(v.f.trim(), v.l.trim()); render(); toast('Name updated'); }); },
      editemail: () => { const u = user(); ask({ title: u.email ? 'Change email' : 'Add email', fields: [{ name: 'e', label: 'Email', type: 'email', value: u.email, placeholder: 'you@email.com' }] }, v => { if (!/^\S+@\S+\.\S+$/.test(v.e)) return false; u.email = v.e.trim(); store.set('user', u); render(); toast('Email saved'); }); },
      export: () => {
        const data = { exported: new Date().toISOString(), account: user(), saved: savedList(), family: familyOf(), addresses: placesOf(), enquiries: leads(), progress: D.lead, searches: alerts(), recentlyViewed: store.get('recent') || [], notifications: D.notify, privacy: D.privacy };
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = `${SITE.name.toLowerCase()}-my-data.json`; a.click(); toast('Your data is downloading');
      },
      signout: () => { U.auth.signOut(); location.href = HREF.home; },
      delete: () => ask({ title: 'Delete your account?', text: 'This removes your account, saved listings, lists, enquiries and alerts from ' + esc(SITE.name) + '. It can’t be undone. Listers you already contacted keep their own conversation with you.', fields: [{ name: 'c', label: 'Type DELETE to confirm', placeholder: 'DELETE' }], ok: 'Delete my account', danger: true }, v => {
        if (v.c.trim().toUpperCase() !== 'DELETE') return false;
        const u = user(), acc = store.get('accounts') || {}; Object.keys(acc).forEach(k => { if (acc[k] && ((u.phone && acc[k].phone === u.phone) || (u.email && acc[k].email === u.email))) delete acc[k]; });
        store.set('accounts', acc); ['favs', 'leads', 'recent', 'dash', 'me'].forEach(k => store.set(k, null)); setAlerts([]);
        U.auth.signOut(); location.href = HREF.home;
      })
    }[b.dataset.act];
    if (act) { e.preventDefault(); act(); }
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.pick) { t.checked ? (A.pick.size < 3 ? A.pick.add(t.dataset.pick) : (t.checked = false, toast('Compare up to 3 at a time'))) : A.pick.delete(t.dataset.pick); render(); return; }
    if (t.hasAttribute('data-photo') && t.files && t.files[0]) { setPhoto(t.files[0]); t.value = ''; return; }
    if (t.hasAttribute('data-saved-status')) { A.sstat = t.value; render(); return; }
    if (t.hasAttribute('data-saved-sort')) { A.ssort = t.value; render(); return; }
    if (t.dataset.afreq) { alertMeta(t.dataset.afreq).freq = t.value; save(); render(); toast(t.value === 'paused' ? 'Alerts paused' : 'Alert frequency updated'); return; }
    if (t.dataset.ach) { alertMeta(t.dataset.ach).ch = t.value; save(); return; }
    if (t.dataset.pref) { const p = D.notify[t.dataset.pref]; p.ch = t.checked ? [...new Set([...p.ch, t.dataset.ch])] : p.ch.filter(c => c !== t.dataset.ch); p.on = p.ch.length > 0; save(); return; }
    if (t.hasAttribute('data-quiet')) { D.quiet = t.checked; save(); return; }
    if (t.dataset.priv) { D.privacy[t.dataset.priv] = t.checked; if (t.dataset.priv === 'history' && !t.checked) store.set('recent', []); save(); toast(t.checked ? 'Turned on' : 'Turned off'); return; }
    if (t.dataset.prefs) { U.prefs[t.dataset.prefs] = t.value; store.set('prefs', U.prefs); location.reload(); return; }
    if (t.dataset.idoc && t.files && t.files[0]) { setIdoc(t.dataset.idoc, t.files[0]); t.value = ''; return; }
    if (t.dataset.idocok) { const f = idocs()[t.dataset.idocok], doc = IDOCS.find(x => x.id === t.dataset.idocok);
      if (t.checked && doc.fields.some(([k]) => !String(f.d[k] || '').trim())) { t.checked = false; toast('Fill in the empty details first'); return; }
      f.ok = t.checked; if (f.ok) (A.docOpen || {})[doc.id] = false; save(); render(); if (f.ok) toast(doc.t + ' saved'); return; }
    if (t.dataset.ik) { const [id, k] = t.dataset.ik.split(':'); idocs()[id].d[k] = t.value; save(); render(); return; }
    if (t.dataset.check) { const c = D.check[t.dataset.check] = D.check[t.dataset.check] || [], i = +t.dataset.i; t.checked ? c.push(i) : c.splice(c.indexOf(i), 1); save(); }
  });

  // dialogs above wire their own handler on the shared scrim — drop it when the dialog closes
  document.addEventListener('upnow:modal-closed', () => { if (asked && !user()) { location.href = HREF.home; return; } const sc = document.querySelector('.scrim'); if (sc) { sc.onclick = null; sc.onchange = null; } });
  addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
  document.addEventListener('upnow:auth', () => { reloadD(); render(); });
  // removing a heart elsewhere on the page (data-fav) updates the shortlist
  document.addEventListener('click', e => { if (e.target.closest('[data-fav]')) setTimeout(render, 0); });
  render();
})();
