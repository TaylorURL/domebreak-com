#!/usr/bin/env bash
# Deploy the DomeBreak website (Vercel via GitHub Actions) and verify prod.
#
# version.json is not flipped here — it is a rewrite to the download host's
# latest.json, which ship-dist.sh already stamped when it repointed the stable
# installer links. What this run verifies is that the site serves that marker
# intact, so the release the site advertises is the one players can install.
#
# Usage:  scripts/deploy-site.sh <VERSION>
set -euo pipefail

V="${1:?usage: deploy-site.sh <VERSION>}"
V="${V#v}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

log "Triggering release.yml on main"
gh workflow run release.yml --ref main
# Give GitHub a moment to register the run, then grab its id.
for _ in 1 2 3 4 5; do
  RID=$(gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)
  [ -n "${RID:-}" ] && break
  sleep 2
done
[ -n "${RID:-}" ] || { echo "Could not find the workflow run id." >&2; exit 1; }
log "Watching run $RID"
gh run watch "$RID" --exit-status

log "Verifying production"
vj=$(curl -fsS "https://domebreak.com/version.json" || true)
echo "version.json: $vj"
got=$(node -pe 'try{JSON.parse(process.argv[1]).version}catch(e){""}' "$vj" 2>/dev/null || echo "")
if [ "$got" != "$V" ]; then
  echo "version.json announces '$got', expected '$V' — the download host's" >&2
  echo "latest.json was never stamped for this release, so the installers are" >&2
  echo "not published. Run ship-dist.sh for v$V before deploying the site." >&2
  exit 1
fi
# The apex must answer version.json directly: the game's update check reads it
# cross-origin, so a redirect breaks it outright and a missing CORS header
# leaves clients unable to read the response — which silently stops every
# desktop client from ever seeing another update.
hdr=$(curl -fsSI "https://domebreak.com/version.json" || true)
grep -qiE '^HTTP/.* 200' <<<"$hdr" || { echo "version.json is not a direct 200:" >&2; echo "$hdr" >&2; exit 1; }
grep -qiE '^access-control-allow-origin: \*' <<<"$hdr" || {
  echo "version.json is missing 'access-control-allow-origin: *' — update checks" >&2
  echo "cannot read it cross-origin. Fix the header rule in web/vercel.json." >&2
  echo "$hdr" >&2
  exit 1
}

log "Website live on v$V"
