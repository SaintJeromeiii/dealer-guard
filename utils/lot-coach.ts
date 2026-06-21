import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { formatLotCoachContextForPrompt, type LotCoachContext } from './lot-coach-context.ts';
import {
  getLotCoachLocalDevApiUrl,
  resolveLotCoachApiUrl,
  type LotCoachRuntimeConfig,
} from './lot-coach-config.ts';
import {
  canAskLotCoach,
  getRemainingLotCoachQuestions,
  incrementLotCoachUsage,
  LOT_COACH_DAILY_LIMIT,
  normalizeLotCoachUsage,
  type LotCoachUsageRecord,
} from './lot-coach-usage.ts';

export { LOT_COACH_DAILY_LIMIT } from './lot-coach-usage.ts';
export {
  getLotCoachLocalDevApiUrl,
  LOT_COACH_DEPLOYED_DEV_FALLBACK_URL,
  resolveLotCoachApiUrl,
} from './lot-coach-config.ts';

const LOT_COACH_USAGE_KEY = 'lot_coach_usage_v1';

export type LotCoachQuickPrompt = {
  id: string;
  label: string;
  question: string;
};

export const LOT_COACH_QUICK_PROMPTS: LotCoachQuickPrompt[] = [
  {
    id: 'today-only',
    label: 'Rate only good today',
    question: 'They said the rate is only good today. What should I say without getting rushed?',
  },
  {
    id: 'payment-shift',
    label: 'Payment dropped, extras added',
    question: 'They lowered my monthly payment but added products. Is that actually a better deal?',
  },
  {
    id: 'doc-fee',
    label: 'Doc fee question',
    question: 'Is this doc fee normal, and how should I push back if it looks high?',
  },
  {
    id: 'no-print',
    label: 'Won’t print breakdown',
    question: 'They will not print or text the full breakdown. What should I do next?',
  },
];

function getRuntimeConfig(): LotCoachRuntimeConfig {
  return (Constants.expoConfig?.extra ?? {}) as LotCoachRuntimeConfig;
}

export function getLotCoachApiUrl() {
  const devMode = typeof __DEV__ !== 'undefined' && __DEV__;
  return resolveLotCoachApiUrl(getRuntimeConfig(), { devMode, platform: Platform.OS });
}

export function getLotCoachApiSecret() {
  return getRuntimeConfig().lotCoachApiSecret?.trim() ?? '';
}

export function isLotCoachDevMockEnabled(config: LotCoachRuntimeConfig = getRuntimeConfig()) {
  return (typeof __DEV__ !== 'undefined' && __DEV__ && config.lotCoachUseMock === true) || false;
}

export function isLotCoachConfigured() {
  if (isLotCoachDevMockEnabled()) return true;
  return getLotCoachApiUrl().length > 0;
}

export function generateLotCoachDevMockAnswer(question: string, context: LotCoachContext) {
  const contextSummary = formatLotCoachContextForPrompt(context);
  const verdictLine = context.verdict ? `Your current read is "${context.verdict}".` : 'Use your deal review before you respond.';

  return [
    'Quick read',
    `- ${verdictLine}`,
    '- Slow the conversation down and ask for every number in writing before you commit.',
    '',
    'Ask next',
    '- Request the full out-the-door breakdown, rate sheet, and itemized fees.',
    '- Confirm whether any add-ons were added to change the monthly payment.',
    '',
    'Say this',
    `"Before we go further, I need the full breakdown in writing. ${question.replace(/\?$/, '')} — can you print or email every line item?"`,
    '',
    `[Dev mock response — context used]\n${contextSummary}`,
  ].join('\n');
}

export async function readLotCoachUsage(now = new Date()): Promise<LotCoachUsageRecord> {
  const raw = await AsyncStorage.getItem(LOT_COACH_USAGE_KEY);
  return normalizeLotCoachUsage(raw, now);
}

export async function recordLotCoachQuestion(now = new Date()) {
  const usage = await readLotCoachUsage(now);
  const nextUsage = incrementLotCoachUsage(usage, now);

  await AsyncStorage.setItem(LOT_COACH_USAGE_KEY, JSON.stringify(nextUsage));
  return nextUsage;
}

export async function askLotCoach(question: string, context: LotCoachContext): Promise<string> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error('Enter a question for Lot Coach.');
  }

  const usage = await readLotCoachUsage();
  if (!canAskLotCoach(usage)) {
    throw new Error(`Daily Lot Coach limit reached (${LOT_COACH_DAILY_LIMIT} questions). Try again tomorrow.`);
  }

  const config = getRuntimeConfig();
  if (isLotCoachDevMockEnabled(config)) {
    await recordLotCoachQuestion();
    return generateLotCoachDevMockAnswer(trimmedQuestion, context);
  }

  const apiUrl = resolveLotCoachApiUrl(config, {
    devMode: typeof __DEV__ !== 'undefined' && __DEV__,
    platform: Platform.OS,
  });
  if (!apiUrl) {
    throw new Error('Lot Coach is not configured in this build yet. Add LOT_COACH_API_URL to your EAS production environment.');
  }

  const apiSecret = config.lotCoachApiSecret?.trim();
  // Non-streaming JSON API: worker returns the full answer in one response body.
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiSecret ? { Authorization: `Bearer ${apiSecret}` } : {}),
    },
    body: JSON.stringify({
      question: trimmedQuestion,
      context,
      contextSummary: formatLotCoachContextForPrompt(context),
    }),
  });

  const payload = (await response.json().catch(() => null)) as { answer?: string; error?: string } | null;

  if (!response.ok) {
    const message = payload?.error ?? `Lot Coach request failed (${response.status}).`;
    if (typeof __DEV__ !== 'undefined' && __DEV__ && response.status === 401) {
      throw new Error(
        `${message}\n\nDev tip: add LOT_COACH_API_SECRET to .env.local (same value as the worker secret), or run "cd server && npx wrangler dev" for a local backend without auth.`
      );
    }
    throw new Error(message);
  }

  const answer = payload?.answer?.trim();
  if (!answer) {
    throw new Error('Lot Coach returned an empty response. Try again in a moment.');
  }

  await recordLotCoachQuestion();
  return answer;
}
