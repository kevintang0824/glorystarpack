function currentAttribute(value) {
  return value ? ` aria-current="${value}"` : '';
}

function stableCategoryHref(category) {
  if (category === 'hot' || category === 'all') return '/products/product-index/';
  return `/?category=${encodeURIComponent(category)}`;
}

const categoryLink = (category, label, href = stableCategoryHref(category)) =>
  `<a class="gsp-products-child-link" data-product-category="${category}" href="${href}">${label}</a>`;

const categoryGroup = (code, label, links) => `<details class="gsp-products-group">
  <summary><span class="gsp-products-group-label"><span class="gsp-products-icon" aria-hidden="true">${code}</span>${label}</span><span class="gsp-products-plus" aria-hidden="true"></span></summary>
  <div class="gsp-products-children">${links.join('')}</div>
</details>`;

export function productsNavigationPanelMarkup() {
  const glass = categoryGroup('GL', 'Glass Packaging', [
    categoryLink('material-glass', 'All Glass Products', '/products/glass-packaging/'),
    categoryLink('glass-food', 'Food Bottles &amp; Jars'),
    categoryLink('food-jar', 'Honey, Spice &amp; Food Jars'),
    categoryLink('glass-apothecary', 'Apothecary &amp; Supplement'),
    categoryLink('beverage', 'Beverage Bottles', '/products/beverage-bottles/'),
    categoryLink('wine-bottle', 'Wine Bottles', '/products/wine-bottles/'),
    categoryLink('spirit-bottle', 'Liquor &amp; Spirit Bottles', '/products/liquor-bottles/'),
    categoryLink('beer-bottle', 'Beer &amp; Growler Bottles', '/products/beer-bottles/'),
    categoryLink('glass-decanter', 'Decanters &amp; Flasks'),
    categoryLink('juice-soda-bottle', 'Juice &amp; Soda Bottles'),
    categoryLink('oil-vinegar-bottle', 'Oil &amp; Vinegar Bottles'),
    categoryLink('sauce-syrup-bottle', 'Sauce &amp; Syrup Bottles'),
    categoryLink('glass-oil', 'Essential Oil Bottles'),
    categoryLink('glass-dropper', 'Dropper Bottles', '/products/serum-dropper-bottles/'),
    categoryLink('glass-rollon', 'Roll-On Bottles'),
    categoryLink('glass-spray', 'Spray Bottles'),
    categoryLink('glass-ampoule', 'Ampoules &amp; Vials'),
    categoryLink('glass-jar', 'Cream Jars', '/products/cream-jars/'),
    categoryLink('glass-lotion', 'Lotion Bottles'),
    categoryLink('glass-perfume', 'Perfume Bottles', '/products/perfume-bottles/'),
    categoryLink('glass-diffuser', 'Diffuser Bottles'),
    categoryLink('glass-violet', 'Violet Glass Bottles'),
    categoryLink('glass-nail', 'Nail Polish Bottles')
  ]);

  const plastic = categoryGroup('PL', 'Plastic Packaging', [
    categoryLink('material-plastic', 'All Plastic Products', '/products/plastic-packaging/'),
    categoryLink('plastic-pet', 'PET &amp; PETG Bottles'),
    categoryLink('plastic-hdpe', 'HDPE Bottles'),
    categoryLink('plastic-lotion', 'Lotion Bottles'),
    categoryLink('plastic-pump', 'Pump Bottles'),
    categoryLink('plastic-airless', 'Airless Bottles', '/products/airless-pump-bottles/'),
    categoryLink('plastic-airless-jar', 'Airless Jars'),
    categoryLink('plastic-dual', 'Dual-Chamber Packaging'),
    categoryLink('plastic-spray', 'Spray Bottles'),
    categoryLink('plastic-foam', 'Foamer Bottles'),
    categoryLink('plastic-jar', 'Plastic Jars', '/products/cosmetic-jars/'),
    categoryLink('plastic-acrylic', 'Acrylic Containers'),
    categoryLink('plastic-tube', 'Cosmetic Tubes', '/products/cosmetic-tubes/'),
    categoryLink('plastic-deodorant', 'Deodorant Sticks'),
    categoryLink('plastic-makeup', 'Makeup Packaging', '/products/makeup-packaging/'),
    categoryLink('plastic-travel', 'Travel &amp; Sample Sets')
  ]);

  const metal = categoryGroup('AL', 'Aluminum &amp; Metal', [
    categoryLink('material-metal', 'All Metal Products', '/products/aluminum-packaging/'),
    categoryLink('alu-bottle', 'Aluminum Bottles'),
    categoryLink('alu-can', 'Aluminum Cans', '/products/aluminum-cosmetic-cans/'),
    categoryLink('alu-tin', 'Aluminum Tins'),
    categoryLink('alu-tube', 'Aluminum Tubes'),
    categoryLink('alu-atomizer', 'Aluminum Atomizers'),
    categoryLink('alu-jar', 'Aluminum Jars')
  ]);

  const bamboo = categoryGroup('BW', 'Bamboo &amp; Wood', [
    categoryLink('material-bamboo-wood', 'All Bamboo Products', '/products/bamboo-packaging/'),
    categoryLink('bamboo-bottle', 'Bamboo Bottles'),
    categoryLink('bamboo-jar', 'Bamboo Jars'),
    categoryLink('bamboo-cap', 'Bamboo Caps &amp; Lids'),
    categoryLink('bamboo-dropper', 'Bamboo Dropper Bottles'),
    categoryLink('bamboo-rollon', 'Bamboo Roll-On Bottles'),
    categoryLink('bamboo-makeup', 'Bamboo Makeup Series')
  ]);

  const paper = categoryGroup('PP', 'Paper &amp; Molded Pulp', [
    categoryLink('material-paper-pulp', 'All Paper &amp; Pulp'),
    categoryLink('cosmetic-paper-packaging', 'Cosmetic Paper Packaging'),
    categoryLink('mailer-box', 'Mailer Boxes'),
    categoryLink('paper-bag', 'Paper Bags'),
    categoryLink('gift-box', 'Gift Boxes'),
    categoryLink('food-paper-packaging', 'Food Paper Packaging'),
    categoryLink('candle-packaging', 'Candle Packaging'),
    categoryLink('clothing-packaging', 'Clothing Packaging'),
    categoryLink('retail-display', 'Retail Displays'),
    categoryLink('labels-cards', 'Labels, Cards &amp; Hang Tags'),
    categoryLink('paper-tube', 'Paper Tubes'),
    categoryLink('paper-box', 'Paper Boxes &amp; Retail Kits'),
    categoryLink('eco-pulp', 'Molded Pulp Inserts')
  ]);

  const flexible = categoryGroup('FL', 'Flexible Films &amp; Laminates', [
    categoryLink('material-flexible', 'All Flexible Packaging'),
    categoryLink('flexible-pouch', 'Pouches &amp; Sachets', '/products/refill-pouch-packaging/'),
    categoryLink('alu-bag', 'Aluminum &amp; Laminated Bags')
  ]);

  const bio = categoryGroup('BI', 'Bio-Based Materials', [
    categoryLink('material-bio', 'All Bio-Based Products'),
    categoryLink('bio', 'Biodegradable Material Options'),
    categoryLink('eco-wheat', 'Wheat-Straw Packaging')
  ]);

  const mixed = categoryGroup('MX', 'Mixed-Material Kits', [
    categoryLink('material-mixed', 'All Mixed-Material Kits', '/products/cosmetic-packaging-kits/')
  ]);

  const sustainable = categoryGroup('RC', 'Recycled &amp; Refill', [
    categoryLink('eco', 'All Sustainable Options', '/products/eco-friendly-packaging/'),
    categoryLink('plastic-pcr', 'PCR Plastic Packaging'),
    categoryLink('eco-refill', 'Refill Systems', '/products/refill-packaging/')
  ]);

  const components = categoryGroup('CP', 'Pumps, Caps &amp; Components', [
    categoryLink('components', 'All Components', '/products/cosmetic-pumps-closures/'),
    categoryLink('plastic-closure', 'Pumps, Caps &amp; Closures'),
    categoryLink('beverage-closure', 'Beverage Closures'),
    categoryLink('packaging-accessories', 'Packaging Accessories', '/products/cosmetic-packaging-accessories/')
  ]);

  const applications = categoryGroup('AP', 'Product Use', [
    categoryLink('home-fragrance', 'Home Fragrance', '/products/home-fragrance-packaging/'),
    categoryLink('personal-care', 'Personal Care', '/products/personal-care-packaging/'),
    categoryLink('men-grooming', 'Men’s Grooming', '/products/mens-grooming-packaging/'),
    categoryLink('spa-body', 'Spa &amp; Body Care'),
    categoryLink('hotel-amenity', 'Hotel Amenities', '/products/hotel-amenity-packaging/')
  ]);

  return `<div class="gsp-products-panel">
  <div class="gsp-products-shortcuts">
    <a class="gsp-products-shortcut" data-product-category="all" href="/products/product-index/"><span>All Products</span><span class="gsp-products-count" data-total-products>2353</span></a>
    <a class="gsp-products-shortcut" data-product-category="hot" href="/products/product-index/"><span>★ Hot Picks</span><span class="gsp-products-count" data-cat-count="hot">142</span></a>
  </div>
  <p class="gsp-products-heading">Shop by material</p>
  ${glass}${plastic}${metal}${bamboo}${paper}${flexible}${bio}${mixed}
  <p class="gsp-products-heading">Sustainable options</p>
  ${sustainable}
  <p class="gsp-products-heading">Components &amp; applications</p>
  ${components}${applications}
</div>`;
}

export function primaryNavigationMarkup({
  productsCurrent = '',
  guidesCurrent = '',
  aboutCurrent = ''
} = {}) {
  return `<nav class="gsp-primary-nav" aria-label="Primary navigation">
  <details class="gsp-nav-products">
    <summary${currentAttribute(productsCurrent)}>Products <span class="gsp-nav-caret" aria-hidden="true">▾</span></summary>
    ${productsNavigationPanelMarkup()}
  </details>
  <a${currentAttribute(guidesCurrent)} href="/cosmetic-packaging-guides/">Buyer Guides</a>
  <a${currentAttribute(aboutCurrent)} href="/about/">About</a>
</nav>`;
}
