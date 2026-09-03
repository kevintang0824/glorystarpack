import { localeInfo, t } from '../data/site-locales.mjs';

export const languages = Object.entries(localeInfo).map(([code, [name, flag]]) => [code, name, flag]);
export const languageAssets = `<link rel="stylesheet" href="/assets/css/site-language.css?v=20260904-3">
<script src="/assets/js/site-language.js?v=20260904-3" defer></script>`;
export const localePath = (language, route = '/') => language === 'en' ? route : `/${language}${route}`;

export function languageSwitcherMarkup({ language = 'en', route = '/' } = {}) {
  const [name, flag] = localeInfo[language];
  const label = language === 'en' ? 'Choose language' : t('language', language);
  return `<details class="gsp-language" data-nosnippet>
  <summary aria-label="${label}: ${name}" aria-controls="gsp-language-panel"><span class="gsp-language-flag" aria-hidden="true">${flag}</span><span class="gsp-language-name" lang="${language}">${name}</span><span class="gsp-language-caret" aria-hidden="true"></span></summary>
  <div class="gsp-language-panel" id="gsp-language-panel">
    <p class="gsp-language-heading">${label}</p>
    <div class="gsp-language-options">${languages.map(([code, title, country]) => `<a href="${localePath(code, route)}" data-gsp-language="${code}" lang="${code}" hreflang="${code}"${code === language ? ' aria-current="true"' : ''}><span aria-hidden="true">${country}</span><span>${title}</span><span class="gsp-language-check" aria-hidden="true">✓</span></a>`).join('')}</div>
  </div>
</details>`;
}

export function alternateLanguageLinks(route) {
  return languages.map(([code]) => `<link rel="alternate" hreflang="${code}" href="https://www.glorystarpack.com${localePath(code, route)}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="https://www.glorystarpack.com${route}">`;
}

export function installLanguageSwitcher(source, { language = 'en', route } = {}) {
  route ??= source.match(/<link rel="canonical" href="https:\/\/www\.glorystarpack\.com([^\"]+)"/)?.[1] || '/';
  let output = source.replace(/\s*<details\b[^>]*class="gsp-language(?: notranslate)?"[\s\S]*?<\/details>/g, '');
  const markup = languageSwitcherMarkup({ language, route });
  if (output.includes('class="gsp-primary-nav"')) {
    output = output.replace(/(<nav class="gsp-primary-nav"[\s\S]*?<\/nav>)/, `$1\n    ${markup}`);
  } else if (output.includes('class="header-actions"')) {
    output = output.replace(/(<button class="btn-quote"[^>]*>[\s\S]*?<\/button>)/, `$1\n      ${markup}`);
  } else throw new Error('No supported header found for the language selector');
  output = output
    .replace(/<link\b[^>]*href="\/assets\/css\/site-language\.css[^\"]*"[^>]*>\s*/g, '')
    .replace(/<script\b[^>]*src="\/assets\/js\/site-language\.js[^\"]*"[^>]*>\s*<\/script>\s*/g, '');
  output = output.replace(/<link\b[^>]*hreflang="[^"]+"[^>]*>\s*/g, '');
  if (!/<meta name="robots" content="noindex/.test(source)) {
    output = output.replace(/<\/head>/i, `${alternateLanguageLinks(route)}\n</head>`);
  }
  return output.replace(/<\/head>/i, `${languageAssets}\n</head>`);
}
