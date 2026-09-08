# GloryStarPack Search Console baseline

Snapshot date: 2026-09-08  
Property: `sc-domain:glorystarpack.com`  
Google account: `kevintang0824@gmail.com`

## Performance

Search Console range: 2026-06-06 to 2026-09-05, 3 months  
Last data update shown in the report: about 5.5 hours before the snapshot

| Metric | Baseline |
| --- | ---: |
| Web search clicks | 66 |
| Impressions | 5,853 |
| Average CTR | 1.1% |
| Average position | 25.4 |

## Indexing

Page indexing report last updated: 2026-09-04.

| Status or reason | URLs |
| --- | ---: |
| Indexed | 128 |
| Not indexed: alternate page with proper canonical | 50 |
| Not indexed: excluded by noindex | 27 |
| Not indexed: page with redirect | 6 |
| Not indexed: soft 404 | 1 |
| Not indexed: crawled - currently not indexed | 98 |
| Not indexed: discovered - currently not indexed | 10 |
| Not indexed total shown by report | 192 |

The 50 alternate pages, 27 noindex pages and the soft 404 sample are query-state URLs such as `?category=...` and `?q={search_term_string}`. They are catalog/search UI states, not intended landing pages. The 98 crawled-but-not-indexed URLs are mainly localized content pages and need quality, internal-link, and recrawl monitoring rather than an automatic mass indexing request.

The report currently shows 128 indexed and 192 not indexed URLs, while the submitted sitemap contains 834 URLs. These figures should not be treated as an index-rate calculation for all 834 sitemap URLs because the page indexing report is currently showing only the URLs Google has classified in this report view.

## Sitemaps

| Sitemap | Status | Submitted URLs | Last read |
| --- | --- | ---: | --- |
| `https://www.glorystarpack.com/sitemap.xml` | Success | 834 | 2026-09-06 |
| `https://www.glorystarpack.com/image-sitemap.xml` | Success | 137 | 2026-09-04 |

## Structured data

The unparsable structured data report was last updated 2026-09-06. It shows one critical issue on the homepage, last crawled 2026-08-30:

- Issue: `A resource expected to be unique was duplicated`
- Affected URL: `https://www.glorystarpack.com/`
- Validation status: not started

The previous local homepage JSON-LD parsed as valid JSON but contained an unnecessarily large graph with nested offer catalogs, `makesOffer`, `subjectOf` and a featured `ItemList`. It has now been reduced to one compact JSON-LD graph containing only the homepage Organization, WebSite, WebPage and FAQPage entities. After this change is published and Google recrawls the homepage, re-check the issue in Rich Results Test/Search Console.

## Generative AI performance module

The Search Console performance page also exposed a generative-AI-related performance module. The highest-impression queries shown were:

| Query | Clicks | Impressions |
| --- | ---: | ---: |
| `cosmetic packaging compatibility test` | 1 | 4 |
| `bulk cosmetic packaging` | 1 | 1 |
| `glory star containers` | 0 | 78 |
| `private label cosmetics packaging selection` | 0 | 51 |
| `sunscreen tube packaging` | 0 | 47 |
| `aluminum cosmetic packaging` | 0 | 42 |
| `cosmetic packaging resources` | 0 | 40 |
| `cosmetic packaging artwork solutions` | 0 | 40 |
| `compatibility test cosmetics` | 0 | 36 |
| `what brands design skincare jars that are easy to open with wet hands?` | 0 | 32 |

The visible country breakdown was led by the United States (13 clicks, 3,256 impressions), followed by India (4, 299), the United Kingdom (4, 205), Mexico (4, 54), Indonesia (3, 98), South Korea (3, 75), Australia (3, 59), France (3, 49), Greece (3, 13), and Canada (2, 129).

## First-phase actions linked to this baseline

- Keep the submitted XML sitemaps; both are being read successfully.
- Keep the 27 noindex and 50 canonical exclusions for query-state URLs; do not try to index them as content pages.
- Publish the local `robots.txt` query-parameter rules for `category`, `q`, and `sp` so future crawling sends a clearer signal about those UI states.
- Prioritize the crawled-but-not-indexed localized pages with stronger unique buyer answers, contextual internal links, and measured recrawl—not bulk URL inspection requests.
- Re-check the homepage structured-data issue after the production deployment and a fresh Google crawl.
