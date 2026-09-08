# GloryStarPack

Production source for [www.glorystarpack.com](https://www.glorystarpack.com), a static HTML/CSS/JavaScript packaging website deployed from GitHub to Vercel.

## Safe update workflow

From the repository root, run:

```bash
./sync-to-github.command "Describe the website update"
```

The command checks JavaScript syntax, SEO, crawl depth, inquiry-layer coverage, image markup and whitespace; creates an incremental recovery backup under `backups/`; commits the complete website change; and pushes the current branch. A push to the Vercel production branch (`main`) deploys automatically.

New HTML pages should run `node scripts/apply-inquiry-layer.mjs` before release so they inherit Google tag `G-NYY1MTZ6HM`, contextual WhatsApp/RFQ actions, first/session-touch campaign attribution and the privacy-safe GA4 `inquiry_click` event. In GA4, mark both `inquiry_click` (intent click) and `generate_lead` (RFQ accepted after confirmed server delivery) as Key events; they represent different funnel stages. The contact form also reports `rfq_form_start` and `rfq_form_error` for diagnostics.

After Vercel reports Ready, verify production and notify supported search engines:

```bash
node scripts/check-live-site.mjs
node scripts/submit-indexnow.mjs --all
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for release, indexing and recovery instructions.

## Website languages

The shared header offers English, French, Spanish, Portuguese, Russian and Simplified Chinese. Each language has complete static URLs under `/fr/`, `/es/`, `/pt/`, `/ru/` and `/zh-CN/`. The selector keeps visitors on the equivalent page, and every indexable localized page has its own canonical URL, structured data and reciprocal `hreflang` links.

`node scripts/generate-localized-site.mjs` builds all 142 English interfaces in each of the five additional languages. It starts from the English HTML so navigation, content sections, product details, articles, tables, images, forms and related links remain structurally identical, then applies the complete static dictionaries in `data/full-translations/` plus the authored industry titles, summaries and interface labels in `data/site-locales.mjs`, `data/localized-topics.mjs` and `data/localized-products.mjs`. Localized pages never call a third-party translation service in the visitor's browser. The same local dictionaries translate the lazy product catalog after it loads.

`node scripts/check-localized-site.mjs` compares every localized page with its English source and fails if the element hierarchy, content-block counts, CSS, JavaScript, image set or current English translation-key coverage differs. `scripts/build-static-translations.py` updates only new or changed English strings and stores the translated results for deterministic future builds.

Product/insight generators and the shared-shell installer also keep the English language selector current. After adding another English page, add its localized topic or category copy when needed, run the localized generator, then run both localization checks.

The evidence-first daily SEO/AEO workflow, quality gates, KPI definitions and publishing red lines are documented in [SEO_DAILY_OPERATING_SYSTEM.md](SEO_DAILY_OPERATING_SYSTEM.md).

## Phase 5 tracking

The external-authority targets, fixed AI citation prompt set and weekly review cadence are tracked in `data/seo-phase-5-tracker.json`. Validate the tracker with:

```bash
node scripts/check-phase-5-tracker.mjs
node scripts/create-weekly-seo-review.mjs --date=YYYY-MM-DD
```

The tracker is an internal measurement aid. It does not claim that a profile, backlink, AI mention or third-party publication exists until the owner supplies dated evidence.
