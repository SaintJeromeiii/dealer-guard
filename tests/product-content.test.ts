import assert from 'node:assert/strict';
import test from 'node:test';

import { FREE_VS_PRO_ROWS, LIFETIME_PRO_FEATURES, AI_LOT_COACH_FEATURE_ROW, extractStorePrice, getLifetimeUpgradeCtaLabel } from '../utils/product-content.ts';

test('FREE_VS_PRO_ROWS stays aligned with lifetime Pro feature titles', () => {
  const proOnlyRows = FREE_VS_PRO_ROWS.filter((row) => row.free === '—');
  assert.equal(proOnlyRows.length, LIFETIME_PRO_FEATURES.length);
  assert.deepEqual(
    proOnlyRows.map((row) => row.feature),
    LIFETIME_PRO_FEATURES.map((feature) => feature.title)
  );
});

test('FREE_VS_PRO_ROWS includes explicit AI Lot Coach row', () => {
  const row = FREE_VS_PRO_ROWS.find((entry) => entry.feature === AI_LOT_COACH_FEATURE_ROW.feature);
  assert.equal(row?.free, 'No');
  assert.equal(row?.pro, 'Yes');
});

test('extractStorePrice reads the Play price from a RevenueCat product label', () => {
  assert.equal(extractStorePrice('DealShield Pro Lifetime — $19.99'), '$19.99');
  assert.equal(extractStorePrice('DealShield Pro Active'), null);
  assert.equal(extractStorePrice('DealShield Pro Active (dev bypass)'), null);
  assert.equal(getLifetimeUpgradeCtaLabel(true, 'DealShield Pro Lifetime — $19.99'), 'Processing...');
  assert.equal(getLifetimeUpgradeCtaLabel(false, 'DealShield Pro Lifetime — $19.99'), 'Unlock lifetime Pro · $19.99');
  assert.equal(getLifetimeUpgradeCtaLabel(false, 'DealShield Pro Lifetime'), 'Unlock lifetime Pro');
});
