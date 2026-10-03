const { LISTINGS, offerOf, areaName, VERTICALS, AREAS } = UP;
const { ico, esc, money, initials } = UPUI;
const qp = new URLSearchParams(location.search).get("p");
const name = LISTINGS.some((l) => l.provider.name === qp)
  ? qp
  : "Tariq Hassan";
const P = DM.prov(name);
const L0 = P.L[0],
  O0 = offerOf(L0.v, L0.cat),
  SP = P.v === "spaces",
  LEASE = !!O0.lease;
document.getElementById("hdr").innerHTML = UPUI.header(P.v);
document.getElementById("ftr").innerHTML = UPUI.footer();
UPUI.bindHeader();
document.title = `${P.name} · ${P.org} | UpNow`;

let s = 0;
for (const c of name) s += c.charCodeAt(0) * 13;
const r = () => {
  s = (s * 9301 + 49297) % 233280;
  return s / 233280;
};
const yrs = 2026 - P.since,
  deals = Math.round(P.L.length * 9 + r() * 40),
  first = P.name.split(" ")[0];
const areas = Object.entries(
  P.L.reduce((m, l) => ((m[l.loc] = (m[l.loc] || 0) + 1), m), {}),
).sort((a, b) => b[1] - a[1]);
const cats = Object.entries(
  P.L.reduce((m, l) => ((m[l.cat] = (m[l.cat] || 0) + 1), m), {}),
);
const prices = P.L.map((l) => l.price).sort((a, b) => a - b);
const licence = SP
  ? LEASE
    ? ["RERA broker card", "BRN " + (P.brn || "40217")]
    : [O0.permit, L0.permit || "DXB-000000"]
  : [
      O0.org[0]
        .replace("-licensed", " licence")
        .replace("-registered", " registration")
        .replace("-approved", " approval"),
      "No. " + (100000 + Math.round(r() * 899999)),
    ];
const superA = P.rating >= 4.5 && P.reply <= 15;
const NAT = {
  Tariq: "Egyptian",
  Aisha: "Pakistani",
  Omar: "Jordanian",
  Priya: "Indian",
  Daniel: "Bulgarian",
  Fatima: "Emirati",
  Rahul: "Indian",
  Layla: "Lebanese",
  Marco: "Italian",
  Sara: "Egyptian",
  Ahmed: "Emirati",
};

let tab = "listings";
const pf = PROFILE.newState(P.L);
const listingsHTML = () => PROFILE.listingsPanel();
function reviewsHTML() {
  const attrs =
    SP && LEASE
      ? ["Responsiveness", "Market knowledge", "Negotiation", "Honesty"]
      : ["Responsiveness", "Value for money", "Quality", "Punctuality"];
  const R = [
    [
      "Nadia K.",
      "Rented a 2-bed in " + areaName(areas[0][0]),
      `${first} sent a video walkthrough within 10 minutes and arranged the viewing the same evening. Paperwork and Ejari were done in two days.`,
      5,
      "Aug 2026",
      1,
    ],
    [
      "James P.",
      SP ? "Viewed 3 properties" : "Booked twice",
      "Very knowledgeable about the area and honest about service charges. Didn’t push us towards the most expensive option.",
      5,
      "Jul 2026",
      0,
    ],
    [
      "Omar H.",
      SP ? "Renewed tenancy" : "Regular customer",
      "Quick on WhatsApp, always picks up. Negotiated 4 cheques instead of 2 with the landlord.",
      4,
      "Jun 2026",
      1,
    ],
  ];
  return `<div class="reviews-summary"><div><div class="rating-value">${P.rating.toFixed(1)}</div><div class="rating-stars">★★★★★</div><div style="color:var(--color-text-muted);font-size:12.5px;margin-top:4px">${P.reviews.toLocaleString()} verified reviews</div></div>
    <div class="rating-breakdown">${[78, 15, 4, 2, 1].map((d, i) => `<div><span>${5 - i} stars</span><i><b style="width:${d}%"></b></i><em>${d}%</em></div>`).join("")}</div>
    <div class="rating-breakdown">${attrs
      .map((a, i) => {
        const v = (4.9 - i * 0.1 - r() * 0.2).toFixed(1);
        return `<div><span>${a}</span><i><b style="width:${(v / 5) * 100}%"></b></i><em>${v}</em></div>`;
      })
      .join("")}</div></div>
    <div class="review-list">${R.map(([n, ctx, t, st, d, rep]) => `<div><div class="review-header"><span class="avatar">${initials(n)}</span><span><b>${n}</b><small>${esc(ctx)} · ${d}</small></span><span class="review-stars">${"★".repeat(st)}${"☆".repeat(5 - st)}</span></div><p>${esc(t)}</p><span class="review-tag">${ico("check")}Verified ${SP ? "enquiry" : "booking"} on UpNow</span>${rep ? `<div class="owner-reply"><b>${esc(first)} replied:</b> Thank you! It was a pleasure helping you — reach out any time.</div>` : ""}</div>`).join("")}</div>`;
}
function areasHTML() {
  return `<div class="area-map">${areas
    .map(([id, n]) => {
      const a = UP.areaById[id];
      const sz = 34 + n * 16;
      return `<i style="left:${a.x}%;top:${a.y}%;width:${sz}px;height:${sz}px"></i><span style="left:${a.x}%;top:${a.y}%">${esc(a.n)}</span>`;
    })
    .join("")}</div>
    <div class="link-chips">${areas.map(([id, n]) => `<a href="${PATHS.href.search}?v=${P.v}&o=${L0.cat}&loc=${id}">${ico("pin")}${esc(areaName(id))}<em>${n}</em></a>`).join("")}</div>`;
}
function teamHTML() {
  const T = [
    ...new Set(
      LISTINGS.filter(
        (l) => l.provider.org === P.org && l.provider.name !== P.name,
      ).map((l) => l.provider.name),
    ),
  ].slice(0, 4);
  return T.length
    ? `<div class="team">${T.map((n) => {
        const q = DM.prov(n);
        return `<a href="${PATHS.href.provider}?p=${encodeURIComponent(n)}"><div class="avatar" style="--hue:${q.hue}">${initials(n)}</div><b>${esc(n)}</b><small>${q.rating.toFixed(1)}★ · ${q.L.length} listings</small></a>`;
      }).join("")}</div>`
    : "";
}
function paint() {
  const T = [
    ["listings", SP ? "Properties" : "Services", P.L.length],
    ["reviews", "Reviews", P.reviews],
    ["areas", "Areas served", areas.length],
  ].filter(Boolean);
  const team = P.person && !/^Private/.test(P.org) ? teamHTML() : "";
  document.getElementById("pv").innerHTML = `
  <div class="provider-cover"><svg viewBox="0 0 1440 70" preserveAspectRatio="none"><path d="M0 70 L0 46 C260 4 520 0 820 30 C1080 56 1280 44 1440 20 L1440 70Z" fill="var(--color-bg)"/></svg></div>
  <div class="wrap">
    <div class="provider-header">
      <div class="provider-avatar ${P.person ? "" : "is-business"}" style="--hue:${P.hue}">${initials(P.name)}<span class="online-dot"></span></div>
      <div><div class="provider-name">${esc(P.name)}<svg class="icon" viewBox="0 0 24 24">${UPUI.ICONS.badge}</svg></div>
        <div class="provider-meta"><span>${ico(SP ? "office" : "shop")}${P.person && DM.isAgency(P.org) ? `<a class="agency-link" href="${DM.agencyHref(P.org)}">${esc(P.org)}</a>` : esc(P.person ? P.org : O0.org[0])}</span>${P.brn ? `<span>${ico("badge")}BRN ${P.brn}</span>` : ""}<span class="rating">${ico("star")}<b>${P.rating.toFixed(1)}</b>&nbsp;(${P.reviews.toLocaleString()})</span><span>${ico("clock")}Replies within ${P.reply} min</span><span>${ico("globe")}${esc(P.langs.join(", "))}</span></div>
        <div class="provider-badges">${superA ? `<span class="is-gold">${ico("star")}${SP ? "SuperAgent" : "Top provider"} 2026</span>` : ""}<span>${ico("shield")}${esc(licence[0])} verified</span><span>${ico("user")}ID verified</span><span>${ico("phone")}Phone verified</span><span>${ico("cal")}On UpNow since ${P.since}</span></div></div>
      <div class="provider-actions"><button class="btn btn-outline" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href);UPUI.toast('Profile link copied')">${ico("share")}Share</button><button class="btn btn-outline" onclick="UPUI.toast('Following ${esc(first)} — you’ll get new listings')">${ico("bell")}Follow</button><button class="btn btn-whatsapp is-contact" data-wa="${L0.id}">${ico("wa")}WhatsApp</button><button class="btn btn-primary is-contact" data-call="${L0.id}">${ico("phone")}Call</button></div>
    </div>
    <div class="provider-layout"><div>
      <div class="kpis"><div><b>${P.L.length}</b><span>Active ${SP ? "listings" : "offers"}</span></div>${LEASE ? "" : `<div><b>${deals}</b><span>Bookings (12 mo)</span></div>`}<div><b>${P.reply} min</b><span>Median reply</span></div><div><b>${96 + Math.round(r() * 3)}%</b><span>Response rate</span></div><div><b>${yrs + (P.person ? 3 : 0)} yrs</b><span>Experience</span></div></div>
      <div class="provider-card"><h2>About ${esc(first)}</h2>
        <p class="provider-about">${
          SP && P.person
            ? `${esc(P.name)} is a ${LEASE ? "RERA-certified leasing consultant" : "licensed operator"} at ${esc(P.org)}, specialising in ${esc(cats.map(([c]) => offerOf(P.v, c).label.toLowerCase()).join(" and "))} across ${esc(
                areas
                  .slice(0, 3)
                  .map((a) => areaName(a[0]))
                  .join(", "),
              )}. Known for same-day viewings, clear breakdowns of cheques, deposits and Ejari, and staying in touch after move-in.`
            : `${esc(P.name)} is a ${esc(O0.org[0])} serving ${esc(
                areas
                  .slice(0, 3)
                  .map((a) => areaName(a[0]))
                  .join(", "),
              )}${P.L.some((l) => l.coverage) ? " and " + (P.L[0].coverage || []).length + " more communities" : ""}. Every booking is handled directly — you agree details and pay ${esc(first)} with no middleman.`
        }</p>
        <div class="facts">
          <div><small>Specialises in</small><b>${esc(cats.map(([c]) => offerOf(P.v, c).label).join(", "))}</b></div>
          <div><small>Price range</small><b>${money(prices[0])} – ${UP.K(prices[prices.length - 1])}</b></div>
          <div><small>Languages</small><b>${esc(P.langs.join(", "))}</b></div>
          ${P.person ? `<div><small>Nationality</small><b>${NAT[first] || "—"}</b></div>` : `<div><small>Opening hours</small><b>Sat–Thu 9:00–21:00</b></div>`}
          <div><small>${esc(licence[0])}</small><b>${esc(licence[1])}</b></div>
          <div><small>Typical reply</small><b>${P.reply <= 5 ? "Within 5 minutes" : "Within " + P.reply + " min"} · 9 AM–10 PM</b></div>
        </div></div>
      <div class="provider-card"><div class="tabs">${T.map(([k, t, n]) => `<button class="${tab === k ? "is-active" : ""}" data-tab="${k}">${t}<em>${n.toLocaleString()}</em></button>`).join("")}</div>
        ${{ listings: listingsHTML, reviews: reviewsHTML, areas: areasHTML }[tab]()}</div>
      ${team ? `<div class="provider-card"><h2>More from ${esc(P.org)} <a class="text-link" href="${DM.agencyHref(P.org)}">View agency</a></h2>${team}</div>` : ""}
    </div>
    <aside class="provider-sidebar">
      ${DM.agentCard(L0, { channels: true })}
      <div class="verification-box"><h4>${ico("shield")}Verified by UpNow</h4>
        <div class="verification-row">${ico("check")}<span>${esc(licence[0])}</span><b>${esc(licence[1])}</b></div>
        <div class="verification-row">${ico("check")}<span>Emirates ID</span><b>Checked</b></div>
        <div class="verification-row">${ico("check")}<span>${P.person ? "Employer / agency" : "Trade licence"}</span><b>${P.person ? "Confirmed" : "Valid to 2027"}</b></div>
        <div class="verification-row">${ico("check")}<span>Mobile number</span><b>Verified</b></div>
        ${SP && LEASE ? `<div class="verification-row">${ico("check")}<span>Listings with DLD permit</span><b>${P.L.filter((l) => l.a.verified).length}/${P.L.length}</b></div>` : ""}
        <p style="font-size:12px;color:var(--color-text-muted);margin:10px 0 0">${SP && LEASE ? "Validate the broker card on the Dubai REST app. " : ""}UpNow never takes payments. <a class="text-link" href="#" onclick="UPUI.toast('Thanks — our trust team will review');return false">Report profile</a></p></div>
    </aside></div>
  </div>`;
  if (tab === "listings") PROFILE.mount(P.L, pf);
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]");
  if (t) {
    tab = t.dataset.tab;
    paint();
    return;
  }
});
paint();
