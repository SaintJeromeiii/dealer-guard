# RevenueCat Setup

## Goal
Replace the local mock paywall with a real subscription entitlement flow.

## Current App State
- The app already contains a billing abstraction in `utils/billing.ts`.
- If `expo.extra.revenueCatApiKey` is present in `app.json` or environment-backed config, the UI switches to a RevenueCat-ready status message.
- Purchase and restore actions are still mocked until the real SDK is installed and wired.

## Next Production Steps
1. Install the RevenueCat SDK compatible with your Expo workflow.
2. Create the `Dealer Guard Pro` entitlement and at least one current offering in RevenueCat.
3. Add the API key to runtime config.
4. Replace the mock `purchaseProEntitlement` and `restoreProEntitlement` implementations with real SDK calls.
5. Return the entitlement state through `initializeBilling`.

## Runtime Config
Set:
- `expo.extra.revenueCatApiKey`

## Purchase Rules
- Free users keep core deal review, OCR import, and second-opinion sharing.
- Pro unlocks buyer report, dealer scorecards, session playbook, and future premium analysis tools.

## QA Checklist
- Fresh install starts on `Free plan`
- Purchase unlocks Pro immediately
- Restore works across reinstalls
- Failed purchase leaves tier unchanged
- Offline launch preserves last known entitlement until sync completes
