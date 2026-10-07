/* Provider onboarding (pages/join.html) — provider VERIFICATION only. It answers "who are you?", never "what are you offering?".
   Sign-in comes first (components/marketplace/auth.js): name, verified mobile and email come from the account.
     1 Business    — what kind of business (vertical + what it offers), individual or company, country. No location:
                     a space's location belongs to each LISTING, not to the provider
     2 Verify      — upload the ID / trade licence (+ the licence the vertical needs); we read the details off the document,
                     the provider checks and corrects them (reading a document is not verification)
     3 Profile     — only what the documents can't tell us: public name, photo / logo, about, languages, contact
   Submit opens a short confirmation (one line per part + consent) — no full review page: every detail was already
   confirmed on its step. Then admin verification → approved or rejected (handled by the team, outside this page).
   Country rules — ID document, licence names, issuing authorities — come from data/markets.js. */
(function () {
  const { VERTICALS } = UP;
  const { ico, esc, toast, initials, auth } = UPUI;
  const KEY = 'upnow.join';
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- provider types (vertical-agnostic) ---------- */
  const ROLES = [
    ['individual', 'Individual', 'You work for yourself or own in your own name', 'user'],
    ['company', 'Company', 'A registered business with a trade licence', 'building']
  ];
  const roleOf = s => ROLES.find(r => r[0] === s.role);
  const isBiz = s => s.role === 'company';
  // verticals only licensed companies can offer
  const COMPANY_ONLY = ['memberships', 'health', 'insurance'];
  // sub-categories that need a licensed company even inside an open vertical
  const COMPANY_CATS = ['venue', 'court', 'yacht', 'nursery', 'school', 'higher', 'camp'];
  // property an individual lists must be theirs (title deed) or they must hold the owner's power of attorney
  const companyOnly = s => COMPANY_ONLY.includes(s.v) || (s.cats || []).some(c => COMPANY_CATS.includes(c));
  const offerLabel = id => (VERTICALS[S.v].offers.find(o => o.id === id) || {}).label;
  const JOIN_ORDER = ['spaces', 'services', 'experiences', 'programs', 'memberships', 'health', 'insurance'];
  const verticalsInOrder = () => [...JOIN_ORDER.filter(v => UP.VORDER.includes(v)), ...UP.VORDER.filter(v => !JOIN_ORDER.includes(v))];

  /* ---------- market (country) rules: data/markets.js ---------- */
  const M = () => MARKETS.market(S.country);
  const country = () => MARKETS.byIso(S.country) || MARKETS.byIso(MARKETS.DEFAULT);
  const digits = p => String(p).replace(/\D/g, '');
  const fmtPhone = p => { p = digits(p); const out = []; let i = 0; for (const g of M().phone.groups) { if (i >= p.length) break; out.push(p.slice(i, i + g)); i += g; } if (i < p.length) out.push(p.slice(i)); return out.join(' '); };

  /* ---------- business types: who exactly you are, what we verify, how big you are ----------
     Researched for Dubai (DLD/RERA, DET, KHDA, MoHRE, MoHESR, DHA, Dubai Sports Council, DMA, CBUAE, Dubai Municipality), 2025–26.
     docs: [document id, 'req' | 'opt' | 'later'] — the first one is the main document we read and pre-fill.
     'later' = may follow after approval (listings in that category stay in draft). size: one or two sizing questions. */
  const ID_SET = [['eid', 'req'], ['passport', 'req'], ['visa', 'opt']]; // individuals: ID and passport both required
  const SIG_SET = [['sig', 'req'], ['sigPass', 'opt']];
  const TYPES = {
    spaces: {
      individual: [
        { id: 'owner', t: 'Owner / landlord', sub: 'You rent out or sell property you own', icon: 'key', docs: ID_SET, size: [['units', 'How many properties do you own?', ['1', '2–3', '4–10', '11–25', '25+']]] },
        { id: 'broker', t: 'Property manager / broker', sub: 'You list owners’ properties with a RERA broker card', icon: 'brief', docs: [['brn', 'req'], ...ID_SET], size: [['units', 'How many units do you handle?', ['1–5', '6–20', '21–50', '50+']]] }
      ],
      company: [
        { id: 'landlord', t: 'Landlord company', sub: 'Your company rents out or sells property it owns', icon: 'building', docs: [['tl', 'req'], ...SIG_SET, ['vat', 'opt']], size: [['units', 'How many units does the company own?', ['1–5', '6–20', '21–100', '101–500', '500+']]] },
        { id: 'manager', t: 'Property management / brokerage', sub: 'Your company manages or brokers property for owners', icon: 'users', docs: [['tl', 'req'], ['orn', 'req'], ...SIG_SET, ['vat', 'opt']], size: [['units', 'How many units do you manage?', ['1–20', '21–100', '101–500', '500+']], ['team', 'How many agents / property managers?', ['1', '2–5', '6–20', '21–50', '50+']]] }
      ]
    },
    services: {
      individual: [{ id: 'freelancer', t: 'Freelancer', sub: 'You provide the service yourself under a freelance permit', icon: 'user', docs: [['fp', 'req'], ...ID_SET], size: [['team', 'Do you work alone?', ['Just me', '2–3 people', '4–10 people']]] }],
      company: [{ id: 'svcco', t: 'Service company', sub: 'Cleaning, maintenance, beauty or other service business', icon: 'building', docs: [['tl', 'req'], ...SIG_SET, ['vat', 'opt']], size: [['team', 'How many staff deliver services?', ['1–5', '6–20', '21–50', '51–200', '200+']]] }]
    },
    experiences: {
      individual: [
        { id: 'guide', t: 'Licensed tour guide', sub: 'You guide tours with a DET tour guide licence', icon: 'compass', docs: [['guide', 'req'], ...ID_SET], size: [['volume', 'How many tours a week?', ['1–3', '4–10', '10+']]] },
        { id: 'host', t: 'Workshop host / instructor', sub: 'You run classes or workshops under a freelance permit', icon: 'palette', docs: [['fp', 'req'], ...ID_SET], size: [['volume', 'How many sessions a month?', ['1–4', '5–15', '15+']]] }
      ],
      company: [
        { id: 'operator', t: 'Tour operator / desert safari', sub: 'Licensed tourism company running tours or safaris', icon: 'compass', docs: [['tl', 'req'], ['tourOp', 'req'], ...SIG_SET, ['vat', 'opt']], size: [['team', 'How many guides and drivers?', ['1–5', '6–20', '21–50', '50+']]] },
        { id: 'activity', t: 'Activity / workshop company', sub: 'Attractions, classes and experiences', icon: 'palette', docs: [['tl', 'req'], ...SIG_SET, ['vat', 'opt']], size: [['team', 'How many employees?', ['1–10', '11–50', '51–200', '200+']]] }
      ]
    },
    programs: {
      individual: [
        { id: 'tutor', t: 'Private tutor', sub: 'You teach with a MoHRE private teacher work permit', icon: 'book', docs: [['tutor', 'req'], ...ID_SET], size: [['volume', 'How many students a week?', ['1–5', '6–15', '16–30', '30+']]] },
        { id: 'coach', t: 'Coach / instructor', sub: 'Sport, music or skills coaching under a freelance permit', icon: 'ball', docs: [['fp', 'req'], ...ID_SET], size: [['volume', 'How many students a week?', ['1–5', '6–15', '16–30', '30+']]] }
      ],
      company: [
        { id: 'training', t: 'Training centre / course provider', sub: 'Courses and training licensed by KHDA', icon: 'grad', docs: [['tl', 'req'], ['khdaTrain', 'req'], ...SIG_SET], size: [['team', 'How many instructors?', ['1–5', '6–20', '21–50', '50+']]] },
        { id: 'nursery', t: 'Nursery', sub: 'Early childhood centre licensed by KHDA', icon: 'smile', docs: [['tl', 'req'], ['khdaEcc', 'req'], ...SIG_SET], size: [['volume', 'How many children can you take?', ['Under 50', '50–150', '150–300', '300+']]] },
        { id: 'school', t: 'School', sub: 'K-12 school with a KHDA permit', icon: 'grad', docs: [['tl', 'req'], ['khdaSchool', 'req'], ...SIG_SET], size: [['volume', 'How many students are enrolled?', ['Under 500', '500–1,500', '1,500–3,000', '3,000+']]] },
        { id: 'higher', t: 'University / higher education', sub: 'Licensed by MoHESR or KHDA', icon: 'grad', docs: [['tl', 'req'], ['hedu', 'req'], ...SIG_SET], size: [['volume', 'How many students are enrolled?', ['Under 1,000', '1,000–5,000', '5,000+']]] },
        { id: 'academy', t: 'Camp / sports academy', sub: 'Holiday camps and sports academies', icon: 'ball', docs: [['tl', 'req'], ['camp', 'req'], ...SIG_SET], size: [['team', 'How many coaches and staff?', ['1–5', '6–20', '20+']]] }
      ]
    },
    memberships: {
      company: [
        { id: 'gym', t: 'Gym / studio / club', sub: 'Fitness business approved by Dubai Sports Council', icon: 'ball', docs: [['tl', 'req'], ['dsc', 'req'], ...SIG_SET, ['reps', 'later']], size: [['locations', 'How many locations?', ['1', '2–5', '6+']], ['team', 'How many trainers?', ['1–5', '6–20', '20+']]] },
        { id: 'aggregator', t: 'Credit / package provider', sub: 'Memberships that work across partner venues', icon: 'tag', docs: [['tl', 'req'], ...SIG_SET], size: [['locations', 'How many partner venues?', ['1–10', '11–50', '50+']]] }
      ]
    },
    health: {
      company: [
        { id: 'facility', t: 'Clinic / medical centre', sub: 'Clinic, dental, physio, lab or mental health centre', icon: 'medic', docs: [['tl', 'req'], ['dha', 'req'], ...SIG_SET], size: [['team', 'How many licensed clinicians?', ['1–5', '6–20', '21–50', '50+']]] },
        { id: 'homecare', t: 'Home healthcare provider', sub: 'Licensed home-care centre', icon: 'home', docs: [['tl', 'req'], ['dha', 'req'], ...SIG_SET], size: [['team', 'How many licensed clinicians?', ['1–5', '6–20', '21–50', '50+']]] }
      ]
    },
    insurance: {
      company: [
        { id: 'insurer', t: 'Insurance company', sub: 'Insurer licensed by the Central Bank', icon: 'shield', docs: [['tl', 'req'], ['cbIns', 'req'], ...SIG_SET], size: [['lines', 'How many product lines?', ['1', '2–3', '4+']]] },
        { id: 'insbroker', t: 'Insurance broker', sub: 'Broker registered with the Central Bank', icon: 'users', docs: [['tl', 'req'], ['cbBroker', 'req'], ...SIG_SET], size: [['team', 'How many licensed advisers?', ['1–5', '6–20', '20+']]] },
        { id: 'agency', t: 'Insurance agency', sub: 'Agent of an insurance company', icon: 'brief', docs: [['tl', 'req'], ['cbAgent', 'req'], ['agencyAgr', 'req'], ...SIG_SET], size: [['team', 'How many licensed advisers?', ['1–5', '6–20', '20+']]] }
      ]
    }
  };
  const typesOf = s => (TYPES[s.v] || {})[s.role] || [];
  const typeOf = s => typesOf(s).find(t => t.id === s.sub);

  /* ---------- documents: names and the details we read from each ---------- */
  const UAE = () => S.country === 'AE';
  const u = (uae, other) => UAE() ? uae : other;
  const f3 = (id, a = 'Licence no.') => [[id + 'No', a], [id + 'Auth', 'Issued by'], [id + 'Exp', 'Expiry date', 'date']];
  function catalog(id) {
    const L = M().licences;
    return ({
      tl: { t: L.company[0], hint: L.company[1], fields: [['legal', 'Legal name'], ['trade', 'Trade name'], ['licence', L.companyNo], ['activity', 'Business activity'], ['authority', 'Issuing authority'], ['issued', 'Issue date', 'issued'], ['expiry', 'Expiry date', 'date'], ['address', 'Registered address', 'wide']] },
      eid: { t: `Your ${M().idDoc}`, hint: 'Front and back', fields: [['fullName', 'Full name'], ['eidNo', 'ID number'], ['nationality', 'Nationality'], ['eidExp', 'Expiry date', 'date']] },
      passport: { t: 'Your passport', hint: 'Photo page', fields: [['passNo', 'Passport no.'], ['passCountry', 'Issuing country'], ['passExp', 'Expiry date', 'date']] },
      visa: { t: u('UAE residence visa', 'Residence permit'), hint: 'If you are a resident — helps us match your ID', fields: [['visaNo', 'Visa / file no.'], ['visaSponsor', 'Sponsor'], ['visaExp', 'Expiry date', 'date']] },
      sig: { t: `${M().idDoc} · authorised signatory`, hint: 'The person who signs for the company', fields: [['sigName', 'Full name'], ['eidNo', 'ID number'], ['eidExp', 'Expiry date', 'date']] },
      sigPass: { t: 'Passport · authorised signatory', hint: 'Photo page', fields: [['sigPassNo', 'Passport no.'], ['sigPassCountry', 'Issuing country'], ['sigPassExp', 'Expiry date', 'date']] },
      vat: { t: 'Tax / VAT certificate', hint: 'If the company is tax-registered', fields: [['trn', 'Tax registration no. (TRN)']] },
      orn: { t: u('RERA office registration (ORN)', L.office ? L.office[0] : 'Brokerage registration'), hint: u('From Dubai Land Department — required to manage or broker owners’ properties', 'Required to manage or broker property'), fields: [['ornNo', L.officeNo || 'Registration no.'], ['ornExp', 'Expiry date', 'date']] },
      brn: { t: u('RERA broker card (BRN)', L.agentCard ? L.agentCard[0] : 'Real estate agent licence'), hint: u('Dubai brokers work under a RERA-registered office', 'Your professional licence'), fields: [['brnNo', L.agentNo || 'Licence no.'], ['brnOffice', 'Brokerage office (ORN)'], ['brnExp', 'Expiry date', 'date']] },
      hhIndiv: { t: u('DET holiday home licence', (L.shortStay || ['Short-stay licence'])[0]), hint: 'Lets you rent your own home short-term', fields: f3('hh', 'Licence no.') },
      hhCo: { t: u('DET holiday homes operator licence', 'Short-stay operator licence'), hint: '“Vacation homes rental” activity', fields: f3('hh') },
      yacht: { t: u('DMA commercial marine craft licence', 'Charter licence'), hint: 'Dubai Maritime Authority licence for charters', fields: f3('ya') },
      venue: { t: u('Venue / event activity on your licence', 'Venue licence'), hint: 'DET event permits are added per event', fields: f3('ve', 'Permit no.') },
      dsc: { t: u('Dubai Sports Council approval', 'Sports facility registration'), hint: 'For gyms, courts and sports businesses', fields: f3('ds', 'Approval no.') },
      reps: { t: u('REPs UAE registration of trainers', 'Trainer registrations'), hint: 'For the trainers you list', fields: f3('re', 'Registration no.') },
      fp: { t: u('Freelance permit', (L.freelance || ['Self-employment registration'])[0]), hint: u('From DET or a free zone — activity must match what you offer', 'Your self-employment registration'), fields: f3('fp', 'Permit no.') },
      beauty: { t: u('DET home-service permit + DM health card', 'Health & safety certificate'), hint: 'Required for hair and beauty at customers’ homes', fields: f3('be', 'Permit no.') },
      guide: { t: u('DET tour guide licence', 'Tour guide licence'), hint: 'Department of Economy & Tourism', fields: f3('tg') },
      tourOp: { t: u('DET tourism licence (tour operator)', (L.tour || ['Tour operator licence'])[0]), hint: 'Required for tours and safaris', fields: f3('to') },
      safari: { t: u('Desert safari permit + RTA vehicle permits', 'Safari / vehicle permits'), hint: 'Only if you run desert safaris', fields: f3('sa', 'Permit no.') },
      tutor: { t: u('Private teacher work permit (MoHRE)', 'Teacher registration'), hint: 'Issued by MoHRE, valid for two years', fields: f3('tu', 'Permit no.') },
      khdaTrain: { t: u('KHDA training institute permit', (L.education || ['Education licence'])[0]), hint: 'Knowledge & Human Development Authority', fields: f3('kh', 'Permit no.') },
      khdaEcc: { t: u('KHDA early childhood centre permit', 'Nursery licence'), hint: 'Knowledge & Human Development Authority', fields: f3('kh', 'Permit no.') },
      khdaSchool: { t: u('KHDA school permit', 'School licence'), hint: 'Knowledge & Human Development Authority', fields: f3('kh', 'Permit no.') },
      hedu: { t: u('MoHESR licence / CAA accreditation', 'Higher-education accreditation'), hint: u('Or KHDA licence for free-zone institutions', ''), fields: f3('he', 'Licence no.') },
      camp: { t: u('KHDA permit or Dubai Sports Council registration', 'Activity licence'), hint: 'KHDA for educational camps, DSC for sports academies', fields: f3('ca', 'Permit no.') },
      dha: { t: u('DHA health facility licence', (L.health || ['Healthcare licence'])[0]), hint: u('Or DHCR if you are in Dubai Healthcare City', 'Health regulator licence'), fields: f3('dh') },
      cbIns: { t: u('CBUAE insurance company licence', (L.insurance || ['Insurance licence'])[0]), hint: 'Central Bank of the UAE', fields: f3('cb') },
      cbBroker: { t: u('CBUAE insurance broker registration', 'Broker registration'), hint: 'Central Bank of the UAE', fields: f3('cb', 'Registration no.') },
      cbAgent: { t: u('CBUAE insurance agent registration', 'Agent registration'), hint: 'Central Bank of the UAE', fields: f3('cb', 'Registration no.') },
      agencyAgr: { t: 'Agency agreement with the insurer', hint: 'Names the insurer you sell for', fields: [['agInsurer', 'Insurer'], ['agExp', 'Valid until', 'date']] }
    })[id];
  }
  // the business type's documents + licences that come with what you offer
  function needs(s) {
    const t = typeOf(s); if (!t) return [];
    const out = t.docs.map(([id, st]) => [id, st !== 'opt', st === 'later']);
    const add = (id, req, later) => { if (!out.some(x => x[0] === id)) out.push([id, req, later]); };
    const cats = s.cats || [], has = (...c) => c.some(x => cats.includes(x)), biz = isBiz(s);
    if (s.v === 'spaces') {
      if (has('holiday')) add(biz ? 'hhCo' : 'hhIndiv', true, true);
      if (has('yacht')) add('yacht', true, true);
      if (has('venue')) add('venue', true, true);
      if (has('court')) add('dsc', false, true);
    }
    if (s.v === 'services' && has('haircut')) add('beauty', true, false);
    if (s.v === 'experiences' && has('safari') && biz) add('safari', true, true);
    return out;
  }
  function docsFor(s) {
    return needs(s).map(([id, req, later]) => ({ id, req, later, ...catalog(id) }));
  }
  // a document is settled when it is checked, or when it may follow later and hasn't been added
  const settled = doc => { const f = S.docs[doc.id]; return (f && f.state === 'read' && f.ok) || (doc.later && !f); };
  // demo document reader: what a scan of each document returns. '' = not found on the document; '?' prefix = unsure, please check
  function readDoc(id) {
    const idName = S.name || 'Aisha Al Mansoori', parts = idName.split(' '), last = parts[parts.length - 1] || 'Palm', auth1 = (M().licences.authorities || ['Department of Economy'])[0];
    const fixed = {
      tl: { legal: `${last} Group L.L.C`, trade: `?${last} Group`, licence: '1048273', activity: 'Leasing & management of real estate', authority: auth1, issued: '12 Mar 2025', expiry: '11 Mar 2027', address: '' },
      sig: { sigName: idName, eidNo: '784-1990-4417291-3', eidExp: '04 Feb 2029' },
      eid: { fullName: idName, eidNo: '784-1990-4417291-3', nationality: '?United Arab Emirates', eidExp: '04 Feb 2029' },
      vat: { trn: '100234567800003' },
      passport: { passNo: 'N4417291', passCountry: '?United Kingdom', passExp: '18 Aug 2031' },
      visa: { visaNo: '201/2023/7712093', visaSponsor: 'Self', visaExp: '03 Feb 2027' },
      sigPass: { sigPassNo: 'P0912284', sigPassCountry: '?India', sigPassExp: '22 Nov 2030' },
      orn: { ornNo: '21947', ornExp: '30 Jun 2027' },
      brn: { brnNo: '48213', brnOffice: '?Al Noor Real Estate · ORN 21947', brnExp: '31 Mar 2027' },
      agencyAgr: { agInsurer: 'Oman Insurance Company', agExp: '31 Dec 2027' },
    };
    if (fixed[id]) return fixed[id];
    // licences and permits: number · issuer · expiry
    const doc = catalog(id); if (!doc) return {};
    const [n, a, e] = doc.fields.map(f => f[0]);
    return { [n]: (id.slice(0, 2).toUpperCase()) + '-' + (20000 + idName.length * 517), [a]: '?' + doc.t.split(' ')[0], [e]: '15 Jan 2027' };
  }
  const isoDate = v => { if (!v) return ''; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; const t = Date.parse(v); if (isNaN(t)) return ''; const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const niceDate = v => { const i = isoDate(v); if (!i) return v || ''; const [y, m, d] = i.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const expired = v => { const t = Date.parse(v); return !isNaN(t) && t < Date.now(); };

  /* ---------- reference data ---------- */
  // most-spoken first: the first ones not yet picked are offered as one-tap suggestions
  const LANGS = ['English', 'Arabic', 'Hindi', 'Urdu', 'Malayalam', 'Tagalog', 'Russian', 'French', 'Persian', 'Chinese', 'Spanish', 'German',
    'Tamil', 'Telugu', 'Bengali', 'Sinhala', 'Nepali', 'Pashto', 'Turkish', 'Italian', 'Portuguese', 'Dutch', 'Ukrainian', 'Japanese', 'Korean', 'Indonesian', 'Thai', 'Vietnamese', 'Swahili', 'Kurdish', 'Greek', 'Polish'];
  const MAX_LANGS = 6;
  const HOURS = [['9-18', '9 AM – 6 PM'], ['9-22', '9 AM – 10 PM'], ['24', '24/7']];
  const CHANNELS = [['wa', 'WhatsApp', 'wa'], ['call', 'Calls', 'phone'], ['email', 'Email', 'mail'], ['sms', 'SMS', 'msg']];
  const STEPS = [['Business', 'What you do'], ['Verify', 'Who you are'], ['Profile', 'What customers see']];
  const LAST = STEPS.length;
  const MINUTES = [4, 3, 1];

  /* ---------- state (draft kept in this browser) ----------
     status: draft → submitted (approval happens outside this page). docs[id]: { name, size, state: 'scan' | 'read', ok: confirmed by the provider }
     d: every value (from documents and from the profile); src[k]: 'doc' read from a document · 'check' unsure · 'missing' not found */
  const fresh = () => ({ flow: 5, step: 1, status: 'draft', country: MARKETS.DEFAULT, name: '', phone: '', email: '', v: 'spaces', cats: [], role: '', docs: {}, later: {}, src: {}, d: { langs: ['English'] }, channels: ['wa', 'call'], hours: '9-22', agree: false });
  let S = fresh();
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) S = Object.assign(fresh(), saved); } catch (e) {}
  // drafts from the earlier flows (vertical, categories, areas in onboarding): keep the profile answers, start verification again
  // the verification-only draft (no business step): keep everything, the business step comes first now
  if (S.flow === 4) { S.flow = 5; if (S.status === 'draft') S.step = 1; }
  // drafts from the earlier flows (areas and documents typed in by hand): keep the business and profile answers, verify again
  if (S.flow !== 5) {
    const old = S, keep = ['display', 'bio', 'photo', 'langs'];
    S = fresh();
    Object.assign(S, { owner: old.owner, country: old.country || S.country, v: old.v && VERTICALS[old.v] ? old.v : 'spaces', cats: old.cats || [], channels: old.channels || S.channels, hours: old.hours || S.hours, role: { company: 'company', business: 'company', individual: 'individual', freelancer: 'individual' }[old.role] || '' });
    keep.forEach(k => { if (old.d && old.d[k]) S.d[k] = old.d[k]; });
    if (old.done) S.status = 'submitted';
  }
  if (!VERTICALS[S.v]) S.v = 'spaces';
  if (S.status === 'approved') S.status = 'submitted';
  if (S.step > 3) S.step = 3;
  if (companyOnly(S)) S.role = 'company';
  S.later = S.later || {};
  // drafts from before business types: choose the type again (documents depend on it)
  if (S.status === 'draft' && !typeOf(S)) { S.step = 1; S.docs = {}; S.src = {}; }
  // drafts with the old separate ownership documents: the main document replaces them
  if (S.docs.deed || S.docs.poa || S.docs.ownerDeed || S.docs.fp) { ['deed', 'poa', 'ownerDeed', 'fp'].forEach(k => delete S.docs[k]); }
  delete S.d.ownership;
  // documents renamed when the requirements became per category: start those uploads again
  if (S.docs.sector || (S.role === 'company' && S.docs.eid)) { S.docs = {}; S.src = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  let errors = {};
  // the account (sign-in) supplies name, verified mobile and email
  function fromAccount() {
    const u = auth.user(); if (!u) return false;
    // the draft belongs to one account: someone else signing in on this browser starts their own
    const owner = u.email || u.dial + u.phone;
    if (S.owner && S.owner !== owner) { S = fresh(); errors = {}; }
    if (S.owner !== owner) { S.owner = owner; save(); }
    Object.assign(S, { name: u.name, phone: u.phone, email: u.email, dial: u.dial });
    return true;
  }

  /* ---------- motion bookkeeping (view only, never saved) ----------
     dir: the step slides in from this side on the next render · pop: selector of the control just picked (it springs)
     seen: sections already on screen (a new one fades up and scrolls into view) · fill: progress-bar widths last drawn */
  const A = { dir: '', pop: '', seen: new Set(), entering: true, revealed: '', fill: [0, 0, 0], preview: '', saved: false, optOpen: false, open: {}, otherCity: false };
  let previewOpen = false;

  /* ---------- small builders ---------- */
  const err = k => errors[k] ? `<span class="onboarding-error">${ico('x')}${esc(errors[k])}</span>` : '';
  const field = (k, label, input, hint = '') => `<div class="field onboarding-field ${errors[k] ? 'has-error' : ''}" data-f="${k}"><label for="onboarding-${k}">${esc(label)}</label>${input}${hint && !errors[k] ? `<small class="onboarding-hint">${esc(hint)}</small>` : ''}${err(k)}</div>`;
  const text = (k, label, ph = '', hint = '') => field(k, label, `<input id="onboarding-${k}" data-k="${k}" value="${esc(S.d[k] || '')}" placeholder="${esc(ph)}">`, hint);
  const firstName = () => (S.name || '').split(' ')[0];
  // a part of a step; parts that appear later fade up the first time they're shown
  function sec(id, title, body, aside = '') {
    const key = S.step + ':' + id, isNew = !A.seen.has(key);
    A.seen.add(key);
    if (isNew && !A.entering) A.revealed = id;
    return `<section class="onboarding-section ${isNew && !A.entering ? 'is-enter' : ''}" data-sec="${id}">${title || aside ? `<div class="onboarding-section-header"><h2>${title}</h2>${aside}</div>` : ''}${body}</section>`;
  }

  /* ---------- step illustrations (brand greens, drawn inline) ---------- */
  const ART = {
    business: `<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="86" cy="62" r="50" fill="#eef7f2"/>
      <rect x="44" y="52" width="26" height="50" rx="4" fill="#d8efe3"/><rect x="74" y="34" width="32" height="68" rx="4" fill="#136142"/><rect x="110" y="60" width="22" height="42" rx="4" fill="#25946a"/>
      <g fill="#fff" opacity=".85"><rect x="80" y="42" width="7" height="7" rx="1.5"/><rect x="93" y="42" width="7" height="7" rx="1.5"/><rect x="80" y="55" width="7" height="7" rx="1.5"/><rect x="93" y="55" width="7" height="7" rx="1.5"/><rect x="80" y="68" width="7" height="7" rx="1.5"/><rect x="93" y="68" width="7" height="7" rx="1.5"/><rect x="115" y="68" width="5" height="5" rx="1"/><rect x="123" y="68" width="5" height="5" rx="1"/><rect x="115" y="78" width="5" height="5" rx="1"/><rect x="123" y="78" width="5" height="5" rx="1"/></g>
      <g fill="#136142" opacity=".55"><rect x="50" y="60" width="5" height="5" rx="1"/><rect x="59" y="60" width="5" height="5" rx="1"/><rect x="50" y="70" width="5" height="5" rx="1"/><rect x="59" y="70" width="5" height="5" rx="1"/></g>
      <rect x="86" y="88" width="10" height="14" rx="2" fill="#fff"/><path d="M30 102h112" stroke="#d3dad5" stroke-width="2" stroke-linecap="round"/>
      <g class="onboarding-illustration-pin"><path d="M128 14c-9 0-15 7-15 15 0 11 15 24 15 24s15-13 15-24c0-8-6-15-15-15z" fill="#e0a526"/><circle cx="128" cy="29" r="5.5" fill="#fff"/></g></svg>`,
    profile: `<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="80" cy="62" r="50" fill="#eef7f2"/>
      <rect x="34" y="30" width="96" height="70" rx="12" fill="#fff" stroke="#d8efe3" stroke-width="2"/><path d="M34 42a12 12 0 0 1 12-12h72a12 12 0 0 1 12 12v6H34z" fill="#136142"/>
      <circle cx="58" cy="58" r="14" fill="#25946a" stroke="#fff" stroke-width="3"/><circle cx="58" cy="54" r="5" fill="#fff"/><path d="M49 66c2-5 5-7 9-7s7 2 9 7" fill="#fff"/>
      <rect x="78" y="54" width="38" height="6" rx="3" fill="#136142"/><rect x="78" y="65" width="26" height="5" rx="2.5" fill="#d3dad5"/>
      <rect x="46" y="80" width="30" height="10" rx="5" fill="#d8efe3"/><rect x="80" y="80" width="30" height="10" rx="5" fill="#d8efe3"/>
      <g class="onboarding-illustration-star"><circle cx="130" cy="30" r="13" fill="#e0a526"/><path d="m130 23 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fff"/></g>
      <path class="onboarding-illustration-spark" d="M24 30v8M20 34h8M140 94v6M137 97h6" stroke="#25946a" stroke-width="2" stroke-linecap="round"/></svg>`,
    verify: `<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="80" cy="62" r="50" fill="#eef7f2"/>
      <rect x="44" y="22" width="60" height="78" rx="8" fill="#fff" stroke="#d8efe3" stroke-width="2" transform="rotate(-6 74 61)"/>
      <g transform="rotate(-6 74 61)"><rect x="54" y="36" width="34" height="5" rx="2.5" fill="#136142"/><rect x="54" y="48" width="40" height="4" rx="2" fill="#d3dad5"/><rect x="54" y="57" width="36" height="4" rx="2" fill="#d3dad5"/><rect x="54" y="66" width="28" height="4" rx="2" fill="#d3dad5"/></g>
      <g class="onboarding-illustration-shield"><path d="M112 44l22 8v16c0 15-10 24-22 28-12-4-22-13-22-28V52z" fill="#136142"/><path d="m102 70 7 7 13-14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g><rect x="30" y="76" width="22" height="18" rx="4" fill="#e0a526"/><path d="M35 76v-5a6 6 0 0 1 12 0v5" fill="none" stroke="#e0a526" stroke-width="3"/><circle cx="41" cy="85" r="2.5" fill="#fff"/></g></svg>`
  };
  const hero = (title, sub, art) => `<div class="onboarding-hero"><div><h1 class="onboarding-title">${title}</h1><p class="onboarding-subtitle">${sub}</p></div><div class="onboarding-illustration">${ART[art]}</div></div>`;

  /* ---------- step 1: your business — what it does (location belongs to each listing) ---------- */
  function stepBusiness() {
    const cats = VERTICALS[S.v].offers, only = companyOnly(S);
    const why = esc(COMPANY_ONLY.includes(S.v) ? VERTICALS[S.v].label : S.cats.filter(c => COMPANY_CATS.includes(c)).map(offerLabel).join(' and '));
    const countryPick = `<label class="onboarding-country" title="Country of registration">${country().flag}<select data-country aria-label="Country">${MARKETS.COUNTRIES.map(x => `<option value="${x.iso}" ${x.iso === S.country ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>${ico('chev')}</label>`;
    // city of the business, next to the country (known cities as a list, any other city typed in)
    const cities = Object.keys(M().cities || {});
    const cityPick = cities.length
      ? `<label class="onboarding-country onboarding-city ${errors.city ? 'has-error' : ''}" title="City">${ico('pin')}<select data-city aria-label="City"><option value="">City</option>${cities.map(c => `<option ${S.d.city === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}<option value="__other" ${S.d.city && !cities.includes(S.d.city) ? 'selected' : ''}>Other…</option></select>${ico('chev')}</label>${S.d.city && !cities.includes(S.d.city) || A.otherCity ? `<input class="onboarding-city-input" data-cityin placeholder="Type your city" value="${esc(cities.includes(S.d.city) ? '' : S.d.city || '')}">` : ''}`
      : `<input class="onboarding-city-input ${errors.city ? 'has-error' : ''}" data-cityin placeholder="City" value="${esc(S.d.city || '')}">`;
    const pick = `<span class="onboarding-where">${countryPick}${cityPick}</span>`;
    let html = hero('Tell us about your business', `${firstName() ? `Hi ${esc(firstName())}! ` : ''}A few quick taps — your answers decide which documents we ask for.`, 'business');
    html += sec('what', 'What kind of business is it?', `<div class="onboarding-verticals">${verticalsInOrder().map(v => `<button type="button" class="onboarding-tile ${S.v === v ? 'is-active' : ''}" data-vert="${v}"><i>${ico(VERTICALS[v].icon)}</i><span>${esc(VERTICALS[v].label)}</span></button>`).join('')}</div>`);
    html += sec('list', 'What do you offer?', `<div class="onboarding-categories ${errors.cats ? 'has-error' : ''}">${cats.map(o => { const on = S.cats.includes(o.id); return `<button type="button" class="onboarding-chip ${on ? 'is-active' : ''}" data-cat="${o.id}">${ico(o.icon || UPF.OICO[o.id] || VERTICALS[S.v].icon)}<span>${esc(o.label)}</span><span class="onboarding-tick">${ico('check')}</span></button>`; }).join('')}</div>${err('cats')}`, '<small>Choose all that apply</small>');
    if (S.cats.length) {
      html += only ? `<p class="onboarding-business-only">${ico('building')}<span>${why} can only be listed by a licensed business, so you'll join as a <b>company</b> with a valid trade licence.</span></p>`
        : sec('as', 'Are you an individual or a company?', `<div class="onboarding-roles ${errors.role ? 'has-error' : ''}">${ROLES.map(([id, t, sub, icon]) => `<button type="button" class="onboarding-role ${S.role === id ? 'is-active' : ''}" data-role="${id}"><i>${ico(icon)}</i><span><b>${esc(t)}</b><small>${esc(sub)}</small></span><span class="onboarding-radio"></span></button>`).join('')}</div>${err('role')}`);
    }
    // one question at a time: the business type only once what you offer and individual / company are answered
    if (S.cats.length && S.role && typesOf(S).length) {
      const types = typesOf(S);
      html += sec('kind', isBiz(S) ? 'Which best describes your company?' : 'Which best describes you?', `<div class="onboarding-roles ${types.length > 2 ? 'is-grid' : ''} ${errors.sub ? 'has-error' : ''}">${types.map(t => `<button type="button" class="onboarding-role ${S.sub === t.id ? 'is-active' : ''}" data-sub="${t.id}"><i>${ico(t.icon)}</i><span><b>${esc(t.t)}</b><small>${esc(t.sub)}</small></span><span class="onboarding-radio"></span></button>`).join('')}</div>${err('sub')}`);
      const t = typeOf(S);
      // one block: sizing question(s) + where you're based, all as "question · answer" rows
      if (t) html += sec('size', 'A few details', '<div class="onboarding-details">' + t.size.map(([k, q, opts]) => `<div class="onboarding-size ${errors['size_' + k] ? 'has-error' : ''}"><span>${esc(q)}</span><div class="onboarding-segmented-control">${opts.map(o => `<button type="button" class="${S.d['size_' + k] === o ? 'is-active' : ''}" data-size="${k}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>${err('size_' + k)}</div>`).join('')
        + `<div class="onboarding-size onboarding-based-in ${errors.city ? 'has-error' : ''}"><span>Where are you based?</span>${pick}${err('city')}</div></div>`);
    }

    return html;
  }

  /* ---------- step 2: verify — documents first, the details come from them ---------- */
  // a detail read from a document: editable, with where it came from
  function xField([k, label, kind]) {
    const v = S.d[k] || '', src = S.src[k], edited = src && S.orig && S.orig[k] !== undefined && S.orig[k] !== v;
    const tag = !src ? '' : edited ? `<em class="onboarding-tag is-edit">${ico('pen')}Edited by you</em>`
      : src === 'missing' && !v ? `<em class="onboarding-tag is-miss">Not on the document — please add</em>`
      : src === 'check' ? `<em class="onboarding-tag is-check">Double-check this</em>`
      : src === 'missing' ? `<em class="onboarding-tag is-edit">${ico('pen')}Added by you</em>` : `<em class="onboarding-tag is-from-document">${ico('doc')}From your document</em>`;
    const bad = kind === 'date' && expired(v);
    return `<div class="field onboarding-field onboarding-extracted-field ${kind === 'wide' ? 'is-wide' : ''} ${errors[k] || bad ? 'has-error' : ''} ${src === 'missing' && !v ? 'is-missing' : ''} ${src === 'check' && !edited ? 'is-check' : ''}" data-f="${k}">
      <label for="onboarding-${k}">${esc(label)}${tag}</label>${kind === 'date' || kind === 'issued' ? `<input type="date" class="onboarding-date" id="onboarding-${k}" data-k="${k}" value="${esc(isoDate(v))}">` : `<input id="onboarding-${k}" data-k="${k}" value="${esc(v)}">`}${bad ? `<span class="onboarding-error">${ico('x')}This document has expired — upload a current one</span>` : err(k)}</div>`;
  }
  // a document: reading → details to check → once checked, one quiet summary line (Edit opens it again)
  function docCard(doc) {
    const f = S.docs[doc.id], st = f && f.state;
    const replace = `<label class="onboarding-document-replace">Replace<input type="file" accept="image/*,.pdf" data-doc="${doc.id}" hidden></label>`;
    if (st === 'read' && f.ok && !A.open[doc.id]) {
      const vals = doc.fields.map(([k, , kind]) => kind === 'date' ? S.d[k] && 'valid to ' + niceDate(S.d[k]) : S.d[k]).filter(Boolean).slice(0, 3).join(' · ');
      return `<div class="onboarding-document is-done is-compact" data-docid="${doc.id}"><div class="onboarding-document-header"><i>${ico('check')}</i><span><b>${esc(doc.t)}</b><small>${esc(vals)}</small></span>
        <button type="button" class="text-link" data-docedit="${doc.id}">Edit</button></div></div>`;
    }
    const head = `<div class="onboarding-document-header"><i>${ico('doc')}</i><span><b>${esc(doc.t)}</b><small>${st ? esc(f.name) : esc(doc.hint)}</small></span>
      ${st === 'scan' ? '<em class="is-scan">Reading…</em>' : st === 'read' ? replace : `<em class="${doc.req ? 'is-req' : ''}">${doc.req ? 'Required' : 'Optional'}</em>`}</div>`;
    let body = '';
    if (st === 'scan') body = `<div class="onboarding-scan" aria-live="polite"><div class="onboarding-scan-document"><i></i><i></i><i></i><i></i><span class="onboarding-scan-beam"></span></div>
        <div><b>Reading your document…</b><small>A few seconds</small></div></div>`;
    if (st === 'read') {
      const found = doc.fields.filter(([k]) => S.src[k] && S.src[k] !== 'missing').length;
      body = `<div class="onboarding-extracted"><p class="onboarding-extracted-header">${ico('spark')}<span>We filled in ${found} of ${doc.fields.length} details — check them against your document.</span></p>
        <div class="onboarding-extracted-grid">${doc.fields.map(xField).join('')}</div>
        <label class="onboarding-extracted-confirm ${errors['ok_' + doc.id] ? 'has-error' : ''}"><input type="checkbox" data-docok="${doc.id}" ${f.ok ? 'checked' : ''}><span>Everything matches my document</span></label>${err('ok_' + doc.id)}</div>`;
    }
    const drop = !f ? `<label class="onboarding-dropzone"><input type="file" accept="image/*,.pdf" data-doc="${doc.id}" hidden><span class="onboarding-dropzone-empty">${ico('upload')}<span><b>Drag your file here or <u>browse</u></b><small>PDF, JPG or PNG</small></span></span></label>` : '';
    return `<div class="onboarding-document ${errors['doc_' + doc.id] ? 'has-error' : ''}" data-docid="${doc.id}">${head}${drop}${body}${err('doc_' + doc.id)}</div>`;
  }
  // "Also needed": a compact row until the document is uploaded (then it opens into the read-and-check card)
  function needRow(doc) {
    if (S.docs[doc.id]) return docCard(doc);
    // licences that may follow later don't ask for a decision: upload now, or simply continue
    return `<div class="onboarding-need ${errors['doc_' + doc.id] ? 'has-error' : ''}" data-docid="${doc.id}"><i>${ico({ eid: 'user', sig: 'user', passport: 'globe', sigPass: 'globe', visa: 'flag' }[doc.id] || 'shield')}</i>
      <span><b>${esc(doc.t)}</b><small>${esc(doc.hint)}</small>${err('doc_' + doc.id)}</span>
      ${doc.later ? '<em class="onboarding-need-tag">Now or later</em>' : !doc.req ? '<em class="onboarding-need-tag">Optional</em>' : ''}
      <label class="btn ${doc.later || !doc.req ? 'btn-outline' : 'btn-primary'} btn-sm onboarding-need-upload">${ico('upload')}Upload<input type="file" accept="image/*,.pdf" data-doc="${doc.id}" hidden></label></div>`;
  }
  function stepVerify() {
    const docs = docsFor(S); if (!docs.length) return `<p class="onboarding-subtitle">Choose your business type first.</p><button type="button" class="btn btn-outline" data-goto="1">Back to step 1</button>`;
    const main = docs[0], rest = docs.slice(1), f = S.docs[main.id];
    const mainCard = f ? docCard(main) : `<label class="onboarding-main-upload ${errors['doc_' + main.id] ? 'has-error' : ''}" data-docid="${main.id}"><input type="file" accept="image/*,.pdf" data-doc="${main.id}" hidden>
        <i>${ico('doc')}</i><span><b>Upload ${esc(/^your /i.test(main.t) ? 'your ' + main.t.slice(5) : 'your ' + (/^[A-Z][a-z]/.test(main.t) ? main.t[0].toLowerCase() + main.t.slice(1) : main.t))}</b><small>A photo or PDF — we'll read it and fill in the details for you</small>${err('doc_' + main.id)}</span><span class="btn btn-primary">Choose file</span></label>`;
    return `${hero(isBiz(S) ? 'Verify your business' : 'Verify your identity', `Upload your ${isBiz(S) ? 'licence' : 'ID'} — we fill in the details, you just check them.`, 'verify')}
      <div class="onboarding-known">${ico(VERTICALS[S.v].icon)}<span><b>${esc(typeOf(S) ? typeOf(S).t : roleOf(S) ? roleOf(S)[1] : '')}</b> · ${esc(VERTICALS[S.v].label)} · ${esc([S.d.city, country().name].filter(Boolean).join(', '))}</span><button type="button" class="text-link" data-goto="1">Change</button></div>
      <div class="onboarding-main-wrap">${mainCard}</div>
      ${rest.length ? sec('need', 'Also needed', `<p class="onboarding-need-subtitle">${rest.some(x => x.later) ? 'Documents marked “Now or later” can wait — related listings stay in draft until you add them.' : rest.every(x => !x.req) ? 'Optional, but they help us approve you faster.' : rest.every(x => x.req) ? 'We need these too before we can approve you.' : 'Upload the required ones to continue — optional ones help us approve you faster.'}</p><div class="onboarding-needs">${rest.map(needRow).join('')}</div>`) : ''}
      <p class="onboarding-private">${ico('lock')}<span>Your documents stay private. Customers only see a “Verified by ${esc(SITE.name)}” badge, and a real person reviews every application.</span></p>`;
  }

  /* ---------- step 3: profile — only what the documents can't tell us ---------- */
  const legalName = () => isBiz(S) ? S.d.legal : (S.d.fullName || S.name);
  function kindOf() { const what = S.cats.length ? S.cats.map(offerLabel).filter(Boolean).slice(0, 2).join(' · ') : VERTICALS[S.v].label; const t = typeOf(S); return t ? `${t.t} · ${what}` : isBiz(S) ? `Licensed company · ${what}` : what; }
  // a first draft of the About text from the verified details — the provider edits it
  function aboutStarter() {
    const d = S.d, and = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
    const langs = and(d.langs && d.langs.length ? d.langs : ['English']), city = d.city || country().name;
    const list = (and(S.cats.map(offerLabel).filter(Boolean).map(x => x.toLowerCase())) || VERTICALS[S.v].label.toLowerCase()) + (S.v === 'spaces' ? ' property' : '');
    const name = d.display || d.trade;
    if (isBiz(S)) return `${name ? name + ' is' : 'We are'} a licensed business in ${city} offering ${list}. We reply quickly on WhatsApp and by phone, in ${langs}.`;
    return `I'm ${firstName() || 'a verified provider'}, offering ${list} in ${city}. I reply quickly on WhatsApp and by phone, and speak ${langs}.`;
  }
  // languages: tags + type to add (themed suggestions) + a few one-tap picks
  function langPicker() {
    const cur = S.d.langs || [], left = LANGS.filter(l => !cur.includes(l)), full = cur.length >= MAX_LANGS;
    return `<div class="onboarding-tags onboarding-languages ${errors.langs ? 'has-error' : ''}">${cur.map(l => `<span class="loc-token">${esc(l)}<button type="button" data-rmlang="${esc(l)}" aria-label="Remove ${esc(l)}">${ico('x')}</button></span>`).join('')}
        ${full ? '' : `<input id="onboarding-lang" data-langinput list="onboarding-langlist" placeholder="${cur.length ? 'Add another' : 'Type a language'}" autocomplete="off"><datalist id="onboarding-langlist">${left.map(l => `<option value="${esc(l)}">`).join('')}</datalist>`}</div>
      ${full ? '' : `<div class="onboarding-quick">${left.slice(0, 3).map(l => `<button type="button" data-addlang="${esc(l)}">${ico('plus')}${esc(l)}</button>`).join('')}</div>`}${err('langs')}`;
  }
  function addLang(v) {
    const l = LANGS.find(x => x.toLowerCase() === String(v).trim().toLowerCase()) || (String(v).trim() && String(v).trim()[0].toUpperCase() + String(v).trim().slice(1));
    const cur = S.d.langs || [];
    if (!l || cur.includes(l)) return;
    if (cur.length >= MAX_LANGS) { toast(`Up to ${MAX_LANGS} languages`); return; }
    S.d.langs = [...cur, l]; delete errors.langs; commit();
    const i = document.getElementById('onboarding-lang'); if (i) { i.value = ''; i.focus({ preventScroll: true }); }
  }
  // compact: photo + name on one row, about, then languages / contact / hours as tight rows (no extra banners)
  function stepProfile() {
    const d = S.d, biz = isBiz(S), bio = d.bio || '';
    if (!d.display) d.display = (biz ? d.trade || d.legal : d.fullName || S.name) || ''; // start from the document
    const shown = d.display || S.name || '?';
    return `<div class="onboarding-profile">${hero('Set up your public profile', 'This is what customers see. You can change it any time.', 'profile')}
      ${sec('who', '', `<div class="onboarding-id-card">
        <label class="onboarding-avatar-upload ${biz ? 'is-logo' : ''} ${d.photo ? 'has-photo' : ''}" title="${d.photo ? 'Change' : 'Add'} ${biz ? 'logo' : 'photo'}">
          <input type="file" accept="image/*" data-photo hidden>${d.photo ? `<img src="${d.photo}" alt="">` : `<span class="onboarding-avatar-initials">${esc(initials(shown) || '?')}</span>`}<span class="onboarding-camera">${ico('camera')}</span></label>
        <div class="onboarding-id-card-text">${text('display', 'Display name', biz ? 'Your brand or trading name' : 'Your full name')}
          <small class="onboarding-id-card-tip">${d.photo ? `<button type="button" class="text-link" data-act="rmphoto">Remove ${biz ? 'logo' : 'photo'}</button>` : `${ico('camera')}Add a ${biz ? 'logo' : 'photo'} — profiles with one get more enquiries`}</small></div>
      </div>`)}
      ${sec('about', 'About', `<div class="onboarding-field onboarding-about ${errors.bio ? 'has-error' : ''}" data-f="bio">
          <textarea id="onboarding-bio" data-k="bio" maxlength="600" placeholder="Tell customers what you do and why they should choose you…">${esc(bio)}</textarea>
          <div class="onboarding-about-footer"><button type="button" class="onboarding-magic-write" data-act="starter">${ico('spark')}${bio ? 'Rewrite it for me' : 'Write it for me'}</button><span class="onboarding-count ${bio.trim().length >= 60 ? 'is-ok' : ''}" data-bio-count>${bio.length < 60 ? `${bio.length}/60 min` : `${bio.length}/600`}</span></div>${err('bio')}</div>`)}
      ${sec('langs', 'Languages', langPicker())}
      ${sec('reach', 'Contact', `<div class="onboarding-channels ${errors.channels ? 'has-error' : ''}">${CHANNELS.map(([id, t, i]) => `<button type="button" class="onboarding-channel-tile ${S.channels.includes(id) ? 'is-active' : ''}" data-ch="${id}"><i>${ico(i)}</i><span>${t}</span><span class="onboarding-tick">${ico('check')}</span></button>`).join('')}</div>${err('channels')}`,
        `<div class="onboarding-hours"><span>${ico('clock')}Available</span><div class="onboarding-segmented-control">${HOURS.map(([id, t]) => `<button type="button" class="${S.hours === id ? 'is-active' : ''}" data-hours="${id}">${t}</button>`).join('')}</div></div>`)}</div>`;
  }


  /* ---------- submit: a short confirmation, not a review page ---------- */
  function confirmSubmit() {
    const d = S.d, biz = isBiz(S), main = docsFor(S)[0], t = typeOf(S);
    const idNo = biz ? d.licence : d.eidNo, until = biz ? d.expiry : d.eidExp;
    const later = docsFor(S).filter(x => x.later && x.req && !S.docs[x.id]);
    const shown = d.display || S.name || '';
    // one line per step, each saying something new (no name repeated three times)
    const item = (label, val, sub, step, lead = '') => `<div class="onboarding-confirm-item">${lead}<span><small>${label}</small><b>${val}</b>${sub ? `<em>${sub}</em>` : ''}</span><button type="button" class="onboarding-confirm-edit" data-cfgoto="${step}" aria-label="Edit ${label.toLowerCase()}">Edit</button></div>`;
    UPUI.openModal(`<div class="onboarding-confirm"><button class="close-btn onboarding-confirm-close" data-close aria-label="Close">${ico('x')}</button>
      <span class="onboarding-confirm-mark">${ico('shield')}</span>
      <h3>Send for review?</h3>
      <p class="onboarding-confirm-subtitle">Our team checks your details against your ${biz ? 'licence' : 'ID'} — usually within 24 hours. Nothing goes live until you're approved.</p>
      <div class="onboarding-confirm-summary">
        ${item('You’ll list', esc([S.cats.map(offerLabel).filter(Boolean).join(', ') || VERTICALS[S.v].label].join('')), esc(t ? t.t : ''), 1, `<span class="onboarding-confirm-avatar">${ico(VERTICALS[S.v].icon)}</span>`)}
        ${item('Verified with', esc(main ? main.t.replace(/^your /i, '').replace(/^./, c => c.toUpperCase()) : 'Your document'), esc([idNo && 'ending ' + String(idNo).replace(/[^0-9A-Za-z]/g, '').slice(-4), until && 'valid to ' + niceDate(until), biz && d.legal].filter(Boolean).join(' · ')), 2, `<span class="onboarding-confirm-avatar">${ico(biz ? 'doc' : 'user')}</span>`)}
        ${item('Customers see', esc(shown), esc([(d.langs || []).join(', '), d.photo ? '' : `No ${biz ? 'logo' : 'photo'} yet`].filter(Boolean).join(' · ')), 3,
          `<span class="onboarding-confirm-avatar">${d.photo ? `<img src="${d.photo}" alt="">` : esc(initials(shown) || '?')}</span>`)}
      </div>
      ${later.length ? `<p class="onboarding-confirm-later">${ico('clock')}<span>You can add your ${esc(later.map(x => x.t).join(', '))} later — those listings wait in draft until approved.</span></p>` : ''}
      <label class="onboarding-confirm-agree"><input type="checkbox" data-cfagree ${S.agree ? 'checked' : ''}><span>These details are correct${biz ? `, I'm authorised to act for ${esc(d.legal || 'this business')}` : ''} and I agree to the <a class="text-link" href="#" onclick="return false">Provider terms</a>.</span></label>
      <button type="button" class="btn btn-primary onboarding-confirm-submit" data-cfsubmit ${S.agree ? '' : 'disabled'}>Send for review</button>
      ${S.phone ? `<p class="onboarding-confirm-footer">${ico('wa')}We'll WhatsApp you on <span class="nowrap" style="white-space:nowrap">${S.dial || country().dial} ${esc(fmtPhone(S.phone))}</span> with the decision</p>`
        : S.email ? `<p class="onboarding-confirm-footer">${ico('mail')}We'll email ${esc(S.email)} with the decision</p>` : ''}</div>`, 'onboarding-confirm-modal');
  }
  document.addEventListener('change', e => {
    if (!e.target.matches('[data-cfagree]')) return;
    S.agree = e.target.checked; save();
    const b = document.querySelector('[data-cfsubmit]'); if (b) b.disabled = !S.agree;
  });
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-cfgoto]');
    if (g) { UPUI.closeModal(); go(+g.dataset.cfgoto); return; }
    if (e.target.closest('[data-cfsubmit]') && S.agree) { UPUI.closeModal(); S.status = 'submitted'; save(); A.dir = 'forward'; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  /* ---------- after submitting: under review ---------- */
  function stepSubmitted() {
    const bits = Array.from({ length: 18 }, (_, k) => { const a = k / 18 * Math.PI * 2, r = 70 + (k % 3) * 22; return `<span style="--x:${Math.round(Math.cos(a) * r)}px;--y:${Math.round(Math.sin(a) * r)}px;--r:${k * 47}deg;--d:${(k % 4) * 40}ms" class="c${k % 4}"></span>`; }).join('');
    return `<div class="onboarding-done"><div class="onboarding-done-mark"><span class="onboarding-confetti" aria-hidden="true">${bits}</span><span class="onboarding-done-icon"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span></div>
      <h1 class="onboarding-title">Application sent — we're on it</h1>
      <p class="onboarding-subtitle">Thanks${firstName() ? ', ' + esc(firstName()) : ''}. There's nothing else to do for now. We'll ${S.phone ? `WhatsApp you on <span style="white-space:nowrap">${S.dial || country().dial} ${esc(fmtPhone(S.phone))}</span>` : S.email ? `email ${esc(S.email)}` : 'let you know'} as soon as there's a decision — usually within 24 hours.</p>
      <ol class="onboarding-timeline"><li class="is-done" style="--i:0"><i>${ico('check')}</i><span><b>Details checked</b><small>You confirmed what we read from your documents</small></span></li>
        <li class="is-done" style="--i:1"><i>${ico('check')}</i><span><b>Application sent</b><small>We have everything we need</small></span></li>
        <li class="is-now" style="--i:2"><i>3</i><span><b>Team review</b><small>We're checking your ${isBiz(S) ? 'licence and signatory ID' : 'ID'}</small></span></li>
        <li style="--i:3"><i>4</i><span><b>You're approved</b><small>Then you can add your first ${esc(VERTICALS[S.v].label)} listing</small></span></li></ol>
      <div class="onboarding-done-actions"><a class="btn btn-outline" href="${PATHS.href.home}">Back to ${esc(SITE.name)}</a></div>
      ${S.email ? `<p class="onboarding-done-note">We've emailed a copy to <b>${esc(S.email)}</b></p>` : ''}</div>`;
  }

  /* ---------- progress: one line + three segments that fill as you answer ---------- */
  function partsDone(n) {
    const d = S.d;
    if (n === 1) return [S.cats.length, S.role, typeOf(S), ...(typeOf(S) ? typeOf(S).size.map(([k]) => S.d['size_' + k]) : [0])];
    if (n === 2) return docsFor(S).filter(x => x.req).map(settled);
    return [String(d.display || '').trim(), String(d.bio || '').trim().length >= 60, (d.langs || []).length, S.channels.length]; // photo is optional: not counted
  }
  // a bar shows how much of its own step is answered — steps you haven't reached yet stay empty
  const fillOf = n => n > S.step ? 0 : (p => p.length ? p.filter(Boolean).length / p.length : n < S.step ? 1 : 0)(partsDone(n));
  function stepSummary(n) {
    if (n === 1) return [VERTICALS[S.v].label, typeOf(S) ? typeOf(S).t : roleOf(S) && roleOf(S)[1]].filter(Boolean).join(' · ');
    if (n === 2) return legalName() || '';
    if (n === 3) return [S.d.display, S.d.photo && 'photo'].filter(Boolean).join(' · ');
    return '';
  }
  const progress = () => `<div class="onboarding-header"><div class="onboarding-progress"><span><b>Step ${S.step} of ${LAST}</b> · ${STEPS[S.step - 1][0]}</span><span>About ${MINUTES[S.step - 1]} min left</span></div>
    <ol class="onboarding-step-bar">${STEPS.map(([t], k) => { const n = k + 1, st = n < S.step ? 'is-done' : n === S.step ? 'is-now' : '', tag = n < S.step ? 'button' : 'span';
      return `<li class="${st}"><${tag} ${n < S.step ? `type="button" data-goto="${n}" title="Edit ${t}"` : ''}><i><b style="width:${Math.round(A.fill[k] * 100)}%" data-w="${Math.round(fillOf(n) * 100)}%"></b></i><small>${n < S.step && fillOf(n) === 1 ? ico('check') : ''}${t}</small>${n < S.step && stepSummary(n) ? `<em>${esc(stepSummary(n))}</em>` : ''}</${tag}></li>`; }).join('')}</ol></div>`;

  /* ---------- live profile preview (right column) ---------- */
  function card() {
    const d = S.d, biz = isBiz(S);
    const shown = d.display || (biz ? d.trade || d.legal : d.fullName) || S.name || 'Your name';
    const kind = kindOf();
    const hue = [...shown].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 140);
    const NATIVE = (window.DM && DM.NATIVE) || {};
    const langs = (d.langs || []).map(x => NATIVE[x] || x);
    const hours = (HOURS.find(h => h[0] === S.hours) || HOURS[1])[1];
    const has = c => S.channels.includes(c);
    const footName = biz ? (d.legal || d.display || 'Your company') : shown;
    const footSub = biz ? [d.licence && 'Licence ' + d.licence, d.authority].filter(Boolean).join(' · ') || 'Licensed company' : 'Individual provider';
    const allLabel = 'View all listings';
    const action = (icon, t, sub) => `<span class="agent-action">${ico(icon)}<span><b>${t}</b><small>${sub}</small></span>${ico('chevR', 'chevron')}</span>`;
    const alt = (cls, icon, t) => `<span class="agent-alt-action ${cls}">${icon}<span><b>${t}</b></span>${ico('chevR', 'chevron')}</span>`;
    const main = [has('call') && action('phone', 'Call', 'Direct call'), has('wa') && action('wa', 'WhatsApp', 'Chat instantly')].filter(Boolean);
    const alts = [has('sms') && alt('is-sms', ico('msg'), 'SMS'), has('email') && alt('is-email', '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>', 'Email'),
      alt('is-chat', '<svg class="icon" viewBox="0 0 24 24"><path d="M12 4c4.97 0 9 3.36 9 7.5S16.97 19 12 19c-1.1 0-2.15-.16-3.12-.46L4 20l1.4-3.6C4.5 15.1 3 13.4 3 11.5 3 7.36 7.03 4 12 4z"/></svg>', 'Chat')].filter(Boolean);
    return `<div class="agent-card onboarding-agent-card" aria-hidden="true">
        <div class="agent-cover"><svg viewBox="0 0 400 46" preserveAspectRatio="none"><path d="M0 46 L0 30 C90 2 170 4 250 22 C320 38 370 30 400 16 L400 46Z" fill="#fff"/></svg></div>
        <div class="agent-top">
          <div class="agent-avatar ${d.photo ? 'has-photo' : ''}" style="--hue:${hue}">${d.photo ? `<img src="${d.photo}" alt="">` : esc(initials(shown) || '?')}<span class="agent-online"></span></div>
          <div class="agent-info"><div class="agent-name"><span>${esc(shown)}</span>${S.status === 'verified' ? `<span class="agent-verified">${ico('badge')}</span>` : ''}</div>
            <div class="agent-org">${esc(kind || 'Individual or company?')}</div></div>
        </div>
        <div class="agent-stats">
          <div><div class="stat-head"><svg class="icon is-star" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg><span class="stat-value">New</span></div><div class="stat-sub is-empty">No ratings yet</div></div>
          <div><div class="stat-head">${ico('clock')}Replies</div><div class="stat-sub"><b>${esc(hours)}</b></div></div>
          <div><div class="stat-head">${ico('globe')}<span>${esc(langs.slice(0, 2).join(' • ') || '—')}</span></div><div class="stat-langs">${langs.length > 2 ? esc(langs.slice(2).join(' • ')) : '0 active listings'}</div></div>
        </div>
        <div class="agent-body">
          ${main.length ? `<div class="agent-actions">${main.join('')}</div>` : ''}
          ${alts.length ? `<div class="agent-more">${main.length ? 'More ways to contact' : 'Contact'}</div><div class="agent-alt-actions">${alts.join('')}</div>` : ''}
        </div>
        <div class="agent-footer"><span class="agent-logo">${ico(biz ? 'office' : 'user')}</span><span class="agent-agency"><b>${esc(footName)}</b><small>${esc(footSub)}</small></span><span class="agent-view-all">${allLabel}${ico('chevR')}</span></div>
      </div>`;
  }
  function preview() {
    const docs = docsFor(S).filter(x => x.req), ok = docs.filter(settled).length;
    const status = S.status === 'submitted' ? `${ico('shield')}In review — your “Verified” badge appears once you're approved`
      : `${ico('shield')}Documents checked · ${ok}/${docs.length || '—'}<span class="onboarding-mini-progress"><span style="width:${docs.length ? Math.round(ok / docs.length * 100) : 0}%"></span></span>`;
    return `<div class="onboarding-preview"><div class="onboarding-preview-header">${ico('eye')}Live preview<span>Updates as you type</span></div>
      ${card()}
      <div class="onboarding-card-status ${S.status === 'submitted' ? 'is-review' : ''}">${status}</div>
      <ul class="onboarding-why"><li>${ico('shield')}<span><b>Verified once</b>One verification covers every category you list in.</span></li>
        <li>${ico('bolt')}<span><b>Leads in minutes</b>Customers call or WhatsApp you directly.</span></li>
        <li>${ico('tag')}<span><b>Deal directly</b>You agree prices and payments with the customer.</span></li></ul></div>`;
  }

  /* ---------- validation ---------- */
  function validate(step) {
    const e = {}, d = S.d;
    if (step === 1) {
      if (!S.cats.length) e.cats = 'Pick at least one thing you offer';
      else if (!S.role) e.role = 'Tell us if you’re an individual or a company';
      else if (!typeOf(S)) e.sub = 'Pick the option that fits you best';
      else {
        typeOf(S).size.forEach(([k]) => { if (!S.d['size_' + k]) e['size_' + k] = 'Pick one'; });
        if (!String(S.d.city || '').trim()) e.city = 'Choose your city';
      }
    }
    if (step === 2) docsFor(S).forEach(doc => {
      const f = S.docs[doc.id];
      if (!f) { if (doc.req && !doc.later) e['doc_' + doc.id] = 'Upload this document to continue'; return; }
      if (f.state !== 'read') return;
      doc.fields.forEach(([k, , kind]) => { if (!String(d[k] || '').trim()) e[k] = 'This can’t be empty'; else if (kind === 'date' && expired(d[k])) e[k] = 'This date has passed — upload a current document'; });
      if (!f.ok) e['ok_' + doc.id] = 'Check the details, then tick this box';
    });
    if (step === 3) {
      if (!String(d.display || '').trim()) e.display = 'Add the name customers will see';
      if (String(d.bio || '').trim().length < 60) e.bio = 'Add a little more — at least 60 characters, or tap “Write it for me”';
      if (!(d.langs || []).length) e.langs = 'Add at least one language';
      if (!S.channels.length) e.channels = 'Choose at least one way customers can reach you';
    }
    return e;
  }

  /* ---------- in-place update ----------
     A click inside a step changes a few classes and texts, so the new markup is merged into the page instead of
     replacing it: nothing re-animates or reloads (images, entrance fades), CSS transitions run, focus and scroll stay. */
  const keyOf = n => n.nodeType === 1 && (n.id || n.dataset.sec || n.dataset.docid) ? n.tagName + ':' + (n.id || n.dataset.sec || n.dataset.docid) + ':' + (n.className.split(' ')[0] || '') : '';
  const sameKind = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || a.tagName === b.tagName);
  function morph(from, to) {
    if (from.nodeType === 3 || from.nodeType === 8) { if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue; return; }
    for (const { name } of [...from.attributes]) if (!to.hasAttribute(name)) from.removeAttribute(name);
    for (const { name, value } of [...to.attributes]) if (from.getAttribute(name) !== value) from.setAttribute(name, value);
    const tag = from.tagName, focused = from === document.activeElement;
    if (tag === 'INPUT') {
      if (from.type === 'checkbox' || from.type === 'radio') from.checked = to.hasAttribute('checked');
      else if (from.type !== 'file' && !focused && from.value !== (to.getAttribute('value') || '')) from.value = to.getAttribute('value') || '';
      return;
    }
    if (tag === 'TEXTAREA') { if (!focused && from.value !== to.textContent) from.value = to.textContent; return; }
    const want = tag === 'SELECT' ? ([...to.options].find(o => o.hasAttribute('selected')) || to.options[0] || {}).value : null;
    morphKids(from, to);
    if (tag === 'SELECT' && want != null && from.value !== want) from.value = want;
  }
  function morphKids(from, to) {
    const keyed = new Map();
    [...from.childNodes].forEach(k => { const key = keyOf(k); if (key) keyed.set(key, k); });
    let i = 0;
    for (const nk of [...to.childNodes]) {
      const cur = from.childNodes[i], key = keyOf(nk);
      let match = null;
      if (key) { match = keyed.get(key) || null; keyed.delete(key); }
      else if (cur && !keyOf(cur) && sameKind(cur, nk)) match = cur;
      if (match) { if (match !== cur) from.insertBefore(match, cur || null); morph(match, nk); }
      else from.insertBefore(nk, cur || null);
      i++;
    }
    while (from.childNodes.length > i) from.lastChild.remove();
  }
  function paint(html, whole) {
    const t = document.createElement('div'); t.innerHTML = html;
    if (whole || !root.firstElementChild || !t.firstElementChild || root.firstElementChild.className.split(' ')[0] !== t.firstElementChild.className.split(' ')[0]) root.innerHTML = html;
    else morphKids(root, t);
  }

  /* ---------- render ---------- */
  const root = document.getElementById('ob');
  // signed out: an empty step 1 sits behind the sign-in modal (never a previous visitor's draft); any click opens sign-in
  function render() {
    const acc = document.querySelector('.onboarding-top [data-auth-slot]'); if (acc && UPUI.accountButton) acc.outerHTML = UPUI.accountButton();
    if (fromAccount()) return draw(false);
    const keep = S, keepErr = errors;
    S = fresh(); errors = {};
    try { draw(true); } finally { S = keep; errors = keepErr; }
  }
  function draw(locked) {
    const scroller = root.querySelector('.onboarding-scroll'), keep = !A.dir && scroller ? scroller.scrollTop : 0, winY = scrollY;
    const before = new Set([...root.querySelectorAll('.onboarding-step [data-sec]')].map(x => x.dataset.sec));
    if (A.dir) A.entering = true;
    A.revealed = '';
    const flow = S.status === 'draft', done = !flow;
    const body = S.status === 'submitted' ? stepSubmitted() : [stepBusiness, stepVerify, stepProfile][S.step - 1]();
    const pv = preview();
    const wasMode = root.firstElementChild && root.firstElementChild.dataset.mode;
    paint(`<div class="onboarding-grid ${done ? 'is-done' : ''} ${locked ? 'is-locked' : ''}" data-mode="${S.status}"><main class="onboarding-main">
      ${flow ? progress() : ''}
      <div class="onboarding-panel ${done ? 'is-done' : ''}"><div class="onboarding-scroll"><div class="onboarding-step ${A.dir ? 'is-in-' + A.dir : ''}">${body}</div></div>
        ${done ? '' : `<div class="onboarding-nav">${S.step > 1 ? `<button type="button" class="btn btn-ghost" data-act="back">${ico('chevL')}Back</button>` : '<span></span>'}
          <span class="onboarding-save ${A.saved ? 'is-on' : ''}">${ico('check')}Draft saved</span>
          ${locked ? `<button type="button" class="btn btn-primary onboarding-next" data-act="signin">Continue with your mobile${ico('chevR')}</button>` : `<button type="button" class="btn btn-primary onboarding-next" data-act="next">${S.step === LAST ? 'Review and send' : 'Continue'}${ico('chevR')}</button>`}</div>`}</div>
    </main>
      <aside class="onboarding-aside ${previewOpen ? 'is-open' : ''}"><button type="button" class="onboarding-preview-toggle" data-act="preview">${ico('eye')}<span>${previewOpen ? 'Hide profile preview' : 'Preview your profile'}</span>${ico('chev')}</button>${pv}</aside></div>`, !!A.dir || (wasMode && wasMode !== S.status));
    // motion: keep the reading position, fill the bar, spring the control just picked, bring a new part into view
    const sc = root.querySelector('.onboarding-scroll');
    if (sc && keep) sc.scrollTop = keep;
    if (!A.dir) scrollTo(0, winY);
    const bars = [...root.querySelectorAll('.onboarding-step-bar [data-w]')];
    requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach(b => { b.style.width = b.dataset.w; })));
    A.fill = STEPS.map((_, k) => fillOf(k + 1));
    if (A.pop) { const p = root.querySelector(A.pop); if (p) p.classList.add('is-pop'); }
    // a question that just opened (after an answer, same step): bring it into view inside the card (or the page on phones)
    const opened = !A.dir && before.size ? [...root.querySelectorAll('.onboarding-step [data-sec]')].find(x => !before.has(x.dataset.sec)) : null;
    if (opened) setTimeout(() => {
      const box = root.querySelector('.onboarding-scroll'), inner = box && getComputedStyle(box).overflowY === 'auto';
      const behavior = calm.matches ? 'auto' : 'smooth';
      if (inner) {
        const r = opened.getBoundingClientRect(), b = box.getBoundingClientRect();
        // show the whole new section if it fits, otherwise its top
        const gap = 16, over = r.bottom - b.bottom + gap;
        if (over > 0 || r.top < b.top) box.scrollBy({ top: Math.min(over > 0 ? over : r.top - b.top - gap, r.top - b.top - gap), behavior });
      } else opened.scrollIntoView({ block: 'nearest', behavior });
    }, 140);
    if (A.preview && A.preview !== pv && !A.dir) { const c = root.querySelector('.onboarding-preview .agent-card'); if (c) c.classList.add('is-bump'); }
    fitBio();
    A.preview = pv; A.pop = ''; A.dir = ''; A.entering = false; A.saved = false;
  }
  // after a change in the current step: save, show "Saved", redraw
  function commit(pop) { A.pop = pop || ''; A.saved = true; save(); render(); }
  // the About box grows with its text (field-sizing where supported, by hand elsewhere)
  function fitBio() { const b = document.getElementById('onboarding-bio'); if (!b || CSS.supports('field-sizing', 'content')) return; b.style.height = 'auto'; b.style.height = b.scrollHeight + 'px'; }
  function flashSaved() { const s = root.querySelector('.onboarding-save'); if (!s) return; s.classList.remove('is-on'); void s.offsetWidth; s.classList.add('is-on'); }
  function refreshPreview() {
    const p = root.querySelector('.onboarding-preview'); if (!p) return;
    const pv = preview(); if (pv === A.preview) return;
    const t = document.createElement('div'); t.innerHTML = pv; morph(p, t.firstElementChild); A.preview = pv;
    root.querySelectorAll('.onboarding-step-bar [data-w]').forEach((b, k) => { b.style.width = Math.round(fillOf(k + 1) * 100) + '%'; });
  }

  function go(step) {
    A.dir = step > S.step ? 'forward' : 'back';
    S.step = step; errors = {}; save(); render();
    window.scrollTo({ top: 0, behavior: calm.matches ? 'auto' : 'smooth' });
  }
  function next() {
    errors = validate(S.step);
    if (Object.keys(errors).length) {
      render();
      const f = root.querySelector('.has-error'); if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.classList.add('is-shake'); }
      return;
    }
    if (S.step < LAST) return go(S.step + 1);
    confirmSubmit();
  }

  // "Write it for me": the draft types itself in
  function typeAbout(textValue) {
    const ta = document.getElementById('onboarding-bio'); if (!ta) return;
    const box = ta.closest('.onboarding-about'), count = root.querySelector('[data-bio-count]');
    const show = v => { ta.value = v; S.d.bio = v; fitBio(); if (count) { count.textContent = v.length < 60 ? `${v.length}/60 min` : `${v.length}/600`; count.classList.toggle('is-ok', v.trim().length >= 60); } };
    delete errors.bio; box.classList.remove('has-error'); const m = box.querySelector('.onboarding-error'); if (m) m.remove();
    if (calm.matches) { show(textValue); save(); refreshPreview(); return; }
    box.classList.add('is-typing');
    let i = 0; const stepBy = Math.max(2, Math.ceil(textValue.length / 45));
    const tick = () => {
      i = Math.min(textValue.length, i + stepBy); show(textValue.slice(0, i));
      if (i < textValue.length) requestAnimationFrame(tick);
      else { box.classList.remove('is-typing'); save(); flashSaved(); refreshPreview(); ta.focus(); ta.setSelectionRange(i, i); }
    };
    tick();
  }

  function setPhoto(f) {
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const size = 240, c = document.createElement('canvas'), k = Math.max(size / img.width, size / img.height);
      c.width = c.height = size;
      const w = img.width * k, h = img.height * k;
      c.getContext('2d').drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      S.d.photo = c.toDataURL('image/jpeg', .82); URL.revokeObjectURL(url); commit('.onboarding-avatar-upload');
    };
    img.src = url;
  }
  // upload → read the document → fill what was found (never over something the provider typed) → provider confirms
  function setDoc(id, f) {
    const kb = f.size / 1024, doc = docsFor(S).find(x => x.id === id); if (!doc) return;
    S.docs[id] = { name: f.name, size: kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB', state: 'scan', ok: false };
    delete errors['doc_' + id];
    save(); render();
    if (calm.matches) readInto(id); else setTimeout(() => readInto(id), 1700);
  }
  function readInto(id) {
    const doc = docsFor(S).find(x => x.id === id);
    if (!doc || !S.docs[id] || S.docs[id].state !== 'scan') return;
    const got = readDoc(id); S.orig = S.orig || {};
    doc.fields.forEach(([k, , kind]) => {
      let v = got[k] == null ? '' : String(got[k]); const unsure = v.startsWith('?'); if (unsure) v = v.slice(1);
      if (kind === 'date' || kind === 'issued') v = isoDate(v);
      if (S.src[k] && S.orig[k] !== S.d[k] && S.d[k]) return; // keep the provider's own edit
      S.d[k] = v; S.orig[k] = v; S.src[k] = !v ? 'missing' : unsure ? 'check' : 'doc';
    });
    S.docs[id].state = 'read'; commit(`[data-docid="${id}"]`);
  }

  // the name on the confirmed ID becomes the account name (providers don't type it at sign-up)
  function nameFromId() {
    const full = String(S.d.fullName || S.d.sigName || '').trim(); if (!full || !auth.setName) return;
    const parts = full.split(/\s+/); auth.setName(parts[0], parts.slice(1).join(' '));
  }

  /* ---------- events ---------- */
  root.addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return;
    S.d[k] = e.target.value;
    if (errors[k]) { delete errors[k]; const f = e.target.closest('.onboarding-field'); if (f) { f.classList.remove('has-error'); const m = f.querySelector('.onboarding-error'); if (m) m.remove(); } }
    save(); flashSaved(); refreshPreview();
    if (k === 'bio') fitBio();
    if (k === 'bio') { const c = root.querySelector('[data-bio-count]'), v = e.target.value; if (c) { c.textContent = v.length < 60 ? `${v.length}/60 min` : `${v.length}/600`; c.classList.toggle('is-ok', v.trim().length >= 60); } }
    if (k === 'display') { const ini = root.querySelector('.onboarding-avatar-initials'); if (ini) ini.textContent = initials(e.target.value || S.name) || '?'; }
  });
  // leaving a document field: refresh its "From document / Edited" tag
  root.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('.onboarding-extracted-field')) render(); });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-city]')) { A.otherCity = t.value === '__other'; S.d.city = A.otherCity ? '' : t.value; delete errors.city; commit(); if (A.otherCity) { const c = root.querySelector('[data-cityin]'); if (c) c.focus(); } return; }
    if (t.matches('[data-cityin]')) { S.d.city = t.value.trim(); delete errors.city; commit(); return; }
    if (t.matches('[data-country]')) {
      // another country means other ID and licence documents: start the documents again
      S.country = t.value; S.d.city = ''; A.otherCity = false; S.docs = {}; S.src = {}; errors = {}; commit(); return;
    }
    if (t.matches('[data-langinput]')) { if (LANGS.some(l => l.toLowerCase() === t.value.trim().toLowerCase())) addLang(t.value); return; }
    if (t.matches('[data-docok]')) { const f = S.docs[t.dataset.docok]; if (f) { f.ok = t.checked; delete A.open[t.dataset.docok]; if (t.checked && ['eid', 'sig'].includes(t.dataset.docok)) nameFromId(); delete errors['ok_' + t.dataset.docok]; commit(`[data-docid="${t.dataset.docok}"]`); } return; }
    if (t.matches('[data-doc]') && t.files[0]) setDoc(t.dataset.doc, t.files[0]);
    if (t.matches('[data-photo]') && t.files[0]) setPhoto(t.files[0]);
  });
  root.addEventListener('toggle', e => { if (e.target.matches('.onboarding-more')) A.optOpen = e.target.open; }, true);
  // drag a file onto a document
  root.addEventListener('dragover', e => { const d = e.target.closest('.onboarding-document, .onboarding-avatar-upload, .onboarding-main-upload, .onboarding-need'); if (!d) return; e.preventDefault(); d.classList.add('is-drag'); });
  root.addEventListener('dragleave', e => { const d = e.target.closest('.onboarding-document, .onboarding-avatar-upload, .onboarding-main-upload, .onboarding-need'); if (d && !d.contains(e.relatedTarget)) d.classList.remove('is-drag'); });
  root.addEventListener('drop', e => {
    const d = e.target.closest('.onboarding-document, .onboarding-avatar-upload, .onboarding-main-upload, .onboarding-need'); if (!d) return; e.preventDefault(); const f = e.dataTransfer.files[0]; if (!f) return;
    if (d.matches('.onboarding-avatar-upload')) setPhoto(f); else setDoc(d.dataset.docid, f);
  });
  root.addEventListener('keydown', e => {
    if (e.target.matches('[data-langinput]')) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLang(e.target.value); }
      else if (e.key === 'Backspace' && !e.target.value && (S.d.langs || []).length) { S.d.langs = S.d.langs.slice(0, -1); commit(); const i = document.getElementById('onboarding-lang'); if (i) i.focus(); }
      return;
    }
    // Enter in a field: continue
    if (e.key === 'Enter' && !e.defaultPrevented && e.target.tagName === 'INPUT' && !e.target.matches('[type=checkbox]') && S.status === 'draft') { e.preventDefault(); next(); }
  });
  root.addEventListener('animationend', e => { if (e.target.classList) e.target.classList.remove('is-pop', 'is-bump', 'is-shake'); });
  function signIn() { auth.open({ intent: 'provider', onDone: () => { A.dir = 'forward'; render(); } }); }
  // signed out: the form behind the modal only reopens sign-in
  root.addEventListener('click', e => { if (!auth.user()) { e.preventDefault(); e.stopPropagation(); signIn(); } }, true);
  root.addEventListener('click', e => {
    const b = sel => e.target.closest(sel);
    let x;
    if ((x = b('[data-act]'))) {
      const a = x.dataset.act;
      if (a === 'next') next();
      else if (a === 'back') go(S.step - 1);
      else if (a === 'preview') { previewOpen = !previewOpen; render(); }
      else if (a === 'signin') signIn();
      else if (a === 'starter') typeAbout(aboutStarter());
      else if (a === 'rmphoto') { delete S.d.photo; commit(); }
      return;
    }
    if ((x = b('[data-goto]'))) return go(+x.dataset.goto);
    if ((x = b('[data-vert]'))) {
      const v = x.dataset.vert;
      // another kind of business: other offers, maybe other documents (company-only verticals, sector licence)
      if (S.v !== v) {
        S.v = v; S.cats = []; S.sub = '';
        if (COMPANY_ONLY.includes(v)) { if (S.role !== 'company') { S.docs = {}; S.src = {}; } S.role = 'company'; }
        delete S.docs.sector;
        [...A.seen].forEach(k => k.startsWith('1:') && k !== '1:what' && k !== '1:list' && A.seen.delete(k));
      }
      delete errors.cats; commit(`[data-vert="${v}"]`); return;
    }
    if ((x = b('[data-docedit]'))) { A.open[x.dataset.docedit] = true; render(); return; }
    if ((x = b('[data-cat]'))) {
      const c = x.dataset.cat; S.cats = S.cats.includes(c) ? S.cats.filter(y => y !== c) : [...S.cats, c];
      if (companyOnly(S) && S.role !== 'company') { S.role = 'company'; S.sub = ''; S.docs = {}; S.src = {}; }
      delete errors.cats; commit(`[data-cat="${c}"]`); return;
    }
    if ((x = b('[data-sub]'))) {
      if (S.sub !== x.dataset.sub) { S.sub = x.dataset.sub; S.docs = {}; S.src = {}; }
      delete errors.sub; commit(`[data-sub="${S.sub}"]`); return;
    }
    if ((x = b('[data-size]'))) { S.d['size_' + x.dataset.size] = x.dataset.v; delete errors['size_' + x.dataset.size]; commit(`[data-size="${x.dataset.size}"][data-v="${x.dataset.v}"]`); return; }
    if ((x = b('[data-role]'))) {
      // another type means other documents
      if (S.role !== x.dataset.role) { S.role = x.dataset.role; S.sub = ''; S.docs = {}; S.src = {}; }
      delete errors.role; commit(`[data-role="${S.role}"]`); return;
    }
    if ((x = b('[data-addlang]'))) return addLang(x.dataset.addlang);
    if ((x = b('[data-rmlang]'))) { S.d.langs = (S.d.langs || []).filter(l => l !== x.dataset.rmlang); commit(); return; }
    if ((x = b('[data-ch]'))) { const c = x.dataset.ch; S.channels = S.channels.includes(c) ? S.channels.filter(y => y !== c) : [...S.channels, c]; delete errors.channels; commit(`[data-ch="${c}"]`); return; }
    if ((x = b('[data-hours]'))) { S.hours = x.dataset.hours; commit(`[data-hours="${S.hours}"]`); }
  });

  document.addEventListener('upnow:auth', () => render());
  render();
  // a document still being read when the page was left: finish reading it
  Object.keys(S.docs).forEach(id => { if (S.docs[id].state === 'scan') setTimeout(() => readInto(id), 900); });
  if (!auth.user()) signIn();
})();
