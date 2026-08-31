import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBypassBillingState, resolvePremiumTier, resolveSyncedPremiumTier, setMockRevenueCatValidation } from '../utils/billing-config.ts';
import {
  hasPremiumFeatureAccess,
  isBillingStoreUnavailable,
  isPremiumPreviewAllowed,
  setPremiumPreviewMode,
} from '../utils/premium-preview.ts';
import { createInitialAppData } from '../utils/app-state.ts';

test('resolvePremiumTier forces pro only when dev mock bypass is enabled', () => {
  setMockRevenueCatValidation(true);
  assert.equal(resolvePremiumTier('free'), 'pro');

  setMockRevenueCatValidation(false);
  assert.equal(resolvePremiumTier('free'), 'free');
});

test('resolveSyncedPremiumTier ignores leftover local Pro unless RevenueCat says it is active', () => {
  setMockRevenueCatValidation(false);

  assert.equal(
    resolveSyncedPremiumTier({
      billing: { provider: 'mock', entitlementStatus: 'active' },
    }),
    'free'
  );

  assert.equal(
    resolveSyncedPremiumTier({
      billing: { provider: 'revenuecat', entitlementStatus: 'inactive' },
    }),
    'free'
  );

  assert.equal(
    resolveSyncedPremiumTier({
      billing: { provider: 'revenuecat', entitlementStatus: 'active' },
    }),
    'pro'
  );

  assert.equal(
    resolveSyncedPremiumTier({
      billing: { provider: 'revenuecat', entitlementStatus: 'inactive' },
      tierOverride: 'pro',
    }),
    'pro'
  );
});

test('premium preview does not grant Pro on store-like runtimes', () => {
  setMockRevenueCatValidation(false);
  setPremiumPreviewMode(true);

  assert.equal(isPremiumPreviewAllowed(), false);
  assert.equal(hasPremiumFeatureAccess('free', false), false);
  assert.equal(hasPremiumFeatureAccess('pro', false), true);

  setMockRevenueCatValidation(true);
  assert.equal(isPremiumPreviewAllowed(), true);
  assert.equal(hasPremiumFeatureAccess('free', true), true);

  setMockRevenueCatValidation(false);
  setPremiumPreviewMode(false);
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
