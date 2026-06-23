#!/bin/zsh
set -e

cd "$(dirname "$0")"

msg="${1:-Update website content}"

echo "Checking website repository..."
git status --short

if [[ -z "$(git status --short)" ]]; then
  echo "No changes to sync."
else
  git add index.html assets products oem-cosmetic-packaging custom-cosmetic-packaging cosmetic-packaging-buying-guide sitemap.xml robots.txt llms.txt .gitignore .nojekyll CNAME sync-to-github.command
  git commit -m "$msg"
fi

if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  git push
else
  git push -u origin main
fi

echo "GitHub sync complete."
