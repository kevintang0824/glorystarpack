(() => {
  'use strict';

  const whatsappNumber = '8619577608248';
  const salesEmail = 'kevin@glorystarpack.com';
  const siteOrigin = 'https://www.glorystarpack.com';
  const currentUrl = new URL(window.location.href);
  const currentPath = currentUrl.pathname;
  const firstTouchKey = 'gsp_first_touch_v1';
  const sessionTouchKey = 'gsp_session_touch_v1';
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const visibleCampaignKeys = ['utm_source', 'utm_medium', 'utm_campaign'];

  function cleanText(value, maxLength = 120) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function safeStorage(storage, operation, key, value) {
    try {
      if (operation === 'get') return storage.getItem(key);
      storage.setItem(key, value);
    } catch {}
    return null;
  }

  function safePageUrl(rawUrl, includeCampaign = false) {
    try {
      const url = new URL(rawUrl, window.location.origin);
      url.hash = '';
      if (!includeCampaign) url.search = '';
      else {
        [...url.searchParams.keys()].forEach(key => {
          if (!campaignKeys.includes(key) && !['gclid', 'dclid', 'msclkid'].includes(key)) {
            url.searchParams.delete(key);
          }
        });
      }
      return cleanText(url.href, 500);
    } catch {
      return '';
    }
  }

  function readTouch(storage, key) {
    const raw = safeStorage(storage, 'get', key);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      return value && typeof value === 'object' ? value : null;
    } catch {
      return null;
    }
  }

  function currentTouch() {
    const touch = {
      landingPage: safePageUrl(currentUrl.href, true),
      referrerPage: safePageUrl(document.referrer),
      campaignSource: cleanText(currentUrl.searchParams.get('utm_source'), 100),
      campaignMedium: cleanText(currentUrl.searchParams.get('utm_medium'), 100),
      campaignName: cleanText(currentUrl.searchParams.get('utm_campaign'), 150),
      campaignTerm: cleanText(currentUrl.searchParams.get('utm_term'), 150),
      campaignContent: cleanText(currentUrl.searchParams.get('utm_content'), 150),
      adClickId: cleanText(
        currentUrl.searchParams.get('gclid')
        || currentUrl.searchParams.get('dclid')
        || currentUrl.searchParams.get('msclkid'),
        200
      )
    };
    if (touch.referrerPage && new URL(touch.referrerPage).origin === currentUrl.origin) touch.referrerPage = '';
    return touch;
  }

  function rememberAttribution() {
    const touch = currentTouch();
    let firstTouch = readTouch(window.localStorage, firstTouchKey);
    let sessionTouch = readTouch(window.sessionStorage, sessionTouchKey);
    if (!firstTouch) {
      firstTouch = touch;
      safeStorage(window.localStorage, 'set', firstTouchKey, JSON.stringify(firstTouch));
    }
    if (!sessionTouch) {
      sessionTouch = touch;
      safeStorage(window.sessionStorage, 'set', sessionTouchKey, JSON.stringify(sessionTouch));
    }
    return { firstTouch, sessionTouch };
  }

  const attribution = rememberAttribution();
  window.gspInquiryAttribution = () => ({
    firstTouch: { ...attribution.firstTouch },
    sessionTouch: { ...attribution.sessionTouch }
  });

  function attributionLines() {
    const touch = attribution.sessionTouch;
    const landingPage = visibleAttributionUrl(touch.landingPage);
    const campaign = [touch.campaignSource, touch.campaignMedium, touch.campaignName].filter(Boolean).join(' / ');
    return [
      ...(landingPage && landingPage !== canonicalPage() ? [`Session landing page: ${landingPage}`] : []),
      ...(touch.referrerPage ? [`External referrer: ${touch.referrerPage}`] : []),
      ...(campaign ? [`Campaign: ${campaign}`] : [])
    ];
  }

  function visibleAttributionUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      [...url.searchParams.keys()].forEach(key => {
        if (!visibleCampaignKeys.includes(key)) url.searchParams.delete(key);
      });
      return cleanText(url.href, 500);
    } catch {
      return '';
    }
  }

  function messageWithAttribution(rawMessage) {
    const message = String(rawMessage || '').replace(/\r\n?/g, '\n').trimEnd();
    const contextLines = [];
    const canonical = canonicalPage();
    if (canonical && !message.includes(canonical)) contextLines.push(`Website page: ${canonical}`);

    for (const line of attributionLines()) {
      const separator = line.indexOf(':');
      const label = separator === -1 ? line : line.slice(0, separator);
      const hasLabel = message
        .split('\n')
        .some(messageLine => messageLine.trim().toLowerCase().startsWith(`${label.toLowerCase()}:`));
      if (!hasLabel) contextLines.push(line);
    }

    if (!contextLines.length) return message;
    return `${message}${message ? '\n\n' : ''}${contextLines.join('\n')}`;
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
      `Website page: ${canonicalPage()}`,
      ...attributionLines()
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
      try {
        const url = new URL(href);
        const existingMessage = url.searchParams.get('text');
        url.searchParams.set('text', existingMessage
          ? messageWithAttribution(existingMessage)
          : inquiryMessage(intent));
        link.href = url.href;
      } catch {
        link.href = whatsappHref(intent);
      }
      link.dataset.inquiryChannel ||= 'whatsapp';
      link.dataset.inquiryType ||= intent;
    });

    document.querySelectorAll(`a[href^="mailto:${salesEmail}"]`).forEach(link => {
      const intent = inquiryTypeForLink(link);
      const href = link.getAttribute('href') || '';
      const defaultSubject = intent === 'sample' ? `Sample request: ${pageTopic()}` : `Packaging RFQ: ${pageTopic()}`;
      try {
        const url = new URL(href);
        const existingMessage = url.searchParams.get('body');
        if (!url.searchParams.get('subject')) url.searchParams.set('subject', defaultSubject);
        url.searchParams.set('body', existingMessage
          ? messageWithAttribution(existingMessage)
          : inquiryMessage(intent));
        link.href = url.href;
      } catch {
        link.href = `mailto:${salesEmail}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(inquiryMessage(intent))}`;
      }
      link.dataset.inquiryChannel ||= 'email';
      link.dataset.inquiryType ||= intent;
    });
  }

  function trackInquiry(link) {
    let landingPagePath = currentPath;
    try {
      landingPagePath = new URL(attribution.sessionTouch.landingPage || currentUrl.href).pathname;
    } catch {}
    const eventDetail = {
      event: 'inquiry_click',
      inquiry_channel: cleanText(link.dataset.inquiryChannel || 'unknown', 40),
      inquiry_type: inquiryTypeForLink(link),
      inquiry_location: cleanText(link.dataset.inquiryLocation || 'page', 40),
      inquiry_topic: cleanText(pageTopic(), 100),
      page_path: cleanText(currentPath, 100),
      landing_page_path: cleanText(landingPagePath, 100)
    };
    const { event: eventName, ...eventParameters } = eventDetail;
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventParameters);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(eventDetail);
    }
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
