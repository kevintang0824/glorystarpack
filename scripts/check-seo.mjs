import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { INSIGHT_SOURCE } from '../data/insight-source.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const retiredAirlessPath = '/products/airless-bottles/';
const primaryAirlessPath = '/products/airless-pump-bottles/';
const googleTagId = 'G-NYY1MTZ6HM';
const indexNowKey = 'f5c6d8e91a2b47c0ad74e69321fb805e';
const indexNowKeyFileName = `${indexNowKey}.txt`;
const ignoredDirectories = new Set(['.git', '.vercel', 'backups', 'node_modules', 'tmp']);
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
  const googleTagLoader = `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`;
  const googleTagLoaderCount = source.split(googleTagLoader).length - 1;
  const googleTagConfigMarker = `window.gtag('config', '${googleTagId}')`;
  const googleTagConfigCount = source.split(googleTagConfigMarker).length - 1;
  if (googleTagLoaderCount !== 1) errors.push(`${rel}: expected 1 Google tag loader for ${googleTagId}, found ${googleTagLoaderCount}`);
  if (googleTagConfigCount !== 1) errors.push(`${rel}: expected 1 GA4 configuration for ${googleTagId}, found ${googleTagConfigCount}`);
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
if (uniqueSitemapUrls.has(`${siteUrl}${retiredAirlessPath}`)) {
  errors.push(`sitemap.xml must not include the redirected ${retiredAirlessPath} URL`);
}

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

const retiredAirlessPage = pageRecords.find(record => record.rel === 'products/airless-bottles/index.html');
if (!retiredAirlessPage) errors.push('missing noindex fallback for the redirected airless category');
else if (retiredAirlessPage.indexable) errors.push(`${retiredAirlessPage.rel}: redirected fallback must be noindex`);
for (const record of pageRecords.filter(item => item.indexable)) {
  if (record.source.includes(`href="${retiredAirlessPath}"`)) {
    errors.push(`${record.rel}: internal link still points to redirected ${retiredAirlessPath}`);
  }
}

const imageSitemapSource = fs.readFileSync(path.join(rootDir, 'image-sitemap.xml'), 'utf8');
if (!imageSitemapSource.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
  errors.push('image-sitemap.xml is missing the Google image namespace');
}
if (imageSitemapSource.includes(`<loc>${siteUrl}${retiredAirlessPath}</loc>`)) {
  errors.push(`image-sitemap.xml must not include the redirected ${retiredAirlessPath} URL`);
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
  const structuredModified = firstMatch(productPage.source, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  const visibleModified = firstMatch(productPage.source, /Updated\s+(\d{4}-\d{2}-\d{2})/);
  const escapedCanonical = productPage.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sitemapModified = firstMatch(
    sitemapSource,
    new RegExp(`<loc>${escapedCanonical}<\\/loc>\\s*<lastmod>(\\d{4}-\\d{2}-\\d{2})<\\/lastmod>`)
  );
  if (!structuredModified || structuredModified !== visibleModified || structuredModified !== sitemapModified) {
    errors.push(`${productPage.rel}: structured, visible and sitemap modified dates are not synchronized`);
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

const aluminumCansPage = pageRecords.find(record => record.rel === 'products/aluminum-cosmetic-cans/index.html');
if (!aluminumCansPage) {
  errors.push('missing products/aluminum-cosmetic-cans/index.html');
} else {
  const source = aluminumCansPage.source;
  if (!hasSchemaType(source, 'CollectionPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${aluminumCansPage.rel}: missing CollectionPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'ItemList')) errors.push(`${aluminumCansPage.rel}: unverified service ItemList schema must not return`);
  const heroImage = firstMatch(source, /<div class=["']hero-img["']>[\s\S]*?<img\b[^>]*\bsrc=["']([^"']+)/i);
  if (heroImage !== '/assets/product-photos/p155-0.jpg') {
    errors.push(`${aluminumCansPage.rel}: unexpected hero image ${heroImage || 'missing'}`);
  } else {
    for (const width of [480, 960]) {
      const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
      const variantPath = localAssetPath(variantUrl, aluminumCansPage.filePath);
      if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${aluminumCansPage.rel}: missing ${width}px AVIF hero variant`);
      if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${aluminumCansPage.rel}: AVIF srcset is missing ${width}px hero variant`);
    }
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${aluminumCansPage.rel}: hero preload is not responsive AVIF`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Aluminum cosmetic can route comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${aluminumCansPage.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['aluminum-cans-hero', 'aluminum-cans-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${aluminumCansPage.rel}: missing ${location} RFQ attribution`);
  }
  for (const unsupportedClaim of ['7-10 working days', '15-20 working days', 'recyclable metal packaging', 'Factory-direct supply', 'areaServed":"Worldwide']) {
    if (source.includes(unsupportedClaim)) errors.push(`${aluminumCansPage.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const collection = graph.find(node => node['@type'] === 'CollectionPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = collection?.dateModified ?? '';
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${aluminumCansPage.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 3) errors.push(`${aluminumCansPage.rel}: expected 3 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<h3>${question}</h3>`) || !source.includes(`<p>${answer}</p>`)) {
        errors.push(`${aluminumCansPage.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${aluminumCansPage.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/products\/aluminum-cosmetic-cans\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${aluminumCansPage.rel}: sitemap and structured modified dates are not synchronized`);
  }
}

const airlessPumpPage = pageRecords.find(record => record.rel === 'products/airless-pump-bottles/index.html');
if (!airlessPumpPage) {
  errors.push('missing products/airless-pump-bottles/index.html');
} else {
  const source = airlessPumpPage.source;
  if (!hasSchemaType(source, 'CollectionPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${airlessPumpPage.rel}: missing CollectionPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'ItemList')) errors.push(`${airlessPumpPage.rel}: unverified service ItemList schema must not return`);
  const heroImage = firstMatch(source, /<picture>[^<]*<source[^>]*>\s*<img\b[^>]*\bsrc=["']([^"']+)/i);
  if (heroImage !== '/assets/brand/airless-packaging-collection-2026.jpg') {
    errors.push(`${airlessPumpPage.rel}: unexpected hero image ${heroImage || 'missing'}`);
  } else {
    for (const width of [480, 960]) {
      const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
      const variantPath = localAssetPath(variantUrl, airlessPumpPage.filePath);
      if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${airlessPumpPage.rel}: missing ${width}px AVIF hero variant`);
      if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${airlessPumpPage.rel}: AVIF srcset is missing ${width}px hero variant`);
    }
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${airlessPumpPage.rel}: hero preload is not responsive AVIF`);
  }
  if ((source.match(/fetchpriority=["']high["']/g) ?? []).length !== 1) {
    errors.push(`${airlessPumpPage.rel}: expected exactly one high-priority image`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Airless pump bottle route comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${airlessPumpPage.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['airless-hero', 'airless-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${airlessPumpPage.rel}: missing ${location} RFQ attribution`);
  }
  for (const unsupportedClaim of ['1,000-3,000 pcs', 'areaServed":"Worldwide', 'Airless Pump Bottles Manufacturer', 'OEM support:', 'oxygen-sensitive formulas']) {
    if (source.includes(unsupportedClaim)) errors.push(`${airlessPumpPage.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const directAnswer = firstMatch(source, /<p><strong>Short answer:<\/strong>([\s\S]*?)<\/p>/i);
  const directAnswerWords = directAnswer.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (directAnswerWords < 40 || directAnswerWords > 80) {
    errors.push(`${airlessPumpPage.rel}: direct answer must contain 40-80 words, found ${directAnswerWords}`);
  }
  const openGraphTitle = firstMatch(source, /<meta property=["']og:title["'] content=["']([^"']+)/i);
  const twitterTitle = firstMatch(source, /<meta name=["']twitter:title["'] content=["']([^"']+)/i);
  const openGraphDescription = firstMatch(source, /<meta property=["']og:description["'] content=["']([^"']+)/i);
  const twitterDescription = firstMatch(source, /<meta name=["']twitter:description["'] content=["']([^"']+)/i);
  if (openGraphTitle !== airlessPumpPage.title || twitterTitle !== airlessPumpPage.title) {
    errors.push(`${airlessPumpPage.rel}: social titles are not synchronized with the page title`);
  }
  if (openGraphDescription !== airlessPumpPage.description || twitterDescription !== airlessPumpPage.description) {
    errors.push(`${airlessPumpPage.rel}: social descriptions are not synchronized with the meta description`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const collection = graph.find(node => node['@type'] === 'CollectionPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = collection?.dateModified ?? '';
    if (collection?.name !== airlessPumpPage.title || collection?.description !== airlessPumpPage.description) {
      errors.push(`${airlessPumpPage.rel}: CollectionPage metadata is not synchronized`);
    }
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${airlessPumpPage.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 3) errors.push(`${airlessPumpPage.rel}: expected 3 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<h3>${question}</h3>`) || !source.includes(`<p>${answer}</p>`)) {
        errors.push(`${airlessPumpPage.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${airlessPumpPage.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/products\/airless-pump-bottles\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${airlessPumpPage.rel}: sitemap and structured modified dates are not synchronized`);
  }
}

const glassPackagingPage = pageRecords.find(record => record.rel === 'products/glass-packaging/index.html');
if (!glassPackagingPage) {
  errors.push('missing products/glass-packaging/index.html');
} else {
  const source = glassPackagingPage.source;
  if (!hasSchemaType(source, 'CollectionPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${glassPackagingPage.rel}: missing CollectionPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'ItemList') || hasSchemaType(source, 'Service')) {
    errors.push(`${glassPackagingPage.rel}: unverified ItemList or Service schema must not return`);
  }
  const heroImage = '/assets/brand/glass-complete-product-assortment-2026.jpg';
  for (const width of [480, 960]) {
    const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
    const variantPath = localAssetPath(variantUrl, glassPackagingPage.filePath);
    if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${glassPackagingPage.rel}: missing ${width}px AVIF hero variant`);
    if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${glassPackagingPage.rel}: preload srcset is missing ${width}px hero variant`);
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${glassPackagingPage.rel}: hero preload is not responsive AVIF`);
  }
  if (!source.includes('url("/assets/brand/glass-complete-product-assortment-2026-960.avif")')) {
    errors.push(`${glassPackagingPage.rel}: hero background does not use the optimized AVIF`);
  }
  if ((source.match(/fetchpriority=["']high["']/g) ?? []).length !== 1) {
    errors.push(`${glassPackagingPage.rel}: expected exactly one high-priority hero preload`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Glass packaging route comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${glassPackagingPage.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['glass-packaging-hero', 'glass-packaging-rfq-card', 'glass-packaging-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${glassPackagingPage.rel}: missing ${location} RFQ attribution`);
  }
  for (const unsupportedClaim of ['7-10 working days', '15-20 working days', '25-35 working days', 'Factory-direct', '1,000 pcs', '3,000 pcs', '5,000 pcs', 'Glass is best', 'Plastic is better']) {
    if (source.includes(unsupportedClaim)) errors.push(`${glassPackagingPage.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const directAnswer = firstMatch(source, /<p><strong>Short answer:<\/strong>([\s\S]*?)<\/p>/i);
  const directAnswerWords = directAnswer.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (directAnswerWords < 40 || directAnswerWords > 80) {
    errors.push(`${glassPackagingPage.rel}: direct answer must contain 40-80 words, found ${directAnswerWords}`);
  }
  const openGraphTitle = firstMatch(source, /<meta property=["']og:title["'] content=["']([^"']+)/i);
  const twitterTitle = firstMatch(source, /<meta name=["']twitter:title["'] content=["']([^"']+)/i);
  const openGraphDescription = firstMatch(source, /<meta property=["']og:description["'] content=["']([^"']+)/i);
  const twitterDescription = firstMatch(source, /<meta name=["']twitter:description["'] content=["']([^"']+)/i);
  if (openGraphTitle !== glassPackagingPage.title || twitterTitle !== glassPackagingPage.title) {
    errors.push(`${glassPackagingPage.rel}: social titles are not synchronized with the page title`);
  }
  if (openGraphDescription !== glassPackagingPage.description || twitterDescription !== glassPackagingPage.description) {
    errors.push(`${glassPackagingPage.rel}: social descriptions are not synchronized with the meta description`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const collection = graph.find(node => node['@type'] === 'CollectionPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = collection?.dateModified ?? '';
    if (collection?.name !== glassPackagingPage.title || collection?.description !== glassPackagingPage.description) {
      errors.push(`${glassPackagingPage.rel}: CollectionPage metadata is not synchronized`);
    }
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${glassPackagingPage.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 4) errors.push(`${glassPackagingPage.rel}: expected 4 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<summary>${question}</summary><p>${answer}</p>`)) {
        errors.push(`${glassPackagingPage.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${glassPackagingPage.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/products\/glass-packaging\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${glassPackagingPage.rel}: sitemap and structured modified dates are not synchronized`);
  }
}

const glassCosmeticPage = pageRecords.find(record => record.rel === 'products/glass-cosmetic-bottles/index.html');
if (!glassCosmeticPage) {
  errors.push('missing products/glass-cosmetic-bottles/index.html');
} else {
  const source = glassCosmeticPage.source;
  if (!hasSchemaType(source, 'CollectionPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${glassCosmeticPage.rel}: missing CollectionPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'ItemList') || hasSchemaType(source, 'Service')) {
    errors.push(`${glassCosmeticPage.rel}: unverified ItemList or Service schema must not return`);
  }
  const heroImage = '/assets/brand/glass-complete-product-assortment-2026.jpg';
  for (const width of [480, 960]) {
    const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
    const variantPath = localAssetPath(variantUrl, glassCosmeticPage.filePath);
    if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${glassCosmeticPage.rel}: missing ${width}px AVIF hero variant`);
    if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${glassCosmeticPage.rel}: responsive hero markup is missing ${width}px AVIF variant`);
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${glassCosmeticPage.rel}: hero preload is not responsive AVIF`);
  }
  if ((source.match(/fetchpriority=["']high["']/g) ?? []).length !== 1) {
    errors.push(`${glassCosmeticPage.rel}: expected exactly one high-priority hero image`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Glass cosmetic bottle route comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${glassCosmeticPage.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['glass-cosmetic-hero', 'glass-cosmetic-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${glassCosmeticPage.rel}: missing ${location} RFQ attribution`);
  }
  for (const unsupportedClaim of ['300-500 pcs', '7-10 working days', '15-20 working days', 'Factory-direct', 'areaServed":"Worldwide', 'Glass Cosmetic Bottles Supplier', 'worldwide shipping', 'OEM support:']) {
    if (source.includes(unsupportedClaim)) errors.push(`${glassCosmeticPage.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const directAnswer = firstMatch(source, /<h2 id=["']glass-cosmetic-route-title["']>[^<]+<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  const directAnswerWords = directAnswer.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (directAnswerWords < 40 || directAnswerWords > 80) {
    errors.push(`${glassCosmeticPage.rel}: direct answer must contain 40-80 words, found ${directAnswerWords}`);
  }
  const openGraphTitle = firstMatch(source, /<meta property=["']og:title["'] content=["']([^"']+)/i);
  const twitterTitle = firstMatch(source, /<meta name=["']twitter:title["'] content=["']([^"']+)/i);
  const openGraphDescription = firstMatch(source, /<meta property=["']og:description["'] content=["']([^"']+)/i);
  const twitterDescription = firstMatch(source, /<meta name=["']twitter:description["'] content=["']([^"']+)/i);
  if (openGraphTitle !== glassCosmeticPage.title || twitterTitle !== glassCosmeticPage.title) {
    errors.push(`${glassCosmeticPage.rel}: social titles are not synchronized with the page title`);
  }
  if (openGraphDescription !== glassCosmeticPage.description || twitterDescription !== glassCosmeticPage.description) {
    errors.push(`${glassCosmeticPage.rel}: social descriptions are not synchronized with the meta description`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const collection = graph.find(node => node['@type'] === 'CollectionPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = collection?.dateModified ?? '';
    if (collection?.name !== glassCosmeticPage.title || collection?.description !== glassCosmeticPage.description) {
      errors.push(`${glassCosmeticPage.rel}: CollectionPage metadata is not synchronized`);
    }
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${glassCosmeticPage.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 3) errors.push(`${glassCosmeticPage.rel}: expected 3 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<h3>${question}</h3><p>${answer}</p>`)) {
        errors.push(`${glassCosmeticPage.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${glassCosmeticPage.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/products\/glass-cosmetic-bottles\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${glassCosmeticPage.rel}: sitemap and structured modified dates are not synchronized`);
  }
}

const serumDropperPage = pageRecords.find(record => record.rel === 'products/serum-dropper-bottles/index.html');
if (!serumDropperPage) {
  errors.push('missing products/serum-dropper-bottles/index.html');
} else {
  const source = serumDropperPage.source;
  if (!hasSchemaType(source, 'CollectionPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${serumDropperPage.rel}: missing CollectionPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'ItemList') || hasSchemaType(source, 'Service')) {
    errors.push(`${serumDropperPage.rel}: unverified ItemList or Service schema must not return`);
  }
  const heroImage = '/assets/brand/glass-dropper-rollon-vials-2026.jpg';
  for (const width of [480, 960]) {
    const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
    const variantPath = localAssetPath(variantUrl, serumDropperPage.filePath);
    if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${serumDropperPage.rel}: missing ${width}px AVIF hero variant`);
    if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${serumDropperPage.rel}: responsive hero markup is missing ${width}px AVIF variant`);
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${serumDropperPage.rel}: hero preload is not responsive AVIF`);
  }
  if ((source.match(/fetchpriority=["']high["']/g) ?? []).length !== 1) {
    errors.push(`${serumDropperPage.rel}: expected exactly one high-priority hero image`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Serum dropper bottle route comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${serumDropperPage.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['serum-dropper-hero', 'serum-dropper-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${serumDropperPage.rel}: missing ${location} RFQ attribution`);
  }
  for (const productPath of [
    '/products/serum-dropper-bottle-glass-p7/',
    '/products/clear-glass-serum-dropper-bottle-p33/',
    '/products/boston-round-glass-dropper-bottle-p34/',
    '/products/child-resistant-glass-dropper-bottle-p131/'
  ]) {
    if (!source.includes(`href="${productPath}"`)) errors.push(`${serumDropperPage.rel}: missing catalog starting point ${productPath}`);
  }
  for (const unsupportedClaim of ['500 pcs', 'areaServed":"Worldwide', 'Serum Dropper Bottles Supplier', 'UV protection', 'UV-protective', 'Common sizes:', 'best when', 'Ideal for', 'Calibrated pipette', 'shortlist compatible']) {
    if (source.includes(unsupportedClaim)) errors.push(`${serumDropperPage.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const directAnswer = firstMatch(source, /<h2 id=["']dropper-route-title["']>[^<]+<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  const directAnswerWords = directAnswer.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (directAnswerWords < 40 || directAnswerWords > 80) {
    errors.push(`${serumDropperPage.rel}: direct answer must contain 40-80 words, found ${directAnswerWords}`);
  }
  const openGraphTitle = firstMatch(source, /<meta property=["']og:title["'] content=["']([^"']+)/i);
  const twitterTitle = firstMatch(source, /<meta name=["']twitter:title["'] content=["']([^"']+)/i);
  const openGraphDescription = firstMatch(source, /<meta property=["']og:description["'] content=["']([^"']+)/i);
  const twitterDescription = firstMatch(source, /<meta name=["']twitter:description["'] content=["']([^"']+)/i);
  if (openGraphTitle !== serumDropperPage.title || twitterTitle !== serumDropperPage.title) {
    errors.push(`${serumDropperPage.rel}: social titles are not synchronized with the page title`);
  }
  if (openGraphDescription !== serumDropperPage.description || twitterDescription !== serumDropperPage.description) {
    errors.push(`${serumDropperPage.rel}: social descriptions are not synchronized with the meta description`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const collection = graph.find(node => node['@type'] === 'CollectionPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = collection?.dateModified ?? '';
    if (collection?.name !== serumDropperPage.title || collection?.description !== serumDropperPage.description) {
      errors.push(`${serumDropperPage.rel}: CollectionPage metadata is not synchronized`);
    }
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${serumDropperPage.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 3) errors.push(`${serumDropperPage.rel}: expected 3 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<h3>${question}</h3><p>${answer}</p>`)) {
        errors.push(`${serumDropperPage.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${serumDropperPage.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/products\/serum-dropper-bottles\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${serumDropperPage.rel}: sitemap and structured modified dates are not synchronized`);
  }
}

const serumGuidePage = pageRecords.find(record => record.rel === 'serum-packaging-guide/index.html');
if (!serumGuidePage) {
  errors.push('missing serum-packaging-guide/index.html');
} else {
  const source = serumGuidePage.source;
  if (!hasSchemaType(source, 'WebPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${serumGuidePage.rel}: missing WebPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'Article') || hasSchemaType(source, 'ItemList') || hasSchemaType(source, 'Service')) {
    errors.push(`${serumGuidePage.rel}: unsupported Article, ItemList or Service schema must not return`);
  }
  const heroImage = '/assets/brand/skincare-packaging-application-2026.jpg';
  for (const width of [640, 1280]) {
    const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
    const variantPath = localAssetPath(variantUrl, serumGuidePage.filePath);
    if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${serumGuidePage.rel}: missing ${width}px AVIF hero variant`);
    if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${serumGuidePage.rel}: responsive hero markup is missing ${width}px AVIF variant`);
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${serumGuidePage.rel}: hero preload is not responsive AVIF`);
  }
  if ((source.match(/fetchpriority=["']high["']/g) ?? []).length !== 1) {
    errors.push(`${serumGuidePage.rel}: expected exactly one high-priority hero image`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Serum bottle packaging route comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${serumGuidePage.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['serum-guide-hero', 'serum-guide-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${serumGuidePage.rel}: missing ${location} RFQ attribution`);
  }
  for (const routePath of [
    '/products/serum-dropper-bottles/',
    '/products/airless-pump-bottles/',
    '/products/cosmetic-pumps-closures/',
    '/products/cosmetic-sample-packaging/'
  ]) {
    if (!source.includes(`href="${routePath}"`)) errors.push(`${serumGuidePage.rel}: missing route-specific link ${routePath}`);
  }
  for (const unsupportedClaim of ['300-500 pcs', 'Better protection from air and light', 'Less exposure during use', 'UV-protective', 'Common Sizes', 'Recommended Packaging', 'Which bottle is best for vitamin C or retinol serum?']) {
    if (source.includes(unsupportedClaim)) errors.push(`${serumGuidePage.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const directAnswer = firstMatch(source, /<h2 id=["']serum-route-title["']>[^<]+<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  const directAnswerWords = directAnswer.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (directAnswerWords < 40 || directAnswerWords > 80) {
    errors.push(`${serumGuidePage.rel}: direct answer must contain 40-80 words, found ${directAnswerWords}`);
  }
  const openGraphTitle = firstMatch(source, /<meta property=["']og:title["'] content=["']([^"']+)/i);
  const twitterTitle = firstMatch(source, /<meta name=["']twitter:title["'] content=["']([^"']+)/i);
  const openGraphDescription = firstMatch(source, /<meta property=["']og:description["'] content=["']([^"']+)/i);
  const twitterDescription = firstMatch(source, /<meta name=["']twitter:description["'] content=["']([^"']+)/i);
  if (openGraphTitle !== serumGuidePage.title || twitterTitle !== serumGuidePage.title) {
    errors.push(`${serumGuidePage.rel}: social titles are not synchronized with the page title`);
  }
  if (openGraphDescription !== serumGuidePage.description || twitterDescription !== serumGuidePage.description) {
    errors.push(`${serumGuidePage.rel}: social descriptions are not synchronized with the meta description`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const webpage = graph.find(node => node['@type'] === 'WebPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = webpage?.dateModified ?? '';
    if (webpage?.name !== serumGuidePage.title || webpage?.description !== serumGuidePage.description) {
      errors.push(`${serumGuidePage.rel}: WebPage metadata is not synchronized`);
    }
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${serumGuidePage.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 3) errors.push(`${serumGuidePage.rel}: expected 3 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<h3>${question}</h3><p>${answer}</p>`)) {
        errors.push(`${serumGuidePage.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${serumGuidePage.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/serum-packaging-guide\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${serumGuidePage.rel}: sitemap and structured modified dates are not synchronized`);
  }
}

const airlessDropperGuide = pageRecords.find(record => record.rel === 'airless-bottle-vs-dropper-bottle/index.html');
if (!airlessDropperGuide) {
  errors.push('missing airless-bottle-vs-dropper-bottle/index.html');
} else {
  const source = airlessDropperGuide.source;
  if (!hasSchemaType(source, 'WebPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${airlessDropperGuide.rel}: missing WebPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'Article') || hasSchemaType(source, 'ItemList') || hasSchemaType(source, 'Service')) {
    errors.push(`${airlessDropperGuide.rel}: unsupported Article, ItemList or Service schema must not return`);
  }
  const heroImage = '/assets/brand/skincare-packaging-application-2026.jpg';
  for (const width of [640, 1280]) {
    const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
    const variantPath = localAssetPath(variantUrl, airlessDropperGuide.filePath);
    if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${airlessDropperGuide.rel}: missing ${width}px AVIF hero variant`);
    if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${airlessDropperGuide.rel}: responsive hero markup is missing ${width}px AVIF variant`);
  }
  if (source.includes('/assets/product-photos/p20-0.jpg')) {
    errors.push(`${airlessDropperGuide.rel}: unrelated tube image must not return as the comparison hero`);
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${airlessDropperGuide.rel}: hero preload is not responsive AVIF`);
  }
  if ((source.match(/fetchpriority=["']high["']/g) ?? []).length !== 1) {
    errors.push(`${airlessDropperGuide.rel}: expected exactly one high-priority hero image`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Airless bottle and dropper evidence comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${airlessDropperGuide.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['airless-dropper-hero', 'airless-dropper-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${airlessDropperGuide.rel}: missing ${location} RFQ attribution`);
  }
  for (const routePath of ['/products/airless-pump-bottles/', '/products/serum-dropper-bottles/', '/serum-packaging-guide/']) {
    if (!source.includes(`href="${routePath}"`)) errors.push(`${airlessDropperGuide.rel}: missing route-specific link ${routePath}`);
  }
  for (const unsupportedClaim of ['less air exposure', 'less contamination risk', 'oxygen-sensitive formulas', 'UV-protective', 'Better for reducing repeated air contact', 'Good for many oils', 'Choose Airless For', 'Choose Dropper For', 'Consistent pump output', 'Formula protection', 'Capacity: 10 ml']) {
    if (source.includes(unsupportedClaim)) errors.push(`${airlessDropperGuide.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const directAnswer = firstMatch(source, /<h2 id=["']airless-dropper-title["']>[^<]+<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  const directAnswerWords = directAnswer.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (directAnswerWords < 40 || directAnswerWords > 80) {
    errors.push(`${airlessDropperGuide.rel}: direct answer must contain 40-80 words, found ${directAnswerWords}`);
  }
  const openGraphTitle = firstMatch(source, /<meta property=["']og:title["'] content=["']([^"']+)/i);
  const twitterTitle = firstMatch(source, /<meta name=["']twitter:title["'] content=["']([^"']+)/i);
  const openGraphDescription = firstMatch(source, /<meta property=["']og:description["'] content=["']([^"']+)/i);
  const twitterDescription = firstMatch(source, /<meta name=["']twitter:description["'] content=["']([^"']+)/i);
  if (openGraphTitle !== airlessDropperGuide.title || twitterTitle !== airlessDropperGuide.title) {
    errors.push(`${airlessDropperGuide.rel}: social titles are not synchronized with the page title`);
  }
  if (openGraphDescription !== airlessDropperGuide.description || twitterDescription !== airlessDropperGuide.description) {
    errors.push(`${airlessDropperGuide.rel}: social descriptions are not synchronized with the meta description`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const webpage = graph.find(node => node['@type'] === 'WebPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = webpage?.dateModified ?? '';
    if (webpage?.name !== airlessDropperGuide.title || webpage?.description !== airlessDropperGuide.description) {
      errors.push(`${airlessDropperGuide.rel}: WebPage metadata is not synchronized`);
    }
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${airlessDropperGuide.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 3) errors.push(`${airlessDropperGuide.rel}: expected 3 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<h3>${question}</h3><p>${answer}</p>`)) {
        errors.push(`${airlessDropperGuide.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${airlessDropperGuide.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/airless-bottle-vs-dropper-bottle\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${airlessDropperGuide.rel}: sitemap and structured modified dates are not synchronized`);
  }
}

const sunscreenGuide = pageRecords.find(record => record.rel === 'sunscreen-packaging-guide/index.html');
if (!sunscreenGuide) {
  errors.push('missing sunscreen-packaging-guide/index.html');
} else {
  const source = sunscreenGuide.source;
  if (!hasSchemaType(source, 'WebPage') || !hasSchemaType(source, 'BreadcrumbList') || !hasSchemaType(source, 'FAQPage')) {
    errors.push(`${sunscreenGuide.rel}: missing WebPage, BreadcrumbList or FAQPage schema`);
  }
  if (hasSchemaType(source, 'Article') || hasSchemaType(source, 'ItemList') || hasSchemaType(source, 'Service')) {
    errors.push(`${sunscreenGuide.rel}: unsupported Article, ItemList or Service schema must not return`);
  }
  const heroImage = '/assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg';
  if (!source.includes(`src="${heroImage}"`)) errors.push(`${sunscreenGuide.rel}: expected sunscreen route-selection hero image is missing`);
  for (const width of [640, 1280]) {
    const variantUrl = heroImage.replace(/\.jpe?g$/i, `-${width}.avif`);
    const variantPath = localAssetPath(variantUrl, sunscreenGuide.filePath);
    if (!variantPath || !fs.existsSync(variantPath)) errors.push(`${sunscreenGuide.rel}: missing ${width}px AVIF hero variant`);
    if (!source.includes(`${variantUrl} ${width}w`)) errors.push(`${sunscreenGuide.rel}: responsive hero markup is missing ${width}px AVIF variant`);
  }
  const imagePreload = source.match(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/i)?.[0] ?? '';
  if (!imagePreload.includes('type="image/avif"') || !imagePreload.includes('imagesrcset=')) {
    errors.push(`${sunscreenGuide.rel}: hero preload is not responsive AVIF`);
  }
  if ((source.match(/fetchpriority=["']high["']/g) ?? []).length !== 1) {
    errors.push(`${sunscreenGuide.rel}: expected exactly one high-priority hero image`);
  }
  for (const marker of ['<caption>', 'scope="col"', 'aria-label="Sunscreen packaging route comparison"', '.table-scroll:focus-visible']) {
    if (!source.includes(marker)) errors.push(`${sunscreenGuide.rel}: accessible comparison table is missing ${marker}`);
  }
  for (const location of ['sunscreen-guide-hero', 'sunscreen-guide-decision']) {
    if (!source.includes(`data-inquiry-location="${location}"`)) errors.push(`${sunscreenGuide.rel}: missing ${location} RFQ attribution`);
  }
  for (const routePath of ['/products/cosmetic-tubes/', '/products/personal-care-packaging/', '/products/airless-pump-bottles/', '/products/cosmetic-sample-packaging/']) {
    if (!source.includes(`href="${routePath}"`)) errors.push(`${sunscreenGuide.rel}: missing route-specific link ${routePath}`);
  }
  for (const evidenceUrl of [
    'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun',
    'https://www.fda.gov/drugs/understanding-over-counter-medicines/over-counter-drug-facts-label'
  ]) {
    if (!source.includes(`href="${evidenceUrl}"`)) errors.push(`${sunscreenGuide.rel}: missing primary FDA evidence link ${evidenceUrl}`);
  }
  for (const unsupportedClaim of ['30-50 ml', '50-150 ml', '5-15 ml', 'Best For', 'reduced repeated air exposure', 'Tubes are usually better', 'Bottles are practical', 'Common options include', 'SPF tubes & Sticks']) {
    if (source.includes(unsupportedClaim)) errors.push(`${sunscreenGuide.rel}: unsupported claim remains: ${unsupportedClaim}`);
  }
  const directAnswer = firstMatch(source, /<h2 id=["']sunscreen-route-title["']>[^<]+<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  const directAnswerWords = directAnswer.match(/[A-Za-z0-9]+(?:[-’'][A-Za-z0-9]+)*/g)?.length ?? 0;
  if (directAnswerWords < 40 || directAnswerWords > 80) {
    errors.push(`${sunscreenGuide.rel}: direct answer must contain 40-80 words, found ${directAnswerWords}`);
  }
  const openGraphTitle = firstMatch(source, /<meta property=["']og:title["'] content=["']([^"']+)/i);
  const twitterTitle = firstMatch(source, /<meta name=["']twitter:title["'] content=["']([^"']+)/i);
  const openGraphDescription = firstMatch(source, /<meta property=["']og:description["'] content=["']([^"']+)/i);
  const twitterDescription = firstMatch(source, /<meta name=["']twitter:description["'] content=["']([^"']+)/i);
  if (openGraphTitle !== sunscreenGuide.title || twitterTitle !== sunscreenGuide.title) {
    errors.push(`${sunscreenGuide.rel}: social titles are not synchronized with the page title`);
  }
  if (openGraphDescription !== sunscreenGuide.description || twitterDescription !== sunscreenGuide.description) {
    errors.push(`${sunscreenGuide.rel}: social descriptions are not synchronized with the meta description`);
  }
  const schemaSource = firstMatch(source, /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  let structuredModified = '';
  try {
    const graph = JSON.parse(schemaSource)['@graph'] ?? [];
    const webpage = graph.find(node => node['@type'] === 'WebPage');
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    structuredModified = webpage?.dateModified ?? '';
    if (webpage?.name !== sunscreenGuide.title || webpage?.description !== sunscreenGuide.description) {
      errors.push(`${sunscreenGuide.rel}: WebPage metadata is not synchronized`);
    }
    const visibleModified = firstMatch(source, /Updated (\d{4}-\d{2}-\d{2})/);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(structuredModified) || visibleModified !== structuredModified) {
      errors.push(`${sunscreenGuide.rel}: structured and visible modified dates are not synchronized`);
    }
    const faqEntries = faq?.mainEntity ?? [];
    if (faqEntries.length !== 4) errors.push(`${sunscreenGuide.rel}: expected 4 synchronized FAQ entries, found ${faqEntries.length}`);
    for (const entry of faqEntries) {
      const question = entry.name ?? '';
      const answer = entry.acceptedAnswer?.text ?? '';
      if (!source.includes(`<h3>${question}</h3><p>${answer}</p>`)) {
        errors.push(`${sunscreenGuide.rel}: FAQPage is not synchronized with visible FAQ content`);
      }
    }
  } catch {
    errors.push(`${sunscreenGuide.rel}: could not parse page-specific JSON-LD`);
  }
  const sitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/sunscreen-packaging-guide\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (!sitemapModified || sitemapModified !== structuredModified) {
    errors.push(`${sunscreenGuide.rel}: sitemap and structured modified dates are not synchronized`);
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
const homepageProductDetailLinks = new Set(
  [...homepage.matchAll(/href=["'](\/products\/[^"']+-p\d+\/)["']/g)].map(match => match[1])
);
if (homepageProductDetailLinks.size < 4) {
  errors.push(`homepage exposes only ${homepageProductDetailLinks.size} crawlable individual product detail links`);
}
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
const homepageProductDetailShell = firstMatch(homepage, /<div\b[^>]*\bid=["']page-detail["'][^>]*>([\s\S]*?)<!-- Company, service, insight and contact content/i);
for (const unsupportedPlaceholder of [
  'Product Name',
  'All measurements ±2mm tolerance',
  'Custom mold development (15–20 days)',
  'Worldwide shipping via DHL, FedEx, UPS, sea or air freight',
  'Stock samples: 7–10 working days',
  'Bulk production: 25–35 working days'
]) {
  if (homepageProductDetailShell.includes(unsupportedPlaceholder)) {
    errors.push(`homepage product-detail shell exposes an unverified placeholder: ${unsupportedPlaceholder}`);
  }
}
for (const requiredId of ['det-tab-spec', 'det-tab-custom', 'det-tab-ship', 'det-finishes']) {
  if (!homepageProductDetailShell.includes(`id="${requiredId}"`)) {
    errors.push(`homepage product-detail shell is missing dynamic field ${requiredId}`);
  }
}
const homepageMainScript = fs.readFileSync(path.join(rootDir, 'assets/js/main.js'), 'utf8');
const homepageCatalogScript = fs.readFileSync(path.join(rootDir, 'assets/js/legacy-catalog.js'), 'utf8');
for (const unsupportedGenericTiming of ['7–10 working days', '25–35 days (bulk order)']) {
  if (`${homepageMainScript}\n${homepageCatalogScript}`.includes(unsupportedGenericTiming)) {
    errors.push(`homepage product-detail script exposes generic timing: ${unsupportedGenericTiming}`);
  }
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
  if (!contactPage.source.includes('action="/api/inquiry/"')) errors.push('contact/index.html: RFQ form does not target the server endpoint');
  if (!contactPage.source.includes('id="rfq-submit"')) errors.push('contact/index.html: missing secure RFQ submit button');
  if (!contactPage.source.includes("fetch('/api/inquiry/'")) errors.push('contact/index.html: RFQ form does not submit with fetch');
  if (!contactPage.source.includes("trackEvent('generate_lead'")) errors.push('contact/index.html: accepted RFQs do not send generate_lead');
  if (!contactPage.source.includes("trackEvent('rfq_form_start'")) errors.push('contact/index.html: missing explicit RFQ form-start measurement');
  if (!contactPage.source.includes("trackEvent('rfq_form_error'")) errors.push('contact/index.html: missing RFQ error measurement');
  if (!contactPage.source.includes('campaignSource')) errors.push('contact/index.html: missing campaign attribution');
  if (!contactPage.source.includes('name="website"')) errors.push('contact/index.html: missing RFQ honeypot field');
  if (!contactPage.source.includes('id="rfq-status"')) errors.push('contact/index.html: missing accessible RFQ status message');
  if (!contactPage.source.includes('Website page: ${sourceUrl.href}')) errors.push('contact/index.html: RFQ builder does not preserve the source URL');
  if (!contactPage.source.includes('Original interest page: ${attributedSourcePage}')) errors.push('contact/index.html: RFQ builder does not preserve the original landing-page attribution');
  if (!contactPage.source.includes('data-inquiry-type="rfq-builder"')) errors.push('contact/index.html: RFQ actions are missing future analytics attributes');
  if (!contactPage.source.includes('https://glorystarpack.en.alibaba.com/')) errors.push('contact/index.html: missing Organization sameAs URL');
}

const logoPrintingPage = pageRecords.find(record => record.rel === 'cosmetic-logo-printing-methods/index.html');
const decorationApprovalPage = pageRecords.find(record => record.rel === 'insights/cosmetic-packaging-decoration-methods/index.html');
const logoPrintingPath = '/cosmetic-logo-printing-methods/';
const decorationApprovalPath = '/insights/cosmetic-packaging-decoration-methods/';
if (!logoPrintingPage) {
  errors.push('missing cosmetic-logo-printing-methods/index.html');
} else {
  for (const requiredType of ['WebPage', 'Service', 'BreadcrumbList']) {
    if (!hasSchemaType(logoPrintingPage.source, requiredType)) {
      errors.push(`${logoPrintingPage.rel}: missing ${requiredType} schema for the commercial quote route`);
    }
  }
  for (const unsupportedType of ['Article', 'BlogPosting']) {
    if (hasSchemaType(logoPrintingPage.source, unsupportedType)) {
      errors.push(`${logoPrintingPage.rel}: commercial quote route must not use ${unsupportedType} schema`);
    }
  }
  if (!logoPrintingPage.source.includes('<h1>Custom Logo Printing for Cosmetic Packaging</h1>')) {
    errors.push(`${logoPrintingPage.rel}: missing quote-focused H1`);
  }
  if (!logoPrintingPage.source.includes(`href="${decorationApprovalPath}"`)) {
    errors.push(`${logoPrintingPage.rel}: missing link to the separate decoration testing guide`);
  }
  if (!logoPrintingPage.source.includes('<caption>Inputs needed to quote four common logo application routes</caption>')
    || (logoPrintingPage.source.match(/scope="col"/g) ?? []).length < 4) {
    errors.push(`${logoPrintingPage.rel}: quote comparison table is missing its caption or column scope`);
  }
  const logoModified = firstMatch(logoPrintingPage.source, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  const logoSitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/cosmetic-logo-printing-methods\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (logoModified !== '2026-08-28' || logoModified !== logoSitemapModified || !logoPrintingPage.source.includes('Updated 2026-08-28')) {
    errors.push(`${logoPrintingPage.rel}: visible, structured and sitemap modified dates are not synchronized`);
  }
}
if (!decorationApprovalPage) {
  errors.push('missing insights/cosmetic-packaging-decoration-methods/index.html');
} else {
  for (const requiredType of ['WebPage', 'BlogPosting', 'BreadcrumbList']) {
    if (!hasSchemaType(decorationApprovalPage.source, requiredType)) {
      errors.push(`${decorationApprovalPage.rel}: missing ${requiredType} schema for the technical guide`);
    }
  }
  if (hasSchemaType(decorationApprovalPage.source, 'Service')) {
    errors.push(`${decorationApprovalPage.rel}: technical guide must not use Service schema`);
  }
  if (!decorationApprovalPage.source.includes('<h1>How to Test and Approve Cosmetic Packaging Decoration</h1>')) {
    errors.push(`${decorationApprovalPage.rel}: missing testing-and-approval H1`);
  }
  if (!decorationApprovalPage.source.includes(`href="${logoPrintingPath}"`)) {
    errors.push(`${decorationApprovalPage.rel}: missing link to the separate logo printing quote route`);
  }
  for (const primarySource of ['https://store.astm.org/d3359-23.html', 'https://www.fda.gov/cosmetics/cosmetics-labeling-regulations/summary-cosmetics-labeling-requirements', 'https://www.iso.org/standard/36437.html']) {
    if (!decorationApprovalPage.source.includes(primarySource)) {
      errors.push(`${decorationApprovalPage.rel}: missing scoped primary reference ${primarySource}`);
    }
  }
  const decorationWordCount = Number(decorationApprovalPage.source.match(/"wordCount":(\d+)/)?.[1] ?? 0);
  if (decorationWordCount < 900) {
    errors.push(`${decorationApprovalPage.rel}: technical guide wordCount is only ${decorationWordCount}`);
  }
  const decorationModified = firstMatch(decorationApprovalPage.source, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})T/);
  const decorationSitemapModified = firstMatch(
    sitemapSource,
    /<loc>https:\/\/www\.glorystarpack\.com\/insights\/cosmetic-packaging-decoration-methods\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/
  );
  if (decorationModified !== '2026-08-28' || decorationModified !== decorationSitemapModified) {
    errors.push(`${decorationApprovalPage.rel}: structured and sitemap modified dates are not synchronized`);
  }
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
if (vercelIgnoreSource.split(/\r?\n/).includes('api/')) errors.push('.vercelignore must not exclude api/');

const inquiryApiPath = path.join(rootDir, 'api/inquiry.js');
if (!fs.existsSync(inquiryApiPath)) {
  errors.push('missing api/inquiry.js');
} else {
  const inquiryApiSource = fs.readFileSync(inquiryApiPath, 'utf8');
  for (const requiredFragment of [
    'process.env.RESEND_API_KEY',
    'https://api.resend.com/emails',
    "'Cache-Control', 'no-store, max-age=0'",
    'payload.website',
    'emailIsValid(payload.email)',
    "request.method !== 'POST'"
  ]) {
    if (!inquiryApiSource.includes(requiredFragment)) errors.push(`api/inquiry.js is missing safeguard: ${requiredFragment}`);
  }
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
if (llmsSource.includes(`${siteUrl}${retiredAirlessPath}`)) {
  errors.push(`llms.txt must not include the redirected ${retiredAirlessPath} URL`);
}
if (!llmsSource.includes('https://glorystarpack.en.alibaba.com/')) {
  errors.push('llms.txt is missing the verified Alibaba supplier profile');
}
if (!llmsSource.includes('## Citation and Claim Boundaries')) {
  errors.push('llms.txt is missing citation and claim boundaries');
}
for (const requiredRoute of [
  `Best logo printing quote route: ${siteUrl}${logoPrintingPath}`,
  `Best decoration testing and approval citation: ${siteUrl}${decorationApprovalPath}`
]) {
  if (!llmsSource.includes(requiredRoute)) errors.push(`llms.txt is missing split decoration route: ${requiredRoute}`);
}
if (llmsSource.includes(`Best logo decoration citation: ${siteUrl}${logoPrintingPath}`)) {
  errors.push('llms.txt still routes technical decoration citation intent to the commercial logo printing page');
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
  for (const key of ['about', 'contact', 'productIndex', 'insights', 'rssFeed', 'compatibilityTestingGuide', 'pumpClosureGuide', 'chinaSupplierVettingGuide', 'customPackagingCostGuide', 'glassBottleShippingGuide', 'pumpClosureCategory']) {
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
  const serumRouteMapping = aiContext.keywordMap?.find(entry => entry.queryGroup?.includes('serum packaging'));
  const expectedSerumRouteUrls = [`${siteUrl}/serum-packaging-guide/`];
  if (JSON.stringify(serumRouteMapping?.preferredUrls) !== JSON.stringify(expectedSerumRouteUrls)) {
    errors.push('ai-context.json serum packaging intent must resolve only to the serum packaging guide');
  }
  const airlessComparisonMapping = aiContext.keywordMap?.find(entry => entry.queryGroup?.includes('airless bottle vs dropper bottle'));
  const expectedAirlessComparisonUrls = [`${siteUrl}/airless-bottle-vs-dropper-bottle/`];
  if (JSON.stringify(airlessComparisonMapping?.preferredUrls) !== JSON.stringify(expectedAirlessComparisonUrls)) {
    errors.push('ai-context.json airless-vs-dropper intent must resolve only to the dedicated comparison guide');
  }
  const sunscreenRouteMapping = aiContext.keywordMap?.find(entry => entry.queryGroup?.includes('sunscreen packaging'));
  const expectedSunscreenRouteUrls = [`${siteUrl}/sunscreen-packaging-guide/`];
  if (JSON.stringify(sunscreenRouteMapping?.preferredUrls) !== JSON.stringify(expectedSunscreenRouteUrls)) {
    errors.push('ai-context.json sunscreen packaging intent must resolve only to the sunscreen packaging guide');
  }
  const logoPrintingRouteMapping = aiContext.keywordMap?.find(entry => entry.queryGroup?.includes('cosmetic logo printing'));
  const expectedLogoPrintingUrls = [`${siteUrl}${logoPrintingPath}`];
  if (JSON.stringify(logoPrintingRouteMapping?.preferredUrls) !== JSON.stringify(expectedLogoPrintingUrls)) {
    errors.push('ai-context.json logo-printing quote intent must resolve only to the commercial service page');
  }
  const decorationApprovalRouteMapping = aiContext.keywordMap?.find(entry => entry.queryGroup?.includes('cosmetic packaging decoration testing'));
  const expectedDecorationApprovalUrls = [`${siteUrl}${decorationApprovalPath}`];
  if (JSON.stringify(decorationApprovalRouteMapping?.preferredUrls) !== JSON.stringify(expectedDecorationApprovalUrls)) {
    errors.push('ai-context.json decoration testing intent must resolve only to the technical guide');
  }
  const logoPrintingDirectoryEntry = aiContext.pageMap?.find(entry => entry.url === `${siteUrl}${logoPrintingPath}`);
  const decorationApprovalDirectoryEntry = aiContext.pageMap?.find(entry => entry.url === `${siteUrl}${decorationApprovalPath}`);
  if (logoPrintingDirectoryEntry?.pageType !== 'service page' || logoPrintingDirectoryEntry?.primaryIntent !== 'cosmetic packaging logo printing quote') {
    errors.push('ai-context.json commercial logo printing page directory entry is not quote-specific');
  }
  if (decorationApprovalDirectoryEntry?.pageType !== 'technical buyer guide' || decorationApprovalDirectoryEntry?.primaryIntent !== 'cosmetic packaging decoration testing and approval') {
    errors.push('ai-context.json decoration approval page directory entry is not technical-guide specific');
  }
} catch (error) {
  errors.push(`ai-context.json is invalid: ${error.message}`);
}

try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
  const redirectFor = source => vercelConfig.redirects?.find(rule => rule.source === source);
  const rootIndexRedirect = redirectFor('/index.html');
  if (rootIndexRedirect?.destination !== '/' || rootIndexRedirect?.permanent !== true) {
    errors.push('vercel.json must permanently redirect /index.html to /');
  }
  const nestedIndexRedirect = redirectFor('/:path*/index.html');
  if (nestedIndexRedirect?.destination !== '/:path*/' || nestedIndexRedirect?.permanent !== true) {
    errors.push('vercel.json must permanently redirect nested index.html URLs to their clean directory URLs');
  }
  const airlessCategoryRedirect = redirectFor(retiredAirlessPath);
  if (airlessCategoryRedirect?.destination !== primaryAirlessPath || airlessCategoryRedirect?.permanent !== true) {
    errors.push(`vercel.json must permanently redirect ${retiredAirlessPath} to ${primaryAirlessPath}`);
  }
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
  ['insights/refill-pouches-reusable-bottles/index.html', 6],
  ['insights/cosmetic-packaging-rfq-guide/index.html', 8],
  ['insights/refill-ready-hotel-amenity-packaging/index.html', 6],
  ['insights/cosmetic-discovery-kit-packaging/index.html', 6],
  ['insights/cosmetic-packaging-compatibility-testing-guide/index.html', 7],
  ['insights/cosmetic-pump-closure-selection-guide/index.html', 6],
  ['insights/airless-pump-bottle-vs-jar-skincare-packaging/index.html', 5],
  ['insights/perfume-bottle-sourcing-small-brands/index.html', 5],
  ['insights/cosmetic-pump-not-working-troubleshooting/index.html', 6],
  ['insights/accessible-cosmetic-packaging-design-guide/index.html', 6],
  ['insights/cosmetic-packaging-product-evacuation-guide/index.html', 6],
  ['insights/travel-size-cosmetic-packaging-leak-testing-guide/index.html', 6],
  ['insights/body-butter-packaging-jars-tubes-tins-guide/index.html', 5],
  ['insights/cosmetic-packaging-right-sizing-guide/index.html', 6],
  ['insights/pcr-hdpe-personal-care-bottles/index.html', 6],
  ['insights/color-cosmetics-component-systems/index.html', 6],
  ['insights/molded-pulp-gift-box-inserts/index.html', 6],
  ['insights/cosmetic-packaging-tamper-evident-seals-guide/index.html', 6],
  ['insights/how-to-vet-cosmetic-packaging-supplier-china/index.html', 8],
  ['insights/custom-cosmetic-packaging-cost-hidden-fees/index.html', 8],
  ['insights/how-to-ship-glass-bottles-without-breaking/index.html', 8],
  ['insights/cosmetic-bottle-labels-peeling-adhesive-guide/index.html', 8],
  ['insights/dropper-bottle-leaking-seal-pipette-guide/index.html', 8]
]);
const approvedPrimarySourceHosts = new Set([
  'iccwbo.org',
  'seller.alibaba.com',
  'eur-lex.europa.eu',
  'store.astm.org',
  'www.samr.gov.cn',
  'www.help.cbp.gov',
  'www.fda.gov',
  'www.ftc.gov',
  'www.gov.uk',
  'www.iso.org',
  'ista.org',
  'support.ista.org',
  'www.phmsa.dot.gov',
  'www.trade.gov',
  'label.averydennison.com'
]);
const expectedInsightCount = Object.keys(INSIGHT_SOURCE).length;
if (insightArticles.length !== expectedInsightCount) {
  errors.push(`expected ${expectedInsightCount} generated insight articles, found ${insightArticles.length}`);
}
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
  const primaryReferencesBody = body.match(/<h2[^>]*>Primary references and scope<\/h2>([\s\S]*)$/i)?.[1] ?? '';
  const citationUrls = [...primaryReferencesBody.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(match => match[1]);
  if (citationUrls.length < 2) errors.push(`${article.rel}: expected at least 2 external primary-source citations`);
  if (!/>Primary references and scope<\/h2>/.test(body)) errors.push(`${article.rel}: missing primary-reference section`);
  const buyerQuestionSection = body.match(/<h2[^>]*>Buyer questions that shaped this guide<\/h2>([\s\S]*?)(?=<h2|$)/i)?.[1] ?? '';
  const redditSignals = [...buyerQuestionSection.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(match => match[1]);
  if (buyerQuestionSection) {
    if (!body.includes('These community discussions are demand signals, not technical or regulatory authorities.')) {
      errors.push(`${article.rel}: community discussion section is missing its source-boundary statement`);
    }
    if (redditSignals.length < 2) errors.push(`${article.rel}: community discussion section needs at least 2 demand signals`);
    for (const discussionUrl of redditSignals) {
      if (new URL(discussionUrl).hostname !== 'www.reddit.com') {
        errors.push(`${article.rel}: community demand signal is not a Reddit discussion (${discussionUrl})`);
      }
    }
  }
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
  if (!productIndex.source.includes('id="product-index-search"') || !productIndex.source.includes('aria-live="polite"')) {
    errors.push('products/product-index/index.html: product finder is missing its search control or live result status');
  }
  if (!productIndex.source.includes('src="/assets/js/product-index.js" defer')) errors.push('products/product-index/index.html: missing deferred product finder script');
  const productGroupIds = [...productIndex.source.matchAll(/<section class="index-group" id="([^"]+)" data-product-group>/g)].map(match => match[1]);
  const directoryTargets = [...productIndex.source.matchAll(/<a href="#(category-[^"]+)">/g)].map(match => match[1]);
  if (productGroupIds.length < 10 || productGroupIds.length !== directoryTargets.length || productGroupIds.some((id, index) => id !== directoryTargets[index])) {
    errors.push('products/product-index/index.html: category directory does not match the crawlable product groups');
  }
  const firstIndexImage = productIndex.source.match(/<a class="index-card"[\s\S]*?<img\b[^>]*>/)?.[0] ?? '';
  if (!firstIndexImage.includes('loading="eager"') || !firstIndexImage.includes('fetchpriority="high"')) {
    errors.push('products/product-index/index.html: first catalog image is not prioritized for LCP');
  }
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
  '/insights/custom-cosmetic-packaging-cost-hidden-fees/',
  '/insights/cosmetic-bottle-labels-peeling-adhesive-guide/',
  '/insights/dropper-bottle-leaking-seal-pipette-guide/',
  '/insights/how-to-vet-cosmetic-packaging-supplier-china/',
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
const legacyCatalogSource = fs.readFileSync(path.join(rootDir, 'assets/js/legacy-catalog.js'), 'utf8');
const catalogRuntimeSource = `${mainJsSource}\n${legacyCatalogSource}`;
const productDataSource = fs.readFileSync(path.join(rootDir, 'assets/js/product-data.js'), 'utf8');
const legacyIndexableProductBlock = legacyCatalogSource.match(/const INDEXABLE_PRODUCT_IDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
const legacyIndexableProductIds = new Set(
  [...legacyIndexableProductBlock.matchAll(/['"](p\d+)['"]/g)].map(match => match[1])
);
function legacyProductMap(constantName) {
  const block = legacyCatalogSource.match(new RegExp(`const ${constantName} = \\{([\\s\\S]*?)\\n\\};`))?.[1] ?? '';
  return new Map([...block.matchAll(/\b(p\d+)\s*:\s*'([^']+)'/g)].map(match => [match[1], match[2]]));
}
const legacyProductNameOverrides = legacyProductMap('PRODUCT_NAME_OVERRIDES');
const legacyProductSlugOverrides = legacyProductMap('PRODUCT_SLUG_OVERRIDES');
const productDataContext = { window: {} };
vm.createContext(productDataContext);
vm.runInContext(productDataSource, productDataContext);
const runtimeProductsById = new Map((productDataContext.window.GSP_PRODUCTS ?? []).map(product => [product.id, product]));
const staticProductIds = new Set();
for (const productPage of productPages) {
  const productId = productPage.rel.match(/-(p\d+)\/index\.html$/)?.[1] ?? '';
  if (!productId) continue;
  staticProductIds.add(productId);
  if (!legacyIndexableProductIds.has(productId)) {
    errors.push(`assets/js/legacy-catalog.js does not link static product ${productId} to its crawlable page`);
  }
  const product = runtimeProductsById.get(productId);
  if (!product) {
    errors.push(`assets/js/product-data.js is missing static product ${productId}`);
    continue;
  }
  const generatedSlug = `${String(product.name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${productId}`;
  const expectedDynamicPath = `/products/${legacyProductSlugOverrides.get(productId) || generatedSlug}/`;
  const staticPath = new URL(productPage.canonical).pathname;
  if (expectedDynamicPath !== staticPath) {
    errors.push(`assets/js/legacy-catalog.js maps ${productId} to ${expectedDynamicPath} instead of ${staticPath}`);
  }
  const expectedDynamicName = legacyProductNameOverrides.get(productId) || product.name;
  const staticHeading = firstMatch(productPage.source, /<h1>([^<]+)<\/h1>/i);
  if (expectedDynamicName !== staticHeading) {
    errors.push(`assets/js/legacy-catalog.js names ${productId} "${expectedDynamicName}" instead of static H1 "${staticHeading}"`);
  }
}
for (const productId of legacyIndexableProductIds) {
  if (!staticProductIds.has(productId)) {
    errors.push(`assets/js/legacy-catalog.js marks ${productId} indexable without a static product page`);
  }
}
const inquiryJsSource = fs.readFileSync(path.join(rootDir, 'assets/js/inquiry-conversion.js'), 'utf8');
const inquiryCssSource = fs.readFileSync(path.join(rootDir, 'assets/css/inquiry-conversion.css'), 'utf8');
const productCssSource = fs.readFileSync(path.join(rootDir, 'assets/css/product-page.css'), 'utf8');
const productIndexJsSource = fs.readFileSync(path.join(rootDir, 'assets/js/product-index.js'), 'utf8');
const insightCssSource = fs.readFileSync(path.join(rootDir, 'assets/css/insight-page.css'), 'utf8');
const mainJsBytes = Buffer.byteLength(mainJsSource);
const mainJsGzipBytes = gzipSync(mainJsSource).length;
const legacyCatalogBytes = Buffer.byteLength(legacyCatalogSource);
const legacyCatalogGzipBytes = gzipSync(legacyCatalogSource).length;
for (const unsupportedProductClaim of [
  'prevents oxidation',
  '100% product evacuation',
  'FSC-certified sustainable forests',
  'ensures full formula compatibility',
  '100% biodegradable PLA jar',
  'Biodegrades within 6–24 months',
  'naturally antimicrobial',
  'eliminates leakage',
  'Fully biodegradable and customizable',
  'Leakproof Travel Pump and Spray Sample Set',
  'with Metal-Free Product Path',
  'Helps reduce packaging waste while protecting active formulas'
]) {
  if (productDataSource.includes(unsupportedProductClaim)) {
    errors.push(`assets/js/product-data.js contains an unsupported absolute claim: ${unsupportedProductClaim}`);
  }
}
for (const requiredConditionalClaim of [
  'Child-resistant status requires testing the exact pack to the applicable market protocol.',
  'Any material-reduction or reuse claim requires a complete-pack bill of materials',
  'Confirm the final wetted components, neck finish, dose'
]) {
  if (!productDataSource.includes(requiredConditionalClaim)) {
    errors.push(`assets/js/product-data.js is missing a claim boundary: ${requiredConditionalClaim}`);
  }
}
if (catalogRuntimeSource.includes("eco:'ECO'")) {
  errors.push('catalog JavaScript exposes an unqualified ECO badge');
}
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
for (const requiredMarker of ['inquiry_click', "window.gtag('event'", 'dataLayer.push', 'data-source-page', 'gsp:inquiry-click']) {
  if (!inquiryJsSource.includes(requiredMarker)) errors.push(`assets/js/inquiry-conversion.js is missing ${requiredMarker}`);
}
for (const requiredMarker of ['gsp_first_touch_v1', 'gsp_session_touch_v1', 'landing_page_path']) {
  if (!inquiryJsSource.includes(requiredMarker)) errors.push(`assets/js/inquiry-conversion.js is missing attribution marker ${requiredMarker}`);
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
const catalogPictureRules = [...productCssSource.matchAll(/\.related-card picture,\s*\.index-card picture\s*\{([^}]*)\}/g)].map(match => match[1]);
const catalogImageRule = productCssSource.match(/\.related-card img,\s*\.index-card img\s*\{([^}]*)\}/)?.[1] ?? '';
const productHeroPictureRule = productCssSource.match(/\.hero-media picture\s*\{([^}]*)\}/)?.[1] ?? '';
const productHeroImageRule = productCssSource.match(/\.hero-media img\s*\{([^}]*)\}/)?.[1] ?? '';
if (!catalogPictureRules.some(rule => /aspect-ratio:\s*1/.test(rule) && /overflow:\s*hidden/.test(rule))) {
  errors.push('assets/css/product-page.css does not constrain catalog pictures to a fixed square frame');
}
if (!/height:\s*100%/.test(catalogImageRule) || !/object-fit:\s*cover/.test(catalogImageRule)) {
  errors.push('assets/css/product-page.css does not prevent intrinsic image dimensions from stretching catalog cards');
}
if (!/aspect-ratio:\s*1/.test(productHeroPictureRule) || !/overflow:\s*hidden/.test(productHeroPictureRule)) {
  errors.push('assets/css/product-page.css does not constrain product hero pictures to a fixed square frame');
}
if (!/height:\s*100%/.test(productHeroImageRule) || !/object-fit:\s*cover/.test(productHeroImageRule)) {
  errors.push('assets/css/product-page.css does not prevent intrinsic image dimensions from stretching product heroes');
}
for (const requiredMarker of ['data-product-card', 'data-product-group', "event.key === 'Escape'", 'aria-live']) {
  const source = requiredMarker === 'aria-live' ? productIndex.source : productIndexJsSource;
  if (!source?.includes(requiredMarker)) errors.push(`product finder is missing required marker ${requiredMarker}`);
}
if (/history\.(?:pushState|replaceState)|searchParams\.set/.test(productIndexJsSource)) {
  errors.push('assets/js/product-index.js creates query-state URLs that could compete with the canonical product index');
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
  if (catalogRuntimeSource.includes(obsoleteSchemaMarker)) {
    errors.push(`catalog JavaScript still contains obsolete hash-route schema marker ${obsoleteSchemaMarker}`);
  }
}
if (/['"]@type['"]\s*:\s*['"]Offer['"]|schema\.org\/InStock/.test(catalogRuntimeSource)) {
  errors.push('catalog JavaScript contains an unsupported dynamic Product offer claim');
}
if (!mainJsSource.includes("['products', 'detail', 'search'].includes(page)")
  || !legacyCatalogSource.includes("robots = 'noindex, follow, max-image-preview:large'")) {
  errors.push('catalog JavaScript does not keep internal hash-route views out of the index');
}
if (!legacyCatalogSource.includes("canonical = 'https://www.glorystarpack.com/products/product-index/'")
  || !legacyCatalogSource.includes('const detailCanonical = staticProductUrl')) {
  errors.push('assets/js/legacy-catalog.js does not canonicalize hash product details to crawlable static URLs');
}
if (!legacyCatalogSource.includes("meta[name=\"twitter:title\"]")
  || !legacyCatalogSource.includes('const productImageUrl =')) {
  errors.push('assets/js/legacy-catalog.js does not keep product social metadata aligned with the selected detail');
}
if (!mainJsSource.includes("script.src = '/assets/js/legacy-catalog.js'")
  || !mainJsSource.includes('window.GSP_CATALOG')) {
  errors.push('assets/js/main.js is missing the lazy catalog loader');
}
if (!legacyCatalogSource.includes('window.GSP_CATALOG = Object.freeze')) {
  errors.push('assets/js/legacy-catalog.js does not expose the compatibility API');
}
if (homepage.includes('src="/assets/js/legacy-catalog.js"')) {
  errors.push('homepage eagerly loads the legacy catalog script');
}
if (mainJsBytes > 32_000 || mainJsGzipBytes > 10_000) {
  errors.push(`assets/js/main.js startup payload regressed to ${mainJsBytes} raw bytes / ${mainJsGzipBytes} gzip bytes`);
}
if (legacyCatalogBytes > 100_000 || legacyCatalogGzipBytes > 24_000) {
  errors.push(`assets/js/legacy-catalog.js payload regressed to ${legacyCatalogBytes} raw bytes / ${legacyCatalogGzipBytes} gzip bytes`);
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

const sourcingRoutePaths = [
  '/cosmetic-packaging-supplier-china/',
  '/custom-cosmetic-packaging/',
  '/wholesale-cosmetic-packaging/',
  '/oem-cosmetic-packaging/',
  '/private-label-cosmetic-packaging/'
];
for (const routePath of sourcingRoutePaths) {
  if (!homepage.includes(`href="${routePath}"`)) {
    errors.push(`homepage is missing the priority sourcing-route link ${routePath}`);
  }
}

const chinaSupplierPage = pageRecords.find(record => record.rel === 'cosmetic-packaging-supplier-china/index.html');
const supplierVettingPath = '/insights/how-to-vet-cosmetic-packaging-supplier-china/';
const packagingCostPath = '/insights/custom-cosmetic-packaging-cost-hidden-fees/';
const glassShippingGuidePath = '/insights/how-to-ship-glass-bottles-without-breaking/';
if (!chinaSupplierPage) errors.push('missing cosmetic-packaging-supplier-china/index.html');
else {
  if (!chinaSupplierPage.source.includes(`href="${supplierVettingPath}"`)) {
    errors.push('China supplier page is missing the supplier-vetting guide link');
  }
  if (!chinaSupplierPage.source.includes(`href="${packagingCostPath}"`)) {
    errors.push('China supplier page is missing the custom packaging cost guide link');
  }
  if (chinaSupplierPage.source.includes('<a href="/">Cosmetic packaging manufacturer</a>')) {
    errors.push('China supplier page incorrectly maps cosmetic packaging manufacturer intent to the glass-bottle homepage');
  }
}

const customPackagingPage = pageRecords.find(record => record.rel === 'custom-cosmetic-packaging/index.html');
const oemPackagingPage = pageRecords.find(record => record.rel === 'oem-cosmetic-packaging/index.html');
if (!customPackagingPage) errors.push('missing custom-cosmetic-packaging/index.html');
else {
  if (!customPackagingPage.source.includes('href="/products/product-index/">View Products')) {
    errors.push('custom cosmetic packaging navigation does not lead to the product catalog');
  }
  if (!customPackagingPage.source.includes('Which custom packaging route fits?')) {
    errors.push('custom cosmetic packaging page is missing its route-selection answer');
  }
  if (!customPackagingPage.source.includes(`href="${packagingCostPath}"`)) {
    errors.push('custom cosmetic packaging page is missing the cost and hidden-fees guide link');
  }
}
if (!oemPackagingPage) errors.push('missing oem-cosmetic-packaging/index.html');
else {
  if (!oemPackagingPage.source.includes('href="/products/product-index/">View Products')) {
    errors.push('OEM/ODM packaging navigation does not lead to the product catalog');
  }
  if (!oemPackagingPage.source.includes('OEM vs ODM cosmetic packaging: what is the difference?')) {
    errors.push('OEM/ODM packaging page is missing the OEM-versus-ODM answer');
  }
}
if (!homepage.includes(`href="${glassShippingGuidePath}"`)) {
  errors.push('homepage is missing the glass bottle shipping guide link');
}
const glassGuideHubPage = pageRecords.find(record => record.rel === 'glass-bottle-buying-guides/index.html');
if (!glassGuideHubPage?.source.includes(`href="${glassShippingGuidePath}"`)) {
  errors.push('glass bottle guide hub is missing the shipping and breakage guide link');
}
const siteIndexPage = pageRecords.find(record => record.rel === 'site-index/index.html');
if (!siteIndexPage?.source.includes(`href="${glassShippingGuidePath}"`)) {
  errors.push('site index is missing the glass bottle shipping guide link');
}

for (const cannibalizingMap of [
  'should resolve to the homepage and custom cosmetic packaging page',
  'should resolve to the China supplier page and homepage',
  'should resolve to the custom cosmetic packaging and OEM/ODM cosmetic packaging pages'
]) {
  if (llmsSource.includes(cannibalizingMap)) {
    errors.push(`llms.txt retains an overlapping keyword map: ${cannibalizingMap}`);
  }
}

for (const record of pageRecords) {
  for (const machineDirectedLabel of ['Short Answer for AI Search', 'Best citation for']) {
    if (record.source.includes(machineDirectedLabel)) {
      errors.push(`${record.rel}: visible copy targets a machine instead of the buyer (${machineDirectedLabel})`);
    }
  }
}

console.log(`Checked ${pageRecords.length} HTML pages, ${sitemapUrls.length} sitemap URLs, ${productPages.length} product pages and ${insightArticles.length} insight articles.`);
console.log(`Homepage crawlable individual product detail links: ${homepageProductDetailLinks.size}.`);
console.log(`Homepage crawlable insight links: ${homepageInsightLinks.size}.`);
console.log(`Homepage startup JavaScript: ${mainJsBytes} raw bytes / ${mainJsGzipBytes} gzip bytes; lazy catalog: ${legacyCatalogBytes} raw / ${legacyCatalogGzipBytes} gzip.`);
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
