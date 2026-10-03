/* Site paths. Load this first on every page.
   The site root is worked out from this file's own URL (…/js/core/paths.js), so pages work from any folder
   (/, /pages/, /examples/) and when opened straight from disk. Every link and image URL is built from here. */
(function () {
  const self = document.currentScript && document.currentScript.src;
  const root = self ? self.replace(/js\/core\/paths\.js(\?.*)?$/, '') : '';
  const page = file => root + (file === 'index.html' ? '' : 'pages/') + file;
  window.PATHS = {
    root,
    href: {
      home: page('index.html'),
      search: page('search.html'),
      listing: page('listing.html'),
      provider: page('provider.html'),
      agency: page('agency.html'),
      join: page('join.html')
    },
    asset: p => root + 'assets/' + p,
    // accepts 'hero.jpg', 'img/hero.jpg', 'assets/images/hero.jpg' (older saved data) or an absolute URL
    img: p => /^(https?:|file:|data:|\/)/.test(p) ? p : root + 'assets/images/' + String(p).replace(/^(\.\.\/)*(assets\/images|img)\//, '')
  };
})();
