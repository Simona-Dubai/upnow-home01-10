const { VERTICALS, LISTINGS, AREAS, areaById, areaName, offerOf } = UP;
const {
  ico,
  esc,
  results,
  toQuery,
  parseState,
  valueLabel,
  facetCount,
  offer,
  blankState,
  empty,
  t,
  money,
} = UPUI;
const { controlHTML } = UPF;
const PER = 24;
let S = parseState();
let hlId = null,
  areasOpen = false;

document.getElementById("hdr").innerHTML = UPUI.header(S.v, { nav: false }); // the category tabs under it already do this job
document.getElementById("ftr").innerHTML = UPUI.footer();
UPUI.bindHeader();
const bar = UPF.SearchBar(document.getElementById("sb"), S, {
  mode: "bar",
  onChange: () => update(),
  onSubmit: () => {
    update();
    closeSheet();
  },
  onFilters: () => openDrawer(),
});
const PHONE = matchMedia("(max-width: 700px)");

function update(push = true) {
  const q = toQuery(S);
  if (push && q !== location.search) history.pushState(null, "", q);
  document
    .querySelectorAll(".site-header .nav a")
    .forEach((a) =>
      a.classList.toggle("is-active", a.dataset.nav === S.v),
    );
  paint();
}
window.addEventListener("popstate", () => {
  const n = parseState();
  Object.keys(S).forEach((k) => delete S[k]);
  Object.assign(S, n);
  bar.render();
  paint();
});

const typeDef = (O) =>
  O &&
  O.defs.find((d) =>
    [
      "ptype",
      "ctype",
      "itype",
      "landuse",
      "mtype",
      "sport",
      "venueType",
      "ytype",
    ].includes(d.id),
  );
function seoTitle() {
  const O = offer(S),
    td = O && typeDef(O);
  let noun = O ? O.h1 : "Everything on UpNow";
  const tv = td && S.f[td.id];
  const tl = tv && [].concat(tv).length === 1 ? valueLabel(td, tv) : null;
  if (tl)
    noun =
      tl +
      (O.lease
        ? O.id === "land"
          ? " plots for lease"
          : "s for rent"
        : "s");
  const bd = S.f.beds;
  if (O && O.id === "residential" && bd && bd.length === 1)
    noun =
      (bd[0] === "0" ? "Studio " : bd[0] + "-bedroom ") +
      (tl ? tl.toLowerCase() + "s for rent" : "properties for rent");
  const where = S.loc.length
    ? S.loc.map(areaName).slice(0, 2).join(" & ") +
      (S.loc.length > 2 ? " +" + (S.loc.length - 2) : "")
    : "Dubai";
  return (
    (S.q ? "“" + S.q + "” — " : "") +
    noun.charAt(0).toUpperCase() +
    noun.slice(1) +
    " in " +
    where
  );
}

/* area chips under the title: where the current results are, busiest first (counts ignore the area filter) */
const AREAS_SHOWN = 8;
function paintAreas(O) {
  const el = document.getElementById("areas");
  if (!O || O.locAll) {
    el.innerHTML = "";
    return;
  }
  const base = results({ ...S, loc: [] });
  const areas = AREAS.map((a) => ({
    a,
    n: base.filter((l) => l.loc === a.id || (l.coverage || []).includes(a.id)).length,
  }))
    .filter((x) => x.n || S.loc.includes(x.a.id))
    .sort((x, y) => y.n - x.n);
  const hidden = areas.length - AREAS_SHOWN;
  const shown = areasOpen ? areas : areas.filter((x, i) => i < AREAS_SHOWN || S.loc.includes(x.a.id));
  const href = (loc) => PATHS.href.search + toQuery({ ...S, loc, page: 1 });
  el.innerHTML =
    `<a href="${href([])}" class="${S.loc.length ? "" : "is-active"}">All Dubai <em>${base.length}</em></a>` +
    shown
      .map(({ a, n }) => {
        const on = S.loc.includes(a.id);
        return `<a href="${href(on ? S.loc.filter((x) => x !== a.id) : [a.id])}" class="${on ? "is-active" : ""}">${esc(a.n)} <em>${n}</em></a>`;
      })
      .join("") +
    (hidden > 0 ? `<button type="button" class="more" data-areas>${areasOpen ? "View less" : `View more (${hidden})`}</button>` : "");
}
document.getElementById("areas").addEventListener("click", (e) => {
  if (e.target.closest("[data-areas]")) {
    areasOpen = !areasOpen;
    paintAreas(offer(S));
  }
});

/* "Can't find it?" — the UpNow team shortlists options on WhatsApp (SITE.concierge); the message carries the search */
function conciergeHTML(cls = "") {
  const C = SITE.concierge;
  if (!C) return "";
  return `<div class="concierge ${cls}">${ico("wa")}<p><b>${esc(C.title)}</b> ${esc(C.text)}</p>
    <button type="button" class="btn btn-whatsapp btn-sm" data-concierge>${esc(C.label)}${ico("chevR")}</button></div>`;
}
function openConcierge() {
  const C = SITE.concierge;
  const what = seoTitle().replace(/^“[^”]*” — /, "");
  const msg = `Hi ${SITE.name}, I'm looking for ${what.charAt(0).toLowerCase() + what.slice(1)}${S.q ? ` (“${S.q}”)` : ""}. Can you shortlist some options for me?\n${location.href}`;
  if (C.whatsapp) window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  else UPUI.toast("Thanks — our team will WhatsApp you a shortlist");
}

/* save search (alert) button beside the sort */
const alertKey = () => toQuery({ ...S, page: 1, sort: "rec", view: "grid" });
const alerts = () => JSON.parse(localStorage.getItem("upnow.alerts") || "[]");
function paintSave() {
  const el = document.getElementById("saveS");
  const on = alerts().includes(alertKey());
  el.hidden = !offer(S);
  el.classList.toggle("is-active", on);
  el.innerHTML = `${ico("bell")}${on ? "Alert on" : t("Save search")}`;
}
document.getElementById("saveS").addEventListener("click", () => {
  const k = alertKey();
  let a = alerts();
  const on = a.includes(k);
  a = on ? a.filter((x) => x !== k) : [...a, k];
  localStorage.setItem("upnow.alerts", JSON.stringify(a));
  UPUI.toast(on ? "Search alert removed" : "Saved — we'll WhatsApp you new matches");
  paintSave();
});

/* all-filters drawer */
const drawer = document.getElementById("drawer"),
  dscrim = document.getElementById("dscrim");
function openDrawer() {
  paintDrawer();
  drawer.classList.add("is-active");
  dscrim.classList.add("is-active");
}
document.addEventListener("upnow:escape", () => {
  closeDrawer();
  closeSheet();
});
function closeDrawer() {
  drawer.classList.remove("is-active");
  dscrim.classList.remove("is-active");
}
dscrim.onclick = closeDrawer;
function paintDrawer() {
  const O = offer(S);
  if (!O) return;
  const n = results(S).length;
  const sc = drawer.querySelector(".filter-drawer-body")
    ? drawer.querySelector(".filter-drawer-body").scrollTop
    : 0;
  const sec = (title, defs) =>
    defs.length
      ? (title ? `<div class="filter-group-label">${title}</div>` : "") +
        defs
          .map(
            (d) =>
              `<div class="filter-section">${d.type === "toggle" ? "" : `<h5>${esc(d.label)}${!empty(S.f[d.id]) && !d.required ? `<button class="text-link" data-dclr="${d.id}">Clear</button>` : ""}</h5>`}${controlHTML(d, S)}</div>`,
          )
          .join("")
      : "";
  const extra = O.optional;
  const nSet = extra.filter((d) => !d.required && !empty(S.f[d.id])).length;
  drawer.innerHTML = `<div class="filter-drawer-header"><div style="flex:1"><h3>${t("Filters")}${nSet ? ` <span class="filter-drawer-count">${nSet}</span>` : ""}</h3><div style="color:var(--color-text-muted);font-size:12.5px;margin-top:2px">${esc(O.label)} · priced ${esc(O.basis)}</div></div><button class="close-btn" aria-label="Close" data-dclose>${ico("x")}</button><button class="text-link m-reset" data-dreset>Reset</button></div>
    <div class="filter-drawer-body">
      ${sec("", extra.filter((d) => d.type !== "toggle"))}
      ${sec("Only show", extra.filter((d) => d.type === "toggle"))}
    </div>
    <div class="filter-drawer-footer"><button class="btn btn-ghost" data-dreset>Reset all</button><button class="btn btn-primary" data-dclose>Show ${n} ${n === 1 ? "result" : "results"}</button></div>`;
  const db = drawer.querySelector(".filter-drawer-body");
  if (db) db.scrollTop = sc;
}
drawer.addEventListener("click", (e) => {
  const tt = e.target;
  if (tt.closest("[data-dclose]")) {
    closeDrawer();
    return;
  }
  if (tt.closest("[data-dreset]")) {
    const B = blankState(S.v, S.o);
    offer(S).optional.forEach((d) => {
      if (d.type !== "seg") {
        if (B.f[d.id] === undefined) delete S.f[d.id];
        else S.f[d.id] = B.f[d.id];
      }
    });
    S.page = 1;
    bar.render();
    update();
    paintDrawer();
    return;
  }
  const dc = tt.closest("[data-dclr]");
  if (dc) {
    delete S.f[dc.dataset.dclr];
    bar.render();
    update();
    paintDrawer();
    return;
  }
  const ctl = tt.closest("[data-ctl]");
  if (ctl && ctl.tagName !== "INPUT") {
    if (UPF.handleControl(ctl, S)) {
      bar.render();
      update();
      paintDrawer();
    }
  }
});
drawer.addEventListener("change", (e) => {
  const c = e.target.closest("[data-ctl]");
  if (c && UPF.handleControl(c, S)) {
    bar.render();
    update();
    paintDrawer();
  }
});

/* compact row (list view) — same row as the agent / agency pages, plus call and WhatsApp */
function row(l) {
  const pt = UPUI.priceText(l, S);
  return `<a class="row-item" href="${PATHS.href.listing}?id=${l.id}" data-id="${l.id}">${UPUI.photo(l, 0)}
    <span>${S.v === "all" || !S.o ? `<small class="row-cat">${esc(offerOf(l.v, l.cat).label)}</small>` : ""}<b>${esc(l.title)}</b><small>${ico("pin")} ${esc(UPUI.locText(l))}</small><small class="row-spec">${UPUI.specOf(l).map(esc).join(" · ")}</small></span>
    <span class="row-price">${pt.n}<span>${esc(pt.u)}</span></span>
    <span class="row-acts"><button class="btn btn-outline" data-call="${l.id}" aria-label="${t("Call")}" title="${t("Call")}">${ico("phone")}</button><button class="btn btn-whatsapp" data-wa="${l.id}" aria-label="${t("WhatsApp")}" title="${t("WhatsApp")}">${ico("wa")}</button></span></a>`;
}

/* map */
function mapHTML(list) {
  const byArea = {};
  list.forEach((l) => {
    (byArea[l.loc] = byArea[l.loc] || []).push(l);
  });
  const pp = (l) => {
    const n = UPUI.priceOf(l, S);
    return n >= 1000 ? UP.K(n) : n;
  };
  // phone: the docked listing's pin is the highlighted one
  const hl = PHONE.matches ? ((list.find((l) => l.id === hlId) || list[0] || {}).id) : hlId;
  return `<div class="map-panel"><svg class="map-base" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M0 0 L100 0 L100 8 C 80 10, 60 14, 40 22 C 25 28, 10 40, 0 48 Z" fill="#cfe3ea"/>
      ${[20, 40, 60, 80].map((x) => `<line x1="${x}" y1="0" x2="${x - 10}" y2="100" stroke="#fff" stroke-width=".6"/>`).join("")}
      ${[30, 55, 78].map((y) => `<line x1="0" y1="${y + 10}" x2="100" y2="${y - 6}" stroke="#fff" stroke-width=".9"/>`).join("")}
      <path d="M5 70 C 30 60, 60 44, 100 30" stroke="#f4dca8" stroke-width="1.2" fill="none"/></svg>
    ${AREAS.map((a) => `<div class="map-label" style="left:${a.x}%;top:${a.y}%">${esc(a.n)}</div>`).join("")}
    ${Object.entries(byArea)
      .map(([loc, ls]) => {
        const a = areaById[loc];
        return (
          ls
            .slice(0, 3)
            .map(
              (l, i) =>
                `<div class="map-pin ${hl === l.id ? "is-highlighted" : ""}" data-pin="${l.id}" style="left:${a.x + (i - (Math.min(ls.length, 3) - 1) / 2) * 6}%;top:${a.y - (i % 2) * 2}%">${pp(l)}</div>`,
            )
            .join("") +
          (ls.length > 3
            ? `<div class="map-pin" style="left:${a.x}%;top:${a.y + 6}%"><small>+${ls.length - 3}</small></div>`
            : "")
        );
      })
      .join("")}
    <div class="map-note">${list.length} results · ${UPUI.prefs.cur} · illustrative map</div>${mapDock(list)}</div>`;
}
// phone: the selected (or first) result docked at the bottom of the full-height map; hidden above 700px
function mapDock(list) {
  const l = list.find((x) => x.id === hlId) || list[0];
  if (!l) return "";
  const pt = UPUI.priceText(l, S);
  return `<a class="map-dock" href="${PATHS.href.listing}?id=${l.id}" data-id="${l.id}">${UPUI.photo(l, 0)}<span><b>${pt.n}<small>${esc(pt.u)}</small></b><span class="map-dock-title">${esc(l.title)}</span><small>${ico("pin")}${esc(UPUI.locText(l))}</small></span>
    <button class="fav-btn ${UPUI.favs.has(l.id) ? "is-active" : ""}" data-fav="${l.id}" aria-label="Save ${esc(l.title)}">${ico("heart")}</button></a>`;
}

// one concierge banner per page: after the first two grid rows (12 results), or after the last result on short pages
const withConcierge = (items) => {
  const at = Math.min(12, items.length);
  return [...items.slice(0, at), conciergeHTML(), ...items.slice(at)].join("");
};

function paint() {
  const O = offer(S);
  const all = results(S);
  const pages = Math.max(1, Math.ceil(all.length / PER));
  if (S.page > pages) S.page = pages;
  const list = all.slice((S.page - 1) * PER, S.page * PER);
  const title = seoTitle();
  document.title = title + " | UpNow";
  document.getElementById("mdesc").content =
    `${all.length} verified results for ${title.toLowerCase()}. Contact owners and agents directly by phone or WhatsApp on UpNow.`;

  const cr = [["Home", PATHS.href.home]];
  if (S.v !== "all")
    cr.push([VERTICALS[S.v].label, PATHS.href.search + "?v=" + S.v]);
  if (O)
    cr.push([O.label, PATHS.href.search + toQuery(blankState(S.v, S.o))]);
  if (S.loc.length === 1) cr.push([areaName(S.loc[0]), null]);
  document.getElementById("crumbs").innerHTML = cr
    .map(
      ([tx, h], i) =>
        (i ? "<span>/</span>" : "") +
        (h && i < cr.length - 1
          ? `<a href="${h}">${esc(tx)}</a>`
          : `<span style="color:var(--color-text)">${esc(tx)}</span>`),
    )
    .join("");
  document.getElementById("h1").textContent = title;
  const sortEl = document.getElementById("sort");
  sortEl.innerHTML = UPUI.SORTS.map(
    ([k, l]) =>
      `<option value="${k}" ${S.sort === k ? "selected" : ""}>${PHONE.matches ? "" : "Sort: "}${l}</option>`,
  ).join("");
  sortEl.onchange = () => {
    S.sort = sortEl.value;
    S.page = 1;
    update();
  };
  document.getElementById("viewsw").innerHTML = [
    ["grid", "grid4", t("Grid view")],
    ["list", "list", t("List view")],
    ["map", "map", t("Map view")],
  ]
    .map(
      ([k, i, l]) =>
        `<button class="${S.view === k ? "is-active" : ""}" data-view="${k}" aria-label="${l}" title="${l}">${ico(i)}</button>`,
    )
    .join("");

  paintAreas(O);

  const act = [];
  if (S.q) act.push([`“${S.q}”`, "q"]);
  if (O)
    O.defs.forEach((d) => {
      if (d.required) return;
      const lab = valueLabel(d, S.f[d.id]);
      if (lab)
        act.push([
          (d.type === "toggle" ? "" : d.label + ": ") + lab,
          "f:" + d.id,
        ]);
    });
  document.getElementById("active").innerHTML = act.length
    ? act
        .map(
          ([tx, k]) =>
            `<button class="chip" data-rm="${esc(k)}">${esc(tx)} ${ico("x")}</button>`,
        )
        .join("") +
      `<button class="text-link" data-rm="*" style="margin-left:6px">Clear all</button>`
    : "";

  const view = S.view;
  document.getElementById("layout").className =
    "layout" +
    (view === "map" ? " is-map-view" : " is-grid-view");
  let body;
  if (!all.length) {
    const relax = [];
    if (S.loc.length) relax.push(["Search all of Dubai", "*loc"]);
    if (O)
      O.defs.forEach((d) => {
        if (!empty(S.f[d.id]) && !d.required) {
          const T = { ...S, f: { ...S.f } };
          delete T.f[d.id];
          const n = results(T).length;
          if (n)
            relax.push([
              `Remove “${valueLabel(d, S.f[d.id])}” (${n})`,
              "f:" + d.id,
            ]);
        }
      });
    const nf = act.length + S.loc.length;
    const mrelax = relax.length
      ? `<div class="m-relax"><p>You're one change away</p>${relax
          .slice(0, 4)
          .map(([tx, k]) => {
            const m = tx.match(/^(.*) \((\d+)\)$/);
            const n = m ? +m[2] : k === "*loc" ? results({ ...S, loc: [] }).length : 0;
            return `<button type="button" data-rm="${k}"><span>${esc(m ? m[1] : tx)}</span>${n ? `<em>+${n}</em>` : ""}</button>`;
          })
          .join("")}</div>`
      : `<div class="m-relax"><button type="button" data-rm="*"><span>Clear all filters</span></button></div>`;
    body = `<div class="results-empty"><div class="m-empty-ico">${ico("search")}</div><h3 class="m-empty-h">${nf > 1 ? `No results match all ${nf} filters` : "No exact matches"}</h3>${mrelax}${O ? `<button type="button" class="btn btn-outline m-empty-alert" data-alert>${ico("bell")}Alert me when one lists</button>` : ""}${ico("search")}<h3>No exact matches</h3><p>Try widening your search — these would show results:</p><div class="option-chips">${
      relax
        .slice(0, 4)
        .map(
          ([tx, k]) =>
            `<button class="chip" data-rm="${k}">${esc(tx)}</button>`,
        )
        .join("") ||
      '<button class="chip" data-rm="*">Clear all filters</button>'
    }</div></div>${conciergeHTML("is-wide")}`;
  } else if (view === "list") {
    body = `<div class="row-list">${withConcierge(list.map(row))}</div>`;
  } else {
    const cards = list.map((l) => UPUI.card(l, S, { acts: 1 }));
    // phone only (hidden above 700px): kept inside the first item so the concierge position doesn't move
    if (offer(S)) cards[0] += `<button type="button" class="m-alert" data-alert>${ico("bell")}<span><b>Be first to new matches</b><small>We'll WhatsApp you when one lists</small></span><em>Alert me</em></button>`;
    body = `<div class="compact-grid">${withConcierge(cards)}</div>`;
  }
  const pager =
    pages > 1
      ? `<div class="pager"><button data-pg="${S.page - 1}" ${S.page === 1 ? "disabled" : ""}>${ico("chevL")}</button>${Array.from({ length: pages }, (_, i) => `<button class="${S.page === i + 1 ? "is-active" : ""}" data-pg="${i + 1}">${i + 1}</button>`).join("")}<button data-pg="${S.page + 1}" ${S.page === pages ? "disabled" : ""}>${ico("chevR")}</button></div>`
      : "";
  document.getElementById("res").innerHTML = body + pager;
  const aside = document.getElementById("aside");
  aside.innerHTML = view === "map" ? mapHTML(all) : "";
  aside.style.display = view === "map" ? "" : "none";
  paintSave();
  paintSeo();
  paintPhone(O, all);
  UPUI.updateHdrCounts();
}

/* ---- phone (≤700px): summary pill + chip row on top, count row, Map pill, full-screen search sheet ----
   all of this markup is display:none above 700px (css/pages/search.css) */
const msearch = document.getElementById("msearch"),
  ssearch = document.getElementById("ssearch"),
  mmap = document.getElementById("mmap");
let lastView = S.view === "map" ? "grid" : S.view;
// a bare number ("2", "Studio, 1", "5+") reads better with its label: "2 bedrooms"
const mVal = (d, val) => {
  const v = valueLabel(d, val);
  return v && /^(studio|[\d+]+)([,\s]+(studio|[\d+]+))*( \+\d+)?$/i.test(v) ? `${v} ${d.label.toLowerCase()}` : v;
};
function summary(O) {
  const where = S.loc.length
    ? S.loc.map(areaName).slice(0, 2).join(", ") + (S.loc.length > 2 ? " +" + (S.loc.length - 2) : "")
    : "Dubai";
  const l1 = [S.q ? `“${S.q}”` : where, O ? O.label : "Everything"].join(" · ");
  if (!O) return [l1, "Search anything — homes, services, experiences…"];
  const main = O.fields.filter((f) => f !== "loc").map((f) => O.def(f)).filter(Boolean);
  const set = main.map((d) => mVal(d, S.f[d.id])).filter(Boolean);
  const more = O.optional.filter((d) => !d.required && !empty(S.f[d.id])).length;
  if (S.q) set.unshift(where);
  if (more) set.push(`+${more} filter${more > 1 ? "s" : ""}`);
  return [l1, set.length ? set.join(" · ") : main.map((d) => d.label).join(" · ")];
}
function paintPhone(O, all) {
  const [l1, l2] = summary(O);
  const nSet = O ? O.optional.filter((d) => !d.required && !empty(S.f[d.id])).length : 0;
  let chips = "";
  if (O) {
    chips =
      `<button type="button" class="chip m-filters-chip ${nSet ? "is-set" : ""}" data-mf>${ico("sliders")}${t("Filters")}${nSet ? ` · ${nSet}` : ""}</button>` +
      O.fields
        .filter((f) => f !== "loc")
        .map((f) => O.def(f))
        .filter(Boolean)
        .map((d) => {
          const v = mVal(d, S.f[d.id]);
          return `<button type="button" class="chip ${v && !d.required ? "is-active" : ""}" data-mfield="${d.id}">${esc(v && !d.required ? v : d.label)}${ico("chev")}</button>`;
        })
        .join("") +
      O.optional
        .filter((d) => d.type === "toggle")
        .map((d) => `<button type="button" class="chip ${S.f[d.id] ? "is-active" : ""}" data-mtgl="${d.id}">${S.f[d.id] ? ico("check") : ""}${esc(d.label)}</button>`)
        .join("");
  } else {
    chips = UPUI.TABS.filter((v) => v !== "all")
      .map((v) => `<button type="button" class="chip" data-mvert="${v}">${ico(VERTICALS[v].icon)}${esc(t(VERTICALS[v].label))}</button>`)
      .join("");
  }
  msearch.innerHTML = `<div class="m-search-row"><a class="m-back" href="${PATHS.href.home}" aria-label="Back">${ico("chevL")}</a>
      <button type="button" class="m-summary" data-msum><b>${esc(l1)}</b><small>${esc(l2)}</small></button>
      <button type="button" class="m-filter-btn ${nSet ? "is-set" : ""}" data-mf aria-label="${t("Filters")}">${ico("sliders")}${nSet ? `<em>${nSet}</em>` : ""}</button></div>
    <div class="m-chips no-scrollbar">${chips}</div>`;
  document.getElementById("mcount").innerHTML = `${all.length.toLocaleString()} ${all.length === 1 ? "result" : "results"}`;
  document.getElementById("msheet").innerHTML = `<button type="button" class="close-btn" aria-label="Close" data-msclose>${ico("x")}</button><b>${t("Search")}</b><span></span>`;
  const map = S.view === "map";
  if (!map) lastView = S.view;
  mmap.innerHTML = map ? `${ico("list")}${t("List")}` : `${ico("map")}${t("Map")}`;
  mmap.hidden = !all.length;
  document.body.classList.toggle("m-map", map);
  if (map && PHONE.matches) document.body.style.setProperty("--m-top-h", msearch.offsetTop + msearch.offsetHeight + "px");
}
function openSheet(field) {
  ssearch.classList.add("is-m-open");
  document.body.classList.add("m-lock");
  if (field) {
    const b = ssearch.querySelector(`[data-b="open"][data-val="${field}"]`);
    if (b) b.click();
  }
}
function closeSheet() {
  ssearch.classList.remove("is-m-open");
  document.body.classList.remove("m-lock");
}
document.getElementById("msheet").addEventListener("click", (e) => {
  if (e.target.closest("[data-msclose]")) closeSheet();
});
msearch.addEventListener("click", (e) => {
  const tt = e.target;
  if (tt.closest("[data-msum]")) return openSheet();
  if (tt.closest("[data-mf]")) return offer(S) ? openDrawer() : openSheet();
  const f = tt.closest("[data-mfield]");
  if (f) return openSheet(f.dataset.mfield);
  const g = tt.closest("[data-mtgl]");
  if (g) {
    UPF.setVal(S, offer(S).def(g.dataset.mtgl), S.f[g.dataset.mtgl] ? null : true);
    bar.render();
    return update();
  }
  const v = tt.closest("[data-mvert]");
  if (v) {
    UPF.switchVertical(S, v.dataset.mvert);
    bar.render();
    update();
  }
});
mmap.addEventListener("click", () => {
  S.view = S.view === "map" ? lastView || "grid" : "map";
  update();
  window.scrollTo(0, 0);
  paintPhone(offer(S), results(S));
});
PHONE.addEventListener("change", () => {
  if (!PHONE.matches) closeSheet();
  paint();
});

function paintSeo() {
  const O = offer(S),
    td = typeDef(O);
  if (!O) {
    document.getElementById("seo").innerHTML = "";
    return;
  }
  const offerLinks = VERTICALS[S.v].offers
    .map(
      (o) =>
        `<a href="${PATHS.href.search}${toQuery(blankState(S.v, o.id))}">${esc(o.h1)} in Dubai</a>`,
    )
    .join("");
  const areaLinks = AREAS.map((a) => ({
    a,
    c: LISTINGS.filter(
      (l) => l.v === S.v && l.cat === O.id && l.loc === a.id,
    ).length,
  }))
    .filter((x) => x.c)
    .sort((x, y) => y.c - x.c)
    .slice(0, 8)
    .map(
      (x) =>
        `<a href="${PATHS.href.search}${toQuery({ ...blankState(S.v, S.o), loc: [x.a.id] })}">${esc(O.label)} in ${esc(x.a.n)}</a>`,
    )
    .join("");
  const popLinks = td
    ? td.options
        .map((op) => {
          const B = blankState(S.v, S.o);
          B.f[td.id] = td.type === "multi" ? [op.v] : op.v;
          return `<a href="${PATHS.href.search}${toQuery(B)}">${esc(op.l)} · Dubai</a>`;
        })
        .join("")
    : "";
  document.getElementById("seo").innerHTML =
    `<div><h4>More in ${esc(VERTICALS[S.v].label)}</h4>${offerLinks}</div><div><h4>${t("Popular areas")}</h4>${areaLinks}</div><div><h4>By type</h4>${popLinks}</div>
    <p class="seo-text">UpNow lists verified ${esc(O.h1.toLowerCase())} across Dubai, priced ${esc(O.basis)}. ${O.permit ? `Every listing shows its ${esc(O.permit)} number. ` : ""}You contact the owner, agent or operator directly by phone, WhatsApp or request — no booking fees.</p>`;
}

document.querySelector("main").addEventListener("click", (e) => {
  const tt = e.target;
  const v = tt.closest("[data-view]");
  if (v) {
    S.view = v.dataset.view;
    update();
    return;
  }
  const r = tt.closest("[data-rm]");
  if (r) {
    const k = r.dataset.rm;
    if (k === "*") {
      S.f = blankState(S.v, S.o).f;
      S.loc = [];
      S.q = "";
    } else if (k === "*loc") S.loc = [];
    else if (k === "q") S.q = "";
    else if (k.startsWith("loc:"))
      S.loc = S.loc.filter((x) => x !== k.slice(4));
    else if (k.startsWith("f:")) delete S.f[k.slice(2)];
    S.page = 1;
    bar.render();
    update();
    return;
  }
  if (tt.closest("[data-concierge]")) {
    openConcierge();
    return;
  }
  if (tt.closest("[data-alert]")) {
    if (!alerts().includes(alertKey())) document.getElementById("saveS").click();
    else UPUI.toast("Alert already on for this search");
    return;
  }
  const pg = tt.closest("[data-pg]");
  if (pg && !pg.disabled) {
    S.page = +pg.dataset.pg;
    update();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const pin = tt.closest("[data-pin]");
  if (pin) {
    hlId = pin.dataset.pin;
    if (PHONE.matches) {
      paint(); // phone: the map is full height — the pinned listing docks at its bottom
      return;
    }
    const idx = results(S).findIndex((l) => l.id === hlId);
    S.page = Math.floor(idx / PER) + 1;
    paint();
    const el = document.querySelector(`[data-id="${hlId}"]`);
    if (el)
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 280,
        behavior: "smooth",
      });
  }
});
document.querySelector("main").addEventListener("mouseover", (e) => {
  if (S.view !== "map") return;
  const c = e.target.closest("[data-id]");
  const id = c ? c.dataset.id : null;
  document
    .querySelectorAll(".map-pin")
    .forEach((p) =>
      p.classList.toggle("is-highlighted", p.dataset.pin === id),
    );
});
paint();
