import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLotCoachContext, buildCompareLotCoachContext, formatLotCoachContextForPrompt } from '../utils/lot-coach-context.ts';
import {
  getLotCoachLocalDevApiUrl,
  LOT_COACH_DEPLOYED_DEV_FALLBACK_URL,
  resolveLotCoachApiUrl,
} from '../utils/lot-coach-config.ts';
import {
  canAskLotCoach,
  getRemainingLotCoachQuestions,
  LOT_COACH_DAILY_LIMIT,
} from '../utils/lot-coach-usage.ts';
import { buildDealAnalysis } from '../utils/deals.ts';
import { createInitialDeal } from '../utils/app-state.ts';

test('buildLotCoachContext includes verdict, budget, and active pressure tactics', () => {
  const deal = {
    ...createInitialDeal(),
    buyerStateCode: 'TX',
    apr: '8.9',
    months: '72',
    downPayment: '2500',
    tradeIn: '4000',
    targetTotalPaid: '32000',
  };
  const analysis = buildDealAnalysis(deal);

  const context = buildLotCoachContext({
    deal,
    analysis,
    negotiationFlags: ['todayOnly', 'wontPrint'],
    recommendation: {
      action: 'Counter',
      tone: 'warn',
      headline: 'Push for a cleaner out-the-door number',
      detail: 'The structure still has room to improve.',
    },
    readinessLabel: 'Almost Ready',
  });

  assert.equal(context.mode, 'live');
  assert.equal(context.verdict, analysis.dealVerdict);
  assert.equal(context.targetTotalPaid, '32000');
  assert.deepEqual(context.activePressureTactics, ['Today-only urgency', 'Won’t print breakdown']);

  const prompt = formatLotCoachContextForPrompt(context);
  assert.match(prompt, /Verdict:/);
  assert.match(prompt, /Today-only urgency/);
});

test('buildCompareLotCoachContext asks the model to explain offer differences', () => {
  const left = {
    ...createInitialDeal(),
    id: 'left',
    savedAt: '2026-04-18T12:00:00.000Z',
    seriesId: 'left',
    revisionNumber: 1,
    basedOnDealId: null,
    dealershipName: 'Alpha Auto',
    vehiclePrice: '24000',
    apr: '6.9',
    months: '60',
  };
  const right = {
    ...createInitialDeal(),
    id: 'right',
    savedAt: '2026-04-18T12:05:00.000Z',
    seriesId: 'right',
    revisionNumber: 1,
    basedOnDealId: null,
    dealershipName: 'Beta Motors',
    vehiclePrice: '25500',
    apr: '8.9',
    months: '72',
  };

  const context = buildCompareLotCoachContext({
    leftDeal: left,
    rightDeal: right,
    leftAnalysis: buildDealAnalysis(left),
    rightAnalysis: buildDealAnalysis(right),
    whyWinsHeadline: 'Why Alpha Auto ranks ahead of Beta Motors',
    whyWinsBullets: ['Wins on lower estimated total paid.'],
    readinessLabel: 'Strong',
    targetTotalPaid: '30000',
  });

  assert.equal(context.mode, 'compare');
  const prompt = formatLotCoachContextForPrompt(context);
  assert.match(prompt, /Mode: compare saved offers/);
  assert.match(prompt, /Offer A:/);
  assert.match(prompt, /Offer B:/);
  assert.match(prompt, /Do not default to generic/);
});

test('resolveLotCoachApiUrl prefers explicit config and dev fallbacks', () => {
  assert.equal(
    resolveLotCoachApiUrl({ lotCoachApiUrl: 'https://example.com/coach' }, { devMode: false }),
    'https://example.com/coach'
  );

  assert.equal(resolveLotCoachApiUrl({}, { devMode: false }), '');

  assert.equal(
    resolveLotCoachApiUrl({ lotCoachDevApiUrl: 'http://192.168.1.20:8787' }, { devMode: true }),
    'http://192.168.1.20:8787'
  );

  assert.equal(
    resolveLotCoachApiUrl({ lotCoachApiSecret: 'secret' }, { devMode: true }),
    LOT_COACH_DEPLOYED_DEV_FALLBACK_URL
  );

  assert.equal(
    resolveLotCoachApiUrl({}, { devMode: true, platform: 'android' }),
    getLotCoachLocalDevApiUrl('android')
  );

  assert.equal(
    resolveLotCoachApiUrl({}, { devMode: true, platform: 'ios' }),
    getLotCoachLocalDevApiUrl('ios')
  );
});

test('lot coach daily limit helpers enforce the Pro usage cap', () => {
  const freshUsage = { date: '2026-06-17', count: 0 };
  const nearLimit = { date: '2026-06-17', count: LOT_COACH_DAILY_LIMIT - 1 };
  const atLimit = { date: '2026-06-17', count: LOT_COACH_DAILY_LIMIT };

  assert.equal(getRemainingLotCoachQuestions(freshUsage), LOT_COACH_DAILY_LIMIT);
  assert.equal(canAskLotCoach(nearLimit), true);
  assert.equal(getRemainingLotCoachQuestions(nearLimit), 1);
  assert.equal(canAskLotCoach(atLimit), false);
});
