import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const checkOnly = process.argv.includes('--check');
const ignoredDirectories = new Set(['.git', '.vercel', 'backups', 'node_modules', 'tmp', 'fr', 'es', 'pt', 'ru', 'zh-CN']);
const ignoredFiles = new Set(['index.html', 'glorystarpack (1).html', 'google130558f0f0763df4.html']);
const inaccessibleGoldPatterns = [/--gold:#c8a96e/gi, /--gold:\s+#c8a96e/gi];
const accessibleGold = '--gold:#8a6c34';

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && ignoredFiles.has(entry.name) && directory === rootDir) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

const failures = [];
let changed = 0;

for (const filePath of walk(rootDir)) {
  const source = fs.readFileSync(filePath, 'utf8');
  const hasInaccessibleGold = inaccessibleGoldPatterns.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(source);
  });
  if (!hasInaccessibleGold) continue;
  const rel = path.relative(rootDir, filePath);
  if (checkOnly) {
    failures.push(rel);
    continue;
  }
  const updated = inaccessibleGoldPatterns.reduce(
    (result, pattern) => result.replace(pattern, accessibleGold),
    source
  );
  fs.writeFileSync(filePath, updated);
  changed += 1;
}

if (failures.length) {
  console.error(`Inaccessible light-surface gold remains in ${failures.length} HTML files:`);
  failures.forEach(file => console.error(`- ${file}`));
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Inline page colors use the accessible gold token.');
} else {
  console.log(`Updated accessible gold tokens in ${changed} HTML files.`);
}
