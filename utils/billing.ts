import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { BillingProvider, BillingState, PremiumTier } from './types.ts';

type RuntimeConfig = {
  revenueCatApiKey?: string;
  revenueCatOfferingId?: string;
  revenueCatPackageId?: string;
};

function getRuntimeConfig(): RuntimeConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as RuntimeConfig;
  return extra;
}

async function getPurchasesModule() {
  if (Platform.OS === 'web') return null;
  const module = await import('react-native-purchases');
  return module.default;
}

function inferTierFromEntitlement(activeEntitlements: Record<string, unknown> | null | undefined): PremiumTier {
  return activeEntitlements && Object.keys(activeEntitlements).length > 0 ? 'pro' : 'free';
}

export async function initializeBilling(currentTier: PremiumTier): Promise<BillingState> {
  const config = getRuntimeConfig();
  const provider: BillingProvider = config.revenueCatApiKey ? 'revenuecat' : 'mock';

  if (provider === 'revenuecat') {
    try {
      const Purchases = await getPurchasesModule();
      if (!Purchases) {
        return {
          provider,
          isConfigured: true,
          offeringsLoaded: false,
          packageLabel: currentTier === 'pro' ? 'DealShield Pro Active' : 'DealShield Pro',
          entitlementStatus: currentTier === 'pro' ? 'active' : 'inactive',
          offeringId: config.revenueCatOfferingId ?? null,
          packageId: config.revenueCatPackageId ?? null,
          customerInfoNote: 'RevenueCat is configured, but live store purchases are only available in the native app, not web.',
          lastSyncAt: new Date().toISOString(),
        };
      }

      await Purchases.configure({ apiKey: config.revenueCatApiKey ?? '' });
      const [offerings, customerInfo] = await Promise.all([Purchases.getOfferings(), Purchases.getCustomerInfo()]);
      const currentOffering = offerings.current ?? null;
      const selectedPackage =
        currentOffering?.availablePackages.find((pkg) => (config.revenueCatPackageId ? pkg.identifier === config.revenueCatPackageId : true)) ?? null;

      return {
        provider,
        isConfigured: true,
        offeringsLoaded: !!currentOffering,
        packageLabel: selectedPackage?.product.title ?? currentOffering?.serverDescription ?? 'DealShield Pro',
        entitlementStatus: inferTierFromEntitlement(customerInfo.entitlements.active) === 'pro' ? 'active' : 'inactive',
        offeringId: currentOffering?.identifier ?? config.revenueCatOfferingId ?? null,
        packageId: selectedPackage?.identifier ?? config.revenueCatPackageId ?? null,
        customerInfoNote: Object.keys(customerInfo.entitlements.active).length > 0 ? 'Live RevenueCat entitlement detected.' : 'RevenueCat is configured, but no active entitlement was found yet.',
        lastSyncAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        provider,
        isConfigured: true,
        offeringsLoaded: false,
        packageLabel: currentTier === 'pro' ? 'DealShield Pro Active' : 'DealShield Pro',
        entitlementStatus: currentTier === 'pro' ? 'active' : 'inactive',
        offeringId: config.revenueCatOfferingId ?? null,
        packageId: config.revenueCatPackageId ?? null,
        customerInfoNote: `RevenueCat setup was detected, but live sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastSyncAt: new Date().toISOString(),
      };
    }
  }

  return {
    provider: 'mock',
    isConfigured: false,
    offeringsLoaded: true,
    packageLabel: currentTier === 'pro' ? 'DealShield Pro Active' : 'DealShield Pro',
    entitlementStatus: currentTier === 'pro' ? 'active' : 'inactive',
    offeringId: null,
    packageId: null,
    customerInfoNote: 'Using the local mock billing path. Purchases are not live yet.',
    lastSyncAt: new Date().toISOString(),
  };
}

export async function purchaseProEntitlement(): Promise<{ tier: PremiumTier; note: string }> {
  const config = getRuntimeConfig();
  if (config.revenueCatApiKey) {
    try {
      const Purchases = await getPurchasesModule();
      if (!Purchases) {
        return {
          tier: 'free',
          note: 'RevenueCat purchases must be completed from the native iOS or Android app, not the web preview.',
        };
      }

      await Purchases.configure({ apiKey: config.revenueCatApiKey });
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      const selectedPackage =
        currentOffering?.availablePackages.find((pkg) => (config.revenueCatPackageId ? pkg.identifier === config.revenueCatPackageId : true)) ?? null;

      if (!selectedPackage) {
        return {
          tier: 'free',
          note: 'RevenueCat is configured, but no matching package was found. Check your offering and package IDs.',
        };
      }

      const purchaseResult = await Purchases.purchasePackage(selectedPackage);
      return {
        tier: inferTierFromEntitlement(purchaseResult.customerInfo.entitlements.active),
        note:
          Object.keys(purchaseResult.customerInfo.entitlements.active).length > 0
            ? 'Purchase completed and a live Pro entitlement is now active.'
            : 'Purchase flow finished, but no active entitlement was returned. Check the RevenueCat dashboard configuration.',
      };
    } catch (error) {
      return {
        tier: 'free',
        note: `RevenueCat purchase did not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  return {
    tier: 'pro',
    note: 'Mock paywall purchase completed locally. Install RevenueCat later to turn this into a real entitlement.',
  };
}

export async function restoreProEntitlement(currentTier: PremiumTier): Promise<{ tier: PremiumTier; note: string }> {
  const config = getRuntimeConfig();
  if (config.revenueCatApiKey) {
    try {
      const Purchases = await getPurchasesModule();
      if (!Purchases) {
        return {
          tier: currentTier,
          note: 'Restore is only available from the native iOS or Android app, not the web preview.',
        };
      }

      await Purchases.configure({ apiKey: config.revenueCatApiKey });
      const customerInfo = await Purchases.restorePurchases();
      const tier = inferTierFromEntitlement(customerInfo.entitlements.active);
      return {
        tier,
        note: tier === 'pro' ? 'Restore completed and Pro is active.' : 'Restore completed, but no active Pro entitlement was found.',
      };
    } catch (error) {
      return {
        tier: currentTier,
        note: `Restore did not complete: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  if (currentTier === 'pro') {
    return {
      tier: 'pro',
      note: 'Pro access is already active on this device. Live restore still needs the Purchases SDK if you want store-backed entitlements.',
    };
  }

  return {
    tier: 'free',
    note: 'No prior purchase was found in the local mock billing flow.',
  };
}
