#!/usr/bin/env bash
# Builds a universal (Apple Silicon + Intel) macOS bundle locally and publishes it, with the updater feed,
# to wontory/erda-releases. Needs `rustup target add x86_64-apple-darwin` once.
# For when CI can't run; .github/workflows/release.yml does this for every platform on a v* tag.
# Bump "version" in apps/desktop/src-tauri/tauri.conf.json first. Needs gh logged in with access to the repo.
set -euo pipefail

REPO="wontory/erda-releases"
TARGET="universal-apple-darwin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="${TAURI_SIGNING_PRIVATE_KEY_PATH:-$HOME/.tauri/erda.key}"

VERSION="$(node -p "require('$ROOT/apps/desktop/src-tauri/tauri.conf.json').version")"
TAG="v$VERSION"

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "$TAG is already released on $REPO; bump the version in tauri.conf.json first." >&2
  exit 1
fi

export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY")"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-$(cat "$KEY.password")}"

cd "$ROOT"
pnpm --filter @erda/desktop tauri build --target "$TARGET"

BUNDLE="$ROOT/target/$TARGET/release/bundle"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
cp "$BUNDLE/macos/Erda.app.tar.gz" "$OUT/Erda_${VERSION}_universal.app.tar.gz"
cp "$BUNDLE/dmg/Erda_${VERSION}_universal.dmg" "$OUT/"

node -e '
const [version, tag, repo, sigPath, out] = process.argv.slice(1);
const signature = require("fs").readFileSync(sigPath, "utf8");
const url = `https://github.com/${repo}/releases/download/${tag}/Erda_${version}_universal.app.tar.gz`;
// One universal bundle serves both architectures.
const mac = { signature, url };
const feed = { version, notes: "", pub_date: new Date().toISOString(), platforms: { "darwin-aarch64": mac, "darwin-x86_64": mac } };
require("fs").writeFileSync(out, JSON.stringify(feed, null, 2));
' "$VERSION" "$TAG" "$REPO" "$BUNDLE/macos/Erda.app.tar.gz.sig" "$OUT/latest.json"

gh release create "$TAG" --repo "$REPO" --title "Erda $TAG" \
  --notes "See the assets below to install. The app updates itself from here." \
  "$OUT/Erda_${VERSION}_universal.app.tar.gz" "$OUT/Erda_${VERSION}_universal.dmg" "$OUT/latest.json"
echo "Published $TAG to https://github.com/$REPO/releases/tag/$TAG"
