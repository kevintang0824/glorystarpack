import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { localeCodes, copy, t } from '../data/site-locales.mjs';
import { categories, domainNotes, serviceTitles, topics, topicNotes } from '../data/localized-topics.mjs';
import { productNames } from '../data/localized-products.mjs';
import { localizedCleanup, translationOverrides } from '../data/translation-overrides.mjs';
import { alternateLanguageLinks, installLanguageSwitcher, localePath } from './language-switcher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.glorystarpack.com';
const localeIndex = language => localeCodes.indexOf(language);
const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const escapeText = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripTags = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
const translationDictionaries = Object.fromEntries(localeCodes.map(language => {
  const file = path.join(root, 'data', 'full-translations', `${language}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing complete static translation dictionary: ${path.relative(root, file)}`);
  return [language, JSON.parse(fs.readFileSync(file, 'utf8'))];
}));
const sourceFiles = execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split('\n')
  .filter(file => file && file !== 'google130558f0f0763df4.html' && !localeCodes.some(language => file.startsWith(`${language}/`)));
const routeForFile = file => file === 'index.html' ? '/' : file === '404.html' ? '/404.html' : `/${file.replace(/index\.html$/, '')}`;
const fileForLocale = (language, file) => file === '404.html' ? path.join(root, language, '404.html') : path.join(root, language, file);
const slugForRoute = route => route.split('/').filter(Boolean).at(-1) || '';

const commonUi = {
  'Skip to main content': ['Aller au contenu principal','Ir al contenido principal','Ir para o conteúdo principal','Перейти к основному содержимому','跳到主要内容'],
  'Custom Bottles & Packaging': ['Flacons et emballages sur mesure','Botellas y envases a medida','Frascos e embalagens por medida','Флаконы и упаковка на заказ','定制瓶罐与包装'],
  'Primary navigation': ['Navigation principale','Navegación principal','Navegação principal','Основная навигация','主导航'],
  'Products': ['Produits','Productos','Produtos','Продукция','产品'],
  'All Products': ['Tous les produits','Todos los productos','Todos os produtos','Вся продукция','全部产品'],
  '★ Hot Picks': ['★ Sélection','★ Destacados','★ Destaques','★ Популярное','★ 热门产品'],
  'Shop by material': ['Choisir par matière','Comprar por material','Escolher por material','По материалу','按材质选择'],
  'Sustainable options': ['Options durables','Opciones sostenibles','Opções sustentáveis','Экологичные варианты','可持续方案'],
  'Components & applications': ['Composants et usages','Componentes y usos','Componentes e aplicações','Компоненты и назначение','组件与用途'],
  'Buyer Guides': ['Guides d’achat','Guías de compra','Guias de compra','Руководства по закупке','采购指南'],
  'About': ['À propos','Sobre nosotros','Sobre nós','О компании','关于我们'],
  'Request a Quote': ['Demander un devis','Solicitar presupuesto','Pedir orçamento','Запросить расчёт','获取报价'],
  'Get a Quote': ['Obtenir un devis','Obtener presupuesto','Pedir orçamento','Запросить расчёт','获取报价'],
  'Get a Custom Quote': ['Demander un devis personnalisé','Solicitar presupuesto personalizado','Pedir orçamento personalizado','Запросить индивидуальный расчёт','获取定制报价'],
  'Request Bottle Quote': ['Demander un devis de flacons','Solicitar presupuesto de botellas','Pedir orçamento de frascos','Запросить расчёт на бутылки','获取瓶型报价'],
  'Request Samples': ['Demander des échantillons','Solicitar muestras','Pedir amostras','Запросить образцы','申请样品'],
  'Quote': ['Devis','Presupuesto','Orçamento','Расчёт','报价'],
  'Sample': ['Échantillon','Muestra','Amostra','Образец','样品'],
  'Email RFQ': ['Envoyer la demande par e-mail','Enviar la solicitud por correo','Enviar o pedido por e-mail','Отправить запрос по e-mail','邮件发送询价'],
  'WhatsApp RFQ': ['Envoyer la demande par WhatsApp','Enviar la solicitud por WhatsApp','Enviar o pedido por WhatsApp','Отправить запрос в WhatsApp','WhatsApp 发送询价'],
  'View product details': ['Voir les détails du produit','Ver detalles del producto','Ver detalhes do produto','Открыть карточку товара','查看产品详情'],
  'Search Results': ['Résultats de la recherche','Resultados de búsqueda','Resultados da pesquisa','Результаты поиска','搜索结果'],
  'Browse product categories': ['Parcourir les catégories','Explorar categorías de productos','Explorar categorias de produtos','Открыть категории товаров','浏览产品类别'],
  'Contact Us': ['Nous contacter','Contáctenos','Contacte-nos','Связаться с нами','联系我们'],
  'Previous': ['Précédent','Anterior','Anterior','Назад','上一页'],
  'Next': ['Suivant','Siguiente','Seguinte','Далее','下一页'],
  'Home': ['Accueil','Inicio','Início','Главная','首页'],
  'Breadcrumb': ['Fil d’Ariane','Ruta de navegación','Navegação estrutural','Навигационная цепочка','面包屑导航'],
  'Product Index': ['Catalogue produits','Índice de productos','Índice de produtos','Каталог продукции','产品目录'],
  'Packaging Insights': ['Conseils sur l’emballage','Consejos de envasado','Informações sobre embalagens','Материалы об упаковке','包装知识'],
  'Site Index': ['Plan du site','Mapa del sitio','Mapa do site','Карта сайта','网站导航'],
  'Reference': ['Référence','Referencia','Referência','Артикул','产品型号'],
  'Material': ['Matière','Material','Material','Материал','材质'],
  'Capacity / Dimensions': ['Capacité / dimensions','Capacidad / medidas','Capacidade / dimensões','Объём / размеры','容量 / 尺寸'],
  'Finish': ['Finition','Acabado','Acabamento','Отделка','表面工艺'],
  'Planning quantity': ['Quantité indicative','Cantidad orientativa','Quantidade indicativa','Ориентировочное количество','参考数量'],
  'Related products': ['Produits associés','Productos relacionados','Produtos relacionados','Похожие товары','相关产品'],
  'Related procurement notes': ['Notes d’achat associées','Notas de compra relacionadas','Notas de compra relacionadas','Связанные материалы','相关采购资料'],
  'More packaging insights': ['Plus de conseils','Más consejos de envasado','Mais informações sobre embalagens','Другие материалы','更多包装知识'],
  'Continue researching': ['Poursuivre la recherche','Seguir investigando','Continuar a pesquisa','Продолжить изучение','继续了解'],
  'Start a packaging project': ['Démarrer un projet d’emballage','Iniciar un proyecto de envase','Iniciar um projeto de embalagem','Начать проект упаковки','启动包装项目'],
  'Xiamen, Fujian, China': ['Xiamen, Fujian, Chine','Xiamen, Fujian, China','Xiamen, Fujian, China','Сямынь, Фуцзянь, Китай','中国福建省厦门市'],
  'Footer navigation': ['Navigation de pied de page','Navegación de pie de página','Navegação de rodapé','Навигация внизу страницы','页脚导航']
};

const packagingTerms = {
  'Glass Packaging': ['Emballages en verre','Envases de vidrio','Embalagens de vidro','Стеклянная упаковка','玻璃包装'],
  'Plastic Packaging': ['Emballages en plastique','Envases de plástico','Embalagens de plástico','Пластиковая упаковка','塑料包装'],
  'Aluminum & Metal': ['Aluminium et métal','Aluminio y metal','Alumínio e metal','Алюминий и металл','铝制与金属包装'],
  'Bamboo & Wood': ['Bambou et bois','Bambú y madera','Bambu e madeira','Бамбук и дерево','竹木包装'],
  'Perfume Bottles': ['Flacons de parfum','Frascos de perfume','Frascos de perfume','Парфюмерные флаконы','香水瓶'],
  'Glass Perfume Bottles': ['Flacons de parfum en verre','Frascos de perfume de vidrio','Frascos de perfume de vidro','Стеклянные парфюмерные флаконы','玻璃香水瓶'],
  'Cream Jars': ['Pots pour crèmes','Tarros para cremas','Boiões para cremes','Банки для крема','面霜罐'],
  'Glass Cream Jars': ['Pots en verre pour crèmes','Tarros de vidrio para cremas','Boiões de vidro para cremes','Стеклянные банки для крема','玻璃面霜罐'],
  'Nail Polish Bottles': ['Flacons pour vernis à ongles','Frascos para esmalte de uñas','Frascos para verniz de unhas','Флаконы для лака для ногтей','指甲油瓶'],
  'Serum Dropper Bottles': ['Flacons compte-gouttes pour sérums','Frascos cuentagotas para sérums','Frascos conta-gotas para séruns','Флаконы с пипеткой для сывороток','精华滴管瓶'],
  'Serum Droppers': ['Compte-gouttes pour sérums','Cuentagotas para sérums','Conta-gotas para séruns','Пипетки для сывороток','精华滴管瓶'],
  'Dropper Bottles': ['Flacons compte-gouttes','Frascos cuentagotas','Frascos conta-gotas','Флаконы с пипеткой','滴管瓶'],
  'Airless Bottles': ['Flacons airless','Frascos airless','Frascos airless','Вакуумные флаконы','真空瓶'],
  'Pump Bottles': ['Flacons à pompe','Frascos con bomba','Frascos com bomba','Флаконы с помпой','泵瓶'],
  'Pumps, Caps & Components': ['Pompes, bouchons et composants','Bombas, tapas y componentes','Bombas, tampas e componentes','Помпы, крышки и комплектующие','泵头、瓶盖与组件'],
  'Custom Glass Bottle Manufacturer': ['Fabricant de bouteilles en verre sur mesure','Fabricante de botellas de vidrio a medida','Fabricante de garrafas de vidro por medida','Производитель стеклянных бутылок на заказ','定制玻璃瓶制造商'],
  'for Beverage & Beauty Brands': ['pour les marques de boissons et de beauté','para marcas de bebidas y belleza','para marcas de bebidas e beleza','для брендов напитков и косметики','服务饮料与美妆品牌'],
  'Precision Glass for': ['Verre de précision pour','Vidrio de precisión para','Vidro de precisão para','Высокоточное стекло для','精密玻璃包装：'],
  'Perfume & Nail Polish': ['parfums et vernis à ongles','perfumes y esmaltes de uñas','perfumes e vernizes de unhas','парфюмерии и лака для ногтей','香水与指甲油'],
  'Heavy Glass Bottles': ['Bouteilles en verre lourd','Botellas de vidrio pesado','Garrafas de vidro pesado','Бутылки из тяжёлого стекла','厚重玻璃瓶'],
  'Built for Shelf Presence': ['conçues pour se démarquer en rayon','diseñadas para destacar en el estante','feitas para se destacar na prateleira','созданные для заметности на полке','彰显货架陈列质感'],
  'Plastic Bottles Built Around': ['Flacons en plastique adaptés à','Botellas de plástico adaptadas a','Frascos de plástico adaptados a','Пластиковые флаконы под','塑料瓶围绕'],
  'Formula & Fill': ['la formule et le remplissage','la fórmula y el llenado','a fórmula e o enchimento','формулу и розлив','配方与灌装需求设计'],
  'Dispensing Components': ['Composants de distribution','Componentes de dispensación','Componentes de dosagem','Дозирующие компоненты','泵头与出料组件'],
  'Matched to the Pack': ['assortis à l’emballage','adaptados al envase','combinados com a embalagem','подобранные к упаковке','与包装精准匹配']
};

for (const [english, values] of Object.entries(packagingTerms)) commonUi[english] = values;
for (const [english, values] of Object.entries(translationOverrides)) commonUi[english] = values;

function replaceTextPhrase(source, english, localized) {
  for (const variant of new Set([english, escapeHtml(english)])) {
    const pattern = new RegExp(`>(\\s*)${escapeRegExp(variant)}(\\s*)<`, 'g');
    source = source.replace(pattern, (_match, before, after) => `>${before}${localized}${after}<`);
    source = source.replaceAll(`="${variant}"`, `="${localized}"`);
    source = source.replaceAll(`"${variant}"`, `"${localized}"`);
  }
  return source;
}

function normalizedText(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }

function englishH1(file) {
  if (!file || !fs.existsSync(path.join(root, file))) return '';
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  return stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
}

const productDataContext = { window: {} };
vm.createContext(productDataContext);
vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'js', 'product-data.js'), 'utf8'), productDataContext);
const productDataById = new Map(productDataContext.window.GSP_PRODUCTS.map(product => [product.id, product]));
const authoredOverrides = Object.fromEntries(localeCodes.map((language, index) => {
  const entries = Object.entries(commonUi).map(([english, values]) => [english, values[index]]);
  for (const [slug, category] of Object.entries(categories)) {
    const english = englishH1(`products/${slug}/index.html`);
    if (english) entries.push([english, category[2][index]]);
  }
  for (const [id, names] of Object.entries(productNames)) {
    const localized = names[index];
    const dataName = productDataById.get(id)?.name;
    const productFile = sourceFiles.find(file => new RegExp(`-p${id.slice(1)}/index\\.html$`).test(file));
    const pageName = englishH1(productFile);
    if (dataName) entries.push([dataName, localized]);
    if (pageName) entries.push([pageName, localized]);
  }
  return [language, Object.fromEntries(entries.filter(([english, localized]) => english && localized))];
}));

for (const language of localeCodes) {
  const dictionary = translationDictionaries[language];
  let changed = false;
  for (const [english, localized] of Object.entries(authoredOverrides[language])) {
    if (Object.hasOwn(dictionary, english) && dictionary[english] !== localized) {
      dictionary[english] = localized;
      changed = true;
    }
  }
  if (changed) {
    const file = path.join(root, 'data', 'full-translations', `${language}.json`);
    fs.writeFileSync(file, `${JSON.stringify(dictionary, null, 2)}\n`);
  }
}

function translateStaticHtml(source, language) {
  const dictionary = translationDictionaries[language];
  const protectedBlocks = [];
  source = source.replace(/<(script|style|svg|noscript|code|pre)\b[\s\S]*?<\/\1\s*>/gi, block => {
    const token = `\uE000${protectedBlocks.length}\uE001`;
    protectedBlocks.push(block);
    return token;
  });
  source = source.replace(/>([^<>]+)</g, (match, raw) => {
    const key = normalizedText(raw);
    const translated = dictionary[key];
    if (!translated || translated === key) return match;
    const leading = raw.match(/^\s*/)?.[0] || '';
    const trailing = raw.match(/\s*$/)?.[0] || '';
    return `>${leading}${escapeText(translated)}${trailing}<`;
  });
  source = source.replace(/\b(alt|aria-label|placeholder|title)=("([^"]*)"|'([^']*)')/gi, (match, name, quoted, doubleValue, singleValue) => {
    const raw = doubleValue ?? singleValue ?? '';
    const translated = dictionary[normalizedText(raw)];
    if (!translated || translated === normalizedText(raw)) return match;
    const quote = quoted[0];
    return `${name}=${quote}${escapeHtml(translated)}${quote}`;
  });
  return source.replace(/\uE000(\d+)\uE001/g, (_match, index) => protectedBlocks[Number(index)]);
}

function cleanLocalizedTerms(source, language) {
  const protectedBlocks = [];
  const protectedTags = [];
  source = source.replace(/<(script|style|svg|noscript|code|pre)\b[\s\S]*?<\/\1\s*>/gi, block => {
    const token = `\uE000${protectedBlocks.length}\uE001`;
    protectedBlocks.push(block);
    return token;
  });
  // Cleanup is intended for visible text only. Protect every remaining HTML
  // tag so a translation term can never rewrite an href, class, id or other
  // structural attribute (for example, replacing "Jar" inside a URL slug).
  source = source.replace(/<[^>]+>/g, tag => {
    const token = `\uE100${protectedTags.length}\uE101`;
    protectedTags.push(tag);
    return token;
  });
  const cleanupEntries = Object.entries(localizedCleanup[language] || {});
  const applyCleanup = value => {
    for (const [bad, good] of cleanupEntries) {
    // Word-bound the simple Latin terms so short replacements such as
    // "Top" or "Cap" cannot alter a larger word like "Stop" or "Capsule".
      if (/^[A-Za-z][A-Za-z0-9]*(?: [A-Za-z][A-Za-z0-9]*)*$/.test(bad)) {
        const pattern = new RegExp(`(?<![A-Za-z])${escapeRegExp(bad)}(?![A-Za-z])`, 'g');
        value = value.replace(pattern, good);
      } else {
        value = value.replaceAll(bad, good);
      }
    }
    return value;
  };
  source = applyCleanup(source);
  source = source.replace(/\uE100(\d+)\uE101/g, (_match, index) => protectedTags[Number(index)]);
  // Accessibility-facing text attributes are visible to screen readers, so
  // apply the same cleanup there while leaving URLs and structural attributes
  // untouched.
  source = source.replace(/\b(alt|aria-label|placeholder|title)=("([^"]*)"|'([^']*)')/gi, (match, name, quoted, doubleValue, singleValue) => {
    const raw = doubleValue ?? singleValue ?? '';
    const quote = quoted[0];
    const cleaned = applyCleanup(raw);
    return `${name}=${quote}${cleaned}${quote}`;
  });
  return source.replace(/\uE000(\d+)\uE001/g, (_match, index) => protectedBlocks[Number(index)]);
}

function localizeInternalPath(value, language) {
  if (!value.startsWith('/') || value.startsWith('//')) return value;
  if (localeCodes.some(code => value === `/${code}` || value.startsWith(`/${code}/`))) return value;
  if (/^\/(?:assets|api)(?:\/|$)/.test(value) || /^\/(?:favicon|robots|sitemap|manifest|apple-touch)/.test(value)) return value;
  if (/\.[a-z0-9]{2,8}(?:[?#]|$)/i.test(value) && !/\.html(?:[?#]|$)/i.test(value)) return value;
  return localePath(language, value);
}

function localizeLinks(source, language) {
  source = source.replace(/\b(href|action)="(\/(?!\/)[^"]*)"/g, (_match, attribute, value) => `${attribute}="${localizeInternalPath(value, language)}"`);
  return source.replace(/https:\/\/www\.glorystarpack\.com(\/(?!\/)[^"'<\s]*)/g, (match, value) => {
    if (/^\/(?:assets|api)(?:\/|$)/.test(value) || localeCodes.some(code => value === `/${code}` || value.startsWith(`/${code}/`))) return match;
    return `${site}${localePath(language, value)}`;
  });
}

function pageLocalization(route, source, language) {
  const index = localeIndex(language);
  const slug = slugForRoute(route);
  const englishTitle = stripTags(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || source.match(/<title>(.*?)\s*\|/i)?.[1] || '');
  let title = '';
  let summary = '';
  if (route === '/') { title = copy.hero[index]; summary = copy.heroIntro[index]; }
  else if (route === '/404.html') { title = t('notFound', language); summary = t('backHome', language); }
  else if (route === '/about/') { title = t('about', language); summary = t('footer', language); }
  else if (route === '/contact/') { title = t('start', language); summary = t('startCopy', language); }
  else if (route === '/products/product-index/') { title = t('catalog', language); summary = t('catalogIntro', language); }
  else if (route === '/site-index/') { title = t('index', language); summary = t('catalogIntro', language); }
  else if (route === '/insights/') { title = t('insights', language); summary = t('guideIntro', language); }
  else if (route === '/cosmetic-packaging-guides/' || route === '/glass-bottle-buying-guides/') { title = t('guides', language); summary = t('guideIntro', language); }
  else if (categories[slug]) { title = categories[slug][2][index]; summary = domainNotes[categories[slug][1]][index]; }
  else if (topics[slug]) { title = topics[slug][1][index]; summary = (topicNotes[topics[slug][0]] || domainNotes.cosmetic)[index]; }
  else if (serviceTitles[slug]) { title = serviceTitles[slug][index]; summary = t('startCopy', language); }
  else {
    const productId = route.match(/-p(\d+)\/$/)?.[1];
    if (productId && productNames[`p${productId}`]) { title = productNames[`p${productId}`][index]; summary = t('productIntro', language); }
  }
  return { englishTitle, title: title || englishTitle, summary: summary || t('catalogIntro', language) };
}

function localizePage(file, language) {
  const route = routeForFile(file);
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  const { englishTitle, title, summary } = pageLocalization(route, source, language);
  source = localizeLinks(source, language);
  if (englishTitle && title && englishTitle !== title) source = replaceTextPhrase(source, englishTitle, escapeHtml(title));
  for (const [english, localized] of Object.entries(authoredOverrides[language])) source = replaceTextPhrase(source, english, localized);
  source = translateStaticHtml(source, language);
  source = cleanLocalizedTerms(source, language);
  source = installLanguageSwitcher(source, { language, route });
  source = source.replace(/<html lang="[^"]+">/, `<html lang="${language}">`);
  source = source.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)} | GloryStarPack</title>`);
  source = source.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)} | GloryStarPack">`);
  source = source.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(title)} | GloryStarPack">`);
  source = source.replaceAll('"inLanguage":"en"', `"inLanguage":"${language}"`);
  source = source.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(summary)}">`);
  source = source.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(summary)}">`);
  source = source.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(summary)}">`);
  source = source.replace(/(<p\b[^>]*class="[^"]*\blead\b[^"]*"[^>]*>)[\s\S]*?(<\/p>)/i, `$1${escapeHtml(summary)}$2`);
  const canonical = `${site}${localePath(language, route)}`;
  source = source.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${canonical}">`);
  source = source.replace(/<meta property="og:url" content="[^"]+">/, `<meta property="og:url" content="${canonical}">`);
  if (!/<meta name="robots" content="noindex/i.test(source)) {
    source = source.replace(/<link\b[^>]*hreflang="[^"]+"[^>]*>\s*/g, '');
    source = source.replace(/<\/head>/i, `${alternateLanguageLinks(route)}\n</head>`);
  }
  const target = fileForLocale(language, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}

for (const language of localeCodes) {
  fs.rmSync(path.join(root, language), { recursive: true, force: true });
  for (const file of sourceFiles) localizePage(file, language);
}

let sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const englishRoutes = [...new Set([...sitemap.matchAll(/<loc>https:\/\/www\.glorystarpack\.com([^<]+)<\/loc>/g)].map(match => match[1]))]
  .filter(route => !localeCodes.some(language => route.startsWith(`/${language}/`)));
const localizedSitemap = localeCodes.flatMap(language => englishRoutes.map(route => `  <url>\n    <loc>${site}${localePath(language, route)}</loc>\n    <lastmod>2026-09-03</lastmod>\n  </url>`)).join('\n');
const start = '<!-- BEGIN GENERATED LOCALIZED PAGES -->';
const end = '<!-- END GENERATED LOCALIZED PAGES -->';
sitemap = sitemap.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${localizedSitemap}\n  ${end}`);
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
console.log(`Generated ${sourceFiles.length * localeCodes.length} parity pages: ${sourceFiles.length} English interfaces × ${localeCodes.length} languages.`);
