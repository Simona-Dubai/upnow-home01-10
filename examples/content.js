/* Example site content — a fictional coworking brand built from the same components.
   This file is all a new website needs to configure the shared header, footer, currency and translations
   (window.SITE), plus its own page content (window.CONTENT). No UpNow data is loaded on these pages. */
(function () {
  const page = f => PATHS.root + 'examples/' + f;

  window.SITE = {
    name: 'Atlas',
    logoMark: 'A',
    storageKey: 'atlas',
    homeHref: page('index.html'),
    currencies: { AED: [1, 'AED', '🇦🇪'], USD: [.2723, 'USD', '🇺🇸'] },
    languages: [['en', 'EN']],
    i18n: {},
    header: {
      nav: [
        { id: 'spaces', label: 'Workspaces', href: page('spaces.html') },
        { id: 'pricing', label: 'Pricing', href: page('index.html#pricing') },
        { id: 'faq', label: 'FAQ', href: page('index.html#faq') }
      ],
      visible: 3,
      currency: true, language: false, saved: false, enquiries: false, signIn: false,
      cta: { label: 'Book a tour', icon: 'cal', href: page('index.html#tour') }
    },
    footer: {
      cta: {
        kicker: 'FIRST DAY FREE', title: 'Try a desk on us.<br>Stay if it fits.',
        text: 'Hot desks, dedicated desks and private offices in four Dubai locations. Month-to-month, no deposit.',
        buttons: [{ label: 'Book a tour', icon: 'cal', href: page('index.html#tour'), style: 'light' }, { label: 'See workspaces', href: page('spaces.html'), style: 'outline' }],
        stats: [['4', 'locations'], ['1,200+', 'members'], ['24/7', 'access'], ['0 AED', 'deposit']]
      },
      about: 'Flexible workspace across Dubai — desks, offices and meeting rooms by the day or month.',
      columns: [
        { title: 'Workspaces', links: [['Hot desk', page('spaces.html')], ['Dedicated desk', page('spaces.html')], ['Private office', page('spaces.html')], ['Meeting rooms', page('spaces.html')]] },
        { title: 'Company', links: [['About', '#'], ['Careers', '#'], ['Contact', page('index.html#tour')]] }
      ],
      legal: ['© 2026 Atlas Coworking (example brand)', 'Built with the UpNow component boilerplate.']
    }
  };

  const img = f => PATHS.img(f);
  window.CONTENT = {
    hero: { kicker: 'Dubai coworking', title: 'Work somewhere<br>that works for you.', text: 'Desks and private offices in Business Bay, DIFC, JLT and Dubai Marina. Book a tour today and work free for a day.' },
    features: [['bolt', 'Gigabit Wi-Fi', 'Wired and wireless, with backup lines.'], ['clock', '24/7 access', 'Your key card works around the clock.'], ['cup', 'Coffee & kitchen', 'Specialty coffee and a full kitchen.'], ['users', 'Community', 'Weekly events and member introductions.']],
    spaces: [
      { id: 'bb-hot', title: 'Hot desk · Business Bay', location: 'Bay Square, Business Bay', type: 'Hot desk', image: img('office1.jpg'), spec: ['Any free desk', '24/7'], price: 950, unit: '/month', badge: 'Popular' },
      { id: 'difc-ded', title: 'Dedicated desk · DIFC', location: 'Gate Village, DIFC', type: 'Dedicated desk', image: img('office2.jpg'), spec: ['Your own desk', 'Locker'], price: 1600, unit: '/month' },
      { id: 'jlt-office', title: 'Private office for 4 · JLT', location: 'Cluster D, JLT', type: 'Private office', image: img('office3.jpg'), spec: ['4 desks', 'Lockable'], price: 6800, unit: '/month', badge: 'New' },
      { id: 'marina-meet', title: 'Meeting room · Dubai Marina', location: 'Marina Plaza, Dubai Marina', type: 'Meeting room', image: img('hotel1.jpg'), spec: ['8 people', 'Screen'], price: 180, unit: '/hour' },
      { id: 'bb-office', title: 'Private office for 8 · Business Bay', location: 'Bay Square, Business Bay', type: 'Private office', image: img('venue2.jpg'), spec: ['8 desks', 'Window view'], price: 12500, unit: '/month' },
      { id: 'difc-hot', title: 'Hot desk · DIFC', location: 'Gate Village, DIFC', type: 'Hot desk', image: img('apt3.jpg'), spec: ['Any free desk', 'Weekdays'], price: 790, unit: '/month' }
    ],
    plans: {
      monthly: [['Hot desk', 'AED 950', 'Any free desk, all locations'], ['Dedicated desk', 'AED 1,600', 'Your own desk and locker'], ['Private office', 'from AED 6,800', 'Lockable office for 2–10']],
      daily: [['Day pass', 'AED 90', 'Any free desk for a day'], ['Meeting room', 'AED 180 / hour', 'Up to 8 people, screen included'], ['Event space', 'AED 1,500 / day', 'Up to 60 guests']]
    },
    faq: [['Can I try before I join?', 'Yes — your first day is free. Book a tour and we will set you up at a desk.'], ['Is there a deposit?', 'No deposit and no long contract. Plans are month-to-month.'], ['Can I use other locations?', 'Hot desk members can work from any of our four locations.']]
  };
})();
