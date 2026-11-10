#!/usr/bin/env bash
# Builds the landing (Vite) and the admin panel (Next.js) and assembles one site for a single
# Azure Static Web App: the landing at the root, the panel under /panel.
#
# Usage (from the repository root):
#   ./deploy/static-site/build.sh          (uses the default API URL below)
#
# Output: deploy/static-site/site/ (upload this folder as the Static Web App artifact).
set -euo pipefail

# Public API URL of the App Service (AtleticsApi). Not a secret: it ends up in the browser bundle.
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://atleticsapi-eec4g4cdhgbybyau.westus3-01.azurewebsites.net/api}"
# Git Bash on Windows rewrites values that start with "/" (e.g. /panel) into Windows paths before they
# reach npm. This keeps NEXT_PUBLIC_BASE_PATH=/panel intact; it does nothing on Linux runners.
export MSYS_NO_PATHCONV=1

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LANDING="$ROOT/src/AEspejo.Landing.AthleticsDemo"
PANEL="$ROOT/src/AEspejo.Registrations.Frontend"
SITE="$ROOT/deploy/static-site/site"

# Clean install in CI (no node_modules yet); locally the existing node_modules is reused, so a running
# dev server does not block the build with a locked native binary on Windows.
install() { [ -d node_modules ] || npm ci; }

# 1. Landing: its public/staticwebapp.config.json is copied into dist/ and is the config of the whole site.
(cd "$LANDING" && install && npm run build)

# 2. Panel: built with the /panel base path, so its links and assets point to /panel/...
(cd "$PANEL" && install && NEXT_PUBLIC_BASE_PATH=/panel npm run build)

# 3. Assemble the site: landing at the root, panel under /panel.
# Empty the folder instead of deleting it: on Windows a folder can stay locked by another process.
mkdir -p "$SITE"
rm -rf "${SITE:?}"/* "${SITE:?}"/.[!.]* 2>/dev/null || true
cp -r "$LANDING/dist/." "$SITE/"
mkdir -p "$SITE/panel"
cp -r "$PANEL/out/." "$SITE/panel/"

echo "Site assembled at $SITE"
