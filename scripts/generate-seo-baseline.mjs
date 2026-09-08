import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const ignoredDirectories = new Set(['.git', '.vercel', 'backups', 'data', 'node_modules', 'tmp']);
const ignoredFiles = new Set(['glorystarpack (1).html', 'google130558f0f0763df4.html']);
const outputArg = process.argv.find(arg => arg.startsWith('--out='));

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && ignoredFiles.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function match(source, pattern) {
  return source.match(pattern)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
}

function metaContent(source, name) {
  const tag = source.match(new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, 'i'))?.[0] ?? '';
  return tag.match(/\bcontent=(["'])(.*?)\1/i)?.[2]?.replace(/\s+/g, ' ').trim() ?? '';
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

function canonicalPath(source) {
  const canonical = match(source, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
  try {
    return new URL(canonical, siteUrl).pathname;
  } catch {
    return '';
  }
}

function normalizedLocalPath(rawUrl) {
  if (!rawUrl.startsWith('/') || rawUrl.startsWith('//')) return '';
  return rawUrl.split(/[?#]/)[0] || '/';
}

const htmlFiles = walk(rootDir);
const records = htmlFiles.map(filePath => {
  const source = fs.readFileSync(filePath, 'utf8');
  const robots = metaContent(source, 'robots');
  const canonical = canonicalPath(source);
  const title = match(source, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = metaContent(source, 'description');
  const language = match(source, /<html[^>]*\blang=["']([^"']+)/i) || 'missing';
  const hrefs = [...source.matchAll(/href=["']([^"']+)["']/gi)].map(item => item[1]);
  const queryLinks = hrefs.filter(
    href => normalizedLocalPath(href) && /(?:\?|&)(?:category|q|sp)=/i.test(href)
  );
  const schemaTypes = [...source.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(item => item[1]);
  return {
    path: path.relative(rootDir, filePath),
    bytes: Buffer.byteLength(source),
    language,
    indexable: !/\bnoindex\b/i.test(robots),
    titleLength: title.length,
    descriptionLength: description.length,
    words: visibleWordCount(source),
    canonical,
    hasH1: (source.match(/<h1\b/gi) ?? []).length === 1,
    hasHreflang: /<link[^>]*hreflang=/i.test(source),
    hasJsonLd: /application\/ld\+json/i.test(source),
    schemaTypes: [...new Set(schemaTypes)],
    queryLinks
  };
});

const sitemapSource = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapSource.matchAll(/<loc>([^<]+)<\/loc>/g)].map(matchItem => matchItem[1]);
const sitemapSet = new Set(sitemapUrls);
const indexableRecords = records.filter(record => record.indexable);
const canonicalSet = new Set(
  indexableRecords
    .filter(record => record.canonical)
    .map(record => `${siteUrl}${record.canonical}`)
);
const schemaTypeCounts = {};
const languageCounts = {};
const queryLinkCounts = {};

for (const record of records) {
  languageCounts[record.language] = (languageCounts[record.language] || 0) + 1;
  for (const schemaType of record.schemaTypes) schemaTypeCounts[schemaType] = (schemaTypeCounts[schemaType] || 0) + 1;
  for (const queryLink of record.queryLinks) {
    const key = queryLink.split('?')[0] + '?' + queryLink.split('?')[1].split('&')[0];
    queryLinkCounts[key] = (queryLinkCounts[key] || 0) + 1;
  }
}

const baseline = {
  generatedAt: new Date().toISOString(),
  siteUrl,
  scope: 'Local static source audit; Search Console and GA4 metrics require account-side exports.',
  pages: {
    html: records.length,
    indexable: indexableRecords.length,
    noindex: records.length - indexableRecords.length,
    withH1: records.filter(record => record.hasH1).length,
    withHreflang: records.filter(record => record.hasHreflang).length,
    withJsonLd: records.filter(record => record.hasJsonLd).length,
    totalBytes: records.reduce((total, record) => total + record.bytes, 0),
    averageVisibleWords: Math.round(records.reduce((total, record) => total + record.words, 0) / Math.max(records.length, 1))
  },
  sitemap: {
    urls: sitemapUrls.length,
    uniqueUrls: sitemapSet.size,
    indexableCanonicalsMissing: [...canonicalSet].filter(url => !sitemapSet.has(url)),
    sitemapUrlsNotMatchingIndexableCanonical: sitemapUrls.filter(url => !canonicalSet.has(url)).slice(0, 50)
  },
  languages: languageCounts,
  schemaTypes: schemaTypeCounts,
  dynamicUrlLinks: {
    totalOccurrences: records.reduce((total, record) => total + record.queryLinks.length, 0),
    uniqueFirstParameters: Object.keys(queryLinkCounts).length,
    topPatterns: Object.entries(queryLinkCounts).sort((left, right) => right[1] - left[1]).slice(0, 20)
  },
  externalMetrics: {
    googleSearchConsole: null,
    ga4: null,
    bingWebmaster: null,
    note: 'Populate from Search Console / GA4 / Bing exports before making ranking or traffic claims.'
  }
};

const serialized = `${JSON.stringify(baseline, null, 2)}\n`;
if (outputArg) {
  const outputPath = path.resolve(rootDir, outputArg.slice('--out='.length));
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, serialized);
  console.log(`SEO baseline written to ${path.relative(rootDir, outputPath)}`);
}
console.log(serialized);
