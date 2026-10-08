# Lot Coach setup

Lot Coach is Sign Check Pro's on-the-lot AI helper. It answers custom buyer questions using the current deal context (verdict, payment structure, pressure tactics, and budget guardrails).

## Architecture

- **App:** `components/LotCoachCard.tsx` on Live dealership mode (Pro only)
- **Client:** `utils/lot-coach.ts` + `utils/lot-coach-context.ts`
- **Backend:** `server/lot-coach-worker.mjs` (Cloudflare Worker + Gemini)

The Gemini API key stays on the worker. The mobile app only calls your worker URL.

## 1. Deploy the worker

From the `server/` folder:

```bash
cd server
npm install -g wrangler
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put LOT_COACH_API_SECRET
npx wrangler deploy
```

Create the Gemini key at [Google AI Studio](https://aistudio.google.com/apikey). As of 2026, new keys often start with `AQ.` instead of `AIza` — both are valid. Paste the full key at the Wrangler prompt (nothing will show as you type).

Copy the deployed worker URL, for example:

`https://dealshield-lot-coach.your-account.workers.dev`

## 2. Add EAS environment variables

```bash
eas env:create --name LOT_COACH_API_URL --value "https://dealshield-lot-coach.your-account.workers.dev" --environment production --visibility plaintext
eas env:create --name LOT_COACH_API_SECRET --value "your-shared-secret" --environment production --visibility secret
```

Rebuild and install from Play testing:

```bash
npm run build:android:play
```

## 3. Test in the app

1. Open **Live dealership mode** (Pro)
2. Find the **Lot Coach** card near the top
3. Tap a quick prompt or type a custom question
4. Copy the suggested response at the desk

## Limits and privacy

- **20 questions per day** per device (local rate limit)
- Deal context sent to the worker excludes photos and free-form notes
- Responses include the standard Sign Check estimate disclaimer

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Lot Coach not configured" | `LOT_COACH_API_URL` missing from EAS production env; rebuild app |
| `Unauthorized` | `LOT_COACH_API_SECRET` mismatch between worker and EAS |
| `GEMINI_API_KEY is not configured` | Run `wrangler secret put GEMINI_API_KEY` |
| Empty or slow answers | Retry once; check worker logs with `wrangler tail` |

## Local worker test

```bash
cd server
npx wrangler dev
```

Then POST JSON to the local URL:

```json
{
  "question": "They said the rate is only good today. What should I say?",
  "contextSummary": "Verdict: Review Carefully\nMonthly payment (est.): $489.00"
}
```
