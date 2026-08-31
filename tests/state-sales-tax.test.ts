import assert from 'node:assert/strict';
import test from 'node:test';

import { estimateStateSalesTax, getStateSalesTaxRate } from '../utils/state-sales-tax.ts';

test('getStateSalesTaxRate returns known state rates and null for blanks', () => {
  assert.equal(getStateSalesTaxRate('MI'), 0.06);
  assert.equal(getStateSalesTaxRate('or'), 0);
  assert.equal(getStateSalesTaxRate(''), null);
  assert.equal(getStateSalesTaxRate('XX'), null);
});

test('estimateStateSalesTax multiplies vehicle price by state rate', () => {
  const estimate = estimateStateSalesTax('MI', '25995');
  assert.ok(estimate);
  assert.equal(estimate?.amount, '1560');
  assert.match(estimate?.label ?? '', /6%/);
});
