import assert from 'node:assert/strict';
import test from 'node:test';

import { computeAmountFinanced, computeTotalPaidOverLife, estimateMonthlyPayment, roundMoney } from '../utils/finance.ts';

test('roundMoney enforces two-decimal currency precision', () => {
  assert.equal(roundMoney(123.456), 123.46);
  assert.equal(roundMoney(99.994), 99.99);
});

test('computeAmountFinanced sums sale price, fees, and add-ons minus credits', () => {
  const amountFinanced = computeAmountFinanced(25000, 1499, 2500, 3000, 4000);
  assert.equal(amountFinanced, 21999);
});

test('computeAmountFinanced never returns negative financed balances', () => {
  assert.equal(computeAmountFinanced(10000, 0, 0, 12000, 0), 0);
});

test('estimateMonthlyPayment uses standard amortization formula', () => {
  const payment = estimateMonthlyPayment(21999, 6.9, 60);
  assert.equal(payment, 434.57);
});

test('computeTotalPaidOverLife includes down payment in lifetime out-of-pocket total', () => {
  const monthly = estimateMonthlyPayment(21999, 6.9, 60);
  const totalPaid = computeTotalPaidOverLife(monthly, 60, 3000);
  assert.equal(totalPaid, 29074.2);
});
