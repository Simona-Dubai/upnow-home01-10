/* Category detail modules — Spaces vertical (9 categories). */
(function () {
  const { reg, H, live, month, fd, dayN, M } = DM;
  const { ico, esc, money } = UPUI;
  const K = UP.K;

  /* shared: viewing booker for all lease categories */
  function viewingBk(c, extraTop = '', rows = []) {
    const st = c.st;
    if (st.vd == null) Object.assign(st, { vd: 1, vt: '18:00', vm: 'person' });
    const times = ['10:00', '12:00', '14:00', '16:00', '18:00', '19:30'].map((t, i) => [t, t, (c.l.id.charCodeAt(2) + i + st.vd) % 5 === 0]);
    return extraTop + H.lab('Book a viewing') + H.days('vd', st) + H.lab('Time') + H.chips('vt', st, times) + H.lab('Viewing type') + H.seg('vm', st, [['person', 'In person'], ['video', 'Video call']]) +
      (rows.length ? H.sum(rows.slice(0, -1), rows[rows.length - 1][1], rows[rows.length - 1][0]) : '') +
      H.go(c.O.action) + (c.r() > .3 ? H.alert(`${3 + Math.round(c.r() * 6)} viewings booked this week`) : '') + H.fine('No fees on UpNow · pay the landlord directly');
  }
  const viewingGo = (c, extra = []) => ({ title: c.O.action, rows: [['Listing', c.l.title], ['Ref', c.l.ref], ['Viewing', fd(dayN(c.st.vd)) + ' · ' + c.st.vt], ['Type', c.st.vm === 'video' ? 'Video call' : 'In person'], ...extra] });

  /* move-in cost (UAE): deposit, agency 5% + VAT, Ejari 220, DEWA deposit, chiller */
  function moveIn(c, rent, { furnished, villa, commercial } = {}) {
    const ag = c.l.provider.org.startsWith('Private') ? 0 : rent * (commercial ? .1 : .05);
    const dep = rent * (furnished ? .1 : commercial ? .1 : .05);
    const dewa = commercial ? 4000 : villa ? 4000 : 2000;
    return [['Security deposit', dep, 'Refundable · ' + (furnished || commercial ? '10%' : '5%') + ' of annual rent'], ['Agency fee', ag, ag ? (commercial ? '10%' : '5%') + ' of rent' : 'None — direct from owner'], ['VAT on agency fee', ag * .05, '5%'], ['Ejari registration', 220, 'DLD tenancy registration'], ['DEWA deposit', dewa, 'Refundable · ' + (villa ? 'villa' : commercial ? 'commercial' : 'apartment')]];
  }
  function cheques(c, rent, n) {
    const rows = Array.from({ length: n }, (_, i) => { const d = new Date(2026, 10 + Math.round(i * 12 / n), 1); return [`Cheque ${i + 1}`, DM.MN[d.getMonth()] + ' ' + d.getFullYear(), rent / n]; });
    return H.table(['#', 'Dated', 'Amount'], rows.map(([a, b, v]) => [`<b>${a}</b>`, b, M(v)]), 2);
  }

  /* ---------- RESIDENTIAL — rooms like booking.com, floor plan, move-in cost ---------- */
  reg('residential', c => {
    const A = c.A, villa = ['villa', 'townhouse'].includes(A.ptype), st = c.st;
    const beds = A.beds, baths = A.baths, sq = A.sqft, rr = n => Math.round(n / 5) * 5;
    const rooms = [];
    const bedIco = 'bed';
    if (beds === 0) rooms.push(['sofa', 'Studio living & sleeping', rr(sq * .62), 'Open plan · double bed fits', 'main']);
    else {
      rooms.push(['sofa', 'Living & dining', rr(sq * (villa ? .22 : .28)), villa ? 'Double-height · garden access' : (A.amenities.includes('Balcony') ? 'Opens to balcony' : 'Open plan'), 'main']);
      for (let i = 0; i < beds; i++) rooms.push([bedIco, i === 0 ? 'Master bedroom' : 'Bedroom ' + (i + 1), rr(sq * (i === 0 ? .16 : .11)), i === 0 ? 'King bed · en-suite · walk-in wardrobe' : i === 1 ? 'Queen bed · built-in wardrobe' : 'Double bed · built-in wardrobe', 'bed']);
    }
    rooms.push(['tool', villa ? 'Kitchen (closed) + pantry' : beds === 0 ? 'Kitchenette' : 'Kitchen (open)', rr(sq * .09), A.furnishing === 'unfurnished' ? 'Cooker hob · fridge on request' : 'Fully fitted appliances', 'wet']);
    for (let i = 0; i < baths; i++) rooms.push(['bath', i < Math.min(beds, baths - 1) ? (i === 0 ? 'Master en-suite' : 'En-suite ' + (i + 1)) : 'Guest bathroom', rr(sq * .045), i === 0 ? 'Bathtub + rain shower' : 'Walk-in shower', 'wet']);
    if (A.amenities.includes("Maid's room")) rooms.push(['bed', "Maid's room", rr(sq * .04), 'With own bathroom', 'aux']);
    if (A.amenities.includes('Study')) rooms.push(['brief', 'Study', rr(sq * .05), 'Fits desk + shelving', 'aux']);
    if (A.amenities.includes('Balcony') || villa) rooms.push(['sun', villa ? 'Garden & terrace' : 'Balcony', rr(sq * (villa ? .2 : .06)), A.amenities.includes('Sea view') ? 'Sea view' : A.amenities.includes('Burj view') ? 'Burj Khalifa view' : villa ? 'Landscaped · ' + (A.amenities.includes('Private pool') ? 'private pool' : 'BBQ area') : 'Community view', 'out']);
    st.hl = st.hl ?? -1;
    const planRows = (() => {
      const main = rooms.filter(r => r[4] === 'main'), bed = rooms.filter(r => r[4] === 'bed'), wet = rooms.filter(r => r[4] === 'wet'), aux = rooms.filter(r => r[4] === 'aux'), out = rooms.filter(r => r[4] === 'out');
      return [[...out, ...main], [...bed.slice(0, 2), ...wet.slice(0, 2)], [...bed.slice(2), ...wet.slice(2), ...aux]].filter(x => x.length);
    })();
    const room = (r) => `<div class="fp-r ${r[4]} ${st.hl === rooms.indexOf(r) ? 'hl' : ''}" style="flex:${Math.max(r[2], 50)}"><b>${esc(r[1])}</b><small>${r[2]} sqft</small></div>`;
    const fp = () => `<div class="fp"><div class="fp-plan">${planRows.map(row => `<div class="fp-row" style="flex:${row.reduce((s, r) => s + r[2], 0)}">${row.map(room).join('')}</div>`).join('')}</div>
      <div class="fp-list">${rooms.map((r, i) => `<div class="rm" onmouseenter="DM._hl(${i})" onmouseleave="DM._hl(-1)"><i>${ico(r[0])}</i><div><b>${esc(r[1])}</b><small>${esc(r[3])}</small></div><em>${r[2]} sqft</em></div>`).join('')}</div></div>`;
    DM._hl = i => { st.hl = i; document.querySelectorAll('[data-live="fp"] .fp-plan').forEach(p => { const tmp = document.createElement('div'); tmp.innerHTML = fp(); p.replaceWith(tmp.querySelector('.fp-plan')); }); };

    st.ch = st.ch || Math.min(A.cheques, 4); st.tm = st.tm || 'yearly';
    const rent = () => st.tm === 'monthly' ? Math.round(c.l.price * 1.3 / 12 / 100) * 100 : c.l.price * (1 + ({ 1: 0, 2: 0, 4: .02, 6: .04, 12: .06 }[st.ch] || 0));
    const mi = () => moveIn(c, st.tm === 'monthly' ? rent() * 12 : rent(), { furnished: A.furnishing === 'furnished', villa });
    const miTotal = () => (st.tm === 'monthly' ? rent() : rent() / st.ch) + mi().reduce((s, x) => s + x[1], 0);
    const chqOpts = [1, 2, 4, 6, 12].filter(n => n <= A.cheques);

    return {
      secs: [
        ['Rooms & layout', `<p class="dm-sub">${beds === 0 ? 'Studio' : beds + ' bedrooms'} · ${baths} bathrooms · ${sq.toLocaleString()} sqft total. Schematic — hover a room to locate it.</p>` + live(c, 'fp', fp)],
        ['Cost to move in', `<p class="dm-sub">Everything due on signing, based on the payment option you pick. Typical Dubai charges — confirm with ${esc(c.fname)}.</p>` + live(c, 'mi', () => H.table(['Item', 'Note', 'Amount'], [
          [`<b>First rent ${st.tm === 'monthly' ? 'payment (month 1)' : 'cheque'}</b>`, st.tm === 'monthly' ? 'Monthly rent' : `1 of ${st.ch} cheques`, M(st.tm === 'monthly' ? rent() : rent() / st.ch)],
          ...mi().map(([a, v, n]) => [`<b>${a}</b>`, `<small>${n}</small>`, v ? M(v) : '—']),
          { cls: 'tot', c: ['Due at signing', '', M(miTotal())] }], 2) + (st.tm === 'yearly' ? `<div style="margin-top:14px">${cheques(c, rent(), st.ch)}</div>` : ''))],
        ['Building & community', H.spec([['building', 'Building', c.l.building || UP.areaName(c.l.loc)], ['layers', 'Floor', villa ? 'G+1' : (8 + Math.round(c.r() * 30)) + ' of 42'], ['car', 'Parking', villa ? '2 covered' : '1 covered'], ['snow', 'Cooling', A.chiller ? 'Chiller-free' : 'Empower (metered)'], ['clock', 'Completed', 2008 + Math.round(c.r() * 15) + ''], ['shield', 'Security', '24h · CCTV · access card']])]
      ],
      bk: () => H.price(c.l, money(rent() / (st.tm === 'monthly' ? 1 : 1)), st.tm === 'monthly' ? '/month' : '/year') +
        (A.terms && A.terms.includes('monthly') ? H.lab('Rent frequency') + H.seg('tm', st, [['yearly', 'Yearly'], ['monthly', 'Monthly']]) : '') +
        (st.tm === 'yearly' ? H.lab('Payment') + H.seg('ch', st, chqOpts.map(n => [n, n === 1 ? '1 chq' : n + ' chqs'])) : '') +
        viewingBk(c, '', [['Rent', money(rent()) + (st.tm === 'monthly' ? '/mo' : '/yr')], ['Due at signing', M(miTotal())]]),
      go: () => viewingGo(c, [['Payment', st.tm === 'monthly' ? 'Monthly' : st.ch + ' cheques'], ['Rent', money(rent()) + (st.tm === 'monthly' ? ' / month' : ' / year')], ['Due at signing', M(miTotal())]])
    };
  });

  /* ---------- COMMERCIAL — unit spec, occupancy cost, licence ---------- */
  reg('commercial', c => {
    const A = c.A, st = c.st, psf = c.l.price / A.sqft;
    st.ch = st.ch || Math.min(A.cheques, 4);
    const sc = Math.round(A.sqft * (A.grade === 'A' ? 22 : 15));
    return {
      secs: [
        ['Unit specification', H.spec([['area', 'Net area', A.sqft.toLocaleString() + ' sqft'], ['tool', 'Fit-out', { fitted: 'Fitted', semi: 'Semi-fitted', shell: 'Shell & core', furnished: 'Furnished' }[A.fitting]], ['building', 'Building grade', 'Grade ' + A.grade], ['users', 'Est. headcount', Math.round(A.sqft / 110) + ' desks'], ['car', 'Parking', A.parkingSpaces + ' bays'], ['bath', 'Washroom', A.washroom === 'private' ? 'Private' : 'Shared on floor'], ['bolt', 'DEWA', A.dewa ? 'Separate meter' : 'Shared'], ['snow', 'A/C', 'Central · chilled water'], ['brief', 'Licence', A.zone === 'freezone' ? 'Free zone' : 'Mainland (DED)']])],
        ['Annual occupancy cost', `<p class="dm-sub">What a ${A.sqft.toLocaleString()} sqft unit costs per year — before fit-out.</p>` + H.table(['Item', 'Basis', 'Per year'], [
          ['<b>Base rent</b>', M(psf) + ' / sqft', M(c.l.price)], ['<b>Service charge</b>', A.grade === 'A' ? 'AED 22 / sqft' : 'AED 15 / sqft', M(sc)], ['<b>DEWA (est.)</b>', 'AED 4 / sqft', M(A.sqft * 4)], ['<b>Ejari + municipality fee</b>', '5% of rent', M(c.l.price * .05)],
          { cls: 'tot', c: ['All-in occupancy', M((c.l.price + sc + A.sqft * 4 + c.l.price * .05) / A.sqft) + ' / sqft', M(c.l.price + sc + A.sqft * 4 + c.l.price * .05)] }], 2)],
        ['Permitted activities', H.chk([[1, 'General trading & office'], [A.ctype === 'clinic' || c.r() > .5, 'Medical / clinic (DHA)'], [A.ctype === 'fnb' || A.frontage, 'Food & beverage'], [A.ctype === 'retail' || A.frontage, 'Retail with frontage'], [A.zone === 'freezone', 'Free-zone licence eligible'], [A.zone !== 'freezone', 'Mainland DED licence']])]
      ],
      bk: () => H.price(c.l, money(c.l.price), '/year') + `<p class="dm-sub" style="margin:4px 0 0">${M(psf)} / sqft · ${A.sqft.toLocaleString()} sqft</p>` + H.lab('Payment') + H.seg('ch', st, [1, 2, 4, 6].filter(n => n <= A.cheques).map(n => [n, n + (n > 1 ? ' chqs' : ' chq')])) +
        viewingBk(c, '', [['Per cheque', M(c.l.price / st.ch)], ['Due at signing', M(c.l.price / st.ch + c.l.price * .2 + 4220)]]),
      go: () => viewingGo(c, [['Payment', st.ch + ' cheques'], ['Rent', M(c.l.price) + ' / year']])
    };
  });

  /* ---------- INDUSTRIAL — technical sheet ---------- */
  reg('industrial', c => {
    const A = c.A, st = c.st;
    return {
      secs: [
        ['Technical specification', H.spec([['area', 'Built-up area', A.sqft.toLocaleString() + ' sqft'], ['plot', 'Plot', Math.round(A.sqft * 1.35).toLocaleString() + ' sqft'], ['ruler', 'Clear height', A.heightM + ' m'], ['bolt', 'Power', A.powerKw + ' kW · 3-phase'], ['box', 'Loading docks', A.docks + (A.ramp ? ' + grade door' : '')], ['layers', 'Floor load', (3 + Math.round(c.r() * 4)) + ' t / m²'], ['brief', 'Office / mezz.', A.office ? Math.round(A.sqft * .08).toLocaleString() + ' sqft' : 'None'], ['shield', 'Civil Defence', A.civil ? 'Approved' : 'Pending'], ['car', 'Truck access', A.sqft > 15000 ? '40 ft trailer' : '7-ton truck']])],
        ['Suitable for', H.chk([[1, 'Dry storage & distribution'], [A.itype === 'cold', 'Cold chain (−25°C to +8°C)'], [A.powerKw >= 150, 'Light manufacturing'], [A.heightM >= 10, 'High-bay racking (6+ levels)'], [A.zone === 'freezone', 'Re-export (free zone)'], [A.itype === 'workshop' || A.powerKw >= 100, 'Workshop / fabrication']])],
        ['Logistics access', H.box('Drive times', 'car', [['Jebel Ali Port', 12 + Math.round(c.r() * 20) + ' min'], ['Al Maktoum Airport (DWC)', 15 + Math.round(c.r() * 15) + ' min'], ['E311 Sheikh Mohammed Bin Zayed Rd', 3 + Math.round(c.r() * 6) + ' min'], ['Abu Dhabi border', 35 + Math.round(c.r() * 15) + ' min']])]
      ],
      bk: () => H.price(c.l, money(c.l.price), '/year') + `<p class="dm-sub" style="margin:4px 0 0">${M(c.l.price / A.sqft)} / sqft · ${A.sqft.toLocaleString()} sqft BUA</p>` + viewingBk(c),
      go: () => viewingGo(c)
    };
  });

  /* ---------- LAND — zoning & development potential ---------- */
  reg('land', c => {
    const A = c.A, st = c.st, far = A.gfa / A.sqft;
    return {
      secs: [
        ['Zoning & development potential', H.spec([['plot', 'Plot area', A.sqft.toLocaleString() + ' sqft'], ['layers', 'Max GFA', A.gfa.toLocaleString() + ' sqft'], ['area', 'FAR', far.toFixed(2)], ['building', 'Height', A.height], ['grid4', 'Coverage', Math.round(45 + c.r() * 25) + '%'], ['ruler', 'Setbacks', '3 m front · 1.5 m side']]) +
          H.note(`At the permitted FAR you could build roughly <b>${Math.round(A.gfa * .82 / 850)} apartments</b> or <b>${Math.round(A.gfa * .85).toLocaleString()} sqft</b> of leasable space. Final figures come from the affection plan.`, 'trend')],
        ['Plot documents', H.chk([[1, 'Affection plan'], [1, 'Title deed / lease ownership'], [A.utilities, 'DEWA NOC & connection point'], [c.r() > .4, 'Soil test report'], [A.road, 'RTA access approval'], [c.r() > .5, 'Master developer NOC']])]
      ],
      bk: () => H.price(c.l, money(c.l.price), '/year') + `<p class="dm-sub" style="margin:4px 0 0">${A.termYrs}-year ${A.tenure} · ${M(c.l.price / A.sqft)} / sqft</p>` + viewingBk(c),
      go: () => viewingGo(c, [['Lease term', A.termYrs + ' years']])
    };
  });

  /* ---------- MIXED-USE — unit mix + rent roll ---------- */
  reg('mixed', c => {
    const A = c.A, st = c.st;
    const ret = A.retailUnits ? Math.max(2, Math.round(A.units * .12)) : 0, res = A.units - ret;
    const mix = [['Studio', Math.round(res * .3), 420, 38000], ['1 bedroom', Math.round(res * .45), 720, 58000], ['2 bedroom', res - Math.round(res * .3) - Math.round(res * .45), 1050, 82000], ret && ['Retail unit', ret, 900, 120000]].filter(Boolean);
    const occ = { vacant: 0, partial: .55, full: .96 }[A.occupancy];
    const gross = mix.reduce((s, m) => s + m[1] * m[3], 0);
    return {
      secs: [
        ['Unit mix & rent roll', H.table(['Unit type', 'Units', 'Avg size', 'Market rent', 'Annual'], [...mix.map(m => [`<b>${m[0]}</b>`, m[1], m[2] + ' sqft', M(m[3]), M(m[1] * m[3])]), { cls: 'tot', c: ['Gross potential income', A.units, '', '', M(gross)] }], 1) +
          H.note(`Currently <b>${Math.round(occ * 100)}% occupied</b>. Master-lease at ${M(c.l.price)} vs. gross potential ${M(gross)} → indicative margin <b>${Math.round((gross * .92 / c.l.price - 1) * 100)}%</b> after 8% vacancy & costs.`, 'trend')],
        ['Building', H.spec([['building', 'Floors', 'G+' + A.floors], ['area', 'BUA', A.sqft.toLocaleString() + ' sqft'], ['car', 'Parking', A.parking ? Math.round(A.units * 1.1) + ' bays (basement)' : 'Surface'], ['users', 'Occupancy', Math.round(occ * 100) + '%']])]
      ],
      bk: () => H.price(c.l, money(c.l.price), '/year') + `<p class="dm-sub" style="margin:4px 0 0">${M(c.l.price / A.units)} per unit · ${A.units} units</p>` + viewingBk(c),
      go: () => viewingGo(c)
    };
  });

  /* ---------- HOLIDAY HOME — booking.com style: rooms & beds, calendar, guests, price breakdown ---------- */
  reg('holiday', c => {
    const A = c.A, st = c.st, br = +A.beds, nightly = c.l.price;
    Object.assign(st, { a: st.a ?? 2, k: st.k ?? 0, inf: st.inf ?? 0, ci: st.ci ?? 8, co: st.co ?? 12, pick: null, mo: st.mo ?? 0 });
    const blocked = new Set(Array.from({ length: 14 }, () => 2 + Math.floor(c.r() * 58)));
    [8, 9, 10, 11, 12].forEach(d => blocked.delete(d));
    const price = d => blocked.has(d) ? null : Math.round(nightly * ([5, 6].includes(DM.dayN(d).getDay()) ? 1.25 : 1) * (d < 4 ? 1.1 : 1) / 10) * 10;
    c.fn.pick = d => { if (st.pick === 'co' && d > st.ci) { for (let x = st.ci; x < d; x++) if (blocked.has(x)) { UPUI.toast('Some nights in that range are booked'); return; } st.co = d; st.pick = null; } else { st.ci = d; st.co = null; st.pick = 'co'; } };
    c.fn.mo = v => st.mo = Math.max(0, Math.min(2, st.mo + v));
    const nights = () => st.co != null ? st.co - st.ci : 0;
    const sub = () => { let s = 0; for (let d = st.ci; d < st.co; d++) s += price(d) || nightly; return s; };
    const fees = () => { const n = nights(); const s = sub(); const disc = n >= 7 ? s * .1 : 0; return [['Cleaning fee', 250 + br * 50], ['Tourism Dirham', n * Math.max(1, br) * 15, 'AED 15 / bedroom / night'], ['Weekly discount', -disc], ['Security deposit (refundable)', 1000 + br * 500, 'Held, returned after checkout']]; };
    const total = () => sub() + fees().slice(0, 3).reduce((s, f) => s + f[1], 0);
    const bedroomCards = (br === 0 ? [['Studio', [['bed'], '1 queen bed']], ['Living area', [['sofa'], '1 sofa bed']]] :
      Array.from({ length: br }, (_, i) => [i === 0 ? 'Bedroom 1 · master' : 'Bedroom ' + (i + 1), i === 0 ? [['bed'], '1 king bed · en-suite'] : i === 1 ? [['bed', 'bed'], '2 single beds'] : [['bed'], '1 queen bed']]).concat(A.maxGuests > br * 2 + 1 ? [['Living room', [['sofa'], '1 sofa bed']]] : []));
    const tm = () => { const b = new Date(2026, 9 + st.mo, 1), b2 = new Date(2026, 10 + st.mo, 1); return [b, b2]; };
    const calHTML = (two) => { const [m1, m2] = tm(); const o = { price, sel: [st.ci, st.co], fn: 'pick', lo: d => price(d) < nightly }; return `<div class="${two ? 'cal2' : ''}">${month(m1.getFullYear(), m1.getMonth(), { ...o, nav: two ? null : 'mo' })}${two ? month(m2.getFullYear(), m2.getMonth(), o) : ''}</div>`; };
    const amenAll = ['Fast Wi-Fi', 'Full kitchen', 'Washer', 'Free parking', 'Private pool', 'Beach access', 'Sea view', 'Self check-in'];
    return {
      secs: [
        ['Where you’ll sleep', `<div class="beds">${bedroomCards.map(([t, [ics, s]]) => `<div><i>${ics.map(x => ico(x)).join('')}</i><b>${esc(t)}</b><span>${esc(s)}</span></div>`).join('')}</div>`],
        ['Availability', `<p class="dm-sub">Select check-in, then check-out. Prices per night shown under each date; amber = below usual rate.</p>` + live(c, 'cal', () => calHTML(true) + `<div class="cal-lg"><span><i></i>Selected</span><span><i class="l"></i>Deal night</span><span><i class="b"></i>Booked</span><span style="margin-left:auto">${st.mo ? `<button class="lnk" data-bk="fn" data-f="mo" data-v="-1">← Earlier</button> · ` : ''}<button class="lnk" data-bk="fn" data-f="mo" data-v="1">Later months →</button></span></div>`)],
        ['What this place offers', H.chk(amenAll.map(x => [A.amenities.includes(x) || ['Full kitchen', 'Fast Wi-Fi'].includes(x), x]).concat([[1, 'Air conditioning'], [1, 'Towels & linen'], [br > 1, 'Washer-dryer'], [0, 'Pets allowed']]))],
        ['House rules', `<div class="dm-cols">${H.box('Check-in & out', 'clock', [['Check-in', 'From 15:00' + (A.amenities.includes('Self check-in') ? ' · self check-in (smart lock)' : ' · host greets')], ['Check-out', 'By 11:00'], ['Min. stay', A.minNights + ' night' + (A.minNights > 1 ? 's' : '')], ['Cancellation', { free: 'Free up to 7 days before', moderate: '50% refund up to 5 days', strict: 'Non-refundable' }[A.cancellation]]])}
          ${H.box('Rules', 'doc', [['Guests', 'Up to ' + A.maxGuests], ['Parties / events', 'Not allowed'], ['Smoking', 'Balcony only'], ['ID', 'Passport / Emirates ID for all guests (DTCM)']])}</div>`]
      ],
      bk: () => H.price(c.l, money(nightly), '/night') +
        `<div style="margin-top:12px" class="bk-dates"><button data-bk="fn" data-f="pick" data-v="${st.ci}"><small>Check-in</small><b>${fd(dayN(st.ci))}</b></button><button><small>Check-out</small><b class="${st.co == null ? 'ph' : ''}">${st.co != null ? fd(dayN(st.co)) : 'Select date'}</b></button></div>` +
        (c.mobile ? '' : `<div class="bk-cal">${calHTML(false)}</div>`) +
        H.lab('Guests') + H.step('a', st, 'Adults', 'Age 13+', 1, A.maxGuests - st.k) + H.step('k', st, 'Children', 'Ages 2–12', 0, A.maxGuests - st.a) + H.step('inf', st, 'Infants', 'Under 2 · cot on request', 0, 2) +
        (nights() ? (nights() < A.minNights ? H.alert(`Minimum stay is ${A.minNights} nights`) : H.sum([[`${money(Math.round(sub() / nights()))} × ${nights()} night${nights() > 1 ? 's' : ''}`, M(sub())], ...fees().slice(0, 3).filter(f => f[1]).map(f => [f[0], (f[1] < 0 ? '−' : '') + M(Math.abs(f[1]))])], M(total()))) : '') +
        H.go('Request to book') + H.fine('You won’t be charged on UpNow · pay the host directly'),
      go: () => ({ title: 'Request to book', rows: [['Stay', c.l.title], ['Check-in', fd(dayN(st.ci)) + ' · from 15:00'], ['Check-out', st.co != null ? fd(dayN(st.co)) + ' · by 11:00' : '—'], ['Guests', `${st.a} adult${st.a > 1 ? 's' : ''}${st.k ? ', ' + st.k + ' child' + (st.k > 1 ? 'ren' : '') : ''}${st.inf ? ', ' + st.inf + ' infant' : ''}`], ['Nights', nights() + '']], total: M(total()) })
    };
  });

  /* ---------- VENUE — spaces × layouts, packages per guest ---------- */
  reg('venue', c => {
    const A = c.A, st = c.st, cap = A.capacity, ph = c.l.price;
    Object.assign(st, { g: st.g ?? Math.min(cap, Math.round(cap * .6 / 10) * 10 || 10), d: st.d ?? 7, ses: st.ses ?? 'evening', pk: st.pk ?? (A.catering === 'none' ? 'dry' : 'std'), lay: st.lay ?? 'banquet' });
    const spaces = [[c.l.title.split(' · ')[0], cap, 1], cap > 80 && ['Pre-function foyer', Math.round(cap * .5), .35], cap > 40 && ['Private lounge', Math.round(cap * .25), .25]].filter(Boolean);
    const L = { theatre: 1.3, classroom: .6, banquet: 1, cocktail: 1.5, ushape: .3, boardroom: .15 };
    const pk = [{ id: 'dry', t: 'Venue only (dry hire)', s: 'Space, tables, chairs, basic AV', pp: 0 }, A.catering !== 'none' && { id: 'std', t: 'Standard package', s: '3-course set menu · soft drinks · AV & screen', pp: 165 + Math.round(c.r() * 60), tag: 'Popular' }, A.catering !== 'none' && { id: 'prem', t: 'Premium package', s: 'Buffet + live station · mocktail bar · stage & lighting · décor', pp: 290 + Math.round(c.r() * 90) }].filter(Boolean);
    const hrs = { morning: 4, afternoon: 4, evening: 5, fullday: 9 }[st.ses];
    const cur = () => pk.find(p => p.id === st.pk) || pk[0];
    const hire = () => ph * hrs, food = () => cur().pp * st.g;
    const tot = () => (hire() + food()) * 1.05;
    return {
      secs: [
        ['Spaces & capacity', `<p class="dm-sub">Max guests by room layout.</p>` + H.table(['Space', 'Theatre', 'Classroom', 'Banquet', 'Cocktail', 'Boardroom'], spaces.map(([n, cp, f]) => [`<b>${esc(n)}</b>`, ...['theatre', 'classroom', 'banquet', 'cocktail', 'boardroom'].map(k => Math.max(8, Math.round(cp * L[k])))]), 1)],
        ['Packages', `<p class="dm-sub">Per-guest prices, set by the venue. Minimum spend applies on Thu–Sat evenings.</p>` + live(c, 'pk', () => H.opts('pk', st, pk.map(p => ({ ...p, p: p.pp ? M(p.pp) + '<span style="font-weight:500;color:var(--ink3)"> /guest</span>' : 'Included' }))))],
        ['Event essentials', H.chk([[A.catering === 'inhouse', 'In-house catering'], [A.catering !== 'none', 'Outside caterers ' + (A.catering === 'outside' ? 'welcome' : 'on request')], ...['AV & screen', 'Sound system', 'Stage', 'Lighting rig', 'Wi-Fi', 'Dance floor'].map(x => [A.equipment.includes(x), x]), [A.parking === 'valet', 'Valet parking'], [1, 'Event coordinator on the day']])]
      ],
      bk: () => H.price(c.l, money(ph), '/hour') + H.lab('Event date') + H.days('d', st, 6, 3) + H.lab('Session') + H.seg('ses', st, [['morning', 'AM'], ['afternoon', 'PM'], ['evening', 'Eve'], ['fullday', 'Full day']]) +
        H.lab('Guests') + H.step('g', st, st.g + ' guests', 'Max ' + cap + ' ' + st.lay, 10, cap) +
        H.lab('Package') + H.seg('pk', st, pk.map(p => [p.id, p.id === 'dry' ? 'Venue only' : p.id === 'std' ? 'Standard' : 'Premium'])) +
        H.sum([[`Venue hire · ${hrs} hrs`, M(hire())], cur().pp ? [`${cur().t.split(' ')[0]} × ${st.g} guests`, M(food())] : null, ['VAT 5%', M((hire() + food()) * .05)]], M(tot()), 'Estimated quote') + H.go('Request a quote', 'doc') + H.fine('Deposit (30%) is paid to the venue after they confirm'),
      go: () => ({ title: 'Request a quote', rows: [['Venue', c.l.title], ['Date', fd(dayN(st.d))], ['Session', { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', fullday: 'Full day' }[st.ses]], ['Guests', st.g + ''], ['Package', cur().t]], total: M(tot()), tl: 'Estimated quote' })
    };
  });

  /* ---------- COURT — court list + live slot grid ---------- */
  reg('court', c => {
    const A = c.A, st = c.st, n = Math.min(A.courts, 4), ph = c.l.price;
    Object.assign(st, { d: st.d ?? 1, sl: st.sl ?? null, dur: st.dur ?? 90, ct: st.ct ?? 0 });
    const hours = ['07:00', '08:30', '10:00', '16:00', '17:30', '19:00', '20:30', '22:00'];
    const peak = h => +h.slice(0, 2) >= 17;
    const taken = (ci, hi) => ((c.l.id.charCodeAt(3) * (ci + 3) + hi * 7 + st.d * 5) % 9) < 4;
    const courts = Array.from({ length: n }, (_, i) => [`Court ${i + 1}`, i === 0 && A.setting === 'indoor' ? 'Panoramic glass' : A.setting === 'indoor' ? 'Indoor · A/C' : 'Outdoor · floodlit']);
    const rate = h => Math.round(ph * (peak(h) ? 1.25 : .85) / 10) * 10;
    const grid = () => `<div class="slotg" style="grid-template-columns:110px repeat(${hours.length},1fr)"><span></span>${hours.map(h => `<span class="h">${h}</span>`).join('')}${courts.map(([nm, s], ci) => `<span class="c">${nm}</span>${hours.map((h, hi) => { const id = ci + '|' + h; return `<button class="${peak(h) ? 'pk' : ''} ${st.sl === id ? 'on' : ''}" ${taken(ci, hi) ? 'disabled' : ''} data-bk="set" data-k="sl" data-v="${id}">${taken(ci, hi) ? '—' : 'AED ' + rate(h) * st.dur / 60}</button>`; }).join('')}`).join('')}</div>`;
    const sel = () => st.sl ? st.sl.split('|') : null;
    const amount = () => sel() ? rate(sel()[1]) * st.dur / 60 : 0;
    return {
      secs: [
        ['Book a court', `<p class="dm-sub">Live availability for ${fd(dayN(st.d))}. Amber = peak (after 17:00). Price shown for ${st.dur} min.</p>` + live(c, 'grid', () => H.days('d', st, 7, 0) + '<div style="height:12px"></div>' + grid())],
        ['Courts', H.table(['Court', 'Surface', 'Type', 'Off-peak', 'Peak'], courts.map(([nm, s]) => [`<b>${nm}</b>`, A.sport === 'padel' ? 'Mondo artificial turf' : A.sport === 'tennis' ? 'Hard court' : /football/.test(A.sport) ? '3G turf' : 'Sprung wood', s, M(rate('10:00')) + '/hr', M(rate('19:00')) + '/hr']), 3)],
        ['At the club', H.chk(['Racket / ball rental', 'Changing rooms', 'Showers', 'Floodlights', 'Coaching', 'Café', 'Parking'].map(x => [A.amenities.includes(x), x]))]
      ],
      bk: () => H.price(c.l, money(ph), '/hour') + H.lab('Duration') + H.seg('dur', st, [[60, '60 min'], [90, '90 min'], [120, '120 min']]) +
        (sel() ? `<div class="dm-note" style="margin-top:12px">${ico('racket')}<span><b>Court ${+sel()[0] + 1} · ${fd(dayN(st.d))}</b><br>${sel()[1]} – ${(() => { const [h, m] = sel()[1].split(':').map(Number); const t = h * 60 + m + st.dur; return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); })()}</span></div>` +
          H.sum([['Court fee', M(amount())], ['Per player (4)', M(amount() / 4)]], M(amount()), 'Total') : `<div class="dm-note" style="margin-top:12px">${ico('grid4')}<span>Pick a free slot in the grid to continue.</span></div>`) +
        H.go(sel() ? 'Request this slot' : 'Choose a slot', 'clock') + H.fine('Pay at the club · free cancellation up to 24h'),
      go: () => ({ title: 'Request this slot', rows: [['Club', c.l.title], ['Date', fd(dayN(st.d))], ['Court', sel() ? 'Court ' + (+sel()[0] + 1) : '—'], ['Start', sel() ? sel()[1] : '—'], ['Duration', st.dur + ' min']], total: M(amount()) })
    };
  });

  /* ---------- YACHT — packages, route, add-ons ---------- */
  reg('yacht', c => {
    const A = c.A, st = c.st, ph = c.l.price;
    Object.assign(st, { d: st.d ?? 2, h: st.h ?? A.minHours, dep: st.dep ?? 'Sunset', g: st.g ?? Math.min(8, A.capacity), ad: st.ad ?? [] });
    const adds = [['bbq', 'BBQ & soft drinks', 85, 'pp'], ['cake', 'Birthday cake & décor', 450], ['jet', 'Jet ski (30 min)', 350], ['dj', 'DJ on board', 900], ['photo', 'Photographer (1 hr)', 600]];
    const add = () => adds.filter(a => st.ad.includes(a[0])).reduce((s, a) => s + (a[3] ? a[2] * st.g : a[2]), 0);
    const hrs = [A.minHours, A.minHours + 1, A.minHours + 2, 8].filter((x, i, a) => a.indexOf(x) === i);
    const tot = () => (ph * st.h + add()) * 1.05;
    return {
      secs: [
        ['The yacht', H.spec([['ruler', 'Length', A.length + ' ft'], ['boat', 'Type', { motor: 'Motor yacht', catamaran: 'Catamaran', sailing: 'Sailing yacht', speed: 'Speedboat' }[A.ytype]], ['users', 'Capacity', A.capacity + ' guests'], ['bed', 'Cabins', Math.max(1, Math.round(A.length / 30)) + ' cabins'], ['bath', 'Toilets', Math.max(1, Math.round(A.length / 40))], ['user', 'Crew', A.crew === 'full' ? 'Captain + 2 crew' : 'Captain']])],
        ['Suggested route', H.tl([['0:00', 'Board at ' + UP.areaName(c.l.loc), 'Welcome drinks · safety briefing'], ['0:20', 'Ain Dubai & JBR', 'Photo stop'], ['0:45', 'Atlantis & Palm Jumeirah', A.activities.includes('Swimming stop') ? 'Anchor · 30 min swim' : 'Cruise past'], ['1:30', 'Burj Al Arab', 'Sunset photos'], [st.h + ':00', 'Return to marina', '']])],
        ['Included & add-ons', H.chk([[1, 'Fuel & marina fees'], [1, 'Life jackets & safety kit'], [A.food.includes('Soft drinks'), 'Water & soft drinks'], [1, 'Bluetooth sound system'], [A.activities.includes('Fishing'), 'Fishing gear'], [A.activities.includes('Water toys'), 'Water toys (paddle board)'], [0, 'Alcohol (not served by operator)']])]
      ],
      bk: () => H.price(c.l, money(ph), '/hour') + H.lab('Date') + H.days('d', st) + H.lab('Departure') + H.chips('dep', st, ['Morning', 'Afternoon', 'Sunset', 'Night']) +
        H.lab('Duration') + H.seg('h', st, hrs.map(h => [h, h === 8 ? 'Full day' : h + ' hrs'])) + H.lab('Guests') + H.step('g', st, st.g + ' guests', 'Max ' + A.capacity, 1, A.capacity) +
        H.lab('Add-ons') + H.chips('ad', st, adds.map(a => [a[0], a[1] + ' · ' + K(a[2]) + (a[3] ? '/pp' : '')]), true) +
        H.sum([[`${M(ph)} × ${st.h} hrs`, M(ph * st.h)], add() ? ['Add-ons', M(add())] : null, ['VAT 5%', M((ph * st.h + add()) * .05)]], M(tot())) + H.go('Check availability') + H.fine('Operator takes a deposit after confirming'),
      go: () => ({ title: 'Check availability', rows: [['Yacht', c.l.title], ['Date', fd(dayN(st.d)) + ' · ' + st.dep], ['Duration', st.h + ' hours'], ['Guests', st.g + ''], ['Add-ons', adds.filter(a => st.ad.includes(a[0])).map(a => a[1]).join(', ') || 'None']], total: M(tot()) })
    };
  });
})();
