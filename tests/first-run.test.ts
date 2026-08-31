import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialAppData } from '../utils/app-state.ts';
import {
  ADVANCED_DRAWER_IDS,
  appDataAfterWalkthrough,
  getHomeForSituation,
  getNextDealReviewStep,
  getPreviousDealReviewStep,
  hasQuoteToReview,
  shouldShowAdvancedTools,
  shouldShowFirstRunWalkthrough,
} from '../utils/first-run.ts';
import { isRoadmapBudgetComplete } from '../utils/roadmap.ts';
import { buildSampleDealState, SAMPLE_DEAL_PRESSURE_FLAGS } from '../utils/sample-deal.ts';
import { DEALSHIELD_DRAWER_ITEMS } from '../components/navigation/deal-shield-nav-config.ts';

test('new buyers see the walk-away explainer until they finish setup', () => {
  assert.equal(shouldShowFirstRunWalkthrough({ walkthroughComplete: false, onboardingComplete: false }), true);
  assert.equal(shouldShowFirstRunWalkthrough({ walkthroughComplete: true, onboardingComplete: false }), false);
  assert.equal(shouldShowFirstRunWalkthrough({ walkthroughComplete: false, onboardingComplete: true }), false);
});

test('situation picker sends people to the matching home screen', () => {
  assert.deepEqual(getHomeForSituation('home'), { screen: 'scanHub', tab: 'scan' });
  assert.deepEqual(getHomeForSituation('lot'), { screen: 'liveMode', tab: 'tactics' });
  assert.deepEqual(getHomeForSituation('signing'), { screen: 'dealReview', tab: 'analyzer' });
});

test('deal review wizard moves forward and back in four short steps', () => {
  assert.equal(getNextDealReviewStep('import'), 'numbers');
  assert.equal(getNextDealReviewStep('numbers'), 'details');
  assert.equal(getNextDealReviewStep('details'), 'verdict');
  assert.equal(getNextDealReviewStep('verdict'), null);
  assert.equal(getPreviousDealReviewStep('verdict'), 'details');
  assert.equal(getPreviousDealReviewStep('import'), null);
});

test('skipping the tutorial leaves budget and quote fields empty', () => {
  const seeded = {
    ...createInitialAppData(),
    deal: buildSampleDealState(),
    negotiationFlags: SAMPLE_DEAL_PRESSURE_FLAGS,
  };

  assert.equal(isRoadmapBudgetComplete(seeded), true);
  assert.equal(hasQuoteToReview(seeded), true);

  const afterSkip = appDataAfterWalkthrough(seeded);
  assert.equal(afterSkip.preferences.walkthroughComplete, true);
  assert.equal(afterSkip.preferences.onboardingComplete, true);
  assert.equal(afterSkip.deal.targetTotalPaid, '');
  assert.equal(afterSkip.deal.vehiclePrice, '');
  assert.equal(afterSkip.deal.downPayment, '');
  assert.equal(afterSkip.deal.apr, '');
  assert.equal(afterSkip.deal.months, '');
  assert.deepEqual(afterSkip.negotiationFlags, []);
  assert.equal(isRoadmapBudgetComplete(afterSkip), false);
  assert.equal(hasQuoteToReview(afterSkip), false);
});

test('advanced hamburger tools stay hidden until a quote exists', () => {
  const empty = createInitialAppData();
  assert.equal(hasQuoteToReview(empty), false);
  assert.equal(shouldShowAdvancedTools(empty, true), false);

  const withQuote = {
    ...empty,
    deal: { ...empty.deal, vehiclePrice: '25995', apr: '8.9' },
  };
  assert.equal(shouldShowAdvancedTools(withQuote, true), true);
  assert.equal(shouldShowAdvancedTools(withQuote, false), false);

  const advancedLabels = DEALSHIELD_DRAWER_ITEMS.filter((item) => ADVANCED_DRAWER_IDS.has(item.id)).map((item) => item.id);
  assert.ok(advancedLabels.includes('compare-offers'));
  assert.ok(advancedLabels.includes('what-if-lab'));
});
