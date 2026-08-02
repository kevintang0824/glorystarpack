import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const ignoredDirectories = new Set(['.git', '.vercel', 'backups', 'node_modules', 'tmp']);
const ignoredFiles = new Set(['glorystarpack (1).html', 'google130558f0f0763df4.html']);
const checkOnly = process.argv.includes('--check');
const stylesheet = '<link rel="stylesheet" href="/assets/css/inquiry-conversion.css">';
const script = '<script src="/assets/js/inquiry-conversion.js" defer></script>';

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && ignoredFiles.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

const missing = [];
let changed = 0;

for (const filePath of walk(rootDir)) {
  let source = fs.readFileSync(filePath, 'utf8');
  const missingStylesheet = !source.includes('/assets/css/inquiry-conversion.css');
  const missingScript = !source.includes('/assets/js/inquiry-conversion.js');
  if (!missingStylesheet && !missingScript) continue;

  const rel = path.relative(rootDir, filePath);
  if (checkOnly) {
    missing.push(rel);
    continue;
  }
  if (!/<\/head>/i.test(source) || !/<\/body>/i.test(source)) {
    console.error(`Cannot install inquiry assets in ${rel}: missing closing head or body tag.`);
    process.exitCode = 1;
    continue;
  }
  if (missingStylesheet) source = source.replace(/<\/head>/i, `${stylesheet}\n</head>`);
  if (missingScript) source = source.replace(/<\/body>/i, `${script}\n</body>`);
  fs.writeFileSync(filePath, source);
  changed += 1;
}

if (missing.length) {
  console.error(`Inquiry conversion assets are missing from ${missing.length} HTML files:`);
  missing.forEach(file => console.error(`- ${file}`));
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Inquiry conversion layer is present on every HTML page.');
} else {
  console.log(`Installed the inquiry conversion layer on ${changed} HTML pages.`);
}
