(() => {
  'use strict';

  const whatsappNumber = '8619577608248';
  const salesEmail = 'kevin@glorystarpack.com';
  const siteOrigin = 'https://www.glorystarpack.com';
  const currentUrl = new URL(window.location.href);
  const currentPath = currentUrl.pathname;

  function cleanText(value, maxLength = 120) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function pageTopic() {
    const attributedTopic = cleanText(currentUrl.searchParams.get('topic'));
    if (/^\/contact\/?$/.test(currentPath)) return attributedTopic || 'packaging project';
    return cleanText(
      document.querySelector('meta[name="gsp-inquiry-topic"]')?.content
      || document.querySelector('h1')?.textContent
      || document.title.replace(/\s*[|–-]\s*GloryStarPack.*$/i, '')
      || 'packaging project'
    );
  }

  function canonicalPage() {
    try {
      const canonical = new URL(document.querySelector('link[rel="canonical"]')?.href || currentUrl.href);
      canonical.hash = '';
      canonical.search = '';
      return canonical.href;
    } catch {
      return `${siteOrigin}${currentPath}`;
    }
  }

  function safeSourcePath(rawPath) {
    const value = String(rawPath || '');
    if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '';
    try {
      return new URL(value, siteOrigin).origin === siteOrigin ? new URL(value, siteOrigin).pathname : '';
    } catch {
      return '';
    }
  }

  function inquiryMessage(intent = 'quote') {
    const opening = intent === 'sample'
      ? `Hello GloryStarPack, I would like to request samples related to ${pageTopic()}.`
      : `Hello GloryStarPack, I would like a packaging quotation related to ${pageTopic()}.`;
    return [
      opening,
      '',
      'Application / formula:',
      'Capacity / size:',
      'Closure / component:',
      'Finish / decoration:',
      'Estimated quantity:',
      'Destination country:',
      '',
      `Website page: ${canonicalPage()}`
    ].join('\n');
  }

  function whatsappHref(intent = 'quote') {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(inquiryMessage(intent))}`;
  }

  function contactHref(intent = 'quote') {
    const url = new URL('/contact/', siteOrigin);
    url.searchParams.set('source', currentPath);
    url.searchParams.set('topic', pageTopic());
    url.searchParams.set('intent', intent);
    return `${url.pathname}${url.search}`;
  }

  function inquiryTypeForLink(link) {
    const explicit = cleanText(link.dataset.inquiryType, 40);
    if (explicit) return explicit;
    return /sample/i.test(link.textContent || '') ? 'sample' : 'quote';
  }

  function enhanceContactLinks() {
    if (currentPath === '/contact/' || currentPath === '/contact') return;
    document.querySelectorAll('a[href]').forEach(link => {
      const rawHref = link.getAttribute('href') || '';
      let url;
      try {
        url = new URL(rawHref, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || !/^\/contact\/?$/.test(url.pathname)) return;
      const intent = inquiryTypeForLink(link);
      link.href = contactHref(intent);
      link.dataset.inquiryChannel ||= 'rfq-builder';
      link.dataset.inquiryType ||= intent;
      link.dataset.inquiryLocation ||= 'contact-link';
    });
  }

  function enhanceDirectContactLinks() {
    document.querySelectorAll(`a[href^="https://wa.me/${whatsappNumber}"]`).forEach(link => {
      const intent = inquiryTypeForLink(link);
      const href = link.getAttribute('href') || '';
      if (!/[?&]text=/.test(href)) link.href = whatsappHref(intent);
      link.dataset.inquiryChannel ||= 'whatsapp';
      link.dataset.inquiryType ||= intent;
    });

    document.querySelectorAll(`a[href^="mailto:${salesEmail}"]`).forEach(link => {
      const intent = inquiryTypeForLink(link);
      const href = link.getAttribute('href') || '';
      if (!href.includes('?')) {
        const subject = intent === 'sample' ? `Sample request: ${pageTopic()}` : `Packaging RFQ: ${pageTopic()}`;
        link.href = `mailto:${salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inquiryMessage(intent))}`;
      }
      link.dataset.inquiryChannel ||= 'email';
      link.dataset.inquiryType ||= intent;
    });
  }

  function trackInquiry(link) {
    const eventDetail = {
      event: 'inquiry_click',
      inquiry_channel: cleanText(link.dataset.inquiryChannel || 'unknown', 40),
      inquiry_type: inquiryTypeForLink(link),
      inquiry_location: cleanText(link.dataset.inquiryLocation || 'page', 40),
      inquiry_topic: pageTopic(),
      page_path: currentPath
    };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventDetail);
    document.dispatchEvent(new CustomEvent('gsp:inquiry-click', { detail: eventDetail }));
  }

  function installTracking() {
    document.addEventListener('click', event => {
      const link = event.target.closest?.('[data-inquiry-channel]');
      if (link) trackInquiry(link);
    }, { capture: true });
  }

  function prefillContactBuilder() {
    if (!/^\/contact\/?$/.test(currentPath)) return;
    const params = currentUrl.searchParams;
    const topic = cleanText(params.get('topic'));
    const intent = cleanText(params.get('intent'), 30);
    const sourcePath = safeSourcePath(params.get('source'));
    const productField = document.getElementById('rfq-product');
    if (productField && topic && !productField.value.trim()) productField.value = topic;

    if (sourcePath) {
      const form = document.getElementById('rfq-form');
      const note = document.createElement('p');
      note.className = 'gsp-inquiry-source';
      note.textContent = `Inquiry context retained from ${topic || sourcePath}. You can edit every field before sending.`;
      form?.insertAdjacentElement('beforebegin', note);
      form?.setAttribute('data-source-page', `${siteOrigin}${sourcePath}`);
      form?.setAttribute('data-source-intent', intent || 'quote');
    }
    productField?.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function shouldShowDock() {
    if (/^\/(?:$|contact\/?$)/.test(currentPath)) return false;
    if (/\.(?:xml|json|txt)$/i.test(currentPath)) return false;
    return document.querySelector('main, article, section.hero, .hero') !== null;
  }

  function buildDock() {
    if (!shouldShowDock()) return;
    const dock = document.createElement('aside');
    dock.className = 'gsp-inquiry-dock';
    dock.setAttribute('aria-label', 'Packaging inquiry shortcuts');
    dock.innerHTML = `
      <div class="gsp-inquiry-copy">
        <strong>Quote ${pageTopic()}</strong>
        <span>Send quantity and destination for a useful reply.</span>
      </div>
      <div class="gsp-inquiry-actions">
        <a class="gsp-inquiry-action" data-inquiry-channel="whatsapp" data-inquiry-type="quote" data-inquiry-location="sticky-dock" href="${whatsappHref('quote')}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="gsp-inquiry-action is-secondary" data-inquiry-channel="rfq-builder" data-inquiry-type="quote" data-inquiry-location="sticky-dock" href="${contactHref('quote')}">Build RFQ</a>
      </div>
      <button class="gsp-inquiry-close" type="button" aria-label="Close inquiry shortcuts">×</button>`;
    document.body.appendChild(dock);
    document.body.classList.add('gsp-has-inquiry-dock');
    dock.querySelector('.gsp-inquiry-close')?.addEventListener('click', () => {
      dock.remove();
      document.body.classList.remove('gsp-has-inquiry-dock');
    });
    window.setTimeout(() => dock.classList.add('is-visible'), 700);
  }

  function init() {
    enhanceContactLinks();
    enhanceDirectContactLinks();
    prefillContactBuilder();
    installTracking();
    buildDock();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
