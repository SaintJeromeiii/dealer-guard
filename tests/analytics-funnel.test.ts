import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAnalyticsFunnel, getFunnelCompletionRate } from '../utils/analytics-funnel.ts';
import { createInitialAppData } from '../utils/app-state.ts';

test('buildAnalyticsFunnel tracks setup and saved offer milestones', () => {
  const appData = createInitialAppData();
  appData.preferences.onboardingComplete = true;
  appData.deal.vehiclePrice = '25000';
  appData.deal.apr = '6.9';
  appData.savedDeals = [
    {
      ...appData.deal,
      id: 'deal-1',
      savedAt: new Date().toISOString(),
      seriesId: 'series-1',
      revisionNumber: 1,
      basedOnDealId: null,
    },
  ];

  const steps = buildAnalyticsFunnel(appData);
  assert.equal(steps.find((step) => step.id === 'setup')?.complete, true);
  assert.equal(steps.find((step) => step.id === 'saved')?.complete, true);
  assert.ok(getFunnelCompletionRate(steps) >= 40);
});
