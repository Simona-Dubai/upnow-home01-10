/* Customer account — one page, sections chosen by the URL hash:
   #overview (Home) · #enquiries (#enquiry=ID for one enquiry) · #messages (#messages=ID) · #saved · #documents · #alerts · #profile.
   Owners, managers and companies list across Spaces, Services, Experiences, Memberships, Programs, Health and Protection;
   customers contact them directly by phone, WhatsApp, email, chat or SMS. Each contact becomes a lead in the provider's
   dashboard (New → Contacted → Won / Lost); here the customer follows the reply, answers, and closes the enquiry.
   There are no viewing requests, bookings or payments on UpNow, and no prices on the account.
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
  const shortSlot = ts => { const d = new Date(ts); return `${DAY[d.getDay()]} ${hm(d)}`; };
  const mins = ms => Math.max(1, Math.round(ms / 60000));
  const ago = ts => { const m = Math.round((now() - ts) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const inDays = ts => { const d = Math.round((new Date(ts).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5); return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d < 0 ? Math.abs(d) + ' d ago' : 'in ' + d + ' days'; };

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
    const role = lease ? 'agent' : 'provider', Role = lease ? 'Agent' : 'Provider';
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
      talking: replyEv ? [Role + ' replied', 'is-info'] : ['In touch', 'is-info'],
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
  function feed() {
    const out = [];
    all().forEach(m => {
      const { r } = m, at = '#enquiry=' + r.id;
      if (m.replyEv) out.push({ id: 'rep' + r.id + m.replyEv.t, kind: 'enq', icon: 'msg', tone: 'info', t: m.replyEv.t, title: `${r.provider} replied`, text: `${r.title} — “${m.replyEv.text}”`, go: '#messages=' + r.id });
      if (m.late) out.push({ id: 'late' + r.id, kind: 'enq', icon: 'clock', tone: 'amber', t: r.t + SLA, title: `No reply yet from ${m.who}`, text: `${r.title} — nudge them or try another channel.`, go: at });
      if (m.closedEv) out.push({ id: 'cls' + r.id, kind: 'enq', icon: 'x', tone: 'red', t: m.closedEv.t, title: `${r.provider} closed your enquiry`, text: `${r.title} — ${m.closedEv.text}`, go: at });
    });
    alerts().forEach(q => { const s = searchInfo(q); if (s.fresh.length && alertMeta(q).freq !== 'paused') out.push({ id: 'new' + q + s.fresh.length, kind: 'match', icon: 'spark', tone: 'ok', t: now() - 6 * 3600000, title: `${s.fresh.length} new for “${s.title}”`, text: `Including ${s.fresh[0].title}.`, go: s.href }); });
    return out.sort((a, b) => b.t - a.t);
  }
  const unread = () => feed().filter(n => !D.read.includes(n.id)).length;

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
      <div class="account-user"><span class="account-avatar">${esc(U.auth.initialsOf(u))}</span><div><b>${esc(u.name || u.email || 'Your account')}</b><small>${u.phone ? `${ico('shield')}Verified mobile` : esc(u.email || '')}</small></div></div>
      <nav class="account-nav" aria-label="Account">${SECTIONS.map(([id, l, i]) => `<a href="#${id}" class="${cur === id ? 'is-active' : ''}">${ico(i)}<span>${l}</span>${badge[id] ? `<em class="${id === 'messages' ? 'is-red' : id === 'enquiries' || id === 'alerts' || id === 'documents' ? 'is-hot' : ''}">${badge[id]}</em>` : ''}</a>`).join('')}</nav>
      <a class="account-explore" href="${SITE.homeHref || HREF.home}">${ico('compass')}Explore marketplace</a>
    </aside>`;
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
  const noEnq = () => empty('msg', 'No enquiries yet', 'When you call, WhatsApp, email, chat or text a lister, it’s tracked here — with every reply.', `<a class="btn btn-primary btn-sm" href="${HREF.search}">${ico('search')}Start searching</a> <button class="btn btn-outline btn-sm" type="button" data-act="sample">Preview with sample activity</button>`);

  // how you contacted them — a source tag per channel, like the provider's Leads board
  const srcTag = r => { const [t, , c] = chOf(r); return `<span class="lead-source" style="--c:${c}"><i></i>${t}</span>`; };
  const av = (n, cls = '') => `<span class="lead-avatar ${cls}">${esc(initials(n))}</span>`;
  const spec = r => [...(r.spec || []).slice(0, 2), r.building || r.area].filter(Boolean).join(' · ');
  // the latest thing said in the conversation, like the message line on a provider's lead card
  const lastMsg = m => { const e = [...m.ev].reverse().find(x => x.text && x.t <= now()); return e ? m.who + ': ' + e.text : m.r.msg ? 'You: ' + m.r.msg : m.next; };
  function leadCard(m) {
    const { r } = m, waited = m.late ? Math.round((now() - r.t) / 60000) : 0;
    return `<a class="lead-card ${m.needs ? 'is-hot' : ''}" href="#enquiry=${r.id}">
      <div class="lead-title">${av(r.provider)}<b>${esc(r.provider)}</b></div>
      <div class="lead-listing">${ico('building')}<span>${esc(r.title)}</span></div>
      <p>${esc(lastMsg(m))}</p>
      <div class="lead-footer">${srcTag(r)}<span class="spacer"></span>${m.needs && !m.late ? '<span class="lead-tag">Your turn</span>' : m.late ? `<span class="late">${waited < 120 ? waited + 'm' : Math.round(waited / 60) + 'h'} no reply</span>` : `<span>${ago(m.ev.length ? m.ev[m.ev.length - 1].t : r.t)}</span>`}</div></a>`;
  }
  const actCard = leadCard;

  /* ---------- home — decisions first, then where each enquiry stands; a side panel shows only what exists ---------- */
  // real decisions, with their buttons on the row (calls and WhatsApps are grouped into one follow-up row below)
  function homeAction(m) {
    const id = m.r.id, b = (act, label, cls = 'btn-outline') => `<button class="btn ${cls} btn-sm" type="button" data-act="${act}" data-id="${id}">${label}</button>`;
    if (m.stage !== 'closed' && m.replyEv && isUnreadMsg(m)) return { icon: 'msg', tone: 'green', t: `${esc(m.who)} replied`, sub: m.replyEv.text, b: `<a class="btn btn-primary btn-sm" href="#messages=${id}">Reply</a>` };
    if (m.late) return { icon: 'clock', tone: 'red', t: `No reply from ${esc(m.who)} yet`, b: m.S.nudged ? `<a class="btn btn-outline btn-sm" href="${esc(similarHref(m.r))}">Similar</a>` : b('nudge', 'Nudge', 'btn-primary') };
    return null;
  }
  // a plain status for the list — the "did you get through?" question lives in one follow-up row, not on every line
  const homeStatus = m => m.pill;
  function overview() {
    const u = user(), L = all(), open = L.filter(m => m.stage !== 'closed');
    const acts = L.map(m => [m, homeAction(m)]).filter(x => x[1]);
    const follow = L.filter(m => m.stage === 'direct' && m.S.heard !== false);
    const people = [...new Map(follow.map(m => [m.r.provider, m])).values()]; // each agent once
    const waiting = L.filter(m => m.stage === 'sent').length;
    const convos = L.filter(lastIn).sort((a, b) => lastIn(b).t - lastIn(a).t).slice(0, 3);
    const al = alerts()[0] && searchInfo(alerts()[0]);
    const saved = savedList().map(byId).filter(Boolean);
    const nNeed = acts.length + (follow.length ? 1 : 0);
    const h = new Date().getHours(), hi = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const bits = [open.length && `${open.length} active ${open.length === 1 ? 'enquiry' : 'enquiries'}`, unreadMsgs() && `${unreadMsgs()} unread ${unreadMsgs() === 1 ? 'message' : 'messages'}`].filter(Boolean);
    const lastLead = L.find(m => m.l), near = lastLead ? lastLead.r.area : 'you';
    const more = lastLead && lastLead.lease ? [['services', 'cleaning', 'wrench', 'Move-in cleaning', 'Verified cleaners near ' + near], ['services', 'movers', 'car', 'Movers & packers', 'Compare verified movers'], ['insurance', 'property', 'shield', 'Tenant contents insurance', 'Compare licensed insurers']]
      : [['services', 'cleaning', 'wrench', 'Home cleaning', 'Verified cleaners near ' + near], ['experiences', '', 'compass', 'Weekend experiences', 'Hosted by verified operators'], ['insurance', '', 'shield', 'Insurance', 'Compare licensed insurers']];
    const card = (title, link, body, cls = '') => `<section class="dashboard-panel ${cls}"><div class="dashboard-panel-header"><h2>${title}</h2>${link || ''}</div>${body}</section>`;
    // one panel: the seven verticals in a single row, then three suggestions picked from what they contacted
    const discover = `<section class="dashboard-panel dashboard-discover"><div class="dashboard-panel-header"><h2>Explore ${esc(SITE.name)}</h2><a class="text-link" href="${HREF.search}">Search all${ico('chevR')}</a></div>
      <div class="account-discover dashboard-verticals">${DISCOVER.map(([v, i, t, c]) => `<a href="${HREF.search}?v=${v}" class="is-${c}"><i>${ico(i)}</i><b>${t}</b></a>`).join('')}</div>
      <h3 class="dashboard-suggestions-header">Suggested for you</h3>
      <div class="dashboard-suggestions">${more.map(([v, o, i, t, sub]) => `<a href="${HREF.search}?v=${v}${o ? '&o=' + o : ''}"><i>${ico(i)}</i><span><b>${t}</b><small>${esc(sub)}</small></span>${ico('chevR')}</a>`).join('')}</div></section>`;
    const head_ = `<header class="dashboard-header"><div><h1>${hi}, ${esc(first(u.first || u.name) || 'there')}</h1><p>${nNeed ? `<b>${nNeed} ${nNeed === 1 ? 'thing needs' : 'things need'} you</b>${bits.length ? ' · ' : ''}` : ''}${esc(bits.join(' · ') || (nNeed ? '' : 'You’re all caught up.'))}</p></div>
      <a class="btn btn-outline btn-sm" href="${HREF.search}">${ico('search')}Find a place</a></header>`;

    // new account: nothing empty — where to start
    if (!L.length) return `${head_.replace(/<p>.*?<\/p>/, '<p>Let’s get you started.</p>').replace(/<a class="btn btn-outline btn-sm"[^]*?<\/a>/, '')}${ES.home()}`;

    const needBox = nNeed ? card(`Needs you <em>${nNeed}</em>`, '', acts.map(([m, a]) => `<div class="dashboard-action"><a href="#enquiry=${m.r.id}" class="dashboard-action-link"><i class="is-${a.tone}">${ico(a.icon)}</i><span><b>${a.t}</b><small>${esc(a.sub || m.r.title)}</small></span></a><div class="dashboard-action-body">${a.b}</div></div>`).join('')
      + (follow.length ? `<div class="dashboard-action"><a href="#enquiries" class="dashboard-action-link"><span class="dashboard-stack">${people.slice(0, 3).map(m => av(m.r.provider)).join('')}</span><span><b>Did ${people.length === 1 ? esc(people[0].who) : people.length + ' listers'} get back to you?</b><small>You called or messaged ${esc(people.slice(0, 3).map(m => m.who).join(', '))}${people.length > 3 ? ' +' + (people.length - 3) : ''} · ${follow.length} ${follow.length === 1 ? 'enquiry' : 'enquiries'}</small></span></a>
          <div class="dashboard-action-body"><button class="btn btn-primary btn-sm" type="button" data-act="heardall">${follow.length === 1 ? 'Yes' : 'All answered'}</button><a class="btn btn-outline btn-sm" href="#enquiries">Review</a></div></div>` : ''), 'is-need') : '';

    const enqBox = card('Your enquiries', `<a href="#enquiries">View all ${L.length}${ico('chevR')}</a>`, open.concat(L.filter(m => m.stage === 'closed')).slice(0, 6).map(m => `<a class="dashboard-enquiry" href="#enquiry=${m.r.id}">${thumb(m.r)}<span><b>${esc(m.r.title)}</b><small>${esc(m.r.provider)} · ${esc(ago((lastIn(m) || m.r).t))}</small></span>${pill(homeStatus(m))}</a>`).join(''), 'is-enquiry');

    const side = [
      convos.length ? card('Latest messages', `<a href="#messages">Open${ico('chevR')}</a>`, convos.map(m => `<a class="dashboard-message" href="#messages=${m.r.id}">${av(m.r.provider)}<span><b>${esc(m.r.provider)}${isUnreadMsg(m) ? '<i></i>' : ''}</b><small>${esc(lastIn(m).text)}</small></span><em>${esc(ago(lastIn(m).t))}</em></a>`).join('')) : '',
      al ? `<a class="dashboard-search" href="${esc(al.href)}"><i>${ico('search')}</i><span><small>Continue searching</small><b>${esc(al.title)}</b><em>${[al.sub, al.count ? al.count + ' listings' : ''].filter(Boolean).map(esc).join(' · ')}</em></span>${al.fresh.length ? `<span class="dashboard-new">${al.fresh.length} new</span>` : ico('chevR')}</a>` : '',
      saved.length ? card('Saved', `<a href="#saved">All ${saved.length}${ico('chevR')}</a>`, saved.slice(0, 3).map(l => `<a class="dashboard-saved-item" href="${HREF.listing}?id=${l.id}"><img src="${esc(l.img[0] || '')}" alt="" loading="lazy"><span><b>${esc(l.title)}</b><small>${esc(U.locText(l))}</small></span></a>`).join('')) : ''
    ].filter(Boolean).join('');

    const tile = (href, icon, c, v, l) => `<a class="dashboard-stat is-${c}" href="${href}"><i>${ico(icon)}</i><span><b>${v}</b><small>${l}</small></span></a>`;
    return `${head_}
      <div class="dashboard-stats">
        ${tile('#enquiries', 'list', 'green', open.length, 'Active enquiries')}
        ${tile('#enquiries', 'clock', 'blue', waiting, 'Awaiting reply')}
        ${tile('#messages', 'msg', 'amber', unreadMsgs(), 'Unread messages')}
        ${tile('#saved', 'heart', 'red', favs.size, 'Saved')}</div>
      <div class="dashboard-grid"><div class="dashboard-main">${needBox}${enqBox}</div>${side ? `<aside class="dashboard-side">${side}</aside>` : ''}</div>
      ${discover}`;
  }

  /* ---------- my enquiries — every lister you contacted, by channel and stage ---------- */
  // columns follow the provider's leads: New → Contacted → Won / Lost, from the customer's side
  const COLS = [['sent', 'Waiting for reply', ['sent', 'direct']], ['talking', 'In touch', ['talking']], ['closed', 'Closed', ['closed']]];
  const colOf = m => COLS.findIndex(c => c[2].includes(m.stage));
  function enquiries() {
    const L = all();
    if (!L.length) return head('My enquiries', `Everyone you called, WhatsApped, emailed, chatted with or texted on ${esc(SITE.name)}.`) + ES.enquiries();
    const f = A.via || 'all', LL = L.filter(m => f === 'all' || m.r.type === f || (f === 'email' && !CH[m.r.type]));
    const vias = Object.keys(CH).filter(k => L.some(m => (CH[m.r.type] ? m.r.type : 'email') === k));
    const view = A.eview || 'board';
    const bar = vias.length > 1 ? `<div class="lead-bar"><button class="chip ${f === 'all' ? 'is-active' : ''}" data-tab="via" data-v="all">All <em>${L.length}</em></button>${vias.map(v => `<button class="chip ${f === v ? 'is-active' : ''}" data-tab="via" data-v="${v}"><span class="lead-source" style="--c:${CH[v][2]}"><i></i>${CH[v][0]}</span><em>${L.filter(m => (CH[m.r.type] ? m.r.type : 'email') === v).length}</em></button>`).join('')}</div>` : '';
    const seg = `<div class="lead-view-switch">${[['board', 'Board', 'grid4'], ['list', 'List', 'list']].map(([k, l, i]) => `<button type="button" class="${view === k ? 'is-on' : ''}" data-tab="eview" data-v="${k}">${ico(i)}${l}</button>`).join('')}</div>`;
    const body = view === 'list'
      ? `<div class="account-box account-table-wrap"><table class="account-table"><thead><tr><th>Lister</th><th>Via</th><th>Listing</th><th>Stage</th><th>Latest</th><th>Last activity</th></tr></thead><tbody>${LL.sort((a, b) => b.r.t - a.r.t).map(m => `<tr data-href="#enquiry=${m.r.id}" class="${m.needs ? 'is-hot' : ''}">
          <td><div class="account-cell">${av(m.r.provider, 'sm')}<span><b>${esc(m.r.provider)}</b><small>${esc(orgOf(m.r))}</small></span></div></td><td>${srcTag(m.r)}</td><td><b class="lead-cell-text">${esc(m.r.title)}</b></td>
          <td><span class="lead-status ${m.stage === 'closed' ? 'is-mute' : ''}">${esc(COLS[colOf(m)][1])}</span></td><td><small class="account-next">${esc(m.next)}</small></td><td>${ago(m.ev.length ? m.ev[m.ev.length - 1].t : m.r.t)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="lead-board is-3">${COLS.map((c, i) => { const ms = LL.filter(m => colOf(m) === i); return `<div class="lead-column"><div class="lead-column-header">${c[1]}<span>${ms.length}</span></div>${ms.map(leadCard).join('') || '<div class="lead-column-empty">—</div>'}</div>`; }).join('')}</div>`;
    return `${head('My enquiries', `Everyone you called, WhatsApped, emailed, chatted with or texted on ${esc(SITE.name)} — and where each one stands.`, seg)}${bar}${body}
      <p class="account-footer">${ico('shield')}Calls and WhatsApps happen outside ${esc(SITE.name)} — tell us when you got through so we can keep track.</p>`;
  }

  /* ---------- one enquiry ---------- */
  function tracking(id) {
    const r = leads().find(x => x.id === id);
    if (!r) return `${head('Enquiry not found', '')}${empty('msg', 'We couldn’t find this enquiry', 'It may have been removed from this account.', `<a class="btn btn-outline btn-sm" href="#enquiries">Back to my enquiries</a>`)}`;
    const m = model(r), { S, l, who, role, stage } = m, [chName, chIco] = chOf(r);
    const st = (cls, icon, title, when, extra = '') => `<li class="${cls}"><i>${icon}</i><div><b>${title}</b>${when ? `<small>${when}</small>` : ''}${extra}</div></li>`;
    const acts = (...b) => `<div class="account-timeline-actions">${b.filter(Boolean).join('')}</div>`;
    const hi = `Hi ${who}, about ${r.title} (Ref ${r.ref}) on ${SITE.name}.`;
    const waBtn = (text, label = 'WhatsApp') => `<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(r.pphone, text)}" data-walog="${r.id}">${ico('wa')}${label}</a>`;
    const callBtn = label => `<a class="btn btn-outline btn-sm" href="tel:${esc(r.pphone)}" data-calllog="${r.id}">${ico('phone')}${label}</a>`;
    const items = [];
    // 1 · you made contact (provider: New)
    items.push(st('is-done', ico(chIco), `You ${chOf(r)[3]} ${esc(who)}`, `${fmtSlot(r.t)} · by ${chName}`, r.msg ? `<blockquote>“${esc(r.msg)}”</blockquote>` : ''));
    // 2 · their reply (provider: Contacted)
    if (stage === 'sent') items.push(m.late
      ? st('is-current is-warn', ico('clock'), `No reply from ${esc(who)} yet`, `Sent ${ago(r.t)} · listers on ${esc(SITE.name)} aim to reply within 15 min${S.nudged ? ` · you nudged ${ago(S.nudged)}` : ''}`,
        acts(S.nudged ? '' : `<button class="btn btn-primary btn-sm" data-act="nudge" data-id="${r.id}">${ico('bell')}Nudge ${esc(who)}</button>`, callBtn('Call'), waBtn(hi + ' Is it still available?'), `<a class="btn btn-ghost btn-sm" href="${esc(similarHref(r))}">${ico('search')}Similar listings</a>`))
      : st('is-current', ico('clock'), `Waiting for ${esc(who)} to reply`, `Usually replies in ${r.reply || 10} min · we’ll let you know the moment they do`));
    else if (stage === 'direct') items.push(S.heard === false
      ? st('is-current is-warn', ico(chIco), `${esc(who)} didn’t answer`, 'Listers often get back within the hour — or try another channel.', acts(callBtn('Call again'), waBtn(hi), `<button class="btn btn-ghost btn-sm" data-act="heard" data-id="${r.id}">We’re in touch now</button>`))
      : st('is-current', ico(chIco), 'Did you get through?', `${chName} happens outside ${esc(SITE.name)} — tell us so we can keep track.`, acts(`<button class="btn btn-primary btn-sm" data-act="heard" data-id="${r.id}">Yes, we’re in touch</button>`, `<button class="btn btn-outline btn-sm" data-act="noanswer" data-id="${r.id}">No answer</button>`)));
    else items.push(st('is-done', ico('check'), m.replyEv ? `${esc(who)} replied` : `You’re in touch with ${esc(who)}`,
      m.replyEv ? `${fmtSlot(m.replyEv.t)} · replied in ${m.replyMin} min` : 'You confirmed you got through', m.replyEv ? `<blockquote>“${esc(m.replyEv.text)}”</blockquote>` + acts(`<a class="btn btn-primary btn-sm" href="#messages=${r.id}">${ico('msg')}Reply</a>`, callBtn('Call')) : acts(callBtn('Call'), waBtn(hi))));
    // 3 · closed (provider: Won / Lost)
    if (stage === 'closed') items.push(st('is-done', ico(m.closedEv ? 'x' : 'check'), m.closedEv ? `${esc(r.provider)} closed this enquiry` : esc(m.pill[0]),
      m.closedEv ? `${fmtSlot(m.closedEv.t)} · “${esc(m.closedEv.text)}”` : (S.closedAt ? fmtSlot(S.closedAt) : '') + (S.why ? ' · ' + esc(S.why) : ''),
      stars(S.rating, who) + (S.outcome === 'got' || S.outcome === 'found' ? '' : acts(`<a class="btn btn-outline btn-sm" href="${esc(similarHref(r))}">${ico('search')}See similar listings</a>`))));
    else items.push(st('', '3', 'Close when you’re done', `Got what you needed or not for you? Close it and rate the ${role} — it keeps ${esc(SITE.name)} honest.`, stage === 'talking' ? acts(`<button class="btn btn-outline btn-sm" data-act="withdraw" data-id="${r.id}">Close enquiry</button>`) : ''));

    const u = user(), P = l && window.DM ? DM.prov(l.provider.name) : null;
    const kv = [['Contacted by', chName], ['Usually replies', P ? (P.reply <= 5 ? 'within 5 min' : 'within ' + P.reply + ' min') : 'within ' + (r.reply || 10) + ' min'], ['Listing ref', r.ref], ['Enquiry', r.id]];
    return `<nav class="account-breadcrumbs"><a href="#enquiries">${ico('chevL')}My enquiries</a><span>${esc(r.id)}</span></nav>
      <div class="account-box lead-header"><div class="lead-header-top">${av(r.provider, 'is-lg')}<div><h1>${esc(r.provider)}</h1><small>${srcTag(r)} · ${esc(orgOf(r))} · ${ago(r.t)}</small></div>${pill(m.pill)}</div>
        <div class="lead-stepper">${COLS.map((c, i) => `<span class="${i < colOf(m) ? 'is-done' : ''} ${i === colOf(m) ? 'is-on' : ''}">${esc(c[1])}</span>`).join('')}</div>
        <a class="lead-original-listing" href="${l ? HREF.listing + '?id=' + r.lid : '#'}">${thumb(r)}<span><b>${esc(r.title)}</b><small>${esc(spec(r))}${l ? '' : ' · no longer listed'}</small></span>${ico('chevR')}</a>
        <div class="lead-details">${kv.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></div>
      <div class="account-tracking"><div class="account-box"><h2>Progress</h2><ol class="account-timeline">${items.join('')}</ol></div>
        <aside class="account-tracking-side">
          ${l && window.DM ? DM.agentCard(l) : `<div class="account-box"><a class="account-cell account-agent" href="${provHref(r.provider)}">${av(r.provider)}<span><b>${esc(r.provider)}</b><small>${esc(orgOf(r))}</small></span>${ico('chevR')}</a><div class="account-button-pair">${waBtn(hi)}${callBtn('Call')}</div></div>`}
          <div class="account-box"><h3>What ${esc(who)} can see</h3>
            <p class="account-shared-label">${ico('eye')}<span>Your name${u && u.phone ? ' and mobile' : ''}${r.msg ? ' and your message' : ''} — shared when you ${chOf(r)[3]} them. Documents are never shared automatically.</span></p>
            ${stage !== 'closed' ? `<button class="account-report" type="button" data-act="withdraw" data-id="${r.id}">${ico('x')}Close this enquiry</button>` : ''}</div>
          <button class="account-report is-out" type="button" data-act="report" data-id="${r.id}">${ico('flag')}Report a problem with this ${role}</button>
        </aside></div>`;
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
    const ids = savedList(), lists = D.lists;
    const curList = lists.find(x => x.id === A.list);
    const shown = (curList ? curList.ids.filter(id => favs.has(id)) : ids);
    const searches = alerts();
    const L = all(), agents = [...new Map(leads().map(r => [r.provider, r])).values()];
    const item = id => {
      const l = byId(id);
      if (!l) return `<div class="account-saved is-gone"><div class="account-gone">${ico('x')}<b>No longer available</b><small>This listing was removed by the agent.</small><button class="btn btn-outline btn-sm" data-fav="${esc(id)}">Remove</button></div></div>`;
      const note = D.notes[id], v = L.find(m => m.r.lid === id && m.stage !== 'closed');
      return `<div class="account-saved">${v ? `<a class="account-dropzone is-view" href="#enquiry=${v.r.id}">${ico(chOf(v.r)[1])}${esc(v.pill[0])}</a>` : ''}${U.card(l)}
        <div class="account-saved-bar"><label class="account-compare-pick"><input type="checkbox" data-pick="${id}" ${A.pick.has(id) ? 'checked' : ''}><span>Compare</span></label>
          <button type="button" data-act="note" data-id="${id}">${ico('pen')}${note ? 'Note' : 'Add note'}</button>
          <button type="button" data-act="move" data-id="${id}">${ico('list')}List</button></div>
        ${note ? `<p class="account-note">${esc(note)}</p>` : ''}</div>`;
    };
    const listCards = `<div class="account-lists"><button type="button" class="${A.list === 'all' ? 'is-active' : ''}" data-list="all"><b>All saved</b><small>${ids.length} ${ids.length === 1 ? 'listing' : 'listings'}</small></button>
      ${lists.map(x => { const n = x.ids.filter(i => favs.has(i)); return `<button type="button" class="${A.list === x.id ? 'is-active' : ''}" data-list="${x.id}"><b>${esc(x.name)}</b><small>${n.length} saved</small></button>`; }).join('')}
      <button type="button" class="is-new" data-act="newlist">${ico('plus')}New list</button></div>`;
    const body = {
      items: () => ids.length ? `${listCards}
          ${curList ? `<div class="account-list-header"><h2>${esc(curList.name)}</h2><button type="button" class="btn btn-ghost btn-sm" data-act="renamelist">Rename</button><button type="button" class="btn btn-ghost btn-sm" data-act="dellist">Delete list</button></div>` : ''}
          ${shown.length ? `<div class="account-grid is-saved">${shown.map(item).join('')}</div>` : empty('heart', 'This list is empty', 'Use “List” under any saved listing to add it here.')}
          <p class="account-footer">${ico('grid4')}Tick up to 3 listings to compare them side by side.</p>`
        : ES.saved(),
      searches: () => searches.length ? `<div class="account-searches">${searches.map(q => { const s = searchInfo(q), a = alertMeta(q); return `<div class="account-box account-search">
          <span class="account-search-icon">${ico('search')}</span><div class="account-search-text"><b>${esc(s.title)}</b><small>${esc(s.sub)} · ${s.count} listings</small>${s.fresh.length && a.freq !== 'paused' ? `<span class="status-pill is-success">${s.fresh.length} new</span>` : '<span class="status-pill is-muted">Up to date</span>'}</div>
          <label class="account-select"><span>Alerts</span><select data-afreq="${esc(q)}">${[['instant', 'Instantly'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['paused', 'Paused']].map(([v, t]) => `<option value="${v}" ${a.freq === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label class="account-select"><span>By</span><select data-ach="${esc(q)}">${[['wa', 'WhatsApp'], ['push', 'Push'], ['email', 'Email']].map(([v, t]) => `<option value="${v}" ${a.ch === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <div class="account-search-open"><a class="btn btn-outline btn-sm" href="${esc(s.href)}">Open</a><button class="btn btn-ghost btn-sm" type="button" data-act="delsearch" data-q="${esc(q)}" aria-label="Delete search">${ico('x')}</button></div></div>`; }).join('')}</div>
          <p class="account-footer">${ico('bell')}We check every few minutes and message you on your chosen channel. WhatsApp alerts are opt-in — pause them any time.</p>`
        : ES.searches(),
      agents: () => agents.length ? `<div class="account-agents">${agents.map(r => { const mine = L.filter(m => m.r.provider === r.provider), open = mine.filter(m => m.stage !== 'closed').length; return `<div class="account-box">
          <a class="account-cell account-agent" href="${provHref(r.provider)}"><span class="account-avatar">${esc(initials(r.provider))}</span><span><b>${esc(r.provider)}</b><small>${esc(r.org)}</small><small>${mine.length} ${mine.length === 1 ? 'enquiry' : 'enquiries'}${open ? ` · ${open} open` : ''} · replies in ~${r.reply || 10} min</small></span>${ico('chevR')}</a>
          <div class="account-button-pair"><a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(r.pphone, `Hi ${first(r.provider)}, I found you on ${SITE.name}.`)}">${ico('wa')}WhatsApp</a><a class="btn btn-outline btn-sm" href="${provHref(r.provider)}">${ico('grid4')}Listings</a></div></div>`; }).join('')}</div>
          <p class="account-footer">${ico('users')}Agents and providers you’ve contacted. Their profile shows all their listings and reviews.</p>`
        : empty('users', 'No agents yet', 'Listers you call, WhatsApp, email, chat with or text show up here.', `<a class="btn btn-primary btn-sm" href="${HREF.search}">${ico('search')}Browse listings</a>`)
    };
    return `${head('Saved', 'Your shortlist, saved searches and agents — synced to your account.', A.stab === 'items' && A.pick.size > 1 ? `<button class="btn btn-primary btn-sm" type="button" data-act="compare">${ico('grid4')}Compare ${A.pick.size}</button>` : '')}
      ${tabs([['items', 'Listings', ids.length], ['searches', 'Searches', searches.length], ['agents', 'Listers', agents.length]], A.stab, 'stab')}
      ${(body[A.stab] || body.items)()}`;
  }
  function compareModal() {
    const L = [...A.pick].map(byId).filter(Boolean).slice(0, 3);
    const rows = [['Location', l => esc(U.locText(l))], ['Category', l => esc(offerOf(l.v, l.cat).label)],
      ['Key facts', l => esc(U.specOf(l).join(' · '))], ['Rating', l => `${ico('star')}${l.rating} <small>(${l.reviews})</small>`], ['Agent', l => `${esc(l.provider.name)}<small>replies in ~${l.provider.reply} min</small>`],
      ['Verified', l => l.a.verified ? `<span class="status-pill is-success">Verified</span>` : '<small>Not yet</small>'], ['Reference', l => esc(l.ref)]];
    openModal(`<div class="account-modal account-compare-modal"><div class="account-modal-header"><div><h3>Compare ${L.length}</h3><p>Side by side from your saved listings</p></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div>
      <div class="account-compare" style="--n:${L.length}"><div></div>${L.map(l => `<a href="${HREF.listing}?id=${l.id}" class="account-compare-header"><img src="${esc(l.img[0] || PATHS.img('hero.jpg'))}" alt=""><b>${esc(l.title)}</b></a>`).join('')}
        ${rows.map(([t, f]) => `<div class="account-compare-label">${t}</div>${L.map(l => `<div>${f(l)}</div>`).join('')}`).join('')}
        <div></div>${L.map(l => `<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(l.provider.phone, `Hi ${first(l.provider.name)}, is ${l.title} (Ref ${l.ref}) still available?`)}">${ico('wa')}WhatsApp</a>`).join('')}</div></div>`, 'account-modal-wrap is-wide');
  }

  /* ---------- alerts (C22) ---------- */
  function alertsView() {
    const F = feed(), list = A.ntab === 'all' ? F : F.filter(n => n.kind === A.ntab);
    const need = all().filter(m => m.needs).length;
    const TYPES = [['replies', 'Replies from listers', 'When an owner, manager or company replies to you'], ['matches', 'New matches', 'For your saved searches'], ['tips', 'Tips & news', 'Occasional, never more than monthly']];
    const CH = [['wa', 'WhatsApp'], ['push', 'Push'], ['email', 'Email']];
    const pref = k => D.notify[k] || (D.notify[k] = { on: false, ch: [] });
    return `${head('Alerts', need ? `${need} ${need === 1 ? 'needs' : 'need'} your attention` : F.length ? `${unread()} unread` : '', F.length ? `<button class="btn btn-ghost btn-sm" type="button" data-act="readall">Mark all as read</button>` : '')}
      <div class="account-alerts"><div>
        ${tabs([['all', 'All', F.length], ['enq', 'Enquiries', F.filter(n => n.kind === 'enq').length], ['match', 'Matches', F.filter(n => n.kind === 'match').length]], A.ntab, 'ntab')}
        ${list.length ? `<div class="account-box account-feed">${list.map(n => `<a href="${esc(n.go)}" class="account-notification ${D.read.includes(n.id) ? '' : 'is-unread'}" data-read="${esc(n.id)}"><i class="is-${n.tone}">${ico(n.icon)}</i><span><b>${esc(n.title)}</b><small>${esc(n.text)}</small></span><em>${ago(n.t)}</em></a>`).join('')}</div>`
          : F.length ? empty('bell', 'Nothing here', 'No alerts in this tab.') : ES.alerts()}</div>
        <aside class="account-box account-preferences"><h3>Where should we reach you?</h3>
          <div class="account-grid-preferences"><span></span>${CH.map(([, t]) => `<small>${t}</small>`).join('')}
            ${TYPES.map(([k, t, s]) => `<span><b>${t}</b><small>${s}</small></span>${CH.map(([c]) => `<label class="account-box-check"><input type="checkbox" data-pref="${k}" data-ch="${c}" ${pref(k).ch.includes(c) ? 'checked' : ''} aria-label="${t} by ${c}"><i>${ico('check')}</i></label>`).join('')}`).join('')}</div>
          <label class="toggle account-quiet-hours"><span><b>Quiet hours</b><small>No WhatsApp or push between 22:00 and 08:00</small></span><input type="checkbox" data-quiet ${D.quiet ? 'checked' : ''}><i></i></label></aside></div>`;
  }

  /* ---------- profile & privacy (C23) ---------- */
  function profile() {
    const u = user(), L = leads(), shared = [...new Map(L.map(r => [r.provider, r])).values()];
    const since = u.since ? new Date(u.since) : null;
    const rowB = (icon, title, sub, right) => `<div class="account-row">${ico(icon)}<span><b>${title}</b><small>${sub}</small></span>${right}</div>`;
    return `${head('Profile &amp; privacy', '')}
      <div class="account-box account-profile-card"><span class="account-avatar is-xl">${esc(U.auth.initialsOf(u))}</span><div><h2>${esc(u.name || 'Add your name')}</h2><small>${since ? `Member since ${MON[since.getMonth()]} ${since.getFullYear()} · ` : ''}${L.length} enquiries · ${favs.size} saved</small></div><button class="btn btn-outline btn-sm" type="button" data-act="editname">${ico('pen')}Edit name</button></div>
      <div class="account-columns">
        <div class="account-box"><h3>Account</h3>
          ${rowB('phone', u.phone ? esc(U.fmtPhone(u.dial + u.phone)) : 'No mobile yet', u.phone ? 'Verified · used to sign in' : 'Add one so agents can reach you', u.phone ? '<span class="status-pill is-success">Verified</span>' : '')}
          ${rowB('mail', esc(u.email || 'No email'), 'Copies of your enquiries and replies', `<button class="btn btn-ghost btn-sm" type="button" data-act="editemail">${u.email ? 'Change' : 'Add'}</button>`)}
          ${rowB('shield', 'UAE PASS', 'Share your verified ID with agents in one tap', '<span class="status-pill is-muted">Coming soon</span>')}</div>
        <div class="account-box"><h3>What agents can see</h3>
          ${rowB('eye', 'Name &amp; mobile', 'Only after you send a request or tap Call / WhatsApp', '')}
          ${rowB('doc', 'Move-in, occupants, budget', 'Only the details you add to a request', '')}
          ${rowB('lock', 'Documents', 'Never shared automatically — you send them to the agent yourself', '')}
          <label class="toggle"><span><b>Prefill my details in requests</b><small>Saves typing — you can edit before sending</small></span><input type="checkbox" data-priv="share" ${D.privacy.share ? 'checked' : ''}><i></i></label>
          <details class="account-shared"><summary>${ico('users')}Who has your details <em>${shared.length}</em></summary>${shared.length ? shared.map(r => `<div><b>${esc(r.provider)}</b><small>${esc(r.org)} · first contact ${ago(r.t)}</small></div>`).join('') : '<p>No agent has your details yet.</p>'}</details></div>
        <div class="account-box"><h3>Preferences</h3>
          <div class="account-row">${ico('globe')}<span><b>Language</b><small>Used across the site</small></span><label class="account-select"><select data-prefs="lang">${SITE.languages.map(([k, l]) => `<option value="${k}" ${U.prefs.lang === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
          <div class="account-row">${ico('tag')}<span><b>Currency</b><small>Prices are shown in this currency</small></span><label class="account-select"><select data-prefs="cur">${Object.keys(U.CUR).map(k => `<option value="${k}" ${U.prefs.cur === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
          <a class="account-row" href="#alerts">${ico('bell')}<span><b>Notifications</b><small>${D.quiet ? 'Quiet hours 22:00–08:00' : 'Any time'}</small></span>${ico('chevR')}</a>
          <label class="toggle"><span><b>Search history</b><small>Used for “Recently viewed” and recommendations</small></span><input type="checkbox" data-priv="history" ${D.privacy.history ? 'checked' : ''}><i></i></label></div>
        <div class="account-box"><h3>More</h3>
          <button type="button" class="account-row" data-act="export">${ico('upload')}<span><b>Download my data</b><small>Your account, saved listings, enquiries and settings as a file</small></span>${ico('chevR')}</button>
          <a class="account-row" href="${HREF.join}">${ico('brief')}<span><b>List on ${esc(SITE.name)}</b><small>For owners, agents and businesses</small></span>${ico('chevR')}</a>
          <button type="button" class="account-row" data-act="signout">${ico('chevL')}<span><b>Sign out</b><small>On this device</small></span></button>
          <button type="button" class="account-row is-danger" data-act="delete">${ico('x')}<span><b>Delete my account</b><small>Removes your account and everything saved with it</small></span></button></div>
      </div>
      <p class="account-footer">${ico('lock')}We handle your data under the UAE Personal Data Protection Law. You can download or delete it at any time.</p>`;
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
    messages: () => emptyState({ art: 'messages', title: 'No conversations yet', sub: 'Agent replies come straight here — no digging through WhatsApp to find them.', steps: ['Contact an agent from any listing', 'Their replies appear here, next to the listing', 'Answer from here — it opens WhatsApp and keeps a copy'], mock: 'reply' }),
    saved: () => emptyState({ art: 'saved', title: 'You have no saved listings yet', sub: 'Saving helps you compare and come back to places faster.', steps: ['Browse listings', 'Tap the heart on the ones you like', 'Compare them side by side and add notes here'], mock: 'heart' }),
    searches: () => emptyState({ art: 'searches', title: 'You have no saved searches yet', sub: 'Saving a search helps you find the right place faster.', steps: ['Start a search with the filters you need', 'Select Save search', 'Get new matches on WhatsApp — and return here anytime'], mock: 'save' }),
    alerts: () => emptyState({ art: 'alerts', title: 'No alerts yet', sub: 'We tell you the moment something happens — never more than you choose.', steps: ['Contact an agent or save a search', 'We alert you when they reply or something new matches', 'Choose WhatsApp, push or email in the panel'], mock: 'bell', chips: false }),
    documents: () => emptyState({ art: 'documents', title: 'Keep your documents ready', sub: 'Owners and providers often ask for your ID before a contract or sign-up. Upload once and it’s ready when you need it.', steps: ['Upload your Emirates ID or passport', 'We read the details — you just check them', 'Share it yourself when a lister asks — never automatically'], mock: 'scan', chips: false })
  };

  const DISCOVER = [['spaces', 'building', 'Spaces', 'green'], ['services', 'wrench', 'Services', 'blue'], ['experiences', 'compass', 'Experiences', 'amber'], ['memberships', 'badge', 'Memberships', 'green'], ['programs', 'grad', 'Programs', 'blue'], ['health', 'medic', 'Health', 'red'], ['insurance', 'shield', 'Protection', 'amber']];

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
  function messages(id) {
    const L = all().sort((a, b) => (logOf(b).pop() || b.r).t - (logOf(a).pop() || a.r).t);
    const sub = `<header class="account-header"><div><h1>Messages</h1><p>Every conversation is linked to its listing, so nothing gets lost.</p></div></header>`;
    if (!L.length) return sub + ES.messages();
    const cur = L.find(m => m.r.id === id) || (matchMedia('(max-width: 860px)').matches ? null : L[0]);
    if (cur) { D.seen = D.seen || {}; D.seen[cur.r.id] = now(); save(); }
    const list = L.map(m => { const last = logOf(m).pop(); return `<a href="#messages=${m.r.id}" class="message-row ${cur === m ? 'is-on' : ''}">${av(m.r.provider)}
      <span><span class="message-row-text"><b>${esc(m.r.provider)}</b><em>${when((last || m.r).t)}</em>${isUnreadMsg(m) ? '<i></i>' : ''}</span><small>${esc(m.r.title)}</small><small>${last ? esc(last.text) : ''}</small></span></a>`; }).join('');
    let pane = '';
    if (cur) {
      const { r, who } = cur, l = byId(r.lid);
      const quick = cur.stage === 'closed' ? [] : cur.replyEv ? ['Thanks! When can I call you?', 'Can you share more photos?'] : ['Is it still available?', 'Could you call me back?'];
      pane = `<section class="message-pane"><header class="message-pane-header"><a class="message-back" href="#messages" aria-label="All messages">${ico('chevL')}</a>${av(r.provider)}<span><b>${esc(r.provider)}</b><small>Replies in ~${r.reply || 10} min</small></span><a class="btn btn-outline btn-sm" href="tel:${esc(r.pphone)}" data-calllog="${r.id}">${ico('phone')}<span>Call</span></a></header>
        <a class="message-context" href="#enquiry=${r.id}"><i>${ico('building')}</i><span><b>${esc(r.title)}</b><small>${esc(r.ref)} · ${esc(cur.pill[0])}</small></span>${ico('chevR')}</a>
        <div class="message-list">${logOf(cur).map(x => `<div class="message-bubble ${x.out ? 'is-out' : ''}">${esc(x.text)}<small>${x.out ? 'You · ' : ''}${when(x.t)}${x.out ? ' · delivered' : ''}</small></div>`).join('')}</div>
        ${quick.length ? `<div class="message-quick">${quick.map(q => `<button type="button" class="chip" data-quick="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
        ${cur.stage === 'closed' ? `<p class="message-closed">This enquiry is closed.</p>` : `<form class="message-compose" data-send="${r.id}"><a class="message-plus" href="${l ? HREF.listing + '?id=' + r.lid : '#'}" aria-label="Open listing">${ico('plus')}</a><input name="t" placeholder="Write a message" autocomplete="off" aria-label="Message"><button class="message-send" type="submit" aria-label="Send">${ico('arrow')}</button></form>`}</section>`;
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
        ${f.data ? `<a class="text-link" href="${f.data}" download="${esc(f.name)}">Download</a>` : ''}<button type="button" class="text-link" data-idocedit="${doc.id}">Edit</button></div></div>`;
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
    const have = IDOCS.filter(d => idocs()[d.id]), missing = IDOCS.filter(d => !idocs()[d.id]), due = docsDue()[0];
    const main = !idocs().eid ? `<label class="onboarding-main-upload"><input type="file" accept="image/*,.pdf" data-idoc="eid" hidden><i>${ico('doc')}</i><span><b>Upload your Emirates ID</b><small>A photo or PDF — we’ll read it and fill in the details for you</small></span><span class="btn btn-primary">Choose file</span></label>` : '';
    return `<header class="account-header"><div><h1>Documents</h1>${have.length ? '<p>Upload once — we read the details, you check them. Nothing is shared unless you send it.</p>' : ''}</div></header>
      ${due ? `<div class="document-alert">${ico('clock')}<span><b>${esc(due.t)} ${daysTo(expOf(due)) < 0 ? 'expired' : 'expires'} ${esc(niceD(expOf(due)))}</b><small>Listers ask for a valid ID before a contract or sign-up. Upload the renewed one — we’ll read it again.</small></span><label class="btn btn-primary btn-sm">${ico('upload')}Upload<input type="file" hidden accept="image/*,.pdf" data-idoc="${due.id}"></label></div>` : ''}
      ${have.length ? '' : ES.documents()}
      <div class="account-id-documents">${main}${have.map(idocCard).join('')}</div>
      ${missing.filter(d => d.id !== 'eid' || idocs().eid).length ? `<section class="account-section"><div class="account-section-header"><h2>${have.length ? 'Also useful' : 'Agents may also ask for'}</h2></div>
        <div class="onboarding-needs">${missing.filter(d => d.id !== 'eid').map(d => `<div class="onboarding-need"><i>${ico(d.icon)}</i><span><b>${esc(d.t)}</b><small>${esc(d.hint)}</small></span><em class="onboarding-need-tag">Optional</em>
          <label class="btn btn-outline btn-sm onboarding-need-upload">${ico('upload')}Upload<input type="file" accept="image/*,.pdf" data-idoc="${d.id}" hidden></label></div>`).join('')}</div></section>` : ''}
      <section class="account-box document-health"><div class="document-health-header"><i>${ico('medic')}</i><span><b>Health records</b><small>Private. Only you and your care team can see these. Every view is logged.</small></span></div>
        <div class="document-health-body">${ico('lock')}<small>No health records yet — results shared by clinics you book through ${esc(SITE.name)} will appear here.</small></div></section>
      <p class="account-footer">${ico('lock')}Reading a document isn’t verification — you check the details. ${esc(SITE.name)} never sends your documents to an agent.</p>`;
  }

  /* ---------- small dialogs ---------- */
  function ask({ title, text = '', label, value = '', placeholder = '', ok = 'Save', danger, fields }, done) {
    const F = fields || [{ name: 'v', label, value, placeholder }];
    openModal(`<form class="account-modal" id="accAsk"><div class="account-modal-header"><div><h3>${title}</h3>${text ? `<p>${text}</p>` : ''}</div><button class="close-btn" type="button" data-close aria-label="Close">${ico('x')}</button></div>
      ${F.map(f => `<div class="field"><label for="account-${f.name}">${esc(f.label)}</label>${f.area ? `<textarea id="account-${f.name}" name="${f.name}" rows="4" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>` : `<input id="account-${f.name}" name="${f.name}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}" ${f.type ? `type="${f.type}"` : ''}>`}</div>`).join('')}
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
    if (!D.lists.length) D.lists.push({ id: 'l' + T, name: 'My shortlist', ids: ids.slice(0, 4) });
    const q = U.toQuery({ ...U.blankState('spaces', 'residential'), loc: ['dubai-marina'] });
    if (!alerts().includes(q)) setAlerts([...alerts(), q]);
    if (!Object.keys(idocs()).length) ['eid', 'passport', 'visa'].forEach(id => { const got = readIdoc(id), d = {}, src = {}; IDOCS.find(x => x.id === id).fields.forEach(([k, , kind]) => { const v = String(got[k] || '').replace(/^\?/, ''); d[k] = kind === 'date' ? isoD(v) : v; src[k] = 'doc'; }); idocs()[id] = { name: id + '.pdf', size: '240 KB', state: 'read', ok: true, d, src, orig: { ...d }, t: T }; });
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
    const tab = e.target.closest('[data-tab]'); if (tab) { A[tab.dataset.tab] = tab.dataset.v; render(); return; }
    const lst = e.target.closest('[data-list]'); if (lst) { A.list = lst.dataset.list; render(); return; }
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
      nudge: () => { const m = M(); S.nudged = now(); logLine(id, `Reminder sent to ${orgOf(m.r)}`); save(); render(); toast(`We’ve reminded ${m.who} — most agents reply within the hour`); },
      report: () => ask({ title: 'Report a problem', text: 'Our team reviews every report within one working day.', fields: [{ name: 'why', label: 'What happened?', area: true, placeholder: 'e.g. asked me to pay before I saw it' }], ok: 'Send report' }, () => toast('Thanks — we’ll look into it')),
      note: () => ask({ title: 'Private note', text: 'Only you can see this.', fields: [{ name: 'v', label: 'Note', area: true, value: D.notes[id] || '', placeholder: 'e.g. ask about parking; ask about move-in date' }] }, v => { v.v.trim() ? D.notes[id] = v.v.trim() : delete D.notes[id]; save(); render(); }),
      move: () => {
        if (!D.lists.length) return ask({ title: 'New list', label: 'List name', placeholder: 'e.g. Marina shortlist', ok: 'Create & add' }, v => { if (!v.v.trim()) return false; D.lists.push({ id: 'l' + now(), name: v.v.trim(), ids: [id] }); save(); render(); toast('Added to ' + v.v.trim()); });
        openModal(`<div class="account-modal"><div class="account-modal-header"><div><h3>Add to a list</h3></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div><div class="account-move-list">${D.lists.map(x => `<label><input type="checkbox" data-mv="${x.id}" ${x.ids.includes(id) ? 'checked' : ''}><span>${esc(x.name)}</span></label>`).join('')}</div><button class="btn btn-primary account-modal-submit" data-close>Done</button></div>`, 'account-modal-wrap');
        document.querySelector('.scrim').onchange = ev => { const x = D.lists.find(y => y.id === ev.target.dataset.mv); if (!x) return; ev.target.checked ? x.ids.push(id) : x.ids = x.ids.filter(i => i !== id); save(); render(); };
      },
      newlist: () => ask({ title: 'New list', label: 'List name', placeholder: 'e.g. JLT 2-beds', ok: 'Create list' }, v => { if (!v.v.trim()) return false; const x = { id: 'l' + now(), name: v.v.trim(), ids: [] }; D.lists.push(x); A.list = x.id; save(); render(); }),
      renamelist: () => { const x = D.lists.find(y => y.id === A.list); ask({ title: 'Rename list', label: 'List name', value: x.name }, v => { if (!v.v.trim()) return false; x.name = v.v.trim(); save(); render(); }); },
      dellist: () => { D.lists = D.lists.filter(y => y.id !== A.list); A.list = 'all'; save(); render(); toast('List deleted — your saved listings are still here'); },
      compare: compareModal,
      heardall: () => { all().filter(m => m.stage === 'direct' && m.S.heard !== false).forEach(m => { const S2 = D.lead[m.r.id] = D.lead[m.r.id] || {}; S2.heard = true; logLine(m.r.id, 'You confirmed you’re in touch'); }); save(); render(); toast('Updated'); },
      deldoc: () => { delete idocs()[id]; save(); render(); toast('Removed'); },
      delsearch: () => { setAlerts(alerts().filter(q => q !== b.dataset.q)); delete D.alert[b.dataset.q]; save(); render(); toast('Saved search deleted'); },
      readall: () => { D.read = [...new Set([...D.read, ...feed().map(n => n.id)])]; save(); render(); },
      editname: () => { const u = user(); ask({ title: 'Your name', text: 'Shown to agents when you contact them.', fields: [{ name: 'f', label: 'First name', value: u.first }, { name: 'l', label: 'Last name', value: u.last }] }, v => { if (!v.f.trim()) return false; U.auth.setName(v.f.trim(), v.l.trim()); render(); toast('Name updated'); }); },
      editemail: () => { const u = user(); ask({ title: u.email ? 'Change email' : 'Add email', fields: [{ name: 'e', label: 'Email', type: 'email', value: u.email, placeholder: 'you@email.com' }] }, v => { if (!/^\S+@\S+\.\S+$/.test(v.e)) return false; u.email = v.e.trim(); store.set('user', u); render(); toast('Email saved'); }); },
      export: () => {
        const data = { exported: new Date().toISOString(), account: user(), saved: savedList(), lists: D.lists, notes: D.notes, enquiries: leads(), progress: D.lead, searches: alerts(), recentlyViewed: store.get('recent') || [], notifications: D.notify, privacy: D.privacy };
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = `${SITE.name.toLowerCase()}-my-data.json`; a.click(); toast('Your data is downloading');
      },
      signout: () => { U.auth.signOut(); location.href = HREF.home; },
      delete: () => ask({ title: 'Delete your account?', text: 'This removes your account, saved listings, lists, enquiries and alerts from ' + esc(SITE.name) + '. It can’t be undone. Agents you already contacted keep their own conversation with you.', fields: [{ name: 'c', label: 'Type DELETE to confirm', placeholder: 'DELETE' }], ok: 'Delete my account', danger: true }, v => {
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
