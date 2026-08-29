// =========================================================== LAZY LEGACY CATALOG
const STATIC_PAGE_ROUTES = Object.freeze({
  about: '/about/',
  oem: '/oem-cosmetic-packaging/',
  news: '/insights/',
  newsdetail: '/insights/',
  contact: '/contact/'
});

const homeDocumentState = {
  title: document.title,
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || 'https://www.glorystarpack.com/',
  meta: Array.from(document.querySelectorAll(
    'meta[name="description"], meta[name="robots"], meta[name="keywords"], meta[property="og:title"], meta[property="og:description"], meta[property="og:url"], meta[property="og:image"], meta[property="og:image:alt"], meta[name="twitter:title"], meta[name="twitter:description"], meta[name="twitter:image"], meta[name="twitter:image:alt"]'
  )).map(element => ({element, content: element.getAttribute('content') || ''}))
};

let legacyCatalogPromise = null;

function closeNavMenus() {
  document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
  document.querySelectorAll('.nav-link[aria-expanded]').forEach(button => button.setAttribute('aria-expanded', 'false'));
}

function closeMobileNav() {
  const nav = document.getElementById('siteNav');
  const button = document.getElementById('menuToggle');
  if (nav) nav.classList.remove('mobile-open');
  if (button) button.setAttribute('aria-expanded', 'false');
  closeNavMenus();
}

function toggleMobileNav() {
  const nav = document.getElementById('siteNav');
  const button = document.getElementById('menuToggle');
  if (!nav || !button) return;
  nav.classList.toggle('mobile-open');
  button.setAttribute('aria-expanded', nav.classList.contains('mobile-open') ? 'true' : 'false');
  closeNavMenus();
}

function restoreHomeDocumentState() {
  document.title = homeDocumentState.title;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', homeDocumentState.canonical);
  homeDocumentState.meta.forEach(({element, content}) => element.setAttribute('content', content));
}

function activateOnlyPage(page) {
  document.querySelectorAll('.page').forEach(element => {
    const active = element.id === `page-${page}`;
    element.style.display = active ? 'block' : 'none';
    element.classList.toggle('active', active);
  });
}

function showHomePage(skipHash) {
  activateOnlyPage('home');
  restoreHomeDocumentState();
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });
  const homeLink = document.querySelector('.nav-link[data-page="home"]');
  if (homeLink) {
    homeLink.classList.add('active');
    homeLink.setAttribute('aria-current', 'page');
  }
  if (!skipHash) history.replaceState(null, '', '#home');
  window.scrollTo(0, 0);
  window.GSP_CATALOG?.renderHomeGrid();
}

function showCatalogLoading(page) {
  activateOnlyPage(page);
  const states = {
    products: ['products-grid', 'Loading product catalog...'],
    detail: ['det-name', 'Loading product details...'],
    search: ['search-title', 'Searching packaging products...']
  };
  const [targetId, message] = states[page] || [];
  const target = targetId && document.getElementById(targetId);
  if (target && !target.textContent.trim()) target.textContent = message;
  document.getElementById(`page-${page}`)?.setAttribute('aria-busy', 'true');
}

function showCatalogLoadError(error) {
  console.error('Unable to load catalog compatibility layer', error);
  ['products-grid', 'search-grid', 'related-grid'].forEach(id => {
    const target = document.getElementById(id);
    if (target) target.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px;">The product catalog is temporarily unavailable. Please refresh the page or contact us for the current catalog.</p>';
  });
}

function ensureLegacyCatalog() {
  if (window.GSP_CATALOG) return Promise.resolve(window.GSP_CATALOG);
  if (legacyCatalogPromise) return legacyCatalogPromise;

  legacyCatalogPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-legacy-catalog="true"]');
    const finish = () => window.GSP_CATALOG
      ? resolve(window.GSP_CATALOG)
      : reject(new Error('Catalog script loaded without initializing'));

    if (existing) {
      existing.addEventListener('load', finish, {once: true});
      existing.addEventListener('error', () => reject(new Error('Catalog script request failed')), {once: true});
      return;
    }

    const script = document.createElement('script');
    script.src = '/assets/js/legacy-catalog.js';
    script.async = true;
    script.dataset.legacyCatalog = 'true';
    script.addEventListener('load', finish, {once: true});
    script.addEventListener('error', () => reject(new Error('Catalog script request failed')), {once: true});
    document.head.appendChild(script);
  }).catch(error => {
    legacyCatalogPromise = null;
    document.querySelector('script[data-legacy-catalog="true"]')?.remove();
    showCatalogLoadError(error);
    throw error;
  });

  return legacyCatalogPromise;
}

function invokeCatalog(method, args, loadingPage) {
  if (loadingPage) showCatalogLoading(loadingPage);
  return ensureLegacyCatalog().then(catalog => {
    document.querySelectorAll('[id^="page-"][aria-busy="true"]').forEach(page => page.removeAttribute('aria-busy'));
    return catalog[method](...args);
  });
}

function go(page, sub, skipHash, productPage = 1) {
  closeMobileNav();
  const staticUrl = STATIC_PAGE_ROUTES[page];
  if (staticUrl) {
    window.location.assign(staticUrl);
    return;
  }
  if (!page || page === 'home') {
    showHomePage(skipHash);
    return;
  }
  if (['products', 'detail', 'search'].includes(page)) {
    return invokeCatalog('go', [page, sub, skipHash, productPage], page);
  }
  showHomePage(true);
}

function showDetail(...args) { return invokeCatalog('showDetail', args, 'detail'); }
function doSearch(...args) { return invokeCatalog('doSearch', args, 'search'); }
function filterCat(...args) { return invokeCatalog('filterCat', args); }
function filterCatByKey(...args) { return invokeCatalog('filterCatByKey', args); }
function toggleProductFilters(...args) { return invokeCatalog('toggleProductFilters', args); }
function setProductSort(...args) { return invokeCatalog('setProductSort', args); }
function setProductView(...args) { return invokeCatalog('setProductView', args); }
function goProductPage(...args) { return invokeCatalog('goProductPage', args); }
function setThumb(...args) { return invokeCatalog('setThumb', args); }
function setOpt(...args) { return invokeCatalog('setOpt', args); }
function switchTab(...args) { return invokeCatalog('switchTab', args); }

function warmCatalogOnIntent(event) {
  const target = event.target.closest?.('#searchInput, [onclick]');
  if (!target) return;
  const inlineAction = target.getAttribute('onclick') || '';
  if (target.id === 'searchInput' || /\b(?:go\(['"](?:products|detail|search)|showDetail|filterCat|toggleProductFilters|setProductSort|setProductView|goProductPage|switchTab)\b/.test(inlineAction)) {
    ensureLegacyCatalog().catch(() => {});
  }
}

document.addEventListener('pointerover', warmCatalogOnIntent, {passive: true});
document.addEventListener('focusin', warmCatalogOnIntent);

// =========================================================== MODALS
let activeModalType = '';
let modalReturnFocus = null;

function openModal(type, productName) {
  const m = document.getElementById('modal-'+type); if(m) m.style.display = 'flex';
  if (!m) return;
  modalReturnFocus = document.activeElement;
  activeModalType = type;
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const context = document.getElementById(type + '-context');
  if (context) {
    if (productName) {
      context.style.display = 'block';
      context.textContent = `Selected product: ${productName}`;
    } else {
      context.style.display = 'none';
      context.textContent = '';
    }
  }
  if (type === 'quote') {
    const input = document.getElementById('quoteProduct');
    if (input && productName) input.value = productName;
    refreshQuoteRfqLinks();
  }
  if (type === 'sample') {
    const input = document.getElementById('sampleProducts');
    if (input && productName) input.value = productName;
    refreshSampleRfqLinks();
  }
  requestAnimationFrame(() => {
    const firstField = m.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstField) firstField.focus();
  });
}
function closeModal(type) {
  const m = document.getElementById('modal-'+type); if(m) m.style.display = 'none';
  if (m) m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  const fb = document.getElementById(type+'-form-body'); if(fb) fb.style.display = '';
  if (activeModalType === type) activeModalType = '';
  if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
  modalReturnFocus = null;
}

function whatsappLink(message) {
  return `https://wa.me/8619577608248?text=${encodeURIComponent(message)}`;
}

function emailLink(subject, message) {
  return `mailto:kevin@glorystarpack.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

function fieldValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '').trim() : '';
}

function currentWebsitePage() {
  const url = new URL(window.location.href);
  url.hash = '';
  return url.href;
}

function buildQuoteMessage() {
  const lines = [
    'Hello GloryStarPack, I would like to request a cosmetic packaging quote.',
    fieldValue('quoteName') ? `Name: ${fieldValue('quoteName')}` : '',
    fieldValue('quoteCompany') ? `Company: ${fieldValue('quoteCompany')}` : '',
    fieldValue('quoteEmail') ? `Email: ${fieldValue('quoteEmail')}` : '',
    fieldValue('quoteWhatsapp') ? `WhatsApp: ${fieldValue('quoteWhatsapp')}` : '',
    fieldValue('quoteProduct') ? `Product/category: ${fieldValue('quoteProduct')}` : '',
    fieldValue('quoteMaterial') ? `Material: ${fieldValue('quoteMaterial')}` : '',
    fieldValue('quoteCapacity') ? `Capacity/size: ${fieldValue('quoteCapacity')}` : '',
    fieldValue('quoteClosure') ? `Closure/component: ${fieldValue('quoteClosure')}` : '',
    fieldValue('quoteQuantity') && fieldValue('quoteQuantity') !== '-- Select --' ? `Estimated quantity: ${fieldValue('quoteQuantity')}` : '',
    fieldValue('quoteCountry') ? `Destination country: ${fieldValue('quoteCountry')}` : '',
    fieldValue('quoteNotes') ? `Decoration/notes: ${fieldValue('quoteNotes')}` : '',
    `Website page: ${currentWebsitePage()}`
  ].filter(Boolean);
  return lines.join('\n');
}

function refreshQuoteRfqLinks() {
  const message = buildQuoteMessage();
  const subjectDetail = fieldValue('quoteProduct') || fieldValue('quoteCompany') || 'website inquiry';
  const email = document.getElementById('quoteEmailSubmit');
  const whatsapp = document.getElementById('quoteWhatsAppSubmit');
  if (email) email.href = emailLink(`Cosmetic packaging RFQ - ${subjectDetail}`, message);
  if (whatsapp) whatsapp.href = whatsappLink(message);
}

function buildSampleMessage() {
  return [
    'Hello GloryStarPack, I would like to request cosmetic packaging samples.',
    fieldValue('sampleName') ? `Name: ${fieldValue('sampleName')}` : '',
    fieldValue('sampleCompany') ? `Company: ${fieldValue('sampleCompany')}` : '',
    fieldValue('sampleEmail') ? `Email: ${fieldValue('sampleEmail')}` : '',
    fieldValue('sampleWhatsapp') ? `WhatsApp: ${fieldValue('sampleWhatsapp')}` : '',
    fieldValue('sampleProducts') ? `Sample list: ${fieldValue('sampleProducts')}` : '',
    fieldValue('sampleAddress') ? `Shipping address: ${fieldValue('sampleAddress')}` : '',
    `Website page: ${currentWebsitePage()}`
  ].filter(Boolean).join('\n');
}

function refreshSampleRfqLinks() {
  const message = buildSampleMessage();
  const subjectDetail = fieldValue('sampleCompany') || 'website sample request';
  const email = document.getElementById('sampleEmailSubmit');
  const whatsapp = document.getElementById('sampleWhatsAppSubmit');
  if (email) email.href = emailLink(`Cosmetic packaging sample request - ${subjectDetail}`, message);
  if (whatsapp) whatsapp.href = whatsappLink(message);
}

refreshQuoteRfqLinks();
refreshSampleRfqLinks();

function enhanceKeyboardControls() {
  document.querySelectorAll('span.dd-link[onclick], div.sb-link[onclick], div.helper-item[onclick]').forEach(control => {
    control.setAttribute('role', 'button');
    control.setAttribute('tabindex', '0');
    control.dataset.keyboardClick = 'true';
    if (control.classList.contains('sb-link')) {
      control.setAttribute('aria-pressed', control.classList.contains('active') ? 'true' : 'false');
    }
  });
}

// =========================================================== EVENT DELEGATION (opt/pg/view)
document.addEventListener('click', e => {
  const dropdownTrigger = e.target.closest('.nav-item > .nav-link');
  if (dropdownTrigger && dropdownTrigger.nextElementSibling && dropdownTrigger.nextElementSibling.classList.contains('dropdown')) {
    e.preventDefault();
    const item = dropdownTrigger.closest('.nav-item');
    document.querySelectorAll('.nav-item.open').forEach(openItem => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        const btn = openItem.querySelector('.nav-link[aria-expanded]');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
    item.classList.toggle('open');
    dropdownTrigger.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    return;
  }
  if (!e.target.closest('.nav-item')) {
    closeNavMenus();
  }
  if (e.target.classList.contains('dd-link')) {
    closeNavMenus();
  }
  const paginationButton = e.target.closest?.('#products-pagination .pg-btn');
  if (paginationButton) {
    const page = Number(paginationButton.dataset.page || '1');
    goProductPage(page);
  }
  if (e.target.classList.contains('view-btn')) {
    setProductView(e.target.dataset.view);
  }
});

document.addEventListener('keydown', e => {
  const tab = e.target.closest?.('[role="tab"]');
  if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
    const tabs = Array.from(tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(tab);
    const nextIndex = e.key === 'Home' ? 0
      : e.key === 'End' ? tabs.length - 1
        : (currentIndex + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    e.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
    return;
  }
  const keyboardControl = e.target.closest?.('[data-keyboard-click="true"]');
  if (keyboardControl && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    keyboardControl.click();
    return;
  }
  if (activeModalType && e.key === 'Tab') {
    const modal = document.getElementById(`modal-${activeModalType}`);
    const focusable = modal ? Array.from(modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.offsetParent !== null) : [];
    if (focusable.length) {
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
    return;
  }
  if (e.key !== 'Escape') return;
  if (activeModalType) {
    closeModal(activeModalType);
    return;
  }
  const focusedItem = document.activeElement?.closest?.('.nav-item');
  const focusedTrigger = focusedItem?.querySelector(':scope > .nav-link[aria-haspopup="true"]');
  const nav = document.getElementById('siteNav');
  const mobileWasOpen = nav?.classList.contains('mobile-open');
  closeMobileNav();
  if (focusedTrigger) focusedTrigger.focus();
  else if (mobileWasOpen) document.getElementById('menuToggle')?.focus();
});

document.addEventListener('input', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#modal-quote')) refreshQuoteRfqLinks();
  if (e.target.closest('#modal-sample')) refreshSampleRfqLinks();
});

document.addEventListener('change', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#modal-quote')) refreshQuoteRfqLinks();
  if (e.target.closest('#modal-sample')) refreshSampleRfqLinks();
});

function scrollTopSmooth() {
  document.getElementById('main-content')?.focus({preventScroll: true});
  window.scrollTo({top: 0, behavior: 'smooth'});
}

let backTopTicking = false;
window.addEventListener('scroll', () => {
  if (backTopTicking) return;
  backTopTicking = true;
  requestAnimationFrame(() => {
    const btn = document.getElementById('backTop');
    if (btn) btn.classList.toggle('show', window.scrollY > 520);
    backTopTicking = false;
  });
}, {passive: true});

// =========================================================== CAROUSEL
let csIdx = 0;
// The homepage hero may use one focused conversion message instead of a carousel.
// Read the actual slide count so the controls and timer stay safe in both layouts.
const csTotal = Math.max(1, document.querySelectorAll('.cs-slide').length);
const csDuration = 6500; // allow enough time to read the sourcing details
let csTimer = null;
let csPreloadTimer = null;
let csPaused = false;
const csReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const csSmallScreen = window.matchMedia('(max-width: 760px)').matches;

function csEnsureBackground(index) {
  if (index <= 0) return;
  const slide = document.querySelectorAll('.cs-slide')[index];
  const background = slide?.querySelector('.cs-bg[data-bg-desktop]');
  if (!background || background.dataset.loaded === 'true') return;
  const modernSource = csSmallScreen ? background.dataset.bgMobile : background.dataset.bgDesktop;
  const fallbackSource = background.dataset.bgFallback;
  const modernType = modernSource?.endsWith('.avif') ? 'image/avif' : 'image/webp';
  const supportsModern = modernSource && CSS.supports(
    'background-image',
    `image-set(url("${modernSource}") type("${modernType}") 1x)`
  );
  const selectedSource = supportsModern ? modernSource : fallbackSource;
  if (!selectedSource) return;
  background.style.backgroundImage = `url("${selectedSource}")`;
  background.dataset.loaded = 'true';
}

function csScheduleNextBackground() {
  clearTimeout(csPreloadTimer);
  if (csTotal <= 1 || csReducedMotion || csSmallScreen || document.hidden || csPaused) return;
  csPreloadTimer = setTimeout(
    () => csEnsureBackground((csIdx + 1) % csTotal),
    Math.max(800, csDuration - 1500)
  );
}

function csRender() {
  csEnsureBackground(csIdx);
  const track = document.getElementById('carouselTrack');
  if (track) track.style.transform = `translateX(-${csIdx * 100}%)`;
  document.querySelectorAll('.cs-slide').forEach((slide, i) => {
    const active = i === csIdx;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    slide.inert = !active;
  });
  document.querySelectorAll('.cs-dot').forEach((d, i) => {
    const active = i === csIdx;
    d.classList.toggle('active', active);
    d.setAttribute('aria-current', active ? 'true' : 'false');
  });
  csStartProgress();
  csScheduleNextBackground();
}

function csMove(dir) {
  csIdx = (csIdx + dir + csTotal) % csTotal;
  csRender();
  csResetTimer();
}

function csGo(i) {
  csIdx = i;
  csRender();
  csResetTimer();
}

function csStartProgress() {
  const bar = document.getElementById('csProgress');
  if (!bar) return;
  if (csReducedMotion || csSmallScreen) {
    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(1)';
    return;
  }
  bar.style.transition = 'none';
  bar.style.transform = 'scaleX(0)';
  requestAnimationFrame(() => {
    bar.style.transition = `transform ${csDuration}ms linear`;
    bar.style.transform = 'scaleX(1)';
  });
}

function csResetTimer() {
  clearInterval(csTimer);
  clearTimeout(csPreloadTimer);
  if (csTotal <= 1 || csReducedMotion || csSmallScreen || document.hidden || csPaused) return;
  csTimer = setInterval(() => { csIdx = (csIdx + 1) % csTotal; csRender(); }, csDuration);
  csScheduleNextBackground();
}

function csInit() {
  csRender();
  csResetTimer();
  document.addEventListener('visibilitychange', csResetTimer);
  const carousel = document.querySelector('.carousel-wrap');
  if (!carousel) return;
  carousel.addEventListener('mouseenter', () => {
    csPaused = true;
    clearInterval(csTimer);
    clearTimeout(csPreloadTimer);
  });
  carousel.addEventListener('mouseleave', () => {
    csPaused = false;
    csResetTimer();
  });
  carousel.addEventListener('focusin', () => {
    csPaused = true;
    clearInterval(csTimer);
    clearTimeout(csPreloadTimer);
  });
  carousel.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (carousel.contains(document.activeElement)) return;
      csPaused = false;
      csResetTimer();
    });
  });
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      csMove(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      csMove(1);
    }
  });
}

function initFromHash() {
  const query = new URLSearchParams(window.location.search).get('q');
  if (query) { doSearch(query, true); return; }
  const raw = window.location.hash.replace('#', '');
  if (!raw) { go('home'); return; }
  const [page, sub, pagePart] = raw.split('/');
  if (page === 'detail' && sub) { showDetail(sub); return; }
  if (page === 'products') {
    const requestedPage = Math.max(1, pagePart?.startsWith('page-') ? Number(pagePart.slice(5)) || 1 : 1);
    go('products', sub || 'hot', true, requestedPage);
    return;
  }
  go(page || 'home', sub, true);
}

// =========================================================== INIT
enhanceKeyboardControls();
initFromHash();
window.addEventListener('hashchange', initFromHash);
window.addEventListener('popstate', initFromHash);
csInit();
