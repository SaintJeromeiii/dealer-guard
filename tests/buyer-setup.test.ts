import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialAppData } from '../utils/app-state.ts';
import {
  applyReadinessAnswersToDeal,
  derivePreferencesFromAnswers,
  getReadinessNextAction,
  mapCreditAnswerToBand,
} from '../utils/buyer-setup.ts';

test('mapCreditAnswerToBand maps questionnaire answers to credit bands', () => {
  assert.equal(mapCreditAnswerToBand('Excellent'), 'excellent');
  assert.equal(mapCreditAnswerToBand('Poor'), 'building');
  assert.equal(mapCreditAnswerToBand("I don't know"), 'unknown');
});

test('derivePreferencesFromAnswers marks first-time buyers and trade shoppers', () => {
  const base = createInitialAppData();
  base.preferences.experienceMode = 'firstTimeBuyer';

  const firstTime = derivePreferencesFromAnswers(
    {
      credit: 'Good',
      preapproved: 'No',
      tradeIn: 'No trade-in',
      budget: '$300-$450',
    },
    base.preferences
  );

  assert.equal(firstTime.onboardingComplete, true);
  assert.equal(firstTime.buyerStage, 'firstCar');
  assert.equal(firstTime.creditBand, 'good');
  assert.equal(firstTime.financingNeed, 'finance');
  assert.equal(firstTime.hasTrade, false);

  const tradeShopper = derivePreferencesFromAnswers(
    {
      tradeIn: "Yes, but I don't know its value",
    },
    { ...base.preferences, buyerStage: 'undecided' }
  );

  assert.equal(tradeShopper.buyerStage, 'tradeShopper');
  assert.equal(tradeShopper.hasTrade, true);
});

test('applyReadinessAnswersToDeal pre-fills lender APR and setup notes without overwriting values', () => {
  const deal = { ...createInitialAppData().deal, months: '', outsideLenderTerm: '' };

  const patch = applyReadinessAnswersToDeal(deal, {
    credit: 'Fair',
    budget: '$450-$600',
    downPayment: 'Yes',
  });

  assert.equal(patch.outsideLenderApr, '10.5');
  assert.equal(patch.months, '60');
  assert.equal(patch.outsideLenderTerm, '60');
  assert.match(patch.offerNotes ?? '', /Setup monthly budget: \$450-\$600/);
  assert.match(patch.offerNotes ?? '', /down payment/i);

  const preserved = applyReadinessAnswersToDeal(
    {
      ...deal,
      outsideLenderApr: '4.9',
      months: '48',
      offerNotes: 'Existing note',
    },
    { credit: 'Excellent', budget: 'Under $300' }
  );

  assert.equal(preserved.outsideLenderApr, undefined);
  assert.equal(preserved.months, undefined);
});

test('getReadinessNextAction routes not-ready buyers to budget and almost-ready buyers to quick check', () => {
  const notReady = getReadinessNextAction(
    'Not Ready',
    ['Set a safe monthly payment range.', 'Get pre-approved to compare financing offers.'],
    'budget',
    'firstTimeBuyer'
  );

  assert.equal(notReady.kind, 'roadmapBudget');
  assert.match(notReady.label, /Step 1/i);

  const almostReady = getReadinessNextAction('Almost Ready', [], 'quickCheck', 'firstTimeBuyer');
  assert.equal(almostReady.kind, 'roadmapQuickCheck');

  const strong = getReadinessNextAction('Strong', [], 'lotInspection', 'standard');
  assert.equal(strong.kind, 'roadmapCurrent');
  assert.match(strong.label, /Physical Lot Check/i);
});
