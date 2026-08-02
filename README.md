# GloryStarPack

Production source for [www.glorystarpack.com](https://www.glorystarpack.com), a static HTML/CSS/JavaScript packaging website deployed from GitHub to Vercel.

## Safe update workflow

From the repository root, run:

```bash
./sync-to-github.command "Describe the website update"
```

The command checks JavaScript syntax, SEO, crawl depth, inquiry-layer coverage, image markup and whitespace; creates an incremental recovery backup under `backups/`; commits the complete website change; and pushes the current branch. A push to the Vercel production branch (`main`) deploys automatically.

New HTML pages should run `node scripts/apply-inquiry-layer.mjs` before release so they inherit contextual WhatsApp/RFQ actions and the privacy-safe `inquiry_click` data-layer event.

After Vercel reports Ready, verify production and notify supported search engines:

```bash
node scripts/check-live-site.mjs
node scripts/submit-indexnow.mjs --all
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for release, indexing and recovery instructions.
