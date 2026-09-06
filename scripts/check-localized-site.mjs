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
const translationDictionaries = Object.fromEntries(localeCodes.map(language => {
  const file = path.join(root, 'data', 'full-translations', `${language}.json`);
  return [language, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}];
}));
const sitemapEnglishRoutes = [...new Set([...sitemap.matchAll(/<loc>https:\/\/www\.glorystarpack\.com([^<]+)<\/loc>/g)].map(match => match[1]))]
  .filter(route => !localeCodes.some(language => route.startsWith(`/${language}/`)));
const expectedFavicon = '/assets/brand/glorystarpack-logo-favicon-2026.png?v=20260906';
const failures = [];
let pages = 0;

function normalizedTranslationSource(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function shouldTranslate(value) {
  const decoded = value.replace(/&[a-z0-9#]+;/gi, ' ');
  if (!/[A-Za-z]{2}/.test(decoded)) return false;
  if ((decoded.includes('://') || decoded.includes('@')) && /^(?:https?:\/\/|mailto:|tel:)?\S+@?\S*$/.test(decoded)) return false;
  if (/^[A-Z0-9][A-Z0-9 /+_.:#×–—-]{0,24}$/.test(decoded)) return false;
  return !['GloryStarPack', 'WhatsApp', 'Instagram', 'LinkedIn'].includes(decoded);
}
const currentTranslationStrings = new Set();
for (const file of sourceFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8').replace(/<(script|style|svg|noscript|code|pre)\b[\s\S]*?<\/\1\s*>/gi, '');
  for (const match of source.matchAll(/>([^<>]+)</g)) {
    const value = normalizedTranslationSource(match[1]);
    if (shouldTranslate(value)) currentTranslationStrings.add(value);
  }
  for (const match of source.matchAll(/\b(?:alt|aria-label|placeholder|title)=(?:"([^"]*)"|'([^']*)')/gi)) {
    const value = normalizedTranslationSource(match[1] ?? match[2]);
    if (shouldTranslate(value)) currentTranslationStrings.add(value);
  }
}
const dynamicStrings = JSON.parse(execFileSync(process.execPath, ['scripts/extract-dynamic-translation-strings.mjs'], { cwd: root, encoding: 'utf8' }));
for (const raw of dynamicStrings) {
  const value = normalizedTranslationSource(raw);
  if (shouldTranslate(value)) currentTranslationStrings.add(value);
}

function expect(condition, message) { if (!condition) failures.push(message); }

// Asset paths must be root-relative. A bare assets/... URL resolves inside a
// locale directory (for example /fr/assets/...) and makes multilingual images
// disappear even though the same asset works on the English page.
for (const assetScript of ['assets/js/legacy-catalog.js', 'assets/js/product-data.js']) {
  const script = fs.readFileSync(path.join(root, assetScript), 'utf8');
  if (assetScript.endsWith('legacy-catalog.js')) {
    expect(/const assetPath =/.test(script), `${assetScript}: missing runtime asset path normalizer`);
  } else {
    expect(/images: row\[10\]\.map\(imageIndex => 'assets\/product-photos\//.test(script), `${assetScript}: imported image path contract changed unexpectedly`);
  }
}

function body(source) { return source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || ''; }
function visibleTextNodes(source) {
  source = body(source)
    .replace(/<details\b[^>]*class="gsp-language"[\s\S]*?<\/details>/gi, '')
    .replace(/<(script|style|svg|noscript|code|pre)\b[\s\S]*?<\/\1\s*>/gi, '');
  return [...source.matchAll(/>([^<>]+)</g)].map(match => match[1].replace(/\s+/g, ' ').trim()).filter(Boolean);
}
function tagSignature(source) {
  return [...body(source).matchAll(/<(\/)?([a-z][a-z0-9-]*)\b[^>]*>/gi)].map(match => `${match[1] || ''}${match[2].toLowerCase()}`).join('|');
}
function tagCount(source, tag) { return (body(source).match(new RegExp(`<${tag}\\b`, 'gi')) || []).length; }
function assetList(source) {
  return [...source.matchAll(/<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"[^>]*>/g)]
    .map(match => match[1]).filter(value => value.startsWith('/assets/')).sort().join('|');
}
function normalizeAssetUrl(value) { return value.replace(/(?<![A-Za-z0-9_/-])assets\//g, '/assets/'); }
function hasRelativeAssetUrl(source) { return /(?<![A-Za-z0-9_/-])assets\//.test(source); }
function imageList(source) { return [...source.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(match => normalizeAssetUrl(match[1])).sort().join('|'); }
function faviconHref(source) { return source.match(/<link\b[^>]*rel="icon"[^>]*href="([^"]+)"/i)?.[1] || ''; }
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
  const englishText = visibleTextNodes(english);
  expect((english.match(/data-gsp-language=/g) || []).length === 6, `${file}: English selector does not contain six languages`);
  expect(faviconHref(english) === expectedFavicon, `${file}: missing canonical GSP favicon`);
  expect(!/href="\/favicon\.ico(?:["?])/i.test(english), `${file}: stale favicon.ico reference remains`);
  for (const language of localeCodes) {
    const target = fileForLocale(language, file);
    const rel = path.relative(root, target);
    if (!fs.existsSync(target)) { failures.push(`${rel}: parity page is missing`); continue; }
    const localized = fs.readFileSync(target, 'utf8');
    const localizedText = visibleTextNodes(localized);
    pages++;
    expect(localized.includes(`<html lang="${language}">`), `${rel}: incorrect document language`);
    expect(faviconHref(localized) === expectedFavicon, `${rel}: missing canonical GSP favicon`);
    expect(!/href="\/favicon\.ico(?:["?])/i.test(localized), `${rel}: stale favicon.ico reference remains`);
    expect(tagSignature(localized) === tagSignature(english), `${rel}: HTML element hierarchy differs from English`);
    for (const tag of ['h1','h2','h3','p','li','table','form','section','article','nav','img']) {
      expect(tagCount(localized, tag) === tagCount(english, tag), `${rel}: ${tag} count differs from English`);
    }
    expect(assetList(localized) === assetList(english), `${rel}: CSS or JavaScript assets differ from English`);
    expect(imageList(localized) === imageList(english), `${rel}: image set differs from English`);
    expect(localizedText.length === englishText.length, `${rel}: visible text-node count differs from English`);
    const dictionary = translationDictionaries[language];
    let eligibleText = 0;
    let changedText = 0;
    for (let index = 0; index < Math.min(englishText.length, localizedText.length); index++) {
      const sourceText = englishText[index];
      if (!dictionary[sourceText] || dictionary[sourceText] === sourceText) continue;
      eligibleText++;
      if (localizedText[index] !== sourceText) changedText++;
    }
    expect(!eligibleText || changedText / eligibleText >= 0.98, `${rel}: only ${changedText}/${eligibleText} translatable text nodes changed`);
    expect((localized.match(/data-gsp-language=/g) || []).length === 6, `${rel}: expected six language choices`);
    const selector = localized.match(/<details\b[^>]*class="gsp-language"[\s\S]*?<\/details>/)?.[0] || '';
    expect(selector.includes(`data-gsp-language="${language}"`) && selector.match(new RegExp(`data-gsp-language="${language}"[^>]*aria-current="true"`)), `${rel}: current language is not selected`);
    expect(!/(?:gtranslate|translate\.google|googleTranslateElement|doGTranslate)/i.test(localized), `${rel}: automatic translation code remains`);
    expect(!new RegExp(`/${language}/${language}/`).test(localized), `${rel}: locale prefix is duplicated`);
    expect(!hasRelativeAssetUrl(localized), `${rel}: relative asset URL remains`);
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
    const minimumLengthRatio = language === 'zh-CN' ? 0.45 : 0.65;
    expect(localized.length >= english.length * minimumLengthRatio, `${rel}: too much page content is missing`);
  }
}

expect(sourceFiles.length === 142, `expected 142 English interfaces, found ${sourceFiles.length}`);
for (const language of localeCodes) {
  const keys = new Set(Object.keys(translationDictionaries[language]));
  const missing = [...currentTranslationStrings].filter(value => !keys.has(value));
  const obsolete = [...keys].filter(value => !currentTranslationStrings.has(value));
  expect(!missing.length, `${language}: ${missing.length} current English strings are missing translations`);
  expect(!obsolete.length, `${language}: ${obsolete.length} obsolete translation strings should be rebuilt`);
}
expect(pages === sourceFiles.length * localeCodes.length, `expected ${sourceFiles.length * localeCodes.length} parity pages, found ${pages}`);
expect((sitemap.match(/<url>/g) || []).length === sitemapEnglishRoutes.length * (localeCodes.length + 1), 'sitemap URL count does not match English and localized indexable pages');

if (failures.length) {
  console.error(`Localized interface parity failed (${failures.length}):`);
  failures.slice(0, 120).forEach(failure => console.error(`- ${failure}`));
  if (failures.length > 120) console.error(`- …and ${failures.length - 120} more`);
  process.exit(1);
}
console.log(`Localized interface parity passed: ${pages} pages, ${sourceFiles.length} English interfaces, identical structures and content blocks.`);
