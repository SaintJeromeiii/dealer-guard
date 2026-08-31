import type { PremiumTier } from './types.ts';

export type CustomerEntitlementSnapshot = {
  entitlements?: {
    active?: Record<string, { isActive?: boolean } | undefined>;
    all?: Record<string, { isActive?: boolean } | undefined>;
  };
  allPurchasedProductIdentifiers?: string[];
  nonSubscriptionTransactions?: Array<{ productIdentifier?: string }>;
};

function findEntitlement(
  collection: Record<string, { isActive?: boolean } | undefined> | undefined,
  entitlementId: string
) {
  if (!collection) return undefined;
  if (collection[entitlementId]) return collection[entitlementId];

  const match = Object.keys(collection).find((key) => key.toLowerCase() === entitlementId.toLowerCase());
  return match ? collection[match] : undefined;
}

function ownsLifetimeProduct(customerInfo: CustomerEntitlementSnapshot, lifetimeProductId?: string) {
  if (!lifetimeProductId) return false;

  const purchased = customerInfo.allPurchasedProductIdentifiers ?? [];
  if (purchased.includes(lifetimeProductId)) return true;

  return (customerInfo.nonSubscriptionTransactions ?? []).some(
    (transaction) => transaction.productIdentifier === lifetimeProductId
  );
}

/** Presence in `entitlements.active` means the entitlement is active, even if `isActive` is omitted. */
export function inferPremiumTierFromCustomerInfo(
  customerInfo: CustomerEntitlementSnapshot,
  entitlementId: string,
  lifetimeProductId?: string
): PremiumTier {
  const activeEntitlement = findEntitlement(customerInfo.entitlements?.active, entitlementId);
  if (activeEntitlement && activeEntitlement.isActive !== false) return 'pro';

  const recordedEntitlement = findEntitlement(customerInfo.entitlements?.all, entitlementId);
  if (recordedEntitlement?.isActive) return 'pro';

  if (ownsLifetimeProduct(customerInfo, lifetimeProductId)) return 'pro';

  return 'free';
}
