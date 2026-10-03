/* Generic UI builders — return HTML strings using the design-system classes, so any site gets the same look.
   Every builder takes plain content (no listing objects), e.g.
     UPUI.ui.button({ label: 'Book a tour', icon: 'cal', href: '#tour' })
     UPUI.ui.card({ href: '/space/1', image: 'assets/images/office1.jpg', title: 'Hot desk', location: 'Business Bay', spec: ['24/7', 'Wi-Fi'], price: 'AED 950', unit: '/month' })
   See components.html for every builder rendered live. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc } = U;
  const attrs = a => a ? ' ' + Object.entries(a).filter(([, v]) => v != null && v !== false).map(([k, v]) => v === true ? k : `${k}="${esc(v)}"`).join(' ') : '';
  const cls = (...c) => c.filter(Boolean).join(' ');

  const ui = {
    /* variant: primary | outline | whatsapp | ghost | (none);  size: 'sm' */
    button: ({ label, icon, href, variant = 'primary', size, attrs: a, type = 'button' }) => {
      const c = cls('btn', variant && 'btn-' + variant, size && 'btn-' + size), inner = (icon ? ico(icon) : '') + esc(label);
      return href ? `<a class="${c}" href="${esc(href)}"${attrs(a)}>${inner}</a>` : `<button class="${c}" type="${type}"${attrs(a)}>${inner}</button>`;
    },
    chip: ({ label, count, active, disabled, icon, attrs: a }) =>
      `<button class="${cls('chip', active && 'is-active', disabled && 'is-disabled')}" type="button"${attrs(a)}>${icon ? ico(icon) : ''}${esc(label)}${count != null ? ` <span class="count">${esc(count)}</span>` : ''}</button>`,
    /* tone: verified | featured */
    badge: ({ label, tone, icon }) => `<span class="${cls('badge', tone && 'is-' + tone)}">${icon ? ico(icon) : ''}${esc(label)}</span>`,

    /* the card used across the site: photo (+ badges, save button, photo count) · title · location · spec line · price.
       image: URL or ready HTML (starts with "<"); images: array of URLs → photo slider with back / next arrows;
       spec: array of short facts; fav: { id, active, label } */
    card: ({ href, attrs: a, image, images, alt = '', badges = [], fav, count, title, location, spec = [], price, unit = '' }) => {
      const pic = (src, lazy) => `<img src="${esc(src)}" alt="${esc(alt || title)}"${lazy ? ' loading="lazy"' : ''}>`;
      const slider = images && images.length > 1;
      const img = slider ? `<div class="slides">${images.map(src => pic(src, true)).join('')}</div>
        <button class="slide-btn is-prev" type="button" data-slide="-1" aria-label="Previous photo">${ico('chevL')}</button><button class="slide-btn is-next" type="button" data-slide="1" aria-label="Next photo">${ico('chevR')}</button>`
        : !image ? '' : image.startsWith('<') ? image : pic(image, true);
      const n = slider ? images.length : count;
      return `<a class="card" href="${esc(href)}"${attrs(a)}>
      <div class="photo"${slider ? ' data-slider data-i="0"' : ''}>${img}<div class="badges">${badges.map(ui.badge).join('')}</div>${fav ? `<button class="fav-btn ${fav.active ? 'is-active' : ''}" data-fav="${esc(fav.id)}" aria-label="${esc(fav.label || 'Save ' + title)}" aria-pressed="${!!fav.active}">${ico('heart')}</button>` : ''}${n > 1 ? `<span class="count">${ico('grid4')}<span>${slider ? '1/' + n : n}</span></span>` : ''}</div>
      <div class="content"><div class="title">${esc(title)}</div>
        <div class="location">${ico('pin')}<span>${esc(location)}</span></div>
        <div class="spec">${spec.map(s => `<span>${esc(s)}</span>`).join('')}</div>
        <div class="price">${price}<span>${unit}</span></div></div></a>`;
    },

    /* form field: label + input / select / textarea; full: spans both columns inside .form-grid */
    field: ({ label, name, type = 'text', value = '', placeholder = '', options, textarea, full, required }) => {
      const id = 'f-' + name, req = required ? ' required' : '';
      const control = options ? `<select id="${id}" name="${esc(name)}"${req}>${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(value) === String(v) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`
        : textarea ? `<textarea id="${id}" name="${esc(name)}" placeholder="${esc(placeholder)}"${req}>${esc(value)}</textarea>`
        : `<input id="${id}" name="${esc(name)}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"${req}>`;
      return `<div class="${cls('field', full && 'is-full')}"><label for="${id}">${esc(label)}</label>${control}</div>`;
    },
    toggle: ({ label, hint, name, checked }) => `<label class="toggle"><span><b>${esc(label)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}</span><input type="checkbox" name="${esc(name)}" ${checked ? 'checked' : ''}><i></i></label>`,
    segmented: ({ name, options, value }) => `<div class="segmented">${options.map(([v, l]) => `<button type="button" class="${String(value) === String(v) ? 'is-active' : ''}" data-seg-name="${esc(name)}" data-val="${esc(v)}">${esc(l)}</button>`).join('')}</div>`,

    /* tabs: [[id, label, count?]] — style lives on .tabs (inside a .provider-card or any padded box) */
    tabs: (items, active) => `<div class="tabs">${items.map(([id, l, n]) => `<button class="${id === active ? 'is-active' : ''}" data-tab="${esc(id)}">${esc(l)}${n != null ? `<em>${esc(n)}</em>` : ''}</button>`).join('')}</div>`,
    /* stats row: [[value, label]] */
    stats: items => `<div class="kpis">${items.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('')}</div>`,
    /* pager: current page, page count; buttons carry data-pg */
    pager: (page, pages) => `<div class="pager"><button data-pg="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">${ico('chevL')}</button>${Array.from({ length: pages }, (_, i) => `<button data-pg="${i + 1}" class="${i + 1 === page ? 'is-active' : ''}">${i + 1}</button>`).join('')}<button data-pg="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">${ico('chevR')}</button></div>`,
    /* empty state (inside drawers, lists, results) */
    empty: ({ icon = 'search', title, text, action }) => `<div class="side-drawer-empty">${ico(icon)}<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}${action || ''}</div>`
  };

  /* card photo slider: back / next arrows step through the photos without following the card link */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-slide]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const p = b.closest('[data-slider]'), n = p.querySelectorAll('.slides img').length;
    const i = (+p.dataset.i + +b.dataset.slide + n) % n;
    p.dataset.i = i;
    p.querySelector('.slides').style.transform = `translateX(${-100 * i}%)`;
    const c = p.querySelector('.count span'); if (c) c.textContent = `${i + 1}/${n}`;
  });

  Object.assign(U, { ui });
})();
