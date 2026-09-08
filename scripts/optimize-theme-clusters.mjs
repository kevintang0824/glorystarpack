import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');

const clusterPages = {
  'products/product-index/index.html': {
    heading: 'Browse packaging by buyer theme',
    intro: 'Start with the packaging theme that matches the product, dispensing task or sourcing route. Each hub connects product formats with the guides and approval questions that narrow a project brief.',
    links: [
      ['/products/personal-care-packaging/', 'Beauty and personal-care packaging'],
      ['/products/cosmetic-pumps-closures/', 'Pumps, caps and dispensing components'],
      ['/products/perfume-bottles/', 'Fragrance and perfume bottles'],
      ['/products/beverage-bottles/', 'Beverage bottle packaging'],
      ['/products/glass-packaging/', 'Glass packaging for food and beverage'],
      ['/products/eco-friendly-packaging/', 'Refill and sustainable packaging'],
      ['/custom-cosmetic-packaging/', 'Custom and OEM packaging routes']
    ]
  },
  'products/glass-packaging/index.html': {
    heading: 'Continue the glass packaging cluster',
    intro: 'Move from the broad glass range to the application page and approval guide that fit the bottle, closure, filling and distribution brief.',
    links: [
      ['/products/beverage-bottles/', 'Beverage bottle formats'],
      ['/products/glass-cosmetic-bottles/', 'Glass cosmetic bottle selection'],
      ['/products/wine-bottles/', 'Wholesale glass wine bottles'],
      ['/products/liquor-bottles/', 'Liquor and spirit bottles'],
      ['/insights/glass-bottle-neck-finish-closure-guide/', 'Neck finish and closure guide'],
      ['/insights/glass-bottle-sample-approval-qc-checklist/', 'Glass sample approval guide']
    ]
  },
  'products/beverage-bottles/index.html': {
    heading: 'Continue the beverage bottle cluster',
    intro: 'Compare beverage formats by product type, closure, pressure or filling conditions, then use the inspection and sampling guides before approval.',
    links: [
      ['/products/beer-bottles/', 'Wholesale beer bottles'],
      ['/products/wine-bottles/', 'Wholesale wine bottles'],
      ['/products/liquor-bottles/', 'Liquor and spirit bottles'],
      ['/products/sparkling-wine-bottles/', 'Sparkling wine bottles'],
      ['/insights/glass-bottle-neck-finish-closure-guide/', 'Bottle neck and closure guide'],
      ['/insights/glass-bottle-defects-quality-inspection-guide/', 'Glass quality inspection guide']
    ]
  },
  'products/personal-care-packaging/index.html': {
    heading: 'Continue the beauty packaging cluster',
    intro: 'Use the application pages below to narrow skincare, makeup, hair-care, hotel-amenity and refill packaging by formula, dispensing and pack requirements.',
    links: [
      ['/products/skincare-packaging/', 'Skincare packaging selection'],
      ['/products/makeup-packaging/', 'Makeup packaging selection'],
      ['/products/cosmetic-tubes/', 'Cosmetic tube packaging'],
      ['/products/airless-pump-bottles/', 'Airless pump packaging'],
      ['/cosmetic-packaging-buying-guide/', 'Cosmetic packaging buying guide'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist']
    ]
  },
  'products/cosmetic-pumps-closures/index.html': {
    heading: 'Continue the dispensing components cluster',
    intro: 'Match the pump, cap, sprayer or closure to the container, formula, target dose and filling process before selecting a component route.',
    links: [
      ['/products/airless-pump-bottles/', 'Airless pump bottles'],
      ['/products/serum-dropper-bottles/', 'Serum dropper bottles'],
      ['/products/cosmetic-tubes/', 'Cosmetic tubes and applicators'],
      ['/products/makeup-packaging/', 'Color cosmetics components'],
      ['/insights/cosmetic-pump-closure-selection-guide/', 'Pump and closure selection guide'],
      ['/insights/cosmetic-pump-not-working-troubleshooting/', 'Pump troubleshooting guide']
    ]
  },
  'products/eco-friendly-packaging/index.html': {
    heading: 'Continue the refill and sustainability cluster',
    intro: 'Compare refill, bamboo, recycled-content and reduced-material routes as complete packaging systems, including product contact, assembly, transport and claim evidence.',
    links: [
      ['/products/refill-packaging/', 'Refill packaging systems'],
      ['/products/refill-pouch-packaging/', 'Refill pouches and sachets'],
      ['/products/bamboo-packaging/', 'Bamboo packaging components'],
      ['/products/cosmetic-packaging-kits/', 'Mixed-material packaging kits'],
      ['/insights/refill-pouches-reusable-bottles/', 'Refill and reusable bottle guide'],
      ['/insights/cosmetic-packaging-right-sizing-guide/', 'Packaging right-sizing guide']
    ]
  },
  'products/glass-cosmetic-bottles/index.html': {
    heading: 'Continue the glass beauty packaging cluster',
    intro: 'Use the related application pages to compare glass bottles with dropper, airless, fragrance and nail-care systems before sampling.',
    links: [
      ['/products/serum-dropper-bottles/', 'Serum dropper bottle selection'],
      ['/products/airless-pump-bottles/', 'Airless pump bottle selection'],
      ['/products/perfume-bottles/', 'Perfume bottle systems'],
      ['/products/nail-polish-bottles/', 'Nail polish bottle systems'],
      ['/products/personal-care-packaging/', 'Personal care packaging routes'],
      ['/products/cosmetic-pumps-closures/', 'Cosmetic pumps and closures'],
      ['/products/skincare-packaging/', 'Skincare packaging routes'],
      ['/insights/cosmetic-packaging-compatibility-testing-guide/', 'Compatibility testing guide']
    ]
  },
  'products/perfume-bottles/index.html': {
    heading: 'Continue the fragrance packaging cluster',
    intro: 'Compare perfume, body mist, roll-on, refillable atomizer and home-fragrance routes by neck, pump, decoration, sampling and packed protection.',
    links: [
      ['/products/home-fragrance-packaging/', 'Home fragrance packaging'],
      ['/products/cosmetic-pumps-closures/', 'Pumps, collars and closures'],
      ['/products/cosmetic-packaging-kits/', 'Fragrance packaging kits'],
      ['/insights/perfume-bottle-sourcing-small-brands/', 'Perfume bottle sourcing guide'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist']
    ]
  },
  'products/serum-dropper-bottles/index.html': {
    heading: 'Continue the serum dispensing cluster',
    intro: 'Compare dropper, airless and glass bottle routes by formula, viscosity, dose, closure fit, leakage, light exposure and production-intent testing.',
    links: [
      ['/products/airless-pump-bottles/', 'Airless pump bottle selection'],
      ['/products/skincare-packaging/', 'Skincare packaging categories'],
      ['/products/glass-cosmetic-bottles/', 'Glass cosmetic bottle selection'],
      ['/airless-bottle-vs-dropper-bottle/', 'Airless versus dropper guide'],
      ['/insights/dropper-bottle-leaking-seal-pipette-guide/', 'Dropper leak troubleshooting'],
      ['/products/cosmetic-pumps-closures/', 'Cosmetic pumps and closures'],
      ['/insights/cosmetic-packaging-product-evacuation-guide/', 'Product evacuation guide']
    ]
  },
  'products/airless-pump-bottles/index.html': {
    heading: 'Continue the airless skincare cluster',
    intro: 'Connect the airless system to skincare applications, formula compatibility, product evacuation and refill decisions before approving a bottle and pump.',
    links: [
      ['/products/skincare-packaging/', 'Skincare packaging selection'],
      ['/products/serum-dropper-bottles/', 'Serum dropper comparison'],
      ['/products/cosmetic-jars/', 'Cosmetic jar comparison'],
      ['/products/refill-packaging/', 'Refill packaging route'],
      ['/insights/airless-pump-bottle-vs-jar-skincare-packaging/', 'Airless bottle versus jar guide'],
      ['/insights/cosmetic-packaging-product-evacuation-guide/', 'Product evacuation guide']
    ]
  },
  'products/cosmetic-tubes/index.html': {
    heading: 'Continue the tube and applicator cluster',
    intro: 'Compare squeeze tubes, barrier structures, nozzles, caps and wand systems with the formula, filling, sealing, decoration and evacuation guides.',
    links: [
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/products/makeup-packaging/', 'Makeup tube and applicator routes'],
      ['/products/aluminum-packaging/', 'Aluminum packaging routes'],
      ['/insights/cosmetic-packaging-compatibility-testing-guide/', 'Compatibility testing guide'],
      ['/insights/cosmetic-packaging-decoration-methods/', 'Cosmetic decoration methods'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist']
    ]
  },
  'products/makeup-packaging/index.html': {
    heading: 'Continue the color cosmetics cluster',
    intro: 'Link the makeup format to the component, wiper, applicator, closure, compatibility and decoration pages that support a production-intent brief.',
    links: [
      ['/products/cosmetic-tubes/', 'Cosmetic tubes and applicators'],
      ['/products/nail-polish-bottles/', 'Nail polish bottle systems'],
      ['/products/airless-pump-bottles/', 'Airless complexion packaging'],
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/insights/color-cosmetics-component-systems/', 'Color cosmetics component guide'],
      ['/insights/cosmetic-packaging-decoration-methods/', 'Decoration methods guide']
    ]
  },
  'custom-cosmetic-packaging/index.html': {
    heading: 'Continue the cosmetic sourcing cluster',
    intro: 'Move from the custom route to OEM/ODM planning, private-label selection, wholesale supply and the guides that make an RFQ comparable.',
    links: [
      ['/oem-cosmetic-packaging/', 'OEM and ODM packaging service'],
      ['/private-label-cosmetic-packaging/', 'Private-label packaging selection'],
      ['/wholesale-cosmetic-packaging/', 'Wholesale cosmetic packaging'],
      ['/cosmetic-packaging-supplier-china/', 'China cosmetic packaging supplier'],
      ['/cosmetic-packaging-moq/', 'MOQ and lead-time guide'],
      ['/insights/cosmetic-packaging-rfq-guide/', 'Packaging RFQ field guide']
    ]
  },
  'oem-cosmetic-packaging/index.html': {
    heading: 'Continue the OEM procurement cluster',
    intro: 'Connect the OEM/ODM approval route with custom, private-label, wholesale and supplier pages so a buyer can choose the right sourcing path.',
    links: [
      ['/custom-cosmetic-packaging/', 'Custom cosmetic packaging'],
      ['/private-label-cosmetic-packaging/', 'Private-label packaging'],
      ['/wholesale-cosmetic-packaging/', 'Wholesale packaging'],
      ['/cosmetic-packaging-supplier-china/', 'China supplier route'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist'],
      ['/insights/cosmetic-packaging-rfq-guide/', 'Packaging RFQ field guide']
    ]
  },
  'wholesale-cosmetic-packaging/index.html': {
    heading: 'Continue the bulk cosmetic packaging cluster',
    intro: 'Use the category hubs and approval guides below to turn a bulk packaging request into a matched, repeatable component specification.',
    links: [
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/products/cosmetic-pumps-closures/', 'Pumps and closures'],
      ['/products/cosmetic-packaging-kits/', 'Cosmetic packaging kits'],
      ['/cosmetic-packaging-moq/', 'MOQ and lead-time guide'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist'],
      ['/insights/cosmetic-packaging-rfq-guide/', 'Packaging RFQ field guide']
    ]
  },
  'cosmetic-packaging-moq/index.html': {
    heading: 'Continue the cosmetic procurement cluster',
    intro: 'After estimating quantity and timing, compare the route, component family, sample approval and RFQ pages that determine the final project scope.',
    links: [
      ['/custom-cosmetic-packaging/', 'Custom cosmetic packaging'],
      ['/oem-cosmetic-packaging/', 'OEM and ODM packaging'],
      ['/private-label-cosmetic-packaging/', 'Private-label packaging'],
      ['/wholesale-cosmetic-packaging/', 'Wholesale packaging'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist'],
      ['/insights/cosmetic-packaging-rfq-guide/', 'Packaging RFQ field guide']
    ]
  },
  'cosmetic-packaging-sample-approval-checklist/index.html': {
    heading: 'Continue the packaging approval cluster',
    intro: 'Use the application and sourcing pages below to carry the approved formula, components, decoration, quantity and packing requirements into the next decision.',
    links: [
      ['/cosmetic-packaging-moq/', 'MOQ and lead-time planning'],
      ['/custom-cosmetic-packaging/', 'Custom cosmetic packaging'],
      ['/oem-cosmetic-packaging/', 'OEM and ODM packaging'],
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/products/glass-packaging/', 'Glass packaging selection'],
      ['/insights/cosmetic-packaging-rfq-guide/', 'Packaging RFQ field guide']
    ]
  },
  'insights/cosmetic-packaging-rfq-guide/index.html': {
    heading: 'Continue from the RFQ field guide',
    intro: 'Use the relevant sourcing hub and application page to turn the RFQ fields into a stable bottle, closure, decoration and approval route.',
    links: [
      ['/custom-cosmetic-packaging/', 'Custom cosmetic packaging'],
      ['/oem-cosmetic-packaging/', 'OEM and ODM packaging'],
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/products/cosmetic-pumps-closures/', 'Pumps and closures'],
      ['/products/glass-packaging/', 'Glass packaging'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist']
    ]
  },
  'insights/glass-bottle-sample-approval-qc-checklist/index.html': {
    heading: 'Continue the glass bottle approval cluster',
    intro: 'Pair the quality checklist with the glass, beverage, closure and project-brief pages that define the production-intent bottle and packed route.',
    links: [
      ['/products/glass-packaging/', 'Glass packaging hub'],
      ['/products/beverage-bottles/', 'Beverage bottle hub'],
      ['/products/wine-bottles/', 'Wine bottle selection'],
      ['/products/beer-bottles/', 'Beer bottle selection'],
      ['/insights/glass-bottle-neck-finish-closure-guide/', 'Neck finish and closure guide'],
      ['/insights/glass-bottle-defects-quality-inspection-guide/', 'Glass defects and inspection guide']
    ]
  },
  'insights/perfume-bottle-sourcing-small-brands/index.html': {
    heading: 'Continue the fragrance sourcing cluster',
    intro: 'Use the fragrance category, components and sample approval pages to compare a perfume bottle project from silhouette through packed shipment.',
    links: [
      ['/products/perfume-bottles/', 'Perfume bottle category'],
      ['/products/home-fragrance-packaging/', 'Home fragrance packaging'],
      ['/products/cosmetic-pumps-closures/', 'Pumps and closures'],
      ['/cosmetic-packaging-sample-approval-checklist/', 'Sample approval checklist'],
      ['/cosmetic-packaging-moq/', 'MOQ and lead-time guide']
    ]
  }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function routeId(relativePath) {
  return `theme-cluster-${relativePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
}

function clusterMarkup(relativePath, config, source) {
  const contentWithoutShell = source
    .replace(/<header\b[\s\S]*?<\/header>/i, '')
    .replace(/<footer\b[\s\S]*?<\/footer>/i, '');
  const links = config.links.filter(([href]) => !contentWithoutShell.includes(`href="${href}"`));
  if (!links.length) return '';
  const id = routeId(relativePath);
  return `<section class="gsp-theme-cluster" aria-labelledby="${id}"><div class="eyebrow">Theme cluster</div><h2 id="${id}">${escapeHtml(config.heading)}</h2><p>${escapeHtml(config.intro)}</p><nav class="gsp-theme-cluster-links" aria-label="Related packaging routes">${links.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('')}</nav></section>`;
}

let changed = 0;
let skipped = 0;
for (const [relativePath, config] of Object.entries(clusterPages)) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) throw new Error(`Missing cluster page: ${relativePath}`);
  let source = fs.readFileSync(filePath, 'utf8');
  if (source.includes('class="gsp-theme-cluster"')) continue;
  const markup = clusterMarkup(relativePath, config, source);
  if (!markup) {
    skipped += 1;
    console.log(`cluster links already covered ${relativePath}`);
    continue;
  }
  const insertion = relativePath === 'products/product-index/index.html'
    ? /<\/main>/i
    : /<\/div><!-- \/\.gsp-main-landmark -->/i.test(source)
      ? /<\/div><!-- \/\.gsp-main-landmark -->/i
      : /<\/main>/i;
  if (!insertion.test(source)) throw new Error(`Missing insertion point for ${relativePath}`);
  source = source.replace(insertion, match => `${markup}\n${match}`);
  fs.writeFileSync(filePath, source);
  changed += 1;
  console.log(`cluster links added ${relativePath}`);
}

console.log(`Theme cluster optimization complete: ${changed}/${Object.keys(clusterPages).length} pages changed; ${skipped} pages already covered by contextual links.`);
