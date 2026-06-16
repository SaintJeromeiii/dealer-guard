#!/usr/bin/env bash
set -euo pipefail

echo "==> DealShield pre-release checklist"

if rg -n "const MOCK_REVENUECAT_VALIDATION = true" "app/(main)/index.tsx" >/dev/null 2>&1; then
  echo "ERROR: MOCK_REVENUECAT_VALIDATION is still true in app/(main)/index.tsx"
  echo "       Set it to false before a production Play release."
  exit 1
fi

npm run test
npm run lint
echo "==> All checks passed. Ready for EAS play-test build."
echo "    npm run build:android:play"
