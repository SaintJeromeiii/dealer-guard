import assert from 'node:assert/strict';
import test from 'node:test';

import { buildNextStepGuidance } from '../utils/next-step.ts';

test('buildNextStepGuidance routes incomplete onboarding to setup', () => {
  const guidance = buildNextStepGuidance(false, 'standard', 'budget');
  assert.equal(guidance.actionLabel, 'Start setup');
});

test('buildNextStepGuidance routes first-time buyers to a walk-away budget first', () => {
  const guidance = buildNextStepGuidance(true, 'firstTimeBuyer', 'budget');
  assert.equal(guidance.stepId, 'budget');
  assert.equal(guidance.actionLabel, 'Set your walk-away number');
});

test('buildNextStepGuidance highlights quote check when budget is done', () => {
  const guidance = buildNextStepGuidance(true, 'standard', 'quickCheck');
  assert.equal(guidance.stepId, 'quickCheck');
});
