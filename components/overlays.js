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

  Object.assign(U, { openModal, closeModal, openSide, closeSide, toast });
})();
