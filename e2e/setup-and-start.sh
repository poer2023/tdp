#!/bin/bash
set -e

echo "Building Next.js application..."
# Ensure site URL is consistent for absolute links in metadata/sitemaps during E2E
export NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-"http://localhost:3000"}
npm_config_yes=true
# Skip DB in this run unless explicitly disabled
export E2E_SKIP_DB=${E2E_SKIP_DB:-1}
npm run build

echo "Copying test fixtures to standalone build..."
mkdir -p .next/standalone/public/uploads/covers
mkdir -p .next/standalone/public/uploads/gallery
cp e2e/fixtures/covers/* .next/standalone/public/uploads/covers/ 2>/dev/null || true
cp e2e/fixtures/gallery/* .next/standalone/public/uploads/gallery/ 2>/dev/null || true
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

echo "Starting standalone server..."
node .next/standalone/server.js
