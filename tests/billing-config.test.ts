import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBypassBillingState, resolvePremiumTier, setMockRevenueCatValidation } from '../utils/billing-config.ts';
import {
  hasPremiumFeatureAccess,
  isBillingStoreUnavailable,
  setPremiumPreviewMode,
} from '../utils/premium-preview.ts';
import { createInitialAppData } from '../utils/app-state.ts';

test('resolvePremiumTier forces pro only when dev mock bypass is enabled', () => {
  setMockRevenueCatValidation(true);
  assert.equal(resolvePremiumTier('free'), 'pro');

  setMockRevenueCatValidation(false);
  assert.equal(resolvePremiumTier('free'), 'free');
});

test('premium preview grants feature access without changing paid tier', () => {
  setMockRevenueCatValidation(false);
  setPremiumPreviewMode(true);

  assert.equal(hasPremiumFeatureAccess('free', false), true);
  assert.equal(hasPremiumFeatureAccess('pro', false), true);

  setPremiumPreviewMode(false);
  assert.equal(hasPremiumFeatureAccess('free', false), false);
});

test('isBillingStoreUnavailable detects RevenueCat sync and missing product states', () => {
  const billing = createInitialAppData().billing;

  assert.equal(
    isBillingStoreUnavailable({
      ...billing,
      provider: 'revenuecat',
      isConfigured: true,
      offeringsLoaded: false,
      entitlementStatus: 'inactive',
      customerInfoNote: 'RevenueCat sync failed: network error',
    }),
    true
  );

  assert.equal(
    isBillingStoreUnavailable({
      ...billing,
      provider: 'revenuecat',
      isConfigured: true,
      offeringsLoaded: true,
      entitlementStatus: 'active',
      customerInfoNote: 'Lifetime Pro access is active on this account.',
    }),
    false
  );

  assert.equal(isBillingStoreUnavailable(buildBypassBillingState()), false);
});
