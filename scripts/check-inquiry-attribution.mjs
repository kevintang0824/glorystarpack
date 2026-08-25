import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const source = fs.readFileSync(path.join(rootDir, 'assets/js/inquiry-conversion.js'), 'utf8');
const canonical = 'https://www.glorystarpack.com/products/test-packaging/';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

class FakeLink {
  constructor(href, textContent, dataset = {}) {
    this.attributes = new Map([['href', href]]);
    this.textContent = textContent;
    this.dataset = { ...dataset };
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  get href() {
    return this.getAttribute('href');
  }

  set href(value) {
    this.setAttribute('href', value);
  }
}

const productMessage = [
  'Hello GloryStarPack, I need a quotation for Test Packaging (p999).',
  '',
  'Estimated quantity:',
  'Destination country:',
  '',
  `Product page: ${canonical}`
].join('\n');
const whatsappPrefilled = new FakeLink(
  `https://wa.me/8619577608248?text=${encodeURIComponent(productMessage)}`,
  'Request Project Quote',
  { inquiryType: 'quote' }
);
const whatsappPlain = new FakeLink('https://wa.me/8619577608248', 'Request Samples', { inquiryType: 'sample' });
const whatsappPrefilledWithoutPage = new FakeLink(
  `https://wa.me/8619577608248?text=${encodeURIComponent('Hello GloryStarPack, I need help choosing perfume bottle packaging.')}`,
  'Discuss Perfume Bottles',
  { inquiryType: 'quote' }
);
const emailPrefilled = new FakeLink(
  `mailto:kevin@glorystarpack.com?subject=${encodeURIComponent('RFQ: Test Packaging (p999)')}&body=${encodeURIComponent(productMessage)}`,
  'Email RFQ',
  { inquiryType: 'quote' }
);
const emailPlain = new FakeLink('mailto:kevin@glorystarpack.com', 'Email Samples', { inquiryType: 'sample' });
const allLinks = [whatsappPrefilled, whatsappPlain, whatsappPrefilledWithoutPage, emailPrefilled, emailPlain];

const document = {
  readyState: 'complete',
  referrer: 'https://buyer.example/research?private=remove-me',
  body: {
    appendChild() {},
    classList: { add() {}, remove() {} }
  },
  querySelectorAll(selector) {
    if (selector === 'a[href]') return allLinks;
    if (selector.startsWith('a[href^="https://wa.me/')) {
      return [whatsappPrefilled, whatsappPlain, whatsappPrefilledWithoutPage];
    }
    if (selector.startsWith('a[href^="mailto:')) return [emailPrefilled, emailPlain];
    return [];
  },
  querySelector(selector) {
    if (selector === 'link[rel="canonical"]') return { href: canonical };
    if (selector === 'h1') return { textContent: 'Test Packaging' };
    return null;
  },
  getElementById() {
    return null;
  },
  addEventListener() {},
  dispatchEvent() {}
};

const window = {
  location: {
    href: `${canonical}?utm_source=seo_test&utm_medium=organic&utm_campaign=attribution_regression&utm_term=SECRET_SEARCH_TERM&utm_content=SECRET_AD_CONTENT&gclid=SECRET_CLICK_ID`,
    origin: 'https://www.glorystarpack.com'
  },
  localStorage: new MemoryStorage(),
  sessionStorage: new MemoryStorage(),
  dataLayer: [],
  setTimeout() {}
};

const context = vm.createContext({
  window,
  document,
  URL,
  URLSearchParams,
  CustomEvent: class CustomEvent {},
  console
});

// Run twice to verify that the enrichment remains idempotent if initialization repeats.
vm.runInContext(source, context, { filename: 'inquiry-conversion.js' });
vm.runInContext(source, context, { filename: 'inquiry-conversion.js' });

const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function assertAttributedMessage(message, label) {
  expect(message.includes('Test Packaging'), `${label}: original product context was not preserved`);
  expect(count(message, `Product page: ${canonical}`) === 1, `${label}: original canonical product page should appear exactly once`);
  expect(!message.includes(`Website page: ${canonical}`), `${label}: canonical page should not be added under a second label`);
  expect(count(message, 'Session landing page:') === 1, `${label}: session landing page should appear exactly once`);
  expect(count(message, 'External referrer:') === 1, `${label}: external referrer should appear exactly once`);
  expect(count(message, 'Campaign: seo_test / organic / attribution_regression') === 1, `${label}: campaign context should appear exactly once`);
  expect(!message.includes('SECRET_CLICK_ID'), `${label}: advertising click IDs must not appear in a user-visible draft`);
  expect(!message.includes('SECRET_SEARCH_TERM'), `${label}: campaign search terms must not appear in a user-visible draft`);
  expect(!message.includes('SECRET_AD_CONTENT'), `${label}: campaign content must not appear in a user-visible draft`);
  expect(!message.includes('private=remove-me'), `${label}: referrer query parameters must not appear in a user-visible draft`);
}

const whatsappMessage = new URL(whatsappPrefilled.href).searchParams.get('text') || '';
const emailUrl = new URL(emailPrefilled.href);
const emailMessage = emailUrl.searchParams.get('body') || '';
assertAttributedMessage(whatsappMessage, 'prefilled WhatsApp');
assertAttributedMessage(emailMessage, 'prefilled email');
expect(emailUrl.searchParams.get('subject') === 'RFQ: Test Packaging (p999)', 'prefilled email: original subject was not preserved');

const plainWhatsappMessage = new URL(whatsappPlain.href).searchParams.get('text') || '';
const prefilledWithoutPageMessage = new URL(whatsappPrefilledWithoutPage.href).searchParams.get('text') || '';
const plainEmailUrl = new URL(emailPlain.href);
const plainEmailMessage = plainEmailUrl.searchParams.get('body') || '';
expect(plainWhatsappMessage.includes('request samples related to Test Packaging'), 'plain WhatsApp: sample message was not generated');
expect(plainWhatsappMessage.includes(`Website page: ${canonical}`), 'plain WhatsApp: canonical page was not added');
expect(prefilledWithoutPageMessage.includes('help choosing perfume bottle packaging'), 'prefilled WhatsApp without page: original message was not preserved');
expect(count(prefilledWithoutPageMessage, `Website page: ${canonical}`) === 1, 'prefilled WhatsApp without page: canonical page should appear exactly once');
expect(count(prefilledWithoutPageMessage, 'Campaign: seo_test / organic / attribution_regression') === 1, 'prefilled WhatsApp without page: campaign context should appear exactly once');
expect(!prefilledWithoutPageMessage.includes('SECRET_CLICK_ID'), 'prefilled WhatsApp without page: advertising click ID leaked into the visible message');
expect(!prefilledWithoutPageMessage.includes('SECRET_SEARCH_TERM') && !prefilledWithoutPageMessage.includes('SECRET_AD_CONTENT'), 'prefilled WhatsApp without page: detailed campaign data leaked into the visible message');
expect(plainEmailUrl.searchParams.get('subject') === 'Sample request: Test Packaging', 'plain email: sample subject was not generated');
expect(plainEmailMessage.includes(`Website page: ${canonical}`), 'plain email: canonical page was not added');
expect(!plainWhatsappMessage.includes('SECRET_CLICK_ID') && !plainEmailMessage.includes('SECRET_CLICK_ID'), 'plain drafts: advertising click IDs leaked into visible messages');
expect(!plainWhatsappMessage.includes('SECRET_SEARCH_TERM') && !plainEmailMessage.includes('SECRET_AD_CONTENT'), 'plain drafts: detailed campaign data leaked into visible messages');

if (failures.length) {
  console.error(`Inquiry attribution checks failed (${failures.length}):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Inquiry attribution checks passed for prefilled and generated WhatsApp/email drafts.');
}
