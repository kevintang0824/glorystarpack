(() => {
  'use strict';
  const switcher = document.querySelector('.gsp-language');
  if (!switcher) return;
  const summary = switcher.querySelector('summary');
  const links = [...switcher.querySelectorAll('[data-gsp-language]')];
  const currentLanguage = document.documentElement.lang || 'en';
  const localeCodes = ['fr', 'es', 'pt', 'ru', 'zh-CN'];
  let runtimeTranslations = null;

  const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim();
  const decodeHtml = value => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  };
  const translatedValue = value => {
    if (!runtimeTranslations) return '';
    const key = normalizeText(value);
    return runtimeTranslations.get(key) || '';
  };
  const translateElement = element => {
    if (!runtimeTranslations || !element || element.nodeType !== 1) return;
    if (element.closest?.('.gsp-language') || /^(SCRIPT|STYLE|NOSCRIPT|SVG|CODE|PRE)$/.test(element.tagName)) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement?.closest('.gsp-language') || /^(SCRIPT|STYLE|NOSCRIPT|SVG|CODE|PRE)$/.test(node.parentElement?.tagName || '')) return;
      const translation = translatedValue(node.nodeValue);
      if (!translation || translation === normalizeText(node.nodeValue)) return;
      const leading = node.nodeValue.match(/^\s*/)?.[0] || '';
      const trailing = node.nodeValue.match(/\s*$/)?.[0] || '';
      node.nodeValue = `${leading}${translation}${trailing}`;
    });
    [element, ...element.querySelectorAll('[alt],[aria-label],[placeholder],[title]')].forEach(node => {
      if (node.closest?.('.gsp-language')) return;
      ['alt', 'aria-label', 'placeholder', 'title'].forEach(attribute => {
        if (!node.hasAttribute?.(attribute)) return;
        const translation = translatedValue(node.getAttribute(attribute));
        if (translation) node.setAttribute(attribute, translation);
      });
    });
  };
  const localizeProductData = () => {
    if (!runtimeTranslations || !Array.isArray(window.GSP_PRODUCTS)) return;
    window.GSP_PRODUCTS.forEach(product => {
      ['name', 'mat', 'finish', 'desc', 'tab'].forEach(field => {
        const translation = translatedValue(product[field]);
        if (translation) product[field] = translation;
      });
    });
  };
  window.GSP_TRANSLATE_TEXT = value => translatedValue(value) || value;
  window.GSP_LOCALIZE_PRODUCT_DATA = localizeProductData;

  const needsRuntimeTranslations = currentLanguage !== 'en' && (
    new RegExp(`^/(?:${localeCodes.join('|')})/?$`).test(location.pathname)
    || location.pathname.endsWith('/products/product-index/')
  );
  if (needsRuntimeTranslations) {
    fetch(`/data/full-translations/${currentLanguage}.json`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then(dictionary => {
        runtimeTranslations = new Map();
        Object.entries(dictionary).forEach(([english, localized]) => {
          runtimeTranslations.set(normalizeText(english), localized);
          runtimeTranslations.set(normalizeText(decodeHtml(english)), localized);
        });
        localizeProductData();
        translateElement(document.body);
      })
      .catch(error => console.error('Unable to load static interface translations', error));
  }

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
    translateElement(node);
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
