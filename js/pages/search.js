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
let pillOpen = null,
  hlId = null;

document.getElementById("hdr").innerHTML = UPUI.header(S.v);
document.getElementById("ftr").innerHTML = UPUI.footer();
UPUI.bindHeader();
const bar = UPF.SearchBar(document.getElementById("sb"), S, {
  mode: "bar",
  onChange: () => update(),
  onSubmit: () => update(),
});

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

/* optional-filter pill row */
function paintFilterRow() {
  const O = offer(S);
  if (!O) {
    document.getElementById("frow").innerHTML = "";
    return;
  }
  const opt = O.optional.filter((d) => !d.required).slice(0, 6);
  const act = O.defs.filter(
    (d) => !empty(S.f[d.id]) && !d.required,
  ).length;
  const k = toQuery({ ...S, page: 1, sort: "rec", view: "grid" });
  const saved = JSON.parse(
    localStorage.getItem("upnow.alerts") || "[]",
  ).includes(k);
  const seg = O.defs.find((d) => d.type === "seg");
  document.getElementById("frow").innerHTML = `
    ${seg ? controlHTML(seg, S) + '<span class="divider"></span>' : ""}
    ${opt
      .map((d) => {
        const val = S.f[d.id];
        const lab = valueLabel(d, val);
        const set = !!lab;
        if (d.type === "toggle")
          return `<div class="filter-pill"><button class="${set ? "is-set" : ""}" data-tg="${d.id}">${val ? ico("check") : ""}${esc(d.label)}</button></div>`;
        return `<div class="filter-pill"><button class="${set ? "is-set" : ""}" data-pill="${d.id}">${esc(set ? d.label + ": " + lab : d.label)}${ico("chev")}</button>
        ${pillOpen === d.id ? `<div class="popover"><div class="popover-header">${esc(d.label)}${set ? `<button class="text-link" data-clr="${d.id}">Clear</button>` : ""}</div>${controlHTML(d, S)}<div class="popover-footer"><button class="btn btn-primary btn-sm" data-closepill>Show ${results(S).length} results</button></div></div>` : ""}</div>`;
      })
      .join("")}
    <button class="chip" data-drawer>${ico("sliders")}${t("All filters")}${act ? ` <span class="count" style="background:var(--g7);color:#fff;border-radius:99px;padding:0 6px">${act}</span>` : ""}</button>
    <div class="spacer"></div>
    <button class="save-search ${saved ? "is-active" : ""}" id="saveS">${ico("bell")}${saved ? "Alert on" : t("Save search")}</button>`;
}
const frow = document.getElementById("frow");
frow.addEventListener("click", (e) => {
  const tt = e.target;
  if (tt.closest("[data-drawer]")) {
    pillOpen = null;
    openDrawer();
    return;
  }
  const tg = tt.closest("[data-tg]");
  if (tg) {
    const d = offer(S).def(tg.dataset.tg);
    UPF.setVal(S, d, S.f[d.id] ? null : true);
    bar.render();
    update();
    return;
  }
  const p = tt.closest("[data-pill]");
  if (p) {
    pillOpen = pillOpen === p.dataset.pill ? null : p.dataset.pill;
    paintFilterRow();
    return;
  }
  const c = tt.closest("[data-clr]");
  if (c) {
    delete S.f[c.dataset.clr];
    bar.render();
    update();
    return;
  }
  if (tt.closest("[data-closepill]")) {
    pillOpen = null;
    paintFilterRow();
    return;
  }
  const ctl = tt.closest("[data-ctl]");
  if (ctl && ctl.tagName !== "INPUT") {
    if (UPF.handleControl(ctl, S)) {
      bar.render();
      update();
    }
    return;
  }
  if (tt.closest("#saveS")) {
    const k = toQuery({ ...S, page: 1, sort: "rec", view: "grid" });
    let a = JSON.parse(localStorage.getItem("upnow.alerts") || "[]");
    const on = a.includes(k);
    a = on ? a.filter((x) => x !== k) : [...a, k];
    localStorage.setItem("upnow.alerts", JSON.stringify(a));
    UPUI.toast(
      on
        ? "Search alert removed"
        : "Saved — we'll WhatsApp you new matches",
    );
    paintFilterRow();
  }
});
frow.addEventListener("change", (e) => {
  const c = e.target.closest("[data-ctl]");
  if (c && UPF.handleControl(c, S)) {
    bar.render();
    update();
  }
});
document.addEventListener("mousedown", (e) => {
  if (pillOpen && !e.target.closest(".filter-pill")) {
    pillOpen = null;
    paintFilterRow();
  }
});

/* all-filters drawer */
const drawer = document.getElementById("drawer"),
  dscrim = document.getElementById("dscrim");
function openDrawer() {
  paintDrawer();
  drawer.classList.add("is-active");
  dscrim.classList.add("is-active");
}
document.addEventListener("upnow:escape", () => closeDrawer());
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
      ? `<div class="filter-group-label">${title}</div>` +
        defs
          .map(
            (d) =>
              `<div class="filter-section">${d.type === "toggle" ? "" : `<h5>${esc(d.label)}${!empty(S.f[d.id]) && !d.required ? `<button class="text-link" data-dclr="${d.id}">Clear</button>` : ""}</h5>`}${controlHTML(d, S)}</div>`,
          )
          .join("")
      : "";
  const locs = AREAS.map((a) => ({
    a,
    c: LISTINGS.filter(
      (l) =>
        l.v === S.v &&
        l.cat === O.id &&
        (l.loc === a.id || (l.coverage || []).includes(a.id)),
    ).length,
  })).filter((x) => x.c);
  drawer.innerHTML = `<div class="filter-drawer-header"><div style="flex:1"><h3>${esc(O.label)} filters</h3><div style="color:var(--ink3);font-size:12.5px;margin-top:2px">Priced ${esc(O.basis)}</div></div><button class="close-btn" aria-label="Close" data-dclose>${ico("x")}</button></div>
    <div class="filter-drawer-body">
      ${O.locAll ? "" : `<div class="filter-section"><h5>${esc(O.locLabel || "Location")}</h5><div class="option-chips">${locs.map(({ a, c }) => `<button class="chip ${S.loc.includes(a.id) ? "is-active" : ""}" data-dloc="${a.id}">${esc(a.n)} <span class="count">${c}</span></button>`).join("")}</div></div>`}
      ${sec(
        "Main",
        O.fields
          .filter((f) => f !== "loc")
          .map((f) => O.def(f))
          .filter(Boolean),
      )}
      ${sec("More filters", O.optional)}
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
    S.f = B.f;
    S.loc = [];
    S.q = "";
    bar.render();
    update();
    paintDrawer();
    return;
  }
  const dl = tt.closest("[data-dloc]");
  if (dl) {
    const id = dl.dataset.dloc;
    S.loc = S.loc.includes(id)
      ? S.loc.filter((x) => x !== id)
      : [...S.loc, id];
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
                `<div class="map-pin ${hlId === l.id ? "is-highlighted" : ""}" data-pin="${l.id}" style="left:${a.x + (i - (Math.min(ls.length, 3) - 1) / 2) * 6}%;top:${a.y - (i % 2) * 2}%">${pp(l)}</div>`,
            )
            .join("") +
          (ls.length > 3
            ? `<div class="map-pin" style="left:${a.x}%;top:${a.y + 6}%"><small>+${ls.length - 3}</small></div>`
            : "")
        );
      })
      .join("")}
    <div class="map-note">${list.length} results · ${UPUI.prefs.cur} · illustrative map</div></div>`;
}

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
          : `<span style="color:var(--ink)">${esc(tx)}</span>`),
    )
    .join("");
  document.getElementById("h1").textContent = title;
  document.getElementById("cnt").innerHTML =
    `<b>${all.length}</b> ${t("results")}${O ? " · priced " + esc(O.basis) : ""}${all.length ? ` · showing ${(S.page - 1) * PER + 1}–${Math.min(S.page * PER, all.length)}` : ""}`;

  const sortEl = document.getElementById("sort");
  sortEl.innerHTML = UPUI.SORTS.map(
    ([k, l]) =>
      `<option value="${k}" ${S.sort === k ? "selected" : ""}>Sort: ${l}</option>`,
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

  const td = typeDef(O);
  document.getElementById("qtype").innerHTML = td
    ? `<a href="${PATHS.href.search}${toQuery({ ...S, f: { ...S.f, [td.id]: undefined }, page: 1 })}" class="${empty(S.f[td.id]) ? "is-active" : ""}">All ${esc(O.label.toLowerCase())}</a>` +
      td.options
        .map((op) => {
          const val = td.type === "multi" ? [op.v] : op.v;
          const on =
            [].concat(S.f[td.id] || []).length === 1 &&
            [].concat(S.f[td.id])[0] === op.v;
          const n = facetCount(S, td.id, val);
          return n || on
            ? `<a href="${PATHS.href.search}${toQuery({ ...S, f: { ...S.f, [td.id]: val }, page: 1 })}" class="${on ? "is-active" : ""}">${esc(op.l)} <em>${n}</em></a>`
            : "";
        })
        .join("")
    : "";

  const act = [];
  if (S.q) act.push([`“${S.q}”`, "q"]);
  S.loc.forEach((id) => act.push([areaName(id), "loc:" + id]));
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
    body = `<div class="results-empty">${ico("search")}<h3>No exact matches</h3><p>Try widening your search — these would show results:</p><div class="option-chips">${
      relax
        .slice(0, 4)
        .map(
          ([tx, k]) =>
            `<button class="chip" data-rm="${k}">${esc(tx)}</button>`,
        )
        .join("") ||
      '<button class="chip" data-rm="*">Clear all filters</button>'
    }</div></div>`;
  } else if (view === "list") {
    body = `<div class="row-list">${list.map(row).join("")}</div>`;
  } else {
    body = `<div class="compact-grid">${list.map((l) => UPUI.card(l, S)).join("")}</div>`;
  }
  const pager =
    pages > 1
      ? `<div class="pager"><button data-pg="${S.page - 1}" ${S.page === 1 ? "disabled" : ""}>${ico("chevL")}</button>${Array.from({ length: pages }, (_, i) => `<button class="${S.page === i + 1 ? "is-active" : ""}" data-pg="${i + 1}">${i + 1}</button>`).join("")}<button data-pg="${S.page + 1}" ${S.page === pages ? "disabled" : ""}>${ico("chevR")}</button></div>`
      : "";
  document.getElementById("res").innerHTML = body + pager;
  const aside = document.getElementById("aside");
  aside.innerHTML = view === "map" ? mapHTML(all) : "";
  aside.style.display = view === "map" ? "" : "none";
  paintFilterRow();
  paintSeo();
  UPUI.updateHdrCounts();
}

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
