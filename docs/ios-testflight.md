# iOS TestFlight Build

Use this flow to upload Sign Check to App Store Connect. You do **not** need Xcode, Transporter, or `altool`. EAS Build produces the `.ipa` and EAS Submit uploads it.

## App identity
- Bundle ID: `com.jleonanderson.signshield`
- Public contact: `jeromegatron.labs@gmail.com`
- Privacy policy: https://saintjeromeiii.github.io/dealshield-legal/#privacy
- Legal disclaimer: https://saintjeromeiii.github.io/dealshield-legal/#disclaimer
- Lifetime product ID: `ds_premium_lifetime` (App Store non-consumable)

## Skip Apple’s Xcode / Transporter instructions

App Store Connect shows generic upload docs after you create an app. For this Expo project the equivalent is:

```bash
npm run check:release
npm run build:ios:testflight
npm run submit:ios:testflight
```

The first iOS build will ask you to log in with your Apple ID. Let EAS manage certificates and the provisioning profile.

The app’s minimum iOS version is **15.5** because photo OCR (`@react-native-ml-kit/text-recognition`) requires it. Expo’s default is 15.1, which is why the first TestFlight build failed until `expo-build-properties` was added.

## One-time setup

### 1. Confirm the App Store Connect app exists
App Store Connect → Apps → Sign Check. Bundle ID must be `com.jleonanderson.signshield`.

Optional: copy the numeric **Apple ID** from **App Information** and later add it to `eas.json` as `submit.testflight.ios.ascAppId`. EAS can also match the app by bundle ID on the first submit.

### 2. RevenueCat public iOS key (needed for Pro purchases)
Do this before the first TestFlight build if you want billing to work in that build.

1. RevenueCat → Project settings → Apps → add **App Store** with bundle ID `com.jleonanderson.signshield`
2. Connect App Store Server API credentials
3. Attach `ds_premium_lifetime` to entitlement `pro`
4. Copy the public iOS SDK key (`appl_...`)

```bash
eas env:create --name REVENUECAT_IOS_API_KEY --value "appl_..." --environment production --visibility secret
```

`app.config.js` maps that into `expo.extra.revenueCatApiKeyIos` at build time.

You can still upload a TestFlight build without this key. Pro purchase/restore will not work until you add the key and rebuild.

### 3. App Store in-app product
App Store Connect → Monetization → In-App Purchases:

- Product ID: `ds_premium_lifetime`
- Type: **Non-Consumable**
- Upload a paywall screenshot in the product’s Review Information
- Paid Apps Agreement, tax, and banking must be Active

## Build and upload

```bash
npm run check:release
npm run build:ios:testflight
```

When the build finishes:

```bash
npm run submit:ios:testflight
```

EAS Submit is the Transporter step. After Apple processes the binary (often 10–15 minutes), it appears under **TestFlight**.

## Install on an iPhone

1. App Store Connect → TestFlight → Internal Testing
2. Add your Apple ID as a tester if it is not already on the team
3. Install **TestFlight** from the App Store, then install Sign Check from the TestFlight invite

Internal testers do not need Beta App Review. External testers do, for the first build of a version.

TestFlight purchases use Apple’s sandbox. Testers are not charged.

## After the first upload

The binary being in TestFlight is not an App Store release. Still remaining before review:

- [ ] iPhone screenshots
- [ ] Privacy Nutrition Labels
- [ ] Support URL and privacy policy on the listing
- [ ] `ds_premium_lifetime` attached to the app version
- [ ] Restore purchases tested on a real iPhone
- [ ] App Review notes (Try sample deal, where Pro lives, sandbox tester if needed)

## Profile reference
| EAS profile | Use case |
|-------------|----------|
| `testflight` | **App Store Connect / TestFlight upload** |
| `production` | Same store binary; use when submitting the listing for review |
