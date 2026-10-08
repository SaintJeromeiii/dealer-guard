import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialAppData } from '../utils/app-state.ts';
import { addLotNegotiationFlag, buildCarBuyingRoadmap, isRoadmapBudgetComplete, markLotCheckClear, removeLotNegotiationFlag } from '../utils/roadmap.ts';

test('buildCarBuyingRoadmap starts on budget and locks later milestones', () => {
  const roadmap = buildCarBuyingRoadmap(createInitialAppData(), false);

  assert.equal(roadmap.currentStepId, 'budget');
  assert.equal(roadmap.steps[0]?.status, 'active');
  assert.equal(roadmap.steps[1]?.status, 'future');
  assert.equal(roadmap.steps[2]?.status, 'future');
  assert.equal(roadmap.steps[3]?.status, 'future');
});

test('buildCarBuyingRoadmap advances after budget and quick check data is saved', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.deal.vehiclePrice = '25995';
  appData.deal.apr = '8.9';

  const roadmap = buildCarBuyingRoadmap(appData, false);

  assert.equal(roadmap.currentStepId, 'lotInspection');
  assert.equal(roadmap.steps[0]?.status, 'completed');
  assert.equal(roadmap.steps[1]?.status, 'completed');
  assert.equal(roadmap.steps[2]?.status, 'active');
  assert.match(roadmap.steps[0]?.summary ?? '', /\$32,000/i);
  assert.match(roadmap.steps[1]?.summary ?? '', /\$25,995/i);
});

test('buildCarBuyingRoadmap marks physical lot check as pro locked for free users', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.deal.vehiclePrice = '25995';
  appData.deal.apr = '8.9';

  const roadmap = buildCarBuyingRoadmap(appData, false);

  assert.equal(roadmap.steps[2]?.id, 'lotInspection');
  assert.equal(roadmap.steps[2]?.status, 'active');
  assert.equal(roadmap.steps[2]?.isProLocked, true);
  assert.match(roadmap.steps[2]?.proSubtitle ?? '', /Pro Feature/i);
});

test('buildCarBuyingRoadmap marks quick check complete when offers are saved even if the form was cleared', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.savedDeals = [
    {
      ...appData.deal,
      id: 'offer-1',
      savedAt: '2026-06-01T12:00:00.000Z',
      seriesId: 'series-1',
      revisionNumber: 1,
      basedOnDealId: null,
      dealershipName: 'Metro Auto',
      vehiclePrice: '25995',
      apr: '8.9',
    },
    {
      ...appData.deal,
      id: 'offer-2',
      savedAt: '2026-06-02T12:00:00.000Z',
      seriesId: 'series-2',
      revisionNumber: 1,
      basedOnDealId: null,
      dealershipName: 'Northside Motors',
      vehiclePrice: '24450',
      apr: '7.4',
    },
  ];

  const roadmap = buildCarBuyingRoadmap(appData, false);

  assert.equal(roadmap.steps[1]?.status, 'completed');
  assert.equal(roadmap.currentStepId, 'lotInspection');
  assert.match(roadmap.steps[1]?.summary ?? '', /2 quotes saved/i);
});

test('buildCarBuyingRoadmap completes physical lot check when the visit has no red flags', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.deal.vehiclePrice = '25995';
  appData.deal.apr = '8.9';
  appData.lotCheckClear = true;

  const roadmap = buildCarBuyingRoadmap(appData, true);

  assert.equal(roadmap.steps[2]?.status, 'completed');
  assert.equal(roadmap.currentStepId, 'contractScan');
  assert.match(roadmap.steps[2]?.summary ?? '', /No red flags/i);
});

test('removing a lot flag drops it from the physical lot check count', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.deal.vehiclePrice = '25995';
  appData.deal.apr = '8.9';
  const flagged = addLotNegotiationFlag(
    appData,
    'paymentShift',
    {
      id: 'incident-1',
      flag: 'paymentShift',
      dealershipName: 'Metro Auto',
      notedAt: '2026-10-08T12:00:00.000Z',
    },
    {
      id: 'timeline-1',
      dealershipName: 'Metro Auto',
      type: 'pressureLogged',
      title: 'Pressure tactic logged',
      detail: 'paymentShift was marked during the dealership session.',
      createdAt: '2026-10-08T12:00:00.000Z',
    }
  );
  const cleared = removeLotNegotiationFlag(flagged, 'paymentShift');
  const roadmap = buildCarBuyingRoadmap(cleared, true);

  assert.equal(cleared.negotiationFlags.length, 0);
  assert.equal(cleared.pressureIncidents.length, 0);
  assert.equal(cleared.visitTimeline.length, 0);
  assert.equal(roadmap.steps[2]?.status, 'active');
  assert.equal(roadmap.currentStepId, 'lotInspection');
});

test('no red flags replaces flags that were logged earlier', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.deal.vehiclePrice = '25995';
  appData.deal.apr = '8.9';
  appData.negotiationFlags = ['todayOnly', 'managerTrip'];
  appData.pressureIncidents = [
    { id: 'incident-1', flag: 'todayOnly', dealershipName: 'Metro Auto', notedAt: '2026-10-08T12:00:00.000Z' },
    { id: 'incident-2', flag: 'managerTrip', dealershipName: 'Metro Auto', notedAt: '2026-10-08T12:05:00.000Z' },
  ];
  appData.visitTimeline = [
    {
      id: 'timeline-1',
      dealershipName: 'Metro Auto',
      type: 'pressureLogged',
      title: 'Pressure tactic logged',
      detail: 'todayOnly was marked during the dealership session.',
      createdAt: '2026-10-08T12:00:00.000Z',
    },
  ];

  const cleared = markLotCheckClear(appData);
  const roadmap = buildCarBuyingRoadmap(cleared, true);

  assert.equal(cleared.lotCheckClear, true);
  assert.equal(cleared.negotiationFlags.length, 0);
  assert.equal(cleared.pressureIncidents.length, 0);
  assert.equal(cleared.visitTimeline.length, 0);
  assert.equal(roadmap.steps[2]?.status, 'completed');
  assert.match(roadmap.steps[2]?.summary ?? '', /No red flags/i);
});

test('buildCarBuyingRoadmap unlocks physical lot check for premium users', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.deal.vehiclePrice = '25995';
  appData.deal.apr = '8.9';

  const roadmap = buildCarBuyingRoadmap(appData, true);

  assert.equal(roadmap.steps[2]?.isProLocked, false);
});

test('isRoadmapBudgetComplete accepts target total paid or down payment bundle', () => {
  const empty = createInitialAppData();
  assert.equal(isRoadmapBudgetComplete(empty), false);

  const targetOnly = createInitialAppData();
  targetOnly.deal.targetTotalPaid = '28500';
  assert.equal(isRoadmapBudgetComplete(targetOnly), true);

  const bundle = createInitialAppData();
  bundle.deal.downPayment = '3000';
  bundle.deal.outsideLenderApr = '5.9';
  bundle.deal.months = '60';
  assert.equal(isRoadmapBudgetComplete(bundle), true);
});
