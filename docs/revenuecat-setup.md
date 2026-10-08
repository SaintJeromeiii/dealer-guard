# RevenueCat + Google Play Setup

## Goal
Unlock **Sign Check Pro** through the Google Play one-time product `ds_premium_lifetime`.

## Product model
- Google Play one-time product ID: `ds_premium_lifetime`
- RevenueCat entitlement identifier: `pro`
- Android package: `com.jleonanderson.signshield`

---

## Step-by-step: Google Play Console

### 1. Create the in-app product
1. Open [Google Play Console](https://play.google.com/console) → **Sign Check**
2. Go to **Monetize with Play** → **Products** → **In-app products**
3. Click **Create product**
4. Set **Product ID** to exactly: `ds_premium_lifetime`
5. Add title (e.g. `Sign Check Pro Lifetime`) and description
6. Set your price
7. Click **Save**, then set status to **Active**

> New products can take **several hours (up to 24–48h)** before test purchases work.

### 2. Upload a signed build first
Play billing products often will not resolve until at least one **AAB** is uploaded to a testing track.

```bash
npm run build:android:play
```

Upload the `.aab` to **Internal testing** (or Closed testing).

### 3. Add license testers
1. Play Console → **Setup** → **License testing**
2. Add the Google account email on your test phone
3. Save

### 4. Install from Play — not sideload
1. Join the internal/closed test via the opt-in link Play gives you
2. Install **Sign Check from the Play Store**
3. Do **not** test purchases on a debug APK sideloaded with `expo run:android`

---

## Step-by-step: RevenueCat dashboard

### 1. Create entitlement
1. Open [RevenueCat](https://app.revenuecat.com) → your project
2. Go to **Entitlements** → **+ New**
3. Identifier: `pro`

### 2. Add Android app
1. **Project settings** → **Apps** → **+ New**
2. Platform: **Google Play Store**
3. Package name: `com.jleonanderson.signshield` (must match exactly)

### 3. Connect Google Play service account
1. In RevenueCat → **Project settings** → **Google Play**
2. Follow RevenueCat’s guide to create a Google Cloud service account
3. Grant it access in Play Console → **Users and permissions**
4. Upload the JSON key to RevenueCat

Without this link, products may not sync and you’ll see **configuration** errors.

### 4. Attach product to entitlement
1. **Products** → find or import `ds_premium_lifetime`
2. Attach it to entitlement **`pro`**
3. Confirm product status shows as available

### 5. Copy the public Android SDK key
1. RevenueCat → **Project settings** → **API keys**
2. Copy the **public** Google Play SDK key (`goog_...`)
3. **Do not** use the secret server key in the mobile app

---

## Step-by-step: EAS (already partially done)

Your project already has `REVENUECAT_ANDROID_API_KEY` in the **production** EAS environment.

Verify:

```bash
eas env:list --environment production
```

`app.config.js` maps that into `expo.extra.revenueCatApiKeyAndroid` at build time.

After any key change, rebuild:

```bash
npm run build:android:play
```

---

## In-app diagnostics (new)

On **Settings → Pro details and restore**, free users see a **Billing diagnostics** card that shows:

- Whether RevenueCat is configured in this build
- Whether `ds_premium_lifetime` is visible to the install
- A setup checklist when something is missing

Purchase/restore errors now include the **underlying RevenueCat error** plus the same checklist.

### Dev builds vs Play builds
| Build type | Billing behavior |
|------------|------------------|
| `expo run:android` (local debug) | Mock billing — no real Play purchase |
| EAS `play-test` AAB from Play testing | Live RevenueCat + Google Play billing |

Local debug builds (`expo run:android`) still use mock billing. Premium Preview and `MOCK_REVENUECAT_VALIDATION` stay available there. Play testers purchase `ds_premium_lifetime` through Google Play — add their Gmail as a **license tester** so the Play sheet appears without charging a real card.

---

## Troubleshooting “configuration” errors

| Symptom | Likely fix |
|---------|------------|
| `There is an issue with your configuration` | Play product missing/inactive, or not linked in RevenueCat |
| Product not found | Wait for propagation; confirm product ID spelling |
| Purchase works on nothing | Install from Play testing track; add license tester |
| Mock billing message | Reinstall from a Play AAB build, not debug APK |
| Upgrade tap does nothing / preview instead of Play sheet | Confirm this is a Play testing install with RevenueCat key; preview is disabled on store builds |
| Pro not detected after purchase | Confirm `ds_premium_lifetime` unlocks entitlement `pro` in RevenueCat |

---

## QA checklist
- [ ] Fresh install starts on Free plan
- [ ] Billing diagnostics shows **Store ready**
- [ ] Lifetime purchase unlocks Pro immediately
- [ ] Restore works after reinstall
- [ ] Cancelled purchase leaves tier unchanged

## Legal URLs (store review)
- Privacy policy: https://saintjeromeiii.github.io/dealshield-legal/#privacy
- Legal disclaimer: https://saintjeromeiii.github.io/dealshield-legal/#disclaimer
