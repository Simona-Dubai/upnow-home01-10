/* Modal, side drawer and toast. Created on first use; Esc closes the modal and drawer. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc } = U;

  /* ---------- modal / drawer / toast ---------- */
  let scrim, side;
  function ensure() {
    if (scrim) return;
    scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.innerHTML = '<div class="modal" role="dialog" aria-modal="true"></div>';
    scrim.addEventListener('click', e => { if (e.target === scrim) closeModal(); }); document.body.appendChild(scrim);
    side = document.createElement('div'); side.className = 'side-drawer'; side.innerHTML = '<aside class="side-drawer-panel" role="dialog" aria-modal="true"></aside>';
    side.addEventListener('click', e => { if (e.target === side) closeSide(); }); document.body.appendChild(side);
    const tt = document.createElement('div'); tt.className = 'toast'; tt.setAttribute('role', 'status'); tt.setAttribute('aria-live', 'polite'); tt.id = 'toast'; document.body.appendChild(tt);
  }
  const closeModal = () => { ensure(); const was = scrim.classList.contains('is-active'); scrim.classList.remove('is-active'); if (was) document.dispatchEvent(new Event('upnow:leads')); };
  function openModal(html, cls = '') { ensure(); const m = scrim.firstChild; m.className = 'modal ' + cls; m.innerHTML = html; scrim.classList.add('is-active'); m.scrollTop = 0; m.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal); }
  const closeSide = () => { ensure(); side.classList.remove('is-active'); };
  function openSide(html) { ensure(); side.firstChild.innerHTML = html; side.classList.add('is-active'); side.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSide); }
  function toast(msg) { ensure(); const tt = document.getElementById('toast'); tt.innerHTML = ico('check') + esc(msg); tt.classList.add('is-active'); clearTimeout(tt._t); tt._t = setTimeout(() => tt.classList.remove('is-active'), 2600); }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeSide(); document.dispatchEvent(new Event('upnow:escape')); } });

  /* ---------- themed select menus ----------
     Every <select> keeps its own look, value and change handlers; only the open menu is replaced by a themed list
     (the browser's native one can't be styled). Touch screens keep the native picker. Opt out with data-native. */
  let menu = null, menuSel = null, menuActive = -1, menuKb = false; // menuKb: opened from the keyboard
  const coarse = matchMedia('(pointer: coarse)');
  const usable = s => s && s.tagName === 'SELECT' && !s.disabled && !s.multiple && !s.hasAttribute('data-native') && !coarse.matches;
  const opts = () => [...menu.querySelectorAll('[role=option]')];
  function setActive(i) {
    const o = opts(); if (!o.length) return;
    i = Math.max(0, Math.min(o.length - 1, i));
    while (o[i] && o[i].getAttribute('aria-disabled') === 'true') i += i < menuActive ? -1 : 1;
    if (!o[i]) return;
    o.forEach((x, k) => x.classList.toggle('is-active', k === i)); menuActive = i;
    o[i].scrollIntoView({ block: 'nearest' });
  }
  function placeMenu() {
    const r = menuSel.getBoundingClientRect(), gap = 6, below = innerHeight - r.bottom - gap - 12, above = r.top - gap - 12;
    const up = below < 180 && above > below;
    menu.style.minWidth = Math.max(r.width, 160) + 'px';
    menu.style.maxHeight = Math.min(320, up ? above : below) + 'px';
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top = up ? '' : r.bottom + gap + 'px';
    menu.style.bottom = up ? innerHeight - r.top + gap + 'px' : '';
    menu.classList.toggle('is-up', up);
  }
  /* opened with the mouse, focus goes to the menu, not the select — a focused <select> gets Chrome's text highlight
     and the keyboard focus ring. Opened from the keyboard, focus stays on the select and returns there on close. */
  function openMenu(sel, kb) {
    closeMenu();
    menuSel = sel; menuKb = !!kb;
    menu = document.createElement('div'); menu.className = 'select-menu'; menu.setAttribute('role', 'listbox'); menu.tabIndex = -1;
    if (sel.getAttribute('aria-label')) menu.setAttribute('aria-label', sel.getAttribute('aria-label'));
    let k = 0;
    const item = o => `<div role="option" data-i="${k++}" data-v="${esc(o.value)}" aria-selected="${o.selected}" aria-disabled="${o.disabled}">${ico('check')}<span>${esc(o.textContent)}</span></div>`;
    menu.innerHTML = [...sel.children].map(c => c.tagName === 'OPTGROUP' ? `<div class="select-menu-group">${esc(c.label)}</div>${[...c.children].map(item).join('')}` : item(c)).join('');
    document.body.appendChild(menu);
    placeMenu();
    sel.classList.add('is-menu-open'); sel.setAttribute('aria-expanded', 'true');
    setActive(Math.max(0, sel.selectedIndex));
    if (!kb) menu.focus({ preventScroll: true });
  }
  function closeMenu(refocus) {
    if (!menu) return;
    menu.remove(); menu = null; menuActive = -1;
    menuSel.classList.remove('is-menu-open'); menuSel.setAttribute('aria-expanded', 'false');
    if (refocus && menuKb) menuSel.focus();
    else if (document.activeElement === document.body || document.activeElement === menuSel) menuSel.blur();
    menuSel = null;
  }
  function choose(i) {
    const o = opts()[i]; if (!o || o.getAttribute('aria-disabled') === 'true') return;
    const sel = menuSel, kb = menuKb, changed = sel.value !== o.dataset.v;
    sel.value = o.dataset.v; closeMenu(true);
    if (changed) { sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
    // a change handler may have redrawn the control: keep keyboard focus on its replacement (same id / name / data-*)
    if (kb && !sel.isConnected) {
      const key = [...sel.attributes].filter(x => x.name === 'id' || x.name === 'name' || x.name.startsWith('data-')).map(x => `[${x.name}="${CSS.escape(x.value)}"]`).join('');
      const twin = key && document.querySelector('select' + key); if (twin) twin.focus();
    }
  }
  document.addEventListener('mousedown', e => {
    if (menu && menu.contains(e.target)) { e.preventDefault(); return; }
    const sel = e.target.closest('select');
    if (usable(sel) && e.button === 0) { e.preventDefault(); if (menuSel === sel) closeMenu(); else openMenu(sel); return; }
    closeMenu();
  });
  document.addEventListener('click', e => { const o = menu && e.target.closest('.select-menu [role=option]'); if (o) choose(+o.dataset.i); });
  document.addEventListener('mousemove', e => { const o = menu && e.target.closest('.select-menu [role=option]'); if (o && +o.dataset.i !== menuActive && o.getAttribute('aria-disabled') !== 'true') { opts().forEach(x => x.classList.remove('is-active')); o.classList.add('is-active'); menuActive = +o.dataset.i; } });
  document.addEventListener('keydown', e => {
    const sel = e.target.closest && e.target.closest('select');
    if (!menu) {
      if (usable(sel) && (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key) || (e.altKey && e.key === 'ArrowDown'))) { e.preventDefault(); openMenu(sel, true); }
      return;
    }
    if (sel !== menuSel && !menu.contains(e.target)) return;
    const n = opts().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(menuActive + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(menuActive - 1); }
    else if (e.key === 'Home' || e.key === 'PageUp') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End' || e.key === 'PageDown') { e.preventDefault(); setActive(n - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(menuActive); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeMenu(true); }
    else if (e.key === 'Tab') closeMenu();
    else if (e.key.length === 1) { // type-ahead: jump to the next option starting with that letter (ignoring leading flags / symbols)
      const o = opts(), c = e.key.toLowerCase();
      for (let s = 1; s <= n; s++) { const i = (menuActive + s) % n; if (o[i].textContent.replace(/^[^\p{L}\p{N}]+/u, '').toLowerCase().startsWith(c)) { setActive(i); break; } }
    }
  }, true);
  addEventListener('resize', () => closeMenu());
  addEventListener('scroll', e => { if (menu && !menu.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('focusout', e => { if (menu && (e.target === menuSel || e.target === menu)) setTimeout(() => { if (menu && document.activeElement !== menuSel && document.activeElement !== menu) closeMenu(); }, 0); });

  Object.assign(U, { openModal, closeModal, openSide, closeSide, toast });
})();
