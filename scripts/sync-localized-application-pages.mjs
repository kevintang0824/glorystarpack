import fs from 'node:fs';
import path from 'node:path';
import { localeCodes } from '../data/site-locales.mjs';
import { applicationDecisionTranslations } from '../data/application-decision-translations.mjs';

const rootDir = path.resolve(import.meta.dirname, '..');
const modifiedDate = '2026-09-17';
const decisionStart = '<!-- BEGIN APPLICATION DECISION -->';
const decisionEnd = '<!-- END APPLICATION DECISION -->';
const pages = {
  'products/home-fragrance-packaging/index.html': '<section class="note" style="margin-top:24px"><h2>',
  'products/hotel-amenity-packaging/index.html': '<section class="note" style="margin-top:24px"><h2>',
  'products/beverage-bottles/index.html': '<section class="section dark">',
  'products/nail-polish-bottles/index.html': '<section class="note" style="margin-top:24px"><h2>'
};

const decodeHtml = value => String(value ?? '')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#039;|&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');
const escapeHtml = value => decodeHtml(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
const stripTags = value => decodeHtml(String(value ?? '').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

const dictionaries = Object.fromEntries(localeCodes.map(language => {
  const file = path.join(rootDir, 'data', 'full-translations', `${language}.json`);
  return [language, {
    ...JSON.parse(fs.readFileSync(file, 'utf8')),
    ...(applicationDecisionTranslations[language] || {})
  }];
}));

function translateValue(raw, language) {
  const dictionary = dictionaries[language];
  const leading = String(raw).match(/^\s*/)?.[0] || '';
  const trailing = String(raw).match(/\s*$/)?.[0] || '';
  const normalized = String(raw).trim().replace(/\s+/g, ' ');
  const localized = dictionary[normalized] ?? dictionary[decodeHtml(normalized)] ?? normalized;
  return `${leading}${escapeHtml(localized)}${trailing}`;
}

function localizeDecisionMarkup(markup, language) {
  let localized = markup.replace(/>([^<>]+)</g, (_match, value) => `>${translateValue(value, language)}<`);
  localized = localized.replace(/\b(aria-label|alt|title|placeholder)=("([^"]*)"|'([^']*)')/gi, (_match, attribute, quoted, doubleValue, singleValue) => {
    const quote = quoted[0];
    return `${attribute}=${quote}${translateValue(doubleValue ?? singleValue ?? '', language)}${quote}`;
  });
  localized = localized.replace(/\bhref="\/(?!\/)([^"]*)"/g, (_match, route) => `href="/${language}/${route}"`);
  return localized;
}

function localizedFaqPairs(source, beveragePage) {
  const region = beveragePage
    ? source.match(/<div class="faq-grid">([\s\S]*?)<\/div>\s*<nav class="related"/)?.[1]
    : source.match(/<div class="faq">([\s\S]*?)<\/div>\s*<\/div>/)?.[1];
  if (!region) return [];
  return [...region.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => ({
      '@type': 'Question',
      name: stripTags(match[1]),
      acceptedAnswer: { '@type': 'Answer', text: stripTags(match[2]) }
    }));
}

function syncStructuredData(source, language, relativePath) {
  const canonical = source.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (!canonical) throw new Error(`Missing canonical URL in ${language}/${relativePath}`);
  const beveragePage = relativePath.includes('beverage-bottles');
  return source.replace(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i, (block, rawJson) => {
    let data;
    try { data = JSON.parse(rawJson); } catch { return block; }
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    for (const node of graph) {
      if (node && typeof node.dateModified === 'string') node.dateModified = modifiedDate;
    }
    const faq = localizedFaqPairs(source, beveragePage);
    if (faq.length) {
      let faqNode = graph.find(node => node?.['@type'] === 'FAQPage');
      if (!faqNode) {
        faqNode = { '@type': 'FAQPage', '@id': `${canonical}#faq`, url: canonical };
        graph.push(faqNode);
      }
      faqNode['@id'] = `${canonical}#faq`;
      faqNode.url = canonical;
      faqNode.mainEntity = faq;
    }
    if (Array.isArray(data['@graph'])) data['@graph'] = graph;
    else Object.assign(data, graph[0]);
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  });
}

for (const [relativePath, insertionBefore] of Object.entries(pages)) {
  const englishPath = path.join(rootDir, relativePath);
  const english = fs.readFileSync(englishPath, 'utf8');
  const block = english.match(new RegExp(`${decisionStart}[\\s\\S]*?${decisionEnd}`))?.[0];
  if (!block) throw new Error(`Missing application decision block in ${relativePath}`);
  for (const language of localeCodes) {
    const targetPath = path.join(rootDir, language, relativePath);
    let source = fs.readFileSync(targetPath, 'utf8');
    const localizedBlock = localizeDecisionMarkup(block, language);
    const existing = new RegExp(`${decisionStart}[\\s\\S]*?${decisionEnd}`);
    if (existing.test(source)) source = source.replace(existing, localizedBlock);
    else {
      const insertAt = source.indexOf(insertionBefore);
      if (insertAt < 0) throw new Error(`Insertion point not found in ${language}/${relativePath}`);
      source = `${source.slice(0, insertAt)}${localizedBlock}\n  ${source.slice(insertAt)}`;
    }
    source = syncStructuredData(source, language, relativePath);
    fs.writeFileSync(targetPath, source);
  }
}

console.log(`Synchronized ${Object.keys(pages).length * localeCodes.length} localized application pages.`);
