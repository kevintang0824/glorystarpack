import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const siteUrl = 'https://www.glorystarpack.com';
const ignoredDirectories = new Set(['.git', '.vercel', 'backups', 'data', 'node_modules', 'tmp']);
const ignoredFiles = new Set(['glorystarpack (1).html']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    if (entry.isFile() && ignoredFiles.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.name.endsWith('.html') ? [fullPath] : [];
  });
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
  const canonical = source.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] ?? '';
  try {
    return new URL(canonical, siteUrl).pathname;
  } catch {
    return '';
  }
}

function normalizedLinkPath(rawPath) {
  if (!rawPath.startsWith('/') || rawPath.startsWith('//')) return '';
  const pathname = rawPath.split(/[?#]/)[0];
  if (!pathname || path.extname(pathname)) return pathname;
  return pathname === '/' || pathname.endsWith('/') ? pathname : `${pathname}/`;
}

const records = walk(rootDir)
  .filter(filePath => !filePath.endsWith('google130558f0f0763df4.html'))
  .map(filePath => {
    const source = fs.readFileSync(filePath, 'utf8');
    const images = [...source.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
    const unsizedImageTags = images.filter(tag => !/\bwidth=["'][^"']+/.test(tag) || !/\bheight=["'][^"']+/.test(tag));
    return {
      rel: path.relative(rootDir, filePath),
      source,
      indexable: !/\bnoindex\b/i.test(source),
      words: visibleWordCount(source),
      canonicalPath: canonicalPath(source),
      types: [...source.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(match => match[1]),
      links: [...source.matchAll(/href=["']([^"']+)/gi)]
        .map(match => normalizedLinkPath(match[1]))
        .filter(Boolean),
      imageCount: images.length,
      unsizedImages: unsizedImageTags.length,
      unsizedImageSources: unsizedImageTags.map(tag => tag.match(/\bsrc=["']([^"']+)/i)?.[1] ?? '?')
    };
  });

const inboundLinks = new Map(records.map(record => [record.canonicalPath, new Set()]));
for (const sourceRecord of records) {
  if (/\bnoindex\b/i.test(sourceRecord.source)) continue;
  for (const link of sourceRecord.links) {
    if (!inboundLinks.has(link)) continue;
    if (link === sourceRecord.canonicalPath) continue;
    inboundLinks.get(link).add(sourceRecord.canonicalPath);
  }
}

for (const record of records) {
  record.inboundPages = inboundLinks.get(record.canonicalPath)?.size ?? 0;
}

const indexableByCanonical = new Map(
  records.filter(record => record.indexable && record.canonicalPath).map(record => [record.canonicalPath, record])
);
const clickDepths = new Map([['/', 0]]);
const crawlQueue = ['/'];
while (crawlQueue.length) {
  const sourcePath = crawlQueue.shift();
  const sourceRecord = indexableByCanonical.get(sourcePath);
  if (!sourceRecord) continue;
  for (const targetPath of sourceRecord.links) {
    if (!indexableByCanonical.has(targetPath) || clickDepths.has(targetPath)) continue;
    clickDepths.set(targetPath, clickDepths.get(sourcePath) + 1);
    crawlQueue.push(targetPath);
  }
}
for (const record of records) {
  record.clickDepth = clickDepths.get(record.canonicalPath) ?? Infinity;
}

function outputSection(title, selected, format) {
  console.log(`\n${title}`);
  if (!selected.length) {
    console.log('None');
    return;
  }
  selected.forEach(record => console.log(format(record)));
}

console.log(`Audited ${records.length} HTML pages.`);

outputSection(
  'LOW WORD COUNT (<250), excluding generated individual products',
  records
    .filter(record => record.indexable && record.words < 250 && !/^products\/.+-p\d+\/index\.html$/.test(record.rel))
    .sort((left, right) => left.words - right.words),
  record => `${String(record.words).padStart(4)} words | ${String(record.inboundPages).padStart(3)} inbound | ${record.rel}`
);

outputSection(
  'LOW INBOUND PAGE COVERAGE (<=1), excluding noindex pages',
  records
    .filter(record => record.inboundPages <= 1 && !/\bnoindex\b/i.test(record.source))
    .sort((left, right) => left.inboundPages - right.inboundPages || left.rel.localeCompare(right.rel)),
  record => `${String(record.inboundPages).padStart(3)} inbound | ${String(record.words).padStart(4)} words | ${record.rel}`
);

outputSection(
  'DEEP OR UNREACHABLE INDEXABLE PAGES (>3 clicks from homepage)',
  records
    .filter(record => record.indexable && record.canonicalPath !== '/' && record.clickDepth > 3)
    .sort((left, right) => left.clickDepth - right.clickDepth || left.rel.localeCompare(right.rel)),
  record => `${Number.isFinite(record.clickDepth) ? record.clickDepth : 'unreachable'} clicks | ${record.rel}`
);

outputSection(
  'MISSING BreadcrumbList, excluding the homepage and noindex pages',
  records.filter(record => record.indexable && record.rel !== 'index.html' && !record.types.includes('BreadcrumbList')),
  record => record.rel
);

outputSection(
  'UNSIZED IMAGES',
  records.filter(record => record.unsizedImages > 0),
  record => `${record.unsizedImages}/${record.imageCount} unsized | ${record.rel} | ${record.unsizedImageSources.join(', ')}`
);
