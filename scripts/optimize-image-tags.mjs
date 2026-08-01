import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const ignoredDirectories = new Set(['.git', 'backups', 'data', 'tmp']);
const ignoredFiles = new Set(['glorystarpack (1).html']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    if (entry.isFile() && ignoredFiles.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

function jpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    const segmentLength = buffer.readUInt16BE(offset);
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    if (segmentLength < 2) break;
    offset += segmentLength;
  }
  return null;
}

function pngDimensions(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature || buffer.length < 24) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function imageDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return jpegDimensions(buffer);
  if (extension === '.png') return pngDimensions(buffer);
  return null;
}

function resolveImage(pagePath, source) {
  const cleanSource = source.split(/[?#]/)[0];
  if (!cleanSource || cleanSource.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(cleanSource)) return null;
  return cleanSource.startsWith('/')
    ? path.join(rootDir, cleanSource)
    : path.resolve(path.dirname(pagePath), cleanSource);
}

let updatedPages = 0;
let updatedImages = 0;

for (const pagePath of walk(rootDir)) {
  let source = fs.readFileSync(pagePath, 'utf8');
  let imageIndex = 0;
  let pageChanges = 0;
  source = source.replace(/<img\b[^>]*>/gi, tag => {
    const isPrimaryImage = imageIndex === 0;
    imageIndex += 1;
    const imageSource = tag.match(/\bsrc=["']([^"']+)/i)?.[1];
    if (!imageSource) return tag;
    const imagePath = resolveImage(pagePath, imageSource);
    if (!imagePath || !fs.existsSync(imagePath)) return tag;
    const dimensions = imageDimensions(imagePath);
    if (!dimensions?.width || !dimensions?.height) return tag;
    const declaredWidth = Number(tag.match(/\bwidth=["'](\d+)/i)?.[1] ?? 0);
    const declaredHeight = Number(tag.match(/\bheight=["'](\d+)/i)?.[1] ?? 0);
    if (declaredWidth === dimensions.width && declaredHeight === dimensions.height) return tag;

    pageChanges += 1;
    updatedImages += 1;

    let optimized = tag;
    if (/\bwidth=["'][^"']+["']/i.test(optimized)) {
      optimized = optimized.replace(/\bwidth=["'][^"']+["']/i, `width="${dimensions.width}"`);
    } else {
      optimized = optimized.replace(/(\bsrc=["'][^"']+["'])/i, `$1 width="${dimensions.width}"`);
    }
    if (/\bheight=["'][^"']+["']/i.test(optimized)) {
      optimized = optimized.replace(/\bheight=["'][^"']+["']/i, `height="${dimensions.height}"`);
    } else {
      optimized = optimized.replace(/(\bwidth=["'][^"']+["'])/i, `$1 height="${dimensions.height}"`);
    }
    if (!/\bdecoding=["']/.test(optimized)) {
      optimized = optimized.replace(/>$/, ' decoding="async">');
    }
    if (isPrimaryImage && !/\b(?:fetchpriority|loading)=["']/.test(optimized)) {
      optimized = optimized.replace(/>$/, ' fetchpriority="high">');
    } else if (!isPrimaryImage && !/\bloading=["']/.test(optimized)) {
      optimized = optimized.replace(/>$/, ' loading="lazy">');
    }
    return optimized;
  });

  if (pageChanges) {
    fs.writeFileSync(pagePath, source);
    updatedPages += 1;
  }
}

console.log(`Optimized ${updatedImages} image tags across ${updatedPages} HTML pages.`);
