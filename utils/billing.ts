import Constants from 'expo-constants';

import type { BillingProvider, BillingState, PremiumTier } from './types.ts';

type RuntimeConfig = {
  revenueCatApiKey?: string;
};

function getRuntimeConfig(): RuntimeConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as RuntimeConfig;
  return extra;
}

export async function initializeBilling(currentTier: PremiumTier): Promise<BillingState> {
  const config = getRuntimeConfig();
  const provider: BillingProvider = config.revenueCatApiKey ? 'revenuecat' : 'mock';

  // RevenueCat-ready fallback:
  // If a RevenueCat API key is present later, this state can be replaced with a real SDK-backed implementation.
  return {
    provider,
    isConfigured: provider === 'revenuecat',
    offeringsLoaded: true,
    packageLabel: currentTier === 'pro' ? 'Dealer Guard Pro Active' : 'Dealer Guard Pro',
    lastSyncAt: new Date().toISOString(),
  };
}

export async function purchaseProEntitlement(): Promise<{ tier: PremiumTier; note: string }> {
  const config = getRuntimeConfig();
  if (config.revenueCatApiKey) {
    return {
      tier: 'pro',
      note: 'RevenueCat configuration detected. Wire the SDK package to replace the mock purchase action.',
    };
  }

  return {
    tier: 'pro',
    note: 'Mock paywall purchase completed locally. Install RevenueCat later to turn this into a real entitlement.',
  };
}

export async function restoreProEntitlement(currentTier: PremiumTier): Promise<{ tier: PremiumTier; note: string }> {
  if (currentTier === 'pro') {
    return {
      tier: 'pro',
      note: 'Pro access is already active on this device.',
    };
  }

  return {
    tier: 'free',
    note: 'No prior purchase was found in the local mock billing flow.',
  };
}
