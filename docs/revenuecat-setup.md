# RevenueCat Setup

## Goal
Use RevenueCat to unlock DealShield Pro through the Google Play lifetime product `ds_premium_lifetime`.

## Product model
- Google Play one-time product ID: `ds_premium_lifetime`
- RevenueCat entitlement identifier: `pro` (configurable in `app.json`)

## Runtime config (`app.json` → `expo.extra`)
- `revenueCatApiKeyAndroid` — RevenueCat Google Play public SDK key (`goog_...`)
- `revenueCatApiKeyIos` — RevenueCat App Store public SDK key (when iOS launches)
- `revenueCatApiKey` — optional shared fallback
- `revenueCatEntitlementId` — defaults to `pro`
- `revenueCatLifetimeProductId` — defaults to `ds_premium_lifetime`
- `revenueCatOfferingId` / `revenueCatPackageId` — optional fallback if you later sell through an offering package

`app.config.js` injects platform keys from EAS environment variables at build time.

## Google Play Console checklist
1. Open **Monetize with Play** → **Products** → **In-app products**.
2. Create a **one-time** product with product ID exactly `ds_premium_lifetime`.
3. Set title, description, and price. Activate the product.
4. Add license testers under **Setup** → **License testing** for purchase QA.
5. Upload a signed build to an internal/closed testing track before products appear in sandbox purchases.

## RevenueCat dashboard checklist
1. Create a `pro` entitlement (or match `revenueCatEntitlementId`).
2. Add the Google Play app with package `com.jleonanderson.signshield`.
3. Attach the Google Play product `ds_premium_lifetime` to the `pro` entitlement.
4. Copy the Android **public** SDK key (`goog_...`) — not the secret API key.

## EAS secret (required for live Play builds)
Store the public Android SDK key as a project environment variable:

```bash
eas env:create --scope project --name REVENUECAT_ANDROID_API_KEY --value "goog_..." --environment production --visibility secret
```

`app.config.js` maps that value into `expo.extra.revenueCatApiKeyAndroid` during `play-test` and `production` builds.

## App behavior
- On launch, the app configures RevenueCat when an API key is present.
- It loads `ds_premium_lifetime` with `getProducts` and purchases with `purchaseStoreProduct`.
- Restore uses `restorePurchases` and re-checks the `pro` entitlement.
- A customer-info listener keeps Pro status in sync after purchases complete.
- Without an API key, the app stays on the local mock billing path for development.

## QA checklist
- Fresh install starts on Free plan
- Lifetime purchase unlocks Pro immediately
- Restore works across reinstalls
- Cancelled purchase leaves tier unchanged
- Offline launch preserves last known local state until RevenueCat sync completes

## Legal URLs (store review)
- Privacy policy: https://saintjeromeiii.github.io/dealshield-legal/#privacy
- Legal disclaimer: https://saintjeromeiii.github.io/dealshield-legal/#disclaimer
