/* Home page content: hero headline + subline per category, hero background images and the "How it works" steps.
   The page script (js/pages/home.js) only renders; edit the words and pictures here. */
window.CONTENT = window.CONTENT || {};
CONTENT.home = {
  // [headline, subline] per category tab
  headlines: {
    all: [
      "Everything Dubai, one search.",
      "Spaces, services, experiences, memberships, programs, health and protection — from verified providers."
    ],
    spaces: [
      "Find a space you can trust.",
      "Homes, offices, warehouses, land, holiday homes, venues, courts and yachts. Connect with verified owners, agents and operators."
    ],
    services: [
      "Book a service you can trust.",
      "Cleaning, AC, salons, photographers, designers and handymen. Licensed, reviewed and ready to reply on WhatsApp."
    ],
    experiences: [
      "Discover experiences worth remembering.",
      "Tours, workshops and desert safaris from DTCM-licensed operators."
    ],
    memberships: [
      "Join places that fit your life.",
      "Compare plans, benefits, access and locations before you join."
    ],
    programs: [
      "Find the right program to grow.",
      "Nurseries, schools, universities, courses, camps and academies with clear admissions and schedules."
    ],
    health: [
      "Care you can count on.",
      "Doctors, dentists, physio, diagnostics, mental health and home care from DHA-licensed providers."
    ],
    insurance: [
      "Protect what matters to you.",
      "Motor, health and property quotes from CBUAE-licensed insurers."
    ]
  },
  // hero backgrounds by the visitor's country (MARKETS.visitor()): the country's famous places, per sub-category
  // ("all" = the All tab). A key a country doesn't list — or a photo that fails to load — falls back to heroImages below.
  // Add a country by adding its ISO code; photos go in assets/images/hero/<iso>/.
  heroByCountry: {
    AE: {
      // all: PATHS.img("hero/ae/skyline.jpg"),        // e.g. Burj Khalifa / Downtown at dusk
      // residential: PATHS.img("hero/ae/marina.jpg"), // Dubai Marina
      // holiday: PATHS.img("hero/ae/palm.jpg"),       // Palm Jumeirah
      // yacht: PATHS.img("hero/ae/marina-yacht.jpg"),
      // safari: PATHS.img("hero/ae/dunes.jpg"),       // Arabian desert dunes
      // tour: PATHS.img("hero/ae/museum.jpg"),        // Museum of the Future / Old Dubai creek
    }
  },
  // hero background per sub-category ("all" = the All tab) — the default for every country
  heroImages: {
    residential: PATHS.img("hero.jpg"),
    commercial: PATHS.img("office1.jpg"),
    industrial: PATHS.img("wh3.jpg"),
    land: PATHS.img("aerial1.jpg"),
    mixed: PATHS.img("aerial2.jpg"),
    holiday: PATHS.img("villa1.jpg"),
    venue: PATHS.img("venue2.jpg"),
    court: PATHS.img("padel1.jpg"),
    yacht: PATHS.img("yacht2.jpg"),
    cleaning: PATHS.img("clean1.jpg"),
    ac: PATHS.img("ac1.jpg"),
    haircut: PATHS.img("salon1.jpg"),
    photography: PATHS.img("workshop2.jpg"),
    design: PATHS.img("office3.jpg"),
    makeup: PATHS.img("salon2.jpg"),
    handyman: PATHS.img("ac2.jpg"),
    nursery: PATHS.img("nursery1.jpg"),
    higher: PATHS.img("uni1.jpg"),
    doctor: PATHS.img("doctor1.jpg"),
    dental: PATHS.img("dental1.jpg"),
    physio: PATHS.img("physio1.jpg"),
    diagnostics: PATHS.img("lab1.jpg"),
    mental: PATHS.img("therapy1.jpg"),
    homecare: PATHS.img("homecare1.jpg"),
    safari: PATHS.img("desert2.jpg"),
    workshop: PATHS.img("workshop1.jpg"),
    tour: PATHS.img("desert1.jpg"),
    gym: PATHS.img("fit2.jpg"),
    credits: PATHS.img("fit1.jpg"),
    school: PATHS.img("school1.jpg"),
    course: PATHS.img("office2.jpg"),
    camp: PATHS.img("school2.jpg"),
    academy: PATHS.img("padel2.jpg"),
    all: PATHS.img("hero.jpg")
  },
  // "This season on UpNow": promotional banners between the listing rows. v = the vertical tab it belongs to;
  // the All tab shows the first three, a vertical tab shows its own first (then fills up with the rest).
  // No prices or discounts from UpNow — these point to verified providers' listings.
  promos: [
    { v: 'programs', o: 'camp', img: PATHS.img("school2.jpg"), eyebrow: "Summer 2026", title: "Summer camps are filling up", text: "Compare day and sports camps by age, area and schedule.", cta: "Browse camps" },
    { v: 'experiences', o: 'safari', img: PATHS.img("desert2.jpg"), eyebrow: "This weekend", title: "Evenings in the dunes", text: "Desert safaris from DTCM-licensed operators.", cta: "See safaris" },
    { v: 'services', o: 'cleaning', img: PATHS.img("clean1.jpg"), eyebrow: "Moving soon?", title: "Move-in deep cleaning", text: "Verified cleaners who reply on WhatsApp.", cta: "Find cleaners" },
    { v: 'health', o: 'diagnostics', img: PATHS.img("lab1.jpg"), eyebrow: "Check-up season", title: "Full-body check-ups", text: "Lab tests at DHA-licensed clinics.", cta: "Compare clinics" },
    { v: 'spaces', o: 'yacht', img: PATHS.img("yacht2.jpg"), eyebrow: "Sunset hours", title: "A yacht for the evening", text: "Charters by the hour from licensed operators.", cta: "See yachts" },
    { v: 'spaces', o: 'court', img: PATHS.img("padel1.jpg"), eyebrow: "Book a court", title: "Padel after work", text: "Courts across the city, open late.", cta: "Find courts" }
  ],
  // "How it works": [title, text]
  steps: [
    ["Find what you need", "Choose a category, then search with the filters that matter."],
    ["Compare verified providers", "Check photos, pricing, permits and provider details."],
    ["Call, WhatsApp or email", "It reaches the provider instantly as a lead with your details."],
    ["Deal directly", "Viewings, contracts and payments are agreed with the provider — UpNow never takes your money."]
  ]
};
