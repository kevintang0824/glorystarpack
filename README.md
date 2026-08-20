# GloryStarPack

Production source for [www.glorystarpack.com](https://www.glorystarpack.com), a static HTML/CSS/JavaScript packaging website deployed from GitHub to Vercel.

## Safe update workflow

From the repository root, run:

```bash
./sync-to-github.command "Describe the website update"
```

The command checks JavaScript syntax, SEO, crawl depth, inquiry-layer coverage, image markup and whitespace; creates an incremental recovery backup under `backups/`; commits the complete website change; and pushes the current branch. A push to the Vercel production branch (`main`) deploys automatically.

New HTML pages should run `node scripts/apply-inquiry-layer.mjs` before release so they inherit Google tag `G-NYY1MTZ6HM`, contextual WhatsApp/RFQ actions, first/session-touch campaign attribution and the privacy-safe GA4 `inquiry_click` event. The contact form separately reports `rfq_form_start`, `rfq_form_error` and the recommended `generate_lead` event after confirmed server delivery.

After Vercel reports Ready, verify production and notify supported search engines:

```bash
node scripts/check-live-site.mjs
node scripts/submit-indexnow.mjs --all
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for release, indexing and recovery instructions.

The evidence-first daily SEO/AEO workflow, quality gates, KPI definitions and publishing red lines are documented in [SEO_DAILY_OPERATING_SYSTEM.md](SEO_DAILY_OPERATING_SYSTEM.md).
