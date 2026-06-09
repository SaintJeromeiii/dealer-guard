import assert from 'node:assert/strict';
import test from 'node:test';

import { FREE_VS_PRO_ROWS, LIFETIME_PRO_FEATURES } from '../utils/product-content.ts';

test('FREE_VS_PRO_ROWS stays aligned with lifetime Pro feature titles', () => {
  const proOnlyRows = FREE_VS_PRO_ROWS.filter((row) => row.free === '—');
  assert.equal(proOnlyRows.length, LIFETIME_PRO_FEATURES.length);
  assert.deepEqual(
    proOnlyRows.map((row) => row.feature),
    LIFETIME_PRO_FEATURES.map((feature) => feature.title)
  );
});
