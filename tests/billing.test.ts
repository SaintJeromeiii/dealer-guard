import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBillingSetupHints, formatBillingError, isProductAlreadyOwnedError } from '../utils/billing-messages.ts';

test('formatBillingError surfaces RevenueCat underlying error details', () => {
  const formatted = formatBillingError({
    message: 'There is an issue with your configuration. Check the underlying error for more details.',
    code: '23',
    readableErrorCode: 'CONFIGURATION_ERROR',
    underlyingErrorMessage: 'Product ds_premium_lifetime not found in Play Store.',
  });

  assert.match(formatted, /configuration/i);
  assert.match(formatted, /CONFIGURATION_ERROR/);
  assert.match(formatted, /ds_premium_lifetime/);
});

test('isProductAlreadyOwnedError matches Play and RevenueCat already-owned errors', () => {
  assert.equal(
    isProductAlreadyOwnedError({
      message: 'This product is already active for the user.',
      code: 6,
      readableErrorCode: 'PRODUCT_ALREADY_PURCHASED',
    }),
    true
  );
  assert.equal(isProductAlreadyOwnedError({ userCancelled: true, code: '1' }), false);
});

test('buildBillingSetupHints includes Play product and license tester guidance', () => {
  const hints = buildBillingSetupHints({
    productId: 'ds_premium_lifetime',
    entitlementId: 'pro',
    offeringsLoaded: false,
    revenueCatConfigured: true,
    errorText: 'configuration issue',
  });

  assert.ok(hints.some((hint) => hint.includes('ds_premium_lifetime')));
  assert.ok(hints.some((hint) => hint.includes('License testing')));
  assert.ok(hints.some((hint) => hint.includes('RevenueCat')));
});
