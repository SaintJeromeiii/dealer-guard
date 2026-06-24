import assert from 'node:assert/strict';
import test from 'node:test';

import { isRoadmapBudgetComplete } from '../utils/roadmap.ts';
import { createInitialAppData } from '../utils/app-state.ts';
import { SAMPLE_QUOTE } from '../utils/product-content.ts';
import { buildSampleDealState, SAMPLE_DEAL_PRESSURE_FLAGS } from '../utils/sample-deal.ts';

test('buildSampleDealState includes budget guardrails and sample quote numbers', () => {
  const deal = buildSampleDealState();

  assert.equal(deal.dealershipName, SAMPLE_QUOTE.dealershipName);
  assert.equal(deal.vehiclePrice, SAMPLE_QUOTE.vehiclePrice);
  assert.equal(deal.targetTotalPaid, '32000');
  assert.equal(deal.buyerStateCode, 'TX');

  const appData = {
    ...createInitialAppData(),
    deal,
    negotiationFlags: SAMPLE_DEAL_PRESSURE_FLAGS,
  };

  assert.equal(isRoadmapBudgetComplete(appData), true);
});
