import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const dateArgument = process.argv.find(argument => argument.startsWith('--date='));
const modifiedDate = dateArgument?.slice('--date='.length) ?? new Date().toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(modifiedDate)) {
  throw new Error(`Invalid --date value: ${modifiedDate}`);
}

const changedPaths = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACM'], {
  cwd: rootDir,
  encoding: 'utf8'
})
  .trim()
  .split('\n')
  .filter(relativePath => relativePath.endsWith('.html') && fs.existsSync(path.join(rootDir, relativePath)));

const sitemapPath = path.join(rootDir, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
let touchedFiles = 0;
let touchedSitemapEntries = 0;

for (const relativePath of changedPaths) {
  const filePath = path.join(rootDir, relativePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const canonical = original.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
  let updated = original
    .replace(/("dateModified"\s*:\s*")\d{4}-\d{2}-\d{2}("?)/g, `$1${modifiedDate}$2`)
    .replace(/(Updated\s+)\d{4}-\d{2}-\d{2}/g, `$1${modifiedDate}`);

  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
    touchedFiles += 1;
  }

  if (!canonical) continue;
  const escapedCanonical = canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sitemapEntry = new RegExp(`(<loc>${escapedCanonical}<\\/loc>[\\s\\S]*?<lastmod>)\\d{4}-\\d{2}-\\d{2}(<\\/lastmod>)`);
  if (sitemapEntry.test(sitemap)) {
    sitemap = sitemap.replace(sitemapEntry, `$1${modifiedDate}$2`);
    touchedSitemapEntries += 1;
  }
}

fs.writeFileSync(sitemapPath, sitemap);
console.log(`Updated ${touchedFiles} changed HTML files and ${touchedSitemapEntries} sitemap entries to ${modifiedDate}.`);
