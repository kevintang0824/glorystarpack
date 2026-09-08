import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const trackerPath = path.join(rootDir, 'data', 'seo-phase-5-tracker.json');
const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
const date = process.argv.find(arg => arg.startsWith('--date='))?.slice(7) || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid --date value: ${date}`);
const outputArg = process.argv.find(arg => arg.startsWith('--out='))?.slice(6) || `data/weekly-seo-reviews/${date}.json`;
const outputPath = path.resolve(rootDir, outputArg);

function walk(directory) {
  const files = [];
  const ignoredFiles = new Set(['glorystarpack (1).html', 'google130558f0f0763df4.html']);
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (['.git', '.vercel', 'backups', 'data', 'node_modules', 'tmp'].includes(entry.name)) continue;
    if (ignoredFiles.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

const sitemap = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const review = {
  reviewDate: date,
  siteUrl: tracker.siteUrl,
  phase: 5,
  localBaseline: {
    htmlPages: walk(rootDir).length,
    sitemapUrls: sitemapUrls.length,
    languages: tracker.currentBaseline.languages,
    aiContextBytes: fs.statSync(path.join(rootDir, 'ai-context.json')).size,
    liveChecks: 'run node scripts/check-live-site.mjs after release'
  },
  externalMetrics: {
    googleSearchConsole: null,
    bingWebmaster: null,
    ga4: null,
    referringDomains: null,
    aiMentionRate: null,
    note: 'Fill from dated account exports or manual observations. Null is not zero.'
  },
  authorityActions: [],
  aiCitationObservations: tracker.aiCitationQueries.map(query => ({
    id: query.id,
    platformLocales: query.platforms.map(platform => `${platform} / ${query.locale}`),
    mentioned: null,
    citedUrls: [],
    checkedOn: null,
    notes: 'Not measured yet.'
  })),
  nextIteration: [],
  releaseChecks: [
    'node scripts/check-seo.mjs',
    'node scripts/audit-content.mjs',
    'node scripts/check-phase-5-tracker.mjs',
    'node scripts/check-live-site.mjs'
  ]
};

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(`Weekly SEO review written to ${path.relative(rootDir, outputPath)}`);
