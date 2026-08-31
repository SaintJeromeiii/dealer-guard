import assert from 'node:assert/strict';
import test from 'node:test';

import { inferPremiumTierFromCustomerInfo } from '../utils/billing-entitlements.ts';

test('inferPremiumTierFromCustomerInfo treats an active entitlement as Pro even without isActive', () => {
  assert.equal(
    inferPremiumTierFromCustomerInfo(
      { entitlements: { active: { pro: {} } } },
      'pro',
      'ds_premium_lifetime'
    ),
    'pro'
  );

  assert.equal(
    inferPremiumTierFromCustomerInfo(
      { entitlements: { active: { pro: { isActive: true } } } },
      'pro'
    ),
    'pro'
  );
});

test('inferPremiumTierFromCustomerInfo unlocks Pro from a purchased lifetime product id', () => {
  assert.equal(
    inferPremiumTierFromCustomerInfo(
      {
        entitlements: { active: {} },
        allPurchasedProductIdentifiers: ['ds_premium_lifetime'],
      },
      'pro',
      'ds_premium_lifetime'
    ),
    'pro'
  );
});

test('inferPremiumTierFromCustomerInfo stays free when Play has no Pro purchase', () => {
  assert.equal(
    inferPremiumTierFromCustomerInfo({ entitlements: { active: {} } }, 'pro', 'ds_premium_lifetime'),
    'free'
  );
});
