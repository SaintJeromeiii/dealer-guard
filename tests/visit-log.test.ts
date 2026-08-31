import assert from 'node:assert/strict';
import test from 'node:test';

import { isDuplicatePromise, isDuplicateVisitNote } from '../utils/visit-log.ts';
import type { PromiseRecord, VisitTimelineEntry } from '../utils/types.ts';

const note = (detail: string): VisitTimelineEntry => ({
  id: '1',
  dealershipName: 'Metro Auto',
  type: 'noteAdded',
  title: 'Visit note saved',
  detail,
  createdAt: '2026-08-16T12:00:00.000Z',
});

test('isDuplicateVisitNote blocks saving the same salesperson note twice', () => {
  assert.equal(isDuplicateVisitNote([note('Salesman: James')], 'Salesman: James'), true);
  assert.equal(isDuplicateVisitNote([note('Salesman: James')], 'Salesman: Maria'), false);
  assert.equal(isDuplicateVisitNote([], 'Salesman: James'), false);
});

test('isDuplicatePromise blocks the same promise text', () => {
  const promises: PromiseRecord[] = [
    {
      id: 'p1',
      dealershipName: 'Metro Auto',
      text: 'We will remove the prep fee',
      status: 'open',
      notedAt: '2026-08-16T12:00:00.000Z',
      resolvedAt: null,
    },
  ];
  assert.equal(isDuplicatePromise(promises, 'We will remove the prep fee'), true);
  assert.equal(isDuplicatePromise(promises, 'We will include winter mats'), false);
});
