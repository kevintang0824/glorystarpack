import fs from 'node:fs';
import path from 'node:path';
import { localeCodes } from '../data/site-locales.mjs';
import { commercialApplicationTranslations } from '../data/commercial-application-translations.mjs';

const root = path.resolve(import.meta.dirname, '..');
const modifiedDate = '2026-09-17';
const pages = [
  ['products/cosmetic-packaging-kits/index.html', 'kit-route-title', 'kit-rfq-title'],
  ['products/cosmetic-sample-packaging/index.html', 'sample-route-title', 'sample-rfq-title'],
  ['products/personal-care-packaging/index.html', 'personal-care-route-title', 'personal-care-rfq-title']
];

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

const dictionaries = Object.fromEntries(localeCodes.map(language => {
  const file = path.join(root, 'data', 'full-translations', `${language}.json`);
  return [language, {
    ...JSON.parse(fs.readFileSync(file, 'utf8')),
    ...(commercialApplicationTranslations[language] || {})
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

function localizeMarkup(markup, language) {
  let localized = markup.replace(/>([^<>]+)</g, (_match, value) => `>${translateValue(value, language)}<`);
  localized = localized.replace(/\b(aria-label|alt|title|placeholder)=("([^"]*)"|'([^']*)')/gi, (_match, attribute, quoted, doubleValue, singleValue) => {
    const quote = quoted[0];
    return `${attribute}=${quote}${translateValue(doubleValue ?? singleValue ?? '', language)}${quote}`;
  });
  localized = localized.replace(/\bhref="\/(?!\/)([^\"]*)"/g, (_match, route) => `href="/${language}/${route}"`);
  return localized;
}

function extractSection(source, id) {
  const match = source.match(new RegExp(`<section\\b[^>]*aria-labelledby="${id}"[^>]*>[\\s\\S]*?<\\/section>`));
  if (!match) throw new Error(`Missing section ${id}`);
  return match[0];
}

function syncDate(source, language) {
  const reviewed = commercialApplicationTranslations[language]['Page reviewed 2026-09-17'];
  return source
    .replace(/Page reviewed \d{4}-\d{2}-\d{2}/g, reviewed)
    .replace(/("dateModified"\s*:\s*)"\d{4}-\d{2}-\d{2}"/g, `$1"${modifiedDate}"`)
    .replace(/\n +\n/g, '\n\n');
}

for (const [relativePath, decisionId, rfqId] of pages) {
  const englishPath = path.join(root, relativePath);
  const english = fs.readFileSync(englishPath, 'utf8');
  const decision = extractSection(english, decisionId);
  const rfq = extractSection(english, rfqId);
  const blockPattern = new RegExp(`<section\\b[^>]*aria-labelledby="${decisionId}"[^>]*>[\\s\\S]*?<\\/section>\\s*<section\\b[^>]*aria-labelledby="${rfqId}"[^>]*>[\\s\\S]*?<\\/section>`);
  const insertionPoint = '<section class="note" style="margin-top:24px"><h2>';

  for (const language of localeCodes) {
    const targetPath = path.join(root, language, relativePath);
    let source = fs.readFileSync(targetPath, 'utf8');
    const localizedBlock = localizeMarkup(`${decision}\n  ${rfq}`, language);
    if (blockPattern.test(source)) source = source.replace(blockPattern, localizedBlock);
    else {
      const insertAt = source.indexOf(insertionPoint);
      if (insertAt < 0) throw new Error(`Insertion point not found in ${language}/${relativePath}`);
      source = `${source.slice(0, insertAt)}${localizedBlock}\n  ${source.slice(insertAt)}`;
    }
    fs.writeFileSync(targetPath, syncDate(source, language));
  }
}

console.log(`Synchronized ${pages.length * localeCodes.length} localized commercial application pages.`);
