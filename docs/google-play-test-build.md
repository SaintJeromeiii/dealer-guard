# Google Play Test Build

Use this flow to upload DealShield to Google Play **internal**, **closed**, or **open** testing.

## App identity
- Package name: `com.jleonanderson.signshield`
- Privacy policy: https://saintjeromeiii.github.io/dealshield-legal/#privacy
- Legal disclaimer: https://saintjeromeiii.github.io/dealshield-legal/#disclaimer
- Lifetime product ID: `ds_premium_lifetime`

## One-time setup

### 1. RevenueCat public Android key (not the secret key)
```bash
eas secret:create --scope project --name REVENUECAT_ANDROID_API_KEY --value "goog_..."
```

### 2. Google Play signing
If EAS does not already have your upload keystore, run a build once and follow the prompts, or upload:
- Keystore: `upload-keystore.jks` (local, gitignored)
- Certificate: `upload_certificate.pem`

Register the upload certificate in Google Play Console → App integrity if prompted.

### 3. Google Play Console app
Create the app with package `com.jleonanderson.signshield` if it does not exist yet.

## Build for your Pixel

### Option A: Quick sideload APK (features + diagnostics)
Install directly from the EAS build page QR/link. RevenueCat is included, but **Play billing still requires a Play Store install** for real purchases.

```bash
npm run build:android:pixel
```

Uses the `pixel-test` profile: internal APK + `production` EAS environment (RevenueCat key).

### Option B: Play internal testing (recommended for Pro purchases)
Upload an AAB to Play Console, then install from the Play Store on your Pixel.

```bash
npm run build:android:play
```

This uses the `play-test` EAS profile:
- Android App Bundle (`.aab`) for Play Console upload
- Store distribution (not Expo Go / dev client)
- Remote version code auto-increment

When the build finishes, download the `.aab` from the Expo dashboard or CLI link.

## Upload to Google Play

### Option A: Manual upload
1. Play Console → Testing → Internal / Closed / Open testing
2. Create release → Upload the `.aab`
3. Add release notes
4. Roll out to testers

### Option B: EAS Submit (after service account is configured)
```bash
npm run submit:android:play
```

Change the track in `eas.json` → `submit.play-test.android.track` to `closed` or `open` when ready.

## Pre-upload checklist
- [ ] Tests pass: `npm run test`
- [ ] Lint passes: `npm run lint`
- [ ] RevenueCat `pro` entitlement linked to `ds_premium_lifetime`
- [ ] Play Console in-app product `ds_premium_lifetime` is active
- [ ] Privacy policy URL set in Play Console store listing
- [ ] License testers added (for billing QA)

## Profile reference
| EAS profile | Use case |
|-------------|----------|
| `development` | Dev client with hot reload |
| `preview` | Internal APK for sideloading |
| `play-test` | **Play Console upload (AAB)** |
| `production` | Same as `play-test`, production submit track |
