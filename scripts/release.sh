#!/usr/bin/env bash
set -euo pipefail

REPO="wontory/erda-releases"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="${TAURI_SIGNING_PRIVATE_KEY_PATH:-$HOME/.tauri/erda.key}"
WINDOWS=1
[[ "${1:-}" == "--mac-only" ]] && WINDOWS=0

VERSION="$(node -p "require('$ROOT/apps/desktop/src-tauri/tauri.conf.json').version")"
TAG="v$VERSION"

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "$TAG is already released on $REPO; bump the version in tauri.conf.json first." >&2
  exit 1
fi

export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY")"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-$(cat "$KEY.password")}"

cd "$ROOT"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
ASSETS=()

pnpm --filter @erda/desktop tauri build --target universal-apple-darwin
MAC="$ROOT/target/universal-apple-darwin/release/bundle"
cp "$MAC/macos/Erda.app.tar.gz" "$OUT/Erda_${VERSION}_universal.app.tar.gz"
cp "$MAC/macos/Erda.app.tar.gz.sig" "$OUT/mac.sig"
cp "$MAC/dmg/Erda_${VERSION}_universal.dmg" "$OUT/"
ASSETS+=("$OUT/Erda_${VERSION}_universal.app.tar.gz" "$OUT/Erda_${VERSION}_universal.dmg")

if [[ "$WINDOWS" == 1 ]]; then
  PATH="$(brew --prefix llvm)/bin:$(brew --prefix lld)/bin:$PATH" \
    pnpm --filter @erda/desktop tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
  WIN="$ROOT/target/x86_64-pc-windows-msvc/release/bundle/nsis/Erda_${VERSION}_x64-setup.exe"
  cp "$WIN" "$OUT/"
  cp "$WIN.sig" "$OUT/windows.sig"
  ASSETS+=("$OUT/Erda_${VERSION}_x64-setup.exe")
fi

node -e '
const fs = require("fs");
const [version, tag, repo, out] = process.argv.slice(1);
const asset = (name) => `https://github.com/${repo}/releases/download/${tag}/${name}`;
const sig = (name) => fs.readFileSync(`${out}/${name}`, "utf8");
// One universal bundle serves both Mac architectures.
const mac = { signature: sig("mac.sig"), url: asset(`Erda_${version}_universal.app.tar.gz`) };
const platforms = { "darwin-aarch64": mac, "darwin-x86_64": mac };
if (fs.existsSync(`${out}/windows.sig`))
  platforms["windows-x86_64"] = { signature: sig("windows.sig"), url: asset(`Erda_${version}_x64-setup.exe`) };
fs.writeFileSync(`${out}/latest.json`, JSON.stringify({ version, notes: "", pub_date: new Date().toISOString(), platforms }, null, 2));
' "$VERSION" "$TAG" "$REPO" "$OUT"
ASSETS+=("$OUT/latest.json")

gh release create "$TAG" --repo "$REPO" --title "Erda $TAG" \
  --notes "See the assets below to install. The app updates itself from here." "${ASSETS[@]}"
echo "Published $TAG to https://github.com/$REPO/releases/tag/$TAG"
