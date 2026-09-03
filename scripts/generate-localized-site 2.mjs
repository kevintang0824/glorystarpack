import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { localeCodes, localeInfo, t } from '../data/site-locales.mjs';
import { categories, domainNotes, serviceTitles, topics, topicNotes } from '../data/localized-topics.mjs';
import { productNames, catalogKinds, specifications } from '../data/localized-products.mjs';
import { alternateLanguageLinks, languageSwitcherMarkup, localePath } from './language-switcher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.glorystarpack.com';
const googleTagId = 'G-NYY1MTZ6HM';
const analyticsMarkup = `<script async src="https://www.googletagmanager.com/gtag/js?id=${googleTagId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=window.gtag||gtag;window.gtag('js',new Date());window.gtag('config','${googleTagId}');</script>`;
const sourceContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/product-data.js'), 'utf8'), sourceContext);
const products = sourceContext.window.GSP_PRODUCTS;
const localeIndex = language => localeCodes.indexOf(language);
const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const stripHtml = value => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
const slugFromRoute = route => route === '/' ? '' : route.split('/').filter(Boolean).at(-1);
const localizedUrl = (language, route) => `${site}${localePath(language, route)}`;

const sitemapSource = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const routes = [...new Set([...sitemapSource.matchAll(/<loc>https:\/\/www\.glorystarpack\.com([^<]+)<\/loc>/g)].map(match => match[1]))]
  .filter(route => !localeCodes.some(language => route.startsWith(`/${language}/`)));
const sourceForRoute = route => {
  const file = route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
  return fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : '';
};
const routeRecords = routes.map(route => {
  const source = sourceForRoute(route);
  const id = route.match(/-p(\d+)\/$/)?.[1] ? `p${route.match(/-p(\d+)\/$/)[1]}` : '';
  const image = source.match(/<meta property="og:image" content="https:\/\/www\.glorystarpack\.com([^\"]+)"/)?.[1]
    || source.match(/<img[^>]+src="([^\"]+)"/)?.[1] || '/assets/brand/custom-glass-bottle-hero-2026-960.avif';
  return { route, slug: slugFromRoute(route), id, image: image.startsWith('/') ? image : `/${image}` };
});
const routeByProduct = new Map(routeRecords.filter(record => record.id).map(record => [record.id, record.route]));
const productById = new Map(products.map(product => [product.id, product]));

function localizeSpec(value, language) {
  let result = String(value || '');
  for (const [needle, values] of Object.entries(specifications).sort((a, b) => b[0].length - a[0].length)) {
    result = result.replaceAll(needle, values[localeIndex(language)]);
  }
  return result;
}
function catalogKind(product) {
  const cats = product.cats || [];
  if (product.sourceCategory && catalogKinds[product.sourceCategory]) return product.sourceCategory;
  if (cats.some(cat => /closure|pump|spray/.test(cat))) return 'pump';
  if (cats.some(cat => /jar|tin|can/.test(cat))) return 'jar';
  if (cats.some(cat => /tube/.test(cat))) return 'tube';
  if (cats.some(cat => /makeup|nail|lip/.test(cat))) return 'makeup';
  if (cats.some(cat => /paper-box|gift-box|mailer/.test(cat))) return 'paper-box';
  if (cats.some(cat => /pouch/.test(cat))) return 'flexible-pouch';
  if (cats.some(cat => /kit|travel/.test(cat))) return 'kit';
  return 'bottle';
}
function productName(product, language) {
  const exact = productNames[product.id];
  if (exact) return exact[localeIndex(language)];
  const label = catalogKinds[catalogKind(product)]?.[localeIndex(language)] || catalogKinds.bottle[localeIndex(language)];
  return `${label} · ${product.id.toUpperCase()}`;
}
function productImage(product) {
  if (Array.isArray(product.images) && product.images[0]) return `/${product.images[0].replace(/^\//, '')}`;
  const exact = `/assets/product-photos/${product.id}-0.jpg`;
  if (fs.existsSync(path.join(root, exact.slice(1)))) return exact;
  const cats = product.cats || [];
  if (cats.some(cat => /paper|box|bag|label|display/.test(cat))) return '/assets/brand/paper-eco-complete-product-assortment-2026-960.avif';
  if (cats.some(cat => /airless|pump/.test(cat))) return '/assets/brand/airless-packaging-collection-2026-960.avif';
  if (cats.some(cat => /perfume|fragrance/.test(cat))) return '/assets/brand/perfume-fragrance-bottle-collection-original-2026-768.jpg';
  if (cats.some(cat => /wine|beer|spirit|beverage/.test(cat))) return '/assets/brand/wine-spirits-bottle-collection-2026-1440-640.avif';
  if (cats.some(cat => /bamboo|eco|refill/.test(cat))) return '/assets/brand/eco-packaging-collection-2026-640.avif';
  if (cats.some(cat => /makeup|nail/.test(cat))) return '/assets/brand/makeup-packaging-collection-2026.jpg';
  return '/assets/brand/cosmetic-packaging-hero-mobile-960.avif';
}
function productPath(product, language) {
  const route = routeByProduct.get(product.id);
  return route ? localePath(language, route) : `${localePath(language, '/products/product-index/')}?product=${encodeURIComponent(product.id)}`;
}
function categoryProducts(category) {
  if (!category) return products;
  return products.filter(product => product.cats?.includes(category) || product.materialGroup === category);
}
function indexLinks(language) {
  return {
    home: localePath(language, '/'), products: localePath(language, '/products/product-index/'),
    guides: localePath(language, '/cosmetic-packaging-guides/'), insights: localePath(language, '/insights/'),
    about: localePath(language, '/about/'), contact: localePath(language, '/contact/'), index: localePath(language, '/products/product-index/')
  };
}
function header(language, route, active = '') {
  const link = indexLinks(language);
  const current = key => active === key ? ' aria-current="page"' : '';
  return `<header class="gsp-site-header"><a class="gsp-skip-link" href="#main-content">${t('skip', language)}</a><div class="gsp-header-inner">
<a class="gsp-brand" href="${link.home}" aria-label="GloryStarPack"><img src="/assets/brand/glorystarpack-logo-mark-96-2026.png" width="96" height="96" alt=""><span class="gsp-brand-copy"><strong>GLORYSTARPACK</strong><small>${t('brandLine', language)}</small></span></a>
<nav class="gsp-primary-nav" aria-label="${t('index', language)}"><a${current('products')} href="${link.products}">${t('products', language)}</a><a${current('guides')} href="${link.guides}">${t('guides', language)}</a><a${current('about')} href="${link.about}">${t('about', language)}</a></nav>
${languageSwitcherMarkup({ language, route })}<a class="gsp-header-cta"${current('contact')} href="${link.contact}">${t('quote', language)}</a></div></header>`;
}
function footer(language) {
  const link = indexLinks(language);
  return `<footer class="gsp-site-footer"><div class="gsp-footer-inner"><div class="gsp-footer-brand"><a class="gsp-brand" href="${link.home}"><img src="/assets/brand/glorystarpack-logo-mark-96-2026.png" width="96" height="96" alt=""><span class="gsp-brand-copy"><strong>GLORYSTARPACK</strong><small>${t('brandLine', language)}</small></span></a><p>${t('footer', language)}</p></div><nav class="gsp-footer-nav"><a href="${link.products}">${t('products', language)}</a><a href="${link.guides}">${t('guides', language)}</a><a href="${link.insights}">${t('insights', language)}</a><a href="${link.about}">${t('about', language)}</a><a href="${link.index}">${t('index', language)}</a><a href="${link.contact}">${t('contact', language)}</a></nav><div class="gsp-footer-contact"><strong>${t('start', language)}</strong><a href="mailto:kevin@glorystarpack.com">kevin@glorystarpack.com</a><a href="https://wa.me/8619577608248" rel="noopener">WhatsApp +86 195-7760-8248</a><span>${t('location', language)}</span></div></div><div class="gsp-footer-bottom"><span>© 2026 GloryStarPack</span><span>${t('rights', language)}</span></div></footer>`;
}
function breadcrumb(language, route, title, parent) {
  const links = indexLinks(language);
  return `<nav class="gsp-breadcrumbs" aria-label="${t('index', language)}"><div class="gsp-breadcrumbs-inner"><a href="${links.home}">${t('home', language)}</a><span>/</span>${parent ? `<a href="${parent.href}">${parent.label}</a><span>/</span>` : ''}<span aria-current="page">${escapeHtml(title)}</span></div></nav>`;
}
function jsonLd(data) { return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`; }
function layout({ language, route, title, description, active, body, image, type = 'WebPage', schema = {} }) {
  const canonical = localizedUrl(language, route);
  const [, , locale] = localeInfo[language];
  const socialImage = image?.startsWith('/') ? `${site}${image}` : `${site}/assets/brand/custom-glass-bottle-hero-2026.jpg`;
  const structured = { '@context': 'https://schema.org', '@type': type, name: title, description, url: canonical, inLanguage: language, image: socialImage, ...schema };
  return `<!DOCTYPE html><html lang="${language}"><head>${analyticsMarkup}<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | GloryStarPack</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}">${alternateLanguageLinks(route)}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/css/site-shell.css?v=20260829-1"><link rel="stylesheet" href="/assets/css/site-language.css?v=20260903-2"><link rel="stylesheet" href="/assets/css/localized-site.css?v=20260903-1"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="${locale}"><meta property="og:image" content="${socialImage}">${jsonLd(structured)}<script src="/assets/js/site-language.js?v=20260903-2" defer></script></head><body>${header(language, route, active)}${body}${footer(language)}</body></html>`;
}
function card(product, language) {
  return `<article class="l10n-card l10n-product-card"><a href="${productPath(product, language)}"><img src="${productImage(product)}" alt="${escapeHtml(productName(product, language))}" loading="lazy" width="480" height="360"><div class="l10n-card-copy"><span class="l10n-ref">${t('reference', language)} ${escapeHtml(product.id.toUpperCase())}</span><h3>${escapeHtml(productName(product, language))}</h3><dl><div><dt>${t('capacity', language)}</dt><dd>${escapeHtml(localizeSpec(product.size, language))}</dd></div><div><dt>${t('material', language)}</dt><dd>${escapeHtml(localizeSpec(product.mat, language))}</dd></div></dl><span class="l10n-text-link">${t('view', language)} →</span></div></a></article>`;
}
function cta(language) {
  const link = indexLinks(language);
  return `<section class="l10n-cta"><div><span class="l10n-eyebrow">GloryStarPack</span><h2>${t('start', language)}</h2><p>${t('startCopy', language)}</p></div><a class="l10n-button" href="${link.contact}">${t('quote', language)}</a></section>`;
}
function process(language) {
  return `<section class="l10n-section"><span class="l10n-eyebrow">${t('scope', language)}</span><div class="l10n-process"><article><b>01</b><h3>${t('select', language)}</h3><p>${t('select', language) === '选型' ? '从用途、配方、容量和瓶口组件出发，对比可行的现有型号与定制方案。' : t('select', language) + '. ' + t('catalogIntro', language)}</p></article><article><b>02</b><h3>${t('approve', language)}</h3><p>${t('approve', language) === '确认' ? '使用具有代表性的样品确认尺寸、材质、装饰效果、密封和使用表现。' : t('productCheck', language)}</p></article><article><b>03</b><h3>${t('deliver', language)}</h3><p>${t('deliver', language) === '交付' ? '封样后确认数量、质量标准、运输包装、目的地和交付计划。' : t('moqNote', language)}</p></article></div></section>`;
}
function homePage(language) {
  const route = '/';
  const featured = ['p331','p363','p335','p380','p381','p7'].map(id => productById.get(id)).filter(Boolean);
  const body = `<main id="main-content"><section class="l10n-hero"><div class="l10n-hero-copy"><span class="l10n-eyebrow">GloryStarPack · Xiamen</span><h1>${t('hero', language)}</h1><p>${t('heroIntro', language)}</p><div class="l10n-actions"><a class="l10n-button" href="${indexLinks(language).products}">${t('products', language)}</a><a class="l10n-button is-secondary" href="${indexLinks(language).contact}">${t('quote', language)}</a></div></div><img src="/assets/brand/custom-glass-bottle-hero-2026-960.avif" alt="${t('hero', language)}" width="960" height="640"></section>${process(language)}<section class="l10n-section"><div class="l10n-section-head"><div><span class="l10n-eyebrow">${t('catalog', language)}</span><h2>${t('products', language)}</h2></div><a href="${indexLinks(language).products}">${t('all', language)} →</a></div><div class="l10n-grid">${featured.map(product => card(product, language)).join('')}</div></section>${cta(language)}</main>`;
  return layout({ language, route, title: t('hero', language), description: t('heroIntro', language), active: '', body, image: '/assets/brand/custom-glass-bottle-hero-2026.jpg', type: 'Organization', schema: { name: 'GloryStarPack', email: 'kevin@glorystarpack.com', telephone: '+86 195-7760-8248', address: t('location', language) } });
}
function categoryPage(language, record) {
  const [filter, domain, titles] = categories[record.slug];
  const title = titles[localeIndex(language)];
  const note = domainNotes[domain];
  const description = note[localeIndex(language)];
  let list = categoryProducts(filter);
  if (!list.length) list = products;
  const body = `<main id="main-content">${breadcrumb(language, record.route, title, { href: indexLinks(language).products, label: t('products', language) })}<section class="l10n-page-hero"><div><span class="l10n-eyebrow">${t('products', language)}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><a class="l10n-button" href="${indexLinks(language).contact}">${t('quote', language)}</a></div><img src="${record.image}" alt="${escapeHtml(title)}" width="960" height="640"></section><section class="l10n-section"><div class="l10n-section-head"><div><span class="l10n-eyebrow">${t('catalog', language)}</span><h2>${t('select', language)}</h2></div><a href="${indexLinks(language).products}">${t('all', language)} →</a></div><div class="l10n-grid">${list.slice(0, 12).map(product => card(product, language)).join('')}</div></section>${process(language)}${cta(language)}</main>`;
  return layout({ language, route: record.route, title, description, active: 'products', body, image: record.image, type: 'CollectionPage' });
}
function productPage(language, record) {
  const product = productById.get(record.id);
  const title = productName(product, language);
  const description = `${t('productIntro', language)} ${t('moqNote', language)}`;
  const rows = [['reference', product.id.toUpperCase()], ['material', localizeSpec(product.mat, language)], ['capacity', localizeSpec(product.size, language)], ['finish', localizeSpec(product.finish, language)], ['moq', `${product.moq} ${t('pieces', language)}`]];
  const related = products.filter(other => other.id !== product.id && other.cats?.some(cat => product.cats.includes(cat))).slice(0, 4);
  const body = `<main id="main-content">${breadcrumb(language, record.route, title, { href: indexLinks(language).products, label: t('products', language) })}<section class="l10n-product-hero"><div class="l10n-product-image"><img src="${productImage(product)}" alt="${escapeHtml(title)}" width="720" height="720"></div><div class="l10n-product-summary"><span class="l10n-eyebrow">${t('reference', language)} ${escapeHtml(product.id.toUpperCase())}</span><h1>${escapeHtml(title)}</h1><p>${t('productIntro', language)}</p><dl class="l10n-spec-list">${rows.map(([key, value]) => `<div><dt>${t(key, language)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><a class="l10n-button" href="${indexLinks(language).contact}?product=${encodeURIComponent(title)}&source=${encodeURIComponent(record.route)}">${t('quote', language)}</a></div></section><section class="l10n-section l10n-reading"><h2>${t('configuration', language)}</h2><p>${t('productCheck', language)}</p><p>${t('moqNote', language)}</p><h2>${t('specs', language)}</h2><p>${t('select', language) === '选型' ? '请在项目规格中记录实际瓶口、瓶盖或泵头、接触材质、颜色、装饰、允许公差与包装方式。需要用最终配方和量产代表样品验证功能。' : t('traceability', language)}</p></section><section class="l10n-section"><div class="l10n-section-head"><h2>${t('related', language)}</h2></div><div class="l10n-grid">${related.map(item => card(item, language)).join('')}</div></section>${cta(language)}</main>`;
  return layout({ language, route: record.route, title, description, active: 'products', body, image: productImage(product), type: 'Product', schema: { sku: product.id.toUpperCase(), material: localizeSpec(product.mat, language), size: localizeSpec(product.size, language), brand: { '@type': 'Brand', name: 'GloryStarPack' } } });
}
function topicTitle(record, language) { return topics[record.slug]?.[1]?.[localeIndex(language)] || record.slug; }
function topicPage(language, record) {
  const [domain] = topics[record.slug];
  const title = topicTitle(record, language);
  const note = topicNotes[domain] || domainNotes[domain] || domainNotes.cosmetic;
  const description = note[localeIndex(language)];
  const body = `<main id="main-content">${breadcrumb(language, record.route, title, { href: indexLinks(language).guides, label: t('guides', language) })}<article class="l10n-article"><header><span class="l10n-eyebrow">${record.route.startsWith('/insights/') ? t('insights', language) : t('guides', language)}</span><h1>${escapeHtml(title)}</h1><p class="l10n-lead">${t('guideIntro', language)}</p></header><img class="l10n-article-image" src="${record.image}" alt="${escapeHtml(title)}" width="1200" height="675"><section><h2>${t('specification', language)}</h2><p>${escapeHtml(description)}</p><p>${t('select', language) === '选型' ? '将用途、配方、容量、组件、装饰、数量、目的地和计划时间写入同一份规格，避免不同供应环节采用不一致的假设。' : t('commercial', language)}</p></section><section><h2>${t('testing', language)}</h2><p>${t('productCheck', language)}</p><p>${t('traceability', language)}</p></section><section><h2>${t('ordering', language)}</h2><p>${t('commercial', language)}</p><p>${t('moqNote', language)}</p></section><aside class="l10n-checklist"><h2>${t('checklist', language)}</h2><ul><li>${t('material', language)} / ${t('capacity', language)}</li><li>${t('closure', language)} / ${t('finish', language)}</li><li>${t('quantity', language)} / ${t('country', language)}</li></ul></aside></article>${cta(language)}</main>`;
  return layout({ language, route: record.route, title, description, active: 'guides', body, image: record.image, type: 'Article', schema: { author: { '@type': 'Organization', name: 'GloryStarPack' }, dateModified: '2026-09-03' } });
}
function hubCards(language, list) {
  return list.map(record => `<article class="l10n-card l10n-topic-card"><a href="${localePath(language, record.route)}"><div class="l10n-card-copy"><span class="l10n-ref">${record.route.startsWith('/insights/') ? t('insights', language) : t('guides', language)}</span><h2>${escapeHtml(topicTitle(record, language))}</h2><p>${escapeHtml((topicNotes[topics[record.slug]?.[0]] || domainNotes.cosmetic)[localeIndex(language)])}</p><span class="l10n-text-link">${t('read', language)} →</span></div></a></article>`).join('');
}
function hubPage(language, record, kind) {
  const allTopics = routeRecords.filter(item => topics[item.slug]);
  let list = kind === 'insights' ? allTopics.filter(item => item.route.startsWith('/insights/'))
    : kind === 'glass' ? allTopics.filter(item => /glass|bottle|closure|shipping|sample/.test(item.slug))
    : allTopics.filter(item => !item.route.startsWith('/insights/'));
  if (kind === 'guides') list = allTopics;
  const title = kind === 'insights' ? t('insights', language) : kind === 'glass' ? ({fr:'Guides d’achat de bouteilles en verre',es:'Guías de compra de botellas de vidrio',pt:'Guias de compra de garrafas de vidro',ru:'Руководства по закупке стеклянных бутылок','zh-CN':'玻璃瓶采购指南'})[language] : t('guides', language);
  const body = `<main id="main-content">${breadcrumb(language, record.route, title)}<section class="l10n-hub-hero"><span class="l10n-eyebrow">GloryStarPack</span><h1>${escapeHtml(title)}</h1><p>${t('guideIntro', language)}</p></section><section class="l10n-section"><div class="l10n-topic-grid">${hubCards(language, list)}</div></section>${cta(language)}</main>`;
  return layout({ language, route: record.route, title, description: t('guideIntro', language), active: 'guides', body, image: record.image, type: 'CollectionPage' });
}
function servicePage(language, record) {
  const title = serviceTitles[record.slug][localeIndex(language)];
  const body = `<main id="main-content">${breadcrumb(language, record.route, title)}<section class="l10n-page-hero"><div><span class="l10n-eyebrow">GloryStarPack</span><h1>${escapeHtml(title)}</h1><p>${t('aboutIntro', language)}</p><a class="l10n-button" href="${indexLinks(language).contact}">${t('quote', language)}</a></div><img src="${record.image}" alt="${escapeHtml(title)}" width="960" height="640"></section>${process(language)}<section class="l10n-section l10n-reading"><h2>${t('configuration', language)}</h2><p>${t('commercial', language)}</p><p>${t('traceability', language)}</p></section>${cta(language)}</main>`;
  return layout({ language, route: record.route, title, description: t('aboutIntro', language), active: 'about', body, image: record.image });
}
function aboutPage(language, record) {
  const title = `GloryStarPack · ${t('about', language)}`;
  const body = `<main id="main-content">${breadcrumb(language, record.route, title)}<section class="l10n-page-hero"><div><span class="l10n-eyebrow">Xiamen · China</span><h1>${escapeHtml(title)}</h1><p>${t('aboutIntro', language)}</p><a class="l10n-button" href="${indexLinks(language).contact}">${t('contact', language)}</a></div><img src="${record.image}" alt="GloryStarPack" width="960" height="640"></section>${process(language)}<section class="l10n-section l10n-reading"><h2>${t('configuration', language)}</h2><p>${t('commercial', language)}</p><p>${t('traceability', language)}</p></section>${cta(language)}</main>`;
  return layout({ language, route: record.route, title, description: t('aboutIntro', language), active: 'about', body, image: record.image, type: 'AboutPage' });
}
function contactPage(language, record) {
  const title = `${t('contact', language)} · GloryStarPack`;
  const input = (key, type = 'text', required = false) => `<label>${t(key, language)}${required ? ' *' : ''}<input name="${key}" type="${type}" maxlength="${key === 'email' ? 254 : 180}"${required ? ' required' : ''}></label>`;
  const body = `<main id="main-content">${breadcrumb(language, record.route, title)}<section class="l10n-contact"><div class="l10n-contact-copy"><span class="l10n-eyebrow">${t('inquiry', language)}</span><h1>${t('start', language)}</h1><p>${t('startCopy', language)}</p><a href="mailto:kevin@glorystarpack.com">kevin@glorystarpack.com</a><a href="https://wa.me/8619577608248">WhatsApp +86 195-7760-8248</a><span>${t('location', language)}</span></div><form id="localized-rfq" data-language="${language}" data-sending="${escapeHtml(t('sending', language))}" data-sent="${escapeHtml(t('sent', language))}" data-error="${escapeHtml(t('sendError', language))}"><h2>${t('inquiry', language)}</h2><div class="l10n-form-grid">${input('name','text',true)}${input('company')}${input('email','email',true)}${input('country','text',true)}${input('product','text',true)}${input('quantity','text',true)}${input('capacity')}${input('closure')}${input('decoration')}<label class="is-wide">${t('notes', language)}<textarea name="notes" maxlength="2000"></textarea></label></div><input name="website" tabindex="-1" autocomplete="off" class="l10n-honeypot"><input name="startedAt" type="hidden"><p>${t('required', language)}</p><button class="l10n-button" type="submit">${t('send', language)}</button><p id="localized-rfq-status" role="status" aria-live="polite"></p></form></section></main><script src="/assets/js/localized-contact.js?v=20260903-1" defer></script>`;
  return layout({ language, route: record.route, title, description: t('startCopy', language), active: 'contact', body, image: record.image, type: 'ContactPage' });
}
function catalogPage(language, record) {
  const title = t('catalog', language);
  const filters = Object.entries(categories).map(([slug, [filter, , titles]]) => ({ filter, title: titles[localeIndex(language)], route: `/products/${slug}/` }));
  const unique = [...new Map(filters.map(item => [item.filter, item])).values()];
  const body = `<main id="main-content">${breadcrumb(language, record.route, title)}<section class="l10n-hub-hero"><span class="l10n-eyebrow">GloryStarPack</span><h1>${title}</h1><p>${t('catalogIntro', language)}</p></section><section class="l10n-catalog" data-language="${language}" data-count-label="${t('count', language)}" data-no-results="${t('noResults', language)}" data-view="${t('view', language)}" data-quote="${t('quote', language)}" data-material="${t('material', language)}" data-capacity="${t('capacity', language)}" data-finish="${t('finish', language)}" data-moq="${t('moq', language)}" data-intro="${t('productIntro', language)}" data-check="${t('productCheck', language)}" data-previous="${t('previous', language)}" data-next="${t('next', language)}"><form class="l10n-catalog-tools" role="search"><label>${t('search', language)}<input id="localized-product-search" type="search" autocomplete="off"></label><label>${t('filter', language)}<select id="localized-product-filter"><option value="">${t('all', language)}</option>${unique.map(item => `<option value="${item.filter}">${escapeHtml(item.title)}</option>`).join('')}</select></label><button type="button" id="localized-product-clear">${t('clear', language)}</button></form><p id="localized-product-count" role="status">${t('loading', language)}</p><div id="localized-product-detail"></div><div class="l10n-grid" id="localized-product-grid" aria-live="polite"></div><nav class="l10n-pagination" id="localized-product-pagination"></nav></section>${cta(language)}</main><script src="/assets/js/localized-catalog-${language}.js?v=20260903-1" defer></script><script src="/assets/js/localized-catalog.js?v=20260903-1" defer></script>`;
  return layout({ language, route: record.route, title, description: t('catalogIntro', language), active: 'products', body, image: record.image, type: 'CollectionPage' });
}
function siteIndexPage(language, record) {
  const title = t('index', language);
  const group = (heading, records) => `<section><h2>${heading}</h2><ul>${records.map(item => `<li><a href="${localePath(language, item.route)}">${escapeHtml(item.id ? productName(productById.get(item.id), language) : topics[item.slug] ? topicTitle(item, language) : categories[item.slug] ? categories[item.slug][2][localeIndex(language)] : serviceTitles[item.slug] ? serviceTitles[item.slug][localeIndex(language)] : item.route)}</a></li>`).join('')}</ul></section>`;
  const body = `<main id="main-content">${breadcrumb(language, record.route, title)}<section class="l10n-hub-hero"><h1>${title}</h1><p>${t('catalogIntro', language)}</p></section><div class="l10n-index">${group(t('products', language), routeRecords.filter(item => item.route.startsWith('/products/')))}${group(t('guides', language), routeRecords.filter(item => topics[item.slug]))}${group(t('about', language), routeRecords.filter(item => serviceTitles[item.slug] || ['/about/','/contact/'].includes(item.route)))}</div></main>`;
  return layout({ language, route: record.route, title, description: t('catalogIntro', language), body, image: record.image, type: 'CollectionPage' });
}
function render(language, record) {
  if (record.route === '/') return homePage(language);
  if (record.route === '/about/') return aboutPage(language, record);
  if (record.route === '/contact/') return contactPage(language, record);
  if (record.route === '/site-index/') return siteIndexPage(language, record);
  if (record.route === '/products/product-index/') return catalogPage(language, record);
  if (record.id && productById.has(record.id)) return productPage(language, record);
  if (categories[record.slug]) return categoryPage(language, record);
  if (serviceTitles[record.slug]) return servicePage(language, record);
  if (record.route === '/insights/') return hubPage(language, record, 'insights');
  if (record.route === '/cosmetic-packaging-guides/') return hubPage(language, record, 'guides');
  if (record.route === '/glass-bottle-buying-guides/') return hubPage(language, record, 'glass');
  if (topics[record.slug]) return topicPage(language, record);
  // All sitemap routes should be handled; fail rather than publishing English filler.
  throw new Error(`No localized template for ${record.route}`);
}

for (const language of localeCodes) {
  for (const record of routeRecords) {
    const target = path.join(root, language, record.route === '/' ? 'index.html' : `${record.route.slice(1)}index.html`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, render(language, record));
  }
  const compactProducts = products.map(product => ({
    id: product.id, n: productName(product, language), o: product.name, s: localizeSpec(product.size, language),
    m: localizeSpec(product.mat, language), f: localizeSpec(product.finish, language), q: product.moq,
    c: product.cats || [], i: productImage(product), u: productPath(product, language)
  }));
  fs.writeFileSync(path.join(root, 'assets/js', `localized-catalog-${language}.js`), `window.GSP_LOCALIZED_PRODUCTS=${JSON.stringify(compactProducts)};`);
}

const localizedSitemap = localeCodes.flatMap(language => routeRecords.map(record => `  <url>\n    <loc>${localizedUrl(language, record.route)}</loc>\n    <lastmod>2026-09-03</lastmod>\n  </url>`)).join('\n');
let sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const start = '<!-- BEGIN GENERATED LOCALIZED PAGES -->';
const end = '<!-- END GENERATED LOCALIZED PAGES -->';
if (sitemap.includes(start)) sitemap = sitemap.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${localizedSitemap}\n  ${end}`);
else sitemap = sitemap.replace(/\s*<\/urlset>\s*$/, `\n  ${start}\n${localizedSitemap}\n  ${end}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
console.log(`Generated ${localeCodes.length * routeRecords.length} authored localized pages and ${localeCodes.length} localized catalog datasets across ${localeCodes.length} languages.`);
