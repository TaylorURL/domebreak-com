#!/usr/bin/env bash
# Verify the DomeBreak website is serving a release.
#
# Nothing is deployed from here. Vercel's git integration builds and deploys
# main on every merge, so by the time this runs the site is already up; what is
# left to check is the version it advertises. version.json is a rewrite to the
# download host's latest.json (web/vercel.json), which ship-dist.sh stamps when
# it repoints the stable installer links, so the marker only moves once the
# installers behind it are the ones players get.
#
# Usage:  scripts/deploy-site.sh <VERSION>
set -euo pipefail

V="${1:?usage: deploy-site.sh <VERSION>}"
V="${V#v}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

log "Verifying production"
vj=$(curl -fsS "https://domebreak.com/version.json" || true)
echo "version.json: $vj"
got=$(node -pe 'try{JSON.parse(process.argv[1]).version}catch(e){""}' "$vj" 2>/dev/null || echo "")
if [ "$got" != "$V" ]; then
  echo "version.json announces '$got', expected '$V' — the download host's" >&2
  echo "latest.json was never stamped for this release, so the installers are" >&2
  echo "not published. Run ship-dist.sh for v$V first." >&2
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
