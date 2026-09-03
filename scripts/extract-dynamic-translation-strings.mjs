import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const values = new Set();
const add = value => {
  if (typeof value === 'string' && /[A-Za-z]{2}/.test(value)) values.add(value.replace(/\s+/g, ' ').trim());
};

const productContext = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/product-data.js'), 'utf8'), productContext);
for (const product of productContext.window.GSP_PRODUCTS || []) {
  for (const field of ['name', 'mat', 'finish', 'desc', 'tab']) add(product[field]);
}

const catalogSource = fs.readFileSync(path.join(root, 'assets/js/legacy-catalog.js'), 'utf8');
const catalogPrefix = catalogSource.slice(0, catalogSource.indexOf('const PRIMARY_MATERIAL_IDS'));
const catalogContext = vm.createContext({ window: {} });
vm.runInContext(`${catalogPrefix}\nthis.__copy = { titles: CAT_TITLES, copy: CAT_COPY };\n})();`, catalogContext);
Object.values(catalogContext.__copy.titles).forEach(add);
Object.values(catalogContext.__copy.copy).flat().forEach(add);

[
  'Loading packaging products...', 'Loading product catalog...', 'Loading product details...',
  'Searching packaging products...', 'The product catalog is temporarily unavailable. Please refresh the page or contact us for the current catalog.',
  'Product data is temporarily unavailable. Please refresh the page or contact us for a catalog.',
  'Selected product:', 'product', 'products', 'Showing all products.', 'No products match your search.',
  'Previous', 'Next', 'Sample', 'Quote', 'View product details', 'Search Results'
].forEach(add);

process.stdout.write(JSON.stringify([...values].sort((left, right) => left.localeCompare(right))));
