#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

msg="${1:-chore: update website content}"
branch="$(git branch --show-current)"

if [[ -z "$branch" ]]; then
  echo "Refusing to sync from a detached HEAD. Switch to a branch first."
  exit 1
fi

if [[ -z "$(git status --porcelain=v1)" ]]; then
  echo "No changes to sync."
  exit 0
fi

echo "Running release checks..."
node --check assets/js/main.js
node --check assets/js/legacy-catalog.js
node --check assets/js/inquiry-conversion.js
node --check scripts/check-seo.mjs
node --check scripts/apply-inquiry-layer.mjs
node --check scripts/enforce-accessible-colors.mjs
node --check data/insight-source.mjs
node --check scripts/generate-insight-pages.mjs
node scripts/generate-insight-pages.mjs
node scripts/check-finer-packaging-import.mjs
node scripts/check-seo.mjs
node scripts/audit-content.mjs
node scripts/apply-inquiry-layer.mjs --check
node scripts/enforce-accessible-colors.mjs --check
node scripts/optimize-image-tags.mjs
git diff --check

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="backups/${timestamp}_before_github_sync"
mkdir -p "$backup_dir"
git rev-parse HEAD > "$backup_dir/base-commit.txt"
git status --short > "$backup_dir/status.txt"
git diff --binary HEAD > "$backup_dir/working-tree.patch"
git ls-files --others --exclude-standard > "$backup_dir/untracked-files.txt"

if [[ -s "$backup_dir/untracked-files.txt" ]]; then
  tar -czf "$backup_dir/untracked-files.tgz" -T "$backup_dir/untracked-files.txt"
fi

(
  cd "$backup_dir"
  checksum_files=(base-commit.txt status.txt working-tree.patch untracked-files.txt)
  [[ -f untracked-files.tgz ]] && checksum_files+=(untracked-files.tgz)
  shasum -a 256 "${checksum_files[@]}" > SHA256SUMS.txt
)

echo "Local recovery backup: $backup_dir"
git add -A
git commit -m "$msg"

if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  git push
else
  git push -u origin "$branch"
fi

echo "GitHub sync complete on branch: $branch"
if [[ "$branch" == "main" ]]; then
  echo "Vercel should now create a production deployment automatically."
else
  echo "Vercel should now create a preview deployment; merge into main for production."
fi
echo "After Vercel is Ready, run: node scripts/check-live-site.mjs"
echo "Then notify IndexNow: node scripts/submit-indexnow.mjs --all"
