# SEO Phase 5 — External Authority, AI Citation Tracking and Weekly Iteration

Date: 2026-09-08  
Site: https://www.glorystarpack.com  
Status: Measurement and outreach system started locally; no third-party publication or paid placement has been made.

## Phase objective

Build durable authority from real company identity, relevant industry relationships, approved evidence and useful editorial contributions. Track AI answers as dated observations, then use Search Console, Bing Webmaster, GA4 and inquiry data to choose the next weekly page improvements.

## Implemented

- Added `data/seo-phase-5-tracker.json` with seven authority targets, ten fixed AI citation questions in English and Simplified Chinese, evidence requirements, target URLs, status fields and a five-day weekly loop.
- Added `scripts/check-phase-5-tracker.mjs` to reject duplicate IDs, invalid destinations, missing evidence requirements and unqualified authority states.
- Added `scripts/create-weekly-seo-review.mjs` to create a dated local snapshot with technical counts, external metric placeholders and one observation row for every AI question.
- Expanded `SEO_DAILY_OPERATING_SYSTEM.md` and `README.md` with the authority, citation and weekly operating rules.
- Created the first snapshot at `data/weekly-seo-reviews/2026-09-08.json`.

## Current evidence baseline

- Live site checks passed after the Phase 4 deployment.
- Local baseline: 852 analyzed HTML pages, 834 indexable sitemap URLs and six language versions.
- IndexNow accepted 834 URLs during the latest release notification.
- GSC rich-result validation for the homepage issue is started and remains pending.
- Referring domains, Bing Webmaster metrics, GA4 attribution and AI mention rate are intentionally unmeasured in this snapshot; `null` means “not imported or observed”, not zero.

## Authority work queue

1. Reconcile the existing Alibaba company profile with the legal company name, current product scope and approved contact route.
2. Owner verifies whether a Google Business Profile is eligible and selects an appropriate address or service-area presentation before creating anything.
3. Owner imports or verifies the domain in Bing Webmaster Tools, submits the sitemap and reviews IndexNow activity.
4. Owner confirms any official LinkedIn company page and approved description.
5. Shortlist genuine packaging/glass associations and trade publications; evaluate eligibility, editorial relevance, fees and renewal terms before applying.
6. Request customer, filler or distributor references only with written permission and project evidence.

No target in this queue is counted as an acquired backlink or authority signal until a dated public URL or account export is supplied.

## AI citation measurement

Run the ten fixed questions in the listed platforms when available. For each platform/locale pair, record the exact prompt, date, whether GloryStarPack was mentioned, every cited URL, competing sources, factual errors and a screenshot or share link. Keep “not mentioned” observations because the absence is part of the baseline.

Google states that generative-AI visibility still depends on indexing and eligibility for normal Search snippets, and that meeting requirements does not guarantee crawling, indexing or serving. Bing states that IndexNow notifies participating engines but does not guarantee crawling or indexing. These are measurement boundaries, not promises of traffic.

## Weekly acceptance gate

- One real authority action is documented each week.
- Two to four pages are selected from measured search, inquiry or content-decay evidence.
- Every AI observation is dated and source-linked.
- No customer, certificate, test, factory-performance, ranking or traffic claim is added without evidence.
- Existing SEO, content, inquiry and live-site checks pass before release.

## Policy references

- [Google: Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: Optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google: Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Bing: IndexNow setup and verification](https://www.bing.com/indexnow/getstarted)
- [Bing: Add and verify a site](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b)

## Latest data refresh — 2026-09-21

- The current source set has 152 English pages, 710 localized pages and 844 sitemap URLs; the 844-URL sitemap report has zero errors and warnings.
- Search Console data through 2026-09-17 records 163 clicks, 18,660 impressions, 0.87% CTR and average position 16.95 over 90 days. The latest 28 days record 123 clicks, 16,627 impressions, 0.74% CTR and average position 14.65.
- GA4 data through 2026-09-17 records 209 organic-search sessions and 40 AI Assistant sessions over 90 days. It records 27 inquiry-entry clicks, 2 form starts, 1 form error and 0 `generate_lead` events; accepted RFQs remain unverified because the business inbox/CRM is not connected.
- The AI context now dates the dataset 2026-09-21 and lists the glass-bottle shipping guide as a citation resource. This improves source discovery; it does not establish that an AI platform cited the page.
- Bing Webmaster is only verified as processing in the 2026-09-08 snapshot. Current Bing metrics, referring domains and reproducible AI citation observations remain unmeasured.

The machine-readable baseline is maintained in `data/seo-phase-5-tracker.json`. The exact query-privacy and indexing caveats remain in `SEO_PHASE_1_LIVE_BASELINE_2026-09-20.md`.
