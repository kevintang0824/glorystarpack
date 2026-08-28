(() => {
// This compatibility layer is intentionally lazy-loaded by main.js. It keeps
// the historical hash catalog available without charging every homepage visit
// for product filtering, search and detail-rendering code.

// =========================================================== PRODUCT DATA
let PRODS = [];
let productDataPromise = null;

function hasProductData() {
  return Array.isArray(PRODS) && PRODS.length > 0;
}

function syncProductData() {
  if (!hasProductData() && Array.isArray(window.GSP_PRODUCTS)) {
    PRODS = window.GSP_PRODUCTS;
  }
  return hasProductData();
}

function showProductLoading(targetId, text = 'Loading packaging products...') {
  const target = document.getElementById(targetId);
  if (target) target.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px;">${text}</p>`;
}

function showProductDataError(err) {
  console.error('Unable to load product data', err);
  ['products-grid', 'search-grid', 'related-grid'].forEach(id => {
    const target = document.getElementById(id);
    if (target) target.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px;">Product data is temporarily unavailable. Please refresh the page or contact us for a catalog.</p>';
  });
}

function ensureProductData() {
  if (syncProductData()) return Promise.resolve(PRODS);
  if (productDataPromise) return productDataPromise;
  productDataPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-product-data="true"]');
    if (existing) {
      existing.addEventListener('load', () => syncProductData() ? resolve(PRODS) : reject(new Error('Product data did not initialize')), {once:true});
      existing.addEventListener('error', () => reject(new Error('Product data request failed')), {once:true});
      return;
    }
    const script = document.createElement('script');
    script.src = '/assets/js/product-data.js';
    script.async = true;
    script.dataset.productData = 'true';
    script.onload = () => syncProductData() ? resolve(PRODS) : reject(new Error('Product data did not initialize'));
    script.onerror = () => reject(new Error('Product data request failed'));
    document.head.appendChild(script);
  }).catch(err => {
    productDataPromise = null;
    showProductDataError(err);
    throw err;
  });
  return productDataPromise;
}

const STATIC_PAGE_ROUTES = Object.freeze({
  about: '/about/',
  oem: '/oem-cosmetic-packaging/',
  news: '/insights/',
  newsdetail: '/insights/',
  contact: '/contact/'
});
const CAT_TITLES = {hot:'🔥 Hot Picks',glass:'Glass Packaging','glass-oil':'Glass Essential Oil Bottle','glass-dropper':'Glass Dropper Bottle','glass-rollon':'Glass Roll On Bottle','glass-spray':'Glass Spray Bottle','glass-ampoule':'Glass Ampoule & Vial','glass-jar':'Glass Cream Jar','glass-lotion':'Glass Lotion Bottle','glass-perfume':'Glass Perfume Bottle','glass-diffuser':'Glass Diffuser Bottle','glass-violet':'Violet Glass Bottle','glass-nail':'Glass Nail Polish Bottle',beverage:'Beverage Bottle Packaging','wine-bottle':'Wine Bottles','spirit-bottle':'Liquor & Spirit Bottles','beverage-closure':'Beverage Bottle Closures',plastic:'Plastic Packaging','plastic-pump':'Plastic Pump Bottle','plastic-airless':'Airless Bottle','plastic-airless-jar':'Airless Jar','plastic-dual':'Dual Chamber Packaging','plastic-lotion':'Lotion Bottle','plastic-pet':'PET Bottle','plastic-hdpe':'HDPE Bottle','plastic-spray':'Plastic Spray Bottle','plastic-jar':'Plastic Jar','plastic-acrylic':'Acrylic Container','plastic-foam':'Plastic Foam Bottle','plastic-tube':'Plastic Tube','plastic-deodorant':'Deodorant Stick','plastic-makeup':'Makeup Packaging','plastic-travel':'Travel Size Set','plastic-pcr':'PCR & Refill Plastic','plastic-closure':'Pumps, Caps & Accessories','packaging-accessories':'Packaging Accessories','home-fragrance':'Home Fragrance Packaging','spa-body':'Spa & Body Care Packaging','hotel-amenity':'Hotel Amenities & Travel Kits','personal-care':'Personal Care Packaging','men-grooming':'Men’s Grooming Packaging',bamboo:'Bamboo & Wood','bamboo-bottle':'Bamboo Bottles','bamboo-jar':'Bamboo Jars','bamboo-cap':'Bamboo Caps & Lids','bamboo-dropper':'Bamboo Dropper Bottles','bamboo-rollon':'Bamboo Roll On Bottles','bamboo-makeup':'Bamboo Makeup Series',alu:'Aluminum Products','alu-bottle':'Aluminum Bottle','alu-can':'Aluminum Can','alu-tin':'Aluminum Tin','alu-tube':'Aluminum Tube','alu-atomizer':'Aluminum Atomizer','alu-jar':'Aluminum Jar','alu-bag':'Aluminum Bag',eco:'Eco Packaging',bio:'Biodegradable','eco-wheat':'Wheat Straw Packaging','eco-pulp':'Molded Pulp Packaging','eco-refill':'Refill Packaging','paper-tube':'Paper Tube','paper-box':'Paper Boxes & Retail Kits'};

CAT_TITLES['material-glass'] = 'Glass Packaging by Primary Material';
CAT_TITLES['material-plastic'] = 'Plastic Packaging by Primary Material';
CAT_TITLES['material-metal'] = 'Aluminum & Metal Packaging';
CAT_TITLES['material-bamboo-wood'] = 'Bamboo & Wood Packaging';
CAT_TITLES['material-paper-pulp'] = 'Paper & Molded Pulp Packaging';
CAT_TITLES['material-flexible'] = 'Flexible Films & Laminates';
CAT_TITLES['material-bio'] = 'Bio-Based Packaging Materials';
CAT_TITLES['material-mixed'] = 'Mixed-Material Packaging Kits';
CAT_TITLES['beer-bottle'] = 'Glass Beer & Growler Bottles';
CAT_TITLES['glass-decanter'] = 'Glass Decanter & Flask Bottles';
CAT_TITLES['juice-soda-bottle'] = 'Glass Juice & Soda Bottles';
CAT_TITLES['oil-vinegar-bottle'] = 'Glass Oil & Vinegar Bottles';
CAT_TITLES['sauce-syrup-bottle'] = 'Glass Sauce & Syrup Bottles';
CAT_TITLES['glass-food'] = 'Glass Food Bottles & Jars';
CAT_TITLES['food-jar'] = 'Glass Food, Honey & Spice Jars';
CAT_TITLES['glass-apothecary'] = 'Glass Apothecary & Supplement Bottles';
CAT_TITLES.components = 'Pumps, Caps & Components';

const CAT_COPY = {
  hot:['Bestselling Cosmetic Packaging', 'Popular stock and custom packaging options for skincare, fragrance, makeup, hair care and sample programs. These products are commonly selected for fast sampling, proven compatibility and flexible decoration.'],
  'material-glass':['Primary-Material Glass Packaging', 'Glass bottles, jars, vials and primary containers grouped by the material of the main visible pack. This collection includes beverage, fragrance, nail care, serum and skincare glass formats.'],
  'material-plastic':['Primary-Material Plastic Packaging', 'PET, PETG, HDPE, PP, PE, acrylic and other polymer containers grouped by the material of the main visible pack, including pumps, jars, tubes and personal care formats.'],
  'material-metal':['Primary-Material Aluminum and Metal Packaging', 'Aluminum and metal bottles, cans, tins, tubes, atomizers and containers selected when the main visible pack is metal.'],
  'material-bamboo-wood':['Primary-Material Bamboo and Wood Packaging', 'Bamboo and wood-led bottles, jars, compacts and closures where the natural outer shell is the main visible packaging material.'],
  'material-paper-pulp':['Primary-Material Paper and Molded Pulp Packaging', 'Paperboard boxes, kraft tubes, molded pulp inserts and fiber-based packs where paper or pulp forms the main packaging structure.'],
  'material-flexible':['Primary-Material Flexible Packaging', 'Refill pouches, sachets, barrier laminates, flexible tubes, films and sealing materials grouped by their main flexible packaging structure.'],
  'material-bio':['Primary-Material Bio-Based Packaging', 'PLA, Bio-PE, wheat straw and other plant-derived material formats grouped by the main material used for the pack.'],
  'material-mixed':['Mixed-Material Packaging Kits', 'Complete packaging sets, component kits, sample boards and turnkey launch systems that intentionally combine several primary materials.'],
  'beer-bottle':['Glass Beer, Ale and Kombucha Bottle Shapes', 'Explore custom longneck, stubby, Belgian-style, wide-mouth kombucha, growler and crown-finish glass bottle concepts for beer, cider, fermented drinks and carbonated beverage projects. Pressure targets, filling conditions and closure fit are confirmed by project.'],
  'glass-decanter':['Custom Glass Decanters and Flask Bottles', 'Heavy spirit decanters, flat pocket flasks and fluted-neck beverage decanters developed around capacity, closure, decoration, filling process and export packing requirements.'],
  'juice-soda-bottle':['Glass Juice, Dairy and Specialty Beverage Bottles', 'Custom clear and colored glass bottles for juice, milk, mineral water, cold brew, tea, kombucha, soda, tonic water and specialty beverage programs, with crown, lug, ROPP and screw finishes available by project.'],
  'oil-vinegar-bottle':['Glass Oil and Vinegar Bottle Shapes', 'Tall Dorica, square Marasca and curved amphora-style glass bottle concepts for olive oil, vinegar, infused oil, dressing and gourmet food packaging.'],
  'sauce-syrup-bottle':['Glass Sauce and Syrup Bottle Shapes', 'Woozy sauce bottles, handled maple-style bottles and fluted-neck syrup decanters for hot sauce, marinades, dressings, syrup and liquid seasoning packaging.'],
  'glass-food':['Glass Food Bottles and Jars', 'French square, milk, sauce, spice, pantry, honey, jam, straight-sided, vinegar, oil and syrup glass packaging grouped for food and beverage sourcing. Filling temperature, closure, liner and thermal process are confirmed for each project.'],
  'food-jar':['Glass Food, Honey and Spice Jars', 'Paragon spice jars, clamp-lid pantry jars, mini jam jars, round honey jars, square shaker jars, Mason jars and straight-sided wide-mouth food jars for seasonings, preserves, spreads, confectionery and pantry collections.'],
  'glass-apothecary':['Glass Apothecary, Supplement and Wellness Bottles', 'Boston round, French square, amber packer, crimp vial, ointment jar and syrup bottle concepts for supplements, botanical extracts, wellness products and apothecary-inspired packaging. Compliance and closure requirements are confirmed by destination market and product.'],
  components:['Pumps, Caps and Packaging Components', 'Pumps, sprayers, caps, corks, droppers, rollerballs, applicators, liners and matching accessories for glass, plastic, aluminum and mixed-material packaging.'],
  glass:['Glass Cosmetic Packaging Supplier', 'Glass packaging is ideal for premium skincare, perfume, serum, essential oils and formulas that need strong compatibility, high clarity and a luxury hand feel.'],
  'glass-oil':['Glass Essential Oil Bottles', 'Amber, clear and frosted glass dropper bottles, roller bottles and essential oil containers with UV-protective options for aromatherapy and active formulas.'],
  'glass-dropper':['Glass Dropper Bottles', 'Serum dropper bottles, Boston round bottles, child resistant droppers, reducer inserts and pipette bottles for facial oil, retinol, vitamin C serum, essential oil and apothecary-style skincare lines.'],
  'glass-rollon':['Glass Roll On Bottles', 'Portable roll on bottles with steel, glass or plastic rollerballs for perfume oil, essential oil blends, eye serum and travel fragrance packaging.'],
  'glass-spray':['Glass Spray Bottles', 'Fine mist glass spray bottles for toner, facial mist, body splash, home fragrance and premium spa packaging.'],
  'glass-ampoule':['Glass Ampoules and Vials', 'Small glass ampoules, vials and tester bottles for concentrated serum, essential oil samples, beauty boosters and single-dose skincare.'],
  'glass-jar':['Glass Cream Jars', 'Thick-wall glass cream jars, refillable glass jars, solid perfume jars and glass lotion bottles for face cream, eye cream, body butter, masks and premium skincare collections.'],
  'glass-lotion':['Glass Lotion Bottles', 'Glass pump bottles, foundation pump bottles, treatment pump bottles and toner bottles for lotion, essence water, hand wash, body care, hotel amenities and refill-focused spa collections.'],
  'glass-perfume':['Glass Perfume Bottles', 'Square, cylindrical and sculpted oval perfume bottles with fine mist pumps, thick-bottom heavy bases, crimp collars, refill atomizers and custom caps for fragrance, body mist and luxury scent lines.'],
  'glass-diffuser':['Glass Diffuser Bottles', 'Decorative glass diffuser bottles for reed diffuser, aromatherapy, home fragrance and spa retail collections.'],
  'glass-violet':['Violet Glass Bottles', 'Deep violet glass bottles for botanical skincare, essential oils and light-sensitive premium natural formulas.'],
  'glass-nail':['Glass Nail Polish Bottles', 'Clear, square, slim rectangular and UV black glass nail polish bottles with brush caps for gel polish, nail lacquer, cuticle oil, nail treatment and private label manicure collections.'],
  beverage:['Beverage Bottle Packaging Supplier', 'Glass and PET beverage bottles for wine, spirits, ale, kombucha, mineral water, cold brew, juice, syrups and specialty beverage projects, with matched corks, caps, closures, decoration and export cartons.'],
  'wine-bottle':['Wholesale Glass Wine Bottles', 'Bordeaux, Burgundy, rosé, fortified, sparkling, Hock and mini wine bottles in clear, amber and green glass, with cork, BVS, ROPP and crown closure options for private label beverage brands.'],
  'spirit-bottle':['Liquor and Spirit Bottles', 'Heavy-base whiskey bottles, tall grappa and liqueur bottles, oval flasks, vodka bottles, rounded gin bottles, amber craft spirit bottles and mini liquor bottles with bar-top, screw-cap and tamper-evident closure options.'],
  'beverage-closure':['Beverage Bottle Corks and Closures', 'Bar-top corks, ROPP caps, crown closures, swing-top systems, liners and tamper components matched to wine, spirit and specialty beverage bottle neck finishes.'],
  plastic:['Plastic Cosmetic Packaging Manufacturer', 'Plastic packaging covers airless pump bottles, spray bottles, jars, tubes and travel-size formats for lightweight, scalable beauty packaging.'],
  'plastic-pump':['Airless Pump Bottles', 'Airless pump packaging protects sensitive formulas from oxygen exposure and is widely used for serum, foundation, eye cream, recyclable mono-material systems and anti-aging skincare.'],
  'plastic-airless':['Airless Bottles', 'Airless bottles, mini eye cream pumps, twist-lock pumps, lockable pumps, mono-material PP airless bottles, PLA airless bottles and refillable cartridge systems for serum, eye cream, primer, foundation and formulas sensitive to air exposure.'],
  'plastic-airless-jar':['Airless Jars', 'Airless cream jars and disc top jars for hygienic dispensing of creams, gels, masks and active skincare formulas.'],
  'plastic-dual':['Dual Chamber Packaging', 'Dual chamber bottles and tubes for two-step formulas, separated actives, day-night products and mixed-at-use skincare.'],
  'plastic-lotion':['Plastic Lotion Bottles', 'PET, HDPE, PETG, PCR and mono-material lotion bottles for shampoo, conditioner, cleanser, body lotion, toner, hand wash, powder products and high-volume personal care products.'],
  'plastic-pet':['PET Bottles', 'PET and PETG Boston bottles, square serum bottles, hotel amenity mini bottles, toner bottles, treatment pump bottles and heavy wall bottles for clear lightweight skincare, bath care and hair care packaging.'],
  'plastic-hdpe':['HDPE Bottles', 'HDPE squeeze bottles, pump bottles, disc cap bottles and wide mouth powder bottles for shampoo, conditioner, lotion, baby care, bath powder and high-viscosity personal care products.'],
  'plastic-spray':['Plastic Spray Bottles', 'Fine mist spray bottles for toner, facial mist, hair mist, setting spray and body care products with clear, frosted and custom color options.'],
  'plastic-jar':['Plastic Cosmetic Jars', 'PP, PETG, acrylic, double wall and refillable cosmetic jars for cream, scrub, gel, mask and hair treatment packaging with lightweight shipping advantages.'],
  'plastic-acrylic':['Acrylic Cosmetic Containers', 'Acrylic jars, compacts and thick-wall containers for premium skincare and makeup packaging with glass-like clarity.'],
  'plastic-foam':['Foam Pump Bottles', 'Foam pump bottles and silicone brush foamers for facial cleanser, scalp cleanser, hand wash and foaming skincare products, designed for consistent foam output and low product waste.'],
  'plastic-tube':['Cosmetic Tubes', 'PE, PCR, lip oil and aluminum barrier cosmetic tubes for cleanser, sunscreen, hand cream, hair care, pharmacy skincare, makeup and travel-size products.'],
  'plastic-deodorant':['Deodorant Stick Containers', 'Twist-up deodorant stick containers for deodorant, balm sticks, sunscreen sticks, body care sticks and solid perfume packaging.'],
  'plastic-makeup':['Makeup Packaging', 'Lip gloss tubes, lip oil tubes, mascara tubes, brow gel tubes, wand component kits, compact cases, cushion refill cartridges, paperboard palettes, nail polish bottles, cuticle oil pens and applicator packaging for color cosmetics, nail care, eye makeup and private label beauty lines.'],
  'plastic-travel':['Travel Size Packaging', 'Mini bottles, jars, sprays, pumps, clear travel toiletry pouches, vials and sample kits for hotel amenities, discovery sets, travel retail and promotional beauty programs.'],
  'plastic-pcr':['PCR and Refill Plastic Packaging', 'PCR PET bottles, PCR tubes, PCR HDPE bottles, mono-material PP airless bottles, refillable pump systems and recycled-content plastic packaging for beauty brands reducing virgin plastic usage.'],
  'plastic-closure':['Pumps, Caps, Closures and Accessories', 'Treatment pumps, lotion pumps, fine mist sprayers, foam pumps, disc caps, flip caps, child resistant caps, droppers, rollerballs, liners, applicators, mascara wands and one-stop packaging kit components for bottles, jars and tubes.'],
  'packaging-accessories':['Cosmetic Packaging Accessories Supplier', 'Pumps, sprayers, caps, collars, droppers, rollerballs, reducers, liners, shrink bands, mascara wands, spatulas, color sample boards and buyer presentation trays for one-stop component matching.'],
  'home-fragrance':['Home Fragrance Packaging Supplier', 'Candle jars, reed diffuser bottles, room spray bottles, car diffuser bottles, wax melt tins, essential oil gift sets and complete home fragrance packaging kits for private label scent brands.'],
  'spa-body':['Spa and Body Care Packaging', 'Bath salt jars, body scrub jars, shampoo pump bottle sets, hand cream tubes, sunscreen tubes, refill pouches and accessory kits for spa, body care and hotel amenity programs.'],
  'hotel-amenity':['Hotel Amenity and Travel Toiletry Packaging', 'Mini bottles, pump sets, travel toiletry kits, sample jars, clear pouches, sachets, inserts and one-stop hospitality packaging sets for hotels, spas, resorts and travel retail.'],
  'personal-care':['Personal Care, Hair Care and Sun Care Packaging', 'Foam pump bottles, PCR shampoo bottles, sunscreen stick containers, scalp applicator bottles, cosmetic powder shakers, roll-on deodorant bottles, solid perfume tins, travel sample sets and high-barrier pump tubes for personal care brands.'],
  'men-grooming':['Men’s Grooming Packaging Supplier', 'Beard oil dropper bottles, beard oil roll-ons, beard balm tins, pomade jars, shaving cream foamers, aftershave pump bottles, solid cologne sticks, travel grooming kits and molded pulp gift boxes for men’s care brands.'],
  bamboo:['Bamboo Cosmetic Packaging', 'Bamboo packaging gives natural beauty and clean skincare brands a warm, tactile and eco-positioned shelf appearance.'],
  'bamboo-bottle':['Bamboo Bottles', 'Bamboo pump bottles, bamboo airless bottles and bamboo lotion bottles for natural skincare, spa and organic beauty brands.'],
  'bamboo-jar':['Bamboo Jars', 'Bamboo jars with food-grade inner cups for creams, balms, body butter and mask formulas that need a sustainable look.'],
  'bamboo-cap':['Bamboo Caps and Lids', 'Bamboo caps, bamboo jar lids and wooden closures for glass jars, bottles and natural cosmetic packaging sets.'],
  'bamboo-dropper':['Bamboo Dropper Bottles', 'Glass dropper bottles with bamboo collars for serum, facial oil, essential oil and organic skincare packaging.'],
  'bamboo-rollon':['Bamboo Roll On Bottles', 'Roll on bottles with bamboo caps for perfume oil, essential oil blends, eye serum and wellness products.'],
  'bamboo-makeup':['Bamboo Makeup Packaging', 'Bamboo lipstick tubes, compact cases, mascara tubes and refillable makeup packaging for clean color cosmetics brands.'],
  alu:['Aluminum Cosmetic Packaging', 'Aluminum bottles, tins, tubes and sachet bags provide recyclable, lightweight and protective packaging choices for beauty products.'],
  'alu-bottle':['Aluminum Bottles', 'Aluminum pump bottles and spray bottles for toner, lotion, hair care and travel products with brushed, matte or custom color finishes.'],
  'alu-can':['Aluminum Can Containers', 'Soda-can, beer-can and aerosol-style aluminum containers for novelty cosmetic packaging, bath powder, body mist, dry shampoo, deodorant spray, refill concepts and promotional beauty gift sets.'],
  'alu-tin':['Aluminum Tins', 'Aluminum tins, screw top jars and sliding tins for balm, salve, solid perfume, beard care and sample-size cosmetic products.'],
  'alu-tube':['Aluminum Tubes', 'Aluminum squeeze tubes and aluminum lip balm tubes for pharmacy skincare, hand cream, solid balm, pigment products and formulas needing high barrier protection.'],
  'alu-atomizer':['Aluminum Atomizers', 'Refillable aluminum perfume atomizers, pocket perfume sprayers and slim mist bottles for travel fragrance, body mist, discovery sets and promotional gifts.'],
  'alu-jar':['Aluminum Jars', 'Aluminum cosmetic jars and screw top jars for balm, wax, salve, solid perfume, pomade, scrub samples and recyclable travel packaging.'],
  'alu-bag':['Aluminum Bags and Refill Pouches', 'Aluminum foil sachets and refill pouches for cosmetic samples, shampoo, conditioner, lotion refills and promotional trial packs.'],
  eco:['Eco Friendly Cosmetic Packaging', 'Sustainable packaging options include bamboo, kraft paper, aluminum, PCR plastic, refill pouches and biodegradable PLA packaging.'],
  bio:['Biodegradable Packaging', 'Biodegradable and compostable packaging options for organic skincare, zero-waste beauty and sustainability-focused product launches.'],
  'eco-wheat':['Wheat Straw Packaging', 'Wheat straw jars and bottles for natural skincare, bath care and clean beauty packaging with a plant-fiber appearance.'],
  'eco-pulp':['Molded Pulp Packaging', 'Molded pulp trays, jar insert trays, bottle inserts and gift boxes for plastic-reduction skincare sets, fragrance sets and retail packaging.'],
  'eco-refill':['Refill Packaging', 'Mono-material refill pouches, side-spout refill pouches, flat bottom refill pouches, corner-spout stand-up pouches, refill cartridges and replaceable pods for lower-waste skincare, hair care and body care product systems.'],
  'paper-tube':['Paper Tubes', 'Kraft paper tubes, plastic-free paperboard lip balm tubes and push-up tubes for lip balm, deodorant, solid perfume, sunscreen sticks and plastic-reduction projects.'],
  'paper-box':['Paper Boxes and Retail Kits', 'Folding cartons, rigid boxes, magnetic boxes, molded pulp perfume gift boxes, sample cards, retail gift packaging and turnkey launch kits for skincare, fragrance and makeup collections.']
};

const PRIMARY_MATERIAL_IDS = {
  'material-glass': [
    'p1','p4','p7','p9','p15','p17','p33','p34','p35','p36','p37','p38','p39','p40','p53','p54',
    'p55','p56','p57','p72','p73','p90','p93','p94','p95','p96','p97','p98','p112','p118','p119','p120',
    'p121','p131','p132','p133','p134','p149','p153','p164','p173','p186','p217','p218','p219','p220','p221','p223',
    'p224','p277','p289','p290','p299','p305','p316','p317','p318','p319','p320','p321','p322','p323','p324','p325',
    'p328','p329','p330','p331','p332','p333','p334','p335','p336','p337','p338','p339','p340','p341','p342','p343',
    'p344','p345','p346','p347','p348','p349','p350','p351','p352','p353','p354',
    'p363','p364','p365','p366','p367','p368','p369','p370','p371','p372','p373','p374','p375','p376',
    'p377','p378','p379','p380','p381'
  ],
  'material-plastic': [
    'p2','p10','p14','p16','p18','p19','p20','p22','p23','p41','p42','p43','p44','p45','p46','p47',
    'p48','p49','p50','p51','p52','p58','p59','p60','p61','p62','p63','p64','p68','p69','p70','p84',
    'p87','p88','p89','p91','p99','p100','p101','p102','p103','p104','p106','p107','p108','p109','p110','p122',
    'p123','p124','p125','p127','p128','p130','p135','p136','p137','p138','p139','p140','p141','p150','p151','p152',
    'p158','p159','p160','p161','p162','p163','p165','p169','p170','p171','p172','p174','p175','p177','p179','p182',
    'p183','p187','p201','p202','p203','p204','p205','p206','p207','p208','p209','p210','p211','p227','p228','p229',
    'p230','p232','p237','p238','p240','p241','p243','p244','p245','p246','p247','p248','p249','p253','p257','p262',
    'p264','p266','p270','p271','p272','p273','p276','p279','p281','p283','p284','p288','p291','p293','p294','p295',
    'p297','p298','p301','p302','p307','p308','p309','p310','p312','p313','p315',
    'p355','p356','p357','p358','p359','p360','p382','p383','p384','p385','p387'
  ],
  'material-metal': [
    'p5','p11','p27','p75','p76','p77','p78','p113','p114','p117','p142','p143','p144','p154','p155','p156',
    'p157','p181','p214','p222','p250','p286','p296','p300','p306','p327','p361','p362'
  ],
  'material-bamboo-wood': [
    'p3','p8','p13','p24','p25','p26','p71','p74','p111','p129','p213'
  ],
  'material-paper-pulp': [
    'p12','p29','p30','p81','p82','p85','p86','p116','p145','p146','p166','p167','p193','p194','p195','p215',
    'p267','p275','p287','p292','p303','p314'
  ],
  'material-flexible': [
    'p21','p28','p31','p65','p67','p83','p92','p105','p115','p126','p148','p168','p196','p199','p200','p231',
    'p233','p254','p255','p282','p304'
  ],
  'material-bio': [
    'p6','p66','p79','p80','p147','p265'
  ],
  'material-mixed': [
    'p32','p176','p178','p180','p184','p185','p188','p189','p190','p191','p192','p197','p198','p212','p216','p225',
    'p226','p234','p235','p236','p239','p242','p251','p252','p256','p258','p259','p260','p261','p263','p268','p269',
    'p274','p278','p280','p285','p311','p326','p386'
  ]
};

const PRIMARY_MATERIAL_SETS = Object.fromEntries(
  Object.entries(PRIMARY_MATERIAL_IDS).map(([key, ids]) => [key, new Set(ids)])
);

function isConceptProduct(p) {
  if (!p) return false;
  const productNumber = Number(String(p.id).replace(/\D/g, ''));
  return (productNumber >= 329 && productNumber <= 387)
    || /\bconcept\b|\bcustom (?:bottle|jar|container|closure|dispensing)[ -](?:shape[ -])?family\b/i.test(`${p.desc} ${p.tab}`);
}

const PAGE_META = {
  home: {
    title: 'Custom Glass Bottle Manufacturer | GloryStarPack',
    desc: 'Factory-direct custom glass bottle manufacturer for spirits, wine, beer, perfume and nail polish, with custom molds, decoration, closures and global shipping.'
  },
  products: {
    title: 'Cosmetic Packaging Products | Bottles, Jars, Tubes, Pumps & Kits',
    desc: 'Browse cosmetic packaging products including glass bottles, cream jars, perfume bottles, serum droppers, airless pumps, cosmetic tubes, pumps, caps, sprayers, liners, sample kits, aluminum cans, refill pouches, makeup packaging and eco packaging.'
  },
  detail: {
    title: 'Cosmetic Packaging Product Details | GloryStarPack',
    desc: 'Review cosmetic packaging materials, capacities, component details and project-specific sampling, customization and approval questions.'
  },
  search: {
    title: 'Search Cosmetic Packaging Products | GloryStarPack',
    desc: 'Search GloryStarPack cosmetic packaging products by material, category, size or application.'
  }
};

const FILTER_SEO_URLS = {
  glass: '/products/glass-packaging/',
  'material-glass': '/products/glass-packaging/',
  beverage: '/products/beverage-bottles/',
  'wine-bottle': '/products/wine-bottles/',
  'spirit-bottle': '/products/liquor-bottles/',
  'beer-bottle': '/products/beer-bottles/',
  'glass-decanter': '/products/beverage-bottles/',
  'juice-soda-bottle': '/products/beverage-bottles/',
  'oil-vinegar-bottle': '/products/glass-packaging/',
  'sauce-syrup-bottle': '/products/glass-packaging/',
  'glass-food': '/products/glass-packaging/',
  'food-jar': '/products/glass-packaging/',
  'glass-apothecary': '/products/glass-packaging/',
  'glass-oil': '/products/serum-dropper-bottles/',
  'glass-dropper': '/products/serum-dropper-bottles/',
  'glass-perfume': '/products/perfume-bottles/',
  'glass-nail': '/products/nail-polish-bottles/',
  plastic: '/products/plastic-packaging/',
  'material-plastic': '/products/plastic-packaging/',
  'plastic-airless': '/products/airless-pump-bottles/',
  'plastic-airless-jar': '/products/airless-pump-bottles/',
  'plastic-tube': '/products/cosmetic-tubes/',
  'plastic-makeup': '/products/makeup-packaging/',
  alu: '/products/aluminum-packaging/',
  'material-metal': '/products/aluminum-packaging/',
  'alu-can': '/products/aluminum-cosmetic-cans/',
  bamboo: '/products/bamboo-packaging/',
  'material-bamboo-wood': '/products/bamboo-packaging/',
  eco: '/products/eco-friendly-packaging/',
  'material-paper-pulp': '/products/eco-friendly-packaging/',
  'material-flexible': '/products/refill-packaging/',
  'material-bio': '/products/eco-friendly-packaging/',
  'material-mixed': '/products/cosmetic-packaging-kits/',
  'eco-refill': '/products/refill-packaging/',
  components: '/products/cosmetic-pumps-closures/',
  'plastic-closure': '/products/cosmetic-pumps-closures/',
  'packaging-accessories': '/products/cosmetic-packaging-accessories/',
  'home-fragrance': '/products/home-fragrance-packaging/',
  'hotel-amenity': '/products/hotel-amenity-packaging/',
  'personal-care': '/products/personal-care-packaging/',
  'men-grooming': '/products/mens-grooming-packaging/'
};

function filterCanonicalUrl(sub) {
  if (FILTER_SEO_URLS[sub]) return FILTER_SEO_URLS[sub];
  if (sub && sub.startsWith('glass')) return '/products/glass-packaging/';
  if (sub && sub.startsWith('plastic')) return '/products/plastic-packaging/';
  if (sub && sub.startsWith('alu')) return '/products/aluminum-packaging/';
  if (sub && sub.startsWith('bamboo')) return '/products/bamboo-packaging/';
  if (['bio','eco-wheat','eco-pulp','paper-tube','paper-box'].includes(sub)) return '/products/eco-friendly-packaging/';
  return '/';
}

function setMeta(page, sub) {
  const meta = PAGE_META[page] || PAGE_META.home;
  let title = meta.title;
  let desc = meta.desc;
  let canonical = 'https://www.glorystarpack.com/';
  let robots = 'index, follow, max-image-preview:large';
  if (page === 'products' && sub) {
    const clean = (CAT_TITLES[sub] || sub).replace(/[^\w\s/&-]/g, '').trim();
    const glassBottleSub = [
      'material-glass','glass','beverage','wine-bottle','spirit-bottle','beer-bottle',
      'glass-decanter','juice-soda-bottle','oil-vinegar-bottle','sauce-syrup-bottle',
      'glass-food','food-jar','glass-apothecary'
    ].includes(sub);
    title = glassBottleSub
      ? `${clean} | Custom Glass Bottle Manufacturer | GloryStarPack`
      : `${clean} | Cosmetic Packaging Manufacturer | GloryStarPack`;
    desc = glassBottleSub
      ? `Browse ${clean.toLowerCase()} from GloryStarPack, with custom bottle shapes, closure matching, decoration, samples, export packing and worldwide shipping.`
      : `Browse ${clean.toLowerCase()} options from GloryStarPack, a cosmetic packaging manufacturer with OEM logo printing, custom packaging, samples, factory-direct pricing and worldwide shipping.`;
    canonical = `https://www.glorystarpack.com${filterCanonicalUrl(sub)}`;
  } else if (page && page !== 'home') {
    canonical = `https://www.glorystarpack.com/#${page}`;
  }
  if (page === 'detail') {
    canonical = 'https://www.glorystarpack.com/products/product-index/';
  }
  if (['products', 'detail', 'search'].includes(page)) {
    robots = 'noindex, follow, max-image-preview:large';
  }
  document.title = title;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute('content', desc);
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) canonicalEl.setAttribute('href', canonical);
  const robotsEl = document.querySelector('meta[name="robots"]');
  if (robotsEl) robotsEl.setAttribute('content', robots);
  const keywordsEl = document.querySelector('meta[name="keywords"]');
  if (keywordsEl) {
    const baseKeywords = 'cosmetic packaging manufacturer, cosmetic packaging supplier, custom cosmetic packaging, OEM cosmetic packaging, custom cosmetic bottles, cosmetic jars supplier, airless pump bottles, cosmetic tubes, makeup packaging';
    const pageKeywords = page === 'products' && sub ? `${CAT_TITLES[sub] || sub}, ${baseKeywords}, refill pouches, aluminum cosmetic packaging, nail polish bottle supplier, private label beauty packaging` : baseKeywords + ', glass cosmetic bottles, PCR cosmetic tubes, lip oil tubes, mascara tubes, nail polish bottles, aluminum aerosol cans, aluminum cosmetic cans, refillable perfume atomizers, refill pouches, bamboo cosmetic packaging, eco friendly cosmetic packaging';
    keywordsEl.setAttribute('content', pageKeywords);
  }
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (ogTitle) ogTitle.setAttribute('content', title);
  if (ogDesc) ogDesc.setAttribute('content', desc);
  if (ogUrl) ogUrl.setAttribute('content', canonical);
  if (twTitle) twTitle.setAttribute('content', title);
  if (twDesc) twDesc.setAttribute('content', desc);
}

function setSearchMeta(q, count) {
  const cleanQuery = String(q || '').trim().slice(0, 80);
  const title = cleanQuery ? `Search Cosmetic Packaging for ${cleanQuery} | GloryStarPack` : PAGE_META.search.title;
  const desc = cleanQuery
    ? `Search GloryStarPack cosmetic packaging products for ${cleanQuery}. Browse matching bottles, jars, tubes, pumps, caps, samples and OEM packaging options.`
    : PAGE_META.search.desc;
  document.title = title;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute('content', desc.slice(0, 160));
  const robotsEl = document.querySelector('meta[name="robots"]');
  if (robotsEl) robotsEl.setAttribute('content', 'noindex, follow, max-image-preview:large');
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) canonicalEl.setAttribute('href', 'https://www.glorystarpack.com/');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (ogTitle) ogTitle.setAttribute('content', title);
  if (ogDesc) ogDesc.setAttribute('content', desc);
  if (ogUrl) ogUrl.setAttribute('content', `https://www.glorystarpack.com/?q=${encodeURIComponent(cleanQuery)}`);
  if (twTitle) twTitle.setAttribute('content', title);
  if (twDesc) twDesc.setAttribute('content', desc);
  const grid = document.getElementById('search-grid');
  if (grid) grid.setAttribute('aria-label', `${count} cosmetic packaging search results for ${cleanQuery}`);
}

function closeNavMenus() {
  document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
  document.querySelectorAll('.nav-link[aria-expanded]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
}

function closeMobileNav() {
  const nav = document.getElementById('siteNav');
  const btn = document.getElementById('menuToggle');
  if (nav) nav.classList.remove('mobile-open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  closeNavMenus();
}

function toggleMobileNav() {
  const nav = document.getElementById('siteNav');
  const btn = document.getElementById('menuToggle');
  if (!nav || !btn) return;
  nav.classList.toggle('mobile-open');
  btn.setAttribute('aria-expanded', nav.classList.contains('mobile-open') ? 'true' : 'false');
  closeNavMenus();
}

function setActiveNav(page, sub) {
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const direct = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (direct) direct.classList.add('active');
  if (page === 'products') {
    let group = '';
    if (sub === 'material-glass' || (sub && sub.startsWith('glass'))) group = 'glass';
    else if (['beverage','wine-bottle','spirit-bottle','beer-bottle','juice-soda-bottle','beverage-closure'].includes(sub)) group = 'beverage';
    else if (['oil-vinegar-bottle','sauce-syrup-bottle','glass-food','food-jar','glass-apothecary'].includes(sub)) group = 'glass';
    else if (sub === 'material-plastic' || sub === 'components' || (sub && sub.startsWith('plastic'))) group = 'plastic';
    else if (sub === 'material-bamboo-wood' || (sub && sub.startsWith('bamboo'))) group = 'bamboo';
    else if (sub === 'material-metal' || (sub && sub.startsWith('alu'))) group = 'alu';
    else if (['material-paper-pulp','material-flexible','material-bio','material-mixed','bio','paper-tube','paper-box','eco','eco-wheat','eco-pulp','eco-refill'].includes(sub)) group = 'eco';
    const productLink = document.querySelector(`.nav-link[data-group="${group}"]`) || document.querySelector('.nav-link[data-page="products"]');
    if (productLink) productLink.classList.add('active');
  }
}

// =========================================================== NAVIGATION
function go(page, sub, skipHash, productPage = 1) {
  closeMobileNav();
  const staticUrl = STATIC_PAGE_ROUTES[page];
  if (staticUrl) {
    window.location.assign(staticUrl);
    return;
  }
  document.querySelectorAll('.page').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
  const el = document.getElementById('page-' + page);
  if (!el) return;
  el.style.display = 'block';
  el.classList.add('active');
  window.scrollTo(0, 0);
  setMeta(page, sub);
  setActiveNav(page, sub);
  if (!skipHash) {
    const hash = sub ? `#${page}/${sub}` : `#${page}`;
    history.replaceState(null, '', hash);
  }

  if (page === 'home') renderHomeGrid();
  if (page === 'products') { const c = sub || 'hot'; filterCatByKey(c, productPage); }
}

// =========================================================== PRODUCT CARD HTML
const productPhotoIds = new Set([
  ...Array.from({length:316}, (_, i) => `p${i + 1}`),
  ...Array.from({length:59}, (_, i) => `p${i + 329}`)
]);
const PRODUCT_IMAGE_SETS = [
  {cat:'beer-bottle', images:['assets/product-photos/p367-0.jpg','assets/product-photos/p368-0.jpg','assets/brand/glass-beer-bottle-collection-2026.jpg','assets/product-photos/p336-0.jpg','assets/product-photos/p337-0.jpg','assets/product-photos/p338-0.jpg']},
  {cat:'glass-decanter', images:['assets/product-photos/p366-0.jpg','assets/product-photos/p334-0.jpg','assets/product-photos/p333-0.jpg','assets/product-photos/p343-0.jpg']},
  {cat:'juice-soda-bottle', images:['assets/product-photos/p369-0.jpg','assets/product-photos/p370-0.jpg','assets/product-photos/p368-0.jpg','assets/product-photos/p382-0.jpg','assets/product-photos/p348-0.jpg','assets/product-photos/p355-0.jpg','assets/product-photos/p338-0.jpg','assets/product-photos/p339-0.jpg']},
  {cat:'oil-vinegar-bottle', images:['assets/product-photos/p372-0.jpg','assets/product-photos/p354-0.jpg','assets/product-photos/p340-0.jpg','assets/product-photos/p341-0.jpg']},
  {cat:'sauce-syrup-bottle', images:['assets/product-photos/p371-0.jpg','assets/product-photos/p349-0.jpg','assets/product-photos/p342-0.jpg','assets/product-photos/p343-0.jpg','assets/product-photos/p362-0.jpg']},
  {cat:'glass-food', images:['assets/product-photos/p371-0.jpg','assets/product-photos/p372-0.jpg','assets/product-photos/p373-0.jpg','assets/product-photos/p374-0.jpg','assets/product-photos/p375-0.jpg','assets/product-photos/p376-0.jpg','assets/product-photos/p344-0.jpg','assets/product-photos/p348-0.jpg','assets/product-photos/p349-0.jpg','assets/product-photos/p350-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p352-0.jpg','assets/product-photos/p353-0.jpg','assets/product-photos/p354-0.jpg','assets/product-photos/p340-0.jpg','assets/product-photos/p341-0.jpg','assets/product-photos/p342-0.jpg','assets/product-photos/p343-0.jpg']},
  {cat:'food-jar', images:['assets/product-photos/p373-0.jpg','assets/product-photos/p374-0.jpg','assets/product-photos/p375-0.jpg','assets/product-photos/p376-0.jpg','assets/product-photos/p350-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p352-0.jpg','assets/product-photos/p353-0.jpg','assets/product-photos/p362-0.jpg']},
  {cat:'glass-apothecary', images:['assets/product-photos/p377-0.jpg','assets/product-photos/p378-0.jpg','assets/product-photos/p379-0.jpg','assets/product-photos/p344-0.jpg','assets/product-photos/p345-0.jpg','assets/product-photos/p346-0.jpg','assets/product-photos/p347-0.jpg','assets/product-photos/p289-0.jpg','assets/product-photos/p34-0.jpg']},
  {cat:'wine-bottle', images:['assets/product-photos/p363-0.jpg','assets/product-photos/p364-0.jpg','assets/brand/wine-bottle-collection-original-2026-768.webp','assets/brand/wine-spirits-bottle-collection-2026-768.webp','assets/brand/wine-bottle-collection-original-2026-1440.webp']},
  {cat:'spirit-bottle', images:['assets/product-photos/p365-0.jpg','assets/product-photos/p366-0.jpg','assets/brand/liquor-spirit-bottle-collection-original-2026-768.webp','assets/brand/wine-spirits-bottle-collection-2026-768.webp','assets/brand/liquor-spirit-bottle-collection-original-2026-1440.webp']},
  {cat:'beverage-closure', images:['assets/product-photos/p385-0.jpg','assets/product-photos/p386-0.jpg','assets/product-photos/p360-0.jpg','assets/product-photos/p361-0.jpg','assets/product-photos/p362-0.jpg','assets/brand/wine-spirits-bottle-collection-2026-768.webp','assets/brand/liquor-spirit-bottle-collection-original-2026-768.webp','assets/brand/wine-bottle-collection-original-2026-768.webp']},
  {cat:'beverage', images:['assets/product-photos/p363-0.jpg','assets/product-photos/p365-0.jpg','assets/product-photos/p367-0.jpg','assets/product-photos/p369-0.jpg','assets/product-photos/p382-0.jpg','assets/brand/wine-spirits-bottle-collection-2026-768.webp','assets/brand/wine-bottle-collection-original-2026-768.webp','assets/brand/liquor-spirit-bottle-collection-original-2026-768.webp']},
  {cat:'packaging-accessories', images:['assets/product-photos/p384-0.jpg','assets/product-photos/p385-0.jpg','assets/product-photos/p386-0.jpg','assets/product-photos/p387-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p359-0.jpg','assets/product-photos/p360-0.jpg','assets/product-photos/p361-0.jpg','assets/product-photos/p362-0.jpg','assets/product-photos/p291-0.jpg','assets/product-photos/p289-0.jpg','assets/product-photos/p285-0.jpg','assets/product-photos/p263-0.jpg','assets/product-photos/p267-0.jpg','assets/product-photos/p273-0.jpg','assets/product-photos/p274-0.jpg','assets/product-photos/p279-0.jpg','assets/product-photos/p259-0.jpg','assets/product-photos/p260-0.jpg','assets/product-photos/p243-0.jpg','assets/product-photos/p254-0.jpg','assets/product-photos/p258-0.jpg']},
  {cat:'home-fragrance', images:['assets/product-photos/p242-0.jpg','assets/product-photos/p219-0.jpg','assets/product-photos/p217-0.jpg','assets/product-photos/p220-0.jpg']},
  {cat:'spa-body', images:['assets/product-photos/p356-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p359-0.jpg','assets/product-photos/p304-0.jpg','assets/product-photos/p294-0.jpg','assets/product-photos/p297-0.jpg','assets/product-photos/p298-0.jpg','assets/product-photos/p225-0.jpg','assets/product-photos/p228-0.jpg','assets/product-photos/p241-0.jpg','assets/product-photos/p233-0.jpg']},
  {cat:'hotel-amenity', images:['assets/product-photos/p356-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p302-0.jpg','assets/product-photos/p283-0.jpg','assets/product-photos/p284-0.jpg','assets/product-photos/p285-0.jpg','assets/product-photos/p275-0.jpg','assets/product-photos/p271-0.jpg','assets/product-photos/p229-0.jpg','assets/product-photos/p230-0.jpg','assets/product-photos/p236-0.jpg','assets/product-photos/p234-0.jpg']},
  {cat:'personal-care', images:['assets/product-photos/p359-0.jpg','assets/product-photos/p293-0.jpg','assets/product-photos/p294-0.jpg','assets/product-photos/p295-0.jpg','assets/product-photos/p296-0.jpg','assets/product-photos/p297-0.jpg','assets/product-photos/p298-0.jpg','assets/product-photos/p299-0.jpg','assets/product-photos/p300-0.jpg','assets/product-photos/p301-0.jpg','assets/product-photos/p302-0.jpg','assets/product-photos/p303-0.jpg','assets/product-photos/p304-0.jpg','assets/product-photos/p305-0.jpg','assets/product-photos/p306-0.jpg','assets/product-photos/p307-0.jpg','assets/product-photos/p308-0.jpg','assets/product-photos/p309-0.jpg','assets/product-photos/p310-0.jpg','assets/product-photos/p311-0.jpg','assets/product-photos/p312-0.jpg','assets/product-photos/p313-0.jpg','assets/product-photos/p314-0.jpg','assets/product-photos/p315-0.jpg','assets/product-photos/p316-0.jpg']},
  {cat:'men-grooming', images:['assets/product-photos/p305-0.jpg','assets/product-photos/p306-0.jpg','assets/product-photos/p307-0.jpg','assets/product-photos/p308-0.jpg','assets/product-photos/p309-0.jpg','assets/product-photos/p310-0.jpg','assets/product-photos/p311-0.jpg','assets/product-photos/p312-0.jpg','assets/product-photos/p313-0.jpg','assets/product-photos/p314-0.jpg','assets/product-photos/p315-0.jpg','assets/product-photos/p316-0.jpg']},
  {cat:'glass-dropper', images:['assets/product-photos/p305-0.jpg','assets/product-photos/p299-0.jpg','assets/product-photos/p289-0.jpg','assets/brand/glass-dropper-rollon-vials-2026.jpg','assets/brand/glass-complete-product-assortment-2026.jpg','assets/brand/skincare-packaging-application-2026.jpg']},
  {cat:'glass-rollon', images:['assets/product-photos/p316-0.jpg','assets/brand/glass-dropper-rollon-vials-2026.jpg','assets/brand/travel-sample-complete-product-assortment-2026.jpg','assets/brand/fragrance-packaging-collection-v2-2026.jpg']},
  {cat:'glass-ampoule', images:['assets/brand/glass-dropper-rollon-vials-2026.jpg','assets/brand/travel-sample-complete-product-assortment-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg']},
  {cat:'glass-spray', images:['assets/brand/glass-lotion-toner-nail-2026.jpg','assets/brand/pet-hdpe-bottle-family-2026.jpg','assets/brand/glass-dropper-rollon-vials-2026.jpg']},
  {cat:'glass-lotion', images:['assets/product-photos/p290-0.jpg','assets/brand/glass-lotion-toner-nail-2026.jpg','assets/brand/glass-complete-product-assortment-2026.jpg','assets/brand/skincare-packaging-application-2026.jpg']},
  {cat:'glass-nail', images:['assets/product-photos/p381-0.jpg','assets/brand/makeup-lip-mascara-components-2026.jpg','assets/brand/glass-lotion-toner-nail-2026.jpg','assets/brand/glass-dropper-rollon-vials-2026.jpg']},
  {cat:'plastic-pet', images:['assets/product-photos/p382-0.jpg','assets/product-photos/p355-0.jpg','assets/brand/pet-hdpe-bottle-family-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/glass-lotion-toner-nail-2026.jpg']},
  {cat:'plastic-hdpe', images:['assets/product-photos/p383-0.jpg','assets/product-photos/p356-0.jpg','assets/product-photos/p313-0.jpg','assets/product-photos/p294-0.jpg','assets/product-photos/p297-0.jpg','assets/product-photos/p298-0.jpg','assets/brand/pet-hdpe-bottle-family-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg']},
  {cat:'bamboo-cap', images:['assets/brand/bamboo-packaging-collection-v2-2026.jpg','assets/brand/closures-complete-product-assortment-2026.jpg','assets/brand/glass-complete-product-assortment-2026.jpg']},
  {cat:'bamboo-dropper', images:['assets/brand/bamboo-packaging-collection-v2-2026.jpg','assets/brand/glass-complete-product-assortment-2026.jpg','assets/brand/closures-complete-product-assortment-2026.jpg']},
  {cat:'bamboo-rollon', images:['assets/brand/bamboo-packaging-collection-v2-2026.jpg','assets/brand/travel-sample-complete-product-assortment-2026.jpg','assets/brand/glass-complete-product-assortment-2026.jpg']},
  {cat:'plastic-closure', images:['assets/product-photos/p384-0.jpg','assets/product-photos/p385-0.jpg','assets/product-photos/p387-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p359-0.jpg','assets/product-photos/p360-0.jpg','assets/product-photos/p291-0.jpg','assets/product-photos/p289-0.jpg','assets/product-photos/p266-0.jpg','assets/product-photos/p268-0.jpg','assets/product-photos/p269-0.jpg','assets/product-photos/p274-0.jpg','assets/brand/closures-complete-product-assortment-2026.jpg','assets/brand/cosmetic-closures-components-v2-2026.jpg','assets/brand/cosmetic-closures-components-2026.jpg','assets/brand/oem-decoration-process-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg']},
  {cat:'plastic-travel', images:['assets/product-photos/p311-0.jpg','assets/product-photos/p312-0.jpg','assets/product-photos/p315-0.jpg','assets/product-photos/p316-0.jpg','assets/product-photos/p302-0.jpg','assets/product-photos/p295-0.jpg','assets/product-photos/p299-0.jpg','assets/product-photos/p301-0.jpg','assets/product-photos/p303-0.jpg','assets/product-photos/p284-0.jpg','assets/product-photos/p285-0.jpg','assets/product-photos/p283-0.jpg','assets/brand/travel-sample-complete-product-assortment-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg','assets/brand/glass-complete-product-assortment-2026.jpg']},
  {cat:'eco-refill', images:['assets/product-photos/p295-0.jpg','assets/product-photos/p299-0.jpg','assets/product-photos/p282-0.jpg','assets/product-photos/p281-0.jpg','assets/product-photos/p288-0.jpg','assets/product-photos/p272-0.jpg','assets/product-photos/p264-0.jpg','assets/product-photos/p280-0.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg','assets/brand/refill-eco-packaging-collection-2026.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg']},
  {cat:'plastic-pump', images:['assets/product-photos/p387-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p310-0.jpg','assets/product-photos/p309-0.jpg','assets/product-photos/p315-0.jpg','assets/product-photos/p293-0.jpg','assets/product-photos/p301-0.jpg','assets/product-photos/p281-0.jpg','assets/product-photos/p288-0.jpg','assets/brand/airless-refill-system-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/pet-hdpe-bottle-family-2026.jpg']},
  {cat:'plastic-spray', images:['assets/product-photos/p384-0.jpg','assets/product-photos/p359-0.jpg','assets/product-photos/p244-0.jpg','assets/product-photos/p245-0.jpg','assets/brand/cosmetic-closures-components-v2-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg']},
  {cat:'plastic-airless', images:['assets/product-photos/p315-0.jpg','assets/product-photos/p301-0.jpg','assets/product-photos/p288-0.jpg','assets/product-photos/p281-0.jpg','assets/brand/airless-refill-system-2026.jpg','assets/brand/airless-packaging-collection-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg']},
  {cat:'plastic-airless-jar', images:['assets/brand/airless-refill-system-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/skincare-packaging-application-2026.jpg']},
  {cat:'plastic-lotion', images:['assets/product-photos/p387-0.jpg','assets/product-photos/p356-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p309-0.jpg','assets/product-photos/p313-0.jpg','assets/product-photos/p293-0.jpg','assets/product-photos/p294-0.jpg','assets/product-photos/p297-0.jpg','assets/product-photos/p298-0.jpg','assets/product-photos/p302-0.jpg','assets/product-photos/p281-0.jpg','assets/product-photos/p283-0.jpg','assets/product-photos/p278-0.jpg','assets/brand/pet-hdpe-bottle-family-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg']},
  {cat:'plastic-jar', images:['assets/product-photos/p307-0.jpg','assets/product-photos/p264-0.jpg','assets/product-photos/p265-0.jpg','assets/product-photos/p278-0.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/skincare-packaging-application-2026.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg']},
  {cat:'plastic-foam', images:['assets/product-photos/p384-0.jpg','assets/product-photos/p310-0.jpg','assets/product-photos/p293-0.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/airless-packaging-collection-2026.jpg','assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg']},
  {cat:'plastic-deodorant', images:['assets/product-photos/p308-0.jpg','assets/product-photos/p312-0.jpg','assets/product-photos/p295-0.jpg','assets/product-photos/p296-0.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg']},
  {cat:'alu-bag', images:['assets/product-photos/p282-0.jpg','assets/product-photos/p285-0.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg','assets/brand/aluminum-complete-product-assortment-2026.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg']},
  {cat:'alu-can', images:['assets/product-photos/p286-0.jpg','assets/brand/aluminum-complete-product-assortment-2026.jpg','assets/brand/aluminum-packaging-collection-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg']},
  {cat:'alu-atomizer', images:['assets/product-photos/p296-0.jpg','assets/brand/fragrance-packaging-collection-v2-2026.jpg','assets/brand/aluminum-complete-product-assortment-2026.jpg','assets/brand/travel-sample-complete-product-assortment-2026.jpg']},
  {cat:'alu-jar', images:['assets/product-photos/p306-0.jpg','assets/product-photos/p300-0.jpg','assets/brand/aluminum-complete-product-assortment-2026.jpg','assets/brand/aluminum-packaging-collection-2026.jpg','assets/brand/closures-complete-product-assortment-2026.jpg']},
  {cat:'plastic-tube', images:['assets/product-photos/p304-0.jpg','assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg','assets/brand/cosmetic-tubes-collection-2026.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg']},
  {cat:'alu-tube', images:['assets/product-photos/p304-0.jpg','assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg','assets/brand/aluminum-complete-product-assortment-2026.jpg','assets/brand/cosmetic-tubes-collection-2026.jpg']},
  {cat:'plastic-makeup', images:['assets/product-photos/p291-0.jpg','assets/product-photos/p290-0.jpg','assets/product-photos/p287-0.jpg','assets/product-photos/p270-0.jpg','assets/brand/makeup-lip-mascara-components-2026.jpg','assets/brand/makeup-complete-product-assortment-2026.jpg','assets/brand/closures-complete-product-assortment-2026.jpg']},
  {cat:'bamboo-makeup', images:['assets/brand/bamboo-packaging-collection-v2-2026.jpg','assets/brand/makeup-complete-product-assortment-2026.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg']},
  {cat:'glass-perfume', images:['assets/product-photos/p380-0.jpg','assets/brand/fragrance-packaging-collection-v2-2026.jpg','assets/brand/glass-complete-product-assortment-2026.jpg','assets/brand/travel-sample-complete-product-assortment-2026.jpg']},
  {cat:'glass', images:['assets/brand/glass-complete-product-assortment-2026.jpg','assets/brand/glass-packaging-collection-2026.jpg','assets/brand/glass-lotion-toner-nail-2026.jpg','assets/brand/glass-dropper-rollon-vials-2026.jpg','assets/brand/fragrance-packaging-collection-v2-2026.jpg','assets/brand/skincare-packaging-application-2026.jpg']},
  {cat:'bamboo', images:['assets/brand/bamboo-packaging-collection-v2-2026.jpg','assets/brand/bamboo-packaging-collection-2026.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg']},
  {cat:'alu', images:['assets/brand/aluminum-complete-product-assortment-2026.jpg','assets/brand/aluminum-packaging-collection-2026.jpg','assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg','assets/brand/fragrance-packaging-collection-v2-2026.jpg','assets/brand/closures-complete-product-assortment-2026.jpg']},
  {cat:'paper-box', images:['assets/product-photos/p314-0.jpg','assets/product-photos/p303-0.jpg','assets/product-photos/p300-0.jpg','assets/product-photos/p302-0.jpg','assets/product-photos/p292-0.jpg','assets/product-photos/p285-0.jpg','assets/product-photos/p284-0.jpg','assets/product-photos/p267-0.jpg','assets/product-photos/p275-0.jpg','assets/product-photos/p280-0.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg','assets/brand/oem-retail-export-packing-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg']},
  {cat:'paper-tube', images:['assets/product-photos/p287-0.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg','assets/brand/bamboo-packaging-collection-v2-2026.jpg']},
  {cat:'eco-pulp', images:['assets/product-photos/p314-0.jpg','assets/product-photos/p303-0.jpg','assets/product-photos/p292-0.jpg','assets/product-photos/p285-0.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg','assets/brand/oem-retail-export-packing-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg']},
  {cat:'bio', images:['assets/brand/paper-eco-complete-product-assortment-2026.jpg','assets/brand/refill-eco-packaging-collection-2026.jpg','assets/brand/bamboo-packaging-collection-v2-2026.jpg']},
  {cat:'eco', images:['assets/product-photos/p303-0.jpg','assets/product-photos/p295-0.jpg','assets/product-photos/p282-0.jpg','assets/product-photos/p288-0.jpg','assets/product-photos/p287-0.jpg','assets/product-photos/p292-0.jpg','assets/product-photos/p265-0.jpg','assets/product-photos/p272-0.jpg','assets/product-photos/p264-0.jpg','assets/brand/paper-eco-complete-product-assortment-2026.jpg','assets/brand/refill-sample-complete-product-assortment-2026.jpg','assets/brand/bamboo-packaging-collection-v2-2026.jpg']},
  {cat:'plastic', images:['assets/product-photos/p382-0.jpg','assets/product-photos/p383-0.jpg','assets/product-photos/p384-0.jpg','assets/product-photos/p385-0.jpg','assets/product-photos/p387-0.jpg','assets/product-photos/p293-0.jpg','assets/product-photos/p294-0.jpg','assets/product-photos/p295-0.jpg','assets/product-photos/p297-0.jpg','assets/product-photos/p301-0.jpg','assets/product-photos/p302-0.jpg','assets/product-photos/p304-0.jpg','assets/product-photos/p281-0.jpg','assets/product-photos/p288-0.jpg','assets/product-photos/p283-0.jpg','assets/brand/plastic-complete-product-assortment-2026.jpg','assets/brand/pet-hdpe-bottle-family-2026.jpg','assets/brand/airless-packaging-collection-2026.jpg','assets/brand/airless-refill-system-2026.jpg','assets/brand/cosmetic-tubes-complete-product-assortment-2026.jpg','assets/brand/makeup-complete-product-assortment-2026.jpg']}
];

const PRODUCT_DETAIL_IMAGE_SETS = {
  p344:['assets/product-photos/p344-0.jpg','assets/product-photos/p345-0.jpg','assets/product-photos/p346-0.jpg','assets/product-photos/p347-0.jpg'],
  p345:['assets/product-photos/p345-0.jpg','assets/product-photos/p344-0.jpg','assets/product-photos/p346-0.jpg','assets/product-photos/p347-0.jpg'],
  p346:['assets/product-photos/p346-0.jpg','assets/product-photos/p347-0.jpg','assets/product-photos/p345-0.jpg','assets/product-photos/p344-0.jpg'],
  p347:['assets/product-photos/p347-0.jpg','assets/product-photos/p346-0.jpg','assets/product-photos/p344-0.jpg','assets/product-photos/p345-0.jpg'],
  p348:['assets/product-photos/p348-0.jpg','assets/product-photos/p339-0.jpg','assets/product-photos/p355-0.jpg','assets/product-photos/p354-0.jpg'],
  p349:['assets/product-photos/p349-0.jpg','assets/product-photos/p342-0.jpg','assets/product-photos/p343-0.jpg','assets/product-photos/p354-0.jpg'],
  p350:['assets/product-photos/p350-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p352-0.jpg','assets/product-photos/p353-0.jpg'],
  p351:['assets/product-photos/p351-0.jpg','assets/product-photos/p352-0.jpg','assets/product-photos/p353-0.jpg','assets/product-photos/p350-0.jpg'],
  p352:['assets/product-photos/p352-0.jpg','assets/product-photos/p350-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p353-0.jpg'],
  p353:['assets/product-photos/p353-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p350-0.jpg','assets/product-photos/p352-0.jpg'],
  p354:['assets/product-photos/p354-0.jpg','assets/product-photos/p340-0.jpg','assets/product-photos/p341-0.jpg','assets/product-photos/p349-0.jpg'],
  p355:['assets/product-photos/p355-0.jpg','assets/product-photos/p348-0.jpg','assets/product-photos/p339-0.jpg','assets/product-photos/p338-0.jpg'],
  p356:['assets/product-photos/p356-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p359-0.jpg'],
  p357:['assets/product-photos/p357-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p359-0.jpg','assets/product-photos/p356-0.jpg'],
  p358:['assets/product-photos/p358-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p359-0.jpg','assets/product-photos/p356-0.jpg'],
  p359:['assets/product-photos/p359-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p356-0.jpg'],
  p360:['assets/product-photos/p360-0.jpg','assets/product-photos/p361-0.jpg','assets/product-photos/p362-0.jpg','assets/product-photos/p355-0.jpg'],
  p361:['assets/product-photos/p361-0.jpg','assets/product-photos/p360-0.jpg','assets/product-photos/p362-0.jpg','assets/product-photos/p335-0.jpg'],
  p362:['assets/product-photos/p362-0.jpg','assets/product-photos/p360-0.jpg','assets/product-photos/p361-0.jpg','assets/product-photos/p351-0.jpg'],
  p363:['assets/product-photos/p363-0.jpg','assets/product-photos/p364-0.jpg','assets/product-photos/p329-0.jpg','assets/brand/wine-bottle-collection-original-2026-768.webp'],
  p364:['assets/product-photos/p364-0.jpg','assets/product-photos/p363-0.jpg','assets/product-photos/p330-0.jpg','assets/brand/wine-bottle-collection-original-2026-768.webp'],
  p365:['assets/product-photos/p365-0.jpg','assets/product-photos/p366-0.jpg','assets/product-photos/p331-0.jpg','assets/product-photos/p334-0.jpg'],
  p366:['assets/product-photos/p366-0.jpg','assets/product-photos/p365-0.jpg','assets/product-photos/p333-0.jpg','assets/product-photos/p334-0.jpg'],
  p367:['assets/product-photos/p367-0.jpg','assets/product-photos/p335-0.jpg','assets/product-photos/p336-0.jpg','assets/brand/glass-beer-bottle-collection-2026.jpg'],
  p368:['assets/product-photos/p368-0.jpg','assets/product-photos/p367-0.jpg','assets/product-photos/p337-0.jpg','assets/product-photos/p339-0.jpg'],
  p369:['assets/product-photos/p369-0.jpg','assets/product-photos/p339-0.jpg','assets/product-photos/p338-0.jpg','assets/product-photos/p348-0.jpg'],
  p370:['assets/product-photos/p370-0.jpg','assets/product-photos/p339-0.jpg','assets/product-photos/p348-0.jpg','assets/product-photos/p369-0.jpg'],
  p371:['assets/product-photos/p371-0.jpg','assets/product-photos/p343-0.jpg','assets/product-photos/p342-0.jpg','assets/product-photos/p349-0.jpg'],
  p372:['assets/product-photos/p372-0.jpg','assets/product-photos/p340-0.jpg','assets/product-photos/p341-0.jpg','assets/product-photos/p354-0.jpg'],
  p373:['assets/product-photos/p373-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p353-0.jpg','assets/product-photos/p350-0.jpg'],
  p374:['assets/product-photos/p374-0.jpg','assets/product-photos/p352-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p353-0.jpg'],
  p375:['assets/product-photos/p375-0.jpg','assets/product-photos/p350-0.jpg','assets/product-photos/p352-0.jpg','assets/product-photos/p353-0.jpg'],
  p376:['assets/product-photos/p376-0.jpg','assets/product-photos/p352-0.jpg','assets/product-photos/p351-0.jpg','assets/product-photos/p350-0.jpg'],
  p377:['assets/product-photos/p377-0.jpg','assets/product-photos/p119-0.jpg','assets/product-photos/p54-0.jpg','assets/product-photos/p55-0.jpg'],
  p378:['assets/product-photos/p378-0.jpg','assets/product-photos/p346-0.jpg','assets/product-photos/p36-0.jpg','assets/product-photos/p153-0.jpg'],
  p379:['assets/product-photos/p379-0.jpg','assets/product-photos/p347-0.jpg','assets/product-photos/p345-0.jpg','assets/product-photos/p289-0.jpg'],
  p380:['assets/product-photos/p380-0.jpg','assets/product-photos/p132-0.jpg','assets/product-photos/p15-0.jpg','assets/product-photos/p4-0.jpg'],
  p381:['assets/product-photos/p381-0.jpg','assets/product-photos/p118-0.jpg','assets/product-photos/p40-0.jpg','assets/product-photos/p164-0.jpg'],
  p382:['assets/product-photos/p382-0.jpg','assets/product-photos/p355-0.jpg','assets/product-photos/p339-0.jpg','assets/product-photos/p369-0.jpg'],
  p383:['assets/product-photos/p383-0.jpg','assets/product-photos/p346-0.jpg','assets/product-photos/p356-0.jpg','assets/product-photos/p202-0.jpg'],
  p384:['assets/product-photos/p384-0.jpg','assets/product-photos/p359-0.jpg','assets/product-photos/p245-0.jpg','assets/product-photos/p244-0.jpg'],
  p385:['assets/product-photos/p385-0.jpg','assets/product-photos/p360-0.jpg','assets/product-photos/p382-0.jpg','assets/product-photos/p339-0.jpg'],
  p386:['assets/product-photos/p386-0.jpg','assets/brand/glass-beer-bottle-collection-2026.jpg','assets/product-photos/p337-0.jpg','assets/product-photos/p361-0.jpg'],
  p387:['assets/product-photos/p387-0.jpg','assets/product-photos/p357-0.jpg','assets/product-photos/p358-0.jpg','assets/product-photos/p170-0.jpg']
};

function productImage(p, offset = 0) {
  const variant = Math.max(0, Math.min(4, Number(offset) || 0));
  const hasDedicatedPhoto = productPhotoIds.has(p.id);
  if (hasDedicatedPhoto && variant === 0) return `assets/product-photos/${p.id}-0.jpg`;
  const imageSet = PRODUCT_IMAGE_SETS.find(set => p.cats.includes(set.cat));
  if (imageSet) {
    const base = Number(String(p.id).replace(/\D/g, '')) || 0;
    const imageOffset = hasDedicatedPhoto ? Math.max(0, variant - 1) : variant;
    return imageSet.images[(base + imageOffset) % imageSet.images.length];
  }
  if (hasDedicatedPhoto) return `assets/product-photos/${p.id}-0.jpg`;
  return `assets/products/${p.id}-${variant}.svg`;
}

function productGalleryImages(p) {
  const labels = ['Product View', 'Related Option', 'Matching Family', 'Component Option'];
  const curated = PRODUCT_DETAIL_IMAGE_SETS[p.id];
  if (curated) return curated.map((src, index) => ({label: labels[index], src}));
  const sources = [productImage(p)];
  PRODUCT_IMAGE_SETS
    .filter(set => p.cats.includes(set.cat))
    .forEach(set => sources.push(...set.images));
  for (let i = 1; i <= 4; i++) sources.push(productImage(p, i));
  const uniqueSources = [...new Set(sources)].slice(0, 4);
  return labels.slice(0, uniqueSources.length).map((label, index) => ({
    label,
    src: uniqueSources[index]
  }));
}

function productSubitems(p) {
  const isAccessory = p.cats.includes('packaging-accessories');
  const isPackagingKit = /Kit|Set/.test(p.name) && !isAccessory;
  const componentNames = {
    p357:'External-Spring Pump',
    p358:'High-Output Pump',
    p359:'Fine-Mist Sprayer',
    p360:'28mm PCO Cap',
    p361:'26mm Crown Cap',
    p362:'Lug Twist-Off Cap',
    p384:'Foaming Trigger Sprayer',
    p385:'38mm Beverage Cap',
    p386:'Swing-Top Closure Set',
    p387:'Lock-Down Lotion Pump'
  };
  const componentUses = {
    p357:'Lotion / Personal Care',
    p358:'1L-5L Refill Jug',
    p359:'Hair / Body Mist',
    p360:'PET Beverage Closure',
    p361:'Beer / Sparkling Drink',
    p362:'Food Jar / Beverage',
    p384:'Foaming Application',
    p385:'Juice / Tea Bottle',
    p386:'Beer / Kombucha Bottle',
    p387:'Personal Care Bottle'
  };
  const closure = componentNames[p.id] || (p.cats.includes('beverage-closure') ? 'Cork / Cap / Pourer'
    : p.cats.includes('wine-bottle') ? 'Cork / ROPP'
    : p.cats.includes('spirit-bottle') ? 'Bar Top / Screw Cap'
    : p.cats.includes('glass-growler') ? 'Screw Cap / Swing Top'
    : p.cats.includes('beer-bottle') ? 'Crown / Swing Top'
    : p.cats.includes('juice-soda-bottle') ? 'Crown / Lug / Screw'
    : p.cats.includes('oil-vinegar-bottle') ? 'ROPP / Pourer'
    : p.cats.includes('sauce-syrup-bottle') ? 'Lug / Orifice Cap'
    : p.cats.includes('food-jar') ? 'Lug / CT Cap'
    : p.cats.includes('glass-apothecary') ? 'Screw / CRC Option'
    : p.cats.includes('glass-food') ? 'Lug / Screw Cap'
    : isAccessory ? 'Matched Component'
    : isPackagingKit ? 'Complete Set'
    : p.cats.includes('glass-rollon') ? 'Rollerball / Cap'
    : p.cats.includes('glass-dropper') ? 'Pipette Dropper'
    : p.cats.includes('glass-spray') ? 'Fine Mist Sprayer'
    : p.cats.includes('glass-ampoule') ? 'Stopper / Reducer'
    : p.cats.includes('glass-diffuser') ? 'Diffuser Cap'
    : p.cats.includes('glass-nail') ? 'Brush Cap'
    : p.cats.includes('glass-lotion') ? 'Pump / Sprayer'
    : p.cats.includes('glass-oil') ? 'Dropper / Roller'
    : p.cats.includes('glass-perfume') ? 'Fine Mist Pump'
    : p.cats.includes('plastic-airless-jar') ? 'Airless Disc'
    : p.cats.includes('plastic-airless') ? 'Airless Pump'
    : p.cats.includes('plastic-dual') ? 'Dual Chamber'
    : p.cats.includes('plastic-lotion') ? 'Pump / Flip Cap'
    : p.cats.includes('plastic-closure') ? 'Closure Part'
    : p.cats.includes('plastic-deodorant') ? 'Twist-Up Base'
    : p.cats.includes('plastic-makeup') ? 'Applicator / Compact'
    : p.cats.includes('plastic-travel') ? 'Mini Pump / Spray'
    : p.cats.includes('plastic-pump') ? 'Airless / Lotion Pump'
    : p.cats.includes('plastic-spray') ? 'Mist Sprayer'
    : p.cats.includes('plastic-tube') ? 'Flip / Screw Cap'
    : p.cats.includes('bamboo-makeup') ? 'Refill Mechanism'
    : p.cats.includes('alu-atomizer') ? 'Atomizer Pump'
    : p.cats.includes('alu-can') ? 'Valve / Pull-Top'
    : p.cats.includes('alu-bottle') ? 'Pump / Sprayer'
    : p.cats.includes('alu-jar') ? 'Screw Lid'
    : p.cats.includes('alu-tube') ? 'Screw / Needle Cap'
    : p.cats.includes('alu-tin') ? 'Screw / Press Lid'
    : p.cats.includes('eco-refill') ? 'Spout / Refill Cap'
    : p.cats.includes('paper-box') ? 'Insert / Sleeve'
    : 'Custom Closure');
  const use = componentUses[p.id] || (p.cats.includes('wine-bottle') ? 'Wine / Sparkling'
    : p.cats.includes('spirit-bottle') ? 'Whiskey / Spirits'
    : p.cats.includes('beer-bottle') ? 'Beer / Kombucha'
    : p.cats.includes('juice-soda-bottle') ? 'Juice / Soda'
    : p.cats.includes('oil-vinegar-bottle') ? 'Oil / Vinegar'
    : p.cats.includes('sauce-syrup-bottle') ? 'Sauce / Syrup'
    : p.cats.includes('beverage-closure') ? 'Bottle Closure'
    : p.cats.includes('food-jar') ? 'Food / Honey / Spice'
    : p.cats.includes('glass-apothecary') ? 'Supplement / Wellness'
    : p.cats.includes('glass-food') ? 'Food / Beverage'
    : isAccessory ? 'Accessory Matching'
    : isPackagingKit ? 'One-Stop Project'
    : p.cats.includes('glass-ampoule') ? 'Sample / Dose'
    : p.cats.includes('glass-diffuser') ? 'Home Fragrance'
    : p.cats.includes('glass-nail') ? 'Nail Care'
    : p.cats.includes('glass-spray') ? 'Mist / Toner'
    : p.cats.includes('glass-rollon') ? 'Perfume Oil'
    : p.cats.includes('glass-perfume') ? 'Fragrance'
    : p.cats.includes('glass-oil') ? 'Serum / Oil'
    : p.cats.includes('glass-lotion') ? 'Lotion / Toner'
    : p.cats.includes('plastic-closure') ? 'Components'
    : p.cats.includes('plastic-dual') ? 'Two-Step Formula'
    : p.cats.includes('plastic-airless-jar') ? 'Cream / Gel'
    : p.cats.includes('plastic-deodorant') ? 'Solid Balm'
    : p.cats.includes('plastic-makeup') ? 'Makeup'
    : p.cats.includes('plastic-travel') ? 'Travel / Sample'
    : p.cats.includes('plastic-lotion') ? 'Bath / Body'
    : p.cats.includes('eco-pulp') ? 'Gift Sets'
    : p.cats.includes('eco-refill') ? 'Refills'
    : p.cats.includes('plastic-tube') ? 'Cleanser / SPF'
    : p.cats.includes('bamboo-makeup') ? 'Makeup'
    : p.cats.includes('alu-atomizer') ? 'Travel Fragrance'
    : p.cats.includes('alu-can') ? 'Mist / Powder'
    : p.cats.includes('alu-bottle') ? 'Hair / Body'
    : p.cats.includes('alu-jar') ? 'Balm / Wax'
    : p.cats.includes('alu-tube') ? 'Balm / Cream'
    : p.cats.includes('paper-box') ? 'Gift Set'
    : p.cats.includes('alu-bag') ? 'Sample / Refill'
    : 'Skincare');
  return [
    {k:'Capacity', v:p.size},
    {k:'Finish', v:p.finish},
    {k:isAccessory || p.cats.includes('beverage-closure') ? 'Component' : 'Closure', v:closure},
    {k:'Best For', v:use}
  ];
}

function safeText(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const INDEXABLE_PRODUCT_IDS = new Set([
  'p1','p2','p4','p7','p18','p33','p34','p39','p43','p53',
  'p124','p131','p132','p150','p151','p164','p289','p293',
  'p294','p305','p315','p329','p331','p334','p335','p337',
  'p340','p344','p350','p351','p352','p363','p365','p367',
  'p369','p371','p372','p374','p380','p381','p169','p170',
  'p171','p172','p173','p181','p183','p203','p245','p357',
  'p358','p359','p384','p387'
]);

const PRODUCT_NAME_OVERRIDES = {
  p2: 'Plastic Airless Pump Bottle',
  p7: 'Glass Serum Dropper Bottle',
  p131: 'Glass Dropper Bottle with Push-and-Turn Cap',
  p289: 'Amber Dropper Kit with Push-and-Turn Cap',
  p357: 'External-Spring Lotion Pump',
  p358: 'High-Output Pump for Refill Jugs',
  p359: 'Hair and Body Fine-Mist Sprayer',
  p384: 'Foaming Trigger Sprayer Head',
  p387: 'Lock-Down Lotion Pump'
};

const PRODUCT_SLUG_OVERRIDES = {
  p131: 'child-resistant-glass-dropper-bottle-p131',
  p164: 'uv-black-glass-gel-nail-polish-bottle-p164',
  p289: 'child-resistant-amber-dropper-and-reducer-kit-p289',
  p171: 'treatment-pump-serum-bottles-p171',
  p183: 'airless-pump-actuator-replacement-p183',
  p203: 'salon-trigger-sprayer-p203',
  p357: 'external-spring-lotion-pump-p357',
  p358: 'high-output-refill-jug-pump-p358',
  p359: 'hair-body-fine-mist-sprayer-p359',
  p384: 'foaming-trigger-sprayer-head-p384',
  p387: 'lock-down-lotion-pump-p387'
};

function productDisplayName(p) {
  return PRODUCT_NAME_OVERRIDES[p?.id] || p?.name || '';
}

function productSeoUrl(p) {
  if (!p || !INDEXABLE_PRODUCT_IDS.has(p.id)) return '';
  const fixedSlug = PRODUCT_SLUG_OVERRIDES[p.id];
  if (fixedSlug) return `/products/${fixedSlug}/`;
  const slug = String(p.name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `/products/${slug}-${p.id}/`;
}

const FEATURED_CARD_AVIF = {
  p7: 'assets/product-photos/p7-0-480.avif',
  p2: 'assets/product-photos/p2-0-480.avif',
  p4: 'assets/product-photos/p4-0-480.avif',
  p40: 'assets/product-photos/p40-0-480.avif',
  p328: 'assets/brand/glass-beer-bottle-collection-2026-768.avif',
  ...Object.fromEntries(Array.from({length:59}, (_, i) => {
    const id = `p${i + 329}`;
    return [id, `assets/product-photos/${id}-0-480.avif`];
  }))
};

function pcHTML(p, small) {
  const bc = {hot:'b-hot',new:'b-new',eco:'b-eco',custom:'b-custom'}[p.badge]||'b-hot';
  const bl = {hot:'HOT',new:'NEW',eco:'MATERIAL',custom:'CUSTOM'}[p.badge]||'HOT';
  const img = productImage(p);
  const displayName = productDisplayName(p);
  const responsiveImage = FEATURED_CARD_AVIF[p.id]
    ? `<picture><source type="image/avif" srcset="${FEATURED_CARD_AVIF[p.id]}" sizes="(max-width:720px) calc(100vw - 48px), 25vw"><img src="${img}" alt="${safeText(displayName)} packaging product photo" width="480" height="480" loading="lazy" decoding="async" onerror="this.style.display='none';this.closest('picture').nextElementSibling.style.display='flex';"></picture>`
    : `<img src="${img}" alt="${safeText(displayName)} packaging product photo" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`;
  const chips = productSubitems(p).slice(0,3).map(x => `<span>${safeText(x.v.split('/')[0].trim())}</span>`).join('');
  const safeName = displayName.replace(/'/g, "\\'");
  const moqLabel = isConceptProduct(p) ? 'Planning MOQ' : 'MOQ';
  const seoUrl = productSeoUrl(p);
  const imageMarkup = seoUrl
    ? `<a class="pc-primary-link" href="${seoUrl}" onclick="event.stopPropagation()" aria-label="View ${safeText(displayName)} product page">${responsiveImage}<span class="img-fallback" style="display:none;">${p.ic}</span></a>`
    : `${responsiveImage}<span class="img-fallback" style="display:none;">${p.ic}</span>`;
  const nameMarkup = seoUrl
    ? `<a class="pc-name" href="${seoUrl}" onclick="event.stopPropagation()">${safeText(displayName)}</a>`
    : `<div class="pc-name">${safeText(displayName)}</div>`;
  return `<article class="pc fade-in" onclick="showDetail('${p.id}')">
    <div class="pc-img">${imageMarkup}</div>
    <span class="pc-badge ${bc}">${bl}</span>
    <div class="pc-info">
      ${nameMarkup}
      <div class="pc-specs">${p.mat} · ${p.size}</div>
      <div class="pc-subitems">${chips}</div>
      <div class="pc-bot">
        <div class="moq-val">${moqLabel} <strong>${p.moq} pcs</strong></div>
        <div class="card-actions">
          <button class="card-btn soft" onclick="event.stopPropagation();openModal('sample','${safeName}')">Sample</button>
          <button class="card-btn" onclick="event.stopPropagation();openModal('quote','${safeName}')">Quote</button>
        </div>
      </div>
    </div>
  </article>`;
}

// =========================================================== HOME GRID
function renderHomeGrid() {
  const g = document.getElementById('home-grid');
  if (!g || !hasProductData()) return;
  const featured = ['p7','p363','p4','p381'];
  const picked = featured.map(id => PRODS.find(p => p.id === id)).filter(Boolean);
  const fallback = PRODS.filter(p => p.cats.includes('hot') && !featured.includes(p.id)).slice(0, Math.max(0, 4 - picked.length));
  g.innerHTML = [...picked, ...fallback].slice(0,4).map(p => pcHTML(p)).join('');
}

// =========================================================== FILTER PRODUCTS
let currentProductCat = 'hot';
let currentProductPage = 1;
let currentProductSort = 'default';
let currentProductView = 'grid';
const PRODUCTS_PER_PAGE = 8;

function setProductFiltersOpen(sidebar, open) {
  if (!sidebar) return;
  sidebar.classList.toggle('filters-open', open);
  const toggle = sidebar.querySelector('.mobile-filter-toggle');
  if (!toggle) return;
  toggle.setAttribute('aria-expanded', String(open));
  const indicator = toggle.querySelector('span');
  if (indicator) indicator.textContent = open ? '−' : '+';
}

function toggleProductFilters(button) {
  const sidebar = button && button.closest('.sidebar');
  if (sidebar) setProductFiltersOpen(sidebar, !sidebar.classList.contains('filters-open'));
}

function filterCat(el, cat) {
  document.querySelectorAll('#page-products .sb-link').forEach(l => l.classList.remove('active'));
  if (el) el.classList.add('active');
  filterCatByKey(cat, 1);
  if (el && window.matchMedia('(max-width: 720px)').matches) {
    setProductFiltersOpen(el.closest('.sidebar'), false);
  }
}

function getProductsByCat(cat) {
  if (!hasProductData()) return [];
  if (PRIMARY_MATERIAL_SETS[cat]) return PRODS.filter(p => PRIMARY_MATERIAL_SETS[cat].has(p.id));
  return PRODS.filter(p => {
    if (cat === 'glass') return p.cats.some(c => c.startsWith('glass')) || p.cats.includes('glass');
    if (cat === 'plastic') return p.cats.some(c => c.startsWith('plastic')) || p.cats.includes('plastic');
    if (cat === 'bamboo') return p.cats.some(c => c.startsWith('bamboo'));
    if (cat === 'alu') return p.cats.some(c => c.startsWith('alu'));
    if (cat === 'eco') return p.cats.some(c => ['eco','bio','paper-tube','paper-box'].includes(c));
    if (cat === 'beverage') return p.cats.includes('beverage');
    if (cat === 'components') return p.cats.some(c => ['plastic-closure','beverage-closure','packaging-accessories'].includes(c));
    return p.cats.includes(cat);
  });
}

function updateCategoryCounts() {
  if (!hasProductData()) return;
  document.querySelectorAll('[data-total-products]').forEach(el => {
    el.textContent = PRODS.length;
  });
  document.querySelectorAll('[data-cat-count]').forEach(el => {
    el.textContent = getProductsByCat(el.dataset.catCount).length;
  });
}

function sortedProducts(products) {
  const list = [...products];
  if (currentProductSort === 'newest') {
    return list.sort((a, b) => (b.badge === 'new') - (a.badge === 'new') || Number(b.id.slice(1)) - Number(a.id.slice(1)));
  }
  if (currentProductSort === 'popular') {
    return list.sort((a, b) => (b.badge === 'hot') - (a.badge === 'hot') || Number(a.moq) - Number(b.moq));
  }
  if (currentProductSort === 'moq') {
    return list.sort((a, b) => Number(a.moq) - Number(b.moq));
  }
  const badgeRank = {hot: 4, new: 3, eco: 2, custom: 1};
  return list.sort((a, b) => (badgeRank[b.badge] || 0) - (badgeRank[a.badge] || 0) || Number(b.id.slice(1)) - Number(a.id.slice(1)));
}

function setProductSort(value) {
  currentProductSort = value || 'default';
  filterCatByKey(currentProductCat, 1);
}

function setProductView(view) {
  currentProductView = view === 'list' ? 'list' : 'grid';
  const grid = document.getElementById('products-grid');
  if (grid) grid.classList.toggle('list-view', currentProductView === 'list');
  document.querySelectorAll('#page-products .view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === currentProductView);
  });
}

function filterCatByKey(cat, page = 1) {
  currentProductCat = cat;
  currentProductPage = page;
  // Update sidebar active
  let activeSidebarLink = null;
  document.querySelectorAll('#page-products .sb-link').forEach(l => {
    l.classList.remove('active');
    const oc = l.getAttribute('onclick');
    if (oc && oc.includes("'"+cat+"'")) {
      l.classList.add('active');
      activeSidebarLink = l;
    }
  });
  const activeGroup = activeSidebarLink && activeSidebarLink.closest('.sb-group');
  if (activeGroup) {
    document.querySelectorAll('#page-products .sb-group').forEach(group => {
      group.open = group === activeGroup;
    });
  }
  const title = CAT_TITLES[cat] || cat;
  setMeta('products', cat);
  const t = document.getElementById('prod-title'); if(t) t.textContent = title;
  const b = document.getElementById('bc-prod'); if(b) b.textContent = title;
  const c = document.getElementById('prod-cnt');
  const copy = document.getElementById('cat-copy');
  if (copy) {
    const [copyTitle, copyText] = CAT_COPY[cat] || ['Cosmetic Packaging Products', 'Browse factory-direct cosmetic packaging with OEM/ODM service, custom decoration, sample support and global shipping.'];
    copy.innerHTML = `<h3>${copyTitle}</h3><p>${copyText}</p>`;
  }
  const hash = page > 1 ? `#products/${cat}/page-${page}` : `#products/${cat}`;
  history.replaceState(null, '', hash);
  if (!hasProductData()) {
    if (c) c.textContent = 'Loading Products';
    showProductLoading('products-grid');
    renderPagination(1, 1);
    ensureProductData().then(() => filterCatByKey(cat, page)).catch(() => {});
    return;
  }
  updateCategoryCounts();
  const filtered = getProductsByCat(cat);
  if (c) c.textContent = filtered.length + ' Products';
  renderProductPage(filtered, page);
}

function renderProductPage(products, page) {
  const ordered = sortedProducts(products);
  const totalPages = Math.max(1, Math.ceil(ordered.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  currentProductPage = safePage;
  const start = (safePage - 1) * PRODUCTS_PER_PAGE;
  const visible = ordered.slice(start, start + PRODUCTS_PER_PAGE);
  const g = document.getElementById('products-grid');
  if (g) {
    g.innerHTML = visible.length ? visible.map(p => pcHTML(p)).join('') : '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px;">No products in this category yet.</p>';
    g.classList.toggle('list-view', currentProductView === 'list');
  }
  renderPagination(totalPages, safePage);
}

function renderPagination(totalPages, activePage) {
  const wrap = document.getElementById('products-pagination');
  if (!wrap) return;
  if (totalPages <= 1) {
    wrap.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pg-btn${i === activePage ? ' active' : ''}" data-page="${i}" aria-label="Go to product page ${i}">${i}</button>`;
  }
  html += `<button class="pg-btn wide" data-page="${activePage === totalPages ? 1 : activePage + 1}" aria-label="Next product page">Next ›</button>`;
  wrap.innerHTML = html;
}

function goProductPage(page) {
  if (!hasProductData()) {
    showProductLoading('products-grid');
    ensureProductData().then(() => goProductPage(page)).catch(() => {});
    return;
  }
  const products = getProductsByCat(currentProductCat);
  renderProductPage(products, page);
  history.replaceState(null, '', `#products/${currentProductCat}/page-${currentProductPage}`);
  const grid = document.getElementById('products-grid');
  if (grid) grid.scrollIntoView({behavior:'smooth', block:'start'});
}

function showDetail(pid) {
  if (!hasProductData()) {
    const title = document.getElementById('det-name');
    const desc = document.getElementById('det-desc');
    const main = document.getElementById('det-main-img');
    const thumbs = document.getElementById('det-thumbs');
    const related = document.getElementById('related-grid');
    if (title) title.textContent = 'Loading product details...';
    if (desc) desc.textContent = 'Preparing packaging specifications, images and OEM options.';
    if (main) main.textContent = 'Loading';
    if (thumbs) thumbs.innerHTML = '';
    if (related) related.innerHTML = '';
    go('detail', null, true);
    ensureProductData().then(() => showDetail(pid)).catch(() => {});
    return;
  }
  const p = PRODS.find(x => x.id === pid);
  if (!p) return;
  document.getElementById('bc-detail').textContent = p.name;
  document.getElementById('det-name').textContent = p.name;
  document.getElementById('det-desc').textContent = p.desc;
  document.getElementById('det-tab-desc').textContent = p.tab;
  document.getElementById('det-tab-spec').textContent = `Catalog capacity: ${p.size}. Catalog finish: ${p.finish}. Confirm dimensions, tolerances and unit weight in the current project drawing.`;
  document.getElementById('det-tab-custom').textContent = `Decoration, color and tooling routes depend on the ${p.mat} construction, geometry, artwork, quantity and use. Approve the production-intent reference before bulk planning.`;
  document.getElementById('det-tab-ship').textContent = 'Confirm sample availability, packing, shipment route and timing for the exact components, quantity, destination and approval stage.';
  const mainImg = productImage(p);
  document.getElementById('det-main-img').innerHTML = `<img src="${mainImg}" alt="${safeText(p.name)} main product photo" onerror="this.parentElement.textContent='${p.ic}'">`;
  document.getElementById('det-subitems').innerHTML = productSubitems(p).map(x => `<div class="variant-pill"><div class="k">${safeText(x.k)}</div><div class="v">${safeText(x.v)}</div></div>`).join('');
  const quoteBtn = document.getElementById('det-quote-btn');
  const sampleBtn = document.getElementById('det-sample-btn');
  if (quoteBtn) quoteBtn.onclick = () => openModal('quote', p.name);
  if (sampleBtn) sampleBtn.onclick = () => openModal('sample', p.name);
  document.getElementById('det-thumbs').innerHTML = productGalleryImages(p).map((img,i) =>
    `<div class="detail-thumb${i===0?' active':''}" onclick="setThumb(this,'${img.src}','${safeText(p.name)} ${img.label}')"><img src="${img.src}" alt="${safeText(p.name)} ${img.label}" loading="lazy" onerror="this.parentElement.textContent='${p.ic}'"></div>`
  ).join('');
  const bc = {hot:'b-hot',new:'b-new',eco:'b-eco',custom:'b-custom'}[p.badge]||'b-hot';
  const bl = {hot:'HOT',new:'NEW',eco:'MATERIAL',custom:'CUSTOM'}[p.badge]||'HOT';
  document.getElementById('det-badges').innerHTML = `<span class="pc-badge ${bc}" style="position:static;">${bl}</span>`;
  const conceptProduct = isConceptProduct(p);
  document.getElementById('det-specs').innerHTML = [
    ['Material', p.mat],['Capacity / Size', p.size],['Finish', p.finish],
    [conceptProduct ? 'Planning MOQ' : 'MOQ', p.moq + (conceptProduct ? ' pcs; confirm by project' : ' pcs per color')],
    ['Sample Route', conceptProduct ? 'Confirmed after drawing and tooling review' : 'Confirm availability, charges and timing for the selected configuration'],
    ['Production Timing', 'Confirmed after specification and sample approval'],
    ['Documentation', 'Confirm project-specific requirements with our team']
  ].map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const sizes = p.size.split('/').map(s => s.trim());
  document.getElementById('det-sizes').innerHTML = sizes.map((s,i) =>
    `<button class="opt-btn${i===0?' active':''}" onclick="setOpt(this)">${s}</button>`
  ).join('');
  document.getElementById('det-finishes').innerHTML = `<button class="opt-btn active">${safeText(p.finish)}</button>`;
  const related = PRODS.filter(x => x.id !== pid && x.cats.some(c => p.cats.includes(c))).slice(0,4);
  document.getElementById('related-grid').innerHTML = related.map(x => pcHTML(x)).join('');
  document.querySelectorAll('#page-detail .tab-pane').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#page-detail .tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-desc').classList.add('active');
  document.querySelector('#page-detail .tab-btn').classList.add('active');

  go('detail');
  const productTitle = `${p.name} | OEM Cosmetic Packaging Supplier | GloryStarPack`;
  const productDesc = `${p.desc} ${conceptProduct ? `Planning MOQ ${p.moq} pcs; confirm by project.` : `MOQ ${p.moq} pcs.`} Material: ${p.mat}. Finish: ${p.finish}. Request samples or OEM customization from GloryStarPack.`;
  document.title = productTitle;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute('content', productDesc);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogImageAlt = document.querySelector('meta[property="og:image:alt"]');
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  const twImage = document.querySelector('meta[name="twitter:image"]');
  const twImageAlt = document.querySelector('meta[name="twitter:image:alt"]');
  if (ogTitle) ogTitle.setAttribute('content', productTitle);
  if (ogDesc) ogDesc.setAttribute('content', productDesc);
  const productImageUrl = `https://www.glorystarpack.com/${mainImg.replace(/^\/+/, '')}`;
  if (ogImage) ogImage.setAttribute('content', productImageUrl);
  if (ogImageAlt) ogImageAlt.setAttribute('content', `${p.name} product photo`);
  if (twTitle) twTitle.setAttribute('content', productTitle);
  if (twDesc) twDesc.setAttribute('content', productDesc);
  if (twImage) twImage.setAttribute('content', productImageUrl);
  if (twImageAlt) twImageAlt.setAttribute('content', `${p.name} product photo`);
  const staticProductUrl = productSeoUrl(p);
  const detailCanonical = staticProductUrl
    ? `https://www.glorystarpack.com${staticProductUrl}`
    : 'https://www.glorystarpack.com/products/product-index/';
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (canonicalEl) canonicalEl.setAttribute('href', detailCanonical);
  if (ogUrl) ogUrl.setAttribute('content', detailCanonical);
  setActiveNav('products', p.cats.find(c => c !== 'hot') || 'hot');
  history.replaceState(null, '', `#detail/${pid}`);
}

function setThumb(el, src, alt) {
  el.closest('.detail-thumbs').querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('det-main-img').innerHTML = `<img src="${src}" alt="${safeText(alt || 'Product photo')}" onerror="this.parentElement.textContent='📦'">`;
}
function setOpt(el) {
  el.closest('.opt-group').querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// =========================================================== TABS (detail)
function switchTab(btn, id) {
  const bar = btn.closest('.tab-bar');
  bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['tab-desc','tab-spec','tab-custom','tab-ship'].forEach(t => {
    const el = document.getElementById(t); if(el) el.classList.remove('active');
  });
  const el = document.getElementById(id); if(el) el.classList.add('active');
}

// =========================================================== SEARCH
function doSearch(q, preserveUrl = false) {
  q = (q||'').trim();
  if (!q) return;
  if (!hasProductData()) {
    go('search', null, true);
    if (!preserveUrl) history.replaceState(null, '', `?q=${encodeURIComponent(q)}`);
    setSearchMeta(q, 0);
    const title = document.getElementById('search-title');
    const empty = document.getElementById('search-empty');
    const input = document.getElementById('searchInput');
    if (title) title.textContent = `Searching: "${q}"`;
    if (empty) empty.style.display = 'none';
    if (input) input.value = q;
    showProductLoading('search-grid', 'Searching packaging products...');
    ensureProductData().then(() => doSearch(q, true)).catch(() => {});
    return;
  }
  const query = q.toLowerCase();
  const filtered = PRODS.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.mat.toLowerCase().includes(query) ||
    p.finish.toLowerCase().includes(query) ||
    p.size.toLowerCase().includes(query) ||
    p.desc.toLowerCase().includes(query) ||
    p.tab.toLowerCase().includes(query) ||
    p.cats.some(c => c.includes(query))
  );
  go('search', null, true);
  if (!preserveUrl) history.replaceState(null, '', `?q=${encodeURIComponent(q)}`);
  setSearchMeta(q, filtered.length);
  document.getElementById('search-title').textContent = `Search: "${q}" — ${filtered.length} result${filtered.length!==1?'s':''}`;
  const g = document.getElementById('search-grid');
  const empty = document.getElementById('search-empty');
  if (filtered.length) {
    g.style.display = 'grid';
    empty.style.display = 'none';
    g.innerHTML = filtered.map(p => pcHTML(p)).join('');
  } else {
    g.style.display = 'none';
    empty.style.display = 'block';
  }
  document.getElementById('searchInput').value = q;
}

window.GSP_CATALOG = Object.freeze({
  go,
  showDetail,
  doSearch,
  filterCat,
  filterCatByKey,
  toggleProductFilters,
  setProductSort,
  setProductView,
  goProductPage,
  setThumb,
  setOpt,
  switchTab,
  renderHomeGrid
});
})();
