/* Marketplace state for the signed-in account (or the guest, signed out): saved listings (favourites), sent enquiries (leads) and recently viewed,
   plus byId() to look a listing up. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { store } = U;
  const { LISTINGS } = UP;

  const byId = id => LISTINGS.find(l => l.id === id);

  /* ---------- favourites + leads ---------- */
  const favs = new Set(store.get('favs') || []);
  const leads = () => store.get('leads') || [];
  // signing in or out swaps whose shortlist this is
  document.addEventListener('upnow:auth', () => { favs.clear(); (store.get('favs') || []).forEach(id => favs.add(id)); });
  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id); store.set('favs', [...favs]);
    document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => { b.classList.toggle('is-active', favs.has(id)); b.setAttribute('aria-pressed', favs.has(id)); });
    U.toast(favs.has(id) ? 'Saved to your shortlist' : 'Removed from shortlist'); U.updateHdrCounts();
  }
  const recent = () => (store.get('recent') || []).map(id => LISTINGS.find(l => l.id === id)).filter(Boolean);
  const pushRecent = id => store.set('recent', [id, ...(store.get('recent') || []).filter(x => x !== id)].slice(0, 12));

  Object.assign(U, { byId, favs, leads, toggleFav, recent, pushRecent });
})();
