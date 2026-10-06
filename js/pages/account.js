/* Customer account — one page, five sections chosen by the URL hash:
   #overview · #enquiries (and #enquiry=ID for one enquiry's tracking) · #saved · #alerts · #profile.
   UpNow is lead-based, not transactional: a request, call or WhatsApp becomes a lead in the agent's or provider's
   dashboard (New → Contacted → Viewing → Offer → Won / Lost). The agent replies, suggests or confirms a time and
   closes the lead; the customer accepts, asks for another time, gives feedback or closes the enquiry.
   The journey ends at the lead: there are no bookings, offers or payments on UpNow.
   Reads what the rest of the site keeps in this browser (saved listings, enquiries, recently viewed, saved searches,
   the signed-in user) and adds its own record under 'dash'. */
(function () {
  const U = UPUI, { ico, esc, store, money, initials, byId, favs, leads, recent, toast, openModal, closeModal } = U;
  const { offerOf, areaName, LISTINGS } = UP;
  const HREF = PATHS.href;
  const root = document.getElementById('acc');

  document.getElementById('hdr').innerHTML = U.header(null);
  document.getElementById('ftr').innerHTML = U.footer({ cta: false });
  U.bindHeader();

  /* ---------- data ---------- */
  const ALERT_KEY = 'upnow.alerts'; // written by the search page's "Save search"
  const alerts = () => { try { return JSON.parse(localStorage.getItem(ALERT_KEY) || '[]'); } catch (e) { return []; } };
  const setAlerts = a => localStorage.setItem(ALERT_KEY, JSON.stringify(a));
  const D = Object.assign({
    lead: {}, lists: [], notes: {}, read: [], check: {}, alert: {},
    notify: { replies: { on: true, ch: ['wa', 'push'] }, matches: { on: true, ch: ['wa'] }, tips: { on: false, ch: ['email'] } },
    quiet: true, privacy: { history: true, share: true }
  }, store.get('dash') || {});
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

  /* ---------- an enquiry, as the customer sees the lead ----------
     The agent's side (provider dashboard) moves the lead: reply, suggest a time, confirm a viewing, close.
     Those arrive here as events: { k: 'reply' | 'propose' | 'confirm' | 'closed', t, text, slot, place }.
     Prototype: there is no server, so sample activity carries its own events and a real request gets a reply
     with a suggested time once the agent's usual reply time has passed (about one in four never replies,
     to show the "no reply yet" path). Calls and WhatsApp chats happen outside UpNow — the customer tells us.
     stages: sent | direct → talking → proposed / asked → confirmed → viewed → interested → closed */
  // the day and time asked for in the request panel, e.g. 'Thu 8 Oct · 18:30' — null if missing or already past
  function reqTs(r) {
    const m = r.req && /(\d{1,2}) (\w{3})\D*?(\d{1,2}):(\d{2})/.exec(r.req.when); if (!m || MON.indexOf(m[2]) < 0) return null;
    const d = new Date(new Date(r.t).getFullYear(), MON.indexOf(m[2]), +m[1], +m[3], +m[4]);
    if (d < new Date(r.t) - 180 * 864e5) d.setFullYear(d.getFullYear() + 1);
    return +d > now() ? +d : null;
  }
  const SLA = 15 * 60000; // the agent's reply target, same as the provider dashboard
  function simulate(r, lease, direct) {
    if (direct) return [];
    const wait = (r.reply || 8) * 60000;
    if (hash(r.id) % 4 === 0 || now() - r.t < wait) return [];
    const asked = reqTs(r);
    if (asked && hash(r.id) % 2) return [{ k: 'confirm', t: r.t + wait, slot: asked, text: `Confirmed for ${DAY[new Date(asked).getDay()]} ${hm(new Date(asked))}${r.req.mode === 'Video call' ? ' — I’ll video call you on WhatsApp.' : '. I’ll meet you there.'}` }];
    const d = new Date(r.t + 864e5); d.setHours(lease ? 18 : 11, lease ? 30 : 0, 0, 0);
    return [{ k: 'propose', t: r.t + wait, slot: +d, text: lease ? `Hi! Yes, it’s still available. I can show it ${DAY[d.getDay()]} at ${hm(d)} — does that work?` : `Thanks for reaching out — we have availability ${DAY[d.getDay()]} at ${hm(d)}. Does that suit you?` }];
  }
  function model(r) {
    const l = byId(r.lid), O = l ? offerOf(l.v, l.cat) : null, S = D.lead[r.id] || {};
    const lease = !!(O && O.lease), act = ((O && O.action) || '').toLowerCase();
    // one plain word for the meeting, whatever the category: viewing, visit, tour, appointment or booking
    const step = lease ? 'viewing' : /appointment|session|assessment|test|care/.test(act) ? 'appointment' : /visit/.test(act) ? 'visit' : /tour/.test(act) ? 'tour' : 'booking';
    const Step = step[0].toUpperCase() + step.slice(1);
    const who = first(r.provider), role = lease ? 'agent' : 'provider', Role = lease ? 'Agent' : 'Provider';
    const direct = r.type === 'call' || r.type === 'whatsapp';
    // S.off: you cancelled or missed a time — anything the agent sent before that no longer stands
    const evAll = S.ev || simulate(r, lease, direct), ev = evAll.filter(e => !S.off || e.t > S.off || e.k === 'reply');
    const lastOf = k => ev.filter(e => e.k === k).pop();
    const prop = lastOf('propose'), conf = lastOf('confirm'), closedEv = lastOf('closed');
    const replyEv = evAll.find(e => e.k !== 'closed');
    const askOpen = S.ask && (!prop || prop.t < S.ask) && (!conf || conf.t < S.ask);
    const slot = S.slot || (conf && !askOpen ? { ts: conf.slot, by: 'agent', t: conf.t, place: conf.place } : null);
    let stage;
    if (closedEv || (S.outcome && S.outcome !== 'interested')) stage = 'closed';
    else if (S.outcome === 'interested') stage = 'discussing';
    else if (slot) stage = slot.ts < now() ? 'viewed' : 'confirmed';
    else if (askOpen) stage = 'asked';
    else if (prop) stage = 'proposed';
    else if (replyEv || S.heard === true) stage = 'talking';
    else stage = direct ? 'direct' : 'sent';
    const late = stage === 'sent' && now() - r.t > SLA;
    const place = (slot && slot.place) || (r.building ? r.building + ' lobby' : r.area);
    const OUT = { no: 'Not for me', found: 'Found a place', done: 'Found a place', withdrawn: 'You closed it' };
    const waited = mins(now() - r.t) < 120 ? mins(now() - r.t) + ' min' : ago(r.t).replace(' ago', '');
    const pill = {
      sent: late ? ['No reply yet', 'is-warning'] : ['Awaiting reply', 'is-muted'],
      direct: S.heard === false ? ['No answer yet', 'is-warning'] : ['Did you get through?', 'is-warning'],
      talking: ['In touch', 'is-info'],
      proposed: [Role + ' replied', 'is-info'],
      asked: ['New time asked', 'is-muted'],
      confirmed: [Step + ' confirmed', 'is-success'],
      viewed: ['Viewed', 'is-warning'],
      discussing: ['Interested', 'is-info'],
      closed: closedEv ? ['Closed by ' + role, 'is-muted'] : [OUT[S.outcome] || 'Closed', 'is-muted']
    }[stage];
    const next = {
      sent: late ? `No reply in ${waited} — nudge ${who} or try similar` : `Sent ${ago(r.t)}${r.req && r.req.when ? ` · you asked for ${r.req.when}` : ` · usually replies in ${r.reply || 10} min`}`,
      direct: S.heard === false ? `${who} didn’t answer — try again or WhatsApp` : `You ${r.type === 'call' ? 'called' : 'messaged'} ${who} ${ago(r.t)} — did you get through?`,
      talking: `Agreed a ${step} time with ${who}? Add it for a reminder`,
      proposed: prop ? `${who} suggested ${fmtSlot(prop.slot)} — accept?` : '',
      asked: `Waiting for ${who} to suggest another time`,
      confirmed: slot ? `${fmtSlot(slot.ts)} · ${place}` : '',
      viewed: `How did it go? Tell us & rate the ${role}`,
      discussing: `${who} will follow up with next steps`,
      closed: closedEv ? closedEv.text : S.why ? S.why : 'Closed ' + (S.closedAt ? ago(S.closedAt) : '')
    }[stage];
    const needs = stage === 'proposed' || stage === 'viewed' || stage === 'direct' || late;
    const replyMin = replyEv ? mins(replyEv.t - r.t) : null;
    return { r, l, O, S, ev: evAll, lease, step, Step, who, role, Role, direct, stage, late, pill, next, needs, prop, conf, closedEv, replyEv, replyMin, slot, place, gone: !l };
  }
  const all = () => leads().map(model);
  const orgOf = r => (!r.org || r.org === 'Private owner' ? r.provider : r.org);
  const endDot = t => /\.$/.test(t) ? t : t + '.'; // 'Harbour & Co.' ends the sentence itself
  const typeLabel = { call: 'Phone call', whatsapp: 'WhatsApp' };
  const logLine = (id, text, via = SITE.name) => { const S = D.lead[id] = D.lead[id] || {}; (S.log = S.log || []).push({ t: now(), out: true, text, via }); };

  /* ---------- saved ---------- */
  const savedList = () => [...favs];
  const viewingFor = lid => all().find(m => m.r.lid === lid && m.stage === 'confirmed');

  /* ---------- saved searches ---------- */
  function searchInfo(q) {
    const S = U.parseState(q), O = U.offer(S);
    const where = S.loc.length ? S.loc.map(areaName).join(', ') : 'All areas';
    const bits = U.defsOf(S).map(d => U.valueLabel(d, S.f[d.id])).filter(Boolean).slice(0, 4);
    const res = U.results(S);
    return { q, S, title: `${O ? O.label : 'Everything'} · ${where}`, sub: bits.join(' · ') || 'Any price · any size', count: res.length, fresh: res.filter(l => l.posted <= 2), href: HREF.search + q };
  }
  const alertMeta = q => D.alert[q] || (D.alert[q] = { freq: 'instant', ch: 'wa' });

  /* ---------- notifications (built from what the agents did) ---------- */
  function feed() {
    const out = [];
    all().forEach(m => {
      const { r } = m, at = '#enquiry=' + r.id;
      if (m.stage === 'proposed') out.push({ id: 'pro' + r.id + m.prop.t, kind: 'enq', icon: 'msg', tone: 'info', t: m.prop.t, title: `${r.provider} suggested a time`, text: `${r.title} · ${fmtSlot(m.prop.slot)} — accept or ask for another.`, go: at });
      if (m.slot && m.slot.by === 'agent') out.push({ id: 'con' + r.id + m.slot.t, kind: 'enq', icon: 'cal', tone: 'ok', t: m.slot.t, title: `${m.Step} confirmed`, text: `${r.provider} confirmed ${fmtSlot(m.slot.ts)} at ${m.place}.`, go: at });
      if (m.stage === 'viewed') out.push({ id: 'out' + r.id, kind: 'enq', icon: 'star', tone: 'amber', t: m.slot.ts + 3600000, title: `How was your ${m.step} at ${r.building || r.area}?`, text: `Rate ${m.who} and tell us if you want to continue.`, go: at });
      if (m.late) out.push({ id: 'late' + r.id, kind: 'enq', icon: 'clock', tone: 'amber', t: r.t + SLA, title: `No reply yet from ${m.who}`, text: `${r.title} — nudge them or contact similar listings.`, go: at });
      if (m.closedEv) out.push({ id: 'cls' + r.id, kind: 'enq', icon: 'x', tone: 'red', t: m.closedEv.t, title: `${r.provider} closed your enquiry`, text: `${r.title} — ${m.closedEv.text}`, go: at });
    });
    alerts().forEach(q => { const s = searchInfo(q); if (s.fresh.length && alertMeta(q).freq !== 'paused') out.push({ id: 'new' + q + s.fresh.length, kind: 'match', icon: 'spark', tone: 'ok', t: now() - 6 * 3600000, title: `${s.fresh.length} new for “${s.title}”`, text: `Including ${s.fresh[0].title}.`, go: s.href }); });
    return out.sort((a, b) => b.t - a.t);
  }
  const unread = () => feed().filter(n => !D.read.includes(n.id)).length;

  /* ---------- routing ---------- */
  const SECTIONS = [['overview', 'Overview', 'home'], ['enquiries', 'My enquiries', 'msg'], ['saved', 'Saved', 'heart'], ['alerts', 'Alerts', 'bell'], ['profile', 'Profile & privacy', 'user']];
  const route = () => { const h = location.hash.slice(1); if (h.startsWith('enquiry=')) return { s: 'enquiries', id: h.slice(8) }; return { s: SECTIONS.some(x => x[0] === h) ? h : 'overview' }; };
  const go = h => { if (location.hash === '#' + h) render(); else location.hash = h; };
  const A = { etab: 'active', stab: 'items', list: 'all', pick: new Set(), ntab: 'all' }; // view state

  function nav(cur) {
    const L = all(), need = L.filter(m => m.needs).length, n = unread();
    const badge = { enquiries: need || null, saved: favs.size || null, alerts: n || null };
    const u = user();
    return `<aside class="acc-side">
      <div class="acc-who"><span class="acc-av">${esc(U.auth.initialsOf(u))}</span><div><b>${esc(u.name || u.email || 'Your account')}</b><small>${u.phone ? `${ico('shield')}Verified mobile` : esc(u.email || '')}</small></div></div>
      <nav class="acc-nav" aria-label="Account">${SECTIONS.map(([id, l, i]) => `<a href="#${id}" class="${cur === id ? 'is-active' : ''}">${ico(i)}<span>${l}</span>${badge[id] ? `<em class="${id === 'enquiries' || id === 'alerts' ? 'is-hot' : ''}">${badge[id]}</em>` : ''}</a>`).join('')}</nav>
      <a class="acc-list-cta" href="${HREF.join}">${ico('brief')}<span><b>List on ${esc(SITE.name)}</b><small>For owners, agents and businesses</small></span>${ico('chevR')}</a>
    </aside>`;
  }

  function render() {
    const u = user();
    if (!u) { root.innerHTML = gate(); return; }
    const R = route();
    const body = { overview, enquiries: () => R.id ? tracking(R.id) : enquiries(), saved, alerts: alertsView, profile }[R.s]();
    root.innerHTML = nav(R.s) + `<section class="acc-main">${body}</section>`;
    document.title = `${(SECTIONS.find(x => x[0] === R.s) || [])[1] || 'My account'} | ${SITE.name}`;
    U.updateHdrCounts();
  }

  /* ---------- signed out ---------- */
  function gate() {
    const n = favs.size, e = leads().length;
    return `<div class="acc-gate"><span class="acc-gate-ic">${ico('lock')}</span><h1>Your ${esc(SITE.name)} account</h1>
      <p>Sign in to see your saved listings, every enquiry and agent reply in one place, viewing times and alerts for new matches.</p>
      ${n || e ? `<div class="acc-gate-note">${ico('heart')}<span>On this device: <b>${n} saved</b> and <b>${e} ${e === 1 ? 'enquiry' : 'enquiries'}</b>. Sign in to keep them with your account.</span></div>` : ''}
      <button class="btn btn-primary" type="button" data-act="signin">${ico('user')}Log in or create an account</button>
      <small>No password — we text you a 6-digit code.</small></div>`;
  }

  /* ---------- shared bits ---------- */
  const head = (title, sub, actions = '') => `<header class="acc-h"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="acc-h-act">${actions}</div>` : ''}</header>`;
  const empty = (icon, title, text, action = '') => `<div class="acc-empty">${ico(icon)}<b>${title}</b><span>${text}</span>${action}</div>`;
  const thumb = r => `<img class="acc-thumb" src="${esc(PATHS.img(r.img))}" alt="" loading="lazy">`;
  const pill = ([t, k]) => `<span class="status-pill ${k}">${esc(t)}</span>`;
  const waHref = (phone, text) => 'https://wa.me/' + String(phone || '').replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');
  const provHref = name => HREF.provider + '?p=' + encodeURIComponent(name);
  const similarHref = r => { const l = byId(r.lid); return l ? HREF.search + U.toQuery({ ...U.blankState(l.v, l.cat), loc: [l.loc] }) : HREF.search; };
  const tabs = (items, cur, key) => `<div class="acc-tabs" role="tablist">${items.map(([id, l, n]) => `<button type="button" class="${id === cur ? 'is-active' : ''}" data-tab="${key}" data-v="${id}">${l}${n != null ? `<em>${n}</em>` : ''}</button>`).join('')}</div>`;
  const STAGE_ICON = { sent: 'clock', direct: 'phone', talking: 'msg', proposed: 'msg', asked: 'clock', confirmed: 'cal', viewed: 'star', discussing: 'msg', closed: 'check' };
  const stars = (n, who) => n ? `<p class="acc-stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)} <small>you rated ${esc(who)}</small></p>` : '';
  const noEnq = () => empty('msg', 'No enquiries yet', 'When you request a viewing, call or WhatsApp an agent, it’s tracked here — with every reply and next step.', `<a class="btn btn-primary btn-sm" href="${HREF.search}">${ico('search')}Start searching</a> <button class="btn btn-outline btn-sm" type="button" data-act="sample">Preview with sample activity</button>`);

  // the one button that moves an enquiry on, used in the table
  function nextBtn(m) {
    const id = m.r.id, S = m.S;
    if (m.stage === 'proposed') return `<button class="btn btn-primary btn-sm" type="button" data-act="accept" data-id="${id}">Accept ${esc(shortSlot(m.prop.slot))}</button>`;
    if (m.stage === 'viewed') return `<button class="btn acc-dark btn-sm" type="button" data-act="outcome" data-id="${id}">Rate &amp; decide</button>`;
    if (m.stage === 'direct' && S.heard !== false) return `<button class="btn btn-outline btn-sm" type="button" data-act="heard" data-id="${id}">Yes, I did</button>`;
    if (m.late && !S.nudged) return `<button class="btn btn-outline btn-sm" type="button" data-act="nudge" data-id="${id}">Nudge ${esc(m.who)}</button>`;
    return `<a class="btn btn-outline btn-sm" href="#enquiry=${id}">Open</a>`;
  }

  // how you contacted them — the same source tags and colours as the provider's Leads board
  const VIA = { email: ['UpNow', '#136142'], request: ['UpNow', '#136142'], whatsapp: ['WhatsApp', '#1faa59'], call: ['Phone', '#b7791f'] };
  const srcTag = r => { const [t, c] = VIA[r.type] || VIA.email; return `<span class="lead-src" style="--c:${c}"><i></i>${t}</span>`; };
  const av = (n, cls = '') => `<span class="lead-av ${cls}">${esc(initials(n))}</span>`;
  const spec = r => [...(r.spec || []).slice(0, 2), r.building || r.area].filter(Boolean).join(' · ');
  // the latest thing said in the conversation, like the message line on a provider's lead card
  const lastMsg = m => { const e = [...m.ev].reverse().find(x => x.text && x.t <= now()); return e ? m.who + ': ' + e.text : m.r.msg ? 'You: ' + m.r.msg : m.r.req && m.r.req.when ? 'You asked for ' + m.r.req.when : m.next; };
  function leadCard(m) {
    const { r } = m, waited = m.late ? Math.round((now() - r.t) / 60000) : 0;
    return `<a class="lead-card ${m.needs ? 'is-hot' : ''}" href="#enquiry=${r.id}">
      <div class="lead-t">${av(r.provider)}<b>${esc(r.provider)}</b></div>
      <div class="lead-lst">${ico('building')}<span>${esc(r.title)}</span></div>
      <p>${esc(lastMsg(m))}</p>
      <div class="lead-f">${srcTag(r)}<span class="sp"></span>${m.needs && !m.late ? '<span class="lead-tag">Your turn</span>' : m.late ? `<span class="late">${waited < 120 ? waited + 'm' : Math.round(waited / 60) + 'h'} no reply</span>` : `<span>${ago(m.ev.length ? m.ev[m.ev.length - 1].t : r.t)}</span>`}</div></a>`;
  }
  const actCard = leadCard;

  /* ---------- overview (C17, signed-in home) ---------- */
  function overview() {
    const u = user(), L = all(), need = L.filter(m => m.needs);
    const week = L.filter(m => m.stage === 'confirmed' && m.slot.ts - now() < 7 * 864e5);
    const replies = L.filter(m => m.stage === 'proposed');
    const al = alerts()[0] && searchInfo(alerts()[0]);
    const h = new Date().getHours(), hi = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const summary = [week.length && `${week.length} ${week.length === 1 ? week[0].step : 'viewings'} this week`, replies.length && `${replies.length} ${replies.length === 1 ? replies[0].role + ' reply' : 'replies'} waiting for you`, al && al.fresh.length && `${al.fresh.length} new matches`].filter(Boolean).join(' · ') || (favs.size ? `${favs.size} saved` : 'Find something you love and it will show up here.');
    const rec = D.privacy.history ? recent().slice(0, 4) : [];
    const lastLead = L.find(m => m.l);
    const cross = lastLead && lastLead.l.v === 'spaces' && lastLead.lease ? [['services', 'cleaning', 'spark', 'Move-in cleaning', 'Verified cleaners near ' + lastLead.r.area], ['services', 'movers', 'box', 'Movers & packers', 'Compare verified movers'], ['insurance', 'property', 'shield', 'Tenant contents insurance', 'Compare licensed insurers']] : [];
    return `${head(`${hi}, ${esc(first(u.first || u.name) || 'there')}`, summary)}
      ${al ? `<a class="acc-resume" href="${esc(al.href)}">${ico('trend')}<span><b>Continue: ${esc(al.title)}</b><small>${esc(al.sub)}${al.fresh.length ? ` · <b>${al.fresh.length} new</b>` : ''}</small></span><span class="btn btn-sm">${al.fresh.length ? `Show ${al.fresh.length} new` : 'Open'}</span></a>` : ''}
      ${need.length ? `<section class="acc-sec"><div class="acc-sec-h"><h2>Needs you</h2></div><div class="acc-needs">${need.slice(0, 3).map(m => `<a href="#enquiry=${m.r.id}" class="acc-need">${ico(STAGE_ICON[m.stage])}<span><b>${esc(m.next)}</b><small>${esc(m.r.title)}</small></span>${ico('chevR')}</a>`).join('')}</div></section>` : ''}
      <section class="acc-sec"><div class="acc-sec-h"><h2>Your enquiries</h2>${L.length ? `<a href="#enquiries">View all ${L.length}${ico('chevR')}</a>` : ''}</div>
        ${L.length ? `<div class="acc-acts">${L.filter(m => m.stage !== 'closed').concat(L.filter(m => m.stage === 'closed')).slice(0, 4).map(actCard).join('')}</div>` : noEnq()}</section>
      ${al && al.fresh.length ? `<section class="acc-sec"><div class="acc-sec-h"><h2>New matches for “${esc(al.title)}”</h2><a href="${esc(al.href)}">See all${ico('chevR')}</a></div><div class="acc-grid">${al.fresh.slice(0, 4).map(l => U.card(l)).join('')}</div></section>` : ''}
      ${favs.size ? `<section class="acc-sec"><div class="acc-sec-h"><h2>Saved</h2><a href="#saved">All ${favs.size}${ico('chevR')}</a></div><div class="acc-grid">${savedList().map(byId).filter(Boolean).slice(0, 4).map(l => U.card(l)).join('')}</div></section>` : ''}
      ${rec.length ? `<section class="acc-sec"><div class="acc-sec-h"><h2>Recently viewed</h2><a href="#profile">History settings${ico('chevR')}</a></div><div class="acc-grid">${rec.map(l => U.card(l)).join('')}</div></section>` : ''}
      ${cross.length ? `<section class="acc-sec"><div class="acc-sec-h"><h2>Moving soon? Get it sorted</h2></div><div class="acc-cross">${cross.map(([v, o, i, t, s]) => `<a href="${HREF.search}?v=${v}&o=${o}">${ico(i)}<span><b>${t}</b><small>${s}</small></span>${ico('chevR')}</a>`).join('')}</div></section>` : ''}`;
  }

  /* ---------- my enquiries (C18) — the provider's Leads board, from the customer's side ---------- */
  // columns follow the agent's stages: New → Contacted → Viewing → Offer → Won / Lost
  const COLS = [['sent', 'Sent', ['sent', 'direct']], ['replied', 'Replied', ['talking', 'proposed', 'asked']], ['viewing', 'Viewing', ['confirmed']], ['after', 'After viewing', ['viewed', 'discussing']], ['closed', 'Closed', ['closed']]];
  const colOf = m => COLS.findIndex(c => c[2].includes(m.stage));
  function enquiries() {
    const L = all();
    if (!L.length) return head('My enquiries', `Every request, call and WhatsApp you started on ${esc(SITE.name)} — across all agents.`) + noEnq();
    const f = A.via || 'all', LL = L.filter(m => f === 'all' || (VIA[m.r.type] || VIA.email)[0] === f);
    const vias = [...new Set(L.map(m => (VIA[m.r.type] || VIA.email)[0]))];
    const view = A.eview || 'board';
    const bar = `<div class="lead-bar"><button class="chip ${f === 'all' ? 'is-active' : ''}" data-tab="via" data-v="all">All <em>${L.length}</em></button>${vias.map(v => `<button class="chip ${f === v ? 'is-active' : ''}" data-tab="via" data-v="${v}"><span class="lead-src" style="--c:${Object.values(VIA).find(x => x[0] === v)[1]}"><i></i>${v}</span><em>${L.filter(m => (VIA[m.r.type] || VIA.email)[0] === v).length}</em></button>`).join('')}</div>`;
    const seg = `<div class="lead-seg">${[['board', 'Board', 'grid4'], ['list', 'List', 'list']].map(([k, l, i]) => `<button type="button" class="${view === k ? 'is-on' : ''}" data-tab="eview" data-v="${k}">${ico(i)}${l}</button>`).join('')}</div>`;
    const body = view === 'list'
      ? `<div class="acc-box acc-table-wrap"><table class="acc-table"><thead><tr><th>Agent</th><th>Via</th><th>Listing</th><th>Stage</th><th>Next step</th><th>Last activity</th></tr></thead><tbody>${LL.sort((a, b) => b.r.t - a.r.t).map(m => `<tr data-href="#enquiry=${m.r.id}" class="${m.needs ? 'is-hot' : ''}">
          <td><div class="acc-cell">${av(m.r.provider, 'sm')}<span><b>${esc(m.r.provider)}</b><small>${esc(orgOf(m.r))}</small></span></div></td><td>${srcTag(m.r)}</td><td><b class="lead-cell-t">${esc(m.r.title)}</b></td>
          <td><span class="lead-st ${m.stage === 'closed' ? 'is-mute' : ''}">${esc(COLS[colOf(m)][1])}</span></td><td><small class="acc-next">${esc(m.next)}</small></td><td>${ago(m.ev.length ? m.ev[m.ev.length - 1].t : m.r.t)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="lead-board">${COLS.map((c, i) => { const ms = LL.filter(m => colOf(m) === i); return `<div class="lead-col"><div class="lead-col-h">${c[1]}<span>${ms.length}</span></div>${ms.map(leadCard).join('') || '<div class="lead-col-empty">—</div>'}</div>`; }).join('')}</div>`;
    return `${head('My enquiries', `Every request, call and WhatsApp you started on ${esc(SITE.name)} — one place to see where each agent is.`, seg)}${bar}${body}
      <p class="acc-foot">${ico('shield')}Calls and WhatsApps you start from ${esc(SITE.name)} appear here too, so you never lose track of who you contacted.</p>`;
  }
  // the stage stepper, same steps as the board columns
  function progress(m) {
    const idx = colOf(m);
    return COLS.map((c, i) => ({ t: c[1], done: i < idx, cur: i === idx }));
  }

  /* ---------- one enquiry (C19 tracking) ---------- */
  function tracking(id) {
    const r = leads().find(x => x.id === id);
    if (!r) return `${head('Enquiry not found', '')}${empty('msg', 'We couldn’t find this enquiry', 'It may have been removed from this device.', `<a class="btn btn-outline btn-sm" href="#enquiries">Back to my enquiries</a>`)}`;
    const m = model(r), { S, l, lease, who, role, slot, stage } = m, flow = (m.O && m.O.flow) || [];
    const loc = (r.building ? r.building + ', ' : '') + r.area;
    const st = (cls, icon, title, when, extra = '') => `<li class="${cls}"><i>${icon}</i><div><b>${title}</b>${when ? `<small>${when}</small>` : ''}${extra}</div></li>`;
    const acts = (...b) => `<div class="acc-tl-act">${b.filter(Boolean).join('')}</div>`;
    const waBtn = (text, label = 'WhatsApp') => `<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(r.pphone, text)}" data-walog="${r.id}">${ico('wa')}${label}</a>`;
    const hi = `Hi ${who}, about ${r.title} (Ref ${r.ref}) on ${SITE.name}.`;
    const sentTxt = r.req ? `${esc(r.req.title)} — sent by ${r.type === 'call' ? 'phone' : r.type === 'whatsapp' ? 'WhatsApp' : 'email'}` : r.type === 'call' ? `You called ${esc(who)}` : r.type === 'whatsapp' ? `You messaged ${esc(who)} on WhatsApp` : `${m.Step} request sent`;
    const items = [];

    // 1 · sent (agent: New)
    items.push(st('is-done', ico('check'), sentTxt, `${fmtSlot(r.t)} · via ${esc(SITE.name)}${m.direct ? '' : ` · delivered to ${esc(orgOf(r))}`}`,
      r.req && r.req.when ? `<p class="acc-asked">${ico('cal')}You asked for <b>${esc(r.req.when)}</b>${r.req.mode ? ' · ' + esc(r.req.mode) : ''}</p>` : ''));

    // 2 · reply (agent: Contacted)
    if (stage === 'sent') items.push(m.late
      ? st('is-cur is-warn', ico('clock'), `No reply from ${esc(who)} yet`, `Sent ${ago(r.t)} · agents on ${esc(SITE.name)} aim to reply within 15 min${S.nudged ? ` · you nudged ${ago(S.nudged)}` : ''}`,
        acts(S.nudged ? '' : `<button class="btn btn-primary btn-sm" data-act="nudge" data-id="${r.id}">${ico('bell')}Nudge ${esc(who)}</button>`, waBtn(hi + ' Is it still available?'), `<a class="btn btn-outline btn-sm" href="${esc(similarHref(r))}">${ico('search')}Similar listings</a>`))
      : st('is-cur', ico('clock'), `Waiting for ${esc(who)} to reply`, `Usually replies in ${r.reply || 10} min · we’ll WhatsApp you the moment they do`));
    else if (stage === 'direct') items.push(S.heard === false
      ? st('is-cur is-warn', ico('phone'), `${esc(who)} didn’t answer`, 'Agents often call back within the hour — or try WhatsApp.', acts(`<a class="btn btn-outline btn-sm" href="tel:${esc(r.pphone)}" data-calllog="${r.id}">${ico('phone')}Call again</a>`, waBtn(hi), `<button class="btn btn-ghost btn-sm" data-act="heard" data-id="${r.id}">We’re in touch now</button>`))
      : st('is-cur', ico('phone'), 'Did you get through?', `Calls and WhatsApps happen outside ${esc(SITE.name)} — tell us so we can keep track.`, acts(`<button class="btn btn-primary btn-sm" data-act="heard" data-id="${r.id}">Yes, we’re in touch</button>`, `<button class="btn btn-outline btn-sm" data-act="noanswer" data-id="${r.id}">No answer</button>`)));
    else items.push(st('is-done', ico('check'), m.replyEv ? `${esc(who)} replied` : `You’re in touch with ${esc(who)}`,
      m.replyEv ? `${fmtSlot(m.replyEv.t)} · replied in ${m.replyMin} min` : 'You confirmed you got through', m.replyEv && m.replyEv.text ? `<blockquote>“${esc(m.replyEv.text)}”</blockquote>` : ''));

    // 3 · viewing (agent: Viewing) — the agent suggests or confirms a time; you accept or ask for another
    if (stage === 'proposed') items.push(st('is-cur', ico('cal'), `${esc(who)} suggested ${fmtSlot(m.prop.slot)}`, `${inDays(m.prop.slot)} · ${esc(m.place)}`,
      acts(`<button class="btn btn-primary btn-sm" data-act="accept" data-id="${r.id}">${ico('check')}Accept</button>`, `<button class="btn btn-outline btn-sm" data-act="asktime" data-id="${r.id}">${ico('clock')}Ask for another time</button>`)));
    else if (stage === 'asked') items.push(st('is-cur', ico('clock'), 'You asked for another time', `${ago(S.ask)} · ${esc(who)} will suggest a new time — we’ll let you know`, acts(waBtn(hi + ' Which other times work for you?', 'Follow up'))));
    else if (stage === 'talking') items.push(st('is-cur', ico('cal'), `Agreed a ${m.step} time with ${esc(who)}?`, 'Add it here and we’ll remind you on WhatsApp 2 hours before.',
      acts(`<button class="btn btn-primary btn-sm" data-act="agreed" data-id="${r.id}">${ico('plus')}Add ${m.step} time</button>`, waBtn(hi + ` When could I come for a ${m.step}?`, `Ask ${esc(who)}`))));
    else if (slot) items.push(st(stage === 'confirmed' ? 'is-cur' : 'is-done', ico('cal'), `${m.Step} · ${fmtSlot(slot.ts)}`,
      `${inDays(slot.ts)} · ${esc(m.place)} · ${slot.by === 'agent' ? `confirmed by ${esc(who)}` : m.prop ? 'you accepted' : 'added by you'}`,
      stage === 'confirmed' ? acts(`<a class="btn btn-outline btn-sm" href="${ics(m)}" download="upnow-${r.id}.ics">${ico('cal')}Add to calendar</a>`, `<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc + ', Dubai')}">${ico('pin')}Directions</a>`, `<button class="btn btn-outline btn-sm" data-act="asktime" data-id="${r.id}">${ico('clock')}Reschedule</button>`, `<button class="btn btn-ghost btn-sm" data-act="cancel" data-id="${r.id}">Cancel</button>`) + `<p class="acc-tl-note">${ico('bell')}We’ll remind you on WhatsApp 2 hours before.</p>` : ''));
    else items.push(st(stage === 'closed' ? 'is-skip' : '', '3', m.Step, stage === 'closed' ? 'Didn’t get this far' : r.req && r.req.when ? `You asked for ${esc(r.req.when)} — ${esc(who)} confirms it or suggests another time` : `${esc(who)} suggests or confirms a time`));

    // 4 · feedback (agent: Won / Lost)
    if (stage === 'viewed') items.push(st('is-cur', ico('star'), 'How did it go?', `Tell ${esc(who)} what’s next and rate the ${role} — it keeps ${esc(SITE.name)} honest.`,
      acts(`<button class="btn btn-primary btn-sm" data-act="outcome" data-id="${r.id}">Rate &amp; decide</button>`, `<button class="btn btn-outline btn-sm" data-act="noshow" data-id="${r.id}">It didn’t happen</button>`)));
    else if (stage === 'discussing') items.push(st('is-cur', ico('msg'), 'You’re interested', `${S.closedAt ? fmtSlot(S.closedAt) + ' · ' : ''}${esc(who)} knows and will follow up with you directly.`,
      stars(S.rating, who) + acts(waBtn(hi + ' I’m interested — what are the next steps?', `Message ${esc(who)}`), `<button class="btn btn-ghost btn-sm" data-act="withdraw" data-id="${r.id}">Close this enquiry</button>`)));
    else if (stage === 'closed') items.push(st('is-done', ico(m.closedEv ? 'x' : 'check'), m.closedEv ? `${esc(r.provider)} closed this enquiry` : esc(m.pill[0]),
      m.closedEv ? `${fmtSlot(m.closedEv.t)} · “${esc(m.closedEv.text)}”` : (S.closedAt ? fmtSlot(S.closedAt) : '') + (S.why ? ' · ' + esc(S.why) : ''),
      stars(S.rating, who) + (S.outcome === 'found' || S.outcome === 'done' ? '' : acts(`<a class="btn btn-outline btn-sm" href="${esc(similarHref(r))}">${ico('search')}See similar listings</a>`))));
    else items.push(st('', '4', 'Your feedback', `After the ${m.step} — interested or not, and rate the ${role}`));


    // contact log: what you did, what the agent sent, and other times you contacted them about this listing
    const log = [{ t: r.t, out: true, text: r.req ? `${r.req.title}${r.req.when ? ' · ' + r.req.when : ''}` : typeLabel[r.type] || m.Step + ' request', via: r.type === 'call' ? 'Phone' : r.type === 'whatsapp' ? 'WhatsApp' : SITE.name },
      ...leads().filter(x => x.lid === r.lid && x.id !== r.id).map(x => ({ t: x.t, out: true, text: typeLabel[x.type] || m.Step + ' request', via: x.type === 'whatsapp' ? 'WhatsApp' : x.type === 'call' ? 'Phone' : SITE.name })),
      ...m.ev.map(e => ({ t: e.t, text: e.text || (e.k === 'confirm' ? `Confirmed ${fmtSlot(e.slot)}` : e.k === 'propose' ? `Suggested ${fmtSlot(e.slot)}` : ''), via: 'WhatsApp' })), ...(S.log || [])].filter(x => x.t <= now()).sort((a, b) => a.t - b.t);
    const checks = lease ? ['Emirates ID or passport', 'Your move-in date and who will live there', 'Questions: parking, chiller, building rules'] : ['Reference ' + r.ref, 'Questions about price and what’s included'];
    const ck = D.check[r.id] || [];
    const u = user(), P = l && window.DM ? DM.prov(l.provider.name) : null;
    const kv = [r.req && r.req.when && ['You asked for', r.req.when], r.req && r.req.mode && ['Viewing', r.req.mode], ['Contacted via', (VIA[r.type] || VIA.email)[0]], ['Usually replies', P ? (P.reply <= 5 ? 'within 5 min' : 'within ' + P.reply + ' min') : 'within ' + (r.reply || 10) + ' min'], ['Listing ref', r.ref], ['Enquiry', r.id]].filter(Boolean);
    return `<nav class="acc-crumbs"><a href="#enquiries">${ico('chevL')}My enquiries</a><span>${esc(r.id)}</span></nav>
      <div class="acc-box lead-h"><div class="lead-h-top">${av(r.provider, 'is-lg')}<div><h1>${esc(r.provider)}</h1><small>${srcTag(r)} · ${esc(orgOf(r))} · sent ${ago(r.t)}</small></div>${pill(m.pill)}</div>
        <div class="lead-stp">${progress(m).map(s => `<span class="${s.done ? 'is-done' : ''} ${s.cur ? 'is-on' : ''}">${esc(s.t)}</span>`).join('')}</div>
        <a class="lead-orig" href="${l ? HREF.listing + '?id=' + r.lid : '#'}">${thumb(r)}<span><b>${esc(r.title)}</b><small>${esc(spec(r))}${l ? '' : ' · no longer listed'}</small></span>${ico('chevR')}</a>
        <div class="lead-kv">${kv.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></div>
      <div class="acc-track"><div class="acc-box"><h2>Progress</h2><ol class="acc-tl">${items.join('')}</ol></div>
        <aside class="acc-track-side">
          ${l && window.DM ? DM.agentCard(l) : `<div class="acc-box"><a class="acc-cell acc-agent" href="${provHref(r.provider)}">${av(r.provider)}<span><b>${esc(r.provider)}</b><small>${esc(orgOf(r))}</small></span>${ico('chevR')}</a><div class="acc-two">${waBtn(hi)}<a class="btn btn-outline btn-sm" href="tel:${esc(r.pphone)}" data-calllog="${r.id}">${ico('phone')}Call</a></div></div>`}
          <div class="acc-box"><h3>Contact log</h3><ul class="acc-log">${log.map(x => `<li class="${x.out ? 'is-out' : ''}"><span>${esc(x.text)}</span><small>${x.out ? 'You' : esc(who)} · ${fmtSlot(x.t)} · ${esc(x.via)}</small></li>`).join('')}</ul></div>
          <div class="acc-box"><h3>What ${esc(who)} can see</h3>
            <p class="acc-shared-l">${ico('eye')}<span>Your name${u && u.phone ? ' and mobile' : ''}${r.msg ? ' and your message' : ''} — shared when you ${r.type === 'call' ? 'called' : r.type === 'whatsapp' ? 'messaged them' : 'sent the request'}. Documents are never shared automatically.</span></p>
            ${r.msg ? `<blockquote class="acc-msg">“${esc(r.msg)}”</blockquote>` : ''}
            ${stage !== 'closed' ? `<button class="acc-report" type="button" data-act="withdraw" data-id="${r.id}">${ico('x')}Close this enquiry</button>` : ''}</div>
          ${stage !== 'closed' ? `<div class="acc-box"><h3>${lease ? 'Bring to the viewing' : `Before your ${m.step}`}</h3>${checks.map((c, i) => `<label class="acc-check"><input type="checkbox" data-check="${r.id}" data-i="${i}" ${ck.includes(i) ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>` : ''}
          <button class="acc-report is-out" type="button" data-act="report" data-id="${r.id}">${ico('flag')}Report a problem with this ${role}</button>
        </aside></div>`;
  }
  function ics(m) {
    const t = new Date(m.slot.ts), e = new Date(m.slot.ts + 3600000), f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UpNow//EN', 'BEGIN:VEVENT', 'UID:' + m.r.id + '@upnow', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(t), 'DTEND:' + f(e),
      'SUMMARY:' + m.Step + ' — ' + m.r.title.replace(/[,;]/g, ' '), 'LOCATION:' + m.place.replace(/[,;]/g, ' '), 'DESCRIPTION:With ' + m.r.provider + ' (' + m.r.pphone + ') · Ref ' + m.r.ref, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
  }

  /* ---------- a time agreed on the phone or WhatsApp ---------- */
  function agreedModal(id) {
    const m = model(leads().find(x => x.id === id));
    const d = new Date(now() + 864e5), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    ask({ title: `Add your ${m.step} time`, text: `The time you agreed with ${esc(m.who)} — we’ll remind you on WhatsApp 2 hours before.`, ok: 'Save time',
      fields: [{ name: 'd', label: 'Day', type: 'date', value: day }, { name: 't', label: 'Time', type: 'time', value: m.lease ? '18:30' : '11:00' }, { name: 'p', label: 'Where', value: m.place }] }, v => {
      const ts = new Date(v.d + 'T' + (v.t || '12:00')).getTime();
      if (!v.d || isNaN(ts) || ts < now()) { toast('Pick a day and time in the future'); return false; }
      const S = D.lead[id] = D.lead[id] || {}; S.slot = { ts, by: 'you', place: v.p.trim() || m.place, t: now() }; S.heard = true; delete S.ask;
      logLine(id, `Added ${m.step}: ${fmtSlot(ts)}`); save(); render(); toast(`${m.Step} saved — we’ll remind you`);
    });
  }

  /* ---------- after the viewing (C20) ---------- */
  function outcomeModal(id) {
    const m = model(leads().find(x => x.id === id));
    const P = { o: 'interested', rate: m.S.rating || 0, tags: new Set(m.S.tags || []), match: m.S.match || null, why: new Set() };
    const OPTS = [['interested', 'heart', 'I’m interested', `${m.who} will follow up with next steps`], ['no', 'x', 'Not for me', 'We’ll tune your matches — tell us why'], ['found', 'check', 'I found a place', 'Close this enquiry']];
    const TAGS = ['On time', m.lease ? 'Knew the building' : 'Knew the details', 'Answered questions', 'Photos matched', 'Pushy', 'Late'];
    const WHY = ['Price', 'Size', 'Location', 'Condition', 'Not as listed'];
    const paint = () => openModal(`<div class="acc-modal"><div class="acc-modal-h"><div><h3>How did the ${esc(m.step)} go?</h3><p>${esc(m.r.title)} · ${m.slot ? DAY[new Date(m.slot.ts).getDay()] + ' ' : ''}with ${esc(m.r.provider)}</p></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div>
      <div class="acc-radios">${OPTS.map(([v, i, t, s]) => `<button type="button" class="${P.o === v ? 'is-active' : ''}" data-o="${v}"><i>${ico(i)}</i><span><b>${t}</b><small>${esc(s)}</small></span><em></em></button>`).join('')}</div>
      ${P.o === 'no' ? `<div class="acc-tags acc-why">${WHY.map(t => `<button type="button" class="chip ${P.why.has(t) ? 'is-active' : ''}" data-why="${t}">${t}</button>`).join('')}</div>` : ''}
      <div class="acc-rate"><b>Rate ${esc(m.r.provider)}</b><div>${[1, 2, 3, 4, 5].map(n => `<button type="button" data-rate="${n}" class="${n <= P.rate ? 'is-on' : ''}" aria-label="${n} star">${ico('star')}</button>`).join('')}</div>
        <div class="acc-tags">${TAGS.map(t => `<button type="button" class="chip ${P.tags.has(t) ? 'is-active' : ''}" data-tag="${t}">${t}</button>`).join('')}</div>
        <div class="acc-match"><span>Did it match the listing?</span>${['Yes', 'Not really'].map(v => `<button type="button" class="chip ${P.match === v ? 'is-active' : ''}" data-match="${v}">${v}</button>`).join('')}</div></div>
      <button class="btn btn-primary acc-modal-go" type="button" data-out-go>${P.o === 'interested' ? `Send to ${esc(m.who)} &amp; save` : 'Save'}</button>
      <p class="acc-modal-foot">Ratings are anonymous to other users and help keep ${esc(SITE.name)} verified.</p></div>`, 'acc-modal-wrap');
    paint();
    const sc = document.querySelector('.scrim');
    sc.onclick = e => {
      const b = e.target.closest('[data-o],[data-rate],[data-tag],[data-match],[data-why],[data-out-go]'); if (!b) return;
      if (b.dataset.o) P.o = b.dataset.o;
      if (b.dataset.rate) P.rate = +b.dataset.rate;
      if (b.dataset.tag) P.tags.has(b.dataset.tag) ? P.tags.delete(b.dataset.tag) : P.tags.add(b.dataset.tag);
      if (b.dataset.why) P.why.has(b.dataset.why) ? P.why.delete(b.dataset.why) : P.why.add(b.dataset.why);
      if (b.dataset.match) P.match = b.dataset.match;
      if (b.hasAttribute('data-out-go')) {
        const S = D.lead[id] = D.lead[id] || {};
        sc.onclick = null; closeModal();
        Object.assign(S, { outcome: P.o, rating: P.rate, tags: [...P.tags], match: P.match, why: P.o === 'no' ? [...P.why].join(', ') : '', closedAt: now() });
        logLine(id, { interested: 'You’re interested', no: 'Not for me' + (P.why.size ? ' (' + [...P.why].join(', ') + ')' : ''), found: 'Found a place' }[P.o]);
        save(); render();
        if (P.o === 'interested') window.open(waHref(m.r.pphone, `Hi ${m.who}, thanks for the ${m.step} of ${m.r.title} (Ref ${m.r.ref}). I’m interested — what are the next steps?`), '_blank', 'noopener');
        toast(P.o === 'found' ? 'Great news — enquiry closed' : P.o === 'interested' ? `${m.who} knows you’re interested` : 'Thanks — we’ll tune your matches');
        return;
      }
      paint();
    };
  }

  /* ---------- close an enquiry yourself ---------- */
  function withdrawModal(id) {
    const m = model(leads().find(x => x.id === id));
    const WHY = ['Found a place elsewhere', 'Too expensive', 'Changed my plans', `No reply from the ${m.role}`, 'Something else'];
    let pick = WHY[0];
    const paint = () => openModal(`<div class="acc-modal"><div class="acc-modal-h"><div><h3>Close this enquiry?</h3><p>We’ll let ${esc(m.who)} know you’re no longer interested in ${esc(m.r.title)}.</p></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div>
      <div class="acc-radios is-plain">${WHY.map(w => `<button type="button" class="${pick === w ? 'is-active' : ''}" data-w="${esc(w)}"><span><b>${esc(w)}</b></span><em></em></button>`).join('')}</div>
      <button class="btn btn-primary acc-modal-go" type="button" data-w-go>Close enquiry</button></div>`, 'acc-modal-wrap');
    paint();
    const sc = document.querySelector('.scrim');
    sc.onclick = e => {
      const b = e.target.closest('[data-w],[data-w-go]'); if (!b) return;
      if (b.dataset.w) { pick = b.dataset.w; paint(); return; }
      const S = D.lead[id] = D.lead[id] || {};
      Object.assign(S, { outcome: 'withdrawn', why: pick, closedAt: now() }); logLine(id, 'You closed the enquiry · ' + pick);
      sc.onclick = null; closeModal(); save(); render(); toast(`Closed — ${m.who} has been told`);
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
      if (!l) return `<div class="acc-saved is-gone"><div class="acc-gone">${ico('x')}<b>No longer available</b><small>This listing was removed by the agent.</small><button class="btn btn-outline btn-sm" data-fav="${esc(id)}">Remove</button></div></div>`;
      const note = D.notes[id], v = L.find(m => m.r.lid === id && m.stage === 'confirmed');
      return `<div class="acc-saved">${v ? `<a class="acc-drop is-view" href="#enquiry=${v.r.id}">${ico('cal')}${esc(v.Step)} ${esc(shortSlot(v.slot.ts))}</a>` : ''}${U.card(l)}
        <div class="acc-saved-bar"><label class="acc-pick"><input type="checkbox" data-pick="${id}" ${A.pick.has(id) ? 'checked' : ''}><span>Compare</span></label>
          <button type="button" data-act="note" data-id="${id}">${ico('pen')}${note ? 'Note' : 'Add note'}</button>
          <button type="button" data-act="move" data-id="${id}">${ico('list')}List</button></div>
        ${note ? `<p class="acc-note">${esc(note)}</p>` : ''}</div>`;
    };
    const listCards = `<div class="acc-lists"><button type="button" class="${A.list === 'all' ? 'is-active' : ''}" data-list="all"><b>All saved</b><small>${ids.length} ${ids.length === 1 ? 'listing' : 'listings'}</small></button>
      ${lists.map(x => { const n = x.ids.filter(i => favs.has(i)); return `<button type="button" class="${A.list === x.id ? 'is-active' : ''}" data-list="${x.id}"><b>${esc(x.name)}</b><small>${n.length} saved</small></button>`; }).join('')}
      <button type="button" class="is-new" data-act="newlist">${ico('plus')}New list</button></div>`;
    const body = {
      items: () => ids.length ? `${listCards}
          ${curList ? `<div class="acc-list-h"><h2>${esc(curList.name)}</h2><button type="button" class="btn btn-ghost btn-sm" data-act="renamelist">Rename</button><button type="button" class="btn btn-ghost btn-sm" data-act="dellist">Delete list</button></div>` : ''}
          ${shown.length ? `<div class="acc-grid is-saved">${shown.map(item).join('')}</div>` : empty('heart', 'This list is empty', 'Use “List” under any saved listing to add it here.')}
          <p class="acc-foot">${ico('grid4')}Tick up to 3 listings to compare them side by side.</p>`
        : empty('heart', 'Nothing saved yet', 'Tap the heart on any listing to keep it here — and see it here on any device.', `<a class="btn btn-primary btn-sm" href="${HREF.search}">${ico('search')}Browse listings</a>`),
      searches: () => searches.length ? `<div class="acc-searches">${searches.map(q => { const s = searchInfo(q), a = alertMeta(q); return `<div class="acc-box acc-search">
          <span class="acc-search-ic">${ico('search')}</span><div class="acc-search-t"><b>${esc(s.title)}</b><small>${esc(s.sub)} · ${s.count} listings</small>${s.fresh.length && a.freq !== 'paused' ? `<span class="status-pill is-success">${s.fresh.length} new</span>` : '<span class="status-pill is-muted">Up to date</span>'}</div>
          <label class="acc-sel"><span>Alerts</span><select data-afreq="${esc(q)}">${[['instant', 'Instantly'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['paused', 'Paused']].map(([v, t]) => `<option value="${v}" ${a.freq === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label class="acc-sel"><span>By</span><select data-ach="${esc(q)}">${[['wa', 'WhatsApp'], ['push', 'Push'], ['email', 'Email']].map(([v, t]) => `<option value="${v}" ${a.ch === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <div class="acc-search-go"><a class="btn btn-outline btn-sm" href="${esc(s.href)}">Open</a><button class="btn btn-ghost btn-sm" type="button" data-act="delsearch" data-q="${esc(q)}" aria-label="Delete search">${ico('x')}</button></div></div>`; }).join('')}</div>
          <p class="acc-foot">${ico('bell')}We check every few minutes and message you on your chosen channel. WhatsApp alerts are opt-in — pause them any time.</p>`
        : empty('bell', 'No saved searches', 'On any results page, tap “Save search” and we’ll message you when something new matches.', `<a class="btn btn-primary btn-sm" href="${HREF.search}">${ico('search')}Search and save</a>`),
      agents: () => agents.length ? `<div class="acc-agents">${agents.map(r => { const mine = L.filter(m => m.r.provider === r.provider), open = mine.filter(m => m.stage !== 'closed').length; return `<div class="acc-box">
          <a class="acc-cell acc-agent" href="${provHref(r.provider)}"><span class="acc-av">${esc(initials(r.provider))}</span><span><b>${esc(r.provider)}</b><small>${esc(r.org)}</small><small>${mine.length} ${mine.length === 1 ? 'enquiry' : 'enquiries'}${open ? ` · ${open} open` : ''} · replies in ~${r.reply || 10} min</small></span>${ico('chevR')}</a>
          <div class="acc-two"><a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(r.pphone, `Hi ${first(r.provider)}, I found you on ${SITE.name}.`)}">${ico('wa')}WhatsApp</a><a class="btn btn-outline btn-sm" href="${provHref(r.provider)}">${ico('grid4')}Listings</a></div></div>`; }).join('')}</div>
          <p class="acc-foot">${ico('users')}Agents and providers you’ve contacted. Their profile shows all their listings and reviews.</p>`
        : empty('users', 'No agents yet', 'Agents you request a viewing from, call or WhatsApp show up here.', `<a class="btn btn-primary btn-sm" href="${HREF.search}">${ico('search')}Browse listings</a>`)
    };
    return `${head('Saved', 'Your shortlist, saved searches and agents — synced to your account.', A.stab === 'items' && A.pick.size > 1 ? `<button class="btn btn-primary btn-sm" type="button" data-act="compare">${ico('grid4')}Compare ${A.pick.size}</button>` : '')}
      ${tabs([['items', 'Listings', ids.length], ['searches', 'Searches', searches.length], ['agents', 'Agents', agents.length]], A.stab, 'stab')}
      ${(body[A.stab] || body.items)()}`;
  }
  function compareModal() {
    const L = [...A.pick].map(byId).filter(Boolean).slice(0, 3);
    const rows = [['Price', l => { const pt = U.priceText(l); return `<b>${pt.n}</b><small>${pt.u}</small>`; }], ['Location', l => esc(U.locText(l))], ['Category', l => esc(offerOf(l.v, l.cat).label)],
      ['Key facts', l => esc(U.specOf(l).join(' · '))], ['Rating', l => `${ico('star')}${l.rating} <small>(${l.reviews})</small>`], ['Agent', l => `${esc(l.provider.name)}<small>replies in ~${l.provider.reply} min</small>`],
      ['Verified', l => l.a.verified ? `<span class="status-pill is-success">Verified</span>` : '<small>Not yet</small>'], ['Reference', l => esc(l.ref)]];
    openModal(`<div class="acc-modal acc-compare"><div class="acc-modal-h"><div><h3>Compare ${L.length}</h3><p>Side by side from your saved listings</p></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div>
      <div class="acc-cmp" style="--n:${L.length}"><div></div>${L.map(l => `<a href="${HREF.listing}?id=${l.id}" class="acc-cmp-h"><img src="${esc(l.img[0] || PATHS.img('hero.jpg'))}" alt=""><b>${esc(l.title)}</b></a>`).join('')}
        ${rows.map(([t, f]) => `<div class="acc-cmp-l">${t}</div>${L.map(l => `<div>${f(l)}</div>`).join('')}`).join('')}
        <div></div>${L.map(l => `<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waHref(l.provider.phone, `Hi ${first(l.provider.name)}, is ${l.title} (Ref ${l.ref}) still available?`)}">${ico('wa')}WhatsApp</a>`).join('')}</div></div>`, 'acc-modal-wrap is-wide');
  }

  /* ---------- alerts (C22) ---------- */
  function alertsView() {
    const F = feed(), list = A.ntab === 'all' ? F : F.filter(n => n.kind === A.ntab);
    const need = all().filter(m => m.needs).length;
    const TYPES = [['replies', 'Agent replies & viewings', 'Suggested times, confirmations, reminders 2 h before'], ['matches', 'New matches', 'For your saved searches'], ['tips', 'Tips & news', 'Occasional, never more than monthly']];
    const CH = [['wa', 'WhatsApp'], ['push', 'Push'], ['email', 'Email']];
    const pref = k => D.notify[k] || (D.notify[k] = { on: false, ch: [] });
    return `${head('Alerts', need ? `${need} ${need === 1 ? 'needs' : 'need'} your attention` : F.length ? `${unread()} unread` : '', F.length ? `<button class="btn btn-ghost btn-sm" type="button" data-act="readall">Mark all as read</button>` : '')}
      <div class="acc-alerts"><div>
        ${tabs([['all', 'All', F.length], ['enq', 'Enquiries', F.filter(n => n.kind === 'enq').length], ['match', 'Matches', F.filter(n => n.kind === 'match').length]], A.ntab, 'ntab')}
        ${list.length ? `<div class="acc-box acc-feed">${list.map(n => `<a href="${esc(n.go)}" class="acc-ntf ${D.read.includes(n.id) ? '' : 'is-unread'}" data-read="${esc(n.id)}"><i class="is-${n.tone}">${ico(n.icon)}</i><span><b>${esc(n.title)}</b><small>${esc(n.text)}</small></span><em>${ago(n.t)}</em></a>`).join('')}</div>`
          : empty('bell', 'No alerts yet', 'Agent replies, viewing reminders, and new matches will show up here.')}</div>
        <aside class="acc-box acc-prefs"><h3>Where should we reach you?</h3>
          <div class="acc-grid-pref"><span></span>${CH.map(([, t]) => `<small>${t}</small>`).join('')}
            ${TYPES.map(([k, t, s]) => `<span><b>${t}</b><small>${s}</small></span>${CH.map(([c]) => `<label class="acc-box-check"><input type="checkbox" data-pref="${k}" data-ch="${c}" ${pref(k).ch.includes(c) ? 'checked' : ''} aria-label="${t} by ${c}"><i>${ico('check')}</i></label>`).join('')}`).join('')}</div>
          <label class="toggle acc-quiet"><span><b>Quiet hours</b><small>No WhatsApp or push between 22:00 and 08:00</small></span><input type="checkbox" data-quiet ${D.quiet ? 'checked' : ''}><i></i></label></aside></div>`;
  }

  /* ---------- profile & privacy (C23) ---------- */
  function profile() {
    const u = user(), L = leads(), shared = [...new Map(L.map(r => [r.provider, r])).values()];
    const since = u.since ? new Date(u.since) : null;
    const rowB = (icon, title, sub, right) => `<div class="acc-row">${ico(icon)}<span><b>${title}</b><small>${sub}</small></span>${right}</div>`;
    return `${head('Profile &amp; privacy', '')}
      <div class="acc-box acc-me"><span class="acc-av is-xl">${esc(U.auth.initialsOf(u))}</span><div><h2>${esc(u.name || 'Add your name')}</h2><small>${since ? `Member since ${MON[since.getMonth()]} ${since.getFullYear()} · ` : ''}${L.length} enquiries · ${favs.size} saved</small></div><button class="btn btn-outline btn-sm" type="button" data-act="editname">${ico('pen')}Edit name</button></div>
      <div class="acc-cols">
        <div class="acc-box"><h3>Account</h3>
          ${rowB('phone', u.phone ? esc(U.fmtPhone(u.dial + u.phone)) : 'No mobile yet', u.phone ? 'Verified · used to sign in' : 'Add one so agents can reach you', u.phone ? '<span class="status-pill is-success">Verified</span>' : '')}
          ${rowB('mail', esc(u.email || 'No email'), 'Viewing confirmations and copies of your requests', `<button class="btn btn-ghost btn-sm" type="button" data-act="editemail">${u.email ? 'Change' : 'Add'}</button>`)}
          ${rowB('shield', 'UAE PASS', 'Share your verified ID with agents in one tap', '<span class="status-pill is-muted">Coming soon</span>')}</div>
        <div class="acc-box"><h3>What agents can see</h3>
          ${rowB('eye', 'Name &amp; mobile', 'Only after you send a request or tap Call / WhatsApp', '')}
          ${rowB('doc', 'Move-in, occupants, budget', 'Only the details you add to a request', '')}
          ${rowB('lock', 'Documents', 'Never shared automatically — you send them to the agent yourself', '')}
          <label class="toggle"><span><b>Prefill my details in requests</b><small>Saves typing — you can edit before sending</small></span><input type="checkbox" data-priv="share" ${D.privacy.share ? 'checked' : ''}><i></i></label>
          <details class="acc-shared"><summary>${ico('users')}Who has your details <em>${shared.length}</em></summary>${shared.length ? shared.map(r => `<div><b>${esc(r.provider)}</b><small>${esc(r.org)} · first contact ${ago(r.t)}</small></div>`).join('') : '<p>No agent has your details yet.</p>'}</details></div>
        <div class="acc-box"><h3>Preferences</h3>
          <div class="acc-row">${ico('globe')}<span><b>Language</b><small>Used across the site</small></span><label class="acc-sel"><select data-prefs="lang">${SITE.languages.map(([k, l]) => `<option value="${k}" ${U.prefs.lang === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
          <div class="acc-row">${ico('tag')}<span><b>Currency</b><small>Prices are shown in this currency</small></span><label class="acc-sel"><select data-prefs="cur">${Object.keys(U.CUR).map(k => `<option value="${k}" ${U.prefs.cur === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
          <a class="acc-row" href="#alerts">${ico('bell')}<span><b>Notifications</b><small>${D.quiet ? 'Quiet hours 22:00–08:00' : 'Any time'}</small></span>${ico('chevR')}</a>
          <label class="toggle"><span><b>Search history</b><small>Used for “Recently viewed” and recommendations</small></span><input type="checkbox" data-priv="history" ${D.privacy.history ? 'checked' : ''}><i></i></label></div>
        <div class="acc-box"><h3>More</h3>
          <button type="button" class="acc-row" data-act="export">${ico('upload')}<span><b>Download my data</b><small>Your account, saved listings, enquiries and settings as a file</small></span>${ico('chevR')}</button>
          <a class="acc-row" href="${HREF.join}">${ico('brief')}<span><b>List on ${esc(SITE.name)}</b><small>For owners, agents and businesses</small></span>${ico('chevR')}</a>
          <button type="button" class="acc-row" data-act="signout">${ico('chevL')}<span><b>Sign out</b><small>On this device</small></span></button>
          <button type="button" class="acc-row is-danger" data-act="delete">${ico('x')}<span><b>Delete my account</b><small>Removes your account and everything saved with it</small></span></button></div>
      </div>
      <p class="acc-foot">${ico('lock')}We handle your data under the UAE Personal Data Protection Law. You can download or delete it at any time.</p>`;
  }

  /* ---------- small dialogs ---------- */
  function ask({ title, text = '', label, value = '', placeholder = '', ok = 'Save', danger, fields }, done) {
    const F = fields || [{ name: 'v', label, value, placeholder }];
    openModal(`<form class="acc-modal" id="accAsk"><div class="acc-modal-h"><div><h3>${title}</h3>${text ? `<p>${text}</p>` : ''}</div><button class="close-btn" type="button" data-close aria-label="Close">${ico('x')}</button></div>
      ${F.map(f => `<div class="field"><label for="acc-${f.name}">${esc(f.label)}</label>${f.area ? `<textarea id="acc-${f.name}" name="${f.name}" rows="4" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>` : `<input id="acc-${f.name}" name="${f.name}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}" ${f.type ? `type="${f.type}"` : ''}>`}</div>`).join('')}
      <button class="btn ${danger ? 'acc-danger' : 'btn-primary'} acc-modal-go">${ok}</button></form>`, 'acc-modal-wrap');
    const f = document.getElementById('accAsk'), i = f.querySelector('input,textarea'); if (i) i.focus();
    f.onsubmit = e => { e.preventDefault(); const v = Object.fromEntries(new FormData(f).entries()); if (done(v) !== false) closeModal(); };
  }

  /* ---------- sample activity (empty accounts, for a preview) ----------
     one enquiry at each stage of the agent's pipeline: a confirmed viewing, a suggested time, awaiting a reply,
     a WhatsApp you started, a past viewing to rate, and one the agent closed */
  function sample() {
    const pickL = (v, c, n) => LISTINGS.filter(l => l.v === v && (!c || l.cat === c) && l.img.length).slice(n, n + 1)[0];
    const L = [pickL('spaces', 'residential', 0), pickL('spaces', 'residential', 3), pickL('spaces', 'residential', 6), pickL('spaces', 'residential', 9), pickL('spaces', 'residential', 12), pickL('spaces', 'residential', 15)];
    if (L.some(x => !x)) return toast('Not enough listings for a preview');
    const mk = (l, type, t, msg) => { const O = offerOf(l.v, l.cat); return { id: 'Q' + (t.toString(36) + Math.random().toString(36).slice(2, 5)).toUpperCase(), type, lid: l.id, t, title: l.title, img: l.img[0], cat: l.cat, catLabel: O.label, area: areaName(l.loc), building: l.building, price: l.price, unit: O.unit(l), spec: U.specOf(l), provider: l.provider.name, org: l.provider.org, pphone: l.provider.phone, reply: l.provider.reply, ref: l.ref, action: O.action, flow: O.flow, msg }; };
    const T = now(), at = (days, h, mi) => { const d = new Date(T + days * 864e5); d.setHours(h, mi, 0, 0); return +d; };
    const recs = [mk(L[0], 'email', T - 50 * 60000, 'Hi, could I see it Thursday evening? Two adults, moving in November.'), mk(L[1], 'email', T - 40 * 60000, 'Is parking included? I’d like to view this week.'), mk(L[2], 'email', T - 9 * 60000), mk(L[3], 'whatsapp', T - 3 * 3600000), mk(L[4], 'email', T - 4 * 864e5), mk(L[5], 'email', T - 6 * 864e5)];
    const set = (r, ev) => { D.lead[r.id] = { ev }; };
    const b0 = (recs[0].building || recs[0].area) + ' lobby', s0 = at(2, 18, 30), s1 = at(3, 11, 0);
    set(recs[0], [{ k: 'confirm', t: recs[0].t + 7 * 60000, slot: s0, place: b0, text: `Confirmed for ${DAY[new Date(s0).getDay()]} 18:30. I’ll meet you at the ${b0} — chiller is included and a parking bay is assigned.` }]);
    set(recs[1], [{ k: 'propose', t: recs[1].t + 26 * 60000, slot: s1, text: `Hi! Yes, one covered bay is included. Could you do ${DAY[new Date(s1).getDay()]} 11:00? The tenant is home in the mornings.` }]);
    set(recs[2], []);
    set(recs[3], []);
    set(recs[4], [{ k: 'confirm', t: recs[4].t + 12 * 60000, slot: at(-2, 18, 30), text: `Sure — ${DAY[new Date(at(-2, 18, 30)).getDay()]} 18:30 works. See you at reception.` }]);
    set(recs[5], [{ k: 'reply', t: recs[5].t + 15 * 60000, text: 'Thanks for your interest! Let me check with the landlord.' }, { k: 'closed', t: recs[5].t + 2 * 864e5, text: 'Sorry — this one is no longer available.' }]);
    const asked = ts => { const d = new Date(ts); return `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} · ${hm(d)}`; };
    recs[0].req = { title: recs[0].action || 'Request a viewing', when: asked(s0), mode: 'In person' };
    recs[2].req = { title: recs[2].action || 'Request a viewing', when: asked(at(2, 10, 0)), mode: 'Video call' };
    store.set('leads', [...recs, ...leads()]);
    const ids = [L[0], L[1], L[4], ...LISTINGS.filter(l => l.v === 'spaces' && l.cat === 'residential' && l.img.length).slice(1, 4)].map(l => l.id);
    ids.forEach(id => favs.add(id)); store.set('favs', [...favs]);
    if (!D.lists.length) D.lists.push({ id: 'l' + T, name: 'Marina shortlist', ids: ids.slice(0, 4) });
    const q = U.toQuery({ ...U.blankState('spaces', 'residential'), loc: ['dubai-marina'] });
    if (!alerts().includes(q)) setAlerts([...alerts(), q]);
    store.set('recent', [...ids.slice(2), ...(store.get('recent') || [])].slice(0, 12));
    save(); toast('Sample activity added'); render();
  }

  /* ---------- events ---------- */
  // on this page, Saved / My enquiries (header, account menu, phone tabs) open the sections instead of the side drawers
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open="saved"],[data-open="enq"]'); if (!o || !user()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    document.querySelectorAll('.account-menu').forEach(m => m.classList.remove('is-open'));
    go(o.dataset.open === 'saved' ? 'saved' : o.dataset.enq ? 'enquiry=' + o.dataset.enq : 'enquiries'); scrollTo({ top: 0, behavior: 'smooth' });
  }, true);

  root.addEventListener('click', e => {
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
      signin: () => U.auth.open({ onDone: render }),
      sample,
      accept: () => { const m = M(); S.slot = { ts: m.prop.slot, by: 'you', t: now() }; delete S.ask; logLine(id, `Accepted ${fmtSlot(m.prop.slot)}`); save(); render(); toast(`Accepted — ${m.who} has been told`); },
      asktime: () => {
        const m = M(), was = m.slot ? m.slot.ts : m.prop ? m.prop.slot : null;
        window.open(waHref(m.r.pphone, `Hi ${m.who}, about ${m.r.title} (Ref ${m.r.ref}) — ${was ? fmtSlot(was) + ' doesn’t work for me. ' : ''}Which other times work for you?`), '_blank', 'noopener');
        S.ask = now(); S.slot = null; logLine(id, was ? `Asked to move ${fmtSlot(was)}` : 'Asked for another time', 'WhatsApp'); save(); render();
      },
      agreed: () => agreedModal(id),
      cancel: () => { const m = M(); ask({ title: `Cancel the ${m.step}?`, text: `We’ll tell ${esc(m.who)} you can’t make it. Your enquiry stays open.`, fields: [], ok: `Cancel ${m.step}`, danger: true }, () => { S.slot = null; S.off = now(); S.heard = true; delete S.ask; logLine(id, `Cancelled the ${m.step}`); save(); render(); toast(`Cancelled — ${m.who} has been told`); }); },
      noshow: () => { const m = M(); S.slot = null; S.off = now(); S.ask = now() + 1; logLine(id, `${m.Step} didn’t happen — asked for another time`); save(); render(); window.open(waHref(m.r.pphone, `Hi ${m.who}, we missed each other for the ${m.step} of ${m.r.title} (Ref ${m.r.ref}). Could we find another time?`), '_blank', 'noopener'); },
      outcome: () => outcomeModal(id),
      withdraw: () => withdrawModal(id),
      heard: () => { S.heard = true; logLine(id, 'You confirmed you’re in touch'); save(); render(); toast('Great — add the viewing time once you agree one'); },
      noanswer: () => { S.heard = false; logLine(id, 'No answer'); save(); render(); },
      nudge: () => { const m = M(); S.nudged = now(); logLine(id, `Reminder sent to ${orgOf(m.r)}`); save(); render(); toast(`We’ve reminded ${m.who} — most agents reply within the hour`); },
      report: () => ask({ title: 'Report a problem', text: 'Our team reviews every report within one working day.', fields: [{ name: 'why', label: 'What happened?', area: true, placeholder: 'e.g. asked for a deposit before the viewing' }], ok: 'Send report' }, () => toast('Thanks — we’ll look into it')),
      note: () => ask({ title: 'Private note', text: 'Only you can see this.', fields: [{ name: 'v', label: 'Note', area: true, value: D.notes[id] || '', placeholder: 'e.g. ask about parking; ask about move-in date' }] }, v => { v.v.trim() ? D.notes[id] = v.v.trim() : delete D.notes[id]; save(); render(); }),
      move: () => {
        if (!D.lists.length) return ask({ title: 'New list', label: 'List name', placeholder: 'e.g. Marina shortlist', ok: 'Create & add' }, v => { if (!v.v.trim()) return false; D.lists.push({ id: 'l' + now(), name: v.v.trim(), ids: [id] }); save(); render(); toast('Added to ' + v.v.trim()); });
        openModal(`<div class="acc-modal"><div class="acc-modal-h"><div><h3>Add to a list</h3></div><button class="close-btn" data-close aria-label="Close">${ico('x')}</button></div><div class="acc-movelist">${D.lists.map(x => `<label><input type="checkbox" data-mv="${x.id}" ${x.ids.includes(id) ? 'checked' : ''}><span>${esc(x.name)}</span></label>`).join('')}</div><button class="btn btn-primary acc-modal-go" data-close>Done</button></div>`, 'acc-modal-wrap');
        document.querySelector('.scrim').onchange = ev => { const x = D.lists.find(y => y.id === ev.target.dataset.mv); if (!x) return; ev.target.checked ? x.ids.push(id) : x.ids = x.ids.filter(i => i !== id); save(); render(); };
      },
      newlist: () => ask({ title: 'New list', label: 'List name', placeholder: 'e.g. JLT 2-beds', ok: 'Create list' }, v => { if (!v.v.trim()) return false; const x = { id: 'l' + now(), name: v.v.trim(), ids: [] }; D.lists.push(x); A.list = x.id; save(); render(); }),
      renamelist: () => { const x = D.lists.find(y => y.id === A.list); ask({ title: 'Rename list', label: 'List name', value: x.name }, v => { if (!v.v.trim()) return false; x.name = v.v.trim(); save(); render(); }); },
      dellist: () => { D.lists = D.lists.filter(y => y.id !== A.list); A.list = 'all'; save(); render(); toast('List deleted — your saved listings are still here'); },
      compare: compareModal,
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
    if (t.dataset.check) { const c = D.check[t.dataset.check] = D.check[t.dataset.check] || [], i = +t.dataset.i; t.checked ? c.push(i) : c.splice(c.indexOf(i), 1); save(); }
  });

  // dialogs above wire their own handler on the shared scrim — drop it when the dialog closes
  document.addEventListener('upnow:modal-closed', () => { const sc = document.querySelector('.scrim'); if (sc) { sc.onclick = null; sc.onchange = null; } });
  addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
  document.addEventListener('upnow:auth', render);
  // removing a heart elsewhere on the page (data-fav) updates the shortlist
  document.addEventListener('click', e => { if (e.target.closest('[data-fav]')) setTimeout(render, 0); });
  render();
})();
