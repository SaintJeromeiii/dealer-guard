# RevenueCat Setup

## Goal
Use RevenueCat to unlock DealShield Pro through a Google Play lifetime product.

## Product model
- Google Play one-time product ID: `ds_premium_lifetime`
- RevenueCat entitlement identifier: `pro` (configurable in `app.json`)

## Runtime config (`app.json` → `expo.extra`)
Set:
- `revenueCatApiKeyAndroid` — RevenueCat Google Play API key
- `revenueCatApiKeyIos` — RevenueCat App Store API key (when iOS launches)
- `revenueCatApiKey` — optional shared fallback if you only use one key field
- `revenueCatEntitlementId` — defaults to `pro`
- `revenueCatLifetimeProductId` — defaults to `ds_premium_lifetime`
- `revenueCatOfferingId` / `revenueCatPackageId` — optional fallback if you later sell through an offering package instead of the lifetime product

## RevenueCat dashboard checklist
1. Create a `pro` entitlement (or match `revenueCatEntitlementId`).
2. Attach the Google Play product `ds_premium_lifetime` to that entitlement.
3. Paste the Android public SDK key into `revenueCatApiKeyAndroid`.
4. Build a native Android dev/preview build (not Expo Go).
5. Use a licensed tester account in Google Play Console.

## App behavior
- On launch, the app configures RevenueCat when an API key is present.
- It loads the lifetime product with `getProducts` and purchases with `purchaseStoreProduct`.
- Restore uses `restorePurchases` and re-checks the `pro` entitlement.
- Without an API key, the app stays on the local mock billing path for development.

## QA checklist
- Fresh install starts on Free plan
- Lifetime purchase unlocks Pro immediately
- Restore works across reinstalls
- Cancelled purchase leaves tier unchanged
- Offline launch preserves last known local state until RevenueCat sync completes
