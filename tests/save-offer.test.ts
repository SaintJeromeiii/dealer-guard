import assert from 'node:assert/strict';
import test from 'node:test';

import { getNextRevisionNumber } from '../utils/deals.ts';
import { createInitialDeal } from '../utils/app-state.ts';

test('getNextRevisionNumber starts at 1 for a new dealership series', () => {
  assert.equal(getNextRevisionNumber([], null), 1);
});

test('getNextRevisionNumber increments within the same series', () => {
  const deal = createInitialDeal();
  const savedDeals = [
    { ...deal, id: 'a', savedAt: '2026-01-01', seriesId: 'series-1', revisionNumber: 1, basedOnDealId: null },
    { ...deal, id: 'b', savedAt: '2026-01-02', seriesId: 'series-1', revisionNumber: 2, basedOnDealId: 'a' },
  ];
  assert.equal(getNextRevisionNumber(savedDeals, 'series-1'), 3);
});
