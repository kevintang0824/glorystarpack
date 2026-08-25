import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const requestedPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '';
const requestedDate = process.argv.find(argument => argument.startsWith('--date='))?.slice(7) ?? '';
const startMarker = '<!-- BEGIN PROCUREMENT DEPTH -->';
const endMarker = '<!-- END PROCUREMENT DEPTH -->';
const insertionPoint = '<section class="card" style="margin-top:24px"><h2>Quick Answers</h2>';

if (requestedDate && !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
  throw new Error('The --date value must use YYYY-MM-DD.');
}

const enhancements = {
  'products/bamboo-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="bamboo-construction-title"><h2 id="bamboo-construction-title">Specify the complete bamboo component construction</h2><p>A bamboo appearance does not mean every part of a bottle, jar, cap or makeup component is made from bamboo. Ask the supplier to identify the visible bamboo shell, the inner container, product-contact parts, threads, liner, adhesive and dispensing mechanism separately. This makes formula review, artwork planning, disposal guidance and repeat ordering more precise.</p><ul><li>Confirm the inner bottle or jar material and every product-contact component.</li><li>Review cap fit, moisture exposure, surface finish, engraving or print area and acceptable natural color variation.</li><li>Approve the complete component with the formula, closure and export packing rather than approving the bamboo shell alone.</li></ul><p>Environmental language should be specific to the verified component and market. Review the <a href="/insights/refill-pouches-reusable-bottles/">refill-system guide</a>, <a href="https://www.iso.org/standard/14021" target="_blank" rel="noopener">ISO 14021 environmental-claims overview</a> and <a href="https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides" target="_blank" rel="noopener">FTC Green Guides summary</a> before using broad sustainability claims.</p></section>`,
  'oem-cosmetic-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="oem-stages-title"><h2 id="oem-stages-title">Plan the OEM/ODM project in approval stages</h2><p>A useful OEM brief separates fixed requirements from open choices. Formula or application, capacity, destination, quantity and launch timing normally guide the project first; bottle shape, closure, decoration and secondary packaging can then be compared against those constraints.</p><ul><li><strong>Route selection:</strong> decide whether a stock container with decoration is sufficient or whether a custom mold is required.</li><li><strong>Component review:</strong> match the container, neck finish, pump or cap, liner, applicator and carton clearance.</li><li><strong>Sample approval:</strong> freeze artwork, color, finish and production-intent component versions before bulk planning.</li><li><strong>Reorder control:</strong> retain item codes, drawings, artwork revisions, approved samples and packing instructions.</li></ul><p>Use the <a href="/insights/cosmetic-packaging-rfq-guide/">packaging RFQ guide</a> to prepare inputs, then review <a href="/insights/cosmetic-packaging-compatibility-testing-guide/">compatibility testing</a> and <a href="/insights/cosmetic-packaging-decoration-methods/">decoration methods</a> before final approval.</p></section>`,
  'custom-cosmetic-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="custom-scope-title"><h2 id="custom-scope-title">Define what is custom before requesting a quote</h2><p>Custom packaging can mean a stock bottle with a new color and logo, a matched stock component family, a modified closure or a fully proprietary mold. These routes have different sample steps, tooling needs, minimum quantities and lead-time assumptions, so the RFQ should state which decisions are mandatory and which remain open to recommendation.</p><ul><li>Identify the formula or application, fill volume and intended dispensing experience.</li><li>Separate container, closure, decoration, label, insert, retail box and export-carton requirements.</li><li>State whether exclusive shape, embossing, tooling ownership or stock availability matters.</li><li>Approve production-intent components and record the final bill of materials for reorders.</li></ul><p>Compare <a href="/insights/custom-glass-bottle-moq-stock-vs-custom-mold/">stock bottles versus custom molds</a>, calculate the <a href="/insights/custom-cosmetic-packaging-cost-hidden-fees/">complete custom packaging cost and hidden fees</a>, review the <a href="/oem-cosmetic-packaging/">OEM/ODM process</a> and send the selected route through the <a href="/contact/">structured RFQ page</a>.</p></section>`,
  'products/cosmetic-tubes/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="tube-route-title"><h2 id="tube-route-title">How should a buyer choose a cosmetic tube?</h2><p><strong>Short answer:</strong> Choose a cosmetic tube from the formula, filling and dispensing task. Define viscosity, fill volume, barrier or light-protection needs, fill temperature, tube diameter and length, nozzle or opening, cap, seal method and filling equipment. Then approve the exact body structure, shoulder, product-contact layers, closure, decoration and packed route with production-intent samples; a material label or nominal capacity alone does not establish compatibility or performance.</p><h3>Compare construction routes before sampling</h3><p>Use these routes to create a shortlist, then confirm the exact contact construction, filling process and packed distribution route. Format names are starting points, not proof of project-specific suitability.</p><div class="table-scroll" role="region" aria-label="Cosmetic tube construction route comparison" tabindex="0"><table class="decision-table"><caption>Cosmetic tube routes and the questions to confirm before sampling</caption><thead><tr><th scope="col">Formula or use starting point</th><th scope="col">Route to compare</th><th scope="col">Confirm with production-intent parts</th></tr></thead><tbody><tr><td>Lotion, cleanser, hand cream or another squeeze-dispensed formula</td><td>PE or coextruded squeeze tube</td><td>Viscosity, wall and product-contact layer, opening, cap, fill-end seal, filler equipment and usable evacuation.</td></tr><tr><td>Barrier or light-sensitive brief</td><td>ABL, PBL or EVOH-containing structure</td><td>Full layer stack and product-contact layer, project-specific barrier target, seam, decoration, seal method and filler equipment. The format name alone does not establish barrier performance.</td></tr><tr><td>Sunscreen, spot, eye or lip application needing a smaller outlet</td><td>Precision nozzle, applicator or small-opening tube</td><td>Formula, target dose, tip material, opening, cap, clean dispensing, leakage and packed orientation.</td></tr><tr><td>High fill temperature or a formed-metal brief</td><td><a href="/products/aluminum-packaging/">Formed aluminum or aluminum-barrier route</a></td><td>Distinguish formed aluminum from laminate construction; confirm contact layer or coating, fill process, nozzle, cap and fill-end crimp or seal.</td></tr><tr><td>Liquid lip or another wand-applied product</td><td><a href="/products/lip-gloss-tubes/">Rigid wand tube and applicator system</a></td><td>Distinguish a rigid wand package from a squeeze tube; confirm neck, wiper, stem, applicator, pickup, payoff, closure and leakage review.</td></tr></tbody></table></div><h3>Use the supporting approval guides</h3><ul><li><a href="/insights/cosmetic-packaging-compatibility-testing-guide/">Build a configuration-specific compatibility review</a> for the formula, contact layers, cap, decoration and packed route.</li><li><a href="/insights/cosmetic-packaging-decoration-methods/">Compare decoration methods</a> against the selected substrate, curve, seam, seal area and handling exposure.</li><li><a href="/insights/cosmetic-packaging-product-evacuation-guide/">Define usable product evacuation</a> with a stated normal-use endpoint instead of assuming that a tube empties completely.</li></ul></section><section class="card rfq-card" aria-labelledby="tube-rfq-title"><h2 id="tube-rfq-title">Build a cosmetic tube RFQ</h2><p>Share the formula or application, viscosity, fill volume, fill temperature, barrier or light-protection target, preferred construction, tube diameter and length, opening or applicator, cap, filling and sealing equipment, decoration, quantity per SKU, destination, timing and sample goals. Add reference drawings or photos when available. The configuration, sample scope and project-specific compatibility, dispensing and packed-route checks can then be reviewed before any MOQ or timing commitment.</p><div class="btns"><a class="btn" data-inquiry-type="quote" data-inquiry-location="cosmetic-tubes-decision-table" href="/contact/">Build a Cosmetic Tube RFQ</a><a class="btn alt" href="/insights/cosmetic-packaging-rfq-guide/">See the RFQ Field Guide</a></div></section>`,
  'products/refill-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="refill-system-title"><h2 id="refill-system-title">Evaluate refill packaging as a complete operating system</h2><p>A refill package must work with the reusable container, filling process, shipping pack and user refill action. Compare the refill volume with the primary bottle capacity, then confirm formula viscosity, spout position, cap diameter, transfer control, leakage protection and the way empty packs will be handled in the destination market.</p><ul><li>Test the refill pack and reusable container with the actual formula and intended closure components.</li><li>Review filling and sealing parameters, transport orientation, carton compression and consumer instructions.</li><li>Define how the reusable pack is cleaned, inspected or replaced when the chosen model requires those operations.</li><li>Qualify recycled-content, reusable, refillable or recyclable statements with evidence for the actual system and market.</li></ul><p>Continue with the <a href="/insights/refill-pouches-reusable-bottles/">refill pouch and reusable bottle guide</a>. For claim and system context, see <a href="https://www.iso.org/standard/55871.html" target="_blank" rel="noopener">ISO 18603 packaging reuse</a> and the <a href="https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides" target="_blank" rel="noopener">FTC environmental claims summary</a>.</p></section>`,
  'products/aluminum-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="aluminum-route-title"><h2 id="aluminum-route-title">How should a buyer choose aluminum cosmetic packaging?</h2><p><strong>Short answer:</strong> Aluminum cosmetic packaging includes primary aluminum bottles, jars, tins and squeeze tubes, plus aluminum-shell atomizers and specialized can systems. Choose by formula contact, fill temperature, closure or valve, internal coating or liner, dispensing method and destination requirements. A metallic appearance alone does not prove compatibility, pressure suitability or recyclability; approve the exact production-intent container, contact layer, closure and decoration before ordering.</p><h3>Separate the contact construction from the metallic appearance</h3><p>Use these routes to build a shortlist, then confirm the exact bill of materials and filling process. A metal-looking collar or shell does not mean the formula contacts aluminum, while an aluminum barrier laminate is not the same construction as a formed aluminum tube.</p><div class="table-scroll" role="region" aria-label="Aluminum cosmetic packaging route comparison" tabindex="0"><table class="decision-table"><caption>Aluminum packaging routes and the questions to confirm before sampling</caption><thead><tr><th scope="col">Product and filling starting point</th><th scope="col">Route to compare</th><th scope="col">Confirm with production-intent parts</th></tr></thead><tbody><tr><td>Non-pressurized lotion, toner, oil or hair care</td><td>Primary aluminum bottle, lined bottle or bottle with an aluminum decorative shell</td><td>Which layer contacts the formula, internal coating or liner, neck, closure or pump, dip tube, fill method and packed orientation.</td></tr><tr><td>Balm, wax, solid perfume or powder</td><td>Aluminum tin, jar or non-pressurized can</td><td>Fill temperature, contact surface, lid construction, liner, opening action, decoration and deformation in the final shipping pack.</td></tr><tr><td>Cream or paste designed for squeeze dispensing</td><td><a href="/products/cosmetic-tubes/">Aluminum or aluminum-barrier tube route</a></td><td>Formed aluminum versus laminate structure, product-contact layers, nozzle, cap, fill-end crimp or seal, filler equipment and usable evacuation.</td></tr><tr><td>Travel fragrance or refillable spray accessory</td><td>Aluminum-shell atomizer with a separate inner vial</td><td>Inner vial material, refill action, pump, gasket, dose, leakage checks and whether the shell is decorative or product-contacting.</td></tr><tr><td>Dry shampoo, body mist, deodorant or another pressurized application</td><td><a href="/products/aluminum-cosmetic-cans/">Aluminum cosmetic can system</a></td><td>Pressure status, can specification, valve, actuator, filling method, responsible filler, applicable transport requirements and complete packed-system approval.</td></tr></tbody></table></div><h3>Use the supporting approval guides</h3><ul><li><a href="/insights/cosmetic-packaging-compatibility-testing-guide/">Define a configuration-specific compatibility review</a> for the formula, contact surfaces, closure, dispensing and packed route.</li><li><a href="/insights/cosmetic-packaging-decoration-methods/">Compare decoration methods</a> against the actual aluminum, coating, shell, curve and handling exposure.</li><li><a href="/insights/cosmetic-packaging-right-sizing-guide/">Qualify right-sizing and environmental claims</a> against a named construction, baseline and destination context.</li></ul></section><section class="card rfq-card" aria-labelledby="aluminum-rfq-title"><h2 id="aluminum-rfq-title">Build an aluminum packaging RFQ</h2><p>Share the product or formula, fill state and temperature, target capacity, preferred aluminum format, internal contact surface, closure or valve, filling equipment, decoration, quantity, destination and distribution route. Add reference drawings or photos when available. The selected construction, sample scope and project-specific compatibility or pressure checks can then be reviewed without assuming that one aluminum format fits every use.</p><div class="btns"><a class="btn" data-inquiry-type="quote" data-inquiry-location="aluminum-decision-table" href="/contact/">Build an Aluminum Packaging RFQ</a><a class="btn alt" href="/insights/cosmetic-packaging-rfq-guide/">See the RFQ Field Guide</a></div></section>`,
  'products/eco-friendly-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="eco-route-title"><h2 id="eco-route-title">Match the environmental route to the complete pack</h2><p>Start with the product-contact container, closure, dispensing part, decoration and secondary packaging rather than choosing a material by appearance alone. A paper outer shell, bamboo collar, refill pouch or recycled-resin bottle can still contain additional materials that affect compatibility, assembly, disposal instructions and environmental claims.</p><ul><li>Request a component-level bill of materials and identify which parts touch the formula.</li><li>Compare refill, reuse, recycled-content, lightweighting and reduced-secondary-packaging routes against the same functional brief.</li><li>Test the production-intent pack for formula compatibility, leakage, dispensing and transport before making a route decision.</li><li>Qualify claims for the actual component and destination market; avoid treating “natural-looking” as proof of a specific environmental benefit.</li></ul><p>For wood-grain closures and component shells, review the <a href="/products/bamboo-packaging/">bamboo cosmetic packaging specification guide</a>. For systems designed around repeat fills, compare the <a href="/products/refill-packaging/">refill packaging route</a> and document the reusable primary container as part of the same system.</p></section>`,
  'products/skincare-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="skincare-format-title"><h2 id="skincare-format-title">How should a brand choose skincare packaging?</h2><p><strong>Short answer:</strong> Choose skincare packaging from the formula and dispensing task, not the container shape alone. Define viscosity, fill volume, target dose, light or air sensitivity, application method and filling equipment. Then compare jars, droppers, pumps, airless bottles and tubes using production-intent components. Confirm formula-contact materials, closure fit, dispensing performance, decoration and transport protection before approving the final pack.</p><h3>Shortlist a production-intent format</h3><p>These product pages are starting points, not compatibility or performance approvals. The selected container, closure, contact parts and formula still need a project-specific review.</p><div class="table-scroll" role="region" aria-label="Skincare packaging format shortlist" tabindex="0"><table class="decision-table"><caption>Skincare packaging formats and the questions to confirm before sampling</caption><thead><tr><th scope="col">Formula or use starting point</th><th scope="col">Product routes to compare</th><th scope="col">Confirm with production-intent parts</th></tr></thead><tbody><tr><td>Facial oil or flowable serum</td><td><a href="/products/serum-dropper-bottle-glass-p7/">Glass serum dropper bottle</a></td><td>Pipette reach, bulb and gasket materials, target dose, formula exposure and leakage in relevant orientations.</td></tr><tr><td>Lotion, serum or foundation needing controlled output</td><td><a href="/products/airless-pump-bottle-plastic-cosmetic-p2/">Plastic airless pump bottle</a> or <a href="/products/slim-airless-serum-bottle-p43/">slim airless serum bottle</a></td><td>Viscosity, filling method, priming, output, actuator return, leakage and usable evacuation.</td></tr><tr><td>Cream, balm or mask designed for direct access</td><td><a href="/products/luxury-glass-cream-jar-with-gold-lid-p1/">Glass cream jar</a></td><td>Opening geometry, liner and closure fit, fill process, applicator route and formula contact.</td></tr><tr><td>Eye care, spot treatment or travel-size concentrate</td><td><a href="/products/mini-airless-eye-cream-pump-bottle-p150/">Mini airless eye-cream pump bottle</a></td><td>Target dose, actuator force, priming, repeated output, cap clearance and packed orientation.</td></tr><tr><td>Refill-led skincare range</td><td><a href="/products/refillable-airless-pump-bottle-p18/">Refillable airless pump bottle</a></td><td>Inner cartridge and outer pack fit, transfer or replacement action, repeated assembly, compatibility and refill continuity.</td></tr></tbody></table></div><h3>Use the supporting approval guides</h3><ul><li><a href="/insights/airless-pump-bottle-vs-jar-skincare-packaging/">Compare an airless pump bottle with a jar</a> by formula flow, access, dose, filling and user action.</li><li><a href="/insights/cosmetic-packaging-compatibility-testing-guide/">Build a configuration-specific compatibility review</a> for the formula, contact parts, closure, decoration and packed route.</li><li><a href="/insights/cosmetic-packaging-product-evacuation-guide/">Define usable product evacuation</a> with a normal-use endpoint instead of assuming one format empties completely.</li></ul></section><section class="card rfq-card" aria-labelledby="skincare-rfq-title"><h2 id="skincare-rfq-title">Build a skincare packaging RFQ</h2><p>Share the formula or application, viscosity, fill volume, preferred dispensing format, target dose, closure or component needs, decoration, estimated quantity, destination, timing and filling-line constraints. Add reference photos or drawings by email when useful. These inputs allow the bottle, jar, tube or airless route, sample scope and project-specific validation steps to be reviewed together.</p><div class="btns"><a class="btn" data-inquiry-type="quote" data-inquiry-location="skincare-decision-table" href="/contact/">Build a Skincare Packaging RFQ</a><a class="btn alt" href="/insights/cosmetic-packaging-rfq-guide/">See the RFQ Field Guide</a></div></section>`,
  'products/makeup-packaging/index.html': `<section class="card" style="margin-top:24px" aria-labelledby="makeup-route-title"><h2 id="makeup-route-title">How should a buyer choose makeup packaging?</h2><p><strong>Short answer:</strong> Choose makeup packaging as a matched component system. For liquid lip, mascara and brow products, confirm the container neck, wiper, stem, applicator and closure with the formula. For lipstick, compacts, cushions and liquid complexion products, verify the mechanism or pan, fill process, dose, closure, decoration and transport protection. Capacity or appearance alone cannot establish pickup, payoff, leakage, compatibility or repeat-order consistency.</p><h3>Compare the format by formula and use action</h3><p>Use these routes to build a shortlist, then approve production-intent parts with the selected formula, filling method and packed distribution route. A category or sample appearance is not evidence that a component will meet a project-specific performance target.</p><div class="table-scroll" role="region" aria-label="Makeup packaging component route comparison" tabindex="0"><table class="decision-table"><caption>Makeup packaging routes and the questions to confirm before sampling</caption><thead><tr><th scope="col">Formula or use starting point</th><th scope="col">Route to compare</th><th scope="col">Confirm with production-intent parts</th></tr></thead><tbody><tr><td>Liquid lip, mascara or brow product</td><td><a href="/products/lip-gloss-tubes/">Tube, neck, wiper, stem, applicator and cap system</a></td><td>Formula viscosity, target pickup and payoff, wiper restriction, stem length, applicator shape, closure condition, neck residue, orientation leakage and dry-out review.</td></tr><tr><td>Lipstick, balm or another stick product</td><td>Mechanism, cup, bullet and cap system</td><td>Formula-contact parts, fill temperature and process, cup fit, mechanism travel, bullet alignment, twist action, cap fit and packed protection.</td></tr><tr><td>Pressed powder, compact, cushion or refill</td><td>Pan or cartridge, hinge or latch, mirror, puff or sponge and closure</td><td>Pan or cartridge dimensions, fill and assembly method, opening cycles, closure security, refill action, decoration and drop or distribution protection.</td></tr><tr><td>Liquid foundation or complexion product</td><td><a href="/products/slim-airless-serum-bottle-p43/">Slim airless bottle candidate</a> or another bottle-and-pump system</td><td>Viscosity, filling method, formula-contact construction, target dose, priming, repeated output, leakage and usable evacuation. The linked product is a starting point, not a compatibility approval.</td></tr></tbody></table></div><h3>Use the supporting approval guides</h3><ul><li><a href="/insights/color-cosmetics-component-systems/">Match wipers, wands and closures</a> to the formula, dose and intended use action.</li><li><a href="/insights/cosmetic-packaging-compatibility-testing-guide/">Build a configuration-specific compatibility review</a> for every formula-contact part and packed route.</li><li><a href="/insights/cosmetic-packaging-decoration-methods/">Compare decoration methods</a> against the selected substrate, geometry, handling and artwork.</li><li><a href="/insights/cosmetic-packaging-product-evacuation-guide/">Define usable product evacuation</a> with a stated normal-use endpoint.</li></ul></section><section class="card rfq-card" aria-labelledby="makeup-rfq-title"><h2 id="makeup-rfq-title">Build a makeup component RFQ</h2><p>Share the makeup format, formula or product state, target fill, component system and required use action, such as pickup, payoff, wipe, seal, refill fit or pump output. Include applicator or pan dimensions, decoration and shade or SKU plan, quantity per SKU, filling method, destination, timing and reference drawings. The exact sample set and checks can then be defined before any suitability, MOQ or lead-time commitment.</p><div class="btns"><a class="btn" data-inquiry-type="quote" data-inquiry-location="makeup-decision-table" href="/contact/">Build a Makeup Component RFQ</a><a class="btn alt" href="/insights/cosmetic-packaging-rfq-guide/">See the RFQ Field Guide</a></div></section>`
};

const pageReplacements = {
  'products/skincare-packaging/index.html': [
    {
      from: 'ul{margin:0;padding-left:20px}.faq{display:grid;gap:12px}',
      to: 'ul{margin:0;padding-left:20px}.table-scroll{overflow-x:auto;margin:18px 0 22px;border:1px solid var(--border);border-radius:8px}.decision-table{width:100%;min-width:760px;border-collapse:collapse;background:#fff}.decision-table caption{text-align:left;padding:12px 14px;font-weight:700;color:var(--dark);background:#f4f0e8}.decision-table th,.decision-table td{padding:12px 14px;text-align:left;vertical-align:top;border-top:1px solid var(--border);font-size:14px;line-height:1.55}.decision-table th{background:var(--dark);color:#d8c28f}.decision-table a{color:#6d5728;font-weight:700}.rfq-card{margin-top:24px;background:#f4f0e8}.faq{display:grid;gap:12px}'
    },
    {
      from: '<p>Yes. Stock samples usually take 7-10 working days. Custom samples usually take 15-20 working days.</p>',
      to: '<p>Yes. Share the exact container, closure, formula or application, decoration and destination. Stock availability, sample scope, charges and timing are confirmed for the selected configuration; custom color, decoration, tooling or production-intent components may require a different approval route.</p>'
    }
  ],
  'products/aluminum-packaging/index.html': [
    {
      from: 'Aluminum cosmetic packaging supplier for aluminum bottles, cans, tins, tubes, jars, atomizers, aerosol cans, sachets and recyclable metal packaging.',
      to: 'Aluminum cosmetic packaging guide for bottles, cans, tins, tubes, jars and atomizers: compare contact layers, filling, closures, decoration and RFQ inputs.',
      all: true
    },
    {
      from: '<meta property="og:description" content="Aluminum cosmetic packaging including bottles, soda-can and beer-can style containers, body mist aerosol cans, dry shampoo aerosol cans, roll-on deodorant bottles, lip balm tubes, screw-top jars, tins, pocket perfume atomizers, sachets and refill pouches.">',
      to: '<meta property="og:description" content="Aluminum cosmetic packaging guide for bottles, cans, tins, tubes, jars and atomizers: compare contact layers, filling, closures, decoration and RFQ inputs.">'
    },
    {
      from: '<meta name="twitter:image" content="https://www.glorystarpack.com/assets/brand/aluminum-complete-product-assortment-2026.jpg"><script type="application/ld+json">',
      to: '<meta name="twitter:image" content="https://www.glorystarpack.com/assets/brand/aluminum-complete-product-assortment-2026.jpg"><link rel="preload" as="image" href="/assets/brand/aluminum-complete-product-assortment-2026-960.avif" imagesrcset="/assets/brand/aluminum-complete-product-assortment-2026-480.avif 480w, /assets/brand/aluminum-complete-product-assortment-2026-960.avif 960w" imagesizes="(max-width:760px) calc(100vw - 48px), 420px" type="image/avif"><script type="application/ld+json">'
    },
    {
      from: 'ul{margin:0;padding-left:20px}.faq{display:grid;gap:12px}',
      to: 'ul{margin:0;padding-left:20px}.table-scroll{overflow-x:auto;margin:18px 0 22px;border:1px solid var(--border);border-radius:8px}.table-scroll:focus-visible{outline:3px solid var(--gold);outline-offset:3px}.decision-table{width:100%;min-width:760px;border-collapse:collapse;background:#fff}.decision-table caption{text-align:left;padding:12px 14px;font-weight:700;color:var(--dark);background:#f4f0e8}.decision-table th,.decision-table td{padding:12px 14px;text-align:left;vertical-align:top;border-top:1px solid var(--border);font-size:14px;line-height:1.55}.decision-table th{background:var(--dark);color:#d8c28f}.decision-table a{color:#6d5728;font-weight:700}.rfq-card{margin-top:24px;background:#f4f0e8}.faq{display:grid;gap:12px}'
    },
    {
      from: '<div class="eyebrow">Factory-direct cosmetic packaging</div>',
      to: '<div class="eyebrow">Aluminum packaging selection guide</div>'
    },
    {
      from: '<p class="lead">Aluminum cosmetic packaging including bottles, soda-can and beer-can style containers, body mist aerosol cans, dry shampoo aerosol cans, roll-on deodorant bottles, lip balm tubes, screw-top jars, tins, pocket perfume atomizers, sachets and refill pouches. GloryStarPack provides OEM/ODM customization, sample support and global shipping for beauty brands worldwide.</p>',
      to: '<p class="lead">Compare aluminum bottles, tins, jars, tubes, atomizer shells and specialized can systems by formula contact, filling route, closure or valve, internal lining, decoration and destination requirements.</p>'
    },
    {
      from: [
        '<a class="btn" href="/products/product-index/">Browse Aluminum Cosmetic Packaging</a><a class="btn alt" href="/contact/">Request Quote</a>',
        '<a class="btn" href="/#products/material-metal">Browse Aluminum Catalog</a><a class="btn alt" data-inquiry-type="quote" data-inquiry-location="aluminum-hero" href="/contact/">Build an Aluminum RFQ</a>'
      ],
      to: '<a class="btn" href="/products/aluminum-cosmetic-cans/">Explore Aluminum Can Systems</a><a class="btn alt" data-inquiry-type="quote" data-inquiry-location="aluminum-hero" href="/contact/">Build an Aluminum RFQ</a>'
    },
    {
      from: '<div class="hero-img"><img src="/assets/brand/aluminum-complete-product-assortment-2026.jpg" width="1536" height="1024" alt="Aluminum Cosmetic Packaging product packaging collection" decoding="async" fetchpriority="high"></div>',
      to: '<div class="hero-img"><picture><source type="image/avif" srcset="/assets/brand/aluminum-complete-product-assortment-2026-480.avif 480w, /assets/brand/aluminum-complete-product-assortment-2026-960.avif 960w" sizes="(max-width:760px) calc(100vw - 48px), 420px"><img src="/assets/brand/aluminum-complete-product-assortment-2026.jpg" width="1536" height="1024" alt="Aluminum cosmetic packaging formats arranged for construction comparison" decoding="async" fetchpriority="high"></picture></div>'
    },
    {
      from: '<h2>What We Supply</h2><p>Aluminum Cosmetic Packaging options include stock and custom formats for skincare, fragrance, makeup, hair care, body care and sample programs.</p>',
      to: '<h2>Formats to Compare</h2><p>Compare primary aluminum containers, aluminum-shell components, barrier laminates and specialized can systems as different construction routes for skincare, fragrance, makeup, hair care, body care and sample programs.</p>'
    },
    {
      from: '<h2>Best For</h2><p>Aluminum Cosmetic Packaging is commonly selected for balms, salves, solid perfume, body mist, dry shampoo, bath powder, travel fragrance, novelty beauty gifts, samples and recyclable beauty packaging.</p>',
      to: '<h2>Starting Applications</h2><p>Possible starting applications include balms, waxes, solid perfume, powders, non-pressurized liquids, travel fragrance and selected aerosol projects. Final suitability depends on the exact contact construction, formula, filling process, closure or valve and destination requirements.</p>'
    },
    {
      from: '<h3>Customization</h3><p>Logo printing, hot stamping, UV printing, frosting, coating, electroplating, laser engraving, color matching and custom boxes are available.</p>',
      to: '<h3>Decoration Questions</h3><p>Decoration routes may include printing, stamping, coating, anodizing, labels or sleeves depending on the exact substrate and geometry. Confirm artwork, color reference, contact exposure, rub or adhesion checks and production-intent proofing for the selected construction.</p>'
    },
    {
      from: '<p>Aluminum cosmetic packaging including bottles, soda-can and beer-can style containers, body mist aerosol cans, dry shampoo aerosol cans, roll-on deodorant bottles, lip balm tubes, screw-top jars, tins, pocket perfume atomizers, sachets and refill pouches.</p>',
      to: '<p>Aluminum cosmetic packaging can mean a primary aluminum container, an aluminum barrier layer, a decorative aluminum shell or a specialized can system. Identify the product-contact construction and filling route before comparing options.</p>'
    },
    {
      from: '<p>Yes. Stock samples usually take 7-10 working days. Custom samples usually take 15-20 working days.</p>',
      to: '<p>Yes. Sample availability, scope, charges and timing are confirmed after the exact format, contact construction, component system, decoration and approval route are defined.</p>'
    }
  ],
  'products/makeup-packaging/index.html': [
    {
      from: 'Makeup Packaging Manufacturer | Lip Gloss & Mascara',
      to: 'Makeup Packaging Guide | Lip, Eye & Complexion',
      all: true
    },
    {
      from: 'Makeup packaging manufacturer for lip gloss tubes, mascara tubes, lipstick tubes, compacts, cushion cases, refill pans and private label cosmetics.',
      to: 'Compare makeup packaging for lip, eye and complexion products by formula, applicator, filling, compatibility, decoration and RFQ inputs.',
      all: true
    },
    {
      from: '<meta property="og:image:alt" content="Makeup Packaging Manufacturer product and cosmetic packaging collection">',
      to: '<meta property="og:image:alt" content="Makeup packaging formats for lip, eye and complexion products">'
    },
    {
      from: '<meta name="twitter:image" content="https://www.glorystarpack.com/assets/brand/makeup-complete-product-assortment-2026.jpg"><script type="application/ld+json">',
      to: '<meta name="twitter:image" content="https://www.glorystarpack.com/assets/brand/makeup-complete-product-assortment-2026.jpg"><link rel="preload" as="image" href="/assets/brand/makeup-complete-product-assortment-2026-960.avif" imagesrcset="/assets/brand/makeup-complete-product-assortment-2026-480.avif 480w, /assets/brand/makeup-complete-product-assortment-2026-960.avif 960w" imagesizes="(max-width:760px) calc(100vw - 48px), 420px" type="image/avif"><script type="application/ld+json">'
    },
    {
      from: '"name":"Makeup Packaging Supplier","item":"https://www.glorystarpack.com/products/makeup-packaging/"',
      to: '"name":"Makeup Packaging","item":"https://www.glorystarpack.com/products/makeup-packaging/"'
    },
    {
      from: 'ul{margin:0;padding-left:20px}.faq{display:grid;gap:12px}',
      to: 'ul{margin:0;padding-left:20px}.table-scroll{overflow-x:auto;margin:18px 0 22px;border:1px solid var(--border);border-radius:8px}.table-scroll:focus-visible{outline:3px solid var(--gold);outline-offset:3px}.decision-table{width:100%;min-width:760px;border-collapse:collapse;background:#fff}.decision-table caption{text-align:left;padding:12px 14px;font-weight:700;color:var(--dark);background:#f4f0e8}.decision-table th,.decision-table td{padding:12px 14px;text-align:left;vertical-align:top;border-top:1px solid var(--border);font-size:14px;line-height:1.55}.decision-table th{background:var(--dark);color:#d8c28f}.decision-table a{color:#6d5728;font-weight:700}.rfq-card{margin-top:24px;background:#f4f0e8}.faq{display:grid;gap:12px}'
    },
    {
      from: '<div class="eyebrow">Factory-direct cosmetic packaging</div>',
      to: '<div class="eyebrow">Makeup component selection guide</div>'
    },
    {
      from: '<h1>Makeup Packaging Manufacturer</h1>',
      to: '<h1>Makeup Packaging Selection Guide</h1>'
    },
    {
      from: '<p class="lead">Makeup packaging includes lip gloss tubes, lip oil tubes, mascara tubes, brow gel tubes, lipstick tubes, compact powder cases, cushion compacts, cushion refill cartridges, paperboard makeup palettes, sample jars, nail polish bottles, cuticle oil pens and private label color cosmetic components. GloryStarPack provides OEM/ODM customization, sample support and global shipping for beauty brands worldwide.</p>',
      to: '<p class="lead">Compare color-cosmetic tubes, sticks, compacts, cushions and liquid-complexion packs by formula, use action, component fit, filling, decoration and packed distribution.</p>'
    },
    {
      from: '<a class="btn" href="/products/product-index/">Browse Makeup Packaging Supplier</a><a class="btn alt" href="/contact/">Request Quote</a>',
      to: '<a class="btn" href="#makeup-route-title">Compare Component Routes</a><a class="btn alt" data-inquiry-type="quote" data-inquiry-location="makeup-hero" href="/contact/">Build a Makeup RFQ</a>'
    },
    {
      from: '<div class="hero-img"><img src="/assets/brand/makeup-complete-product-assortment-2026.jpg" width="1672" height="941" alt="Makeup Packaging Supplier product packaging collection" decoding="async" fetchpriority="high"></div>',
      to: '<div class="hero-img"><picture><source type="image/avif" srcset="/assets/brand/makeup-complete-product-assortment-2026-480.avif 480w, /assets/brand/makeup-complete-product-assortment-2026-960.avif 960w" sizes="(max-width:760px) calc(100vw - 48px), 420px"><img src="/assets/brand/makeup-complete-product-assortment-2026.jpg" width="1672" height="941" alt="Makeup packaging components arranged for format comparison" decoding="async" fetchpriority="high"></picture></div>'
    },
    {
      from: '<h2>What We Supply</h2><p>Makeup Packaging Supplier options include stock and custom formats for skincare, fragrance, makeup, hair care, body care and sample programs.</p>',
      to: '<h2>Formats to Compare</h2><p>Catalog directions include tubes, sticks, compacts, cushions, palettes, sample containers and nail-care components. Current component, material, decoration and sample availability must be confirmed for the selected project.</p>'
    },
    {
      from: '<h2>Best For</h2><p>Makeup Packaging Supplier is commonly selected for private label makeup, clean beauty color cosmetics, lash serum, brow gel, lip oil, nail care and refillable compacts.</p>',
      to: '<h2>Selection Starting Points</h2><p>Group the brief by product state and use action, such as liquid lip, lash or brow application, stick dispensing, pressed powder, cushion refill, liquid complexion or nail care. Final suitability depends on the exact formula, component system, filling process and destination requirements.</p>'
    },
    {
      from: '<h3>Customization</h3><p>Logo printing, hot stamping, UV printing, frosting, coating, electroplating, laser engraving, color matching and custom boxes are available.</p>',
      to: '<h3>Decoration Questions</h3><p>Potential decoration routes depend on the selected substrate, geometry, component assembly and handling exposure. Confirm artwork, shade or SKU plan, color reference, print area, adhesion or rub checks and production-intent proofing for the exact pack.</p>'
    },
    {
      from: '<h3>What makeup packaging do you manufacture?</h3><p>Makeup packaging includes lip gloss tubes, lip oil tubes, mascara tubes, brow gel tubes, lipstick tubes, compact powder cases, cushion compacts, cushion refill cartridges, paperboard makeup palettes, sample jars, nail polish bottles, cuticle oil pens and private label color cosmetic components.</p>',
      to: '<h3>What makeup packaging formats can a buyer compare?</h3><p>The catalog includes directions for lip and eye tubes, compact and refill systems, palettes, sticks, nail packaging and applicator sets. Current component, material, decoration and sample availability must be confirmed for the selected formula, fill process, quantity, SKU plan and destination.</p>'
    },
    {
      from: '<p>Yes. Stock samples usually take 7-10 working days. Custom samples usually take 15-20 working days.</p>',
      to: '<p>Yes. Sample availability, scope, charges and timing are confirmed after the exact component system, formula or application, decoration and approval goals are defined. A visual stock sample does not replace a production-intent set used for functional review.</p>'
    },
    {
      from: '<p>Please share product type, capacity, material, decoration, quantity, destination country and any reference photos or drawings.</p>',
      to: '<p>Share the formula or product state, target fill, component and use-action requirements, applicator or pan dimensions, filling method, decoration and shade or SKU plan, quantity per SKU, destination, timing, sample goals and any reference drawings. Final MOQ, availability and timing are confirmed for the selected configuration.</p>'
    }
  ],
  'products/cosmetic-tubes/index.html': [
    {
      from: 'Cosmetic Tubes Manufacturer | GloryStarPack',
      to: 'Cosmetic Tube Packaging | Selection Guide',
      all: true
    },
    {
      from: 'Cosmetic tubes supplier for PE squeeze tubes, PCR tubes, ABL barrier tubes, sunscreen tubes, hand cream tubes, dual-end tubes and OEM tube packaging.',
      to: 'Compare cosmetic tube packaging by formula, PE or barrier structure, nozzle, cap, filling, seal, decoration and production-intent approval inputs.',
      all: true
    },
    {
      from: '<meta property="og:description" content="Cosmetic tubes include PE squeeze tubes, ABL barrier tubes, EVOH high-barrier tubes, bio-PE tubes, aluminum squeeze tubes, lip gloss tubes, paperboard lip balm tubes, sunscreen tubes and hand cream tubes.">',
      to: '<meta property="og:description" content="Compare cosmetic tube packaging by formula, PE or barrier structure, nozzle, cap, filling, seal, decoration and production-intent approval inputs.">'
    },
    {
      from: '<meta property="og:image:alt" content="Cosmetic Tubes Manufacturer product and cosmetic packaging collection">',
      to: '<meta property="og:image:alt" content="Cosmetic tube packaging formats arranged for construction comparison">'
    },
    {
      from: '<meta name="twitter:image" content="https://www.glorystarpack.com/assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg"><script type="application/ld+json">',
      to: '<meta name="twitter:image" content="https://www.glorystarpack.com/assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg"><link rel="preload" as="image" href="/assets/brand/cosmetic-tubes-complete-product-assortment-2026-640.avif" imagesrcset="/assets/brand/cosmetic-tubes-complete-product-assortment-2026-640.avif 640w, /assets/brand/cosmetic-tubes-complete-product-assortment-2026-1280.avif 1280w" imagesizes="(max-width:760px) calc(100vw - 48px), 420px" type="image/avif"><script type="application/ld+json">'
    },
    {
      from: '"name":"Cosmetic Tubes Manufacturer","item":"https://www.glorystarpack.com/products/cosmetic-tubes/"',
      to: '"name":"Cosmetic Tube Packaging","item":"https://www.glorystarpack.com/products/cosmetic-tubes/"'
    },
    {
      from: 'ul{margin:0;padding-left:20px}.faq{display:grid;gap:12px}',
      to: 'ul{margin:0;padding-left:20px}.table-scroll{overflow-x:auto;margin:18px 0 22px;border:1px solid var(--border);border-radius:8px}.table-scroll:focus-visible{outline:3px solid var(--gold);outline-offset:3px}.decision-table{width:100%;min-width:760px;border-collapse:collapse;background:#fff}.decision-table caption{text-align:left;padding:12px 14px;font-weight:700;color:var(--dark);background:#f4f0e8}.decision-table th,.decision-table td{padding:12px 14px;text-align:left;vertical-align:top;border-top:1px solid var(--border);font-size:14px;line-height:1.55}.decision-table th{background:var(--dark);color:#d8c28f}.decision-table a{color:#6d5728;font-weight:700}.rfq-card{margin-top:24px;background:#f4f0e8}.faq{display:grid;gap:12px}'
    },
    {
      from: 'padding:3px" fetchpriority="high">GloryStarPack',
      to: 'padding:3px">GloryStarPack'
    },
    {
      from: '<div class="eyebrow">Factory-direct cosmetic packaging</div>',
      to: '<div class="eyebrow">Cosmetic tube selection guide</div>'
    },
    {
      from: '<h1>Cosmetic Tubes Manufacturer</h1>',
      to: '<h1>Cosmetic Tube Packaging Selection Guide</h1>'
    },
    {
      from: '<p class="lead">Cosmetic tubes include PE squeeze tubes, ABL barrier tubes, EVOH high-barrier tubes, bio-PE tubes, aluminum squeeze tubes, lip gloss tubes, paperboard lip balm tubes, sunscreen tubes and hand cream tubes. GloryStarPack provides OEM/ODM customization, sample support and global shipping for beauty brands worldwide.</p>',
      to: '<p class="lead">Compare PE, coextruded and barrier-laminate tube directions by formula, product-contact construction, opening, cap, filling route, fill-end seal, decoration and packed distribution.</p>'
    },
    {
      from: '<a class="btn" href="/products/product-index/">Browse Cosmetic Tubes Manufacturer</a><a class="btn alt" href="/contact/">Request Quote</a>',
      to: '<a class="btn" href="#tube-route-title">Compare Tube Routes</a><a class="btn alt" data-inquiry-type="quote" data-inquiry-location="cosmetic-tubes-hero" href="/contact/">Build a Cosmetic Tube RFQ</a>'
    },
    {
      from: '<div class="hero-img"><img src="/assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg" width="1659" height="948" alt="Cosmetic Tubes Manufacturer product packaging collection" decoding="async" fetchpriority="high"></div>',
      to: '<div class="hero-img"><picture><source type="image/avif" srcset="/assets/brand/cosmetic-tubes-complete-product-assortment-2026-640.avif 640w, /assets/brand/cosmetic-tubes-complete-product-assortment-2026-1280.avif 1280w" sizes="(max-width:760px) calc(100vw - 48px), 420px"><img src="/assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg" width="1659" height="948" alt="Cosmetic tube packaging formats arranged for construction comparison" decoding="async" fetchpriority="high"></picture></div>'
    },
    {
      from: '<h2>What We Supply</h2><p>Cosmetic Tubes Manufacturer options include stock and custom formats for skincare, fragrance, makeup, hair care, body care and sample programs.</p>',
      to: '<h2>Formats to Compare</h2><p>Catalog directions include PE, coextruded, barrier-laminate, precision-nozzle and selected formed-aluminum tube formats. Current construction, cap, decoration and sample availability must be confirmed for the selected formula, filling route and project.</p>'
    },
    {
      from: '<h2>Best For</h2><p>Cosmetic Tubes Manufacturer is commonly selected for cleanser, sunscreen, hand cream, hair masks, pharmacy skincare and travel-size products.</p>',
      to: '<h2>Application Starting Points</h2><p>Possible starting applications include cleanser, sunscreen, hand cream, hair treatment, spot care and travel-size products. Final suitability depends on the exact formula, contact construction, opening, cap, filling and sealing process and packed route.</p>'
    },
    {
      from: '<h3>Customization</h3><p>Logo printing, hot stamping, UV printing, frosting, coating, electroplating, laser engraving, color matching and custom boxes are available.</p>',
      to: '<h3>Decoration Questions</h3><p>Possible decoration routes depend on the tube substrate, layer structure, curve, seam, fill-end seal area and handling exposure. Confirm artwork, color reference, distortion allowance, eye mark, adhesion or rub checks and production-intent proofing for the selected construction.</p>'
    },
    {
      from: '<h3>What cosmetic tubes do you manufacture?</h3><p>Cosmetic tubes include PE squeeze tubes, ABL barrier tubes, EVOH high-barrier tubes, bio-PE tubes, aluminum squeeze tubes, lip gloss tubes, paperboard lip balm tubes, sunscreen tubes and hand cream tubes.</p>',
      to: '<h3>What cosmetic tube formats can a buyer compare?</h3><p>The catalog includes directions for PE, coextruded, barrier-laminate, precision-nozzle and selected formed-aluminum tubes. Current body construction, shoulder, opening, cap, decoration and sample availability must be confirmed for the formula, fill process, quantity, SKU plan and destination.</p>'
    },
    {
      from: '<p>Yes. Stock samples usually take 7-10 working days. Custom samples usually take 15-20 working days.</p>',
      to: '<p>Yes. Sample availability, scope, charges and timing are confirmed after the exact body construction, shoulder, opening, cap, formula or application, decoration and approval goals are defined. A visual stock sample does not replace a production-intent tube used for compatibility, filling and dispensing review.</p>'
    },
    {
      from: '<p>Please share product type, capacity, material, decoration, quantity, destination country and any reference photos or drawings.</p>',
      to: '<p>Share the formula or application, viscosity, fill volume and temperature, barrier or light-protection target, body structure, diameter and length, opening or applicator, cap, fill-end seal, filler equipment, decoration, quantity per SKU, destination, timing, sample goals and reference drawings. Final MOQ, availability and timing are confirmed for the selected configuration.</p>'
    }
  ]
};

if (requestedPath && !Object.hasOwn(enhancements, requestedPath)) {
  throw new Error(`Unknown priority-page target: ${requestedPath}`);
}
const selectedEnhancements = requestedPath
  ? { [requestedPath]: enhancements[requestedPath] }
  : enhancements;

const changedPageDates = new Map();

for (const [relativePath, content] of Object.entries(selectedEnhancements)) {
  const filePath = path.join(rootDir, relativePath);
  let source = fs.readFileSync(filePath, 'utf8');
  const originalSource = source;
  const block = `${startMarker}${content}${endMarker}`;
  const existingPattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
  if (existingPattern.test(source)) {
    source = source.replace(existingPattern, block);
  } else if (source.includes(insertionPoint)) {
    source = source.replace(insertionPoint, `${block}${insertionPoint}`);
  } else {
    throw new Error(`Insertion point not found in ${relativePath}`);
  }
  for (const replacement of pageReplacements[relativePath] ?? []) {
    const possibleSources = Array.isArray(replacement.from) ? replacement.from : [replacement.from];
    const matchedSource = possibleSources.find(candidate => source.includes(candidate));
    if (matchedSource) {
      source = replacement.all
        ? source.replaceAll(matchedSource, replacement.to)
        : source.replace(matchedSource, replacement.to);
    } else if (!source.includes(replacement.to)) {
      throw new Error(`Supporting content not found in ${relativePath}: ${possibleSources[0].slice(0, 100)}`);
    }
  }
  if (source !== originalSource) {
    if (!requestedDate) throw new Error(`Content changed in ${relativePath}; pass --date=YYYY-MM-DD to record the update truthfully.`);
    source = source.replace(/"dateModified"\s*:\s*"\d{4}-\d{2}-\d{2}"/, `"dateModified":"${requestedDate}"`);
    changedPageDates.set(relativePath, requestedDate);
  }
  fs.writeFileSync(filePath, source);
}

const sitemapPath = path.join(rootDir, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
for (const [relativePath, modifiedDate] of changedPageDates) {
  const publicPath = `/${relativePath.replace(/index\.html$/, '')}`;
  const escapedUrl = `https://www.glorystarpack.com${publicPath}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entryPattern = new RegExp(`(<loc>${escapedUrl}<\\/loc>\\s*<lastmod>)\\d{4}-\\d{2}-\\d{2}(<\\/lastmod>)`);
  if (!entryPattern.test(sitemap)) throw new Error(`Sitemap entry not found for ${publicPath}`);
  sitemap = sitemap.replace(entryPattern, `$1${modifiedDate}$2`);
}
fs.writeFileSync(sitemapPath, sitemap);

console.log(`Processed ${Object.keys(selectedEnhancements).length} priority pages and refreshed ${changedPageDates.size} changed sitemap entries.`);
