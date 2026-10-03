/* Home page content: hero headline + subline per category, hero background images and the "How it works" steps.
   The page script (js/pages/home.js) only renders; edit the words and pictures here. */
window.CONTENT = window.CONTENT || {};
CONTENT.home = {
  // [headline, subline] per category tab
  headlines: {
    all: [
      "Everything Dubai, one search.",
      "Spaces, services, experiences, memberships, programs and insurance — from verified providers."
    ],
    spaces: [
      "Find a space you can trust.",
      "Homes, offices, warehouses, land, holiday homes, venues, courts and yachts. Connect with verified owners, agents and operators."
    ],
    services: [
      "Book a service you can trust.",
      "From cleaning and AC to salons and dentists. Licensed, reviewed and ready to reply on WhatsApp."
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
      "Schools, courses, camps and academies with clear admissions and schedules."
    ],
    insurance: [
      "Protect what matters to you.",
      "Motor, health and property quotes from CBUAE-licensed insurers."
    ]
  },
  // hero background per sub-category ("all" = the All tab)
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
    dentist: PATHS.img("dental1.jpg"),
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
  // "How it works": [title, text]
  steps: [
    ["Find what you need", "Choose a category, then search with the filters that matter."],
    ["Compare verified providers", "Check photos, pricing, permits and provider details."],
    ["Call, WhatsApp or email", "It reaches the provider instantly as a lead with your details."],
    ["Deal directly", "Viewings, contracts and payments are agreed with the provider — UpNow never takes your money."]
  ]
};
