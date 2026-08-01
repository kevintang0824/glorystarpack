import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { INSIGHT_SOURCE } from '../data/insight-source.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const widths = [640, 1280];
const force = process.argv.includes('--force');
const imageUrls = new Set([
  ...Object.values(INSIGHT_SOURCE).map(article => `/${article.img.replace(/^\/+/, '')}`),
  '/assets/brand/liquor-spirit-bottle-collection-ai-2026-1440.jpg'
]);

let generated = 0;
let skipped = 0;
let sourceBytes = 0;
let responsiveBytes = 0;

for (const imageUrl of [...imageUrls].sort()) {
  const sourcePath = path.join(rootDir, imageUrl.slice(1));
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing insight image: ${imageUrl}`);
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
console.log(`Responsive insight images: ${generated} generated, ${skipped} current, ${imageUrls.size} unique sources.`);
console.log(`Insight source JPEGs: ${formatMiB(sourceBytes)}; 640px + 1280px AVIF variants: ${formatMiB(responsiveBytes)}.`);
