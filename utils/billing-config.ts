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

export function buildBypassBillingState(): BillingState {
  return {
    provider: 'mock',
    isConfigured: true,
    offeringsLoaded: true,
    packageLabel: 'DealShield Pro Active (dev bypass)',
    entitlementStatus: 'active',
    offeringId: null,
    packageId: 'ds_premium_lifetime',
    customerInfoNote:
      'MOCK_REVENUECAT_VALIDATION is enabled for local development only. Disable before store submission.',
    lastSyncAt: new Date().toISOString(),
  };
}
