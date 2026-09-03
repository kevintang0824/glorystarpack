import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installLanguageSwitcher, languages } from './language-switcher.mjs';
import { localeCodes } from '../data/site-locales.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', '.vercel', '.wrangler', 'backups', 'node_modules', 'tmp', ...localeCodes]);
const check = process.argv.includes('--check');
let pages = 0;
let changed = 0;
const errors = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!entry.name.endsWith('.html') || ['glorystarpack (1).html', 'google130558f0f0763df4.html'].includes(entry.name)) continue;
    const source = fs.readFileSync(file, 'utf8');
    const output = check ? source : installLanguageSwitcher(source);
    pages++;
    for (const marker of ['class="gsp-language"', '/assets/css/site-language.css', '/assets/js/site-language.js', ...languages.map(([code]) => `data-gsp-language="${code}"`)]) {
      if (output.split(marker).length !== 2) errors.push(`${path.relative(root, file)}: expected exactly one ${marker}`);
    }
    if (!check && output !== source) { fs.writeFileSync(file, output); changed++; }
  }
}
walk(root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Language selector: ${pages} pages, ${languages.length} languages, ${changed} files updated.`);
