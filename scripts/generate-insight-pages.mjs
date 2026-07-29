import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const modifiedDate = '2026-07-29';

const insightDefinitions = {
  '1': {
    slug: 'personal-care-grooming-packaging-catalog-update',
    seoTitle: 'Personal Care Packaging Catalog Update | GloryStarPack',
    questions: [
      'Which formulas and capacities belong in the same bottle family?',
      'Can pumps, caps, sticks, tins and gift-box components share one finish direction?',
      'Which items need individual samples before a coordinated set is approved?'
    ],
    note: 'Catalog breadth only helps when the exact product, component and decoration combination is confirmed. Treat each online option as a sourcing direction until its sample and specification are approved.',
    resources: [
      ['/products/personal-care-packaging/', 'Personal Care Packaging'],
      ['/products/mens-grooming-packaging/', "Men's Grooming Packaging"],
      ['/products/product-index/', 'Individual Product Index']
    ]
  },
  '2': {
    slug: 'refill-pouches-reusable-bottles',
    seoTitle: 'Refill Pouches and Reusable Bottles | GloryStarPack',
    questions: [
      'Does the pouch volume match the reusable bottle without awkward leftover product?',
      'Is the spout position and cap diameter suitable for the formula viscosity?',
      'How will pouch leakage, carton packing and the consumer refill action be tested?'
    ],
    note: 'A refill pouch and a reusable bottle should be reviewed as one dispensing system. Material reduction alone does not resolve fit, leakage, user handling or destination-market requirements.',
    resources: [
      ['/products/refill-pouch-packaging/', 'Refill Pouch Packaging'],
      ['/products/refill-packaging/', 'Refill Packaging Systems'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample Approval Checklist']
    ]
  },
  '3': {
    slug: 'cosmetic-packaging-rfq-guide',
    seoTitle: 'How to Prepare a Packaging RFQ | GloryStarPack',
    questions: [
      'What will the package hold, and does the formula create compatibility or barrier requirements?',
      'Which capacity, material, closure, decoration and order quantity should be quoted?',
      'What destination, launch timing, target price context and reference files can be shared?'
    ],
    note: 'A useful RFQ does not need to be long. It needs enough project context to distinguish a stock sample request from a decorated, custom-mold or complete packaging-system quotation.',
    resources: [
      ['/contact/', 'Build a Structured RFQ'],
      ['/cosmetic-packaging-moq/', 'MOQ and Lead Time Guide'],
      ['/custom-cosmetic-packaging/', 'Custom Packaging Process']
    ]
  },
  '4': {
    slug: 'refill-ready-hotel-amenity-packaging',
    seoTitle: 'Refill-Ready Hotel Amenity Packaging | GloryStarPack',
    questions: [
      'Which guest-facing mini formats and back-of-house refill formats must work together?',
      'How will housekeeping identify formulas and refill containers accurately?',
      'What leakage, label, fragrance-compatibility and carton checks apply to the program?'
    ],
    note: 'Hotel amenity packaging should be evaluated as an operating system for guests and housekeeping, not only as a visual collection of mini bottles.',
    resources: [
      ['/products/hotel-amenity-packaging/', 'Hotel Amenity Packaging'],
      ['/products/refill-pouch-packaging/', 'Refill Pouch Packaging'],
      ['/contact/', 'Discuss an Amenity Project']
    ]
  },
  '5': {
    slug: 'cosmetic-discovery-kit-packaging',
    seoTitle: 'Cosmetic Discovery Kit Packaging | GloryStarPack',
    questions: [
      'How many formulas, fill volumes and dispensing formats are included?',
      'Will the components sit in a paper tray, molded insert, pouch or retail box?',
      'Which decoration and export-packing details must remain consistent across the set?'
    ],
    note: 'Discovery kits are quoted more accurately when every primary pack, applicator, insert and outer pack is listed as one bill of materials.',
    resources: [
      ['/products/cosmetic-sample-packaging/', 'Cosmetic Sample Packaging'],
      ['/products/cosmetic-packaging-kits/', 'Packaging Kits'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample Approval Checklist']
    ]
  },
  '6': {
    slug: 'pcr-hdpe-personal-care-bottles',
    seoTitle: 'PCR HDPE Bottles for Personal Care | GloryStarPack',
    questions: [
      'What recycled-content target and acceptable color variation should the sample establish?',
      'Does the wall thickness provide the expected squeeze feel and panel stability?',
      'Are the closure, label, decoration and carton packing compatible with the selected PCR bottle?'
    ],
    note: 'PCR appearance can vary more than virgin resin. Approve realistic color, surface and mechanical expectations with the exact bottle and closure configuration.',
    resources: [
      ['/products/personal-care-packaging/', 'Personal Care Packaging'],
      ['/products/plastic-packaging/', 'Plastic Packaging'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample Approval Checklist']
    ]
  },
  '7': {
    slug: 'color-cosmetics-component-systems',
    seoTitle: 'Color Cosmetics Component Systems | GloryStarPack',
    questions: [
      'Does the applicator shape suit the formula and intended application area?',
      'Are the wiper diameter, rod length, cap fit and tube geometry compatible?',
      'Should the component set, decoration and carton be sampled together?'
    ],
    note: 'For mascara, brow gel, lip oil and gloss, component performance is part of the product experience. A tube should not be approved independently of its applicator and wiper.',
    resources: [
      ['/products/makeup-packaging/', 'Makeup Packaging'],
      ['/products/lip-gloss-tubes/', 'Lip Gloss Tubes'],
      ['/custom-cosmetic-packaging/', 'Custom Packaging Process']
    ]
  },
  '8': {
    slug: 'packaging-closure-qc-checklist',
    seoTitle: 'Packaging Closure QC Checklist | GloryStarPack',
    questions: [
      'Is the neck finish, thread, torque, liner or reducer matched to the exact container?',
      'Has dispensing output, spray pattern, dip-tube length or roller flow been reviewed?',
      'Which inversion, vibration, temperature and formula-compatibility checks apply?'
    ],
    note: 'A closure is not fully specified by its appearance. Test the exact container, component, formula and decoration combination intended for filling.',
    resources: [
      ['/products/cosmetic-pumps-closures/', 'Pumps and Closures'],
      ['/products/cosmetic-packaging-accessories/', 'Packaging Accessories'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample Approval Checklist']
    ]
  },
  '9': {
    slug: 'molded-pulp-gift-box-inserts',
    seoTitle: 'Molded Pulp Inserts for Gift Boxes | GloryStarPack',
    questions: [
      'Are the insert cavities based on the final decorated bottle and cap dimensions?',
      'What compression, drop and export-shipping conditions must the pack withstand?',
      'How will the insert interact with the sleeve, rigid box, labels and unboxing sequence?'
    ],
    note: 'Design the insert around production-intent components. Small changes to cap height, bottle diameter or decoration can alter fit and transit protection.',
    resources: [
      ['/products/cosmetic-packaging-kits/', 'Cosmetic Packaging Kits'],
      ['/custom-cosmetic-packaging/', 'Custom Packaging Process'],
      ['/contact/', 'Discuss a Gift Box Project']
    ]
  },
  '10': {
    slug: 'cosmetic-packaging-decoration-methods',
    seoTitle: 'Cosmetic Packaging Decoration Methods | GloryStarPack',
    questions: [
      'What substrate, surface curve and handling exposure will the decoration face?',
      'Does the artwork require fine detail, metallic effects, full color or frequent changes?',
      'Which blank sample and decorated proof must be approved before bulk production?'
    ],
    note: 'Decoration should be selected after the base package and formula requirements are understood. The lowest-cost method is not useful if it cannot reproduce the artwork or withstand handling.',
    resources: [
      ['/cosmetic-logo-printing-methods/', 'Logo Printing Methods'],
      ['/custom-cosmetic-packaging/', 'Custom Packaging Process'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample Approval Checklist']
    ]
  }
};

const insightConsiderations = {
  '1': 'Group products by the buyer decision they solve rather than by appearance alone. A coordinated range should distinguish primary containers, dispensing components, accessories and retail packing, then identify which parts share artwork, colors or order timing. This makes sample requests easier to compare and reduces hidden component gaps.',
  '2': 'Compare the refill system at three levels: material structure, filling and sealing operations, and consumer use. The pouch may need a different barrier or spout for a viscous formula, while the reusable bottle must accept a clean transfer. Secondary packing also needs to protect the spout from compression during export.',
  '3': 'Separate fixed requirements from preferences in the request. Formula, capacity, destination and quantity are usually fixed inputs; material, finish or closure may still be open to recommendation. Marking that difference helps the supplier propose realistic alternatives without confusing them with the approved specification.',
  '4': 'Hotel programs often have two packaging environments: guest rooms and back-of-house operations. Mini containers, wall-mounted dispensers and refill pouches may use different capacities and closures, but their labeling, formula identification and replenishment process must remain clear to housekeeping teams.',
  '5': 'Build the kit around the intended trial journey. Fragrance, skincare and makeup samples can require different applicators and protection, while the insert must keep each format visible and secure. Confirm how the set will be assembled, filled, labeled and packed before approving the outer box.',
  '6': 'Ask for the recycled-content declaration and the visual tolerance used for the production lot. PCR resin can affect color, odor, surface texture and mechanical behavior. The approved bottle should be reviewed with the final cap or pump, label stock, decoration and filled-product weight.',
  '7': 'Use the actual formula during applicator trials whenever possible. A brush that performs well with a low-viscosity sample may load differently with mascara, brow gel or lip oil. Wiper selection, withdrawal force, dose, cap sealing and consumer handling should be evaluated as one system.',
  '8': 'Create a component approval record that identifies the exact bottle mold, neck finish, liner, dip-tube length and closure version. Similar-looking pumps or caps may not be interchangeable. Repeating the approved configuration on purchase orders helps prevent substitutions that change dispensing or seal performance.',
  '9': 'Model the insert with the production-intent bottle, closure and decoration thickness. The outer box, insert and product should be evaluated together for movement, scuffing and presentation. Export cartons may need extra dividers or orientation controls even when the retail insert fits correctly.',
  '10': 'Start decoration trials on the approved base material and surface treatment. Glass coating, plastic resin, metal finishes and paper labels respond differently to inks, foils and adhesives. Confirm color tolerance, artwork position, rub resistance and formula exposure before the decorated sample becomes the production reference.'
};

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

function truncateWords(value, maxLength) {
  const clean = String(value).replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength + 1).replace(/\s+\S*$/, '').replace(/[,:;.-]+$/, '')}.`;
}

function metaDescription(article) {
  return truncateWords(
    `${article.excerpt} Review the key component, sample and approval checks before bulk production.`,
    158
  );
}

function isoDate(value) {
  const parsed = new Date(`${value} 12:00:00 UTC`);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid article date: ${value}`);
  return parsed.toISOString().slice(0, 10);
}

function extractNews() {
  const source = fs.readFileSync(path.join(rootDir, 'assets/js/main.js'), 'utf8');
  const start = source.indexOf('const NEWS = ');
  const end = source.indexOf('\n};', start);
  if (start < 0 || end < 0) throw new Error('Unable to locate NEWS data in assets/js/main.js');
  const expression = source.slice(start + 'const NEWS = '.length, end + 2);
  return vm.runInNewContext(`(${expression})`, {}, { timeout: 1000 });
}

const news = extractNews();
const insights = Object.entries(insightDefinitions).map(([id, definition]) => {
  const article = news[id];
  if (!article) throw new Error(`Missing NEWS article ${id}`);
  const imagePath = `/${article.img.replace(/^\/+/, '')}`;
  if (!fs.existsSync(path.join(rootDir, imagePath.slice(1)))) throw new Error(`Missing image for article ${id}: ${imagePath}`);
  return {
    id,
    ...article,
    ...definition,
    consideration: insightConsiderations[id],
    imagePath,
    datePublished: isoDate(article.date)
  };
});

function articlePath(article) {
  return `/insights/${article.slug}/`;
}

function headerMarkup() {
  return `<header class="site-header"><div class="wrap"><a class="brand" href="/" aria-label="GloryStarPack home"><img src="/assets/brand/glorystarpack-logo-mark-96-2026.png" width="40" height="40" alt="" decoding="async">GloryStarPack</a><nav class="site-nav" aria-label="Primary navigation"><a href="/products/product-index/">Product Index</a><a href="/cosmetic-packaging-guides/">Buyer Guides</a><a href="/insights/">Insights</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav></div></header>`;
}

function footerMarkup() {
  return `<footer class="site-footer"><div class="wrap"><span>GloryStarPack Packaging Desk · Xiamen, Fujian, China</span><span><a href="/insights/">Insights</a> · <a href="/about/">About</a> · <a href="/contact/">Contact</a> · <a href="/site-index/">Site Index</a></span></div></footer>`;
}

function relatedInsights(article) {
  const index = insights.findIndex(item => item.id === article.id);
  return [1, 2, 3].map(offset => insights[(index + offset) % insights.length]);
}

function jsonLd(article, canonical, description) {
  const wordCount = `${article.body} ${article.consideration} ${article.questions.join(' ')} ${article.note}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .length;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: article.seoTitle,
        description,
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#organization` },
        breadcrumb: { '@id': `${canonical}#breadcrumbs` },
        mainEntity: { '@id': `${canonical}#article` },
        datePublished: article.datePublished,
        dateModified: modifiedDate
      },
      {
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        url: canonical,
        headline: article.title,
        description,
        image: `${siteUrl}${article.imagePath}`,
        datePublished: article.datePublished,
        dateModified: modifiedDate,
        articleSection: article.cat,
        wordCount,
        author: { '@id': `${siteUrl}/#organization` },
        publisher: { '@id': `${siteUrl}/#organization` },
        mainEntityOfPage: { '@id': `${canonical}#webpage` }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Packaging Insights', item: `${siteUrl}/insights/` },
          { '@type': 'ListItem', position: 3, name: article.title, item: canonical }
        ]
      }
    ]
  }).replace(/</g, '\\u003c');
}

function articlePage(article) {
  const canonical = `${siteUrl}${articlePath(article)}`;
  const description = metaDescription(article);
  const resourceMarkup = article.resources
    .map(([href, name]) => `<li><a href="${href}">${escapeHtml(name)}</a></li>`)
    .join('');
  const questionsMarkup = article.questions.map(question => `<li>${escapeHtml(question)}</li>`).join('');
  const relatedMarkup = relatedInsights(article)
    .map(item => `<a class="insight-card" href="${articlePath(item)}"><img src="${item.imagePath}" width="1200" height="750" loading="lazy" decoding="async" alt="${escapeHtml(item.alt)}"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.cat)} · ${escapeHtml(item.date)}</span></div></a>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="GloryStarPack Packaging Desk">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <link rel="preload" as="image" href="${article.imagePath}">
  <link rel="stylesheet" href="/assets/css/product-page.css">
  <link rel="stylesheet" href="/assets/css/insight-page.css">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(article.seoTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="GloryStarPack">
  <meta property="og:image" content="${siteUrl}${article.imagePath}">
  <meta property="og:image:alt" content="${escapeHtml(article.alt)}">
  <meta property="article:published_time" content="${article.datePublished}">
  <meta property="article:modified_time" content="${modifiedDate}">
  <meta property="article:section" content="${escapeHtml(article.cat)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(article.seoTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${siteUrl}${article.imagePath}">
  <script type="application/ld+json">${jsonLd(article, canonical, description)}</script>
</head>
<body>
${headerMarkup()}
<div class="wrap breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/insights/">Packaging Insights</a> / <span>${escapeHtml(article.title)}</span></div>
<main>
  <header class="wrap insight-hero">
    <div class="eyebrow">${escapeHtml(article.cat)}</div>
    <h1>${escapeHtml(article.title)}</h1>
    <p class="lead">${escapeHtml(article.excerpt)}</p>
    <div class="article-meta"><span>Published ${escapeHtml(article.date)}</span><span>Updated July 29, 2026</span><span>${escapeHtml(article.read)}</span><span>By GloryStarPack Packaging Desk</span></div>
    <figure class="article-figure"><img src="${article.imagePath}" width="1600" height="800" fetchpriority="high" decoding="async" alt="${escapeHtml(article.alt)}"></figure>
  </header>
  <div class="wrap main article-shell">
    <article class="article-body">
      ${article.body}
      <h2>Selection considerations</h2>
      <p>${escapeHtml(article.consideration)}</p>
      <h2>Questions to resolve before sampling</h2>
      <ul>${questionsMarkup}</ul>
      <div class="article-note"><strong>Procurement note:</strong> ${escapeHtml(article.note)}</div>
      <h2>What to send with an inquiry</h2>
      <p>Share the application or formula, capacity, material preference, closure or dispensing component, decoration, estimated quantity, destination country, target timing and any reference drawings or photos. Final specifications, MOQ, availability and testing requirements are confirmed for the selected configuration.</p>
    </article>
    <aside class="article-sidebar" aria-label="Related procurement resources">
      <div class="card"><div class="eyebrow">Related resources</div><h2>Continue researching</h2><ul>${resourceMarkup}</ul></div>
      <div class="card"><div class="eyebrow">Need a project answer?</div><h2>Build a useful RFQ</h2><p>Use the contact page to prepare a complete email or WhatsApp inquiry.</p><a href="/contact/">Open the RFQ builder →</a></div>
    </aside>
  </div>
  <section class="wrap section">
    <div class="eyebrow">More packaging insights</div>
    <h2>Related procurement notes</h2>
    <div class="insight-grid">${relatedMarkup}</div>
  </section>
</main>
${footerMarkup()}
</body>
</html>
`;
}

function indexPage() {
  const canonical = `${siteUrl}/insights/`;
  const itemList = insights.map((article, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: article.title,
    url: `${siteUrl}${articlePath(article)}`
  }));
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: 'Packaging Insights and Procurement Notes',
        description: 'Practical packaging sourcing notes covering RFQs, samples, closures, refill systems, decoration, materials and retail kits.',
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#organization` },
        dateModified: modifiedDate
      },
      {
        '@type': 'ItemList',
        '@id': `${canonical}#articles`,
        numberOfItems: insights.length,
        itemListElement: itemList
      }
    ]
  }).replace(/</g, '\\u003c');
  const cards = insights.map(article => `<a class="insight-card" href="${articlePath(article)}"><img src="${article.imagePath}" width="1200" height="750" loading="lazy" decoding="async" alt="${escapeHtml(article.alt)}"><div><strong>${escapeHtml(article.title)}</strong><span>${escapeHtml(article.cat)} · ${escapeHtml(article.date)} · ${escapeHtml(article.read)}</span></div></a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Packaging Insights &amp; Procurement Notes | GloryStarPack</title>
  <meta name="description" content="Read practical packaging sourcing notes about RFQs, samples, refill systems, closures, PCR materials, decoration, discovery kits and export-ready projects.">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <link rel="stylesheet" href="/assets/css/product-page.css">
  <link rel="stylesheet" href="/assets/css/insight-page.css">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Packaging Insights &amp; Procurement Notes | GloryStarPack">
  <meta property="og:description" content="Practical notes for packaging RFQs, samples, materials, closures, decoration and complete sourcing systems.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="GloryStarPack">
  <meta property="og:image" content="${siteUrl}/assets/brand/factory-oem-quality-2026.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
${headerMarkup()}
<main class="wrap">
  <section class="index-hero"><div class="eyebrow">Packaging desk</div><h1>Packaging Insights &amp; Procurement Notes</h1><p>Use these concise guides to prepare clearer RFQs, compare packaging systems and identify the samples, components and approval checks a project may need. Each article links to relevant product categories and deeper buyer resources.</p></section>
  <div class="insight-grid">${cards}</div>
  <section class="section rfq"><div><div class="eyebrow">From research to sourcing</div><h2>Need an item-specific answer?</h2><p>Browse individual product pages or prepare a structured packaging inquiry.</p></div><div class="actions"><a class="btn" href="/products/product-index/">Product Index</a><a class="btn alt" href="/contact/">Build an RFQ</a></div></section>
</main>
${footerMarkup()}
</body>
</html>
`;
}

function updateGeneratedBlock(filePath, startMarker, endMarker, content, closingPattern, insertion) {
  const source = fs.readFileSync(filePath, 'utf8');
  const block = `${startMarker}\n${content}\n${endMarker}`;
  const markerPattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const updated = markerPattern.test(source)
    ? source.replace(markerPattern, block)
    : source.replace(closingPattern, `${insertion}${block}$&`);
  fs.writeFileSync(filePath, updated);
}

for (const article of insights) {
  const outputDir = path.join(rootDir, 'insights', article.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), articlePage(article));
}

const indexDir = path.join(rootDir, 'insights');
fs.mkdirSync(indexDir, { recursive: true });
fs.writeFileSync(path.join(indexDir, 'index.html'), indexPage());

const sitemapEntries = [
  `  <url>
    <loc>${siteUrl}/insights/</loc>
    <lastmod>${modifiedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.82</priority>
  </url>`,
  ...insights.map(article => `  <url>
    <loc>${siteUrl}${articlePath(article)}</loc>
    <lastmod>${modifiedDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
].join('\n');

const imageEntries = insights.map(article => `  <url>
    <loc>${siteUrl}${articlePath(article)}</loc>
    <image:image>
      <image:loc>${siteUrl}${article.imagePath}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
      <image:caption>${escapeXml(article.excerpt)}</image:caption>
    </image:image>
  </url>`).join('\n');

const llmsEntries = [
  '## Packaging Insights',
  '',
  `- Packaging insights index: ${siteUrl}/insights/`,
  ...insights.map(article => `- ${article.title}: ${siteUrl}${articlePath(article)}`)
].join('\n');

updateGeneratedBlock(
  path.join(rootDir, 'sitemap.xml'),
  '<!-- BEGIN GENERATED INSIGHT PAGES -->',
  '<!-- END GENERATED INSIGHT PAGES -->',
  sitemapEntries,
  /\s*<\/urlset>\s*$/,
  '\n  '
);
updateGeneratedBlock(
  path.join(rootDir, 'image-sitemap.xml'),
  '<!-- BEGIN GENERATED INSIGHT IMAGES -->',
  '<!-- END GENERATED INSIGHT IMAGES -->',
  imageEntries,
  /\s*<\/urlset>\s*$/,
  '\n  '
);
updateGeneratedBlock(
  path.join(rootDir, 'llms.txt'),
  '<!-- BEGIN GENERATED INSIGHT LINKS -->',
  '<!-- END GENERATED INSIGHT LINKS -->',
  llmsEntries,
  /\s*$/,
  '\n\n'
);

console.log(`Generated ${insights.length} insight pages and 1 insight index page.`);
