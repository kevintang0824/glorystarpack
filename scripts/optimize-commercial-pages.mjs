import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');

const pages = {
  'custom-cosmetic-packaging/index.html': {
    description: 'Custom cosmetic packaging manufacturer for OEM/ODM bottles, jars, tubes, pumps and caps. Compare stock, decoration, custom molds, samples, MOQ and quote inputs.',
    faqs: [
      ['What custom cosmetic packaging services are available?', 'GloryStarPack supports custom molds, logo printing, hot stamping, UV printing, frosting, color coating, electroplating, laser engraving, cap matching, retail boxes and packaging inserts.'],
      ['Can I request samples?', 'Yes. Stock samples usually take 7-10 working days. Custom samples usually take 15-20 working days.'],
      ['What information is needed for a quote?', 'Please share product type, capacity, material, decoration, quantity, destination country and any reference photos or drawings.']
    ]
  },
  'oem-cosmetic-packaging/index.html': {
    description: 'Plan OEM or ODM cosmetic packaging by formula or application, component fit, decoration, samples, approval, packing and destination requirements.',
    faqs: [
      ['What is OEM cosmetic packaging?', 'OEM cosmetic packaging is manufacturing based on a buyer-approved specification for the container, closure, decoration, artwork and packing configuration.'],
      ['What is ODM cosmetic packaging?', 'ODM cosmetic packaging includes supplier-led component selection or development before samples and the final production specification are approved.'],
      ['Can I request samples for an OEM or ODM project?', 'Yes. Sample availability, scope, charges and timing are confirmed after the selected components, decoration, approval goal and destination are defined. A visual stock sample does not replace a production-intent component set for fit, filling, dispensing or decoration review.'],
      ['What information is needed for a quote?', 'Share the application or formula, capacity, component system, decoration and artwork status, quantity per SKU, destination, timing, sample goal and reference photos or drawings. Final MOQ, availability and timing depend on the selected configuration.']
    ]
  },
  'private-label-cosmetic-packaging/index.html': {
    description: 'Select private label cosmetic packaging by formula, stock or custom mold, bottles, jars, tubes, components, MOQ, decoration, samples and retail boxes.'
  },
  'wholesale-cosmetic-packaging/index.html': {
    description: 'Wholesale cosmetic packaging supplier for bulk bottles, jars, tubes, pumps, caps, sample kits and OEM decoration with export-ready packing.',
    faqs: [
      ['Can I buy wholesale cosmetic packaging with custom logo decoration?', 'Yes. Wholesale orders can include silk screen printing, hot stamping, UV printing, labels, frosting, color coating, electroplating, laser engraving, retail boxes and molded inserts.'],
      ['Can I combine bottles, caps and boxes in one wholesale order?', 'Yes. GloryStarPack can match bottles, jars, tubes, pumps, caps, droppers, applicators, cartons, inserts and export packing as one packaging project.'],
      ['What should I send for a wholesale quote?', 'Send product type, capacity, material, closure, decoration, order quantity, destination country, timeline, formula notes and reference photos or drawings.']
    ]
  },
  'cosmetic-packaging-supplier-china/index.html': {
    description: 'Factory-direct cosmetic packaging supplier in Xiamen, China for glass and plastic bottles, jars, airless pumps, tubes, samples, OEM decoration and export packing.',
    faqs: [
      ['Is GloryStarPack a China-based cosmetic packaging supplier?', 'Yes. GloryStarPack is based in Xiamen, Fujian, China and supplies cosmetic packaging to beauty brands, private label brands, contract fillers and packaging distributors worldwide.'],
      ['Can I source both stock and custom packaging?', 'Yes. Buyers can start from stock bottles, jars, tubes, pumps and caps, then add custom logo decoration, color matching, boxes, inserts or custom molds when needed.'],
      ['What makes a quote faster?', 'Send product type, capacity, material, closure, decoration method, order quantity, destination country, timeline, formula notes and reference photos or drawings.']
    ]
  },
  'cosmetic-packaging-moq/index.html': {
    description: 'Plan cosmetic packaging MOQ and lead time by stock status, material, closure, decoration, testing and order mix. Use the RFQ checklist for comparable quotes.'
  },
  'cosmetic-packaging-sample-approval-checklist/index.html': {
    description: 'Cosmetic packaging sample approval checklist covering formula compatibility, leakage, decoration, cap fit, pump output, carton protection and bulk sign-off.',
    faqs: [
      ['Do I need to approve both blank and decorated samples?', 'Yes. Blank samples help confirm structure, capacity and formula fit. Decorated samples confirm logo, color, finish, print position and shelf appearance.'],
      ['Should I test samples with my real formula?', 'Yes. Formula compatibility testing is important, especially for oils, acids, alcohol-based products, sunscreen, fragrance, active skincare and formulas filled at elevated temperature.']
    ]
  },
  'products/glass-cosmetic-bottles/index.html': {
    description: 'Compare glass cosmetic bottles by formula, fill process, neck finish, closure, dispensing, light exposure, decoration, testing and RFQ inputs.'
  },
  'products/airless-pump-bottles/index.html': {
    description: 'Compare airless pump bottles by formula, piston or pouch structure, filling, dose, priming, evacuation, refill route and RFQ inputs.'
  },
  'products/perfume-bottles/index.html': {
    description: 'Perfume bottle manufacturer for square, sculpted oval and thick-bottom glass bottles, mini vials, roll-ons, refillable atomizers and matched pumps.',
    faqs: [
      ['What perfume bottles do you manufacture?', 'We supply luxury glass perfume bottles, thick-bottom bottles, mini perfume vials, roll-on bottles, refillable glass atomizers, aluminum atomizers, fine mist sprayers and diffuser bottles.'],
      ['Can I request samples?', 'Yes. Share the bottle format, capacity, neck and pump requirements so we can confirm suitable sample options.'],
      ['What information is needed for a quote?', 'Please share product type, capacity, bottle shape, neck and pump, cap or decoration, quantity, destination country and any reference photos or drawings.']
    ]
  },
  'products/serum-dropper-bottles/index.html': {
    description: 'Compare serum dropper bottles by formula, viscosity, neck finish, gasket, bulb, pipette, dose, leakage, light exposure and RFQ inputs.'
  },
  'products/nail-polish-bottles/index.html': {
    description: 'Nail polish bottle supplier for square, round and slim rectangular glass bottles, UV black gel polish bottles, brush caps, samples and private label nail care.'
  },
  'products/beer-bottles/index.html': {
    description: 'Source wholesale glass beer bottles in amber, green or flint, including long-neck, stubby, growler and swing-top styles, with closure matching and fill review.',
    faqs: [
      ['Which glass colors are available for beer bottles?', 'Common sourcing options include amber, green and flint glass. Availability, UV-light protection needs and color consistency should be checked for the selected model and beer.'],
      ['Can you match crown caps or swing-top closures?', 'Yes. A crown cap or swing-top assembly must be matched to the exact neck finish. We verify drawings and samples rather than assuming that closures with similar names are interchangeable.'],
      ['Are all bottles suitable for pasteurization or carbonated beer?', 'No single statement applies to every model. Share the carbonation target, maximum process temperature, pasteurization method and filling conditions so the bottle specification can be reviewed for the intended use.'],
      ['Can beer bottles be custom molded or decorated?', 'Custom mold development, embossing, screen print, coating, frosting, labels and coordinated closures can be evaluated. Feasibility and MOQ depend on the approved bottle and decoration route.'],
      ['What details are needed for a beer bottle quote?', 'Send beer type, capacity, glass color, bottle shape, closure, decoration, carbonation, fill temperature, pasteurization process, order quantity and delivery destination.'],
      ['Can I approve samples before a production order?', 'Sampling can be planned according to the selected stock or custom route. The bottle, closure, decoration and packing should be reviewed together before final production approval.']
    ]
  },
  'products/wine-bottles/index.html': {
    description: 'Wholesale glass wine bottles in Bordeaux, Burgundy, Hock, dessert, sparkling and mini styles, with closure matching, decoration, samples and export packing.',
    faqs: [
      ['What wine bottle shapes are available?', 'Sourcing includes Bordeaux, Burgundy, Hock, Riesling, dessert, sparkling and mini formats for tasting or gift sets.'],
      ['Which glass colors can be sourced?', 'Common options include flint, amber, olive green, antique green and champagne green, depending on the selected model.'],
      ['Can corks and caps be matched?', 'Yes. Cork, ROPP screw cap, crown or sparkling closure options are matched to the exact neck finish and verified by drawing and sample.'],
      ['What should I send for a quote?', 'Send wine type, capacity, shape, color, closure, decoration, quantity, destination and any filling-line or pressure requirements.']
    ]
  },
  'products/whiskey-bottles/index.html': {
    description: 'Wholesale glass whiskey bottles in heavy-base square, round, flask and mini styles, with bar-top closures, decoration, samples and export packing.',
    faqs: [
      ['Which sizes can be sourced?', 'Common project sizes include 50ml and 100ml minis, 200ml and 375ml formats, and 500ml, 700ml and 750ml retail bottles.'],
      ['Which closure works with whiskey bottles?', 'Bar-top corks are common for premium bottles. Screw and ROPP closures may be available for compatible neck finishes.'],
      ['Can the bottles be decorated?', 'Projects can review labels, screen printing, frosting, color coating, metallic decoration and embossing feasibility.'],
      ['What is needed for a quote?', 'Share capacity, shape, glass color, base style, closure, decoration, quantity, destination and a reference image.']
    ]
  }
};

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function setMeta(source, identity, value) {
  const tagPattern = /<meta\b[^>]*>/gi;
  let found = false;
  const updated = source.replace(tagPattern, tag => {
    const match = tag.match(/\b(?:name|property)="([^"]+)"/i);
    if (!match || match[1].toLowerCase() !== identity) return tag;
    found = true;
    const content = `content="${escapeHtml(value)}"`;
    return /\bcontent="[^"]*"/i.test(tag)
      ? tag.replace(/\bcontent="[^"]*"/i, content)
      : tag.replace(/>$/, ` ${content}>`);
  });
  if (found) return updated;
  const attribute = identity.startsWith('og:') ? 'property' : 'name';
  const tag = `<meta ${attribute}="${identity}" content="${escapeHtml(value)}"/>`;
  if (!updated.includes('</head>')) throw new Error(`Missing </head> for meta tag: ${identity}`);
  return updated.replace('</head>', `${tag}</head>`);
}

function addFaqSchema(source, faqEntries) {
  if (!faqEntries?.length) return source;
  const blockMatch = source.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!blockMatch) throw new Error('Missing JSON-LD block');
  const data = JSON.parse(blockMatch[1]);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
  if (graph.some(node => node?.['@type'] === 'FAQPage')) return source;
  const canonicalMatch = source.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (!canonicalMatch) throw new Error('Missing canonical URL');
  const canonical = canonicalMatch[1];
  graph.push({
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    url: canonical,
    mainEntity: faqEntries.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  });
  const nextData = { ...data, '@graph': graph };
  return source.replace(blockMatch[0], `<script type="application/ld+json">${JSON.stringify(nextData)}</script>`);
}

function syncStructuredDescription(source, description) {
  const blockMatch = source.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!blockMatch) throw new Error('Missing JSON-LD block');
  const data = JSON.parse(blockMatch[1]);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
  const primaryTypes = new Set(['CollectionPage', 'Service', 'Article', 'WebPage']);
  let changed = false;
  for (const node of graph) {
    if (primaryTypes.has(node?.['@type']) && node.description !== description) {
      node.description = description;
      changed = true;
    }
  }
  if (!changed) return source;
  return source.replace(blockMatch[0], `<script type="application/ld+json">${JSON.stringify(data)}</script>`);
}

let changed = 0;
for (const [relativePath, config] of Object.entries(pages)) {
  const filePath = path.join(rootDir, relativePath);
  let source = fs.readFileSync(filePath, 'utf8');
  const before = source;
  source = setMeta(source, 'description', config.description);
  source = setMeta(source, 'og:description', config.description);
  source = setMeta(source, 'twitter:description', config.description);
  source = syncStructuredDescription(source, config.description);
  source = addFaqSchema(source, config.faqs);
  if (source !== before) {
    fs.writeFileSync(filePath, source);
    changed += 1;
    console.log(`optimized ${relativePath}`);
  }
}

console.log(`Commercial page optimization complete: ${changed}/${Object.keys(pages).length} pages changed.`);
