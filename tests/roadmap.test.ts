import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialAppData } from '../utils/app-state.ts';
import { buildCarBuyingRoadmap } from '../utils/roadmap.ts';

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

test('buildCarBuyingRoadmap unlocks physical lot check for premium users', () => {
  const appData = createInitialAppData();
  appData.deal.targetTotalPaid = '32000';
  appData.deal.vehiclePrice = '25995';
  appData.deal.apr = '8.9';

  const roadmap = buildCarBuyingRoadmap(appData, true);

  assert.equal(roadmap.steps[2]?.isProLocked, false);
});
