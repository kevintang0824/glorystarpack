const defaultBaseUrl = 'https://www.glorystarpack.com';
const googleTagId = 'G-NYY1MTZ6HM';
const requestedBaseUrl = process.argv.find(arg => arg.startsWith('--base='))?.slice(7) || defaultBaseUrl;
const baseUrl = new URL(requestedBaseUrl);
const errors = [];

if (!['http:', 'https:'].includes(baseUrl.protocol)) {
  throw new Error('The live-site base URL must use HTTP or HTTPS.');
}

async function fetchText(pathname, expectedStatus = 200) {
  const url = new URL(pathname, baseUrl);
  let response;
  try {
    response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'GloryStarPack release verifier/1.0' }
    });
  } catch (error) {
    errors.push(`${url.href}: request failed (${error.message})`);
    return { response: null, body: '' };
  }
  const body = await response.text();
  if (response.status !== expectedStatus) {
    errors.push(`${url.href}: expected HTTP ${expectedStatus}, received ${response.status}`);
  }
  return { response, body };
}

const homepage = await fetchText('/');
if (!homepage.body.includes('<link rel="canonical" href="https://www.glorystarpack.com/">')) {
  errors.push('homepage canonical does not point to the production www URL');
}
if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(homepage.body)) {
  errors.push('homepage unexpectedly contains noindex');
}
if (!homepage.body.includes(`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`)) {
  errors.push(`homepage is missing the Google tag loader for ${googleTagId}`);
}
if (!homepage.body.includes(`window.gtag('config', '${googleTagId}')`)) {
  errors.push(`homepage is missing the GA4 configuration for ${googleTagId}`);
}

const inquiryScript = await fetchText('/assets/js/inquiry-conversion.js');
if (!inquiryScript.body.includes("window.gtag('event', eventName, eventParameters)")) {
  errors.push('live inquiry tracking does not send inquiry_click through gtag');
}

const contactForm = await fetchText('/contact/');
if (!contactForm.body.includes('action="/api/inquiry"')) errors.push('live contact form does not target /api/inquiry');
if (!contactForm.body.includes("window.gtag('event', 'generate_lead'")) errors.push('live contact form is missing accepted-lead analytics');

const inquiryMethodCheck = await fetchText('/api/inquiry', 405);
if (!inquiryMethodCheck.body.includes('Method not allowed')) errors.push('live RFQ endpoint did not reject GET requests');

const invalidInquiryResponse = await fetch(new URL('/api/inquiry', baseUrl), {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: baseUrl.origin,
    'user-agent': 'GloryStarPack release verifier/1.0'
  },
  body: '{}'
});
if (invalidInquiryResponse.status !== 400) errors.push(`live RFQ validation expected HTTP 400, received ${invalidInquiryResponse.status}`);

for (const pathname of [
  '/about/',
  '/contact/',
  '/products/product-index/',
  '/products/serum-dropper-bottle-glass-p7/',
  '/insights/',
  '/glass-bottle-buying-guides/'
]) {
  const page = await fetchText(pathname);
  if (!page.body.includes(`<link rel="canonical" href="${new URL(pathname, defaultBaseUrl).href}">`)) {
    errors.push(`${pathname}: canonical does not match the production URL`);
  }
}

const robots = await fetchText('/robots.txt');
for (const sitemapName of ['sitemap.xml', 'image-sitemap.xml', 'feed.xml']) {
  if (!robots.body.includes(`Sitemap: ${defaultBaseUrl}/${sitemapName}`)) {
    errors.push(`robots.txt is missing ${sitemapName}`);
  }
}

const sitemap = await fetchText('/sitemap.xml');
const sitemapUrls = [...sitemap.body.matchAll(/<loc>(https:\/\/www\.glorystarpack\.com\/[^<]*)<\/loc>/g)];
if (sitemapUrls.length < 100) errors.push(`sitemap.xml exposes only ${sitemapUrls.length} URLs`);

const imageSitemap = await fetchText('/image-sitemap.xml');
if (!imageSitemap.body.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
  errors.push('image-sitemap.xml is missing the Google image namespace');
}

const feed = await fetchText('/feed.xml');
if (!/<rss\b[^>]*version="2\.0"/.test(feed.body)) errors.push('feed.xml is not RSS 2.0');

const indexNowKey = 'f5c6d8e91a2b47c0ad74e69321fb805e';
const keyFile = await fetchText(`/${indexNowKey}.txt`);
if (keyFile.body.trim() !== indexNowKey) errors.push('live IndexNow key does not match the expected key');

const missingPage = await fetchText('/release-verification-not-found-404/', 404);
if (!missingPage.body.includes('Page not found')) errors.push('custom 404 page did not render');

if (errors.length) {
  console.error(`Live-site checks failed (${errors.length}):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Live-site checks passed for ${baseUrl.origin}.`);
  console.log(`Verified ${sitemapUrls.length} sitemap URLs, key pages, discovery files and custom 404 behavior.`);
}
