# DealShield closed testing playbook

Use this guide to pass Google Play’s **12 testers / 14 consecutive days** requirement for personal developer accounts, and to collect useful feedback before production.

## Google Play requirements

- Run a **Closed testing** track (internal testing alone does not count toward production access).
- At least **12 testers opted in** through the official Play invite/link.
- Testers must stay opted in for **14 consecutive days**. If the count drops below 12, the clock resets.
- Each tester must use the **same Google account** to opt in and install from the Play Store.
- After day 14, apply for production and complete Google’s **Production Access Questionnaire**.

Recruit **15–16 testers** so dropouts do not reset your clock.

## Build and upload

```bash
npm run check:release
npm run build:android:play
```

Upload the `.aab` to **Play Console → Testing → Closed testing**.

## Tester email (copy/paste)

**Subject:** DealShield closed test — 5 minutes to help

Hi — I’m running a 14-day closed test for DealShield, an Android app that helps car buyers review quotes, spot pressure tactics, and get AI coaching at the dealership.

**Please:**
1. Open this opt-in link on your Android phone: `[YOUR CLOSED TEST OPT-IN URL]`
2. Accept the test using the **same Gmail** you’ll use in the Play Store.
3. Install **from the Play Store** (not an APK sideload).
4. Complete the in-app **5-minute tester path**:
   - Tap **Try sample deal**
   - Ask **AI Lot Coach** one question
   - Log one **pressure tactic** in live mode
5. Send feedback from **☰ → About & Legal → Send closed-test feedback**
6. **Keep the app installed and stay opted in for 14 days** — opting out resets Google’s tester count.

Thanks — this directly helps me launch on Google Play.

## What testers should try

| Day | Suggested action |
|-----|------------------|
| Day 1 | Complete the 5-minute welcome checklist |
| Day 3 | Compare two offers or run What-if lab (Premium Preview if not Pro) |
| Day 7 | Open Incident Logs after logging a tactic |
| Day 14 | Send final feedback via About & Legal |

## Ship one update during the test

Push at least **one new versionCode** during the 14-day window (bugfix, copy, or UX). Mention what changed in release notes and in the production questionnaire.

## Production questionnaire tips

Prepare answers that mention:

- How you recruited testers (friends, car-buying communities, coworkers).
- The **sample deal** path for users not at a dealership.
- **Premium Preview** for billing-sync edge cases.
- Specific bugs found and fixed (e.g. Lot Coach truncation, billing diagnostics).
- Feedback received via GitHub issues / Google Form.

## Feedback URL configuration

Default feedback opens a prefilled GitHub issue. To use Google Forms instead:

```bash
eas env:create --name CLOSED_BETA_FEEDBACK_URL --value "https://forms.gle/your-form-id" --environment production --visibility plaintext
```

Rebuild the app after changing EAS env vars.

## Console checklist

- [ ] Closed testing track created (not only internal)
- [ ] 15–16 testers invited
- [ ] 12+ show as **opted in** before starting the 14-day clock
- [ ] Privacy policy URL on store listing
- [ ] License testers added for billing QA
- [ ] RevenueCat + Play product `ds_premium_lifetime` active
- [ ] Monitor tester count daily in Play Console
