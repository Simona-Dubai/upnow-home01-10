/* Example catalogue page: chips filter the list, cards show the results, pager splits them, empty state when nothing matches. */
const { ui, money, header, footer, bindHeader, toast } = UPUI;
const ALL = CONTENT.spaces, PER = 3, $ = id => document.getElementById(id);
const types = [...new Set(ALL.map(s => s.type))];
let type = '', page = 1;

$('hdr').innerHTML = header('spaces');
$('ftr').innerHTML = footer();
bindHeader();

function paint() {
  const list = ALL.filter(s => !type || s.type === type), pages = Math.max(1, Math.ceil(list.length / PER));
  page = Math.min(page, pages);
  $('toolbar').innerHTML = [ui.chip({ label: 'All', count: ALL.length, active: !type, attrs: { 'data-type': '' } }),
    ...types.map(t => ui.chip({ label: t, count: ALL.filter(s => s.type === t).length, active: type === t, attrs: { 'data-type': t } })),
    ui.chip({ label: 'Phone booth', count: 0, disabled: true }), '<span class="spacer"></span>',
    ui.button({ label: 'Book a tour', icon: 'cal', size: 'sm', href: 'index.html#tour' })].join('');
  $('results').innerHTML = list.length
    ? `<div class="example-grid">${list.slice((page - 1) * PER, page * PER).map(s => ui.card({ href: '#' + s.id, attrs: { 'data-space': s.id }, image: s.image, title: s.title, location: s.location, spec: s.spec, price: money(s.price), unit: s.unit, badges: s.badge ? [{ label: s.badge, tone: 'featured' }] : [] })).join('')}</div>${pages > 1 ? ui.pager(page, pages) : ''}`
    : ui.empty({ icon: 'search', title: 'No workspaces match', text: 'Try another type.' });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-type]'); if (t) { type = t.dataset.type; page = 1; paint(); return; }
  const p = e.target.closest('[data-pg]'); if (p && !p.disabled) { page = +p.dataset.pg; paint(); return; }
  const c = e.target.closest('[data-space]'); if (c) { e.preventDefault(); toast(c.querySelector('.title').textContent + ' — tour slots open this week'); }
});
paint();
