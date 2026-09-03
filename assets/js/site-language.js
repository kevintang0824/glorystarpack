(() => {
  'use strict';
  const switcher = document.querySelector('.gsp-language');
  if (!switcher) return;
  const summary = switcher.querySelector('summary');
  const links = [...switcher.querySelectorAll('[data-gsp-language]')];
  const currentLanguage = document.documentElement.lang || 'en';
  const localeCodes = ['fr', 'es', 'pt', 'ru', 'zh-CN'];

  // Product cards and related links created after page load stay inside the current static locale.
  const keepLinkInLocale = anchor => {
    if (currentLanguage === 'en' || !anchor || anchor.hasAttribute('data-gsp-language')) return;
    const href = anchor.getAttribute('href') || '';
    if (!href.startsWith('/') || href.startsWith('//') || /^\/(?:assets|api)(?:\/|$)/.test(href)) return;
    if (localeCodes.some(code => href === `/${code}` || href.startsWith(`/${code}/`))) return;
    if (/\.[a-z0-9]{2,8}(?:[?#]|$)/i.test(href) && !/\.html(?:[?#]|$)/i.test(href)) return;
    anchor.setAttribute('href', `/${currentLanguage}${href}`);
  };
  document.querySelectorAll('a[href]').forEach(keepLinkInLocale);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType !== 1) return;
    if (node.matches?.('a[href]')) keepLinkInLocale(node);
    node.querySelectorAll?.('a[href]').forEach(keepLinkInLocale);
  }))).observe(document.body, { childList: true, subtree: true });

  // Language links are complete static URLs; preserve the visitor's filter and page state.
  links.forEach(link => {
    const target = new URL(link.href, location.href);
    const current = new URL(location.href);
    for (const [key, value] of current.searchParams) {
      if (key !== 'lang') target.searchParams.set(key, value);
    }
    // Legacy English catalog hashes map to the native catalog route.
    const legacy = current.hash.match(/^#(products|detail)\/([^/]+)(?:\/page-(\d+))?$/);
    if (legacy && link.dataset.gspLanguage !== 'en') {
      target.pathname = `/${link.dataset.gspLanguage}/products/product-index/`;
      target.searchParams.set(legacy[1] === 'detail' ? 'product' : 'category', decodeURIComponent(legacy[2]));
      if (legacy[3]) target.searchParams.set('page', legacy[3]);
    } else if (link.dataset.gspLanguage === 'en' && current.pathname.endsWith('/products/product-index/') && current.searchParams.has('product')) {
      target.pathname = '/';
      target.hash = `detail/${encodeURIComponent(current.searchParams.get('product'))}`;
      target.searchParams.delete('product');
    }
    link.href = target.pathname + target.search + target.hash;
  });

  switcher.addEventListener('keydown', event => {
    const index = links.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault(); switcher.open = false; summary.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); switcher.open = true;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1
        : index < 0 ? (event.key === 'ArrowDown' ? 0 : links.length - 1)
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[next].focus();
    }
  });
  document.addEventListener('click', event => { if (!switcher.contains(event.target)) switcher.open = false; });
  switcher.addEventListener('focusout', () => {
    setTimeout(() => { if (!switcher.contains(document.activeElement)) switcher.open = false; }, 0);
  });
  try { localStorage.setItem('gsp_language_v1', currentLanguage); } catch {}
})();
