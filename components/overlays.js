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

  /* ---------- themed dropdown menus ----------
     The browser's own lists can't be styled, so the open list is replaced by a themed one for
     · <select> — keeps its own look, value and change handlers; only the open menu changes;
     · <input list="…"> (suggestions from a <datalist>) — filters as you type; ↑ ↓ then Enter picks a suggestion.
     Touch screens keep the native pickers. Opt out with data-native. */
  let menu = null, menuEl = null, menuActive = -1, menuKb = false; // menuEl: the select / input; menuKb: opened from the keyboard
  const coarse = matchMedia('(pointer: coarse)');
  const fine = el => !el.disabled && !el.hasAttribute('data-native') && !coarse.matches;
  const usable = s => s && s.tagName === 'SELECT' && !s.multiple && fine(s);
  // a suggestions input: its native list is switched off (list → data-list) the first time it is used
  const comboOf = t => {
    const el = t && t.closest && t.closest('input[list], input[data-list]');
    if (!el || !fine(el)) return null;
    if (el.hasAttribute('list')) { el.dataset.list = el.getAttribute('list'); el.removeAttribute('list'); }
    return el;
  };
  const isCombo = el => el && el.tagName === 'INPUT';
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
    const r = menuEl.getBoundingClientRect(), gap = 6, below = innerHeight - r.bottom - gap - 12, above = r.top - gap - 12;
    const up = below < 180 && above > below;
    menu.style.minWidth = Math.max(r.width, 160) + 'px';
    menu.style.maxHeight = Math.min(320, up ? above : below) + 'px';
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top = up ? '' : r.bottom + gap + 'px';
    menu.style.bottom = up ? innerHeight - r.top + gap + 'px' : '';
    menu.classList.toggle('is-up', up);
  }
  /* A <select> opened with the mouse hands focus to the menu — a focused <select> gets Chrome's text highlight and the
     keyboard focus ring. Opened from the keyboard, focus stays on it and returns there on close. A suggestions input
     always keeps focus so you can keep typing; filter: narrow the list to what has been typed. */
  function openMenu(el, kb, filter) {
    let k = 0, html;
    const item = (v, label, on, off) => `<div role="option" data-i="${k++}" data-v="${esc(v)}" aria-selected="${on}" aria-disabled="${off}">${ico('check')}<span>${esc(label)}</span></div>`;
    if (isCombo(el)) {
      const list = document.getElementById(el.dataset.list), q = filter ? el.value.trim().toLowerCase() : '';
      const all = list ? [...list.querySelectorAll('option')].map(o => [o.value, o.label || o.textContent || o.value]) : [];
      const hits = all.filter(([v, l]) => !q || (v + ' ' + l).toLowerCase().includes(q));
      if (!hits.length) { closeMenu(); return; }
      html = hits.map(([v, l]) => item(v, l, v === el.value, false)).join('');
    } else {
      const it = o => item(o.value, o.textContent, o.selected, o.disabled);
      html = [...el.children].map(c => c.tagName === 'OPTGROUP' ? `<div class="select-menu-group">${esc(c.label)}</div>${[...c.children].map(it).join('')}` : it(c)).join('');
    }
    if (menu && menuEl === el) { menu.innerHTML = html; menuActive = -1; placeMenu(); return; } // re-filter in place, no re-animation
    closeMenu();
    menuEl = el; menuKb = !!kb;
    menu = document.createElement('div'); menu.className = 'select-menu'; menu.setAttribute('role', 'listbox'); menu.tabIndex = -1;
    if (el.getAttribute('aria-label')) menu.setAttribute('aria-label', el.getAttribute('aria-label'));
    menu.innerHTML = html;
    document.body.appendChild(menu);
    placeMenu();
    el.classList.add('is-menu-open'); el.setAttribute('aria-expanded', 'true');
    if (isCombo(el)) return;
    setActive(Math.max(0, el.selectedIndex));
    if (!kb) menu.focus({ preventScroll: true });
  }
  function closeMenu(refocus) {
    if (!menu) return;
    menu.remove(); menu = null; menuActive = -1;
    menuEl.classList.remove('is-menu-open'); menuEl.setAttribute('aria-expanded', 'false');
    if (!isCombo(menuEl)) {
      if (refocus && menuKb) menuEl.focus();
      else if (document.activeElement === document.body || document.activeElement === menuEl) menuEl.blur();
    }
    menuEl = null;
  }
  function choose(i) {
    const o = opts()[i]; if (!o || o.getAttribute('aria-disabled') === 'true') return;
    const el = menuEl, kb = menuKb, changed = el.value !== o.dataset.v;
    el.value = o.dataset.v; closeMenu(true);
    if (changed || isCombo(el)) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    // a change handler may have redrawn the control: keep keyboard focus on its replacement (same id / name / data-*)
    if (kb && !isCombo(el) && !el.isConnected) {
      const key = [...el.attributes].filter(x => x.name === 'id' || x.name === 'name' || x.name.startsWith('data-')).map(x => `[${x.name}="${CSS.escape(x.value)}"]`).join('');
      const twin = key && document.querySelector('select' + key); if (twin) twin.focus();
    }
  }
  document.addEventListener('mousedown', e => {
    if (menu && menu.contains(e.target)) { e.preventDefault(); return; }
    const sel = e.target.closest('select');
    if (usable(sel) && e.button === 0) { e.preventDefault(); if (menuEl === sel) closeMenu(); else openMenu(sel); return; }
    const c = comboOf(e.target);
    if (c && e.button === 0) { if (menuEl !== c && document.activeElement === c) openMenu(c); return; } // already focused: focusin won't fire
    closeMenu();
  }, true);
  document.addEventListener('focusin', e => { const c = comboOf(e.target); if (c && menuEl !== c) openMenu(c); });
  document.addEventListener('input', e => { const c = menuEl === e.target || comboOf(e.target); if (c && e.isTrusted) openMenu(e.target, false, true); });
  document.addEventListener('click', e => { const o = menu && e.target.closest('.select-menu [role=option]'); if (o) choose(+o.dataset.i); });
  document.addEventListener('mousemove', e => { const o = menu && e.target.closest('.select-menu [role=option]'); if (o && +o.dataset.i !== menuActive && o.getAttribute('aria-disabled') !== 'true') { opts().forEach(x => x.classList.remove('is-active')); o.classList.add('is-active'); menuActive = +o.dataset.i; } });
  document.addEventListener('keydown', e => {
    const sel = e.target.closest && e.target.closest('select'), combo = comboOf(e.target);
    if (!menu) {
      if (usable(sel) && (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key) || (e.altKey && e.key === 'ArrowDown'))) { e.preventDefault(); openMenu(sel, true); }
      else if (combo && e.key === 'ArrowDown') { e.preventDefault(); openMenu(combo, true); if (menu) setActive(0); }
      return;
    }
    if (e.target !== menuEl && !menu.contains(e.target)) return;
    const n = opts().length, typing = isCombo(menuEl);
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(menuActive + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(menuActive - 1); }
    else if (!typing && (e.key === 'Home' || e.key === 'PageUp')) { e.preventDefault(); setActive(0); }
    else if (!typing && (e.key === 'End' || e.key === 'PageDown')) { e.preventDefault(); setActive(n - 1); }
    else if (e.key === 'Enter' || (!typing && e.key === ' ')) { if (menuActive >= 0) { e.preventDefault(); choose(menuActive); } else closeMenu(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeMenu(true); }
    else if (e.key === 'Tab') closeMenu();
    else if (!typing && e.key.length === 1) { // type-ahead: jump to the next option starting with that letter (ignoring leading flags / symbols)
      const o = opts(), c = e.key.toLowerCase();
      for (let s = 1; s <= n; s++) { const i = (menuActive + s) % n; if (o[i].textContent.replace(/^[^\p{L}\p{N}]+/u, '').toLowerCase().startsWith(c)) { setActive(i); break; } }
    }
  }, true);
  addEventListener('resize', () => closeMenu());
  addEventListener('scroll', e => { if (menu && !menu.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('focusout', e => { if (menu && (e.target === menuEl || e.target === menu)) setTimeout(() => { if (menu && document.activeElement !== menuEl && document.activeElement !== menu) closeMenu(); }, 0); });

  Object.assign(U, { openModal, closeModal, openSide, closeSide, toast });
})();
