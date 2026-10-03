/* Contact flows (call, WhatsApp, email request), the Saved and My enquiries drawers, sign-in, and the click delegation for data-call / data-wa / data-email / data-fav / data-open. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc, initials, store, byId, fmtPhone, favs, leads, toggleFav, updateHdrCounts, priceText, specOf, locText, card, openModal, closeModal, openSide, closeSide, toast } = U;
  const { areaName, offerOf } = UP;
  const HREF = PATHS.href;

  /* ---------- lead capture ---------- */
  function waText(l) { return `Hi ${l.provider.name.split(' ')[0]}, I found your listing on ${SITE.name} and I'm interested.\n\n${l.title}\n${locText(l)}\nRef ${l.ref}\n\nIs it still available?`; }
  const waLink = l => 'https://wa.me/' + l.provider.phone.replace('+', '') + '?text=' + encodeURIComponent(waText(l));
  function me() { return store.get('me') || { name: '', phone: '+971 ', email: '' }; }
  function logLead(type, l, extra = {}) {
    const O = offerOf(l.v, l.cat), pt = priceText(l);
    const rec = { id: 'Q' + Date.now().toString(36).toUpperCase(), type, lid: l.id, t: Date.now(), title: l.title, img: l.img[0] || PATHS.img('hero.jpg'), cat: l.cat, catLabel: O.label, area: areaName(l.loc), building: l.building,
      price: l.price, unit: O.unit(l), spec: specOf(l), provider: l.provider.name, org: l.provider.org, pphone: l.provider.phone, reply: l.provider.reply, ref: l.ref, action: O.action, flow: O.flow, ...extra };
    store.set('leads', [rec, ...leads()]); updateHdrCounts(); return rec;
  }
  /* contact modals — clean, customer-focused */
  function cHead(l, sub) {
    const pt = priceText(l);
    return `<div class="contact-header"><div class="avatar">${esc(initials(l.provider.name))}${l.a.verified ? `<em>${ico('shield')}</em>` : ''}</div>
      <div class="contact-title"><b>${esc(l.provider.name)}</b><span>${esc(l.provider.org)}</span><span class="presence"><i></i>${esc(sub || 'Usually replies in ~' + l.provider.reply + ' min')}</span></div><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
      <div class="contact-listing"><img src="${l.img[0] || PATHS.img('hero.jpg')}" alt=""><div><b>${esc(l.title)}</b><span>${esc(locText(l))} · ${pt.n}${pt.u}</span></div><em>Ref ${l.ref}</em></div>`;
  }
  const cSwitch = (l, skip) => `<div class="contact-alt">${[['call', 'phone', 'Call'], ['wa', 'wa', 'WhatsApp'], ['email', 'msg', 'Email']].filter(x => x[0] !== skip).map(([k, i, lb]) => `<button class="btn btn-outline" data-${k}="${l.id}">${ico(i)}${lb}</button>`).join('')}</div>`;
  function call(id) {
    const l = byId(id); logLead('call', l, { name: me().name || 'Customer', phone: me().phone, msg: 'Called from listing' });
    openModal(`${cHead(l, 'Available 9 AM – 9 PM')}
      <div class="contact-body"><a href="tel:${l.provider.phone}" class="contact-number">${ico('phone')}<span>${fmtPhone(l.provider.phone)}</span></a>
        <div class="contact-row"><button class="btn btn-outline" onclick="navigator.clipboard&&navigator.clipboard.writeText('${l.provider.phone}');UPUI.toast('Number copied')">${ico('doc')}Copy number</button><a class="btn btn-primary" href="tel:${l.provider.phone}">${ico('phone')}Call now</a></div>
        <p class="contact-tip">Say you found it on <b>${SITE.name}</b> and quote <b>${l.ref}</b>.</p>
        <div class="contact-divider"><span>or contact by</span></div>${cSwitch(l, 'call')}</div>`, 'contact-modal');
  }
  function whatsapp(id) {
    const l = byId(id);
    openModal(`${cHead(l)}
      <div class="contact-body"><label class="contact-label">Your message</label><textarea class="contact-message" id="waTxt">${esc(waText(l))}</textarea>
        <a class="btn btn-whatsapp contact-submit" href="${waLink(l)}" target="_blank" id="waGo">${ico('wa')}Continue in WhatsApp</a>
        <div class="contact-divider"><span>or contact by</span></div>${cSwitch(l, 'wa')}</div>`, 'contact-modal');
    const tx = document.getElementById('waTxt'), go = document.getElementById('waGo');
    tx.oninput = () => { go.href = 'https://wa.me/' + l.provider.phone.replace('+', '') + '?text=' + encodeURIComponent(tx.value); };
    go.onclick = () => { logLead('whatsapp', l, { name: me().name || 'Customer', phone: me().phone, msg: tx.value.split('\n')[0] }); setTimeout(closeModal, 250); toast('Opening WhatsApp…'); };
  }
  function request(id) {
    const l = byId(id), m = me(), fn = l.provider.name.split(' ')[0];
    openModal(`${cHead(l)}
      <form class="contact-body" id="leadForm"><div class="form-grid">
          <div class="field"><label>Full name</label><input required name="name" value="${esc(m.name)}" placeholder="Your name"></div>
          <div class="field"><label>Mobile</label><input required name="phone" value="${esc(m.phone)}" inputmode="tel"></div>
          <div class="field is-full"><label>Email</label><input name="email" type="email" required value="${esc(m.email)}" placeholder="you@email.com"></div>
          <div class="field is-full"><label>Message</label><textarea name="msg" rows="4">${esc(`Hi ${fn}, I'm interested in ${l.title} (Ref ${l.ref}). Is it still available?`)}</textarea></div></div>
        <button class="btn btn-primary contact-submit">${ico('msg')}Send email to ${esc(fn)}</button>
        <p class="contact-tip">Shared only with ${esc(fn)}. ${SITE.name} never asks for payment.</p></form>`, 'contact-modal');
    document.getElementById('leadForm').onsubmit = e => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target).entries());
      store.set('me', { name: fd.name, phone: fd.phone, email: fd.email });
      const rec = logLead('email', l, { name: fd.name, phone: fd.phone, email: fd.email, msg: fd.msg, pref: 'Email' });
      openModal(`<div class="contact-success"><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button><div class="success-icon">${ico('check')}</div><h3>Email sent to ${esc(fn)}</h3><p>${esc(fn)} usually replies within ~${l.provider.reply} min. We’ll let you know on WhatsApp too.</p>
        <div class="cm-steps"><div class="is-active"><i>${ico('check')}</i><span>Sent</span></div><div><i>2</i><span>${esc(fn)} replies</span></div><div><i>3</i><span>${LEASE_CAT(l) ? 'Viewing' : 'Confirm'}</span></div></div>
        <div class="contact-row"><button class="btn btn-outline" data-open="enq">${ico('msg')}My enquiries</button><button class="btn btn-whatsapp" data-wa="${l.id}">${ico('wa')}Also WhatsApp</button></div><small>Reference ${rec.id}</small></div>`, 'contact-modal');
    };
  }
  const LEASE_CAT = l => !!offerOf(l.v, l.cat).lease;
  /* customer-side status (preview of the customer dashboard) */
  function status(r) {
    const m = (Date.now() - r.t) / 60000;
    if (r.type === 'call') return ['Number viewed', 'is-muted'];
    if (m < 1) return ['Sent', 'is-info'];
    if (m < 4) return ['Seen by provider', 'is-warning'];
    return [r.type === 'whatsapp' ? 'Chat opened' : 'Provider replied', 'is-success'];
  }
  const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  function enquiries() {
    const L = leads();
    openSide(`<div class="side-drawer-header"><div><h3>My enquiries</h3><small>${L.length} sent · replies come by WhatsApp, call or email</small></div><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
      <div class="side-drawer-body">${L.length ? L.map(r => { const [s, k] = status(r); return `<a class="enquiry-row" href="${HREF.listing}?id=${r.lid}"><img src="${PATHS.img(r.img)}" alt=""><div class="content"><div class="row-head"><b>${esc(r.title)}</b><span class="status-pill ${k}">${s}</span></div>
        <small>${esc(r.catLabel)} · ${esc(r.area)} · ${esc(r.provider)}</small>
        <small>${{ request: 'Enquiry', email: 'Email enquiry', call: 'Phone call', whatsapp: 'WhatsApp' }[r.type]} · ${ago(r.t)} · ${esc(r.id)}</small></div></a>`; }).join('')
        : `<div class="side-drawer-empty">${ico('msg')}<b>No enquiries yet</b><span>When you request a viewing, call or WhatsApp a provider, it's tracked here.</span></div>`}</div>
      <div class="side-drawer-footer"><span>Replies arrive by WhatsApp, call or email. ${SITE.name} never takes payments.</span></div>`);
  }
  function saved() {
    const L = [...favs].map(byId).filter(Boolean);
    openSide(`<div class="side-drawer-header"><div><h3>Saved</h3><small>${L.length} ${L.length === 1 ? 'listing' : 'listings'} on your shortlist</small></div><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
      <div class="side-drawer-body">${L.length ? `<div class="side-drawer-grid">${L.map(l => card(l)).join('')}</div>` : `<div class="side-drawer-empty">${ico('heart')}<b>Nothing saved yet</b><span>Tap the heart on any listing to keep it here.</span></div>`}</div>`);
  }
  function signin() {
    openModal(`<div class="modal-header"><h3>Sign in to ${SITE.name}</h3><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
      <div class="modal-body"><p style="margin:0 0 14px;color:var(--ink2)">Keep your saved spaces and enquiries on every device.</p>
      <div class="field"><label>Mobile number</label><input value="+971 " inputmode="tel"></div>
      <button class="btn btn-primary" style="width:100%;height:46px" onclick="UPUI.closeModal();UPUI.toast('We sent a code by WhatsApp')">${ico('wa')}Continue with WhatsApp code</button>
      <div class="or-divider"><span>or</span></div><button class="btn btn-outline" style="width:100%" onclick="UPUI.closeModal();UPUI.toast('Signed in')">Continue with UAE PASS</button>
      <p class="fine-print">Listing a space? <a class="text-link" href="${HREF.join}">Become a provider</a></p></div>`);
  }

  document.addEventListener('click', e => {
    const f = e.target.closest('[data-fav]'); if (f) { e.preventDefault(); e.stopPropagation(); toggleFav(f.dataset.fav); return; }
    const c = e.target.closest('[data-call]'); if (c) { e.preventDefault(); e.stopPropagation(); call(c.dataset.call); return; }
    const w = e.target.closest('[data-wa]'); if (w) { e.preventDefault(); e.stopPropagation(); whatsapp(w.dataset.wa); return; }
    const b = e.target.closest('[data-req],[data-email]'); if (b) { e.preventDefault(); e.stopPropagation(); request(b.dataset.req || b.dataset.email); return; }
    const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); closeModal(); ({ enq: enquiries, saved, signin })[o.dataset.open](); return; }
  });

  Object.assign(U, { call, whatsapp, request });
})();
