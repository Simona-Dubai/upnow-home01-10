/* Component library (components.html): renders every reusable piece from the real CSS + JS, with the code to use it. */
const { ico, esc, ui } = UPUI;
const { LISTINGS, VERTICALS, offerOf } = UP;
const H = DM.H;
const L = id => UPUI.byId(id);
const pick = cat => LISTINGS.find(l => l.cat === cat);

/* ---------- design tokens (values read live from :root, so a theme change shows here) ---------- */
const TOKENS = {
  'Brand greens': ['--g9', '--g8', '--g7', '--g6', '--g5', '--g2', '--g1'],
  'Text & surfaces': ['--ink', '--ink2', '--ink3', '--line', '--line2', '--bg', '--card'],
  'Status': ['--wa', '--amber', '--red', '--warning-bg', '--warning-ink', '--disabled-ink', '--rating-star', '--rating-star-strong']
};
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const FONT_SIZES = [['60px', 'Hero headline', 'serif'], ['36px', 'Profile name', 'serif'], ['28px', 'Price (detail)', 'sans'], ['24px', 'Section title', 'sans'], ['20px', 'Card group title', 'sans'], ['18px', 'Modal title', 'sans'],
  ['16px', 'Card price', 'sans'], ['15px', 'Emphasis', 'sans'], ['14px', 'Body (base)', 'sans'], ['13px', 'Secondary text', 'sans'], ['12.5px', 'Meta / captions', 'sans'], ['12px', 'Small print', 'sans'], ['11px', 'Labels (uppercase)', 'sans']];
const RADII = [['99px', 'Pills: buttons, chips, selects'], ['50%', 'Avatars, icon buttons'], ['22px', 'Footer CTA band'], ['20px', 'Agent card'], ['18px', 'Modals, panels, profile cards'], ['16px', 'Popovers, dropdowns'], ['var(--r) 14px', 'Cards, boxes'], ['12px', 'Tiles, inputs'], ['var(--r-sm) 10px', 'Fields, small boxes'], ['6px', 'Badges']];
const SHADOWS = [['var(--sh)', 'Raised: cards on hover, price box'], ['var(--sh-lg)', 'Floating: popovers, modals, dropdowns'], ['0 1px 2px rgba(15,40,28,.05), 0 10px 30px rgba(15,40,28,.07)', 'Agent card']];
const SPACING = [4, 6, 8, 10, 12, 14, 16, 18, 22, 28, 40, 56];
const BREAKPOINTS = [['1250px', 'listing grids 4 → 3 columns'], ['1200px', 'home card rows 6 → 3'], ['1180px', 'header: hide currency / language'], ['1100px', 'container padding 48 → 28px; profile sidebar drops below'], ['1000px', 'listing: single column, mobile action bar'],
  ['960px', 'header: hide main nav'], ['900px', 'footer + forms to 2 / 1 columns'], ['800px', 'search results 2 columns'], ['700px', 'home becomes the mobile app'], ['640px', 'container padding 16px'], ['520px', 'mobile app full-screen']];
const ZINDEX = [[1, 'agent card top, trust bar'], [2, 'card badges + save button'], [3, 'photo arrows, gallery toolbar'], [5, 'map pin (hover)'], [20, 'sticky results head, home hero'], [30, 'filter popovers'], [50, 'sticky search bar, mobile tab bar'],
  [60, 'site header'], [70, 'nav dropdown'], [80, 'search popovers'], [90, 'listing mobile bar'], [150, 'bottom sheet, filter drawer'], [190, 'side drawer'], [200, 'modal scrim'], [250, 'photo lightbox'], [300, 'toast']];

/* ---------- demo definitions: [group, id, title, css file, render() → HTML, code] ---------- */
const l0 = pick('residential'), lCourt = pick('court'), lClean = pick('cleaning');
const S0 = UPUI.blankState('spaces', 'residential');
const DEMOS = [
  ['Foundations', 'colours', 'Colours', 'css/variables.css', () => Object.entries(TOKENS).map(([g, names]) => `<h4 class="lib-sub">${g}</h4><div class="lib-swatches">${names.map(n => `<div><i style="background:var(${n})"></i><b>${n}</b><small>${cssVar(n)}</small></div>`).join('')}</div>`).join(''),
    ':root {\n  --g7: #136142;   /* primary brand green — change these to re-theme */\n  --ink: #14201a;  /* body text */\n}\n.my-thing { color: var(--g7); }'],
  ['Foundations', 'type', 'Typography', 'css/variables.css · css/base.css', () => `<div class="lib-type"><p><span>Font families</span><span class="lib-fams"><b style="font-family:var(--sans)">Plus Jakarta Sans — interface (var(--sans))</b><b style="font-family:var(--serif)">Roboto Serif — display headings (var(--serif))</b></span></p>${FONT_SIZES.map(([s, u, f]) => `<p><span>${s}</span><b style="font-size:${s};font-family:var(--${f})${s === '11px' ? ';text-transform:uppercase;letter-spacing:.06em' : ''}">${u}</b></p>`).join('')}<p><span>Weights</span><b><span style="font-weight:400">400</span> · <span style="font-weight:500">500</span> · <span style="font-weight:600">600</span> · <span style="font-weight:700">700</span> · <span style="font-weight:800">800</span></b></p><p><span>Line height</span><b style="font-weight:500">1.45 for body text; 1.7 for long reading text (about sections)</b></p></div>`,
    'h1.display { font-family: var(--serif); font-weight: 700; }\n/* fonts are self-hosted: css/fonts.css + assets/fonts/ */'],
  ['Foundations', 'radius', 'Radius, shadows & spacing', 'css/variables.css', () => `<h4 class="lib-sub">Border radius</h4><div class="lib-radii">${RADII.map(([r, u]) => `<div><i style="border-radius:${r.split(' ')[0]}"></i><b>${r}</b><small>${u}</small></div>`).join('')}</div>
      <h4 class="lib-sub">Shadows</h4><div class="lib-radii">${SHADOWS.map(([s, u]) => `<div><i style="box-shadow:${s};border-radius:14px;background:#fff"></i><b>${s.startsWith('var') ? s : 'agent card'}</b><small>${u}</small></div>`).join('')}</div>
      <h4 class="lib-sub">Spacing in use (px)</h4><div class="lib-space">${SPACING.map(n => `<div><i style="width:${n}px"></i><small>${n}</small></div>`).join('')}</div>
      <h4 class="lib-sub">Motion</h4><p class="lib-p">Hovers and state changes use <code>transition: .15s</code> (chips <code>.12s</code>, drawers <code>.2s</code>, hero image crossfade <code>.7s</code>).</p>`,
    'border-radius: var(--r);      /* 14px — cards */\nbox-shadow: var(--sh-lg);     /* floating layers */\ntransition: .15s;'],
  ['Foundations', 'layout', 'Container, breakpoints & layers', 'css/base.css · css/responsive.css', () => `<p class="lib-p"><code>.wrap</code> — centred container, max-width 1360px, side padding 48px → 28px (≤1100px) → 16px (≤640px).</p>
      <div class="lib-cols"><div><h4 class="lib-sub">Breakpoints (max-width)</h4><table class="detail-table lib-table">${BREAKPOINTS.map(([b, u]) => `<tr><td><b>${b}</b></td><td>${u}</td></tr>`).join('')}</table></div>
      <div><h4 class="lib-sub">z-index layers</h4><table class="detail-table lib-table">${ZINDEX.map(([z, u]) => `<tr><td><b>${z}</b></td><td>${u}</td></tr>`).join('')}</table></div></div>`,
    '<div class="wrap">…page content…</div>'],
  ['Foundations', 'icons', 'Icons', 'components/icons.js · assets/icons/*.svg', () => `<div class="lib-icons">${Object.keys(UPUI.ICONS).sort().map(n => `<div title="${n}">${ico(n)}<small>${n}</small></div>`).join('')}</div>`,
    "UPUI.ico('phone')            // inline <svg class=\"icon\">\nUPUI.ico('chevR', 'chevron')  // with an extra class\n<img src=\"assets/icons/phone.svg\" alt=\"\">  // static use"],
  ['Foundations', 'logo', 'Logo', 'css/components.css (.logo) · assets/logos', () => `<div class="lib-row"><a class="logo" href="#"><b>${esc(SITE.logoMark)}</b><span>${esc(SITE.name)}</span></a><img src="${PATHS.asset('logos/upnow-mark.svg')}" width="48" height="48" alt="${esc(SITE.name)} logo mark"></div>`,
    '<a class="logo" href="index.html"><b>U</b><span>UpNow</span></a>\n<!-- mark + name come from SITE.logoMark / SITE.name -->'],

  ['Actions', 'buttons', 'Buttons', 'css/components.css', () => `<div class="lib-row">${ui.button({ label: 'Primary', icon: 'check' })}${ui.button({ label: 'Outline', variant: 'outline' })}${ui.button({ label: 'WhatsApp', icon: 'wa', variant: 'whatsapp' })}${ui.button({ label: 'Ghost', variant: 'ghost' })}</div>
      <div class="lib-row">${ui.button({ label: 'Small primary', size: 'sm', icon: 'brief' })}${ui.button({ label: 'Small outline', size: 'sm', variant: 'outline', icon: 'user' })}<button class="icon-btn lib-iconbtn" title="Saved">${ico('heart')}</button><a class="text-link" href="#">Text link</a></div>`,
    "UPUI.ui.button({ label: 'Book a viewing', icon: 'cal' })\nUPUI.ui.button({ label: 'Details', variant: 'outline', size: 'sm', href: 'pages/listing.html?id=L1000' })\n<!-- or plain HTML -->\n<button class=\"btn btn-primary\">Book</button>  <a class=\"text-link\" href=\"#\">More</a>"],
  ['Actions', 'chips', 'Chips & badges', 'css/components.css', () => `<div class="lib-row">${ui.chip({ label: 'Residential', count: 12, active: true })}${ui.chip({ label: 'Commercial', count: 7 })}${ui.chip({ label: 'Sold out', count: 0, disabled: true })}${ui.chip({ label: 'Verified only', icon: 'shield' })}</div>
      <div class="lib-row lib-badges">${ui.badge({ label: 'Featured', tone: 'featured' })}${ui.badge({ label: 'Verified', tone: 'verified', icon: 'shield' })}</div>`,
    "UPUI.ui.chip({ label: 'Residential', count: 12, active: true })\nUPUI.ui.badge({ label: 'Verified', tone: 'verified', icon: 'shield' })"],

  ['Content', 'card', 'Card', 'css/components.css (.card)', () => `<div class="lib-cards">${ui.card({ href: '#', image: PATHS.img('office1.jpg'), title: 'Hot desk · Business Bay', location: 'Bay Square, Business Bay', spec: ['24/7 access', 'Meeting rooms'], price: 'AED 950', unit: '/month', badges: [{ label: 'Featured', tone: 'featured' }] })}${UPUI.card(l0)}${UPUI.card(lCourt)}${UPUI.card(lClean)}</div>`,
    "// any content\nUPUI.ui.card({ href, image, title, location, spec: ['24/7', 'Wi-Fi'], price: 'AED 950', unit: '/month', badges: [{ label: 'Featured', tone: 'featured' }] })\n// a marketplace listing (adds save button + photo count)\nUPUI.card(listing)"],
  ['Content', 'agent', 'Agent card', 'css/components.css (.agent-card) · components/marketplace/detail/core.js', () => `<div class="lib-cols"><div>${DM.agentCard(l0)}</div><div>${DM.agentCard(l0, { channels: true })}</div></div>`,
    "DM.agentCard(listing)                      // listing page: profile, stats, contact, agency footer\nDM.agentCard(listing, { channels: true })  // profile pages: contact channels only"],
  ['Content', 'details', 'Detail modules', 'css/components.css', () => `<h4 class="lib-sub">Spec grid</h4>${H.spec([['building', 'Building', 'Creek Rise'], ['layers', 'Floor', '17 of 42'], ['car', 'Parking', '1 covered'], ['snow', 'Cooling', 'Chiller-free']])}
      <h4 class="lib-sub">Checklist</h4>${H.chk([[1, 'Balcony'], [1, 'Shared pool'], [0, 'Private garden'], [1, 'Gym']])}
      <h4 class="lib-sub">Timeline</h4>${H.tl([['09:00', 'Pick-up', 'From your hotel'], ['11:30', 'Dune bashing', '45 minutes'], ['13:00', 'Lunch at camp']])}
      <h4 class="lib-sub">Table</h4>${H.table(['Plan', 'Visits', 'Price'], [['<b>Basic</b>', '2 / year', 'AED 450'], ['<b>Comprehensive</b>', '4 / year', 'AED 890'], { cls: 'total-row', c: ['Total', '', 'AED 1,340'] }], 2)}
      <div class="lib-cols"><div><h4 class="lib-sub">Key–value box</h4>${H.box('Check-in & out', 'clock', [['Check-in', 'From 15:00'], ['Check-out', 'By 11:00']])}</div><div><h4 class="lib-sub">Note & alert</h4>${H.note('Validate the permit on the Dubai REST app before paying a deposit.')}<div style="height:10px"></div>${H.alert('5 viewings booked this week')}</div></div>`,
    "DM.H.spec([[icon, label, value], …])   DM.H.chk([[yes, text], …])   DM.H.tl([[time, title, sub], …])\nDM.H.table(heads, rows, numericFromColumn)   DM.H.box(title, icon, [[k, v]])   DM.H.note(html)   DM.H.alert(text)"],
  ['Content', 'stats', 'Stats row', 'css/components.css (.kpis)', () => ui.stats([['28', 'Active listings'], ['~5 min', 'Typical reply'], ['96%', 'Response rate'], ['15 yrs', 'Experience']]),
    "UPUI.ui.stats([['28', 'Active listings'], ['~5 min', 'Typical reply']])"],
  ['Content', 'empty', 'Empty state', 'css/components.css', () => `<div class="lib-box">${ui.empty({ icon: 'heart', title: 'Nothing saved yet', text: 'Tap the heart on any listing to keep it here.' })}</div>`,
    "UPUI.ui.empty({ icon: 'heart', title: 'Nothing saved yet', text: 'Tap the heart on any listing to keep it here.' })"],

  ['Forms', 'fields', 'Fields', 'css/components.css (.field, .form-grid)', () => `<form class="form-grid lib-form" onsubmit="return false">${ui.field({ label: 'Full name', name: 'name', placeholder: 'Your name' })}${ui.field({ label: 'Mobile', name: 'phone', type: 'tel', value: '+971 ' })}${ui.field({ label: 'Category', name: 'cat', options: [['res', 'Residential'], ['com', 'Commercial']], full: true })}${ui.field({ label: 'Message', name: 'msg', textarea: true, full: true, placeholder: 'Hi, is it still available?' })}</form>`,
    "<form class=\"form-grid\">\n  ${UPUI.ui.field({ label: 'Full name', name: 'name' })}\n  ${UPUI.ui.field({ label: 'Message', name: 'msg', textarea: true, full: true })}\n</form>"],
  ['Forms', 'controls', 'Toggles, segmented & choice buttons', 'css/components.css', () => `<div class="lib-cols"><div>${ui.toggle({ label: 'Chiller-free', hint: 'A/C included in rent', name: 'chiller', checked: true })}<div style="height:14px"></div>${ui.segmented({ name: 'term', options: [['y', 'Yearly'], ['m', 'Monthly']], value: 'y' })}</div>
      <div><div class="choice-buttons"><button class="is-active">9 AM – 6 PM</button><button>9 AM – 10 PM</button><button>24/7</button></div><div style="height:14px"></div>${UPF.controlHTML(offerOf('spaces', 'residential').def('price'), S0, { counts: false })}</div></div>`,
    "UPUI.ui.toggle({ label: 'Chiller-free', name: 'chiller', checked: true })\nUPUI.ui.segmented({ name: 'term', options: [['y', 'Yearly'], ['m', 'Monthly']], value: 'y' })\n<div class=\"choice-buttons\"><button class=\"is-active\">A</button><button>B</button></div>"],
  ['Forms', 'searchbar', 'Search bar', 'css/components.css · components/marketplace/filters.js', () => '<div id="libSearch" class="lib-search"></div>',
    "UPF.SearchBar(element, UPUI.blankState('spaces', 'residential'), { mode: 'hero', onChange, onSubmit })", el => UPF.SearchBar(el.querySelector('#libSearch'), UPUI.blankState('spaces', 'residential'), { mode: 'hero', onChange: () => {}, onSubmit: () => UPUI.toast('Search submitted') })],
  ['Forms', 'booking', 'Booking widget atoms', 'css/components.css (.booking-*)', () => { const st = { t: 'y', d: 2, c: '10:00', g: 2 }; return `<div class="booking lib-narrow">${H.price(l0, 'AED 163,000', '/year')}${H.lab('Rent frequency')}${H.seg('t', st, [['y', 'Yearly'], ['m', 'Monthly']])}${H.lab('Viewing day')}${H.days('d', st)}${H.lab('Time')}${H.chips('c', st, ['09:00', '10:00', ['12:00', '12:00', 1], '16:00'])}${H.step('g', st, 'Guests', 'Ages 13+', 1, 6)}${H.sum([['Rent', 'AED 163,000'], ['Agency fee (5%)', 'AED 8,150']], 'AED 171,150')}${H.go('Request a viewing')}${H.fine('No fees on ' + SITE.name)}</div>`; },
    "DM.H.price(l, n, unit)  DM.H.lab(t)  DM.H.seg(key, state, [[v, label]])  DM.H.days(key, state)\nDM.H.chips(key, state, items)  DM.H.step(key, state, title, sub, min, max)  DM.H.sum(rows, total)  DM.H.go(label)  DM.H.fine(text)"],
  ['Forms', 'calendar', 'Calendar', 'css/components.css (.calendar-*)', () => `<div class="lib-narrow">${DM.month(2026, 9, { price: k => k % 7 === 3 ? null : 900 + (k % 5) * 60, sel: [4, 8], fn: 'pick', lo: k => k % 6 === 0 })}<div class="calendar-legend"><span><i></i>Selected</span><span><i class="is-deal"></i>Deal night</span><span><i class="is-booked"></i>Booked</span></div></div>`,
    "DM.month(year, monthIndex, { price: dayIndex => price | null, sel: [from, to], fn: 'pick', lo: dayIndex => isDeal })"],

  ['Navigation', 'header', 'Header', 'components/layout.js · data/site.js', () => `<div class="lib-frame">${UPUI.header('spaces')}</div>`,
    "document.getElementById('hdr').innerHTML = UPUI.header('spaces');  // active nav id\nUPUI.bindHeader();  // currency / language selects + counters\n// links, actions and labels come from SITE.header"],
  ['Navigation', 'footer', 'Footer', 'components/layout.js · data/site.js', () => `<div class="lib-frame">${UPUI.footer()}</div>`, "document.getElementById('ftr').innerHTML = UPUI.footer();  // content from SITE.footer"],
  ['Navigation', 'tabs', 'Tabs', 'css/components.css (.tabs)', () => `<div class="provider-card lib-tabs">${ui.tabs([['list', 'Properties', 28], ['rev', 'Reviews', 7574], ['areas', 'Areas served', 17]], 'list')}<p class="lib-p">Tab content…</p></div>`,
    "UPUI.ui.tabs([['list', 'Properties', 28], ['rev', 'Reviews']], 'list')  // buttons carry data-tab"],
  ['Navigation', 'pager', 'Pagination', 'css/components.css (.pager)', () => ui.pager(2, 5), "UPUI.ui.pager(currentPage, pageCount)  // buttons carry data-pg"],
  ['Navigation', 'dropdown', 'Dropdown & popover', 'css/components.css', () => `<div class="lib-row" style="align-items:flex-start;min-height:230px"><div class="nav-more is-open lib-static"><button class="is-active" type="button">More${ico('chev')}</button><div class="nav-dropdown">${SITE.header.nav.slice(3, 5).map(x => `<a href="#">${ico(x.icon)}<span><b>${esc(x.label)}</b><small>${esc(x.blurb)}</small></span></a>`).join('')}</div></div>
      <div class="search-field is-open lib-static" style="width:300px"><div class="popover" style="position:static;min-width:0"><div class="popover-header">Bedrooms<button class="text-link">Clear</button></div>${UPF.controlHTML(offerOf('spaces', 'residential').def('beds'), S0)}</div></div></div>`,
    "<div class=\"nav-more is-open\"><button>More</button><div class=\"nav-dropdown\">…links…</div></div>\n<div class=\"popover\"><div class=\"popover-header\">Title</div>…controls…</div>"],

  ['Overlays', 'modal', 'Modal, drawer & toast', 'components/overlays.js', () => `<div class="lib-row">${ui.button({ label: 'Open modal', icon: 'doc', attrs: { 'data-lib': 'modal' } })}${ui.button({ label: 'Open side drawer', variant: 'outline', attrs: { 'data-lib': 'drawer' } })}${ui.button({ label: 'Show toast', variant: 'outline', attrs: { 'data-lib': 'toast' } })}</div>`,
    "UPUI.openModal(html, extraClass)  UPUI.closeModal()\nUPUI.openSide(html)  UPUI.closeSide()\nUPUI.toast('Saved to your shortlist')\n// any [data-close] inside closes it; Esc closes modal + drawer"],
  ['Overlays', 'contact', 'Contact flows', 'components/marketplace/contact.js', () => `<div class="lib-row">${ui.button({ label: 'Call', icon: 'phone', attrs: { 'data-call': l0.id } })}${ui.button({ label: 'WhatsApp', icon: 'wa', variant: 'whatsapp', attrs: { 'data-wa': l0.id } })}${ui.button({ label: 'Email', icon: 'msg', variant: 'outline', attrs: { 'data-email': l0.id } })}${ui.button({ label: 'Saved', icon: 'heart', variant: 'outline', attrs: { 'data-open': 'saved' } })}${ui.button({ label: 'My enquiries', icon: 'msg', variant: 'outline', attrs: { 'data-open': 'enq' } })}${ui.button({ label: 'Sign in', icon: 'user', variant: 'outline', attrs: { 'data-open': 'signin' } })}</div>`,
    "<button data-call=\"L1000\">Call</button>  <button data-wa=\"L1000\">WhatsApp</button>  <button data-email=\"L1000\">Email</button>\n<button data-open=\"saved\">  <button data-open=\"enq\">  <button data-open=\"signin\">  <button data-fav=\"L1000\">"]
];

/* page-level patterns live in css/pages/* (class names there are page-scoped), so they are shown in their page */
const PAGES = [
  ['Home: hero, category rail, card rows, popular areas, how it works', 'index.html', 'css/pages/home.css', 1300],
  ['Mobile app: tab bar, search pill, bottom sheets, mobile cards', 'index.html', 'css/pages/home-mobile.css', 390],
  ['Search results: sticky filter bar, filter pills + drawer, list/grid/map, breadcrumbs, results empty state', 'pages/search.html?v=spaces&o=residential', 'css/pages/search.css', 1300],
  ['Listing: gallery + lightbox, key facts, price box, amenities, reviews, mobile action bar', 'pages/listing.html?id=L1000', 'css/pages/listing.css', 1300],
  ['Agent / agency profile: cover header, filter boxes, list view, agents grid, verification box', 'pages/provider.html?p=Ahmed%20Karim', 'css/pages/profile.css', 1300],
  ['Provider signup: stepper, role cards, document upload rows, live preview', 'pages/join.html', 'css/pages/join.css', 1300]
];

const lib = document.getElementById('lib'), nav = document.getElementById('libNav');
const groups = [...new Set(DEMOS.map(d => d[0]))];
nav.innerHTML = `<a class="logo" href="${PATHS.href.home}"><b>${esc(SITE.logoMark)}</b><span>${esc(SITE.name)}</span></a><small>Component library</small>
  ${groups.map(g => `<h5>${g}</h5>${DEMOS.filter(d => d[0] === g).map(d => `<a href="#${d[1]}">${esc(d[2])}</a>`).join('')}`).join('')}<h5>Pages</h5><a href="#page-patterns">Page-level patterns</a>`;
lib.innerHTML = `<header class="lib-head"><h1>${esc(SITE.name)} component library</h1><p>Every reusable piece of the site, rendered live from <code>css/main.css</code> and the scripts in <code>components/</code>. Open “Code” under a component to see how to use it. Page-specific patterns are at the bottom.</p></header>
  ${groups.map(g => `<h2 class="lib-group">${g}</h2>${DEMOS.filter(d => d[0] === g).map(([, id, title, file, render, code]) => `<section class="lib-sec" id="${id}"><div class="lib-sec-h"><h3>${esc(title)}</h3><code>${esc(file)}</code></div>
    <div class="lib-demo">${render()}</div><details class="lib-code"><summary>Code</summary><pre>${esc(code)}</pre></details></section>`).join('')}`).join('')}
  <h2 class="lib-group" id="page-patterns">Page-level patterns</h2><p class="lib-p">These use class names that differ between pages (for example <code>.section</code> or <code>.sidebar</code>), so their styles live in the page's own file under <code>css/pages/</code>. Each preview below is the real page.</p>
  ${PAGES.map(([t, url, css, w]) => `<section class="lib-sec"><div class="lib-sec-h"><h3>${esc(t)}</h3><code>${esc(css)}</code></div><div class="lib-page" style="--w:${w}px"><iframe loading="lazy" src="${PATHS.root}${url}" title="${esc(t)}"></iframe></div><a class="text-link" href="${PATHS.root}${url}">Open the page</a></section>`).join('')}`;
DEMOS.forEach(d => d[6] && d[6](document.getElementById(d[1])));

document.addEventListener('click', e => {
  const b = e.target.closest('[data-lib]'); if (!b) return;
  const k = b.dataset.lib;
  if (k === 'modal') UPUI.openModal(`<div class="modal-header"><h3>Modal title</h3><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div><div class="modal-body"><p style="margin:0 0 14px;color:var(--ink2)">Any HTML goes here. Close with the ×, a click outside or Esc.</p>${ui.button({ label: 'Done', attrs: { 'data-close': true } })}</div>`);
  if (k === 'drawer') UPUI.openSide(`<div class="side-drawer-header"><div><h3>Side drawer</h3><small>For lists like saved items or enquiries</small></div><button class="close-btn" aria-label="Close" data-close>${ico('x')}</button></div><div class="side-drawer-body">${ui.empty({ icon: 'msg', title: 'Nothing here yet', text: 'Drawer content scrolls; the header and footer stay put.' })}</div><div class="side-drawer-footer"><span>Footer note</span></div>`);
  if (k === 'toast') UPUI.toast('Saved to your shortlist');
});
