import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialDeal } from '../utils/app-state.ts';
import { buildDealAnalysis } from '../utils/deals.ts';
import {
  buildCapVsQuote,
  deskActionLabel,
  getDeskScript,
  isQuoteOverCap,
} from '../utils/desk-scripts.ts';

test('getDeskScript returns instant tactic lines without calling AI', () => {
  assert.match(getDeskScript('todayOnly'), /print/i);
  assert.match(getDeskScript('wontPrint'), /out-the-door/i);
  assert.match(getDeskScript(null, 'Leave'), /not signing/i);
});

test('buildCapVsQuote flags monthly and total paid when over budget', () => {
  const deal = {
    ...createInitialDeal(),
    vehiclePrice: '25995',
    salesTax: '1560',
    dealerFees: '799',
    downPayment: '3000',
    apr: '7.9',
    months: '72',
    targetTotalPaid: '20000',
  };
  const analysis = buildDealAnalysis(deal);
  const rows = buildCapVsQuote(deal, analysis, { targetMonthlyPayment: 250, targetTotalPaid: 20000 });

  assert.equal(rows.length, 3);
  assert.equal(isQuoteOverCap(rows), true);
  assert.equal(rows.find((row) => row.id === 'otd')?.overCap, true);
});

test('deskActionLabel maps recommendation to glanceable HUD text', () => {
  assert.equal(deskActionLabel('Leave'), 'WALK AWAY');
  assert.equal(deskActionLabel('Counter'), 'COUNTER');
  assert.equal(deskActionLabel('Buy'), 'FAIR');
});
