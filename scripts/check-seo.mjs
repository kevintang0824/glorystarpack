import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const indexNowKey = 'f5c6d8e91a2b47c0ad74e69321fb805e';
const indexNowKeyFileName = `${indexNowKey}.txt`;
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

function visibleWordCount(source) {
  const text = source
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
}

const imageDimensionCache = new Map();

function jpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    const segmentLength = buffer.readUInt16BE(offset);
    if (startOfFrameMarkers.has(marker)) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    if (segmentLength < 2) break;
    offset += segmentLength;
  }
  return null;
}

function intrinsicImageDimensions(filePath) {
  if (imageDimensionCache.has(filePath)) return imageDimensionCache.get(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  let dimensions = null;
  if (extension === '.jpg' || extension === '.jpeg') dimensions = jpegDimensions(buffer);
  else if (extension === '.png' && buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    dimensions = { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  imageDimensionCache.set(filePath, dimensions);
  return dimensions;
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
  const wordCount = visibleWordCount(source);
  const isNotFoundPage = rel === '404.html';

  if (rel === 'google130558f0f0763df4.html') continue;
  if (!title) errors.push(`${rel}: missing title`);
  if (!description) errors.push(`${rel}: missing meta description`);
  if (!canonical && !isNotFoundPage) errors.push(`${rel}: missing canonical`);
  if (h1Count !== 1) errors.push(`${rel}: expected 1 H1, found ${h1Count}`);
  if (title && (title.length < 30 || title.length > 65)) warnings.push(`${rel}: title length ${title.length}`);
  if (description && (description.length < 110 || description.length > 165)) warnings.push(`${rel}: description length ${description.length}`);
  if (description && /\b(?:a|an|and|by|for|from|in|of|on|or|the|to|with)\.$/i.test(description)) {
    errors.push(`${rel}: meta description ends with a truncated stop word`);
  }
  if (!schemaBlocks.length && !isNotFoundPage) warnings.push(`${rel}: no JSON-LD`);
  if (indexable && wordCount < 250) errors.push(`${rel}: indexable page has only ${wordCount} visible words`);
  if (indexable && rel !== 'index.html' && !hasSchemaType(source, 'BreadcrumbList')) {
    errors.push(`${rel}: missing BreadcrumbList schema`);
  }
  if (!source.includes('/assets/css/inquiry-conversion.css')) {
    errors.push(`${rel}: missing shared inquiry conversion stylesheet`);
  }
  if (!source.includes('/assets/js/inquiry-conversion.js')) {
    errors.push(`${rel}: missing shared inquiry conversion script`);
  }
  if (rel !== 'index.html' && /--gold:\s*#c8a96e/i.test(source)) {
    errors.push(`${rel}: inline light-surface gold does not meet WCAG AA contrast`);
  }

  for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
    const width = Number(match[0].match(/\bwidth=["'](\d+)/i)?.[1] ?? 0);
    const height = Number(match[0].match(/\bheight=["'](\d+)/i)?.[1] ?? 0);
    const imageSource = match[0].match(/\bsrc=["']([^"']+)/i)?.[1] ?? 'unknown image';
    if (!width || !height) {
      errors.push(`${rel}: image is missing intrinsic dimensions (${imageSource})`);
      continue;
    }
    const imagePath = localAssetPath(imageSource, filePath);
    if (imagePath && fs.existsSync(imagePath)) {
      const intrinsic = intrinsicImageDimensions(imagePath);
      if (intrinsic) {
        const declaredRatio = width / height;
        const intrinsicRatio = intrinsic.width / intrinsic.height;
        const ratioDifference = Math.abs(declaredRatio - intrinsicRatio) / intrinsicRatio;
        if (ratioDifference > 0.03) {
          errors.push(`${rel}: declared image ratio ${width}x${height} does not match ${intrinsic.width}x${intrinsic.height} (${imageSource})`);
        }
      }
    }
  }

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

  pageRecords.push({ rel, title, description, robots, canonical, indexable, source, wordCount, filePath });
}

const notFoundPage = pageRecords.find(record => record.rel === '404.html');
if (!notFoundPage) errors.push('missing 404.html');
else {
  if (notFoundPage.indexable) errors.push('404.html must be noindex');
  if (notFoundPage.canonical) errors.push('404.html should not canonicalize a missing URL to a valid page');
  for (const requiredPath of ['/', '/products/product-index/', '/glass-bottle-buying-guides/', '/cosmetic-packaging-guides/', '/insights/', '/contact/']) {
    if (!notFoundPage.source.includes(`href="${requiredPath}"`)) errors.push(`404.html is missing recovery link ${requiredPath}`);
  }
}

const inboundPages = new Map(pageRecords.map(record => [path.resolve(record.filePath), new Set()]));
for (const sourceRecord of pageRecords) {
  if (!sourceRecord.indexable) continue;
  for (const match of sourceRecord.source.matchAll(/href=["']([^"']+)["']/gi)) {
    const targetPath = localPathForUrl(match[1]);
    if (!targetPath) continue;
    const resolvedTarget = path.resolve(targetPath);
    if (!inboundPages.has(resolvedTarget) || resolvedTarget === path.resolve(sourceRecord.filePath)) continue;
    inboundPages.get(resolvedTarget).add(sourceRecord.rel);
  }
}
for (const record of pageRecords) {
  if (!record.indexable || record.rel === 'index.html') continue;
  const inboundCount = inboundPages.get(path.resolve(record.filePath))?.size ?? 0;
  if (inboundCount < 2) errors.push(`${record.rel}: linked from only ${inboundCount} other indexable pages`);
}

const indexableByPath = new Map(
  pageRecords.filter(record => record.indexable).map(record => [path.resolve(record.filePath), record])
);
const homepagePath = path.resolve(rootDir, 'index.html');
const clickDepths = new Map([[homepagePath, 0]]);
const crawlQueue = [homepagePath];
while (crawlQueue.length) {
  const sourcePath = crawlQueue.shift();
  const sourceRecord = indexableByPath.get(sourcePath);
  if (!sourceRecord) continue;
  for (const match of sourceRecord.source.matchAll(/href=["']([^"']+)["']/gi)) {
    const targetPath = localPathForUrl(match[1]);
    if (!targetPath) continue;
    const resolvedTarget = path.resolve(targetPath);
    if (!indexableByPath.has(resolvedTarget) || clickDepths.has(resolvedTarget)) continue;
    clickDepths.set(resolvedTarget, clickDepths.get(sourcePath) + 1);
    crawlQueue.push(resolvedTarget);
  }
}
for (const record of pageRecords) {
  if (!record.indexable || record.rel === 'index.html') continue;
  const clickDepth = clickDepths.get(path.resolve(record.filePath));
  if (clickDepth === undefined) errors.push(`${record.rel}: unreachable from the homepage through indexable pages`);
  else if (clickDepth > 3) errors.push(`${record.rel}: click depth is ${clickDepth}; expected no more than 3 from the homepage`);
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

const imageSitemapSource = fs.readFileSync(path.join(rootDir, 'image-sitemap.xml'), 'utf8');
if (!imageSitemapSource.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
  errors.push('image-sitemap.xml is missing the Google image namespace');
}

const productPages = pageRecords.filter(record => /^products\/.+-p\d+\/index\.html$/.test(record.rel));
if (productPages.length !== 54) errors.push(`expected 54 generated product pages, found ${productPages.length}`);
for (const productPage of productPages) {
  if (!hasSchemaType(productPage.source, 'Service')) errors.push(`${productPage.rel}: missing B2B packaging Service schema`);
  if (!hasSchemaType(productPage.source, 'WebPage')) errors.push(`${productPage.rel}: missing WebPage schema`);
  if (!hasSchemaType(productPage.source, 'BreadcrumbList')) errors.push(`${productPage.rel}: missing BreadcrumbList schema`);
  if (!hasSchemaType(productPage.source, 'Organization')) errors.push(`${productPage.rel}: missing Organization schema`);
  if (!hasSchemaType(productPage.source, 'WebSite')) errors.push(`${productPage.rel}: missing WebSite schema`);
  if (!hasSchemaType(productPage.source, 'BusinessAudience')) errors.push(`${productPage.rel}: missing B2B audience schema`);
  if (!productPage.source.includes('"serviceOutput"')) errors.push(`${productPage.rel}: missing truthful packaging service output`);
  if (!productPage.source.includes('"isRelatedTo"')) errors.push(`${productPage.rel}: missing related-product schema`);
  if (!productPage.source.includes('"primaryImageOfPage"')) errors.push(`${productPage.rel}: missing preferred-page image schema`);
  if (!productPage.source.includes('https://glorystarpack.en.alibaba.com/')) errors.push(`${productPage.rel}: missing Organization sameAs URL`);
  const resourceLinks = (productPage.source.match(/class="resource-card"/g) ?? []).length;
  if (resourceLinks < 4) errors.push(`${productPage.rel}: expected at least 4 buyer resource links, found ${resourceLinks}`);
  const expectedCanonical = `${siteUrl}/${productPage.rel.replace(/index\.html$/, '')}`;
  if (productPage.canonical !== expectedCanonical) {
    errors.push(`${productPage.rel}: canonical mismatch (${productPage.canonical} != ${expectedCanonical})`);
  }
  const heroImage = firstMatch(productPage.source, /<div class=["']hero-media["']>[\s\S]*?<img\b[^>]*\bsrc=["']([^"']+)/i);
  if (!heroImage) {
    errors.push(`${productPage.rel}: missing product hero image`);
  } else {
    for (const width of [480, 960]) {
      const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
      const variantPath = localAssetPath(variantUrl, productPage.filePath);
      if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${productPage.rel}: missing ${width}px AVIF hero variant`);
      if (!productPage.source.includes(`${variantUrl} ${width}w`)) errors.push(`${productPage.rel}: AVIF srcset is missing ${width}px hero variant`);
    }
  }
  const pictureCount = (productPage.source.match(/<picture>/g) ?? []).length;
  if (pictureCount < 5) errors.push(`${productPage.rel}: expected responsive pictures for the hero and 4 related products, found ${pictureCount}`);
  const imagePreload = productPage.source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${productPage.rel}: hero preload is not responsive AVIF`);
  }
  if (!productPage.source.includes(encodeURIComponent(`Product page: ${productPage.canonical}`))) {
    errors.push(`${productPage.rel}: inquiry links do not preserve the product-page source`);
  }
  if (!productPage.source.includes('data-inquiry-channel="email"') || !productPage.source.includes('&amp;body=')) {
    errors.push(`${productPage.rel}: email RFQ link is missing attribution data or a prepared body`);
  }
  if (heroImage && !imageSitemapSource.includes(`<image:loc>${siteUrl}${heroImage}</image:loc>`)) {
    errors.push(`${productPage.rel}: product image is missing from image-sitemap.xml`);
  }
}

const unsupportedProductSchemaPages = pageRecords.filter(record => hasSchemaType(record.source, 'Product'));
for (const record of unsupportedProductSchemaPages) {
  errors.push(`${record.rel}: Product schema requires a truthful offer, review or aggregate rating; use B2B Service/Thing schema for RFQ-only pages`);
}

const homepage = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const homepageModified = firstMatch(homepage, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
const sitemapHomepageModified = firstMatch(
  sitemapSource,
  new RegExp(`<loc>${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/<\\/loc>\\s*<lastmod>(\\d{4}-\\d{2}-\\d{2})<\\/lastmod>`)
);
if (!homepageModified || homepageModified !== sitemapHomepageModified) {
  errors.push(`homepage dateModified (${homepageModified || 'missing'}) does not match sitemap lastmod (${sitemapHomepageModified || 'missing'})`);
}
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

for (const id of ['page-products', 'page-detail', 'page-search']) {
  const openingTag = homepage.match(new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'))?.[0] ?? '';
  if (!openingTag.includes('data-nosnippet')) errors.push(`homepage ${id} is missing data-nosnippet`);
}
for (const id of ['page-about', 'page-oem', 'page-news', 'page-newsdetail', 'page-contact']) {
  if (new RegExp(`\\bid=["']${id}["']`, 'i').test(homepage)) {
    errors.push(`homepage contains legacy duplicate content container ${id}`);
  }
}
const homepageBytes = Buffer.byteLength(homepage, 'utf8');
if (homepageBytes > 215_000) errors.push(`homepage HTML is ${homepageBytes} bytes; expected no more than 215000`);
for (const id of ['modal-quote', 'modal-sample']) {
  const openingTag = homepage.match(new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'))?.[0] ?? '';
  if (!openingTag.includes('data-nosnippet')) errors.push(`homepage ${id} is missing data-nosnippet`);
}
const homepageFooterTag = homepage.match(/<footer\b[^>]*>/i)?.[0] ?? '';
if (!homepageFooterTag.includes('data-nosnippet')) errors.push('homepage footer is missing data-nosnippet');
if (!homepage.includes('https://glorystarpack.en.alibaba.com/')) {
  errors.push('homepage Organization schema is missing the verified Alibaba sameAs URL');
}

const aboutPage = pageRecords.find(record => record.rel === 'about/index.html');
const contactPage = pageRecords.find(record => record.rel === 'contact/index.html');
if (!aboutPage) errors.push('missing about/index.html');
else {
  if (!hasSchemaType(aboutPage.source, 'AboutPage')) errors.push('about/index.html: missing AboutPage schema');
  if (!hasSchemaType(aboutPage.source, 'Organization')) errors.push('about/index.html: missing Organization schema');
  if (!hasSchemaType(aboutPage.source, 'FAQPage')) errors.push('about/index.html: missing FAQPage schema');
  if (!aboutPage.source.includes('https://glorystarpack.en.alibaba.com/')) errors.push('about/index.html: missing Organization sameAs URL');
  if (!aboutPage.source.includes('id="packaging-desk"')) errors.push('about/index.html: missing Packaging Desk editorial policy section');
  if (!aboutPage.source.includes('https://www.glorystarpack.com/#packaging-desk')) errors.push('about/index.html: missing Packaging Desk entity');
  if (!aboutPage.source.includes('Editorial and source policy')) errors.push('about/index.html: missing editorial and source policy label');
}
if (!contactPage) errors.push('missing contact/index.html');
else {
  if (!hasSchemaType(contactPage.source, 'ContactPage')) errors.push('contact/index.html: missing ContactPage schema');
  if (!hasSchemaType(contactPage.source, 'ContactPoint')) errors.push('contact/index.html: missing ContactPoint schema');
  if (!contactPage.source.includes('id="rfq-form"')) errors.push('contact/index.html: missing RFQ builder');
  if (!contactPage.source.includes('Website page: ${sourceUrl.href}')) errors.push('contact/index.html: RFQ builder does not preserve the source URL');
  if (!contactPage.source.includes('Original interest page: ${attributedSourcePage}')) errors.push('contact/index.html: RFQ builder does not preserve the original landing-page attribution');
  if (!contactPage.source.includes('data-inquiry-type="rfq-builder"')) errors.push('contact/index.html: RFQ actions are missing future analytics attributes');
  if (!contactPage.source.includes('https://glorystarpack.en.alibaba.com/')) errors.push('contact/index.html: missing Organization sameAs URL');
}

const robotsSource = fs.readFileSync(path.join(rootDir, 'robots.txt'), 'utf8');
if (!/User-agent:\s*OAI-SearchBot[\s\S]*?Allow:\s*\//i.test(robotsSource)) {
  errors.push('robots.txt does not explicitly allow OAI-SearchBot');
}
if (!robotsSource.includes(`Sitemap: ${siteUrl}/image-sitemap.xml`)) {
  errors.push('robots.txt is missing the image sitemap declaration');
}
if (!robotsSource.includes(`Sitemap: ${siteUrl}/feed.xml`)) {
  errors.push('robots.txt is missing the RSS feed declaration');
}

const vercelIgnoreSource = fs.readFileSync(path.join(rootDir, '.vercelignore'), 'utf8');
for (const ignoredPath of ['data/', 'scripts/', '.github/', 'glorystarpack (1).html']) {
  if (!vercelIgnoreSource.split(/\r?\n/).includes(ignoredPath)) errors.push(`.vercelignore is missing ${ignoredPath}`);
}

const releaseWorkflowPath = path.join(rootDir, '.github/workflows/seo-check.yml');
if (!fs.existsSync(releaseWorkflowPath)) {
  errors.push('missing .github/workflows/seo-check.yml');
} else {
  const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, 'utf8');
  for (const command of [
    'node scripts/check-seo.mjs',
    'node scripts/audit-content.mjs',
    'node scripts/optimize-image-tags.mjs',
    'node scripts/enforce-accessible-colors.mjs --check'
  ]) {
    if (!releaseWorkflow.includes(command)) errors.push(`SEO workflow is missing ${command}`);
  }
}

const liveCheckPath = path.join(rootDir, 'scripts/check-live-site.mjs');
if (!fs.existsSync(liveCheckPath)) errors.push('missing scripts/check-live-site.mjs');

const llmsSource = fs.readFileSync(path.join(rootDir, 'llms.txt'), 'utf8');
if (!llmsSource.includes('https://glorystarpack.en.alibaba.com/')) {
  errors.push('llms.txt is missing the verified Alibaba supplier profile');
}
if (!llmsSource.includes('## Citation and Claim Boundaries')) {
  errors.push('llms.txt is missing citation and claim boundaries');
}
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
  for (const key of ['about', 'contact', 'productIndex', 'insights', 'rssFeed', 'compatibilityTestingGuide', 'pumpClosureGuide', 'pumpClosureCategory']) {
    if (!aiContext.site?.[key]) errors.push(`ai-context.json site.${key} is missing`);
  }
  if (aiContext.creator?.['@id'] !== `${siteUrl}/#packaging-desk`) {
    errors.push('ai-context.json creator is missing the Packaging Desk entity');
  }
  if (!aiContext.editorialPolicy?.sourceApproach || !aiContext.editorialPolicy?.limitation) {
    errors.push('ai-context.json is missing the Packaging Desk editorial policy');
  }
  if (!aiContext.publisher?.sameAs?.includes('https://glorystarpack.en.alibaba.com/')) {
    errors.push('ai-context.json publisher.sameAs is missing the verified Alibaba profile');
  }
  if (!Array.isArray(aiContext.claimBoundaries) || aiContext.claimBoundaries.length < 4) {
    errors.push('ai-context.json claimBoundaries must explain B2B offer, compatibility and evidence limits');
  }
} catch (error) {
  errors.push(`ai-context.json is invalid: ${error.message}`);
}

try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
  const headerValue = (source, key) => vercelConfig.headers
    ?.find(rule => rule.source === source)
    ?.headers?.find(header => header.key.toLowerCase() === key.toLowerCase())
    ?.value ?? '';
  for (const source of ['/assets/js/(.*)', '/assets/css/(.*)']) {
    const browserCache = headerValue(source, 'Cache-Control');
    const edgeCache = headerValue(source, 'Vercel-CDN-Cache-Control');
    if (!/max-age=(?:[1-9]\d*)/.test(browserCache)) errors.push(`vercel.json ${source}: browser cache must use a positive max-age`);
    if (!/max-age=31536000/.test(edgeCache)) errors.push(`vercel.json ${source}: missing long-lived Vercel CDN cache`);
  }
  const productPhotoCache = headerValue('/assets/product-photos/(.*)', 'Cache-Control');
  if (!/max-age=86400/.test(productPhotoCache)) errors.push('vercel.json product photos should use a one-day browser cache');
  for (const source of ['/robots.txt', '/sitemap.xml', '/image-sitemap.xml', '/llms.txt', '/ai-context.json']) {
    const browserCache = headerValue(source, 'Cache-Control');
    const edgeCache = headerValue(source, 'Vercel-CDN-Cache-Control');
    if (!/max-age=0/.test(browserCache) || !/must-revalidate/.test(browserCache)) {
      errors.push(`vercel.json ${source}: browser cache must revalidate discovery metadata`);
    }
    if (!/max-age=300/.test(edgeCache)) errors.push(`vercel.json ${source}: edge cache should refresh within five minutes`);
  }
  const feedEdgeCache = headerValue('/feed.xml', 'Vercel-CDN-Cache-Control');
  if (!/max-age=3600/.test(feedEdgeCache)) errors.push('vercel.json RSS feed should use a one-hour Vercel CDN cache');
  const indexNowCache = headerValue(`/${indexNowKeyFileName}`, 'Vercel-CDN-Cache-Control');
  if (!/max-age=31536000/.test(indexNowCache)) errors.push('vercel.json IndexNow key should use long-lived CDN caching');
} catch (error) {
  errors.push(`vercel.json is invalid: ${error.message}`);
}

const indexNowKeyPath = path.join(rootDir, indexNowKeyFileName);
if (!fs.existsSync(indexNowKeyPath)) {
  errors.push(`missing IndexNow key file ${indexNowKeyFileName}`);
} else if (fs.readFileSync(indexNowKeyPath, 'utf8').trim() !== indexNowKey) {
  errors.push(`IndexNow key file ${indexNowKeyFileName} does not match its filename`);
}
const indexNowScriptPath = path.join(rootDir, 'scripts/submit-indexnow.mjs');
if (!fs.existsSync(indexNowScriptPath)) {
  errors.push('missing scripts/submit-indexnow.mjs');
} else {
  const indexNowScript = fs.readFileSync(indexNowScriptPath, 'utf8');
  if (!indexNowScript.includes('https://api.indexnow.org/indexnow')) errors.push('IndexNow script is missing the shared API endpoint');
  if (!indexNowScript.includes('Deploy ${keyFileName} before submitting')) errors.push('IndexNow script does not verify the live key before submission');
  if (!indexNowScript.includes('urlList.length > 10_000')) errors.push('IndexNow script does not enforce the protocol batch limit');
}

const insightPages = pageRecords.filter(record => /^insights\/.+\/index\.html$/.test(record.rel));
const insightArticles = insightPages.filter(record => record.rel !== 'insights/index.html');
const decisionMatrixRows = new Map([
  ['insights/cosmetic-packaging-rfq-guide/index.html', 8],
  ['insights/cosmetic-packaging-compatibility-testing-guide/index.html', 7],
  ['insights/cosmetic-pump-closure-selection-guide/index.html', 6],
  ['insights/airless-pump-bottle-vs-jar-skincare-packaging/index.html', 5],
  ['insights/perfume-bottle-sourcing-small-brands/index.html', 5],
  ['insights/cosmetic-pump-not-working-troubleshooting/index.html', 6],
  ['insights/accessible-cosmetic-packaging-design-guide/index.html', 6]
]);
const approvedPrimarySourceHosts = new Set([
  'eur-lex.europa.eu',
  'store.astm.org',
  'www.fda.gov',
  'www.ftc.gov',
  'www.iso.org',
  'www.phmsa.dot.gov'
]);
if (insightArticles.length !== 19) errors.push(`expected 19 generated insight articles, found ${insightArticles.length}`);
for (const article of insightArticles) {
  if (!hasSchemaType(article.source, 'BlogPosting')) errors.push(`${article.rel}: missing BlogPosting schema`);
  if (!hasSchemaType(article.source, 'WebPage')) errors.push(`${article.rel}: missing WebPage schema`);
  if (!hasSchemaType(article.source, 'BreadcrumbList')) errors.push(`${article.rel}: missing BreadcrumbList schema`);
  if (!hasSchemaType(article.source, 'Organization')) errors.push(`${article.rel}: missing Organization schema`);
  if (!hasSchemaType(article.source, 'ContactPoint')) errors.push(`${article.rel}: missing publisher contact schema`);
  if (!article.source.includes('"citation"')) errors.push(`${article.rel}: missing machine-readable citation schema`);
  if (!article.source.includes('"primaryImageOfPage"')) errors.push(`${article.rel}: missing preferred-page image schema`);
  if (!article.source.includes('"author":{"@id":"https://www.glorystarpack.com/#packaging-desk"}')) {
    errors.push(`${article.rel}: BlogPosting author does not reference the Packaging Desk entity`);
  }
  if (!article.source.includes('"image":{"@type":"ImageObject"')) errors.push(`${article.rel}: article image is not a dimensional ImageObject`);
  if (!article.source.includes('"inLanguage":"en"')) errors.push(`${article.rel}: article schema is missing inLanguage`);
  if (!article.source.includes('"isAccessibleForFree":true')) errors.push(`${article.rel}: article schema is missing isAccessibleForFree`);
  if (!article.source.includes('href="/about/#packaging-desk">GloryStarPack Packaging Desk</a>')) {
    errors.push(`${article.rel}: visible byline does not link to the Packaging Desk policy`);
  }
  if (!article.source.includes('type="application/rss+xml" href="/feed.xml"')) errors.push(`${article.rel}: missing RSS discovery link`);
  const publishedTime = firstMatch(article.source, /<meta\b[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)/i);
  const modifiedTime = firstMatch(article.source, /<meta\b[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)/i);
  for (const [label, value] of [['published', publishedTime], ['modified', modifiedTime]]) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(value)) {
      errors.push(`${article.rel}: ${label} date is missing a full timestamp and timezone`);
    } else if (!article.source.includes(`<time datetime="${value}">`)) {
      errors.push(`${article.rel}: visible ${label} date does not match metadata`);
    }
  }
  const wordCount = Number(article.source.match(/"wordCount":(\d+)/)?.[1] ?? 0);
  if (wordCount < 150) errors.push(`${article.rel}: article wordCount is only ${wordCount}`);
  const resources = (article.source.match(/<aside class="article-sidebar"/g) ?? []).length;
  if (resources !== 1) errors.push(`${article.rel}: missing related resource sidebar`);
  const body = article.source.match(/<article class="article-body">([\s\S]*?)<\/article>/i)?.[1] ?? '';
  const citationUrls = [...body.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(match => match[1]);
  if (citationUrls.length < 2) errors.push(`${article.rel}: expected at least 2 external primary-source citations`);
  if (!/>Primary references and scope<\/h2>/.test(body)) errors.push(`${article.rel}: missing primary-reference section`);
  const toc = article.source.match(/<nav class="article-toc"[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? '';
  const sectionIds = [...body.matchAll(/<h2\b[^>]*\bid="([^"]+)"/gi)].map(match => match[1]);
  const tocTargets = [...toc.matchAll(/href="#([^"]+)"/gi)].map(match => match[1]);
  if (!toc) errors.push(`${article.rel}: missing article table of contents`);
  if (sectionIds.length < 4) errors.push(`${article.rel}: expected at least 4 anchored article sections, found ${sectionIds.length}`);
  if (new Set(sectionIds).size !== sectionIds.length) errors.push(`${article.rel}: duplicate article section IDs`);
  if (tocTargets.length !== sectionIds.length || tocTargets.some((target, index) => target !== sectionIds[index])) {
    errors.push(`${article.rel}: table of contents does not match article section order`);
  }
  if (decisionMatrixRows.has(article.rel)) {
    const expectedRows = decisionMatrixRows.get(article.rel);
    const matrix = article.source.match(/<div class="decision-table-scroll"[\s\S]*?<\/table><\/div>/i)?.[0] ?? '';
    const bodyRows = matrix.match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? '';
    const rowCount = (bodyRows.match(/<tr>/g) ?? []).length;
    if (!matrix) errors.push(`${article.rel}: missing decision matrix`);
    if (!matrix.includes('tabindex="0"') || !matrix.includes('<caption>')) errors.push(`${article.rel}: decision matrix is missing keyboard access or a caption`);
    if (rowCount !== expectedRows) errors.push(`${article.rel}: expected ${expectedRows} decision rows, found ${rowCount}`);
  }
  const heroImage = firstMatch(article.source, /<figure class=["']article-figure["']>[\s\S]*?<img\b[^>]*\bsrc=["']([^"']+)/i);
  if (!heroImage) {
    errors.push(`${article.rel}: missing article hero image`);
  } else {
    for (const width of [640, 1280]) {
      const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
      const variantPath = localAssetPath(variantUrl, article.filePath);
      if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${article.rel}: missing ${width}px AVIF article variant`);
      if (!article.source.includes(`${variantUrl} ${width}w`)) errors.push(`${article.rel}: AVIF srcset is missing ${width}px article variant`);
    }
    if (!imageSitemapSource.includes(`<image:loc>${siteUrl}${heroImage}</image:loc>`)) {
      errors.push(`${article.rel}: article image is missing from image-sitemap.xml`);
    }
  }
  const pictureCount = (article.source.match(/<picture>/g) ?? []).length;
  if (pictureCount < 4) errors.push(`${article.rel}: expected responsive pictures for the hero and related articles, found ${pictureCount}`);
  const imagePreload = article.source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${article.rel}: hero preload is not responsive AVIF`);
  }
  for (const citationUrl of citationUrls) {
    let hostname = '';
    try {
      hostname = new URL(citationUrl).hostname;
    } catch {
      errors.push(`${article.rel}: invalid external citation URL ${citationUrl}`);
      continue;
    }
    if (!approvedPrimarySourceHosts.has(hostname)) {
      errors.push(`${article.rel}: citation host is not in the primary-source allowlist (${hostname})`);
    }
  }
}

const feedPath = path.join(rootDir, 'feed.xml');
if (!fs.existsSync(feedPath)) {
  errors.push('missing feed.xml');
} else {
  const feedSource = fs.readFileSync(feedPath, 'utf8');
  if (!/<rss\b[^>]*version="2\.0"/.test(feedSource)) errors.push('feed.xml is not an RSS 2.0 feed');
  if (!feedSource.includes(`<atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>`)) {
    errors.push('feed.xml is missing its Atom self link');
  }
  const feedItems = [...feedSource.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  if (feedItems.length !== insightArticles.length) errors.push(`feed.xml expected ${insightArticles.length} items, found ${feedItems.length}`);
  for (const article of insightArticles) {
    if (!feedSource.includes(`<guid isPermaLink="true">${article.canonical}</guid>`)) {
      errors.push(`feed.xml is missing article ${article.canonical}`);
    }
  }
}

if (!/googletagmanager\.com|google-analytics\.com|gtag\(/i.test(homepage)) {
  warnings.push('a real GA4 measurement ID is not configured; inquiry_click events are ready in dataLayer but not yet collected remotely');
}

const insightIndex = pageRecords.find(record => record.rel === 'insights/index.html');
if (!insightIndex) errors.push('missing insights/index.html');
else {
  if (!hasSchemaType(insightIndex.source, 'CollectionPage')) errors.push('insights/index.html: missing CollectionPage schema');
  if (!hasSchemaType(insightIndex.source, 'ItemList')) errors.push('insights/index.html: missing ItemList schema');
  if (!hasSchemaType(insightIndex.source, 'Organization')) errors.push('insights/index.html: missing Organization schema');
  const footerCount = (insightIndex.source.match(/class="site-footer"/g) ?? []).length;
  if (footerCount !== 1) errors.push(`insights/index.html: expected 1 site footer, found ${footerCount}`);
  const indexPictureCount = (insightIndex.source.match(/<picture>/g) ?? []).length;
  if (indexPictureCount !== insightArticles.length) errors.push(`insights/index.html: expected ${insightArticles.length} responsive article pictures, found ${indexPictureCount}`);
  if (!insightIndex.source.includes('type="application/rss+xml" href="/feed.xml"')) errors.push('insights/index.html: missing RSS discovery link');
}

const productIndex = pageRecords.find(record => record.rel === 'products/product-index/index.html');
if (!productIndex) errors.push('missing products/product-index/index.html');
else {
  if (!hasSchemaType(productIndex.source, 'CollectionPage')) errors.push('products/product-index/index.html: missing CollectionPage schema');
  if (!hasSchemaType(productIndex.source, 'ItemList')) errors.push('products/product-index/index.html: missing ItemList schema');
  if (!hasSchemaType(productIndex.source, 'Organization')) errors.push('products/product-index/index.html: missing Organization schema');
  if (!hasSchemaType(productIndex.source, 'WebSite')) errors.push('products/product-index/index.html: missing WebSite schema');
  if (!productIndex.source.includes('https://glorystarpack.en.alibaba.com/')) errors.push('products/product-index/index.html: missing Organization sameAs URL');
  const indexPictureCount = (productIndex.source.match(/<picture>/g) ?? []).length;
  if (indexPictureCount !== productPages.length) errors.push(`products/product-index/index.html: expected ${productPages.length} responsive product pictures, found ${indexPictureCount}`);
}

const glassGuideHub = pageRecords.find(record => record.rel === 'glass-bottle-buying-guides/index.html');
if (!glassGuideHub) errors.push('missing glass-bottle-buying-guides/index.html');
else {
  if (!hasSchemaType(glassGuideHub.source, 'CollectionPage')) errors.push('glass-bottle-buying-guides/index.html: missing CollectionPage schema');
  if (!hasSchemaType(glassGuideHub.source, 'ItemList')) errors.push('glass-bottle-buying-guides/index.html: missing ItemList schema');
  if (!hasSchemaType(glassGuideHub.source, 'FAQPage')) errors.push('glass-bottle-buying-guides/index.html: missing FAQPage schema');
  if (!hasSchemaType(glassGuideHub.source, 'BreadcrumbList')) errors.push('glass-bottle-buying-guides/index.html: missing BreadcrumbList schema');
  if (!hasSchemaType(glassGuideHub.source, 'Organization')) errors.push('glass-bottle-buying-guides/index.html: missing Organization schema');
  if (!glassGuideHub.source.includes('type="image/avif"') || !glassGuideHub.source.includes('imagesrcset=')) {
    errors.push('glass-bottle-buying-guides/index.html: hero is not responsive AVIF');
  }
}

const homepageInsightLinks = new Set(
  [...homepage.matchAll(/href=["'](\/insights\/[^"']+\/)["']/g)].map(match => match[1])
);
if (homepageInsightLinks.size < 6) errors.push(`homepage exposes only ${homepageInsightLinks.size} crawlable insight links`);
for (const requiredPath of [
  '/insights/cosmetic-packaging-compatibility-testing-guide/',
  '/insights/cosmetic-pump-closure-selection-guide/',
  '/insights/cosmetic-packaging-rfq-guide/'
]) {
  if (!homepageInsightLinks.has(requiredPath)) errors.push(`homepage is missing priority insight link ${requiredPath}`);
}

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
const mainJsSource = fs.readFileSync(path.join(rootDir, 'assets/js/main.js'), 'utf8');
const inquiryJsSource = fs.readFileSync(path.join(rootDir, 'assets/js/inquiry-conversion.js'), 'utf8');
const inquiryCssSource = fs.readFileSync(path.join(rootDir, 'assets/css/inquiry-conversion.css'), 'utf8');
const productCssSource = fs.readFileSync(path.join(rootDir, 'assets/css/product-page.css'), 'utf8');
const insightCssSource = fs.readFileSync(path.join(rootDir, 'assets/css/insight-page.css'), 'utf8');
const mainJsBytes = Buffer.byteLength(mainJsSource);
const mainJsGzipBytes = gzipSync(mainJsSource).length;
if (!insightCssSource.includes('.decision-table-scroll:focus-visible')) {
  errors.push('assets/css/insight-page.css is missing a visible keyboard focus state for decision matrices');
}
if (!mainJsSource.includes('function csEnsureBackground')) {
  errors.push('assets/js/main.js is missing deferred carousel image loading');
}
if (!mainJsSource.includes('function enhanceKeyboardControls')) {
  errors.push('assets/js/main.js is missing keyboard enhancement for custom interactive controls');
}
if (!mainJsSource.includes('function currentWebsitePage') || !mainJsSource.includes('Website page: ${currentWebsitePage()}')) {
  errors.push('assets/js/main.js inquiry builders do not preserve the website-page source');
}
for (const requiredMarker of ['inquiry_click', 'dataLayer.push', 'data-source-page', 'gsp:inquiry-click']) {
  if (!inquiryJsSource.includes(requiredMarker)) errors.push(`assets/js/inquiry-conversion.js is missing ${requiredMarker}`);
}
if (!inquiryCssSource.includes('.gsp-inquiry-dock') || !inquiryCssSource.includes(':focus-visible')) {
  errors.push('assets/css/inquiry-conversion.css is missing the dock or keyboard focus styles');
}
if (/--gsp-inquiry-gold:\s*#c8a96e/i.test(inquiryCssSource)) {
  errors.push('assets/css/inquiry-conversion.css uses a non-AA button background color');
}
for (const requiredMarker of ['background: var(--gold-dark)', '.rfq .eyebrow', 'text-decoration-thickness: 1px']) {
  if (!productCssSource.includes(requiredMarker)) errors.push(`assets/css/product-page.css is missing accessibility marker ${requiredMarker}`);
}
if (/SpeakableSpecification|["']speakable["']\s*:/.test(homepage)) {
  errors.push('homepage uses Speakable markup even though it is not a topical news page');
}
for (const obsoleteSchemaMarker of [
  'installProductItemListSchema',
  'installCurrentProductSchema',
  'installCategorySchema',
  'product-itemlist-schema',
  'current-product-schema',
  'category-schema'
]) {
  if (mainJsSource.includes(obsoleteSchemaMarker)) {
    errors.push(`assets/js/main.js still contains obsolete hash-route schema marker ${obsoleteSchemaMarker}`);
  }
}
if (/['"]@type['"]\s*:\s*['"]Offer['"]|schema\.org\/InStock/.test(mainJsSource)) {
  errors.push('assets/js/main.js contains an unsupported dynamic Product offer claim');
}
if (!mainJsSource.includes("['products', 'detail', 'search'].includes(page)")
  || !mainJsSource.includes("robots = 'noindex, follow, max-image-preview:large'")) {
  errors.push('assets/js/main.js does not keep internal hash-route views out of the index');
}
if (!mainJsSource.includes("canonical = 'https://www.glorystarpack.com/products/product-index/'")
  || !mainJsSource.includes('const detailCanonical = staticProductUrl')) {
  errors.push('assets/js/main.js does not canonicalize hash product details to crawlable static URLs');
}
if (!mainJsSource.includes("meta[name=\"twitter:title\"]")
  || !mainJsSource.includes('const productImageUrl =')) {
  errors.push('assets/js/main.js does not keep product social metadata aligned with the selected detail');
}
if (mainJsBytes > 108_000 || mainJsGzipBytes > 25_000) {
  errors.push(`assets/js/main.js startup payload regressed to ${mainJsBytes} raw bytes / ${mainJsGzipBytes} gzip bytes`);
}
const trustPanelCount = (homepage.match(/<div class="why-split-left">/g) ?? []).length;
if (trustPanelCount !== 1) errors.push(`homepage expected 1 trust-panel opening element, found ${trustPanelCount}`);
for (const [id, channel, type] of [
  ['quoteEmailSubmit', 'email', 'quote'],
  ['quoteWhatsAppSubmit', 'whatsapp', 'quote'],
  ['sampleEmailSubmit', 'email', 'sample'],
  ['sampleWhatsAppSubmit', 'whatsapp', 'sample']
]) {
  const tag = homepage.match(new RegExp(`<a\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i'))?.[0] ?? '';
  if (!tag.includes(`data-inquiry-channel="${channel}"`) || !tag.includes(`data-inquiry-type="${type}"`)) {
    errors.push(`homepage ${id} is missing inquiry attribution attributes`);
  }
}
if (!homepage.includes('type="application/rss+xml" href="/feed.xml"')) errors.push('homepage is missing RSS discovery');
if (!homepage.includes('.dd-link:focus-visible,.sb-link:focus-visible,.helper-item:focus-visible')) {
  errors.push('homepage is missing visible focus styles for custom interactive controls');
}

console.log(`Checked ${pageRecords.length} HTML pages, ${sitemapUrls.length} sitemap URLs, ${productPages.length} product pages and ${insightArticles.length} insight articles.`);
console.log(`Homepage crawlable product links: ${homepageProductLinks.size}.`);
console.log(`Homepage crawlable insight links: ${homepageInsightLinks.size}.`);
console.log(`Homepage startup JavaScript: ${mainJsBytes} raw bytes / ${mainJsGzipBytes} gzip bytes.`);
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
