import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  buildBillingChecklistNote,
  buildBillingSetupHints,
  formatBillingError,
  getDefaultAndroidPackageName,
  isProductAlreadyOwnedError,
} from './billing-messages.ts';
import { inferPremiumTierFromCustomerInfo } from './billing-entitlements.ts';
import { buildBypassBillingState, isPaywallBypassed, resolvePremiumTier } from './billing-config.ts';
import type { BillingProvider, BillingState, PremiumTier } from './types.ts';

export {
  isMockRevenueCatValidationEnabled,
  isPaywallBypassed,
  resolvePremiumTier,
  resolveSyncedPremiumTier,
  setMockRevenueCatValidation,
} from './billing-config.ts';
export {
  hasPremiumFeatureAccess,
  isBillingStoreUnavailable,
  isPremiumPreviewAllowed,
  isPremiumPreviewModeEnabled,
  loadPremiumPreviewMode,
  PREMIUM_PREVIEW_DISCLAIMER,
  savePremiumPreviewMode,
  setPremiumPreviewMode,
} from './premium-preview.ts';
export { formatBillingError, buildBillingSetupHints, isProductAlreadyOwnedError } from './billing-messages.ts';

type RuntimeConfig = {
  revenueCatApiKey?: string;
  revenueCatApiKeyAndroid?: string;
  revenueCatApiKeyIos?: string;
  revenueCatEntitlementId?: string;
  revenueCatLifetimeProductId?: string;
  revenueCatOfferingId?: string;
  revenueCatPackageId?: string;
};

type PurchasesSdk = {
  Purchases: {
    configure: (config: { apiKey: string }) => void;
    getCustomerInfo: () => Promise<CustomerInfo>;
    getOfferings: () => Promise<Offerings>;
    getProducts: (productIdentifiers: string[], type?: string) => Promise<StoreProduct[]>;
    purchaseStoreProduct: (product: StoreProduct) => Promise<PurchaseResult>;
    purchasePackage: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
    restorePurchases: () => Promise<CustomerInfo>;
    syncPurchases?: () => Promise<void>;
    addCustomerInfoUpdateListener: (listener: (customerInfo: CustomerInfo) => void) => void;
    removeCustomerInfoUpdateListener: (listener: (customerInfo: CustomerInfo) => void) => void;
  };
  PRODUCT_CATEGORY: {
    NON_SUBSCRIPTION: string;
    SUBSCRIPTION: string;
  };
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: string;
    PRODUCT_ALREADY_PURCHASED_ERROR: string;
  };
};

type CustomerInfo = {
  originalAppUserId?: string;
  appUserID?: string;
  entitlements: {
    active: Record<string, { isActive?: boolean } | undefined>;
    all?: Record<string, { isActive?: boolean } | undefined>;
  };
  allPurchasedProductIdentifiers?: string[];
  nonSubscriptionTransactions?: Array<{ productIdentifier?: string }>;
};

type StoreProduct = {
  identifier: string;
  title: string;
  priceString: string;
};

type PurchasesPackage = {
  identifier: string;
  product: StoreProduct;
};

type Offerings = {
  current: {
    identifier: string;
    serverDescription?: string | null;
    availablePackages: PurchasesPackage[];
  } | null;
};

type PurchaseResult = {
  customerInfo: CustomerInfo;
};

const DEFAULT_ENTITLEMENT_ID = 'pro';
const DEFAULT_LIFETIME_PRODUCT_ID = 'ds_premium_lifetime';

export type BillingDiagnostics = {
  provider: BillingProvider;
  revenueCatConfigured: boolean;
  lifetimeProductId: string;
  entitlementId: string;
  packageName: string;
  offeringsLoaded: boolean;
  productResolved: boolean;
  productLabel: string | null;
  appUserId: string | null;
  syncNote: string | null;
  setupHints: string[];
};

let purchasesConfigured = false;
let storeConfirmedLifetimePro = false;

function markStoreConfirmedLifetimePro() {
  storeConfirmedLifetimePro = true;
}

function inferTierFromCustomerInfo(customerInfo: CustomerInfo, entitlementId: string, lifetimeProductId?: string): PremiumTier {
  if (storeConfirmedLifetimePro) return 'pro';
  return inferPremiumTierFromCustomerInfo(customerInfo, entitlementId, lifetimeProductId);
}

async function refreshPurchasesFromStore(sdk: PurchasesSdk) {
  if (typeof sdk.Purchases.syncPurchases === 'function') {
    await sdk.Purchases.syncPurchases().catch(() => undefined);
  }
  return sdk.Purchases.restorePurchases();
}

function getAndroidPackageName() {
  return Constants.expoConfig?.android?.package ?? getDefaultAndroidPackageName();
}

function getRuntimeConfig(): RuntimeConfig {
  return (Constants.expoConfig?.extra ?? {}) as RuntimeConfig;
}

function getRevenueCatApiKey(config: RuntimeConfig) {
  const platformKey =
    Platform.OS === 'android'
      ? config.revenueCatApiKeyAndroid?.trim()
      : Platform.OS === 'ios'
        ? config.revenueCatApiKeyIos?.trim()
        : '';

  return platformKey || config.revenueCatApiKey?.trim() || '';
}

function getEntitlementId(config: RuntimeConfig) {
  return config.revenueCatEntitlementId?.trim() || DEFAULT_ENTITLEMENT_ID;
}

function getLifetimeProductId(config: RuntimeConfig) {
  return config.revenueCatLifetimeProductId?.trim() || DEFAULT_LIFETIME_PRODUCT_ID;
}

function usesRevenueCat(config: RuntimeConfig) {
  return getRevenueCatApiKey(config).length > 0;
}

function formatStoreProductLabel(product: StoreProduct) {
  return product.priceString ? `${product.title} — ${product.priceString}` : product.title;
}

function isPurchaseCancelled(error: unknown, purchasesErrorCode?: string) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { userCancelled?: boolean; code?: string };
  return candidate.userCancelled === true || candidate.code === purchasesErrorCode;
}

async function getPurchasesSdk(): Promise<PurchasesSdk | null> {
  if (Platform.OS === 'web') return null;

  const module = await import('react-native-purchases');
  return {
    Purchases: module.default,
    PRODUCT_CATEGORY: module.PRODUCT_CATEGORY,
    PURCHASES_ERROR_CODE: module.PURCHASES_ERROR_CODE,
  };
}

async function ensurePurchasesConfigured(apiKey: string) {
  const sdk = await getPurchasesSdk();
  if (!sdk) return null;

  if (!purchasesConfigured) {
    sdk.Purchases.configure({ apiKey });
    purchasesConfigured = true;
  }

  return sdk;
}

async function resolveLifetimeStoreProduct(sdk: PurchasesSdk, productId: string) {
  const nonSubscriptionProducts = await sdk.Purchases.getProducts([productId], sdk.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  if (nonSubscriptionProducts[0]) return nonSubscriptionProducts[0];

  const products = await sdk.Purchases.getProducts([productId]);
  return products[0] ?? null;
}

function resolveOfferingPackage(offerings: Offerings, config: RuntimeConfig) {
  const currentOffering = offerings.current;
  if (!currentOffering) return null;

  if (config.revenueCatOfferingId && currentOffering.identifier !== config.revenueCatOfferingId) {
    return null;
  }

  if (config.revenueCatPackageId) {
    return currentOffering.availablePackages.find((pkg) => pkg.identifier === config.revenueCatPackageId) ?? null;
  }

  return currentOffering.availablePackages[0] ?? null;
}

async function syncRevenueCatBillingState(currentTier: PremiumTier): Promise<BillingState> {
  const config = getRuntimeConfig();
  const apiKey = getRevenueCatApiKey(config);
  const entitlementId = getEntitlementId(config);
  const lifetimeProductId = getLifetimeProductId(config);

  if (!apiKey) {
    return buildMockBillingState(currentTier);
  }

  try {
    const sdk = await ensurePurchasesConfigured(apiKey);
    if (!sdk) {
      return {
        provider: 'revenuecat',
        isConfigured: true,
        offeringsLoaded: false,
        packageLabel: currentTier === 'pro' ? 'DealShield Pro Active' : 'DealShield Pro',
        entitlementStatus: currentTier === 'pro' ? 'active' : 'inactive',
        offeringId: config.revenueCatOfferingId ?? null,
        packageId: lifetimeProductId,
        customerInfoNote: 'RevenueCat is configured, but purchases are only available in the native app.',
        lastSyncAt: new Date().toISOString(),
      };
    }

    const [customerInfo, lifetimeProduct, offerings] = await Promise.all([
      sdk.Purchases.getCustomerInfo(),
      resolveLifetimeStoreProduct(sdk, lifetimeProductId).catch(() => null),
      sdk.Purchases.getOfferings().catch(() => ({ current: null })),
    ]);

    const tier = inferTierFromCustomerInfo(customerInfo, entitlementId, lifetimeProductId);
    const offeringPackage = resolveOfferingPackage(offerings, config);
    const activeProduct = lifetimeProduct ?? offeringPackage?.product ?? null;

    return {
      provider: 'revenuecat',
      isConfigured: true,
      offeringsLoaded: !!lifetimeProduct || !!offeringPackage,
      packageLabel:
        tier === 'pro'
          ? 'DealShield Pro Active'
          : activeProduct
            ? formatStoreProductLabel(activeProduct)
            : 'DealShield Pro Lifetime',
      entitlementStatus: tier === 'pro' ? 'active' : 'inactive',
      offeringId: offerings.current?.identifier ?? config.revenueCatOfferingId ?? null,
      packageId: activeProduct?.identifier ?? lifetimeProductId,
      customerInfoNote:
        tier === 'pro'
          ? 'Lifetime Pro access is active on this account.'
          : lifetimeProduct
            ? 'Ready to purchase lifetime Pro access from Google Play.'
            : 'RevenueCat is configured, but the lifetime product was not found yet. Confirm `ds_premium_lifetime` is attached to your Pro entitlement.',
      lastSyncAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      provider: 'revenuecat',
      isConfigured: true,
      offeringsLoaded: false,
      packageLabel: currentTier === 'pro' ? 'DealShield Pro Active' : 'DealShield Pro Lifetime',
      entitlementStatus: currentTier === 'pro' ? 'active' : 'inactive',
      offeringId: config.revenueCatOfferingId ?? null,
      packageId: lifetimeProductId,
      customerInfoNote: `RevenueCat sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastSyncAt: new Date().toISOString(),
    };
  }
}

function buildMockBillingState(currentTier: PremiumTier): BillingState {
  return {
    provider: 'mock',
    isConfigured: false,
    offeringsLoaded: true,
    packageLabel: currentTier === 'pro' ? 'DealShield Pro Active' : 'DealShield Pro Lifetime',
    entitlementStatus: currentTier === 'pro' ? 'active' : 'inactive',
    offeringId: null,
    packageId: getLifetimeProductId(getRuntimeConfig()),
    customerInfoNote: 'Using the local mock billing path. Purchases are not live yet.',
    lastSyncAt: new Date().toISOString(),
  };
}

async function purchaseLifetimeProduct(
  sdk: PurchasesSdk,
  productId: string,
  entitlementId: string
): Promise<{ tier: PremiumTier; note: string } | null> {
  const product = await resolveLifetimeStoreProduct(sdk, productId);
  if (!product) return null;

  const purchaseResult = await sdk.Purchases.purchaseStoreProduct(product);
  markStoreConfirmedLifetimePro();
  let tier = inferTierFromCustomerInfo(purchaseResult.customerInfo, entitlementId, productId);
  if (tier !== 'pro') {
    const restoredInfo = await refreshPurchasesFromStore(sdk).catch(() => purchaseResult.customerInfo);
    tier = inferTierFromCustomerInfo(restoredInfo, entitlementId, productId);
  }

  return {
    tier: 'pro',
    note:
      tier === 'pro'
        ? 'Lifetime purchase completed. DealShield Pro is now active on this account.'
        : 'Purchase completed. DealShield Pro is unlocked on this device while the store finishes syncing.',
  };
}

async function purchaseOfferingPackage(
  sdk: PurchasesSdk,
  config: RuntimeConfig,
  entitlementId: string
): Promise<{ tier: PremiumTier; note: string } | null> {
  const offerings = await sdk.Purchases.getOfferings();
  const selectedPackage = resolveOfferingPackage(offerings, config);
  if (!selectedPackage) return null;

  const purchaseResult = await sdk.Purchases.purchasePackage(selectedPackage);
  markStoreConfirmedLifetimePro();
  let tier = inferTierFromCustomerInfo(purchaseResult.customerInfo, entitlementId, selectedPackage.product.identifier);
  if (tier !== 'pro') {
    const restoredInfo = await refreshPurchasesFromStore(sdk).catch(() => purchaseResult.customerInfo);
    tier = inferTierFromCustomerInfo(restoredInfo, entitlementId, selectedPackage.product.identifier);
  }

  return {
    tier: 'pro',
    note:
      tier === 'pro'
        ? 'Purchase completed and DealShield Pro is now active.'
        : 'Purchase completed. DealShield Pro is unlocked on this device while the store finishes syncing.',
  };
}

export async function initializeBilling(currentTier: PremiumTier): Promise<BillingState> {
  if (isPaywallBypassed()) {
    return buildBypassBillingState();
  }

  const config = getRuntimeConfig();
  if (!usesRevenueCat(config)) {
    return buildMockBillingState(resolvePremiumTier(currentTier));
  }

  try {
    const sdk = await ensurePurchasesConfigured(getRevenueCatApiKey(config));
    if (sdk) {
      await refreshPurchasesFromStore(sdk);
    }
  } catch {
    // Fall through to a normal customer-info sync if Play restore is unavailable.
  }

  return syncRevenueCatBillingState(resolvePremiumTier(currentTier));
}

export async function getBillingDiagnostics(currentTier: PremiumTier = 'free'): Promise<BillingDiagnostics> {
  const config = getRuntimeConfig();
  const lifetimeProductId = getLifetimeProductId(config);
  const entitlementId = getEntitlementId(config);
  const packageName = getAndroidPackageName();
  const revenueCatConfigured = usesRevenueCat(config);

  if (isPaywallBypassed()) {
    return {
      provider: 'mock',
      revenueCatConfigured,
      lifetimeProductId,
      entitlementId,
      packageName,
      offeringsLoaded: true,
      productResolved: true,
      productLabel: 'DealShield Pro Active (dev bypass)',
      appUserId: null,
      syncNote: buildBypassBillingState().customerInfoNote,
      setupHints: [
        'MOCK_REVENUECAT_VALIDATION is true in app/(main)/index.tsx.',
        'Set MOCK_REVENUECAT_VALIDATION to false before publishing once Play ↔ RevenueCat sync is complete.',
      ],
    };
  }

  if (!revenueCatConfigured) {
    const hints = buildBillingSetupHints({
      productId: lifetimeProductId,
      entitlementId,
      packageName,
      offeringsLoaded: false,
      revenueCatConfigured: false,
    });

    return {
      provider: 'mock',
      revenueCatConfigured: false,
      lifetimeProductId,
      entitlementId,
      packageName,
      offeringsLoaded: false,
      productResolved: false,
      productLabel: null,
      appUserId: null,
      syncNote: 'RevenueCat API key is missing in this build. Play purchases require a store build with REVENUECAT_ANDROID_API_KEY.',
      setupHints: hints,
    };
  }

  const billing = await syncRevenueCatBillingState(currentTier);
  let productResolved = billing.offeringsLoaded;
  let productLabel = billing.packageLabel;
  let appUserId: string | null = null;

  try {
    const sdk = await ensurePurchasesConfigured(getRevenueCatApiKey(config));
    if (sdk) {
      const customerInfo = await sdk.Purchases.getCustomerInfo();
      appUserId = customerInfo.originalAppUserId ?? customerInfo.appUserID ?? null;
      const product = await resolveLifetimeStoreProduct(sdk, lifetimeProductId);
      productResolved = Boolean(product);
      if (product) {
        productLabel = formatStoreProductLabel(product);
      }
    }
  } catch {
    productResolved = false;
  }

  const hints = buildBillingSetupHints({
    productId: lifetimeProductId,
    entitlementId,
    packageName,
    offeringsLoaded: productResolved,
    revenueCatConfigured: true,
    errorText: billing.customerInfoNote ?? undefined,
  });

  return {
    provider: billing.provider,
    revenueCatConfigured: true,
    lifetimeProductId,
    entitlementId,
    packageName,
    offeringsLoaded: billing.offeringsLoaded,
    productResolved,
    productLabel,
    appUserId,
    syncNote: billing.customerInfoNote,
    setupHints: productResolved
      ? [
          'Store product is visible to this install.',
          'If purchase still fails, install from Play internal/closed testing and add your Google account as a license tester.',
        ]
      : hints,
  };
}

export async function purchaseProEntitlement(): Promise<{ tier: PremiumTier; note: string }> {
  if (isPaywallBypassed()) {
    return {
      tier: 'pro',
      note: 'MOCK_REVENUECAT_VALIDATION is enabled. DealShield Pro is already unlocked on this device for local testing.',
    };
  }

  const config = getRuntimeConfig();
  const apiKey = getRevenueCatApiKey(config);

  if (!apiKey) {
    return {
      tier: 'free',
      note: 'Google Play billing is not available in this build. Install DealShield from the Play Store closed test to purchase lifetime Pro.',
    };
  }

  let sdk: PurchasesSdk | null = null;

  try {
    sdk = await ensurePurchasesConfigured(apiKey);
    if (!sdk) {
      return {
        tier: 'free',
        note: 'Purchases must be completed from the native Android or iOS app.',
      };
    }

    const entitlementId = getEntitlementId(config);
    const lifetimeProductId = getLifetimeProductId(config);
    const packageName = getAndroidPackageName();
    const existingInfo = await sdk.Purchases.getCustomerInfo();
    if (inferTierFromCustomerInfo(existingInfo, entitlementId, lifetimeProductId) === 'pro') {
      markStoreConfirmedLifetimePro();
      return {
        tier: 'pro',
        note: 'Lifetime Pro is already active on this Google account.',
      };
    }

    const lifetimeProduct = await resolveLifetimeStoreProduct(sdk, lifetimeProductId);

    if (!lifetimeProduct) {
      const hints = buildBillingSetupHints({
        productId: lifetimeProductId,
        entitlementId,
        packageName,
        offeringsLoaded: false,
        revenueCatConfigured: true,
      });

      return {
        tier: 'free',
        note: buildBillingChecklistNote(
          `Could not load "${lifetimeProductId}" from Google Play.`,
          'RevenueCat is configured, but the lifetime product is not available to this install yet.',
          hints
        ),
      };
    }

    const lifetimeResult = await purchaseLifetimeProduct(sdk, lifetimeProductId, entitlementId);
    if (lifetimeResult) return lifetimeResult;

    const offeringResult = await purchaseOfferingPackage(sdk, config, entitlementId);
    if (offeringResult) return offeringResult;

    const hints = buildBillingSetupHints({
      productId: lifetimeProductId,
      entitlementId,
      packageName,
      offeringsLoaded: false,
      revenueCatConfigured: true,
    });

    return {
      tier: 'free',
      note: buildBillingChecklistNote(
        `Could not find the lifetime product (${lifetimeProductId}).`,
        'Confirm it exists in Google Play and is linked to your RevenueCat entitlement.',
        hints
      ),
    };
  } catch (error) {
    if (isPurchaseCancelled(error, sdk?.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)) {
      return {
        tier: 'free',
        note: 'Purchase cancelled.',
      };
    }

    if (sdk && isProductAlreadyOwnedError(error, sdk.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR)) {
      markStoreConfirmedLifetimePro();
      try {
        const customerInfo = await refreshPurchasesFromStore(sdk);
        inferTierFromCustomerInfo(customerInfo, getEntitlementId(config), getLifetimeProductId(config));
      } catch {
        // Play already confirmed ownership; unlock even if RevenueCat is late.
      }

      return {
        tier: 'pro',
        note: 'Lifetime Pro is already on this Google account. It is unlocked on this device.',
      };
    }

    const formatted = formatBillingError(error);
    const hints = buildBillingSetupHints({
      productId: getLifetimeProductId(config),
      entitlementId: getEntitlementId(config),
      packageName: getAndroidPackageName(),
      revenueCatConfigured: true,
      errorText: formatted,
    });

    return {
      tier: 'free',
      note: buildBillingChecklistNote('Purchase did not complete.', formatted, hints),
    };
  }
}

export function subscribeToBillingUpdates(onUpdate: (billing: BillingState) => void, currentTier: PremiumTier = 'free') {
  if (isPaywallBypassed()) {
    return () => {};
  }

  const config = getRuntimeConfig();
  if (!usesRevenueCat(config)) {
    return () => {};
  }

  let cancelled = false;
  let activeListener: ((customerInfo: CustomerInfo) => void) | null = null;
  let sdkRef: PurchasesSdk | null = null;

  void (async () => {
    const apiKey = getRevenueCatApiKey(config);
    const sdk = await ensurePurchasesConfigured(apiKey);
    if (!sdk || cancelled) return;

    sdkRef = sdk;
    activeListener = (customerInfo) => {
      const tier = inferTierFromCustomerInfo(customerInfo, getEntitlementId(config), getLifetimeProductId(config));
      void syncRevenueCatBillingState(tier).then((billing) => {
        if (!cancelled) onUpdate(billing);
      });
    };

    sdk.Purchases.addCustomerInfoUpdateListener(activeListener);
  })();

  return () => {
    cancelled = true;
    if (sdkRef && activeListener) {
      sdkRef.Purchases.removeCustomerInfoUpdateListener(activeListener);
    }
  };
}

export async function restoreProEntitlement(currentTier: PremiumTier): Promise<{ tier: PremiumTier; note: string }> {
  if (isPaywallBypassed()) {
    return {
      tier: 'pro',
      note: 'MOCK_REVENUECAT_VALIDATION is enabled. DealShield Pro is already active on this device.',
    };
  }

  const config = getRuntimeConfig();
  const apiKey = getRevenueCatApiKey(config);

  if (!apiKey) {
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

  try {
    const sdk = await ensurePurchasesConfigured(apiKey);
    if (!sdk) {
      return {
        tier: currentTier,
        note: 'Restore is only available from the native Android or iOS app.',
      };
    }

    const customerInfo = await refreshPurchasesFromStore(sdk);
    const tier = inferTierFromCustomerInfo(customerInfo, getEntitlementId(config), getLifetimeProductId(config));
    if (tier === 'pro') {
      markStoreConfirmedLifetimePro();
    }

    return {
      tier,
      note:
        tier === 'pro'
          ? 'Restore completed. Lifetime Pro access is active.'
          : 'Restore completed, but no active Pro purchase was found for this account.',
    };
  } catch (error) {
    const formatted = formatBillingError(error);
    const hints = buildBillingSetupHints({
      productId: getLifetimeProductId(config),
      entitlementId: getEntitlementId(config),
      packageName: getAndroidPackageName(),
      revenueCatConfigured: true,
      errorText: formatted,
    });

    return {
      tier: currentTier,
      note: buildBillingChecklistNote('Restore did not complete.', formatted, hints),
    };
  }
}
