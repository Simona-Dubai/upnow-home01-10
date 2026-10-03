/* Detail-module core: toolkit for category-specific sections + booking widgets, the agent card,
   SMS / chat sheets and the "request to book" confirmation. Category modules register with DM.reg(). */
(function () {
  const { ico, esc, money, initials, openModal, closeModal, toast, ROOT } = UPUI;
  const { LISTINGS, offerOf, areaName } = UP;
  const D0 = new Date(2026, 9, 1); // marketplace "today" — Thu 1 Oct 2026
  const DW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MNL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fd = d => DW[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()];
  const dayN = n => addD(D0, n);
  const M = n => money(Math.round(n));

  /* ---------- html toolkit ---------- */
  const H = {
    spec: items => `<div class="spec-grid">${items.filter(Boolean).map(([i, k, v]) => `<div><i>${ico(i)}</i><span><small>${esc(k)}</small><b>${esc(v)}</b></span></div>`).join('')}</div>`,
    chk: items => `<ul class="checklist">${items.map(([y, t]) => `<li class="${y ? 'is-yes' : 'is-no'}">${ico(y ? 'check' : 'x')}${esc(t)}</li>`).join('')}</ul>`,
    tl: items => `<ol class="timeline">${items.map(([t, b, s]) => `<li><time>${esc(t)}</time><div><b>${esc(b)}</b>${s ? `<span>${esc(s)}</span>` : ''}</div></li>`).join('')}</ol>`,
    table: (heads, rows, numFrom = 99) => `<div class="table-wrap"><table class="detail-table"><thead><tr>${heads.map((h, i) => `<th style="${i >= numFrom ? 'text-align:right' : ''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr class="${r.cls || ''}">${(r.c || r).map((c, i) => `<td class="${i >= numFrom ? 'numeric' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
    box: (title, icon, rows) => `<div class="detail-box"><h4>${ico(icon)}${esc(title)}</h4>${rows.filter(Boolean).map(([k, v]) => `<div class="kv-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`,
    note: (t, i = 'shield') => `<div class="detail-note">${ico(i)}<span>${t}</span></div>`,
    yes: '<span class="cell-yes">' + ico('check') + '</span>', no: '<span class="cell-no">—</span>',
    opts: (key, st, items) => `<div class="option-list">${items.map(o => `<button class="option ${st[key] === o.id ? 'is-active' : ''}" data-bk="set" data-k="${key}" data-v="${o.id}"><span class="radio"></span><div><b>${esc(o.t)}${o.tag ? `<span class="tag">${esc(o.tag)}</span>` : ''}</b><small>${esc(o.s || '')}</small></div><em>${o.p || ''}</em></button>`).join('')}</div>`,
    /* booking widget atoms */
    lab: t => `<label class="booking-label">${esc(t)}</label>`,
    seg: (key, st, items) => `<div class="booking-seg">${items.map(([v, t]) => `<button class="${st[key] === v ? 'is-active' : ''}" data-bk="set" data-k="${key}" data-v="${v}">${esc(t)}</button>`).join('')}</div>`,
    days: (key, st, n = 6, from = 1) => `<div class="booking-days">${Array.from({ length: n }, (_, i) => { const d = dayN(from + i); return `<button class="${st[key] === from + i ? 'is-active' : ''}" data-bk="set" data-k="${key}" data-v="${from + i}"><small>${from + i === 1 ? 'Tmrw' : DW[d.getDay()]}</small>${d.getDate()}<small>${MN[d.getMonth()]}</small></button>`; }).join('')}</div>`,
    chips: (key, st, items, multi) => `<div class="booking-chips">${items.map(x => { const [v, t, dis] = Array.isArray(x) ? x : [x, x]; const on = multi ? (st[key] || []).includes(v) : st[key] === v; return `<button class="${on ? 'is-active' : ''}" ${dis ? 'disabled' : ''} data-bk="${multi ? 'tg' : 'set'}" data-k="${key}" data-v="${esc(v)}">${esc(t)}</button>`; }).join('')}</div>`,
    step: (key, st, t, s, min, max) => `<div class="booking-stepper"><div><b>${esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ''}</div><div><button data-bk="dec" data-k="${key}" data-min="${min}" ${st[key] <= min ? 'disabled' : ''}>−</button><em>${st[key]}</em><button data-bk="inc" data-k="${key}" data-max="${max}" ${st[key] >= max ? 'disabled' : ''}>+</button></div></div>`,
    sum: (rows, total, tl = 'Estimated total') => `<div class="booking-summary">${rows.filter(Boolean).map(([k, v]) => `<div><span>${esc(k)}</span><span>${v}</span></div>`).join('')}<div class="is-total"><span>${esc(tl)}</span><span>${total}</span></div></div>`,
    price: (l, n, u) => `<div class="booking-price"><div class="price">${n}<span> ${esc(u)}</span></div><div class="rating">${ico('star')}${l.rating} <span style="color:var(--ink3);font-weight:500">· ${l.reviews} reviews</span></div></div>`,
    go: (t, i = 'cal') => `<button class="btn btn-primary booking-submit" data-bk="go">${ico(i)}${esc(t)}</button>`,
    fine: t => `<p class="booking-note">${ico('shield')}${esc(t)}</p>`,
    alert: t => `<div class="booking-alert">${ico('bolt')}${esc(t)}</div>`
  };

  /* month calendar — opts: {sel:[a,b], price(d)->n|null(blocked), lo(d)} ; day index relative to D0 */
  function month(y, m, o) {
    const first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate(), pad = (first.getDay() + 6) % 7;
    const idx = d => Math.round((d - D0) / 864e5);
    let cells = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(x => `<span class="weekday">${x}</span>`).join('') + '<span></span>'.repeat(pad);
    for (let i = 1; i <= n; i++) {
      const d = new Date(y, m, i), k = idx(d), p = k < 1 ? null : o.price(k);
      const [a, b] = o.sel || [];
      const cls = (k === a || k === b) ? 'is-selected' : (a != null && b != null && k > a && k < b) ? 'is-in-range' : '';
      cells += `<button ${p == null ? 'disabled' : ''} class="${cls} ${p && o.lo && o.lo(k) ? 'is-low-price' : ''}" data-bk="fn" data-f="${o.fn}" data-v="${k}">${i}${p ? `<small>${UP.K(p)}</small>` : ''}</button>`;
    }
    return `<div class="calendar-month"><h5>${o.nav ? `<button data-bk="fn" data-f="${o.nav}" data-v="-1">${ico('chevL')}</button>` : ''}<span>${MNL[m]} ${y}</span>${o.nav ? `<button data-bk="fn" data-f="${o.nav}" data-v="1">${ico('chevR')}</button>` : ''}</h5><div class="calendar-grid">${cells}</div></div>`;
  }

  /* ---------- registry + live rendering ---------- */
  const MODS = {}; let CUR = null;
  const reg = (ids, fn) => [].concat(ids).forEach(id => MODS[id] = fn);
  function build(l, opts = {}) {
    let s = 0; for (const c of l.id) s += c.charCodeAt(0) * 7;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const O = offerOf(l.v, l.cat);
    const ctx = { l, O, A: l.a, st: {}, r, H, M, fd, dayN, D0, month, fn: {}, live: {}, mobile: !!opts.mobile, fname: l.provider.name.split(' ')[0] };
    const mod = (MODS[l.cat] || MODS._generic)(ctx);
    CUR = { ctx, mod };
    return { secs: mod.secs || [], bk: () => `<div id="bkw">${mod.bk()}</div>` };
  }
  function rerender() {
    if (!CUR) return; const { ctx, mod } = CUR;
    const w = document.getElementById('bkw'); if (w) w.innerHTML = mod.bk();
    Object.entries(ctx.live).forEach(([id, f]) => document.querySelectorAll('[data-live="' + id + '"]').forEach(el => el.innerHTML = f()));
    document.dispatchEvent(new Event('dm:change'));
  }
  const live = (ctx, id, f) => { ctx.live[id] = f; return `<div data-live="${id}">${f()}</div>`; };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bk]'); if (!b || !CUR) return;
    e.preventDefault(); e.stopPropagation();
    const { ctx, mod } = CUR, st = ctx.st, k = b.dataset.k, raw = b.dataset.v, v = raw != null && raw !== '' && !isNaN(raw) ? +raw : raw;
    const a = b.dataset.bk;
    if (a === 'set') st[k] = v;
    else if (a === 'tg') { const c = st[k] || []; st[k] = c.includes(v) ? c.filter(x => x !== v) : [...c, v]; }
    else if (a === 'flag') st[k] = !st[k];
    else if (a === 'inc') st[k] = Math.min(+b.dataset.max, st[k] + 1);
    else if (a === 'dec') st[k] = Math.max(+b.dataset.min, st[k] - 1);
    else if (a === 'fn') ctx.fn[b.dataset.f](v);
    else if (a === 'go') { const g = mod.go(); confirmReq(ctx.l, g); return; }
    if (mod.after) mod.after(a, k);
    rerender();
  });

  /* ---------- request-to-book confirmation ---------- */
  function confirmReq(l, g) {
    const fn = l.provider.name.split(' ')[0];
    openModal(`<div class="contact-header"><div class="avatar">${ico('cal')}</div><div class="contact-title"><b>${esc(g.title)}</b><span>Sent to ${esc(l.provider.name)} · replies in ~${l.provider.reply} min</span></div><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
      <div class="contact-body" style="padding-top:4px"><div class="table-wrap"><table class="detail-table"><tbody>${g.rows.filter(Boolean).map(([k, v]) => `<tr><td style="color:var(--ink3)">${esc(k)}</td><td class="numeric">${esc(v)}</td></tr>`).join('')}${g.total ? `<tr class="total-row"><td>${esc(g.tl || 'Estimated total')}</td><td class="numeric">${g.total}</td></tr>` : ''}</tbody></table></div>
      <p class="contact-tip">Nothing is charged on UpNow. ${esc(fn)} confirms availability and you pay ${l.v === 'spaces' && offerOf(l.v, l.cat).lease ? 'the landlord / agent' : 'the provider'} directly.</p>
      <div class="contact-divider"><span>send this request by</span></div><div class="contact-alt"><button class="btn btn-whatsapp" data-wa="${l.id}">${ico('wa')}WhatsApp</button><button class="btn btn-outline" data-email="${l.id}">${ico('msg')}Email</button><button class="btn btn-outline" data-call="${l.id}">${ico('phone')}Call</button></div></div>`, 'contact-modal');
  }

  /* ---------- provider aggregates ---------- */
  const NATIVE = { English: 'English', Arabic: 'العربية', Hindi: 'हिन्दी', Urdu: 'اردو', Russian: 'Русский', French: 'Français' };
  function prov(name) {
    const L = LISTINGS.filter(x => x.provider.name === name);
    const p = L[0].provider, orgs = {}; L.forEach(x => orgs[x.provider.org] = (orgs[x.provider.org] || 0) + 1);
    const org = Object.entries(orgs).sort((a, b) => b[1] - a[1])[0][0];
    const O = offerOf(L[0].v, L[0].cat), person = !!O.people || /^(Dr\.|[A-Z][a-z]+ [A-Z][a-z]+( Al)?)/.test(name) && !O.names;
    const reviews = L.reduce((s, x) => s + x.reviews, 0), rating = +(L.reduce((s, x) => s + x.rating * x.reviews, 0) / reviews).toFixed(1);
    let hue = 0; for (const c of name) hue = (hue * 31 + c.charCodeAt(0)) % 360;
    return { name, L, p, org, person, reviews, rating, hue, reply: Math.min(...L.map(x => x.provider.reply)), langs: p.langs, brn: (L.find(x => x.provider.brn) || {}).provider?.brn, since: Math.min(...L.map(x => x.provider.since)), v: L[0].v, cats: [...new Set(L.map(x => x.cat))] };
  }
  const provHref = name => ROOT + 'Provider.html?p=' + encodeURIComponent(name);
  const agencyHref = org => ROOT + 'Agency.html?a=' + encodeURIComponent(org);
  const isAgency = org => !!org && !/^Private (owner|landlord|host)$/.test(org);
  const orgSub = (P) => { if (P.org === 'Private owner' || P.org === 'Private landlord' || P.org === 'Private host') return 'Title deed verified'; if (P.v === 'spaces' && P.person) return /stays|silkhaus|frank porter/i.test(P.org) ? 'Holiday home operator · DTCM' : 'Real estate broker L.L.C'; return offerOf(P.L[0].v, P.L[0].cat).org[0]; };
  const allLabel = P => P.v === 'spaces' ? (P.cats.every(c => ['venue', 'court', 'yacht'].includes(c)) ? 'View all ' + ({ venue: 'spaces', court: 'courts', yacht: 'yachts' }[P.cats[0]]) : 'View all properties') : 'View all services';

  function agentCard(l, o = {}) {
    const P = prov(l.provider.name);
    const reply = P.reply <= 5 ? 'within 5 minutes' : P.reply <= 15 ? 'within ' + P.reply + ' minutes' : 'within 30 minutes';
    const title = P.person ? (isAgency(P.org) ? `<a class="agency-link" href="${agencyHref(P.org)}">${esc(P.org)}</a>` : esc(P.org)) + (P.brn ? ' • BRN ' + P.brn : '') : esc(offerOf(l.v, l.cat).org[0] + (l.permit ? ' • ' + l.permit : ''));
    const langs = P.langs.map(x => NATIVE[x] || x);
    const av = P.person ? `<div class="agent-avatar" style="--hue:${P.hue}">${esc(initials(P.name))}<span class="agent-online"></span></div>` : `<div class="agent-avatar" style="--hue:${P.hue};border-radius:24px">${esc(initials(P.name))}<span class="agent-online"></span></div>`;
    // o.channels: contact channels only (the profile page header already shows who the agent is)
    return `<div class="agent-card ${o.channels ? 'is-channels' : ''}" data-screen-label="Agent card">
      ${o.channels ? '' : `<div class="agent-cover"><svg viewBox="0 0 400 46" preserveAspectRatio="none"><path d="M0 46 L0 30 C90 2 170 4 250 22 C320 38 370 30 400 16 L400 46Z" fill="#fff"/></svg></div>
      <div class="agent-top">
        ${av}
        <div class="agent-info">
          <div class="agent-name"><a href="${provHref(P.name)}">${esc(P.name)}</a>${l.a.verified ? `<span class="agent-verified" title="Verified by UpNow">${ico('badge')}</span>` : ''}</div>
          <div class="agent-org">${title}</div></div>
        </div>
        <div class="agent-stats">
          <div class="stat-detail-wrap">
            <div class="stat-head">
              <svg class="icon is-star" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>
              <span class="stat-value">${P.rating.toFixed(1)}</span>
            </div>
          <div class="stat-sub">${P.reviews.toLocaleString()} Ratings</div>
        </div>
        <div class="stat-detail-wrap">
          <div class="stat-head">${ico('clock')}Usually responds</div>
          <div class="stat-sub"><b>${reply}</b></div>
        </div>
        <div class="stat-detail-wrap">
          <div class="stat-head">${ico('globe')}<span>${esc(langs.slice(0, 2).join(' • '))}</span></div>
          ${langs.length > 2 ? `<div class="stat-langs">${esc(langs.slice(2).join(' • '))}</div>` : `<div class="stat-langs">${P.L.length} active listing${P.L.length > 1 ? 's' : ''}</div>`}
        </div>
      </div>`}
      <div class="agent-body">${o.channels ? `<h4>Contact ${esc(P.person ? P.name.split(' ')[0] : P.name)}</h4>` : ''}
        <div class="agent-actions"><button class="agent-action" data-call="${l.id}">${ico('phone')}<span><b>Call</b><small>Direct call</small></span>${ico('chevR', 'chevron')}</button>
          <button class="agent-action" data-wa="${l.id}">${ico('wa')}<span><b>WhatsApp</b><small>Chat instantly</small></span>${ico('chevR', 'chevron')}</button></div>
        <div class="agent-more">More ways to contact</div>
        <div class="agent-alt-actions"><button class="agent-alt-action is-sms" data-sms="${l.id}">${ico('msg')}<span><b>SMS</b></span>${ico('chevR', 'chevron')}</button>
          <button class="agent-alt-action is-email" data-email="${l.id}"><svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><span><b>Email</b></span>${ico('chevR', 'chevron')}</button>
          <button class="agent-alt-action is-chat" data-chat="${l.id}"><svg class="icon" viewBox="0 0 24 24"><path d="M12 4c4.97 0 9 3.36 9 7.5S16.97 19 12 19c-1.1 0-2.15-.16-3.12-.46L4 20l1.4-3.6C4.5 15.1 3 13.4 3 11.5 3 7.36 7.03 4 12 4z"/></svg><span><b>Chat</b></span>${ico('chevR', 'chevron')}</button></div>
      </div>
      ${o.channels ? '' : `<div class="agent-footer"><span class="agent-logo">${ico(P.v === 'spaces' ? 'office' : 'shop')}</span><span class="agent-agency"><b>${esc(P.person ? P.org : P.name)}</b><small>${esc(orgSub(P))}</small></span><a class="agent-view-all" href="${P.person && isAgency(P.org) ? agencyHref(P.org) : provHref(P.name)}">${allLabel(P)}${ico('chevR')}</a></div>`}
    </div>`;
  }

  /* SMS + in-app chat */
  function sms(id) {
    const l = UPUI.byId(id), fn = l.provider.name.split(' ')[0];
    const txt = `Hi ${fn}, I saw ${l.title} (Ref ${l.ref}) on UpNow. Is it available?`;
    openModal(`<div class="contact-header"><div class="avatar">${esc(initials(l.provider.name))}</div><div class="contact-title"><b>Text ${esc(fn)}</b><span>${UPUI.fmtPhone(l.provider.phone)}</span></div><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
      <div class="contact-body"><label class="contact-label">Message</label><textarea class="contact-message" id="smsTxt" style="background:#f7f4fe;border-color:#e6e0f6;color:#2e1f55">${esc(txt)}</textarea>
      <a class="btn contact-submit" style="background:#7c4dd6;color:#fff" id="smsGo" href="sms:${l.provider.phone}?&body=${encodeURIComponent(txt)}">${ico('msg')}Open Messages</a></div>`, 'contact-modal');
    const t = document.getElementById('smsTxt'), g = document.getElementById('smsGo');
    t.oninput = () => g.href = `sms:${l.provider.phone}?&body=${encodeURIComponent(t.value)}`;
    g.onclick = () => { toast('Opening Messages…'); setTimeout(closeModal, 300); };
  }
  function chat(id) {
    const l = UPUI.byId(id), fn = l.provider.name.split(' ')[0], O = offerOf(l.v, l.cat);
    const Q = O.lease ? ['Is it still available?', 'Can I view this week?', 'Is the price negotiable?', 'How many cheques?'] : ['Is it available this weekend?', 'What’s the final price?', 'Can I bring a group?', 'What’s included?'];
    openModal(`<div class="contact-header"><div class="avatar">${esc(initials(l.provider.name))}<em>${ico('shield')}</em></div><div class="contact-title"><b>${esc(l.provider.name)}</b><span class="presence"><i></i>Online · replies in ~${l.provider.reply} min</span></div><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
      <div class="chat-body"><div class="chat-thread" id="chTh"><div class="msg-theirs">Hi! I’m ${esc(fn)}. Ask me anything about <b>${esc(l.title)}</b>.</div></div>
      <div class="chat-quick-replies">${Q.map(q => `<button data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form class="chat-input" id="chF"><input id="chI" placeholder="Write a message…" autocomplete="off"><button class="btn btn-primary">${ico('arrow')}</button></form>
      <p class="contact-tip">Chats are saved in <b>My enquiries</b>. Don’t share card details.</p></div>`, 'contact-modal');
    const th = document.getElementById('chTh');
    const send = m => { if (!m.trim()) return; th.insertAdjacentHTML('beforeend', `<div class="msg-mine">${esc(m)}</div><div class="msg-typing" id="chTy">${esc(fn)} is typing…</div>`); th.scrollTop = 1e5;
      UPUI.toast('Message sent'); setTimeout(() => { const ty = document.getElementById('chTy'); if (ty) ty.outerHTML = `<div class="msg-theirs">Thanks! Yes, it’s available. Shall I share a few times${O.lease ? ' for a viewing' : ''}?</div>`; th.scrollTop = 1e5; }, 1400); };
    document.querySelectorAll('.chat-quick-replies button').forEach(b => b.onclick = () => send(b.dataset.q));
    document.getElementById('chF').onsubmit = e => { e.preventDefault(); const i = document.getElementById('chI'); send(i.value); i.value = ''; };
  }
  document.addEventListener('click', e => {
    const s = e.target.closest('[data-sms]'); if (s) { e.preventDefault(); e.stopPropagation(); sms(s.dataset.sms); return; }
    const c = e.target.closest('[data-chat]'); if (c) { e.preventDefault(); e.stopPropagation(); chat(c.dataset.chat); }
  }, true);

  /* generic fallback */
  reg('_generic', c => ({ secs: [], bk: () => H.price(c.l, money(c.l.price), c.O.unit(c.l)) + H.go(c.O.action, 'msg'), go: () => ({ title: c.O.action, rows: [['Listing', c.l.title]] }) }));

  window.DM = { _ctx: () => CUR && CUR.ctx, reg, build, rerender, live, H, month, agentCard, prov, provHref, agencyHref, isAgency, NATIVE, fd, dayN, D0, addD, DW, MN, MNL, M };
})();
