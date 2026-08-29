import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const sourceFlag = process.argv.indexOf('--source');
const sourceDir = sourceFlag >= 0 ? path.resolve(process.argv[sourceFlag + 1] ?? '') : '';
const skipImages = process.argv.includes('--skip-images');
const generatedStart = '// BEGIN GENERATED FINER PACKAGING PRODUCTS';
const generatedEnd = '// END GENERATED FINER PACKAGING PRODUCTS';
const importedCategoryTitles = {
  all: 'All Packaging Products',
  'cosmetic-paper-packaging': 'Cosmetic Paper Packaging',
  'mailer-box': 'Mailer & Shipping Boxes',
  'paper-bag': 'Paper Bags & Mailers',
  'gift-box': 'Gift Boxes',
  'food-paper-packaging': 'Food Paper Packaging',
  'candle-packaging': 'Candle Packaging',
  'clothing-packaging': 'Apparel Packaging',
  'retail-display': 'Retail Displays',
  'labels-cards': 'Labels, Tags & Printed Cards',
  'flexible-pouch': 'Flexible Pouches & Poly Bags'
};
const importedCategoryCopy = {
  all: ['All Packaging Products', 'Browse the complete packaging catalog by primary material, format, application and project requirement.'],
  'cosmetic-paper-packaging': ['Cosmetic Paper Packaging', 'Folding cartons, rigid boxes, sleeves, drawer boxes and printed retail packs for beauty projects. Confirm material, structure, inserts and decoration by construction.'],
  'mailer-box': ['Mailer and Shipping Boxes', 'Corrugated mailers, kraft shipping boxes and e-commerce cartons. Confirm board, closure, print, insert and packed-product requirements.'],
  'paper-bag': ['Paper Bags and Mailers', 'Shopping bags, paper mailers and envelopes. Confirm paper, handle or seal, load, print and packed-product protection.'],
  'gift-box': ['Gift Boxes', 'Rigid, magnetic, drawer, lid-and-base and folding gift box references. Confirm board, insert, closure, finish and artwork.'],
  'food-paper-packaging': ['Food Paper Packaging', 'Paper-packaging references for bakery, confectionery, takeaway, sushi and tea. Confirm food-contact, liner, barrier and destination requirements.'],
  'candle-packaging': ['Candle Packaging', 'Cartons, rigid boxes, sleeves and kits for candles and home fragrance. Confirm dimensions, inserts, board, finish and shipping protection.'],
  'clothing-packaging': ['Apparel Packaging', 'Boxes, mailers, tags and flexible packs for apparel. Confirm structure, material, closure, print and packed-product requirements.'],
  'retail-display': ['Retail Displays', 'Cardboard counter and shelf displays. Confirm footprint, load, product count, board, print and assembly route.'],
  'labels-cards': ['Labels, Tags and Printed Cards', 'Hang tags, labels, inserts, cards and booklets. Confirm substrate, adhesive or string, dimensions, print and finish.'],
  'flexible-pouch': ['Flexible Pouches and Poly Bags', 'Pouch, zipper-bag and flexible-mailer references. Confirm film or laminate, seal, barrier, dimensions and print.']
};

if (!sourceDir) {
  throw new Error('Pass the source folder with --source /absolute/path/to/finerpackaging');
}

const csvPath = path.join(sourceDir, 'products.csv');
const groupsPath = path.join(sourceDir, 'groups.json');
const productDataPath = path.join(rootDir, 'assets/js/product-data.js');
const imageOutputDir = path.join(rootDir, 'assets/product-photos');
const reportPath = path.join(rootDir, 'data/finer-packaging-import-report.json');

for (const requiredPath of [csvPath, groupsPath, productDataPath]) {
  if (!fs.existsSync(requiredPath)) throw new Error(`Required file not found: ${requiredPath}`);
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header, index) => index === 0 ? header.replace(/^\uFEFF/, '') : header) ?? [];
  return rows
    .filter(values => values.some(Boolean))
    .map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function cleanTitle(value) {
  let title = String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^(?:(?:20\d{2}|wholesales?|hot[ -]?sale|new(?:est)?(?: trend)?|high quality|best price|cheap(?:est)? price|factory direct|oem|odm)\b[\s,:-]*)+/i, '')
    .replace(/\bsliver\b/gi, 'Silver')
    .replace(/\bFSC(?:[ -](?:certified|certificate|certification))?\b/gi, '')
    .replace(/\b(?:FDA|ISO(?:\s*\d+)?|RoHS|BSCI)(?:[ -]?(?:certified|certificate|certification))?\b/gi, '')
    .replace(/\b(?:certified|certificate)\b/gi, '')
    .replace(/\bPCR\b/gi, '')
    .replace(/\b(?:eco(?:[ -]*friend(?:ly)?)?|environmental(?:ly)?[ -]*friendly|earth[ -]*friendly|recycl(?:e|able|ed)|(?:bio[ -]?)?degradable|compostable|sustainable|plastic[ -]?free|bio[ -]?based)\b/gi, '')
    .replace(/\b(?:renewable|responsibly[ -]?sourced|low[ -]?carbon|carbon[ -]?neutral|zero[ -]?waste)\b/gi, '')
    .replace(/\breusable\b/gi, '')
    .replace(/\bfriendly\b/gi, '')
    .replace(/\b(?:keto|low[ -]?carb)\b/gi, '')
    .replace(/\bsoy[ -]?ink\b/gi, 'Ink Option')
    .replace(/\bnon[ -]?toxic\b/gi, '')
    .replace(/\bfood[ -]?grade\b/gi, 'Food Packaging')
    .replace(/\bwaterproof\b/gi, 'Water-Resistance Option')
    .replace(/\bleakproof\b/gi, 'Leakage-Review')
    .replace(/\bMOQ\s*\d+(?:\s*(?:pcs?|pieces?))?\b/gi, '')
    .replace(/\b(?:factory|wholesale|low|best|cheap(?:est)?)\s+price\b/gi, '')
    .replace(/\b(?:high[ -]?quality|best[ -]?selling|hot[ -]?selling|hot[ -]?sale|newest|cheapest|wholesales?|manufacturer|supplier|factory(?:[ -]?direct)?|direct from factory|from factory|free[ -]?samples?|free[ -]?shipping|fast[ -]?delivery|ready[ -]?to[ -]?ship)\b/gi, '')
    .replace(/\b(?:bulk[ -]?orders?|low[ -]?moq|fast[ -]?lead[ -]?time)\b/gi, '')
    .replace(/\bprice\b/gi, '')
    .replace(/\b100%\b/g, '')
    .replace(/\bfree design\b/gi, '')
    .replace(/\b(?:accept|ltd\.?|free)\b/gi, '')
    .replace(/(\w)[-–—]+\s+/g, '$1 ')
    .replace(/\s+[-–—]+(?=\w)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\s*(?:of|for)\s+/i, '')
    .replace(/^[\s,:;/-]+|[\s,:;/-]+$/g, '')
    .trim();
  const words = title.split(' ').filter(Boolean);
  title = words.filter((word, index) => index === 0 || word.toLowerCase() !== words[index - 1].toLowerCase()).join(' ');
  if (title.length > 132) {
    title = title.slice(0, 133).replace(/\s+\S*$/, '').replace(/[,:;/-]+$/, '').trim();
  }
  return title || 'Custom Packaging Product';
}

function classifySourceCategory(row, groupPath) {
  const root = groupPath[0] ?? row.category ?? '';
  const leaf = groupPath.at(-1) ?? row.category ?? '';
  const searchable = `${root} ${leaf} ${row.title}`.toLowerCase();
  const title = String(row.title ?? '').toLowerCase();

  if (root === 'Clothing Packaging' && groupPath.includes('Poly Bag')) return 'flexible-pouch';
  if (root === 'Pouches') return 'flexible-pouch';
  if (root === 'Cardboard Displays' || /\b(?:pdq|counter|shelf) display\b|\bdisplay stand\b/.test(searchable)) return 'retail-display';
  if (root === 'Paper Cards & Booklet' || root === 'Sticker&Label' || leaf === 'Hang Tag & Strings') return 'labels-cards';
  if (root === 'Paper Bag') return 'paper-bag';

  const cosmeticApplication = /\b(?:cosmetic|skin ?care|beauty|makeup|serum|face cream|soap|perfume|wig)\b/.test(title);
  const foodApplication = /\b(?:sushi|food|burger|cake|chocolate|cookie|bakery|bread|pastry|donut|macaron|tea)\b/.test(title);
  if (root === 'Cosmetic Packaging' && /\b(?:candle|reed diffuser|diffuser|scented oil|air freshener)\b/.test(title) && !cosmeticApplication) return 'candle-packaging';
  if (root === 'Cosmetic Packaging' && /\b(?:jewelry|earring|necklace|ring)\b/.test(title) && !cosmeticApplication) return 'gift-box';
  if (root === 'Food Packaging' && /\b(?:shipping|mailing|mailer)\b/.test(title) && !foodApplication) return 'mailer-box';
  if (root === 'Mailer Box & Shipping Box' && foodApplication) return 'food-paper-packaging';
  if (root === 'Gift Box' && /\bburger box\b/.test(title)) return 'food-paper-packaging';

  if (root === 'Mailer Box & Shipping Box') return 'mailer-box';
  if (root === 'Gift Box' && (leaf === 'Tube' || /\bpaper tube\b|\bcylinder tube\b|\bround tube\b/.test(searchable))) return 'paper-tube';
  if (root === 'Gift Box') return 'gift-box';
  if (root === 'Cosmetic Packaging') return 'cosmetic-paper-packaging';
  if (root === 'Food Packaging' || root === 'Sushi Packaging Box' || root === 'Tea Packaging') return 'food-paper-packaging';
  if (root === 'Candle Packaging') return 'candle-packaging';
  if (root === 'Clothing Packaging') return 'clothing-packaging';

  if (/\b(?:poly|plastic) (?:bag|mailer)|\bpouch\b|\bzipper bag\b/.test(searchable)) return 'flexible-pouch';
  if (/\bpaper bag\b|\bshopping bag\b|\bmailer bag\b|\benvelope\b/.test(searchable)) return 'paper-bag';
  if (/\bcandle\b|\bwax melt\b/.test(searchable)) return 'candle-packaging';
  if (/\bsushi\b|\bfood\b|\bcake\b|\bchocolate\b|\bcookie\b|\bbakery\b|\btea\b|\bcandy\b/.test(searchable)) return 'food-paper-packaging';
  if (/\bmailer\b|\bshipping box\b|\bcorrugated box\b/.test(searchable)) return 'mailer-box';
  if (/\bdisplay\b/.test(searchable)) return 'retail-display';
  if (/\bsticker\b|\blabel\b|\bhang tag\b|\bbooklet\b|\bcard\b/.test(searchable)) return 'labels-cards';
  if (/\bcosmetic\b|\bskincare\b|\bmakeup\b|\blipstick\b|\blip gloss\b|\bperfume\b|\bsoap\b|\bface cream\b/.test(searchable)) return 'cosmetic-paper-packaging';
  return 'gift-box';
}

function sourceGroupPath(row) {
  const group = groupById.get(String(row.category_id));
  return [...(group?.path ?? []), group?.name ?? row.category]
    .filter(Boolean)
    .map(part => String(part).replace('Lid $ Base Box', 'Lid & Base Box'));
}

function websiteCategories(category, title) {
  const cats = [category];
  const searchable = title.toLowerCase();
  if (category === 'paper-tube') cats.push('paper-tube');
  if (['mailer-box', 'gift-box', 'cosmetic-paper-packaging', 'food-paper-packaging', 'candle-packaging', 'clothing-packaging', 'retail-display'].includes(category)) cats.push('paper-box');
  if (category === 'candle-packaging') cats.push('home-fragrance');
  if (category === 'cosmetic-paper-packaging') cats.push('personal-care');
  if (/\bsoap\b|\bbody care\b|\bbath\b|\bspa\b/.test(searchable)) cats.push('spa-body');
  if (/\bhotel\b|\bamenit(?:y|ies)\b/.test(searchable)) cats.push('hotel-amenity');
  if (category === 'cosmetic-paper-packaging' && /\bbeard\b|\bshaving\b|\bmen'?s grooming\b/.test(searchable)) cats.push('men-grooming');
  return [...new Set(cats)];
}

function primaryMaterialCategory(category, title = '') {
  if (/\b(?:PLA|PBAT)\b/i.test(title)) return 'material-bio';
  if (category === 'labels-cards' && (/\b(?:sticker|adhesive|vinyl)\b/i.test(title) || /\b(?:PVC|PET|PP)\b/.test(title))) return 'material-flexible';
  return category === 'flexible-pouch' ? 'material-flexible' : 'material-paper-pulp';
}

function materialName(category, title) {
  const original = String(title ?? '');
  const searchable = original.toLowerCase();
  if (/\bpbat\b/.test(searchable)) return 'PLA / PBAT Flexible Film (Composition to Confirm)';
  if (/\bpla\b/.test(searchable)) return 'PLA Flexible Film (Composition to Confirm)';
  if (category === 'labels-cards' && /\bPVC\b/.test(original)) return 'PVC Label Stock (Composition to Confirm)';
  if (category === 'labels-cards' && /\bvinyl\b/.test(searchable)) return 'Vinyl Label Stock (Composition to Confirm)';
  if (category === 'labels-cards' && /\bPET\b/.test(original)) return 'PET Label Stock (Composition to Confirm)';
  if (category === 'labels-cards' && /\bPP\b/.test(original)) return 'PP Label Stock (Composition to Confirm)';
  if (category === 'labels-cards' && /\b(?:sticker|adhesive)\b/.test(searchable)) return 'Flexible Label Stock (Composition to Confirm)';
  if (category === 'flexible-pouch' && /\balumin(?:um|ium) foil\b/.test(searchable)) return 'Foil / Flexible Laminate (Layer Structure to Confirm)';
  if (category === 'flexible-pouch' && /\bPVC\b/.test(original)) return 'PVC Flexible Film (Composition to Confirm)';
  if (category === 'flexible-pouch' && /\bvinyl\b/.test(searchable)) return 'Vinyl Flexible Film (Composition to Confirm)';
  if (category === 'flexible-pouch' && /\bPET\b/.test(original)) return 'PET Flexible Film / Laminate (Composition to Confirm)';
  if (category === 'flexible-pouch' && /\bPP\b/.test(original)) return 'PP Flexible Film (Composition to Confirm)';
  if (category === 'flexible-pouch') return /\bpaper\b|\bkraft\b/.test(searchable) ? 'Paper / Flexible Laminate' : 'Flexible Film / Laminate';
  if (category === 'labels-cards') return 'Paper / Card Stock';
  if (/\bcorrugat(?:e|ed)\b|\bflute\b/.test(searchable)) return 'Corrugated Paperboard';
  if (/\bkraft\b/.test(searchable)) return 'Kraft Paper / Paperboard';
  if (/\bcotton paper\b/.test(searchable)) return 'Cotton Paper (Grade to Confirm)';
  if (/\bivory (?:board|paperboard|paper)\b/.test(searchable)) return 'Ivory Paperboard (Grade to Confirm)';
  if (/\bgrey ?board\b|\bgray ?board\b|\brigid\b/.test(searchable)) return 'Rigid Paperboard';
  if (/\bart paper\b/.test(searchable)) return 'Art Paper / Paperboard';
  return 'Paperboard';
}

function finishName(category, title) {
  const searchable = title.toLowerCase();
  const finishes = [];
  if (/\bmatt?e? lamination\b|\bmatte finish\b/.test(searchable)) finishes.push('Matte Lamination');
  if (/\bgloss(?:y)? lamination\b|\bgloss finish\b/.test(searchable)) finishes.push('Gloss Lamination');
  if (/\bholographic\b/.test(searchable)) finishes.push('Holographic Finish');
  if (/\bemboss(?:ed|ing)?\b/.test(searchable)) finishes.push('Embossing');
  if (category !== 'flexible-pouch' && /\bfoil\b|\b(?:gold|silver) stamp(?:ed|ing)?\b|\bhot stamp(?:ed|ing)?\b/.test(searchable)) finishes.push('Foil Stamping');
  if (/\bspot uv\b|\buv coat(?:ed|ing)?\b/.test(searchable)) finishes.push('UV Coating');
  if (/\bvarnish(?:ed|ing)?\b/.test(searchable)) finishes.push('Varnish');
  if (/\bsilk[ -]?screen\b/.test(searchable)) finishes.push('Screen Printing');
  if (/\bcmyk\b|\boffset print(?:ed|ing)?\b|\bcustom print(?:ed|ing)?\b|\bcustom logo\b/.test(searchable)) finishes.push('Custom Print');
  return [...new Set(finishes)].slice(0, 4).join(' / ') || 'Custom Print / Finish to Confirm';
}

function materialEvidenceKey(category, title) {
  return `${materialName(category, title)}:${primaryMaterialCategory(category, title)}`;
}

function categoryDescription(category) {
  return ({
    'cosmetic-paper-packaging': 'cosmetic and beauty paper packaging',
    'mailer-box': 'mailer and shipping box',
    'paper-bag': 'paper bag and mailer',
    'gift-box': 'gift box',
    'paper-tube': 'paper tube',
    'food-paper-packaging': 'food and takeaway paper packaging',
    'candle-packaging': 'candle and home-fragrance packaging',
    'clothing-packaging': 'apparel packaging',
    'retail-display': 'retail display',
    'labels-cards': 'printed card, tag or label',
    'flexible-pouch': 'flexible pouch or bag'
  })[category] ?? 'custom packaging';
}

function productDescription(name, category) {
  return `${name} is listed as a ${categoryDescription(category)} reference for custom packaging projects. Confirm structure, dimensions, materials, print coverage, insert, finish, packed performance and destination requirements for the selected construction.`;
}

function productReviewNote(category) {
  const materialReview = category === 'flexible-pouch'
    ? 'film or laminate structure, sealing method and barrier requirements'
    : 'paper grade, board thickness, structural style, insert and closure method';
  return `The imported listing is a visual and MOQ reference, not a frozen production specification. Confirm the ${materialReview}, artwork, color target, finish, tolerances, packing and current commercial terms before sample approval or bulk planning.`;
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const groupDefinitions = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));
const groupById = new Map(groupDefinitions.map(group => [String(group.id), group]));
const imageHashCache = new Map();
const sourceByHash = new Map();
const groupedProducts = new Map();

for (const row of rows) {
  const imageRelPaths = row.local_images.split(';').filter(Boolean);
  if (!imageRelPaths.length) throw new Error(`Product ${row.offer_id} has no local images`);
  const imageHashes = [];
  for (const relativePath of imageRelPaths) {
    const absolutePath = path.join(sourceDir, relativePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`Missing image for ${row.offer_id}: ${absolutePath}`);
    let hash = imageHashCache.get(absolutePath);
    if (!hash) {
      hash = hashFile(absolutePath);
      imageHashCache.set(absolutePath, hash);
      if (!sourceByHash.has(hash)) sourceByHash.set(hash, absolutePath);
    }
    if (!imageHashes.includes(hash)) imageHashes.push(hash);
  }
  const groupPath = sourceGroupPath(row);
  const category = classifySourceCategory(row, groupPath);
  const titleEvidence = cleanTitle(row.title).toLowerCase();
  const signature = `${category}:${materialEvidenceKey(category, row.title)}:${finishName(category, row.title)}:${titleEvidence}:${imageHashes.join(':')}`;
  if (!groupedProducts.has(signature)) groupedProducts.set(signature, { imageHashes, rows: [] });
  groupedProducts.get(signature).rows.push(row);
}

function representativeRow(groupRows) {
  return [...groupRows].sort((left, right) => {
    const soldDelta = Number(right.sold_180d || 0) - Number(left.sold_180d || 0);
    if (soldDelta) return soldDelta;
    const titleDelta = cleanTitle(left.title).length - cleanTitle(right.title).length;
    if (titleDelta) return titleDelta;
    return Number(left.offer_id) - Number(right.offer_id);
  })[0];
}

const candidateRecords = [...groupedProducts.values()]
  .map(group => ({ ...group, representative: representativeRow(group.rows) }))
  .sort((left, right) => Number(left.representative.offer_id) - Number(right.representative.offer_id));

const usedImageNames = new Map();
function websiteImagePath(hash) {
  const shortHash = hash.slice(0, 20);
  const existing = usedImageNames.get(shortHash);
  if (existing && existing !== hash) throw new Error(`Image hash prefix collision: ${shortHash}`);
  usedImageNames.set(shortHash, hash);
  return `assets/product-photos/fp-${shortHash}.avif`;
}

const nameCounts = new Map();
const products = [];
const mappings = [];

for (const record of candidateRecords) {
  const row = record.representative;
  const groupPath = sourceGroupPath(row);
  const category = classifySourceCategory(row, groupPath);
  let name = cleanTitle(row.title);
  const nameKey = name.toLowerCase();
  const nextCount = (nameCounts.get(nameKey) ?? 0) + 1;
  nameCounts.set(nameKey, nextCount);
  if (nextCount > 1) name = `${name} – Style ${nextCount}`;
  const moq = String(Math.max(1, Number.parseInt(row.moq_num, 10) || Number.parseInt(row.moq, 10) || 1));
  const images = record.imageHashes.map(websiteImagePath);
  const cats = [...new Set(record.rows.flatMap(item => websiteCategories(category, item.title)))];
  const sourceCategory = groupPath.join(' > ') || row.category || 'Ungrouped';
  const websiteId = `p${row.offer_id}`;

  products.push({
    id: websiteId,
    name,
    size: 'Custom Size',
    mat: materialName(category, row.title),
    finish: finishName(category, row.title),
    moq,
    ic: '📦',
    badge: 'custom',
    cats,
    desc: productDescription(name, category),
    tab: productReviewNote(category),
    materialGroup: primaryMaterialCategory(category, row.title),
    sourceCategory,
    referenceMoq: true,
    images
  });

  mappings.push({
    websiteId,
    name,
    titleOriginal: row.title,
    sourceOfferId: row.offer_id,
    duplicateSourceOfferIds: record.rows.map(item => item.offer_id).filter(id => id !== row.offer_id),
    sourceCategory,
    sourceCategoryId: row.category_id,
    websiteCategories: cats,
    materialGroup: primaryMaterialCategory(category, row.title),
    sourceMoq: row.moq,
    sourceImageCount: row.local_images.split(';').filter(Boolean).length,
    publishedImageCount: images.length,
    images
  });
}

function encodeImage(sourcePath, outputPath) {
  return new Promise((resolve, reject) => {
    const temporaryPath = `${outputPath}.tmp-${process.pid}.avif`;
    const args = [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-i', sourcePath,
      '-vf', "scale=w='min(800,iw)':h='min(800,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      '-frames:v', '1',
      '-c:v', 'libsvtav1',
      '-preset', '10',
      '-crf', '40',
      '-pix_fmt', 'yuv420p10le',
      temporaryPath
    ];
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr = `${stderr}${chunk}`.slice(-6000); });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath);
        reject(new Error(`ffmpeg failed for ${sourcePath}: ${stderr.trim()}`));
        return;
      }
      if (!fs.existsSync(temporaryPath) || fs.statSync(temporaryPath).size === 0) {
        reject(new Error(`ffmpeg produced no image for ${sourcePath}`));
        return;
      }
      fs.renameSync(temporaryPath, outputPath);
      resolve();
    });
  });
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  let completed = 0;
  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
      completed += 1;
      if (completed % 100 === 0 || completed === items.length) {
        console.log(`Optimized images: ${completed}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
}

fs.mkdirSync(imageOutputDir, { recursive: true });
const imageJobs = [...sourceByHash.entries()].map(([hash, sourcePath]) => ({
  hash,
  sourcePath,
  outputPath: path.join(rootDir, websiteImagePath(hash))
}));

if (!skipImages) {
  const pending = imageJobs.filter(job => !fs.existsSync(job.outputPath) || fs.statSync(job.outputPath).size === 0);
  console.log(`Unique source images: ${imageJobs.length}; pending optimization: ${pending.length}`);
  const concurrency = Math.max(1, Math.min(2, os.availableParallelism?.() ?? os.cpus().length));
  await runPool(pending, concurrency, job => encodeImage(job.sourcePath, job.outputPath));
}

for (const job of imageJobs) {
  if (!fs.existsSync(job.outputPath) || fs.statSync(job.outputPath).size === 0) {
    throw new Error(`Published image is missing: ${job.outputPath}`);
  }
}

const generatedBlock = `${generatedStart}\nwindow.GSP_FINER_CATEGORY_TITLES = ${JSON.stringify(importedCategoryTitles)};\nwindow.GSP_FINER_CATEGORY_COPY = ${JSON.stringify(importedCategoryCopy)};\nwindow.GSP_PRODUCTS = window.GSP_PRODUCTS.concat([\n${products.map(product => `  ${JSON.stringify(product)}`).join(',\n')}\n]);\n${generatedEnd}`;
let productDataSource = fs.readFileSync(productDataPath, 'utf8').trimEnd();
const existingStart = productDataSource.indexOf(generatedStart);
const existingEnd = productDataSource.indexOf(generatedEnd);
if (existingStart >= 0 || existingEnd >= 0) {
  if (existingStart < 0 || existingEnd < existingStart) throw new Error('Generated product-data markers are inconsistent');
  productDataSource = `${productDataSource.slice(0, existingStart).trimEnd()}\n`;
}
fs.writeFileSync(productDataPath, `${productDataSource}\n\n${generatedBlock}\n`);

const categoryCounts = {};
const materialCounts = {};
for (const product of products) {
  categoryCounts[product.cats[0]] = (categoryCounts[product.cats[0]] ?? 0) + 1;
  materialCounts[product.materialGroup] = (materialCounts[product.materialGroup] ?? 0) + 1;
}
const imageBytes = imageJobs.reduce((total, job) => total + fs.statSync(job.outputPath).size, 0);
const report = {
  generatedAt: new Date().toISOString(),
  sourceDirectory: path.basename(sourceDir),
  sourceProductCount: rows.length,
  importedProductCount: products.length,
  duplicateListingCount: rows.length - products.length,
  duplicateGalleryGroupCount: [...groupedProducts.values()].filter(group => group.rows.length > 1).length,
  sourceImageReferenceCount: rows.reduce((total, row) => total + row.local_images.split(';').filter(Boolean).length, 0),
  uniquePublishedImageCount: imageJobs.length,
  publishedImageBytes: imageBytes,
  categoryCounts: Object.fromEntries(Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])),
  materialCounts,
  notes: [
    'Products with identical ordered unique image galleries, the same website category and matching normalized title, material and finish evidence were consolidated into one website product.',
    'All unique gallery images used by imported products were converted to local AVIF assets.',
    'Source listing prices and URLs are not written to the published catalog or this import report.',
    'Source MOQ values are presented as reference values that require project confirmation.',
    'Descriptions and finish labels are evidence-bounded normalizations of source titles, not frozen production specifications.'
  ],
  mappings
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Imported ${products.length} products from ${rows.length} source listings.`);
console.log(`Consolidated ${rows.length - products.length} duplicate listings across ${report.duplicateGalleryGroupCount} duplicate gallery groups.`);
console.log(`Published ${imageJobs.length} unique AVIF images (${(imageBytes / 1024 / 1024).toFixed(2)} MiB).`);
console.log(`Updated ${path.relative(rootDir, productDataPath)} and ${path.relative(rootDir, reportPath)}.`);
