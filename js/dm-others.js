/* Category detail modules — Services, Experiences, Memberships, Programs, Insurance (16 categories). */
(function () {
  const { reg, H, live, fd, dayN, M } = DM;
  const { ico, esc, money } = UPUI;

  const slotTimes = (c, d, list) => list.map((t, i) => [t, t, ((c.l.id.charCodeAt(3) + i * 3 + d * 7) % 7) < 2]);
  const sel = (arr, id) => arr.find(x => x.id === id) || arr[0];
  const menuOpts = (arr, st, k) => H.opts(k, st, arr.map(x => ({ ...x, p: x.p != null ? M(x.p) : '' })));

  /* ======================= SERVICES ======================= */
  reg('cleaning', c => {
    const A = c.A, st = c.st, ph = c.l.price;
    Object.assign(st, { sv: st.sv ?? 'reg', hrs: st.hrs ?? Math.max(A.minHours, 3), cl: st.cl ?? Math.min(2, A.team), fr: st.fr ?? 'once', mat: st.mat ?? !!A.materials, d: st.d ?? 1, t: st.t ?? '09:00' });
    const SV = [{ id: 'reg', t: 'Regular clean', s: 'Dusting, floors, kitchen & bathrooms', mult: 1 }, { id: 'deep', t: 'Deep clean', s: 'Inside cabinets, appliances, grout, windows', mult: 1.45, tag: 'Popular' }, { id: 'move', t: 'Move-in / move-out', s: 'Empty-property deep clean + balcony', mult: 1.6 }, { id: 'sofa', t: 'Sofa & carpet shampoo', s: 'Steam & extraction — priced per seat / sqm', mult: 1.3 }];
    const FR = { once: [0, 'One-time'], weekly: [.15, 'Weekly · save 15%'], biweekly: [.1, 'Every 2 wks · save 10%'], contract: [.2, 'Monthly contract · save 20%'] };
    const rate = () => ph * sel(SV, st.sv).mult, sub = () => rate() * st.hrs * st.cl, disc = () => sub() * FR[st.fr][0], mat = () => st.mat ? 10 * st.hrs : 0;
    const tot = () => (sub() - disc() + mat()) * 1.05;
    return {
      secs: [
        ['Choose a service', live(c, 'sv', () => H.opts('sv', st, SV.map(s => ({ ...s, p: M(ph * s.mult) + '<span style="font-weight:500;color:var(--ink3)">/hr</span>' }))))],
        ['What’s included', `<div class="dm-cols">${H.box('Every visit', 'check', [['Kitchen', 'Counters, hob, sink, outside of appliances'], ['Bathrooms', 'Toilet, shower, tiles, mirrors'], ['Rooms', 'Dusting, beds, vacuum & mop'], ['Bins', 'Emptied & relined']])}${H.box('Not included', 'x', [['Inside oven / fridge', 'Deep clean only'], ['Windows (outside)', 'Building access needed'], ['Laundry & ironing', 'Add-on · AED 30/hr'], ['Pest control', 'Separate service']])}</div>`],
        ['Your team', H.spec([['users', 'Team size', 'Up to ' + A.team + ' cleaners'], ['shield', 'Vetting', 'Emirates ID + police check'], ['clock', 'Minimum', A.minHours + ' hours'], ['tool', 'Materials', A.materials ? 'Brought by team' : 'Customer provides / +AED 10/hr'], ['pin', 'Covers', (c.l.coverage || []).length + ' areas'], ['star', 'Rating', c.l.rating + ' · ' + c.l.reviews + ' visits']])]
      ],
      bk: () => H.price(c.l, money(ph), '/hour per cleaner') + H.lab('How often') + H.chips('fr', st, Object.entries(FR).map(([k, [, t]]) => [k, t])) + H.lab('Date') + H.days('d', st) + H.lab('Start time') + H.chips('t', st, slotTimes(c, st.d, ['08:00', '09:00', '11:00', '13:00', '15:00', '17:00'])) +
        H.step('hrs', st, st.hrs + ' hours', 'Min ' + A.minHours, A.minHours, 8) + H.step('cl', st, st.cl + ' cleaner' + (st.cl > 1 ? 's' : ''), 'Up to ' + A.team, 1, A.team) +
        `<div class="bk-st"><div><b>Cleaning materials</b><small>+ AED 10 / hour</small></div><div><button data-bk="flag" data-k="mat" style="width:auto;padding:0 12px;border-radius:99px;${st.mat ? 'background:var(--g7);color:#fff;border-color:var(--g7)' : ''}">${st.mat ? 'Added' : 'Add'}</button></div></div>` +
        H.sum([[`${M(rate())} × ${st.hrs} hrs × ${st.cl}`, M(sub())], disc() ? [FR[st.fr][1].split(' · ')[0] + ' discount', '−' + M(disc())] : null, mat() ? ['Materials', M(mat())] : null, ['VAT 5%', M((sub() - disc() + mat()) * .05)]], M(tot()), st.fr === 'once' ? 'Total' : 'Per visit') + H.go('Request booking') + H.fine('Pay the company after the visit'),
      go: () => ({ title: 'Request booking', rows: [['Company', c.l.provider.name], ['Service', sel(SV, st.sv).t], ['When', fd(dayN(st.d)) + ' · ' + st.t], ['Team', st.cl + ' × ' + st.hrs + ' hrs'], ['Frequency', FR[st.fr][1]]], total: M(tot()) })
    };
  });

  reg('ac', c => {
    const A = c.A, st = c.st, ph = c.l.price;
    Object.assign(st, { m: st.m ?? (A.model.includes('annual') ? 'annual' : 'once'), u: st.u ?? 3, d: st.d ?? 1, t: st.t ?? 'AM', p: st.p ?? 'Apartment' });
    const SV = [{ id: 'svc', t: 'General service', s: 'Filter wash, coil clean, gas pressure check', p: ph }, { id: 'duct', t: 'Duct cleaning', s: 'Full duct vacuum + sanitise', p: ph * 2.2 }, { id: 'gas', t: 'Gas top-up', s: 'R410A refill, leak test', p: ph * 1.4 }, { id: 'rep', t: 'Repair / diagnosis', s: 'Call-out + 1 hr labour, parts extra', p: 149 }];
    const amc = () => ph * 3 * st.u, once = () => sel(SV, st.sv).p * st.u;
    return {
      secs: [
        ['Service menu', live(c, 'svm', () => { st.sv = st.sv ?? 'svc'; return menuOpts(SV.map(s => ({ ...s, s: s.s + ' · per unit' })), st, 'sv'); })],
        ['Annual maintenance contract (AMC)', H.table(['', 'Basic', 'Comprehensive'], [['<b>Scheduled visits</b>', A.visits + ' / year', (A.visits + 1) + ' / year'], ['<b>Emergency call-outs</b>', A.emergency ? '2 free' : 'Paid', 'Unlimited'], ['<b>Response time</b>', A.sla + ' hrs', Math.max(4, A.sla / 2) + ' hrs'], ['<b>Parts</b>', 'Charged', A.parts === 'included' ? 'Included' : 'Up to AED 500'], ['<b>Duct cleaning</b>', H.no, '1 / year'], { cls: 'tot', c: ['Per unit / year', M(ph * 3), M(ph * 4.2)] }], 1)],
        ['Coverage', H.spec([['clock', 'Response SLA', A.sla + ' hours'], ['bolt', '24/7 emergency', A.emergency ? 'Yes' : 'No'], ['tool', 'AC types', A.acType.join(', ')], ['pin', 'Areas covered', (c.l.coverage || []).length + ' communities']])]
      ],
      bk: () => H.price(c.l, money(st.m === 'annual' ? ph * 3 : ph), st.m === 'annual' ? '/unit/year' : '/unit') + H.lab('Service type') + H.seg('m', st, [['once', 'One-time'], ['annual', 'Annual (AMC)']]) +
        H.lab('Property') + H.chips('p', st, A.property) + H.step('u', st, st.u + ' AC unit' + (st.u > 1 ? 's' : ''), 'Split / ducted / cassette', 1, A.maxUnits) +
        H.lab(st.m === 'annual' ? 'First visit' : 'Date') + H.days('d', st) + H.lab('Window') + H.seg('t', st, [['AM', '8–12'], ['PM', '12–4'], ['EVE', '4–8']]) +
        H.sum([[st.m === 'annual' ? `AMC × ${st.u} units` : `${sel(SV, st.sv).t} × ${st.u}`, M(st.m === 'annual' ? amc() : once())], ['VAT 5%', M((st.m === 'annual' ? amc() : once()) * .05)]], M((st.m === 'annual' ? amc() : once()) * 1.05)) + H.go('Request a quote', 'doc') + H.fine('Technician confirms final price on site'),
      go: () => ({ title: 'Request a quote', rows: [['Company', c.l.provider.name], ['Service', st.m === 'annual' ? 'Annual contract' : sel(SV, st.sv).t], ['Units', st.u + ' · ' + st.p], ['Visit', fd(dayN(st.d)) + ' · ' + st.t]], total: M((st.m === 'annual' ? amc() : once()) * 1.05) })
    };
  });

  reg('haircut', c => {
    const A = c.A, st = c.st, ph = c.l.price;
    const menu = [["Men's cut", 0, 30], ['Cut & beard', 1.4, 45], ['Beard trim', .5, 20], ["Women's cut & style", 1.8, 60], ['Blow-dry', 1.1, 40], ['Root colour', 2.6, 90], ['Full highlights', 4.2, 150], ['Kids cut', .7, 25]].map(([t, m, d], i) => ({ id: 'm' + i, t, d, p: Math.round(ph * (m || 1) / 5) * 5 }));
    const team = ['Sam', 'Lina', 'Ahmed', 'Rosa'].slice(0, 3).map((n, i) => ({ id: n, t: n + (i === 0 ? ' · Senior stylist' : i === 1 ? ' · Colour specialist' : ' · Barber'), s: (4.6 + i * .1).toFixed(1) + '★ · ' + (120 + i * 60) + ' reviews', p: i === 0 ? 20 : 0 }));
    Object.assign(st, { tr: st.tr ?? ['m0'], pro: st.pro ?? 'any', d: st.d ?? 1, t: st.t ?? '17:30', at: st.at ?? 'salon' });
    const items = () => menu.filter(m => st.tr.includes(m.id));
    const tot = () => items().reduce((s, m) => s + m.p, 0) + (st.pro !== 'any' ? 20 : 0) + (st.at === 'home' ? 100 : 0);
    return {
      secs: [
        ['Service menu', `<p class="dm-sub">Tap to add to your booking.</p>` + live(c, 'menu', () => `<div class="optl">${menu.map(m => `<button class="opt ${st.tr.includes(m.id) ? 'on' : ''}" data-bk="tg" data-k="tr" data-v="${m.id}"><span class="rd" style="border-radius:5px"></span><div><b>${esc(m.t)}</b><small>${m.d} min</small></div><em>${M(m.p)}</em></button>`).join('')}</div>`)],
        ['Team', live(c, 'team', () => H.opts('pro', st, [{ id: 'any', t: 'Any professional', s: 'Fastest available', p: '' }, ...team.map(x => ({ ...x, p: x.p ? '+' + M(x.p) : '' }))]))],
        ['Opening hours', H.box('This week', 'clock', [['Sat – Thu', '10:00 – 22:00'], ['Friday', '14:00 – 23:00'], ['Home visits', A.setting.includes('home') ? 'Yes · + AED 100' : 'Not offered']])]
      ],
      bk: () => H.price(c.l, money(ph), 'from') + (A.setting.includes('home') ? H.lab('Where') + H.seg('at', st, [['salon', 'In salon'], ['home', 'At home +100']]) : '') + H.lab('Date') + H.days('d', st, 6, 0) + H.lab('Time') + H.chips('t', st, slotTimes(c, st.d, ['10:00', '11:30', '13:00', '15:00', '17:30', '19:00', '20:30'])) +
        H.sum([...items().map(m => [m.t + ' · ' + m.d + 'm', M(m.p)]), st.pro !== 'any' ? ['Chosen stylist', M(20)] : null, st.at === 'home' ? ['Home visit', M(100)] : null], M(tot()), 'Total · ' + items().reduce((s, m) => s + m.d, 0) + ' min') + H.go(items().length ? 'Request appointment' : 'Pick a service') + H.fine('Pay at the salon'),
      go: () => ({ title: 'Request appointment', rows: [['Salon', c.l.provider.name], ['Services', items().map(m => m.t).join(', ')], ['When', fd(dayN(st.d)) + ' · ' + st.t], ['With', st.pro === 'any' ? 'Any professional' : st.pro]], total: M(tot()) })
    };
  });

  reg('dentist', c => {
    const A = c.A, st = c.st, ph = c.l.price;
    const docs = [['Dr. Sara Malik', 'Orthodontist', 12], ['Dr. James Cole', 'General dentist', 9], ['Dr. Rania Aziz', A.specialist[0] || 'Endodontist', 15]];
    Object.assign(st, { dr: st.dr ?? 0, d: st.d ?? 1, t: st.t ?? '16:00', ins: st.ins ?? A.insurance[0], ty: st.ty ?? 'new' });
    const covered = () => A.insurance.includes(st.ins) && st.ins !== 'Self-pay';
    return {
      secs: [
        ['Doctors', live(c, 'docs', () => `<div class="optl">${docs.map(([n, s, y], i) => `<button class="opt ${st.dr === i ? 'on' : ''}" data-bk="set" data-k="dr" data-v="${i}"><span class="rd"></span><div><b>${n}</b><small>${s} · ${y} yrs experience · DHA licensed · ${A.language.slice(0, 2).join(', ')}</small></div><em>${(4.7 + i * .1).toFixed(1)}★</em></button>`).join('')}</div>`)],
        ['Treatment prices', `<p class="dm-sub">Self-pay guide prices. Final plan after consultation.</p>` + H.table(['Treatment', 'Duration', 'From'], [['Consultation & X-ray', '30 min', M(ph)], ['Scale & polish', '45 min', M(ph * 1.3)], ['Whitening (in-chair)', '90 min', M(ph * 6)], ['Clear aligners (full)', '6–18 months', M(ph * 45)], ['Root canal (molar)', '2 visits', M(ph * 9)], ['Implant incl. crown', '3–6 months', M(ph * 22)]].map(r => [`<b>${r[0]}</b>`, r[1], r[2]]), 2)],
        ['Insurance accepted', H.chk(['Daman', 'AXA', 'Bupa', 'MetLife', 'Cigna', 'Direct billing'].map(x => [A.insurance.includes(x), x]))]
      ],
      bk: () => H.price(c.l, money(ph), '/consultation') + H.lab('Visit') + H.seg('ty', st, [['new', 'New patient'], ['ret', 'Returning'], ['emg', 'Emergency']]) +
        H.lab('Doctor') + `<select class="bk-in" onchange="DM._set('dr',+this.value)">${docs.map((d, i) => `<option value="${i}" ${st.dr === i ? 'selected' : ''}>${d[0]} · ${d[1]}</option>`).join('')}</select>` +
        H.lab('Date') + H.days('d', st, 6, 0) + H.lab('Time') + H.chips('t', st, slotTimes(c, st.d + st.dr, ['09:00', '10:30', '12:00', '14:30', '16:00', '18:30'])) +
        H.lab('Payment') + H.chips('ins', st, [...A.insurance.slice(0, 4), 'Self-pay']) +
        H.sum([['Consultation', M(ph)], covered() ? ['Insurance (est. 80%)', '−' + M(ph * .8)] : null], M(covered() ? ph * .2 : ph), covered() ? 'You pay (co-pay)' : 'You pay') + H.go('Request appointment') + H.fine('Clinic verifies insurance before your visit'),
      go: () => ({ title: 'Request appointment', rows: [['Clinic', c.l.provider.name], ['Doctor', docs[st.dr][0]], ['When', fd(dayN(st.d)) + ' · ' + st.t], ['Visit', { new: 'New patient', ret: 'Returning', emg: 'Emergency' }[st.ty]], ['Payment', st.ins]], total: M(covered() ? ph * .2 : ph), tl: 'Est. you pay' })
    };
  });

  /* ======================= EXPERIENCES ======================= */
  function expMod(c, { itin, inc, exc, opts, ses, unit = '/person' }) {
    const A = c.A, st = c.st, pp = c.l.price;
    Object.assign(st, { d: st.d ?? 1, s: st.s ?? ses[0][0], ad: st.ad ?? 2, ch: st.ch ?? 0, op: st.op ?? opts[0].id });
    const o = () => sel(opts, st.op), sub = () => (st.ad + st.ch * .75) * pp * o().m;
    const left = 2 + (c.l.id.charCodeAt(2) + st.d) % 9;
    return {
      secs: [
        ['Itinerary', H.tl(itin)],
        ['What’s included', `<div class="dm-cols"><div class="dm-box"><h4>${ico('check')}Included</h4>${H.chk(inc.map(x => [1, x]))}</div><div class="dm-box"><h4>${ico('x')}Not included</h4>${H.chk(exc.map(x => [0, x]))}</div></div>`],
        ['Options', live(c, 'xo', () => H.opts('op', st, opts.map(x => ({ ...x, p: M(pp * x.m) + '<span style="font-weight:500;color:var(--ink3)">' + unit + '</span>' }))))],
        ['Good to know', H.spec([['users', 'Group size', A.format === 'private' ? 'Private' : 'Up to ' + (A.groupMax || 20)], ['globe', 'Languages', (A.language || ['English']).slice(0, 3).join(', ')], ['user', 'Min. age', (A.minAge || 3) + '+'], ['clock', 'Cancellation', 'Free up to 24h'], ['shield', 'Licence', 'DTCM-licensed'], ['car', 'Pickup', (A.transport || []).includes?.('4x4') || A.transport === 'pickup' ? 'Hotel pickup' : 'Meeting point']])]
      ],
      bk: () => H.price(c.l, money(pp), unit) + H.lab('Date') + H.days('d', st) + H.lab('Session') + H.seg('s', st, ses) +
        H.step('ad', st, 'Adults', 'Age 12+', 1, 20) + H.step('ch', st, 'Children', '3–11 · 25% off', 0, 10) +
        H.sum([[`${o().t} · ${st.ad} adult${st.ad > 1 ? 's' : ''}`, M(st.ad * pp * o().m)], st.ch ? [`${st.ch} child${st.ch > 1 ? 'ren' : ''}`, M(st.ch * pp * o().m * .75)] : null], M(sub())) + (left < 6 ? H.alert(`Only ${left} spots left on ${fd(dayN(st.d))}`) : '') +
        H.go('Check availability') + H.fine('Pay the operator directly · free cancellation 24h'),
      go: () => ({ title: 'Check availability', rows: [['Experience', c.l.title], ['Date', fd(dayN(st.d)) + ' · ' + ses.find(s => s[0] === st.s)[1]], ['Option', o().t], ['Guests', st.ad + ' adults' + (st.ch ? ', ' + st.ch + ' children' : '')]], total: M(sub()) })
    };
  }
  reg('safari', c => expMod(c, {
    itin: c.A.session.includes('morning') && !c.A.session.includes('evening') ? [['07:30', 'Hotel pickup', '4×4 Land Cruiser'], ['08:30', 'Dune bashing', '30 min in the Lahbab red dunes'], ['09:15', 'Sandboarding & camel ride', ''], ['10:30', 'Arabic coffee & dates', ''], ['11:30', 'Drop-off', '']] :
      [['15:00', 'Hotel pickup', '4×4 Land Cruiser · 45 min drive'], ['16:00', 'Dune bashing', '30–40 min · sunset photo stop'], ['17:30', 'Camp arrival', 'Camel ride, sandboarding, henna'], ['18:30', 'Live shows', 'Tanoura, fire show, belly dance'], ['19:30', c.A.meals.includes('BBQ dinner') ? 'BBQ buffet dinner' : 'Light refreshments', 'Veg & non-veg options'], ['21:30', 'Drop-off', '']],
    inc: ['4×4 hotel pickup & drop-off', 'Dune bashing with licensed driver', 'Sandboarding', 'Short camel ride', ...(c.A.meals.includes('BBQ dinner') ? ['BBQ buffet dinner'] : []), 'Water & soft drinks'],
    exc: ['Quad biking (AED 150)', 'Photos & video', 'Alcohol', 'Tips'],
    opts: [{ id: 'sh', t: 'Shared 4×4', s: 'Up to 6 per car', m: 1 }, { id: 'pv', t: 'Private 4×4', s: 'Your group only', m: 2.1, tag: 'Best for families' }, { id: 'vip', t: 'VIP + quad bike', s: 'Majlis seating, 30 min quad', m: 2.6 }],
    ses: [['eve', 'Evening'], ['am', 'Morning'], ['ovn', 'Overnight']]
  }));
  reg('workshop', c => expMod(c, {
    itin: [['0:00', 'Welcome & safety', 'Aprons & tea'], ['0:15', 'Demo by the instructor', c.A.topic + ' basics'], ['0:40', 'Hands-on session', 'You make your own piece'], ['1:45', 'Finishing & wrap-up', c.A.topic === 'Pottery' ? 'Glazed & ready for pickup in 2 weeks' : 'Take it home today']],
    inc: ['All materials & tools', 'Instructor guidance', 'Refreshments', 'Your finished piece'], exc: ['Shipping of pieces', 'Private room hire'],
    opts: [{ id: 'grp', t: 'Group session', s: 'Up to ' + c.A.groupMax + ' people', m: 1 }, { id: 'pvt', t: 'Private for 2', s: 'Instructor just for you', m: 1.8 }, { id: 'team', t: 'Team-building (8+)', s: 'Corporate · invoice provided', m: .9 }],
    ses: [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']], unit: '/session'
  }));
  reg('tour', c => expMod(c, {
    itin: [['09:00', 'Meet your guide', c.A.transport === 'pickup' ? 'Hotel pickup' : 'Al Fahidi metro, exit 2'], ['09:30', 'Al Fahidi Historical District', 'Wind towers & courtyard houses'], ['10:30', 'Abra across the Creek', 'Traditional water taxi · AED 1'], ['11:00', 'Spice & Gold Souks', 'Tastings included'], ['12:30', 'Lunch stop', 'Emirati café'], ['13:30', 'Tour ends', '']],
    inc: ['Licensed guide', 'Abra ride', 'Tastings', ...(c.A.transport === 'pickup' ? ['Hotel pickup'] : [])], exc: ['Lunch', 'Souvenirs', 'Tips'],
    opts: [{ id: 'sh', t: 'Shared group', s: 'Max ' + c.A.groupMax, m: 1 }, { id: 'pv', t: 'Private tour', s: 'Flexible pace', m: 1.9 }],
    ses: [['am', 'Morning'], ['pm', 'Afternoon']]
  }));

  /* ======================= MEMBERSHIPS ======================= */
  reg('gym', c => {
    const A = c.A, st = c.st, pm = c.l.price;
    const plans = [{ id: 'off', t: 'Off-peak', s: 'Weekdays 10–16 · weekends', m: .7 }, { id: 'std', t: 'Standard', s: 'Home club · all hours', m: 1, tag: 'Popular' }, { id: 'all', t: 'All-access', s: A.branches + ' clubs · classes · pool', m: 1.45 }];
    Object.assign(st, { pl: st.pl ?? 'std', bl: st.bl ?? 'monthly', d: st.d ?? 1 });
    const price = () => pm * sel(plans, st.pl).m * (st.bl === 'annual' ? 10 : 1);
    return {
      secs: [
        ['Compare plans', H.table(['', 'Off-peak', 'Standard', 'All-access'], [['<b>Access</b>', 'Limited hours', '24/7 home club', A.branches + ' clubs'], ['<b>Group classes</b>', H.no, A.classes.slice(0, 2).join(', '), 'All ' + A.classes.length + ' types'], ['<b>Pool & sauna</b>', H.no, A.classes.includes('Pool') ? H.yes : H.no, H.yes], ['<b>Guest passes</b>', H.no, '1 / month', '4 / month'], ['<b>Freeze</b>', H.no, A.freeze ? 'Up to 1 month' : H.no, 'Up to 3 months'], { cls: 'tot', c: ['Monthly', M(pm * .7), M(pm), M(pm * 1.45)] }], 1)],
        ['Class timetable', H.table(['Time', 'Today', 'Tomorrow', 'Sat'], [['07:00', 'HIIT', 'Spin', 'Yoga'], ['12:30', 'Pilates', 'HIIT', '—'], ['18:30', 'Spin', 'Yoga', 'HIIT'], ['20:00', 'Yoga', 'Pilates', 'Spin']].map(r => [`<b>${r[0]}</b>`, ...r.slice(1)]))],
        ['Terms', H.spec([['tag', 'Joining fee', A.noJoin ? 'Waived' : M(199)], ['clock', 'Contract', st.bl === 'annual' ? '12 months' : 'Monthly rolling'], ['moon', 'Freeze', A.freeze ? 'Allowed' : 'Not allowed'], ['x', 'Cancel', '30 days notice']])]
      ],
      bk: () => H.price(c.l, money(price()), st.bl === 'annual' ? '/year' : '/month') + H.lab('Billing') + H.seg('bl', st, [['monthly', 'Monthly'], ['annual', 'Annual · 2 months free']]) + H.lab('Plan') + H.opts('pl', st, plans.map(p => ({ ...p, p: M(pm * p.m * (st.bl === 'annual' ? 10 : 1)) }))) +
        H.lab('Free visit') + H.days('d', st) + H.sum([['Plan', M(price())], !A.noJoin ? ['Joining fee', M(199)] : ['Joining fee', 'Waived']], M(price() + (A.noJoin ? 0 : 199)), 'First payment') + H.go('Book a free visit') + H.fine('Sign up at the club after your free visit'),
      go: () => ({ title: 'Book a free visit', rows: [['Club', c.l.provider.name], ['Plan', sel(plans, st.pl).t + ' · ' + st.bl], ['Visit', fd(dayN(st.d))]], total: M(price()) })
    };
  });
  reg('credits', c => {
    const A = c.A, st = c.st, base = c.l.price / A.maxCredits;
    const packs = [10, 20, 50, 100].filter(n => n <= A.maxCredits).map((n, i) => ({ id: n, t: n + ' credits', s: `~${Math.round(n / 4)} classes · valid ${A.validity} months`, p: Math.round(base * n * (1 - i * .07)), tag: i === 2 ? 'Best value' : '' }));
    st.pk = st.pk ?? packs[Math.min(1, packs.length - 1)].id;
    return {
      secs: [['Credit packs', live(c, 'pk', () => menuOpts(packs, st, 'pk'))], ['What credits buy', H.table(['Activity', 'Credits', 'Partners'], [['Fitness class', '4', A.locations], ['Padel court (60 min)', '8', Math.round(A.locations / 3)], ['Pool day pass', '6', Math.round(A.locations / 4)], ['Spa treatment', '12', Math.round(A.locations / 5)]].map(r => [`<b>${r[0]}</b>`, r[1], r[2]]), 1)]],
      bk: () => H.price(c.l, money(sel(packs, st.pk).p), '/package') + H.lab('Pack') + H.seg('pk', st, packs.map(p => [p.id, p.id + ''])) + H.sum([['Per credit', M(sel(packs, st.pk).p / st.pk)]], M(sel(packs, st.pk).p)) + H.go('Enquire about package', 'msg'),
      go: () => ({ title: 'Enquire about package', rows: [['Provider', c.l.provider.name], ['Pack', st.pk + ' credits']], total: M(sel(packs, st.pk).p) })
    };
  });

  /* ======================= PROGRAMS ======================= */
  reg('school', c => {
    const A = c.A, st = c.st, fee = c.l.price;
    const grades = ['FS1', 'FS2', 'Year 1', 'Year 3', 'Year 6', 'Year 9', 'Year 11', 'Year 13'];
    Object.assign(st, { g: st.g ?? 'Year 1', d: st.d ?? 3 });
    const gf = g => Math.round(fee * (0.72 + grades.indexOf(g) * .07) / 500) * 500;
    return {
      secs: [
        ['Fees by year group', `<p class="dm-sub">KHDA-approved fees for ${A.intake[0]} intake. Most schools allow payment in 3 terms.</p>` + H.table(['Year group', 'Annual fee', 'Per term'], grades.map(g => [`<b>${g}</b>`, M(gf(g)), M(gf(g) / 3)]), 1)],
        ['Admissions timeline', H.tl([['Step 1', 'Submit enquiry', 'Get the prospectus'], ['Step 2', 'School tour', 'Meet the admissions team'], ['Step 3', 'Assessment', 'Age-appropriate, 45–60 min'], ['Step 4', 'Offer & registration fee', M(500) + ' (non-refundable)'], ['Step 5', 'Seat deposit & enrolment', '10% of annual fee']])],
        ['School at a glance', H.spec([['star', 'KHDA rating', ['', 'Outstanding', 'Very good', 'Good', 'Acceptable'][A.khda]], ['grad', 'Curriculum', A.curriculum], ['users', 'Students', (900 + Math.round(c.r() * 1800)).toLocaleString()], ['user', 'Teacher ratio', '1 : ' + (11 + Math.round(c.r() * 6))], ['car', 'Transport', A.transport ? 'Bus · AED 7,500/yr' : 'Not offered'], ['check', 'Places', A.admissions === 'open' ? 'Available' : 'Waitlist']])],
        ['Facilities', H.chk(['Swimming pool', 'Sports hall', 'Theatre', 'Science labs', 'Football pitch'].map(x => [A.facilities.includes(x), x]))]
      ],
      bk: () => H.price(c.l, money(gf(st.g)), '/year') + H.lab('Year group') + `<select class="bk-in" onchange="DM._set('g',this.value)">${grades.map(g => `<option ${st.g === g ? 'selected' : ''}>${g}</option>`).join('')}</select>` + H.lab('Book a school tour') + H.days('d', st, 6, 2) +
        H.sum([['Registration fee', M(500)], ['Seat deposit (10%)', M(gf(st.g) * .1)], ['Term 1 fee', M(gf(st.g) / 3)]], M(500 + gf(st.g) * .1 + gf(st.g) / 3), 'Due on acceptance') + H.go('Enquire about admission', 'msg') + H.fine('Fees are paid to the school directly'),
      go: () => ({ title: 'Enquire about admission', rows: [['School', c.l.provider.name], ['Year group', st.g + ' · ' + A.intake[0]], ['Tour', fd(dayN(st.d))]], total: M(gf(st.g)), tl: 'Annual fee' })
    };
  });
  reg('course', c => {
    const A = c.A, st = c.st, fee = c.l.price;
    const cohorts = [14, 35, 63].map((d, i) => ({ id: i, t: 'Starts ' + fd(dayN(d)), s: A.schedule.map(s => ({ 'weekday-am': 'Weekday AM', 'weekday-pm': 'Weekday PM', weekend: 'Weekends' }[s])).join(' / ') + ' · ' + A.mode.join(' / '), p: '', tag: i === 0 ? (3 + Math.round(c.r() * 5)) + ' seats left' : '' }));
    Object.assign(st, { co: st.co ?? 0, pay: st.pay ?? 'full' });
    return {
      secs: [['Curriculum', H.tl(Array.from({ length: Math.min(6, A.weeks) }, (_, i) => ['Wk ' + Math.round(1 + i * A.weeks / Math.min(6, A.weeks)), ['Foundations', 'Core tools', 'Guided project', 'Advanced topics', 'Capstone project', 'Demo day & certificate'][i], '']))], ['Upcoming cohorts', live(c, 'co', () => H.opts('co', st, cohorts))],
        ['Outcomes', H.spec([['clock', 'Duration', A.weeks + ' weeks'], ['doc', 'Certificate', A.certificate ? 'Yes · KHDA attested' : 'Completion only'], ['globe', 'Language', A.language.join(', ')], ['users', 'Class size', 'Max 16']])]],
      bk: () => H.price(c.l, money(fee), '/course') + H.lab('Cohort') + H.seg('co', st, cohorts.map(x => [x.id, x.t.replace('Starts ', '')])) + H.lab('Payment') + H.seg('pay', st, [['full', 'Pay in full'], ['inst', '3 instalments']]) +
        H.sum(st.pay === 'inst' ? [['3 × ' + M(fee * 1.05 / 3), '']] : [['Early-bird (5%)', '−' + M(fee * .05)]], M(st.pay === 'inst' ? fee * 1.05 : fee * .95)) + H.go('Enquire to enrol', 'msg'),
      go: () => ({ title: 'Enquire to enrol', rows: [['Course', c.l.title], ['Cohort', cohorts[st.co].t], ['Payment', st.pay === 'inst' ? '3 instalments' : 'In full']], total: M(st.pay === 'inst' ? fee * 1.05 : fee * .95) })
    };
  });
  reg(['camp', 'academy'], c => {
    const A = c.A, st = c.st, pr = c.l.price, camp = c.l.cat === 'camp';
    Object.assign(st, { k: st.k ?? 1, pl: st.pl ?? (camp ? 'week' : 'term'), age: st.age ?? A.age[0] });
    const plans = camp ? [{ id: 'day', t: 'Daily drop-in', s: '08:30 – 14:30', m: 1 }, { id: 'week', t: '1 week (5 days)', s: 'Save 10%', m: 4.5, tag: 'Popular' }, { id: 'multi', t: '3 weeks', s: 'Save 20%', m: 12 }] : [{ id: 'trial', t: 'Trial session', s: 'Assessment & placement', m: A.assessment ? 0 : .08 }, { id: 'term', t: 'Full term (12 weeks)', s: '2 sessions / week', m: 1, tag: 'Popular' }, { id: 'year', t: 'Full year (3 terms)', s: 'Save 12%', m: 2.64 }];
    const sub = () => pr * sel(plans, st.pl).m * st.k * (st.k > 1 ? .9 : 1);
    return {
      secs: [[camp ? 'A day at camp' : 'Weekly schedule', camp ? H.tl([['08:30', 'Drop-off & warm-up', ''], ['09:00', A.activity + ' block 1', 'Coach-led'], ['10:30', 'Snack break', A.meals ? 'Included' : 'Bring your own'], ['11:00', A.activity + ' block 2', ''], ['12:30', 'Lunch', A.meals ? 'Hot lunch included' : ''], ['13:00', 'Free play & games', ''], ['14:30', 'Pick-up', A.transport ? 'Bus available' : '']]) :
        H.table(['Group', 'Days', 'Time', 'Coach ratio'], A.age.map((a, i) => [`<b>${a === 'adult' ? 'Adults' : a.replace('-', '–') + ' yrs'}</b>`, i % 2 ? 'Tue & Thu' : 'Mon & Wed', i % 2 ? '17:30–18:30' : '16:30–17:30', '1 : 8']))],
        ['Plans', live(c, 'pl', () => H.opts('pl', st, plans.map(p => ({ ...p, p: p.m ? M(pr * p.m) : 'Free' }))))],
        ['Safety & staff', H.chk([[1, 'Coaches background-checked'], [1, 'First-aid trained staff on site'], [!!A.equipment || !camp, 'Equipment provided'], [!!A.uniform, 'Uniform / kit included'], [1, 'Sibling discount 10%'], [!!A.transport, 'Transport available']])]],
      bk: () => H.price(c.l, money(pr), camp ? '/day' : '/term') + H.lab('Age group') + H.chips('age', st, A.age.map(a => [a, a === 'adult' ? 'Adults' : a.replace('-', '–') + ' yrs'])) + H.lab('Plan') + H.seg('pl', st, plans.map(p => [p.id, p.t.split(' (')[0]])) + H.step('k', st, st.k + ' child' + (st.k > 1 ? 'ren' : ''), 'Siblings save 10%', 1, 4) +
        H.sum([[sel(plans, st.pl).t + ' × ' + st.k, M(pr * sel(plans, st.pl).m * st.k)], st.k > 1 ? ['Sibling discount', '−' + M(pr * sel(plans, st.pl).m * st.k * .1)] : null], M(sub())) + H.go(camp ? 'Enquire to enrol' : 'Book an assessment', 'msg'),
      go: () => ({ title: camp ? 'Enquire to enrol' : 'Book an assessment', rows: [['Provider', c.l.provider.name], ['Plan', sel(plans, st.pl).t], ['Children', st.k + ''], ['Age', st.age]], total: M(sub()) })
    };
  });

  /* ======================= INSURANCE ======================= */
  function insMod(c, rows, tiers, fields) {
    const st = c.st, pr = c.l.price; st.tr = st.tr ?? 1;
    Object.entries(fields).forEach(([k, v]) => st[k] = st[k] ?? v[1][0][0]);
    const mult = () => Object.entries(fields).reduce((m, [k, v]) => m * (v[1].find(x => x[0] === st[k]) || [0, 0, 1])[2], 1);
    const p = () => Math.round(pr * tiers[st.tr][1] * mult() / 10) * 10;
    return {
      secs: [['Compare cover', H.table(['', ...tiers.map(t => t[0])], [...rows.map(r => [`<b>${r[0]}</b>`, ...r.slice(1).map(x => x === 1 ? H.yes : x === 0 ? H.no : x)]), { cls: 'tot', c: ['Annual premium', ...tiers.map(t => M(pr * t[1]))] }], 1)],
        ['How it works', H.tl([['1', 'Get a quote', 'Takes 2 minutes'], ['2', 'Upload documents', 'Emirates ID' + (c.l.cat === 'motor' ? ', licence, Mulkiya' : '')], ['3', 'Pay the insurer', 'Card or bank transfer'], ['4', 'Policy issued', 'Same day, by email']])]],
      bk: () => H.price(c.l, money(p()), '/year') + H.lab('Plan') + H.seg('tr', st, tiers.map((t, i) => [i, t[0]])) + Object.entries(fields).map(([k, [lab, opts]]) => H.lab(lab) + H.chips(k, st, opts.map(o => [o[0], o[1]]))).join('') +
        H.sum([['Base premium', M(p() / 1.05)], ['VAT 5%', M(p() - p() / 1.05)]], M(p()), 'Indicative premium') + H.go('Get exact quote', 'doc') + H.fine('Licensed by the Central Bank of the UAE'),
      go: () => ({ title: 'Get exact quote', rows: [['Insurer', c.l.provider.name], ['Plan', tiers[st.tr][0]], ...Object.entries(fields).map(([k, [lab, o]]) => [lab, o.find(x => x[0] === st[k])[1]])], total: M(p()), tl: 'Indicative premium' })
    };
  }
  reg('motor', c => insMod(c, [['Own damage', 0, 1, 1], ['Third-party liability', 'AED 3.5M', 'AED 3.5M', 'AED 5M'], ['Agency repair', 0, c.A.agency ? 1 : 0, 1], ['Roadside assistance', 0, 1, 1], ['Rent-a-car', 0, '7 days', '15 days'], ['Oman cover', 0, 0, 1], ['Excess', '—', 'AED ' + c.A.deductible, 'AED ' + c.A.deductible]],
    [['Third-party', .45], ['Comprehensive', 1], ['Comp + Agency', 1.35]], { car: ['Car value', [['50', 'Under 50K', .8], ['100', '50–100K', 1], ['200', '100–200K', 1.5], ['300', '200K+', 2.2]]], age: ['Driver age', [['25', '25–39', 1], ['18', '18–24', 1.6], ['40', '40+', .9]]] }));
  reg('health', c => insMod(c, [['Network', 'Basic', 'Enhanced', 'Premium'], ['Inpatient', 1, 1, 1], ['Outpatient co-pay', '20%', '10%', '0%'], ['Dental', 0, 'AED 2,000', 'AED 5,000'], ['Maternity', 0, 'AED 10,000', 'AED 25,000'], ['Area', 'UAE', 'UAE + ISC', 'Worldwide ex-US']],
    [['Essential', .55], ['Enhanced', 1], ['Premium', 1.9]], { who: ['Cover for', [['me', 'Just me', 1], ['cpl', 'Couple', 1.9], ['fam', 'Family of 4', 3.2]]], age: ['Age', [['31', '31–45', 1], ['18', '18–30', .8], ['46', '46–60', 1.6]]] }));
  reg('property', c => insMod(c, [['Contents', 'AED 100K', 'AED 250K', 'AED 500K'], ['Building', 0, 1, 1], ['Personal liability', 'AED 1M', 'AED 2M', 'AED 5M'], ['Accidental damage', 0, 1, 1], ['Alternative accommodation', 0, '3 months', '12 months'], ['Excess', 'AED ' + c.A.deductible, 'AED ' + c.A.deductible, 'AED 250']],
    [['Contents only', .6], ['Home & building', 1], ['Premium', 1.5]], { pt: ['Property', [['apt', 'Apartment', 1], ['vil', 'Villa', 1.6], ['off', 'Office', 1.3]]], val: ['Value', [['1', 'Up to 1M', 1], ['3', '1–3M', 1.7], ['10', '3M+', 2.6]]] }));

  DM._set = (k, v) => { const ctx = DM._ctx(); if (ctx) { ctx.st[k] = v; DM.rerender(); } };
})();
