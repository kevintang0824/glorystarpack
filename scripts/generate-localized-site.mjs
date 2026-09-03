import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { localeCodes, copy, t } from '../data/site-locales.mjs';
import { categories, domainNotes, serviceTitles, topics, topicNotes } from '../data/localized-topics.mjs';
import { productNames } from '../data/localized-products.mjs';
import { alternateLanguageLinks, installLanguageSwitcher, localePath } from './language-switcher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.glorystarpack.com';
const localeIndex = language => localeCodes.indexOf(language);
const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripTags = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
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
  'Quote': ['Devis','Presupuesto','Orçamento','Расчёт','报价'],
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

function replaceTextPhrase(source, english, localized) {
  for (const variant of new Set([english, escapeHtml(english)])) {
    const pattern = new RegExp(`>(\\s*)${escapeRegExp(variant)}(\\s*)<`, 'g');
    source = source.replace(pattern, (_match, before, after) => `>${before}${localized}${after}<`);
    source = source.replaceAll(`="${variant}"`, `="${localized}"`);
  }
  return source;
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
  source = installLanguageSwitcher(source, { language, route });
  source = source.replace(/<html lang="[^"]+">/, `<html lang="${language}">`);
  if (englishTitle && title && englishTitle !== title) source = source.replaceAll(englishTitle, escapeHtml(title));
  source = source.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)} | GloryStarPack</title>`);
  source = source.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)} | GloryStarPack">`);
  source = source.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(title)} | GloryStarPack">`);
  source = source.replaceAll('"inLanguage":"en"', `"inLanguage":"${language}"`);
  for (const [english, values] of Object.entries(commonUi)) source = replaceTextPhrase(source, english, values[localeIndex(language)]);
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
