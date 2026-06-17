import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLotCoachContext, formatLotCoachContextForPrompt } from '../utils/lot-coach-context.ts';
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

  assert.equal(context.verdict, analysis.dealVerdict);
  assert.equal(context.targetTotalPaid, '32000');
  assert.deepEqual(context.activePressureTactics, ['Today-only urgency', 'Won’t print breakdown']);

  const prompt = formatLotCoachContextForPrompt(context);
  assert.match(prompt, /Verdict:/);
  assert.match(prompt, /Today-only urgency/);
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
