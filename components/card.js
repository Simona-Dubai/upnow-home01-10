/* Listing card (photo · title · location · spec · price) and its parts. */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc, t, initials, money, priceOf, favs } = U;
  const { areaName, offerOf } = UP;
  const HREF = PATHS.href;

  /* ---------- cards: exactly 4 lines — title · location · spec · price ---------- */
  const badges = l => `<div class="badges">${l.featured ? `<span class="badge is-featured">${t('Featured')}</span>` : ''}${l.a.verified ? `<span class="badge is-verified">${ico('shield')}${t('Verified')}</span>` : ''}</div>`;
  function photo(l, i = 0) {
    if (l.img && l.img.length) return `<img src="${l.img[i % l.img.length]}" alt="${esc(l.title)}" loading="lazy">`;
    return `<div class="tile" style="--h:165"><b>${esc(initials(l.provider.name))}</b><span>${esc(l.provider.name)}</span><small>${esc(offerOf(l.v, l.cat).label)} insurance</small></div>`;
  }
  function priceText(l, S) { const O = offerOf(l.v, l.cat); const SS = S && S.o === l.cat ? S : null; return { n: money(priceOf(l, SS)), u: O.unit(l, SS) }; }
  const specOf = l => { const O = offerOf(l.v, l.cat); return O.spec(l.a, l, { def: id => O.def(id) }); };
  const locText = l => offerOf(l.v, l.cat).locAll ? 'All UAE' : (l.building ? l.building + ', ' : '') + areaName(l.loc);
  function card(l, S) {
    const pt = priceText(l, S);
    return `<a class="card" href="${HREF.listing}?id=${l.id}" data-id="${l.id}">
      <div class="photo">${photo(l)}${badges(l)}<button class="fav-btn ${favs.has(l.id) ? 'is-active' : ''}" data-fav="${l.id}" aria-label="Save ${esc(l.title)}" aria-pressed="${favs.has(l.id)}">${ico('heart')}</button>${l.img.length > 1 ? `<span class="count">${ico('grid4')}${l.img.length}</span>` : ''}</div>
      <div class="content"><div class="title">${esc(l.title)}</div>
        <div class="location">${ico('pin')}<span>${esc(locText(l))}</span></div>
        <div class="spec">${specOf(l).map(s => `<span>${esc(s)}</span>`).join('')}</div>
        <div class="price">${pt.n}<span>${pt.u}</span></div></div></a>`;
  }

  Object.assign(U, { badges, photo, priceText, specOf, locText, card });
})();
