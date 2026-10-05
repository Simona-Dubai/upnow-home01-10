/* Marketplace listing → card. Maps a listing to UPUI.ui.card() and exposes the pieces other modules reuse
   (photo, badges, priceText, specOf, locText). */
(function () {
  const U = window.UPUI = window.UPUI || {};
  const { ico, esc, t, initials, money, priceOf, favs } = U;
  const { areaName, offerOf } = UP;
  const HREF = PATHS.href;

  const badges = l => `<div class="badges">${l.featured ? `<span class="badge is-featured">${t('Featured')}</span>` : ''}${l.a.verified ? `<span class="badge is-verified">${ico('shield')}${t('Verified')}</span>` : ''}</div>`;
  function photo(l, i = 0) {
    if (l.img && l.img.length) return `<img src="${l.img[i % l.img.length]}" alt="${esc(l.title)}" loading="lazy">`;
    return `<div class="tile" style="--h:165"><b>${esc(initials(l.provider.name))}</b><span>${esc(l.provider.name)}</span><small>${esc(offerOf(l.v, l.cat).label)} insurance</small></div>`;
  }
  function priceText(l, S) { const O = offerOf(l.v, l.cat); const SS = S && S.o === l.cat ? S : null; return { n: money(priceOf(l, SS)), u: O.unit(l, SS) }; }
  const specOf = l => { const O = offerOf(l.v, l.cat); return O.spec(l.a, l, { def: id => O.def(id) }); };
  const locText = l => offerOf(l.v, l.cat).locAll ? 'All UAE' : (l.building ? l.building + ', ' : '') + areaName(l.loc);
  // phone extras (opts.acts, search page only): star rating beside the price + Call · WhatsApp · Viewing row; hidden above 700px by the page css
  function cardActs(l) {
    const O = offerOf(l.v, l.cat);
    return `<div class="card-acts"><button class="btn btn-outline" type="button" data-call="${l.id}">${ico('phone')}${t('Call')}</button><button class="btn btn-whatsapp" type="button" data-wa="${l.id}">${ico('wa')}${t('WhatsApp')}</button><button class="btn btn-primary" type="button" data-req="${l.id}">${ico(O.lease ? 'cal' : 'msg')}${t(O.lease ? 'Viewing' : 'Enquire')}</button></div>`;
  }
  // a listing rendered through the generic card (components/ui.js)
  function card(l, S, opts) {
    const html = baseCard(l, S);
    if (!opts || !opts.acts) return html;
    const rate = l.rating ? `<span class="card-rating">${ico('star')}${(+l.rating).toFixed(1)}</span>` : '';
    return html.replace('<div class="price">', rate + '<div class="price">').replace(/<\/a>\s*$/, cardActs(l) + '</a>');
  }
  function baseCard(l, S) {
    const pt = priceText(l, S);
    return U.ui.card({
      href: `${HREF.listing}?id=${l.id}`, attrs: { 'data-id': l.id }, image: photo(l), images: l.img,
      badges: [l.featured && { label: t('Featured'), tone: 'featured' }, l.a.verified && { label: t('Verified'), tone: 'verified', icon: 'shield' }].filter(Boolean),
      fav: { id: l.id, active: favs.has(l.id) }, count: l.img.length,
      title: l.title, location: locText(l), spec: specOf(l), price: pt.n, unit: pt.u
    });
  }

  Object.assign(U, { badges, photo, priceText, specOf, locText, card, cardActs });
})();
