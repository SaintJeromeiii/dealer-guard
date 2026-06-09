#!/usr/bin/env bash
set -euo pipefail

echo "==> DealShield pre-release checklist"
npm run test
npm run lint
echo "==> All checks passed. Ready for EAS play-test build."
echo "    npm run build:android:play"
