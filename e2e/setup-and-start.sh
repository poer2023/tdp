#!/bin/bash
set -e

echo "Building Next.js application..."
npm run build

echo "Copying test fixtures to standalone build..."
mkdir -p .next/standalone/public/uploads/covers
mkdir -p .next/standalone/public/uploads/gallery
cp e2e/fixtures/covers/* .next/standalone/public/uploads/covers/ 2>/dev/null || true
cp e2e/fixtures/gallery/* .next/standalone/public/uploads/gallery/ 2>/dev/null || true

echo "Starting standalone server..."
node .next/standalone/server.js
