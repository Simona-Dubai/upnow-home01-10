const { VERTICALS, VORDER, LISTINGS, AREAS, offerOf } = UP;
const { ico, esc, card, toQuery, results, blankState, t } = UPUI;
document.getElementById("hdr").innerHTML = UPUI.header("home");
document.getElementById("ftr").innerHTML = UPUI.footer();
UPUI.bindHeader();

let saved = {};
try {
  saved = JSON.parse(localStorage.getItem("upnow.home") || "{}");
} catch (e) {}
const S = blankState(saved.v || "spaces", saved.o);
const go = () => {
  location.href = PATHS.href.search + toQuery(S);
};

const { headlines: COPY, heroImages: HERO, steps: STEPS } = CONTENT.home;
const OICO = UPF.OICO || {
  cleaning: "spark",
  ac: "snow",
  haircut: "user",
  dentist: "heart",
  safari: "sun",
  workshop: "tool",
  tour: "compass",
  gym: "bolt",
  credits: "tag",
  school: "grad",
  course: "doc",
  camp: "sun",
  academy: "ball",
  motor: "car",
  health: "heart",
  property: "home",
};
const iconOf = (v, o) => o.icon || OICO[o.id] || VERTICALS[v].icon;

const bgImgs = [...document.querySelectorAll("#bg img")];
let bgIdx = 0,
  bgCur = null;
function setHero(src) {
  if (src === bgCur) return;
  bgCur = src;
  const next = bgImgs[1 - bgIdx];
  const pre = new Image();
  pre.onload = pre.onerror = () => {
    next.src = src;
    requestAnimationFrame(() => {
      next.classList.add("is-active");
      bgImgs[bgIdx].classList.remove("is-active");
      bgIdx = 1 - bgIdx;
    });
  };
  pre.src = src;
}

function paint() {
  localStorage.setItem("upnow.home", JSON.stringify({ v: S.v, o: S.o }));
  const c = COPY[S.v] || COPY.all;
  document.getElementById("h1").textContent = c[0];
  document.getElementById("sub").textContent = c[1];
  document.getElementById("kick").innerHTML =
    ico("shield") + "Verified providers across Dubai";
  const O = S.v === "all" ? null : offerOf(S.v, S.o);
  setHero(HERO[S.v === "all" ? "all" : S.o] || HERO.all);
  document.getElementById("credit").textContent = O
    ? VERTICALS[S.v].label + " · " + O.label
    : "All verticals";

  const inV = LISTINGS.filter((l) => S.v === "all" || l.v === S.v);
  document.getElementById("trust").innerHTML = [
    [
      "check",
      `${inV.filter((l) => l.a.verified).length} verified listings`,
    ],
    ["phone", "Direct provider contact"],
    [
      "clock",
      `${Math.round(inV.reduce((s, l) => s + l.provider.reply, 0) / inV.length)} min average reply`,
    ],
    [
      "star",
      `${(inV.reduce((s, l) => s + l.rating, 0) / inV.length).toFixed(1)} · ${inV.reduce((s, l) => s + l.reviews, 0).toLocaleString()} verified reviews`,
    ],
  ]
    .map(([i, s]) => `<span>${ico(i)}${esc(s)}</span>`)
    .join("");

  /* Compact browse rail — the search panel above already lists the categories, so this shows the main type
     facet INSIDE the selected category (e.g. property type for Residential), each with an icon; types with no listings are left out. */
  const cats = document.getElementById("cats");
  const tile = (href, icon, label) =>
    `<a href="${href}"><i>${ico(icon)}</i>${esc(label)}</a>`;
  const TICO = {
    apartment: "building",
    villa: "villa",
    townhouse: "townhouse",
    penthouse: "penthouse",
    duplex: "duplex",
    "hotel-apt": "bell",
    office: "office",
    retail: "shop",
    showroom: "car",
    coworking: "users",
    bcentre: "brief",
    fnb: "cup",
    clinic: "medic",
    warehouse: "warehouse",
    factory: "factory",
    workshop: "wrench",
    cold: "snow",
    staff: "bed",
    yard: "plot",
    storage: "box",
    residential: "home",
    commercial: "office",
    industrial: "factory",
    mixed: "layers",
    agricultural: "leaf",
    "resi-retail": "home",
    "office-retail": "office",
    whole: "building",
    "hotel-retail": "bell",
    wedding: "ring",
    corporate: "brief",
    birthday: "cake",
    conference: "mic",
    launch: "spark",
    shoot: "camera",
    padel: "racket",
    tennis: "tennis",
    football5: "ball",
    football7: "ball",
    basketball: "bball",
    pickleball: "racket",
    badminton: "shuttle",
    "Regular clean": "home",
    "Deep clean": "spark",
    "Move-in / move-out": "box",
    "Sofa & carpet": "sofa",
    once: "tool",
    annual: "cal",
    "Men's cut": "user",
    "Women's cut & style": "scissors",
    Colour: "palette",
    "Blow-dry": "wind",
    "Kids cut": "smile",
    "Beard trim": "razor",
    "Check-up & cleaning": "tooth",
    Whitening: "spark",
    "Aligners & braces": "smile",
    Implants: "tool",
    "Root canal": "tooth",
    "Kids dentistry": "heart",
    Pottery: "vase",
    Painting: "palette",
    Cooking: "pan",
    "Perfume making": "flask",
    Photography: "camera",
    Calligraphy: "pen",
    single: "pin",
    multi: "map",
    all: "globe",
    "Fitness classes": "bolt",
    Padel: "racket",
    Swimming: "wave",
    "Spa & wellness": "leaf",
    Yoga: "heart",
    "FS / KG": "smile",
    Primary: "book",
    Secondary: "pen",
    "Sixth form / IB": "grad",
    Coding: "code",
    "UX Design": "palette",
    "Data & AI": "trend",
    Arabic: "msg",
    "English / IELTS": "globe",
    Business: "brief",
    Sports: "ball",
    "Arts & crafts": "palette",
    "STEM & robotics": "robot",
    "Multi-activity": "grid4",
    Football: "ball",
    Tennis: "tennis",
    Basketball: "bball",
    "Martial arts": "shield",
    Gymnastics: "star",
    Sedan: "car",
    SUV: "car",
    "Sports car": "flag",
    Luxury: "star",
    Electric: "bolt",
    individual: "user",
    family: "users",
    sme: "brief",
    domestic: "home",
    Apartment: "building",
    Villa: "villa",
    Office: "office",
    Warehouse: "warehouse",
  };
  if (S.v === "all") {
    cats.innerHTML = ""; // the tabs and the panel above already list every category
  } else {
    const base = blankState(S.v, S.o),
      skipT = ["price", "term", "billing", "verified"];
    const d = O.defs.find(
      (d) =>
        (d.type === "multi" || d.type === "select") &&
        !d.isDate &&
        !skipT.includes(d.id) &&
        d.options &&
        d.options.length <= 8 &&
        d.id !== "amenities" &&
        d.id !== "time",
    );
    const DICO = { guests: "users", duration: "clock" };
    cats.innerHTML = d
      ? d.options
          .map((o) => {
            const f = {
                ...base.f,
                [d.id]: d.type === "multi" ? [o.v] : o.v,
              },
              n = results({ ...base, f }).length;
            return n
              ? tile(
                  PATHS.href.search + toQuery({ ...base, f }),
                  TICO[o.v] || DICO[d.id] || iconOf(S.v, O),
                  d.id === "beds" && o.v !== "0" ? o.l + " bed" : o.l,
                )
              : "";
          })
          .join("")
      : "";
  }
  cats.hidden = !cats.innerHTML;

  const blocks =
    S.v === "all"
      ? VORDER.map((v) => ({
          t: VERTICALS[v].label,
          p: COPY[v][1],
          list: LISTINGS.filter((l) => l.v === v).sort(
            (a, b) => b.rating - a.rating,
          ),
          href: "?v=" + v,
        }))
      : VERTICALS[S.v].offers
          .map((o) => {
            const B = blankState(S.v, o.id);
            return {
              t: o.h1,
              p: o.basis + " · verified providers",
              list: results(B),
              href: toQuery(B),
              on: o.id === S.o,
            };
          })
          .sort((a, b) => (b.on || 0) - (a.on || 0));
  document.getElementById("sections").innerHTML = blocks
    .filter((b) => b.list.length)
    .map(
      (b) => `
    <section class="section"><div class="section-header"><div><h2>${esc(b.t)}</h2>${b.p ? `<p>${esc(b.p)}</p>` : ""}</div><a href="${PATHS.href.search}${b.href}">See all ${b.list.length} ${ico("chevR")}</a></div>
    <div class="card-row">${b.list
      .slice(0, 6)
      .map((l) => card(l))
      .join("")}</div></section>`,
    )
    .join("");

  const pool = S.v === "all" ? inV : inV.filter((l) => l.cat === S.o);
  const areas = AREAS.map((a) => ({
    ...a,
    c: pool.filter(
      (l) => l.loc === a.id || (l.coverage || []).includes(a.id),
    ).length,
  }))
    .filter((a) => a.c)
    .sort((a, b) => b.c - a.c)
    .slice(0, 8);
  document.getElementById("areasH").textContent = O
    ? `Popular areas for ${O.h1.toLowerCase()}`
    : "Popular areas";
  document.getElementById("areas").innerHTML = areas
    .map(
      (a) =>
        `<a href="${PATHS.href.search}${toQuery({ ...blankState(S.v, S.o), loc: [a.id] })}"><span>${esc(a.n)}<small>${a.c} listings</small></span>${ico("chevR")}</a>`,
    )
    .join("");

  document.getElementById("why").innerHTML = STEPS
    .map(
      ([b, s], i) =>
        `<div><span class="step-number">${i + 1}</span><b>${b}</b><span>${s}</span></div>`,
    )
    .join("");
}
UPF.SearchBar(document.getElementById("sw"), S, {
  mode: "hero",
  onChange: paint,
  onSubmit: go,
});
paint();
Object.values(HERO).forEach((s) => (new Image().src = s));
