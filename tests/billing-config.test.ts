import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePremiumTier, setMockRevenueCatValidation } from '../utils/billing-config.ts';

test('resolvePremiumTier forces pro while mock RevenueCat validation is enabled', () => {
  setMockRevenueCatValidation(true);
  assert.equal(resolvePremiumTier('free'), 'pro');
  assert.equal(resolvePremiumTier('pro'), 'pro');

  setMockRevenueCatValidation(false);
  assert.equal(resolvePremiumTier('free'), 'free');
});
