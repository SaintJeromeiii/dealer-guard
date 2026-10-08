import type { BillingState, PremiumTier } from './types.ts';

let mockRevenueCatValidation = false;

export function setMockRevenueCatValidation(enabled: boolean) {
  mockRevenueCatValidation = enabled;
}

export function isMockRevenueCatValidationEnabled() {
  return mockRevenueCatValidation;
}

export function isPaywallBypassed() {
  return mockRevenueCatValidation;
}

export function resolvePremiumTier(tier: PremiumTier): PremiumTier {
  return mockRevenueCatValidation ? 'pro' : tier;
}

/** Paid Pro only comes from RevenueCat entitlements or an explicit purchase result — never from local mock state. */
export function resolveSyncedPremiumTier(options: {
  billing: Pick<BillingState, 'provider' | 'entitlementStatus'>;
  tierOverride?: PremiumTier;
}): PremiumTier {
  if (isPaywallBypassed()) return 'pro';
  if (options.tierOverride) return resolvePremiumTier(options.tierOverride);
  if (options.billing.provider === 'revenuecat' && options.billing.entitlementStatus === 'active') return 'pro';
  return 'free';
}

export function buildBypassBillingState(): BillingState {
  return {
    provider: 'mock',
    isConfigured: true,
    offeringsLoaded: true,
    packageLabel: 'Sign Check Pro Active (dev bypass)',
    entitlementStatus: 'active',
    offeringId: null,
    packageId: 'ds_premium_lifetime',
    customerInfoNote:
      'MOCK_REVENUECAT_VALIDATION is enabled for local development only. Disable before store submission.',
    lastSyncAt: new Date().toISOString(),
  };
}
