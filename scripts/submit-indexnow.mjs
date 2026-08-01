import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const host = 'www.glorystarpack.com';
const endpoint = 'https://api.indexnow.org/indexnow';
const keyFileName = 'f5c6d8e91a2b47c0ad74e69321fb805e.txt';
const keyPath = path.join(rootDir, keyFileName);
const key = fs.readFileSync(keyPath, 'utf8').trim();
const keyLocation = `${siteUrl}/${keyFileName}`;

if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  throw new Error('The IndexNow key must contain 8–128 letters, numbers or dashes.');
}

function sitemapUrls() {
  const sitemap = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>(https:\/\/www\.glorystarpack\.com\/[^<]*)<\/loc>/g)]
    .map(match => match[1]);
}

function normalizeUrl(value) {
  const url = new URL(value, `${siteUrl}/`);
  url.hash = '';
  if (url.origin !== siteUrl) throw new Error(`IndexNow URL is outside ${host}: ${value}`);
  return url.href;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const includeSitemap = args.includes('--all');
const explicitUrls = args.filter(arg => !arg.startsWith('--'));

if (!includeSitemap && !explicitUrls.length) {
  console.error('Usage: node scripts/submit-indexnow.mjs [--dry-run] --all');
  console.error('   or: node scripts/submit-indexnow.mjs [--dry-run] /about/ /insights/example/');
  process.exit(1);
}

const urlList = [...new Set([
  ...(includeSitemap ? sitemapUrls() : []),
  ...explicitUrls.map(normalizeUrl)
])];

if (!urlList.length) throw new Error('No URLs were selected for IndexNow.');
if (urlList.length > 10_000) throw new Error('IndexNow accepts at most 10,000 URLs per request.');

const payload = { host, key, keyLocation, urlList };

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const verificationResponse = await fetch(keyLocation, { cache: 'no-store' });
const deployedKey = verificationResponse.ok ? (await verificationResponse.text()).trim() : '';
if (deployedKey !== key) {
  throw new Error(`Deploy ${keyFileName} before submitting IndexNow URLs; live key verification failed.`);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});

if (![200, 202].includes(response.status)) {
  const responseBody = await response.text();
  throw new Error(`IndexNow returned HTTP ${response.status}${responseBody ? `: ${responseBody}` : ''}`);
}

console.log(`IndexNow accepted ${urlList.length} URL${urlList.length === 1 ? '' : 's'} with HTTP ${response.status}.`);
