import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const ignoredDirectories = new Set(['.git', '.vercel', 'backups', 'node_modules', 'tmp', 'fr', 'es', 'pt', 'ru', 'zh-CN']);
const ignoredFiles = new Set(['glorystarpack (1).html']);

function htmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html') && !ignoredFiles.has(entry.name)) files.push(fullPath);
  }
  return files;
}

function convertProductNode(node, parentKey = '') {
  if (Array.isArray(node)) {
    for (const value of node) convertProductNode(value, parentKey);
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (node['@type'] === 'Product') {
    if (parentKey === 'itemOffered') {
      node['@type'] = 'Thing';
    } else {
      node['@type'] = 'Service';
      node.serviceType ??= node.category ? `${node.category} supply and customization` : 'B2B packaging supply and customization';
      node.areaServed ??= 'Worldwide';
      if (node.manufacturer && !node.provider) node.provider = node.manufacturer;
      delete node.manufacturer;

      const detailParts = [node.material, node.sku ? `reference ${node.sku}` : ''].filter(Boolean);
      if (node.additionalProperty) {
        detailParts.push(...node.additionalProperty.map(property => `${property.name}: ${property.value}`));
      }
      if ((node.sku || node.material || node.additionalProperty) && !node.serviceOutput) {
        node.serviceOutput = {
          '@type': 'Thing',
          name: node.name,
          ...(node.sku ? { identifier: node.sku } : {}),
          ...(node.image ? { image: node.image } : {}),
          ...(detailParts.length ? { description: detailParts.join('; ') } : {})
        };
      }
      delete node.sku;
      delete node.material;
      delete node.additionalProperty;
    }
  }

  for (const [key, value] of Object.entries(node)) convertProductNode(value, key);
}

let changedFiles = 0;
let changedBlocks = 0;
for (const filePath of htmlFiles(rootDir)) {
  const source = fs.readFileSync(filePath, 'utf8');
  let fileChanged = false;
  const updated = source.replace(
    /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (match, open, jsonText, close) => {
      if (!/"@type"\s*:\s*"Product"/.test(jsonText)) return match;
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch {
        throw new Error(`Cannot parse JSON-LD in ${path.relative(rootDir, filePath)}`);
      }
      convertProductNode(data);
      fileChanged = true;
      changedBlocks += 1;
      return `${open}${JSON.stringify(data).replace(/</g, '\\u003c')}${close}`;
    }
  );
  if (fileChanged) {
    fs.writeFileSync(filePath, updated);
    changedFiles += 1;
  }
}

console.log(`Normalized B2B schema in ${changedBlocks} JSON-LD blocks across ${changedFiles} HTML files.`);
