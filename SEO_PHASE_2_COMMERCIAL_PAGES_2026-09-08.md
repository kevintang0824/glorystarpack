# SEO Phase 2: Commercial-intent page optimization

Date: 2026-09-08

## Scope

Phase 2 targets 15 pages that can directly answer a buyer's sourcing, specification, sample or quote question. The selection is based on commercial intent and the site's existing buyer-answer content; page-level Search Console metrics were not available in this run, so no page-level clicks, impressions or rankings are claimed.

The current aggregate Search Console baseline recorded for the property is 66 clicks, 5,853 impressions, 1.1% CTR and average position 25.4 over the reviewed period.

## Pages optimized

1. `/custom-cosmetic-packaging/`
2. `/oem-cosmetic-packaging/`
3. `/private-label-cosmetic-packaging/`
4. `/wholesale-cosmetic-packaging/`
5. `/cosmetic-packaging-supplier-china/`
6. `/cosmetic-packaging-moq/`
7. `/cosmetic-packaging-sample-approval-checklist/`
8. `/products/glass-cosmetic-bottles/`
9. `/products/airless-pump-bottles/`
10. `/products/perfume-bottles/`
11. `/products/serum-dropper-bottles/`
12. `/products/nail-polish-bottles/`
13. `/products/beer-bottles/`
14. `/products/wine-bottles/`
15. `/products/whiskey-bottles/`

## Changes made

- Standardized the meta description, Open Graph description and Twitter description on all 15 target pages so search and sharing summaries express the same buyer intent.
- Added FAQPage JSON-LD to 9 pages where the questions and answers are already visible on the page. The structured data mirrors the visible wording and uses a page-unique `#faq` identifier.
- Added `commercialIntentPages` to `ai-context.json` with one machine-readable record per target page: primary intent, buyer stage, short answer, quote inputs and recommended next step.
- Kept existing titles, canonical URLs, page routes, multilingual source structure and Phase 1 homepage schema guard unchanged.

## Validation target

- All 15 pages remain indexable and canonicalized.
- All JSON-LD blocks parse successfully, with no duplicate FAQPage or duplicate top-level identifiers on a page.
- Localized-site parity, SEO, accessibility, inquiry-layer and content checks pass before release.

## Measurement and next action

This phase is not considered performance-proven until Google recrawls the released pages. After release, inspect Search Console page/query data after the first meaningful window and prioritize pages with impressions and positions 8-20 for the next content iteration. Do not judge success from rich-result appearance alone; track indexed status, impressions, qualified clicks and RFQ submissions together.
