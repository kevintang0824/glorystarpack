#!/bin/zsh
set -e

cd "$(dirname "$0")"

msg="${1:-Update website content}"

echo "Checking website repository..."
git status --short

if [[ -z "$(git status --short)" ]]; then
  echo "No changes to sync."
else
  git add \
    index.html assets products \
    oem-cosmetic-packaging custom-cosmetic-packaging private-label-cosmetic-packaging \
    cosmetic-packaging-buying-guide cosmetic-packaging-moq cosmetic-packaging-supplier-china \
    wholesale-cosmetic-packaging glass-vs-plastic-cosmetic-packaging airless-bottle-vs-dropper-bottle \
    serum-packaging-guide sunscreen-packaging-guide cosmetic-logo-printing-methods \
    cosmetic-packaging-sample-approval-checklist site-index \
    sitemap.xml image-sitemap.xml robots.txt llms.txt ai-context.json favicon.ico favicon.svg \
    .gitignore .nojekyll CNAME sync-to-github.command
  git commit -m "$msg"
fi

if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  git push
else
  git push -u origin main
fi

echo "GitHub sync complete."
