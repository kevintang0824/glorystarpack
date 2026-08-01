import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const modifiedDate = '2026-08-01';

const selectedProductIds = [
  'p1', 'p2', 'p4', 'p7', 'p18', 'p33', 'p34', 'p39', 'p43', 'p53',
  'p124', 'p131', 'p132', 'p150', 'p151', 'p164', 'p289', 'p293',
  'p294', 'p305', 'p315', 'p329', 'p331', 'p334', 'p335', 'p337',
  'p340', 'p344', 'p350', 'p351', 'p352', 'p363', 'p365', 'p367',
  'p369', 'p371', 'p372', 'p374', 'p380', 'p381', 'p169', 'p170',
  'p172', 'p173', 'p181'
];

const productNameOverrides = new Map([
  ['p2', 'Plastic Airless Pump Bottle'],
  ['p7', 'Glass Serum Dropper Bottle']
]);

const productDataSource = fs.readFileSync(path.join(rootDir, 'assets/js/product-data.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(productDataSource, context);
const allProducts = context.window.GSP_PRODUCTS;
const products = selectedProductIds.map(id => {
  const product = allProducts.find(item => item.id === id);
  if (!product) throw new Error(`Selected product ${id} was not found`);
  return product;
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function escapeXml(value) {
  return escapeHtml(value);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function productSlug(product) {
  return `${slugify(product.name)}-${product.id}`;
}

function productName(product) {
  return productNameOverrides.get(product.id) ?? product.name;
}

function productPath(product) {
  return `/products/${productSlug(product)}/`;
}

function productImage(product) {
  return `/assets/product-photos/${product.id}-0.jpg`;
}

function imageExists(product) {
  return fs.existsSync(path.join(rootDir, productImage(product).slice(1)));
}

function truncateWords(value, maxLength) {
  const clean = String(value).replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const completeSentences = clean.match(/[^.!?]+[.!?]+/g) ?? [];
  let complete = '';
  for (const sentence of completeSentences) {
    if (`${complete}${sentence}`.trim().length > maxLength) break;
    complete = `${complete}${sentence}`.trim();
  }
  if (complete.length >= 110) return complete;
  const stopWords = new Set(['a', 'an', 'and', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
  const parts = clean.slice(0, maxLength + 1).replace(/\s+\S*$/, '').replace(/[,:;.-]+$/, '').split(' ');
  while (parts.length && stopWords.has(parts.at(-1).toLowerCase())) parts.pop();
  const shortened = parts.join(' ');
  return `${shortened}.`;
}

function pageTitle(product) {
  return `${productName(product)} | GloryStarPack`;
}

function metaDescription(product) {
  return truncateWords(`${product.desc} Sizes: ${product.size}. Request samples, specifications and a project quotation.`, 158);
}

const categoryDefinitions = [
  { cat: 'wine-bottle', label: 'Wine Bottles', path: '/products/wine-bottles/' },
  { cat: 'spirit-bottle', label: 'Liquor & Spirit Bottles', path: '/products/liquor-bottles/' },
  { cat: 'beer-bottle', label: 'Beer Bottles', path: '/products/beer-bottles/' },
  { cat: 'glass-perfume', label: 'Perfume Bottles', path: '/products/perfume-bottles/' },
  { cat: 'glass-nail', label: 'Nail Polish Bottles', path: '/products/nail-polish-bottles/' },
  { cat: 'men-grooming', label: "Men's Grooming Packaging", path: '/products/mens-grooming-packaging/' },
  { cat: 'personal-care', label: 'Personal Care Packaging', path: '/products/personal-care-packaging/' },
  { cat: 'plastic-closure', label: 'Cosmetic Pumps & Closures', path: '/products/cosmetic-pumps-closures/' },
  { cat: 'plastic-airless', label: 'Airless Pump Bottles', path: '/products/airless-pump-bottles/' },
  { cat: 'plastic-pump', label: 'Pump Bottles', path: '/products/airless-pump-bottles/' },
  { cat: 'glass-dropper', label: 'Serum Dropper Bottles', path: '/products/serum-dropper-bottles/' },
  { cat: 'glass-oil', label: 'Serum Dropper Bottles', path: '/products/serum-dropper-bottles/' },
  { cat: 'glass-spray', label: 'Glass Cosmetic Bottles', path: '/products/glass-cosmetic-bottles/' },
  { cat: 'glass-jar', label: 'Cream Jars', path: '/products/cream-jars/' },
  { cat: 'food-jar', label: 'Glass Food Jars', path: '/products/glass-packaging/' },
  { cat: 'oil-vinegar-bottle', label: 'Oil & Vinegar Bottles', path: '/products/glass-packaging/' },
  { cat: 'glass-food', label: 'Glass Food Packaging', path: '/products/glass-packaging/' },
  { cat: 'glass', label: 'Glass Packaging', path: '/products/glass-packaging/' },
  { cat: 'plastic', label: 'Plastic Packaging', path: '/products/plastic-packaging/' }
];

function categoryFor(product) {
  return categoryDefinitions.find(definition => product.cats.includes(definition.cat))
    ?? { cat: 'packaging', label: 'Packaging Products', path: '/products/product-index/' };
}

function focusNotes(product) {
  if (product.cats.includes('wine-bottle')) {
    return [
      'Confirm fill volume, bottle shape, glass color and label-panel requirements.',
      'Review cork, BVS or other neck-finish requirements with the filling line.',
      'Approve bottle weight, dimensions, decoration and protective export packing before bulk production.'
    ];
  }
  if (product.cats.includes('spirit-bottle')) {
    return [
      'Define the target capacity, glass weight, base profile and decoration area.',
      'Match the bar-top, screw cap or other closure to the exact neck finish.',
      'Review embossing, coating, label placement and secondary packing with production samples.'
    ];
  }
  if (product.cats.includes('beer-bottle')) {
    return [
      'Specify beverage type, carbonation target, filling temperature and bottle capacity.',
      'Confirm crown, swing-top or screw closure against the exact bottle finish.',
      'Pressure, thermal-process and filling-line suitability require project-specific validation.'
    ];
  }
  if (product.cats.includes('glass-perfume')) {
    return [
      'Match the bottle neck with the atomizer, collar, cap and target spray system.',
      'Confirm fill volume, glass weight, decoration area and fragrance compatibility.',
      'Approve coating, frosting, printing and component fit on production-intent samples.'
    ];
  }
  if (product.cats.includes('glass-nail')) {
    return [
      'Match the bottle with the brush, stem length, wiper, cap thread and target fill.',
      'Check formula compatibility and coating resistance with the intended nail product.',
      'Approve decoration placement and component fit before bulk production.'
    ];
  }
  if (product.cats.includes('glass-dropper') || product.cats.includes('glass-oil')) {
    return [
      'Match pipette length, bulb rebound, reducer and closure seal to the selected bottle.',
      'Share formula viscosity and light-sensitivity requirements before sampling.',
      'Approve dropper fit, dosing, leakage and decoration with the final component set.'
    ];
  }
  if (product.cats.includes('plastic-closure')) {
    return [
      'Match the component to the exact bottle neck finish or approved finish drawing, not diameter alone.',
      'Confirm formula viscosity, target output, actuator or spray pattern, dip-tube length and filling method.',
      'Validate priming, leakage, lock or overcap function and transport handling with the final bottle system.'
    ];
  }
  if (product.cats.includes('plastic-airless') || product.cats.includes('plastic-pump')) {
    return [
      'Share formula viscosity, target dose and filling method before selecting the pump system.',
      'Confirm actuator, overcap, dip tube or airless piston compatibility with the container.',
      'Validate priming, output, leakage and formula contact materials with samples.'
    ];
  }
  if (product.cats.includes('food-jar') || product.cats.includes('glass-food')) {
    return [
      'Define the food or beverage application, fill volume and processing conditions.',
      'Match the lug, screw, pourer or other closure to the exact neck finish.',
      'Confirm liner, sealing, thermal-process and destination-market requirements before production.'
    ];
  }
  return [
    'Confirm the application, capacity, material and component configuration.',
    'Review finish, decoration, closure fit and formula compatibility with samples.',
    'Approve dimensions, packing method and destination requirements before bulk production.'
  ];
}

function relatedProducts(product) {
  const scored = products
    .filter(candidate => candidate.id !== product.id)
    .map(candidate => ({
      candidate,
      score: candidate.cats.filter(cat => product.cats.includes(cat) && cat !== 'hot').length
    }))
    .sort((left, right) => right.score - left.score || Number(left.candidate.id.slice(1)) - Number(right.candidate.id.slice(1)));
  return scored.slice(0, 4).map(item => item.candidate);
}

function resourceLinks(product) {
  const common = [
    {
      path: '/cosmetic-packaging-moq/',
      name: 'Packaging MOQ and Lead Time',
      description: 'Plan samples, order quantity, decoration and production timing.'
    },
    {
      path: '/cosmetic-packaging-sample-approval-checklist/',
      name: 'Sample Approval Checklist',
      description: 'Review fit, leakage, dispensing, decoration and packing before bulk.'
    }
  ];

  if (product.cats.includes('plastic-closure')) {
    return [
      {
        path: '/insights/cosmetic-pump-closure-selection-guide/',
        name: 'Pump and Closure Selection Guide',
        description: 'Match neck finish, output, dip tube, lock style and user experience.'
      },
      {
        path: '/insights/cosmetic-packaging-compatibility-testing-guide/',
        name: 'Packaging Compatibility Testing',
        description: 'Plan formula, leakage, dispensing, decoration and transport checks.'
      },
      {
        path: '/products/cosmetic-pumps-closures/',
        name: 'Cosmetic Pumps and Closures',
        description: 'Compare lotion pumps, fine mist sprayers, foam pumps, droppers and caps.'
      },
      {
        path: '/cosmetic-packaging-sample-approval-checklist/',
        name: 'Sample Approval Checklist',
        description: 'Freeze the approved component, test record, decoration and packing route.'
      }
    ];
  }

  if (product.cats.some(cat => ['wine-bottle', 'spirit-bottle', 'beer-bottle'].includes(cat))) {
    return [
      {
        path: '/glass-bottle-buying-guides/',
        name: 'Glass Bottle Buying Guides',
        description: 'Plan MOQ, stock vs custom molds, closures, sampling and bulk approval.'
      },
      {
        path: '/insights/glass-bottle-neck-finish-closure-guide/',
        name: 'Neck Finish and Closure Guide',
        description: 'Match corks, caps, liners and sealing systems to the exact bottle finish.'
      },
      {
        path: '/insights/custom-glass-bottle-moq-stock-vs-custom-mold/',
        name: 'Custom Glass Bottle MOQ',
        description: 'Compare stock bottles, custom decoration and new mold development.'
      },
      {
        path: '/insights/glass-bottle-sample-approval-qc-checklist/',
        name: 'Glass Bottle Sample Checklist',
        description: 'Approve dimensions, capacity, closure fit, decoration and export packing.'
      }
    ];
  }

  if (product.cats.some(cat => ['glass-dropper', 'glass-oil', 'plastic-airless', 'plastic-pump'].includes(cat))) {
    return [
      {
        path: '/serum-packaging-guide/',
        name: 'Serum Packaging Guide',
        description: 'Compare dropper, airless and protective packaging routes for serum formulas.'
      },
      {
        path: '/airless-bottle-vs-dropper-bottle/',
        name: 'Airless Bottle vs Dropper',
        description: 'Choose a dispensing format by formula, user experience and sampling needs.'
      },
      ...common
    ];
  }

  if (product.cats.some(cat => ['glass-perfume', 'glass-nail', 'glass-jar', 'personal-care', 'men-grooming'].includes(cat))) {
    return [
      {
        path: '/glass-vs-plastic-cosmetic-packaging/',
        name: 'Glass vs Plastic Packaging',
        description: 'Compare material feel, breakage risk, freight and formula considerations.'
      },
      {
        path: '/cosmetic-logo-printing-methods/',
        name: 'Logo and Decoration Methods',
        description: 'Review silk screen, hot stamping, coating, frosting and label routes.'
      },
      ...common
    ];
  }

  return [
    {
      path: '/custom-cosmetic-packaging/',
      name: 'Custom Packaging Process',
      description: 'Understand molds, closures, decoration, component matching and export packing.'
    },
    {
      path: '/about/',
      name: 'About GloryStarPack',
      description: 'Review company identity, project scope and B2B sourcing boundaries.'
    },
    ...common
  ];
}

function jsonLd(product, category, canonical, description) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: pageTitle(product),
        description,
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#organization` },
        mainEntity: { '@id': `${canonical}#product` },
        breadcrumb: { '@id': `${canonical}#breadcrumbs` },
        dateModified: modifiedDate
      },
      {
        '@type': 'Product',
        '@id': `${canonical}#product`,
        name: productName(product),
        description,
        url: canonical,
        image: `${siteUrl}${productImage(product)}`,
        sku: product.id,
        category: category.label,
        material: product.mat,
        brand: {
          '@type': 'Brand',
          name: 'GloryStarPack'
        },
        manufacturer: {
          '@id': `${siteUrl}/#organization`
        },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Capacity / Size', value: product.size },
          { '@type': 'PropertyValue', name: 'Finish', value: product.finish },
          { '@type': 'PropertyValue', name: product.badge === 'custom' ? 'Planning MOQ' : 'MOQ', value: `${product.moq} pcs; confirm by project` }
        ]
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: category.label, item: `${siteUrl}${category.path}` },
          { '@type': 'ListItem', position: 3, name: productName(product), item: canonical }
        ]
      }
    ]
  }).replace(/</g, '\\u003c');
}

function headerMarkup() {
  return `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="GloryStarPack home"><img src="/assets/brand/glorystarpack-logo-mark-96-2026.png" width="40" height="40" alt="" decoding="async">GloryStarPack</a>
    <nav class="site-nav" aria-label="Primary navigation"><a href="/products/product-index/">Product Index</a><a href="/products/glass-packaging/">Glass Packaging</a><a href="/products/beverage-bottles/">Beverage Bottles</a><a href="/insights/">Insights</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav>
  </div>
</header>`;
}

function footerMarkup() {
  return `<footer class="site-footer"><div class="wrap"><span>GloryStarPack · Xiamen, Fujian, China · Updated ${modifiedDate}</span><span><a href="/insights/">Insights</a> · <a href="/about/">About</a> · <a href="/contact/">Contact</a> · <a href="/products/product-index/">Product Index</a></span></div></footer>`;
}

function productPage(product) {
  const category = categoryFor(product);
  const canonical = `${siteUrl}${productPath(product)}`;
  const title = pageTitle(product);
  const description = metaDescription(product);
  const notes = focusNotes(product);
  const related = relatedProducts(product);
  const resources = resourceLinks(product);
  const name = productName(product);
  const quoteText = encodeURIComponent(`Hello GloryStarPack, I need a quotation for ${name} (${product.id}).\n\nApplication / formula:\nCapacity:\nClosure or component:\nFinish / decoration:\nEstimated quantity:\nDestination country:`);
  const sampleText = encodeURIComponent(`Hello GloryStarPack, I would like to request samples for ${name} (${product.id}).\n\nCapacity:\nClosure or component:\nFinish:\nDestination country:`);
  const planningLabel = product.badge === 'custom' ? 'Planning MOQ' : 'MOQ';

  const relatedMarkup = related.map(item => `<a class="related-card" href="${productPath(item)}"><img src="${productImage(item)}" width="1254" height="1254" loading="lazy" decoding="async" alt="${escapeHtml(productName(item))} product view"><div><strong>${escapeHtml(productName(item))}</strong><span>${escapeHtml(item.size)} · ${escapeHtml(item.mat)}</span></div></a>`).join('');
  const resourceMarkup = resources.map(item => `<a class="resource-card" href="${item.path}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.description)}</span></a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <link rel="preload" as="image" href="${productImage(product)}">
  <link rel="stylesheet" href="/assets/css/product-page.css">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="GloryStarPack">
  <meta property="og:image" content="${siteUrl}${productImage(product)}">
  <meta property="og:image:alt" content="${escapeHtml(name)} product view">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${siteUrl}${productImage(product)}">
  <script type="application/ld+json">${jsonLd(product, category, canonical, description)}</script>
</head>
<body>
${headerMarkup()}
<div class="wrap breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${category.path}">${escapeHtml(category.label)}</a> / <span>${escapeHtml(name)}</span></div>
<main>
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <div class="eyebrow">${escapeHtml(category.label)} · Product ${escapeHtml(product.id.toUpperCase())}</div>
        <h1>${escapeHtml(name)}</h1>
        <p class="lead">${escapeHtml(product.desc)}</p>
        <div class="hero-facts">
          <div class="fact"><strong>${escapeHtml(product.size)}</strong><span>Capacity / size options</span></div>
          <div class="fact"><strong>${escapeHtml(product.mat)}</strong><span>Primary material</span></div>
          <div class="fact"><strong>${escapeHtml(product.moq)} pcs</strong><span>${planningLabel}; confirm by project</span></div>
        </div>
        <div class="actions"><a class="btn" href="https://wa.me/8619577608248?text=${quoteText}" target="_blank" rel="noopener">Request Project Quote</a><a class="btn alt" href="https://wa.me/8619577608248?text=${sampleText}" target="_blank" rel="noopener">Request Samples</a></div>
      </div>
      <div class="hero-media"><img src="${productImage(product)}" width="1254" height="1254" fetchpriority="high" decoding="async" alt="${escapeHtml(name)} packaging product"></div>
    </div>
  </section>
  <div class="wrap main">
    <section class="two-col">
      <article class="card">
        <div class="eyebrow">Product planning summary</div>
        <h2>Configuration and intended use</h2>
        <p>${escapeHtml(product.tab)}</p>
        <h3>Checks before sampling</h3>
        <ul>${notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
      </article>
      <aside class="card">
        <h2>Product specifications</h2>
        <table class="spec-table">
          <tbody>
            <tr><th scope="row">Product ID</th><td>${escapeHtml(product.id.toUpperCase())}</td></tr>
            <tr><th scope="row">Material</th><td>${escapeHtml(product.mat)}</td></tr>
            <tr><th scope="row">Capacity / size</th><td>${escapeHtml(product.size)}</td></tr>
            <tr><th scope="row">Finish</th><td>${escapeHtml(product.finish)}</td></tr>
            <tr><th scope="row">${planningLabel}</th><td>${escapeHtml(product.moq)} pcs; final quantity depends on configuration and decoration</td></tr>
            <tr><th scope="row">Samples</th><td>Availability and timing confirmed after the exact model and component set are selected</td></tr>
          </tbody>
        </table>
      </aside>
    </section>
    <section class="section rfq" aria-labelledby="rfq-title">
      <div><div class="eyebrow">Build a useful RFQ</div><h2 id="rfq-title">Confirm the exact packaging route</h2><p>Share enough project context for the bottle, closure, decoration and packing requirements to be reviewed together.</p><div class="rfq-list"><span>Application or formula</span><span>Capacity</span><span>Closure or component</span><span>Decoration</span><span>Quantity</span><span>Destination</span></div></div>
      <div class="actions"><a class="btn" href="https://wa.me/8619577608248?text=${quoteText}" target="_blank" rel="noopener">Send RFQ on WhatsApp</a><a class="btn alt" href="mailto:kevin@glorystarpack.com?subject=${encodeURIComponent(`RFQ: ${name} (${product.id})`)}">Send RFQ by Email</a></div>
    </section>
    <section class="section">
      <div class="eyebrow">Continue comparing</div>
      <h2>Related packaging products</h2>
      <div class="related-grid">${relatedMarkup}</div>
    </section>
    <section class="section">
      <div class="eyebrow">Make a better sourcing decision</div>
      <h2>Packaging buyer resources</h2>
      <div class="resource-grid">${resourceMarkup}</div>
    </section>
  </div>
</main>
${footerMarkup()}
</body>
</html>
`;
}

function productIndexPage() {
  const grouped = new Map();
  for (const product of products) {
    const category = categoryFor(product);
    if (!grouped.has(category.label)) grouped.set(category.label, { category, items: [] });
    grouped.get(category.label).items.push(product);
  }
  const itemList = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: productName(product),
    url: `${siteUrl}${productPath(product)}`
  }));
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/products/product-index/#webpage`,
        url: `${siteUrl}/products/product-index/`,
        name: 'Packaging Product Index',
        description: 'Browse indexable GloryStarPack product pages for glass bottles, cosmetic packaging, beverage bottles, jars, airless pumps and related packaging.',
        dateModified: modifiedDate,
        provider: { '@id': `${siteUrl}/#organization` }
      },
      {
        '@type': 'ItemList',
        '@id': `${siteUrl}/products/product-index/#products`,
        numberOfItems: products.length,
        itemListElement: itemList
      }
    ]
  }).replace(/</g, '\\u003c');
  const groupsMarkup = [...grouped.values()].map(({ category, items }) => `<section class="index-group"><div class="eyebrow">${escapeHtml(category.label)}</div><h2><a href="${category.path}">${escapeHtml(category.label)}</a></h2><div class="index-grid">${items.map(product => `<a class="index-card" href="${productPath(product)}"><img src="${productImage(product)}" width="1254" height="1254" loading="lazy" decoding="async" alt="${escapeHtml(productName(product))} product view"><div><strong>${escapeHtml(productName(product))}</strong><span>${escapeHtml(product.size)} · ${escapeHtml(product.mat)}</span></div></a>`).join('')}</div></section>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Packaging Product Index | GloryStarPack</title>
  <meta name="description" content="Browse GloryStarPack product pages for glass bottles, cosmetic packaging, beverage bottles, jars, airless pumps and related custom packaging projects.">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${siteUrl}/products/product-index/">
  <link rel="alternate" hreflang="en" href="${siteUrl}/products/product-index/">
  <link rel="alternate" hreflang="x-default" href="${siteUrl}/products/product-index/">
  <link rel="stylesheet" href="/assets/css/product-page.css">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Packaging Product Index | GloryStarPack">
  <meta property="og:description" content="Browse indexable product pages for glass, cosmetic and beverage packaging projects.">
  <meta property="og:url" content="${siteUrl}/products/product-index/">
  <meta property="og:site_name" content="GloryStarPack">
  <meta property="og:image" content="${siteUrl}/assets/brand/glass-complete-product-assortment-2026.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
${headerMarkup()}
<main class="wrap">
  <section class="index-hero"><div class="eyebrow">Crawlable product catalog</div><h1>Packaging Product Index</h1><p>Browse ${products.length} priority product pages with stable URLs, product specifications, sampling considerations and direct links to related packaging categories. Additional catalog products will be published after their specifications and page content are reviewed.</p></section>
  ${groupsMarkup}
</main>
${footerMarkup()}
</body>
</html>
`;
}

function updateGeneratedBlock(filePath, startMarker, endMarker, content, closingPattern = /\s*<\/urlset>\s*$/, insertion = '\n  ') {
  const source = fs.readFileSync(filePath, 'utf8');
  const block = `${startMarker}\n${content}\n${endMarker}`;
  const markerPattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const updated = markerPattern.test(source)
    ? source.replace(markerPattern, block)
    : source.replace(closingPattern, `${insertion}${block}$&`);
  fs.writeFileSync(filePath, updated);
}

for (const product of products) {
  if (!imageExists(product)) throw new Error(`Missing product image for ${product.id}: ${productImage(product)}`);
  const outputDir = path.join(rootDir, 'products', productSlug(product));
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), productPage(product));
}

const indexDir = path.join(rootDir, 'products', 'product-index');
fs.mkdirSync(indexDir, { recursive: true });
fs.writeFileSync(path.join(indexDir, 'index.html'), productIndexPage());

const sitemapEntries = [
  `  <url>
    <loc>${siteUrl}/products/product-index/</loc>
    <lastmod>${modifiedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.82</priority>
  </url>`,
  ...products.map(product => `  <url>
    <loc>${siteUrl}${productPath(product)}</loc>
    <lastmod>${modifiedDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.72</priority>
  </url>`)
].join('\n');

const imageEntries = products.map(product => `  <url>
    <loc>${siteUrl}${productPath(product)}</loc>
    <image:image>
      <image:loc>${siteUrl}${productImage(product)}</image:loc>
      <image:title>${escapeXml(productName(product))}</image:title>
      <image:caption>${escapeXml(product.desc)}</image:caption>
    </image:image>
  </url>`).join('\n');

const llmsEntries = [
  '## Priority Individual Product Pages',
  '',
  ...products.map(product => `- ${productName(product)}: ${siteUrl}${productPath(product)}`)
].join('\n');

updateGeneratedBlock(
  path.join(rootDir, 'sitemap.xml'),
  '<!-- BEGIN GENERATED PRODUCT PAGES -->',
  '<!-- END GENERATED PRODUCT PAGES -->',
  sitemapEntries
);
updateGeneratedBlock(
  path.join(rootDir, 'image-sitemap.xml'),
  '<!-- BEGIN GENERATED PRODUCT IMAGES -->',
  '<!-- END GENERATED PRODUCT IMAGES -->',
  imageEntries
);
updateGeneratedBlock(
  path.join(rootDir, 'llms.txt'),
  '<!-- BEGIN GENERATED PRODUCT LINKS -->',
  '<!-- END GENERATED PRODUCT LINKS -->',
  llmsEntries,
  /\s*$/,
  '\n\n'
);

console.log(`Generated ${products.length} product pages and 1 product index page.`);
