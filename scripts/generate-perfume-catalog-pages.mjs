import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { perfumeCatalogPages as pages, perfumeCatalogMoq as moq, perfumeCatalogModifiedDate as date } from '../data/perfume-catalog-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.glorystarpack.com';
const template = fs.readFileSync(path.join(root, 'products/frosted-glass-perfume-bottle-with-pump-p4/index.html'), 'utf8');
const categoryFile = path.join(root, 'products/perfume-bottles/index.html');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const image = page => `<img src="${page.image}" width="600" height="600" loading="lazy" decoding="async" alt="${escape(page.imageAlt)}">`;

function message(page, model, intent = 'quote') {
  const selection = model ? `${model.code} ${model.capacity}` : page.models.map(item => `${item.code} ${item.capacity}`).join(' / ');
  const quantityPrompt = intent === 'sample' ? 'Sample quantity / requirements:' : `Quantity (MOQ ${moq.toLocaleString('en-US')} pcs per model):`;
  return `Hello GloryStarPack, I would like ${intent === 'sample' ? 'samples of' : 'a quotation for'} your ${selection} glass perfume bottles.\n\nModel / capacity: ${selection}\n${quantityPrompt}\nPump and cap requirements:\nDecoration:\nDestination country:\nTarget date:\n\nWebsite page: ${site}${page.route}`;
}

function whatsapp(page, label, model, intent = 'quote', location = 'hero', alt = false) {
  return `<a class="btn${alt ? ' alt' : ''}" data-inquiry-channel="whatsapp" data-inquiry-type="${intent}" data-inquiry-location="${location}" href="https://wa.me/8619577608248?text=${encodeURIComponent(message(page, model, intent))}" target="_blank" rel="noopener">${escape(label)}</a>`;
}

function metadata(page) {
  const canonical = site + page.route;
  const sourceGraph = JSON.parse(template.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const common = sourceGraph.filter(node => ['Organization', 'WebSite'].includes(node['@type']));
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: page.title, description: page.description, inLanguage: 'en', dateModified: date,
      isPartOf: { '@id': site + '/#website' }, about: { '@id': site + '/#organization' }, mainEntity: { '@id': canonical + '#service' },
      primaryImageOfPage: site + page.image, breadcrumb: { '@id': canonical + '#breadcrumbs' } },
    { '@type': 'Service', '@id': canonical + '#service', name: page.heading + ' Supply', description: page.description, url: canonical, image: site + page.image,
      provider: { '@id': site + '/#organization' }, areaServed: 'Worldwide', serviceType: 'B2B glass perfume bottle supply and component matching',
      audience: { '@type': 'BusinessAudience', audienceType: 'Fragrance brands and packaging buyers' },
      serviceOutput: { '@type': 'Thing', name: page.heading, identifier: page.models.map(item => item.code).join(' / '),
        description: `${page.neck}; MOQ ${moq} bottles per model. Lead time and matched components confirmed with the quotation.` } },
    { '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumbs', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site + '/' },
      { '@type': 'ListItem', position: 2, name: 'Perfume Bottles', item: site + '/products/perfume-bottles/' },
      { '@type': 'ListItem', position: 3, name: page.heading, item: canonical }
    ] }, ...common
  ] }).replace(/</g, '\\u003c');
}

function pageHtml(page) {
  const canonical = site + page.route;
  let head = template.match(/<head>([\s\S]*?)<\/head>/)[1];
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}">`)
    .replace(/<link\b[^>]*hreflang="[^"]+"[^>]*>\s*/g, '')
    .replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/, `<link rel="preload" as="image" href="${page.image}" type="image/avif" fetchpriority="high">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${metadata(page)}</script>`);
  for (const [attribute, key, value] of [
    ['name', 'description', page.description], ['property', 'og:title', page.title], ['property', 'og:description', page.description],
    ['property', 'og:url', canonical], ['property', 'og:image', site + page.image], ['property', 'og:image:alt', page.imageAlt],
    ['name', 'twitter:title', page.title], ['name', 'twitter:description', page.description], ['name', 'twitter:image', site + page.image]
  ]) head = head.replace(new RegExp(`<meta ${attribute}="${key}"[^>]*>`), `<meta ${attribute}="${key}" content="${escape(value)}">`);
  head += `\n<link rel="stylesheet" href="/assets/css/perfume-catalog.css?v=20261013">\n<link rel="alternate" hreflang="en" href="${canonical}">\n<link rel="alternate" hreflang="x-default" href="${canonical}">\n`;
  // New commercial pages start in English; language links lead to the existing localized category.
  const header = template.match(/<header\b[\s\S]*?<\/header>/)[0].replace(/href="\/(fr\/|es\/|pt\/|ru\/|zh-CN\/)?products\/frosted-glass-perfume-bottle-with-pump-p4\/"/g, (_, locale = '') => `href="${locale ? `/${locale}products/perfume-bottles/` : page.route}"`);
  const footer = template.match(/<footer\b[\s\S]*?<\/footer>/)[0].replace(/Page reviewed \d{4}-\d{2}-\d{2}/g, `Page reviewed ${date}`);
  const other = pages.find(item => item.route !== page.route);
  const rows = page.models.map(model => `<tr><th scope="row">${model.code}</th><td>${model.capacity}</td><td>${page.neck}</td><td>${model.weight}</td><td>${model.dimensions}</td><td>1,000 pcs</td><td>${whatsapp(page, `Quote ${model.code}`, model, 'quote', 'model-table')}</td></tr>`).join('');
  const resources = [
    ['/insights/glass-bottle-neck-finish-closure-guide/', 'Bottle and closure matching'],
    ['/insights/custom-glass-bottle-moq-stock-vs-custom-mold/', 'Stock vs custom glass bottle MOQ'],
    ['/insights/perfume-bottle-sourcing-small-brands/', 'Perfume bottle sourcing for small brands'],
    ['/products/perfume-crimp-pump-and-collar-set-p181/', 'Perfume pump and collar selection']
  ];
  const email = `mailto:kevin@glorystarpack.com?subject=${encodeURIComponent('Perfume bottle RFQ: ' + page.models.map(item => item.code).join('/'))}&amp;body=${encodeURIComponent(message(page))}`;
  return `<!DOCTYPE html>\n<html lang="en">\n<head>${head}</head>\n<body>\n${header}
<nav class="gsp-breadcrumbs" id="breadcrumbs" aria-label="Breadcrumb"><div class="gsp-breadcrumbs-inner"><a href="/">Home</a><span class="gsp-breadcrumb-separator" aria-hidden="true">/</span><a href="/products/perfume-bottles/">Perfume Bottles</a><span class="gsp-breadcrumb-separator" aria-hidden="true">/</span><span aria-current="page">${escape(page.heading)}</span></div></nav>
<div class="gsp-main-anchor" id="main-content" tabindex="-1"></div>
<main>
  <section class="hero"><div class="wrap hero-grid"><div><div class="eyebrow">Glass perfume bottles · ${page.models.map(item => item.code).join(' / ')}</div><h1>${escape(page.heading)}</h1><p class="lead">${escape(page.lead)}</p>
    <div class="hero-facts"><div class="fact"><strong>${page.models.map(item => item.capacity).join(' / ')}</strong><span>Listed capacities</span></div><div class="fact"><strong>${page.neck}</strong><span>Confirm the exact finish drawing</span></div><div class="fact"><strong>1,000 pcs</strong><span>MOQ per model</span></div></div>
    <div class="actions">${whatsapp(page, 'Request a Quote')}${whatsapp(page, 'Request Samples', undefined, 'sample', 'hero', true)}</div></div>
    <div class="hero-media"><img src="${page.image}" width="600" height="600" fetchpriority="high" decoding="async" alt="${escape(page.imageAlt)}"></div></div></section>
  <div class="wrap main">
    <section class="section"><div class="eyebrow">Choose your model</div><h2>Bottle specifications and minimum order</h2><p>Choose the model and capacity before confirming the pump, cap, decoration and delivery plan. The minimum order below applies to each bottle model.</p>
      <div class="catalog-models" role="region" aria-label="Bottle model comparison" tabindex="0"><table><caption>Published bottle specifications</caption><thead><tr><th scope="col">Model</th><th scope="col">Capacity</th><th scope="col">Neck</th><th scope="col">Bottle weight</th><th scope="col">Listed dimensions (mm)</th><th scope="col">MOQ</th><th scope="col">Get a quote</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="catalog-note">Dimensions are listed in the catalog's original order. Request the current production drawing to confirm measurement order, tolerances and the completed assembly. Packing quantities and gross weights are confirmed for the approved export pack.</p>
    </section>
    <section class="two-col"><article class="card"><h2>${escape(page.useHeading)}</h2><p>${escape(page.useCopy)}</p></article><article class="card"><h2>Match the bottle, sprayer and cap</h2><p>${escape(page.fitCopy)}</p><p>Specify the required cap shape, surface finish and color when requesting samples. Approve the bottle and dispensing components together with the intended fragrance.</p></article></section>
    <section class="section"><h2>MOQ, samples and production timing</h2><p>The minimum order is 1,000 bottles per model. Include your chosen pump, cap and decoration in the inquiry so the quotation identifies exactly what is included. Bottle availability, sample arrangements, decoration options, lead time and shipping are confirmed for the selected configuration and destination.</p><p>For a complete quote, send the model, capacity, quantity per model, desired decoration, pump and cap requirements, destination country and target delivery date. If the component set is undecided, ask for a matching sample proposal before approving the final specification.</p></section>
    <section class="section rfq"><div><div class="eyebrow">Start with a model</div><h2>Request a bottle and component quotation</h2><p>Send your preferred model, quantity, destination and component requirements to request pricing or samples.</p></div><div class="actions">${whatsapp(page, 'Send RFQ on WhatsApp', undefined, 'quote', 'rfq')}<a class="btn alt" data-inquiry-channel="email" data-inquiry-type="quote" data-inquiry-location="rfq" href="${email}">Send RFQ by Email</a></div></section>
    <section class="section"><h2>Compare another perfume bottle route</h2><p>${escape(page.compareCopy)}</p><div class="catalog-feature-grid"><a class="catalog-feature" href="${other.route}">${image(other)}<div><strong>${escape(other.heading)}</strong><span>${other.neck} · 1,000 pcs per model</span></div></a><a class="resource-card" href="/products/perfume-bottles/"><strong>Browse perfume bottle shapes and capacities</strong><span>Compare fragrance packaging formats and component options.</span></a></div></section>
    <section class="section"><h2>Plan the sampling review</h2><div class="resource-grid">${resources.map(([href, label]) => `<a class="resource-card" href="${href}"><strong>${label}</strong><span>Review the relevant bottle, component and purchasing requirements.</span></a>`).join('')}</div></section>
  </div>
</main>\n${footer}\n<script src="/assets/js/inquiry-conversion.js?v=20260919-3" defer></script>\n</body>\n</html>\n`;
}

for (const page of pages) {
  const directory = path.join(root, page.route.slice(1));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), pageHtml(page));
}

let category = fs.readFileSync(categoryFile, 'utf8');
const cards = pages.map(page => `<a class="catalog-feature" href="${page.route}">${image(page)}<div><strong>${escape(page.heading)}</strong><span>${page.models.map(item => item.code).join(' / ')} · ${page.neck} · 1,000 pcs per model</span></div></a>`).join('');
const feature = `<!-- perfume-catalog-models:start --><section class="wrap section" id="perfume-catalog-models"><div class="eyebrow">Models with published specifications</div><h2>Compare screw-neck and crimp-neck perfume bottles</h2><p>Choose a 30ml, 50ml or 100ml bottle from the B737/B738/B739 screw-neck family, or compare the B573 50ml crimp-neck bottle. MOQ is 1,000 pcs per model.</p><div class="catalog-feature-grid">${cards}</div><p><a href="https://glorystarpack.bdxsp.com/table/" target="_blank" rel="noopener">Browse the full perfume packaging catalog</a></p></section><!-- perfume-catalog-models:end -->`;
category = /<!-- perfume-catalog-models:start -->[\s\S]*?<!-- perfume-catalog-models:end -->/.test(category)
  ? category.replace(/<!-- perfume-catalog-models:start -->[\s\S]*?<!-- perfume-catalog-models:end -->/, feature)
  : category.replace(/<section\b[^>]*aria-labelledby="imported-fragrance-catalog-title"[^>]*>/, `${feature}\n$&`);
if (!category.includes('<!-- perfume-catalog-models:start -->')) throw new Error('The perfume category has no catalog insertion point.');
category = category.replace('href="/products/product-index/">Browse Perfume Bottles', 'href="#perfume-catalog-models">Browse Perfume Bottles');
category = category.replace('Many stock glass perfume bottle projects start from 500-1,000 pcs. Selected shapes, custom caps and complex decoration may require higher quantities.', 'B737, B738, B739 and B573 start from 1,000 pcs per model. Confirm the quantity for other bottle shapes, custom caps and decoration in your quotation.')
  .replace(/("dateModified"\s*:\s*")\d{4}-\d{2}-\d{2}/g, `$1${date}`)
  .replace(/Page reviewed \d{4}-\d{2}-\d{2}/g, `Page reviewed ${date}`);
if (!category.includes('/assets/css/perfume-catalog.css')) category = category.replace('</head>', '<link rel="stylesheet" href="/assets/css/perfume-catalog.css?v=20261013">\n</head>');
fs.writeFileSync(categoryFile, category);

const sitemapFile = path.join(root, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapFile, 'utf8');
for (const page of pages) {
  const url = site + page.route;
  const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.76</priority>\n  </url>\n`;
  const pattern = new RegExp(`\\s*<url>\\s*<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>[\\s\\S]*?<\\/url>`);
  sitemap = sitemap.replace(pattern, '').replace('</urlset>', entry + '</urlset>');
}
sitemap = sitemap.replace(/(<loc>https:\/\/www\.glorystarpack\.com\/products\/perfume-bottles\/<\/loc>\s*<lastmod>)\d{4}-\d{2}-\d{2}/, `$1${date}`);
fs.writeFileSync(sitemapFile, sitemap);

const imageSitemapFile = path.join(root, 'image-sitemap.xml');
let imageSitemap = fs.readFileSync(imageSitemapFile, 'utf8');
for (const page of pages) {
  const url = site + page.route;
  const pattern = new RegExp(`\\s*<url>\\s*<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>[\\s\\S]*?<\\/url>`);
  imageSitemap = imageSitemap.replace(pattern, '').replace('</urlset>', `  <url>\n    <loc>${url}</loc>\n    <image:image><image:loc>${site}${page.image}</image:loc><image:title>${escape(page.heading)}</image:title></image:image>\n  </url>\n</urlset>`);
}
fs.writeFileSync(imageSitemapFile, imageSitemap);
console.log('Generated 2 English perfume catalog product pages and updated the perfume category and discovery files.');
