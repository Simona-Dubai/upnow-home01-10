/* UpNow · Spaces marketplace data.
   One vertical (Spaces) → 9 categories. Every category declares its own search fields, filters,
   price basis, card spec line, lead form and next steps. Search bar, filter pills, drawer, matching,
   listing facts, lead forms and the provider workspace all read from these declarations.
   Filter sets researched against Bayut, Property Finder, Dubizzle (long-term), Airbnb / DTCM
   (holiday homes), Hire Space / Venuelook (venues), Playtomic (courts) and Dubai charter operators. */
(function () {
  let seed = 41;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const pickN = (a, n) => { const c = [...a], o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return o; };
  const between = (a, b, step = 1) => Math.round((a + rnd() * (b - a)) / step) * step;
  const chance = p => rnd() < p;
  const IMG = /provider-workspace\//.test(location.pathname) ? '../img/' : 'img/';
  const im = a => a.map(x => IMG + x + '.jpg');

  /* ---------- areas (x/y = position on the illustrative map) ---------- */
  const AREAS = [
    { id: 'dubai-marina', n: 'Dubai Marina', x: 15, y: 62 }, { id: 'jbr', n: 'JBR', x: 9, y: 57 }, { id: 'dubai-harbour', n: 'Dubai Harbour', x: 12, y: 50 },
    { id: 'jlt', n: 'JLT', x: 21, y: 69 }, { id: 'palm-jumeirah', n: 'Palm Jumeirah', x: 17, y: 38 }, { id: 'al-barsha', n: 'Al Barsha', x: 33, y: 58 },
    { id: 'barsha-heights', n: 'Barsha Heights', x: 27, y: 53 }, { id: 'jvc', n: 'JVC', x: 32, y: 79 }, { id: 'dubai-hills', n: 'Dubai Hills', x: 45, y: 66 },
    { id: 'arabian-ranches', n: 'Arabian Ranches', x: 45, y: 86 }, { id: 'al-quoz', n: 'Al Quoz', x: 44, y: 48 }, { id: 'meydan', n: 'Meydan', x: 58, y: 56 },
    { id: 'business-bay', n: 'Business Bay', x: 61, y: 43 }, { id: 'downtown', n: 'Downtown Dubai', x: 57, y: 36 }, { id: 'difc', n: 'DIFC', x: 64, y: 29 },
    { id: 'jumeirah', n: 'Jumeirah', x: 47, y: 24 }, { id: 'creek-harbour', n: 'Dubai Creek Harbour', x: 75, y: 35 }, { id: 'ras-al-khor', n: 'Ras Al Khor', x: 72, y: 50 },
    { id: 'deira', n: 'Deira', x: 81, y: 16 }, { id: 'al-qusais', n: 'Al Qusais', x: 90, y: 27 }, { id: 'mirdif', n: 'Mirdif', x: 92, y: 43 },
    { id: 'silicon-oasis', n: 'Dubai Silicon Oasis', x: 84, y: 70 }, { id: 'dip', n: 'Dubai Investments Park', x: 22, y: 86 }, { id: 'jafza', n: 'Jebel Ali Free Zone', x: 6, y: 78 },
    { id: 'dic', n: 'Dubai Industrial City', x: 30, y: 93 }, { id: 'dubai-south', n: 'Dubai South', x: 14, y: 95 }
  ];
  const areaById = Object.fromEntries(AREAS.map(a => [a.id, a]));
  const areaName = id => (areaById[id] || {}).n || id;
  const RES = ['dubai-marina', 'jbr', 'jlt', 'palm-jumeirah', 'al-barsha', 'barsha-heights', 'jvc', 'dubai-hills', 'business-bay', 'downtown', 'jumeirah', 'creek-harbour', 'meydan', 'silicon-oasis', 'mirdif'];
  const VILLA = ['arabian-ranches', 'dubai-hills', 'jumeirah', 'palm-jumeirah', 'mirdif', 'meydan', 'jvc'];
  const COM = ['business-bay', 'downtown', 'difc', 'jlt', 'barsha-heights', 'deira', 'al-barsha', 'jumeirah', 'dubai-marina', 'silicon-oasis'];
  const IND = ['al-quoz', 'dip', 'jafza', 'dic', 'al-qusais', 'ras-al-khor', 'dubai-south'];
  const LAND = ['dubai-south', 'jvc', 'meydan', 'dubai-hills', 'al-quoz', 'dip', 'dic', 'jafza', 'al-barsha'];
  const MARINAS = ['dubai-marina', 'dubai-marina', 'dubai-harbour', 'palm-jumeirah', 'creek-harbour'];
  const BLD = {
    'dubai-marina': ['Avenue Residence', 'Marina Gate', 'Cayan Tower', 'Sparkle Towers'], jbr: ['Rimal 3', 'Sadaf 5'], jlt: ['Cluster D', 'Lake Terrace', 'Almas Tower'],
    'palm-jumeirah': ['Shoreline', 'Oceana', 'Tiara Residences', 'Frond G'], 'al-barsha': ['Grand Horizon', 'Barsha Boulevard'], 'barsha-heights': ['Arjaan Tower', 'Two Towers'],
    jvc: ['Belgravia', 'Bloom Towers', 'District 12'], 'dubai-hills': ['Park Heights', 'Golf Place', 'Sidra'], 'arabian-ranches': ['Mirador', 'Saheel', 'Alvorada'],
    'business-bay': ['Executive Towers', 'Paramount', 'Bay Square'], downtown: ['Burj Vista', 'Boulevard Point', 'Act One'], difc: ['Index Tower', 'Sky Gardens', 'Gate Village'],
    jumeirah: ['City Walk', 'La Mer', 'Jumeirah 1'], 'creek-harbour': ['Creek Rise', 'Harbour Views'], deira: ['Al Rigga', 'Port Saeed'], mirdif: ['Uptown Mirdif', 'Ghoroob'],
    'silicon-oasis': ['Binghatti Stars', 'SIT Tower'], meydan: ['Azizi Riviera', 'Sobha Hartland'], 'al-quoz': ['Al Quoz Industrial 3', 'Al Khail Gate'],
    dip: ['DIP 2', 'Green Community'], jafza: ['JAFZA South', 'LOB 16'], dic: ['Saih Shuaib 2', 'Zone 5'], 'al-qusais': ['Al Qusais Industrial 4'], 'ras-al-khor': ['Ras Al Khor Industrial 2'],
    'dubai-south': ['Logistics District', 'Residential District'], 'dubai-harbour': ['Emaar Beachfront']
  };
  const phone = () => '+9715' + pick(['0', '2', '5', '6', '8']) + between(1000000, 9999999);
  const AGENTS = ['Tariq Hassan', 'Aisha Khan', 'Omar Nasser', 'Priya Sharma', 'Daniel Petrov', 'Fatima Al Mansoori', 'Rahul Mehta', 'Layla Haddad', 'Marco Rossi', 'Sara Farouk', 'Ahmed Karim'];
  const SLANGS = ['English', 'Arabic', 'Hindi', 'Russian', 'French'];
  const LANGS = [['English', 'Arabic'], ['English', 'Hindi', 'Urdu'], ['English', 'Russian'], ['English', 'Arabic', 'French'], ['English']];

  /* ---------- def builders ---------- */
  const o = arr => arr.map(x => Array.isArray(x) ? { v: String(x[0]), l: x[1] } : { v: String(x), l: String(x) });
  const sel = (id, label, opts, x = {}) => ({ id, type: 'select', label, options: o(opts), ...x });
  const mul = (id, label, opts, x = {}) => ({ id, type: 'multi', label, options: o(opts), ...x });
  const tog = (id, label, x = {}) => ({ id, type: 'toggle', label, ...x });
  const date = (id, label, x = {}) => ({ id, type: 'date', label, field: 'avail', ...x });
  const gte = (id, label, opts, gen, x = {}) => sel(id, label, opts, { test: (lv, v) => lv >= +v, gen, ...x });
  const lte = (id, label, opts, gen, x = {}) => sel(id, label, opts, { test: (lv, v) => lv <= +v, gen, ...x });
  const price = (label, presets) => ({ id: 'price', type: 'range', label, unit: 'AED', presets: typeof presets === 'function' ? presets : () => presets });
  const size = (label, field, presets) => ({ id: 'size', type: 'range', label, unit: 'sqft', field, presets: () => presets });
  const rating = () => sel('rating', 'Guest rating', [['4.5', '4.5★ & up'], ['4', '4★ & up']], { get: l => l.rating, test: (lv, v) => lv >= +v, nogen: 1 });
  const TIME = [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']];
  const lab = (def, v) => ((def.options || []).find(x => x.v === String(v)) || {}).l || v;
  const K = n => n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'K' : String(n);
  const sq = n => Math.round(n).toLocaleString() + ' sqft';
  const CHEQUES = gte('cheques', 'Cheques', [['1', '1 cheque'], ['2', '2+ cheques'], ['4', '4+ cheques'], ['6', '6+ cheques'], ['12', '12 cheques']], () => pick([1, 2, 4, 4, 6, 12]), { fmt: v => 'Up to ' + v + (v > 1 ? ' cheques' : ' cheque') });
  const ZONE = sel('zone', 'Licence zone', [['mainland', 'Mainland (DED)'], ['freezone', 'Free zone']]);

  /* common lead-form building blocks: [key, label, type, options] */
  const F = {
    movein: ['movein', 'Move-in date', 'date'], viewing: ['viewing', 'Viewing', 'seg', ['In person', 'Video call']],
    slot: ['slot', 'Preferred time', 'chips', ['Tomorrow AM', 'Tomorrow PM', 'This weekend', 'Next week']],
    company: ['company', 'Company name', 'text'], activity: ['activity', 'Business activity', 'text', 'e.g. General trading, e-commerce fulfilment'],
    licence: ['licence', 'Trade licence', 'seg', ['Mainland', 'Free zone', 'Not yet']], date: ['date', 'Date', 'date'],
    guests: ['guests', 'Guests', 'num']
  };

  /* ---------- CATEGORIES ---------- */
  const offers = [
    { id: 'residential', label: 'Residential', icon: 'home', h1: 'Residential properties for rent', short: 'Homes', basis: 'AED / year or month',
      hero: ['Find a home', 'you can trust.'], sub: 'Apartments, villas, townhouses and penthouses from DLD-permitted landlords and agents. Call, WhatsApp or request a viewing.',
      img: im(['apt1', 'apt2', 'apt3', 'apt4', 'loft1', 'villa1', 'villa3']), n: 20, people: 1, lease: 1, permit: 'DLD permit',
      action: 'Request a viewing', flow: ['Enquiry', 'Viewing', 'Offer & cheques', 'Ejari & contract', 'Move-in'], org: ['Greenstone Properties', 'Skyline Realty', 'Harbour & Co.', 'Private owner'],
      fields: ['loc', 'ptype', 'beds', 'price'], defaults: { term: 'yearly' },
      defs: [
        { id: 'term', type: 'seg', label: 'Rent frequency', options: o([['yearly', 'Yearly'], ['monthly', 'Monthly']]), required: 1, gen: () => chance(.4) ? ['yearly', 'monthly'] : ['yearly'], field: 'terms' },
        mul('ptype', 'Property type', [['apartment', 'Apartment'], ['villa', 'Villa'], ['townhouse', 'Townhouse'], ['penthouse', 'Penthouse'], ['duplex', 'Duplex'], ['hotel-apt', 'Hotel apartment']], { gen: () => pick(['apartment', 'apartment', 'apartment', 'apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'hotel-apt']) }),
        mul('beds', 'Bedrooms', [[0, 'Studio'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5+']], { gen: a => ['villa', 'townhouse'].includes(a.ptype) ? pick([3, 3, 4, 4, 5, 6]) : a.ptype === 'penthouse' ? pick([3, 4]) : pick([0, 1, 1, 2, 2, 2, 3]), test: (lv, v) => v.some(x => +x === 5 ? lv >= 5 : lv === +x) }),
        price('Rent', S => S && S.f.term === 'monthly' ? [[null, 8000], [8000, 15000], [15000, 30000], [30000, null]] : [[null, 80000], [80000, 150000], [150000, 300000], [300000, null]]),
        gte('baths', 'Bathrooms', [['1', '1+'], ['2', '2+'], ['3', '3+'], ['4', '4+']], null, { nogen: 1 }),
        size('Size', 'sqft', [[null, 800], [800, 1500], [1500, 3000], [3000, null]]),
        sel('furnishing', 'Furnishing', [['furnished', 'Furnished'], ['semi', 'Semi-furnished'], ['unfurnished', 'Unfurnished']]),
        CHEQUES, date('movein', 'Move-in date'),
        mul('amenities', 'Amenities', ['Balcony', 'Private pool', 'Shared pool', 'Gym', 'Covered parking', "Maid's room", 'Study', 'Built-in wardrobes', 'Central A/C', 'Pets allowed', 'Kids play area', '24h security', 'Concierge', 'Sea view', 'Burj view'], { all: 1, k: 7 }),
        tog('chiller', 'Chiller-free (A/C included)', { p: .35 }), tog('tour', 'Video / 360° tour', { p: .4 }),
        sel('listedBy', 'Listed by', [['agency', 'Agency'], ['owner', 'Owner']], { nogen: 1, get: l => l.provider.org === 'Private owner' ? 'owner' : 'agency' }),
        tog('verified', 'DLD permit verified', { p: .85 })
      ],
      locFn: a => ['villa', 'townhouse'].includes(a.ptype) ? pick(VILLA) : pick(RES),
      post: a => { a.baths = Math.max(1, Math.min(a.beds + (chance(.6) ? 1 : 0), 7)); a.sqft = a.beds === 0 ? between(400, 560, 10) : between(['villa', 'townhouse'].includes(a.ptype) ? 900 : 700, ['villa', 'townhouse'].includes(a.ptype) ? 1300 : 950, 10) * a.beds; },
      price: a => Math.round(([48000, 82000, 125000, 185000, 260000, 360000, 420000, 520000][Math.min(a.beds, 7)] * (a.ptype === 'penthouse' ? 1.9 : a.ptype === 'villa' ? 1.15 : 1) * (0.8 + rnd() * 0.5)) / 1000) * 1000,
      priceOf: (l, S) => S && S.f.term === 'monthly' ? Math.round(l.price * 1.3 / 12 / 100) * 100 : l.price,
      unit: (l, S) => S && S.f.term === 'monthly' ? '/month' : '/year',
      title: (a, c) => `${a.beds === 0 ? 'Studio' : a.beds + '-Bed'} ${lab(c.def('ptype'), a.ptype)}${a.amenities.includes('Sea view') ? ' with Sea View' : a.amenities.includes('Burj view') ? ' with Burj View' : a.amenities.includes('Private pool') ? ' · Private Pool' : a.furnishing === 'furnished' ? ' · Fully Furnished' : ' · Ready to Move'}`,
      spec: a => [a.beds === 0 ? 'Studio' : a.beds + ' Beds', a.baths + ' Baths', sq(a.sqft)],
      meta: a => [['bed', a.beds === 0 ? 'Studio' : a.beds + ' Bedrooms'], ['bath', a.baths + ' Bathrooms'], ['area', sq(a.sqft)], ['sofa', { furnished: 'Furnished', semi: 'Semi-furnished', unfurnished: 'Unfurnished' }[a.furnishing]]],
      form: [F.movein, ['occupants', 'Occupants', 'select', ['Just me', 'Couple', 'Family', 'Sharing']], ['cheques', 'Preferred cheques', 'select', ['1', '2', '4', '6', '12']], F.viewing, F.slot] },

    { id: 'commercial', label: 'Commercial', icon: 'building', h1: 'Commercial properties for rent', short: 'Offices & retail', basis: 'AED / year · per sqft',
      hero: ['Space to', 'grow your business.'], sub: 'Offices, retail, showrooms, clinics and co-working in mainland and free zones. Compare size, fit-out and price per sqft.',
      img: im(['office1', 'office2', 'office3', 'office4', 'office5', 'lobby1', 'retail1']), n: 14, people: 1, lease: 1, permit: 'DLD permit', perSqft: 1,
      action: 'Request a viewing', flow: ['Enquiry', 'Site visit', 'Heads of terms', 'Lease & Ejari', 'Fit-out & handover'], org: ['Greenstone Properties', 'Cavendish Commercial', 'Core Savills', 'Private landlord'],
      fields: ['loc', 'ctype', 'size', 'price'],
      defs: [
        mul('ctype', 'Property type', [['office', 'Office'], ['retail', 'Retail / shop'], ['showroom', 'Showroom'], ['coworking', 'Co-working / desk'], ['bcentre', 'Business centre'], ['fnb', 'Restaurant / F&B'], ['clinic', 'Clinic / medical']], { gen: () => pick(['office', 'office', 'office', 'retail', 'retail', 'showroom', 'coworking', 'bcentre', 'fnb', 'clinic']) }),
        size('Size', 'sqft', [[null, 1000], [1000, 3000], [3000, 10000], [10000, null]]),
        price('Annual rent', [[null, 100000], [100000, 250000], [250000, 600000], [600000, null]]),
        sel('fitting', 'Fit-out', [['fitted', 'Fitted'], ['semi', 'Semi-fitted'], ['shell', 'Shell & core'], ['furnished', 'Furnished']]),
        ZONE,
        gte('parking', 'Parking spaces', [['1', '1+'], ['3', '3+'], ['5', '5+'], ['10', '10+']], () => pick([0, 1, 2, 3, 4, 6, 10, 15]), { field: 'parkingSpaces', fmt: v => v + ' spaces' }),
        sel('grade', 'Building grade', [['A', 'Grade A'], ['B', 'Grade B']]),
        sel('washroom', 'Washroom', [['private', 'Private'], ['shared', 'Shared']]),
        tog('pantry', 'Pantry / kitchenette'), tog('frontage', 'Street-facing / frontage', { p: .35 }), tog('dewa', 'Separate DEWA meter', { p: .6 }),
        CHEQUES, date('movein', 'Available from'), tog('verified', 'DLD permit verified', { p: .85 })
      ],
      locFn: () => pick(COM),
      post: a => { a.sqft = a.ctype === 'coworking' ? between(120, 600, 10) : a.ctype === 'showroom' ? between(3000, 12000, 100) : between(650, 8000, 50); },
      price: a => Math.round(a.sqft * between(85, 240) * (a.ctype === 'retail' ? 1.4 : 1) / 1000) * 1000,
      unit: () => '/year',
      title: (a, c) => `${lab(c.def('fitting'), a.fitting)} ${lab(c.def('ctype'), a.ctype)}${a.frontage ? ' · Street Frontage' : a.grade === 'A' ? ' · Grade A Tower' : a.zone === 'freezone' ? ' · Free Zone Licence' : ''}`,
      spec: (a, l, c) => [lab(c.def('ctype'), a.ctype).split(' /')[0], sq(a.sqft), lab(c.def('fitting'), a.fitting)],
      meta: (a, l, c) => [['building', lab(c.def('ctype'), a.ctype)], ['area', sq(a.sqft)], ['tool', lab(c.def('fitting'), a.fitting)], ['car', a.parkingSpaces + ' parking']],
      form: [F.company, F.activity, F.licence, ['size', 'Size needed (sqft)', 'text', 'e.g. 1,500'], F.movein, F.slot] },

    { id: 'industrial', label: 'Industrial', icon: 'factory', h1: 'Warehouses & industrial for rent', short: 'Warehouses', basis: 'AED / year · per sqft',
      hero: ['Warehouses that', 'work as hard as you.'], sub: 'Warehouses, factories, workshops, cold storage and staff accommodation in Al Quoz, DIP, JAFZA and DIC. Filter by power, height and loading.',
      img: im(['wh2', 'wh3', 'wh4', 'wh1', 'workshop2']), n: 11, people: 1, lease: 1, permit: 'DLD permit', perSqft: 1, locs: IND,
      action: 'Request a site visit', flow: ['Enquiry', 'Site visit', 'Offer', 'Lease & Ejari', 'Handover'], org: ['Greenstone Properties', 'Gulf Industrial Realty', 'JAFZA Leasing', 'Private landlord'],
      fields: ['loc', 'itype', 'size', 'price'],
      defs: [
        mul('itype', 'Property type', [['warehouse', 'Warehouse'], ['factory', 'Factory'], ['workshop', 'Workshop'], ['cold', 'Cold storage'], ['staff', 'Staff accommodation'], ['yard', 'Open yard'], ['storage', 'Storage unit']], { gen: () => pick(['warehouse', 'warehouse', 'warehouse', 'factory', 'workshop', 'cold', 'staff', 'yard', 'storage']) }),
        size('Size (BUA)', 'sqft', [[null, 5000], [5000, 20000], [20000, 50000], [50000, null]]),
        price('Annual rent', [[null, 150000], [150000, 400000], [400000, 1000000], [1000000, null]]),
        gte('power', 'Power load', [['50', '50 kW+'], ['100', '100 kW+'], ['200', '200 kW+'], ['500', '500 kW+']], () => pick([40, 60, 100, 150, 250, 400, 600]), { field: 'powerKw', fmt: v => v + ' kW' }),
        gte('height', 'Clear height', [['6', '6 m+'], ['8', '8 m+'], ['10', '10 m+'], ['12', '12 m+']], () => pick([5, 6, 8, 9, 10, 12, 14]), { field: 'heightM', fmt: v => v + ' m' }),
        gte('docks', 'Loading docks', [['1', '1+'], ['2', '2+'], ['4', '4+']], () => pick([0, 1, 1, 2, 3, 4, 6]), { fmt: v => v + ' docks' }),
        ZONE, tog('office', 'Office space included', { p: .6 }), tog('civil', 'Civil Defence approved', { p: .75 }), tog('ramp', 'Ramp / grade-level door', { p: .5 }),
        CHEQUES, date('movein', 'Available from'), tog('verified', 'DLD permit verified', { p: .85 })
      ],
      post: a => { a.sqft = a.itype === 'storage' ? between(100, 800, 10) : a.itype === 'yard' ? between(10000, 60000, 500) : between(3500, 60000, 500); if (a.itype === 'staff') a.rooms = between(20, 120, 5); },
      price: a => Math.round(a.sqft * between(22, 48) * (a.itype === 'cold' ? 1.6 : a.itype === 'storage' ? 4 : 1) / 1000) * 1000,
      unit: () => '/year',
      title: (a, c) => `${lab(c.def('itype'), a.itype)}${a.itype === 'staff' ? ' · ' + a.rooms + ' Rooms' : a.heightM >= 10 ? ' · ' + a.heightM + ' m Clear Height' : a.powerKw >= 200 ? ' · ' + a.powerKw + ' kW Power' : a.docks >= 2 ? ' · ' + a.docks + ' Loading Docks' : a.office ? ' with Office' : ''}`,
      spec: (a, l, c) => [lab(c.def('itype'), a.itype), sq(a.sqft), a.powerKw + ' kW'],
      meta: (a, l, c) => [['factory', lab(c.def('itype'), a.itype)], ['area', sq(a.sqft)], ['bolt', a.powerKw + ' kW power'], ['ruler', a.heightM + ' m clear height']],
      form: [F.company, F.activity, F.licence, ['power', 'Power needed', 'select', ['Under 50 kW', '50–200 kW', '200 kW+']], F.movein, F.slot] },

    { id: 'land', label: 'Land', icon: 'plot', h1: 'Land & plots for lease', short: 'Plots', basis: 'AED / year',
      hero: ['Build on', 'the right plot.'], sub: 'Residential, commercial, industrial and mixed-use plots for long-term lease. Check zoning, permitted height and utilities before you enquire.',
      img: im(['aerial1', 'desert1', 'aerial2']), n: 9, people: 1, lease: 1, permit: 'DLD permit', perSqft: 1, locs: LAND,
      action: 'Enquire about plot', flow: ['Enquiry', 'Site visit', 'Due diligence', 'Land lease agreement', 'Handover'], org: ['Greenstone Properties', 'Dubai South Properties', 'Private owner'],
      fields: ['loc', 'landuse', 'size', 'price'],
      defs: [
        mul('landuse', 'Land use', [['residential', 'Residential'], ['commercial', 'Commercial'], ['industrial', 'Industrial'], ['mixed', 'Mixed-use'], ['agricultural', 'Agricultural']], { gen: () => pick(['residential', 'commercial', 'industrial', 'industrial', 'mixed']) }),
        size('Plot size', 'sqft', [[null, 10000], [10000, 50000], [50000, 150000], [150000, null]]),
        price('Annual lease', [[null, 250000], [250000, 750000], [750000, null]]),
        sel('height', 'Permitted height', [['G+1', 'G+1'], ['G+4', 'G+4'], ['G+10', 'G+10'], ['G+20', 'G+20+']]),
        gte('term', 'Lease term', [['5', '5 yrs+'], ['10', '10 yrs+'], ['20', '20 yrs+'], ['30', '30 yrs+']], () => pick([3, 5, 10, 15, 25, 30]), { field: 'termYrs', fmt: v => v + ' years' }),
        sel('tenure', 'Tenure', [['freehold', 'Freehold'], ['leasehold', 'Leasehold']]),
        tog('utilities', 'Utilities connected', { p: .6 }), tog('corner', 'Corner plot', { p: .3 }), tog('road', 'Main road access', { p: .5 }),
        tog('verified', 'DLD permit verified', { p: .85 })
      ],
      post: a => { a.sqft = between(6000, 220000, 500); a.gfa = Math.round(a.sqft * ({ 'G+1': 1.2, 'G+4': 2.5, 'G+10': 4.5, 'G+20': 7 }[a.height]) / 100) * 100; },
      price: a => Math.round(a.sqft * between(4, 11) / 1000) * 1000,
      unit: () => '/year',
      title: (a, c) => `${lab(c.def('landuse'), a.landuse)} Plot · ${a.height} Permitted${a.corner ? ' · Corner' : ''}`,
      spec: (a, l, c) => [lab(c.def('landuse'), a.landuse) + ' plot', sq(a.sqft), a.height],
      meta: (a, l, c) => [['plot', lab(c.def('landuse'), a.landuse)], ['area', sq(a.sqft) + ' plot'], ['layers', 'GFA ' + sq(a.gfa)], ['building', a.height + ' permitted']],
      form: [F.company, ['use', 'Intended use', 'text', 'e.g. Logistics hub, residential G+4'], ['termWanted', 'Lease term wanted', 'select', ['5 years', '10 years', '20 years', '30 years']], F.slot] },

    { id: 'mixed', label: 'Mixed-use', icon: 'layers', h1: 'Mixed-use buildings for lease', short: 'Buildings', basis: 'AED / year',
      hero: ['Whole buildings,', 'one conversation.'], sub: 'Residential-over-retail, office-and-retail and full buildings for bulk or master lease. See units, floors, occupancy and income details.',
      img: im(['apt4', 'lobby1', 'retail1', 'office4']), n: 7, people: 1, lease: 1, permit: 'DLD permit',
      action: 'Request a viewing', flow: ['Enquiry', 'Site visit', 'Offer', 'Master lease & Ejari', 'Handover'], org: ['Greenstone Properties', 'Asteco Commercial', 'Private owner'],
      fields: ['loc', 'mtype', 'units', 'price'],
      defs: [
        mul('mtype', 'Building type', [['resi-retail', 'Residential + retail'], ['office-retail', 'Office + retail'], ['whole', 'Whole residential building'], ['hotel-retail', 'Hotel apartments + retail']], { gen: () => pick(['resi-retail', 'resi-retail', 'office-retail', 'whole', 'hotel-retail']) }),
        gte('units', 'Units', [['10', '10+'], ['25', '25+'], ['50', '50+'], ['100', '100+']], () => pick([12, 18, 24, 36, 48, 64, 90, 120]), { fmt: v => v + ' units' }),
        price('Annual rent', [[null, 1500000], [1500000, 4000000], [4000000, null]]),
        size('Built-up area', 'sqft', [[null, 30000], [30000, 80000], [80000, null]]),
        gte('floors', 'Floors', [['4', 'G+4+'], ['8', 'G+8+'], ['15', 'G+15+']], () => pick([3, 4, 6, 8, 12, 16, 22]), { fmt: v => 'G+' + v }),
        sel('occupancy', 'Occupancy', [['vacant', 'Vacant'], ['partial', 'Partly tenanted'], ['full', 'Fully tenanted']]),
        tog('parking', 'Basement parking', { p: .7 }), tog('retailUnits', 'Ground-floor retail', { p: .7 }), tog('verified', 'DLD permit verified', { p: .85 })
      ],
      locFn: () => pick(['jvc', 'al-barsha', 'deira', 'silicon-oasis', 'business-bay', 'al-qusais', 'meydan']),
      post: a => { a.sqft = a.units * between(800, 1200, 10); },
      price: a => Math.round(a.units * between(38000, 65000) / 10000) * 10000,
      unit: () => '/year',
      title: (a, c) => `${lab(c.def('mtype'), a.mtype)} Building · ${a.units} Units`,
      spec: a => [a.units + ' units', 'G+' + a.floors, sq(a.sqft)],
      meta: (a, l, c) => [['layers', lab(c.def('mtype'), a.mtype)], ['building', a.units + ' units · G+' + a.floors], ['area', sq(a.sqft) + ' BUA'], ['users', lab(c.def('occupancy'), a.occupancy)]],
      form: [F.company, ['use', 'Intended use', 'select', ['Master lease / bulk rent', 'Staff housing', 'Serviced apartments', 'Owner-occupier']], F.movein, F.slot] },

    { id: 'holiday', label: 'Holiday homes', icon: 'sun', h1: 'Holiday homes', short: 'Short stays', basis: 'AED / night',
      hero: ['Stay like', 'you live here.'], sub: 'DTCM-licensed holiday homes by the night. Ask the host about dates, early check-in or long stays — then pay the host directly.',
      img: im(['hotel1', 'hotel2', 'villa1', 'apt2', 'villa3']), n: 12, permit: 'DTCM permit',
      action: 'Check availability', flow: ['Enquiry', 'Host confirms dates', 'Pay host directly', 'Check-in', 'Review'], org: ['Silkhaus', 'Frank Porter', 'Greenstone Stays', 'Private host'], people: 1,
      fields: ['loc', 'checkin', 'checkout', 'guests'], locLabel: 'Destination',
      defs: [
        date('checkin', 'Check-in'), date('checkout', 'Check-out', { noMatch: 1 }),
        gte('guests', 'Guests', [['2', '1–2 guests'], ['4', '3–4 guests'], ['6', '5–6 guests'], ['8', '7+ guests']], () => pick([2, 4, 4, 6, 8, 10]), { field: 'maxGuests', fmt: v => 'Up to ' + v }),
        sel('ptype', 'Property type', [['apartment', 'Apartment'], ['studio', 'Studio'], ['villa', 'Villa'], ['penthouse', 'Penthouse']]),
        sel('beds', 'Bedrooms', [['0', 'Studio'], ['1', '1'], ['2', '2'], ['3', '3+']], { gen: a => a.ptype === 'studio' ? '0' : a.ptype === 'villa' ? '3' : pick(['1', '1', '2', '3']) }),
        price('Price per night', [[null, 400], [400, 800], [800, 1500], [1500, null]]),
        mul('amenities', 'Amenities', ['Private pool', 'Beach access', 'Fast Wi-Fi', 'Full kitchen', 'Free parking', 'Sea view', 'Self check-in', 'Washer'], { all: 1, k: 5 }),
        lte('minNights', 'Minimum stay', [['1', '1 night'], ['2', 'Up to 2 nights'], ['3', 'Up to 3 nights']], () => pick([1, 1, 2, 3, 5]), { fmt: v => v + (v > 1 ? ' nights' : ' night') + ' minimum' }),
        sel('cancellation', 'Cancellation', [['free', 'Free cancellation'], ['moderate', 'Moderate'], ['strict', 'Strict']]),
        rating(), tog('verified', 'DTCM permit verified', { p: .85 })
      ],
      locFn: () => pick(['dubai-marina', 'jbr', 'palm-jumeirah', 'downtown', 'business-bay', 'dubai-hills', 'creek-harbour', 'dubai-harbour']),
      price: a => between(260, 480, 10) * (a.ptype === 'villa' ? 3 : a.ptype === 'penthouse' ? 2.2 : 1) * (+a.beds || 1) / (+a.beds > 1 ? 1.4 : 1),
      unit: () => '/night',
      title: (a, c) => `${pick(['Cosy', 'Stylish', 'Bright', 'Designer', 'Luxury'])} ${lab(c.def('ptype'), a.ptype)} ${a.amenities.includes('Sea view') ? 'with Sea View' : a.amenities.includes('Beach access') ? 'by the Beach' : a.amenities.includes('Private pool') ? 'with Private Pool' : 'in ' + c.areaN}`,
      spec: (a, l, c) => [a.beds === '0' ? 'Studio' : a.beds + ' BR', 'Up to ' + a.maxGuests + ' guests', lab(c.def('ptype'), a.ptype)],
      meta: (a, l, c) => [['bed', a.beds === '0' ? 'Studio' : a.beds + ' bedrooms'], ['users', 'Up to ' + a.maxGuests + ' guests'], ['moon', a.minNights + ' night min.'], ['star', l.rating + ' (' + l.reviews + ')']],
      form: [['checkin', 'Check-in', 'date'], ['checkout', 'Check-out', 'date'], ['adults', 'Adults', 'num'], ['children', 'Children', 'num'], ['purpose', 'Trip type', 'select', ['Holiday', 'Business', 'Family visit', 'Relocation stay']]] },

    { id: 'venue', label: 'Venues', icon: 'party', h1: 'Event venues', short: 'Events', basis: 'AED / hour or day',
      hero: ['A venue for', 'every occasion.'], sub: 'Ballrooms, rooftops, meeting rooms, gardens and studios. Share your date and guest count and get a quote from the venue team.',
      img: im(['venue1', 'venue2', 'office1', 'lobby1']), n: 10, permit: 'Trade licence',
      action: 'Request a quote', flow: ['Enquiry', 'Quote', 'Site visit', 'Deposit to venue', 'Event day'], org: ['Venue team'], names: ['The Grand Ballroom', 'Skyline Rooftop', 'Marina Terrace', 'The Loft Studio', 'Palm Garden Lawn', 'Boardroom 21', 'Sunset Deck', 'Atelier Hall'],
      fields: ['loc', 'eventType', 'date', 'guests'],
      defs: [
        mul('eventType', 'Event type', [['wedding', 'Wedding'], ['corporate', 'Corporate event'], ['birthday', 'Birthday / private party'], ['conference', 'Conference / meeting'], ['launch', 'Product launch'], ['shoot', 'Photo / film shoot']], { k: 4 }),
        date('date', 'Date'),
        gte('guests', 'Guests', [['20', 'Up to 20'], ['50', '21–50'], ['100', '51–100'], ['200', '101–200'], ['400', '200+']], () => pick([20, 40, 60, 120, 250, 400]), { field: 'capacity', fmt: v => v + ' guests' }),
        sel('time', 'Time', [...TIME, ['fullday', 'Full day']], { many: 1, field: 'slots' }),
        sel('venueType', 'Venue type', [['ballroom', 'Ballroom'], ['rooftop', 'Rooftop'], ['meeting', 'Meeting room'], ['garden', 'Garden & outdoor'], ['studio', 'Studio / loft'], ['restaurant', 'Restaurant / private dining']]),
        sel('setting', 'Indoor / outdoor', [['indoor', 'Indoor'], ['outdoor', 'Outdoor'], ['both', 'Indoor & outdoor']]),
        sel('catering', 'Catering', [['inhouse', 'In-house catering'], ['outside', 'Outside catering allowed'], ['none', 'No catering']]),
        mul('equipment', 'Equipment', ['AV & screen', 'Sound system', 'Stage', 'Lighting rig', 'Wi-Fi', 'Dance floor'], { all: 1, k: 4 }),
        sel('parking', 'Parking', [['valet', 'Valet'], ['free', 'Free parking'], ['paid', 'Paid nearby']]),
        price('Price per hour', [[null, 800], [800, 2000], [2000, null]]), tog('verified', 'Verified venues only', { p: .85 })
      ],
      locFn: () => pick(['dubai-marina', 'downtown', 'business-bay', 'palm-jumeirah', 'jumeirah', 'al-quoz', 'difc', 'creek-harbour']),
      price: a => Math.round(a.capacity * between(9, 16) / 50) * 50 + 300, unit: () => '/hour',
      title: (a, c) => c.name + ' · ' + lab(c.def('venueType'), a.venueType),
      spec: (a, l, c) => ['Up to ' + a.capacity + ' guests', lab(c.def('venueType'), a.venueType).split(' /')[0], lab(c.def('setting'), a.setting)],
      meta: (a, l, c) => [['users', 'Up to ' + a.capacity + ' guests'], ['party', lab(c.def('venueType'), a.venueType)], ['sun', lab(c.def('setting'), a.setting)], ['tool', { inhouse: 'In-house catering', outside: 'Outside catering', none: 'Dry hire' }[a.catering]]],
      form: [['eventType', 'Event type', 'select', ['Wedding', 'Corporate event', 'Birthday / private party', 'Conference / meeting', 'Product launch', 'Photo / film shoot']], F.date, ['time', 'Time', 'select', ['Morning', 'Afternoon', 'Evening', 'Full day']], F.guests, ['budget', 'Budget (AED)', 'text', 'e.g. 15,000'], ['cateringNeeded', 'Catering', 'seg', ['Needed', 'Not needed']]] },

    { id: 'court', label: 'Sports courts', icon: 'racket', h1: 'Sports courts & pitches', short: 'Padel & pitches', basis: 'AED / hour',
      hero: ['Your next game', 'starts here.'], sub: 'Padel, tennis, football, basketball and pickleball courts. Pick a date and time, then confirm the slot with the club.',
      img: im(['padel1', 'padel2', 'fit1']), n: 11, permit: 'Trade licence',
      action: 'Check slot availability', flow: ['Enquiry', 'Slot confirmed', 'Pay at venue', 'Play', 'Review'], org: ['Club operator'], names: ['Padel Pro Club', 'Just Padel', 'Smash Arena', 'Palm Padel', 'Kick-off Arena', 'Court 360', 'Goal Zone', 'Rally Club'],
      fields: ['loc', 'sport', 'date', 'time'],
      defs: [
        mul('sport', 'Sport', [['padel', 'Padel'], ['tennis', 'Tennis'], ['football5', '5-a-side football'], ['football7', '7-a-side football'], ['basketball', 'Basketball'], ['pickleball', 'Pickleball'], ['badminton', 'Badminton']], { gen: () => pick(['padel', 'padel', 'padel', 'tennis', 'football5', 'football7', 'basketball', 'pickleball', 'badminton']) }),
        date('date', 'Date'), sel('time', 'Time', [...TIME, ['late', 'Late night']], { many: 1, field: 'slots' }),
        sel('setting', 'Indoor / outdoor', [['indoor', 'Indoor (A/C)'], ['outdoor', 'Outdoor']]),
        gte('courts', 'Courts on site', [['2', '2+'], ['4', '4+'], ['8', '8+']], () => pick([1, 2, 3, 4, 6, 8, 10]), { fmt: v => v + ' courts' }),
        mul('amenities', 'Amenities', ['Racket / ball rental', 'Changing rooms', 'Showers', 'Floodlights', 'Coaching', 'Café', 'Parking'], { all: 1, k: 5 }),
        rating(), price('Price per hour', [[null, 200], [200, 350], [350, null]]), tog('verified', 'Verified clubs only', { p: .85 })
      ],
      locFn: () => pick(['al-quoz', 'jlt', 'dubai-hills', 'business-bay', 'palm-jumeirah', 'jvc', 'al-barsha', 'silicon-oasis', 'mirdif']),
      price: a => between(150, 300, 10) + (a.setting === 'indoor' ? 80 : 0) + (/football/.test(a.sport) ? 180 : 0), unit: () => '/hour',
      title: (a, c) => `${c.name} · ${a.setting === 'indoor' ? 'Indoor' : 'Outdoor'} ${lab(c.def('sport'), a.sport).replace(' football', ' Pitch').replace(/^(\w)/, m => m.toUpperCase())}${/football/.test(a.sport) ? '' : ' Court'}`,
      spec: (a, l, c) => [lab(c.def('sport'), a.sport), a.setting === 'indoor' ? 'Indoor' : 'Outdoor', a.courts + (a.courts > 1 ? ' courts' : ' court')],
      meta: (a, l, c) => [['racket', lab(c.def('sport'), a.sport)], ['sun', a.setting === 'indoor' ? 'Indoor · A/C' : 'Outdoor · floodlit'], ['grid4', a.courts + ' courts'], ['star', l.rating + ' (' + l.reviews + ')']],
      form: [F.date, ['time', 'Start time', 'chips', ['7:00', '9:00', '17:00', '19:00', '21:00']], ['duration', 'Duration', 'seg', ['60 min', '90 min', '120 min']], ['players', 'Players', 'num'], ['recurring', 'Recurring booking', 'seg', ['One-off', 'Weekly']]] },

    { id: 'yacht', label: 'Yachts', icon: 'boat', h1: 'Yacht charters', short: 'Charters', basis: 'AED / hour or day',
      hero: ['Out on the water', 'by this afternoon.'], sub: 'Crewed yacht and catamaran charters from licensed operators in Dubai Marina, Dubai Harbour and the Palm.',
      img: im(['yacht1', 'yacht2']), n: 10, locs: MARINAS, locLabel: 'Marina', permit: 'Maritime licence',
      action: 'Check availability', flow: ['Enquiry', 'Deposit to operator', 'Guest list', 'Trip', 'Settlement'], org: ['Charter operator'], names: ['Xclusive Yachts', 'Marina Charters', 'Blue Lagoon Yachting', 'Seven Seas'],
      fields: ['loc', 'date', 'duration', 'guests'],
      defs: [
        date('date', 'Date'),
        lte('duration', 'Duration', [['2', '2 hours'], ['3', '3 hours'], ['4', '4 hours'], ['8', 'Full day']], () => pick([2, 2, 3, 4]), { field: 'minHours', fmt: v => v + ' hr minimum' }),
        gte('guests', 'Guests', [['6', 'Up to 6'], ['12', '7–12'], ['20', '13–20'], ['35', '20+']], null, { field: 'capacity', fmt: v => 'Up to ' + v }),
        gte('size', 'Yacht size', [['40', '40 ft+'], ['60', '60 ft+'], ['80', '80 ft+']], () => pick([36, 42, 50, 56, 65, 75, 88, 101]), { field: 'length', fmt: v => v + ' ft' }),
        sel('ytype', 'Boat type', [['motor', 'Motor yacht'], ['catamaran', 'Catamaran'], ['sailing', 'Sailing yacht'], ['speed', 'Speedboat']], { gen: () => pick(['motor', 'motor', 'motor', 'catamaran', 'sailing', 'speed']) }),
        sel('crew', 'Crew', [['captain', 'Captain only'], ['full', 'Captain, crew & host']]),
        mul('food', 'Food & drink', ['Soft drinks', 'BBQ onboard', 'Catering', 'Cake & décor'], { all: 1 }),
        mul('activities', 'Activities', ['Swimming stop', 'Fishing', 'Jet ski add-on', 'Water toys'], { all: 1 }),
        sel('cancellation', 'Cancellation', [['free', 'Free up to 48h'], ['moderate', '50% refund'], ['strict', 'Non-refundable']]),
        price('Price per hour', [[null, 700], [700, 1200], [1200, null]]), tog('verified', 'Licensed operators only', { p: .9 })
      ],
      post: a => { a.capacity = Math.round(a.length / 2.8); }, price: a => Math.round(a.length * between(11, 16) / 50) * 50, unit: () => '/hour',
      title: (a, c) => `${a.length} ft ${pick(['Majesty', 'Azimut', 'Sunseeker', 'Princess', 'Gulf Craft'])} · ${c.name}`,
      spec: (a, l, c) => [a.length + ' ft', 'Up to ' + a.capacity + ' guests', 'Min ' + a.minHours + ' hrs'],
      meta: (a, l, c) => [['ruler', a.length + ' ft ' + lab(c.def('ytype'), a.ytype).toLowerCase()], ['users', 'Up to ' + a.capacity + ' guests'], ['clock', 'Min ' + a.minHours + ' hours'], ['users', { captain: 'Captain only', full: 'Captain, crew & host' }[a.crew]]],
      form: [F.date, ['time', 'Departure', 'chips', ['Morning', 'Afternoon', 'Sunset', 'Night']], ['duration', 'Hours', 'select', ['2', '3', '4', '6', '8']], F.guests, ['occasion', 'Occasion', 'select', ['Leisure', 'Birthday', 'Proposal', 'Corporate', 'Photoshoot']]] }
  ];

  const V = { spaces: { id: 'spaces', label: 'Spaces', icon: 'building', blurb: 'Homes, offices, warehouses, land, holiday homes, venues, courts and yachts.', offers } };
  V.services = { id: 'services', label: 'Services', icon: 'wrench', blurb: 'Cleaning, AC, salons and clinics.', offers: [
    { id: 'cleaning', label: 'Cleaning', h1: 'Cleaning services', basis: 'AED / visit or contract', img: [IMG + 'clean1.jpg', IMG + 'clean2.jpg'], n: 10, coverage: 1, from: 1,
      action: 'Request a booking', flow: ['Enquiry', 'Slot confirmed', 'Visit', 'Photo evidence', 'Pay the provider'], org: ['DED-licensed company'], names: ['Sparkle Home Cleaning', 'Maids on Call', 'Fresh Nest', 'Shine & Co.', 'Neat Freaks DXB'],
      fields: ['service', 'loc', 'date', 'frequency'], locLabel: 'Location',
      defs: [
        sel('service', 'Service', ['Regular clean', 'Deep clean', 'Move-in / move-out', 'Sofa & carpet'], { many: 1 }), date('date', 'Date'),
        sel('frequency', 'Frequency', [['once', 'One-time'], ['weekly', 'Weekly'], ['biweekly', 'Every 2 weeks'], ['contract', 'Monthly contract']], { many: 1 }),
        sel('ptype', 'Property type', ['Apartment', 'Villa', 'Office'], { many: 1 }),
        gte('bedrooms', 'Bedrooms', [['1', 'Studio / 1'], ['2', '2'], ['3', '3'], ['5', '4–5+']], () => pick([3, 4, 5, 6]), { field: 'maxBeds', fmt: v => 'Up to ' + v + ' BR' }),
        tog('materials', 'Materials included'),
        gte('cleaners', 'Cleaners', [['1', '1 cleaner'], ['2', '2 cleaners'], ['3', 'Team of 3+']], () => pick([1, 2, 3, 4]), { field: 'team', fmt: v => 'Up to ' + v }),
        lte('duration', 'Duration', [['2', '2 hr minimum'], ['3', '3 hr minimum'], ['4', '4 hr minimum']], () => pick([2, 3, 4]), { field: 'minHours', fmt: v => v + ' hrs min' }),
        price('Price per hour', [[null, 40], [40, 55], [55, null]]), tog('verified', 'ID-verified only', { p: .85 })
      ],
      price: () => between(32, 65), unit: () => '/hour',
      title: (a, c) => `${a.service[0]} · ${c.name}`,
      meta: (a, l) => [['star', l.rating + ' (' + l.reviews + ')'], ['users', 'Team of ' + a.team], ['clock', a.minHours + ' hrs min']] },

    { id: 'ac', label: 'AC maintenance', h1: 'AC maintenance', basis: 'One-time or AED / year', img: [IMG + 'ac1.jpg', IMG + 'ac2.jpg'], n: 9, coverage: 1, from: 1,
      action: 'Request a quote', flow: ['Enquiry', 'Assessment', 'Quote', 'Work order', 'Completion'], org: ['DED-licensed company'], names: ['CoolFix Technical', 'Polar AC', 'Breeze HVAC', 'Chill Masters'],
      fields: ['model', 'property', 'units', 'date'],
      defs: [
        sel('model', 'Service model', [['once', 'One-time service'], ['annual', 'Annual contract (AMC)']], { many: 1 }),
        sel('property', 'Property', ['Apartment', 'Villa', 'Office'], { many: 1 }),
        gte('units', 'Units', [['1', '1 unit'], ['3', '2–3 units'], ['6', '4–6 units'], ['10', '7+ units']], () => pick([4, 6, 10, 20]), { field: 'maxUnits', fmt: v => 'Up to ' + v }),
        date('date', 'Preferred date'),
        mul('acType', 'AC type', ['Split', 'Ducted / central', 'Window', 'Cassette'], { k: 4 }),
        tog('emergency', '24/7 emergency'),
        gte('visits', 'Visits included', [['2', '2+ per year'], ['3', '3+ per year'], ['4', '4+ per year']], () => pick([2, 3, 4]), { fmt: v => v + ' visits / year' }),
        sel('parts', 'Parts', [['included', 'Parts included'], ['extra', 'Parts charged extra']]),
        lte('sla', 'Response SLA', [['4', 'Within 4 hrs'], ['24', 'Within 24 hrs'], ['48', 'Within 48 hrs']], () => pick([4, 24, 24, 48]), { fmt: v => v + ' hrs' }),
        price('Starting price', [[null, 150], [150, 300], [300, null]]), tog('verified', 'Licensed only', { p: .85 })
      ],
      price: () => between(99, 380, 10), unit: (l, S) => S && S.f.model === 'annual' ? '/unit / year' : '/unit',
      priceOf: (l, S) => S && S.f.model === 'annual' ? l.price * 3 : l.price,
      title: (a, c) => `AC ${a.model.includes('annual') ? 'annual contract' : 'servicing & repair'} · ${c.name}`,
      meta: a => [['clock', a.sla + 'h response'], ['tool', a.acType.slice(0, 2).join(', ')], ['check', a.visits + ' visits/yr']] },

    { id: 'haircut', label: 'Haircut', h1: 'Haircuts & salons', basis: 'AED / appointment', img: [IMG + 'salon1.jpg', IMG + 'salon2.jpg'], n: 9, from: 1,
      action: 'Request an appointment', flow: ['Enquiry', 'Confirmation', 'Appointment', 'Pay at salon', 'Review'], org: ['Salon'], names: ['Tips & Toes', 'The Barber Shop', 'Blow Bar', 'Ivy Salon', 'Gents Grooming'],
      fields: ['treatment', 'loc', 'date', 'time'],
      defs: [
        sel('treatment', 'Treatment', ["Men's cut", "Women's cut & style", 'Colour', 'Blow-dry', 'Kids cut', 'Beard trim'], { many: 1 }),
        date('date', 'Date'), sel('time', 'Time', TIME, { many: 1, field: 'slots' }),
        sel('setting', 'At home / salon', [['salon', 'In salon'], ['home', 'At home']], { many: 1 }),
        sel('pro', 'Professional', [['male', 'Male stylist'], ['female', 'Female stylist']], { many: 1 }),
        lte('duration', 'Duration', [['30', 'Up to 30 min'], ['45', 'Up to 45 min'], ['60', 'Up to 60 min']], () => pick([30, 45, 60, 90]), { fmt: v => v + ' min' }),
        rating(), price('Price', [[null, 100], [100, 200], [200, null]]), tog('verified', 'Verified only', { p: .85 })
      ],
      price: () => between(60, 260, 5), unit: () => '/appointment',
      title: (a, c) => `${a.treatment[0]} · ${c.name}`,
      meta: (a, l) => [['clock', a.duration + ' min'], ['pin', a.setting.includes('home') ? 'Home visit' : 'In salon'], ['star', l.rating + ' (' + l.reviews + ')']] },

    { id: 'dentist', label: 'Dentist', h1: 'Dentists', basis: 'AED / consultation', img: [IMG + 'dental1.jpg', IMG + 'dental2.jpg'], n: 9, from: 1,
      action: 'Request an appointment', flow: ['Enquiry', 'Appointment', 'Patient form', 'Consultation', 'Treatment plan'], org: ['DHA-licensed clinic'], names: ['Bright Smile Dental', 'Versailles Dental', 'Dr. Michael\'s', 'Seven Dental', 'Smile Studio'],
      fields: ['treatment', 'loc', 'date', 'time'], locLabel: 'Area',
      defs: [
        sel('treatment', 'Treatment', ['Check-up & cleaning', 'Whitening', 'Aligners & braces', 'Implants', 'Root canal', 'Kids dentistry'], { many: 1, k: 4 }),
        date('date', 'Date'), sel('time', 'Time', TIME, { many: 1, field: 'slots' }),
        sel('clinic', 'Clinic', [['specialist', 'Specialist centre'], ['family', 'Family clinic'], ['hospital', 'Hospital department']]),
        mul('insurance', 'Insurance', ['Daman', 'AXA', 'Bupa', 'MetLife', 'Cigna', 'Direct billing'], { k: 4 }),
        mul('language', 'Language', SLANGS, { gen: () => ['English', ...pickN(SLANGS.slice(1), between(1, 2))] }),
        sel('specialist', 'Specialist', ['Orthodontist', 'Endodontist', 'Periodontist', 'Paediatric dentist'], { many: 1 }),
        rating(), price('Consultation fee', [[null, 200], [200, 350], [350, null]]), tog('verified', 'DHA-licensed only', { p: .95 })
      ],
      price: () => between(150, 450, 10), unit: () => '/consultation',
      title: (a, c) => `${c.name} · ${a.specialist[0]}`,
      meta: (a, l) => [['shield', a.insurance.length + ' insurers'], ['users', a.language.slice(0, 2).join(', ')], ['star', l.rating + ' (' + l.reviews + ')']] }
  ] };

  V.experiences = { id: 'experiences', label: 'Experiences', icon: 'compass', blurb: 'Safaris, workshops and tours.', offers: [
    { id: 'safari', label: 'Desert safari', h1: 'Desert safaris', basis: 'AED / person / day', img: [IMG + 'desert1.jpg', IMG + 'desert2.jpg'], n: 9, coverage: 1,
      action: 'Check availability', flow: ['Enquiry', 'Guest details', 'Pay operator', 'Pickup', 'Review'], org: ['DTCM-licensed operator'], names: ['Arabian Adventures', 'Platinum Heritage', 'Desert Rose Tours', 'Gulf Ventures'],
      fields: ['date', 'guests', 'loc', 'session'], locLabel: 'Pickup area',
      defs: [
        date('date', 'Date'),
        gte('guests', 'Guests', [['2', '1–2'], ['4', '3–4'], ['8', '5–8'], ['15', '9+']], () => pick([6, 10, 20, 40]), { field: 'groupMax', fmt: v => 'Groups up to ' + v }),
        sel('session', 'Session', [['morning', 'Morning'], ['evening', 'Evening'], ['overnight', 'Overnight']], { many: 1 }),
        sel('format', 'Private / shared', [['shared', 'Shared group'], ['private', 'Private']]),
        mul('language', 'Language', SLANGS, { gen: () => ['English', ...pickN(SLANGS.slice(1), between(0, 2))] }),
        mul('meals', 'Meals', ['BBQ dinner', 'Breakfast', 'Unlimited drinks'], { all: 1 }),
        sel('transport', 'Transport', [['4x4', '4x4 hotel pickup'], ['own', 'Meet at camp']], { many: 1 }),
        lte('age', 'Age', [['3', 'Kids 3+'], ['8', 'Kids 8+'], ['16', 'Teens & adults']], () => pick([3, 3, 5, 8, 16]), { field: 'minAge', fmt: v => v + '+' }),
        price('Price per person', [[null, 150], [150, 300], [300, null]]), tog('verified', 'DTCM-licensed only', { p: .9 })
      ],
      price: a => between(110, 280, 5) * (a.format === 'private' ? 2.2 : 1), unit: () => '/person',
      title: a => `${a.session.includes('overnight') ? 'Overnight Desert Camp' : a.session[0] === 'morning' ? 'Morning Dune Bashing & Sandboarding' : 'Evening Red Dunes Safari'}${a.meals.includes('BBQ dinner') ? ' with BBQ' : ''}${a.format === 'private' ? ' (Private)' : ''}`,
      meta: (a, l) => [['users', a.format === 'private' ? 'Private' : 'Up to ' + a.groupMax], ['car', a.transport.includes('4x4') ? 'Hotel pickup' : 'Meet at camp'], ['star', l.rating + ' (' + l.reviews.toLocaleString() + ')']] },

    { id: 'workshop', label: 'Workshop', h1: 'Workshops', basis: 'AED / session', img: [IMG + 'workshop1.jpg', IMG + 'workshop2.jpg'], n: 9,
      action: 'Check availability', flow: ['Enquiry', 'Seat confirmed', 'Reminder', 'Attend', 'Certificate'], org: ['Studio'], names: ['Clay Studio DXB', 'The Artsy Room', 'Kitchen Lab', 'Scent Atelier', 'Frame & Focus'],
      fields: ['topic', 'date', 'session', 'participants'],
      defs: [
        sel('topic', 'Topic', ['Pottery', 'Painting', 'Cooking', 'Perfume making', 'Photography', 'Calligraphy']),
        date('date', 'Date'), sel('session', 'Session', TIME, { many: 1 }),
        gte('participants', 'Participants', [['1', 'Just me'], ['2', '2'], ['6', '3–6'], ['12', '7+ (team)']], () => pick([6, 8, 12, 20]), { field: 'groupMax', fmt: v => 'Up to ' + v }),
        sel('level', 'Level', ['Beginner', 'Intermediate', 'Advanced'], { many: 1 }),
        mul('language', 'Language', SLANGS.slice(0, 3), { gen: () => ['English', ...pickN(['Arabic', 'Hindi'], between(0, 1))] }),
        tog('materials', 'Materials included', { p: .7 }),
        lte('age', 'Age', [['6', 'Kids 6+'], ['12', '12+'], ['18', 'Adults']], () => pick([6, 12, 12, 18]), { field: 'minAge', fmt: v => v + '+' }),
        price('Price per session', [[null, 200], [200, 400], [400, null]]), tog('verified', 'Verified studios only', { p: .85 })
      ],
      price: () => between(120, 480, 10), unit: () => '/session',
      title: (a, c) => `${a.topic} ${pick(['Workshop', 'Masterclass', 'Taster Session'])} · ${c.name}`,
      meta: (a, l) => [['clock', pick(['2 hrs', '2.5 hrs', '3 hrs'])], ['users', 'Up to ' + a.groupMax], ['star', l.rating + ' (' + l.reviews + ')']] },

    { id: 'tour', label: 'Tour', h1: 'Tours', basis: 'AED / person / day', img: [IMG + 'apt3.jpg', IMG + 'desert2.jpg', IMG + 'yacht2.jpg'], n: 9,
      action: 'Check availability', flow: ['Enquiry', 'Confirmation', 'Meet guide', 'Tour', 'Review'], org: ['DTCM-licensed guide'], names: ['Wanderlust DXB', 'Old Dubai Walks', 'Frying Pan Adventures', 'City Sightseeing'],
      fields: ['loc', 'date', 'guests', 'language'],
      defs: [
        date('date', 'Date'),
        gte('guests', 'Guests', [['2', '1–2'], ['4', '3–4'], ['8', '5–8'], ['15', '9+']], () => pick([8, 12, 20, 40]), { field: 'groupMax', fmt: v => 'Up to ' + v }),
        mul('language', 'Language', SLANGS, { gen: () => ['English', ...pickN(SLANGS.slice(1), between(1, 3))] }),
        sel('duration', 'Duration', [['short', 'Under 3 hrs'], ['half', 'Half day'], ['full', 'Full day']]),
        sel('format', 'Private / shared', [['shared', 'Shared group'], ['private', 'Private']]),
        sel('transport', 'Transport', [['pickup', 'Hotel pickup'], ['walk', 'Walking tour'], ['coach', 'Coach']]),
        tog('accessible', 'Wheelchair accessible', { p: .35 }),
        price('Price per person', [[null, 150], [150, 300], [300, null]]), tog('verified', 'Licensed guides only', { p: .9 })
      ],
      price: a => between(90, 260, 5) * (a.format === 'private' ? 2 : 1) * (a.duration === 'full' ? 1.6 : 1), unit: () => '/person',
      title: a => pick(['Old Dubai & Souks', 'Street Food Night', 'Abu Dhabi Grand Mosque Day Trip', 'Architecture & Skyline', 'Creek & Al Fahidi Heritage', 'Hatta Mountain Escape']) + (a.format === 'private' ? ' (Private)' : ' Tour'),
      meta: (a, l) => [['clock', { short: 'Under 3 hrs', half: 'Half day', full: 'Full day' }[a.duration]], ['users', a.language.slice(0, 2).join(', ')], ['star', l.rating + ' (' + l.reviews + ')']] }
  ] };

  V.memberships = { id: 'memberships', label: 'Memberships', icon: 'badge', blurb: 'Gyms and credit packages.', offers: [
    { id: 'gym', label: 'Gym plan', h1: 'Gym memberships', basis: 'AED / month or year', img: [IMG + 'fit2.jpg', IMG + 'fit1.jpg'], n: 10, from: 1,
      action: 'Book a free visit', flow: ['Enquiry', 'Free visit', 'Sign terms', 'Access card', 'Renewal'], org: ['Fitness club'], names: ['GymNation', 'Fitness First', 'Warehouse Gym', 'Barry\'s', 'Train Station', 'Commit Fitness'],
      fields: ['loc', 'access', 'billing', 'start'], defaults: { billing: 'monthly' },
      defs: [
        sel('access', 'Access level', [['single', 'Single club'], ['multi', 'Multi-club'], ['all', 'All-access']]),
        { id: 'billing', type: 'seg', label: 'Billing period', options: o([['monthly', 'Monthly'], ['annual', 'Annual']]), required: 1, noMatch: 1 },
        date('start', 'Start date'),
        gte('branches', 'Branches', [['1', '1+'], ['3', '3+'], ['10', '10+']], a => a.access === 'single' ? 1 : a.access === 'multi' ? pick([3, 5, 8]) : pick([10, 18, 30]), { fmt: v => v + ' branches' }),
        mul('classes', 'Classes', ['Yoga', 'HIIT', 'Spin', 'Pilates', 'Pool'], { all: 1, k: 4 }),
        sel('visits', 'Visits', [['unlimited', 'Unlimited'], ['12', '12 / month'], ['8', '8 / month']]),
        tog('freeze', 'Freeze allowed'), tog('noJoin', 'No joining fee'),
        price('Budget', S => S.f.billing === 'annual' ? [[null, 3000], [3000, 6000], [6000, null]] : [[null, 250], [250, 500], [500, null]]),
        tog('verified', 'Verified clubs only', { p: .85 })
      ],
      price: a => between(120, 420, 10) * (a.access === 'all' ? 1.6 : 1), priceOf: (l, S) => S && S.f.billing === 'annual' ? l.price * 10 : l.price,
      unit: (l, S) => S && S.f.billing === 'annual' ? '/year' : '/month',
      title: (a, c) => `${c.name} · ${lab(c.def('access'), a.access)}`,
      meta: a => [['pin', a.branches + ' branch' + (a.branches > 1 ? 'es' : '')], ['check', lab({ options: o([['unlimited', 'Unlimited'], ['12', '12 visits'], ['8', '8 visits']]) }, a.visits)], ['spark', a.classes.length + ' class types']] },

    { id: 'credits', label: 'Credit package', h1: 'Credit packages', basis: 'AED / package', img: [IMG + 'fit1.jpg', IMG + 'padel2.jpg'], n: 8, from: 1,
      action: 'Enquire about package', flow: ['Enquiry', 'Purchase', 'Credits issued', 'Book sessions', 'Expiry'], org: ['Activity network'], names: ['Privilee', 'ClassPass', 'Urban Pass', 'Kaizen Credits', 'Playtomic Plus'],
      fields: ['activity', 'loc', 'credits', 'start'],
      defs: [
        sel('activity', 'Activity', ['Fitness classes', 'Padel', 'Swimming', 'Spa & wellness', 'Yoga'], { many: 1 }),
        gte('credits', 'Credits', [['10', '10 credits'], ['20', '20 credits'], ['50', '50 credits'], ['100', '100 credits']], () => pick([20, 50, 100]), { field: 'maxCredits', fmt: v => 'Packs up to ' + v }),
        date('start', 'Start date'),
        gte('validity', 'Validity', [['1', '1 month+'], ['3', '3 months+'], ['6', '6 months+'], ['12', '12 months']], () => pick([1, 3, 6, 12]), { fmt: v => v + ' months' }),
        gte('locations', 'Locations', [['5', '5+ partners'], ['20', '20+ partners'], ['50', '50+ partners']], () => pick([6, 15, 30, 80]), { fmt: v => v + ' partners' }),
        tog('guest', 'Guest access'),
        lte('cancellation', 'Cancellation', [['12', 'Free up to 12h before'], ['24', 'Free up to 24h before']], () => pick([6, 12, 24]), { fmt: v => 'Free up to ' + v + 'h before' }),
        price('Package price', [[null, 500], [500, 1500], [1500, null]]), tog('verified', 'Verified only', { p: .85 })
      ],
      price: a => between(15, 32) * a.maxCredits / 2, unit: () => '/package',
      title: (a, c) => `${c.name} · ${a.activity.slice(0, 2).join(' & ')} Pack`,
      meta: a => [['tag', a.maxCredits + ' credits'], ['cal', a.validity + ' mo validity'], ['pin', a.locations + ' partners']] }
  ] };

  V.programs = { id: 'programs', label: 'Programs', icon: 'grad', blurb: 'Schools, courses, camps and academies.', offers: [
    { id: 'school', label: 'School', h1: 'Schools', basis: 'AED / term or year', img: [IMG + 'school1.jpg', IMG + 'school2.jpg'], n: 10, from: 1,
      action: 'Enquire about admission', flow: ['Enquiry', 'School tour', 'Assessment', 'Offer', 'Enrolment'], org: ['KHDA-registered school'], names: ['Dubai British School', 'GEMS Wellington', 'Repton', 'American Academy', 'Kings\' School', 'Lycée Français', 'Delhi Private School'],
      fields: ['year', 'curriculum', 'loc', 'intake'],
      defs: [
        sel('year', 'Year level', ['FS / KG', 'Primary', 'Secondary', 'Sixth form / IB'], { many: 1, k: 4 }),
        sel('curriculum', 'Curriculum', ['British', 'American', 'IB', 'Indian (CBSE)', 'French', 'UAE MoE']),
        sel('intake', 'Intake', ['Sep 2026', 'Jan 2027', 'Apr 2027'], { many: 1 }),
        sel('gender', 'Gender', [['coed', 'Co-ed'], ['girls', 'Girls only'], ['boys', 'Boys only']], { gen: () => pick(['coed', 'coed', 'coed', 'girls', 'boys']) }),
        price('Annual fees', [[null, 40000], [40000, 70000], [70000, null]]),
        tog('transport', 'School transport'),
        mul('facilities', 'Facilities', ['Swimming pool', 'Sports hall', 'Theatre', 'Science labs', 'Football pitch'], { all: 1, k: 5 }),
        sel('admissions', 'Admissions', [['open', 'Places available'], ['waitlist', 'Waitlist']]),
        sel('khda', 'KHDA rating', [['1', 'Outstanding'], ['2', 'Very good & up'], ['3', 'Good & up']], { test: (lv, v) => lv <= +v, gen: () => pick([1, 2, 2, 3, 3, 4]), fmt: v => ['', 'Outstanding', 'Very good', 'Good', 'Acceptable'][v] }),
        tog('verified', 'KHDA-verified only', { p: .95 })
      ],
      price: a => between(28000, 95000, 500) * (a.khda === 1 ? 1.3 : 1), unit: () => '/year',
      title: (a, c) => `${c.name} · ${a.curriculum} curriculum`,
      meta: a => [['grad', a.year.join(', ')], ['star', ['', 'Outstanding', 'Very good', 'Good', 'Acceptable'][a.khda]], ['users', { coed: 'Co-ed', girls: 'Girls', boys: 'Boys' }[a.gender]]] },

    { id: 'course', label: 'Course', h1: 'Courses', basis: 'AED / course', img: [IMG + 'office2.jpg', IMG + 'school1.jpg', IMG + 'office3.jpg'], n: 9,
      action: 'Enquire to enrol', flow: ['Enquiry', 'Enrolment', 'Pay provider', 'Timetable', 'Certificate'], org: ['KHDA-approved centre'], names: ['Le Wagon', 'Berlitz', 'Eton Institute', 'Coding Minds', 'MSB Academy'],
      fields: ['subject', 'level', 'start', 'mode'],
      defs: [
        sel('subject', 'Subject', ['Coding', 'UX Design', 'Data & AI', 'Arabic', 'English / IELTS', 'Business']),
        sel('level', 'Level', ['Beginner', 'Intermediate', 'Advanced'], { many: 1 }),
        date('start', 'Start date'),
        sel('mode', 'Mode', [['in-person', 'In-person'], ['online', 'Online'], ['hybrid', 'Hybrid']], { many: 1 }),
        lte('duration', 'Duration', [['4', 'Up to 4 weeks'], ['8', 'Up to 8 weeks'], ['12', 'Up to 12 weeks']], () => pick([2, 4, 6, 8, 12, 24]), { field: 'weeks', fmt: v => v + ' weeks' }),
        sel('schedule', 'Schedule', [['weekday-am', 'Weekday mornings'], ['weekday-pm', 'Weekday evenings'], ['weekend', 'Weekends']], { many: 1 }),
        tog('certificate', 'Certificate included', { p: .7 }),
        mul('language', 'Language', ['English', 'Arabic'], { gen: () => chance(.3) ? ['English', 'Arabic'] : ['English'] }),
        sel('provider', 'Provider', [['university', 'University'], ['institute', 'Institute'], ['tutor', 'Independent tutor']]),
        price('Course fee', [[null, 1500], [1500, 5000], [5000, null]]), tog('verified', 'Approved providers only', { p: .85 })
      ],
      price: a => between(80, 260, 10) * a.weeks * (a.provider === 'university' ? 1.5 : 1), unit: () => '/course',
      title: (a, c) => `${a.subject} ${pick(['Bootcamp', 'Course', 'Programme', 'Certificate'])} · ${c.name}`,
      meta: a => [['clock', a.weeks + ' weeks'], ['pin', a.mode.map(m => ({ 'in-person': 'In-person', online: 'Online', hybrid: 'Hybrid' }[m])).join(' / ')], ['check', a.certificate ? 'Certificate' : 'No certificate']] },

    { id: 'camp', label: 'Camp', h1: 'Kids camps', basis: 'AED / day or package', img: [IMG + 'fit1.jpg', IMG + 'school2.jpg', IMG + 'workshop1.jpg'], n: 9, from: 1,
      action: 'Enquire to enrol', flow: ['Enquiry', 'Consent form', 'Pay provider', 'Drop-off', 'Completion'], org: ['KHDA-approved centre'], names: ['Camp Beaver', 'Kids Active', 'Little Explorers', 'Sports Village', 'Young Engineers'],
      fields: ['activity', 'age', 'date', 'loc'],
      defs: [
        sel('activity', 'Activity', ['Sports', 'Arts & crafts', 'STEM & robotics', 'Multi-activity', 'Swimming']),
        sel('age', 'Age', [['4-7', '4–7 yrs'], ['8-12', '8–12 yrs'], ['13-16', '13–16 yrs']], { many: 1 }),
        date('date', 'Date'),
        sel('duration', 'Duration', [['day', 'Daily drop-in'], ['week', '1 week'], ['multi', '2+ weeks']], { many: 1 }),
        tog('meals', 'Meals included'), tog('transport', 'Transport available', { p: .4 }),
        lte('group', 'Group size', [['8', 'Up to 8'], ['12', 'Up to 12'], ['20', 'Up to 20']], () => pick([8, 10, 12, 16, 20, 25]), { field: 'groupMax', fmt: v => 'Max ' + v + ' kids' }),
        tog('equipment', 'Equipment provided', { p: .7 }),
        price('Price per day', [[null, 200], [200, 350], [350, null]]), tog('verified', 'Approved only', { p: .9 })
      ],
      price: () => between(140, 420, 10), unit: () => '/day',
      title: (a, c) => `${a.activity} Camp · ${c.name}`,
      meta: a => [['users', a.age.map(x => x.replace('-', '–')).join(', ') + ' yrs'], ['cal', a.duration.map(d => ({ day: 'Drop-in', week: '1 wk', multi: '2+ wks' }[d])).join(' / ')], ['users', 'Max ' + a.groupMax]] },

    { id: 'academy', label: 'Academy', h1: 'Sports academies', basis: 'AED / term', img: [IMG + 'padel1.jpg', IMG + 'fit2.jpg'], n: 9, from: 1,
      action: 'Book an assessment', flow: ['Enquiry', 'Assessment', 'Placement', 'Term', 'Progress report'], org: ['Sports academy'], names: ['Elite Football Academy', 'Hamilton Aquatics', 'Tennis 360', 'Dubai Stars Basketball', 'Legacy BJJ'],
      fields: ['sport', 'age', 'level', 'term'],
      defs: [
        sel('sport', 'Sport', ['Football', 'Swimming', 'Tennis', 'Basketball', 'Martial arts', 'Gymnastics']),
        sel('age', 'Age', [['4-7', '4–7 yrs'], ['8-12', '8–12 yrs'], ['13-17', '13–17 yrs'], ['adult', 'Adults']], { many: 1 }),
        sel('level', 'Level', ['Beginner', 'Intermediate', 'Advanced'], { many: 1 }),
        sel('term', 'Term', ['Autumn 2026', 'Spring 2027', 'Summer 2027'], { many: 1 }),
        sel('schedule', 'Schedule', [['weekday-pm', 'Weekday evenings'], ['weekend', 'Weekends']], { many: 1 }),
        sel('coach', 'Coach', [['licensed', 'Licensed coaches'], ['pro', 'Ex-professional coaches']], { many: 1 }),
        tog('assessment', 'Free assessment', { p: .6 }), tog('uniform', 'Uniform included'),
        price('Price per term', [[null, 1500], [1500, 3000], [3000, null]]), tog('verified', 'Verified academies only', { p: .9 })
      ],
      price: () => between(900, 4200, 50), unit: () => '/term',
      title: (a, c) => `${a.sport} · ${c.name}`,
      meta: a => [['users', a.age.map(x => x === 'adult' ? 'Adults' : x.replace('-', '–')).join(', ')], ['cal', a.schedule.map(s => s === 'weekend' ? 'Weekends' : 'Weekdays').join(' & ')], ['check', a.assessment ? 'Free assessment' : a.level.join(', ')]] }
  ] };

  V.insurance = { id: 'insurance', label: 'Insurance', icon: 'shield', blurb: 'Motor, health and property cover.', offers: [
    { id: 'motor', label: 'Motor', h1: 'Motor insurance', basis: 'Quoted annual premium', img: [], tile: 1, n: 8, from: 1, locAll: 1,
      action: 'Get a quote', flow: ['Quote request', 'Eligibility check', 'Comparison', 'Application', 'Policy issued'], org: ['CBUAE-licensed insurer'], names: ['AXA Gulf', 'Oman Insurance', 'Tokio Marine', 'RSA', 'Orient', 'Sukoon'],
      fields: ['vehicle', 'regYear', 'driverAge', 'coverage'],
      defs: [
        sel('vehicle', 'Vehicle', ['Sedan', 'SUV', 'Sports car', 'Luxury', 'Electric'], { many: 1, k: 4 }),
        sel('regYear', 'Registration year', [['2024', '2024 or newer'], ['2020', '2020–2023'], ['older', 'Before 2020']], { many: 1 }),
        sel('driverAge', 'Driver age', [['18', '18–24'], ['25', '25–39'], ['40', '40–59'], ['60', '60+']], { many: 1, k: 4 }),
        sel('coverage', 'Coverage', [['comprehensive', 'Comprehensive'], ['tpl', 'Third-party only']]),
        tog('agency', 'Agency repair'), tog('roadside', 'Roadside assistance', { p: .7 }),
        lte('deductible', 'Deductible', [['250', 'AED 250 or less'], ['500', 'AED 500 or less'], ['1000', 'AED 1,000 or less']], () => pick([0, 250, 350, 500, 1000]), { fmt: v => 'AED ' + v }),
        price('Premium', [[null, 1500], [1500, 3000], [3000, null]]), tog('verified', 'Licensed insurers only', { p: 1 })
      ],
      price: a => a.coverage === 'tpl' ? between(650, 1200, 10) : between(1400, 4800, 50), unit: () => '/year',
      title: (a, c) => `${c.name} ${a.coverage === 'tpl' ? 'Third-Party' : 'Comprehensive'} ${a.agency ? '+ Agency Repair' : 'Cover'}`,
      meta: a => [['shield', a.coverage === 'tpl' ? 'Third-party' : 'Comprehensive'], ['tool', a.agency ? 'Agency repair' : 'Garage repair'], ['tag', 'AED ' + a.deductible + ' excess']] },

    { id: 'health', label: 'Health', h1: 'Health insurance', basis: 'Quoted annual premium', img: [], tile: 1, n: 8, from: 1, locAll: 1,
      action: 'Get a quote', flow: ['Quote request', 'Health details', 'Comparison', 'Application', 'Policy issued'], org: ['CBUAE-licensed insurer'], names: ['Daman', 'Bupa Global', 'Cigna', 'MetLife', 'AXA', 'Allianz Care'],
      fields: ['customer', 'ageBand', 'area', 'network'],
      defs: [
        sel('customer', 'Customer type', [['individual', 'Individual'], ['family', 'Family'], ['sme', 'Employer / SME'], ['domestic', 'Domestic worker']], { many: 1, k: 3 }),
        sel('ageBand', 'Age band', [['18', '18–30'], ['31', '31–45'], ['46', '46–60'], ['61', '60+']], { many: 1, k: 4 }),
        sel('area', 'Coverage area', [['uae', 'UAE only'], ['ww-us', 'Worldwide excl. US'], ['ww', 'Worldwide']]),
        sel('network', 'Network', [['basic', 'Basic'], ['enhanced', 'Enhanced'], ['premium', 'Premium']]),
        tog('outpatient', 'Outpatient', { p: .8 }), tog('dental', 'Dental'), tog('maternity', 'Maternity'),
        lte('copay', 'Co-pay', [['0', 'No co-pay'], ['10', 'Up to 10%'], ['20', 'Up to 20%']], () => pick([0, 10, 20]), { fmt: v => v + '%' }),
        price('Premium', [[null, 3000], [3000, 8000], [8000, null]]), tog('verified', 'Licensed insurers only', { p: 1 })
      ],
      price: a => between(900, 3000, 50) * ({ basic: 1, enhanced: 2.2, premium: 4 }[a.network]) * (a.area === 'ww' ? 1.8 : 1), unit: () => '/year',
      title: (a, c) => `${c.name} ${lab(c.def('network'), a.network)} · ${lab(c.def('area'), a.area)}`,
      meta: a => [['shield', { basic: 'Basic', enhanced: 'Enhanced', premium: 'Premium' }[a.network] + ' network'], ['check', [a.outpatient && 'OP', a.dental && 'Dental', a.maternity && 'Maternity'].filter(Boolean).join(' · ') || 'Inpatient'], ['tag', a.copay + '% co-pay']] },

    { id: 'property', label: 'Property', h1: 'Property insurance', basis: 'Quoted annual premium', img: [], tile: 1, n: 7, from: 1, locAll: 1,
      action: 'Get a quote', flow: ['Quote request', 'Risk details', 'Comparison', 'Application', 'Policy issued'], org: ['CBUAE-licensed insurer'], names: ['Sukoon', 'RSA', 'AXA Gulf', 'Zurich', 'Salama'],
      fields: ['ptype', 'loc', 'value', 'occupancy'],
      defs: [
        sel('ptype', 'Property type', ['Apartment', 'Villa', 'Office', 'Warehouse'], { many: 1, k: 3 }),
        gte('value', 'Value', [['1', 'Up to AED 1M'], ['3', 'AED 1M–3M'], ['10', 'AED 3M+']], () => pick([2, 5, 10, 25]), { field: 'maxValue', fmt: v => 'Up to AED ' + v + 'M' }),
        sel('occupancy', 'Occupancy', [['owner', 'Owner-occupier'], ['tenant', 'Tenant'], ['landlord', 'Landlord']], { many: 1 }),
        tog('building', 'Building cover'), tog('contents', 'Contents cover', { p: .8 }), tog('liability', 'Liability cover', { p: .7 }),
        lte('deductible', 'Deductible', [['500', 'AED 500 or less'], ['1000', 'AED 1,000 or less']], () => pick([250, 500, 1000, 2500]), { fmt: v => 'AED ' + v }),
        price('Premium', [[null, 800], [800, 2000], [2000, null]]), tog('verified', 'Licensed insurers only', { p: 1 })
      ],
      price: () => between(350, 3200, 25), unit: () => '/year',
      title: (a, c) => `${c.name} ${a.occupancy.includes('tenant') ? 'Home Contents' : 'Home & Building'} Cover`,
      meta: a => [['home', a.ptype.join(', ')], ['check', [a.building && 'Building', a.contents && 'Contents', a.liability && 'Liability'].filter(Boolean).join(' · ') || 'Basic'], ['tag', 'AED ' + a.deductible + ' excess']] }
  ] };

  const VORDER = ['spaces', 'services', 'experiences', 'memberships', 'programs', 'insurance'];

  /* ---------- generate listings ---------- */
  const LISTINGS = [];
  VORDER.forEach(vid => V[vid].offers.forEach(off => {
    off.v = vid;
    const defMap = Object.fromEntries(off.defs.map(d => [d.id, d]));
    for (let i = 0; i < off.n; i++) {
      const a = {};
      off.defs.forEach(d => {
        const key = d.field || d.id;
        if (d.nogen || d.type === 'range' || a[key] !== undefined) return;
        if (d.gen) { a[key] = d.gen(a); return; }
        if (d.type === 'select' || d.type === 'seg') a[key] = d.many ? pickN(d.options, between(1, Math.min(d.k || 3, d.options.length))).map(x => x.v) : pick(d.options).v;
        else if (d.type === 'multi') a[key] = pickN(d.options, between(1, Math.min(d.k || 3, d.options.length))).map(x => x.v);
        else if (d.type === 'toggle') a[key] = chance(d.p != null ? d.p : .55);
        else if (d.type === 'date') a[key] = pick([0, 0, 1, 1, 2, 3, 5, 10, 14]);
      });
      if (off.post) off.post(a);
      const loc = off.locFn ? off.locFn(a) : off.locs ? pick(off.locs) : vid === 'spaces' ? pick(RES) : pick(AREAS.slice(0, 21)).id;
      const name = off.names ? pick(off.names) : null;
      const ctx = { def: id => defMap[id], areaN: areaName(loc), name };
      const bld = off.lease && BLD[loc] ? pick(BLD[loc]) : null;
      const pr = off.price(a);
      const org = off.people ? (i % 4 === 0 ? off.org[0] : pick(off.org)) : off.org[0];
      const person = off.people ? (org.startsWith('Greenstone') ? 'Ahmed Karim' : pick(AGENTS)) : name || pick(AGENTS);
      const step = pr > 5000 ? 500 : pr > 1000 ? 50 : 10;
      LISTINGS.push({
        v: vid, cat: off.id, loc, building: bld, a, title: off.title(a, ctx), price: Math.round(pr / step) * step,
        img: off.img.length ? [...off.img.slice(i % off.img.length), ...off.img.slice(0, i % off.img.length)] : [],
        rating: +(4 + rnd() * .95).toFixed(1), reviews: between(6, 480), posted: between(0, 40),
        coverage: off.coverage ? [loc, ...pickN(AREAS.filter(x => x.id !== loc), between(4, 10)).map(x => x.id)] : null,
        provider: { name: person, org: off.people ? org : vid === 'spaces' ? (name || org) : org, phone: phone(), reply: pick([5, 8, 10, 15, 30]), langs: pick(LANGS), since: between(2014, 2024), brn: off.lease ? String(between(40000, 79999)) : null, count: between(4, 180) },
        ref: 'UN-' + between(100000, 999999), permit: off.permit ? (off.lease ? '71' + between(10000000, 99999999) : 'DXB-' + between(100000, 999999)) : null
      });
    }
  }));
  LISTINGS.forEach((l, i) => { l.id = 'L' + (1000 + i); l.featured = rnd() < .18; });

  const offerOf = (v, c) => { const vv = V[v] || V.spaces; return vv.offers.find(x => x.id === c) || vv.offers[0]; };
  window.UP = { AREAS, areaById, areaName, LISTINGS, VERTICALS: V, VORDER, offerOf, K, IMG };
})();
