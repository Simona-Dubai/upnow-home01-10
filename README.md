# UpNow — frontend boilerplate

Plain HTML, CSS and JavaScript — no framework, no build step. Open any page straight from disk or serve the folder.
The UpNow marketplace site lives on top of a reusable layer (design system + components).

- **Component library:** [`components.html`](components.html) — every reusable component rendered live, with the code to use it.

## Run it

Open `index.html` in a browser. Or serve the folder (recommended, so every browser treats the files the same):

```sh
cd upnow-home01-10
python3 -m http.server 8080      # then open http://localhost:8080
```

There is nothing to install or compile.

## Project structure

```
index.html                  Home page (desktop site; becomes the mobile app at ≤ 700px)
components.html             Component library
pages/                      Other pages: search, listing, provider (agent), agency, join (provider signup)

css/
  main.css                  Link this on every page — imports the files below in order
  fonts.css                 @font-face for the self-hosted fonts
  variables.css             Design tokens (colours, radii, shadows, font stacks) — the theme lives here
  reset.css                 Element reset
  base.css                  Body type, focus ring, .icon, .wrap container
  components.css            Every shared component, in sections
  utilities.css             Small helpers (.no-scrollbar, .grid, .text-link)
  responsive.css            Breakpoints for the shared components
  pages/                    One file per page for page-only layouts (loaded after main.css)

js/
  core/paths.js             Works out the site root; PATHS.href.* (page links), PATHS.img() / PATHS.asset()
  core/utils.js             esc, initials, K, store (localStorage), prefs, money / moneyK, t (translate), fmtPhone
  marketplace/engine.js     Category definitions, filtering, sorting, URL state (search pages)
  marketplace/state.js      Saved listings, enquiries, recently viewed, byId()
  pages/*.js                One controller per page (what goes where on that page)

components/
  icons.js                  Icon set — UPUI.ico(name)
  ui.js                     Generic builders — UPUI.ui.button / chip / badge / card / field / toggle / segmented / tabs / stats / pager / empty
  overlays.js               Modal, side drawer, toast
  layout.js                 Site header + footer, rendered from SITE (data/site.js)
  marketplace/              Listing card, contact flows, search bar + filters, profile listings, listing detail modules

data/
  site.js                   UpNow brand content: name, nav, header actions, footer, currencies, languages, translations
  home.js                   Home page copy, hero images, "How it works"
  markets.js                Provider signup by country: every country + dialling code; phone format, national sign-in,
                            ID document, licences and suggested cities/areas for AE, SA, GB, IN, US (others get generic wording)
  listings.js               Marketplace data (categories, areas, listings — seeded demo data)

assets/
  images/                   Photos
  icons/                    Every icon as a standalone SVG (same paths as components/icons.js)
  fonts/                    Plus Jakarta Sans + Roboto Serif (woff2, SIL Open Font License)
  logos/                    Logo mark (also the browser-tab icon)
```

### Layers

| Layer | Files | Reuse it for |
|---|---|---|
| **Design system** | `css/*`, `assets/fonts`, `assets/icons` | any site |
| **Generic UI** | `js/core/*`, `components/{icons,ui,overlays,layout}.js` | any site — needs only a `SITE` object |
| **Marketplace kit** | `js/marketplace/*`, `components/marketplace/*` | sites with listings, search and enquiries — needs `UP` (data/listings.js) |
| **Content** | `data/*`, `pages/*`, `index.html`, `js/pages/*`, `assets/images` | UpNow only — replace for a new site |

The generic layer never reads listing data, so a site that is not a marketplace loads only:
`js/core/paths.js` → your content file (defines `SITE`) → `components/icons.js` → `js/core/utils.js` → `components/ui.js` → `components/overlays.js` → `components/layout.js` → your page script.

## Design system

All values live in `css/variables.css`; the component library shows them live.

- **Colours:** brand `--color-primary` with `-darkest`, `-dark`, `-light`, `-lighter`, `-tint`, `-tint-light` steps; text `--color-text`, `--color-text-secondary`, `--color-text-muted`; borders `--color-border`, `--color-border-strong`; page background `--color-bg`; status `--color-whatsapp` (WhatsApp), `--color-amber`, `--color-danger`, `--color-warning-bg`, `--color-warning-text`, `--color-text-disabled`, `--color-rating-star(-strong)`.
- **Type:** `--font-sans` = Plus Jakarta Sans (interface, 400–800), `--font-serif` = Roboto Serif (display headings). Body 14px / 1.45. Common sizes: 60 / 36 / 28 / 24 / 20 / 18 / 16 / 15 / 14 / 13 / 12.5 / 12 / 11px.
- **Radius:** pills 99px · cards `--radius` 14px · fields `--radius-sm` 10px · panels 18px · modals 18px.
- **Shadows:** `--shadow` (raised), `--shadow-lg` (floating).
- **Container:** `.wrap` — max 1360px, padding 48px → 28px (≤ 1100px) → 16px (≤ 640px).
- **Breakpoints (max-width):** 1250, 1200, 1180, 1100, 1000, 960, 900, 800, 700, 640, 520px.
- **Layers (z-index):** header 60, dropdown 70, popovers 80, drawers 150–190, modal 200, lightbox 250, toast 300.
- **Motion:** state changes `transition: .15s`; drawers `.2s`.

## Components

Listed in full, live, in `components.html`. In short:

- **Foundations:** colours, type, radius / shadow / spacing, layout, icons (95), logo
- **Actions:** buttons (primary, outline, WhatsApp, ghost, small, icon), text link, chips, badges
- **Content:** card, agent card, detail modules (spec grid, checklist, timeline, table, key–value box, note, alert), stats row, empty state
- **Forms:** fields + form grid, toggle, segmented control, choice buttons, range inputs, search bar, booking widget atoms, calendar
- **Navigation:** header, footer, tabs, pagination, dropdown, popover
- **Overlays:** modal, side drawer, toast, contact flows (call, WhatsApp, email), saved + enquiries drawers, sign-in
- **Page-level:** home hero and category rail, mobile app shell, search results (filters, list / grid / map, drawer), listing (gallery, lightbox, key facts, price box), agent / agency profile, provider signup — styles in `css/pages/`

### Using a component

```js
UPUI.ui.button({ label: 'Book a tour', icon: 'cal', href: '#tour' });
UPUI.ui.card({ href: '/space/1', image: PATHS.img('office1.jpg'), title: 'Hot desk', location: 'Business Bay',
               spec: ['24/7', 'Wi-Fi'], price: 'AED 950', unit: '/month' });
UPUI.openModal('<div class="modal-body">…</div>');
UPUI.toast('Saved');
document.getElementById('hdr').innerHTML = UPUI.header('home');   // from SITE.header
```

Plain HTML works too: `<button class="btn btn-primary">…</button>`, `<div class="field"><label>…</label><input></div>`.

## Add a component

1. **Styles:** add a section to `css/components.css` using the tokens (`var(--color-primary)`, `var(--radius)` …). Breakpoints go in `css/responsive.css`.
2. **Markup helper (optional):** add a builder to `UPUI.ui` in `components/ui.js` — take plain content, return an HTML string, escape text with `esc()`.
   Marketplace-specific pieces go in `components/marketplace/`.
3. **Document it:** add an entry to `DEMOS` in `js/pages/components.js` so it appears in the component library.

Keep class names unique across pages. If a style only makes sense on one page, put it in that page's file in `css/pages/`.

## Create a page

1. Copy an existing page such as `pages/search.html` into `pages/`.
2. Link `../css/main.css`, plus a `../css/pages/<page>.css` for page-only layout.
3. Load the scripts in the order above, then your controller `../js/pages/<page>.js`.
4. Add the page to `PATHS.href` in `js/core/paths.js` if other pages link to it, and link with `PATHS.href.<name>`.
5. Put words and pictures in `data/` (or a content file), not in the controller.

All links and images go through `PATHS`, so pages work from `/`, `/pages/` or any other folder.

## Change the theme

- **Colours:** change the `--color-primary*` tokens in `css/variables.css`. Every component follows.
- **Fonts:** replace the files in `assets/fonts/`, update `css/fonts.css`, and set `--font-sans` / `--font-serif` in `css/variables.css`.
- **Brand, navigation, footer, currencies, languages:** edit `data/site.js`.
- **Logo:** `SITE.logoMark` / `SITE.name` for the header mark; `assets/logos/` for the image and tab icon.
- **Icons:** add a path to `components/icons.js`; export it to `assets/icons/` if you need the file.

## Notes

- Pages read the demo data in `data/listings.js`; favourites, enquiries and preferences are kept in the browser's localStorage (`upnow.*`).
- Fonts are self-hosted, so the site works offline.
- Provider signup works for any country: add a market profile in `data/markets.js` to give a country its own licences, sign-in and suggested areas.
- Arabic switches the page to right-to-left; only the strings in `SITE.i18n.ar` are translated.
