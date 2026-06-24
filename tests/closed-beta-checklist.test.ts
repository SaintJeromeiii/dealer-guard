import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EMPTY_CLOSED_BETA_CHECKLIST,
  getClosedBetaChecklistProgress,
  isClosedBetaChecklistComplete,
  normalizeClosedBetaChecklist,
  shouldShowClosedBetaWelcome,
} from '../utils/closed-beta-checklist.ts';

test('normalizeClosedBetaChecklist returns defaults for invalid storage', () => {
  assert.deepEqual(normalizeClosedBetaChecklist(null), EMPTY_CLOSED_BETA_CHECKLIST);
  assert.deepEqual(normalizeClosedBetaChecklist('{bad json'), EMPTY_CLOSED_BETA_CHECKLIST);
});

test('closed beta welcome hides after completion or dismiss', () => {
  const partial = { ...EMPTY_CLOSED_BETA_CHECKLIST, sampleDealLoaded: true };
  assert.equal(shouldShowClosedBetaWelcome(partial), true);

  const complete = {
    sampleDealLoaded: true,
    lotCoachAsked: true,
    pressureLogged: true,
    dismissed: false,
  };
  assert.equal(isClosedBetaChecklistComplete(complete), true);
  assert.equal(shouldShowClosedBetaWelcome(complete), false);

  const dismissed = { ...EMPTY_CLOSED_BETA_CHECKLIST, dismissed: true };
  assert.equal(shouldShowClosedBetaWelcome(dismissed), false);
});

test('getClosedBetaChecklistProgress counts completed steps', () => {
  assert.deepEqual(getClosedBetaChecklistProgress(EMPTY_CLOSED_BETA_CHECKLIST), { completed: 0, total: 3 });
  assert.deepEqual(
    getClosedBetaChecklistProgress({
      sampleDealLoaded: true,
      lotCoachAsked: true,
      pressureLogged: false,
      dismissed: false,
    }),
    { completed: 2, total: 3 }
  );
});
