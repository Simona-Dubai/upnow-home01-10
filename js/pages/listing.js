const { VERTICALS, LISTINGS, AREAS, areaName, offerOf } = UP;
const { ico, esc, toQuery, blankState, money, moneyK, t } = UPUI;
const id =
  new URLSearchParams(location.search).get("id") || LISTINGS[0].id;
const l = UPUI.byId(id) || LISTINGS[0];
const O = offerOf(l.v, l.cat);
const seg = O.defs.find((d) => d.type === "seg");
let per = seg ? seg.options[0].v : null;
UPUI.pushRecent(l.id);
const DMB = DM.build(l);
document.getElementById("hdr").innerHTML = UPUI.header(l.v);
document.getElementById("ftr").innerHTML = UPUI.footer();
UPUI.bindHeader();
const where = UPUI.locText(l);
document.title = `${l.title} · ${areaName(l.loc)} | UpNow`;
document.getElementById("mdesc").content =
  `${l.title} in ${where}, Dubai. ${UPUI.priceText(l).n}${UPUI.priceText(l).u}. Contact ${l.provider.name} directly. Ref ${l.ref}.`;

let seedN = 0;
for (const c of l.id) seedN += c.charCodeAt(0);
const r = () => {
  seedN = (seedN * 9301 + 49297) % 233280;
  return seedN / 233280;
};
const fn = l.provider.name.split(" ")[0];
const A = l.a,
  lab = (dd, v) =>
    ((O.def(dd).options || []).find((x) => x.v === String(v)) || {}).l ||
    v;

/* ---------- category-specific content ---------- */
const facts = () =>
  [
    [
      "Type",
      O.label +
        (O.def("ptype") && A.ptype ? " · " + lab("ptype", A.ptype) : ""),
    ],
    ...O.defs
      .filter((d) => !SEARCH_ONLY.includes(d.id))
      .map((d) => {
        const v = UPUI.factValue(d, l);
        return v && d.type !== "toggle" && d.id !== "term"
          ? [d.label, v]
          : null;
      })
      .filter(Boolean),
    A.sqft && !O.def("size")
      ? null
      : A.sqft
        ? ["Size", A.sqft.toLocaleString() + " sqft"]
        : null,
    O.perSqft && A.sqft
      ? ["Price per sqft", money(Math.round(l.price / A.sqft)) + " / yr"]
      : null,
    ["Price basis", O.basis],
    ["Reference", l.ref],
    l.permit && [O.permit, l.permit],
    ["Listed", l.posted === 0 ? "Today" : l.posted + " days ago"],
  ].filter(Boolean);
const feats = () =>
  O.defs
    .filter((d) => d.id !== "verified")
    .flatMap((d) => {
      const lv = A[d.field || d.id];
      if (d.type === "toggle") return lv ? [d.label] : [];
      if (
        d.type === "multi" &&
        Array.isArray(lv) &&
        ![
          "ptype",
          "ctype",
          "itype",
          "landuse",
          "mtype",
          "eventType",
          "sport",
        ].includes(d.id)
      )
        return lv.map(
          (x) => (d.options.find((o) => o.v === x) || {}).l || x,
        );
      return [];
    });
const ABOUT = {
  residential: () =>
    `${l.title.replace(/ ·.*/, "")} in ${where}. ${A.sqft.toLocaleString()} sqft with ${A.baths} bathrooms, ${lab("furnishing", A.furnishing).toLowerCase()}${A.amenities.length ? ", with " + A.amenities.slice(0, 3).join(", ").toLowerCase() : ""}. Rent ${money(l.price)} per year, payable in up to ${A.cheques} cheque${A.cheques > 1 ? "s" : ""}. ${A.avail === 0 ? "Available now" : "Available in " + A.avail + " days"} — Ejari registration and DEWA connection handled at move-in.`,
  commercial: () =>
    `${lab("fitting", A.fitting)} ${lab("ctype", A.ctype).toLowerCase()} of ${A.sqft.toLocaleString()} sqft in ${where}, ${A.zone === "freezone" ? "free-zone licence eligible" : "mainland (DED) licence eligible"}. ${A.grade === "A" ? "Grade A building" : "Grade B building"} with ${A.parkingSpaces} parking space${A.parkingSpaces === 1 ? "" : "s"}${A.pantry ? ", pantry" : ""}${A.dewa ? " and separate DEWA meter" : ""}. ${money(Math.round(l.price / A.sqft))} per sqft per year.`,
  industrial: () =>
    `${lab("itype", A.itype)} of ${A.sqft.toLocaleString()} sqft BUA in ${where}. ${A.powerKw} kW power, ${A.heightM} m clear height and ${A.docks} loading dock${A.docks === 1 ? "" : "s"}${A.office ? ", with office space" : ""}. ${A.civil ? "Civil Defence approved. " : ""}${A.zone === "freezone" ? "Free-zone" : "Mainland"} licence required.`,
  land: () =>
    `${lab("landuse", A.landuse)} plot of ${A.sqft.toLocaleString()} sqft in ${where}, zoned ${A.height} with an estimated GFA of ${A.gfa.toLocaleString()} sqft. Offered on a ${A.termYrs}-year ${lab("tenure", A.tenure).toLowerCase()} lease${A.utilities ? ", utilities connected at plot boundary" : ""}${A.road ? ", direct main-road access" : ""}.`,
  mixed: () =>
    `${lab("mtype", A.mtype)} building in ${where} — ${A.units} units over G+${A.floors}, ${A.sqft.toLocaleString()} sqft BUA. Currently ${lab("occupancy", A.occupancy).toLowerCase()}${A.retailUnits ? ", with ground-floor retail" : ""}${A.parking ? " and basement parking" : ""}. Offered for master lease / bulk rent.`,
  holiday: () =>
    `${l.title} — sleeps up to ${A.maxGuests}, ${A.minNights}-night minimum. ${A.amenities.length ? "Includes " + A.amenities.join(", ").toLowerCase() + ". " : ""}DTCM-licensed holiday home. Tourism Dirham fee is paid to the host at check-in.`,
  venue: () =>
    `${l.title} in ${where} hosts up to ${A.capacity} guests (${lab("setting", A.setting).toLowerCase()}). Ideal for ${[]
      .concat(A.eventType)
      .map((x) => lab("eventType", x).toLowerCase())
      .join(
        ", ",
      )}. ${{ inhouse: "In-house catering available", outside: "Outside catering allowed", none: "Dry hire — no catering" }[A.catering]}${A.equipment.length ? "; equipment includes " + A.equipment.join(", ").toLowerCase() : ""}.`,
  court: () =>
    `${l.title} in ${where}. ${A.courts} court${A.courts > 1 ? "s" : ""} on site, ${A.setting === "indoor" ? "indoor and air-conditioned" : "outdoor with floodlights"}. ${A.amenities.length ? A.amenities.join(", ") + "." : ""} Book single slots or a weekly recurring time.`,
  yacht: () =>
    `${A.length} ft ${lab("ytype", A.ytype).toLowerCase()} departing ${areaName(l.loc)}, up to ${A.capacity} guests, minimum ${A.minHours} hours. ${{ captain: "Captain only", full: "Captain, crew and host on board" }[A.crew]}.${A.food.length ? " Food & drink: " + A.food.join(", ").toLowerCase() + "." : ""}${A.activities.length ? " Activities: " + A.activities.join(", ").toLowerCase() + "." : ""}`,
};
const TERMS = {
  residential: () => [
    ["Deposit", "5% of rent"],
    ["Cheques", "Up to " + A.cheques],
    ["Agency fee", l.provider.org === "Private owner" ? "None" : "5%"],
    ["Available", A.avail === 0 ? "Now" : "In " + A.avail + " days"],
  ],
  commercial: () => [
    ["Per sqft / yr", money(Math.round(l.price / A.sqft))],
    ["Cheques", "Up to " + A.cheques],
    ["Zone", A.zone === "freezone" ? "Free zone" : "Mainland"],
    ["Service charge", "Included"],
  ],
  industrial: () => [
    ["Per sqft / yr", money(Math.round(l.price / A.sqft))],
    ["Cheques", "Up to " + A.cheques],
    ["Power", A.powerKw + " kW"],
    ["Deposit", "10%"],
  ],
  land: () => [
    ["Lease term", A.termYrs + " years"],
    ["Per sqft / yr", money(+(l.price / A.sqft).toFixed(1))],
    ["Zoning", A.height],
    ["Tenure", lab("tenure", A.tenure)],
  ],
  mixed: () => [
    ["Per unit / yr", money(Math.round(l.price / A.units))],
    ["Units", A.units],
    ["Occupancy", lab("occupancy", A.occupancy)],
    ["Deposit", "5%"],
  ],
  holiday: () => [
    ["Min. stay", A.minNights + " nights"],
    ["Guests", "Up to " + A.maxGuests],
    ["Cancellation", lab("cancellation", A.cancellation)],
    [
      "Check-in",
      A.amenities.includes("Self check-in")
        ? "Self check-in"
        : "Host greets",
    ],
  ],
  venue: () => [
    ["Capacity", A.capacity + " guests"],
    ["Min. hire", "3 hours"],
    ["Catering", lab("catering", A.catering).replace(" catering", "")],
    ["Deposit", "30%"],
  ],
  court: () => [
    ["Courts", A.courts],
    ["Setting", A.setting === "indoor" ? "Indoor" : "Outdoor"],
    ["Pay", "At venue"],
    ["Cancel", "Free up to 24h"],
  ],
  yacht: () => [
    ["Min. hours", A.minHours],
    ["Guests", "Up to " + A.capacity],
    ["Crew", A.crew === "full" ? "Full crew" : "Captain"],
    ["Cancellation", lab("cancellation", A.cancellation)],
  ],
};
const LEASE = O.lease;
const SP = l.v === "spaces";
function qr() {
  let s = 0;
  for (const c of l.ref) s += c.charCodeAt(0);
  return Array.from({ length: 81 }, (_, i) => {
    const x = i % 9,
      y = Math.floor(i / 9);
    if ((x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5))
      return `<i class="${(x === 1 || x === 7) && (y === 1 || y === 7) ? "is-empty" : ""}"></i>`;
    s = (s * 9301 + 49297) % 233280;
    return `<i class="${s / 233280 > 0.5 ? "" : "is-empty"}"></i>`;
  }).join("");
}
const NEAR = {
  residential: [
    ["train", "Metro station", "6 min walk"],
    ["cart", "Supermarket", "3 min walk"],
    ["grad", "Schools", "4 within 2 km"],
    ["heart", "Clinic", "1.2 km"],
  ],
  commercial: [
    ["train", "Metro station", "4 min walk"],
    ["car", "Sheikh Zayed Rd", "2 min drive"],
    ["cart", "Food court", "In building"],
    ["building", "Banks", "3 within 500 m"],
  ],
  industrial: [
    ["car", "E311 / E611", "5 min drive"],
    ["boat", "Jebel Ali Port", "18 min"],
    ["train", "Al Maktoum Airport", "25 min"],
    ["users", "Labour camps", "2 km"],
  ],
  land: [
    ["car", "Main road", "Frontage"],
    ["train", "Metro (planned)", "1.8 km"],
    ["building", "Community centre", "2 km"],
    ["bolt", "DEWA substation", "900 m"],
  ],
  mixed: [
    ["train", "Metro station", "7 min walk"],
    ["cart", "Mall", "1.5 km"],
    ["grad", "Schools", "3 within 2 km"],
    ["car", "Highway", "3 min drive"],
  ],
  holiday: [
    ["sun", "Beach", "5 min walk"],
    ["cart", "Supermarket", "2 min walk"],
    ["train", "Tram / metro", "8 min walk"],
    ["car", "DXB airport", "25 min"],
  ],
  venue: [
    ["car", "Valet / parking", "On site"],
    ["train", "Metro station", "10 min walk"],
    ["building", "Hotels", "4 within 1 km"],
    ["car", "DXB airport", "20 min"],
  ],
  court: [
    ["car", "Parking", "Free, on site"],
    ["cart", "Café", "On site"],
    ["train", "Metro", "12 min walk"],
    ["users", "Changing rooms", "Yes"],
  ],
  yacht: [
    ["pin", "Meeting point", "Pier 7"],
    ["car", "Parking", "Marina Mall"],
    ["sun", "Route", "Palm & Atlantis"],
    ["clock", "Board", "15 min before"],
  ],
};

// price-related terms shown next to the price; everything else lives in its own section
const PRICE_TERMS = [
  "Deposit",
  "Cheques",
  "Agency fee",
  "Per sqft / yr",
  "Per unit / yr",
  "Service charge",
  "Pay",
  "Min. hire",
  "Min. hours",
  "Lease term",
];
// booking pickers (date calendar, court slot grid) are not shown on the listing page
const BOOKING_UI = /calendar-pair|slot-grid/;
const HIDDEN_SECS = ["Cost to move in", "House rules"];
// facts whose label differs from how the same fact is labelled elsewhere on the page
const FACT_ALIAS = {
  Size: "sqft",
  "Minimum stay": "night min",
  "Maximum guests": "guests",
  "Courts on site": "courts",
  Duration: "min hours",
};
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const words = (s) =>
  String(s)
    .toLowerCase()
    .match(/[a-z]{3,}/g) || [];
const digits = (s) => (String(s).match(/\d+/g) || []).join(" ");
// same fact worded differently: "2 visits / year" ≈ "2 visits/yr", "Max 10 kids" ≈ "Max 10", "Padel" ≈ "Padel"
const sameFact = (k, v, other) =>
  norm(v) === norm(other) ||
  (digits(v) !== "" &&
    digits(v) === digits(other) &&
    (digits(v).includes(" ") ||
      norm(v).includes(norm(other).replace(/\d/g, "")) ||
      words(k + " " + v).some((w) =>
        words(other).some((x) => w.startsWith(x) || x.startsWith(w)),
      )));
// search-only filters (requested date / time of day) are not facts about the listing
const SEARCH_ONLY = ["date", "time", "checkin", "checkout"];
const FICO = {
  Balcony: "sun",
  "Private pool": "sun",
  "Shared pool": "sun",
  Gym: "bolt",
  "Covered parking": "car",
  "Maid's room": "bed",
  "24h security": "shield",
  Concierge: "user",
  "Sea view": "eye",
  "Burj view": "eye",
  "Pets allowed": "heart",
  "Central A/C": "snow",
  "Fast Wi-Fi": "bolt",
  "Free parking": "car",
};
function paint() {
  const S = seg ? { o: l.cat, f: { [seg.id]: per } } : null;
  const pt = UPUI.priceText(l, S);
  const crumbs = [
    ["Home", PATHS.href.home],
    [UP.VERTICALS[l.v].label, PATHS.href.search + "?v=" + l.v],
    [O.label, PATHS.href.search + toQuery(blankState(l.v, l.cat))],
    [
      areaName(l.loc),
      PATHS.href.search +
        toQuery({ ...blankState(l.v, l.cat), loc: [l.loc] }),
    ],
  ];
  const similar = UPUI.results(blankState(l.v, l.cat))
    .filter((x) => x.id !== l.id)
    .sort((a, b) => (b.loc === l.loc) - (a.loc === l.loc))
    .slice(0, 3);
  const imgs = l.img;
  // the key-facts row is the summary; the price box, Property information and Amenities skip anything already shown
  const secsHTML = DMB.secs
    .filter(
      ([h, body]) => !BOOKING_UI.test(body) && !HIDDEN_SECS.includes(h),
    )
    .map(
      ([h, body]) =>
        `<section class="section"><h2>${esc(h)}</h2>${body}</section>`,
    )
    .join("");
  const secsText = secsHTML
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const keyFacts = O.meta(A, l, { def: (d) => O.def(d) })
    .filter(([i]) => i !== "star")
    .slice(0, 4);
  const keyText = norm(keyFacts.map(([, tx]) => tx).join(" ")).replace(
    /\d/g,
    "",
  );
  const terms = (TERMS[l.cat] ? TERMS[l.cat]() : []).filter(
    ([k]) => PRICE_TERMS.includes(k) && !keyText.includes(norm(k)),
  );
  const seen = [
    ...keyFacts.map(([, tx]) => tx),
    ...terms.flat(),
    secsText,
  ]
    .join(" ")
    .toLowerCase();
  const shown = (s) => {
    s = String(s)
      .toLowerCase()
      .replace(/\s*\(.*\)/, "")
      .trim();
    return (
      s.length > 2 && (seen.includes(s) || norm(seen).includes(norm(s)))
    );
  };
  const fts = feats().filter((f) => !shown(f));
  const all = facts(),
    hasPtype = all.some(([k]) => k === "Property type");
  const shownFacts = [
    ...keyFacts.map(([, tx]) => tx),
    ...terms.map(([k, v]) => k + " " + v),
  ];
  const info = all.filter(
    ([k, v]) =>
      !["Type", "Amenities", "Price basis", O.permit].includes(k) &&
      !shownFacts.some((x) => sameFact(k, v, x)) &&
      !keyText.includes(norm(FACT_ALIAS[k] || k)) &&
      !keyText.includes(norm(k).replace(/s$/, "")) &&
      !shown(k) &&
      !shown(FACT_ALIAS[k] || "") &&
      !(String(v).length >= (/\d/.test(v) ? 3 : 6) && shown(v)) &&
      !fts.some((f) => String(v).includes(f)),
  );
  document.getElementById("main").innerHTML = `
    <nav class="breadcrumbs">
      ${crumbs
        .map(
          ([tx, h], i) =>
            (i ? "<span>/</span>" : "") + `<a href="${h}">${esc(tx)}</a>`,
        )
        .join("")}
      <span>/</span>
      <span style="color:var(--color-text)">${esc(l.ref)}</span>
    </nav>

    <div class="title-row">
      <div class="title-col">
        <h1>${esc(l.title)}</h1>
        <div class="subtitle">
          <span>${ico("pin")}${esc(where)}, Dubai</span>
          ${A.verified ? `<span class="verification-box">${ico("shield")}${esc(O.permit || "Provider")} verified</span>` : ""}
          <span class="stars">${ico("star")}${l.rating}
            <span style="color:var(--color-text-muted);font-weight:500">(${l.reviews})</span>
          </span>
          <span>${ico("eye")}${120 + Math.round(r() * 900)} views this week</span>
          <span>${ico("clock")}Listed ${l.posted === 0 ? "today" : l.posted + " days ago"}</span>
        </div>
      </div>
      <div class="title-actions">
        <button class="btn btn-outline btn-sm" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href);UPUI.toast('Link copied')">
          ${ico("share")}Share
        </button>
        <button class="btn btn-outline btn-sm ${UPUI.favs.has(l.id) ? "is-active" : ""}" data-fav="${l.id}">
          ${ico("heart")}Save
        </button>
      </div>
    </div>

    <div class="gallery">
      ${[0, 1, 2, 3, 4]
        .slice(0, imgs.length ? 5 : 1)
        .map(
          (i) =>
            `<div data-lb="${imgs.length ? i % imgs.length : 0}">${UPUI.photo(l, i)}</div>`,
        )
        .join("")}
      <div class="photo-overlay is-left">
        ${A.tour ? `<span>${ico("video")}Video tour</span>` : ""}
        ${l.featured ? `<span>${ico("star")}Featured</span>` : ""}
      </div>
      ${
        imgs.length
          ? `
        <div class="photo-overlay is-right">
          <button data-lb="0">${ico("grid4")}Show all ${imgs.length} photos</button>
        </div>
      `
          : ""
      }
    </div>

    <div class="listing-layout">
      <div>
        ${
          keyFacts.length
            ? `
          <div class="key-facts">
            ${keyFacts.map(([i, tx]) => `<div>${ico(i)}<b>${esc(tx)}</b></div>`).join("")}
          </div>
        `
            : ""
        }

        <section class="section" style="border:0;padding-top:0">
          <h2>About this ${esc(O.label.toLowerCase().replace(/s$/, "").replace("holiday home", "home"))}</h2>
          <p class="listing-about">
            ${esc(ABOUT[l.cat] ? ABOUT[l.cat]() : `${l.title} — offered by ${l.provider.name} (${l.provider.org}) ${O.locAll ? "across the UAE" : "in " + areaName(l.loc) + ", Dubai"}. Priced ${O.basis.toLowerCase()}. Call, WhatsApp or email — ref ${l.ref}.`)}
          </p>
        </section>

        ${secsHTML}

        ${
          info.length
            ? `
          <section class="section">
            <h2>${SP ? "Property information" : "Details"}</h2>
            <div class="info-grid">
              ${info
                .map(
                  ([k, v]) => `
                <div>
                  <span>${esc(k)}</span>
                  <b>${esc(v)}</b>
                </div>
              `,
                )
                .join("")}
            </div>
          </section>
        `
            : ""
        }

        ${
          fts.length
            ? `
          <section class="section">
            <h2>Amenities &amp; features</h2>
            <div class="features">
              ${fts
                .map(
                  (f) => `
                <div><i>${ico(FICO[f] || "check")}</i>${esc(f)}</div>
              `,
                )
                .join("")}
            </div>
          </section>
        `
            : ""
        }

        ${
          l.permit
            ? `
          <section class="section">
            <h2>Listing permit &amp; verification</h2>
            <div class="permit">
              <div class="qr-code">${qr()}</div>
              <div>
                <b>${esc(O.permit)} ${esc(l.permit)}</b>
                <span>
                  ${esc(l.provider.org)}${l.provider.brn ? " · Agent BRN " + l.provider.brn : ""} ·
                  ${LEASE ? "Scan with the Dubai REST app to validate" : O.id === "holiday" ? "Validate on the DTCM holiday-homes register" : "Licence checked by UpNow"}
                </span>
                <div class="permit-checks">
                  <em>${ico("check")}Provider ID checked</em>
                  <em>${ico("check")}${LEASE ? "Title / tenancy right checked" : "Trade licence checked"}</em>
                  <em>${ico("check")}Photos match the property</em>
                </div>
              </div>
            </div>
          </section>
        `
            : ""
        }

        <section class="section">
          <h2>Where you'll be</h2>
          <div class="mini-map">
            <svg viewBox="0 0 100 60" preserveAspectRatio="none">
              ${[15, 35, 55, 75].map((x) => `<line x1="${x}" y1="0" x2="${x - 6}" y2="60" stroke="#fff" stroke-width=".7"/>`).join("")}
              ${[18, 38].map((y) => `<line x1="0" y1="${y}" x2="100" y2="${y - 4}" stroke="#fff" stroke-width="1"/>`).join("")}
              <rect x="60" y="8" width="14" height="10" fill="#d7e8dc" />
              <rect x="18" y="36" width="12" height="12" fill="#d7e8dc" />
              <path d="M0 52 C30 46,60 50,100 40 L100 60 L0 60Z" fill="#cfe3ea" />
            </svg>
            <div class="mini-map-pin">${esc(l.building || areaName(l.loc))}</div>
          </div>
          <div class="nearby">
            ${(NEAR[l.cat] || NEAR.commercial)
              .map(
                ([i, a, b]) => `
              <div>${ico(i)}<b>${esc(a)}</b><small>${esc(b)}</small></div>
            `,
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <h2>Reviews</h2>
          <div class="reviews-summary">
            <div>
              <div class="rating-value">${l.rating}</div>
              <div class="rating-stars">★★★★★</div>
              <div style="color:var(--color-text-muted);font-size:12.5px;margin-top:4px">${l.reviews} verified reviews</div>
            </div>
            <div class="rating-bars">
              ${[72, 18, 6, 3, 1]
                .map(
                  (d, i) => `
                <div>${5 - i}★<i><b style="width:${d}%"></b></i>${d}%</div>
              `,
                )
                .join("")}
            </div>
          </div>
          <div class="reviews">
            <div>
              <div class="review-header">
                <span class="avatar">NK</span>
                <span><b>Nadia K.</b><small>★★★★★ · Aug 2026</small></span>
              </div>
              ${LEASE ? `Viewing was arranged the same day and ${esc(fn)} answered every question on WhatsApp.` : "Exactly as pictured. Replied within minutes and sorted everything before we arrived."}
            </div>
            <div>
              <div class="review-header">
                <span class="avatar">OH</span>
                <span><b>Omar H.</b><small>★★★★★ · Jul 2026</small></span>
              </div>
              ${LEASE ? "Clear on cheques, deposit and Ejari from the start. No surprises at contract." : "Great value and very easy to arrange. Would use again."}
            </div>
          </div>
        </section>

        ${
          similar.length
            ? `
          <section class="section">
            <h2>Similar ${esc(O.h1.toLowerCase().replace(" for rent", "").replace(" for lease", ""))} nearby</h2>
            <div class="card-row">
              ${similar.map((x) => UPUI.card(x)).join("")}
            </div>
          </section>
        `
            : ""
        }
      </div>

      <aside class="sidebar">
        <div class="price-box">
          <div class="price-row">
            <div class="price">${esc(pt.n)}<span> ${esc(pt.u)}</span></div>
            ${
              seg
                ? `
              <div class="price-toggle">
                ${seg.options
                  .map(
                    (o) => `
                  <button class="${per === o.v ? "is-active" : ""}" data-per="${esc(o.v)}">${esc(o.l)}</button>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
          ${
            terms.length
              ? `
            <p class="price-terms">
              ${terms.map(([k, v]) => `<span>${esc(k)} <b>${esc(v)}</b></span>`).join("")}
            </p>
          `
              : ""
          }
        </div>
        ${DM.agentCard(l)}
        <div class="safety-note">
          <b>${ico("shield")}Deal safely</b>
          ${LEASE ? "Never transfer a deposit or cheques before viewing and checking the permit on Dubai REST." : "Confirm details with the provider before paying any deposit."}
          UpNow never takes payments.<br />
          <a href="#" onclick="UPUI.toast('Thanks — our team will review this listing');return false">${ico("flag")}Report this listing</a>
        </div>
      </aside>
    </div>`;
  document.getElementById("mbar").innerHTML =
    `<button class="btn btn-primary" data-call="${l.id}">${ico("phone")}${t("Call")}</button><button class="btn btn-whatsapp" data-wa="${l.id}">${ico("wa")}${t("WhatsApp")}</button><button class="btn btn-outline" data-email="${l.id}">${ico("msg")}Email</button>`;
  UPUI.updateHdrCounts();
  DM.rerender();
}
document.addEventListener("click", (e) => {
  const p = e.target.closest("[data-per]");
  if (p) {
    per = p.dataset.per;
    paint();
    return;
  }
  const g = e.target.closest("[data-lb]");
  if (g) openLb(+g.dataset.lb);
});
let lbI = 0;
const lb = document.getElementById("lb");
function openLb(i) {
  if (!l.img.length) return;
  lbI = i % l.img.length;
  lb.innerHTML = `<img src="${l.img[lbI]}" alt="${esc(l.title)} — photo ${lbI + 1} of ${l.img.length}"><button class="lightbox-prev" aria-label="Previous photo" data-lbm="-1">${ico("chevL")}</button><button class="lightbox-next" aria-label="Next photo" data-lbm="1">${ico("chevR")}</button><button class="lightbox-close" aria-label="Close photos" data-lbc>${ico("x")}</button><div class="lightbox-counter">${lbI + 1} / ${l.img.length}</div>`;
  lb.classList.add("is-active");
}
lb.addEventListener("click", (e) => {
  e.stopPropagation();
  const m = e.target.closest("[data-lbm]");
  if (m) {
    openLb(lbI + +m.dataset.lbm + l.img.length);
    return;
  }
  if (e.target.closest("[data-lbc]") || e.target === lb)
    lb.classList.remove("is-active");
});
document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("is-active")) return;
  if (e.key === "ArrowRight") openLb(lbI + 1);
  if (e.key === "ArrowLeft") openLb(lbI - 1 + l.img.length);
  if (e.key === "Escape") lb.classList.remove("is-active");
});
paint();
document.addEventListener("upnow:leads", () => {
  const sc = scrollY;
  paint();
  scrollTo(0, sc);
});
