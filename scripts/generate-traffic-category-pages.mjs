import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.glorystarpack.com';
const lastmod = '2026-09-11';

const pages = [
  {
    route: '/products/sunscreen-tube-packaging/',
    title: 'Sunscreen Tube Packaging | SPF Packaging Supplier',
    heading: 'Sunscreen Tube & Stick Packaging',
    description: 'Source sunscreen tubes, sticks and pump formats with formula, filling, dose, barrier, decoration and compatibility questions defined before sampling.',
    image: '/assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg',
    imageWidth: 1659,
    imageHeight: 948,
    imageAlt: 'Sunscreen tubes and cosmetic packaging formats',
    eyebrow: 'Sun care packaging',
    intro: 'Sunscreen packaging has to protect a high-use formula while making the dose and application easy to understand. This format hub helps SPF brands compare tubes, sticks and pump packs before a sample request or RFQ.',
    answer: 'The right sunscreen tube packaging depends on formula viscosity, target dose, fill temperature, barrier needs, label area and how the consumer applies the product. A squeeze tube suits creams and lotions; a stick pack supports direct application; a pump or airless format can improve controlled dispensing for fluid formulas.',
    rows: [
      ['Squeeze tubes', 'Creams, lotions and travel sun care', 'Confirm shoulder, nozzle, seal and label panel against the filling line.', '/products/cosmetic-tubes/', 'Cosmetic tubes'],
      ['Sunscreen sticks', 'Direct face, lip and spot application', 'Review twist-up mechanism, wiper, dose and formula release at different temperatures.', '/products/cosmetic-tubes/', 'Tube and stick formats'],
      ['Pump or airless packs', 'Fluid, serum-like or sensitive formulas', 'Check dose consistency, priming, evacuation and compatibility with the formula.', '/products/airless-pump-bottles/', 'Airless pump bottles']
    ],
    bullets: [
      'Formula contact layer, viscosity and fill temperature',
      'Target dose, actuator feel and one-hand application',
      'Barrier, light exposure and compatibility test plan',
      'Label area, decoration, batch coding and retail presentation',
      'MOQ, sample timing, destination and export packing'
    ],
    buyer: 'For a comparable quote, send the SPF product type, fill volume, formula notes, target dose, tube or stick preference, decoration, annual or initial quantity and destination. If the formula is still being finalized, state the expected viscosity and active ingredients so the component shortlist can remain practical.',
    related: [
      ['/sunscreen-packaging-guide/', 'SPF packaging buyer guide'],
      ['/products/cosmetic-tubes/', 'Cosmetic tubes'],
      ['/products/airless-pump-bottles/', 'Airless pump bottles'],
      ['/insights/cosmetic-packaging-compatibility-testing-guide/', 'Compatibility testing guide']
    ]
  },
  {
    route: '/products/cosmetic-paper-packaging/',
    title: 'Cosmetic Paper Packaging | Boxes, Tubes & Kits',
    heading: 'Cosmetic Paper Packaging',
    description: 'Compare cosmetic paper packaging including folding cartons, paper tubes, molded pulp inserts and retail kits by structure, finish and packing needs.',
    image: '/assets/brand/paper-eco-complete-product-assortment-2026-480.avif',
    imageWidth: 480,
    imageHeight: 320,
    imageAlt: 'Paper and molded pulp cosmetic packaging collection',
    eyebrow: 'Paper and pulp formats',
    intro: 'Paper packaging can carry the visual story of a beauty product while protecting the primary container through fulfillment and retail handling. Use this page to compare cartons, paper tubes, inserts and coordinated kits.',
    answer: 'Cosmetic paper packaging should be selected as a system: primary container dimensions, carton structure, insert protection, finish, artwork and export carton all affect cost and performance. A folding carton is efficient for a bottle or jar, while molded pulp or paperboard inserts help control movement in gift and ecommerce packs.',
    rows: [
      ['Folding cartons', 'Bottles, jars, tubes and single-SKU retail packs', 'Confirm board grade, auto-bottom or tuck-end structure, print coverage and inner fit.', '/products/cosmetic-packaging-kits/', 'Cosmetic packaging kits'],
      ['Paper tubes', 'Balms, solid care, candles and giftable formats', 'Review diameter, wall construction, lining, shoulder and end-cap assembly.', '/products/cosmetic-tubes/', 'Packaging tubes'],
      ['Molded pulp inserts', 'Gift sets, fragile bottles and lower-plastic presentations', 'Define cavity geometry, compression points, surface finish and carton tolerance.', '/insights/molded-pulp-gift-box-inserts/', 'Molded pulp insert guide']
    ],
    bullets: [
      'Primary pack dimensions and clearance inside the carton',
      'Board or pulp specification, strength and moisture exposure',
      'Print process, color targets, coating and tactile finish',
      'Insert retention, drop protection and unboxing sequence',
      'Flat-pack efficiency, MOQ and export carton configuration'
    ],
    buyer: 'A paper-packaging RFQ is faster to compare when it includes the primary container drawing or sample, finished carton dimensions, artwork status, board preference, insert requirement, order quantity and shipping destination. Share whether the pack is for retail shelves, ecommerce fulfillment, a launch kit or a gift set.',
    related: [
      ['/custom-cosmetic-packaging/', 'Custom cosmetic packaging'],
      ['/products/cosmetic-packaging-kits/', 'Cosmetic packaging kits'],
      ['/products/eco-friendly-packaging/', 'Sustainable packaging'],
      ['/insights/molded-pulp-gift-box-inserts/', 'Molded pulp insert guide']
    ]
  },
  {
    route: '/products/paper-boxes-retail-kits/',
    title: 'Paper Boxes & Retail Packaging | OEM Supplier',
    heading: 'Paper Boxes & Retail Packaging',
    description: 'Source paper boxes, folding cartons, inserts and cosmetic retail kits with structure, artwork, finish, protection and export packing reviewed together.',
    image: '/assets/brand/oem-retail-export-packing-2026.jpg',
    imageWidth: 1774,
    imageHeight: 887,
    imageAlt: 'Retail paper boxes and export packaging',
    eyebrow: 'Retail presentation',
    intro: 'A retail box is part of the product experience, but it also has to survive packing, transport and shelf handling. This page organizes the decisions that make a paper-box project easier to brief and quote.',
    answer: 'Paper boxes for cosmetics range from simple folding cartons to rigid gift boxes and coordinated retail kits. Select the structure after confirming the bottle or jar footprint, closure height, insert method, artwork panels and expected distribution conditions.',
    rows: [
      ['Folding cartons', 'Efficient single-item retail packaging', 'Use for a defined bottle, jar or tube footprint; confirm board, closure and print panels.', '/products/cosmetic-packaging-kits/', 'Carton and kit options'],
      ['Rigid gift boxes', 'Premium sets and launch presentations', 'Review wrapped board, lid fit, insert retention and unboxing sequence.', '/products/cosmetic-packaging-kits/', 'Giftable packaging kits'],
      ['Retail kits', 'Multiple SKUs, discovery and promotional sets', 'Map each component, cavity, divider and outer-carton quantity before sampling.', '/products/cosmetic-packaging-kits/', 'Retail packaging kits']
    ],
    bullets: [
      'Finished product dimensions and the required clearance',
      'Folding, rigid, drawer, magnetic or sleeve structure',
      'Artwork panels, print method, foil, embossing and coating',
      'Insert material, cavity fit, drop protection and assembly',
      'Master-carton quantity, palletization and destination rules'
    ],
    buyer: 'Send the finished product dimensions, set configuration, box style, quantity per SKU, artwork status and target shelf or ecommerce channel. If a box must coordinate with bottles, jars or tubes, include the primary-pack sample or drawing so the insert is designed around the real component.',
    related: [
      ['/products/cosmetic-paper-packaging/', 'Cosmetic paper packaging'],
      ['/products/cosmetic-packaging-kits/', 'Cosmetic packaging kits'],
      ['/custom-cosmetic-packaging/', 'Custom packaging route'],
      ['/insights/cosmetic-packaging-rfq-guide/', 'Packaging RFQ field guide']
    ]
  },
  {
    route: '/products/mailer-box-packaging/',
    title: 'Mailer Boxes for Product Packaging | OEM Supplier',
    heading: 'Mailer Boxes for Product Packaging',
    description: 'Plan printed mailer boxes for cosmetic and gift shipments with right-sizing, inserts, closure, drop protection, artwork and export packing inputs.',
    image: '/assets/brand/oem-retail-export-packing-2026.jpg',
    imageWidth: 1774,
    imageHeight: 887,
    imageAlt: 'Printed mailer boxes and protective retail packing',
    eyebrow: 'Ecommerce and fulfillment',
    intro: 'Mailer boxes need to balance brand presentation with the realities of parcel handling. The correct size, board strength and insert approach can reduce movement, damage and unnecessary void fill.',
    answer: 'Choose a mailer box after mapping the shipped product, protective insert, accessory count and carrier conditions. A right-sized corrugated mailer can support a single cosmetic pack, while a printed kit box with molded pulp or paperboard inserts is better for multi-item launches and gift sets.',
    rows: [
      ['Single-item mailer', 'One bottle, jar, tube or boxed product', 'Right-size the inner cavity and specify the closure, board strength and drop test target.', '/products/cosmetic-paper-packaging/', 'Paper packaging'],
      ['Multi-item mailer', 'Discovery sets, subscriptions and launch kits', 'Use dividers or inserts to separate SKUs and keep closures from contacting the box wall.', '/products/cosmetic-packaging-kits/', 'Packaging kits'],
      ['Protective insert', 'Fragile glass or premium presentations', 'Define cavity tolerance, compression points, assembly and recyclable-material goals.', '/insights/molded-pulp-gift-box-inserts/', 'Pulp insert planning']
    ],
    bullets: [
      'Product and accessory dimensions in shipping orientation',
      'Board grade, flute, edge crush and stacking expectations',
      'Insert geometry, friction fit and drop protection',
      'Exterior print, labels, tape, seals and opening experience',
      'Carrier route, master carton, pallet and destination requirements'
    ],
    buyer: 'For a mailer-box quotation, share the packed product dimensions, item count, insert preference, monthly or launch quantity, artwork status and delivery destination. Mention whether the box will ship directly to consumers, travel inside a master carton or be displayed as a retail-ready unit.',
    related: [
      ['/products/cosmetic-paper-packaging/', 'Cosmetic paper packaging'],
      ['/products/paper-boxes-retail-kits/', 'Paper boxes and retail kits'],
      ['/products/cosmetic-packaging-kits/', 'Packaging kits'],
      ['/insights/molded-pulp-gift-box-inserts/', 'Insert protection guide']
    ]
  },
  {
    route: '/products/gift-box-packaging/',
    title: 'Cosmetic Gift Boxes & Packaging Kits | OEM Supplier',
    heading: 'Cosmetic Gift Boxes & Packaging Kits',
    description: 'Build cosmetic gift boxes and packaging kits with fitted inserts, coordinated bottles, jars, tubes, decoration and retail-ready export packing.',
    image: '/assets/brand/travel-sample-complete-product-assortment-2026.jpg',
    imageWidth: 1536,
    imageHeight: 1024,
    imageAlt: 'Cosmetic gift packaging and sample set collection',
    eyebrow: 'Gift sets and launches',
    intro: 'Gift packaging is a coordinated system of primary packs, secondary structure and the moment a customer opens the box. Plan the set around the product family, protection requirements and the story the retail presentation needs to tell.',
    answer: 'Cosmetic gift boxes work best when the bottle, jar, tube, closure and insert are developed together. Use a folding carton for efficient retail distribution, a rigid box for a premium launch, or a fitted molded-pulp insert when the set includes fragile glass or several different shapes.',
    rows: [
      ['Rigid gift box', 'Premium fragrance, skincare and launch sets', 'Confirm lid fit, wrapped-board finish, insert retention and packed weight.', '/products/perfume-bottles/', 'Perfume bottle options'],
      ['Folding gift carton', 'Retail-ready seasonal and promotional sets', 'Review board, print coverage, divider layout and line-side assembly.', '/products/cosmetic-packaging-kits/', 'Cosmetic kits'],
      ['Discovery set', 'Mini bottles, samples and trial routines', 'Map each SKU, vial, card, tray and refill step before box sampling.', '/products/perfume-bottles/', 'Mini and perfume formats']
    ],
    bullets: [
      'SKU count, component dimensions and product-family hierarchy',
      'Box opening style, tray or insert architecture and retention',
      'Print, foil, embossing, coating and tactile brand cues',
      'Drop, abrasion and transport protection for glass components',
      'Assembly, pack-out, master carton and launch timing'
    ],
    buyer: 'Include the complete set list, component drawings or samples, desired box style, insert material, decoration, quantity per SKU, launch date and destination. When the gift set is still being designed, define which parts are fixed and which can be adjusted to improve fit, cost or transport protection.',
    related: [
      ['/products/cosmetic-paper-packaging/', 'Cosmetic paper packaging'],
      ['/products/cosmetic-packaging-kits/', 'Cosmetic packaging kits'],
      ['/products/perfume-bottles/', 'Perfume bottles'],
      ['/insights/molded-pulp-gift-box-inserts/', 'Molded pulp gift inserts']
    ]
  },
  {
    route: '/products/plastic-pump-bottles/',
    title: 'Plastic Pump Bottles | Lotion, Foam & Treatment',
    heading: 'Plastic Pump Bottles for Lotion, Foam & Treatment',
    description: 'Compare plastic pump bottles for lotion, foam and treatment formulas by resin, dose, actuator, dip tube, filling and compatibility requirements.',
    image: '/assets/brand/skincare-packaging-application-2026.jpg',
    imageWidth: 1820,
    imageHeight: 864,
    imageAlt: 'Plastic pump bottles for skincare and personal care',
    eyebrow: 'Dispensing systems',
    intro: 'A pump bottle is both a container and a dosing mechanism. The bottle resin, neck finish, pump output, dip tube and formula behavior all need to work together for a reliable user experience.',
    answer: 'Select a plastic pump bottle by formula viscosity, target dose, pump output, lock mechanism, bottle resin and filling process. Lotion pumps suit creams and body care; foamer pumps need a compatible low-viscosity formula; treatment pumps should be reviewed for dose repeatability and priming.',
    rows: [
      ['Lotion pump bottles', 'Body lotion, shampoo and liquid cleanser', 'Confirm output, dip-tube length, neck finish, lock and formula viscosity.', '/products/personal-care-packaging/', 'Personal-care packaging'],
      ['Foamer bottles', 'Low-viscosity washes and foaming formulas', 'Review mesh or foamer engine, output, priming and formula dilution.', '/products/refillable-foam-pump-bottle-family-p293/', 'Foamer bottle family'],
      ['Treatment pumps', 'Serums, active skincare and controlled doses', 'Test dose, actuator feel, evacuation, leakage and formula compatibility.', '/products/airless-pump-bottles/', 'Airless pump bottles']
    ],
    bullets: [
      'Resin choice such as PET, HDPE, PP or PCR blend',
      'Pump output, dose repeatability, lock and actuator feel',
      'Dip-tube length, shoulder clearance and filling-line fit',
      'Formula compatibility, leakage, priming and evacuation',
      'Decoration, label panel, MOQ and component availability'
    ],
    buyer: 'A pump-bottle RFQ should include formula viscosity, target dose, fill volume, resin preference, closure or pump style, decoration, quantity and destination. For foaming or active formulas, include testing conditions and the expected number of pumps per use so the component recommendation is grounded in the actual application.',
    related: [
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/products/airless-pump-bottles/', 'Airless pump bottles'],
      ['/products/cosmetic-pumps-closures/', 'Pumps and closures'],
      ['/insights/cosmetic-pump-not-working-troubleshooting/', 'Pump troubleshooting']
    ]
  },
  {
    route: '/products/plastic-travel-packaging/',
    title: 'Travel Size Cosmetic Packaging | Bottles & Kits',
    heading: 'Travel Size Cosmetic Packaging',
    description: 'Source travel size cosmetic packaging including mini bottles, sample kits, refill formats and closures with leak, dose and packing checks.',
    image: '/assets/brand/travel-sample-complete-product-assortment-2026.jpg',
    imageWidth: 1536,
    imageHeight: 1024,
    imageAlt: 'Travel size cosmetic bottles and sample packaging',
    eyebrow: 'Travel and sample formats',
    intro: 'Travel and discovery packaging has less room for error: a small leak can damage a kit, while an inconsistent dose can undermine a trial experience. Compare the primary pack, closure and outer presentation as one project.',
    answer: 'Travel size cosmetic packaging should be selected by fill volume, formula, leak risk, dispensing method and use environment. Mini bottles and tubes work for liquids and creams, while sample kits can combine several formats with a fitted tray, pouch or small retail box.',
    rows: [
      ['Mini bottles', 'Hotel amenities, trial liquids and travel routines', 'Check neck finish, closure seal, fill tolerance and leak testing.', '/products/hotel-amenity-packaging/', 'Hotel amenity packaging'],
      ['Mini tubes', 'Creams, sunscreen and single-use applications', 'Review nozzle, seal, label area, squeeze force and dose.', '/products/cosmetic-tubes/', 'Cosmetic tubes'],
      ['Sample kits', 'Discovery sets, subscriptions and launch seeding', 'Map each SKU, card, insert, pouch and outer box for pack-out.', '/products/cosmetic-packaging-kits/', 'Sample and kit planning']
    ],
    bullets: [
      'Fill volume, product density and expected uses per pack',
      'Closure seal, tamper evidence, leak test and transport orientation',
      'Mini pump, flip-top, screw cap, dropper or tube nozzle choice',
      'Label readability, decoration and regulatory copy area',
      'Kit assembly, pouch or carton, master carton and destination'
    ],
    buyer: 'Send the formula type, fill volume, number of units per kit, closure preference, leak-test expectation, artwork status, order quantity and destination. If the pack is for airline, hotel, subscription or sampling use, state the handling environment and whether refill or recycling messaging is part of the brief.',
    related: [
      ['/products/hotel-amenity-packaging/', 'Hotel amenity packaging'],
      ['/products/cosmetic-tubes/', 'Cosmetic tubes'],
      ['/products/cosmetic-packaging-kits/', 'Cosmetic packaging kits'],
      ['/insights/travel-size-cosmetic-packaging-leak-testing-guide/', 'Travel-pack leak testing']
    ]
  },
  {
    route: '/products/plastic-lotion-bottles/',
    title: 'Plastic Lotion Bottles | PET, HDPE & PCR',
    heading: 'Plastic Lotion Bottles: PET, HDPE & PCR',
    description: 'Compare PET, HDPE and PCR plastic lotion bottles by formula, stiffness, dispensing, decoration, recycled content and filling-line requirements.',
    image: '/assets/brand/plastic-complete-product-assortment-2026.jpg',
    imageWidth: 1774,
    imageHeight: 887,
    imageAlt: 'Plastic lotion bottles and personal care packaging',
    eyebrow: 'Body care containers',
    intro: 'Plastic lotion bottles give body-care brands a wide range of shapes, resin choices and dispensing options. The selection should balance squeeze or rigid-wall feel, formula compatibility, recycled-content goals and the realities of production.',
    answer: 'PET is often chosen for clarity and a clean shelf appearance, HDPE for a more opaque and durable bottle, and PCR blends when recycled content is part of the brief. Pump, disc-top and flip-top closures then determine dose, usability and line compatibility.',
    rows: [
      ['PET lotion bottles', 'Clear or translucent lotions and washes', 'Review clarity, stress cracking, formula contact and decoration area.', '/products/personal-care-packaging/', 'Personal-care packaging'],
      ['HDPE lotion bottles', 'Opaque body care, shampoo and cleanser', 'Confirm wall stiffness, squeeze feel, closure torque and label panel.', '/products/personal-care-packaging/', 'HDPE-compatible programs'],
      ['PCR bottles', 'Brands with recycled-content targets', 'Define PCR percentage, color tolerance, odor review and test plan.', '/insights/pcr-hdpe-personal-care-bottles/', 'PCR HDPE bottle guide']
    ],
    bullets: [
      'Resin, opacity, stiffness and squeeze or rigid-wall behavior',
      'Formula compatibility, stress cracking and temperature exposure',
      'Pump, disc-top or flip-top output and closure torque',
      'PCR percentage, color variation, odor and supply consistency',
      'Label, screen print, sleeve, MOQ and export packing'
    ],
    buyer: 'For a lotion-bottle quote, provide formula viscosity, fill volume, resin or PCR target, closure preference, dose, decoration, quantity and destination. If the bottle will run on an existing filling line, include the neck finish and line constraints so the recommended format can be checked early.',
    related: [
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/products/plastic-pump-bottles/', 'Plastic pump bottles'],
      ['/insights/pcr-hdpe-personal-care-bottles/', 'PCR HDPE guide'],
      ['/products/cosmetic-jars/', 'Cosmetic jars']
    ]
  },
  {
    route: '/products/spa-body-care-packaging/',
    title: 'Spa & Body Care Packaging | Bottles, Jars & Tubes',
    heading: 'Spa & Body Care Packaging',
    description: 'Plan spa and body care packaging with bottles, jars, tubes, pumps and refill options matched to formula, dose, use setting and decoration.',
    image: '/assets/brand/skincare-packaging-application-2026.jpg',
    imageWidth: 1820,
    imageHeight: 864,
    imageAlt: 'Spa and body care packaging collection',
    eyebrow: 'Spa and personal care',
    intro: 'Spa packaging needs to feel calm and premium while staying practical in wet, high-touch environments. The bottle, pump, jar, tube or refill pack should be selected around formula, dose, grip and the way staff or guests use it.',
    answer: 'Choose spa and body care packaging by product type, viscosity, use setting and replenishment model. Pump bottles suit lotions and washes, jars suit creams and scrubs, tubes suit targeted application, and refill pouches or bulk systems can support lower-waste operations.',
    rows: [
      ['Pump bottles', 'Lotion, shampoo, wash and treatment', 'Confirm one-hand use, pump lock, dose and compatibility with wet-room handling.', '/products/plastic-pump-bottles/', 'Plastic pump bottles'],
      ['Jars and tubes', 'Scrubs, masks, creams and targeted care', 'Review opening, scoop or squeeze experience, seal and label area.', '/products/cosmetic-tubes/', 'Tubes and application formats'],
      ['Refill formats', 'Spa back-bar, hotel and repeat-use programs', 'Map refill frequency, connection, storage, labeling and transport.', '/products/refill-pouch-packaging/', 'Refill pouch packaging']
    ],
    bullets: [
      'Wet-hand grip, dispensing force and one-hand operation',
      'Formula viscosity, active ingredients and contact-layer review',
      'Pump output, jar opening, tube nozzle and tamper evidence',
      'Water exposure, cleaning, refill frequency and back-bar handling',
      'Decoration, label durability, MOQ and destination compliance'
    ],
    buyer: 'Share the formula, fill volume, use setting, expected dose, closure preference, decoration, refill goal, quantity and destination. A spa or hotel project should also state whether the package is guest-facing, staff-refilled or installed in a dispenser system.',
    related: [
      ['/products/personal-care-packaging/', 'Personal-care packaging'],
      ['/products/plastic-pump-bottles/', 'Plastic pump bottles'],
      ['/products/cosmetic-tubes/', 'Cosmetic tubes'],
      ['/products/refill-pouch-packaging/', 'Refill pouch packaging']
    ]
  },
  {
    route: '/products/candle-packaging/',
    title: 'Candle Packaging | Jars, Tins & Retail Boxes',
    heading: 'Candle Packaging: Jars, Tins & Retail Boxes',
    description: 'Source candle packaging in glass jars, aluminum tins and retail boxes with wax, wick, heat, decoration, insert and shipping requirements reviewed.',
    image: '/assets/brand/fragrance-packaging-collection-2026.jpg',
    imageWidth: 1448,
    imageHeight: 1086,
    imageAlt: 'Candle and home fragrance packaging collection',
    eyebrow: 'Home fragrance packaging',
    intro: 'Candle packaging has to look distinctive on the shelf and remain dependable through wax filling, curing, burning and shipment. Container, lid, label, insert and outer box should be reviewed as a complete system.',
    answer: 'Glass candle jars suit premium presentation and a visible wax fill, while aluminum tins can support lightweight travel or gift formats. The choice should account for wax type, fill temperature, wick placement, vessel dimensions, lid fit, decoration and shipping protection.',
    rows: [
      ['Glass candle jars', 'Premium candles and visible wax presentations', 'Confirm vessel dimensions, heat behavior, lid, label panel and packing protection.', '/products/home-fragrance-packaging/', 'Home fragrance packaging'],
      ['Aluminum candle tins', 'Travel candles, gift sets and lightweight formats', 'Review internal coating, lid fit, heat use, decoration and stacking.', '/products/aluminum-packaging/', 'Aluminum packaging'],
      ['Retail boxes', 'Shelf-ready, ecommerce and seasonal presentation', 'Define insert, drop protection, artwork and master-carton configuration.', '/products/paper-boxes-retail-kits/', 'Paper boxes and kits']
    ],
    bullets: [
      'Wax type, fill temperature, vessel geometry and wick system',
      'Heat-use review, lid clearance and label or print area',
      'Glass, tin or mixed-material construction and coating',
      'Insert protection, drop testing and parcel-shipping exposure',
      'Decoration, seasonal SKU mix, MOQ and export packing'
    ],
    buyer: 'For a candle-packaging RFQ, send wax type, vessel size, fill weight, wick and lid details, decoration, quantity, box or insert requirement and destination. Include any burn-test or transport constraints so the vessel and secondary pack can be assessed together.',
    related: [
      ['/products/home-fragrance-packaging/', 'Home fragrance packaging'],
      ['/products/aluminum-packaging/', 'Aluminum packaging'],
      ['/products/paper-boxes-retail-kits/', 'Paper boxes and kits'],
      ['/insights/molded-pulp-gift-box-inserts/', 'Insert protection guide']
    ]
  }
];

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const pagePath = page => path.join(root, page.route.replace(/^\//, ''), 'index.html');
const renderLinks = links => links.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('');
const renderRows = rows => rows.map(([format, use, checks, href, label]) => `<tr><th scope="row">${escapeHtml(format)}</th><td>${escapeHtml(use)}</td><td>${escapeHtml(checks)} <a href="${href}">${escapeHtml(label)}</a></td></tr>`).join('');

function renderPage(page) {
  const canonical = `${site}${page.route}`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: page.title,
        description: page.description,
        image: `${site}${page.image}`,
        inLanguage: 'en',
        isPartOf: { '@id': `${site}/#website` },
        breadcrumb: { '@id': `${canonical}#breadcrumbs` }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/` },
          { '@type': 'ListItem', position: 2, name: 'Products', item: `${site}/products/product-index/` },
          { '@type': 'ListItem', position: 3, name: page.heading, item: canonical }
        ]
      }
    ]
  };
  return `<!doctype html><html lang="en"><head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NYY1MTZ6HM"></script>
<script>window.dataLayer = window.dataLayer || []; window.gtag = window.gtag || function(){window.dataLayer.push(arguments);}; window.gtag('js', new Date()); window.gtag('config', 'G-NYY1MTZ6HM');</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(page.title)}</title><meta name="description" content="${escapeHtml(page.description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="GloryStarPack"><meta property="og:image" content="${site}${page.image}"><meta property="og:image:alt" content="${escapeHtml(page.imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(page.title)}"><meta name="twitter:description" content="${escapeHtml(page.description)}"><meta name="twitter:image" content="${site}${page.image}"><meta name="gsp-brand-fonts" data-font-strategy="system" content="Use system fonts for the first paint; brand fonts remain optional enhancements.">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<link rel="stylesheet" href="/assets/css/site-shell.css?v=20260829-1"><link rel="stylesheet" href="/assets/css/inquiry-conversion.css"><link rel="icon" href="/assets/brand/glorystarpack-logo-favicon-2026.png?v=20260906" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/assets/brand/glorystarpack-logo-favicon-2026.png" sizes="192x192">
<style>
:root{--traffic-ink:#1a1a1a;--traffic-muted:#667085;--traffic-gold:#8a6c34;--traffic-border:#e6e1d8;--traffic-surface:#fffaf4;--traffic-bg:#f7f5f0}.traffic-page{background:var(--traffic-bg);color:var(--traffic-ink);font-family:Arial,Helvetica,sans-serif;line-height:1.65}.traffic-wrap{max-width:1160px;margin:0 auto;padding:38px 24px}.traffic-hero{background:#fff;border-bottom:1px solid var(--traffic-border)}.traffic-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:42px;align-items:center}.traffic-eyebrow{margin:0 0 12px;color:var(--traffic-gold);font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.traffic-page h1{max-width:760px;margin:0 0 16px;font-size:clamp(36px,5vw,58px);line-height:1.07;letter-spacing:-.025em}.traffic-lead{max-width:760px;margin:0 0 26px;color:var(--traffic-muted);font-size:18px}.traffic-actions{display:flex;flex-wrap:wrap;gap:12px}.traffic-button{display:inline-block;padding:12px 18px;border:1px solid var(--traffic-gold);border-radius:6px;background:var(--traffic-gold);color:#fff;text-decoration:none;font-weight:700}.traffic-button.secondary{background:#fff;color:var(--traffic-ink);border-color:var(--traffic-border)}.traffic-hero-image{overflow:hidden;border:1px solid var(--traffic-border);border-radius:14px;background:#eee;box-shadow:0 18px 42px rgba(30,25,16,.11)}.traffic-hero-image img{display:block;width:100%;height:320px;object-fit:cover}.traffic-section{margin-top:26px}.traffic-grid{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(260px,.82fr);gap:24px}.traffic-card{height:100%;padding:26px;border:1px solid var(--traffic-border);border-radius:12px;background:#fff}.traffic-page h2{margin:0 0 13px;font-size:29px;line-height:1.18}.traffic-page h3{margin:0 0 8px;font-size:18px}.traffic-page p{margin:0 0 15px}.traffic-page ul{margin:0;padding-left:21px}.traffic-table-wrap{overflow-x:auto;border:1px solid var(--traffic-border);border-radius:10px;background:#fff}.traffic-table{width:100%;min-width:760px;border-collapse:collapse}.traffic-table caption{padding:13px 15px;text-align:left;background:var(--traffic-surface);font-weight:700}.traffic-table th,.traffic-table td{padding:13px 15px;border-top:1px solid var(--traffic-border);text-align:left;vertical-align:top}.traffic-table th{width:19%;color:var(--traffic-ink)}.traffic-table a,.traffic-card a{color:#6b5429;font-weight:700}.traffic-rfq{background:var(--traffic-surface)}.traffic-links{display:flex;flex-wrap:wrap;gap:10px;margin:0;padding:0;list-style:none}.traffic-links a{display:inline-block;padding:10px 13px;border:1px solid var(--traffic-border);border-radius:7px;background:#fff;color:#604b28;text-decoration:none;font-weight:700}.traffic-footer{padding:26px 24px 42px;border-top:1px solid var(--traffic-border);color:var(--traffic-muted);font-size:13px}.traffic-footer-inner{max-width:1160px;margin:0 auto;display:flex;justify-content:space-between;gap:20px}.traffic-footer a{color:#604b28}@media(max-width:780px){.traffic-hero-grid,.traffic-grid{display:block}.traffic-hero-image{margin-top:26px}.traffic-hero-image img{height:240px}.traffic-wrap{padding:30px 18px}.traffic-page h1{font-size:38px}.traffic-footer-inner{display:block}.traffic-footer-inner span{display:block;margin-top:8px}}
</style><script src="/assets/js/site-shell-navigation.js?v=20260829-1" defer></script></head><body class="traffic-page">
<header class="site-header gsp-site-header"><a class="gsp-skip-link" href="#main-content">Skip to main content</a><div class="gsp-header-inner"><a class="gsp-brand" href="/" aria-label="GloryStarPack home"><img src="/assets/brand/glorystarpack-logo-mark-96-2026.png" width="96" height="96" alt="" decoding="async"><span class="gsp-brand-copy"><strong>GLORYSTARPACK</strong><small>Custom Bottles &amp; Packaging</small></span></a><nav class="gsp-primary-nav" aria-label="Primary navigation"><a href="/products/product-index/">Products</a><a href="/cosmetic-packaging-guides/">Buyer Guides</a><a href="/about/">About</a></nav><a class="gsp-header-cta" href="/contact/">Request a Quote</a></div></header>
<nav class="gsp-breadcrumbs" id="breadcrumbs" aria-label="Breadcrumb"><div class="gsp-breadcrumbs-inner"><a href="/">Home</a><span class="gsp-breadcrumb-separator" aria-hidden="true">/</span><a href="/products/product-index/">Products</a><span class="gsp-breadcrumb-separator" aria-hidden="true">/</span><span aria-current="page">${escapeHtml(page.heading)}</span></div></nav>
<div class="gsp-main-anchor" id="main-content" tabindex="-1"></div><div class="gsp-main-landmark" role="main"><section class="traffic-hero"><div class="traffic-wrap traffic-hero-grid"><div><p class="traffic-eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.heading)}</h1><p class="traffic-lead">${escapeHtml(page.intro)}</p><div class="traffic-actions"><a class="traffic-button" href="/contact/" data-inquiry-type="quote">Request a Packaging Quote</a><a class="traffic-button secondary" href="/products/product-index/">Browse All Products</a></div></div><div class="traffic-hero-image"><img src="${page.image}" width="${page.imageWidth}" height="${page.imageHeight}" alt="${escapeHtml(page.imageAlt)}" decoding="async" fetchpriority="high"></div></div></section>
<div class="traffic-wrap"><section class="traffic-section traffic-grid"><article class="traffic-card"><h2>How to choose the format</h2><p>${escapeHtml(page.answer)}</p><p>When a project has more than one viable route, compare the component, closure, decoration and shipping assumptions together. A short, production-intent sample brief usually creates a better decision than choosing a container from a product photo alone.</p></article><aside class="traffic-card"><h2>RFQ checklist</h2><ul>${page.bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></aside></section>
<section class="traffic-section"><div class="traffic-card"><h2>Packaging routes to compare</h2><div class="traffic-table-wrap"><table class="traffic-table"><caption>Format, application and early approval checks</caption><thead><tr><th scope="col">Format</th><th scope="col">Typical use</th><th scope="col">Check before sampling</th></tr></thead><tbody>${renderRows(page.rows)}</tbody></table></div></div></section>
<section class="traffic-section traffic-grid"><article class="traffic-card traffic-rfq"><h2>Make the quote comparable</h2><p>${escapeHtml(page.buyer)}</p><p>Share the brief through the <a href="/contact/" data-inquiry-type="quote">structured RFQ page</a> and include a reference photo or drawing when shape, fit or decoration matters.</p></article><aside class="traffic-card"><h2>Continue researching</h2><ul class="traffic-links">${renderLinks(page.related).replaceAll('<a ', '<li><a ').replaceAll('</a>', '</a></li>')}</ul></aside></section></div></div>
<footer class="site-footer gsp-site-footer traffic-footer"><div class="traffic-footer-inner"><span>© 2026 GloryStarPack. Packaging specifications are confirmed against the selected configuration.</span><span><a href="/products/product-index/">Product Index</a> · <a href="/cosmetic-packaging-guides/">Buyer Guides</a> · <a href="/contact/">Request a Quote</a></span></div></footer><script src="/assets/js/inquiry-conversion.js" defer="defer"></script></body></html>`;
}

for (const page of pages) {
  const file = pagePath(page);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, renderPage(page));
}

const hubLinks = pages.map(page => `<a href="${page.route}">${escapeHtml(page.heading)}</a>`).join('');
const hubSection = `<section class="gsp-theme-cluster" aria-labelledby="traffic-category-hubs-title"><div class="eyebrow">Commercial category hubs</div><h2 id="traffic-category-hubs-title">Browse packaging by high-intent format</h2><p>Use these format hubs to compare materials, dispensing systems, retail structures and project-specific RFQ inputs.</p><nav class="gsp-theme-cluster-links" aria-label="Commercial packaging category hubs">${hubLinks}</nav></section>`;
for (const relative of ['products/product-index/index.html', 'custom-cosmetic-packaging/index.html']) {
  const file = path.join(root, relative);
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes('traffic-category-hubs-title')) {
    const marker = source.includes('</main>') ? '</main>' : '</div><!-- /.gsp-main-landmark -->';
    source = source.replace(marker, `${hubSection}\n${marker}`);
    fs.writeFileSync(file, source);
  }
}

let sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const entries = pages.map(page => `  <url>\n    <loc>${site}${page.route}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.80</priority>\n  </url>`).join('\n');
const sitemapMarker = '<!-- BEGIN GENERATED LOCALIZED PAGES -->';
if (!sitemap.includes(`${site}${pages[0].route}`)) sitemap = sitemap.replace(sitemapMarker, `${entries}\n${sitemapMarker}`);
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
console.log(`Generated ${pages.length} English-first traffic category pages and linked them from two commercial hubs.`);
