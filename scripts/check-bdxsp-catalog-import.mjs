import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const productDataPath = path.join(rootDir, 'assets/js/product-data.js');
const reportPath = path.join(rootDir, 'data/bdxsp-catalog-import-report.json');
const homepagePath = path.join(rootDir, 'index.html');
const imageDir = path.join(rootDir, 'assets/product-photos');
const errors = [];

if (!fs.existsSync(reportPath)) throw new Error('Missing data/bdxsp-catalog-import-report.json; run the importer first.');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(productDataPath, 'utf8'), context);
const allProducts = context.window.GSP_PRODUCTS ?? [];
const importedProducts = allProducts.filter(product => product.sourceSpecs?.type);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const homepage = fs.readFileSync(homepagePath, 'utf8');
const expectedCounts = { bottle: 444, cap: 399, sprayer: 16 };
const expectedShapes = {
  bottle: {
    'Flat Rectangular': 'perfume-bottle-flat-rectangle',
    Cylindrical: 'perfume-bottle-cylindrical',
    Round: 'perfume-bottle-round',
    Square: 'perfume-bottle-square',
    'Flat Oval': 'perfume-bottle-flat-oval',
    'Special Shape': 'perfume-bottle-special-shape'
  },
  cap: {
    Cylindrical: 'perfume-cap-cylindrical',
    Conical: 'perfume-cap-conical',
    Round: 'perfume-cap-round',
    Square: 'perfume-cap-square',
    'Flat Oval': 'perfume-cap-flat-oval',
    'Special Shape': 'perfume-cap-special-shape',
    'Flat Rectangular': 'perfume-cap-flat-rectangle'
  }
};
const expectedPrimaryCategory = {
  bottle: 'perfume-bottle-shape',
  cap: 'perfume-bottle-caps',
  sprayer: 'perfume-sprayers'
};
const expectedMaterialGroup = { bottle: 'material-glass', cap: 'material-mixed', sprayer: 'material-mixed' };
const disallowedPublishedFields = ['sourcePrice', 'sourceUrl', 'sourceOfferId', 'sourceGoodsName'];
const productIds = new Set();
const productNames = new Set();
const referencedImages = new Set();
const typeCounts = {};
const categoryCounts = {};

if (importedProducts.length !== report.importedProductCount) {
  errors.push(`published import count ${importedProducts.length} does not match report ${report.importedProductCount}`);
}
if (allProducts.length !== 3212) errors.push(`catalog count ${allProducts.length} does not match expected 3212`);
const homepageTotal = Number(homepage.match(/<span data-total-products>(\d+)<\/span>/)?.[1]);
if (homepageTotal !== allProducts.length) errors.push(`homepage fallback total ${homepageTotal} does not match catalog total ${allProducts.length}`);
if (report.sourceProductCount !== 859) errors.push(`source record count ${report.sourceProductCount} does not match expected 859`);
if (report.sourceProductCount !== report.importedProductCount + report.duplicateListingCount) {
  errors.push('source, imported and duplicate product counts do not reconcile');
}

for (const product of importedProducts) {
  const specs = product.sourceSpecs;
  const type = specs.type;
  typeCounts[type] = (typeCounts[type] || 0) + 1;
  if (productIds.has(product.id)) errors.push(`duplicate imported product id: ${product.id}`);
  productIds.add(product.id);
  const normalizedName = String(product.name ?? '').toLowerCase();
  if (productNames.has(normalizedName)) errors.push(`duplicate imported product name: ${product.name}`);
  productNames.add(normalizedName);
  if (!['bottle', 'cap', 'sprayer'].includes(type)) {
    errors.push(`${product.id}: unsupported source type ${type}`);
    continue;
  }
  if (product.referenceMoq !== true || product.moq !== '') errors.push(`${product.id}: source MOQ must remain project-confirmed`);
  if (product.materialGroup !== expectedMaterialGroup[type]) errors.push(`${product.id}: incorrect material group ${product.materialGroup}`);
  if (!product.cats.includes(expectedPrimaryCategory[type])) errors.push(`${product.id}: missing primary category ${expectedPrimaryCategory[type]}`);
  categoryCounts[expectedPrimaryCategory[type]] = (categoryCounts[expectedPrimaryCategory[type]] || 0) + 1;
  if (type !== 'sprayer') {
    const shapeCategory = expectedShapes[type][specs.shape];
    if (!shapeCategory) errors.push(`${product.id}: unsupported source shape ${specs.shape}`);
    else {
      if (!product.cats.includes(shapeCategory)) errors.push(`${product.id}: missing shape category ${shapeCategory}`);
      categoryCounts[shapeCategory] = (categoryCounts[shapeCategory] || 0) + 1;
    }
  }
  for (const field of ['typeLabel', 'shape', 'volume', 'neck', 'mouthDiameter', 'weight', 'dimensions']) {
    if (typeof specs[field] !== 'string' || !specs[field].trim()) errors.push(`${product.id}: missing source spec ${field}`);
  }
  if (/[㐀-鿿]/.test(`${product.name} ${product.desc}`)) errors.push(`${product.id}: Chinese source text leaked into published copy`);
  for (const field of disallowedPublishedFields) {
    if (Object.hasOwn(product, field)) errors.push(`${product.id}: source-only field leaked into published catalog: ${field}`);
  }
  if (!Array.isArray(product.images) || !product.images.length) {
    errors.push(`${product.id}: missing published image gallery`);
    continue;
  }
  for (const imagePath of product.images) {
    if (!/^assets\/product-photos\/bdxsp-[a-f0-9]{20}\.avif$/.test(imagePath)) {
      errors.push(`${product.id}: unexpected imported image path ${imagePath}`);
      continue;
    }
    referencedImages.add(imagePath);
  }
}

for (const [type, count] of Object.entries(expectedCounts)) {
  if (typeCounts[type] !== count) errors.push(`${type} count ${typeCounts[type] || 0} does not match expected ${count}`);
}
for (const [category, count] of Object.entries(report.categoryCounts)) {
  if (categoryCounts[category] && categoryCounts[category] !== count) errors.push(`${category} count ${categoryCounts[category]} does not match report ${count}`);
}
if (report.publishedImageReferenceCount !== importedProducts.reduce((total, product) => total + product.images.length, 0)) {
  errors.push('published image reference count does not match product galleries');
}
if (referencedImages.size !== report.uniquePublishedImageCount) {
  errors.push(`referenced image count ${referencedImages.size} does not match report ${report.uniquePublishedImageCount}`);
}

for (const imagePath of referencedImages) {
  const absolutePath = path.join(rootDir, imagePath);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size === 0) {
    errors.push(`missing or empty imported image: ${imagePath}`);
    continue;
  }
  const header = fs.readFileSync(absolutePath).subarray(0, 32).toString('latin1');
  if (!header.includes('ftypavif')) errors.push(`imported image is not an AVIF file: ${imagePath}`);
}

for (const filename of fs.readdirSync(imageDir)) {
  if (/^bdxsp-[a-f0-9]{20}\.avif\.tmp-\d+\.avif$/.test(filename)) errors.push(`temporary image file remains: ${filename}`);
  if (/^bdxsp-[a-f0-9]{20}\.avif$/.test(filename) && !new Set([...referencedImages].map(image => path.basename(image))).has(filename)) {
    errors.push(`orphaned BDXSP image is not referenced: ${filename}`);
  }
}

if (errors.length) {
  console.error(`BDXSP catalog import check failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.slice(0, 100).forEach(error => console.error(`- ${error}`));
  if (errors.length > 100) console.error(`- ...and ${errors.length - 100} more`);
  process.exit(1);
}

console.log(`Checked ${importedProducts.length} BDXSP products and ${referencedImages.size} unique AVIF images.`);
console.log(`Catalog total: ${allProducts.length}; source type counts: ${JSON.stringify(typeCounts)}.`);
console.log(`Product data payload: ${(fs.statSync(productDataPath).size / 1024).toFixed(1)} KiB.`);
