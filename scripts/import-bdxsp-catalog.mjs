import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const sourceFlag = process.argv.indexOf('--source');
const archiveFlag = process.argv.indexOf('--archive');
const sourceArgument = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : '';
const archiveArgument = archiveFlag >= 0 ? process.argv[archiveFlag + 1] : '';
const generatedStart = '// BEGIN GENERATED BDXSP CATALOG PRODUCTS';
const generatedEnd = '// END GENERATED BDXSP CATALOG PRODUCTS';
const productDataPath = path.join(rootDir, 'assets/js/product-data.js');
const imageOutputDir = path.join(rootDir, 'assets/product-photos');
const reportPath = path.join(rootDir, 'data/bdxsp-catalog-import-report.json');
const sourceShapeNames = {
  '扁方形': 'Flat Rectangular',
  '圆柱型': 'Cylindrical',
  '球形': 'Round',
  '正方形': 'Square',
  '扁圆型': 'Flat Oval',
  '锥形': 'Conical',
  '异形': 'Special Shape'
};
const sourceTypeNames = {
  '香水玻璃瓶': 'Glass Perfume Bottle',
  '香水瓶盖': 'Perfume Bottle Cap',
  '香水喷雾器': 'Perfume Sprayer Head'
};

function argumentValue(flag, value) {
  if (flag < 0 || !value) return '';
  return path.resolve(value);
}

function findSourceRoot(candidate) {
  const possibleRoots = [
    candidate,
    path.join(candidate, 'bdxsp-catalog-full-2026-09-06'),
    ...fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()
      ? fs.readdirSync(candidate, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(candidate, entry.name))
      : []
  ];
  const match = possibleRoots.find(root => fs.existsSync(path.join(root, 'records')) && fs.existsSync(path.join(root, 'images')));
  if (!match) throw new Error(`Could not find extracted BDXSP records and images under ${candidate}`);
  return match;
}

let temporaryExtraction = '';
let sourceRoot = argumentValue(sourceFlag, sourceArgument);
if (archiveArgument) {
  const archivePath = argumentValue(archiveFlag, archiveArgument);
  if (!fs.existsSync(archivePath)) throw new Error(`Archive not found: ${archivePath}`);
  temporaryExtraction = fs.mkdtempSync(path.join(os.tmpdir(), 'gsp-bdxsp-'));
  execFileSync('unzip', ['-q', archivePath, '-d', temporaryExtraction], { stdio: 'inherit' });
  sourceRoot = findSourceRoot(temporaryExtraction);
} else if (sourceRoot) {
  sourceRoot = findSourceRoot(sourceRoot);
} else {
  throw new Error('Pass --archive /path/to/bdxsp-catalog.zip or --source /path/to/extracted/catalog');
}

function cleanup() {
  if (temporaryExtraction && fs.existsSync(temporaryExtraction)) {
    fs.rmSync(temporaryExtraction, { recursive: true, force: true });
  }
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

function normalizeSpec(value) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  return !normalized || normalized === '-' ? 'Not listed' : normalized;
}

function translateNeck(value) {
  return normalizeSpec(value)
    .replaceAll('卡口', 'crimp finish')
    .replaceAll('螺口', 'screw finish');
}

function shapeName(rawShape, sourceType) {
  if (sourceType === '香水喷雾器') return 'Sprayer Head';
  return sourceShapeNames[rawShape] || 'Shape to Confirm';
}

function shapeSlug(rawShape) {
  return ({
    '扁方形': 'flat-rectangle',
    '圆柱型': 'cylindrical',
    '球形': 'round',
    '正方形': 'square',
    '扁圆型': 'flat-oval',
    '锥形': 'conical',
    '异形': 'special-shape'
  })[rawShape] || 'other';
}

function sourceTypeKey(sourceType) {
  if (sourceType === '香水玻璃瓶') return 'bottle';
  if (sourceType === '香水瓶盖') return 'cap';
  return 'sprayer';
}

function readRecords() {
  const recordsDir = path.join(sourceRoot, 'records');
  return fs.readdirSync(recordsDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => JSON.parse(fs.readFileSync(path.join(recordsDir, file), 'utf8')));
}

function imagePathForRecord(record, image) {
  const relative = image?.download?.local_path;
  if (!relative) throw new Error(`${record.source_id}: image has no downloaded local path`);
  const absolute = path.join(sourceRoot, relative);
  if (!fs.existsSync(absolute)) throw new Error(`${record.source_id}: missing image ${absolute}`);
  return absolute;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function finishFor(sourceType) {
  if (sourceType === '香水玻璃瓶') return 'Clear / Frosted / Color / Decoration by Project';
  if (sourceType === '香水瓶盖') return 'Color / Material / Decoration by Project';
  return 'Color / Actuator Finish by Project';
}

function materialFor(sourceType) {
  if (sourceType === '香水玻璃瓶') return 'Glass';
  if (sourceType === '香水瓶盖') return 'Closure Material to Confirm';
  return 'Sprayer Material to Confirm';
}

function categoriesFor(sourceType, rawShape) {
  const shape = shapeSlug(rawShape);
  if (sourceType === '香水玻璃瓶') {
    return ['glass', 'glass-perfume', 'perfume-bottle-shape', `perfume-bottle-${shape}`];
  }
  if (sourceType === '香水瓶盖') {
    return ['components', 'packaging-accessories', 'plastic-closure', 'perfume-bottle-caps', `perfume-cap-${shape}`];
  }
  return ['components', 'packaging-accessories', 'plastic-closure', 'perfume-sprayers'];
}

function sourceCategoryFor(sourceType, rawShape) {
  const type = sourceTypeNames[sourceType] || 'Fragrance Packaging Component';
  const shape = rawShape ? ` > ${shapeName(rawShape, sourceType)}` : '';
  return `${type}${shape}`;
}

function productNameFor(record, sourceType, rawShape) {
  const model = String(record.model || record.source_id).trim();
  const shape = shapeName(rawShape, sourceType);
  const volume = normalizeSpec(record.specs?.volume);
  if (sourceType === '香水玻璃瓶') {
    return `${volume === 'Not listed' ? 'Custom Capacity' : volume} ${shape} Glass Perfume Bottle – ${model}`;
  }
  if (sourceType === '香水瓶盖') return `${shape} Perfume Bottle Cap – ${model}`;
  return `Perfume Sprayer Head – ${model}`;
}

function descriptionFor(record, sourceType, rawShape, name) {
  const shape = shapeName(rawShape, sourceType).toLowerCase();
  if (sourceType === '香水玻璃瓶') {
    return `${name} is a stock-catalog reference for fragrance, body mist and private-label scent packaging. Confirm the listed capacity, dimensions, neck finish, pump, collar, cap, decoration and packed performance with production-intent samples.`;
  }
  if (sourceType === '香水瓶盖') {
    return `${name} is a fragrance closure reference for ${shape} glass perfume bottle assemblies. Match this cap reference to the bottle mouth diameter and neck finish, then confirm closure material, finish, color target, fit and transport performance before bulk approval.`;
  }
  return `${name} is a fragrance dispensing component reference for fine-mist perfume and body-mist packaging. Confirm the neck standard, actuator feel, output, spray pattern, dip-tube reach, formula compatibility and leakage with the selected bottle.`;
}

function reviewNoteFor(sourceType) {
  if (sourceType === '香水玻璃瓶') {
    return 'The imported listing is a visual and dimensional reference, not a frozen production specification. Confirm glass composition, capacity tolerance, neck finish, pump and collar fit, cap, decoration, packing and current commercial terms before sample approval or bulk planning.';
  }
  if (sourceType === '香水瓶盖') {
    return 'The imported listing is a visual and fit reference, not a frozen production specification. Confirm the bottle neck, mouth diameter, closure material, fit, color target, decoration, tolerances, packing and current commercial terms before sample approval or bulk planning.';
  }
  return 'The imported listing is a visual and fit reference, not a frozen production specification. Confirm the neck finish, actuator, output, dip tube, formula compatibility, leakage, packing and current commercial terms before sample approval or bulk planning.';
}

function primarySizeFor(record, sourceType) {
  if (sourceType === '香水玻璃瓶') return normalizeSpec(record.specs?.volume);
  return translateNeck(record.specs?.neck);
}

function sourceSpecsFor(record, sourceType, rawShape) {
  return {
    type: sourceTypeKey(sourceType),
    typeLabel: sourceTypeNames[sourceType] || 'Fragrance Packaging Component',
    shape: shapeName(rawShape, sourceType),
    volume: normalizeSpec(record.specs?.volume),
    neck: translateNeck(record.specs?.neck),
    mouthDiameter: normalizeSpec(record.specs?.mouth_diameter),
    weight: normalizeSpec(record.specs?.weight),
    dimensions: normalizeSpec(record.specs?.size)
  };
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
      '-pix_fmt', 'yuv420p',
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
        console.log(`Optimized BDXSP images: ${completed}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
}

function createDictionary(values) {
  const items = [];
  const indexByValue = new Map();
  for (const value of values) {
    const key = JSON.stringify(value);
    if (!indexByValue.has(key)) {
      indexByValue.set(key, items.length);
      items.push(value);
    }
  }
  return {
    items,
    indexOf(value) {
      const index = indexByValue.get(JSON.stringify(value));
      if (index === undefined) throw new Error(`Dictionary value was not indexed: ${JSON.stringify(value)}`);
      return index;
    }
  };
}

function importedImageHash(imagePath) {
  const match = /^assets\/product-photos\/bdxsp-([a-f0-9]{20})\.avif$/.exec(imagePath);
  if (!match) throw new Error(`Unexpected BDXSP image path: ${imagePath}`);
  return match[1];
}

function buildGeneratedBlock(products, imageHashes, categoryTitles, categoryCopy) {
  const materials = createDictionary(products.map(product => product.mat));
  const finishes = createDictionary(products.map(product => product.finish));
  const categorySets = createDictionary(products.map(product => product.cats));
  const materialGroups = createDictionary(products.map(product => product.materialGroup));
  const sourceCategories = createDictionary(products.map(product => product.sourceCategory));
  const descriptions = createDictionary(products.map(product => product.desc.slice(product.name.length)));
  const reviewNotes = createDictionary(products.map(product => product.tab));
  const specs = createDictionary(products.map(product => JSON.stringify(product.sourceSpecs)));
  const images = createDictionary(products.flatMap(product => product.images.map(importedImageHash)));
  const rows = products.map(product => [
    product.id.slice(1),
    product.name,
    materials.indexOf(product.mat),
    finishes.indexOf(product.finish),
    categorySets.indexOf(product.cats),
    materialGroups.indexOf(product.materialGroup),
    sourceCategories.indexOf(product.sourceCategory),
    descriptions.indexOf(product.desc.slice(product.name.length)),
    reviewNotes.indexOf(product.tab),
    specs.indexOf(JSON.stringify(product.sourceSpecs)),
    product.images.map(imagePath => images.indexOf(importedImageHash(imagePath)))
  ]);
  return `${generatedStart}
window.GSP_BDXSP_CATEGORY_TITLES = ${JSON.stringify(categoryTitles)};
window.GSP_BDXSP_CATEGORY_COPY = ${JSON.stringify(categoryCopy)};
(() => {
  const materials = ${JSON.stringify(materials.items)};
  const finishes = ${JSON.stringify(finishes.items)};
  const categorySets = ${JSON.stringify(categorySets.items)};
  const materialGroups = ${JSON.stringify(materialGroups.items)};
  const sourceCategories = ${JSON.stringify(sourceCategories.items)};
  const descriptions = ${JSON.stringify(descriptions.items)};
  const reviewNotes = ${JSON.stringify(reviewNotes.items)};
  const specs = ${JSON.stringify(specs.items)};
  const imageHashes = ${JSON.stringify(imageHashes)};
  const productRows = ${JSON.stringify(rows)};
  const importedProducts = productRows.map(row => ({
    id: 'p' + row[0],
    name: row[1],
    size: JSON.parse(specs[row[9]]).type === 'bottle' ? JSON.parse(specs[row[9]]).volume : JSON.parse(specs[row[9]]).neck,
    mat: materials[row[2]],
    finish: finishes[row[3]],
    moq: '',
    ic: JSON.parse(specs[row[9]]).type === 'bottle' ? '🌸' : JSON.parse(specs[row[9]]).type === 'cap' ? '🧢' : '💨',
    badge: 'custom',
    cats: categorySets[row[4]],
    desc: row[1] + descriptions[row[7]],
    tab: reviewNotes[row[8]],
    materialGroup: materialGroups[row[5]],
    sourceCategory: sourceCategories[row[6]],
    referenceMoq: true,
    sourceSpecs: JSON.parse(specs[row[9]]),
    images: row[10].map(index => 'assets/product-photos/bdxsp-' + imageHashes[index] + '.avif')
  }));
  window.GSP_PRODUCTS = window.GSP_PRODUCTS.concat(importedProducts);
})();
${generatedEnd}`;
}

const records = readRecords();
const imageHashByPath = new Map();
const sourcePathByHash = new Map();
const products = [];
const mappings = [];
const categoryCounts = {};
const imageReferenceCount = records.reduce((total, record) => total + (record.images?.length || 0), 0);

for (const record of records) {
  const sourceType = record.category?.raw?.level1_name || record.raw?.detail?.title || '';
  const rawShape = record.category?.raw?.level2_name || '';
  const name = productNameFor(record, sourceType, rawShape);
  const categories = categoriesFor(sourceType, rawShape);
  const sourceCategory = sourceCategoryFor(sourceType, rawShape);
  const sourceSpecs = sourceSpecsFor(record, sourceType, rawShape);
  const imagePaths = [];
  for (const image of record.images || []) {
    const absolutePath = imagePathForRecord(record, image);
    let hash = imageHashByPath.get(absolutePath);
    if (!hash) {
      hash = sha256(absolutePath);
      imageHashByPath.set(absolutePath, hash);
      if (!sourcePathByHash.has(hash)) sourcePathByHash.set(hash, absolutePath);
    }
    if (!imagePaths.includes(hash)) imagePaths.push(hash);
  }
  if (!imagePaths.length) throw new Error(`${record.source_id}: no downloaded images`);
  const publishedHashes = imagePaths.slice(0, 6);
  const product = {
    id: `p${record.source_id}`,
    name,
    size: primarySizeFor(record, sourceType),
    mat: materialFor(sourceType),
    finish: finishFor(sourceType),
    moq: '',
    ic: sourceType === '香水玻璃瓶' ? '🌸' : sourceType === '香水瓶盖' ? '🧢' : '💨',
    badge: 'custom',
    cats: categories,
    desc: descriptionFor(record, sourceType, rawShape, name),
    tab: reviewNoteFor(sourceType),
    materialGroup: sourceType === '香水玻璃瓶' ? 'material-glass' : 'material-mixed',
    sourceCategory,
    referenceMoq: true,
    sourceSpecs,
    images: publishedHashes.map(hash => `assets/product-photos/bdxsp-${hash.slice(0, 20)}.avif`)
  };
  products.push(product);
  const primaryCategory = sourceType === '香水玻璃瓶' ? 'perfume-bottle-shape' : sourceType === '香水瓶盖' ? 'perfume-bottle-caps' : 'perfume-sprayers';
  categoryCounts[primaryCategory] = (categoryCounts[primaryCategory] || 0) + 1;
  mappings.push({
    websiteId: product.id,
    name: product.name,
    sourceId: record.source_id,
    model: record.model,
    sourceType,
    sourceShape: rawShape || null,
    sourceCategory,
    websiteCategories: categories,
    sourceSpecs,
    sourceImageCount: imagePaths.length,
    publishedImageCount: publishedHashes.length,
    images: product.images
  });
}

const existingSource = fs.readFileSync(productDataPath, 'utf8');
const markerPattern = new RegExp(`${generatedStart.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}[\\s\\S]*?${generatedEnd.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`);
const sourceWithoutExistingImport = existingSource.replace(markerPattern, '').trimEnd();
const existingContext = { window: {} };
vm.createContext(existingContext);
vm.runInContext(sourceWithoutExistingImport, existingContext);
const existingIds = new Set((existingContext.window.GSP_PRODUCTS || []).map(product => product.id));
for (const product of products) {
  if (existingIds.has(product.id)) throw new Error(`BDXSP product ID already exists in product data: ${product.id}`);
}

const imagePrefixOwners = new Map();
for (const hash of sourcePathByHash.keys()) {
  const shortHash = hash.slice(0, 20);
  const existing = imagePrefixOwners.get(shortHash);
  if (existing && existing !== hash) throw new Error(`BDXSP image hash prefix collision: ${shortHash}`);
  imagePrefixOwners.set(shortHash, hash);
}
const publishedImagePrefixes = new Set(products.flatMap(product => product.images.map(importedImageHash)));
const imageJobs = [...sourcePathByHash.entries()]
  .filter(([hash]) => publishedImagePrefixes.has(hash.slice(0, 20)))
  .map(([hash, sourcePath]) => {
    const shortHash = hash.slice(0, 20);
    return {
      hash,
      sourcePath,
      outputPath: path.join(imageOutputDir, `bdxsp-${shortHash}.avif`)
    };
  });

fs.mkdirSync(imageOutputDir, { recursive: true });
const publishedImageNames = new Set(imageJobs.map(job => path.basename(job.outputPath)));
for (const filename of fs.readdirSync(imageOutputDir)) {
  if (/^bdxsp-[a-f0-9]{20}\.avif$/.test(filename) && !publishedImageNames.has(filename)) {
    fs.unlinkSync(path.join(imageOutputDir, filename));
  }
  if (/^bdxsp-[a-f0-9]{20}\.avif\.tmp-\d+\.avif$/.test(filename)) {
    fs.unlinkSync(path.join(imageOutputDir, filename));
  }
}
const pendingImages = imageJobs.filter(job => !fs.existsSync(job.outputPath) || fs.statSync(job.outputPath).size === 0);
console.log(`BDXSP source records: ${records.length}; website products: ${products.length}`);
console.log(`Unique source images: ${imageJobs.length}; pending optimization: ${pendingImages.length}`);
const requestedConcurrency = Number(process.env.BDXSP_IMAGE_CONCURRENCY || 6);
const concurrency = Math.max(1, Math.min(requestedConcurrency, os.availableParallelism?.() || os.cpus().length, 8));
await runPool(pendingImages, concurrency, job => encodeImage(job.sourcePath, job.outputPath));
for (const job of imageJobs) {
  if (!fs.existsSync(job.outputPath) || fs.statSync(job.outputPath).size === 0) throw new Error(`Published image is missing: ${job.outputPath}`);
}

const categoryTitles = {
  'perfume-bottle-shape': 'Imported Perfume Bottle Shapes',
  'perfume-bottle-flat-rectangle': 'Flat Rectangular Perfume Bottles',
  'perfume-bottle-cylindrical': 'Cylindrical Perfume Bottles',
  'perfume-bottle-round': 'Round Perfume Bottles',
  'perfume-bottle-square': 'Square Perfume Bottles',
  'perfume-bottle-flat-oval': 'Flat Oval Perfume Bottles',
  'perfume-bottle-special-shape': 'Special-Shape Perfume Bottles',
  'perfume-bottle-caps': 'Perfume Bottle Caps',
  'perfume-cap-cylindrical': 'Cylindrical Perfume Bottle Caps',
  'perfume-cap-conical': 'Conical Perfume Bottle Caps',
  'perfume-cap-round': 'Round Perfume Bottle Caps',
  'perfume-cap-square': 'Square Perfume Bottle Caps',
  'perfume-cap-flat-oval': 'Flat Oval Perfume Bottle Caps',
  'perfume-cap-flat-rectangle': 'Flat Rectangular Perfume Bottle Caps',
  'perfume-cap-special-shape': 'Special-Shape Perfume Bottle Caps',
  'perfume-sprayers': 'Perfume Sprayer Heads'
};
const categoryCopy = {
  'perfume-bottle-shape': ['Imported Perfume Bottle Shapes', 'Browse the imported glass perfume bottle catalog by silhouette, capacity, neck finish and dimensional reference. Confirm the production drawing, pump, collar, cap and packed performance before approval.'],
  'perfume-bottle-flat-rectangle': ['Flat Rectangular Perfume Bottles', 'Flat rectangular glass perfume bottle references grouped by capacity, neck finish and dimensional profile. Confirm the final bottle, pump, collar, cap and decoration as one assembly.'],
  'perfume-bottle-cylindrical': ['Cylindrical Perfume Bottles', 'Cylindrical glass perfume bottle references for fragrance and body mist projects. Match listed capacity, neck finish, dimensions and pump compatibility with production-intent samples.'],
  'perfume-bottle-round': ['Round Perfume Bottles', 'Round glass perfume bottle references grouped for fragrance, body mist and private-label scent packaging. Confirm the listed dimensions, neck, cap and decoration route by model.'],
  'perfume-bottle-square': ['Square Perfume Bottles', 'Square glass perfume bottle references with capacity, neck and dimensional information where available. Confirm bottle stability, pump fit, cap alignment and decoration before bulk planning.'],
  'perfume-bottle-flat-oval': ['Flat Oval Perfume Bottles', 'Flat oval glass perfume bottle references for distinctive fragrance shelf presence. Confirm capacity, dimensions, neck finish, pump, cap and protective export packing by model.'],
  'perfume-bottle-special-shape': ['Special-Shape Perfume Bottles', 'Special-shape glass perfume bottle references requiring model-specific drawing and sample confirmation for capacity, neck, closure, decoration and packing.'],
  'perfume-bottle-caps': ['Perfume Bottle Caps', 'Imported perfume bottle cap references organized by silhouette and neck fit. Confirm closure material, mouth diameter, fit, finish, color target, decoration and transport performance before approval.'],
  'perfume-cap-cylindrical': ['Cylindrical Perfume Bottle Caps', 'Cylindrical cap references for compatible perfume bottle necks. Confirm the exact bottle mouth diameter, cap fit, material and decoration by model.'],
  'perfume-cap-conical': ['Conical Perfume Bottle Caps', 'Conical perfume cap references for fragrance packaging assemblies. Confirm bottle neck compatibility, cap material, finish, tolerances and packed protection before bulk production.'],
  'perfume-cap-round': ['Round Perfume Bottle Caps', 'Round perfume cap references for compatible glass fragrance bottles. Confirm neck, cap fit, finish, color target, decoration and transport performance by model.'],
  'perfume-cap-square': ['Square Perfume Bottle Caps', 'Square perfume cap references for compatible fragrance bottles. Confirm the complete bottle-and-cap assembly, material, dimensions, finish and decoration before sampling.'],
  'perfume-cap-flat-oval': ['Flat Oval Perfume Bottle Caps', 'Flat oval perfume cap references for selected fragrance bottle assemblies. Confirm fit, material, finish, decoration and packed performance by model.'],
  'perfume-cap-flat-rectangle': ['Flat Rectangular Perfume Bottle Caps', 'Flat rectangular perfume cap references for selected fragrance bottle assemblies. Confirm fit, material, finish, decoration and packed performance by model.'],
  'perfume-cap-special-shape': ['Special-Shape Perfume Bottle Caps', 'Special-shape perfume cap references that require model-specific fit, drawing, sample and transport confirmation.'],
  'perfume-sprayers': ['Perfume Sprayer Heads', 'Perfume spray and pump head references for fragrance and body mist bottles. Confirm neck standard, dose, spray pattern, actuator, dip tube and formula compatibility with the final bottle.']
};

const generatedBlock = buildGeneratedBlock(products, imageJobs.map(job => job.hash.slice(0, 20)), categoryTitles, categoryCopy);
const outputSource = `${sourceWithoutExistingImport}\n\n${generatedBlock}\n`;
fs.writeFileSync(productDataPath, outputSource);

const generatedContext = { window: { GSP_PRODUCTS: [] } };
vm.createContext(generatedContext);
vm.runInContext(generatedBlock, generatedContext);
const hydratedProducts = generatedContext.window.GSP_PRODUCTS;
if (hydratedProducts.length !== products.length) throw new Error(`Generated BDXSP product count mismatch: ${hydratedProducts.length} !== ${products.length}`);
for (const product of hydratedProducts) {
  if (!product.id || !product.name || !product.images?.length || !product.sourceSpecs) throw new Error(`Generated BDXSP product is incomplete: ${product.id}`);
}

const publishedImageBytes = imageJobs.reduce((total, job) => total + fs.statSync(job.outputPath).size, 0);
const report = {
  generatedAt: new Date().toISOString(),
  sourceSite: 'bin.bdxsp.com',
  sourcePage: 'https://bin.bdxsp.com/index/',
  sourceProductCount: records.length,
  importedProductCount: products.length,
  duplicateListingCount: 0,
  sourceImageReferenceCount: imageReferenceCount,
  publishedImageReferenceCount: products.reduce((total, product) => total + product.images.length, 0),
  uniquePublishedImageCount: imageJobs.length,
  publishedImageBytes,
  categoryCounts,
  notes: [
    'Source records are classified by the exported level-one and level-two categories.',
    'Imported records are browseable catalog references; they are not represented as frozen production specifications.',
    'The source export did not contain MOQ values, so published MOQ is intentionally left for project confirmation.',
    'All published gallery images are locally optimized AVIF assets; at most six images per product are exposed in the website gallery.',
    'Source listing prices, URLs and raw Chinese goods names are not written to the published product data.'
  ],
  mappings
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Updated ${path.relative(rootDir, productDataPath)} and ${path.relative(rootDir, reportPath)}.`);
console.log(`BDXSP import complete: ${products.length} products, ${imageJobs.length} unique AVIF images (${(publishedImageBytes / 1024 / 1024).toFixed(1)} MiB).`);
