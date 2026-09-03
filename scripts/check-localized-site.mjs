import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { localeCodes } from '../data/site-locales.mjs';
import { localePath } from './language-switcher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.glorystarpack.com';
const sourceFiles = execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split('\n')
  .filter(file => file && file !== 'google130558f0f0763df4.html' && !localeCodes.some(language => file.startsWith(`${language}/`)));
const routeForFile = file => file === 'index.html' ? '/' : file === '404.html' ? '/404.html' : `/${file.replace(/index\.html$/, '')}`;
const fileForLocale = (language, file) => file === '404.html' ? path.join(root, language, '404.html') : path.join(root, language, file);
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapEnglishRoutes = [...new Set([...sitemap.matchAll(/<loc>https:\/\/www\.glorystarpack\.com([^<]+)<\/loc>/g)].map(match => match[1]))]
  .filter(route => !localeCodes.some(language => route.startsWith(`/${language}/`)));
const failures = [];
let pages = 0;

function expect(condition, message) { if (!condition) failures.push(message); }
function body(source) { return source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || ''; }
function tagSignature(source) {
  return [...body(source).matchAll(/<(\/)?([a-z][a-z0-9-]*)\b[^>]*>/gi)].map(match => `${match[1] || ''}${match[2].toLowerCase()}`).join('|');
}
function tagCount(source, tag) { return (body(source).match(new RegExp(`<${tag}\\b`, 'gi')) || []).length; }
function assetList(source) {
  return [...source.matchAll(/<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"[^>]*>/g)]
    .map(match => match[1]).filter(value => value.startsWith('/assets/')).sort().join('|');
}
function imageList(source) { return [...source.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(match => match[1]).sort().join('|'); }
function localTarget(href) {
  const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
  if (!pathname || pathname === '/') return path.join(root, 'index.html');
  const candidate = path.join(root, pathname.slice(1));
  if (/\.html$/i.test(candidate)) return candidate;
  if (path.extname(candidate)) return null;
  return path.join(candidate, 'index.html');
}

for (const file of sourceFiles) {
  const route = routeForFile(file);
  const english = fs.readFileSync(path.join(root, file), 'utf8');
  const englishNoindex = /<meta name="robots" content="noindex/i.test(english);
  const englishCanonical = english.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || '';
  expect((english.match(/data-gsp-language=/g) || []).length === 6, `${file}: English selector does not contain six languages`);
  for (const language of localeCodes) {
    const target = fileForLocale(language, file);
    const rel = path.relative(root, target);
    if (!fs.existsSync(target)) { failures.push(`${rel}: parity page is missing`); continue; }
    const localized = fs.readFileSync(target, 'utf8');
    pages++;
    expect(localized.includes(`<html lang="${language}">`), `${rel}: incorrect document language`);
    expect(tagSignature(localized) === tagSignature(english), `${rel}: HTML element hierarchy differs from English`);
    for (const tag of ['h1','h2','h3','p','li','table','form','section','article','nav','img']) {
      expect(tagCount(localized, tag) === tagCount(english, tag), `${rel}: ${tag} count differs from English`);
    }
    expect(assetList(localized) === assetList(english), `${rel}: CSS or JavaScript assets differ from English`);
    expect(imageList(localized) === imageList(english), `${rel}: image set differs from English`);
    expect((localized.match(/data-gsp-language=/g) || []).length === 6, `${rel}: expected six language choices`);
    const selector = localized.match(/<details\b[^>]*class="gsp-language"[\s\S]*?<\/details>/)?.[0] || '';
    expect(selector.includes(`data-gsp-language="${language}"`) && selector.match(new RegExp(`data-gsp-language="${language}"[^>]*aria-current="true"`)), `${rel}: current language is not selected`);
    expect(!/(?:gtranslate|translate\.google|googleTranslateElement|doGTranslate)/i.test(localized), `${rel}: automatic translation code remains`);
    expect(!new RegExp(`/${language}/${language}/`).test(localized), `${rel}: locale prefix is duplicated`);
    const internalLinks = [...localized.matchAll(/<a\b[^>]*href="(\/(?!\/)[^"]*)"/g)].map(match => match[1]);
    for (const href of internalLinks) {
      const targetFile = localTarget(href);
      if (targetFile) expect(fs.existsSync(targetFile), `${rel}: broken local link ${href}`);
    }
    const noindex = /<meta name="robots" content="noindex/i.test(localized);
    expect(noindex === englishNoindex, `${rel}: indexability differs from English`);
    if (englishCanonical) {
      const expectedCanonical = `${site}${localePath(language, route)}`;
      expect(localized.match(/<link rel="canonical" href="([^"]+)"/)?.[1] === expectedCanonical, `${rel}: incorrect canonical URL`);
      const alternates = [...localized.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
      if (englishNoindex) expect(alternates.length === 0, `${rel}: noindex page should not publish hreflang`);
      else {
        expect(alternates.length === 7, `${rel}: expected seven hreflang links`);
        for (const code of ['en', ...localeCodes, 'x-default']) {
          const href = code === 'en' || code === 'x-default' ? `${site}${route}` : `${site}${localePath(code, route)}`;
          expect(alternates.some(match => match[1] === code && match[2] === href), `${rel}: incorrect ${code} hreflang`);
        }
        expect(sitemap.includes(`<loc>${expectedCanonical}</loc>`), `${rel}: canonical URL is absent from sitemap`);
      }
    }
    expect(localized.length >= english.length * 0.75, `${rel}: too much English page content is missing`);
  }
}

expect(sourceFiles.length === 142, `expected 142 English interfaces, found ${sourceFiles.length}`);
expect(pages === sourceFiles.length * localeCodes.length, `expected ${sourceFiles.length * localeCodes.length} parity pages, found ${pages}`);
expect((sitemap.match(/<url>/g) || []).length === sitemapEnglishRoutes.length * (localeCodes.length + 1), 'sitemap URL count does not match English and localized indexable pages');

if (failures.length) {
  console.error(`Localized interface parity failed (${failures.length}):`);
  failures.slice(0, 120).forEach(failure => console.error(`- ${failure}`));
  if (failures.length > 120) console.error(`- …and ${failures.length - 120} more`);
  process.exit(1);
}
console.log(`Localized interface parity passed: ${pages} pages, ${sourceFiles.length} English interfaces, identical structures and content blocks.`);
