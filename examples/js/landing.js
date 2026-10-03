/* Example landing page: every block is a shared component filled with CONTENT from examples/content.js. */
const { ui, ico, esc, money, header, footer, bindHeader, openModal, toast } = UPUI;
const C = CONTENT, $ = id => document.getElementById(id);

$('hdr').innerHTML = header('');
$('ftr').innerHTML = footer();
bindHeader();

$('kicker').textContent = C.hero.kicker;
$('title').innerHTML = C.hero.title;
$('text').textContent = C.hero.text;
$('heroActions').innerHTML = ui.button({ label: 'Book a tour', icon: 'cal', href: '#tour', variant: '', attrs: { style: 'background:#fff;color:var(--g9)' } })
  + ui.button({ label: 'See workspaces', href: 'spaces.html', variant: '', attrs: { style: 'border:1.5px solid rgba(255,255,255,.4);color:#fff' } });

$('features').innerHTML = C.features.map(([i, t, s]) => `<div>${ico(i)}<b>${esc(t)}</b><span>${esc(s)}</span></div>`).join('');

$('spaces').innerHTML = C.spaces.slice(0, 3).map(s => ui.card({
  href: 'spaces.html#' + s.id, image: s.image, title: s.title, location: s.location, spec: s.spec,
  price: money(s.price), unit: s.unit, badges: s.badge ? [{ label: s.badge, tone: 'featured' }] : []
})).join('');

let plan = 'monthly';
function paintPlans() {
  $('planTabs').innerHTML = ui.tabs([['monthly', 'Monthly plans'], ['daily', 'Pay as you go']], plan);
  $('plans').innerHTML = C.plans[plan].map(([n, p, d]) => `<div><b>${esc(n)}</b><strong>${esc(p)}</strong><span>${esc(d)}</span></div>`).join('');
}
paintPlans();
$('planTabs').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { plan = t.dataset.tab; paintPlans(); } });

$('faqList').innerHTML = C.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');

$('tourForm').innerHTML = ui.field({ label: 'Full name', name: 'name', required: true })
  + ui.field({ label: 'Mobile', name: 'phone', type: 'tel', value: '+971 ', required: true })
  + ui.field({ label: 'Workspace', name: 'space', options: C.spaces.map(s => [s.id, s.title]), full: true })
  + ui.field({ label: 'Anything we should know?', name: 'msg', textarea: true, full: true })
  + `<div class="is-full">${ui.button({ label: 'Request a tour', icon: 'cal', type: 'submit' })}</div>`;
$('tourForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = new FormData(e.target).get('name');
  openModal(`<div class="modal-header"><h3>Tour requested</h3><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div>
    <div class="modal-body"><p style="margin:0 0 14px;color:var(--ink2)">Thanks ${esc(name)} — the community team will call you to fix a time.</p>${ui.button({ label: 'Done', attrs: { 'data-close': true } })}</div>`);
  toast('Tour request sent');
});
