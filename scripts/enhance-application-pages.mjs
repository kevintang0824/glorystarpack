import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const modifiedDate = '2026-09-17';
const decisionMarker = '<!-- BEGIN APPLICATION DECISION -->';

const pages = {
  'products/home-fragrance-packaging/index.html': {
    insertBefore: '<section class="note" style="margin-top:24px"><h2>Quick sourcing answer</h2>',
    markup: `${decisionMarker}<section class="card" style="margin-top:24px" aria-labelledby="home-fragrance-decision-title"><h2 id="home-fragrance-decision-title">Choose the packaging route by scent format</h2><p><strong>Short answer:</strong> Treat candle, diffuser, room spray and spa packaging as separate filled-product systems even when the visual collection is shared. Confirm formula contact, heat or pressure exposure, closure, decoration and export packing for each format before approving a combined set.</p><div class="table-scroll" role="region" aria-label="Home fragrance packaging route comparison" tabindex="0"><table class="decision-table"><caption>Home fragrance formats and the questions to confirm before sampling</caption><thead><tr><th scope="col">Scent format</th><th scope="col">Packaging route</th><th scope="col">Confirm with production-intent parts</th></tr></thead><tbody><tr><td>Candle or wax melt</td><td>Glass candle jar or aluminum tin with lid, label and box</td><td>Fill temperature, vessel and lid fit, wax contact, wick clearance, decoration and packed protection.</td></tr><tr><td>Reed diffuser</td><td>Glass bottle with stopper, cap or collar, reeds and carton</td><td>Neck fit, evaporation use case, formula contact, leak orientation, reed dimensions and secondary packing.</td></tr><tr><td>Room spray or body mist</td><td>Glass or plastic bottle with fine-mist pump and cap</td><td>Formula contact, pump priming, spray output, dip-tube length, leakage and decoration near the neck.</td></tr><tr><td>Spa or hotel amenity set</td><td>Mini bottles, jars, pouches, pumps, caps and coordinated kit pack</td><td>Viscosity, target dose, fill line, kit assembly, label area, replenishment and carton count.</td></tr></tbody></table></div><p>For a comparable RFQ, share the scent format, formula or fill state, capacity, closure, decoration, quantity per SKU, destination and packed route. Then compare the <a href="/products/hotel-amenity-packaging/">hotel amenity packaging route</a>, <a href="/products/cosmetic-packaging-kits/">packaging kit options</a> and <a href="/insights/perfume-bottle-sourcing-small-brands/">fragrance sourcing guide</a> before requesting samples.</p></section><!-- END APPLICATION DECISION -->`,
    faqs: [
      ['Can I source candle, diffuser and spa packaging together?', 'Yes. You can combine candle jars, diffuser bottles, room spray bottles, bath care jars, pump bottles, refill pouches, boxes and inserts into one project.'],
      ['Can the packaging be customized?', 'Yes. Logo printing, labels, color coating, frosting, hot stamping, custom caps, paper boxes and molded inserts can be developed together.'],
      ['Can you help with hotel amenity packaging?', 'Yes. Mini bottles, travel kits, sachets, jars, toiletry pouches and cartons can be prepared for hotels, spas, resorts and distributors.']
    ]
  },
  'products/hotel-amenity-packaging/index.html': {
    insertBefore: '<section class="note" style="margin-top:24px"><h2>Quick sourcing answer</h2>',
    markup: `${decisionMarker}<section class="card" style="margin-top:24px" aria-labelledby="hotel-amenity-decision-title"><h2 id="hotel-amenity-decision-title">Plan an amenity program around use and replenishment</h2><p><strong>Short answer:</strong> Choose mini bottles, pouches or refillable dispensers by guest-use format, formula viscosity, hygiene and replenishment process, branding, carton count and destination requirements. An amenity set is complete only when the container, closure, filled formula, packing and refill action are reviewed together.</p><div class="table-scroll" role="region" aria-label="Hotel amenity packaging route comparison" tabindex="0"><table class="decision-table"><caption>Hospitality packaging routes and the questions to confirm before sampling</caption><thead><tr><th scope="col">Program</th><th scope="col">Packaging route</th><th scope="col">Confirm with production-intent parts</th></tr></thead><tbody><tr><td>Guest-room mini set</td><td>Mini bottles or jars with pump, flip cap or screw cap</td><td>Formula viscosity, fill volume, cap retention, label area, leakage, guest-use ergonomics and carton count.</td></tr><tr><td>Spa or travel kit</td><td>Sample jars, sachets, pouches, sleeves and small bottles</td><td>Number of uses, seal integrity, kit assembly, artwork, pouch dimensions and packed distribution.</td></tr><tr><td>Refill hospitality program</td><td>Refill pouch with reusable bottle, dispenser, pump or spout cap</td><td>Spout fit, transfer control, cleaning or replacement instructions, replenishment workflow and empty-pack handling.</td></tr><tr><td>Distributor or multi-property rollout</td><td>Matched component family with labels, cartons and export dividers</td><td>SKU list, component continuity, barcode or label space, master-carton quantity, destination and reorder control.</td></tr></tbody></table></div><p>For a useful quote, send the property or program type, products, fill volume, closure, branding, quantity per SKU, replenishment model, destination and timing. Compare the <a href="/insights/refill-ready-hotel-amenity-packaging/">refill-versus-mini guide</a>, <a href="/products/home-fragrance-packaging/">home fragrance and spa packaging</a> and <a href="/insights/travel-size-cosmetic-packaging-leak-testing-guide/">travel-size leak-testing guide</a> before sample approval.</p></section><!-- END APPLICATION DECISION -->`,
    faqs: [
      ['Can mini hotel amenity bottles be customized?', 'Yes. Bottle color, cap type, label area, logo printing, custom labels, paper sleeves and cartons can be customized by project.'],
      ['Can pouches and mini bottles be supplied together?', 'Yes. Clear toiletry pouches, mini bottles, jars, sachets, sleeves and cartons can be managed as one amenity kit.'],
      ['Can you support lower-waste amenity programs?', 'Yes. Refill pouches, reusable bottles, PCR plastic options and larger refill formats can be reviewed for hospitality refill programs.']
    ]
  },
  'products/beverage-bottles/index.html': {
    insertBefore: '<section class="section dark">',
    markup: `${decisionMarker}<section class="section white" aria-labelledby="beverage-approval-title"><div class="wrap"><div class="section-intro"><div><div class="eyebrow">Approval path</div><h2 id="beverage-approval-title">Approve the beverage bottle as a filled system</h2></div><p><strong>Short answer:</strong> Choose a beverage bottle from the drink, target fill volume, filling process and closure before comparing shape or unit price. Carbonated, hot-filled, pasteurized and reusable programs need project-specific bottle drawings, closure matching and physical samples; a catalog image does not establish pressure, thermal or line suitability.</p></div><div class="card-grid"><article class="card accent"><h3>1. Freeze the brief</h3><p>Record beverage, capacity, glass or PET route, fill temperature, carbonation or pressure, closure, decoration, quantity and destination.</p></article><article class="card gold"><h3>2. Match the closure</h3><p>Review neck finish, cork, crown, ROPP, screw, lug or swing-top assembly with liner, gasket, tamper feature and capping equipment.</p></article><article class="card olive"><h3>3. Approve production-intent parts</h3><p>Check bottle dimensions, capacity, filled behavior, closure fit, decoration, export dividers and the packed route before bulk production.</p></article></div><p class="section-note">For a decision-ready inquiry, include the beverage, capacity, closure, filling conditions, quantity, destination, decoration and reference drawing. Continue with the <a href="/insights/glass-bottle-neck-finish-closure-guide/">neck-finish guide</a>, <a href="/insights/glass-bottle-sample-approval-qc-checklist/">sample approval checklist</a> and <a href="/insights/how-to-ship-glass-bottles-without-breaking/">glass shipping guide</a>.</p></div></section><!-- END APPLICATION DECISION -->`,
    faqs: [
      ['What beverage bottle styles can you source?', 'The range includes beer bottles, Bordeaux and Burgundy wine bottles, sparkling bottles, heavy-base whiskey bottles, vodka and gin bottles, mini liquor bottles, and glass formats for juice, soda, water and specialty drinks.'],
      ['Can bottles and closures be matched together?', 'Yes. Bottle neck finish, cork or cap, liner, tamper component, decoration, label area and export carton can be reviewed as one project.'],
      ['What is needed for a quote?', 'Share the beverage type, capacity, bottle style, glass color, closure, decoration, quantity, filling conditions, destination country and reference image.'],
      ['How are beer or carbonated-drink bottles approved?', 'Availability and performance depend on the exact model. Confirm the bottle drawing, closure, target pressure, filling temperature and pasteurization conditions, then use physical samples for line and compatibility checks before production.']
    ]
  },
  'products/nail-polish-bottles/index.html': {
    insertBefore: '<section class="note" style="margin-top:24px"><h2>Quick sourcing answer</h2>',
    markup: `${decisionMarker}<section class="card" style="margin-top:24px" aria-labelledby="nail-bottle-decision-title"><h2 id="nail-bottle-decision-title">Approve the nail bottle, brush and formula as one set</h2><p><strong>Short answer:</strong> A nail polish bottle is a dispensing system, not only a glass container. Match the bottle, neck, wiper, brush, stem, cap, formula viscosity, fill process, light exposure, decoration and sealing behavior before approving a private-label component.</p><div class="table-scroll" role="region" aria-label="Nail polish packaging route comparison" tabindex="0"><table class="decision-table"><caption>Nail-care packaging routes and the questions to confirm before sampling</caption><thead><tr><th scope="col">Formula or use</th><th scope="col">Route to compare</th><th scope="col">Confirm with production-intent parts</th></tr></thead><tbody><tr><td>Clear or pigmented lacquer</td><td>Clear, colored or square glass bottle with brush cap</td><td>Neck and wiper fit, brush pickup and payoff, stem length, fill level, evaporation, cap torque and decoration.</td></tr><tr><td>UV-sensitive gel polish</td><td>Opaque black or light-managed glass bottle with brush system</td><td>Required light-management evidence, formula contact, brush output, closure seal, fill process and artwork durability.</td></tr><tr><td>Base coat, top coat or treatment</td><td>Matched bottle, brush and cap family for repeat SKUs</td><td>Viscosity range, brush consistency, component codes, label panel, color matching and reorder continuity.</td></tr><tr><td>Cuticle oil or travel set</td><td>Pen, mini bottle or discovery format with applicator</td><td>Applicator dose, leakage, cap retention, formula compatibility, kit assembly and packed orientation.</td></tr></tbody></table></div><p>For a comparable RFQ, share the formula type, capacity, bottle shape, brush and cap, decoration, quantity per SKU, destination, timeline and reference sample. Use the <a href="/products/makeup-packaging/">makeup packaging hub</a>, <a href="/products/glass-cosmetic-bottles/">glass cosmetic bottle guide</a> and <a href="/insights/cosmetic-packaging-compatibility-testing-guide/">compatibility testing guide</a> to prepare the brief.</p></section><!-- END APPLICATION DECISION -->`,
    faqs: [
      ['Can you supply UV black gel polish bottles?', 'Yes. Opaque black glass bottles are available for gel polish, base coat and formulas that need reduced light exposure.'],
      ['Can brush length and cap color be customized?', 'Yes. Brush stem length, cap color, cap shape, bottle finish and decoration can be matched to the bottle and formula.'],
      ['What information is needed for a nail bottle quote?', 'Share bottle capacity, glass color, cap style, brush length, decoration, quantity, destination country and reference samples.']
    ]
  }
};

function updateStructuredData(source, canonical, faqs) {
  const match = source.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error(`Missing JSON-LD block for ${canonical}`);
  const data = JSON.parse(match[1]);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
  for (const node of graph) {
    if (node && node.dateModified) node.dateModified = modifiedDate;
  }
  if (!graph.some(node => node?.['@type'] === 'FAQPage')) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      url: canonical,
      mainEntity: faqs.map(([name, answer]) => ({
        '@type': 'Question',
        name,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      }))
    });
  }
  data['@graph'] = graph;
  return source.replace(match[0], `<script type="application/ld+json">${JSON.stringify(data)}</script>`);
}

let changed = 0;
for (const [relativePath, config] of Object.entries(pages)) {
  const filePath = path.join(rootDir, relativePath);
  let source = fs.readFileSync(filePath, 'utf8');
  const canonical = source.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
  if (!canonical) throw new Error(`Missing canonical for ${relativePath}`);
  if (!source.includes(decisionMarker)) {
    if (!source.includes(config.insertBefore)) throw new Error(`Missing insertion point for ${relativePath}`);
    source = source.replace(config.insertBefore, `${config.markup}\n  ${config.insertBefore}`);
  }
  const updated = updateStructuredData(source, canonical, config.faqs);
  if (updated !== source) {
    fs.writeFileSync(filePath, updated);
    changed += 1;
    console.log(`enhanced ${relativePath}`);
  }
}

console.log(`Application page enhancement complete: ${changed}/${Object.keys(pages).length} pages changed.`);
