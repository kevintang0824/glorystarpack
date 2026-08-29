import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const productDataPath = path.join(rootDir, 'assets/js/product-data.js');
const reportPath = path.join(rootDir, 'data/finer-packaging-import-report.json');
const homepagePath = path.join(rootDir, 'index.html');
const errors = [];

if (!fs.existsSync(reportPath)) {
  throw new Error('Missing data/finer-packaging-import-report.json; run the importer first.');
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(productDataPath, 'utf8'), context);
const allProducts = context.window.GSP_PRODUCTS ?? [];
const importedProducts = allProducts.filter(product => product.referenceMoq === true && product.sourceCategory);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const homepage = fs.readFileSync(homepagePath, 'utf8');

if (importedProducts.length !== report.importedProductCount) {
  errors.push(`published import count ${importedProducts.length} does not match report ${report.importedProductCount}`);
}
if (report.sourceProductCount !== report.importedProductCount + report.duplicateListingCount) {
  errors.push('source, imported and duplicate product counts do not reconcile');
}
const staticTotal = Number(homepage.match(/<span data-total-products>(\d+)<\/span>/)?.[1]);
if (staticTotal !== allProducts.length) errors.push(`homepage fallback total ${staticTotal} does not match catalog total ${allProducts.length}`);

const productIds = new Set();
const productNames = new Set();
const gallerySignatures = new Set();
const referencedImages = new Set();
const disallowedPublishedFields = ['sourcePrice', 'sourceUrl', 'sourceOfferId'];
const unqualifiedClaimPattern = /\b(?:FSC|eco(?:[ -]*friend(?:ly)?)?|environmental(?:ly)?[ -]*friendly|earth[ -]*friendly|PCR|bio[ -]?based|(?:bio[ -]?)?degradable|recycl(?:e|able|ed)|compostable|sustainable|plastic[ -]?free|food[ -]?grade|leakproof|reusable|renewable|responsibly[ -]?sourced|low[ -]?carbon|carbon[ -]?neutral|zero[ -]?waste|soy[ -]?ink|non[ -]?toxic|FDA|RoHS|BSCI)\b/i;
const sourceCommercialPattern = /(?:[$€£¥]\s*\d|\b(?:USD|MOQ\s*\d|low[ -]?MOQ|bulk[ -]?orders?|fast[ -]?lead[ -]?time|high[ -]?quality|best[ -]?selling|hot[ -]?selling|hot[ -]?sale|newest|cheapest|wholesales?|manufacturer|supplier|factory(?:[ -]?direct)?|direct from factory|from factory|free[ -]?samples?|free[ -]?shipping|fast[ -]?delivery|ready[ -]?to[ -]?ship|price)\b)/i;
const expectedPrimaryCategoryById = new Map([
  ['p60684605813', 'food-paper-packaging'],
  ['p60746265624', 'labels-cards'],
  ['p1600240724918', 'food-paper-packaging'],
  ['p1600958033499', 'gift-box'],
  ['p1601174397349', 'mailer-box'],
  ['p1601578176488', 'candle-packaging'],
  ['p1601578188371', 'candle-packaging'],
  ['p1601728061386', 'candle-packaging'],
  ['p1601728064767', 'candle-packaging'],
  ['p1601730044982', 'candle-packaging'],
  ['p1601730049563', 'candle-packaging'],
  ['p1601730365932', 'candle-packaging'],
  ['p1601731113860', 'candle-packaging']
]);

for (const product of importedProducts) {
  if (productIds.has(product.id)) errors.push(`duplicate imported product id: ${product.id}`);
  productIds.add(product.id);
  const normalizedName = String(product.name ?? '').toLowerCase();
  if (productNames.has(normalizedName)) errors.push(`duplicate imported product name: ${product.name}`);
  productNames.add(normalizedName);
  if (unqualifiedClaimPattern.test(product.name)) errors.push(`unqualified source claim remains in product name: ${product.name}`);
  if (/\bfriendly\b/i.test(product.name)) errors.push(`orphaned marketing language remains in product name: ${product.name}`);
  if (sourceCommercialPattern.test(product.name)) errors.push(`source commercial language remains in product name: ${product.name}`);
  if (/^(?:of|for)\s+/i.test(product.name)) errors.push(`broken leading fragment remains in product name: ${product.name}`);
  if (product.cats.includes('plastic-makeup') || product.cats.includes('packaging-accessories')) {
    errors.push(`${product.id}: paper/flexible import leaked into a legacy plastic or component aggregation`);
  }
  if (!Array.isArray(product.cats) || !product.cats.length) errors.push(`${product.id}: missing website category mapping`);
  if (!['material-paper-pulp', 'material-flexible', 'material-bio'].includes(product.materialGroup)) {
    errors.push(`${product.id}: unsupported primary material group ${product.materialGroup}`);
  }
  if (product.cats[0] === 'labels-cards' && product.materialGroup === 'material-paper-pulp' && /adhesive/i.test(product.mat)) {
    errors.push(`${product.id}: paper card or tag has an unsupported adhesive material claim`);
  }
  if (/\bpet food\b/i.test(product.name) && /^PET\b/.test(product.mat)) {
    errors.push(`${product.id}: pet food was misread as PET resin`);
  }
  const expectedPrimaryCategory = expectedPrimaryCategoryById.get(product.id);
  if (expectedPrimaryCategory && product.cats[0] !== expectedPrimaryCategory) {
    errors.push(`${product.id}: expected primary category ${expectedPrimaryCategory}, found ${product.cats[0]}`);
  }
  if (!Array.isArray(product.images) || !product.images.length) {
    errors.push(`${product.id}: missing published image gallery`);
    continue;
  }
  const signature = `${product.cats[0]}:${product.materialGroup}:${product.mat}:${product.finish}:${product.name.toLowerCase()}:${[...new Set(product.images)].join(':')}`;
  if (gallerySignatures.has(signature)) errors.push(`${product.id}: duplicate published image gallery`);
  gallerySignatures.add(signature);
  for (const imagePath of product.images) {
    if (!/^assets\/product-photos\/fp-[a-f0-9]{20}\.avif$/.test(imagePath)) {
      errors.push(`${product.id}: unexpected imported image path ${imagePath}`);
      continue;
    }
    referencedImages.add(imagePath);
  }
  for (const field of disallowedPublishedFields) {
    if (Object.hasOwn(product, field)) errors.push(`${product.id}: source-only field leaked into published catalog: ${field}`);
  }
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

if (referencedImages.size !== report.uniquePublishedImageCount) {
  errors.push(`referenced image count ${referencedImages.size} does not match report ${report.uniquePublishedImageCount}`);
}

if (errors.length) {
  console.error(`Finer Packaging import check failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.slice(0, 100).forEach(error => console.error(`- ${error}`));
  if (errors.length > 100) console.error(`- ...and ${errors.length - 100} more`);
  process.exit(1);
}

console.log(`Checked ${importedProducts.length} imported products and ${referencedImages.size} unique AVIF images.`);
console.log(`Duplicate listing consolidation: ${report.sourceProductCount} source listings → ${report.importedProductCount} website products.`);
