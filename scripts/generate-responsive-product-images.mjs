import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const productsDir = path.join(rootDir, 'products');
const widths = [480, 960];
const force = process.argv.includes('--force');

const productPages = fs.readdirSync(productsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /-p\d+$/.test(entry.name))
  .map(entry => path.join(productsDir, entry.name, 'index.html'))
  .filter(filePath => fs.existsSync(filePath));

const sourceImages = new Set();
for (const pagePath of productPages) {
  const source = fs.readFileSync(pagePath, 'utf8');
  const imageUrl = source.match(/<div class="hero-media">[\s\S]*?<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
  if (!imageUrl?.startsWith('/assets/product-photos/') || !/\.jpe?g$/i.test(imageUrl)) {
    throw new Error(`Could not resolve the product hero JPEG in ${path.relative(rootDir, pagePath)}`);
  }
  const imagePath = path.join(rootDir, imageUrl.slice(1));
  if (!fs.existsSync(imagePath)) throw new Error(`Missing source image: ${imageUrl}`);
  sourceImages.add(imagePath);
}

let generated = 0;
let skipped = 0;
let sourceBytes = 0;
let responsiveBytes = 0;

for (const sourcePath of [...sourceImages].sort()) {
  const sourceStat = fs.statSync(sourcePath);
  sourceBytes += sourceStat.size;
  for (const width of widths) {
    const outputPath = sourcePath.replace(/\.jpe?g$/i, `-${width}.avif`);
    const current = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
    if (!force && current && current.size > 0 && current.mtimeMs >= sourceStat.mtimeMs) {
      responsiveBytes += current.size;
      skipped += 1;
      continue;
    }

    const temporaryPath = outputPath.replace(/\.avif$/i, '.tmp.avif');
    try {
      execFileSync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', sourcePath,
        '-vf', `scale=${width}:-2`,
        '-frames:v', '1',
        '-c:v', 'libsvtav1',
        '-preset', '8',
        '-crf', '35',
        temporaryPath
      ], { stdio: 'pipe' });
      const temporaryStat = fs.statSync(temporaryPath);
      if (!temporaryStat.size) throw new Error(`Encoder produced an empty file for ${outputPath}`);
      fs.renameSync(temporaryPath, outputPath);
      responsiveBytes += temporaryStat.size;
      generated += 1;
    } catch (error) {
      if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath);
      throw new Error(`Failed to generate ${path.relative(rootDir, outputPath)}: ${error.message}`);
    }
  }
}

const formatMiB = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
console.log(`Responsive product images: ${generated} generated, ${skipped} current, ${sourceImages.size} products.`);
console.log(`Selected source JPEGs: ${formatMiB(sourceBytes)}; 480px + 960px AVIF variants: ${formatMiB(responsiveBytes)}.`);
