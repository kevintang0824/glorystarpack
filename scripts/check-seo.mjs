import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const ignoredDirectories = new Set(['.git', 'backups', 'tmp']);
const ignoredFiles = new Set(['glorystarpack (1).html']);
const errors = [];
const warnings = [];

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && ignoredFiles.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function relative(filePath) {
  return path.relative(rootDir, filePath);
}

function firstMatch(source, pattern) {
  return source.match(pattern)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
}

function metaContent(source, name) {
  const tag = source.match(new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, 'i'))?.[0] ?? '';
  return tag.match(/\bcontent=(["'])(.*?)\1/i)?.[2]?.replace(/\s+/g, ' ').trim() ?? '';
}

function localPathForUrl(rawUrl) {
  const pathname = decodeURIComponent(rawUrl.split(/[?#]/)[0]);
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return null;
  if (pathname === '/') return path.join(rootDir, 'index.html');
  const candidate = path.join(rootDir, pathname);
  if (path.extname(candidate)) return candidate;
  return path.join(candidate, 'index.html');
}

function localAssetPath(rawUrl, pagePath) {
  const pathname = decodeURIComponent(rawUrl.split(/[?#]/)[0]);
  if (!pathname || pathname.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(pathname)) return null;
  return pathname.startsWith('/')
    ? path.join(rootDir, pathname)
    : path.resolve(path.dirname(pagePath), pathname);
}

function hasSchemaType(source, type) {
  return new RegExp(`"@type"\\s*:\\s*"${type}"`).test(source);
}

const htmlFiles = walk(rootDir);
const pageRecords = [];

for (const filePath of htmlFiles) {
  const rel = relative(filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const title = firstMatch(source, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = metaContent(source, 'description');
  const robots = metaContent(source, 'robots');
  const canonical = firstMatch(source, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i);
  const h1Count = (source.match(/<h1\b/gi) ?? []).length;
  const schemaBlocks = [...source.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const indexable = !/(?:^|,)\s*noindex\b/i.test(robots);

  if (rel === 'google130558f0f0763df4.html') continue;
  if (!title) errors.push(`${rel}: missing title`);
  if (!description) errors.push(`${rel}: missing meta description`);
  if (!canonical) errors.push(`${rel}: missing canonical`);
  if (h1Count !== 1) errors.push(`${rel}: expected 1 H1, found ${h1Count}`);
  if (title && (title.length < 30 || title.length > 65)) warnings.push(`${rel}: title length ${title.length}`);
  if (description && (description.length < 110 || description.length > 165)) warnings.push(`${rel}: description length ${description.length}`);
  if (description && /\b(?:a|an|and|by|for|from|in|of|on|or|the|to|with)\.$/i.test(description)) {
    errors.push(`${rel}: meta description ends with a truncated stop word`);
  }
  if (!schemaBlocks.length) warnings.push(`${rel}: no JSON-LD`);

  schemaBlocks.forEach((match, index) => {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${rel}: invalid JSON-LD block ${index + 1}: ${error.message}`);
    }
  });

  for (const match of source.matchAll(/href=["']([^"']+)["']/gi)) {
    const localPath = localPathForUrl(match[1]);
    if (!localPath) continue;
    if (!fs.existsSync(localPath)) errors.push(`${rel}: broken internal link ${match[1]}`);
  }
  for (const match of source.matchAll(/\bsrc=["']([^"']+)["']/gi)) {
    const assetPath = localAssetPath(match[1], filePath);
    if (assetPath && !fs.existsSync(assetPath)) errors.push(`${rel}: missing local asset ${match[1]}`);
  }
  if (rel !== 'index.html' && /href=["']\/#(?:contact|detail|oem|products)(?:[\/#"'])/i.test(source)) {
    errors.push(`${rel}: links to a homepage hash route instead of a stable static URL`);
  }

  pageRecords.push({ rel, title, description, robots, canonical, indexable, source });
}

for (const key of ['title', 'description', 'canonical']) {
  const groups = new Map();
  for (const record of pageRecords) {
    if (!record[key]) continue;
    if (!groups.has(record[key])) groups.set(record[key], []);
    groups.get(record[key]).push(record.rel);
  }
  for (const [value, records] of groups) {
    if (records.length > 1) errors.push(`duplicate ${key}: ${value} -> ${records.join(', ')}`);
  }
}

const sitemapSource = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapSource.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const uniqueSitemapUrls = new Set(sitemapUrls);
if (uniqueSitemapUrls.size !== sitemapUrls.length) errors.push('sitemap.xml contains duplicate URLs');

for (const url of sitemapUrls) {
  if (!url.startsWith(siteUrl)) {
    errors.push(`sitemap.xml contains off-domain URL: ${url}`);
    continue;
  }
  const localPath = localPathForUrl(url.slice(siteUrl.length) || '/');
  if (!localPath || !fs.existsSync(localPath)) {
    errors.push(`sitemap.xml URL has no local page: ${url}`);
    continue;
  }
  const record = pageRecords.find(item => path.resolve(rootDir, item.rel) === path.resolve(localPath));
  if (record && !record.indexable) errors.push(`sitemap.xml contains noindex page: ${url}`);
}

for (const record of pageRecords) {
  if (!record.indexable || !record.canonical.startsWith(siteUrl)) continue;
  if (!uniqueSitemapUrls.has(record.canonical)) {
    errors.push(`${record.rel}: indexable canonical is missing from sitemap.xml (${record.canonical})`);
  }
}

const productPages = pageRecords.filter(record => /^products\/.+-p\d+\/index\.html$/.test(record.rel));
if (productPages.length !== 54) errors.push(`expected 54 generated product pages, found ${productPages.length}`);
for (const productPage of productPages) {
  if (!hasSchemaType(productPage.source, 'Product')) errors.push(`${productPage.rel}: missing Product schema`);
  if (!hasSchemaType(productPage.source, 'WebPage')) errors.push(`${productPage.rel}: missing WebPage schema`);
  if (!hasSchemaType(productPage.source, 'BreadcrumbList')) errors.push(`${productPage.rel}: missing BreadcrumbList schema`);
  const resourceLinks = (productPage.source.match(/class="resource-card"/g) ?? []).length;
  if (resourceLinks < 4) errors.push(`${productPage.rel}: expected at least 4 buyer resource links, found ${resourceLinks}`);
  const expectedCanonical = `${siteUrl}/${productPage.rel.replace(/index\.html$/, '')}`;
  if (productPage.canonical !== expectedCanonical) {
    errors.push(`${productPage.rel}: canonical mismatch (${productPage.canonical} != ${expectedCanonical})`);
  }
}

const homepage = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const homepageProductLinks = new Set(
  [...homepage.matchAll(/href=["'](\/products\/[^"']+-p\d+\/)["']/g)].map(match => match[1])
);
if (homepageProductLinks.size < 4) errors.push(`homepage exposes only ${homepageProductLinks.size} crawlable product links`);
for (const requiredPath of ['/about/', '/contact/', '/products/product-index/', '/insights/', '/glass-bottle-buying-guides/', '/site-index/']) {
  if (!homepage.includes(`href="${requiredPath}"`)) errors.push(`homepage is missing a crawlable ${requiredPath} link`);
}
for (const requiredPath of ['/about/', '/contact/', '/products/product-index/', '/insights/', '/glass-bottle-buying-guides/']) {
  if (!uniqueSitemapUrls.has(`${siteUrl}${requiredPath}`)) errors.push(`sitemap.xml is missing ${requiredPath}`);
}

for (const id of ['page-products', 'page-detail', 'page-about', 'page-oem', 'page-news', 'page-newsdetail', 'page-contact', 'page-search']) {
  const openingTag = homepage.match(new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'))?.[0] ?? '';
  if (!openingTag.includes('data-nosnippet')) errors.push(`homepage ${id} is missing data-nosnippet`);
}
for (const id of ['modal-quote', 'modal-sample']) {
  const openingTag = homepage.match(new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'))?.[0] ?? '';
  if (!openingTag.includes('data-nosnippet')) errors.push(`homepage ${id} is missing data-nosnippet`);
}
const homepageFooterTag = homepage.match(/<footer\b[^>]*>/i)?.[0] ?? '';
if (!homepageFooterTag.includes('data-nosnippet')) errors.push('homepage footer is missing data-nosnippet');

const aboutPage = pageRecords.find(record => record.rel === 'about/index.html');
const contactPage = pageRecords.find(record => record.rel === 'contact/index.html');
if (!aboutPage) errors.push('missing about/index.html');
else {
  if (!hasSchemaType(aboutPage.source, 'AboutPage')) errors.push('about/index.html: missing AboutPage schema');
  if (!hasSchemaType(aboutPage.source, 'Organization')) errors.push('about/index.html: missing Organization schema');
  if (!hasSchemaType(aboutPage.source, 'FAQPage')) errors.push('about/index.html: missing FAQPage schema');
}
if (!contactPage) errors.push('missing contact/index.html');
else {
  if (!hasSchemaType(contactPage.source, 'ContactPage')) errors.push('contact/index.html: missing ContactPage schema');
  if (!hasSchemaType(contactPage.source, 'ContactPoint')) errors.push('contact/index.html: missing ContactPoint schema');
  if (!contactPage.source.includes('id="rfq-form"')) errors.push('contact/index.html: missing RFQ builder');
}

const llmsSource = fs.readFileSync(path.join(rootDir, 'llms.txt'), 'utf8');
for (const requiredUrl of [
  `${siteUrl}/about/`,
  `${siteUrl}/contact/`,
  `${siteUrl}/products/product-index/`,
  `${siteUrl}/insights/`,
  `${siteUrl}/glass-bottle-buying-guides/`,
  `${siteUrl}/insights/cosmetic-packaging-compatibility-testing-guide/`,
  `${siteUrl}/insights/cosmetic-pump-closure-selection-guide/`
]) {
  if (!llmsSource.includes(requiredUrl)) errors.push(`llms.txt is missing ${requiredUrl}`);
}
for (const productPage of productPages) {
  if (!llmsSource.includes(productPage.canonical)) {
    errors.push(`llms.txt is missing product URL ${productPage.canonical}`);
  }
}

try {
  const aiContext = JSON.parse(fs.readFileSync(path.join(rootDir, 'ai-context.json'), 'utf8'));
  for (const key of ['about', 'contact', 'productIndex', 'insights', 'compatibilityTestingGuide', 'pumpClosureGuide', 'pumpClosureCategory']) {
    if (!aiContext.site?.[key]) errors.push(`ai-context.json site.${key} is missing`);
  }
} catch (error) {
  errors.push(`ai-context.json is invalid: ${error.message}`);
}

const insightPages = pageRecords.filter(record => /^insights\/.+\/index\.html$/.test(record.rel));
const insightArticles = insightPages.filter(record => record.rel !== 'insights/index.html');
if (insightArticles.length !== 15) errors.push(`expected 15 generated insight articles, found ${insightArticles.length}`);
for (const article of insightArticles) {
  if (!hasSchemaType(article.source, 'BlogPosting')) errors.push(`${article.rel}: missing BlogPosting schema`);
  if (!hasSchemaType(article.source, 'WebPage')) errors.push(`${article.rel}: missing WebPage schema`);
  if (!hasSchemaType(article.source, 'BreadcrumbList')) errors.push(`${article.rel}: missing BreadcrumbList schema`);
  if (!hasSchemaType(article.source, 'Organization')) errors.push(`${article.rel}: missing Organization schema`);
  const wordCount = Number(article.source.match(/"wordCount":(\d+)/)?.[1] ?? 0);
  if (wordCount < 150) errors.push(`${article.rel}: article wordCount is only ${wordCount}`);
  const resources = (article.source.match(/<aside class="article-sidebar"/g) ?? []).length;
  if (resources !== 1) errors.push(`${article.rel}: missing related resource sidebar`);
}

const insightIndex = pageRecords.find(record => record.rel === 'insights/index.html');
if (!insightIndex) errors.push('missing insights/index.html');
else {
  if (!hasSchemaType(insightIndex.source, 'CollectionPage')) errors.push('insights/index.html: missing CollectionPage schema');
  if (!hasSchemaType(insightIndex.source, 'ItemList')) errors.push('insights/index.html: missing ItemList schema');
  if (!hasSchemaType(insightIndex.source, 'Organization')) errors.push('insights/index.html: missing Organization schema');
  const footerCount = (insightIndex.source.match(/class="site-footer"/g) ?? []).length;
  if (footerCount !== 1) errors.push(`insights/index.html: expected 1 site footer, found ${footerCount}`);
}

const glassGuideHub = pageRecords.find(record => record.rel === 'glass-bottle-buying-guides/index.html');
if (!glassGuideHub) errors.push('missing glass-bottle-buying-guides/index.html');
else {
  if (!hasSchemaType(glassGuideHub.source, 'CollectionPage')) errors.push('glass-bottle-buying-guides/index.html: missing CollectionPage schema');
  if (!hasSchemaType(glassGuideHub.source, 'ItemList')) errors.push('glass-bottle-buying-guides/index.html: missing ItemList schema');
  if (!hasSchemaType(glassGuideHub.source, 'FAQPage')) errors.push('glass-bottle-buying-guides/index.html: missing FAQPage schema');
  if (!hasSchemaType(glassGuideHub.source, 'BreadcrumbList')) errors.push('glass-bottle-buying-guides/index.html: missing BreadcrumbList schema');
  if (!hasSchemaType(glassGuideHub.source, 'Organization')) errors.push('glass-bottle-buying-guides/index.html: missing Organization schema');
}

const homepageInsightLinks = new Set(
  [...homepage.matchAll(/href=["'](\/insights\/[^"']+\/)["']/g)].map(match => match[1])
);
if (homepageInsightLinks.size < 15) errors.push(`homepage exposes only ${homepageInsightLinks.size} crawlable insight links`);

const closureCategory = pageRecords.find(record => record.rel === 'products/cosmetic-pumps-closures/index.html');
const specializedPumpPaths = [
  '/products/treatment-pump-serum-bottles-p171/',
  '/products/airless-pump-actuator-replacement-p183/',
  '/products/salon-trigger-sprayer-p203/',
  '/products/mini-trigger-sprayer-head-p245/',
  '/products/external-spring-lotion-pump-p357/',
  '/products/high-output-refill-jug-pump-p358/',
  '/products/hair-body-fine-mist-sprayer-p359/',
  '/products/foaming-trigger-sprayer-head-p384/',
  '/products/lock-down-lotion-pump-p387/'
];
if (!closureCategory) errors.push('missing products/cosmetic-pumps-closures/index.html');
else {
  for (const productPath of [
    '/products/fine-mist-sprayer-pump-head-p169/',
    '/products/lotion-pump-dispenser-head-p170/',
    '/products/foam-pump-head-with-lock-clip-p172/',
    '/products/glass-dropper-pipette-assembly-p173/',
    '/products/perfume-crimp-pump-and-collar-set-p181/',
    ...specializedPumpPaths
  ]) {
    if (!closureCategory.source.includes(`href="${productPath}"`)) {
      errors.push(`products/cosmetic-pumps-closures/index.html: missing featured link ${productPath}`);
    }
  }
}
for (const productPath of specializedPumpPaths) {
  const record = pageRecords.find(item => item.canonical === `${siteUrl}${productPath}`);
  if (!record) {
    errors.push(`missing specialized pump product page ${productPath}`);
    continue;
  }
  if (!record.source.includes('Application and sizing guide')) {
    errors.push(`${record.rel}: missing differentiated application and sizing guide`);
  }
}
const deferredCarouselBackgrounds = (homepage.match(/data-bg-desktop=/g) ?? []).length;
if (deferredCarouselBackgrounds !== 4) {
  errors.push(`homepage expected 4 deferred carousel backgrounds, found ${deferredCarouselBackgrounds}`);
}
for (const slideClass of ['cs-bg-2', 'cs-bg-3', 'cs-bg-4', 'cs-bg-5']) {
  const cssRule = homepage.match(new RegExp(`\\.${slideClass}\\{([^}]*)\\}`))?.[1] ?? '';
  if (cssRule.includes('background-image')) errors.push(`homepage ${slideClass} still declares an eager background image`);
}
if (!fs.readFileSync(path.join(rootDir, 'assets/js/main.js'), 'utf8').includes('function csEnsureBackground')) {
  errors.push('assets/js/main.js is missing deferred carousel image loading');
}

console.log(`Checked ${pageRecords.length} HTML pages, ${sitemapUrls.length} sitemap URLs, ${productPages.length} product pages and ${insightArticles.length} insight articles.`);
console.log(`Homepage crawlable product links: ${homepageProductLinks.size}.`);
console.log(`Homepage crawlable insight links: ${homepageInsightLinks.size}.`);
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach(warning => console.log(`- ${warning}`));
}
if (errors.length) {
  console.error(`Errors (${errors.length}):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('SEO checks passed.');
}
