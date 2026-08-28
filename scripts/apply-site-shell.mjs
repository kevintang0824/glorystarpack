import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const ignoredDirectories = new Set(['.git', '.vercel', 'backups', 'node_modules', 'tmp']);
const ignoredFiles = new Set(['glorystarpack (1).html', 'google130558f0f0763df4.html']);
const checkOnly = process.argv.includes('--check');
const shellStylesheet = '<link rel="stylesheet" href="/assets/css/site-shell.css?v=20260828-2">';
const shellStylesheetPattern = /<link\b[^>]*href=["']\/assets\/css\/site-shell\.css(?:\?[^"']*)?["'][^>]*\/?\s*>/i;
const inquiryStylesheetPattern = /<link\b[^>]*href=["']\/assets\/css\/inquiry-conversion\.css["'][^>]*\/?\s*>/i;
const fontMarker = 'family=Cormorant+Garamond';
const fontMarkup = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&amp;family=DM+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&amp;family=DM+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"></noscript>`;

const guidePages = new Set([
  'airless-bottle-vs-dropper-bottle/index.html',
  'cosmetic-logo-printing-methods/index.html',
  'cosmetic-packaging-buying-guide/index.html',
  'cosmetic-packaging-guides/index.html',
  'cosmetic-packaging-moq/index.html',
  'cosmetic-packaging-sample-approval-checklist/index.html',
  'glass-bottle-buying-guides/index.html',
  'glass-vs-plastic-cosmetic-packaging/index.html',
  'serum-packaging-guide/index.html',
  'sunscreen-packaging-guide/index.html'
]);

const glassCategoryPages = new Set([
  'products/beer-bottles/index.html',
  'products/beverage-bottles/index.html',
  'products/cream-jars/index.html',
  'products/gin-bottles/index.html',
  'products/glass-cosmetic-bottles/index.html',
  'products/glass-packaging/index.html',
  'products/liquor-bottles/index.html',
  'products/nail-polish-bottles/index.html',
  'products/perfume-bottles/index.html',
  'products/serum-dropper-bottles/index.html',
  'products/sparkling-wine-bottles/index.html',
  'products/vodka-bottles/index.html',
  'products/whiskey-bottles/index.html',
  'products/wine-bottles/index.html'
]);

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && ignoredFiles.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function activeSectionFor(rel, source) {
  if (rel === 'about/index.html') return 'about';
  if (rel === 'contact/index.html') return 'contact';
  if (rel.startsWith('insights/') || guidePages.has(rel)) return 'guides';
  if (rel.startsWith('products/')) {
    if (glassCategoryPages.has(rel)) return 'glass';
    if (/^products\/.+-p\d+\/index\.html$/.test(rel)) {
      const materialIsGlass = /<th\s+scope=["']row["']>Material<\/th>\s*<td>[^<]*\bGlass\b/i.test(source);
      if (materialIsGlass || /(?:^|-)glass(?:-|\/)/i.test(rel)) return 'glass';
    }
    return 'products';
  }
  if (/^(?:custom|oem|private-label|wholesale)-cosmetic-packaging\//.test(rel)
    || rel === 'cosmetic-packaging-supplier-china/index.html') return 'products';
  return '';
}

function isExactSectionPage(rel, activeSection) {
  return (activeSection === 'products' && rel === 'products/product-index/index.html')
    || (activeSection === 'glass' && rel === 'products/glass-packaging/index.html')
    || (activeSection === 'guides' && rel === 'cosmetic-packaging-guides/index.html')
    || (activeSection === 'about' && rel === 'about/index.html')
    || (activeSection === 'contact' && rel === 'contact/index.html');
}

function currentLocation(activeSection, navSection, exact = false) {
  if (activeSection !== navSection) return '';
  return ` aria-current="${exact ? 'page' : 'location'}"`;
}

function headerMarkup(activeSection = '', activePage = false) {
  return `<header class="site-header gsp-site-header">
  <a class="gsp-skip-link" href="#main-content">Skip to main content</a>
  <div class="gsp-header-inner">
    <a class="gsp-brand" href="/" aria-label="GloryStarPack home"><img src="/assets/brand/glorystarpack-logo-mark-96-2026.png" width="96" height="96" alt="" decoding="async"><span class="gsp-brand-copy"><strong>GLORYSTARPACK</strong><small>Custom Bottles &amp; Packaging</small></span></a>
    <nav class="gsp-primary-nav" aria-label="Primary navigation"><a${currentLocation(activeSection, 'products', activePage)} href="/products/product-index/">Products</a><a${currentLocation(activeSection, 'glass', activePage)} href="/products/glass-packaging/">Glass Packaging</a><a${currentLocation(activeSection, 'guides', activePage)} href="/cosmetic-packaging-guides/">Buyer Guides</a><a${currentLocation(activeSection, 'about', activePage)} href="/about/">About</a></nav>
    <a class="gsp-header-cta"${currentLocation(activeSection, 'contact', true)} href="/contact/"><span class="gsp-cta-long">Request a Quote</span><span class="gsp-cta-short">Quote</span></a>
  </div>
</header>`;
}

function footerMarkup(date = '') {
  const reviewed = date ? `<span>Page reviewed ${date}</span>` : '<span>Business-to-business inquiries worldwide</span>';
  return `<footer class="site-footer gsp-site-footer" data-nosnippet>
  <div class="gsp-footer-inner">
    <div class="gsp-footer-brand"><a class="gsp-brand" href="/" aria-label="GloryStarPack home"><img src="/assets/brand/glorystarpack-logo-mark-96-2026.png" width="96" height="96" alt="" loading="lazy" decoding="async"><span class="gsp-brand-copy"><strong>GLORYSTARPACK</strong><small>Custom Bottles &amp; Packaging</small></span></a><p>Glass bottles and packaging systems for beverage, fragrance, beauty and personal-care projects, with component matching, decoration and export coordination.</p></div>
    <nav class="gsp-footer-nav" aria-label="Footer navigation"><a href="/products/product-index/">Product Index</a><a href="/products/glass-packaging/">Glass Packaging</a><a href="/cosmetic-packaging-guides/">Buyer Guides</a><a href="/insights/">Packaging Insights</a><a href="/about/">About</a><a href="/site-index/">Site Index</a></nav>
    <div class="gsp-footer-contact"><strong>Start a packaging project</strong><a href="mailto:kevin@glorystarpack.com">kevin@glorystarpack.com</a><a href="https://wa.me/8619577608248" rel="noopener">WhatsApp +86 195-7760-8248</a><span>Xiamen, Fujian, China</span></div>
  </div>
  <div class="gsp-footer-bottom"><span>© 2026 GloryStarPack. Project specifications are confirmed against the selected configuration.</span>${reviewed}</div>
</footer>`;
}

function pageDate(source) {
  return source.match(/\b(?:Updated|Page reviewed)\s+(\d{4}-\d{2}-\d{2})/i)?.[1]
    ?? source.match(/["']dateModified["']\s*:\s*["'](\d{4}-\d{2}-\d{2})/i)?.[1]
    ?? '';
}

function installHeadAssets(source) {
  let output = source;
  if (!output.includes(fontMarker)) {
    output = output.replace(/<\/head>/i, `${fontMarkup}\n</head>`);
  }
  if (shellStylesheetPattern.test(output)) {
    output = output.replace(shellStylesheetPattern, shellStylesheet);
  } else {
    if (inquiryStylesheetPattern.test(output)) {
      output = output.replace(inquiryStylesheetPattern, `${shellStylesheet}\n$&`);
    } else {
      output = output.replace(/<\/head>/i, `${shellStylesheet}\n</head>`);
    }
  }
  return output;
}

function pageHeading(source, rel) {
  const heading = source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!heading) throw new Error(`${rel}: cannot derive a breadcrumb label from the H1`);
  return heading;
}

function breadcrumbMarkup(label, inner = '') {
  let content = inner.trim();
  if (!content) {
    content = `<a href="/">Home</a><span class="gsp-breadcrumb-separator" aria-hidden="true">/</span><span aria-current="page">${label}</span>`;
  } else {
    content = content.replace(/<\/a>\s*\/\s*(?=<)/g, '</a><span class="gsp-breadcrumb-separator" aria-hidden="true">/</span>');
    content = content.replace(/<\/span>\s*\/\s*(?=<)/g, '</span><span class="gsp-breadcrumb-separator" aria-hidden="true">/</span>');
    content = content.replace(/<span\b([^>]*\bgsp-breadcrumb-separator\b[^>]*)>/gi, (tag, attributes) => {
      const cleaned = attributes.replace(/\s+aria-current=["'][^"']+["']/i, '');
      return `<span${cleaned}>`;
    });
    const spanTags = [...content.matchAll(/<span\b[^>]*>/gi)];
    const lastSpan = spanTags.at(-1);
    if (lastSpan && !/\baria-current=/i.test(lastSpan[0])) {
      const markedTag = lastSpan[0].replace(/>$/, ' aria-current="page">');
      content = `${content.slice(0, lastSpan.index)}${markedTag}${content.slice(lastSpan.index + lastSpan[0].length)}`;
    }
  }
  return `<nav class="gsp-breadcrumbs" id="breadcrumbs" aria-label="Breadcrumb">
  <div class="gsp-breadcrumbs-inner">${content}</div>
</nav>`;
}

function installBreadcrumb(source, rel) {
  const legacyPattern = /<div\b[^>]*class=["'][^"']*\bwrap\s+breadcrumbs\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i;
  const sharedPattern = /<nav\b[^>]*class=["'][^"']*\bgsp-breadcrumbs\b[^"']*["'][^>]*>\s*<div\b[^>]*class=["'][^"']*\bgsp-breadcrumbs-inner\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/nav>/i;
  if (legacyPattern.test(source)) {
    return source.replace(legacyPattern, (_, inner) => breadcrumbMarkup(pageHeading(source, rel), inner));
  }
  if (sharedPattern.test(source)) {
    return source.replace(sharedPattern, (_, inner) => breadcrumbMarkup(pageHeading(source, rel), inner));
  }
  return source.replace(/<\/header>/i, `</header>\n${breadcrumbMarkup(pageHeading(source, rel))}`);
}

function installContentTarget(source, rel) {
  const targetCount = (source.match(/\bid=["']main-content["']/gi) ?? []).length;
  if (targetCount === 1) return source;
  if (targetCount > 1) throw new Error(`${rel}: duplicate main-content targets`);
  const breadcrumbPattern = /(<nav\b[^>]*class=["'][^"']*\bgsp-breadcrumbs\b[^"']*["'][^>]*>[\s\S]*?<\/nav>)/i;
  if (!breadcrumbPattern.test(source)) throw new Error(`${rel}: cannot place the main-content target after the breadcrumb`);
  return source.replace(breadcrumbPattern, '$1\n<div class="gsp-main-anchor" id="main-content" tabindex="-1"></div>');
}

function normalizeMainLandmark(source, rel) {
  if (source.includes('class="gsp-main-landmark"')) return source;
  const headingIndex = source.search(/<h1\b/i);
  const mainMatch = source.match(/<main\b[^>]*>/i);
  if (headingIndex === -1 || !mainMatch || mainMatch.index === undefined) {
    throw new Error(`${rel}: cannot validate the main landmark against the page heading`);
  }
  if (mainMatch.index < headingIndex) return source;

  let output = `${source.slice(0, mainMatch.index)}${mainMatch[0].replace(/^<main\b/i, '<div')}${source.slice(mainMatch.index + mainMatch[0].length)}`;
  const mainCloseIndex = output.indexOf('</main>', mainMatch.index);
  if (mainCloseIndex === -1) throw new Error(`${rel}: cannot close the relocated main landmark`);
  output = `${output.slice(0, mainCloseIndex)}</div>\n</div><!-- /.gsp-main-landmark -->${output.slice(mainCloseIndex + '</main>'.length)}`;
  const target = '<div class="gsp-main-anchor" id="main-content" tabindex="-1"></div>';
  if (!output.includes(target)) throw new Error(`${rel}: cannot place the main landmark at the shared content target`);
  return output.replace(target, `${target}\n<div class="gsp-main-landmark" role="main">`);
}

function installHomepageSkipLink(source) {
  if (source.includes('class="gsp-skip-link"')) return source;
  return source.replace(/<body([^>]*)>/i, '<body$1>\n<a class="gsp-skip-link" href="#main-content">Skip to main content</a>');
}

function normalizeHomepageBreadcrumbs(source) {
  return source.replace(
    /<div class="breadcrumb-bar"><div class="bc">([\s\S]*?)<\/div><\/div>/gi,
    (_, inner) => {
      const content = inner
        .replace(/\s*›\s*(?=<)/g, '<span class="gsp-breadcrumb-separator" aria-hidden="true">›</span>')
        .replace(/<span class="cur"(?![^>]*\baria-current=)([^>]*)>/i, '<span class="cur"$1 aria-current="page">');
      return `<nav class="breadcrumb-bar gsp-breadcrumbs" aria-label="Breadcrumb"><div class="bc gsp-breadcrumbs-inner">${content}</div></nav>`;
    }
  );
}

function normalizeHomepageShell(source) {
  return normalizeHomepageBreadcrumbs(installHomepageSkipLink(source));
}

function normalizeInnerShell(source, rel) {
  let output = source;
  const activeSection = activeSectionFor(rel, source);
  const headerPattern = /<header\b[^>]*class=["'][^"']*\b(?:site-header|site-head|top)\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i;
  if (!headerPattern.test(output)) throw new Error(`${rel}: cannot find a supported page header`);
  output = output.replace(headerPattern, headerMarkup(activeSection, isExactSectionPage(rel, activeSection)));
  output = installBreadcrumb(output, rel);
  output = installContentTarget(output, rel);
  output = normalizeMainLandmark(output, rel);

  const footer = footerMarkup(pageDate(source));
  const paragraphFooterPattern = /<p\b[^>]*class=["'][^"']*\bfoot\b[^"']*["'][^>]*>[\s\S]*?<\/p>\s*<\/main>/i;
  const elementFooterPattern = /<footer\b[^>]*class=["'][^"']*\b(?:site-footer|site-foot|foot)\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i;
  if (paragraphFooterPattern.test(output)) {
    output = output.replace(paragraphFooterPattern, `</main>\n${footer}`);
  } else if (elementFooterPattern.test(output)) {
    output = output.replace(elementFooterPattern, footer);
  } else if (/<\/body>/i.test(output)) {
    output = output.replace(/<\/body>/i, `${footer}\n</body>`);
  } else {
    throw new Error(`${rel}: cannot install the shared footer`);
  }
  return output;
}

const invalid = [];
let changed = 0;

for (const filePath of walk(rootDir)) {
  const rel = path.relative(rootDir, filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  let output = source;
  if (!checkOnly) {
    output = installHeadAssets(output);
    if (rel !== 'index.html') output = normalizeInnerShell(output, rel);
    else output = normalizeHomepageShell(output);
  }

  const stylesheetCount = output.split('/assets/css/site-shell.css').length - 1;
  const headerCount = output.split('gsp-site-header').length - 1;
  const footerCount = output.split('gsp-site-footer').length - 1;
  const inquiryIndex = output.indexOf('/assets/css/inquiry-conversion.css');
  const shellIndex = output.indexOf('/assets/css/site-shell.css');
  const mainTargetCount = (output.match(/\bid=["']main-content["']/gi) ?? []).length;
  const skipLinkCount = (output.match(/class=["'][^"']*\bgsp-skip-link\b[^"']*["']/gi) ?? []).length;
  const issues = [];
  if (stylesheetCount !== 1) issues.push(`expected one shared stylesheet, found ${stylesheetCount}`);
  if (!output.includes(fontMarker)) issues.push('missing shared brand font loader');
  if (inquiryIndex !== -1 && shellIndex > inquiryIndex) issues.push('shared stylesheet must load before inquiry styles');
  if (rel !== 'index.html' && headerCount !== 1) issues.push(`expected one shared header, found ${headerCount}`);
  if (rel !== 'index.html' && footerCount !== 1) issues.push(`expected one shared footer, found ${footerCount}`);
  if (mainTargetCount !== 1) issues.push(`expected one main-content target, found ${mainTargetCount}`);
  if (skipLinkCount !== 1) issues.push(`expected one skip link, found ${skipLinkCount}`);
  if (rel !== 'index.html') {
    const breadcrumbCount = output.split('class="gsp-breadcrumbs"').length - 1;
    const headerSource = output.match(/<header\b[^>]*\bgsp-site-header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] ?? '';
    const expectedActiveSection = activeSectionFor(rel, output);
    const headerCurrentCount = (headerSource.match(/\baria-current=/gi) ?? []).length;
    const mainLandmarkCount = (output.match(/<main\b/gi) ?? []).length
      + (output.match(/\brole=["']main["']/gi) ?? []).length;
    if (breadcrumbCount !== 1) issues.push(`expected one shared breadcrumb, found ${breadcrumbCount}`);
    if (/class=["'][^"']*\bwrap\s+breadcrumbs\b/i.test(output)) issues.push('legacy breadcrumb remains');
    if (expectedActiveSection && headerCurrentCount !== 1) issues.push(`expected one active header item, found ${headerCurrentCount}`);
    if (!expectedActiveSection && headerCurrentCount !== 0) issues.push(`unexpected active header item, found ${headerCurrentCount}`);
    if (mainLandmarkCount !== 1) issues.push(`expected one main landmark, found ${mainLandmarkCount}`);
  }
  if (issues.length) invalid.push(`${rel}: ${issues.join('; ')}`);

  if (!checkOnly && output !== source) {
    fs.writeFileSync(filePath, output);
    changed += 1;
  }
}

if (invalid.length) {
  console.error(`Shared site shell validation failed for ${invalid.length} pages:`);
  invalid.forEach(item => console.error(`- ${item}`));
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Shared typography, navigation state, breadcrumbs, skip links, header, footer and stylesheet order are valid on every active HTML page.');
} else {
  console.log(`Applied the shared GloryStarPack site shell to ${changed} HTML pages.`);
}
